// Stage 22E: English grade decks: one deck of 25 words per theme of the MEB English curriculum (grades 9–12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ENGLISH_GRADE_THEMES,
  GRADE_DECK_GRADES,
  createEnglishGradeDeck,
  englishGradeDeckId,
  englishGradeDeckName,
  englishGradeNote,
  englishGradeThemeLabel,
} from '../../artifacts/ai-exam-survival/src/pages/flashcards-grade-english';
import { createLevelDeck } from '../../artifacts/ai-exam-survival/src/pages/flashcards-english-levels';
import { LIMITS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import official from '../data/meb-english-target-vocabulary.json';

const words = (s: string) => s.toLowerCase().replace(/[^a-z\s-]/g, ' ').replace(/-/g, ' ').split(/\s+/).filter(Boolean);
const SKIP = new Set(['a', 'an', 'the', 'to', 'be', 'my']);

test('themes match the program: grade 9, 10, 11 have 8 themes, grade 12 has 6, with the official titles', () => {
  assert.deepEqual(GRADE_DECK_GRADES, ['9', '10', '11', '12']);
  assert.deepEqual(GRADE_DECK_GRADES.map((g) => ENGLISH_GRADE_THEMES[g].length), [8, 8, 8, 6]);
  for (const g of GRADE_DECK_GRADES) {
    ENGLISH_GRADE_THEMES[g].forEach((t, i) => {
      assert.equal(t.theme, i + 1);
      const o = official.themes.find((x) => x.grade === g && x.theme === t.theme)!;
      assert.equal(t.en.toUpperCase(), o.title, `${g}/${t.theme}`);
    });
  }
});

test('30 decks of 25 different words; 750 cards', () => {
  let n = 0;
  for (const g of GRADE_DECK_GRADES) {
    for (const t of ENGLISH_GRADE_THEMES[g]) {
      assert.equal(t.words.length, 25, `${g}/${t.theme}`);
      assert.equal(new Set(t.words.map((w) => w[0])).size, 25, `${g}/${t.theme} duplicates`);
      n += t.words.length;
    }
  }
  assert.equal(n, 750);
});

test('every word is in the official "Target Vocabulary" of its theme', () => {
  for (const g of GRADE_DECK_GRADES) {
    for (const t of ENGLISH_GRADE_THEMES[g]) {
      const list = ` ${words(official.themes.find((x) => x.grade === g && x.theme === t.theme)!.vocabulary).join(' ')} `;
      for (const [word] of t.words) {
        for (const w of words(word).filter((x) => !SKIP.has(x))) {
          assert.ok(list.includes(` ${w.slice(0, Math.max(4, w.length - 2))}`), `${g}/${t.theme}: “${word}” (${w}) is not in the program list`);
        }
      }
    }
  }
});

test('every card: example sentence uses the word, Turkish meaning, texts within the card limits', () => {
  const IRREGULAR: Record<string, string[]> = {
    go: ['went'], take: ['took'], overcome: ['overcame'], sing: ['sang'], forgive: ['forgave'], come: ['came'],
  };
  for (const g of GRADE_DECK_GRADES) {
    for (const t of ENGLISH_GRADE_THEMES[g]) {
      const { cards } = createEnglishGradeDeck(g, t.theme, 'tr', englishGradeDeckName(g, t.theme, 'tr'));
      t.words.forEach(([word, turkish, example], i) => {
        const text = ` ${words(example).join(' ')} `;
        for (const w of words(word).filter((x) => !SKIP.has(x))) {
          const forms = [w.slice(0, Math.max(3, w.length - 2)), ...(IRREGULAR[w] ?? [])];
          assert.ok(forms.some((f) => text.includes(` ${f}`)), `${g}/${t.theme} ${word}: “${example}”`);
        }
        assert.ok(turkish.trim().length >= 2, word);
        assert.ok(cards[i].front.length <= LIMITS.front && cards[i].answer.length <= LIMITS.answer && cards[i].explanation.length <= LIMITS.explanation, word);
      });
    }
  }
});

test('a deck has the same saved shape as a level deck; ids, names, topics and notes', () => {
  const { deck, cards } = createEnglishGradeDeck('9', 3, 'tr', englishGradeDeckName('9', 3, 'tr'), '2026-11-05T10:00:00.000Z');
  const level = createLevelDeck('B1', 'tr', '10', 'x', '2026-11-05T10:00:00.000Z');
  assert.deepEqual(Object.keys(deck).sort(), Object.keys(level.deck).sort());
  assert.deepEqual(Object.keys(cards[0]).sort(), Object.keys(level.cards[0]).sort());
  assert.deepEqual(
    [deck.id, deck.name, deck.topic, deck.grade, deck.subject, deck.starter],
    ['english-grade-9-t3', '9. sınıf İngilizce – Kişisel Hayat: Dış Görünüş ve Kişilik', 'MEB · Kişisel Hayat: Dış Görünüş ve Kişilik', '9', 'English', false],
  );
  assert.equal(cards[0].id, 'english-grade-9-t3-01');
  assert.equal(cards[0].front, 'plump — “The baby has plump, rosy cheeks.”');
  assert.equal(cards[0].answer, 'tombul, dolgun');
  assert.equal(englishGradeNote('10', 7, 'tr'), 'MEB İngilizce öğretim programı · 10. sınıf · Tema 7: Life in Nature & Global Problems (hedef kelime).');
  assert.equal(englishGradeNote('12', 6, 'en'), 'MEB English Language Curriculum · Grade 12 · Theme 6: Life in the Universe & Future (target vocabulary).');
  assert.equal(englishGradeThemeLabel('11', 4, 'tr'), 'Tema 4 · Aile Hayatı ve Ev');
  assert.equal(englishGradeDeckName('10', 1, 'en'), 'English 10 – School Life & Education');
  const names = new Set<string>();
  for (const g of GRADE_DECK_GRADES) {
    for (const t of ENGLISH_GRADE_THEMES[g]) {
      for (const lang of ['tr', 'en'] as const) {
        const name = englishGradeDeckName(g, t.theme, lang);
        assert.ok(name.length <= LIMITS.deckName, name);
        assert.ok(createEnglishGradeDeck(g, t.theme, lang, name).deck.topic.length <= LIMITS.topic, name);
        names.add(name);
      }
      assert.equal(englishGradeDeckId(g, t.theme), `english-grade-${g}-t${t.theme}`);
    }
  }
  assert.equal(names.size, 60, 'every deck name is different');
});

test('never says "MEB onaylı"', () => {
  const all = JSON.stringify(ENGLISH_GRADE_THEMES) + GRADE_DECK_GRADES.map((g) => englishGradeNote(g, 1, 'tr') + englishGradeNote(g, 1, 'en')).join('');
  assert.ok(!/onaylı|approved/i.test(all));
});
