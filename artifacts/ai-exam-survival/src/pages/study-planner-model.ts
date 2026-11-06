export const STUDY_PLANNER_STORAGE_KEY = 'ai-exam-survival:study-planner:v1';

export type PlannerDifficulty = 'easy' | 'medium' | 'hard';
export type PlannerTaskKind = 'study' | 'break';

export type PlannerSubject = {
  id: string;
  name: string;
  examDate: string;
  topics: string;
  difficulty: PlannerDifficulty;
};

export type PlannerTask = {
  id: string;
  date: string;
  startTime: string;
  duration: number;
  kind: PlannerTaskKind;
  subject: string;
  activity: string;
  topic: string;
  completed: boolean;
};

export type StudyPlannerData = {
  version: 1;
  grade: string;
  dailyMinutes: number;
  subjects: PlannerSubject[];
  tasks: PlannerTask[];
  weekStart: string | null;
  generatedAt: string | null;
  inputSnapshot: string | null;
};

export const PLANNER_SUBJECT_OPTIONS = [
  'Algebra I',
  'Algebra II',
  'Biology',
  'Chemistry',
  'English Language Arts',
  'Geometry',
  'Physics',
  'Spanish',
  'World History',
  'Other',
];

const STUDY_ACTIVITIES = [
  'Topic review',
  'Practice questions',
  'Revision & recall',
  'Mixed practice',
];

const DIFFICULTY_WEIGHTS: Record<PlannerDifficulty, number> = {
  easy: 1,
  medium: 1.35,
  hard: 1.75,
};

const MINUTES_PER_STUDY_SESSION = 25;
const MINUTES_PER_BREAK = 5;
const MAX_SESSIONS_PER_DAY = 4;
const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function createInitialStudyPlannerData(): StudyPlannerData {
  return {
    version: 1,
    grade: '',
    dailyMinutes: 60,
    subjects: [],
    tasks: [],
    weekStart: null,
    generatedAt: null,
    inputSnapshot: null,
  };
}

