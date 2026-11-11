// Browser tests for Stage 11: quiz questions, topics and starter flashcards in Turkish (display only).
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage11-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const { QUESTIONS_TR, TOPICS_TR, STARTER_CARDS_TR, STARTER_DECK_NAMES_TR, QUESTION_SEEDS } = require('../out/dict.cjs');

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
    results.push({ name, ok: false, detail: String(e.message || e).split('\n')[0] });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const VIEWPORTS = { phone: { width: 390, height: 844 }, 'tablet portrait': { width: 800, height: 1280 }, 'tablet landscape': { width: 1280, height: 800 } };
const TR_PROMPTS = new Set(Object.values(QUESTIONS_TR).flat().map((q) => q[0]));
const EN_PROMPTS = new Set(Object.values(QUESTION_SEEDS).flat().map((q) => q.prompt));
const trOf = (subject, englishPrompt) => QUESTIONS_TR[subject][QUESTION_SEEDS[subject].findIndex((s) => s.prompt === englishPrompt)];

async function open(browser, { viewport = VIEWPORTS['tablet portrait'], lang = 'tr', items = [], path = '/' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  const seed = lang ? [[LANG_KEY, lang], ...items] : items;
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
  }, seed);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  page.on('dialog', (d) => d.dismiss());
  await page.goto(BASE + path);
  await page.waitForTimeout(150);
  return { context, page };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const read = (page, key) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const promptText = (page) => page.locator('[data-content="quiz"]').first().innerText();

async function startQuiz(page, subject) {
  await page.selectOption('#quiz-subject', subject);
  await tid(page, 'button-start-quiz').click();
  await page.waitForTimeout(100);
}
async function answerAll(page, pick) {
  const count = 5;
  for (let i = 0; i < count; i += 1) {
    await pick(i);
    if (i < count - 1) await tid(page, 'button-quiz-next').click();
  }
  await tid(page, 'button-submit-quiz').click();
  await page.waitForTimeout(150);
}

