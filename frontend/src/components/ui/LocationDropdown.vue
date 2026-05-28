<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';

interface GroupedOptions {
  group: string;
  items: string[];
}

const props = withDefaults(
  defineProps<{
    modelValue: string | string[];
    options?: string[];
    groupedOptions?: GroupedOptions[];
    multi?: boolean;
    placeholder?: string;
    disabled?: boolean;
    label?: string;
  }>(),
  {
    options: () => [],
    groupedOptions: undefined,
    multi: false,
    placeholder: 'Seçin...',
    disabled: false,
    label: undefined,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | string[]];
}>();

const open = ref(false);
const query = ref('');
const containerRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);

const selectedValues = computed<string[]>(() =>
  props.multi
    ? (props.modelValue as string[])
    : props.modelValue
    ? [props.modelValue as string]
    : [],
);

// Arama sonuçları
const flatOptions = computed<string[]>(() => {
  if (props.groupedOptions) {
    return props.groupedOptions.flatMap((g) => g.items);
  }
  return props.options;
});

const filteredFlat = computed<string[]>(() => {
  const q = query.value.toLowerCase().trim();
  if (!q) return flatOptions.value;
  return flatOptions.value.filter((o) => o.toLowerCase().includes(q));
});

const filteredGrouped = computed<GroupedOptions[]>(() => {
  if (!props.groupedOptions) return [];
  const q = query.value.toLowerCase().trim();
  return props.groupedOptions
    .map((g) => ({
      group: g.group,
      items: q ? g.items.filter((i) => i.toLowerCase().includes(q)) : g.items,
    }))
    .filter((g) => g.items.length > 0);
});

const hasResults = computed(() =>
  props.groupedOptions ? filteredGrouped.value.length > 0 : filteredFlat.value.length > 0,
);

// Görüntülenecek metin (single mode)
const displayText = computed(() => {
  if (props.multi) return '';
  return (props.modelValue as string) || '';
});

function openDropdown() {
  if (props.disabled) return;
  open.value = true;
  query.value = '';
  nextTick(() => inputRef.value?.focus());
}

function closeDropdown() {
  open.value = false;
  query.value = '';
}

function select(val: string) {
  if (props.multi) {
    const arr = [...(props.modelValue as string[])];
    const idx = arr.indexOf(val);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(val);
    emit('update:modelValue', arr);
  } else {
    emit('update:modelValue', val);
    closeDropdown();
  }
}

function remove(val: string) {
  if (!props.multi) return;
  const arr = (props.modelValue as string[]).filter((v) => v !== val);
  emit('update:modelValue', arr);
}

function clearSingle() {
  emit('update:modelValue', '');
}

function handleClickOutside(e: MouseEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    closeDropdown();
  }
}

onMounted(() => document.addEventListener('mousedown', handleClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', handleClickOutside));
</script>

<template>
  <div ref="containerRef" class="relative w-full">
    <!-- Trigger alanı -->
    <div
      class="input min-h-[40px] flex flex-wrap items-center gap-1.5 cursor-pointer py-1.5 px-3"
      :class="[disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/60', open ? 'border-primary ring-1 ring-primary/20' : '']"
      @click="openDropdown"
    >
      <!-- Multi: chips -->
      <template v-if="multi">
        <span
          v-for="val in selectedValues"
          :key="val"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-fixed/60 text-on-surface text-label-sm font-medium"
        >
          {{ val }}
          <button
            type="button"
            class="text-on-surface-variant hover:text-error ml-0.5"
            @click.stop="remove(val)"
          >
            <span class="material-symbols-outlined text-[14px]">close</span>
          </button>
        </span>
        <span v-if="!selectedValues.length" class="text-on-surface-variant/50 text-label-sm select-none">
          {{ placeholder }}
        </span>
      </template>

      <!-- Single: metin veya placeholder -->
      <template v-else>
        <span
          v-if="displayText"
          class="flex-1 text-label-md text-on-surface truncate"
        >{{ displayText }}</span>
        <span v-else class="flex-1 text-on-surface-variant/50 text-label-sm select-none">{{ placeholder }}</span>
        <button
          v-if="displayText"
          type="button"
          class="text-on-surface-variant hover:text-error ml-1"
          @click.stop="clearSingle"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </template>

      <!-- Ok ikonu -->
      <span
        v-if="!displayText || multi"
        class="material-symbols-outlined text-[18px] text-on-surface-variant ml-auto transition-transform duration-150"
        :class="open ? 'rotate-180' : ''"
      >expand_more</span>
    </div>

    <!-- Dropdown panel -->
    <Transition
      enter-active-class="transition-all duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-[-4px] scale-[0.98]"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition-all duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0 scale-100"
      leave-to-class="opacity-0 translate-y-[-4px] scale-[0.98]"
    >
      <div
        v-if="open"
        class="absolute z-50 mt-1 w-full bg-surface border border-outline-variant rounded-xl shadow-lg overflow-hidden"
      >
        <!-- Arama kutusu -->
        <div class="px-3 pt-3 pb-2 border-b border-outline-variant">
          <div class="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-surface-container border border-outline-variant">
            <span class="material-symbols-outlined text-[16px] text-on-surface-variant">search</span>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              class="flex-1 bg-transparent text-label-md text-on-surface outline-none placeholder:text-on-surface-variant/50"
              placeholder="Ara..."
              @click.stop
            />
          </div>
        </div>

        <!-- Seçenekler listesi -->
        <div class="overflow-y-auto max-h-52 py-1.5">
          <!-- Gruplu -->
          <template v-if="groupedOptions">
            <template v-if="hasResults">
              <template v-for="group in filteredGrouped" :key="group.group">
                <p class="px-3 pt-2 pb-1 text-label-xs font-semibold uppercase tracking-widest text-on-surface-variant/60">
                  {{ group.group }}
                </p>
                <button
                  v-for="item in group.items"
                  :key="item"
                  type="button"
                  class="w-full text-left px-4 py-1.5 text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center justify-between"
                  :class="selectedValues.includes(item) ? 'bg-primary-fixed/40' : ''"
                  @click.stop="select(item)"
                >
                  {{ item }}
                  <span
                    v-if="selectedValues.includes(item)"
                    class="material-symbols-outlined text-[16px] text-primary"
                  >check</span>
                </button>
              </template>
            </template>
            <p v-else class="px-3 py-3 text-label-sm text-on-surface-variant/60 italic text-center">
              Sonuç bulunamadı
            </p>
          </template>

          <!-- Düz liste -->
          <template v-else>
            <template v-if="hasResults">
              <button
                v-for="opt in filteredFlat"
                :key="opt"
                type="button"
                class="w-full text-left px-4 py-1.5 text-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center justify-between"
                :class="selectedValues.includes(opt) ? 'bg-primary-fixed/40' : ''"
                @click.stop="select(opt)"
              >
                {{ opt }}
                <span
                  v-if="selectedValues.includes(opt)"
                  class="material-symbols-outlined text-[16px] text-primary"
                >check</span>
              </button>
            </template>
            <p v-else class="px-3 py-3 text-label-sm text-on-surface-variant/60 italic text-center">
              Sonuç bulunamadı
            </p>
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>
