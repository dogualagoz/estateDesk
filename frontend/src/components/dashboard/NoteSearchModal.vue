<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { searchService } from '@/services/search.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import type { Portfolio } from '@/types/portfolio';
import type { Demand } from '@/types/demand';

const props = defineProps<{
  searchType: 'portfolio' | 'demand';
}>();

const emit = defineEmits<{
  select: [item: Portfolio | Demand];
  close: [];
}>();

const query = ref('');
const portfolios = ref<Portfolio[]>([]);
const demands = ref<Demand[]>([]);
const loading = ref(false);
const inputEl = ref<HTMLInputElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let reqId = 0;

onMounted(() => nextTick(() => inputEl.value?.focus()));

watch(query, (val) => {
  clearTimeout(debounceTimer);
  const q = val.trim();
  if (!q) {
    portfolios.value = [];
    demands.value = [];
    loading.value = false;
    return;
  }
  loading.value = true;
  debounceTimer = setTimeout(() => doSearch(q), 280);
});

async function doSearch(q: string) {
  const myReq = ++reqId;
  try {
    const res = await searchService.global(q, { scope: props.searchType, limit: 8 });
    if (myReq !== reqId) return;
    portfolios.value = res.portfolios;
    demands.value = res.demands;
  } finally {
    if (myReq === reqId) loading.value = false;
  }
}

function fmtPrice(p: string | number | null | undefined) {
  if (p == null) return '—';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

const hasResults = () => portfolios.value.length > 0 || demands.value.length > 0;
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">

        <!-- Başlık -->
        <div class="modal-title-row">
          <span class="modal-title">
            {{ searchType === 'portfolio' ? 'Portföye Not Ekle' : 'Talebe Not Ekle' }}
          </span>
          <button class="close-btn" @click="$emit('close')">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Pill search input -->
        <div class="search-wrap">
          <span class="material-symbols-outlined search-ico">search</span>
          <input
            ref="inputEl"
            v-model="query"
            class="search-input"
            :placeholder="searchType === 'portfolio'
              ? 'Şehir, ilçe veya ilan başlığı ile arayın…'
              : 'Müşteri adıyla arayın…'"
            @keydown.esc="$emit('close')"
          />
          <button v-if="query" class="clear-btn" @click="query = ''">
            <span class="material-symbols-outlined" style="font-size:16px">close</span>
          </button>
        </div>

        <!-- Sonuçlar -->
        <div class="results">
          <div v-if="loading" class="state-msg">
            <span class="material-symbols-outlined spin" style="font-size:20px;color:var(--outline)">progress_activity</span>
            Aranıyor…
          </div>
          <div v-else-if="!query.trim()" class="state-msg">
            <span class="material-symbols-outlined" style="font-size:28px;color:var(--outline-variant)">
              {{ searchType === 'portfolio' ? 'maps_home_work' : 'ads_click' }}
            </span>
            <span>{{ searchType === 'portfolio' ? 'Not eklemek istediğiniz portföyü arayın' : 'Not eklemek istediğiniz talebi arayın' }}</span>
          </div>
          <div v-else-if="!hasResults()" class="state-msg">
            <span class="material-symbols-outlined" style="font-size:28px;color:var(--outline-variant)">search_off</span>
            Sonuç bulunamadı
          </div>

          <template v-if="portfolios.length">
            <button
              v-for="p in portfolios"
              :key="p.id"
              class="result-row"
              @click="$emit('select', p)"
            >
              <div class="result-left">
                <span class="r-badge">{{ PROPERTY_TYPE_LABELS[p.type] }}</span>
              </div>
              <div class="result-body">
                <span class="r-title">{{ p.city }} / {{ p.district }}</span>
                <span class="r-sub">{{ fmtPrice(p.price) }}</span>
              </div>
              <span class="material-symbols-outlined r-arrow">arrow_forward</span>
            </button>
          </template>

          <template v-if="demands.length">
            <button
              v-for="d in demands"
              :key="d.id"
              class="result-row"
              @click="$emit('select', d)"
            >
              <div class="result-left">
                <span class="r-badge demand">Talep</span>
              </div>
              <div class="result-body">
                <span class="r-title">{{ d.customerName }}</span>
                <span class="r-sub">
                  {{ d.minBudget ? fmtPrice(d.minBudget) : '—' }} –
                  {{ d.maxBudget ? fmtPrice(d.maxBudget) : '∞' }}
                </span>
              </div>
              <span class="material-symbols-outlined r-arrow">arrow_forward</span>
            </button>
          </template>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(26, 28, 27, 0.18);
  backdrop-filter: blur(3px);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 72px;
}

.modal {
  width: 580px;
  max-width: calc(100vw - 32px);
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 16px;
  box-shadow: 0px 12px 24px rgba(0, 0, 0, 0.08), 0px 4px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: drop-in 0.18s cubic-bezier(0.2, 0, 0, 1);
}

@keyframes drop-in {
  from { transform: translateY(-10px) scale(0.98); opacity: 0; }
  to   { transform: translateY(0) scale(1);         opacity: 1; }
}

/* Title row */
.modal-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
}

.modal-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--on-surface);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--on-surface-variant);
  border-radius: 8px;
  transition: background 0.1s;
  font-size: 18px;
}

.close-btn:hover {
  background: var(--surface-container);
}

.close-btn .material-symbols-outlined {
  font-size: 18px;
}

/* Search pill */
.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 20px 16px;
  padding: 10px 14px;
  background: var(--surface-container-low);
  border: 1px solid var(--outline-variant);
  border-radius: 99px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-wrap:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 12%, transparent);
  background: var(--surface-container-lowest);
}

.search-ico {
  font-size: 18px;
  color: var(--on-surface-variant);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: var(--on-surface);
  background: transparent;
  line-height: 22px;
}

.search-input::placeholder {
  color: var(--outline);
}

.clear-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--outline);
  padding: 2px;
  border-radius: 99px;
  transition: color 0.1s;
  flex-shrink: 0;
}

.clear-btn:hover {
  color: var(--on-surface-variant);
}

/* Results list */
.results {
  max-height: 360px;
  overflow-y: auto;
  padding: 0 8px 8px;
  border-top: 1px solid var(--outline-variant);
}

.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px 20px;
  text-align: center;
  font-size: 13px;
  color: var(--on-surface-variant);
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  margin-top: 2px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.1s;
}

.result-row:hover {
  background: var(--surface-container-low);
}

.result-left {
  flex-shrink: 0;
}

.r-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 99px;
  background: var(--primary-fixed);
  color: var(--on-primary-fixed);
  white-space: nowrap;
}

.r-badge.demand {
  background: var(--secondary-container);
  color: var(--on-secondary-container);
}

.result-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.r-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-sub {
  font-size: 12px;
  font-weight: 500;
  color: var(--primary);
}

.r-arrow {
  font-size: 16px;
  color: var(--outline-variant);
  flex-shrink: 0;
  transition: color 0.1s, transform 0.15s;
}

.result-row:hover .r-arrow {
  color: var(--primary);
  transform: translateX(2px);
}

/* Loading spin */
@keyframes spin { to { transform: rotate(360deg); } }
.spin { animation: spin 0.8s linear infinite; display: inline-block; }
</style>
