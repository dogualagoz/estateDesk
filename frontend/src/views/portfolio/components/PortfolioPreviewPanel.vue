<script setup lang="ts">
import { computed } from 'vue';
import { resolveImgUrl } from '@/utils/image';
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, type PropertyType } from '@/types/portfolio';
import { usePortfolioFormContext } from '../portfolio-form-context';
import type { PortfolioImages } from '../composables/usePortfolioImages';

/**
 * Portföy formunun sol paneli: canlı ilan önizlemesi + görsel yükleme
 * (sürükle-bırak, thumbnail şeridi). Görsel durumu ana view'ın
 * usePortfolioImages composable'ından prop olarak gelir.
 */
const props = defineProps<{
  images: PortfolioImages;
  isEdit: boolean;
}>();

const { form } = usePortfolioFormContext();
const img = props.images;

const TYPE_GRADIENTS: Record<PropertyType, string> = {
  APARTMENT: 'linear-gradient(135deg, #4e604f 0%, #7D907D 100%)',
  VILLA:     'linear-gradient(135deg, #a67c52 0%, #c9a06e 100%)',
  LAND:      'linear-gradient(135deg, #5a7a3c 0%, #85b55f 100%)',
  HOTEL:     'linear-gradient(135deg, #2d6a8f 0%, #4a9abf 100%)',
  SHOP:      'linear-gradient(135deg, #b05e2c 0%, #d98048 100%)',
  OFFICE:    'linear-gradient(135deg, #4a4f5e 0%, #6e7585 100%)',
};

const previewTitle = computed(() => {
  if (form.title) return form.title;
  const typeLabel = PROPERTY_TYPE_LABELS[form.type];
  const parts = [form.neighborhood, form.district, form.city].filter(Boolean);
  return parts.length ? `${typeLabel} — ${parts.join(', ')}` : typeLabel;
});
const previewLocation = computed(
  () => [form.neighborhood, form.district, form.city].filter(Boolean).join(', ') || '—',
);
const previewPrice = computed(() =>
  form.price ? '₺' + Number(form.price).toLocaleString('tr-TR') : '—',
);
const previewGradient = computed(() => TYPE_GRADIENTS[form.type]);
</script>

<template>
  <div class="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container/40 flex flex-col overflow-hidden">
    <!-- hidden file input -->
    <input
      :ref="(el) => (img.fileInput.value = el as HTMLInputElement | null)"
      type="file"
      multiple
      accept="image/jpeg,image/png,image/webp"
      class="hidden"
      @change="img.onFilePick"
    />

    <!-- Gradient / Fotoğraf alanı -->
    <div
      class="relative flex-1 min-h-[260px] md:min-h-0 flex flex-col justify-end p-8 transition-all duration-700 overflow-hidden"
      :style="img.allPreviewUrls.value.length ? {} : { background: previewGradient }"
      @dragover.prevent="img.isDragging.value = true"
      @dragleave.prevent="img.isDragging.value = false"
      @drop.prevent="img.onDrop"
    >
      <!-- Arka plan fotoğrafı -->
      <img
        v-if="img.allPreviewUrls.value.length"
        :src="img.allPreviewUrls.value[img.activeIndex.value]"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        alt="Ön izleme"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
      />

      <!-- Fotoğraf varken okunabilirlik için koyu gradyan -->
      <div
        v-if="img.allPreviewUrls.value.length"
        class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      />

      <!-- Dekoratif daireler — sadece fotoğrafsız -->
      <template v-if="!img.allPreviewUrls.value.length">
        <div class="absolute top-6 right-6 w-40 h-40 rounded-full bg-white/10" />
        <div class="absolute top-16 right-20 w-20 h-20 rounded-full bg-white/10" />
        <div class="absolute bottom-24 left-6 w-12 h-12 rounded-full bg-white/10" />
      </template>

      <!-- Sürükle-bırak overlay -->
      <Transition name="fade">
        <div
          v-if="img.isDragging.value"
          class="absolute inset-4 z-20 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/70 bg-black/30 backdrop-blur-sm"
        >
          <span class="material-symbols-outlined text-white text-[52px]">cloud_upload</span>
          <p class="text-white font-semibold mt-2 text-label-md">Bırakın, yüklensin</p>
        </div>
      </Transition>

      <!-- Fotoğraf ekle butonu — fotoğraf yokken ortada -->
      <Transition name="fade">
        <div
          v-if="!img.allPreviewUrls.value.length && !img.isDragging.value"
          class="absolute inset-0 flex flex-col items-center justify-center z-10 gap-3"
        >
          <button
            type="button"
            class="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white transition-all duration-200"
            @click="img.pickFiles"
          >
            <span class="material-symbols-outlined text-[36px]">add_photo_alternate</span>
            <span class="text-label-md font-semibold">Fotoğraf Ekle</span>
          </button>
          <p class="text-white/60 text-label-sm">veya sürükleyip bırakın</p>
        </div>
      </Transition>

      <!-- Fotoğraf varken sağ üst: ekle butonu + sayaç -->
      <div v-if="img.allPreviewUrls.value.length" class="absolute top-4 right-4 z-10 flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-full bg-black/50 text-white text-label-sm backdrop-blur-sm">
          {{ img.allPreviewUrls.value.length }} fotoğraf
        </span>
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-label-sm font-medium transition-all"
          @click="img.pickFiles"
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
      <div v-if="img.allPreviewUrls.value.length" class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <!-- Mevcut sunucu görselleri (edit modu) -->
        <div
          v-for="(url, i) in img.existingImages.value"
          :key="url"
          class="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all group cursor-pointer"
          :class="img.activeIndex.value === i ? 'border-primary shadow-md' : 'border-outline-variant hover:border-primary/50'"
          @click="img.activeIndex.value = i"
        >
          <img :src="resolveImgUrl(url)" class="w-full h-full object-cover" alt="" />
          <button
            v-if="isEdit"
            type="button"
            class="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            @click.stop="img.removeExistingImage(url)"
          >
            <span class="material-symbols-outlined text-[12px]">close</span>
          </button>
        </div>
        <!-- Bekleyen yeni görseller -->
        <div
          v-for="(url, i) in img.previewUrls.value"
          :key="url"
          class="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all group cursor-pointer"
          :class="img.activeIndex.value === img.existingImages.value.length + i ? 'border-primary shadow-md' : 'border-outline-variant hover:border-primary/50'"
          @click="img.activeIndex.value = img.existingImages.value.length + i"
        >
          <img :src="url" class="w-full h-full object-cover" alt="" />
          <button
            type="button"
            class="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
            @click.stop="img.removePreview(i)"
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
        <span
          v-if="form.features.length > 6"
          class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant"
        >+{{ form.features.length - 6 }}</span>
      </div>
      <p v-else class="text-label-sm text-on-surface-variant/50 italic">Özellik seçilmedi</p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
