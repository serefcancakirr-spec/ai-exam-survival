import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthGrid,
  countExamsInMonth,
  daysInMonth,
  formatMonthLabel,
  groupExamsByDate,
  monthOf,
  shiftMonth,
} from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-month';
import {
  createInitialExamPrepData,
  createStep,
  findOrphanSteps,
  getDueLabel,
  getTimeBand,
  isSavedExamPrepData,
  isSuggestionAdded,
  prepProgress,
  readPlannerData,
  removeStepsForExam,
  stepsForExam,
  suggestPrepSteps,
  summarizePlannerForExam,
  toggleStep,
  validateStepDraft,
} from '../../artifacts/ai-exam-survival/src/pages/exam-prep-model';
import type { Exam } from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-model';

const exam = (id: string, date: string, subject: Exam['subject'] = 'Biology', time = ''): Exam => ({
  id, subject, grade: '9', title: id, date, time, notes: '', createdAt: '2026-11-01T00:00:00Z',
});

// ---------- month grid ----------

test('November 2026 grid: Monday start, 6 weeks, Oct 26 – Dec 6 (Nov 30 is a Monday)', () => {
  const weeks = buildMonthGrid({ year: 2026, month: 10 });
  assert.equal(weeks.length, 6);
  assert.equal(weeks[0][0].dateKey, '2026-10-26');
  assert.equal(weeks[0][0].inMonth, false);
  assert.equal(weeks[0][6].dateKey, '2026-11-01', 'Nov 1 2026 is a Sunday');
  assert.equal(weeks[4][6].dateKey, '2026-11-29');
  assert.equal(weeks[5][0].dateKey, '2026-11-30');
  assert.equal(weeks[5][6].dateKey, '2026-12-06');
  assert.equal(weeks[5][1].inMonth, false);
  const inMonth = weeks.flat().filter((d) => d.inMonth);
  assert.equal(inMonth.length, 30);
});

test('every grid is whole weeks, Monday to Sunday, covering the whole month', () => {
  for (let year = 2026; year <= 2029; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      const weeks = buildMonthGrid({ year, month });
      assert.ok(weeks.length >= 4 && weeks.length <= 6);
      const days = weeks.flat();
      assert.equal(new Date(`${days[0].dateKey}T12:00:00`).getDay(), 1, 'starts Monday');
      assert.equal(new Date(`${days[days.length - 1].dateKey}T12:00:00`).getDay(), 0, 'ends Sunday');
      assert.equal(days.filter((d) => d.inMonth).length, daysInMonth({ year, month }));
      for (let i = 1; i < days.length; i += 1) {
        const gap = (Date.parse(`${days[i].dateKey}T12:00:00Z`) - Date.parse(`${days[i - 1].dateKey}T12:00:00Z`)) / 864e5;
        assert.equal(gap, 1, `no gaps or repeats (${days[i].dateKey})`);
      }
    }
  }
});

test('leap years: February 2028 has 29 days, 2027 and 2100 have 28', () => {
  assert.equal(daysInMonth({ year: 2028, month: 1 }), 29);
  assert.equal(daysInMonth({ year: 2027, month: 1 }), 28);
  assert.equal(daysInMonth({ year: 2100, month: 1 }), 28);
  assert.equal(daysInMonth({ year: 2000, month: 1 }), 29);
  assert.ok(buildMonthGrid({ year: 2028, month: 1 }).flat().some((d) => d.dateKey === '2028-02-29' && d.inMonth));
  assert.ok(!buildMonthGrid({ year: 2027, month: 1 }).flat().some((d) => d.dateKey === '2027-02-29'));
});

test('February 2027 fits exactly 4 weeks (starts Monday, 28 days)', () => {
  assert.equal(buildMonthGrid({ year: 2027, month: 1 }).length, 4);
});

test('moving between months crosses years correctly', () => {
  assert.deepEqual(shiftMonth({ year: 2026, month: 11 }, 1), { year: 2027, month: 0 });
  assert.deepEqual(shiftMonth({ year: 2027, month: 0 }, -1), { year: 2026, month: 11 });
  assert.deepEqual(shiftMonth({ year: 2026, month: 10 }, -14), { year: 2025, month: 8 });
  assert.deepEqual(monthOf('2028-02-29'), { year: 2028, month: 1 });
  assert.equal(formatMonthLabel({ year: 2027, month: 0 }), 'January 2027');
});

