// Stage 22B-2b: Felsefe (grades 10–11) and Din Kültürü ve Ahlak Bilgisi (grades 9–12) as Quiz Center subjects,
// with questions written for the MEB Türkiye Yüzyılı Maarif Modeli programs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  QUIZ_QUESTION_BANK,
  QUIZ_SUBJECTS,
  QUIZ_GRADES,
  ALL_QUIZ_TOPICS,
  getQuizQuestionPool,
  getQuizSubjects,
  getQuizTopics,
} from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { FEL_DKAB_SEEDS } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-felsefe-din';
import { MEB_SEEDS, mebOutcome, usesMeb } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-meb';
import { FLASHCARD_SUBJECTS } from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import { SUBJECT_ROWS } from '../../artifacts/ai-exam-survival/src/pages/progress-tracker-model';
import { localizeQuestion } from '../../artifacts/ai-exam-survival/src/i18n/content';
import { TR as tr } from '../../artifacts/ai-exam-survival/src/i18n/translations-tr';
import { EN as en } from '../../artifacts/ai-exam-survival/src/i18n/translations-en';
import OFFICIAL from '../data/meb-fel-dkab-outcomes.json';

type Official = { code: string; grade: string; tema: string; cikti: string };
const official = OFFICIAL.subjects as Record<'FEL' | 'DKAB', Official[]>;
const PREFIX = { Philosophy: 'FEL', Religion: 'DKAB' } as const;
const NEW = ['Philosophy', 'Religion'] as const;
const upper = (text: string) => text.toLocaleUpperCase('tr');
const seedsOf = (grade: string, subject: (typeof NEW)[number]) => FEL_DKAB_SEEDS[grade]?.[subject] ?? [];
const allSeeds = () => QUIZ_GRADES.flatMap((g) => NEW.map((s) => ({ grade: g, subject: s, seeds: seedsOf(g, s) })));

test('two new subjects, added after the older ones so the older questions keep their answer letters', () => {
  assert.deepEqual(QUIZ_SUBJECTS.slice(-2), ['Philosophy', 'Religion']);
  assert.deepEqual(QUIZ_SUBJECTS.slice(0, 8), ['English', 'Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Literature']);
  assert.ok(FLASHCARD_SUBJECTS.includes('Philosophy') && FLASHCARD_SUBJECTS.includes('Religion'), 'Smart Flashcards can use them too');
  for (const subject of NEW) {
    assert.ok(SUBJECT_ROWS.some((r) => r.quizName === subject), `Progress Tracker row for ${subject}`);
    assert.ok(tr[`subject.${subject}` as keyof typeof tr] && en[`subject.${subject}` as keyof typeof en], `label for ${subject}`);
  }
  assert.equal(tr['subject.Philosophy' as keyof typeof tr], 'Felsefe');
  assert.equal(tr['subject.Religion' as keyof typeof tr], 'Din Kültürü ve Ahlak Bilgisi');
});

test('Felsefe only in grades 10 and 11, Din Kültürü in grades 9–12 (as in the MEB programs)', () => {
  assert.deepEqual(QUIZ_GRADES.map((g) => getQuizSubjects(g).includes('Philosophy')), [false, true, true, false]);
  assert.deepEqual(QUIZ_GRADES.map((g) => getQuizSubjects(g).includes('Religion')), [true, true, true, true]);
  for (const grade of QUIZ_GRADES) {
    for (const subject of QUIZ_SUBJECTS.slice(0, 8)) assert.ok(getQuizSubjects(grade).includes(subject), `${grade} ${subject}`);
  }
});

test('the official list: FEL 10 + 12 outcomes, DKAB 20 + 17 + 16 + 20 outcomes', () => {
  const count = (p: 'FEL' | 'DKAB', g: string) => official[p].filter((o) => o.grade === g).length;
  assert.deepEqual([count('FEL', '10'), count('FEL', '11')], [10, 12]);
  assert.deepEqual(['9', '10', '11', '12'].map((g) => count('DKAB', g)), [20, 17, 16, 20]);
  for (const list of Object.values(official)) for (const o of list) assert.ok(o.cikti.length > 20 && /^(FEL|DKAB)\.\d+\.\d+\.\d+$/.test(o.code), o.code);
});

test('question counts: Felsefe 20 + 24, Din Kültürü 20 per grade (124)', () => {
  assert.deepEqual([seedsOf('10', 'Philosophy').length, seedsOf('11', 'Philosophy').length], [20, 24]);
  assert.deepEqual(['9', '10', '11', '12'].map((g) => seedsOf(g, 'Religion').length), [20, 20, 20, 20]);
  assert.equal(seedsOf('9', 'Philosophy').length + seedsOf('12', 'Philosophy').length, 0);
});

