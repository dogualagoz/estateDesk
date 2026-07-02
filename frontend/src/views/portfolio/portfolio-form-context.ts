import { computed, inject, provide, reactive, ref, type InjectionKey, type Ref } from 'vue';
import type { ListingType, PropertyType } from '@/types/portfolio';

/** Portföy formunun tamamı — ana view oluşturur, alt bileşenler mutasyonlar. */
export interface PortfolioFormState {
  type: PropertyType;
  listingType: ListingType;
  title: string;
  city: string;
  district: string;
  neighborhood: string;
  areaSqm: string | number;
  roomCount: string;
  price: string | number;
  features: string[];
  visibility: 'PUBLIC' | 'HIDDEN';
  note: string;
  ownerName: string;
  ownerPhone: string;
}

export interface PortfolioFormContext {
  form: PortfolioFormState;
  /** Kullanıcı mülk tipini aktif olarak seçti mi (bölüm ilerlemesi için). */
  typeChosen: Ref<boolean>;
  /** Kullanıcı ilan tipini aktif olarak seçti mi. */
  listingChosen: Ref<boolean>;
}

export function createPortfolioFormContext(): PortfolioFormContext {
  const form = reactive<PortfolioFormState>({
    type: 'APARTMENT',
    listingType: 'SALE',
    title: '',
    city: '',
    district: '',
    neighborhood: '',
    areaSqm: '',
    roomCount: '',
    price: '',
    features: [],
    visibility: 'PUBLIC',
    note: '',
    ownerName: '',
    ownerPhone: '',
  });
  return { form, typeChosen: ref(false), listingChosen: ref(false) };
}

// Form, prop yerine provide/inject ile paylaşılır (bkz. demand-form-context.ts)
const PORTFOLIO_FORM_KEY: InjectionKey<PortfolioFormContext> = Symbol('portfolio-form');

export function providePortfolioForm(ctx: PortfolioFormContext) {
  provide(PORTFOLIO_FORM_KEY, ctx);
}

export function usePortfolioFormContext(): PortfolioFormContext {
  const ctx = inject(PORTFOLIO_FORM_KEY);
  if (!ctx) throw new Error('PortfolioForm context bulunamadı — providePortfolioForm çağrılmalı');
  return ctx;
}

/**
 * Bölümlerin sırayla açılma/adım göstergesi mantığı.
 * Hem ana view (step göstergesi) hem form bölümleri (görünürlük) kullanır.
 */
export function usePortfolioProgress(ctx: PortfolioFormContext) {
  const { form, typeChosen, listingChosen } = ctx;

  const s1Done = computed(() => typeChosen.value && listingChosen.value);
  const s2Done = computed(() => s1Done.value && form.city.trim() !== '' && form.district.trim() !== '');
  const s3Done = computed(() => s2Done.value && Number(form.price) > 0);

  const stepsDone = computed(() => [
    s1Done.value,
    s2Done.value,
    s3Done.value,
    form.ownerName.trim() !== '' && form.ownerPhone.trim() !== '',
  ]);

  const currentStep = computed(() => {
    if (!s1Done.value) return 1;
    if (!s2Done.value) return 2;
    if (!s3Done.value) return 3;
    return 4;
  });

  // Oda sayısı yalnızca konut tiplerinde anlamlı
  const showRoomCount = computed(() => ['APARTMENT', 'VILLA'].includes(form.type));

  return { s1Done, s2Done, s3Done, stepsDone, currentStep, showRoomCount };
}
