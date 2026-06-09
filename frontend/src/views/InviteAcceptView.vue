<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import { useToast } from '@/composables/useToast';
import type { InvitePreview } from '@/types/office';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const token = route.params.token as string;
const invitePreview = ref<InvitePreview | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);
const accepting = ref(false);

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

async function acceptInvite() {
  error.value = null;
  accepting.value = true;
  try {
    await officeService.acceptInvite(token);
    await auth.fetchMe();
    toast.success(`${invitePreview.value?.officeName ?? 'Ofise'} katıldınız!`);
    router.push('/');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Ofise katılma başarısız';
  } finally {
    accepting.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[480px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <div v-if="loading" class="empty py-12">
        <p class="text-label-md text-on-surface-variant">Davet yükleniyor…</p>
      </div>

      <template v-else>
        <!-- Başlık -->
        <header class="flex flex-col items-center gap-3 text-center pt-2">
          <div class="w-16 h-16 bg-surface-container rounded-xl flex items-center justify-center text-primary">
            <span class="material-symbols-outlined text-[32px]" style="font-variation-settings:'FILL' 1">domain</span>
          </div>
          <div>
            <h1 class="text-headline-md font-semibold text-on-surface">Ofiye Katılın</h1>
            <p class="text-label-md text-on-surface-variant mt-1">
              <strong>{{ invitePreview?.invitedByName }}</strong> sizi davet etti
            </p>
          </div>
        </header>

        <!-- Davet süresi dolmuş -->
        <template v-if="error && !invitePreview?.valid">
          <div class="flex flex-col gap-stack-md text-center bg-error-container rounded-lg p-stack-md">
            <p class="text-label-md font-semibold text-error">{{ error }}</p>
            <div class="flex gap-2 pt-2">
              <router-link to="/" class="btn secondary w-full">Dashboard'a Git</router-link>
              <router-link to="/onboarding" class="btn primary w-full">Ofis Yönet</router-link>
            </div>
          </div>
        </template>

        <!-- Başarılı preview -->
        <template v-else-if="invitePreview?.valid">
          <!-- Office bilgisi -->
          <div class="bg-primary-container rounded-lg p-stack-md text-center">
            <p class="text-label-sm text-on-surface-variant mb-2">Katılacağınız ofis:</p>
            <p class="text-headline-sm font-semibold text-on-surface">{{ invitePreview.officeName }}</p>
          </div>

          <!-- Davet süresi -->
          <div class="flex items-center justify-between bg-surface-container rounded-lg p-stack-md">
            <div>
              <p class="text-label-sm text-on-surface-variant">Davet süresi</p>
              <p class="text-label-lg font-semibold text-on-surface">{{ invitePreview.expiresInDays }} gün kaldı</p>
            </div>
          </div>

          <!-- Error message -->
          <p v-if="error" class="error-msg text-center">{{ error }}</p>

          <!-- Katıl butonu -->
          <button
            class="btn primary w-full h-12 text-[15px] font-semibold gap-2"
            :disabled="accepting"
            @click="acceptInvite"
          >
            {{ accepting ? 'Katılınıyor…' : 'Ofiye Katıl' }}
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <!-- Geri git -->
          <router-link to="/" class="btn secondary w-full text-center">
            Şimdi Katılmak İstemiyorum
          </router-link>
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
