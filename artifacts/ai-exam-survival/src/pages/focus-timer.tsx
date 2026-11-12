// Stage 13: focus timer card shown on the Study Planner page (Pomodoro + calm sounds + Menti).
import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { FocusSoundPlayer } from '@/components/focus-sounds';
import { Menti } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';
import type { MessageKey } from '@/i18n/translations-en';
import {
  FOCUS_SOUNDS,
  FOCUS_STORAGE_KEY,
  FOCUS_WORK_OPTIONS,
  WORKS_BEFORE_LONG_BREAK,
  advanceFocus,
  createFocusTimer,
  formatClock,
  pauseFocus,
  phaseMinutes,
  readFocusSettings,
  remainingMs,
  startFocus,
  type FocusSettings,
  type FocusSound,
  type FocusTimer as Timer,
} from './focus-model';

function loadSettings() {
  try {
    return readFocusSettings(window.localStorage.getItem(FOCUS_STORAGE_KEY));
  } catch {
    return { ...readFocusSettings(null), canSave: false };
  }
}

const SOUND_LABEL: Record<FocusSound, MessageKey> = {
  rain: 'focus.soundRain',
  noise: 'focus.soundNoise',
  waves: 'focus.soundWaves',
};
const PHASE_LABEL: Record<Timer['phase'], MessageKey> = {
  work: 'focus.phaseWork',
  short: 'focus.phaseShort',
  long: 'focus.phaseLong',
};

