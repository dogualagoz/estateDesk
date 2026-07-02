<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { adminService } from '../services/admin.service';
import type { AdminAuditLog, AdminRequestLog } from '../types';
import AdminPagination from '../components/AdminPagination.vue';

/**
 * Log inceleme: iki sekme — HTTP istek logları ve denetim (audit) kayıtları.
 * Filtreler backend'de uygulanır; requestId ile iki kaynak korele edilebilir.
 */
const tab = ref<'requests' | 'audit'>('audit');

const requestItems = ref<AdminRequestLog[]>([]);
const auditItems = ref<AdminAuditLog[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 25;
const loading = ref(false);

// Filtreler
const errorsOnly = ref(false);
const pathFilter = ref('');
const actionFilter = ref('');

let filterTimer: ReturnType<typeof setTimeout> | undefined;

async function load() {
  loading.value = true;
  try {
    if (tab.value === 'requests') {
      const res = await adminService.requestLogs({
        page: page.value,
        pageSize,
        errorsOnly: errorsOnly.value || undefined,
        path: pathFilter.value.trim() || undefined,
      });
      requestItems.value = res.items;
      total.value = res.total;
    } else {
      const res = await adminService.auditLogs({
        page: page.value,
        pageSize,
        action: actionFilter.value.trim() || undefined,
      });
      auditItems.value = res.items;
      total.value = res.total;
    }
  } finally {
    loading.value = false;
  }
}

watch(tab, () => {
  page.value = 1;
  load();
});
watch(page, load);
watch([errorsOnly, pathFilter, actionFilter], () => {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
onMounted(load);

function fmtTime(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short', timeStyle: 'medium' }).format(
    new Date(iso),
  );
}

function statusTone(code: number) {
  if (code >= 500) return 'text-error font-semibold';
  if (code >= 400) return 'text-amber-600 font-medium';
  return 'text-on-surface-variant';
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight mb-stack-lg">Loglar</h1>

    <!-- Sekmeler -->
    <div class="flex border-b border-outline-variant mb-stack-md">
      <button
        class="px-4 py-2.5 text-label-md font-semibold border-b-2 transition-all"
        :class="tab === 'audit' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'"
        @click="tab = 'audit'"
      >
        Denetim Kayıtları
      </button>
      <button
        class="px-4 py-2.5 text-label-md font-semibold border-b-2 transition-all"
        :class="tab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'"
        @click="tab = 'requests'"
      >
        HTTP İstekleri
      </button>
    </div>

    <!-- Filtreler -->
    <div class="flex items-center gap-stack-md flex-wrap mb-stack-md">
      <template v-if="tab === 'requests'">
        <input v-model="pathFilter" class="input w-64" placeholder="Path filtrele (ör. /auth)" />
        <label class="flex items-center gap-2 text-label-md text-on-surface-variant cursor-pointer">
          <input v-model="errorsOnly" type="checkbox" class="accent-primary" />
          Yalnız hatalar (4xx/5xx)
        </label>
      </template>
      <template v-else>
        <input v-model="actionFilter" class="input w-64" placeholder="Aksiyon filtrele (ör. auth.login)" />
      </template>
    </div>

    <!-- HTTP istekleri tablosu -->
    <div v-if="tab === 'requests'" class="card !p-0 overflow-x-auto">
      <table class="w-full text-label-md">
        <thead>
          <tr class="text-left text-label-sm text-on-surface-variant border-b border-outline-variant">
            <th class="px-4 py-3 font-medium">Zaman</th>
            <th class="px-4 py-3 font-medium">İstek</th>
            <th class="px-4 py-3 font-medium text-center">Durum</th>
            <th class="px-4 py-3 font-medium text-right">Süre</th>
            <th class="px-4 py-3 font-medium">Kullanıcı</th>
            <th class="px-4 py-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in requestItems" :key="l.id" class="border-b border-outline-variant/50">
            <td class="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">{{ fmtTime(l.createdAt) }}</td>
            <td class="px-4 py-2.5 font-mono text-[12px] text-on-surface">
              <span class="font-semibold">{{ l.method }}</span> {{ l.path }}
            </td>
            <td class="px-4 py-2.5 text-center" :class="statusTone(l.statusCode)">{{ l.statusCode }}</td>
            <td class="px-4 py-2.5 text-right text-on-surface-variant">{{ l.durationMs }} ms</td>
            <td class="px-4 py-2.5 text-on-surface-variant">{{ l.user?.email ?? '—' }}</td>
            <td class="px-4 py-2.5 text-on-surface-variant font-mono text-[12px]">{{ l.ip ?? '—' }}</td>
          </tr>
          <tr v-if="!loading && requestItems.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-on-surface-variant">Kayıt yok.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Denetim kayıtları tablosu -->
    <div v-else class="card !p-0 overflow-x-auto">
      <table class="w-full text-label-md">
        <thead>
          <tr class="text-left text-label-sm text-on-surface-variant border-b border-outline-variant">
            <th class="px-4 py-3 font-medium">Zaman</th>
            <th class="px-4 py-3 font-medium">Aksiyon</th>
            <th class="px-4 py-3 font-medium">Kullanıcı</th>
            <th class="px-4 py-3 font-medium">Hedef</th>
            <th class="px-4 py-3 font-medium">Detay</th>
            <th class="px-4 py-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in auditItems" :key="l.id" class="border-b border-outline-variant/50">
            <td class="px-4 py-2.5 text-on-surface-variant whitespace-nowrap">{{ fmtTime(l.createdAt) }}</td>
            <td class="px-4 py-2.5"><span class="tag">{{ l.action }}</span></td>
            <td class="px-4 py-2.5 text-on-surface-variant">{{ l.user?.email ?? '—' }}</td>
            <td class="px-4 py-2.5 text-on-surface-variant">
              <template v-if="l.targetType">{{ l.targetType }}<span class="text-on-surface-variant/50 font-mono text-[11px]"> {{ l.targetId?.slice(0, 8) }}</span></template>
            <template v-else>—</template>
            </td>
            <td class="px-4 py-2.5 text-on-surface-variant font-mono text-[11px] max-w-[220px] truncate" :title="l.metadata ? JSON.stringify(l.metadata) : ''">
              {{ l.metadata ? JSON.stringify(l.metadata) : '—' }}
            </td>
            <td class="px-4 py-2.5 text-on-surface-variant font-mono text-[12px]">{{ l.ip ?? '—' }}</td>
          </tr>
          <tr v-if="!loading && auditItems.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-on-surface-variant">Kayıt yok.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination v-model:page="page" :total="total" :page-size="pageSize" />
  </div>
</template>
