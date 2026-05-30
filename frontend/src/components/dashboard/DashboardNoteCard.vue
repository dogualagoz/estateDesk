<script setup lang="ts">
import { ref, nextTick, onMounted } from 'vue';
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
  const date = new Date(d);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Bugün';
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
}
</script>

<template>
  <div class="note-card" :class="{ 'is-editing': editing }" @click.self="!editing && openEdit()">
    <div class="card-header">
      <span class="tag primary" style="font-size:11px; padding: 2px 8px;">{{ badge }}</span>
      <span class="meta-time">{{ fmtDate(updatedAt) }}</span>
    </div>

    <div class="card-title">{{ title }}</div>
    <div v-if="subtitle" class="card-subtitle">{{ subtitle }}</div>

    <!-- Read mode -->
    <div v-if="!editing" class="note-display" @click="openEdit">
      <span v-if="note" class="note-text">{{ note }}</span>
      <span v-else class="note-empty">Not ekle…</span>
      <span class="material-symbols-outlined edit-hint">edit</span>
    </div>

    <!-- Edit mode -->
    <div v-else class="note-editor">
      <textarea
        ref="textareaEl"
        v-model="draftNote"
        class="note-textarea"
        placeholder="Notunuzu yazın… (Ctrl+Enter ile kaydet)"
        rows="3"
        @keydown.esc="cancelEdit"
        @keydown.ctrl.enter.prevent="save"
        @keydown.meta.enter.prevent="save"
      />
      <div class="editor-actions">
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
</template>

<style scoped>
.note-card {
  min-width: 280px;
  max-width: 320px;
  flex-shrink: 0;
  background: var(--surface-container-lowest);
  border: 1px solid var(--outline-variant);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.03);
  transition: box-shadow 0.2s, transform 0.15s;
  scroll-snap-align: start;
}

.note-card:hover {
  box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.07);
  transform: translateY(-1px);
}

.note-card.is-editing {
  min-width: 300px;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 15%, transparent);
  transform: none;
  cursor: default;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-time {
  font-size: 11px;
  color: var(--on-surface-variant);
  font-weight: 500;
  letter-spacing: 0.02em;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--on-surface);
  line-height: 1.35;
}

.card-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary);
}

.note-display {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin-top: 2px;
  cursor: pointer;
}

.note-text {
  font-size: 13px;
  color: var(--on-surface-variant);
  line-height: 1.65;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-empty {
  font-size: 13px;
  color: var(--outline-variant);
  font-style: italic;
  flex: 1;
}

.edit-hint {
  font-size: 13px;
  color: var(--outline);
  opacity: 0;
  flex-shrink: 0;
  transition: opacity 0.1s;
}

.note-card:hover .edit-hint {
  opacity: 1;
}

.note-textarea {
  width: 100%;
  resize: none;
  border: 1px solid var(--outline-variant);
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  font-family: inherit;
  color: var(--on-surface);
  background: var(--surface-container-lowest);
  outline: none;
  line-height: 1.5;
}

.note-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary) 10%, transparent);
}

.editor-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
</style>
