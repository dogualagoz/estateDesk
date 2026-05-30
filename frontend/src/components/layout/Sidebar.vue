<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const links = computed(() => {
  const items = [
    { to: '/', label: 'Dashboard', icon: 'dashboard' },
    { to: '/portfolio', label: 'Portföyler', icon: 'maps_home_work' },
    { to: '/demand', label: 'Talepler', icon: 'ads_click' },
  ];
  if (auth.isAdmin) items.push({ to: '/users', label: 'Kullanıcılar', icon: 'group' });
  return items;
});

function logout() {
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <aside class="sidebar">
    <div class="brand-area">
      <div class="brand-title">emlakdefter</div>
      <div class="brand-sub">Emlak Not Defteri</div>
    </div>

    <div class="new-btn-wrap">
      <router-link to="/portfolio/new" class="new-btn">
        <span class="material-symbols-outlined" style="font-size: 20px;">add</span>
        Yeni Portföy Ekle
      </router-link>
    </div>

    <nav class="nav-list">
      <router-link
        v-for="l in links"
        :key="l.to"
        :to="l.to"
        class="nav-link"
        active-class="active"
        exact-active-class=""
      >
        <span class="material-symbols-outlined nav-icon">{{ l.icon }}</span>
        <span>{{ l.label }}</span>
      </router-link>
    </nav>

    <div class="nav-bottom">
      <button class="nav-link" @click="logout">
        <span class="material-symbols-outlined nav-icon">logout</span>
        <span>Çıkış Yap</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  flex-shrink: 0;
  background: var(--primary-container);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

.brand-area {
  padding: 24px 24px 8px;
}

.brand-title {
  font-size: 32px;
  line-height: 40px;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: var(--on-primary);
}

.brand-sub {
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.05em;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--on-primary-container);
  margin-top: 2px;
}

.new-btn-wrap {
  padding: 16px;
}

.new-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: var(--secondary-container);
  color: var(--on-surface);
  border-radius: var(--radius);
  font-size: 14px;
  font-weight: 600;
  line-height: 20px;
  transition: background 0.15s;
  box-shadow: var(--shadow-1);
  text-decoration: none;
}

.new-btn:hover {
  background: var(--primary-fixed-dim);
  text-decoration: none;
}

.nav-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  margin-top: 8px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--on-primary-container);
  font-size: 14px;
  line-height: 20px;
  font-weight: 400;
  border-radius: var(--radius);
  transition: background 0.1s, color 0.1s;
  text-decoration: none;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  width: 100%;
  text-align: left;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: var(--on-primary);
  text-decoration: none;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.18);
  color: var(--on-primary);
  font-weight: 700;
}

.nav-icon {
  font-size: 22px;
}

.nav-bottom {
  padding: 8px;
  padding-bottom: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    top: auto;
    width: 100%;
    height: auto;
    flex-direction: row;
    padding: 0;
  }
  .brand-area, .new-btn-wrap, .nav-bottom { display: none; }
  .nav-list {
    flex-direction: row;
    justify-content: space-around;
    padding: 4px;
    margin: 0;
  }
  .nav-link {
    flex-direction: column;
    gap: 2px;
    padding: 6px 8px;
    font-size: 10px;
    text-align: center;
  }
  .nav-icon { font-size: 20px; }
}
</style>
