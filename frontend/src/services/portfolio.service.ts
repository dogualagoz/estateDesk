import { api } from './api';
import type {
  Portfolio,
  CreatePortfolioPayload,
  UpdatePortfolioPayload,
  PortfolioQuery,
} from '@/types/portfolio';
import type { Paginated } from '@/types/common';

export const portfolioService = {
  list: (q: PortfolioQuery = {}) =>
    api.get<Paginated<Portfolio>>('/portfolios', { params: q }).then((r) => r.data),
  get: (id: string) => api.get<Portfolio>(`/portfolios/${id}`).then((r) => r.data),
  create: (payload: CreatePortfolioPayload) =>
    api.post<Portfolio>('/portfolios', payload).then((r) => r.data),
  update: (id: string, payload: UpdatePortfolioPayload) =>
    api.patch<Portfolio>(`/portfolios/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/portfolios/${id}`).then((r) => r.data),
};
