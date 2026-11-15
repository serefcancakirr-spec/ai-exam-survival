// Stage 22C-2: the three YDT sets follow the real ÖSYM YDT booklet layout (the same in every booklet 2018–2026);
// question ids keep their meaning so exams saved before this stage can still be reviewed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YDT_ALL_QUESTIONS, YDT_QUESTIONS, YDT_SETS, ydtHalfIds, ydtSetIds } from '../../artifacts/ai-exam-survival/src/pages/ydt-bank';
import { YDT_EXTRA, YDT_RETIRED } from '../../artifacts/ai-exam-survival/src/pages/ydt-extra';
import { YDT_PLAN, YDT_TOPIC } from '../../artifacts/ai-exam-survival/src/pages/ydt-common';
import { YDT_SET_1 } from '../../artifacts/ai-exam-survival/src/pages/ydt-set1';
import { YDT_SET_2 } from '../../artifacts/ai-exam-survival/src/pages/ydt-set2';
import { YDT_SET_3 } from '../../artifacts/ai-exam-survival/src/pages/ydt-set3';
import { EXAM_BY_ID } from '../../artifacts/ai-exam-survival/src/pages/exam-bank';
import { placeOptions, TYT_LETTERS } from '../../artifacts/ai-exam-survival/src/pages/tyt-bank';
import { buildExam, scoreExam, type RunningExam } from '../../artifacts/ai-exam-survival/src/pages/exam-mode-model';

// Question numbers of each type in the real booklet (instructions "1. - 8. sorularda …" etc. in the ÖSYM booklets)
const REAL_LAYOUT: [string, number, number][] = [
  [YDT_TOPIC.vocab, 1, 8], [YDT_TOPIC.grammar, 9, 15], [YDT_TOPIC.cloze, 16, 20], [YDT_TOPIC.sentence, 21, 28],
  [YDT_TOPIC.reading, 29, 43], [YDT_TOPIC.dialogue, 44, 48], [YDT_TOPIC.closest, 49, 53], [YDT_TOPIC.situation, 54, 58],
  [YDT_TOPIC.paragraph, 59, 63], [YDT_TOPIC.toTr, 64, 69], [YDT_TOPIC.toEn, 70, 75], [YDT_TOPIC.irrelevant, 76, 80],
];

test('every set has each question type at the same numbers as the real YDT booklet', () => {
  for (const [topic, from, to] of REAL_LAYOUT) assert.equal(YDT_PLAN[topic as never].full, to - from + 1, topic);
  YDT_SETS.forEach((set, s) => {
    assert.equal(set.length, 80);
    for (const [topic, from, to] of REAL_LAYOUT) {
      for (let n = from; n <= to; n += 1) assert.equal(set[n - 1].topic, topic, `set ${s + 1}, question ${n}`);
    }
  });
  // reading: questions 29–31, 32–34 … 41–43 belong to one text each
  for (const set of YDT_SETS) for (let n = 29; n <= 41; n += 3) {
    assert.equal(new Set(set.slice(n - 1, n + 2).map((q) => q.passage)).size, 1);
    assert.notEqual(set[n - 1].passage, set[n + 2]?.passage);
  }
});

test('15 questions retired and 15 added per set; retired ones never appear in new exams', () => {
  const used = new Set(YDT_QUESTIONS.map((q) => q.id));
  YDT_RETIRED.forEach((nums, s) => {
    assert.equal(nums.length, 15);
    assert.equal(YDT_EXTRA[s].length, 15);
    for (const n of nums) {
      assert.ok(!used.has(`ydt-${s + 1}-${n}`), `ydt-${s + 1}-${n} still used`);
      assert.ok(EXAM_BY_ID.has(`ydt-${s + 1}-${n}`), 'kept for saved exams');
    }
    for (let n = 81; n <= 95; n += 1) assert.ok(used.has(`ydt-${s + 1}-${n}`), `ydt-${s + 1}-${n} not used`);
  });
  for (let r = 0; r < 6; r += 1) {
    for (const id of [...buildExam('ydt-full', r), ...buildExam('ydt-mini', r)]) assert.ok(used.has(id), `${id} in a new exam`);
  }
  assert.equal(YDT_ALL_QUESTIONS.length, 285);
});

