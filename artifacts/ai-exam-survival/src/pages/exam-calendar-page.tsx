import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  ListChecks,
  Pencil,
  Plus,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { Link } from 'wouter';
import { FooterAboutLink } from './about-page';
import {
  EXAM_CALENDAR_STORAGE_KEY,
  EXAM_GRADES,
  EXAM_LIMITS,
  EXAM_SUBJECTS,
  createExamId,
  createExampleExams,
  createInitialExamCalendarData,
  draftToExam,
  formatExamDate,
  formatExamTime,
  getCountdown,
  getTodayKey,
  isSavedExamCalendarData,
  splitExams,
  summarizeUpcoming,
  validateExamDraft,
  type CountdownTone,
  type Exam,
  type ExamCalendarData,
  type ExamDraft,
} from './exam-calendar-model';
import { monthOf, shiftMonth, type MonthRef } from './exam-calendar-month';
import ExamMonthView from './exam-month-view';
import ExamPrepPanel from './exam-prep-panel';
import {
  EXAM_PREP_STORAGE_KEY,
  STUDY_PLANNER_KEY_READ_ONLY,
  createInitialExamPrepData,
  createStep,
  isSavedExamPrepData,
  prepProgress,
  readPlannerData,
  removeStepsForExam,
  stepsForExam,
  summarizePlannerForExam,
  toggleStep,
  type ExamPrepData,
  type PrepStep,
  type StepDraft,
} from './exam-prep-model';
import type { StudyPlannerData } from './study-planner-model';
import { Menti } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';

// ---------- shared styles (match the other tools) ----------

const inputClassName =
  'mt-2 w-full rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 py-3 text-[13px] text-[#3f4e5d] outline-none transition placeholder:text-[#abb1b8] focus:border-[#84a0c0] focus:ring-2 focus:ring-[#84a0c0]/10';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#54769d] px-5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#527195] disabled:cursor-not-allowed disabled:opacity-45';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[12px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]';
