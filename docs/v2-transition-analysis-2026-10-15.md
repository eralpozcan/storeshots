# V1 / V2 geçiş analizi ve Apple görsel desteği

Tarih: 15 Ekim 2026. Kapsam: çalışma ağacındaki mevcut kodun ve önceki tasarım belgelerinin incelenmesi. Bu rapor uygulama değişikliği veya yayın onayı değildir.

## Sonuç

V2 uygulanmaya başlanmış; yalnızca tasarım önerisi aşamasında değil. Ancak yayına hazır olduğu henüz doğrulanmış değil. V1 ve V2 bir süre birlikte sunulacak. V1 kaldırılmayacak, otomatik yönlendirme veya sessiz taslak taşıma yapılmayacak. Kaldırma tarihi bu analizde belirlenmedi.

Mevcut çalışma ağacında V2 sayfası, yardımcıları, testler ve docs/ izlenmeyen dosyalar; ortak bileşenlerde de kaydedilmemiş değişiklikler var. Yayın paketinin bunların tamamını içerdiği doğrulanmalı. Kullanıcının mevcut değişiklikleri korunmalı.

## Mevcut olanlar

| Alan | Kodda görülen durum |
|---|---|
| Ayrı girişler | V1 `/editor`, V2 `/editor-v2`; V1 ve pazarlama menüsünde V2 bağlantısı, V2 içinde Classic editor dönüşü var. |
| V2 akışı | Screenshots → Design → Download; yükleme/değiştirme, slayt seçimi, şablonlar, metin, renk, AI, dil ve yerleşim araçları var. |
| Kayıt ayrımı | V1 `defaults.ts` üzerinden localStorage; V2 `v2-draft.ts` üzerinden ayrı `storeshots-v2` IndexedDB veritabanı. API anahtarları sessionStorage içinde, V2 için ayrı anahtar var. |
| Paylaşılan altyapı | `useScreenshots` isteğe bağlı kayıt adaptörü alıyor; güncelleme ve proje içe aktarma bu adaptörü kullanıyor. PNG yakalama `capture.ts` içine çıkarılmış. |
| Açık proje taşıma | V2 mevcut `importProject` / `exportProject` işlevlerini kullanıyor. Dışa aktarılan projeye API anahtarı yazılmıyor. |

## Açık işler ve riskler

1. **Belgeler geride kalmış.** `docs/v2-design-proposal.md` uygulama yapılmadığını söylüyor; `docs/superpowers/plans/2026-09-07-editor-v2.md` maddeleri işaretlenmemiş. Kodun varlığı ile tarayıcıda doğrulanmış tamamlanma ayrı kaydedilmeli.
2. **Özellik eşitliği eksik.** `app/pages/editor-v2.vue:59` hedefleri Google Play Feature Graphic içermiyor; ortak `Device` tipi ve composable bunu destekliyor. V2'yi V1'in tüm yeteneklerini karşılıyor diye duyurmamak gerekir. V1'deki çoklu cihaz/dil indirme ile V2'nin seçili cihaz ve boyut üzerinden indirmesi ayrıca karşılaştırılmalı.
3. **Eski V2 taslaklarının uyarlanması eksik.** `editor-v2.vue:109` kaydı doğrudan `config.value` içine atıyor. Proje importundaki gibi varsayılanlarla birleştirme yapılmıyor. Yeni görsel alanları eklenmeden önce eski kayıtlar için varsayılan alan tamamlama ve gerekli biçim doğrulaması eklenmeli. IndexedDB şema numarası ile uygulama veri formatı sürümünün farklı kavramlar olduğu korunmalı.
4. **Ortak kod V1'i etkiliyor.** Ayrı route ve depolama, ortak `SlideCard`, `useScreenshots` ve capture değişikliklerinden izolasyon sağlamıyor. Özellikle PNG ölçüleri, yazı tipi, eşlenmiş cihaz görselleri, locale geçişi ve V1 taslağının değişmemesi kontrol edilmeli. V2 kayıt kuyruğu mevcut; hızlı düzenleme ardından hemen sayfadan ayrılma ayrıca denenmeli.
5. **Doğrulama tamamlanmadı.** `node tests/editor-v2.test.cjs` denemesi `Cannot find module 'typescript'` ile başlamadan durdu. Mevcut test yalnız upload yerleştirme, layout uygulama ve export indeks yardımcılarını kapsıyor; IndexedDB, gerçek PNG/ZIP, import, responsive görünüm ve erişilebilirlik doğrulaması değil. Üretim derlemesi ve tarayıcı kontrolleri bu analizde yapılmadı.

## Birlikte çalışma ve duyuru

Önerilen etiketler: **Classic editor (V1)** ve **Editor V2 — Beta**. Ana sayfa, iki editörün giriş alanı, README ve changelog aynı politikayı açıklamalı. Mevcut bağlantılar yanında bu açıklama henüz eklenmeli. Duyuru aşağıdaki metinle hazırlanabilir; bu rapor dışında yayımlanmadı:

> Editor V2 is available in beta with a simpler screenshot creation workflow. The classic editor (V1) and V2 will remain available side by side during the transition. Each editor keeps its own draft. To copy a project, save it from one editor and open the project file in the other. V1 remains available for workflows that are not yet supported in V2.

Türkçe karşılığı:

> Daha sade bir görsel oluşturma akışı sunan Editor V2 beta olarak kullanıma açılıyor. Geçiş süresince klasik editör (V1) ve V2 birlikte kullanılabilecek. Her editör kendi taslağını ayrı saklar. Projenizi diğer editöre kopyalamak için proje dosyasını kaydedip diğer editörde açabilirsiniz. V2'de henüz desteklenmeyen işlemler için V1 kullanılmaya devam edecek.

