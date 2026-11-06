// Smart Flashcards: data, saving and study rules.
// This file has no screen code, so its rules can be tested on their own.

import {
  QUIZ_GRADES,
  QUIZ_SUBJECTS,
  type QuizGrade,
  type QuizSubject,
} from './quiz-question-bank';
import { STARTER_DECKS } from './flashcards-starter-decks';

export const FLASHCARDS_STORAGE_KEY = 'ai-exam-survival:flashcards:v1';

// Grades and subjects are shared with Quiz Center so the tools stay consistent.
export const FLASHCARD_GRADES = QUIZ_GRADES;
export const FLASHCARD_SUBJECTS = QUIZ_SUBJECTS;
export type FlashcardGrade = QuizGrade;
export type FlashcardSubject = QuizSubject;

export const LIMITS = {
  deckName: 60,
  topic: 60,
  front: 200,
  answer: 300,
  explanation: 500,
} as const;

/** How long a review session can be, so a big deck never feels endless. */
export const MAX_REVIEW_SESSION = 20;
/** A card marked "Review again" comes back this many cards later in Review mode. */
export const REVIEW_AGAIN_GAP = 3;
/** A card can come back at most this many extra times in one Review session. */
export const MAX_REQUEUES_PER_CARD = 2;

export type FlashcardDeck = {
  id: string;
  name: string;
  grade: FlashcardGrade;
  subject: FlashcardSubject;
  topic: string;
  starter: boolean;
  createdAt: string;
};

export type Flashcard = {
  id: string;
  deckId: string;
  front: string;
  answer: string;
  explanation: string;
};

/**
 * Leitner boxes:
 * 1 = marked "Review again" (needs work), 2 = known once, 3 = known twice in a row (mastered).
 * A card with no progress entry is "new".
 */
export type LeitnerBox = 1 | 2 | 3;
export type MarkResult = 'know' | 'again';

export type CardProgress = {
  box: LeitnerBox;
  knownCount: number;
  againCount: number;
  lastResult: MarkResult;
  lastReviewedAt: string;
};

export type FlashcardsData = {
  version: 1;
  decks: FlashcardDeck[];
  cards: Flashcard[];
  progress: Record<string, CardProgress>;
  selectedDeckId: string | null;
};

export type CardStatus = 'new' | 'again' | 'learning' | 'mastered';
export type StudyMode = 'learn' | 'practice' | 'review';

export type StarterDeck = Omit<FlashcardDeck, 'starter' | 'createdAt'> & {
  cards: Omit<Flashcard, 'deckId'>[];
};

// ---------- ids and random order ----------

export function createFlashcardId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Fisher–Yates shuffle. `random` can be replaced in tests. */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

// ---------- starter decks ----------

export function starterDecksAsData(now = new Date().toISOString()) {
  const decks: FlashcardDeck[] = [];
  const cards: Flashcard[] = [];
  STARTER_DECKS.forEach((starter) => {
    const { cards: starterCards, ...deck } = starter;
    decks.push({ ...deck, starter: true, createdAt: now });
    starterCards.forEach((card) => cards.push({ ...card, deckId: deck.id }));
  });
  return { decks, cards };
}

export function createInitialFlashcardsData(): FlashcardsData {
  const { decks, cards } = starterDecksAsData();
  return {
    version: 1,
    decks,
    cards,
    progress: {},
    selectedDeckId: decks[0]?.id ?? null,
  };
}

/** Adds back any starter deck that was deleted. Existing decks are not touched. */
export function restoreStarterDecks(data: FlashcardsData) {
  const { decks, cards } = starterDecksAsData();
  const existingDeckIds = new Set(data.decks.map((deck) => deck.id));
  const missingDecks = decks.filter((deck) => !existingDeckIds.has(deck.id));
  const missingIds = new Set(missingDecks.map((deck) => deck.id));
  return {
    data: {
      ...data,
      decks: [...data.decks, ...missingDecks],
      cards: [...data.cards, ...cards.filter((card) => missingIds.has(card.deckId))],
    },
    restored: missingDecks.length,
  };
}

