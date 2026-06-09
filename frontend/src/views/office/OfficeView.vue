<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import QRCode from 'qrcode';
import { useAuthStore } from '@/stores/auth';
import { officeService, type ExportDataset, type ExportFormat } from '@/services/office.service';
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
const roleChangingId = ref<string | null>(null);

// Üye arama + ofis adı düzenleme + QR + dışa aktarma durumları
const memberQuery = ref('');
const editingName = ref(false);
const nameDraft = ref('');
const savingName = ref(false);
const showQr = ref(false);
const qrDataUrl = ref<string | null>(null);
const exportScope = ref<string>('all');
const exportingKey = ref<string | null>(null);

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

const ownerId = computed(() => office.value?.ownerId ?? null);

/** Toplam aktiviteye (portföy + talep) göre azalan sıralı üyeler. */
const sortedMembers = computed(() =>
  [...members.value].sort(
    (a, b) => b.portfolioCount + b.demandCount - (a.portfolioCount + a.demandCount),
  ),
);

const filteredMembers = computed(() => {
  const q = memberQuery.value.trim().toLowerCase();
  if (!q) return sortedMembers.value;
  return sortedMembers.value.filter(
    (m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
  );
});

const totalPortfolios = computed(() => office.value?._count.portfolios ?? 0);
const totalDemands = computed(() => office.value?._count.demands ?? 0);
const memberCount = computed(() => office.value?._count.members ?? 0);
const avgPortfolio = computed(() =>
  memberCount.value ? Math.round(totalPortfolios.value / memberCount.value) : 0,
);

const stats = computed(() => [
  { icon: 'groups', label: 'Danışman', value: memberCount.value },
  { icon: 'home_work', label: 'Portföy', value: totalPortfolios.value },
  { icon: 'inbox', label: 'Talep', value: totalDemands.value },
  { icon: 'insights', label: 'Danışman başına portföy', value: avgPortfolio.value },
]);

/** Bir değerin ofis toplamına oranı (%) — katkı barı genişliği. */
function share(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

const createdAtLabel = computed(() => {
  if (!office.value?.createdAt) return '';
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(office.value.createdAt));
});

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
  } catch (e: any) {
    inviteError.value = e?.response?.data?.message || 'Link yenilenemedi';
    toast.error(inviteError.value || 'Link yenilenemedi');
  } finally {
    resetting.value = false;
  }
}

function startEditName() {
  nameDraft.value = office.value?.name ?? '';
  editingName.value = true;
}

async function saveName() {
  const name = nameDraft.value.trim();
  if (name.length < 2) {
    toast.error('Ofis adı en az 2 karakter olmalı');
    return;
  }
  if (name === office.value?.name) {
    editingName.value = false;
    return;
  }
  savingName.value = true;
  try {
    office.value = await officeService.rename(name);
    editingName.value = false;
    toast.success('Ofis adı güncellendi');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Ofis adı güncellenemedi');
  } finally {
    savingName.value = false;
  }
}

