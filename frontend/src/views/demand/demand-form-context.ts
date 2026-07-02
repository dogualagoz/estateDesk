import { inject, provide, reactive, type InjectionKey } from 'vue';
import type { DemandStatus } from '@/types/demand';
import type { ListingType, PropertyType } from '@/types/portfolio';

/** Talep formunun tamamı — ana view oluşturur, kriter formu bileşeni mutasyonlar. */
export interface DemandFormState {
  types: PropertyType[];
  listingType: ListingType;
  city: string;
  districts: string[];
  neighborhoods: string[];
  minBudget: number | undefined;
  maxBudget: number | undefined;
  rooms: string[];
  minArea: number | undefined;
  maxArea: number | undefined;
  mustHaveFeatures: string[];
  bonusFeatures: string[];
  note: string;
  customerName: string;
  customerPhone: string;
  status: DemandStatus;
}

export function createDemandForm(): DemandFormState {
  return reactive({
    types: [] as PropertyType[],
    listingType: 'SALE' as ListingType,
    city: '',
    districts: [] as string[],
    neighborhoods: [] as string[],
    minBudget: undefined as number | undefined,
    maxBudget: undefined as number | undefined,
    rooms: [] as string[],
    minArea: undefined as number | undefined,
    maxArea: undefined as number | undefined,
    mustHaveFeatures: [] as string[],
    bonusFeatures: [] as string[],
    note: '',
    customerName: '',
    customerPhone: '',
    status: 'ACTIVE' as DemandStatus,
  });
}

// Form, prop yerine provide/inject ile paylaşılır: alt bileşen aynı reaktif
// nesneyi doğrudan mutasyonlar (props mutasyonu lint/anti-pattern'inden kaçınılır).
const DEMAND_FORM_KEY: InjectionKey<DemandFormState> = Symbol('demand-form');

export function provideDemandForm(form: DemandFormState) {
  provide(DEMAND_FORM_KEY, form);
}

export function useDemandForm(): DemandFormState {
  const form = inject(DEMAND_FORM_KEY);
  if (!form) throw new Error('DemandForm context bulunamadı — provideDemandForm çağrılmalı');
  return form;
}
