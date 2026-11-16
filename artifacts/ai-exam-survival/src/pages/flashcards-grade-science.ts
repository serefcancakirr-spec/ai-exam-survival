// Stage 22F: grade decks for Mathematics, Physics, Chemistry and Biology. One deck of 25 concepts per subject and grade,
// taken from the "Anahtar Kavramlar" (key concepts) of the units/themes in the MEB Türkiye Yüzyılı Maarif Modeli programs
// (tymm.meb.gov.tr). When a grade has fewer than 25 key concepts, the rest come from the unit's "İçerik Çerçevesi"
// (content frame) and are marked with `fromContent`. Definitions are short, written for the app.
// A deck is added only when the student taps its button; it is then an ordinary deck (same saved shape as any deck).

/** [concept, short Turkish definition, unit/theme number, true when taken from the content frame instead of the key concepts] */
export type GradeConcept = [concept: string, definition: string, unit: number, fromContent?: true];

export type ScienceSubject = 'Mathematics' | 'Physics' | 'Chemistry' | 'Biology';
export type ScienceGrade = '9' | '10' | '11' | '12';

export type ScienceGradeDeck = {
  /** "ünite" (Fizik) or "tema" (the other programs), as the program calls them. */
  unitWord: 'ünite' | 'tema';
  units: Record<number, string>;
  concepts: GradeConcept[];
};

export const SCIENCE_SUBJECTS: ScienceSubject[] = ['Mathematics', 'Physics', 'Chemistry', 'Biology'];

export const PROGRAM_NAMES: Record<ScienceSubject, { tr: string; en: string }> = {
  Mathematics: { tr: 'Matematik', en: 'Mathematics' },
  Physics: { tr: 'Fizik', en: 'Physics' },
  Chemistry: { tr: 'Kimya', en: 'Chemistry' },
  Biology: { tr: 'Biyoloji', en: 'Biology' },
};

