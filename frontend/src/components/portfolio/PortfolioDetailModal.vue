<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { resolveImgUrl } from '@/utils/image';
import {
  PROPERTY_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  type Portfolio,
  type PropertyType,
} from '@/types/portfolio';

const props = withDefaults(
  defineProps<{
    portfolio: Portfolio | null;
    /** Eşleştirme butonu yalnızca kayıtlı talepte (edit modu) gösterilir. */
    canPin?: boolean;
    /** Bu portföy bu talebe eşleştirilmiş mi? */
    pinned?: boolean;
    /** Pop-up'ın büyüyeceği başlangıç noktası (tıklanan kartın merkezi, viewport koordinatı). */
    origin?: { x: number; y: number } | null;
    /** Ziyaretçi modu: satıcı iletişimi ve dahili kısayolları gizler. */
    hideContact?: boolean;
  }>(),
  { canPin: false, pinned: false, origin: null, hideContact: false },
);
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-pin', id: string): void;
}>();

const router = useRouter();
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

const hasImages = computed(() => (props.portfolio?.images?.length ?? 0) > 0);
const mainImage = computed(() => {
  const url = props.portfolio?.images?.[activeImg.value] ?? null;
  return url ? resolveImgUrl(url) : null;
});
const gradient = computed(() => (props.portfolio ? TYPE_GRADIENTS[props.portfolio.type] : ''));
const location = computed(() => {
  if (!props.portfolio) return '';
  return [props.portfolio.neighborhood, props.portfolio.district, props.portfolio.city]
    .filter(Boolean)
    .join(', ');
});

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return '₺' + new Intl.NumberFormat('tr-TR').format(n);
}

// Tıklanan kartın merkezinden büyüyen açılış: pop-up'ın başlangıç ötelemesi
const popStyle = computed(() => {
  if (!props.origin) return {};
  const dx = props.origin.x - window.innerWidth / 2;
  const dy = props.origin.y - window.innerHeight / 2;
  return { '--pop-dx': `${dx}px`, '--pop-dy': `${dy}px` };
});

// Yeni portföy açıldığında ilk görsele dön
watch(() => props.portfolio?.id, () => { activeImg.value = 0; });

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close');
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

