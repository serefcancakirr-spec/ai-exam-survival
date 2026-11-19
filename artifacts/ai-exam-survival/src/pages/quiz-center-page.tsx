import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Compass,
  RotateCcw,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link } from 'wouter';
import { FooterAboutLink } from './about-page';
import {
  ALL_QUIZ_TOPICS,
  getQuizQuestionPool,
  getQuizSubjects,
  getQuizTopics,
  QUIZ_GRADES,
  QUIZ_QUESTION_COUNTS,
  QUIZ_SUBJECTS,
  GENERAL_LEVEL,
  type QuizLevel,
  type QuizDifficulty,
  type QuizGrade,
  type QuizOptionId,
  type QuizQuestion,
  type QuizQuestionCount,
  type QuizSubject,
} from './quiz-question-bank';
import { Menti } from '@/components/menti';
import { quizMood } from '@/components/menti-moods';
import { localizeQuestion, topicName } from '@/i18n/content';
import { mebOutcome, usesMeb } from './quiz-bank-meb';
import { ENGLISH_LEVELS, SUGGESTED_LEVEL, englishFocus } from './quiz-bank-english';
import { PassageBlock } from './english-passage-view';
import { ExamMode } from './exam-mode';
import { useI18n } from '@/i18n/i18n';
import type { MessageKey } from '@/i18n/translations-en';

const QUIZ_HISTORY_STORAGE_KEY = 'ai-exam-survival:quiz-center:v1';
const MAX_SAVED_ATTEMPTS = 30;
const DIFFICULTY_KEYS: Record<QuizDifficulty, MessageKey> = {
  easy: 'difficulty.easy',
  medium: 'difficulty.medium',
  hard: 'difficulty.hard',
};

const selectClassName =
  'mt-2 w-full rounded-[12px] border border-[#dee8e5] bg-[#ffffff] px-3.5 py-3 text-[13px] text-[#235355] outline-none transition focus:border-[#37aea6] focus:ring-2 focus:ring-[#37aea6]/10';

type QuizSetup = {
  grade: QuizGrade;
  subject: QuizSubject;
  /** Stage 21A: English level (A1–C1 or the older general questions). Not saved; only used to pick questions. */
  level: QuizLevel;
  topic: string;
  difficulty: QuizDifficulty;
  questionCount: QuizQuestionCount;
};

type QuizAnswerReview = {
  question: QuizQuestion;
  selectedOptionId: QuizOptionId;
};

type QuizAttempt = {
  id: string;
  grade: QuizGrade;
  subject: QuizSubject;
  topic: string;
  difficulty: QuizDifficulty;
  questionCount: QuizQuestionCount;
  score: number;
  percentage: number;
  completedAt: string;
  review: QuizAnswerReview[];
};

type Notice = {
  tone: 'success' | 'error' | 'info';
  key: MessageKey;
  vars?: Record<string, string | number>;
  /** Some notices pick singular/plural wording from a count. */
  plural?: { base: string; count: number };
  /** vars.subject is a saved subject name that should be shown in the current language. */
  subjectVar?: boolean;
};

type StorageLoadResult = {
  attempts: QuizAttempt[];
  message: MessageKey | '';
  canPersist: boolean;
};

const DEFAULT_SETUP: QuizSetup = {
  grade: '9',
  subject: 'English',
  level: SUGGESTED_LEVEL['9'],
  topic: ALL_QUIZ_TOPICS,
  difficulty: 'medium',
  questionCount: 5,
};

/** The English level filter for this setup (other subjects have no levels). */
function levelFilter(setup: Pick<QuizSetup, 'subject' | 'level'>): QuizLevel | undefined {
  return setup.subject === 'English' ? setup.level : undefined;
}

/** The topic saved with a quiz result: a whole English level is saved as its level name (e.g. "B1"). */
function savedTopic(setup: Pick<QuizSetup, 'subject' | 'level' | 'topic'>) {
  const level = levelFilter(setup);
  return setup.topic === ALL_QUIZ_TOPICS && level && level !== GENERAL_LEVEL ? level : setup.topic;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isOptionId(value: unknown): value is QuizOptionId {
  return value === 'A' || value === 'B' || value === 'C' || value === 'D';
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.grade === 'string' &&
    typeof value.subject === 'string' &&
    typeof value.topic === 'string' &&
    (value.difficulty === 'easy' ||
      value.difficulty === 'medium' ||
      value.difficulty === 'hard') &&
    typeof value.prompt === 'string' &&
    typeof value.explanation === 'string' &&
    isOptionId(value.correctOptionId) &&
    Array.isArray(value.options) &&
    value.options.length === 4 &&
    value.options.every(
      (option) =>
        isRecord(option) &&
        isOptionId(option.id) &&
        typeof option.text === 'string',
    )
  );
}

