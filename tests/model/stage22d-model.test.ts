// Stage 22D: YDT word decks (10 × 30 words chosen from a word count of the ÖSYM YDT English booklets 2018–2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YDT_BOOKLETS, YDT_DECK_KEYS, YDT_DECK_NAMES, YDT_WORDS, createYdtDeck, ydtDeckId, ydtDeckName, ydtWordNote } from '../../artifacts/ai-exam-survival/src/pages/flashcards-ydt-words';
import { createLevelDeck } from '../../artifacts/ai-exam-survival/src/pages/flashcards-english-levels';
import { LIMITS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';

const ALL = YDT_DECK_KEYS.flatMap((k) => YDT_WORDS[k]);

test('ten decks of 30 different words; no word in two decks', () => {
  assert.equal(YDT_DECK_KEYS.length, 10);
  for (const k of YDT_DECK_KEYS) assert.equal(YDT_WORDS[k].length, 30, k);
  assert.equal(new Set(ALL.map((w) => w[0])).size, 300);
});

test('counts are real booklet counts: 1–9 booklets, option years between 2018 and 2026, sorted, and only for words in the booklets', () => {
  assert.equal(YDT_BOOKLETS, 9);
  for (const [word, , , years, , tested] of ALL) {
    assert.ok(Number.isInteger(years) && years >= 1 && years <= 9, word);
    assert.ok(tested.every((y) => y >= 2018 && y <= 2026), word);
    assert.deepEqual(tested, [...new Set(tested)].sort(), word);
  }
  // frequent-verb decks: words found in at least 5 of the 9 booklets
  for (const [word, , , years] of [...YDT_WORDS.verbs1, ...YDT_WORDS.verbs2]) assert.ok(years >= 5, word);
  // checked by hand against the word count
  const find = (w: string) => ALL.find((x) => x[0] === w)!;
  assert.equal(find('affect')[3], 9);
  assert.deepEqual(find('adversely').slice(3), [3, 'negatively', [2021, 2024, 2025]]);
  assert.deepEqual(find('unless')[5], [2018, 2019, 2020, 2024, 2025, 2026]);
});

test('every card: example sentence uses the word, Turkish meaning, texts within the card limits', () => {
  for (const k of YDT_DECK_KEYS) {
    const { cards } = createYdtDeck(k, 'tr', '12', ydtDeckName(k, 'tr'));
    YDT_WORDS[k].forEach(([word, turkish, example], i) => {
      const text = example.toLowerCase();
      const IRREGULAR: Record<string, string[]> = { come: ['came'], take: ['took'], go: ['went'], make: ['made'], find: ['found'], lead: ['led'], break: ['broke'], bring: ['brought'], give: ['gave'], spread: ['spread'] };
      for (const part of word.split(' ... ')) {
        const [first, ...rest] = part.replace(/^be /, '').split(' ');
        const forms = [first.slice(0, 4), ...(IRREGULAR[first] ?? [])];
        assert.ok(forms.some((f) => text.includes(f)) && rest.every((r) => text.includes(r)), `${word}: “${example}”`);
      }
      assert.ok(/[çğıöşüâ]/i.test(turkish) || turkish.length > 2, word);
      assert.ok(cards[i].front.length <= LIMITS.front && cards[i].answer.length <= LIMITS.answer && cards[i].explanation.length <= LIMITS.explanation, word);
    });
  }
});

test('the back note tells the real count in correct Turkish and English', () => {
  const w = YDT_WORDS.verbs1.find((x) => x[0] === 'maintain')!;
  assert.equal(ydtWordNote(w, 'tr'), 'Eş anlamlı: keep. 2018–2026 arasındaki 9 YDT kitapçığının 8’inde geçti. Kelime / dil bilgisi sorularında seçenek oldu: 2018, 2024.');
  assert.equal(ydtWordNote(w, 'en'), 'Synonym: keep. Appears in 8 of the 9 YDT booklets (2018–2026). An option in vocabulary / grammar questions: 2018, 2024.');
  const endings = Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [n, ydtWordNote(['x', 'y', 'z', n, '', []], 'tr')]));
  assert.ok(endings[9].includes('9’unda') && endings[6].includes('6’sında') && endings[5].includes('5’inde') && endings[3].includes('3’ünde') && endings[2].includes('2’sinde'));
  assert.ok(!ydtWordNote(['x', 'y', 'z', 4, '', []], 'tr').includes('Eş anlamlı'), 'no synonym → no synonym text');
});

test('a deck has the same saved shape as a level deck; ids, names and topics', () => {
  const { deck, cards } = createYdtDeck('connectors', 'tr', '12', ydtDeckName('connectors', 'tr'), '2026-11-05T10:00:00.000Z');
  const level = createLevelDeck('B1', 'tr', '10', 'x', '2026-11-05T10:00:00.000Z');
  assert.deepEqual(Object.keys(deck).sort(), Object.keys(level.deck).sort());
  assert.deepEqual(Object.keys(cards[0]).sort(), Object.keys(level.cards[0]).sort());
  assert.deepEqual([deck.id, deck.name, deck.topic, deck.grade, deck.subject, deck.starter], ['ydt-words-connectors', 'YDT – Bağlaçlar', 'YDT · Bağlaçlar', '12', 'English', false]);
  assert.equal(cards[0].id, 'ydt-words-connectors-01');
  assert.equal(cards[0].front, 'although — “Although it was raining, we went for a walk.”');
  assert.equal(ydtDeckName('phrasal', 'en'), 'YDT – Phrasal verbs');
  for (const k of YDT_DECK_KEYS) {
    assert.ok(ydtDeckId(k).startsWith('ydt-words-'));
    assert.ok(ydtDeckName(k, 'tr').length <= LIMITS.deckName && `YDT · ${YDT_DECK_NAMES[k].en}`.length <= LIMITS.topic);
  }
});
