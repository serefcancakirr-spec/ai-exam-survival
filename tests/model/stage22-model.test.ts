// Stage 22A: YKS exam mode – TYT questions and exam rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TYT_QUESTIONS, TYT_BY_ID, SECTION_OF, TYT_LETTERS } from '../../artifacts/ai-exam-survival/src/pages/tyt-bank';
import {
  EXAM_PLAN,
  EXAM_STORAGE_KEY,
  MAX_SAVED_EXAMS,
  addResult,
  buildExam,
  emptyExamData,
  formatClock,
  net,
  readExamData,
  roundFor,
  scoreExam,
  secondsLeft,
  startExam,
} from '../../artifacts/ai-exam-survival/src/pages/exam-mode-model';
import { APP_STORAGE_KEYS } from '../../artifacts/ai-exam-survival/src/pages/about-page';

const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;
const count = (ids: string[], section: string) => ids.filter((id) => SECTION_OF[TYT_BY_ID.get(id)!.subject] === section).length;

test('120 TYT questions in the real distribution', () => {
  assert.equal(TYT_QUESTIONS.length, 120);
  const by = (s: string) => TYT_QUESTIONS.filter((q) => q.subject === s).length;
  assert.deepEqual(
    ['turkce', 'tarih', 'cografya', 'felsefe', 'din', 'matematik', 'fizik', 'kimya', 'biyoloji'].map(by),
    [40, 5, 5, 5, 5, 40, 7, 7, 6],
  );
  assert.equal(new Set(TYT_QUESTIONS.map((q) => q.id)).size, 120, 'unique ids');
});

test('every question has five different options, an answer letter and a Turkish explanation; no “hepsi/hiçbiri”', () => {
  for (const q of TYT_QUESTIONS) {
    assert.equal(q.options.length, 5, q.id);
    assert.equal(new Set(q.options).size, 5, `${q.id}: repeated option`);
    assert.ok(TYT_LETTERS.includes(q.answer), q.id);
    assert.ok(q.explanation.length > 25 && TURKISH.test(q.explanation + q.prompt), `${q.id}: explanation`);
    assert.ok(!/hepsi|hiçbiri|tümü/i.test(q.options.join(' ')), `${q.id}: all/none option`);
    assert.ok(q.prompt.trim().length > 10 && q.topic.trim().length > 2, q.id);
  }
  const letters = TYT_LETTERS.map((l) => TYT_QUESTIONS.filter((q) => q.answer === l).length);
  for (const n of letters) assert.ok(n >= 12, `answer letters spread: ${letters}`);
});

test('number answers are shown from smallest to largest, like ÖSYM does', () => {
  const value = (t: string) => Number(t.replace('−', '-').replace(',', '.'));
  for (const q of TYT_QUESTIONS.filter((x) => x.options.every((o) => /^[−-]?\d+(,\d+)?$/.test(o)))) {
    const values = q.options.map(value);
    assert.deepEqual(values, [...values].sort((a, b) => a - b), q.id);
  }
  const roman = TYT_QUESTIONS.find((q) => q.id === 'tyt-turkce-13')!;
  assert.deepEqual(roman.options, ['I', 'II', 'III', 'IV', 'V']);
  assert.equal(roman.answer, 'D', 'sentence IV');
});

test('a few answers checked by hand: math, Türkçe and the new subjects', () => {
  const answer = (id: string) => { const q = TYT_BY_ID.get(id)!; return q.options[TYT_LETTERS.indexOf(q.answer)]; };
  assert.equal(answer('tyt-matematik-1'), '14');
  assert.equal(answer('tyt-matematik-9'), '08.36');
  assert.equal(answer('tyt-matematik-19'), '360');
  assert.equal(answer('tyt-matematik-35'), '13');
  assert.equal(answer('tyt-matematik-36'), '154');
  assert.equal(answer('tyt-felsefe-1'), 'Rasyonalizm');
  assert.equal(answer('tyt-din-1'), 'Kişinin kendi annesi');
  assert.equal(answer('tyt-cografya-1'), '20');
  assert.equal(answer('tyt-kimya-2'), '10');
  assert.equal(answer('tyt-biyoloji-4'), '1/4');
});

test('a mini exam has 30 questions (Türkçe 10, Sosyal 5, Temel Matematik 10, Fen 5) in the real TYT order; a full exam has all 120', () => {
  for (let round = 0; round < 6; round += 1) {
    const ids = buildExam('tyt-mini', round);
    assert.equal(ids.length, 30);
    assert.equal(new Set(ids).size, 30, 'no repeats in one exam');
    assert.deepEqual(['turkce', 'sosyal', 'matematik', 'fen'].map((s) => count(ids, s)), [10, 5, 10, 5], `round ${round}`);
    const order = ids.map((id) => ['turkce', 'sosyal', 'matematik', 'fen'].indexOf(SECTION_OF[TYT_BY_ID.get(id)!.subject]));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), 'section order');
    for (const subject of ['tarih', 'cografya', 'felsefe', 'din', 'fizik', 'kimya', 'biyoloji']) {
      assert.ok(ids.some((id) => TYT_BY_ID.get(id)!.subject === subject), `round ${round}: ${subject} missing`);
    }
  }
  const full = buildExam('tyt-full', 3);
  assert.equal(full.length, 120);
  assert.equal(new Set(full).size, 120);
});

