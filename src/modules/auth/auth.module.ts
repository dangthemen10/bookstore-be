import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '@modules/auth/auth.controller';
import { AuthService } from '@modules/auth/modules/auth.service';
import { PasswordService } from '@modules/auth/modules/password.service';
import { JwtStrategy } from '@modules/auth/strategies/jwt.strategy';
import { JwtRefreshTokenStrategy } from '@modules/auth/strategies/jwt-refresh.strategy';
import { UserModule } from '@modules/users/user.module';
import { userSchema } from '@modules/users/user.schema';
import { envConfig } from '@/common/config/env.config';
import { EmailModule } from '@/providers/email/email.module';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: true,
    }),
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
    JwtStrategy,
    JwtRefreshTokenStrategy,
  ],
  exports: [AuthService, PasswordService, JwtModule],
})
export class AuthModule {}
