# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

-Senior bir full-stack geliştirici gibi düşüneceksin

## Projeye Genel Bakış

EstateDesk, Türk emlak ofisleri için dahili bir portföy ve talep yönetim aracıdır. Stack: NestJS + Vue 3 + PostgreSQL + Prisma; Docker Compose ile konteynerize edilmiştir.

Temel amaç: portföyler ile müşteri talepleri arasında çift yönlü, ağırlıklı eşleştirme yaparak unutulan fırsatları ortadan kaldırmak.

## Geliştirme Komutları

### Docker ile (birincil iş akışı)

```bash
# Tüm servisleri hot reload ile başlat
docker compose up --build

# İlk kurulumda
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run seed

# Yeni migration
docker compose exec backend npx prisma migrate dev --name <migration_adi>

# Prisma Studio (port 5555)
docker compose exec backend npx prisma studio
```

Servisler: API → `http://localhost:3001`, Web → `http://localhost:5173`, DB → `localhost:5432`.
Varsayılan admin: `backend/.env` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

### Docker olmadan

```bash
cd backend && npm install && npm run start:dev
cd frontend && npm install && npm run dev
```

Diğer script'ler için `backend/package.json` ve `frontend/package.json` scripts bölümüne bakın.

## Mimari

### Backend (NestJS, `backend/src/`)

Standart NestJS modül yapısı. Her domain kendi klasöründe `module`, `controller`, `service`, `dto/` barındırır.

**Modüller:**
- `admin` — Süper admin API'si (`@Roles(Role.SUPERADMIN)`): kullanıcı/ofis CRUD, cross-tenant analytics, logs inceleme, sistem sağlığı
- `audit` — Denetim kaydı (`@Global`): `AuditService` (fire-and-forget log), `RequestLogWriterService` (buffered DB yazım), `LogRetentionService` (nightly cron cleanup)
- `auth` — JWT login/register/demo; 12 saatlik token, `ed_token` localStorage anahtarı; timing-safe dummy bcrypt compare
- `users` — profil, ofis kapsamlı kullanıcı listesi
- `portfolio` — mülk ilanları (soft delete, WebP görsel yükleme)
- `demand` — alıcı talepleri (soft delete, çok lokasyonlu)
- `matching` — ağırlıklı eşleştirme motoru (sert filtre + skorlama, saflık korunuyor)
- `office` — ofis CRUD + `InviteService` (davet yaşam döngüsü, `generateSecureToken()` ile token üretimi)
- `search` — global arama (trigram GIN indeksli, `f_unaccent` sarmalayıcıları ile)
- `demand-match` — eşleştirme pin/kayıt tablosu
- `demand-share` — token'lı public "defter" paylaşımı (`GET /shared/:token` `@Public()`)
- `dashboard` — özet istatistikler
- `health` — `GET /health` (`@Public()`, `@SkipThrottle()`); DB bağlantısını kontrol eder, Docker healthcheck'ler buna bağlı

