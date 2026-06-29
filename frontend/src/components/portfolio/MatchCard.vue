<script setup lang="ts">
import { resolveImgUrl } from '@/utils/image';
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from '@/types/portfolio';
import { DIMENSION_LABELS, type DimensionKey, type ScoredPortfolio } from '@/types/matching';

const props = withDefaults(
  defineProps<{
    scored: ScoredPortfolio;
    /** Bu portföy talebe eşleştirilmiş mi (görsel vurgu). */
    pinned?: boolean;
    /** Eşleştir/kaldır butonu gösterilsin mi (yalnız kayıtlı talep). */
    canPin?: boolean;
    /** Kart sürüklenebilir mi (sol panele bırakıp eşleştirme). */
    draggable?: boolean;
    /** Satıcı iletişim butonu gizlensin mi (ziyaretçi modu). */
    hideContact?: boolean;
    /** Yeni eşleştirildi pop animasyonu. */
    justPinned?: boolean;
  }>(),
  { pinned: false, canPin: false, draggable: false, hideContact: false, justPinned: false },
);

const emit = defineEmits<{
  (e: 'toggle-pin', id: string): void;
  (e: 'preview', portfolio: ScoredPortfolio['portfolio'], ev: MouseEvent): void;
  (e: 'dragstart', id: string): void;
  (e: 'dragend'): void;
}>();

function fmtPrice(p: string | number) {
  return '₺' + Number(p).toLocaleString('tr-TR');
}
function locationOf(p: ScoredPortfolio['portfolio']) {
  return [p.neighborhood, p.district, p.city].filter(Boolean).join(', ');
}
function dimLabel(k: DimensionKey) {
  return DIMENSION_LABELS[k];
}
const activeBreakdown = (r: ScoredPortfolio) => r.breakdown.filter((b) => b.active);

