<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { demandService } from '@/services/demand.service';
import { DEMAND_STATUS_LABELS, type Demand, type DemandQuery } from '@/types/demand';
import { PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from '@/types/portfolio';

const router = useRouter();
const loading = ref(false);
const items = ref<Demand[]>([]);
const total = ref(0);
const showFilters = ref(false);

const filters = reactive<DemandQuery>({ page: 1, pageSize: 20 });

async function load() {
  loading.value = true;
  try {
    const cleaned: DemandQuery = {};
    for (const [k, v] of Object.entries(filters)) {
      if (v !== '' && v !== undefined && v !== null) (cleaned as any)[k] = v;
    }
    const res = await demandService.list(cleaned);
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

function fmtPrice(p: string | number | null | undefined) {
  if (p === null || p === undefined) return '∞';
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Bugün';
  if (days === 1) return '1 gün önce';
  if (days < 7) return `${days} gün önce`;
  const weeks = Math.floor(days / 7);
  return `${weeks} hafta önce`;
}

async function remove(d: Demand) {
  if (!confirm(`"${d.customerName}" talebi silinsin mi?`)) return;
  await demandService.remove(d.id);
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Müşteri Talepleri</h1>
        <p class="muted" style="margin-top: 4px;">Aktif alıcı ve kiracı arayışları</p>
      </div>
      <button class="btn primary" @click="router.push('/demand/new')">
        <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
        Yeni Talep
      </button>
    </div>

    <!-- Search bar -->
    <div class="search-bar-wrap">
      <div class="search-bar">
        <span class="material-symbols-outlined search-icon">search</span>
        <input
          class="search-input"
          type="text"
          v-model="filters.q"
          placeholder="Bölge veya müşteri ara…"
          @keyup.enter="filters.page = 1; load()"
        />
      </div>
      <button class="btn" @click="showFilters = !showFilters" :class="{ active: showFilters }">
        <span class="material-symbols-outlined" style="font-size: 18px;">tune</span>
        Filtrele
      </button>
    </div>

    <!-- Filters panel -->
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
          <label>Bölge</label>
          <input class="input" v-model="filters.region" placeholder="Kadıköy" />
        </div>
        <div class="field">
          <label>Oda</label>
          <input class="input" v-model="filters.roomPreference" placeholder="2+1" />
        </div>
        <div class="field">
          <label>Durum</label>
          <select class="select" v-model="filters.status">
            <option :value="undefined">Hepsi</option>
            <option value="ACTIVE">Aktif</option>
            <option value="CLOSED">Kapandı</option>
          </select>
        </div>
        <div class="field">
          <label>Min bütçe</label>
          <input class="input" type="number" v-model.number="filters.minBudget" />
        </div>
        <div class="field">
          <label>Max bütçe</label>
          <input class="input" type="number" v-model.number="filters.maxBudget" />
        </div>
      </div>
      <div class="row" style="margin-top: 12px;">
        <button class="btn primary" @click="filters.page = 1; load()">Uygula</button>
        <button class="btn" @click="resetFilters">Sıfırla</button>
        <span class="muted" style="margin-left: auto;">{{ total }} kayıt</span>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>
    <div v-else-if="!items.length" class="empty">Kayıt bulunamadı</div>

    <!-- Card grid -->
    <div v-else class="demand-grid">
      <article
        v-for="d in items"
        :key="d.id"
        class="demand-card"
        :class="{ closed: d.status === 'CLOSED' }"
        @click="router.push(`/demand/${d.id}`)"
      >
        <!-- Header badges -->
        <div class="card-badges">
          <span class="badge searching" v-if="d.status === 'ACTIVE'">
            <span class="material-symbols-outlined" style="font-size: 14px;">radar</span>
            Arıyor
          </span>
          <span class="badge closed-badge" v-else>
            <span class="material-symbols-outlined" style="font-size: 14px;">check_circle</span>
            Kapandı
          </span>
          <span class="status-chip" :class="d.status === 'ACTIVE' ? 'active' : 'passive'">
            {{ DEMAND_STATUS_LABELS[d.status] }}
          </span>
        </div>

        <!-- Title -->
        <h2 class="demand-title">
          {{ d.regions.join(', ') || 'Bölge belirtilmemiş' }}
          <span v-if="d.roomPreferences.length"> — {{ d.roomPreferences.join(', ') }}</span>
        </h2>

        <!-- Note -->
        <p v-if="d.note" class="demand-note">{{ d.note }}</p>
        <p v-else class="demand-note muted">Not eklenmemiş</p>

        <!-- Budget -->
        <div class="budget-box">
          <span class="material-symbols-outlined budget-icon">payments</span>
          <div>
            <div class="budget-label">Bütçe Aralığı</div>
            <div class="budget-value">
              {{ fmtPrice(d.minBudget) }} – {{ fmtPrice(d.maxBudget) }}
            </div>
          </div>
        </div>

        <!-- Feature tags -->
        <div class="tags-row" v-if="d.featurePrefs.length">
          <span class="tag" v-for="f in d.featurePrefs.slice(0, 4)" :key="f">{{ f }}</span>
        </div>
        <div class="tags-row" v-else-if="d.types.length">
          <span class="tag" v-for="t in d.types" :key="t">{{ PROPERTY_TYPE_LABELS[t] }}</span>
        </div>

        <!-- Footer -->
        <div class="card-footer">
          <div class="agent">
            <div class="agent-avatar">{{ initials(d.customerName) }}</div>
            <span class="agent-name">{{ d.customerName }}</span>
          </div>
          <div class="footer-actions">
            <span class="time-ago">
              <span class="material-symbols-outlined" style="font-size: 14px;">schedule</span>
              {{ timeAgo(d.createdAt) }}
            </span>
            <button class="btn ghost danger" @click.stop="remove(d)" title="Sil">
              <span class="material-symbols-outlined" style="font-size: 16px;">delete</span>
            </button>
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
  max-width: 480px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--outline);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 16px 0 40px;
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  background: var(--surface-container-lowest);
  font-family: inherit;
  font-size: 14px;
  color: var(--on-surface);
  transition: border-color 0.15s;
  box-shadow: var(--shadow-1);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(78, 96, 79, 0.1);
}

.search-input::placeholder { color: var(--outline); }
.btn.active { background: var(--primary-fixed); color: var(--primary-hover); }

.demand-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.demand-card {
  background: var(--surface-container-lowest);
  border: 1px solid var(--hairline);
  border-radius: var(--radius-md);
  padding: 16px;
  box-shadow: var(--shadow-1);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: box-shadow 0.2s;
  position: relative;
}

.demand-card:hover:not(.closed) { box-shadow: var(--shadow-2); }
.demand-card.closed { opacity: 0.75; }

.card-badges {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.03em;
}

.badge.searching {
  background: var(--primary-fixed);
  color: var(--on-primary-fixed);
}

.badge.closed-badge {
  background: var(--secondary-container);
  color: var(--on-surface-variant);
}

.status-chip {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--hairline);
}

.status-chip.active { background: var(--surface-container-high); color: var(--on-surface-variant); }
.status-chip.passive { background: var(--surface-variant); color: var(--on-surface-variant); }

.demand-title {
  font-size: 18px;
  line-height: 26px;
  font-weight: 600;
  color: var(--on-surface);
  margin: 0 0 8px;
  transition: color 0.1s;
}

.demand-card:hover .demand-title { color: var(--primary); }

.demand-note {
  font-size: 14px;
  line-height: 20px;
  color: var(--on-surface-variant);
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.budget-box {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--surface-container-low);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: 12px;
  margin-bottom: 12px;
}

.budget-icon {
  font-size: 20px;
  color: var(--primary);
  padding: 6px;
  background: var(--surface-container-lowest);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-1);
}

.budget-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--outline);
  margin-bottom: 2px;
}

.budget-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--primary);
  line-height: 22px;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.card-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--primary-container);
  color: var(--on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  box-shadow: var(--shadow-1);
}

.agent-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-ago {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
  color: var(--outline);
}
</style>
