// Browser tests for Stage 9 and 12: the app published on GitHub Pages (github.io sub-folder or custom domain).
// Runs against pages-server.cjs (behaves like GitHub Pages). Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage09-test.cjs <siteUrl>   e.g. http://127.0.0.1:4190/ai-exam-survival (github.io address)
//                                         or http://127.0.0.1:4191 (custom domain, site at the root)
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');

const SITE = (process.argv[2] || 'http://127.0.0.1:4190/ai-exam-survival').replace(/\/$/, '');
const ORIGIN = new URL(SITE).origin;
const PREFIX = new URL(SITE).pathname.replace(/\/$/, ''); // "/ai-exam-survival", or "" for a custom domain
const LANG_KEY = 'ai-exam-survival:language:v1';
const PAGES = ['/study-planner', '/quiz-center', '/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker'];
const OLD_TEXTS = [/not live yet/i, /concept preview/i, /tool previews/i, /previews/i, /önizleme/i, /canlı değil/i];
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
const TABLET = { width: 800, height: 1280 };
const LANDSCAPE = { width: 1280, height: 800 };

async function open(browser, { viewport = LANDSCAPE, items = [], path = '/' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
  }, items);
  const page = await context.newPage();
  const failed = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const url = m.location()?.url || '';
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(url);
    // GitHub Pages answers a refreshed sub-page with status 404 (and the app); the browser logs that status.
    const pageStatus = /status of 404/.test(m.text()) && url.replace(/[?#].*$/, '') === page.url().replace(/[?#].*$/, '');
    if (m.type() === 'error' && !fromFonts && !pageStatus) errors.push(`console: ${m.text()}`);
  });
  page.on('response', (r) => {
    if (r.status() >= 400 && r.request().resourceType() !== 'document' && !/fonts\.(googleapis|gstatic)/.test(r.url())) failed.push(`${r.status()} ${r.url()}`);
  });
  page.on('dialog', (d) => d.dismiss());
  const response = await page.goto(SITE + path);
  await page.waitForTimeout(200);
  return { context, page, response, failed };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const h1 = (page) => page.locator('h1').first().innerText();
const bodyText = (page) => page.evaluate(() => document.body.innerText);
const storage = (page) => page.evaluate(() => Object.fromEntries(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));

