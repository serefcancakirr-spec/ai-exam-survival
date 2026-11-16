// Browser tests for Stage 23: install as an app (PWA). Runs against the GitHub Pages copy (pages-server.cjs),
// at the github.io sub-folder and at the custom domain, like stage09-test.
// Usage: node stage23-test.cjs <siteUrl> <builtDir>   (builtDir = the folder pages-server serves; sw.js is changed
// there for a moment to act as a new version, then put back)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SITE = (process.argv[2] || 'http://127.0.0.1:4190/ai-exam-survival').replace(/\/$/, '');
const DIR = path.resolve(process.argv[3] || '.');
const LANG_KEY = 'ai-exam-survival:language:v1';
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

async function open(browser, { lang = 'tr', viewport = { width: 800, height: 1280 }, at = '/' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem(key, value);
    }
  }, [LANG_KEY, lang]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(SITE + at);
  await page.waitForSelector('#root *');
  return { context, page };
}

/** Waits until sw.js is installed and controls the page (a reload makes the first page controlled). */
async function controlled(page) {
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  if (!(await page.evaluate(() => !!navigator.serviceWorker.controller))) {
    await page.reload();
    await page.waitForSelector('#root *');
  }
  assert(await page.evaluate(() => !!navigator.serviceWorker.controller), 'page not controlled by sw.js');
}

const swVersion = (page) => page.evaluate(() => new Promise((resolve) => {
  const channel = new MessageChannel();
  channel.port1.onmessage = (e) => resolve(e.data);
  navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
}));

/** Acts like Chrome's install offer: a beforeinstallprompt event with prompt() and userChoice. */
const fakeInstallOffer = (page) => page.evaluate(() => {
  const event = new Event('beforeinstallprompt', { cancelable: true });
  window.__prompted = 0;
  event.prompt = () => { window.__prompted += 1; return Promise.resolve(); };
  event.userChoice = Promise.resolve({ outcome: 'accepted' });
  window.dispatchEvent(event);
});

