// Stage 22G: grade decks for History, Geography, Literature, Philosophy and Religion. One deck of 25 concepts per subject and
// grade, taken from the "Anahtar Kavramlar" (key concepts) of the units/themes in the MEB Türkiye Yüzyılı Maarif Modeli programs
// (tymm.meb.gov.tr). Grade 12 History uses the T.C. İnkılap Tarihi ve Atatürkçülük program; Felsefe is taught in grades 10–11 only.
// Definitions are short, written for the app. A deck is added only when the student taps its button; it is then an ordinary deck.
import type { Flashcard, FlashcardDeck, FlashcardGrade } from './flashcards-model';
import type { GradeConcept } from './flashcards-grade-science';

export type SocialSubject = 'History' | 'Geography' | 'Literature' | 'Philosophy' | 'Religion';
export type SocialGrade = '9' | '10' | '11' | '12';

export type SocialGradeDeck = {
  /** Program name as MEB writes it, and in English. */
  program: { tr: string; en: string };
  /** "ünite" or "tema", as the program calls them. */
  unitWord: 'ünite' | 'tema';
  units: Record<number, string>;
  concepts: GradeConcept[];
};

export const SOCIAL_SUBJECTS: SocialSubject[] = ['History', 'Geography', 'Literature', 'Philosophy', 'Religion'];

/** Button labels. */
export const SOCIAL_SUBJECT_NAMES: Record<SocialSubject, { tr: string; en: string }> = {
  History: { tr: 'Tarih', en: 'History' },
  Geography: { tr: 'Coğrafya', en: 'Geography' },
  Literature: { tr: 'Edebiyat', en: 'Literature' },
  Philosophy: { tr: 'Felsefe', en: 'Philosophy' },
  Religion: { tr: 'Din Kültürü', en: 'Religious Culture' },
};

const P = {
  History: { tr: 'Tarih', en: 'History' },
  Inkilap: { tr: 'T.C. İnkılap Tarihi ve Atatürkçülük', en: 'History of the Turkish Revolution and Kemalism' },
  Geography: { tr: 'Coğrafya', en: 'Geography' },
  Literature: { tr: 'Türk Dili ve Edebiyatı', en: 'Turkish Language and Literature' },
  Philosophy: { tr: 'Felsefe', en: 'Philosophy' },
  Religion: { tr: 'Din Kültürü ve Ahlak Bilgisi', en: 'Religious Culture and Ethics' },
};

