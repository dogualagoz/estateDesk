<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { demandShareService } from '@/services/demandShare.service';
import {
  SHARE_MODE_LABELS,
  toScoredPortfolio,
  type SharedCollectionResponse,
} from '@/types/demandShare';
import type { Portfolio } from '@/types/portfolio';
import { PROPERTY_TYPE_LABELS, LISTING_TYPE_LABELS } from '@/types/portfolio';
import MatchCard from '@/components/portfolio/MatchCard.vue';
import PortfolioDetailModal from '@/components/portfolio/PortfolioDetailModal.vue';

const route = useRoute();
const loading = ref(true);
const error = ref(false);
const data = ref<SharedCollectionResponse | null>(null);

const scoredMatches = computed(() => (data.value?.matches ?? []).map(toScoredPortfolio));

const locationText = computed(() => {
  const d = data.value?.demand;
  if (!d) return '';
  const parts: string[] = [];
  if (d.city) parts.push(d.city);
  if (d.districts?.length) parts.push(d.districts.join(', '));
  if (d.neighborhoods?.length) parts.push(d.neighborhoods.join(', '));
  return parts.join(' — ') || 'Belirtilmemiş';
});

const budgetText = computed(() => {
  const d = data.value?.demand;
  if (!d) return '';
  const fmt = (n: number) => '₺' + n.toLocaleString('tr-TR');
  if (d.minBudget != null && d.maxBudget != null) return `${fmt(d.minBudget)} – ${fmt(d.maxBudget)}`;
  if (d.maxBudget != null) return `En fazla ${fmt(d.maxBudget)}`;
  if (d.minBudget != null) return `En az ${fmt(d.minBudget)}`;
  return 'Belirtilmemiş';
});

const areaText = computed(() => {
  const d = data.value?.demand;
  if (!d) return '';
  if (d.minArea != null && d.maxArea != null) return `${d.minArea} – ${d.maxArea} m²`;
  if (d.maxArea != null) return `En fazla ${d.maxArea} m²`;
  if (d.minArea != null) return `En az ${d.minArea} m²`;
  return 'Belirtilmemiş';
});

