import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { UserFromRequest } from '@/common/type/http.types';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthService } from './modules/auth.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  public async register(@Body() input: RegisterUserDto) {
    return await this.authService.register(input);
  }

  @Get('activate')
  public async activate(@Query('token') token: string, @Req() req: Request) {
    const user = await this.authService.activateAccount(token);
    if (!user) {
      throw new BadRequestException('Token invalid or missing');
    }
    const { authToken } = await this.authService.generateAuthToken({
      user: user as UserFromRequest,
    });
    await this.authService.resetCurrentHashedRefreshToken(
      user._id as string,
      authToken.refreshToken,
    );
    req.user = user;
    req.session.authToken = authToken;
    return { authToken };
  }
}
