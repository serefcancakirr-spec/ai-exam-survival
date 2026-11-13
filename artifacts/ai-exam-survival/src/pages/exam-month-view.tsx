import { ChevronLeft, ChevronRight, Clock3, ListChecks, Plus } from 'lucide-react';
import { formatExamDate, formatExamTime, getCountdown, type CountdownTone, type Exam } from './exam-calendar-model';
import {
  WEEKDAY_LABELS,
  buildMonthGrid,
  countExamsInMonth,
  formatMonthLabel,
  groupExamsByDate,
  type MonthRef,
} from './exam-calendar-month';
import { useI18n } from '@/i18n/i18n';

// Turkish short weekday names, Monday first (same order as WEEKDAY_LABELS).
const WEEKDAY_LABELS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const DOT_STYLES: Record<CountdownTone, string> = {
  today: 'bg-[#965c4a]',
  soon: 'bg-[#96674a]',
  week: 'bg-[#53759c]',
  later: 'bg-[#3b7262]',
  past: 'bg-[#afb5bb]',
};
const CHIP_STYLES: Record<CountdownTone, string> = {
  today: 'bg-[#fcf2ef] text-[#8f5847]',
  soon: 'bg-[#fbf1eb] text-[#8f5847]',
  week: 'bg-[#f1f5f9] text-[#4c6a8c]',
  later: 'bg-[#e8f3f0] text-[#396e5e]',
  past: 'bg-[#f8f6f3] text-[#5f6870]',
};

type Props = {
  exams: readonly Exam[];
  today: string;
  viewMonth: MonthRef;
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (delta: number | 'today') => void;
  progressFor: (examId: string) => { done: number; total: number };
  onOpenPrep: (exam: Exam) => void;
  onAddOnDate: (dateKey: string) => void;
};

