import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { DemandShareService } from './demand-share.service';
import { CreateShareDto } from './dto/create-share.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class DemandShareController {
  constructor(private readonly service: DemandShareService) {}

  // ── Auth: ofis kapsamlı defter yönetimi ──
  @Get('demand/:demandId/shares')
  listShares(@CurrentUser() user: AuthUser, @Param('demandId') demandId: string) {
    return this.service.listShares(user, demandId);
  }

  @Post('demand/:demandId/shares')
  @HttpCode(201)
  createShare(
    @CurrentUser() user: AuthUser,
    @Param('demandId') demandId: string,
    @Body() dto: CreateShareDto,
  ) {
    return this.service.createShare(user, demandId, dto);
  }

  @Delete('demand/:demandId/shares/:shareId')
  @HttpCode(200)
  revokeShare(
    @CurrentUser() user: AuthUser,
    @Param('demandId') demandId: string,
    @Param('shareId') shareId: string,
  ) {
    return this.service.revokeShare(user, demandId, shareId);
  }

  // ── Public: ziyaretçi defter görüntüleme ──
  @Public()
  @Get('shared/:token')
  getPublicCollection(@Param('token') token: string) {
    return this.service.getPublicCollection(token);
  }
}