const expiryText = computed(() =>
  data.value
    ? new Date(data.value.expiresAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '',
);

// ── Önizleme modalı ──
const previewPortfolio = ref<Portfolio | null>(null);
const previewOrigin = ref<{ x: number; y: number } | null>(null);
function openPreview(p: Portfolio, ev?: MouseEvent) {
  const el = ev?.currentTarget as HTMLElement | undefined;
  if (el) {
    const r = el.getBoundingClientRect();
    previewOrigin.value = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  } else {
    previewOrigin.value = null;
  }
  previewPortfolio.value = p;
}

onMounted(async () => {
  try {
    data.value = await demandShareService.getSharedCollection(route.params.token as string);
  } catch {
    error.value = true;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-[100dvh] bg-surface-container/30 flex flex-col">
    <!-- Yükleniyor -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <span class="material-symbols-outlined text-[40px] text-on-surface-variant/40 animate-spin">progress_activity</span>
    </div>

    <!-- Geçersiz / süresi dolmuş -->
    <div v-else-if="error || !data" class="flex-1 flex flex-col items-center justify-center text-center px-6">
      <div class="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-[34px] text-on-surface-variant/50">link_off</span>
      </div>
      <h1 class="text-headline-sm font-semibold text-on-surface">Defter bulunamadı</h1>
      <p class="text-body-md text-on-surface-variant mt-2 max-w-sm">
        Bu paylaşım linkinin süresi dolmuş veya iptal edilmiş olabilir. Lütfen sizinle paylaşan kişiden yeni bir bağlantı isteyin.
      </p>
    </div>

    <!-- İçerik -->
    <template v-else>
      <!-- Header -->
      <div class="shrink-0 px-4 md:px-8 py-5 border-b border-outline-variant bg-surface">
        <div class="flex items-center gap-3">
          <img src="/logo.svg" alt="emlakdefter" class="h-10 w-10 rounded-xl shadow-sm shrink-0" />
          <div class="min-w-0">
            <h1 class="text-headline-sm font-semibold text-on-surface tracking-tight truncate">
              {{ data.officeName || 'Emlak Defteri' }} — Sizin için seçilen ilanlar
            </h1>
            <p class="text-label-md text-on-surface-variant mt-0.5">
              {{ SHARE_MODE_LABELS[data.mode] }} · Son geçerlilik {{ expiryText }}
            </p>
          </div>
        </div>
        <div v-if="data.note" class="mt-3 px-4 py-2.5 rounded-xl bg-primary-fixed/40 text-on-surface text-body-md leading-relaxed whitespace-pre-wrap">
          {{ data.note }}
        </div>
      </div>

      <div class="flex-1 flex flex-col md:flex-row md:overflow-hidden">
        <!-- ── SOL: Kriter özeti ── -->
        <aside class="w-full md:w-[34%] md:max-w-sm border-b md:border-b-0 md:border-r border-outline-variant bg-surface-container/30 md:overflow-y-auto">
          <div class="px-5 md:px-6 py-6 space-y-3">
            <p class="text-label-sm font-semibold uppercase tracking-widest text-on-surface-variant">Aranan Kriterler</p>

            <!-- Mülk tipi -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Mülk & İlan Tipi</p>
              <div class="flex flex-wrap gap-1.5">
                <span class="px-2.5 py-1 rounded-full text-[12px] font-semibold bg-primary text-on-primary">
                  {{ LISTING_TYPE_LABELS[data.demand.listingType] }}
                </span>
                <span
                  v-for="t in data.demand.types"
                  :key="t"
                  class="px-2.5 py-1 rounded-full text-[12px] font-medium bg-primary-fixed text-on-primary-fixed-variant"
                >{{ PROPERTY_TYPE_LABELS[t] }}</span>
                <span v-if="!data.demand.types.length" class="text-label-sm text-on-surface-variant/50 italic">Belirtilmemiş</span>
              </div>
            </div>

            <!-- Konum -->
            <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Konum</p>
              <p class="text-body-md text-on-surface">{{ locationText }}</p>
            </div>

            <!-- Bütçe & m² -->
            <div class="grid grid-cols-1 gap-3">
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Bütçe</p>
                <p class="text-body-md font-semibold text-on-surface">{{ budgetText }}</p>
              </div>
              <div class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
                <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">Metrekare</p>
                <p class="text-body-md text-on-surface">{{ areaText }}</p>
              </div>
            </div>

            <!-- Oda -->
            <div v-if="data.demand.roomPreferences.length" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <p class="text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant mb-2">Oda Sayısı</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="r in data.demand.roomPreferences" :key="r" class="px-2.5 py-1 rounded-full text-[12px] font-medium bg-surface-container text-on-surface">{{ r }}</span>
              </div>
            </div>

            <!-- Olmazsa olmaz -->
            <div v-if="data.demand.mustHaveFeatures.length" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <p class="text-label-xs font-semibold uppercase tracking-widest text-error mb-2">Olmazsa Olmaz</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="f in data.demand.mustHaveFeatures" :key="f" class="px-2.5 py-1 rounded-full text-[12px] font-medium bg-error-container text-on-error-container">{{ f }}</span>
              </div>
            </div>

            <!-- Bonus -->
            <div v-if="data.demand.bonusFeatures.length" class="bg-surface-container-lowest rounded-xl border border-outline-variant p-4">
              <p class="text-label-xs font-semibold uppercase tracking-widest text-primary mb-2">Bonus Tercihler</p>
              <div class="flex flex-wrap gap-1.5">
                <span v-for="f in data.demand.bonusFeatures" :key="f" class="px-2.5 py-1 rounded-full text-[12px] font-medium bg-primary-fixed text-on-primary-fixed-variant">{{ f }}</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- ── SAĞ: Eşleşen ilanlar ── -->
        <main class="flex-1 md:overflow-y-auto px-4 md:px-7 py-6">
          <div v-if="!scoredMatches.length" class="h-full min-h-[40dvh] flex flex-col items-center justify-center text-center">
            <span class="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3">search_off</span>
            <p class="text-body-md text-on-surface-variant">Şu an gösterilecek ilan yok.</p>
          </div>
          <div v-else>
            <p class="text-label-md text-on-surface-variant mb-4">
              <span class="font-semibold text-on-surface">{{ scoredMatches.length }}</span> ilan — karta dokunarak detayları görüntüleyin.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <MatchCard
                v-for="m in scoredMatches"
                :key="m.portfolio.id"
                :scored="m"
                hide-contact
                @preview="openPreview"
              />
            </div>
          </div>
        </main>
      </div>
    </template>

    <!-- Portföy önizleme modalı (satıcı iletişimi gizli) -->
    <PortfolioDetailModal
      :portfolio="previewPortfolio"
      :origin="previewOrigin"
      hide-contact
      @close="previewPortfolio = null"
    />
  </div>
</template>
