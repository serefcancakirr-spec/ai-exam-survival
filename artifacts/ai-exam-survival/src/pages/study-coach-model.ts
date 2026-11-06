// AI Study Coach: rule-based study advice. No live AI, no network, nothing leaves the device.
// Given grade, subject, topic, difficulty, exam date and (optionally) what gets in the way,
// it builds a short plan from the written library in study-coach-content.ts.

import { addDays, daysBetween, isDateKey, splitExams, type Exam } from './exam-calendar-model';
import {
  COACH_DIFFICULTIES,
  COACH_PROBLEMS,
  COACH_SUBJECTS,
  DIFFICULTY_LABELS,
  GRADE_TIPS,
  PROBLEM_TIPS,
  SUBJECT_GUIDES,
  type CoachDifficulty,
  type CoachProblem,
  type CoachSubject,
  type Strategy,
} from './study-coach-content';

export const STUDY_COACH_STORAGE_KEY = 'ai-exam-survival:study-coach:v1';
/** Read only: the Exam Calendar's saved exams. The coach never writes to it. */
export const EXAM_CALENDAR_KEY_READ_ONLY = 'ai-exam-survival:exam-calendar:v1';

export const COACH_GRADES = ['9', '10', '11', '12'] as const;
export type CoachGrade = (typeof COACH_GRADES)[number];
export const TOPIC_LIMIT = 60;
export const SESSION_MINUTES = 25;
export const MAX_DAILY_MINUTES = 90;

/** Subjects that Quiz Center has questions for, so the coach only links there when it helps. */
const QUIZ_SUBJECTS: readonly CoachSubject[] = ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Literature'];

export type CoachRequest = {
  grade: string;
  subject: string;
  topic: string;
  difficulty: string;
  problem: string;
  examDate: string; // YYYY-MM-DD or ''
};

export type CoachLink = { href: string; label: string };
export type CoachAction = { text: string; link?: CoachLink };
export type CoachBand = 'none' | 'today' | 'very-soon' | 'this-week' | 'weeks' | 'far';

export type CoachPlan = {
  band: CoachBand;
  daysLeft: number | null;
  sessionsPerDay: number;
  minutesPerDay: number;
  sessionLength: number;
  focus: string;
  actions: CoachAction[];
  strategies: Strategy[];
  gradeTip: string;
  problemTip: string;
  prompt: string;
  summary: string[];
};

const LINKS = {
  flashcards: { href: '/smart-flashcards', label: 'Open Smart Flashcards' },
  quiz: { href: '/quiz-center', label: 'Open Quiz Center' },
  planner: { href: '/study-planner', label: 'Open Study Planner' },
  calendar: { href: '/exam-calendar', label: 'Open Exam Calendar' },
} as const;

// ---------- time left ----------

export function getCoachBand(examDate: string, today: string): CoachBand {
  if (!examDate) return 'none';
  const days = daysBetween(today, examDate);
  if (Number.isNaN(days) || days < 0) return 'none';
  if (days === 0) return 'today';
  if (days <= 2) return 'very-soon';
  if (days <= 7) return 'this-week';
  if (days <= 21) return 'weeks';
  return 'far';
}

const SESSIONS: Record<Exclude<CoachBand, 'today'>, Record<CoachDifficulty, number>> = {
  none: { comfortable: 1, 'somewhat-hard': 1, 'very-hard': 2 },
  far: { comfortable: 1, 'somewhat-hard': 1, 'very-hard': 2 },
  weeks: { comfortable: 1, 'somewhat-hard': 2, 'very-hard': 2 },
  'this-week': { comfortable: 1, 'somewhat-hard': 2, 'very-hard': 3 },
  'very-soon': { comfortable: 2, 'somewhat-hard': 2, 'very-hard': 3 },
};
const TODAY_MINUTES: Record<CoachDifficulty, number> = { comfortable: 15, 'somewhat-hard': 20, 'very-hard': 20 };

