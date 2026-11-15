// Stage 22B-1: AYT Sayısal (Matematik 40, Fen 40) in the exam mode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AYT_QUESTIONS } from '../../artifacts/ai-exam-survival/src/pages/ayt-bank';
import { EXAM_BY_ID, EXAM_QUESTIONS } from '../../artifacts/ai-exam-survival/src/pages/exam-bank';
import { SECTION_OF, TYT_LETTERS } from '../../artifacts/ai-exam-survival/src/pages/tyt-bank';
import { EXAM_PLAN, buildExam, readExamData, scoreExam, startExam } from '../../artifacts/ai-exam-survival/src/pages/exam-mode-model';

const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;
const subjectsOf = (ids: string[]) => ids.map((id) => EXAM_BY_ID.get(id)!.subject);
const countOf = (ids: string[], subject: string) => subjectsOf(ids).filter((s) => s === subject).length;

test('80 AYT Sayısal questions: Matematik 40, Fizik 14, Kimya 13, Biyoloji 13 (the real AYT distribution)', () => {
  assert.equal(AYT_QUESTIONS.length, 80);
  assert.deepEqual(['aytmatematik', 'aytfizik', 'aytkimya', 'aytbiyoloji'].map((s) => AYT_QUESTIONS.filter((q) => q.subject === s).length), [40, 14, 13, 13]);
  assert.ok(AYT_QUESTIONS.every((q) => /^ayt-(matematik|fizik|kimya|biyoloji)-\d+$/.test(q.id)), 'ids');
  assert.equal(new Set(EXAM_QUESTIONS.map((q) => q.id)).size, 200, 'TYT and AYT ids never clash');
  assert.ok(AYT_QUESTIONS.every((q) => ['aytmatematik', 'aytfen'].includes(SECTION_OF[q.subject])));
});

test('five different options, an answer, a Turkish explanation; numbers from smallest to largest; no “hepsi/hiçbiri”', () => {
  const value = (t: string) => Number(t.replace('−', '-').replace(',', '.'));
  for (const q of AYT_QUESTIONS) {
    assert.equal(new Set(q.options).size, 5, q.id);
    assert.ok(TYT_LETTERS.includes(q.answer), q.id);
    assert.ok(q.explanation.length > 25 && TURKISH.test(q.explanation + q.prompt), `${q.id}: explanation`);
    // no “all / none of the above” options (a sentence such as “Hepsi normal görür…” is a real answer, not that)
    assert.ok(q.options.every((o) => !/^(hepsi|hiçbiri|tümü)\.?$|yukarıdakiler/i.test(o.trim())), q.id);
    if (q.options.every((o) => /^[−-]?\d+(,\d+)?$/.test(o))) {
      const v = q.options.map(value);
      assert.deepEqual(v, [...v].sort((a, b) => a - b), `${q.id}: order`);
    }
  }
  const letters = TYT_LETTERS.map((l) => AYT_QUESTIONS.filter((q) => q.answer === l).length);
  for (const n of letters) assert.ok(n >= 8, `answer letters spread: ${letters}`);
});

test('answers checked by hand (math worked out again here)', () => {
  const answer = (id: string) => { const q = EXAM_BY_ID.get(id)!; return q.options[TYT_LETTERS.indexOf(q.answer)]; };
  assert.equal(answer('ayt-matematik-1'), '9'); // f(g(2)) = f(5)
  assert.equal(answer('ayt-matematik-12'), String(Array.from({ length: 20 }, (_, i) => 2 + 3 * i).reduce((a, b) => a + b)));
  assert.equal(answer('ayt-matematik-13'), String(3 * 2 ** 5));
  assert.equal(answer('ayt-matematik-23'), '3');
  assert.equal(answer('ayt-matematik-30'), String(720 / 6));
  assert.equal(answer('ayt-matematik-32'), '2/5');
  assert.equal(answer('ayt-fizik-1'), '20');
  assert.equal(answer('ayt-fizik-3'), '30');
  assert.equal(answer('ayt-kimya-1'), '0,4');
  assert.equal(answer('ayt-kimya-8'), '50');
  assert.equal(answer('ayt-biyoloji-1'), '5′–AUG CCU AAG–3′');
});

test('AYT Sayısal mini exam: Matematik 20 + Fen 20 (7/7/6, the 6 taking turns), 45 minutes; single tests 40 questions, 45 minutes', () => {
  assert.deepEqual([EXAM_PLAN['ayt-say-mini'].questions, EXAM_PLAN['ayt-say-mini'].minutes], [40, 45]);
  for (let round = 0; round < 3; round += 1) {
    const ids = buildExam('ayt-say-mini', round);
    assert.equal(ids.length, 40);
    assert.equal(new Set(ids).size, 40);
    assert.equal(countOf(ids, 'aytmatematik'), 20);
    const fen = ['aytfizik', 'aytkimya', 'aytbiyoloji'].map((s) => countOf(ids, s));
    assert.equal(fen.reduce((a, b) => a + b), 20, `round ${round}: ${fen}`);
    assert.deepEqual([...fen].sort(), [6, 7, 7]);
    assert.equal(subjectsOf(ids).indexOf('aytfizik'), 20, 'math first, then science');
  }
  const mat = buildExam('ayt-mat', 0);
  assert.equal(mat.length, 40);
  assert.ok(mat.every((id) => id.startsWith('ayt-matematik-')));
  const fen = buildExam('ayt-fen', 2);
  assert.deepEqual(['aytfizik', 'aytkimya', 'aytbiyoloji'].map((s) => countOf(fen, s)), [14, 13, 13]);
  // two minis in a row cover all 40 math questions
  assert.equal(new Set([...buildExam('ayt-say-mini', 0), ...buildExam('ayt-say-mini', 1)].filter((id) => id.startsWith('ayt-matematik'))).size, 40);
});

test('AYT results are scored per test and saved in the same shape; older TYT-only data still reads', () => {
  const exam = startExam('ayt-say-mini', 0, new Date('2026-11-05T10:00:00Z'));
  const first = exam.questionIds[0];
  exam.answers[first] = EXAM_BY_ID.get(first)!.answer;
  const result = scoreExam(exam, new Date('2026-11-05T10:20:00Z'));
  assert.deepEqual(result.sections.map((s) => [s.section, s.total, s.correct, s.blank]), [['aytmatematik', 20, 1, 19], ['aytfen', 20, 0, 20]]);
  assert.equal(result.totalNet, 1);
  const saved = readExamData(JSON.stringify({ version: 1, results: [result], current: null }));
  assert.equal(saved.canSave, true);
  const old = readExamData(JSON.stringify({ version: 1, results: [], current: startExam('tyt-mini', 0) }));
  assert.equal(old.canSave, true);
});

test('explanations never name an option by its letter (the options move, so a letter would point to the wrong one)', () => {
  const letterRef = /(?<![°A-Za-zÇĞİÖŞÜçğıöşü|(])[A-E](’|')(de|da|deki|daki)\b|\b[A-E] seçene|\b[A-E], [A-E] ve [A-E]\b/;
  for (const q of EXAM_QUESTIONS) assert.ok(!letterRef.test(q.explanation), `${q.id}: ${q.explanation.slice(0, 80)}`);
});
