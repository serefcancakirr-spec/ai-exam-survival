// Stage 21B: English reading and listening by CEFR level (A1–C1), for every grade.
// Per level: 3 reading texts (4 questions each) and 3 listening texts (3 questions each) = 21 questions; 105 in all.
// Original texts written for this app. Questions and options in English; explanations in Turkish (both app languages).
// In the source the FIRST option is the correct one; the question bank moves it to A–D.
// Listening texts are recorded once as small MP3 files (public/audio/en/<id>.mp3) with a free, open-source voice
// model on our own computer (no live AI, no paid service): see scripts/english-audio/README.md.
// Each speaker has an age and gender, and a matching voice.

import type { EnglishLevel } from './quiz-bank-english';

export type PassageKind = 'reading' | 'listening';
export type SpeakerAge = 'teen' | 'adult' | 'older';
export type Speaker = { gender: 'female' | 'male'; age: SpeakerAge; voice: string; accent: 'en-gb' | 'en-us' };
export type PassageQuestion = { prompt: string; options: [string, string, string, string]; explanation: string };

export type EnglishPassage = {
  id: string;
  level: EnglishLevel;
  kind: PassageKind;
  title: string;
  /** Reading: paragraphs. Listening: what each speaker says, in order. */
  lines: { speaker?: string; text: string }[];
  speakers?: Record<string, Speaker>;
  questions: PassageQuestion[];
};

/** Listening speed by level: slower and clearer for A1, natural for C1. */
export const LISTENING_SPEED: Record<EnglishLevel, number> = { A1: 0.85, A2: 0.9, B1: 1, B2: 1, C1: 1.05 };

const p = (text: string) => ({ text });
const say = (speaker: string, text: string) => ({ speaker, text });
const V = {
  teenBoy: { gender: 'male', age: 'teen', voice: 'am_puck', accent: 'en-us' },
  teenGirlUS: { gender: 'female', age: 'teen', voice: 'af_sky', accent: 'en-us' },
  youngWomanGB: { gender: 'female', age: 'teen', voice: 'bf_lily', accent: 'en-gb' },
  womanGB: { gender: 'female', age: 'adult', voice: 'bf_isabella', accent: 'en-gb' },
  womanGB2: { gender: 'female', age: 'adult', voice: 'bf_alice', accent: 'en-gb' },
  womanUS: { gender: 'female', age: 'adult', voice: 'af_heart', accent: 'en-us' },
  womanUS2: { gender: 'female', age: 'adult', voice: 'af_sarah', accent: 'en-us' },
  womanUS3: { gender: 'female', age: 'adult', voice: 'af_nova', accent: 'en-us' },
  womanUS4: { gender: 'female', age: 'adult', voice: 'af_bella', accent: 'en-us' },
  olderWomanGB: { gender: 'female', age: 'older', voice: 'bf_emma', accent: 'en-gb' },
  manGB: { gender: 'male', age: 'adult', voice: 'bm_daniel', accent: 'en-gb' },
  manGB2: { gender: 'male', age: 'adult', voice: 'bm_lewis', accent: 'en-gb' },
  manUS: { gender: 'male', age: 'adult', voice: 'am_michael', accent: 'en-us' },
  manUS2: { gender: 'male', age: 'adult', voice: 'am_eric', accent: 'en-us' },
  olderManGB: { gender: 'male', age: 'older', voice: 'bm_george', accent: 'en-gb' },
} satisfies Record<string, Speaker>;

