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

### Backend script'leri

```bash
npm run build          # nest build → dist/
npm run start:dev      # watch modu
npm run seed           # ts-node prisma/seed.ts
npm run test           # Jest (18 test, matching scoring)
npm run prisma:migrate # prisma migrate dev
npm run prisma:deploy  # prod için
```

### Frontend script'leri

```bash
npm run dev            # Vite dev server
npm run build          # vue-tsc + vite build
npm run type-check     # vue-tsc --noEmit
```

## Mimari

### Backend (NestJS, `backend/src/`)

Standart NestJS modül yapısı. Her domain kendi klasöründe `module`, `controller`, `service`, `dto/` barındırır.

**Modüller:**
- `auth` — JWT login/register; 12 saatlik token, `ed_token` localStorage anahtarı
- `users` — profil, ofis kapsamlı kullanıcı listesi
- `portfolio` — mülk ilanları (soft delete, görsel yükleme)
- `demand` — alıcı talepleri (soft delete, çok lokasyonlu)
- `matching` — ağırlıklı eşleştirme motoru (sert filtre + skorlama)
- `office` — ofis oluşturma, üye yönetimi, davet sistemi
- `search` — global arama
- `demand-match` — eşleştirme pin/kayıt tablosu
- `dashboard` — özet istatistikler

**Global guard'lar** (`app.module.ts`, sırayla):
- `ThrottlerGuard` — rate limiting (genel 100 istek/dk; auth uçlarında `@Throttle` ile 10/dk)
- `JwtAuthGuard` — tüm route'lara uygulanır; `@Public()` ile devre dışı bırakılır
- `RolesGuard` — `@Roles(Role.ADMIN)` kontrol eder
- `DemoReadOnlyGuard` — demo kullanıcılarının (isDemo) yazma isteklerini engeller; salt-okunur POST'lar `@DemoSafe()` ile muaf tutulur

**Veri desenleri:**
- Tüm silmeler soft delete: `deletedAt` set edilir, sorgularda `deletedAt: null` filtresi
- **Ofis izolasyonu**: Her `Portfolio` ve `Demand` kaydı `officeId` içerir; tüm liste/get/update/delete sorguları ofise göre filtrelenir
- JWT payload'ı `sub`, `email`, `role` içerir; kullanıcı (officeId dahil) her istekte DB'den taze okunur (`jwt.strategy.validate`) ve `@CurrentUser()` decorator ile controller'lara enjekte edilir
- Görsel yükleme: `POST /portfolio/:id/images` → sharp ile WebP + sıkıştırma → `uploadsDir()` (varsayılan `<cwd>/uploads`; `UPLOADS_DIR` env ile ezilebilir)
- Metin araması: liste filtreleri Prisma `contains` (mode: insensitive); global arama `unaccent` + LIKE'lı parametrize raw SQL

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
- **`stores/auth.ts`** — user/token/officeId durumu (Pinia)
- **`router/index.ts`** — `meta.public` olmayan route'larda auth zorunlu; `meta.bare` olanlarda AppShell gizlenir (register, onboarding, invite)
- **`data/tr-locations.ts`** — 81 il, tüm ilçeler, büyük şehirlerde mahalleler
- **`components/ui/LocationDropdown.vue`** — aranabilir, kaydırılabilir, single/multi + gruplu mahalle desteği
- **`views/`** — `portfolio/`, `demand/`, `users/`, `office/`, `auth/` klasörleri
- **`types/`** — `portfolio.ts`, `demand.ts`, `user.ts`, `office.ts`, `matching.ts`, `common.ts`

**Önemli view'lar:**
- `DemandFormView.vue` — iki panelli: sol kriter formu + sağ debounce'lu (300ms) canlı skorlu eşleştirme kartları; hem create hem edit modu
- `PortfolioFormView.vue` — fiyat anlık nokta formatlama, il/ilçe/mahalle dropdown, sürükle-bırak görsel yükleme
- `RegisterView`, `OnboardingView`, `InviteAcceptView`, `OfficeView`, `ProfileView` — kayıt/ofis akışı

### Veritabanı (Prisma şeması: `backend/prisma/schema.prisma`)

**Modeller:** `Office`, `Invite`, `User`, `Portfolio`, `Demand`, `DemandMatch`

**Enum'lar:** `Role` (ADMIN|AGENT), `PropertyType` (APARTMENT|VILLA|LAND|SHOP|OFFICE|HOTEL), `ListingType` (SALE|RENT), `PortfolioVisibility`, `DemandStatus`, `InviteStatus`

### Tasarım Sistemi (`DESIGN.md`)

Notion ilhamlı, sakin ve minimalist. Birincil renk: Adaçayı (#4e604f / #7D907D). Yazı tipi: yalnızca Inter. 8px boşluk birimi, 12px kart köşe yarıçapı, 8px buton/input köşe yarıçapı. Tam Türkçe karakter desteği zorunludur.

## Env Dosyaları

- Kök `.env` — Docker Compose için DB kimlik bilgileri
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SEED_ADMIN_*`
- `frontend/.env` — `VITE_API_BASE_URL`

Şablon: `.env.example` / `.env.prod.example`

## Production

`docker-compose.prod.yml` + `nginx/prod.conf`. Backend Dockerfile CMD'si başlarken `prisma migrate deploy` çalıştırır. Görseller kök `uploads/` dizininden bind mount ile (`./uploads:/app/uploads` ve nginx'e `:ro`) servis edilir.

## Kurallar

- Her önemli eşikte commitle ve kullanıcıya commit mesajını sorup onay iste. Onaylayınca commitleyip pushla.
