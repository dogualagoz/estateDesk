import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { AdminUsersService } from './admin-users.service';
import { AdminOfficesService } from './admin-offices.service';
import { AdminLogsService } from './admin-logs.service';
import { AdminAnalyticsService } from './admin-analytics.service';
import { AdminFeedbackService } from './admin-feedback.service';
import {
  AdminAnalyticsQueryDto,
  AdminAuditLogsQueryDto,
  AdminOfficesQueryDto,
  AdminPageDto,
  AdminRequestLogsQueryDto,
  AdminTimeseriesQueryDto,
  AdminUsersQueryDto,
} from './dto/admin-query.dto';
import { AdminCreateUserDto, AdminUpdateUserDto } from './dto/admin-user.dto';
import { AdminFeedbackReplyDto, AdminOfficeFeedbackToggleDto } from './dto/admin-feedback.dto';

/**
 * Süper admin uçları — sınıf seviyesinde @Roles(SUPERADMIN):
 * mevcut global RolesGuard zinciri sayesinde ekstra guard gerekmez.
 * ADMIN (ofis yöneticisi) dahil diğer tüm roller 403 alır.
 */
@Roles(Role.SUPERADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly users: AdminUsersService,
    private readonly offices: AdminOfficesService,
    private readonly logs: AdminLogsService,
    private readonly analytics: AdminAnalyticsService,
    private readonly feedback: AdminFeedbackService,
  ) {}

  // ── Genel bakış / analytics / sistem ──
  @Get('overview')
  overview() {
    return this.analytics.overview();
  }

  @Get('analytics/summary')
  summary(@Query() query: AdminAnalyticsQueryDto) {
    return this.analytics.summary(query.days ?? 30);
  }

  @Get('analytics/timeseries')
  timeseries(@Query() query: AdminTimeseriesQueryDto) {
    return this.analytics.timeseries(query.metric, query.days ?? 30);
  }

  @Get('system')
  system() {
    return this.analytics.system();
  }

  // ── Kullanıcılar ──
  @Get('users')
  listUsers(@Query() query: AdminUsersQueryDto) {
    return this.users.list(query);
  }

  @Post('users')
  createUser(@CurrentUser() admin: AuthUser, @Body() dto: AdminCreateUserDto) {
    return this.users.create(admin, dto);
  }

  @Patch('users/:id')
  updateUser(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminUpdateUserDto,
  ) {
    return this.users.update(admin, id, dto);
  }

  /** DELETE = deaktive (hard delete yapılmaz; bkz. AdminUsersService.deactivate). */
  @Delete('users/:id')
  deactivateUser(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.users.deactivate(admin, id);
  }

  // ── Ofisler ──
  @Get('offices')
  listOffices(@Query() query: AdminOfficesQueryDto) {
    return this.offices.list(query);
  }

  @Get('offices/:id')
  getOffice(@Param('id') id: string) {
    return this.offices.get(id);
  }

  /** DELETE = ofisin tüm üyelerini deaktive etme (veri korunur). */
  @Delete('offices/:id')
  deactivateOffice(@CurrentUser() admin: AuthUser, @Param('id') id: string) {
    return this.offices.deactivate(admin, id);
  }

  @Patch('offices/:id/feedback')
  toggleOfficeFeedback(
    @CurrentUser() admin: AuthUser,
    @Param('id') id: string,
    @Body() dto: AdminOfficeFeedbackToggleDto,
  ) {
    return this.feedback.toggleOffice(admin, id, dto.enabled);
  }

  // ── Geri bildirim sohbetleri ──
  @Get('feedback/threads')
  feedbackThreads(@Query() query: AdminPageDto) {
    return this.feedback.listThreads(query);
  }

  @Get('feedback/unread')
  feedbackUnread() {
    return this.feedback.unreadTotal();
  }

  @Get('feedback/threads/:officeId/messages')
  feedbackMessages(@Param('officeId') officeId: string) {
    return this.feedback.listMessages(officeId);
  }

  @Post('feedback/threads/:officeId/messages')
  feedbackReply(
    @CurrentUser() admin: AuthUser,
    @Param('officeId') officeId: string,
    @Body() dto: AdminFeedbackReplyDto,
  ) {
    return this.feedback.reply(admin, officeId, dto.body);
  }

  @Post('feedback/threads/:officeId/read')
  feedbackMarkRead(@Param('officeId') officeId: string) {
    return this.feedback.markRead(officeId);
  }

  // ── Loglar ──
  @Get('logs/requests')
  requestLogs(@Query() query: AdminRequestLogsQueryDto) {
    return this.logs.requestLogs(query);
  }

  @Get('logs/audit')
  auditLogs(@Query() query: AdminAuditLogsQueryDto) {
    return this.logs.auditLogs(query);
  }
}