function goToDetail() {
  if (props.portfolio) router.push(`/portfolio/${props.portfolio.id}`);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="portfolio"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
        @click.self="emit('close')"
      >
        <!-- Karartma -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-[2px]" @click="emit('close')" />

        <!-- Pop-up kart -->
        <div
          class="relative z-10 w-full max-w-4xl max-h-[88vh] bg-surface rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-modal-pop"
          :style="popStyle"
        >
          <!-- Kapat -->
          <button
            type="button"
            class="absolute top-3 right-3 z-20 flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors"
            title="Kapat (Esc)"
            @click="emit('close')"
          >
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>

          <div class="flex flex-col md:flex-row flex-1 overflow-hidden">
            <!-- ── Sol: Görsel ── -->
            <div class="md:w-1/2 flex flex-col bg-surface-container-lowest shrink-0">
              <div
                class="relative flex-1 min-h-[240px] flex flex-col justify-end p-6 overflow-hidden"
                :style="mainImage ? {} : { background: gradient }"
              >
                <img
                  v-if="mainImage"
                  :src="mainImage"
                  class="absolute inset-0 w-full h-full object-cover"
                  alt="Portföy görseli"
                />
                <div
                  v-if="mainImage"
                  class="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent"
                />
                <template v-if="!mainImage">
                  <div class="absolute top-6 right-6 w-32 h-32 rounded-full bg-white/10" />
                  <div class="absolute bottom-16 left-6 w-12 h-12 rounded-full bg-white/10" />
                </template>

                <span
                  v-if="hasImages"
                  class="absolute top-4 left-4 px-2.5 py-1 rounded-full bg-black/50 text-white text-label-sm backdrop-blur-sm"
                >
                  {{ activeImg + 1 }} / {{ portfolio.images.length }}
                </span>

                <!-- Badge'ler -->
                <div class="relative z-10 flex flex-wrap gap-2 mb-3">
                  <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/90 text-on-surface tracking-wide">
                    {{ LISTING_TYPE_LABELS[portfolio.listingType] }}
                  </span>
                  <span class="px-3 py-1.5 rounded-full text-[12px] font-bold bg-white/70 text-on-surface tracking-wide flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">{{ TYPE_ICONS[portfolio.type] }}</span>
                    {{ PROPERTY_TYPE_LABELS[portfolio.type] }}
                  </span>
                </div>

                <h2 class="relative z-10 text-[20px] font-bold text-white leading-snug drop-shadow mb-1.5">
                  {{ portfolio.title || (PROPERTY_TYPE_LABELS[portfolio.type] + ' — ' + portfolio.district) }}
                </h2>
                <p class="relative z-10 text-white/80 text-label-md flex items-center gap-1 mb-3">
                  <span class="material-symbols-outlined text-[16px]">location_on</span>
                  {{ location }}
                </p>

                <div class="relative z-10 bg-white/15 backdrop-blur-sm rounded-xl p-3.5 flex items-center justify-between">
                  <span class="text-[22px] font-extrabold text-white drop-shadow">{{ fmtPrice(portfolio.price) }}</span>
                  <div class="flex gap-4 text-white/80 text-label-sm">
                    <span v-if="portfolio.areaSqm" class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-[15px]">straighten</span>{{ portfolio.areaSqm }} m²
                    </span>
                    <span v-if="portfolio.roomCount" class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-[15px]">door_open</span>{{ portfolio.roomCount }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Thumbnail şeridi -->
              <div v-if="hasImages" class="shrink-0 border-t border-outline-variant px-5 py-3">
                <div class="flex gap-2 overflow-x-auto pb-1">
                  <div
                    v-for="(url, i) in portfolio.images"
                    :key="url"
                    class="shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all"
                    :class="i === activeImg ? 'border-primary shadow-md scale-105' : 'border-outline-variant hover:border-primary/50'"
                    @click="activeImg = i"
                  >
                    <img :src="resolveImgUrl(url)" class="w-full h-full object-cover" alt="" />
                  </div>
                </div>
              </div>
            </div>

            <!-- ── Sağ: Detaylar ── -->
            <div class="md:w-1/2 flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <!-- Konum -->
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Konum</p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <span class="text-label-sm font-semibold text-on-surface-variant">İl</span>
                    <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">{{ portfolio.city }}</div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-label-sm font-semibold text-on-surface-variant">İlçe</span>
                    <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">{{ portfolio.district }}</div>
                  </div>
                  <div v-if="portfolio.neighborhood" class="col-span-2 flex flex-col gap-1">
                    <span class="text-label-sm font-semibold text-on-surface-variant">Mahalle</span>
                    <div class="input bg-surface-container/50 text-on-surface cursor-default select-text">{{ portfolio.neighborhood }}</div>
                  </div>
                </div>
              </div>

              <!-- Özellikler -->
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">Özellikler</p>
                <div v-if="portfolio.features.length" class="flex flex-wrap gap-2">
                  <span
                    v-for="f in portfolio.features" :key="f"
                    class="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary-fixed text-on-primary-fixed-variant"
                  >{{ f }}</span>
                </div>
                <p v-else class="text-label-sm text-on-surface-variant/50 italic">Özellik eklenmemiş</p>
              </div>

              <!-- İletişim -->
              <div v-if="!hideContact" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">İletişim</p>
                <div class="grid grid-cols-2 gap-3">
                  <div class="flex flex-col gap-1">
                    <span class="text-label-sm font-semibold text-on-surface-variant">Mal Sahibi</span>
                    <div class="input bg-surface-container/50 text-on-surface cursor-default flex items-center gap-2">
                      <span class="material-symbols-outlined text-[16px] text-on-surface-variant">person</span>
                      {{ portfolio.ownerName }}
                    </div>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-label-sm font-semibold text-on-surface-variant">Telefon</span>
                    <div class="input bg-surface-container/50 text-on-surface cursor-default flex items-center gap-2">
                      <span class="material-symbols-outlined text-[16px] text-on-surface-variant">phone</span>
                      {{ portfolio.ownerPhone }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Not -->
              <div v-if="portfolio.note" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-3">İç Notlar</p>
                <div class="textarea bg-surface-container/50 text-on-surface cursor-default select-text whitespace-pre-wrap min-h-[60px]">
                  {{ portfolio.note }}
                </div>
              </div>
            </div>
          </div>

          <!-- Alt bar -->
          <div class="shrink-0 flex items-center gap-2 px-6 py-3.5 border-t border-outline-variant bg-surface">
            <!-- Eşleştir / Eşleştirmeyi kaldır -->
            <button
              v-if="canPin"
              type="button"
              class="btn"
              :class="pinned ? 'danger' : 'primary'"
              @click="emit('toggle-pin', portfolio.id)"
            >
              <span class="material-symbols-outlined text-[18px]">{{ pinned ? 'bookmark_remove' : 'bookmark_add' }}</span>
              {{ pinned ? 'Eşleştirmeyi Kaldır' : 'Eşleştir' }}
            </button>

            <div class="flex-1"></div>

            <a
              v-if="!hideContact"
              :href="`tel:${portfolio.ownerPhone}`"
              class="btn"
              :class="canPin ? '' : 'primary'"
            >
              <span class="material-symbols-outlined text-[18px]">call</span>
              Ara — {{ portfolio.ownerName }}
            </a>
            <button v-if="!hideContact" type="button" class="btn" @click="goToDetail">
              <span class="material-symbols-outlined text-[18px]">open_in_new</span>
              Tam Detay
            </button>
            <button type="button" class="btn" :class="hideContact ? 'primary' : ''" @click="emit('close')">Kapat</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active { transition: opacity 0.2s ease; }
.modal-leave-active { transition: opacity 0.15s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

@keyframes modal-pop {
  0%   { transform: translate(var(--pop-dx, 0px), var(--pop-dy, 0px)) scale(0.12); opacity: 0; }
  60%  { opacity: 1; }
  100% { transform: translate(0, 0) scale(1); opacity: 1; }
}
.animate-modal-pop {
  transform-origin: center center;
  animation: modal-pop 0.28s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  will-change: transform, opacity;
}
</style>
