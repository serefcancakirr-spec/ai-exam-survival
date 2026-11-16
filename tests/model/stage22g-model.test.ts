// Stage 22G: grade decks for History, Geography, Literature, Philosophy and Religion (25 MEB key concepts per subject and grade).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOCIAL_GRADE_DECKS,
  SOCIAL_SUBJECTS,
  createSocialGradeDeck,
  socialConceptNote,
  socialGradeDeckId,
  socialGradeDeckName,
  socialSubjectsOf,
  type SocialGrade,
} from '../../artifacts/ai-exam-survival/src/pages/flashcards-grade-social';
import { createLevelDeck } from '../../artifacts/ai-exam-survival/src/pages/flashcards-english-levels';
import { LIMITS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import official from '../data/meb-social-key-concepts.json';

const GRADES: SocialGrade[] = ['9', '10', '11', '12'];
const lower = (s: string) => s.toLocaleLowerCase('tr-TR');
const programOf = (subject: string, grade: string) =>
  ({ History: grade === '12' ? 'tc-inkilap' : 'tarih', Geography: 'cografya', Literature: 'turk-dili-ve-edebiyati', Philosophy: 'felsefe', Religion: 'din-kulturu-ve-ahlak-bilgisi' })[subject]!;
const unitsOf = (subject: string, grade: string) => official.units.filter((u) => u.program === programOf(subject, grade) && u.grade === grade);

test('18 decks: Felsefe only in grades 10 and 11; 25 different concepts each; 450 cards', () => {
  assert.deepEqual(GRADES.map((g) => socialSubjectsOf(g)), [
    ['History', 'Geography', 'Literature', 'Religion'],
    ['History', 'Geography', 'Literature', 'Philosophy', 'Religion'],
    ['History', 'Geography', 'Literature', 'Philosophy', 'Religion'],
    ['History', 'Geography', 'Literature', 'Religion'],
  ]);
  let n = 0;
  for (const g of GRADES) {
    for (const s of socialSubjectsOf(g)) {
      const deck = SOCIAL_GRADE_DECKS[g][s]!;
      assert.equal(deck.concepts.length, 25, `${g} ${s}`);
      assert.equal(new Set(deck.concepts.map((c) => lower(c[0]))).size, 25, `${g} ${s} duplicates`);
      n += 25;
    }
  }
  assert.equal(n, 450);
  assert.equal(SOCIAL_GRADE_DECKS['12'].History!.program.tr, 'T.C. İnkılap Tarihi ve Atatürkçülük');
});

test('unit names and numbers match the program', () => {
  for (const g of GRADES) {
    for (const s of socialSubjectsOf(g)) {
      const deck = SOCIAL_GRADE_DECKS[g][s]!;
      for (const [num, title] of Object.entries(deck.units)) {
        const o = unitsOf(s, g).find((u) => u.unit === Number(num));
        assert.ok(o, `${g} ${s} unit ${num}`);
        assert.equal(title.toLocaleUpperCase('tr-TR'), o.title, `${g} ${s} unit ${num}`);
      }
      assert.equal(deck.unitWord, s === 'Literature' ? 'tema' : 'ünite');
    }
  }
});

test('every concept is a key concept of its unit (no content-frame fill needed)', () => {
  for (const g of GRADES) {
    for (const s of socialSubjectsOf(g)) {
      const units = unitsOf(s, g);
      assert.ok(new Set(units.flatMap((u) => u.concepts)).size >= 25, `${g} ${s} has at least 25 key concepts`);
      for (const [concept, , unit, fromContent] of SOCIAL_GRADE_DECKS[g][s]!.concepts) {
        assert.equal(fromContent, undefined, concept);
        assert.ok(units.some((u) => u.unit === unit && u.concepts.includes(concept)), `${g} ${s}: “${concept}” is not a key concept of unit ${unit}`);
      }
    }
  }
});

test('every card: a real definition within the card limits', () => {
  for (const g of GRADES) {
    for (const s of socialSubjectsOf(g)) {
      const { cards } = createSocialGradeDeck(g, s, 'tr', socialGradeDeckName(g, s, 'tr'));
      for (const card of cards) {
        assert.ok(card.answer.length >= 12 && /[.)]$/.test(card.answer), `${g} ${s} ${card.front}: ${card.answer}`);
        assert.ok(card.front.length <= LIMITS.front && card.answer.length <= LIMITS.answer && card.explanation.length <= LIMITS.explanation, card.front);
      }
    }
  }
});

test('a deck has the same saved shape as a level deck; ids, names, topics and notes', () => {
  const { deck, cards } = createSocialGradeDeck('12', 'History', 'tr', socialGradeDeckName('12', 'History', 'tr'), '2026-11-05T10:00:00.000Z');
  const level = createLevelDeck('B1', 'tr', '10', 'x', '2026-11-05T10:00:00.000Z');
  assert.deepEqual(Object.keys(deck).sort(), Object.keys(level.deck).sort());
  assert.deepEqual(Object.keys(cards[0]).sort(), Object.keys(level.cards[0]).sort());
  assert.deepEqual(
    [deck.id, deck.name, deck.topic, deck.grade, deck.subject, deck.starter],
    ['history-grade-12', '12. sınıf Tarih – anahtar kavramlar', 'MEB · Anahtar kavramlar', '12', 'History', false],
  );
  assert.equal(cards[0].front, 'antant');
  assert.equal(cards[0].explanation, 'MEB T.C. İnkılap Tarihi ve Atatürkçülük öğretim programı · 12. sınıf · 1. ünite: Modern Türk Devletinin Doğuşu (anahtar kavram).');
  const imge = SOCIAL_GRADE_DECKS['9'].Literature!.concepts[0];
  assert.equal(socialConceptNote('9', 'Literature', imge, 'en'), 'MEB Turkish Language and Literature curriculum · Grade 9 · Theme 1: Sözün İnceliği (key concept).');
  assert.equal(socialGradeDeckName('10', 'Philosophy', 'en'), 'Philosophy 10 – key concepts');
  assert.throws(() => createSocialGradeDeck('9', 'Philosophy', 'tr', 'x'));
  const ids = new Set<string>();
  for (const g of GRADES) {
    for (const s of socialSubjectsOf(g)) {
      ids.add(socialGradeDeckId(g, s));
      for (const lang of ['tr', 'en'] as const) assert.ok(socialGradeDeckName(g, s, lang).length <= LIMITS.deckName);
    }
  }
  assert.equal(ids.size, 18);
  assert.deepEqual(SOCIAL_SUBJECTS, ['History', 'Geography', 'Literature', 'Philosophy', 'Religion']);
});

test('never says "MEB onaylı"', () => {
  assert.ok(!/onaylı|approved/i.test(JSON.stringify(SOCIAL_GRADE_DECKS)));
});
