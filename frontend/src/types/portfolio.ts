export type PropertyType = 'APARTMENT' | 'VILLA' | 'LAND' | 'SHOP' | 'OFFICE';
export type PortfolioVisibility = 'PUBLIC' | 'HIDDEN';

export const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'VILLA', 'LAND', 'SHOP', 'OFFICE'];
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Daire',
  VILLA: 'Villa',
  LAND: 'Arsa',
  SHOP: 'Dükkan',
  OFFICE: 'Ofis',
};

export interface Portfolio {
  id: string;
  type: PropertyType;
  city: string;
  district: string;
  neighborhood?: string | null;
  areaSqm: number;
  roomCount: string;
  price: string | number;
  features: string[];
  visibility: PortfolioVisibility;
  note?: string | null;
  ownerName: string;
  ownerPhone: string;
  createdById: string;
  createdBy?: { id: string; fullName: string };
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePortfolioPayload {
  type: PropertyType;
  city: string;
  district: string;
  neighborhood?: string;
  areaSqm: number;
  roomCount: string;
  price: number;
  features?: string[];
  visibility?: PortfolioVisibility;
  note?: string;
  ownerName: string;
  ownerPhone: string;
}

export type UpdatePortfolioPayload = Partial<CreatePortfolioPayload>;

export interface PortfolioQuery {
  type?: PropertyType;
  city?: string;
  district?: string;
  roomCount?: string;
  feature?: string;
  visibility?: PortfolioVisibility;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}
