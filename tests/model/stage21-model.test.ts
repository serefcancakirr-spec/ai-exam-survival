// Stage 21A: English A1–C1 for every grade (grammar + vocabulary questions, level word decks).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTION_SEEDS,
  QUIZ_GRADES,
  QUIZ_QUESTION_BANK,
  ALL_QUIZ_TOPICS,
  GENERAL_LEVEL,
  getQuizQuestionPool,
  getQuizTopics,
} from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import {
  ENGLISH_LEVELS,
  ENGLISH_LEVEL_SEEDS,
  SUGGESTED_LEVEL,
  englishFocus,
  englishTopic,
  levelOfTopic,
} from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-english';
import { LEVEL_WORDS, createLevelDeck, levelDeckName } from '../../artifacts/ai-exam-survival/src/pages/flashcards-english-levels';
import { LIMITS, createInitialFlashcardsData, isSavedFlashcardsData } from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import { localizeQuestion, topicName } from '../../artifacts/ai-exam-survival/src/i18n/content';

const TURKISH = /[çğıöşüÇĞİÖŞÜ]|\b(olur|demektir|gelir|kurulur|ile|bir|ve)\b/;

test('250 English level questions: 25 grammar + 25 vocabulary for each of A1, A2, B1, B2, C1', () => {
  assert.equal(ENGLISH_LEVEL_SEEDS.length, 250);
  for (const level of ENGLISH_LEVELS) {
    for (const skill of ['Grammar', 'Vocabulary'] as const) {
      const list = ENGLISH_LEVEL_SEEDS.filter((s) => s.level === level && s.skill === skill);
      assert.equal(list.length, 25, `${level} ${skill}`);
      assert.deepEqual(
        ['easy', 'medium', 'hard'].map((d) => list.filter((s) => s.difficulty === d).length),
        [8, 9, 8],
        `${level} ${skill} difficulty mix`,
      );
    }
  }
});

test('every question is well formed: unique prompt, four different options, a focus and a Turkish explanation', () => {
  const prompts = new Set<string>();
  for (const seed of ENGLISH_LEVEL_SEEDS) {
    const where = `${seed.level} ${seed.prompt}`;
    assert.ok(!prompts.has(seed.prompt), `duplicate prompt ${where}`);
    prompts.add(seed.prompt);
    assert.equal(new Set(seed.options.map((o) => o.trim().toLowerCase())).size, 4, `options repeat: ${where}`);
    assert.ok(seed.options.every((o) => o.trim().length > 0), `empty option: ${where}`);
    assert.ok(seed.focus.trim().length > 2, `focus: ${where}`);
    assert.ok(seed.explanation.length > 30 && TURKISH.test(seed.explanation), `Turkish explanation: ${where}`);
    assert.ok(!/hepsi|hiçbiri|all of the above|none of the above/i.test(seed.options.join(' ')), `no "all/none": ${where}`);
    // a gap question has exactly one gap
    if (seed.prompt.includes('___')) assert.equal(seed.prompt.split('___').length, 2, `one gap: ${where}`);
  }
  // no prompt is the same as an older English sample
  for (const old of QUESTION_SEEDS.English) assert.ok(!prompts.has(old.prompt));
});

test('every grade gets all 250 level questions with stable ids; the correct answer is the first source option and is spread over A–D', () => {
  for (const grade of QUIZ_GRADES) {
    // Stage 21B: reading and listening questions are checked in stage21b-model.
    const levelQs = QUIZ_QUESTION_BANK.filter((q) => q.grade === grade && q.subject === 'English' && /· (Grammar|Vocabulary)$/.test(q.topic));
    assert.equal(levelQs.length, 250, `grade ${grade}`);
    for (const q of levelQs) {
      const seed = ENGLISH_LEVEL_SEEDS.find((s) => s.prompt === q.prompt)!;
      assert.match(q.id, new RegExp(`^${grade}-english-${seed.level.toLowerCase()}-\\d+$`));
      assert.equal(q.options.find((o) => o.id === q.correctOptionId)!.text, seed.options[0], q.id);
      assert.deepEqual([...q.options.map((o) => o.text)].sort(), [...seed.options].sort());
      assert.equal(q.topic, englishTopic(seed.level, seed.skill));
      assert.equal(q.difficulty, seed.difficulty);
    }
    const counts = ['A', 'B', 'C', 'D'].map((id) => levelQs.filter((q) => q.correctOptionId === id).length);
    for (const c of counts) assert.ok(c >= 50 && c <= 75, `answer letters spread: ${counts}`);
  }
  const ids = QUIZ_QUESTION_BANK.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'ids are unique');
});

