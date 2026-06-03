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
const isPortfolio = () => props.searchType === 'portfolio';
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="$emit('close')">
      <div class="modal">

        <!-- Başlık -->
        <div class="modal-header">
          <div class="modal-title-wrap">
            <span class="title-icon material-symbols-outlined">
              {{ isPortfolio() ? 'maps_home_work' : 'ads_click' }}
            </span>
            <div>
              <div class="modal-title">
                {{ isPortfolio() ? 'Portföye Not Ekle' : 'Talebe Not Ekle' }}
              </div>
              <div class="modal-subtitle">
                {{ isPortfolio() ? 'Not eklemek istediğiniz portföyü seçin' : 'Not eklemek istediğiniz talebi seçin' }}
              </div>
            </div>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Arama -->
        <div class="search-wrap">
          <span class="material-symbols-outlined search-ico">search</span>
          <input
            ref="inputEl"
            v-model="query"
            class="search-input"
            :placeholder="isPortfolio()
              ? 'Şehir, ilçe veya ilan başlığı ile arayın…'
              : 'Müşteri adıyla arayın…'"
            @keydown.esc="$emit('close')"
          />
          <button v-if="query" class="clear-btn" @click="query = ''">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Sonuçlar -->
        <div class="results">
          <div v-if="loading" class="state-msg">
            <span class="material-symbols-outlined spin">progress_activity</span>
            <span>Aranıyor…</span>
          </div>
          <div v-else-if="!query.trim()" class="state-msg">
            <span class="material-symbols-outlined state-icon">
              {{ isPortfolio() ? 'maps_home_work' : 'ads_click' }}
            </span>
            <span>{{ isPortfolio() ? 'Aramaya başlamak için yazın' : 'Aramaya başlamak için yazın' }}</span>
          </div>
          <div v-else-if="!hasResults()" class="state-msg">
            <span class="material-symbols-outlined state-icon">search_off</span>
            <span>Sonuç bulunamadı</span>
          </div>

          <template v-if="portfolios.length">
            <button
              v-for="p in portfolios"
              :key="p.id"
              class="result-row"
              @click="$emit('select', p)"
            >
              <span class="r-badge">{{ PROPERTY_TYPE_LABELS[p.type] }}</span>
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
              <span class="r-badge demand">Talep</span>
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
  background: rgba(26, 28, 27, 0.28);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 88px;
  animation: fade-in 0.15s ease;
}

@keyframes fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.modal {
  width: 540px;
  max-width: calc(100vw - 32px);
  background: #ffffff;
  border: 1px solid #c3c8c0;
  border-radius: 16px;
  box-shadow: 0px 16px 48px rgba(0, 0, 0, 0.18), 0px 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  animation: drop-in 0.2s cubic-bezier(0.2, 0, 0, 1);
}

@keyframes drop-in {
  from { transform: translateY(-12px) scale(0.97); opacity: 0; }
  to   { transform: translateY(0) scale(1);         opacity: 1; }
}

/* Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 18px 20px 16px;
  background: #f4f4f2;
  border-bottom: 1px solid #e2e3e1;
}

.modal-title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #d4e8d2;
  color: #4e604f;
  font-size: 20px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: #1a1c1b;
  line-height: 1.2;
}

.modal-subtitle {
  font-size: 12px;
  color: #747872;
  margin-top: 2px;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: none;
  border: none;
  cursor: pointer;
  color: #747872;
  border-radius: 8px;
  transition: background 0.1s, color 0.1s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #e2e3e1;
  color: #1a1c1b;
}

.close-btn .material-symbols-outlined { font-size: 19px; }

/* Search */
.search-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 16px 20px 12px;
  padding: 11px 14px;
  background: #ffffff;
  border: 1.5px solid #c3c8c0;
  border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-wrap:focus-within {
  border-color: #4e604f;
  box-shadow: 0 0 0 3px rgba(78, 96, 79, 0.12);
}

.search-ico {
  font-size: 19px;
  color: #747872;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  font-family: inherit;
  color: #1a1c1b;
  background: transparent;
  line-height: 22px;
}

.search-input::placeholder { color: #a0a49d; }

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eeeeec;
  border: none;
  cursor: pointer;
  color: #747872;
  width: 22px;
  height: 22px;
  border-radius: 99px;
  transition: background 0.1s, color 0.1s;
  flex-shrink: 0;
}

.clear-btn:hover {
  background: #e2e3e1;
  color: #1a1c1b;
}

.clear-btn .material-symbols-outlined { font-size: 15px; }

/* Results */
.results {
  max-height: 340px;
  overflow-y: auto;
  padding: 4px 12px 14px;
  scrollbar-width: thin;
  scrollbar-color: #c3c8c0 transparent;
}

.results::-webkit-scrollbar { width: 6px; }
.results::-webkit-scrollbar-thumb { background: #c3c8c0; border-radius: 3px; }

.state-msg {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  text-align: center;
  font-size: 13px;
  color: #747872;
}

.state-icon {
  font-size: 36px;
  color: #c3c8c0;
}

.result-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 11px 12px;
  margin-top: 3px;
  background: none;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: background 0.1s;
}

.result-row:hover, .result-row:active { background: #f4f4f2; }

.r-badge {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 99px;
  background: #d4e8d2;
  color: #0f1f12;
  white-space: nowrap;
  flex-shrink: 0;
}

.r-badge.demand {
  background: #dbe1db;
  color: #5e6460;
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
  color: #1a1c1b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.r-sub {
  font-size: 12px;
  font-weight: 600;
  color: #4e604f;
}

.r-arrow {
  font-size: 17px;
  color: #c3c8c0;
  flex-shrink: 0;
  transition: color 0.1s, transform 0.15s;
}

.result-row:hover .r-arrow {
  color: #4e604f;
  transform: translateX(3px);
}

.spin {
  animation: spin 0.8s linear infinite;
  display: inline-block;
  font-size: 22px;
  color: #747872;
}

@keyframes spin { to { transform: rotate(360deg); } }
</style>
