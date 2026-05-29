<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();

const fullName = ref('');
const email = ref('');
const password = ref('');
const error = ref<string | null>(null);

async function submit() {
  error.value = null;
  try {
    await auth.register({
      fullName: fullName.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    router.push('/onboarding');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Kayıt başarısız';
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <header class="flex flex-col items-center gap-2 text-center pt-2">
        <div class="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center text-primary mb-2">
          <span class="material-symbols-outlined text-[28px]" style="font-variation-settings:'FILL' 1">person_add</span>
        </div>
        <h1 class="text-headline-lg font-semibold tracking-tight text-primary">Hesap Oluştur</h1>
        <p class="text-label-md text-on-surface-variant">EstateDesk'e katılın</p>
      </header>

      <form class="flex flex-col gap-stack-md" @submit.prevent="submit">
        <div class="field full">
          <label for="fullName">Ad Soyad</label>
          <input id="fullName" class="input h-12" v-model="fullName" placeholder="Adınız Soyadınız" required autofocus minlength="2" />
        </div>
        <div class="field full">
          <label for="email">E-posta Adresi</label>
          <input id="email" class="input h-12" type="email" v-model="email" placeholder="ornek@estatedesk.com" required />
        </div>
        <div class="field full">
          <label for="password">Şifre</label>
          <input id="password" class="input h-12" type="password" v-model="password" placeholder="En az 6 karakter" required minlength="6" />
        </div>

        <p v-if="error" class="error-msg text-center">{{ error }}</p>

        <button class="btn primary w-full h-12 text-[15px] font-semibold mt-1 gap-2" :disabled="auth.loading" type="submit">
          {{ auth.loading ? 'Kaydediliyor…' : 'Kayıt Ol' }}
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>

      <footer class="text-center text-label-md text-on-surface-variant -mt-1">
        Zaten hesabınız var mı?
        <router-link to="/login" class="text-primary font-semibold hover:underline">Giriş yapın</router-link>
      </footer>
    </main>
  </div>
</template>
