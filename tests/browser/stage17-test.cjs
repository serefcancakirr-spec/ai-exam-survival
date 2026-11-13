// Browser tests for Stage 17: About and Privacy page. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage17-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const { EN, TR } = require('../out/dict.cjs');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const APP_KEYS = [
  'ai-exam-survival:study-planner:v1', 'ai-exam-survival:quiz-center:v1', 'ai-exam-survival:flashcards:v1',
  'ai-exam-survival:exam-calendar:v1', 'ai-exam-survival:exam-prep:v1', 'ai-exam-survival:study-coach:v1',
  'ai-exam-survival:focus:v1', LANG_KEY,
];
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

async function open(browser, { viewport = VIEWPORTS['tablet portrait'], lang = 'tr', items = [], path = '/about' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
  }, lang ? [[LANG_KEY, lang], ...items] : items);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  page.on('dialog', (d) => d.dismiss());
  await page.goto(BASE + path);
  await page.waitForTimeout(200);
  return { context, page };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const allSaved = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
const fullData = () => {
  const raw = F.realisticRaw();
  return [...Object.entries(raw).map(([k, v]) => [F.KEYS[k], v]), ['ai-exam-survival:focus:v1', '{"workMinutes":25,"sound":"rain","volume":40,"chime":true}'], ['ai-exam-survival:study-coach:v1', '{"version":1}'], ['another-site:note', 'keep me']];
};

(async () => {
  const browser = await chromium.launch();

  await check('[tr] the About page shows every section in Turkish, with the AI Club, the MEB note and the contact address', async () => {
    const { context, page } = await open(browser);
    const text = await tid(page, 'about-page').innerText();
    for (const key of ['about.title', 'about.whatTitle', 'about.content1', 'about.privacy2', 'about.privacy4', 'about.deleteTitle', 'about.contactTitle']) {
      assert(text.includes(TR[key]), `missing ${key}`);
    }
    assert(/AI Kulübü/.test(text), 'AI Club not named');
    assert(!/MEB onaylı/i.test(text), 'claims MEB approval');
    assert((await tid(page, 'link-contact-email').getAttribute('href')) === 'mailto:aiexamsurvival@gmail.com', 'mailto');
    assert((await tid(page, 'menti-about').count()) === 1, 'Menti');
    await context.close();
  });

  await check('[en] the About page is in English after switching', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    const text = await tid(page, 'about-page').innerText();
    assert(text.includes(EN['about.title']) && text.includes(EN['about.privacy3']), 'English texts');
    await tid(page, 'button-lang-tr').click();
    assert((await tid(page, 'about-page').innerText()).includes(TR['about.title']), 'Turkish after TR');
    await context.close();
  });

  for (const path of ['/', '/study-planner', '/quiz-center', '/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker']) {
    await check(`footer of ${path} has an “About · Privacy” link that opens the page`, async () => {
      const { context, page } = await open(browser, { path });
      const link = tid(page, 'link-footer-about');
      assert((await link.count()) === 1, 'no footer link');
      assert((await link.innerText()).trim() === TR['about.footerLink'], 'link text');
      await link.click();
      await page.waitForTimeout(150);
      assert(new URL(page.url()).pathname.endsWith('/about'), `went to ${page.url()}`);
      assert(await tid(page, 'about-page').isVisible(), 'page not shown');
      await context.close();
    });
  }

  await check('delete: nothing happens until confirmed; “Cancel” keeps everything', async () => {
    const items = fullData();
    const { context, page } = await open(browser, { items });
    const before = await allSaved(page);
    await tid(page, 'button-delete-data').click();
    assert(await tid(page, 'delete-confirm').isVisible(), 'no confirmation question');
    assert(JSON.stringify(await allSaved(page)) === JSON.stringify(before), 'data changed before confirming');
    await tid(page, 'button-delete-cancel').click();
    assert(JSON.stringify(await allSaved(page)) === JSON.stringify(before), 'data changed after cancel');
    assert(await tid(page, 'button-delete-data').isVisible(), 'button gone after cancel');
    await context.close();
  });

  await check('delete: after “Yes, delete” all app data is gone, other sites’ data stays, and the tools start empty', async () => {
    const { context, page } = await open(browser, { items: fullData() });
    await tid(page, 'button-delete-data').click();
    await tid(page, 'button-delete-confirm').click();
    assert((await tid(page, 'delete-done').innerText()).trim() === TR['about.deleteDone'], 'done message');
    const saved = await allSaved(page);
    for (const key of APP_KEYS) assert(!(key in saved), `${key} still saved`);
    assert(saved['another-site:note'] === 'keep me', 'deleted data that is not ours');
    await page.goto(BASE + '/quiz-center');
    await page.waitForTimeout(200);
    assert((await tid(page, 'quiz-attempt').count()) === 0, 'quiz history still shown');
    await page.goto(BASE + '/progress-tracker');
    await page.waitForTimeout(200);
    assert(!(await page.locator('body').innerText()).includes('Cells & Genetics'), 'progress still shows old data');
    await context.close();
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await check(`${name}: About page fits the screen (no sideways scrolling), also while confirming`, async () => {
      const { context, page } = await open(browser, { viewport });
      let o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 0, `+${o}px`);
      await tid(page, 'button-delete-data').click();
      o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 0, `confirm +${o}px`);
      await context.close();
    });
  }

  await check('no JavaScript errors during any Stage 17 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
