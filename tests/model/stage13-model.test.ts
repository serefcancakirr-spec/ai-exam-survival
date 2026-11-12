// Stage 13: focus timer logic, saved settings and Menti mood rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as FM from '../../artifacts/ai-exam-survival/src/pages/focus-model';
import { dayPart, quizMood, weekComplete } from '../../artifacts/ai-exam-survival/src/components/menti-moods';

const MIN = 60_000;

test('a new timer is a 25-minute study block that is not running', () => {
  const t = FM.createFocusTimer(25);
  assert.deepEqual(t, { phase: 'work', status: 'idle', completedWorks: 0, endsAt: null, remainingMs: 25 * MIN });
  assert.equal(FM.formatClock(FM.remainingMs(t, 0)), '25:00');
});

test('start, pause and resume keep the right time left', () => {
  let t = FM.startFocus(FM.createFocusTimer(25), 1000);
  assert.equal(t.status, 'running');
  assert.equal(FM.remainingMs(t, 1000 + 10 * MIN), 15 * MIN);
  t = FM.pauseFocus(t, 1000 + 10 * MIN);
  assert.equal(t.status, 'paused');
  assert.equal(FM.remainingMs(t, 1000 + 60 * MIN), 15 * MIN, 'time must not run while paused');
  t = FM.startFocus(t, 5 * 60 * MIN);
  assert.equal(FM.remainingMs(t, 5 * 60 * MIN + 5 * MIN), 10 * MIN);
});

test('a finished study block starts a 5-minute break; a finished break waits for the student', () => {
  let t = FM.startFocus(FM.createFocusTimer(25), 0);
  let r = FM.advanceFocus(t, 25 * MIN - 1, 25);
  assert.equal(r.finished, null);
  r = FM.advanceFocus(t, 25 * MIN, 25);
  assert.equal(r.finished, 'work');
  assert.deepEqual([r.timer.phase, r.timer.status, r.timer.completedWorks], ['short', 'running', 1]);
  assert.equal(FM.remainingMs(r.timer, 25 * MIN), 5 * MIN);
  t = r.timer;
  r = FM.advanceFocus(t, 30 * MIN, 25);
  assert.equal(r.finished, 'short');
  assert.deepEqual([r.timer.phase, r.timer.status, r.timer.completedWorks, r.timer.remainingMs], ['work', 'idle', 1, 25 * MIN]);
});

test('after four study blocks comes a 15-minute long break, then a fresh set', () => {
  let t = FM.createFocusTimer(15);
  let at = 0;
  for (let i = 1; i <= 4; i += 1) {
    t = FM.startFocus(t, at);
    at += 15 * MIN;
    const r = FM.advanceFocus(t, at, 15);
    assert.equal(r.timer.phase, i < 4 ? 'short' : 'long', `after block ${i}`);
    assert.equal(r.timer.completedWorks, i);
    t = r.timer;
    at += FM.phaseMinutes(t.phase, 15) * MIN;
    t = FM.advanceFocus(t, at, 15).timer;
  }
  assert.deepEqual([t.phase, t.status, t.completedWorks, t.remainingMs], ['work', 'idle', 0, 15 * MIN]);
  assert.equal(FM.phaseMinutes('long', 45), 15);
  assert.equal(FM.phaseMinutes('short', 45), 5);
});

test('if the tablet slept through a study block, the break starts when it wakes up', () => {
  const t = FM.startFocus(FM.createFocusTimer(25), 0);
  const r = FM.advanceFocus(t, 3 * 60 * MIN, 25);
  assert.equal(r.finished, 'work');
  assert.equal(FM.remainingMs(r.timer, 3 * 60 * MIN), 5 * MIN);
});

test('clock text', () => {
  assert.equal(FM.formatClock(0), '0:00');
  assert.equal(FM.formatClock(59_001), '1:00');
  assert.equal(FM.formatClock(4 * MIN + 7000), '4:07');
  assert.equal(FM.formatClock(45 * MIN), '45:00');
});

test('saved settings: nothing saved gives defaults; unreadable data is never overwritten', () => {
  assert.deepEqual(FM.readFocusSettings(null), { settings: FM.DEFAULT_FOCUS_SETTINGS, canSave: true });
  const ok = { version: 1, workMinutes: 45, sound: 'waves', volume: 30, chime: false };
  assert.deepEqual(FM.readFocusSettings(JSON.stringify(ok)), { settings: ok, canSave: true });
  for (const bad of ['not json', '{}', JSON.stringify({ ...ok, workMinutes: 30 }), JSON.stringify({ ...ok, volume: 150 }), JSON.stringify({ ...ok, sound: 'music' }), JSON.stringify({ ...ok, version: 2 })]) {
    assert.deepEqual(FM.readFocusSettings(bad), { settings: FM.DEFAULT_FOCUS_SETTINGS, canSave: false }, bad);
  }
  assert.equal(FM.FOCUS_STORAGE_KEY, 'ai-exam-survival:focus:v1');
});

test('Menti greets by time of day and is sleepy from 23:00 to 04:59', () => {
  const parts = Array.from({ length: 24 }, (_, h) => dayPart(h));
  assert.deepEqual(parts.slice(0, 5), ['night', 'night', 'night', 'night', 'night']);
  assert.deepEqual([parts[5], parts[11], parts[12], parts[17], parts[18], parts[22], parts[23]], ['morning', 'morning', 'day', 'day', 'evening', 'evening', 'night']);
});

test('quiz moods: 70%+ cheer, 40–69% encourage, below 40% comfort', () => {
  assert.equal(quizMood(100), 'cheer');
  assert.equal(quizMood(70), 'cheer');
  assert.equal(quizMood(69), 'encourage');
  assert.equal(quizMood(40), 'encourage');
  assert.equal(quizMood(39), 'comfort');
  assert.equal(quizMood(0), 'comfort');
});

test('proud Menti only when the week has sessions and all are done', () => {
  assert.equal(weekComplete([]), false);
  assert.equal(weekComplete([{ completed: true }, { completed: false }]), false);
  assert.equal(weekComplete([{ completed: true }, { completed: true }]), true);
});