(async () => {
  const browser = await chromium.launch();

  await check('manifest and icons load from the right address; sw.js is registered for the site and controls the page', async () => {
    const { context, page } = await open(browser);
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    const manifestUrl = new URL(href, page.url()).href;
    assert(manifestUrl === `${SITE}/manifest.webmanifest`, manifestUrl);
    const manifest = await page.evaluate((u) => fetch(u).then((r) => r.json()), manifestUrl);
    assert(manifest.short_name === 'Exam Survival' && manifest.display === 'standalone', 'manifest');
    for (const icon of manifest.icons) {
      const status = await page.evaluate((u) => fetch(u).then((r) => r.status), new URL(icon.src, manifestUrl).href);
      assert(status === 200, `${icon.src}: ${status}`);
    }
    await controlled(page);
    const scope = await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.scope));
    assert(scope === `${SITE}/`, scope);
    await context.close();
  });

  await check('[tr] install button: hidden without an install offer; shown on the home page and About when offered; tapping asks the browser and hides it', async () => {
    const { context, page } = await open(browser);
    assert((await tid(page, 'button-install-app').count()) === 0, 'button without an offer');
    await fakeInstallOffer(page);
    const button = tid(page, 'button-install-app');
    assert((await button.innerText()).includes('Uygulama olarak yükle'), 'hero button text');
    const cta = await tid(page, 'link-start-planning').boundingBox();
    const box = await button.boundingBox();
    assert(box.y > cta.y, 'button under "Sıradaki adımını bul"');
    await button.click();
    assert((await page.evaluate(() => window.__prompted)) === 1, 'prompt() not called');
    assert((await tid(page, 'button-install-app').count()) === 0, 'button still shown after tapping');
    await page.goto(`${SITE}/about`);
    await page.waitForSelector('[data-testid="about-install"]');
    const text = await tid(page, 'about-install').innerText();
    assert(text.includes('Uygulama olarak yükle') && text.includes('Ana Ekrana Ekle') && text.includes('Ana ekrana ekle'), text);
    await fakeInstallOffer(page);
    assert((await tid(page, 'button-install-app-about').count()) === 1, 'About button');
    assert((await tid(page, 'about-privacy').innerText()).includes('önbelleğinde'), 'privacy sentence');
    await context.close();
  });

  await check('offline: after one visit the home page, a sub-page opened directly and About work without internet; saved data stays', async () => {
    const { context, page } = await open(browser);
    await controlled(page);
    await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ marker: 'stage23' })), PLANNER_KEY);
    await context.setOffline(true);
    for (const at of ['/', '/quiz-center', '/smart-flashcards', '/about']) {
      await page.goto(SITE + at);
      await page.waitForSelector('#root header, #root main', { timeout: 8000 });
      const text = await page.locator('#root').innerText();
      assert(text.length > 200, `${at} empty offline`);
    }
    assert((await tid(page, 'about-page').count()) === 1, 'About offline');
    const planner = await page.evaluate((k) => localStorage.getItem(k), PLANNER_KEY);
    assert(planner === JSON.stringify({ marker: 'stage23' }), 'saved data changed');
    await context.setOffline(false);
    await context.close();
  });

  await check('listening recordings: kept after the first play, then play (also in parts) without internet', async () => {
    const { context, page } = await open(browser);
    await controlled(page);
    const url = `${SITE}/audio/en/a1-listen-1.mp3`;
    const get = (range) => page.evaluate(async ([u, r]) => {
      const res = await fetch(u, r ? { headers: { Range: r } } : {});
      const size = (await res.arrayBuffer()).byteLength;
      return { status: res.status, size, range: res.headers.get('content-range') };
    }, [url, range]);
    const whole = await get(null);
    assert(whole.status === 200 && whole.size > 10000, JSON.stringify(whole));
    await context.setOffline(true);
    const again = await get(null);
    assert(again.status === 200 && again.size === whole.size, `offline whole ${JSON.stringify(again)}`);
    const part = await get('bytes=100-199');
    assert(part.status === 206 && part.size === 100 && part.range === `bytes 100-199/${whole.size}`, JSON.stringify(part));
    const tail = await get('bytes=1000-');
    assert(tail.status === 206 && tail.size === whole.size - 1000, JSON.stringify(tail));
    await context.setOffline(false);
    await context.close();
  });

  await check('[tr] new version: "Yeni sürüm hazır" appears, "Yenile" switches to it, saved data stays', async () => {
    const swFile = path.join(DIR, 'sw.js');
    const original = fs.readFileSync(swFile, 'utf8');
    try {
      const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
      await controlled(page);
      const before = await swVersion(page);
      await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ marker: 'keep' })), PLANNER_KEY);
      assert((await tid(page, 'pwa-update').count()) === 0, 'notice without an update');
      fs.writeFileSync(swFile, original.replace(/const VERSION = "[0-9a-f]+";/, 'const VERSION = "testnew00000";'));
      await page.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()));
      await tid(page, 'pwa-update').waitFor({ timeout: 10000 });
      const text = await tid(page, 'pwa-update').innerText();
      assert(text.includes('Yeni sürüm hazır.') && text.includes('Kayıtların yerinde kalır.') && text.includes('Yenile'), text);
      // On a phone the notice must not cover Menti's chat button.
      const notice = await tid(page, 'pwa-update').boundingBox();
      const chat = await tid(page, 'menti-chat-button').boundingBox();
      assert(notice.x + notice.width <= chat.x || notice.y + notice.height <= chat.y, 'notice covers the chat button');
      await Promise.all([page.waitForEvent('load'), tid(page, 'button-pwa-update').click()]);
      await page.waitForSelector('#root *');
      assert((await swVersion(page)) === 'testnew00000', `still ${before}`);
      assert((await tid(page, 'pwa-update').count()) === 0, 'notice after refresh');
      assert((await page.evaluate((k) => localStorage.getItem(k), PLANNER_KEY)) === JSON.stringify({ marker: 'keep' }), 'saved data changed');
      const caches = await page.evaluate(() => caches.keys());
      assert(!caches.some((c) => c.includes(before)), `old cache kept: ${caches}`);
      await context.close();
    } finally {
      fs.writeFileSync(swFile, original);
    }
  });

  await check('[en] English texts on About and in the install button', async () => {
    const { context, page } = await open(browser, { lang: 'en', at: '/about' });
    await page.waitForSelector('[data-testid="about-install"]');
    const text = await tid(page, 'about-install').innerText();
    assert(text.includes('Install as an app') && text.includes('Add to Home Screen'), text);
    await fakeInstallOffer(page);
    assert((await tid(page, 'button-install-app-about').innerText()).includes('Install as an app'), 'EN button');
    await context.close();
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : `\n     ${r.detail}`}`);
  const pageErrors = errors.filter((e) => !/Failed to fetch|NetworkError|net::ERR/.test(e));
  if (pageErrors.length) console.log(`page errors:\n${pageErrors.join('\n')}`);
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
  process.exit(results.every((r) => r.ok) ? 0 : 1);
})();
