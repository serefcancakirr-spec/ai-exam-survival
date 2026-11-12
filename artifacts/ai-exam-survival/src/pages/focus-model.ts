// Stage 13: focus timer (Pomodoro) logic and its saved settings. No React here so it can be tested on its own.
// Only the student's settings are saved (study length, calm sound, volume, bell) – never how long they studied.

export const FOCUS_STORAGE_KEY = 'ai-exam-survival:focus:v1';

export const FOCUS_WORK_OPTIONS = [15, 25, 45] as const;
export type FocusWorkMinutes = (typeof FOCUS_WORK_OPTIONS)[number];
export const FOCUS_SOUNDS = ['rain', 'noise', 'waves'] as const;
export type FocusSound = (typeof FOCUS_SOUNDS)[number];

export const SHORT_BREAK_MINUTES = 5;
export const LONG_BREAK_MINUTES = 15;
/** A long break comes after this many finished study blocks. */
export const WORKS_BEFORE_LONG_BREAK = 4;

export type FocusSettings = {
  version: 1;
  workMinutes: FocusWorkMinutes;
  sound: FocusSound;
  /** 0–100 */
  volume: number;
  chime: boolean;
};

export const DEFAULT_FOCUS_SETTINGS: FocusSettings = { version: 1, workMinutes: 25, sound: 'rain', volume: 50, chime: true };

export function isFocusSettings(value: unknown): value is FocusSettings {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    v.version === 1 &&
    FOCUS_WORK_OPTIONS.includes(v.workMinutes as FocusWorkMinutes) &&
    FOCUS_SOUNDS.includes(v.sound as FocusSound) &&
    typeof v.volume === 'number' &&
    Number.isFinite(v.volume) &&
    v.volume >= 0 &&
    v.volume <= 100 &&
    typeof v.chime === 'boolean'
  );
}

/**
 * Reads saved settings. Nothing saved: defaults, and saving is allowed.
 * Saved but unreadable: defaults, and saving is NOT allowed (never overwrite data we cannot read).
 */
export function readFocusSettings(raw: string | null): { settings: FocusSettings; canSave: boolean } {
  if (raw === null) return { settings: DEFAULT_FOCUS_SETTINGS, canSave: true };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isFocusSettings(parsed)) return { settings: parsed, canSave: true };
  } catch {
    // fall through
  }
  return { settings: DEFAULT_FOCUS_SETTINGS, canSave: false };
}

// ---------- timer ----------

export type FocusPhase = 'work' | 'short' | 'long';
export type FocusStatus = 'idle' | 'running' | 'paused';

export type FocusTimer = {
  phase: FocusPhase;
  status: FocusStatus;
  /** Finished study blocks in the current set of four (0–3 while working). */
  completedWorks: number;
  /** When the running phase ends (ms since 1970); null unless running. */
  endsAt: number | null;
  /** Time left while idle or paused. */
  remainingMs: number;
};

export function phaseMinutes(phase: FocusPhase, workMinutes: FocusWorkMinutes) {
  return phase === 'work' ? workMinutes : phase === 'short' ? SHORT_BREAK_MINUTES : LONG_BREAK_MINUTES;
}

export function createFocusTimer(workMinutes: FocusWorkMinutes): FocusTimer {
  return { phase: 'work', status: 'idle', completedWorks: 0, endsAt: null, remainingMs: workMinutes * 60_000 };
}

export function startFocus(timer: FocusTimer, now: number): FocusTimer {
  if (timer.status === 'running') return timer;
  return { ...timer, status: 'running', endsAt: now + timer.remainingMs };
}

export function pauseFocus(timer: FocusTimer, now: number): FocusTimer {
  if (timer.status !== 'running' || timer.endsAt === null) return timer;
  return { ...timer, status: 'paused', endsAt: null, remainingMs: Math.max(0, timer.endsAt - now) };
}

export function remainingMs(timer: FocusTimer, now: number) {
  return timer.status === 'running' && timer.endsAt !== null ? Math.max(0, timer.endsAt - now) : timer.remainingMs;
}

/**
 * Moves on when the running phase is over. Uses the clock, so the time stays right even if the tablet
 * slept or the tab was in the background. A finished study block starts its break straight away;
 * a finished break waits for the student to start the next block.
 */
export function advanceFocus(
  timer: FocusTimer,
  now: number,
  workMinutes: FocusWorkMinutes,
): { timer: FocusTimer; finished: FocusPhase | null } {
  if (timer.status !== 'running' || timer.endsAt === null || now < timer.endsAt) return { timer, finished: null };
  if (timer.phase === 'work') {
    const done = timer.completedWorks + 1;
    const phase: FocusPhase = done >= WORKS_BEFORE_LONG_BREAK ? 'long' : 'short';
    const ms = phaseMinutes(phase, workMinutes) * 60_000;
    return { timer: { phase, status: 'running', completedWorks: done, endsAt: now + ms, remainingMs: ms }, finished: 'work' };
  }
  const completedWorks = timer.phase === 'long' ? 0 : timer.completedWorks;
  return {
    timer: { phase: 'work', status: 'idle', completedWorks, endsAt: null, remainingMs: workMinutes * 60_000 },
    finished: timer.phase,
  };
}

/** "25:00", "4:07" */
export function formatClock(ms: number) {
  const total = Math.ceil(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
