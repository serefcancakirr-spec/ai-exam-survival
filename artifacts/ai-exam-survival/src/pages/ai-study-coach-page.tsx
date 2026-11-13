import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Clipboard, Lightbulb, RotateCcw, Sparkles, Target } from 'lucide-react';
import { Link } from 'wouter';
import { FooterAboutLink } from './about-page';
import { formatExamDate, getCountdown, getTodayKey } from './exam-calendar-model';
import {
  COACH_DIFFICULTIES,
  COACH_PROBLEMS,
  COACH_SUBJECTS,
  DIFFICULTY_LABELS,
  PROBLEM_LABELS,
  SUBJECT_GUIDES,
  type CoachSubject,
} from './study-coach-content';
import {
  COACH_GRADES,
  EXAM_CALENDAR_KEY_READ_ONLY,
  STUDY_COACH_STORAGE_KEY,
  TOPIC_LIMIT,
  buildCoachPlan,
  createExampleRequest,
  isSavedStudyCoachData,
  readUpcomingCalendarExams,
  requestFromExam,
  validateCoachRequest,
  type CoachRequest,
  type StudyCoachData,
} from './study-coach-model';
import { Menti, MentiArt } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';

// ---------- shared styles (match the other tools) ----------

const inputClassName =
  'mt-2 w-full rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 py-3 text-[13px] text-[#3f4e5d] outline-none transition placeholder:text-[#abb1b8] focus:border-[#84a0c0] focus:ring-2 focus:ring-[#84a0c0]/10';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#54769d] px-5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#527195]';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[12px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]';

const blankRequest: CoachRequest = { grade: '9', subject: 'English', topic: '', difficulty: 'somewhat-hard', problem: 'none', examDate: '' };

type LoadResult = { request: CoachRequest; isExample: boolean; message: string; canPersist: boolean; notice: string };

function loadCoach(today: string, phrase: (text: string) => string = (text) => text): LoadResult {
  // The example is new text, so its topic is shown in the language the student is using.
  const exampleRequest = createExampleRequest(today);
  const example = { ...exampleRequest, topic: phrase(exampleRequest.topic) };
  if (typeof window === 'undefined') return { request: example, isExample: true, message: '', canPersist: false, notice: '' };
  try {
    const saved = window.localStorage.getItem(STUDY_COACH_STORAGE_KEY);
    if (!saved) return { request: example, isExample: true, message: '', canPersist: true, notice: '' };
    const parsed: unknown = JSON.parse(saved);
    if (!isSavedStudyCoachData(parsed)) {
      return {
        request: example,
        isExample: true,
        message: 'Your last coaching request could not be read, so it was left untouched. New requests on this visit will not be saved.',
        canPersist: false,
        notice: '',
      };
    }
    if (!parsed.request || validateCoachRequest({ ...parsed.request, examDate: '' }, today).length > 0) {
      return { request: example, isExample: true, message: '', canPersist: true, notice: '' };
    }
    if (parsed.request.examDate && parsed.request.examDate < today) {
      return {
        request: { ...parsed.request, examDate: '' },
        isExample: false,
        message: '',
        canPersist: true,
        notice: 'The exam date from your last visit has passed, so it was cleared. Add a new date for an updated plan.',
      };
    }
    return { request: parsed.request, isExample: false, message: '', canPersist: true, notice: '' };
  } catch {
    return {
      request: example,
      isExample: true,
      message: 'This browser blocked saving. The coach works for this visit but will not remember your request.',
      canPersist: false,
      notice: '',
    };
  }
}

function readCalendarRaw() {
  try {
    return window.localStorage.getItem(EXAM_CALENDAR_KEY_READ_ONLY);
  } catch {
    return null;
  }
}

// ---------- page layout pieces ----------

