// Browser tests for Stage 10: Menti, the mascot. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage10-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const { EN, TR } = require('../out/dict.cjs');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const QUIZ_KEY = 'ai-exam-survival:quiz-center:v1';
const DICT = { tr: TR, en: EN };
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
const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  'tablet portrait': { width: 800, height: 1280 },
  'tablet landscape': { width: 1280, height: 800 },
};
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));

async function open(browser, { viewport = VIEWPORTS['tablet landscape'], lang = 'tr', items = [], path = '/', reducedMotion = 'no-preference' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  const seed = lang ? [[LANG_KEY, lang], ...items] : items;
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
  }, seed);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  page.on('dialog', (d) => d.dismiss());
  await page.goto(BASE + path);
  await page.waitForTimeout(150);
  return { context, page };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const storage = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));

async function mentiInfo(page, id) {
  const m = tid(page, id);
  await m.waitFor({ state: 'visible', timeout: 4000 });
  const bubble = tid(page, `${id}-bubble`);
  return {
    pose: await m.getAttribute('data-pose'),
    text: (await bubble.count()) ? (await bubble.innerText()).trim() : '',
    label: await m.locator('svg[role="img"]').getAttribute('aria-label'),
  };
}

async function finishQuiz(page, choose) {
  await tid(page, 'button-start-quiz').click();
  const total = await page.locator('[data-testid^="button-quiz-answer-"]').count() ? 5 : 0;
  for (let i = 0; i < total; i += 1) {
    await choose(i);
    if (i < total - 1) await tid(page, 'button-quiz-next').click();
  }
  await tid(page, 'button-submit-quiz').click();
  await tid(page, 'menti-quiz').waitFor();
}

