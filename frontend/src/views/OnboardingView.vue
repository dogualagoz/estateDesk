<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';

const auth = useAuthStore();
const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();

type Mode = 'choose' | 'create' | 'join';
const mode = ref<Mode>('choose');

const officeName = ref('');
const inviteInput = ref('');
const error = ref<string | null>(null);
const busy = ref(false);

async function createOffice() {
  error.value = null;
  busy.value = true;
  try {
    await officeService.create(officeName.value.trim());
    await auth.fetchMe();
    toast.success('Ofisiniz oluşturuldu, hoş geldiniz!');
    router.push('/dashboard');
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Ofis oluşturulamadı';
  } finally {
    busy.value = false;
  }
}

function goToInvite() {
  error.value = null;
  // Kullanıcı tam link de yapıştırmış olabilir; sadece token kısmını al
  const raw = inviteInput.value.trim();
  const token = raw.includes('/invite/') ? raw.split('/invite/')[1].split(/[?#]/)[0] : raw;
  if (!token) {
    error.value = 'Lütfen geçerli bir davet linki veya kodu girin';
    return;
  }
  router.push({ name: 'invite.preview', params: { token } });
}

async function logout() {
  const ok = await confirm({
    title: 'Çıkış yap',
    message: 'Oturumunuzu kapatmak istediğinizden emin misiniz?',
    confirmText: 'Çıkış Yap',
    icon: 'logout',
  });
  if (!ok) return;
  auth.logout();
  router.push('/login');
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center px-margin-mobile py-margin-desktop">
    <main class="w-full max-w-[560px] flex flex-col gap-gutter">
      <header class="text-center flex flex-col items-center gap-2">
        <div class="w-14 h-14 bg-surface-container rounded-xl flex items-center justify-center text-primary mb-1">
          <span class="material-symbols-outlined text-[28px]" style="font-variation-settings:'FILL' 1">domain</span>
        </div>
        <h1 class="text-headline-lg font-semibold tracking-tight text-on-surface">
          Hoş geldiniz, {{ auth.user?.fullName?.split(' ')[0] }}
        </h1>
        <p class="text-label-md text-on-surface-variant">Başlamak için bir ofise bağlanın</p>
      </header>

      <!-- Seçim -->
      <div v-if="mode === 'choose'" class="grid sm:grid-cols-2 gap-stack-md">
        <button
          class="card flex flex-col items-center gap-3 p-stack-lg text-center hover:border-primary transition-colors cursor-pointer"
          @click="mode = 'create'"
        >
          <span class="material-symbols-outlined text-[40px] text-primary">add_business</span>
          <div>
            <p class="text-body-lg font-semibold text-on-surface">Ofis Oluştur</p>
            <p class="text-label-md text-on-surface-variant mt-1">Kendi ofisinizi kurun ve yöneticisi olun</p>
          </div>
        </button>

        <button
          class="card flex flex-col items-center gap-3 p-stack-lg text-center hover:border-primary transition-colors cursor-pointer"
          @click="mode = 'join'"
        >
          <span class="material-symbols-outlined text-[40px] text-primary">group_add</span>
          <div>
            <p class="text-body-lg font-semibold text-on-surface">Davetle Katıl</p>
            <p class="text-label-md text-on-surface-variant mt-1">Size gönderilen davet linkiyle ofise katılın</p>
          </div>
        </button>
      </div>

      <!-- Ofis oluştur -->
      <form v-else-if="mode === 'create'" class="card flex flex-col gap-stack-md" @submit.prevent="createOffice">
        <h2 class="text-body-lg font-semibold text-on-surface">Ofis Oluştur</h2>
        <div class="field full">
          <label for="officeName">Ofis Adı</label>
          <input id="officeName" class="input h-12" v-model="officeName" placeholder="Örn. Yılmaz Emlak" required minlength="2" autofocus />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <div class="flex gap-3">
          <button class="btn primary" type="submit" :disabled="busy">
            {{ busy ? 'Oluşturuluyor…' : 'Ofisi Oluştur' }}
          </button>
          <button class="btn" type="button" @click="mode = 'choose'; error = null">Geri</button>
        </div>
      </form>

      <!-- Davetle katıl -->
      <form v-else class="card flex flex-col gap-stack-md" @submit.prevent="goToInvite">
        <h2 class="text-body-lg font-semibold text-on-surface">Davetle Katıl</h2>
        <div class="field full">
          <label for="invite">Davet Linki veya Kodu</label>
          <input id="invite" class="input h-12" v-model="inviteInput" placeholder="https://…/invite/XXXX veya kod" required autofocus />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <div class="flex gap-3">
          <button class="btn primary" type="submit">Devam Et</button>
          <button class="btn" type="button" @click="mode = 'choose'; error = null">Geri</button>
        </div>
      </form>

      <footer class="text-center">
        <button class="text-label-md text-on-surface-variant hover:text-on-surface" @click="logout">
          Çıkış yap
        </button>
      </footer>
    </main>
  </div>
</template>
