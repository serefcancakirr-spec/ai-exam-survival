import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COACH_GRADES,
  MAX_DAILY_MINUTES,
  buildCoachPlan,
  buildPracticePrompt,
  createExampleRequest,
  getCoachBand,
  getTimePlan,
  isSavedStudyCoachData,
  mapCalendarSubject,
  pickStrategies,
  readUpcomingCalendarExams,
  requestFromExam,
  validateCoachRequest,
  type CoachRequest,
} from '../../artifacts/ai-exam-survival/src/pages/study-coach-model';
import {
  COACH_DIFFICULTIES,
  COACH_PROBLEMS,
  COACH_SUBJECTS,
  SUBJECT_GUIDES,
} from '../../artifacts/ai-exam-survival/src/pages/study-coach-content';
import { EXAM_SUBJECTS } from '../../artifacts/ai-exam-survival/src/pages/exam-calendar-model';

const today = '2026-11-05';
const req = (over: Partial<CoachRequest> = {}): CoachRequest => ({
  grade: '10', subject: 'Biology', topic: 'Genetics', difficulty: 'somewhat-hard', problem: 'none', examDate: '', ...over,
});
const DATES = ['', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-12', '2026-11-20', '2026-11-26', '2027-03-01'];

test('library: 10 subjects × 4 strategies, unique ids, complete text', () => {
  const ids = new Set<string>();
  assert.equal(COACH_SUBJECTS.length, 10);
  for (const subject of COACH_SUBJECTS) {
    const guide = SUBJECT_GUIDES[subject];
    assert.equal(guide.strategies.length, 4, subject);
    assert.ok(guide.practice.length > 5);
    for (const s of guide.strategies) {
      assert.ok(!ids.has(s.id), `duplicate id ${s.id}`);
      ids.add(s.id);
      assert.ok(s.title && s.how.length > 20 && s.why.length > 15, s.id);
      assert.ok(s.difficulties.length > 0 && s.problems.length > 0, s.id);
    }
  }
  assert.equal(ids.size, 40);
});

test('every grade × subject × difficulty × time left × problem gives a complete plan', () => {
  let plans = 0;
  for (const grade of COACH_GRADES)
    for (const subject of COACH_SUBJECTS)
      for (const difficulty of COACH_DIFFICULTIES)
        for (const problem of COACH_PROBLEMS)
          for (const examDate of DATES)
            for (const topic of ['', 'Cells']) {
              const r = req({ grade, subject, difficulty, problem, examDate, topic });
              assert.deepEqual(validateCoachRequest(r, today), []);
              const plan = buildCoachPlan(r, today);
              plans += 1;
              assert.ok(plan.actions.length >= 3 && plan.actions.length <= 5, `${plan.actions.length} actions`);
              assert.equal(plan.strategies.length, 3);
              assert.equal(new Set(plan.strategies.map((s) => s.id)).size, 3, 'strategies repeat');
              assert.ok(plan.focus && plan.gradeTip && plan.problemTip && plan.prompt);
              assert.ok(plan.minutesPerDay > 0 && plan.minutesPerDay <= MAX_DAILY_MINUTES);
              const text = JSON.stringify(plan);
              assert.ok(!/undefined|NaN|null days|\s{2,}|\.\./.test(text.replace(/"daysLeft":null/, '')), `bad text: ${text.slice(0, 200)}`);
              if (topic) assert.ok(plan.actions.some((a) => a.text.includes(topic)), 'topic not used');
              else assert.ok(!plan.actions.some((a) => a.text.includes('Cells')));
            }
  assert.equal(plans, 4 * 10 * 3 * 5 * 8 * 2);
});

test('time left bands', () => {
  assert.equal(getCoachBand('', today), 'none');
  assert.equal(getCoachBand('2026-11-05', today), 'today');
  assert.equal(getCoachBand('2026-11-07', today), 'very-soon');
  assert.equal(getCoachBand('2026-11-12', today), 'this-week');
  assert.equal(getCoachBand('2026-11-26', today), 'weeks');
  assert.equal(getCoachBand('2026-11-27', today), 'far');
  assert.equal(getCoachBand('2026-11-01', today), 'none', 'past date treated as no date');
});

test('harder topics and closer exams get more time, never above 90 minutes', () => {
  assert.deepEqual(getTimePlan('this-week', 'comfortable'), { sessionsPerDay: 1, sessionLength: 25, minutesPerDay: 25 });
  assert.deepEqual(getTimePlan('this-week', 'very-hard'), { sessionsPerDay: 3, sessionLength: 25, minutesPerDay: 75 });
  assert.deepEqual(getTimePlan('today', 'very-hard'), { sessionsPerDay: 1, sessionLength: 20, minutesPerDay: 20 });
  assert.ok(getTimePlan('far', 'very-hard').minutesPerDay <= getTimePlan('this-week', 'very-hard').minutesPerDay);
  for (const d of COACH_DIFFICULTIES) assert.ok(getTimePlan('today', d).minutesPerDay <= 20, 'exam day stays light');
});

test('the plan reacts to difficulty: very hard starts with basics; comfortable ends with a challenge', () => {
  const hard = buildCoachPlan(req({ difficulty: 'very-hard', examDate: '2026-11-12' }), today);
  assert.ok(hard.actions[0].text.startsWith('Start with the basics of Genetics'));
  const easy = buildCoachPlan(req({ difficulty: 'comfortable', examDate: '2026-11-12' }), today);
  assert.ok(easy.actions[easy.actions.length - 1].text.startsWith('Challenge yourself'));
  assert.ok(easy.actions[easy.actions.length - 1].text.includes('Biology question'));
});

test('exam day plan: light review, no links to new work', () => {
  const plan = buildCoachPlan(req({ examDate: today }), today);
  assert.equal(plan.actions.length, 3);
  assert.ok(plan.actions[1].text.includes('Do not start new material'));
  assert.ok(plan.summary.includes('Exam today'));
});

test('summary lists grade, subject, topic, difficulty and time left', () => {
  const plan = buildCoachPlan(req({ examDate: '2026-11-10' }), today);
  assert.deepEqual(plan.summary, ['Grade 10', 'Biology', 'Genetics', 'Somewhat hard', 'Exam in 5 days']);
  assert.equal(plan.daysLeft, 5);
  assert.deepEqual(buildCoachPlan(req(), today).summary.slice(-1), ['No exam date']);
});

test('links only point to existing pages; quiz only for subjects Quiz Center has', () => {
  const pages = new Set(['/smart-flashcards', '/quiz-center', '/study-planner', '/exam-calendar']);
  for (const subject of COACH_SUBJECTS)
    for (const examDate of DATES) {
      const plan = buildCoachPlan(req({ subject, examDate }), today);
      for (const a of plan.actions) if (a.link) assert.ok(pages.has(a.link.href), a.link.href);
      const quiz = plan.actions.some((a) => a.link?.href === '/quiz-center');
      if (subject === 'Foreign Language' || subject === 'Other') assert.ok(!quiz, `${subject} should not link to quiz`);
    }
  assert.ok(buildCoachPlan(req({ examDate: '2026-11-12' }), today).actions.some((a) => a.link?.href === '/quiz-center'));
  assert.ok(buildCoachPlan(req(), today).actions.some((a) => a.link?.href === '/exam-calendar'), 'no date → suggest calendar');
});

test('strategies match the problem the student names', () => {
  for (const subject of COACH_SUBJECTS)
    for (const problem of ['understand', 'remember', 'time', 'nerves'] as const) {
      const picked = pickStrategies(subject, 'somewhat-hard', problem, 'weeks');
      assert.ok(picked[0].problems.includes(problem) || !SUBJECT_GUIDES[subject].strategies.some((s) => s.problems.includes(problem)), `${subject}/${problem}: ${picked[0].id}`);
    }
  assert.deepEqual(pickStrategies('Mathematics', 'very-hard', 'understand', 'weeks').map((s) => s.id).slice(0, 2), ['math-worked', 'math-errors']);
});

test('grade tips differ by grade; nerves tip points to a teacher or counsellor', () => {
  const tips = new Set(COACH_GRADES.map((g) => buildCoachPlan(req({ grade: g }), today).gradeTip));
  assert.equal(tips.size, 4);
  assert.ok(buildCoachPlan(req({ problem: 'nerves' }), today).problemTip.includes('school counsellor'));
});

test('practice prompt includes grade, topic, subject and the request', () => {
  assert.equal(
    buildPracticePrompt('11', 'Physics', 'Forces', 'remember'),
    'I am a grade 11 student studying Forces in Physics. Give me 5 quick recall questions to test my memory. Show the answers only after I try.',
  );
  assert.ok(buildPracticePrompt('9', 'Other', '', 'none').startsWith('I am a grade 9 student studying my current topic. '));
});

test('form checks: past dates, impossible dates, long topics, unknown values', () => {
  assert.deepEqual(validateCoachRequest(req({ examDate: '2026-11-04' }), today), ['That exam date has already passed. Choose a future date or leave it empty.']);
  assert.deepEqual(validateCoachRequest(req({ examDate: '2027-02-29' }), today), ['Choose a real exam date, or leave it empty.']);
  assert.equal(validateCoachRequest(req({ topic: 'x'.repeat(61) }), today).length, 1);
  assert.deepEqual(validateCoachRequest(req({ grade: '8', subject: 'Art', difficulty: 'easy', problem: 'bored' }), today).length, 4);
  assert.deepEqual(validateCoachRequest(req({ examDate: today }), today), [], 'today is allowed');
});

test('example request is complete and a week ahead', () => {
  const r = createExampleRequest(today);
  assert.deepEqual(validateCoachRequest(r, today), []);
  assert.equal(buildCoachPlan(r, today).daysLeft, 7);
});

test('Exam Calendar (read only): every calendar subject maps; past and broken exams are skipped', () => {
  for (const s of EXAM_SUBJECTS) assert.ok((COACH_SUBJECTS as readonly string[]).includes(mapCalendarSubject(s)), s);
  assert.equal(mapCalendarSubject('Algebra II'), 'Mathematics');
  assert.equal(mapCalendarSubject('English Language Arts'), 'English');
  assert.equal(mapCalendarSubject('Spanish'), 'Foreign Language');
  const raw = JSON.stringify({ version: 1, exams: [
    { id: 'a', subject: 'Biology', grade: '9', title: 'Later', date: '2026-11-20', time: '', notes: '', createdAt: 'x' },
    { id: 'b', subject: 'Geometry', grade: '11', title: 'Sooner', date: '2026-11-07', time: '', notes: 'Triangles', createdAt: 'x' },
    { id: 'c', subject: 'Biology', grade: '9', title: 'Past', date: '2026-11-01', time: '', notes: '', createdAt: 'x' },
    { id: 'd', subject: 'Biology', grade: '7', title: 'Bad grade', date: '2026-11-08', time: '', notes: '', createdAt: 'x' },
  ] });
  const exams = readUpcomingCalendarExams(raw, today);
  assert.deepEqual(exams.map((e) => e.id), ['b', 'a']);
  assert.deepEqual(requestFromExam(exams[0], req()), { grade: '11', subject: 'Mathematics', topic: 'Triangles', difficulty: 'somewhat-hard', problem: 'none', examDate: '2026-11-07' });
  assert.deepEqual(readUpcomingCalendarExams('{broken', today), []);
  assert.deepEqual(readUpcomingCalendarExams(null, today), []);
});

test('saved data check', () => {
  assert.ok(isSavedStudyCoachData({ version: 1, request: req() }));
  assert.ok(isSavedStudyCoachData({ version: 1, request: null }));
  assert.equal(isSavedStudyCoachData({ version: 2, request: null }), false);
  assert.equal(isSavedStudyCoachData({ version: 1, request: { grade: 10 } }), false);
  assert.equal(isSavedStudyCoachData('broken'), false);
});
