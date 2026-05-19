import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import type { User } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('ed_token'));
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');

  async function login(email: string, password: string) {
    loading.value = true;
    try {
      const res = await authService.login(email, password);
      token.value = res.accessToken;
      user.value = res.user;
      localStorage.setItem('ed_token', res.accessToken);
    } finally {
      loading.value = false;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('ed_token');
  }

  async function fetchMe() {
    if (!token.value) return;
    try {
      user.value = await authService.me();
    } catch {
      logout();
    }
  }

  return { token, user, loading, isAuthenticated, isAdmin, login, logout, fetchMe };
});
