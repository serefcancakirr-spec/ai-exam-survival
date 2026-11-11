// Stage 11: Turkish versions of the starter flashcard decks (display only).
// Saved cards stay in English. Turkish mode shows these texts only while a starter deck or card still has
// exactly its original English text — as soon as a student edits it, the student's own text is shown.
// The two English vocabulary decks keep their cards in English (they practise English words).

/** Deck names by starter deck id. */
export const STARTER_DECK_NAMES_TR: Record<string, string> = {
  'starter-english-9-academic-vocabulary': 'Akademik Kelimeler',
  'starter-english-11-advanced-vocabulary': 'İleri Düzey Kelimeler',
  'starter-biology-9-cell-structure': 'Hücrenin Yapısı',
  'starter-biology-10-genetics': 'Genetik ve DNA',
  'starter-mathematics-9-algebra': 'Cebirin Temelleri',
};

/** Card texts by starter card id: [front, answer, explanation]. */
export const STARTER_CARDS_TR: Record<string, [front: string, answer: string, explanation: string]> = {
  'bio9-01': ['Canlılığın temel birimi nedir?', 'Hücre.', 'Hücre teorisi: Bütün canlılar bir ya da daha fazla hücreden oluşur ve yeni hücreler var olan hücrelerden meydana gelir.'],
  'bio9-02': ['Mitokondri', 'Hücresel solunumla besinlerdeki enerjiyi açığa çıkarır.', 'Hücrenin kullanılabilir enerjisi olan ATP’yi üretir; bu yüzden “hücrenin enerji santrali” denir.'],
  'bio9-03': ['Ribozom', 'Protein sentezler.', 'Ribozomlar, mesajcı RNA’nın (mRNA) taşıdığı talimatları izler.'],
  'bio9-04': ['Hücre zarı', 'Hücreye giren ve hücreden çıkan maddeleri denetler.', 'Seçici geçirgendir: Bazı maddeler kolayca geçer, bazıları geçemez.'],
  'bio9-05': ['Çekirdek', 'Hücrenin DNA’sını taşır ve hücrenin etkinliklerini yönetir.', 'Yalnızca ökaryot hücrelerde çekirdek bulunur.'],
  'bio9-06': ['Kloroplast', 'Bitki ve alg hücrelerinde fotosentezin gerçekleştiği yer.', 'Işık enerjisini soğuran klorofili içerir.'],
  'bio9-07': ['Hücre duvarı', 'Bitki hücrelerini destekleyen ve koruyan sert dış katman.', 'Bitkilerde esas olarak selülozdan yapılmıştır. Hayvan hücrelerinde hücre duvarı yoktur.'],
  'bio9-08': ['Prokaryot ve ökaryot hücreler', 'Prokaryot hücrelerde çekirdek yoktur; ökaryot hücrelerde çekirdek ve zarla çevrili organeller vardır.', 'Bakteriler prokaryottur. Bitkiler, hayvanlar ve mantarlar ökaryot hücrelerden oluşur.'],
  'bio9-09': ['Difüzyon', 'Taneciklerin yoğun oldukları yerden az yoğun oldukları yere hareketi.', 'Pasif bir olaydır: Hücre bunun için enerji harcamaz.'],
  'bio9-10': ['Osmoz', 'Suyun seçici geçirgen bir zardan difüzyonu.', 'Su, çözünmüş madde derişiminin daha yüksek olduğu tarafa doğru hareket eder.'],
  'bio10-01': ['DNA’nın açılımı nedir?', 'Deoksiribonükleik asit.', 'DNA, canlıların kalıtsal talimatlarını taşır.'],
  'bio10-02': ['DNA’da hangi bazlar eşleşir?', 'Adenin ile timin (A–T), sitozin ile guanin (C–G).', 'Bu tamamlayıcı baz eşleşmesi, DNA’nın doğru kopyalanmasını sağlar.'],
  'bio10-03': ['Gen', 'Bir proteinin şifresini taşıyan DNA bölümü.', 'Genler kromozomlarda bulunur.'],
  'bio10-04': ['Alel', 'Aynı genin farklı hâllerinden biri.', 'Örnek: Göz rengi geninin kahverengi ve mavi alelleri olabilir.'],
  'bio10-05': ['Baskın alel', 'Tek bir kopyası bile olsa etkisini gösteren alel.', 'Büyük harfle yazılır, örneğin B. Çekinik alel (b) ise yalnızca iki kopya olduğunda ortaya çıkar.'],
  'bio10-06': ['Genotip ve fenotip', 'Genotip, canlının sahip olduğu alellerdir; fenotip ise gözlenebilen özelliktir.', 'Örnek: Genotip Bb, fenotip kahverengi göz.'],
  'bio10-07': ['Homozigot', 'Bir gen için iki özdeş alele sahip olmak.', 'BB ve bb homozigottur. Bb heterozigottur.'],
  'bio10-08': ['Mitoz sonucunda ne oluşur?', 'Genetik olarak özdeş iki hücre.', 'Mitoz, büyüme ve onarım için kullanılır.'],
  'bio10-09': ['Mayoz sonucunda ne oluşur?', 'Kromozom sayısı yarıya inmiş dört hücre.', 'Bunlar gametlerdir (üreme hücreleri) ve her biri genetik olarak farklıdır.'],
  'bio10-10': ['Mutasyon', 'DNA dizisinde meydana gelen değişiklik.', 'Mutasyonlar zararlı, yararlı ya da etkisiz olabilir.'],
  'math9-01': ['Çöz: 2x + 5 = 17', 'x = 6', 'Her iki taraftan 5 çıkar (2x = 12), sonra her iki tarafı 2’ye böl.'],
  'math9-02': ['(1, 2) ve (3, 8) noktalarından geçen doğrunun eğimi', '3', 'Eğim = y’deki değişim ÷ x’teki değişim = (8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3.'],
  'math9-03': ['Doğru denkleminin eğim-kesişim biçimi', 'y = mx + b', 'm eğimdir, b ise doğrunun y eksenini kestiği noktadır.'],
  'math9-04': ['Parantezi aç: 3(x − 4)', '3x − 12', 'Dağılma özelliği: 3’ü parantezin içindeki her terimle çarp.'],
  'math9-05': ['Çarpanlarına ayır: x² − 9', '(x − 3)(x + 3)', 'İki kare farkı: a² − b² = (a − b)(a + b).'],
  'math9-06': ['Sadeleştir: x³ · x⁴', 'x⁷', 'Tabanları aynı olan üslü ifadeler çarpılırken üsler toplanır: 3 + 4 = 7.'],
  'math9-07': ['Çöz: −2x > 6', 'x < −3', 'Her iki taraf negatif bir sayıya bölündüğünde eşitsizliğin yönü değişir.'],
  'math9-08': ['a = 2 ve b = 5 için 3a² − b ifadesinin değeri', '7', '3 × 2² − 5 = 3 × 4 − 5 = 12 − 5 = 7.'],
  'math9-09': ['y = 4x − 7 doğrusunun y eksenini kestiği nokta', '−7', 'y = mx + b biçiminde b, y eksenini kesme noktasıdır; doğru y eksenini (0, −7)’de keser.'],
  'math9-10': ['Doğrusal bir denklemin grafiği neye benzer?', 'Düz bir doğruya.', 'Doğrusal denklemler y = mx + b biçimindedir ve x yalnızca 1. derecedendir.'],
};
