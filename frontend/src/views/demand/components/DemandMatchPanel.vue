<script setup lang="ts">
import { ref } from 'vue';
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS, type Portfolio } from '@/types/portfolio';
import type { ScoredPortfolio } from '@/types/matching';
import { resolveImgUrl } from '@/utils/image';
import MatchCard from '@/components/portfolio/MatchCard.vue';
import type { DemandMatching } from '../composables/useDemandMatching';

/**
 * Talep formunun sağ paneli: "Eşleştirilenler" ve "Tüm Eşleşmeler" sekmeleri.
 * Eşleştirme durumu (results/pinned/drag) useDemandMatching'den prop olarak gelir;
 * panel yalnızca görüntüler ve eylemleri composable metotlarına iletir.
 */
defineProps<{
  matching: DemandMatching;
  isEdit: boolean;
}>();

const emit = defineEmits<{
  (e: 'preview', portfolio: Portfolio, ev: MouseEvent): void;
}>();

const activeTab = ref<'pinned' | 'all'>('pinned');

function fmtPrice(p: string | number) {
  return '₺' + Number(p).toLocaleString('tr-TR');
}
function locationOf(p: ScoredPortfolio['portfolio']) {
  return [p.neighborhood, p.district, p.city].filter(Boolean).join(', ');
}

