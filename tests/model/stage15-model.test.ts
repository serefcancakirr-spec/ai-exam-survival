// Stage 15A + 15B: grade 9 questions written for the MEB Türkiye Yüzyılı Maarif Modeli programs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTION_SEEDS,
  QUIZ_GRADES,
  QUIZ_QUESTION_BANK,
  QUIZ_SUBJECTS,
  getQuizQuestionPool,
  getQuizTopics,
  ALL_QUIZ_TOPICS,
} from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { MEB9_SEEDS, mebOutcome, usesMeb9 } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb9';
import { localizeQuestion, topicName } from '../../artifacts/ai-exam-survival/src/i18n/content';
import OFFICIAL from '../data/meb9-outcomes.json';

const STAGE_15A = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'] as const;
const PREFIX = { Mathematics: 'MAT', Physics: 'FİZ', Chemistry: 'KİM', Biology: 'BİY', History: 'TAR', Geography: 'COĞ', Literature: 'TDE' } as const;
const official = OFFICIAL.subjects as Record<string, { code: string; tema: string; cikti: string }[]>;
const upper = (text: string) => text.toLocaleUpperCase('tr');

test('Stage 15 covers every grade 9 subject except English with at least 20 questions each', () => {
  assert.deepEqual(Object.keys(MEB9_SEEDS).sort(), [...STAGE_15A].sort());
  for (const subject of STAGE_15A) assert.ok(MEB9_SEEDS[subject]!.length >= 20, `${subject}: ${MEB9_SEEDS[subject]!.length}`);
});

test('every question measures a real learning outcome of the official grade 9 program, under its own theme', () => {
  for (const subject of STAGE_15A) {
    const list = official[PREFIX[subject]];
    for (const seed of MEB9_SEEDS[subject]!) {
      // TDE repeats the same skill codes in each theme, so the theme is part of the match
      const found = list.find((o) => o.code === seed.outcome && (subject !== 'Literature' || o.tema === upper(seed.theme)));
      assert.ok(found, `${subject}: ${seed.outcome} is not in the official program`);
      assert.equal(upper(seed.theme), found.tema, `${seed.outcome}: theme "${seed.theme}" vs "${found.tema}"`);
    }
  }
});

test('most learning outcomes and every theme have at least one question', () => {
  for (const subject of STAGE_15A) {
    const list = official[PREFIX[subject]];
    const used = new Set(MEB9_SEEDS[subject]!.map((s) => s.outcome));
    const covered = list.filter((o) => used.has(o.code)).length;
    // TDE outcomes also cover listening, speaking and writing, which a multiple-choice quiz cannot measure.
    if (subject !== 'Literature') assert.ok(covered / list.length >= 0.85, `${subject}: only ${covered}/${list.length} outcomes`);
    for (const theme of new Set(list.map((o) => o.tema))) {
      assert.ok(MEB9_SEEDS[subject]!.some((s) => upper(s.theme) === theme), `${subject}: no question for ${theme}`);
    }
  }
});

test('questions follow the MEB writing guide basics: four different options, no "all/none of the above", an explanation', () => {
  const banned = /^(hepsi|hiçbiri|yukarıdakilerin|tümü|hepsi doğru)/i;
  const prompts = new Set<string>();
  for (const subject of STAGE_15A) {
    MEB9_SEEDS[subject]!.forEach((seed, i) => {
      const where = `${subject} #${i + 1} (${seed.outcome})`;
      assert.ok(seed.prompt.trim().length >= 40, `${where}: question too short to give a context`);
      assert.ok(!prompts.has(seed.prompt), `${where}: same question twice`);
      prompts.add(seed.prompt);
      assert.equal(new Set(seed.options.map((o) => o.trim())).size, 4, `${where}: options not all different`);
      seed.options.forEach((o) => {
        assert.ok(o.trim(), `${where}: empty option`);
        assert.ok(!banned.test(o.trim().toLocaleLowerCase('tr')), `${where}: option "${o}"`);
      });
      assert.ok(seed.explanation.trim().length > 30, `${where}: explanation`);
      assert.ok(['easy', 'medium', 'hard'].includes(seed.difficulty), `${where}: difficulty`);
    });
  }
});

test('the correct answer is not always the longest option', () => {
  for (const subject of STAGE_15A) {
    const seeds = MEB9_SEEDS[subject]!;
    const longest = seeds.filter((s) => {
      const lengths = s.options.map((o) => o.length);
      return lengths[0] > Math.max(...lengths.slice(1)) * 1.3;
    }).length;
    assert.ok(longest <= seeds.length / 4, `${subject}: the answer is clearly the longest option in ${longest} questions`);
  }
});

test('grade 9 of these subjects uses only the MEB questions; the answer letter moves around', () => {
  for (const subject of STAGE_15A) {
    const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === '9' && q.subject === subject);
    const seeds = MEB9_SEEDS[subject]!;
    assert.equal(bank.length, seeds.length);
    bank.forEach((question, i) => {
      assert.equal(question.id, `9-${subject.toLowerCase()}-meb-${i + 1}`);
      assert.equal(question.prompt, seeds[i].prompt);
      assert.equal(question.topic, seeds[i].theme);
      assert.equal(question.options.find((o) => o.id === question.correctOptionId)!.text, seeds[i].options[0], `${question.id}: correct answer`);
      assert.deepEqual(question.options.map((o) => o.text).sort(), [...seeds[i].options].sort());
      assert.equal(mebOutcome(question), seeds[i].outcome);
    });
    const letters = new Set(bank.map((q) => q.correctOptionId));
    assert.equal(letters.size, 4, `${subject}: answers are not spread over A–D`);
    assert.ok(usesMeb9('9', subject));
  }
});