test('exams are grouped on their dates and counted per month', () => {
  const exams = [exam('b', '2026-11-10', 'Biology', '13:00'), exam('a', '2026-11-10', 'Physics', '09:00'), exam('c', '2026-12-01')];
  const map = groupExamsByDate(exams);
  assert.deepEqual(map.get('2026-11-10')?.map((e) => e.id), ['a', 'b']);
  assert.equal(map.get('2026-11-11'), undefined);
  assert.equal(countExamsInMonth(exams, { year: 2026, month: 10 }), 2);
  assert.equal(countExamsInMonth(exams, { year: 2026, month: 11 }), 1);
});

// ---------- preparation steps ----------

test('time bands: past, today, 1–2 days, 3–7 days, 8+ days', () => {
  const today = '2026-11-05';
  assert.equal(getTimeBand('2026-11-04', today), 'past');
  assert.equal(getTimeBand('2026-11-05', today), 'today');
  assert.equal(getTimeBand('2026-11-07', today), 'soon');
  assert.equal(getTimeBand('2026-11-12', today), 'week');
  assert.equal(getTimeBand('2026-11-13', today), 'later');
});

test('suggestions change with the time left and mention the subject', () => {
  const today = '2026-11-05';
  assert.equal(suggestPrepSteps(exam('x', '2026-11-05'), today).length, 3);
  assert.equal(suggestPrepSteps(exam('x', '2026-11-06'), today).length, 4);
  assert.equal(suggestPrepSteps(exam('x', '2026-11-10'), today).length, 5);
  const later = suggestPrepSteps(exam('x', '2026-11-25', 'Physics'), today);
  assert.equal(later.length, 7);
  assert.ok(later.some((s) => s.text.includes('Physics')));
  assert.ok(later.some((s) => s.text.includes('Study Planner')));
  assert.deepEqual(suggestPrepSteps(exam('x', '2026-11-01'), today), [], 'no suggestions for past exams');
  assert.ok(!suggestPrepSteps(exam('x', '2026-11-25', 'Other'), today).some((s) => s.text.includes('Other')));
});

test('suggested due dates are never before today and never after the exam', () => {
  const today = '2026-11-05';
  for (const date of ['2026-11-05', '2026-11-06', '2026-11-08', '2026-11-12', '2026-11-20', '2027-01-10']) {
    for (const s of suggestPrepSteps(exam('x', date), today)) {
      assert.ok(s.dueDate >= today, `${s.text} due ${s.dueDate} before today`);
      assert.ok(s.dueDate <= date, `${s.text} due ${s.dueDate} after exam ${date}`);
    }
  }
  const late = suggestPrepSteps(exam('x', '2026-11-25'), today);
  assert.equal(late[late.length - 1].dueDate, '2026-11-24', 'final review the day before');
});

test('step checks give clear messages', () => {
  assert.deepEqual(validateStepDraft({ text: 'Review chapter 4', dueDate: '' }), []);
  assert.deepEqual(validateStepDraft({ text: '  ', dueDate: '' }), ['Write what you will do, for example “Review chapter 4”.']);
  assert.deepEqual(validateStepDraft({ text: 'ok', dueDate: '2027-02-29' }), ['Choose a real due date, or leave it empty.']);
  assert.equal(validateStepDraft({ text: 'x'.repeat(121), dueDate: '' }).length, 1);
});

test('steps stay linked to their exam, sorted by due date, and are removed with it', () => {
  let data = createInitialExamPrepData();
  const a1 = createStep('A', { text: 'no date', dueDate: '' }, 'own', '2026-11-05T10:00:00Z');
  const a2 = createStep('A', { text: 'later', dueDate: '2026-11-09' }, 'own', '2026-11-05T10:01:00Z');
  const a3 = createStep('A', { text: 'sooner', dueDate: '2026-11-06' }, 'suggested', '2026-11-05T10:02:00Z');
  const b1 = createStep('B', { text: 'other exam', dueDate: '' }, 'own');
  data = { ...data, steps: [a1, a2, b1, a3] };
  assert.deepEqual(stepsForExam(data.steps, 'A').map((s) => s.text), ['sooner', 'later', 'no date']);
  assert.deepEqual(stepsForExam(data.steps, 'B').map((s) => s.text), ['other exam']);
  const removed = removeStepsForExam(data, 'A');
  assert.deepEqual(removed.steps.map((s) => s.examId), ['B']);
  assert.deepEqual(findOrphanSteps(data, new Set(['A'])).map((s) => s.text), ['other exam']);
});