test('questions from Stage 22C keep their id and option order, so saved exams are reviewed and scored as before', () => {
  [YDT_SET_1, YDT_SET_2, YDT_SET_3].forEach((set, s) => {
    set.forEach((seed, i) => {
      const q = EXAM_BY_ID.get(`ydt-${s + 1}-${i + 1}`)!;
      const { options, answer } = placeOptions(seed, s * 80 + i);
      assert.equal(q.prompt, seed.prompt);
      assert.deepEqual([q.options, q.answer], [options, answer], q.id);
    });
  });
  // a full YDT saved before Stage 22C-2 (ids ydt-1-1 … ydt-1-80) still scores 80 questions
  const old: RunningExam = {
    kind: 'ydt-full', startedAt: '2026-11-05T10:00:00+03:00', endsAt: '2026-11-05T13:00:00+03:00',
    questionIds: Array.from({ length: 80 }, (_, i) => `ydt-1-${i + 1}`), answers: {},
  } as RunningExam;
  for (const id of old.questionIds.slice(0, 30)) old.answers[id] = EXAM_BY_ID.get(id)!.answer;
  const result = scoreExam(old, new Date('2026-11-05T12:00:00+03:00'));
  assert.deepEqual(result.sections.map((x) => [x.total, x.correct, x.blank]), [[80, 30, 50]]);
});

test('new question types: situation questions describe a situation in English and end with a gap; answers checked by hand', () => {
  const situations = YDT_QUESTIONS.filter((q) => q.topic === YDT_TOPIC.situation);
  assert.equal(situations.length, 15);
  for (const q of situations) {
    assert.ok(q.passage.trim().endsWith('----'), q.id);
    assert.ok(!/[çğışöüÇĞİŞÖÜ]/.test(q.passage), `${q.id}: situation in English`);
    assert.equal(q.prompt, 'Verilen durumda söylenmiş olabilecek sözü bulunuz.');
  }
  const answer = (id: string) => { const q = EXAM_BY_ID.get(id)!; return q.options[TYT_LETTERS.indexOf(q.answer)]; };
  assert.equal(answer('ydt-1-81'), 'rely');
  assert.equal(answer('ydt-1-82'), 'adversely');
  assert.equal(answer('ydt-2-81'), 'revealed');
  assert.equal(answer('ydt-3-81'), 'enhance');
  assert.ok(answer('ydt-1-85').startsWith('Excuse me, could you possibly repeat'));
  assert.equal(answer('ydt-3-95'), 'The more books you read, the richer your vocabulary becomes.');
  // the new vocabulary questions are placed after the old ones, at numbers 7 and 8
  for (let s = 0; s < 3; s += 1) assert.deepEqual(ydtSetIds(s).slice(6, 8), [`ydt-${s + 1}-81`, `ydt-${s + 1}-82`]);
});

test('minis: first half has the cloze text and 2 reading texts, second half 3 reading texts; 40 questions each', () => {
  for (let s = 0; s < 3; s += 1) {
    const [a, b] = [ydtHalfIds(s, 0), ydtHalfIds(s, 1)];
    const count = (ids: string[], topic: string) => ids.filter((id) => EXAM_BY_ID.get(id)!.topic === topic).length;
    assert.deepEqual([a.length, b.length], [40, 40]);
    assert.deepEqual([count(a, YDT_TOPIC.cloze), count(b, YDT_TOPIC.cloze)], [5, 0]);
    assert.deepEqual([count(a, YDT_TOPIC.reading), count(b, YDT_TOPIC.reading)], [6, 9]);
  }
});
