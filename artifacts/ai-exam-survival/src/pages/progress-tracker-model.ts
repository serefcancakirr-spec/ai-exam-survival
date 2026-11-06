// Progress Tracker: reads other tools' saved data and turns it into honest statistics.
//
// READ ONLY. This file never writes to browser storage. Every function takes the saved
// text (or parsed data) as input and returns numbers, so it can be tested on its own.
// Nothing here is estimated: when there is not enough data, it says so.

import { QUIZ_GRADES, QUIZ_QUESTION_COUNTS, QUIZ_SUBJECTS } from './quiz-question-bank';
import { isSavedStudyPlannerData, type StudyPlannerData } from './study-planner-model';
import { isSavedFlashcardsData, getCardStatus, type FlashcardsData } from './flashcards-model';
import { addDays, daysBetween, isSavedExamCalendarData, splitExams, toDateKey, type Exam, type ExamCalendarData } from './exam-calendar-model';
import { isSavedExamPrepData, type ExamPrepData } from './exam-prep-model';

// Storage keys of the other tools (read only).
export const SOURCE_KEYS = {
  quiz: 'ai-exam-survival:quiz-center:v1',
  planner: 'ai-exam-survival:study-planner:v1',
  flashcards: 'ai-exam-survival:flashcards:v1',
  calendar: 'ai-exam-survival:exam-calendar:v1',
  prep: 'ai-exam-survival:exam-prep:v1',
} as const;
export type SourceName = keyof typeof SOURCE_KEYS;

// Agreed thresholds (Stage 7 plan).
export const STRONG_AT = 80; // % or higher
export const NEEDS_WORK_BELOW = 60; // % below this
export const SUBJECT_MIN_QUIZZES = 2;
export const SUBJECT_MIN_ANSWERS = 10;
export const TOPIC_MIN_ANSWERS = 4;
export const TREND_MIN_QUIZZES = 4;
export const TREND_MIN_CHANGE = 10;
export const MAX_SAVED_QUIZZES = 30; // Quiz Center keeps the latest 30

// ---------- reading saved data safely ----------

export type SourceStatus = 'empty' | 'ok' | 'damaged';
export type Source<T> = { status: SourceStatus; data: T | null };

export type QuizReviewItem = { question: { topic: string; subject: string; correctOptionId: string }; selectedOptionId: string };
export type QuizAttempt = {
  id: string;
  grade: string;
  subject: string;
  topic: string;
  questionCount: number;
  score: number;
  percentage: number;
  completedAt: string;
  review: QuizReviewItem[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
const isOptionId = (value: unknown) => value === 'A' || value === 'B' || value === 'C' || value === 'D';
const isDifficulty = (value: unknown) => value === 'easy' || value === 'medium' || value === 'hard';

// Same checks as Quiz Center, so both pages always agree on what can be read.
function isQuizQuestion(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.grade === 'string' &&
    typeof value.subject === 'string' &&
    typeof value.topic === 'string' &&
    isDifficulty(value.difficulty) &&
    typeof value.prompt === 'string' &&
    typeof value.explanation === 'string' &&
    isOptionId(value.correctOptionId) &&
    Array.isArray(value.options) &&
    value.options.length === 4 &&
    value.options.every((option) => isRecord(option) && isOptionId(option.id) && typeof option.text === 'string')
  );
}

function isQuizAttempt(value: unknown): value is QuizAttempt {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (QUIZ_GRADES as readonly unknown[]).includes(value.grade) &&
    (QUIZ_SUBJECTS as readonly unknown[]).includes(value.subject) &&
    typeof value.topic === 'string' &&
    isDifficulty(value.difficulty) &&
    (QUIZ_QUESTION_COUNTS as readonly unknown[]).includes(value.questionCount) &&
    typeof value.score === 'number' &&
    Number.isInteger(value.score) &&
    typeof value.percentage === 'number' &&
    Number.isFinite(value.percentage) &&
    typeof value.completedAt === 'string' &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    Array.isArray(value.review) &&
    value.review.length === value.questionCount &&
    value.review.every((item) => isRecord(item) && isQuizQuestion(item.question) && isOptionId(item.selectedOptionId))
  );
}

function parse(raw: string | null): { ok: true; value: unknown } | { ok: false } | null {
  if (raw === null || raw === '') return null;
  try {
    return { ok: true, value: JSON.parse(raw) };
  } catch {
    return { ok: false };
  }
}

function readWith<T>(raw: string | null, check: (value: unknown) => value is T): Source<T> {
  const parsed = parse(raw);
  if (parsed === null) return { status: 'empty', data: null };
  if (!parsed.ok || !check(parsed.value)) return { status: 'damaged', data: null };
  return { status: 'ok', data: parsed.value };
}

