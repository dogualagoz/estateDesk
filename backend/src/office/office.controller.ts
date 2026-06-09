import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { Role } from '@prisma/client';
import { OfficeService } from './office.service';
import { CreateOfficeDto } from './dto/create-office.dto';
import { CreateInviteDto } from './dto/create-invite.dto';
import { UpdateOfficeDto } from './dto/update-office.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { ExportQueryDto, ExportFormat } from './dto/export-query.dto';
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

  @Roles(Role.ADMIN)
  @Patch('me')
  updateOffice(@CurrentUser() user: AuthUser, @Body() dto: UpdateOfficeDto) {
    return this.office.updateOffice(user, dto);
  }

  @Get('me/members')
  members(@CurrentUser() user: AuthUser) {
    return this.office.listMembers(user);
  }

  @Roles(Role.ADMIN)
  @Patch('members/:id/role')
  changeMemberRole(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.office.changeMemberRole(user, id, dto.role);
  }

  @Roles(Role.ADMIN)
  @Get('export')
  async exportData(
    @CurrentUser() user: AuthUser,
    @Query() query: ExportQueryDto,
    @Res() res: Response,
  ) {
    const format = query.format ?? ExportFormat.XLSX;
    const { buffer, filename, contentType } = await this.office.exportData(
      user,
      query.dataset,
      format,
      query.memberId,
    );
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"`,
    );
    res.send(buffer);
  }

  @Roles(Role.ADMIN)
  @Get('invite-link')
  getInviteLink(@CurrentUser() user: AuthUser) {
    return this.office.getInviteLink(user);
  }

  @Roles(Role.ADMIN)
  @Post('invite-link/reset')
  resetInviteLink(@CurrentUser() user: AuthUser) {
    return this.office.resetInviteLink(user);
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

  @Delete('leave')
  leaveOffice(@CurrentUser() user: AuthUser) {
    return this.office.leaveOffice(user);
  }
}
