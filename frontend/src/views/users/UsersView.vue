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
    <div class="page-header">
      <h1>Kullanıcılar</h1>
      <button class="btn primary" @click="showForm = !showForm">
        {{ showForm ? 'Kapat' : '+ Yeni Kullanıcı' }}
      </button>
    </div>

    <form v-if="showForm" class="card" @submit.prevent="create" style="margin-bottom: 1rem;">
      <div class="row">
        <div class="field">
          <label>Email</label>
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
      <p v-if="error" class="error">{{ error }}</p>
      <div class="row" style="margin-top: 0.75rem;">
        <button class="btn primary" type="submit">Oluştur</button>
      </div>
    </form>

    <div class="card">
      <div v-if="loading" class="empty">Yükleniyor…</div>
      <table v-else class="table">
        <thead>
          <tr><th>Email</th><th>Ad Soyad</th><th>Rol</th><th>Durum</th><th></th></tr>
        </thead>
        <tbody>
          <tr v-for="u in items" :key="u.id">
            <td>{{ u.email }}</td>
            <td>{{ u.fullName }}</td>
            <td><span class="tag primary">{{ u.role }}</span></td>
            <td>
              <span :class="['tag', u.isActive ? 'success' : 'danger']">
                {{ u.isActive ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td>
              <button class="btn ghost" @click="toggleActive(u)">
                {{ u.isActive ? 'Pasife al' : 'Aktif et' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
