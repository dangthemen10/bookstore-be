import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import {
  LoginUserDto,
  RegisterUserDto,
  ResetPasswordDto,
} from '@modules/auth/dto';
import { PasswordService } from '@modules/auth/modules/password.service';
import { Model } from 'mongoose';
import { envConfig } from '@/common/config/env.config';
import {
  DataStoredFromToken,
  PayloadUserForJwtToken,
  SessionAuthToken,
  UserFromRequest,
} from '@/common/type/http.types';
import { emailRegex, UserDocument } from '@/modules/users/user.schema';
import { EmailService } from '@/providers/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('Users') private userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService,
  ) {}

  public async getUserFromToken(token: string): Promise<UserDocument | null> {
    const decoded: DataStoredFromToken =
      await this.jwtService.verifyAsync(token);
    if (!decoded || !decoded?.user) return null;
    const { user } = decoded;
    const realUser = (await this.userModel
      .findOne({ email: user.email })
      .lean()) as UserDocument;
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
    const newUser = await this.userModel.create(user);
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
    const user = (await this.userModel
      .findByIdAndUpdate(id, {
        currentHashedRefreshToken,
      })
      .lean()) as UserDocument;
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
    const realUser = (await this.userModel
      .findOne({ email: user.email })
      .select('+password')
      .lean()) as UserDocument;

    if (!realUser) {
      throw new UnauthorizedException(`Can not find user with token given`);
    }

    const hash = await this.passwordService.hash(newPassword);
    const updated = (await this.userModel
      .findByIdAndUpdate(realUser._id, { password: hash })
      .lean()) as UserDocument;
    return updated;
  }

  public async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email }).lean();
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

    const user = (await this.userModel
      .findOne({ email: userReq.email })
      .select('+currentHashedRefreshToken')
      .lean()) as UserDocument;
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
      user = (await this.userModel
        .findOne({ email: usernameOrEmail })
        .select('+password')
        .lean()) as UserDocument;
    } else {
      user = (await this.userModel
        .findOne({ username: usernameOrEmail })
        .select('+password')
        .lean()) as UserDocument;
    }

    if (!user) return null;
    const isMatch = await this.passwordService.verify(user.password, password);
    if (!isMatch) return null;
    return user;
  }
}
