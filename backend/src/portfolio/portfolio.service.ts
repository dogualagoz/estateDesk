import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { QueryPortfolioDto } from './dto/query-portfolio.dto';

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async list(query: QueryPortfolioDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Prisma.PortfolioWhereInput = { deletedAt: null };

    if (query.type) where.type = query.type;
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

  async get(id: string) {
    const item = await this.prisma.portfolio.findFirst({
      where: { id, deletedAt: null },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    if (!item) throw new NotFoundException('Portfolio not found');
    return item;
  }

  async create(userId: string, dto: CreatePortfolioDto) {
    return this.prisma.portfolio.create({
      data: {
        type: dto.type,
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
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePortfolioDto) {
    await this.get(id);
    return this.prisma.portfolio.update({
      where: { id },
      data: { ...dto },
    });
  }

  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.portfolio.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { success: true };
  }
}