// ---------- learning progress ----------

export function getCardStatus(progress: CardProgress | undefined): CardStatus {
  if (!progress) return 'new';
  if (progress.box === 1) return 'again';
  if (progress.box === 2) return 'learning';
  return 'mastered';
}

/** "I know this" moves a card up one box; "Review again" sends it back to box 1. */
export function applyMark(
  current: CardProgress | undefined,
  result: MarkResult,
  now = new Date().toISOString(),
): CardProgress {
  if (result === 'again') {
    return {
      box: 1,
      knownCount: current?.knownCount ?? 0,
      againCount: (current?.againCount ?? 0) + 1,
      lastResult: 'again',
      lastReviewedAt: now,
    };
  }
  const nextBox: LeitnerBox = !current ? 2 : current.box === 1 ? 2 : 3;
  return {
    box: nextBox,
    knownCount: (current?.knownCount ?? 0) + 1,
    againCount: current?.againCount ?? 0,
    lastResult: 'know',
    lastReviewedAt: now,
  };
}

export function countStatuses(
  cards: readonly Flashcard[],
  progress: Record<string, CardProgress>,
) {
  const counts: Record<CardStatus, number> = { new: 0, again: 0, learning: 0, mastered: 0 };
  cards.forEach((card) => {
    counts[getCardStatus(progress[card.id])] += 1;
  });
  return counts;
}

/**
 * How often a card appears in Review mode.
 * Cards marked "Review again" appear three times, new and learning cards once,
 * and mastered cards rest.
 */
export function reviewWeight(progress: CardProgress | undefined) {
  const status = getCardStatus(progress);
  if (status === 'again') return 3;
  if (status === 'mastered') return 0;
  return 1;
}

// ---------- study order for each mode ----------

/** Learn: every card in deck order (or shuffled). */
export function buildLearnOrder(
  cards: readonly Flashcard[],
  shuffled = false,
  random: () => number = Math.random,
) {
  const ids = cards.map((card) => card.id);
  return shuffled ? shuffle(ids, random) : ids;
}

/** Practice: every card once, in a random order. */
export function buildPracticeOrder(
  cards: readonly Flashcard[],
  random: () => number = Math.random,
) {
  return shuffle(
    cards.map((card) => card.id),
    random,
  );
}

/**
 * Reorders cards so the same card never comes twice in a row, whenever that
 * is possible. It keeps the existing (shuffled) order as much as it can.
 */
export function spreadRepeats(ids: readonly string[]) {
  const remaining = [...ids];
  const result: string[] = [];
  while (remaining.length > 0) {
    const last = result[result.length - 1];
    const counts = new Map<string, number>();
    remaining.forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
    let mostCommonId = remaining[0];
    counts.forEach((count, id) => {
      if (count > (counts.get(mostCommonId) ?? 0)) mostCommonId = id;
    });
    // If one card makes up more than half of what is left, it must go next
    // (when allowed), or it would be forced to repeat later.
    let pick: number;
    if (mostCommonId !== last && (counts.get(mostCommonId) ?? 0) * 2 > remaining.length) {
      pick = remaining.indexOf(mostCommonId);
    } else {
      pick = remaining.findIndex((id) => id !== last);
      if (pick === -1) pick = 0; // only copies of the last card are left
    }
    result.push(remaining.splice(pick, 1)[0]);
  }
  return result;
}

/**
 * Review: cards that need work, weighted (see reviewWeight), shuffled,
 * spread out so the same card does not appear twice in a row, and capped.
 */
export function buildReviewQueue(
  cards: readonly Flashcard[],
  progress: Record<string, CardProgress>,
  random: () => number = Math.random,
  maxLength = MAX_REVIEW_SESSION,
) {
  const weighted: string[] = [];
  cards.forEach((card) => {
    const weight = reviewWeight(progress[card.id]);
    for (let copy = 0; copy < weight; copy += 1) weighted.push(card.id);
  });
  const ordered = spreadRepeats(shuffle(weighted, random));
  if (ordered.length <= maxLength) return ordered;

  // Keep every card at least once before cutting the session to length.
  const firstCopies: string[] = [];
  const extraCopies: string[] = [];
  const seen = new Set<string>();
  ordered.forEach((id) => {
    if (seen.has(id)) extraCopies.push(id);
    else {
      seen.add(id);
      firstCopies.push(id);
    }
  });
  const kept = [...firstCopies, ...extraCopies].slice(0, maxLength);
  return spreadRepeats(shuffle(kept, random));
}

