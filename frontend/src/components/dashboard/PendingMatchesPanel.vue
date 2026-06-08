<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PendingMatchItem } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/data/property-types';
import { fmtPrice } from '@/utils/format';

const props = withDefaults(
  defineProps<{
    items: PendingMatchItem[];
    loading?: boolean;
  }>(),
  { loading: false },
);

const router = useRouter();

const getDaysSince = (date: string): number => {
  const now = new Date();
  const created = new Date(date);
  return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
};

const getAgeStatus = (days: number) => {
  if (days < 7) return { color: 'green', emoji: '🟢', label: `${days}g` };
  if (days < 14) return { color: 'yellow', emoji: '⚠️', label: `${days}g` };
  return { color: 'red', emoji: '🔴', label: `${days}g` };
};

const viewAllUrl = computed(() => {
  return router.resolve({ name: 'demand.list', query: { status: 'ACTIVE' } }).href;
});
</script>

<template>
  <div class="pending-matches-panel">
    <div class="panel-header">
      <h2>Bekleyen Talepler</h2>
      <a v-if="items.length > 0" :href="viewAllUrl" class="view-all-link">Tümünü Gör →</a>
    </div>

    <div v-if="loading" class="loading">Yükleniyor...</div>
    <div v-else-if="items.length === 0" class="empty-state">Eşleşmesi beklenen talep yok</div>

    <div v-else class="matches-scroll">
      <div v-for="item in items" :key="item.demand.id" class="match-item" @click="router.push(`/demand/${item.demand.id}`)">
        <div class="demand-section">
          <div class="demand-header">
            <span class="customer-name">{{ item.demand.customerName }}</span>
            <span class="age-badge" :class="getAgeStatus(getDaysSince(item.demand.createdAt)).color">
              {{ getAgeStatus(getDaysSince(item.demand.createdAt)).emoji }} {{ getAgeStatus(getDaysSince(item.demand.createdAt)).label }}
            </span>
          </div>
          <div class="demand-meta">
            <span v-if="item.demand.types && item.demand.types.length" class="type">{{ item.demand.types.map((t: any) => PROPERTY_TYPE_LABELS[t]).join(', ') }}</span>
            <span v-if="item.demand.regions && item.demand.regions.length" class="region">{{ item.demand.regions[0] }}</span>
          </div>
          <div v-if="item.demand.minBudget || item.demand.maxBudget" class="budget">
            <span v-if="item.demand.minBudget && item.demand.maxBudget">{{ fmtPrice(Number(item.demand.minBudget)) }} - {{ fmtPrice(Number(item.demand.maxBudget)) }}</span>
            <span v-else-if="item.demand.maxBudget">Maks {{ fmtPrice(Number(item.demand.maxBudget)) }}</span>
            <span v-else-if="item.demand.minBudget">Min {{ fmtPrice(Number(item.demand.minBudget)) }}</span>
          </div>
        </div>

        <div class="divider"></div>

        <div class="portfolio-section">
          <div v-if="item.topMatch" class="match-card">
            <div class="match-score">
              <span class="score-value">{{ Math.round(item.topMatch.score) }}</span>
            </div>
            <div class="match-details">
              <div class="match-type">{{ PROPERTY_TYPE_LABELS[item.topMatch.portfolio.type] }}</div>
              <div class="match-location">{{ item.topMatch.portfolio.city }}, {{ item.topMatch.portfolio.district }}</div>
              <div class="match-price">{{ fmtPrice(Number(item.topMatch.portfolio.price)) }}</div>
            </div>
          </div>
          <div v-else class="no-match">Henüz eşleşme bulunamadı</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pending-matches-panel {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2rem;
  margin-bottom: 2rem;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.view-all-link {
  font-size: 0.875rem;
  color: var(--color-primary);
  text-decoration: none;
}

.view-all-link:hover {
  text-decoration: underline;
}

.loading,
.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-secondary);
}

.matches-scroll {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 600px;
  overflow-y: auto;
}

.match-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.match-item:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-primary);
}

.demand-section {
  flex: 1;
  min-width: 0;
}

.demand-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.customer-name {
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.age-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  white-space: nowrap;
}

.age-badge.green {
  background-color: rgba(46, 160, 67, 0.1);
  color: #2ea043;
}

.age-badge.yellow {
  background-color: rgba(255, 193, 7, 0.1);
  color: #f9a825;
}

.age-badge.red {
  background-color: rgba(229, 57, 53, 0.1);
  color: #e53935;
}

.demand-meta {
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: 0.5rem;
  overflow: hidden;
}

.type,
.region {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.budget {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.divider {
  width: 1px;
  background-color: var(--color-border);
  min-height: 80px;
}

.portfolio-section {
  width: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.match-card {
  display: flex;
  gap: 0.75rem;
  width: 100%;
}

.match-score {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #7d907d 0%, #4e604f 100%);
  border-radius: 8px;
  color: white;
  font-weight: 700;
}

.score-value {
  font-size: 1.5rem;
}

.match-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.match-type {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-location {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.match-price {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-match {
  text-align: center;
  padding: 1rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

@media (max-width: 767px) {
  .match-item {
    flex-direction: column;
  }

  .divider {
    width: 100%;
    height: 1px;
    min-height: unset;
  }

  .portfolio-section {
    width: 100%;
  }
}
</style>
