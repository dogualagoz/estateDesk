<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useToast } from '@/composables/useToast';
import { useConfirm } from '@/composables/useConfirm';
import { adminService } from '../services/admin.service';
import type { AdminUser } from '../types';
import AdminPagination from '../components/AdminPagination.vue';

/** Tüm ofislerdeki kullanıcılar: arama, filtre, oluşturma, rol/aktiflik yönetimi. */
const toast = useToast();
const { confirm } = useConfirm();

const items = ref<AdminUser[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = 25;
const loading = ref(false);
const q = ref('');
const status = ref<'active' | 'inactive' | ''>('');

const showCreate = ref(false);
const creating = ref(false);
const createForm = ref({ email: '', fullName: '', password: '', role: 'AGENT' });

let searchTimer: ReturnType<typeof setTimeout> | undefined;

async function load() {
  loading.value = true;
  try {
    const res = await adminService.users({
      q: q.value.trim() || undefined,
      status: status.value || undefined,
      page: page.value,
      pageSize,
    });
    items.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

watch([q, status], () => {
  // Yazarken debounce'lu arama; filtre değişince ilk sayfaya dön
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 300);
});
watch(page, load);
onMounted(load);

async function createUser() {
  creating.value = true;
  try {
    await adminService.createUser({ ...createForm.value });
    toast.success('Kullanıcı oluşturuldu');
    showCreate.value = false;
    createForm.value = { email: '', fullName: '', password: '', role: 'AGENT' };
    load();
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string | string[] } } })?.response?.data
      ?.message;
    toast.error(Array.isArray(msg) ? msg[0] : msg || 'Oluşturma başarısız');
  } finally {
    creating.value = false;
  }
}

async function toggleActive(user: AdminUser) {
  const activating = !user.isActive;
  const ok = await confirm({
    title: activating ? 'Kullanıcıyı aktive et' : 'Kullanıcıyı deaktive et',
    message: activating
      ? `${user.fullName} yeniden giriş yapabilecek.`
      : `${user.fullName} artık giriş yapamayacak. (Verileri korunur — geri alınabilir.)`,
    confirmText: activating ? 'Aktive Et' : 'Deaktive Et',
    danger: !activating,
    icon: activating ? 'person_check' : 'person_off',
  });
  if (!ok) return;
  try {
    const updated = await adminService.updateUser(user.id, { isActive: activating });
    Object.assign(user, updated);
    toast.success(activating ? 'Kullanıcı aktive edildi' : 'Kullanıcı deaktive edildi');
  } catch (e: unknown) {
    const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'İşlem başarısız');
  }
}

async function changeRole(user: AdminUser, e: Event) {
  const role = (e.target as HTMLSelectElement).value;
  try {
    const updated = await adminService.updateUser(user.id, { role });
    Object.assign(user, updated);
    toast.success('Rol güncellendi');
  } catch (err: unknown) {
    (e.target as HTMLSelectElement).value = user.role; // geri al
    const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
    toast.error(msg || 'Rol güncellenemedi');
  }
}

function fmtDate(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date(iso));
}
</script>

<template>
  <div class="p-6 md:p-8 max-w-6xl">
    <div class="flex items-center justify-between flex-wrap gap-stack-md mb-stack-lg">
      <h1 class="text-headline-lg font-semibold text-on-surface tracking-tight">
        Kullanıcılar <span class="text-on-surface-variant font-normal text-body-lg">· {{ total }}</span>
      </h1>
      <button class="btn primary" @click="showCreate = !showCreate">
        <span class="material-symbols-outlined text-[18px]">person_add</span>
        Kullanıcı Ekle
      </button>
    </div>

    <!-- Oluşturma formu -->
    <div v-if="showCreate" class="card mb-stack-lg">
      <h2 class="text-body-lg font-semibold text-on-surface mb-stack-md">Yeni Kullanıcı</h2>
      <div class="grid sm:grid-cols-2 gap-stack-md mb-stack-md">
        <div class="field"><label>E-posta *</label><input v-model="createForm.email" class="input" type="email" /></div>
        <div class="field"><label>Ad Soyad *</label><input v-model="createForm.fullName" class="input" /></div>
        <div class="field">
          <label>Şifre * <span class="font-normal text-on-surface-variant/60">(min 8, 1 büyük harf, 1 rakam)</span></label>
          <input v-model="createForm.password" class="input" type="password" />
        </div>
        <div class="field">
          <label>Rol</label>
          <select v-model="createForm.role" class="select">
            <option value="AGENT">Danışman</option>
            <option value="ADMIN">Ofis Yöneticisi</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-2">
        <button class="btn" @click="showCreate = false">Vazgeç</button>
        <button class="btn primary" :disabled="creating" @click="createUser">
          {{ creating ? 'Oluşturuluyor…' : 'Oluştur' }}
        </button>
      </div>
    </div>

    <!-- Filtreler -->
    <div class="flex items-center gap-stack-md flex-wrap mb-stack-md">
      <div class="relative w-full sm:w-72">
        <span class="material-symbols-outlined text-[18px] text-outline absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">search</span>
        <input v-model="q" class="input !pl-9" placeholder="Ad veya e-posta ara…" />
      </div>
      <select v-model="status" class="select w-40">
        <option value="">Tümü</option>
        <option value="active">Aktif</option>
        <option value="inactive">Deaktif</option>
      </select>
    </div>

    <!-- Tablo -->
    <div class="card !p-0 overflow-x-auto">
      <table class="w-full text-label-md">
        <thead>
          <tr class="text-left text-label-sm text-on-surface-variant border-b border-outline-variant">
            <th class="px-4 py-3 font-medium">Kullanıcı</th>
            <th class="px-4 py-3 font-medium">Ofis</th>
            <th class="px-4 py-3 font-medium">Rol</th>
            <th class="px-4 py-3 font-medium">Durum</th>
            <th class="px-4 py-3 font-medium">Kayıt</th>
            <th class="px-4 py-3 font-medium text-right">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id" class="border-b border-outline-variant/50 hover:bg-surface-container/40">
            <td class="px-4 py-3">
              <div class="font-medium text-on-surface">{{ u.fullName }} <span v-if="u.isDemo" class="tag ml-1">Demo</span></div>
              <div class="text-label-sm text-on-surface-variant">{{ u.email }}</div>
            </td>
            <td class="px-4 py-3 text-on-surface-variant">{{ u.office?.name ?? '—' }}</td>
            <td class="px-4 py-3">
              <span v-if="u.role === 'SUPERADMIN'" class="tag primary">Süper Admin</span>
              <select v-else class="select !py-1 text-[13px]" :value="u.role" @change="changeRole(u, $event)">
                <option value="AGENT">Danışman</option>
                <option value="ADMIN">Yönetici</option>
              </select>
            </td>
            <td class="px-4 py-3">
              <span class="tag" :class="u.isActive ? 'primary' : ''">{{ u.isActive ? 'Aktif' : 'Deaktif' }}</span>
            </td>
            <td class="px-4 py-3 text-on-surface-variant whitespace-nowrap">{{ fmtDate(u.createdAt) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                v-if="u.role !== 'SUPERADMIN'"
                class="btn !py-1 text-[13px]"
                :class="u.isActive ? 'border-error text-error bg-transparent hover:bg-error-container' : 'secondary'"
                @click="toggleActive(u)"
              >
                {{ u.isActive ? 'Deaktive Et' : 'Aktive Et' }}
              </button>
            </td>
          </tr>
          <tr v-if="!loading && items.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-on-surface-variant">Kayıt bulunamadı.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <AdminPagination v-model:page="page" :total="total" :page-size="pageSize" />
  </div>
</template>
