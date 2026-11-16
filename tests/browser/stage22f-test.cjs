// Browser tests for Stage 22F: Mathematics, Physics, Chemistry and Biology grade decks (MEB key concepts) in Smart Flashcards.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage22f-test.cjs <baseUrl>
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

  await check('[tr] the grade box has a "Matematik ve fen" row with 4 subject buttons; a visit adds nothing', async () => {
    const { context, page } = await open(browser);
    const box = await tid(page, 'grade-decks').innerText();
    assert(box.includes('Matematik ve fen: anahtar kavramlar') && box.includes('o sınıfın MEB programındaki ünitelerden 25 anahtar kavram'), box);
    const labels = await page.locator('[data-testid^="button-add-grade-deck-"][data-testid$="-9"]:not([data-testid*="english"])').allInnerTexts();
    assert(labels.join(',') === '+ Matematik,+ Fizik,+ Kimya,+ Biyoloji', labels.join(','));
    const s = await saved(page);
    assert(!s || !s.decks.some((d) => /-grade-\d+$/.test(d.id)), 'nothing added on a visit');
    await context.close();
  });

  await check('[tr] grade 11 Biology: 25 cards under grade 11 in the same saved shape; the back gives the definition and the MEB unit', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-grade-decks-11').click();
    await tid(page, 'button-add-grade-deck-biology-11').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'biology-grade-11');
    assert(deck && deck.name === '11. sınıf Biyoloji – anahtar kavramlar' && deck.grade === '11' && deck.subject === 'Biology' && deck.starter === false && deck.topic === 'MEB · Anahtar kavramlar', JSON.stringify(deck));
    assert(Object.keys(deck).sort().join(',') === 'createdAt,grade,id,name,starter,subject,topic', 'deck shape');
    const cards = s.cards.filter((c) => c.deckId === deck.id);
    assert(cards.length === 25 && Object.keys(cards[0]).sort().join(',') === 'answer,deckId,explanation,front,id', 'cards');
    assert((await tid(page, 'flashcards-notice-success').innerText()).includes('25 kartla eklendi'), 'notice');
    await tid(page, 'button-flashcard-flip').click();
    await page.waitForTimeout(200);
    const back = await tid(page, 'flashcard-back').innerText();
    assert(back.includes('Bitkinin uyaranın yönüne bağlı olarak') && back.includes('MEB Biyoloji öğretim programı · 11. sınıf · 1. tema: Tepki (anahtar kavram).'), back);
    assert((await tid(page, 'button-add-grade-deck-biology-11').innerText()) === '✓ Biyoloji', 'marked');
    await page.reload();
    await page.waitForTimeout(300);
    await tid(page, 'button-grade-decks-11').click();
    assert(await tid(page, 'button-add-grade-deck-biology-11').isDisabled(), 'still added after refresh');
    assert(!(await tid(page, 'button-add-grade-deck-physics-11').isDisabled()), 'other subjects still open');
    await tid(page, 'button-grade-decks-12').click();
    assert(!(await tid(page, 'button-add-grade-deck-biology-12').isDisabled()), 'grade 12 Biology is a different deck');
    await context.close();
  });

  await check('[en] with grade 12 chosen in the filter, Physics 12 is added in English', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'grade-decks').innerText()).includes('Mathematics and science: key concepts'), 'title');
    await tid(page, 'select-filter-grade').selectOption('12');
    await page.waitForTimeout(100);
    assert((await tid(page, 'button-add-grade-deck-physics-12').innerText()) === '+ Physics', 'label');
    await tid(page, 'button-add-grade-deck-physics-12').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'physics-grade-12');
    assert(deck && deck.grade === '12' && deck.name === 'Physics 12 – key concepts' && deck.topic === 'MEB · Key concepts', JSON.stringify(deck));
    const card = s.cards.find((c) => c.deckId === deck.id && c.front === 'fotoelektrik etki');
    assert(card && card.explanation === 'MEB Physics curriculum · Grade 12 · Unit 4: Madde ve Doğası (key concept).', JSON.stringify(card));
    assert((await tid(page, 'flashcards-notice-success').innerText()).includes('was added with 25 cards'), 'notice');
    await context.close();
  });

  await check('[tr] phone: the subject buttons fit the screen (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    await tid(page, 'button-grade-decks-12').click();
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
  console.log(`\nstage22f-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