function isQuizHistory(value: unknown): value is QuizAttempt[] {
  return Array.isArray(value) && value.length <= MAX_SAVED_QUIZZES && value.every(isQuizAttempt);
}

export type AllSources = {
  quiz: Source<QuizAttempt[]>;
  planner: Source<StudyPlannerData>;
  flashcards: Source<FlashcardsData>;
  calendar: Source<ExamCalendarData>;
  prep: Source<ExamPrepData>;
};

/** Reads every tool's saved text. `raw` maps a source to its saved text (or null). */
export function readAllSources(raw: Record<SourceName, string | null>): AllSources {
  return {
    quiz: readWith(raw.quiz, isQuizHistory),
    planner: readWith(raw.planner, isSavedStudyPlannerData),
    flashcards: readWith(raw.flashcards, isSavedFlashcardsData),
    calendar: readWith(raw.calendar, isSavedExamCalendarData),
    prep: readWith(raw.prep, isSavedExamPrepData),
  };
}

// ---------- small helpers ----------

/** Local calendar day (YYYY-MM-DD) of a saved timestamp. */
export function localDateOf(timestamp: string) {
  const time = Date.parse(timestamp);
  return Number.isNaN(time) ? null : toDateKey(new Date(time));
}

const percent = (part: number, whole: number) => (whole === 0 ? 0 : Math.round((part / whole) * 100));

export type Classification = 'strong' | 'needs-work' | 'in-between' | 'not-enough';

export function classify(accuracy: number, enoughData: boolean): Classification {
  if (!enoughData) return 'not-enough';
  if (accuracy >= STRONG_AT) return 'strong';
  if (accuracy < NEEDS_WORK_BELOW) return 'needs-work';
  return 'in-between';
}

const studyTasks = (planner: StudyPlannerData | null) => (planner ? planner.tasks.filter((task) => task.kind === 'study') : []);

// ---------- overview ----------

/** Exactly Quiz Center's "Average score": the rounded mean of quiz percentages. */
export function quizAverage(attempts: readonly QuizAttempt[]) {
  return attempts.length === 0 ? null : Math.round(attempts.reduce((total, a) => total + a.percentage, 0) / attempts.length);
}

export function buildOverview(sources: AllSources, today: string) {
  const attempts = sources.quiz.data ?? [];
  const tasks = studyTasks(sources.planner.data);
  const cards = sources.flashcards.data?.cards ?? [];
  const progress = sources.flashcards.data?.progress ?? {};
  const mastered = cards.filter((card) => getCardStatus(progress[card.id]) === 'mastered').length;
  const reviewed = cards.filter((card) => progress[card.id]).length;
  const activity = buildActivity(sources, today);
  return {
    quizzes: attempts.length,
    quizCapReached: attempts.length >= MAX_SAVED_QUIZZES,
    averageScore: quizAverage(attempts),
    sessionsDone: tasks.filter((task) => task.completed).length,
    sessionsPlanned: tasks.length,
    cardsMastered: mastered,
    cardsReviewed: reviewed,
    cardsTotal: cards.length,
    activeDaysLast7: activity.activeDaysLast7,
    activeDaysLast30: activity.activeDaysLast30,
  };
}

// ---------- subject rows (no merging of different subjects) ----------

export type SubjectRowDef = { key: string; label: string; group: string | null; quizName?: string; plannerName?: string; sourcesNote: string };

/**
 * Each row keeps its original subject name. Names are only shared when they are identical
 * in both tools (Biology, Chemistry, Physics). Groups are only visual headings.
 */
