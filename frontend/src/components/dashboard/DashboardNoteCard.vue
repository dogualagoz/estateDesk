<script setup lang="ts">
import { ref, nextTick, onMounted, computed } from 'vue';
import { portfolioService } from '@/services/portfolio.service';
import { demandService } from '@/services/demand.service';

const props = defineProps<{
  id: string;
  itemType: 'portfolio' | 'demand';
  badge: string;
  title: string;
  subtitle?: string;
  note: string;
  updatedAt: string;
  agentName?: string;
  initialEditOpen?: boolean;
}>();

const emit = defineEmits<{
  saved: [newNote: string];
  cancelled: [];
}>();

const editing = ref(props.initialEditOpen ?? false);
const draftNote = ref(props.note);
const saving = ref(false);
const textareaEl = ref<HTMLTextAreaElement | null>(null);

onMounted(() => {
  if (props.initialEditOpen) {
    nextTick(() => textareaEl.value?.focus());
  }
});

// Tarihe göre yaşlık hesaplama
const ageDays = computed(() => {
  const diffMs = Date.now() - new Date(props.updatedAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

// Tarihin görsel sınıfı: taze / normal / eski / çok eski
const dateAgeClass = computed(() => {
  if (ageDays.value <= 1) return 'age-fresh';
  if (ageDays.value <= 7) return 'age-normal';
  if (ageDays.value <= 14) return 'age-stale';
  return 'age-old';
});

// Danışman adından baş harf(ler)
const agentInitials = computed(() => {
  if (!props.agentName) return '?';
  return props.agentName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
});

async function openEdit() {
  draftNote.value = props.note;
  editing.value = true;
  await nextTick();
  textareaEl.value?.focus();
}

function cancelEdit() {
  editing.value = false;
  draftNote.value = props.note;
  if (props.initialEditOpen) emit('cancelled');
}

async function save() {
  if (saving.value) return;
  saving.value = true;
  try {
    if (props.itemType === 'portfolio') {
      await portfolioService.update(props.id, { note: draftNote.value });
    } else {
      await demandService.update(props.id, { note: draftNote.value });
    }
    editing.value = false;
    emit('saved', draftNote.value);
  } finally {
    saving.value = false;
  }
}

function fmtDate(d: string) {
  const days = ageDays.value;
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Dün';
  if (days < 7) return `${days} gün önce`;
  return new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
</script>

<template>
  <div class="note-card" :class="{ 'is-editing': editing }" @click.self="!editing && openEdit()">

    <!-- Sol kenar renk çizgisi (yaş göstergesi) -->
    <div class="age-stripe" :class="dateAgeClass" />

    <div class="card-inner" @click.self="!editing && openEdit()">
      <!-- Header: tip badge + tarih -->
      <div class="card-header">
        <span class="type-badge">{{ badge }}</span>
        <span class="meta-time" :class="dateAgeClass" :title="new Date(updatedAt).toLocaleString('tr-TR')">
          <span class="material-symbols-outlined age-icon">schedule</span>
          {{ fmtDate(updatedAt) }}
        </span>
      </div>

      <!-- Başlık -->
      <div class="card-title" @click="!editing && openEdit()">{{ title }}</div>

      <!-- Alt başlık (fiyat / bütçe) -->
      <div v-if="subtitle" class="card-subtitle">{{ subtitle }}</div>

      <!-- Danışman -->
      <div v-if="agentName" class="agent-row">
        <span class="agent-avatar">{{ agentInitials }}</span>
        <span class="agent-name">{{ agentName }}</span>
      </div>

      <!-- Ayraç -->
      <div class="card-divider" />

      <!-- Not alanı — okuma modu -->
      <div v-if="!editing" class="note-display" @click="openEdit">
        <span v-if="note" class="note-text">{{ note }}</span>
        <span v-else class="note-empty">Not ekle…</span>
        <span class="material-symbols-outlined edit-hint">edit</span>
      </div>

      <!-- Not alanı — düzenleme modu -->
      <div v-else class="note-editor">
        <textarea
          ref="textareaEl"
          v-model="draftNote"
          class="note-textarea"
          placeholder="Notunuzu yazın… (Ctrl+Enter ile kaydet)"
          rows="4"
          @keydown.esc="cancelEdit"
          @keydown.ctrl.enter.prevent="save"
          @keydown.meta.enter.prevent="save"
        />
        <div class="editor-actions">
          <span class="editor-hint">Ctrl+Enter ile kaydet</span>
          <button class="btn ghost" style="font-size:12px; padding:4px 10px" @click="cancelEdit">İptal</button>
          <button
            class="btn primary"
            style="font-size:12px; padding:4px 12px"
            :disabled="saving"
            @click="save"
          >
            {{ saving ? '…' : 'Kaydet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-card {
  min-width: 260px;
  max-width: 300px;
  flex-shrink: 0;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  display: flex;
  flex-direction: row;
  cursor: pointer;
  box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.04);
  transition: box-shadow 0.2s, transform 0.15s, border-color 0.15s;
  scroll-snap-align: start;
  overflow: hidden;
}

.note-card:hover {
  box-shadow: 0px 4px 14px rgba(0, 0, 0, 0.09);
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--outline-variant) 70%, var(--primary));
}

.note-card.is-editing {
  min-width: 300px;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent);
  transform: none;
  cursor: default;
}

/* Sol yaş çizgisi */
.age-stripe {
  width: 4px;
  flex-shrink: 0;
  border-radius: 0;
}

.age-stripe.age-fresh  { background: #4caf84; }
.age-stripe.age-normal { background: var(--outline-variant); }
.age-stripe.age-stale  { background: #e8a040; }
.age-stripe.age-old    { background: #d9534f; }

.card-inner {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.type-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 10%, transparent);
  border-radius: 4px;
  padding: 2px 7px;
  line-height: 18px;
  white-space: nowrap;
}

.meta-time {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
}

.age-icon {
  font-size: 12px;
  line-height: 1;
}

/* Tarih renkleri */
.meta-time.age-fresh  { color: #3a9e6e; }
.meta-time.age-normal { color: var(--on-surface-variant); }
.meta-time.age-stale  { color: #c07820; }
.meta-time.age-old    { color: #c0392b; }

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 1.3;
  cursor: pointer;
}

.card-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  letter-spacing: -0.01em;
}

/* Danışman satırı */
.agent-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.agent-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--primary) 18%, var(--surface-container));
  color: var(--primary);
  font-size: 9px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0;
}

.agent-name {
  font-size: 11px;
  color: var(--on-surface-variant);
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-divider {
  height: 1px;
  background: var(--outline-variant);
  margin: 0 -2px;
  opacity: 0.6;
}

/* Not alanı */
.note-display {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  cursor: pointer;
  min-height: 36px;
}

.note-text {
  font-size: 12.5px;
  color: var(--on-surface-variant);
  line-height: 1.7;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-empty {
  font-size: 12.5px;
  color: var(--outline);
  font-style: italic;
  flex: 1;
}

.edit-hint {
  font-size: 13px;
  color: var(--outline);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.1s;
  margin-top: 1px;
}

.note-card:hover .edit-hint {
  opacity: 1;
}

/* Düzenleme modu */
.note-textarea {
  width: 100%;
  resize: none;
  border: 1px solid var(--outline-variant);
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 12.5px;
  font-family: inherit;
  color: var(--on-surface);
  background: var(--surface-container-lowest);
  outline: none;
  line-height: 1.6;
}

.note-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 10%, transparent);
}

.editor-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  align-items: center;
}

.editor-hint {
  font-size: 10px;
  color: var(--outline);
  margin-right: auto;
}
</style>
