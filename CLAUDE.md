# CLAUDE.md

-Senior bir full-stack geliştirici gibi düşüneceksin

Bu dosya, Claude Code'a (claude.ai/code) bu repoda çalışırken rehberlik eder.

## Projeye Genel Bakış

EstateDesk, Türk emlak ofisleri için dahili bir portföy ve talep yönetim aracıdır. Stack: NestJS + Vue 3 + PostgreSQL + Prisma; Docker Compose ile konteynerize edilmiştir.

# EstateDesk Proje Amacı

EstateDesk, emlakçıların portföy ve müşteri takibini daha verimli yapabilmesi için geliştirilmiş bir eşleştirme ve hafıza yönetim sistemidir.

Sistem, geleneksel emlak süreçlerinde yaşanan iki temel problemi çözmeyi hedefler.

## Problem 1 — Unutulan Portföyler

Emlakçılar çoğu zaman ilana girilmeyen veya daha sonra değerlendirilmek üzere kenara not alınan portföylere sahip olur.

Ancak zaman içerisinde bu portföyler unutulur veya yüzlerce ilan arasında kaybolur. Daha sonra uygun bir müşteri geldiğinde, emlakçı elindeki uygun portföyü bulmakta zorlanır.

EstateDesk, bu portföyleri yapılandırılmış ve aranabilir şekilde saklayarak müşterinin taleplerine uygun emlakların hızlıca bulunmasını sağlar.

---

## Problem 2 — Unutulan Müşteri Talepleri

Emlak arayan müşteriler çoğu zaman piyasada o anda uygun bir ilan olmadığı için emlakçı tarafından not alınır.

Fakat zaman geçtikçe hangi müşterinin ne aradığı unutulur ve yeni gelen portföylerle eşleştirme yapılamaz.

EstateDesk, müşteri taleplerini detaylı ve aranabilir şekilde saklar.

Sisteme yeni bir portföy eklendiğinde, o portföye uygun müşterilerin hızlıca bulunabilmesini sağlar.

---

# Temel Amaç

EstateDesk’in temel amacı:

- unutulan fırsatları ortadan kaldırmak,

- emlakçıların hafızaya bağımlı çalışmasını azaltmak,

- portföyler ile müşteri talepleri arasında çift yönlü eşleştirme yapabilmek,

- doğru müşteri ile doğru emlağı hızlı şekilde buluşturmaktır.

Sistem hem:

- ilanlı / ilansız portföyleri

- hem de aktif müşteri taleplerini

merkezi ve aranabilir bir yapıda yönetmeyi hedefler.

## Geliştirme Komutları

### Docker ile (birincil iş akışı)

```bash
# Tüm servisleri hot reload ile başlat
docker compose up --build

# Konteynerler ilk kez ayağa kalktıktan sonra
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run seed

# Yeni migration çalıştır
docker compose exec backend npx prisma migrate dev --name <migration_adi>

# Prisma Studio aç (port 5555)
docker compose exec backend npx prisma studio
```

Servisler: API → `http://localhost:3001`, Web → `http://localhost:5173`, DB → `localhost:5432`.
Varsayılan admin bilgileri `backend/.env` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` değerlerinden gelir.

### Docker olmadan

```bash
# Backend
cd backend && npm install && npm run start:dev

# Frontend (ayrı terminal)
cd frontend && npm install && npm run dev
```

### Backend script'leri

```bash
npm run build          # nest build → dist/
npm run start:dev      # watch modu
npm run seed           # ts-node prisma/seed.ts
npm run prisma:migrate # prisma migrate dev
npm run prisma:deploy  # prisma migrate deploy (prod)
```

### Frontend script'leri

```bash
npm run dev            # Vite dev server
npm run build          # vue-tsc tip kontrolü + vite build
npm run type-check     # yalnızca vue-tsc --noEmit
```

## Mimari

### Backend (NestJS, `backend/src/`)

Standart NestJS modül yapısı. Her domain kendi klasöründe `module`, `controller`, `service` ve `dto/` dosyalarını barındırır.

**Global guard'lar** `app.module.ts`'de kayıtlıdır:
- `JwtAuthGuard` — varsayılan olarak tüm route'lara uygulanır; devre dışı bırakmak için `@Public()` decorator'ı kullanılır
- `RolesGuard` — `@Roles(Role.ADMIN)` decorator'ını kontrol eder; ADMIN yetkisi olmayan kullanıcıları sessizce yönlendirir

**Auth akışı:** `POST /auth/login` 12 saatlik JWT döner. Token `localStorage`'da `ed_token` anahtarıyla saklanır. Refresh token mekanizması yoktur; süre dolunca tekrar giriş gerekir.

**Veri desenleri:**
- Tüm silme işlemleri soft delete'tir: `deletedAt` set edilir, liste sorgularında `deletedAt: null` filtresi uygulanır
- Metin araması Postgres `ILIKE` kullanır (planlanan: `tsvector + GIN`)
- `PrismaService` (`src/prisma/`) tüm domain modülleri tarafından import edilen paylaşımlı bir modüldür

**Modüller:** `auth`, `users`, `portfolio`, `demand`, `dashboard`

### Frontend (Vue 3, `frontend/src/`)

- **`services/api.ts`** — tekil Axios instance'ı; JWT'yi localStorage'dan ekler, 401 alındığında `/login`'e yönlendirir
- **`stores/auth.ts`** — kullanıcı/token durumunu tutan Pinia store
- **`router/index.ts`** — navigation guard, `meta.public` olmayan tüm route'larda kimlik doğrulamasını zorunlu kılar; `meta.adminOnly` erişimi ADMIN rolüyle sınırlar
- **`views/`** — her domain için ayrı klasör (`portfolio/`, `demand/`, `users/`); paylaşımlı layout `components/layout/` altında (`AppShell`, `Sidebar`, `Topbar`)
- **`types/`** — Prisma modellerini yansıtan TypeScript arayüzleri (`portfolio.ts`, `demand.ts`, `user.ts`, `common.ts`)
- **`services/`** — her domain için API çağrılarını saran ayrı bir servis dosyası

### Veritabanı (Prisma şeması: `backend/prisma/schema.prisma`)

Temel modeller: `User` (ADMIN | AGENT rolü), `Portfolio` (soft delete'li mülk ilanları), `Demand` (soft delete'li alıcı talepleri).

Enum'lar: `Role`, `PropertyType` (APARTMENT, VILLA, LAND, SHOP, OFFICE), `PortfolioVisibility`, `DemandStatus`.

### Tasarım Sistemi (`DESIGN.md`)

Türk emlak danışmanları için Notion ilhamlı, sakin ve minimalist estetik. Birincil renk: Adaçayı (#4e604f / #7D907D). Yazı tipi: yalnızca Inter. 8px boşluk birimi, 12px kart köşe yarıçapı, 8px buton/input köşe yarıçapı. Tam Türkçe karakter desteği (ğ, ü, ş, ı, ö, ç) zorunludur.

## Env Dosyaları

Her çalışma alanının kendi env dosyası vardır:
- Kök `.env` — docker compose için DB kimlik bilgileri
- `backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `SEED_ADMIN_*`
- `frontend/.env` — `VITE_API_BASE_URL` (prod'da nginx proxy üzerinden varsayılan `/api`)

Şablon olarak `.env.example` / `.env.prod.example` dosyalarını kullanın.

## Production

Production ortamı `docker-compose.prod.yml` + `nginx/prod.conf` kullanır. Backend Dockerfile CMD'si, konteyner başlarken servis öncesinde `prisma migrate deploy`'u otomatik çalıştırır.


