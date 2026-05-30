# emlakdefter — UX Geliştirme Planı

Uygulama yeniden adlandırılıyor: **EstateDesk → emlakdefter**
> Sidebar, logo ve tüm marka referansları bu plan kapsamında güncellenecek.

Temel felsefe: Sahibinden'e benzer ama daha basit. Asıl amaç **not alma** — istatistik değil aksiyon.
Geliştirme sırası: **3 → 2 → 1**

---

## Feature 3: Defter (Hızlı Not Alanı)

### Amaç
Emlakçı bir görüşme bitince dashboarda gelip ilgili portföy veya talebe hızlıca not düşebilsin. Mevcut not alanı (portföy/talep formlarında zaten var) bu arayüzle efektif kullanılsın — DB değişikliği gerekmez.

### Layout
Dashboard ana içeriğinde ayrı bir panel. İçinde iki satır:
- **Portföyler** satırı → yatay kaydırılabilir kart dizisi
- **Talepler** satırı → yatay kaydırılabilir kart dizisi

Her satır kendi içinde bağımsız scroll yapar. Sağda "Tümünü Gör" linki.

### Feed İçeriği
- **Sadece notu olan kayıtlar** görünür (notu olmayanlar listelenmez — temiz ve anlamlı kalır)
- Sıralama: en son güncellenen üstte / solda
- Sayfalama: scroll ettikçe yükle (performans için lazy load)

### "+" Quick Capture Akışı
Yeni bir kayda not eklemek için:
1. Paneldeki **"+"** butonuna bas
2. Searchbar açılır (animasyonlu ama hızlı — gecikme yok)
3. Portföy veya talep adı/lokasyonu ile ara
4. Seçince **not editörü** açılır (bkz. Düzenleme UX)
5. Yaz, kaydet → kart feed'de belirir

> Portföy satırındaki "+" → portföy araması, Talep satırındaki "+" → talep araması açar.

### Düzenleme UX
Mevcut bir nota tıklanınca:
- **Karar: Inline textarea** (birincil tercih)
  - Kart üzerinde textarea açılır, kaydet / iptal butonları belirir
  - Hızlı ve defter hissi tam oturur
- **Alternatif: Drawer/Panel** (deneme seçeneği olarak not düşüldü)
  - Sağdan açılan küçük bir panel, not alanı + kayıt bilgileri
  - Daha fazla alan sunar, uzun notlar için daha uygun

### Teknik Notlar
- `PATCH /portfolio/:id` ve `PATCH /demand/:id` endpoint'leri mevcut, sadece `notes` field'ı gönderilecek
- Dashboard'a yeni endpoint gerekmez; mevcut `recentPortfolios` / `recentDemands` yanıtlarına `notes` field'ı eklenirse yeterli
- İlk sürümde sabit sayıda kayıt çekilecek (portföy için ilk 20 notlu kayıt)
- Lazy load (skip/take pagination) ilerleyen versiyona bırakıldı

### Açık Kalan Sorular
- [ ] Inline vs Drawer kararı → prototip görülünce netleşecek
- [ ] Her satırda kaç kart görünsün? (şimdilik belirsiz, scroll ile çözülüyor)

---

## Feature 2: Bekleyen Talepler

> Detaylı plan henüz yapılmadı. Aşağıdakiler ön tartışma notlarıdır.

### Amaç
Hiç eşleştirme yapılmamış veya pinlenmemiş aktif talepleri öne çıkar. Unutulan müşterileri hatırlat.

### Tartışılan Fikirler
- Aktif talepler listesi, eklenme tarihiyle birlikte
- Üzerinden geçen süreye göre uyarı göstergesi:
  - 7 gün → sarı ünlem ⚠️
  - 14+ gün → kırmızı ünlem 🔴
- Karta tıklayınca talep detay/eşleştirme sayfasına git

### Henüz Konuşulmadı
- Kaç talep gösterilecek?
- Sadece eşleştirilmemiş mi, yoksa tüm aktif talepler mi?
- Süre eşikleri (7/14 gün) doğru mu?

---

## Feature 1: Eşleştirme Paneli

> Detaylı plan henüz yapılmadı. Aşağıdakiler ön tartışma notlarıdır.

### Amaç
Her aktif talep için en uyumlu portföyleri dashboard'da göster. Talep sayfasındaki eşleştirme modülünün daha kapsamlı, dashboard versiyonu.

### Tartışılan Fikirler
- Talep → eşleşen portföyler "ağaç" görünümü
- Sürükle-bırak ile portföy pinleme (DemandMatch kaydı oluşturma)
- Sol: aktif talepler, Sağ: skorlu portföy önerileri

### Çözülmesi Gereken Soru (henüz yanıtlanmadı)
**Bu panel hangi sorunu çözüyor?** Eşleştirme zaten talep sayfasında var. Dashboard'a taşımak ne kazandırır?
- Muhtemel cevap: tek bakışta tüm taleplerin durumunu görme, talep sayfasına girme gerek kalmadan hızlı pin
- Sürükle-bırak kime ne kolaylık sağlıyor → bu konuşulacak

### Henüz Konuşulmadı
- Backend endpoint ihtiyacı (her talep için top-N match döndüren)
- Drag-drop pin akışının UX detayları
- Kaç talep / kaç portföy gösterilecek

---

## Dashboard Genel Layout (taslak)

```
┌─────────────────────────────────────┬──────────────┐
│  Feature 2: Bekleyen Talepler       │              │
│  [Talep · 4gün ⚠️]  [Talep · 2gün] │  İstatistik  │
├─────────────────────────────────────┤  Sütunu      │
│  Feature 3: Defter                  │              │
│  Portföyler  [kart][kart][+] →      │  Portföy:207 │
│  ─────────────────────────────      │  Talep: 50   │
│  Talepler    [kart][kart][+] →      │  Aktif:  48  │
├─────────────────────────────────────┤              │
│  Feature 1: Eşleştirme Paneli       │              │
│  (detaylar sonra)                   │              │
└─────────────────────────────────────┴──────────────┘
```

İstatistik sütunu sağda dar, sadece sayılar. Ana içerik solda geniş.

---

## Marka Değişikliği

- Uygulama adı: **emlakdefter**
- Sidebar logo ve başlık güncellenir
- Tüm sayfalardaki "EstateDesk" referansları değişir
- Bu değişiklik Feature 3 ile aynı anda yapılacak
