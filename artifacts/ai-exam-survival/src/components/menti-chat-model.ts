// Stage 18: chat with Menti. Rule-based, no live AI.
//
// READ ONLY. Menti may look at the student's saved data (teacher approved) to give personal advice,
// but nothing here writes to browser storage, and the conversation itself is never saved.
// Every function is pure (data in, reply out) so it can be tested on its own.
import type { MentiPose } from './menti';
import { buildExamReadiness, buildPlannerWeek, buildTopicResults, readAllSources, SOURCE_KEYS, type AllSources, type SourceName, type TopicResult } from '../pages/progress-tracker-model';
import { getCardStatus } from '../pages/flashcards-model';

export type Lang = 'tr' | 'en';

export type Intent =
  | 'greeting'
  | 'today'
  | 'exams'
  | 'weak'
  | 'cards'
  | 'howto'
  | 'focus'
  | 'quiz'
  | 'planner'
  | 'mood'
  | 'anxiety'
  | 'help'
  | 'who'
  | 'thanks'
  | 'safety-harm'
  | 'safety-bully'
  | 'unknown';

/** The quick-reply buttons, in the order they are shown. */
export const CHIP_INTENTS: Intent[] = ['today', 'exams', 'weak', 'cards', 'howto', 'mood', 'anxiety', 'help'];

/** A button to another tool. `section` is an element id on that page to scroll to (for example the focus timer). */
export type ChatLink = { href: string; label: string; section?: string };
export type MentiReply = { intent: Intent; lines: string[]; links: ChatLink[]; chips: Intent[]; pose: MentiPose };

// ---------- understanding what the student wrote ----------

/** Lower case, Turkish letters folded to plain ones, punctuation removed, single spaces. */
export function normalize(text: string) {
  return text
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[âîû]/g, (c) => ({ â: 'a', î: 'i', û: 'u' })[c] ?? c)
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Keyword stems (already normalized). The first matching group wins, so safety comes first.
const RULES: [Intent, string[]][] = [
  ['safety-harm', ['intihar', 'kendimi oldur', 'olmek istiyorum', 'yasamak istemiyorum', 'kendime zarar', 'canima kiy', 'kill myself', 'suicide', 'hurt myself', 'self harm', 'want to die', 'end my life']],
  ['safety-bully', ['zorbalik', 'zorba', 'dovuyor', 'dovuyorlar', 'taciz', 'tehdit ediyor', 'alay ediyor', 'dislaniyorum', 'dislaniyor', 'bully', 'bullied', 'bullying', 'harass', 'threaten']],
  ['anxiety', ['kaygi', 'endise', 'stres', 'korkuyorum', 'korku', 'panik', 'heyecan', 'gerginim', 'gergin', 'anxious', 'anxiety', 'stress', 'nervous', 'scared', 'panic', 'worried']],
  ['mood', ['moralim', 'uzgun', 'mutsuz', 'yoruldum', 'yorgun', 'sikildim', 'motivasyon', 'canim istemiyor', 'istemiyorum', 'tembel', 'basaramiyorum', 'yapamiyorum', 'kotu hissed', 'kendimi kotu', 'sad', 'tired', 'bored', 'motivat', 'lazy', 'cant do', 'give up']],
  ['who', ['kimsin', 'nesin', 'yapay zeka', 'robot musun', 'insan misin', 'who are you', 'what are you', 'are you ai', 'are you a robot', 'are you human']],
  ['thanks', ['tesekkur', 'sagol', 'sag ol', 'eyvallah', 'thank', 'thanks']],
  ['exams', ['sinav', 'yazili', 'exam', 'test date', 'takvim', 'calendar']],
  ['weak', ['zayif', 'zorlan', 'eksik', 'kotu', 'yanlis', 'hata', 'weak', 'struggl', 'mistake', 'bad at', 'wrong']],
  ['cards', ['kart', 'deste', 'kelime', 'tekrar', 'flashcard', 'card', 'deck', 'vocabulary', 'review']],
  ['focus', ['odak', 'pomodoro', 'sayac', 'konsantr', 'dikkat', 'dagil', 'focus', 'timer', 'concentrat', 'distract']],
  ['quiz', ['test coz', 'soru coz', 'quiz', 'deneme', 'practice question']],
  ['planner', ['planlayici', 'program yap', 'haftalik', 'planner', 'schedule', 'timetable']],
  ['howto', ['nasil calis', 'verimli', 'teknik', 'yontem', 'tavsiye', 'oneri', 'ipucu', 'how to study', 'how should i study', 'tips', 'advice', 'study better']],
  ['today', ['bugun', 'ne calis', 'nereden basla', 'simdi ne', 'plan', 'today', 'what should i', 'where do i start', 'next']],
  ['help', ['nasil kullan', 'yardim', 'ne yapabilir', 'ozellik', 'arac', 'help', 'how do i use', 'what can you do', 'features', 'tools']],
  ['greeting', ['merhaba', 'selam', 'gunaydin', 'iyi aksam', 'naber', 'nasilsin', 'hello', 'hi', 'hey', 'good morning', 'good evening', 'how are you']],
];

