import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '@/services/auth.service';
import { DEMO_TOKEN_KEY } from '@/services/api';
import type { User } from '@/types/user';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('ed_token'));
  // Geçici demo oturumu (sessionStorage) — gerçek login'den ayrı tutulur
  const demoToken = ref<string | null>(sessionStorage.getItem(DEMO_TOKEN_KEY));
  const user = ref<User | null>(null);
  const loading = ref(false);

  // Gerçek hesapla giriş yapılmış mı? (demo sayılmaz)
  const isRealAuth = computed(() => !!token.value);
  // Geçici demo oturumu aktif mi?
  const isDemoSession = computed(() => !!demoToken.value);
  // Korumalı route erişimi için: gerçek veya demo oturumu yeterli
  const isAuthenticated = computed(() => !!token.value || !!demoToken.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const hasOffice = computed(() => !!user.value?.officeId);

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

  async function register(payload: { email: string; fullName: string; password: string }) {
    loading.value = true;
    try {
      const res = await authService.register(payload);
      token.value = res.accessToken;
      user.value = res.user;
      localStorage.setItem('ed_token', res.accessToken);
    } finally {
      loading.value = false;
    }
  }

  /** Geçici demo oturumu açar — gerçek login token'ına dokunmaz. */
  async function loginDemo() {
    loading.value = true;
    try {
      const res = await authService.demoLogin();
      demoToken.value = res.accessToken;
      user.value = res.user;
      sessionStorage.setItem(DEMO_TOKEN_KEY, res.accessToken);
    } finally {
      loading.value = false;
    }
  }

  /** Demo oturumunu kapatır (çıkış değil — sadece geçici oturumu temizler). */
  function exitDemo() {
    demoToken.value = null;
    if (!token.value) user.value = null;
    sessionStorage.removeItem(DEMO_TOKEN_KEY);
  }

  function logout() {
    token.value = null;
    demoToken.value = null;
    user.value = null;
    localStorage.removeItem('ed_token');
    sessionStorage.removeItem(DEMO_TOKEN_KEY);
  }

  function setToken(newToken: string) {
    token.value = newToken;
    localStorage.setItem('ed_token', newToken);
  }

  function setUser(newUser: User) {
    user.value = newUser;
  }

  async function fetchMe() {
    if (!token.value && !demoToken.value) return;
    try {
      user.value = await authService.me();
    } catch {
      if (token.value) logout();
      else exitDemo();
    }
  }

  return {
    token, demoToken, user, loading,
    isAuthenticated, isRealAuth, isDemoSession, isAdmin, hasOffice,
    login, register, loginDemo, exitDemo, logout, setToken, setUser, fetchMe,
  };
});
