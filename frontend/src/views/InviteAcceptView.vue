<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import type { InvitePreview, AlreadyInOfficeError } from '@/types/office';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const toast = useToast();
const { confirm } = useConfirm();

const token = route.params.token as string;
const invitePreview = ref<InvitePreview | null>(null);
const error = ref<string | null>(null);
const loading = ref(true);
const accepting = ref(false);
const leavingAndRetrying = ref(false);
const conflict = ref<AlreadyInOfficeError | null>(null);

onMounted(async () => {
  try {
    invitePreview.value = await officeService.previewInvite(token);
    if (!invitePreview.value.valid) {
      error.value = invalidReasonMessage(invitePreview.value.invalidReason);
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Davet bulunamadı';
  } finally {
    loading.value = false;
  }
});

function invalidReasonMessage(reason: InvitePreview['invalidReason']): string {
  switch (reason) {
    case 'EXPIRED':
      return 'Bu davetin süresi dolmuş.';
    case 'ACCEPTED':
      return 'Bu davet zaten kullanılmış.';
    case 'REVOKED':
      return 'Bu davet iptal edilmiş.';
    default:
      return 'Bu davetin süresi dolmuş veya iptal edilmiş.';
  }
}

async function acceptInvite() {
  error.value = null;
  conflict.value = null;
  accepting.value = true;
  try {
    await officeService.acceptInvite(token);
    await auth.fetchMe();
    toast.success(`${invitePreview.value?.officeName ?? 'Ofise'} katıldınız!`);
    router.push('/dashboard');
  } catch (e: any) {
    if (e?.response?.data?.code === 'ALREADY_IN_OFFICE') {
      conflict.value = e.response.data as AlreadyInOfficeError;
    } else {
      error.value = e?.response?.data?.message || 'Ofise katılma başarısız';
    }
  } finally {
    accepting.value = false;
  }
}

async function leaveAndAccept() {
  if (!conflict.value) return;
  const ok = await confirm({
    title: 'Ofisten çık ve daveti kabul et',
    message: `"${conflict.value.currentOfficeName}" ofisinden ayrılıp bu daveti kabul etmek istediğinizden emin misiniz? Portföy ve taleplerinize artık erişemezsiniz.`,
    confirmText: 'Ofisten Çık ve Katıl',
    danger: true,
    icon: 'logout',
  });
  if (!ok) return;

  leavingAndRetrying.value = true;
  try {
    await officeService.leaveOffice();
    await officeService.acceptInvite(token);
    await auth.fetchMe();
    toast.success(`${invitePreview.value?.officeName ?? 'Ofise'} katıldınız!`);
    router.push('/dashboard');
  } catch (e: any) {
    conflict.value = null;
    error.value = e?.response?.data?.message || 'İşlem başarısız, lütfen tekrar deneyin';
  } finally {
    leavingAndRetrying.value = false;
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
            <h1 class="text-headline-md font-semibold text-on-surface">Ofise Katılın</h1>
            <p class="text-label-md text-on-surface-variant mt-1">
              <strong>{{ invitePreview?.invitedByName }}</strong> sizi davet etti
            </p>
          </div>
        </header>

        <!-- Zaten bir ofistesiniz: çatışma çözümü -->
        <template v-if="conflict">
          <!-- Aynı ofis: dostane bilgi -->
          <template v-if="conflict.sameOffice">
            <div class="flex flex-col gap-stack-md text-center bg-primary-container rounded-lg p-stack-md">
              <p class="text-label-md font-semibold text-on-surface">Zaten bu ofisin üyesisiniz.</p>
              <router-link to="/dashboard" class="btn primary w-full">Dashboard'a Git</router-link>
            </div>
          </template>

          <!-- Ofis kurucusu: ayrılamaz -->
          <template v-else-if="conflict.isOwner">
            <div class="flex flex-col gap-stack-md text-center bg-error-container rounded-lg p-stack-md">
              <p class="text-label-md font-semibold text-error">
                Mevcut ofisiniz "{{ conflict.currentOfficeName }}"nin kurucususunuz, bu nedenle ofisinizden ayrılamazsınız.
              </p>
              <p class="text-label-sm text-on-surface-variant">
                Bu daveti kabul etmek için önce ofis sahipliğini devretmeniz veya ofisi kapatmanız gerekir.
              </p>
              <router-link to="/dashboard" class="btn secondary w-full">Dashboard'a Dön</router-link>
            </div>
          </template>

          <!-- Farklı ofis, ayrılabilir: çık ve katıl -->
          <template v-else>
            <div class="flex flex-col gap-stack-md text-center bg-error-container rounded-lg p-stack-md">
              <p class="text-label-md font-semibold text-error">
                Şu anda "{{ conflict.currentOfficeName }}" ofisindesiniz.
              </p>
              <p class="text-label-sm text-on-surface-variant">
                Bu daveti kabul etmek için önce mevcut ofisinizden çıkmanız gerekiyor.
              </p>
            </div>
            <button
              class="btn primary w-full h-12 text-[15px] font-semibold gap-2"
              :disabled="leavingAndRetrying"
              @click="leaveAndAccept"
            >
              {{ leavingAndRetrying ? 'İşleniyor…' : 'Ofisten Çık ve Bu Daveti Kabul Et' }}
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <router-link to="/dashboard" class="btn secondary w-full text-center">Vazgeç</router-link>
          </template>
        </template>

        <!-- Davet süresi dolmuş / iptal edilmiş / kullanılmış -->
        <template v-else-if="error && !invitePreview?.valid">
          <div class="flex flex-col gap-stack-md text-center bg-error-container rounded-lg p-stack-md">
            <p class="text-label-md font-semibold text-error">{{ error }}</p>
            <div class="flex gap-2 pt-2">
              <router-link to="/dashboard" class="btn secondary w-full">Dashboard'a Git</router-link>
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
            {{ accepting ? 'Katılınıyor…' : 'Ofise Katıl' }}
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <!-- Geri git -->
          <router-link to="/dashboard" class="btn secondary w-full text-center">
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