**Global guard'lar** (`app.module.ts`, sırayla):
- `ThrottlerGuard` — rate limiting (genel 100 istek/dk; auth'ta `@Throttle(10, 60)`)
- `JwtAuthGuard` — tüm route'lara uygulanır; `@Public()` ile devre dışı bırakılır; kullanıcı **her istekte** DB'den taze okunur (rol/deaktivasyon değişiklikleri anında etki eder)
- `RolesGuard` — `@Roles(Role.ADMIN)` veya `@Roles(Role.SUPERADMIN)` kontrol eder
- `DemoReadOnlyGuard` — demo oturumları (`isDemo`) yazma işlemlerini engeller; `@DemoSafe()` muaf tutulur

**Rol'ler:** `ADMIN` (ofis yetkili), `AGENT` (normal kullanıcı), `SUPERADMIN` (platform sahibi — `/admin/*` ve `/yonetim` paneli erişimi)

**Middleware** (`common/middleware/`, `main.ts` / `app.module.ts`):
- `requestIdMiddleware` — `main.ts`'te `app.use()` ile en erken çalışır; gelen `x-request-id` header'ını kullanır ya da üretir, response header'ına ekler
- `RequestLoggerMiddleware` — `AppModule.configure()` ile tüm route'lara bağlanır; `res.on('finish')` içinde `{requestId, method, path, statusCode, durationMs, userId, officeId}` JSON log satırı üretir
- `compression()` — `main.ts`'te helmet'ten sonra uygulanır
- `HttpExceptionFilter` hata yanıtlarına ve loglarına `requestId` dahil eder

**Veri desenleri:**
- **Soft delete:** `deletedAt` set edilir; tüm sorgularda `deletedAt: null` filtresi korunmalı
- **Ofis izolasyonu (kritik):** Her `Portfolio`, `Demand`, `Invite` kaydı `officeId` içerir. Servis metodu ilk satırında `requireOfficeId(user)` çağrısı zorunlu; bu filtre unutmak en tehlikeli güvenlik açığıdır
- **Denetim kaydı (fire-and-forget):** `AuditService.log()` anlamlı iş olaylarını asenkron yazması gerekir — `await`lenmemelidir, başarısız log asıl işlemi bozmamalı; bkz. `src/audit/`
- **İstek tanımlama:** Her HTTP isteği `requestIdMiddleware`'da `x-request-id` header'ı alır/üretir; bu ID AuditLog/RequestLog'da korunur (sorun takibi için)
- **Güvenli token'lar:** `generateSecureToken()` (`common/token.util.ts`) davet/share token'ları için — `crypto.randomBytes(32).toString('base64url')` (tahmin edilemez, 43 karakter)
- **JWT payload:** `sub`, `email`, `role`; minimal ve stateless. Kullanıcı her istekte `jwt.strategy.validate()` → `UsersService.findOne()` ile taze okunur
- **Şifre hashing:** `BCRYPT_ROUNDS = 10` (`common/security.constants.ts`); login başarısız olsa bile DUMMY_PASSWORD_HASH ile comparison yapılır (timing enumeration koruması)
- **Görsel yükleme:** `POST /portfolio/:id/images` → `multer` → `sharp` ile WebP + sıkıştırma → `uploadsDir()` (varsayılan `<cwd>/uploads`)
- **Metin araması:** liste filtreleri Prisma `contains` (insensitive); global arama parametrize raw SQL + `f_unaccent` sarmalayıcı ile trigram GIN indeksini kullanır

### Multi-tenant Ofis Yapısı

```
Office → User (owner + members)
       → Portfolio (officeId)
       → Demand (officeId)
       → Invite (token bazlı davet linki)
```

Davet akışı: `POST /office/invites` → token üret → `GET /invites/:token` preview → `POST /invites/:token/accept` (yeni kullanıcı kayıt + ofise katıl).

### Eşleştirme Motoru (`backend/src/matching/`)

İki katmanlı: sert filtre (DB sorgusu) + ağırlıklı skorlama (bellek).

- `matching.constants.ts` — ağırlıklar, toleranslar, `LOCATION_MAX_KM = 30`
- `matching.scoring.ts` — `haversineKm()`, koordinat bazlı konum puanı (decay, fallback 0.35), budget/room/area/feature skor fonksiyonları
- `matching.service.ts` — `POST /matching/portfolios` endpoint'i; ofis filtresi zorunlu
- Koordinat verisi: `tr-district-coords.ts` (375 ilçe, Nominatim'den)
- Jest testleri: `matching.scoring.spec.ts` (18/18 test)

### Frontend (Vue 3, `frontend/src/`)

- **`services/api.ts`** — tekil Axios instance; JWT ekler, 401'de `/login`'e yönlendirir
- **`stores/auth.ts`** — user/token/officeId durumu (Pinia); `isSuperAdmin`, `isRealAuth`, `isDemoSession` getter'ları
- **`router/index.ts`** — `meta.public` olmayan route'larda auth zorunlu; `meta.bare` olanlarda AppShell gizlenir; `meta.title` ile dinamik sekme başlığı; süper admin routing (`/yonetim` paneline yönlendirme)
- **`admin/`** — İZOLE süper admin paneli (bkz. `src/admin/README.md`). Ana uygulamadan bağımsız layout, route'lar, servis ve tipler. Tek bağlantı `router/index.ts`'teki `...adminRoutes` spread. İleride `admin.emlakdefter.com`'a çıkarılabilir olacak şekilde tasarlanmış.
- **`data/tr-locations.ts`** — 81 il, tüm ilçeler, büyük şehirlerde mahalleler
- **`composables/useAsync.ts`** — yükleme/hata/toast sarmalayıcısı; tüm asenkron aksiyonlar bununla
- **`composables/useCurrencyInput.ts`** — TL fiyat girişi: canlı nokta formatlama, model senkronizasyonu
- **`components/ui/LocationSelect.vue`** — il → ilçe → mahalle kaskadı; edit modunda geçerlilik bazlı temizlik
**Önemli view'lar:**
- `DemandFormView.vue` — iki panelli: sol kriter formu + sağ debounce'lu (300ms) canlı skorlu eşleştirme kartları; provide/inject ile durum paylaşımı
- `PortfolioFormView.vue` — fiyat canlı formatlama, il/ilçe/mahalle dropdown, sürükle-bırak görsel yükleme
- `RegisterView`, `OnboardingView`, `InviteAcceptView`, `OfficeView`, `ProfileView` — kayıt/ofis akışı

### Veritabanı

Modeller ve enum'lar için `backend/prisma/schema.prisma` kaynaktır.

### Tasarım Sistemi (`DESIGN.md`)

Notion ilhamlı, sakin ve minimalist. Birincil renk: Adaçayı (#4e604f / #7D907D). Yazı tipi: yalnızca Inter. 8px boşluk birimi, 12px kart köşe yarıçapı, 8px buton/input köşe yarıçapı. Tam Türkçe karakter desteği zorunludur.

## Env Dosyaları

- Kök `.env` — Docker Compose için `POSTGRES_*`, `ADMINER_DEFAULT_SERVER`
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SEED_ADMIN_EMAIL/PASSWORD`, `SEED_SUPERADMIN_EMAIL/PASSWORD`, `REQUEST_LOG_RETENTION_DAYS` (varsayılan 30), `AUDIT_LOG_RETENTION_DAYS` (varsayılan 365)
- `frontend/.env` — `VITE_API_BASE_URL`

Şablon: `.env.example` / `.env.prod.example`; SEED_SUPERADMIN env'leri üretim'de kullanılır (seed.ts'te idempotent)

## Production

`docker-compose.prod.yml` + `nginx/prod.conf`. Backend Dockerfile CMD'si başlarken `prisma migrate deploy` çalıştırır. Görseller kök `uploads/` dizininden bind mount ile (`./uploads:/app/uploads` ve nginx'e `:ro`) servis edilir.

## Kurallar

### Geliştirme

- **Ofis izolasyonu kontrolü:** Yeni veri (Portfolio, Demand vb.) üzerinde işlem yapan servis metodu ilk satırında `requireOfficeId(user)` çağrısı zorunludur; bu filtre yok ise tenant isolation açığı vardır.
- **Denetim kaydı:** Anlamlı iş olayları (`AUTH_LOGIN`, `USER_CREATED`, `MEMBER_ROLE_CHANGED` vb.) her zaman loglanmalı; `AuditService.log()` fire-and-forget çalışır (await edilmez).
- **Admin modülü:** `src/admin/` cross-tenant; normal user akışlarından hiç servis çağrısı yapılmamalı.
- **Frontend admin izolasyonu:** `src/admin/README.md` sözleşmesi korunmalı; yalnızca `@/services/api`, `@/stores/auth`, toast/confirm ve `@/types` import edilebilir.
- **Güvenli token'lar:** Davet/share token'ları `generateSecureToken()` ile; tahmin edilebilir token'lar (cuid) kullanılmaz.
- **Soft delete:** Silme operasyonları `DELETE` yapmaz; `deletedAt` set edilir. Tüm sorgularda `deletedAt: null` filtresi.
- **Lint + format:** Kod değişikliği `npm run lint:fix` ile otomatik düzeltilmeli; push öncesi lint temiz olmalı.
- **Type safety:** Frontend `vue-tsc --noEmit` ile kontrol edilir; TS hataları prod'a geçmez.

### Commit ve Versiyon

- Commit mesajları feat/fix/refactor/docs başlıklarıyla başlar (conventional commits).
- Her FAZ sonu commit + push (bkz. `tasks.md`); `v2.0.0` release'i için tüm FAZ'lar tamamlanır.
- Açık sonlandırılmayan geliştirme dalları (`WIP`, kısmi özellikler) main'e push edilmez.
