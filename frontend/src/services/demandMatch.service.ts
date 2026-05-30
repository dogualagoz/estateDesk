import { api } from './api';
import type { ScoredPortfolio } from '@/types/matching';

export const demandMatchService = {
  listPinned: (demandId: string) =>
    api.get<ScoredPortfolio[]>(`/demand/${demandId}/matches`).then((r) => r.data),

  pin: (demandId: string, portfolioId: string) =>
    api.post(`/demand/${demandId}/matches`, { portfolioId }).then((r) => r.data),

  unpin: (demandId: string, portfolioId: string) =>
    api.delete(`/demand/${demandId}/matches/${portfolioId}`).then((r) => r.data),
};