function CoachFrame({ children }: { children: ReactNode }) {
  const { t, tx } = useI18n();
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
          <Menti
            pose="think"
            size={128}
            bubble="left"
            message={t('menti.coach')}
            testId="menti-coach"
            className="absolute bottom-6 right-8 z-10 hidden lg:flex"
          />
          <div className="relative flex max-w-[760px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[#e8eef4] p-1 sm:h-14 sm:w-14 lg:hidden" data-testid="menti-coach-face">
              <MentiArt pose="think" faceOnly title={t('menti.label')} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#8a5a3c]">
                {tx('A supportive place to get unstuck')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">
                {tx('AI Study Coach')}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#4f5a64] sm:text-[15px]">
                {tx('Tell the coach your grade, subject, topic and exam date. You get a short, practical study plan with strategies that fit how hard the topic feels.')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#5f6870]" data-testid="text-coach-status">
            {tx('Rule-based study advice · no live AI · nothing leaves this device')}
          </p>
          <span className="rounded-full bg-[#ebf0f6] px-3 py-1.5 text-[10px] font-bold text-[#506783]">{tx('Saved on this device')}</span>
        </div>

        <div className="mt-4 space-y-5 sm:space-y-6">{children}</div>
      </main>

      <footer className="border-t border-[#e6e9ec] bg-[#f7f5f1]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#5f6870]">{tx('AI Exam Survival · AI Study Coach')}<FooterAboutLink /></p>
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
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.015em] text-[#364656] sm:text-[22px]">{title}</h2>
        </div>
        {trailing}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

// ---------- the page ----------

export default function AiStudyCoachPage() {
  const { t, tx, phrase, subject: subjectLabel, locale } = useI18n();
  const [today] = useState(getTodayKey);
  const [initial] = useState(() => loadCoach(today, phrase));
  const [request, setRequest] = useState<CoachRequest>(initial.request);
  const [isExample, setIsExample] = useState(initial.isExample);
  const [form, setForm] = useState<CoachRequest>(initial.request);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState(initial.notice);
  const [storageMessage, setStorageMessage] = useState(initial.message);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'manual'>('idle');
  const [chosenExamId, setChosenExamId] = useState('');
  const canPersist = useRef(initial.canPersist);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const calendarExams = useMemo(
    () => (typeof window === 'undefined' ? [] : readUpcomingCalendarExams(readCalendarRaw(), today)),
    [today],
  );
  const plan = useMemo(() => buildCoachPlan(request, today), [request, today]);

  function save(next: CoachRequest) {
    if (!canPersist.current) return;
    try {
      const data: StudyCoachData = { version: 1, request: next };
      window.localStorage.setItem(STUDY_COACH_STORAGE_KEY, JSON.stringify(data));
    } catch {
      canPersist.current = false;
      setStorageMessage('This browser blocked saving. The coach works for this visit but will not remember your request.');
    }
  }

  useEffect(() => setCopyState('idle'), [request]);

  function showResults() {
    window.requestAnimationFrame(() => {
      if (window.innerWidth < 1024) resultsRef.current?.scrollIntoView({ block: 'start' });
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problems = validateCoachRequest(form, today);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    const next = { ...form, topic: form.topic.trim() };
    setErrors([]);
    setNotice('');
    setRequest(next);
    setIsExample(false);
    save(next);
    showResults();
  }

  function applyExam(examId: string) {
    setChosenExamId(examId);
    const exam = calendarExams.find((item) => item.id === examId);
    if (!exam) return;
    const next = requestFromExam(exam, form);
    setForm(next);
    setErrors([]);
    setRequest(next);
    setIsExample(false);
    setNotice(`Filled in from “${exam.title}” in your Exam Calendar.`);
    save(next);
    showResults();
  }

  function startOver() {
    setForm(blankRequest);
    setChosenExamId('');
    setErrors([]);
    setNotice('');
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(phrase(plan.prompt));
      setCopyState('copied');
    } catch {
      promptRef.current?.focus();
      promptRef.current?.select();
      setCopyState('manual');
    }
  }

  const topicListId = 'coach-topic-ideas';
  const topicIdeas = SUBJECT_GUIDES[(COACH_SUBJECTS as readonly string[]).includes(form.subject) ? (form.subject as CoachSubject) : 'Other'].topics;

  return (
    <CoachFrame>
      {storageMessage && (
        <div role="alert" className="rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] px-4 py-3 text-[12px] leading-relaxed text-[#69502e]" data-testid="message-coach-storage">
          {phrase(storageMessage)}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-[8px] border border-[#dbe4ee] bg-[#f7f9fc] px-4 py-3 text-[12px] font-bold text-[#506986]" data-testid="coach-notice">
          {phrase(notice)}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        {/* ---------- the form ---------- */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <Panel eyebrow={tx('Tell the coach')} title={tx('What are you studying?')} testId="panel-coach-form">
          {calendarExams.length > 0 && (
            <label className="mb-4 block rounded-[8px] bg-[#f8fafc] p-3 text-[11px] font-bold text-[#4b5966]" htmlFor="coach-from-exam">
              {tx('Start from one of my exams')}
              <select
                id="coach-from-exam"
                value={chosenExamId}
                onChange={(event) => applyExam(event.currentTarget.value)}
                className={inputClassName}
                data-testid="select-coach-exam"
              >
                <option value="">{tx('Choose an exam from your calendar…')}</option>
                {calendarExams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} · {subjectLabel(exam.subject)} · {phrase(getCountdown(exam.date, today).label)}
                  </option>
                ))}
              </select>
            </label>
          )}

          <form onSubmit={submit} noValidate data-testid="form-coach">
            {errors.length > 0 && (
              <div role="alert" className="mb-4 rounded-[8px] border border-[#ebd6d6] bg-[#fef7f7] px-4 py-3 text-[12px] leading-relaxed text-[#865454]" data-testid="coach-errors">
                <p className="font-bold">{tx('Check these details:')}</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {errors.map((error) => (
                    <li key={error}>{phrase(error)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="coach-grade">
                {tx('Grade')}
                <select id="coach-grade" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.currentTarget.value })} className={inputClassName} data-testid="select-coach-grade">
                  {COACH_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {t('common.grade', { grade })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="coach-subject">
                {tx('Subject')}
                <select id="coach-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.currentTarget.value })} className={inputClassName} data-testid="select-coach-subject">
                  {COACH_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subjectLabel(subject)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-[#4b5966] sm:col-span-2" htmlFor="coach-topic">
                {tx('Topic')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
                <input
                  id="coach-topic"
                  value={form.topic}
                  maxLength={TOPIC_LIMIT}
                  list={topicListId}
                  onChange={(event) => setForm({ ...form, topic: event.currentTarget.value })}
                  placeholder={topicIdeas[0] ? tx('For example: {topic}', { topic: phrase(topicIdeas[0]) }) : tx('For example: Chapter 4')}
                  className={inputClassName}
                  data-testid="input-coach-topic"
                />
                <datalist id={topicListId}>
                  {topicIdeas.map((idea) => (
                    <option key={idea} value={phrase(idea)} />
                  ))}
                </datalist>
              </label>
            </div>

            <fieldset className="mt-4">
              <legend className="text-[11px] font-bold text-[#4b5966]">{tx('How hard does it feel?')}</legend>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-[8px] bg-[#f8f5f1] p-1">
                {COACH_DIFFICULTIES.map((difficulty) => {
                  const selected = form.difficulty === difficulty;
                  return (
                    <label
                      key={difficulty}
                      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[11px] px-2 text-center text-[11px] font-extrabold transition-colors ${
                        selected ? 'bg-[#fffdf8] text-[#4c6a8c]' : 'text-[#5e676f] hover:text-[#4c6a8c]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="coach-difficulty"
                        value={difficulty}
                        checked={selected}
                        onChange={() => setForm({ ...form, difficulty })}
                        className="sr-only"
                        data-testid={`radio-difficulty-${difficulty}`}
                      />
                      {phrase(DIFFICULTY_LABELS[difficulty])}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="coach-problem">
                {tx('What gets in the way?')}
                <select id="coach-problem" value={form.problem} onChange={(event) => setForm({ ...form, problem: event.currentTarget.value })} className={inputClassName} data-testid="select-coach-problem">
                  {COACH_PROBLEMS.map((problem) => (
                    <option key={problem} value={problem}>
                      {phrase(PROBLEM_LABELS[problem])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="coach-date">
                {tx('Exam date')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
                <input id="coach-date" type="date" min={today} value={form.examDate} onChange={(event) => setForm({ ...form, examDate: event.currentTarget.value })} className={inputClassName} data-testid="input-coach-date" />
              </label>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button type="button" onClick={startOver} className={secondaryButton} data-testid="button-coach-reset">
                <RotateCcw size={15} /> {tx('Start over')}
              </button>
              <button type="submit" className={primaryButton} data-testid="button-coach-submit">
                <Sparkles size={15} /> {tx('Get my study plan')}
              </button>
            </div>
          </form>
        </Panel>
        </div>

        {/* ---------- the plan ---------- */}
        <div ref={resultsRef} className="grid min-w-0 content-start gap-5" data-testid="coach-results">
          <Panel
            eyebrow={isExample ? tx('Example plan') : tx('Your study plan')}
            title={phrase(plan.focus)}
            testId="panel-plan"
            trailing={
              isExample ? (
                <span className="rounded-full bg-[#faf2e4] px-3 py-1.5 text-[10px] font-bold text-[#866038]" data-testid="badge-example">
                  {tx('Example · fill in the form for yours')}
                </span>
              ) : undefined
            }
          >
            <ul className="flex flex-wrap gap-1.5" data-testid="plan-summary">
              {plan.summary.map((item, index) => (
                <li key={`${index}-${item}`} className="rounded-full bg-[#f8f6f3] px-3 py-1.5 text-[10px] font-bold text-[#5e6973]">
                  {index === 1 ? subjectLabel(item) : phrase(item)}
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[8px] border border-[#eef0f2] px-3 py-2.5" data-testid="stat-days-left">
                <dt className="text-[10px] font-bold text-[#5f6870]">{tx('Days left')}</dt>
                <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.015em] text-[#364656] tabular-nums">{plan.daysLeft === null ? '—' : plan.daysLeft}</dd>
              </div>
              <div className="rounded-[8px] border border-[#eef0f2] px-3 py-2.5" data-testid="stat-minutes">
                <dt className="text-[10px] font-bold text-[#5f6870]">{tx('Minutes a day')}</dt>
                <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.015em] text-[#364656] tabular-nums">{plan.minutesPerDay}</dd>
              </div>
              <div className="rounded-[8px] border border-[#eef0f2] px-3 py-2.5" data-testid="stat-sessions">
                <dt className="text-[10px] font-bold text-[#5f6870]">{tx('Sessions a day')}</dt>
                <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.015em] text-[#364656] tabular-nums">{plan.sessionsPerDay}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] leading-relaxed text-[#60686f]" data-testid="text-session-note">
              {tx(
                plan.sessionsPerDay === 1
                  ? '{minutes}-minute session with a 5-minute break in between.'
                  : '{minutes}-minute sessions with a 5-minute break in between.',
                { minutes: plan.sessionLength },
              )}
              {request.examDate ? ` ${tx('Exam: {date}.', { date: formatExamDate(request.examDate, locale ?? 'en').long })}` : ''}
            </p>

            <h3 className="mt-5 text-[12px] font-extrabold text-[#3f4e5d]">{tx('Do these next')}</h3>
            <ol className="mt-2 space-y-2" data-testid="plan-actions">
              {plan.actions.map((action, index) => (
                <li key={`${index}-${action.text}`} className="flex gap-3 rounded-[8px] border border-[#eef0f2] p-3" data-testid="plan-action">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#f1f5f9] text-[10px] font-extrabold text-[#4c6a8c]">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="break-words text-[12px] leading-relaxed text-[#4b5966]">{phrase(action.text)}</p>
                    {action.link && (
                      <Link
                        href={action.link.href}
                        className="mt-1 inline-flex min-h-9 items-center gap-1 text-[11px] font-extrabold text-[#4c6a8c] hover:text-[#3e5977]"
                        data-testid="plan-action-link"
                      >
                        {tx(action.link.label)} <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel eyebrow={tx('{subject} strategies', { subject: subjectLabel(request.subject) })} title={tx('Strategies that fit')} testId="panel-strategies">
            <ul className="grid gap-3 md:grid-cols-3" data-testid="plan-strategies">
              {plan.strategies.map((strategy) => (
                <li key={strategy.id} className="flex flex-col rounded-[10px] border border-[#e6ebf1] bg-[#fbfcfe] p-4" data-testid="plan-strategy">
                  <span className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#f1f5f9] text-[#4a688c]">
                    <Target size={17} />
                  </span>
                  <p className="mt-3 text-[13px] font-extrabold text-[#3f4e5d]">{phrase(strategy.title)}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#5e6973]">{phrase(strategy.how)}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-[#60686f]">{tx('Why it works: {why}', { why: phrase(strategy.why) })}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel eyebrow={t('common.grade', { grade: request.grade })} title={tx('A tip for your year')} testId="panel-grade-tip">
              <p className="flex gap-2 text-[12px] leading-[1.75] text-[#5e6973]" data-testid="text-grade-tip">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#885e44]" /> {phrase(plan.gradeTip)}
              </p>
            </Panel>
            <Panel eyebrow={phrase(PROBLEM_LABELS[request.problem as keyof typeof PROBLEM_LABELS])} title={tx('When you get stuck')} testId="panel-problem-tip">
              <p className="flex gap-2 text-[12px] leading-[1.75] text-[#5e6973]" data-testid="text-problem-tip">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#396f5f]" /> {phrase(plan.problemTip)}
              </p>
            </Panel>
          </div>

          <Panel eyebrow={tx('Optional')} title={tx('Practise with a school-approved AI tool')} testId="panel-prompt">
            <p className="text-[11px] leading-relaxed text-[#5f6870]">
              {tx('If your school allows an AI tool, copy this question into it. Only use tools your school approves, and never share personal information.')}
            </p>
            <label htmlFor="coach-prompt" className="sr-only">
              {tx('Practice question to copy')}
            </label>
            <textarea
              id="coach-prompt"
              ref={promptRef}
              readOnly
              rows={3}
              value={phrase(plan.prompt)}
              className={`${inputClassName} min-h-[132px] resize-none text-[12px] leading-relaxed sm:min-h-0`}
              data-testid="text-prompt"
            />
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
              {copyState === 'copied' && (
                <span className="text-[11px] font-bold text-[#366b58]" role="status" data-testid="copy-status">
                  {tx('Copied')}
                </span>
              )}
              {copyState === 'manual' && (
                <span className="text-[11px] font-bold text-[#69502e]" role="status" data-testid="copy-status">
                  {tx('Text selected. Press and hold to copy it.')}
                </span>
              )}
              <button type="button" onClick={copyPrompt} className={secondaryButton} data-testid="button-copy-prompt">
                {copyState === 'copied' ? <Check size={15} /> : <Clipboard size={15} />} {tx('Copy question')}
              </button>
            </div>
          </Panel>
        </div>
      </div>
    </CoachFrame>
  );
}
