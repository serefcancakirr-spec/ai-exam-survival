// Browser tests for Stage 13: focus timer, calm sounds and new Menti moods. Clock fixed (Istanbul).
// Usage: node stage13-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const { EN, TR } = require('../out/dict.cjs');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const FOCUS_KEY = 'ai-exam-survival:focus:v1';
const DICT = { tr: TR, en: EN };
const MIN = 60_000;
const results = [];
const errors = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message || e).split('\n')[0] });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const VIEWPORTS = { phone: { width: 390, height: 844 }, 'tablet portrait': { width: 800, height: 1280 }, 'tablet landscape': { width: 1280, height: 800 } };
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));

async function open(browser, { viewport = VIEWPORTS['tablet portrait'], lang = 'tr', items = [], path = '/study-planner', time = '2026-11-05T10:00:00+03:00', reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion });
  await context.clock.install({ time: new Date(time) });
  const seed = lang ? [[LANG_KEY, lang], ...items] : items;
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
    // count audio use, so we can check that nothing plays before the student taps
    window.__audio = { created: 0, closed: 0, oscillators: 0, sources: 0 };
    window.__writes = [];
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      window.__writes.push(k);
      return set.call(this, k, v);
    };
    const Base = window.AudioContext;
    if (Base) {
      window.AudioContext = class extends Base {
        constructor(...a) {
          super(...a);
          window.__audio.created += 1;
        }
        close() {
          window.__audio.closed += 1;
          return super.close();
        }
        createOscillator() {
          window.__audio.oscillators += 1;
          return super.createOscillator();
        }
        createBufferSource() {
          window.__audio.sources += 1;
          return super.createBufferSource();
        }
      };
    }
  }, seed);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  await page.goto(BASE + path);
  await context.clock.runFor(1200);
  return { context, page, clock: context.clock };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const card = (page) => tid(page, 'focus-timer');
const state = async (page) => ({
  phase: await card(page).getAttribute('data-phase'),
  status: await card(page).getAttribute('data-status'),
  time: (await tid(page, 'focus-time').innerText()).trim(),
});
const audio = (page) => page.evaluate(() => window.__audio);
const stored = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), FOCUS_KEY);