export const SUBJECT_ROWS: SubjectRowDef[] = [
  { key: 'algebra-1', label: 'Algebra I', group: 'Mathematics', plannerName: 'Algebra I', sourcesNote: 'Study Planner & Exam Calendar' },
  { key: 'algebra-2', label: 'Algebra II', group: 'Mathematics', plannerName: 'Algebra II', sourcesNote: 'Study Planner & Exam Calendar' },
  { key: 'geometry', label: 'Geometry', group: 'Mathematics', plannerName: 'Geometry', sourcesNote: 'Study Planner & Exam Calendar' },
  { key: 'mathematics', label: 'Mathematics', group: 'Mathematics', quizName: 'Mathematics', sourcesNote: 'Quiz Center & Flashcards (not split by course)' },
  { key: 'english', label: 'English', group: 'English', quizName: 'English', sourcesNote: 'Quiz Center & Flashcards' },
  { key: 'ela', label: 'English Language Arts', group: 'English', plannerName: 'English Language Arts', sourcesNote: 'Study Planner & Exam Calendar' },
  { key: 'biology', label: 'Biology', group: null, quizName: 'Biology', plannerName: 'Biology', sourcesNote: 'All tools' },
  { key: 'chemistry', label: 'Chemistry', group: null, quizName: 'Chemistry', plannerName: 'Chemistry', sourcesNote: 'All tools' },
  { key: 'physics', label: 'Physics', group: null, quizName: 'Physics', plannerName: 'Physics', sourcesNote: 'All tools' },
  { key: 'history', label: 'History', group: 'History', quizName: 'History', sourcesNote: 'Quiz Center & Flashcards' },
  { key: 'world-history', label: 'World History', group: 'History', plannerName: 'World History', sourcesNote: 'Study Planner & Exam Calendar' },
  { key: 'geography', label: 'Geography', group: null, quizName: 'Geography', sourcesNote: 'Quiz Center & Flashcards' },
  { key: 'literature', label: 'Literature', group: null, quizName: 'Literature', sourcesNote: 'Quiz Center & Flashcards' },
  { key: 'spanish', label: 'Spanish', group: null, plannerName: 'Spanish', sourcesNote: 'Study Planner & Exam Calendar' },
  { key: 'other', label: 'Other', group: null, plannerName: 'Other', sourcesNote: 'Study Planner & Exam Calendar' },
];

export type Trend = 'up' | 'down' | 'steady';

export type SubjectRow = SubjectRowDef & {
  quiz: { count: number; average: number; correct: number; answered: number; accuracy: number; trend: Trend | null } | null;
  flashcards: { mastered: number; reviewed: number; total: number } | null;
  planner: { done: number; planned: number } | null;
  upcomingExams: number;
  classification: Classification | null; // null = no quiz data in this row
};

/** Older half vs newer half of the quizzes, only with enough quizzes and a clear change. */
export function quizTrend(attemptsOldestFirst: readonly QuizAttempt[]): Trend | null {
  if (attemptsOldestFirst.length < TREND_MIN_QUIZZES) return null;
  const half = Math.floor(attemptsOldestFirst.length / 2);
  const avg = (list: readonly QuizAttempt[]) => list.reduce((t, a) => t + a.percentage, 0) / list.length;
  const change = avg(attemptsOldestFirst.slice(-half)) - avg(attemptsOldestFirst.slice(0, half));
  if (change >= TREND_MIN_CHANGE) return 'up';
  if (change <= -TREND_MIN_CHANGE) return 'down';
  return 'steady';
}

const isCorrect = (item: QuizReviewItem) => item.selectedOptionId === item.question.correctOptionId;
const byTime = (a: QuizAttempt, b: QuizAttempt) => Date.parse(a.completedAt) - Date.parse(b.completedAt);

export function buildSubjectRows(sources: AllSources, today: string): SubjectRow[] {
  const attempts = sources.quiz.data ?? [];
  const tasks = studyTasks(sources.planner.data);
  const flash = sources.flashcards.data;
  const upcoming = sources.calendar.data ? splitExams(sources.calendar.data.exams, today).upcoming : [];

  return SUBJECT_ROWS.map((def) => {
    let quiz: SubjectRow['quiz'] = null;
    let flashcards: SubjectRow['flashcards'] = null;
    if (def.quizName) {
      const list = attempts.filter((a) => a.subject === def.quizName).sort(byTime);
      if (list.length > 0) {
        const answered = list.reduce((t, a) => t + a.review.length, 0);
        const correct = list.reduce((t, a) => t + a.review.filter(isCorrect).length, 0);
        quiz = { count: list.length, average: quizAverage(list) ?? 0, correct, answered, accuracy: percent(correct, answered), trend: quizTrend(list) };
      }
      if (flash) {
        const deckIds = new Set(flash.decks.filter((d) => d.subject === def.quizName).map((d) => d.id));
        const cards = flash.cards.filter((c) => deckIds.has(c.deckId));
        if (cards.length > 0) {
          flashcards = {
            mastered: cards.filter((c) => getCardStatus(flash.progress[c.id]) === 'mastered').length,
            reviewed: cards.filter((c) => flash.progress[c.id]).length,
            total: cards.length,
          };
        }
      }
    }
    let planner: SubjectRow['planner'] = null;
    let upcomingExams = 0;
    if (def.plannerName) {
      const own = tasks.filter((t) => t.subject === def.plannerName);
      if (own.length > 0) planner = { done: own.filter((t) => t.completed).length, planned: own.length };
      upcomingExams = upcoming.filter((e) => e.subject === def.plannerName).length;
    }
    const enough = quiz ? quiz.count >= SUBJECT_MIN_QUIZZES || quiz.answered >= SUBJECT_MIN_ANSWERS : false;
    return { ...def, quiz, flashcards, planner, upcomingExams, classification: quiz ? classify(quiz.accuracy, enough) : null };
  }).filter((row) => row.quiz || row.flashcards || row.planner || row.upcomingExams > 0);
}

