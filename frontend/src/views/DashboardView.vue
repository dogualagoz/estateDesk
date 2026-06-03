<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { dashboardService, type NotedPortfolio, type NotedDemand, type DashboardStats } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import type { Portfolio } from '@/types/portfolio';
import type { Demand } from '@/types/demand';
import DashboardNoteRow from '@/components/dashboard/DashboardNoteRow.vue';
import NoteSearchModal from '@/components/dashboard/NoteSearchModal.vue';

const router = useRouter();
const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

const notedPortfolios = ref<NotedPortfolio[]>([]);
const notedDemands = ref<NotedDemand[]>([]);

const pendingPortfolios = ref<(NotedPortfolio & { _pending: true })[]>([]);
const pendingDemands = ref<(NotedDemand & { _pending: true })[]>([]);

const searchModal = ref<'portfolio' | 'demand' | null>(null);

onMounted(async () => {
  try {
    const data = await dashboardService.stats();
    stats.value = data;
    notedPortfolios.value = data.portfoliosWithNotes.map((p: any) => ({
      ...p,
      agentName: p.createdBy?.fullName ?? null,
    }));
    notedDemands.value = data.demandsWithNotes.map((d: any) => ({
      ...d,
      agentName: d.createdBy?.fullName ?? null,
    }));
  } finally {
    loading.value = false;
  }
});

function onSearchSelect(item: Portfolio | Demand) {
  const type = searchModal.value!;
  searchModal.value = null;

  if (type === 'portfolio') {
    const p = item as Portfolio;
    if (pendingPortfolios.value.find((x) => x.id === p.id)) return;
    pendingPortfolios.value.unshift({
      id: p.id, type: p.type, listingType: p.listingType,
      city: p.city, district: p.district, price: p.price,
      note: p.note ?? '', updatedAt: p.updatedAt, title: p.title ?? null,
      agentName: p.createdBy?.fullName ?? null, _pending: true,
    });
  } else {
    const d = item as Demand;
    if (pendingDemands.value.find((x) => x.id === d.id)) return;
    pendingDemands.value.unshift({
      id: d.id, customerName: d.customerName,
      minBudget: d.minBudget, maxBudget: d.maxBudget,
      regions: d.regions, note: d.note ?? '',
      updatedAt: d.updatedAt, status: d.status,
      agentName: (d as any).createdBy?.fullName ?? null, _pending: true,
    });
  }
}

function onPortfolioSaved(item: NotedPortfolio, newNote: string) {
  pendingPortfolios.value = pendingPortfolios.value.filter((p) => p.id !== item.id);
  const idx = notedPortfolios.value.findIndex((p) => p.id === item.id);
  const updated = { ...item, note: newNote, updatedAt: new Date().toISOString() };
  if (idx >= 0) notedPortfolios.value.splice(idx, 1, updated);
  else notedPortfolios.value.unshift(updated);
}

function onDemandSaved(item: NotedDemand, newNote: string) {
  pendingDemands.value = pendingDemands.value.filter((d) => d.id !== item.id);
  const idx = notedDemands.value.findIndex((d) => d.id === item.id);
  const updated = { ...item, note: newNote, updatedAt: new Date().toISOString() };
  if (idx >= 0) notedDemands.value.splice(idx, 1, updated);
  else notedDemands.value.unshift(updated);
}

function onPortfolioNoteUpdated(item: NotedPortfolio, newNote: string) {
  const idx = notedPortfolios.value.findIndex((p) => p.id === item.id);
  if (idx >= 0) notedPortfolios.value.splice(idx, 1, { ...item, note: newNote, updatedAt: new Date().toISOString() });
}

function onDemandNoteUpdated(item: NotedDemand, newNote: string) {
  const idx = notedDemands.value.findIndex((d) => d.id === item.id);
  if (idx >= 0) notedDemands.value.splice(idx, 1, { ...item, note: newNote, updatedAt: new Date().toISOString() });
}

