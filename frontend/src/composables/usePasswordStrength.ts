import { computed, unref, type Ref } from 'vue';

// backend/src/common/validators/strong-password.validator.ts ile birebir eşleşmeli
const MIN_LENGTH = 8;

export function usePasswordStrength(password: Ref<string> | string | (() => string)) {
  const value = computed(() => (typeof password === 'function' ? password() : unref(password)) ?? '');

  const hasMinLength = computed(() => value.value.length >= MIN_LENGTH);
  const hasUppercase = computed(() => /[A-Z]/.test(value.value));
  const hasDigit = computed(() => /\d/.test(value.value));
  const isValid = computed(() => hasMinLength.value && hasUppercase.value && hasDigit.value);

  return { hasMinLength, hasUppercase, hasDigit, isValid };
}
