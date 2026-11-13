// Stage 16: grade 10 questions written for the MEB Türkiye Yüzyılı Maarif Modeli programs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTION_SEEDS,
  QUIZ_GRADES,
  QUIZ_QUESTION_BANK,
  QUIZ_SUBJECTS,
  ALL_QUIZ_TOPICS,
  getQuizQuestionPool,
  getQuizTopics,
} from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { MEB10_SEEDS } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb10';
import { MEB_SEEDS, mebOutcome, usesMeb } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb';
import { localizeQuestion } from '../../artifacts/ai-exam-survival/src/i18n/content';
import OFFICIAL from '../data/meb10-outcomes.json';

const PREFIX: Record<string, string> = { Mathematics: 'MAT', Physics: 'FİZ', Chemistry: 'KİM', Biology: 'BİY', History: 'TAR', Geography: 'COĞ', Literature: 'TDE' };
const official = OFFICIAL.subjects as Record<string, { code: string; tema: string; cikti: string }[]>;
const upper = (text: string) => text.toLocaleUpperCase('tr');
const SUBJECTS = Object.keys(MEB10_SEEDS) as (keyof typeof MEB10_SEEDS)[];

test('Stage 16A: grade 10 Mathematics, Physics, Chemistry and Biology have at least 20 questions each', () => {
  for (const subject of ['Mathematics', 'Physics', 'Chemistry', 'Biology'] as const) {
    assert.ok(MEB10_SEEDS[subject], `${subject} missing`);
    assert.ok(MEB10_SEEDS[subject]!.length >= 20, `${subject}: ${MEB10_SEEDS[subject]!.length}`);
  }
  assert.equal(MEB10_SEEDS.English, undefined, 'English keeps the shared sample questions');
});

test('every grade 10 question measures a real learning outcome of the official program, under its own theme', () => {
  for (const subject of SUBJECTS) {
    const list = official[PREFIX[subject]];
    for (const seed of MEB10_SEEDS[subject]!) {
      const found = list.find((o) => o.code === seed.outcome && (subject !== 'Literature' || o.tema === upper(seed.theme)));
      assert.ok(found, `${subject}: ${seed.outcome} is not in the official grade 10 program`);
      assert.equal(upper(seed.theme), found.tema, `${seed.outcome}: theme "${seed.theme}" vs "${found.tema}"`);
    }
  }
});

test('every grade 10 outcome (except Türk Dili ve Edebiyatı skills) and every theme has at least one question', () => {
  for (const subject of SUBJECTS) {
    const list = official[PREFIX[subject]];
    const used = new Set(MEB10_SEEDS[subject]!.map((s) => s.outcome));
    if (subject !== 'Literature') {
      const missing = list.filter((o) => !used.has(o.code)).map((o) => o.code);
      assert.deepEqual(missing, [], `${subject}: outcomes without a question`);
    }
    for (const theme of new Set(list.map((o) => o.tema))) {
      assert.ok(MEB10_SEEDS[subject]!.some((s) => upper(s.theme) === theme), `${subject}: no question for ${theme}`);
    }
  }
});

test('grade 10 questions follow the MEB writing guide basics', () => {
  const banned = /^(hepsi|hiçbiri|yukarıdakilerin|tümü)/;
  const prompts = new Set<string>();
  for (const subject of SUBJECTS) {
    MEB10_SEEDS[subject]!.forEach((seed, i) => {
      const where = `${subject} #${i + 1} (${seed.outcome})`;
      assert.ok(seed.prompt.trim().length >= 40, `${where}: question too short to give a context`);
      assert.ok(!prompts.has(seed.prompt), `${where}: same question twice`);
      prompts.add(seed.prompt);
      assert.equal(new Set(seed.options.map((o) => o.trim())).size, 4, `${where}: options not all different`);
      seed.options.forEach((o) => assert.ok(o.trim() && !banned.test(o.trim().toLocaleLowerCase('tr')), `${where}: option "${o}"`));
      assert.ok(seed.explanation.trim().length > 30, `${where}: explanation`);
    });
    const longest = MEB10_SEEDS[subject]!.filter((s) => {
      const lengths = s.options.map((o) => o.length);
      return lengths[0] > Math.max(...lengths.slice(1)) * 1.3;
    }).length;
    assert.ok(longest <= MEB10_SEEDS[subject]!.length / 4, `${subject}: the answer is clearly the longest option in ${longest} questions`);
  }
});

test('no grade 10 question repeats a grade 9 question', () => {
  const grade9 = new Set(Object.values(MEB_SEEDS['9']).flat().map((s) => s!.prompt));
  for (const subject of SUBJECTS) for (const seed of MEB10_SEEDS[subject]!) assert.ok(!grade9.has(seed.prompt), seed.prompt.slice(0, 50));
});

test('grade 10 bank: only MEB questions for these subjects, ids "10-<subject>-meb-<n>", answers spread over A–D', () => {
  for (const subject of SUBJECTS) {
    const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === '10' && q.subject === subject);
    const seeds = MEB10_SEEDS[subject]!;
    assert.equal(bank.length, seeds.length);
    bank.forEach((question, i) => {
      assert.equal(question.id, `10-${subject.toLowerCase()}-meb-${i + 1}`);
      assert.equal(question.topic, seeds[i].theme);
      assert.equal(question.options.find((o) => o.id === question.correctOptionId)!.text, seeds[i].options[0], `${question.id}: correct answer`);
      assert.equal(mebOutcome(question), seeds[i].outcome);
    });
    assert.equal(new Set(bank.map((q) => q.correctOptionId)).size, 4, `${subject}: answers are not spread over A–D`);
    assert.ok(usesMeb('10', subject));
    assert.ok(getQuizQuestionPool('10', subject, ALL_QUIZ_TOPICS, 'medium').length >= 20);
  }
  assert.deepEqual(getQuizTopics('10', 'Biology'), ['Enerji', 'Ekoloji']);
  assert.equal(getQuizTopics('10', 'Mathematics').length, 7);
});

test('grades 11 and 12 and grade 10 English are unchanged', () => {
  for (const subject of QUIZ_SUBJECTS) {
    for (const grade of QUIZ_GRADES.filter((g) => g === '11' || g === '12')) {
      const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === grade && q.subject === subject);
      assert.deepEqual(bank.map((q) => q.prompt), QUESTION_SEEDS[subject].map((s) => s.prompt), `${grade} ${subject}`);
      assert.equal(usesMeb(grade, subject), false);
    }
  }
  assert.equal(usesMeb('10', 'English'), false);
});

test('the outcome tag needs the grade: the same text in another grade has no tag; saved results keep working', () => {
  const question = QUIZ_QUESTION_BANK.find((q) => q.id === '10-physics-meb-1')!;
  assert.equal(mebOutcome({ ...question, grade: '11' }), undefined);
  assert.equal(mebOutcome(JSON.parse(JSON.stringify(question))), 'FİZ.10.1.1');
  assert.equal(localizeQuestion(question, 'en'), question);
  assert.equal(localizeQuestion(question, 'tr'), question);
});
