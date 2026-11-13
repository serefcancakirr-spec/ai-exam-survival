// Stage 22A: YKS exam mode (TYT) – rules without screen code, so they can be tested on their own.
// Net = correct − wrong ÷ 4. No scores, rankings or university estimates (teacher's rule).
// Saved in this browser only, under one key (teacher approved): the last 20 results and the exam in progress.

import { SECTION_OF, TYT_BY_ID, TYT_LETTERS, TYT_QUESTIONS, type TytLetter, type TytQuestion, type TytSection, type TytSubject } from './tyt-bank';

export const EXAM_STORAGE_KEY = 'ai-exam-survival:exam-mode:v1';
export const MAX_SAVED_EXAMS = 20;

export type ExamKind = 'tyt-mini' | 'tyt-full';
export const SECTION_ORDER: TytSection[] = ['turkce', 'sosyal', 'matematik', 'fen'];
const SUBJECT_ORDER: TytSubject[] = ['turkce', 'tarih', 'cografya', 'felsefe', 'din', 'matematik', 'fizik', 'kimya', 'biyoloji'];

/** Real TYT: 120 questions, 165 minutes. The mini exam keeps the proportions and the time per question. */
export const EXAM_PLAN: Record<ExamKind, { questions: number; minutes: number; perSubject: Record<TytSubject, number> }> = {
  'tyt-full': {
    questions: 120,
    minutes: 165,
    perSubject: { turkce: 40, tarih: 5, cografya: 5, felsefe: 5, din: 5, matematik: 40, fizik: 7, kimya: 7, biyoloji: 6 },
  },
  'tyt-mini': {
    questions: 30,
    minutes: 41,
    // Sosyal 5 and Fen 5: one subject gets the extra question, taking turns from exam to exam (see buildExam)
    perSubject: { turkce: 10, tarih: 1, cografya: 1, felsefe: 1, din: 1, matematik: 10, fizik: 2, kimya: 2, biyoloji: 1 },
  },
};

export type RunningExam = {
  id: string;
  kind: ExamKind;
  questionIds: string[];
  answers: Record<string, TytLetter>;
  startedAt: string;
  endsAt: string;
  currentIndex: number;
};

export type SectionResult = { section: TytSection; total: number; correct: number; wrong: number; blank: number; net: number };

export type ExamResult = {
  id: string;
  kind: ExamKind;
  questionIds: string[];
  answers: Record<string, TytLetter>;
  startedAt: string;
  finishedAt: string;
  timedOut: boolean;
  sections: SectionResult[];
  totalNet: number;
};

export type ExamData = { version: 1; results: ExamResult[]; current: RunningExam | null };

export const emptyExamData = (): ExamData => ({ version: 1, results: [], current: null });

// ---------- building an exam ----------

const POOL: Record<TytSubject, TytQuestion[]> = Object.fromEntries(
  SUBJECT_ORDER.map((subject) => [subject, TYT_QUESTIONS.filter((q) => q.subject === subject)]),
) as Record<TytSubject, TytQuestion[]>;

/**
 * The questions of a new exam, in the real TYT order (Türkçe, Sosyal, Temel Matematik, Fen).
 * `round` = how many exams of this kind were taken before: each mini exam starts where the last one stopped,
 * so a student sees every question before any repeats.
 */
export function buildExam(kind: ExamKind, round: number): string[] {
  const counts = { ...EXAM_PLAN[kind].perSubject };
  if (kind === 'tyt-mini') {
    // Sosyal 5 = 1 each + 1 extra; Fen 5 = 2 + 2 + 1, the single one taking turns
    counts[(['tarih', 'cografya', 'felsefe', 'din'] as const)[round % 4]] += 1;
    const fen = [
      { fizik: 2, kimya: 2, biyoloji: 1 },
      { fizik: 2, kimya: 1, biyoloji: 2 },
      { fizik: 1, kimya: 2, biyoloji: 2 },
    ][round % 3];
    Object.assign(counts, fen);
  }
  const ids: string[] = [];
  for (const subject of SUBJECT_ORDER) {
    const pool = POOL[subject];
    const need = counts[subject];
    if (need >= pool.length) {
      ids.push(...pool.map((q) => q.id));
      continue;
    }
    const start = (round * need) % pool.length;
    for (let i = 0; i < need; i += 1) ids.push(pool[(start + i) % pool.length].id);
  }
  return ids;
}

export function startExam(kind: ExamKind, round: number, now = new Date()): RunningExam {
  return {
    id: `exam-${now.getTime().toString(36)}`,
    kind,
    questionIds: buildExam(kind, round),
    answers: {},
    startedAt: now.toISOString(),
    endsAt: new Date(now.getTime() + EXAM_PLAN[kind].minutes * 60_000).toISOString(),
    currentIndex: 0,
  };
}

