// Stage 11: Turkish quiz questions, topics and starter flashcards (display only).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTION_SEEDS, QUIZ_QUESTION_BANK, QUIZ_SUBJECTS } from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { STARTER_DECKS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-starter-decks';
import { QUESTIONS_TR, TOPICS_TR } from '../../artifacts/ai-exam-survival/src/i18n/quiz-questions-tr';
import { STARTER_CARDS_TR, STARTER_DECK_NAMES_TR } from '../../artifacts/ai-exam-survival/src/i18n/flashcards-starter-tr';
import { mebOutcome } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb';
import { deckName, deckTopic, learningName, localizeCard, localizeQuestion, topicName } from '../../artifacts/ai-exam-survival/src/i18n/content';

const TRANSLATED = QUIZ_SUBJECTS.filter((s) => s !== 'English');
// Numbers (with decimal point or comma) in a text, so a translation cannot change a value by mistake.
const numbers = (text: string) => (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace('.', ',')).sort();

test('every subject except English has a Turkish version of every question, in the same order', () => {
  assert.equal(QUESTIONS_TR.English, undefined, 'English questions must stay English');
  for (const subject of TRANSLATED) {
    const tr = QUESTIONS_TR[subject];
    assert.ok(tr, `${subject}: missing`);
    assert.equal(tr.length, QUESTION_SEEDS[subject].length, `${subject}: ${tr.length} Turkish vs ${QUESTION_SEEDS[subject].length} English`);
  }
  assert.equal(TRANSLATED.reduce((n, s) => n + (QUESTIONS_TR[s]?.length ?? 0), 0), 140);
});

test('each Turkish question is complete: question, four different options and an explanation', () => {
  for (const subject of TRANSLATED) {
    QUESTIONS_TR[subject]!.forEach(([prompt, options, explanation], i) => {
      const where = `${subject} #${i + 1}`;
      assert.ok(prompt.trim().length > 5, `${where}: question`);
      assert.ok(explanation.trim().length > 10, `${where}: explanation`);
      assert.equal(options.length, 4, `${where}: options`);
      assert.equal(new Set(options.map((o) => o.trim())).size, 4, `${where}: options are not all different`);
      options.forEach((o) => assert.ok(o.trim().length > 0, `${where}: empty option`));
    });
  }
});

test('translations keep every number of the English question, options and explanation', () => {
  for (const subject of TRANSLATED) {
    QUESTION_SEEDS[subject].forEach((seed, i) => {
      const [prompt, options, explanation] = QUESTIONS_TR[subject]![i];
      const where = `${subject} #${i + 1} (${seed.prompt.slice(0, 40)})`;
      // ordinal endings like "13th" become "13." in Turkish; the number itself must stay
      assert.deepEqual(numbers(prompt), numbers(seed.prompt), `${where}: numbers in the question`);
      seed.options.forEach((english, k) => assert.deepEqual(numbers(options[k]), numbers(english), `${where}: numbers in option ${k + 1}`));
      assert.deepEqual(numbers(explanation), numbers(seed.explanation), `${where}: numbers in the explanation`);
    });
  }
});

test('in Turkish every question of the bank is shown in Turkish and the correct answer does not change', () => {
  // Stage 15: grade 9 MEB questions are written in Turkish and have no English seed (tested in stage15-model).
  for (const question of QUIZ_QUESTION_BANK.filter((q) => !mebOutcome(q))) {
    const shown = localizeQuestion(question, 'tr');
    if (question.subject === 'English') {
      assert.equal(shown, question, 'English question changed');
      continue;
    }
    const seedIndex = QUESTION_SEEDS[question.subject].findIndex((s) => s.prompt === question.prompt);
    const seed = QUESTION_SEEDS[question.subject][seedIndex];
    const [prompt, trOptions, explanation] = QUESTIONS_TR[question.subject]![seedIndex];
    assert.equal(shown.prompt, prompt);
    assert.equal(shown.explanation, explanation);
    assert.equal(shown.correctOptionId, question.correctOptionId);
    assert.deepEqual(shown.options.map((o) => o.id), question.options.map((o) => o.id), 'option letters moved');
    // the option marked correct is the Turkish version of the seed's correct answer
    const seedCorrect = trOptions['ABCD'.indexOf(seed.correctOptionId)];
    assert.equal(shown.options.find((o) => o.id === shown.correctOptionId)!.text, seedCorrect, `${question.id}: correct answer changed`);
    // every option is the Turkish text of the same English option
    shown.options.forEach((o, k) => assert.equal(o.text, trOptions[seed.options.indexOf(question.options[k].text)]));
  }
});

