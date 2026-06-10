import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: false });
  const config = app.get(ConfigService);

  // Nginx arkasında gerçek istemci IP'si (rate limit doğru IP'yi saysın)
  app.set('trust proxy', 1);
  app.use(
    helmet({
      // Swagger UI inline script kullanır; API yanıtlarında CSP'nin pratik değeri yok
      contentSecurityPolicy: false,
      // /uploads görselleri dev'de farklı origin'den (5173) yükleniyor
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  const corsOrigin = config.get<string>('CORS_ORIGIN') ?? 'http://localhost:5173';
  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EstateDesk API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  const port = Number(config.get<string>('PORT')) || 3001;
  await app.listen(port, '0.0.0.0');
  Logger.log(`EstateDesk backend ready on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();
