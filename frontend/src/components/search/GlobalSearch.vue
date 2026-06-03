<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { searchService } from '@/services/search.service';
import type { SearchResults } from '@/types/search';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import { DEMAND_STATUS_LABELS } from '@/types/demand';

const props = withDefaults(defineProps<{ initialQuery?: string; autofocus?: boolean }>(), {
  initialQuery: '',
  autofocus: false,
});

const router = useRouter();
const query = ref(props.initialQuery);
const results = ref<SearchResults | null>(null);
const loading = ref(false);
const open = ref(false);
const root = ref<HTMLElement | null>(null);
const inputEl = ref<HTMLInputElement | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;
let reqId = 0;

watch(query, (val) => {
  clearTimeout(timer);
  const q = val.trim();
  if (q.length === 0) {
    results.value = null;
    loading.value = false;
    open.value = false;
    return;
  }
  open.value = true;
  loading.value = true;
  timer = setTimeout(() => runSearch(q), 250);
});

async function runSearch(q: string) {
  const myReq = ++reqId;
  try {
    const res = await searchService.global(q, { limit: 6 });
    if (myReq === reqId) results.value = res;
  } finally {
    if (myReq === reqId) loading.value = false;
  }
}

function fmtPrice(p: string | number | null | undefined) {
  if (p === null || p === undefined) return '—';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function goToResults() {
  const q = query.value.trim();
  if (!q) return;
  open.value = false;
  router.push({ path: '/search', query: { q } });
}

function goTo(path: string) {
  open.value = false;
  router.push(path);
}

function onFocus() {
  if (query.value.trim() && results.value) open.value = true;
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) open.value = false;
}

const hasResults = () =>
  !!results.value && (results.value.portfolios.length > 0 || results.value.demands.length > 0);

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  if (props.autofocus) inputEl.value?.focus();
});

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside);
  clearTimeout(timer);
});
</script>

<template>
  <div ref="root" class="relative w-full max-w-2xl">
    <!-- Input -->
    <div class="relative">
      <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">search</span>
      <input
        ref="inputEl"
        v-model="query"
        type="text"
        placeholder="İsim, telefon, bölge, özellik ara..."
        class="w-full pl-12 pr-4 py-3 bg-surface border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-on-surface-variant shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-150"
        @focus="onFocus"
        @keyup.enter="goToResults"
        @keyup.escape="open = false"
      />
    </div>

    <!-- Dropdown -->
    <div
      v-if="open"
      class="absolute z-50 mt-2 w-full bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden"
    >
      <div v-if="loading" class="px-4 py-6 text-center text-label-md text-on-surface-variant">Aranıyor…</div>

      <template v-else-if="hasResults()">
        <!-- Portföyler -->
        <div v-if="results!.portfolios.length" class="py-2">
          <div class="px-4 py-1 text-label-sm uppercase tracking-wider text-on-surface-variant">Portföyler</div>
          <button
            v-for="p in results!.portfolios"
            :key="p.id"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-container active:bg-surface-container transition-colors duration-100"
            @click="goTo(`/portfolio/${p.id}`)"
          >
            <span class="material-symbols-outlined text-primary text-[20px] shrink-0">maps_home_work</span>
            <span class="min-w-0 flex-1">
              <span class="block text-label-md font-medium text-on-surface truncate">
                {{ p.title || `${p.city} / ${p.district}` }}
              </span>
              <span class="block text-label-sm text-on-surface-variant truncate">
                {{ PROPERTY_TYPE_LABELS[p.type] }} · {{ p.city }}/{{ p.district }} · {{ p.ownerName }}
              </span>
            </span>
            <span class="text-label-md font-semibold text-primary shrink-0">{{ fmtPrice(p.price) }}</span>
          </button>
        </div>

        <!-- Talepler -->
        <div v-if="results!.demands.length" class="py-2 border-t border-outline-variant">
          <div class="px-4 py-1 text-label-sm uppercase tracking-wider text-on-surface-variant">Talepler</div>
          <button
            v-for="d in results!.demands"
            :key="d.id"
            class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-container active:bg-surface-container transition-colors duration-100"
            @click="goTo(`/demand/${d.id}`)"
          >
            <span class="material-symbols-outlined text-primary text-[20px] shrink-0">ads_click</span>
            <span class="min-w-0 flex-1">
              <span class="block text-label-md font-medium text-on-surface truncate">{{ d.customerName }}</span>
              <span class="block text-label-sm text-on-surface-variant truncate">
                {{ d.regions.join(', ') || 'Bölge belirtilmemiş' }} · {{ DEMAND_STATUS_LABELS[d.status] }}
              </span>
            </span>
            <span class="text-label-sm text-on-surface-variant shrink-0">
              {{ fmtPrice(d.minBudget) }} – {{ fmtPrice(d.maxBudget) }}
            </span>
          </button>
        </div>

        <!-- Tüm sonuçlar -->
        <button
          class="w-full flex items-center justify-center gap-1 px-4 py-3 border-t border-outline-variant text-label-md font-medium text-primary hover:bg-surface-container active:bg-surface-container transition-colors duration-100"
          @click="goToResults"
        >
          Tüm sonuçları gör
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </template>

      <div v-else class="px-4 py-6 text-center text-label-md text-on-surface-variant">Sonuç bulunamadı</div>
    </div>
  </div>
</template>
