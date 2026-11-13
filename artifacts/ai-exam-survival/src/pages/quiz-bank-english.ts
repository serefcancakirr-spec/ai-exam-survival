// Stage 21A: English by CEFR level (A1–C1) for every grade.
// Original questions written for this app: 25 grammar + 25 vocabulary per level.
// The prompt and options are English (they teach English); the explanation is Turkish in both app languages.
// In the source the FIRST option is the correct one; the question bank moves it to A–D.
// Difficulty inside a level: questions 1–8 easy, 9–17 medium, 18–25 hard.

import type { QuizDifficulty } from './quiz-question-bank';

export const ENGLISH_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];
export type EnglishSkill = 'Grammar' | 'Vocabulary';

/** Level suggested when a grade first chooses English; the student can change it. */
export const SUGGESTED_LEVEL: Record<'9' | '10' | '11' | '12', EnglishLevel> = { '9': 'A2', '10': 'B1', '11': 'B1', '12': 'B2' };

export type EnglishSeed = {
  level: EnglishLevel;
  skill: EnglishSkill;
  focus: string;
  difficulty: QuizDifficulty;
  prompt: string;
  options: [string, string, string, string];
  explanation: string;
};

type Raw = [focus: string, prompt: string, options: [string, string, string, string], explanation: string];

/** Quiz topic for a level and skill, e.g. "B1 · Grammar". Saved with quiz results like any other topic. */
export function englishTopic(level: EnglishLevel, skill: EnglishSkill) {
  return `${level} · ${skill}`;
}

/** The level a quiz topic belongs to ("B1 · Grammar" → "B1"), or null for the older general English topics. */
export function levelOfTopic(topic: string): EnglishLevel | null {
  const level = topic.split(' · ')[0];
  return (ENGLISH_LEVELS as readonly string[]).includes(level) && topic.includes(' · ') ? (level as EnglishLevel) : null;
}

