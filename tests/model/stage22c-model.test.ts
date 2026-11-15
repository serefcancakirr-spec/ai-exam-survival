// Stage 22C: YDT (English) in the exam mode – three full sets of 80 questions (240), mini (40 / 90 min) and full (80 / 180 min).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { YDT_QUESTIONS, YDT_SETS, ydtHalfIds, ydtSetIds } from '../../artifacts/ai-exam-survival/src/pages/ydt-bank';
import { YDT_PLAN, YDT_TOPIC } from '../../artifacts/ai-exam-survival/src/pages/ydt-common';
import { EXAM_BY_ID, EXAM_QUESTIONS } from '../../artifacts/ai-exam-survival/src/pages/exam-bank';
import { TYT_LETTERS } from '../../artifacts/ai-exam-survival/src/pages/tyt-bank';
import { EXAM_KINDS, EXAM_PLAN, buildExam, readExamData, scoreExam, startExam } from '../../artifacts/ai-exam-survival/src/pages/exam-mode-model';

const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;
const ORDER = Object.values(YDT_TOPIC);
const answer = (id: string) => { const q = EXAM_BY_ID.get(id)!; return q.options[TYT_LETTERS.indexOf(q.answer)]; };

test('240 YDT questions: three sets of 80 in the YDT question types, in the booklet order', () => {
  assert.equal(YDT_QUESTIONS.length, 240);
  assert.equal(new Set(EXAM_QUESTIONS.map((q) => q.id)).size, 520, 'TYT 120 + AYT 160 + YDT 240, all ids different');
  assert.equal(Object.values(YDT_PLAN).reduce((n, p) => n + p.full, 0), 80);
  assert.equal(Object.values(YDT_PLAN).reduce((n, p) => n + p.firstHalf, 0), 40);
  YDT_SETS.forEach((set, s) => {
    assert.equal(set.length, 80, `set ${s + 1}`);
    for (const topic of ORDER) assert.equal(set.filter((q) => q.topic === topic).length, YDT_PLAN[topic].full, `set ${s + 1}: ${topic}`);
    const positions = set.map((q) => ORDER.indexOf(q.topic as never));
    assert.deepEqual(positions, [...positions].sort((a, b) => a - b), `set ${s + 1}: types not in the booklet order`);
    assert.ok(set.every((q) => q.subject === 'ydt'));
    assert.deepEqual(ydtSetIds(s), Array.from({ length: 80 }, (_, i) => `ydt-${s + 1}-${i + 1}`));
  });
});

test('texts: 2 cloze texts with 5 blanks and 5 reading texts with 4 questions in every set; a text’s questions follow each other', () => {
  for (const set of YDT_SETS) {
    for (const [topic, texts, each] of [[YDT_TOPIC.cloze, 2, 5], [YDT_TOPIC.reading, 5, 4]] as const) {
      const qs = set.filter((q) => q.topic === topic);
      const passages = [...new Set(qs.map((q) => q.passage))];
      assert.equal(passages.length, texts, topic);
      for (const p of passages) {
        assert.equal(qs.filter((q) => q.passage === p).length, each, topic);
        const idx = set.map((q, i) => (q.passage === p ? i : -1)).filter((i) => i >= 0);
        assert.equal(idx[idx.length - 1] - idx[0], each - 1, `${topic}: questions of one text are not together`);
        if (topic === YDT_TOPIC.cloze) for (let b = 1; b <= 5; b += 1) assert.ok(p.includes(`(${b}) ----`), `cloze blank (${b})`);
      }
    }
    for (const q of set.filter((x) => x.topic === YDT_TOPIC.irrelevant)) {
      for (const r of ['(I)', '(II)', '(III)', '(IV)', '(V)']) assert.ok(q.passage.includes(r), 'five numbered sentences');
      assert.deepEqual([...q.options].sort(), ['I', 'II', 'III', 'IV', 'V']);
    }
    for (const q of set.filter((x) => x.topic === YDT_TOPIC.dialogue || x.topic === YDT_TOPIC.paragraph)) assert.ok(q.passage.includes('----'), 'gap in the text');
    for (const q of set.filter((x) => [YDT_TOPIC.vocab, YDT_TOPIC.grammar, YDT_TOPIC.sentence].includes(x.topic as never))) {
      assert.ok(q.prompt.includes('----') && !q.passage, `${q.topic}: sentence with a gap`);
    }
  }
});

