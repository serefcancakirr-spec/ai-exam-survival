// Exam Calendar: data, dates, countdowns and saving.
// This file has no screen code, so its rules can be tested on their own.
// All dates are "local calendar days" (YYYY-MM-DD), so a countdown never
// shifts because of time zones or summer time.

export const EXAM_CALENDAR_STORAGE_KEY = 'ai-exam-survival:exam-calendar:v1';

export const EXAM_GRADES = ['9', '10', '11', '12'] as const;
export type ExamGrade = (typeof EXAM_GRADES)[number];

/** Same subject names as the Study Planner, so exams can be linked to plans later. */
export const EXAM_SUBJECTS = [
  'Algebra I',
  'Algebra II',
  'Biology',
  'Chemistry',
  'English Language Arts',
  'Geometry',
  'Physics',
  'Spanish',
  'World History',
  'Other',
] as const;
export type ExamSubject = (typeof EXAM_SUBJECTS)[number];

export const EXAM_LIMITS = { title: 80, notes: 300 } as const;
const MIN_YEAR = 2000;
const MAX_YEAR = 2100;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Exam = {
  id: string;
  subject: ExamSubject;
  grade: ExamGrade;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or ''
  notes: string;
  createdAt: string;
};

export type ExamCalendarData = {
  version: 1;
  exams: Exam[];
};

export type ExamDraft = {
  subject: string;
  grade: string;
  title: string;
  date: string;
  time: string;
  notes: string;
};

export function createInitialExamCalendarData(): ExamCalendarData {
  return { version: 1, exams: [] };
}

export function createExamId() {
  return `exam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- dates ----------

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayKey(now: Date = new Date()) {
  return toDateKey(now);
}

/** Returns a Date for a real calendar day, or null (for example 2027-02-29). */
export function parseDateKey(key: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }
  return date;
}

export function isDateKey(value: unknown): value is string {
  return typeof value === 'string' && parseDateKey(value) !== null;
}

export function isTimeValue(value: unknown): value is string {
  return typeof value === 'string' && (value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

export function addDays(key: string, days: number) {
  const date = parseDateKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier). */
export function daysBetween(from: string, to: string) {
  const a = parseDateKey(from);
  const b = parseDateKey(to);
  if (!a || !b) return Number.NaN;
  const aUtc = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const bUtc = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((bUtc - aUtc) / DAY_MS);
}

// ---------- countdowns ----------

export type CountdownTone = 'today' | 'soon' | 'week' | 'later' | 'past';

export function getCountdown(examDate: string, today: string): { label: string; days: number; tone: CountdownTone } {
  const days = daysBetween(today, examDate);
  if (days === 0) return { label: 'Today', days, tone: 'today' };
  if (days === 1) return { label: 'Tomorrow', days, tone: 'soon' };
  if (days > 1) return { label: `In ${days} days`, days, tone: days <= 7 ? 'week' : 'later' };
  if (days === -1) return { label: 'Yesterday', days, tone: 'past' };
  return { label: `${Math.abs(days)} days ago`, days, tone: 'past' };
}

/** `locale` is 'en' unless Turkish is chosen ('tr-TR'); only the wording of the date changes. */
export function formatExamDate(key: string, locale = 'en') {
  const date = parseDateKey(key);
  if (!date) return { weekday: '', day: '', month: '', long: key };
  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date).toLocaleUpperCase(locale),
    day: String(date.getDate()),
    month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date).toLocaleUpperCase(locale),
    long: new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date),
  };
}

/** "13:30" → "1:30 PM". With `twentyFourHour` (Turkish) the saved "13:30" is shown as it is. */
export function formatExamTime(time: string, twentyFourHour = false) {
  if (!isTimeValue(time) || time === '') return '';
  if (twentyFourHour) return time;
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  const period = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12}:${minute} ${period}`;
}

// ---------- sorting and grouping ----------

function compareUpcoming(a: Exam, b: Exam) {
  return (
    a.date.localeCompare(b.date) ||
    (a.time || '99:99').localeCompare(b.time || '99:99') ||
    a.title.localeCompare(b.title)
  );
}

