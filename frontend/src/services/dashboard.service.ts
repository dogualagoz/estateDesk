import { api } from './api';
import type { PropertyType, ListingType } from '@/types/portfolio';
import type { DemandStatus } from '@/types/demand';

export interface NotedPortfolio {
  id: string;
  type: PropertyType;
  listingType: ListingType;
  city: string;
  district: string;
  price: string | number;
  note: string;
  updatedAt: string;
  title?: string | null;
}

export interface NotedDemand {
  id: string;
  customerName: string;
  minBudget?: string | number | null;
  maxBudget?: string | number | null;
  regions: string[];
  note: string;
  updatedAt: string;
  status: DemandStatus;
}

export interface DashboardStats {
  portfolioCount: number;
  demandCount: number;
  activeDemandCount: number;
  portfoliosWithNotes: NotedPortfolio[];
  demandsWithNotes: NotedDemand[];
}

export const dashboardService = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
};
