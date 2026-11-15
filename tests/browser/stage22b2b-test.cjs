// Browser tests for Stage 22B-2b: Felsefe (grades 10–11) and Din Kültürü ve Ahlak Bilgisi (grades 9–12) in Quiz Center,
// Smart Flashcards and Progress Tracker. Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage22b2b-test.cjs <baseUrl>
const { chromium } = require('playwright');
const { TR, EN, FEL_DKAB_SEEDS } = require('../out/dict.cjs');

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
    results.push({ name, ok: false, detail: String(e.message || e).split('\n').slice(0, 4).join(' | ') });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));
const BY_PROMPT = new Map(
  Object.entries(FEL_DKAB_SEEDS).flatMap(([grade, by]) => Object.entries(by).flatMap(([subject, list]) => list.map((s) => [s.prompt, { ...s, grade, subject }]))),
);

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
      // no storage
    }
  }, [LANG_KEY, lang]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('dialog', (d) => d.dismiss());
  await page.goto(BASE + path);
  await page.waitForTimeout(200);
  return { context, page };
}
const subjectOptions = (page) => page.locator('#quiz-subject option').evaluateAll((els) => els.map((e) => [e.value, e.textContent.trim()]));
const promptText = async (page) => (await page.locator('[data-content="quiz"]').first().innerText()).trim();
async function choose(page, grade, subject) {
  await page.selectOption('#quiz-grade', grade);
  await page.selectOption('#quiz-subject', subject);
}
async function finish(page, count = 5) {
  await tid(page, 'button-start-quiz').click();
  for (let i = 0; i < count; i += 1) {
    await page.locator('[data-testid^="button-quiz-answer-"]').first().click();
    if (i < count - 1) await tid(page, 'button-quiz-next').click();
  }
  await tid(page, 'button-submit-quiz').click();
  await page.waitForTimeout(150);
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] subject list per grade: Din Kültürü in 9–12, Felsefe only in 10 and 11', async () => {
    const { context, page } = await open(browser);
    for (const [grade, felsefe] of [['9', false], ['10', true], ['11', true], ['12', false]]) {
      await page.selectOption('#quiz-grade', grade);
      const options = await subjectOptions(page);
      const values = options.map((o) => o[0]);
      assert(values.slice(0, 8).join(',') === 'English,Mathematics,Biology,Chemistry,Physics,History,Geography,Literature', `${grade}: older subjects first`);
      assert(values.includes('Religion'), `${grade}: Din Kültürü missing`);
      assert(values.includes('Philosophy') === felsefe, `${grade}: Felsefe ${felsefe ? 'missing' : 'shown'}`);
      assert(options.find((o) => o[0] === 'Religion')[1] === 'Din Kültürü ve Ahlak Bilgisi', 'Turkish label');
      if (felsefe) assert(options.find((o) => o[0] === 'Philosophy')[1] === 'Felsefe', 'Felsefe label');
    }
    await context.close();
  });

  await check('[tr] grade 10 Felsefe: MEB note, units as topics, question with its learning outcome', async () => {
    const { context, page } = await open(browser);
    await choose(page, '10', 'Philosophy');
    assert((await tid(page, 'quiz-meb-note').innerText()).trim() === fill(TR['quiz.mebNote'], { grade: 10 }), 'note');
    const topics = await page.locator('#quiz-topic option').allInnerTexts();
    assert(topics.length === 10 && topics.includes('Bilgi Felsefesi') && topics.includes('Bilim Felsefesi'), `topics: ${topics.join(' / ')}`);
    await tid(page, 'button-start-quiz').click();
    const seed = BY_PROMPT.get(await promptText(page));
    assert(seed && seed.grade === '10' && seed.subject === 'Philosophy', 'not a grade 10 Felsefe question');
    assert((await tid(page, 'quiz-meb-outcome').innerText()).trim() === `Öğrenme çıktısı: ${seed.outcome}`, 'outcome tag');
    await context.close();
  });

  await check('[tr] changing to grade 9 while Felsefe is chosen goes back to the first subject (no empty quiz)', async () => {
    const { context, page } = await open(browser);
    await choose(page, '11', 'Philosophy');
    await page.selectOption('#quiz-grade', '9');
    assert((await page.inputValue('#quiz-subject')) === 'English', `subject is ${await page.inputValue('#quiz-subject')}`);
    await page.selectOption('#quiz-grade', '12');
    await page.selectOption('#quiz-subject', 'Religion');
    await page.selectOption('#quiz-grade', '9');
    assert((await page.inputValue('#quiz-subject')) === 'Religion', 'Din Kültürü stays when changing grade');
    await context.close();
  });

  await check('[tr] a finished grade 12 Din Kültürü quiz is saved with the same fields; review shows outcomes; Progress Tracker shows it', async () => {
    const { context, page } = await open(browser);
    await choose(page, '12', 'Religion');
    await finish(page);
    const saved = (await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), QUIZ_KEY))[0];
    assert(saved.grade === '12' && saved.subject === 'Religion', 'attempt grade/subject');
    const keys = Object.keys(saved.review[0].question).sort().join(',');
    assert(keys === 'correctOptionId,difficulty,explanation,grade,id,options,prompt,subject,topic', `question fields: ${keys}`);
    assert(saved.review.every((r) => r.question.id.startsWith('12-religion-meb-')), 'ids');
    const reviews = page.locator('[data-testid="quiz-review-question"]');
    assert((await reviews.count()) === 5, 'review count');
    for (let i = 0; i < 5; i += 1) {
      const seed = BY_PROMPT.get(saved.review[i].question.prompt);
      assert((await reviews.nth(i).innerText()).includes(`Öğrenme çıktısı: ${seed.outcome}`), `review ${i + 1}: outcome`);
    }
    await page.goto(BASE + '/progress-tracker');
    await page.waitForTimeout(200);
    const row = tid(page, 'subject-row-religion');
    assert((await row.count()) === 1, 'Progress Tracker row');
    assert((await row.innerText()).includes('Din Kültürü ve Ahlak Bilgisi'), 'row label');
    await context.close();
  });

  await check('[tr] Smart Flashcards: both subjects can be chosen for a new deck', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    const filter = await tid(page, 'select-filter-subject').locator('option').allInnerTexts();
    assert(filter.includes('Felsefe') && filter.includes('Din Kültürü ve Ahlak Bilgisi'), 'subject filter');
    await tid(page, 'button-new-deck').click();
    const values = await page.locator('#deck-subject option').evaluateAll((els) => els.map((e) => [e.value, e.textContent.trim()]));
    assert(values.some((v) => v[0] === 'Philosophy' && v[1] === 'Felsefe'), 'Felsefe');
    assert(values.some((v) => v[0] === 'Religion' && v[1] === 'Din Kültürü ve Ahlak Bilgisi'), 'Din Kültürü');
    await context.close();
  });

  await check('[en] English labels; the questions stay Turkish', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    await page.selectOption('#quiz-grade', '11');
    const options = await subjectOptions(page);
    assert(options.find((o) => o[0] === 'Philosophy')[1] === EN['subject.Philosophy'], 'Philosophy label');
    assert(options.find((o) => o[0] === 'Religion')[1] === 'Religious Culture and Ethics', 'Religion label');
    await page.selectOption('#quiz-subject', 'Religion');
    await tid(page, 'button-start-quiz').click();
    assert(BY_PROMPT.has(await promptText(page)), 'Turkish MEB question');
    assert((await tid(page, 'quiz-meb-outcome').innerText()).trim().startsWith('Learning outcome: DKAB.11.'), 'English tag');
    await context.close();
  });

  await check('[tr] phone: the quiz setup with the long subject name fits (no sideways scrolling)', async () => {
    const { context, page } = await open(browser, { viewport: { width: 390, height: 844 } });
    await choose(page, '10', 'Religion');
    const wide = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    assert(!wide, 'sideways scrolling');
    await context.close();
  });

  await check('no page errors', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `\n      ${r.detail}`}`);
  console.log(`\nstage22b2b-test: ${results.length - failed.length} pass, ${failed.length} fail`);
  process.exit(failed.length ? 1 : 0);
})();