function fmtPrice(p: string | number | null | undefined) {
  if (p == null) return '—';
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function portfolioBadge(p: NotedPortfolio) { return PROPERTY_TYPE_LABELS[p.type] ?? p.type; }
function portfolioTitle(p: NotedPortfolio) { return `${p.city} / ${p.district}`; }
function portfolioSubtitle(p: NotedPortfolio) { return fmtPrice(p.price); }
function demandSubtitle(d: NotedDemand) {
  const min = d.minBudget ? fmtPrice(d.minBudget) : null;
  const max = d.maxBudget ? fmtPrice(d.maxBudget) : null;
  if (!min && !max) return '';
  return `${min ?? '0'} – ${max ?? '∞'}`;
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Defter</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Hızlı notlar ve özet</p>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else>
      <div class="dashboard-grid">

        <!-- Açık defter: iki sayfa -->
        <div class="notebook">

          <!-- Sol sayfa — Portföy -->
          <section class="page-col">
            <header class="col-header">
              <div class="col-title">
                <span class="material-symbols-outlined col-icon">maps_home_work</span>
                <span>Portföyler</span>
                <span v-if="notedPortfolios.length" class="col-count">{{ notedPortfolios.length }}</span>
              </div>
              <div class="col-actions">
                <button class="add-btn" @click="searchModal = 'portfolio'">
                  <span class="material-symbols-outlined">add</span>
                  Not
                </button>
                <button class="link-btn" title="Tüm Portföyler" @click="router.push('/portfolio')">
                  <span class="material-symbols-outlined">open_in_new</span>
                </button>
              </div>
            </header>

            <div class="col-list">
              <div v-if="pendingPortfolios.length === 0 && notedPortfolios.length === 0" class="col-empty">
                <span class="material-symbols-outlined">sticky_note_2</span>
                <p>Henüz not yok. "+ Not" ile başlayın.</p>
              </div>
              <template v-else>
                <DashboardNoteRow
                  v-for="p in pendingPortfolios" :key="`pending-p-${p.id}`"
                  :id="p.id" item-type="portfolio" :badge="portfolioBadge(p)"
                  :title="portfolioTitle(p)" :subtitle="portfolioSubtitle(p)"
                  :note="p.note" :updated-at="p.updatedAt" :initial-edit-open="true"
                  :agent-name="p.agentName ?? undefined"
                  @saved="(n) => onPortfolioSaved(p, n)"
                  @cancelled="pendingPortfolios = pendingPortfolios.filter(x => x.id !== p.id)"
                />
                <DashboardNoteRow
                  v-for="p in notedPortfolios" :key="p.id"
                  :id="p.id" item-type="portfolio" :badge="portfolioBadge(p)"
                  :title="portfolioTitle(p)" :subtitle="portfolioSubtitle(p)"
                  :note="p.note" :updated-at="p.updatedAt"
                  :agent-name="p.agentName ?? undefined"
                  @saved="(n) => onPortfolioNoteUpdated(p, n)"
                />
              </template>
            </div>
          </section>

          <!-- Cilt ayracı -->
          <div class="spine" />

          <!-- Sağ sayfa — Talep -->
          <section class="page-col">
            <header class="col-header">
              <div class="col-title">
                <span class="material-symbols-outlined col-icon">ads_click</span>
                <span>Talepler</span>
                <span v-if="notedDemands.length" class="col-count">{{ notedDemands.length }}</span>
              </div>
              <div class="col-actions">
                <button class="add-btn" @click="searchModal = 'demand'">
                  <span class="material-symbols-outlined">add</span>
                  Not
                </button>
                <button class="link-btn" title="Tüm Talepler" @click="router.push('/demand')">
                  <span class="material-symbols-outlined">open_in_new</span>
                </button>
              </div>
            </header>

            <div class="col-list">
              <div v-if="pendingDemands.length === 0 && notedDemands.length === 0" class="col-empty">
                <span class="material-symbols-outlined">sticky_note_2</span>
                <p>Henüz not yok. "+ Not" ile başlayın.</p>
              </div>
              <template v-else>
                <DashboardNoteRow
                  v-for="d in pendingDemands" :key="`pending-d-${d.id}`"
                  :id="d.id" item-type="demand" badge="Talep"
                  :title="d.customerName" :subtitle="demandSubtitle(d)"
                  :note="d.note" :updated-at="d.updatedAt" :initial-edit-open="true"
                  :agent-name="d.agentName ?? undefined"
                  @saved="(n) => onDemandSaved(d, n)"
                  @cancelled="pendingDemands = pendingDemands.filter(x => x.id !== d.id)"
                />
                <DashboardNoteRow
                  v-for="d in notedDemands" :key="d.id"
                  :id="d.id" item-type="demand" badge="Talep"
                  :title="d.customerName" :subtitle="demandSubtitle(d)"
                  :note="d.note" :updated-at="d.updatedAt"
                  :agent-name="d.agentName ?? undefined"
                  @saved="(n) => onDemandNoteUpdated(d, n)"
                />
              </template>
            </div>
          </section>

        </div>

        <!-- İstatistik sütunu -->
        <aside class="stats-sidebar">
          <button class="stat-card" @click="router.push('/portfolio')">
            <span class="material-symbols-outlined stat-icon">maps_home_work</span>
            <div class="stat-body">
              <span class="stat-value">{{ stats?.portfolioCount ?? '—' }}</span>
              <span class="stat-label">Portföy</span>
            </div>
          </button>
          <button class="stat-card" @click="router.push('/demand')">
            <span class="material-symbols-outlined stat-icon">ads_click</span>
            <div class="stat-body">
              <span class="stat-value">{{ stats?.demandCount ?? '—' }}</span>
              <span class="stat-label">Toplam Talep</span>
            </div>
          </button>
          <button class="stat-card" @click="router.push('/demand?status=ACTIVE')">
            <span class="material-symbols-outlined stat-icon">radar</span>
            <div class="stat-body">
              <span class="stat-value primary">{{ stats?.activeDemandCount ?? '—' }}</span>
              <span class="stat-label">Aktif Talep</span>
            </div>
          </button>

          <div class="stat-divider" />

          <div class="stat-row">
            <span class="stat-label">Notlu Portföy</span>
            <span class="stat-chip">{{ notedPortfolios.length }}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Notlu Talep</span>
            <span class="stat-chip">{{ notedDemands.length }}</span>
          </div>
        </aside>

      </div>
    </template>

    <NoteSearchModal
      v-if="searchModal"
      :search-type="searchModal"
      @select="onSearchSelect"
      @close="searchModal = null"
    />
  </div>
</template>

<style scoped>
/* ── Grid ── */
.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 212px;
  gap: 24px;
  align-items: start;
}

/* ── Açık defter ── */
.notebook {
  display: grid;
  grid-template-columns: 1fr 1px 1fr;
  background: #ffffff;
  border: 1.5px solid #c3c8c0;
  border-radius: 14px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  min-width: 0;
}

.spine {
  background: linear-gradient(to bottom, transparent, #e2e3e1 12%, #e2e3e1 88%, transparent);
}

.page-col {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

/* Sütun başlığı */
.col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid #eeeeec;
}

.col-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 700;
  color: #1a1c1b;
  letter-spacing: 0.02em;
}

.col-icon {
  font-size: 17px;
  color: #4e604f;
}

.col-count {
  font-size: 11px;
  font-weight: 600;
  color: #747872;
  background: #eeeeec;
  border-radius: 99px;
  padding: 1px 7px;
}

.col-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 5px 11px;
  background: #4e604f;
  color: #ffffff;
  border: none;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.12s, box-shadow 0.12s;
}

