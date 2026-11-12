// Browser tests for Stage 14: no duplicate deck names; Menti's study advice on Smart Flashcards.
// Usage: node stage14-test.cjs <baseUrl>
const { chromium } = require('playwright');
const { EN, TR, TR_PHRASES } = require('../out/dict.cjs');

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
    results.push({ name, ok: false, detail: String(e.message || e).split('\n')[0] });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const VIEWPORTS = { phone: { width: 390, height: 844 }, 'tablet portrait': { width: 800, height: 1280 }, 'tablet landscape': { width: 1280, height: 800 } };
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));
const trOf = (en, vars = {}) => fill(TR_PHRASES[en], vars);

async function open(browser, { viewport = VIEWPORTS['tablet portrait'], lang = 'tr', items = [] } = {}) {
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
  await page.goto(BASE + '/smart-flashcards');
  await page.waitForTimeout(200);
  return { context, page };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), CARDS_KEY);
async function newDeck(page, name, subject = 'Biology', grade = '10') {
  await tid(page, 'button-new-deck').click();
  await tid(page, 'input-deck-name').fill(name);
  await tid(page, 'select-deck-grade').selectOption(grade);
  await tid(page, 'select-deck-subject').selectOption(subject);
  await tid(page, 'button-save-deck').click();
  await page.waitForTimeout(100);
}
const formText = (page) => tid(page, 'form-deck').innerText().catch(() => '');

