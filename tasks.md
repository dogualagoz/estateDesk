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

## Faz 5 — `/demand/:id` detayını iki panele çevir
- [x] `/demand/:id` route'u `DemandFormView`'a yönlendirildi (edit modu)
- [x] Edit modunda durum (Aktif/Kapandı) seçimi + Sil butonu eklendi
- [x] Eski salt-okunur `DemandDetailView.vue` kaldırıldı + `/edit` route'u sadeleşti
- [x] `frontend type-check` temiz

## Kapsam dışı (şimdilik)
Satıcı→talep yönü, MatchFeedback, otomatik eşleştirme/gelen kutusu, tipe göre
ağırlık profili, komut çubuğu.

---

# Faz 6 — Adres Dropdown + Fiyat Formatlama

## Durum
- [x] `frontend/src/data/tr-locations.ts` — 81 il, tüm ilçeler, büyük şehirlerde mahalleler
- [x] `frontend/src/components/ui/LocationDropdown.vue` — aranabilir, kaydırılabilir, single/multi + gruplu mahalle desteği
- [x] `PortfolioFormView` — fiyat yazarken anlık nokta formatlama; il/ilçe/mahalle tek-seçim dropdown
- [x] `DemandFormView` — il tek-seçim, ilçe çoklu-seçim, mahalle çoklu-seçim (ilçeye göre gruplu)
- [x] `frontend/src/types/matching.ts` — MatchCriteria'ya `districts[]` ve `neighborhoods[]` eklendi
- [x] `frontend/src/types/demand.ts` — Demand ve CreateDemandPayload güncellendi
- [x] `backend/prisma/schema.prisma` — Demand'e `districts[]` ve `neighborhoods[]` eklendi
- [x] Migration: `20260528162808_demand_multi_location`
- [x] `matching.scoring.ts` — locationScore proximity kademe sistemi (0/0.35/0.9/1.0)
- [x] `matching.service.ts` — MatchPortfoliosDto `districts/neighborhoods` alanları geçiliyor
- [x] Tarayıcıda manuel test (kullanıcı tarafından)

## Faz 7 — Koordinat Bazlı Konum Puanlaması (Seçenek A)

- [x] `scripts/fetch-district-coords.mjs` — Nominatim ile 375 ilçe koordinatı toplandı (20 şehir)
- [x] `backend/src/matching/tr-district-coords.ts` — "normalizedCity/normalizedDistrict" → {lat,lng} haritası
- [x] `matching.constants.ts` — `LOCATION_MAX_KM = 30` sabiti eklendi
- [x] `matching.scoring.ts` — `haversineKm()` + yeni `locationScore` (koordinat bazlı decay, fallback 0.35)
- [x] 18/18 test geçiyor
- [x] API smoke testi: Kadıköy seçimi → Üsküdar 74, Beşiktaş 68, Sarıyer elendi ✓
- [x] Çoklu ilçe: Kadıköy+Üsküdar → Beşiktaş 80 (en yakın ilçeye mesafe alınıyor) ✓