/** Which topic the student is asking about. Safety words always win. */
export function intentOf(text: string): Intent {
  const words = ` ${normalize(text)} `;
  if (words.trim() === '') return 'unknown';
  for (const [intent, keys] of RULES) {
    if (keys.some((key) => (key.length <= 3 ? words.includes(` ${key} `) : words.includes(key)))) return intent;
  }
  return 'unknown';
}

// ---------- reading the student's saved data (read only) ----------

/** Reads the other tools' saved text. Never writes. Unreadable storage counts as empty. */
export function readSavedText(storage: Pick<Storage, 'getItem'> | null): Record<SourceName, string | null> {
  const out = {} as Record<SourceName, string | null>;
  for (const [name, key] of Object.entries(SOURCE_KEYS) as [SourceName, string][]) {
    try {
      out[name] = storage ? storage.getItem(key) : null;
    } catch {
      out[name] = null;
    }
  }
  return out;
}

export type StudentFacts = {
  hasAnyData: boolean;
  today: { total: number; done: number; next: { subject: string; topic: string; startTime: string } | null } | null;
  week: { planned: number; done: number } | null;
  exams: { subject: string; title: string; daysLeft: number; prepDone: number | null; prepTotal: number | null }[];
  weak: TopicResult[];
  strong: TopicResult[];
  notEnoughQuizData: boolean;
  cards: { again: number; fresh: number; mastered: number; total: number; againDeck: string | null } | null;
  lastQuiz: { subject: string; percentage: number } | null;
};

export function buildFacts(sources: AllSources, today: string): StudentFacts {
  const planner = sources.planner.data;
  const tasksToday = (planner?.tasks ?? []).filter((t) => t.kind === 'study' && t.date === today).sort((a, b) => a.startTime.localeCompare(b.startTime));
  const next = tasksToday.find((t) => !t.completed);
  const week = buildPlannerWeek(planner, today);

  const exams = buildExamReadiness(sources, today).map((f) => ({
    subject: f.exam.subject,
    title: f.exam.title,
    daysLeft: f.daysLeft,
    prepDone: f.prep?.done ?? null,
    prepTotal: f.prep?.total ?? null,
  }));

  const topics = buildTopicResults(sources);
  const weak = topics.filter((t) => t.classification === 'needs-work').sort((a, b) => a.rate - b.rate || b.total - a.total);
  const strong = topics.filter((t) => t.classification === 'strong').sort((a, b) => b.rate - a.rate || b.total - a.total);
  const quizAnswers = topics.filter((t) => t.source === 'quiz').reduce((n, t) => n + t.total, 0);

  const flash = sources.flashcards.data;
  let cards: StudentFacts['cards'] = null;
  if (flash && flash.cards.length > 0) {
    const status = (id: string) => getCardStatus(flash.progress[id]);
    const againCards = flash.cards.filter((c) => status(c.id) === 'again');
    const againDeckId = againCards[0]?.deckId;
    cards = {
      again: againCards.length,
      fresh: flash.cards.filter((c) => status(c.id) === 'new').length,
      mastered: flash.cards.filter((c) => status(c.id) === 'mastered').length,
      total: flash.cards.length,
      againDeck: flash.decks.find((d) => d.id === againDeckId)?.name ?? null,
    };
  }

  const attempts = sources.quiz.data ?? [];
  const last = [...attempts].sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt))[0];

  const hasPlannerWork = (planner?.tasks ?? []).some((t) => t.kind === 'study');
  const hasCardWork = Object.keys(flash?.progress ?? {}).length > 0;
  return {
    hasAnyData: hasPlannerWork || exams.length > 0 || attempts.length > 0 || hasCardWork,
    today: hasPlannerWork
      ? { total: tasksToday.length, done: tasksToday.filter((t) => t.completed).length, next: next ? { subject: next.subject, topic: next.topic, startTime: next.startTime } : null }
      : null,
    week: week ? { planned: week.planned, done: week.done } : null,
    exams,
    weak: weak.slice(0, 3),
    strong: strong.slice(0, 2),
    notEnoughQuizData: quizAnswers > 0 && weak.length === 0 && strong.length === 0,
    cards,
    lastQuiz: last ? { subject: last.subject, percentage: last.percentage } : null,
  };
}

