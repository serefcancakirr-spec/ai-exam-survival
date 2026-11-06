// Preparation steps for exams: data, suggestions, progress and saving.
// Steps are linked to an exam by its id, so they follow the exam if its date changes.
// This file has no screen code, so its rules can be tested on their own.

import { addDays, daysBetween, isDateKey, type Exam } from './exam-calendar-model';
import { isSavedStudyPlannerData, type StudyPlannerData } from './study-planner-model';

export const EXAM_PREP_STORAGE_KEY = 'ai-exam-survival:exam-prep:v1';
/** Read only: the Study Planner's own saved data. This file never writes to it. */
export const STUDY_PLANNER_KEY_READ_ONLY = 'ai-exam-survival:study-planner:v1';

export const STEP_TEXT_LIMIT = 120;

export type PrepStep = {
  id: string;
  examId: string;
  text: string;
  dueDate: string; // YYYY-MM-DD or ''
  done: boolean;
  source: 'suggested' | 'own';
  createdAt: string;
  completedAt: string | null;
};

export type ExamPrepData = { version: 1; steps: PrepStep[] };

export type StepDraft = { text: string; dueDate: string };
export type Suggestion = { text: string; dueDate: string };

export function createInitialExamPrepData(): ExamPrepData {
  return { version: 1, steps: [] };
}

