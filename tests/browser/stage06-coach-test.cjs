// Browser tests for Stage 6: AI Study Coach. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage06-coach-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4178';
const PAGE = BASE + '/ai-study-coach';
const KEY = 'ai-exam-survival:study-coach:v1';
const CAL_KEY = 'ai-exam-survival:exam-calendar:v1';
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

async function open(browser, { viewport = { width: 1280, height: 900 }, items = [], permissions = [] } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'en-US', permissions });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript((list) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const [k, v] of list) localStorage.setItem(k, v);
  }, items);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  await page.goto(PAGE);
  return { context, page };
}

const t = (page, id) => page.locator(`[data-testid="${id}"]`);
const summary = async (page) => (await t(page, 'plan-summary').locator('li').allInnerTexts()).join(' | ');
const stat = async (page, id) => (await t(page, id).locator('dd').innerText()).trim();
const actions = (page) => t(page, 'plan-action').locator('p').allInnerTexts();

async function fill(page, { grade, subject, topic, difficulty, problem, date }) {
  if (grade) await t(page, 'select-coach-grade').selectOption(grade);
  if (subject) await t(page, 'select-coach-subject').selectOption(subject);
  if (topic !== undefined) await t(page, 'input-coach-topic').fill(topic);
  if (difficulty) await t(page, `radio-difficulty-${difficulty}`).check({ force: true });
  if (problem) await t(page, 'select-coach-problem').selectOption(problem);
  if (date !== undefined) await t(page, 'input-coach-date').fill(date);
  await t(page, 'button-coach-submit').click();
}

const exam = (id, subject, grade, title, date, notes = '') => ({ id, subject, grade, title, date, time: '', notes, createdAt: '2026-11-01T00:00:00Z' });
const CALENDAR = JSON.stringify({ version: 1, exams: [exam('geo', 'Geometry', '11', 'Triangles test', '2026-11-09', 'Triangle area and angles'), exam('old', 'Biology', '9', 'Past quiz', '2026-11-01'), exam('es', 'Spanish', '10', 'Spanish oral', '2026-11-20')] });