/**
 * Upcoming = today or later, soonest first.
 * Past = before today, most recent first.
 */
export function splitExams(exams: readonly Exam[], today: string) {
  const upcoming = exams.filter((exam) => exam.date >= today).sort(compareUpcoming);
  const past = exams.filter((exam) => exam.date < today).sort((a, b) => compareUpcoming(b, a));
  return { upcoming, past };
}

export function summarizeUpcoming(upcoming: readonly Exam[], today: string) {
  const inNextDays = (limit: number) =>
    upcoming.filter((exam) => {
      const days = daysBetween(today, exam.date);
      return days >= 0 && days <= limit;
    }).length;
  return { next: upcoming[0] ?? null, thisWeek: inNextDays(6), nextMonth: inNextDays(29), total: upcoming.length };
}

// ---------- checking what students type ----------

export function validateExamDraft(draft: ExamDraft) {
  const errors: string[] = [];
  if (!(EXAM_SUBJECTS as readonly string[]).includes(draft.subject)) errors.push('Choose a subject.');
  if (!(EXAM_GRADES as readonly string[]).includes(draft.grade)) errors.push('Choose a grade from 9 to 12.');
  if (!draft.title.trim()) errors.push('Write the exam title, for example “Unit 3 test”.');
  if (draft.title.trim().length > EXAM_LIMITS.title)
    errors.push(`Keep the exam title under ${EXAM_LIMITS.title} characters.`);
  if (!draft.date) errors.push('Choose the exam date.');
  else if (!isDateKey(draft.date)) errors.push('Choose a real date from the calendar.');
  else {
    const year = Number(draft.date.slice(0, 4));
    if (year < MIN_YEAR || year > MAX_YEAR) errors.push(`Choose a date between ${MIN_YEAR} and ${MAX_YEAR}.`);
  }
  if (!isTimeValue(draft.time)) errors.push('Choose a valid time, or leave the time empty.');
  if (draft.notes.trim().length > EXAM_LIMITS.notes)
    errors.push(`Keep “what it covers” under ${EXAM_LIMITS.notes} characters.`);
  return errors;
}

export function draftToExam(draft: ExamDraft, id: string, createdAt: string): Exam {
  return {
    id,
    subject: draft.subject as ExamSubject,
    grade: draft.grade as ExamGrade,
    title: draft.title.trim(),
    date: draft.date,
    time: draft.time,
    notes: draft.notes.trim(),
    createdAt,
  };
}

/** Three example exams around today, so a new student can see how the calendar works. */
export function createExampleExams(today: string, now = new Date().toISOString()): Exam[] {
  const examples: Array<Omit<Exam, 'id' | 'createdAt'>> = [
    { subject: 'Biology', grade: '9', title: 'Cell structure quiz', date: addDays(today, 1), time: '09:00', notes: 'Organelles and their jobs' },
    { subject: 'Algebra I', grade: '9', title: 'Linear equations test', date: addDays(today, 5), time: '10:30', notes: 'Solving equations, slope, graphs' },
    { subject: 'World History', grade: '9', title: 'Causes of World War I essay', date: addDays(today, 12), time: '', notes: 'Outline the main causes with evidence' },
  ];
  return examples.map((exam) => ({ ...exam, id: createExamId(), createdAt: now }));
}

// ---------- reading saved data safely ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExam(value: unknown): value is Exam {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    (EXAM_SUBJECTS as readonly unknown[]).includes(value.subject) &&
    (EXAM_GRADES as readonly unknown[]).includes(value.grade) &&
    typeof value.title === 'string' &&
    isDateKey(value.date) &&
    isTimeValue(value.time) &&
    typeof value.notes === 'string' &&
    typeof value.createdAt === 'string'
  );
}

export function isSavedExamCalendarData(value: unknown): value is ExamCalendarData {
  return isRecord(value) && value.version === 1 && Array.isArray(value.exams) && value.exams.every(isExam);
}
