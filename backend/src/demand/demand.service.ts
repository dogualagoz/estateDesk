import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';
import { QueryDemandDto } from './dto/query-demand.dto';

@Injectable()
export class DemandService {
  constructor(private prisma: PrismaService) {}

  async list(query: QueryDemandDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const AND: Prisma.DemandWhereInput[] = [{ deletedAt: null }];

    if (query.type) AND.push({ types: { has: query.type } });
    if (query.region) AND.push({ regions: { has: query.region } });
    if (query.roomPreference) AND.push({ roomPreferences: { has: query.roomPreference } });
    if (query.status) AND.push({ status: query.status });

    // Budget overlap: demand[min..max] overlaps with query[min..max]
    if (query.minBudget !== undefined) {
      AND.push({
        OR: [{ maxBudget: null }, { maxBudget: { gte: query.minBudget } }],
      });
    }
    if (query.maxBudget !== undefined) {
      AND.push({
        OR: [{ minBudget: null }, { minBudget: { lte: query.maxBudget } }],
      });
    }

    if (query.q && query.q.trim().length > 0) {
      const q = query.q.trim();
      AND.push({
        OR: [
          { note: { contains: q, mode: 'insensitive' } },
          { customerName: { contains: q, mode: 'insensitive' } },
        ],
      });
    }

    const where: Prisma.DemandWhereInput = { AND };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.demand.count({ where }),
      this.prisma.demand.findMany({
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
    const item = await this.prisma.demand.findFirst({
      where: { id, deletedAt: null },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    if (!item) throw new NotFoundException('Demand not found');
    return item;
  }

  async create(userId: string, dto: CreateDemandDto) {
    return this.prisma.demand.create({
      data: {
        types: dto.types,
        listingType: dto.listingType ?? 'SALE',
        regions: dto.regions ?? [],
        city: dto.city,
        district: dto.district,
        neighborhood: dto.neighborhood,
        minBudget: dto.minBudget,
        maxBudget: dto.maxBudget,
        roomPreferences: dto.roomPreferences ?? [],
        minArea: dto.minArea,
        maxArea: dto.maxArea,
        featurePrefs: dto.featurePrefs ?? [],
        mustHaveFeatures: dto.mustHaveFeatures ?? [],
        bonusFeatures: dto.bonusFeatures ?? [],
        note: dto.note,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        status: dto.status ?? 'ACTIVE',
        createdById: userId,
      },
    });
  }

  async update(id: string, dto: UpdateDemandDto) {
    await this.get(id);
    return this.prisma.demand.update({ where: { id }, data: { ...dto } });
  }

  async softDelete(id: string) {
    await this.get(id);
    await this.prisma.demand.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
