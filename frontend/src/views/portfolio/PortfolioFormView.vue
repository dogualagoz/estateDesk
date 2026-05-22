<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  ROOM_OPTIONS,
  FEATURE_PRESETS,
  type CreatePortfolioPayload,
  type ListingType,
  type PropertyType,
} from '@/types/portfolio';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);

const TYPE_ICONS: Record<PropertyType, string> = {
  APARTMENT: 'apartment',
  VILLA:     'villa',
  LAND:      'landscape',
  HOTEL:     'hotel',
  SHOP:      'storefront',
  OFFICE:    'business_center',
};

const TYPE_GRADIENTS: Record<PropertyType, string> = {
  APARTMENT: 'linear-gradient(135deg, #4e604f 0%, #7D907D 100%)',
  VILLA:     'linear-gradient(135deg, #a67c52 0%, #c9a06e 100%)',
  LAND:      'linear-gradient(135deg, #5a7a3c 0%, #85b55f 100%)',
  HOTEL:     'linear-gradient(135deg, #2d6a8f 0%, #4a9abf 100%)',
  SHOP:      'linear-gradient(135deg, #b05e2c 0%, #d98048 100%)',
  OFFICE:    'linear-gradient(135deg, #4a4f5e 0%, #6e7585 100%)',
};

// Kullanıcının aktif seçim yapıp yapmadığını takip eder
const typeChosen    = ref(false);
const listingChosen = ref(false);

const form = reactive({
  type:         'APARTMENT' as PropertyType,
  listingType:  'SALE' as ListingType,
  title:        '',
  city:         '',
  district:     '',
  neighborhood: '',
  areaSqm:      '' as string | number,
  roomCount:    '',
  price:        '' as string | number,
  features:     [] as string[],
  visibility:   'PUBLIC' as 'PUBLIC' | 'HIDDEN',
  note:         '',
  ownerName:    '',
  ownerPhone:   '',
});

const error        = ref<string | null>(null);
const saving       = ref(false);
const customFeature = ref('');

// Bölüm görünürlüğü — sırayla açılır
const s1Done = computed(() => typeChosen.value && listingChosen.value);
const s2Done = computed(() => s1Done.value && form.city.trim() !== '' && form.district.trim() !== '');
const s3Done = computed(() => s2Done.value && Number(form.price) > 0);

const showSection2 = s1Done;
const showSection3 = s2Done;
const showSection4 = s3Done;

const STEPS = [
  { label: 'Temel Bilgiler' },
  { label: 'Konum' },
  { label: 'Detaylar' },
  { label: 'İletişim' },
];

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

const showRoomCount = computed(() => ['APARTMENT', 'VILLA'].includes(form.type));

const previewTitle = computed(() => {
  if (form.title) return form.title;
  const typeLabel = PROPERTY_TYPE_LABELS[form.type];
  const parts = [form.neighborhood, form.district, form.city].filter(Boolean);
  return parts.length ? `${typeLabel} — ${parts.join(', ')}` : typeLabel;
});
const previewLocation = computed(() =>
  [form.neighborhood, form.district, form.city].filter(Boolean).join(', ') || '—'
);
const previewPrice = computed(() =>
  form.price ? '₺' + Number(form.price).toLocaleString('tr-TR') : '—'
);
const previewGradient = computed(() => TYPE_GRADIENTS[form.type]);

const canSubmit = computed(() =>
  s1Done.value &&
  form.city.trim() !== '' && form.district.trim() !== '' &&
  Number(form.price) > 0 &&
  form.ownerName.trim() !== '' && form.ownerPhone.trim() !== ''
);

// Yeni bölüm açıldığında kaydır
const sec2Ref = ref<HTMLElement | null>(null);
const sec3Ref = ref<HTMLElement | null>(null);
const sec4Ref = ref<HTMLElement | null>(null);
watch(showSection2, v => { if (v) nextTick(() => sec2Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); });
watch(showSection3, v => { if (v) nextTick(() => sec3Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); });
watch(showSection4, v => { if (v) nextTick(() => sec4Ref.value?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })); });

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

