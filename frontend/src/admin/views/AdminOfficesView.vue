<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { adminService } from '../services/admin.service';
import type { AdminOffice } from '../types';
import AdminPagination from '../components/AdminPagination.vue';

/** Tüm ofisler: arama + üye/portföy/talep sayılarıyla liste. */
const items = ref<AdminOffice[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 25;
const loading = ref(false);
const q = ref('');

let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function load() {
  loading.value = true;
  try {
    const res = await adminService.offices({
      q: q.value.trim() || undefined,
      page: page.value,
      pageSize,
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

watch(q, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(page, load);
onMounted(load);

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(iso));
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <div class="flex items-center justify-between flex-wrap gap-stack-md mb-stack-lg">
      <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight">
        Ofisler <span class="text-on-surface-variant font-normal text-body-lg">· {{ total }}</span>
      </h1>
      <div class="relative w-full sm:w-72">
        <span class="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
        <input v-model="q" class="input !pl-9" placeholder="Ofis adı ara…" />
      </div>
    </div>

    <div class="card !p-0 overflow-x-auto">
      <table class="w-full text-label-md">
        <thead>
          <tr class="text-left text-label-sm text-on-surface-variant border-b border-outline-variant">
            <th class="px-4 py-3 font-medium">Ofis</th>
            <th class="px-4 py-3 font-medium">Kurucu</th>
            <th class="px-4 py-3 font-medium text-center">Üye</th>
            <th class="px-4 py-3 font-medium text-center">Portföy</th>
            <th class="px-4 py-3 font-medium text-center">Talep</th>
            <th class="px-4 py-3 font-medium">Kuruluş</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="o in items"
            :key="o.id"
            class="border-b border-outline-variant/50 hover:bg-surface-container/40 cursor-pointer"
            @click="$router.push({ name: 'admin.office.detail', params: { id: o.id } })"
          >
            <td class="px-4 py-3 font-medium text-on-surface">{{ o.name }}</td>
            <td class="px-4 py-3">
              <div class="text-on-surface">{{ o.owner.fullName }}</div>
              <div class="text-label-sm text-on-surface-variant">{{ o.owner.email }}</div>
            </td>
            <td class="px-4 py-3 text-center text-on-surface-variant">{{ o._count.members }}</td>
            <td class="px-4 py-3 text-center text-on-surface-variant">{{ o._count.portfolios }}</td>
            <td class="px-4 py-3 text-center text-on-surface-variant">{{ o._count.demands }}</td>
            <td class="px-4 py-3 text-on-surface-variant whitespace-nowrap">{{ fmtDate(o.createdAt) }}</td>
          </tr>
          <tr v-if="!loading && items.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-on-surface-variant">Kayıt bulunamadı.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination v-model:page="page" :total="total" :page-size="pageSize" />
  </div>
</template>
