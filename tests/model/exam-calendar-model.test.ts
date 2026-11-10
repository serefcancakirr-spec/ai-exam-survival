import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addDays,
  createExampleExams,
  createInitialExamCalendarData,
  daysBetween,
  formatExamDate,
  formatExamTime,
  getCountdown,
  getTodayKey,
  isDateKey,
  isSavedExamCalendarData,
  splitExams,
  summarizeUpcoming,
  validateExamDraft,
  type Exam,
} from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-model';

const exam = (id: string, date: string, time = '', title = id): Exam => ({
  id, subject: 'Biology', grade: '9', title, date, time, notes: '', createdAt: '2026-11-01T00:00:00Z',
});
const okDraft = { subject: 'Biology', grade: '10', title: 'Unit test', date: '2026-11-20', time: '', notes: '' };

test('countdown labels: Today, Tomorrow, In N days, Yesterday, N days ago', () => {
  const today = '2026-11-05';
  assert.equal(getCountdown('2026-11-05', today).label, 'Today');
  assert.equal(getCountdown('2026-11-06', today).label, 'Tomorrow');
  assert.equal(getCountdown('2026-11-10', today).label, 'In 5 days');
  assert.equal(getCountdown('2026-11-04', today).label, 'Yesterday');
  assert.equal(getCountdown('2026-10-29', today).label, '7 days ago');
  assert.equal(getCountdown('2027-01-01', today).label, 'In 57 days');
});

test('countdown tones group exams by urgency', () => {
  const today = '2026-11-05';
  assert.equal(getCountdown('2026-11-05', today).tone, 'today');
  assert.equal(getCountdown('2026-11-06', today).tone, 'soon');
  assert.equal(getCountdown('2026-11-12', today).tone, 'week');
  assert.equal(getCountdown('2026-11-13', today).tone, 'later');
  assert.equal(getCountdown('2026-11-01', today).tone, 'past');
});

test('day counts are correct across month ends, year ends and leap days', () => {
  assert.equal(daysBetween('2026-11-30', '2026-12-01'), 1);
  assert.equal(daysBetween('2026-12-31', '2027-01-01'), 1);
  assert.equal(daysBetween('2028-02-28', '2028-03-01'), 2, '2028 is a leap year');
  assert.equal(daysBetween('2027-02-28', '2027-03-01'), 1);
  assert.equal(daysBetween('2026-03-28', '2026-03-30'), 2, 'European summer time change');
  assert.equal(daysBetween('2026-10-24', '2026-10-26'), 2, 'European winter time change');
  assert.equal(daysBetween('2026-11-10', '2026-11-05'), -5);
  assert.equal(addDays('2026-12-30', 3), '2027-01-02');
});

test('only real dates are accepted', () => {
  assert.ok(isDateKey('2028-02-29'));
  assert.equal(isDateKey('2027-02-29'), false);
  assert.equal(isDateKey('2026-13-01'), false);
  assert.equal(isDateKey('2026-11-31'), false);
  assert.equal(isDateKey('05/11/2026'), false);
  assert.equal(isDateKey(''), false);
});

test('today is the local calendar day', () => {
  assert.equal(getTodayKey(new Date(2026, 10, 5, 23, 59)), '2026-11-05');
  assert.equal(getTodayKey(new Date(2026, 10, 6, 0, 0)), '2026-11-06');
});

test('dates and times are shown in a readable form', () => {
  const d = formatExamDate('2026-11-10');
  assert.equal(d.weekday, 'TUE');
  assert.equal(d.day, '10');
  assert.equal(d.month, 'NOV');
  assert.equal(d.long, 'Tuesday, November 10, 2026');
  assert.equal(formatExamTime('09:00'), '9:00 AM');
  assert.equal(formatExamTime('13:45'), '1:45 PM');
  assert.equal(formatExamTime('00:30'), '12:30 AM');
  assert.equal(formatExamTime(''), '');
});

