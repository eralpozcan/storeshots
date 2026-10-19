# V1 / V2 proje aktarımı — son kontrol

## Sonuç

Yerel tarayıcıda V2 → proje dosyası → V1 → proje dosyası → V2 akışı doğrulandı. Kullanıcı gerçek AI sağlayıcı testinin şimdilik atlanmasını açıkça istedi; gerçek sağlayıcı çağrısı yapılmadı.

## Gerçek dosya ve tarayıcı kontrolleri

1. V2 projesi `/Users/eozcan/Downloads/ux-check.storeshots.json` olarak indirildi. İki iPhone ekranı, Duo dış/iç ve Header/Search görselleri; slayt başlıkları ve çift cihaz seçimi; kaynak bilgisi; kapanış kapalı ve tek boyut seçimi dosyada mevcut. API anahtarı boş.
2. Aynı dosya klasik editörde açıldı. App adı ve ikinci slayt başlığı doğrulandı; V1'de app adı `UX roundtrip verified` yapılıp `/Users/eozcan/Downloads/ux-roundtrip-verified.storeshots.json` olarak kaydedildi.
3. İki dosya karşılaştırıldı: images, copy (yerleşimler ve imageIdx dahil), copyByLocale, colors, appleArtwork, v2Workflow ve selectedLocales birebir eşit. Yalnız istenen app adı değişti. API anahtarı her iki dosyada da yok.
4. V1 dosyası V2'ye geri açıldı. Yeni app adı, iki görsel ve `2 files · 1 output · 1 language` özeti korundu. Kapanış/boyut tercihleri kaybolmadı.
5. V2 Slide 2 açıkken geçersiz proje içe aktarıldı. Import failed bildirimi göründü; açık slayt, başlık ve yerleşim korundu.

Tarayıcı indirme/dosya seçicisi otomasyonunda gecikme ve bir başarısız deneme oldu; yeniden denemede dosyalar elde edilip doğrudan içerikleri kontrol edildi. Bu otomasyon sorunu ürün hatası olarak raporlanmadı.

## Bulunan ve düzeltilenler

Ortak importProject, mevcut anahtarı korurken projeden farklı sağlayıcı/model alabiliyordu. Anahtarın ait olduğu sağlayıcıyla bağlantısının bozulmaması için artık mevcut AI bağlantısı (provider, model, apiKey) bütün olarak korunuyor. Bu davranış hem V1 hem V2 için aynı.

İçe aktarma başarı/failure sonucu boolean dönüyor. V2 yalnız başarılı içe aktarmada çalışma görünümünü yeniden kuruyor; geçersiz dosyada kullanıcı açık slaytından çıkarılmıyor. V2'deki yinelenen AI ayarı yazımı kaldırıldı.

## Otomatik doğrulama

Yeni `tests/project-transfer.test.cjs`, gerçek useScreenshots fonksiyonlarını kullanarak:

- farklı sağlayıcıyla kaydedilmiş proje açılınca mevcut bağlantının korunmasını,
- gerçek Blob proje üretimi ve iki editör örneği arasında görseller/diller/Apple/workflow aktarımını,
- anahtarın export dosyasında olmamasını,
- geçersiz importun veri ve kaydı değiştirmemesini,
- anahtarsız AI işlemlerinin sağlayıcı isteği başlatmamasını kontrol ediyor.

Düzeltme öncesi yeni testler sağlayıcı/model değişimi ve başarı sonucu eksikliğiyle başarısız oldu. Sonrasında tüm test komutu 9 başarılı kontrol, 0 hata verdi. Bağımsız kod incelemesinde somut hata bulunmadı. git diff --check temiz.

## Sınırlar

Gerçek AI testi kullanıcı isteğiyle atlandı. Tarayıcı aktarım örneği tek dilli; çoklu dil verisi otomatik aktarım testinde kontrol edildi. Tam cihaz/tarayıcı/çıktı matrisi yeniden çalıştırılmadı. Yayın veya commit yapılmadı.

Kanıt görseli: /Users/eozcan/.codex/visualizations/2026/10/18/01a14f11-9d02-7481-a707-58aa0a673de1/v2-transfer-check.png

Son üretim derlemesi (`CI=true node --max-old-space-size=8192 node_modules/nuxt/bin/nuxt.mjs build`) exit 0 ile tamamlandı. Mevcut sourcemap/Browserslist uyarıları sürüyor.
