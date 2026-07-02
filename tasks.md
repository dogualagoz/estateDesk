# EstateDesk v2.0.0 Yol Haritası — Görev Takibi

Plan: refactor + güvenlik + süper admin paneli + SEO. Her faz sonu = commit noktası.
Detaylı plan: `~/.claude/plans/plan-senle-imdi-genel-wise-liskov.md`

## FAZ 0 — Lint/Format Altyapısı
- [x] Backend ESLint (flat config) + lint script
- [x] Frontend ESLint (eslint-plugin-vue) + lint script
- [x] Kökte .prettierrc.json + .prettierignore
- [x] `--fix` ilk geçiş, build + test yeşil (backend 42 test ✓)
- [ ] **Commit 1**

## FAZ 1 — Güvenlik Sertleştirme
- [ ] `token.util.ts` (crypto.randomBytes) + cuid default kaldırma migration'ı
- [ ] Login dummy bcrypt compare (timing enumeration koruması)
- [ ] `BCRYPT_ROUNDS` konstantı
- [ ] nginx güvenlik başlıkları + limit_req
- [ ] Prod compose healthcheck'ler + non-root backend Dockerfile
- [ ] npm audit
- [ ] **Commit 2**

## FAZ 2 — Hedefli Refactor
- [ ] InviteService ayrıştırma (office.service 564 → ~250 satır) — **Commit 3**
- [ ] useAsync + useCurrencyInput + LocationSelect ortak altyapısı
- [ ] DemandFormView bölme (874 → ~250)
- [ ] PortfolioFormView bölme (793 → ~250)
- [ ] OfficeView bölme (713 → ~150) — **Commit 4**
- [ ] Search trigram indeksi (f_unaccent + GIN)
- [ ] Türkçe yorum eşitleme + logo1.svg temizliği — **Commit 5**

## FAZ 3 — Süper Admin Paneli + Analytics
- [ ] Prisma: SUPERADMIN rolü + AuditLog + RequestLog + retention cron
- [ ] `audit` modülü (fire-and-forget log + buffered request writer) — **Commit 6**
- [ ] `admin` backend modülü (users/offices/logs/analytics/system) + süper admin seed — **Commit 7**
- [ ] Frontend `/yonetim` paneli (izole src/admin/, 7 view, Chart.js) — **Commit 8**

## FAZ 4 — Favicon + SEO
- [ ] İkon seti üretimi (logo.svg → ico/png/apple-touch/og-cover)
- [ ] index.html meta paketi (description, OG, Twitter, JSON-LD)
- [ ] robots.txt + sitemap.xml + site.webmanifest
- [ ] Route bazlı dinamik title — **Commit 9**

## FAZ 5 — Dokümantasyon + Sürüm
- [ ] docs/ARCHITECTURE.md (geliştirici/mimari dokümantasyonu — dokümandan kod takibi)
- [ ] docs/ROADMAP.md (backlog: şifre sıfırlama, ödeme, e-posta, refresh token, CI, yedekleme...)
- [ ] CLAUDE.md + DEPLOYMENT.md güncellemeleri — **Commit 10**
- [ ] Release **v2.0.0**
