import { Body, Controller, Get, HttpCode, Post, Param, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, type RequestMeta } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from './decorators/public.decorator';
import { CurrentUser, AuthUser } from './decorators/current-user.decorator';

/** Audit kayıtları için istekten kimlik-dışı meta bilgileri toplar. */
function requestMeta(req: Request): RequestMeta {
  return {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    requestId: req.requestId,
  };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.auth.login(dto, requestMeta(req));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(201)
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.auth.register(dto, requestMeta(req));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('demo')
  demo(@Req() req: Request) {
    return this.auth.demoLogin(requestMeta(req));
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  /**
   * Çıkış — JWT sunucuda tutulmadığından token invalidasyonu yapmaz;
   * yalnızca audit kaydı üretir (analytics: oturum çıkışları görünsün).
   * Token'ı silmek istemcinin sorumluluğudur.
   */
  @HttpCode(200)
  @Post('logout')
  logout(@CurrentUser() user: AuthUser, @Req() req: Request) {
    return this.auth.logout(user, requestMeta(req));
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    return this.auth.requestPasswordReset(dto.email, `${req.protocol}://${req.get('host')}/reset-password`, requestMeta(req));
  }

  @Public()
  @HttpCode(200)
  @Get('reset-password/:token')
  validateResetToken(@Param('token') token: string) {
    return this.auth.validateResetToken(token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post('reset-password/:token')
  resetPassword(@Param('token') token: string, @Body() dto: ResetPasswordDto, @Req() req: Request) {
    return this.auth.resetPassword(token, dto.password, requestMeta(req));
  }
}
