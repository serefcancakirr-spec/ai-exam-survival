// Stage 22F: grade decks for Mathematics, Physics, Chemistry and Biology (25 MEB key concepts per subject and grade).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROGRAM_NAMES,
  SCIENCE_GRADE_DECKS,
  SCIENCE_SUBJECTS,
  createScienceGradeDeck,
  scienceConceptNote,
  scienceGradeDeckId,
  scienceGradeDeckName,
  type ScienceGrade,
} from '../../artifacts/ai-exam-survival/src/pages/flashcards-grade-science';
import { createLevelDeck } from '../../artifacts/ai-exam-survival/src/pages/flashcards-english-levels';
import { LIMITS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import official from '../data/meb-science-key-concepts.json';

const GRADES: ScienceGrade[] = ['9', '10', '11', '12'];
const lower = (s: string) => s.toLocaleLowerCase('tr-TR');
const unitsOf = (subject: string, grade: string) => official.units.filter((u) => u.subject === subject && u.grade === grade);

test('16 decks (4 subjects × grades 9–12) of 25 different concepts; 400 cards', () => {
  assert.deepEqual(SCIENCE_SUBJECTS, ['Mathematics', 'Physics', 'Chemistry', 'Biology']);
  let n = 0;
  for (const g of GRADES) {
    for (const s of SCIENCE_SUBJECTS) {
      const deck = SCIENCE_GRADE_DECKS[g][s];
      assert.equal(deck.concepts.length, 25, `${g} ${s}`);
      assert.equal(new Set(deck.concepts.map((c) => lower(c[0]))).size, 25, `${g} ${s} duplicates`);
      n += deck.concepts.length;
    }
  }
  assert.equal(n, 400);
});

test('unit names and numbers match the program', () => {
  for (const g of GRADES) {
    for (const s of SCIENCE_SUBJECTS) {
      const deck = SCIENCE_GRADE_DECKS[g][s];
      for (const [num, title] of Object.entries(deck.units)) {
        const o = unitsOf(s, g).filter((u) => u.unit === Number(num));
        assert.ok(o.length > 0, `${g} ${s} unit ${num}`);
        assert.ok(o.some((u) => u.title.replace(/ \(\d\)$/, '') === title.toLocaleUpperCase('tr-TR')), `${g} ${s} unit ${num}: ${title}`);
      }
      assert.equal(deck.unitWord, s === 'Physics' ? 'ünite' : 'tema');
    }
  }
});

test('every concept is a key concept of its unit, or (marked) in that unit’s content frame', () => {
  let fromContent = 0;
  for (const g of GRADES) {
    for (const s of SCIENCE_SUBJECTS) {
      const units = unitsOf(s, g);
      for (const [concept, , unit, isContent] of SCIENCE_GRADE_DECKS[g][s].concepts) {
        const own = units.filter((u) => u.unit === unit);
        if (!isContent) {
          assert.ok(own.some((u) => u.concepts.includes(concept)), `${g} ${s}: “${concept}” is not a key concept of unit ${unit}`);
        } else {
          fromContent += 1;
          const text = lower(own.map((u) => u.content).join(' '));
          for (const w of lower(concept).split(' ')) assert.ok(text.includes(w.slice(0, Math.max(4, w.length - 2))), `${g} ${s}: “${concept}” not in the content of unit ${unit}`);
        }
      }
      // content-frame concepts only fill a grade that has fewer than 25 key concepts
      const keyCount = new Set(units.flatMap((u) => u.concepts)).size;
      const used = SCIENCE_GRADE_DECKS[g][s].concepts.filter((c) => c[3]).length;
      assert.ok(used === 0 || keyCount < 25, `${g} ${s}: has ${keyCount} key concepts, so no content-frame concepts are needed`);
    }
  }
  assert.equal(fromContent, 5 + 9 + 12, 'only grades 10, 11, 12 Biology are filled');
});

test('every card: a real definition within the card limits', () => {
  for (const g of GRADES) {
    for (const s of SCIENCE_SUBJECTS) {
      const { cards } = createScienceGradeDeck(g, s, 'tr', scienceGradeDeckName(g, s, 'tr'));
      cards.forEach((card) => {
        assert.ok(card.answer.length >= 20 && /[.)]$/.test(card.answer), `${g} ${s} ${card.front}: ${card.answer}`);
        assert.ok(!lower(card.answer).startsWith(lower(card.front) + ' '), `${card.front}: definition repeats the word first`);
        assert.ok(card.front.length <= LIMITS.front && card.answer.length <= LIMITS.answer && card.explanation.length <= LIMITS.explanation, card.front);
      });
    }
  }
});

test('a deck has the same saved shape as a level deck; ids, names, topics and notes', () => {
  const { deck, cards } = createScienceGradeDeck('10', 'Physics', 'tr', scienceGradeDeckName('10', 'Physics', 'tr'), '2026-11-05T10:00:00.000Z');
  const level = createLevelDeck('B1', 'tr', '10', 'x', '2026-11-05T10:00:00.000Z');
  assert.deepEqual(Object.keys(deck).sort(), Object.keys(level.deck).sort());
  assert.deepEqual(Object.keys(cards[0]).sort(), Object.keys(level.cards[0]).sort());
  assert.deepEqual(
    [deck.id, deck.name, deck.topic, deck.grade, deck.subject, deck.starter],
    ['physics-grade-10', '10. sınıf Fizik – anahtar kavramlar', 'MEB · Anahtar kavramlar', '10', 'Physics', false],
  );
  assert.equal(cards[0].id, 'physics-grade-10-01');
  assert.equal(cards[0].front, 'iş');
  assert.equal(cards[0].explanation, 'MEB Fizik öğretim programı · 10. sınıf · 2. ünite: Enerji (anahtar kavram).');
  const bio = SCIENCE_GRADE_DECKS['12'].Biology.concepts.find((c) => c[0] === 'mitoz')!;
  assert.equal(scienceConceptNote('12', 'Biology', bio, 'tr'), 'MEB Biyoloji öğretim programı · 12. sınıf · 1. tema: Üreme (programın içeriğinden).');
  assert.equal(scienceConceptNote('12', 'Biology', bio, 'en'), 'MEB Biology curriculum · Grade 12 · Theme 1: Üreme (from the program content).');
  assert.equal(scienceGradeDeckName('9', 'Chemistry', 'en'), 'Chemistry 9 – key concepts');
  assert.equal(createScienceGradeDeck('9', 'Chemistry', 'en', 'x').deck.topic, 'MEB · Key concepts');
  const ids = new Set<string>();
  for (const g of GRADES) {
    for (const s of SCIENCE_SUBJECTS) {
      ids.add(scienceGradeDeckId(g, s));
      for (const lang of ['tr', 'en'] as const) assert.ok(scienceGradeDeckName(g, s, lang).length <= LIMITS.deckName);
      assert.ok(PROGRAM_NAMES[s].tr && PROGRAM_NAMES[s].en);
    }
  }
  assert.equal(ids.size, 16);
});

test('never says "MEB onaylı"', () => {
  assert.ok(!/onaylı|approved/i.test(JSON.stringify(SCIENCE_GRADE_DECKS)));
});