.add-btn .material-symbols-outlined { font-size: 14px; }

.add-btn:hover {
  background: #3d4e3e;
  box-shadow: 0 2px 6px rgba(78, 96, 79, 0.3);
}

.link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: none;
  border: none;
  border-radius: 7px;
  color: #747872;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.link-btn .material-symbols-outlined { font-size: 16px; }

.link-btn:hover {
  background: #eeeeec;
  color: #1a1c1b;
}

/* Liste */
.col-list {
  display: flex;
  flex-direction: column;
  padding: 6px;
  gap: 0;
  /* ~5 not satırı görünür, kalanı kaydırılır (portföy ve talep ayrı ayrı) */
  max-height: 336px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c3c8c0 transparent;
}

.col-list::-webkit-scrollbar { width: 5px; }
.col-list::-webkit-scrollbar-thumb {
  background: #c3c8c0;
  border-radius: 3px;
}

/* Satırlar arası ince çizgi */
.col-list > :deep(.note-row:not(:last-child))::after {
  content: '';
  position: absolute;
  left: 14px;
  right: 12px;
  bottom: 0;
  height: 1px;
  background: #f0f0ee;
}

.col-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 20px;
  color: #747872;
  font-size: 13px;
  text-align: center;
}

.col-empty .material-symbols-outlined {
  font-size: 32px;
  color: #c3c8c0;
}

/* ── Stats sidebar ── */
.stats-sidebar {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1.5px solid #c3c8c0;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: box-shadow 0.15s, transform 0.12s;
}

.stat-card:hover {
  box-shadow: 0px 4px 14px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}

.stat-icon {
  font-size: 20px;
  color: #4e604f;
  opacity: 0.8;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #1a1c1b;
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-value.primary { color: #4e604f; }

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: #747872;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.stat-divider {
  height: 1px;
  background: #c3c8c0;
  margin: 4px 0;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 2px;
}

.stat-chip {
  font-size: 14px;
  font-weight: 700;
  color: #4e604f;
}

/* ── Mobil (≤767px) ── */
@media (max-width: 767px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  /* Açık defter tek sütuna iner; iki sayfa alt alta */
  .notebook {
    grid-template-columns: 1fr;
  }

  .spine { display: none; }

  /* İki sayfa arasında yatay ayraç */
  .page-col:first-child {
    border-bottom: 1px solid #eeeeec;
  }

  /* Mobilde de ~5 satır görünür, kalanı kaydırılır */
  .col-list {
    max-height: 336px;
  }

  /* İstatistikler: yatay kart ızgarası */
  .stats-sidebar {
    position: static;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    padding: 12px;
  }

  .stat-value { font-size: 22px; }

  .stat-divider,
  .stat-row {
    grid-column: 1 / -1;
  }
}
</style>
