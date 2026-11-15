// Browser tests for Stage 22C-2: YDT sets in the real ÖSYM booklet layout; exams saved before still open.
// Clock fixed at 5 Nov 2026 10:00 Istanbul. Usage: node stage22c2-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const EXAM_KEY = 'ai-exam-survival:exam-mode:v1';
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
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), EXAM_KEY);

async function open(browser, { lang = 'tr', viewport = { width: 800, height: 1280 } } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript(([key, value]) => {
    try {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem(key, value);
      }
    } catch {
      // no storage
    }
  }, [LANG_KEY, lang]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + '/quiz-center');
  await page.waitForTimeout(300);
  return { context, page };
}
const tabs = (page) => page.locator('[role="tab"]').allInnerTexts();

const seedOldResult = (page) => page.evaluate((key) => {
  // a full YDT finished before Stage 22C-2 (questions ydt-1-1 … ydt-1-80, some of them retired now)
  const questionIds = Array.from({ length: 80 }, (_, i) => `ydt-1-${i + 1}`);
  const result = {
    id: 'old-ydt', kind: 'ydt-full', startedAt: '2026-11-04T10:00:00+03:00', finishedAt: '2026-11-04T12:00:00+03:00',
    timedOut: false, questionIds, answers: {}, totalNet: 0,
    sections: [{ section: 'ydt', total: 80, correct: 0, wrong: 0, blank: 80, net: 0 }],
  };
  localStorage.setItem(key, JSON.stringify({ version: 1, results: [result], current: null }));
}, EXAM_KEY);

(async () => {
  const browser = await chromium.launch();

  await check('[tr] full YDT follows the real booklet: 7–8 new vocabulary, 16 cloze, 29 reading, 54 situation, 64 and 70 translations', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ydt-full').click();
    const head = async (n) => { await tid(page, `exam-grid-${n}`).click(); return tid(page, 'exam-question').innerText(); };
    const expect = { 8: 'Kelime bilgisi', 9: 'Dil bilgisi', 16: 'Cloze test', 21: 'Cümle tamamlama', 29: 'Okuma', 44: 'Diyalog tamamlama',
      49: 'Anlamca en yakın cümle', 54: 'Durumda söylenecek söz', 59: 'Paragraf tamamlama', 64: 'Çeviri (İngilizce → Türkçe)',
      70: 'Çeviri (Türkçe → İngilizce)', 76: 'Anlam bütünlüğünü bozan cümle' };
    for (const [n, topic] of Object.entries(expect)) assert((await head(n)).includes(topic), `question ${n}: ${topic}`);
    const ids = (await saved(page)).current.questionIds;
    assert(ids[6] === 'ydt-1-81' && ids[7] === 'ydt-1-82', ids.slice(5, 9).join(','));
    await context.close();
  });

  await check('[tr] a situation question shows the situation in English above the question', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-ydt-full').click();
    await tid(page, 'exam-grid-54').click();
    const passage = await tid(page, 'exam-passage').innerText();
    assert(passage.startsWith('Your friend has a big exam tomorrow') && passage.trim().endsWith('----'), passage.slice(0, 80));
    assert((await tid(page, 'exam-question').innerText()).includes('Verilen durumda söylenmiş olabilecek sözü bulunuz.'), 'instruction');
    assert((await page.locator('[data-testid^="exam-option-"]').count()) === 5, 'five options');
    await context.close();
  });

  await check('[tr] minis: the first has the cloze text, the second has three reading texts instead', async () => {
    const { context, page } = await open(browser);
    const topics = [];
    for (let k = 0; k < 2; k += 1) {
      await tid(page, 'button-exam-start-ydt-mini').click();
      const qs = await page.locator('[data-testid^="exam-grid-"]').count();
      assert(qs === 40, `40 questions, got ${qs}`);
      let text = '';
      for (const n of [9, 14]) { await tid(page, `exam-grid-${n}`).click(); text += await tid(page, 'exam-question').innerText(); }
      topics.push(text);
      await tid(page, 'button-exam-finish').click();
      await tid(page, 'button-exam-finish-confirm').click();
      await page.waitForTimeout(150);
      await page.goto(BASE + '/quiz-center');
      await page.waitForTimeout(200);
    }
    assert(topics[0].includes('Cloze test'), 'first mini: cloze at 9–13');
    assert(!topics[1].includes('Cloze test') && topics[1].includes('Okuma'), 'second mini: no cloze, reading');
    await context.close();
  });

  await check('[tr] a YDT result saved before this stage still opens with all 80 questions in the review', async () => {
    const { context, page } = await open(browser);
    await seedOldResult(page);
    await page.reload();
    await page.waitForTimeout(300);
    await tid(page, 'exam-history-item').first().locator('button').first().click();
    await page.waitForTimeout(200);
    assert((await tid(page, 'exam-result-row-ydt').count()) === 1, 'result row');
    assert((await tid(page, 'exam-review-item').count()) === 80, `review items: ${await tid(page, 'exam-review-item').count()}`);
    const saved1 = await saved(page);
    assert(saved1.results.length === 1 && saved1.results[0].id === 'old-ydt', 'saved data unchanged');
    await context.close();
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22c2-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
