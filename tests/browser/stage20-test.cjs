// Browser tests for Stage 20A + 20B: the calm "Sisli Mavi ve Kum" look (colours, fonts, no grid, no floating cards)
// and readable text everywhere (WCAG AA contrast). Stage 20B "Okul Defteri": paper look, plain labels, simpler home texts. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage20-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const results = [];
const errors = [];
async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message || e).split('\n').slice(0, 8).join(' | ') });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const VIEWPORTS = { phone: { width: 390, height: 844 }, 'tablet portrait': { width: 800, height: 1280 }, 'tablet landscape': { width: 1280, height: 800 } };
const PAGES = ['/', '/study-planner', '/quiz-center', '/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker', '/about', '/not-a-page'];
const fullData = () => Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);

async function open(browser, { viewport = VIEWPORTS['tablet portrait'], lang = 'tr', items = fullData(), path = '/' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
  }, [[LANG_KEY, lang], ...items]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + path);
  await page.waitForTimeout(300);
  return { context, page };
}

// Every visible piece of text must reach WCAG AA contrast against the colour behind it:
// 4.5:1 for normal text, 3:1 for large text (24px+, or 18.66px+ bold). Text on pictures or gradients is skipped.
function lowContrast(page) {
  return page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = 1] = m[1].split(',').map((x) => parseFloat(x));
      return [r, g, b, a];
    };
    const over = (top, under) => top.slice(0, 3).map((v, i) => v * top[3] + under[i] * (1 - top[3])).concat(1);
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const bgOf = (el) => {
      const chain = [];
      for (let x = el; x; x = x.parentElement) chain.push(x);
      let color = [255, 255, 255, 1];
      for (const x of chain.reverse()) {
        const s = getComputedStyle(x);
        if (s.backgroundImage && s.backgroundImage !== 'none') return null;
        const c = parse(s.backgroundColor);
        if (c && c[3] > 0) color = over(c, color);
      }
      return color;
    };
    const bad = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const el = n.parentElement;
      if (!el || seen.has(el) || !n.textContent.trim() || el.closest('svg, [aria-hidden="true"], script, style, option')) continue;
      seen.add(el);
      const rect = el.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      const s = getComputedStyle(el);
      if (s.visibility === 'hidden' || el.closest('[disabled]')) continue;
      let opacity = 1;
      for (let x = el; x; x = x.parentElement) opacity *= parseFloat(getComputedStyle(x).opacity);
      if (opacity < 0.05) continue;
      const fg = parse(s.color);
      const bg = bgOf(el);
      if (!fg || !bg) continue;
      const text = over([fg[0], fg[1], fg[2], fg[3] * opacity], bg);
      const size = parseFloat(s.fontSize);
      const large = size >= 24 || (size >= 18.66 && parseInt(s.fontWeight, 10) >= 700);
      const r = ratio(text, bg);
      if (r < (large ? 3 : 4.5)) bad.push(`${r.toFixed(2)} "${n.textContent.trim().slice(0, 40)}" ${s.color} on rgb(${bg.slice(0, 3).map(Math.round)}) ${size}px`);
    }
    return bad;
  });
}

