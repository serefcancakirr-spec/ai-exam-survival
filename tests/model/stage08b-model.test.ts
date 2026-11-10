import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const B = '../../artifacts/ai-exam-survival/src';
import { TR_PHRASES } from '../../artifacts/ai-exam-survival/src/i18n/phrases-tr';
import { translatePhrase, translateTemplate } from '../../artifacts/ai-exam-survival/src/i18n/i18n';
import * as FM from '../../artifacts/ai-exam-survival/src/pages/flashcards-model';
import * as CM from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-model';
import * as MM from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-month';
import * as PM from '../../artifacts/ai-exam-survival/src/pages/exam-prep-model';
import * as SC from '../../artifacts/ai-exam-survival/src/pages/study-coach-model';
import * as CC from '../../artifacts/ai-exam-survival/src/pages/study-coach-content';
import * as PT from '../../artifacts/ai-exam-survival/src/pages/progress-tracker-model';

const tr = (x: string) => translatePhrase('tr', x);
const TODAY = '2026-11-05';
const missing = new Set<string>();
const need = (x: string, why = '') => {
  if (!x) return;
  if (tr(x) === x) missing.add(`${why}${x}`);
};
const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

test('every template used by the four pages has a Turkish text with the same {placeholders}', () => {
  const list: string[] = JSON.parse(readFileSync(__dirname + '/tx.json', 'utf8'));
  assert.ok(list.length > 250, `only ${list.length} templates found`);
  const absent = list.filter((t) => !(t in TR_PHRASES));
  assert.deepEqual(absent, []);
  const wrong = Object.entries(TR_PHRASES).filter(([en, t]) => placeholders(en) !== placeholders(t));
  assert.deepEqual(wrong.map(([en]) => en), []);
});

test('English is never changed by the language system', () => {
  for (const en of Object.keys(TR_PHRASES)) {
    assert.equal(translatePhrase('en', en), en);
    assert.equal(translateTemplate('en', en), en);
  }
});

test('Coach: every plan for every grade, subject, difficulty, problem, time left and topic is fully Turkish', () => {
  const dates = ['', TODAY, '2026-11-06', '2026-11-07', '2026-11-10', '2026-11-20', '2026-12-30'];
  let plans = 0;
  for (const grade of SC.COACH_GRADES) for (const subject of CC.COACH_SUBJECTS) for (const difficulty of CC.COACH_DIFFICULTIES)
    for (const problem of CC.COACH_PROBLEMS) for (const examDate of dates) for (const topic of ['', 'Genetics and DNA', 'Kendi konum: hücreler']) {
      const plan = SC.buildCoachPlan({ grade, subject, topic, difficulty, problem, examDate }, TODAY);
      plans += 1;
      need(plan.focus, 'focus: ');
      plan.actions.forEach((a) => {
        need(a.text, 'action: ');
        if (a.link) need(a.link.label, 'link: ');
        // Student text is kept exactly as typed inside the Turkish sentence.
        if (topic === 'Kendi konum: hücreler' && a.text.includes(topic)) assert.ok(tr(a.text).includes(topic), a.text);
      });
      plan.strategies.forEach((st) => [st.title, st.how, st.why].forEach((x) => need(x, 'strategy: ')));
      need(plan.gradeTip, 'grade tip: ');
      need(plan.problemTip, 'problem tip: ');
      need(plan.prompt, 'prompt: ');
      plan.summary.forEach((item, i) => { if (i !== 1 && item !== topic) need(item, 'summary: '); });
      if (topic === '' && plan.actions.some((a) => a.text.includes('this topic'))) {
        assert.ok(plan.actions.every((a) => !tr(a.text).includes('this topic')));
      }
    }
  Object.values(CC.SUBJECT_GUIDES).forEach((g) => { g.topics.forEach((x) => need(x, 'topic idea: ')); g.strategies.forEach((st) => [st.title, st.how, st.why].forEach((x) => need(x, 'strategy: '))); });
  Object.values(CC.DIFFICULTY_LABELS).forEach((x) => need(x));
  Object.values(CC.PROBLEM_LABELS).forEach((x) => need(x));
  assert.ok(plans > 10000);
  assert.deepEqual([...missing].filter((m) => !/^(focus|action|link|strategy|grade tip|problem tip|prompt|summary|topic idea)/.test(m) || true), []);
});

test('Coach: Turkish practice question keeps the student topic and reads naturally', () => {
  const p = SC.buildPracticePrompt('10', 'Biology', 'Genetics and DNA', 'remember');
  assert.equal(tr(p), 'Ben 10. sınıf öğrencisiyim. Biyoloji dersinde şu konuyu çalışıyorum: Genetik ve DNA. Hafızamı sınamak için bana 5 kısa hatırlama sorusu sor. Cevapları ancak ben denedikten sonra göster.');
  const q = SC.buildPracticePrompt('9', 'Other', 'Life in cities', 'none');
  assert.ok(tr(q).includes('Life in cities') && !tr(q).includes('cities dersinde'), tr(q));
});

