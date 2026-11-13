import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CheckCircle2, Flame, Minus } from 'lucide-react';
import { Link } from 'wouter';
import { FooterAboutLink } from './about-page';
import { formatExamDate, getCountdown, getTodayKey } from './exam-calendar-model';
import { ActivityLegend, QuizScoreChart, WeeklyActivityChart } from './progress-charts';
import {
  NEEDS_WORK_BELOW,
  SOURCE_KEYS,
  STRONG_AT,
  SUBJECT_MIN_ANSWERS,
  SUBJECT_MIN_QUIZZES,
  TOPIC_MIN_ANSWERS,
  buildActivity,
  buildExamReadiness,
  buildOverview,
  buildPlannerWeek,
  buildSubjectRows,
  buildTopicResults,
  quizTimeline,
  readAllSources,
  recommendFor,
  type AllSources,
  type Classification,
  type SourceName,
  type SubjectRow,
  type TopicResult,
} from './progress-tracker-model';
import { Menti } from '@/components/menti';
import { learningName } from '@/i18n/content';
import { useI18n } from '@/i18n/i18n';

/** "November 5, 2026" / "5 Kasım 2026": the long date without the weekday. */
function useShortDate() {
  const { locale } = useI18n();
  return (key: string) =>
    locale ? formatExamDate(key, locale).long.replace(/ \S+$/, '') : formatExamDate(key).long.replace(/^\w+, /, '');
}

/** READ ONLY: this page only ever calls localStorage.getItem. */
function readRaw(): Record<SourceName, string | null> {
  const read = (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };
  return {
    quiz: read(SOURCE_KEYS.quiz),
    planner: read(SOURCE_KEYS.planner),
    flashcards: read(SOURCE_KEYS.flashcards),
    calendar: read(SOURCE_KEYS.calendar),
    prep: read(SOURCE_KEYS.prep),
  };
}

const EMPTY_RAW: Record<SourceName, string | null> = { quiz: null, planner: null, flashcards: null, calendar: null, prep: null };

const CLASS_STYLES: Record<Classification, { label: string; chip: string }> = {
  strong: { label: 'Strong', chip: 'bg-[#e3f8f7] text-[#168991]' },
  'needs-work': { label: 'Needs work', chip: 'bg-[#fff0e7] text-[#a6533a]' },
  'in-between': { label: 'Getting there', chip: 'bg-[#eeebff] text-[#5144c7]' },
  'not-enough': { label: 'Not enough data yet', chip: 'bg-[#f2f4f9] text-[#7e879e]' },
};

// ---------- layout pieces ----------

