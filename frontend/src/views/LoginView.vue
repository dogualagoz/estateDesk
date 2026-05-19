<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref<string | null>(null);

async function submit() {
  error.value = null;
  try {
    await auth.login(email.value.trim(), password.value);
    const redirect = (route.query.redirect as string) || '/';
    router.push(redirect);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Giriş başarısız';
  }
}
</script>

<template>
  <div class="login-page">
    <main class="login-card">
      <div class="top-bar"></div>

      <header class="login-header">
        <div class="logo-box">
          <span class="material-symbols-outlined" style="font-size: 28px; font-variation-settings: 'FILL' 1;">domain</span>
        </div>
        <h1>EstateDesk</h1>
        <p class="muted">Yönetim paneline hoş geldiniz</p>
      </header>

      <form class="login-form" @submit.prevent="submit">
        <div class="field full">
          <label for="email">E-posta Adresi</label>
          <div class="input-wrap">
            <span class="material-symbols-outlined input-icon">mail</span>
            <input id="email" class="input with-icon" type="email" v-model="email" placeholder="ornek@estatedesk.com" required autofocus />
          </div>
        </div>

        <div class="field full">
          <label for="password">Şifre</label>
          <div class="input-wrap">
            <span class="material-symbols-outlined input-icon">lock</span>
            <input id="password" class="input with-icon" type="password" v-model="password" placeholder="••••••••" required />
          </div>
        </div>

        <p v-if="error" class="error">{{ error }}</p>

        <button class="btn primary submit-btn" :disabled="auth.loading" type="submit">
          {{ auth.loading ? 'Giriş yapılıyor…' : 'Giriş Yap' }}
          <span class="material-symbols-outlined" style="font-size: 18px;">arrow_forward</span>
        </button>
      </form>

      <footer class="login-footer">
        <span class="material-symbols-outlined" style="font-size: 14px;">verified_user</span>
        Güvenli bağlantı
      </footer>
    </main>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  padding: 16px;
}

.login-card {
  width: 420px;
  max-width: 100%;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-2);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  position: relative;
  overflow: hidden;
}

.top-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--primary);
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  text-align: center;
  padding-top: 8px;
}

.logo-box {
  width: 56px;
  height: 56px;
  background: var(--surface-container);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  margin-bottom: 8px;
}

.login-header h1 {
  font-size: 32px;
  line-height: 40px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--primary);
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  color: var(--outline);
  pointer-events: none;
}

.input.with-icon {
  padding-left: 40px;
  height: 48px;
}

.submit-btn {
  height: 48px;
  margin-top: 8px;
  font-size: 14px;
  font-weight: 500;
  gap: 6px;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  color: var(--outline);
  margin-top: -8px;
}
</style>
