<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import type { InvitePreview } from '@/types/office';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const token = route.params.token as string;

const fullName = ref('');
const email = ref('');
const password = ref('');
const error = ref<string | null>(null);
const loading = ref(true);
const submitting = ref(false);

const invitePreview = ref<InvitePreview | null>(null);

onMounted(async () => {
  try {
    invitePreview.value = await officeService.previewInvite(token);
    if (!invitePreview.value.valid) {
      error.value = 'Bu davetin süresi dolmuş veya iptal edilmiş.';
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Davet bulunamadı';
  } finally {
    loading.value = false;
  }
});

async function submit() {
  error.value = null;
  submitting.value = true;
  try {
    const result = await officeService.registerWithInvite(token, {
      email: email.value.trim(),
      password: password.value,
      fullName: fullName.value.trim(),
    });

    // Login local auth store
    auth.setUser(result.user);
    auth.setToken(result.accessToken);

    // Redirect to dashboard
    router.push('/');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Kayıt başarısız';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <div v-if="loading" class="empty py-8">
        <p class="text-label-md text-on-surface-variant">Davet yükleniyor…</p>
      </div>

      <template v-else>
        <!-- Başlık -->
        <header class="flex flex-col items-center gap-2 text-center pt-2">
          <div class="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center text-primary mb-2">
            <span class="material-symbols-outlined text-[28px]" style="font-variation-settings:'FILL' 1">person_add</span>
          </div>
          <h1 class="text-headline-lg font-semibold tracking-tight text-on-surface">Hesap Oluştur</h1>
          <p class="text-label-md text-on-surface-variant">{{ invitePreview?.officeName || 'Ofise Katıl' }}</p>
        </header>

        <!-- Davet info banner -->
        <div v-if="invitePreview" class="bg-primary-container rounded-lg p-stack-md text-center">
          <p class="text-label-sm text-on-surface-variant mb-1">
            <strong>{{ invitePreview.invitedByName }}</strong> tarafından davet edildiyseniz:
          </p>
          <p class="text-label-lg font-semibold text-on-surface">{{ invitePreview.officeName }}</p>
        </div>

        <!-- Form veya hata -->
        <template v-if="!error || invitePreview?.valid">
          <form class="flex flex-col gap-stack-md" @submit.prevent="submit">
            <div class="field full">
              <label for="fullName">Ad Soyad</label>
              <input
                id="fullName"
                class="input h-12"
                v-model="fullName"
                placeholder="Adınız Soyadınız"
                required
                autofocus
                minlength="2"
                :disabled="submitting"
              />
            </div>
            <div class="field full">
              <label for="email">E-posta</label>
              <input
                id="email"
                class="input h-12"
                type="email"
                v-model="email"
                placeholder="ornek@example.com"
                required
                :disabled="submitting"
              />
            </div>
            <div class="field full">
              <label for="password">Şifre</label>
              <input
                id="password"
                class="input h-12"
                type="password"
                v-model="password"
                placeholder="En az 6 karakter"
                required
                minlength="6"
                :disabled="submitting"
              />
            </div>

            <p v-if="error" class="error-msg text-center">{{ error }}</p>

            <button class="btn primary w-full h-12 text-[15px] font-semibold mt-1 gap-2" :disabled="submitting" type="submit">
              {{ submitting ? 'Kaydediliyor…' : 'Hesap Oluştur ve Katıl' }}
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </form>

          <footer class="text-center text-label-md text-on-surface-variant -mt-1">
            Zaten hesabınız var mı?
            <router-link to="/login" class="text-primary font-semibold hover:underline">Giriş yapın</router-link>
          </footer>
        </template>

        <!-- Davet süresi dolmuş -->
        <template v-else>
          <div class="flex flex-col gap-stack-md text-center bg-error-container rounded-lg p-stack-md">
            <p class="text-label-md font-semibold text-error">{{ error }}</p>
            <div class="flex gap-2 pt-2">
              <router-link to="/login" class="btn secondary w-full text-sm">Giriş yap</router-link>
              <router-link to="/register" class="btn primary w-full text-sm">Kayıt ol</router-link>
            </div>
          </div>
        </template>
      </template>
    </main>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}
</style>
