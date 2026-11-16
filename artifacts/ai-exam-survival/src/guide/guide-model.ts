// Stage 24: "Nasıl kullanılır?" guide – Menti shows the tools in 7 short steps. Pure parts, tested in stage24-model.
// Saved: only `ai-exam-survival:guide:v1` = {version: 1, seen: true}, written when the guide is closed (teacher approved),
// so that it opens by itself only once. It holds nothing about the student.
import type { MentiPose } from '@/components/menti';

export const GUIDE_KEY = 'ai-exam-survival:guide:v1';

/** The other saved-data keys: a student who already has any of them is not new, so the guide does not open by itself. */
const STUDENT_KEYS = [
  'ai-exam-survival:study-planner:v1',
  'ai-exam-survival:quiz-center:v1',
  'ai-exam-survival:flashcards:v1',
  'ai-exam-survival:exam-calendar:v1',
  'ai-exam-survival:exam-prep:v1',
  'ai-exam-survival:study-coach:v1',
  'ai-exam-survival:focus:v1',
  'ai-exam-survival:exam-mode:v1',
];

export type GuideStepId = 'welcome' | 'planner' | 'quiz' | 'cards' | 'calendar' | 'coach' | 'progress';

export interface GuideStep {
  id: GuideStepId;
  pose: MentiPose;
  /** Tool page this step shows ("Bu araca git"); the welcome step has none. */
  href?: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  { id: 'welcome', pose: 'wave' },
  { id: 'planner', pose: 'point', href: '/study-planner' },
  { id: 'quiz', pose: 'think', href: '/quiz-center' },
  { id: 'cards', pose: 'encourage', href: '/smart-flashcards' },
  { id: 'calendar', pose: 'focused', href: '/exam-calendar' },
  { id: 'coach', pose: 'calm', href: '/ai-study-coach' },
  { id: 'progress', pose: 'proud', href: '/progress-tracker' },
];

type Reader = Pick<Storage, 'getItem'>;

/** True when the saved guide value says it was seen (anything else, or an unreadable value, counts as not seen). */
export function guideSeen(storage: Reader) {
  try {
    const raw = storage.getItem(GUIDE_KEY);
    if (raw === null) return false;
    const value = JSON.parse(raw) as unknown;
    return typeof value === 'object' && value !== null && (value as { seen?: unknown }).seen === true;
  } catch {
    return true; // storage blocked or broken: never pester
  }
}

/** Opens by itself only on the home page, only for a new student (no saved data at all) who has not closed it before. */
export function shouldAutoOpen(storage: Reader, path: string) {
  if (path !== '/' && path !== '') return false;
  try {
    if (storage.getItem(GUIDE_KEY) !== null) return false;
    return STUDENT_KEYS.every((key) => storage.getItem(key) === null);
  } catch {
    return false;
  }
}

/** Remembers that the guide was closed. Never overwrites a value it cannot read. */
export function markGuideSeen(storage: Pick<Storage, 'getItem' | 'setItem'>) {
  try {
    const raw = storage.getItem(GUIDE_KEY);
    if (raw !== null) {
      try {
        JSON.parse(raw);
      } catch {
        return; // unreadable: leave it alone
      }
    }
    storage.setItem(GUIDE_KEY, JSON.stringify({ version: 1, seen: true }));
  } catch {
    /* storage blocked: the guide may open again, nothing breaks */
  }
}

type StepText = { title: string; lines: [string, string] };
type GuideTexts = {
  dialogLabel: string;
  stepOf: string;
  back: string;
  next: string;
  finish: string;
  skip: string;
  close: string;
  goTool: string;
  open: string;
  steps: Record<GuideStepId, StepText>;
};

