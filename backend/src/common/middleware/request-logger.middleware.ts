import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestLogWriterService } from '../../audit/request-log-writer.service';

// Kalıcı kayda değer olmayan gürültü yolları (stdout'a da yazılmaz zaten anlamlı değiller)
const SKIP_DB_LOG_PREFIXES = ['/health', '/uploads'];

/**
 * Her isteği iki hedefe loglar:
 * 1) stdout — tek satır JSON (docker logs / log toplayıcılar için)
 * 2) RequestLog tablosu — admin panelde sorgulanabilir kalıcı kayıt
 *    (buffered/batched; istek yolunu asla bloklamaz)
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  constructor(private readonly writer: RequestLogWriterService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
      const user = (req as any).user;
      const entry = {
        // requestId middleware'i her istekte set eder; tip gereği fallback
        requestId: req.requestId ?? '',
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: Math.round(durationMs),
        userId: user?.id,
        officeId: user?.officeId,
      };

      this.logger.log(JSON.stringify(entry));

      // Kalıcı kayıt — health/uploads gürültüsü hariç
      if (!SKIP_DB_LOG_PREFIXES.some((p) => entry.path.startsWith(p))) {
        this.writer.push({ ...entry, ip: req.ip });
      }
    });

    next();
  }
}
