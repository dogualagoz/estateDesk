<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { adminService } from '../services/admin.service';
import type { AdminSummary, TimeseriesPoint } from '../types';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTimeseriesChart from '../components/AdminTimeseriesChart.vue';

/** Analitik: DAU/WAU/MAU + büyüme + metrik seçmeli zaman serisi + en aktif ofisler. */
const days = ref(30);
const metric = ref<'logins' | 'signups' | 'requests'>('logins');

const summary = ref<AdminSummary | null>(null);
const points = ref<TimeseriesPoint[]>([]);
const loading = ref(true);

const METRIC_LABELS = { logins: 'Giriş', signups: 'Yeni Kayıt', requests: 'API İsteği' } as const;

async function load() {
  loading.value = true;
  try {
    const [s, ts] = await Promise.all([
      adminService.summary(days.value),
      adminService.timeseries(metric.value, days.value),
    ]);
    summary.value = s;
    points.value = ts.points;
  } finally {
    loading.value = false;
  }
}

watch([days, metric], load);
onMounted(load);
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <div class="flex items-center justify-between flex-wrap gap-stack-md mb-stack-lg">
      <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight">Analitik</h1>
      <select v-model.number="days" class="select w-36">
        <option :value="7">Son 7 gün</option>
        <option :value="30">Son 30 gün</option>
        <option :value="90">Son 90 gün</option>
      </select>
    </div>

    <div v-if="loading && !summary" class="empty">Yükleniyor…</div>

    <template v-else-if="summary">
      <!-- Aktif kullanıcı metrikleri -->
      <div class="grid grid-cols-3 gap-stack-md mb-stack-md">
        <AdminStatCard label="Günlük aktif (DAU)" :value="summary.dau" icon="today" />
        <AdminStatCard label="Haftalık aktif (WAU)" :value="summary.wau" icon="date_range" />
        <AdminStatCard label="Aylık aktif (MAU)" :value="summary.mau" icon="calendar_month" />
      </div>
      <div class="grid grid-cols-3 gap-stack-md mb-stack-lg">
        <AdminStatCard :label="`Yeni kullanıcı · ${summary.days}g`" :value="summary.newUsers" icon="person_add" />
        <AdminStatCard :label="`Yeni ofis · ${summary.days}g`" :value="summary.newOffices" icon="add_business" />
        <AdminStatCard :label="`Giriş · ${summary.days}g`" :value="summary.logins" icon="login" />
      </div>

      <!-- Zaman serisi -->
      <section class="card mb-stack-lg">
        <div class="flex items-center justify-between flex-wrap gap-2 mb-stack-md">
          <h2 class="text-body-lg font-semibold text-on-surface">{{ METRIC_LABELS[metric] }} · günlük</h2>
          <div class="flex gap-1">
            <button
              v-for="(label, key) in METRIC_LABELS"
              :key="key"
              class="px-3 py-1.5 rounded-lg text-label-sm font-medium border transition-all"
              :class="metric === key ? 'bg-primary text-on-primary border-primary' : 'text-on-surface-variant border-outline-variant hover:border-primary/50'"
              @click="metric = key"
            >
              {{ label }}
            </button>
          </div>
        </div>
        <AdminTimeseriesChart :points="points" :label="METRIC_LABELS[metric]" />
      </section>

      <!-- En aktif ofisler -->
      <section class="card">
        <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">
          En Aktif Ofisler <span class="text-on-surface-variant font-normal text-label-md">· istek hacmine göre, son {{ summary.days }} gün</span>
        </h2>
        <div v-if="summary.topOffices.length === 0" class="text-label-md text-on-surface-variant">Henüz veri yok.</div>
        <div v-else class="space-y-2">
          <div v-for="(o, i) in summary.topOffices" :key="o.officeId" class="flex items-center gap-3">
            <span class="w-6 text-label-sm text-on-surface-variant text-right">{{ i + 1 }}.</span>
            <span class="flex-1 text-label-md text-on-surface truncate">{{ o.name }}</span>
            <div class="w-40 h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                class="h-full rounded-full bg-primary"
                :style="{ width: (o.requests / summary.topOffices[0].requests) * 100 + '%' }"
              />
            </div>
            <span class="w-16 text-right text-label-sm text-on-surface-variant">{{ o.requests }}</span>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
