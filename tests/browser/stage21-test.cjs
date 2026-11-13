// Browser tests for Stage 21A: English A1–C1 levels in Quiz Center and the level word decks in Smart Flashcards.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage21-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const QUIZ_KEY = 'ai-exam-survival:quiz-center:v1';
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

async function open(browser, { lang = 'tr', path = '/quiz-center', viewport = { width: 800, height: 1280 } } = {}) {
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
  await page.goto(BASE + path);
  await page.waitForTimeout(300);
  return { context, page };
}
const pressed = (page) => page.locator('[data-testid^="button-quiz-level-"][aria-pressed="true"]').innerText();
const topicOptions = (page) => tid(page, 'select-quiz-topic').locator('option').allInnerTexts();

async function finishQuiz(page) {
  for (let i = 0; i < 25; i += 1) {
    if (await tid(page, 'button-retry-quiz').count()) return;
    await page.locator('[data-testid^="button-quiz-answer-"]').first().click();
    const next = page.locator('[data-testid="button-quiz-next"]:not([disabled]), [data-testid="button-submit-quiz"]:not([disabled])').first();
    if (await next.count()) await next.click();
    await page.waitForTimeout(80);
  }
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] English shows the level picker (A1–C1 + Genel); grade 9 starts at A2, grade 10 B1, grade 11 B1, grade 12 B2', async () => {
    const { context, page } = await open(browser);
    assert(await tid(page, 'quiz-level-picker').isVisible(), 'level picker visible');
    const labels = await page.locator('[data-testid^="button-quiz-level-"]').allInnerTexts();
    assert(JSON.stringify(labels) === JSON.stringify(['A1', 'A2', 'B1', 'B2', 'C1', 'Genel (ileri)']), labels.join(','));
    assert((await pressed(page)) === 'A2', 'grade 9 → A2');
    for (const [grade, level] of [['10', 'B1'], ['11', 'B1'], ['12', 'B2']]) {
      await tid(page, 'select-quiz-grade').selectOption(grade);
      assert((await pressed(page)) === level, `grade ${grade} → ${level}, got ${await pressed(page)}`);
      assert((await tid(page, 'quiz-level-note').innerText()).includes(`${grade}. sınıf için önerilen seviye: ${level}`), 'suggestion text');
      assert(!(await tid(page, 'quiz-level-note').innerText()).includes('kontrolü sürüyor'), 'English was reviewed by the teacher: no "still reviewing" note');
    }
    await context.close();
  });

  await check('[tr] a level shows only its four topics and 71 questions; "Genel (ileri)" shows the four older topics', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-quiz-level-c1').click();
    assert(JSON.stringify(await topicOptions(page)) === JSON.stringify(['Tüm konular', 'C1 · Dilbilgisi', 'C1 · Kelime', 'C1 · Okuma', 'C1 · Dinleme']), (await topicOptions(page)).join(','));
    assert((await page.locator('body').innerText()).includes('71 farklı örnek soru'), 'pool size 71 (with reading and listening)');
    await tid(page, 'select-quiz-topic').selectOption('C1 · Grammar');
    assert((await page.locator('body').innerText()).includes('25 farklı örnek soru'), 'pool size 25');
    await tid(page, 'button-quiz-level-general').click();
    assert((await tid(page, 'select-quiz-topic').inputValue()) === '__all_topics__', 'topic reset to all');
    assert((await topicOptions(page)).length === 5, `general topics: ${(await topicOptions(page)).join(',')}`);
    await context.close();
  });

  await check('[tr] other subjects have no level picker; going back to English brings it back with the suggested level', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'select-quiz-grade').selectOption('11');
    await tid(page, 'select-quiz-subject').selectOption('Biology');
    assert((await tid(page, 'quiz-level-picker').count()) === 0, 'no picker for Biology');
    await tid(page, 'select-quiz-subject').selectOption('English');
    assert((await pressed(page)) === 'B1', 'grade 11 → B1');
    await context.close();
  });

  await check('[tr] a B2 quiz shows English questions with "Seviye B2 · focus" and Turkish explanations in the review', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-quiz-level-b2').click();
    await tid(page, 'button-start-quiz').click();
    await page.waitForTimeout(200);
    const focus = await tid(page, 'quiz-english-focus').innerText();
    assert(/^Seviye B2 · \S/.test(focus), focus);
    assert((await tid(page, 'quiz-meb-outcome').count()) === 0, 'no MEB outcome line');
    await finishQuiz(page);
    const body = await page.locator('body').innerText();
    assert(/Seviye B2 · /.test(body), 'focus line in the review');
    const explanations = body.split('\n').filter((line) => line.startsWith('Açıklama: '));
    assert(explanations.length === 5 && explanations.every((line) => /[çğıöşüÇĞİÖŞÜ]|\b(olur|bir|ve|ile)\b/.test(line)), `Turkish explanations: ${explanations.length}`);
    await context.close();
  });

  await check('a finished whole-level quiz is saved in the same shape with the level as its topic; one topic is saved as that topic', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'select-quiz-grade').selectOption('10');
    await tid(page, 'button-start-quiz').click();
    await finishQuiz(page);
    let saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), QUIZ_KEY));
    assert(saved.length === 1, 'one attempt');
    const keys = Object.keys(saved[0]).sort().join(',');
    assert(keys === 'completedAt,difficulty,grade,id,percentage,questionCount,review,score,subject,topic', keys);
    assert(saved[0].topic === 'B1' && saved[0].grade === '10' && saved[0].subject === 'English', JSON.stringify({ t: saved[0].topic }));
    assert(Object.keys(saved[0].review[0].question).sort().join(',') === 'correctOptionId,difficulty,explanation,grade,id,options,prompt,subject,topic', 'question shape');
    assert(saved[0].review.every((r) => r.question.topic.startsWith('B1 · ')), 'B1 questions');
    await tid(page, 'button-new-quiz').click();
    await tid(page, 'button-quiz-level-a1').click();
    await tid(page, 'select-quiz-topic').selectOption('A1 · Vocabulary');
    await tid(page, 'button-start-quiz').click();
    await finishQuiz(page);
    saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), QUIZ_KEY));
    assert(saved.length === 2 && saved[0].topic === 'A1 · Vocabulary', `newest topic ${saved[0].topic}`);
    await context.close();
  });

  await check('[en] English mode: "Level (CEFR)" and "General (advanced)"; explanations stay Turkish', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'quiz-level-picker').innerText()).includes('Level (CEFR)'), 'label');
    assert((await tid(page, 'button-quiz-level-general').innerText()) === 'General (advanced)', 'general label');
    assert((await topicOptions(page)).includes('A2 · Grammar'), 'English topic names');
    await tid(page, 'button-start-quiz').click();
    assert((await tid(page, 'quiz-english-focus').innerText()).startsWith('Level A2 · '), 'focus line');
    await context.close();
  });

  await check('[tr] Smart Flashcards: the five level buttons add nothing by themselves; tapping A2 adds a 30-word deck and starts Learn', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    let saved = JSON.parse((await page.evaluate((k) => localStorage.getItem(k), CARDS_KEY)) || 'null');
    assert(!saved || !saved.decks.some((d) => d.id.startsWith('english-level-')), 'nothing added on a visit');
    const labels = await page.locator('[data-testid^="button-add-level-deck-"]').allInnerTexts();
    assert(JSON.stringify(labels) === JSON.stringify(['+ A1', '+ A2', '+ B1', '+ B2', '+ C1']), labels.join(','));
    await tid(page, 'button-add-level-deck-a2').click();
    await page.waitForTimeout(300);
    saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), CARDS_KEY));
    const deck = saved.decks.find((d) => d.id === 'english-level-a2');
    assert(deck && deck.name === 'İngilizce A2 kelimeler' && deck.grade === '9' && deck.subject === 'English' && deck.starter === false, JSON.stringify(deck));
    assert(Object.keys(deck).sort().join(',') === 'createdAt,grade,id,name,starter,subject,topic', 'deck shape');
    assert(saved.cards.filter((c) => c.deckId === 'english-level-a2').length === 30, '30 cards');
    assert(saved.selectedDeckId === 'english-level-a2', 'deck selected');
    assert((await tid(page, 'flashcards-notice-success').innerText()).includes('30 kelimeyle eklendi'), 'notice');
    assert((await page.locator('body').innerText()).includes('borrow — “Can I borrow your pen for a minute?”'), 'first card shown');
    assert(await tid(page, 'button-add-level-deck-a2').isDisabled(), 'A2 button disabled');
    assert((await tid(page, 'button-add-level-deck-a2').innerText()) === '✓ A2', 'A2 marked added');
    await page.reload();
    await page.waitForTimeout(300);
    assert((await tid(page, 'button-add-level-deck-a2').innerText()) === '✓ A2', 'still added after refresh');
    await context.close();
  });

  await check('[en] with grade 12 chosen in the filter, the C1 deck goes under grade 12 with an English name', async () => {
    const { context, page } = await open(browser, { lang: 'en', path: '/smart-flashcards' });
    await tid(page, 'select-filter-grade').selectOption('12');
    await tid(page, 'button-add-level-deck-c1').click();
    await page.waitForTimeout(300);
    const saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), CARDS_KEY));
    const deck = saved.decks.find((d) => d.id === 'english-level-c1');
    assert(deck && deck.grade === '12' && deck.name === 'English C1 words' && deck.topic === 'C1 · Vocabulary', JSON.stringify(deck));
    await context.close();
  });

  await check('[tr] phone: level buttons and deck buttons fit the screen (no sideways scrolling)', async () => {
    for (const path of ['/quiz-center', '/smart-flashcards']) {
      const { context, page } = await open(browser, { path, viewport: { width: 390, height: 844 } });
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      await context.close();
      assert(!wide, `${path} scrolls sideways`);
    }
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage21-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
