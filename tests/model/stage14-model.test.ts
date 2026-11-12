// Stage 14: no duplicate deck names; Menti's study advice.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDuplicateDeck, isOwnDeckName, sameDeckName, studyAdvice } from '../../artifacts/ai-exam-survival/src/pages/flashcards-guide';
import { STARTER_DECKS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-starter-decks';

const starter = STARTER_DECKS.find((d) => d.id === 'starter-biology-9-cell-structure')!;
const decks = [
  { id: starter.id, name: starter.name, starter: true },
  { id: 'deck-1', name: 'Kelimelerim', starter: false },
  { id: 'deck-2', name: 'Irmak Listesi', starter: false },
];

test('same name in any letter case or with extra spaces counts as a duplicate', () => {
  assert.ok(sameDeckName('Kelimelerim', '  kelimelerim '));
  assert.ok(sameDeckName('KELİMELERİM', 'kelimelerim'), 'Turkish İ');
  assert.ok(sameDeckName('IRMAK LISTESI', 'Irmak Listesi'), 'English I');
  assert.ok(sameDeckName('ırmak listesi', 'Irmak Listesi'), 'Turkish ı');
  assert.ok(sameDeckName('Hücre  Yapısı', 'hücre yapısı'), 'double space');
  assert.ok(!sameDeckName('Kelimelerim 2', 'Kelimelerim'));
});

test('a new deck cannot use a name another deck already has (any grade or subject), in either language for starter decks', () => {
  assert.equal(findDuplicateDeck('kelimelerim', decks)?.id, 'deck-1');
  assert.equal(findDuplicateDeck('Cell Structure', decks)?.id, starter.id, 'English starter name');
  assert.equal(findDuplicateDeck('hücrenin yapısı', decks)?.id, starter.id, 'Turkish starter name');
  assert.equal(findDuplicateDeck('Yeni deste', decks), null);
  assert.equal(findDuplicateDeck('   ', decks), null, 'empty name is handled by the normal check');
});

test('an edited deck may keep its own name, but cannot take another deck’s name', () => {
  assert.equal(findDuplicateDeck('Kelimelerim', decks, 'deck-1'), null);
  assert.equal(findDuplicateDeck('Irmak listesi', decks, 'deck-1')?.id, 'deck-2');
  assert.ok(isOwnDeckName('Hücrenin Yapısı', decks[0]), 'Turkish name of an unchanged starter deck');
  assert.ok(isOwnDeckName('cell structure', decks[0]));
  assert.ok(!isOwnDeckName('Kelimelerim', decks[0]));
});

const counts = (n: number, a: number, l: number, m: number) => ({ new: n, again: a, learning: l, mastered: m });

test('Menti’s advice follows the student’s real progress', () => {
  assert.equal(studyAdvice(counts(0, 0, 0, 0), 'learn'), null);
  assert.deepEqual(studyAdvice(counts(10, 0, 0, 0), 'practice'), { kind: 'new', suggest: 'learn', pose: 'point', count: 10 });
  assert.deepEqual(studyAdvice(counts(5, 2, 3, 0), 'learn'), { kind: 'struggling', suggest: 'review', pose: 'encourage', count: 2 });
  assert.deepEqual(studyAdvice(counts(0, 0, 0, 10), 'review'), { kind: 'mastered', suggest: 'practice', pose: 'cheer', count: 10 });
  assert.deepEqual(studyAdvice(counts(4, 0, 3, 3), 'learn'), { kind: 'keep-going', suggest: 'practice', pose: 'point', count: 6 });
});

test('a hard round (3+ “Review again” outside Review mode) gets reassurance first', () => {
  assert.equal(studyAdvice(counts(6, 4, 0, 0), 'practice', 4)?.kind, 'hard-round');
  assert.equal(studyAdvice(counts(6, 4, 0, 0), 'practice', 2)?.kind, 'struggling');
  assert.equal(studyAdvice(counts(6, 4, 0, 0), 'review', 5)?.kind, 'struggling', 'not in Review mode');
});
