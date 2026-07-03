<template>
  <div class="container min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="rounded-lg border border-gray-200 bg-white p-8">
        <h1 class="mb-2 text-2xl font-semibold text-gray-900">Şifrenizi Sıfırlayın</h1>
        <p class="mb-6 text-sm text-gray-600">Yeni bir şifre belirleyin</p>

        <div v-if="loading" class="flex justify-center py-8">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-sage-600"></div>
        </div>

        <div v-else-if="!tokenValid" class="space-y-4">
          <div class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            <p class="font-medium mb-2">Bu link geçersiz veya süresi dolmuş</p>
            <p>Lütfen yeni bir sıfırlama isteği gönderin.</p>
          </div>
          <router-link to="/forgot-password" class="block w-full text-center rounded-lg bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700">
            Yeni İstek Gönder
          </router-link>
          <router-link to="/login" class="block w-full text-center text-sm font-medium text-sage-600 hover:text-sage-700">
            Giriş Sayfasına Dön
          </router-link>
        </div>

        <form v-else @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Yeni Şifre
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="En az 8 karakter, 1 büyük harf, 1 rakam"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-sage-600 focus:outline-none"
              :disabled="resetOp.loading.value"
            />
            <p class="mt-1 text-xs text-gray-500">
              En az 8 karakter, en az bir büyük harf ve bir rakam içermeli
            </p>
          </div>

          <div>
            <label for="password-confirm" class="block text-sm font-medium text-gray-700 mb-1">
              Şifreyi Onayla
            </label>
            <input
              id="password-confirm"
              v-model="passwordConfirm"
              type="password"
              placeholder="Şifreyi tekrar girin"
              class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 focus:border-sage-600 focus:outline-none"
              :disabled="resetOp.loading.value"
            />
          </div>

          <div v-if="passwordMismatch" class="rounded-lg bg-red-50 p-3 text-sm text-red-700">
            Şifreler eşleşmiyor
          </div>

          <button
            type="submit"
            :disabled="!password || !passwordConfirm || passwordMismatch || resetOp.loading.value"
            class="w-full rounded-lg bg-sage-600 px-4 py-2 font-medium text-white transition-colors disabled:opacity-50 hover:bg-sage-700"
          >
            {{ resetOp.loading.value ? 'Güncelleniyor...' : 'Şifreyi Güncelle' }}
          </button>
        </form>

        <div v-if="resetOp.error.value" class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {{ resetOp.error.value }}
        </div>

        <div v-if="resetSuccess" class="mt-4 rounded-lg bg-green-50 p-3">
          <p class="text-sm font-medium text-green-800 mb-3">
            ✓ Şifreniz başarıyla güncellenmiştir!
          </p>
          <p class="text-sm text-green-700 mb-4">
            Yeni şifrenizle giriş yapabilirsiniz.
          </p>
          <button
            @click="navigateToLogin"
            class="w-full text-center rounded-lg bg-sage-600 px-4 py-2 font-medium text-white hover:bg-sage-700"
          >
            Giriş Yap
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

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
  } catch (error) {
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
