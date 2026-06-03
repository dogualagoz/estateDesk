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
  if (props.initialEditOpen) nextTick(() => textareaEl.value?.focus());
});

const ageDays = computed(() => {
  const diffMs = Date.now() - new Date(props.updatedAt).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
});

const dateAgeClass = computed(() => {
  if (ageDays.value <= 1) return 'age-fresh';
  if (ageDays.value <= 7) return 'age-normal';
  if (ageDays.value <= 14) return 'age-stale';
  return 'age-old';
});

async function openEdit() {
  if (editing.value) return;
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
  <div class="note-row" :class="[{ 'is-editing': editing }, dateAgeClass]" @click="openEdit">
    <!-- Yaş noktası -->
    <span class="age-dot" :class="dateAgeClass" :title="`Son güncelleme: ${fmtDate(updatedAt)}`" />

    <div class="row-body">
      <!-- Üst satır: başlık + meta -->
      <div class="row-head">
        <span class="row-title">{{ title }}</span>
        <span v-if="subtitle" class="row-sub">· {{ subtitle }}</span>
        <span class="row-date" :class="dateAgeClass">{{ fmtDate(updatedAt) }}</span>
      </div>

      <!-- Not — okuma modu -->
      <Transition name="editor" mode="out-in">
        <p v-if="!editing" class="row-note" :class="{ 'is-empty': !note }">
          {{ note || 'Not ekle…' }}
        </p>

        <!-- Not — düzenleme modu -->
        <div v-else class="row-editor" @click.stop>
          <textarea
            ref="textareaEl"
            v-model="draftNote"
            class="row-textarea"
            placeholder="Notunuzu yazın…"
            rows="3"
            @keydown.esc="cancelEdit"
            @keydown.ctrl.enter.prevent="save"
            @keydown.meta.enter.prevent="save"
          />
          <div class="editor-actions">
            <span class="editor-hint">
              <kbd>Ctrl</kbd><kbd>↵</kbd> kaydet
            </span>
            <button class="ed-btn ghost" @click="cancelEdit">İptal</button>
            <button class="ed-btn primary" :disabled="saving" @click="save">
              <span v-if="saving" class="material-symbols-outlined spin">progress_activity</span>
              <template v-else>
                <span class="material-symbols-outlined">check</span>
                Kaydet
              </template>
            </button>
          </div>
        </div>
      </Transition>

      <!-- Alt: danışman -->
      <div v-if="!editing && agentName" class="row-foot">
        <span class="material-symbols-outlined foot-icon">person</span>
        {{ agentName }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-row {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 11px 12px 11px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}

.note-row:hover,
.note-row:active {
  background: #f4f4f2;
}

.note-row.is-editing {
  background: #f4f4f2;
  cursor: default;
}

/* Yaş noktası */
.age-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.age-dot.age-fresh  { background: #4caf84; }
.age-dot.age-normal { background: #c3c8c0; }
.age-dot.age-stale  { background: #e8a040; }
.age-dot.age-old    { background: #d9534f; }

.row-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.row-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.row-title {
  font-size: 13.5px;
  font-weight: 600;
  color: #1a1c1b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.row-sub {
  font-size: 12px;
  font-weight: 600;
  color: #4e604f;
  white-space: nowrap;
  flex-shrink: 0;
}

.row-date {
  margin-left: auto;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
}

.row-date.age-fresh  { color: #3a9e6e; }
.row-date.age-normal { color: #747872; }
.row-date.age-stale  { color: #c07820; }
.row-date.age-old    { color: #c0392b; }

.row-note {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: #434842;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row-note.is-empty {
  color: #a0a49d;
  font-style: italic;
}

.row-foot {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: #747872;
  font-weight: 500;
}

.foot-icon {
  font-size: 13px;
}

/* Edit */
.row-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.row-textarea {
  width: 100%;
  resize: vertical;
  border: 1.5px solid #4e604f;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1c1b;
  background: #ffffff;
  outline: none;
  line-height: 1.6;
  box-shadow: 0 0 0 3px rgba(78, 96, 79, 0.1);
  transition: box-shadow 0.15s;
}

.row-textarea:focus {
  box-shadow: 0 0 0 3px rgba(78, 96, 79, 0.18);
}

.editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editor-hint {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #747872;
  margin-right: auto;
}

.editor-hint kbd {
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  background: #eeeeec;
  border: 1px solid #c3c8c0;
  border-radius: 4px;
  padding: 1px 5px;
  line-height: 1.4;
  color: #434842;
}

.ed-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  padding: 6px 14px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.12s, box-shadow 0.12s;
}

.ed-btn .material-symbols-outlined { font-size: 15px; }

.ed-btn.ghost {
  background: transparent;
  color: #434842;
  border-color: #c3c8c0;
}

.ed-btn.ghost:hover { background: #eeeeec; }

.ed-btn.primary {
  background: #4e604f;
  color: #ffffff;
}

.ed-btn.primary:hover {
  background: #3d4e3e;
  box-shadow: 0 2px 8px rgba(78, 96, 79, 0.3);
}

.ed-btn.primary:disabled { opacity: 0.6; cursor: default; }

.spin {
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── Editör geçiş animasyonu ── */
.editor-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0, 0, 1);
}

.editor-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.editor-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}

.editor-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
