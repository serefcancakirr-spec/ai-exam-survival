// Stage 19: grade 11 questions written for the MEB Türkiye Yüzyılı Maarif Modeli programs
// (19A: mathematics and sciences, 19B: history, geography, Türk Dili ve Edebiyatı).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUESTION_SEEDS,
  QUIZ_QUESTION_BANK,
  QUIZ_SUBJECTS,
  ALL_QUIZ_TOPICS,
  getQuizQuestionPool,
  getQuizTopics,
} from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { levelOfTopic } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-english';
import { MEB11_SEEDS } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb11';
import { MEB_SEEDS, mebOutcome, usesMeb } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb';
import { localizeQuestion } from '../../artifacts/ai-exam-survival/src/i18n/content';
import OFFICIAL from '../data/meb11-outcomes.json';

const PREFIX: Record<string, string> = { Mathematics: 'MAT', Physics: 'FİZ', Chemistry: 'KİM', Biology: 'BİY', History: 'TAR', Geography: 'COĞ', Literature: 'TDE' };
const official = OFFICIAL.subjects as Record<string, { code: string; tema: string; cikti: string }[]>;
const upper = (text: string) => text.toLocaleUpperCase('tr');
const SUBJECTS = Object.keys(MEB11_SEEDS) as (keyof typeof MEB11_SEEDS)[];
const STAGE_19A = ['Mathematics', 'Physics', 'Chemistry', 'Biology'] as const;

test('Stage 19A: grade 11 Mathematics, Physics, Chemistry and Biology have at least 20 questions each', () => {
  for (const subject of STAGE_19A) {
    assert.ok(MEB11_SEEDS[subject], `${subject} missing`);
    assert.ok(MEB11_SEEDS[subject]!.length >= 20, `${subject}: ${MEB11_SEEDS[subject]!.length}`);
  }
  assert.equal(MEB11_SEEDS.English, undefined, 'English keeps the shared sample questions');
});

test('the official grade 11 list has the outcomes of the frame plans (MAT 15, FİZ 33, KİM 25, BİY 22)', () => {
  assert.deepEqual(
    Object.fromEntries(['MAT', 'FİZ', 'KİM', 'BİY'].map((p) => [p, official[p].length])),
    { MAT: 15, FİZ: 33, KİM: 25, BİY: 22 },
  );
  for (const list of Object.values(official)) for (const o of list) assert.ok(o.cikti.length > 20 && /^([A-ZÇĞİÖŞÜ]+\.11\.\d+\.\d+|TDE\d\.\d)$/.test(o.code), o.code);
});

test('every grade 11 question measures a real learning outcome of the official program, under its own theme', () => {
  for (const subject of SUBJECTS) {
    const list = official[PREFIX[subject]];
    for (const seed of MEB11_SEEDS[subject]!) {
      const found = list.find((o) => o.code === seed.outcome && (subject !== 'Literature' || o.tema === upper(seed.theme)));
      assert.ok(found, `${subject}: ${seed.outcome} is not in the official grade 11 program`);
      assert.equal(upper(seed.theme), found.tema, `${seed.outcome}: theme "${seed.theme}" vs "${found.tema}"`);
    }
  }
});

test('every grade 11 outcome (except Türk Dili ve Edebiyatı skills) and every theme has at least one question', () => {
  for (const subject of SUBJECTS) {
    const list = official[PREFIX[subject]];
    const used = new Set(MEB11_SEEDS[subject]!.map((s) => s.outcome));
    if (subject !== 'Literature') assert.deepEqual(list.filter((o) => !used.has(o.code)).map((o) => o.code), [], `${subject}: outcomes without a question`);
    for (const theme of new Set(list.map((o) => o.tema))) {
      assert.ok(MEB11_SEEDS[subject]!.some((s) => upper(s.theme) === theme), `${subject}: no question for ${theme}`);
    }
  }
});

test('grade 11 questions follow the MEB writing guide basics', () => {
  const banned = /^(hepsi|hiçbiri|yukarıdakilerin|tümü)/;
  const prompts = new Set<string>();
  for (const subject of SUBJECTS) {
    MEB11_SEEDS[subject]!.forEach((seed, i) => {
      const where = `${subject} #${i + 1} (${seed.outcome})`;
      assert.ok(seed.prompt.trim().length >= 40, `${where}: question too short to give a context`);
      assert.ok(!prompts.has(seed.prompt), `${where}: same question twice`);
      prompts.add(seed.prompt);
      assert.equal(new Set(seed.options.map((o) => o.trim())).size, 4, `${where}: options not all different`);
      seed.options.forEach((o) => assert.ok(o.trim() && !banned.test(o.trim().toLocaleLowerCase('tr')), `${where}: option "${o}"`));
      assert.ok(seed.explanation.trim().length > 30, `${where}: explanation`);
    });
    const longest = MEB11_SEEDS[subject]!.filter((s) => {
      const lengths = s.options.map((o) => o.length);
      return lengths[0] > Math.max(...lengths.slice(1)) * 1.3;
    }).length;
    assert.ok(longest <= MEB11_SEEDS[subject]!.length / 4, `${subject}: the answer is clearly the longest option in ${longest} questions`);
  }
});

