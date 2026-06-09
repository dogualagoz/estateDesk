<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import { resolveImgUrl } from '@/utils/image';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  type Portfolio,
  type PropertyType,
} from '@/types/portfolio';

const route  = useRoute();
const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();
const item      = ref<Portfolio | null>(null);
const loading   = ref(true);
const uploading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const activeImg = ref(0);

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

const mainImage   = computed(() => {
  const url = item.value?.images?.[activeImg.value] ?? null;
  return url ? resolveImgUrl(url) : null;
});
const hasImages   = computed(() => (item.value?.images?.length ?? 0) > 0);
const gradient    = computed(() => item.value ? TYPE_GRADIENTS[item.value.type] : '');
const location    = computed(() => {
  if (!item.value) return '';
  return [item.value.neighborhood, item.value.district, item.value.city].filter(Boolean).join(', ');
});

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return '₺' + new Intl.NumberFormat('tr-TR').format(n);
}

async function load() {
  loading.value = true;
  try {
    item.value   = await portfolioService.get(route.params.id as string);
    activeImg.value = 0;
  } finally {
    loading.value = false;
  }
}

async function remove() {
  if (!item.value) return;
  const ok = await confirm({
    title: 'Portföyü sil',
    message: 'Bu portföyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
    danger: true,
    icon: 'delete',
  });
  if (!ok) return;
  try {
    await portfolioService.remove(item.value.id);
    toast.success('Portföy silindi');
    router.push('/portfolio');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Portföy silinemedi');
  }
}

function pickImages() { fileInput.value?.click(); }

async function onFilesSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files?.length || !item.value) return;
  uploading.value = true;
  try {
    item.value = await portfolioService.uploadImages(item.value.id, Array.from(input.files));
  } finally {
    uploading.value = false;
    input.value = '';
  }
}

async function removeImage(url: string) {
  if (!item.value) return;
  const filename = url.split('/').pop()!;
  item.value = await portfolioService.deleteImage(item.value.id, filename);
  if (activeImg.value >= (item.value.images?.length ?? 0)) activeImg.value = 0;
}

onMounted(load);
</script>

