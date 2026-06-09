import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';
import { QueryDemandDto } from './dto/query-demand.dto';
import { MatchingService } from '../matching/matching.service';

@Injectable()
export class DemandService {
  constructor(
    private prisma: PrismaService,
    private matching: MatchingService,
  ) {}

  async list(user: AuthUser, query: QueryDemandDto) {
    const officeId = requireOfficeId(user);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const AND: Prisma.DemandWhereInput[] = [{ deletedAt: null, officeId }];

    if (query.createdById) AND.push({ createdById: query.createdById });
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

    // Her talep için en iyi eşleşen portföyü (tek sorguyla) ekle.
    const bestMatches = await this.matching.bestMatchForDemands(officeId, items);
    const itemsWithMatch = items.map((d) => ({
      ...d,
      bestMatch: bestMatches[d.id] ?? null,
    }));

    return { items: itemsWithMatch, total, page, pageSize };
  }

  async get(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const item = await this.prisma.demand.findFirst({
      where: { id, deletedAt: null, officeId },
      include: { createdBy: { select: { id: true, fullName: true } } },
    });
    if (!item) throw new NotFoundException('Demand not found');
    return item;
  }

  async create(user: AuthUser, dto: CreateDemandDto) {
    const officeId = requireOfficeId(user);
    return this.prisma.demand.create({
      data: {
        types: dto.types,
        listingType: dto.listingType ?? 'SALE',
        regions: dto.regions ?? [],
        city: dto.city,
        district: dto.district,
        neighborhood: dto.neighborhood,
        districts: dto.districts ?? [],
        neighborhoods: dto.neighborhoods ?? [],
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
        createdById: user.id,
        officeId,
      },
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateDemandDto) {
    await this.get(user, id);
    return this.prisma.demand.update({ where: { id }, data: { ...dto } });
  }

  async softDelete(user: AuthUser, id: string) {
    await this.get(user, id);
    await this.prisma.demand.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }
}
