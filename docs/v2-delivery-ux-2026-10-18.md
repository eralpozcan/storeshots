# V2 indirme ve mağaza kontrolü — üçüncü revizyon

## Tamamlananlar

- Set görünümünde kapalı başlayan Download options bölümü var. Kapanış kartı isteğe bağlı; her çıktı için boyutlar daraltılabiliyor. Varsayılan tüm boyutlar. Son boyutun seçimi kaldırılamıyor; Select all sizes ile varsayılana dönülüyor.
- includeClosing ve exportSizes V2 workflow alanında saklanıyor. Taslak/proje geri yükleme ve çıktı hazırlama tercihleri koruyor. V1 exportableSlides davranışı yeni opsiyon parametresinin varsayılanıyla korunuyor.
- Set önizlemesi ve ZIP planı aynı kapanış kartı tercihini kullanıyor. Görseli olan slaytlar kapanış tercihi yüzünden paketten çıkarılmıyor. Başlık özeti gerçek dosya/çıktı/dil sayısını gösteriyor.
- Store preview, aktif hedef ve dildeki ilk üç dahil edilmiş görseli mağaza sırası olarak gösteriyor. Başlık App Store / Google Play olarak değişiyor. Kart seçimi doğru slaytın düzenlemesini açıyor. Feature Graphic ve tekil artwork için sıra önizlemesi sunulmuyor.

## Kontroller

- Yeni test önce beklenen 3 iş yerine 11 iş üretildiğini göstererek başarısız oldu. Uygulama sonrası beş test dosyası geçti; kapanış filtreleme, boyut daraltma, sıfır boyut hatası, restore ve tekrar hazırlıkta tercihlerin korunması kapsanıyor.
- Bağımsız kod incelemesinde somut doğruluk sorunu bulunmadı.
- Tarayıcıda iki ekran + kapanış × dört iPhone boyutu = 12 dosya. Kapanış kapatılıp tek boyut bırakılınca 2 dosya; son checkbox disabled. Yenilemede iki dosyalık seçim korundu.
- Gerçek `/Users/eozcan/Downloads/ux-check-store-package.zip` indirildi. ZIP içindeki iki PNG'nin imzaları ve IHDR ölçüleri 1320 × 2868 olarak doğrulandı. Başka boyut veya kapanış dosyası yok.
- Store preview iki etkin görseli doğru sırada gösterdi; ikinci kart Slide 2 ve doğru başlıkla düzenlemeyi açtı, modal kapandı.
- 390 × 844 görünümde document genişliği 390. Mobil modal görseli kaydedildi: `/Users/eozcan/.codex/visualizations/2026/10/18/01a14f11-9d02-7481-a707-58aa0a673de1/v2-store-preview.png`. Geçici viewport sıfırlandı.
- Yerel tarayıcı testinde önceki /tmp katmanı yalnız OG image kurulum istemini kapatmak için kullanıldı. Ürün yapılandırması değişmedi. Test projesi placeholder görseller içeriyor.

## Kalan yayın kontrolleri

Gerçek sağlayıcıyla AI üretimi ve V1/V2 proje aktarımının son uçtan uca kontrolü henüz bu turda yapılmadı. Tüm cihaz/tarayıcı/boyut matrisinin tamamı yeniden çalıştırılmadı. Bu revizyon yayın veya commit içermiyor.

Son üretim derlemesi tüm ürün değişiklikleriyle exit 0 tamamlandı. Beş Node test dosyası ve git diff --check geçti. Mevcut sourcemap/Browserslist uyarıları devam ediyor.
