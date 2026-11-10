import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as F from '../browser/fixtures.cjs';
import {
  buildActivity,
  buildExamReadiness,
  buildOverview,
  buildPlannerWeek,
  buildSubjectRows,
  buildTopicResults,
  classify,
  currentStreak,
  longestRun,
  quizAverage,
  quizTimeline,
  quizTrend,
  readAllSources,
  recommendFor,
} from '../../artifacts/ai-exam-survival/src/pages/progress-tracker-model';

const today = '2026-11-05';
const real = () => readAllSources(F.realisticRaw());

test('empty student: nothing is invented', () => {
  const s = readAllSources(F.emptyRaw());
  for (const k of ['quiz', 'planner', 'flashcards', 'calendar', 'prep'] as const) assert.equal(s[k].status, 'empty');
  const o = buildOverview(s, today);
  assert.deepEqual(o, { quizzes: 0, quizCapReached: false, averageScore: null, sessionsDone: 0, sessionsPlanned: 0, cardsMastered: 0, cardsReviewed: 0, cardsTotal: 0, activeDaysLast7: 0, activeDaysLast30: 0 });
  assert.deepEqual(buildSubjectRows(s, today), []);
  assert.deepEqual(buildTopicResults(s), []);
  assert.deepEqual(buildExamReadiness(s, today), []);
  assert.equal(buildPlannerWeek(s.planner.data, today), null);
  const a = buildActivity(s, today);
  assert.equal(a.currentStreak, 0);
  assert.equal(a.bestStreak, 0);
  assert.ok(a.week.every((d) => d.total === 0));
});

test('realistic student: overview numbers', () => {
  const o = buildOverview(real(), today);
  assert.equal(o.quizzes, 9);
  assert.equal(o.averageScore, 64, 'round((70+40+50+80+60+70+40+80+90)/9)');
  assert.equal(o.sessionsDone, 4);
  assert.equal(o.sessionsPlanned, 7, 'breaks are not study sessions');
  assert.deepEqual([o.cardsMastered, o.cardsReviewed, o.cardsTotal], [3, 9, 11]);
  assert.deepEqual([o.activeDaysLast7, o.activeDaysLast30], [7, 11]);
});

test('average score matches Quiz Center exactly (rounded mean of quiz percentages)', () => {
  const attempts = F.quizHistory();
  const quizCenter = Math.round(attempts.reduce((t: number, a: { percentage: number }) => t + a.percentage, 0) / attempts.length);
  assert.equal(quizAverage(readAllSources(F.realisticRaw()).quiz.data!), quizCenter);
});

test('subject rows keep courses separate and only rate subjects with enough data', () => {
  const rows = buildSubjectRows(real(), today);
  const by = Object.fromEntries(rows.map((r) => [r.key, r]));
  assert.deepEqual(rows.map((r) => r.key), ['algebra-1', 'mathematics', 'english', 'ela', 'biology', 'chemistry', 'history', 'world-history']);
  // Mathematics group: Algebra I has Planner/Calendar data only, Mathematics has quiz data only.
  assert.equal(by['algebra-1'].group, 'Mathematics');
  assert.equal(by['algebra-1'].quiz, null);
  assert.deepEqual(by['algebra-1'].planner, { done: 1, planned: 2 });
  assert.equal(by['algebra-1'].upcomingExams, 1);
  assert.equal(by['mathematics'].group, 'Mathematics');
  assert.deepEqual({ ...by['mathematics'].quiz }, { count: 4, average: 60, correct: 24, answered: 40, accuracy: 60, trend: 'up' });
  assert.equal(by['mathematics'].classification, 'in-between', '60% is not below 60');
  assert.equal(by['mathematics'].planner, null, 'Algebra I sessions are not merged into Mathematics');
  // Biology is the same name everywhere.
  assert.deepEqual({ ...by['biology'].quiz }, { count: 3, average: 80, correct: 24, answered: 30, accuracy: 80, trend: null });
  assert.equal(by['biology'].classification, 'strong');
  assert.deepEqual(by['biology'].flashcards, { mastered: 0, reviewed: 4, total: 5 });
  assert.deepEqual(by['biology'].planner, { done: 3, planned: 3 });
  // Not enough data: 1 quiz, 5 answers.
  assert.equal(by['chemistry'].classification, 'not-enough');
  // 1 quiz but 10 answers is enough.
  assert.equal(by['history'].classification, 'needs-work');
  assert.equal(by['history'].quiz!.accuracy, 40);
  assert.equal(by['world-history'].quiz, null);
  assert.deepEqual(by['world-history'].planner, { done: 0, planned: 1 });
  assert.deepEqual(by['english'].flashcards, { mastered: 3, reviewed: 5, total: 6 });
  assert.equal(by['english'].classification, null, 'no quiz data → not rated');
  assert.deepEqual(by['ela'].planner, { done: 0, planned: 1 });
});

