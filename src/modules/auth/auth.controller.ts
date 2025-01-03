import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  LoginUserDto,
  RegisterUserDto,
  RequestForgotPasswordInput,
  ResetPasswordDto,
} from '@modules/auth/dto';
import { JwtAuth, JwtRefreshTokenGuard } from '@modules/auth/guards';
import { AuthService } from '@modules/auth/modules/auth.service';
import type { Request } from 'express';
import { SESSION_AUTH_KEY } from '@/common/config/session.config';
import { SessionAuthToken, UserFromRequest } from '@/common/type/http.types';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get()
  public async me(@Req() req: Request) {
    const token = req?.session?.authToken?.accessToken;
    if (!token) return null;
    const user = await this.authService.getUserFromToken(token);
    return user;
  }

  @Post('login')
  public async login(@Body() input: LoginUserDto, @Req() req: Request) {
    const user = await this.authService.validateUser(input);

    if (!user) {
      throw new BadRequestException('Invalid credentials');
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

  @JwtAuth()
  @Delete()
  public async logout(@Req() req: Request) {
    try {
      req.session?.destroy();
      req.res?.clearCookie(SESSION_AUTH_KEY);
      return { logout: true, error: null };
    } catch (error) {
      return { logout: false, error: error.message };
    }
  }

  @UseGuards(JwtRefreshTokenGuard)
  @Post('refresh')
  public async refreshToken(@Req() req: Request) {
    const user = req.user as UserFromRequest;
    if (!user) throw new UnauthorizedException();
    const newAccessToken = await this.authService.resetAccessToken({ user });
    const { authToken } = req.session;
    authToken.accessToken = newAccessToken;
    req.session.authToken = authToken;

    return { authToken };
  }

  // Using for auto refresh token with fetch API
  @Post('auto-refresh')
  public async autoRefreshToken(
    @Req() req: Request,
  ): Promise<SessionAuthToken | null> {
    const authToken = req?.session?.authToken;
    if (!authToken || !authToken?.accessToken || !authToken?.refreshToken)
      return null;

    const { accessToken, refreshToken } = authToken;
    const user = await this.authService.getUserFromToken(accessToken);
    // Check if accessToken still valid, no need refresh token
    if (user) return { authToken };
    const moreCheck =
      await this.authService.getUserFromRefreshToken(refreshToken);

    // If refresh token is not valid, return null
    if (!moreCheck) return null;

    // Auto refresh, generate new accessToken
    const newAccessToken = await this.authService.resetAccessToken({
      user: user as UserFromRequest,
    });
    const newAuthToken = req.session.authToken;
    newAuthToken.accessToken = newAccessToken;

    req.session.authToken = newAuthToken;
    return { authToken: newAuthToken };
  }

  @Post('forgot-password')
  public async forgotPassword(@Body() input: RequestForgotPasswordInput) {
    try {
      return await this.authService.forgotPassword(input.email);
    } catch (error) {
      throw error;
    }
  }

  @Post('reset-password')
  public async resetPassword(
    @Body() input: ResetPasswordDto,
    @Req() req: Request,
  ) {
    try {
      const user = await this.authService.resetPassword(input);
      await this.logout(req);
      return user;
    } catch (error) {
      throw error;
    }
  }
}
