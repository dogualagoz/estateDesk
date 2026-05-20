<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const links = computed(() => {
  const items = [
    { to: '/',          label: 'Dashboard',  icon: 'dashboard' },
    { to: '/portfolio', label: 'Portföyler', icon: 'maps_home_work' },
    { to: '/demand',    label: 'Talepler',   icon: 'ads_click' },
  ];
  if (auth.isAdmin) items.push({ to: '/users', label: 'Kullanıcılar', icon: 'group' });
  return items;
});

const initials = computed(() => {
  if (!auth.user?.fullName) return '?';
  return auth.user.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
});

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex min-h-screen bg-background text-on-background font-sans antialiased">

    <!-- Sidebar -->
    <aside class="w-60 shrink-0 flex flex-col bg-primary text-on-primary fixed top-0 left-0 h-screen z-50">

      <!-- Brand -->
      <div class="px-6 py-5 border-b border-white/10">
        <router-link to="/" class="font-bold text-headline-md text-on-primary tracking-tight">
          EstateDesk
        </router-link>
      </div>

      <!-- Nav Links -->
      <nav class="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <router-link
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-label-md text-on-primary/65 hover:bg-white/10 hover:text-on-primary transition-colors duration-150"
          active-class="!bg-white/15 !text-on-primary !font-semibold"
        >
          <span class="material-symbols-outlined text-[20px]">{{ l.icon }}</span>
          {{ l.label }}
        </router-link>
      </nav>

      <!-- New Portfolio CTA -->
      <div class="px-3 pb-3">
        <router-link
          to="/portfolio/new"
          class="flex items-center gap-2 px-3 py-2.5 bg-white/15 hover:bg-white/20 rounded-lg text-label-md text-on-primary font-medium transition-colors duration-150"
        >
          <span class="material-symbols-outlined text-[18px]">add</span>
          Yeni Portföy
        </router-link>
      </div>

      <!-- User + Logout -->
      <div class="border-t border-white/10 px-4 py-4">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-bold text-on-primary select-none shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <div class="text-label-md font-semibold text-on-primary truncate">{{ auth.user?.fullName }}</div>
            <div class="text-label-sm text-on-primary/60">{{ auth.user?.role === 'ADMIN' ? 'Admin' : 'Danışman' }}</div>
          </div>
        </div>
        <button
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-label-md text-on-primary/65 hover:bg-white/10 hover:text-on-primary transition-colors duration-150"
          @click="logout"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          Çıkış Yap
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 pl-60 min-w-0">
      <slot />
    </main>
  </div>
</template>
