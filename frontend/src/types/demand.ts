import type { PropertyType } from './portfolio';

export type DemandStatus = 'ACTIVE' | 'CLOSED';

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  ACTIVE: 'Aktif',
  CLOSED: 'Kapandı',
};

export interface Demand {
  id: string;
  types: PropertyType[];
  regions: string[];
  minBudget?: string | number | null;
  maxBudget?: string | number | null;
  roomPreferences: string[];
  featurePrefs: string[];
  note?: string | null;
  customerName: string;
  customerPhone: string;
  status: DemandStatus;
  createdById: string;
  createdBy?: { id: string; fullName: string };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDemandPayload {
  types: PropertyType[];
  regions: string[];
  minBudget?: number;
  maxBudget?: number;
  roomPreferences?: string[];
  featurePrefs?: string[];
  note?: string;
  customerName: string;
  customerPhone: string;
  status?: DemandStatus;
}

export type UpdateDemandPayload = Partial<CreateDemandPayload>;

export interface DemandQuery {
  type?: PropertyType;
  region?: string;
  roomPreference?: string;
  status?: DemandStatus;
  minBudget?: number;
  maxBudget?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}
