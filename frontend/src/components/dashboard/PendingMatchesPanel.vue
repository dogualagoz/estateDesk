<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { PendingMatchItem } from '@/services/dashboard.service';
import { PROPERTY_TYPE_LABELS } from '@/types/portfolio';
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
  if (days < 7) return { borderColor: 'border-l-emerald-400', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', label: `${days}g` };
  if (days < 14) return { borderColor: 'border-l-amber-400', bgColor: 'bg-amber-50', textColor: 'text-amber-700', label: `${days}g` };
  return { borderColor: 'border-l-red-400', bgColor: 'bg-red-50', textColor: 'text-red-600', label: `${days}g` };
};

const typeInitial = (types: string[] | undefined): string => {
  if (!types?.length) return '?';
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
    <div class="flex items-center justify-between">
      <h2 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Bekleyen Talepler</h2>
      <router-link v-if="items.length > 0" to="/demand?status=ACTIVE" class="text-label-md text-primary hover:underline">Tümünü Gör →</router-link>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>
    <div v-else-if="items.length === 0" class="empty">Eşleşmesi beklenen talep yok</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
      <article
        v-for="item in items"
        :key="item.demand.id"
        :class="['bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden cursor-pointer hover:shadow-md transition-all group', getAgeStatus(getDaysSince(item.demand.createdAt)).borderColor, 'border-l-4']"
        @click="router.push(`/demand/${item.demand.id}`)"
      >
        <div class="p-stack-md space-y-stack-md">
          <!-- Müşteri adı + urgency pill -->
          <div class="flex items-start justify-between gap-2">
            <span class="text-body-md font-semibold text-on-surface">{{ item.demand.customerName }}</span>
            <span :class="['text-label-sm px-2 py-0.5 rounded-full shrink-0 font-semibold', getAgeStatus(getDaysSince(item.demand.createdAt)).bgColor, getAgeStatus(getDaysSince(item.demand.createdAt)).textColor]">
              {{ getAgeStatus(getDaysSince(item.demand.createdAt)).label }}
            </span>
          </div>

          <!-- Tip chip + konum -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span v-if="item.demand.types?.length" class="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
              {{ item.demand.types.map((t: any) => PROPERTY_TYPE_LABELS[t]).join(', ') }}
            </span>
            <span v-if="item.demand.regions?.length" class="text-label-sm text-on-surface-variant">{{ item.demand.regions[0] }}</span>
          </div>

          <!-- Bütçe -->
          <div v-if="item.demand.minBudget || item.demand.maxBudget" class="text-[13px] font-semibold text-on-surface">
            <span v-if="item.demand.minBudget && item.demand.maxBudget">{{ fmtPrice(Number(item.demand.minBudget)) }} – {{ fmtPrice(Number(item.demand.maxBudget)) }}</span>
            <span v-else-if="item.demand.maxBudget">Maks {{ fmtPrice(Number(item.demand.maxBudget)) }}</span>
            <span v-else-if="item.demand.minBudget">Min {{ fmtPrice(Number(item.demand.minBudget)) }}</span>
          </div>

          <!-- Eşleşme bölümü -->
          <div class="border-t border-outline-variant pt-stack-md">
            <div v-if="item.topMatch" class="flex items-center gap-2">
              <span class="w-9 h-9 rounded-lg bg-primary text-on-primary text-label-sm font-bold flex items-center justify-center shrink-0">
                {{ Math.round(item.topMatch.score) }}
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-semibold text-on-surface truncate">
                  {{ PROPERTY_TYPE_LABELS[item.topMatch.portfolio.type] }}, {{ item.topMatch.portfolio.city }}
                </div>
                <div class="text-label-sm text-primary font-semibold">{{ fmtPrice(Number(item.topMatch.portfolio.price)) }}</div>
              </div>
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-primary transition-colors shrink-0">arrow_forward</span>
            </div>
            <div v-else class="text-label-sm text-on-surface-variant italic">Henüz eşleşme bulunamadı</div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
