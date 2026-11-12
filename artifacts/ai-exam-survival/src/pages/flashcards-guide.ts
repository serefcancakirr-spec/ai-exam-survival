// Stage 14: (1) no two decks with the same name, (2) Menti's study advice for the chosen deck.
// Pure rules, nothing is saved.
import { deckName } from '../i18n/content';
import type { CardStatus, FlashcardDeck, StudyMode } from './flashcards-model';

/** Both lower-case forms (Turkish and English rules for I/ı/İ), with extra spaces removed. */
function nameForms(name: string) {
  const clean = name.trim().replace(/\s+/g, ' ');
  return [clean.toLocaleLowerCase('tr'), clean.toLocaleLowerCase('en')];
}

/** The names a deck is known by: its saved name and, for an unchanged starter deck, its Turkish name. */
function deckNames(deck: Pick<FlashcardDeck, 'id' | 'name' | 'starter'>) {
  return [...new Set([deck.name, deckName(deck, 'tr')])];
}

export function sameDeckName(a: string, b: string) {
  const fa = nameForms(a);
  const fb = nameForms(b);
  return fa.some((x) => fb.includes(x));
}

/** True when `name` is one of this deck's own names (used so an unchanged name never blocks saving). */
export function isOwnDeckName(name: string, deck: Pick<FlashcardDeck, 'id' | 'name' | 'starter'>) {
  return deckNames(deck).some((n) => sameDeckName(name, n));
}

/** Another deck that already uses this name (any grade or subject), or null. */
export function findDuplicateDeck<T extends Pick<FlashcardDeck, 'id' | 'name' | 'starter'>>(
  name: string,
  decks: T[],
  excludeId: string | null = null,
): T | null {
  if (!name.trim()) return null;
  return decks.find((deck) => deck.id !== excludeId && deckNames(deck).some((n) => sameDeckName(name, n))) ?? null;
}

// ---------- study advice ----------

export type StudyAdvice = {
  kind: 'new' | 'struggling' | 'mastered' | 'keep-going' | 'hard-round';
  /** The mode Menti suggests. */
  suggest: StudyMode;
  pose: 'point' | 'encourage' | 'cheer';
  count: number;
};

/**
 * What Menti suggests for a deck, from the student's real progress:
 * all new → Learn; cards marked "Review again" → Review; all mastered or mostly known → Practice.
 * In a round where the student already marked 3+ cards "Review again" (outside Review mode), Menti reassures them.
 */
export function studyAdvice(counts: Record<CardStatus, number>, mode: StudyMode, againThisRound = 0): StudyAdvice | null {
  const total = counts.new + counts.again + counts.learning + counts.mastered;
  if (total === 0) return null;
  if (againThisRound >= 3 && mode !== 'review') return { kind: 'hard-round', suggest: 'review', pose: 'encourage', count: againThisRound };
  if (counts.new === total) return { kind: 'new', suggest: 'learn', pose: 'point', count: total };
  if (counts.again > 0) return { kind: 'struggling', suggest: 'review', pose: 'encourage', count: counts.again };
  if (counts.mastered === total) return { kind: 'mastered', suggest: 'practice', pose: 'cheer', count: total };
  return { kind: 'keep-going', suggest: 'practice', pose: 'point', count: counts.learning + counts.mastered };
}
