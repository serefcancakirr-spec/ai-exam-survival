// Test data for Stage 7: a realistic student on 5 November 2026 (Istanbul time).
// Every object matches the exact shape each tool saves, so the tools' own checks accept it.

const KEYS = {
  quiz: 'ai-exam-survival:quiz-center:v1',
  planner: 'ai-exam-survival:study-planner:v1',
  flashcards: 'ai-exam-survival:flashcards:v1',
  calendar: 'ai-exam-survival:exam-calendar:v1',
  prep: 'ai-exam-survival:exam-prep:v1',
};

let qn = 0;
function attempt(id, subject, date, parts, grade = '9') {
  // parts: [[topic, correct, total], ...]
  const review = [];
  parts.forEach(([topic, correct, total]) => {
    for (let i = 0; i < total; i += 1) {
      qn += 1;
      review.push({
        question: {
          id: `q-${qn}`, grade, subject, topic, difficulty: 'easy', prompt: `Question ${qn}`, explanation: 'Because.',
          correctOptionId: 'A', options: ['A', 'B', 'C', 'D'].map((o) => ({ id: o, text: `Option ${o}` })),
        },
        selectedOptionId: i < correct ? 'A' : 'B',
      });
    }
  });
  const score = review.filter((r) => r.selectedOptionId === 'A').length;
  return {
    id, grade, subject, topic: '__all_topics__', difficulty: 'easy', questionCount: review.length, score,
    percentage: Math.round((score / review.length) * 100), completedAt: `${date}T14:00:00+03:00`, review,
  };
}

function quizHistory() {
  qn = 0;
  const list = [
    attempt('q1', 'Biology', '2026-10-20', [['Cells & Genetics', 4, 4], ['Evolution & Ecology', 1, 3], ['Human Biology', 2, 3]]), // 70
    attempt('q2', 'Mathematics', '2026-10-22', [['Algebra', 1, 5], ['Geometry', 3, 5]]), // 40
    attempt('q3', 'Mathematics', '2026-10-26', [['Algebra', 2, 5], ['Geometry', 3, 5]]), // 50
    attempt('q4', 'Biology', '2026-10-28', [['Cells & Genetics', 3, 4], ['Evolution & Ecology', 2, 3], ['Human Biology', 3, 3]]), // 80
    attempt('q5', 'Chemistry', '2026-10-30', [['Atoms & Periodic Table', 3, 5]]), // 60
    attempt('q6', 'Mathematics', '2026-11-01', [['Algebra', 3, 5], ['Geometry', 4, 5]]), // 70
    attempt('q7', 'History', '2026-11-02', [['Modern World', 4, 10]]), // 40
    attempt('q8', 'Mathematics', '2026-11-03', [['Algebra', 4, 5], ['Geometry', 4, 5]]), // 80
    attempt('q9', 'Biology', '2026-11-04', [['Cells & Genetics', 4, 4], ['Evolution & Ecology', 2, 3], ['Human Biology', 3, 3]]), // 90
  ];
  return list.reverse(); // Quiz Center saves newest first
}

const task = (id, date, subject, completed, kind = 'study') => ({
  id, date, startTime: '4:00 PM', duration: kind === 'study' ? 25 : 5, kind, subject: kind === 'study' ? subject : 'Break', activity: 'Topic review', topic: 'Review', completed,
});

function planner() {
  return {
    version: 1, grade: '9', dailyMinutes: 60, subjects: [], weekStart: '2026-11-02', generatedAt: '2026-11-02T08:00:00.000Z', inputSnapshot: '{}',
    tasks: [
      task('t1', '2026-11-02', 'Biology', true),
      task('b1', '2026-11-02', '', true, 'break'),
      task('t2', '2026-11-03', 'Biology', true),
      task('t3', '2026-11-04', 'Algebra I', true),
      task('t4', '2026-11-05', 'Algebra I', false),
      task('t5', '2026-11-06', 'Biology', true), // ticked early: counted as done, but not as activity (future date)
      task('t6', '2026-11-07', 'World History', false),
      task('t7', '2026-11-08', 'English Language Arts', false),
    ],
  };
}

function flashcards() {
  const card = (id, deckId) => ({ id, deckId, front: `Front ${id}`, answer: `Answer ${id}`, explanation: '' });
  const p = (box, when) => ({ box, knownCount: box === 1 ? 0 : box - 1, againCount: box === 1 ? 1 : 0, lastResult: box === 1 ? 'again' : 'know', lastReviewedAt: when });
  return {
    version: 1,
    decks: [
      { id: 'deck-en', name: 'Academic Vocabulary', grade: '9', subject: 'English', topic: 'Words for essays', starter: true, createdAt: '2026-10-01T00:00:00.000Z' },
      { id: 'deck-bio', name: 'Cell Structure', grade: '9', subject: 'Biology', topic: 'Cells & organelles', starter: true, createdAt: '2026-10-01T00:00:00.000Z' },
    ],
    cards: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'].map((id) => card(id, 'deck-en')).concat(['b1', 'b2', 'b3', 'b4', 'b5'].map((id) => card(id, 'deck-bio'))),
    progress: {
      e1: p(3, '2026-11-01T12:00:00+03:00'), e2: p(3, '2026-11-01T12:00:00+03:00'), e3: p(3, '2026-11-01T12:00:00+03:00'),
      e4: p(1, '2026-11-01T12:00:00+03:00'), e5: p(1, '2026-11-01T12:00:00+03:00'),
      b1: p(1, '2026-10-31T18:00:00+03:00'), b2: p(1, '2026-10-31T18:00:00+03:00'), b3: p(1, '2026-10-31T18:00:00+03:00'), b4: p(1, '2026-10-31T18:00:00+03:00'),
    },
    selectedDeckId: 'deck-en',
  };
}

const exam = (id, subject, title, date, grade = '9') => ({ id, subject, grade, title, date, time: '', notes: '', createdAt: '2026-10-01T00:00:00.000Z' });
function calendar() {
  return { version: 1, exams: [exam('e-bio', 'Biology', 'Cell quiz', '2026-11-06'), exam('e-alg', 'Algebra I', 'Equations test', '2026-11-10'), exam('e-wh', 'World History', 'WWI essay', '2026-11-17', '10'), exam('e-old', 'Chemistry', 'Old test', '2026-10-30')] };
}
function prep() {
  const step = (id, examId, done, completedAt) => ({ id, examId, text: `Step ${id}`, dueDate: '', done, source: 'own', createdAt: '2026-11-01T10:00:00.000Z', completedAt });
  return { version: 1, steps: [step('s1', 'e-bio', true, '2026-11-03T15:00:00+03:00'), step('s2', 'e-bio', true, '2026-11-05T09:00:00+03:00'), step('s3', 'e-bio', false, null)] };
}

function realisticRaw() {
  return {
    quiz: JSON.stringify(quizHistory()),
    planner: JSON.stringify(planner()),
    flashcards: JSON.stringify(flashcards()),
    calendar: JSON.stringify(calendar()),
    prep: JSON.stringify(prep()),
  };
}
const emptyRaw = () => ({ quiz: null, planner: null, flashcards: null, calendar: null, prep: null });

module.exports = { KEYS, attempt, quizHistory, planner, flashcards, calendar, prep, realisticRaw, emptyRaw };
