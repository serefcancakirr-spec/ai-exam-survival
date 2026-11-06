// Month view for the Exam Calendar: which days to draw and which exams sit on each day.
// Weeks start on Monday, as on school timetables in Türkiye and most of Europe.

import { parseDateKey, toDateKey, type Exam } from './exam-calendar-model';

export type MonthRef = { year: number; month: number }; // month: 0 = January … 11 = December

export type MonthDay = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function monthOf(dateKey: string): MonthRef {
  const date = parseDateKey(dateKey) ?? new Date();
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function shiftMonth(ref: MonthRef, delta: number): MonthRef {
  const date = new Date(ref.year, ref.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

export function sameMonth(a: MonthRef, b: MonthRef) {
  return a.year === b.year && a.month === b.month;
}

export function daysInMonth(ref: MonthRef) {
  return new Date(ref.year, ref.month + 1, 0).getDate();
}

/** Monday = 0 … Sunday = 6 */
function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7;
}

/**
 * The weeks to draw for a month: starts on the Monday on or before the 1st,
 * ends on the Sunday on or after the last day (4–6 rows).
 */
export function buildMonthGrid(ref: MonthRef): MonthDay[][] {
  const first = new Date(ref.year, ref.month, 1);
  const start = new Date(ref.year, ref.month, 1 - mondayIndex(first));
  const total = mondayIndex(first) + daysInMonth(ref);
  const weekCount = Math.ceil(total / 7);
  const weeks: MonthDay[][] = [];
  for (let week = 0; week < weekCount; week += 1) {
    const days: MonthDay[] = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + weekday);
      days.push({ dateKey: toDateKey(date), day: date.getDate(), inMonth: date.getMonth() === ref.month });
    }
    weeks.push(days);
  }
  return weeks;
}

export function formatMonthLabel(ref: MonthRef, locale = 'en') {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(ref.year, ref.month, 1));
}

/** Exams grouped by date, each day sorted by time then title. */
export function groupExamsByDate(exams: readonly Exam[]) {
  const map = new Map<string, Exam[]>();
  exams.forEach((exam) => {
    const list = map.get(exam.date) ?? [];
    list.push(exam);
    map.set(exam.date, list);
  });
  map.forEach((list) =>
    list.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99') || a.title.localeCompare(b.title)),
  );
  return map;
}

/** How many exams fall inside the given month. */
export function countExamsInMonth(exams: readonly Exam[], ref: MonthRef) {
  const prefix = `${ref.year}-${String(ref.month + 1).padStart(2, '0')}-`;
  return exams.filter((exam) => exam.date.startsWith(prefix)).length;
}
