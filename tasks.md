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
- [ ] docs/ARCHITECTURE.md (geliştirici/mimari dokümantasyonu — dokümandan kod takibi)
- [ ] docs/ROADMAP.md (backlog: şifre sıfırlama, ödeme, e-posta, refresh token, CI, yedekleme...)
- [ ] CLAUDE.md + DEPLOYMENT.md güncellemeleri — **Commit 10**
- [ ] Release **v2.0.0**
