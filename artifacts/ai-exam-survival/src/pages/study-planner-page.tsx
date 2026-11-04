import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  NotebookPen,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Link } from 'wouter';
import {
  PLANNER_SUBJECT_OPTIONS,
  STUDY_PLANNER_STORAGE_KEY,
  addDaysToDateKey,
  createPlannerId,
  createStudyInputSnapshot,
  createInitialStudyPlannerData,
  formatPlannerDate,
  generateWeeklyStudyTasks,
  getTodayDateKey,
  getWeekDateKeys,
  isSavedStudyPlannerData,
  splitTopics,
  validateStudyPlannerData,
  type PlannerSubject,
  type PlannerTask,
  type StudyPlannerData,
} from './study-planner-model';

type PageFrameProps = {
  children: ReactNode;
  storageUnavailable: boolean;
};

type Notice = {
  type: 'success' | 'error';
  message: string;
  details?: string[];
};

type TaskEditDraft = {
  subject: string;
  activity: string;
  topic: string;
  duration: number;
};

type StorageLoadResult = {
  data: StudyPlannerData;
  message: string;
  canPersist: boolean;
};

const inputClassName =
  'mt-2 w-full rounded-[12px] border border-[#e3e6ef] bg-white px-3.5 py-3 text-[13px] text-[#293354] outline-none transition placeholder:text-[#a0a7b8] focus:border-[#7568dc] focus:ring-2 focus:ring-[#7568dc]/10';

function loadStudyPlanner(): StorageLoadResult {
  const emptyPlan = createInitialStudyPlannerData();
  if (typeof window === 'undefined') {
    return { data: emptyPlan, message: '', canPersist: false };
  }

  try {
    const saved = window.localStorage.getItem(STUDY_PLANNER_STORAGE_KEY);
    if (!saved) return { data: emptyPlan, message: '', canPersist: true };

    const parsed: unknown = JSON.parse(saved);
    if (!isSavedStudyPlannerData(parsed)) {
      return {
        data: emptyPlan,
        message:
          'Saved planner data could not be read, so it was left untouched. Browser storage is disabled until the saved data is repaired.',
        canPersist: false,
      };
    }

    return { data: parsed, message: '', canPersist: true };
  } catch {
    return {
      data: emptyPlan,
      message:
        'Saved planner data could not be read, so it was left untouched. Browser storage is disabled until the saved data is repaired.',
      canPersist: false,
    };
  }
}

function PlannerFrame({ children, storageUnavailable }: PageFrameProps) {
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f5f6fb]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2e5ef] bg-white px-4 text-[12px] font-bold text-[#35405e] transition-colors hover:border-[#c8c5eb] hover:text-[#5144c7]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[26px] bg-[#18224d] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-[#5944d2]/25" />
          <div className="relative flex max-w-[800px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-white/10 text-[#75dfe0] sm:h-14 sm:w-14">
              <NotebookPen size={22} />
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#75dfe0] sm:text-[11px]">
                A plan that leaves room to breathe
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.055em] sm:text-[44px]">
                Study Planner
              </h1>
              <p className="mt-3 max-w-[650px] text-[13px] leading-[1.75] text-[#c3cbe3] sm:text-[15px]">
                Build a realistic seven-day timetable from your exams, topics,
                and available time. This planner uses simple rules—not live AI.
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#7e879e]">
            {storageUnavailable
              ? 'Browser saving is unavailable for this planner'
              : 'Your plan and progress stay in this browser'}
          </p>
          <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">
            Rule-based planner
          </span>
        </div>

        <div className="mt-4">{children}</div>
      </main>

      <footer className="border-t border-[#e3e6ef] bg-[#f0f2f8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#7e879e]">
            AI Exam Survival · Study Planner
          </p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#5045b5] hover:text-[#31278e]"
            data-testid="link-footer-home"
          >
            <ArrowLeft size={13} /> Return to the homepage
          </Link>
        </div>
      </footer>
    </div>
  );
}

type PlannerCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
};

