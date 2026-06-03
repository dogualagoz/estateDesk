<script setup lang="ts">
import { onMounted, reactive, ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { resolveImgUrl } from '@/utils/image';
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
import LocationDropdown from '@/components/ui/LocationDropdown.vue';
import {
  getCityNames,
  getDistrictNames,
  getNeighborhoods,
} from '@/data/tr-locations';

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
const priceDisplay = ref('');

// Konum yardımcıları
const cityOptions      = computed(() => getCityNames());
const districtOptions  = computed(() => form.city ? getDistrictNames(form.city) : []);
const neighborhoodOpts = computed(() => form.city && form.district ? getNeighborhoods(form.city, form.district) : []);

watch(() => form.city, () => { form.district = ''; form.neighborhood = ''; });
watch(() => form.district, () => { form.neighborhood = ''; });

function formatTR(n: number | string | undefined): string {
  if (n == null || n === '') return '';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  return isNaN(num) ? '' : num.toLocaleString('tr-TR');
}

function onPriceInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const raw = input.value.replace(/[^\d]/g, '');
  form.price = raw ? parseInt(raw) : '';
  const formatted = raw ? parseInt(raw).toLocaleString('tr-TR') : '';
  priceDisplay.value = formatted;
  input.value = formatted;
  // İmleç sona taşı
  requestAnimationFrame(() => input.setSelectionRange(formatted.length, formatted.length));
}

function onPriceBlur(e: Event) {
  const formatted = formatTR(form.price);
  priceDisplay.value = formatted;
  (e.target as HTMLInputElement).value = formatted;
}

// ── Görsel yükleme ──
const fileInput    = ref<HTMLInputElement | null>(null);
const pendingFiles = ref<File[]>([]);
const previewUrls  = ref<string[]>([]);
const existingImages = ref<string[]>([]); // edit modunda sunucudaki görseller
const isDragging   = ref(false);
const activeIndex  = ref(0);

const allPreviewUrls = computed(() => [
  ...existingImages.value.map(resolveImgUrl),
  ...previewUrls.value,
]);

function pickFiles() { fileInput.value?.click(); }

function addFiles(files: FileList | null) {
  if (!files) return;
  const before = allPreviewUrls.value.length;
  for (const file of Array.from(files)) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;
    pendingFiles.value.push(file);
    previewUrls.value.push(URL.createObjectURL(file));
  }
  if (before === 0 && allPreviewUrls.value.length > 0) activeIndex.value = 0;
}

function onFilePick(e: Event) {
  addFiles((e.target as HTMLInputElement).files);
  (e.target as HTMLInputElement).value = '';
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  addFiles(e.dataTransfer?.files ?? null);
}

function removePreview(index: number) {
  URL.revokeObjectURL(previewUrls.value[index]);
  previewUrls.value.splice(index, 1);
  pendingFiles.value.splice(index, 1);
  if (activeIndex.value >= allPreviewUrls.value.length) {
    activeIndex.value = Math.max(0, allPreviewUrls.value.length - 1);
  }
}

async function removeExistingImage(url: string) {
  const idx = existingImages.value.indexOf(url);
  const filename = url.split('/').pop()!;
  const portfolioId = route.params.id as string;
  await portfolioService.deleteImage(portfolioId, filename);
  existingImages.value = existingImages.value.filter((u) => u !== url);
  if (idx !== -1 && activeIndex.value >= allPreviewUrls.value.length) {
    activeIndex.value = Math.max(0, allPreviewUrls.value.length - 1);
  }
}

