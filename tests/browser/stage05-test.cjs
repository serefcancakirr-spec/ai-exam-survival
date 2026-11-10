// Browser tests for Stage 5: month view + preparation steps. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage05-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4177';
const PAGE = BASE + '/exam-calendar';
const CAL_KEY = 'ai-exam-survival:exam-calendar:v1';
const PREP_KEY = 'ai-exam-survival:exam-prep:v1';
const PLANNER_KEY = 'ai-exam-survival:study-planner:v1';
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

const ex = (id, subject, title, date, time = '') => ({ id, subject, grade: '10', title, date, time, notes: '', createdAt: '2026-11-01T00:00:00Z' });
const SEED = {
  version: 1,
  exams: [
    ex('bio', 'Biology', 'Cell quiz', '2026-11-06', '09:00'),
    ex('alg', 'Algebra I', 'Equations test', '2026-11-10', '13:00'),
    ex('phy', 'Physics', 'Forces test', '2026-11-10', '08:30'),
    ex('chem', 'Chemistry', 'Moles test', '2026-12-03'),
    ex('hist', 'World History', 'Old essay', '2026-10-20'),
    ex('leap', 'Geometry', 'Leap day exam', '2028-02-29'),
  ],
};
const plannerTask = (subject, date, completed, n) => ({ id: `t-${n}`, date, startTime: '4:00 PM', duration: 25, kind: 'study', subject, activity: 'Topic review', topic: 'Cells', completed });
const PLANNER = {
  version: 1, grade: '10', dailyMinutes: 60, subjects: [], weekStart: '2026-11-05', generatedAt: '2026-11-05T08:00:00Z', inputSnapshot: '{}',
  tasks: [plannerTask('Biology', '2026-11-05', true, 1), plannerTask('Biology', '2026-11-06', false, 2), plannerTask('Biology', '2026-11-08', false, 3), plannerTask('Physics', '2026-11-05', true, 4)],
};

async function open(browser, { viewport = { width: 1280, height: 900 }, time = '2026-11-05T10:00:00+03:00', seed = SEED, planner = null, prep = null } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'en-US' });
  await context.clock.install({ time: new Date(time) });
  await context.addInitScript(([items]) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    for (const [k, v] of items) localStorage.setItem(k, v);
  }, [[[CAL_KEY, JSON.stringify(seed)], ...(planner ? [[PLANNER_KEY, JSON.stringify(planner)]] : []), ...(prep ? [[PREP_KEY, prep]] : [])]]);
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
const day = (page, key) => t(page, `day-${key}`);
const monthLabel = (page) => t(page, 'text-month-label').innerText();
const stepTexts = (page, examId) => t(page, `prep-panel-${examId}`).locator('[data-testid="step-text"]').allInnerTexts();
const progressText = (page, examId) => t(page, `prep-panel-${examId}`).locator('[data-testid="prep-progress-text"]').innerText();
const savedPrep = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), PREP_KEY);

