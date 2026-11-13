// Stage 22A: YKS exam mode (TYT) inside Quiz Center. Timed mini (30 questions, 41 min) or full (120 questions, 165 min)
// exam with five options, net per test (correct − wrong ÷ 4) and an explained review. No scores, rankings or estimates.
// Saved only in this browser under EXAM_STORAGE_KEY (last 20 results + the exam in progress, so a reload does not lose it).
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Eraser, Flag, GraduationCap } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import type { MessageKey } from '@/i18n/translations-en';
import { SECTION_OF, TYT_BY_ID, TYT_LETTERS, type TytLetter, type TytQuestion, type TytSection, type TytSubject } from './tyt-bank';
import {
  EXAM_PLAN,
  EXAM_STORAGE_KEY,
  SECTION_ORDER,
  addResult,
  formatClock,
  readExamData,
  roundFor,
  scoreExam,
  secondsLeft,
  startExam,
  type ExamData,
  type ExamKind,
  type ExamResult,
  type RunningExam,
} from './exam-mode-model';

const SECTION_KEY: Record<TytSection, MessageKey> = {
  turkce: 'exam.section.turkce',
  sosyal: 'exam.section.sosyal',
  matematik: 'exam.section.matematik',
  fen: 'exam.section.fen',
};
const SUBJECT_KEY: Record<TytSubject, MessageKey> = {
  turkce: 'exam.subject.turkce',
  tarih: 'exam.subject.tarih',
  cografya: 'exam.subject.cografya',
  felsefe: 'exam.subject.felsefe',
  din: 'exam.subject.din',
  matematik: 'exam.subject.matematik',
  fizik: 'exam.subject.fizik',
  kimya: 'exam.subject.kimya',
  biyoloji: 'exam.subject.biyoloji',
};
const KIND_KEY: Record<ExamKind, MessageKey> = { 'tyt-mini': 'exam.kind.mini', 'tyt-full': 'exam.kind.full' };

const button =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[13px] font-bold text-[#4c6a8c] transition-colors hover:border-[#b9c7d6] disabled:cursor-not-allowed disabled:opacity-45';
const primary =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#54769d] px-5 text-[13px] font-bold text-white transition-colors hover:bg-[#4d6c91]';

function loadData() {
  try {
    return readExamData(window.localStorage.getItem(EXAM_STORAGE_KEY));
  } catch {
    return { data: { version: 1 as const, results: [], current: null }, canSave: false };
  }
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    const onVisible = () => setNow(new Date());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [active]);
  return now;
}

export function ExamMode({ onActiveChange }: { onActiveChange: (active: boolean) => void }) {
  const { t } = useI18n();
  const [initial] = useState(loadData);
  const canSave = useRef(initial.canSave);
  const [data, setData] = useState<ExamData>(() => {
    // An exam whose time ran out while the page was closed is finished and saved as it was.
    const current = initial.data.current;
    if (current && secondsLeft(current) === 0) return addResult(initial.data, scoreExam(current, new Date(current.endsAt), true));
    return initial.data;
  });
  const [openResultId, setOpenResultId] = useState<string | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(!initial.canSave);

  // Nothing is written by just visiting the page: only after an exam starts or finishes.
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      if (data === initial.data) return;
    }
    if (!canSave.current) return;
    try {
      window.localStorage.setItem(EXAM_STORAGE_KEY, JSON.stringify(data));
    } catch {
      canSave.current = false;
      setStorageBlocked(true);
    }
  }, [data]);

  const running = data.current;
  useEffect(() => {
    onActiveChange(Boolean(running || openResultId));
  }, [running, openResultId, onActiveChange]);

  function begin(kind: ExamKind) {
    setData((current) => ({ ...current, current: startExam(kind, roundFor(current, kind)) }));
    window.requestAnimationFrame(() => document.getElementById('exam-mode')?.scrollIntoView({ block: 'start' }));
  }

  function finish(timedOut: boolean) {
    if (!data.current) return;
    const result = scoreExam(data.current, new Date(), timedOut);
    setData((current) => addResult(current, result));
    setOpenResultId(result.id);
    window.requestAnimationFrame(() => document.getElementById('exam-mode')?.scrollIntoView({ block: 'start' }));
  }

  const openResult = openResultId ? data.results.find((r) => r.id === openResultId) ?? null : null;

  return (
    <section id="exam-mode" className="scroll-mt-24 rounded-[10px] border border-[#ddd5c6] bg-[#fffdf8] p-5 sm:p-6" data-testid="exam-mode">
      {storageBlocked && (
        <p className="mb-4 rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] px-4 py-3 text-[12px] text-[#69502e]" role="alert" data-testid="exam-storage-note">
          {t('exam.storageBlocked')}
        </p>
      )}
      {running ? (
        <ExamRunner
          exam={running}
          onChange={(exam) => setData((current) => ({ ...current, current: exam }))}
          onFinish={finish}
        />
      ) : openResult ? (
        <ExamResultView result={openResult} onBack={() => setOpenResultId(null)} onNew={() => setOpenResultId(null)} />
      ) : (
        <ExamHome results={data.results} onStart={begin} onOpen={setOpenResultId} />
      )}
      <span className="sr-only">{t('exam.title')}</span>
    </section>
  );
}

