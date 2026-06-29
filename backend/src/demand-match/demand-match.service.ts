import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import {
  ScoringPortfolio,
  matchScore,
  matchedFeatures,
} from '../matching/matching.scoring';
import { demandToCriteria, type ScoredPortfolio } from '../matching/matching.service';

@Injectable()
export class DemandMatchService {
  constructor(private prisma: PrismaService) {}

  async pin(user: AuthUser, demandId: string, portfolioId: string) {
    const officeId = requireOfficeId(user);

    const demand = await this.prisma.demand.findFirst({
      where: { id: demandId, deletedAt: null, officeId },
    });
    if (!demand) throw new NotFoundException('Talep bulunamadı');

    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, deletedAt: null, officeId },
    });
    if (!portfolio) throw new NotFoundException('Portföy bulunamadı');

    return this.prisma.demandMatch.upsert({
      where: { demandId_portfolioId: { demandId, portfolioId } },
      create: { demandId, portfolioId, officeId, pinnedById: user.id },
      update: {},
    });
  }

  async unpin(user: AuthUser, demandId: string, portfolioId: string) {
    const officeId = requireOfficeId(user);
    const match = await this.prisma.demandMatch.findFirst({
      where: { demandId, portfolioId, officeId },
    });
    if (!match) throw new NotFoundException('Eşleştirme bulunamadı');
    await this.prisma.demandMatch.delete({ where: { id: match.id } });
    return { success: true };
  }

  async listPinned(user: AuthUser, demandId: string): Promise<ScoredPortfolio[]> {
    const officeId = requireOfficeId(user);
    return this.listPinnedForOffice(officeId, demandId);
  }

  /**
   * Bir talebe pinlenen portföyleri skorlayarak döndürür (officeId-parametrik).
   * `listPinned` (auth) ve paylaşılan defter (public) tarafından kullanılır.
   * `publicOnly` true ise silinmiş veya HIDDEN portföyler hariç tutulur.
   */
  async listPinnedForOffice(
    officeId: string,
    demandId: string,
    opts?: { publicOnly?: boolean },
  ): Promise<ScoredPortfolio[]> {
    const demand = await this.prisma.demand.findFirst({
      where: { id: demandId, deletedAt: null, officeId },
    });
    if (!demand) throw new NotFoundException('Talep bulunamadı');

    const matches = await this.prisma.demandMatch.findMany({
      where: {
        demandId,
        officeId,
        ...(opts?.publicOnly
          ? { portfolio: { deletedAt: null, visibility: 'PUBLIC' } }
          : {}),
      },
      include: {
        portfolio: { include: { createdBy: { select: { id: true, fullName: true } } } },
      },
      orderBy: { pinnedAt: 'desc' },
    });

    // Canlı eşleştirme sekmesiyle aynı kriter dönüşümü (tekil ilçe/mahalle fallback'i dahil)
    const criteria = demandToCriteria(demand);

    return matches.map((m) => {
      const row = m.portfolio;
      const price = Number(row.price);
      const scoringInput: ScoringPortfolio = {
        type: row.type,
        listingType: row.listingType,
        city: row.city,
        district: row.district,
        neighborhood: row.neighborhood,
        areaSqm: row.areaSqm,
        roomCount: row.roomCount,
        price,
        features: row.features,
      };
      const result = matchScore(scoringInput, criteria);
      return {
        ...result,
        portfolio: { ...row, price },
        matchedFeatures: matchedFeatures(row.features, criteria),
        isHidden: row.visibility === 'HIDDEN',
      };
    });
  }
}