(async () => {
  const browser = await chromium.launch();

  await check('the browser tab icon is Menti (no more orange square)', async () => {
    const { context, page } = await open(browser);
    const href = await page.getAttribute('link[rel="icon"]', 'href');
    const svg = await (await page.request.get(new URL(href, BASE + '/').href)).text();
    assert(svg.includes('data-menti-pose') && !/#FF3C00/i.test(svg), 'favicon is not Menti');
    await context.close();
  });

  for (const lang of ['tr', 'en']) {
    const D = DICT[lang];

    await check(`[${lang}] home: Menti waves and greets the student`, async () => {
      const { context, page } = await open(browser, { lang });
      await page.waitForTimeout(900);
      const m = await mentiInfo(page, 'menti-home');
      assert(m.pose === 'wave', `pose ${m.pose}`);
      // Stage 13: the greeting follows the time of day; the test clock is 10:00 (morning).
      assert(m.text === D['menti.greetMorning'], `text "${m.text}"`);
      assert(m.label === D['menti.label'], `label "${m.label}"`);
      await context.close();
    });

    await check(`[${lang}] AI Study Coach: thinking Menti on a wide screen, Menti's face on a tablet in portrait`, async () => {
      let { context, page } = await open(browser, { lang, path: '/ai-study-coach' });
      const m = await mentiInfo(page, 'menti-coach');
      assert(m.pose === 'think' && m.text === D['menti.coach'], `${m.pose} "${m.text}"`);
      await context.close();
      ({ context, page } = await open(browser, { lang, path: '/ai-study-coach', viewport: VIEWPORTS['tablet portrait'] }));
      assert(await tid(page, 'menti-coach-face').isVisible(), 'face not shown');
      assert(!(await tid(page, 'menti-coach').isVisible()), 'big Menti shown on a narrow screen');
      await context.close();
    });

    await check(`[${lang}] Quiz Center: Menti encourages after a low score and cheers after a high score`, async () => {
      const { context, page } = await open(browser, { lang, path: '/quiz-center', viewport: VIEWPORTS['tablet portrait'] });
      // First try: always the second option (scores low on the sample quiz).
      await finishQuiz(page, () => page.locator('[data-testid^="button-quiz-answer-"]').nth(1).click());
      const first = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), QUIZ_KEY))[0];
      let m = await mentiInfo(page, 'menti-quiz');
      // Stage 13: three levels – 70% or more cheer, 40–69% encourage, below 40% comfort.
      const lowExpected = first.percentage >= 70 ? fill(D['menti.quizHigh'], { percentage: first.percentage }) : first.percentage >= 40 ? D['menti.quizLow'] : D['menti.quizComfort'];
      assert(m.text === lowExpected, `after ${first.percentage}%: "${m.text}"`);
      assert(m.pose === (first.percentage >= 70 ? 'cheer' : first.percentage >= 40 ? 'encourage' : 'comfort'), `pose ${m.pose}`);
      // Retry the same questions with the correct answers.
      await tid(page, 'button-retry-quiz').click();
      const correct = first.review.map((r) => r.question.correctOptionId);
      for (let i = 0; i < correct.length; i += 1) {
        await tid(page, `button-quiz-answer-${correct[i]}`).click();
        if (i < correct.length - 1) await tid(page, 'button-quiz-next').click();
      }
      await tid(page, 'button-submit-quiz').click();
      m = await mentiInfo(page, 'menti-quiz');
      assert(m.pose === 'cheer', `pose ${m.pose}`);
      assert(m.text === fill(D['menti.quizHigh'], { percentage: 100 }), `text "${m.text}"`);
      await context.close();
    });

    await check(`[${lang}] Smart Flashcards: Menti claps when a round is finished`, async () => {
      const { context, page } = await open(browser, { lang, path: '/smart-flashcards' });
      await tid(page, 'tab-mode-practice').click();
      for (let i = 0; i < 60 && !(await tid(page, 'session-summary').count()); i += 1) {
        await tid(page, 'button-flashcard-flip').click();
        await tid(page, 'button-mark-know').click();
      }
      const m = await mentiInfo(page, 'menti-flashcards');
      assert(m.pose === 'clap' && m.text === D['menti.flashDone'], `${m.pose} "${m.text}"`);
      await context.close();
    });

    await check(`[${lang}] empty Study Planner, Exam Calendar and Progress Tracker: Menti shows the way`, async () => {
      const { context, page } = await open(browser, { lang, path: '/study-planner' });
      for (const [path, id, key] of [
        ['/study-planner', 'menti-planner', 'menti.plannerEmpty'],
        ['/exam-calendar', 'menti-calendar', 'menti.calendarEmpty'],
        ['/progress-tracker', 'menti-progress', 'menti.progressEmpty'],
      ]) {
        await page.goto(BASE + path);
        const m = await mentiInfo(page, id);
        assert(m.text === D[key], `${path}: "${m.text}"`);
      }
      await context.close();
    });

    await check(`[${lang}] page not found: surprised Menti and a button back to the home page`, async () => {
      const { context, page } = await open(browser, { lang, path: '/no-such-page' });
      const m = await mentiInfo(page, 'menti-not-found');
      assert(m.pose === 'surprised' && m.text === D['menti.notFound'], `${m.pose} "${m.text}"`);
      assert((await tid(page, 'link-not-found-home').innerText()).trim() === D['menti.goHome'], 'button text');
      await tid(page, 'link-not-found-home').click();
      await page.waitForTimeout(150);
      assert(new URL(page.url()).pathname === '/', `went to ${page.url()}`);
      await context.close();
    });
  }

  await check('with saved data, the "empty" Menti messages are not shown and saved data stays exactly the same', async () => {
    const items = Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);
    const { context, page } = await open(browser, { items, path: '/study-planner' });
    const before = await storage(page);
    for (const [path, id] of [['/study-planner', 'menti-planner'], ['/exam-calendar', 'menti-calendar'], ['/progress-tracker', 'menti-progress']]) {
      await page.goto(BASE + path);
      await page.waitForTimeout(150);
      assert((await tid(page, id).count()) === 0, `${id} shown although there is data`);
    }
    for (const p of ['/', '/quiz-center', '/smart-flashcards', '/ai-study-coach', '/nope']) {
      await page.goto(BASE + p);
      await page.waitForTimeout(120);
    }
    const after = await storage(page);
    assert(JSON.stringify(before) === JSON.stringify(after), 'saved data changed');
    await context.close();
  });

  for (const [vname, viewport] of Object.entries(VIEWPORTS)) {
    for (const lang of ['tr', 'en']) {
      await check(`[${lang}, ${vname}] Menti fits the screen and does not cover buttons or text`, async () => {
        const { context, page } = await open(browser, { lang, viewport });
        await page.waitForTimeout(900);
        const bad = [];
        for (const path of ['/', '/ai-study-coach', '/study-planner', '/exam-calendar', '/progress-tracker', '/no-such-page']) {
          if (path !== '/') await page.goto(BASE + path);
          await page.waitForTimeout(path === '/' ? 0 : 200);
          const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (o > 0) bad.push(`${path} wider by ${o}px`);
          const covered = await page.evaluate(() => {
            const out = [];
            const mentis = [...document.querySelectorAll('[data-testid^="menti"]')].filter((m) => m.getBoundingClientRect().width > 0);
            for (const el of document.querySelectorAll('a, button, h1, h2, p, select, input')) {
              if (el.closest('[data-testid^="menti"]')) continue;
              const r = el.getBoundingClientRect();
              if (!r.width || !r.height) continue;
              for (const m of mentis) {
                for (const part of m.querySelectorAll('.menti-figure, .menti-bubble')) {
                  const q = part.getBoundingClientRect();
                  const w = Math.min(r.right, q.right) - Math.max(r.left, q.left);
                  const h = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
                  if (w > 4 && h > 4) out.push(`${(el.textContent || el.tagName).trim().slice(0, 30)}`);
                }
              }
            }
            return out;
          });
          if (covered.length) bad.push(`${path} covers: ${covered.slice(0, 3).join(' / ')}`);
          const cut = await page.evaluate(() =>
            [...document.querySelectorAll('.menti-bubble')].filter((b) => { const r = b.getBoundingClientRect(); const t = b.querySelector('span.block'); return r.width > 0 && (t.scrollWidth > t.clientWidth + 1 || r.left < 0 || r.right > innerWidth); }).length,
          );
          if (cut) bad.push(`${path} bubble cut off`);
        }
        assert(bad.length === 0, bad.join(', '));
        await context.close();
      });
    }
  }

  await check('Menti moves normally, and stays still when the device asks for reduced motion', async () => {
    const count = (page) => page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.menti-figure')).length);
    let { context, page } = await open(browser, { path: '/no-such-page' });
    assert((await count(page)) > 0, 'Menti does not move');
    await context.close();
    ({ context, page } = await open(browser, { path: '/no-such-page', reducedMotion: 'reduce' }));
    assert((await count(page)) === 0, 'Menti moves although reduced motion is on');
    await context.close();
  });

  await check('Menti does not save anything: visiting every page with no data writes no new keys', async () => {
    const { context, page } = await open(browser, { lang: null });
    for (const p of ['/', '/ai-study-coach', '/study-planner', '/exam-calendar', '/progress-tracker', '/no-such-page']) {
      await page.goto(BASE + p);
      await page.waitForTimeout(150);
    }
    const keys = Object.keys(await storage(page));
    const unexpected = keys.filter((k) => !k.startsWith('ai-exam-survival:') || /menti|mascot/i.test(k));
    assert(unexpected.length === 0, `unexpected keys: ${unexpected.join(', ')}`);
    assert(!keys.includes(LANG_KEY), 'language saved without tapping TR/EN');
    await context.close();
  });

  await check('no JavaScript errors during any Stage 10 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
