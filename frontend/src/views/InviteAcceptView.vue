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
const preview = ref<InvitePreview | null>(null);
const loadError = ref<string | null>(null);
const loading = ref(true);

// Girişsiz kullanıcı için kayıt formu (e-posta davete kilitli)
const fullName = ref('');
const password = ref('');
const error = ref<string | null>(null);
const busy = ref(false);

onMounted(async () => {
  try {
    preview.value = await officeService.previewInvite(token);
  } catch (e: any) {
    loadError.value = e?.response?.data?.message || 'Davet bulunamadı';
  } finally {
    loading.value = false;
  }
});

async function acceptAsCurrentUser() {
  error.value = null;
  busy.value = true;
  try {
    await officeService.acceptInvite(token);
    await auth.fetchMe();
    router.push('/');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Davet kabul edilemedi';
  } finally {
    busy.value = false;
  }
}

async function registerAndAccept() {
  error.value = null;
  busy.value = true;
  try {
    await auth.register({
      fullName: fullName.value.trim(),
      email: preview.value!.email,
      password: password.value,
    });
    await officeService.acceptInvite(token);
    await auth.fetchMe();
    router.push('/');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'İşlem başarısız';
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[440px] bg-surface-container-lowest rounded-xl shadow-md border border-outline-variant p-stack-lg flex flex-col gap-gutter relative overflow-hidden">
      <div class="absolute top-0 left-0 right-0 h-1 bg-primary rounded-t-xl"></div>

      <div v-if="loading" class="empty py-8">Yükleniyor…</div>

      <template v-else-if="loadError || !preview">
        <header class="flex flex-col items-center gap-2 text-center pt-2">
          <span class="material-symbols-outlined text-[40px] text-error">link_off</span>
          <h1 class="text-headline-md font-semibold text-on-surface">Davet geçersiz</h1>
          <p class="text-label-md text-on-surface-variant">{{ loadError || 'Bu davet artık kullanılamıyor.' }}</p>
        </header>
        <router-link to="/login" class="btn primary w-full">Giriş sayfasına dön</router-link>
      </template>

      <template v-else>
        <header class="flex flex-col items-center gap-2 text-center pt-2">
          <div class="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center text-primary mb-1">
            <span class="material-symbols-outlined text-[28px]" style="font-variation-settings:'FILL' 1">domain</span>
          </div>
          <h1 class="text-headline-md font-semibold text-on-surface">{{ preview.officeName }}</h1>
          <p class="text-label-md text-on-surface-variant">
            <strong>{{ preview.invitedByName }}</strong> sizi bu ofise davet etti
          </p>
        </header>

        <!-- Davet artık geçerli değil -->
        <div v-if="!preview.valid" class="flex flex-col gap-stack-md text-center">
          <p class="error-msg">Bu davetin süresi dolmuş veya iptal edilmiş.</p>
          <router-link to="/login" class="btn">Giriş sayfasına dön</router-link>
        </div>

        <!-- Girişli kullanıcı: zaten ofiste -->
        <div v-else-if="auth.isAuthenticated && auth.hasOffice" class="flex flex-col gap-stack-md text-center">
          <p class="text-label-md text-on-surface-variant">
            Zaten bir ofistesiniz. Yeni bir ofise katılmak için önce mevcut ofisinizden ayrılmanız gerekir.
          </p>
          <router-link to="/" class="btn primary">Panele dön</router-link>
        </div>

        <!-- Girişli, ofissiz: doğrudan katıl -->
        <div v-else-if="auth.isAuthenticated" class="flex flex-col gap-stack-md">
          <p class="text-label-md text-on-surface-variant text-center">
            <strong>{{ auth.user?.email }}</strong> hesabıyla bu ofise katılacaksınız.
          </p>
          <p v-if="error" class="error-msg text-center">{{ error }}</p>
          <button class="btn primary w-full h-12 font-semibold" :disabled="busy" @click="acceptAsCurrentUser">
            {{ busy ? 'Katılınıyor…' : 'Ofise Katıl' }}
          </button>
        </div>

        <!-- Girişsiz: e-posta kilitli kayıt -->
        <form v-else class="flex flex-col gap-stack-md" @submit.prevent="registerAndAccept">
          <div class="field full">
            <label>E-posta</label>
            <input class="input h-12 opacity-70" :value="preview.email" disabled />
          </div>
          <div class="field full">
            <label for="fullName">Ad Soyad</label>
            <input id="fullName" class="input h-12" v-model="fullName" placeholder="Adınız Soyadınız" required minlength="2" autofocus />
          </div>
          <div class="field full">
            <label for="password">Şifre belirleyin</label>
            <input id="password" class="input h-12" type="password" v-model="password" placeholder="En az 6 karakter" required minlength="6" />
          </div>
          <p v-if="error" class="error-msg text-center">{{ error }}</p>
          <button class="btn primary w-full h-12 font-semibold gap-2" :disabled="busy" type="submit">
            {{ busy ? 'Katılınıyor…' : 'Kayıt Ol ve Katıl' }}
            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
          <p class="text-center text-label-md text-on-surface-variant">
            Zaten hesabınız var mı?
            <router-link to="/login" class="text-primary font-semibold hover:underline">Giriş yapın</router-link>
          </p>
        </form>
      </template>
    </main>
  </div>
</template>
