// Browser tests for Exam Calendar (Stage 4). The clock is fixed so countdowns can be checked exactly.
// Usage: node stage04-calendar-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4176';
const PAGE = BASE + '/exam-calendar';
const KEY = 'ai-exam-survival:exam-calendar:v1';
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

async function open(browser, { viewport = { width: 800, height: 1280 }, time = '2026-11-05T10:00:00+03:00', seed } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'en-US' });
  await context.clock.install({ time: new Date(time) });
  if (seed) await context.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [KEY, JSON.stringify(seed)]);
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
const todayHeading = async (page) => (await page.locator('[data-testid="panel-upcoming"] p').first().innerText()).toUpperCase();
const titles = (page, list) => page.locator(`[data-testid="${list}"] [data-testid="exam-title"]`).allInnerTexts();
const countdowns = (page, list) => page.locator(`[data-testid="${list}"] [data-testid="exam-countdown"]`).allInnerTexts();
const pastCount = async (page) => Number((await t(page, 'text-past-count').innerText()).replace(/\D/g, ''));
const examRow = (page, title) => page.locator('li[data-testid^="exam-"]', { has: page.locator('[data-testid="exam-title"]', { hasText: title }) });

async function addExam(page, { subject = 'Biology', grade = '9', title, date, time = '', notes = '' }) {
  await t(page, 'button-add-exam').click();
  await t(page, 'new-exam-subject').selectOption(subject);
  await t(page, 'new-exam-grade').selectOption(grade);
  await t(page, 'new-exam-title').fill(title);
  if (date) await t(page, 'new-exam-date').fill(date);
  if (time) await t(page, 'new-exam-time').fill(time);
  if (notes) await t(page, 'new-exam-notes').fill(notes);
  await t(page, 'new-exam-save').click();
}

const ex = (id, title, date, time = '') => ({ id, subject: 'Physics', grade: '11', title, date, time, notes: '', createdAt: '2026-11-01T00:00:00Z' });

