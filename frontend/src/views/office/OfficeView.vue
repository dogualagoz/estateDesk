<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { officeService } from '@/services/office.service';
import type { OfficeSummary, OfficeMember, Invite } from '@/types/office';

const auth = useAuthStore();
const router = useRouter();

const office = ref<OfficeSummary | null>(null);
const members = ref<OfficeMember[]>([]);
const invites = ref<Invite[]>([]);
const loading = ref(false);

const inviteEmail = ref('');
const inviteError = ref<string | null>(null);
const creatingInvite = ref(false);
const copiedToken = ref<string | null>(null);
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
      invites.value = await officeService.listInvites();
    }
  } finally {
    loading.value = false;
  }
}

async function createInvite() {
  inviteError.value = null;
  creatingInvite.value = true;
  try {
    const invite = await officeService.createInvite();
    // Listede varsa güncelle, yoksa başa ekle
    const idx = invites.value.findIndex((i) => i.id === invite.id);
    if (idx >= 0) invites.value[idx] = invite;
    else invites.value.unshift(invite);
    await copyLink(invite);
  } catch (e: any) {
    inviteError.value = e?.response?.data?.message || 'Davet oluşturulamadı';
  } finally {
    creatingInvite.value = false;
  }
}

async function copyLink(invite: Invite) {
  try {
    await navigator.clipboard.writeText(invite.link);
    copiedToken.value = invite.token;
    setTimeout(() => {
      if (copiedToken.value === invite.token) copiedToken.value = null;
    }, 2000);
  } catch {
    /* clipboard erişilemezse sessizce geç */
  }
}

async function revokeInvite(id: string) {
  await officeService.revokeInvite(id);
  invites.value = invites.value.filter((i) => i.id !== id);
}

async function removeMember(member: OfficeMember) {
  if (!confirm(`${member.fullName} adlı danışmanı ofisten çıkartmak istediğinizden emin misiniz?`)) {
    return;
  }

  removingMemberId.value = member.id;
  try {
    await officeService.removeMember(member.id);
    members.value = members.value.filter((m) => m.id !== member.id);
  } catch (e: any) {
    alert(e?.response?.data?.message || 'İşlem başarısız');
  } finally {
    removingMemberId.value = null;
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

      <!-- Davet yönetimi (yalnız yönetici) -->
      <section v-if="auth.isAdmin" class="card flex flex-col gap-gutter">
        <div>
          <h2 class="text-body-lg font-semibold text-on-surface">Danışman Davet Et</h2>
          <p class="text-label-md text-on-surface-variant mt-1">
            Davet linki oluşturun ve ilgili kişiyle paylaşın. Davet linki 14 gün geçerlidir.
          </p>
        </div>

        <div class="flex gap-stack-md">
          <button class="btn primary" :disabled="creatingInvite" @click="createInvite">
            <span class="material-symbols-outlined text-[18px]">link</span>
            {{ creatingInvite ? 'Oluşturuluyor…' : 'Davet Linki Oluştur' }}
          </button>
        </div>
        <p v-if="inviteError" class="error-msg">{{ inviteError }}</p>

        <!-- Aktif davet linkleri -->
        <div v-if="invites.length" class="flex flex-col gap-stack-sm pt-stack-md border-t border-outline-variant">
          <p class="text-label-md font-medium text-on-surface">Aktif davet linkleri ({{ invites.length }})</p>
          <div
            v-for="inv in invites"
            :key="inv.id"
            class="flex items-center gap-3 flex-wrap p-stack-md rounded-lg bg-surface-container-low"
          >
            <div class="min-w-0 flex-1">
              <p class="text-label-sm text-on-surface-variant truncate">{{ inv.link }}</p>
              <p class="text-label-xs text-on-surface-variant mt-0.5" v-if="inv.expiresInDays">
                {{ inv.expiresInDays }} gün kaldı
              </p>
            </div>
            <button class="btn ghost text-[13px] py-1.5 px-3" @click="copyLink(inv)">
              <span class="material-symbols-outlined text-[16px]">{{ copiedToken === inv.token ? 'check' : 'content_copy' }}</span>
              {{ copiedToken === inv.token ? 'Kopyalandı' : 'Kopyala' }}
            </button>
            <button class="btn ghost text-[13px] py-1.5 px-3 text-error" @click="revokeInvite(inv.id)">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