export const SOCIAL_GRADE_DECKS: Partial<Record<SocialGrade, Partial<Record<SocialSubject, SocialGradeDeck>>>> = {
  '9': {
    History: {
      program: P.History,
      unitWord: 'ünite',
      units: { 1: 'Geçmişin İnşa Sürecinde Tarih', 2: 'Eski Çağ Medeniyetleri', 3: 'Orta Çağ Medeniyetleri' },
      concepts: [
        ['arşiv', 'Geçmişe ait belgelerin düzenli biçimde saklandığı ve incelenebildiği yer.', 1],
        ['kanıt', 'Tarihçinin bir olayı açıklarken dayandığı belge, kalıntı ya da bilgi.', 1],
        ['olgu', 'Gerçekleştiği kanıtlarla doğrulanabilen, yoruma göre değişmeyen durum.', 1],
        ['tarihçi', 'Geçmişi kaynaklara ve kanıtlara dayanarak araştıran ve yorumlayan kişi.', 1],
        ['tarihsel zaman', 'Olayların sırasını ve süresini çağlar, yüzyıllar ve takvimlerle gösteren zaman anlayışı.', 1],
        ['dijitalleşme', 'Belge ve bilgilerin bilgisayar ortamına aktarılması; arşivlere erişimi kolaylaştırır.', 1],
        ['artı ürün', 'İhtiyaçtan fazla üretilen ürün; ticaretin, şehirlerin ve iş bölümünün doğmasını sağlamıştır.', 2],
        ['kağan', 'Eski Türk devletlerinde hükümdara verilen unvan.', 2],
        ['konargöçer', 'Hayvanları için otlak arayarak mevsimlere göre yer değiştiren yaşam biçimi.', 2],
        ['kurultay', 'Eski Türk devletlerinde önemli devlet işlerinin görüşüldüğü meclis.', 2],
        ['medeniyet', 'Bir toplumun maddi ve manevi alanda ulaştığı gelişmişlik düzeyi; uygarlık.', 2],
        ['onlu sistem', 'Asya Hun ordusunda askerlerin 10, 100, 1000 ve 10.000’lik birlikler hâlinde düzenlenmesi.', 2],
        ['piramit', 'Eski Mısır’da firavunlar için yapılan anıt mezar.', 2],
        ['saban', 'Toprağı sürmek için kullanılan, hayvanla çekilen tarım aracı.', 2],
        ['senato', 'Roma’da devlet işlerinde söz sahibi olan soylulardan oluşan meclis.', 2],
        ['töre', 'Eski Türklerde toplum hayatını düzenleyen yazısız hukuk kuralları.', 2],
        ['yazıt', 'Taşa ya da metale kazınmış yazı; Orhun Yazıtları gibi.', 2],
        ['ziggurat', 'Mezopotamya’da Sümerlerin yaptığı, tapınak, gözlem yeri ve ambar olarak kullanılan katlı yapı.', 2],
        ['divan', 'İslam devletlerinde devlet işlerinin görüşüldüğü kurul ya da devlet dairesi.', 3],
        ['feodalite', 'Orta Çağ Avrupası’nda toprağın ve gücün senyörlerin elinde olduğu, merkezî otoritenin zayıf olduğu düzen.', 3],
        ['hicret', 'Hz. Muhammed’in ve Müslümanların 622’de Mekke’den Medine’ye göçü; Hicri takvimin başlangıcı.', 3],
        ['hilafet', 'Hz. Muhammed’den sonra Müslümanların siyasi ve dinî liderliği; halifelik.', 3],
        ['kervansaray', 'Ticaret yolları üzerinde yolcuların ve kervanların konakladığı han.', 3],
        ['mevali', 'Emeviler döneminde Arap olmayan Müslümanlara verilen ad.', 3],
        ['skolastik düşünce', 'Orta Çağ Avrupası’nda bilgiyi kilisenin öğretilerine göre açıklayan düşünce anlayışı.', 3],
      ],
    },
    Geography: {
      program: P.Geography,
      unitWord: 'ünite',
      units: {
        1: 'Coğrafyanın Doğası',
        2: 'Mekânsal Bilgi Teknolojileri',
        3: 'Doğal Sistemler ve Süreçler',
        4: 'Beşerî Sistemler ve Süreçler',
        5: 'Ekonomik Faaliyetler ve Etkileri',
        6: 'Afetler ve Sürdürülebilir Çevre',
        7: 'Bölgeler, Ülkeler ve Küresel Bağlantılar',
      },
      concepts: [
        ['fiziki coğrafya', 'Yer şekilleri, iklim, su ve bitki örtüsü gibi doğal ortamı inceleyen coğrafya dalı.', 1],
        ['beşerî coğrafya', 'Nüfus, yerleşme ve ekonomik faaliyetler gibi insanla ilgili konuları inceleyen coğrafya dalı.', 1],
        ['taş küre (litosfer)', 'Yer kabuğu ile mantonun üst kısmından oluşan katı katman.', 1],
        ['hava küre (atmosfer)', 'Dünya’yı çevreleyen gaz katmanı.', 1],
        ['mutlak konum', 'Bir yerin enlem ve boylamla belirlenen kesin yeri.', 2],
        ['göreceli konum', 'Bir yerin denizlere, dağlara, komşu ülkelere ya da yollara göre durumu.', 2],
        ['ölçek', 'Haritadaki uzunluğun gerçek uzunluğa oranı; 1/100.000 gibi.', 2],
        ['izohips', 'Haritada deniz seviyesinden aynı yükseklikteki noktaları birleştiren eğri (eş yükselti eğrisi).', 2],
        ['projeksiyon', 'Küre biçimindeki Dünya’nın düz bir yüzeye aktarılma yöntemi.', 2],
        ['coğrafi bilgi sistemleri (CBS)', 'Mekâna ait verileri toplayan, saklayan, inceleyen ve haritaya döken bilgisayar sistemleri.', 2],
        ['uzaktan algılama', 'Uydular ya da hava araçlarıyla yeryüzü hakkında uzaktan veri toplama.', 2],
        ['yerel saat', 'Bir yerin Güneş’in konumuna göre belirlenen saati; aynı boylam üzerindeki yerlerde aynıdır.', 2],
        ['eksen eğikliği', 'Dünya’nın dönme ekseninin yörünge düzlemine göre yaklaşık 23° 27′ eğik olması; mevsimlerin nedeni.', 3],
        ['geoit', 'Dünya’nın kutuplardan basık, Ekvator’dan şişkin kendine özgü şekli.', 3],
        ['karasallık', 'Denizden uzaklaştıkça sıcaklık farklarının artması ve yağışın azalması.', 3],
        ['denizellik', 'Denizin etkisiyle sıcaklık farklarının az, nemin yüksek olması.', 3],
        ['kentsel ısı adası', 'Şehir merkezlerinin beton, asfalt ve yoğun yapılaşma yüzünden çevresinden daha sıcak olması.', 3],
        ['okyanus akıntısı', 'Okyanuslarda büyük su kütlelerinin belirli yönlerde sürekli hareketi; iklimi etkiler.', 3],
        ['nem', 'Havadaki su buharı miktarı.', 3],
        ['ortanca yaş', 'Nüfusu yaşa göre sıralayınca tam ortada kalan kişinin yaşı.', 4],
        ['nüfus piramidi', 'Nüfusun yaş gruplarına ve cinsiyete göre dağılımını gösteren grafik.', 4],
        ['demografik dönüşüm', 'Doğum ve ölüm oranlarının zamanla yüksekten düşüğe doğru değişmesi süreci.', 4],
        ['bütüncül afet yönetimi', 'Afet öncesinde hazırlık ve risk azaltma, sırasında müdahale ve sonrasında iyileştirmeyi birlikte ele alan yönetim.', 6],
        ['maruziyet', 'İnsanların ve yapıların bir tehlikeye açık bölgede bulunması.', 6],
        ['işlevsel bölge', 'Bir merkez ve onun hizmet verdiği çevreden oluşan bölge; bir şehrin ticaret alanı gibi.', 7],
      ],
    },
    Literature: {
      program: P.Literature,
      unitWord: 'tema',
      units: { 1: 'Sözün İnceliği', 2: 'Anlam Arayışı', 3: 'Anlamın Yapı Taşları', 4: 'Dilin Zenginliği' },
      concepts: [
        ['imge', 'Bir duyguyu ya da düşünceyi zihinde canlanan bir görüntüyle anlatma.', 1],
        ['kurmaca', 'Yazarın hayal gücüyle oluşturduğu, gerçek hayatta yaşanmamış olabilen dünya.', 1],
        ['sembol', 'Bir kavramı ya da düşünceyi temsil eden somut varlık; güvercinin barışı temsil etmesi gibi.', 1],
        ['çağrışım', 'Bir sözün ya da görüntünün zihinde başka bir duyguyu veya düşünceyi uyandırması.', 1],
        ['edebî dil', 'Sanatlı, çok anlamlı ve estetik kaygıyla kullanılan dil.', 1],
        ['günlük dil', 'İletişim için kullanılan, açık ve doğrudan anlatıma dayanan dil.', 1],
        ['sürükleyicilik', 'Metnin okuru merakla okumaya devam ettirme özelliği.', 1],
        ['ana düşünce', 'Yazarın metinde okura vermek istediği temel mesaj.', 2],
        ['yardımcı düşünce', 'Ana düşünceyi destekleyen, açıklayan diğer düşünceler.', 2],
        ['tema', 'Bir metinde işlenen ve metnin bütününe yayılan temel konu ya da duygu; aşk, ölüm, yalnızlık gibi.', 2],
        ['açık ileti', 'Metinde doğrudan söylenen mesaj.', 2],
        ['örtük ileti', 'Metinde doğrudan söylenmeyen, okurun çıkarım yaparak bulduğu mesaj.', 2],
        ['yazarın tutumu', 'Yazarın konuya bakışı; eleştirel, öğretici, alaycı ya da duygusal olabilir.', 2],
        ['yazma amacı', 'Yazarın metni yazma nedeni; bilgilendirmek, ikna etmek, eğlendirmek gibi.', 2],
        ['anlatıcı', 'Olayları okura aktaran ses; yazarla aynı kişi olmak zorunda değildir.', 3],
        ['bakış açısı', 'Anlatıcının olaylara hangi konumdan baktığı; kahraman, gözlemci ya da ilahi bakış açısı.', 3],
        ['olay örgüsü', 'Bir hikâyede olayların neden-sonuç ilişkisi içinde sıralanması.', 3],
        ['şahıs kadrosu', 'Bir anlatıdaki kişilerin tamamı.', 3],
        ['serim-düğüm-çözüm', 'Olay çevreli anlatılarda giriş, olayların düğümlendiği bölüm ve sonuç.', 3],
        ['nesnellik', 'Kişisel duygu ve yorum katmadan, kanıtlanabilir bilgilerle anlatım.', 3],
        ['öznellik', 'Kişisel duygu, düşünce ve yorumlara dayanan anlatım.', 3],
        ['bilgi görseli', 'Bilgiyi grafik, tablo ve şekillerle kısa ve anlaşılır biçimde sunan görsel (infografik).', 3],
        ['öğretici metin', 'Bilgi vermek ya da bir konuyu açıklamak amacıyla yazılmış metin; makale, deneme, haber gibi.', 4],
        ['tenkit', 'Bir eseri iyi ve kötü yanlarıyla değerlendiren yazı türü; eleştiri.', 4],
        ['üslup', 'Bir yazarın kelime seçimi ve anlatımıyla oluşan kendine özgü söyleyiş biçimi.', 4],
      ],
    },
    Religion: {
      program: P.Religion,
      unitWord: 'ünite',
      units: {
        1: 'Allah-İnsan İlişkisi',
        2: 'İslam’da İnanç Esasları',
        3: 'İslam’da İbadetler',
        4: 'İslam’da Ahlak İlkeleri',
        5: 'Kur’an’a Göre Hz. Muhammed',
      },
      concepts: [
        ['dua', 'Allah’a yönelerek istekte bulunma, şükretme ve yardım dileme.', 1],
        ['fıtrat', 'İnsanın yaratılıştan getirdiği temel özellikler ve doğal eğilimler.', 1],
        ['marifet', 'Allah’ı tanıma ve bilme; ayrıca bir işteki ustalık ve beceri.', 1],
        ['mükellef', 'Akıllı ve ergenlik çağına gelmiş olduğu için dinî sorumluluk taşıyan kişi.', 1],
        ['tövbe', 'İşlenen bir hatadan pişmanlık duyup Allah’tan af dileme ve tekrarlamamaya karar verme.', 1],
        ['ahiret', 'Ölümden sonra başlayan ve sonsuza kadar sürecek olan hayat.', 2],
        ['iman', 'İslam’ın inanç esaslarını kalp ile kabul edip dil ile ifade etme.', 2],
        ['melek', 'Allah’ın nurdan yarattığı, emirlerine uyan görünmez varlıklar.', 2],
        ['tevhit', 'Allah’ın bir ve tek olduğuna inanma; İslam inancının temeli.', 2],
        ['ibadet', 'Allah’a saygı ve bağlılığı göstermek için yapılan davranışlar; namaz, oruç, zekât gibi.', 3],
        ['ihlas', 'İbadetleri ve iyilikleri yalnızca Allah rızası için, gösterişten uzak yapma; samimiyet.', 3],
        ['ihsan', 'Allah’ı görüyormuş gibi ibadet etme; işini en güzel şekilde yapma ve iyilikte bulunma.', 3],
        ['itidal', 'Her işte ölçülü olma, aşırılıktan kaçınma.', 3],
        ['tefekkür', 'Allah’ın yarattıkları üzerinde derin derin düşünme.', 3],
        ['tevazu', 'Alçak gönüllülük; kendini başkalarından üstün görmeme.', 3],
        ['adalet', 'Hakkı sahibine verme, herkese eşit ve doğru davranma.', 4],
        ['ahilik', 'Selçuklu ve Osmanlı döneminde esnaf ve sanatkârları ahlak ve meslek kurallarıyla bir arada tutan teşkilat.', 4],
        ['şecaat', 'Doğru bildiğini yapmaktaki cesaret ve yiğitlik.', 4],
        ['hikmet', 'Olayların ve varlıkların arkasındaki gerçeği, amacı kavrama; bilgelik.', 4],
        ['iffet', 'Söz ve davranışlarda edepli ve namuslu olma, kötülüklerden uzak durma.', 4],
        ['vicdan', 'İnsanın doğruyu yanlıştan ayırt eden iç sesi.', 4],
        ['nübüvvet', 'Peygamberlik; Allah’ın seçtiği insanlara vahiy göndererek onları elçi kılması.', 5],
        ['sünnet', 'Hz. Muhammed’in söz, davranış ve onaylarının bütünü.', 5],
        ['tebliğ', 'Peygamberin Allah’tan aldığı mesajı insanlara eksiksiz ulaştırması.', 5],
        ['hatemülenbiya', 'Peygamberlerin sonuncusu anlamında Hz. Muhammed’in sıfatı.', 5],
      ],
    },
  },
};