/** Seconds left; the clock decides, so the time stays right when the tablet sleeps or the page reloads. */
export function secondsLeft(exam: Pick<RunningExam, 'endsAt'>, now = new Date()) {
  return Math.max(0, Math.ceil((new Date(exam.endsAt).getTime() - now.getTime()) / 1000));
}

export function formatClock(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const two = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

// ---------- results ----------

export const net = (correct: number, wrong: number) => Math.round((correct - wrong / 4) * 100) / 100;

export function scoreExam(exam: RunningExam, now = new Date(), timedOut = false): ExamResult {
  const sections: SectionResult[] = SECTION_ORDER.map((section) => ({ section, total: 0, correct: 0, wrong: 0, blank: 0, net: 0 }));
  for (const id of exam.questionIds) {
    const question = TYT_BY_ID.get(id);
    if (!question) continue;
    const row = sections.find((s) => s.section === SECTION_OF[question.subject])!;
    row.total += 1;
    const chosen = exam.answers[id];
    if (!chosen) row.blank += 1;
    else if (chosen === question.answer) row.correct += 1;
    else row.wrong += 1;
  }
  for (const row of sections) row.net = net(row.correct, row.wrong);
  const used = sections.filter((s) => s.total > 0);
  return {
    id: exam.id,
    kind: exam.kind,
    questionIds: exam.questionIds,
    answers: exam.answers,
    startedAt: exam.startedAt,
    finishedAt: now.toISOString(),
    timedOut,
    sections: used,
    totalNet: net(used.reduce((n, s) => n + s.correct, 0), used.reduce((n, s) => n + s.wrong, 0)),
  };
}

/** Newest first, at most 20; the exam in progress is cleared. */
export function addResult(data: ExamData, result: ExamResult): ExamData {
  return { version: 1, results: [result, ...data.results.filter((r) => r.id !== result.id)].slice(0, MAX_SAVED_EXAMS), current: null };
}

export function roundFor(data: ExamData, kind: ExamKind) {
  return data.results.filter((r) => r.kind === kind).length;
}

// ---------- reading saved data (never trust it blindly) ----------

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isKind = (v: unknown): v is ExamKind => v === 'tyt-mini' || v === 'tyt-full';
const isDate = (v: unknown) => typeof v === 'string' && !Number.isNaN(Date.parse(v));
const isIds = (v: unknown): v is string[] => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string');
const isAnswers = (v: unknown): v is Record<string, TytLetter> =>
  isRecord(v) && Object.values(v).every((x) => (TYT_LETTERS as unknown[]).includes(x));

function isSection(v: unknown): v is SectionResult {
  return (
    isRecord(v) &&
    (SECTION_ORDER as unknown[]).includes(v.section) &&
    ['total', 'correct', 'wrong', 'blank', 'net'].every((k) => typeof v[k] === 'number' && Number.isFinite(v[k] as number))
  );
}

export function isExamResult(v: unknown): v is ExamResult {
  return (
    isRecord(v) && typeof v.id === 'string' && isKind(v.kind) && isIds(v.questionIds) && isAnswers(v.answers) &&
    isDate(v.startedAt) && isDate(v.finishedAt) && typeof v.timedOut === 'boolean' &&
    Array.isArray(v.sections) && v.sections.length > 0 && v.sections.every(isSection) &&
    typeof v.totalNet === 'number' && Number.isFinite(v.totalNet)
  );
}

export function isRunningExam(v: unknown): v is RunningExam {
  return (
    isRecord(v) && typeof v.id === 'string' && isKind(v.kind) && isIds(v.questionIds) && isAnswers(v.answers) &&
    isDate(v.startedAt) && isDate(v.endsAt) && typeof v.currentIndex === 'number' &&
    Number.isInteger(v.currentIndex) && v.currentIndex >= 0 && v.currentIndex < v.questionIds.length
  );
}

export function isExamData(v: unknown): v is ExamData {
  return (
    isRecord(v) && v.version === 1 && Array.isArray(v.results) && v.results.length <= MAX_SAVED_EXAMS &&
    v.results.every(isExamResult) && (v.current === null || isRunningExam(v.current))
  );
}

/** canSave is false when something is saved that this version cannot read: then nothing is overwritten. */
export function readExamData(raw: string | null): { data: ExamData; canSave: boolean } {
  if (raw === null) return { data: emptyExamData(), canSave: true };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isExamData(parsed)) return { data: parsed, canSave: true };
  } catch {
    // fall through
  }
  return { data: emptyExamData(), canSave: false };
}
