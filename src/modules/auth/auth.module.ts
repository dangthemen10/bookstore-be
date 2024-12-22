import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { envConfig } from '@/common/config/env.config';
import { EmailModule } from '@/providers/email/email.module';
import { UserModule } from '../users/user.module';
import { UserRepository } from '../users/user.repository';
import { userSchema } from '../users/user.schema';
import { AuthService } from './modules/auth.service';
import { PasswordService } from './modules/password.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // PassportModule.register({
    //   defaultStrategy: 'jwt',
    //   session: true,
    // }),
    JwtModule.register({
      secret: envConfig().jwt.jwtSecret,
    }),
    UserModule,
    EmailModule,
    MongooseModule.forFeature([{ name: 'Users', schema: userSchema }]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    // JwtStrategy,
    // JwtRefreshTokenStrategy,
    UserRepository,
  ],
  exports: [AuthService, PasswordService, JwtModule, UserRepository],
})
export class AuthModule {}