function isQuizAttempt(value: unknown): value is QuizAttempt {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    (QUIZ_GRADES as readonly unknown[]).includes(value.grade) &&
    (QUIZ_SUBJECTS as readonly unknown[]).includes(value.subject) &&
    typeof value.topic === 'string' &&
    (value.difficulty === 'easy' ||
      value.difficulty === 'medium' ||
      value.difficulty === 'hard') &&
    QUIZ_QUESTION_COUNTS.includes(value.questionCount as QuizQuestionCount) &&
    typeof value.score === 'number' &&
    Number.isInteger(value.score) &&
    typeof value.percentage === 'number' &&
    Number.isFinite(value.percentage) &&
    typeof value.completedAt === 'string' &&
    !Number.isNaN(Date.parse(value.completedAt)) &&
    Array.isArray(value.review) &&
    value.review.length === value.questionCount &&
    value.review.every(
      (item) =>
        isRecord(item) &&
        isQuizQuestion(item.question) &&
        isOptionId(item.selectedOptionId),
    )
  );
}

function loadQuizAttempts(): StorageLoadResult {
  if (typeof window === 'undefined') {
    return { attempts: [], message: '', canPersist: false };
  }

  try {
    const saved = window.localStorage.getItem(QUIZ_HISTORY_STORAGE_KEY);
    if (!saved) return { attempts: [], message: '', canPersist: true };

    const parsed: unknown = JSON.parse(saved);
    if (
      !Array.isArray(parsed) ||
      !parsed.every(isQuizAttempt) ||
      parsed.length > MAX_SAVED_ATTEMPTS
    ) {
      return {
        attempts: [],
        message: 'quiz.storageUnreadable',
        canPersist: false,
      };
    }

    return { attempts: parsed, message: '', canPersist: true };
  } catch {
    return {
      attempts: [],
      message: 'quiz.storageUnavailable',
      canPersist: false,
    };
  }
}

function createAttemptId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatAttemptDate(value: string, locale: string | undefined) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function getOptionText(question: QuizQuestion, optionId: QuizOptionId) {
  return question.options.find((option) => option.id === optionId)?.text ?? '';
}

