<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/auth.service';
import { useAsync } from '@/composables/useAsync';

const router = useRouter();
const email = ref('');
const success = ref(false);

const requestOp = useAsync();

const handleSubmit = async () => {
  if (!email.value) return;

  const result = await requestOp.run(
    () => authService.forgotPassword(email.value),
    {
      errorMessage: 'İstek başarısız oldu. Lütfen tekrar deneyin',
    },
  );

  if (result?.message) {
    success.value = true;
    setTimeout(() => {
      navigateToLogin();
    }, 3000);
  }
};

const navigateToLogin = () => {
  router.push({ name: 'login' });
};
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <!-- Accent top bar -->
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <!-- Header -->
      <header class="flex flex-col items-center gap-2 text-center pt-2">
        <img :src="'/logo.svg'" alt="emlakdefter" class="w-16 h-16 rounded-xl mb-2" />
        <h1 class="text-headline-lg font-semibold tracking-tight text-primary">emlakdefter</h1>
        <p class="text-label-md text-on-surface-variant">Şifrenizi Sıfırlayın</p>
      </header>

      <!-- Form or Success -->
      <div v-if="!success" class="flex flex-col gap-stack-md">
        <form class="flex flex-col gap-stack-md" @submit.prevent="handleSubmit">
          <div class="field full">
            <label for="email">E-posta Adresi</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">mail</span>
              <input
                id="email"
                v-model="email"
                class="input pl-10 h-12"
                type="email"
                placeholder="ornek@estatedesk.com"
                required
                autofocus
                :disabled="requestOp.loading.value"
              />
            </div>
            <p class="text-label-sm text-on-surface-variant mt-1">
              EstateDesk hesabınızla bağlantılı e-posta adresini girin
            </p>
          </div>

          <p v-if="requestOp.error.value" class="error-msg text-center">{{ requestOp.error.value }}</p>

          <button
            type="submit"
            :disabled="!email || requestOp.loading.value"
            class="btn primary w-full h-12 text-[15px] font-semibold gap-2"
          >
            {{ requestOp.loading.value ? 'Gönderiliyor…' : 'Gönder' }}
            <span v-if="!requestOp.loading.value" class="material-symbols-outlined text-[18px]">mail</span>
          </button>
        </form>
      </div>

      <!-- Success Message -->
      <div v-else class="flex flex-col gap-stack-md items-center text-center">
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <span class="material-symbols-outlined text-[28px] text-primary">check_circle</span>
        </div>
        <div>
          <p class="text-headline-sm font-semibold text-on-surface mb-1">E-posta Gönderildi</p>
          <p class="text-label-md text-on-surface-variant">
            Sıfırlama linki {{ email }} adresine gönderildi.
          </p>
          <p class="text-label-sm text-on-surface-variant/60 mt-2">
            Link 1 saat geçerlidir.
          </p>
        </div>
        <p class="text-label-sm text-on-surface-variant mt-2">
          3 saniyede giriş sayfasına yönlendirileceksiniz...
        </p>
      </div>

      <!-- Footer -->
      <footer class="flex flex-col items-center gap-2 -mt-2 pt-2 border-t border-outline-variant">
        <p class="text-label-md text-on-surface-variant">
          <router-link to="/login" class="text-primary font-semibold hover:underline">Giriş sayfasına dön</router-link>
        </p>
        <span class="flex items-center gap-1 text-label-sm text-outline">
          <span class="material-symbols-outlined text-[14px]">verified_user</span>
          Güvenli bağlantı
        </span>
      </footer>
    </main>
  </div>
</template>