export const ENGLISH_PASSAGES: EnglishPassage[] = [
  // ---------------- A1 ----------------
  {
    id: 'a1-read-1', level: 'A1', kind: 'reading', title: 'My Day',
    lines: [p('Hi, I’m Zeynep. I’m fourteen and I live in Eskişehir. I get up at seven o’clock every day. I have breakfast with my parents. I usually eat bread, cheese and olives. Then I walk to school with my friend Mert. School starts at half past eight. My favourite lesson is art. After school, I do my homework and play the guitar. I go to bed at ten.')],
    questions: [
      { prompt: 'What time does Zeynep get up?', options: ['At seven o’clock', 'At half past eight', 'At ten o’clock', 'At six o’clock'], explanation: '“I get up at seven o’clock” diyor. 8.30 okulun başlama saati, 10 ise yatma saati.' },
      { prompt: 'How does Zeynep go to school?', options: ['She walks.', 'She goes by bus.', 'Her parents drive her.', 'She rides a bike.'], explanation: '“I walk to school with my friend Mert” diyor: arkadaşıyla yürüyerek gidiyor.' },
      { prompt: 'What is Zeynep’s favourite lesson?', options: ['Art', 'Music', 'English', 'Maths'], explanation: '“My favourite lesson is art.” Gitar çaldığını söylüyor ama en sevdiği ders müzik değil, resim (art).' },
      { prompt: 'Which sentence is true about Zeynep?', options: ['She has breakfast with her parents.', 'She lives in İzmir.', 'She is fifteen years old.', 'She plays the piano.'], explanation: 'Metinde “I have breakfast with my parents” yazıyor. Eskişehir’de yaşıyor, 14 yaşında ve gitar çalıyor.' },
    ],
  },
  {
    id: 'a1-read-2', level: 'A1', kind: 'reading', title: 'Our Classroom',
    lines: [p('Our classroom is on the second floor. It is big and bright. There are twenty-eight desks and a large board. On the wall, there is a map of Türkiye and a clock. Our teacher’s desk is next to the window. There are some plants on the windowsill, and we water them every Monday. Our classroom is always clean because we tidy it at the end of every day.')],
    questions: [
      { prompt: 'Where is the classroom?', options: ['On the second floor', 'On the ground floor', 'On the third floor', 'In the garden'], explanation: 'İlk cümle: “Our classroom is on the second floor” (ikinci kat).' },
      { prompt: 'How many desks are there in the classroom?', options: ['Twenty-eight', 'Twenty', 'Eighteen', 'Thirty-eight'], explanation: '“There are twenty-eight desks” yazıyor: 28 sıra. Eighteen (18) ve twenty-eight (28) sık karıştırılır.' },
      { prompt: 'What is next to the window?', options: ['The teacher’s desk', 'The map of Türkiye', 'The clock', 'The board'], explanation: '“Our teacher’s desk is next to the window.” Harita ve saat duvarda.' },
      { prompt: 'Why is the classroom always clean?', options: ['The students tidy it every day.', 'A cleaner comes every Monday.', 'It is a new classroom.', 'Nobody uses it.'], explanation: '“we tidy it at the end of every day” diyor: öğrenciler her gün topluyor. Pazartesi bitkiler sulanıyor.' },
    ],
  },
  {
    id: 'a1-read-3', level: 'A1', kind: 'reading', title: 'A Message from Emre',
    lines: [p('Hi Deniz,'), p('How are you? I’m at my grandparents’ house in Rize this week. The weather is rainy, but it isn’t cold. My grandfather has a big tea garden, and every morning we pick tea leaves together. In the afternoon, I help my grandmother in the kitchen. Her corn bread is delicious! There’s no cinema here, so in the evening we play cards. I’m coming home on Sunday. See you at school on Monday!'), p('Emre')],
    questions: [
      { prompt: 'Where is Emre this week?', options: ['At his grandparents’ house', 'At school', 'At his own home', 'In a hotel'], explanation: '“I’m at my grandparents’ house in Rize this week” diyor: dedesi ve babaannesinin (anneannesinin) evinde.' },
      { prompt: 'What is the weather like in Rize?', options: ['Rainy, but not cold', 'Sunny and hot', 'Cold and snowy', 'Windy and cold'], explanation: '“The weather is rainy, but it isn’t cold”: yağmurlu ama soğuk değil.' },
      { prompt: 'What do they do in the evening?', options: ['They play cards.', 'They go to the cinema.', 'They pick tea leaves.', 'They make corn bread.'], explanation: 'Orada sinema olmadığı için akşamları kart oynuyorlar. Çay sabah toplanıyor.' },
      { prompt: 'When will Emre see Deniz?', options: ['On Monday', 'On Sunday', 'This evening', 'Next month'], explanation: 'Pazar günü eve dönüyor, Deniz’i pazartesi okulda görecek: “See you at school on Monday!”' },
    ],
  },
  {
    id: 'a1-listen-1', level: 'A1', kind: 'listening', title: 'About Me',
    speakers: { Ali: V.teenBoy },
    lines: [say('Ali', 'Hello! My name is Ali. I am fifteen years old. I live in Samsun with my family. I have one sister. Her name is Ece. We go to school by bus every morning.')],
    questions: [
      { prompt: 'How old is Ali?', options: ['Fifteen', 'Fourteen', 'Fifty', 'Sixteen'], explanation: 'Ali “I am fifteen years old” diyor: 15 yaşında. Fifteen (15) ile fifty (50) seste birbirine benzer.' },
      { prompt: 'Where does Ali live?', options: ['In Samsun', 'In Sinop', 'In İzmir', 'In Ankara'], explanation: '“I live in Samsun with my family”: ailesiyle Samsun’da yaşıyor.' },
      { prompt: 'How does Ali go to school?', options: ['By bus', 'On foot', 'By car', 'By bike'], explanation: '“We go to school by bus every morning”: okula otobüsle gidiyor.' },
    ],
  },
  {
    id: 'a1-listen-2', level: 'A1', kind: 'listening', title: 'At the Café',
    speakers: { Waiter: V.manGB, Girl: V.youngWomanGB },
    lines: [
      say('Waiter', 'Good afternoon! What would you like?'),
      say('Girl', 'Can I have an orange juice, please?'),
      say('Waiter', 'Of course. Small or large?'),
      say('Girl', 'Large, please. And a cheese sandwich.'),
      say('Waiter', 'Here you are. That’s seventy liras.'),
      say('Girl', 'Here you are. Thank you!'),
    ],
    questions: [
      { prompt: 'What drink does the girl order?', options: ['An orange juice', 'An apple juice', 'A cup of tea', 'A bottle of water'], explanation: 'Kız “Can I have an orange juice, please?” diyor: portakal suyu istiyor.' },
      { prompt: 'What size is her drink?', options: ['Large', 'Small', 'Medium', 'Extra small'], explanation: 'Garson “Small or large?” diye soruyor, kız “Large, please” diyor.' },
      { prompt: 'How much does she pay?', options: ['Seventy liras', 'Seventeen liras', 'Seven liras', 'Seventy-five liras'], explanation: 'Garson “That’s seventy liras” diyor: 70 lira. Seventy (70) ile seventeen (17) seste karışabilir.' },
    ],
  },
  {
    id: 'a1-listen-3', level: 'A1', kind: 'listening', title: 'My Cat',
    speakers: { Melis: V.teenGirlUS },
    lines: [say('Melis', 'I have a cat. Her name is Pamuk. She is white and very small. She is two years old. Pamuk likes milk and fish, but she doesn’t like dogs! She sleeps on my bed every night. In the morning, she wakes me up at six. I love her very much.')],
    questions: [
      { prompt: 'What colour is Pamuk?', options: ['White', 'Black', 'Grey', 'Brown'], explanation: '“She is white and very small”: Pamuk beyaz ve küçük.' },
      { prompt: 'What doesn’t Pamuk like?', options: ['Dogs', 'Milk', 'Fish', 'The bed'], explanation: '“Pamuk likes milk and fish, but she doesn’t like dogs!” Süt ve balığı seviyor, köpekleri sevmiyor.' },
      { prompt: 'What does Pamuk do in the morning?', options: ['She wakes Melis up.', 'She drinks her milk.', 'She goes outside.', 'She plays with a dog.'], explanation: '“In the morning, she wakes me up at six”: sabah altıda Melis’i uyandırıyor.' },
    ],
  },
  // ---------------- A2 ----------------
  {
    id: 'a2-read-1', level: 'A2', kind: 'reading', title: 'A Weekend in Cappadocia',
    lines: [p('Last weekend, my family and I went to Cappadocia. We stayed in a small cave hotel. On Saturday, we got up very early, at five o’clock, because we wanted to watch the hot-air balloons. There were more than a hundred balloons in the sky, and it was amazing. After breakfast, we visited an old underground city. It was dark and cold inside, and the tunnels were very narrow. My little brother was scared, but I loved it. On Sunday, we bought some pottery for my grandmother and drove back home. It was the best weekend of the year!')],
    questions: [
      { prompt: 'Why did the family get up at five o’clock?', options: ['To watch the hot-air balloons', 'To catch an early bus', 'To visit the underground city', 'To buy pottery'], explanation: '“because we wanted to watch the hot-air balloons”: balonları izlemek için erken kalktılar.' },
      { prompt: 'What was the underground city like?', options: ['Dark and cold', 'Bright and warm', 'Big and modern', 'Crowded and noisy'], explanation: '“It was dark and cold inside, and the tunnels were very narrow”: karanlık ve soğuktu.' },
      { prompt: 'Who was scared in the underground city?', options: ['The writer’s little brother', 'The writer', 'The writer’s grandmother', 'The writer’s father'], explanation: '“My little brother was scared, but I loved it.” Korkan, yazarın küçük kardeşi.' },
      { prompt: 'What did they buy on Sunday?', options: ['Some pottery', 'A painting', 'A carpet', 'A balloon ride'], explanation: 'Pazar günü büyükanneleri için çömlek (pottery) aldılar.' },
    ],
  },
  {
    id: 'a2-read-2', level: 'A2', kind: 'reading', title: 'The School Garden Project',
    lines: [p('In September, our class started a garden project. Behind the sports hall, there was an empty piece of land, and our science teacher asked the head teacher if we could use it. First, we cleaned the area and removed the rubbish. Then, we planted tomatoes, peppers and beans. Every class has a day to water the plants; ours is Thursday. In October, it rained a lot and some plants died, so we planted them again. Now the vegetables are growing well. In June, we are going to sell them at the school fair and give the money to the animal shelter in our town.')],
    questions: [
      { prompt: 'Where is the school garden?', options: ['Behind the sports hall', 'In front of the school', 'Next to the animal shelter', 'On the roof'], explanation: '“Behind the sports hall, there was an empty piece of land”: bahçe spor salonunun arkasında.' },
      { prompt: 'What did the students do first?', options: ['They cleaned the area.', 'They planted tomatoes.', 'They sold vegetables.', 'They watered the plants.'], explanation: '“First, we cleaned the area and removed the rubbish”: önce alanı temizlediler, sonra ektiler.' },
      { prompt: 'Why did some plants die in October?', options: ['It rained a lot.', 'Nobody watered them.', 'It was too hot.', 'Animals ate them.'], explanation: '“In October, it rained a lot and some plants died”: çok yağmur yağdığı için.' },
      { prompt: 'What will the class do with the money from the fair?', options: ['Give it to the animal shelter', 'Buy new seeds', 'Build a second garden', 'Pay for a class trip'], explanation: 'Sebzeleri haziranda satıp parayı kasabadaki hayvan barınağına verecekler.' },
    ],
  },
  {
    id: 'a2-read-3', level: 'A2', kind: 'reading', title: 'Looking for a Pen Friend',
    lines: [p('Hello everyone! I’m Kerem from Antalya. I’m writing because I want to find a pen friend to practise my English. I’m sixteen and I’m in the tenth grade. I’m interested in football, video games and cooking. Yes, cooking! I learned to make pizza from videos online last summer, and now I cook for my family every Friday. I’m not very good at writing in English yet, so I want to improve. I’d like to write to someone from another country, maybe once a week. Please don’t send me your phone number or address; let’s just write messages here on the school forum. Write back soon!')],
    questions: [
      { prompt: 'Why is Kerem writing this post?', options: ['To find someone to practise English with', 'To sell his video games', 'To learn how to make pizza', 'To invite people to Antalya'], explanation: '“I want to find a pen friend to practise my English”: İngilizce pratik yapacak bir mektup arkadaşı arıyor.' },
      { prompt: 'How did Kerem learn to make pizza?', options: ['From videos online', 'From his mother', 'On a cooking course', 'At school'], explanation: '“I learned to make pizza from videos online last summer”: internetteki videolardan öğrendi.' },
      { prompt: 'How often would Kerem like to write?', options: ['Once a week', 'Every day', 'Every Friday', 'Once a month'], explanation: '“maybe once a week”: haftada bir. Cuma günleri ailesine yemek yapıyor; bu, yazışmayla ilgili değil.' },
      { prompt: 'What does Kerem ask people not to do?', options: ['Share their phone number or address', 'Write in English', 'Write about football', 'Reply on the school forum'], explanation: 'Telefon numarası ve adres göndermemelerini, sadece okul forumunda yazışmayı istiyor. İnternette kişisel bilgi paylaşmamak önemlidir.' },
    ],
  },
  {
    id: 'a2-listen-1', level: 'A2', kind: 'listening', title: 'Grandma’s New Phone',
    speakers: { Grandma: V.olderWomanGB, Elif: V.youngWomanGB },
    lines: [
      say('Grandma', 'Elif, can you help me with my new phone? I can’t find the photos you sent me.'),
      say('Elif', 'Sure, Grandma! Look, tap this green button. Your photos are all here.'),
      say('Grandma', 'Oh, wonderful! And how do I send a message back?'),
      say('Elif', 'Tap the photo, then write your message here and press send.'),
      say('Grandma', 'Thank you, dear. You are a great teacher!'),
    ],
    questions: [
      { prompt: 'What can’t Grandma find on her new phone?', options: ['The photos Elif sent', 'Elif’s phone number', 'Her glasses', 'The send button'], explanation: 'Büyükanne “I can’t find the photos you sent me” diyor: Elif’in gönderdiği fotoğrafları bulamıyor.' },
      { prompt: 'Which button does Elif tell her to tap first?', options: ['The green button', 'The red button', 'The blue button', 'The home button'], explanation: 'Elif “Look, tap this green button” diyor: yeşil düğme.' },
      { prompt: 'What does Grandma say about Elif at the end?', options: ['She is a great teacher.', 'She is very busy.', 'She should buy a new phone.', 'She should call more often.'], explanation: 'Konuşmanın sonunda “You are a great teacher!” diyor.' },
    ],
  },
  {
    id: 'a2-listen-2', level: 'A2', kind: 'listening', title: 'Weather Forecast',
    speakers: { Presenter: V.manUS },
    lines: [say('Presenter', 'Good morning! Here is the weather for today. In Istanbul, it will be cloudy in the morning, and there may be some rain in the afternoon, so don’t forget your umbrella. The temperature will be around fourteen degrees. In Ankara, it will be sunny but cold, only six degrees, and it will be windy in the evening. In Antalya, it will be warm and sunny all day, with twenty-two degrees. Have a nice day!')],
    questions: [
      { prompt: 'What might happen in Istanbul in the afternoon?', options: ['It may rain.', 'It will snow.', 'It will be very hot.', 'It will be windy.'], explanation: '“there may be some rain in the afternoon”: öğleden sonra yağmur yağabilir, bu yüzden şemsiye öneriliyor.' },
      { prompt: 'What will the temperature be in Ankara?', options: ['Six degrees', 'Fourteen degrees', 'Twenty-two degrees', 'Sixteen degrees'], explanation: 'Ankara “sunny but cold, only six degrees”: 6 derece. 14 İstanbul’un, 22 Antalya’nın sıcaklığı.' },
      { prompt: 'Which city will be the warmest?', options: ['Antalya', 'Istanbul', 'Ankara', 'They will all be the same.'], explanation: 'Antalya 22 derece ile en sıcak şehir.' },
    ],
  },
  {
    id: 'a2-listen-3', level: 'A2', kind: 'listening', title: 'At the Library',
    speakers: { Boy: V.teenBoy, Librarian: V.womanGB },
    lines: [
      say('Boy', 'Excuse me, I’m looking for a book about planets.'),
      say('Librarian', 'Science books are on the second floor, next to the computers.'),
      say('Boy', 'Thank you. Can I take three books home?'),
      say('Librarian', 'Yes, you can borrow three books for two weeks. Do you have a library card?'),
      say('Boy', 'No, I don’t.'),
      say('Librarian', 'No problem. Just fill in this form and show me your student ID. It’s free.'),
      say('Boy', 'Great, thanks!'),
    ],
    questions: [
      { prompt: 'What kind of book is the boy looking for?', options: ['A book about planets', 'A history book', 'A book about computers', 'A cookbook'], explanation: '“I’m looking for a book about planets”: gezegenlerle ilgili bir kitap arıyor. Bilgisayarlar, kitapların yanında duruyor.' },
      { prompt: 'How long can he keep the books?', options: ['Two weeks', 'Three weeks', 'One week', 'Two days'], explanation: '“you can borrow three books for two weeks”: üç kitabı iki hafta tutabilir.' },
      { prompt: 'What does he need to do to get a library card?', options: ['Fill in a form and show his student ID', 'Pay a small fee', 'Bring one of his parents', 'Come back tomorrow'], explanation: 'Kütüphaneci formu doldurmasını ve öğrenci kimliğini göstermesini istiyor; kart ücretsiz (“It’s free”).' },
    ],
  },
  // ---------------- B1 ----------------
  {
    id: 'b1-read-1', level: 'B1', kind: 'reading', title: 'A Quiet New Member',
    lines: [
      p('Last month, our school robotics club had a problem. We had built a small robot for the regional competition, but it kept turning left when it should go straight. We tried everything: new batteries, new wheels, even a new program. Nothing worked.'),
      p('Then Deniz, a quiet student in the ninth grade, joined the club. She didn’t say much at the first meeting. She just watched the robot carefully and took notes. At the second meeting, she asked if she could look inside it. After ten minutes, she found the problem: one of the motors was a little weaker than the other.'),
      p('We replaced the motor two days before the competition. Our robot didn’t win, but it finished the course without a single mistake, and we came fourth out of twenty teams. Now Deniz is in charge of testing every robot before it leaves the lab.'),
    ],
    questions: [
      { prompt: 'What is the text mainly about?', options: ['How a new member helped the club solve a problem', 'How to build a robot for a competition', 'Why the club won the regional competition', 'Why Deniz wanted to leave the club'], explanation: 'Metnin büyük kısmı, yeni gelen Deniz’in robotun sorununu nasıl bulduğunu anlatıyor. Kulüp yarışmayı kazanmadı, dördüncü oldu.' },
      { prompt: 'What was wrong with the robot?', options: ['One motor was weaker than the other.', 'The batteries were too old.', 'The program had a mistake.', 'The wheels were the wrong size.'], explanation: 'Kulüp pilleri, tekerlekleri ve programı değiştirdi ama sorun çözülmedi. Deniz motorlardan birinin daha zayıf olduğunu buldu.' },
      { prompt: 'In the last paragraph, “in charge of” is closest in meaning to ___ .', options: ['responsible for', 'afraid of', 'tired of', 'paid for'], explanation: '“be in charge of” bir işten sorumlu olmak demektir. Deniz artık her robotu test etmekten sorumlu.' },
      { prompt: 'What can we infer about Deniz?', options: ['She pays close attention to details.', 'She is the leader of the club.', 'She has built many robots before.', 'She talks a lot in meetings.'], explanation: 'Robotu dikkatle izleyip not aldı ve küçük bir farkı buldu; bu, ayrıntılara dikkat ettiğini gösterir. Lider olduğu ya da daha önce robot yaptığı yazmıyor.' },
    ],
  },
  {
    id: 'b1-read-2', level: 'B1', kind: 'reading', title: 'Should Homework Be Banned?',
    lines: [
      p('Every year, some parents and students ask the same question: is homework really useful? Supporters say that homework helps students remember what they learned in class and teaches them to manage their time. Critics, on the other hand, believe that too much homework causes stress and leaves no time for sport, hobbies or family.'),
      p('When our school newspaper asked students about it last month, many of them said they spend around two hours a day on homework. Most said they did not mind short tasks, but they disliked long projects with unclear instructions.'),
      p('In my opinion, homework should not be banned. Instead, teachers could give shorter tasks that students can finish in about thirty minutes, and explain clearly why each task is important.'),
    ],
    questions: [
      { prompt: 'What is the writer’s opinion?', options: ['Homework should be shorter and clearer, not banned.', 'Homework should be banned.', 'Students should get more homework.', 'Only long projects are useful.'], explanation: 'Son paragrafta “homework should not be banned” diyor ve daha kısa, amacı açık ödevler öneriyor.' },
      { prompt: 'According to critics, what is a problem with homework?', options: ['It leaves little time for other activities.', 'It is too easy.', 'It helps students remember lessons.', 'It teaches time management.'], explanation: 'Eleştirenler, çok ödevin stres yarattığını ve spora, hobilere, aileye zaman bırakmadığını söylüyor. C ve D destekçilerin görüşleridir.' },
      { prompt: 'What did many students say they disliked?', options: ['Long projects with unclear instructions', 'Short tasks', 'Homework at weekends', 'Working in groups'], explanation: 'Öğrenciler kısa ödevlere itiraz etmediklerini, ama talimatı belirsiz uzun projeleri sevmediklerini söylüyor.' },
      { prompt: 'In the first paragraph, “on the other hand” is used to ___ .', options: ['introduce a different point of view', 'give an example', 'add a similar idea', 'show a result'], explanation: '“on the other hand” (öte yandan) karşıt bir görüşü başlatır: destekçilerden sonra eleştirenlerin görüşü geliyor.' },
    ],
  },
  {
    id: 'b1-read-3', level: 'B1', kind: 'reading', title: 'The Girl Who Planted Trees',
    lines: [
      p('When Ayla was twelve, a forest fire destroyed the hills near her village in Muğla. She remembers standing on the balcony with her grandmother, watching the black smoke. “The trees will come back,” her grandmother said, “but only if someone plants them.”'),
      p('The next spring, Ayla collected pine seeds and grew small trees in yoghurt pots on her balcony. Her friends laughed at first, but soon some of them started to help. They wrote to the local council and asked for permission to plant the young trees on the hills. To their surprise, the council not only agreed but also gave them tools and water tanks.'),
      p('Five years later, more than two thousand young trees cover part of the hill. Ayla, now seventeen, wants to study forestry at university. “I didn’t do it alone,” she says. “Every small pot was someone’s help.”'),
    ],
    questions: [
      { prompt: 'What made Ayla start growing trees?', options: ['A forest fire near her village', 'A school project', 'Her friends asked her to', 'The council paid her'], explanation: 'Köyünün yakınındaki tepeleri yok eden orman yangını ve büyükannesinin sözleri onu harekete geçirdi.' },
      { prompt: 'How did the local council respond to the young people?', options: ['It agreed and gave them equipment.', 'It refused their request.', 'It asked them to wait five years.', 'It laughed at their idea.'], explanation: 'Belediye sadece izin vermekle kalmadı, alet ve su tankı da verdi (“not only agreed but also gave them tools”). Gülenler başta arkadaşlarıydı.' },
      { prompt: 'What does “To their surprise” suggest?', options: ['They did not expect so much help from the council.', 'They were angry with the council.', 'They knew the council would help.', 'They were bored with the project.'], explanation: '“To their surprise” (şaşırarak) beklemedikleri bir şey olduğunu gösterir: belediyenin bu kadar yardım edeceğini beklemiyorlardı.' },
      { prompt: 'What does Ayla mean by “Every small pot was someone’s help”?', options: ['Many people helped to make it a success.', 'She bought the pots from a shop.', 'The pots were very expensive.', 'She wants to sell the pots.'], explanation: '“I didn’t do it alone” ile birlikte düşünülünce, başarının birçok kişinin katkısıyla geldiğini söylüyor.' },
    ],
  },
  {
    id: 'b1-listen-1', level: 'B1', kind: 'listening', title: 'Trip Announcement',
    speakers: { 'Ms Aydın': V.womanGB },
    lines: [say('Ms Aydın', 'Good morning, everyone. This is an announcement about Friday’s trip to the science museum. The bus will leave from the school gate at half past eight, not at nine as we said last week, so please don’t be late. The trip is free, but you need to bring a form signed by your parents. Please give it to your class teacher by Wednesday. Bring a packed lunch and some water, because the museum café will be closed for repairs. We’ll be back at school at about three o’clock. If it rains, the trip will still go ahead, so bring a jacket. Thank you.')],
    questions: [
      { prompt: 'What time will the bus leave?', options: ['At 8:30', 'At 9:00', 'At 3:00', 'At 8:00'], explanation: '“half past eight” saat 8.30 demektir. Duyuruda “not at nine as we said last week” deniyor: 9.00 eski saat. 3.00 dönüş saati.' },
      { prompt: 'Why should students bring their own lunch?', options: ['The museum café will be closed.', 'Food is expensive at the museum.', 'The trip will take all day.', 'The teacher wants them to share food.'], explanation: '“the museum café will be closed for repairs”: müze kafesi tadilat nedeniyle kapalı olacak.' },
      { prompt: 'What will happen if it rains?', options: ['The trip will still go ahead.', 'The trip will be cancelled.', 'The trip will move to another day.', 'The students will stay on the bus.'], explanation: '“the trip will still go ahead” gezinin yine de yapılacağı anlamına gelir; bu yüzden ceket getirmeleri isteniyor.' },
    ],
  },
  {
    id: 'b1-listen-2', level: 'B1', kind: 'listening', title: 'Planning a Study Session',
    speakers: { Can: V.teenBoy, Selin: V.teenGirlUS },
    lines: [
      say('Can', 'Hi Selin! Are you ready for the history exam on Monday?'),
      say('Selin', 'Not really. I’ve read the first two chapters, but I haven’t started the third one yet.'),
      say('Can', 'Me neither. Why don’t we study together at the library tomorrow?'),
      say('Selin', 'Good idea, but the library closes at five on Saturdays. Can we meet at two?'),
      say('Can', 'Two is fine. I’ll bring my notes from class, and you can bring the flashcards you made.'),
      say('Selin', 'Great. Let’s make a quiz for each other at the end. It’s more fun than just reading.'),
    ],
    questions: [
      { prompt: 'What does Selin still need to study?', options: ['The third chapter', 'The first chapter', 'The whole book', 'Nothing'], explanation: 'Selin ilk iki bölümü okuduğunu ama üçüncüye başlamadığını söylüyor.' },
      { prompt: 'When will they meet?', options: ['At two o’clock tomorrow', 'At five o’clock tomorrow', 'On Monday morning', 'This evening'], explanation: 'Saat beş kütüphanenin kapanış saati; buluşma saati iki olarak kararlaştırılıyor. Pazartesi sınav günü.' },
      { prompt: 'What will they do at the end of the session?', options: ['Make a quiz for each other', 'Read the chapters again', 'Watch a history film', 'Go home at five'], explanation: 'Selin “Let’s make a quiz for each other at the end” diyor: sonunda birbirlerine küçük bir test hazırlayacaklar.' },
    ],
  },
  {
    id: 'b1-listen-3', level: 'B1', kind: 'listening', title: 'Teen Health Talk: Sleep',
    speakers: { Host: V.womanUS },
    lines: [say('Host', 'Welcome back to Teen Health Talk. Today’s topic is sleep. Most teenagers need between eight and ten hours of sleep a night, but many get much less. Why does this matter? When you don’t sleep enough, it’s harder to concentrate in class, and you may feel more stressed. So, what can you do? First, try to go to bed at the same time every night, even at weekends. Second, put your phone away at least thirty minutes before bed, because the light from the screen can keep your brain awake. And finally, if you feel tired in the afternoon, a short walk is better than a long nap.')],
    questions: [
      { prompt: 'How much sleep do most teenagers need?', options: ['Between eight and ten hours', 'Between six and eight hours', 'Between ten and twelve hours', 'About seven hours'], explanation: '“Most teenagers need between eight and ten hours of sleep a night”: gençlerin çoğu gecede 8–10 saat uykuya ihtiyaç duyar.' },
      { prompt: 'Why should you put your phone away before bed?', options: ['The screen light can keep your brain awake.', 'You might receive messages.', 'It uses too much battery.', 'Your parents want you to.'], explanation: '“the light from the screen can keep your brain awake”: ekran ışığı beyni uyanık tutabilir.' },
      { prompt: 'What does the speaker suggest if you feel tired in the afternoon?', options: ['Going for a short walk', 'Taking a long nap', 'Drinking coffee', 'Going to bed early'], explanation: '“a short walk is better than a long nap”: uzun bir şekerleme yerine kısa bir yürüyüş öneriyor.' },
    ],
  },
  // ---------------- B2 ----------------
  {
    id: 'b2-read-1', level: 'B2', kind: 'reading', title: 'The Rise of Second-Hand Fashion',
    lines: [
      p('Not long ago, buying second-hand clothes was something many teenagers preferred to keep quiet about. Today, it has become a source of pride. Online platforms and local swap events have made it easier than ever to find good-quality clothing at a fraction of the original price.'),
      p('There are several reasons behind this shift. Firstly, young people are increasingly aware of the environmental cost of fashion: producing a single pair of jeans requires a considerable amount of water and energy. Secondly, second-hand shopping allows people to express their individuality, since they are less likely to wear exactly the same items as everyone else. Finally, rising prices have made many families more careful with their budgets.'),
      p('However, the trend is not without its critics. Some argue that as second-hand shopping becomes fashionable, prices in charity shops rise, making it harder for people on low incomes to afford basic clothing. Others point out that buying more items, even used ones, does not solve the problem of overconsumption. Perhaps the real lesson is not simply to buy second-hand, but to buy less.'),
    ],
    questions: [
      { prompt: 'What is the main purpose of the text?', options: ['To discuss the reasons for a trend and some problems with it', 'To advertise an online clothing platform', 'To explain how jeans are made', 'To persuade readers never to buy new clothes'], explanation: 'Metin ikinci el modasının yükselme nedenlerini ve eleştirileri birlikte ele alıyor; reklam ya da kesin bir yasak çağrısı yok.' },
      { prompt: 'Which of these is NOT given as a reason for the trend?', options: ['Schools require it.', 'Concern for the environment', 'The wish to look different', 'Rising prices'], explanation: 'Çevre bilinci, farklı görünme isteği ve artan fiyatlar sayılıyor; okulların zorunlu tuttuğu söylenmiyor.' },
      { prompt: 'What concern do some critics raise?', options: ['Charity shop prices may rise for people on low incomes.', 'Second-hand clothes are poor quality.', 'Online platforms are unsafe.', 'Swap events are boring.'], explanation: 'Eleştirmenlere göre ikinci el moda olunca hayır mağazalarında fiyatlar artabilir ve düşük gelirliler temel giysileri almakta zorlanabilir.' },
      { prompt: 'What does the writer suggest in the last sentence?', options: ['Buying less matters more than where we shop.', 'People should buy only second-hand clothes.', 'People should buy only new clothes.', 'Charity shops should close.'], explanation: '“not simply to buy second-hand, but to buy less”: asıl ders, nereden aldığımızdan çok daha az almak.' },
    ],
  },
  {
    id: 'b2-read-2', level: 'B2', kind: 'reading', title: 'Can You Trust What You Read Online?',
    lines: [
      p('Every day, millions of people share news stories online without checking whether they are true. Researchers who study misinformation have found that false stories often spread faster than accurate ones, partly because they are designed to provoke strong emotions such as anger or fear.'),
      p('So how can you protect yourself? Experts recommend a few simple habits. Before sharing a story, look at the source: is it a well-known news organisation, or a website you have never heard of? Check the date, since old stories are sometimes shared as if they were new. Read beyond the headline, which may exaggerate or even contradict the article itself. Finally, see whether other reliable sources are reporting the same thing.'),
      p('Some schools have started teaching these skills in media literacy lessons. Teachers report that students quickly become more sceptical, but they also warn of a risk: if young people come to believe that nothing can be trusted, they may stop following the news altogether. The aim, they say, is not to doubt everything, but to question wisely.'),
    ],
    questions: [
      { prompt: 'According to the text, why do false stories often spread quickly?', options: ['They are designed to provoke strong emotions.', 'They are usually shorter.', 'They are shared by news organisations.', 'They are always about new events.'], explanation: 'Yanlış haberler öfke ya da korku gibi güçlü duygular uyandıracak şekilde hazırlandığı için daha hızlı yayılıyor.' },
      { prompt: 'Why should readers check the date of a story?', options: ['Old stories are sometimes shared as if they were new.', 'The date shows who wrote it.', 'New stories are always true.', 'The date shows how many people shared it.'], explanation: '“old stories are sometimes shared as if they were new”: eski haberler yeniymiş gibi paylaşılabilir.' },
      { prompt: 'In the last paragraph, “sceptical” is closest in meaning to ___ .', options: ['doubtful', 'confident', 'careless', 'cheerful'], explanation: '“sceptical” şüpheci, kolay inanmayan demektir; anlamca “doubtful”a en yakın.' },
      { prompt: 'What risk do the teachers mention?', options: ['Students may stop following the news altogether.', 'Students may share more fake news.', 'The lessons may be too long.', 'Students may stop using the internet.'], explanation: 'Öğretmenler, hiçbir şeye güvenilemeyeceğine inanan gençlerin haberleri takip etmeyi tamamen bırakabileceği konusunda uyarıyor.' },
    ],
  },
  {
    id: 'b2-read-3', level: 'B2', kind: 'reading', title: 'The Island That Said No to Cars',
    lines: [
      p('When the council of the small island of Mavikaya voted to ban private cars ten years ago, many residents were furious. Shop owners feared that tourists would stop coming, and older people worried about how they would carry their shopping home.'),
      p('A decade later, opinions have changed dramatically. The island’s narrow streets, once blocked by traffic, are now filled with cyclists, pedestrians and a fleet of small electric buses that run every fifteen minutes. Local businesses report that visitors stay longer, attracted by the quiet atmosphere and cleaner air. Even the most vocal opponents admit that the island has become a more pleasant place to live.'),
      p('That is not to say that the change was painless. In the first two years, several delivery companies refused to serve the island, and residents had to organise a shared delivery system using cargo bikes. Emergency services also needed special vehicles that could move through the narrow lanes.'),
      p('Other towns are now studying Mavikaya’s experience. Yet the island’s mayor warns against simply copying it: “What worked here worked because people helped to design it. A plan imposed from above would have failed.”'),
    ],
    questions: [
      { prompt: 'How did many residents first react to the ban?', options: ['They were very angry.', 'They were pleased.', 'They did not notice it.', 'They moved away.'], explanation: '“many residents were furious”: birçok ada sakini çok öfkeliydi.' },
      { prompt: 'Which of these is mentioned as a positive result?', options: ['Visitors stay longer.', 'More delivery companies serve the island.', 'Parking has become cheaper.', 'Older people drive more often.'], explanation: 'İşletmeler ziyaretçilerin daha uzun kaldığını söylüyor. İlk yıllarda bazı kargo şirketleri adaya hizmet vermeyi bıraktı.' },
      { prompt: 'What problem appeared in the first two years?', options: ['Some delivery companies refused to serve the island.', 'The electric buses often broke down.', 'Tourists stopped coming.', 'There were many accidents with bikes.'], explanation: '“several delivery companies refused to serve the island”: bazı kargo şirketleri adaya gitmeyi reddetti, sakinler kargo bisikletleriyle ortak bir sistem kurdu.' },
      { prompt: 'What is the mayor’s main point?', options: ['A plan works best when local people help to create it.', 'Every town should ban cars.', 'Car bans always fail.', 'The mayor designed the plan alone.'], explanation: 'Belediye başkanı planın, insanlar tasarımına katıldığı için işe yaradığını; yukarıdan dayatılan bir planın başarısız olacağını söylüyor.' },
    ],
  },
  {
    id: 'b2-listen-1', level: 'B2', kind: 'listening', title: 'Interview for a Summer Camp Job',
    speakers: { Interviewer: V.manGB2, Ece: V.youngWomanGB },
    lines: [
      say('Interviewer', 'Thanks for coming in. So, why would you like to work at our summer camp?'),
      say('Ece', 'Well, I’ve been volunteering at a children’s library for two years, and I’ve realised that I really enjoy working with younger kids. I’d also like to get some experience before I start studying education at university.'),
      say('Interviewer', 'That sounds great. What would you do if a child refused to take part in an activity?'),
      say('Ece', 'I think I’d try to find out why first. Sometimes children are just nervous, so I’d give them a smaller role, like keeping the score, until they feel more confident.'),
      say('Interviewer', 'Good answer. The job involves some early mornings. Is that a problem?'),
      say('Ece', 'Not at all. I’m used to getting up early, because I go swimming before school three times a week.'),
      say('Interviewer', 'Perfect. We’ll let you know by Friday.'),
    ],
    questions: [
      { prompt: 'Why does Ece want to work at the summer camp?', options: ['She enjoys working with children and wants experience.', 'She needs money to buy a car.', 'Her friends work there.', 'She does not want to go to university.'], explanation: 'Çocuklarla çalışmayı sevdiğini ve üniversitede eğitim okumadan önce deneyim kazanmak istediğini söylüyor.' },
      { prompt: 'What would Ece do if a child refused to join an activity?', options: ['Find out why and give the child a smaller role', 'Call the child’s parents', 'Make the child take part anyway', 'Send the child home'], explanation: 'Önce nedenini anlamaya çalışacağını, çekingen çocuğa skor tutmak gibi küçük bir görev vereceğini söylüyor.' },
      { prompt: 'Why are early mornings not a problem for Ece?', options: ['She already gets up early to go swimming.', 'She lives next to the camp.', 'She doesn’t need much sleep.', 'She likes having breakfast early.'], explanation: 'Haftada üç kez okuldan önce yüzmeye gittiği için erken kalkmaya alışkın.' },
    ],
  },
  {
    id: 'b2-listen-2', level: 'B2', kind: 'listening', title: 'Museum Audio Guide',
    speakers: { Guide: V.womanGB2 },
    lines: [say('Guide', 'Welcome to Room Four. In front of you is a full-size model of the famous Elephant Clock, based on drawings by the engineer al-Jazari, who described it in a book completed in 1206. The original clock used water to measure time: a bowl slowly sank in a tank of water, and every half hour this movement set off a series of moving figures and sounds. Look closely and you will see that the clock combines ideas from many cultures: the elephant represents India, the dragons represent China, and the phoenix at the top comes from ancient Egypt. Please do not touch the model. If you would like to see it working, a short demonstration takes place every hour, on the hour. When you are ready, please continue to Room Five, where you can try building a simple water clock yourself.')],
    questions: [
      { prompt: 'What did the original clock use to measure time?', options: ['Water', 'Sand', 'Electricity', 'Wind'], explanation: '“The original clock used water to measure time”: su tankında yavaşça batan bir kâse zamanı ölçüyordu.' },
      { prompt: 'According to the guide, what does the elephant represent?', options: ['India', 'China', 'Egypt', 'Greece'], explanation: 'Fil Hindistan’ı, ejderhalar Çin’i, en üstteki anka kuşu Antik Mısır’ı temsil ediyor.' },
      { prompt: 'How often is there a demonstration of the model?', options: ['Every hour', 'Every half hour', 'Once a day', 'Only at weekends'], explanation: '“every hour, on the hour”: her saat başı. Yarım saat, orijinal saatin figürlerinin hareket ettiği aralıktır.' },
    ],
  },
  {
    id: 'b2-listen-3', level: 'B2', kind: 'listening', title: 'Radio Phone-in: Screen Time',
    speakers: { Host: V.womanUS2, Murat: V.manUS2 },
    lines: [
      say('Host', 'Our next caller is Murat from Bursa. Murat, you’re on the air.'),
      say('Murat', 'Hi. I’m calling because my son spends hours on his phone, and every time I mention it, we end up arguing.'),
      say('Host', 'That’s a very common situation. Have you tried agreeing on rules together, rather than setting them yourself?'),
      say('Murat', 'Not really. I usually just tell him to put it away.'),
      say('Host', 'Many experts say that teenagers are more likely to follow rules they helped to make. You could sit down together and decide, for example, that phones stay out of bedrooms at night. And it helps if parents follow the same rules.'),
      say('Murat', 'Hmm, that’s fair. I’m probably on my phone too much myself.'),
      say('Host', 'Most of us are! Why not try it for two weeks and see what happens?'),
      say('Murat', 'I will. Thanks a lot.'),
    ],
    questions: [
      { prompt: 'What is Murat’s problem?', options: ['He argues with his son about phone use.', 'His son’s grades are falling.', 'His son can’t sleep.', 'His phone is broken.'], explanation: 'Oğlu saatlerce telefonda kalıyor ve bunu her konuştuklarında tartışıyorlar.' },
      { prompt: 'What does the host suggest?', options: ['Making the rules together with his son', 'Taking the phone away for good', 'Buying his son a simpler phone', 'Calling back in two weeks'], explanation: 'Sunucu kuralları birlikte koymayı öneriyor; gençler kendi katıldıkları kurallara daha çok uyuyor. İki hafta, deneme süresidir.' },
      { prompt: 'What does Murat admit?', options: ['He also uses his phone too much.', 'He never uses his phone.', 'His son is always right.', 'Rules are useless.'], explanation: '“I’m probably on my phone too much myself”: kendisinin de telefonu fazla kullandığını kabul ediyor.' },
    ],
  },
  // ---------------- C1 ----------------
  {
    id: 'c1-read-1', level: 'C1', kind: 'reading', title: 'The Myth of Learning Styles',
    lines: [
      p('For decades, many students have been told that they are “visual”, “auditory” or “kinaesthetic” learners, and that they will learn best if lessons match their preferred style. The idea is intuitively appealing: we all feel that some kinds of information suit us better than others. Yet when researchers have put the theory to the test, the results have been strikingly disappointing.'),
      p('In a typical experiment, students are first classified according to their supposed style and then taught the same material in different ways. If the theory were correct, “visual” learners should perform better after a visual lesson, and “auditory” learners after an auditory one. Study after study has failed to find this pattern. What researchers do find is that certain methods work well for almost everyone: testing yourself instead of rereading, spreading practice over several days, and combining words with pictures.'),
      p('Why, then, does the myth persist? Part of the answer lies in the fact that preferences are real, even if styles are not. People genuinely enjoy some activities more than others, and enjoyment can increase motivation. The danger arises when a label becomes a limitation: when a student decides, for instance, that they “can’t learn from reading” and stops trying.'),
    ],
    questions: [
      { prompt: 'What is the main idea of the text?', options: ['Research does not support matching lessons to learning styles.', 'Visual learners do better than other students.', 'Teachers should test every student’s style.', 'Reading is the best way to learn.'], explanation: 'Metin, öğrenme stillerine göre ders verme fikrinin araştırmalarla desteklenmediğini anlatıyor.' },
      { prompt: 'What result would have supported the theory?', options: ['Students learning better when lessons match their style', 'All students preferring pictures', 'Students rereading their notes more', 'Students enjoying every lesson'], explanation: 'Teori doğru olsaydı “görsel” öğrenciler görsel derste, “işitsel” öğrenciler işitsel derste daha başarılı olurdu; bu örüntü bulunamadı.' },
      { prompt: 'Which method is described as effective for almost everyone?', options: ['Testing yourself instead of rereading', 'Learning only with pictures', 'Rereading notes many times', 'Studying in one long session'], explanation: 'Kendini test etmek, çalışmayı günlere yaymak ve kelimeyle resmi birleştirmek hemen herkese yarıyor. Tek uzun oturum, “yaymanın” tersidir.' },
      { prompt: 'What danger does the writer mention in the last paragraph?', options: ['A label may make students give up on some ways of learning.', 'Students may enjoy lessons too much.', 'Teachers may stop using pictures.', 'Preferences may disappear.'], explanation: 'Etiket bir sınıra dönüşürse öğrenci “okuyarak öğrenemem” deyip denemeyi bırakabilir.' },
    ],
  },
  {
    id: 'c1-read-2', level: 'C1', kind: 'reading', title: 'Why We Procrastinate',
    lines: [
      p('Procrastination is often dismissed as simple laziness, but psychologists increasingly see it as a problem of emotion rather than time management. When a task makes us feel anxious, bored or insecure, putting it off offers immediate relief. The trouble is that this relief is short-lived, and it is usually followed by guilt and even greater anxiety as the deadline approaches.'),
      p('Seen in this light, many common pieces of advice miss the point. Buying a new planner or downloading yet another productivity app does little to address the underlying discomfort. What tends to help instead is reducing the emotional cost of starting. Breaking a task into steps so small that they feel almost trivial, such as “open the document” or “write one sentence”, can make the first move less daunting. Some people find it useful to set a timer for just ten minutes, on the understanding that they may stop when it rings; more often than not, they carry on.'),
      p('Self-compassion also plays a surprising role. One might expect that being hard on ourselves would push us to work, but studies suggest the opposite: students who forgave themselves for procrastinating before one exam were less likely to procrastinate before the next. Treating a delay as a mistake to learn from, rather than as proof of personal failure, appears to break the cycle.'),
    ],
    questions: [
      { prompt: 'How do psychologists increasingly view procrastination?', options: ['As a way of avoiding uncomfortable feelings', 'As a sign of laziness', 'As a problem of time management only', 'As a sign of intelligence'], explanation: 'Psikologlar ertelemeyi tembellikten çok bir duygu sorunu olarak görüyor: kaygı veren işi ertelemek anlık rahatlama sağlıyor.' },
      { prompt: 'Why does the writer criticise buying a new planner?', options: ['It does not deal with the emotional cause.', 'It is too expensive.', 'Apps are always better.', 'Planners are confusing.'], explanation: 'Yeni ajanda ya da uygulama, alttaki rahatsızlık duygusunu çözmüyor (“does little to address the underlying discomfort”).' },
      { prompt: 'In the second paragraph, “daunting” is closest in meaning to ___ .', options: ['intimidating', 'exciting', 'familiar', 'unimportant'], explanation: '“daunting” göz korkutucu, insanı yıldıran demektir; “intimidating” en yakın anlamlı kelime.' },
      { prompt: 'What did the study about self-forgiveness find?', options: ['Students who forgave themselves procrastinated less later.', 'Being strict with yourself reduced procrastination.', 'Self-forgiveness made students lazier.', 'It made no difference.'], explanation: 'Bir sınav öncesi ertelemesi için kendini affeden öğrenciler sonraki sınavda daha az erteledi.' },
    ],
  },
  {
    id: 'c1-read-3', level: 'C1', kind: 'reading', title: 'Lost in Translation?',
    lines: [
      p('Every so often, a list of “untranslatable words” goes viral online. Readers marvel at the Turkish “gümüşservi”, the glitter of moonlight on water, or the Japanese “komorebi”, sunlight filtering through leaves. Such lists are charming, but they often carry an unspoken assumption: that if a language has no single word for something, its speakers cannot fully experience it.'),
      p('Linguists are generally cautious about this claim. The strong version of the idea, that language determines what we are able to think, has little support. English speakers have no trouble understanding the glitter of moonlight on the sea; they simply need several words to describe it. Translation, in other words, is rarely impossible; it is merely inefficient.'),
      p('A weaker version of the hypothesis, however, has found intriguing evidence. Languages appear to nudge attention in particular directions. Speakers of languages that describe locations using compass points rather than “left” and “right”, for instance, tend to remain remarkably well oriented, even indoors. Similarly, studies suggest that having separate basic words for light and dark blue may make speakers slightly faster at telling those shades apart.'),
      p('The picture that emerges is subtler than the viral lists imply. Language does not build walls around our minds, but it may well furnish the rooms differently.'),
    ],
    questions: [
      { prompt: 'What assumption do viral lists of untranslatable words often carry?', options: ['Speakers cannot fully experience things their language has no word for.', 'Turkish is the hardest language to translate.', 'Every word can be translated exactly.', 'Japanese has more words than other languages.'], explanation: 'Bu listeler, bir dilde tek bir kelime yoksa o dili konuşanların o şeyi tam yaşayamayacağı varsayımını taşıyor.' },
      { prompt: 'According to the text, what is usually true of translating such words?', options: ['It is possible but needs more words.', 'It is completely impossible.', 'Only poets can do it.', 'It always changes the meaning.'], explanation: '“Translation is rarely impossible; it is merely inefficient”: çeviri imkânsız değil, sadece daha fazla kelime gerektiriyor.' },
      { prompt: 'Which finding supports the weaker version of the idea?', options: ['Speakers who use compass directions stay well oriented.', 'English speakers cannot imagine moonlight on water.', 'Japanese speakers notice sunlight more often.', 'Lists of words often go viral.'], explanation: 'Yönleri sağ-sol yerine pusula yönleriyle anlatan dilleri konuşanlar kapalı yerde bile yönlerini iyi biliyor; bu, dilin dikkati yönlendirdiğini gösteriyor.' },
      { prompt: 'What does the final sentence suggest?', options: ['Language influences thinking in subtle ways but does not limit it.', 'Language strictly limits what we can think.', 'Language has no effect on thinking.', 'We should learn as many languages as possible.'], explanation: 'Dil zihnimizin etrafına duvar örmüyor ama “odaları farklı döşeyebilir”: düşünceyi sınırlamadan, ince biçimde etkiliyor.' },
    ],
  },
  {
    id: 'c1-listen-1', level: 'C1', kind: 'listening', title: 'Radio Talk: Multitasking',
    speakers: { 'Professor Lane': V.olderManGB },
    lines: [say('Professor Lane', 'Researchers have long assumed that multitasking makes us more productive, yet a growing body of evidence suggests the opposite. When we switch between tasks, the brain needs time to readjust, and these small delays add up. Students who check their phones while studying, for instance, may take considerably longer to finish an assignment, and they tend to remember less of what they have read.')],
    questions: [
      { prompt: 'What has long been assumed about multitasking?', options: ['It makes us more productive.', 'It reduces stress.', 'It is impossible for most people.', 'It only works for adults.'], explanation: '“Researchers have long assumed that multitasking makes us more productive”: uzun süre daha verimli yaptığı sanıldı.' },
      { prompt: 'What happens when we switch between tasks?', options: ['The brain needs time to readjust.', 'We remember more.', 'We work faster.', 'Nothing changes.'], explanation: '“the brain needs time to readjust, and these small delays add up”: beyin yeniden uyum sağlamak için zaman ister, küçük gecikmeler birikir.' },
      { prompt: 'According to the speaker, what happens to students who check their phones while studying?', options: ['They take longer and remember less.', 'They finish faster.', 'They remember more of what they read.', 'They feel less tired.'], explanation: 'Konuşmacıya göre ödevi daha uzun sürede bitiriyorlar ve okuduklarını daha az hatırlıyorlar.' },
    ],
  },
  {
    id: 'c1-listen-2', level: 'C1', kind: 'listening', title: 'Lecture: Urban Heat Islands',
    speakers: { Lecturer: V.womanUS3 },
    lines: [say('Lecturer', 'Good afternoon. Today I’d like to look at a phenomenon known as the urban heat island. Put simply, cities tend to be noticeably warmer than the surrounding countryside, particularly at night. There are several reasons for this. Dark surfaces such as asphalt and rooftops absorb heat during the day and release it slowly after sunset. Tall buildings trap warm air and block the wind, while air conditioners and traffic add heat of their own. And, crucially, cities have far less vegetation; trees cool the air both by providing shade and by releasing water vapour. The consequences are more than a matter of comfort. During heatwaves, higher night-time temperatures prevent the body from recovering, which is particularly dangerous for elderly people. So what can be done? Cities around the world are experimenting with reflective roofs, planting street trees and creating small parks. None of these is a complete solution on its own, but together they can make a real difference.')],
    questions: [
      { prompt: 'When is the temperature difference between cities and the countryside especially noticeable?', options: ['At night', 'In the early morning', 'In winter', 'At midday'], explanation: '“particularly at night”: fark özellikle geceleri belirgin, çünkü koyu yüzeyler ısıyı gün batımından sonra yavaşça bırakıyor.' },
      { prompt: 'Which of these is NOT mentioned as a cause?', options: ['Smoke from factories', 'Dark surfaces such as asphalt', 'Tall buildings that block the wind', 'Fewer trees'], explanation: 'Koyu yüzeyler, yüksek binalar, klimalar, trafik ve az bitki örtüsü sayılıyor; fabrika dumanından söz edilmiyor.' },
      { prompt: 'Why are high night-time temperatures dangerous?', options: ['The body cannot recover from the heat.', 'People cannot sleep in parks.', 'Traffic increases at night.', 'Air conditioners stop working.'], explanation: '“higher night-time temperatures prevent the body from recovering”: vücut toparlanamıyor, bu da özellikle yaşlılar için tehlikeli.' },
    ],
  },
  {
    id: 'c1-listen-3', level: 'C1', kind: 'listening', title: 'Debate: AI Tutors in Schools',
    speakers: { 'Dr Kaya': V.womanUS4, 'Mr Hale': V.manGB },
    lines: [
      say('Dr Kaya', 'Supporters argue that AI tutors could offer every student personalised help at any time of day, something no teacher with thirty pupils can realistically provide.'),
      say('Mr Hale', 'That may be true in theory, but I’m concerned about what students lose. Learning isn’t only about getting the right answer; it’s about struggling with a problem, making mistakes and discussing them with others.'),
      say('Dr Kaya', 'I don’t think anyone is suggesting that AI should replace those experiences. The question is whether it can support them, for instance by giving hints rather than answers.'),
      say('Mr Hale', 'Perhaps, but we also have to consider privacy. These systems collect a great deal of data about children, and it isn’t always clear who has access to it.'),
      say('Dr Kaya', 'That’s a fair point, and it’s precisely why schools need clear rules before introducing such tools, not after.'),
      say('Mr Hale', 'On that, at least, we agree.'),
    ],
    questions: [
      { prompt: 'What advantage of AI tutors does Dr Kaya mention first?', options: ['Personalised help at any time of day', 'They are cheaper than books.', 'They can replace teachers.', 'They never make mistakes.'], explanation: 'Dr Kaya, yapay zekâ öğretmenlerin her öğrenciye günün her saatinde kişisel yardım sunabileceğini söylüyor.' },
      { prompt: 'What is Mr Hale’s first concern?', options: ['Students may miss the value of struggling and discussing.', 'AI tutors are too expensive.', 'Students will not use them.', 'Teachers will lose their jobs.'], explanation: 'Öğrenmenin sadece doğru cevap olmadığını; zorlanmanın, hata yapmanın ve tartışmanın da önemli olduğunu söylüyor.' },
      { prompt: 'What do the two speakers finally agree on?', options: ['Schools need clear rules before using such tools.', 'AI should replace teachers.', 'AI tutors should be banned.', 'Privacy is not a problem.'], explanation: 'Dr Kaya okulların bu araçları kullanmadan önce net kurallar koyması gerektiğini söylüyor, Mr Hale de “On that, at least, we agree” diyor.' },
    ],
  },
];

const BY_ID = new Map(ENGLISH_PASSAGES.map((passage) => [passage.id, passage]));

export function passageById(id: string) {
  return BY_ID.get(id) ?? null;
}

/** "b1-listen-2" from a question id like "10-english-b1-listen-2-3" (the passage is found from the saved id). */
export function passageIdOfQuestion(questionId: string) {
  const match = /^\d+-english-((?:a|b|c)\d-(?:read|listen)-\d+)-\d+$/.exec(questionId);
  return match ? match[1] : null;
}

/** The reading or listening text a question belongs to (nothing for other questions). */
export function passageOfQuestion(question: { id: string; subject: string }) {
  if (question.subject !== 'English') return null;
  const id = passageIdOfQuestion(question.id);
  return id ? passageById(id) : null;
}

/** Address of a listening recording inside the site (works with any base path). */
export function audioPath(base: string, passageId: string) {
  return `${base.endsWith('/') ? base : `${base}/`}audio/en/${passageId}.mp3`;
}