test('completing steps updates progress', () => {
  const steps = [createStep('A', { text: '1', dueDate: '' }, 'own'), createStep('A', { text: '2', dueDate: '' }, 'own'), createStep('A', { text: '3', dueDate: '' }, 'own'), createStep('A', { text: '4', dueDate: '' }, 'own')];
  assert.deepEqual(prepProgress(steps), { done: 0, total: 4, percent: 0 });
  const done = toggleStep(steps[0], '2026-11-05T12:00:00Z');
  assert.equal(done.done, true);
  assert.equal(done.completedAt, '2026-11-05T12:00:00Z');
  assert.deepEqual(prepProgress([done, steps[1], steps[2], steps[3]]), { done: 1, total: 4, percent: 25 });
  const undone = toggleStep(done);
  assert.equal(undone.done, false);
  assert.equal(undone.completedAt, null);
  assert.deepEqual(prepProgress([]), { done: 0, total: 0, percent: 0 });
});

test('due labels: due today / tomorrow / in N days / overdue (hidden once done)', () => {
  const today = '2026-11-05';
  assert.equal(getDueLabel({ dueDate: '2026-11-05', done: false }, today), 'Due today');
  assert.equal(getDueLabel({ dueDate: '2026-11-06', done: false }, today), 'Due tomorrow');
  assert.equal(getDueLabel({ dueDate: '2026-11-09', done: false }, today), 'Due in 4 days');
  assert.equal(getDueLabel({ dueDate: '2026-11-04', done: false }, today), 'Overdue by 1 day');
  assert.equal(getDueLabel({ dueDate: '2026-11-01', done: false }, today), 'Overdue by 4 days');
  assert.equal(getDueLabel({ dueDate: '2026-11-01', done: true }, today), '');
  assert.equal(getDueLabel({ dueDate: '', done: false }, today), '');
});

test('a suggestion counts as added only for the same exam (any letter case)', () => {
  const steps = [createStep('A', { text: 'List every topic the exam covers', dueDate: '' }, 'suggested')];
  assert.ok(isSuggestionAdded(steps, 'A', 'list every topic the exam covers'));
  assert.ok(!isSuggestionAdded(steps, 'B', 'List every topic the exam covers'));
});

test('Study Planner summary is read only and counts the right sessions', () => {
  const task = (subject: string, date: string, completed: boolean, kind: 'study' | 'break' = 'study') => ({
    id: `${subject}-${date}-${completed}-${kind}`, date, startTime: '4:00 PM', duration: 25, kind, subject, activity: 'Topic review', topic: 't', completed,
  });
  const planner = {
    version: 1 as const, grade: '9', dailyMinutes: 60, subjects: [], weekStart: '2026-11-05', generatedAt: '2026-11-05T10:00:00Z', inputSnapshot: '{}',
    tasks: [task('Biology', '2026-11-05', true), task('Biology', '2026-11-06', false), task('Biology', '2026-11-09', true), task('Break', '2026-11-05', true, 'break'), task('Physics', '2026-11-05', true)],
  };
  const raw = JSON.stringify(planner);
  const parsed = readPlannerData(raw);
  assert.ok(parsed);
  assert.deepEqual(summarizePlannerForExam(parsed, exam('x', '2026-11-08')), { status: 'sessions', planned: 2, completed: 1, remaining: 1 });
  assert.deepEqual(summarizePlannerForExam(parsed, exam('x', '2026-11-09')), { status: 'sessions', planned: 3, completed: 2, remaining: 1 });
  assert.deepEqual(summarizePlannerForExam(parsed, exam('x', '2026-11-09', 'Chemistry')), { status: 'no-sessions' });
  assert.deepEqual(summarizePlannerForExam(null, exam('x', '2026-11-09')), { status: 'no-plan' });
  assert.equal(readPlannerData('{broken'), null);
  assert.equal(readPlannerData(null), null);
  assert.equal(JSON.stringify(parsed), raw, 'planner data is not changed by reading it');
});

test('save check accepts good data and rejects damaged data', () => {
  const good = { version: 1, steps: [createStep('A', { text: 'x', dueDate: '2026-11-06' }, 'own')] };
  assert.ok(isSavedExamPrepData(good));
  assert.equal(isSavedExamPrepData({ version: 1, steps: [{ ...good.steps[0], dueDate: '2026-02-30' }] }), false);
  assert.equal(isSavedExamPrepData({ version: 1, steps: [{ ...good.steps[0], source: 'robot' }] }), false);
  assert.equal(isSavedExamPrepData({ version: 2, steps: [] }), false);
  assert.equal(isSavedExamPrepData('broken'), false);
});
