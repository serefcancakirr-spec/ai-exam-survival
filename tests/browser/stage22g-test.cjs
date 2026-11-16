// Browser tests for Stage 22G: History, Geography, Literature, Philosophy and Religion grade decks (MEB key concepts) in Smart Flashcards.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage22g-test.cjs <baseUrl>
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
  const row = (page, grade) =>
    page.locator(`[data-testid^="button-add-grade-deck-"][data-testid$="-${grade}"]`).evaluateAll((els) =>
      els.map((e) => e.getAttribute('data-testid')).filter((id) => /-(history|geography|literature|philosophy|religion)-/.test(id)));

  await check('[tr] a "Sosyal bilimler ve edebiyat" row; Felsefe only in grades 10 and 11; a visit adds nothing', async () => {
    const { context, page } = await open(browser);
    const box = await tid(page, 'grade-decks').innerText();
    assert(box.includes('Sosyal bilimler ve edebiyat: anahtar kavramlar') && box.includes('12. sınıf Tarih destesi İnkılap Tarihi programından'), box);
    const labels9 = await page.locator('[data-testid="button-add-grade-deck-history-9"], [data-testid="button-add-grade-deck-geography-9"], [data-testid="button-add-grade-deck-literature-9"], [data-testid="button-add-grade-deck-religion-9"]').allInnerTexts();
    assert(labels9.join(',') === '+ Tarih,+ Coğrafya,+ Edebiyat,+ Din Kültürü', labels9.join(','));
    assert((await row(page, 9)).length === 4, 'grade 9: 4 subjects');
    await tid(page, 'button-grade-decks-10').click();
    assert((await row(page, 10)).join(',') === 'button-add-grade-deck-history-10,button-add-grade-deck-geography-10,button-add-grade-deck-literature-10,button-add-grade-deck-philosophy-10,button-add-grade-deck-religion-10', 'grade 10: 5 subjects');
    await tid(page, 'button-grade-decks-12').click();
    assert((await row(page, 12)).length === 4, 'grade 12: no Felsefe');
    const s = await saved(page);
    assert(!s || !s.decks.some((d) => /-grade-\d+$/.test(d.id)), 'nothing added on a visit');
    await context.close();
  });

  await check('[tr] grade 12 History (İnkılap Tarihi): 25 cards under grade 12 in the same saved shape; the back names the program', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-grade-decks-12').click();
    await tid(page, 'button-add-grade-deck-history-12').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'history-grade-12');
    assert(deck && deck.name === '12. sınıf Tarih – anahtar kavramlar' && deck.grade === '12' && deck.subject === 'History' && deck.starter === false, JSON.stringify(deck));
    assert(Object.keys(deck).sort().join(',') === 'createdAt,grade,id,name,starter,subject,topic', 'deck shape');
    const cards = s.cards.filter((c) => c.deckId === deck.id);
    assert(cards.length === 25 && Object.keys(cards[0]).sort().join(',') === 'answer,deckId,explanation,front,id', 'cards');
    assert((await tid(page, 'flashcards-notice-success').innerText()).includes('25 kartla eklendi'), 'notice');
    await tid(page, 'button-flashcard-flip').click();
    await page.waitForTimeout(200);
    const back = await tid(page, 'flashcard-back').innerText();
    assert(back.includes('İtilaf Devletleri') && back.includes('MEB T.C. İnkılap Tarihi ve Atatürkçülük öğretim programı · 12. sınıf · 1. ünite: Modern Türk Devletinin Doğuşu (anahtar kavram).'), back);
    assert((await tid(page, 'button-add-grade-deck-history-12').innerText()) === '✓ Tarih', 'marked');
    await page.reload();
    await page.waitForTimeout(300);
    await tid(page, 'button-grade-decks-12').click();
    assert(await tid(page, 'button-add-grade-deck-history-12').isDisabled(), 'still added after refresh');
    assert(!(await tid(page, 'button-add-grade-deck-religion-12').isDisabled()), 'other subjects still open');
    await context.close();
  });

  await check('[en] with grade 10 chosen in the filter, Philosophy 10 is added in English', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'grade-decks').innerText()).includes('Social sciences and literature: key concepts'), 'title');
    await tid(page, 'select-filter-grade').selectOption('10');
    await page.waitForTimeout(100);
    assert((await tid(page, 'button-add-grade-deck-philosophy-10').innerText()) === '+ Philosophy', 'label');
    await tid(page, 'button-add-grade-deck-philosophy-10').click();
    await page.waitForTimeout(300);
    const s = await saved(page);
    const deck = s.decks.find((d) => d.id === 'philosophy-grade-10');
    assert(deck && deck.grade === '10' && deck.name === 'Philosophy 10 – key concepts' && deck.topic === 'MEB · Key concepts' && deck.subject === 'Philosophy', JSON.stringify(deck));
    const card = s.cards.find((c) => c.deckId === deck.id && c.front === 'töz');
    assert(card && card.explanation === 'MEB Philosophy curriculum · Grade 10 · Unit 3: Varlık Felsefesi (key concept).', JSON.stringify(card));
    await context.close();
  });

  await check('[tr] phone: the subject buttons fit the screen (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    await tid(page, 'button-grade-decks-11').click();
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
  console.log(`\nstage22g-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
