# EstateDesk — Eşleştirme Motoru Yol Haritası

EstateDesk'in temel vaadi: portföyler ile müşteri talepleri arasında çift yönlü,
hızlı eşleştirme. Bu doküman bu motorun ve etrafındaki özelliklerin yol haritasıdır.

## Senaryolar

- **Alıcı müşteri arıyor:** Emlakçı telefondayken müşterinin söylediği kriterleri
  (tip, bölge, bütçe, oda, satılık/kiralık) girer → anında skorlu portföy listesi
  → "evet, elimde var" der ve mülk sahibinin telefonunu görür.
- **Satıcı müşteri arıyor:** Emlakçı mülkü tarif eder (veya mevcut portföyü açar)
  → anında uyan bekleyen müşteriler (talepler) → müşteri telefonunu görür ve arar.

Eşleştirme **tüm ofisin** envanteri üzerinde çalışır: bir emlakçı, başka bir
emlakçının portföyü/talebiyle de eşleşme görür (kayıtlar `createdById`'ye göre
kısıtlanmaz). Amaç ofis genelinde unutulan fırsatları yüzeye çıkarmak.

---

## TIER 1 — Hızlı Eşleştirme Paneli  *(Çekirdek / MVP)*

Tek ekran, iki yön. Telefon elindeyken kullanılacak.

### 1.1 Alıcı için portföy bul
- Girdi: tip, **şehir**, bölge (ilçe/mahalle), bütçe aralığı, oda, m², kiralık/satılık.
- Çıktı: uyan portföyler **eşleşme skoruna göre sıralı**; her kartta mülk sahibi
  telefonu, eşleşme rozeti ve "neden eşleşti / ne tutmadı" etiketi. Gizli (HIDDEN)
  portföyler de listelenir, "ilansız/gizli" rozetiyle işaretlenir.
- Kayıt zorunlu değil (anlık sorgu). Eşleşme yoksa **tek tıkla talep olarak kaydet**.

### 1.2 Satıcı için müşteri bul
- Girdi: mülk tipi, şehir, konum, fiyat, oda, m², satılık/kiralık (veya mevcut
  portföyden türet).
- Çıktı: uyan bekleyen talepler skorlu; her kartta müşteri telefonu.
- Eşleşme yoksa **tek tıkla portföy olarak kaydet**.