(async () => {
  const browser = await chromium.launch();

  // ---------- month view ----------
  {
    const { context, page } = await open(browser);
    await check('month view opens on November 2026 with today highlighted', async () => {
      assert((await monthLabel(page)) === 'November 2026', await monthLabel(page));
      assert((await day(page, '2026-11-05').getAttribute('data-today')) === 'true', 'today not marked');
      assert((await page.locator('[data-today="true"]').count()) === 1, 'more than one today');
      const bg = await day(page, '2026-11-05').locator('span').first().evaluate((el) => getComputedStyle(el).backgroundColor);
      assert(bg !== 'rgba(0, 0, 0, 0)', 'today has no highlight');
      assert((await t(page, 'text-selected-date').innerText()) === 'Thursday, November 5, 2026', 'today not selected');
    });
    await check('weeks start on Monday and November 2026 shows Oct 26 – Dec 6', async () => {
      const keys = await t(page, 'month-grid').locator('[data-testid^="day-2"]').evaluateAll((els) => els.map((e) => e.dataset.testid.slice(4)));
      assert(keys[0] === '2026-10-26' && keys[keys.length - 1] === '2026-12-06' && keys.length === 42, `${keys[0]}…${keys[keys.length - 1]} (${keys.length})`);
      assert((await day(page, '2026-10-26').getAttribute('data-in-month')) === 'false', 'October day not muted');
    });
    await check('exams appear on their correct dates', async () => {
      assert((await day(page, '2026-11-10').locator('[data-testid="day-chips"] > span').count()) === 2, 'Nov 10 should show 2 exams');
      assert((await day(page, '2026-11-06').innerText()).includes('Cell quiz'), 'Nov 6 missing Cell quiz');
      assert((await day(page, '2026-11-07').locator('[data-testid="day-chips"]').count()) === 0, 'Nov 7 should be empty');
      assert((await t(page, 'text-month-count').innerText()) === '3 exams this month', await t(page, 'text-month-count').innerText());
    });
    await check('tapping a date shows that day’s exams, in time order', async () => {
      await day(page, '2026-11-10').click();
      assert((await t(page, 'text-selected-date').innerText()) === 'Tuesday, November 10, 2026', 'wrong date');
      const list = await t(page, 'day-exam-list').locator('[data-testid="day-exam"] p:first-child').allInnerTexts();
      assert(list.join('|') === 'Forces test|Equations test', list.join('|'));
      assert((await day(page, '2026-11-10').getAttribute('aria-pressed')) === 'true', 'not marked selected');
      await day(page, '2026-11-11').click();
      assert(await t(page, 'day-no-exams').isVisible(), 'no empty message');
    });
    await check('next and previous month, across the new year', async () => {
      await t(page, 'button-next-month').click();
      assert((await monthLabel(page)) === 'December 2026', 'next failed');
      assert((await day(page, '2026-12-03').innerText()).includes('Moles test'), 'December exam missing');
      await t(page, 'button-next-month').click();
      assert((await monthLabel(page)) === 'January 2027', 'year change failed');
      await t(page, 'button-prev-month').click();
      await t(page, 'button-prev-month').click();
      await t(page, 'button-prev-month').click();
      assert((await monthLabel(page)) === 'October 2026', 'previous failed');
      assert((await day(page, '2026-10-20').innerText()).includes('Old essay'), 'past exam missing in October');
    });
    await check('"Today" jumps back to this month and selects today', async () => {
      await t(page, 'button-month-today').click();
      assert((await monthLabel(page)) === 'November 2026', 'not back to November');
      assert((await t(page, 'text-selected-date').innerText()) === 'Thursday, November 5, 2026', 'today not selected');
    });
    await check('tapping a grey day from the next month switches to that month', async () => {
      await day(page, '2026-12-01').click();
      assert((await monthLabel(page)) === 'December 2026', 'month did not switch');
      assert((await t(page, 'text-selected-date').innerText()) === 'Tuesday, December 1, 2026', 'wrong selection');
      await t(page, 'button-month-today').click();
    });
    await check('leap years: 29 Feb 2028 exists and shows its exam; 2027 has no 29 Feb', async () => {
      for (let i = 0; i < 15; i += 1) await t(page, 'button-next-month').click();
      assert((await monthLabel(page)) === 'February 2028', await monthLabel(page));
      assert((await day(page, '2028-02-29').getAttribute('data-in-month')) === 'true', '29 Feb 2028 missing');
      assert((await day(page, '2028-02-29').innerText()).includes('Leap day exam'), 'leap exam missing');
      for (let i = 0; i < 12; i += 1) await t(page, 'button-prev-month').click();
      assert((await monthLabel(page)) === 'February 2027', await monthLabel(page));
      assert((await day(page, '2027-02-29').count()) === 0, '29 Feb 2027 should not exist');
      assert((await page.locator('[data-in-month="true"]').count()) === 28, 'Feb 2027 should have 28 days');
      await t(page, 'button-month-today').click();
    });
    await check('"Add an exam on this day" opens the form with that date filled in', async () => {
      await day(page, '2026-11-11').click();
      await t(page, 'button-add-on-date').click();
      assert((await t(page, 'new-exam-date').inputValue()) === '2026-11-11', 'date not prefilled');
      await t(page, 'new-exam-title').fill('Spanish oral');
      await t(page, 'new-exam-subject').selectOption('Spanish');
      await t(page, 'new-exam-save').click();
      assert((await day(page, '2026-11-11').innerText()).includes('Spanish oral'), 'not on the calendar');
      assert((await t(page, 'day-exam-list').innerText()).includes('Spanish oral'), 'not in day details');
    });
    await check('existing Upcoming exams, Past exams and Next up sections are still there', async () => {
      for (const id of ['panel-upcoming', 'list-upcoming', 'button-toggle-past', 'panel-next']) assert(await t(page, id).isVisible(), `${id} missing`);
      assert((await t(page, 'text-past-count').innerText()) === '(1)', 'past count wrong');
      assert((await t(page, 'next-countdown').innerText()) === 'Tomorrow', 'next up wrong');
    });
    await context.close();
  }

  // ---------- preparation steps ----------
  {
    const { context, page } = await open(browser, { planner: PLANNER });
    const plannerBefore = await page.evaluate((k) => localStorage.getItem(k), PLANNER_KEY);
    await check('opening the page does not create a preparation record by itself', async () => {
      assert((await savedPrep(page)) === null, 'prep key created on page load');
    });
    await check('"Preparation" from a day opens that exam’s steps', async () => {
      await day(page, '2026-11-06').click();
      await t(page, 'button-day-prepare-bio').click();
      assert(await t(page, 'prep-panel-bio').isVisible(), 'panel not open');
      assert((await t(page, 'button-prepare-bio').getAttribute('aria-expanded')) === 'true', 'Prepare not expanded');
      assert(await t(page, 'prep-panel-bio').locator('[data-testid="prep-empty"]').isVisible(), 'no empty message');
    });
    await check('suggestions fit the time left (exam tomorrow → 4 suggestions)', async () => {
      const panel = t(page, 'prep-panel-bio');
      assert((await panel.locator('[data-testid="prep-suggestions"]').innerText()).includes('Suggested for an exam tomorrow'), 'wrong heading');
      assert((await panel.locator('[data-testid="suggestion"]').count()) === 4, 'not 4 suggestions');
      assert((await panel.locator('[data-testid="suggestion-text"]').first().innerText()).includes('Biology'), 'subject not used');
    });
    await check('add one suggestion; it shows as Added', async () => {
      const panel = t(page, 'prep-panel-bio');
      await panel.locator('[data-testid="button-add-suggestion"]').first().click();
      assert((await stepTexts(page, 'bio')).length === 1, 'step not added');
      assert(await panel.locator('[data-testid="button-add-suggestion"]').first().isDisabled(), 'still addable');
      assert((await progressText(page, 'bio')) === '0 of 1 done · 0%', await progressText(page, 'bio'));
    });
    await check('"Add all" adds only the missing suggestions', async () => {
      const panel = t(page, 'prep-panel-bio');
      await panel.locator('[data-testid="button-add-all-suggestions"]').click();
      assert((await stepTexts(page, 'bio')).length === 4, `${(await stepTexts(page, 'bio')).length} steps`);
      assert(await panel.locator('[data-testid="button-add-all-suggestions"]').isDisabled(), 'Add all still active');
    });
    await check('own step: empty is refused, a real one is added with its due date', async () => {
      const panel = t(page, 'prep-panel-bio');
      await panel.locator('[data-testid="button-add-step"]').click();
      assert(await panel.locator('[data-testid="add-step-error"]').isVisible(), 'no error');
      await panel.locator('[data-testid="input-step-text"]').fill('Redo the osmosis worksheet');
      await panel.locator('[data-testid="input-step-due"]').fill('2026-11-05');
      await panel.locator('[data-testid="button-add-step"]').click();
      const texts = await stepTexts(page, 'bio');
      assert(texts.length === 5 && texts.includes('Redo the osmosis worksheet'), texts.join('|'));
      const due = await panel.locator('[data-testid="prep-step"]', { hasText: 'Redo the osmosis worksheet' }).locator('[data-testid="step-due"]').innerText();
      assert(due === 'Due today', due);
    });
    await check('completing steps updates progress everywhere', async () => {
      const panel = t(page, 'prep-panel-bio');
      await panel.locator('[data-testid="checkbox-step"]').nth(0).check();
      await panel.locator('[data-testid="checkbox-step"]').nth(1).check();
      assert((await progressText(page, 'bio')) === '2 of 5 done · 40%', await progressText(page, 'bio'));
      assert((await t(page, 'button-prepare-bio').innerText()).includes('2/5'), 'Prepare button not updated');
      assert((await t(page, 'button-day-prepare-bio').innerText()).includes('2/5'), 'day details not updated');
      const bar = await panel.locator('[role="progressbar"]').getAttribute('aria-valuenow');
      assert(bar === '40', `bar ${bar}`);
    });
    await check('un-ticking a step works', async () => {
      const panel = t(page, 'prep-panel-bio');
      await panel.locator('[data-testid="checkbox-step"]').nth(1).uncheck();
      assert((await progressText(page, 'bio')) === '1 of 5 done · 20%', await progressText(page, 'bio'));
      await panel.locator('[data-testid="checkbox-step"]').nth(1).check();
    });
    await check('edit a step (text and due date); empty text is refused', async () => {
      const panel = t(page, 'prep-panel-bio');
      const row = panel.locator('[data-testid="prep-step"]', { hasText: 'Redo the osmosis worksheet' });
      await row.locator('[data-testid="button-edit-step"]').click();
      await panel.locator('[data-testid="input-edit-step-text"]').fill('');
      await panel.locator('[data-testid="button-save-step"]').click();
      assert(await panel.locator('[data-testid="form-edit-step"] [role="alert"]').isVisible(), 'empty edit accepted');
      await panel.locator('[data-testid="input-edit-step-text"]').fill('Redo the osmosis and diffusion worksheet');
      await panel.locator('[data-testid="input-edit-step-due"]').fill('2026-11-06');
      await panel.locator('[data-testid="button-save-step"]').click();
      const edited = panel.locator('[data-testid="prep-step"]', { hasText: 'Redo the osmosis and diffusion worksheet' });
      assert((await edited.count()) === 1, 'edit not saved');
      assert((await edited.locator('[data-testid="step-due"]').innerText()) === 'Due tomorrow', 'due not updated');
    });
    await check('delete a step', async () => {
      const panel = t(page, 'prep-panel-bio');
      await panel.locator('[data-testid="prep-step"]', { hasText: 'Redo the osmosis and diffusion worksheet' }).locator('[data-testid="button-delete-step"]').click();
      assert((await stepTexts(page, 'bio')).length === 4, 'not deleted');
      assert((await progressText(page, 'bio')) === '2 of 4 done · 50%', await progressText(page, 'bio'));
    });
    await check('Study Planner link: shows Biology sessions before the exam (read only)', async () => {
      const text = await t(page, 'prep-panel-bio').locator('[data-testid="prep-planner-text"]').innerText();
      assert(text === 'Study Planner: 1 of 2 Biology sessions done before this exam.', text);
    });
    await check('steps, ticks and progress survive a refresh', async () => {
      await page.reload();
      await t(page, 'button-prepare-bio').click();
      assert((await stepTexts(page, 'bio')).length === 4, 'steps lost');
      assert((await progressText(page, 'bio')) === '2 of 4 done · 50%', 'progress lost');
      const saved = await savedPrep(page);
      assert(saved.steps.length === 4 && saved.steps.every((s) => s.examId === 'bio'), 'saved steps wrong');
    });
    await check('steps belong to their own exam only', async () => {
      await t(page, 'button-prepare-alg').click();
      assert(await t(page, 'prep-panel-alg').locator('[data-testid="prep-empty"]').isVisible(), 'other exam shows steps');
      assert((await t(page, 'prep-panel-alg').locator('[data-testid="suggestion"]').count()) === 5, 'exam in 5 days should get 5 suggestions');
      const text = await t(page, 'prep-panel-alg').locator('[data-testid="prep-planner-text"]').innerText();
      assert(text === 'Your Study Planner has no Algebra I sessions before this exam yet.', text);
    });
    await check('changing an exam’s date keeps its steps', async () => {
      const row = page.locator('li[data-testid="exam-bio"]');
      await row.locator('[data-testid="button-edit-exam-bio"]').click();
      await t(page, 'edit-exam-date').fill('2026-11-20');
      await t(page, 'edit-exam-save').click();
      await t(page, 'button-prepare-bio').click();
      assert((await stepTexts(page, 'bio')).length === 4, 'steps lost after date change');
      assert((await t(page, 'prep-panel-bio').locator('[data-testid="prep-suggestions"]').innerText()).includes('in 15 days'), 'suggestions not updated');
    });
    await check('past exam: no new suggestions, but own steps can still be added', async () => {
      await t(page, 'button-toggle-past').click();
      await t(page, 'button-prepare-hist').click();
      const panel = t(page, 'prep-panel-hist');
      assert((await panel.locator('[data-testid="prep-suggestions"]').innerText()).includes('This exam has passed'), 'suggestions shown');
      await panel.locator('[data-testid="input-step-text"]').fill('Read the teacher’s feedback');
      await panel.locator('[data-testid="button-add-step"]').click();
      assert((await stepTexts(page, 'hist')).length === 1, 'own step not added');
    });
    await check('deleting an exam asks first and also deletes its steps', async () => {
      await page.locator('li[data-testid="exam-bio"] [data-testid="button-delete-exam-bio"]').click();
      const msg = await t(page, 'confirm-delete-exam').innerText();
      assert(msg.includes('and its 4 preparation steps'), msg);
      await t(page, 'confirm-delete-exam-yes').click();
      const saved = await savedPrep(page);
      assert(saved.steps.every((s) => s.examId !== 'bio'), 'steps not removed');
      assert(saved.steps.length === 1, `left ${saved.steps.length}`);
    });
    await check('"Open Study Planner" opens the Planner, and Planner data is unchanged', async () => {
      await t(page, 'prep-panel-hist').locator('[data-testid="link-open-planner"]').click();
      await page.waitForTimeout(300);
      assert((await page.locator('h1').first().innerText()) === 'Study Planner', 'planner not opened');
      const after = await page.evaluate((k) => localStorage.getItem(k), PLANNER_KEY);
      assert(after === plannerBefore, 'Study Planner data changed');
    });
    await context.close();
  }

  // ---------- no planner, damaged data, midnight ----------
  {
    const { context, page } = await open(browser);
    await check('no Study Planner week: a clear message', async () => {
      await t(page, 'button-prepare-chem').click();
      const text = await t(page, 'prep-panel-chem').locator('[data-testid="prep-planner-text"]').innerText();
      assert(text === 'You have not made a Study Planner week yet.', text);
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser, { prep: '{broken' });
    await check('damaged preparation data: warning shown, not overwritten, exams still work', async () => {
      assert(await t(page, 'message-prep-storage').isVisible(), 'no warning');
      await t(page, 'button-prepare-chem').click();
      await t(page, 'prep-panel-chem').locator('[data-testid="input-step-text"]').fill('Should not save');
      await t(page, 'prep-panel-chem').locator('[data-testid="button-add-step"]').click();
      assert((await page.evaluate((k) => localStorage.getItem(k), PREP_KEY)) === '{broken', 'damaged data overwritten');
      assert((await page.locator('#root [data-testid="list-upcoming"] li').count()) >= 4, 'exams not shown');
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser, { time: '2026-11-05T23:59:20+03:00' });
    await check('at midnight the today highlight moves to the next day', async () => {
      assert((await day(page, '2026-11-05').getAttribute('data-today')) === 'true', 'before');
      await context.clock.runFor(70_000);
      await page.waitForTimeout(100);
      assert((await day(page, '2026-11-06').getAttribute('data-today')) === 'true', 'after');
      assert((await day(page, '2026-11-05').getAttribute('data-today')) === 'false', 'old today still marked');
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
    await t(page, 'button-prepare-bio').click();
    await t(page, 'prep-panel-bio').locator('[data-testid="button-add-all-suggestions"]').click();
    await check(`[${name}] nothing runs off the screen (month view + open preparation)`, async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });
    await check(`[${name}] day buttons are big enough to tap`, async () => {
      const box = await day(page, '2026-11-18').boundingBox();
      assert(box && box.height >= 44 && box.width >= 38, `${Math.round(box.width)}x${Math.round(box.height)}`);
    });
    await check(`[${name}] exams show as ${viewport.width >= 768 ? 'names' : 'dots'} in the month`, async () => {
      const chips = await day(page, '2026-11-10').locator('[data-testid="day-chips"]').isVisible();
      const dots = await day(page, '2026-11-10').locator('[data-testid="day-dots"]').isVisible();
      assert(viewport.width >= 768 ? chips && !dots : dots && !chips, `chips=${chips} dots=${dots}`);
    });
    await check(`[${name}] day details ${viewport.width >= 1024 ? 'beside' : 'below'} the month`, async () => {
      const grid = await t(page, 'month-grid').boundingBox();
      const details = await t(page, 'day-details').boundingBox();
      const beside = details.x > grid.x + grid.width - 5;
      assert(beside === viewport.width >= 1024, `beside=${beside}`);
    });
    await check(`[${name}] preparation buttons are 40px or taller`, async () => {
      const panel = t(page, 'prep-panel-bio');
      for (const sel of ['[data-testid="button-edit-step"]', '[data-testid="button-delete-step"]', '[data-testid="button-add-step"]', '[data-testid="link-open-planner"]']) {
        const box = await panel.locator(sel).first().boundingBox();
        assert(box && box.height >= 40, `${sel} ${box && Math.round(box.height)}px`);
      }
      const cb = await panel.locator('[data-testid="checkbox-step"]').first().boundingBox();
      assert(cb && cb.height >= 20, 'checkbox too small');
    });
    await context.close();
  }

  await check('no JavaScript errors during any Stage 5 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== STAGE 5 (month view + preparation): ${results.length - failed.length}/${results.length} passed ===`);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
  process.exit(failed.length ? 1 : 0);
})();
