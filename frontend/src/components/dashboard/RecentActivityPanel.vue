<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { RecentPortfolio, RecentDemand } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
import { fmtPrice, formatDate } from '@/utils/format';

const props = defineProps<{
  portfolios: RecentPortfolio[];
  demands: RecentDemand[];
}>();

const router = useRouter();
</script>

<template>
  <div class="recent-activity-panel">
    <h2>Son Eklenenler</h2>

    <div class="activity-grid">
      <div class="column">
        <h3>Portföyler</h3>
        <div v-if="portfolios.length === 0" class="empty">Henüz portföy yok</div>
        <div v-else class="list">
          <div v-for="p in portfolios" :key="p.id" class="activity-item" @click="router.push(`/portfolio/${p.id}`)">
            <div class="item-header">
              <span class="type">{{ PROPERTY_TYPE_LABELS[p.type] }}</span>
              <span class="date">{{ formatDate(p.createdAt) }}</span>
            </div>
            <div class="item-title">{{ p.title || `${p.city}, ${p.district}` }}</div>
            <div class="item-meta">
              <span class="price">{{ fmtPrice(Number(p.price)) }}</span>
              <span class="agent">{{ p.createdBy?.fullName }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="column">
        <h3>Talepler</h3>
        <div v-if="demands.length === 0" class="empty">Henüz talep yok</div>
        <div v-else class="list">
          <div v-for="d in demands" :key="d.id" class="activity-item" @click="router.push(`/demand/${d.id}`)">
            <div class="item-header">
              <span class="type">{{ d.types && d.types.length ? d.types.map((t: any) => PROPERTY_TYPE_LABELS[t]).join(', ') : 'Talep' }}</span>
              <span class="date">{{ formatDate(d.createdAt) }}</span>
            </div>
            <div class="item-title">{{ d.customerName }}</div>
            <div class="item-meta">
              <span class="budget">{{ fmtPrice(Number(d.minBudget || 0)) }} - {{ fmtPrice(Number(d.maxBudget || 0)) }}</span>
              <span class="agent">{{ d.createdBy?.fullName }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.recent-activity-panel {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 2rem;
  margin-bottom: 2rem;
}

.recent-activity-panel h2 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.activity-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.column h3 {
  margin: 0 0 0.75rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.empty {
  padding: 1rem;
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.activity-item {
  padding: 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.activity-item:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-primary);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.type {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.item-title {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.95rem;
}

.item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.price,
.budget {
  font-weight: 600;
  color: var(--color-primary);
}

.agent {
  text-align: right;
}

@media (max-width: 767px) {
  .activity-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
