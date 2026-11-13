// Small hand-drawn charts for the Progress Tracker (no chart library needed).
import { formatExamDate, parseDateKey } from './exam-calendar-model';
import { ACTIVITY_LABELS, NEEDS_WORK_BELOW, STRONG_AT, type ActivityType } from './progress-tracker-model';
import { useI18n } from '@/i18n/i18n';

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  quiz: 'bg-[#417d6b]',
  flashcards: 'bg-[#96674a]',
  planner: 'bg-[#5276a0]',
  prep: 'bg-[#a3843f]',
};
const ORDER: ActivityType[] = ['planner', 'quiz', 'flashcards', 'prep'];

function shortDay(dateKey: string, locale = 'en') {
  const date = parseDateKey(dateKey);
  return date ? new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(date) : '';
}

export function ActivityLegend() {
  const { tx } = useI18n();
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" data-testid="activity-legend">
      {ORDER.map((type) => (
        <li key={type} className="flex items-center gap-1.5 text-[10px] font-bold text-[#5e676f]">
          <span className={`h-2.5 w-2.5 rounded-[3px] ${ACTIVITY_COLORS[type]}`} aria-hidden="true" />
          {tx(ACTIVITY_LABELS[type])}
        </li>
      ))}
    </ul>
  );
}

export function WeeklyActivityChart({
  week,
  today,
}: {
  week: Array<{ date: string; counts: Record<ActivityType, number>; total: number }>;
  today: string;
}) {
  const { tx, locale } = useI18n();
  const max = Math.max(1, ...week.map((day) => day.total));
  return (
    <div>
      <div className="grid h-[150px] grid-cols-7 items-end gap-1.5 border-b border-[#e6e9ec] sm:gap-3" aria-hidden="true" data-testid="weekly-chart">
        {week.map((day) => (
          <div key={day.date} className="flex h-full flex-col items-center justify-end gap-1" data-testid={`week-day-${day.date}`} data-total={day.total}>
            <span className="text-[10px] font-extrabold tabular-nums text-[#4f5a64]">{day.total > 0 ? day.total : ''}</span>
            <div
              className="flex w-full max-w-[38px] flex-col-reverse overflow-hidden rounded-t-[7px]"
              style={{ height: `${(day.total / max) * 118}px` }}
            >
              {ORDER.map((type) =>
                day.counts[type] > 0 ? (
                  <span key={type} className={ACTIVITY_COLORS[type]} style={{ height: `${(day.counts[type] / day.total) * 100}%` }} />
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5 sm:gap-3" aria-hidden="true">
        {week.map((day) => (
          <span
            key={day.date}
            className={`text-center text-[10px] font-bold ${day.date === today ? 'text-[#4c6a8c]' : 'text-[#60686f]'}`}
          >
            {day.date === today ? tx('Today') : shortDay(day.date, locale ?? 'en')}
          </span>
        ))}
      </div>
      <div className="sr-only">
      <table>
        <caption>{tx('Activity in the last 7 days')}</caption>
        <thead>
          <tr>
            <th>{tx('Day')}</th>
            {ORDER.map((type) => (
              <th key={type}>{tx(ACTIVITY_LABELS[type])}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {week.map((day) => (
            <tr key={day.date}>
              <td>{formatExamDate(day.date, locale ?? 'en').long}</td>
              {ORDER.map((type) => (
                <td key={type}>{day.counts[type]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

const W = 640;
const H = 200;
const PAD = { left: 6, right: 10, top: 10, bottom: 10 };

export function QuizScoreChart({ points }: { points: Array<{ id: string; date: string; subject: string; percentage: number }> }) {
  const { tx, locale, subject: subjectLabel } = useI18n();
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (value: number) => PAD.top + (1 - Math.max(0, Math.min(100, value)) / 100) * innerH;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.percentage).toFixed(1)}`).join(' ');
  const first = points[0];
  const last = points[points.length - 1];
  const shortDate = (key: string) =>
    locale ? formatExamDate(key, locale).long.replace(/ \S+$/, '') : formatExamDate(key).long.replace(/^\w+, /, '');
  return (
    <div className="mx-auto max-w-[820px]">
      {/* Axis labels are normal text (not inside the drawing) so they stay readable on phones. */}
      <div className="relative pl-10">
        {[100, 50, 0].map((v) => (
          <span
            key={v}
            className="absolute left-0 w-8 -translate-y-1/2 text-right text-[10px] font-semibold text-[#60686f] tabular-nums"
            style={{ top: `${(y(v) / H) * 100}%` }}
            aria-hidden="true"
          >
            {v}%
          </span>
        ))}
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={tx('Quiz scores for your last {count} quizzes', { count: points.length })} data-testid="quiz-chart">
          {[0, 50, 100].map((v) => (
            <line key={v} x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="#eef0f2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={y(STRONG_AT)} y2={y(STRONG_AT)} stroke="#468774" strokeWidth="1.25" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <line x1={PAD.left} x2={W - PAD.right} y1={y(NEEDS_WORK_BELOW)} y2={y(NEEDS_WORK_BELOW)} stroke="#d19e7d" strokeWidth="1.25" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
          <path d={path} fill="none" stroke="#6183aa" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={p.id} cx={x(i)} cy={y(p.percentage)} r={i === points.length - 1 ? 6 : 4.5} fill={i === points.length - 1 ? '#6183aa' : '#fefefe'} stroke="#6183aa" strokeWidth="2" />
          ))}
        </svg>
      </div>
      <div className="mt-1 flex justify-between pl-10 text-[10px] font-semibold text-[#60686f]" aria-hidden="true" data-testid="quiz-chart-dates">
        <span>{first ? shortDate(first.date) : ''}</span>
        <span>{last ? tx('{date} · latest {percent}%', { date: shortDate(last.date), percent: last.percentage }) : ''}</span>
      </div>
      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[10px] font-bold text-[#5e676f]" data-testid="quiz-chart-legend">
        <li className="flex items-center gap-1.5">
          <span className="h-0.5 w-5 rounded bg-[#54769d]" aria-hidden="true" /> {tx('Quiz score')}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dashed border-[#468774]" aria-hidden="true" /> {tx('Strong ({percent}% or more)', { percent: STRONG_AT })}
        </li>
        <li className="flex items-center gap-1.5">
          <span className="w-5 border-t-2 border-dashed border-[#d19e7d]" aria-hidden="true" /> {tx('Needs work (below {percent}%)', { percent: NEEDS_WORK_BELOW })}
        </li>
      </ul>
      <ol className="sr-only">
        {points.map((p) => (
          <li key={p.id}>
            {formatExamDate(p.date, locale ?? 'en').long}: {subjectLabel(p.subject)} {p.percentage}%
          </li>
        ))}
      </ol>
    </div>
  );
}
