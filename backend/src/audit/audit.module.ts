import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { RequestLogWriterService } from './request-log-writer.service';
import { LogRetentionService } from './log-retention.service';

/**
 * Denetim/loglama altyapısı. @Global: AuditService hemen her modülde
 * (auth, office, users, admin) kullanıldığından her yerde import
 * zorunluluğu yaratmamak için global sağlanır.
 */
@Global()
@Module({
  providers: [AuditService, RequestLogWriterService, LogRetentionService],
  exports: [AuditService, RequestLogWriterService],
})
export class AuditModule {}