test('Calendar: countdowns, placement messages, suggestions, due labels and checks are Turkish', () => {
  for (const d of ['2026-11-05', '2026-11-06', '2026-11-12', '2026-11-04', '2026-10-01']) {
    need(CM.getCountdown(d, TODAY).label, 'countdown: ');
    const c = CM.getCountdown(d, TODAY);
    if (c.tone !== 'past') need(`Countdown: ${c.label.toLowerCase()}.`);
    need(`“My test” added. Countdown: ${c.label.toLowerCase()}.`);
  }
  assert.equal(tr('“Kimya 2. yazılı” added. Countdown: in 7 days.'), '“Kimya 2. yazılı” eklendi. Geri sayım: 7 gün sonra.');
  for (const subject of CM.EXAM_SUBJECTS) for (const date of ['2026-11-05', '2026-11-06', '2026-11-10', '2026-12-20']) {
    PM.suggestPrepSteps({ subject, date }, TODAY).forEach((s) => {
      need(s.text, 'suggestion: ');
      need(PM.getDueLabel({ dueDate: s.dueDate, done: false }, TODAY), 'due: ');
    });
  }
  assert.equal(tr('Take one short subject practice quiz'), 'Kısa bir ders alıştırma testi çöz');
  for (const due of ['2026-11-01', '2026-11-04']) need(PM.getDueLabel({ dueDate: due, done: false }, TODAY));
  CM.validateExamDraft({ subject: 'x', grade: '1', title: '', date: '', time: 'zz', notes: 'n'.repeat(400) }).forEach((e) => need(e, 'check: '));
  CM.validateExamDraft({ subject: 'Biology', grade: '9', title: 't'.repeat(90), date: '2026-02-30', time: '', notes: '' }).forEach((e) => need(e, 'check: '));
  CM.validateExamDraft({ subject: 'Biology', grade: '9', title: 'x', date: '1990-01-01', time: '', notes: '' }).forEach((e) => need(e, 'check: '));
  PM.validateStepDraft({ text: '', dueDate: 'bad' }).forEach((e) => need(e, 'check: '));
  PM.validateStepDraft({ text: 'x'.repeat(200), dueDate: '' }).forEach((e) => need(e, 'check: '));
  CM.createExampleExams(TODAY).forEach((e) => { need(e.title); need(e.notes); });
  assert.deepEqual([...missing], []);
});

test('Calendar dates: English as before, Turkish uses Turkish names and capitals', () => {
  assert.deepEqual(CM.formatExamDate('2026-11-05'), { weekday: 'THU', day: '5', month: 'NOV', long: 'Thursday, November 5, 2026' });
  assert.equal(CM.formatExamTime('13:30'), '1:30 PM');
  assert.equal(CM.formatExamTime('13:30', true), '13:30');
  assert.equal(CM.formatExamTime('', true), '');
  assert.deepEqual(CM.formatExamDate('2026-11-05', 'tr-TR'), { weekday: 'PER', day: '5', month: 'KAS', long: '5 Kasım 2026 Perşembe' });
  assert.equal(MM.formatMonthLabel({ year: 2026, month: 10 }), 'November 2026');
  assert.equal(MM.formatMonthLabel({ year: 2026, month: 10 }, 'tr-TR'), 'Kasım 2026');
});

test('Flashcards: checks, labels and messages are Turkish', () => {
  FM.validateCardDraft({ front: '', answer: '', explanation: '' }).forEach((e) => need(e, 'check: '));
  FM.validateCardDraft({ front: 'f'.repeat(300), answer: 'a'.repeat(400), explanation: 'e'.repeat(600) }).forEach((e) => need(e, 'check: '));
  FM.validateDeckDraft({ name: '', grade: '1', subject: 'x', topic: 't'.repeat(70) }).forEach((e) => need(e, 'check: '));
  FM.validateDeckDraft({ name: 'n'.repeat(70), grade: '9', subject: 'Biology', topic: '' }).forEach((e) => need(e, 'check: '));
  for (const m of ['“Kelimelerim” was created. Add your first card below.', '“Kelimelerim” and its cards were deleted.', '1 starter deck restored.', '3 starter decks restored.']) need(m);
  ['New', 'Review again', 'Learning', 'Mastered', 'Learn', 'Practice', 'Review'].forEach((x) => need(x));
  assert.deepEqual([...missing], []);
});

test('Progress: labels, notes and recommendations are Turkish; quiz topic names stay as they are', () => {
  PT.SUBJECT_ROWS.forEach((r) => need(r.sourcesNote, 'note: '));
  Object.values(PT.ACTIVITY_LABELS).forEach((x) => need(x));
  ['Strong', 'Needs work', 'Getting there', 'Not enough data yet', 'Improving', 'Dropping', 'Steady', 'Quiz Center', 'Study Planner', 'Smart Flashcards', 'Exam Calendar', 'Preparation steps'].forEach((x) => need(x));
  const base = { subject: 'Biology', topic: 'Cells & Genetics', deckName: 'Cell Structure', good: 3, total: 10, rate: 30 };
  for (const source of ['quiz', 'flashcards'] as const) for (const classification of ['needs-work', 'strong'] as const) {
    PT.recommendFor({ ...base, source, classification } as never).forEach((r) => {
      need(r.text, 'recommendation: ');
      need(r.link.label);
      const t = tr(r.text);
      assert.ok(t.includes(source === 'quiz' ? 'Cells & Genetics' : 'Cell Structure'), t);
    });
  }
  assert.deepEqual([...missing], []);
});

import { englishFromTurkish } from '../../artifacts/ai-exam-survival/src/i18n/i18n';
test('suggested steps saved in Turkish are shown in English again in English mode', () => {
  for (const subject of CM.EXAM_SUBJECTS) for (const date of ['2026-11-05', '2026-11-06', '2026-11-10', '2026-12-20']) {
    PM.suggestPrepSteps({ subject, date }, TODAY).forEach((s) => assert.equal(englishFromTurkish(tr(s.text)), s.text));
  }
  assert.equal(englishFromTurkish('Kendi notum'), 'Kendi notum');
});
