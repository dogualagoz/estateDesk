<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { officeService } from '@/services/office.service';
import type { InvitePreview } from '@/types/office';

const route = useRoute();
const router = useRouter();

const token = route.params.token as string;
const preview = ref<InvitePreview | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);

const expiryWarning = computed(() => {
  if (!preview.value) return null;
  return preview.value.expiresInDays === 0
    ? 'Süresi bugün dolacak'
    : `${preview.value.expiresInDays} gün kaldı`;
});

const expiryColor = computed(() => {
  if (!preview.value) return '';
  return preview.value.expiresInDays <= 1 ? 'text-error' : 'text-on-surface-variant';
});

onMounted(async () => {
  try {
    preview.value = await officeService.previewInvite(token);
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Davet bulunamadı';
  } finally {
    loading.value = false;
  }
});

function handleRegister() {
  router.push({
    name: 'invite.register',
    params: { token },
  });
}

function handleLogin() {
  router.push({ name: 'login', query: { invite: token } });
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[480px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <!-- Yükleniyor -->
      <div v-if="loading" class="empty py-12">
        <p class="text-label-md text-on-surface-variant">Davet yükleniyor…</p>
      </div>

      <!-- Hata -->
      <template v-else-if="error || !preview">
        <header class="flex flex-col items-center gap-2 text-center pt-2">
          <span class="material-symbols-outlined text-[40px] text-error">link_off</span>
          <h1 class="text-headline-md font-semibold text-on-surface">Davet geçersiz</h1>
          <p class="text-label-md text-on-surface-variant">{{ error || 'Bu davet artık kullanılamıyor.' }}</p>
        </header>
        <div class="flex gap-2 pt-2">
          <router-link to="/login" class="btn secondary w-full">Giriş sayfası</router-link>
          <router-link to="/register" class="btn primary w-full">Kayıt ol</router-link>
        </div>
      </template>

      <!-- Başarılı preview -->
      <template v-else>
        <!-- Başlık ve ofis bilgisi -->
        <header class="flex flex-col items-center gap-3 text-center pt-2">
          <div class="w-16 h-16 bg-surface-container rounded-xl flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[32px]" style="font-variation-settings:'FILL' 1">domain</span>
          </div>
          <div>
            <h1 class="text-headline-md font-semibold text-on-surface">{{ preview.officeName }}</h1>
            <p class="text-label-md text-on-surface-variant">
              <strong>{{ preview.invitedByName }}</strong> sizi bu ofise davet ediyor
            </p>
          </div>
        </header>

        <!-- Davet süresi geçerli değil -->
        <div v-if="!preview.valid" class="flex flex-col gap-stack-md text-center bg-error-container rounded-lg p-stack-md">
          <p class="text-label-md font-semibold text-error">Bu davetin süresi dolmuş veya iptal edilmiş.</p>
          <div class="flex gap-2 pt-2">
            <router-link to="/login" class="btn secondary w-full text-sm">Giriş yap</router-link>
            <router-link to="/register" class="btn primary w-full text-sm">Kayıt ol</router-link>
          </div>
        </div>

        <!-- Davet süresi geçerli -->
        <template v-else>
          <!-- Expiry countdown -->
          <div class="flex items-center justify-between bg-surface-container rounded-lg p-stack-md">
            <div class="flex-1">
              <p class="text-label-sm text-on-surface-variant">Davet süresi</p>
              <p :class="['text-label-lg font-semibold', expiryColor]">{{ expiryWarning }}</p>
            </div>
            <!-- Progress circle -->
            <div class="w-12 h-12 rounded-full flex items-center justify-center bg-primary-container">
              <div class="relative w-10 h-10">
                <svg class="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" stroke-width="2" class="text-outline-variant" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    class="text-primary transition-all"
                    :style="`stroke-dasharray: ${(preview.expiresInDays / 14) * 100.5}; stroke-dashoffset: 0`"
                  />
                </svg>
                <span class="absolute inset-0 flex items-center justify-center text-label-sm font-semibold text-on-surface">
                  {{ preview.expiresInDays }}/14
                </span>
              </div>
            </div>
          </div>

          <!-- CTA: Kayıt yap / Giriş yap -->
          <div class="flex flex-col gap-stack-md pt-stack-md border-t border-outline-variant">
            <button class="btn primary w-full h-12 font-semibold gap-2" @click="handleRegister">
              <span>Hesap Oluştur</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button class="btn secondary w-full h-12 font-semibold gap-2" @click="handleLogin">
              <span>Giriş Yap</span>
              <span class="material-symbols-outlined text-[18px]">login</span>
            </button>
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