test('thresholds: 80 strong, below 60 needs work, minimums respected', () => {
  assert.equal(classify(80, true), 'strong');
  assert.equal(classify(79, true), 'in-between');
  assert.equal(classify(60, true), 'in-between');
  assert.equal(classify(59, true), 'needs-work');
  assert.equal(classify(100, false), 'not-enough');
});

test('topics: quiz answers per question topic and flashcard decks', () => {
  const t = buildTopicResults(real());
  const find = (topic: string) => t.find((x) => x.topic === topic)!;
  assert.deepEqual([find('Cells & Genetics').good, find('Cells & Genetics').total, find('Cells & Genetics').classification], [11, 12, 'strong']);
  assert.deepEqual([find('Evolution & Ecology').rate, find('Evolution & Ecology').classification], [56, 'needs-work']);
  assert.deepEqual([find('Human Biology').rate, find('Human Biology').classification], [89, 'strong']);
  assert.deepEqual([find('Algebra').good, find('Algebra').total, find('Algebra').classification], [10, 20, 'needs-work']);
  assert.deepEqual([find('Geometry').rate, find('Geometry').classification], [70, 'in-between']);
  assert.equal(find('Atoms & Periodic Table').classification, 'in-between', '5 answers is enough for a topic');
  assert.equal(find('Modern World').classification, 'needs-work');
  const words = find('Words for essays');
  assert.deepEqual([words.source, words.good, words.total, words.classification], ['flashcards', 3, 5, 'in-between']);
  const cells = find('Cells & organelles');
  assert.deepEqual([cells.good, cells.total, cells.classification], [0, 4, 'needs-work']);
});

test('topics with fewer than 4 answers are not classified', () => {
  const raw = F.emptyRaw();
  raw.quiz = JSON.stringify([F.attempt('x', 'Physics', '2026-11-04', [['Waves & Sound', 3, 3], ['Energy & Work', 0, 2]])]);
  const t = buildTopicResults(readAllSources(raw));
  assert.ok(t.every((x) => x.classification === 'not-enough'));
});

test('recommendations name the topic and link to the right tool', () => {
  const t = buildTopicResults(real());
  const algebra = recommendFor(t.find((x) => x.topic === 'Algebra')!);
  assert.ok(algebra[0].text.includes('Mathematics quiz on “Algebra”') && algebra[0].link.href === '/quiz-center');
  const cells = recommendFor(t.find((x) => x.topic === 'Cells & organelles')!);
  assert.ok(cells[0].text.includes('“Cell Structure” deck in Review mode') && cells[0].link.href === '/smart-flashcards');
});

test('activity: the last 7 days, by type', () => {
  const a = buildActivity(real(), today);
  const totals = Object.fromEntries(a.week.map((d) => [d.date, d.total]));
  assert.deepEqual(totals, { '2026-10-30': 1, '2026-10-31': 4, '2026-11-01': 6, '2026-11-02': 2, '2026-11-03': 3, '2026-11-04': 2, '2026-11-05': 1 });
  const nov3 = a.week.find((d) => d.date === '2026-11-03')!.counts;
  assert.deepEqual(nov3, { quiz: 1, flashcards: 0, planner: 1, prep: 1 });
});

test('streak: current 7, best 7; a future planner tick is not counted', () => {
  const a = buildActivity(real(), today);
  assert.equal(a.currentStreak, 7);
  assert.equal(a.bestStreak, 7);
  assert.ok(!a.week.some((d) => d.date > today));
});

