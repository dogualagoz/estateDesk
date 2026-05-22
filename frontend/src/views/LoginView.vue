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
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <!-- Accent top bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <!-- Header -->
      <header class="flex flex-col items-center gap-2 text-center pt-2">
        <div class="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center text-primary mb-2">
          <span class="material-symbols-outlined text-[28px]" style="font-variation-settings:'FILL' 1">domain</span>
        </div>
        <h1 class="text-headline-lg font-semibold tracking-tight text-primary">EstateDesk</h1>
        <p class="text-label-md text-on-surface-variant">Yönetim paneline hoş geldiniz</p>
      </header>

      <!-- Form -->
      <form class="flex flex-col gap-stack-md" @submit.prevent="submit">
        <div class="field full">
          <label for="email">E-posta Adresi</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">mail</span>
            <input
              id="email"
              class="input pl-10 h-12"
              type="email"
              v-model="email"
              placeholder="ornek@estatedesk.com"
              required
              autofocus
            />
          </div>
        </div>

        <div class="field full">
          <label for="password">Şifre</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">lock</span>
            <input
              id="password"
              class="input pl-10 h-12"
              type="password"
              v-model="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <p v-if="error" class="error-msg text-center">{{ error }}</p>

        <button
          class="btn primary w-full h-12 text-[15px] font-semibold mt-1 gap-2"
          :disabled="auth.loading"
          type="submit"
        >
          {{ auth.loading ? 'Giriş yapılıyor…' : 'Giriş Yap' }}
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>

      <!-- Footer -->
      <footer class="flex items-center justify-center gap-1 text-label-sm text-outline -mt-2">
        <span class="material-symbols-outlined text-[14px]">verified_user</span>
        Güvenli bağlantı
      </footer>
    </main>
  </div>
</template>