test('the older 20 English questions keep their ids and stay under "general"', () => {
  for (const grade of QUIZ_GRADES) {
    QUESTION_SEEDS.English.forEach((seed, i) => {
      const q = QUIZ_QUESTION_BANK.find((x) => x.id === `${grade}-english-${i + 1}`)!;
      assert.equal(q.prompt, seed.prompt);
    });
    assert.equal(getQuizQuestionPool(grade, 'English', ALL_QUIZ_TOPICS, 'medium', GENERAL_LEVEL).length, 20);
    assert.deepEqual(getQuizTopics(grade, 'English', GENERAL_LEVEL), ['Grammar & Usage', 'Rhetoric & Argument', 'Reading Skills', 'Writing & Research']);
  }
});

test('a level shows only its own topics and questions; other subjects ignore levels', () => {
  for (const level of ENGLISH_LEVELS) {
    assert.deepEqual(getQuizTopics('10', 'English', level), [`${level} · Grammar`, `${level} · Vocabulary`, `${level} · Reading`, `${level} · Listening`]);
    const pool = getQuizQuestionPool('10', 'English', ALL_QUIZ_TOPICS, 'hard', level);
    assert.equal(pool.length, 71, '50 grammar/vocabulary + 21 reading/listening (Stage 21B)');
    assert.ok(pool.every((q) => levelOfTopic(q.topic) === level));
    assert.equal(pool[0].difficulty, 'hard', 'target difficulty first');
    assert.equal(getQuizQuestionPool('10', 'English', `${level} · Grammar`, 'easy', level).length, 25);
  }
  assert.equal(getQuizTopics('10', 'English').length, 24, 'without a level: 4 general + 20 level topics');
  assert.equal(levelOfTopic('Grammar & Usage'), null);
  assert.equal(levelOfTopic('B1'), null, 'a saved whole-level quiz topic is not a level topic');
});

test('suggested levels: grade 9 A2, grade 10 B1, grade 11 B1, grade 12 B2', () => {
  assert.deepEqual(SUGGESTED_LEVEL, { '9': 'A2', '10': 'B1', '11': 'B1', '12': 'B2' });
});

test('English questions stay in English in Turkish mode; the level and focus are found by the question text', () => {
  const q = QUIZ_QUESTION_BANK.find((x) => x.id === '11-english-c1-3')!;
  assert.equal(localizeQuestion(q, 'tr'), q);
  assert.deepEqual(englishFocus(q), { level: 'C1', focus: 'inversion (no sooner)' });
  assert.equal(englishFocus({ subject: 'English', prompt: QUESTION_SEEDS.English[0].prompt }), null);
  assert.equal(englishFocus({ subject: 'Mathematics', prompt: q.prompt }), null);
  assert.equal(topicName('B2 · Vocabulary', 'tr'), 'B2 · Kelime');
  assert.equal(topicName('B2 · Vocabulary', 'en'), 'B2 · Vocabulary');
});

test('level word decks: 30 different words per level, each with a Turkish meaning and an example', () => {
  for (const level of ENGLISH_LEVELS) {
    const words = LEVEL_WORDS[level];
    assert.equal(words.length, 30, level);
    assert.equal(new Set(words.map(([w]) => w.toLowerCase())).size, 30, `${level}: repeated word`);
    for (const [word, turkish, example] of words) {
      assert.ok(TURKISH.test(turkish) || /^[a-zçğıöşü ,;()]+$/i.test(turkish), `${level} ${word}: Turkish meaning`);
      assert.ok(example.length > 10 && /[.!?]$/.test(example), `${level} ${word}: example sentence`);
    }
  }
});

test('a level deck is an ordinary deck in the saved shape, within the limits, and only added on request', () => {
  const data = createInitialFlashcardsData();
  assert.ok(!data.decks.some((d) => d.id.startsWith('english-level-')), 'nothing is added by itself');
  const { deck, cards } = createLevelDeck('B2', 'tr', '11', levelDeckName('B2', 'tr'));
  assert.deepEqual(Object.keys(deck).sort(), ['createdAt', 'grade', 'id', 'name', 'starter', 'subject', 'topic']);
  assert.equal(deck.name, 'İngilizce B2 kelimeler');
  assert.equal(deck.topic, 'B2 · Kelime');
  assert.equal(deck.starter, false);
  assert.equal(levelDeckName('A1', 'en'), 'English A1 words');
  assert.ok(deck.name.length <= LIMITS.deckName && deck.topic.length <= LIMITS.topic);
  assert.equal(cards.length, 30);
  for (const card of cards) {
    assert.deepEqual(Object.keys(card).sort(), ['answer', 'deckId', 'explanation', 'front', 'id']);
    assert.ok(card.front.length <= LIMITS.front && card.answer.length <= LIMITS.answer);
  }
  const saved = { ...data, decks: [...data.decks, deck], cards: [...data.cards, ...cards] };
  assert.ok(isSavedFlashcardsData(JSON.parse(JSON.stringify(saved))), 'the saved data is still readable');
});
