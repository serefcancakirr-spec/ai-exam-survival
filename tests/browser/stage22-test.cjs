// Browser tests for Stage 22A: YKS exam mode (TYT) in Quiz Center.
// Clock fixed at 5 Nov 2026 10:00 Istanbul (the exam timer only moves when the test moves the clock).
// Usage: node stage22-test.cjs <baseUrl>
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

async function open(browser, { lang = 'tr', viewport = { width: 800, height: 1280 }, path = '/quiz-center' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript(([key, value]) => {
    try {
      if (!sessionStorage.getItem('seeded')) {
        sessionStorage.setItem('seeded', '1');
        localStorage.setItem(key, value);
      }
    } catch {
      // about:blank has no storage
    }
  }, [LANG_KEY, lang]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + path);
  await page.waitForTimeout(300);
  return { context, page };
}
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), EXAM_KEY);

(async () => {
  const browser = await chromium.launch();

  await check('[tr] Quiz Center shows the TYT practice exam with the YKS label, both kinds and the honest note; nothing is saved by a visit', async () => {
    const { context, page } = await open(browser);
    const box = tid(page, 'exam-mode');
    const text = await box.innerText();
    assert(text.includes('Deneme sınavı · TYT') && text.includes('12. sınıf · YKS'), 'title and badge');
    assert((await tid(page, 'button-exam-start-mini').innerText()).includes('30 soru · 41 dakika'), 'mini');
    assert((await tid(page, 'button-exam-start-full').innerText()).includes('120 soru · 165 dakika'), 'full');
    const note = await tid(page, 'exam-note').innerText();
    assert(note.includes('ÖSYM sorusu değildir') && note.includes('Puan, sıralama veya üniversite tahmini yapılmaz'), note);
    assert(!/ÖSYM onaylı|MEB onaylı/.test(await page.locator('body').innerText()), 'never “onaylı”');
    assert((await tid(page, 'exam-history-empty').count()) === 1, 'empty history');
    assert((await saved(page)) === null, 'a visit saves nothing');
    await context.close();
  });

  await check('[tr] a mini exam: 41:00 timer, four tests 10/5/10/5, five options; the normal quiz is hidden while the exam runs', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-mini').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('41:00'), await tid(page, 'exam-timer').innerText());
    for (const [s, n] of [['turkce', 10], ['sosyal', 5], ['matematik', 10], ['fen', 5]]) {
      assert((await tid(page, `exam-tab-${s}`).innerText()).includes(`0/${n}`), `${s} 0/${n}`);
    }
    assert((await page.locator('[data-testid^="exam-option-"]').count()) === 5, 'five options');
    assert((await page.locator('[data-testid^="exam-grid-"]').count()) === 10, 'Türkçe grid 10');
    assert((await tid(page, 'button-start-quiz').count()) === 0, 'quiz setup hidden');
    await page.clock.runFor(65_000);
    assert((await tid(page, 'exam-timer').innerText()).includes('39:55'), `after 65 s: ${await tid(page, 'exam-timer').innerText()}`);
    await context.close();
  });

  await check('answering, clearing and moving between tests work; answers and the place are saved and survive a reload', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-mini').click();
    await tid(page, 'exam-option-C').click();
    assert((await tid(page, 'exam-option-C').getAttribute('aria-checked')) === 'true', 'C chosen');
    assert((await tid(page, 'exam-tab-turkce').innerText()).includes('1/10'), 'counted');
    await tid(page, 'button-exam-clear').click();
    assert((await tid(page, 'exam-tab-turkce').innerText()).includes('0/10'), 'cleared');
    await tid(page, 'exam-option-B').click();
    await tid(page, 'exam-tab-matematik').click();
    assert((await tid(page, 'exam-question').innerText()).includes('Soru 16 / 30 · Temel Matematik'), await tid(page, 'exam-question').innerText());
    await tid(page, 'exam-option-E').click();
    let data = await saved(page);
    assert(data.current && Object.keys(data.current.answers).length === 2 && data.current.currentIndex === 15, JSON.stringify(data.current && data.current.answers));
    await page.clock.runFor(120_000);
    await page.reload();
    await page.waitForTimeout(300);
    assert((await tid(page, 'exam-question').innerText()).includes('Soru 16 / 30'), 'same question after reload');
    assert((await tid(page, 'exam-option-E').getAttribute('aria-checked')) === 'true', 'answer kept');
    assert((await tid(page, 'exam-timer').innerText()).includes('39:00'), `timer kept running: ${await tid(page, 'exam-timer').innerText()}`);
    data = await saved(page);
    assert(data.results.length === 0, 'not finished yet');
    await context.close();
  });

  await check('finishing asks first (with the number of blanks); the result shows correct, wrong, blank and net per test and is saved', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-mini').click();
    for (let i = 0; i < 12; i += 1) {
      await tid(page, 'exam-option-A').click();
      await tid(page, 'button-exam-next').click();
    }
    await tid(page, 'button-exam-finish').click();
    assert((await tid(page, 'exam-finish-confirm').innerText()).includes('18 soru boş'), await tid(page, 'exam-finish-confirm').innerText());
    await tid(page, 'button-exam-finish-cancel').click();
    assert((await tid(page, 'exam-finish-confirm').count()) === 0, 'cancel keeps the exam');
    await tid(page, 'button-exam-finish').click();
    await tid(page, 'button-exam-finish-confirm').click();
    await page.waitForTimeout(200);
    const data = await saved(page);
    assert(data.current === null && data.results.length === 1, 'saved, no exam in progress');
    const r = data.results[0];
    assert(Object.keys(r).sort().join(',') === 'answers,finishedAt,id,kind,questionIds,sections,startedAt,timedOut,totalNet', 'result shape');
    const totals = r.sections.reduce((a, s) => [a[0] + s.correct, a[1] + s.wrong, a[2] + s.blank], [0, 0, 0]);
    assert(totals[0] + totals[1] === 12 && totals[2] === 18, `answered 12, blank 18: ${totals}`);
    assert(Math.abs(r.totalNet - (totals[0] - totals[1] / 4)) < 1e-9, 'net formula');
    const shown = (await tid(page, 'exam-total-net').innerText()).trim();
    assert(shown === r.totalNet.toLocaleString('tr-TR', { maximumFractionDigits: 2 }), `shown ${shown} vs ${r.totalNet}`);
    for (const s of ['turkce', 'sosyal', 'matematik', 'fen']) assert((await tid(page, `exam-result-row-${s}`).count()) === 1, s);
    assert((await tid(page, 'exam-net-note').innerText()).includes('Net = doğru − yanlış ÷ 4'), 'net note');
    assert((await tid(page, 'exam-review-item').count()) === 30, 'review all');
    await tid(page, 'button-exam-review-blank').click();
    assert((await tid(page, 'exam-review-item').count()) === 18, 'review blanks');
    await tid(page, 'button-exam-back').click();
    await page.waitForTimeout(200);
    assert((await tid(page, 'exam-history-item').count()) === 1, 'history item');
    assert((await tid(page, 'button-start-quiz').count()) === 1, 'normal quiz back');
    await context.close();
  });

  await check('when the time runs out the exam ends by itself and says so; a closed page finishes it on the next visit', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-mini').click();
    await tid(page, 'exam-option-D').click();
    await page.clock.runFor(41 * 60_000 + 2000);
    await page.waitForTimeout(200);
    assert((await tid(page, 'exam-timed-out').count()) === 1, 'timed out message');
    let data = await saved(page);
    assert(data.results[0].timedOut === true && data.current === null, 'saved as timed out');
    // second exam: close the page, come back after the time is over
    await tid(page, 'button-exam-back').click();
    await tid(page, 'button-exam-start-mini').click();
    await page.goto('about:blank');
    await page.clock.runFor(45 * 60_000);
    await page.goto(BASE + '/quiz-center');
    await page.waitForTimeout(300);
    data = await saved(page);
    assert(data.results.length === 2 && data.results[0].timedOut === true && data.current === null, 'finished on the next visit');
    assert((await tid(page, 'exam-history-item').count()) === 2, 'two in history');
    await context.close();
  });

  await check('a second mini exam starts with different Türkçe questions', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-mini').click();
    const first = await tid(page, 'exam-question').getAttribute('data-question');
    await tid(page, 'button-exam-finish').click();
    await tid(page, 'button-exam-finish-confirm').click();
    await tid(page, 'button-exam-back').click();
    await tid(page, 'button-exam-start-mini').click();
    const second = await tid(page, 'exam-question').getAttribute('data-question');
    assert(first === 'tyt-turkce-1' && second === 'tyt-turkce-11', `${first} → ${second}`);
    await context.close();
  });

  await check('“Delete all my data on this device” also removes the exam results', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-exam-start-mini').click();
    await tid(page, 'button-exam-finish').click();
    await tid(page, 'button-exam-finish-confirm').click();
    await page.goto(BASE + '/about');
    await page.waitForTimeout(200);
    await page.locator('[data-testid="button-delete-data"]').click();
    await page.locator('[data-testid="button-delete-confirm"]').click();
    assert((await saved(page)) === null, 'exam key removed');
    await context.close();
  });

  await check('[en] English mode: labels in English, the questions stay Turkish (it is a Turkish exam)', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    assert((await tid(page, 'exam-mode').innerText()).includes('Practice exam · TYT'), 'title');
    await tid(page, 'button-exam-start-full').click();
    assert((await tid(page, 'exam-timer').innerText()).includes('2:45:00'), 'full timer');
    assert((await tid(page, 'exam-tab-turkce').innerText()).includes('Turkish 0/40'), await tid(page, 'exam-tab-turkce').innerText());
    assert((await tid(page, 'exam-question').innerText()).includes('Aşağıdaki cümlelerin hangisinde'), 'question in Turkish');
    await context.close();
  });

  await check('[tr] phone: the exam screen and the result table fit (no sideways scrolling of the page)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    await tid(page, 'button-exam-start-mini').click();
    let wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'exam screen scrolls sideways');
    await tid(page, 'button-exam-finish').click();
    await tid(page, 'button-exam-finish-confirm').click();
    wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'result scrolls sideways');
    await context.close();
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
