// Browser tests for Stage 7: Progress Tracker dashboard. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage07-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:4179';
const PAGE = BASE + '/progress-tracker';
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

async function open(browser, { viewport = { width: 1280, height: 900 }, raw = null, path = PAGE } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'en-US' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  const items = raw ? Object.entries(raw).filter(([, v]) => v !== null).map(([k, v]) => [F.KEYS[k], v]) : [];
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
    // Count every write attempt made while the Progress Tracker is open.
    window.__writes = 0;
    for (const m of ['setItem', 'removeItem', 'clear']) {
      const orig = Storage.prototype[m];
      Storage.prototype[m] = function (...args) {
        if (location.pathname === '/progress-tracker') window.__writes += 1;
        return orig.apply(this, args);
      };
    }
  }, items);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  await page.goto(path);
  return { context, page };
}

const t = (page, id) => page.locator(`[data-testid="${id}"]`);
const tile = async (page, id) => (await t(page, `tile-${id}-value`).innerText()).trim();
const snapshot = (page) => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
const titles = (page, id) => t(page, id).locator('[data-testid="topic-name"]').allInnerTexts();

(async () => {
  const browser = await chromium.launch();

  // ---------- empty student ----------
  {
    const { context, page } = await open(browser);
    await check('empty: friendly start, no invented numbers', async () => {
      assert(await t(page, 'getting-started').isVisible(), 'no getting-started box');
      assert((await tile(page, 'quizzes')) === '0' && (await tile(page, 'average')) === '—' && (await tile(page, 'sessions')) === '—' && (await tile(page, 'mastered')) === '—' && (await tile(page, 'active')) === '0/7', 'tiles wrong');
      for (const s of ['quiz', 'planner', 'flashcards', 'calendar', 'prep']) assert((await t(page, `source-${s}`).getAttribute('data-status')) === 'empty', `${s} not empty`);
      for (const id of ['quiz-trend-empty', 'subjects-empty', 'exams-empty', 'planner-none']) assert(await t(page, id).isVisible(), `${id} missing`);
      assert((await t(page, 'streak-current-value').innerText()) === '0 days', 'streak');
    });
    await check('empty: visiting the tracker saves nothing', async () => {
      assert((await page.evaluate(() => Object.keys(localStorage).filter((k) => k !== 'ai-exam-survival:language:v1').length)) === 0, 'something was saved');
      assert((await page.evaluate(() => window.__writes)) === 0, 'write attempted');
    });
    await context.close();
  }

  // ---------- starter data only (Flashcards opened once) ----------
  {
    const { context, page } = await open(browser, { path: BASE + '/smart-flashcards' });
    await page.goto(PAGE);
    await check('starter decks only: cards counted, nothing rated', async () => {
      assert((await t(page, 'source-flashcards').innerText()).includes('50 cards'), await t(page, 'source-flashcards').innerText());
      assert((await tile(page, 'mastered')) === '0/50', await tile(page, 'mastered'));
      const rows = await page.locator('[data-testid^="subject-row-"]').evaluateAll((els) => els.map((e) => e.dataset.testid));
      assert(rows.join() === 'subject-row-mathematics,subject-row-english,subject-row-biology', rows.join());
      assert((await page.locator('[data-testid="subject-class"]').count()) === 0, 'rated without quiz data');
      assert((await t(page, 'callout-strong').innerText()).includes('Not enough data yet'), 'callout');
      assert((await t(page, 'topics-strong-empty').isVisible()) && (await t(page, 'topics-revise-empty').isVisible()), 'topics should be empty');
    });
    await context.close();
  }

  // ---------- realistic student ----------
  {
    const { context, page } = await open(browser, { raw: F.realisticRaw() });
    const before = await snapshot(page);
    await check('overview tiles', async () => {
      assert((await tile(page, 'quizzes')) === '9', 'quizzes');
      assert((await tile(page, 'average')) === '64%', 'average');
      assert((await tile(page, 'sessions')) === '4/7', 'sessions');
      assert((await tile(page, 'mastered')) === '3/11', 'mastered');
      assert((await tile(page, 'active')) === '7/7', 'active');
      assert((await t(page, 'tile-active').innerText()).includes('11 in the last 30 days'), '30-day note');
      assert((await t(page, 'tile-mastered').innerText()).includes('9 cards reviewed'), 'reviewed note');
      assert(!(await t(page, 'getting-started').isVisible().catch(() => false)), 'getting-started shown');
    });
    await check('sources show what was read', async () => {
      assert((await t(page, 'source-quiz').innerText()).includes('9 quizzes'), 'quiz');
      assert((await t(page, 'source-planner').innerText()).includes('7 sessions planned'), 'planner');
      assert((await t(page, 'source-calendar').innerText()).includes('4 exams'), 'calendar');
      assert((await t(page, 'source-prep').innerText()).includes('3 steps'), 'prep');
    });
    await check('weekly activity bars match the saved dates', async () => {
      const totals = await page.locator('[data-testid^="week-day-"]').evaluateAll((els) => els.map((e) => `${e.dataset.testid.slice(9)}=${e.dataset.total}`));
      assert(totals.join(' ') === '2026-10-30=1 2026-10-31=4 2026-11-01=6 2026-11-02=2 2026-11-03=3 2026-11-04=2 2026-11-05=1', totals.join(' '));
      assert((await t(page, 'text-activity-note').innerText()).includes('approximation'), 'approximation note missing');
    });
    await check('streak and planned vs completed', async () => {
      assert((await t(page, 'streak-current-value').innerText()) === '7 days', 'current');
      assert((await t(page, 'streak-best-value').innerText()) === '7 days', 'best');
      assert((await t(page, 'planner-done').innerText()) === '4 of 7 sessions', 'planner done');
      assert((await t(page, 'planner-due').innerText()) === '3 of 4 sessions due so far are done · 100 of 175 minutes', await t(page, 'planner-due').innerText());
    });
    await check('quiz scores chart shows all 9 quizzes', async () => {
      assert(await t(page, 'quiz-chart').isVisible(), 'no chart');
      assert((await t(page, 'quiz-chart').locator('circle').count()) === 9, 'not 9 points');
    });
    await check('strong and weak subjects come from real quiz answers', async () => {
      assert((await t(page, 'callout-strong').innerText()).endsWith('Biology'), await t(page, 'callout-strong').innerText());
      assert((await t(page, 'callout-weak').innerText()).endsWith('History'), await t(page, 'callout-weak').innerText());
    });
    await check('Mathematics is a heading; Algebra I and Mathematics quizzes stay separate rows', async () => {
      const group = t(page, 'subject-group-mathematics');
      const rows = await group.locator('[data-testid^="subject-row-"]').evaluateAll((els) => els.map((e) => e.dataset.testid));
      assert(rows.join() === 'subject-row-algebra-1,subject-row-mathematics', rows.join());
      const alg = t(page, 'subject-row-algebra-1');
      assert((await alg.locator('[data-testid="subject-sessions"]').innerText()).startsWith('1 of 2'), 'algebra sessions');
      assert((await alg.locator('[data-testid="subject-quiz-average"]').count()) === 0, 'algebra got quiz data');
      const math = t(page, 'subject-row-mathematics');
      assert((await math.locator('[data-testid="subject-quiz-average"]').innerText()) === '60%', 'math avg');
      assert((await math.locator('[data-testid="subject-accuracy"]').innerText()) === '60%', 'math accuracy');
      assert((await math.locator('[data-testid="subject-trend"]').innerText()).includes('Improving'), 'trend');
      assert((await math.innerText()).includes('not split by course'), 'source note');
    });
    await check('English and History headings keep their own rows', async () => {
      const en = await t(page, 'subject-group-english').locator('[data-testid^="subject-row-"]').evaluateAll((els) => els.map((e) => e.dataset.testid));
      assert(en.join() === 'subject-row-english,subject-row-ela', en.join());
      const hi = await t(page, 'subject-group-history').locator('[data-testid^="subject-row-"]').evaluateAll((els) => els.map((e) => e.dataset.testid));
      assert(hi.join() === 'subject-row-history,subject-row-world-history', hi.join());
    });
    await check('subject ratings and correct-answer percentages', async () => {
      const cls = async (key) => (await t(page, `subject-row-${key}`).locator('[data-testid="subject-class"]').innerText()).toLowerCase();
      assert((await cls('biology')) === 'strong', 'biology');
      assert((await cls('history')) === 'needs work', 'history');
      assert((await cls('chemistry')) === 'not enough data yet', 'chemistry');
      assert((await t(page, 'subject-row-biology').locator('[data-testid="subject-accuracy"]').innerText()) === '80%', 'bio accuracy');
      assert((await t(page, 'subject-row-biology').locator('[data-testid="subject-cards"]').innerText()) === '0 of 5', 'bio cards');
    });
    await check('topics going well and to revise', async () => {
      const strong = await titles(page, 'topics-strong');
      assert(strong.join('|') === 'Cells & Genetics|Human Biology', strong.join('|'));
      const revise = await titles(page, 'topics-revise');
      assert(revise.join('|') === 'Cells & organelles|Modern World|Algebra|Evolution & Ecology', revise.join('|'));
      assert((await t(page, 'topics-note').innerText()).startsWith('3 topics are between 60% and 79%, and 0 topics have too few answers'), await t(page, 'topics-note').innerText());
    });
    await check('exam readiness shows facts only', async () => {
      const bio = t(page, 'exam-facts-e-bio');
      assert((await bio.locator('[data-testid="exam-countdown"]').innerText()) === 'Tomorrow', 'countdown');
      assert((await bio.locator('[data-testid="exam-prep"]').innerText()).includes('2 of 3 done'), 'prep');
      assert((await bio.locator('[data-testid="exam-planner"]').innerText()).includes('3 of 3 done'), 'planner');
      assert((await bio.locator('[data-testid="exam-quiz"]').innerText()).includes('90% on November 4, 2026'), 'quiz');
      const alg = t(page, 'exam-facts-e-alg');
      assert((await alg.locator('[data-testid="exam-prep"]').innerText()).includes('No steps yet'), 'alg prep');
      assert((await alg.locator('[data-testid="exam-quiz"]').innerText()).includes('No quiz results'), 'alg quiz');
      assert((await t(page, 'exam-facts-e-old').count()) === 0, 'past exam shown');
      const text = await t(page, 'panel-exams').innerText();
      assert(!/ready|readiness:\s*\d|\d+% ready/i.test(text.replace('Exam readiness', '').replace('not a readiness score', '')), 'invented readiness');
    });
    await check('refresh shows the same numbers', async () => {
      await page.reload();
      assert((await tile(page, 'average')) === '64%' && (await t(page, 'streak-current-value').innerText()) === '7 days', 'changed after refresh');
    });
    await check('the tracker never writes; all saved data is byte-for-byte the same', async () => {
      assert((await page.evaluate(() => window.__writes)) === 0, 'write attempted');
      assert((await snapshot(page)) === before, 'saved data changed');
    });
    await check('new activity elsewhere shows up when you come back to the page', async () => {
      await page.evaluate((key) => {
        const list = JSON.parse(localStorage.getItem(key));
        const copy = JSON.parse(JSON.stringify(list[0]));
        copy.id = 'q10';
        copy.completedAt = '2026-11-05T09:30:00+03:00';
        list.unshift(copy);
        Object.getPrototypeOf(localStorage).setItem.call(localStorage, key, JSON.stringify(list));
        window.__writes = 0;
        window.dispatchEvent(new Event('focus'));
      }, F.KEYS.quiz);
      await page.waitForTimeout(100);
      assert((await tile(page, 'quizzes')) === '10', `quizzes ${await tile(page, 'quizzes')}`);
      assert((await page.evaluate(() => window.__writes)) <= 1, 'tracker wrote');
    });
    await check('average matches Quiz Center exactly', async () => {
      const mine = await tile(page, 'average');
      await page.goto(BASE + '/quiz-center');
      const label = page.locator('p', { hasText: /^\s*Average score\s*$/ }).first();
      const theirs = (await label.locator('xpath=following-sibling::p[1]').innerText()).trim();
      assert(mine === theirs, `tracker ${mine} vs Quiz Center ${theirs}`);
    });
    await check('recommendation links open the right tool', async () => {
      await page.goto(PAGE);
      await t(page, 'topics-revise').locator('[data-testid="topic-link"]').first().click();
      await page.waitForTimeout(300);
      assert((await page.locator('h1').first().innerText()) === 'Smart Flashcards', await page.locator('h1').first().innerText());
    });
    await context.close();
  }

  // ---------- damaged data ----------
  {
    const raw = F.realisticRaw();
    raw.quiz = '{broken';
    raw.prep = JSON.stringify({ version: 1, steps: [{ id: 'x' }] });
    const { context, page } = await open(browser, { raw });
    await check('damaged data: warning, only that part is skipped, nothing overwritten', async () => {
      assert((await t(page, 'source-quiz').getAttribute('data-status')) === 'damaged', 'quiz status');
      assert((await t(page, 'source-prep').getAttribute('data-status')) === 'damaged', 'prep status');
      assert((await t(page, 'message-damaged').innerText()).includes('Quiz Center, Preparation steps'), 'message');
      assert((await tile(page, 'quizzes')) === '0' && (await tile(page, 'average')) === '—', 'quiz tiles');
      assert((await tile(page, 'sessions')) === '4/7', 'planner still shown');
      assert((await t(page, 'exam-facts-e-bio').locator('[data-testid="exam-prep"]').innerText()).includes('No steps yet'), 'prep skipped');
      const stored = await page.evaluate((k) => localStorage.getItem(k), F.KEYS.quiz);
      assert(stored === '{broken', 'damaged data overwritten');
    });
    await context.close();
  }

  // ---------- layouts ----------
  for (const [name, viewport, perRow] of [
    ['phone', { width: 390, height: 844 }, 2],
    ['tablet portrait', { width: 800, height: 1280 }, 3],
    ['tablet landscape', { width: 1280, height: 800 }, 5],
  ]) {
    const { context, page } = await open(browser, { viewport, raw: F.realisticRaw() });
    await check(`[${name}] nothing runs off the screen`, async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });
    await check(`[${name}] ${perRow} overview tiles per row`, async () => {
      const tops = await t(page, 'overview').locator(':scope > div').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
      const firstRow = tops.filter((y) => y === tops[0]).length;
      assert(firstRow === perRow, `${firstRow} in the first row`);
    });
    await check(`[${name}] weekly chart and consistency ${viewport.width >= 1024 ? 'side by side' : 'stacked'}`, async () => {
      const a = await t(page, 'panel-week').boundingBox();
      const b = await t(page, 'panel-consistency').boundingBox();
      assert((b.x > a.x + a.width - 5) === viewport.width >= 1024, 'layout wrong');
    });
    await check(`[${name}] subject rows readable (${viewport.width >= 768 ? 'table' : 'cards with labels'})`, async () => {
      const label = t(page, 'subject-row-biology').locator('p', { hasText: 'Quiz average' });
      assert((await label.isVisible()) === viewport.width < 768, 'label visibility wrong');
      const box = await t(page, 'subject-row-biology').boundingBox();
      assert(box.width <= viewport.width, 'row too wide');
    });
    await check(`[${name}] charts fit their panels`, async () => {
      for (const id of ['weekly-chart', 'quiz-chart']) {
        const c = await t(page, id).boundingBox();
        assert(c && c.width > 200 && c.x >= 0 && c.x + c.width <= viewport.width, `${id} ${c && Math.round(c.width)}px`);
      }
    });
    await context.close();
  }

  await check('no JavaScript errors during any Stage 7 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== STAGE 7 (Progress Tracker): ${results.length - failed.length}/${results.length} passed ===`);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
  process.exit(failed.length ? 1 : 0);
})();