onUnmounted(() => previewUrls.value.forEach(URL.revokeObjectURL));

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
  existingImages.value = [...(p.images ?? [])];
  priceDisplay.value  = formatTR(form.price);
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
      if (pendingFiles.value.length) {
        await portfolioService.uploadImages(route.params.id as string, pendingFiles.value);
      }
      router.push(`/portfolio/${route.params.id}`);
    } else {
      const created = await portfolioService.create(payload);
      if (pendingFiles.value.length) {
        await portfolioService.uploadImages(created.id, pendingFiles.value);
      }
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
  <div class="flex flex-col md:h-screen md:overflow-hidden">

    <!-- ── Header ── -->
    <div class="shrink-0 flex items-center gap-3 px-4 md:px-8 py-5 border-b border-outline-variant bg-surface">
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

    <!-- ── Body: mobilde dikey istif, masaüstünde iki sütun ── -->
    <div class="flex-1 flex flex-col md:flex-row md:overflow-hidden">

      <!-- ── Sol: Canlı Önizleme ── -->
      <div class="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container/40 flex flex-col overflow-hidden">

        <!-- hidden file input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onFilePick"
        />

        <!-- Gradient / Fotoğraf alanı -->
        <div
          class="relative flex-1 min-h-[260px] md:min-h-0 flex flex-col justify-end p-8 transition-all duration-700 overflow-hidden"
          :style="allPreviewUrls.length ? {} : { background: previewGradient }"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="onDrop"
        >
          <!-- Arka plan fotoğrafı -->
          <img
            v-if="allPreviewUrls.length"
            :src="allPreviewUrls[activeIndex]"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            alt="Ön izleme"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />

          <!-- Fotoğraf varken okunabilirlik için koyu gradyan -->
          <div
            v-if="allPreviewUrls.length"
            class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
          />

          <!-- Dekoratif daireler — sadece fotoğrafsız -->
          <template v-if="!allPreviewUrls.length">
            <div class="absolute top-6 right-6 w-40 h-40 rounded-full bg-white/10" />
            <div class="absolute top-16 right-20 w-20 h-20 rounded-full bg-white/10" />
            <div class="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-white/10" />
          </template>

          <!-- Sürükle-bırak overlay -->
          <Transition name="fade">
            <div
              v-if="isDragging"
              class="absolute inset-4 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-black/30 backdrop-blur-sm"
            >
              <span class="material-symbols-outlined text-white text-[52px]">cloud_upload</span>
              <p class="text-white font-semibold mt-2 text-label-md">Bırakın, yüklensin</p>
            </div>
          </Transition>

          <!-- Fotoğraf ekle butonu — fotoğraf yokken ortada -->
          <Transition name="fade">
            <div
              v-if="!allPreviewUrls.length && !isDragging"
              class="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3"
            >
              <button
                type="button"
                class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white transition-all duration-200"
                @click="pickFiles"
              >
                <span class="material-symbols-outlined text-[36px]">add_photo_alternate</span>
                <span class="text-label-md font-semibold">Fotoğraf Ekle</span>
              </button>
              <p class="text-white/60 text-label-sm">veya sürükleyip bırakın</p>
            </div>
          </Transition>

          <!-- Fotoğraf varken sağ üst: ekle butonu + sayaç -->
          <div v-if="allPreviewUrls.length" class="absolute top-4 right-4 z-10 flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-full bg-black/50 text-white text-label-sm backdrop-blur-sm">
              {{ allPreviewUrls.length }} fotoğraf
            </span>
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-label-sm font-medium transition-all"
              @click="pickFiles"
            >
              <span class="material-symbols-outlined text-[16px]">add</span>
              Ekle
            </button>
          </div>

          <!-- Etiketler (relative, içerik üstünde) -->
          <div class="relative z-10 flex gap-2 mb-4">
            <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/90 text-on-surface tracking-wide">
              {{ LISTING_TYPE_LABELS[form.listingType] }}
            </span>
            <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/70 text-on-surface tracking-wide">
              {{ PROPERTY_TYPE_LABELS[form.type] }}
            </span>
          </div>

          <!-- İçerik -->
          <h2 class="relative z-10 text-[22px] font-bold text-white leading-snug drop-shadow mb-2">
            {{ previewTitle }}
          </h2>
          <p class="relative z-10 text-white/80 text-label-md flex items-center gap-1 mb-4">
            <span class="material-symbols-outlined text-[16px]">location_on</span>
            {{ previewLocation }}
          </p>

          <!-- Fiyat + detay bar -->
          <div class="relative z-10 bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
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

        <!-- Alt şerit: thumbnail strip + özellikler -->
        <div class="shrink-0 bg-surface-container-lowest border-t border-outline-variant px-6 py-4">

          <!-- Thumbnail strip -->
          <div v-if="allPreviewUrls.length" class="flex gap-2 mb-3 overflow-x-auto pb-1">
            <!-- Mevcut sunucu görselleri (edit modu) -->
            <div
              v-for="(url, i) in existingImages"
              :key="url"
              class="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all group cursor-pointer"
              :class="activeIndex === i ? 'border-primary shadow-md' : 'border-outline-variant hover:border-primary/50'"
              @click="activeIndex = i"
            >
              <img :src="resolveImgUrl(url)" class="w-full h-full object-cover" alt="" />
              <button
                v-if="isEdit"
                type="button"
                class="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                @click.stop="removeExistingImage(url)"
              >
                <span class="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
            <!-- Bekleyen yeni görseller -->
            <div
              v-for="(url, i) in previewUrls"
              :key="url"
              class="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all group cursor-pointer"
              :class="activeIndex === existingImages.length + i ? 'border-primary shadow-md' : 'border-outline-variant hover:border-primary/50'"
              @click="activeIndex = existingImages.length + i"
            >
              <img :src="url" class="w-full h-full object-cover" alt="" />
              <button
                type="button"
                class="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                @click.stop="removePreview(i)"
              >
                <span class="material-symbols-outlined text-[12px]">close</span>
              </button>
            </div>
          </div>

          <!-- Özellik chip'leri -->
          <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Canlı Önizleme</p>
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
      <div class="w-full md:w-1/2 flex flex-col md:overflow-hidden">

        <!-- Step göstergesi -->
        <div class="shrink-0 px-4 md:px-8 pt-5 pb-4 overflow-x-auto">
          <div class="flex items-start min-w-[300px]">
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
                    <LocationDropdown
                      v-model="form.city"
                      :options="cityOptions"
                      placeholder="İl seçin..."
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label class="text-label-sm font-semibold text-on-surface-variant">İlçe *</label>
                    <LocationDropdown
                      v-model="form.district"
                      :options="districtOptions"
                      :disabled="!form.city"
                      placeholder="İlçe seçin..."
                    />
                  </div>
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-label-sm font-semibold text-on-surface-variant">
                    Mahalle
                    <span class="font-normal ml-1 text-on-surface-variant/60">(isteğe bağlı)</span>
                  </label>
                  <LocationDropdown
                    v-model="form.neighborhood"
                    :options="neighborhoodOpts"
                    :disabled="!form.district"
                    placeholder="Mahalle seçin..."
                  />
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
                      <input class="input pl-7" type="text" inputmode="numeric" :value="priceDisplay"
                        @focus="priceDisplay = form.price !== '' ? String(form.price) : ''"
                        @input="onPriceInput"
                        @blur="onPriceBlur($event)"
                        placeholder="12.500.000" />
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
        <div class="shrink-0 flex items-center justify-end gap-3 px-4 md:px-8 py-4 border-t border-outline-variant bg-surface">
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
