import { Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { OfficeService } from './office.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('invites')
export class InviteController {
  constructor(private readonly office: OfficeService) {}

  @Public()
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.office.previewInvite(token);
  }

  @Post(':token/accept')
  @HttpCode(200)
  accept(@CurrentUser() user: AuthUser, @Param('token') token: string) {
    return this.office.acceptInvite(user, token);
  }
}
