import { api } from './api';
import type { PropertyType, ListingType, Portfolio } from '@/types/portfolio';
import type { DemandStatus, Demand } from '@/types/demand';
import type { ScoredPortfolio } from '@/types/matching';

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
  agentName?: string | null;
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
  agentName?: string | null;
}

export interface RecentPortfolio {
  id: string;
  type: PropertyType;
  listingType: ListingType;
  city: string;
  district: string;
  price: string | number;
  createdAt: string;
  title?: string | null;
  createdBy?: { fullName: string };
}

export interface RecentDemand {
  id: string;
  customerName: string;
  types: PropertyType[];
  regions: string[];
  minBudget?: string | number | null;
  maxBudget?: string | number | null;
  createdAt: string;
  createdBy?: { fullName: string };
}

export interface DashboardStats {
  portfolioCount: number;
  demandCount: number;
  activeDemandCount: number;
  pinnedMatchCount: number;
  closedDemandCount: number;
  portfoliosWithNotes: NotedPortfolio[];
  demandsWithNotes: NotedDemand[];
  recentPortfolios: RecentPortfolio[];
  recentDemands: RecentDemand[];
}

export interface PendingMatchItem {
  demand: Demand;
  topMatch: ScoredPortfolio | null;
}

export const dashboardService = {
  stats: () => api.get<DashboardStats>('/dashboard/stats').then((r) => r.data),
  pendingMatches: () => api.get<PendingMatchItem[]>('/dashboard/pending-matches').then((r) => r.data),
};
