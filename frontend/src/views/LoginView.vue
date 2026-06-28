<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const error = ref<string | null>(null);

const inviteToken = computed(() => route.query.invite as string | undefined);

async function submit() {
  error.value = null;
  try {
    await auth.login(email.value.trim(), password.value);

    // Davet token'ı varsa
    if (inviteToken.value) {
      // Officesiz kullanıcı → InviteAcceptView'a yönlendir (confirm ekranı)
      // Offisli kullanıcı → direkt acceptInvite() yap
      if (!auth.hasOffice) {
        router.push({ name: 'invite.accept', params: { token: inviteToken.value } });
      } else {
        try {
          await officeService.acceptInvite(inviteToken.value);
          await auth.fetchMe();
          router.push('/dashboard');
        } catch (e: any) {
          console.error('Invite acceptance failed:', e);
          router.push('/dashboard');
        }
      }
    } else {
      // Ofisi varsa dashboard, yoksa onboarding
      const destination = auth.hasOffice ? '/dashboard' : '/onboarding';
      const redirect = (route.query.redirect as string) || destination;
      router.push(redirect);
    }
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Giriş başarısız';
  }
}
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
        <p v-if="inviteToken" class="text-label-md text-on-surface-variant">
          Davetinizi kabul etmek için giriş yapın
        </p>
        <p v-else class="text-label-md text-on-surface-variant">Yönetim paneline hoş geldiniz</p>
      </header>

      <!-- Form -->
      <form class="flex flex-col gap-stack-md" @submit.prevent="submit">
        <div class="field full">
          <label for="email">E-posta Adresi</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">mail</span>
            <input
              id="email"
              class="input pl-10 h-12"
              type="email"
              v-model="email"
              placeholder="ornek@estatedesk.com"
              required
              autofocus
            />
          </div>
        </div>

        <div class="field full">
          <label for="password">Şifre</label>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-outline pointer-events-none">lock</span>
            <input
              id="password"
              class="input pl-10 h-12"
              type="password"
              v-model="password"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <p v-if="error" class="error-msg text-center">{{ error }}</p>

        <button
          class="btn primary w-full h-12 text-[15px] font-semibold mt-1 gap-2"
          :disabled="auth.loading"
          type="submit"
        >
          {{ auth.loading ? 'Giriş yapılıyor…' : 'Giriş Yap' }}
          <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
        </button>
      </form>

      <!-- Footer -->
      <footer class="flex flex-col items-center gap-2 -mt-2">
        <p class="text-label-md text-on-surface-variant">
          Hesabınız yok mu?
          <router-link to="/register" class="text-primary font-semibold hover:underline">Kayıt olun</router-link>
        </p>
        <span class="flex items-center gap-1 text-label-sm text-outline">
          <span class="material-symbols-outlined text-[14px]">verified_user</span>
          Güvenli bağlantı
        </span>
      </footer>
    </main>
  </div>
</template>
