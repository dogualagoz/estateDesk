import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    // Özel exception'ların (örn. AlreadyInOfficeException) taşıdığı `code` gibi ek
    // alanları da istemciye iletir; message/statusCode/path/timestamp/requestId ile çakışmaz.
    let extra: Record<string, unknown> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else {
        const resObj = res as Record<string, unknown>;
        message = (resObj.message as string | undefined) ?? resObj;
        const { message: _m, statusCode: _s, ...rest } = resObj;
        extra = rest;
      }
    } else if (exception instanceof Error) {
      // İç hata detayı istemciye sızdırılmaz; yalnızca loglanır
      this.logger.error(`[${request.requestId}] ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      ...extra,
      path: request.url,
      timestamp: new Date().toISOString(),
      requestId: request.requestId,
    });
  }
}
