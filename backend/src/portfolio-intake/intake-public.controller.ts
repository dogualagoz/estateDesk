import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Throttle } from '@nestjs/throttler';
import { PortfolioIntakeService } from './portfolio-intake.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { Public } from '../auth/decorators/public.decorator';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

/**
 * Mülk sahibinin (üye olmayan) kullandığı public uçlar. Başvuru tek
 * multipart istekte gelir (metin alanları + görseller) — öksüz upload
 * bırakılmaz, istismar yüzeyi küçük kalır.
 */
@Public()
@Controller('intake')
export class IntakePublicController {
  constructor(private readonly intake: PortfolioIntakeService) {}

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':token')
  preview(@Param('token') token: string) {
    return this.intake.getPublicPreview(token);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post(':token/submissions')
  @HttpCode(201)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException('Sadece JPEG, PNG ve WebP yüklenebilir'), false);
      },
      limits: { fileSize: MAX_SIZE },
    }),
  )
  submit(
    @Param('token') token: string,
    @Body() dto: CreateSubmissionDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.intake.createSubmission(token, dto, files ?? []);
  }
}