(async () => {
  const browser = await chromium.launch();

  // ---------- first visit, making a plan, saving ----------
  {
    const { context, page } = await open(browser);
    await check('first visit shows a clearly labelled example plan', async () => {
      assert(await t(page, 'badge-example').isVisible(), 'no example badge');
      assert((await summary(page)) === 'Grade 10 | Biology | Genetics and DNA | Somewhat hard | Exam in 7 days', await summary(page));
      assert((await stat(page, 'stat-days-left')) === '7' && (await stat(page, 'stat-minutes')) === '50' && (await stat(page, 'stat-sessions')) === '2', 'time plan wrong');
      assert((await t(page, 'plan-action').count()) === 4, 'not 4 actions');
      assert((await t(page, 'plan-strategy').count()) === 3, 'not 3 strategies');
      assert((await t(page, 'text-coach-status').innerText()).includes('no live AI'), 'no-AI label missing');
      assert(!(await page.evaluate((k) => localStorage.getItem(k), KEY)), 'example was saved without asking');
    });
    await check('grade 12 Physics, very hard, runs out of time, exam in 3 days', async () => {
      await fill(page, { grade: '12', subject: 'Physics', topic: 'Electricity', difficulty: 'very-hard', problem: 'time', date: '2026-11-08' });
      assert(!(await t(page, 'badge-example').isVisible().catch(() => false)), 'still marked as example');
      assert((await summary(page)) === 'Grade 12 | Physics | Electricity | Very hard | Exam in 3 days', await summary(page));
      assert((await stat(page, 'stat-minutes')) === '75' && (await stat(page, 'stat-sessions')) === '3', 'time plan wrong');
      const a = await actions(page);
      assert(a[0].startsWith('Start with the basics of Electricity'), a[0]);
      assert(a.some((x) => x.includes('Physics practice quiz')), 'no quiz action');
      assert((await t(page, 'plan-strategy').first().innerText()).match(/Given → Find|Timed problem sets/), 'first strategy not about time/steps');
      assert((await t(page, 'text-grade-tip').innerText()).includes('grade 12'), 'grade tip');
      assert((await t(page, 'text-problem-tip').innerText()).includes('how many minutes'), 'problem tip');
    });
    await check('the plan changes with difficulty (comfortable → less time + a challenge)', async () => {
      await fill(page, { difficulty: 'comfortable' });
      assert((await stat(page, 'stat-minutes')) === '25', `minutes ${await stat(page, 'stat-minutes')}`);
      const a = await actions(page);
      assert(a[a.length - 1].startsWith('Challenge yourself'), a[a.length - 1]);
    });
    await check('exam today: short, light plan', async () => {
      await fill(page, { date: '2026-11-05', difficulty: 'somewhat-hard' });
      assert((await summary(page)).endsWith('Exam today'), await summary(page));
      assert((await stat(page, 'stat-minutes')) === '20' && (await t(page, 'plan-action').count()) === 3, 'exam day plan wrong');
    });
    await check('no exam date: suggests adding the exam to the calendar', async () => {
      await fill(page, { date: '' });
      assert((await summary(page)).endsWith('No exam date') && (await stat(page, 'stat-days-left')) === '—', 'no-date summary');
      assert((await t(page, 'plan-actions').innerText()).includes('Open Exam Calendar'), 'no calendar link');
    });
    await check('exam nerves tip points to a teacher or school counsellor', async () => {
      await fill(page, { problem: 'nerves' });
      assert((await t(page, 'text-problem-tip').innerText()).includes('school counsellor'), 'missing');
    });
    await check('a past exam date is refused with a clear message', async () => {
      await t(page, 'input-coach-date').fill('2026-11-01');
      await t(page, 'button-coach-submit').click();
      assert((await t(page, 'coach-errors').innerText()).includes('already passed'), 'no error');
      assert((await summary(page)).endsWith('No exam date'), 'plan changed on error');
    });
    await check('an impossible date typed by hand is refused', async () => {
      await page.evaluate(() => { document.querySelector('[data-testid="input-coach-date"]').type = 'text'; });
      await t(page, 'input-coach-date').fill('2027-02-29');
      await t(page, 'button-coach-submit').click();
      assert((await t(page, 'coach-errors').innerText()).includes('real exam date'), 'bad date accepted');
      await page.reload();
    });
    await check('the last request is remembered after a refresh', async () => {
      assert((await summary(page)) === 'Grade 12 | Physics | Electricity | Somewhat hard | No exam date', await summary(page));
      assert((await t(page, 'select-coach-subject').inputValue()) === 'Physics' && (await t(page, 'select-coach-problem').inputValue()) === 'nerves', 'form not restored');
      const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
      assert(saved.version === 1 && saved.request.subject === 'Physics', 'not saved');
    });
    await check('"Start over" clears the form but keeps the plan until you ask again', async () => {
      await t(page, 'button-coach-reset').click();
      assert((await t(page, 'select-coach-grade').inputValue()) === '9' && (await t(page, 'input-coach-topic').inputValue()) === '', 'form not cleared');
      assert((await summary(page)).startsWith('Grade 12 | Physics'), 'plan cleared too early');
    });
    await check('topic ideas change with the subject', async () => {
      await t(page, 'select-coach-subject').selectOption('History');
      const ideas = await page.locator('#coach-topic-ideas option').evaluateAll((els) => els.map((e) => e.value));
      assert(ideas.includes('Causes of World War I'), ideas.join(','));
    });
    await check('action links open the right tools', async () => {
      await fill(page, { subject: 'Biology', topic: 'Cells', date: '2026-11-12' });
      await t(page, 'plan-action-link').filter({ hasText: 'Open Smart Flashcards' }).first().click();
      await page.waitForTimeout(300);
      assert((await page.locator('h1').first().innerText()) === 'Smart Flashcards', 'flashcards not opened');
      await page.goBack();
      await page.waitForTimeout(300);
      await t(page, 'plan-action-link').filter({ hasText: 'Open Quiz Center' }).first().click();
      await page.waitForTimeout(300);
      assert((await page.locator('h1').first().innerText()) === 'Quiz Center', 'quiz not opened');
    });
    await context.close();
  }

  // ---------- Exam Calendar (read only) and other saved data ----------
  {
    const others = [
      [CAL_KEY, CALENDAR],
      ['ai-exam-survival:study-planner:v1', '{"marker":"planner"}'],
      ['ai-exam-survival:flashcards:v1', '{"marker":"flashcards"}'],
      ['ai-exam-survival:exam-prep:v1', '{"marker":"prep"}'],
    ];
    const { context, page } = await open(browser, { items: others });
    await check('"Start from one of my exams" lists upcoming calendar exams only', async () => {
      const options = await t(page, 'select-coach-exam').locator('option').allInnerTexts();
      assert(options.length === 3, options.join(' / '));
      assert(options[1].startsWith('Triangles test · Geometry · In 4 days') && options[2].startsWith('Spanish oral'), options.join(' / '));
    });
    await check('choosing an exam fills the form and makes a plan', async () => {
      await t(page, 'select-coach-exam').selectOption('geo');
      assert((await summary(page)) === 'Grade 11 | Mathematics | Triangle area and angles | Somewhat hard | Exam in 4 days', await summary(page));
      assert((await t(page, 'input-coach-date').inputValue()) === '2026-11-09', 'date not filled');
      assert((await t(page, 'coach-notice').innerText()).includes('Triangles test'), 'no notice');
    });
    await check('Spanish exam maps to Foreign Language with no quiz link', async () => {
      await t(page, 'select-coach-exam').selectOption('es');
      assert((await summary(page)).includes('Foreign Language'), await summary(page));
      assert(!(await t(page, 'plan-actions').innerText()).includes('Open Quiz Center'), 'quiz link for a subject without questions');
    });
    await check('other tools’ saved data is untouched', async () => {
      const after = await page.evaluate((keys) => keys.map((k) => localStorage.getItem(k)), others.map(([k]) => k));
      others.forEach(([k, v], i) => assert(after[i] === v, `${k} changed`));
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser);
    await check('no calendar exams: the "start from an exam" box is hidden', async () => {
      assert((await t(page, 'select-coach-exam').count()) === 0, 'shown without exams');
    });
    await check('the coach saves under its own key only', async () => {
      await fill(page, { subject: 'Chemistry' });
      const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k !== 'ai-exam-survival:language:v1'));
      assert(keys.length === 1 && keys[0] === KEY, keys.join(','));
    });
    await context.close();
  }
  {
    const old = JSON.stringify({ version: 1, request: { grade: '9', subject: 'History', topic: 'Revolutions', difficulty: 'very-hard', problem: 'understand', examDate: '2026-11-01' } });
    const { context, page } = await open(browser, { items: [[KEY, old]] });
    await check('a saved exam date that has passed is cleared, with a note', async () => {
      assert((await t(page, 'coach-notice').innerText()).includes('has passed'), 'no note');
      assert((await summary(page)) === 'Grade 9 | History | Revolutions | Very hard | No exam date', await summary(page));
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser, { items: [[KEY, '{broken']] });
    await check('damaged saved data: warning shown, not overwritten, coach still works', async () => {
      assert(await t(page, 'message-coach-storage').isVisible(), 'no warning');
      await fill(page, { subject: 'Geography' });
      assert((await summary(page)).includes('Geography'), 'coach not working');
      assert((await page.evaluate((k) => localStorage.getItem(k), KEY)) === '{broken', 'overwritten');
    });
    await context.close();
  }

  // ---------- copying the practice question ----------
  {
    const { context, page } = await open(browser, { permissions: ['clipboard-read', 'clipboard-write'] });
    await check('"Copy question" copies the practice question', async () => {
      await t(page, 'button-copy-prompt').click();
      assert((await t(page, 'copy-status').innerText()) === 'Copied', 'no confirmation');
      const clip = await page.evaluate(() => navigator.clipboard.readText());
      assert(clip === (await t(page, 'text-prompt').inputValue()) && clip.startsWith('I am a grade 10 student studying Genetics and DNA in Biology.'), clip);
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser);
    await check('if copying is blocked, the text is selected for manual copying', async () => {
      await page.evaluate(() => { navigator.clipboard.writeText = () => Promise.reject(new Error('blocked')); });
      await t(page, 'button-copy-prompt').click();
      assert((await t(page, 'copy-status').innerText()).includes('Press and hold'), 'no fallback message');
      const selected = await page.evaluate(() => { const el = document.querySelector('[data-testid="text-prompt"]'); return el.selectionEnd - el.selectionStart; });
      assert(selected > 20, 'text not selected');
    });
    await context.close();
  }

  // ---------- layouts ----------
  for (const [name, viewport] of [
    ['phone', { width: 390, height: 844 }],
    ['tablet portrait', { width: 800, height: 1280 }],
    ['tablet landscape', { width: 1280, height: 800 }],
  ]) {
    const { context, page } = await open(browser, { viewport });
    await check(`[${name}] nothing runs off the screen`, async () => {
      await fill(page, { topic: 'A long topic name that should wrap nicely on a narrow screen', difficulty: 'very-hard', problem: 'nerves' });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });
    await check(`[${name}] form and plan ${viewport.width >= 1024 ? 'side by side' : 'stacked'}`, async () => {
      const a = await t(page, 'panel-coach-form').boundingBox();
      const b = await t(page, 'panel-plan').boundingBox();
      assert((b.x > a.x + a.width - 5) === viewport.width >= 1024, 'layout wrong');
    });
    if (viewport.width < 1024) {
      await check(`[${name}] after asking, the page scrolls to the plan`, async () => {
        await page.evaluate(() => window.scrollTo(0, 0));
        await t(page, 'button-coach-submit').click();
        await page.waitForTimeout(800);
        const top = await t(page, 'coach-results').evaluate((el) => el.getBoundingClientRect().top);
        assert(top > -10 && top < 160, `plan top at ${Math.round(top)}px`);
      });
    }
    await check(`[${name}] buttons and choices are big enough to tap`, async () => {
      for (const id of ['button-coach-submit', 'button-coach-reset', 'button-copy-prompt']) {
        const box = await t(page, id).boundingBox();
        assert(box && box.height >= 40, `${id} ${box && Math.round(box.height)}px`);
      }
      const choice = await page.locator('label:has([data-testid="radio-difficulty-very-hard"])').boundingBox();
      assert(choice && choice.height >= 44, `difficulty ${Math.round(choice.height)}px`);
    });
    await check(`[${name}] strategies: ${viewport.width >= 768 ? '3 across' : 'one per row'}`, async () => {
      const boxes = await t(page, 'plan-strategy').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
      const sameRow = boxes.every((y) => Math.abs(y - boxes[0]) < 2);
      assert(sameRow === viewport.width >= 768, `same row = ${sameRow}`);
    });
    await context.close();
  }

  await check('no JavaScript errors during any Stage 6 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== STAGE 6 (AI Study Coach): ${results.length - failed.length}/${results.length} passed ===`);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
  process.exit(failed.length ? 1 : 0);
})();