/** Sessions and minutes per day. Never more than 90 minutes for one subject. */
export function getTimePlan(band: CoachBand, difficulty: CoachDifficulty) {
  if (band === 'today') {
    return { sessionsPerDay: 1, sessionLength: TODAY_MINUTES[difficulty], minutesPerDay: TODAY_MINUTES[difficulty] };
  }
  const sessionsPerDay = SESSIONS[band][difficulty];
  return {
    sessionsPerDay,
    sessionLength: SESSION_MINUTES,
    minutesPerDay: Math.min(sessionsPerDay * SESSION_MINUTES, MAX_DAILY_MINUTES),
  };
}

// ---------- focus sentence ----------

const FOCUS: Record<CoachBand, Record<CoachDifficulty, string>> = {
  today: {
    comfortable: 'Exam day: a calm, light review is all you need. Trust what you have practised.',
    'somewhat-hard': 'Exam day: review the key points once, then stop studying and get ready.',
    'very-hard': 'Exam day: focus on the few ideas you know best and how to start each type of question. No new material now.',
  },
  'very-soon': {
    comfortable: 'With only a day or two left, keep it short: test yourself and polish small gaps.',
    'somewhat-hard': 'With a day or two left, spend your time testing yourself on the parts you are least sure about.',
    'very-hard': 'With a day or two left, aim for the core ideas that appear most often. Practise them until you can explain them.',
  },
  'this-week': {
    comfortable: 'You have a week: keep your knowledge fresh with short daily practice.',
    'somewhat-hard': 'You have a week: work through the topic part by part, then finish with practice questions.',
    'very-hard': 'You have a week: start with the basics today, add one part each day, and save the last two days for practice.',
  },
  weeks: {
    comfortable: 'You have a few weeks: a little practice every few days will keep this topic strong.',
    'somewhat-hard': 'You have a few weeks: plan regular sessions now so the last week is review, not catch-up.',
    'very-hard': 'You have a few weeks, which is enough time if you start now and study a little every day.',
  },
  far: {
    comfortable: 'The exam is still far away: short weekly reviews will keep this topic fresh.',
    'somewhat-hard': 'The exam is still far away: build understanding slowly with short, spaced sessions.',
    'very-hard': 'The exam is still far away, which is good news: tackle the hardest parts first while there is time.',
  },
  none: {
    comfortable: 'No exam date yet: keep this topic fresh with a short session or two each week.',
    'somewhat-hard': 'No exam date yet: build steady understanding with short, regular sessions.',
    'very-hard': 'No exam date yet: start with the basics and study a little often instead of a lot at once.',
  },
};

// ---------- actions ----------

