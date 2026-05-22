<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { usersService } from '@/services/users.service';
import type { User, CreateUserPayload } from '@/types/user';

const items = ref<User[]>([]);
const loading = ref(false);
const showForm = ref(false);
const error = ref<string | null>(null);

const form = reactive<CreateUserPayload>({
  email: '',
  fullName: '',
  password: '',
  role: 'AGENT',
  isActive: true,
});

async function load() {
  loading.value = true;
  try {
    items.value = await usersService.list();
  } finally {
    loading.value = false;
  }
}

async function create() {
  error.value = null;
  try {
    await usersService.create({ ...form });
    showForm.value = false;
    Object.assign(form, { email: '', fullName: '', password: '', role: 'AGENT', isActive: true });
    await load();
  } catch (e: any) {
    error.value = e?.response?.data?.message || 'Oluşturulamadı';
  }
}

async function toggleActive(u: User) {
  await usersService.update(u.id, { isActive: !u.isActive });
  await load();
}

onMounted(load);
</script>

<template>
  <div class="page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="text-headline-lg-mobile md:text-headline-lg font-semibold tracking-tight text-on-surface">Kullanıcılar</h1>
        <p class="text-label-md text-on-surface-variant mt-1">Sistem kullanıcılarını yönetin</p>
      </div>
      <button
        class="btn"
        :class="showForm ? 'bg-surface-container' : 'primary'"
        @click="showForm = !showForm"
      >
        <span class="material-symbols-outlined text-[18px]">{{ showForm ? 'close' : 'person_add' }}</span>
        {{ showForm ? 'Kapat' : 'Yeni Kullanıcı' }}
      </button>
    </div>

    <!-- Create form -->
    <form v-if="showForm" class="card mb-gutter" @submit.prevent="create">
      <h2 class="text-body-lg font-semibold text-on-surface mb-gutter">Yeni Kullanıcı Ekle</h2>
      <div class="flex flex-wrap gap-stack-md">
        <div class="field">
          <label>E-posta</label>
          <input class="input" type="email" v-model="form.email" required />
        </div>
        <div class="field">
          <label>Ad Soyad</label>
          <input class="input" v-model="form.fullName" required />
        </div>
        <div class="field">
          <label>Şifre</label>
          <input class="input" type="password" v-model="form.password" required minlength="6" />
        </div>
        <div class="field">
          <label>Rol</label>
          <select class="select" v-model="form.role">
            <option value="AGENT">Danışman</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>
      <p v-if="error" class="error-msg mt-stack-md">{{ error }}</p>
      <div class="flex gap-3 mt-gutter pt-gutter border-t border-outline-variant">
        <button class="btn primary" type="submit">
          <span class="material-symbols-outlined text-[18px]">add</span>
          Oluştur
        </button>
        <button class="btn" type="button" @click="showForm = false">İptal</button>
      </div>
    </form>

    <!-- Users table -->
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
      <div class="px-stack-md py-stack-md border-b border-outline-variant">
        <h2 class="text-body-lg font-semibold text-on-surface">Kullanıcı Listesi</h2>
      </div>
      <div v-if="loading" class="empty">Yükleniyor…</div>
      <div v-else-if="!items.length" class="empty">Kullanıcı bulunamadı</div>
      <table v-else class="table">
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Rol</th>
            <th>Durum</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id">
            <td>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-[12px] font-bold shrink-0">
                  {{ u.fullName.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase() }}
                </div>
                <span class="font-medium text-on-surface">{{ u.fullName }}</span>
              </div>
            </td>
            <td class="text-on-surface-variant">{{ u.email }}</td>
            <td>
              <span class="tag primary">{{ u.role === 'ADMIN' ? 'Admin' : 'Danışman' }}</span>
            </td>
            <td>
              <span :class="['tag', u.isActive ? 'success' : 'danger']">
                {{ u.isActive ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td>
              <button
                class="btn ghost text-[13px] py-1.5 px-3"
                @click="toggleActive(u)"
              >
                {{ u.isActive ? 'Pasife al' : 'Aktif et' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
