<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { searchService } from '@/services/search.service';
import type { SearchResults } from '@/types/search';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import { DEMAND_STATUS_LABELS } from '@/types/demand';
import GlobalSearch from '@/components/search/GlobalSearch.vue';

const route = useRoute();
const router = useRouter();
const results = ref<SearchResults | null>(null);
const loading = ref(false);
const currentQuery = ref('');

watch(
  () => route.query.q,
  (q) => {
    const term = (q as string | undefined)?.trim() ?? '';
    currentQuery.value = term;
    if (term) load(term);
    else results.value = null;
  },
  { immediate: true },
);

async function load(q: string) {
  loading.value = true;
  try {
    results.value = await searchService.global(q, { limit: 30 });
  } finally {
    loading.value = false;
  }
}

function fmtPrice(p: string | number | null | undefined) {
  if (p === null || p === undefined) return '—';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const hasResults = () =>
  !!results.value && (results.value.portfolios.length > 0 || results.value.demands.length > 0);
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Arama Sonuçları</h1>
        <p v-if="currentQuery" class="text-label-md text-on-surface-variant mt-1">
          "{{ currentQuery }}" için sonuçlar
        </p>
      </div>
    </div>

    <!-- Search bar -->
    <div class="flex justify-center mb-gutter">
      <GlobalSearch :initial-query="currentQuery" />
    </div>

    <div v-if="loading" class="empty">Aranıyor…</div>
    <div v-else-if="!currentQuery" class="empty">Aramak için bir şeyler yazın</div>
    <div v-else-if="!hasResults()" class="empty">"{{ currentQuery }}" için sonuç bulunamadı</div>

    <template v-else>
      <!-- Portföyler -->
      <section v-if="results!.portfolios.length" class="mb-gutter">
        <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">
          Portföyler <span class="text-on-surface-variant font-normal">({{ results!.counts.portfolios }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          <article
            v-for="p in results!.portfolios"
            :key="p.id"
            class="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow duration-200 group"
            @click="router.push(`/portfolio/${p.id}`)"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="tag primary text-[11px]">{{ PROPERTY_TYPE_LABELS[p.type] }}</span>
              <span class="material-symbols-outlined text-primary text-[18px]">maps_home_work</span>
            </div>
            <h3 class="text-body-lg font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">
              {{ p.title || `${p.city} / ${p.district}` }}
            </h3>
            <p class="text-label-md text-on-surface-variant mb-2">{{ p.city }} / {{ p.district }}</p>
            <div class="flex justify-between items-center mt-auto pt-2 border-t border-outline-variant">
              <span class="text-label-md font-bold text-primary">{{ fmtPrice(p.price) }}</span>
              <span class="text-label-sm text-on-surface-variant">{{ p.ownerName }}</span>
            </div>
          </article>
        </div>
      </section>

      <!-- Talepler -->
      <section v-if="results!.demands.length">
        <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">
          Talepler <span class="text-on-surface-variant font-normal">({{ results!.counts.demands }})</span>
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          <article
            v-for="d in results!.demands"
            :key="d.id"
            class="bg-surface-container-lowest rounded-xl border border-outline-variant p-stack-md shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow duration-200 group"
            @click="router.push(`/demand/${d.id}`)"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="tag text-[11px]">{{ DEMAND_STATUS_LABELS[d.status] }}</span>
              <span class="material-symbols-outlined text-primary text-[18px]">ads_click</span>
            </div>
            <h3 class="text-body-lg font-semibold text-on-surface mb-1 group-hover:text-primary transition-colors">
              {{ d.customerName }}
            </h3>
            <p class="text-label-md text-on-surface-variant mb-2 truncate">
              {{ d.regions.join(', ') || 'Bölge belirtilmemiş' }}
            </p>
            <div class="flex justify-between items-center mt-auto pt-2 border-t border-outline-variant">
              <span class="text-label-md font-semibold text-primary">{{ fmtPrice(d.minBudget) }} – {{ fmtPrice(d.maxBudget) }}</span>
              <div class="w-7 h-7 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center text-[11px] font-bold">
                {{ initials(d.customerName) }}
              </div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>
