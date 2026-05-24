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
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
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
  list(@Query() query: QueryPortfolioDto) {
    return this.portfolio.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.portfolio.get(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePortfolioDto) {
    return this.portfolio.create(user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolio.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portfolio.softDelete(id);
  }

  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          const dir = `/app/uploads/portfolio/${req.params.id}`;
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
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
    return this.portfolio.addImages(id, user.id, files);
  }

  @Delete(':id/images/:filename')
  deleteImage(
    @Param('id') id: string,
    @Param('filename') filename: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.portfolio.removeImage(id, user.id, filename);
  }
}
