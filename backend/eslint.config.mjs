// ESLint flat config (ESLint 9) — NestJS backend.
// Kural seti: JS + TypeScript önerilen kurallar; Prettier ile çakışan
// biçimlendirme kuralları en sonda devre dışı bırakılır.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    // Derleme çıktısı ve üretilen dosyalar lint kapsamı dışında
    ignores: ['dist/**', 'node_modules/**', 'coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      // Mevcut kod tabanında yaygın; elle temizlik ayrı iş — şimdilik uyarı
      '@typescript-eslint/no-explicit-any': 'warn',
      // NestJS DI deseninde boş constructor'lar normaldir
      '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
      // Kullanılmayan değişken hatası; _ öneki bilinçli görmezden gelme demek
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
