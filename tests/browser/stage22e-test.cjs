// Browser tests for Stage 22E: English grade decks (MEB themes) in Smart Flashcards.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage22e-test.cjs <baseUrl>
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

  await check('[tr] "Sınıfıma göre desteler" box: 4 grade buttons, grade 9 shows its 8 themes; a visit adds nothing', async () => {
    const { context, page } = await open(browser);
    const box = await tid(page, 'grade-decks').innerText();
    assert(box.includes('Sınıfıma göre desteler') && box.includes('MEB İngilizce programının her teması'), box);
    const grades = await page.locator('[data-testid^="button-grade-decks-"]').allInnerTexts();
    assert(grades.join(',') === '9. sınıf,10. sınıf,11. sınıf,12. sınıf', grades.join(','));
    assert((await tid(page, 'button-grade-decks-9').getAttribute('aria-pressed')) === 'true', 'grade 9 first');
    const labels = await page.locator('[data-testid^="button-add-grade-deck-english-"]').allInnerTexts();
    assert(labels.length === 8 && labels[0] === '+ Tema 1 · Okul Hayatı' && labels[7] === '+ Tema 8 · Evren ve Gelecek', labels.join(','));
    const s = await saved(page);
    assert(!s || !s.decks.some((d) => d.id.startsWith('english-grade-')), 'nothing added on a visit');
    await context.close();
  });

  await check('[tr] grade 12 shows 6 themes; tapping one adds 25 cards under grade 12 in the same saved shape; the back names the MEB theme', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-grade-decks-12').click();
    const labels = await page.locator('[data-testid^="button-add-grade-deck-english-"]').allInnerTexts();
    assert(labels.length === 6 && labels[5] === '+ Tema 6 · Evren ve Gelecek', labels.join(','));
    await tid(page, 'button-add-grade-deck-english-12-6').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'english-grade-12-t6');
    assert(deck && deck.name === '12. sınıf İngilizce – Evren ve Gelecek' && deck.grade === '12' && deck.subject === 'English' && deck.starter === false && deck.topic === 'MEB · Evren ve Gelecek', JSON.stringify(deck));
    assert(Object.keys(deck).sort().join(',') === 'createdAt,grade,id,name,starter,subject,topic', 'deck shape');
    const cards = s.cards.filter((c) => c.deckId === deck.id);
    assert(cards.length === 25 && Object.keys(cards[0]).sort().join(',') === 'answer,deckId,explanation,front,id', 'cards');
    assert((await tid(page, 'flashcards-notice-success').innerText()).includes('25 kelimeyle eklendi'), 'notice');
    assert((await page.locator('body').innerText()).includes('space habitat — “Engineers are designing a space habitat for astronauts on the Moon.”'), 'first card');
    await tid(page, 'button-flashcard-flip').click();
    await page.waitForTimeout(200);
    const back = await tid(page, 'flashcard-back').innerText();
    assert(back.includes('uzay yaşam alanı') && back.includes('MEB İngilizce öğretim programı · 12. sınıf · Tema 6: Life in the Universe & Future (hedef kelime).'), back);
    assert(await tid(page, 'button-add-grade-deck-english-12-6').isDisabled(), 'disabled');
    assert((await tid(page, 'button-add-grade-deck-english-12-6').innerText()) === '✓ Tema 6 · Evren ve Gelecek', 'marked');
    await page.reload();
    await page.waitForTimeout(300);
    await tid(page, 'button-grade-decks-12').click();
    assert((await tid(page, 'button-add-grade-deck-english-12-6').innerText()) === '✓ Tema 6 · Evren ve Gelecek', 'still added after refresh');
    assert(!(await tid(page, 'button-add-grade-deck-english-12-5').isDisabled()), 'other themes still open');
    await context.close();
  });

  await check('[en] choosing grade 10 in the filter shows grade 10 themes in English; the deck goes under grade 10', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'grade-decks').innerText()).includes('Decks for my grade'), 'title');
    await tid(page, 'select-filter-grade').selectOption('10');
    await page.waitForTimeout(100);
    assert((await tid(page, 'button-grade-decks-10').getAttribute('aria-pressed')) === 'true', 'follows the filter');
    assert((await tid(page, 'button-add-grade-deck-english-10-7').innerText()) === '+ Theme 7 · Life in Nature & Global Problems', 'label');
    await tid(page, 'button-add-grade-deck-english-10-7').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'english-grade-10-t7');
    assert(deck && deck.grade === '10' && deck.name === 'English 10 – Life in Nature & Global Problems' && deck.topic === 'MEB · Life in Nature & Global Problems', JSON.stringify(deck));
    const card = s.cards.find((c) => c.id === 'english-grade-10-t7-08');
    assert(card.front.startsWith('deforestation') && card.answer === 'ormansızlaşma' && card.explanation.includes('Grade 10 · Theme 7'), JSON.stringify(card));
    await context.close();
  });

  await check('[tr] phone: the grade deck buttons fit the screen (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    await tid(page, 'button-grade-decks-10').click();
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
  console.log(`\nstage22e-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
