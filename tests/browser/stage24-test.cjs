// Browser tests for Stage 24: the "Nasıl kullanılır?" guide. Runs WITHOUT guide-seen.cjs (every context is a new student).
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage24-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const GUIDE_KEY = 'ai-exam-survival:guide:v1';
const PLANNER_KEY = 'ai-exam-survival:study-planner:v1';
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
const guideValue = (page) => page.evaluate((k) => localStorage.getItem(k), GUIDE_KEY);

async function open(browser, { lang = null, at = '/', seed = {}, viewport = { width: 800, height: 1280 } } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  const values = { ...seed };
  if (lang) values[LANG_KEY] = lang;
  await context.addInitScript((entries) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of entries) localStorage.setItem(k, v);
    }
  }, Object.entries(values));
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + at);
  await page.waitForSelector('#root *');
  await page.waitForTimeout(300);
  return { context, page };
}

function lowContrast(page, rootSelector) {
  return page.evaluate((rootSelector) => {
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
    const walker = document.createTreeWalker(document.querySelector(rootSelector), NodeFilter.SHOW_TEXT);
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
  }, rootSelector);
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] a new student on the home page: the guide opens by itself, goes through 7 steps (back works), Bitir saves it once', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'guide').waitFor();
    assert((await tid(page, 'guide-step-count').innerText()) === '1 / 7', 'step count');
    assert((await tid(page, 'guide-title').innerText()) === 'Hoş geldin! Ben Menti.', 'welcome title');
    assert((await tid(page, 'guide-go').count()) === 0 && (await tid(page, 'guide-back').count()) === 0, 'welcome has no tool link and no back');
    assert((await guideValue(page)) === null, 'saved before closing');
    const titles = [];
    for (let i = 0; i < 6; i += 1) {
      await tid(page, 'guide-next').click();
      titles.push(await tid(page, 'guide-title').innerText());
    }
    assert(titles.join('|') === 'Çalışma Planlayıcı|Test Merkezi|Akıllı Bilgi Kartları|Sınav Takvimi|Çalışma Koçu ve Menti|İlerleme Takibi', titles.join('|'));
    assert((await tid(page, 'guide-next').innerText()).includes('Bitir'), 'last button is Bitir');
    await tid(page, 'guide-back').click();
    assert((await tid(page, 'guide-step-count').innerText()) === '6 / 7', 'back');
    await tid(page, 'guide-next').click();
    await tid(page, 'guide-next').click();
    assert((await tid(page, 'guide').count()) === 0, 'closed after Bitir');
    assert((await guideValue(page)) === '{"version":1,"seen":true}', `saved ${await guideValue(page)}`);
    await page.reload();
    await page.waitForTimeout(500);
    assert((await tid(page, 'guide').count()) === 0, 'opened again after reload');
    await context.close();
  });

  await check('Atla, the ✕ button, Escape and a tap outside each close it and it stays closed', async () => {
    for (const how of ['skip', 'close', 'escape', 'outside']) {
      const { context, page } = await open(browser);
      await tid(page, 'guide').waitFor();
      if (how === 'skip') await tid(page, 'guide-skip').click();
      if (how === 'close') await tid(page, 'guide-close').click();
      if (how === 'escape') await page.keyboard.press('Escape');
      if (how === 'outside') await tid(page, 'guide-overlay').click({ position: { x: 5, y: 5 } });
      assert((await tid(page, 'guide').count()) === 0, `${how}: still open`);
      assert((await guideValue(page)) !== null, `${how}: not saved`);
      await context.close();
    }
  });

  await check('does not open by itself for a student who already has saved data, or on another page; a visit writes nothing', async () => {
    let { context, page } = await open(browser, { seed: { [PLANNER_KEY]: JSON.stringify({ version: 1, sessions: [] }) } });
    assert((await tid(page, 'guide').count()) === 0, 'opened for an existing student');
    assert((await guideValue(page)) === null, 'visit wrote the guide key');
    await context.close();
    ({ context, page } = await open(browser, { at: '/quiz-center' }));
    assert((await tid(page, 'guide').count()) === 0, 'opened on Quiz Center');
    assert((await guideValue(page)) === null, 'visit wrote the guide key');
    await context.close();
  });

  await check('[tr] "Nasıl kullanılır?" under "Sıradaki adımını bul" opens it again; "Bu araca git" goes to the tool and closes it', async () => {
    const { context, page } = await open(browser, { seed: { [GUIDE_KEY]: '{"version":1,"seen":true}' } });
    assert((await tid(page, 'guide').count()) === 0, 'opened although seen');
    const button = tid(page, 'button-open-guide');
    assert((await button.innerText()).includes('Nasıl kullanılır?'), 'button text');
    assert((await button.boundingBox()).y > (await tid(page, 'link-start-planning').boundingBox()).y, 'under the main button');
    await button.click();
    assert((await tid(page, 'guide-step-count').innerText()) === '1 / 7', 'starts at step 1');
    for (let i = 0; i < 3; i += 1) await tid(page, 'guide-next').click();
    await tid(page, 'guide-go').click();
    await page.waitForURL(/\/smart-flashcards$/);
    assert((await tid(page, 'guide').count()) === 0, 'still open on the tool page');
    await context.close();
  });

  await check('[tr] Menti chat "nasıl kullanılır" shows "Rehberi başlat", which opens the guide; About has the button too', async () => {
    const { context, page } = await open(browser, { at: '/about', seed: { [GUIDE_KEY]: '{"version":1,"seen":true}' } });
    await tid(page, 'button-open-guide-about').click();
    await tid(page, 'guide').waitFor();
    await tid(page, 'guide-close').click();
    await tid(page, 'menti-chat-button').click();
    await tid(page, 'menti-chat-input').fill('nasıl kullanılır');
    await tid(page, 'menti-chat-send').click();
    const link = page.locator('[data-testid="menti-chat-link"]', { hasText: 'Rehberi başlat' }).last();
    await link.waitFor();
    await link.click();
    await tid(page, 'guide').waitFor();
    assert((await tid(page, 'menti-chat').count()) === 0 || !(await tid(page, 'menti-chat').isVisible()), 'chat still open over the guide');
    assert(page.url().endsWith('/about'), 'the page changed');
    await context.close();
  });

  await check('[tr] phone: a bottom sheet inside the screen, every button reachable, no sideways scrolling, readable text (WCAG AA)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 360, height: 640 } });
    await tid(page, 'guide').waitFor();
    for (let i = 0; i < 7; i += 1) {
      const box = await tid(page, 'guide').boundingBox();
      assert(box.x >= 0 && box.x + box.width <= 360 + 0.5 && box.y >= 0 && box.y + box.height <= 640 + 0.5, `step ${i + 1} outside: ${JSON.stringify(box)}`);
      await tid(page, 'guide-next').scrollIntoViewIfNeeded();
      const bad = await lowContrast(page, '[data-testid="guide"]');
      assert(bad.length === 0, `step ${i + 1}: ${bad.slice(0, 3).join(' || ')}`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'sideways scroll');
      await tid(page, 'guide-next').click();
    }
    assert((await tid(page, 'guide').count()) === 0, 'closed at the end');
    await context.close();
  });

  await check('[en] English texts after choosing EN', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    await tid(page, 'guide').waitFor();
    assert((await tid(page, 'guide-title').innerText()) === 'Welcome! I’m Menti.', 'EN title');
    assert((await tid(page, 'guide-next').innerText()).includes('Next') && (await tid(page, 'guide-skip').innerText()) === 'Skip', 'EN buttons');
    await tid(page, 'guide-skip').click();
    assert((await tid(page, 'button-open-guide').innerText()).includes('How to use'), 'EN hero button');
    await context.close();
  });

  await check('"Delete all my data" also removes the guide note', async () => {
    const { context, page } = await open(browser, { at: '/about', seed: { [GUIDE_KEY]: '{"version":1,"seen":true}' } });
    await tid(page, 'button-delete-data').click();
    await tid(page, 'button-delete-confirm').click();
    assert((await guideValue(page)) === null, 'guide key kept');
    await context.close();
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : `\n     ${r.detail}`}`);
  if (errors.length) console.log(`page errors:\n${errors.join('\n')}`);
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
  process.exit(results.every((r) => r.ok) && errors.length === 0 ? 0 : 1);
})();
