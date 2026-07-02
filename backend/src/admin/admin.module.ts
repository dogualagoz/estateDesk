import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminOfficesService } from './admin-offices.service';
import { AdminLogsService } from './admin-logs.service';
import { AdminAnalyticsService } from './admin-analytics.service';

/**
 * Süper admin (platform sahibi) modülü. Diğer modüllerden hiçbir servis
 * import etmez (PrismaModule ve AuditModule global) — bağımsız kalması,
 * ileride admin.emlakdefter.com'a ayrıştırmayı kolaylaştırır.
 */
@Module({
  controllers: [AdminController],
  providers: [AdminUsersService, AdminOfficesService, AdminLogsService, AdminAnalyticsService],
})
export class AdminModule {}