async function toggleRole(member: OfficeMember) {
  const makeAdmin = member.role !== 'ADMIN';
  const ok = await confirm({
    title: makeAdmin ? 'Yönetici yap' : 'Danışmanlığa al',
    message: makeAdmin
      ? `${member.fullName} ofis yöneticisi olacak. Yöneticiler davet, dışa aktarma ve üye yönetimi yapabilir.`
      : `${member.fullName} yöneticilikten alınıp danışman olacak.`,
    confirmText: makeAdmin ? 'Yönetici Yap' : 'Danışman Yap',
    icon: makeAdmin ? 'shield_person' : 'remove_moderator',
  });
  if (!ok) return;

  roleChangingId.value = member.id;
  try {
    await officeService.changeMemberRole(member.id, makeAdmin ? 'ADMIN' : 'AGENT');
    member.role = makeAdmin ? 'ADMIN' : 'AGENT';
    toast.success(`${member.fullName} ${makeAdmin ? 'yönetici yapıldı' : 'danışman yapıldı'}`);
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Rol değiştirilemedi');
  } finally {
    roleChangingId.value = null;
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
    if (office.value) office.value._count.members -= 1;
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

async function doExport(dataset: ExportDataset, format: ExportFormat) {
  const key = `${dataset}-${format}`;
  exportingKey.value = key;
  try {
    const memberId = exportScope.value === 'all' ? undefined : exportScope.value;
    await officeService.exportData(dataset, format, memberId);
    toast.success('Dışa aktarma hazırlandı');
  } catch (e: any) {
    toast.error(e?.response?.data?.message || 'Dışa aktarma başarısız');
  } finally {
    exportingKey.value = null;
  }
}

const scopeLabel = computed(() => {
  if (exportScope.value === 'all') return 'tüm ofis';
  return members.value.find((m) => m.id === exportScope.value)?.fullName ?? '';
});

function openProfile(id: string) {
  router.push({ name: 'profile', params: { id } });
}

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- Başlık -->
    <div class="page-header !mb-stack-md">
      <div class="flex items-center gap-4 min-w-0">
        <div
          class="w-12 h-12 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0"
        >
          <span class="material-symbols-outlined text-[26px]">apartment</span>
        </div>
        <div class="min-w-0">
          <h1
            class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface truncate"
          >
            {{ office?.name || 'Ofisim' }}
          </h1>
          <p v-if="office" class="text-label-md text-on-surface-variant mt-0.5">
            {{ office.owner.fullName }}
            <span v-if="createdAtLabel"> · {{ createdAtLabel }} tarihinde kuruldu</span>
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="empty">Yükleniyor…</div>

    <template v-else>
      <!-- Özet istatistikler -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-stack-md mb-stack-lg">
        <div
          v-for="s in stats"
          :key="s.label"
          class="card !p-stack-md flex items-center gap-stack-md"
        >
          <div
            class="w-11 h-11 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center shrink-0"
          >
            <span class="material-symbols-outlined text-[22px]">{{ s.icon }}</span>
          </div>
          <div class="min-w-0">
            <div class="text-headline-md font-semibold text-on-surface leading-none">
              {{ s.value }}
            </div>
            <div class="text-label-sm text-on-surface-variant mt-1.5 leading-tight">
              {{ s.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Danışmanlar -->
      <section class="mb-stack-lg">
        <div class="flex items-center justify-between gap-stack-md flex-wrap mb-stack-md">
          <h2 class="text-body-lg font-semibold text-on-surface">
            Danışmanlar
            <span class="text-on-surface-variant font-normal">· {{ memberCount }}</span>
          </h2>
          <div class="relative w-full sm:w-64">
            <span
              class="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              search
            </span>
            <input
              v-model="memberQuery"
              type="text"
              placeholder="Danışman ara…"
              class="input !pl-9"
            />
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-stack-md">
          <div
            v-for="m in filteredMembers"
            :key="m.id"
            class="card !p-stack-md flex flex-col gap-stack-md hover:border-primary transition-colors group relative"
          >
            <!-- Üst: kimlik + roller -->
            <div class="flex items-start gap-3">
              <button
                class="flex items-center gap-3 text-left min-w-0 flex-1"
                @click="openProfile(m.id)"
              >
                <div
                  class="w-11 h-11 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[14px] font-bold shrink-0"
                >
                  {{ initials(m.fullName) }}
                </div>
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="font-semibold text-on-surface truncate">{{ m.fullName }}</span>
                    <span v-if="m.id === auth.user?.id" class="tag">Siz</span>
                  </div>
                  <p class="text-label-sm text-on-surface-variant truncate">{{ m.email }}</p>
                </div>
              </button>

              <div class="flex items-center gap-1 shrink-0">
                <span
                  v-if="m.id === ownerId"
                  class="tag primary"
                  title="Ofis kurucusu"
                >
                  Kurucu
                </span>
                <span v-else class="tag" :class="m.role === 'ADMIN' ? 'primary' : ''">
                  {{ m.role === 'ADMIN' ? 'Yönetici' : 'Danışman' }}
                </span>
              </div>
            </div>

            <!-- Orta: katkı barları -->
            <div class="flex flex-col gap-2">
              <div>
                <div class="flex items-center justify-between text-label-sm mb-1">
                  <span class="text-on-surface-variant">Portföy</span>
                  <span class="text-on-surface font-medium">
                    {{ m.portfolioCount }}
                    <span class="text-on-surface-variant"
                      >· %{{ share(m.portfolioCount, totalPortfolios) }}</span
                    >
                  </span>
                </div>
                <div class="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    class="h-full rounded-full bg-primary transition-all"
                    :style="{ width: share(m.portfolioCount, totalPortfolios) + '%' }"
                  />
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between text-label-sm mb-1">
                  <span class="text-on-surface-variant">Talep</span>
                  <span class="text-on-surface font-medium">
                    {{ m.demandCount }}
                    <span class="text-on-surface-variant"
                      >· %{{ share(m.demandCount, totalDemands) }}</span
                    >
                  </span>
                </div>
                <div class="h-1.5 rounded-full bg-surface-container overflow-hidden">
                  <div
                    class="h-full rounded-full bg-tertiary-container transition-all"
                    :style="{ width: share(m.demandCount, totalDemands) + '%' }"
                  />
                </div>
              </div>
            </div>

            <!-- Yönetici eylemleri — net, etiketli butonlar -->
            <div
              v-if="auth.isAdmin && m.id !== auth.user?.id && m.id !== ownerId"
              class="flex items-center gap-2 pt-stack-md border-t border-outline-variant"
            >
              <button
                class="btn secondary flex-1 !py-1.5 text-[13px]"
                :disabled="roleChangingId === m.id"
                @click.stop="toggleRole(m)"
              >
                <span class="material-symbols-outlined text-[18px]">
                  {{ m.role === 'ADMIN' ? 'remove_moderator' : 'shield_person' }}
                </span>
                {{ m.role === 'ADMIN' ? 'Danışman Yap' : 'Yönetici Yap' }}
              </button>
              <button
                class="btn !py-1.5 text-[13px] border-error text-error bg-transparent hover:bg-error-container"
                :disabled="removingMemberId === m.id"
                @click.stop="removeMember(m)"
              >
                <span class="material-symbols-outlined text-[18px]">person_remove</span>
                Çıkar
              </button>
            </div>
          </div>
        </div>

        <p v-if="filteredMembers.length === 0" class="empty">
          "{{ memberQuery }}" ile eşleşen danışman yok.
        </p>
      </section>

      <!-- Verileri dışa aktar -->
      <section class="card mb-stack-lg">
        <div class="flex items-start gap-3 mb-stack-md">
          <div
            class="w-10 h-10 rounded-lg bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center shrink-0"
          >
            <span class="material-symbols-outlined text-[20px]">download</span>
          </div>
          <div>
            <h2 class="text-body-lg font-semibold text-on-surface">Verileri Dışa Aktar</h2>
            <p class="text-label-md text-on-surface-variant mt-0.5">
              Portföy ve talep kayıtlarını Excel ya da CSV olarak indirin. Yedekleme, rapor veya
              başka bir araca aktarım için kullanışlıdır.
            </p>
          </div>
        </div>

        <!-- Kapsam seçimi -->
        <div class="field full mb-stack-md">
          <label>Kapsam</label>
          <select v-model="exportScope" class="select sm:max-w-xs">
            <option value="all">Tüm ofis</option>
            <option v-for="m in sortedMembers" :key="m.id" :value="m.id">
              {{ m.fullName }} ({{ m.portfolioCount }} portföy · {{ m.demandCount }} talep)
            </option>
          </select>
        </div>

        <div class="grid sm:grid-cols-2 gap-stack-md">
          <div
            v-for="ds in [
              { key: 'portfolios', label: 'Portföyler', icon: 'home_work' },
              { key: 'demands', label: 'Talepler', icon: 'inbox' },
            ]"
            :key="ds.key"
            class="rounded-xl border border-outline-variant bg-surface-container-low p-stack-md flex flex-col gap-stack-sm"
          >
            <div class="flex items-center gap-2 text-on-surface font-medium">
              <span class="material-symbols-outlined text-[20px] text-primary">{{ ds.icon }}</span>
              {{ ds.label }}
            </div>
            <div class="flex gap-2">
              <button
                class="btn primary flex-1"
                :disabled="exportingKey === `${ds.key}-xlsx`"
                @click="doExport(ds.key as ExportDataset, 'xlsx')"
              >
                <span
                  class="material-symbols-outlined text-[18px]"
                  :class="exportingKey === `${ds.key}-xlsx` ? 'animate-spin' : ''"
                >
                  {{ exportingKey === `${ds.key}-xlsx` ? 'progress_activity' : 'table_view' }}
                </span>
                Excel
              </button>
              <button
                class="btn secondary flex-1"
                :disabled="exportingKey === `${ds.key}-csv`"
                @click="doExport(ds.key as ExportDataset, 'csv')"
              >
                <span
                  class="material-symbols-outlined text-[18px]"
                  :class="exportingKey === `${ds.key}-csv` ? 'animate-spin' : ''"
                >
                  {{ exportingKey === `${ds.key}-csv` ? 'progress_activity' : 'description' }}
                </span>
                CSV
              </button>
            </div>
          </div>
        </div>
        <p class="text-label-sm text-on-surface-variant mt-stack-md">
          <span class="material-symbols-outlined text-[14px] align-text-bottom">filter_alt</span>
          İndirilecek kapsam: <strong class="text-on-surface">{{ scopeLabel }}</strong>
        </p>
      </section>

      <!-- Ofis Ayarları -->
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
              <p class="text-label-sm text-on-surface-variant" v-if="inviteLink">
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
                  @click="resetInviteLink"
                  title="Mevcut linki geçersiz kılıp yeni bir tane oluştur"
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
  </div>
</template>
