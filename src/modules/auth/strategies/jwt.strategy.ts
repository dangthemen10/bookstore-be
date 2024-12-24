import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envConfig } from '@/common/config/env.config';
import { PayloadUserForJwtToken } from '@/common/type/http.types';
import { UserDocument } from '@/modules/users/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel('Users') private userModel: Model<UserDocument>) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.session?.authToken?.accessToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: envConfig().jwt.jwtSecret,
    });
  }

  async validate(payload: PayloadUserForJwtToken): Promise<UserDocument> {
    const user = (await this.userModel
      .findOne({ email: payload.user.email })
      .lean()) as UserDocument;
    return user;
  }
}
