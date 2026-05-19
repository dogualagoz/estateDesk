import { api } from './api';
import type { Portfolio } from '@/types/portfolio';
import type { Demand } from '@/types/demand';

export interface DashboardStats {
  portfolioCount: number;
  demandCount: number;
  activeDemandCount: number;
  recentPortfolios: Portfolio[];
  recentDemands: Demand[];
}

export const dashboardService = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
};
