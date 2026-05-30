<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { dashboardService, type NotedPortfolio, type NotedDemand, type DashboardStats } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import type { Portfolio } from '@/types/portfolio';
import type { Demand } from '@/types/demand';
import DashboardNoteCard from '@/components/dashboard/DashboardNoteCard.vue';
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
    notedPortfolios.value = data.portfoliosWithNotes;
    notedDemands.value = data.demandsWithNotes;
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
      note: p.note ?? '', updatedAt: p.updatedAt, title: p.title ?? null, _pending: true,
    });
  } else {
    const d = item as Demand;
    if (pendingDemands.value.find((x) => x.id === d.id)) return;
    pendingDemands.value.unshift({
      id: d.id, customerName: d.customerName,
      minBudget: d.minBudget, maxBudget: d.maxBudget,
      regions: d.regions, note: d.note ?? '',
      updatedAt: d.updatedAt, status: d.status, _pending: true,
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
  if (!min && !max) return '—';
  return `${min ?? '0'} – ${max ?? '∞'}`;
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg font-semibold tracking-tight text-on-surface">Defter</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Hızlı notlar ve özet</p>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else>
      <div class="dashboard-grid">

        <!-- Ana içerik -->
        <div class="dashboard-main">

          <!-- Portföy Notları -->
          <section class="notes-section">
            <div class="section-header">
              <div class="section-title">
                <span class="material-symbols-outlined section-icon">maps_home_work</span>
                <span>Portföy Notları</span>
                <span v-if="notedPortfolios.length" class="section-badge">{{ notedPortfolios.length }}</span>
              </div>
              <div class="section-actions">
                <button class="icon-btn" title="Tüm Portföyler" @click="router.push('/portfolio')">
                  <span class="material-symbols-outlined">open_in_new</span>
                </button>
                <button class="add-note-btn" @click="searchModal = 'portfolio'">
                  <span class="material-symbols-outlined">add</span>
                  Not Ekle
                </button>
              </div>
            </div>

            <div v-if="pendingPortfolios.length === 0 && notedPortfolios.length === 0" class="notes-empty">
              <span class="material-symbols-outlined">sticky_note_2</span>
              <p>Henüz not yok. "+ Not Ekle" ile başlayın.</p>
            </div>
            <div v-else class="notes-scroll">
              <DashboardNoteCard
                v-for="p in pendingPortfolios" :key="`pending-p-${p.id}`"
                :id="p.id" item-type="portfolio" :badge="portfolioBadge(p)"
                :title="portfolioTitle(p)" :subtitle="portfolioSubtitle(p)"
                :note="p.note" :updated-at="p.updatedAt" :initial-edit-open="true"
                @saved="(n) => onPortfolioSaved(p, n)"
                @cancelled="pendingPortfolios = pendingPortfolios.filter(x => x.id !== p.id)"
              />
              <DashboardNoteCard
                v-for="p in notedPortfolios" :key="p.id"
                :id="p.id" item-type="portfolio" :badge="portfolioBadge(p)"
                :title="portfolioTitle(p)" :subtitle="portfolioSubtitle(p)"
                :note="p.note" :updated-at="p.updatedAt"
                @saved="(n) => onPortfolioNoteUpdated(p, n)"
              />
            </div>
          </section>

          <!-- Talep Notları -->
          <section class="notes-section">
            <div class="section-header">
              <div class="section-title">
                <span class="material-symbols-outlined section-icon">ads_click</span>
                <span>Talep Notları</span>
                <span v-if="notedDemands.length" class="section-badge">{{ notedDemands.length }}</span>
              </div>
              <div class="section-actions">
                <button class="icon-btn" title="Tüm Talepler" @click="router.push('/demand')">
                  <span class="material-symbols-outlined">open_in_new</span>
                </button>
                <button class="add-note-btn" @click="searchModal = 'demand'">
                  <span class="material-symbols-outlined">add</span>
                  Not Ekle
                </button>
              </div>
            </div>

            <div v-if="pendingDemands.length === 0 && notedDemands.length === 0" class="notes-empty">
              <span class="material-symbols-outlined">sticky_note_2</span>
              <p>Henüz not yok. "+ Not Ekle" ile başlayın.</p>
            </div>
            <div v-else class="notes-scroll">
              <DashboardNoteCard
                v-for="d in pendingDemands" :key="`pending-d-${d.id}`"
                :id="d.id" item-type="demand" badge="Talep"
                :title="d.customerName" :subtitle="demandSubtitle(d)"
                :note="d.note" :updated-at="d.updatedAt" :initial-edit-open="true"
                @saved="(n) => onDemandSaved(d, n)"
                @cancelled="pendingDemands = pendingDemands.filter(x => x.id !== d.id)"
              />
              <DashboardNoteCard
                v-for="d in notedDemands" :key="d.id"
                :id="d.id" item-type="demand" badge="Talep"
                :title="d.customerName" :subtitle="demandSubtitle(d)"
                :note="d.note" :updated-at="d.updatedAt"
                @saved="(n) => onDemandNoteUpdated(d, n)"
              />
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

.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

/* ── Notes section ── */
.notes-section {
  border: 1.5px solid var(--outline-variant);
  border-radius: 14px;
  overflow: hidden;
  background: var(--surface-container-lowest);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 18px;
  background: var(--surface-container-lowest);
  border-bottom: 1.5px solid var(--outline-variant);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
}

.section-icon {
  font-size: 17px;
  color: var(--primary);
}

.section-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--on-surface-variant);
  background: var(--surface-container);
  border-radius: 99px;
  padding: 1px 8px;
  line-height: 18px;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: none;
  border: none;
  border-radius: 8px;
  color: var(--on-surface-variant);
  cursor: pointer;
  transition: background 0.12s;
}

.icon-btn .material-symbols-outlined { font-size: 17px; }

.icon-btn:hover {
  background: var(--surface-container);
  color: var(--on-surface);
}

.add-note-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  background: var(--primary);
  color: var(--on-primary);
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}

.add-note-btn .material-symbols-outlined { font-size: 15px; }

.add-note-btn:hover {
  background: color-mix(in srgb, var(--primary) 82%, black);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.notes-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 44px 20px;
  background: var(--surface-container-low);
  color: var(--on-surface-variant);
  font-size: 13px;
  text-align: center;
}

.notes-empty .material-symbols-outlined {
  font-size: 34px;
  color: var(--outline);
}

.notes-scroll {
  display: flex;
  gap: 14px;
  padding: 18px 18px 20px;
  overflow-x: auto;
  background: var(--surface-container-low);
  scrollbar-width: thin;
  scrollbar-color: var(--outline-variant) transparent;
}

.notes-scroll::-webkit-scrollbar { height: 4px; }
.notes-scroll::-webkit-scrollbar-thumb {
  background: var(--outline-variant);
  border-radius: 2px;
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
  background: var(--surface-container-lowest);
  border: 1.5px solid var(--outline-variant);
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
  color: var(--primary);
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
  color: var(--on-surface);
  line-height: 1;
  letter-spacing: -0.03em;
}

.stat-value.primary {
  color: var(--primary);
}

.stat-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.stat-divider {
  height: 1px;
  background: var(--outline-variant);
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
  color: var(--primary);
}
</style>
