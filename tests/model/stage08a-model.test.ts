import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EN } from '../../artifacts/ai-exam-survival/src/i18n/translations-en';
import { TR } from '../../artifacts/ai-exam-survival/src/i18n/translations-tr';
import { makeTranslator, translate } from '../../artifacts/ai-exam-survival/src/i18n/i18n';
import * as NewPlanner from '../../artifacts/ai-exam-survival/src/pages/study-planner-model';
import { QUIZ_SUBJECTS } from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';

const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

test('every English key has a Turkish text, and no extra Turkish keys', () => {
  assert.deepEqual(Object.keys(TR).sort(), Object.keys(EN).sort());
  for (const k of Object.keys(EN) as Array<keyof typeof EN>) assert.ok(TR[k].trim().length > 0, `empty TR for ${k}`);
});

test('Turkish texts keep exactly the same {placeholders}', () => {
  for (const k of Object.keys(EN) as Array<keyof typeof EN>) assert.equal(vars(TR[k]), vars(EN[k]), k);
});

test('Turkish texts are really translated (not left in English) except names', () => {
  const allowedSame = new Set(['lang.groupLabel', 'lang.trLabel', 'lang.enLabel', 'nav.homeAria', 'subject.Other', 'home.cardPreview']);
  const same = (Object.keys(EN) as Array<keyof typeof EN>).filter((k) => EN[k] === TR[k] && !allowedSame.has(k));
  // Names that are identical in both languages:
  const expectedSame = ['lang.trLabel', 'lang.enLabel', 'quiz.questionTitle', 'quiz.reviewQuestion'];
  assert.deepEqual(same.filter((k) => !expectedSame.includes(k)), []);
});

test('placeholders are filled; unknown ones are left visible', () => {
  assert.equal(translate('en', 'planner.editLimit', { minutes: 90 }), 'This would exceed your 90-minute daily limit. Shorten the task first.');
  assert.equal(translate('tr', 'common.grade', { grade: 10 }), '10. sınıf');
  assert.equal(translate('en', 'common.grade'), 'Grade {grade}');
});

test('singular / plural', () => {
  const en = makeTranslator('en');
  assert.equal(en.tn('planner.subjectCount', 1), '1 subject');
  assert.equal(en.tn('planner.subjectCount', 0), '0 subjects');
  assert.equal(en.tn('quiz.unanswered', 1), 'Answer all questions before finishing. 1 question is still unanswered.');
  assert.equal(en.tn('quiz.unanswered', 3), 'Answer all questions before finishing. 3 questions are still unanswered.');
  assert.equal(makeTranslator('tr').tn('planner.subjectCount', 2), '2 ders');
});

test('subject names: Turkish display, English unchanged, unknown names untouched', () => {
  const tr = makeTranslator('tr');
  const en = makeTranslator('en');
  for (const s of [...NewPlanner.PLANNER_SUBJECT_OPTIONS, ...QUIZ_SUBJECTS]) {
    assert.equal(en.subject(s), s);
    assert.notEqual(tr.subject(s), s === 'Other' ? 'x' : s, s);
  }
  assert.equal(tr.subject('Algebra I'), 'Cebir I');
  assert.equal(tr.subject('Mathematics'), 'Matematik');
  assert.equal(tr.subject('My own club'), 'My own club');
  assert.equal(tr.subject('constructor'), 'constructor');
  assert.equal(tr.plannerWord('Topic review'), 'Konu tekrarı');
  assert.equal(tr.plannerWord('Fractions'), 'Fractions');
  assert.equal(en.plannerWord('Topic review'), 'Topic review');
});

test('clock: 12-hour times become 24-hour in Turkish only', () => {
  const tr = makeTranslator('tr');
  assert.equal(tr.clock('4:00 PM'), '16:00');
  assert.equal(tr.clock('10:30 AM'), '10:30');
  assert.equal(tr.clock('12:05 AM'), '00:05');
  assert.equal(tr.clock('12:30 PM'), '12:30');
  assert.equal(tr.clock('after school'), 'after school');
  assert.equal(makeTranslator('en').clock('4:00 PM'), '4:00 PM');
});

test('planner checks: English wording (unchanged since Stage 7)', () => {
  const data = { ...NewPlanner.createInitialStudyPlannerData(), grade: '', dailyMinutes: 20, subjects: [
    { id: 'a', name: 'Biology', examDate: '2026-11-05', topics: '', difficulty: 'hard' as const },
    { id: 'b', name: 'biology', examDate: '', topics: 'x', difficulty: 'extreme' as never },
    { id: 'c', name: ' ', examDate: '2026-11-09', topics: 'y', difficulty: 'easy' as const },
  ] };
  assert.deepEqual(NewPlanner.validateStudyPlannerData(data, '2026-11-05'), [
    'Choose a grade level from 9 to 12.',
    'Choose 30 to 180 available study minutes per day.',
    'Set the Biology exam date to tomorrow or later.',
    'Add at least one topic for Biology.',
    'biology is listed more than once. Remove the duplicate.',
    'Add a valid exam date for biology.',
    'Choose a difficulty level for biology.',
    'Choose a name for Subject 3.',
  ]);
});

test('planner dates: English unchanged, Turkish uses Turkish names', () => {
  assert.deepEqual(NewPlanner.formatPlannerDate('2026-11-05'), { weekday: 'Thursday', date: 'Nov 5' });
  assert.deepEqual(NewPlanner.formatPlannerDate('bad'), { weekday: 'Study day', date: 'bad' });
  assert.deepEqual(NewPlanner.formatPlannerDate('2026-11-05', 'tr-TR', 'Çalışma günü'), { weekday: 'Perşembe', date: '5 Kas' });
  assert.equal(NewPlanner.formatPlannerDate('bad', 'tr-TR', 'Çalışma günü').weekday, 'Çalışma günü');
});

test('planner still writes English words into new tasks (saved data unchanged)', () => {
  const subjects = [{ id: 'a', name: 'Biology', examDate: '2026-11-09', topics: 'Cells, DNA', difficulty: 'hard' as const }];
  const tasks = NewPlanner.generateWeeklyStudyTasks(subjects, 90, '2026-11-05');
  assert.ok(tasks.length > 0);
  assert.ok(tasks.every((t) => /^\d{1,2}:\d{2} (AM|PM)$/.test(t.startTime)));
  assert.ok(tasks.filter((t) => t.kind === 'study').every((t) => ['Topic review', 'Practice questions', 'Revision & recall', 'Mixed practice'].includes(t.activity)));
  assert.ok(tasks.filter((t) => t.kind === 'break').every((t) => t.subject === 'Break' && t.topic === 'Stretch, hydrate, and rest your eyes.'));
});