Yeni Apple alanları eklenince V2 projesinin V1'e geri aktarımında hangi alanların korunacağı açıkça test edilmeli. Yeni alanların eski sürüm tarafından desteklendiği varsayılmamalı.

## Apple: doğrulanmış gereksinimler

Apple'ın 15 Ekim 2026 tarihinde erişilen resmi belgelerine göre:

| Çıktı | Piksel ölçüsü | Uygulama kararı |
|---|---|---|
| iPhone Duo dış ekran | 1398 × 2034 veya 2034 × 1398 | Ayrı portrait/landscape kompozisyon ve görsel yuvaları. |
| iPhone Duo iç ekran | 2007 × 2853 veya 2853 × 2007 | Dış ekrandan bağımsız kompozisyon ve görsel yuvaları. |
| Product page header | 3840 × 1646 (21:9); belgede ayrıca 5244 × 2950 PNG (16:9) | İlk kapsamda 3840 × 1646 sabit görsel; alternatif ayrı çıktı olarak değerlendirilmeli. |
| Search results | 3:2; en az 1920 × 1280, en fazla 3840 × 2560; belgede ayrıca 5244 × 2950 PNG | İlk kapsamda 1920 × 1280 sabit görsel; Header ile ayrı düzenlenebilir. |

Apple screenshot ve creative asset görsellerinde alpha/transparan kanal kabul etmiyor. PNG dosya uzantısı tek başına uyumluluk garantisi değil; son dosyanın ölçüsü ve alpha kanalı denetlenmeli. Mevcut PNG yakalama çıktısı bu açıdan henüz doğrulanmadı.

Apple, iPhone Duo ekran görüntülerini iOS 27.1 SDK veya sonrasını kullanan uygulamalar için Nisan 2027'den itibaren zorunlu olarak belirtiyor. Güncel screenshot belgesi ayrıca iPhone Dynamic Island medium ekran ve destekleniyorsa iPad 13-inch gereksinimlerini listeliyor; mevcut boyut etiketleri bu listeyle karşılaştırılmalı.

Kaynaklar:
- [Apple duyurusu: Showcase your apps with new assets on the App Store — 5 Ekim 2026](https://developer.apple.com/news/?id=ljpl7kyn) — Kullanıcının paylaştığı kaynak. Header/Search creative asset desteğini, yeni önizleme aracını ve Asset Library'yi açıklıyor. Ölçüler aşağıdaki teknik belgelerden alınmalı.
- [Apple screenshot specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)
- [Apple creative assets specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications)
- [Apple asset best practices](https://developer.apple.com/app-store/asset-best-practices/)

Kullanıcı “Apple Duo” ile **iPhone Duo** cihazını kastettiğini doğruladı. Gerçek cihaz çerçevesi yapılacaksa resmi tasarım kaynağı ayrıca doğrulanmalı; mevcut iki telefonlu layout isimleri V2/V6, editör sürümü veya iPhone Duo desteği anlamına gelmiyor.

## Uygulamanın ulaşması gereken yerler

- `app/utils/types.ts`, `defaults.ts`, `canvas.ts`: yeni hedefler, ölçüler, görüntü depoları, kompozisyon presetleri; eski kayıtları tamamlama. Duo'yu yalnız iPhone çıktı boyutu listesine eklemek mevcut uzun telefon tuvalini bozabilir.
- `app/composables/useScreenshots.ts`, `app/pages/editor-v2.vue`: hedef/oryantasyon seçimi, doğru görsel eşlemesi, taslak açma, import/export, AI bağlamı ve indirme adları. Bilinmeyen hedeflerin Android tablet fallback'ine düşmesi engellenmeli.
- `app/components/slides/` ve `SlideCard.vue`: Duo oranlarına uygun çizim; Header/Search için ayrı geniş kompozisyonlar. Mevcut FeatureGraphic öğe çizimi yeniden kullanım açısından incelenmeli; Google Play'in ölçü ve içeriği Apple'a doğrudan taşınmamalı.
- `app/utils/capture.ts`, testler ve proje dosyası uyumluluğu: birebir piksel ölçüsü, alpha içermeyen PNG, ZIP içeriği, eski V1/V2 dosyalarının açılması ve iki taslağın birbirine yazmaması.
- `README.md`, `app/pages/changelog.vue`, `app/layouts/marketing.vue`, editör girişleri: birlikte çalışma ve beta bilgisi. Yeni Apple hedefleri önce V2'ye eklenebilir; V1'in bunları da desteklemesi ayrı kapsam kararıdır, bu analiz bunu uygulanmış saymaz.

## Önerilen uygulama sırası

1. Mevcut V2 dosyalarını koruyarak bağımlılıkları kur; yardımcı testleri ve üretim derlemesini çalıştır; V1/V2 kayıt izolasyonu ve import/export akışını doğrula.
2. Belgeleri gerçek duruma getir; birlikte çalışma duyurusunu ekle; Feature Graphic dahil V1/V2 farklarını kullanıcıya açıkça göster.
3. Yeni alanlardan önce V2 taslak yükleme uyarlamasını ve eski proje uyumluluğunu tamamla.
4. Duo dış/iç ekran ve iki yönü, ardından Header ve Search sabit görsellerini V2'ye ekle. Mevcut renderer ve capture işlevlerini yeniden kullan; yeni editör motoru veya bağımlılık ekleme.
5. Her hedefin son PNG boyutunu ve alpha kanalını dosya seviyesinde doğrula; 390px görünüm, klavye, yeniden yükleme, kota hatası ve V1 regresyon kontrolleri sonrasında beta yayınını değerlendir.

Video oluşturma, App Store Connect'e otomatik yükleme ve V1'i kaldırma bu çalışmanın kapsamında değil. Mevcut kod üzerinde işlevsel değişiklik yapılmadı.
