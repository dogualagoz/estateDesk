<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, provide } from 'vue';
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

const showAddModal = ref(false);

function openAddModal() { showAddModal.value = true; }
function closeAddModal() { showAddModal.value = false; }

provide('openAddModal', openAddModal);

function navigateTo(path: string) {
  closeAddModal();
  router.push(path);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeAddModal();
}

onMounted(() => window.addEventListener('keydown', handleKeydown));
onUnmounted(() => window.removeEventListener('keydown', handleKeydown));

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

    <!-- Add Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showAddModal"
          class="fixed inset-0 z-[200] flex items-center justify-center p-4"
          @click.self="closeAddModal"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeAddModal" />

          <!-- Panel -->
          <div class="relative bg-surface-container-lowest rounded-2xl shadow-lg p-8 w-full max-w-sm">
            <!-- Close -->
            <button
              class="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant transition-colors"
              @click="closeAddModal"
            >
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>

            <h2 class="text-headline-md font-semibold text-on-surface mb-1">Yeni Ekle</h2>
            <p class="text-label-md text-on-surface-variant mb-6">Ne eklemek istersiniz?</p>

            <div class="grid grid-cols-2 gap-4">
              <!-- Portföy -->
              <button
                @click="navigateTo('/portfolio/new')"
                class="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed/40 transition-all duration-150 cursor-pointer group"
              >
                <span class="material-symbols-outlined text-[44px] text-primary group-hover:scale-110 transition-transform duration-150">
                  maps_home_work
                </span>
                <div class="text-center">
                  <p class="text-label-md font-semibold text-on-surface">Portföy Ekle</p>
                  <p class="text-label-sm text-on-surface-variant mt-0.5">Mülk ilanı oluştur</p>
                </div>
              </button>

              <!-- Talep -->
              <button
                @click="navigateTo('/demand/new')"
                class="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-outline-variant hover:border-primary hover:bg-primary-fixed/40 transition-all duration-150 cursor-pointer group"
              >
                <span class="material-symbols-outlined text-[44px] text-primary group-hover:scale-110 transition-transform duration-150">
                  ads_click
                </span>
                <div class="text-center">
                  <p class="text-label-md font-semibold text-on-surface">Talep Ekle</p>
                  <p class="text-label-sm text-on-surface-variant mt-0.5">Alıcı talebi kaydet</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative {
  transform: scale(0.95) translateY(8px);
  opacity: 0;
}
</style>