/**
 * In Review mode, a card marked "Review again" comes back a few cards later.
 * Returns the queue unchanged when the card has already come back enough times.
 */
export function requeueCard(
  queue: readonly string[],
  currentIndex: number,
  cardId: string,
  timesAlreadyRequeued: number,
  gap = REVIEW_AGAIN_GAP,
) {
  if (timesAlreadyRequeued >= MAX_REQUEUES_PER_CARD) return [...queue];
  const result = [...queue];
  const position = Math.min(currentIndex + 1 + gap, result.length);
  result.splice(position, 0, cardId);
  return result;
}

// ---------- checking what students type ----------

export type CardDraft = { front: string; answer: string; explanation: string };
export type DeckDraft = {
  name: string;
  grade: string;
  subject: string;
  topic: string;
};

export function validateCardDraft(draft: CardDraft) {
  const errors: string[] = [];
  if (!draft.front.trim()) errors.push('Write the question or concept on the front.');
  if (!draft.answer.trim()) errors.push('Write the answer on the back.');
  if (draft.front.trim().length > LIMITS.front)
    errors.push(`Keep the front under ${LIMITS.front} characters.`);
  if (draft.answer.trim().length > LIMITS.answer)
    errors.push(`Keep the answer under ${LIMITS.answer} characters.`);
  if (draft.explanation.trim().length > LIMITS.explanation)
    errors.push(`Keep the explanation under ${LIMITS.explanation} characters.`);
  return errors;
}

export function validateDeckDraft(draft: DeckDraft) {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push('Give the deck a name.');
  if (draft.name.trim().length > LIMITS.deckName)
    errors.push(`Keep the deck name under ${LIMITS.deckName} characters.`);
  if (!(FLASHCARD_GRADES as readonly string[]).includes(draft.grade))
    errors.push('Choose a grade from 9 to 12.');
  if (!(FLASHCARD_SUBJECTS as readonly string[]).includes(draft.subject))
    errors.push('Choose a subject.');
  if (draft.topic.trim().length > LIMITS.topic)
    errors.push(`Keep the topic under ${LIMITS.topic} characters.`);
  return errors;
}

// ---------- reading saved data safely ----------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isDeck(value: unknown): value is FlashcardDeck {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (FLASHCARD_GRADES as readonly unknown[]).includes(value.grade) &&
    (FLASHCARD_SUBJECTS as readonly unknown[]).includes(value.subject) &&
    typeof value.topic === 'string' &&
    typeof value.starter === 'boolean' &&
    typeof value.createdAt === 'string'
  );
}

function isCard(value: unknown): value is Flashcard {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.deckId === 'string' &&
    typeof value.front === 'string' &&
    typeof value.answer === 'string' &&
    typeof value.explanation === 'string'
  );
}

function isProgress(value: unknown): value is CardProgress {
  return (
    isRecord(value) &&
    (value.box === 1 || value.box === 2 || value.box === 3) &&
    Number.isInteger(value.knownCount) &&
    Number.isInteger(value.againCount) &&
    (value.lastResult === 'know' || value.lastResult === 'again') &&
    typeof value.lastReviewedAt === 'string'
  );
}

export function isSavedFlashcardsData(value: unknown): value is FlashcardsData {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.decks) &&
    value.decks.every(isDeck) &&
    Array.isArray(value.cards) &&
    value.cards.every(isCard) &&
    isRecord(value.progress) &&
    Object.values(value.progress).every(isProgress) &&
    (value.selectedDeckId === null || typeof value.selectedDeckId === 'string')
  );
}