/** Kart köşesindeki büyük skor rozeti (0..100) — yeşil (iyi) → kırmızı (zayıf). */
function scoreBadgeBg(s: number) {
  if (s >= 80) return 'bg-emerald-600/90';
  if (s >= 60) return 'bg-lime-600/90';
  if (s >= 40) return 'bg-amber-500/90';
  if (s >= 20) return 'bg-orange-500/90';
  return 'bg-red-600/90';
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Tab başlıkları -->
    <div class="shrink-0 border-b border-outline-variant bg-surface">
      <div class="flex">
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-2 py-3.5 text-label-md font-semibold border-b-2 transition-all"
          :class="activeTab === 'pinned' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
          @click="activeTab = 'pinned'"
        >
          <span class="material-symbols-outlined text-[16px]">bookmark</span>
          Eşleştirilenler
          <span
            v-if="matching.pinnedIds.value.size > 0"
            class="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
            :class="activeTab === 'pinned' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
          >{{ matching.pinnedIds.value.size }}</span>
        </button>
        <button
          type="button"
          class="flex-1 flex items-center justify-center gap-2 py-3.5 text-label-md font-semibold border-b-2 transition-all"
          :class="activeTab === 'all' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'"
          @click="activeTab = 'all'"
        >
          <span class="material-symbols-outlined text-[16px]">join_inner</span>
          Tüm Eşleşmeler
          <span
            v-if="matching.results.value.length > 0"
            class="px-1.5 py-0.5 rounded-full text-[11px] font-bold leading-none"
            :class="activeTab === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'"
          >{{ matching.results.value.length }}</span>
          <span v-if="matching.loading.value" class="material-symbols-outlined text-[14px] animate-spin text-on-surface-variant">progress_activity</span>
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-4 md:px-7 py-6">
      <!-- ── Sekme 1: Eşleştirilenler ── -->
      <template v-if="activeTab === 'pinned'">
        <div v-if="!isEdit" class="h-full flex flex-col items-center justify-center text-center">
          <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">bookmark_add</span>
          <p class="text-body-md text-on-surface-variant">Eşleştirme için önce talebi kaydedin.</p>
          <p class="text-label-md text-on-surface-variant/50 mt-1">Kaydettikten sonra portföyleri bu talebe sabitleyebilirsiniz.</p>
        </div>
        <div v-else-if="matching.pinnedLoading.value" class="h-full flex items-center justify-center">
          <span class="material-symbols-outlined text-[32px] text-on-surface-variant/40 animate-spin">progress_activity</span>
        </div>
        <div v-else-if="!matching.pinnedResults.value.length" class="h-full flex flex-col items-center justify-center text-center">
          <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">bookmark_border</span>
          <p class="text-body-md text-on-surface-variant">Henüz eşleştirilen portföy yok.</p>
          <p class="text-label-md text-on-surface-variant/50 mt-1">Sağ paneldeki portföyleri sürükleyerek veya <span class="material-symbols-outlined text-[12px] align-middle">bookmark_add</span> ikonuna tıklayarak eşleştirin.</p>
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            v-for="r in matching.pinnedResults.value" :key="r.portfolio.id"
            class="rounded-2xl overflow-hidden shadow-sm border-2 border-primary/30 flex flex-col bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            @click="emit('preview', r.portfolio, $event)"
          >
            <!-- Görsel -->
            <div class="relative w-full h-52 bg-surface-container shrink-0">
              <img v-if="r.portfolio.images?.length" :src="resolveImgUrl(r.portfolio.images[0])" :alt="r.portfolio.title ?? undefined" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex flex-col items-center justify-center bg-surface-container">
                <span class="material-symbols-outlined text-[48px] text-on-surface-variant/20">apartment</span>
              </div>
              <div class="absolute top-3 left-3">
                <span class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-black/40 text-white backdrop-blur-sm">{{ LISTING_TYPE_LABELS[r.portfolio.listingType] }}</span>
              </div>
              <!-- Eşleştirildi rozeti -->
              <div class="absolute top-3 right-3">
                <span class="flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-bold bg-primary text-on-primary shadow-sm">
                  <span class="material-symbols-outlined text-[12px]">bookmark</span>
                  Eşleştirildi
                </span>
              </div>
              <div
                class="absolute bottom-3 right-3 flex flex-col items-center justify-center w-[52px] h-[52px] rounded-2xl backdrop-blur-md shadow-lg"
                :class="scoreBadgeBg(r.score)">
                <span class="text-[22px] font-black leading-none text-white">{{ r.score }}</span>
                <span class="text-[9px] font-semibold text-white/70 uppercase tracking-wide leading-none mt-0.5">puan</span>
              </div>
            </div>
            <!-- Bilgi alanı -->
            <div class="flex flex-col flex-1 px-4 pt-3.5 pb-4 gap-2">
              <h3 class="text-[13px] font-semibold text-on-surface leading-snug line-clamp-2">{{ r.portfolio.title || PROPERTY_TYPE_LABELS[r.portfolio.type] }}</h3>
              <p class="text-[18px] font-black text-primary leading-none tracking-tight">{{ fmtPrice(r.portfolio.price) }}</p>
              <p class="text-[11px] text-on-surface-variant flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[12px] shrink-0">location_on</span>
                <span class="truncate">{{ locationOf(r.portfolio) }}</span>
              </p>
              <p v-if="r.portfolio.createdBy" class="text-[11px] text-on-surface-variant/70 flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[12px] shrink-0">badge</span>
                <span class="truncate">{{ r.portfolio.createdBy.fullName }}</span>
              </p>
              <div class="flex items-center gap-3 text-[11px] text-on-surface-variant">
                <span class="flex items-center gap-0.5 font-medium"><span class="material-symbols-outlined text-[12px]">straighten</span>{{ r.portfolio.areaSqm }} m²</span>
                <span class="flex items-center gap-0.5 font-medium"><span class="material-symbols-outlined text-[12px]">door_open</span>{{ r.portfolio.roomCount }}</span>
              </div>
              <div class="flex items-center justify-between gap-2 mt-auto pt-1">
                <a
                  :href="`tel:${r.portfolio.ownerPhone}`" class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-on-primary text-[12px] font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                  @click.stop>
                  <span class="material-symbols-outlined text-[14px]">call</span>
                  {{ r.portfolio.ownerName }}
                </a>
                <button
                  type="button" class="p-2 rounded-xl bg-error-container text-on-error-container hover:opacity-80 transition-all"
                  title="Eşleştirmeyi kaldır"
                  @click.stop="matching.togglePin(r.portfolio.id)">
                  <span class="material-symbols-outlined text-[16px]">bookmark_remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ── Sekme 2: Tüm eşleşmeler ── -->
      <template v-else>
        <!-- Boş durum -->
        <div v-if="!matching.results.value.length" class="h-full flex flex-col items-center justify-center text-center">
          <span class="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-3">search_off</span>
          <p class="text-body-md text-on-surface-variant">Kriterlere uygun portföy yok.</p>
          <p class="text-label-md text-on-surface-variant/60 mt-1">Filtreleri gevşetin veya talebi yine de kaydedin — yeni portföy gelince eşleşir.</p>
        </div>

        <!-- Kartlar: 2'li dikey grid -->
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MatchCard
            v-for="r in matching.results.value"
            :key="r.portfolio.id"
            :scored="r"
            :pinned="matching.pinnedIds.value.has(r.portfolio.id)"
            :can-pin="isEdit"
            :draggable="isEdit"
            :just-pinned="matching.justPinnedId.value === r.portfolio.id"
            @toggle-pin="matching.togglePin"
            @preview="(p, ev) => emit('preview', p, ev)"
            @dragstart="matching.onDragStart"
            @dragend="matching.onDragEnd"
          />
        </div>
      </template>
    </div>
  </div>
</template>
