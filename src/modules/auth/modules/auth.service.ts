import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { envConfig } from '@/common/config/env.config';
import {
  DataStoredFromToken,
  PayloadUserForJwtToken,
  SessionAuthToken,
} from '@/common/type/http.types';
import { UserRepository } from '@/modules/users/user.repository';
import { UserDocument } from '@/modules/users/user.schema';
import { EmailService } from '@/providers/email/email.service';
import { RegisterUserDto } from '../dto/register-user.dto';
import { PasswordService } from './password.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly passwordService: PasswordService,
    private readonly userRepository: UserRepository,
  ) {}

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
}