// ---------- start screen and saved results ----------

function useNumber() {
  const { lang } = useI18n();
  return (value: number) => value.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { maximumFractionDigits: 2 });
}

function ExamHome({ results, onStart, onOpen }: { results: ExamResult[]; onStart: (kind: ExamKind) => void; onOpen: (id: string) => void }) {
  const { t, lang } = useI18n();
  const fmt = useNumber();
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#8a5a3c]">{t('exam.eyebrow')}</p>
          <h2 className="font-display mt-1 text-[24px] font-extrabold text-[#2b3a49]">{t('exam.title')}</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#ddd5c6] bg-[#fbf8f1] px-2.5 py-1 text-[12px] font-semibold text-[#4b698c]">
          <GraduationCap size={14} aria-hidden="true" /> {t('exam.badge')}
        </span>
      </div>
      <p className="mt-3 max-w-[680px] text-[13px] leading-[1.7] text-[#4f5a64]">{t('exam.intro')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(['tyt-mini', 'tyt-full'] as const).map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onStart(kind)}
            className="flex min-h-[88px] flex-col items-start justify-center rounded-[8px] border border-[#ddd5c6] bg-[#fbf8f1] px-4 py-3 text-left transition-colors hover:border-[#5376a0]"
            data-testid={`button-exam-start-${kind === 'tyt-mini' ? 'mini' : 'full'}`}
          >
            <span className="text-[15px] font-bold text-[#2b3a49]">{t(KIND_KEY[kind])}</span>
            <span className="mt-1 text-[12px] text-[#4f5a64]">
              {t('exam.kindInfo', { count: EXAM_PLAN[kind].questions, minutes: EXAM_PLAN[kind].minutes })}
            </span>
            <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#4c6a8c]">
              {t('exam.start')} <ArrowRight size={14} aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-[#5f676f]" data-testid="exam-note">{t('exam.note')}</p>

      <h3 className="font-display mt-6 text-[17px] font-bold text-[#2b3a49]">{t('exam.historyTitle')}</h3>
      {results.length === 0 ? (
        <p className="mt-2 text-[12px] text-[#5f676f]" data-testid="exam-history-empty">{t('exam.historyEmpty')}</p>
      ) : (
        <ul className="mt-2 space-y-2" data-testid="exam-history">
          {results.map((result) => (
            <li key={result.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#ddd5c6] px-3 py-2.5" data-testid="exam-history-item">
              <span className="min-w-0 text-[13px] text-[#2b3a49]">
                <span className="font-bold">{t(KIND_KEY[result.kind])}</span>
                <span className="text-[#5f676f]"> · {new Date(result.finishedAt).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long' })}</span>
                <span className="block text-[12px] text-[#4f5a64]">
                  {result.sections.map((s) => `${t(SECTION_KEY[s.section])} ${fmt(s.net)}`).join(' · ')}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-bold text-[#2f6b59]">{t('exam.totalNetShort', { net: fmt(result.totalNet) })}</span>
                <button type="button" className={button} onClick={() => onOpen(result.id)} data-testid="button-exam-open">
                  {t('exam.open')}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------- taking the exam ----------

function ExamRunner({ exam, onChange, onFinish }: { exam: RunningExam; onChange: (exam: RunningExam) => void; onFinish: (timedOut: boolean) => void }) {
  const { t } = useI18n();
  const now = useNow(true);
  const left = secondsLeft(exam, now);
  const [confirming, setConfirming] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (left === 0 && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(true);
    }
  }, [left, onFinish]);

  const questions = useMemo(() => exam.questionIds.map((id) => TYT_BY_ID.get(id)).filter((q): q is TytQuestion => Boolean(q)), [exam.questionIds]);
  const index = Math.min(exam.currentIndex, questions.length - 1);
  const question = questions[index];
  const section = SECTION_OF[question.subject];
  const answered = Object.keys(exam.answers).filter((id) => exam.questionIds.includes(id)).length;
  const blank = questions.length - answered;

  const go = (next: number) => {
    setConfirming(false);
    onChange({ ...exam, currentIndex: Math.max(0, Math.min(questions.length - 1, next)) });
  };
  const choose = (letter: TytLetter) => onChange({ ...exam, answers: { ...exam.answers, [question.id]: letter } });
  const clear = () => {
    const answers = { ...exam.answers };
    delete answers[question.id];
    onChange({ ...exam, answers });
  };

  const sectionStart = (s: TytSection) => questions.findIndex((q) => SECTION_OF[q.subject] === s);
  const inSection = questions.map((q, i) => ({ q, i })).filter(({ q }) => SECTION_OF[q.subject] === section);
  const lowTime = left <= 300;

  return (
    <div data-testid="exam-runner">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] bg-[#2f4255] px-4 py-3 text-white">
        <div>
          <p className="text-[15px] font-bold">{t(EXAM_KIND_TITLE[exam.kind])}</p>
          <p className="text-[12px] text-[#d8e1ea]">{t('exam.answeredOf', { answered, total: questions.length })}</p>
        </div>
        <p
          className={`inline-flex items-center gap-2 text-[24px] font-extrabold tabular-nums ${lowTime ? 'text-[#ffd9c7]' : ''}`}
          role="timer"
          aria-label={t('exam.timeLeft', { time: formatClock(left) })}
          data-testid="exam-timer"
        >
          <Clock3 size={20} aria-hidden="true" /> {formatClock(left)}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label={t('exam.sectionsLabel')}>
        {SECTION_ORDER.filter((s) => sectionStart(s) >= 0).map((s) => {
          const items = questions.filter((q) => SECTION_OF[q.subject] === s);
          const done = items.filter((q) => exam.answers[q.id]).length;
          const selected = s === section;
          return (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => go(sectionStart(s))}
              className={`min-h-10 rounded-[6px] border px-3 text-[13px] font-bold ${selected ? 'border-[#5376a0] bg-[#eef2f6] text-[#2f4c6e]' : 'border-[#ddd5c6] bg-[#fffdf8] text-[#4f5b66]'}`}
              data-testid={`exam-tab-${s}`}
            >
              {t(SECTION_KEY[s])} <span className="font-semibold text-[#5f676f]">{done}/{items.length}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-8 gap-1.5 sm:grid-cols-10" aria-label={t('exam.gridLabel')}>
        {inSection.map(({ q, i }) => {
          const isCurrent = i === index;
          const isAnswered = Boolean(exam.answers[q.id]);
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => go(i)}
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={t(isAnswered ? 'exam.gridAnswered' : 'exam.gridBlank', { number: i + 1 })}
              className={`min-h-9 rounded-[6px] border text-[12px] font-bold tabular-nums ${
                isCurrent ? 'border-[#2f4c6e] ring-2 ring-[#5376a0]' : 'border-[#ddd5c6]'
              } ${isAnswered ? 'bg-[#e4ebf3] text-[#2f4c6e]' : 'bg-[#fffdf8] text-[#4f5b66]'}`}
              data-testid={`exam-grid-${i + 1}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <article className="mt-4 rounded-[8px] border border-[#ddd5c6] p-4 sm:p-5" data-testid="exam-question" data-question={question.id}>
        <p className="text-[12px] font-semibold text-[#4b698c]">
          {t('exam.questionOf', { number: index + 1, total: questions.length })} · {t(SUBJECT_KEY[question.subject])} · {question.topic}
        </p>
        {question.passage && <p className="mt-3 whitespace-pre-line text-[15px] leading-[1.75] text-[#2b3a49]" data-testid="exam-passage">{question.passage}</p>}
        <p className="mt-3 text-[16px] font-bold leading-[1.6] text-[#2b3a49]">{question.prompt}</p>
        <div className="mt-4 grid gap-2" role="radiogroup" aria-label={t('exam.optionsLabel')}>
          {question.options.map((text, k) => {
            const letter = TYT_LETTERS[k];
            const selected = exam.answers[question.id] === letter;
            return (
              <button
                key={letter}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(letter)}
                className={`flex min-h-12 items-start gap-3 rounded-[8px] border px-3 py-2.5 text-left text-[14px] leading-relaxed transition-colors ${
                  selected ? 'border-[#5376a0] bg-[#eef2f6] text-[#2b3a49]' : 'border-[#ddd5c6] bg-[#fffdf8] text-[#2b3a49] hover:border-[#b9c7d6]'
                }`}
                data-testid={`exam-option-${letter}`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold ${selected ? 'bg-[#54769d] text-white' : 'bg-[#f1ece2] text-[#4f5b66]'}`}>{letter}</span>
                <span className="pt-0.5">{text}</span>
              </button>
            );
          })}
        </div>
      </article>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={button} onClick={() => go(index - 1)} disabled={index === 0} data-testid="button-exam-prev">
            <ArrowLeft size={15} aria-hidden="true" /> {t('exam.prev')}
          </button>
          <button type="button" className={button} onClick={clear} disabled={!exam.answers[question.id]} data-testid="button-exam-clear">
            <Eraser size={15} aria-hidden="true" /> {t('exam.clear')}
          </button>
          <button type="button" className={button} onClick={() => go(index + 1)} disabled={index === questions.length - 1} data-testid="button-exam-next">
            {t('exam.next')} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
        <button type="button" className={primary} onClick={() => setConfirming(true)} data-testid="button-exam-finish">
          <Flag size={15} aria-hidden="true" /> {t('exam.finish')}
        </button>
      </div>

      {confirming && (
        <div className="mt-3 rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] p-4" role="alertdialog" aria-label={t('exam.finish')} data-testid="exam-finish-confirm">
          <p className="text-[13px] font-bold text-[#69502e]">
            {blank > 0 ? t('exam.confirmBlank', { blank }) : t('exam.confirmAll')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => onFinish(false)} data-testid="button-exam-finish-confirm">
              {t('exam.confirmYes')}
            </button>
            <button type="button" className={button} onClick={() => setConfirming(false)} data-testid="button-exam-finish-cancel">
              {t('exam.confirmNo')}
            </button>
          </div>
        </div>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-[#5f676f]">{t('exam.runningNote')}</p>
    </div>
  );
}

const EXAM_KIND_TITLE: Record<ExamKind, MessageKey> = { 'tyt-mini': 'exam.kind.mini', 'tyt-full': 'exam.kind.full' };

// ---------- results and review ----------

type ReviewFilter = 'all' | 'wrong' | 'blank';

function ExamResultView({ result, onBack, onNew }: { result: ExamResult; onBack: () => void; onNew: () => void }) {
  const { t, lang } = useI18n();
  const fmt = useNumber();
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const totals = result.sections.reduce(
    (a, s) => ({ total: a.total + s.total, correct: a.correct + s.correct, wrong: a.wrong + s.wrong, blank: a.blank + s.blank }),
    { total: 0, correct: 0, wrong: 0, blank: 0 },
  );
  const items = result.questionIds
    .flatMap((id, i) => {
      const q = TYT_BY_ID.get(id);
      const chosen: TytLetter | undefined = result.answers[id];
      return q ? [{ q, i, chosen }] : [];
    })
    .filter(({ q, chosen }) => (filter === 'wrong' ? Boolean(chosen) && chosen !== q.answer : filter === 'blank' ? !chosen : true));

  return (
    <div data-testid="exam-result">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#8a5a3c]">{t('exam.resultEyebrow')}</p>
          <h2 className="font-display mt-1 text-[22px] font-extrabold text-[#2b3a49]">{t(KIND_KEY[result.kind])}</h2>
          <p className="mt-1 text-[12px] text-[#5f676f]">
            {new Date(result.finishedAt).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <button type="button" className={button} onClick={onBack} data-testid="button-exam-back">
          <ArrowLeft size={15} aria-hidden="true" /> {t('exam.back')}
        </button>
      </div>
      {result.timedOut && (
        <p className="mt-3 rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] px-4 py-2.5 text-[13px] font-semibold text-[#69502e]" data-testid="exam-timed-out">
          {t('exam.timedOut')}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px] tabular-nums">
          <thead>
            <tr className="text-left text-[12px] text-[#4f5a64]">
              <th className="border-b border-[#ddd5c6] py-2 pr-2 font-semibold">{t('exam.colTest')}</th>
              {(['colQuestions', 'colCorrect', 'colWrong', 'colBlank', 'colNet'] as const).map((k) => (
                <th key={k} className="border-b border-[#ddd5c6] px-2 py-2 text-right font-semibold">{t(`exam.${k}` as MessageKey)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.sections.map((s) => (
              <tr key={s.section} data-testid={`exam-result-row-${s.section}`}>
                <td className="border-b border-[#eee7da] py-2 pr-2 font-semibold text-[#2b3a49]">{t(SECTION_KEY[s.section])}</td>
                <td className="border-b border-[#eee7da] px-2 py-2 text-right">{s.total}</td>
                <td className="border-b border-[#eee7da] px-2 py-2 text-right text-[#2f6b59]">{s.correct}</td>
                <td className="border-b border-[#eee7da] px-2 py-2 text-right text-[#8f5847]">{s.wrong}</td>
                <td className="border-b border-[#eee7da] px-2 py-2 text-right">{s.blank}</td>
                <td className="border-b border-[#eee7da] px-2 py-2 text-right font-bold">{fmt(s.net)}</td>
              </tr>
            ))}
            <tr className="bg-[#f3efe6]" data-testid="exam-total-row">
              <td className="py-2 pl-1 pr-2 font-bold text-[#2b3a49]">{t('exam.total')}</td>
              <td className="px-2 py-2 text-right font-bold">{totals.total}</td>
              <td className="px-2 py-2 text-right font-bold text-[#2f6b59]">{totals.correct}</td>
              <td className="px-2 py-2 text-right font-bold text-[#8f5847]">{totals.wrong}</td>
              <td className="px-2 py-2 text-right font-bold">{totals.blank}</td>
              <td className="px-2 py-2 text-right text-[15px] font-extrabold" data-testid="exam-total-net">{fmt(result.totalNet)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[12px] leading-relaxed text-[#5f676f]" data-testid="exam-net-note">{t('exam.netNote')}</p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-[17px] font-bold text-[#2b3a49]">{t('exam.reviewTitle')}</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t('exam.reviewTitle')}>
          {(['all', 'wrong', 'blank'] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={`min-h-9 rounded-[6px] border px-3 text-[12px] font-bold ${filter === f ? 'border-[#5376a0] bg-[#eef2f6] text-[#2f4c6e]' : 'border-[#ddd5c6] bg-[#fffdf8] text-[#4f5b66]'}`}
              data-testid={`button-exam-review-${f}`}
            >
              {t(`exam.filter.${f}` as MessageKey)}
            </button>
          ))}
        </div>
      </div>
      {items.length === 0 && <p className="mt-3 text-[12px] text-[#5f676f]">{t('exam.reviewEmpty')}</p>}
      <div className="mt-3 space-y-3">
        {items.map(({ q, i, chosen }) => {
          const correct = chosen === q.answer;
          return (
            <article key={q.id} className="rounded-[8px] border border-[#ddd5c6] p-4" data-testid="exam-review-item">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-semibold text-[#4b698c]">
                  {t('exam.questionOf', { number: i + 1, total: result.questionIds.length })} · {t(SUBJECT_KEY[q.subject])} · {q.topic}
                </p>
                <span className={`text-[12px] font-bold ${!chosen ? 'text-[#5f676f]' : correct ? 'text-[#2f6b59]' : 'text-[#8f5847]'}`}>
                  {!chosen ? t('exam.markBlank') : correct ? t('exam.markCorrect') : t('exam.markWrong')}
                </span>
              </div>
              {q.passage && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[12px] font-bold text-[#4c6a8c]">{t('exam.showPassage')}</summary>
                  <p className="mt-2 text-[14px] leading-[1.7] text-[#2b3a49]">{q.passage}</p>
                </details>
              )}
              <p className="mt-2 text-[14px] font-bold leading-relaxed text-[#2b3a49]">{q.prompt}</p>
              <ul className="mt-2 grid gap-1.5">
                {q.options.map((text, k) => {
                  const letter = TYT_LETTERS[k];
                  const isAnswer = letter === q.answer;
                  const isChosenWrong = letter === chosen && !isAnswer;
                  return (
                    <li
                      key={letter}
                      className={`rounded-[8px] border px-3 py-2 text-[13px] ${
                        isAnswer ? 'border-[#a9cfc0] bg-[#eef6f2] font-semibold text-[#2f6b59]' : isChosenWrong ? 'border-[#e6c3b8] bg-[#fcf2ef] text-[#8f5847]' : 'border-[#eee7da] text-[#4f5a64]'
                      }`}
                    >
                      <span className="font-bold">{letter})</span> {text}
                      {isAnswer && <span className="ml-1 font-bold">{t('exam.correctMark')}</span>}
                      {isChosenWrong && <span className="ml-1 font-bold">{t('exam.yourAnswerMark')}</span>}
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-[13px] leading-relaxed text-[#4f5a64]">
                <span className="font-bold text-[#2b3a49]">{t('exam.explanation')}</span> {q.explanation}
              </p>
            </article>
          );
        })}
      </div>
      <div className="mt-4">
        <button type="button" className={primary} onClick={onNew} data-testid="button-exam-new">
          <CheckCircle2 size={15} aria-hidden="true" /> {t('exam.newExam')}
        </button>
      </div>
    </div>
  );
}
