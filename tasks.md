# EstateDesk v2.0.0 Yol Haritası — Görev Takibi

Plan: refactor + güvenlik + süper admin paneli + SEO. Her faz sonu = commit noktası.
Detaylı plan: `~/.claude/plans/plan-senle-imdi-genel-wise-liskov.md`

## FAZ 0 — Lint/Format Altyapısı
- [x] Backend ESLint (flat config) + lint script
- [x] Frontend ESLint (eslint-plugin-vue) + lint script
- [x] Kökte .prettierrc.json + .prettierignore
- [x] `--fix` ilk geçiş, build + test yeşil (backend 42 test ✓)
- [x] **Commit 1** (`f1147e9`)

## FAZ 1 — Güvenlik Sertleştirme
- [x] `token.util.ts` (crypto.randomBytes) — migration gerekmedi: `@default(cuid())` client-side'mış, DB'de default yok
- [x] Login dummy bcrypt compare (timing enumeration koruması) + yeni test
- [x] `BCRYPT_ROUNDS` konstantı (auth/users/office/seed)
- [x] nginx güvenlik başlıkları + limit_req (20r/s, burst 40, 429) — prod stack'te doğrulandı
- [x] Prod compose healthcheck'ler + non-root backend Dockerfile (whoami → node)
- [x] npm audit: backend babel fix'lendi; kalan 13 moderate = NestJS 11 major (ROADMAP), frontend esbuild = Vite 8 major, dev-only (ROADMAP)
- [x] **Commit 2** (`da4059a`)

## FAZ 2 — Hedefli Refactor
- [x] InviteService ayrıştırma (office.service 569 → ~260 satır; spec de taşındı) — **Commit 3**
- [x] useAsync + useCurrencyInput + LocationSelect ortak altyapısı
- [x] DemandFormView bölme (874 → 335) + useDemandMatching composable
- [x] PortfolioFormView bölme (802 → 196) + usePortfolioImages composable
- [x] OfficeView bölme (713 → 139; 3 alt bileşen)
- [x] Bonus bug fix: edit modunda ilçe/mahalle seçimlerinin silinmesi (kaskad watcher) giderildi — **Commit 4**
- [x] Search trigram indeksi (f_unaccent/f_array_to_string IMMUTABLE sarmalayıcılar + 2 GIN indeks; EXPLAIN ile Bitmap Index Scan doğrulandı)
- [x] Türkçe yorum eşitleme (portfolio/demand/demand-match/dashboard servisleri) + logo1.svg temizliği — **Commit 5**

## FAZ 3 — Süper Admin Paneli + Analytics
- [x] Prisma: SUPERADMIN rolü + AuditLog + RequestLog + retention cron (04:00, env ile ayarlanabilir)
- [x] `audit` modülü (fire-and-forget log + 5sn/50 kayıt buffered request writer) + auth/office/invite/users kancaları + POST /auth/logout — canlıda doğrulandı — **Commit 6**
- [x] `admin` backend modülü: overview/users CRUD/offices/logs (istek+audit filtreli)/analytics (DAU-WAU-MAU, timeseries)/system + seedSuperAdmin — canlıda doğrulandı (ADMIN→403, cross-office liste, timeseries) — **Commit 7**
- [x] Frontend `/yonetim` paneli: izole src/admin/ (README sözleşmesi), AdminLayout + 7 view, Chart.js lazy (ayrı chunk), router guard'ları (superAdminOnly, onboarding muafiyeti) — **Commit 8**
  - Lokal test: `owner@estatedesk.local` / `Owner1234` ile giriş → /yonetim

## FAZ 4 — Favicon + SEO
- [x] İkon seti üretimi: `scripts/generate-icons.mjs` (sharp + png-to-ico, backend node_modules'ten) → favicon.ico (16/32/48), apple-touch-icon (180), icon-192/512, og-cover (1200×630, logo+slogan); atıl favicon.svg silindi
- [x] index.html meta paketi (description, canonical, OG tr_TR, Twitter card, JSON-LD SoftwareApplication+Organization, theme-color #4e604f)
- [x] robots.txt (uygulama içi path'ler disallow; /yonetim bilinçli olarak YAZILMADI) + sitemap.xml (/, /login, /register) + site.webmanifest
- [x] Route bazlı dinamik title (`meta.title` + afterEach; RouteMeta tip tanımı) — dev server'da tüm statik dosyalar 200 doğrulandı — **Commit 9**

## FAZ 5 — Dokümantasyon + Sürüm
- [x] docs/ARCHITECTURE.md (12 bölüm: genel bakış, mimari, modüller, veri modeli, eşleştirme, loglama, admin, frontend, konvansiyonlar, checklist, monolith neden) — **Commit 10**
- [x] docs/ROADMAP.md (5 kategori: güvenlik, ürün, teknik borç, altyapı, OPS; sembollerle öncelik) — **Commit 10**
- [x] CLAUDE.md güncellemeleri (admin/audit modülleri, lint, fire-and-forget, tenant isolation, admin izolasyon, env'ler, kurallar) — **Commit 10**
- [x] DEPLOYMENT.md yerel güncellemeleri (gitignore'da, VPS spesifik)
- [x] Release **v2.0.0** (tag + CHANGELOG) — **Commit 11** + tag v2.0.0

## FAZ 6 — Şifre Sıfırlama + E-posta Servisi
- [x] Prisma: PasswordReset modeli + migration (token, status, expiresAt, usedAt)
- [x] Nodemailer + EmailService (SMTP kurulumu, sendPasswordResetEmail template)
- [x] AuthService: requestPasswordReset(), validateResetToken(), resetPassword()
- [x] AuthController: 3 endpoint (POST /auth/forgot-password, GET/POST /auth/reset-password/:token)
- [x] DTO'lar: ForgotPasswordDto, ResetPasswordDto (@IsStrongPassword() reuse)
- [x] Audit actions: AUTH_PASSWORD_RESET_REQUESTED, AUTH_PASSWORD_RESET
- [x] Frontend AuthService: 3 metod (forgotPassword, validateResetToken, resetPassword)
- [x] Frontend ForgotPasswordView.vue + ResetPasswordView.vue
- [x] Router: 2 route (/forgot-password, /reset-password/:token)
- [x] LoginView: "Şifremi unuttum?" linki
- [x] .env.example: SMTP_HOST, PORT, USER, PASSWORD, FROM — **Commit 12**

**Sıradaki:** E-posta servisi testleri + Docker migration test + Plesk SMTP bilgileri. E-posta gönderimi hala dev'de mock; production'da real SMTP credential'ları `.env`'e girilecek.
