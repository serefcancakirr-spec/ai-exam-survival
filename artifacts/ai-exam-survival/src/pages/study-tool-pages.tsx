// Each tool's page lives in its own file; this file only connects the routes in App.tsx to them.
import FunctionalAiStudyCoachPage from './ai-study-coach-page';
import FunctionalExamCalendarPage from './exam-calendar-page';
import FunctionalProgressTrackerPage from './progress-tracker-page';
import FunctionalQuizCenterPage from './quiz-center-page';
import FunctionalSmartFlashcardsPage from './smart-flashcards-page';
import FunctionalStudyPlannerPage from './study-planner-page';

export function StudyPlannerPage() {
  return <FunctionalStudyPlannerPage />;
}

export function QuizCenterPage() {
  return <FunctionalQuizCenterPage />;
}

export function SmartFlashcardsPage() {
  return <FunctionalSmartFlashcardsPage />;
}

export function AiStudyCoachPage() {
  return <FunctionalAiStudyCoachPage />;
}

export function ProgressTrackerPage() {
  return <FunctionalProgressTrackerPage />;
}

export function ExamCalendarPage() {
  return <FunctionalExamCalendarPage />;
}
