<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  ROOM_OPTIONS,
  FEATURE_PRESETS,
  type ListingType,
  type PropertyType,
} from '@/types/portfolio';
import LocationSelect from '@/components/ui/LocationSelect.vue';
import { useCurrencyInput } from '@/composables/useCurrencyInput';
import { usePortfolioFormContext, usePortfolioProgress } from '../portfolio-form-context';

/**
 * Portföy formunun sağ paneli: sırayla açılan 4 bölüm
 * (temel bilgiler → konum → detay/fiyat → özellik/iletişim).
 * Form state'i provide/inject ile gelir; bölüm ilerleme mantığı ortak
 * usePortfolioProgress'ten türetilir.
 */
defineProps<{
  /** Kaydetme hatası (ana view'ın submit'inden). */
  error?: string | null;
}>();

const ctx = usePortfolioFormContext();
const { form, typeChosen, listingChosen } = ctx;
const { s1Done, s2Done, s3Done, showRoomCount } = usePortfolioProgress(ctx);

const TYPE_ICONS: Record<PropertyType, string> = {
  APARTMENT: 'apartment',
  VILLA:     'villa',
  LAND:      'landscape',
  HOTEL:     'hotel',
  SHOP:      'storefront',
  OFFICE:    'business_center',
};

const customFeature = ref('');

// Fiyat: '' | number modelini number | undefined'a köprüle (currency composable için)
const priceModel = computed<number | undefined>({
  get: () => (form.price === '' ? undefined : Number(form.price)),
  set: (v) => {
    form.price = v ?? '';
  },
});
// Yazarken de binlik ayraçlı görünüm (liveFormat) — mevcut fiyat alanı davranışı
const price = useCurrencyInput(priceModel, { liveFormat: true });

const showSection2 = s1Done;
const showSection3 = s2Done;
const showSection4 = s3Done;

// Yeni bölüm açıldığında kaydır
const sec2Ref = ref<HTMLElement | null>(null);
const sec3Ref = ref<HTMLElement | null>(null);
const sec4Ref = ref<HTMLElement | null>(null);
watch(showSection2, (v) => { if (v) nextTick(() => sec2Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); });
watch(showSection3, (v) => { if (v) nextTick(() => sec3Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); });
watch(showSection4, (v) => { if (v) nextTick(() => sec4Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); });

function selectType(t: PropertyType) {
  form.type = t;
  typeChosen.value = true;
  if (!showRoomCount.value) form.roomCount = '';
}

function selectListingType(t: ListingType) {
  form.listingType = t;
  listingChosen.value = true;
}

function toggleFeature(f: string) {
  const idx = form.features.indexOf(f);
  if (idx === -1) form.features.push(f);
  else form.features.splice(idx, 1);
}

function addCustomFeature() {
  const val = customFeature.value.trim();
  if (val && !form.features.includes(val)) form.features.push(val);
  customFeature.value = '';
}
</script>

