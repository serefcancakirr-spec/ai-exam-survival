// Browser tests for Stage 21B: English reading and listening in Quiz Center (recorded listening texts).
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage21b-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const QUIZ_KEY = 'ai-exam-survival:quiz-center:v1';
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
  await page.goto(BASE + '/quiz-center');
  await page.waitForTimeout(300);
  return { context, page };
}
async function start(page, level, topic, count) {
  await tid(page, `button-quiz-level-${level}`).click();
  await tid(page, 'select-quiz-topic').selectOption(topic);
  if (count) await tid(page, `radio-quiz-count-${count}`).check();
  await tid(page, 'button-start-quiz').click();
  await page.waitForTimeout(150);
}
async function finishQuiz(page) {
  for (let i = 0; i < 25; i += 1) {
    if (await tid(page, 'button-retry-quiz').count()) return;
    await page.locator('[data-testid^="button-quiz-answer-"]').first().click();
    const next = page.locator('[data-testid="button-quiz-next"]:not([disabled]), [data-testid="button-submit-quiz"]:not([disabled])').first();
    if (await next.count()) await next.click();
    await page.waitForTimeout(60);
  }
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] B1 has four topics: Dilbilgisi, Kelime, Okuma, Dinleme', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-quiz-level-b1').click();
    const labels = await tid(page, 'select-quiz-topic').locator('option').allInnerTexts();
    assert(JSON.stringify(labels) === JSON.stringify(['Tüm konular', 'B1 · Dilbilgisi', 'B1 · Kelime', 'B1 · Okuma', 'B1 · Dinleme']), labels.join(','));
    await context.close();
  });

  await check('[tr] a reading quiz shows the text above each question; the questions of one text stay together', async () => {
    const { context, page } = await open(browser);
    await start(page, 'b1', 'B1 · Reading', 10);
    const box = tid(page, 'english-passage-reading');
    assert((await box.innerText()).includes('Okuma metni · Seviye B1'), 'label');
    assert((await tid(page, 'english-reading-text').innerText()).includes('Every year, some parents and students ask'), 'medium text first: Should Homework Be Banned?');
    const seen = [];
    for (let i = 0; i < 10; i += 1) {
      seen.push(await box.getAttribute('data-passage'));
      await page.locator('[data-testid^="button-quiz-answer-"]').first().click();
      if (i < 9) await tid(page, 'button-quiz-next').click();
    }
    const blocks = seen.filter((id, i) => id !== seen[i - 1]);
    assert(new Set(blocks).size === blocks.length, `a text is split: ${seen.join(',')}`);
    assert(seen.slice(0, 4).every((id) => id === 'b1-read-2'), seen.join(','));
    await context.close();
  });

  await check('[tr] a listening quiz plays the recording from the site; the written text stays hidden while answering', async () => {
    const { context, page } = await open(browser);
    await start(page, 'b2', 'B2 · Listening', 5);
    const box = tid(page, 'english-passage-listening');
    assert((await box.innerText()).includes('Dinleme · Seviye B2'), 'label');
    assert((await tid(page, 'english-listen-hint').innerText()).includes('İstediğin kadar tekrar dinleyebilirsin'), 'hint');
    const src = await tid(page, 'english-audio').getAttribute('src');
    assert(src === '/audio/en/b2-listen-2.mp3', src);
    const response = await page.request.get(BASE + src);
    assert(response.status() === 200 && /audio\/mpeg/.test(response.headers()['content-type']), `${response.status()} ${response.headers()['content-type']}`);
    assert((await response.body()).length > 20000, 'recording size');
    const body = await page.locator('body').innerText();
    assert(!body.includes('al-Jazari') && !body.includes('Welcome to Room Four'), 'transcript must stay hidden');
    await context.close();
  });

  await check('the "Yavaş" button slows the recording down and "Normal hız" brings it back', async () => {
    const { context, page } = await open(browser);
    await start(page, 'a1', 'A1 · Listening', 5);
    const rate = () => tid(page, 'english-audio').evaluate((a) => a.playbackRate);
    assert((await rate()) === 1, 'normal at first');
    await tid(page, 'button-audio-slow').click();
    assert((await rate()) === 0.8, `slow: ${await rate()}`);
    assert((await tid(page, 'button-audio-slow').getAttribute('aria-pressed')) === 'true', 'slow pressed');
    await tid(page, 'button-audio-normal').click();
    assert((await rate()) === 1, 'normal again');
    await context.close();
  });

  await check('[tr] after the test, the review shows the recording and what was said, with the speakers’ names', async () => {
    const { context, page } = await open(browser);
    await start(page, 'b1', 'B1 · Listening', 5);
    await finishQuiz(page);
    const transcripts = tid(page, 'english-transcript');
    assert((await transcripts.count()) === 5, `transcripts: ${await transcripts.count()}`);
    assert((await page.locator('[data-testid="quiz-review-question"] [data-testid="english-audio"]').count()) === 5, 'audio in review');
    const summary = await transcripts.first().locator('summary').innerText();
    assert(summary === 'Dinleme metnini göster', summary);
    const dialogue = page.locator('[data-testid="english-passage-listening"][data-passage="b1-listen-2"]').first();
    await dialogue.locator('summary').click();
    const text = await dialogue.innerText();
    assert(text.includes('Selin:') && text.includes('Can:') && text.includes('the library closes at five'), text.slice(0, 200));
    await context.close();
  });

  await check('a finished listening quiz is saved in the same shape as every other quiz', async () => {
    const { context, page } = await open(browser);
    await start(page, 'c1', 'C1 · Listening', 5);
    await finishQuiz(page);
    const saved = JSON.parse(await page.evaluate((k) => localStorage.getItem(k), QUIZ_KEY));
    assert(saved.length === 1 && saved[0].topic === 'C1 · Listening', JSON.stringify({ topic: saved[0] && saved[0].topic }));
    assert(Object.keys(saved[0]).sort().join(',') === 'completedAt,difficulty,grade,id,percentage,questionCount,review,score,subject,topic', 'attempt shape');
    assert(Object.keys(saved[0].review[0].question).sort().join(',') === 'correctOptionId,difficulty,explanation,grade,id,options,prompt,subject,topic', 'question shape');
    assert(saved[0].review.every((r) => /^9-english-c1-listen-\d-\d$/.test(r.question.id)), 'ids carry the text');
    await page.reload();
    await page.waitForTimeout(300);
    assert((await page.locator('body').innerText()).includes('C1 · Dinleme'), 'history shows the Turkish topic name');
    await context.close();
  });

  await check('[en] English mode: "Reading text · Level A2", "Listening · Level A2", "Slow"', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    await start(page, 'a2', 'A2 · Reading', 5);
    assert((await tid(page, 'english-passage-reading').innerText()).includes('Reading text · Level A2'), 'reading label');
    await tid(page, 'button-new-quiz').click().catch(() => {});
    await page.goto(BASE + '/quiz-center');
    await page.waitForTimeout(200);
    await start(page, 'a2', 'A2 · Listening', 5);
    assert((await tid(page, 'english-passage-listening').innerText()).includes('Listening · Level A2'), 'listening label');
    assert((await tid(page, 'button-audio-slow').innerText()) === 'Slow', 'slow label');
    await context.close();
  });

  await check('[tr] phone: the reading text and the player fit the screen (no sideways scrolling)', async () => {
    for (const topic of ['C1 · Reading', 'C1 · Listening']) {
      const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
      await start(page, 'c1', topic, 5);
      const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
      await context.close();
      assert(!wide, `${topic} scrolls sideways`);
    }
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage21b-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
