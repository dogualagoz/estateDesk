import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@estatedesk.local';
  const password = process.env.SEED_ADMIN_PASSWORD || 'changeme123';
  const fullName = process.env.SEED_ADMIN_NAME || 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] Admin already exists: ${email}`);
    return existing;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, fullName, role: Role.ADMIN, isActive: true },
  });
  console.log(`[seed] Admin created: ${user.email}`);
  return user;
}

async function seedPortfolios(ownerId: string) {
  const count = await prisma.portfolio.count();
  if (count > 0) {
    console.log(`[seed] Portfolios already present (${count}), skipping.`);
    return;
  }

  const data = [
    // İstanbul – Kadıköy & çevresi
    {
      type: 'APARTMENT', listingType: 'SALE', title: "Moda'da Deniz Manzaralı 3+1",
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Moda',
      areaSqm: 135, roomCount: '3+1', price: 11500000,
      features: ['Asansör', 'Otopark', 'Deniz Manzarası', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Ayşe Yılmaz', ownerPhone: '05321110001',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Caferağa 2+1 Bütçe Dostu',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Caferağa',
      areaSqm: 95, roomCount: '2+1', price: 8200000,
      features: ['Asansör', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Mehmet Demir', ownerPhone: '05321110002',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Fenerbahçe Geniş 4+1 Lüks Daire',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Fenerbahçe',
      areaSqm: 210, roomCount: '4+1', price: 13800000,
      features: ['Asansör', 'Otopark', 'Havuz', 'Güvenlik', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Zeynep Kaya', ownerPhone: '05321110003',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Bostancı Kiralık 2+1 Eşyalı',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Bostancı',
      areaSqm: 90, roomCount: '2+1', price: 42000,
      features: ['Asansör', 'Eşyalı', 'Klima', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Deniz Şahin', ownerPhone: '05321110005',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Suadiye 1+1 Stüdyo Kiralık',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Suadiye',
      areaSqm: 55, roomCount: '1+1', price: 28000,
      features: ['Asansör', 'Eşyalı', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Taner Bulut', ownerPhone: '05321110051',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Göztepe Ara Katta 3+1',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Göztepe',
      areaSqm: 122, roomCount: '3+1', price: 9800000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Nilüfer Arslan', ownerPhone: '05321110052',
    },
    // İstanbul – Üsküdar
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Acıbadem 3+1 İlansız Fırsat',
      city: 'İstanbul', district: 'Üsküdar', neighborhood: 'Acıbadem',
      areaSqm: 128, roomCount: '3+1', price: 9600000,
      features: ['Asansör', 'Otopark', 'Güvenlik'],
      visibility: 'HIDDEN', ownerName: 'Cengiz Aksoy', ownerPhone: '05321110004',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Çengelköy Boğaz Manzaralı 4+1',
      city: 'İstanbul', district: 'Üsküdar', neighborhood: 'Çengelköy',
      areaSqm: 175, roomCount: '4+1', price: 18900000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Boğaz Manzarası', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Serhat Güneş', ownerPhone: '05321110053',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Üsküdar Merkez Kiralık 2+1',
      city: 'İstanbul', district: 'Üsküdar', neighborhood: 'Üsküdar Merkez',
      areaSqm: 85, roomCount: '2+1', price: 35000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Meryem Koç', ownerPhone: '05321110054',
    },
    // İstanbul – Beşiktaş & Şişli
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Nişantaşı 2+1 Prestijli Konum',
      city: 'İstanbul', district: 'Şişli', neighborhood: 'Nişantaşı',
      areaSqm: 110, roomCount: '2+1', price: 16500000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Kapıcı'],
      visibility: 'PUBLIC', ownerName: 'Yasemin Doğan', ownerPhone: '05321110006',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Levent 3+1 Yüksek Katta',
      city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Levent',
      areaSqm: 145, roomCount: '3+1', price: 19200000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Şehir Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Okan Erdoğan', ownerPhone: '05321110007',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Mecidiyeköy Kiralık 1+1',
      city: 'İstanbul', district: 'Şişli', neighborhood: 'Mecidiyeköy',
      areaSqm: 65, roomCount: '1+1', price: 32000,
      features: ['Asansör', 'Eşyalı', 'Metro Yakını'],
      visibility: 'PUBLIC', ownerName: 'Pınar Yıldız', ownerPhone: '05321110008',
    },
    {
      type: 'OFFICE', listingType: 'RENT', title: 'Fulya Kiralık Ofis 120m²',
      city: 'İstanbul', district: 'Şişli', neighborhood: 'Fulya',
      areaSqm: 120, roomCount: 'Açık Plan', price: 75000,
      features: ['Asansör', 'Güvenlik', 'Klima', 'Kamera Sistemi'],
      visibility: 'PUBLIC', ownerName: 'Berk Çakır', ownerPhone: '05321110009',
    },
    // İstanbul – Anadolu Yakası (Maltepe, Ataşehir, Pendik)
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Ataşehir 3+1 Residence',
      city: 'İstanbul', district: 'Ataşehir', neighborhood: 'Atatürk Mah.',
      areaSqm: 155, roomCount: '3+1', price: 12400000,
      features: ['Asansör', 'Havuz', 'Güvenlik', 'Fitness', 'Otopark'],
      visibility: 'PUBLIC', ownerName: 'Furkan Şimşek', ownerPhone: '05321110010',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Maltepe Sahil 2+1',
      city: 'İstanbul', district: 'Maltepe', neighborhood: 'Bağlarbaşı',
      areaSqm: 105, roomCount: '2+1', price: 7900000,
      features: ['Asansör', 'Balkon', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Canan Tekin', ownerPhone: '05321110011',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Pendik Yenişehir Kiralık 3+1',
      city: 'İstanbul', district: 'Pendik', neighborhood: 'Yenişehir',
      areaSqm: 130, roomCount: '3+1', price: 38000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Hüseyin Özkan', ownerPhone: '05321110012',
    },
    // İstanbul – Avrupa Yakası (Beylikdüzü, Esenyurt, Başakşehir)
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Beylikdüzü 3+1 Site İçi',
      city: 'İstanbul', district: 'Beylikdüzü', neighborhood: 'Gürpınar',
      areaSqm: 138, roomCount: '3+1', price: 6200000,
      features: ['Asansör', 'Havuz', 'Güvenlik', 'Otopark', 'Çocuk Oyun Alanı'],
      visibility: 'PUBLIC', ownerName: 'Tuğba Karaman', ownerPhone: '05321110013',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Başakşehir 4+1 Geniş Aile Dairesi',
      city: 'İstanbul', district: 'Başakşehir', neighborhood: 'Bahçeşehir',
      areaSqm: 195, roomCount: '4+1', price: 9100000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Kapalı Mutfak', 'Depo'],
      visibility: 'PUBLIC', ownerName: 'Soner Kılıç', ownerPhone: '05321110014',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Esenyurt 2+1 Yatırımlık',
      city: 'İstanbul', district: 'Esenyurt', neighborhood: 'Pınar Mah.',
      areaSqm: 88, roomCount: '2+1', price: 3800000,
      features: ['Asansör', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Ramazan Çetin', ownerPhone: '05321110015',
      note: 'Sahibi yurt dışında, vekaletli satış',
    },
    // İstanbul – Villa & Müstakil
    {
      type: 'VILLA', listingType: 'SALE', title: 'Çekmeköy Müstakil 5+1 Villa',
      city: 'İstanbul', district: 'Çekmeköy', neighborhood: 'Mimar Sinan',
      areaSqm: 320, roomCount: '5+1', price: 24500000,
      features: ['Havuz', 'Bahçe', 'Güvenlik', 'Kapalı Otopark', 'Isıtmalı Havuz'],
      visibility: 'PUBLIC', ownerName: 'Burak Çelik', ownerPhone: '05321110016',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Büyükçekmece Göl Kenarı Villa',
      city: 'İstanbul', district: 'Büyükçekmece', neighborhood: 'Mimaroba',
      areaSqm: 280, roomCount: '4+1', price: 17500000,
      features: ['Bahçe', 'Otopark', 'Göl Manzarası', 'Barbekü Alanı'],
      visibility: 'PUBLIC', ownerName: 'Leyla Saraç', ownerPhone: '05321110017',
    },
    {
      type: 'VILLA', listingType: 'RENT', title: 'Beykoz Kiralık Müstakil Villa',
      city: 'İstanbul', district: 'Beykoz', neighborhood: 'Paşabahçe',
      areaSqm: 350, roomCount: '5+2', price: 180000,
      features: ['Havuz', 'Bahçe', 'Otopark', 'Deniz Manzarası', 'Kapalı Garaj'],
      visibility: 'PUBLIC', ownerName: 'Erkan Toprak', ownerPhone: '05321110018',
    },
    // İstanbul – Ticari
    {
      type: 'SHOP', listingType: 'RENT', title: 'Bağcılar Kiralık İşyeri 80m²',
      city: 'İstanbul', district: 'Bağcılar', neighborhood: 'Kirazlı',
      areaSqm: 80, roomCount: 'Dükkan', price: 28000,
      features: ['Depo', 'Tuvalet', 'Vitrin'],
      visibility: 'PUBLIC', ownerName: 'Orhan Güler', ownerPhone: '05321110019',
    },
    {
      type: 'SHOP', listingType: 'SALE', title: 'Bağcılar Satılık Köşe Dükkan',
      city: 'İstanbul', district: 'Bağcılar', neighborhood: 'Güneşli',
      areaSqm: 150, roomCount: 'Dükkan', price: 8500000,
      features: ['Köşe Başı', 'İki Cepheli', 'Otopark'],
      visibility: 'PUBLIC', ownerName: 'Veli Yıldırım', ownerPhone: '05321110020',
    },
    {
      type: 'OFFICE', listingType: 'SALE', title: 'Maslak Satılık Ofis 200m²',
      city: 'İstanbul', district: 'Sarıyer', neighborhood: 'Maslak',
      areaSqm: 200, roomCount: 'Açık Plan', price: 22000000,
      features: ['Asansör', 'Güvenlik', 'Klima', 'Isıtma', 'Kamera'],
      visibility: 'PUBLIC', ownerName: 'Gürkan Aydın', ownerPhone: '05321110021',
    },
    // Ankara
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Çankaya Çukurambar 3+1',
      city: 'Ankara', district: 'Çankaya', neighborhood: 'Çukurambar',
      areaSqm: 140, roomCount: '3+1', price: 7400000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Elif Arslan', ownerPhone: '05321110022',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Oran 4+1 Müstakil Bahçeli',
      city: 'Ankara', district: 'Çankaya', neighborhood: 'Oran',
      areaSqm: 220, roomCount: '4+1', price: 12800000,
      features: ['Bahçe', 'Otopark', 'Güvenlik', 'Kapalı Mutfak'],
      visibility: 'PUBLIC', ownerName: 'Metin Yavuz', ownerPhone: '05321110023',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Kızılay Kiralık 2+1 Merkezi',
      city: 'Ankara', district: 'Çankaya', neighborhood: 'Kızılay',
      areaSqm: 90, roomCount: '2+1', price: 22000,
      features: ['Asansör', 'Eşyalı', 'Metro Yakını'],
      visibility: 'PUBLIC', ownerName: 'Seda Kaplan', ownerPhone: '05321110024',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Keçiören 3+1 Fiyat Düşürüldü',
      city: 'Ankara', district: 'Keçiören', neighborhood: 'Bağlum',
      areaSqm: 125, roomCount: '3+1', price: 4200000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Kamil Doğan', ownerPhone: '05321110025',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Gölbaşı İmarlı Satılık Arsa',
      city: 'Ankara', district: 'Gölbaşı', neighborhood: 'Tulumtaş',
      areaSqm: 500, roomCount: 'Arsa', price: 3500000,
      features: ['İmarlı', 'Yola Cepheli', 'Elektrik Yakın'],
      visibility: 'PUBLIC', ownerName: 'Necati Acar', ownerPhone: '05321110026',
    },
    // İzmir
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Karşıyaka Deniz Manzaralı 3+1',
      city: 'İzmir', district: 'Karşıyaka', neighborhood: 'Mavişehir',
      areaSqm: 148, roomCount: '3+1', price: 9200000,
      features: ['Asansör', 'Otopark', 'Deniz Manzarası', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Gizem Polat', ownerPhone: '05321110027',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Bornova 2+1 Üniversite Yakını',
      city: 'İzmir', district: 'Bornova', neighborhood: 'Altındağ',
      areaSqm: 95, roomCount: '2+1', price: 4800000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Hakan Çavuş', ownerPhone: '05321110028',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Çeşme Alaçatı Satılık Villa',
      city: 'İzmir', district: 'Çeşme', neighborhood: 'Alaçatı',
      areaSqm: 260, roomCount: '4+1', price: 32000000,
      features: ['Havuz', 'Bahçe', 'Deniz Manzarası', 'Klima', 'Barbekü'],
      visibility: 'PUBLIC', ownerName: 'Sibel Demirci', ownerPhone: '05321110029',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Alsancak Kiralık 1+1 Mobilyalı',
      city: 'İzmir', district: 'Konak', neighborhood: 'Alsancak',
      areaSqm: 60, roomCount: '1+1', price: 18000,
      features: ['Eşyalı', 'Klima', 'Deniz Yakını'],
      visibility: 'PUBLIC', ownerName: 'Ufuk Özer', ownerPhone: '05321110030',
    },
    // Bursa
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Nilüfer Beşevler 3+1 Lüks',
      city: 'Bursa', district: 'Nilüfer', neighborhood: 'Beşevler',
      areaSqm: 165, roomCount: '3+1', price: 6800000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Balkon', 'Amerikan Mutfak'],
      visibility: 'PUBLIC', ownerName: 'Tolga Karakaş', ownerPhone: '05321110031',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Osmangazi 2+1 Tarihi Bölge',
      city: 'Bursa', district: 'Osmangazi', neighborhood: 'Heykel',
      areaSqm: 102, roomCount: '2+1', price: 3600000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Leman Bayrak', ownerPhone: '05321110032',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Mudanya Yatırımlık Arsa',
      city: 'Bursa', district: 'Mudanya', neighborhood: 'Güzelyalı',
      areaSqm: 800, roomCount: 'Arsa', price: 4200000,
      features: ['Deniz Yakını', 'İmarlı', 'Yola Cepheli'],
      visibility: 'PUBLIC', ownerName: 'Kadir Soylu', ownerPhone: '05321110033',
    },
    // Antalya
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Tatil Beldesi Dairesi',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 150, roomCount: '3+1', price: 8500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Güvenlik', 'Klima'],
      visibility: 'PUBLIC', ownerName: 'Aslı Yiğit', ownerPhone: '05321110034',
    },
    {
      type: 'VILLA', listingType: 'RENT', title: 'Belek Kiralık Yazlık Villa',
      city: 'Antalya', district: 'Serik', neighborhood: 'Belek',
      areaSqm: 300, roomCount: '5+1', price: 120000,
      features: ['Havuz', 'Bahçe', 'Klima', 'Barbekü', 'Deniz Yakını'],
      visibility: 'PUBLIC', ownerName: 'Arda Erdem', ownerPhone: '05321110035',
      note: 'Yaz sezonu kiralamaya uygun, sezonluk fiyat',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı Sahil 2+1',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Hurma',
      areaSqm: 100, roomCount: '2+1', price: 5200000,
      features: ['Asansör', 'Balkon', 'Deniz Manzarası', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Nalan Bozkurt', ownerPhone: '05321110036',
    },
    // Bodrum & Muğla
    {
      type: 'VILLA', listingType: 'SALE', title: 'Yalıkavak Sıfır Lüks Villa',
      city: 'Muğla', district: 'Bodrum', neighborhood: 'Yalıkavak',
      areaSqm: 420, roomCount: '5+2', price: 85000000,
      features: ['Havuz', 'Deniz Manzarası', 'Özel İskele', 'Klima', 'Akıllı Ev'],
      visibility: 'HIDDEN', ownerName: 'Bahadır Esen', ownerPhone: '05321110037',
      note: 'Yabancı yatırımcı, TL değil USD tercih ediyor',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Bitez 2+1 Tatil Dairesi',
      city: 'Muğla', district: 'Bodrum', neighborhood: 'Bitez',
      areaSqm: 85, roomCount: '2+1', price: 9800000,
      features: ['Havuz', 'Site İçi', 'Güvenlik', 'Klima'],
      visibility: 'PUBLIC', ownerName: 'Serpil Akgün', ownerPhone: '05321110038',
    },
    {
      type: 'VILLA', listingType: 'RENT', title: 'Türkbükü Kiralık Butik Villa',
      city: 'Muğla', district: 'Bodrum', neighborhood: 'Türkbükü',
      areaSqm: 380, roomCount: '4+1', price: 250000,
      features: ['Havuz', 'Bahçe', 'Deniz Manzarası', 'Klima', 'Barbekü'],
      visibility: 'PUBLIC', ownerName: 'Volkan Sümer', ownerPhone: '05321110039',
    },
    // Trabzon & Karadeniz
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Trabzon Merkez 3+1 Doğa Manzaralı',
      city: 'Trabzon', district: 'Ortahisar', neighborhood: 'Kemerkaya',
      areaSqm: 118, roomCount: '3+1', price: 3200000,
      features: ['Asansör', 'Balkon', 'Doğalgaz', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Harun Keleş', ownerPhone: '05321110040',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Rize İmarlı Tarla',
      city: 'Rize', district: 'Merkez', neighborhood: 'Çayeli',
      areaSqm: 2500, roomCount: 'Arsa', price: 1800000,
      features: ['Tarla', 'Çay Bahçesi', 'Yola Cepheli'],
      visibility: 'PUBLIC', ownerName: 'Zeki Temel', ownerPhone: '05321110041',
    },
    // Konya & İç Anadolu
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konya Selçuklu 4+1 Geniş Aile',
      city: 'Konya', district: 'Selçuklu', neighborhood: 'Musalla',
      areaSqm: 190, roomCount: '4+1', price: 4600000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Kapalı Mutfak'],
      visibility: 'PUBLIC', ownerName: 'Ahmet Kuru', ownerPhone: '05321110042',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Konya Karatay Sanayi Arsası',
      city: 'Konya', district: 'Karatay', neighborhood: 'Organize Sanayi',
      areaSqm: 1200, roomCount: 'Arsa', price: 7200000,
      features: ['İmarlı', 'Sanayi Bölgesi', 'Tır Erişimli'],
      visibility: 'PUBLIC', ownerName: 'Fatih Öztürk', ownerPhone: '05321110043',
    },
    // Gaziantep & Güneydoğu
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Gaziantep Şahinbey 3+1 Sıfır',
      city: 'Gaziantep', district: 'Şahinbey', neighborhood: 'Gazikent',
      areaSqm: 145, roomCount: '3+1', price: 3400000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Sıfır Yapı'],
      visibility: 'PUBLIC', ownerName: 'Mustafa Uzun', ownerPhone: '05321110044',
    },
    // İstanbul – Farklı ek ilanlar
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Sarıyer Tarabya 3+1 Boğaz Manzaralı',
      city: 'İstanbul', district: 'Sarıyer', neighborhood: 'Tarabya',
      areaSqm: 162, roomCount: '3+1', price: 21500000,
      features: ['Asansör', 'Otopark', 'Boğaz Manzarası', 'Güvenlik', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Cem Atakan', ownerPhone: '05321110045',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Bakırköy Ataköy Marina 2+1',
      city: 'İstanbul', district: 'Bakırköy', neighborhood: 'Ataköy',
      areaSqm: 108, roomCount: '2+1', price: 10800000,
      features: ['Asansör', 'Otopark', 'Deniz Manzarası', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'İpek Altan', ownerPhone: '05321110046',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Taksim Beyoğlu Kiralık 2+1',
      city: 'İstanbul', district: 'Beyoğlu', neighborhood: 'Cihangir',
      areaSqm: 80, roomCount: '2+1', price: 55000,
      features: ['Asansör', 'Eşyalı', 'Merkezi Konum', 'Tarihi Bina'],
      visibility: 'PUBLIC', ownerName: 'Kaan Dursun', ownerPhone: '05321110047',
    },
    {
      type: 'HOTEL', listingType: 'SALE', title: 'Sultanahmet Butik Otel Satılık',
      city: 'İstanbul', district: 'Fatih', neighborhood: 'Sultanahmet',
      areaSqm: 650, roomCount: '12 Oda', price: 95000000,
      features: ['Restoran', 'Güvenlik', 'Klima', 'Tarihi Yapı', 'Manzara'],
      visibility: 'HIDDEN', ownerName: 'Recep Turgut', ownerPhone: '05321110048',
      note: 'Çalışır durumda, envanter dahil satış',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Bahçelievler 3+1 Yatırımlık',
      city: 'İstanbul', district: 'Bahçelievler', neighborhood: 'Şirinevler',
      areaSqm: 118, roomCount: '3+1', price: 6900000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Metro Yakını'],
      visibility: 'PUBLIC', ownerName: 'Gül Aksoy', ownerPhone: '05321110049',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Zeytinburnu 2+1 Hızlı Satış',
      city: 'İstanbul', district: 'Zeytinburnu', neighborhood: 'Kazlıçeşme',
      areaSqm: 92, roomCount: '2+1', price: 5400000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Bülent Saygı', ownerPhone: '05321110050',
      note: 'Sahibi acil satmak istiyor, pazarlık payı var',
    },
    // --- Ek 50 portföy ---
    // İstanbul – Kadıköy & Moda
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Moda Sahil 1+1 Stüdyo',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Moda',
      areaSqm: 52, roomCount: '1+1', price: 6800000,
      features: ['Asansör', 'Deniz Manzarası', 'Yüksek Kat'],
      visibility: 'PUBLIC', ownerName: 'Sinem Ateş', ownerPhone: '05321120001',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Moda Kiralık 3+1 Bahçeli',
      city: 'İstanbul', district: 'Kadıköy', neighborhood: 'Moda',
      areaSqm: 140, roomCount: '3+1', price: 68000,
      features: ['Bahçe', 'Eşyalı', 'Klima', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Ercan Koç', ownerPhone: '05321120002',
    },
    // İstanbul – Beşiktaş & Çevresi
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Bebek 2+1 Boğaz Manzaralı',
      city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Bebek',
      areaSqm: 115, roomCount: '2+1', price: 28500000,
      features: ['Asansör', 'Boğaz Manzarası', 'Güvenlik', 'Otopark'],
      visibility: 'PUBLIC', ownerName: 'Özge Yılmaz', ownerPhone: '05321120003',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Etiler 4+1 Rezidans',
      city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Etiler',
      areaSqm: 220, roomCount: '4+1', price: 38000000,
      features: ['Asansör', 'Havuz', 'Güvenlik', 'Fitness', 'Konsiyerj'],
      visibility: 'HIDDEN', ownerName: 'Serkan Demiroğlu', ownerPhone: '05321120004',
      note: 'Sahibi yurt dışında, telefon görüşmesi öncesinde mesaj atılması gerekiyor',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Beşiktaş Merkez Kiralık 2+1',
      city: 'İstanbul', district: 'Beşiktaş', neighborhood: 'Sinanpaşa',
      areaSqm: 95, roomCount: '2+1', price: 48000,
      features: ['Asansör', 'Eşyalı', 'Merkezi Isıtma'],
      visibility: 'PUBLIC', ownerName: 'Oya Çelik', ownerPhone: '05321120005',
    },
    // İstanbul – Fatih & Tarihi Yarımada
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Balat Restore Edilmiş Tarihi Bina',
      city: 'İstanbul', district: 'Fatih', neighborhood: 'Balat',
      areaSqm: 88, roomCount: '2+1', price: 7200000,
      features: ['Restore Edilmiş', 'Ahşap Tavan', 'Tarihi Bina'],
      visibility: 'PUBLIC', ownerName: 'Murat Balcı', ownerPhone: '05321120006',
    },
    {
      type: 'SHOP', listingType: 'RENT', title: 'Kapalıçarşı Yakını Kiralık Dükkan',
      city: 'İstanbul', district: 'Fatih', neighborhood: 'Mercan',
      areaSqm: 45, roomCount: 'Dükkan', price: 35000,
      features: ['Vitrin', 'Depo', 'Turist Bölgesi'],
      visibility: 'PUBLIC', ownerName: 'Hasan Yıldız', ownerPhone: '05321120007',
    },
    // İstanbul – Avrupa Yakası Devam
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Florya Sahil 3+1 Sıfır',
      city: 'İstanbul', district: 'Bakırköy', neighborhood: 'Florya',
      areaSqm: 165, roomCount: '3+1', price: 14500000,
      features: ['Asansör', 'Otopark', 'Site İçi', 'Havuz', 'Deniz Yakını'],
      visibility: 'PUBLIC', ownerName: 'Eser Tunç', ownerPhone: '05321120008',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Silivri Plaj Yanı 2+1',
      city: 'İstanbul', district: 'Silivri', neighborhood: 'Selimpaşa',
      areaSqm: 90, roomCount: '2+1', price: 3200000,
      features: ['Balkon', 'Deniz Manzarası', 'Bahçe Katı'],
      visibility: 'PUBLIC', ownerName: 'Adnan Kurt', ownerPhone: '05321120009',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Silivri İmarlı Konut Arsası',
      city: 'İstanbul', district: 'Silivri', neighborhood: 'Alibey',
      areaSqm: 600, roomCount: 'Arsa', price: 2800000,
      features: ['İmarlı', 'Köşe Parsel', 'Altyapılı'],
      visibility: 'PUBLIC', ownerName: 'Rıfat Özden', ownerPhone: '05321120010',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Hadımköy Lüks Site Villası',
      city: 'İstanbul', district: 'Arnavutköy', neighborhood: 'Hadımköy',
      areaSqm: 380, roomCount: '5+1', price: 18500000,
      features: ['Havuz', 'Bahçe', 'Güvenlik', 'Kapalı Otopark', 'Akıllı Ev'],
      visibility: 'PUBLIC', ownerName: 'Ferhat Kaplan', ownerPhone: '05321120011',
    },
    // İstanbul – Anadolu Yakası Devam
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kartal 3+1 Deniz Manzaralı',
      city: 'İstanbul', district: 'Kartal', neighborhood: 'Yakacık',
      areaSqm: 132, roomCount: '3+1', price: 8600000,
      features: ['Asansör', 'Balkon', 'Deniz Manzarası', 'Otopark'],
      visibility: 'PUBLIC', ownerName: 'Gülşen Arık', ownerPhone: '05321120012',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Tuzla Marina Kiralık 2+1',
      city: 'İstanbul', district: 'Tuzla', neighborhood: 'Aydınlı',
      areaSqm: 98, roomCount: '2+1', price: 30000,
      features: ['Asansör', 'Balkon', 'Site İçi', 'Çocuk Oyun Alanı'],
      visibility: 'PUBLIC', ownerName: 'Kerem Aslan', ownerPhone: '05321120013',
    },
    {
      type: 'OFFICE', listingType: 'RENT', title: 'Ümraniye Dudullu Kiralık Ofis',
      city: 'İstanbul', district: 'Ümraniye', neighborhood: 'Dudullu',
      areaSqm: 180, roomCount: 'Açık Plan', price: 65000,
      features: ['Asansör', 'Güvenlik', 'Klima', 'Toplantı Odası'],
      visibility: 'PUBLIC', ownerName: 'Tolgahan Sahin', ownerPhone: '05321120014',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Sultanbeyli 3+1 Sıfır Teslim',
      city: 'İstanbul', district: 'Sultanbeyli', neighborhood: 'Mehmet Akif',
      areaSqm: 128, roomCount: '3+1', price: 4900000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Sıfır Yapı'],
      visibility: 'PUBLIC', ownerName: 'Cemil Yavuz', ownerPhone: '05321120015',
    },
    // Ankara Devam
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Ankara Yenimahalle 3+1 Metro Yakını',
      city: 'Ankara', district: 'Yenimahalle', neighborhood: 'Batıkent',
      areaSqm: 130, roomCount: '3+1', price: 5800000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Metro Yakını'],
      visibility: 'PUBLIC', ownerName: 'Arzu Güler', ownerPhone: '05321120016',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Ankara Beysukent Müstakil Villa',
      city: 'Ankara', district: 'Yenimahalle', neighborhood: 'Beysukent',
      areaSqm: 290, roomCount: '4+1', price: 11200000,
      features: ['Bahçe', 'Otopark', 'Kapalı Garaj', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Cüneyt Duman', ownerPhone: '05321120017',
    },
    {
      type: 'OFFICE', listingType: 'SALE', title: 'Ankara Söğütözü Satılık Ofis',
      city: 'Ankara', district: 'Çankaya', neighborhood: 'Söğütözü',
      areaSqm: 250, roomCount: 'Açık Plan', price: 14000000,
      features: ['Asansör', 'Güvenlik', 'Klima', 'Otopark', 'Manzara'],
      visibility: 'PUBLIC', ownerName: 'Nuri Özkan', ownerPhone: '05321120018',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Ankara Kızılay 1+1 Eşyalı',
      city: 'Ankara', district: 'Çankaya', neighborhood: 'Kızılay',
      areaSqm: 58, roomCount: '1+1', price: 14000,
      features: ['Asansör', 'Eşyalı', 'Merkezi Konum'],
      visibility: 'PUBLIC', ownerName: 'Betül Aşık', ownerPhone: '05321120019',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Ankara Mamak Yatırımlık Arsa',
      city: 'Ankara', district: 'Mamak', neighborhood: 'Hüseyin Gazi',
      areaSqm: 350, roomCount: 'Arsa', price: 1600000,
      features: ['İmarlı', 'Yola Cepheli'],
      visibility: 'PUBLIC', ownerName: 'Yaşar Polat', ownerPhone: '05321120020',
    },
    // İzmir Devam
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'İzmir Konak Tarihi 2+1',
      city: 'İzmir', district: 'Konak', neighborhood: 'Konak Merkez',
      areaSqm: 100, roomCount: '2+1', price: 5500000,
      features: ['Asansör', 'Deniz Manzarası', 'Tarihi Bina'],
      visibility: 'PUBLIC', ownerName: 'Lütfü Çetin', ownerPhone: '05321120021',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Urla Denize Yakın 3+1 Villa Tipi',
      city: 'İzmir', district: 'Urla', neighborhood: 'Bademler',
      areaSqm: 180, roomCount: '3+1', price: 14200000,
      features: ['Bahçe', 'Otopark', 'Deniz Yakını', 'Barbekü'],
      visibility: 'PUBLIC', ownerName: 'Süleyman Kaya', ownerPhone: '05321120022',
    },
    {
      type: 'VILLA', listingType: 'RENT', title: 'Seferihisar Kiralık Yazlık',
      city: 'İzmir', district: 'Seferihisar', neighborhood: 'Sığacık',
      areaSqm: 200, roomCount: '3+1', price: 75000,
      features: ['Bahçe', 'Havuz', 'Deniz Yakını', 'Barbekü'],
      visibility: 'PUBLIC', ownerName: 'Dilek Kocaman', ownerPhone: '05321120023',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'İzmir Gaziemir 2+1 Metro Yakını',
      city: 'İzmir', district: 'Gaziemir', neighborhood: 'İnönü',
      areaSqm: 88, roomCount: '2+1', price: 4100000,
      features: ['Asansör', 'Balkon', 'Metro Yakını'],
      visibility: 'PUBLIC', ownerName: 'Barış Kılıç', ownerPhone: '05321120024',
    },
    // Muğla & Ege Devam
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Marmaris Şehir Merkezi 2+1',
      city: 'Muğla', district: 'Marmaris', neighborhood: 'Tepe Mah.',
      areaSqm: 96, roomCount: '2+1', price: 7800000,
      features: ['Asansör', 'Balkon', 'Deniz Manzarası', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Zekai Acar', ownerPhone: '05321120025',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Fethiye Hisarönü Satılık Villa',
      city: 'Muğla', district: 'Fethiye', neighborhood: 'Hisarönü',
      areaSqm: 310, roomCount: '4+2', price: 22000000,
      features: ['Havuz', 'Bahçe', 'Klima', 'Barbekü', 'Dağ Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Tekin Bulut', ownerPhone: '05321120026',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Bodrum Gümbet Kiralık 1+1',
      city: 'Muğla', district: 'Bodrum', neighborhood: 'Gümbet',
      areaSqm: 55, roomCount: '1+1', price: 35000,
      features: ['Havuz', 'Site İçi', 'Klima', 'Eşyalı'],
      visibility: 'PUBLIC', ownerName: 'Altan Yıldız', ownerPhone: '05321120027',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Datça Yarımada Arsa',
      city: 'Muğla', district: 'Datça', neighborhood: 'Hızırşah',
      areaSqm: 1500, roomCount: 'Arsa', price: 5500000,
      features: ['Deniz Manzarası', 'Zeytinlik', 'İmarlı'],
      visibility: 'HIDDEN', ownerName: 'Ruhi Sezer', ownerPhone: '05321120028',
      note: 'Sahibi yargılama sürecinde, tapu tescili bekleniyor',
    },
    // Antalya Devam
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya Mahmutlar 2+1 Tatil',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Mahmutlar',
      areaSqm: 85, roomCount: '2+1', price: 4200000,
      features: ['Havuz', 'Site İçi', 'Klima', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Güray Şen', ownerPhone: '05321120029',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Side Antik Şehir Yanı 3+1',
      city: 'Antalya', district: 'Manavgat', neighborhood: 'Side',
      areaSqm: 140, roomCount: '3+1', price: 6900000,
      features: ['Havuz', 'Güvenlik', 'Site İçi', 'Deniz Yakını'],
      visibility: 'PUBLIC', ownerName: 'Tuna Bozkurt', ownerPhone: '05321120030',
    },
    {
      type: 'HOTEL', listingType: 'SALE', title: 'Kaş Butik Pansiyon 8 Oda',
      city: 'Antalya', district: 'Kaş', neighborhood: 'Çukurbağ',
      areaSqm: 450, roomCount: '8 Oda', price: 28000000,
      features: ['Deniz Manzarası', 'Teras', 'Restoran', 'Otopark'],
      visibility: 'PUBLIC', ownerName: 'Filiz Sarıoğlu', ownerPhone: '05321120031',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Kemer Beldibi Lüks Villa',
      city: 'Antalya', district: 'Kemer', neighborhood: 'Beldibi',
      areaSqm: 350, roomCount: '5+1', price: 19500000,
      features: ['Havuz', 'Bahçe', 'Dağ Manzarası', 'Deniz Yakını', 'Kapalı Garaj'],
      visibility: 'PUBLIC', ownerName: 'Osman Çınar', ownerPhone: '05321120032',
    },
    // Bursa Devam
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Bursa Görükle Kiralık 3+1',
      city: 'Bursa', district: 'Nilüfer', neighborhood: 'Görükle',
      areaSqm: 135, roomCount: '3+1', price: 20000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Üniversite Yakını'],
      visibility: 'PUBLIC', ownerName: 'Necla Çınar', ownerPhone: '05321120033',
    },
    {
      type: 'VILLA', listingType: 'SALE', title: 'Mudanya Sahil Müstakil Ev',
      city: 'Bursa', district: 'Mudanya', neighborhood: 'Tirilye',
      areaSqm: 240, roomCount: '4+1', price: 9800000,
      features: ['Bahçe', 'Deniz Manzarası', 'Otopark', 'Depo'],
      visibility: 'PUBLIC', ownerName: 'İlhan Güneş', ownerPhone: '05321120034',
    },
    {
      type: 'SHOP', listingType: 'SALE', title: 'Bursa Çarşı İçi Satılık Dükkan',
      city: 'Bursa', district: 'Osmangazi', neighborhood: 'Setbaşı',
      areaSqm: 60, roomCount: 'Dükkan', price: 4500000,
      features: ['Vitrin', 'Isıtma', 'Tarihi Çarşı İçi'],
      visibility: 'PUBLIC', ownerName: 'Suat Taşkın', ownerPhone: '05321120035',
    },
    // Diğer Şehirler
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Eskişehir Tepebaşı 3+1 Merkezi',
      city: 'Eskişehir', district: 'Tepebaşı', neighborhood: 'Emek',
      areaSqm: 125, roomCount: '3+1', price: 3800000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Hüsnü Başar', ownerPhone: '05321120036',
    },
    {
      type: 'APARTMENT', listingType: 'RENT', title: 'Eskişehir Öğrenci Bölgesi 1+1',
      city: 'Eskişehir', district: 'Odunpazarı', neighborhood: 'Yıldıztepe',
      areaSqm: 50, roomCount: '1+1', price: 8500,
      features: ['Eşyalı', 'Üniversite Yakını'],
      visibility: 'PUBLIC', ownerName: 'Petek Alkan', ownerPhone: '05321120037',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Samsun Atakum Sahil 3+1',
      city: 'Samsun', district: 'Atakum', neighborhood: 'Atakent',
      areaSqm: 138, roomCount: '3+1', price: 4600000,
      features: ['Asansör', 'Balkon', 'Deniz Manzarası', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Tahsin Öz', ownerPhone: '05321120038',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Samsun Canik Tarım Arazisi',
      city: 'Samsun', district: 'Canik', neighborhood: 'Gelemen',
      areaSqm: 5000, roomCount: 'Arsa', price: 2200000,
      features: ['Tarım Arazisi', 'Sulama İmkânı', 'Yola Cepheli'],
      visibility: 'PUBLIC', ownerName: 'Yılmaz Dere', ownerPhone: '05321120039',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Mersin Mezitli Yeni Bina 2+1',
      city: 'Mersin', district: 'Mezitli', neighborhood: 'Davultepe',
      areaSqm: 100, roomCount: '2+1', price: 3100000,
      features: ['Asansör', 'Balkon', 'Deniz Manzarası', 'Sıfır Yapı'],
      visibility: 'PUBLIC', ownerName: 'Caner Ak', ownerPhone: '05321120040',
    },
    {
      type: 'VILLA', listingType: 'RENT', title: 'Mersin Erdemli Kiralık Yazlık',
      city: 'Mersin', district: 'Erdemli', neighborhood: 'Kızkalesi',
      areaSqm: 180, roomCount: '3+1', price: 45000,
      features: ['Bahçe', 'Deniz Yakını', 'Klima', 'Barbekü'],
      visibility: 'PUBLIC', ownerName: 'Alp Güçlü', ownerPhone: '05321120041',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kayseri Kocasinan 3+1 Uygun Fiyat',
      city: 'Kayseri', district: 'Kocasinan', neighborhood: 'Gesi',
      areaSqm: 135, roomCount: '3+1', price: 2900000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Fikret Uzun', ownerPhone: '05321120042',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Diyarbakır Kayapınar 4+1',
      city: 'Diyarbakır', district: 'Kayapınar', neighborhood: 'Diclekent',
      areaSqm: 175, roomCount: '4+1', price: 3600000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Kapalı Mutfak'],
      visibility: 'PUBLIC', ownerName: 'Cemal Arslan', ownerPhone: '05321120043',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Şanlıurfa Haliliye 3+1 Sıfır',
      city: 'Şanlıurfa', district: 'Haliliye', neighborhood: 'Bediüzzaman',
      areaSqm: 142, roomCount: '3+1', price: 2800000,
      features: ['Asansör', 'Otopark', 'Güvenlik', 'Sıfır Yapı'],
      visibility: 'PUBLIC', ownerName: 'Kasım Demir', ownerPhone: '05321120044',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Malatya Battalgazi 2+1',
      city: 'Malatya', district: 'Battalgazi', neighborhood: 'İnönü',
      areaSqm: 105, roomCount: '2+1', price: 2100000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Ömer Çetin', ownerPhone: '05321120045',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Erzurum Yakutiye 3+1 Isıtmalı',
      city: 'Erzurum', district: 'Yakutiye', neighborhood: 'Atatürk',
      areaSqm: 148, roomCount: '3+1', price: 2400000,
      features: ['Merkezi Isıtma', 'Otopark', 'Asansör', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Taner Özgür', ownerPhone: '05321120046',
    },
    {
      type: 'LAND', listingType: 'SALE', title: 'Çanakkale Gelibolu Tarım Arazisi',
      city: 'Çanakkale', district: 'Gelibolu', neighborhood: 'Bolayır',
      areaSqm: 8000, roomCount: 'Arsa', price: 3200000,
      features: ['Tarım Arazisi', 'Sulak Alan Yakını', 'Yola Cepheli'],
      visibility: 'PUBLIC', ownerName: 'Nail Karahan', ownerPhone: '05321120047',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Sakarya Adapazarı 3+1 Yeni',
      city: 'Sakarya', district: 'Adapazarı', neighborhood: 'Mithatpaşa',
      areaSqm: 130, roomCount: '3+1', price: 3500000,
      features: ['Asansör', 'Otopark', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Muzaffer Doğan', ownerPhone: '05321120048',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Denizli Pamukkale Yakını 2+1',
      city: 'Denizli', district: 'Merkezefendi', neighborhood: 'Gürlek',
      areaSqm: 98, roomCount: '2+1', price: 2700000,
      features: ['Asansör', 'Balkon', 'Doğalgaz'],
      visibility: 'PUBLIC', ownerName: 'Selim Baş', ownerPhone: '05321120049',
    },
    {
      type: 'HOTEL', listingType: 'RENT', title: 'Trabzon Sahil Kiralık Butik Otel',
      city: 'Trabzon', district: 'Ortahisar', neighborhood: 'İskenderpaşa',
      areaSqm: 800, roomCount: '15 Oda', price: 180000,
      features: ['Deniz Manzarası', 'Restoran', 'Otopark', 'Klima'],
      visibility: 'HIDDEN', ownerName: 'Sabri Yılmaz', ownerPhone: '05321120050',
      note: 'Sezonluk kiralama, Mayıs-Ekim arası müsait',
    },

    // ════════════════════════════════════════════════════════════════════════
    // PUANLAMA TESTİ — Antalya Seti (50 portföy)
    //
    // Bu portföyler aşağıdaki taleple test edilmek üzere tasarlanmıştır:
    //   Şehir       : Antalya
    //   İlçe        : Muratpaşa   (neighbourhood: Lara)
    //   Tip         : APARTMENT / SALE
    //   Bütçe       : 5.000.000 – 8.000.000 ₺  (hard tavan = 8.800.000)
    //   Oda         : 3+1           (hard min floor ordinal = 3)
    //   m²          : 100 – 160
    //   Zorunlu     : Asansör
    //   Bonus (5)   : Havuz | Site İçi | Deniz Manzarası | Balkon | Güvenlik
    //
    // Beklenen davranış:
    //   Grup A (8)  → skor ~90–100  (hard filter GEÇER, tüm boyutlar yüksek)
    //   Grup B (10) → skor ~75–89   (hard filter GEÇER, 1-2 boyut kısmi)
    //   Grup C (12) → skor ~55–74   (hard filter GEÇER, ilçe yanlış)
    //   Grup D (7)  → skor ~40–54   (hard filter GEÇER, ilçe+ek boyut zayıf)
    //   Grup E (5)  → GÖRÜNMEZ      (fiyat > 8.800.000 → hard filter KESER)
    //   Grup F (4)  → GÖRÜNMEZ      (oda = 2+1 → min floor hard filter KESER)
    //   Grup G (4)  → GÖRÜNMEZ      (Asansör yok → mustHave hard filter KESER)
    // ════════════════════════════════════════════════════════════════════════

    // ── Grup A: Mükemmel eşleşme (~90-100) ──────────────────────────────────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Tam İsabetli Satılık',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 130, roomCount: '3+1', price: 6500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Ayhan Karaca', ownerPhone: '05332220001',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Havuzlu Site 4/5 Bonus',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 125, roomCount: '3+1', price: 7200000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Özlem Deniz', ownerPhone: '05332220002',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara Geniş 3+1 Uygun Fiyat',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 145, roomCount: '3+1', price: 5800000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Bahadır Sözer', ownerPhone: '05332220003',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara Yüksek Kat 3+1 Manzaralı',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 110, roomCount: '3+1', price: 6900000,
      features: ['Asansör', 'Site İçi', 'Balkon', 'Güvenlik', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Merve Bulut', ownerPhone: '05332220004',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara Lüks Konut 3+1 Tam Paket',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 155, roomCount: '3+1', price: 7500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Serdar Koç', ownerPhone: '05332220005',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara Orta Kat 3+1 Hesaplı',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 120, roomCount: '3+1', price: 5500000,
      features: ['Asansör', 'Havuz', 'Balkon', 'Site İçi', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Nilgün Arslan', ownerPhone: '05332220006',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara Bütçe Sınırında 3+1',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 140, roomCount: '3+1', price: 7800000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Tuncay Erdem', ownerPhone: '05332220007',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara Sıfır 3+1 Tüm Özellikler',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 135, roomCount: '3+1', price: 6200000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik', 'Deniz Manzarası'],
      visibility: 'HIDDEN', ownerName: 'Aysun Kara', ownerPhone: '05332220008',
      note: 'Mal sahibi ilanlı çıkmak istemiyor, doğrudan müşteri arıyor',
    },

    // ── Grup B: İyi eşleşme (~75-89) ─────────────────────────────────────────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Muratpaşa Şirinyalı 3+1 Havuzlu',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Şirinyalı',
      areaSqm: 130, roomCount: '3+1', price: 6800000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Candan Yurt', ownerPhone: '05332220009',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 4+1 Geniş Aile Dairesi',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 145, roomCount: '4+1', price: 6500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Ufuk Tan', ownerPhone: '05332220010',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Muratpaşa Fener 3+1 Deniz Yakın',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Fener',
      areaSqm: 138, roomCount: '3+1', price: 7200000,
      features: ['Asansör', 'Havuz', 'Deniz Manzarası', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Pelin Aktaş', ownerPhone: '05332220011',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Fiyat Tavana Yakın',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 118, roomCount: '3+1', price: 8400000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Emre Doğan', ownerPhone: '05332220012',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Muratpaşa Güzeloba 3+1 Sıfır',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Güzeloba',
      areaSqm: 150, roomCount: '3+1', price: 6000000,
      features: ['Asansör', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Gönül Çakır', ownerPhone: '05332220013',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 4+1 Büyük Teras Manzaralı',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 160, roomCount: '4+1', price: 7500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Teoman Sarı', ownerPhone: '05332220014',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Muratpaşa 4+1 Geniş Havuzlu',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Yeşilbahçe',
      areaSqm: 155, roomCount: '4+1', price: 6800000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Jale Kılıç', ownerPhone: '05332220015',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Küçük m² Ucuz Giriş',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 90, roomCount: '3+1', price: 6500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Volkan Şen', ownerPhone: '05332220016',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 5+1 Dublex Büyük m²',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 200, roomCount: '5+1', price: 7000000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Cengiz Bulut', ownerPhone: '05332220017',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Muratpaşa Meltem 4+1 Tam Bonus',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Meltem',
      areaSqm: 140, roomCount: '4+1', price: 5500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Büşra Yıldız', ownerPhone: '05332220018',
    },

    // ── Grup C: Orta eşleşme (~55-74) — ilçe farklı ─────────────────────────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı Hurma 3+1 Tam Bonus',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Hurma',
      areaSqm: 140, roomCount: '3+1', price: 6500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Suat Güneş', ownerPhone: '05332220019',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kepez 3+1 Bütçe Uyumlu',
      city: 'Antalya', district: 'Kepez', neighborhood: 'Yeşildere',
      areaSqm: 130, roomCount: '3+1', price: 7000000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Rüya Kaplan', ownerPhone: '05332220020',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı 4+1 3 Bonus',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Sarısu',
      areaSqm: 145, roomCount: '4+1', price: 6800000,
      features: ['Asansör', 'Havuz', 'Site İçi'],
      visibility: 'PUBLIC', ownerName: 'Fuat Ergin', ownerPhone: '05332220021',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya Mahmutlar 3+1 Deniz Yakın',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Mahmutlar',
      areaSqm: 140, roomCount: '3+1', price: 7200000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası'],
      visibility: 'PUBLIC', ownerName: 'Kıymet Demir', ownerPhone: '05332220022',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Manavgat 3+1 Sahile Yakın',
      city: 'Antalya', district: 'Manavgat', neighborhood: 'Side',
      areaSqm: 135, roomCount: '3+1', price: 5500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Alper Yurt', ownerPhone: '05332220023',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Serik 3+1 Yalnızca Güvenlik',
      city: 'Antalya', district: 'Serik', neighborhood: 'Belek',
      areaSqm: 150, roomCount: '3+1', price: 7500000,
      features: ['Asansör', 'Site İçi', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Damla Çetin', ownerPhone: '05332220024',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı 3+1 Geniş m² Az Bonus',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Liman',
      areaSqm: 175, roomCount: '3+1', price: 6500000,
      features: ['Asansör', 'Havuz', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Tansu Özgür', ownerPhone: '05332220025',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kepez 4+1 Orta Eşleşme',
      city: 'Antalya', district: 'Kepez', neighborhood: 'Duraliler',
      areaSqm: 160, roomCount: '4+1', price: 5900000,
      features: ['Asansör', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Levent Soy', ownerPhone: '05332220026',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Aksu 3+1 İyi Bonus Yanlış İlçe',
      city: 'Antalya', district: 'Aksu', neighborhood: 'Altınova',
      areaSqm: 128, roomCount: '3+1', price: 6200000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Handan Çelik', ownerPhone: '05332220027',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya Oba 3+1 Bonus Orta',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Oba',
      areaSqm: 118, roomCount: '3+1', price: 5800000,
      features: ['Asansör', 'Havuz', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Umut Koçak', ownerPhone: '05332220028',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Döşemealtı 3+1 Doğa İçi Site',
      city: 'Antalya', district: 'Döşemealtı', neighborhood: 'Sütçüler',
      areaSqm: 142, roomCount: '3+1', price: 6600000,
      features: ['Asansör', 'Site İçi', 'Güvenlik', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Gülay Erin', ownerPhone: '05332220029',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Muratpaşa 5+1 Büyük Oda Kaybı',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 218, roomCount: '5+1', price: 7400000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Erman Batı', ownerPhone: '05332220030',
    },

    // ── Grup D: Sınırda eşleşme (~40-54) ────────────────────────────────────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Serik 4+1 Fiyat Tavana Yakın',
      city: 'Antalya', district: 'Serik', neighborhood: 'Taşağıl',
      areaSqm: 145, roomCount: '4+1', price: 8400000,
      features: ['Asansör', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Turan Öz', ownerPhone: '05332220031',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya 5+1 Büyük m² Düşük Skor',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Tosmur',
      areaSqm: 168, roomCount: '5+1', price: 6500000,
      features: ['Asansör', 'Havuz'],
      visibility: 'PUBLIC', ownerName: 'Nevzat Atak', ownerPhone: '05332220032',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kemer 3+1 Taşan m² Pahalı',
      city: 'Antalya', district: 'Kemer', neighborhood: 'Beldibi',
      areaSqm: 185, roomCount: '3+1', price: 8500000,
      features: ['Asansör', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Saim Demir', ownerPhone: '05332220033',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Manavgat 4+1 Büyük m² Az Bonus',
      city: 'Antalya', district: 'Manavgat', neighborhood: 'Şelale',
      areaSqm: 170, roomCount: '4+1', price: 7800000,
      features: ['Asansör', 'Klima'],
      visibility: 'PUBLIC', ownerName: 'Adnan Uslu', ownerPhone: '05332220034',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Serik 5+1 Taşan Her Şey',
      city: 'Antalya', district: 'Serik', neighborhood: 'Belek',
      areaSqm: 172, roomCount: '5+1', price: 8200000,
      features: ['Asansör', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Oya Karaçay', ownerPhone: '05332220035',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Aksu 3+1 Pahalı Taşan m²',
      city: 'Antalya', district: 'Aksu', neighborhood: 'Çallı',
      areaSqm: 155, roomCount: '3+1', price: 8600000,
      features: ['Asansör', 'Site İçi', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Neval Yıldız', ownerPhone: '05332220036',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Finike 5+1 Büyük m² Sıfır Bonus',
      city: 'Antalya', district: 'Finike', neighborhood: 'Turunçova',
      areaSqm: 190, roomCount: '5+1', price: 7000000,
      features: ['Asansör', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'İrfan Yılmaz', ownerPhone: '05332220037',
    },

    // ── Grup E: Hard filter KESER — fiyat > 8.800.000 (5 portföy) ───────────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Fiyat Çok Yüksek (E)',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 140, roomCount: '3+1', price: 9500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Zekai Eren', ownerPhone: '05332220038',
      note: 'TEST-E: fiyat 9.500.000 > tavan 8.800.000 → sonuçta görünmemeli',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Pahalı Lüks (E)',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 160, roomCount: '3+1', price: 10200000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Filiz Pala', ownerPhone: '05332220039',
      note: 'TEST-E: fiyat hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı 3+1 Bütçe Aşımı (E)',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Hurma',
      areaSqm: 130, roomCount: '3+1', price: 8900000,
      features: ['Asansör', 'Site İçi', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Cenap Kara', ownerPhone: '05332220040',
      note: 'TEST-E: 8.900.000 = tam tavan+, kesilmeli',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kepez 3+1 Çok Pahalı (E)',
      city: 'Antalya', district: 'Kepez', neighborhood: 'Varsak',
      areaSqm: 145, roomCount: '3+1', price: 11000000,
      features: ['Asansör', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Zeynep Kurt', ownerPhone: '05332220041',
      note: 'TEST-E: fiyat hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya 3+1 Piyasa Üstü (E)',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Oba',
      areaSqm: 135, roomCount: '3+1', price: 9100000,
      features: ['Asansör', 'Havuz', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Ekrem Sönmez', ownerPhone: '05332220042',
      note: 'TEST-E: fiyat hard filter keser',
    },

    // ── Grup F: Hard filter KESER — oda 2+1 (minFloor=3, 2+1 ordinal=2) ─────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 2+1 Oda Yetersiz (F)',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 95, roomCount: '2+1', price: 6500000,
      features: ['Asansör', 'Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Selda Işık', ownerPhone: '05332220043',
      note: 'TEST-F: 2+1 ordinal=2 < minFloor=3 → sonuçta görünmemeli',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı 2+1 Oda Filtre (F)',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Liman',
      areaSqm: 88, roomCount: '2+1', price: 5800000,
      features: ['Asansör', 'Havuz', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Mithat Ural', ownerPhone: '05332220044',
      note: 'TEST-F: oda hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Kepez 2+1 Hard Filtre (F)',
      city: 'Antalya', district: 'Kepez', neighborhood: 'Duraliler',
      areaSqm: 78, roomCount: '2+1', price: 4200000,
      features: ['Asansör', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Hülya Aslan', ownerPhone: '05332220045',
      note: 'TEST-F: oda hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya 2+1 Küçük Oda (F)',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Tosmur',
      areaSqm: 82, roomCount: '2+1', price: 5100000,
      features: ['Asansör', 'Site İçi', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Nihal Öğüt', ownerPhone: '05332220046',
      note: 'TEST-F: oda hard filter keser',
    },

    // ── Grup G: Hard filter KESER — Asansör yok (mustHave) ──────────────────
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 3+1 Asansörsüz (G)',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 130, roomCount: '3+1', price: 6500000,
      features: ['Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Rıdvan Kol', ownerPhone: '05332220047',
      note: 'TEST-G: Asansör yok → mustHave hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Konyaaltı 3+1 Asansörsüz (G)',
      city: 'Antalya', district: 'Konyaaltı', neighborhood: 'Hurma',
      areaSqm: 140, roomCount: '3+1', price: 7000000,
      features: ['Havuz', 'Site İçi', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Tuğçe Serdar', ownerPhone: '05332220048',
      note: 'TEST-G: Asansör yok → mustHave hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Lara 4+1 Asansörsüz (G)',
      city: 'Antalya', district: 'Muratpaşa', neighborhood: 'Lara',
      areaSqm: 155, roomCount: '4+1', price: 7800000,
      features: ['Havuz', 'Site İçi', 'Deniz Manzarası', 'Balkon', 'Güvenlik'],
      visibility: 'PUBLIC', ownerName: 'Özgür Doğan', ownerPhone: '05332220049',
      note: 'TEST-G: Asansör yok → mustHave hard filter keser',
    },
    {
      type: 'APARTMENT', listingType: 'SALE', title: 'Alanya 3+1 Asansörsüz (G)',
      city: 'Antalya', district: 'Alanya', neighborhood: 'Mahmutlar',
      areaSqm: 120, roomCount: '3+1', price: 5500000,
      features: ['Havuz', 'Site İçi', 'Balkon'],
      visibility: 'PUBLIC', ownerName: 'Melike Çalı', ownerPhone: '05332220050',
      note: 'TEST-G: Asansör yok → mustHave hard filter keser',
    },
  ] as const;

  for (const p of data) {
    await prisma.portfolio.create({ data: { ...p, createdById: ownerId } as any });
  }
  console.log(`[seed] ${data.length} portfolios created.`);
}

async function seedDemands(ownerId: string) {
  const count = await prisma.demand.count();
  if (count > 0) {
    console.log(`[seed] Demands already present (${count}), skipping.`);
    return;
  }

  await prisma.demand.create({
    data: {
      types: ['APARTMENT'],
      listingType: 'SALE',
      regions: ['Kadıköy'],
      city: 'İstanbul',
      district: 'Kadıköy',
      minBudget: 9000000,
      maxBudget: 12000000,
      roomPreferences: ['3+1'],
      minArea: 120,
      maxArea: 180,
      mustHaveFeatures: ['Asansör'],
      bonusFeatures: ['Deniz Manzarası', 'Otopark'],
      customerName: 'Selin Öztürk',
      customerPhone: '05339990001',
      createdById: ownerId,
    } as any,
  });
  console.log('[seed] 1 demand created.');
}

async function main() {
  const admin = await seedAdmin();
  await seedPortfolios(admin.id);
  await seedDemands(admin.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