/** Facts straight from the browser's saved data (read only). */
export function factsFromStorage(storage: Pick<Storage, 'getItem'> | null, today: string) {
  return buildFacts(readAllSources(readSavedText(storage)), today);
}

// ---------- texts (Turkish and English) ----------

const EN = {
  chip_today: 'What should I study today?',
  chip_exams: 'My exams',
  chip_weak: 'Topics I struggle with',
  chip_cards: 'My flashcards',
  chip_howto: 'How should I study?',
  chip_mood: 'I feel down',
  chip_anxiety: 'I’m anxious about exams',
  chip_help: 'How do I use the app?',
  link_planner: 'Open Study Planner',
  link_focus: 'Start the focus timer',
  link_quiz: 'Open Quiz Center',
  link_cards: 'Review my flashcards',
  link_calendar: 'Open Exam Calendar',
  link_progress: 'See my progress',
  link_coach: 'Ask the Study Coach',
  link_about: 'About and privacy',
  hello: 'Hi! I’m Menti. 👋',
  helloEmpty: 'You have no saved work yet. Shall we start together? A small plan or a short quiz is a great first step.',
  helloAsk: 'What would you like to talk about?',
  todayCount: 'Today you have {total} study session(s) in your plan; {done} done.',
  todayNext: 'Next up: {subject}{topic} at {time}. Shall we start with a focus block?',
  todayAllDone: 'You have finished every session planned for today. Great work! 🎉',
  todayNone: 'There is no session planned for today.',
  todayNoPlan: 'You don’t have a study plan yet. In the Study Planner you can make one for the week in a few minutes.',
  todayWeak: 'A good choice today: a short quiz on “{topic}” ({subject}), where your answers were {rate}% correct.',
  todayCountNone: 'Today you have {total} study session(s) in your plan; you haven’t started yet.',
  todayCards: '{count} flashcard(s) are waiting in “Review again”. Five minutes is enough to start.',
  todayExam: 'Remember: your {subject} exam is {when}.',
  examsNone: 'You have no upcoming exams in your calendar. Add them so I can remind you and you can plan ahead.',
  examLine: '{subject}{title}: {when}',
  examPrep: ' · preparation steps {done}/{total}',
  examSoon: 'Your nearest exam is close. Revise the main ideas, solve a few questions and get a good night’s sleep.',
  examPlenty: 'There is time. Spread your revision over the days, a little every day.',
  weakIntro: 'From your saved results, these need more practice:',
  weakQuiz: '“{topic}” ({subject}): {good}/{total} correct ({rate}%)',
  weakCards: 'Deck “{deck}”: {good}/{total} cards known ({rate}%)',
  weakAdvice: 'Take a 5-question quiz on the first topic and read every explanation. Then make flashcards for what you missed.',
  weakNotEnough: 'I need a little more data: a topic is judged after at least 4 answers. Solve a few more quizzes and ask me again.',
  weakNoData: 'You haven’t solved any quizzes yet. Solve a short quiz and I’ll tell you where to focus.',
  weakNone: 'Good news: no topic is below 60% right now.',
  strongLine: 'Your strongest: “{topic}” ({rate}%). Well done!',
  cardsNone: 'You have no flashcards yet. Starter decks are ready in Smart Flashcards, or you can make your own.',
  cardsSummary: 'You have {total} card(s): {again} to review again, {fresh} new, {mastered} mastered.',
  cardsAgain: 'Start with “Review again” cards{deck} in Review mode. They move up when you know them.',
  cardsFresh: 'Learn the new cards in Learn mode, a few at a time.',
  cardsAllGood: 'Everything is going well. A quick Practice round keeps them fresh.',
  howto1: 'Test yourself instead of only re-reading: quizzes and flashcards make you remember better.',
  howto2: 'Study in short blocks (25 minutes) with short breaks. The focus timer helps with this.',
  howto3: 'Repeat a little every few days instead of everything the night before.',
  howto4: 'Sleep, water and a phone-free desk help more than you think.',
  focus1: 'The focus timer on the Study Planner page works like this: study 15, 25 or 45 minutes, then a 5-minute break starts by itself. After 4 blocks you get a 15-minute break.',
  focus2: 'Put your phone away during a block. You can add soft rain or wave sounds if they help you.',
  quiz1: 'In Quiz Center choose your grade, subject and topic, then 5, 10 or 20 questions. After finishing you see every explanation.',
  quiz2: 'Grade 9 and 10 questions follow the MEB curriculum; each one shows the learning outcome it measures.',
  planner1: 'In the Study Planner add your subjects, exam dates and daily minutes; it builds a week plan. Tick a session when you finish it.',
  mood1: 'It’s okay to feel like this sometimes. You don’t have to do everything today.',
  mood2: 'Try a tiny step: one 15-minute focus block, or five flashcards. Starting is the hardest part.',
  moodWeek: 'This week you already finished {done} of {planned} planned sessions. That counts!',
  moodTalk: 'If you feel down for many days, talk to someone you trust: your family, a teacher or your school counsellor (rehber öğretmen).',
  anx1: 'Exam nerves are normal; a little of it even helps you focus.',
  anx2: 'Try this: breathe in for 4 seconds, hold 4, breathe out for 6. Repeat it 4 times.',
  anx3: 'Turn the big worry into small steps: list the topics, solve a short quiz, check what you missed.',
  anxExam: 'Your {subject} exam is {when}. Make a small plan for the days left, and sleep well the night before.',
  anxTalk: 'If the worry doesn’t go away, your school counsellor (rehber öğretmen) can really help.',
  help1: 'Here is what you can do in AI Exam Survival:',
  help2: 'Study Planner: a weekly plan and a focus timer · Quiz Center: practice quizzes · Smart Flashcards: decks to memorise · Exam Calendar: your exams and preparation steps · Study Coach: tips for a problem · Progress Tracker: your real progress.',
  who1: 'I’m Menti, the mascot of AI Exam Survival. I’m not a live AI and not a person: I answer with rules prepared by the AI Club.',
  who2: 'I only look at your saved work on this device to give advice; I never change it, and our chat is not saved anywhere.',
  thanks1: 'You’re welcome! I’m here whenever you need me. 💙',
  harm1: 'I’m really sorry you feel this way. You are not alone, and you deserve help right now.',
  harm2: 'Please talk today to an adult you trust: your family, a teacher or your school counsellor (rehber öğretmen).',
  harm3: 'If you are in danger or might hurt yourself, call 112 now.',
  bully1: 'I’m sorry this is happening to you. It is not your fault, and nobody has the right to hurt or scare you.',
  bully2: 'Please tell a teacher, your school counsellor (rehber öğretmen) or your family as soon as you can. Keep messages or screenshots as proof.',
  bully3: 'If you are in danger right now, call 112.',
  unknown1: 'I didn’t quite understand that. I’m a mascot that works with rules, so short questions work best.',
  unknown2: 'You can pick one of these:',
  today_word: 'today',
  tomorrow_word: 'tomorrow',
  in_days: 'in {days} days',
};