test('five different options, Turkish explanations that never name a letter, answers spread over A–E', () => {
  const letterRef = /(?<![°A-Za-zÇĞİÖŞÜçğıöşü|(])[A-E](’|')(de|da|deki|daki)\b|\b[A-E] seçene|\b[A-E], [A-E] ve [A-E]\b/;
  const prompts = new Set<string>();
  for (const q of YDT_QUESTIONS) {
    assert.equal(new Set(q.options.map((o) => o.trim())).size, 5, q.id);
    assert.ok(q.explanation.length > 40 && TURKISH.test(q.explanation), `${q.id}: explanation`);
    assert.ok(!letterRef.test(q.explanation), `${q.id}: explanation names a letter`);
    assert.ok(q.options.every((o) => !/^(all|none) of the (above|options)|^(hepsi|hiçbiri)/i.test(o.trim())), q.id);
    const key = q.passage + '|' + q.prompt;
    assert.ok(!prompts.has(key), `${q.id}: same question twice`);
    prompts.add(key);
  }
  const letters = TYT_LETTERS.map((l) => YDT_QUESTIONS.filter((q) => q.answer === l).length);
  for (const n of letters) assert.ok(n >= 35, `answer letters spread: ${letters}`);
  // the correct option is not clearly the longest one too often (excluding I–V and translation questions)
  const text = YDT_QUESTIONS.filter((q) => !q.topic.startsWith('Çeviri') && q.topic !== YDT_TOPIC.irrelevant);
  const longest = text.filter((q) => {
    const right = answer(q.id).length;
    return right > Math.max(...q.options.filter((o) => o !== answer(q.id)).map((o) => o.length)) * 1.3;
  }).length;
  assert.ok(longest <= text.length / 5, `the answer is clearly the longest option in ${longest} of ${text.length} questions`);
});

test('answers checked by hand', () => {
  assert.equal(answer('ydt-1-1'), 'postpone');
  assert.equal(answer('ydt-1-7'), 'arrived / had been stranded');
  assert.equal(answer('ydt-1-17'), 'On the contrary');
  assert.equal(answer('ydt-1-76'), 'IV');
  assert.equal(EXAM_BY_ID.get('ydt-1-76')!.answer, 'D', 'I–V shown in order');
  assert.equal(answer('ydt-2-12'), 'Despite');
  assert.equal(answer('ydt-2-22'), 'less');
  assert.equal(answer('ydt-3-13'), 'Should');
  assert.equal(answer('ydt-3-80'), 'IV');
});

test('exam kinds: mini 40 questions / 90 minutes, full 80 / 180 minutes (real YDT: 80 questions, 180 minutes)', () => {
  assert.ok(EXAM_KINDS.includes('ydt-mini') && EXAM_KINDS.includes('ydt-full'));
  assert.deepEqual([EXAM_PLAN['ydt-mini'].questions, EXAM_PLAN['ydt-mini'].minutes], [40, 90]);
  assert.deepEqual([EXAM_PLAN['ydt-full'].questions, EXAM_PLAN['ydt-full'].minutes], [80, 180]);
  const exam = startExam('ydt-full', 0, new Date('2026-11-05T10:00:00+03:00'));
  assert.equal(new Date(exam.endsAt).getTime() - new Date(exam.startedAt).getTime(), 180 * 60_000);
});

test('full exams take the three sets in turn; six minis are the six halves and show all 240 questions once', () => {
  assert.deepEqual([0, 1, 2, 3].map((r) => buildExam('ydt-full', r)[0]), ['ydt-1-1', 'ydt-2-1', 'ydt-3-1', 'ydt-1-1']);
  const minis = [0, 1, 2, 3, 4, 5].map((r) => buildExam('ydt-mini', r));
  for (const m of minis) assert.equal(m.length, 40);
  assert.equal(new Set(minis.flat()).size, 240, 'every question exactly once in six minis');
  assert.deepEqual(buildExam('ydt-mini', 6), minis[0], 'then it starts again');
  for (let s = 0; s < 3; s += 1) {
    const [a, b] = [ydtHalfIds(s, 0), ydtHalfIds(s, 1)];
    assert.deepEqual([...a, ...b].sort(), ydtSetIds(s).sort());
    // each half keeps the booklet order and has every question type
    for (const half of [a, b]) {
      const nums = half.map((id) => Number(id.split('-')[2]));
      assert.deepEqual(nums, [...nums].sort((x, y) => x - y));
      const topics = new Set(half.map((id) => EXAM_BY_ID.get(id)!.topic));
      assert.equal(topics.size, ORDER.length, 'every question type in each mini');
      // no reading or cloze text is split between the two halves
      for (const id of half) {
        const q = EXAM_BY_ID.get(id)!;
        if (!q.passage || (q.topic !== YDT_TOPIC.reading && q.topic !== YDT_TOPIC.cloze)) continue;
        const sameText = YDT_QUESTIONS.filter((x) => x.passage === q.passage).map((x) => x.id);
        assert.ok(sameText.every((x) => half.includes(x)), `${id}: text split between minis`);
      }
    }
  }
});

test('scoring: one YDT section, net = correct − wrong ÷ 4; results are saved in the same shape', () => {
  const exam = startExam('ydt-mini', 0, new Date('2026-11-05T10:00:00+03:00'));
  const ids = exam.questionIds;
  for (const id of ids.slice(0, 20)) exam.answers[id] = EXAM_BY_ID.get(id)!.answer;
  for (const id of ids.slice(20, 28)) exam.answers[id] = TYT_LETTERS.find((l) => l !== EXAM_BY_ID.get(id)!.answer)!;
  const result = scoreExam(exam, new Date('2026-11-05T11:00:00+03:00'));
  assert.deepEqual(result.sections.map((s) => [s.section, s.total, s.correct, s.wrong, s.blank, s.net]), [['ydt', 40, 20, 8, 12, 18]]);
  assert.equal(result.totalNet, 18);
  const raw = JSON.stringify({ version: 1, results: [result], current: null });
  assert.equal(readExamData(raw).canSave, true);
  assert.deepEqual(Object.keys(result).sort(), ['answers', 'finishedAt', 'id', 'kind', 'questionIds', 'sections', 'startedAt', 'timedOut', 'totalNet']);
});
