# V2 düzenleme akışı — ikinci revizyon

## Değişiklikler

- Set ızgarasındaki Earlier / Later düğmeleri slayt sırasını değiştiriyor. Sıra, tüm screenshot hedefleri ve mevcut dillerde birlikte taşınıyor. Cihaz öğelerinin imageIdx değerleri ve kaynak bağlantısı yuvaları yeni sıraya uyarlanıyor. Header/Search artwork yerleri değişmiyor. Sürükleme zorunlu değil; düğmeler klavyeyle kullanılabiliyor. Kapsam ızgara üstünde açıklanıyor.
- İki cihazlı slaytların Layout panelinde ön/arka cihaz için ayrı screenshot seçimi ve küçük önizleme var. Boş yuvalar seçilemiyor. Bu seçim aktif dilin yerleşiminin parçası; diğer screenshot çıktılarında aynı görsel indekslerini kullanıyor.
- Şablon, slayt yerleşimi ve yerleşim sıfırlamasından önce tek adımlık layout kaydı alınıyor. Undo layout change sadece variant/elements/position alanlarını geri getiriyor; arada yazılan metinler korunuyor. Dil değişimi, sıralama ve proje açma eski geri alma kaydını geçersiz kılıyor.
- Uzun başlıklarda iki satır/beş kelime rehberi görünür. Disabled düğmeler bekleme imleci kullanmıyor; görsel silme hedefi büyütüldü.
- Mobil slayt düzenleme, viewport yüksekliğinde iki bölüme ayrılıyor: üstte oranı korunan kompakt önizleme, altta kendi içinde kayan kontroller. Hassas konumlandırma daha büyük tuval açıyor; ekranda Finish adjusting düğmesi bulunuyor.

## Doğrulama

- Yeni regresyon testi önce reorderSet eksikliği nedeniyle başarısız oldu; uygulamadan sonra beş Node test dosyası geçti. Görsel/metin/dil eşleşmesi, eski preset cihaz indekslerinin uyarlanması, eksik çevirinin yanlışlıkla hazır sayılmaması ve metni koruyan layout geri alma kapsanıyor.
- Bağımsız kod incelemesinde somut regresyon bulunmadı. Ardından mobil tarayıcı kontrolünde yakalanan sabit önizlemenin sekmelerin üstüne binmesi sorunu düzeltildi; ayrı kaydırma alanlarıyla yeniden kontrol edildi.
- Tarayıcı: test projesi içe aktarıldı, set oluşturuldu, ilk slayt ikinci sıraya taşındı; başlık/görsel eşleşmesi korundu. Two devices seçildi; Back device=Screenshot 1 ve Front device=Screenshot 2 ile önizlemede iki ayrı Screen etiketi görüldü. Yerleşim değişikliğinden sonra metin yazılıp geri alındığında yeni metin korundu.
- 390 × 844 görünümde document genişliği 390; preview alt sınırı ve inspector üst sınırı aynı (422.7px). Metin alanı ve önizleme aynı ekranda görünüyor. 1280 × 900 masaüstü görünümünde çift cihaz kontrolleri ve önizleme de kontrol edildi. Geçici viewport ayarı sıfırlandı.
- Tarayıcı kontrolü mevcut OG image renderer kurulum sorusunu yalnız yerel önizlemede kapatan /tmp katmanıyla yapıldı; ürün yapılandırması değiştirilmedi. Test projesi yalnız placeholder görseller içeriyor. Gerçek AI çağrısı, commit veya yayın yapılmadı.

Kanıt görseli: /Users/eozcan/.codex/visualizations/2026/10/18/01a14f11-9d02-7481-a707-58aa0a673de1/v2-mobile-editing.png

## Kalan ayrı kapsam

Mağaza sırası önizlemesi, isteğe bağlı kapanış kartı ve gelişmiş boyut seçimi önceki analizdeki sonraki iyileştirmeler olarak duruyor. Tam cihaz/tarayıcı/çıktı dosyası regresyon matrisi bu turda yeniden çalıştırılmadı.

Son üretim derlemesi (tüm mobil düzeltmeler dahil) `CI=true node --max-old-space-size=8192 node_modules/nuxt/bin/nuxt.mjs build` ile exit 0 tamamlandı. Beş test dosyası geçti; git diff --check temiz. Mevcut sourcemap/Browserslist uyarıları sürüyor.
