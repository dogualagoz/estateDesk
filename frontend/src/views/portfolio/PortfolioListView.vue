<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { portfolioService } from '@/services/portfolio.service';
import {
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
  type Portfolio,
  type PortfolioQuery,
} from '@/types/portfolio';

const router = useRouter();
const loading = ref(false);
const items = ref<Portfolio[]>([]);
const total = ref(0);
const showFilters = ref(false);

const filters = reactive<PortfolioQuery>({ page: 1, pageSize: 20 });

async function load() {
  loading.value = true;
  try {
    const cleaned: PortfolioQuery = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== undefined && v !== null) (cleaned as any)[k] = v;
    }
    const res = await portfolioService.list(cleaned);
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  Object.keys(filters).forEach((k) => {
    if (k !== 'page' && k !== 'pageSize') (filters as any)[k] = undefined;
  });
  filters.page = 1;
  load();
}

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

async function remove(p: Portfolio) {
  if (!confirm(`"${p.city}/${p.district}" portföyü silinsin mi?`)) return;
  await portfolioService.remove(p.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Portföy Yönetimi</h1>
        <p class="muted" style="margin-top: 4px;">Toplam {{ total }} ilan</p>
      </div>
      <button class="btn primary" @click="router.push('/portfolio/new')">
        <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
        Yeni Portföy
      </button>
    </div>

    <!-- Search & filter bar -->
    <div class="search-bar-wrap">
      <div class="search-bar">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          class="search-input"
          type="text"
          v-model="filters.q"
          placeholder="Bölge, fiyat, özellik ara…"
          @keyup.enter="filters.page = 1; load()"
        />
      </div>
      <button class="btn" @click="showFilters = !showFilters" :class="{ active: showFilters }">
        <span class="material-symbols-outlined" style="font-size: 18px;">tune</span>
        Filtrele
      </button>
    </div>

    <!-- Filter chips -->
    <div v-if="showFilters" class="filters-panel card" style="margin-bottom: 24px;">
      <div class="row">
        <div class="field">
          <label>Tür</label>
          <select class="select" v-model="filters.type">
            <option :value="undefined">Hepsi</option>
            <option v-for="t in PROPERTY_TYPES" :key="t" :value="t">{{ PROPERTY_TYPE_LABELS[t] }}</option>
          </select>
        </div>
        <div class="field">
          <label>İl</label>
          <input class="input" v-model="filters.city" placeholder="İstanbul" />
        </div>
        <div class="field">
          <label>İlçe</label>
          <input class="input" v-model="filters.district" placeholder="Kadıköy" />
        </div>
        <div class="field">
          <label>Oda</label>
          <input class="input" v-model="filters.roomCount" placeholder="2+1" />
        </div>
        <div class="field">
          <label>Min fiyat</label>
          <input class="input" type="number" v-model.number="filters.minPrice" />
        </div>
        <div class="field">
          <label>Max fiyat</label>
          <input class="input" type="number" v-model.number="filters.maxPrice" />
        </div>
        <div class="field">
          <label>Durum</label>
          <select class="select" v-model="filters.visibility">
            <option :value="undefined">Hepsi</option>
            <option value="PUBLIC">Açık</option>
            <option value="HIDDEN">Gizli</option>
          </select>
        </div>
      </div>
      <div class="row" style="margin-top: 12px;">
        <button class="btn primary" @click="filters.page = 1; load()">Uygula</button>
        <button class="btn" @click="resetFilters">Sıfırla</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="empty">Yükleniyor…</div>

    <!-- Empty state -->
    <div v-else-if="!items.length" class="empty">Kayıt bulunamadı</div>

    <!-- Card grid -->
    <div v-else class="portfolio-grid">
      <article
        v-for="p in items"
        :key="p.id"
        class="portfolio-card"
        @click="router.push(`/portfolio/${p.id}`)"
      >
        <div class="card-img-placeholder">
          <span class="material-symbols-outlined" style="font-size: 40px; color: var(--outline-variant);">maps_home_work</span>
          <div class="card-badge-tl">
            <span class="tag primary">{{ PROPERTY_TYPE_LABELS[p.type] }}</span>
          </div>
          <div class="card-badge-tr">
            <span :class="['status-dot', p.visibility === 'HIDDEN' ? 'hidden' : 'open']">
              <span class="dot"></span>
              {{ p.visibility === 'HIDDEN' ? 'GİZLİ' : 'AÇIK' }}
            </span>
          </div>
        </div>

        <div class="card-body">
          <h3 class="card-title">{{ p.city }}, {{ p.district }}<span v-if="p.neighborhood"> / {{ p.neighborhood }}</span></h3>
          <p class="card-location">
            <span class="material-symbols-outlined" style="font-size: 14px;">location_on</span>
            {{ PROPERTY_TYPE_LABELS[p.type] }}
          </p>

          <div class="card-specs">
            <div class="spec">
              <span class="material-symbols-outlined" style="font-size: 18px;">bed</span>
              <span>{{ p.roomCount }}</span>
            </div>
            <div class="spec-divider"></div>
            <div class="spec">
              <span class="material-symbols-outlined" style="font-size: 18px;">square_foot</span>
              <span>{{ p.areaSqm }} m²</span>
            </div>
            <div class="spec-divider"></div>
            <div class="spec">
              <span class="material-symbols-outlined" style="font-size: 18px;">person</span>
              <span>{{ p.ownerName }}</span>
            </div>
          </div>

          <div class="card-footer">
            <div class="price">{{ fmtPrice(p.price) }}</div>
            <div class="actions">
              <button
                class="btn ghost"
                @click.stop="router.push(`/portfolio/${p.id}`)"
                title="Detay"
              >
                <span class="material-symbols-outlined" style="font-size: 18px;">open_in_new</span>
              </button>
              <button
                class="btn ghost danger"
                @click.stop="remove(p)"
                title="Sil"
              >
                <span class="material-symbols-outlined" style="font-size: 18px;">delete</span>
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.search-bar-wrap {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  align-items: center;
}

.search-bar {
  position: relative;
  flex: 1;
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: var(--outline);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 56px;
  padding: 0 16px 0 48px;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  background: var(--surface-container-lowest);
  font-family: inherit;
  font-size: 16px;
  color: var(--on-surface);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(78, 96, 79, 0.1);
}

.search-input::placeholder { color: var(--outline-variant); }

.btn.active {
  background: var(--primary-fixed);
  color: var(--primary-hover);
}

.portfolio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.portfolio-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.portfolio-card:hover {
  box-shadow: var(--shadow-2);
}

.card-img-placeholder {
  height: 160px;
  background: var(--surface-container);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.card-badge-tl {
  position: absolute;
  top: 12px;
  left: 12px;
}

.card-badge-tr {
  position: absolute;
  top: 12px;
  right: 12px;
}

.status-dot {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
}

.status-dot.open {
  background: rgba(227, 238, 224, 0.9);
  color: #3a4b3b;
  border: 1px solid rgba(58, 75, 59, 0.2);
}

.status-dot.hidden {
  background: rgba(255, 218, 214, 0.9);
  color: var(--on-error-container);
  border: 1px solid rgba(147, 0, 10, 0.2);
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.card-body {
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-location {
  font-size: 13px;
  color: var(--on-surface-variant);
  margin: 0 0 12px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.card-specs {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  margin-bottom: 12px;
}

.spec {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--on-surface);
  flex: 1;
  justify-content: center;
}

.spec-divider {
  width: 1px;
  height: 20px;
  background: var(--hairline);
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.price {
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--primary);
}

.actions {
  display: flex;
  gap: 4px;
}
</style>
