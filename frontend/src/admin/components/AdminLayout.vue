<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/services/api';

/**
 * Panel iskeleti: sol menü + içerik. Ana AppShell bilinçli olarak
 * kullanılmaz (izolasyon — bkz. README.md).
 */
const auth = useAuthStore();
const router = useRouter();

const NAV = [
  { name: 'admin.overview', label: 'Genel Bakış', icon: 'space_dashboard' },
  { name: 'admin.users', label: 'Kullanıcılar', icon: 'group' },
  { name: 'admin.offices', label: 'Ofisler', icon: 'apartment' },
  { name: 'admin.logs', label: 'Loglar', icon: 'receipt_long' },
  { name: 'admin.analytics', label: 'Analitik', icon: 'monitoring' },
  { name: 'admin.system', label: 'Sistem', icon: 'host' },
];

async function logout() {
  // Audit kaydı için backend'e haber ver; başarısız olsa da çıkışı engelleme
  await api.post('/auth/logout').catch(() => undefined);
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen flex bg-surface">
    <!-- Sol menü -->
    <aside class="w-56 shrink-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col">
      <div class="flex items-center gap-2.5 px-4 py-5 border-b border-outline-variant">
        <img src="/logo.svg" alt="emlakdefter" class="w-8 h-8" />
        <div class="min-w-0">
          <p class="text-label-md font-bold text-on-surface leading-tight">emlakdefter</p>
          <p class="text-[11px] text-on-surface-variant leading-tight">Yönetim Paneli</p>
        </div>
      </div>

      <nav class="flex-1 px-2 py-3 space-y-0.5">
        <RouterLink
          v-for="item in NAV"
          :key="item.name"
          :to="{ name: item.name }"
          class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-label-md font-medium transition-colors"
          :class="
            $route.name === item.name
              ? 'bg-primary-fixed/60 text-on-surface'
              : 'text-on-surface-variant hover:bg-surface-container'
          "
        >
          <span class="material-symbols-outlined text-[19px]">{{ item.icon }}</span>
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-2 py-3 border-t border-outline-variant">
        <p class="px-3 pb-2 text-[11px] text-on-surface-variant truncate">{{ auth.user?.email }}</p>
        <button
          class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-label-md font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
          @click="logout"
        >
          <span class="material-symbols-outlined text-[19px]">logout</span>
          Çıkış
        </button>
      </div>
    </aside>

    <!-- İçerik -->
    <main class="flex-1 min-w-0 overflow-y-auto">
      <RouterView />
    </main>
  </div>
</template>
