import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Clipboard, Lightbulb, MessageCircle, RotateCcw, Sparkles, Target } from 'lucide-react';
import { Link } from 'wouter';
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
import { useI18n } from '@/i18n/i18n';

// ---------- shared styles (match the other tools) ----------

const inputClassName =
  'mt-2 w-full rounded-[12px] border border-[#e3e6ef] bg-white px-3.5 py-3 text-[13px] text-[#293354] outline-none transition placeholder:text-[#a0a7b8] focus:border-[#7568dc] focus:ring-2 focus:ring-[#7568dc]/10';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5144c7] px-5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#4337b0]';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e2e5ef] bg-white px-4 text-[12px] font-bold text-[#56607b] transition-colors hover:border-[#c8c5eb] hover:text-[#5144c7]';

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
  const { tx } = useI18n();
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f5f6fb]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2e5ef] bg-white px-4 text-[12px] font-bold text-[#35405e] transition-colors hover:border-[#c8c5eb] hover:text-[#5144c7]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {tx('Back to home')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[26px] bg-[#18224d] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-[#5944d2]/25" />
          <div className="relative flex max-w-[760px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-white/10 text-[#75dfe0] sm:h-14 sm:w-14">
              <MessageCircle size={22} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#75dfe0] sm:text-[11px]">
                {tx('A supportive place to get unstuck')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.055em] sm:text-[44px]">
                {tx('AI Study Coach')}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#c3cbe3] sm:text-[15px]">
                {tx('Tell the coach your grade, subject, topic and exam date. You get a short, practical study plan with strategies that fit how hard the topic feels.')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#7e879e]" data-testid="text-coach-status">
            {tx('Rule-based study advice · no live AI · nothing leaves this device')}
          </p>
          <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">{tx('Saved on this device')}</span>
        </div>

        <div className="mt-4 space-y-5 sm:space-y-6">{children}</div>
      </main>

      <footer className="border-t border-[#e3e6ef] bg-[#f0f2f8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#7e879e]">{tx('AI Exam Survival · AI Study Coach')}</p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#5045b5] hover:text-[#31278e]"
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
      className="min-w-0 rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6"
      data-testid={testId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#5a4bc9]">{eyebrow}</p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.04em] text-[#20294d] sm:text-[22px]">{title}</h2>
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
        <div role="alert" className="rounded-[13px] border border-[#f0d8b8] bg-[#fff9f0] px-4 py-3 text-[12px] leading-relaxed text-[#765221]" data-testid="message-coach-storage">
          {phrase(storageMessage)}
        </div>
      )}
      {notice && (
        <div role="status" className="rounded-[13px] border border-[#d8d4f5] bg-[#f6f4ff] px-4 py-3 text-[12px] font-bold text-[#5144b5]" data-testid="coach-notice">
          {phrase(notice)}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        {/* ---------- the form ---------- */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
        <Panel eyebrow={tx('Tell the coach')} title={tx('What are you studying?')} testId="panel-coach-form">
          {calendarExams.length > 0 && (
            <label className="mb-4 block rounded-[14px] bg-[#f6f5ff] p-3 text-[11px] font-bold text-[#35405e]" htmlFor="coach-from-exam">
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
              <div role="alert" className="mb-4 rounded-[13px] border border-[#f0d1d1] bg-[#fff5f5] px-4 py-3 text-[12px] leading-relaxed text-[#914949]" data-testid="coach-errors">
                <p className="font-bold">{tx('Check these details:')}</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-5">
                  {errors.map((error) => (
                    <li key={error}>{phrase(error)}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-bold text-[#35405e]" htmlFor="coach-grade">
                {tx('Grade')}
                <select id="coach-grade" value={form.grade} onChange={(event) => setForm({ ...form, grade: event.currentTarget.value })} className={inputClassName} data-testid="select-coach-grade">
                  {COACH_GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      {t('common.grade', { grade })}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-[#35405e]" htmlFor="coach-subject">
                {tx('Subject')}
                <select id="coach-subject" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.currentTarget.value })} className={inputClassName} data-testid="select-coach-subject">
                  {COACH_SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subjectLabel(subject)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-[#35405e] sm:col-span-2" htmlFor="coach-topic">
                {tx('Topic')} <span className="font-semibold text-[#8790a4]">{tx('(optional)')}</span>
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
              <legend className="text-[11px] font-bold text-[#35405e]">{tx('How hard does it feel?')}</legend>
              <div className="mt-2 grid grid-cols-3 gap-1 rounded-[14px] bg-[#f1f2f8] p-1">
                {COACH_DIFFICULTIES.map((difficulty) => {
                  const selected = form.difficulty === difficulty;
                  return (
                    <label
                      key={difficulty}
                      className={`flex min-h-11 cursor-pointer items-center justify-center rounded-[11px] px-2 text-center text-[11px] font-extrabold transition-colors ${
                        selected ? 'bg-white text-[#5144c7] shadow-[0_2px_8px_rgba(29,42,90,.08)]' : 'text-[#626b85] hover:text-[#5144c7]'
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
              <label className="block text-[11px] font-bold text-[#35405e]" htmlFor="coach-problem">
                {tx('What gets in the way?')}
                <select id="coach-problem" value={form.problem} onChange={(event) => setForm({ ...form, problem: event.currentTarget.value })} className={inputClassName} data-testid="select-coach-problem">
                  {COACH_PROBLEMS.map((problem) => (
                    <option key={problem} value={problem}>
                      {phrase(PROBLEM_LABELS[problem])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] font-bold text-[#35405e]" htmlFor="coach-date">
                {tx('Exam date')} <span className="font-semibold text-[#8790a4]">{tx('(optional)')}</span>
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
                <span className="rounded-full bg-[#fff3df] px-3 py-1.5 text-[10px] font-bold text-[#a66a2c]" data-testid="badge-example">
                  {tx('Example · fill in the form for yours')}
                </span>
              ) : undefined
            }
          >
            <ul className="flex flex-wrap gap-1.5" data-testid="plan-summary">
              {plan.summary.map((item, index) => (
                <li key={`${index}-${item}`} className="rounded-full bg-[#f2f4f9] px-3 py-1.5 text-[10px] font-bold text-[#56607b]">
                  {index === 1 ? subjectLabel(item) : phrase(item)}
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[14px] border border-[#eceef4] px-3 py-2.5" data-testid="stat-days-left">
                <dt className="text-[10px] font-bold text-[#7e879e]">{tx('Days left')}</dt>
                <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.04em] text-[#20294d] tabular-nums">{plan.daysLeft === null ? '—' : plan.daysLeft}</dd>
              </div>
              <div className="rounded-[14px] border border-[#eceef4] px-3 py-2.5" data-testid="stat-minutes">
                <dt className="text-[10px] font-bold text-[#7e879e]">{tx('Minutes a day')}</dt>
                <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.04em] text-[#20294d] tabular-nums">{plan.minutesPerDay}</dd>
              </div>
              <div className="rounded-[14px] border border-[#eceef4] px-3 py-2.5" data-testid="stat-sessions">
                <dt className="text-[10px] font-bold text-[#7e879e]">{tx('Sessions a day')}</dt>
                <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.04em] text-[#20294d] tabular-nums">{plan.sessionsPerDay}</dd>
              </div>
            </dl>
            <p className="mt-2 text-[10px] leading-relaxed text-[#8790a4]" data-testid="text-session-note">
              {tx(
                plan.sessionsPerDay === 1
                  ? '{minutes}-minute session with a 5-minute break in between.'
                  : '{minutes}-minute sessions with a 5-minute break in between.',
                { minutes: plan.sessionLength },
              )}
              {request.examDate ? ` ${tx('Exam: {date}.', { date: formatExamDate(request.examDate, locale ?? 'en').long })}` : ''}
            </p>

            <h3 className="mt-5 text-[12px] font-extrabold text-[#293354]">{tx('Do these next')}</h3>
            <ol className="mt-2 space-y-2" data-testid="plan-actions">
              {plan.actions.map((action, index) => (
                <li key={`${index}-${action.text}`} className="flex gap-3 rounded-[14px] border border-[#eceef4] p-3" data-testid="plan-action">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#eeebff] text-[10px] font-extrabold text-[#5144c7]">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="break-words text-[12px] leading-relaxed text-[#35405e]">{phrase(action.text)}</p>
                    {action.link && (
                      <Link
                        href={action.link.href}
                        className="mt-1 inline-flex min-h-9 items-center gap-1 text-[11px] font-extrabold text-[#5144c7] hover:text-[#31278e]"
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
                <li key={strategy.id} className="flex flex-col rounded-[16px] border border-[#e4e2f5] bg-[#fbfaff] p-4" data-testid="plan-strategy">
                  <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#eeebff] text-[#5d4fce]">
                    <Target size={17} />
                  </span>
                  <p className="mt-3 text-[13px] font-extrabold text-[#293354]">{phrase(strategy.title)}</p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-[#56607b]">{phrase(strategy.how)}</p>
                  <p className="mt-2 text-[10px] leading-relaxed text-[#8790a4]">{tx('Why it works: {why}', { why: phrase(strategy.why) })}</p>
                </li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-5 md:grid-cols-2">
            <Panel eyebrow={t('common.grade', { grade: request.grade })} title={tx('A tip for your year')} testId="panel-grade-tip">
              <p className="flex gap-2 text-[12px] leading-[1.75] text-[#56607b]" data-testid="text-grade-tip">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#be7446]" /> {phrase(plan.gradeTip)}
              </p>
            </Panel>
            <Panel eyebrow={phrase(PROBLEM_LABELS[request.problem as keyof typeof PROBLEM_LABELS])} title={tx('When you get stuck')} testId="panel-problem-tip">
              <p className="flex gap-2 text-[12px] leading-[1.75] text-[#56607b]" data-testid="text-problem-tip">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-[#138f9a]" /> {phrase(plan.problemTip)}
              </p>
            </Panel>
          </div>

          <Panel eyebrow={tx('Optional')} title={tx('Practise with a school-approved AI tool')} testId="panel-prompt">
            <p className="text-[11px] leading-relaxed text-[#7e879e]">
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
                <span className="text-[11px] font-bold text-[#2b765b]" role="status" data-testid="copy-status">
                  {tx('Copied')}
                </span>
              )}
              {copyState === 'manual' && (
                <span className="text-[11px] font-bold text-[#765221]" role="status" data-testid="copy-status">
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
