<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import { useConfirm } from '@/composables/useConfirm';
import { useToast } from '@/composables/useToast';
import type { OfficeMember } from '@/types/office';

/**
 * Danışman kartları: arama, katkı barları ve yönetici eylemleri
 * (rol değiştir / ofisten çıkar). Üye listesi ana view'dadır; değişiklikler
 * event ile yukarı bildirilir (props mutasyonu yapılmaz).
 */
const props = defineProps<{
  members: OfficeMember[];
  ownerId: string | null;
  totalPortfolios: number;
  totalDemands: number;
  memberCount: number;
}>();

const emit = defineEmits<{
  (e: 'role-changed', id: string, role: 'ADMIN' | 'AGENT'): void;
  (e: 'removed', id: string): void;
}>();

const auth = useAuthStore();
const router = useRouter();
const { confirm } = useConfirm();
const toast = useToast();

const memberQuery = ref('');
const removingMemberId = ref<string | null>(null);
const roleChangingId = ref<string | null>(null);

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

/** Toplam aktiviteye (portföy + talep) göre azalan sıralı üyeler. */
const sortedMembers = computed(() =>
  [...props.members].sort(
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

/** Bir değerin ofis toplamına oranı (%) — katkı barı genişliği. */
function share(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
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
    const newRole = makeAdmin ? 'ADMIN' : 'AGENT';
    await officeService.changeMemberRole(member.id, newRole);
    emit('role-changed', member.id, newRole);
    toast.success(`${member.fullName} ${makeAdmin ? 'yönetici yapıldı' : 'danışman yapıldı'}`);
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'Rol değiştirilemedi');
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
    emit('removed', member.id);
    toast.success(`${member.fullName} ofisten çıkarıldı`);
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'İşlem başarısız');
  } finally {
    removingMemberId.value = null;
  }
}

function openProfile(id: string) {
  router.push({ name: 'profile', params: { id } });
}
</script>

<template>
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
</template>
