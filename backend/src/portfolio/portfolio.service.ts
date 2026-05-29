import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { QueryPortfolioDto } from './dto/query-portfolio.dto';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async list(user: AuthUser, query: QueryPortfolioDto) {
    const officeId = requireOfficeId(user);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PortfolioWhereInput = { deletedAt: null, officeId };

    if (query.createdById) where.createdById = query.createdById;
    if (query.type) where.type = query.type;
    if (query.listingType) where.listingType = query.listingType;
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.district) where.district = { equals: query.district, mode: 'insensitive' };
    if (query.roomCount) where.roomCount = query.roomCount;
    if (query.visibility) where.visibility = query.visibility;
    if (query.feature) where.features = { has: query.feature };

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) (where.price as any).gte = query.minPrice;
      if (query.maxPrice !== undefined) (where.price as any).lte = query.maxPrice;
    }

    if (query.q && query.q.trim().length > 0) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
        { neighborhood: { contains: q, mode: 'insensitive' } },
        { note: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.portfolio.count({ where }),
      this.prisma.portfolio.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { createdBy: { select: { id: true, fullName: true } } },
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async get(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const item = await this.prisma.portfolio.findFirst({
      where: { id, deletedAt: null, officeId },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    if (!item) throw new NotFoundException('Portfolio not found');
    return item;
  }

  async create(user: AuthUser, dto: CreatePortfolioDto) {
    const officeId = requireOfficeId(user);
    return this.prisma.portfolio.create({
      data: {
        type: dto.type,
        listingType: dto.listingType ?? 'SALE',
        title: dto.title,
        city: dto.city,
        district: dto.district,
        neighborhood: dto.neighborhood,
        areaSqm: dto.areaSqm,
        roomCount: dto.roomCount,
        price: dto.price,
        features: dto.features ?? [],
        visibility: dto.visibility ?? 'PUBLIC',
        note: dto.note,
        ownerName: dto.ownerName,
        ownerPhone: dto.ownerPhone,
        createdById: user.id,
        officeId,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdatePortfolioDto) {
    await this.get(user, id);
    return this.prisma.portfolio.update({
      where: { id },
      data: { ...dto },
    });
  }

  async softDelete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.prisma.portfolio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }

  async addImages(user: AuthUser, id: string, files: Express.Multer.File[]) {
    const item = await this.get(user, id);
    const dir = path.join('/app/uploads/portfolio', id);
    fs.mkdirSync(dir, { recursive: true });

    const newUrls: string[] = [];
    for (const file of files) {
      const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}.webp`;
      const dest = path.join(dir, filename);
      await sharp(file.buffer)
        .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toFile(dest);
      newUrls.push(`/uploads/portfolio/${id}/${filename}`);
    }

    return this.prisma.portfolio.update({
      where: { id },
      data: { images: { set: [...item.images, ...newUrls] } },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }

  async removeImage(user: AuthUser, id: string, filename: string) {
    const item = await this.get(user, id);
    const url = `/uploads/portfolio/${id}/${filename}`;
    const filePath = path.join('/app/uploads/portfolio', id, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return this.prisma.portfolio.update({
      where: { id },
      data: { images: { set: item.images.filter((img) => img !== url) } },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
  }
}