<template>
  <div class="flex flex-col md:h-screen md:overflow-hidden">

    <!-- ── Header ── -->
    <div class="shrink-0 flex items-center justify-between gap-2 px-4 md:px-8 py-5 border-b border-outline-variant bg-surface">
      <div class="flex items-center gap-3">
        <button
          class="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"
          @click="router.push('/portfolio')"
        >
          <span class="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div v-if="item">
          <h1 class="text-headline-md font-semibold text-on-surface tracking-tight">
            {{ item.title || (PROPERTY_TYPE_LABELS[item.type] + ' — ' + item.city + ' / ' + item.district) }}
          </h1>
          <p class="text-label-md text-on-surface-variant mt-0.5">Portföy Detayı</p>
        </div>
        <div v-else-if="loading">
          <div class="h-5 w-48 bg-surface-container rounded animate-pulse" />
        </div>
      </div>
      <div v-if="item" class="flex gap-2 shrink-0">
        <button class="btn" @click="router.push(`/portfolio/${item.id}/edit`)">
          <span class="material-symbols-outlined text-[18px]">edit</span>
          <span class="hidden sm:inline">Düzenle</span>
        </button>
        <button class="btn danger" @click="remove">
          <span class="material-symbols-outlined text-[18px]">delete</span>
          <span class="hidden sm:inline">Sil</span>
        </button>
      </div>
    </div>

    <!-- ── Loading / Not Found ── -->
    <div v-if="loading" class="flex-1 flex items-center justify-center text-on-surface-variant">
      Yükleniyor…
    </div>
    <div v-else-if="!item" class="flex-1 flex items-center justify-center text-on-surface-variant">
      Portföy bulunamadı.
    </div>

    <!-- ── Body: mobilde dikey istif, masaüstünde iki sütun ── -->
    <div v-else class="flex-1 flex flex-col md:flex-row md:overflow-hidden">

      <!-- ────────────────────────────────────────────────────
           Sol: Görsel Panel
      ──────────────────────────────────────────────────── -->
      <div class="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-outline-variant flex flex-col overflow-hidden">

        <!-- hidden file input -->
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          class="hidden"
          @change="onFilesSelected"
        />

        <!-- Ana görsel alanı -->
        <div
          class="relative flex-1 min-h-[260px] md:min-h-0 flex flex-col justify-end p-8 overflow-hidden transition-all duration-700"
          :style="mainImage ? {} : { background: gradient }"
        >
          <!-- Arka plan görseli -->
          <img
            v-if="mainImage"
            :src="mainImage"
            class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
            alt="Portföy görseli"
          />

          <!-- Koyu gradyan overlay -->
          <div
            v-if="mainImage"
            class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
          />

          <!-- Dekoratif daireler (görselsiz) -->
          <template v-if="!mainImage">
            <div class="absolute top-6 right-6 w-40 h-40 rounded-full bg-white/10" />
            <div class="absolute top-16 right-20 w-20 h-20 rounded-full bg-white/10" />
            <div class="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-white/10" />
          </template>

          <!-- Sağ üst: görsel sayaç + ekle butonu -->
          <div class="absolute top-4 right-4 z-10 flex items-center gap-2">
            <span
              v-if="hasImages"
              class="px-2.5 py-1 rounded-full bg-black/50 text-white text-label-sm backdrop-blur-sm"
            >
              {{ activeImg + 1 }} / {{ item.images.length }}
            </span>
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-label-sm font-medium transition-all"
              :disabled="uploading"
              @click="pickImages"
            >
              <span v-if="uploading" class="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-[15px]">add_photo_alternate</span>
              {{ uploading ? 'Yükleniyor…' : 'Görsel Ekle' }}
            </button>
          </div>

          <!-- Badge'ler -->
          <div class="relative z-10 flex gap-2 mb-4">
            <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/90 text-on-surface tracking-wide">
              {{ LISTING_TYPE_LABELS[item.listingType] }}
            </span>
            <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/70 text-on-surface tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">{{ TYPE_ICONS[item.type] }}</span>
              {{ PROPERTY_TYPE_LABELS[item.type] }}
            </span>
            <span
              v-if="item.visibility === 'HIDDEN'"
              class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-amber-500/80 text-white tracking-wide flex items-center gap-1"
            >
              <span class="material-symbols-outlined text-[14px]">visibility_off</span>
              Gizli
            </span>
          </div>

          <!-- Başlık + Konum -->
          <h2 class="relative z-10 text-[22px] font-bold text-white leading-snug drop-shadow mb-2">
            {{ item.title || (PROPERTY_TYPE_LABELS[item.type] + ' — ' + item.district) }}
          </h2>
          <p class="relative z-10 text-white/80 text-label-md flex items-center gap-1 mb-4">
            <span class="material-symbols-outlined text-[16px]">location_on</span>
            {{ location }}
          </p>

          <!-- Fiyat + metrekare bar -->
          <div class="relative z-10 bg-white/15 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
            <span class="text-[24px] font-extrabold text-white drop-shadow">{{ fmtPrice(item.price) }}</span>
            <div class="flex gap-4 text-white/80 text-label-sm">
              <span v-if="item.areaSqm" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">straighten</span>{{ item.areaSqm }} m²
              </span>
              <span v-if="item.roomCount" class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[15px]">door_open</span>{{ item.roomCount }}
              </span>
            </div>
          </div>
        </div>

        <!-- Alt şerit: thumbnail strip -->
        <div class="shrink-0 bg-surface-container-lowest border-t border-outline-variant px-6 py-4">
          <div v-if="hasImages" class="flex gap-2 overflow-x-auto pb-1">
            <div
              v-for="(url, i) in item.images"
              :key="url"
              class="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 cursor-pointer transition-all"
              :class="i === activeImg
                ? 'border-primary shadow-md scale-105'
                : 'border-outline-variant hover:border-primary/50'"
              @click="activeImg = i"
            >
              <img :src="resolveImgUrl(url)" class="w-full h-full object-cover" alt="" />
            </div>
          </div>

          <!-- Özellik chip'leri -->
          <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2" :class="hasImages ? 'mt-3' : ''">
            Özellikler
          </p>
          <div v-if="item.features.length" class="flex flex-wrap gap-2">
            <span
              v-for="f in item.features.slice(0, 8)" :key="f"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary-fixed text-on-primary-fixed-variant"
            >{{ f }}</span>
            <span
              v-if="item.features.length > 8"
              class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant"
            >+{{ item.features.length - 8 }}</span>
          </div>
          <p v-else class="text-label-sm text-on-surface-variant/50 italic">Özellik eklenmemiş</p>
        </div>
      </div>

      <!-- ────────────────────────────────────────────────────
           Sağ: Detay Bölümleri (read-only)
      ──────────────────────────────────────────────────── -->
      <div class="w-full md:w-1/2 flex flex-col md:overflow-hidden">

        <!-- Kaydırılabilir içerik -->
        <div class="flex-1 md:overflow-y-auto px-4 md:px-8 py-6 space-y-4">

          <!-- Bölüm 1: Temel Bilgiler -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Temel Bilgiler</p>
            <div class="flex items-center gap-4">
              <!-- Tip kutusu -->
              <div
                class="flex flex-col items-center gap-1.5 px-5 py-4 rounded-xl border-2 border-primary bg-primary-fixed/60 text-on-surface min-w-[88px]"
              >
                <span class="material-symbols-outlined text-[28px] text-primary">{{ TYPE_ICONS[item.type] }}</span>
                <span class="text-label-sm font-semibold">{{ PROPERTY_TYPE_LABELS[item.type] }}</span>
              </div>
              <!-- İlan tipi -->
              <div
                class="flex-1 py-3 rounded-xl text-label-md font-semibold border-2 text-center transition-all"
                :class="item.listingType === 'SALE'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-blue-600 text-white border-blue-600'"
              >
                {{ LISTING_TYPE_LABELS[item.listingType] }}
              </div>
              <!-- Görünürlük -->
              <div
                class="flex-1 py-3 rounded-xl text-label-md font-semibold border-2 text-center"
                :class="item.visibility === 'HIDDEN'
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'"
              >
                <span class="material-symbols-outlined text-[16px] align-middle mr-1">
                  {{ item.visibility === 'HIDDEN' ? 'visibility_off' : 'visibility' }}
                </span>
                {{ item.visibility === 'HIDDEN' ? 'Gizli' : 'Açık' }}
              </div>
            </div>
          </div>

          <!-- Bölüm 2: Konum -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Konum</p>
            <div class="space-y-3">
              <div v-if="item.title" class="flex flex-col gap-1">
                <span class="text-label-sm font-semibold text-on-surface-variant">İlan Başlığı</span>
                <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">
                  {{ item.title }}
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <span class="text-label-sm font-semibold text-on-surface-variant">İl</span>
                  <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">{{ item.city }}</div>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-label-sm font-semibold text-on-surface-variant">İlçe</span>
                  <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">{{ item.district }}</div>
                </div>
              </div>
              <div v-if="item.neighborhood" class="flex flex-col gap-1">
                <span class="text-label-sm font-semibold text-on-surface-variant">Mahalle</span>
                <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">{{ item.neighborhood }}</div>
              </div>
            </div>
          </div>

          <!-- Bölüm 3: Detaylar & Fiyat -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">Detaylar & Fiyat</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1">
                <span class="text-label-sm font-semibold text-on-surface-variant">Brüt m²</span>
                <div class="input bg-surface-container/50 text-on-surface cursor-default flex items-center justify-between">
                  <span>{{ item.areaSqm }}</span>
                  <span class="text-on-surface-variant text-label-sm">m²</span>
                </div>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-label-sm font-semibold text-on-surface-variant">Fiyat</span>
                <div class="input bg-primary-fixed/40 text-primary font-semibold cursor-default flex items-center gap-1">
                  {{ fmtPrice(item.price) }}
                </div>
              </div>
              <div v-if="item.roomCount" class="col-span-2 flex flex-col gap-1">
                <span class="text-label-sm font-semibold text-on-surface-variant">Oda Sayısı</span>
                <div class="flex gap-2">
                  <span
                    class="px-4 py-2 rounded-lg text-label-md border-2 font-semibold bg-primary text-on-primary border-primary"
                  >{{ item.roomCount }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bölüm 4: İletişim & Notlar -->
          <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-6">
            <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-4">İletişim & Notlar</p>
            <div class="space-y-4">
              <!-- Mal sahibi -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <span class="text-label-sm font-semibold text-on-surface-variant">Mal Sahibi</span>
                  <div class="input bg-surface-container/50 text-on-surface cursor-default flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                    {{ item.ownerName }}
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-label-sm font-semibold text-on-surface-variant">Telefon</span>
                  <div class="input bg-surface-container/50 text-on-surface cursor-default flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-on-surface-variant">phone</span>
                    {{ item.ownerPhone }}
                  </div>
                </div>
              </div>

              <!-- Ekleyen + Tarih -->
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <span class="text-label-sm font-semibold text-on-surface-variant">Ekleyen</span>
                  <div class="input bg-surface-container/50 text-on-surface-variant cursor-default text-label-sm">
                    {{ item.createdBy?.fullName || '—' }}
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-label-sm font-semibold text-on-surface-variant">Tarih</span>
                  <div class="input bg-surface-container/50 text-on-surface-variant cursor-default text-label-sm">
                    {{ new Date(item.createdAt).toLocaleString('tr-TR') }}
                  </div>
                </div>
              </div>

              <!-- Not -->
              <div v-if="item.note" class="flex flex-col gap-1">
                <div class="flex items-center gap-2">
                  <span class="text-label-sm font-semibold text-on-surface-variant">İç Notlar</span>
                  <span
                    v-if="item.visibility === 'HIDDEN'"
                    class="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold"
                  >
                    <span class="material-symbols-outlined text-[12px]">visibility_off</span>
                    Sadece Bana Özel
                  </span>
                </div>
                <div class="textarea bg-surface-container/50 text-on-surface cursor-default select-text whitespace-pre-wrap min-h-[72px]">
                  {{ item.note }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ── Alt bar ── -->
        <div class="shrink-0 flex items-center justify-end gap-3 px-4 md:px-8 py-4 border-t border-outline-variant bg-surface">
          <button type="button" class="btn" @click="router.push('/portfolio')">
            <span class="material-symbols-outlined text-[18px]">arrow_back</span>
            Geri Dön
          </button>
          <button type="button" class="btn" @click="router.push(`/portfolio/${item.id}/edit`)">
            <span class="material-symbols-outlined text-[18px]">edit</span>
            Düzenle
          </button>
          <button type="button" class="btn danger" @click="remove">
            <span class="material-symbols-outlined text-[18px]">delete</span>
            Sil
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