### Uygulama — Backend (yeni `matching` modülü)
`backend/src/matching/` altında standart NestJS yapısı:
`matching.module.ts`, `matching.controller.ts`, `matching.service.ts`, `dto/`.
Skorlama mantığı saf (DB'siz) bir yardımcıda tutulur (`matching.scoring.ts`) ki
birim testi yapılabilsin (bkz. Test bölümü).

Endpoint'ler:
- `POST /matching/portfolios` — body = alıcı kriterleri → skorlu portföy listesi.
- `POST /matching/demands` — body = mülk kriterleri → skorlu talep listesi.
- `GET  /matching/demands/:portfolioId` — kayıtlı portföyden türetip uyan talepler
  (portföy detayında ve oluşturma sonrası otomatik eşleştirmede kullanılır).
- `GET  /matching/portfolios/:demandId` — kayıtlı talepten türetip uyan portföyler.

`MatchingModule`, `PrismaService`'i import eder (diğer modüllerle aynı desen).
Veri hacmi tek ofis ölçeğinde küçük olduğundan: kaba DB filtresi (sert filtreler +
tolerans bandındaki bütçe) ile aday çekilir, **skorlama bellekte (JS)** yapılır.

### Uygulama — Frontend
- Yeni view: `frontend/src/views/matching/MatchingView.vue` + route `/matching`
  (`router/index.ts`) + Sidebar girişi (`components/layout/Sidebar.vue`).
- İki mod toggle'ı (Alıcı için / Satıcı için). Kriter formunda portföy/talep
  formlarındaki mevcut select bileşenleri yeniden kullanılır.
- Yeni servis: `frontend/src/services/matching.service.ts` (mevcut
  `demand.service.ts` deseniyle), tipler: `frontend/src/types/matching.ts`.
- Sonuç kartı: skor rozeti, eşleşen/tutmayan etiketleri, tıkla-ara (`tel:`),
  "kaydet" CTA. (WhatsApp şimdilik kapsam dışı.)
- Ayrıca: `PortfolioDetailView.vue` içine "uyan talepler", `DemandDetailView.vue`
  içine "uyan portföyler" paneli gömülür.

---

## TIER 2 — Eşleştirme Skoru & Tolerans  *(Motorun beyni)*

Katı filtre yerine **skorlama + yakın eşleşme** — yoksa motor hep "yok" der.

### Sert filtreler (skorlamadan önce, DB seviyesinde)
Bunlardan biri geçmezse aday hiç skorlanmaz, listede görünmez:

- `deletedAt: null` — **her iki modelde** (soft-delete edilmişler asla eşleşmez).
- `status: ACTIVE` — **yalnız Demand** (CLOSED talepler eşleşmez).
- `listingType` eşleşmesi (SALE ↔ SALE, RENT ↔ RENT) — *Demand'e de eklendikten
  sonra*, bkz. 3.1.
- Mülk tipi: `portfolio.type ∈ demand.types`.
- **Şehir** (`city`) eşleşmesi.
- `visibility` **filtre DEĞİLDİR**: PUBLIC ve HIDDEN portföylerin **ikisi de** dahil
  edilir; HIDDEN olanlar sonuç kartında rozetlenir. (Ürünün amacı ilansız/unutulan
  portföyleri de bulmak olduğundan gizli envanter saklanmaz.)

> Not (şehir filtresi bağımlılığı): `Demand.regions` serbest metindir. Şehri
> güvenilir bir sert filtre yapmak talep tarafında da yapısal bir şehir alanı
> gerektirir; bkz. 3.3. Panel girişinde şehir yapısal seçilir, kayıtlı talepten
> türetme yolunda 3.3 tamamlanana kadar şehir eşleşmesi normalize `regions`
> üzerinden yapılır.

### Skorlama algoritması — ağırlıklı doğrusal skor + aktif boyut normalizasyonu

Tek ofis ölçeği için doğru seçim **açıklanabilir, ayarlanabilir, test edilebilir**
bir model: her boyut 0..1 arası kısmi puan döndürür, ağırlıklarla toplanır,
**yalnızca girilen (aktif) boyutların** ağırlığına bölünerek 0–100'e normalize
edilir. (ML/öğrenme yok — veri yok ve emlakçının "neden eşleşti"yi görmesi şart.)

**Boyut aktiflik kuralı (Madde 2):**
- Kriter **girilmemiş** (boş array / null) → boyut *pasif*: ne paya ne paydaya
  girer. "Fark etmez."
- Kriter **girilmiş** → boyut *aktif*: ağırlığı paydaya eklenir; tutmazsa 0 puan
  alır ama paydada kalır ve `gaps[]`'e yazılır.

> Kritik ayrım: **"girilmemiş" ≠ "girildi ama tutmadı".** Birincisi nötr (paydadan
> çıkar), ikincisi gerçek bir eksiktir (paydada kalır, 0 alır).

**Formül:**
```
aktif = kriteri girilmiş boyutlar
skor  = Σ(aktif boyut puanı × ağırlık) / Σ(aktif boyut ağırlığı) × 100
```
Hiç kriter girilmemişse (payda = 0): sıfıra bölme yok → sert filtreyi geçen adaylar
nötr bir skorla ("kriter yok" rozeti) döner.

**Boyutlar ve ağırlıklar** (başlangıç; tipe göre profil ileride — bkz. Tier 3):

| Boyut | Ağırlık | Kural |
|---|---|---|
| Bütçe / Fiyat | ~35 | Fiyat `[minBudget, maxBudget]` içindeyse 1.0; ±%TOL bandında doğrusal azalan kısmi puan. Tek taraflı sınır (yalnız min veya yalnız max) da ele alınır. |
| Konum (ilçe/mahalle) | ~25 | Şehir zaten sert filtre; burada `district/neighborhood` ile `demand.regions` normalize (lower+unaccent) `contains` eşleşmesi. Komşu ilçe = kısmi puan. |
| Oda | ~20 | `portfolio.roomCount ∈ demand.roomPreferences` (normalize edilmiş, bkz. 3.2). |
| m² (alan) | ~10 | `portfolio.areaSqm`, talebin `[minArea, maxArea]` aralığına göre; ±%TOL bandında kısmi. *Demand'e alan alanı eklendikten sonra*, bkz. 3.4. |
| Özellik | ~10 | `features ∩ featurePrefs` örtüşme oranı. |

> Ağırlıklar ve tolerans bandı (`TOL`) sabit kodlanmaz; konfigürasyon dosyasından
> okunur (bkz. Konfigürasyon bölümü).

**Mimari — boyut dizisi (saf fonksiyon):**
```ts
type Dimension = {
  key: 'budget' | 'location' | 'room' | 'area' | 'feature';
  weight: number;
  isActive: (d: Demand) => boolean;            // kriter girilmiş mi?
  score: (p: Portfolio, d: Demand) => number;  // 0..1 kısmi puan
};

function matchScore(p, d, dims): { score, reasons, gaps } {
  const active = dims.filter(dim => dim.isActive(d));
  if (active.length === 0) return { score: NEUTRAL, reasons: [], gaps: [] };
  const total = active.reduce((s, dim) => s + dim.weight, 0);
  let earned = 0; const reasons = [], gaps = [];
  for (const dim of active) {
    const s = dim.score(p, d);
    earned += s * dim.weight;
    (s >= MATCH_THRESHOLD ? reasons : gaps).push(dim.key);
  }
  return { score: Math.round((earned / total) * 100), reasons, gaps };
}
```
Bu dizi tipe göre değiştirilerek (Tier 3) tip-bazlı ağırlık aynı motorla çözülür.

**Çıktı** her sonuç için: `matchScore`, `reasons[]` (eşleşenler), `gaps[]` (tutmayan
/ yakın). Tolerans bandındakiler "yakın eşleşme" rozetiyle işaretlenir
(ör. "bütçeyi 200k aşıyor", "komşu semt"). `MIN_SCORE` altındaki adaylar listeden
gizlenir (gürültü kesme; eşik konfigürasyondan).

> Decimal notu (Madde 9): `price` ve bütçe alanları Prisma `Decimal`'dir. Bellekte
> skorlarken `number`'a çevrilir; büyük tutarlarda hassasiyet kaybına dikkat
> (gerekirse kuruş yerine TL tabanında karşılaştır). Dönüşüm tek yerde yapılır.

---

## TIER 3 — Şema & Veri Eksikleri  *(Motoru güvenilir kılan)*

İyi eşleştirmeyi engelleyen mevcut model sorunları:

### 3.1 Demand'e `listingType` ekle  *(zorunlu — sert filtre ön koşulu)*
`Demand` modelinde satılık/kiralık ayrımı yok → kiracı ile alıcı karışır. Müşteri de
satılık veya kiralık arar; bu bir **sert filtredir**.
- `backend/prisma/schema.prisma`: `Demand`'e `listingType ListingType @default(SALE)`.
- Migration: `prisma migrate dev --name demand_listing_type`.
- DTO/tip güncellemeleri: `create-demand.dto.ts`, `frontend/src/types/demand.ts`,
  talep formu.

### 3.2 Oda sayısı standardizasyonu
`roomCount` (Portfolio) ve `roomPreferences` (Demand) serbest metin → "3+1" vs
"3 + 1" eşleşmeyi kırar.
- DB değişikliği yok; ortak sabit liste (1+0, 1+1, 2+1, 3+1, 4+1, 5+...) + dropdown
  ile giriş kısıtlanır. Eşleştirmede `normalizeRoom()` yardımcısı (boşlukları temizle).

### 3.3 Bölge & şehir normalizasyonu  *(şehir sert filtresinin ön koşulu)*
`regions` (Demand) serbest metin ↔ portföyde yapısal `city/district`. En zayıf halka.
- İl/ilçe için kontrollü liste + autocomplete bileşeni; `regions` String[] kalır ama
  autocomplete'ten beslenir. **Şehri sert filtre yapabilmek için** Demand'e yapısal
  bir `city` alanı eklemek (veya normalize `regions`'tan güvenilir çıkarım) gerekir.
- Teknik çözüm (Madde 5):
  - Postgres: `unaccent` extension'ı migration ile kurulur
    (`CREATE EXTENSION IF NOT EXISTS unaccent;`); karşılaştırmalar `unaccent(lower(...))`.
  - JS tarafı: Türkçe `I/İ/ı/i` tuzağı için `toLocaleLowerCase('tr')` +
    diakritik temizleyen ortak `normalizeText()` yardımcısı.

### 3.4 Demand'e m² (alan) tercihi ekle  *(m² skorlamasının ön koşulu)*
`Portfolio.areaSqm` var ama Demand'de alan tercihi yok → m² boyutu skorlanamaz.
- `backend/prisma/schema.prisma`: `Demand`'e `minArea Int?`, `maxArea Int?`.
- Migration + DTO/tip/form güncellemeleri (3.1 ile aynı desen).

### 3.5 Tipe göre skorlama profili  *(not — sonra düşünülecek)*
Sabit ağırlıklar her tipte doğru değil: LAND/SHOP/OFFICE için oda anlamsız, m²+fiyat
baskın; konutta oda önemli. Çözüm: `Dimension[]` dizisini `PropertyType`'a göre
profillemek (motor aynı kalır, sadece dizi ve ağırlıklar değişir). Önce ortak
boyutlarla (şehir/konum, fiyat, m², özellik, oda) çalışan tek profil; tip-bazlı
profil ikinci aşamada.

---

## TIER 4 — Hız & Pratiklik

- **Tıkla-ara:** her telefon alanı `tel:` linki.
- **Sonuçtan tek tıkla kaydet:** eşleşme yoksa müşteri/portföy anında kaydedilir.
- **Komut çubuğu** *(not — sonra, AI destekli)*: "3+1 kadıköy 5m kiralık" gibi serbest
  metni kriterlere parse eden tek satır. Türkçe kısaltmalar (5m / 5 milyon /
  5.000.000) ve serbest metin kırılganlığı nedeniyle ilk sürümde değil; ileride AI
  desteğiyle eklenebilir.

---

## TIER 5 — "Unutma" Döngüsü

- **Eşleşme geri bildirimi / etiketleme (Madde 4):** bir portföy-talep çifti için
  emlakçının aksiyonu saklanır (arandı / beğenmedi / ilgilenmiyor vb.). Bu olmadan
  aynı eşleşmeler her seferinde tekrar çıkar ve "bu hafta yeni" hesaplanamaz.
  - Teknik çözüm — yeni model:
    ```prisma
    enum MatchFeedbackStatus { CONTACTED REJECTED NOT_INTERESTED }

    model MatchFeedback {
      id          String              @id @default(cuid())
      portfolioId String
      demandId    String
      status      MatchFeedbackStatus
      note        String?
      createdById String
      createdAt   DateTime @default(now())
      updatedAt   DateTime @updatedAt
      @@unique([portfolioId, demandId])
    }
    ```
  - Geri bildirim yalnızca **kayıtlı** portföy ↔ kayıtlı talep çiftleri için anlamlı
    (anlık sorgular kaydedilmediğinden hariç). İşlenmiş çiftler sonraki sonuçlardan
    elenebilir/altta gösterilebilir.
- **Oluşturmada otomatik eşleştirme:** portföy/talep kaydı sonrası "N bekleyen X uyuyor".
- **Eşleşme gelen kutusu:** "Bu hafta eklenen portföyler 5 bekleyen talebe uydu".
- **Yaşlanma uyarısı:** 30+ gün karşılanmamış talep / hareketsiz portföy rozeti
  (`createdAt`/`updatedAt` üzerinden hesaplanır).

---

## Konfigürasyon  *(Madde 6)*

Skorlama parametreleri sabit kodlanmaz, tek bir constants dosyasında toplanır
(`backend/src/matching/matching.constants.ts`):

- Boyut ağırlıkları (bütçe/konum/oda/m²/özellik).
- Tolerans bandı `TOL` (ör. %15).
- `MIN_SCORE` (listeden gizleme eşiği).
- `MATCH_THRESHOLD` (bir boyutun `reasons` mı `gaps` mı sayılacağı, ör. 0.6).
- `NEUTRAL` (kriter yokken dönen nötr skor).
- Ortak oda listesi (3.2).

İleride arayüzden (Ayarlar) düzenlenebilir hale getirilir; o aşamaya kadar dosya
tek doğruluk kaynağıdır.

---

## Test  *(Madde 8)*

Skorlama motorunun en kırılgan parçası saf fonksiyondur; birim testleri zorunlu:

- `matchScore` normalizasyonu: girilmemiş boyut paydadan çıkıyor mu; girilmiş ama
  tutmayan boyut `gaps`'e düşüp paydada kalıyor mu; hiç kriter yokken nötr dönüyor mu.
- Boyut fonksiyonları: bütçe tam/banda/tek-taraflı sınır; `normalizeRoom`;
  `normalizeText` Türkçe karakter (İ/ı, ş, ğ) ve unaccent davranışı; m² aralığı.
- Sert filtreler: deletedAt/status/listingType/type/şehir; HIDDEN'ın dahil edildiği.

---

## Önerilen Sıra
1. **Tier 3.1** (Demand `listingType`) — sert filtre ön koşulu.
2. **Tier 1 + Tier 2** birlikte (Konfigürasyon + Test ile) — ilk kullanılabilir sürüm.
3. **Tier 3.2 / 3.3 / 3.4** — oda, şehir/bölge, m² normalizasyonu; eşleştirme kalitesi.
4. **Tier 3.5** — tip-bazlı skorlama profili.
5. **Tier 4 → Tier 5** — hız, etiketleme ve otomasyon katmanı.
