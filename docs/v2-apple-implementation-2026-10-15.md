# V2 Apple desteği — uygulama notu

## Skill

UI UX Pro Max zaten `/Users/eozcan/.codex/skills/ui-ux-pro-max` altında kurulu. İkinci kurulum yapılmadı; `scripts/search.py` çalıştırılarak Nuxt UI ve görsel ölçekleme rehberine erişim doğrulandı. Kaynak: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

## Değişiklikler

- V1/V2 birlikte çalışma açıklaması iki editöre, pazarlama sayfalarına, README ve changelog'a eklendi. V2 Beta olarak etiketlendi; taslaklar ayrı kalıyor.
- V2'ye iPhone Duo dış/iç ekran ve portrait/landscape seçenekleri, Header 3840 × 1646 ve Search 1920 × 1280 hedefleri eklendi. Her hedef ve Duo yönü ayrı yükleme yuvası kullanıyor.
- Apple görselleri kırpılmadan ve esnetilmeden tuvale sığdırılıyor; boş alan arka plan rengiyle dolduruluyor. Apple için alpha kanalı taşımayan JPEG; mevcut hedefler için PNG kullanılıyor. Yeni Duo donanım çerçevesi uydurulmadı.
- Eski V2 taslakları ve proje dosyaları yeni alanlar için varsayılanlarla tamamlanıyor. Projeden gelen API anahtarı geri yüklenmiyor; açık sekmenin anahtarı korunuyor.
- Google Play Feature Graphic V2'de önizlenip indirilebiliyor. Ayrıntılı öğe düzenleme V1'de kalıyor.
- Tarayıcıda bulunan V2 tek görsel indirme hatası giderildi: güvenlik politikasıyla engellenen `fetch(dataURL)` yerine mevcut JSZip verisi Blob'a dönüştürülüyor.

## Doğrulama

- `node --test tests/*.test.cjs`: yükleme yerleştirme, layout, export indeksleri, Apple ölçüleri/yönler, eski kayıtların tamamlanması, varsayılanların değişmemesi, PNG varsayılan davranışı ve JPEG seçenekleri/cleanup kontrolleri.
- Üretim derlemesi: `node --max-old-space-size=8192 node_modules/nuxt/bin/nuxt.mjs build`. Varsayılan 2 GB Node sınırı Nitro paketlemesinde yetersiz kaldığı için yalnız komutta 8 GB sınırı kullanıldı. Font/analitik derleme kaynakları için ağ erişimi gerekti.
- Bağımsız kod incelemesinde somut hata bulunmadı; sonrasında tarayıcıda saptanan tek görsel indirme sorunu ayrıca düzeltildi.
- Tarayıcı: test projesi içe aktarımı ve kayıt, Header seçimi/ölçüsü ve indirme hazır sonucu, Duo iç ekran landscape 2853 × 2007, ayrı yatay yuvanın boş kalması ve boş indirmelerin kapalı olması kontrol edildi.
- Search hedefinde 390px görünüm: içerik ve viewport genişliği 390px, yatay taşma yok.
- Yerel önizlemede, projeyi değiştirmeyen geçici bir Nuxt katmanı yalnız OG image modülünün ilgisiz kurulum sorusunu kapatmak için kullanıldı. Üretim derlemesi asıl proje ayarlarıyla çalıştırıldı.

## Sınırlar

Bu ilk kapsam yüklenen görselleri uygun çıktıya hazırlar; Apple artwork için yeni bir illüstrasyon/AI görsel üretim motoru veya Duo cihaz maketi eklemez. Video ve App Store'a otomatik yükleme yok. Tam V1 regresyon matrisi ve gerçek indirilen JPEG dosyasının piksel analizi yapılmadı; indirme sonucu tarayıcı bildirimiyle, ölçü/format yolu testlerle doğrulandı. Yayın veya Git commit yapılmadı.