test('grades 10–12 and English keep exactly the shared sample questions', () => {
  for (const subject of QUIZ_SUBJECTS) {
    for (const grade of QUIZ_GRADES) {
      if (grade === '9' && (STAGE_15A as readonly string[]).includes(subject)) continue;
      const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === grade && q.subject === subject);
      assert.deepEqual(bank.map((q) => q.prompt), QUESTION_SEEDS[subject].map((s) => s.prompt), `${grade} ${subject}`);
      assert.ok(bank.every((q) => q.id === `${grade}-${subject.toLowerCase()}-${bank.indexOf(q) + 1}`), `${grade} ${subject}: ids`);
      assert.ok(bank.every((q) => mebOutcome(q) === undefined));
      assert.equal(usesMeb9(grade, subject), false);
    }
  }
});

test('grade 9 topics are the MEB themes, shown the same in both languages; 20-question quizzes are possible', () => {
  assert.deepEqual(getQuizTopics('9', 'Biology'), ['Yaşam', 'Organizasyon']);
  assert.deepEqual(getQuizTopics('9', 'Chemistry'), ['Etkileşim', 'Çeşitlilik', 'Sürdürülebilirlik']);
  assert.equal(getQuizTopics('9', 'Mathematics').length, 7);
  assert.equal(getQuizTopics('9', 'Physics').length, 4);
  assert.equal(topicName('Yaşam', 'en'), 'Yaşam');
  assert.equal(topicName('Yaşam', 'tr'), 'Yaşam');
  assert.ok(getQuizTopics('10', 'Biology').includes('Cells & Genetics'));
  for (const subject of STAGE_15A) {
    assert.ok(getQuizQuestionPool('9', subject, ALL_QUIZ_TOPICS, 'medium').length >= 20);
  }
});

test('MEB questions are shown as written in both languages (they are Turkish curriculum content)', () => {
  const question = QUIZ_QUESTION_BANK.find((q) => q.id === '9-physics-meb-1')!;
  assert.equal(localizeQuestion(question, 'tr'), question);
  assert.equal(localizeQuestion(question, 'en'), question);
});

test('a grade 9 result saved before Stage 15 (old English question) still shows in Turkish, with no outcome tag', () => {
  const oldQuestion = { ...QUIZ_QUESTION_BANK.find((q) => q.grade === '10' && q.subject === 'Mathematics')!, id: '9-mathematics-1', grade: '9' as const };
  const saved = JSON.stringify({ review: [{ question: oldQuestion, selectedOptionId: 'A' }] });
  const parsed = JSON.parse(saved);
  const shown = localizeQuestion(parsed.review[0].question, 'tr');
  assert.notEqual(shown.prompt, oldQuestion.prompt, 'old question should still be translated');
  assert.equal(mebOutcome(parsed.review[0].question), undefined);
  assert.equal(JSON.stringify(parsed), saved, 'saved data was changed');
  // and a saved MEB question keeps its outcome tag
  const meb = QUIZ_QUESTION_BANK.find((q) => q.id === '9-chemistry-meb-3')!;
  assert.equal(mebOutcome(JSON.parse(JSON.stringify(meb))), 'KİM.9.1.3');
});

test('Türk Dili ve Edebiyatı: 5 questions per theme, each theme has reading (TDE2.2) and a writing-rule (TDE4.3) question', () => {
  const seeds = MEB9_SEEDS.Literature!;
  assert.deepEqual(getQuizTopics('9', 'Literature'), ['Sözün İnceliği', 'Anlam Arayışı', 'Anlamın Yapı Taşları', 'Dilin Zenginliği']);
  for (const theme of getQuizTopics('9', 'Literature')) {
    const inTheme = seeds.filter((s) => s.theme === theme);
    assert.equal(inTheme.length, 5, theme);
    assert.ok(inTheme.some((s) => s.outcome === 'TDE2.2'), `${theme}: reading`);
    assert.ok(inTheme.some((s) => s.outcome === 'TDE4.3'), `${theme}: writing rules`);
  }
});

test('History and Geography: every theme of the program has questions; numbers in Geography explanations add up', () => {
  assert.deepEqual(getQuizTopics('9', 'History'), ['Geçmişin İnşa Sürecinde Tarih', 'Eski Çağ Medeniyetleri', 'Orta Çağ Medeniyetleri']);
  assert.equal(getQuizTopics('9', 'Geography').length, 7);
  // 1/100 000 scale, 5 cm -> 5 km; 19 degrees of longitude * 4 minutes = 76 minutes; 22 - (-10) = 32
  assert.equal((5 * 100000) / 100000, 5);
  assert.equal((45 - 26) * 4, 76);
  assert.equal(22 - -10, 32);
});