const RAW: Record<EnglishLevel, Record<EnglishSkill, Raw[]>> = {
  A1: {
    Grammar: [
      ['to be', 'My sister ___ twelve years old.', ['is', 'are', 'am', 'be'], 'Tekil üçüncü kişiyle (my sister = she) “to be” fiili “is” olur. “are” çoğul ve “you” ile, “am” yalnızca “I” ile kullanılır; “be” çekimsiz hâlidir.'],
      ['to be (negative)', 'We ___ at home now; we are at the library.', ["aren't", "isn't", "don't", 'not'], '“We” ile olumsuz “to be” “are not / aren’t” olur. “don’t” asıl fiillerle (We don’t like…) kullanılır, “to be” ile kullanılmaz.'],
      ['there is / there are', 'There ___ two windows in our classroom.', ['are', 'is', 'be', 'has'], 'Çoğul isimle (two windows) “there are” kullanılır. Türkçedeki “var” yüzünden “has” seçmek sık yapılan bir hatadır.'],
      ['have got', 'Ali ___ a new bike.', ['has got', 'have got', 'is got', 'got has'], 'Tekil üçüncü kişiyle (Ali = he) “has got” kullanılır. “have got” I/you/we/they ile kullanılır.'],
      ['possessive adjectives', 'This is my mother and this is ___ car.', ['her', 'she', 'his', 'hers'], 'İsimden önce sahiplik sıfatı gelir: annem için “her car”. “she” özne zamiridir, “hers” isimden önce kullanılmaz (The car is hers).'],
      ['plural nouns', 'I have three ___ in my bag.', ['books', 'book', 'bookes', 'a book'], '“three” çoğul ister: book → books. Türkçede sayıdan sonra isim tekil kalır (üç kitap); İngilizcede -s eklenir.'],
      ['a / an', 'She eats ___ apple every morning.', ['an', 'a', 'two', 'many'], '“apple” sesli harfle başladığı için “an” kullanılır. “two” ve “many” çoğul isim ister (two apples).'],
      ['present simple', 'My father ___ coffee every morning.', ['drinks', 'drink', 'drinking', 'is drink'], 'Geniş zamanda he/she/it ile fiile -s eklenir: drinks. “is drink” yanlış bir yapıdır.'],
      ['present simple (negative)', 'Mert ___ like fish.', ["doesn't", "don't", "isn't", 'not'], 'Geniş zamanın olumsuzunda he/she/it ile “doesn’t + fiil” kullanılır. “isn’t” “to be” ile, “don’t” I/you/we/they ile kullanılır.'],
      ['present simple (questions)', '___ you live near the school?', ['Do', 'Does', 'Are', 'Is'], '“you” ile geniş zaman sorusu “Do” ile kurulur. “Does” he/she/it ile kullanılır; “Are you live” yanlıştır.'],
      ['can', 'My little brother can ___ very fast.', ['swim', 'swims', 'swimming', 'to swim'], '“can”dan sonra fiil yalın gelir: can swim. -s, -ing ya da “to” eklenmez.'],
      ['imperatives', '___ your books, please. The lesson is starting.', ['Open', 'Opens', 'Opening', 'To open'], 'Emir cümlesi fiilin yalın hâliyle başlar: Open your books.'],
      ['present continuous', 'Look! The children ___ in the garden.', ['are playing', 'play', 'plays', 'is playing'], '“Look!” şu anda olan bir şeyi gösterir: şimdiki zaman. “children” çoğul olduğu için “are playing”.'],
      ['prepositions of time', 'My birthday is ___ May.', ['in', 'on', 'at', 'to'], 'Aylarla “in” kullanılır (in May). Günlerle “on” (on Monday), saatlerle “at” (at 9 o’clock).'],
      ['prepositions of time', 'The lesson starts ___ nine o’clock.', ['at', 'in', 'on', 'to'], 'Saatlerle “at” kullanılır: at nine o’clock.'],
      ['prepositions of place', 'We live ___ İzmir.', ['in', 'on', 'at', 'to'], 'Şehir ve ülkelerle “in” kullanılır: in İzmir. “to” hareket bildirir (We go to İzmir).'],
      ['this / these', '___ shoes are very comfortable.', ['These', 'This', 'That', 'It'], '“shoes” çoğul olduğu için yakındaki çoğul nesneler için “these” kullanılır. “this” ve “that” tekildir.'],
      ['object pronouns', 'I like Ayşe and Can. I often play with ___ .', ['them', 'they', 'their', 'theirs'], 'Edattan (with) sonra nesne zamiri gelir: with them. “they” öznedir, “their” isimden önce gelir.'],
      ['adverbs of frequency', 'Which sentence is correct?', ['I always walk to school.', 'I walk always to school.', 'Walk I always to school.', 'I to school always walk.'], 'Sıklık zarfları (always, never, often) asıl fiilden önce gelir: I always walk.'],
      ['question words', '___ is your English teacher? – Mr. Demir.', ['Who', 'What', 'Where', 'When'], 'Cevap bir kişi (Mr. Demir) olduğu için “Who” sorulur.'],
      ['how many / how much', 'How ___ brothers have you got?', ['many', 'much', 'old', 'long'], '“brothers” sayılabilen çoğul bir isimdir, bu yüzden “how many”. “how much” sayılamayan isimlerle kullanılır.'],
      ['can (questions)', '___ you play the guitar? – Yes, I can.', ['Can', 'Do', 'Are', 'Does'], 'Kısa cevap “Yes, I can” olduğu için soru da “Can” ile kurulur.'],
      ['was / were', 'Yesterday I ___ ill, so I stayed at home.', ['was', 'were', 'am', 'is'], '“Yesterday” geçmiş zamandır; “I” ile “to be” fiilinin geçmişi “was” olur. “were” you/we/they ile kullanılır.'],
      ['like + -ing', 'I like ___ to music in the evening.', ['listening', 'listen', 'listens', 'to listening'], '“like”tan sonra fiil genellikle -ing alır: like listening. (“like to listen” da olur ama “to listening” yanlıştır.)'],
      ["possessive 's", 'This phone belongs to my brother. It is ___ phone.', ["my brother's", 'my brothers', 'my brother', "brother's my"], 'Sahiplik için isme ’s eklenir: my brother’s phone (erkek kardeşimin telefonu).'],
    ],
    Vocabulary: [
      ['clothes and weather', 'It is very cold and windy today. Don’t forget your ___ .', ['coat', 'sunglasses', 'swimsuit', 'sandals'], 'Soğuk ve rüzgârlı havada “coat” (mont, palto) giyilir. Güneş gözlüğü, mayo ve sandalet sıcak hava içindir.'],
      ['family', 'My mother’s brother is my ___ .', ['uncle', 'aunt', 'cousin', 'grandfather'], 'Annenin erkek kardeşi “uncle” (dayı) olur. aunt = teyze/hala, cousin = kuzen, grandfather = dede.'],
      ['days of the week', 'The day after Monday is ___ .', ['Tuesday', 'Thursday', 'Sunday', 'Wednesday'], 'Pazartesiden (Monday) sonra salı (Tuesday) gelir. Tuesday ile Thursday (perşembe) sık karıştırılır.'],
      ['school objects', 'I write in my notebook with a ___ .', ['pen', 'ruler', 'bag', 'desk'], 'Yazmak için “pen” (kalem) kullanılır. ruler = cetvel, bag = çanta, desk = sıra.'],
      ['food', 'Which one is a fruit?', ['banana', 'carrot', 'bread', 'cheese'], '“banana” (muz) bir meyvedir. carrot (havuç) sebzedir; bread (ekmek) ve cheese (peynir) meyve değildir.'],
      ['jobs', 'A ___ works in a hospital and helps sick people.', ['nurse', 'pilot', 'farmer', 'chef'], 'Hastanede çalışıp hastalara yardım eden kişi “nurse” (hemşire) olur.'],
      ['rooms', 'We cook meals in the ___ .', ['kitchen', 'bedroom', 'bathroom', 'garage'], 'Yemek “kitchen”da (mutfak) pişirilir.'],
      ['opposites', 'The opposite of “cheap” is ___ .', ['expensive', 'easy', 'old', 'small'], '“cheap” ucuz, karşıtı “expensive” pahalı demektir.'],
      ['numbers', 'Twenty plus thirty is ___ .', ['fifty', 'fifteen', 'forty', 'sixty'], '20 + 30 = 50, yani “fifty”. fifteen (15) ile fifty (50) sık karıştırılır.'],
      ['time', 'There are sixty ___ in an hour.', ['minutes', 'seconds', 'days', 'weeks'], 'Bir saatte 60 dakika (minutes) vardır.'],
      ['seasons', 'In Türkiye, ___ is usually the hottest season.', ['summer', 'winter', 'spring', 'autumn'], 'En sıcak mevsim “summer” (yaz). winter = kış, spring = ilkbahar, autumn = sonbahar.'],
      ['transport', 'You need a ___ to fly from Ankara to London.', ['plane', 'ship', 'bicycle', 'train'], '“fly” (uçmak) için “plane” (uçak) gerekir.'],
      ['feelings', 'I didn’t eat breakfast, so now I’m very ___ .', ['hungry', 'thirsty', 'sleepy', 'angry'], 'Kahvaltı yapmayan kişi “hungry” (aç) olur. thirsty = susamış, sleepy = uykulu.'],
      ['the body', 'We see with our ___ .', ['eyes', 'ears', 'hands', 'feet'], 'Görmek için “eyes” (gözler) kullanılır. ears = kulaklar, hands = eller, feet = ayaklar.'],
      ['colours', 'On a sunny day, the sky is ___ .', ['blue', 'green', 'brown', 'black'], 'Güneşli bir günde gökyüzü “blue” (mavi) olur.'],
      ['daily routines', 'Every morning I ___ a shower before breakfast.', ['take', 'make', 'do', 'go'], '“Duş almak” İngilizcede “take a shower” (ya da have a shower) olur. “make” ve “do” bu kalıpla kullanılmaz.'],
      ['places in town', 'You can borrow books from a ___ .', ['library', 'bakery', 'bank', 'stadium'], 'Kitap ödünç alınan yer “library” (kütüphane). bakery = fırın.'],
      ['animals', 'A ___ gives us milk.', ['cow', 'dog', 'cat', 'bird'], 'Süt veren hayvan “cow” (inek). Menti de bir inek!'],
      ['weather', 'Take an umbrella. It’s ___ outside.', ['raining', 'sunny', 'hot', 'dry'], 'Şemsiye yağmur için alınır: It’s raining (yağmur yağıyor).'],
      ['adjectives', 'My grandfather is 85. He is very ___ .', ['old', 'young', 'new', 'tall'], '85 yaşındaki biri için “old” (yaşlı) denir. “new” eşyalar için kullanılır, insanlar için değil.'],
      ['hobbies', 'I love ___ ; I go to the pool every Saturday.', ['swimming', 'skiing', 'cycling', 'reading'], 'Havuza (pool) yüzmek için gidilir: swimming.'],
      ['classroom language', 'Sorry, I don’t understand. Can you ___ that again, please?', ['repeat', 'remember', 'forget', 'understand'], 'Bir şeyin tekrar söylenmesini istemek için “repeat” (tekrarlamak) kullanılır.'],
      ['shopping', 'How much is this T-shirt? – It’s twenty ___ .', ['liras', 'metres', 'kilos', 'hours'], 'Fiyat sorusunun cevabı para birimiyle verilir: twenty liras.'],
      ['directions', 'Go straight on and then turn ___ at the bank.', ['left', 'long', 'far', 'near'], 'Yön tarifinde “turn left / turn right” (sola / sağa dön) kullanılır.'],
      ['meals', 'We usually have ___ at about 1 p.m.', ['lunch', 'breakfast', 'midnight', 'morning'], 'Öğlen yenen yemek “lunch” (öğle yemeği). breakfast sabah yenir; midnight ve morning yemek adı değildir.'],
    ],
  },
  A2: {
    Grammar: [
      ['past simple', 'Last weekend we ___ to the science museum with our class.', ['went', 'go', 'goes', 'have gone'], '“Last weekend” geçmişte bitmiş belirli bir zamandır, bu yüzden past simple (went) gerekir. Belirli geçmiş zaman ifadesiyle “have gone” kullanılmaz.'],
      ['past simple (negative)', 'I ___ my homework yesterday because I was ill.', ["didn't do", "don't do", "didn't did", 'not did'], 'Geçmiş zamanın olumsuzu “didn’t + fiilin yalın hâli” ile yapılır: didn’t do. “didn’t did” yanlıştır; geçmiş zamanı “did” zaten gösterir.'],
      ['past simple (questions)', '___ you watch the match last night?', ['Did', 'Were', 'Do', 'Was'], '“last night” geçmiştir ve cümlede asıl fiil (watch) var; soru “Did” ile kurulur. “Were you watch” yanlıştır.'],
      ['irregular verbs', 'She ___ a letter to her grandmother last week.', ['wrote', 'writed', 'written', 'writes'], '“write” düzensiz bir fiildir: write – wrote – written. “written” tek başına geçmiş zaman yapmaz.'],
      ['past continuous', 'I ___ TV when the phone rang.', ['was watching', 'watched', 'am watching', 'were watching'], 'Uzun süren eylem (TV izlemek) past continuous, onu kesen kısa eylem (telefon çaldı) past simple olur. “I” ile “was watching”.'],
      ['comparatives', 'My bag is ___ than yours.', ['heavier', 'more heavy', 'heavyer', 'the heaviest'], '-y ile biten kısa sıfatlarda y → i olur ve -er eklenir: heavy → heavier. “more” uzun sıfatlarla kullanılır.'],
      ['superlatives', 'This is the ___ test of the year.', ['most difficult', 'difficultest', 'more difficult', 'most difficultest'], 'Uzun sıfatların en üstünlük hâli “the most + sıfat” ile yapılır: the most difficult.'],
      ['going to (prediction)', 'Look at those dark clouds! It ___ rain.', ['is going to', 'will be', 'goes to', 'is going'], 'Şu anki bir işarete (kara bulutlar) dayanan tahminde “be going to” kullanılır.'],
      ['will (quick decisions)', 'The phone is ringing. – I ___ answer it.', ["'ll", 'am', 'was', 'did'], 'Konuşma anında verilen kararlar “will (’ll)” ile söylenir: I’ll answer it.'],
      ['some / any', 'There isn’t ___ milk in the fridge.', ['any', 'many', 'a', 'some'], 'Olumsuz cümlelerde “any” kullanılır. “milk” sayılamadığı için “many” ve “a” da olmaz.'],
      ['much / many', 'How ___ money do you need for the trip?', ['much', 'many', 'lot', 'few'], '“money” sayılamayan bir isimdir, bu yüzden “how much”.'],
      ['should', 'You look tired. You ___ go to bed early tonight.', ['should', 'must to', 'should to', 'shoulds'], 'Tavsiye için “should + fiilin yalın hâli” kullanılır. Modal fiillerden sonra “to” gelmez ve -s eklenmez.'],
      ['have to', 'Students ___ wear a uniform at our school.', ['have to', 'has to', 'having to', 'must to'], 'Kural ve zorunluluk için “have to”; çoğul özneyle (students) “have to”. “must to” yanlıştır.'],
      ['adverbs of manner', 'Please speak ___ ; the baby is sleeping.', ['quietly', 'quiet', 'quieter', 'more quiet'], 'Fiili (speak) niteleyen kelime zarf olur: quiet → quietly (sessizce). “quiet” bir sıfattır ve isimleri niteler (a quiet room).'],
      ['too / enough', 'This coat is ___ big for me; I need a smaller one.', ['too', 'enough', 'very much', 'so much'], 'Gereğinden fazla anlamında sıfattan önce “too” kullanılır: too big (fazla büyük). “enough” sıfattan sonra gelir.'],
      ['prepositions of movement', 'The cat jumped ___ the wall into the garden.', ['over', 'during', 'since', 'among'], 'Bir şeyin üstünden aşmak “over” ile anlatılır. during ve since zaman bildirir.'],
      ['present continuous (future plans)', 'What ___ this weekend? – I’m visiting my cousins.', ['are you doing', 'do you do', 'did you do', 'you are doing'], 'Planlanmış gelecek için şimdiki zaman kullanılır. Soru cümlesinde yardımcı fiil özneden önce gelir: are you doing.'],
      ['subject questions', 'Who ___ this cake? It’s delicious!', ['made', 'did make', 'did made', 'was make'], '“Who” öznenin kendisini sorduğunda “did” kullanılmaz: Who made this cake?'],
      ['present perfect (ever)', 'Have you ever ___ to Cappadocia?', ['been', 'went', 'go', 'being'], 'Present perfect “have + V3” ile kurulur. “Bir yere gitmiş olmak” için “been to” kullanılır: Have you ever been to…?'],
      ['relative clauses (who)', 'The girl ___ sits next to me is from Trabzon.', ['who', 'which', 'what', 'where'], 'İnsanlar için “who” kullanılır. “which” nesne ve hayvanlar, “where” yerler içindir.'],
      ['might', 'Take a jacket; it ___ get cold later.', ['might', 'must to', 'is might', 'mights'], 'Olasılık için “might + fiilin yalın hâli” kullanılır. Modal fiillerle “to”, “is” ya da -s kullanılmaz.'],
      ['verb + to-infinitive', 'We decided ___ the bus because it was faster.', ['to take', 'taking', 'take', 'took'], '“decide” fiilinden sonra “to + fiil” gelir: decided to take.'],
      ['as … as', 'My brother is as tall ___ my father.', ['as', 'than', 'like', 'so'], 'Eşitlik kalıbı “as + sıfat + as” şeklindedir. “than” karşılaştırma için kullanılır (taller than).'],
      ['possessive pronouns', 'Is this your pencil? – No, it isn’t ___ .', ['mine', 'my', 'me', 'I'], 'İsim olmadan sahiplik bildirmek için “mine” (benimki) kullanılır. “my” isimden önce gelir.'],
      ['while + past continuous', '___ I was walking home, it started to rain.', ['While', 'During', 'For', 'Since'], 'Cümlecikten önce (I was walking…) “while” kullanılır. “During” cümle değil isim alır (during the walk).'],
    ],
    Vocabulary: [
      ['daily routines', 'The bus was late this morning, so I ___ the first lesson.', ['missed', 'lost', 'forgot', 'left'], 'Bir dersi ya da otobüsü kaçırmak “miss” ile söylenir. “lose” bir eşyayı kaybetmektir (I lost my key).'],
      ['borrow / lend', 'Can you ___ me your ruler? I forgot mine.', ['lend', 'borrow', 'take', 'keep'], '“lend” ödünç vermek, “borrow” ödünç almaktır. Karşıdakinden isterken “Can you lend me…?” denir.'],
      ['travel', 'We need to ___ our hotel room before the holiday.', ['book', 'read', 'write', 'keep'], 'Rezervasyon yapmak “book” fiiliyle söylenir: book a room.'],
      ['health', 'I have a ___ ; my head hurts a lot.', ['headache', 'toothache', 'stomachache', 'sore throat'], 'Baş ağrısı “headache” olur. toothache = diş ağrısı, stomachache = mide ağrısı, sore throat = boğaz ağrısı.'],
      ['travel', 'Our flight was late, so we waited at the ___ for three hours.', ['airport', 'station', 'harbour', 'garage'], 'Uçuş (flight) için havalimanında (airport) beklenir. station = istasyon, harbour = liman.'],
      ['do / make', 'I always ___ my homework before dinner.', ['do', 'make', 'take', 'have'], 'Ödev yapmak “do homework” olur. Türkçedeki “yapmak” yüzünden “make” seçmek sık yapılan bir hatadır.'],
      ['do / make', 'Please don’t ___ so much noise; I’m trying to study.', ['make', 'do', 'give', 'take'], 'Gürültü yapmak “make noise” kalıbıyla söylenir.'],
      ['-ed / -ing adjectives', 'The film was so ___ that I fell asleep.', ['boring', 'bored', 'bore', 'boringly'], 'Bir şeyin özelliğini “-ing” sıfat anlatır (film sıkıcıydı = boring). Kişinin hissini “-ed” anlatır (I was bored).'],
      ['feelings', 'She was ___ before her first speech, so her hands were shaking.', ['nervous', 'relaxed', 'bored', 'lazy'], 'Elleri titreyen kişi gergin, heyecanlıdır: nervous. relaxed = rahat.'],
      ['weather', 'It’s very ___ today; I can’t see the end of the street.', ['foggy', 'sunny', 'hot', 'dry'], 'Görüşü engelleyen hava “foggy” (sisli) olur.'],
      ['shopping', 'These jeans don’t ___ me; they are too small.', ['fit', 'match', 'wear', 'try'], '“fit” beden olarak uymaktır (küçük geldiği için uymuyor). “match” renk ya da desen olarak uymaktır; “wear” giymektir, kişiyi nesne almaz.'],
      ['phrasal verbs', 'Please ___ your shoes before you enter the mosque.', ['take off', 'put on', 'turn off', 'get up'], '“take off” çıkarmak, “put on” giymek demektir. Camiye ayakkabı çıkarılarak girilir.'],
      ['jobs', 'An ___ designs buildings.', ['architect', 'mechanic', 'dentist', 'lawyer'], 'Binaları tasarlayan kişi “architect” (mimar) olur.'],
      ['technology', 'I can’t call you; my phone’s ___ is dead.', ['battery', 'screen', 'camera', 'button'], 'Şarjı biten şey “battery” (pil). “dead battery” = bitmiş pil.'],
      ['environment', 'Please put plastic bottles in the ___ bin.', ['recycling', 'kitchen', 'bath', 'school'], 'Plastik şişeler geri dönüşüm kutusuna atılır: recycling bin.'],
      ['places in town', 'You can buy medicine at the ___ .', ['pharmacy', "butcher's", 'post office', 'bakery'], 'İlaç “pharmacy”den (eczane) alınır. butcher’s = kasap, bakery = fırın.'],
      ['sport', 'Our team ___ the match 3–1, so we were very happy.', ['won', 'beat', 'earned', 'gained'], 'Maçı kazanmak “win a match” olur. “beat” rakibi yenmektir (We beat them), maçı değil.'],
      ['time words', 'I visit my grandparents twice a ___ : in summer and in winter.', ['year', 'week', 'day', 'hour'], 'Yazın ve kışın, yani yılda iki kez: twice a year.'],
      ['personality', 'My friend never shares anything; he is very ___ .', ['selfish', 'generous', 'friendly', 'honest'], 'Hiçbir şeyi paylaşmayan kişi “selfish” (bencil) olur. generous = cömert.'],
      ['say / tell', 'Can you ___ me the way to the station?', ['tell', 'say', 'speak', 'talk'], 'Kişiye bir şey anlatmak “tell + kişi” ile söylenir: tell me the way. “say me” yanlıştır.'],
      ['food', 'This soup has no taste; it needs more ___ .', ['salt', 'water', 'ice', 'plates'], 'Tatsız çorbaya “salt” (tuz) eklenir.'],
      ['housework', 'Whose turn is it to ___ the dishes tonight?', ['wash', 'cook', 'sleep', 'drive'], 'Bulaşık yıkamak “wash the dishes” olur.'],
      ['watch / look', 'We ___ a documentary about whales last night.', ['watched', 'looked', 'listened', 'heard'], 'Film ya da belgesel izlemek “watch” ile söylenir. “look” bir şeye bakmaktır (look at).'],
      ['fun / funny', 'The comedian was so ___ that everyone laughed.', ['funny', 'fun', 'bored', 'sad'], '“funny” güldüren, komik demektir. “fun” eğlenceli demektir (The trip was fun).'],
      ['feelings', 'I passed all my exams, so I feel very ___ of myself.', ['proud', 'afraid', 'tired', 'jealous'], '“be proud of” (-den gurur duymak) kalıbıdır. Sınavları geçen kişi kendisiyle gurur duyar.'],
    ],
  },
  B1: {
    Grammar: [
      ['present perfect', 'I ___ this film three times, so I already know the ending.', ['have seen', 'saw', 'am seeing', 'see'], 'Ne zaman olduğu söylenmeyen ve etkisi şimdi süren bir deneyim anlatılıyor; present perfect: have seen.'],
      ['for / since', 'We have lived in this flat ___ 2019.', ['since', 'for', 'from', 'during'], 'Başlangıç noktasıyla (2019) “since”, süreyle (five years) “for” kullanılır.'],
      ['just / already', 'Don’t worry about the dishes. I ___ washed them.', ['have just', 'just have', 'am just', 'was just'], '“just” present perfect’te “have” ile V3 arasına girer: I have just washed them (az önce yıkadım).'],
      ['first conditional', 'If it ___ tomorrow, we will stay at home.', ['rains', 'will rain', 'rained', 'would rain'], 'Birinci tip koşulda “if” cümleciği geniş zamandadır: If it rains, … will … “If it will rain” sık yapılan bir hatadır.'],
      ['second conditional', 'If I ___ more free time, I would learn to play the piano.', ['had', 'have', 'would have', 'will have'], 'Hayalî durumlar için ikinci tip koşul: If + past simple, would + fiil.'],
      ['passive (present)', 'English ___ in many countries.', ['is spoken', 'speaks', 'is speaking', 'spoken'], 'Dil konuşan değil, konuşulandır: edilgen yapı “is + V3” → is spoken.'],
      ['passive (past)', 'This bridge ___ in 1973.', ['was built', 'built', 'is built', 'has built'], 'Köprü geçmişte inşa edilmiştir: past simple edilgen “was + V3”.'],
      ['reported questions', 'He asked me where I ___ .', ['lived', 'do live', 'did live', 'does live'], 'Aktarılan sorularda soru düzeni bozulur ve zaman bir geri gider: where I lived. “do/did” kullanılmaz.'],
      ['used to', 'When I was a child, I ___ be afraid of the dark.', ['used to', 'use to', 'was used to', 'am used to'], 'Geçmişteki ama artık olmayan alışkanlıklar “used to + fiil” ile anlatılır. “be used to” bir şeye alışkın olmaktır.'],
      ['relative clauses (whose)', 'That’s the student ___ project won the science fair.', ['whose', 'who', 'which', "who's"], 'Sahiplik bildiren ilgi zamiri “whose” olur: projesi kazanan öğrenci. “who’s” = who is.'],
      ['gerunds after prepositions', 'I’m looking forward to ___ you next week.', ['seeing', 'see', 'to see', 'saw'], '“look forward to” kalıbındaki “to” bir edattır, bu yüzden fiil -ing alır: looking forward to seeing.'],
      ['modals of deduction', 'He has been running for an hour. He ___ be tired.', ['must', "can't", "mustn't", "needn't"], 'Güçlü bir çıkarım için “must” kullanılır (yorgun olmalı). “mustn’t” yasak bildirir, çıkarım değil.'],
      ['past perfect', 'When we arrived at the cinema, the film ___ already started.', ['had', 'has', 'was', 'did'], 'Geçmişteki bir olaydan (vardık) daha önce olan olay past perfect ile anlatılır: had started.'],
      ['enough', 'He isn’t old ___ to get a driving licence.', ['enough', 'too', 'very', 'so'], '“enough” sıfattan sonra gelir: old enough (yeterince yaşlı).'],
      ['so / such', 'It was ___ a good book that I read it in two days.', ['such', 'so', 'too', 'very'], '“a + sıfat + isim” öncesinde “such” kullanılır: such a good book. “so” yalnız sıfatla gelir (so good).'],
      ['question tags', 'You’re coming to the party, ___ ?', ["aren't you", "don't you", "isn't it", 'are you'], 'Olumlu cümleye olumsuz soru eki eklenir; yardımcı fiil “are” olduğu için: aren’t you?'],
      ['going to (plans)', 'I’ve bought the flour and eggs. I ___ make a cake.', ['am going to', 'will', 'would', 'was'], 'Önceden yapılmış bir plan (malzemeler alındı) “be going to” ile anlatılır.'],
      ['present perfect continuous', 'You look tired. ___ you been studying all night?', ['Have', 'Did', 'Were', 'Are'], 'Present perfect continuous “have been + -ing” ile kurulur; soru: Have you been studying…?'],
      ['comparatives (much)', 'This phone is ___ cheaper than the old one.', ['much', 'more', 'very', 'most'], 'Karşılaştırmayı güçlendirmek için “much” kullanılır: much cheaper. “very cheaper” yanlıştır.'],
      ['indefinite pronouns', 'I knocked, but ___ answered the door.', ['nobody', 'anybody', 'nothing', 'anything'], 'Olumlu fiille (answered) olumsuz anlam için “nobody” kullanılır. “anybody” olumsuz fiil ister.'],
      ['adjective + preposition', 'My little sister is afraid ___ spiders.', ['of', 'from', 'with', 'to'], 'Kalıp “afraid of” şeklindedir. Türkçedeki “-den korkmak” yüzünden “from” seçmek sık yapılan bir hatadır.'],
      ['let / make + object + verb', 'My parents let me ___ late on Saturdays.', ['stay', 'to stay', 'staying', 'stayed'], '“let + kişi + fiilin yalın hâli” kalıbı kullanılır: let me stay. “to” eklenmez.'],
      ['unless', 'You won’t pass ___ you study harder.', ['unless', 'if', 'when', 'because'], '“unless” = if … not (-mezsen). Daha çok çalışmazsan geçemezsin.'],
      ['although / despite', '___ it was raining, we went for a walk.', ['Although', 'Despite', 'However', 'Because of'], 'Cümlecikten (it was raining) önce “although” gelir. “despite” isim ya da -ing alır (despite the rain).'],
      ['make + object + verb', 'The teacher made us ___ the essay again.', ['write', 'to write', 'writing', 'wrote'], '“make + kişi + fiilin yalın hâli”: made us write.'],
    ],
    Vocabulary: [
      ['collocations', 'Before an important exam, try to ___ a good night’s sleep.', ['get', 'make', 'do', 'take'], 'Kalıp “get a good night’s sleep” (iyi bir gece uykusu çekmek) şeklindedir. “uyku yapmak” yüzünden “make” seçmek sık yapılan bir hatadır.'],
      ['collocations', 'I need to ___ a decision about which university to choose.', ['make', 'do', 'give', 'have'], 'Karar vermek “make a decision” olur. Türkçedeki “karar vermek” yüzünden “give” seçmek sık yapılan bir hatadır.'],
      ['collocations', 'Could you ___ attention, please? This part is important.', ['pay', 'do', 'make', 'spend'], 'Dikkat etmek “pay attention” kalıbıyla söylenir.'],
      ['phrasal verbs', 'Can you ___ my cat while I’m on holiday?', ['look after', 'look for', 'look up', 'look at'], '“look after” bakmak, ilgilenmek demektir. look for = aramak, look at = bakmak (gözle).'],
      ['phrasal verbs', 'I don’t know this word. I’ll ___ it in the dictionary.', ['look up', 'look after', 'look out', 'look into'], 'Sözlükte bir kelimeye bakmak “look up” ile söylenir.'],
      ['events', 'The concert was ___ because the singer was ill.', ['cancelled', 'celebrated', 'repaired', 'invited'], 'Şarkıcı hasta olduğu için konser iptal edildi: cancelled.'],
      ['school life', 'Many students feel a lot of ___ before exams.', ['stress', 'stretch', 'strength', 'struggle'], 'Sınav öncesi hissedilen gerginlik “stress” olur. stretch = germek, strength = güç.'],
      ['verb patterns', 'Our teacher ___ us to use a dictionary.', ['advised', 'suggested', 'said', 'explained'], '“advise + kişi + to” kalıbı doğrudur. “suggest us to” sık yapılan bir hatadır; suggest kişi + to almaz.'],
      ['collocations', 'I ___ my best, but I couldn’t finish the race.', ['did', 'made', 'gave', 'took'], 'Elinden geleni yapmak “do your best” olur.'],
      ['money', 'The museum is free, so you don’t have to pay an entrance ___ .', ['fee', 'bill', 'salary', 'tip'], 'Giriş ücreti “entrance fee” olur. bill = fatura, salary = maaş, tip = bahşiş.'],
      ['feelings', 'She was ___ when she won the scholarship.', ['delighted', 'disappointed', 'annoyed', 'ashamed'], 'Burs kazanan kişi çok sevinir: delighted. disappointed = hayal kırıklığına uğramış.'],
      ['phrasal verbs', 'Please ___ the form and give it back to the secretary.', ['fill in', 'fill up', 'give up', 'turn up'], 'Form doldurmak “fill in” ile söylenir. “fill up” bir kabı tamamen doldurmaktır.'],
      ['phrasal verbs', 'He ___ smoking last year and feels much healthier now.', ['gave up', 'gave in', 'took up', 'set up'], '“give up” bir alışkanlığı bırakmaktır. “take up” bir uğraşa başlamaktır.'],
      ['expressions', 'It’s a ___ that you can’t come to the party.', ['pity', 'sorry', 'sad', 'regret'], '“It’s a pity” (ne yazık) kalıbıdır. “a sorry / a sad” bu kalıpta kullanılmaz.'],
      ['phrasal verbs', 'Turn ___ the lights when you leave the room.', ['off', 'up', 'over', 'back'], 'Işığı kapatmak “turn off” olur. turn up = sesini açmak, turn over = çevirmek.'],
      ['collocations', 'The ___ of living in big cities is getting higher every year.', ['cost', 'price', 'value', 'money'], 'Hayat pahalılığı “the cost of living” kalıbıyla söylenir.'],
      ['relationships', 'My cousin and I ___ along very well; we never argue.', ['get', 'go', 'come', 'take'], 'İyi geçinmek “get along (with)” ile söylenir.'],
      ['collocations', 'We ___ a great time at the summer camp.', ['had', 'spent', 'did', 'made'], 'İyi vakit geçirmek “have a great time” olur. “spent a great time” Türkçeden çeviri bir hatadır; “spend” süreyle kullanılır (spent two weeks).'],
      ['weather', 'The weather ___ says it will be sunny all weekend.', ['forecast', 'predict', 'guess', 'foresee'], 'Hava tahmini “weather forecast” olur. “predict”, “guess” ve “foresee” fiildir; burada bir isim gerekir.'],
      ['money', 'I can’t ___ to buy a new laptop right now.', ['afford', 'allow', 'effort', 'offer'], 'Bir şeye parası yetmek “afford” ile söylenir. effort = çaba (isim).'],
      ['travel', 'Our flight was ___ for two hours because of the snow.', ['delayed', 'missed', 'lost', 'waited'], 'Uçuşun ertelenmesi, gecikmesi “delayed” ile söylenir.'],
      ['remind / remember', 'Can you ___ me to call grandma tonight?', ['remind', 'remember', 'memorize', 'mention'], '“remind” birine bir şeyi hatırlatmaktır. “remember” kendin hatırlamaktır.'],
      ['shopping', 'There’s a ___ of 20% on all shoes this week.', ['discount', 'receipt', 'change', 'refund'], 'İndirim “discount” olur. receipt = fiş, change = para üstü, refund = para iadesi.'],
      ['personality', 'My brother is very ___ ; he always tells the truth.', ['honest', 'lazy', 'rude', 'shy'], 'Her zaman doğruyu söyleyen kişi “honest” (dürüst) olur.'],
      ['spend / pay', 'She ___ a lot of money on clothes.', ['spends', 'pays', 'costs', 'buys'], 'Bir şeye para harcamak “spend money on” ile söylenir. “pay” ödemektir ve “for” alır (pay for).'],
    ],
  },
  B2: {
    Grammar: [
      ['third conditional', 'If I ___ about the road works, I would have left home earlier.', ['had known', 'knew', 'have known', 'would know'], 'Geçmişte olmamış bir durum ve sonucu: If + past perfect (had known), would have + V3.'],
      ['mixed conditional', 'If I had studied medicine, I ___ a doctor now.', ['would be', 'would have been', 'will be', 'am'], 'Geçmişteki bir koşulun şimdiki sonucu (now): If + had V3, would + fiil.'],
      ['wish (present)', 'I wish I ___ how to fix this; then I’d do it myself.', ['knew', 'know', 'will know', 'would know'], 'Şimdiki bir durum için dilek: wish + past simple (knew).'],
      ['wish (past)', 'I wish I ___ so much last night; I feel terrible now.', ["hadn't eaten", "didn't eat", "haven't eaten", "wouldn't eat"], 'Geçmişle ilgili pişmanlık: wish + past perfect (hadn’t eaten).'],
      ['passive with modals', 'The work must ___ by Friday.', ['be finished', 'finish', 'have finish', 'finished'], 'Modal fiille edilgen yapı: modal + be + V3 → must be finished.'],
      ['passive (present perfect)', 'Three new schools ___ in our town since 2020.', ['have been built', 'have built', 'were built', 'are building'], '“since” present perfect ister; okullar inşa edilmiştir: have been built.'],
      ['reported requests', 'She asked me ___ the window.', ['to open', 'open', 'opening', 'that I open'], 'Rica ve emirler aktarılırken “ask + kişi + to + fiil” kullanılır.'],
      ['modals (past deduction)', 'The streets are wet. It ___ rained during the night.', ['must have', "can't have", 'should', 'must'], 'Geçmişle ilgili güçlü bir çıkarım: must have + V3 (yağmış olmalı).'],
      ['should have', 'You ___ told me about the change; now I’ve missed the meeting.', ['should have', 'must have', 'could', 'would'], 'Geçmişte yapılmamış bir şey için eleştiri: should have + V3 (söylemeliydin).'],
      ['non-defining relative clauses', 'My grandmother, ___ is 80, still swims every day.', ['who', 'that', 'which', 'whose'], 'Virgüllerle ayrılan ek bilgi cümleciklerinde “that” kullanılmaz; kişi için “who”.'],
      ['participle clauses', '___ the letter, she started to cry.', ['Having read', 'Read', 'Have read', 'Being read'], 'Önce olan eylem “having + V3” ile anlatılır: mektubu okuduktan sonra ağlamaya başladı.'],
      ['future perfect', 'By the time you get home, I ___ dinner.', ['will have cooked', 'will cook', 'have cooked', 'cooked'], 'Gelecekteki bir andan önce tamamlanacak eylem: will have + V3.'],
      ['future continuous', 'This time tomorrow, we ___ over the Alps.', ['will be flying', 'will fly', 'fly', 'are flown'], 'Gelecekte belirli bir anda sürmekte olacak eylem: will be + -ing.'],
      ['causative have', 'I ___ my hair cut yesterday.', ['had', 'made', 'did', 'let'], 'Bir işi başkasına yaptırmak “have + nesne + V3” ile anlatılır: I had my hair cut.'],
      ['be used to', 'After living in Erzurum for years, she ___ cold winters.', ['is used to', 'used to', 'uses to', 'is use to'], 'Bir şeye alışkın olmak “be used to + isim/-ing” olur. “used to + fiil” geçmiş alışkanlıktır.'],
      ['gerunds after prepositions', 'She is good at ___ problems.', ['solving', 'solve', 'to solve', 'solved'], 'Edattan (at) sonra fiil -ing alır: good at solving.'],
      ['remember + to / -ing', 'Did you remember ___ the door before you left?', ['to lock', 'locking', 'lock', 'locked'], '“remember to do” yapılması gereken bir işi unutmamaktır. “remember doing” geçmişte yapılanı hatırlamaktır.'],
      ['stop + to / -ing', 'On the way to Ankara, we stopped ___ a cup of tea.', ['to have', 'having', 'have', 'had'], '“stop to do” bir şeyi yapmak için durmaktır. “stop doing” bir şeyi bırakmaktır (çay içmeyi bırakmak).'],
      ['articles', '___ sun rises in the east.', ['The', 'A', 'An', '—'], 'Tek olan şeylerle (the sun, the moon) belirli tanımlık “the” kullanılır.'],
      ['so / neither', 'I don’t like horror films. – ___ .', ['Neither do I', 'So do I', 'Neither I do', "I don't too"], 'Olumsuz bir cümleye katılmak “Neither do I” ile söylenir. “So do I” olumlu cümlelere katılırken kullanılır.'],
      ["it's time", 'It’s time we ___ home; it’s getting dark.', ['went', 'go', 'will go', 'have gone'], '“It’s time + özne” kalıbından sonra past simple gelir ama anlam şimdi/gelecektir.'],
      ['would rather', 'I’d rather you ___ smoke in here.', ["didn't", "don't", 'not', "won't"], '“would rather + başka bir özne” kalıbından sonra past simple gelir: I’d rather you didn’t.'],
      ['linking words', 'The project was difficult. ___ , we finished it on time.', ['Nevertheless', 'Therefore', 'Because', 'Despite'], 'Zıtlık bildiren bağlaç “Nevertheless” (yine de). Therefore = bu yüzden.'],
      ['neither / either', '___ of my two brothers likes football; they both prefer basketball.', ['Neither', 'None', 'Both', 'Either'], 'İki kişiden hiçbiri anlamında “neither” kullanılır. “none” ikiden fazlası içindir.'],
      ['adjective order', 'She bought a ___ bag.', ['beautiful small leather', 'leather small beautiful', 'small beautiful leather', 'beautiful leather small'], 'Sıfat sırası: görüş (beautiful) – boyut (small) – malzeme (leather).'],
    ],
    Vocabulary: [
      ['describing ideas', 'The new rule is rather ___ ; nobody is sure what it actually means.', ['vague', 'vast', 'valid', 'vivid'], '“vague” belirsiz, muğlak demektir. vast = çok geniş, valid = geçerli, vivid = canlı.'],
      ['business', 'The company plans to ___ its new product next spring.', ['launch', 'found', 'settle', 'raise'], 'Yeni bir ürünü piyasaya sürmek “launch” ile söylenir.'],
      ['rules', 'Smoking is ___ in all public buildings.', ['prohibited', 'permitted', 'promoted', 'predicted'], '“prohibited” yasak demektir. permitted = izin verilen, promoted = desteklenen.'],
      ['impact / effect', 'Her speech had a huge ___ on the audience.', ['impact', 'affect', 'result', 'cause'], '“have an impact on” (üzerinde etkisi olmak) kalıbıdır. “affect” bir fiildir, isim değildir.'],
      ['affect / effect', 'Lack of sleep can ___ your memory.', ['affect', 'effect', 'infect', 'reflect'], '“affect” etkilemek (fiil), “effect” etki (isim) demektir. Bu ikisi en sık karışan kelimelerdendir.'],
      ['phrasal verbs', 'We need to ___ a solution before the deadline.', ['come up with', 'come across', 'come down with', 'come round to'], '“come up with” bir fikir ya da çözüm bulmaktır. come across = tesadüfen rastlamak.'],
      ['phrasal verbs', 'She ___ a bad cold and stayed in bed for two days.', ['came down with', 'came up with', 'came across', 'came out'], '“come down with” bir hastalığa yakalanmaktır.'],
      ['academic verbs', 'The data ___ that students learn better after a short break.', ['suggest', 'suppose', 'suspect', 'supply'], 'Veriler bir sonucu gösterir, işaret eder: suggest. suspect = şüphelenmek.'],
      ['word choice', 'Studying abroad was a valuable ___ for me.', ['experience', 'experiment', 'expertise', 'expense'], 'Yurt dışında okumak bir yaşantı, bir deneyimdir: “experience”. experiment = deney, expertise = uzmanlık, expense = masraf.'],
      ['word choice', 'I’m sorry, I didn’t mean to ___ you.', ['offend', 'defend', 'attend', 'pretend'], '“offend” birini gücendirmektir. defend = savunmak, attend = katılmak, pretend = rol yapmak.'],
      ['similar words', 'The old town is famous for its ___ buildings, some of which date back to the Ottoman period.', ['historic', 'hysterical', 'heroic', 'hostile'], '“historic” tarihî, tarihsel öneme sahip demektir. hysterical = histerik.'],
      ['academic writing', 'Don’t forget to ___ your sources at the end of the essay.', ['cite', 'site', 'sight', 'seat'], '“cite” kaynak göstermektir. site (yer) ve sight (görüş) aynı okunur ama anlamları farklıdır.'],
      ['raise / rise', 'The government plans to ___ taxes on sugary drinks.', ['raise', 'rise', 'arise', 'grow'], '“raise” bir şeyi yükseltmektir (nesne alır). “rise” kendi kendine yükselmektir (nesne almaz).'],
      ['raise / rise', 'Prices ___ by 10% last year.', ['rose', 'raised', 'risen', 'arose'], 'Fiyatlar kendi kendine yükselir: rise – rose – risen. “risen” tek başına geçmiş zaman yapmaz.'],
      ['personality', 'He is very ___ ; he notices every small detail.', ['observant', 'obedient', 'obvious', 'ordinary'], '“observant” her şeyi fark eden, dikkatli demektir. obedient = itaatkâr.'],
      ['pros and cons', 'Online learning has both advantages and ___ .', ['drawbacks', 'drawings', 'backgrounds', 'benefits'], '“drawback” dezavantaj demektir; “advantages and drawbacks” zıtlık kurar.'],
      ['alike / like', 'The two sisters look very ___ ; people often confuse them.', ['alike', 'like', 'likely', 'similarly'], '“look alike” birbirine benzemektir. “look like” bir nesne ister (look like their mother).'],
      ['phrasal verbs', 'I can’t ___ up with this noise any longer!', ['put', 'make', 'take', 'keep'], '“put up with” bir şeye katlanmaktır.'],
      ['research', 'Scientists are ___ research into new energy sources.', ['carrying out', 'carrying away', 'making', 'taking'], 'Araştırma yürütmek “carry out research” ile söylenir. “make research” sık yapılan bir hatadır.'],
      ['people', 'The museum attracts thousands of ___ every year.', ['visitors', 'clients', 'passengers', 'patients'], 'Müzeye gelenler “visitors” (ziyaretçiler) olur. passengers = yolcular, patients = hastalar.'],
      ['describing change', 'There has been a ___ increase in the number of electric cars.', ['significant', 'signature', 'signal', 'signed'], '“significant” kayda değer, önemli demektir.'],
      ['phrasal verbs', 'We had to ___ the picnic until next week because of the rain.', ['put off', 'put out', 'put on', 'put up'], '“put off” ertelemektir. put out = (ateşi) söndürmek.'],
      ['similar words', 'He ___ that he had broken the window.', ['admitted', 'adopted', 'adapted', 'admired'], '“admit” kabul etmek, itiraf etmektir. adapt = uyum sağlamak, adopt = evlat edinmek/benimsemek.'],
      ['collocations', 'I’d like to ___ a complaint about the service.', ['make', 'do', 'say', 'tell'], 'Şikâyette bulunmak “make a complaint” ile söylenir.'],
      ['word choice', 'Her ___ of the problem was very clear and easy to follow.', ['explanation', 'exploration', 'expectation', 'explosion'], '“explanation” açıklamadır. exploration = keşif, expectation = beklenti.'],
    ],
  },
  C1: {
    Grammar: [
      ['inversion (not only)', 'Not only ___ the deadline, but she also helped two of her teammates.', ['did she meet', 'she met', 'she did meet', 'met she'], '“Not only” ile başlayan cümlede devrik yapı kullanılır: yardımcı fiil + özne + fiil (did she meet).'],
      ['inversion (rarely)', 'Rarely ___ such a beautiful sunset.', ['have I seen', 'I have seen', 'I saw', 'saw I'], 'Olumsuz anlamlı zarflarla (rarely, seldom, never) başlayan cümlede devrik yapı gelir: have I seen.'],
      ['inversion (no sooner)', 'No sooner ___ home than it started to pour.', ['had we arrived', 'we had arrived', 'did we arrived', 'we arrived'], '“No sooner … than” kalıbında past perfect devrik kullanılır: No sooner had we arrived than…'],
      ['inversion (hardly)', 'Hardly ___ the room when the phone rang.', ['had I entered', 'I had entered', 'did I entered', 'I entered'], '“Hardly … when” kalıbında past perfect devrik kullanılır: Hardly had I entered…'],
      ['inverted conditionals', '___ I known about the strike, I would have taken a taxi.', ['Had', 'If', 'Were', 'Should'], 'Üçüncü tip koşulda “if” atılıp devrik yapı kurulabilir: Had I known = If I had known. “If I known” yanlıştır.'],
      ['inverted conditionals', '___ you need any help, please call the office.', ['Should', 'Would', 'Had', 'Were'], 'Resmî dilde “If you should need” yerine “Should you need” kullanılır.'],
      ['cleft sentences (what)', '___ I need is a long holiday.', ['What', 'That', 'Which', 'It'], 'Vurgu cümlesi “What + özne + fiil + is …” şeklinde kurulur: What I need is…'],
      ['cleft sentences (it)', 'It was my sister ___ found the lost keys.', ['who', 'which', 'what', 'whom'], '“It was … who/that …” vurgu yapısında kişi için “who” kullanılır. Özne olduğu için “whom” olmaz.'],
      ['subjunctive', 'The committee recommended that every student ___ a short report.', ['submit', 'submitted', 'will submit', 'to submit'], '“recommend / suggest / insist that” sonrasında fiil yalın gelir (subjunctive): that every student submit.'],
      ['passive reporting verbs', 'He is said ___ the best chess player in the school.', ['to be', 'being', 'be', 'that he is'], '“be said / be believed + to + fiil” yapısı kullanılır: He is said to be…'],
      ['passive reporting verbs', 'She is believed ___ the country last year.', ['to have left', 'to leave', 'leaving', 'having left'], 'Geçmişte olan bir şey için “to have + V3” kullanılır: is believed to have left.'],
      ['reduced relative clauses', 'The students ___ in the competition will receive a certificate.', ['taking part', 'took part', 'are taking part', 'to taking part'], '“who are taking part” kısaltılınca “taking part” olur.'],
      ["needn't have", 'You ___ have bought milk; we already had two bottles.', ["needn't", "mustn't", "won't", "daren't"], '“needn’t have + V3” yapıldığı hâlde gerekli olmayan bir şeyi anlatır (almana gerek yoktu).'],
      ['emphatic do', 'I ___ understand your point, but I still disagree.', ['do', 'am', 'have', 'will'], 'Vurgu için olumlu cümlede “do + fiil” kullanılır: I do understand (gerçekten anlıyorum).'],
      ['however + adjective', 'However hard ___ , he couldn’t open the jar.', ['he tried', 'did he try', 'tried he', 'he has tried'], '“However + sıfat/zarf” sonrasında normal sıra kullanılır: However hard he tried (ne kadar uğraşsa da).'],
      ['were it not for', 'Were it not ___ your help, I would have failed.', ['for', 'of', 'with', 'by'], 'Kalıp “Were it not for / Had it not been for” (… olmasaydı) şeklindedir.'],
      ['inversion (so + adjective)', 'So ___ the noise that nobody could sleep.', ['loud was', 'was loud', 'loud it was', 'was it loud'], '“So + sıfat” ile başlayan cümlede fiil özneden önce gelir: So loud was the noise…'],
      ['inversion (little)', 'Little ___ that the surprise party was for him.', ['did he know', 'he knew', 'knew he', 'he did know'], '“Little” olumsuz anlamla başa gelince devrik yapı kullanılır: Little did he know (hiç bilmiyordu).'],
      ['inversion (only after)', 'Only after the exam ___ how much he had learned.', ['did he realise', 'he realised', 'realised he', 'he did realise'], '“Only after / only when” ile başlayan cümlede ana cümle devrik olur: did he realise.'],
      ['the … the …', 'The more you practise, ___ you become.', ['the more confident', 'more confident', 'the most confident', 'the confident'], '“The more …, the more …” (ne kadar çok …, o kadar …) kalıbında iki tarafta da “the” kullanılır.'],
      ['given that', 'Given ___ he had never cooked before, the meal was excellent.', ['that', 'what', 'which', 'as'], '“Given that” (… düşünülürse) kalıbıdır.'],
      ['be about to', 'I was about ___ when you called.', ['to leave', 'leaving', 'leave', 'left'], '“be about to + fiil” bir şeyi yapmak üzere olmaktır.'],
      ['it’s high time', 'It’s high time the council ___ something about the traffic.', ['did', 'does', 'do', 'has done'], '“It’s high time + özne” sonrasında past simple gelir: It’s high time they did something.'],
      ['substitution', 'Will it rain tomorrow? – I hope ___ .', ['not', 'no', "don't", 'none'], 'Olumsuz cevapta “I hope not” denir. “I don’t hope so” yanlıştır.'],
      ['inversion (not until)', 'Not until the results were published ___ how serious the problem was.', ['did we realise', 'we realised', 'we did realise', 'realised we'], '“Not until” ile başlayan cümlede ana cümle devrik olur: did we realise.'],
    ],
    Vocabulary: [
      ['attitudes', 'Despite strong criticism, the researcher remained ___ in her belief that the data were accurate.', ['steadfast', 'reluctant', 'indifferent', 'hesitant'], '“steadfast” kararlı, sarsılmaz demektir. reluctant = isteksiz, indifferent = umursamaz, hesitant = tereddütlü.'],
      ['describing texts', 'The lecture was so ___ that even experts struggled to follow it.', ['convoluted', 'concise', 'lucid', 'casual'], '“convoluted” karmaşık, dolambaçlı demektir. concise = kısa ve öz, lucid = anlaşılır.'],
      ['academic verbs', 'Her argument was ___ by solid evidence from several studies.', ['underpinned', 'undermined', 'underestimated', 'overlooked'], '“underpin” desteklemek, temelini oluşturmaktır. undermine = zayıflatmak.'],
      ['opinions', 'The new policy has been widely ___ for ignoring the needs of rural students.', ['criticised', 'applauded', 'endorsed', 'implemented'], '“for ignoring” olumsuz bir sebep verir: criticised (eleştirildi). applauded/endorsed = desteklendi.'],
      ['effort', 'Despite many setbacks, the team ___ and finished the project.', ['persevered', 'perished', 'persuaded', 'perceived'], '“persevere” zorluklara rağmen azimle devam etmektir. perish = yok olmak.'],
      ['describing texts', 'The documentary gives such a ___ account of life in the Arctic that you almost feel the cold.', ['vivid', 'vague', 'valid', 'vacant'], '“vivid” canlı, gözünde canlandıran demektir. vague = belirsiz.'],
      ['behaviour', 'His ___ remarks offended several people at the meeting.', ['tactless', 'tactful', 'thoughtful', 'tasteful'], '“tactless” düşüncesiz, patavatsız demektir. tactful bunun tam tersidir.'],
      ['results', 'The results were ___ ; neither side could claim victory.', ['inconclusive', 'incredible', 'indispensable', 'ingenious'], '“inconclusive” kesin bir sonuç vermeyen demektir.'],
      ['collocations', 'Travelling abroad really ___ my horizons.', ['broadened', 'lengthened', 'heightened', 'thickened'], 'Ufkunu genişletmek “broaden your horizons” kalıbıyla söylenir.'],
      ['similar words', 'She has a ___ for languages; she speaks five fluently.', ['flair', 'flare', 'fair', 'fare'], '“a flair for” bir konuda doğal yetenektir. flare (alev) aynı okunur ama anlamı farklıdır.'],
      ['phrasal verbs', 'We must ___ the risks before making a final decision.', ['weigh up', 'make up', 'turn up', 'give up'], '“weigh up” artıları ve eksileri tartmaktır.'],
      ['phrasal verbs', 'His story didn’t ___ ; it was full of contradictions.', ['add up', 'make up', 'set up', 'take up'], '“add up” mantıklı olmak, tutarlı olmaktır.'],
      ['dependent prepositions', 'The charity relies ___ donations from the public.', ['on', 'of', 'in', 'at'], 'Kalıp “rely on” (-e dayanmak, güvenmek) şeklindedir.'],
      ['similar words', 'Climate change poses a serious ___ to coastal cities.', ['threat', 'treat', 'thread', 'throat'], '“pose a threat to” (için tehdit oluşturmak) kalıbıdır. treat = ikram, thread = iplik.'],
      ['collocations', 'The speaker managed to ___ the audience’s attention for over an hour.', ['hold', 'lose', 'miss', 'drop'], 'Dikkati canlı tutmak “hold someone’s attention” ile söylenir.'],
      ['formal adjectives', 'It is ___ that we reduce plastic waste as soon as possible.', ['imperative', 'imperial', 'impartial', 'impulsive'], '“imperative” zorunlu, çok önemli demektir. impartial = tarafsız.'],
      ['describing texts', 'The novel ___ the struggles of a family during the war.', ['depicts', 'deposits', 'depletes', 'deploys'], '“depict” tasvir etmek, anlatmaktır. deplete = tüketmek.'],
      ['collocations', 'His sudden resignation came as a complete ___ .', ['surprise', 'amazement', 'astonish', 'wonder'], 'Kalıp “come as a (complete) surprise” şeklindedir. “astonish” bir fiildir.'],
      ['communication', 'She gave a ___ answer, avoiding any clear promise.', ['non-committal', 'non-stop', 'non-native', 'non-fiction'], '“non-committal” kaçamak, net bir söz vermeyen demektir.'],
      ['academic verbs', 'All the evidence ___ to a different conclusion.', ['points', 'looks', 'turns', 'sees'], '“point to” bir sonuca işaret etmektir.'],
      ['formal requests', 'Please ___ from using your phones during the performance.', ['refrain', 'restrain', 'retain', 'remain'], '“refrain from” bir şeyden kaçınmaktır. retain = elde tutmak.'],
      ['logic', 'The two options are ___ ; choosing one rules out the other.', ['mutually exclusive', 'mutually beneficial', 'closely related', 'easily confused'], '“mutually exclusive” birbirini dışlayan demektir: biri seçilince diğeri olmaz.'],
      ['behaviour', 'He tends to ___ his achievements to impress people.', ['exaggerate', 'underestimate', 'overlook', 'abandon'], 'İnsanları etkilemek için başarıları büyütmek “exaggerate” (abartmak) olur.'],
      ['similar words', 'The museum’s collection is ___ ; it would take days to see everything.', ['vast', 'vague', 'vain', 'vacant'], '“vast” çok büyük, engin demektir. vacant = boş, vain = boş yere.'],
      ['similar words', 'After months of negotiation, the two sides finally reached a ___ .', ['compromise', 'promise', 'premise', 'comprise'], '“reach a compromise” uzlaşmaya varmaktır. premise = öncül, comprise = içermek.'],
    ],
  },
};

function difficultyAt(index: number): QuizDifficulty {
  if (index < 8) return 'easy';
  if (index < 17) return 'medium';
  return 'hard';
}

export const ENGLISH_LEVEL_SEEDS: EnglishSeed[] = ENGLISH_LEVELS.flatMap((level) =>
  (['Grammar', 'Vocabulary'] as const).flatMap((skill) =>
    RAW[level][skill].map(([focus, prompt, options, explanation], index) => ({
      level,
      skill,
      focus,
      difficulty: difficultyAt(index),
      prompt,
      options,
      explanation,
    })),
  ),
);

const BY_PROMPT = new Map(ENGLISH_LEVEL_SEEDS.map((seed) => [seed.prompt, seed]));

/** Level and focus of an English level question, found by its text (nothing new is saved with quiz results). */
export function englishFocus(question: { subject: string; prompt: string }) {
  if (question.subject !== 'English') return null;
  const seed = BY_PROMPT.get(question.prompt);
  return seed ? { level: seed.level, focus: seed.focus } : null;
}