export function createStepId() {
  return `step-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------- suggestions based on time left ----------

type Template = { text: (subject: string) => string; daysBefore: number };

const TODAY_TEMPLATES: Template[] = [
  { text: () => 'Quick 10-minute review of your key notes', daysBefore: 0 },
  { text: () => 'Pack what you need: pens, calculator, water', daysBefore: 0 },
  { text: () => 'Take three slow breaths before you start', daysBefore: 0 },
];

const SOON_TEMPLATES: Template[] = [
  { text: (s) => `Review your ${s} flashcards for 20 minutes`, daysBefore: 2 },
  { text: (s) => `Take one short ${s} practice quiz`, daysBefore: 2 },
  { text: () => 'Re-read your summary notes and mark weak spots', daysBefore: 1 },
  { text: () => 'Prepare your materials and sleep early', daysBefore: 1 },
];

const WEEK_TEMPLATES: Template[] = [
  { text: () => 'List every topic the exam covers', daysBefore: 7 },
  { text: (s) => `Make or review ${s} flashcards for each topic`, daysBefore: 5 },
  { text: (s) => `Take a practice quiz in ${s} and note your mistakes`, daysBefore: 3 },
  { text: () => 'Review the topics you got wrong', daysBefore: 2 },
  { text: () => 'Final quick review the day before', daysBefore: 1 },
];

const LATER_TEMPLATES: Template[] = [
  { text: () => 'List every topic the exam covers', daysBefore: 14 },
  { text: (s) => `Plan ${s} study sessions in the Study Planner`, daysBefore: 13 },
  { text: (s) => `Make ${s} flashcards for key terms`, daysBefore: 10 },
  { text: () => 'Study one topic per session and tick it off', daysBefore: 8 },
  { text: (s) => `Take a practice quiz in ${s} one week before`, daysBefore: 7 },
  { text: () => 'Review the topics you found hardest', daysBefore: 3 },
  { text: () => 'Final quick review the day before', daysBefore: 1 },
];

export type TimeBand = 'past' | 'today' | 'soon' | 'week' | 'later';

export function getTimeBand(examDate: string, today: string): TimeBand {
  const days = daysBetween(today, examDate);
  if (days < 0) return 'past';
  if (days === 0) return 'today';
  if (days <= 2) return 'soon';
  if (days <= 7) return 'week';
  return 'later';
}

/**
 * Suggested steps depend on how much time is left. Each suggestion has a due date
 * counted back from the exam, never earlier than today and never after the exam.
 */
export function suggestPrepSteps(exam: Pick<Exam, 'subject' | 'date'>, today: string): Suggestion[] {
  const band = getTimeBand(exam.date, today);
  const templates =
    band === 'today' ? TODAY_TEMPLATES : band === 'soon' ? SOON_TEMPLATES : band === 'week' ? WEEK_TEMPLATES : band === 'later' ? LATER_TEMPLATES : [];
  const subject = exam.subject === 'Other' ? 'subject' : exam.subject;
  return templates.map((template) => {
    const due = addDays(exam.date, -template.daysBefore);
    return { text: template.text(subject), dueDate: due < today ? today : due };
  });
}

export function isSuggestionAdded(steps: readonly PrepStep[], examId: string, text: string) {
  const wanted = text.trim().toLowerCase();
  return steps.some((step) => step.examId === examId && step.text.trim().toLowerCase() === wanted);
}

// ---------- steps ----------

export function validateStepDraft(draft: StepDraft) {
  const errors: string[] = [];
  if (!draft.text.trim()) errors.push('Write what you will do, for example “Review chapter 4”.');
  if (draft.text.trim().length > STEP_TEXT_LIMIT) errors.push(`Keep the step under ${STEP_TEXT_LIMIT} characters.`);
  if (draft.dueDate && !isDateKey(draft.dueDate)) errors.push('Choose a real due date, or leave it empty.');
  return errors;
}

export function createStep(examId: string, draft: StepDraft, source: PrepStep['source'], now = new Date().toISOString()): PrepStep {
  return {
    id: createStepId(),
    examId,
    text: draft.text.trim(),
    dueDate: draft.dueDate,
    done: false,
    source,
    createdAt: now,
    completedAt: null,
  };
}

/** Steps for one exam: by due date (no date last), then in the order they were added. */
export function stepsForExam(steps: readonly PrepStep[], examId: string) {
  return steps
    .filter((step) => step.examId === examId)
    .sort(
      (a, b) =>
        (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31') || a.createdAt.localeCompare(b.createdAt),
    );
}

export function prepProgress(steps: readonly PrepStep[]) {
  const total = steps.length;
  const done = steps.filter((step) => step.done).length;
  return { done, total, percent: total === 0 ? 0 : Math.round((done / total) * 100) };
}

export function toggleStep(step: PrepStep, now = new Date().toISOString()): PrepStep {
  return step.done ? { ...step, done: false, completedAt: null } : { ...step, done: true, completedAt: now };
}

export function getDueLabel(step: Pick<PrepStep, 'dueDate' | 'done'>, today: string) {
  if (!step.dueDate) return '';
  const days = daysBetween(today, step.dueDate);
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `Due in ${days} days`;
  if (step.done) return '';
  return days === -1 ? 'Overdue by 1 day' : `Overdue by ${Math.abs(days)} days`;
}

/** Removes the steps of an exam (used when the exam is deleted). */
export function removeStepsForExam(data: ExamPrepData, examId: string): ExamPrepData {
  return { ...data, steps: data.steps.filter((step) => step.examId !== examId) };
}

/** Steps whose exam no longer exists (for example deleted on another visit). */
export function findOrphanSteps(data: ExamPrepData, examIds: ReadonlySet<string>) {
  return data.steps.filter((step) => !examIds.has(step.examId));
}

// ---------- Study Planner link (read only) ----------

export type PlannerSummary =
  | { status: 'no-plan' }
  | { status: 'no-sessions' }
  | { status: 'sessions'; planned: number; completed: number; remaining: number };

/** Parses the Study Planner's saved text. Returns null when there is no readable plan. */
export function readPlannerData(raw: string | null): StudyPlannerData | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isSavedStudyPlannerData(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Study sessions in the Planner for the exam's subject, on or before the exam date. */
export function summarizePlannerForExam(planner: StudyPlannerData | null, exam: Pick<Exam, 'subject' | 'date'>): PlannerSummary {
  if (!planner || planner.tasks.length === 0) return { status: 'no-plan' };
  const sessions = planner.tasks.filter(
    (task) => task.kind === 'study' && task.subject === exam.subject && task.date <= exam.date,
  );
  if (sessions.length === 0) return { status: 'no-sessions' };
  const completed = sessions.filter((task) => task.completed).length;
  return { status: 'sessions', planned: sessions.length, completed, remaining: sessions.length - completed };
}

// ---------- reading saved data safely ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStep(value: unknown): value is PrepStep {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.examId === 'string' &&
    typeof value.text === 'string' &&
    (value.dueDate === '' || isDateKey(value.dueDate)) &&
    typeof value.done === 'boolean' &&
    (value.source === 'suggested' || value.source === 'own') &&
    typeof value.createdAt === 'string' &&
    (value.completedAt === null || typeof value.completedAt === 'string')
  );
}

export function isSavedExamPrepData(value: unknown): value is ExamPrepData {
  return isRecord(value) && value.version === 1 && Array.isArray(value.steps) && value.steps.every(isStep);
}
