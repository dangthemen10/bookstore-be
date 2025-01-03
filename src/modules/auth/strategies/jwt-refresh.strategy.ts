import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '@modules/auth/modules/auth.service';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envConfig } from '@/common/config/env.config';
import { UserDocument } from '@/modules/users/user.schema';

@Injectable()
export class JwtRefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh-token',
) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.session?.authToken?.refreshToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: envConfig().jwt.jwtRefreshSecret,
      passReqToCallback: true,
    });
  }
  async validate(req: Request): Promise<UserDocument> {
    const refreshToken = req?.session?.authToken?.refreshToken;
    if (!refreshToken) return null;
    const user = await this.authService.getUserFromRefreshToken(refreshToken);
    return user;
  }
}