function PlannerCard({ eyebrow, title, children, trailing }: PlannerCardProps) {
  return (
    <section className="rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#5a4bc9]">
            {eyebrow}
          </p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.04em] text-[#20294d] sm:text-[22px]">
            {title}
          </h2>
        </div>
        {trailing}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function StudyPlannerPage() {
  const [initialLoad] = useState(loadStudyPlanner);
  const [planner, setPlanner] = useState(initialLoad.data);
  const [storageMessage, setStorageMessage] = useState(initialLoad.message);
  const canPersist = useRef(initialLoad.canPersist);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [subjectToAdd, setSubjectToAdd] = useState(PLANNER_SUBJECT_OPTIONS[0]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TaskEditDraft | null>(null);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!canPersist.current || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        STUDY_PLANNER_STORAGE_KEY,
        JSON.stringify(planner),
      );
    } catch {
      canPersist.current = false;
      setStorageMessage(
        'Your browser blocked local storage. Changes will work for this visit but will not persist after the page is closed.',
      );
    }
  }, [planner]);

  const today = getTodayDateKey();
  const earliestExamDate = addDaysToDateKey(today, 1);
  const selectedSubjectNames = new Set(
    planner.subjects.map((subject) => subject.name),
  );
  const availableSubjectNames = PLANNER_SUBJECT_OPTIONS.filter(
    (subjectName) => !selectedSubjectNames.has(subjectName),
  );
  const weekDates = planner.weekStart
    ? getWeekDateKeys(planner.weekStart)
    : [];
  const studyTasks = planner.tasks.filter((task) => task.kind === 'study');
  const completedStudyTasks = studyTasks.filter((task) => task.completed);
  const overallProgress =
    studyTasks.length === 0
      ? 0
      : Math.round((completedStudyTasks.length / studyTasks.length) * 100);
  const planInputsChanged =
    Boolean(planner.weekStart) &&
    planner.inputSnapshot !== createStudyInputSnapshot(planner);

  function updatePlanner(patch: Partial<StudyPlannerData>) {
    setPlanner((current) => ({ ...current, ...patch }));
    setNotice(null);
  }

  function updateSubject(
    subjectId: string,
    patch: Partial<Omit<PlannerSubject, 'id'>>,
  ) {
    setPlanner((current) => ({
      ...current,
      subjects: current.subjects.map((subject) =>
        subject.id === subjectId ? { ...subject, ...patch } : subject,
      ),
    }));
    setNotice(null);
  }

  function addSubject() {
    const selectedName = availableSubjectNames.includes(subjectToAdd)
      ? subjectToAdd
      : availableSubjectNames[0];

    if (!selectedName) {
      setNotice({
        type: 'error',
        message: 'All available subjects are already in your plan.',
      });
      return;
    }

    const newSubject: PlannerSubject = {
      id: createPlannerId('subject'),
      name: selectedName,
      examDate: addDaysToDateKey(today, 7),
      topics: '',
      difficulty: 'medium',
    };

    setPlanner((current) => ({
      ...current,
      subjects: [...current.subjects, newSubject],
    }));

    const nextName = availableSubjectNames.find(
      (subjectName) => subjectName !== selectedName,
    );
    if (nextName) setSubjectToAdd(nextName);
    setNotice(null);
  }

  function removeSubject(subjectId: string) {
    setPlanner((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject.id !== subjectId),
    }));
    setNotice(null);
  }

  function loadSampleInputs() {
    if (
      (planner.subjects.length > 0 || planner.tasks.length > 0) &&
      !window.confirm(
        'Replace your current subjects and weekly timetable with sample details? This cannot be undone.',
      )
    ) {
      return;
    }

    setPlanner((current) => ({
      ...current,
      grade: '10',
      dailyMinutes: 90,
      subjects: [
        {
          id: createPlannerId('subject'),
          name: 'Biology',
          examDate: addDaysToDateKey(today, 4),
          topics: 'Cell structure, Mitosis, Cell transport',
          difficulty: 'hard',
        },
        {
          id: createPlannerId('subject'),
          name: 'Algebra II',
          examDate: addDaysToDateKey(today, 8),
          topics: 'Quadratic equations, Factoring, Functions',
          difficulty: 'medium',
        },
      ],
      tasks: [],
      weekStart: null,
      generatedAt: null,
      inputSnapshot: null,
    }));
    setSubjectToAdd('Chemistry');
    setNotice({
      type: 'success',
      message: 'Sample details loaded. Review them, then generate your week.',
    });
  }

  function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationErrors = validateStudyPlannerData(planner, today);

    if (validationErrors.length > 0) {
      setNotice({
        type: 'error',
        message: 'Complete these details before generating your plan:',
        details: validationErrors,
      });
      return;
    }

    const tasks = generateWeeklyStudyTasks(
      planner.subjects,
      planner.dailyMinutes,
      today,
    );

    if (tasks.filter((task) => task.kind === 'study').length === 0) {
      setNotice({
        type: 'error',
        message:
          'No study sessions could be scheduled. Check that your exam dates are in the future and each subject has at least one topic.',
      });
      return;
    }

    setPlanner((current) => ({
      ...current,
      tasks,
      weekStart: today,
      generatedAt: new Date().toISOString(),
      inputSnapshot: createStudyInputSnapshot(current),
    }));
    setNotice({
      type: 'success',
      message:
        'Your seven-day plan is ready. Closer exams and harder subjects receive more focus, with short breaks built in.',
    });
  }

  function toggleTask(taskId: string) {
    setPlanner((current) => ({
      ...current,
      tasks: current.tasks.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task,
      ),
    }));
  }

  function beginTaskEdit(task: PlannerTask) {
    setEditingTaskId(task.id);
    setEditDraft({
      subject: task.subject,
      activity: task.activity,
      topic: task.topic,
      duration: task.duration,
    });
    setEditError('');
  }

  function cancelTaskEdit() {
    setEditingTaskId(null);
    setEditDraft(null);
    setEditError('');
  }

  function saveTaskEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTaskId || !editDraft) return;

    const task = planner.tasks.find((item) => item.id === editingTaskId);
    if (!task) return;

    if (
      !editDraft.subject.trim() ||
      !editDraft.activity.trim() ||
      !editDraft.topic.trim()
    ) {
      setEditError('Add a subject, activity, and task note before saving.');
      return;
    }

    if (
      !Number.isInteger(editDraft.duration) ||
      editDraft.duration < 5 ||
      editDraft.duration > 60
    ) {
      setEditError('Task duration must be between 5 and 60 minutes.');
      return;
    }

    const minutesAlreadyScheduled = planner.tasks
      .filter((item) => item.date === task.date)
      .reduce((total, item) => total + item.duration, 0);
    const minutesAfterEdit =
      minutesAlreadyScheduled - task.duration + editDraft.duration;

    if (minutesAfterEdit > planner.dailyMinutes) {
      setEditError(
        `This would exceed your ${planner.dailyMinutes}-minute daily limit. Shorten the task first.`,
      );
      return;
    }

    setPlanner((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              subject: editDraft.subject.trim(),
              activity: editDraft.activity.trim(),
              topic: editDraft.topic.trim(),
              duration: editDraft.duration,
            }
          : item,
      ),
    }));
    setEditingTaskId(null);
    setEditDraft(null);
    setEditError('');
    setNotice({ type: 'success', message: 'Task updated and saved.' });
  }

  function deleteTask(taskId: string) {
    setPlanner((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }));
    if (editingTaskId === taskId) cancelTaskEdit();
    setNotice({ type: 'success', message: 'Task removed from your timetable.' });
  }

  return (
    <PlannerFrame storageUnavailable={Boolean(storageMessage)}>
      <div className="space-y-5 sm:space-y-6">
        <PlannerCard
          eyebrow="Start with your week"
          title="Your study details"
          trailing={
            <button
              type="button"
              onClick={loadSampleInputs}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#dcd9f3] bg-[#f6f5ff] px-3.5 text-[11px] font-bold text-[#5144c7] transition-colors hover:bg-[#eeecff]"
              data-testid="button-load-sample"
            >
              <Sparkles size={14} /> Use sample details
            </button>
          }
        >
          {storageMessage && (
            <div
              role="alert"
              className="mb-4 rounded-[13px] border border-[#f0d8b8] bg-[#fff9f0] px-4 py-3 text-[12px] leading-relaxed text-[#765221]"
              data-testid="message-storage"
            >
              {storageMessage}
            </div>
          )}

          {notice && (
            <div
              role={notice.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`mb-4 rounded-[13px] border px-4 py-3 text-[12px] leading-relaxed ${
                notice.type === 'error'
                  ? 'border-[#f0d1d1] bg-[#fff5f5] text-[#914949]'
                  : 'border-[#cfe9df] bg-[#f1faf6] text-[#2b765b]'
              }`}
              data-testid={`message-${notice.type}`}
            >
              <p className="font-bold">{notice.message}</p>
              {notice.details && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {notice.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <form
            onSubmit={generatePlan}
            noValidate
            data-testid="form-study-planner"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-[11px] font-bold text-[#35405e]">
                Grade level
                <select
                  value={planner.grade}
                  onChange={(event) =>
                    updatePlanner({ grade: event.currentTarget.value })
                  }
                  className={inputClassName}
                  data-testid="select-grade"
                >
                  <option value="">Choose your grade</option>
                  {['9', '10', '11', '12'].map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[11px] font-bold text-[#35405e]">
                Available study time per day
                <select
                  value={planner.dailyMinutes}
                  onChange={(event) =>
                    updatePlanner({
                      dailyMinutes: Number(event.currentTarget.value),
                    })
                  }
                  className={inputClassName}
                  data-testid="select-daily-time"
                >
                  {[30, 45, 60, 75, 90, 120, 150, 180].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} minutes
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 border-t border-[#eceef4] pt-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold text-[#293354]">
                    Subjects, exams, and topics
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#7e879e]">
                    Add each subject, its exam date, topics, and how challenging
                    it feels.
                  </p>
                </div>
                <span className="rounded-full bg-[#f2f4f9] px-3 py-1.5 text-[10px] font-bold text-[#626b85]">
                  {planner.subjects.length} subject
                  {planner.subjects.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label className="min-w-0 flex-1 text-[11px] font-bold text-[#35405e]">
                  Choose a subject
                  <select
                    value={
                      availableSubjectNames.includes(subjectToAdd)
                        ? subjectToAdd
                        : availableSubjectNames[0] ?? ''
                    }
                    onChange={(event) =>
                      setSubjectToAdd(event.currentTarget.value)
                    }
                    disabled={availableSubjectNames.length === 0}
                    className={inputClassName}
                    data-testid="select-subject-to-add"
                  >
                    {availableSubjectNames.length === 0 ? (
                      <option value="">All subjects added</option>
                    ) : (
                      availableSubjectNames.map((subjectName) => (
                        <option key={subjectName} value={subjectName}>
                          {subjectName}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={addSubject}
                  disabled={availableSubjectNames.length === 0}
                  className="mt-2 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#5144c7] px-4 text-[11px] font-extrabold text-white transition-colors hover:bg-[#4136ac] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-[22px]"
                  data-testid="button-add-subject"
                >
                  <Plus size={15} /> Add subject
                </button>
              </div>

              {planner.subjects.length === 0 ? (
                <div className="mt-4 rounded-[15px] border border-dashed border-[#dcdfea] bg-[#fafbfe] px-4 py-6 text-center">
                  <p className="text-[12px] font-bold text-[#47516c]">
                    Add your first subject to get started.
                  </p>
                  <p className="mt-1 text-[11px] text-[#8790a4]">
                    You can add more than one subject to balance your week.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {planner.subjects.map((subject, index) => (
                    <section
                      key={subject.id}
                      className="rounded-[16px] border border-[#e8eaf2] bg-[#fbfcfe] p-4"
                      data-testid={`subject-card-${index}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-[9px] bg-[#eeebff] text-[10px] font-extrabold text-[#5144c7]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-[12px] font-extrabold text-[#293354]">
                            {subject.name}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8991a5] transition-colors hover:bg-[#fff0f0] hover:text-[#b24c4c]"
                          aria-label={`Remove ${subject.name}`}
                          data-testid={`button-remove-subject-${index}`}
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-[10px] font-bold text-[#626b85]">
                          Exam date
                          <input
                            type="date"
                            min={earliestExamDate}
                            value={subject.examDate}
                            onChange={(event) =>
                              updateSubject(subject.id, {
                                examDate: event.currentTarget.value,
                              })
                            }
                            className={inputClassName}
                            data-testid={`input-exam-date-${index}`}
                          />
                        </label>

                        <label className="block text-[10px] font-bold text-[#626b85]">
                          Difficulty
                          <select
                            value={subject.difficulty}
                            onChange={(event) =>
                              updateSubject(subject.id, {
                                difficulty: event.currentTarget
                                  .value as PlannerSubject['difficulty'],
                              })
                            }
                            className={inputClassName}
                            data-testid={`select-difficulty-${index}`}
                          >
                            <option value="easy">Easy · light review</option>
                            <option value="medium">Medium · some practice</option>
                            <option value="hard">Hard · needs extra focus</option>
                          </select>
                        </label>
                      </div>

                      <label className="mt-3 block text-[10px] font-bold text-[#626b85]">
                        Topics to study
                        <textarea
                          rows={2}
                          value={subject.topics}
                          onChange={(event) =>
                            updateSubject(subject.id, {
                              topics: event.currentTarget.value,
                            })
                          }
                          placeholder="Separate topics with commas"
                          className={`${inputClassName} resize-y`}
                          data-testid={`textarea-topics-${index}`}
                        />
                      </label>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-[#eceef4] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[520px] text-[10px] leading-relaxed text-[#8790a4]">
                The timetable uses 25-minute focus sessions and 5-minute
                breaks, with a maximum of four sessions each day.
              </p>
              <button
                type="submit"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#5144c7] px-5 text-[11px] font-extrabold text-white shadow-[0_8px_18px_rgba(81,68,199,.18)] transition-colors hover:bg-[#4136ac]"
                data-testid="button-generate-plan"
              >
                <Sparkles size={15} /> Generate my week
              </button>
            </div>
          </form>
        </PlannerCard>

        {planInputsChanged && (
          <div
            role="status"
            className="rounded-[14px] border border-[#e8d9ae] bg-[#fffaf0] px-4 py-3 text-[11px] leading-relaxed text-[#765b26]"
            data-testid="message-plan-outdated"
          >
            Your study details have changed since this timetable was generated.
            Generate your week again to update the schedule.
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[17px] border border-[#e5e7f0] bg-white px-4 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#8790a4]">
              Grade
            </p>
            <p className="mt-2 text-[15px] font-extrabold text-[#293354]">
              {planner.grade ? `Grade ${planner.grade}` : 'Not selected'}
            </p>
          </div>
          <div className="rounded-[17px] border border-[#e5e7f0] bg-white px-4 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#8790a4]">
              Subjects
            </p>
            <p className="mt-2 text-[15px] font-extrabold text-[#293354]">
              {planner.subjects.length} added
            </p>
          </div>
          <div className="rounded-[17px] border border-[#e5e7f0] bg-white px-4 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#8790a4]">
              Weekly progress
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[15px] font-extrabold text-[#293354]">
                {completedStudyTasks.length} of {studyTasks.length} sessions
              </p>
              <span className="text-[13px] font-extrabold text-[#5144c7]">
                {overallProgress}%
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e8f4]"
              role="progressbar"
              aria-label="Weekly study plan completion"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallProgress}
            >
              <div
                className="h-full rounded-full bg-[#5144c7] transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        <PlannerCard
          eyebrow={
            planner.weekStart
              ? `Starting ${formatPlannerDate(planner.weekStart).date}`
              : 'Your next seven days'
          }
          title="Weekly timetable"
          trailing={
            planner.generatedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f7f5] px-3 py-1.5 text-[10px] font-bold text-[#278c8e]">
                <CheckCircle2 size={13} /> Saved on this device
              </span>
            ) : (
              <span className="rounded-full bg-[#f2f4f9] px-3 py-1.5 text-[10px] font-bold text-[#626b85]">
                Ready when you are
              </span>
            )
          }
        >
          {!planner.weekStart ? (
            <div
              className="rounded-[16px] border border-dashed border-[#dcdfea] bg-[#fafbfe] px-4 py-8 text-center"
              data-testid="empty-timetable"
            >
              <CalendarDays size={22} className="mx-auto text-[#776bd4]" />
              <p className="mt-3 text-[12px] font-bold text-[#47516c]">
                Your weekly calendar will appear here.
              </p>
              <p className="mt-1 text-[11px] text-[#8790a4]">
                Add your subjects and generate a plan to see daily goals,
                focused sessions, and breaks.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[#75809a]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#5a4bd0]" /> Study
                  session
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#20a6ad]" /> Short
                  break
                </span>
                {planner.generatedAt && (
                  <span className="inline-flex items-center gap-1.5 sm:ml-auto">
                    <Clock3 size={12} />
                    Updated{' '}
                    {new Date(planner.generatedAt).toLocaleDateString('en', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
              </div>

              <div
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7"
                data-testid="weekly-timetable"
              >
                {weekDates.map((date) => {
                  const dateInfo = formatPlannerDate(date);
                  const dayTasks = planner.tasks.filter(
                    (task) => task.date === date,
                  );
                  const dayStudyTasks = dayTasks.filter(
                    (task) => task.kind === 'study',
                  );
                  const dayCompletedMinutes = dayStudyTasks
                    .filter((task) => task.completed)
                    .reduce((total, task) => total + task.duration, 0);
                  const dayGoalMinutes = dayStudyTasks.reduce(
                    (total, task) => total + task.duration,
                    0,
                  );
                  const dayProgress =
                    dayGoalMinutes === 0
                      ? 0
                      : Math.round(
                          (dayCompletedMinutes / dayGoalMinutes) * 100,
                        );

                  return (
                    <section
                      key={date}
                      className="min-w-0 rounded-[17px] border border-[#e7e9f1] bg-[#fbfcfe] p-3.5"
                      data-testid={`day-${date}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-extrabold uppercase tracking-[.09em] text-[#5144c7]">
                            {dateInfo.weekday}
                          </p>
                          <p className="mt-1 text-[14px] font-extrabold text-[#293354]">
                            {dateInfo.date}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#f0f1f8] px-2 py-1 text-[9px] font-bold text-[#748099]">
                          {dayTasks.length
                            ? `${dayTasks.length} blocks`
                            : 'Open'}
                        </span>
                      </div>

                      <div className="mt-3 rounded-[11px] bg-white px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8790a4]">
                            Daily study goal
                          </span>
                          <span className="text-[10px] font-extrabold text-[#35405e]">
                            {dayGoalMinutes > 0
                              ? `${dayCompletedMinutes}/${dayGoalMinutes} min`
                              : 'Rest day'}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8e8f4]"
                          role="progressbar"
                          aria-label={`${dateInfo.weekday} study goal`}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={dayProgress}
                        >
                          <div
                            className="h-full rounded-full bg-[#20a6ad] transition-all"
                            style={{ width: `${dayProgress}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-[9px] text-[#9199ab]">
                          {dayGoalMinutes > 0
                            ? `Up to ${planner.dailyMinutes} min available`
                            : 'No study sessions planned'}
                        </p>
                      </div>

                      {dayTasks.length === 0 ? (
                        <p className="mt-3 rounded-[11px] border border-dashed border-[#e1e4ed] px-3 py-4 text-center text-[10px] leading-relaxed text-[#8790a4]">
                          No sessions scheduled. Rest or focus on another
                          priority.
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {dayTasks.map((task) => {
                            const isEditing = editingTaskId === task.id;

                            return (
                              <article
                                key={task.id}
                                className={`rounded-[12px] border p-2.5 ${
                                  task.completed
                                    ? 'border-[#d8eee9] bg-[#f5fbf9]'
                                    : task.kind === 'break'
                                      ? 'border-[#d8efef] bg-[#f2fbfb]'
                                      : 'border-[#eceef4] bg-white'
                                }`}
                                data-testid={`task-${task.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-start gap-2">
                                    <span
                                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                        task.kind === 'break'
                                          ? 'bg-[#20a6ad]'
                                          : 'bg-[#5a4bd0]'
                                      }`}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-bold text-[#8790a4]">
                                        {task.startTime} · {task.duration} min
                                      </p>
                                      <p
                                        className={`mt-1 break-words text-[10px] font-extrabold ${
                                          task.completed
                                            ? 'text-[#6b887e] line-through'
                                            : 'text-[#293354]'
                                        }`}
                                      >
                                        {task.kind === 'break'
                                          ? 'Short break'
                                          : task.subject}
                                      </p>
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id)}
                                    aria-label={`Mark ${task.activity} as ${
                                      task.completed ? 'not completed' : 'completed'
                                    }`}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#5144c7]"
                                    data-testid={`checkbox-task-${task.id}`}
                                  />
                                </div>

                                {isEditing && editDraft ? (
                                  <form
                                    onSubmit={saveTaskEdit}
                                    className="mt-3 space-y-2 border-t border-[#e9ebf2] pt-3"
                                    data-testid={`form-edit-task-${task.id}`}
                                  >
                                    <label className="block text-[9px] font-bold text-[#626b85]">
                                      Subject or label
                                      <input
                                        value={editDraft.subject}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            subject: event.currentTarget.value,
                                          })
                                        }
                                        className="mt-1 w-full rounded-[8px] border border-[#e3e6ef] px-2 py-2 text-[10px] text-[#293354] outline-none focus:border-[#7568dc]"
                                        data-testid="input-edit-subject"
                                      />
                                    </label>
                                    <label className="block text-[9px] font-bold text-[#626b85]">
                                      Activity
                                      <input
                                        value={editDraft.activity}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            activity: event.currentTarget.value,
                                          })
                                        }
                                        className="mt-1 w-full rounded-[8px] border border-[#e3e6ef] px-2 py-2 text-[10px] text-[#293354] outline-none focus:border-[#7568dc]"
                                        data-testid="input-edit-activity"
                                      />
                                    </label>
                                    <label className="block text-[9px] font-bold text-[#626b85]">
                                      Topic or note
                                      <input
                                        value={editDraft.topic}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            topic: event.currentTarget.value,
                                          })
                                        }
                                        className="mt-1 w-full rounded-[8px] border border-[#e3e6ef] px-2 py-2 text-[10px] text-[#293354] outline-none focus:border-[#7568dc]"
                                        data-testid="input-edit-topic"
                                      />
                                    </label>
                                    <label className="block text-[9px] font-bold text-[#626b85]">
                                      Duration in minutes
                                      <input
                                        type="number"
                                        min={5}
                                        max={60}
                                        value={editDraft.duration}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            duration: Number(
                                              event.currentTarget.value,
                                            ),
                                          })
                                        }
                                        className="mt-1 w-full rounded-[8px] border border-[#e3e6ef] px-2 py-2 text-[10px] text-[#293354] outline-none focus:border-[#7568dc]"
                                        data-testid="input-edit-duration"
                                      />
                                    </label>
                                    {editError && (
                                      <p
                                        role="alert"
                                        className="text-[9px] leading-relaxed text-[#a34646]"
                                      >
                                        {editError}
                                      </p>
                                    )}
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        type="submit"
                                        className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-full bg-[#5144c7] px-2 text-[9px] font-bold text-white hover:bg-[#4136ac]"
                                        data-testid="button-save-task"
                                      >
                                        <Check size={12} /> Save
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelTaskEdit}
                                        className="inline-flex min-h-8 items-center justify-center rounded-full border border-[#e1e4ed] px-3 text-[9px] font-bold text-[#626b85] hover:bg-white"
                                        data-testid="button-cancel-task-edit"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    <p
                                      className={`mt-2 break-words text-[9px] leading-relaxed ${
                                        task.completed
                                          ? 'text-[#80958d]'
                                          : 'text-[#75809a]'
                                      }`}
                                    >
                                      {task.kind === 'study' &&
                                        `${task.activity} · `}
                                      {task.topic}
                                    </p>
                                    <div className="mt-2 flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => beginTaskEdit(task)}
                                        className="inline-flex min-h-7 items-center gap-1 rounded-full px-2 text-[9px] font-bold text-[#5144c7] transition-colors hover:bg-[#f0efff]"
                                        aria-label={`Edit ${task.activity}`}
                                        data-testid={`button-edit-task-${task.id}`}
                                      >
                                        <Pencil size={11} /> Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteTask(task.id)}
                                        className="inline-flex min-h-7 items-center gap-1 rounded-full px-2 text-[9px] font-bold text-[#9c5555] transition-colors hover:bg-[#fff0f0]"
                                        aria-label={`Delete ${task.activity}`}
                                        data-testid={`button-delete-task-${task.id}`}
                                      >
                                        <Trash2 size={11} /> Delete
                                      </button>
                                    </div>
                                  </>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            </>
          )}
        </PlannerCard>

        <div className="rounded-[19px] bg-[#e8f7f5] p-5 sm:flex sm:items-start sm:gap-3">
          <Sparkles size={18} className="shrink-0 text-[#168991]" />
          <div>
            <p className="text-[12px] font-extrabold text-[#28787d]">
              A steady plan leaves room to breathe
            </p>
            <p className="mt-1.5 text-[11px] leading-[1.7] text-[#56767b]">
              Exams coming sooner and subjects marked hard receive more
              sessions. Topics rotate through review, practice, and recall.
              Your plan is stored only in this browser; it is not sent to a
              server.
            </p>
          </div>
        </div>

        {planner.generatedAt && (
          <p
            className="flex items-center justify-center gap-1.5 text-center text-[10px] text-[#8790a4]"
            data-testid="text-local-save-status"
          >
            <CheckCircle2 size={12} className="text-[#278c8e]" />
            Plan and task progress save automatically in this browser.
          </p>
        )}
      </div>
    </PlannerFrame>
  );
}
