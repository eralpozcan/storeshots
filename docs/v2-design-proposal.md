# Storeshots V2 — tasarım önerisi

## Amaç
İlk kez gelen kullanıcının ekran görüntülerini yükleyip tasarımını düzenleyerek indirebilmesi. Mevcut `/editor` varsayılan ve stabil sürüm olarak kalır. Kullanıcı görünür bir `V2` bağlantısıyla `/editor-v2` deneyimine geçer; V2 içinde `Eski editöre dön` bağlantısı bulunur.

## İncelemede bulunanlar
- Çalışma ağacında yalnızca izlenmeyen `docs/` klasörü var; uygulanmış bir V2 sayfası veya QuickStartWizard bileşeni bulunmadı.
- Önceki çalışma `docs/superpowers/plans/2026-07-28-quick-start-wizard.md`: mevcut başlangıç penceresini üç adımlı sihirbazla değiştirmeyi öneriyor. Yeni gereksinim nedeniyle bu değişiklik eski editöre uygulanmayacak.
- Mevcut editör Basics, Screenshots, AI, Headlines ve Style sekmelerini kullanıyor. Üst araç çubuğu iki satır; ayrıca odaklanmış slayt düzenleme ve dışa aktarma mevcut.
- `useScreenshots()` değişiklikleri `saveConfig` üzerinden kaydediyor. V2'nin aynı kaydı doğrudan kullanması eski çalışmayı değiştirebilir; kayıt ayrımı uygulama öncesinde tüm okuma/yazma yollarıyla doğrulanmalı.

## Önerilen akış
1. **Görseller:** Uygulama adı, hedef cihaz ve çoklu görsel yükleme. İkon ve açıklama isteğe bağlı. Mevcut proje dosyasını açma seçeneği erişilebilir.
2. **Tasarım:** Merkezde büyük seçili slayt, altında slayt küçük resimleri. `Templates` tüm slayt setinin yerleşim ritmini tek seçimle değiştirir; `Style > Theme` renk ve görsel tonu yönetir. Seçili slayt gerektiğinde ayrı düzenlenebilir. Template değişikliği metinleri, renkleri ve yüklenmiş görselleri silmez. AI isteğe bağlıdır; anahtarsız düzenleme ve indirme mümkündür.
3. **İndir:** Hedef cihaza uygun mevcut çıktı seçenekleri ve açık bir indirme düğmesi. Çoklu cihaz, boyut ve dil seçenekleri gerektiğinde açılır.

Adımlar arasında geri dönüş serbesttir; mevcut çalışma yeniden açıldığında kurulum dayatılmaz. Boş veya hatalı durumda kullanıcıya bir sonraki işlem gösterilir.

## Yerleşim
```text
Storeshots  V2     Görseller / Tasarım / İndir     Eski editöre dön
----------------------------------------------------------------
Şablon            |                                            |
Metin             |          Seçili slayt önizlemesi             |
Görünüm           |                                            |
Gelişmiş ayarlar   |____________________________________________|
                  |       Slayt küçük resimleri                 |
```
Dar ekranda panel önizlemenin altına taşınır; yatay sayfa taşması olmaz. Kontroller klavyeyle kullanılabilir, görünür odak ve alan etiketleri bulunur. Yükleme/indirme sürerken işlem durumu ve hatalar görünürdür.

## Görsel dil
Mevcut Inter yazı ailesi ve beyaz/mavi ürün dili korunur. Ana metin #111827, yardımcı metin #4B5563, kenarlık #E5E7EB, yüzey #FFFFFF, çalışma alanı #F9FAFB, vurgu #2563EB. Form yazıları okunur boyutta tutulur; etkin adım yalnızca renkle belirtilmez. Dekorasyon yerine önizlemeye alan ayrılır.

## Teknik sınır
Ayrı V2 sayfası ve ihtiyaç kadar yeni arayüz bileşeni; mevcut slayt çizimi, proje formatı ve dışa aktarma mantığı yeniden kullanılır. Editörün tamamını kopyalamaktan kaçınılır. V2 taslağı ayrı kaydedilir; V1 çalışması açık bir kopyalama işlemiyle alınabilir. V2 değişiklikleri V1 kaydına otomatik yazılmaz. Yeni bağımlılık gerekmez.

## Alternatifler
- Yalnız başlangıç sihirbazı: daha küçük değişiklik; düzenleme ekranındaki yoğunluğu çözmez.
- **Öneri: üç aşamalı V2 ve bağlama göre ayarlar:** mevcut yetenekleri kullanarak hem başlangıcı hem düzenlemeyi sadeleştirir.
- Baştan yeni editör motoru: bu ihtiyaç için gereksiz kapsam ve bakım yükü.

## Kabul kontrolleri
- V2'ye geçiş ve eski editöre dönüş çalışır; mevcut V1 tasarımı değişmez.
- Yeni kullanıcı AI anahtarı olmadan görsel yükleyebilir, metin/rengi düzenleyebilir ve çıktı indirebilir.
- Adımlar arasında geçiş ve sayfa yenileme V2 taslağını korur.
- Şablon/proje açma, slayt seçimi ve desteklenen cihaz çıktıları doğrulanır.
- Dar ekran ve klavye akışı tarayıcıda kontrol edilir; üretim derlemesi çalıştırılır.

Durum: İnceleme ve tasarım önerisi hazır. Uygulama kodu değiştirilmedi; tasarım onayı bekleniyor.
