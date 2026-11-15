// Browser tests for Stage 22D: YDT word decks in Smart Flashcards.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage22d-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const CARDS_KEY = 'ai-exam-survival:flashcards:v1';
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
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), CARDS_KEY);

async function open(browser, { lang = 'tr', viewport = { width: 800, height: 1280 } } = {}) {
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
  await page.goto(BASE + '/smart-flashcards');
  await page.waitForTimeout(300);
  return { context, page };
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] "YDT kelime desteleri" box with 10 buttons; a visit adds nothing', async () => {
    const { context, page } = await open(browser);
    assert((await tid(page, 'ydt-word-decks').innerText()).includes('YDT kelime desteleri'), 'title');
    assert((await tid(page, 'ydt-word-decks').innerText()).includes('2018–2026 YDT İngilizce kitapçıklarındaki'), 'source note');
    const labels = await page.locator('[data-testid^="button-add-ydt-deck-"]').allInnerTexts();
    assert(labels.length === 10 && labels[0] === '+ Sık çıkan fiiller 1' && labels[7] === '+ Bağlaçlar', labels.join(','));
    const s = await saved(page);
    assert(!s || !s.decks.some((d) => d.id.startsWith('ydt-words-')), 'nothing added on a visit');
    await context.close();
  });

  await check('[tr] tapping a deck adds 30 cards under grade 12 in the same saved shape; the back shows the booklet count', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-add-ydt-deck-verbs1').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'ydt-words-verbs1');
    assert(deck && deck.name === 'YDT – Sık çıkan fiiller 1' && deck.grade === '12' && deck.subject === 'English' && deck.starter === false, JSON.stringify(deck));
    assert(Object.keys(deck).sort().join(',') === 'createdAt,grade,id,name,starter,subject,topic', 'deck shape');
    const cards = s.cards.filter((c) => c.deckId === deck.id);
    assert(cards.length === 30 && Object.keys(cards[0]).sort().join(',') === 'answer,deckId,explanation,front,id', 'cards');
    assert((await tid(page, 'flashcards-notice-success').innerText()).includes('30 kelimeyle eklendi'), 'notice');
    assert((await page.locator('body').innerText()).includes('affect — “Lack of sleep can affect your ability to concentrate in class.”'), 'first card');
    await tid(page, 'button-flashcard-flip').click();
    await page.waitForTimeout(200);
    const back = await tid(page, 'flashcard-back').innerText();
    assert(back.includes('etkilemek') && back.includes('9 YDT kitapçığının 9’unda geçti') && back.includes('Eş anlamlı: influence'), back);
    assert(await tid(page, 'button-add-ydt-deck-verbs1').isDisabled(), 'disabled');
    assert((await tid(page, 'button-add-ydt-deck-verbs1').innerText()) === '✓ Sık çıkan fiiller 1', 'marked');
    await page.reload();
    await page.waitForTimeout(300);
    assert((await tid(page, 'button-add-ydt-deck-verbs1').innerText()) === '✓ Sık çıkan fiiller 1', 'still added after refresh');
    await context.close();
  });

  await check('[en] English names and notes; with grade 11 chosen in the filter the deck goes under grade 11', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'ydt-word-decks').innerText()).includes('YDT word decks'), 'title');
    await tid(page, 'select-filter-grade').selectOption('11');
    await tid(page, 'button-add-ydt-deck-connectors').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'ydt-words-connectors');
    assert(deck && deck.grade === '11' && deck.name === 'YDT – Connectors' && deck.topic === 'YDT · Connectors', JSON.stringify(deck));
    const card = s.cards.find((c) => c.id === 'ydt-words-connectors-10');
    assert(card.front.startsWith('unless') && card.explanation.includes('An option in vocabulary / grammar questions: 2018, 2019, 2020, 2024, 2025, 2026'), card.explanation);
    await context.close();
  });

  await check('[tr] phone: the YDT deck buttons fit the screen (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    await context.close();
    assert(!wide, 'scrolls sideways');
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22d-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
