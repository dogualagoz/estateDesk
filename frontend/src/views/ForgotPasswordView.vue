<template>
  <div class="container min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="rounded-lg border border-gray-200 bg-white p-8">
        <h1 class="mb-2 text-2xl font-semibold text-gray-900">Şifremi Unuttum</h1>
        <p class="mb-6 text-sm text-gray-600">
          EstateDesk hesabınız için bir sıfırlama linki göndereceğiz
        </p>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              E-posta Adresi
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="ornek@emlakdefter.com"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-sage-600 focus:outline-none"
              :disabled="requestOp.loading.value"
            />
          </div>

          <button
            type="submit"
            :disabled="!email || requestOp.loading.value"
            class="w-full rounded-lg bg-sage-600 px-4 py-2 font-medium text-white transition-colors disabled:opacity-50 hover:bg-sage-700"
          >
            {{ requestOp.loading.value ? 'Gönderiliyor...' : 'Gönder' }}
          </button>
        </form>

        <div v-if="requestOp.error.value" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ requestOp.error.value }}
        </div>

        <div v-if="success" class="mt-4 rounded-lg bg-green-50 p-3">
          <p class="text-sm font-medium text-green-800 mb-3">
            ✓ Sıfırlama linki gönderdik!
          </p>
          <p class="text-sm text-green-700 mb-4">
            Lütfen e-posta adresinizi kontrol edin. Link 1 saat geçerlidir.
          </p>
          <button
            class="w-full text-center text-sm font-medium text-sage-600 hover:text-sage-700"
            @click="navigateToLogin"
          >
            Giriş Sayfasına Dön
          </button>
        </div>

        <div class="mt-6 text-center">
          <router-link to="/login" class="text-sm font-medium text-sage-600 hover:text-sage-700">
            Giriş yap
          </router-link>
          <span class="mx-2 text-gray-300">•</span>
          <router-link to="/register" class="text-sm font-medium text-sage-600 hover:text-sage-700">
            Kayıt ol
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

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