<template>
  <div class="flex-1 md:overflow-y-auto px-4 md:px-8 pb-4 space-y-4">
    <!-- ── Bölüm 1: Temel Bilgiler (her zaman açık) ── -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
      <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Temel Bilgiler</p>

      <!-- Mülk tipi -->
      <p class="text-label-sm font-semibold text-on-surface-variant mb-2">Mülk Tipi</p>
      <div class="flex flex-wrap gap-2 mb-4">
        <button
          v-for="t in PROPERTY_TYPES" :key="t"
          type="button"
          class="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-label-sm font-medium transition-all duration-150 min-w-[72px]"
          :class="form.type === t && typeChosen
            ? 'border-primary bg-primary-fixed/60 text-on-surface'
            : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:bg-surface-container'"
          @click="selectType(t)"
        >
          <span class="material-symbols-outlined text-[24px]">{{ TYPE_ICONS[t] }}</span>
          {{ PROPERTY_TYPE_LABELS[t] }}
        </button>
      </div>

      <!-- İlan tipi -->
      <p class="text-label-sm font-semibold text-on-surface-variant mb-2">İlan Tipi</p>
      <div class="flex gap-3 mb-4">
        <button
          type="button" class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all duration-150"
          :class="form.listingType === 'SALE' && listingChosen
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'"
          @click="selectListingType('SALE')">
          Satılık
        </button>
        <button
          type="button" class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all duration-150"
          :class="form.listingType === 'RENT' && listingChosen
            ? 'bg-primary text-on-primary border-primary'
            : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'"
          @click="selectListingType('RENT')">
          Kiralık
        </button>
      </div>

      <!-- İpucu — seçim bekleniyor -->
      <Transition name="fade">
        <p v-if="!s1Done" class="text-label-sm text-on-surface-variant/60 italic">
          Mülk türü ve ilan tipini seçerek devam edin.
        </p>
      </Transition>
    </div>

    <!-- ── Bölüm 2: Konum ── -->
    <Transition name="section-slide">
      <div v-if="showSection2" ref="sec2Ref" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Konum</p>
        <div class="space-y-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-label-sm font-semibold text-on-surface-variant">
              İlan Başlığı
              <span class="font-normal ml-1 text-on-surface-variant/60">(isteğe bağlı)</span>
            </label>
            <input v-model="form.title" class="input" placeholder="Örn: Kadıköy Moda'da Deniz Manzaralı" />
          </div>
          <LocationSelect
            v-model:city="form.city"
            v-model:district="form.district"
            v-model:neighborhood="form.neighborhood"
            compact
            city-hint="*"
            city-hint-error
            district-hint="*"
            neighborhood-hint="(isteğe bağlı)"
          />
        </div>
      </div>
    </Transition>

    <!-- ── Bölüm 3: Detaylar & Fiyat ── -->
    <Transition name="section-slide">
      <div v-if="showSection3" ref="sec3Ref" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Detaylar & Fiyat</p>
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-label-sm font-semibold text-on-surface-variant">Brüt m²</label>
              <div class="relative">
                <input v-model.number="form.areaSqm" class="input pr-10" type="number" min="0" placeholder="145" />
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm select-none pointer-events-none">m²</span>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-sm font-semibold text-on-surface-variant">Fiyat *</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm select-none pointer-events-none">₺</span>
                <input
                  class="input pl-7" type="text" inputmode="numeric" :value="price.display.value"
                  placeholder="12.500.000"
                  @focus="price.onFocus"
                  @input="price.onInput"
                  @blur="price.onBlur" />
              </div>
            </div>
          </div>
          <div v-if="showRoomCount" class="flex flex-col gap-1.5">
            <label class="text-label-sm font-semibold text-on-surface-variant">Oda Sayısı</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="r in ROOM_OPTIONS" :key="r"
                type="button"
                class="px-4 py-2 rounded-lg text-label-md border-2 font-medium transition-all duration-150"
                :class="form.roomCount === r ? 'bg-primary text-on-primary border-primary' : 'bg-transparent text-on-surface border-outline-variant hover:border-primary/60'"
                @click="form.roomCount = form.roomCount === r ? '' : r"
              >{{ r }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── Bölüm 4: Özellikler & İletişim ── -->
    <Transition name="section-slide">
      <div v-if="showSection4" ref="sec4Ref" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
        <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Özellikler & İletişim</p>
        <div class="space-y-5">
          <!-- Özellikler -->
          <div class="flex flex-col gap-2">
            <label class="text-label-sm font-semibold text-on-surface-variant">Özellikler</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="f in FEATURE_PRESETS" :key="f"
                type="button"
                class="flex items-center gap-1 px-3 py-1.5 rounded-full text-label-sm border-2 transition-all duration-150"
                :class="form.features.includes(f) ? 'bg-primary text-on-primary border-primary font-medium' : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'"
                @click="toggleFeature(f)"
              >
                {{ f }}
                <span v-if="form.features.includes(f)" class="opacity-70 text-[11px]">✕</span>
              </button>
            </div>
            <div class="flex gap-2">
              <input v-model="customFeature" class="input flex-1" placeholder="Özel özellik ekle..." @keydown.enter.prevent="addCustomFeature" />
              <button type="button" class="btn" @click="addCustomFeature">
                <span class="material-symbols-outlined text-[16px]">add</span> Ekle
              </button>
            </div>
          </div>

          <!-- Mal sahibi -->
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-label-sm font-semibold text-on-surface-variant">Mal Sahibi *</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">person</span>
                <input v-model="form.ownerName" class="input pl-9" placeholder="İsim Soyisim" />
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-label-sm font-semibold text-on-surface-variant">Telefon *</label>
              <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">phone</span>
                <input v-model="form.ownerPhone" class="input pl-9" placeholder="05XX XXX XX XX" />
              </div>
            </div>
          </div>

          <!-- İç notlar -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-label-sm font-semibold text-on-surface-variant">İç Notlar</label>
              <button
                type="button" class="flex items-center gap-2 cursor-pointer select-none"
                @click="form.visibility = form.visibility === 'HIDDEN' ? 'PUBLIC' : 'HIDDEN'">
                <div
                  class="w-9 h-5 rounded-full relative transition-colors duration-200"
                  :class="form.visibility === 'HIDDEN' ? 'bg-primary' : 'bg-outline-variant'">
                  <div
                    class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                    :class="form.visibility === 'HIDDEN' ? 'left-[18px]' : 'left-0.5'" />
                </div>
                <span class="text-label-sm text-on-surface-variant">Gizli (ofis içi)</span>
              </button>
            </div>
            <textarea v-model="form.note" class="textarea" rows="3" placeholder="Müşteri görüşmesi notları, anahtar durumu vb." />
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="error" class="px-4 py-2.5 rounded-lg bg-error-container text-on-error-container text-label-md">
      {{ error }}
    </p>
  </div>
</template>

<style scoped>
/* Bölüm açılış animasyonu */
.section-slide-enter-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}
.section-slide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

/* İpucu fade */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
