import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMark,
  buildLearnOrder,
  buildPracticeOrder,
  buildReviewQueue,
  countStatuses,
  createInitialFlashcardsData,
  getCardStatus,
  isSavedFlashcardsData,
  requeueCard,
  restoreStarterDecks,
  reviewWeight,
  shuffle,
  spreadRepeats,
  validateCardDraft,
  validateDeckDraft,
  MAX_REVIEW_SESSION,
  type CardProgress,
  type Flashcard,
} from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import { STARTER_DECKS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-starter-decks';

const seeded = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const cards = (n: number): Flashcard[] =>
  Array.from({ length: n }, (_, i) => ({ id: `c${i}`, deckId: 'd', front: `f${i}`, answer: `a${i}`, explanation: '' }));
const at = (box: 1 | 2 | 3): CardProgress => ({
  box, knownCount: 0, againCount: 0, lastResult: box === 1 ? 'again' : 'know', lastReviewedAt: '2026-11-05T00:00:00Z',
});

test('starter decks: 5 decks, 50 cards, unique ids, every card complete', () => {
  assert.equal(STARTER_DECKS.length, 5);
  const deckIds = STARTER_DECKS.map((d) => d.id);
  assert.equal(new Set(deckIds).size, deckIds.length);
  const cardIds = STARTER_DECKS.flatMap((d) => d.cards.map((c) => c.id));
  assert.equal(cardIds.length, 50);
  assert.equal(new Set(cardIds).size, 50);
  STARTER_DECKS.flatMap((d) => d.cards).forEach((c) => {
    assert.deepEqual(validateCardDraft(c), [], `card ${c.id} invalid`);
    assert.ok(c.explanation.length > 0, `card ${c.id} has no explanation`);
  });
  STARTER_DECKS.forEach((d) => assert.deepEqual(validateDeckDraft(d), [], `deck ${d.id} invalid`));
  const subjects = new Set(STARTER_DECKS.map((d) => d.subject));
  assert.deepEqual([...subjects].sort(), ['Biology', 'English', 'Mathematics']);
});

test('initial data passes its own save check and selects a deck', () => {
  const data = createInitialFlashcardsData();
  assert.ok(isSavedFlashcardsData(data));
  assert.equal(data.selectedDeckId, STARTER_DECKS[0].id);
  assert.equal(data.cards.length, 50);
});

test('save check rejects damaged data', () => {
  const data = createInitialFlashcardsData();
  assert.equal(isSavedFlashcardsData({ ...data, version: 2 }), false);
  assert.equal(isSavedFlashcardsData({ ...data, decks: [{ id: 'x' }] }), false);
  assert.equal(isSavedFlashcardsData({ ...data, progress: { c1: { box: 7 } } }), false);
  assert.equal(isSavedFlashcardsData(null), false);
  assert.equal(isSavedFlashcardsData('nonsense'), false);
});

test('Leitner rules: know moves up, again goes back to box 1', () => {
  const now = '2026-11-05T10:00:00Z';
  const first = applyMark(undefined, 'know', now);
  assert.equal(first.box, 2);
  assert.equal(getCardStatus(first), 'learning');
  const second = applyMark(first, 'know', now);
  assert.equal(second.box, 3);
  assert.equal(getCardStatus(second), 'mastered');
  assert.equal(applyMark(second, 'know', now).box, 3);
  const missed = applyMark(second, 'again', now);
  assert.equal(missed.box, 1);
  assert.equal(getCardStatus(missed), 'again');
  assert.equal(missed.againCount, 1);
  assert.equal(missed.knownCount, 2);
  assert.equal(applyMark(missed, 'know', now).box, 2);
  assert.equal(getCardStatus(undefined), 'new');
});

test('status counts add up', () => {
  const c = cards(4);
  const counts = countStatuses(c, { c0: at(1), c1: at(2), c2: at(3) });
  assert.deepEqual(counts, { new: 1, again: 1, learning: 1, mastered: 1 });
});

test('shuffle keeps every item exactly once', () => {
  const items = Array.from({ length: 30 }, (_, i) => i);
  const result = shuffle(items, seeded(7));
  assert.deepEqual([...result].sort((a, b) => a - b), items);
  assert.notDeepEqual(result, items);
});

test('Learn keeps deck order unless shuffled; Practice uses every card once', () => {
  const c = cards(10);
  assert.deepEqual(buildLearnOrder(c), c.map((x) => x.id));
  const shuffled = buildLearnOrder(c, true, seeded(3));
  assert.deepEqual([...shuffled].sort(), c.map((x) => x.id).sort());
  const practice = buildPracticeOrder(c, seeded(5));
  assert.equal(practice.length, 10);
  assert.equal(new Set(practice).size, 10);
});

test('Review weights: again ×3, new and learning ×1, mastered rests', () => {
  assert.equal(reviewWeight(at(1)), 3);
  assert.equal(reviewWeight(undefined), 1);
  assert.equal(reviewWeight(at(2)), 1);
  assert.equal(reviewWeight(at(3)), 0);
  const c = cards(4);
  const queue = buildReviewQueue(c, { c0: at(1), c1: at(2), c2: at(3) }, seeded(11));
  const count = (id: string) => queue.filter((x) => x === id).length;
  assert.equal(count('c0'), 3, 'review-again card appears 3 times');
  assert.equal(count('c1'), 1);
  assert.equal(count('c2'), 0, 'mastered card rests');
  assert.equal(count('c3'), 1, 'new card appears once');
});

test('Review shows "Review again" cards more often than others across many shuffles', () => {
  const c = cards(6);
  const progress = { c0: at(1), c1: at(1) };
  for (let seed = 1; seed < 50; seed += 1) {
    const queue = buildReviewQueue(c, progress, seeded(seed));
    const again = queue.filter((x) => x === 'c0' || x === 'c1').length;
    const others = queue.length - again;
    assert.equal(again, 6);
    assert.equal(others, 4);
    for (let i = 1; i < queue.length; i += 1) assert.notEqual(queue[i], queue[i - 1], `repeat at ${i} (seed ${seed})`);
  }
});

test('Review is empty when every card is mastered', () => {
  const c = cards(3);
  assert.deepEqual(buildReviewQueue(c, { c0: at(3), c1: at(3), c2: at(3) }), []);
});

test('Review session is capped but still includes every card that needs work', () => {
  const c = cards(15);
  const progress = Object.fromEntries(c.map((x) => [x.id, at(1)]));
  const queue = buildReviewQueue(c, progress, seeded(9));
  assert.equal(queue.length, MAX_REVIEW_SESSION);
  assert.equal(new Set(queue).size, 15);
});

test('spreadRepeats separates back-to-back copies when possible', () => {
  assert.deepEqual(spreadRepeats(['a', 'a', 'b']), ['a', 'b', 'a']);
  const r = spreadRepeats(['a', 'a', 'a', 'b', 'b', 'c']);
  for (let i = 1; i < r.length; i += 1) assert.notEqual(r[i], r[i - 1]);
});

test('"Review again" in Review brings the card back 3 cards later, at most twice', () => {
  const q = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.deepEqual(requeueCard(q, 0, 'a', 0), ['a', 'b', 'c', 'd', 'a', 'e', 'f']);
  assert.deepEqual(requeueCard(q, 4, 'e', 1), ['a', 'b', 'c', 'd', 'e', 'f', 'e']);
  assert.deepEqual(requeueCard(q, 0, 'a', 2), q);
});

test('card and deck checks give clear messages', () => {
  assert.deepEqual(validateCardDraft({ front: ' ', answer: '', explanation: '' }), [
    'Write the question or concept on the front.',
    'Write the answer on the back.',
  ]);
  assert.equal(validateCardDraft({ front: 'x'.repeat(201), answer: 'a', explanation: '' }).length, 1);
  assert.deepEqual(validateDeckDraft({ name: '', grade: '13', subject: 'Art', topic: '' }), [
    'Give the deck a name.',
    'Choose a grade from 9 to 12.',
    'Choose a subject.',
  ]);
});

test('restoring starter decks only adds missing ones', () => {
  const data = createInitialFlashcardsData();
  const removed = {
    ...data,
    decks: data.decks.filter((d) => d.id !== STARTER_DECKS[1].id),
    cards: data.cards.filter((c) => c.deckId !== STARTER_DECKS[1].id),
  };
  const { data: restored, restored: n } = restoreStarterDecks(removed);
  assert.equal(n, 1);
  assert.equal(restored.cards.length, 50);
  assert.equal(restoreStarterDecks(restored).restored, 0);
});

test('spreadRepeats: never back-to-back when possible, across random inputs', () => {
  const rnd = seeded(42);
  for (let run = 0; run < 500; run += 1) {
    const items: string[] = [];
    const kinds = 1 + Math.floor(rnd() * 6);
    for (let k = 0; k < kinds; k += 1) {
      const copies = 1 + Math.floor(rnd() * 4);
      for (let c = 0; c < copies; c += 1) items.push(`k${k}`);
    }
    const input = shuffle(items, rnd);
    const out = spreadRepeats(input);
    assert.deepEqual([...out].sort(), [...input].sort(), 'same items');
    const max = Math.max(...[...new Set(input)].map((id) => input.filter((x) => x === id).length));
    const possible = max <= Math.ceil(input.length / 2);
    const repeats = out.filter((x, i) => i > 0 && x === out[i - 1]).length;
    if (possible) assert.equal(repeats, 0, `repeat in ${out.join(',')}`);
  }
});
