// Browser tests for Stage 22C: YDT (English) in the exam mode.
// Clock fixed at 5 Nov 2026 10:00 Istanbul. Usage: node stage22c-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const EXAM_KEY = 'ai-exam-survival:exam-mode:v1';
const results = [];
const errors = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message || e).split('\n').slice(0, 6).join(' | ') });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), EXAM_KEY);

async function open(browser, { lang = 'tr', viewport = { width: 800, height: 1280 } } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript(([key, value]) => {
    try {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem(key, value);
      }
    } catch {
      // no storage
    }
  }, [LANG_KEY, lang]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + '/quiz-center');
  await page.waitForTimeout(300);
  return { context, page };
}
const tabs = (page) => page.locator('[role="tab"]').allInnerTexts();


(async () => {
  const browser = await chromium.launch();

  await check('[tr] new group “YDT · İngilizce” with the mini (40 / 90) and full (80 / 180) exams and its note', async () => {
    const { context, page } = await open(browser);
    assert((await tid(page, 'exam-group-ydt').locator('button').count()) === 2, 'two YDT exams');
    assert((await tid(page, 'button-exam-start-ydt-mini').innerText()).includes('40 soru · 90 dakika'), 'mini info');
    assert((await tid(page, 'button-exam-start-ydt-full').innerText()).includes('80 soru · 180 dakika'), 'full info');
    assert((await tid(page, 'exam-ydt-note').innerText()).includes('Üç farklı tam YDT'), 'note');
    assert((await saved(page)) === null, 'nothing saved by a visit');
    await context.close();
  });

  await check('[tr] YDT mini: 1:30:00, one test of 40, English question with a Turkish type label', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ydt-mini').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('1:30:00'), 'timer');
    const t = await tabs(page);
    assert(t.length === 1 && t[0].includes('Yabancı Dil Testi') && t[0].includes('0/40'), t.join(' | '));
    const head = await tid(page, 'exam-question').innerText();
    assert(head.includes('İngilizce · Kelime bilgisi') && head.includes('----'), head.slice(0, 120));
    assert((await saved(page)).current.questionIds[0] === 'ydt-1-1', 'first mini starts with set 1');
    await context.close();
  });

  await check('[tr] reading and dialogue texts are shown above the question (dialogue on separate lines)', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ydt-full').click();
    await tid(page, 'exam-grid-29').click();
    const passage = await tid(page, 'exam-passage').innerText();
    assert(passage.startsWith('Cities are often several degrees warmer'), passage.slice(0, 60));
    await tid(page, 'exam-grid-44').click();
    const dialogue = await tid(page, 'exam-passage').innerText();
    assert(dialogue.split('\n').filter(Boolean).length === 4 && dialogue.includes('Leo: ----'), dialogue);
    await tid(page, 'exam-grid-76').click();
    const options = await page.locator('[data-testid^="exam-option-"]').allInnerTexts();
    assert(options.map((o) => o.replace(/^[A-E]\s*/, '').trim()).join(',') === 'I,II,III,IV,V', options.join(' | '));
    await context.close();
  });

  await check('full YDT: 3:00:00, 80 questions; answering 2 and finishing gives one result row and the right net', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ydt-full').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('3:00:00'), 'timer');
    assert((await tabs(page))[0].includes('0/80'), 'tab count');
    const ids = (await saved(page)).current.questionIds;
    assert(ids.length === 80 && ids[79] === 'ydt-1-80', 'set 1');
    await tid(page, 'exam-option-A').click();
    await tid(page, 'exam-grid-2').click();
    await tid(page, 'exam-option-B').click();
    await tid(page, 'button-exam-finish').click();
    assert((await tid(page, 'exam-finish-confirm').innerText()).includes('78 soru boş'), 'blank count');
    await tid(page, 'button-exam-finish-confirm').click();
    await page.waitForTimeout(200);
    assert((await tid(page, 'exam-result-row-ydt').count()) === 1, 'result row');
    const r = (await saved(page)).results[0];
    assert(r.kind === 'ydt-full' && r.sections.length === 1 && r.sections[0].section === 'ydt' && r.sections[0].blank === 78, JSON.stringify(r.sections));
    assert(r.totalNet === r.sections[0].correct - r.sections[0].wrong / 4, 'net');
    assert((await tid(page, 'exam-review-item').count()) > 0, 'review');
    await context.close();
  });

  await check('a second full YDT brings set 2', async () => {
    const { context, page } = await open(browser);
    for (const expected of ['ydt-1-1', 'ydt-2-1']) {
      await tid(page, 'button-exam-start-ydt-full').click();
      assert((await saved(page)).current.questionIds[0] === expected, expected);
      await tid(page, 'button-exam-finish').click();
      await tid(page, 'button-exam-finish-confirm').click();
      await page.waitForTimeout(150);
      await page.goto(BASE + '/quiz-center');
      await page.waitForTimeout(200);
    }
    await context.close();
  });

  await check('[en] English labels for the YDT group; explanations stay Turkish', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'exam-group-ydt').innerText()).includes('YDT mini exam'), 'label');
    await tid(page, 'button-exam-start-ydt-mini').click();
    assert((await tabs(page))[0].includes('Foreign Language Test (English)'), 'tab');
    await context.close();
  });

  await check('[tr] phone: the start screen and a reading question fit (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    let wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'start screen');
    await tid(page, 'button-exam-start-ydt-full').click();
    await tid(page, 'exam-grid-29').click();
    wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'reading question');
    await context.close();
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22c-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
