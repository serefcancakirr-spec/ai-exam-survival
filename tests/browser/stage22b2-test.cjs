// Browser tests for Stage 22B-2a: AYT Sözel, Eşit Ağırlık and the full AYT in the exam mode.
// Clock fixed at 5 Nov 2026 10:00 Istanbul. Usage: node stage22b2-test.cjs <baseUrl>
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

  await check('[tr] new groups: “AYT · Sözel ve Eşit Ağırlık” (4 exams) and “AYT · Tam deneme” with its note', async () => {
    const { context, page } = await open(browser);
    assert((await tid(page, 'exam-group-ayt-soz').locator('button').count()) === 4, 'four Sözel/EA exams');
    assert((await tid(page, 'button-exam-start-ayt-full').innerText()).includes('160 soru · 180 dakika'), 'full AYT info');
    assert((await tid(page, 'exam-full-note').innerText()).includes('çözmediğin testler boş sayılır'), 'note');
    await context.close();
  });

  await check('[tr] Sözel mini: Edebiyat–Sosyal Bilimler-1 20 and Sosyal Bilimler-2 20, 45:00', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-soz-mini').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('45:00'), 'timer');
    const t = await tabs(page);
    assert(t.length === 2 && t[0].includes('Edebiyat–Sosyal Bilimler-1') && t[0].includes('0/20') && t[1].includes('Sosyal Bilimler-2') && t[1].includes('0/20'), t.join(' | '));
    assert((await tid(page, 'exam-question').innerText()).includes('Türk Dili ve Edebiyatı'), 'starts with literature');
    await context.close();
  });

  await check('[tr] Eşit Ağırlık mini: Edebiyat–Sosyal Bilimler-1 first, then AYT Matematik (20 each)', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-ea-mini').click();
    const t = await tabs(page);
    assert(t.length === 2 && t[0].includes('Edebiyat–Sosyal Bilimler-1') && t[1].includes('AYT Matematik') && t.every((x) => x.includes('0/20')), t.join(' | '));
    await context.close();
  });

  await check('full AYT: 3:00:00, four tests of 40; finishing at once saves four rows, all blank, net 0', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-full').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('3:00:00'), 'timer');
    const t = await tabs(page);
    assert(t.length === 4 && t.every((x) => x.includes('0/40')), t.join(' | '));
    await tid(page, 'button-exam-finish').click();
    assert((await tid(page, 'exam-finish-confirm').innerText()).includes('160 soru boş'), 'blank count');
    await tid(page, 'button-exam-finish-confirm').click();
    await page.waitForTimeout(200);
    for (const s of ['ayttde', 'aytsos2', 'aytmatematik', 'aytfen']) assert((await tid(page, `exam-result-row-${s}`).count()) === 1, s);
    const data = await saved(page);
    assert(data.results[0].kind === 'ayt-full' && data.results[0].totalNet === 0 && data.results[0].sections.length === 4, JSON.stringify(data.results[0].sections.map((s) => s.section)));
    await context.close();
  });

  await check('the Sosyal Bilimler-2 test shows Tarih, Coğrafya, the philosophy group and Din Kültürü', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ayt-sos2').click();
    const seen = new Set();
    for (let i = 1; i <= 40; i += 1) {
      await tid(page, `exam-grid-${i}`).click();
      seen.add((await tid(page, 'exam-question').innerText()).split('·')[1].trim());
    }
    for (const s of ['Tarih', 'Coğrafya', 'Felsefe', 'Mantık', 'Psikoloji', 'Sosyoloji', 'Din Kültürü ve Ahlak Bilgisi']) assert(seen.has(s), `${s}: ${[...seen].join(',')}`);
    await context.close();
  });

  await check('[en] English labels for the new exams; questions stay Turkish', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'exam-group-ayt-soz').innerText()).includes('AYT Equal Weight mini exam'), 'EA label');
    await tid(page, 'button-exam-start-ayt-tde').click();
    assert((await tabs(page))[0].includes('Literature–Social Sciences-1'), 'tab');
    assert(/aşağıdakilerden hangisi/i.test(await tid(page, 'exam-question').innerText()), 'Turkish question');
    await context.close();
  });

  await check('[tr] phone: the start screen with all groups and the full AYT fit (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    let wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'start screen');
    await tid(page, 'button-exam-start-ayt-full').click();
    wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'full AYT');
    await context.close();
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22b2-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