test('no grade 11 question repeats a grade 9 or grade 10 question', () => {
  const earlier = new Set([...Object.values(MEB_SEEDS['9']), ...Object.values(MEB_SEEDS['10'])].flat().map((s) => s!.prompt));
  for (const subject of SUBJECTS) for (const seed of MEB11_SEEDS[subject]!) assert.ok(!earlier.has(seed.prompt), seed.prompt.slice(0, 50));
});

test('grade 11 bank: only MEB questions for these subjects, ids "11-<subject>-meb-<n>", answers spread over A–D', () => {
  for (const subject of SUBJECTS) {
    const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === '11' && q.subject === subject);
    const seeds = MEB11_SEEDS[subject]!;
    assert.equal(bank.length, seeds.length);
    bank.forEach((question, i) => {
      assert.equal(question.id, `11-${subject.toLowerCase()}-meb-${i + 1}`);
      assert.equal(question.topic, seeds[i].theme);
      assert.equal(question.options.find((o) => o.id === question.correctOptionId)!.text, seeds[i].options[0], `${question.id}: correct answer`);
      assert.equal(mebOutcome(question), seeds[i].outcome);
    });
    assert.equal(new Set(bank.map((q) => q.correctOptionId)).size, 4, `${subject}: answers are not spread over A–D`);
    assert.ok(usesMeb('11', subject));
    assert.ok(getQuizQuestionPool('11', subject, ALL_QUIZ_TOPICS, 'medium').length >= 20);
  }
  assert.deepEqual(getQuizTopics('11', 'Mathematics'), ['İstatistiksel Araştırma Süreci', 'Geometrik Şekiller', 'Nicelikler ve Değişimler']);
  assert.deepEqual(getQuizTopics('11', 'Physics'), ['Kuvvet ve Hareket', 'Elektrik ve Manyetizma', 'Optik']);
  assert.deepEqual(getQuizTopics('11', 'Chemistry'), ['Etkileşim', 'Çeşitlilik', 'Sürdürülebilirlik']);
  assert.deepEqual(getQuizTopics('11', 'Biology'), ['Tepki', 'Homeostazi']);
});

test('grade 11 English and all of grade 12 are unchanged (shared sample questions)', () => {
  for (const subject of QUIZ_SUBJECTS) {
    for (const grade of ['11', '12']) {
      if (grade === '11' && subject !== 'English') continue;
      // Stage 21A: the English level questions (A1–C1) are added after these and checked in stage21-model.
      const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === grade && q.subject === subject && !levelOfTopic(q.topic));
      assert.deepEqual(bank.map((q) => q.prompt), QUESTION_SEEDS[subject].map((s) => s.prompt), `${grade} ${subject}`);
      assert.equal(usesMeb(grade, subject), false, `${grade} ${subject}`);
    }
  }
});

test('grade 11 questions are shown as written in both languages; the tag needs the grade; saved results keep working', () => {
  const question = QUIZ_QUESTION_BANK.find((q) => q.id === '11-chemistry-meb-1')!;
  assert.equal(localizeQuestion(question, 'en'), question);
  assert.equal(localizeQuestion(question, 'tr'), question);
  assert.equal(mebOutcome(JSON.parse(JSON.stringify(question))), 'KİM.11.1.1');
  assert.equal(mebOutcome({ ...question, grade: '12' }), undefined);
});

test('Stage 19B: grade 11 History, Geography and Türk Dili ve Edebiyatı; 5 Literature questions per theme', () => {
  for (const subject of ['History', 'Geography', 'Literature'] as const) assert.ok(MEB11_SEEDS[subject]!.length >= 20, subject);
  assert.deepEqual(
    Object.fromEntries(['TAR', 'COĞ'].map((p) => [p, official[p].length])),
    { TAR: 11, COĞ: 19 },
  );
  assert.deepEqual(getQuizTopics('11', 'History'), ['Değişen Dünyada Osmanlı (1683-1789)', 'Dönüşüm Sürecinde Osmanlı (1789-1908)', 'Savaşlar Sarmalında Osmanlı (1908-1918)']);
  assert.equal(getQuizTopics('11', 'Geography').length, 7);
  assert.deepEqual(getQuizTopics('11', 'Literature'), ['Bir Diyeceğim Var!', 'Kültür Yolculuğu', 'Yaşamın İzinde', 'Hayatın Aynası']);
  for (const theme of getQuizTopics('11', 'Literature')) {
    const inTheme = MEB11_SEEDS.Literature!.filter((s) => s.theme === theme);
    assert.equal(inTheme.length, 5, theme);
    assert.ok(inTheme.some((s) => s.outcome === 'TDE4.3'), `${theme}: writing rules`);
    assert.ok(inTheme.every((s) => /^TDE(2\.[1-4]|4\.3)$/.test(s.outcome)), `${theme}: only reading and writing-rule skills`);
  }
  // grades 9, 10 and 11: only English is left on the shared sample bank
  for (const grade of ['9', '10', '11']) for (const subject of QUIZ_SUBJECTS) assert.equal(usesMeb(grade, subject), subject !== 'English', `${grade} ${subject}`);
});
