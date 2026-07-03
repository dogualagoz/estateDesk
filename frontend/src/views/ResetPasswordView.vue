<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { authService } from '@/services/auth.service';
import { useAsync } from '@/composables/useAsync';

const router = useRouter();
const route = useRoute();
const token = route.params.token as string;

const loading = ref(true);
const tokenValid = ref(false);
const password = ref('');
const passwordConfirm = ref('');
const resetSuccess = ref(false);

const resetOp = useAsync();

const passwordMismatch = computed(() => {
  return password.value && passwordConfirm.value && password.value !== passwordConfirm.value;
});

onMounted(async () => {
  try {
    const result = await authService.validateResetToken(token);
    tokenValid.value = result.valid;
  } catch {
    tokenValid.value = false;
  } finally {
    loading.value = false;
  }
});

const handleSubmit = async () => {
  if (passwordMismatch.value || !password.value) return;

  const result = await resetOp.run(
    () => authService.resetPassword(token, password.value),
    {
      errorMessage: 'Şifre güncellenemedi. Lütfen tekrar deneyin',
    },
  );

  if (result?.message) {
    resetSuccess.value = true;
    setTimeout(() => {
      navigateToLogin();
    }, 2000);
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
        <p class="text-label-md text-on-surface-variant">Yeni Şifre Belirleyin</p>
      </header>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-outline border-t-primary"></div>
      </div>

      <!-- Invalid Token -->
      <div v-else-if="!tokenValid" class="flex flex-col gap-stack-md items-center text-center">
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-error/10">
          <span class="material-symbols-outlined text-[28px] text-error">error_circle</span>
        </div>
        <div>
          <p class="text-headline-sm font-semibold text-error mb-1">Geçersiz Link</p>
          <p class="text-label-md text-on-surface-variant">
            Bu sıfırlama linki geçersiz veya süresi dolmuş.
          </p>
        </div>
        <router-link to="/forgot-password" class="btn primary w-full h-12 text-[15px] font-semibold">
          Yeni İstek Gönder
        </router-link>
      </div>

      <!-- Reset Form -->
      <div v-else-if="!resetSuccess" class="flex flex-col gap-stack-md">
        <form class="flex flex-col gap-stack-md" @submit.prevent="handleSubmit">
          <div class="field full">
            <label for="password">Yeni Şifre</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">lock</span>
              <input
                id="password"
                v-model="password"
                class="input pl-10 h-12"
                type="password"
                placeholder="••••••••"
                required
                :disabled="resetOp.loading.value"
              />
            </div>
            <p class="text-label-sm text-on-surface-variant mt-1">
              En az 8 karakter, 1 büyük harf, 1 rakam
            </p>
          </div>

          <div class="field full">
            <label for="password-confirm">Şifreyi Onayla</label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">check_circle</span>
              <input
                id="password-confirm"
                v-model="passwordConfirm"
                class="input pl-10 h-12"
                type="password"
                placeholder="••••••••"
                required
                :disabled="resetOp.loading.value"
              />
            </div>
          </div>

          <p v-if="passwordMismatch" class="error-msg text-center">Şifreler eşleşmiyor</p>
          <p v-if="resetOp.error.value" class="error-msg text-center">{{ resetOp.error.value }}</p>

          <button
            type="submit"
            :disabled="!password || !passwordConfirm || passwordMismatch || resetOp.loading.value"
            class="btn primary w-full h-12 text-[15px] font-semibold gap-2 mt-1"
          >
            {{ resetOp.loading.value ? 'Güncelleniyor…' : 'Şifreyi Güncelle' }}
            <span v-if="!resetOp.loading.value" class="material-symbols-outlined text-[18px]">check</span>
          </button>
        </form>
      </div>

      <!-- Success Message -->
      <div v-else class="flex flex-col gap-stack-md items-center text-center">
        <div class="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
          <span class="material-symbols-outlined text-[28px] text-primary">check_circle</span>
        </div>
        <div>
          <p class="text-headline-sm font-semibold text-on-surface mb-1">Şifre Güncellendi</p>
          <p class="text-label-md text-on-surface-variant">
            Şifreniz başarıyla sıfırlanmıştır.
          </p>
        </div>
        <p class="text-label-sm text-on-surface-variant mt-2">
          2 saniyede giriş sayfasına yönlendirileceksiniz...
        </p>
        <button
          class="btn primary w-full h-12 text-[15px] font-semibold"
          @click="navigateToLogin"
        >
          Şimdi Giriş Yap
        </button>
      </div>

      <!-- Footer -->
      <footer class="flex flex-col items-center gap-2 -mt-2 pt-2 border-t border-outline-variant">
        <span class="flex items-center gap-1 text-label-sm text-outline">
          <span class="material-symbols-outlined text-[14px]">verified_user</span>
          Güvenli bağlantı
        </span>
      </footer>
    </main>
  </div>
</template>