export default function ExamMonthView({
  exams,
  today,
  viewMonth,
  selectedDate,
  onSelectDate,
  onChangeMonth,
  progressFor,
  onOpenPrep,
  onAddOnDate,
}: Props) {
  const { t, tx, phrase, subject: subjectLabel, lang, locale } = useI18n();
  const weeks = buildMonthGrid(viewMonth);
  const byDate = groupExamsByDate(exams);
  const monthLabel = formatMonthLabel(viewMonth, locale ?? 'en');
  const examsThisMonth = countExamsInMonth(exams, viewMonth);
  const selectedExams = byDate.get(selectedDate) ?? [];
  const selected = formatExamDate(selectedDate, locale ?? 'en');
  const selectedCountdown = getCountdown(selectedDate, today);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_.5fr]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-[19px] font-extrabold tracking-[-.015em] text-[#364656]" data-testid="text-month-label" aria-live="polite">
              {monthLabel}
            </h3>
            <p className="text-[10px] font-semibold text-[#60686f]" data-testid="text-month-count">
              {tx(examsThisMonth === 1 ? '{count} exam this month' : '{count} exams this month', { count: examsThisMonth })}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onChangeMonth(-1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#ddd5c6] bg-[#fffdf8] text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]"
              aria-label={tx('Previous month')}
              data-testid="button-prev-month"
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={() => onChangeMonth('today')}
              className="inline-flex min-h-10 items-center rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 text-[11px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]"
              data-testid="button-month-today"
            >
              {tx('Today')}
            </button>
            <button
              type="button"
              onClick={() => onChangeMonth(1)}
              className="grid h-10 w-10 place-items-center rounded-full border border-[#ddd5c6] bg-[#fffdf8] text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]"
              aria-label={tx('Next month')}
              data-testid="button-next-month"
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>

        <div className="mt-4" data-testid="month-grid">
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5" aria-hidden="true">
            {(lang === 'tr' ? WEEKDAY_LABELS_TR : WEEKDAY_LABELS).map((label) => (
              <span key={label} className="pb-1 text-center text-[11px] font-semibold text-[#60686f]">
                {label}
              </span>
            ))}
          </div>
          <div className="space-y-1 sm:space-y-1.5">
            {weeks.map((week) => (
              <div key={week[0].dateKey} className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {week.map((day) => {
                  const dayExams = byDate.get(day.dateKey) ?? [];
                  const isToday = day.dateKey === today;
                  const isSelected = day.dateKey === selectedDate;
                  const long = formatExamDate(day.dateKey, locale ?? 'en').long;
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => onSelectDate(day.dateKey)}
                      aria-pressed={isSelected}
                      aria-label={`${long}${isToday ? tx(', today') : ''}, ${
                        dayExams.length === 0
                          ? tx('no exams')
                          : tx(dayExams.length === 1 ? '{count} exam' : '{count} exams', { count: dayExams.length })
                      }`}
                      className={`flex min-h-[46px] min-w-0 flex-col items-center gap-1 rounded-[11px] border px-0.5 py-1.5 text-left transition-colors sm:min-h-[58px] md:min-h-[84px] md:items-stretch md:px-1.5 ${
                        isSelected
                          ? 'border-[#98afca] bg-[#f8fafc]'
                          : day.inMonth
                            ? 'border-[#ddd5c6] bg-[#fffdf8] hover:border-[#d2dce7]'
                            : 'border-transparent bg-[#fbf9f7] hover:border-[#eef0f2]'
                      }`}
                      data-testid={`day-${day.dateKey}`}
                      data-in-month={day.inMonth}
                      data-today={isToday}
                    >
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-extrabold tabular-nums md:self-start ${
                          isToday ? 'bg-[#54769d] text-white' : day.inMonth ? 'text-[#4b5966]' : 'text-[#68727c]'
                        }`}
                      >
                        {day.day}
                      </span>
                      {dayExams.length > 0 && (
                        <>
                          <span className="flex flex-wrap justify-center gap-0.5 md:hidden" aria-hidden="true" data-testid="day-dots">
                            {dayExams.slice(0, 3).map((exam) => (
                              <span key={exam.id} className={`h-1.5 w-1.5 rounded-full ${DOT_STYLES[getCountdown(exam.date, today).tone]}`} />
                            ))}
                          </span>
                          <span className="hidden min-w-0 flex-col gap-0.5 md:flex" aria-hidden="true" data-testid="day-chips">
                            {dayExams.slice(0, 2).map((exam) => (
                              <span
                                key={exam.id}
                                className={`truncate rounded-[6px] px-1.5 py-0.5 text-[9px] font-bold ${CHIP_STYLES[getCountdown(exam.date, today).tone]}`}
                              >
                                {exam.title}
                              </span>
                            ))}
                            {dayExams.length > 2 && (
                              <span className="px-1.5 text-[9px] font-bold text-[#5f6870]">{tx('+{count} more', { count: dayExams.length - 2 })}</span>
                            )}
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="min-w-0 rounded-[10px] border border-[#eef0f2] bg-[#fcfdfd] p-4" data-testid="day-details" aria-live="polite">
        <p className="text-[13px] font-semibold text-[#4b698c]">
          {phrase(selectedCountdown.label)}
        </p>
        <h3 className="font-display mt-1 text-[16px] font-extrabold tracking-[-.015em] text-[#364656]" data-testid="text-selected-date">
          {selected.long}
        </h3>
        {selectedExams.length === 0 ? (
          <p className="mt-3 text-[11px] leading-relaxed text-[#60686f]" data-testid="day-no-exams">
            {tx('No exams on this day.')}
          </p>
        ) : (
          <ul className="mt-3 space-y-2" data-testid="day-exam-list">
            {selectedExams.map((exam) => {
              const progress = progressFor(exam.id);
              return (
                <li key={exam.id} className="rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] p-3" data-testid="day-exam">
                  <p className="break-words text-[12px] font-extrabold text-[#3f4e5d]">{exam.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-[#5d676f]">
                    {subjectLabel(exam.subject)} · {t('common.grade', { grade: exam.grade })}
                  </p>
                  {exam.time && (
                    <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-[#5d676f]">
                      <Clock3 size={11} /> {formatExamTime(exam.time, lang === 'tr')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onOpenPrep(exam)}
                    className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[6px] bg-[#f1f5f9] px-3 text-[11px] font-extrabold text-[#4c6a8c] transition-colors hover:bg-[#e8eef6]"
                    data-testid={`button-day-prepare-${exam.id}`}
                  >
                    <ListChecks size={14} /> {tx('Preparation')} {progress.total > 0 ? `· ${progress.done}/${progress.total}` : ''}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <button
          type="button"
          onClick={() => onAddOnDate(selectedDate)}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3 text-[11px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]"
          data-testid="button-add-on-date"
        >
          <Plus size={14} /> {tx('Add an exam on this day')}
        </button>
      </div>
    </div>
  );
}