export const SCIENCE_GRADE_DECKS: Partial<Record<ScienceGrade, Record<ScienceSubject, ScienceGradeDeck>>> = {
  '9': {
    Mathematics: {
      unitWord: 'tema',
      units: {
        1: 'Sayılar',
        2: 'Nicelikler ve Değişimler',
        3: 'Geometrik Şekiller',
        4: 'Eşlik ve Benzerlik',
        5: 'Algoritma ve Bilişim',
        6: 'İstatistiksel Araştırma Süreci',
        7: 'Veriden Olasılığa',
      },
      concepts: [
        ['alt küme', 'A kümesinin her elemanı B kümesinin de elemanıysa A, B’nin alt kümesidir (A ⊆ B).', 1],
        ['boş küme', 'Hiç elemanı olmayan küme; ∅ ya da { } ile gösterilir.', 1],
        ['kesişim işlemi', 'İki kümenin ortak elemanlarından oluşan kümeyi bulma işlemi (A ∩ B).', 1],
        ['birleşim işlemi', 'İki kümenin bütün elemanlarını bir araya getiren işlem; ortak elemanlar bir kez yazılır (A ∪ B).', 1],
        ['önerme', 'Doğru ya da yanlış olduğu kesin olarak söylenebilen hüküm cümlesi.', 1],
        ['önermenin değili', 'Bir önermenin doğruluk değerini tersine çeviren önerme; p doğruysa p′ yanlıştır.', 1],
        ['ispat', 'Bir ifadenin doğru olduğunu kabul edilmiş bilgilerden mantıksal adımlarla gösterme.', 1],
        ['mutlak değer', 'Bir sayının sayı doğrusunda sıfıra olan uzaklığı; |−5| = 5.', 1],
        ['bilimsel gösterim', 'Bir sayıyı a × 10ⁿ biçiminde yazma (1 ≤ |a| < 10, n tam sayı); örneğin 3,2 × 10⁵.', 1],
        ['aralık', 'İki sayı arasındaki bütün gerçek sayıların kümesi; uçlar dâhilse [a, b], değilse (a, b).', 1],
        ['bağımlı-bağımsız değişken', 'Değeri serbestçe seçilen değişken bağımsız, bu seçime göre değişen değişken bağımlı değişkendir.', 2],
        ['doğrusal fonksiyon', 'f(x) = ax + b biçimindeki fonksiyon; grafiği bir doğrudur.', 2],
        ['eğim', 'Bir doğrunun dikliği; düşey değişimin yatay değişime oranı.', 2],
        ['fonksiyonun sıfırı', 'Fonksiyonun değerini 0 yapan x değeri; grafiğin x eksenini kestiği nokta.', 2],
        ['üçgen eşitsizliği', 'Bir üçgende her kenarın uzunluğu, diğer iki kenarın farkından büyük, toplamından küçüktür.', 3],
        ['dış açı', 'Bir üçgende bir kenarın uzantısıyla komşu kenar arasındaki açı; komşu olmayan iki iç açının toplamına eşittir.', 3],
        ['Pisagor teoremi', 'Dik üçgende dik kenarların karelerinin toplamı hipotenüsün karesine eşittir: a² + b² = c².', 4],
        ['Öklid teoremi', 'Dik üçgende hipotenüse çizilen yüksekliğin, hipotenüste ayırdığı parçalarla ilişkisi; h² = p · k.', 4],
        ['Tales teoremi', 'Paralel doğrular, kendilerini kesen iki doğru üzerinde orantılı parçalar ayırır.', 4],
        ['benzerlik', 'Karşılıklı açıları eşit, karşılıklı kenarları orantılı olan şekillerin ilişkisi.', 4],
        ['algoritma', 'Bir problemi çözmek için izlenen, sırası belli ve sonlu adımlar dizisi.', 5],
        ['akış şeması', 'Bir algoritmanın adımlarını şekiller ve oklarla gösteren çizim.', 5],
        ['histogram', 'Gruplandırılmış nicel verinin sıklıklarını bitişik sütunlarla gösteren grafik.', 6],
        ['standart sapma', 'Verilerin aritmetik ortalama etrafında ne kadar yayıldığını gösteren ölçü.', 6],
        ['örnek uzay', 'Bir deneyin bütün olası çıktılarının kümesi; zar atmada {1, 2, 3, 4, 5, 6}.', 7],
      ],
    },
    Physics: {
      unitWord: 'ünite',
      units: { 1: 'Fizik Bilimi ve Kariyer Keşfi', 2: 'Kuvvet ve Hareket', 3: 'Akışkanlar', 4: 'Enerji' },
      concepts: [
        ['temel nicelik', 'Başka niceliklerden türetilmeyen nicelik; uzunluk, kütle, zaman, sıcaklık gibi.', 2],
        ['türetilmiş nicelik', 'Temel niceliklerden elde edilen nicelik; hız, alan, hacim, kuvvet gibi.', 2],
        ['skaler nicelik', 'Yalnızca büyüklük (sayı ve birim) ile ifade edilen nicelik; kütle, zaman, sıcaklık gibi.', 2],
        ['vektörel nicelik', 'Büyüklüğünün yanında yönü de olan nicelik; kuvvet, hız, yer değiştirme gibi.', 2],
        ['bileşke vektör', 'Birden fazla vektörün yaptığı etkiyi tek başına yapan vektör.', 2],
        ['kuvvet', 'Bir cismin hareket durumunu ya da şeklini değiştirebilen etki; birimi newton (N).', 2],
        ['referans noktası', 'Bir cismin konumunun ve hareketinin kendisine göre belirlendiği nokta.', 2],
        ['konum', 'Bir cismin referans noktasına göre yerini gösteren vektör.', 2],
        ['alınan yol', 'Hareket eden cismin izlediği yörüngenin toplam uzunluğu; skalerdir.', 2],
        ['yer değiştirme', 'İlk konumdan son konuma çizilen vektör; yönü ve büyüklüğü vardır.', 2],
        ['sürat', 'Birim zamanda alınan yol; skaler bir niceliktir.', 2],
        ['hız', 'Birim zamandaki yer değiştirme; vektörel bir niceliktir.', 2],
        ['ivme', 'Hızın birim zamandaki değişimi; birimi m/s².', 2],
        ['öteleme hareketi', 'Cismin bütün noktalarının aynı yönde ve aynı miktarda yer değiştirdiği hareket.', 2],
        ['dönme hareketi', 'Cismin bir eksen ya da nokta etrafında döndüğü hareket.', 2],
        ['titreşim hareketi', 'Bir denge noktası etrafında ileri geri tekrarlanan hareket.', 2],
        ['basınç', 'Birim yüzeye dik olarak etki eden kuvvet; birimi pascal (Pa).', 3],
        ['kaldırma kuvveti', 'Bir akışkanın içindeki cisme yukarı doğru uyguladığı kuvvet.', 3],
        ['ısı', 'Sıcaklık farkı nedeniyle bir maddeden diğerine aktarılan enerji.', 4],
        ['sıcaklık', 'Bir maddedeki taneciklerin ortalama hareket enerjisinin ölçüsü.', 4],
        ['iç enerji', 'Bir maddedeki taneciklerin sahip olduğu enerjilerin toplamı.', 4],
        ['öz ısı', '1 gram maddenin sıcaklığını 1 °C artırmak için gereken ısı; maddeler için ayırt edicidir.', 4],
        ['ısı sığası', 'Bir maddenin tamamının sıcaklığını 1 °C artırmak için gereken ısı; kütleye bağlıdır.', 4],
        ['hâl değişimi', 'Maddenin katı, sıvı ve gaz hâlleri arasında geçiş yapması; erime, donma, buharlaşma gibi.', 4],
        ['ısıl denge', 'Sıcaklıkları farklı maddeler arasında ısı alışverişi bitip sıcaklıkların eşitlendiği durum.', 4],
      ],
    },
    Chemistry: {
      unitWord: 'tema',
      units: { 1: 'Etkileşim', 2: 'Çeşitlilik', 3: 'Sürdürülebilirlik' },
      concepts: [
        ['orbital', 'Atomda elektronun bulunma olasılığının yüksek olduğu bölge.', 1],
        ['Aufbau ilkesi', 'Elektronlar orbitallere en düşük enerjiliden başlayarak yerleşir.', 1],
        ['Pauli dışlama ilkesi', 'Bir orbitalde en fazla iki elektron bulunur ve bu elektronların spinleri zıttır.', 1],
        ['Hund kuralı', 'Eş enerjili orbitallere elektronlar önce birer birer, aynı spinle yerleşir.', 1],
        ['valans elektron', 'Bir atomun en dış katmanındaki, kimyasal bağa katılan elektronlar.', 1],
        ['atom yarıçapı', 'Atom çekirdeği ile en dış elektronlar arasındaki uzaklık; grupta aşağı inildikçe artar.', 1],
        ['iyonlaşma enerjisi', 'Gaz hâldeki bir atomdan bir elektron koparmak için gereken enerji.', 1],
        ['elektronegatiflik', 'Bir atomun bağdaki elektronları kendine çekme yeteneği.', 1],
        ['izoelektronik', 'Elektron sayıları ve dizilişleri aynı olan tanecikler; örneğin Na⁺ ve Ne.', 1],
        ['iyonik bağ', 'Zıt yüklü iyonlar arasındaki elektrostatik çekim; genellikle metal ile ametal arasında oluşur.', 2],
        ['kovalent bağ', 'Atomların elektronlarını ortaklaşa kullanmasıyla oluşan bağ.', 2],
        ['polar kovalent', 'Elektronegatiflikleri farklı atomlar arasında, elektronların eşit paylaşılmadığı kovalent bağ.', 2],
        ['apolar kovalent', 'Elektronların eşit paylaşıldığı kovalent bağ; aynı tür atomlar arasında oluşur (H₂, O₂).', 2],
        ['metalik bağ', 'Metal katyonları ile serbest dolaşan değerlik elektronları arasındaki çekim.', 2],
        ['dipol moment', 'Bir bağda ya da molekülde yük dağılımının ne kadar dengesiz olduğunu gösteren büyüklük.', 2],
        ['hidrojen bağı', 'F, O ya da N’ye bağlı hidrojen ile başka bir molekülün F, O ya da N atomu arasındaki güçlü çekim.', 2],
        ['London kuvveti', 'Elektron hareketiyle oluşan anlık dipoller arasındaki zayıf çekim; bütün moleküllerde vardır.', 2],
        ['van der Waals etkileşimi', 'Moleküller arasındaki zayıf çekim kuvvetlerinin genel adı (dipol-dipol, London vb.).', 2],
        ['viskozite', 'Bir akışkanın akmaya karşı gösterdiği direnç; bal sudan daha viskozdur.', 2],
        ['yüzey gerilimi', 'Sıvı yüzeyindeki moleküllerin içeri doğru çekilmesiyle yüzeyin gergin bir zar gibi davranması.', 2],
        ['kılcallık (kapiler etki)', 'Sıvının ince bir boruda yer çekimine karşı yükselmesi ya da alçalması.', 2],
        ['buhar basıncı', 'Kapalı kapta sıvısıyla dengede olan buharın yaptığı basınç.', 2],
        ['amorf katı', 'Tanecikleri düzenli bir şekilde dizilmemiş katı; cam ve plastik gibi.', 2],
        ['ağır metal', 'Yoğunluğu yüksek, az miktarda bile canlılara zarar verebilen metaller; cıva, kurşun, kadmiyum gibi.', 3],
        ['ekolojik ayak izi', 'Bir kişinin ya da toplumun tükettiklerini karşılamak ve atıklarını yok etmek için gereken doğa alanı.', 3],
      ],
    },
    Biology: {
      unitWord: 'tema',
      units: { 1: 'Yaşam', 2: 'Organizasyon' },
      concepts: [
        ['bilimsel yöntem', 'Gözlem, soru, hipotez, deney ve sonuç adımlarıyla bilgi üretme yolu.', 1],
        ['bilim etiği', 'Bilimsel çalışmalarda dürüstlük, canlılara saygı ve sorumluluk gibi uyulması gereken ilkeler.', 1],
        ['prokaryot', 'Zarla çevrili çekirdeği ve zarlı organelleri olmayan hücre ya da canlı; bakteriler gibi.', 1],
        ['ökaryot', 'Zarla çevrili çekirdeği ve zarlı organelleri olan hücre ya da canlı; hayvan, bitki, mantar gibi.', 1],
        ['adezyon', 'Farklı maddelerin molekülleri arasındaki çekim; suyun cama tutunması gibi.', 1],
        ['kohezyon', 'Aynı maddenin molekülleri arasındaki çekim; su damlasının bir arada durması gibi.', 1],
        ['yüzey gerilimi', 'Su yüzeyindeki moleküllerin birbirini çekmesiyle yüzeyin gergin bir zar gibi davranması.', 1],
        ['polimerizasyon', 'Küçük yapı birimlerinin (monomer) birleşerek büyük molekül (polimer) oluşturması.', 1],
        ['dehidrasyon', 'İki molekül birleşirken su açığa çıkması; dehidrasyon sentezi.', 1],
        ['hidroliz', 'Büyük bir molekülün su kullanılarak küçük birimlerine ayrılması.', 1],
        ['denatürasyon', 'Proteinin sıcaklık, pH gibi etkilerle üç boyutlu yapısının bozulması ve işlevini kaybetmesi.', 1],
        ['indüklenmiş uyum', 'Enzimin aktif bölgesinin, substrat bağlanırken ona uyacak şekilde biçim değiştirmesi.', 1],
        ['endositoz', 'Hücrenin büyük molekülleri zarıyla sararak içeri alması.', 2],
        ['ekzositoz', 'Hücrenin büyük molekülleri keseciklerle zarından dışarı atması.', 2],
        ['aktif taşıma', 'Maddelerin az yoğun ortamdan çok yoğun ortama ATP harcanarak taşınması.', 2],
        ['pasif taşıma', 'Maddelerin çok yoğun ortamdan az yoğun ortama enerji harcanmadan geçmesi; difüzyon, osmoz.', 2],
        ['organeller', 'Hücrede belirli görevleri yapan yapılar; mitokondri, ribozom, kloroplast gibi.', 2],
        ['sınıflandırma kategorileri', 'Canlıları gruplamada kullanılan basamaklar: domain, âlem, şube, sınıf, takım, aile, cins, tür.', 2],
        ['ikili adlandırma', 'Bir türün cins ve tür adından oluşan iki kelimelik bilimsel adı; Homo sapiens gibi.', 2],
        ['domain', 'En geniş sınıflandırma kategorisi: Bakteri, Arke ve Ökarya.', 2],
        ['tür', 'Birbiriyle çiftleşip verimli yavrular oluşturabilen canlılar topluluğu.', 2],
        ['arke', 'Aşırı tuzlu, sıcak ya da asidik ortamlarda da yaşayabilen prokaryot canlılar domaini.', 2],
        ['protista', 'Çoğu tek hücreli, ökaryot canlıların oluşturduğu âlem; amip, öglena, paramesyum gibi.', 2],
        ['mantar', 'Hücre duvarında kitin bulunan, besinini dışarıdan hazır alan ökaryot canlılar; maya, şapkalı mantar gibi.', 2],
        ['endemik tür', 'Yalnızca belirli bir bölgede doğal olarak yaşayan tür; Türkiye’de sığla ağacı ve Van Gölü’ndeki inci kefali gibi.', 2],
      ],
    },
  },
};
