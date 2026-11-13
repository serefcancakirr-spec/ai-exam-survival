import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Pencil,
  Plus,
  RotateCcw,
  Shuffle,
  Target,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'wouter';
import { FooterAboutLink } from './about-page';
import {
  FLASHCARDS_STORAGE_KEY,
  FLASHCARD_GRADES,
  FLASHCARD_SUBJECTS,
  LIMITS,
  applyMark,
  buildLearnOrder,
  buildPracticeOrder,
  buildReviewQueue,
  countStatuses,
  createFlashcardId,
  createInitialFlashcardsData,
  getCardStatus,
  isSavedFlashcardsData,
  requeueCard,
  restoreStarterDecks,
  validateCardDraft,
  validateDeckDraft,
  type CardDraft,
  type CardStatus,
  type DeckDraft,
  type Flashcard,
  type FlashcardDeck,
  type FlashcardGrade,
  type FlashcardSubject,
  type FlashcardsData,
  type MarkResult,
  type StudyMode,
} from './flashcards-model';
import { Menti } from '@/components/menti';
import { deckName, deckTopic, localizeCard } from '@/i18n/content';
import { findDuplicateDeck, isOwnDeckName, studyAdvice } from './flashcards-guide';
import { useI18n } from '@/i18n/i18n';

// ---------- shared styles (match Study Planner and Quiz Center) ----------

const inputClassName =
  'mt-2 w-full rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 py-3 text-[13px] text-[#3f4e5d] outline-none transition placeholder:text-[#abb1b8] focus:border-[#84a0c0] focus:ring-2 focus:ring-[#84a0c0]/10';
const primaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#54769d] px-5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#527195] disabled:cursor-not-allowed disabled:opacity-45';
const secondaryButton =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[12px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c] disabled:cursor-not-allowed disabled:opacity-45';
const smallButton =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3 text-[11px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]';
const dangerSmallButton =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-[6px] bg-[#a35b5b] px-3 text-[11px] font-bold text-white transition-colors hover:bg-[#8a4a4a]';

const STATUS_LABELS: Record<CardStatus, string> = {
  new: 'New',
  again: 'Review again',
  learning: 'Learning',
  mastered: 'Mastered',
};
const STATUS_STYLES: Record<CardStatus, { chip: string; bar: string }> = {
  new: { chip: 'bg-[#f8f6f3] text-[#5e676f]', bar: 'bg-[#dde1e6]' },
  again: { chip: 'bg-[#fbf1eb] text-[#895b42]', bar: 'bg-[#a4643a]' },
  learning: { chip: 'bg-[#f1f5f9] text-[#4a688c]', bar: 'bg-[#5276a0]' },
  mastered: { chip: 'bg-[#e8f3f0] text-[#396f5f]', bar: 'bg-[#417d6b]' },
};
const STATUS_ORDER: CardStatus[] = ['again', 'new', 'learning', 'mastered'];

const MODE_INFO: Record<StudyMode, { label: string; hint: string }> = {
  learn: {
    label: 'Learn',
    hint: 'Go through every card at your own pace. Flip, move back and forth, and mark what you know.',
  },
  practice: {
    label: 'Practice',
    hint: 'Test yourself on every card once, in a random order. Flip first, then mark honestly.',
  },
  review: {
    label: 'Review',
    hint: 'Focus on cards that need work. Cards marked “Review again” come back more often; mastered cards rest.',
  },
};

// ---------- saving ----------

type StorageLoadResult = { data: FlashcardsData; message: string; canPersist: boolean };

function loadFlashcards(): StorageLoadResult {
  const fresh = createInitialFlashcardsData();
  if (typeof window === 'undefined') return { data: fresh, message: '', canPersist: false };
  try {
    const saved = window.localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (!saved) return { data: fresh, message: '', canPersist: true };
    const parsed: unknown = JSON.parse(saved);
    if (!isSavedFlashcardsData(parsed)) {
      return {
        data: fresh,
        message:
          'Saved flashcards could not be read, so they were left untouched. Changes on this visit will not be saved.',
        canPersist: false,
      };
    }
    return { data: parsed, message: '', canPersist: true };
  } catch {
    return {
      data: fresh,
      message: 'This browser blocked saving. Your cards work for this visit but will not be kept.',
      canPersist: false,
    };
  }
}

// ---------- study session (not saved; rebuilt from saved cards) ----------

type Session = {
  deckId: string;
  mode: StudyMode;
  order: string[];
  index: number;
  flipped: boolean;
  marks: Record<number, MarkResult>;
  requeues: Record<string, number>;
  finished: boolean;
  completedLaps: number;
};

function createSession(
  deckId: string,
  mode: StudyMode,
  cards: Flashcard[],
  data: FlashcardsData,
  shuffled = false,
): Session {
  const order =
    mode === 'learn'
      ? buildLearnOrder(cards, shuffled)
      : mode === 'practice'
        ? buildPracticeOrder(cards)
        : buildReviewQueue(cards, data.progress);
  return {
    deckId,
    mode,
    order,
    index: 0,
    flipped: false,
    marks: {},
    requeues: {},
    finished: false,
    completedLaps: 0,
  };
}

type Notice = { tone: 'success' | 'error' | 'info'; message: string; details?: string[] };
type Confirm =
  | { kind: 'delete-deck'; id: string }
  | { kind: 'delete-card'; id: string }
  | { kind: 'reset-progress'; id: string };

const emptyCardDraft: CardDraft = { front: '', answer: '', explanation: '' };

// ---------- page layout pieces ----------

function FlashcardsFrame({ children, storageUnavailable }: { children: ReactNode; storageUnavailable: boolean }) {
  const { t, tx, phrase, subject: subjectLabel } = useI18n();
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
              <Layers3 size={22} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#8a5a3c]">
                {tx('Recall it, remember it')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">
                {tx('Smart Flashcards')}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#4f5a64] sm:text-[15px]">
                {tx('Make your own decks for grades 9–12, flip cards to check your recall, and let Review mode bring back the cards you find hardest.')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#5f6870]" data-testid="text-flashcards-save-status">
            {storageUnavailable
              ? tx('Browser saving is unavailable for flashcards')
              : tx('Your cards and progress stay in this browser')}
          </p>
          <span className="rounded-full bg-[#ebf0f6] px-3 py-1.5 text-[10px] font-bold text-[#506783]">
            {tx('Saved on this device')}
          </span>
        </div>

        <div className="mt-4 space-y-5 sm:space-y-6">{children}</div>
      </main>

      <footer className="border-t border-[#e6e9ec] bg-[#f7f5f1]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#5f6870]">{tx('AI Exam Survival · Smart Flashcards')}<FooterAboutLink /></p>
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
  title: ReactNode;
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
      className={`rounded-[13px] border px-4 py-3 text-[12px] leading-relaxed ${styles[notice.tone]}`}
      data-testid={`flashcards-notice-${notice.tone}`}
    >
      <p className="font-bold">{phrase(notice.message)}</p>
      {notice.details && (
        <ul className="mt-1.5 list-disc space-y-1 pl-5">
          {notice.details.map((detail) => (
            <li key={detail}>{phrase(detail)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusBar({ counts, total }: { counts: Record<CardStatus, number>; total: number }) {
  return (
    <div className="flex h-2 overflow-hidden rounded-full bg-[#f0f2f4]" aria-hidden="true">
      {total > 0 &&
        STATUS_ORDER.map((status) =>
          counts[status] > 0 ? (
            <span
              key={status}
              className={STATUS_STYLES[status].bar}
              style={{ width: `${(counts[status] / total) * 100}%` }}
            />
          ) : null,
        )}
    </div>
  );
}

function StatusChip({ status }: { status: CardStatus }) {
  const { tx } = useI18n();
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLES[status].chip}`}
    >
      {tx(STATUS_LABELS[status])}
    </span>
  );
}

function InlineConfirm({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  testId,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  testId: string;
}) {
  const { tx } = useI18n();
  return (
    <div
      role="alertdialog"
      aria-label={message}
      className="flex flex-col gap-3 rounded-[8px] border border-[#ebd6d6] bg-[#fef7f7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      data-testid={testId}
    >
      <p className="text-[12px] font-bold text-[#865454]">{message}</p>
      <div className="flex shrink-0 gap-2">
        <button type="button" onClick={onCancel} className={smallButton} data-testid={`${testId}-cancel`}>
          {tx('Cancel')}
        </button>
        <button type="button" onClick={onConfirm} className={dangerSmallButton} data-testid={`${testId}-yes`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function DeckForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  errors,
}: {
  draft: DeckDraft;
  onChange: (patch: Partial<DeckDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  submitLabel: string;
  errors: string[];
}) {
  const { t, tx, phrase, subject: subjectLabel } = useI18n();
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[10px] border border-[#eaedf0] bg-[#fcfdfd] p-4"
      data-testid="form-deck"
    >
      {errors.length > 0 && (
        <div className="mb-3">
          <NoticeBanner notice={{ tone: 'error', message: 'Check these details:', details: errors }} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[11px] font-bold text-[#4b5966] sm:col-span-2" htmlFor="deck-name">
          {tx('Deck name')}
          <input
            id="deck-name"
            value={draft.name}
            maxLength={LIMITS.deckName}
            onChange={(event) => onChange({ name: event.currentTarget.value })}
            placeholder={tx('For example: Photosynthesis key words')}
            className={inputClassName}
            data-testid="input-deck-name"
          />
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="deck-grade">
          {tx('Grade')}
          <select
            id="deck-grade"
            value={draft.grade}
            onChange={(event) => onChange({ grade: event.currentTarget.value })}
            className={inputClassName}
            data-testid="select-deck-grade"
          >
            {FLASHCARD_GRADES.map((grade) => (
              <option key={grade} value={grade}>
                {t('common.grade', { grade })}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="deck-subject">
          {tx('Subject')}
          <select
            id="deck-subject"
            value={draft.subject}
            onChange={(event) => onChange({ subject: event.currentTarget.value })}
            className={inputClassName}
            data-testid="select-deck-subject"
          >
            {FLASHCARD_SUBJECTS.map((subject) => (
              <option key={subject} value={subject}>
                {subjectLabel(subject)}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966] sm:col-span-2" htmlFor="deck-topic">
          {tx('Topic')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
          <input
            id="deck-topic"
            value={draft.topic}
            maxLength={LIMITS.topic}
            onChange={(event) => onChange({ topic: event.currentTarget.value })}
            placeholder={tx('For example: Cells & organelles')}
            className={inputClassName}
            data-testid="input-deck-topic"
          />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton} data-testid="button-cancel-deck">
          {tx('Cancel')}
        </button>
        <button type="submit" className={primaryButton} data-testid="button-save-deck">
          <Check size={15} /> {submitLabel}
        </button>
      </div>
    </form>
  );
}

function CardForm({
  draft,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  errors,
  idPrefix,
}: {
  draft: CardDraft;
  onChange: (patch: Partial<CardDraft>) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
  submitLabel: string;
  errors: string[];
  idPrefix: string;
}) {
  const { tx } = useI18n();
  return (
    <form onSubmit={onSubmit} noValidate data-testid={`form-${idPrefix}`}>
      {errors.length > 0 && (
        <div className="mb-3">
          <NoticeBanner notice={{ tone: 'error', message: 'Check this card:', details: errors }} />
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor={`${idPrefix}-front`}>
          {tx('Front · question or concept')}
          <textarea
            id={`${idPrefix}-front`}
            rows={2}
            value={draft.front}
            maxLength={LIMITS.front}
            onChange={(event) => onChange({ front: event.currentTarget.value })}
            placeholder={tx('For example: What does a ribosome do?')}
            className={`${inputClassName} resize-y`}
            data-testid={`${idPrefix}-front`}
          />
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor={`${idPrefix}-answer`}>
          {tx('Back · answer')}
          <textarea
            id={`${idPrefix}-answer`}
            rows={2}
            value={draft.answer}
            maxLength={LIMITS.answer}
            onChange={(event) => onChange({ answer: event.currentTarget.value })}
            placeholder={tx('For example: It builds proteins.')}
            className={`${inputClassName} resize-y`}
            data-testid={`${idPrefix}-answer`}
          />
        </label>
        <label className="block text-[11px] font-bold text-[#4b5966] md:col-span-2" htmlFor={`${idPrefix}-explanation`}>
          {tx('Back · explanation')} <span className="font-semibold text-[#60686f]">{tx('(optional, helps you remember why)')}</span>
          <textarea
            id={`${idPrefix}-explanation`}
            rows={2}
            value={draft.explanation}
            maxLength={LIMITS.explanation}
            onChange={(event) => onChange({ explanation: event.currentTarget.value })}
            placeholder={tx('For example: Ribosomes follow instructions carried by mRNA.')}
            className={`${inputClassName} resize-y`}
            data-testid={`${idPrefix}-explanation`}
          />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className={secondaryButton} data-testid={`${idPrefix}-cancel`}>
            {tx('Cancel')}
          </button>
        )}
        <button type="submit" className={primaryButton} data-testid={`${idPrefix}-save`}>
          {onCancel ? <Check size={15} /> : <Plus size={15} />} {submitLabel}
        </button>
      </div>
    </form>
  );
}

// ---------- the page ----------

export default function SmartFlashcardsPage() {
  const { t, tx, phrase, lang, subject: subjectLabel } = useI18n();
  const [initialLoad] = useState(loadFlashcards);
  const [data, setData] = useState<FlashcardsData>(initialLoad.data);
  const [storageMessage, setStorageMessage] = useState(initialLoad.message);
  const canPersist = useRef(initialLoad.canPersist);

  const [filterGrade, setFilterGrade] = useState<'all' | FlashcardGrade>('all');
  const [filterSubject, setFilterSubject] = useState<'all' | FlashcardSubject>('all');
  const [session, setSession] = useState<Session | null>(() => {
    const deckId = initialLoad.data.selectedDeckId;
    if (!deckId || !initialLoad.data.decks.some((deck) => deck.id === deckId)) return null;
    const cards = initialLoad.data.cards.filter((card) => card.deckId === deckId);
    return createSession(deckId, 'learn', cards, initialLoad.data);
  });
  const [notice, setNotice] = useState<Notice | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const [deckForm, setDeckForm] = useState<{ mode: 'new' | 'edit'; draft: DeckDraft; errors: string[] } | null>(null);
  const [newCard, setNewCard] = useState<{ draft: CardDraft; errors: string[] }>({ draft: emptyCardDraft, errors: [] });
  const [editingCard, setEditingCard] = useState<{ id: string; draft: CardDraft; errors: string[] } | null>(null);

  const studyRef = useRef<HTMLDivElement>(null);

  // Save every change in this browser.
  useEffect(() => {
    if (!canPersist.current || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(data));
    } catch {
      canPersist.current = false;
      setStorageMessage('This browser blocked saving. Your cards work for this visit but will not be kept.');
    }
  }, [data]);

  const selectedDeck = data.decks.find((deck) => deck.id === data.selectedDeckId) ?? null;
  const deckCards = useMemo(
    () => (selectedDeck ? data.cards.filter((card) => card.deckId === selectedDeck.id) : []),
    [data.cards, selectedDeck],
  );
  const cardsById = useMemo(() => new Map(data.cards.map((card) => [card.id, card])), [data.cards]);
  const deckCounts = countStatuses(deckCards, data.progress);

  const visibleDecks = data.decks.filter(
    (deck) =>
      (filterGrade === 'all' || deck.grade === filterGrade) &&
      (filterSubject === 'all' || deck.subject === filterSubject),
  );

  const activeSession = session && selectedDeck && session.deckId === selectedDeck.id ? session : null;
  const currentCardId = activeSession && !activeSession.finished ? activeSession.order[activeSession.index] : undefined;
  const currentCard = currentCardId ? cardsById.get(currentCardId) : undefined;

  // ---------- deck actions ----------

  function selectDeck(deck: FlashcardDeck, mode: StudyMode = 'learn') {
    const cards = data.cards.filter((card) => card.deckId === deck.id);
    setData((current) => ({ ...current, selectedDeckId: deck.id }));
    setSession(createSession(deck.id, mode, cards, data));
    setEditingCard(null);
    setConfirm(null);
    setNotice(null);
    window.requestAnimationFrame(() => {
      if (window.innerWidth < 1024) studyRef.current?.scrollIntoView({ block: 'start' });
    });
  }

  function openNewDeckForm() {
    setDeckForm({
      mode: 'new',
      draft: {
        name: '',
        grade: filterGrade === 'all' ? '9' : filterGrade,
        subject: filterSubject === 'all' ? 'English' : filterSubject,
        topic: '',
      },
      errors: [],
    });
    setNotice(null);
  }

  function openEditDeckForm() {
    if (!selectedDeck) return;
    setDeckForm({
      mode: 'edit',
      draft: {
        name: deckName(selectedDeck, lang),
        grade: selectedDeck.grade,
        subject: selectedDeck.subject,
        topic: deckTopic(selectedDeck, lang),
      },
      errors: [],
    });
    setNotice(null);
  }

  function saveDeck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deckForm) return;
    const errors = validateDeckDraft(deckForm.draft);
    // Stage 14: no two decks with the same name (any grade or subject). An edited deck may keep its own name.
    const editing = deckForm.mode === 'edit' ? selectedDeck : null;
    const keepsOwnName = editing ? isOwnDeckName(deckForm.draft.name, editing) : false;
    if (!keepsOwnName && findDuplicateDeck(deckForm.draft.name, data.decks, editing?.id ?? null)) {
      // English sentence here; it is shown in the chosen language like the other form errors.
      errors.push(`A deck called “${deckForm.draft.name.trim()}” already exists. Choose a different name, for example add the grade.`);
    }
    if (errors.length > 0) {
      setDeckForm({ ...deckForm, errors });
      return;
    }
    const clean = {
      name: deckForm.draft.name.trim(),
      grade: deckForm.draft.grade as FlashcardGrade,
      subject: deckForm.draft.subject as FlashcardSubject,
      topic: deckForm.draft.topic.trim(),
    };
    if (deckForm.mode === 'new') {
      const deck: FlashcardDeck = {
        id: createFlashcardId('deck'),
        ...clean,
        starter: false,
        createdAt: new Date().toISOString(),
      };
      setData((current) => ({ ...current, decks: [...current.decks, deck], selectedDeckId: deck.id }));
      setSession(createSession(deck.id, 'learn', [], data));
      setNotice({ tone: 'success', message: `“${deck.name}” was created. Add your first card below.` });
    } else if (selectedDeck) {
      setData((current) => ({
        ...current,
        // A Turkish starter name or topic the student left unchanged keeps its saved English text.
        decks: current.decks.map((deck) =>
          deck.id === selectedDeck.id
            ? {
                ...deck,
                ...clean,
                name: clean.name === deckName(deck, lang) ? deck.name : clean.name,
                topic: clean.topic === deckTopic(deck, lang) ? deck.topic : clean.topic,
              }
            : deck,
        ),
      }));
      setNotice({ tone: 'success', message: 'Deck details saved.' });
    }
    setDeckForm(null);
  }

  function deleteDeck(deckId: string) {
    const deck = data.decks.find((item) => item.id === deckId);
    if (!deck) return;
    const removedCardIds = new Set(data.cards.filter((card) => card.deckId === deckId).map((card) => card.id));
    const remainingDecks = data.decks.filter((item) => item.id !== deckId);
    const nextSelected = remainingDecks[0] ?? null;
    const remainingCards = data.cards.filter((card) => card.deckId !== deckId);
    const progress = Object.fromEntries(
      Object.entries(data.progress).filter(([cardId]) => !removedCardIds.has(cardId)),
    );
    const nextData: FlashcardsData = {
      ...data,
      decks: remainingDecks,
      cards: remainingCards,
      progress,
      selectedDeckId: nextSelected?.id ?? null,
    };
    setData(nextData);
    setSession(
      nextSelected
        ? createSession(
            nextSelected.id,
            'learn',
            remainingCards.filter((card) => card.deckId === nextSelected.id),
            nextData,
          )
        : null,
    );
    setConfirm(null);
    setDeckForm(null);
    setEditingCard(null);
    setNotice({ tone: 'success', message: `“${deckName(deck, lang)}” and its cards were deleted.` });
  }

  function resetDeckProgress(deckId: string) {
    const ids = new Set(data.cards.filter((card) => card.deckId === deckId).map((card) => card.id));
    const nextData = {
      ...data,
      progress: Object.fromEntries(Object.entries(data.progress).filter(([cardId]) => !ids.has(cardId))),
    };
    setData(nextData);
    if (activeSession) {
      setSession(
        createSession(deckId, activeSession.mode, data.cards.filter((card) => card.deckId === deckId), nextData),
      );
    }
    setConfirm(null);
    setNotice({ tone: 'success', message: 'Progress for this deck was reset. Every card is new again.' });
  }

  function restoreStarters() {
    const { data: next, restored } = restoreStarterDecks(data);
    setData(next);
    setNotice(
      restored > 0
        ? { tone: 'success', message: `${restored} starter deck${restored === 1 ? '' : 's'} restored.` }
        : { tone: 'info', message: 'All starter decks are already in your library.' },
    );
  }

  // ---------- card actions ----------

  function addCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDeck) return;
    const errors = validateCardDraft(newCard.draft);
    if (errors.length > 0) {
      setNewCard({ ...newCard, errors });
      return;
    }
    const card: Flashcard = {
      id: createFlashcardId('card'),
      deckId: selectedDeck.id,
      front: newCard.draft.front.trim(),
      answer: newCard.draft.answer.trim(),
      explanation: newCard.draft.explanation.trim(),
    };
    setData((current) => ({ ...current, cards: [...current.cards, card] }));
    setSession((current) => {
      if (!current || current.deckId !== selectedDeck.id) return current;
      if (current.mode === 'learn' || current.order.length === 0) {
        return { ...current, order: [...current.order, card.id], finished: false };
      }
      return current;
    });
    setNewCard({ draft: emptyCardDraft, errors: [] });
    setNotice({ tone: 'success', message: 'Card added to this deck.' });
  }

  function beginEditCard(card: Flashcard) {
    setEditingCard({
      id: card.id,
      draft: (({ front, answer, explanation }) => ({ front, answer, explanation }))(localizeCard(card, lang)),
      errors: [],
    });
    setConfirm(null);
    setNotice(null);
  }

  function saveCardEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCard) return;
    const errors = validateCardDraft(editingCard.draft);
    if (errors.length > 0) {
      setEditingCard({ ...editingCard, errors });
      return;
    }
    setData((current) => ({
      ...current,
      cards: current.cards.map((card) =>
        card.id === editingCard.id
          ? (() => {
              // A Turkish starter text the student left unchanged keeps its saved English text.
              const shown = localizeCard(card, lang);
              const keep = (draft: string, saved: string, seen: string) => (draft.trim() === seen ? saved : draft.trim());
              return {
                ...card,
                front: keep(editingCard.draft.front, card.front, shown.front),
                answer: keep(editingCard.draft.answer, card.answer, shown.answer),
                explanation: keep(editingCard.draft.explanation, card.explanation, shown.explanation),
              };
            })()
          : card,
      ),
    }));
    setEditingCard(null);
    setNotice({ tone: 'success', message: 'Card updated.' });
  }

  function deleteCard(cardId: string) {
    setData((current) => {
      const progress = { ...current.progress };
      delete progress[cardId];
      return { ...current, cards: current.cards.filter((card) => card.id !== cardId), progress };
    });
    setSession((current) => {
      if (!current) return current;
      const removedBefore = current.order.slice(0, current.index).filter((id) => id === cardId).length;
      const order = current.order.filter((id) => id !== cardId);
      const index = Math.max(0, Math.min(current.index - removedBefore, order.length - 1));
      return { ...current, order, index, flipped: false, marks: {}, finished: current.finished && order.length > 0 };
    });
    if (editingCard?.id === cardId) setEditingCard(null);
    setConfirm(null);
    setNotice({ tone: 'success', message: 'Card deleted.' });
  }

  // ---------- studying ----------

  function changeMode(mode: StudyMode) {
    if (!selectedDeck) return;
    setSession(createSession(selectedDeck.id, mode, deckCards, data));
    setNotice(null);
  }

  function shuffleSession() {
    if (!selectedDeck || !activeSession) return;
    setSession(createSession(selectedDeck.id, activeSession.mode, deckCards, data, true));
    setNotice({ tone: 'info', message: 'Cards shuffled. Starting from the first card.' });
  }

  function flip() {
    setSession((current) => (current ? { ...current, flipped: !current.flipped } : current));
  }

  function move(step: 1 | -1) {
    setSession((current) => {
      if (!current || current.order.length === 0) return current;
      const last = current.order.length - 1;
      if (step === 1 && current.index >= last) {
        if (current.mode === 'learn') {
          return { ...current, index: 0, flipped: false, completedLaps: current.completedLaps + 1 };
        }
        return { ...current, finished: true, flipped: false };
      }
      if (step === -1 && current.index === 0) {
        return current.mode === 'learn' ? { ...current, index: last, flipped: false } : current;
      }
      return { ...current, index: current.index + step, flipped: false };
    });
  }

  function mark(result: MarkResult) {
    if (!activeSession || !currentCard) return;
    if (activeSession.mode !== 'learn' && !activeSession.flipped) return;
    const cardId = currentCard.id;
    setData((current) => ({
      ...current,
      progress: { ...current.progress, [cardId]: applyMark(current.progress[cardId], result) },
    }));
    setSession((current) => {
      if (!current) return current;
      let order = current.order;
      let requeues = current.requeues;
      if (current.mode === 'review' && result === 'again') {
        const times = current.requeues[cardId] ?? 0;
        const next = requeueCard(current.order, current.index, cardId, times);
        if (next.length > current.order.length) {
          order = next;
          requeues = { ...current.requeues, [cardId]: times + 1 };
        }
      }
      const marks = { ...current.marks, [current.index]: result };
      const atEnd = current.index >= order.length - 1;
      if (atEnd && current.mode !== 'learn') {
        return { ...current, order, requeues, marks, finished: true, flipped: false };
      }
      if (atEnd) {
        return { ...current, order, requeues, marks, index: 0, flipped: false, completedLaps: current.completedLaps + 1 };
      }
      return { ...current, order, requeues, marks, index: current.index + 1, flipped: false };
    });
  }

  // ---------- render helpers ----------

  const progressLabel = activeSession
    ? tx('Card {number} of {total}', {
        number: Math.min(activeSession.index + 1, activeSession.order.length),
        total: activeSession.order.length,
      })
    : '';
  const sessionMarks = activeSession ? Object.values(activeSession.marks) : [];
  const knownInSession = sessionMarks.filter((value) => value === 'know').length;
  const againInSession = sessionMarks.filter((value) => value === 'again').length;
  const needsFlip = Boolean(activeSession && activeSession.mode !== 'learn' && !activeSession.flipped);
  const currentMark = activeSession ? activeSession.marks[activeSession.index] : undefined;

  // Stage 14: Menti suggests how to study this deck, from the student's real progress.
  function renderGuide() {
    if (!activeSession || activeSession.finished || deckCards.length === 0) return null;
    const advice = studyAdvice(deckCounts, activeSession.mode, againInSession);
    if (!advice) return null;
    const message =
      advice.kind === 'hard-round'
        ? tx('You marked {count} cards to review in this round. That is normal. When the round ends, try Review mode.', { count: advice.count })
        : advice.kind === 'new'
          ? tx('This deck is new. Start with Learn mode to get to know the cards.')
          : advice.kind === 'struggling'
            ? tx(
                advice.count === 1
                  ? '{count} card is giving you trouble. Let’s go over it in Review mode.'
                  : '{count} cards are giving you trouble. Let’s go over them in Review mode.',
                { count: advice.count },
              )
            : advice.kind === 'mastered'
              ? tx('You know every card in this deck! Test yourself now and then with Practice.')
              : tx('Nice progress! Test yourself with Practice to see what has stuck.');
    const canSwitch = advice.suggest !== activeSession.mode && advice.kind !== 'hard-round';
    return (
      <div className="mt-3 rounded-[10px] border border-[#e6ebf1] bg-[#f9fbfd] px-3 py-3" data-testid="study-guide" data-advice={advice.kind}>
        <Menti pose={advice.pose} size={60} message={message} testId="menti-guide">
          {canSwitch && (
            <button
              type="button"
              onClick={() => changeMode(advice.suggest)}
              className="inline-flex min-h-9 items-center rounded-[6px] bg-[#54769d] px-3.5 text-[11px] font-extrabold text-white hover:bg-[#527195]"
              data-testid="button-guide-switch"
            >
              {tx('Switch to {mode}', { mode: tx(MODE_INFO[advice.suggest].label) })}
            </button>
          )}
        </Menti>
      </div>
    );
  }

  function renderStudyArea() {
    if (!selectedDeck) {
      return (
        <div className="rounded-[10px] border border-dashed border-[#dfe3e7] bg-[#fbfcfd] px-5 py-10 text-center" data-testid="study-empty">
          <p className="text-[13px] font-bold text-[#4f5a64]">{tx('Choose a deck to start studying.')}</p>
          <p className="mt-1 text-[11px] text-[#60686f]">{tx('Or create a new deck in your library above.')}</p>
        </div>
      );
    }
    if (deckCards.length === 0) {
      return (
        <div className="rounded-[10px] border border-dashed border-[#dfe3e7] bg-[#fbfcfd] px-5 py-10 text-center" data-testid="study-no-cards">
          <p className="text-[13px] font-bold text-[#4f5a64]">{tx('This deck has no cards yet.')}</p>
          <p className="mt-1 text-[11px] text-[#60686f]">{tx('Add your first card in “Cards in this deck” below.')}</p>
        </div>
      );
    }
    if (!activeSession) return null;

    if (activeSession.mode === 'review' && activeSession.order.length === 0) {
      return (
        <div className="rounded-[10px] border border-[#dee9e6] bg-[#f9f7f4] px-5 py-10 text-center" data-testid="review-nothing">
          <CheckCircle2 className="mx-auto text-[#396f5f]" size={26} />
          <p className="mt-3 text-[13px] font-bold text-[#3d685b]">{tx('Nothing to review right now.')}</p>
          <p className="mx-auto mt-1 max-w-[380px] text-[11px] leading-relaxed text-[#586a64]">
            {tx('Every card in this deck is mastered. Try Practice mode to test yourself again.')}
          </p>
          <button type="button" onClick={() => changeMode('practice')} className={`${primaryButton} mt-4`} data-testid="button-go-practice">
            {tx('Start Practice')}
          </button>
        </div>
      );
    }

    if (activeSession.order.length === 0) {
      return (
        <div className="rounded-[10px] border border-dashed border-[#dfe3e7] bg-[#fbfcfd] px-5 py-10 text-center" data-testid="study-restart">
          <p className="text-[13px] font-bold text-[#4f5a64]">{tx('This round has no cards left.')}</p>
          <button type="button" onClick={() => changeMode(activeSession.mode)} className={`${primaryButton} mt-4`} data-testid="button-restart-round">
            <RotateCcw size={15} /> {tx('Start a new round')}
          </button>
        </div>
      );
    }

    if (activeSession.finished) {
      const skipped = activeSession.order.length - sessionMarks.length;
      return (
        <div className="rounded-[10px] border border-[#e6ebf1] bg-[#f8fafc] px-5 py-8 text-center sm:px-8" data-testid="session-summary">
          <Menti pose="clap" size={80} message={t('menti.flashDone')} testId="menti-flashcards" className="mb-4 justify-center" />
          <p className="text-[13px] font-semibold text-[#4b698c]">
            {tx('{mode} round complete', { mode: tx(MODE_INFO[activeSession.mode].label) })}
          </p>
          <p className="font-display mt-2 text-[24px] font-extrabold tracking-[-.015em] text-[#364656]">
            {tx('{known} known · {again} to review', { known: knownInSession, again: againInSession })}
          </p>
          {skipped > 0 && (
            <p className="mt-1 text-[11px] text-[#5f6870]">
              {tx(skipped === 1 ? '{count} card skipped without a mark.' : '{count} cards skipped without a mark.', { count: skipped })}
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={() => changeMode(activeSession.mode)} className={secondaryButton} data-testid="button-round-again">
              <RotateCcw size={15} /> {tx('Go again')}
            </button>
            <button type="button" onClick={() => changeMode('review')} className={primaryButton} data-testid="button-summary-review">
              <Target size={15} /> {tx('Review cards that need work')}
            </button>
          </div>
        </div>
      );
    }

    if (!currentCard) return null;
    const status = getCardStatus(data.progress[currentCard.id]);

    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[#f8f6f3] px-3 py-1.5 text-[10px] font-bold text-[#5e676f]" data-testid="text-card-position">
            {progressLabel}
          </span>
          <div className="flex items-center gap-2">
            {currentMark && (
              <span className="text-[10px] font-bold text-[#5f6870]" data-testid="text-current-mark">
                {tx('Marked: {mark}', { mark: tx(currentMark === 'know' ? 'I know this' : 'Review again') })}
              </span>
            )}
            <StatusChip status={status} />
          </div>
        </div>

        <button
          type="button"
          onClick={flip}
          aria-pressed={activeSession.flipped}
          aria-label={activeSession.flipped ? tx('Show the front of the card') : tx('Flip to see the answer')}
          className="group mt-4 block w-full rounded-[10px] text-left [perspective:1600px]"
          data-testid="button-flashcard-flip"
        >
          <span
            className={`grid transition-transform duration-500 ease-[cubic-bezier(.2,.75,.25,1)] [transform-style:preserve-3d] motion-reduce:transition-none ${
              activeSession.flipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            <span
              className="flex min-h-[230px] flex-col items-center justify-center rounded-[10px] border border-[#e6ebf1] bg-[#f8fafc] px-6 py-8 text-center transition-colors [grid-area:1/1] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] group-hover:border-[#ced7e2] sm:min-h-[260px]"
              aria-hidden={activeSession.flipped}
              data-testid="flashcard-front"
            >
              <span className="rounded-full bg-[#fffdf8] px-3 py-1.5 text-[11px] font-semibold text-[#506883]">
                {tx('Front')}
              </span>
              <span className="font-display mt-5 block max-w-[560px] break-words text-[22px] font-extrabold leading-snug tracking-[-.015em] text-[#364656] sm:text-[27px]" data-content="card">
                {localizeCard(currentCard, lang).front}
              </span>
              <span className="mt-5 block text-[10px] font-semibold text-[#5f666d]">{tx('Tap to reveal the answer')}</span>
            </span>
            <span
              className="flex min-h-[230px] flex-col items-center justify-center rounded-[10px] border border-[#d5e6e1] bg-[#f9f7f4] px-6 py-8 text-center [grid-area:1/1] [transform:rotateY(180deg)] [backface-visibility:hidden] [-webkit-backface-visibility:hidden] sm:min-h-[260px]"
              aria-hidden={!activeSession.flipped}
              data-testid="flashcard-back"
            >
              <span className="rounded-full bg-[#fffdf8] px-3 py-1.5 text-[11px] font-semibold text-[#396e5e]">
                {tx('Answer')}
              </span>
              <span className="font-display mt-4 block max-w-[560px] break-words text-[19px] font-extrabold leading-snug tracking-[-.015em] text-[#364656] sm:text-[23px]" data-content="card">
                {localizeCard(currentCard, lang).answer}
              </span>
              {currentCard.explanation && (
                <span className="mt-3 block max-w-[540px] break-words text-[12px] leading-[1.7] text-[#586a64] sm:text-[13px]" data-content="card">
                  {localizeCard(currentCard, lang).explanation}
                </span>
              )}
              <span className="mt-4 block text-[10px] font-semibold text-[#6c665d]">{tx('Tap to see the front again')}</span>
            </span>
          </span>
        </button>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-center">
          <button
            type="button"
            onClick={() => mark('again')}
            disabled={needsFlip}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[6px] border border-[#e9d9cb] bg-[#fcf5f1] px-5 text-[12px] font-extrabold text-[#8f5847] transition-colors hover:bg-[#faebe0] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[180px]"
            data-testid="button-mark-again"
          >
            <RotateCcw size={16} /> {tx('Review Again')}
          </button>
          <button
            type="button"
            onClick={() => mark('know')}
            disabled={needsFlip}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[6px] bg-[#3b7262] px-5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#316052] disabled:cursor-not-allowed disabled:opacity-45 sm:min-w-[180px]"
            data-testid="button-mark-know"
          >
            <Check size={16} /> {tx('I Know This')}
          </button>
        </div>
        {needsFlip && (
          <p className="mt-2 text-center text-[10px] font-semibold text-[#60686f]" data-testid="text-flip-first">
            {tx('Flip the card first, then mark how you did.')}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#eef0f2] pt-4">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={activeSession.mode !== 'learn' && activeSession.index === 0}
            className={secondaryButton}
            aria-label={tx('Previous card')}
            data-testid="button-flashcard-previous"
          >
            <ChevronLeft size={15} /> <span className="hidden sm:inline">{tx('Previous')}</span>
          </button>
          <button type="button" onClick={shuffleSession} className={secondaryButton} data-testid="button-shuffle">
            <Shuffle size={15} /> {tx('Shuffle')}
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={activeSession.mode !== 'learn' && activeSession.index >= activeSession.order.length - 1 ? tx('Finish round') : tx('Next card')}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#54769d] px-4 text-[12px] font-bold text-white transition-colors hover:bg-[#527195]"
            data-testid="button-flashcard-next"
          >
            <span className="hidden sm:inline">
              {activeSession.mode !== 'learn' && activeSession.index >= activeSession.order.length - 1 ? tx('Finish') : tx('Next')}
            </span>
            <ChevronRight size={15} />
          </button>
        </div>
        {activeSession.mode === 'learn' && activeSession.completedLaps > 0 && (
          <p className="mt-3 text-center text-[11px] font-semibold text-[#3f7162]" data-testid="text-lap-complete">
            {activeSession.completedLaps > 1
              ? tx('You have been through the whole deck {count} times. Nice work.', { count: activeSession.completedLaps })
              : tx('You have been through the whole deck. Nice work.')}
          </p>
        )}
      </div>
    );
  }

  const confirmDeck = confirm?.kind === 'delete-deck' ? data.decks.find((deck) => deck.id === confirm.id) : undefined;

  return (
    <FlashcardsFrame storageUnavailable={Boolean(storageMessage)}>
      {storageMessage && (
        <div
          role="alert"
          className="rounded-[8px] border border-[#e8d7c0] bg-[#fdf9f2] px-4 py-3 text-[12px] leading-relaxed text-[#69502e]"
          data-testid="message-flashcards-storage"
        >
          {phrase(storageMessage)}
        </div>
      )}
      {notice && <NoticeBanner notice={notice} />}

      {/* ---------- deck library ---------- */}
      <Panel
        eyebrow={tx('Your library')}
        title={tx('Flashcard decks')}
        testId="panel-decks"
        trailing={
          <button type="button" onClick={openNewDeckForm} className={primaryButton} data-testid="button-new-deck">
            <Plus size={15} /> {tx('New deck')}
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="filter-grade">
            {tx('Grade')}
            <select
              id="filter-grade"
              value={filterGrade}
              onChange={(event) => setFilterGrade(event.currentTarget.value as 'all' | FlashcardGrade)}
              className={inputClassName}
              data-testid="select-filter-grade"
            >
              <option value="all">{tx('All grades')}</option>
              {FLASHCARD_GRADES.map((grade) => (
                <option key={grade} value={grade}>
                  {t('common.grade', { grade })}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] font-bold text-[#4b5966]" htmlFor="filter-subject">
            {tx('Subject')}
            <select
              id="filter-subject"
              value={filterSubject}
              onChange={(event) => setFilterSubject(event.currentTarget.value as 'all' | FlashcardSubject)}
              className={inputClassName}
              data-testid="select-filter-subject"
            >
              <option value="all">{tx('All subjects')}</option>
              {FLASHCARD_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subjectLabel(subject)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {deckForm?.mode === 'new' && (
          <div className="mt-4">
            <DeckForm
              draft={deckForm.draft}
              errors={deckForm.errors}
              onChange={(patch) => setDeckForm({ ...deckForm, draft: { ...deckForm.draft, ...patch }, errors: [] })}
              onSubmit={saveDeck}
              onCancel={() => setDeckForm(null)}
              submitLabel={tx('Create deck')}
            />
          </div>
        )}

        {visibleDecks.length === 0 ? (
          <div className="mt-4 rounded-[8px] border border-dashed border-[#dfe3e7] bg-[#fbfcfd] px-4 py-6 text-center" data-testid="decks-empty">
            <p className="text-[12px] font-bold text-[#4f5a64]">{tx('No decks match these filters.')}</p>
            <p className="mt-1 text-[11px] text-[#60686f]">{tx('Choose “All grades” and “All subjects”, or create a new deck.')}</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="deck-list">
            {visibleDecks.map((deck) => {
              const cards = data.cards.filter((card) => card.deckId === deck.id);
              const counts = countStatuses(cards, data.progress);
              const isSelected = deck.id === selectedDeck?.id;
              return (
                <button
                  key={deck.id}
                  type="button"
                  onClick={() => selectDeck(deck)}
                  aria-pressed={isSelected}
                  className={`flex min-w-0 flex-col rounded-[17px] border p-4 text-left transition-colors ${
                    isSelected
                      ? 'border-[#98afca] bg-[#f8fafc]'
                      : 'border-[#ddd5c6] bg-[#fffdf8] hover:border-[#d2dce7]'
                  }`}
                  data-testid={`deck-${deck.id}`}
                >
                  <span className="flex w-full items-start justify-between gap-2">
                    <span className="min-w-0">
                      <span className="block break-words text-[14px] font-extrabold text-[#384959]" data-content="card">{deckName(deck, lang)}</span>
                      <span className="mt-1 block text-[10px] font-bold text-[#5f6870]">
                        {t('common.grade', { grade: deck.grade })} · {subjectLabel(deck.subject)}
                        {deck.topic ? <span data-content="card">{` · ${deckTopic(deck, lang)}`}</span> : ''}
                      </span>
                    </span>
                    {deck.starter && (
                      <span className="shrink-0 rounded-full bg-[#eaf3f0] px-2 py-1 text-[11px] font-semibold text-[#3f7162]">
                        {tx('Starter')}
                      </span>
                    )}
                  </span>
                  <span className="mt-4 block w-full">
                    <StatusBar counts={counts} total={cards.length} />
                  </span>
                  <span className="mt-2 flex w-full flex-wrap justify-between gap-1 text-[10px] font-semibold text-[#5f6870]">
                    <span>
                      {tx(cards.length === 1 ? '{count} card' : '{count} cards', { count: cards.length })}
                    </span>
                    <span>
                      {tx('{mastered} mastered · {again} to review', { mastered: counts.mastered, again: counts.again })}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#eef0f2] pt-4">
          <p className="text-[10px] leading-relaxed text-[#60686f]">
            {tx(data.decks.length === 1 ? '{decks} deck · {cards} cards in your library' : '{decks} decks · {cards} cards in your library', {
              decks: data.decks.length,
              cards: data.cards.length,
            })}
          </p>
          <button type="button" onClick={restoreStarters} className={smallButton} data-testid="button-restore-starters">
            <RotateCcw size={13} /> {tx('Restore starter decks')}
          </button>
        </div>
      </Panel>

      {/* ---------- study area ---------- */}
      <div ref={studyRef} className="grid scroll-mt-24 gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Panel
          eyebrow={selectedDeck ? `${t('common.grade', { grade: selectedDeck.grade })} · ${subjectLabel(selectedDeck.subject)}` : tx('Study')}
          title={selectedDeck ? <span data-content="card">{deckName(selectedDeck, lang)}</span> : tx('No deck selected')}
          testId="panel-study"
        >
          {selectedDeck && (
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-1 rounded-full bg-[#f8f5f1] p-1" role="tablist" aria-label={tx('Study mode')}>
                {(Object.keys(MODE_INFO) as StudyMode[]).map((mode) => {
                  const selected = activeSession?.mode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => changeMode(mode)}
                      className={`min-h-10 rounded-full px-3 text-[12px] font-extrabold transition-colors ${
                        selected ? 'bg-[#fffdf8] text-[#4c6a8c]' : 'text-[#5e676f] hover:text-[#4c6a8c]'
                      }`}
                      data-testid={`tab-mode-${mode}`}
                    >
                      {tx(MODE_INFO[mode].label)}
                    </button>
                  );
                })}
              </div>
              {activeSession && (
                <p className="mt-2 text-[11px] leading-relaxed text-[#5f6870]" data-testid="text-mode-hint">
                  {tx(MODE_INFO[activeSession.mode].hint)}
                </p>
              )}
              {renderGuide()}
            </div>
          )}
          {renderStudyArea()}
        </Panel>

        <div className="grid content-start gap-5">
          <Panel eyebrow={tx('Deck progress')} title={tx('How you are doing')} testId="panel-progress">
            {selectedDeck ? (
              <div>
                <StatusBar counts={deckCounts} total={deckCards.length} />
                <dl className="mt-4 grid grid-cols-2 gap-2">
                  {STATUS_ORDER.map((status) => (
                    <div key={status} className="rounded-[8px] border border-[#eef0f2] px-3 py-2.5" data-testid={`count-${status}`}>
                      <dt className="flex items-center gap-1.5 text-[10px] font-bold text-[#5f6870]">
                        <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].bar}`} />
                        {tx(STATUS_LABELS[status])}
                      </dt>
                      <dd className="font-display mt-1 text-[22px] font-extrabold tracking-[-.015em] text-[#364656] tabular-nums">
                        {deckCounts[status]}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[10px] leading-relaxed text-[#60686f]">
                  {tx('“I Know This” moves a card up: New → Learning → Mastered. “Review Again” sends it back to Review again.')}
                </p>
                {confirm?.kind === 'reset-progress' && confirm.id === selectedDeck.id ? (
                  <div className="mt-3">
                    <InlineConfirm
                      message={tx('Reset progress for every card in this deck?')}
                      confirmLabel={tx('Reset')}
                      onConfirm={() => resetDeckProgress(selectedDeck.id)}
                      onCancel={() => setConfirm(null)}
                      testId="confirm-reset"
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: 'reset-progress', id: selectedDeck.id })}
                    className={`${smallButton} mt-3`}
                    data-testid="button-reset-progress"
                  >
                    <RotateCcw size={13} /> {tx('Reset deck progress')}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-[#5f6870]">{tx('Choose a deck to see its progress.')}</p>
            )}
          </Panel>

          <Panel eyebrow={tx('Review tip')} title={tx('Make recall active')}>
            <div className="grid h-11 w-11 place-items-center rounded-[8px] bg-[#f1f5f9] text-[#4a688c]">
              <Target size={20} />
            </div>
            <p className="mt-4 text-[12px] leading-[1.75] text-[#60676f]">
              {tx('Try to answer before you flip the card. Pausing to recall the idea helps you notice what you know and what needs another review.')}
            </p>
          </Panel>
        </div>
      </div>

      {/* ---------- managing cards ---------- */}
      {selectedDeck && (
        <Panel
          eyebrow={tx('Edit your deck')}
          title={tx('Cards in this deck')}
          testId="panel-cards"
          trailing={
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={openEditDeckForm} className={smallButton} data-testid="button-edit-deck">
                <Pencil size={13} /> {tx('Edit deck')}
              </button>
              <button
                type="button"
                onClick={() => setConfirm({ kind: 'delete-deck', id: selectedDeck.id })}
                className={smallButton}
                data-testid="button-delete-deck"
              >
                <Trash2 size={13} /> {tx('Delete deck')}
              </button>
            </div>
          }
        >
          {confirmDeck && (
            <div className="mb-4">
              <InlineConfirm
                message={tx(
                  deckCards.length === 1
                    ? 'Delete “{name}” and its {count} card? This cannot be undone.'
                    : 'Delete “{name}” and its {count} cards? This cannot be undone.',
                  { name: deckName(confirmDeck, lang), count: deckCards.length },
                )}
                confirmLabel={tx('Delete deck')}
                onConfirm={() => deleteDeck(confirmDeck.id)}
                onCancel={() => setConfirm(null)}
                testId="confirm-delete-deck"
              />
            </div>
          )}
          {deckForm?.mode === 'edit' && (
            <div className="mb-4">
              <DeckForm
                draft={deckForm.draft}
                errors={deckForm.errors}
                onChange={(patch) => setDeckForm({ ...deckForm, draft: { ...deckForm.draft, ...patch }, errors: [] })}
                onSubmit={saveDeck}
                onCancel={() => setDeckForm(null)}
                submitLabel={tx('Save deck')}
              />
            </div>
          )}

          <div className="rounded-[10px] border border-[#eaedf0] bg-[#fcfdfd] p-4">
            <p className="mb-3 flex items-center gap-2 text-[12px] font-extrabold text-[#3f4e5d]">
              <BookOpen size={15} className="text-[#4a688c]" /> {tx('Add a card')}
            </p>
            <CardForm
              draft={newCard.draft}
              errors={newCard.errors}
              onChange={(patch) => setNewCard({ draft: { ...newCard.draft, ...patch }, errors: [] })}
              onSubmit={addCard}
              submitLabel={tx('Add card')}
              idPrefix="new-card"
            />
          </div>

          {deckCards.length === 0 ? (
            <p className="mt-4 text-center text-[11px] text-[#60686f]" data-testid="cards-empty">
              {tx('No cards yet. Your first card will appear here.')}
            </p>
          ) : (
            <ol className="mt-4 space-y-2" data-testid="card-list">
              {deckCards.map((card, index) => {
                const status = getCardStatus(data.progress[card.id]);
                if (editingCard?.id === card.id) {
                  return (
                    <li key={card.id} className="rounded-[10px] border border-[#ddd5c6] bg-[#fffdf8] p-4" data-testid={`card-item-${card.id}`}>
                      <CardForm
                        draft={editingCard.draft}
                        errors={editingCard.errors}
                        onChange={(patch) => setEditingCard({ ...editingCard, draft: { ...editingCard.draft, ...patch }, errors: [] })}
                        onSubmit={saveCardEdit}
                        onCancel={() => setEditingCard(null)}
                        submitLabel={tx('Save card')}
                        idPrefix="edit-card"
                      />
                    </li>
                  );
                }
                return (
                  <li key={card.id} className="rounded-[10px] border border-[#eef0f2] p-4" data-testid={`card-item-${card.id}`}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#f1f5f9] text-[10px] font-extrabold text-[#4c6a8c]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <p className="break-words text-[13px] font-extrabold text-[#3f4e5d]" data-content="card">{localizeCard(card, lang).front}</p>
                          <p className="mt-1 break-words text-[12px] text-[#5e6973]" data-content="card">{localizeCard(card, lang).answer}</p>
                          {card.explanation && (
                            <p className="mt-1 break-words text-[11px] leading-relaxed text-[#60686f]" data-content="card">{localizeCard(card, lang).explanation}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-10 sm:pl-0">
                        <StatusChip status={status} />
                        <button
                          type="button"
                          onClick={() => beginEditCard(card)}
                          className={smallButton}
                          aria-label={tx('Edit card: {front}', { front: localizeCard(card, lang).front })}
                          data-testid={`button-edit-card-${card.id}`}
                        >
                          <Pencil size={13} /> {tx('Edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirm({ kind: 'delete-card', id: card.id })}
                          className={smallButton}
                          aria-label={tx('Delete card: {front}', { front: localizeCard(card, lang).front })}
                          data-testid={`button-delete-card-${card.id}`}
                        >
                          <X size={13} /> {tx('Delete')}
                        </button>
                      </div>
                    </div>
                    {confirm?.kind === 'delete-card' && confirm.id === card.id && (
                      <div className="mt-3">
                        <InlineConfirm
                          message={tx('Delete this card and its progress?')}
                          confirmLabel={tx('Delete card')}
                          onConfirm={() => deleteCard(card.id)}
                          onCancel={() => setConfirm(null)}
                          testId="confirm-delete-card"
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      )}
    </FlashcardsFrame>
  );
}
