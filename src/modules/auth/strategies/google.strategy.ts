import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { RegisterUserDto } from '@modules/auth/dto';
import { Model } from 'mongoose';
import { Profile, Strategy } from 'passport-facebook';
import { envConfig } from '@/common/config/env.config';
import { UserDocument } from '@/modules/users/user.schema';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(@InjectModel('Users') private userModel: Model<UserDocument>) {
    super({
      clientId: envConfig().auth.googleAppId,
      clientSecret: envConfig().auth.googleAppSecret,
      callbackURL: '/auth/google/callback',
      scope: 'email',
      profileFields: ['emails', 'displayName', 'photos'],
    });
  }

  public async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (err: any, user?: any, info?: any) => void,
  ): Promise<any> {
    const { email } = profile._json;
    let existingUser = null;
    if (email) {
      existingUser = await this.userModel.findOne({ email }).lean();
    } else {
      existingUser = await this.userModel
        .findOne({ googleId: profile.id })
        .lean();
    }
    if (existingUser) {
      return done(null, existingUser);
    }
    try {
      const input: RegisterUserDto = {
        username: profile.displayName,
        googleId: profile.id,
        email: profile._json.email || '',
        thumbnail: profile.photos[0].value || '',
      };
      const newUser = await this.userModel.create(input);

      done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }
}
