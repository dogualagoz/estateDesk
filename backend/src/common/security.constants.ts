/**
 * bcrypt maliyet faktörü — tüm şifre hash'leme noktaları bu sabiti kullanır.
 *
 * 10 tur ≈ 100ms/hash: login gecikmesi ile kaba kuvvet maliyeti arasında
 * dengeli bir değer. Artırmak (ör. 12) eski hash'leri bozmaz; bcrypt turu
 * hash'in içinde saklandığından compare geriye dönük çalışır, yalnızca
 * yeni hash'ler güçlenir. (Artırma değerlendirmesi: docs/ROADMAP.md)
 */
export const BCRYPT_ROUNDS = 10;
