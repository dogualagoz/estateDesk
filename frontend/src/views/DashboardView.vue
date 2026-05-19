<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { dashboardService, type DashboardStats } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';

const router = useRouter();
const stats = ref<DashboardStats | null>(null);
const loading = ref(true);

onMounted(async () => {
  try {
    stats.value = await dashboardService.stats();
  } finally {
    loading.value = false;
  }
});

function fmtPrice(p: string | number) {
  const n = typeof p === 'string' ? parseFloat(p) : p;
  return new Intl.NumberFormat('tr-TR').format(n) + ' ₺';
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR');
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p class="muted" style="margin-top: 4px;">Genel bakış</p>
      </div>
      <button class="btn primary" @click="router.push('/portfolio/new')">
        <span class="material-symbols-outlined" style="font-size: 18px;">add</span>
        Yeni Portföy
      </button>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else-if="stats">
      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card card">
          <div class="stat-icon-wrap">
            <span class="material-symbols-outlined stat-icon">maps_home_work</span>
          </div>
          <div>
            <div class="stat-label">Toplam Portföy</div>
            <div class="stat-value">{{ stats.portfolioCount }}</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon-wrap secondary">
            <span class="material-symbols-outlined stat-icon">ads_click</span>
          </div>
          <div>
            <div class="stat-label">Toplam Talep</div>
            <div class="stat-value">{{ stats.demandCount }}</div>
          </div>
        </div>
        <div class="stat-card card">
          <div class="stat-icon-wrap success">
            <span class="material-symbols-outlined stat-icon">radar</span>
          </div>
          <div>
            <div class="stat-label">Aktif Talep</div>
            <div class="stat-value">{{ stats.activeDemandCount }}</div>
          </div>
        </div>
      </div>

      <!-- Recent tables -->
      <div class="tables-grid">
        <div class="card">
          <div class="card-head">
            <h2>Son Portföyler</h2>
            <button class="btn ghost" @click="router.push('/portfolio')" style="font-size: 13px;">
              Tümünü Gör
              <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
            </button>
          </div>
          <table class="table" v-if="stats.recentPortfolios.length">
            <thead>
              <tr><th>Tür</th><th>Konum</th><th>Fiyat</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="p in stats.recentPortfolios"
                :key="p.id"
                class="clickable-row"
                @click="router.push(`/portfolio/${p.id}`)"
              >
                <td>{{ PROPERTY_TYPE_LABELS[p.type] }}</td>
                <td>{{ p.city }} / {{ p.district }}</td>
                <td>{{ fmtPrice(p.price) }}</td>
                <td>{{ fmtDate(p.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">Kayıt yok</div>
        </div>

        <div class="card">
          <div class="card-head">
            <h2>Son Talepler</h2>
            <button class="btn ghost" @click="router.push('/demand')" style="font-size: 13px;">
              Tümünü Gör
              <span class="material-symbols-outlined" style="font-size: 16px;">arrow_forward</span>
            </button>
          </div>
          <table class="table" v-if="stats.recentDemands.length">
            <thead>
              <tr><th>Müşteri</th><th>Bölgeler</th><th>Bütçe</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              <tr
                v-for="d in stats.recentDemands"
                :key="d.id"
                class="clickable-row"
                @click="router.push(`/demand/${d.id}`)"
              >
                <td>{{ d.customerName }}</td>
                <td>{{ d.regions.join(', ') || '-' }}</td>
                <td>
                  <template v-if="d.minBudget || d.maxBudget">
                    {{ d.minBudget ? fmtPrice(d.minBudget) : '0' }} – {{ d.maxBudget ? fmtPrice(d.maxBudget) : '∞' }}
                  </template>
                  <template v-else>-</template>
                </td>
                <td>{{ fmtDate(d.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">Kayıt yok</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: var(--radius);
  background: var(--primary-fixed);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon-wrap.secondary { background: var(--secondary-container); }
.stat-icon-wrap.success { background: #e3eee0; }

.stat-icon {
  font-size: 24px;
  color: var(--primary);
}

.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--on-surface-variant);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: -0.01em;
}

.tables-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-head h2 { margin: 0; }

.clickable-row { cursor: pointer; }

@media (max-width: 900px) {
  .stats-row { grid-template-columns: 1fr; }
  .tables-grid { grid-template-columns: 1fr; }
}
</style>