onMounted(async () => {
  if (!isEdit.value) return;
  const p = await portfolioService.get(route.params.id as string);
  Object.assign(form, {
    type:         p.type,
    listingType:  p.listingType ?? 'SALE',
    title:        p.title ?? '',
    city:         p.city,
    district:     p.district,
    neighborhood: p.neighborhood ?? '',
    areaSqm:      p.areaSqm,
    roomCount:    p.roomCount,
    price:        typeof p.price === 'string' ? parseFloat(p.price) : p.price,
    features:     [...p.features],
    visibility:   p.visibility,
    note:         p.note ?? '',
    ownerName:    p.ownerName,
    ownerPhone:   p.ownerPhone,
  });
  typeChosen.value    = true;
  listingChosen.value = true;
});

async function submit() {
  error.value = null;
  saving.value = true;
  try {
    const payload: CreatePortfolioPayload = {
      type:         form.type,
      listingType:  form.listingType,
      title:        form.title || undefined,
      city:         form.city,
      district:     form.district,
      neighborhood: form.neighborhood || undefined,
      areaSqm:      Number(form.areaSqm) || 0,
      roomCount:    form.roomCount,
      price:        Number(form.price),
      features:     [...form.features],
      visibility:   form.visibility,
      note:         form.note || undefined,
      ownerName:    form.ownerName,
      ownerPhone:   form.ownerPhone,
    };
    if (isEdit.value) {
      await portfolioService.update(route.params.id as string, payload);
      router.push(`/portfolio/${route.params.id}`);
    } else {
      const created = await portfolioService.create(payload);
      router.push(`/portfolio/${created.id}`);
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Kaydetme başarısız';
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">

    <!-- ── Header ── -->
    <div class="shrink-0 flex items-center gap-3 px-8 py-5 border-b border-outline-variant bg-surface">
      <button
        class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
        @click="router.back()"
      >
        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
      </button>
      <div>
        <h1 class="text-headline-md font-semibold text-on-surface tracking-tight">
          {{ isEdit ? 'Portföy Düzenle' : 'Yeni Portföy Ekle' }}
        </h1>
        <p class="text-label-md text-on-surface-variant mt-0.5">
          İlan detaylarını eksiksiz girerek potansiyel alıcılara ulaşın.
        </p>
      </div>
    </div>

    <!-- ── Body: iki eşit sütun ── -->
    <div class="flex-1 flex overflow-hidden">

      <!-- ── Sol: Canlı Önizleme ── -->
      <div class="w-1/2 border-r border-outline-variant bg-surface-container/40 flex flex-col overflow-hidden">
        <!-- Gradient alan — büyük -->
        <div
          class="relative flex-1 flex flex-col justify-end p-8 transition-all duration-700"
          :style="{ background: previewGradient }"
        >
          <!-- Dekoratif daireler -->
          <div class="absolute top-6 right-6 w-40 h-40 rounded-full bg-white/10" />
          <div class="absolute top-16 right-20 w-20 h-20 rounded-full bg-white/10" />
          <div class="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-white/10" />

          <!-- Etiketler -->
          <div class="flex gap-2 mb-4">
            <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/90 text-on-surface tracking-wide">
              {{ LISTING_TYPE_LABELS[form.listingType] }}
            </span>
            <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/70 text-on-surface tracking-wide">
              {{ PROPERTY_TYPE_LABELS[form.type] }}
            </span>
          </div>

          <!-- İçerik -->
          <h2 class="text-[22px] font-bold text-white leading-snug drop-shadow mb-2">
            {{ previewTitle }}
          </h2>
          <p class="text-white/80 text-label-md flex items-center gap-1 mb-4">
            <span class="material-symbols-outlined text-[16px]">location_on</span>
            {{ previewLocation }}
          </p>

          <!-- Fiyat + detay bar -->
          <div class="bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
            <span class="text-[24px] font-extrabold text-white drop-shadow">{{ previewPrice }}</span>
            <div class="flex gap-4 text-white/80 text-label-sm">
              <span v-if="form.areaSqm" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">straighten</span>{{ form.areaSqm }} m²
              </span>
              <span v-if="form.roomCount" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">door_open</span>{{ form.roomCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- Özellik chip'leri + etiket -->
        <div class="shrink-0 bg-surface-container-lowest border-t border-outline-variant px-8 py-5">
          <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Canlı Önizleme</p>
          <div v-if="form.features.length > 0" class="flex flex-wrap gap-2">
            <span
              v-for="f in form.features.slice(0, 6)" :key="f"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary-fixed text-on-primary-fixed-variant"
            >{{ f }}</span>
            <span v-if="form.features.length > 6"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant"
            >+{{ form.features.length - 6 }}</span>
          </div>
          <p v-else class="text-label-sm text-on-surface-variant/50 italic">Özellik seçilmedi</p>
        </div>
      </div>

      <!-- ── Sağ: Form ── -->
      <div class="w-1/2 flex flex-col overflow-hidden">

        <!-- Step göstergesi -->
        <div class="shrink-0 px-8 pt-5 pb-4">
          <div class="flex items-start">
            <template v-for="(s, i) in STEPS" :key="i">
              <div v-if="i > 0" class="flex-1 h-0.5 mt-[15px] mx-1 rounded-full transition-colors duration-500"
                   :class="stepsDone[i - 1] ? 'bg-primary' : 'bg-outline-variant'" />
              <div class="flex flex-col items-center gap-1.5">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300"
                  :class="stepsDone[i]
                    ? 'bg-primary text-on-primary'
                    : currentStep === i + 1
                      ? 'bg-primary text-on-primary ring-4 ring-primary/20 shadow'
                      : 'bg-surface-container border-2 border-outline-variant text-on-surface-variant'"
                >
                  <span v-if="stepsDone[i]" class="material-symbols-outlined text-[14px]">check</span>
                  <span v-else>{{ i + 1 }}</span>
                </div>
                <span
                  class="text-label-xs whitespace-nowrap transition-colors"
                  :class="stepsDone[i] || currentStep === i + 1 ? 'text-primary font-semibold' : 'text-on-surface-variant'"
                >{{ s.label }}</span>
              </div>
            </template>
          </div>
        </div>

        <!-- Kaydırılabilir bölümler -->
        <div class="flex-1 overflow-y-auto px-8 pb-4 space-y-4">

          <!-- ── Bölüm 1: Temel Bilgiler (her zaman açık) ── -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Temel Bilgiler</p>

            <!-- Mülk tipi -->
            <p class="text-label-sm font-semibold text-on-surface-variant mb-2">Mülk Tipi</p>
            <div class="flex flex-wrap gap-2 mb-4">
              <button
                v-for="t in PROPERTY_TYPES" :key="t"
                type="button"
                @click="selectType(t)"
                class="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border-2 text-label-sm font-medium transition-all duration-150 min-w-[72px]"
                :class="form.type === t && typeChosen
                  ? 'border-primary bg-primary-fixed/60 text-on-surface'
                  : 'border-outline-variant text-on-surface-variant hover:border-primary/50 hover:bg-surface-container'"
              >
                <span class="material-symbols-outlined text-[24px]">{{ TYPE_ICONS[t] }}</span>
                {{ PROPERTY_TYPE_LABELS[t] }}
              </button>
            </div>

            <!-- İlan tipi -->
            <p class="text-label-sm font-semibold text-on-surface-variant mb-2">İlan Tipi</p>
            <div class="flex gap-3 mb-4">
              <button type="button" @click="selectListingType('SALE')"
                class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all duration-150"
                :class="form.listingType === 'SALE' && listingChosen
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'">
                Satılık
              </button>
              <button type="button" @click="selectListingType('RENT')"
                class="flex-1 py-2.5 rounded-lg text-label-md font-semibold border-2 transition-all duration-150"
                :class="form.listingType === 'RENT' && listingChosen
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'">
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
                  <input class="input" v-model="form.title" placeholder="Örn: Kadıköy Moda'da Deniz Manzaralı" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1.5">
                    <label class="text-label-sm font-semibold text-on-surface-variant">İl *</label>
                    <input class="input" v-model="form.city" placeholder="İstanbul" />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-label-sm font-semibold text-on-surface-variant">İlçe *</label>
                    <input class="input" v-model="form.district" placeholder="Kadıköy" />
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-label-sm font-semibold text-on-surface-variant">
                    Mahalle
                    <span class="font-normal ml-1 text-on-surface-variant/60">(isteğe bağlı)</span>
                  </label>
                  <input class="input" v-model="form.neighborhood" placeholder="Moda" />
                </div>
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
                      <input class="input pr-10" type="number" min="0" v-model.number="form.areaSqm" placeholder="145" />
                      <span class="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm select-none pointer-events-none">m²</span>
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-label-sm font-semibold text-on-surface-variant">Fiyat *</label>
                    <div class="relative">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-label-sm select-none pointer-events-none">₺</span>
                      <input class="input pl-7" type="number" min="0" v-model.number="form.price" placeholder="12500000" />
                    </div>
                  </div>
                </div>
                <div v-if="showRoomCount" class="flex flex-col gap-1.5">
                  <label class="text-label-sm font-semibold text-on-surface-variant">Oda Sayısı</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="r in ROOM_OPTIONS" :key="r"
                      type="button"
                      @click="form.roomCount = form.roomCount === r ? '' : r"
                      class="px-4 py-2 rounded-lg text-label-md border-2 font-medium transition-all duration-150"
                      :class="form.roomCount === r ? 'bg-primary text-on-primary border-primary' : 'bg-transparent text-on-surface border-outline-variant hover:border-primary/60'"
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
                      @click="toggleFeature(f)"
                      class="flex items-center gap-1 px-3 py-1.5 rounded-full text-label-sm border-2 transition-all duration-150"
                      :class="form.features.includes(f) ? 'bg-primary text-on-primary border-primary font-medium' : 'bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/60'"
                    >
                      {{ f }}
                      <span v-if="form.features.includes(f)" class="opacity-70 text-[11px]">✕</span>
                    </button>
                  </div>
                  <div class="flex gap-2">
                    <input class="input flex-1" v-model="customFeature" placeholder="Özel özellik ekle..." @keydown.enter.prevent="addCustomFeature" />
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
                      <input class="input pl-9" v-model="form.ownerName" placeholder="İsim Soyisim" />
                    </div>
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-label-sm font-semibold text-on-surface-variant">Telefon *</label>
                    <div class="relative">
                      <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-on-surface-variant pointer-events-none">phone</span>
                      <input class="input pl-9" v-model="form.ownerPhone" placeholder="05XX XXX XX XX" />
                    </div>
                  </div>
                </div>

                <!-- İç notlar -->
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-label-sm font-semibold text-on-surface-variant">İç Notlar</label>
                    <button type="button" @click="form.visibility = form.visibility === 'HIDDEN' ? 'PUBLIC' : 'HIDDEN'"
                      class="flex items-center gap-2 cursor-pointer select-none">
                      <div class="w-9 h-5 rounded-full relative transition-colors duration-200"
                           :class="form.visibility === 'HIDDEN' ? 'bg-primary' : 'bg-outline-variant'">
                        <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200"
                             :class="form.visibility === 'HIDDEN' ? 'left-[18px]' : 'left-0.5'" />
                      </div>
                      <span class="text-label-sm text-on-surface-variant">Sadece Bana Özel</span>
                    </button>
                  </div>
                  <textarea class="textarea" v-model="form.note" rows="3" placeholder="Müşteri görüşmesi notları, anahtar durumu vb." />
                </div>
              </div>
            </div>
          </Transition>

          <p v-if="error" class="px-4 py-2.5 rounded-lg bg-error-container text-on-error-container text-label-md">
            {{ error }}
          </p>
        </div>

        <!-- ── Alt bar ── -->
        <div class="shrink-0 flex items-center justify-end gap-3 px-8 py-4 border-t border-outline-variant bg-surface">
          <button type="button" class="btn" @click="router.back()">İptal</button>
          <button type="button" class="btn primary" @click="submit" :disabled="saving || !canSubmit">
            <span class="material-symbols-outlined text-[18px]">{{ saving ? 'hourglass_empty' : 'save' }}</span>
            {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
          </button>
        </div>

      </div>
    </div>
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
