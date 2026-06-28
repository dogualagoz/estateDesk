<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted, watch, nextTick, provide } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useConfirm } from '@/composables/useConfirm';
import DemoBanner from '@/components/demo/DemoBanner.vue';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const { confirm } = useConfirm();

const isDemo = computed(() => auth.isDemoSession);

const links = computed(() =>
  isDemo.value
    ? [
        { to: '/demo',           label: 'Dashboard',  icon: 'dashboard' },
        { to: '/demo/portfolio', label: 'Portföyler', icon: 'maps_home_work' },
        { to: '/demo/demand',    label: 'Talepler',   icon: 'ads_click' },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard',  icon: 'dashboard' },
        { to: '/portfolio', label: 'Portföyler', icon: 'maps_home_work' },
        { to: '/demand',    label: 'Talepler',   icon: 'ads_click' },
        { to: '/office',    label: 'Ofisim',     icon: 'groups' },
      ],
);

const brandPath = computed(() => (isDemo.value ? '/demo' : '/dashboard'));
const profilePath = computed(() => (auth.user ? `/users/${auth.user.id}` : '/'));

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

async function logout() {
  const ok = await confirm({
    title: 'Çıkış yap',
    message: 'Oturumunuzu kapatmak istediğinizden emin misiniz?',
    confirmText: 'Çıkış Yap',
    icon: 'logout',
  });
  if (!ok) return;
  auth.logout();
  router.push('/login');
}

function exitDemo() {
  auth.exitDemo();
  router.push('/');
}

// ── Mobil alt bar: kayan aktif gösterge ──
const navRef = ref<HTMLElement | null>(null);
// En uzun eşleşen linki aktif kabul et ('/' yalnızca tam eşleşmede)
const activeIndex = computed(() => {
  const path = route.path;
  let best = -1;
  let bestLen = -1;
  links.value.forEach((l, i) => {
    const match = l.to === '/' ? path === '/' : path === l.to || path.startsWith(l.to + '/');
    if (match && l.to.length > bestLen) {
      best = i;
      bestLen = l.to.length;
    }
  });
  return best;
});

const indicator = reactive({ x: 0, w: 0, visible: false });

function updateIndicator() {
  const nav = navRef.value;
  if (!nav) return;
  // querySelectorAll DOM (v-for) sırasını verir; offsetLeft görsel konumu yansıtır
  const tabs = nav.querySelectorAll<HTMLElement>('[data-tab]');
  const el = tabs[activeIndex.value];
  if (!el) {
    indicator.visible = false;
    return;
  }
  indicator.x = el.offsetLeft;
  indicator.w = el.offsetWidth;
  indicator.visible = true;
}

watch(activeIndex, () => nextTick(updateIndicator));
onMounted(() => {
  nextTick(updateIndicator);
  // İkon/font yüklenmesi sonrası konumu düzelt
  setTimeout(updateIndicator, 250);
  window.addEventListener('resize', updateIndicator);
});
onUnmounted(() => window.removeEventListener('resize', updateIndicator));
</script>

