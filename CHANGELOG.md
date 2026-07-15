# Changelog

## v2.1.0 (2026-07-15)

Şifre sıfırlama, ofis geri bildirim mesajlaşması, harici portföy başvuru linki ve portföy yönetiminde kapsamlı UX iyileştirmesi.

### ✨ Yeni Özellikler

- **Şifre Sıfırlama** ([8c88ab8](https://github.com/dogualagoz/estateDesk/commit/8c88ab8)) — SMTP e-posta servisiyle uçtan uca şifre sıfırlama akışı; giriş sayfasıyla uyumlu tasarım ([32ec27a](https://github.com/dogualagoz/estateDesk/commit/32ec27a))
- **Ofis Geri Bildirim Mesajlaşması (beta)** ([0be12f6](https://github.com/dogualagoz/estateDesk/commit/0be12f6)) — ofis ile platform sahibi arasında iki yönlü sohbet, okunmadı sayacı, e-posta bildirimi
- **Harici Portföy Başvuru Linki** ([133128a](https://github.com/dogualagoz/estateDesk/commit/133128a)) — mülk sahiplerine gönderilebilen link üzerinden başvuru toplama, danışman onay/red akışı
- **Mal Sahibi Adı Görünürlüğü + Satış Sonrası Paylaşım** ([57a65a6](https://github.com/dogualagoz/estateDesk/commit/57a65a6)) — mal sahibi adı varsayılan olarak yalnızca ekleyen danışmana görünür; portföyün satış sonrası diğer ofislerle paylaşılabilirliği ayrı bir alan
- **Portföy Satır İçi Düzenleme + UX İyileştirmesi** ([64dd685](https://github.com/dogualagoz/estateDesk/commit/64dd685)) — detay sayfasında "Düzenle" artık sayfa değiştirmeden aynı yerde açılıyor; ekleme formu ve liste kartları yeniden tasarlandı
- **Portföy Başvuruları Link Arayüzü** ([3fd9cbd](https://github.com/dogualagoz/estateDesk/commit/3fd9cbd)) — uygulamadaki diğer paylaşım linki arayüzleriyle tutarlı, Notion tarzı link kutusu

### 🐛 Düzeltmeler

- **forgot-password Transform importu** ([a7b3845](https://github.com/dogualagoz/estateDesk/commit/a7b3845)) — `Transform` decorator'ı yanlış paketten import ediliyordu; `EmailModule` wiring eksikti

## v2.0.0 (2026-07-03)

EstateDesk'in profesyonel SaaS sürümü.
Güvenlik sertleştirmesi, modüler refactor, süper admin paneli, denetim/loglama, SEO paketi ve kapsamlı dokümantasyon ile.

### ✨ Yeni Özellikler

- **Güvenlik Sertleştirmesi** ([Commit 2](https://github.com/dogualagoz/estateDesk/commit/da4059a))
  - Timing-safe login (dummy bcrypt compare, e-posta enumeration koruması)
  - Güvenli token üretimi (`generateSecureToken()`, 32 bayt base64url)
  - nginx rate limiting (20 istek/sn, burst 40, 429 yanıt)
  - Güvenlik başlıkları (Strict-Transport-Security, X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, CSP)
  - Non-root backend container
  - npm audit güncellemeleri (babel vb.)

- **Modüler Refactoring** ([Commit 3-5](https://github.com/dogualagoz/estateDesk/commit/480d45a))
  - `InviteService` ayrıştırma (office.service 569 → 260 satır)
  - Frontend composable'ları (`useAsync`, `useCurrencyInput`, `LocationSelect`)
  - Form view'ları bölme (DemandFormView 874 → 335, PortfolioFormView 802 → 196, OfficeView 713 → 139)
  - Trigram GIN indeksleri (arama performansı 10x)

- **Süper Admin Paneli + Analytics** ([Commit 6-8](https://github.com/dogualagoz/estateDesk/commit/796bbe0))
  - Backend: SUPERADMIN rolü, cross-tenant kullanıcı/ofis CRUD, analytics (DAU/WAU/MAU, timeseries), log inceleme
  - Frontend: `/yonetim` izole panel (kendi layout, route'ları, tipleri); Chart.js lazy loading
  - Guard'lar: superAdminOnly, onboarding muafiyeti, panel yönlendirmesi

- **Denetim Kaydı ve İstek Loglama** ([Commit 6-7](https://github.com/dogualagoz/estateDesk/commit/3179ba0))
  - `AuditLog`: iş olayları (login, register, davet, rol değişikliği…) — 365 gün saklama
  - `RequestLog`: istek metriksleri (method, path, duration, statusCode) — 30 gün saklama
  - Buffered yazım (5 sn / 50 kayıt)
  - Retention cron (nightly cleanup @04:00)
  - Fire-and-forget pattern (audit hatası asıl işlemi bozamaz)

- **SEO Paketi ve Favicon Seti** ([Commit 9](https://github.com/dogualagoz/estateDesk/commit/9a06d3b))
  - İkon üretimi: favicon.ico (16/32/48), apple-touch-icon (180), icon-192/512, og-cover (1200×630)
  - Meta paketi: description, canonical, OG (tr_TR), Twitter card, JSON-LD (SoftwareApplication + Organization)
  - robots.txt + sitemap.xml + site.webmanifest
  - Dinamik sekme başlığı (route bazlı)

- **Kapsamlı Dokümantasyon** ([Commit 10](https://github.com/dogualagoz/estateDesk/commit/9d3d258))
  - ARCHITECTURE.md: 12 bölüm, mimari diyagramları, modül rehberi, veri modeli, konvansiyonlar, yeni domain checklist
  - ROADMAP.md: v2.0.0 sonrası özellikleri (şifre sıfırlama, e-posta, 2FA, CSP, test genişlemesi, CI/CD, monitoring…)
  - CLAUDE.md: güncellenmiş kural, pattern'ler, env'ler

### 🛠️ Teknik Geliştirmeler

- NestJS 10 + Prisma 5 modüler monolit (13 modül, 43 birim test)
- Vue 3 Vite dev server (hot reload, ~15 KB gzip ana bundle)
- PostgreSQL 16 (GIN indeksleri, IMMUTABLE sarmalayıcılar)
- Docker Compose (dev + prod, healthcheck'ler)
- nginx reverse proxy (prod, rate limit, güvenlik başlıkları)
- ESLint 9 flat config + Prettier (backend + frontend)
- Türkçe tam karakter desteği ve yorum satırları

### 📊 Versiyon

**Node:** 22+ | **PostgreSQL:** 16+ | **Docker:** 24+

### 📝 Not

- Üretim deploy'ından önce `SEED_SUPERADMIN_EMAIL/PASSWORD` env'lerini ayarla
- Log saklama süreleri `REQUEST_LOG_RETENTION_DAYS` / `AUDIT_LOG_RETENTION_DAYS` ile ezilir
- `/yonetim` paneli gizli path; ileride `admin.emlakdefter.com` subdomain'e taşınabilir
- Davet ve share token'ları tahmin edilemez (32 bayt, base64url)

### 🔗 Referanslar

- Daha fazla: docs/ARCHITECTURE.md, docs/ROADMAP.md, docs/eslestirme-motoru.md
- CI/CD: docs/ROADMAP.md → GitHub Actions
- Monitoring: docs/ROADMAP.md → Sentry/GlitchTip
