# Görevler — Eşleştirme & Skorlama Motoru (Alıcı yönü)

Müşteri talebi eklerken sol panelde kriterler, sağ panelde anlık skorlanan portföy
kartları. Deterministik, açıklanabilir, ağırlıklı skorlama; sert filtre + skorlama
iki ayrı katman. Kaynak: `docs/eslestirme-motoru.md` + kullanıcı spesifikasyonu.

## Faz 0 — Güvenli başlangıç
- [x] Mevcut çalışmayı commit'le (geri dönüş noktası)
- [x] `tasks.md` oluştur

## Faz 1 — Şema & migration (`backend/prisma/schema.prisma`)
- [x] `Demand`'e `listingType` ekle (sert filtre ön koşulu)
- [x] `Demand`'e yapısal `city` / `district` / `neighborhood` ekle
- [x] `Demand`'e `minArea` / `maxArea` ekle
- [x] `Demand`'e `mustHaveFeatures[]` (hard) + `bonusFeatures[]` (skor) ekle
- [x] Migration: `demand_matching_fields`
- [x] `prisma/seed.ts` — örnek portföy + talep (yeni alanlarla)

## Faz 2 — Backend `matching` modülü (`backend/src/matching/`)
- [x] `matching.constants.ts` — ağırlıklar, TOL, PRICE_STRETCH, eşikler, oda sırası
- [x] `matching.scoring.ts` — saf fonksiyonlar (normalize, budget convex, room
      diminishing, area capped, location, feature, `matchScore`)
- [x] `matching.service.ts` — sert filtre (DB) + skorlama (bellek) + sıralama
- [x] `matching.controller.ts` — `POST /matching/portfolios`
- [x] `dto/match-portfolios.dto.ts`
- [x] `matching.module.ts` + `app.module.ts` kaydı
- [x] Demand create/update DTO + service yeni alanları kaydediyor

## Faz 3 — Test (`backend/`)
- [x] Jest + ts-jest + @types/jest kur, config + `"test": "jest"`
- [x] `matching.scoring.spec.ts` — normalizasyon, budget/room/area, trade-off, Türkçe
- [x] Testler geçiyor (18/18)
- [x] Canlı endpoint smoke testi (`POST /matching/portfolios` → skorlu sonuç)

## Faz 4 — Frontend iki panelli canlı eşleştirme ekranı
- [x] `types/matching.ts` + `services/matching.service.ts`
- [x] Ortak seçenek listelerini paylaşımlı yere taşı (`types/portfolio.ts`)
- [x] `DemandFormView.vue` yeniden yaz — sol kriter paneli (2 ayrı özellik bölümü)
- [x] Sağ panel — debounce'lu (300ms) canlı skorlu kartlar (skor, nedenler, gaps,
      eşleşen özellikler, HIDDEN rozeti, `tel:`, boyut çubuğu renklendirme)
- [x] "Kaydet" → yapısal alanlarla talep oluşturma + edit modu
- [x] `frontend type-check` temiz; dev server 200; backend endpoint canlı
- [ ] Tarayıcıda manuel tıklama testi (kullanıcı tarafından doğrulanacak)

## Faz 5 — (Sonraki) `/demand/:id` detayını iki panele çevir
- [ ] Detay sayfası = düzenlenebilir iki panelli canlı eşleştirme görünümü

## Kapsam dışı (şimdilik)
Satıcı→talep yönü, MatchFeedback, otomatik eşleştirme/gelen kutusu, tipe göre
ağırlık profili, komut çubuğu.