test('streak rules: today, yesterday, gaps, month and year ends', () => {
  const set = (...d: string[]) => new Set(d);
  assert.equal(currentStreak(set('2026-11-05', '2026-11-04'), today), 2);
  assert.equal(currentStreak(set('2026-11-04', '2026-11-03'), today), 2, 'not lost before today is over');
  assert.equal(currentStreak(set('2026-11-03'), today), 0, 'a gap ends it');
  assert.equal(currentStreak(set('2026-11-01', '2026-10-31', '2026-10-30'), '2026-11-01'), 3, 'across a month end');
  assert.equal(currentStreak(set('2027-01-01', '2026-12-31'), '2027-01-01'), 2, 'across a year end');
  assert.equal(longestRun(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-05']), 3, 'Feb 2026 has 28 days');
  assert.equal(longestRun(['2028-02-28', '2028-03-01']), 1, '2028 has a 29 February');
  assert.equal(longestRun([]), 0);
});

test('planner week: planned vs done and due so far', () => {
  assert.deepEqual(buildPlannerWeek(real().planner.data, today), {
    weekStart: '2026-11-02', weekEnd: '2026-11-08', planned: 7, done: 4, dueSoFar: 4, doneOfDue: 3, minutesPlanned: 175, minutesDone: 100,
  });
});

test('quiz trend needs 4 quizzes and a 10-point change', () => {
  const at = (p: number) => ({ percentage: p } as never);
  assert.equal(quizTrend([at(50), at(60), at(70)]), null);
  assert.equal(quizTrend([at(40), at(50), at(70), at(80)]), 'up');
  assert.equal(quizTrend([at(80), at(80), at(70), at(70)]), 'down');
  assert.equal(quizTrend([at(70), at(70), at(75), at(75)]), 'steady');
  const timeline = quizTimeline(real().quiz.data!);
  assert.deepEqual(timeline.map((p) => p.percentage), [70, 40, 50, 80, 60, 70, 40, 80, 90], 'oldest first');
});

test('exam readiness: facts only, linked by identical subject names', () => {
  const facts = buildExamReadiness(real(), today);
  assert.deepEqual(facts.map((f) => f.exam.id), ['e-bio', 'e-alg', 'e-wh'], 'past exam excluded');
  const [bio, alg, wh] = facts;
  assert.equal(bio.daysLeft, 1);
  assert.deepEqual(bio.prep, { done: 2, total: 3 });
  assert.deepEqual(bio.planner, { done: 3, planned: 3 });
  assert.deepEqual(bio.latestQuiz, { percentage: 90, date: '2026-11-04' });
  assert.equal(alg.prep, null);
  assert.deepEqual(alg.planner, { done: 1, planned: 2 });
  assert.equal(alg.latestQuiz, null, 'Algebra I is not matched to Mathematics quizzes');
  assert.deepEqual(wh.planner, { done: 0, planned: 1 });
  for (const f of facts) assert.ok(!('readiness' in f) && !('percent' in f), 'no invented readiness score');
});

test('damaged data: only that source is skipped', () => {
  const raw = F.realisticRaw();
  raw.quiz = '{broken';
  raw.flashcards = JSON.stringify({ version: 1, decks: 'nope' });
  const s = readAllSources(raw);
  assert.equal(s.quiz.status, 'damaged');
  assert.equal(s.flashcards.status, 'damaged');
  assert.equal(s.planner.status, 'ok');
  const o = buildOverview(s, today);
  assert.equal(o.quizzes, 0);
  assert.equal(o.averageScore, null);
  assert.equal(o.sessionsDone, 4);
  assert.equal(buildExamReadiness(s, today).length, 3);
});

test('quiz history is read with the same rules as Quiz Center (one bad quiz = unreadable)', () => {
  const history = F.quizHistory();
  history[3].review.pop();
  const raw = F.emptyRaw();
  raw.quiz = JSON.stringify(history);
  assert.equal(readAllSources(raw).quiz.status, 'damaged');
  const tooMany = Array.from({ length: 31 }, (_, i) => F.attempt(`a${i}`, 'Physics', '2026-11-01', [['Energy & Work', 3, 5]]));
  raw.quiz = JSON.stringify(tooMany);
  assert.equal(readAllSources(raw).quiz.status, 'damaged', 'Quiz Center also rejects more than 30');
  raw.quiz = JSON.stringify(tooMany.slice(0, 30));
  const o = buildOverview(readAllSources(raw), today);
  assert.equal(o.quizzes, 30);
  assert.equal(o.quizCapReached, true);
});

test('reading never changes the saved text', () => {
  const raw = F.realisticRaw();
  const copy = JSON.stringify(raw);
  const s = readAllSources(raw);
  buildOverview(s, today);
  buildSubjectRows(s, today);
  buildTopicResults(s);
  buildActivity(s, today);
  buildExamReadiness(s, today);
  assert.equal(JSON.stringify(raw), copy);
});