test('upcoming exams are soonest first; today counts as upcoming; past is most recent first', () => {
  const today = '2026-11-05';
  const list = [
    exam('later', '2026-11-20'),
    exam('old', '2026-10-01'),
    exam('today-pm', '2026-11-05', '14:00'),
    exam('today-am', '2026-11-05', '08:30'),
    exam('today-notime', '2026-11-05'),
    exam('yesterday', '2026-11-04'),
    exam('tomorrow', '2026-11-06'),
  ];
  const { upcoming, past } = splitExams(list, today);
  assert.deepEqual(upcoming.map((e) => e.id), ['today-am', 'today-pm', 'today-notime', 'tomorrow', 'later']);
  assert.deepEqual(past.map((e) => e.id), ['yesterday', 'old']);
});

test('an exam moves to Past the day after it happens', () => {
  const list = [exam('x', '2026-11-05')];
  assert.equal(splitExams(list, '2026-11-05').upcoming.length, 1);
  assert.equal(splitExams(list, '2026-11-06').past.length, 1);
});

test('summary counts exams in the next 7 and 30 days', () => {
  const today = '2026-11-05';
  const { upcoming } = splitExams(
    [exam('a', '2026-11-05'), exam('b', '2026-11-11'), exam('c', '2026-11-12'), exam('d', '2026-12-04'), exam('e', '2026-12-05')],
    today,
  );
  const s = summarizeUpcoming(upcoming, today);
  assert.equal(s.next?.id, 'a');
  assert.equal(s.thisWeek, 2, 'today + 6 days');
  assert.equal(s.nextMonth, 4, 'today + 29 days');
  assert.equal(s.total, 5);
});

test('form checks give clear messages', () => {
  assert.deepEqual(validateExamDraft(okDraft), []);
  assert.deepEqual(validateExamDraft({ ...okDraft, title: '  ', date: '' }), [
    'Write the exam title, for example “Unit 3 test”.',
    'Choose the exam date.',
  ]);
  assert.deepEqual(validateExamDraft({ ...okDraft, date: '2027-02-29' }), ['Choose a real date from the calendar.']);
  assert.deepEqual(validateExamDraft({ ...okDraft, date: '1999-05-01' }), ['Choose a date between 2000 and 2100.']);
  assert.deepEqual(validateExamDraft({ ...okDraft, subject: 'Art', grade: '8' }), ['Choose a subject.', 'Choose a grade from 9 to 12.']);
  assert.deepEqual(validateExamDraft({ ...okDraft, time: '25:00' }), ['Choose a valid time, or leave the time empty.']);
  assert.equal(validateExamDraft({ ...okDraft, title: 'x'.repeat(81) }).length, 1);
  assert.deepEqual(validateExamDraft({ ...okDraft, date: '2020-01-01' }), [], 'past dates are allowed');
});

test('example exams are tomorrow, in 5 days and in 12 days, with unique ids', () => {
  const ex = createExampleExams('2026-11-05');
  assert.deepEqual(ex.map((e) => getCountdown(e.date, '2026-11-05').label), ['Tomorrow', 'In 5 days', 'In 12 days']);
  assert.equal(new Set([...ex, ...createExampleExams('2026-11-05')].map((e) => e.id)).size, 6);
});

test('save check accepts good data and rejects damaged data', () => {
  assert.ok(isSavedExamCalendarData(createInitialExamCalendarData()));
  assert.ok(isSavedExamCalendarData({ version: 1, exams: [exam('a', '2026-11-05', '09:00')] }));
  assert.equal(isSavedExamCalendarData({ version: 1, exams: [{ ...exam('a', '2026-02-30') }] }), false);
  assert.equal(isSavedExamCalendarData({ version: 1, exams: [{ ...exam('a', '2026-11-05'), grade: '7' }] }), false);
  assert.equal(isSavedExamCalendarData({ version: 2, exams: [] }), false);
  assert.equal(isSavedExamCalendarData('broken'), false);
});