export function createPlannerId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getTodayDateKey() {
  return toDateKey(new Date());
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToDateKey(dateKey: string, days: number) {
  const date = parseDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

export function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

export function isDateKey(dateKey: unknown): dateKey is string {
  return typeof dateKey === 'string' && parseDateKey(dateKey) !== null;
}

export function daysBetweenDateKeys(from: string, to: string) {
  const fromDate = parseDateKey(from);
  const toDate = parseDateKey(to);
  if (!fromDate || !toDate) return Number.NaN;

  const fromUtc = Date.UTC(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
  );
  const toUtc = Date.UTC(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
  return Math.round((toUtc - fromUtc) / DAY_IN_MILLISECONDS);
}

export function getWeekDateKeys(startDate: string) {
  return Array.from({ length: 7 }, (_, index) =>
    addDaysToDateKey(startDate, index),
  );
}

export function formatPlannerDate(
  dateKey: string,
  locale = 'en',
  fallbackWeekday = 'Study day',
) {
  const date = parseDateKey(dateKey);
  if (!date) return { weekday: fallbackWeekday, date: dateKey };

  return {
    weekday: new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(date),
    date: new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: 'numeric',
    }).format(date),
  };
}

export function splitTopics(topics: string) {
  return topics
    .split(/[,\n;]/)
    .map((topic) => topic.trim())
    .filter(Boolean);
}

export function createStudyInputSnapshot(data: StudyPlannerData) {
  return JSON.stringify({
    grade: data.grade,
    dailyMinutes: data.dailyMinutes,
    subjects: data.subjects.map(({ name, examDate, topics, difficulty }) => ({
      name,
      examDate,
      topics,
      difficulty,
    })),
  });
}

/**
 * A problem found in the planner details. `subject` is the saved subject name
 * (empty when the student has not chosen one yet) and `index` is its position,
 * so each language can word the message in its own way.
 */
export type PlannerIssue = {
  code:
    | 'grade'
    | 'minutes'
    | 'noSubjects'
    | 'name'
    | 'duplicate'
    | 'date'
    | 'datePast'
    | 'topics'
    | 'difficulty';
  subject: string;
  index: number;
};

export function getStudyPlannerIssues(
  data: StudyPlannerData,
  today = getTodayDateKey(),
) {
  const issues: PlannerIssue[] = [];
  const add = (code: PlannerIssue['code'], subject = '', index = -1) =>
    issues.push({ code, subject, index });

  if (!['9', '10', '11', '12'].includes(data.grade)) add('grade');

  if (
    !Number.isInteger(data.dailyMinutes) ||
    data.dailyMinutes < 30 ||
    data.dailyMinutes > 180
  ) {
    add('minutes');
  }

  if (data.subjects.length === 0) {
    add('noSubjects');
    return issues;
  }

  const subjectNames = new Set<string>();

  data.subjects.forEach((subject, index) => {
    const name = subject.name.trim();

    if (!name) {
      add('name', name, index);
    } else if (subjectNames.has(name.toLowerCase())) {
      add('duplicate', name, index);
    }
    subjectNames.add(name.toLowerCase());

    if (!isDateKey(subject.examDate)) {
      add('date', name, index);
    } else if (daysBetweenDateKeys(today, subject.examDate) < 1) {
      add('datePast', name, index);
    }

    if (splitTopics(subject.topics).length === 0) add('topics', name, index);

    if (!['easy', 'medium', 'hard'].includes(subject.difficulty)) {
      add('difficulty', name, index);
    }
  });

  return issues;
}

/** English wording of each issue (unchanged from earlier stages). */
export function describePlannerIssueInEnglish(issue: PlannerIssue) {
  const subjectLabel = issue.subject || `Subject ${issue.index + 1}`;
  switch (issue.code) {
    case 'grade':
      return 'Choose a grade level from 9 to 12.';
    case 'minutes':
      return 'Choose 30 to 180 available study minutes per day.';
    case 'noSubjects':
      return 'Add at least one subject and exam date.';
    case 'name':
      return `Choose a name for ${subjectLabel}.`;
    case 'duplicate':
      return `${subjectLabel} is listed more than once. Remove the duplicate.`;
    case 'date':
      return `Add a valid exam date for ${subjectLabel}.`;
    case 'datePast':
      return `Set the ${subjectLabel} exam date to tomorrow or later.`;
    case 'topics':
      return `Add at least one topic for ${subjectLabel}.`;
    case 'difficulty':
      return `Choose a difficulty level for ${subjectLabel}.`;
  }
}

export function validateStudyPlannerData(
  data: StudyPlannerData,
  today = getTodayDateKey(),
) {
  return getStudyPlannerIssues(data, today).map(describePlannerIssueInEnglish);
}

export function generateWeeklyStudyTasks(
  subjects: PlannerSubject[],
  dailyMinutes: number,
  weekStart: string,
): PlannerTask[] {
  const tasks: PlannerTask[] = [];
  const sessionsBySubject = new Map<string, number>();
  const sessionsPerDay = Math.max(
    1,
    Math.min(MAX_SESSIONS_PER_DAY, Math.floor(dailyMinutes / 30)),
  );

  getWeekDateKeys(weekStart).forEach((date, dayIndex) => {
    const parsedDate = parseDateKey(date);
    if (!parsedDate) return;

    const isWeekend = parsedDate.getDay() === 0 || parsedDate.getDay() === 6;
    let minutesFromMidnight = isWeekend ? 10 * 60 : 16 * 60;

    for (let sessionIndex = 0; sessionIndex < sessionsPerDay; sessionIndex += 1) {
      const candidates = subjects
        .map((subject) => {
          const daysUntilExam = daysBetweenDateKeys(date, subject.examDate);
          if (daysUntilExam <= 0 || splitTopics(subject.topics).length === 0) {
            return { subject, score: -1 };
          }

          const difficultyWeight = DIFFICULTY_WEIGHTS[subject.difficulty];
          const examUrgency = 1 + 3 / (daysUntilExam + 2);
          const distributionPenalty =
            1 + (sessionsBySubject.get(subject.id) ?? 0) * 0.32;

          return {
            subject,
            score: (difficultyWeight * examUrgency) / distributionPenalty,
          };
        })
        .filter((candidate) => candidate.score > 0)
        .sort((left, right) => right.score - left.score);

      const selected = candidates[0]?.subject;
      if (!selected) break;

      const subjectSessionCount = sessionsBySubject.get(selected.id) ?? 0;
      const topics = splitTopics(selected.topics);
      const topic = topics[subjectSessionCount % topics.length];
      const activity =
        STUDY_ACTIVITIES[subjectSessionCount % STUDY_ACTIVITIES.length];

      tasks.push({
        id: createPlannerId('study'),
        date,
        startTime: formatTime(minutesFromMidnight),
        duration: MINUTES_PER_STUDY_SESSION,
        kind: 'study',
        subject: selected.name,
        activity,
        topic,
        completed: false,
      });
      sessionsBySubject.set(selected.id, subjectSessionCount + 1);

      minutesFromMidnight += MINUTES_PER_STUDY_SESSION;
      tasks.push({
        id: createPlannerId('break'),
        date,
        startTime: formatTime(minutesFromMidnight),
        duration: MINUTES_PER_BREAK,
        kind: 'break',
        subject: 'Break',
        activity: 'Short reset',
        topic: 'Stretch, hydrate, and rest your eyes.',
        completed: false,
      });
      minutesFromMidnight += MINUTES_PER_BREAK;
    }
  });

  return tasks;
}

export function isSavedStudyPlannerData(value: unknown): value is StudyPlannerData {
  if (!isRecord(value)) return false;

  return (
    value.version === 1 &&
    typeof value.grade === 'string' &&
    Number.isInteger(value.dailyMinutes) &&
    Array.isArray(value.subjects) &&
    value.subjects.every(isPlannerSubject) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isPlannerTask) &&
    (value.weekStart === null || isDateKey(value.weekStart)) &&
    (value.generatedAt === null || typeof value.generatedAt === 'string') &&
    (value.inputSnapshot === null || typeof value.inputSnapshot === 'string')
  );
}

function isPlannerSubject(value: unknown): value is PlannerSubject {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.examDate === 'string' &&
    typeof value.topics === 'string' &&
    ['easy', 'medium', 'hard'].includes(String(value.difficulty))
  );
}

function isPlannerTask(value: unknown): value is PlannerTask {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    isDateKey(value.date) &&
    typeof value.startTime === 'string' &&
    Number.isInteger(value.duration) &&
    (value.kind === 'study' || value.kind === 'break') &&
    typeof value.subject === 'string' &&
    typeof value.activity === 'string' &&
    typeof value.topic === 'string' &&
    typeof value.completed === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatTime(minutesFromMidnight: number) {
  const hour = Math.floor(minutesFromMidnight / 60);
  const minute = minutesFromMidnight % 60;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${period}`;
}
