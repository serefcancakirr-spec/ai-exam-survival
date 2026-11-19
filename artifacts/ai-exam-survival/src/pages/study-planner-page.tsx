import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
 
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
import { FooterAboutLink } from './about-page';
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
  getStudyPlannerIssues,
  type PlannerIssue,
  type PlannerSubject,
  type PlannerTask,
  type StudyPlannerData,
} from './study-planner-model';
import { Menti } from '@/components/menti';
import { weekComplete } from '@/components/menti-moods';
import { FocusTimerCard } from './focus-timer';
import { useI18n } from '@/i18n/i18n';
import type { MessageKey } from '@/i18n/translations-en';

type PageFrameProps = {
  children: ReactNode;
  storageUnavailable: boolean;
};

type Message = {
  key: MessageKey;
  vars?: Record<string, string | number>;
};

type Notice = Message & {
  type: 'success' | 'error';
  details?: PlannerIssue[];
};

type TaskEditDraft = {
  subject: string;
  activity: string;
  topic: string;
  duration: number;
};

type StorageLoadResult = {
  data: StudyPlannerData;
  message: MessageKey | '';
  canPersist: boolean;
};

const inputClassName =
  'mt-2 w-full rounded-[12px] border border-[#dee8e5] bg-[#ffffff] px-3.5 py-3 text-[13px] text-[#235355] outline-none transition placeholder:text-[#a6b3b9] focus:border-[#37aea6] focus:ring-2 focus:ring-[#37aea6]/10';

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
        message: 'planner.storageUnreadable',
        canPersist: false,
      };
    }

    return { data: parsed, message: '', canPersist: true };
  } catch {
    return {
      data: emptyPlan,
      message: 'planner.storageUnreadable',
      canPersist: false,
    };
  }
}