const TR: Record<keyof typeof EN, string> = {
  chip_today: 'Bugün ne çalışayım?',
  chip_exams: 'Sınavlarım',
  chip_weak: 'Zorlandığım konular',
  chip_cards: 'Kartlarım',
  chip_howto: 'Nasıl çalışmalıyım?',
  chip_mood: 'Moralim bozuk',
  chip_anxiety: 'Sınav kaygım var',
  chip_help: 'Uygulamayı nasıl kullanırım?',
  link_planner: 'Çalışma Planlayıcı’yı aç',
  link_focus: 'Odak sayacını başlat',
  link_quiz: 'Test Merkezi’ne git',
  link_cards: 'Kartlarımı tekrar et',
  link_calendar: 'Sınav Takvimi’ni aç',
  link_progress: 'İlerlememi gör',
  link_coach: 'Çalışma Koçu’na sor',
  link_about: 'Hakkında ve gizlilik',
  hello: 'Merhaba! Ben Menti. 👋',
  helloEmpty: 'Henüz kayıtlı bir çalışman yok. Birlikte başlayalım mı? Küçük bir plan ya da kısa bir test harika bir ilk adım olur.',
  helloAsk: 'Ne hakkında konuşmak istersin?',
  todayCount: 'Bugün planında {total} çalışma oturumu var; {done} tanesini bitirdin.',
  todayNext: 'Sıradaki: {time} – {subject}{topic}. Bir odak bloğuyla başlayalım mı?',
  todayAllDone: 'Bugün için planladığın bütün oturumları bitirdin. Harika iş! 🎉',
  todayNone: 'Bugün için planlanmış bir oturum yok.',
  todayNoPlan: 'Henüz bir çalışma planın yok. Çalışma Planlayıcı’da birkaç dakikada haftalık plan oluşturabilirsin.',
  todayWeak: 'Bugün için iyi bir seçim: “{topic}” ({subject}) konusunda kısa bir test (doğru cevap oranın: %{rate}).',
  todayCountNone: 'Bugün planında {total} çalışma oturumu var; henüz başlamadın.',
  todayCards: '“Tekrar et” bölümünde bekleyen {count} kartın var. Başlamak için beş dakika yeter.',
  todayExam: 'Unutma: {subject} sınavın {when}.',
  examsNone: 'Takviminde yaklaşan bir sınav yok. Sınavlarını eklersen sana hatırlatırım ve önceden plan yapabilirsin.',
  examLine: '{subject}{title}: {when}',
  examPrep: ' · hazırlık adımları {done}/{total}',
  examSoon: 'En yakın sınavın çok yakın. Ana fikirleri tekrar et, birkaç soru çöz ve iyi uyu.',
  examPlenty: 'Vaktin var. Tekrarını günlere yay; her gün biraz çalışmak en iyisi.',
  weakIntro: 'Kayıtlı sonuçlarına göre şu konular biraz daha çalışma istiyor:',
  weakQuiz: '“{topic}” ({subject}): {total} cevabın {good} tanesi doğru (%{rate})',
  weakCards: '“{deck}” destesi: {total} kartın {good} tanesini biliyorsun (%{rate})',
  weakAdvice: 'İlk konuda 5 soruluk bir test çöz ve her açıklamayı oku. Sonra yanlış yaptıkların için kart hazırla.',
  weakNotEnough: 'Biraz daha veriye ihtiyacım var: bir konuyu değerlendirmek için en az 4 cevap gerekiyor. Birkaç test daha çöz, sonra bana yeniden sor.',
  weakNoData: 'Henüz test çözmemişsin. Kısa bir test çöz, sana nereye odaklanman gerektiğini söyleyeyim.',
  weakNone: 'İyi haber: şu an %60’ın altında kalan bir konun yok.',
  strongLine: 'En güçlü olduğun konu: “{topic}” (%{rate}). Aferin!',
  cardsNone: 'Henüz kartın yok. Akıllı Kartlar’da hazır desteler var; istersen kendi desteni de oluşturabilirsin.',
  cardsSummary: '{total} kartın var: {again} tanesi tekrar edilecek, {fresh} tanesi yeni, {mastered} tanesini tamamen öğrendin.',
  cardsAgain: 'Önce “Tekrar et” kartlarıyla{deck} Tekrar modunda başla. Bildikçe yukarı çıkarlar.',
  cardsFresh: 'Yeni kartları Öğren modunda, birkaç tane birkaç tane öğren.',
  cardsAllGood: 'Her şey yolunda. Kısa bir Alıştırma turu kartları taze tutar.',
  howto1: 'Sadece tekrar okumak yerine kendini test et: test ve kartlar daha iyi hatırlamanı sağlar.',
  howto2: 'Kısa bloklarla (25 dakika) çalış, arada kısa molalar ver. Odak sayacı bu konuda yardımcı olur.',
  howto3: 'Her şeyi sınavdan önceki geceye bırakma; birkaç günde bir az az tekrar et.',
  howto4: 'Uyku, su ve telefonsuz bir masa sandığından çok daha fazla işe yarar.',
  focus1: 'Çalışma Planlayıcı sayfasındaki odak sayacı şöyle çalışır: 15, 25 ya da 45 dakika çalışırsın, sonra 5 dakikalık mola kendiliğinden başlar. 4 bloktan sonra 15 dakikalık uzun mola gelir.',
  focus2: 'Blok sırasında telefonunu uzağa koy. İşine yararsa yumuşak yağmur ya da dalga sesi açabilirsin.',
  quiz1: 'Test Merkezi’nde sınıfını, dersini ve konunu seç; sonra 5, 10 ya da 20 soru belirle. Bitirince her sorunun açıklamasını görürsün.',
  quiz2: '9. ve 10. sınıf soruları MEB programına göre hazırlandı; her sorunun altında ölçtüğü öğrenme çıktısı yazar.',
  planner1: 'Çalışma Planlayıcı’da derslerini, sınav tarihlerini ve günlük çalışma süreni gir; sana haftalık plan hazırlar. Bitirdiğin oturumu işaretle.',
  mood1: 'Bazen böyle hissetmek çok normal. Her şeyi bugün yapmak zorunda değilsin.',
  mood2: 'Küçük bir adım dene: 15 dakikalık tek bir odak bloğu ya da beş kart. En zor kısım başlamak.',
  moodWeek: 'Bu hafta planladığın {planned} oturumun {done} tanesini zaten bitirdin. Bu da sayılır!',
  moodTalk: 'Uzun süre böyle hissedersen güvendiğin biriyle konuş: ailen, bir öğretmenin ya da rehber öğretmenin.',
  anx1: 'Sınav heyecanı normaldir; biraz heyecan odaklanmana bile yardım eder.',
  anx2: 'Şunu dene: 4 saniye nefes al, 4 saniye tut, 6 saniyede ver. Bunu 4 kez tekrarla.',
  anx3: 'Büyük endişeyi küçük adımlara böl: konuları listele, kısa bir test çöz, eksiklerine bak.',
  anxExam: '{subject} sınavın {when}. Kalan günler için küçük bir plan yap ve sınavdan önceki gece iyi uyu.',
  anxTalk: 'Kaygın geçmezse rehber öğretmenin sana gerçekten yardımcı olabilir.',
  help1: 'AI Exam Survival’da şunları yapabilirsin:',
  help2: 'Çalışma Planlayıcı: haftalık plan ve odak sayacı · Test Merkezi: alıştırma testleri · Akıllı Kartlar: ezber desteleri · Sınav Takvimi: sınavların ve hazırlık adımların · Çalışma Koçu: bir sorun için öneriler · İlerleme Takibi: gerçek ilerlemen.',
  who1: 'Ben Menti, AI Exam Survival’ın maskotuyum. Canlı bir yapay zekâ ya da insan değilim; AI Kulübü’nün hazırladığı kurallarla cevap veririm.',
  who2: 'Öneri verebilmek için yalnızca bu cihazdaki kayıtlarına bakarım; hiçbir şeyi değiştirmem ve sohbetimiz hiçbir yere kaydedilmez.',
  thanks1: 'Rica ederim! İhtiyacın olduğunda buradayım. 💙',
  harm1: 'Böyle hissettiğin için gerçekten üzgünüm. Yalnız değilsin ve şu an yardımı hak ediyorsun.',
  harm2: 'Lütfen bugün güvendiğin bir yetişkinle konuş: ailen, bir öğretmenin ya da rehber öğretmenin.',
  harm3: 'Tehlikedeysen ya da kendine zarar verebileceğini düşünüyorsan hemen 112’yi ara.',
  bully1: 'Bunu yaşadığın için üzgünüm. Bu senin suçun değil; kimsenin sana zarar vermeye ya da seni korkutmaya hakkı yok.',
  bully2: 'Lütfen en kısa zamanda bir öğretmenine, rehber öğretmenine ya da ailene anlat. Mesajları veya ekran görüntülerini kanıt olarak sakla.',
  bully3: 'Şu an tehlikedeysen 112’yi ara.',
  unknown1: 'Bunu tam anlayamadım. Ben kurallarla çalışan bir maskotum, kısa sorular en iyisi.',
  unknown2: 'Şunlardan birini seçebilirsin:',
  today_word: 'bugün',
  tomorrow_word: 'yarın',
  in_days: '{days} gün sonra',
};

