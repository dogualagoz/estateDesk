import type { ListingType, PropertyType } from './portfolio';

export type DemandStatus = 'ACTIVE' | 'CLOSED';

export const DEMAND_STATUS_LABELS: Record<DemandStatus, string> = {
  ACTIVE: 'Aktif',
  CLOSED: 'Kapandı',
};

export interface Demand {
  id: string;
  types: PropertyType[];
  listingType: ListingType;
  regions: string[];
  city?: string | null;
  district?: string | null;
  neighborhood?: string | null;
  districts?: string[] | null;
  neighborhoods?: string[] | null;
  minBudget?: string | number | null;
  maxBudget?: string | number | null;
  roomPreferences: string[];
  minArea?: number | null;
  maxArea?: number | null;
  featurePrefs: string[];
  mustHaveFeatures: string[];
  bonusFeatures: string[];
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
  listingType?: ListingType;
  regions?: string[];
  city?: string;
  district?: string;
  neighborhood?: string;
  districts?: string[];
  neighborhoods?: string[];
  minBudget?: number;
  maxBudget?: number;
  roomPreferences?: string[];
  minArea?: number;
  maxArea?: number;
  featurePrefs?: string[];
  mustHaveFeatures?: string[];
  bonusFeatures?: string[];
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
  createdById?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}