export const GUIDE_TEXTS: Record<'tr' | 'en', GuideTexts> = {
  tr: {
    dialogLabel: 'Nasıl kullanılır?',
    stepOf: '{step} / {total}',
    back: 'Geri',
    next: 'İleri',
    finish: 'Bitir',
    skip: 'Atla',
    close: 'Kapat',
    goTool: 'Bu araca git',
    open: 'Nasıl kullanılır?',
    steps: {
      welcome: {
        title: 'Hoş geldin! Ben Menti.',
        lines: [
          'AI Exam Survival, sınavlara hazırlanman için ücretsiz çalışma araçları sunar. Hesap açman gerekmez; yaptıkların yalnızca bu cihazda saklanır.',
          'Seni 7 kısa adımda araçlarla tanıştırayım. İstediğin an “Atla” diyebilirsin.',
        ],
      },
      planner: {
        title: 'Çalışma Planlayıcı',
        lines: [
          'Haftanın derslerini ve çalışma saatlerini yaz, bitirdiklerini işaretle.',
          'Aynı sayfadaki odak sayacı, 15, 25 ya da 45 dakikalık çalışma ve kısa molalarla odaklanmana yardım eder.',
        ],
      },
      quiz: {
        title: 'Test Merkezi',
        lines: [
          'Sınıfını ve dersini seç, bir test başlat. Test bitince her sorunun açıklamasını görürsün.',
          'Aynı sayfadaki deneme sınavlarıyla TYT, AYT ve YDT’ye süreli olarak da hazırlanabilirsin.',
        ],
      },
      cards: {
        title: 'Akıllı Bilgi Kartları',
        lines: [
          '“Sınıfıma göre desteler” kutusundan dersinin destesini tek dokunuşla ekle ya da kendi kartlarını yaz.',
          'Önce Öğren modunda kartları tanı, sonra Alıştırma ve Tekrar modlarıyla çalış.',
        ],
      },
      calendar: {
        title: 'Sınav Takvimi',
        lines: [
          'Yazılı ve sınav tarihlerini ekle; takvim her sınava kaç gün kaldığını gösterir.',
          'Her sınav için hazırlık adımlarını işaretleyerek ilerle.',
        ],
      },
      coach: {
        title: 'Çalışma Koçu ve Menti',
        lines: [
          'Yapay Zekâ Çalışma Koçu’na dersini, konunu ve sınav tarihini söyle; sana kısa bir çalışma planı hazırlasın.',
          'Sağ alttaki düğmeye dokunarak benimle de konuşabilirsin. Canlı bir yapay zekâ değilim; önceden hazırlanmış kurallarla çalışırım.',
        ],
      },
      progress: {
        title: 'İlerleme Takibi',
        lines: [
          'İlerleme Takibi; testlerini, kartlarını ve planını tek sayfada gösterir.',
          'Siteyi tabletine ya da telefonuna uygulama olarak da yükleyebilirsin. Bu rehberi “Nasıl kullanılır?” düğmesiyle istediğin zaman yeniden açabilirsin.',
        ],
      },
    },
  },
  en: {
    dialogLabel: 'How to use',
    stepOf: '{step} / {total}',
    back: 'Back',
    next: 'Next',
    finish: 'Finish',
    skip: 'Skip',
    close: 'Close',
    goTool: 'Go to this tool',
    open: 'How to use',
    steps: {
      welcome: {
        title: 'Welcome! I’m Menti.',
        lines: [
          'AI Exam Survival gives you free study tools to get ready for your exams. You do not need an account; everything you do is saved only on this device.',
          'Let me show you the tools in 7 short steps. You can tap “Skip” at any time.',
        ],
      },
      planner: {
        title: 'Study Planner',
        lines: [
          'Write down this week’s subjects and study times, and tick what you finish.',
          'The focus timer on the same page helps you concentrate with 15, 25 or 45-minute study blocks and short breaks.',
        ],
      },
      quiz: {
        title: 'Quiz Center',
        lines: [
          'Choose your grade and subject and start a quiz. When it ends, you see an explanation for every question.',
          'With the practice exams on the same page you can also get ready for TYT, AYT and YDT with a timer.',
        ],
      },
      cards: {
        title: 'Smart Flashcards',
        lines: [
          'Add your subject’s deck with one tap from the “Decks for my grade” box, or write your own cards.',
          'First get to know the cards in Learn mode, then study with Practice and Review.',
        ],
      },
      calendar: {
        title: 'Exam Calendar',
        lines: [
          'Add your test and exam dates; the calendar shows how many days are left for each one.',
          'Move forward by ticking the preparation steps for each exam.',
        ],
      },
      coach: {
        title: 'Study Coach and Menti',
        lines: [
          'Tell the AI Study Coach your subject, topic and exam date, and it prepares a short study plan for you.',
          'You can also talk to me with the button at the bottom right. I am not a live AI; I work with rules prepared in advance.',
        ],
      },
      progress: {
        title: 'Progress Tracker',
        lines: [
          'The Progress Tracker shows your quizzes, cards and plan on one page.',
          'You can also install the site on your tablet or phone as an app. Open this guide again any time with the “How to use” button.',
        ],
      },
    },
  },
};
