import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuditAction } from './audit-actions';

export interface AuditEntry {
  action: AuditAction;
  userId?: string | null;
  officeId?: string | null;
  targetType?: string;
  targetId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Prisma.InputJsonValue;
  requestId?: string;
}

/**
 * Denetim kaydı yazıcısı. Kayıt "fire-and-forget"tir: await edilmez,
 * hata isteği asla etkilemez (yalnızca warn loglanır). Denetim kaydının
 * yazılamaması, kullanıcının işleminin başarısız olmasından daha az kötüdür.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  log(entry: AuditEntry): void {
    void this.prisma.auditLog
      .create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          officeId: entry.officeId ?? null,
          targetType: entry.targetType,
          targetId: entry.targetId,
          ip: entry.ip,
          userAgent: entry.userAgent,
          metadata: entry.metadata,
          requestId: entry.requestId,
        },
      })
      .catch((err) => this.logger.warn(`Audit kaydı yazılamadı: ${err?.message ?? err}`));
  }
}
