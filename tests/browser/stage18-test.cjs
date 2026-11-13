// Browser tests for Stage 18: chat with Menti (rule-based, reads saved data, never writes).
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage18-test.cjs <baseUrl>
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
    results.push({ name, ok: false, detail: String(e.message || e).split('\n')[0] });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const VIEWPORTS = { phone: { width: 390, height: 844 }, 'tablet portrait': { width: 800, height: 1280 }, 'tablet landscape': { width: 1280, height: 800 } };
const realistic = () => Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);

async function open(browser, { viewport = VIEWPORTS['tablet portrait'], lang = 'tr', items = [], path = '/' } = {}) {
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
const lastReply = (page) => page.locator('[data-testid="menti-chat-reply"]').last();
const storageDump = (page) => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
async function openChat(page) {
  await tid(page, 'menti-chat-button').click();
  await page.waitForTimeout(100);
}
async function say(page, text) {
  await tid(page, 'menti-chat-input').fill(text);
  await tid(page, 'menti-chat-send').click();
  await page.waitForTimeout(100);
}

(async () => {
  const browser = await chromium.launch();

  for (const path of ['/', '/study-planner', '/quiz-center', '/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker', '/about', '/no-such-page']) {
    await check(`the Menti chat button is on ${path} and opens the chat`, async () => {
      const { context, page } = await open(browser, { path });
      assert(await tid(page, 'menti-chat-button').isVisible(), 'no button');
      assert((await tid(page, 'menti-chat-button').getAttribute('aria-label')) === 'Menti ile konuş', 'label');
      await openChat(page);
      assert(await tid(page, 'menti-chat').isVisible(), 'chat not open');
      await context.close();
    });
  }

  await check('[tr] with saved work the greeting is personal (today’s plan, nearest exam, weak topic, cards) and shows quick buttons', async () => {
    const { context, page } = await open(browser, { items: realistic() });
    await openChat(page);
    const text = await lastReply(page).innerText();
    assert(text.includes('Merhaba! Ben Menti.'), 'hello');
    assert(/Bugün planında \d+ çalışma oturumu var/.test(text), `plan line: ${text}`);
    assert(/sınavın (bugün|yarın|\d+ gün sonra)/.test(text), 'exam line');
    assert((await tid(page, 'menti-chat-chips').locator('button').count()) === 8, 'chips');
    await context.close();
  });

  await check('[tr] with no saved work Menti invites the student to start, with buttons to the planner and quizzes', async () => {
    const { context, page } = await open(browser);
    await openChat(page);
    const text = await lastReply(page).innerText();
    assert(text.includes('Henüz kayıtlı bir çalışman yok'), text);
    const hrefs = await lastReply(page).locator('[data-testid="menti-chat-link"]').evaluateAll((b) => b.map((x) => x.dataset.href));
    assert(JSON.stringify(hrefs) === JSON.stringify(['/study-planner', '/quiz-center']), hrefs.join(','));
    await context.close();
  });

  await check('a quick button asks the question and Menti answers with real numbers and a link that opens the tool', async () => {
    const { context, page } = await open(browser, { items: realistic() });
    await openChat(page);
    await tid(page, 'menti-chip-weak').click();
    await page.waitForTimeout(100);
    assert((await tid(page, 'menti-chat-me').last().innerText()).trim().endsWith('Zorlandığım konular'), 'question bubble');
    assert((await lastReply(page).getAttribute('data-intent')) === 'weak', 'intent');
    assert(/%\d+/.test(await lastReply(page).innerText()), 'no real percentage');
    await lastReply(page).locator('[data-testid="menti-chat-link"][data-href="/quiz-center"]').click();
    await page.waitForTimeout(200);
    assert(new URL(page.url()).pathname === '/quiz-center', `went to ${page.url()}`);
    assert((await tid(page, 'menti-chat').count()) === 0, 'chat stayed open');
    await openChat(page);
    assert((await page.locator('[data-testid="menti-chat-reply"]').count()) === 2, 'conversation lost while moving between pages');
    await context.close();
  });

  await check('typed messages are understood: anxiety, focus (scrolls to the focus timer), unknown', async () => {
    const { context, page } = await open(browser, { items: realistic() });
    await openChat(page);
    await say(page, 'Sınavdan çok korkuyorum');
    assert((await lastReply(page).getAttribute('data-intent')) === 'anxiety', 'anxiety');
    assert((await lastReply(page).innerText()).includes('rehber öğretmen'), 'counsellor');
    await say(page, 'asdfqwer');
    assert((await lastReply(page).getAttribute('data-intent')) === 'unknown', 'unknown');
    await say(page, 'odaklanamıyorum');
    assert((await lastReply(page).getAttribute('data-intent')) === 'focus', 'focus');
    await lastReply(page).locator('[data-testid="menti-chat-link"]').first().click();
    await page.waitForTimeout(400);
    assert(new URL(page.url()).pathname === '/study-planner', 'not on planner');
    const box = await tid(page, 'focus-timer').boundingBox();
    assert(box && box.y < 844 && box.y + 40 > 0, `focus timer not on screen (y=${box && box.y})`);
    await context.close();
  });

  await check('safety: a message about self-harm or bullying gets a caring answer with 112 and the school counsellor, no quick buttons', async () => {
    const { context, page } = await open(browser);
    await openChat(page);
    await say(page, 'yaşamak istemiyorum');
    let text = await lastReply(page).innerText();
    assert((await lastReply(page).getAttribute('data-intent')) === 'safety-harm', 'harm intent');
    assert(text.includes('112') && text.includes('rehber öğretmen'), text);
    assert((await tid(page, 'menti-chat-chips').count()) === 0, 'chips shown under a safety answer');
    await say(page, 'okulda bana zorbalık yapıyorlar');
    text = await lastReply(page).innerText();
    assert((await lastReply(page).getAttribute('data-intent')) === 'safety-bully' && text.includes('112'), 'bully');
    await context.close();
  });

  await check('the chat never writes to saved data (storage identical before and after a long chat)', async () => {
    const { context, page } = await open(browser, { items: realistic() });
    const before = await storageDump(page);
    await openChat(page);
    for (const chip of ['today', 'exams', 'weak', 'cards', 'howto', 'mood', 'anxiety', 'help']) {
      await tid(page, `menti-chip-${chip}`).click();
      await page.waitForTimeout(40);
    }
    await say(page, 'kimsin sen');
    assert((await lastReply(page).innerText()).includes('kaydedilmez'), 'who answer');
    assert((await storageDump(page)) === before, 'saved data changed');
    await page.reload();
    await page.waitForTimeout(200);
    await openChat(page);
    assert((await page.locator('[data-testid="menti-chat-reply"]').count()) === 1, 'chat survived a refresh (should not be saved)');
    await context.close();
  });

  await check('[en] switching to English while the chat is open translates the whole conversation', async () => {
    const { context, page } = await open(browser, { items: realistic() });
    await openChat(page);
    await tid(page, 'menti-chip-cards').click();
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await tid(page, 'button-lang-en').click();
    await openChat(page);
    const all = await tid(page, 'menti-chat-messages').innerText();
    assert(all.includes('Hi! I’m Menti.') && all.includes('card(s)'), all.slice(0, 120));
    assert((await tid(page, 'menti-chat-button').count()) === 0, 'button still shown while open');
    await context.close();
  });

  await check('Escape and the close button close the chat and bring the button back', async () => {
    const { context, page } = await open(browser);
    await openChat(page);
    await page.keyboard.press('Escape');
    assert((await tid(page, 'menti-chat').count()) === 0 && (await tid(page, 'menti-chat-button').isVisible()), 'escape');
    await openChat(page);
    await tid(page, 'menti-chat-close').click();
    assert((await tid(page, 'menti-chat').count()) === 0, 'close button');
    await context.close();
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await check(`${name}: chat fits the screen, input reachable, no sideways scrolling`, async () => {
      const { context, page } = await open(browser, { viewport, items: realistic(), path: '/quiz-center' });
      await openChat(page);
      for (const chip of ['today', 'weak', 'exams']) await tid(page, `menti-chip-${chip}`).click();
      const box = await tid(page, 'menti-chat').boundingBox();
      assert(box.x >= 0 && box.y >= 0 && box.x + box.width <= viewport.width + 1 && box.y + box.height <= viewport.height + 1, `chat outside screen ${JSON.stringify(box)}`);
      assert(await tid(page, 'menti-chat-input').isVisible(), 'input hidden');
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 0, `+${o}px`);
      await context.close();
    });
  }

  await check('no JavaScript errors during any Stage 18 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