(async () => {
  const browser = await chromium.launch();

  for (const [vpName, viewport] of [['tablet portrait', VIEWPORTS['tablet portrait']], ['phone', VIEWPORTS.phone]]) {
    for (const path of PAGES) {
      await check(`[tr] ${vpName} ${path}: all text is easy to read (WCAG AA contrast)`, async () => {
        const { context, page } = await open(browser, { viewport, path });
        const bad = await lowContrast(page);
        await context.close();
        assert(bad.length === 0, `${bad.length} low-contrast texts: ${bad.slice(0, 6).join(' || ')}`);
      });
    }
  }

  await check('[en] home, Quiz Center and Study Coach are easy to read in English too', async () => {
    for (const path of ['/', '/quiz-center', '/ai-study-coach']) {
      const { context, page } = await open(browser, { lang: 'en', path });
      const bad = await lowContrast(page);
      await context.close();
      assert(bad.length === 0, `${path}: ${bad.slice(0, 6).join(' || ')}`);
    }
  });

  await check('[tr] empty pages (no saved data) are easy to read', async () => {
    for (const path of ['/study-planner', '/exam-calendar', '/progress-tracker', '/smart-flashcards']) {
      const { context, page } = await open(browser, { items: [], path });
      const bad = await lowContrast(page);
      await context.close();
      assert(bad.length === 0, `${path}: ${bad.slice(0, 6).join(' || ')}`);
    }
  });

  await check('[tr] a quiz in progress, a chosen answer and the results with the review are easy to read', async () => {
    const { context, page } = await open(browser, { items: [], path: '/quiz-center' });
    await page.locator('[data-testid="button-start-quiz"]').click();
    await page.waitForTimeout(200);
    let bad = await lowContrast(page);
    assert(bad.length === 0, `question: ${bad.slice(0, 6).join(' || ')}`);
    for (let i = 0; i < 5; i += 1) {
      await page.locator('[data-testid^="button-quiz-answer-"]').nth(i % 2).click();
      await page.waitForTimeout(100);
      if (i === 0) {
        bad = await lowContrast(page);
        assert(bad.length === 0, `chosen answer: ${bad.slice(0, 6).join(' || ')}`);
      }
      const next = page.locator('[data-testid="button-quiz-next"]:not([disabled]), [data-testid="button-submit-quiz"]:not([disabled])').first();
      if (await next.count()) await next.click();
      await page.waitForTimeout(150);
    }
    assert(await page.locator('[data-testid="button-retry-quiz"]').count() === 1, 'results page reached');
    bad = await lowContrast(page);
    await context.close();
    assert(bad.length === 0, `results: ${bad.slice(0, 6).join(' || ')}`);
  });

  await check('[tr] the Menti chat window is easy to read', async () => {
    const { context, page } = await open(browser, { path: '/' });
    await page.locator('[data-testid="menti-chat-button"]').click();
    await page.waitForTimeout(300);
    const bad = await lowContrast(page);
    await context.close();
    assert(bad.length === 0, bad.slice(0, 6).join(' || '));
  });

  await check('fonts: headings use Lora, text uses Source Sans 3; letter spacing of big titles is relaxed', async () => {
    const { context, page } = await open(browser, { path: '/' });
    const f = await page.evaluate(() => ({
      body: getComputedStyle(document.body).fontFamily,
      h1: getComputedStyle(document.querySelector('h1')).fontFamily,
      spacing: parseFloat(getComputedStyle(document.querySelector('h1')).letterSpacing) / parseFloat(getComputedStyle(document.querySelector('h1')).fontSize),
      css: [...document.styleSheets].some((s) => { try { return [...s.cssRules].some((r) => /Lora/.test(r.cssText) && /Source\+Sans\+3/.test(r.cssText)); } catch { return false; } }),
    }));
    await context.close();
    assert(/^"?Source Sans 3/.test(f.body), f.body);
    assert(/^"?Lora/.test(f.h1), f.h1);
    assert(f.spacing > -0.02, `h1 letter spacing ${f.spacing}em`);
    assert(f.css, 'Google Fonts import for Lora and Source Sans 3');
  });

  await check('calm details: no grid pattern behind the hero, the preview cards do not float', async () => {
    const { context, page } = await open(browser, { path: '/' });
    const d = await page.evaluate(() => ({
      grid: [...document.querySelectorAll('.hero-grid')].map((e) => getComputedStyle(e).backgroundImage),
      float: [...document.querySelectorAll('.float-card, .float-card-late')].map((e) => getComputedStyle(e).animationName),
    }));
    await context.close();
    assert(d.grid.length > 0 && d.grid.every((g) => g === 'none'), JSON.stringify(d.grid));
    assert(d.float.length === 2 && d.float.every((a) => a === 'none'), JSON.stringify(d.float));
  });

  await check('the old navy / violet / cyan colours are gone from every page; Menti keeps its own blue', async () => {
    const OLD = ['rgb(24, 34, 77)', 'rgb(81, 68, 199)', 'rgb(98, 216, 220)', 'rgb(32, 44, 104)', 'rgb(67, 55, 176)'];
    for (const path of PAGES) {
      const { context, page } = await open(browser, { path });
      const found = await page.evaluate((old) => {
        const hits = [];
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest('svg')) continue;
          const s = getComputedStyle(el);
          for (const c of [s.color, s.backgroundColor, s.borderTopColor]) if (old.includes(c)) hits.push(`${el.tagName}.${String(el.className).slice(0, 40)} ${c}`);
        }
        return hits;
      }, OLD);
      const menti = await page.locator('.menti-figure svg').count();
      await context.close();
      assert(found.length === 0, `${path}: ${found.slice(0, 4).join(' | ')}`);
      if (path === '/') assert(menti > 0, 'Menti is still drawn on the home page');
    }
  });

  await check('20B: no small CAPITAL letter-spaced labels, no decorative circles, no floating shadows on any page', async () => {
    for (const path of PAGES) {
      const { context, page } = await open(browser, { path });
      const d = await page.evaluate(() => {
        const caps = [], circles = [], shadows = [];
        for (const el of document.querySelectorAll('body *')) {
          if (el.closest('svg, .menti-figure, .menti-bubble, [data-testid="menti-chat-button"]')) continue; // Menti keeps its own look
          const s = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          if (s.textTransform === 'uppercase' && el.textContent.trim()) caps.push(el.textContent.trim().slice(0, 30));
          if (s.position === 'absolute' && r.width >= 100 && r.height >= 100 && parseFloat(s.borderTopLeftRadius) >= r.width / 2 - 1) circles.push(`${Math.round(r.width)}px`);
          // invisible shadows and thin selection rings (0 0 0 Npx) are fine; only soft floating shadows count
          const sh = s.boxShadow.replace(/rgba?\([^)]*\) 0px 0px 0px \d+px,? ?/g, '').trim();
          if (sh && sh !== 'none' && r.width > 0) shadows.push(`${el.tagName} ${s.boxShadow.slice(0, 40)}`);
        }
        return { caps, circles, shadows };
      });
      await context.close();
      assert(d.caps.length === 0, `${path} capitals: ${d.caps.slice(0, 4).join(' | ')}`);
      assert(d.circles.length === 0, `${path} circles: ${d.circles.join(', ')}`);
      assert(d.shadows.length === 0, `${path} shadows: ${d.shadows.slice(0, 3).join(' | ')}`);
    }
  });

  await check('20B: tool page headers are light paper with a blue margin line; the page background is warm paper', async () => {
    for (const path of PAGES.filter((x) => !['/', '/not-a-page'].includes(x))) {
      const { context, page } = await open(browser, { path });
      const d = await page.evaluate(() => {
        const h = document.querySelector('h1').closest('section');
        const s = getComputedStyle(h);
        return { bg: s.backgroundColor, left: s.borderLeftColor, leftW: s.borderLeftWidth, body: getComputedStyle(document.body).backgroundColor };
      });
      await context.close();
      assert(d.bg === 'rgb(251, 248, 241)' && d.left === 'rgb(83, 118, 160)' && d.leftW === '6px', `${path} ${JSON.stringify(d)}`);
      assert(d.body === 'rgb(247, 242, 233)', `${path} body ${d.body}`);
    }
  });

  await check('20B: home uses the simpler texts (TR and EN) and the tool cards have no 01–06 numbers', async () => {
    for (const [lang, words] of [['tr', ['Sınavlara', 'adım adım hazırlan.', 'Altı çalışma', 'Hemen bir araç seç.']], ['en', ['Prepare for exams', 'step by step.', 'Six study', 'Pick a tool now.']]]) {
      const { context, page } = await open(browser, { lang, path: '/' });
      const text = await page.locator('main, body').first().innerText();
      const nums = await page.locator('a[data-testid^="link-tool-"]').evaluateAll((els) => els.filter((e) => /\b0[1-6]\b/.test(e.innerText)).length);
      await context.close();
      for (const w of words) assert(text.includes(w), `${lang}: missing "${w}"`);
      assert(!/küçülsün|altı küçük yol|smaller\.|big difference/.test(text), `${lang}: old slogan still shown`);
      assert(nums === 0, `${lang}: ${nums} tool cards still show a number`);
    }
  });

  await check('saved data keys are untouched by just visiting every page', async () => {
    const items = fullData();
    const { context, page } = await open(browser, { items, path: '/' });
    for (const path of PAGES) { await page.goto(BASE + path); await page.waitForTimeout(150); }
    const saved = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)])));
    await context.close();
    for (const [k, v] of items) assert(saved[k] === v, `${k} changed`);
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage20-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
