<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { adminService } from '../services/admin.service';
import type { AdminSystem } from '../types';
import AdminStatCard from '../components/AdminStatCard.vue';

/** Sistem sağlığı: DB gecikmesi, uptime, bellek, log tablo boyutları. 30 sn'de bir yenilenir. */
const system = ref<AdminSystem | null>(null);
const loading = ref(true);
let timer: ReturnType<typeof setInterval> | undefined;

async function load() {
  try {
    system.value = await adminService.system();
  } finally {
    loading.value = false;
  }
}

function fmtUptime(seconds: number) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}g ${h}s`;
  if (h > 0) return `${h}s ${m}dk`;
  return `${m}dk`;
}

onMounted(() => {
  load();
  timer = setInterval(load, 30_000);
});
onUnmounted(() => timer && clearInterval(timer));
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight mb-stack-lg">Sistem</h1>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else-if="system">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        <AdminStatCard
          label="Veritabanı gecikmesi"
          :value="`${system.dbPingMs} ms`"
          icon="database"
          :tone="system.dbPingMs > 100 ? 'danger' : 'default'"
        />
        <AdminStatCard label="Çalışma süresi" :value="fmtUptime(system.uptimeSeconds)" icon="schedule" />
        <AdminStatCard label="Bellek (RSS)" :value="`${system.memoryMb} MB`" icon="memory" />
        <AdminStatCard label="Node" :value="system.nodeVersion" icon="terminal" />
      </div>

      <section class="card">
        <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">Log Tabloları</h2>
        <div class="grid grid-cols-2 gap-stack-md">
          <AdminStatCard label="İstek logu" :value="system.tables.requestLogs" icon="receipt_long" hint="30 gün saklanır" />
          <AdminStatCard label="Denetim kaydı" :value="system.tables.auditLogs" icon="verified_user" hint="365 gün saklanır" />
        </div>
        <p class="text-label-sm text-on-surface-variant mt-stack-md">
          <span class="material-symbols-outlined text-[14px] align-text-bottom">info</span>
          Eski kayıtlar her gece 04:00'te otomatik temizlenir (retention cron'u).
        </p>
      </section>
    </template>
  </div>
</template>
