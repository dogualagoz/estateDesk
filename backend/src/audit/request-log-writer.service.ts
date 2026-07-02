import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface RequestLogEntry {
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
  officeId?: string;
  ip?: string;
}

// İstek başına INSERT atmamak için toplu yazım eşikleri
const FLUSH_INTERVAL_MS = 5_000;
const FLUSH_BATCH_SIZE = 50;

/**
 * HTTP istek loglarını bellekte biriktirip toplu (createMany) yazar.
 * RequestLoggerMiddleware her istekte push() çağırır; 5 sn'de bir veya
 * 50 kayıt birikince DB'ye boşaltılır. Tüm hatalar yutulur (warn) —
 * loglama, istek yolunu asla etkilememelidir.
 */
@Injectable()
export class RequestLogWriterService implements OnModuleDestroy {
  private readonly logger = new Logger(RequestLogWriterService.name);
  private buffer: RequestLogEntry[] = [];
  private timer: ReturnType<typeof setInterval>;

  constructor(private prisma: PrismaService) {
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
    // Zamanlayıcı process'in kapanmasını engellemesin
    this.timer.unref?.();
  }

  push(entry: RequestLogEntry): void {
    this.buffer.push(entry);
    if (this.buffer.length >= FLUSH_BATCH_SIZE) void this.flush();
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer;
    this.buffer = [];
    try {
      await this.prisma.requestLog.createMany({ data: batch });
    } catch (err) {
      this.logger.warn(
        `Request log yazılamadı (${batch.length} kayıt): ${(err as Error)?.message ?? err}`,
      );
    }
  }

  /** Uygulama kapanırken bekleyen kayıtları kaybetme. */
  async onModuleDestroy(): Promise<void> {
    clearInterval(this.timer);
    await this.flush();
  }
}