const smallButton =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3 text-[11px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]';
const dangerSmallButton =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[6px] bg-[#a35b5b] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[#8a4a4a]';

const TONE_STYLES: Record<CountdownTone, { tile: string; pill: string }> = {
  today: { tile: 'bg-[#fcf2ef] text-[#8f5847]', pill: 'bg-[#965c4a] text-white' },
  soon: { tile: 'bg-[#fbf1eb] text-[#885e44]', pill: 'bg-[#fbf1eb] text-[#8f5847]' },
  week: { tile: 'bg-[#f1f5f9] text-[#4a688c]', pill: 'bg-[#f1f5f9] text-[#4c6a8c]' },
  later: { tile: 'bg-[#e8f3f0] text-[#396f5f]', pill: 'bg-[#e8f3f0] text-[#396e5e]' },
  past: { tile: 'bg-[#f8f6f3] text-[#60686f]', pill: 'bg-[#f8f6f3] text-[#5f6870]' },
};

const emptyDraft: ExamDraft = { subject: 'Algebra I', grade: '9', title: '', date: '', time: '', notes: '' };

type Notice = { tone: 'success' | 'error' | 'info'; message: string };
type StorageLoadResult = { data: ExamCalendarData; message: string; canPersist: boolean };

function loadExamCalendar(): StorageLoadResult {
  const fresh = createInitialExamCalendarData();
  if (typeof window === 'undefined') return { data: fresh, message: '', canPersist: false };
  try {
    const saved = window.localStorage.getItem(EXAM_CALENDAR_STORAGE_KEY);
    if (!saved) return { data: fresh, message: '', canPersist: true };
    const parsed: unknown = JSON.parse(saved);
    if (!isSavedExamCalendarData(parsed)) {
      return {
        data: fresh,
        message: 'Saved exams could not be read, so they were left untouched. Changes on this visit will not be saved.',
        canPersist: false,
      };
    }
    return { data: parsed, message: '', canPersist: true };
  } catch {
    return {
      data: fresh,
      message: 'This browser blocked saving. Your exams work for this visit but will not be kept.',
      canPersist: false,
    };
  }
}

type PrepLoadResult = { data: ExamPrepData; message: string; canPersist: boolean };

function loadExamPrep(): PrepLoadResult {
  const fresh = createInitialExamPrepData();
  if (typeof window === 'undefined') return { data: fresh, message: '', canPersist: false };
  try {
    const saved = window.localStorage.getItem(EXAM_PREP_STORAGE_KEY);
    if (!saved) return { data: fresh, message: '', canPersist: true };
    const parsed: unknown = JSON.parse(saved);
    if (!isSavedExamPrepData(parsed)) {
      return {
        data: fresh,
        message: 'Saved preparation steps could not be read, so they were left untouched. New steps on this visit will not be saved.',
        canPersist: false,
      };
    }
    return { data: parsed, message: '', canPersist: true };
  } catch {
    return {
      data: fresh,
      message: 'This browser blocked saving. Preparation steps work for this visit but will not be kept.',
      canPersist: false,
    };
  }
}

/** Reads the Study Planner's saved plan. Read only: the calendar never writes to it. */
function readStudyPlanner(): StudyPlannerData | null {
  try {
    return readPlannerData(window.localStorage.getItem(STUDY_PLANNER_KEY_READ_ONLY));
  } catch {
    return null;
  }
}

// ---------- page layout pieces ----------

function CalendarFrame({ children, storageUnavailable }: { children: ReactNode; storageUnavailable: boolean }) {
  const { tx } = useI18n();
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f9f7f4]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[12px] font-bold text-[#4b5966] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {tx('Back to home')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[10px] border border-[#ddd5c6] border-l-[6px] border-l-[#5376a0] bg-[#fbf8f1] px-6 py-8 text-[#2b3a49] sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative flex max-w-[760px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-[#e8eef4] text-[#4b698c] sm:h-14 sm:w-14">
              <CalendarDays size={22} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#8a5a3c]">
                {tx('Know what is coming')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">
                {tx('Exam Calendar')}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#4f5a64] sm:text-[15px]">
                {tx('Add your real exams and see exactly how many days you have left. Past exams move out of the way on their own.')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#5f6870]" data-testid="text-calendar-save-status">
            {storageUnavailable ? tx('Browser saving is unavailable for the calendar') : tx('Your exams stay in this browser')}
          </p>
          <span className="rounded-full bg-[#ebf0f6] px-3 py-1.5 text-[10px] font-bold text-[#506783]">
            {tx('Saved on this device')}
          </span>
        </div>

        <div className="mt-4 space-y-5 sm:space-y-6">{children}</div>
      </main>

      <footer className="border-t border-[#e6e9ec] bg-[#f7f5f1]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#5f6870]">{tx('AI Exam Survival · Exam Calendar')}<FooterAboutLink /></p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#516986] hover:text-[#3e5977]"
            data-testid="link-footer-home"
          >
            <ArrowLeft size={13} /> {tx('Return to the homepage')}
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  children,
  trailing,
  testId,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
  testId?: string;
}) {
  return (
    <section
      className="min-w-0 rounded-[10px] border border-[#ddd5c6] bg-[#fffdf8] p-5 sm:p-6"
      data-testid={testId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#4b698c]">{eyebrow}</p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.015em] text-[#364656] sm:text-[22px]">
            {title}
          </h2>
        </div>
        {trailing}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function NoticeBanner({ notice }: { notice: Notice }) {
  const { phrase } = useI18n();
  const styles = {
    success: 'border-[#d3e5de] bg-[#f8f6f3] text-[#366b58]',
    error: 'border-[#ebd6d6] bg-[#fef7f7] text-[#865454]',
    info: 'border-[#dbe4ee] bg-[#f7f9fc] text-[#506986]',
  };
  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      aria-live="polite"
      className={`rounded-[13px] border px-4 py-3 text-[12px] font-bold leading-relaxed ${styles[notice.tone]}`}
      data-testid={`calendar-notice-${notice.tone}`}
    >
      {phrase(notice.message)}
    </div>
  );
}

function ExamForm({
  draft,
  errors,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  idPrefix,
}: {
  draft: ExamDraft;
  errors: string[];
  onChange: (patch: Partial<ExamDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
  idPrefix: string;
}) {
  const { t, tx, phrase, subject: subjectLabel, lang, locale } = useI18n();
  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[10px] border border-[#eaedf0] bg-[#fcfdfd] p-4" data-testid={`form-${idPrefix}`}>
      {errors.length > 0 && (
        <div role="alert" className="mb-3 rounded-[8px] border border-[#ebd6d6] bg-[#fef7f7] px-4 py-3 text-[12px] leading-relaxed text-[#865454]">
          <p className="font-bold">{tx('Check these details:')}</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {errors.map((error) => (
              <li key={error}>{phrase(error)}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor={`${idPrefix}-subject`}>
          {tx('Subject')}
          <select
            id={`${idPrefix}-subject`}
            value={draft.subject}
            onChange={(event) => onChange({ subject: event.currentTarget.value })}
            className={inputClassName}
            data-testid={`${idPrefix}-subject`}
          >
            {EXAM_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subjectLabel(subject)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor={`${idPrefix}-grade`}>
          {tx('Grade')}
          <select
            id={`${idPrefix}-grade`}
            value={draft.grade}
            onChange={(event) => onChange({ grade: event.currentTarget.value })}
            className={inputClassName}
            data-testid={`${idPrefix}-grade`}
          >
            {EXAM_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {t('common.grade', { grade })}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966] sm:col-span-2" htmlFor={`${idPrefix}-title`}>
          {tx('Exam title')}
          <input
            id={`${idPrefix}-title`}
            value={draft.title}
            maxLength={EXAM_LIMITS.title}
            onChange={(event) => onChange({ title: event.currentTarget.value })}
            placeholder={tx('For example: Unit 3 test')}
            className={inputClassName}
            data-testid={`${idPrefix}-title`}
          />
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor={`${idPrefix}-date`}>
          {tx('Exam date')}
          <input
            id={`${idPrefix}-date`}
            type="date"
            value={draft.date}
            onChange={(event) => onChange({ date: event.currentTarget.value })}
            className={inputClassName}
            data-testid={`${idPrefix}-date`}
          />
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor={`${idPrefix}-time`}>
          {tx('Start time')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
          <input
            id={`${idPrefix}-time`}
            type="time"
            value={draft.time}
            onChange={(event) => onChange({ time: event.currentTarget.value })}
            className={inputClassName}
            data-testid={`${idPrefix}-time`}
          />
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966] sm:col-span-2" htmlFor={`${idPrefix}-notes`}>
          {tx('What it covers')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
          <textarea
            id={`${idPrefix}-notes`}
            rows={2}
            value={draft.notes}
            maxLength={EXAM_LIMITS.notes}
            onChange={(event) => onChange({ notes: event.currentTarget.value })}
            placeholder={tx('For example: Chapters 4–6, quadratic equations')}
            className={`${inputClassName} resize-y`}
            data-testid={`${idPrefix}-notes`}
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton} data-testid={`${idPrefix}-cancel`}>
          {tx('Cancel')}
        </button>
        <button type="submit" className={primaryButton} data-testid={`${idPrefix}-save`}>
          <Check size={15} /> {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ---------- the page ----------

export default function ExamCalendarPage() {
  const { t, tx, phrase, subject: subjectLabel, lang, locale } = useI18n();
  const [initialLoad] = useState(loadExamCalendar);
  const [data, setData] = useState<ExamCalendarData>(initialLoad.data);
  const [storageMessage, setStorageMessage] = useState(initialLoad.message);
  const canPersist = useRef(initialLoad.canPersist);

  const [today, setToday] = useState(getTodayKey);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [addForm, setAddForm] = useState<{ draft: ExamDraft; errors: string[] } | null>(null);
  const [editing, setEditing] = useState<{ id: string; draft: ExamDraft; errors: string[] } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [pastOpen, setPastOpen] = useState(false);

  const [initialPrep] = useState(loadExamPrep);
  const [prep, setPrep] = useState<ExamPrepData>(initialPrep.data);
  const [prepStorageMessage, setPrepStorageMessage] = useState(initialPrep.message);
  const canPersistPrep = useRef(initialPrep.canPersist);
  const [planner, setPlanner] = useState<StudyPlannerData | null>(() =>
    typeof window === 'undefined' ? null : readStudyPlanner(),
  );
  const [openPrepId, setOpenPrepId] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState<MonthRef>(() => monthOf(getTodayKey()));
  const [selectedDate, setSelectedDate] = useState(getTodayKey);
  const addFormRef = useRef<HTMLDivElement>(null);

  // Save every change in this browser.
  useEffect(() => {
    if (!canPersist.current || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(EXAM_CALENDAR_STORAGE_KEY, JSON.stringify(data));
    } catch {
      canPersist.current = false;
      setStorageMessage('This browser blocked saving. Your exams work for this visit but will not be kept.');
    }
  }, [data]);

  // Save preparation steps under their own key, from the first change onwards
  // (just opening the page does not create a saved record).
  const prepLoaded = useRef(false);
  useEffect(() => {
    if (!prepLoaded.current) {
      prepLoaded.current = true;
      return;
    }
    if (!canPersistPrep.current || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(EXAM_PREP_STORAGE_KEY, JSON.stringify(prep));
    } catch {
      canPersistPrep.current = false;
      setPrepStorageMessage('This browser blocked saving. Preparation steps work for this visit but will not be kept.');
    }
  }, [prep]);

  // Keep "today" correct if the page stays open past midnight or the tablet wakes up,
  // and pick up Study Planner changes made in another tab.
  useEffect(() => {
    const refresh = () => {
      setToday(getTodayKey());
      setPlanner(readStudyPlanner());
    };
    const timer = window.setInterval(refresh, 30_000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const { upcoming, past } = splitExams(data.exams, today);
  const summary = summarizeUpcoming(upcoming, today);

  function openAddForm(date = '') {
    setAddForm({ draft: { ...emptyDraft, date }, errors: [] });
    window.requestAnimationFrame(() => addFormRef.current?.scrollIntoView({ block: 'center' }));
    setEditing(null);
    setConfirmDeleteId(null);
    setNotice(null);
  }

  function describePlacement(date: string) {
    const countdown = getCountdown(date, today);
    return countdown.tone === 'past'
      ? 'This date has already passed, so it is in Past exams.'
      : `Countdown: ${countdown.label.toLowerCase()}.`;
  }

  function saveNewExam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addForm) return;
    const errors = validateExamDraft(addForm.draft);
    if (errors.length > 0) {
      setAddForm({ ...addForm, errors });
      return;
    }
    const exam = draftToExam(addForm.draft, createExamId(), new Date().toISOString());
    setData((current) => ({ ...current, exams: [...current.exams, exam] }));
    if (exam.date < today) setPastOpen(true);
    setAddForm(null);
    setNotice({ tone: 'success', message: `“${exam.title}” added. ${describePlacement(exam.date)}` });
  }

  function beginEdit(exam: Exam) {
    setEditing({
      id: exam.id,
      draft: {
        subject: exam.subject,
        grade: exam.grade,
        title: exam.title,
        date: exam.date,
        time: exam.time,
        notes: exam.notes,
      },
      errors: [],
    });
    setAddForm(null);
    setConfirmDeleteId(null);
    setNotice(null);
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const errors = validateExamDraft(editing.draft);
    if (errors.length > 0) {
      setEditing({ ...editing, errors });
      return;
    }
    const original = data.exams.find((exam) => exam.id === editing.id);
    if (!original) return;
    const updated = draftToExam(editing.draft, original.id, original.createdAt);
    setData((current) => ({
      ...current,
      exams: current.exams.map((exam) => (exam.id === updated.id ? updated : exam)),
    }));
    if (updated.date < today) setPastOpen(true);
    setEditing(null);
    setNotice({ tone: 'success', message: `Exam updated. ${describePlacement(updated.date)}` });
  }

  function deleteExam(id: string) {
    const exam = data.exams.find((item) => item.id === id);
    setData((current) => ({ ...current, exams: current.exams.filter((item) => item.id !== id) }));
    setPrep((current) => removeStepsForExam(current, id));
    if (openPrepId === id) setOpenPrepId(null);
    if (editing?.id === id) setEditing(null);
    setConfirmDeleteId(null);
    setNotice({ tone: 'success', message: exam ? `“${exam.title}” was deleted.` : 'Exam deleted.' });
  }

  function addExamples() {
    // Example exams are new data, so they are written in the language the student is using.
    const examples = createExampleExams(today).map((exam) => ({ ...exam, title: phrase(exam.title), notes: phrase(exam.notes) }));
    setData((current) => ({ ...current, exams: [...current.exams, ...examples] }));
    setNotice({ tone: 'info', message: 'Three example exams were added. Edit or delete them to make the calendar yours.' });
  }

  // ---------- preparation steps ----------

  function progressFor(examId: string) {
    return prepProgress(prep.steps.filter((step) => step.examId === examId));
  }

  function openPrep(exam: Exam) {
    setOpenPrepId(exam.id);
    setEditing(null);
    setConfirmDeleteId(null);
    if (exam.date < today) setPastOpen(true);
    window.requestAnimationFrame(() =>
      document.querySelector(`[data-testid="exam-${exam.id}"]`)?.scrollIntoView({ block: 'start' }),
    );
  }

  function addSteps(examId: string, drafts: StepDraft[], source: PrepStep['source']) {
    if (drafts.length === 0) return;
    const now = new Date().toISOString();
    setPrep((current) => ({ ...current, steps: [...current.steps, ...drafts.map((draft) => createStep(examId, draft, source, now))] }));
  }

  function updateStep(stepId: string, draft: StepDraft) {
    setPrep((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? { ...step, text: draft.text.trim(), dueDate: draft.dueDate } : step)),
    }));
  }

  function toggleStepDone(stepId: string) {
    setPrep((current) => ({
      ...current,
      steps: current.steps.map((step) => (step.id === stepId ? toggleStep(step) : step)),
    }));
  }

  function deleteStep(stepId: string) {
    setPrep((current) => ({ ...current, steps: current.steps.filter((step) => step.id !== stepId) }));
  }

  function changeMonth(delta: number | 'today') {
    if (delta === 'today') {
      setViewMonth(monthOf(today));
      setSelectedDate(today);
    } else {
      setViewMonth((current) => shiftMonth(current, delta));
    }
  }

  function selectDate(dateKey: string) {
    setSelectedDate(dateKey);
    const month = monthOf(dateKey);
    if (month.year !== viewMonth.year || month.month !== viewMonth.month) setViewMonth(month);
  }

  function renderExam(exam: Exam, isPast: boolean) {
    const date = formatExamDate(exam.date, locale ?? 'en');
    const countdown = getCountdown(exam.date, today);
    const time = formatExamTime(exam.time, lang === 'tr');

    if (editing?.id === exam.id) {
      return (
        <li key={exam.id} data-testid={`exam-${exam.id}`}>
          <ExamForm
            draft={editing.draft}
            errors={editing.errors}
            onChange={(patch) => setEditing({ ...editing, draft: { ...editing.draft, ...patch }, errors: [] })}
            onSubmit={saveEdit}
            onCancel={() => setEditing(null)}
            submitLabel={tx('Save exam')}
            idPrefix="edit-exam"
          />
        </li>
      );
    }

    return (
      <li
        key={exam.id}
        className={`rounded-[16px] border p-3.5 sm:p-4 ${isPast ? 'border-[#eef0f2] bg-[#fbfcfd]' : 'border-[#ddd5c6] bg-[#fffdf8]'}`}
        data-testid={`exam-${exam.id}`}
      >
        <article className="flex gap-3 sm:gap-4">
          <div
            className={`flex w-[58px] shrink-0 flex-col items-center justify-center self-start rounded-[13px] py-2 ${TONE_STYLES[countdown.tone].tile}`}
            aria-hidden="true"
          >
            <span className="text-[8px] font-extrabold tracking-[.1em]">{date.weekday}</span>
            <span className="font-display text-[20px] font-extrabold leading-tight tabular-nums">{date.day}</span>
            <span className="text-[8px] font-extrabold tracking-[.1em]">{date.month}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className={`break-words text-[13px] font-extrabold ${isPast ? 'text-[#5e676f]' : 'text-[#3f4e5d]'}`} data-testid="exam-title">
                  {exam.title}
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-[#5d676f]">
                  {subjectLabel(exam.subject)} · {t('common.grade', { grade: exam.grade })}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-extrabold ${TONE_STYLES[countdown.tone].pill}`}
                data-testid="exam-countdown"
              >
                {phrase(countdown.label)}
              </span>
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#5d676f]">
              <span data-testid="exam-date-long">{date.long}</span>
              {time && (
                <span className="inline-flex items-center gap-1" data-testid="exam-time">
                  <Clock3 size={12} /> {time}
                </span>
              )}
            </p>
            {exam.notes && <p className="mt-2 break-words text-[11px] leading-relaxed text-[#5e6973]">{exam.notes}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => (openPrepId === exam.id ? setOpenPrepId(null) : openPrep(exam))}
                aria-expanded={openPrepId === exam.id}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3.5 text-[11px] font-extrabold transition-colors ${
                  openPrepId === exam.id ? 'bg-[#54769d] text-white hover:bg-[#527195]' : 'bg-[#f1f5f9] text-[#4c6a8c] hover:bg-[#e8eef6]'
                }`}
                data-testid={`button-prepare-${exam.id}`}
              >
                <ListChecks size={13} /> {tx('Prepare')}
                {(() => {
                  const progress = progressFor(exam.id);
                  return progress.total > 0 ? (
                    <span className="tabular-nums" data-testid="prepare-progress">
                      · {progress.done}/{progress.total}
                    </span>
                  ) : null;
                })()}
              </button>
              <button
                type="button"
                onClick={() => beginEdit(exam)}
                className={smallButton}
                aria-label={tx('Edit {title}', { title: exam.title })}
                data-testid={`button-edit-exam-${exam.id}`}
              >
                <Pencil size={13} /> {tx('Edit')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDeleteId(exam.id)}
                className={smallButton}
                aria-label={tx('Delete {title}', { title: exam.title })}
                data-testid={`button-delete-exam-${exam.id}`}
              >
                <X size={13} /> {tx('Delete')}
              </button>
            </div>
            {confirmDeleteId === exam.id && (
              <div
                role="alertdialog"
                aria-label={tx('Delete {title}?', { title: exam.title })}
                className="mt-3 flex flex-col gap-3 rounded-[8px] border border-[#ebd6d6] bg-[#fef7f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                data-testid="confirm-delete-exam"
              >
                <p className="text-[12px] font-bold text-[#865454]">
                  {progressFor(exam.id).total === 0
                    ? tx('Delete “{title}”? This cannot be undone.', { title: exam.title })
                    : tx(
                        progressFor(exam.id).total === 1
                          ? 'Delete “{title}” and its {count} preparation step? This cannot be undone.'
                          : 'Delete “{title}” and its {count} preparation steps? This cannot be undone.',
                        { title: exam.title, count: progressFor(exam.id).total },
                      )}
                </p>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setConfirmDeleteId(null)} className={smallButton} data-testid="confirm-delete-exam-cancel">
                    {tx('Cancel')}
                  </button>
                  <button type="button" onClick={() => deleteExam(exam.id)} className={dangerSmallButton} data-testid="confirm-delete-exam-yes">
                    {tx('Delete exam')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </article>
        {openPrepId === exam.id && (
          <ExamPrepPanel
            exam={exam}
            today={today}
            steps={stepsForExam(prep.steps, exam.id)}
            plannerSummary={summarizePlannerForExam(planner, exam)}
            onAddStep={(draft, source) => addSteps(exam.id, [draft], source)}
            onAddSuggestions={(drafts) => addSteps(exam.id, drafts, 'suggested')}
            onUpdateStep={updateStep}
            onToggleStep={toggleStepDone}
            onDeleteStep={deleteStep}
          />
        )}
      </li>
    );
  }

  const nextCountdown = summary.next ? getCountdown(summary.next.date, today) : null;

  return (
    <CalendarFrame storageUnavailable={Boolean(storageMessage)}>
      {storageMessage && (
        <div
          role="alert"
          className="rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] px-4 py-3 text-[12px] leading-relaxed text-[#69502e]"
          data-testid="message-calendar-storage"
        >
          {phrase(storageMessage)}
        </div>
      )}
      {prepStorageMessage && (
        <div
          role="alert"
          className="rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] px-4 py-3 text-[12px] leading-relaxed text-[#69502e]"
          data-testid="message-prep-storage"
        >
          {phrase(prepStorageMessage)}
        </div>
      )}
      {notice && <NoticeBanner notice={notice} />}

      <Panel eyebrow={tx('Month view')} title={tx('Your exam month')} testId="panel-month">
        <ExamMonthView
          exams={data.exams}
          today={today}
          viewMonth={viewMonth}
          selectedDate={selectedDate}
          onSelectDate={selectDate}
          onChangeMonth={changeMonth}
          progressFor={progressFor}
          onOpenPrep={openPrep}
          onAddOnDate={(date) => openAddForm(date)}
        />
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <Panel
          eyebrow={tx('Today · {date}', { date: formatExamDate(today, locale ?? 'en').long })}
          title={tx('Upcoming exams')}
          testId="panel-upcoming"
          trailing={
            <button type="button" onClick={() => openAddForm()} className={primaryButton} data-testid="button-add-exam">
              <Plus size={15} /> {tx('Add exam')}
            </button>
          }
        >
          {addForm && (
            <div className="mb-4 scroll-mt-24" ref={addFormRef}>
              <ExamForm
                draft={addForm.draft}
                errors={addForm.errors}
                onChange={(patch) => setAddForm({ draft: { ...addForm.draft, ...patch }, errors: [] })}
                onSubmit={saveNewExam}
                onCancel={() => setAddForm(null)}
                submitLabel={tx('Add exam')}
                idPrefix="new-exam"
              />
            </div>
          )}

          {upcoming.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-[#dfe3e7] bg-[#fbfcfd] px-5 py-8 text-center" data-testid="upcoming-empty">
              <Menti pose="point" size={76} message={t('menti.calendarEmpty')} testId="menti-calendar" className="mb-1 justify-center" />
              <p className="mt-3 text-[13px] font-bold text-[#4f5a64]">{tx('No upcoming exams.')}</p>
              <p className="mx-auto mt-1 max-w-[380px] text-[11px] leading-relaxed text-[#60686f]">
                {tx('Add your next exam to start the countdown.')}
                {data.exams.length === 0 && ` ${tx('Or add three examples to see how the calendar works.')}`}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button type="button" onClick={() => openAddForm()} className={primaryButton} data-testid="button-add-first-exam">
                  <Plus size={15} /> {tx('Add your first exam')}
                </button>
                {data.exams.length === 0 && (
                  <button type="button" onClick={addExamples} className={secondaryButton} data-testid="button-add-examples">
                    <Sparkles size={15} /> {tx('Add example exams')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ol className="space-y-3" data-testid="list-upcoming">
              {upcoming.map((exam) => renderExam(exam, false))}
            </ol>
          )}

          <div className="mt-5 border-t border-[#eef0f2] pt-4">
            <button
              type="button"
              onClick={() => setPastOpen((open) => !open)}
              aria-expanded={pastOpen}
              aria-controls="past-exams"
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-[8px] px-1 text-left"
              data-testid="button-toggle-past"
            >
              <span className="text-[12px] font-extrabold text-[#4b5966]">
                {tx('Past exams')} <span className="font-semibold text-[#60686f]" data-testid="text-past-count">({past.length})</span>
              </span>
              <ChevronDown
                size={17}
                className={`text-[#5f6870] transition-transform motion-reduce:transition-none ${pastOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {pastOpen && (
              <div id="past-exams" className="mt-3">
                {past.length === 0 ? (
                  <p className="text-[11px] text-[#60686f]" data-testid="past-empty">
                    {tx('Exams move here automatically the day after they happen.')}
                  </p>
                ) : (
                  <ol className="space-y-3" data-testid="list-past">
                    {past.map((exam) => renderExam(exam, true))}
                  </ol>
                )}
              </div>
            )}
          </div>
        </Panel>

        <div className="grid content-start gap-5">
          <Panel eyebrow={tx('Next up')} title={summary.next ? summary.next.title : tx('Nothing scheduled')} testId="panel-next">
            {summary.next && nextCountdown ? (
              <div>
                <p className="font-display text-[34px] font-extrabold leading-none tracking-[-.015em] text-[#4c6a8c]" data-testid="next-countdown">
                  {phrase(nextCountdown.label)}
                </p>
                <p className="mt-2 text-[11px] font-semibold text-[#5d676f]">
                  {subjectLabel(summary.next.subject)} · {t('common.grade', { grade: summary.next.grade })} ·{' '}
                  {formatExamDate(summary.next.date, locale ?? 'en').long}
                  {summary.next.time ? ` · ${formatExamTime(summary.next.time, lang === 'tr')}` : ''}
                </p>
              </div>
            ) : (
              <p className="text-[12px] leading-relaxed text-[#5f6870]">{tx('Add an exam to see your next countdown here.')}</p>
            )}
            <dl className="mt-5 grid grid-cols-3 gap-2">
              {[
                { label: 'Next 7 days', value: summary.thisWeek, id: 'week' },
                { label: 'Next 30 days', value: summary.nextMonth, id: 'month' },
                { label: 'Upcoming', value: summary.total, id: 'total' },
              ].map((item) => (
                <div key={item.id} className="rounded-[8px] border border-[#eef0f2] px-3 py-2.5" data-testid={`stat-${item.id}`}>
                  <dt className="text-[10px] font-bold text-[#5f6870]">{tx(item.label)}</dt>
                  <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.015em] text-[#364656] tabular-nums">
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel eyebrow={tx('Keep it manageable')} title={tx('One step per exam')}>
            <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#f1f5f9] text-[#4a688c]">
              <Target size={20} />
            </div>
            <p className="mt-4 text-[12px] leading-[1.75] text-[#60676f]">
              {tx('Look at the next exam and pick one small preparation step for today: review flashcards for 20 minutes, or take a short practice quiz. Small steps every day beat one long night before.')}
            </p>
          </Panel>
        </div>
      </div>
    </CalendarFrame>
  );
}
