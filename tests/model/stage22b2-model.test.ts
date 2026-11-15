// Stage 22B-2a: AYT Sözel (Edebiyat–Sosyal-1, Sosyal-2), Sözel and Eşit Ağırlık mini exams, the full AYT.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AYT_SOZEL_QUESTIONS } from '../../artifacts/ai-exam-survival/src/pages/ayt-sozel-bank';
import { EXAM_BY_ID, EXAM_QUESTIONS } from '../../artifacts/ai-exam-survival/src/pages/exam-bank';
import { SECTION_OF, TYT_LETTERS } from '../../artifacts/ai-exam-survival/src/pages/tyt-bank';
import { EXAM_PLAN, buildExam, scoreExam, startExam } from '../../artifacts/ai-exam-survival/src/pages/exam-mode-model';

const TURKISH = /[çğıöşüÇĞİÖŞÜ]/;
const subjects = (ids: string[]) => ids.map((id) => EXAM_BY_ID.get(id)!.subject);
const count = (ids: string[], subject: string) => subjects(ids).filter((s) => s === subject).length;
const sectionCount = (ids: string[], section: string) => ids.filter((id) => SECTION_OF[EXAM_BY_ID.get(id)!.subject] === section).length;

test('80 AYT Sözel questions in the real distribution', () => {
  assert.equal(AYT_SOZEL_QUESTIONS.length, 80);
  const by = (s: string) => AYT_SOZEL_QUESTIONS.filter((q) => q.subject === s).length;
  assert.deepEqual(['aytedebiyat', 'ayttarih1', 'aytcografya1'].map(by), [24, 10, 6], 'Edebiyat–Sosyal-1');
  assert.deepEqual(['ayttarih2', 'aytcografya2', 'aytfelsefe', 'aytmantik', 'aytpsikoloji', 'aytsosyoloji', 'aytdin'].map(by), [11, 11, 3, 3, 3, 3, 6], 'Sosyal-2');
  assert.equal(new Set(EXAM_QUESTIONS.map((q) => q.id)).size, 280, 'TYT 120 + AYT 160, all ids different');
});

test('five different options, a Turkish explanation, answers spread over A–E, no “all/none” options', () => {
  for (const q of AYT_SOZEL_QUESTIONS) {
    assert.equal(new Set(q.options).size, 5, q.id);
    assert.ok(q.explanation.length > 25 && TURKISH.test(q.explanation), q.id);
    assert.ok(q.options.every((o) => !/^(hepsi|hiçbiri|tümü)\.?$|yukarıdakiler/i.test(o.trim())), q.id);
  }
  const letters = TYT_LETTERS.map((l) => AYT_SOZEL_QUESTIONS.filter((q) => q.answer === l).length);
  for (const n of letters) assert.ok(n >= 10, `answer letters spread: ${letters}`);
});

test('answers checked by hand', () => {
  const answer = (id: string) => { const q = EXAM_BY_ID.get(id)!; return q.options[TYT_LETTERS.indexOf(q.answer)]; };
  assert.equal(answer('ayt-edebiyat-1'), 'Taaşşuk-ı Tal’at ve Fitnat');
  assert.equal(answer('ayt-edebiyat-11'), 'Şair Evlenmesi');
  assert.equal(answer('ayt-tarih1-8'), '1876');
  assert.equal(answer('ayt-tarih2-6'), '1952');
  assert.equal(answer('ayt-mantik-1'), '0, 1');
  assert.equal(answer('ayt-psikoloji-1'), 'Klasik koşullanma');
  assert.equal(answer('ayt-din-1'), 'Maturidilik');
});

test('Sözel mini: Edebiyat–Sosyal-1 20 + Sosyal-2 20 with every subject of each test; EA mini: Edebiyat–Sosyal-1 20 + Matematik 20', () => {
  for (let round = 0; round < 4; round += 1) {
    const soz = buildExam('ayt-soz-mini', round);
    assert.equal(soz.length, 40);
    assert.equal(new Set(soz).size, 40);
    assert.deepEqual([sectionCount(soz, 'ayttde'), sectionCount(soz, 'aytsos2')], [20, 20], `round ${round}`);
    for (const s of ['aytedebiyat', 'ayttarih1', 'aytcografya1', 'ayttarih2', 'aytcografya2', 'aytfelsefe', 'aytmantik', 'aytpsikoloji', 'aytsosyoloji', 'aytdin']) {
      assert.ok(count(soz, s) > 0, `round ${round}: ${s} missing`);
    }
    const ea = buildExam('ayt-ea-mini', round);
    assert.deepEqual([sectionCount(ea, 'ayttde'), sectionCount(ea, 'aytmatematik')], [20, 20]);
    assert.equal(SECTION_OF[EXAM_BY_ID.get(ea[0])!.subject], 'ayttde', 'AYT booklet order: Edebiyat–Sosyal-1 before Matematik');
  }
  for (const kind of ['ayt-soz-mini', 'ayt-ea-mini', 'ayt-tde', 'ayt-sos2'] as const) {
    assert.deepEqual([EXAM_PLAN[kind].questions, EXAM_PLAN[kind].minutes], [40, 45], kind);
    assert.equal(buildExam(kind, 0).length, 40, kind);
  }
});

test('full AYT: all 160 questions in four tests, 180 minutes, in the booklet order; scored per test', () => {
  assert.deepEqual([EXAM_PLAN['ayt-full'].questions, EXAM_PLAN['ayt-full'].minutes], [160, 180]);
  const ids = buildExam('ayt-full', 0);
  assert.equal(ids.length, 160);
  assert.equal(new Set(ids).size, 160);
  const order = ['ayttde', 'aytsos2', 'aytmatematik', 'aytfen'];
  const seen = ids.map((id) => order.indexOf(SECTION_OF[EXAM_BY_ID.get(id)!.subject]));
  assert.deepEqual(seen, [...seen].sort((a, b) => a - b), 'booklet order');
  const exam = startExam('ayt-full', 0, new Date('2026-11-05T10:00:00Z'));
  const result = scoreExam(exam, new Date('2026-11-05T11:00:00Z'));
  assert.deepEqual(result.sections.map((s) => [s.section, s.total, s.blank]), order.map((s) => [s, 40, 40]), 'four tests of 40, all blank');
});
