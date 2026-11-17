// Stage 25: Study Planner and Exam Calendar use Turkish high school subjects (same saved names as Quiz Center);
// old American subject names stay readable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANNER_SUBJECT_OPTIONS } from '../../artifacts/ai-exam-survival/src/pages/study-planner-model';
import { EXAM_SUBJECTS, EXAM_SUBJECT_CHOICES, LEGACY_EXAM_SUBJECTS, createExampleExams, isSavedExamCalendarData } from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-model';
import { mapCalendarSubject } from '../../artifacts/ai-exam-survival/src/pages/study-coach-model';
import { SUBJECT_ROWS } from '../../artifacts/ai-exam-survival/src/pages/progress-tracker-model';
import { QUIZ_SUBJECTS } from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { EN } from '../../artifacts/ai-exam-survival/src/i18n/translations-en';
import { TR } from '../../artifacts/ai-exam-survival/src/i18n/translations-tr';

const TURKISH = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'Coğrafya', 'Felsefe', 'Din Kültürü ve Ahlak Bilgisi', 'İngilizce', 'Sağlık Bilgisi ve Trafik Kültürü', 'Diğer'];
const OLD = ['Algebra I', 'Algebra II', 'English Language Arts', 'Geometry', 'Spanish', 'World History'];

test('planner and calendar offer the same 13 Turkish high school subjects, none of the old American ones', () => {
  assert.deepEqual([...EXAM_SUBJECT_CHOICES], PLANNER_SUBJECT_OPTIONS);
  assert.deepEqual(PLANNER_SUBJECT_OPTIONS.map((s) => TR[`subject.${s}` as keyof typeof TR]), TURKISH);
  for (const s of PLANNER_SUBJECT_OPTIONS) assert.ok(EN[`subject.${s}` as keyof typeof EN], `EN name for ${s}`);
  for (const old of OLD) assert.ok(!PLANNER_SUBJECT_OPTIONS.includes(old), old);
});

test('the subjects Quiz Center has use exactly the same saved names', () => {
  for (const s of QUIZ_SUBJECTS) assert.ok(PLANNER_SUBJECT_OPTIONS.includes(s), `${s} missing from the planner list`);
});

test('exams saved with an old subject name are still read (never treated as broken data)', () => {
  assert.deepEqual([...LEGACY_EXAM_SUBJECTS], OLD);
  const exam = (subject: string) => ({ id: `e-${subject}`, subject, grade: '10', title: 'Test', date: '2026-11-20', time: '', notes: '', createdAt: '2026-11-01T10:00:00.000Z' });
  for (const subject of [...OLD, ...EXAM_SUBJECT_CHOICES]) {
    assert.equal(isSavedExamCalendarData({ version: 1, exams: [exam(subject)] }), true, subject);
  }
  assert.equal(isSavedExamCalendarData({ version: 1, exams: [exam('Astrology')] }), false);
  assert.equal(EXAM_SUBJECTS.length, 19);
});

test('example exams use the new subjects', () => {
  const subjects = createExampleExams('2026-11-05', '2026-11-05T10:00:00.000Z').map((e) => e.subject);
  assert.deepEqual(subjects, ['Biology', 'Mathematics', 'History']);
});

test('Progress Tracker: a planned subject joins its Quiz Center row; the two new subjects get their own rows; old rows stay', () => {
  const byPlanner = new Map(SUBJECT_ROWS.filter((r) => r.plannerName).map((r) => [r.plannerName, r]));
  for (const s of PLANNER_SUBJECT_OPTIONS) assert.ok(byPlanner.has(s), `no row for ${s}`);
  for (const s of QUIZ_SUBJECTS) assert.equal(byPlanner.get(s)!.quizName, s, `${s}: planner and quiz in one row`);
  assert.equal(byPlanner.get('Revolution History')!.group, 'History');
  for (const old of OLD) assert.ok(byPlanner.has(old), `old row ${old} kept for saved plans`);
  assert.equal(new Set(SUBJECT_ROWS.map((r) => r.key)).size, SUBJECT_ROWS.length);
});

test('Study Coach links calendar exams of the new subjects to its own subjects', () => {
  assert.equal(mapCalendarSubject('Mathematics'), 'Mathematics');
  assert.equal(mapCalendarSubject('Literature'), 'Literature');
  assert.equal(mapCalendarSubject('Revolution History'), 'History');
  assert.equal(mapCalendarSubject('English'), 'English');
  assert.equal(mapCalendarSubject('Health'), 'Other');
  assert.equal(mapCalendarSubject('Spanish'), 'Foreign Language');
});