test('English mode and unknown questions are shown exactly as saved', () => {
  for (const question of QUIZ_QUESTION_BANK.slice(0, 40)) assert.equal(localizeQuestion(question, 'en'), question);
  const old = { ...QUIZ_QUESTION_BANK[30], prompt: 'Question 7' };
  assert.equal(localizeQuestion(old, 'tr'), old);
});

test('a quiz result saved earlier (JSON in the browser) is shown in Turkish too, and the saved copy is not changed', () => {
  const question = QUIZ_QUESTION_BANK.find((q) => q.subject === 'Physics' && !mebOutcome(q))!;
  const saved = JSON.stringify({ review: [{ question, selectedOptionId: 'A' }] });
  const parsed = JSON.parse(saved);
  const shown = localizeQuestion(parsed.review[0].question, 'tr');
  assert.notEqual(shown.prompt, question.prompt);
  assert.equal(JSON.stringify(parsed), saved, 'saved data was changed');
});

test('every quiz topic and starter-deck topic has a Turkish name; English mode keeps the name', () => {
  for (const q of QUIZ_QUESTION_BANK.filter((x) => !mebOutcome(x))) assert.ok(TOPICS_TR[q.topic], `topic ${q.topic}`);
  for (const d of STARTER_DECKS) assert.ok(TOPICS_TR[d.topic], `deck topic ${d.topic}`);
  assert.equal(topicName('Algebra', 'tr'), 'Cebir');
  assert.equal(topicName('Algebra', 'en'), 'Algebra');
  assert.equal(topicName('My own topic', 'tr'), 'My own topic');
});

test('starter decks: names for all five, cards for the three non-English decks, English vocabulary stays English', () => {
  for (const deck of STARTER_DECKS) {
    assert.ok(STARTER_DECK_NAMES_TR[deck.id], `name ${deck.id}`);
    for (const card of deck.cards) {
      if (deck.subject === 'English') assert.equal(STARTER_CARDS_TR[card.id], undefined, `${card.id} should stay English`);
      else {
        const tr = STARTER_CARDS_TR[card.id];
        assert.ok(tr && tr.every((x) => x.trim()), `card ${card.id}`);
        assert.deepEqual(numbers(tr[0]), numbers(card.front), `${card.id}: numbers on the front`);
        assert.deepEqual(numbers(tr[1]), numbers(card.answer), `${card.id}: numbers in the answer`);
      }
    }
  }
  assert.equal(Object.keys(STARTER_CARDS_TR).length, 30);
});

test('starter cards: Turkish only while the student has not changed the text', () => {
  const deck = STARTER_DECKS.find((d) => d.subject === 'Biology')!;
  const card = { ...deck.cards[0], deckId: deck.id };
  const tr = STARTER_CARDS_TR[card.id];
  assert.deepEqual(localizeCard(card, 'tr'), { ...card, front: tr[0], answer: tr[1], explanation: tr[2] });
  assert.equal(localizeCard(card, 'en'), card);
  const edited = { ...card, answer: 'Benim cevabım' };
  const shown = localizeCard(edited, 'tr');
  assert.equal(shown.answer, 'Benim cevabım', 'student text was replaced');
  assert.equal(shown.front, tr[0], 'unchanged front should still be Turkish');
  const own = { id: 'card-123', deckId: 'deck-1', front: card.front, answer: card.answer, explanation: card.explanation };
  assert.equal(localizeCard(own, 'tr'), own, "a student's own card must never be translated");
});

test('starter decks: Turkish name and topic only for an unchanged starter deck', () => {
  const s = STARTER_DECKS.find((d) => d.subject === 'Mathematics')!;
  const deck = { id: s.id, name: s.name, topic: s.topic, starter: true };
  assert.equal(deckName(deck, 'tr'), 'Cebirin Temelleri');
  assert.equal(deckTopic(deck, 'tr'), 'Cebir');
  assert.equal(deckName(deck, 'en'), s.name);
  assert.equal(deckName({ ...deck, name: 'Benim destem' }, 'tr'), 'Benim destem');
  assert.equal(deckTopic({ ...deck, topic: 'Denklemler' }, 'tr'), 'Denklemler');
  assert.equal(deckName({ ...deck, starter: false }, 'tr'), s.name, 'a student deck must never be translated');
  assert.equal(learningName(s.name, 'tr'), 'Cebirin Temelleri');
  assert.equal(learningName('Cells & Genetics', 'tr'), 'Hücreler ve Genetik');
  assert.equal(learningName('Cells & Genetics', 'en'), 'Cells & Genetics');
});
