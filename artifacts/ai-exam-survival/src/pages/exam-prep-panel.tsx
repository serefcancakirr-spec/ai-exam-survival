import { useState, type FormEvent } from 'react';
import { Check, NotebookPen, Pencil, Plus, Sparkles, X } from 'lucide-react';
import { Link } from 'wouter';
import { daysBetween, type Exam } from './exam-calendar-model';
import {
  STEP_TEXT_LIMIT,
  getDueLabel,
  getTimeBand,
  isSuggestionAdded,
  prepProgress,
  suggestPrepSteps,
  validateStepDraft,
  type PlannerSummary,
  type PrepStep,
  type StepDraft,
} from './exam-prep-model';
import { englishFromTurkish, translatePhrase, useI18n } from '@/i18n/i18n';

const inputClassName =
  'mt-1.5 w-full rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 py-2.5 text-[13px] text-[#3f4e5d] outline-none transition placeholder:text-[#abb1b8] focus:border-[#84a0c0] focus:ring-2 focus:ring-[#84a0c0]/10';
const smallButton =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3 text-[11px] font-bold text-[#5e6973] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c] disabled:cursor-not-allowed disabled:opacity-50';
const primarySmall =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[6px] bg-[#54769d] px-4 text-[11px] font-extrabold text-white transition-colors hover:bg-[#527195]';

type Props = {
  exam: Exam;
  today: string;
  steps: PrepStep[]; // this exam's steps, already sorted
  plannerSummary: PlannerSummary;
  onAddStep: (draft: StepDraft, source: PrepStep['source']) => void;
  onAddSuggestions: (drafts: StepDraft[]) => void;
  onUpdateStep: (stepId: string, draft: StepDraft) => void;
  onToggleStep: (stepId: string) => void;
  onDeleteStep: (stepId: string) => void;
};

function bandHeading(examDate: string, today: string) {
  const days = daysBetween(today, examDate);
  if (days === 0) return 'Suggested for an exam today';
  if (days === 1) return 'Suggested for an exam tomorrow';
  return `Suggested for an exam in ${days} days`;
}

export function PrepProgressBar({ done, total }: { done: number; total: number }) {
  const { tx } = useI18n();
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-[#f0f2f4]"
      role="progressbar"
      aria-label={tx('Preparation progress')}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="h-full rounded-full bg-gradient-to-r from-[#6183aa] to-[#478b76] transition-all" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default function ExamPrepPanel({
  exam,
  today,
  steps,
  plannerSummary,
  onAddStep,
  onAddSuggestions,
  onUpdateStep,
  onToggleStep,
  onDeleteStep,
}: Props) {
  const { tx, phrase, subject: subjectLabel, lang } = useI18n();
  const [draft, setDraft] = useState<StepDraft>({ text: '', dueDate: '' });
  const [errors, setErrors] = useState<string[]>([]);
  const [editing, setEditing] = useState<{ id: string; draft: StepDraft; errors: string[] } | null>(null);

  const progress = prepProgress(steps);
  const band = getTimeBand(exam.date, today);
  const suggestions = suggestPrepSteps(exam, today);
  // A suggestion counts as added whether it was added in English or in Turkish.
  const notAdded = suggestions.filter(
    (suggestion) =>
      !isSuggestionAdded(steps, exam.id, suggestion.text) &&
      !isSuggestionAdded(steps, exam.id, translatePhrase('tr', suggestion.text)),
  );
  // Suggested steps the app wrote are shown in the current language; a student's own words are shown as typed.
  const shownStep = (step: PrepStep) =>
    step.source !== 'suggested' ? step.text : lang === 'tr' ? phrase(step.text) : englishFromTurkish(step.text);
  const idBase = `prep-${exam.id}`;

  function submitOwn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const problems = validateStepDraft(draft);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    onAddStep(draft, 'own');
    setDraft({ text: '', dueDate: '' });
    setErrors([]);
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const problems = validateStepDraft(editing.draft);
    if (problems.length > 0) {
      setEditing({ ...editing, errors: problems });
      return;
    }
    const original = steps.find((step) => step.id === editing.id);
    const shown = original ? shownStep(original) : '';
    // Saving without changing the shown (translated) text keeps the saved words exactly as they were.
    const text =
      original && shown !== original.text && editing.draft.text.trim() === shown.trim() ? original.text : editing.draft.text;
    onUpdateStep(editing.id, { ...editing.draft, text });
    setEditing(null);
  }

  return (
    <div className="mt-3 rounded-[10px] border border-[#e6ebf1] bg-[#fbfcfe] p-4" data-testid={`prep-panel-${exam.id}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] font-extrabold text-[#3f4e5d]">{tx('Preparation steps')}</p>
        <p className="text-[11px] font-bold text-[#4c6a8c]" data-testid="prep-progress-text">
          {progress.total === 0
            ? tx('No steps yet')
            : tx('{done} of {total} done · {percent}%', { done: progress.done, total: progress.total, percent: progress.percent })}
        </p>
      </div>
      <div className="mt-2">
        <PrepProgressBar done={progress.done} total={progress.total} />
      </div>

      {steps.length === 0 ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[#60686f]" data-testid="prep-empty">
          {tx('Add your own step below, or pick from the suggestions.')}
        </p>
      ) : (
        <ul className="mt-3 space-y-2" data-testid="prep-step-list">
          {steps.map((step) => {
            if (editing?.id === step.id) {
              return (
                <li key={step.id} className="rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] p-3" data-testid="prep-step">
                  <form onSubmit={submitEdit} noValidate data-testid="form-edit-step">
                    {editing.errors.length > 0 && (
                      <p role="alert" className="mb-2 text-[11px] font-bold text-[#865454]">
                        {editing.errors.map(phrase).join(' ')}
                      </p>
                    )}
                    <label className="block text-[10px] font-bold text-[#5e676f]" htmlFor={`${idBase}-edit-text`}>
                      {tx('Step')}
                      <input
                        id={`${idBase}-edit-text`}
                        value={editing.draft.text}
                        maxLength={STEP_TEXT_LIMIT}
                        onChange={(event) => setEditing({ ...editing, draft: { ...editing.draft, text: event.currentTarget.value }, errors: [] })}
                        className={inputClassName}
                        data-testid="input-edit-step-text"
                      />
                    </label>
                    <label className="mt-2 block text-[10px] font-bold text-[#5e676f]" htmlFor={`${idBase}-edit-due`}>
                      {tx('Due date')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
                      <input
                        id={`${idBase}-edit-due`}
                        type="date"
                        value={editing.draft.dueDate}
                        onChange={(event) => setEditing({ ...editing, draft: { ...editing.draft, dueDate: event.currentTarget.value }, errors: [] })}
                        className={inputClassName}
                        data-testid="input-edit-step-due"
                      />
                    </label>
                    <div className="mt-2 flex flex-wrap justify-end gap-2">
                      <button type="button" onClick={() => setEditing(null)} className={smallButton} data-testid="button-cancel-step-edit">
                        {tx('Cancel')}
                      </button>
                      <button type="submit" className={primarySmall} data-testid="button-save-step">
                        <Check size={13} /> {tx('Save step')}
                      </button>
                    </div>
                  </form>
                </li>
              );
            }
            const due = getDueLabel(step, today);
            const overdue = due.startsWith('Overdue');
            return (
              <li key={step.id} className="rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] p-3" data-testid="prep-step">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <label className="flex min-w-0 cursor-pointer items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={step.done}
                      onChange={() => onToggleStep(step.id)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-[#6183aa]"
                      data-testid="checkbox-step"
                    />
                    <span className="min-w-0">
                      <span
                        className={`block break-words text-[12px] font-bold ${step.done ? 'text-[#616870] line-through' : 'text-[#4b5966]'}`}
                        data-testid="step-text"
                      >
                        {shownStep(step)}
                      </span>
                      {due && (
                        <span className={`mt-0.5 block text-[10px] font-bold ${overdue ? 'text-[#8f5847]' : 'text-[#60686f]'}`} data-testid="step-due">
                          {phrase(due)}
                        </span>
                      )}
                    </span>
                  </label>
                  <div className="flex shrink-0 gap-1.5 pl-7 sm:pl-0">
                    <button
                      type="button"
                      onClick={() => setEditing({ id: step.id, draft: { text: shownStep(step), dueDate: step.dueDate }, errors: [] })}
                      className={smallButton}
                      aria-label={tx('Edit step: {text}', { text: shownStep(step) })}
                      data-testid="button-edit-step"
                    >
                      <Pencil size={12} /> {tx('Edit')}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteStep(step.id)}
                      className={smallButton}
                      aria-label={tx('Delete step: {text}', { text: shownStep(step) })}
                      data-testid="button-delete-step"
                    >
                      <X size={12} /> {tx('Delete')}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={submitOwn} noValidate className="mt-4 border-t border-[#eef0f2] pt-3" data-testid="form-add-step">
        <p className="text-[11px] font-extrabold text-[#4b5966]">{tx('Add your own step')}</p>
        {errors.length > 0 && (
          <p role="alert" className="mt-1.5 text-[11px] font-bold text-[#865454]" data-testid="add-step-error">
            {errors.map(phrase).join(' ')}
          </p>
        )}
        <div className="mt-1 grid gap-2 sm:grid-cols-[1fr_170px_auto] sm:items-end">
          <label className="block text-[10px] font-bold text-[#5e676f]" htmlFor={`${idBase}-text`}>
            {tx('Step')}
            <input
              id={`${idBase}-text`}
              value={draft.text}
              maxLength={STEP_TEXT_LIMIT}
              onChange={(event) => {
                setDraft({ ...draft, text: event.currentTarget.value });
                setErrors([]);
              }}
              placeholder={tx('For example: Redo the chapter 4 exercises')}
              className={inputClassName}
              data-testid="input-step-text"
            />
          </label>
          <label className="block text-[10px] font-bold text-[#5e676f]" htmlFor={`${idBase}-due`}>
            {tx('Due date')} <span className="font-semibold text-[#60686f]">{tx('(optional)')}</span>
            <input
              id={`${idBase}-due`}
              type="date"
              value={draft.dueDate}
              onChange={(event) => {
                setDraft({ ...draft, dueDate: event.currentTarget.value });
                setErrors([]);
              }}
              className={inputClassName}
              data-testid="input-step-due"
            />
          </label>
          <button type="submit" className={`${primarySmall} sm:mb-px`} data-testid="button-add-step">
            <Plus size={13} /> {tx('Add step')}
          </button>
        </div>
      </form>

      <div className="mt-4 border-t border-[#eef0f2] pt-3" data-testid="prep-suggestions">
        {band === 'past' ? (
          <p className="text-[11px] text-[#60686f]">{tx('This exam has passed, so there are no new suggestions.')}</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-extrabold text-[#4b5966]">
                <Sparkles size={13} className="text-[#4a688c]" /> {phrase(bandHeading(exam.date, today))}
              </p>
              <button
                type="button"
                onClick={() => onAddSuggestions(notAdded.map((item) => ({ ...item, text: phrase(item.text) })))}
                disabled={notAdded.length === 0}
                className={smallButton}
                data-testid="button-add-all-suggestions"
              >
                <Plus size={12} /> {notAdded.length === 0 ? tx('All added') : tx('Add all ({count})', { count: notAdded.length })}
              </button>
            </div>
            <ul className="mt-2 space-y-1.5">
              {suggestions.map((suggestion) => {
                const added = !notAdded.includes(suggestion);
                return (
                  <li key={suggestion.text} className="flex items-center justify-between gap-2 rounded-[11px] bg-[#fffdf8] px-3 py-2" data-testid="suggestion">
                    <span className="min-w-0">
                      <span className="block break-words text-[11px] font-semibold text-[#4f5a64]" data-testid="suggestion-text">
                        {phrase(suggestion.text)}
                      </span>
                      <span className="block text-[10px] text-[#60686f]">{phrase(getDueLabel({ dueDate: suggestion.dueDate, done: false }, today))}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onAddStep({ text: phrase(suggestion.text), dueDate: suggestion.dueDate }, 'suggested')}
                      disabled={added}
                      className={smallButton}
                      aria-label={tx(added ? 'Already added: {text}' : 'Add step: {text}', { text: phrase(suggestion.text) })}
                      data-testid="button-add-suggestion"
                    >
                      {added ? <Check size={12} /> : <Plus size={12} />} {added ? tx('Added') : tx('Add')}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-[8px] bg-[#f9f7f4] px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between" data-testid="prep-planner">
        <p className="flex items-start gap-2 text-[11px] leading-relaxed text-[#3d685b]">
          <NotebookPen size={14} className="mt-0.5 shrink-0" />
          <span data-testid="prep-planner-text">
            {plannerSummary.status === 'sessions'
              ? tx('Study Planner: {completed} of {planned} {subject} sessions done before this exam.', {
                  completed: plannerSummary.completed,
                  planned: plannerSummary.planned,
                  subject: subjectLabel(exam.subject),
                })
              : plannerSummary.status === 'no-sessions'
                ? tx('Your Study Planner has no {subject} sessions before this exam yet.', { subject: subjectLabel(exam.subject) })
                : tx('You have not made a Study Planner week yet.')}
          </span>
        </p>
        <Link
          href="/study-planner"
          className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-3.5 text-[11px] font-bold text-[#396e5e] transition-colors hover:border-[#94baae]"
          data-testid="link-open-planner"
        >
          {tx('Open Study Planner')}
        </Link>
      </div>
    </div>
  );
}