function scoreBadgeBg(s: number) {
  if (s >= 80) return 'bg-emerald-600/90';
  if (s >= 60) return 'bg-lime-600/90';
  if (s >= 40) return 'bg-amber-500/90';
  if (s >= 20) return 'bg-orange-500/90';
  return 'bg-red-600/90';
}
function dimBarColor(score: number) {
  const s = score * 100;
  if (s >= 80) return 'bg-emerald-500';
  if (s >= 60) return 'bg-lime-500';
  if (s >= 40) return 'bg-amber-500';
  if (s >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}
function dimTextColor(score: number) {
  const s = score * 100;
  if (s >= 80) return 'text-emerald-600';
  if (s >= 60) return 'text-lime-600';
  if (s >= 40) return 'text-amber-600';
  if (s >= 20) return 'text-orange-600';
  return 'text-red-600';
}
</script>

<template>
  <div
    :draggable="draggable"
    @dragstart="emit('dragstart', scored.portfolio.id)"
    @dragend="emit('dragend')"
    @click="emit('preview', scored.portfolio, $event)"
    class="rounded-2xl overflow-hidden border flex flex-col hover:-translate-y-0.5 transition-all duration-200 select-none cursor-pointer"
    :class="[
      pinned
        ? 'border-2 border-primary bg-primary/[0.03] shadow-[0_0_0_3px_rgba(78,96,79,0.15),0_2px_8px_rgba(0,0,0,0.08)]'
        : 'border border-outline-variant/50 bg-white shadow-sm hover:shadow-md',
      justPinned ? 'animate-pin-pop' : '',
    ]"
  >
    <!-- Görsel -->
    <div class="relative w-full h-52 bg-surface-container shrink-0">
      <img
        v-if="scored.portfolio.images?.length"
        :src="resolveImgUrl(scored.portfolio.images[0])"
        :alt="scored.portfolio.title ?? undefined"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex flex-col items-center justify-center bg-surface-container">
        <span class="material-symbols-outlined text-[48px] text-on-surface-variant/20">apartment</span>
      </div>

      <!-- Sol üst: ilan tipi -->
      <div class="absolute top-3 left-3">
        <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/40 text-white backdrop-blur-sm">
          {{ LISTING_TYPE_LABELS[scored.portfolio.listingType] }}
        </span>
      </div>

      <!-- Eşleştirildi görsel overlay -->
      <div v-if="pinned" class="absolute inset-0 bg-primary/10 pointer-events-none" />

      <!-- Sol alt: eşleştirildi şerit rozeti -->
      <div
        v-if="pinned"
        class="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1.5 bg-primary text-on-primary text-[11px] font-bold tracking-wide"
      >
        <span class="material-symbols-outlined text-[13px]">bookmark</span>
        EŞLEŞTİRİLDİ
      </div>

      <!-- Sağ üst: pin butonu -->
      <div class="absolute top-3 right-3">
        <button
          v-if="canPin"
          type="button"
          @click.stop="emit('toggle-pin', scored.portfolio.id)"
          class="flex items-center justify-center w-9 h-9 rounded-xl backdrop-blur-md shadow-md transition-all duration-150"
          :class="pinned
            ? 'bg-primary text-on-primary scale-110'
            : 'bg-black/40 text-white hover:bg-primary hover:text-on-primary hover:scale-110'"
          :title="pinned ? 'Eşleştirmeyi kaldır' : 'Bu talebe eşleştir'"
        >
          <span class="material-symbols-outlined text-[18px]">{{ pinned ? 'bookmark' : 'bookmark_add' }}</span>
        </button>
      </div>

      <!-- Skor badge: pinned ise üstte, değilse altta -->
      <div
        class="absolute flex flex-col items-center justify-center w-[52px] h-[52px] rounded-2xl backdrop-blur-md shadow-lg transition-all duration-300"
        :class="[pinned ? 'bottom-10 right-3' : 'bottom-3 right-3', scoreBadgeBg(scored.score)]"
      >
        <span class="text-[22px] font-black leading-none text-white">{{ scored.score }}</span>
        <span class="text-[9px] font-semibold text-white/70 uppercase tracking-wide leading-none mt-0.5">puan</span>
      </div>
    </div>

    <!-- Bilgi alanı -->
    <div class="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2">
      <h3 class="text-[13px] font-semibold text-on-surface leading-snug line-clamp-2">
        {{ scored.portfolio.title || PROPERTY_TYPE_LABELS[scored.portfolio.type] }}
      </h3>

      <p class="text-[18px] font-black text-primary leading-none tracking-tight">
        {{ fmtPrice(scored.portfolio.price) }}
      </p>

      <p class="text-[11px] text-on-surface-variant flex items-center gap-0.5">
        <span class="material-symbols-outlined text-[12px] shrink-0">location_on</span>
        <span class="truncate">{{ locationOf(scored.portfolio) }}</span>
      </p>

      <div class="flex items-center gap-3 text-[11px] text-on-surface-variant">
        <span class="flex items-center gap-0.5 font-medium">
          <span class="material-symbols-outlined text-[12px]">straighten</span>{{ scored.portfolio.areaSqm }} m²
        </span>
        <span class="flex items-center gap-0.5 font-medium">
          <span class="material-symbols-outlined text-[12px]">door_open</span>{{ scored.portfolio.roomCount }}
        </span>
      </div>

      <!-- Dimension uyum çubukları -->
      <div class="grid grid-cols-5 gap-2 py-1.5">
        <div v-for="b in activeBreakdown(scored)" :key="b.key">
          <div class="flex items-center justify-between mb-1">
            <span class="text-[10px] font-medium text-on-surface-variant/80 leading-none">{{ dimLabel(b.key) }}</span>
            <span class="text-[11px] font-bold leading-none" :class="dimTextColor(b.score)">
              {{ Math.round(b.score * 100) }}
            </span>
          </div>
          <div class="h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500"
              :class="dimBarColor(b.score)"
              :style="{ width: (b.score * 100) + '%' }"
            />
          </div>
        </div>
      </div>

      <!-- Uyuşan / eksik etiketler -->
      <div class="flex flex-wrap gap-1.5">
        <span
          v-for="k in scored.reasons"
          :key="'r' + k"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-emerald-100 text-emerald-700"
        >
          <span class="material-symbols-outlined text-[14px]">check_circle</span>{{ dimLabel(k) }}
        </span>
        <span
          v-for="k in scored.gaps"
          :key="'g' + k"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold bg-red-100 text-red-700"
        >
          <span class="material-symbols-outlined text-[14px]">cancel</span>{{ dimLabel(k) }}
        </span>
      </div>

      <!-- Eşleşen özellikler -->
      <div v-if="scored.matchedFeatures.length" class="flex flex-wrap gap-1">
        <span
          v-for="f in scored.matchedFeatures.slice(0, 3)"
          :key="f"
          class="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant"
        >
          {{ f }}
        </span>
        <span
          v-if="scored.matchedFeatures.length > 3"
          class="px-1.5 py-0.5 rounded-full text-[10px] bg-surface-container text-on-surface-variant"
        >
          +{{ scored.matchedFeatures.length - 3 }}
        </span>
      </div>

      <!-- Telefon butonu (ziyaretçi modunda gizli) -->
      <a
        v-if="!hideContact"
        :href="`tel:${scored.portfolio.ownerPhone}`"
        @click.stop
        class="mt-auto flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <span class="material-symbols-outlined text-[14px]">call</span>
        {{ scored.portfolio.ownerName }}
      </a>
    </div>
  </div>
</template>

<style scoped>
@keyframes pin-pop {
  0%   { transform: scale(1);    box-shadow: 0 0 0 0px  rgba(78,96,79,0.8), 0 2px 8px rgba(0,0,0,0.08); }
  20%  { transform: scale(1.07); box-shadow: 0 0 0 8px  rgba(78,96,79,0.35), 0 6px 20px rgba(0,0,0,0.14); }
  50%  { transform: scale(1.03); box-shadow: 0 0 0 18px rgba(78,96,79,0), 0 4px 14px rgba(0,0,0,0.1); }
  75%  { transform: scale(0.99); }
  100% { transform: scale(1);    box-shadow: 0 0 0 0px  rgba(78,96,79,0), 0 2px 8px rgba(0,0,0,0.08); }
}
.animate-pin-pop { animation: pin-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
</style>