test('every question measures a real outcome of its own grade, under its own unit; every outcome has a question', () => {
  for (const { grade, subject, seeds } of allSeeds()) {
    const list = official[PREFIX[subject]].filter((o) => o.grade === grade);
    for (const seed of seeds) {
      const found = list.find((o) => o.code === seed.outcome);
      assert.ok(found, `${grade} ${subject}: ${seed.outcome} is not in the official program`);
      assert.equal(upper(seed.theme), found.tema, `${seed.outcome}: unit "${seed.theme}" vs "${found.tema}"`);
    }
    const used = new Set(seeds.map((s) => s.outcome));
    assert.deepEqual(list.filter((o) => !used.has(o.code)).map((o) => o.code), [], `${grade} ${subject}: outcomes without a question`);
  }
});

test('questions follow the MEB writing guide basics; explanations never name an option by its letter', () => {
  const banned = /^(hepsi|hiçbiri|yukarıdakilerin|tümü)/;
  const letterRef = /(?<![°A-Za-zÇĞİÖŞÜçğıöşü|(])[A-E](’|')(de|da|deki|daki)\b|\b[A-E] seçene|\b[A-E], [A-E] ve [A-E]\b/;
  const earlier = new Set(
    Object.entries(MEB_SEEDS).flatMap(([, bySubject]) =>
      Object.entries(bySubject).filter(([s]) => !NEW.includes(s as never)).flatMap(([, seeds]) => (seeds ?? []).map((x) => x.prompt)),
    ),
  );
  const prompts = new Set<string>();
  for (const { grade, subject, seeds } of allSeeds()) {
    seeds.forEach((seed, i) => {
      const where = `${grade} ${subject} #${i + 1} (${seed.outcome})`;
      assert.ok(seed.prompt.trim().length >= 40, `${where}: question too short to give a context`);
      assert.ok(!prompts.has(seed.prompt) && !earlier.has(seed.prompt), `${where}: same question twice`);
      prompts.add(seed.prompt);
      assert.equal(new Set(seed.options.map((o) => o.trim())).size, 4, `${where}: options not all different`);
      seed.options.forEach((o) => assert.ok(o.trim() && !banned.test(o.trim().toLocaleLowerCase('tr')), `${where}: option "${o}"`));
      assert.ok(seed.explanation.trim().length > 30, `${where}: explanation`);
      assert.ok(!letterRef.test(seed.explanation), `${where}: explanation names a letter`);
    });
    if (!seeds.length) continue;
    const longest = seeds.filter((s) => {
      const lengths = s.options.map((o) => o.length);
      return lengths[0] > Math.max(...lengths.slice(1)) * 1.3;
    }).length;
    assert.ok(longest <= seeds.length / 4, `${grade} ${subject}: the answer is clearly the longest option in ${longest} questions`);
    for (const d of ['easy', 'medium', 'hard'] as const) assert.ok(seeds.some((s) => s.difficulty === d), `${grade} ${subject}: no ${d} question`);
  }
});

test('bank: ids "<grade>-philosophy-meb-<n>" / "<grade>-religion-meb-<n>", MEB tag, answers spread over A–D', () => {
  for (const { grade, subject, seeds } of allSeeds()) {
    const bank = QUIZ_QUESTION_BANK.filter((q) => q.grade === grade && q.subject === subject);
    assert.equal(bank.length, seeds.length, `${grade} ${subject}`);
    if (!seeds.length) {
      assert.equal(usesMeb(grade, subject), false);
      continue;
    }
    bank.forEach((question, i) => {
      assert.equal(question.id, `${grade}-${subject.toLowerCase()}-meb-${i + 1}`);
      assert.equal(question.topic, seeds[i].theme);
      assert.equal(question.options.find((o) => o.id === question.correctOptionId)!.text, seeds[i].options[0], `${question.id}: correct answer`);
      assert.equal(mebOutcome(JSON.parse(JSON.stringify(question))), seeds[i].outcome);
      assert.equal(localizeQuestion(question, 'tr'), question);
      assert.equal(localizeQuestion(question, 'en'), question);
    });
    assert.equal(new Set(bank.map((q) => q.correctOptionId)).size, 4, `${grade} ${subject}: answers are not spread over A–D`);
    assert.ok(usesMeb(grade, subject));
    assert.ok(getQuizQuestionPool(grade, subject, ALL_QUIZ_TOPICS, 'medium').length >= 20);
  }
  assert.deepEqual(getQuizTopics('9', 'Religion'), ['Allah-İnsan İlişkisi', 'İslam’da İnanç Esasları', 'İslam’da İbadetler', 'İslam’da Ahlak İlkeleri', 'Kur’an’a Göre Hz. Muhammed']);
  assert.equal(getQuizTopics('10', 'Philosophy').length, 9);
  assert.equal(getQuizTopics('11', 'Philosophy').length, 6);
  assert.equal(getQuizTopics('12', 'Religion').length, 5);
});

test('grade 12: only Din Kültürü uses MEB questions; the other grade 12 subjects keep the shared samples', () => {
  for (const subject of QUIZ_SUBJECTS) assert.equal(usesMeb('12', subject), subject === 'Religion', subject);
});