// ---------- topics ----------

export type TopicResult = {
  source: 'quiz' | 'flashcards';
  subject: string;
  topic: string;
  /** Quiz: answers correct. Flashcards: reviewed cards currently known (Learning or Mastered). */
  good: number;
  total: number;
  rate: number;
  classification: Classification;
  deckName?: string;
};

export function buildTopicResults(sources: AllSources): TopicResult[] {
  const results: TopicResult[] = [];
  const quizTopics = new Map<string, { subject: string; topic: string; good: number; total: number }>();
  (sources.quiz.data ?? []).forEach((attempt) =>
    attempt.review.forEach((item) => {
      const key = `${attempt.subject}::${item.question.topic}`;
      const entry = quizTopics.get(key) ?? { subject: attempt.subject, topic: item.question.topic, good: 0, total: 0 };
      entry.total += 1;
      if (isCorrect(item)) entry.good += 1;
      quizTopics.set(key, entry);
    }),
  );
  quizTopics.forEach((entry) => {
    const rate = percent(entry.good, entry.total);
    results.push({ source: 'quiz', ...entry, rate, classification: classify(rate, entry.total >= TOPIC_MIN_ANSWERS) });
  });

  const flash = sources.flashcards.data;
  flash?.decks.forEach((deck) => {
    const reviewed = flash.cards.filter((c) => c.deckId === deck.id && flash.progress[c.id]);
    if (reviewed.length === 0) return;
    const known = reviewed.filter((c) => getCardStatus(flash.progress[c.id]) !== 'again').length;
    const rate = percent(known, reviewed.length);
    results.push({
      source: 'flashcards',
      subject: deck.subject,
      topic: deck.topic || deck.name,
      deckName: deck.name,
      good: known,
      total: reviewed.length,
      rate,
      classification: classify(rate, reviewed.length >= TOPIC_MIN_ANSWERS),
    });
  });
  return results;
}

export type Recommendation = { text: string; link: { href: string; label: string } };

export function recommendFor(topic: TopicResult): Recommendation[] {
  if (topic.source === 'quiz') {
    if (topic.classification === 'needs-work') {
      return [
        { text: `Take a 5-question ${topic.subject} quiz on “${topic.topic}” and read every explanation.`, link: { href: '/quiz-center', label: 'Open Quiz Center' } },
        { text: `Make flashcards for the ideas you missed in “${topic.topic}”.`, link: { href: '/smart-flashcards', label: 'Open Smart Flashcards' } },
      ];
    }
    return [{ text: `Keep “${topic.topic}” fresh with one short ${topic.subject} quiz next week.`, link: { href: '/quiz-center', label: 'Open Quiz Center' } }];
  }
  if (topic.classification === 'needs-work') {
    return [{ text: `Study the “${topic.deckName}” deck in Review mode until the Review-again cards move up.`, link: { href: '/smart-flashcards', label: 'Open Smart Flashcards' } }];
  }
  return [{ text: `Do a quick Practice round of “${topic.deckName}” to keep it mastered.`, link: { href: '/smart-flashcards', label: 'Open Smart Flashcards' } }];
}

// ---------- activity, weekly chart and streak ----------

export type ActivityType = 'quiz' | 'flashcards' | 'planner' | 'prep';
export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  quiz: 'Quizzes',
  flashcards: 'Flashcards',
  planner: 'Planner sessions',
  prep: 'Prep steps',
};

/**
 * Every activity we can date:
 * quizzes (finish time), flashcards (each card's LAST review only), prep steps (completion time),
 * Planner sessions marked done (counted on their PLANNED date, only up to today: an approximation).
 */
export function collectActivity(sources: AllSources, today: string) {
  const events: Array<{ date: string; type: ActivityType }> = [];
  (sources.quiz.data ?? []).forEach((a) => {
    const d = localDateOf(a.completedAt);
    if (d && d <= today) events.push({ date: d, type: 'quiz' });
  });
  const flash = sources.flashcards.data;
  if (flash) {
    const cardIds = new Set(flash.cards.map((c) => c.id));
    Object.entries(flash.progress).forEach(([cardId, p]) => {
      const d = localDateOf(p.lastReviewedAt);
      if (cardIds.has(cardId) && d && d <= today) events.push({ date: d, type: 'flashcards' });
    });
  }
  studyTasks(sources.planner.data).forEach((t) => {
    if (t.completed && t.date <= today) events.push({ date: t.date, type: 'planner' });
  });
  (sources.prep.data?.steps ?? []).forEach((s) => {
    const d = s.done && s.completedAt ? localDateOf(s.completedAt) : null;
    if (d && d <= today) events.push({ date: d, type: 'prep' });
  });
  return events;
}