function ProgressFrame({ children }: { children: ReactNode }) {
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
              <BarChart3 size={22} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#75dfe0] sm:text-[11px]">{tx('Notice the work you have done')}</p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.055em] sm:text-[44px]">{tx('Progress Tracker')}</h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#c3cbe3] sm:text-[15px]">
                {tx('Real numbers from your quizzes, flashcards, study plan and exams on this device. Nothing here is estimated: when there is not enough data, the tracker says so.')}
              </p>
            </div>
          </div>
        </section>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#7e879e]" data-testid="text-progress-status">
            {tx('Read only · reads your saved data and never changes it')}
          </p>
          <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">{tx('From this device')}</span>
        </div>
        <div className="mt-4 space-y-5 sm:space-y-6">{children}</div>
      </main>
      <footer className="border-t border-[#e3e6ef] bg-[#f0f2f8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#7e879e]">{tx('AI Exam Survival · Progress Tracker')}<FooterAboutLink /></p>
          <Link href="/" className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#5045b5] hover:text-[#31278e]" data-testid="link-footer-home">
            <ArrowLeft size={13} /> {tx('Return to the homepage')}
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Panel({ eyebrow, title, children, trailing, testId }: { eyebrow: string; title: string; children: ReactNode; trailing?: ReactNode; testId?: string }) {
  return (
    <section className="min-w-0 rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6" data-testid={testId}>
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

function EmptyState({ text, href, label, testId }: { text: string; href: string; label: string; testId?: string }) {
  return (
    <div className="rounded-[16px] border border-dashed border-[#dcdfea] bg-[#fafbfe] px-5 py-6 text-center" data-testid={testId}>
      <p className="text-[12px] leading-relaxed text-[#626b85]">{text}</p>
      <Link href={href} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#eeebff] px-4 text-[11px] font-extrabold text-[#5144c7] hover:bg-[#e3dfff]">
        {label} <ArrowRight size={13} />
      </Link>
    </div>
  );
}

function Tile({ label, value, note, testId }: { label: string; value: string; note: string; testId: string }) {
  return (
    <div className="min-w-0 rounded-[18px] border border-[#e5e7f0] bg-white p-4" data-testid={testId}>
      <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#7e879e]">{label}</p>
      <p className="font-display mt-2 text-[28px] font-extrabold leading-none tracking-[-.05em] text-[#20294d] tabular-nums" data-testid={`${testId}-value`}>
        {value}
      </p>
      <p className="mt-2 text-[10px] leading-snug text-[#8790a4]">{note}</p>
    </div>
  );
}

function Bar({ value, max, color = 'bg-[#5144c7]', label }: { value: number; max: number; color?: string; label: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100);
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#eef0f6]" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

const SOURCE_LABELS: Record<SourceName, { name: string; href: string }> = {
  quiz: { name: 'Quiz Center', href: '/quiz-center' },
  planner: { name: 'Study Planner', href: '/study-planner' },
  flashcards: { name: 'Smart Flashcards', href: '/smart-flashcards' },
  calendar: { name: 'Exam Calendar', href: '/exam-calendar' },
  prep: { name: 'Preparation steps', href: '/exam-calendar' },
};

function sourceSummary(name: SourceName, sources: AllSources, tx: (template: string, vars?: Record<string, string | number>) => string) {
  const s = sources[name];
  if (s.status === 'damaged') return tx('could not be read');
  if (s.status === 'empty') return tx('not used yet');
  switch (name) {
    case 'quiz': {
      const n = sources.quiz.data?.length ?? 0;
      return tx(n === 1 ? '{count} quiz' : '{count} quizzes', { count: n });
    }
    case 'planner': {
      const n = sources.planner.data?.tasks.filter((t) => t.kind === 'study').length ?? 0;
      return n === 0 ? tx('no week planned') : tx('{count} sessions planned', { count: n });
    }
    case 'flashcards':
      return tx('{count} cards', { count: sources.flashcards.data?.cards.length ?? 0 });
    case 'calendar': {
      const n = sources.calendar.data?.exams.length ?? 0;
      return tx(n === 1 ? '{count} exam' : '{count} exams', { count: n });
    }
    default: {
      const n = sources.prep.data?.steps.length ?? 0;
      return tx(n === 1 ? '{count} step' : '{count} steps', { count: n });
    }
  }
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'steady' | null }) {
  const { tx } = useI18n();
  if (!trend) return null;
  const map = {
    up: { icon: <ArrowUpRight size={13} />, text: 'Improving', cls: 'text-[#168991]' },
    down: { icon: <ArrowDownRight size={13} />, text: 'Dropping', cls: 'text-[#a6533a]' },
    steady: { icon: <Minus size={13} />, text: 'Steady', cls: 'text-[#7e879e]' },
  }[trend];
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${map.cls}`} data-testid="subject-trend">
      {map.icon} {tx(map.text)}
    </span>
  );
}

function Dash() {
  const { tx } = useI18n();
  return <span className="text-[#b0b6c5]" aria-label={tx('no data')}>—</span>;
}

function SubjectRowView({ row }: { row: SubjectRow }) {
  const { t, tx, phrase, subject: subjectLabel, locale } = useI18n();
  const cell = (label: string, content: ReactNode, testId: string) => (
    <div className="min-w-0" data-testid={testId}>
      <p className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9299aa] md:hidden">{label}</p>
      <div className="mt-0.5 text-[12px] font-bold text-[#35405e] md:mt-0">{content}</div>
    </div>
  );
  return (
    <li className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-[16px] border border-[#eceef4] p-4 md:grid-cols-[1.5fr_1fr_1fr_.9fr_.9fr] md:items-center md:gap-3 md:rounded-none md:border-0 md:border-t md:px-1 md:py-3.5" data-testid={`subject-row-${row.key}`}>
      <div className="col-span-2 min-w-0 md:col-span-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[13px] font-extrabold text-[#20294d]">{subjectLabel(row.label)}</p>
          {row.classification && (
            <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[.06em] ${CLASS_STYLES[row.classification].chip}`} data-testid="subject-class">
              {tx(CLASS_STYLES[row.classification].label)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[10px] text-[#8790a4]">{phrase(row.sourcesNote)}</p>
      </div>
      {cell(
        tx('Quiz average'),
        row.quiz ? (
          <span className="flex flex-wrap items-center gap-x-2">
            <span data-testid="subject-quiz-average">{row.quiz.average}%</span>
            <span className="text-[10px] font-semibold text-[#8790a4]">
              {tx(row.quiz.count === 1 ? '{count} quiz' : '{count} quizzes', { count: row.quiz.count })}
            </span>
            <TrendIcon trend={row.quiz.trend} />
          </span>
        ) : (
          <Dash />
        ),
        'subject-quiz',
      )}
      {cell(
        tx('Answers correct'),
        row.quiz ? (
          <span>
            <span data-testid="subject-accuracy">{row.quiz.accuracy}%</span>{' '}
            <span className="text-[10px] font-semibold text-[#8790a4]">
              {tx('{done} of {total}', { done: row.quiz.correct, total: row.quiz.answered })}
            </span>
          </span>
        ) : (
          <Dash />
        ),
        'subject-answers',
      )}
      {cell(
        tx('Cards mastered'),
        row.flashcards ? (
          <span data-testid="subject-cards">
            {tx('{done} of {total}', { done: row.flashcards.mastered, total: row.flashcards.total })}
          </span>
        ) : (
          <Dash />
        ),
        'subject-flashcards',
      )}
      {cell(
        tx('Planner sessions'),
        row.planner ? (
          <span data-testid="subject-sessions">
            {tx('{done} of {total}', { done: row.planner.done, total: row.planner.planned })}
            {row.upcomingExams > 0 && (
              <span className="ml-1.5 text-[10px] font-semibold text-[#8790a4]">
                · {tx(row.upcomingExams === 1 ? '{count} exam ahead' : '{count} exams ahead', { count: row.upcomingExams })}
              </span>
            )}
          </span>
        ) : row.upcomingExams > 0 ? (
          <span className="text-[11px] font-semibold text-[#8790a4]">
            {tx(row.upcomingExams === 1 ? '{count} exam ahead' : '{count} exams ahead', { count: row.upcomingExams })}
          </span>
        ) : (
          <Dash />
        ),
        'subject-planner',
      )}
    </li>
  );
}

function TopicItem({ topic }: { topic: TopicResult }) {
  const { t, tx, phrase, lang, subject: subjectLabel, locale } = useI18n();
  return (
    <li className="rounded-[14px] border border-[#eceef4] p-3.5" data-testid={`topic-${topic.source}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words text-[12px] font-extrabold text-[#293354]" data-testid="topic-name" data-content="topic">
            {learningName(topic.topic, lang)}
          </p>
          <p className="text-[10px] text-[#8790a4]">
            {subjectLabel(topic.subject)} ·{' '}
            {tx(topic.source === 'quiz' ? '{good} of {total} quiz answers right' : '{good} of {total} reviewed cards known', {
              good: topic.good,
              total: topic.total,
            })}
          </p>
        </div>
        <span className="font-display text-[18px] font-extrabold tracking-[-.03em] text-[#20294d] tabular-nums" data-testid="topic-rate">
          {topic.rate}%
        </span>
      </div>
      <ul className="mt-2 space-y-1.5">
        {recommendFor({ ...topic, topic: learningName(topic.topic, lang), deckName: topic.deckName && learningName(topic.deckName, lang) }).map((rec) => (
          <li key={rec.text} className="text-[11px] leading-relaxed text-[#56607b]">
            {phrase(rec.text)}{' '}
            <Link href={rec.link.href} className="inline-flex min-h-8 items-center gap-0.5 font-extrabold text-[#5144c7] hover:text-[#31278e]" data-testid="topic-link">
              {tx(rec.link.label)} <ArrowRight size={12} />
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

// ---------- the page ----------

export default function ProgressTrackerPage() {
  const { t, tx, phrase, subject: subjectLabel, locale } = useI18n();
  const shortDate = useShortDate();
  const [today, setToday] = useState(getTodayKey);
  const [raw, setRaw] = useState<Record<SourceName, string | null>>(() => (typeof window === 'undefined' ? EMPTY_RAW : readRaw()));

  // Pick up changes made in other tabs or after the tablet wakes up. Still read only.
  useEffect(() => {
    const refresh = () => {
      setToday(getTodayKey());
      setRaw(readRaw());
    };
    const timer = window.setInterval(() => setToday(getTodayKey()), 60_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  const sources = useMemo(() => readAllSources(raw), [raw]);
  const overview = useMemo(() => buildOverview(sources, today), [sources, today]);
  const activity = useMemo(() => buildActivity(sources, today), [sources, today]);
  const plannerWeek = useMemo(() => buildPlannerWeek(sources.planner.data, today), [sources, today]);
  const subjects = useMemo(() => buildSubjectRows(sources, today), [sources, today]);
  const topics = useMemo(() => buildTopicResults(sources), [sources]);
  const exams = useMemo(() => buildExamReadiness(sources, today), [sources, today]);
  const timeline = useMemo(() => quizTimeline(sources.quiz.data ?? []), [sources]);

  const damaged = (Object.keys(sources) as SourceName[]).filter((name) => sources[name].status === 'damaged');
  const nothingYet = overview.quizzes === 0 && overview.sessionsPlanned === 0 && overview.cardsReviewed === 0 && exams.length === 0 && activity.activeDaysLast30 === 0;

  const classified = subjects.filter((row) => row.classification === 'strong' || row.classification === 'needs-work');
  const strongSubjects = subjects.filter((row) => row.classification === 'strong');
  const weakSubjects = subjects.filter((row) => row.classification === 'needs-work');
  const strongTopics = topics.filter((t) => t.classification === 'strong').sort((a, b) => b.rate - a.rate || b.total - a.total);
  const reviseTopics = topics.filter((t) => t.classification === 'needs-work').sort((a, b) => a.rate - b.rate || b.total - a.total);
  const unclassifiedTopics = topics.filter((t) => t.classification === 'not-enough').length;
  const betweenTopics = topics.filter((t) => t.classification === 'in-between').length;

  // Group rows under visual parent headings (Mathematics, English, History).
  const grouped: Array<{ group: string | null; rows: SubjectRow[] }> = [];
  subjects.forEach((row) => {
    const last = grouped[grouped.length - 1];
    if (row.group && last && last.group === row.group) last.rows.push(row);
    else grouped.push({ group: row.group, rows: [row] });
  });

  return (
    <ProgressFrame>
      {/* ---------- where the numbers come from ---------- */}
      <section className="rounded-[18px] border border-[#e5e7f0] bg-white px-4 py-3.5" data-testid="panel-sources">
        <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#7e879e]">{tx('Reading from')}</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(SOURCE_LABELS) as SourceName[]).map((name) => {
            const status = sources[name].status;
            return (
              <li
                key={name}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold ${
                  status === 'damaged' ? 'bg-[#fff0e7] text-[#a6533a]' : status === 'ok' ? 'bg-[#e3f8f7] text-[#168991]' : 'bg-[#f2f4f9] text-[#7e879e]'
                }`}
                data-testid={`source-${name}`}
                data-status={status}
              >
                {status === 'damaged' ? <AlertTriangle size={12} /> : status === 'ok' ? <CheckCircle2 size={12} /> : null}
                {tx(SOURCE_LABELS[name].name)} · {sourceSummary(name, sources, tx)}
              </li>
            );
          })}
        </ul>
        {damaged.length > 0 && (
          <p role="alert" className="mt-3 rounded-[12px] bg-[#fff9f0] px-3 py-2 text-[11px] leading-relaxed text-[#765221]" data-testid="message-damaged">
            {tx('Some saved data could not be read ({names}). It was left untouched and is not counted below. Everything else is shown normally.', {
              names: damaged.map((n) => tx(SOURCE_LABELS[n].name)).join(', '),
            })}
          </p>
        )}
      </section>

      {nothingYet && (
        <div className="rounded-[18px] border border-[#d8d4f5] bg-[#f6f4ff] px-5 py-4" data-testid="getting-started">
          <Menti pose="wave" size={72} message={t('menti.progressEmpty')} testId="menti-progress" className="mb-3" />
          <p className="text-[13px] font-extrabold text-[#35405e]">{tx('Your dashboard fills up as you study.')}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#56607b]">
            {tx('Finish a quiz, review some flashcards, plan a week or add an exam. Each one shows up here automatically.')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['quiz', 'flashcards', 'planner', 'calendar'] as SourceName[]).map((name) => (
              <Link key={name} href={SOURCE_LABELS[name].href} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-white px-3.5 text-[11px] font-extrabold text-[#5144c7] hover:text-[#31278e]">
                {tx(SOURCE_LABELS[name].name)} <ArrowRight size={12} />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ---------- overview ---------- */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-testid="overview">
        <Tile testId="tile-quizzes" label={tx('Quizzes completed')} value={String(overview.quizzes)} note={overview.quizCapReached ? tx('The latest 30 saved by Quiz Center') : tx('Saved in Quiz Center')} />
        <Tile testId="tile-average" label={tx('Average score')} value={overview.averageScore === null ? '—' : `${overview.averageScore}%`} note={tx('Same as Quiz Center: the average of your quiz scores')} />
        <Tile testId="tile-sessions" label={tx('Study sessions done')} value={overview.sessionsPlanned === 0 ? '—' : `${overview.sessionsDone}/${overview.sessionsPlanned}`} note={tx('In your current Study Planner week')} />
        <Tile testId="tile-mastered" label={tx('Flashcards mastered')} value={overview.cardsTotal === 0 ? '—' : `${overview.cardsMastered}/${overview.cardsTotal}`} note={tx(overview.cardsReviewed === 1 ? '{count} card reviewed at least once' : '{count} cards reviewed at least once', { count: overview.cardsReviewed })} />
        <Tile testId="tile-active" label={tx('Active days')} value={`${overview.activeDaysLast7}/7`} note={tx('{count} in the last 30 days', { count: overview.activeDaysLast30 })} />
      </div>

      {/* ---------- consistency ---------- */}
      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Panel eyebrow={tx('Last 7 days')} title={tx('Weekly study activity')} testId="panel-week" trailing={<ActivityLegend />}>
          <WeeklyActivityChart week={activity.week} today={today} />
          <p className="mt-3 text-[10px] leading-relaxed text-[#8790a4]" data-testid="text-activity-note">
            {tx('Planner sessions count on their planned day once you tick them (an approximation, because the planner does not record when you ticked). Flashcards count each card’s most recent review only, so earlier reviews are not shown.')}
          </p>
        </Panel>

        <Panel eyebrow={tx('Study consistency')} title={tx('Keep the rhythm')} testId="panel-consistency">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[16px] bg-[#202b60] p-4 text-white" data-testid="streak-current">
              <p className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[.1em] text-[#75dfe0]">
                <Flame size={12} /> {tx('Current streak')}
              </p>
              <p className="font-display mt-2 text-[28px] font-extrabold leading-none tracking-[-.05em] tabular-nums" data-testid="streak-current-value">
                {tx(activity.currentStreak === 1 ? '{count} day' : '{count} days', { count: activity.currentStreak })}
              </p>
            </div>
            <div className="rounded-[16px] border border-[#eceef4] p-4" data-testid="streak-best">
              <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#7e879e]">{tx('Best streak')}</p>
              <p className="font-display mt-2 text-[28px] font-extrabold leading-none tracking-[-.05em] text-[#20294d] tabular-nums" data-testid="streak-best-value">
                {tx(activity.bestStreak === 1 ? '{count} day' : '{count} days', { count: activity.bestStreak })}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#8790a4]">
            {tx('A streak counts days in a row with saved activity, up to today or yesterday.')}
          </p>

          <div className="mt-4 border-t border-[#eceef4] pt-4" data-testid="planner-week">
            <p className="text-[11px] font-extrabold text-[#35405e]">{tx('Planned vs completed')}</p>
            {plannerWeek ? (
              <>
                <p className="mt-1 text-[10px] text-[#8790a4]">
                  {tx('Study Planner week: {from} – {to}', { from: shortDate(plannerWeek.weekStart), to: shortDate(plannerWeek.weekEnd) })}
                </p>
                <p className="font-display mt-2 text-[20px] font-extrabold tracking-[-.04em] text-[#20294d]" data-testid="planner-done">
                  {tx('{done} of {total} sessions', { done: plannerWeek.done, total: plannerWeek.planned })}
                </p>
                <div className="mt-2">
                  <Bar value={plannerWeek.done} max={plannerWeek.planned} label={tx('Planner sessions completed')} color="bg-[#5a4bd0]" />
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-[#8790a4]" data-testid="planner-due">
                  {tx('{done} of {due} sessions due so far are done · {minutes} of {planned} minutes', {
                    done: plannerWeek.doneOfDue,
                    due: plannerWeek.dueSoFar,
                    minutes: plannerWeek.minutesDone,
                    planned: plannerWeek.minutesPlanned,
                  })}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[11px] leading-relaxed text-[#8790a4]" data-testid="planner-none">
                {tx('No Study Planner week yet.')}{' '}
                <Link href="/study-planner" className="font-extrabold text-[#5144c7]">
                  {tx('Plan a week')}
                </Link>
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* ---------- quiz trend ---------- */}
      <Panel eyebrow={tx('Quiz Center')} title={tx('Quiz scores over time')} testId="panel-quiz-trend">
        {timeline.length >= 3 ? (
          <QuizScoreChart points={timeline} />
        ) : (
          <EmptyState
            testId="quiz-trend-empty"
            text={tx('Finish at least 3 quizzes to see how your scores change over time. You have {count} so far.', { count: timeline.length })}
            href="/quiz-center"
            label={tx('Open Quiz Center')}
          />
        )}
      </Panel>

      {/* ---------- subjects ---------- */}
      <Panel eyebrow={tx('Subject performance')} title={tx('How each subject is going')} testId="panel-subjects">
        {subjects.length === 0 ? (
          <EmptyState testId="subjects-empty" text={tx('Subjects appear here once you take a quiz, review flashcards, plan a week or add an exam.')} href="/quiz-center" label={tx('Take your first quiz')} />
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2" data-testid="subject-callouts">
              <div className="rounded-[16px] bg-[#f2fbfb] p-4" data-testid="callout-strong">
                <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#168991]">{tx('Strongest')}</p>
                <p className="mt-1 text-[13px] font-extrabold text-[#20294d]">
                  {strongSubjects.length > 0 ? strongSubjects.map((r) => subjectLabel(r.label)).join(', ') : classified.length > 0 ? tx('None at 80% yet') : tx('Not enough data yet')}
                </p>
              </div>
              <div className="rounded-[16px] bg-[#fff7f2] p-4" data-testid="callout-weak">
                <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#a6533a]">{tx('Needs work')}</p>
                <p className="mt-1 text-[13px] font-extrabold text-[#20294d]">
                  {weakSubjects.length > 0 ? weakSubjects.map((r) => subjectLabel(r.label)).join(', ') : classified.length > 0 ? tx('None below 60%') : tx('Not enough data yet')}
                </p>
              </div>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-[#8790a4]">
              {tx('Based on quiz answers: strong at {strong}% or more correct, needs work below {weak}%. A subject needs at least {quizzes} quizzes or {answers} answers before it is rated.', {
                strong: STRONG_AT,
                weak: NEEDS_WORK_BELOW,
                quizzes: SUBJECT_MIN_QUIZZES,
                answers: SUBJECT_MIN_ANSWERS,
              })}
            </p>

            <div className="mt-4 hidden grid-cols-[1.5fr_1fr_1fr_.9fr_.9fr] gap-3 px-1 text-[9px] font-extrabold uppercase tracking-[.08em] text-[#9299aa] md:grid" aria-hidden="true">
              <span>{tx('Subject')}</span>
              <span>{tx('Quiz average')}</span>
              <span>{tx('Answers correct')}</span>
              <span>{tx('Cards mastered')}</span>
              <span>{tx('Planner sessions')}</span>
            </div>
            <div className="mt-3 space-y-4 md:mt-1 md:space-y-2" data-testid="subject-list">
              {grouped.map(({ group, rows }) => (
                <div key={`${group ?? 'single'}-${rows[0].key}`} data-testid={group ? `subject-group-${group.toLowerCase()}` : undefined}>
                  {group && (
                    <p className="mb-2 mt-1 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#5a4bc9] md:mb-0 md:px-1" data-testid="subject-group-title">
                      {subjectLabel(group)}
                    </p>
                  )}
                  <ul className={`space-y-2 md:space-y-0 ${group ? 'md:border-l-2 md:border-[#e4e2f5] md:pl-3' : ''}`}>
                    {rows.map((row) => (
                      <SubjectRowView key={row.key} row={row} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        )}
      </Panel>

      {/* ---------- topics ---------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel eyebrow={tx('Topic analysis')} title={tx('Going well')} testId="panel-topics-strong">
          {strongTopics.length > 0 ? (
            <ul className="space-y-2" data-testid="topics-strong">
              {strongTopics.slice(0, 8).map((t) => (
                <TopicItem key={`${t.source}-${t.subject}-${t.topic}`} topic={t} />
              ))}
            </ul>
          ) : (
            <p className="text-[12px] leading-relaxed text-[#7e879e]" data-testid="topics-strong-empty">
              {tx('No topic at {strong}% or more yet. A topic needs at least {count} quiz answers or {count} reviewed cards.', { strong: STRONG_AT, count: TOPIC_MIN_ANSWERS })}
            </p>
          )}
        </Panel>
        <Panel eyebrow={tx('Topic analysis')} title={tx('To revise next')} testId="panel-topics-revise">
          {reviseTopics.length > 0 ? (
            <ul className="space-y-2" data-testid="topics-revise">
              {reviseTopics.slice(0, 8).map((t) => (
                <TopicItem key={`${t.source}-${t.subject}-${t.topic}`} topic={t} />
              ))}
            </ul>
          ) : (
            <p className="text-[12px] leading-relaxed text-[#7e879e]" data-testid="topics-revise-empty">
              {tx('No topic is below {weak}% right now.', { weak: NEEDS_WORK_BELOW })}
            </p>
          )}
        </Panel>
      </div>
      {topics.length > 0 && (
        <p className="-mt-2 text-[10px] leading-relaxed text-[#8790a4]" data-testid="topics-note">
          {tx(betweenTopics === 1 ? '{count} topic is between {weak}% and {top}%,' : '{count} topics are between {weak}% and {top}%,', {
            count: betweenTopics,
            weak: NEEDS_WORK_BELOW,
            top: STRONG_AT - 1,
          })}{' '}
          {tx(unclassifiedTopics === 1 ? 'and {count} topic has too few answers to rate yet.' : 'and {count} topics have too few answers to rate yet.', {
            count: unclassifiedTopics,
          })}
        </p>
      )}

      {/* ---------- exam readiness ---------- */}
      <Panel eyebrow={tx('Exam readiness')} title={tx('Upcoming exams')} testId="panel-exams">
        {exams.length === 0 ? (
          <EmptyState testId="exams-empty" text={tx('Add your upcoming exams to see your preparation for each one here.')} href="/exam-calendar" label={tx('Open Exam Calendar')} />
        ) : (
          <>
            <ul className="grid gap-3 md:grid-cols-2" data-testid="exam-list">
              {exams.map((facts) => (
                <li key={facts.exam.id} className="rounded-[16px] border border-[#eceef4] p-4" data-testid={`exam-facts-${facts.exam.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="break-words text-[13px] font-extrabold text-[#293354]">{facts.exam.title}</p>
                      <p className="text-[10px] font-semibold text-[#75809a]">
                        {subjectLabel(facts.exam.subject)} · {t('common.grade', { grade: facts.exam.grade })} · {formatExamDate(facts.exam.date, locale ?? 'en').long}
                      </p>
                    </div>
                    <span className="rounded-full bg-[#eeebff] px-3 py-1.5 text-[10px] font-extrabold text-[#5144c7]" data-testid="exam-countdown">
                      {phrase(getCountdown(facts.exam.date, today).label)}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2.5 text-[11px]">
                    <div data-testid="exam-prep">
                      <dt className="font-bold text-[#626b85]">{tx('Preparation steps')}</dt>
                      <dd className="mt-1 text-[#35405e]">
                        {facts.prep ? (
                          <>
                            <span className="font-extrabold">
                              {tx('{done} of {total} done', { done: facts.prep.done, total: facts.prep.total })}
                            </span>
                            <div className="mt-1.5">
                              <Bar value={facts.prep.done} max={facts.prep.total} label={tx('Preparation for {title}', { title: facts.exam.title })} color="bg-[#8359b7]" />
                            </div>
                          </>
                        ) : (
                          <span className="text-[#8790a4]">{tx('No steps yet')}</span>
                        )}
                      </dd>
                    </div>
                    <div data-testid="exam-planner">
                      <dt className="font-bold text-[#626b85]">{tx('{subject} sessions in the Study Planner before the exam', { subject: subjectLabel(facts.exam.subject) })}</dt>
                      <dd className="mt-0.5 text-[#35405e]">
                        {facts.planner ? <span className="font-extrabold">{tx('{done} of {total} done', { done: facts.planner.done, total: facts.planner.planned })}</span> : <span className="text-[#8790a4]">{tx('None planned')}</span>}
                      </dd>
                    </div>
                    <div data-testid="exam-quiz">
                      <dt className="font-bold text-[#626b85]">{tx('Latest {subject} quiz', { subject: subjectLabel(facts.exam.subject) })}</dt>
                      <dd className="mt-0.5 text-[#35405e]">
                        {facts.latestQuiz ? (
                          <span className="font-extrabold">
                            {tx('{percent}% on {date}', { percent: facts.latestQuiz.percentage, date: shortDate(facts.latestQuiz.date) })}
                          </span>
                        ) : (
                          <span className="text-[#8790a4]">{tx('No quiz results for this subject name')}</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[10px] leading-relaxed text-[#8790a4]">
              {tx('These are separate facts, not a readiness score. Quiz results are only linked when the subject name is the same in both tools.')}
            </p>
          </>
        )}
      </Panel>
    </ProgressFrame>
  );
}
