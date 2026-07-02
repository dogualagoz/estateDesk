// ESLint flat config (ESLint 9) — Vue 3 + TypeScript frontend.
// eslint-plugin-vue SFC'leri parse eder; <script lang="ts"> blokları için
// typescript-eslint parser'ı devreye girer. Prettier çakışmaları en sonda kapatılır.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Derleme çıktısı ve bağımlılıklar lint kapsamı dışında
    ignores: ['dist/**', 'node_modules/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        // .vue içindeki <script lang="ts"> için TS parser
        parser: tseslint.parser,
      },
    },
  },
  prettier,
  {
    rules: {
      // TypeScript projesinde tanımsız değişken kontrolünü derleyici yapar;
      // ESLint'in no-undef'i .vue script bloklarında (defineProps, window vb.)
      // yanlış pozitif üretir — typescript-eslint'in resmi önerisiyle kapalı
      'no-undef': 'off',
      // Mevcut kod tabanında yaygın; elle temizlik ayrı iş — şimdilik uyarı
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Tek kelimelik view/component adları (ör. AppShell zaten uyumlu) — mevcut adlandırmayı kırmamak için uyarı
      'vue/multi-word-component-names': 'warn',
      // Prettier biçimlendirmeyi üstlendiği için şablon girinti/satır kuralları kapalı (eslint-config-prettier hallediyor)
    },
  },
);