(async () => {
  const browser = await chromium.launch();

  // ---------- adding, countdowns, ordering, past section ----------
  {
    const { context, page } = await open(browser);
    await check('first visit: today shown, empty calendar with clear next steps', async () => {
      assert((await todayHeading(page)) === 'TODAY · THURSDAY, NOVEMBER 5, 2026', `heading: ${await todayHeading(page)}`);
      assert(await t(page, 'upcoming-empty').isVisible(), 'no empty state');
      assert((await pastCount(page)) === 0, 'past count not 0');
    });
    await check('empty form is refused with clear messages', async () => {
      await t(page, 'button-add-exam').click();
      await t(page, 'new-exam-save').click();
      const text = await t(page, 'form-new-exam').innerText();
      assert(text.includes('Write the exam title') && text.includes('Choose the exam date.'), 'errors missing');
      await t(page, 'new-exam-cancel').click();
      assert((await page.evaluate((k) => JSON.parse(localStorage.getItem(k)).exams.length, KEY)) === 0, 'empty exam saved');
    });
    await check('add five exams with subject, grade, title and date', async () => {
      await addExam(page, { subject: 'Physics', grade: '11', title: 'Lab practical', date: '2026-11-05', time: '13:30', notes: 'Pendulum experiment' });
      await addExam(page, { subject: 'Biology', grade: '9', title: 'Cell quiz', date: '2026-11-06', time: '09:00' });
      await addExam(page, { subject: 'Algebra I', grade: '9', title: 'Equations test', date: '2026-11-10' });
      await addExam(page, { subject: 'World History', grade: '10', title: 'WWI essay', date: '2026-11-17' });
      await addExam(page, { subject: 'Chemistry', grade: '12', title: 'Old chemistry test', date: '2026-11-04' });
      const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
      assert(saved.exams.length === 5, `saved ${saved.exams.length}`);
      const lab = saved.exams.find((e) => e.title === 'Lab practical');
      assert(lab.subject === 'Physics' && lab.grade === '11' && lab.date === '2026-11-05' && lab.time === '13:30', 'fields not saved');
    });
    await check('countdowns read Today, Tomorrow, In 5 days, In 12 days', async () => {
      const labels = await countdowns(page, 'list-upcoming');
      assert(labels.join('|') === 'Today|Tomorrow|In 5 days|In 12 days', labels.join('|'));
    });
    await check('upcoming exams are listed soonest first', async () => {
      const list = await titles(page, 'list-upcoming');
      assert(list.join('|') === 'Lab practical|Cell quiz|Equations test|WWI essay', list.join('|'));
    });
    await check('subject, grade, date and time are shown on each exam', async () => {
      const row = await examRow(page, 'Lab practical').innerText();
      for (const part of ['Physics · Grade 11', 'Thursday, November 5, 2026', '1:30 PM', 'Pendulum experiment']) assert(row.includes(part), `missing "${part}"`);
    });
    await check('a past exam goes to the collapsed Past exams section', async () => {
      assert((await pastCount(page)) === 1, 'past count not 1');
      assert(!(await titles(page, 'list-upcoming')).includes('Old chemistry test'), 'past exam in upcoming');
    });
    await check('Past exams opens and closes', async () => {
      const toggle = t(page, 'button-toggle-past');
      if ((await toggle.getAttribute('aria-expanded')) === 'true') await toggle.click();
      assert(!(await t(page, 'list-past').isVisible()), 'past list visible while closed');
      await toggle.click();
      assert((await toggle.getAttribute('aria-expanded')) === 'true', 'not expanded');
      assert((await countdowns(page, 'list-past')).join() === 'Yesterday', 'past label wrong');
      await toggle.click();
      assert(!(await t(page, 'list-past').isVisible()), 'did not close');
    });
    await check('"Next up" shows the nearest exam and correct counts', async () => {
      const next = await t(page, 'panel-next').innerText();
      assert(next.includes('Lab practical') && (await t(page, 'next-countdown').innerText()) === 'Today', 'next exam wrong');
      assert((await t(page, 'stat-week').innerText()).endsWith('3'), 'next 7 days should be 3');
      assert((await t(page, 'stat-month').innerText()).endsWith('4'), 'next 30 days should be 4');
      assert((await t(page, 'stat-total').innerText()).endsWith('4'), 'upcoming should be 4');
    });
    await check('everything is still there after a refresh', async () => {
      await page.reload();
      assert((await titles(page, 'list-upcoming')).join('|') === 'Lab practical|Cell quiz|Equations test|WWI essay', 'order lost');
      assert((await pastCount(page)) === 1, 'past exam lost');
    });
    await check('edit: rename an exam', async () => {
      await examRow(page, 'Cell quiz').locator('[data-testid^="button-edit-exam-"]').click();
      await t(page, 'edit-exam-title').fill('Cell structure quiz');
      await t(page, 'edit-exam-save').click();
      assert((await titles(page, 'list-upcoming')).includes('Cell structure quiz'), 'rename not shown');
    });
    await check('edit: moving an exam to an earlier date re-sorts it', async () => {
      await examRow(page, 'WWI essay').locator('[data-testid^="button-edit-exam-"]').click();
      await t(page, 'edit-exam-date').fill('2026-11-07');
      await t(page, 'edit-exam-save').click();
      const list = await titles(page, 'list-upcoming');
      assert(list.join('|') === 'Lab practical|Cell structure quiz|WWI essay|Equations test', list.join('|'));
      assert((await examRow(page, 'WWI essay').locator('[data-testid="exam-countdown"]').innerText()) === 'In 2 days', 'countdown not updated');
    });
    await check('edit: moving an exam into the past moves it to Past exams', async () => {
      await examRow(page, 'Equations test').locator('[data-testid^="button-edit-exam-"]').click();
      await t(page, 'edit-exam-date').fill('2026-10-01');
      await t(page, 'edit-exam-save').click();
      assert((await pastCount(page)) === 2, 'past count not 2');
      assert((await t(page, 'button-toggle-past').getAttribute('aria-expanded')) === 'true', 'past section not opened');
      assert((await examRow(page, 'Equations test').locator('[data-testid="exam-countdown"]').innerText()) === '35 days ago', 'past label wrong');
      assert((await titles(page, 'list-past')).join('|') === 'Old chemistry test|Equations test', 'past order wrong');
    });
    await check('edit with an empty title is refused', async () => {
      await examRow(page, 'Lab practical').locator('[data-testid^="button-edit-exam-"]').click();
      await t(page, 'edit-exam-title').fill('');
      await t(page, 'edit-exam-save').click();
      assert((await t(page, 'form-edit-exam').innerText()).includes('Write the exam title'), 'no error');
      await t(page, 'edit-exam-cancel').click();
      assert((await titles(page, 'list-upcoming')).includes('Lab practical'), 'title was lost');
    });
    await check('delete asks first; Cancel keeps the exam', async () => {
      await examRow(page, 'WWI essay').locator('[data-testid^="button-delete-exam-"]').click();
      await t(page, 'confirm-delete-exam-cancel').click();
      assert((await titles(page, 'list-upcoming')).includes('WWI essay'), 'cancel deleted the exam');
    });
    await check('delete removes the exam and stays deleted after refresh', async () => {
      await examRow(page, 'WWI essay').locator('[data-testid^="button-delete-exam-"]').click();
      await t(page, 'confirm-delete-exam-yes').click();
      assert(!(await titles(page, 'list-upcoming')).includes('WWI essay'), 'not deleted');
      await page.reload();
      assert(!(await titles(page, 'list-upcoming')).includes('WWI essay'), 'came back after refresh');
      const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);
      assert(saved.exams.length === 4, `saved ${saved.exams.length}`);
    });
    await check('a past exam can be deleted from Past exams', async () => {
      await t(page, 'button-toggle-past').click();
      await examRow(page, 'Old chemistry test').locator('[data-testid^="button-delete-exam-"]').click();
      await t(page, 'confirm-delete-exam-yes').click();
      assert((await pastCount(page)) === 1, 'past exam not deleted');
    });
    await context.close();
  }

  // ---------- midnight, month/year boundaries, examples ----------
  {
    const { context, page } = await open(browser, {
      time: '2026-11-05T23:59:20+03:00',
      seed: { version: 1, exams: [ex('a', 'Today exam', '2026-11-05'), ex('b', 'Tomorrow exam', '2026-11-06'), ex('c', 'Week exam', '2026-11-12')] },
    });
    await check('just before midnight: Today, Tomorrow, In 7 days', async () => {
      assert((await todayHeading(page)) === 'TODAY · THURSDAY, NOVEMBER 5, 2026', 'heading before midnight');
      assert((await countdowns(page, 'list-upcoming')).join('|') === 'Today|Tomorrow|In 7 days', (await countdowns(page, 'list-upcoming')).join('|'));
    });
    await check('after midnight the page updates by itself: exams move one day on', async () => {
      await context.clock.runFor(70_000);
      await page.waitForTimeout(100);
      assert((await countdowns(page, 'list-upcoming')).join('|') === 'Today|In 6 days', (await countdowns(page, 'list-upcoming')).join('|'));
      assert((await titles(page, 'list-upcoming'))[0] === 'Tomorrow exam', 'wrong exam is today');
      assert((await pastCount(page)) === 1, 'yesterday’s exam did not move to Past');
      assert((await todayHeading(page)) === 'TODAY · FRIDAY, NOVEMBER 6, 2026', `heading: ${await todayHeading(page)}`);
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser, {
      time: '2026-12-30T09:00:00+03:00',
      seed: { version: 1, exams: [ex('y', 'New year exam', '2027-01-02'), ex('l', 'Leap exam', '2028-02-29')] },
    });
    await check('countdowns are correct across the new year and a leap day', async () => {
      const labels = await countdowns(page, 'list-upcoming');
      assert(labels.join('|') === 'In 3 days|In 426 days', labels.join('|'));
    });
    await context.close();
  }
  {
    const { context, page } = await open(browser);
    await check('"Add example exams" adds 3 exams: Tomorrow, In 5 days, In 12 days', async () => {
      await t(page, 'button-add-examples').click();
      assert((await countdowns(page, 'list-upcoming')).join('|') === 'Tomorrow|In 5 days|In 12 days', 'wrong examples');
      assert(!(await t(page, 'button-add-examples').isVisible().catch(() => false)), 'example button still offered');
    });
    await check('an impossible date typed by hand is refused', async () => {
      await t(page, 'button-add-exam').click();
      await t(page, 'new-exam-title').fill('Bad date');
      await page.evaluate(() => {
        const input = document.querySelector('[data-testid="new-exam-date"]');
        input.type = 'text';
      });
      await t(page, 'new-exam-date').fill('2027-02-29');
      await t(page, 'new-exam-save').click();
      assert((await t(page, 'form-new-exam').innerText()).includes('Choose a real date'), 'bad date accepted');
      await t(page, 'new-exam-cancel').click();
    });
    await check('damaged saved data is shown as a warning and not overwritten', async () => {
      await page.evaluate((k) => localStorage.setItem(k, '{broken'), KEY);
      await page.reload();
      assert(await t(page, 'message-calendar-storage').isVisible(), 'no warning');
      await addExam(page, { title: 'Should not save', date: '2026-11-20' });
      assert((await page.evaluate((k) => localStorage.getItem(k), KEY)) === '{broken', 'damaged data overwritten');
      await page.evaluate((k) => localStorage.removeItem(k), KEY);
    });
    await check('the calendar uses its own storage key only', async () => {
      await page.reload();
      await addExam(page, { title: 'Key check', date: '2026-11-20' });
      const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k !== 'ai-exam-survival:language:v1'));
      assert(keys.length === 1 && keys[0] === KEY, `keys: ${keys}`);
    });
    await context.close();
  }

  // ---------- responsive layout ----------
  for (const [name, viewport] of [
    ['phone', { width: 390, height: 844 }],
    ['tablet portrait', { width: 800, height: 1280 }],
    ['tablet landscape', { width: 1280, height: 800 }],
  ]) {
    const { context, page } = await open(browser, { viewport });
    await t(page, 'button-add-examples').click();
    await addExam(page, { title: 'A very long exam title that should wrap nicely on a small phone screen', date: '2026-11-08', notes: 'Notes '.repeat(40).trim() });
    await check(`[${name}] nothing runs off the screen`, async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });
    await check(`[${name}] buttons are big enough to tap (40px or more)`, async () => {
      const ids = ['button-add-exam', 'button-toggle-past'];
      const row = page.locator('li[data-testid^="exam-"]').first();
      for (const id of ids) {
        const box = await t(page, id).boundingBox();
        assert(box && box.height >= 40, `${id} is ${box && Math.round(box.height)}px tall`);
      }
      for (const sel of ['[data-testid^="button-edit-exam-"]', '[data-testid^="button-delete-exam-"]']) {
        const box = await row.locator(sel).boundingBox();
        assert(box && box.height >= 40, `${sel} is ${box && Math.round(box.height)}px tall`);
      }
    });
    await check(`[${name}] layout: panels ${viewport.width >= 1024 ? 'side by side' : 'stacked'}`, async () => {
      const a = await t(page, 'panel-upcoming').boundingBox();
      const b = await t(page, 'panel-next').boundingBox();
      const sideBySide = b.x > a.x + a.width - 5;
      assert(sideBySide === viewport.width >= 1024, `side by side = ${sideBySide}`);
    });
    await context.close();
  }

  await check('no JavaScript errors during any calendar test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== EXAM CALENDAR: ${results.length - failed.length}/${results.length} passed ===`);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
  process.exit(failed.length ? 1 : 0);
})();