function NoticeBanner({ notice }: { notice: Notice }) {
  const { t, tn, subject: subjectLabel } = useI18n();
  const vars =
    notice.subjectVar && notice.vars
      ? { ...notice.vars, subject: subjectLabel(String(notice.vars.subject)) }
      : notice.vars;
  const styles = {
    success: 'border-[#c1e8d5] bg-[#eff7f5] text-[#236e49]',
    error: 'border-[#ecd5d5] bg-[#fef7f7] text-[#8f5252]',
    info: 'border-[#bcece6] bg-[#f0fbfa] text-[#26726c]',
  };

  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={`rounded-[20px] border px-4 py-3 text-[12px] font-semibold leading-relaxed ${styles[notice.tone]}`}
      data-testid={`quiz-notice-${notice.tone}`}
    >
      {notice.plural
        ? tn(notice.plural.base, notice.plural.count, vars)
        : t(notice.key, vars)}
    </div>
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
  trailing,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <section className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#26716c]">
            {eyebrow}
          </p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.015em] text-[#1f4b4c] sm:text-[22px]">
            {title}
          </h2>
        </div>
        {trailing}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function QuizSetupCard({
  setup,
  onChange,
  onStart,
  notice,
}: {
  setup: QuizSetup;
  onChange: (patch: Partial<QuizSetup>) => void;
  onStart: () => void;
  notice: Notice | null;
}) {
  const { t, lang, subject: subjectLabel } = useI18n();
  const questionPool = getQuizQuestionPool(
    setup.grade,
    setup.subject,
    setup.topic,
    setup.difficulty,
    levelFilter(setup),
  );
  const topics = getQuizTopics(setup.grade, setup.subject, levelFilter(setup));
  const difficultyOptions: QuizDifficulty[] = ['easy', 'medium', 'hard'];
  const level = levelFilter(setup);
  const topicLabel =
    setup.topic === ALL_QUIZ_TOPICS
      ? level && level !== GENERAL_LEVEL
        ? t('quiz.levelAllTopics', { level })
        : t('quiz.allTopics')
      : topicName(setup.topic, lang);

  return (
    <SectionCard
      eyebrow={t('quiz.setupEyebrow')}
      title={t('quiz.setupTitle')}
      trailing={
        <span className="rounded-full bg-[#daf5f2] px-3 py-1.5 text-[10px] font-bold text-[#26716c]">
          {t('quiz.curated')}
        </span>
      }
    >
      {notice && <NoticeBanner notice={notice} />}
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <label className="block text-[11px] font-bold text-[#4d5c63]" htmlFor="quiz-grade">
          {t('quiz.gradeLevel')}
          <select
            id="quiz-grade"
            className={selectClassName}
            value={setup.grade}
            onChange={(event) =>
              onChange({
                grade: event.target.value as QuizGrade,
                // Stage 21A: a new grade gets its suggested English level
                level: SUGGESTED_LEVEL[event.target.value as QuizGrade],
              })
            }
            data-testid="select-quiz-grade"
          >
            {QUIZ_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {t('common.grade', { grade })}
              </option>
            ))}
          </select>
        </label>

        <label
          className="block text-[11px] font-bold text-[#4d5c63]"
          htmlFor="quiz-subject"
        >
          {t('quiz.subject')}
          <select
            id="quiz-subject"
            className={selectClassName}
            value={setup.subject}
            onChange={(event) =>
              onChange({
                subject: event.target.value as QuizSubject,
                level: SUGGESTED_LEVEL[setup.grade],
                topic: ALL_QUIZ_TOPICS,
              })
            }
            data-testid="select-quiz-subject"
          >
            {getQuizSubjects(setup.grade).map((subject) => (
              <option key={subject} value={subject}>
                {subjectLabel(subject)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[11px] font-bold text-[#4d5c63]" htmlFor="quiz-topic">
          {t('quiz.topic')}
          <select
            id="quiz-topic"
            className={selectClassName}
            value={setup.topic}
            onChange={(event) => onChange({ topic: event.target.value })}
            data-testid="select-quiz-topic"
          >
            <option value={ALL_QUIZ_TOPICS}>{t('quiz.allTopics')}</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topicName(topic, lang)}
              </option>
            ))}
          </select>
        </label>

        <label
          className="block text-[11px] font-bold text-[#4d5c63]"
          htmlFor="quiz-difficulty"
        >
          {t('quiz.difficultyTarget')}
          <select
            id="quiz-difficulty"
            className={selectClassName}
            value={setup.difficulty}
            onChange={(event) =>
              onChange({
                difficulty: event.target.value as QuizDifficulty,
              })
            }
            data-testid="select-quiz-difficulty"
          >
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {t(DIFFICULTY_KEYS[difficulty])}
              </option>
            ))}
          </select>
        </label>
      </div>

      {setup.subject === 'English' && (
        <fieldset className="mt-5" data-testid="quiz-level-picker">
          <legend className="text-[11px] font-bold text-[#4d5c63]">{t('quiz.level')}</legend>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {[...ENGLISH_LEVELS, GENERAL_LEVEL].map((option) => {
              const selected = setup.level === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onChange({ level: option as QuizLevel, topic: ALL_QUIZ_TOPICS })}
                  className={`min-h-11 rounded-[12px] border px-2 text-[13px] font-bold transition-colors ${
                    selected
                      ? 'border-[#2a7f7a] bg-[#e2f5f3] text-[#225253]'
                      : 'border-[#dee8e5] bg-[#ffffff] text-[#4d5c63] hover:border-[#7fd4ce]'
                  }`}
                  data-testid={`button-quiz-level-${option.toLowerCase()}`}
                >
                  {option === GENERAL_LEVEL ? t('quiz.levelGeneral') : option}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-[#586871]" data-testid="quiz-level-note">
            {t('quiz.levelSuggested', { grade: setup.grade, level: SUGGESTED_LEVEL[setup.grade] })}{' '}
            {t('quiz.levelNote')}
          </p>
        </fieldset>
      )}

      <fieldset className="mt-5">
        <legend className="text-[11px] font-bold text-[#4d5c63]">
          {t('quiz.numberOfQuestions')}
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {QUIZ_QUESTION_COUNTS.map((count) => {
            const isAvailable = count <= questionPool.length;
            const isSelected = setup.questionCount === count;
            return (
              <label
                key={count}
                className={`relative flex min-h-[58px] cursor-pointer items-center justify-center rounded-[20px] border text-[13px] font-extrabold transition ${
                  !isAvailable
                    ? 'cursor-not-allowed border-[#e9f4f2] bg-[#f5faf9] text-[#62747c]'
                    : isSelected
                      ? 'border-[#37aea6] bg-[#f0fbfa] text-[#26726d]'
                      : 'border-[#dee8e5] bg-[#ffffff] text-[#5a6b73] hover:border-[#a6e1de]'
                }`}
              >
                <input
                  type="radio"
                  name="quiz-question-count"
                  value={count}
                  checked={isSelected}
                  disabled={!isAvailable}
                  onChange={() =>
                    onChange({ questionCount: count as QuizQuestionCount })
                  }
                  className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  data-testid={`radio-quiz-count-${count}`}
                />
                <span aria-hidden="true">{count}</span>
                <span className="sr-only">
                  {t('quiz.countQuestions', { count })}
                  {!isAvailable ? t('quiz.notEnough') : ''}
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-[#586871]">
          {t('quiz.poolInfo', { count: questionPool.length })}
        </p>
      </fieldset>

      {usesMeb(setup.grade, setup.subject) && (
        <p
          className="mt-5 rounded-[12px] border border-[#d6ede2] bg-[#f2f9f7] px-4 py-3 text-[11px] leading-relaxed text-[#2f6e4f]"
          data-testid="quiz-meb-note"
        >
          {t('quiz.mebNote', { grade: setup.grade })}
        </p>
      )}

      <div className="mt-5 rounded-[12px] bg-[#f2f9f7] px-4 py-3 text-[11px] leading-relaxed text-[#586871]">
        <span className="font-bold text-[#4d5c63]">{t('quiz.previewLabel')}</span>{' '}
        {t('quiz.previewText', {
          grade: setup.grade,
          subject: subjectLabel(setup.subject),
          topic: topicLabel,
          difficulty: t(DIFFICULTY_KEYS[setup.difficulty]),
          count: setup.questionCount,
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[430px] text-[10px] leading-relaxed text-[#58676f]">
          {t('quiz.sampleNote')}
        </p>
        <button
          type="button"
          onClick={onStart}
          disabled={setup.questionCount > questionPool.length}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#2b807a] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#297a75] disabled:cursor-not-allowed disabled:opacity-45"
          data-testid="button-start-quiz"
        >
          {t('quiz.start')} <ArrowRight size={15} />
        </button>
      </div>
    </SectionCard>
  );
}

function QuizQuestionCard({
  question: rawQuestion,
  index,
  total,
  answeredCount,
  selectedOptionId,
  notice,
  onSelect,
  onPrevious,
  onNext,
  onSubmit,
}: {
  question: QuizQuestion;
  index: number;
  total: number;
  answeredCount: number;
  selectedOptionId: QuizOptionId | undefined;
  notice: Notice | null;
  onSelect: (optionId: QuizOptionId) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const { t, lang, subject: subjectLabel } = useI18n();
  const question = localizeQuestion(rawQuestion, lang);
  const progress = Math.round(((index + 1) / total) * 100);
  const isLastQuestion = index === total - 1;

  return (
    <SectionCard
      eyebrow={t('quiz.subjectGrade', { subject: subjectLabel(question.subject), grade: question.grade })}
      title={t('quiz.questionTitle', { number: index + 1 })}
      trailing={
        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
            question.difficulty === 'easy'
              ? 'bg-[#e9f6f0] text-[#236e49]'
              : question.difficulty === 'hard'
                ? 'bg-[#fdf3e8] text-[#9d5227]'
                : 'bg-[#eafaf8] text-[#26716c]'
          }`}
        >
          {t(DIFFICULTY_KEYS[question.difficulty])}
        </span>
      }
    >
      {notice && <div className="mb-4"><NoticeBanner notice={notice} /></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-[#586871]">
        <span>
          {t('quiz.questionOf', { number: index + 1, total })}
        </span>
        <span>{t('quiz.answeredOf', { answered: answeredCount, total })}</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#e7f2f1]"
        role="progressbar"
        aria-label={t('quiz.progressAria')}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        data-testid="quiz-progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2f8e87] to-[#368f62] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <PassageBlock question={question} mode="quiz" />
      <p className="mt-6 text-[16px] font-bold leading-[1.65] text-[#235355] sm:text-[18px]" data-content="quiz">
        {question.prompt}
      </p>
      <OutcomeTag question={question} />

      <div className="mt-5 grid gap-2.5">
        {question.options.map((option) => {
          const isSelected = selectedOptionId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(option.id)}
              className={`flex min-h-[54px] items-center gap-3 rounded-[14px] border px-3.5 text-left text-[12px] font-semibold leading-relaxed transition-colors sm:px-4 sm:text-[13px] ${
                isSelected
                  ? 'border-[#3dbeb6] bg-[#f0fbfa] text-[#26726d]'
                  : 'border-[#dee8e5] bg-[#ffffff] text-[#5a6b73] hover:border-[#a6e1de] hover:bg-[#fcfdfe]'
              }`}
              data-testid={`button-quiz-answer-${option.id}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                  isSelected
                    ? 'bg-[#2b807a] text-white'
                    : 'bg-[#eff7f6] text-[#58676f]'
                }`}
              >
                {option.id}
              </span>
              <span data-content="quiz">{option.text}</span>
            </button>
          );
        })}
      </div>

      <p
        aria-live="polite"
        className="mt-3 min-h-5 text-[10px] font-semibold text-[#586871]"
      >
        {selectedOptionId
          ? t('quiz.answerSelected')
          : t('quiz.chooseOne')}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e9f3f1] pt-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={index === 0}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-[#dbece9] px-4 text-[11px] font-bold text-[#586871] transition-colors hover:border-[#a6e1de] hover:text-[#26726d] disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="button-quiz-previous"
        >
          <ChevronLeft size={15} /> {t('quiz.previous')}
        </button>
        {isLastQuestion ? (
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-[#2b807a] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#297a75]"
            data-testid="button-submit-quiz"
          >
            {t('quiz.finish')} <CheckCircle2 size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-[10px] bg-[#2b807a] px-4 text-[11px] font-bold text-white transition-colors hover:bg-[#297a75]"
            data-testid="button-quiz-next"
          >
            {t('quiz.next')} <ChevronRight size={15} />
          </button>
        )}
      </div>
    </SectionCard>
  );
}

/** Stage 15: the MEB learning outcome a grade 9 question measures (nothing for other questions). */
function OutcomeTag({ question }: { question: QuizQuestion }) {
  const { t } = useI18n();
  const code = mebOutcome(question);
  const english = englishFocus(question);
  if (english) {
    return (
      <p className="mt-2 text-[11px] font-bold text-[#26716c]" data-testid="quiz-english-focus">
        {t('quiz.englishFocus', { level: english.level, focus: english.focus })}
      </p>
    );
  }
  if (!code) return null;
  return (
    <p className="mt-2 text-[10px] font-bold text-[#2f6e4f]" data-testid="quiz-meb-outcome">
      {t('quiz.mebOutcome', { code })}
    </p>
  );
}

function ReviewList({ items }: { items: QuizAnswerReview[] }) {
  const { t, lang } = useI18n();
  return (
    <div className="space-y-3">
      {items.map(({ question: savedQuestion, selectedOptionId }, index) => {
        const question = localizeQuestion(savedQuestion, lang);
        const isCorrect = selectedOptionId === question.correctOptionId;
        return (
          <article
            key={`${question.id}-${index}`}
            className="rounded-[12px] border border-[#dee8e5] bg-[#ffffff] p-4 sm:p-5"
            data-testid="quiz-review-question"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#586871]">
                {t('quiz.reviewQuestion', { number: index + 1, topic: topicName(question.topic, lang) })}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                  isCorrect
                    ? 'bg-[#e9f6f0] text-[#236e49]'
                    : 'bg-[#fdf3e8] text-[#9d5227]'
                }`}
              >
                {isCorrect ? t('quiz.correctBadge') : t('quiz.reviewThis')}
              </span>
            </div>
            <PassageBlock question={question} mode="review" />
            <p className="mt-3 text-[13px] font-bold leading-relaxed text-[#235355]" data-content="quiz">
              {question.prompt}
            </p>
            <OutcomeTag question={question} />
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const isAnswer = option.id === question.correctOptionId;
                const isChosenWrong =
                  option.id === selectedOptionId && !isAnswer;
                return (
                  <div
                    key={option.id}
                    className={`rounded-[16px] border px-3 py-2.5 text-[10px] leading-relaxed ${
                      isAnswer
                        ? 'border-[#b6e0cb] bg-[#f1f8f6] font-semibold text-[#236e49]'
                        : isChosenWrong
                          ? 'border-[#e9cccc] bg-[#fef7f7] text-[#8f5252]'
                          : 'border-[#dee8e5] bg-[#ffffff] text-[#586871]'
                    }`}
                  >
                    <span className="mr-1 font-extrabold">{option.id}.</span>
                    <span data-content="quiz">{option.text}</span>
                    {isAnswer && (
                      <span className="ml-1 font-bold">{t('quiz.correctMark')}</span>
                    )}
                    {isChosenWrong && (
                      <span className="ml-1 font-bold">{t('quiz.yourAnswerMark')}</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-[10px] leading-relaxed text-[#586871]">
              <span className="font-bold text-[#4d5c63]">{t('quiz.yourAnswer')}</span>{' '}
              {selectedOptionId ? (
                <span data-content="quiz">{`${selectedOptionId}. ${getOptionText(question, selectedOptionId)}`}</span>
              ) : (
                t('quiz.noAnswer')
              )}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#586871]">
              <span className="font-bold text-[#4d5c63]">{t('quiz.correctAnswer')}</span>{' '}
              <span data-content="quiz">
                {question.correctOptionId}.{' '}
                {getOptionText(question, question.correctOptionId)}
              </span>
            </p>
            <p className="mt-2 rounded-[16px] bg-[#f2f9f7] px-3 py-2.5 text-[10px] leading-relaxed text-[#586871]">
              <span className="font-bold text-[#4d5c63]">{t('quiz.explanation')}</span>{' '}
              <span data-content="quiz">{question.explanation}</span>
            </p>
          </article>
        );
      })}
    </div>
  );
}

function QuizResults({
  attempt,
  onRetry,
  onNewQuiz,
}: {
  attempt: QuizAttempt;
  onRetry: () => void;
  onNewQuiz: () => void;
}) {
  const { t, subject: subjectLabel } = useI18n();
  const incorrect = attempt.questionCount - attempt.score;
  return (
    <div className="space-y-5">
      <SectionCard
        eyebrow={t('quiz.subjectGrade', { subject: subjectLabel(attempt.subject), grade: attempt.grade })}
        title={t('quiz.resultsTitle')}
        trailing={
          <span className="rounded-full bg-[#daf5f2] px-3 py-1.5 text-[10px] font-bold text-[#26716c]">
            {t('quiz.sampleQuiz')}
          </span>
        }
      >
        <Menti
          pose={quizMood(attempt.percentage)}
          size={84}
          message={
            quizMood(attempt.percentage) === 'cheer'
              ? t('menti.quizHigh', { percentage: attempt.percentage })
              : quizMood(attempt.percentage) === 'encourage'
                ? t('menti.quizLow')
                : t('menti.quizComfort')
          }
          testId="menti-quiz"
          className="mb-4"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[12px] bg-[#f0fbfa] p-4">
            <p className="text-[13px] font-bold text-[#26726d]">
              {t('quiz.score')}
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-[-.015em] text-[#204c4e]">
              {attempt.score}/{attempt.questionCount}
            </p>
          </div>
          <div className="rounded-[12px] bg-[#eff7f5] p-4">
            <p className="text-[13px] font-bold text-[#317151]">
              {t('quiz.correct')}
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-[-.015em] text-[#275b41]">
              {attempt.score}
            </p>
          </div>
          <div className="rounded-[12px] bg-[#fdf6f5] p-4">
            <p className="text-[13px] font-bold text-[#9b5227]">
              {t('quiz.incorrect')}
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-[-.015em] text-[#904b24]">
              {incorrect}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[#e0efec] px-4 py-3">
          <div>
            <p className="text-[13px] font-bold text-[#586871]">
              {t('quiz.percentage')}
            </p>
            <p className="font-display mt-0.5 text-[24px] font-extrabold tracking-[-.015em] text-[#1f4b4c]">
              {attempt.percentage}%
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[#c6eae6] px-4 text-[11px] font-bold text-[#26726d] transition-colors hover:bg-[#f0fbfa]"
              data-testid="button-retry-quiz"
            >
              <RotateCcw size={14} /> {t('quiz.retry')}
            </button>
            <button
              type="button"
              onClick={onNewQuiz}
              className="inline-flex min-h-10 items-center gap-2 rounded-[10px] bg-[#2b807a] px-4 text-[11px] font-bold text-white transition-colors hover:bg-[#297a75]"
              data-testid="button-new-quiz"
            >
              {t('quiz.newQuiz')} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow={t('quiz.reviewEyebrow')}
        title={t('quiz.reviewTitle')}
        trailing={
          <span className="text-[10px] font-semibold text-[#58676f]">
            {t('quiz.explanations', { count: attempt.questionCount })}
          </span>
        }
      >
        <ReviewList items={attempt.review} />
      </SectionCard>
    </div>
  );
}

function QuizHistory({
  attempts,
  expandedAttemptId,
  onToggle,
}: {
  attempts: QuizAttempt[];
  expandedAttemptId: string | null;
  onToggle: (id: string) => void;
}) {
  const { t, lang, locale, subject: subjectLabel } = useI18n();
  const average = attempts.length
    ? Math.round(
        attempts.reduce((total, attempt) => total + attempt.percentage, 0) /
          attempts.length,
      )
    : 0;

  return (
    <SectionCard
      eyebrow={t('quiz.historyEyebrow')}
      title={t('quiz.historyTitle')}
      trailing={
        <span className="rounded-full bg-[#f1f8f6] px-3 py-1.5 text-[10px] font-bold text-[#586871]">
          {t('quiz.saved', { count: attempts.length })}
        </span>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[12px] bg-[#f2f9f7] p-3.5">
          <p className="text-[11px] font-bold text-[#586871]">
            {t('quiz.completedQuizzes')}
          </p>
          <p className="font-display mt-1 text-[21px] font-extrabold text-[#1f4b4c]">
            {attempts.length}
          </p>
        </div>
        <div className="rounded-[12px] bg-[#f2f9f7] p-3.5">
          <p className="text-[11px] font-bold text-[#586871]">
            {t('quiz.averageScore')}
          </p>
          <p className="font-display mt-1 text-[21px] font-extrabold text-[#1f4b4c]">
            {attempts.length ? `${average}%` : '—'}
          </p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[#d5e9e5] px-4 py-7 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#eafaf8] text-[#26716c]">
            <BarChart3 size={18} />
          </div>
          <p className="mt-3 text-[12px] font-bold text-[#4d5c63]">
            {t('quiz.historyEmptyTitle')}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#58676f]">
            {t('quiz.historyEmptyText')}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {attempts.map((attempt) => {
            const isExpanded = expandedAttemptId === attempt.id;
            return (
              <article
                key={attempt.id}
                className="rounded-[12px] border border-[#e0efed] p-4"
                data-testid="quiz-attempt"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold text-[#235355]">
                      {t('quiz.subjectGrade', { subject: subjectLabel(attempt.subject), grade: attempt.grade })}
                    </p>
                    <p className="mt-1 text-[10px] text-[#586871]">
                      {attempt.topic === ALL_QUIZ_TOPICS
                        ? t('quiz.allTopics')
                        : topicName(attempt.topic, lang)}{' '}
                      · {formatAttemptDate(attempt.completedAt, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-extrabold text-[#26726d]">
                      {attempt.percentage}%
                    </p>
                    <p className="text-[9px] font-semibold text-[#586871]">
                      {t('quiz.correctCount', { score: attempt.score, total: attempt.questionCount })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => onToggle(attempt.id)}
                  className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-[10px] bg-[#f0fbfa] px-3 text-[10px] font-bold text-[#26726d] hover:bg-[#e5f8f6]"
                  data-testid={`button-review-attempt-${attempt.id}`}
                >
                  {isExpanded ? t('quiz.hideReview') : t('quiz.reviewAnswers')}
                  {isExpanded ? (
                    <ChevronLeft size={13} className="-rotate-90" />
                  ) : (
                    <ChevronRight size={13} />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-4 border-t border-[#e9f3f1] pt-4">
                    <ReviewList items={attempt.review} />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function QuizInfoSidebar({
  attempts,
  activeQuestionCount,
}: {
  attempts: QuizAttempt[];
  activeQuestionCount: number;
}) {
  const average = attempts.length
    ? Math.round(
        attempts.reduce((total, attempt) => total + attempt.percentage, 0) /
          attempts.length,
      )
    : null;
  const { t } = useI18n();

  return (
    <aside className="space-y-5">
      <section className="rounded-[16px] bg-[#1d4748] p-5 text-white sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-white/10 text-[#e7b89e]">
            <Target size={19} />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#e7b89e]">
              {t('quiz.snapshot')}
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-white">
              {t('quiz.snapshotSub')}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-[12px] bg-white/[.08] p-3">
            <p className="text-[9px] font-bold text-[#9cded9]">{t('quiz.attempts')}</p>
            <p className="font-display mt-1 text-[21px] font-extrabold">
              {attempts.length}
            </p>
          </div>
          <div className="rounded-[12px] bg-white/[.08] p-3">
            <p className="text-[9px] font-bold text-[#9cded9]">{t('quiz.average')}</p>
            <p className="font-display mt-1 text-[21px] font-extrabold">
              {average === null ? '—' : `${average}%`}
            </p>
          </div>
        </div>
        {activeQuestionCount > 0 && (
          <p className="mt-3 text-[10px] leading-relaxed text-[#9cded9]">
            {t('quiz.currentSet', { count: activeQuestionCount })}
          </p>
        )}
      </section>

      <section className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
        <div className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#e4f5ec] text-[#2b724e]">
          <CircleHelp size={19} />
        </div>
        <h2 className="font-display mt-4 text-[16px] font-extrabold tracking-[-.015em] text-[#1f4b4c]">
          {t('quiz.tipsTitle')}
        </h2>
        <ul className="mt-3 space-y-3 text-[10px] leading-relaxed text-[#586871]">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2a7e79]" />
            {t('quiz.tip1')}
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#318159]" />
            {t('quiz.tip2')}
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2a7e79]" />
            {t('quiz.tip3')}
          </li>
        </ul>
      </section>

      <div className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] px-4 py-4 text-[10px] leading-relaxed text-[#586871] shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
        <Sparkles size={15} className="mb-2 text-[#26726d]" />
        {t('quiz.sidebarNote')}
      </div>
    </aside>
  );
}

export default function FunctionalQuizCenterPage() {
  const { t } = useI18n();
  const initialStorage = useRef<StorageLoadResult | null>(null);
  if (initialStorage.current === null) {
    initialStorage.current = loadQuizAttempts();
  }

  const [setup, setSetup] = useState<QuizSetup>(DEFAULT_SETUP);
  const [examActive, setExamActive] = useState(false);
  const [activeQuestions, setActiveQuestions] = useState<QuizQuestion[] | null>(
    null,
  );
  const [activeConfig, setActiveConfig] = useState<QuizSetup | null>(null);
  const [answers, setAnswers] = useState<Record<string, QuizOptionId>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(
    null,
  );
  const [attempts, setAttempts] = useState<QuizAttempt[]>(
    () => initialStorage.current?.attempts ?? [],
  );
  const [storageMessage, setStorageMessage] = useState(
    () => initialStorage.current?.message ?? '',
  );
  const canPersistRef = useRef(initialStorage.current?.canPersist ?? false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (!canPersistRef.current) return;
    try {
      window.localStorage.setItem(
        QUIZ_HISTORY_STORAGE_KEY,
        JSON.stringify(attempts),
      );
    } catch {
      canPersistRef.current = false;
      setStorageMessage('quiz.storageFull');
    }
  }, [attempts]);

  function changeSetup(patch: Partial<QuizSetup>) {
    const nextSetup = { ...setup, ...patch };
    // Stage 22B-2b: Felsefe has questions only in grades 10–11; another grade goes back to the first subject.
    if (!getQuizSubjects(nextSetup.grade).includes(nextSetup.subject)) {
      nextSetup.subject = DEFAULT_SETUP.subject;
      nextSetup.level = SUGGESTED_LEVEL[nextSetup.grade];
      nextSetup.topic = ALL_QUIZ_TOPICS;
    }
    // Stage 15: grade 9 can have other topics (MEB themes); a topic the new grade does not have goes back to all topics.
    if (
      nextSetup.topic !== ALL_QUIZ_TOPICS &&
      !getQuizTopics(nextSetup.grade, nextSetup.subject, levelFilter(nextSetup)).includes(nextSetup.topic)
    ) {
      nextSetup.topic = ALL_QUIZ_TOPICS;
    }
    const availableQuestions = getQuizQuestionPool(
      nextSetup.grade,
      nextSetup.subject,
      nextSetup.topic,
      nextSetup.difficulty,
      levelFilter(nextSetup),
    ).length;
    let nextNotice: Notice | null = null;

    if (nextSetup.questionCount > availableQuestions) {
      const adjustedCount = [...QUIZ_QUESTION_COUNTS]
        .reverse()
        .find((count) => count <= availableQuestions);
      if (adjustedCount) {
        nextSetup.questionCount = adjustedCount;
        nextNotice = {
          tone: 'info',
          key: 'quiz.adjusted',
          vars: { available: availableQuestions, count: adjustedCount },
        };
      }
    }

    setSetup(nextSetup);
    setNotice(nextNotice);
  }

  function startQuiz() {
    const pool = getQuizQuestionPool(
      setup.grade,
      setup.subject,
      setup.topic,
      setup.difficulty,
      levelFilter(setup),
    );
    if (pool.length < setup.questionCount) {
      setNotice({
        tone: 'error',
        key: 'quiz.notEnoughError',
      });
      return;
    }

    const questions = pool.slice(0, setup.questionCount);
    setActiveQuestions(questions);
    setActiveConfig({ ...setup });
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setLatestAttempt(null);
    submitLockRef.current = false;
    setNotice({
      tone: 'success',
      key: 'quiz.ready',
      vars: { count: setup.questionCount, subject: setup.subject },
      subjectVar: true,
    });
  }

  function selectAnswer(optionId: QuizOptionId) {
    const currentQuestion = activeQuestions?.[currentIndex];
    if (!currentQuestion || submitted || submitLockRef.current) return;
    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionId,
    }));
    setNotice(null);
  }

  function submitQuiz() {
    if (
      !activeQuestions ||
      !activeConfig ||
      submitted ||
      submitLockRef.current
    ) {
      return;
    }

    const unansweredCount = activeQuestions.filter(
      (question) => !answers[question.id],
    ).length;
    if (unansweredCount > 0) {
      setNotice({
        tone: 'error',
        key: 'quiz.unanswered_other',
        plural: { base: 'quiz.unanswered', count: unansweredCount },
      });
      return;
    }

    submitLockRef.current = true;
    const review = activeQuestions.map((question) => ({
      question,
      selectedOptionId: answers[question.id],
    }));
    const score = review.filter(
      ({ question, selectedOptionId }) =>
        selectedOptionId === question.correctOptionId,
    ).length;
    const attempt: QuizAttempt = {
      id: createAttemptId(),
      grade: activeConfig.grade,
      subject: activeConfig.subject,
      topic: savedTopic(activeConfig),
      difficulty: activeConfig.difficulty,
      questionCount: activeConfig.questionCount,
      score,
      percentage: Math.round((score / activeQuestions.length) * 100),
      completedAt: new Date().toISOString(),
      review,
    };

    setSubmitted(true);
    setLatestAttempt(attempt);
    setAttempts((previous) => [attempt, ...previous].slice(0, MAX_SAVED_ATTEMPTS));
    setNotice({
      tone: 'success',
      key: 'quiz.complete',
    });
  }

  function retryQuiz() {
    if (!activeQuestions) return;
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setLatestAttempt(null);
    submitLockRef.current = false;
    setNotice({
      tone: 'info',
      key: 'quiz.retryStarted',
    });
  }

  function startNewQuiz() {
    setActiveQuestions(null);
    setActiveConfig(null);
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setLatestAttempt(null);
    submitLockRef.current = false;
    setNotice(null);
  }

  const activeQuestion = activeQuestions?.[currentIndex] ?? null;
  const answeredCount = activeQuestions
    ? activeQuestions.filter((question) => Boolean(answers[question.id])).length
    : 0;

  return (
    <div className="page-shell min-h-[100dvh] bg-[#f2f9f7]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[#dee8e5] bg-[#ffffff] px-4 text-[12px] font-bold text-[#20605c] transition-colors hover:border-[#a6e1de] hover:text-[#26726d]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {t('common.backHome')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[16px] border border-[#dee8e5] border-l-[6px] border-l-[#2a7f7a] bg-[#f4f9f8] px-6 py-8 text-[#1a3e3f] sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative flex max-w-[780px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[#d6f3f0] text-[#26716c] sm:h-14 sm:w-14">
              <Compass size={22} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#9b5227]">
                {t('quiz.heroEyebrow')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">
                {t('quiz.title')}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#4d5b61] sm:text-[15px]">
                {t('quiz.heroText')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#596a72]">
            {t('quiz.curatedNote')}
          </p>
          <span className="rounded-full bg-[#daf5f2] px-3 py-1.5 text-[10px] font-bold text-[#26716c]">
            {t('quiz.noLiveAi')}
          </span>
        </div>

        {storageMessage && (
          <div className="mt-4">
            <NoticeBanner notice={{ tone: 'info', key: storageMessage }} />
          </div>
        )}

        <div className="mt-4 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {examActive ? null : submitted && latestAttempt ? (
              <QuizResults
                attempt={latestAttempt}
                onRetry={retryQuiz}
                onNewQuiz={startNewQuiz}
              />
            ) : activeQuestions && activeQuestion ? (
              <QuizQuestionCard
                question={activeQuestion}
                index={currentIndex}
                total={activeQuestions.length}
                answeredCount={answeredCount}
                selectedOptionId={answers[activeQuestion.id]}
                notice={notice}
                onSelect={selectAnswer}
                onPrevious={() => {
                  setCurrentIndex((index) => Math.max(0, index - 1));
                  setNotice(null);
                }}
                onNext={() => {
                  setCurrentIndex((index) =>
                    Math.min(activeQuestions.length - 1, index + 1),
                  );
                  setNotice(null);
                }}
                onSubmit={submitQuiz}
              />
            ) : (
              <QuizSetupCard
                setup={setup}
                onChange={changeSetup}
                onStart={startQuiz}
                notice={notice}
              />
            )}

            {/* Stage 22A: YKS exam mode (TYT); while an exam or its result is open, only the exam is shown */}
            <ExamMode onActiveChange={setExamActive} />

            {!examActive && <QuizHistory
              attempts={attempts}
              expandedAttemptId={expandedAttemptId}
              onToggle={(id) =>
                setExpandedAttemptId((current) =>
                  current === id ? null : id,
                )
              }
            />}
          </div>

          <QuizInfoSidebar
            attempts={attempts}
            activeQuestionCount={activeQuestions?.length ?? 0}
          />
        </div>
      </main>

      <footer className="border-t border-[#dbece9] bg-[#eff7f5]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#596a72]">
            {t('quiz.footer')}<FooterAboutLink />
          </p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#26726d] hover:text-[#20605c]"
            data-testid="link-footer-home"
          >
            <ArrowLeft size={13} /> {t('common.returnHome')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
