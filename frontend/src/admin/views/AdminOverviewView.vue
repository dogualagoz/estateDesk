<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { adminService } from '../services/admin.service';
import type { AdminOverview, TimeseriesPoint } from '../types';
import AdminStatCard from '../components/AdminStatCard.vue';
import AdminTimeseriesChart from '../components/AdminTimeseriesChart.vue';

/** Genel bakış: platform toplamları + son 24 saat + 30 günlük giriş grafiği. */
const overview = ref<AdminOverview | null>(null);
const loginSeries = ref<TimeseriesPoint[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [o, ts] = await Promise.all([
      adminService.overview(),
      adminService.timeseries('logins', 30),
    ]);
    overview.value = o;
    loginSeries.value = ts.points;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight mb-stack-lg">Genel Bakış</h1>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else-if="overview">
      <div class="grid grid-cols-2 lg:grid-cols-5 gap-stack-md mb-stack-lg">
        <AdminStatCard label="Kullanıcı" :value="overview.totalUsers" icon="group" :hint="`${overview.activeUsers} aktif`" />
        <AdminStatCard label="Ofis" :value="overview.totalOffices" icon="apartment" />
        <AdminStatCard label="Portföy" :value="overview.totalPortfolios" icon="home_work" />
        <AdminStatCard label="Talep" :value="overview.totalDemands" icon="inbox" />
        <AdminStatCard
          label="Sunucu hatası"
          :value="overview.last24h.serverErrors"
          icon="error"
          hint="son 24 saat"
          :tone="overview.last24h.serverErrors > 0 ? 'danger' : 'default'"
        />
      </div>

      <div class="grid grid-cols-2 gap-stack-md mb-stack-lg">
        <AdminStatCard label="Giriş" :value="overview.last24h.logins" icon="login" hint="son 24 saat" />
        <AdminStatCard label="API isteği" :value="overview.last24h.requests" icon="swap_vert" hint="son 24 saat" />
      </div>

      <section class="card">
        <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">Girişler · son 30 gün</h2>
        <AdminTimeseriesChart :points="loginSeries" label="Giriş" />
      </section>
    </template>
  </div>
</template>
