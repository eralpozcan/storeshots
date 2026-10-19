# V2 AI kurulumu: bir kez ayarla, üretimde tekrar görme

## Davranış

Üst çubuktaki AI settings penceresi sağlayıcı, API anahtarı ve modeli tek yerde toplar. AI üretim panelinde yalnız yaratıcı yönlendirme ve üretim eylemleri kalır. Bağlantı yoksa bir üretim eylemi ayar penceresini açar; kaydetmek otomatik üretim veya ücretli API çağrısı başlatmaz.

Sağlayıcı/model, tarayıcıda projeden ayrı bir tercih olarak tutulur. Proje dosyası açılması aktif AI bağlantısını değiştirmez. API anahtarı mevcut V2 sessionStorage yolu üzerinden yalnız sekme oturumunda saklanır; sekme kapandıktan sonra yeniden girilmesi gerekir. Kalıcı tercih kaydı açık alan listesi kullanır ve API anahtarını içermez. Başka sekmede sağlayıcı değiştiyse önceki sağlayıcının anahtarı ona aktarılmaz.

Cancel geçici değişiklikleri atar. Save settings seçili model ve anahtar boşsa kapalıdır. Disconnect AI anahtarı kaldırır; sağlayıcı/model tercihini korur. Ayarlı durumu kimlik bilgilerinin mevcut olduğunu belirtir; sağlayıcı tarafından doğrulanmış bağlantı anlamına gelmez.

## Doğrulama

- Tercih kaydı için önce başarısız test görüldü; uygulama sonrası `node --test tests/*.test.cjs` içindeki üç dosya geçti. Kalıcı kayda anahtar yazılmaması, geçersiz/kullanılamayan depolama ve tercih geri yükleme kontrol edildi.
- Tarayıcı: boş anahtarla kaydetmenin kapalı olması, iptal sonrası modelin korunması, sahte test anahtarıyla kaydetme, bağlantının kesilmesi, üretim panelinde anahtar/sağlayıcı/model alanlarının bulunmaması, eksik bağlantıda üretim yerine ayarların açılması doğrulandı. Test anahtarı bağlantıyı kes eylemiyle kaldırıldı; sağlayıcı isteği gönderilmedi.
- UI UX Pro Max'in Nuxt UI rehberindeki erişilebilir modal başlığı/açıklaması ve form etiketi kuralları uygulandı; mevcut UModal/UFormField/UInput bileşenleri kullanıldı.
- Üretim derlemesi `node --max-old-space-size=8192 node_modules/nuxt/bin/nuxt.mjs build` ile geçti; `git diff --check` temiz. Modalın 390px görünümünde içerik genişliği viewport ile eşleşti.

## Sınırlar

Gerçek anahtarla sağlayıcı/model erişimi denenmedi. Anahtarın sekmeler arasında kalıcı saklanması eklenmedi. V1'in ayar akışı bu revizyonun dışında bırakıldı. Yayın veya commit yapılmadı.