(async () => {
  const browser = await chromium.launch();

  // Page headings reached by tapping inside the app (the normal way), used as the expected result below.
  const expected = {};
  let notFoundHeading = '';
  await check('home page opens at the website address, Turkish by default, with all files loaded', async () => {
    const { context, page, response, failed } = await open(browser);
    assert(response.status() === 200, `status ${response.status()}`);
    assert(new URL(page.url()).pathname === `${PREFIX}/`, page.url());
    assert((await page.getAttribute('html', 'lang')) === 'tr', 'html lang is not tr');
    assert((await tid(page, 'button-lang-tr').getAttribute('aria-pressed')) === 'true', 'TR not active');
    assert((await page.locator('#all-tools').count()) === 1, 'tools section missing');
    assert(failed.length === 0, failed.join(', '));
    for (const p of PAGES) {
      await page.goto(`${SITE}/`);
      await page.locator(`a[href="${PREFIX}${p}"]`).first().click();
      await page.waitForURL(`**${PREFIX}${p}`);
      expected[p] = await h1(page);
    }
    await context.close();
  });

  await check('page title, description and tab icon are correct on the website', async () => {
    const { context, page } = await open(browser);
    assert((await page.title()) === 'AI Exam Survival', `title: ${await page.title()}`);
    const desc = await page.getAttribute('meta[name="description"]', 'content');
    assert(desc && desc.includes('grades 9–12'), `description: ${desc}`);
    const icon = await page.getAttribute('link[rel="icon"]', 'href');
    assert(icon === `${PREFIX}/favicon.svg`, `icon href: ${icon}`);
    const r = await page.request.get(ORIGIN + icon);
    assert(r.status() === 200 && (r.headers()['content-type'] || '').includes('svg'), `icon status ${r.status()}`);
    await context.close();
  });

  for (const p of PAGES) {
    await check(`refreshing ${p} on the website opens the same page (no blank page, no "not found")`, async () => {
      const { context, page, failed } = await open(browser, { path: p });
      assert(new URL(page.url()).pathname === PREFIX + p, `address changed to ${page.url()}`);
      const first = await h1(page);
      assert(expected[p] && first === expected[p], `heading "${first}" instead of "${expected[p]}"`);
      await page.reload();
      await page.waitForTimeout(150);
      assert((await h1(page)) === expected[p], 'heading changed after a second refresh');
      assert(failed.length === 0, failed.join(', '));
      await context.close();
    });
  }

  await check('an unknown address on the website shows the app\'s own "page not found" page', async () => {
    const { context, page } = await open(browser, { path: '/no-such-page' });
    notFoundHeading = await h1(page);
    assert(notFoundHeading && !Object.values(expected).includes(notFoundHeading), `heading: ${notFoundHeading}`);
    assert((await tid(page, 'link-home').count()) === 1, 'header missing');
    await context.close();
  });

  await check('header links keep the site address; "all tools" goes back to the home tools section', async () => {
    const { context, page } = await open(browser, { path: '/progress-tracker' });
    await tid(page, 'link-nav-quiz-center').click();
    await page.waitForURL(`**${PREFIX}/quiz-center`);
    assert((await h1(page)) === expected['/quiz-center'], 'quiz heading');
    await tid(page, 'link-nav-all-tools').click();
    await page.waitForTimeout(400);
    const u = new URL(page.url());
    assert(u.pathname === `${PREFIX}/` && u.hash === '#all-tools', `went to ${page.url()}`);
    await tid(page, 'link-home').click();
    await page.waitForTimeout(150);
    assert(new URL(page.url()).pathname === `${PREFIX}/`, `logo went to ${page.url()}`);
    await context.close();
  });

  await check('tablet menu (portrait) links keep the website address', async () => {
    const { context, page } = await open(browser, { viewport: TABLET });
    if (await tid(page, 'button-mobile-menu').isVisible()) await tid(page, 'button-mobile-menu').click();
    const link = (await tid(page, 'link-mobile-exam-calendar').isVisible()) ? tid(page, 'link-mobile-exam-calendar') : tid(page, 'link-nav-exam-calendar');
    const href = await link.getAttribute('href');
    assert(href === `${PREFIX}/exam-calendar`, `href ${href}`);
    await context.close();
  });

  await check('saved student data is kept exactly after refreshing every page on the website', async () => {
    const items = Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);
    const { context, page } = await open(browser, { items, path: '/progress-tracker' });
    const before = await storage(page);
    for (const [k, v] of items) assert(before[k] === v, `${k} not stored`);
    for (const p of ['', ...PAGES]) {
      await page.goto(SITE + p + (p ? '' : '/'));
      await page.waitForTimeout(120);
      await page.reload();
      await page.waitForTimeout(120);
    }
    const after = await storage(page);
    for (const [k, v] of items) assert(after[k] === v, `${k} changed`);
    assert(!(LANG_KEY in after), 'language saved without tapping TR/EN');
    assert(/Mathematics|Matematik/.test(await bodyText(page)), 'progress data not shown');
    await context.close();
  });

  await check('language choice is remembered after refreshing a sub-page on the website', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await tid(page, 'button-lang-en').click();
    await page.waitForTimeout(100);
    await page.reload();
    await page.waitForTimeout(150);
    assert((await page.evaluate((k) => localStorage.getItem(k), LANG_KEY)) === 'en', 'not saved');
    assert((await page.getAttribute('html', 'lang')) === 'en', 'html lang not en after refresh');
    assert((await tid(page, 'button-lang-en').getAttribute('aria-pressed')) === 'true', 'EN not active');
    await context.close();
  });

  for (const lang of ['tr', 'en']) {
    for (const [vname, viewport] of [['tablet portrait', TABLET], ['tablet landscape', LANDSCAPE]]) {
      await check(`[${lang}, ${vname}] home page has no outdated "preview / not live yet" texts and fits the screen`, async () => {
        const { context, page } = await open(browser, { viewport, items: [[LANG_KEY, lang]] });
        const text = await bodyText(page);
        const bad = OLD_TEXTS.filter((re) => re.test(text)).map(String);
        assert(bad.length === 0, `found ${bad.join(', ')}`);
        const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert(o <= 0, `page wider than screen by ${o}px`);
        await context.close();
      });
    }
  }

  await check('no JavaScript errors during any Stage 9 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failedCount = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failedCount}/${results.length} passed`);
})();
