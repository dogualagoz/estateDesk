import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { QueryPortfolioDto } from './dto/query-portfolio.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryPortfolioDto) {
    return this.portfolio.list(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.portfolio.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePortfolioDto) {
    return this.portfolio.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolio.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.portfolio.softDelete(user, id);
  }

  @Post(':id/images')
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
  uploadImages(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.portfolio.addImages(user, id, files);
  }

  @Delete(':id/images/:filename')
  deleteImage(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.portfolio.removeImage(user, id, filename);
  }
}