<template>
  <div class="flex min-h-screen bg-background text-on-background font-sans antialiased">

    <!-- Sidebar (masaüstü) -->
    <aside class="w-60 shrink-0 hidden md:flex flex-col bg-primary text-on-primary fixed top-0 left-0 h-screen z-50">

      <!-- Brand -->
      <div class="px-6 py-5 border-b border-white/10">
        <router-link :to="brandPath" class="flex items-center gap-2.5">
          <img :src="'/logo.svg'" alt="emlakdefter" class="h-8 w-8 rounded-lg" />
          <span class="font-bold text-headline-md text-on-primary tracking-tight">emlakdefter</span>
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
        <router-link
          :to="profilePath"
          class="flex items-center gap-3 mb-3 -mx-2 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors duration-150"
          title="Profilim — portföy ve taleplerim"
        >
          <div class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-bold text-on-primary select-none shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <div class="text-label-md font-semibold text-on-primary truncate">{{ auth.user?.fullName }}</div>
            <div class="text-label-sm text-on-primary/60">{{ auth.user?.role === 'ADMIN' ? 'Admin' : 'Danışman' }}</div>
          </div>
        </router-link>
        <button
          v-if="isDemo"
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-label-md text-on-primary/65 hover:bg-white/10 hover:text-on-primary transition-colors duration-150"
          @click="exitDemo"
        >
          <span class="material-symbols-outlined text-[18px]">arrow_back</span>
          Siteye Dön
        </button>
        <button
          v-else
          class="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-label-md text-on-primary/65 hover:bg-white/10 hover:text-on-primary transition-colors duration-150"
          @click="logout"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          Çıkış Yap
        </button>
      </div>
    </aside>

    <!-- Mobil üst bar -->
    <header class="md:hidden fixed top-0 inset-x-0 z-40 h-14 flex items-center justify-between px-4 bg-primary text-on-primary">
      <router-link :to="brandPath" class="flex items-center gap-2">
        <img :src="'/logo.svg'" alt="emlakdefter" class="h-7 w-7 rounded-lg" />
        <span class="font-bold text-headline-md text-on-primary tracking-tight">emlakdefter</span>
      </router-link>
      <router-link
        :to="profilePath"
        class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-[13px] font-bold text-on-primary select-none active:scale-95 transition-transform"
        title="Profilim"
      >
        {{ initials }}
      </router-link>
    </header>

    <!-- Main Content -->
    <main class="flex-1 md:pl-60 min-w-0 pt-14 md:pt-0 pb-24 md:pb-0">
      <DemoBanner v-if="isDemo" class="sticky top-14 md:top-0 z-30" />
      <slot />
    </main>

    <!-- Mobil alt navigasyon -->
    <nav
      ref="navRef"
      class="md:hidden fixed bottom-0 inset-x-0 z-40 bg-primary text-on-primary rounded-t-2xl shadow-[0_-6px_24px_rgba(0,0,0,0.18)]"
      style="padding-bottom: env(safe-area-inset-bottom)"
    >
      <div class="relative flex items-stretch justify-around px-1.5 pt-1.5">
        <!-- Kayan aktif gösterge -->
        <span
          class="absolute top-1.5 bottom-1.5 left-0 rounded-2xl bg-white/15 pointer-events-none transition-[transform,width,opacity] duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
          :style="{
            transform: `translateX(${indicator.x}px)`,
            width: `${indicator.w}px`,
            opacity: indicator.visible ? 1 : 0,
          }"
        />

        <router-link
          v-for="(l, i) in links"
          :key="l.to"
          :to="l.to"
          data-tab
          class="relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-200"
          :class="[
            { 'order-2': i >= 2 },
            activeIndex === i ? 'text-on-primary font-semibold' : 'text-on-primary/60',
          ]"
        >
          <span
            class="material-symbols-outlined text-[22px] transition-transform duration-300 ease-[cubic-bezier(0.34,1.2,0.64,1)]"
            :class="activeIndex === i ? '-translate-y-0.5 scale-110' : ''"
            :style="{ fontVariationSettings: `'FILL' ${activeIndex === i ? 1 : 0}, 'wght' 500, 'GRAD' 0, 'opsz' 24` }"
          >{{ l.icon }}</span>
          {{ l.label }}
        </router-link>

        <!-- Ortada yükseltilmiş Yeni Ekle (FAB) -->
        <button
          v-if="!isDemo"
          class="order-1 relative z-10 w-16 shrink-0 flex items-start justify-center"
          aria-label="Yeni Ekle"
          @click="openAddModal"
        >
          <span class="absolute -top-6 w-14 h-14 rounded-full bg-on-primary text-primary flex items-center justify-center shadow-lg ring-4 ring-primary active:scale-90 transition-transform duration-200">
            <span class="material-symbols-outlined text-[28px]">add</span>
          </span>
        </button>
      </div>
    </nav>

    <!-- Add Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="showAddModal"
          class="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-4"
          @click.self="closeAddModal"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeAddModal" />

          <!-- Panel (mobilde alttan yukarı kayan sheet) -->
          <div class="add-sheet relative bg-surface-container-lowest rounded-t-2xl md:rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-none md:max-w-sm pb-[calc(1.5rem+env(safe-area-inset-bottom))] md:pb-8">
            <!-- Tutma çubuğu (mobil) -->
            <div class="md:hidden mx-auto -mt-2 mb-4 h-1.5 w-10 rounded-full bg-outline-variant" />

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
/* Backdrop solması */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

/* Panel — mobilde alttan yukarı kayar */
.modal-fade-enter-active .add-sheet,
.modal-fade-leave-active .add-sheet {
  transition: transform 0.34s cubic-bezier(0.32, 0.72, 0, 1);
}
.modal-fade-enter-from .add-sheet,
.modal-fade-leave-to .add-sheet {
  transform: translateY(100%);
}

/* Masaüstü — yumuşak ölçek/kayma */
@media (min-width: 768px) {
  .modal-fade-enter-from .add-sheet,
  .modal-fade-leave-to .add-sheet {
    transform: scale(0.95) translateY(8px);
  }
}
</style>
