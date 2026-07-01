import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OfficeService } from './office.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { RegisterDto } from '../auth/dto/register.dto';

@Controller('invites')
export class InviteController {
  constructor(private readonly office: OfficeService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.office.previewInvite(token);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':token/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.office.acceptInvite(user, token);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post(':token/register')
  @HttpCode(201)
  registerWithInvite(
    @Param('token') token: string,
    @Body() dto: RegisterDto,
  ) {
    return this.office.registerWithInvite(token, dto);
  }
}
