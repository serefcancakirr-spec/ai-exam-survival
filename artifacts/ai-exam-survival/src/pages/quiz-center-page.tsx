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
import {
  ALL_QUIZ_TOPICS,
  getQuizQuestionPool,
  getQuizTopics,
  QUIZ_GRADES,
  QUIZ_QUESTION_COUNTS,
  QUIZ_SUBJECTS,
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
  'mt-2 w-full rounded-[12px] border border-[#e3e6ef] bg-white px-3.5 py-3 text-[13px] text-[#293354] outline-none transition focus:border-[#7568dc] focus:ring-2 focus:ring-[#7568dc]/10';

type QuizSetup = {
  grade: QuizGrade;
  subject: QuizSubject;
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
  topic: ALL_QUIZ_TOPICS,
  difficulty: 'medium',
  questionCount: 5,
};

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
    success: 'border-[#c6eadc] bg-[#eff9f5] text-[#26785c]',
    error: 'border-[#f1d0d0] bg-[#fff5f5] text-[#9c4545]',
    info: 'border-[#d8d4f5] bg-[#f6f4ff] text-[#5144b5]',
  };

  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={`rounded-[13px] border px-4 py-3 text-[12px] font-semibold leading-relaxed ${styles[notice.tone]}`}
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
    <section className="rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#5a4bc9]">
            {eyebrow}
          </p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.04em] text-[#20294d] sm:text-[22px]">
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
  );
  const topics = getQuizTopics(setup.grade, setup.subject);
  const difficultyOptions: QuizDifficulty[] = ['easy', 'medium', 'hard'];
  const topicLabel =
    setup.topic === ALL_QUIZ_TOPICS ? t('quiz.allTopics') : topicName(setup.topic, lang);

  return (
    <SectionCard
      eyebrow={t('quiz.setupEyebrow')}
      title={t('quiz.setupTitle')}
      trailing={
        <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">
          {t('quiz.curated')}
        </span>
      }
    >
      {notice && <NoticeBanner notice={notice} />}
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <label className="block text-[11px] font-bold text-[#46516f]" htmlFor="quiz-grade">
          {t('quiz.gradeLevel')}
          <select
            id="quiz-grade"
            className={selectClassName}
            value={setup.grade}
            onChange={(event) =>
              onChange({ grade: event.target.value as QuizGrade })
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
          className="block text-[11px] font-bold text-[#46516f]"
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
                topic: ALL_QUIZ_TOPICS,
              })
            }
            data-testid="select-quiz-subject"
          >
            {QUIZ_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subjectLabel(subject)}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-[11px] font-bold text-[#46516f]" htmlFor="quiz-topic">
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
          className="block text-[11px] font-bold text-[#46516f]"
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

      <fieldset className="mt-5">
        <legend className="text-[11px] font-bold text-[#46516f]">
          {t('quiz.numberOfQuestions')}
        </legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {QUIZ_QUESTION_COUNTS.map((count) => {
            const isAvailable = count <= questionPool.length;
            const isSelected = setup.questionCount === count;
            return (
              <label
                key={count}
                className={`relative flex min-h-[58px] cursor-pointer items-center justify-center rounded-[13px] border text-[13px] font-extrabold transition ${
                  !isAvailable
                    ? 'cursor-not-allowed border-[#eef0f5] bg-[#f8f9fb] text-[#b0b6c5]'
                    : isSelected
                      ? 'border-[#7568dc] bg-[#f5f3ff] text-[#5144c7] shadow-[0_0_0_2px_rgba(117,104,220,.08)]'
                      : 'border-[#e5e7f0] bg-white text-[#56607b] hover:border-[#c8c5eb]'
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
        <p className="mt-2 text-[10px] leading-relaxed text-[#7b849b]">
          {t('quiz.poolInfo', { count: questionPool.length })}
        </p>
      </fieldset>

      <div className="mt-5 rounded-[13px] bg-[#f5f6fb] px-4 py-3 text-[11px] leading-relaxed text-[#69738d]">
        <span className="font-bold text-[#46516f]">{t('quiz.previewLabel')}</span>{' '}
        {t('quiz.previewText', {
          grade: setup.grade,
          subject: subjectLabel(setup.subject),
          topic: topicLabel,
          difficulty: t(DIFFICULTY_KEYS[setup.difficulty]),
          count: setup.questionCount,
        })}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-[430px] text-[10px] leading-relaxed text-[#858da2]">
          {t('quiz.sampleNote')}
        </p>
        <button
          type="button"
          onClick={onStart}
          disabled={setup.questionCount > questionPool.length}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#5144c7] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#4337b0] disabled:cursor-not-allowed disabled:opacity-45"
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
              ? 'bg-[#eaf7f1] text-[#26785c]'
              : question.difficulty === 'hard'
                ? 'bg-[#fff0ec] text-[#a6533a]'
                : 'bg-[#f0efff] text-[#5b50bb]'
          }`}
        >
          {t(DIFFICULTY_KEYS[question.difficulty])}
        </span>
      }
    >
      {notice && <div className="mb-4"><NoticeBanner notice={notice} /></div>}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-[#75809a]">
        <span>
          {t('quiz.questionOf', { number: index + 1, total })}
        </span>
        <span>{t('quiz.answeredOf', { answered: answeredCount, total })}</span>
      </div>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#eceef5]"
        role="progressbar"
        aria-label={t('quiz.progressAria')}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        data-testid="quiz-progress"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#5144c7] to-[#22a6b0] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-6 text-[16px] font-bold leading-[1.65] text-[#293354] sm:text-[18px]" data-content="quiz">
        {question.prompt}
      </p>

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
                  ? 'border-[#8d83df] bg-[#f5f3ff] text-[#5144c7]'
                  : 'border-[#e5e7f0] bg-white text-[#56607b] hover:border-[#c8c5eb] hover:bg-[#fcfbff]'
              }`}
              data-testid={`button-quiz-answer-${option.id}`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                  isSelected
                    ? 'bg-[#5144c7] text-white'
                    : 'bg-[#f1f2f8] text-[#78829c]'
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
        className="mt-3 min-h-5 text-[10px] font-semibold text-[#626b85]"
      >
        {selectedOptionId
          ? t('quiz.answerSelected')
          : t('quiz.chooseOne')}
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#edf0f5] pt-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={index === 0}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#e2e5ef] px-4 text-[11px] font-bold text-[#52607c] transition-colors hover:border-[#c8c5eb] hover:text-[#5144c7] disabled:cursor-not-allowed disabled:opacity-40"
          data-testid="button-quiz-previous"
        >
          <ChevronLeft size={15} /> {t('quiz.previous')}
        </button>
        {isLastQuestion ? (
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5144c7] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#4337b0]"
            data-testid="button-submit-quiz"
          >
            {t('quiz.finish')} <CheckCircle2 size={15} />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#5144c7] px-4 text-[11px] font-bold text-white transition-colors hover:bg-[#4337b0]"
            data-testid="button-quiz-next"
          >
            {t('quiz.next')} <ChevronRight size={15} />
          </button>
        )}
      </div>
    </SectionCard>
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
            className="rounded-[15px] border border-[#e7e9f1] bg-white p-4 sm:p-5"
            data-testid="quiz-review-question"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[.1em] text-[#7a849b]">
                {t('quiz.reviewQuestion', { number: index + 1, topic: topicName(question.topic, lang) })}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-[9px] font-bold ${
                  isCorrect
                    ? 'bg-[#eaf7f1] text-[#26785c]'
                    : 'bg-[#fff0ec] text-[#a6533a]'
                }`}
              >
                {isCorrect ? t('quiz.correctBadge') : t('quiz.reviewThis')}
              </span>
            </div>
            <p className="mt-3 text-[13px] font-bold leading-relaxed text-[#293354]" data-content="quiz">
              {question.prompt}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const isAnswer = option.id === question.correctOptionId;
                const isChosenWrong =
                  option.id === selectedOptionId && !isAnswer;
                return (
                  <div
                    key={option.id}
                    className={`rounded-[11px] border px-3 py-2.5 text-[10px] leading-relaxed ${
                      isAnswer
                        ? 'border-[#bce2d1] bg-[#f1faf6] font-semibold text-[#26785c]'
                        : isChosenWrong
                          ? 'border-[#efc6c6] bg-[#fff6f6] text-[#9c4545]'
                          : 'border-[#edf0f5] bg-white text-[#68738d]'
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
            <p className="mt-3 text-[10px] leading-relaxed text-[#68738d]">
              <span className="font-bold text-[#46516f]">{t('quiz.yourAnswer')}</span>{' '}
              {selectedOptionId ? (
                <span data-content="quiz">{`${selectedOptionId}. ${getOptionText(question, selectedOptionId)}`}</span>
              ) : (
                t('quiz.noAnswer')
              )}
            </p>
            <p className="mt-1 text-[10px] leading-relaxed text-[#68738d]">
              <span className="font-bold text-[#46516f]">{t('quiz.correctAnswer')}</span>{' '}
              <span data-content="quiz">
                {question.correctOptionId}.{' '}
                {getOptionText(question, question.correctOptionId)}
              </span>
            </p>
            <p className="mt-2 rounded-[10px] bg-[#f5f6fb] px-3 py-2.5 text-[10px] leading-relaxed text-[#68738d]">
              <span className="font-bold text-[#46516f]">{t('quiz.explanation')}</span>{' '}
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
          <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">
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
          <div className="rounded-[15px] bg-[#f5f3ff] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#6860b7]">
              {t('quiz.score')}
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-[-.05em] text-[#27234e]">
              {attempt.score}/{attempt.questionCount}
            </p>
          </div>
          <div className="rounded-[15px] bg-[#eff9f5] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#38836b]">
              {t('quiz.correct')}
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-[-.05em] text-[#236a54]">
              {attempt.score}
            </p>
          </div>
          <div className="rounded-[15px] bg-[#fff5f3] p-4">
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#a2604e]">
              {t('quiz.incorrect')}
            </p>
            <p className="font-display mt-1 text-[28px] font-extrabold tracking-[-.05em] text-[#8b4a3b]">
              {incorrect}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#e8e9f1] px-4 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#7b849b]">
              {t('quiz.percentage')}
            </p>
            <p className="font-display mt-0.5 text-[24px] font-extrabold tracking-[-.04em] text-[#20294d]">
              {attempt.percentage}%
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d9d6f3] px-4 text-[11px] font-bold text-[#5144c7] transition-colors hover:bg-[#f6f4ff]"
              data-testid="button-retry-quiz"
            >
              <RotateCcw size={14} /> {t('quiz.retry')}
            </button>
            <button
              type="button"
              onClick={onNewQuiz}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#5144c7] px-4 text-[11px] font-bold text-white transition-colors hover:bg-[#4337b0]"
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
          <span className="text-[10px] font-semibold text-[#79839a]">
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
        <span className="rounded-full bg-[#f2f4f9] px-3 py-1.5 text-[10px] font-bold text-[#626b85]">
          {t('quiz.saved', { count: attempts.length })}
        </span>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-[13px] bg-[#f5f6fb] p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#7b849b]">
            {t('quiz.completedQuizzes')}
          </p>
          <p className="font-display mt-1 text-[21px] font-extrabold text-[#20294d]">
            {attempts.length}
          </p>
        </div>
        <div className="rounded-[13px] bg-[#f5f6fb] p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-[.1em] text-[#7b849b]">
            {t('quiz.averageScore')}
          </p>
          <p className="font-display mt-1 text-[21px] font-extrabold text-[#20294d]">
            {attempts.length ? `${average}%` : '—'}
          </p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-[#dfe2ec] px-4 py-7 text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-[#f0efff] text-[#5b50bb]">
            <BarChart3 size={18} />
          </div>
          <p className="mt-3 text-[12px] font-bold text-[#46516f]">
            {t('quiz.historyEmptyTitle')}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-[#858da2]">
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
                className="rounded-[14px] border border-[#e7e9f1] p-4"
                data-testid="quiz-attempt"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[12px] font-bold text-[#293354]">
                      {t('quiz.subjectGrade', { subject: subjectLabel(attempt.subject), grade: attempt.grade })}
                    </p>
                    <p className="mt-1 text-[10px] text-[#7b849b]">
                      {attempt.topic === ALL_QUIZ_TOPICS
                        ? t('quiz.allTopics')
                        : topicName(attempt.topic, lang)}{' '}
                      · {formatAttemptDate(attempt.completedAt, locale)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-extrabold text-[#5144c7]">
                      {attempt.percentage}%
                    </p>
                    <p className="text-[9px] font-semibold text-[#7b849b]">
                      {t('quiz.correctCount', { score: attempt.score, total: attempt.questionCount })}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => onToggle(attempt.id)}
                  className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#f5f3ff] px-3 text-[10px] font-bold text-[#5144c7] hover:bg-[#eeebff]"
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
                  <div className="mt-4 border-t border-[#edf0f5] pt-4">
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
      <section className="rounded-[21px] bg-[#18224d] p-5 text-white sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-white/10 text-[#75dfe0]">
            <Target size={19} />
          </span>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#75dfe0]">
              {t('quiz.snapshot')}
            </p>
            <p className="mt-0.5 text-[12px] font-bold text-white">
              {t('quiz.snapshotSub')}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-[12px] bg-white/[.08] p-3">
            <p className="text-[9px] font-bold text-[#c3cbe3]">{t('quiz.attempts')}</p>
            <p className="font-display mt-1 text-[21px] font-extrabold">
              {attempts.length}
            </p>
          </div>
          <div className="rounded-[12px] bg-white/[.08] p-3">
            <p className="text-[9px] font-bold text-[#c3cbe3]">{t('quiz.average')}</p>
            <p className="font-display mt-1 text-[21px] font-extrabold">
              {average === null ? '—' : `${average}%`}
            </p>
          </div>
        </div>
        {activeQuestionCount > 0 && (
          <p className="mt-3 text-[10px] leading-relaxed text-[#c3cbe3]">
            {t('quiz.currentSet', { count: activeQuestionCount })}
          </p>
        )}
      </section>

      <section className="rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6">
        <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#e3f8f7] text-[#138f9a]">
          <CircleHelp size={19} />
        </div>
        <h2 className="font-display mt-4 text-[16px] font-extrabold tracking-[-.03em] text-[#20294d]">
          {t('quiz.tipsTitle')}
        </h2>
        <ul className="mt-3 space-y-3 text-[10px] leading-relaxed text-[#707992]">
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a4bc9]" />
            {t('quiz.tip1')}
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22a6b0]" />
            {t('quiz.tip2')}
          </li>
          <li className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5a4bc9]" />
            {t('quiz.tip3')}
          </li>
        </ul>
      </section>

      <div className="rounded-[18px] border border-[#e3e6ef] bg-white px-4 py-4 text-[10px] leading-relaxed text-[#7b849b]">
        <Sparkles size={15} className="mb-2 text-[#5144c7]" />
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
    const availableQuestions = getQuizQuestionPool(
      nextSetup.grade,
      nextSetup.subject,
      nextSetup.topic,
      nextSetup.difficulty,
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
      topic: activeConfig.topic,
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
    <div className="page-shell min-h-[100dvh] bg-[#f5f6fb]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2e5ef] bg-white px-4 text-[12px] font-bold text-[#35405e] transition-colors hover:border-[#c8c5eb] hover:text-[#5144c7]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {t('common.backHome')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[26px] bg-[#18224d] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-[#5944d2]/25" />
          <div className="relative flex max-w-[780px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-white/10 text-[#75dfe0] sm:h-14 sm:w-14">
              <Compass size={22} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#75dfe0] sm:text-[11px]">
                {t('quiz.heroEyebrow')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.055em] sm:text-[44px]">
                {t('quiz.title')}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#c3cbe3] sm:text-[15px]">
                {t('quiz.heroText')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#7e879e]">
            {t('quiz.curatedNote')}
          </p>
          <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">
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
            {submitted && latestAttempt ? (
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

            <QuizHistory
              attempts={attempts}
              expandedAttemptId={expandedAttemptId}
              onToggle={(id) =>
                setExpandedAttemptId((current) =>
                  current === id ? null : id,
                )
              }
            />
          </div>

          <QuizInfoSidebar
            attempts={attempts}
            activeQuestionCount={activeQuestions?.length ?? 0}
          />
        </div>
      </main>

      <footer className="border-t border-[#e3e6ef] bg-[#f0f2f8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#7e879e]">
            {t('quiz.footer')}
          </p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#5045b5] hover:text-[#31278e]"
            data-testid="link-footer-home"
          >
            <ArrowLeft size={13} /> {t('common.returnHome')}
          </Link>
        </div>
      </footer>
    </div>
  );
}