export function longestRun(sortedDates: readonly string[]) {
  let best = 0;
  let run = 0;
  sortedDates.forEach((date, i) => {
    run = i > 0 && daysBetween(sortedDates[i - 1], date) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/** Days in a row with activity, ending today (or yesterday, so a streak is not "lost" before today is over). */
export function currentStreak(activeDates: ReadonlySet<string>, today: string) {
  let day = activeDates.has(today) ? today : addDays(today, -1);
  let count = 0;
  while (activeDates.has(day)) {
    count += 1;
    day = addDays(day, -1);
  }
  return count;
}

export function buildActivity(sources: AllSources, today: string) {
  const events = collectActivity(sources, today);
  const activeDates = new Set(events.map((e) => e.date));
  const sorted = [...activeDates].sort();
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((date) => {
    const counts: Record<ActivityType, number> = { quiz: 0, flashcards: 0, planner: 0, prep: 0 };
    events.filter((e) => e.date === date).forEach((e) => (counts[e.type] += 1));
    return { date, counts, total: counts.quiz + counts.flashcards + counts.planner + counts.prep };
  });
  const within = (days: number) => sorted.filter((d) => daysBetween(d, today) >= 0 && daysBetween(d, today) < days).length;
  return {
    week,
    currentStreak: currentStreak(activeDates, today),
    bestStreak: longestRun(sorted),
    activeDaysLast7: within(7),
    activeDaysLast30: within(30),
    firstActivity: sorted[0] ?? null,
  };
}

/** Study Planner week: planned vs done, plus how many were due up to today. */
export function buildPlannerWeek(planner: StudyPlannerData | null, today: string) {
  const tasks = studyTasks(planner);
  if (!planner || tasks.length === 0) return null;
  const due = tasks.filter((t) => t.date <= today);
  const dates = tasks.map((t) => t.date).sort();
  return {
    weekStart: dates[0],
    weekEnd: dates[dates.length - 1],
    planned: tasks.length,
    done: tasks.filter((t) => t.completed).length,
    dueSoFar: due.length,
    doneOfDue: due.filter((t) => t.completed).length,
    minutesPlanned: tasks.reduce((m, t) => m + t.duration, 0),
    minutesDone: tasks.filter((t) => t.completed).reduce((m, t) => m + t.duration, 0),
  };
}

// ---------- quiz scores over time ----------

export function quizTimeline(attempts: readonly QuizAttempt[]) {
  return [...attempts].sort(byTime).map((a) => ({ id: a.id, date: localDateOf(a.completedAt) ?? '', subject: a.subject, percentage: a.percentage }));
}

// ---------- exam readiness (facts only, never a combined percentage) ----------

export type ExamFacts = {
  exam: Exam;
  daysLeft: number;
  prep: { done: number; total: number } | null;
  planner: { done: number; planned: number } | null;
  latestQuiz: { percentage: number; date: string } | null;
};

export function buildExamReadiness(sources: AllSources, today: string): ExamFacts[] {
  if (!sources.calendar.data) return [];
  const { upcoming } = splitExams(sources.calendar.data.exams, today);
  const steps = sources.prep.data?.steps ?? [];
  const tasks = studyTasks(sources.planner.data);
  const attempts = sources.quiz.data ?? [];
  return upcoming.map((exam) => {
    const own = steps.filter((s) => s.examId === exam.id);
    const sessions = tasks.filter((t) => t.subject === exam.subject && t.date <= exam.date);
    // Only identical subject names are linked to quiz results (Biology, Chemistry, Physics).
    const quizzes = attempts.filter((a) => a.subject === exam.subject).sort(byTime);
    const last = quizzes[quizzes.length - 1];
    return {
      exam,
      daysLeft: daysBetween(today, exam.date),
      prep: own.length > 0 ? { done: own.filter((s) => s.done).length, total: own.length } : null,
      planner: sessions.length > 0 ? { done: sessions.filter((t) => t.completed).length, planned: sessions.length } : null,
      latestQuiz: last ? { percentage: last.percentage, date: localDateOf(last.completedAt) ?? '' } : null,
    };
  });
}
