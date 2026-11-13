// Browser tests for Stage 15 (A + B): grade 9 MEB (Maarif Modeli) questions for every subject except English.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage15-test.cjs <baseUrl>
const { chromium } = require('playwright');
const { EN, TR, QUESTIONS_TR, QUESTION_SEEDS, MEB9_SEEDS, MEB10_SEEDS, MEB11_SEEDS } = require('../out/dict.cjs');

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
    results.push({ name, ok: false, detail: String(e.message || e).split('\n')[0] });
  }
}
const assert = (c, m) => {
  if (!c) throw new Error(m);
};
const VIEWPORTS = { phone: { width: 390, height: 844 }, 'tablet portrait': { width: 800, height: 1280 }, 'tablet landscape': { width: 1280, height: 800 } };
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Literature'];
const MEB_BY_PROMPT = new Map(Object.entries(MEB9_SEEDS).flatMap(([subject, list]) => list.map((s) => [s.prompt, { ...s, subject }])));
// Stage 16: grade 10
const MEB10_BY_PROMPT = new Map(Object.entries(MEB10_SEEDS).flatMap(([subject, list]) => list.map((s) => [s.prompt, { ...s, subject }])));
const MEB11_BY_PROMPT = new Map(Object.entries(MEB11_SEEDS).flatMap(([subject, list]) => list.map((s) => [s.prompt, { ...s, subject }])));
const OLD_PROMPTS = new Set([...Object.values(QUESTION_SEEDS).flat().map((q) => q.prompt), ...Object.values(QUESTIONS_TR).flat().map((q) => q[0])]);
const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (_, k) => String(vars[k]));

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
  await page.goto(BASE + '/quiz-center');
  await page.waitForTimeout(150);
  return { context, page };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const read = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), QUIZ_KEY);
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

  for (const subject of SUBJECTS) {
    await check(`[tr] grade 9 ${subject}: MEB note, MEB themes as topics, MEB question with its learning outcome`, async () => {
      const { context, page } = await open(browser);
      await choose(page, '9', subject);
      assert((await tid(page, 'quiz-meb-note').innerText()).trim() === fill(TR['quiz.mebNote'], { grade: 9 }), 'note');
      const topics = (await tid(page, 'select-quiz-topic').locator('option').allInnerTexts()).slice(1);
      const themes = [...new Set(MEB9_SEEDS[subject].map((s) => s.theme))];
      assert(JSON.stringify(topics) === JSON.stringify(themes), `topics: ${topics.join(', ')}`);
      assert(await tid(page, 'radio-quiz-count-20').isEnabled(), '20 questions not possible');
      await tid(page, 'button-start-quiz').click();
      const prompt = await promptText(page);
      const seed = MEB_BY_PROMPT.get(prompt);
      assert(seed && seed.subject === subject, `not a MEB ${subject} question: ${prompt.slice(0, 50)}`);
      const tag = (await tid(page, 'quiz-meb-outcome').innerText()).trim();
      assert(tag === fill(TR['quiz.mebOutcome'], { code: seed.outcome }), `tag: ${tag}`);
      const options = await page.locator('[data-testid^="button-quiz-answer-"] [data-content="quiz"]').allInnerTexts();
      assert(options.map((o) => o.trim()).sort().join('|') === [...seed.options].sort().join('|'), 'options');
      await context.close();
    });
  }

  await check('[en] grade 9 MEB questions stay Turkish in English mode; note and tag in English', async () => {
    const { context, page } = await open(browser, { lang: 'en' });
    await choose(page, '9', 'Chemistry');
    assert((await tid(page, 'quiz-meb-note').innerText()).trim() === fill(EN['quiz.mebNote'], { grade: 9 }), 'note');
    await tid(page, 'button-start-quiz').click();
    const prompt = await promptText(page);
    const seed = MEB_BY_PROMPT.get(prompt);
    assert(seed, 'not the Turkish MEB question');
    assert((await tid(page, 'quiz-meb-outcome').innerText()).trim() === `Learning outcome: ${seed.outcome}`, 'tag');
    await tid(page, 'button-lang-tr').click();
    assert((await promptText(page)) === prompt, 'question changed after TR');
    assert((await tid(page, 'quiz-meb-outcome').innerText()).trim() === `Öğrenme çıktısı: ${seed.outcome}`, 'TR tag');
    await context.close();
  });

  await check('grade 12 and English: unchanged, no note and no outcome tag', async () => {
    const { context, page } = await open(browser);
    for (const [grade, subject] of [['12', 'Mathematics'], ['12', 'Biology'], ['12', 'History'], ['12', 'Literature'], ['9', 'English'], ['10', 'English']]) {
      await choose(page, grade, subject);
      assert((await tid(page, 'quiz-meb-note').count()) === 0, `${grade} ${subject}: note shown`);
      await tid(page, 'button-start-quiz').click();
      const prompt = await promptText(page);
      assert(OLD_PROMPTS.has(prompt), `${grade} ${subject}: not a sample question`);
      assert((await tid(page, 'quiz-meb-outcome').count()) === 0, `${grade} ${subject}: tag shown`);
      await page.goto(BASE + '/quiz-center');
    }
    await context.close();
  });

  await check('a finished grade 9 quiz is saved with the same fields as before; review shows each learning outcome', async () => {
    const { context, page } = await open(browser);
    await choose(page, '9', 'Biology');
    await finish(page);
    const saved = (await read(page))[0];
    assert(saved.grade === '9' && saved.subject === 'Biology', 'attempt grade/subject');
    const keys = Object.keys(saved.review[0].question).sort().join(',');
    assert(keys === 'correctOptionId,difficulty,explanation,grade,id,options,prompt,subject,topic', `question fields: ${keys}`);
    assert(saved.review.every((r) => r.question.id.startsWith('9-biology-meb-')), 'ids');
    const reviews = page.locator('[data-testid="quiz-review-question"]');
    assert((await reviews.count()) === 5, 'review count');
    for (let i = 0; i < 5; i += 1) {
      const seed = MEB_BY_PROMPT.get(saved.review[i].question.prompt);
      assert((await reviews.nth(i).innerText()).includes(`Öğrenme çıktısı: ${seed.outcome}`), `review ${i + 1}: outcome`);
    }
    await page.reload();
    await page.waitForTimeout(150);
    assert((await tid(page, 'quiz-attempt').count()) === 1, 'attempt not kept after refresh');
    await page.locator('[data-testid^="button-review-attempt-"]').first().click();
    assert((await tid(page, 'quiz-meb-outcome').count()) === 5, 'outcomes in saved review');
    await context.close();
  });

  await check('an old grade 9 result (saved before Stage 15) still opens and is shown in Turkish', async () => {
    const review = QUESTION_SEEDS.Mathematics.slice(0, 5).map((seed, n) => ({
      question: {
        id: `9-mathematics-${n + 1}`, grade: '9', subject: 'Mathematics', topic: seed.topic, difficulty: seed.difficulty,
        prompt: seed.prompt, options: seed.options.map((text, k) => ({ id: 'ABCD'[k], text })), correctOptionId: seed.correctOptionId, explanation: seed.explanation,
      },
      selectedOptionId: seed.correctOptionId,
    }));
    const attempt = {
      id: 'attempt-old', grade: '9', subject: 'Mathematics', topic: '__all_topics__', difficulty: 'medium', questionCount: 5,
      score: 5, percentage: 100, completedAt: '2026-10-01T10:00:00.000Z', review,
    };
    const raw = JSON.stringify([attempt]);
    const { context, page } = await open(browser, { items: [[QUIZ_KEY, raw]] });
    assert((await tid(page, 'quiz-attempt').count()) === 1, 'old attempt not listed');
    await page.locator('[data-testid^="button-review-attempt-"]').first().click();
    const text = await page.locator('[data-testid="quiz-review-question"]').first().innerText();
    assert(text.includes(QUESTIONS_TR.Mathematics[0][0]), `not Turkish: ${text.slice(0, 60)}`);
    assert((await tid(page, 'quiz-meb-outcome').count()) === 0, 'old question got an outcome tag');
    assert((await page.evaluate((k) => localStorage.getItem(k), QUIZ_KEY)) === raw, 'saved data changed');
    await context.close();
  });

  await check('choosing a grade 12 topic, then grade 9, goes back to “all topics” and the quiz still starts', async () => {
    const { context, page } = await open(browser);
    await choose(page, '12', 'Mathematics');
    await page.selectOption('#quiz-topic', 'Algebra');
    await page.selectOption('#quiz-grade', '9');
    assert((await tid(page, 'select-quiz-topic').inputValue()) === '__all_topics__', 'topic not reset');
    await tid(page, 'button-start-quiz').click();
    assert(MEB_BY_PROMPT.has(await promptText(page)), 'quiz did not start with MEB questions');
    await page.goto(BASE + '/quiz-center');
    await choose(page, '9', 'Physics');
    await page.selectOption('#quiz-topic', 'Akışkanlar');
    await tid(page, 'button-start-quiz').click();
    assert(MEB_BY_PROMPT.get(await promptText(page)).theme === 'Akışkanlar', 'theme filter');
    await context.close();
  });

  for (const subject of Object.keys(MEB10_SEEDS)) {
    await check(`[tr] Stage 16 grade 10 ${subject}: note says grade 10, MEB themes, question with its learning outcome`, async () => {
      const { context, page } = await open(browser);
      await choose(page, '10', subject);
      assert((await tid(page, 'quiz-meb-note').innerText()).trim() === fill(TR['quiz.mebNote'], { grade: 10 }), 'note');
      const topics = (await tid(page, 'select-quiz-topic').locator('option').allInnerTexts()).slice(1);
      assert(JSON.stringify(topics) === JSON.stringify([...new Set(MEB10_SEEDS[subject].map((s) => s.theme))]), `topics: ${topics.join(', ')}`);
      await tid(page, 'button-start-quiz').click();
      const seed = MEB10_BY_PROMPT.get(await promptText(page));
      assert(seed && seed.subject === subject, 'not a grade 10 MEB question');
      assert((await tid(page, 'quiz-meb-outcome').innerText()).trim() === `Öğrenme çıktısı: ${seed.outcome}`, 'tag');
      await context.close();
    });
  }

  // Stage 19: grade 11, every subject except English (19A sciences and mathematics, 19B the others).
  for (const subject of Object.keys(MEB11_SEEDS)) {
    await check(`[tr] Stage 19 grade 11 ${subject}: note says grade 11, MEB themes, question with its learning outcome`, async () => {
      const { context, page } = await open(browser);
      await choose(page, '11', subject);
      assert((await tid(page, 'quiz-meb-note').innerText()).trim() === fill(TR['quiz.mebNote'], { grade: 11 }), 'note');
      const topics = (await tid(page, 'select-quiz-topic').locator('option').allInnerTexts()).slice(1);
      assert(JSON.stringify(topics) === JSON.stringify([...new Set(MEB11_SEEDS[subject].map((s) => s.theme))]), `topics: ${topics.join(', ')}`);
      await tid(page, 'button-start-quiz').click();
      const seed = MEB11_BY_PROMPT.get(await promptText(page));
      assert(seed && seed.subject === subject, 'not a grade 11 MEB question');
      assert((await tid(page, 'quiz-meb-outcome').innerText()).trim() === `Öğrenme çıktısı: ${seed.outcome}`, 'tag');
      await context.close();
    });
  }

  await check('[tr] Stage 16: switching from grade 9 to grade 10 Physics changes the note and the questions', async () => {
    const { context, page } = await open(browser);
    await choose(page, '9', 'Physics');
    await page.selectOption('#quiz-topic', 'Akışkanlar');
    await page.selectOption('#quiz-grade', '10');
    assert((await tid(page, 'select-quiz-topic').inputValue()) === '__all_topics__', 'grade 9 theme kept for grade 10');
    assert((await tid(page, 'quiz-meb-note').innerText()).includes('10. sınıf'), 'note grade');
    await finish(page);
    const saved = (await read(page))[0];
    assert(saved.grade === '10' && saved.review.every((r) => r.question.id.startsWith('10-physics-meb-')), 'saved attempt');
    assert((await tid(page, 'quiz-meb-outcome').count()) === 5, 'outcomes in review');
    await context.close();
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await check(`${name}: note, long questions and outcome tag fit the screen (no sideways scrolling)`, async () => {
      const { context, page } = await open(browser, { viewport });
      // Türk Dili ve Edebiyatı has the longest questions (a text inside the question)
      await choose(page, '9', 'Literature');
      let o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert(o <= 0, `setup +${o}px`);
      await page.locator('[data-testid="radio-quiz-count-20"]').check({ force: true });
      await tid(page, 'button-start-quiz').click();
      for (let i = 0; i < 20; i += 1) {
        o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert(o <= 0, `question ${i + 1} +${o}px`);
        assert(await tid(page, 'quiz-meb-outcome').isVisible(), `question ${i + 1}: tag hidden`);
        if (i < 19) await tid(page, 'button-quiz-next').click();
      }
      await context.close();
    });
  }

  await check('no JavaScript errors during any Stage 15 test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