function PlannerFrame({ children, storageUnavailable }: PageFrameProps) {
  const { t } = useI18n();
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f2f9f7]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[#dee8e5] bg-[#ffffff] px-4 text-[12px] font-bold text-[#20605c] transition-colors hover:border-[#a6e1de] hover:text-[#26726d]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {t('common.backHome')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[16px] border border-[#dee8e5] border-l-[6px] border-l-[#2a7f7a] bg-[#f4f9f8] px-6 py-8 text-[#1a3e3f] sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative flex max-w-[800px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[#d6f3f0] text-[#26716c] sm:h-14 sm:w-14">
              <NotebookPen size={22} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#9b5227]">
                {t('planner.heroEyebrow')}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">
                {t('planner.title')}
              </h1>
              <p className="mt-3 max-w-[650px] text-[13px] leading-[1.75] text-[#4d5b61] sm:text-[15px]">
                {t('planner.heroText')}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#596a72]">
            {storageUnavailable
              ? t('planner.savingUnavailable')
              : t('planner.savingLocal')}
          </p>
          <span className="rounded-full bg-[#daf5f2] px-3 py-1.5 text-[10px] font-bold text-[#26716c]">
            {t('planner.ruleBased')}
          </span>
        </div>

        <div className="mt-4">{children}</div>
      </main>

      <footer className="border-t border-[#dbece9] bg-[#eff7f5]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#596a72]">
            {t('planner.footer')}<FooterAboutLink />
          </p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#26726d] hover:text-[#20605c]"
            data-testid="link-footer-home"
          >
            <ArrowLeft size={13} /> {t('common.returnHome')}
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
    <section className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-[#26716c]">
            {eyebrow}
          </p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.015em] text-[#1f4b4c] sm:text-[22px]">
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
  const { t, tn, locale, subject: subjectLabel, plannerWord, clock } = useI18n();
  const [initialLoad] = useState(loadStudyPlanner);
  const [planner, setPlanner] = useState(initialLoad.data);
  const [storageMessage, setStorageMessage] = useState(initialLoad.message);
  const canPersist = useRef(initialLoad.canPersist);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [subjectToAdd, setSubjectToAdd] = useState(PLANNER_SUBJECT_OPTIONS[0]);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<TaskEditDraft | null>(null);
  const [editError, setEditError] = useState<Message | null>(null);

  useEffect(() => {
    if (!canPersist.current || typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(
        STUDY_PLANNER_STORAGE_KEY,
        JSON.stringify(planner),
      );
    } catch {
      canPersist.current = false;
      setStorageMessage('planner.storageBlocked');
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
        key: 'planner.allSubjectsInPlan',
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
      !window.confirm(t('planner.confirmSample'))
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
          topics: t('planner.sampleTopicsBio'),
          difficulty: 'hard',
        },
        {
          id: createPlannerId('subject'),
          name: 'Mathematics',
          examDate: addDaysToDateKey(today, 8),
          topics: t('planner.sampleTopicsAlg'),
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
      key: 'planner.sampleLoaded',
    });
  }

  function generatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationIssues = getStudyPlannerIssues(planner, today);

    if (validationIssues.length > 0) {
      setNotice({
        type: 'error',
        key: 'planner.completeDetails',
        details: validationIssues,
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
        key: 'planner.noSessions',
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
      key: 'planner.planReady',
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

  // What the student sees for a task. Saved values stay as they are; only the display is translated.
  function shownTask(task: PlannerTask) {
    return {
      subject: subjectLabel(task.subject),
      activity: plannerWord(task.activity),
      topic: task.kind === 'break' ? plannerWord(task.topic) : task.topic,
    };
  }

  function beginTaskEdit(task: PlannerTask) {
    const shown = shownTask(task);
    setEditingTaskId(task.id);
    setEditDraft({
      subject: shown.subject,
      activity: shown.activity,
      topic: shown.topic,
      duration: task.duration,
    });
    setEditError(null);
  }

  function cancelTaskEdit() {
    setEditingTaskId(null);
    setEditDraft(null);
    setEditError(null);
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
      setEditError({ key: 'planner.editMissing' });
      return;
    }

    if (
      !Number.isInteger(editDraft.duration) ||
      editDraft.duration < 5 ||
      editDraft.duration > 60
    ) {
      setEditError({ key: 'planner.editDuration' });
      return;
    }

    const minutesAlreadyScheduled = planner.tasks
      .filter((item) => item.date === task.date)
      .reduce((total, item) => total + item.duration, 0);
    const minutesAfterEdit =
      minutesAlreadyScheduled - task.duration + editDraft.duration;

    if (minutesAfterEdit > planner.dailyMinutes) {
      setEditError({
        key: 'planner.editLimit',
        vars: { minutes: planner.dailyMinutes },
      });
      return;
    }

    // A field left exactly as it was shown keeps its saved value, so a translated
    // label is never written into the student's data just by pressing Save.
    const shown = shownTask(task);
    const keep = (draft: string, saved: string, displayed: string) =>
      displayed !== saved && draft.trim() === displayed.trim() ? saved : draft.trim();

    setPlanner((current) => ({
      ...current,
      tasks: current.tasks.map((item) =>
        item.id === task.id
          ? {
              ...item,
              subject: keep(editDraft.subject, task.subject, shown.subject),
              activity: keep(editDraft.activity, task.activity, shown.activity),
              topic: keep(editDraft.topic, task.topic, shown.topic),
              duration: editDraft.duration,
            }
          : item,
      ),
    }));
    setEditingTaskId(null);
    setEditDraft(null);
    setEditError(null);
    setNotice({ type: 'success', key: 'planner.taskUpdated' });
  }

  function deleteTask(taskId: string) {
    setPlanner((current) => ({
      ...current,
      tasks: current.tasks.filter((task) => task.id !== taskId),
    }));
    if (editingTaskId === taskId) cancelTaskEdit();
    setNotice({ type: 'success', key: 'planner.taskRemoved' });
  }

  return (
    <PlannerFrame storageUnavailable={Boolean(storageMessage)}>
      <div className="space-y-5 sm:space-y-6">
        <PlannerCard
          eyebrow={t('planner.detailsEyebrow')}
          title={t('planner.detailsTitle')}
          trailing={
            <button
              type="button"
              onClick={loadSampleInputs}
              className="inline-flex min-h-9 items-center gap-2 rounded-[10px] border border-[#caebe7] bg-[#f1fcfa] px-3.5 text-[11px] font-bold text-[#26726d] transition-colors hover:bg-[#e7f8f6]"
              data-testid="button-load-sample"
            >
              <Sparkles size={14} /> {t('planner.useSample')}
            </button>
          }
        >
          {storageMessage && (
            <div
              role="alert"
              className="mb-4 rounded-[12px] border border-[#f4d3bf] bg-[#ffffff] px-4 py-3 text-[12px] leading-relaxed text-[#824420]"
              data-testid="message-storage"
            >
              {storageMessage ? t(storageMessage) : null}
            </div>
          )}

          {notice && (
            <div
              role={notice.type === 'error' ? 'alert' : 'status'}
              aria-live="polite"
              className={`mb-4 rounded-[20px] border px-4 py-3 text-[12px] leading-relaxed ${
                notice.type === 'error'
                  ? 'border-[#ebd6d6] bg-[#fef7f7] text-[#865454]'
                  : 'border-[#c9e8d9] bg-[#f1f8f6] text-[#286d4b]'
              }`}
              data-testid={`message-${notice.type}`}
            >
              <p className="font-bold">{t(notice.key, notice.vars)}</p>
              {notice.details && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {notice.details.map((issue) => (
                    <li key={`${issue.code}-${issue.index}`}>
                      {t(`planner.err.${issue.code}`, {
                        subject: issue.subject
                          ? subjectLabel(issue.subject)
                          : t('planner.unnamedSubject', { number: issue.index + 1 }),
                      })}
                    </li>
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
              <label className="block text-[11px] font-bold text-[#20605c]">
                {t('planner.gradeLevel')}
                <select
                  value={planner.grade}
                  onChange={(event) =>
                    updatePlanner({ grade: event.currentTarget.value })
                  }
                  className={inputClassName}
                  data-testid="select-grade"
                >
                  <option value="">{t('planner.chooseGrade')}</option>
                  {['9', '10', '11', '12'].map((grade) => (
                    <option key={grade} value={grade}>
                      {t('common.grade', { grade })}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-[11px] font-bold text-[#20605c]">
                {t('planner.dailyTime')}
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
                      {t('planner.minutesOption', { minutes })}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-6 border-t border-[#e7f3f0] pt-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-extrabold text-[#235355]">
                    {t('planner.subjectsHeading')}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#596a72]">
                    {t('planner.subjectsHelp')}
                  </p>
                </div>
                <span className="rounded-full bg-[#f1f8f6] px-3 py-1.5 text-[10px] font-bold text-[#586871]">
                  {tn('planner.subjectCount', planner.subjects.length)}
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label className="min-w-0 flex-1 text-[11px] font-bold text-[#20605c]">
                  {t('planner.chooseSubject')}
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
                      <option value="">{t('planner.allSubjectsAdded')}</option>
                    ) : (
                      availableSubjectNames.map((subjectName) => (
                        <option key={subjectName} value={subjectName}>
                          {subjectLabel(subjectName)}
                        </option>
                      ))
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={addSubject}
                  disabled={availableSubjectNames.length === 0}
                  className="mt-2 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[12px] bg-[#2b807a] px-4 text-[11px] font-extrabold text-white transition-colors hover:bg-[#287873] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-[22px]"
                  data-testid="button-add-subject"
                >
                  <Plus size={15} /> {t('planner.addSubject')}
                </button>
              </div>

              {planner.subjects.length === 0 ? (
                <div className="mt-4 rounded-[12px] border border-dashed border-[#d3e7e4] bg-[#fbfcfd] px-4 py-6 text-center">
                  <p className="text-[12px] font-bold text-[#4d5b61]">
                    {t('planner.firstSubject')}
                  </p>
                  <p className="mt-1 text-[11px] text-[#596a72]">
                    {t('planner.moreSubjects')}
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  {planner.subjects.map((subject, index) => (
                    <section
                      key={subject.id}
                      className="rounded-[16px] border border-[#e1efee] bg-[#fcfdfd] p-4"
                      data-testid={`subject-card-${index}`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-[16px] bg-[#e5f8f6] text-[10px] font-extrabold text-[#26726d]">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <h3 className="text-[12px] font-extrabold text-[#235355]">
                            {subjectLabel(subject.name)}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSubject(subject.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#586871] transition-colors hover:bg-[#fdf2f2] hover:text-[#965454]"
                          aria-label={t('planner.removeSubject', { subject: subjectLabel(subject.name) })}
                          data-testid={`button-remove-subject-${index}`}
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block text-[10px] font-bold text-[#586871]">
                          {t('planner.examDate')}
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

                        <label className="block text-[10px] font-bold text-[#586871]">
                          {t('planner.difficulty')}
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
                            <option value="easy">{t('planner.diffEasy')}</option>
                            <option value="medium">{t('planner.diffMedium')}</option>
                            <option value="hard">{t('planner.diffHard')}</option>
                          </select>
                        </label>
                      </div>

                      <label className="mt-3 block text-[10px] font-bold text-[#586871]">
                        {t('planner.topics')}
                        <textarea
                          rows={2}
                          value={subject.topics}
                          onChange={(event) =>
                            updateSubject(subject.id, {
                              topics: event.currentTarget.value,
                            })
                          }
                          placeholder={t('planner.topicsPlaceholder')}
                          className={`${inputClassName} resize-y`}
                          data-testid={`textarea-topics-${index}`}
                        />
                      </label>
                    </section>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-[#e7f3f0] pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-[520px] text-[10px] leading-relaxed text-[#596a72]">
                {t('planner.rulesNote')}
              </p>
              <button
                type="submit"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-[#2b807a] px-5 text-[11px] font-extrabold text-white transition-colors hover:bg-[#287873]"
                data-testid="button-generate-plan"
              >
                <Sparkles size={15} /> {t('planner.generate')}
              </button>
            </div>
          </form>
        </PlannerCard>

        {planInputsChanged && (
          <div
            role="status"
            className="rounded-[12px] border border-[#dee8e5] bg-[#ffffff] px-4 py-3 text-[11px] leading-relaxed text-[#8a4822]"
            data-testid="message-plan-outdated"
          >
            {t('planner.outdated')}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] px-4 py-4 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
            <p className="text-[13px] font-semibold text-[#596a72]">
              {t('planner.gradeTile')}
            </p>
            <p className="mt-2 text-[15px] font-extrabold text-[#235355]">
              {planner.grade ? t('common.grade', { grade: planner.grade }) : t('planner.notSelected')}
            </p>
          </div>
          <div className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] px-4 py-4 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
            <p className="text-[13px] font-semibold text-[#596a72]">
              {t('planner.subjectsTile')}
            </p>
            <p className="mt-2 text-[15px] font-extrabold text-[#235355]">
              {t('planner.subjectsAdded', { count: planner.subjects.length })}
            </p>
          </div>
          <div className="rounded-[16px] border border-[#dee8e5] bg-[#ffffff] px-4 py-4 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]">
            <p className="text-[13px] font-semibold text-[#596a72]">
              {t('planner.weeklyProgress')}
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-[15px] font-extrabold text-[#235355]">
                {t('planner.sessionsDone', { done: completedStudyTasks.length, total: studyTasks.length })}
              </p>
              <span className="text-[13px] font-extrabold text-[#26726d]">
                {overallProgress}%
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e2f0ef]"
              role="progressbar"
              aria-label={t('planner.weeklyProgressAria')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={overallProgress}
            >
              <div
                className="h-full rounded-full bg-[#2b807a] transition-all"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        </div>

        {weekComplete(studyTasks) && (
          <div className="rounded-[16px] border border-[#bcece6] bg-[#f0fbfa] px-5 py-4" data-testid="planner-proud">
            <Menti pose="proud" size={84} message={t('menti.plannerProud')} testId="menti-planner-proud" />
          </div>
        )}

        <FocusTimerCard />

        <PlannerCard
          eyebrow={
            planner.weekStart
              ? t('planner.starting', { date: formatPlannerDate(planner.weekStart, locale ?? 'en', t('planner.studyDay')).date })
              : t('planner.nextSeven')
          }
          title={t('planner.timetableTitle')}
          trailing={
            planner.generatedAt ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e7f5ee] px-3 py-1.5 text-[10px] font-bold text-[#317352]">
                <CheckCircle2 size={13} /> {t('planner.savedDevice')}
              </span>
            ) : (
              <span className="rounded-full bg-[#f1f8f6] px-3 py-1.5 text-[10px] font-bold text-[#586871]">
                {t('planner.readyWhenYouAre')}
              </span>
            )
          }
        >
          {!planner.weekStart ? (
            <div
              className="rounded-[16px] border border-dashed border-[#d3e7e4] bg-[#fbfcfd] px-4 py-8 text-center"
              data-testid="empty-timetable"
            >
              <Menti pose="point" size={76} message={t('menti.plannerEmpty')} testId="menti-planner" className="mb-1 justify-center" />
              <p className="mt-3 text-[12px] font-bold text-[#4d5b61]">
                {t('planner.emptyTitle')}
              </p>
              <p className="mt-1 text-[11px] text-[#596a72]">
                {t('planner.emptyText')}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-3 text-[10px] font-semibold text-[#586871]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#297f7a]" /> {t('planner.legendStudy')}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#328159]" /> {t('planner.legendBreak')}
                </span>
                {planner.generatedAt && (
                  <span className="inline-flex items-center gap-1.5 sm:ml-auto">
                    <Clock3 size={12} />
                    {t('planner.updated', {
                      date: new Date(planner.generatedAt).toLocaleDateString(locale ?? 'en', {
                        month: 'short',
                        day: 'numeric',
                      }),
                    })}
                  </span>
                )}
              </div>

              <div
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-7"
                data-testid="weekly-timetable"
              >
                {weekDates.map((date) => {
                  const dateInfo = formatPlannerDate(date, locale ?? 'en', t('planner.studyDay'));
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
                      className="min-w-0 rounded-[16px] border border-[#e0efed] bg-[#fcfdfd] p-3.5"
                      data-testid={`day-${date}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[13px] font-semibold text-[#26726d]">
                            {dateInfo.weekday}
                          </p>
                          <p className="mt-1 text-[14px] font-extrabold text-[#235355]">
                            {dateInfo.date}
                          </p>
                        </div>
                        <span className="rounded-full bg-[#eff7f5] px-2 py-1 text-[9px] font-bold text-[#596a72]">
                          {dayTasks.length
                            ? t('planner.blocks', { count: dayTasks.length })
                            : t('planner.open')}
                        </span>
                      </div>

                      <div className="mt-3 rounded-[16px] bg-[#ffffff] px-3 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-[#596a72]">
                            {t('planner.dailyGoal')}
                          </span>
                          <span className="text-[10px] font-extrabold text-[#20605c]">
                            {dayGoalMinutes > 0
                              ? t('planner.minProgress', { done: dayCompletedMinutes, goal: dayGoalMinutes })
                              : t('planner.restDay')}
                          </span>
                        </div>
                        <div
                          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e2f0ef]"
                          role="progressbar"
                          aria-label={t('planner.dayGoalAria', { weekday: dateInfo.weekday })}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={dayProgress}
                        >
                          <div
                            className="h-full rounded-full bg-[#328159] transition-all"
                            style={{ width: `${dayProgress}%` }}
                          />
                        </div>
                        <p className="mt-1.5 text-[9px] text-[#596a72]">
                          {dayGoalMinutes > 0
                            ? t('planner.upTo', { minutes: planner.dailyMinutes })
                            : t('planner.noStudyPlanned')}
                        </p>
                      </div>

                      {dayTasks.length === 0 ? (
                        <p className="mt-3 rounded-[16px] border border-dashed border-[#d7ebe7] px-3 py-4 text-center text-[10px] leading-relaxed text-[#596a72]">
                          {t('planner.noSessionsDay')}
                        </p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {dayTasks.map((task) => {
                            const isEditing = editingTaskId === task.id;
                            const shown = shownTask(task);

                            return (
                              <article
                                key={task.id}
                                className={`rounded-[12px] border p-2.5 ${
                                  task.completed
                                    ? 'border-[#d3ece0] bg-[#f2f9f7]'
                                    : task.kind === 'break'
                                      ? 'border-[#d4ece0] bg-[#f2f9f7]'
                                      : 'border-[#dee8e5] bg-[#ffffff]'
                                }`}
                                data-testid={`task-${task.id}`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex min-w-0 items-start gap-2">
                                    <span
                                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                        task.kind === 'break'
                                          ? 'bg-[#328159]'
                                          : 'bg-[#297f7a]'
                                      }`}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[9px] font-bold text-[#596a72]">
                                        {t('planner.taskTime', { time: clock(task.startTime), minutes: task.duration })}
                                      </p>
                                      <p
                                        className={`mt-1 break-words text-[10px] font-extrabold ${
                                          task.completed
                                            ? 'text-[#586871] line-through'
                                            : 'text-[#235355]'
                                        }`}
                                      >
                                        {task.kind === 'break'
                                          ? t('planner.shortBreak')
                                          : shown.subject}
                                      </p>
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id)}
                                    aria-label={t(
                                      task.completed ? 'planner.markNotCompleted' : 'planner.markCompleted',
                                      { activity: shown.activity },
                                    )}
                                    className="mt-0.5 h-4 w-4 shrink-0 accent-[#2f8e87]"
                                    data-testid={`checkbox-task-${task.id}`}
                                  />
                                </div>

                                {isEditing && editDraft ? (
                                  <form
                                    onSubmit={saveTaskEdit}
                                    className="mt-3 space-y-2 border-t border-[#e3f0ee] pt-3"
                                    data-testid={`form-edit-task-${task.id}`}
                                  >
                                    <label className="block text-[9px] font-bold text-[#586871]">
                                      {t('planner.editSubject')}
                                      <input
                                        value={editDraft.subject}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            subject: event.currentTarget.value,
                                          })
                                        }
                                        className="mt-1 w-full rounded-[12px] border border-[#dbece9] px-2 py-2 text-[10px] text-[#235355] outline-none focus:border-[#37aea6]"
                                        data-testid="input-edit-subject"
                                      />
                                    </label>
                                    <label className="block text-[9px] font-bold text-[#586871]">
                                      {t('planner.editActivity')}
                                      <input
                                        value={editDraft.activity}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            activity: event.currentTarget.value,
                                          })
                                        }
                                        className="mt-1 w-full rounded-[12px] border border-[#dbece9] px-2 py-2 text-[10px] text-[#235355] outline-none focus:border-[#37aea6]"
                                        data-testid="input-edit-activity"
                                      />
                                    </label>
                                    <label className="block text-[9px] font-bold text-[#586871]">
                                      {t('planner.editTopic')}
                                      <input
                                        value={editDraft.topic}
                                        onChange={(event) =>
                                          setEditDraft({
                                            ...editDraft,
                                            topic: event.currentTarget.value,
                                          })
                                        }
                                        className="mt-1 w-full rounded-[12px] border border-[#dbece9] px-2 py-2 text-[10px] text-[#235355] outline-none focus:border-[#37aea6]"
                                        data-testid="input-edit-topic"
                                      />
                                    </label>
                                    <label className="block text-[9px] font-bold text-[#586871]">
                                      {t('planner.editDurationLabel')}
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
                                        className="mt-1 w-full rounded-[12px] border border-[#dbece9] px-2 py-2 text-[10px] text-[#235355] outline-none focus:border-[#37aea6]"
                                        data-testid="input-edit-duration"
                                      />
                                    </label>
                                    {editError && (
                                      <p
                                        role="alert"
                                        className="text-[9px] leading-relaxed text-[#955454]"
                                      >
                                        {t(editError.key, editError.vars)}
                                      </p>
                                    )}
                                    <div className="flex gap-2 pt-1">
                                      <button
                                        type="submit"
                                        className="inline-flex min-h-8 flex-1 items-center justify-center gap-1 rounded-[10px] bg-[#2b807a] px-2 text-[9px] font-bold text-white hover:bg-[#287873]"
                                        data-testid="button-save-task"
                                      >
                                        <Check size={12} /> {t('planner.save')}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelTaskEdit}
                                        className="inline-flex min-h-8 items-center justify-center rounded-[10px] border border-[#d7ebe7] px-3 text-[9px] font-bold text-[#586871] hover:bg-white"
                                        data-testid="button-cancel-task-edit"
                                      >
                                        {t('planner.cancel')}
                                      </button>
                                    </div>
                                  </form>
                                ) : (
                                  <>
                                    <p
                                      className={`mt-2 break-words text-[9px] leading-relaxed ${
                                        task.completed
                                          ? 'text-[#596a72]'
                                          : 'text-[#586871]'
                                      }`}
                                    >
                                      {task.kind === 'study' &&
                                        `${shown.activity} · `}
                                      {shown.topic}
                                    </p>
                                    <div className="mt-2 flex items-center justify-end gap-1">
                                      <button
                                        type="button"
                                        onClick={() => beginTaskEdit(task)}
                                        className="inline-flex min-h-7 items-center gap-1 rounded-[10px] px-2 text-[9px] font-bold text-[#26726d] transition-colors hover:bg-[#eafaf8]"
                                        aria-label={t('planner.editAria', { activity: shown.activity })}
                                        data-testid={`button-edit-task-${task.id}`}
                                      >
                                        <Pencil size={11} /> {t('planner.edit')}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => deleteTask(task.id)}
                                        className="inline-flex min-h-7 items-center gap-1 rounded-[10px] px-2 text-[9px] font-bold text-[#885a5a] transition-colors hover:bg-[#fdf2f2]"
                                        aria-label={t('planner.deleteAria', { activity: shown.activity })}
                                        data-testid={`button-delete-task-${task.id}`}
                                      >
                                        <Trash2 size={11} /> {t('planner.delete')}
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

        <div className="rounded-[16px] bg-[#e7f5ee] p-5 sm:flex sm:items-start sm:gap-3">
          <Sparkles size={18} className="shrink-0 text-[#2b714e]" />
          <div>
            <p className="text-[12px] font-extrabold text-[#2e6c4d]">
              {t('planner.tipTitle')}
            </p>
            <p className="mt-1.5 text-[11px] leading-[1.7] text-[#586871]">
              {t('planner.tipText')}
            </p>
          </div>
        </div>

        {planner.generatedAt && (
          <p
            className="flex items-center justify-center gap-1.5 text-center text-[10px] text-[#596a72]"
            data-testid="text-local-save-status"
          >
            <CheckCircle2 size={12} className="text-[#317352]" />
            {t('planner.autoSave')}
          </p>
        )}
      </div>
    </PlannerFrame>
  );
}
