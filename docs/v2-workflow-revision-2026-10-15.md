# V2 düzenleme akışı revizyonu

Öncelik: kullanıcının seçtiği genel V2 düzenleme akışını sadeleştirme. Mevcut Nuxt UI ve kurulu UI UX Pro Max skill'i kullanıldı. Skill aramasında form etiketleme rehberi bulundu; gelişmiş araçları gruplama için uygun veri tabanı sonucu bulunmadığından mevcut bileşen düzeni ve platformun native details/summary davranışı esas alındı.

## Değişiklikler

- Ana tasarım ekranı yalnız Templates ve Colors kontrolleriyle açılıyor. Brand, AI ve Languages isteğe bağlı More tools bölümünde duruyor. Bölüm kapanınca Templates'e dönülüyor.
- Slayt kartları üç ayrı hover eylemi yerine tek düğmeyle açılıyor. Enter/Space ile kullanılabiliyor. Slayt açıldığında Text/Layout gösteriliyor; odak başlığa taşınıyor. All slides ile sete dönülüyor.
- İndirme ekranının önizlemesindeki yinelenen düzenleme/indirme düğmeleri kaldırıldı; ekranın ana indirme ve tasarıma dönüş eylemleri korunuyor. V1 kartları değişmedi.
- Bu turda tamamlanan Apple yerleştirme kontrolleri: Fit/Fill, yatay/dikey odak, hedefe ve yöne özel arka plan, sıfırlama. Taslak ve proje dosyalarında saklanıyor. Eski projeler varsayılan Fit davranışıyla açılıyor; önizleme ve çıktı aynı ayarları kullanıyor.

## Doğrulama

- `node --test tests/*.test.cjs`: 2 test dosyası geçti. Yeni kontroller fit/odak normalizasyonu, sınır dışı değerlerin düzeltilmesi ve hedef izolasyonunu kapsıyor.
- `node --max-old-space-size=8192 node_modules/nuxt/bin/nuxt.mjs build`: üretim derlemesi geçti.
- `git diff --check`: geçti.
- Tarayıcıda slaytın Enter ile açılması, Text/Layout görünümü, başlığa odak, All slides dönüşü, AI aracının açılması ve More tools kapatıldığında Templates'e dönüş doğrulandı.
- Header ayarı Fill, yatay odak %0 ve arka plan #213547 olarak kaydedildi; Search varsayılan Fit/%50/önceki arka planını korudu. Yeniden yükleme sonrası Header ayarı korundu. Önizleme ve export DOM'unda fit=cover, odak=0% 50% eşleşti.
- 390px genişlikte tasarım ekranı: document genişliği ve içerik genişliği 390px, yatay taşma yok.

## Sınırlar

Tam V1 regresyon matrisi ve indirilen JPEG dosyalarının piksel analizi bu turda yapılmadı. Yayın veya commit yapılmadı. Fit/Fill ve arka plan aynı hedefin slaytları için ortak; slayt başına ayrı kırpma eklenmedi.
