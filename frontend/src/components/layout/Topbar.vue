<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();

const initials = () => {
  if (!auth.user?.fullName) return '?';
  return auth.user.fullName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
</script>

<template>
  <header class="topbar">
    <div class="search-wrap">
      <span class="material-symbols-outlined search-icon">search</span>
      <input class="search-input" type="text" placeholder="Portföy veya talep ara…" />
    </div>

    <div class="topbar-actions" v-if="auth.user">
      <div class="avatar" :title="auth.user.fullName">
        {{ initials() }}
      </div>
      <div class="user-info">
        <span class="user-name">{{ auth.user.fullName }}</span>
        <span class="tag primary" style="font-size: 11px; padding: 2px 8px;">
          {{ auth.user.role === 'ADMIN' ? 'Admin' : 'Danışman' }}
        </span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: var(--surface-bright, var(--surface));
  border-bottom: 1px solid var(--hairline);
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
}

.search-wrap {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--on-surface-variant);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 16px 8px 40px;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 13px;
  line-height: 18px;
  color: var(--on-surface);
  transition: border-color 0.15s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
}

.search-input::placeholder {
  color: var(--on-surface-variant);
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--secondary-container);
  color: var(--on-secondary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid var(--outline-variant);
  cursor: pointer;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--on-surface);
  line-height: 18px;
}

@media (max-width: 768px) {
  .topbar { padding: 0 16px; }
  .search-wrap { max-width: none; }
  .user-info { display: none; }
}
</style>
