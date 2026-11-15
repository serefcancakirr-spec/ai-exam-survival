// Browser tests for Stage 22B-1: AYT Sayısal in the YKS exam mode. Clock fixed at 5 Nov 2026 10:00 Istanbul.
// Usage: node stage22b-test.cjs <baseUrl>
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
      // no storage on about:blank
    }
  }, [LANG_KEY, lang]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + '/quiz-center');
  await page.waitForTimeout(300);
  return { context, page };
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] the start screen groups the exams: TYT (2) and AYT · Sayısal (3: mini, Matematik, Fen)', async () => {
    const { context, page } = await open(browser);
    assert((await tid(page, 'exam-mode').innerText()).includes('Deneme sınavı · YKS'), 'title');
    assert((await tid(page, 'exam-group-tyt').locator('button').count()) === 2, 'TYT buttons');
    const ayt = tid(page, 'exam-group-ayt-say');
    assert((await ayt.locator('button').count()) === 3, 'AYT buttons');
    assert((await tid(page, 'button-exam-start-ayt-say-mini').innerText()).includes('40 soru · 45 dakika'), 'mini info');
    assert((await tid(page, 'button-exam-start-ayt-mat').innerText()).includes('AYT Matematik testi'), 'math test');
    assert((await tid(page, 'button-exam-start-ayt-fen').innerText()).includes('AYT Fen Bilimleri testi'), 'science test');
    await context.close();
  });

  await check('[tr] AYT Sayısal mini: 45:00, AYT Matematik 20 and AYT Fen Bilimleri 20, five options; math questions first', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-say-mini').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('45:00'), 'timer');
    assert((await tid(page, 'exam-tab-aytmatematik').innerText()).includes('0/20'), 'math 20');
    assert((await tid(page, 'exam-tab-aytfen').innerText()).includes('0/20'), 'science 20');
    assert((await tid(page, 'exam-tab-turkce').count()) === 0, 'no TYT tabs');
    assert((await page.locator('[data-testid^="exam-option-"]').count()) === 5, 'five options');
    assert((await tid(page, 'exam-question').innerText()).includes('Soru 1 / 40 · Matematik'), await tid(page, 'exam-question').innerText());
    await tid(page, 'exam-tab-aytfen').click();
    assert(/Soru 21 \/ 40 · Fizik/.test(await tid(page, 'exam-question').innerText()), 'science starts at 21 with physics');
    await context.close();
  });

  await check('finishing an AYT mini exam shows two rows (AYT Matematik, AYT Fen Bilimleri) and saves it with its kind', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-say-mini').click();
    for (let i = 0; i < 5; i += 1) {
      await tid(page, 'exam-option-B').click();
      await tid(page, 'button-exam-next').click();
    }
    await tid(page, 'button-exam-finish').click();
    assert((await tid(page, 'exam-finish-confirm').innerText()).includes('35 soru boş'), 'blank count');
    await tid(page, 'button-exam-finish-confirm').click();
    await page.waitForTimeout(200);
    assert((await tid(page, 'exam-result-row-aytmatematik').count()) === 1 && (await tid(page, 'exam-result-row-aytfen').count()) === 1, 'rows');
    assert((await tid(page, 'exam-result-row-turkce').count()) === 0, 'no TYT rows');
    const data = await saved(page);
    assert(data.results.length === 1 && data.results[0].kind === 'ayt-say-mini', JSON.stringify(data.results.map((r) => r.kind)));
    assert(data.results[0].questionIds.every((id) => id.startsWith('ayt-')), 'AYT ids');
    await tid(page, 'button-exam-back').click();
    await page.waitForTimeout(200);
    assert((await tid(page, 'exam-history-item').first().innerText()).includes('AYT Sayısal mini deneme'), 'history label');
    await context.close();
  });

  await check('the AYT Matematik test has one tab with 40 questions; the AYT Fen test has Fizik, Kimya and Biyoloji', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-mat').click();
    assert((await tid(page, 'exam-tab-aytmatematik').innerText()).includes('0/40'), 'math 40');
    assert((await page.locator('[role="tab"]').count()) === 1, 'one tab');
    await tid(page, 'button-exam-finish').click();
    await tid(page, 'button-exam-finish-confirm').click();
    await tid(page, 'button-exam-back').click();
    await tid(page, 'button-exam-start-ayt-fen').click();
    assert((await tid(page, 'exam-tab-aytfen').innerText()).includes('0/40'), 'science 40');
    const subjects = new Set();
    for (let i = 1; i <= 40; i += 13) {
      await tid(page, `exam-grid-${i}`).click();
      subjects.add((await tid(page, 'exam-question').innerText()).split('·')[1].trim());
    }
    assert(subjects.has('Fizik') && subjects.has('Kimya') && subjects.has('Biyoloji'), [...subjects].join(','));
    await context.close();
  });

  await check('[en] English mode: AYT labels in English, questions stay Turkish', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'exam-group-ayt-say').innerText()).includes('AYT Sayısal mini exam'), 'label');
    await tid(page, 'button-exam-start-ayt-say-mini').click();
    assert((await tid(page, 'exam-tab-aytmatematik').innerText()).includes('AYT Mathematics'), 'tab');
    assert(/olduğuna göre|kaçtır/.test(await tid(page, 'exam-question').innerText()), 'Turkish question');
    await context.close();
  });

  await check('[tr] phone: the start screen and an AYT exam fit (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    let wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'start screen');
    await tid(page, 'button-exam-start-ayt-say-mini').click();
    wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'exam screen');
    await context.close();
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22b-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
