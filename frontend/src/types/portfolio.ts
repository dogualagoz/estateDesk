export type PropertyType = 'APARTMENT' | 'VILLA' | 'LAND' | 'HOTEL' | 'SHOP' | 'OFFICE';
export type ListingType = 'SALE' | 'RENT';
export type PortfolioVisibility = 'PUBLIC' | 'HIDDEN';

export const PROPERTY_TYPES: PropertyType[] = ['APARTMENT', 'VILLA', 'LAND', 'HOTEL', 'SHOP', 'OFFICE'];
export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  APARTMENT: 'Daire',
  VILLA: 'Villa',
  LAND: 'Arsa',
  HOTEL: 'Otel',
  SHOP: 'Dükkan',
  OFFICE: 'Ofis',
};

export const LISTING_TYPE_LABELS: Record<ListingType, string> = {
  SALE: 'Satılık',
  RENT: 'Kiralık',
};

/** Ortak oda seçenekleri — portföy formu ve eşleştirme paneli paylaşır. */
export const ROOM_OPTIONS = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1'];

/** Ortak özellik ön ayarları. */
export const FEATURE_PRESETS = [
  'Asansör', 'Otopark', 'Balkon', 'Deniz Manzarası', 'Güvenlik',
  'Kombi', 'Havuz', 'Bahçe', 'Teras', 'Klima', 'Eşyalı',
  'Isı Yalıtımı', 'Jeneratör', 'Garaj', 'Kapalı Otopark', 'Depolu',
];

export interface Portfolio {
  id: string;
  type: PropertyType;
  listingType: ListingType;
  title?: string | null;
  city: string;
  district: string;
  neighborhood?: string | null;
  areaSqm: number;
  roomCount: string;
  price: string | number;
  features: string[];
  images: string[];
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
  listingType?: ListingType;
  title?: string;
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
  listingType?: ListingType;
  city?: string;
  district?: string;
  roomCount?: string;
  feature?: string;
  visibility?: PortfolioVisibility;
  minPrice?: number;
  maxPrice?: number;
  createdById?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}
