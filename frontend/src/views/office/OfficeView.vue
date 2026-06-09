<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import type { OfficeSummary, OfficeMember, Invite } from '@/types/office';

const auth = useAuthStore();
const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();

const office = ref<OfficeSummary | null>(null);
const members = ref<OfficeMember[]>([]);
const inviteLink = ref<Invite | null>(null);
const loading = ref(false);

const inviteError = ref<string | null>(null);
const resetting = ref(false);
const copied = ref(false);
const removingMemberId = ref<string | null>(null);

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

async function load() {
  loading.value = true;
  try {
    const [o, m] = await Promise.all([officeService.me(), officeService.members()]);
    office.value = o;
    members.value = m;
    if (auth.isAdmin) {
      inviteLink.value = await officeService.getInviteLink();
    }
  } finally {
    loading.value = false;
  }
}

/** Linki panoya kopyala — clipboard API yoksa input seçimine düşer. */
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
    // Güvenli olmayan bağlam / izin yoksa: gizli textarea ile kopyala
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
    message: 'Mevcut link geçersiz olacak ve daha önce paylaştığınız bağlantılar artık çalışmayacak. Yeni bir link oluşturulsun mu?',
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
  } catch (e: any) {
    inviteError.value = e?.response?.data?.message || 'Link yenilenemedi';
    toast.error(inviteError.value || 'Link yenilenemedi');
  } finally {
    resetting.value = false;
  }
}

async function removeMember(member: OfficeMember) {
  const ok = await confirm({
    title: 'Danışmanı çıkar',
    message: `${member.fullName} adlı danışmanı ofisten çıkarmak istediğinizden emin misiniz?`,
    confirmText: 'Çıkar',
    danger: true,
    icon: 'person_remove',
  });
  if (!ok) return;

  removingMemberId.value = member.id;
  try {
    await officeService.removeMember(member.id);
    members.value = members.value.filter((m) => m.id !== member.id);
    toast.success(`${member.fullName} ofisten çıkarıldı`);
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'İşlem başarısız');
  } finally {
    removingMemberId.value = null;
  }
}

async function leaveOffice() {
  const ok = await confirm({
    title: 'Ofisten çık',
    message: `"${office.value?.name ?? 'Bu ofis'}" ofisinden ayrılmak istediğinizden emin misiniz? Portföy ve taleplerinize artık erişemezsiniz.`,
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
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'İşlem başarısız');
  }
}

function openProfile(id: string) {
  router.push({ name: 'profile', params: { id } });
}

onMounted(load);
</script>

<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">
          {{ office?.name || 'Ofisim' }}
        </h1>
        <p v-if="office" class="text-label-md text-on-surface-variant mt-1">
          {{ office._count.members }} danışman · {{ office._count.portfolios }} portföy · {{ office._count.demands }} talep
        </p>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else>
      <!-- Üyeler -->
      <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">Danışmanlar</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-stack-md mb-stack-lg">
        <button
          v-for="m in members"
          :key="m.id"
          class="card flex items-center gap-4 text-left hover:border-primary transition-colors cursor-pointer group relative"
          @click="openProfile(m.id)"
        >
          <div class="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[14px] font-bold shrink-0">
            {{ initials(m.fullName) }}
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-semibold text-on-surface truncate">{{ m.fullName }}</span>
              <span v-if="m.id === auth.user?.id" class="tag">Siz</span>
            </div>
            <p class="text-label-sm text-on-surface-variant truncate">{{ m.email }}</p>
            <p class="text-label-sm text-on-surface-variant mt-0.5">
              {{ m.portfolioCount }} portföy · {{ m.demandCount }} talep
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="tag" :class="m.role === 'ADMIN' ? 'primary' : ''">
              {{ m.role === 'ADMIN' ? 'Yönetici' : 'Danışman' }}
            </span>
            <button
              v-if="auth.isAdmin && m.id !== auth.user?.id"
              class="btn ghost px-2 py-2 text-error opacity-0 group-hover:opacity-100 transition-opacity"
              :disabled="removingMemberId === m.id"
              @click.stop="removeMember(m)"
              title="Danışmanı çıkart"
            >
              <span class="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        </button>
      </div>

      <!-- Ofisten çık -->
      <section class="card flex flex-col gap-stack-md">
        <div>
          <h2 class="text-body-lg font-semibold text-on-surface">Ofisten Çık</h2>
          <p class="text-label-md text-on-surface-variant mt-1">
            Bu ofisten ayrılın. Yeni bir ofis oluşturup katabilirsiniz.
          </p>
        </div>
        <button class="btn ghost text-error w-fit" @click="leaveOffice">
          <span class="material-symbols-outlined text-[18px]">logout</span>
          Ofisten Çık
        </button>
      </section>

      <!-- Davet yönetimi (yalnız yönetici) — tek paylaşılan link -->
      <section v-if="auth.isAdmin" class="card flex flex-col gap-gutter">
        <div>
          <h2 class="text-body-lg font-semibold text-on-surface">Danışman Davet Et</h2>
          <p class="text-label-md text-on-surface-variant mt-1">
            Bu linke sahip olan herkes ofise danışman olarak katılabilir. Linki yalnızca güvendiğiniz kişilerle paylaşın.
          </p>
        </div>

        <!-- Kopyalanabilir ama düzenlenemez link alanı (Notion/Figma tarzı) -->
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
              <span class="material-symbols-outlined text-[18px]">{{ copied ? 'check' : 'content_copy' }}</span>
              {{ copied ? 'Kopyalandı' : 'Kopyala' }}
            </button>
          </div>

          <div class="flex items-center justify-between flex-wrap gap-2">
            <p class="text-label-sm text-on-surface-variant" v-if="inviteLink">
              <span class="material-symbols-outlined text-[14px] align-text-bottom">schedule</span>
              {{ inviteLink.expiresInDays > 0 ? `${inviteLink.expiresInDays} gün geçerli` : 'Bugün sona eriyor' }}
            </p>
            <button
              class="btn ghost text-[13px] py-1.5 px-2.5 text-on-surface-variant"
              :disabled="resetting"
              @click="resetInviteLink"
              title="Mevcut linki geçersiz kılıp yeni bir tane oluştur"
            >
              <span class="material-symbols-outlined text-[16px]" :class="resetting ? 'animate-spin' : ''">autorenew</span>
              {{ resetting ? 'Yenileniyor…' : 'Linki Yenile' }}
            </button>
          </div>
          <p v-if="inviteError" class="error-msg">{{ inviteError }}</p>
        </div>
      </section>
    </template>
  </div>
</template>