const chip =
  'inline-flex min-h-10 items-center justify-center rounded-full border px-4 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const chipOn = 'border-[#5144c7] bg-[#5144c7] text-white';
const chipOff = 'border-[#d9d6f3] bg-white text-[#5144c7] hover:bg-[#f6f4ff]';

export function FocusTimerCard() {
  const { t } = useI18n();
  const [initial] = useState(loadSettings);
  const [settings, setSettings] = useState<FocusSettings>(initial.settings);
  const canSave = initial.canSave;
  const [timer, setTimer] = useState<Timer>(() => createFocusTimer(initial.settings.workMinutes));
  const [now, setNow] = useState(() => Date.now());
  const [announce, setAnnounce] = useState('');
  const [playing, setPlaying] = useState<FocusSound | null>(null);
  const player = useRef<FocusSoundPlayer | null>(null);

  const getPlayer = () => {
    if (!player.current) {
      player.current = new FocusSoundPlayer();
      player.current.setVolume(settings.volume);
    }
    return player.current;
  };

  // Sounds stop when the student leaves the page.
  useEffect(() => () => player.current?.dispose(), []);

  // Tick while running; the clock (not the number of ticks) decides the time left.
  useEffect(() => {
    if (timer.status !== 'running') return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [timer.status]);

  useEffect(() => {
    const { timer: next, finished } = advanceFocus(timer, now, settings.workMinutes);
    if (!finished) return;
    setTimer(next);
    setAnnounce(t(finished === 'work' ? 'focus.doneWork' : 'focus.doneBreak'));
    if (settings.chime) getPlayer().chime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function save(next: FocusSettings) {
    setSettings(next);
    if (!canSave) return;
    try {
      window.localStorage.setItem(FOCUS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage full or blocked: the timer still works
    }
  }

  function toggleRun() {
    const at = Date.now();
    setNow(at);
    setAnnounce('');
    setTimer((current) => (current.status === 'running' ? pauseFocus(current, at) : startFocus(current, at)));
  }

  function reset() {
    setAnnounce('');
    setTimer(createFocusTimer(settings.workMinutes));
  }

  function chooseLength(minutes: FocusSettings['workMinutes']) {
    save({ ...settings, workMinutes: minutes });
    if (timer.status === 'idle' && timer.phase === 'work') setTimer({ ...timer, remainingMs: minutes * 60_000 });
  }

  function chooseSound(kind: FocusSound) {
    save({ ...settings, sound: kind });
    if (playing === kind) {
      getPlayer().stop();
      setPlaying(null);
    } else {
      getPlayer().play(kind);
      setPlaying(kind);
    }
  }

  function toggleSound() {
    if (playing) {
      getPlayer().stop();
      setPlaying(null);
    } else {
      getPlayer().play(settings.sound);
      setPlaying(settings.sound);
    }
  }

  function changeVolume(value: number) {
    player.current?.setVolume(value);
    save({ ...settings, volume: value });
  }

  const left = remainingMs(timer, now);
  const onBreak = timer.phase !== 'work';
  const running = timer.status === 'running';
  // The breathing circle grows for 4 s (breathe in) and shrinks for 4 s (breathe out), from the start of the break.
  const elapsedInPhase = phaseMinutes(timer.phase, settings.workMinutes) * 60_000 - left;
  const breatheIn = Math.floor(elapsedInPhase / 4000) % 2 === 0;
  const mentiPose = onBreak ? 'calm' : running ? 'focused' : 'wave';
  const mentiText = onBreak
    ? t('menti.focusBreak')
    : running
      ? t('menti.focusWork')
      : timer.status === 'paused'
        ? t('menti.focusPaused')
        : t('menti.focusIdle');

  return (
    <section
      className="rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6"
      data-testid="focus-timer"
      data-phase={timer.phase}
      data-status={timer.status}
      data-sound-playing={playing ?? 'none'}
    >
      <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#5a4bc9]">{t('focus.eyebrow')}</p>
      <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.04em] text-[#20294d] sm:text-[22px]">
        {t('focus.title')}
      </h2>

      {!canSave && (
        <p role="alert" className="mt-3 rounded-[13px] border border-[#f0d8b8] bg-[#fff9f0] px-4 py-3 text-[11px] text-[#765221]" data-testid="focus-storage-locked">
          {t('focus.storageLocked')}
        </p>
      )}

      <div className="mt-5 grid gap-5 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#5a4bc9]" data-testid="focus-phase">
            {t(PHASE_LABEL[timer.phase])}
          </p>
          <div className={`relative grid h-[168px] w-[168px] place-items-center rounded-full ${onBreak ? 'bg-[#e5f7f5]' : 'bg-[#f2f0ff]'}`}>
            {onBreak && running && <span className="focus-breathe absolute inset-3 rounded-full bg-[#bfece8]" aria-hidden="true" />}
            <span className="relative">
              <span className="sr-only">{t('focus.timeLeft')}: </span>
              <span className="font-display block text-[44px] font-extrabold tabular-nums tracking-[-.04em] text-[#20294d]" data-testid="focus-time">
                {formatClock(left)}
              </span>
              {onBreak && running && (
                <span className="block text-[12px] font-bold text-[#278c8e]" data-testid="focus-breathe-text">
                  {t(breatheIn ? 'focus.breatheIn' : 'focus.breatheOut')}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5" aria-hidden="true">
            {Array.from({ length: WORKS_BEFORE_LONG_BREAK }, (_, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-full ${i < timer.completedWorks ? 'bg-[#5144c7]' : 'bg-[#dedcf2]'}`} />
            ))}
          </div>
          <p className="text-[10px] font-semibold text-[#7e879e]" data-testid="focus-set-progress">
            {t('focus.setProgress', { done: timer.completedWorks })}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={toggleRun}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#5144c7] px-5 text-[12px] font-extrabold text-white transition-colors hover:bg-[#4337b0]"
              data-testid="focus-start"
            >
              {running ? <Pause size={15} /> : <Play size={15} />}
              {running ? t('focus.pause') : timer.status === 'paused' ? t('focus.resume') : t('focus.start')}
            </button>
            <button type="button" onClick={reset} className={`${chip} ${chipOff} gap-1.5`} data-testid="focus-reset">
              <RotateCcw size={14} /> {t('focus.reset')}
            </button>
          </div>
          <p role="status" aria-live="polite" className="min-h-[1.2em] text-[12px] font-bold text-[#278c8e]" data-testid="focus-announce">
            {announce}
          </p>
        </div>

        <div className="space-y-4">
          <Menti pose={mentiPose} size={82} message={mentiText} testId="menti-focus" />

          <div>
            <p className="text-[11px] font-bold text-[#46516f]">{t('focus.length')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('focus.length')}>
              {FOCUS_WORK_OPTIONS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  aria-pressed={settings.workMinutes === minutes}
                  disabled={timer.status !== 'idle' || timer.phase !== 'work'}
                  onClick={() => chooseLength(minutes)}
                  className={`${chip} ${settings.workMinutes === minutes ? chipOn : chipOff}`}
                  data-testid={`focus-length-${minutes}`}
                >
                  {t('focus.minutes', { minutes })}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-[#8790a4]">{t('focus.breakInfo')}</p>
          </div>

          <div>
            <p className="text-[11px] font-bold text-[#46516f]">{t('focus.sound')}</p>
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t('focus.sound')}>
              {FOCUS_SOUNDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={playing === kind}
                  onClick={() => chooseSound(kind)}
                  className={`${chip} ${playing === kind ? chipOn : settings.sound === kind ? `${chipOff} ring-2 ring-[#d9d6f3]` : chipOff}`}
                  data-testid={`focus-sound-${kind}`}
                >
                  {t(SOUND_LABEL[kind])}
                </button>
              ))}
              <button type="button" onClick={toggleSound} className={`${chip} ${chipOff} gap-1.5`} data-testid="focus-sound-toggle">
                {playing ? <VolumeX size={14} /> : <Volume2 size={14} />}
                {playing ? t('focus.soundStop') : t('focus.soundPlay')}
              </button>
            </div>
            <label className="mt-3 flex items-center gap-3 text-[11px] font-bold text-[#46516f]">
              {t('focus.volume')}
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={settings.volume}
                onChange={(event) => changeVolume(Number(event.currentTarget.value))}
                className="min-w-0 flex-1 accent-[#5144c7]"
                data-testid="focus-volume"
              />
            </label>
            <label className="mt-3 flex min-h-10 items-center gap-2 text-[11px] font-bold text-[#46516f]">
              <input
                type="checkbox"
                checked={settings.chime}
                onChange={(event) => save({ ...settings, chime: event.currentTarget.checked })}
                className="h-4 w-4 accent-[#5144c7]"
                data-testid="focus-chime"
              />
              {t('focus.chime')}
            </label>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-relaxed text-[#8790a4]">{t('focus.note')}</p>
    </section>
  );
}