function cap(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function buildActions(
  band: CoachBand,
  difficulty: CoachDifficulty,
  subject: CoachSubject,
  topic: string,
  sessionsPerDay: number,
): CoachAction[] {
  const t = topic.trim() || 'this topic';
  const practice = SUBJECT_GUIDES[subject].practice;
  const hasQuiz = QUIZ_SUBJECTS.includes(subject);
  const sessionsText = `${sessionsPerDay} session${sessionsPerDay === 1 ? '' : 's'}`;
  const quizAction = (when: string): CoachAction =>
    hasQuiz
      ? { text: `${when}, take a ${subject} practice quiz and look at every mistake.`, link: LINKS.quiz }
      : { text: `${when}, answer practice questions without notes and check every mistake.` };

  let actions: CoachAction[];
  switch (band) {
    case 'today':
      actions = [
        { text: `Spend ${TODAY_MINUTES[difficulty]} minutes on a light review of ${t}: your summary and key terms only.` },
        { text: 'Test yourself on five quick questions. Do not start new material today.' },
        { text: 'Get your things ready, eat, drink water and arrive early.' },
      ];
      break;
    case 'very-soon':
      actions = [
        { text: `Close your notes and write everything you remember about ${t}. Then check and mark the gaps (15 min).` },
        { text: `${cap(practice)} on the parts you missed (25 min).` },
        { text: `Review your flashcards for ${t} in Review mode.`, link: LINKS.flashcards },
        quizAction('Tomorrow'),
      ];
      break;
    case 'this-week':
      actions = [
        { text: `List the parts of ${t} the exam covers and mark the hardest ones.` },
        { text: `Study ${sessionsText} a day, one part per session: ${practice}.` },
        { text: `Make flashcards for ${t} and review them every day.`, link: LINKS.flashcards },
        quizAction('Two days before the exam'),
      ];
      break;
    case 'weeks':
      actions = [
        { text: `Plan ${sessionsText} a day in the Study Planner.`, link: LINKS.planner },
        { text: `Learn ${t} one part at a time: ${practice} in each session.` },
        { text: 'Make flashcards as you go and review them every few days.', link: LINKS.flashcards },
        quizAction('One week before the exam'),
      ];
      break;
    case 'far':
      actions = [
        { text: `Study ${t} in short sessions two or three times a week, not all at once.` },
        { text: `${cap(practice)} at the end of each session to check you understood.` },
        { text: `Make flashcards for the key ideas in ${t}.`, link: LINKS.flashcards },
      ];
      break;
    default:
      actions = [
        { text: 'Add the exam to the Exam Calendar when you know the date, so the countdown can guide you.', link: LINKS.calendar },
        { text: `Study ${t} in short sessions two or three times a week.` },
        { text: `${cap(practice)} to check your understanding.` },
        { text: `Make flashcards for the key ideas in ${t}.`, link: LINKS.flashcards },
      ];
  }

  if (difficulty === 'very-hard' && band !== 'today') {
    actions.unshift({ text: `Start with the basics of ${t}: find one worked example or ask your teacher which part matters most.` });
  }
  if (difficulty === 'comfortable' && band !== 'today') {
    actions.push({ text: `Challenge yourself: try the hardest ${subject === 'Other' ? '' : `${subject} `}question you can find on ${t}.` });
  }
  return actions;
}

// ---------- strategies ----------

/** Picks the three strategies that best fit the difficulty, the problem and the time left. */
export function pickStrategies(subject: CoachSubject, difficulty: CoachDifficulty, problem: CoachProblem, band: CoachBand) {
  const nearExam = band === 'today' || band === 'very-soon' || band === 'this-week';
  const scored = SUBJECT_GUIDES[subject].strategies.map((strategy, index) => {
    let score = 0;
    if (problem !== 'none' && strategy.problems.includes(problem)) score += 3;
    if (problem === 'none' && strategy.problems.includes('none')) score += 2;
    if (strategy.difficulties.includes(difficulty)) score += 2;
    if (nearExam && strategy.problems.includes('time')) score += 1;
    return { strategy, score, index };
  });
  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.slice(0, 3).map((item) => item.strategy);
}

// ---------- practice prompt for a school-approved AI tool ----------

export function buildPracticePrompt(grade: CoachGrade, subject: CoachSubject, topic: string, problem: CoachProblem) {
  const t = topic.trim() || 'my current topic';
  const s = subject === 'Other' ? '' : ` in ${subject}`;
  const ask: Record<CoachProblem, string> = {
    none: 'Explain the main ideas in plain language, then give me 3 practice questions. Show the answers only after I try.',
    understand: 'Explain it in plain language with one simple example, then check my understanding with 2 short questions.',
    remember: 'Give me 5 quick recall questions to test my memory. Show the answers only after I try.',
    time: 'Give me one exam-style question with a time limit, then show me how to plan the answer quickly.',
    nerves: 'Give me 3 exam-style questions of increasing difficulty so I can practise calmly, with hints if I get stuck.',
  };
  return `I am a grade ${grade} student studying ${t}${s}. ${ask[problem]}`;
}

// ---------- the full plan ----------

export function buildCoachPlan(request: CoachRequest, today: string): CoachPlan {
  const grade = request.grade as CoachGrade;
  const subject = request.subject as CoachSubject;
  const difficulty = request.difficulty as CoachDifficulty;
  const problem = request.problem as CoachProblem;
  const band = getCoachBand(request.examDate, today);
  const daysLeft = band === 'none' ? null : daysBetween(today, request.examDate);
  const time = getTimePlan(band, difficulty);
  const topic = request.topic.trim();

  const summary = [`Grade ${grade}`, subject, ...(topic ? [topic] : []), DIFFICULTY_LABELS[difficulty]];
  summary.push(daysLeft === null ? 'No exam date' : daysLeft === 0 ? 'Exam today' : daysLeft === 1 ? 'Exam tomorrow' : `Exam in ${daysLeft} days`);

  return {
    band,
    daysLeft,
    ...time,
    focus: FOCUS[band][difficulty],
    actions: buildActions(band, difficulty, subject, topic, time.sessionsPerDay),
    strategies: pickStrategies(subject, difficulty, problem, band),
    gradeTip: GRADE_TIPS[grade],
    problemTip: PROBLEM_TIPS[problem],
    prompt: buildPracticePrompt(grade, subject, topic, problem),
    summary,
  };
}

// ---------- checking the form ----------

export function validateCoachRequest(request: CoachRequest, today: string) {
  const errors: string[] = [];
  if (!(COACH_GRADES as readonly string[]).includes(request.grade)) errors.push('Choose your grade (9–12).');
  if (!(COACH_SUBJECTS as readonly string[]).includes(request.subject)) errors.push('Choose a subject.');
  if (!(COACH_DIFFICULTIES as readonly string[]).includes(request.difficulty)) errors.push('Choose how hard the topic feels.');
  if (!(COACH_PROBLEMS as readonly string[]).includes(request.problem)) errors.push('Choose what gets in the way, or “Not sure”.');
  if (request.topic.trim().length > TOPIC_LIMIT) errors.push(`Keep the topic under ${TOPIC_LIMIT} characters.`);
  if (request.examDate) {
    if (!isDateKey(request.examDate)) errors.push('Choose a real exam date, or leave it empty.');
    else if (request.examDate < today) errors.push('That exam date has already passed. Choose a future date or leave it empty.');
  }
  return errors;
}

export function createExampleRequest(today: string): CoachRequest {
  return {
    grade: '10',
    subject: 'Biology',
    topic: 'Genetics and DNA',
    difficulty: 'somewhat-hard',
    problem: 'remember',
    examDate: addDays(today, 7),
  };
}

// ---------- Exam Calendar (read only) ----------

const CALENDAR_SUBJECT_MAP: Record<string, CoachSubject> = {
  'Algebra I': 'Mathematics',
  'Algebra II': 'Mathematics',
  Geometry: 'Mathematics',
  Biology: 'Biology',
  Chemistry: 'Chemistry',
  Physics: 'Physics',
  'English Language Arts': 'English',
  'World History': 'History',
  Spanish: 'Foreign Language',
  Other: 'Other',
};

export function mapCalendarSubject(subject: string): CoachSubject {
  return CALENDAR_SUBJECT_MAP[subject] ?? 'Other';
}

/** Upcoming calendar exams from the calendar's saved text, soonest first. Never changes that text. */
export function readUpcomingCalendarExams(raw: string | null, today: string): Exam[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as { exams?: unknown }).exams)) return [];
    const exams = (parsed as { exams: unknown[] }).exams.filter(
      (exam): exam is Exam =>
        typeof exam === 'object' &&
        exam !== null &&
        typeof (exam as Exam).id === 'string' &&
        typeof (exam as Exam).title === 'string' &&
        typeof (exam as Exam).subject === 'string' &&
        (COACH_GRADES as readonly string[]).includes((exam as Exam).grade) &&
        isDateKey((exam as Exam).date),
    );
    return splitExams(exams, today).upcoming;
  } catch {
    return [];
  }
}

export function requestFromExam(exam: Exam, current: CoachRequest): CoachRequest {
  return {
    ...current,
    grade: exam.grade,
    subject: mapCalendarSubject(exam.subject),
    topic: (exam.notes || exam.title).slice(0, TOPIC_LIMIT),
    examDate: exam.date,
  };
}

// ---------- saving the last request ----------

export type StudyCoachData = { version: 1; request: CoachRequest | null };

export function isSavedStudyCoachData(value: unknown): value is StudyCoachData {
  if (typeof value !== 'object' || value === null) return false;
  const data = value as { version?: unknown; request?: unknown };
  if (data.version !== 1) return false;
  if (data.request === null) return true;
  if (typeof data.request !== 'object' || data.request === null) return false;
  const r = data.request as Record<string, unknown>;
  return ['grade', 'subject', 'topic', 'difficulty', 'problem', 'examDate'].every((key) => typeof r[key] === 'string');
}
