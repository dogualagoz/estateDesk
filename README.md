# EstateDesk

Emlak ofisleri için dahili portföy ve talep yönetim aracı. NestJS + Vue 3 + PostgreSQL + Prisma.

[Changelog](CHANGELOG.md)

## Mimari

```
backend/   NestJS + Prisma (REST API, JWT auth, port 3001)
frontend/  Vue 3 + Vite + Pinia + Vue Router (port 5173)
db/        PostgreSQL 16 (port 5432)
nginx/     Reverse proxy (prod)
```

## Local Geliştirme (Docker)

Gereksinimler: Docker Desktop + Docker Compose.

```bash
# 1. Env dosyalarını hazırla
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Servisleri ayağa kaldır (hot reload aktif)
docker compose up --build

# 3. İlk kurulumda migration + seed
docker compose exec backend npx prisma migrate dev --name init
docker compose exec backend npm run seed
```

Servisler:

- API: http://localhost:3001
- Web: http://localhost:5173
- DB:  localhost:5432

Seed sonrası default admin: `backend/.env` içindeki `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

## Local Geliştirme (Docker'sız, opsiyonel)

```bash
# Backend
cd backend
cp .env.example .env   # DATABASE_URL'i localhost'a göre düzenle
npm install
npx prisma migrate dev --name init
npm run seed
npm run start:dev

# Frontend (ayrı terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Production Deploy (Plesk + Docker Compose)

1. Plesk'te Docker extension'ı kur, Docker Compose desteğini etkinleştir.
2. Domain'in webspace dizinine repo'yu clone'la.
3. `.env.prod` dosyasını yarat:

   ```bash
   cp .env.prod.example .env.prod
   # __STRONG_SECRET__ yerlerini güçlü değerlerle doldur
   ```

4. Servisleri başlat:

   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```

5. İlk admin'i yarat:

   ```bash
   docker compose -f docker-compose.prod.yml exec backend npm run seed
   ```

6. Plesk → domain → **Apache & nginx Settings** → "Proxy mode" veya "Additional nginx directives" ile reverse-proxy:

   ```
   proxy_pass http://127.0.0.1:8080;
   ```

   SSL Plesk Let's Encrypt ile otomatik tamamlanır; container içi nginx HTTP-only kalır.

7. Migration güncellemesi:

   ```bash
   # Dev tarafında:
   docker compose exec backend npx prisma migrate dev --name <ad>
   # Prod tarafında, deploy sonrası container açılışında otomatik:
   #   npx prisma migrate deploy
   # (Dockerfile CMD'sinde tanımlı)
   ```

## Modüller / Endpoint'ler

| Modül     | Endpoint                                                         | Rol         |
|-----------|------------------------------------------------------------------|-------------|
| Auth      | `POST /auth/login`, `GET /auth/me`                               | Public/Auth |
| Users     | `GET/POST/PATCH /users`                                          | Admin       |
| Portfolio | `GET/POST /portfolios`, `GET/PATCH/DELETE /portfolios/:id`       | Auth        |
| Demand    | `GET/POST /demands`, `GET/PATCH/DELETE /demands/:id`             | Auth        |
| Dashboard | `GET /dashboard/stats`                                           | Auth        |

Detaylı DTO ve filtre listesi için ilgili modül `*.controller.ts` dosyalarına bakınız.

## Notlar

- Soft delete: tüm Portfolio/Demand silmeleri `deletedAt` set ederek yapılır; listede `deletedAt IS NULL` filtresi uygulanır.
- Token süresi 12 saat (env). Refresh akışı yok; süre dolunca tekrar login.
- Full-text search v1'de Postgres `ILIKE`. İleride `tsvector + GIN`.
