import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envConfig } from '@/common/config/env.config';
import { PayloadUserForJwtToken } from '@/common/type/http.types';
import { UserRepository } from '@/modules/users/user.repository';
import { UserDocument } from '@/modules/users/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.session?.authToken?.accessToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: envConfig().jwt.jwtSecret,
    });
  }

  async validate(payload: PayloadUserForJwtToken): Promise<UserDocument> {
    const user: UserDocument = await this.userRepository.findByEmail(
      payload.user.email,
    );
    return user;
  }
}
