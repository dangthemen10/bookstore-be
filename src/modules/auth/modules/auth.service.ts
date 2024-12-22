import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  LoginUserDto,
  RegisterUserDto,
  ResetPasswordDto,
} from '@modules/auth/dto';
import { PasswordService } from '@modules/auth/modules/password.service';
import { envConfig } from '@/common/config/env.config';
import {
  DataStoredFromToken,
  PayloadUserForJwtToken,
  SessionAuthToken,
  UserFromRequest,
} from '@/common/type/http.types';
import { UserRepository } from '@/modules/users/user.repository';
import { emailRegex, UserDocument } from '@/modules/users/user.schema';
import { EmailService } from '@/providers/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService,
    private readonly userRepository: UserRepository,
  ) {}

  public async getUserFromToken(token: string): Promise<UserDocument | null> {
    const decoded: DataStoredFromToken =
      await this.jwtService.verifyAsync(token);
    if (!decoded || !decoded?.user) return null;
    const { user } = decoded;
    const realUser: UserDocument = await this.userRepository.findByEmail(
      user.email,
    );
    if (!realUser) return null;
    return realUser;
  }

  public async register(input: RegisterUserDto): Promise<{ token: string }> {
    // just send token to email
    const payload: PayloadUserForJwtToken = {
      user: { ...input },
    };
    const emailToken = this.jwtService.sign(payload);
    await this.emailService.sendEmailConfirmation(input.email, emailToken);

    return {
      token: emailToken,
    };
  }

  public async activateAccount(token: string): Promise<UserDocument> {
    if (!token) return null;
    const decoded: DataStoredFromToken =
      await this.jwtService.verifyAsync(token);
    if (!decoded || !decoded.user) return null;
    const { user } = decoded;
    const newUser = await this.userRepository.createUser(user);
    await this.emailService.sendWelcome(newUser.email);
    return newUser;
  }

  public async generateAuthToken(
    payload: PayloadUserForJwtToken,
  ): Promise<SessionAuthToken> {
    const envJwt = envConfig().jwt;
    const expiredTime = envJwt.jwtExpiredTime;
    const refreshExpiredTime = envJwt.jwtRefreshExpiredTime;

    const sessionAuthToken: SessionAuthToken = {
      authToken: {
        accessToken: await this.jwtService.signAsync(payload, {
          expiresIn: expiredTime,
        }),
        refreshToken: await this.jwtService.signAsync(payload, {
          expiresIn: refreshExpiredTime,
        }),
      },
    };
    return sessionAuthToken;
  }

  public async resetCurrentHashedRefreshToken(
    id: string,
    refreshToken: string,
  ): Promise<UserDocument> {
    const currentHashedRefreshToken =
      await this.passwordService.hash(refreshToken);
    const user = await this.userRepository.findByIdAndUpdateUser(
      id,
      currentHashedRefreshToken,
    );
    return user;
  }

  public async resetPassword(input: ResetPasswordDto) {
    const { token, newPassword } = input;
    const decoded: DataStoredFromToken =
      await this.jwtService.verifyAsync(token);
    if (!decoded) {
      throw new UnauthorizedException('Token invalid or missing');
    }
    const { user } = decoded;
    const realUser = await this.userRepository.findOneAndSelectPaasword(
      { email: user.email },
      true,
    );

    if (!realUser) {
      throw new UnauthorizedException(`Can not find user with token given`);
    }

    const hash = await this.passwordService.hash(newPassword);
    const updated = await this.userRepository.findByIdAndUpdatePassword(
      realUser._id,
      hash,
    );
    return updated;
  }

  public async forgotPassword(email: string) {
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw new BadRequestException(`Not user found with email: ${email}`);
    }
    const payload: PayloadUserForJwtToken = {
      user: {
        email,
      },
    };
    const token = await this.jwtService.signAsync(payload);
    await this.emailService.sendResetPassword(email, token);
    return {
      token,
    };
  }

  public async resetAccessToken(
    payload: PayloadUserForJwtToken,
  ): Promise<string> {
    const expiredTime = envConfig().jwt.jwtExpiredTime;
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: expiredTime,
    });
    return accessToken;
  }

  public async getUserFromRefreshToken(
    refreshToken: string,
  ): Promise<UserDocument | null> {
    if (!refreshToken) return null;
    const decoded: DataStoredFromToken =
      await this.jwtService.verifyAsync(refreshToken);
    const userReq: UserFromRequest = decoded.user;
    if (!decoded || !userReq) return null;
    const user: UserDocument =
      await this.userRepository.findOneAndSelectCurrentHashedRefreshToken(
        userReq.email,
      );
    if (!user) return null;
    const isRefreshTokenMatching = await this.passwordService.verify(
      user.currentHashedRefreshToken,
      refreshToken,
    );

    if (!isRefreshTokenMatching) return null;
    return user;
  }

  public async validateUser(input: LoginUserDto): Promise<UserDocument | null> {
    const { usernameOrEmail, password } = input;
    const isEmail = emailRegex.test(usernameOrEmail);
    let user: UserDocument;
    if (isEmail) {
      user = await this.userRepository.findOneAndSelectPaasword(
        {
          email: usernameOrEmail,
        },
        true,
      );
    } else {
      user = await this.userRepository.findOneAndSelectPaasword(
        {
          username: usernameOrEmail,
        },
        true,
      );
    }

    if (!user) return null;
    const isMatch = await this.passwordService.verify(user.password, password);
    if (!isMatch) return null;
    return user;
  }
}