test('four mini exams in a row show all 40 Türkçe and all 40 math questions before any repeats', () => {
  for (const subject of ['turkce', 'matematik']) {
    const seen = [0, 1, 2, 3].flatMap((round) => buildExam('tyt-mini', round).filter((id) => TYT_BY_ID.get(id)!.subject === subject));
    assert.equal(new Set(seen).size, 40, subject);
  }
});

test('time: mini 41 minutes, full 165 minutes; the clock decides the time left', () => {
  assert.equal(EXAM_PLAN['tyt-mini'].minutes, 41);
  assert.equal(EXAM_PLAN['tyt-full'].minutes, 165);
  const start = new Date('2026-11-05T10:00:00+03:00');
  const exam = startExam('tyt-mini', 0, start);
  assert.equal(new Date(exam.endsAt).getTime() - start.getTime(), 41 * 60_000);
  assert.equal(secondsLeft(exam, start), 41 * 60);
  assert.equal(secondsLeft(exam, new Date(start.getTime() + 90_500)), 41 * 60 - 90);
  assert.equal(secondsLeft(exam, new Date(start.getTime() + 50 * 60_000)), 0);
  assert.equal(formatClock(41 * 60), '41:00');
  assert.equal(formatClock(165 * 60), '2:45:00');
  assert.equal(formatClock(59), '00:59');
});

test('net = correct − wrong ÷ 4, per test and in total; blank answers do not count', () => {
  assert.equal(net(7, 2), 6.5);
  assert.equal(net(0, 3), -0.75);
  const exam = startExam('tyt-mini', 0, new Date('2026-11-05T10:00:00Z'));
  const ids = exam.questionIds;
  const right = (id: string) => TYT_BY_ID.get(id)!.answer;
  const wrong = (id: string) => TYT_LETTERS.find((l) => l !== right(id))!;
  // Türkçe: 7 right, 2 wrong, 1 blank. Math: 4 right, 4 wrong, 2 blank. Others blank.
  const turkce = ids.filter((id) => TYT_BY_ID.get(id)!.subject === 'turkce');
  const math = ids.filter((id) => TYT_BY_ID.get(id)!.subject === 'matematik');
  turkce.slice(0, 7).forEach((id) => { exam.answers[id] = right(id); });
  turkce.slice(7, 9).forEach((id) => { exam.answers[id] = wrong(id); });
  math.slice(0, 4).forEach((id) => { exam.answers[id] = right(id); });
  math.slice(4, 8).forEach((id) => { exam.answers[id] = wrong(id); });
  const result = scoreExam(exam, new Date('2026-11-05T10:30:00Z'));
  const row = (s: string) => result.sections.find((x) => x.section === s)!;
  assert.deepEqual([row('turkce').correct, row('turkce').wrong, row('turkce').blank, row('turkce').net], [7, 2, 1, 6.5]);
  assert.deepEqual([row('matematik').correct, row('matematik').wrong, row('matematik').blank, row('matematik').net], [4, 4, 2, 3]);
  assert.deepEqual([row('sosyal').blank, row('fen').blank], [5, 5]);
  assert.equal(result.totalNet, 9.5, '11 − 6/4');
  assert.equal(result.timedOut, false);
});

test('saved data: newest first, at most 20 results, the exam in progress is cleared; unreadable data is never overwritten', () => {
  let data = emptyExamData();
  for (let i = 0; i < 25; i += 1) {
    const exam = startExam('tyt-mini', roundFor(data, 'tyt-mini'), new Date(Date.UTC(2026, 10, 1, 10, i)));
    data = { ...data, current: exam };
    data = addResult(data, scoreExam(exam, new Date(Date.UTC(2026, 10, 1, 11, i))));
  }
  assert.equal(data.results.length, MAX_SAVED_EXAMS);
  assert.equal(data.current, null);
  assert.ok(data.results[0].finishedAt > data.results[1].finishedAt, 'newest first');
  const round = readExamData(JSON.stringify(data));
  assert.equal(round.canSave, true);
  assert.deepEqual(round.data, data);
  assert.deepEqual(Object.keys(data.results[0]).sort(), ['answers', 'finishedAt', 'id', 'kind', 'questionIds', 'sections', 'startedAt', 'timedOut', 'totalNet']);
  assert.deepEqual(readExamData(null), { data: emptyExamData(), canSave: true });
  for (const bad of ['{', '[]', '{"version":2,"results":[],"current":null}', JSON.stringify({ ...data, results: [{ id: 1 }] })]) {
    assert.equal(readExamData(bad).canSave, false, bad.slice(0, 30));
  }
});

test('the new saved-data key is in the “delete all my data” list', () => {
  assert.equal(EXAM_STORAGE_KEY, 'ai-exam-survival:exam-mode:v1');
  assert.ok((APP_STORAGE_KEYS as readonly string[]).includes(EXAM_STORAGE_KEY));
});
