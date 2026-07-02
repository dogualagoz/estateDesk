import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

// Varsayılan saklama süreleri (gün); env ile ezilebilir
const DEFAULT_REQUEST_LOG_DAYS = 30;
const DEFAULT_AUDIT_LOG_DAYS = 365;

/**
 * Log tablolarının sınırsız büyümesini önleyen gece temizliği.
 * Her gece 04:00'te (sunucu saati) eşiği aşan kayıtları siler.
 * pg partition bu hacimde gereksiz — tek deleteMany + createdAt indeksi yeterli.
 */
@Injectable()
export class LogRetentionService {
  private readonly logger = new Logger(LogRetentionService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  @Cron('0 4 * * *')
  async cleanup(): Promise<void> {
    const requestDays = Number(
      this.config.get('REQUEST_LOG_RETENTION_DAYS') ?? DEFAULT_REQUEST_LOG_DAYS,
    );
    const auditDays = Number(this.config.get('AUDIT_LOG_RETENTION_DAYS') ?? DEFAULT_AUDIT_LOG_DAYS);

    const cutoff = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    try {
      const [req, audit] = await this.prisma.$transaction([
        this.prisma.requestLog.deleteMany({ where: { createdAt: { lt: cutoff(requestDays) } } }),
        this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff(auditDays) } } }),
      ]);
      if (req.count || audit.count) {
        this.logger.log(`Retention: ${req.count} request log, ${audit.count} audit log silindi`);
      }
    } catch (err) {
      this.logger.warn(`Retention temizliği başarısız: ${(err as Error)?.message ?? err}`);
    }
  }
}
