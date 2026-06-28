<script setup lang="ts">
const emit = defineEmits<{ (e: 'demo'): void }>();

const year = new Date().getFullYear();

function go(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>

<template>
  <footer class="border-t border-outline-variant bg-surface-container-low/40">
    <div class="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
      <div class="grid gap-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <!-- Marka -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <img :src="'/logo.svg'" alt="emlakdefter" class="h-8 w-8 rounded-lg" />
            <span class="font-bold text-headline-md text-on-surface tracking-tight">emlakdefter</span>
          </div>
          <p class="text-label-md text-on-surface-variant max-w-xs">
            Türk emlak ofisleri için portföy ve talep yönetimi. Fırsatları değil, eşleşmeleri yakalayın.
          </p>
        </div>

        <!-- Ürün -->
        <div>
          <div class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Ürün</div>
          <ul class="space-y-2.5 text-label-md text-on-surface-variant">
            <li><button class="hover:text-on-surface transition-colors" @click="go('features')">Özellikler</button></li>
            <li><button class="hover:text-on-surface transition-colors" @click="go('how')">Nasıl Çalışır</button></li>
            <li><button class="hover:text-on-surface transition-colors" @click="go('pricing')">Fiyatlandırma</button></li>
            <li><button class="hover:text-on-surface transition-colors" @click="emit('demo')">Demo’yu İncele</button></li>
          </ul>
        </div>

        <!-- Hesap -->
        <div>
          <div class="text-label-sm text-on-surface-variant uppercase tracking-wider mb-3">Hesap</div>
          <ul class="space-y-2.5 text-label-md text-on-surface-variant">
            <li><router-link to="/login" class="hover:text-on-surface transition-colors">Giriş Yap</router-link></li>
            <li><router-link to="/register" class="hover:text-on-surface transition-colors">Ücretsiz Başla</router-link></li>
            <li><button class="hover:text-on-surface transition-colors" @click="go('faq')">SSS</button></li>
          </ul>
        </div>
      </div>

      <div class="mt-10 pt-6 border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 text-label-sm text-on-surface-variant">
        <span>© {{ year }} emlakdefter. Tüm hakları saklıdır.</span>
        <span>Türkiye’de sahadaki emlakçılar için geliştirildi.</span>
      </div>
    </div>
  </footer>
</template>