(async () => {
  const browser = await chromium.launch();

  for (const subject of ['Mathematics', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Literature']) {
    await check(`[tr] Quiz Center ${subject}: questions and options are in Turkish; switching to EN shows English`, async () => {
      const { context, page } = await open(browser, { path: '/quiz-center' });
      await startQuiz(page, subject);
      const tr = await promptText(page);
      assert(TR_PROMPTS.has(tr.trim()), `not a Turkish question: ${tr}`);
      const options = await page.locator('[data-testid^="button-quiz-answer-"] [data-content="quiz"]').allInnerTexts();
      const entry = Object.values(QUESTIONS_TR).flat().find((q) => q[0] === tr.trim());
      assert(options.every((o) => entry[1].includes(o.trim())), `options not Turkish: ${options.join(' / ')}`);
      await tid(page, 'button-lang-en').click();
      const en = await promptText(page);
      assert(EN_PROMPTS.has(en.trim()), `not English after EN: ${en}`);
      await tid(page, 'button-lang-tr').click();
      assert((await promptText(page)).trim() === tr.trim(), 'not Turkish again after TR');
      await context.close();
    });
  }

  await check('[tr] English subject: questions stay in English', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await startQuiz(page, 'English');
    assert(EN_PROMPTS.has((await promptText(page)).trim()), 'English question changed');
    await context.close();
  });

  await check('[tr] topic list is Turkish, but the chosen topic is saved in English', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await page.selectOption('#quiz-subject', 'Mathematics');
    const labels = await tid(page, 'select-quiz-topic').locator('option').allInnerTexts();
    const values = await tid(page, 'select-quiz-topic').locator('option').evaluateAll((o) => o.map((x) => x.value));
    assert(labels.includes('Cebir') && labels.includes('İstatistik ve Olasılık'), `labels: ${labels.join(', ')}`);
    assert(values.includes('Algebra') && values.includes('Statistics & Probability'), `values: ${values.join(', ')}`);
    await page.selectOption('#quiz-topic', 'Algebra');
    await tid(page, 'button-start-quiz').click();
    await answerAll(page, () => page.locator('[data-testid^="button-quiz-answer-"]').first().click());
    const saved = (await read(page, QUIZ_KEY))[0];
    assert(saved.topic === 'Algebra', `saved topic ${saved.topic}`);
    await context.close();
  });

  await check('[tr] results: review is in Turkish with the right correct answer; saved results stay English', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await startQuiz(page, 'Chemistry');
    await answerAll(page, () => page.locator('[data-testid^="button-quiz-answer-"]').first().click());
    const saved = (await read(page, QUIZ_KEY))[0];
    for (const item of saved.review) assert(EN_PROMPTS.has(item.question.prompt), `saved prompt is not English: ${item.question.prompt}`);
    const reviews = page.locator('[data-testid="quiz-review-question"]');
    assert((await reviews.count()) === saved.review.length, 'review count');
    for (let i = 0; i < saved.review.length; i += 1) {
      const q = saved.review[i].question;
      const tr = trOf('Chemistry', q.prompt);
      const text = await reviews.nth(i).innerText();
      assert(text.includes(tr[0]) && text.includes(tr[2]), `review ${i + 1} not Turkish`);
      const seed = QUESTION_SEEDS.Chemistry.find((s) => s.prompt === q.prompt);
      const english = q.options.find((o) => o.id === q.correctOptionId).text;
      const turkish = tr[1][seed.options.indexOf(english)];
      assert(text.includes(`${q.correctOptionId}. ${turkish}`), `review ${i + 1}: correct answer "${q.correctOptionId}. ${turkish}" missing`);
      assert(text.includes(TOPICS_TR[q.topic].toLocaleUpperCase('tr')) || text.includes(TOPICS_TR[q.topic]), `review ${i + 1}: topic not Turkish`);
    }
    await context.close();
  });

  await check('[tr] answering with the Turkish options gives the same score as the English answers', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await startQuiz(page, 'Physics');
    await answerAll(page, () => page.locator('[data-testid^="button-quiz-answer-"]').nth(1).click());
    const first = (await read(page, QUIZ_KEY))[0];
    await tid(page, 'button-retry-quiz').click();
    // pick the right answers by their Turkish text
    for (let i = 0; i < first.review.length; i += 1) {
      const q = first.review[i].question;
      const tr = trOf('Physics', q.prompt);
      const seed = QUESTION_SEEDS.Physics.find((s) => s.prompt === q.prompt);
      const right = tr[1]['ABCD'.indexOf(seed.correctOptionId)];
      const exact = new RegExp(`^${right.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      await page.locator('[data-testid^="button-quiz-answer-"]').filter({ has: page.locator('[data-content="quiz"]', { hasText: exact }) }).click();
      if (i < first.review.length - 1) await tid(page, 'button-quiz-next').click();
    }
    await tid(page, 'button-submit-quiz').click();
    await page.waitForTimeout(150);
    const second = (await read(page, QUIZ_KEY))[0];
    assert(second.percentage === 100, `score ${second.percentage}%`);
    await context.close();
  });

  await check('[tr] old saved results (questions the bank no longer has) are shown exactly as saved', async () => {
    const items = [[F.KEYS.quiz, JSON.stringify(F.quizHistory())]];
    const { context, page } = await open(browser, { items, path: '/quiz-center' });
    await page.locator('[data-testid^="button-review-attempt-"]').first().click();
    const text = await page.locator('[data-testid="quiz-review-question"]').first().innerText();
    assert(/Question \d+/.test(text), `saved question changed: ${text.slice(0, 60)}`);
    await context.close();
  });

  await check('[tr] Smart Flashcards: starter deck names, topics and cards are Turkish; English vocabulary stays English', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    const library = await page.locator('[data-testid^="deck-starter-"]').allInnerTexts();
    for (const name of Object.values(STARTER_DECK_NAMES_TR)) assert(library.some((t) => t.includes(name)), `deck ${name} missing`);
    assert(library.some((t) => t.includes('Hücreler ve organeller')), 'deck topic not Turkish');
    await tid(page, 'deck-starter-biology-9-cell-structure').click();
    await page.waitForTimeout(100);
    const front = (await tid(page, 'flashcard-front').innerText()).trim();
    const fronts = Object.entries(STARTER_CARDS_TR).filter(([id]) => id.startsWith('bio9-')).map(([, c]) => c[0]);
    assert(fronts.some((f) => front.includes(f)), `card front not Turkish: ${front}`);
    const list = await tid(page, 'card-list').innerText();
    assert(list.includes(STARTER_CARDS_TR['bio9-06'][1]), 'card list not Turkish');
    await tid(page, 'deck-starter-english-9-academic-vocabulary').click();
    await page.waitForTimeout(100);
    assert((await tid(page, 'card-list').innerText()).includes('To examine something in detail'), 'English vocabulary was translated');
    const saved = await read(page, CARDS_KEY);
    assert(saved.cards.find((c) => c.id === 'bio9-06').answer.startsWith('The site of photosynthesis'), 'saved card is not English');
    await tid(page, 'button-lang-en').click();
    await tid(page, 'deck-starter-biology-9-cell-structure').click();
    assert((await tid(page, 'card-list').innerText()).includes('The site of photosynthesis'), 'EN mode not English');
    await context.close();
  });

  await check('[tr] editing a starter card: unchanged texts stay English when saved, the student’s own words are kept', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    await tid(page, 'deck-starter-mathematics-9-algebra').click();
    await tid(page, 'button-edit-card-math9-03').click();
    assert((await tid(page, 'edit-card-front').inputValue()) === STARTER_CARDS_TR['math9-03'][0], 'edit form not Turkish');
    await tid(page, 'edit-card-save').click();
    let card = (await read(page, CARDS_KEY)).cards.find((c) => c.id === 'math9-03');
    assert(card.front === 'Slope-intercept form of a line' && card.explanation.startsWith('m is the slope'), `saved changed: ${card.front}`);
    await tid(page, 'button-edit-card-math9-03').click();
    await tid(page, 'edit-card-answer').fill('y = mx + b (benim notum)');
    await tid(page, 'edit-card-save').click();
    card = (await read(page, CARDS_KEY)).cards.find((c) => c.id === 'math9-03');
    assert(card.answer === 'y = mx + b (benim notum)' && card.front === 'Slope-intercept form of a line', 'student answer not saved as typed');
    const list = await tid(page, 'card-list').innerText();
    assert(list.includes('y = mx + b (benim notum)') && list.includes(STARTER_CARDS_TR['math9-03'][0]), 'list wrong after edit');
    await tid(page, 'button-lang-en').click();
    assert((await tid(page, 'card-list').innerText()).includes('y = mx + b (benim notum)'), 'student text translated in EN');
    await context.close();
  });

  await check('[tr] Progress Tracker: quiz and deck topics are Turkish; [en] English', async () => {
    const items = Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);
    let { context, page } = await open(browser, { items, path: '/progress-tracker' });
    let names = await page.locator('[data-testid="topic-name"]').allInnerTexts();
    assert(names.length > 0, 'no topics shown');
    assert(names.some((n) => Object.values(TOPICS_TR).includes(n.trim())), `topics: ${names.join(', ')}`);
    assert(!names.some((n) => ['Cells & Genetics', 'Algebra', 'Geometry', 'Evolution & Ecology', 'Human Biology'].includes(n.trim())), `English topic left: ${names.join(', ')}`);
    await context.close();
    ({ context, page } = await open(browser, { items, lang: 'en', path: '/progress-tracker' }));
    names = await page.locator('[data-testid="topic-name"]').allInnerTexts();
    assert(names.some((n) => Object.keys(TOPICS_TR).includes(n.trim())), `EN topics: ${names.join(', ')}`);
    await context.close();
  });

  for (const [vname, viewport] of Object.entries(VIEWPORTS)) {
    await check(`[tr, ${vname}] long Turkish questions and cards fit the screen`, async () => {
      const { context, page } = await open(browser, { viewport, path: '/quiz-center' });
      const bad = [];
      for (const subject of ['History', 'Geography', 'Literature']) {
        await page.goto(BASE + '/quiz-center');
        await startQuiz(page, subject);
        for (let i = 0; i < 5; i += 1) {
          const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          if (o > 0) bad.push(`${subject} q${i + 1} +${o}px`);
          await page.locator('[data-testid^="button-quiz-answer-"]').first().click();
          if (i < 4) await tid(page, 'button-quiz-next').click();
        }
        await tid(page, 'button-submit-quiz').click();
        const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (o > 0) bad.push(`${subject} results +${o}px`);
      }
      await page.goto(BASE + '/smart-flashcards');
      await tid(page, 'deck-starter-biology-10-genetics').click();
      await tid(page, 'button-flashcard-flip').click();
      const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (o > 0) bad.push(`flashcards +${o}px`);
      assert(bad.length === 0, bad.join(', '));
      await context.close();
    });
  }

  await check('no JavaScript errors during any Stage 11 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
