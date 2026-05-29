import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { QuerySearchDto, SearchScope } from './dto/query-search.dto';

// Aranabilir tüm alanların birleştirilip unaccent+lower ile normalize edildiği "arama metni".
const PORTFOLIO_DOC = Prisma.raw(
  `unaccent(lower(coalesce(title,'') || ' ' || city || ' ' || district || ' ' || ` +
    `coalesce(neighborhood,'') || ' ' || coalesce(note,'') || ' ' || "ownerName" || ' ' || ` +
    `"roomCount" || ' ' || array_to_string(features, ' ')))`,
);
const PORTFOLIO_PHONE = Prisma.raw(`"ownerPhone"`);

const DEMAND_DOC = Prisma.raw(
  `unaccent(lower(coalesce(note,'') || ' ' || "customerName" || ' ' || ` +
    `array_to_string(regions, ' ') || ' ' || array_to_string("roomPreferences", ' ') || ' ' || ` +
    `array_to_string("featurePrefs", ' ') || ' ' || array_to_string(types::text[], ' ')))`,
);
const DEMAND_PHONE = Prisma.raw(`"customerPhone"`);

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(user: AuthUser, query: QuerySearchDto) {
    const officeId = requireOfficeId(user);
    const limit = query.limit ?? 8;
    const scope: SearchScope = query.scope ?? 'all';
    const terms = query.q.trim().split(/\s+/).filter(Boolean);

    if (terms.length === 0) {
      return { portfolios: [], demands: [], counts: { portfolios: 0, demands: 0 } };
    }

    const portfolioWhere = this.buildWhere(terms, PORTFOLIO_DOC, PORTFOLIO_PHONE);
    const demandWhere = this.buildWhere(terms, DEMAND_DOC, DEMAND_PHONE);

    const runPortfolio = scope !== 'demand';
    const runDemand = scope !== 'portfolio';

    const [portfolios, demands, pCount, dCount] = await Promise.all([
      runPortfolio
        ? this.prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT * FROM "Portfolio"
            WHERE "deletedAt" IS NULL AND "officeId" = ${officeId} AND ${portfolioWhere}
            ORDER BY "createdAt" DESC LIMIT ${limit}`)
        : Promise.resolve([]),
      runDemand
        ? this.prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT * FROM "Demand"
            WHERE "deletedAt" IS NULL AND "officeId" = ${officeId} AND ${demandWhere}
            ORDER BY "createdAt" DESC LIMIT ${limit}`)
        : Promise.resolve([]),
      runPortfolio
        ? this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
            SELECT COUNT(*)::int AS count FROM "Portfolio"
            WHERE "deletedAt" IS NULL AND "officeId" = ${officeId} AND ${portfolioWhere}`)
        : Promise.resolve([{ count: 0 }]),
      runDemand
        ? this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
            SELECT COUNT(*)::int AS count FROM "Demand"
            WHERE "deletedAt" IS NULL AND "officeId" = ${officeId} AND ${demandWhere}`)
        : Promise.resolve([{ count: 0 }]),
    ]);

    return {
      portfolios,
      demands,
      counts: { portfolios: pCount[0]?.count ?? 0, demands: dCount[0]?.count ?? 0 },
    };
  }

  // Her terim AND'lenir: metin alanlarında (unaccent) eşleşme VEYA rakam terimiyse telefonda eşleşme.
  private buildWhere(terms: string[], doc: Prisma.Sql, phone: Prisma.Sql): Prisma.Sql {
    const conditions = terms.map((term) => {
      const like = `%${term}%`;
      const digits = term.replace(/\D/g, '');
      if (digits.length > 0) {
        const digitLike = `%${digits}%`;
        return Prisma.sql`(${doc} LIKE unaccent(lower(${like})) OR regexp_replace(${phone}, '[^0-9]', '', 'g') LIKE ${digitLike})`;
      }
      return Prisma.sql`(${doc} LIKE unaccent(lower(${like})))`;
    });
    return Prisma.join(conditions, ' AND ');
  }
}