export const CHAT_TEXTS = { en: EN, tr: TR };
export type ChatTextKey = keyof typeof EN;

export function chipLabel(intent: Intent, lang: Lang) {
  const key = `chip_${intent}` as ChatTextKey;
  return CHAT_TEXTS[lang][key] ?? intent;
}

/** Names shown to the student (subject and topic translations come from the app's own helpers). */
export type Namer = { subject: (name: string) => string; topic: (name: string) => string };
const plainNamer: Namer = { subject: (s) => s, topic: (t) => t };

function fill(text: string, vars: Record<string, unknown>) {
  return text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

function whenText(days: number, lang: Lang) {
  const T = CHAT_TEXTS[lang];
  if (days <= 0) return T.today_word;
  if (days === 1) return T.tomorrow_word;
  return fill(T.in_days, { days });
}

const LINKS = {
  planner: (T: typeof EN): ChatLink => ({ href: '/study-planner', label: T.link_planner }),
  focus: (T: typeof EN): ChatLink => ({ href: '/study-planner', label: T.link_focus, section: 'focus-timer' }),
  quiz: (T: typeof EN): ChatLink => ({ href: '/quiz-center', label: T.link_quiz }),
  cards: (T: typeof EN): ChatLink => ({ href: '/smart-flashcards', label: T.link_cards }),
  calendar: (T: typeof EN): ChatLink => ({ href: '/exam-calendar', label: T.link_calendar }),
  progress: (T: typeof EN): ChatLink => ({ href: '/progress-tracker', label: T.link_progress }),
  coach: (T: typeof EN): ChatLink => ({ href: '/ai-study-coach', label: T.link_coach }),
  about: (T: typeof EN): ChatLink => ({ href: '/about', label: T.link_about }),
};

// ---------- replies ----------

/** Menti's first message when the chat opens: a personal summary from the saved data. */
export function greetingReply(facts: StudentFacts, lang: Lang, names: Namer = plainNamer): MentiReply {
  const T = CHAT_TEXTS[lang];
  const lines = [T.hello];
  const links: ChatLink[] = [];
  if (!facts.hasAnyData) {
    lines.push(T.helloEmpty);
    links.push(LINKS.planner(T), LINKS.quiz(T));
  } else {
    if (facts.today && facts.today.total > 0) lines.push(fill(facts.today.done > 0 ? T.todayCount : T.todayCountNone, facts.today));
    const exam = facts.exams[0];
    if (exam && exam.daysLeft <= 14) lines.push(fill(T.todayExam, { subject: names.subject(exam.subject), when: whenText(exam.daysLeft, lang) }));
    const weak = facts.weak.find((w) => w.source === 'quiz');
    if (weak) lines.push(fill(T.todayWeak, { topic: names.topic(weak.topic), subject: names.subject(weak.subject), rate: weak.rate }));
    if (facts.cards && facts.cards.again > 0) lines.push(fill(T.todayCards, { count: facts.cards.again }));
    lines.push(T.helloAsk);
  }
  return { intent: 'greeting', lines, links, chips: CHIP_INTENTS, pose: 'wave' };
}

/** Menti's answer to one message (a quick-reply button or typed text). */
export function replyTo(intent: Intent, facts: StudentFacts, lang: Lang, names: Namer = plainNamer): MentiReply {
  const T = CHAT_TEXTS[lang];
  const r = (lines: string[], links: ChatLink[], pose: MentiPose, chips: Intent[] = CHIP_INTENTS): MentiReply => ({ intent, lines, links, chips, pose });
  const nextExam = facts.exams[0];

  switch (intent) {
    case 'greeting':
      return greetingReply(facts, lang, names);

    case 'today': {
      const lines: string[] = [];
      const links: ChatLink[] = [];
      if (!facts.today) {
        lines.push(T.todayNoPlan);
        links.push(LINKS.planner(T));
      } else if (facts.today.total === 0) {
        lines.push(T.todayNone);
      } else {
        lines.push(fill(facts.today.done > 0 ? T.todayCount : T.todayCountNone, facts.today));
        if (facts.today.next) {
          const n = facts.today.next;
          lines.push(fill(T.todayNext, { subject: names.subject(n.subject), topic: n.topic ? ` (${n.topic})` : '', time: n.startTime }));
          links.push(LINKS.focus(T));
        } else lines.push(T.todayAllDone);
        links.push(LINKS.planner(T));
      }
      const weak = facts.weak.find((w) => w.source === 'quiz');
      if (weak) {
        lines.push(fill(T.todayWeak, { topic: names.topic(weak.topic), subject: names.subject(weak.subject), rate: weak.rate }));
        links.push(LINKS.quiz(T));
      }
      if (facts.cards && facts.cards.again > 0) {
        lines.push(fill(T.todayCards, { count: facts.cards.again }));
        links.push(LINKS.cards(T));
      }
      if (nextExam && nextExam.daysLeft <= 7) lines.push(fill(T.todayExam, { subject: names.subject(nextExam.subject), when: whenText(nextExam.daysLeft, lang) }));
      if (links.length === 0) links.push(LINKS.quiz(T), LINKS.cards(T));
      return r(lines, unique(links), 'point');
    }

    case 'exams': {
      if (facts.exams.length === 0) return r([T.examsNone], [LINKS.calendar(T)], 'point');
      const lines = facts.exams.slice(0, 3).map((e) =>
        fill(T.examLine, { subject: names.subject(e.subject), title: e.title ? ` – ${e.title}` : '', when: whenText(e.daysLeft, lang) }) +
        (e.prepTotal ? fill(T.examPrep, { done: e.prepDone ?? 0, total: e.prepTotal }) : ''),
      );
      lines.push(facts.exams[0].daysLeft <= 3 ? T.examSoon : T.examPlenty);
      return r(lines, [LINKS.calendar(T), LINKS.quiz(T)], facts.exams[0].daysLeft <= 3 ? 'focused' : 'think');
    }

    case 'weak': {
      if (facts.weak.length > 0) {
        const lines = [T.weakIntro];
        for (const w of facts.weak) {
          lines.push(
            w.source === 'quiz'
              ? fill(T.weakQuiz, { topic: names.topic(w.topic), subject: names.subject(w.subject), good: w.good, total: w.total, rate: w.rate })
              : fill(T.weakCards, { deck: names.topic(w.deckName ?? w.topic), good: w.good, total: w.total, rate: w.rate }),
          );
        }
        lines.push(T.weakAdvice);
        return r(lines, [LINKS.quiz(T), LINKS.cards(T), LINKS.progress(T)], 'encourage');
      }
      if (!facts.lastQuiz) return r([T.weakNoData], [LINKS.quiz(T)], 'point');
      if (facts.notEnoughQuizData) return r([T.weakNotEnough], [LINKS.quiz(T)], 'think');
      const lines = [T.weakNone];
      if (facts.strong[0]) lines.push(fill(T.strongLine, { topic: names.topic(facts.strong[0].topic), rate: facts.strong[0].rate }));
      return r(lines, [LINKS.quiz(T), LINKS.progress(T)], 'cheer');
    }

    case 'cards': {
      const c = facts.cards;
      if (!c) return r([T.cardsNone], [LINKS.cards(T)], 'point');
      const lines = [fill(T.cardsSummary, c)];
      if (c.again > 0) lines.push(fill(T.cardsAgain, { deck: c.againDeck ? ` (“${names.topic(c.againDeck)}”)` : '' }));
      else if (c.fresh > 0) lines.push(T.cardsFresh);
      else lines.push(T.cardsAllGood);
      return r(lines, [LINKS.cards(T)], c.again > 0 ? 'encourage' : 'cheer');
    }

    case 'howto':
      return r([T.howto1, T.howto2, T.howto3, T.howto4], [LINKS.focus(T), LINKS.cards(T), LINKS.coach(T)], 'think');

    case 'focus':
      return r([T.focus1, T.focus2], [LINKS.focus(T)], 'focused');

    case 'quiz': {
      const lines = [T.quiz1, T.quiz2];
      const weak = facts.weak.find((w) => w.source === 'quiz');
      if (weak) lines.push(fill(T.todayWeak, { topic: names.topic(weak.topic), subject: names.subject(weak.subject), rate: weak.rate }));
      return r(lines, [LINKS.quiz(T)], 'point');
    }

    case 'planner':
      return r([T.planner1], [LINKS.planner(T)], 'point');

    case 'mood': {
      const lines = [T.mood1, T.mood2];
      if (facts.week && facts.week.done > 0) lines.push(fill(T.moodWeek, facts.week));
      lines.push(T.moodTalk);
      return r(lines, [LINKS.focus(T), LINKS.cards(T)], 'comfort');
    }

    case 'anxiety': {
      const lines = [T.anx1, T.anx2, T.anx3];
      if (nextExam && nextExam.daysLeft <= 14) lines.push(fill(T.anxExam, { subject: names.subject(nextExam.subject), when: whenText(nextExam.daysLeft, lang) }));
      lines.push(T.anxTalk);
      return r(lines, [LINKS.planner(T), LINKS.coach(T)], 'calm');
    }

    case 'help':
      return r([T.help1, T.help2], [LINKS.planner(T), LINKS.quiz(T), LINKS.cards(T), LINKS.calendar(T)], 'wave');

    case 'who':
      return r([T.who1, T.who2], [LINKS.about(T)], 'wave');

    case 'thanks':
      return r([T.thanks1], [], 'cheer');

    case 'safety-harm':
      return r([T.harm1, T.harm2, T.harm3], [], 'comfort', []);

    case 'safety-bully':
      return r([T.bully1, T.bully2, T.bully3], [], 'comfort', []);

    default:
      return r([T.unknown1, T.unknown2], [], 'think');
  }
}

function unique(links: ChatLink[]) {
  const seen = new Set<string>();
  return links.filter((l) => (seen.has(l.href) ? false : (seen.add(l.href), true)));
}
