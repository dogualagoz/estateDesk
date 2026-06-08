import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { OfficeService } from './office.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('offices')
export class OfficeController {
  constructor(private readonly office: OfficeService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOfficeDto) {
    return this.office.createOffice(user, dto);
  }

  @Get('me')
  myOffice(@CurrentUser() user: AuthUser) {
    return this.office.getMyOffice(user);
  }

  @Get('me/members')
  members(@CurrentUser() user: AuthUser) {
    return this.office.listMembers(user);
  }

  @Roles(Role.ADMIN)
  @Post('invites')
  createInvite(@CurrentUser() user: AuthUser, @Body() dto: CreateInviteDto) {
    return this.office.createInvite(user, dto);
  }

  @Roles(Role.ADMIN)
  @Get('invites')
  listInvites(@CurrentUser() user: AuthUser) {
    return this.office.listInvites(user);
  }

  @Roles(Role.ADMIN)
  @Delete('invites/:id')
  revokeInvite(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.office.revokeInvite(user, id);
  }

  @Roles(Role.ADMIN)
  @Delete('members/:id')
  removeMember(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.office.removeMember(user, id);
  }
}
