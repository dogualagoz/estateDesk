<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import type { OfficeSummary, Invite } from '@/types/office';

/**
 * Ofis ayarları kartı: ofis adı düzenleme, davet linki
 * (kopyala / QR / yenile) ve ofisten çıkma. Davet linkini kendisi yükler;
 * ad değişikliği event ile ana view'a bildirilir.
 */
const props = defineProps<{
  office: OfficeSummary | null;
  ownerId: string | null;
}>();

const emit = defineEmits<{
  (e: 'renamed', office: OfficeSummary): void;
}>();

const auth = useAuthStore();
const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();

// ── Ofis adı ──
const editingName = ref(false);
const nameDraft = ref('');
const savingName = ref(false);

function startEditName() {
  nameDraft.value = props.office?.name ?? '';
  editingName.value = true;
}

async function saveName() {
  const name = nameDraft.value.trim();
  if (name.length < 2) {
    toast.error('Ofis adı en az 2 karakter olmalı');
    return;
  }
  if (name === props.office?.name) {
    editingName.value = false;
    return;
  }
  savingName.value = true;
  try {
    const updated = await officeService.rename(name);
    emit('renamed', updated);
    editingName.value = false;
    toast.success('Ofis adı güncellendi');
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'Ofis adı güncellenemedi');
  } finally {
    savingName.value = false;
  }
}

// ── Davet linki ──
const inviteLink = ref<Invite | null>(null);
const inviteError = ref<string | null>(null);
const resetting = ref(false);
const copied = ref(false);
const showQr = ref(false);
const qrDataUrl = ref<string | null>(null);

onMounted(async () => {
  if (auth.isAdmin) {
    inviteLink.value = await officeService.getInviteLink().catch(() => null);
  }
});

// Davet linki değişince QR kodunu yeniden üret
watch(
  () => inviteLink.value?.link,
  async (link) => {
    if (!link) {
      qrDataUrl.value = null;
      return;
    }
    try {
      qrDataUrl.value = await QRCode.toDataURL(link, {
        width: 220,
        margin: 1,
        color: { dark: '#1a1c1b', light: '#ffffff' },
      });
    } catch {
      qrDataUrl.value = null;
    }
  },
  { immediate: true },
);

/** Linki panoya kopyala — clipboard API yoksa textarea seçimine düşer. */
async function copyLink() {
  const link = inviteLink.value?.link;
  if (!link) return;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(link);
    } else {
      throw new Error('clipboard yok');
    }
  } catch {
    const ta = document.createElement('textarea');
    ta.value = link;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } catch {
      document.body.removeChild(ta);
      toast.error('Link kopyalanamadı, manuel olarak kopyalayın');
      return;
    }
    document.body.removeChild(ta);
  }
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

async function resetInviteLink() {
  const ok = await confirm({
    title: 'Davet linkini yenile',
    message:
      'Mevcut link geçersiz olacak ve daha önce paylaştığınız bağlantılar artık çalışmayacak. Yeni bir link oluşturulsun mu?',
    confirmText: 'Yenile',
    danger: true,
    icon: 'autorenew',
  });
  if (!ok) return;

  inviteError.value = null;
  resetting.value = true;
  try {
    inviteLink.value = await officeService.resetInviteLink();
    toast.success('Yeni davet linki oluşturuldu');
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    inviteError.value = msg || 'Link yenilenemedi';
    toast.error(inviteError.value);
  } finally {
    resetting.value = false;
  }
}

// ── Ofisten çıkma ──
async function leaveOffice() {
  const ok = await confirm({
    title: 'Ofisten çık',
    message: `"${props.office?.name ?? 'Bu ofis'}" ofisinden ayrılmak istediğinizden emin misiniz? Portföy ve taleplerinize artık erişemezsiniz.`,
    confirmText: 'Ofisten Çık',
    danger: true,
    icon: 'logout',
  });
  if (!ok) return;

  try {
    await officeService.leaveOffice();
    await auth.fetchMe();
    toast.success('Ofisten ayrıldınız');
    router.push('/onboarding');
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'İşlem başarısız');
  }
}
</script>