(async () => {
  const browser = await chromium.launch();

  await check('a new deck with an existing name is blocked (any letter case, spaces, other grade/subject); a different name works', async () => {
    const { context, page } = await open(browser);
    const before = (await saved(page)).decks.length;
    await newDeck(page, 'Kelimelerim');
    assert((await saved(page)).decks.length === before + 1, 'first deck not created');
    for (const [name, subject] of [['  kelimelerim ', 'Biology'], ['KELİMELERİM', 'Mathematics'], ['Kelimelerim', 'History']]) {
      await newDeck(page, name, subject, '12');
      const text = await formText(page);
      assert(text.includes(trOf('A deck called “{name}” already exists. Choose a different name, for example add the grade.', { name: name.trim() })), `no warning for "${name}"`);
      await tid(page, 'button-cancel-deck').click();
    }
    assert((await saved(page)).decks.length === before + 1, 'duplicate was saved');
    await newDeck(page, 'Kelimelerim (10. sınıf)');
    assert((await saved(page)).decks.length === before + 2, 'different name not saved');
    await context.close();
  });

  await check('starter deck names are taken in both languages (Turkish and English name)', async () => {
    const { context, page } = await open(browser);
    const before = (await saved(page)).decks.length;
    for (const name of ['Hücrenin Yapısı', 'cell structure']) {
      await newDeck(page, name);
      assert((await formText(page)).includes('adında bir deste zaten var'), `no warning for ${name}`);
      await tid(page, 'button-cancel-deck').click();
    }
    assert((await saved(page)).decks.length === before, 'duplicate saved');
    await context.close();
  });

  await check('renaming a deck to another deck’s name is blocked; saving with its own (unchanged) name works', async () => {
    const { context, page } = await open(browser);
    await newDeck(page, 'Benim destem');
    await tid(page, 'button-edit-deck').click();
    await tid(page, 'input-deck-name').fill('Genetik ve DNA');
    await tid(page, 'button-save-deck').click();
    assert((await formText(page)).includes('adında bir deste zaten var'), 'rename to starter name allowed');
    await tid(page, 'input-deck-name').fill('benim DESTEM');
    await tid(page, 'button-save-deck').click();
    await page.waitForTimeout(100);
    assert((await saved(page)).decks.some((d) => d.name === 'benim DESTEM'), 'own name (other case) not saved');
    // an unchanged starter deck keeps its (English) saved name when edited without changes
    await tid(page, 'deck-starter-biology-10-genetics').click();
    await tid(page, 'button-edit-deck').click();
    await tid(page, 'button-save-deck').click();
    await page.waitForTimeout(100);
    assert((await saved(page)).decks.find((d) => d.id === 'starter-biology-10-genetics').name === 'Genetics & DNA', 'starter name changed');
    await context.close();
  });

  await check('decks saved earlier with the same name are kept as they are and can still be edited', async () => {
    const { context: c1, page: p1 } = await open(browser);
    const data = await saved(p1);
    await c1.close();
    const twin = (id) => ({ id, name: 'Aynı Ad', grade: '9', subject: 'Biology', topic: '', starter: false, createdAt: '2026-10-01T00:00:00.000Z' });
    const raw = JSON.stringify({ ...data, decks: [...data.decks, twin('deck-a'), twin('deck-b')], selectedDeckId: 'deck-a' });
    const { context, page } = await open(browser, { items: [[CARDS_KEY, raw]] });
    assert((await saved(page)).decks.filter((d) => d.name === 'Aynı Ad').length === 2, 'old duplicates removed');
    await tid(page, 'button-edit-deck').click();
    await tid(page, 'input-deck-topic').fill('Hücre').catch(() => {});
    await tid(page, 'button-save-deck').click();
    await page.waitForTimeout(100);
    assert(!(await formText(page)).includes('zaten var'), 'editing an old duplicate with its own name was blocked');
    await context.close();
  });

  await check('[tr] Menti suggests Learn for a new deck; switching mode works', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'tab-mode-practice').click();
    assert((await tid(page, 'study-guide').getAttribute('data-advice')) === 'new', 'advice');
    assert((await tid(page, 'menti-guide-bubble').innerText()).includes(TR_PHRASES['This deck is new. Start with Learn mode to get to know the cards.']), 'text');
    await tid(page, 'button-guide-switch').click();
    assert((await tid(page, 'tab-mode-learn').getAttribute('aria-selected')) === 'true', 'not switched to Learn');
    assert((await tid(page, 'button-guide-switch').count()) === 0, 'switch button still shown in the suggested mode');
    await context.close();
  });

  await check('[tr] a hard round gets reassurance, then Menti suggests Review for the cards that need work', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'tab-mode-practice').click();
    for (let i = 0; i < 3; i += 1) {
      await tid(page, 'button-flashcard-flip').click();
      await tid(page, 'button-mark-again').click();
    }
    assert((await tid(page, 'study-guide').getAttribute('data-advice')) === 'hard-round', 'no reassurance');
    assert((await tid(page, 'menti-guide-bubble').innerText()).includes(trOf('You marked {count} cards to review in this round. That is normal. When the round ends, try Review mode.', { count: 3 })), 'text');
    await tid(page, 'tab-mode-learn').click();
    assert((await tid(page, 'study-guide').getAttribute('data-advice')) === 'struggling', 'not struggling');
    assert((await tid(page, 'menti-guide-bubble').innerText()).includes(trOf('{count} cards are giving you trouble. Let’s go over them in Review mode.', { count: 3 })), 'count text');
    await tid(page, 'button-guide-switch').click();
    assert((await tid(page, 'tab-mode-review').getAttribute('aria-selected')) === 'true', 'not Review');
    await context.close();
  });

  await check('[tr] all cards known → Menti cheers and suggests Practice; the guide hides when the round summary shows', async () => {
    const { context, page } = await open(browser);
    const data = await saved(page);
    const deckId = data.selectedDeckId;
    const progress = Object.fromEntries(data.cards.filter((c) => c.deckId === deckId).map((c) => [c.id, { box: 3, knownCount: 2, againCount: 0, lastResult: 'know', lastReviewedAt: '2026-11-04T10:00:00.000Z' }]));
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [CARDS_KEY, JSON.stringify({ ...data, progress })]);
    await page.reload();
    await page.waitForTimeout(200);
    assert((await tid(page, 'study-guide').getAttribute('data-advice')) === 'mastered', 'not mastered');
    assert((await tid(page, 'menti-guide').getAttribute('data-pose')) === 'cheer', 'not cheering');
    await tid(page, 'tab-mode-practice').click();
    for (let i = 0; i < 40 && !(await tid(page, 'session-summary').count()); i += 1) {
      await tid(page, 'button-flashcard-flip').click();
      await tid(page, 'button-mark-know').click();
    }
    assert((await tid(page, 'study-guide').count()) === 0, 'guide shown together with the round summary');
    await context.close();
  });

  await check('[en] advice and the duplicate warning are in English', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'menti-guide-bubble').innerText()).includes('This deck is new.'), 'advice not English');
    await newDeck(page, 'Cell Structure');
    assert((await formText(page)).includes('A deck called “Cell Structure” already exists.'), 'warning not English');
    await context.close();
  });

  await check('advice writes nothing to saved data', async () => {
    const { context, page } = await open(browser);
    const before = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
    await tid(page, 'tab-mode-practice').click();
    await tid(page, 'button-guide-switch').click();
    await tid(page, 'tab-mode-review').click();
    const after = await page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
    assert(before === after, 'storage changed');
    await context.close();
  });

  for (const [vname, viewport] of Object.entries(VIEWPORTS)) {
    await check(`[tr, ${vname}] the guide and the warning fit the screen`, async () => {
      const { context, page } = await open(browser, { viewport });
      await tid(page, 'tab-mode-practice').click();
      let o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 0, `guide +${o}px`);
      await newDeck(page, 'Hücrenin Yapısı');
      o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 0, `warning +${o}px`);
      await context.close();
    });
  }

  await check('no JavaScript errors during any Stage 14 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
