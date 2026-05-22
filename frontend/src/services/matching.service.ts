import { api } from './api';
import type { MatchCriteria, ScoredPortfolio } from '@/types/matching';

export const matchingService = {
  matchPortfolios: (criteria: MatchCriteria) =>
    api.post<ScoredPortfolio[]>('/matching/portfolios', criteria).then((r) => r.data),
};