(async () => {
  const browser = await chromium.launch();

  for (const lang of ['tr', 'en']) {
    const D = DICT[lang];
    await check(`[${lang}] Study Planner shows the focus timer: 25:00, not running, Menti waiting`, async () => {
      const { context, page } = await open(browser, { lang });
      assert(await card(page).isVisible(), 'no focus timer');
      const s = await state(page);
      assert(s.phase === 'work' && s.status === 'idle' && s.time === '25:00', JSON.stringify(s));
      assert((await card(page).innerText()).includes(D['focus.title']), 'title not translated');
      assert((await tid(page, 'menti-focus').getAttribute('data-pose')) === 'wave', 'Menti pose');
      assert((await tid(page, 'menti-focus-bubble').innerText()).trim() === D['menti.focusIdle'], 'Menti text');
      await context.close();
    });
  }

  await check('start, pause and resume: the time is right and does not run while paused', async () => {
    const { context, page, clock } = await open(browser);
    await tid(page, 'focus-start').click();
    await clock.runFor(10 * MIN);
    let s = await state(page);
    assert(s.status === 'running' && s.time === '15:00', JSON.stringify(s));
    assert((await tid(page, 'menti-focus').getAttribute('data-pose')) === 'focused', 'Menti not focused');
    assert((await tid(page, 'focus-start').innerText()).includes('Duraklat'), 'button not Pause');
    await tid(page, 'focus-start').click();
    await clock.runFor(5 * MIN);
    s = await state(page);
    assert(s.status === 'paused' && s.time === '15:00', `paused: ${JSON.stringify(s)}`);
    assert((await tid(page, 'focus-start').innerText()).includes('Devam et'), 'button not Resume');
    await tid(page, 'focus-start').click();
    await clock.runFor(5 * MIN);
    assert((await state(page)).time === '10:00', 'resume');
    await tid(page, 'focus-reset').click();
    s = await state(page);
    assert(s.status === 'idle' && s.time === '25:00', `reset: ${JSON.stringify(s)}`);
    await context.close();
  });

  await check('study block ends → 5-minute break starts with calm Menti and breathing; break ends → waits for the student', async () => {
    const { context, page, clock } = await open(browser);
    await tid(page, 'focus-start').click();
    await clock.runFor(25 * MIN + 1000);
    let s = await state(page);
    assert(s.phase === 'short' && s.status === 'running', JSON.stringify(s));
    assert((await tid(page, 'focus-announce').innerText()).trim() === TR['focus.doneWork'], 'announce');
    assert((await tid(page, 'menti-focus').getAttribute('data-pose')) === 'calm', 'Menti not calm');
    assert((await tid(page, 'focus-set-progress').innerText()).startsWith('1/4'), 'progress');
    const b1 = (await tid(page, 'focus-breathe-text').innerText()).trim();
    await clock.runFor(4000);
    const b2 = (await tid(page, 'focus-breathe-text').innerText()).trim();
    assert([b1, b2].includes(TR['focus.breatheIn']) && [b1, b2].includes(TR['focus.breatheOut']) && b1 !== b2, `breathing ${b1} / ${b2}`);
    await clock.runFor(5 * MIN);
    s = await state(page);
    assert(s.phase === 'work' && s.status === 'idle' && s.time === '25:00', `after break ${JSON.stringify(s)}`);
    assert((await tid(page, 'focus-announce').innerText()).trim() === TR['focus.doneBreak'], 'announce break');
    await context.close();
  });

  await check('after four study blocks comes a 15-minute long break', async () => {
    const { context, page, clock } = await open(browser);
    await tid(page, 'focus-length-15').click();
    for (let i = 1; i <= 4; i += 1) {
      await tid(page, 'focus-start').click();
      await clock.runFor(15 * MIN + 1000);
      const s = await state(page);
      if (i < 4) {
        assert(s.phase === 'short', `block ${i}: ${JSON.stringify(s)}`);
        await clock.runFor(5 * MIN + 1000);
      } else assert(s.phase === 'long' && (s.time === '15:00' || s.time === '14:59'), `long: ${JSON.stringify(s)}`);
    }
    await context.close();
  });

  await check('study length 45 min is saved; length cannot change while running', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'focus-length-45').click();
    assert((await state(page)).time === '45:00', '45:00');
    assert((await stored(page)).workMinutes === 45, 'not saved');
    await tid(page, 'focus-start').click();
    assert(await tid(page, 'focus-length-15').isDisabled(), 'chips enabled while running');
    await context.close();
  });

  await check('settings (length, sound, volume, bell) are remembered after refresh', async () => {
    const { context, page, clock } = await open(browser);
    await tid(page, 'focus-length-15').click();
    await tid(page, 'focus-sound-waves').click();
    await tid(page, 'focus-sound-toggle').click();
    await tid(page, 'focus-volume').fill('20');
    await tid(page, 'focus-chime').uncheck();
    await page.reload();
    await clock.runFor(1200);
    const s = await stored(page);
    assert(s.workMinutes === 15 && s.sound === 'waves' && s.volume === 20 && s.chime === false, JSON.stringify(s));
    assert((await state(page)).time === '15:00', 'length not applied');
    assert((await tid(page, 'focus-volume').inputValue()) === '20', 'volume');
    assert(!(await tid(page, 'focus-chime').isChecked()), 'bell');
    assert((await card(page).getAttribute('data-sound-playing')) === 'none', 'sound must not start by itself after refresh');
    await context.close();
  });

  await check('unreadable saved settings are never overwritten; a note is shown and the timer still works', async () => {
    const { context, page, clock } = await open(browser, { items: [[FOCUS_KEY, '{"broken":true']] });
    assert(await tid(page, 'focus-storage-locked').isVisible(), 'no note');
    await tid(page, 'focus-length-45').click();
    await tid(page, 'focus-start').click();
    await clock.runFor(MIN);
    assert((await state(page)).time === '44:00', 'timer');
    assert((await page.evaluate((k) => localStorage.getItem(k), FOCUS_KEY)) === '{"broken":true', 'overwritten');
    await context.close();
  });

  await check('sounds: nothing plays before a tap; a tap plays, another tap stops; leaving the page stops it', async () => {
    const { context, page } = await open(browser);
    let a = await audio(page);
    assert(a.created === 0 && a.sources === 0, `audio started by itself: ${JSON.stringify(a)}`);
    await tid(page, 'focus-sound-rain').click();
    a = await audio(page);
    assert(a.created === 1 && a.sources === 1, JSON.stringify(a));
    assert((await card(page).getAttribute('data-sound-playing')) === 'rain', 'not playing');
    assert((await tid(page, 'focus-sound-rain').getAttribute('aria-pressed')) === 'true', 'aria-pressed');
    await tid(page, 'focus-sound-noise').click();
    assert((await card(page).getAttribute('data-sound-playing')) === 'noise', 'switch');
    await tid(page, 'focus-sound-toggle').click();
    assert((await card(page).getAttribute('data-sound-playing')) === 'none', 'stop');
    await tid(page, 'focus-sound-toggle').click();
    assert((await card(page).getAttribute('data-sound-playing')) === 'noise', 'play again');
    await tid(page, 'link-home').click();
    await page.waitForTimeout(100);
    a = await audio(page);
    assert(a.closed === 1, `sound kept playing after leaving: ${JSON.stringify(a)}`);
    await context.close();
  });

  await check('bell rings when a block ends, and stays quiet when turned off', async () => {
    let { context, page, clock } = await open(browser);
    await tid(page, 'focus-length-15').click();
    await tid(page, 'focus-start').click();
    await clock.runFor(15 * MIN + 1000);
    assert((await audio(page)).oscillators === 2, `bell: ${JSON.stringify(await audio(page))}`);
    await context.close();
    ({ context, page, clock } = await open(browser));
    await tid(page, 'focus-chime').uncheck();
    await tid(page, 'focus-length-15').click();
    await tid(page, 'focus-start').click();
    await clock.runFor(15 * MIN + 1000);
    assert((await audio(page)).oscillators === 0, 'bell rang although off');
    await context.close();
  });

  await check('only the focus settings key is written, and only when a setting changes (starting the timer writes nothing)', async () => {
    const items = Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);
    const { context, page, clock } = await open(browser, { items });
    const before = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
    await page.evaluate(() => (window.__writes = []));
    await tid(page, 'focus-start').click();
    await clock.runFor(26 * MIN);
    assert((await page.evaluate(() => window.__writes)).length === 0, 'timer wrote to storage');
    await tid(page, 'focus-sound-rain').click();
    await tid(page, 'focus-sound-toggle').click();
    const writes = [...new Set(await page.evaluate(() => window.__writes))];
    assert(writes.length === 1 && writes[0] === FOCUS_KEY, `writes: ${writes.join(', ')}`);
    const after = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
    for (const [k, v] of items) assert(after[k] === v && before[k] === v, `${k} changed`);
    await context.close();
  });

  for (const [time, part, pose] of [
    ['2026-11-05T08:30:00+03:00', 'menti.greetMorning', 'wave'],
    ['2026-11-05T14:00:00+03:00', 'menti.homeHello', 'wave'],
    ['2026-11-05T20:15:00+03:00', 'menti.greetEvening', 'wave'],
    ['2026-11-05T23:40:00+03:00', 'menti.greetNight', 'sleepy'],
    ['2026-11-06T02:00:00+03:00', 'menti.greetNight', 'sleepy'],
  ]) {
    await check(`home at ${time.slice(11, 16)}: Menti says "${part}" (${pose})`, async () => {
      for (const lang of ['tr', 'en']) {
        const { context, page } = await open(browser, { lang, path: '/', time });
        await page.waitForTimeout(50);
        assert((await tid(page, 'menti-home').getAttribute('data-pose')) === pose, `${lang} pose`);
        assert((await tid(page, 'menti-home-bubble').innerText()).trim() === DICT[lang][part], `${lang} text`);
        await context.close();
      }
    });
  }

  await check('Quiz results: below 40% comfort (heart), 40–69% encourage, 70%+ cheer', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await page.selectOption('#quiz-subject', 'Mathematics');
    await tid(page, 'button-start-quiz').click();
    const answer = async (pick) => {
      for (let i = 0; i < 5; i += 1) {
        await pick(i);
        if (i < 4) await tid(page, 'button-quiz-next').click();
      }
      await tid(page, 'button-submit-quiz').click();
    };
    await answer(() => page.locator('[data-testid^="button-quiz-answer-"]').first().click());
    const first = (await page.evaluate(() => JSON.parse(localStorage.getItem('ai-exam-survival:quiz-center:v1'))))[0];
    const right = first.review.map((r) => r.question.correctOptionId);
    const wrong = right.map((id) => ['A', 'B', 'C', 'D'].find((x) => x !== id));
    for (const [n, pose, key] of [[0, 'comfort', 'menti.quizComfort'], [2, 'encourage', 'menti.quizLow'], [3, 'encourage', 'menti.quizLow'], [4, 'cheer', 'menti.quizHigh']]) {
      await tid(page, 'button-retry-quiz').click();
      await answer((i) => tid(page, `button-quiz-answer-${i < n ? right[i] : wrong[i]}`).click());
      const pct = n * 20;
      assert((await tid(page, 'menti-quiz').getAttribute('data-pose')) === pose, `${pct}%: pose ${await tid(page, 'menti-quiz').getAttribute('data-pose')}`);
      assert((await tid(page, 'menti-quiz-bubble').innerText()).trim() === fill(TR[key], { percentage: pct }), `${pct}%: text`);
    }
    await context.close();
  });

  await check('Study Planner: proud Menti only when every session of the week is done', async () => {
    const half = F.planner();
    let { context, page } = await open(browser, { items: [[F.KEYS.planner, JSON.stringify(half)]] });
    assert((await tid(page, 'menti-planner-proud').count()) === 0, 'proud although not done');
    await context.close();
    const all = { ...half, tasks: half.tasks.map((t) => ({ ...t, completed: true })) };
    ({ context, page } = await open(browser, { items: [[F.KEYS.planner, JSON.stringify(all)]] }));
    assert((await tid(page, 'menti-planner-proud').getAttribute('data-pose')) === 'proud', 'no proud Menti');
    assert((await tid(page, 'menti-planner-proud-bubble').innerText()).trim() === TR['menti.plannerProud'], 'text');
    await context.close();
  });

  await check('reduced motion: breathing circle and Menti stay still', async () => {
    const { context, page, clock } = await open(browser, { reducedMotion: 'reduce' });
    await tid(page, 'focus-length-15').click();
    await tid(page, 'focus-start').click();
    await clock.runFor(15 * MIN + 1000);
    const moving = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.target?.closest?.('.menti-figure, .focus-breathe')).length);
    assert(moving === 0, `${moving} animations running`);
    assert(await tid(page, 'focus-breathe-text').isVisible(), 'breathing text missing');
    await context.close();
  });

  for (const [vname, viewport] of Object.entries(VIEWPORTS)) {
    for (const lang of ['tr', 'en']) {
      await check(`[${lang}, ${vname}] focus timer and home fit the screen (idle, running, break)`, async () => {
        const { context, page, clock } = await open(browser, { lang, viewport });
        const bad = [];
        const over = async (where) => {
          const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (o > 0) bad.push(`${where} +${o}px`);
        };
        await over('idle');
        await tid(page, 'focus-start').click();
        await clock.runFor(MIN);
        await over('running');
        await clock.runFor(25 * MIN);
        await over('break');
        await page.goto(`${BASE}/`);
        await clock.runFor(1200);
        await over('home');
        assert(bad.length === 0, bad.join(', '));
        await context.close();
      });
    }
  }

  await check('no JavaScript errors during any Stage 13 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
