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

const typeInitial = (types: string[] | undefined): string => {
  if (!types?.length) return 'T';
  const type = types[0];
  if (type === 'APARTMENT') return 'D';
  if (type === 'VILLA') return 'V';
  if (type === 'LAND') return 'A';
  if (type === 'SHOP') return 'Ş';
  if (type === 'OFFICE') return 'O';
  return type[0];
};
</script>

<template>
  <div class="space-y-4">
    <h2 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Son Eklenenler</h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <!-- Portföyler -->
      <div>
        <h3 class="text-label-sm text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Portföyler</h3>
        <div v-if="portfolios.length === 0" class="text-label-md text-on-surface-variant text-center py-4">Henüz portföy yok</div>
        <div v-else class="space-y-0">
          <div
            v-for="p in portfolios"
            :key="p.id"
            class="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors border-b border-surface-container last:border-0 group"
            @click="router.push(`/portfolio/${p.id}`)"
          >
            <div class="w-8 h-8 rounded-lg bg-primary-fixed text-on-primary-fixed text-label-sm font-bold flex items-center justify-center shrink-0">
              D
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-semibold text-on-surface truncate">{{ p.title || `${p.city}, ${p.district}` }}</div>
              <div class="text-label-sm text-on-surface-variant">{{ p.createdBy?.fullName }} · {{ formatDate(p.createdAt) }}</div>
            </div>
            <div class="text-label-sm font-semibold text-primary shrink-0">{{ fmtPrice(Number(p.price)) }}</div>
          </div>
        </div>
      </div>

      <!-- Talepler -->
      <div>
        <h3 class="text-label-sm text-on-surface-variant uppercase tracking-widest font-semibold mb-3">Talepler</h3>
        <div v-if="demands.length === 0" class="text-label-md text-on-surface-variant text-center py-4">Henüz talep yok</div>
        <div v-else class="space-y-0">
          <div
            v-for="d in demands"
            :key="d.id"
            class="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg hover:bg-surface-container-low cursor-pointer transition-colors border-b border-surface-container last:border-0 group"
            @click="router.push(`/demand/${d.id}`)"
          >
            <div class="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed text-label-sm font-bold flex items-center justify-center shrink-0">
              {{ typeInitial(d.types) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-[13px] font-semibold text-on-surface truncate">{{ d.customerName }}</div>
              <div class="text-label-sm text-on-surface-variant">{{ d.createdBy?.fullName }} · {{ formatDate(d.createdAt) }}</div>
            </div>
            <div class="text-label-sm font-semibold text-primary shrink-0">{{ fmtPrice(Number(d.minBudget || 0)) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