<template>
  <section class="card flex flex-col gap-stack-lg">
    <div class="flex items-center gap-2">
      <span class="material-symbols-outlined text-[22px] text-on-surface-variant">settings</span>
      <h2 class="text-body-lg font-semibold text-on-surface">Ofis Ayarları</h2>
    </div>

    <!-- Ofis adı (yalnız yönetici) -->
    <div v-if="auth.isAdmin">
      <h3 class="text-label-md font-medium text-on-surface mb-1">Ofis Adı</h3>
      <p class="text-label-sm text-on-surface-variant mb-stack-sm">
        Ofisinizin tüm danışmanlara görünen adı.
      </p>
      <div v-if="editingName" class="flex items-center gap-2 max-w-md">
        <input
          v-model="nameDraft"
          type="text"
          class="input"
          maxlength="80"
          :disabled="savingName"
          @keyup.enter="saveName"
          @keyup.esc="editingName = false"
        />
        <button class="btn primary" :disabled="savingName" @click="saveName">
          <span class="material-symbols-outlined text-[18px]">check</span>
          Kaydet
        </button>
        <button class="btn ghost" :disabled="savingName" @click="editingName = false">
          Vazgeç
        </button>
      </div>
      <div v-else class="flex items-center justify-between gap-2 max-w-md p-stack-sm pl-3 rounded-lg border border-outline-variant bg-surface-container-low">
        <span class="text-on-surface font-medium truncate">{{ office?.name }}</span>
        <button class="btn secondary !py-1.5 text-[13px] shrink-0" @click="startEditName">
          <span class="material-symbols-outlined text-[18px]">edit</span>
          Adı Düzenle
        </button>
      </div>
    </div>

    <hr v-if="auth.isAdmin" class="border-outline-variant" />

    <!-- Davet linki (yalnız yönetici) -->
    <div v-if="auth.isAdmin">
      <h3 class="text-label-md font-medium text-on-surface mb-1">Danışman Davet Et</h3>
      <p class="text-label-sm text-on-surface-variant mb-stack-md">
        Bu linke sahip olan herkes ofise danışman olarak katılabilir. Linki yalnızca
        güvendiğiniz kişilerle paylaşın.
      </p>

      <div class="flex flex-col gap-stack-sm">
        <div
          class="flex items-stretch rounded-lg border border-outline-variant bg-surface-container-low overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/10 transition-colors"
        >
          <input
            :value="inviteLink?.link ?? 'Yükleniyor…'"
            readonly
            spellcheck="false"
            class="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-label-md text-on-surface-variant font-mono text-[13px] outline-none cursor-text select-all"
            @focus="($event.target as HTMLInputElement).select()"
            @click="($event.target as HTMLInputElement).select()"
          />
          <button
            class="shrink-0 flex items-center gap-1.5 px-4 border-l border-outline-variant text-label-md font-medium transition-colors"
            :class="copied ? 'text-primary bg-primary-fixed/40' : 'text-primary hover:bg-primary/5'"
            :disabled="!inviteLink"
            @click="copyLink"
          >
            <span class="material-symbols-outlined text-[18px]">{{
              copied ? 'check' : 'content_copy'
            }}</span>
            {{ copied ? 'Kopyalandı' : 'Kopyala' }}
          </button>
        </div>

        <div class="flex items-center justify-between flex-wrap gap-2">
          <p v-if="inviteLink" class="text-label-sm text-on-surface-variant">
            <span class="material-symbols-outlined text-[14px] align-text-bottom">schedule</span>
            {{
              inviteLink.expiresInDays > 0
                ? `${inviteLink.expiresInDays} gün geçerli`
                : 'Bugün sona eriyor'
            }}
          </p>
          <div class="flex items-center gap-1">
            <button
              class="btn ghost text-[13px] py-1.5 px-2.5"
              :class="showQr ? 'text-primary' : 'text-on-surface-variant'"
              @click="showQr = !showQr"
            >
              <span class="material-symbols-outlined text-[16px]">qr_code_2</span>
              {{ showQr ? 'QR Kodu Gizle' : 'QR Kod' }}
            </button>
            <button
              class="btn ghost text-[13px] py-1.5 px-2.5 text-on-surface-variant"
              :disabled="resetting"
              title="Mevcut linki geçersiz kılıp yeni bir tane oluştur"
              @click="resetInviteLink"
            >
              <span
                class="material-symbols-outlined text-[16px]"
                :class="resetting ? 'animate-spin' : ''"
                >autorenew</span
              >
              {{ resetting ? 'Yenileniyor…' : 'Linki Yenile' }}
            </button>
          </div>
        </div>
        <p v-if="inviteError" class="error-msg">{{ inviteError }}</p>

        <!-- QR kod paneli -->
        <div
          v-if="showQr"
          class="flex flex-col sm:flex-row items-center gap-stack-md p-stack-md rounded-lg bg-surface-container-low border border-outline-variant mt-stack-sm"
        >
          <img
            v-if="qrDataUrl"
            :src="qrDataUrl"
            alt="Davet QR kodu"
            class="w-40 h-40 rounded-lg bg-white p-2 border border-outline-variant"
          />
          <div class="text-label-md text-on-surface-variant text-center sm:text-left">
            <p class="font-medium text-on-surface mb-1">Telefonla katılın</p>
            <p>
              Danışmanlar telefon kameralarıyla bu kodu okutarak davet sayfasını doğrudan
              açabilir.
            </p>
          </div>
        </div>
      </div>
    </div>

    <hr v-if="auth.isAdmin" class="border-outline-variant" />

    <!-- Tehlikeli bölge: ofisten çık -->
    <div>
      <h3 class="text-label-md font-medium text-on-surface mb-1">Ofisten Çık</h3>
      <p class="text-label-sm text-on-surface-variant mb-stack-sm">
        <template v-if="auth.user?.id === ownerId">
          Ofis kurucusu olarak ofisten çıkamazsınız.
        </template>
        <template v-else>
          Bu ofisten ayrılırsınız. Portföy ve taleplerinize artık erişemezsiniz. Yeni bir ofis
          kurabilir ya da başka bir ofise katılabilirsiniz.
        </template>
      </p>
      <button
        class="btn w-fit border-error text-error bg-transparent hover:bg-error-container disabled:hover:bg-transparent"
        :disabled="auth.user?.id === ownerId"
        @click="leaveOffice"
      >
        <span class="material-symbols-outlined text-[18px]">logout</span>
        Ofisten Çık
      </button>
    </div>
  </section>
</template>
