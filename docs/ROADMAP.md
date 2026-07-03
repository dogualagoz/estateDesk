# EstateDesk Yol Haritası

> Bu doküman v2.0.0 sürümünde tamamlanan temel özelliklerden sonra yapılacak
> iyileştirmeleri listeler. Her maddenin önceliği, zorluk tahmini ve bağlamı vardır.

## Semboller

- 🔴 **Kritik** — güvenlik veya kullanıcı deneyimi için acil
- 🟠 **Yüksek** — ürün olgunluğu / SaaS hazırlığı için önemli
- 🟡 **Orta** — kalite / bakım kolaylığı iyileştirmesi
- 🟢 **Düşük** — nice-to-have veya uzun vadeli

---

## Güvenlik

### 🔴 Şifre Sıfırlama Akışı (KRITIK)

v2.0.0'da login var ama şifre unutan kullanıcı kilitli kalıyor. Hemen ekle:

- Forgot password formu `/forgot-password` — e-posta ister
- Süreli reset token (`1 saat TTL`, token hash DB'de)
- `/reset-password/:token` — yeni şifre set
- E-posta gönderimi henüz yok (bkz. [E-posta Servisi](#e-posta-servisi))

**Zaman:** 3-4 saat | **Bağlam:** deployment öncesi zorunlu

### 🟡 Bcrypt Tur Sayısı 12'ye Yükselt

`BCRYPT_ROUNDS = 10` hesaplamayı hızlandırırken, üretim için `12` daha güvenli.
Backward-compatible: eski hash'ler 10 tur ile doğrulanmaya devam eder.

**Zaman:** 30 dakika | **Bağlam:** güvenlik sertleştirmesi, v3'te yapılabilir

### 🟡 İki Faktörlü Kimlik (2FA)

Time-based OTP (TOTP) Google Authenticator ile:
- Kullanıcı profil → "2FA başlat" → QR kod (`speakeasy` lib)
- Login'de TOTP istemi (opsiyonel, çoklu giriş yöntemi desteği)

**Zaman:** 4-5 saat | **Bağlam:** ileriki sürüm

### 🟡 İçerik Güvenlik Politikası (CSP)

nginx `Content-Security-Policy` header'ı:
- `default-src 'self'`
- `script-src 'self' 'nonce-...'` (inline script'ler için nonce)
- `img-src 'self' https:` (WebP, OG görselleri)
- `font-src 'self' https://fonts.googleapis.com`

Vite'de nonce enjeksiyonu yapılması gerekir.

**Zaman:** 2-3 saat | **Bağlam:** XSS koruması, ileriki sürüm

### 🟡 Token Hash'leme (Reset/Davet)

Davet ve reset token'ları DB'de plain metin yerine hash'li saklan.
Hali hazırdaki `generateSecureToken()` token'lar migration sırasında hashlanmalı.

**Zaman:** 2 saat + migration | **Bağlam:** loglanan token'ların etkinliği sınırlandırılır

---

## Ürün Özellikleri

### 🔴 E-posta Servisi

Şifre sıfırlama, davet, bildirimler için SMTP/SendGrid/Resend entegrasyonu.

- Şablon yönetimi (davet, reset, yeni talep uyarısı)
- Queue ile gönderim (fire-and-forget veya Job queue — bkz. [Arka Plan İşleri](#arka-plan-işleri))

**Zaman:** 3-4 saat | **Bağlam:** password reset ve davet otomasyonu için gerekli

### 🟠 İyzico Ödeme Entegrasyonu

Faturalandırma (SaaS modeli):

- Paket seçimi (ücretsiz/PRO/ENTERPRISE)
- Ödeme formu (iyzico SDK veya Stripe)
- Fatura/kullanım takibi (`POST /billing/invoices`)

**Zaman:** 6-8 saat | **Bağlam:** monetization

### 🟠 Bildirim Sistemi

Yeni talep/eşleşme/davet uyarıları:

- In-app (veritabanında, notification tray)
- E-posta (template'li, scheduling)
- SMS (isteğe bağlı, Twilio)

**Zaman:** 4-5 saat | **Bağlam:** kullanıcı katılımı

### 🟠 Halkın Görüş Vitrin

Emlak ofisinin kendi domain'inde veya subdomain'de anonim portföy tarama:

- Public `/showcase` route (ofis ID parametreli)
- Sınırlı filtreleme ve arama
- Google harita entegrasyonu

**Zaman:** 5-6 saat | **Bağlam:** SEO ve lead generation

### 🟡 WhatsApp Şablonları

Davet/eşleşme/yeni kayıt mesajları WhatsApp Business API ile gönder.
Telefon numarasından WhatsApp aç buttonu.

**Zaman:** 2-3 saat | **Bağlam:** modern iletişim kanalı

### 🟡 İçerik Yönetimi (i18n)

Türkçe taşıyabilir dize yönetimi `vue-i18n` ile. Gelecek diller için altyapı.

**Zaman:** 3 saat | **Bağlam:** uluslararası genişleme hazırlığı

### 🟡 PWA (Progressive Web App)

Offline mod, install to home screen:

- Service worker (Workbox)
- Offline sayfası ve veri senkronizasyonu
- Web manifest (zaten var)

**Zaman:** 4-5 saat | **Bağlam:** mobil deneyim

### 🟡 İnternet Takvimi

Talep/portföy tarihçesi, randevu ve zaman yönetimi:

- Vue Calendar bileşeni
- İCalendar format export
- Google Calendar entegrasyonu

**Zaman:** 5-6 saat | **Bağlam:** üretkenlik

### 🟢 Sahibinden.com İthalatı

CSV upload → Portfolio otomatiği oluştur. Veri eşleme UI'ı gerekir.

**Zaman:** 4-5 saat | **Bağlam:** onboarding hızı

---

## Teknik Borç ve Altyapı

### 🟠 Otomatik Test Genişlemesi

Mevcut: Jest (18 test, matching + auth)
Hedef:

- **Vitest** haline geçiş (hızlı, ES modules native)
- Controller/service için 60+ birim test
- **Playwright** E2E test'leri (auth, matching, form'lar)
- **supertest** HTTP endpoint'leri için (opsiyonel)
- CI/CD'de otomatik çalıştırma

**Zaman:** 6-8 saat | **Bağlam:** kalite ve refactoring güveni

### 🟠 Error Tracking (Sentry/GlitchTip)

Üretim hatalarını izle, canlı uyarı:

- Sentry SDK kurulumu (backend + frontend)
- GlitchTip self-hosted alternative (VPS'de)
- Özel bağlam (user, request) eklemesi

**Zaman:** 2-3 saat | **Bağlam:** üretim desteği

### 🟠 Veritabanı Yedeklemesi

Otomatik pg_dump + S3 / B2 backup'ı:

- Günlük schedule (cron job docker'da)
- Saklama: son 30 günü tut
- Restore test'i (ay başında)

**Zaman:** 2-3 saat | **Bağlam:** olağanüstü durum planı

### 🟠 Staging Ortamı

Prod öncesi test:

- staging.emlakdefter.com (ayrı Plesk alt domain)
- docker-compose.staging.yml (prod config'i test eder)
- Seed demo veri

**Zaman:** 3 saat | **Bağlam:** deployment risk azaltma

### 🟡 GitHub Actions CI/CD

Otomatik test + build + deploy:

- `on: push to main` → test + lint + build
- `on: release` → docker build + push + deploy to VPS
- PR check'leri (Vitest, Playwright, lint)

**Zaman:** 3-4 saat | **Bağlam:** release otomasyonu

### 🟡 NestJS 11 + Vite 8 Major Yükseltme

v2.0.0 sabit tutuluyor; v2.1 veya v3 için:

- NestJS 11: yeni middleware API, iyileştirmeler
- Vite 8: Rollup 4, performans
- Breaking change'ler incelenecek

**Zaman:** 4-5 saat | **Bağlam:** kütüphane güncelleme sirkülasyonu

### 🟡 RequestLog Örnekleme

5000+ istek/saat'te tüm log tutmak yavaşlatır.
`REQUEST_LOG_SAMPLE_RATE = 0.1` (% 10) ile evrensel örnekleme:

```sql
-- 10% rastgele örnek + tüm hata'lar
WHERE random() < 0.1 OR statusCode >= 400
```

**Zaman:** 1 saat | **Bağlam:** yüksek trafik optimize'i

### 🟡 CONCURRENTLY (npm script'leri)

Dev'de backend + frontend'i paralel başlat:

```json
"dev": "concurrently \"npm run start:dev -w backend\" \"npm run dev -w frontend\""
```

Mevcut: ayrı terminal'ler (tedious)

**Zaman:** 30 dakika | **Bağlam:** geliştirici ergonomisi

### 🟢 Ön İşleme (vite-ssg)

Statik sayfa oluşturma (landing, public vitrin) — opsiyonel.
SSR'a gerek yok, SPA yeterli; gelecek optimization.

**Zaman:** 3-4 saat | **Bağlam:** SEO bonus (opsiyonel)

### 🟢 Admin Subdomain Çıkarması

`admin.emlakdefter.com` ayrı Vite app olarak deploy:

- `frontend/admin.vite.config.ts` (ayrı entry point)
- Admin route'ları `src/admin-app/` klasörüne taşı
- Docker multi-stage build (admin + main)

**Zaman:** 3-4 saat | **Bağlam:** operasyonel ergonomisi (ileride)

---

## Arka Plan İşleri

### 🟡 Job Queue Altyapısı

Uzun işler (e-posta, Excel export, thumbnail) için:

- Bull/BullMQ + Redis
- Worker process'leri
- Retry ve dead letter handling

Mevcut: `RequestLogWriterService` buffer'ı geçici çözüm; e-posta ve
raporlar için asıl queue gerekir.

**Zaman:** 4-5 saat | **Bağlam:** ölçeklenebilirlik

---

## Veri ve Raporlama

### 🟡 Gelişmiş Analytics

Mevcut: DAU/WAU/MAU, top ofisler
Hedef:

- Eşleşme başarı oranı (kaç tahmin → kaç satış?)
- Kullanıcı segment analizi (tur, lokasyon)
- Funnel analizi (kayıt → ofis kurulumu → ilk portföy)
- Export CSV/PDF

**Zaman:** 5-6 saat | **Bağlam:** SaaS insights

---

## Operasyon

### 🟡 Monitoring Paneli

Mevcut: admin system view (DB ping, memory)
Hedef:

- Grafana dashboard (CPU, disk, network)
- Alert threshold'ları (disk %85 +, RAM, DB bağlantı sayısı)
- Alerting (e-posta, Slack webhook)

**Zaman:** 3-4 saat | **Bağlam:** SaaS OPS

---

## Özet Öncelik Sırası

Önce deploy'dan sonra yapılması gerekenler **ALINAN SİPARİŞ DIŞINDA**:

1. 🔴 Şifre sıfırlama (zorunlu)
2. 🔴 E-posta servisi (şifre + davet + bildirimler için gerekli)
3. 🟠 Test genişlemesi (Vitest + Playwright)
4. 🟠 Backup + Staging
5. 🟠 GitHub Actions CI
6. 🟠 Bildirim sistemi
7. 🟡 2FA, CSP, Sentry, Monitoring

Geri kalanlar v3 veya sonrası (ürün bağımlı).

---

## Bağlamlar

**SaaS Hazırlığı:** Ödeme, faturalama, multi-tenant isolation doğrulaması.

**Güvenlik Sertleştirmesi:** 2FA, CSP, bcrypt 12, token hashing — compliance/pentesting.

**Ölçeklenebilirlik:** Job queue, RequestLog sampling, Monitoring.

**Geliştirici Deneyimi:** Vitest, E2E test'leri, CONCURRENTLY, better docs.

**Ürün Parlaklığı:** Bildirimler, SMS, PWA, i18n, halkın vitrin.
