// Browser tests for Stage 8A: Turkish / English language system. Clock fixed at 5 Nov 2026, Istanbul.
// Usage: node stage08a-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const { EN, TR } = require('../out/dict.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:4180';
const LANG_KEY = 'ai-exam-survival:language:v1';
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
const VIEWPORTS = {
  phone: { width: 390, height: 844 },
  'tablet portrait': { width: 800, height: 1280 },
  'tablet landscape': { width: 1280, height: 800 },
  'small laptop': { width: 1024, height: 768 },
};

async function open(browser, { viewport = VIEWPORTS['tablet landscape'], items = [], path = '/', blockStorage = false } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'en-US' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript(([list, block]) => {
    if (block) {
      for (const m of ['getItem', 'setItem', 'removeItem']) Storage.prototype[m] = () => { throw new Error('blocked'); };
      return;
    }
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
  }, [items, blockStorage]);
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  await page.goto(BASE + path);
  await page.waitForTimeout(150);
  return { context, page };
}
const tid = (page, id) => page.locator(`[data-testid="${id}"]`);
const bodyText = (page) => page.evaluate(() => document.body.innerText);
const snapshot = (page) => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
const withoutLang = (snap) => JSON.stringify(JSON.parse(snap).filter(([k]) => k !== 'ai-exam-survival:language:v1'));
const seeded = () => Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);
async function nav(page, path) {
  // Client-side navigation through the app, like tapping a link.
  await page.evaluate((p) => { history.pushState(null, '', p); dispatchEvent(new PopStateEvent('popstate')); }, path);
  await page.waitForTimeout(120);
}

// English interface phrases that must NOT show in Turkish mode (pieces between {placeholders}).
const SAME_OK = new Set(['lang.trLabel', 'lang.enLabel', 'nav.homeAria']);
const PHRASES = [...new Set(Object.keys(EN)
  .filter((k) => EN[k] !== TR[k] && !SAME_OK.has(k))
  .flatMap((k) => EN[k].split(/\{\w+\}/))
  .map((p) => p.trim().replace(/^[·:(]\s*|[·:)]$/g, '').trim())
  .filter((p) => p.length >= 5 && /[a-z]/i.test(p)))];
// Phrases that are also real English learning content or names (allowed inside quiz questions/topics).
const CONTENT_OK = new Set(['English', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Literature', 'Mathematics', 'Geometry', 'Algebra I', 'Algebra II', 'Spanish', 'Other', 'Correct', 'Explanation']);
async function leftoverEnglish(page, { allowContent = false } = {}) {
  const found = await page.evaluate(([phrases]) => {
    const clone = document.body.cloneNode(true);
    // Learning content stays in English by decision: question text, answers, explanations and topic names.
    clone.querySelectorAll('[data-content="quiz"], [data-testid="language-switch"]').forEach((n) => n.remove());
    const text = clone.innerText || clone.textContent;
    const attrs = [...document.querySelectorAll('[aria-label],[placeholder],[title]')]
      .filter((el) => !el.closest('[data-content="quiz"], [data-testid="language-switch"]'))
      .map((el) => [el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.getAttribute('title')].join(' '))
      .join(' \n ');
    const all = `${text}\n${attrs}`;
    return phrases.filter((p) => new RegExp(`(^|[^A-Za-z])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z]|$)`, "i").test(all));
  }, [PHRASES]);
  return found.filter((p) => !(allowContent && CONTENT_OK.has(p)));
}
async function noOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. default language and switch ----------
  await check('first visit opens in Turkish (TR pressed, page lang="tr")', async () => {
    const { context, page } = await open(browser);
    assert((await tid(page, 'button-lang-tr').getAttribute('aria-pressed')) === 'true', 'TR not pressed');
    assert((await tid(page, 'button-lang-en').getAttribute('aria-pressed')) === 'false', 'EN pressed');
    assert((await page.evaluate(() => document.documentElement.lang)) === 'tr', 'html lang not tr');
    const text = await bodyText(page);
    assert(text.includes('Sınavlara adım adım hazırlan') && text.includes('Araçları keşfet'), 'Turkish homepage text missing');
    await context.close();
  });

  await check('first visit saves nothing (language key written only after a tap)', async () => {
    const { context, page } = await open(browser);
    assert((await page.evaluate(() => localStorage.length)) === 0, 'something was saved');
    await tid(page, 'button-lang-tr').click();
    assert((await page.evaluate((k) => localStorage.getItem(k), LANG_KEY)) === 'tr', 'tap on TR not saved');
    await context.close();
  });

  await check('switching to EN changes the page at once and is remembered after refresh', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-lang-en').click();
    let text = await bodyText(page);
    assert(text.includes('Prepare for exams step by step') && !text.includes('Sınavlara adım adım'), 'not English after tap');
    assert((await page.evaluate(() => document.documentElement.lang)) === 'en', 'html lang not en');
    assert((await page.evaluate((k) => localStorage.getItem(k), LANG_KEY)) === 'en', 'not saved');
    await page.reload();
    text = await bodyText(page);
    assert(text.includes('Prepare for exams step by step'), 'English lost after refresh');
    assert((await tid(page, 'button-lang-en').getAttribute('aria-pressed')) === 'true', 'EN not pressed after refresh');
    await context.close();
  });

  await check('chosen language stays the same across all seven pages and after refresh on each', async () => {
    const { context, page } = await open(browser);
    await tid(page, 'button-lang-en').click();
    for (const [path, word] of [['/study-planner', 'Generate my week'], ['/quiz-center', 'Start sample quiz'], ['/smart-flashcards', 'Explore the tools'], ['/ai-study-coach', 'Explore the tools'], ['/progress-tracker', 'Explore the tools'], ['/exam-calendar', 'Explore the tools']]) {
      await nav(page, path);
      assert((await bodyText(page)).includes(word), `${path}: English missing after navigation`);
      await page.reload();
      assert((await bodyText(page)).includes(word), `${path}: English missing after refresh`);
    }
    await tid(page, 'button-lang-tr').click();
    for (const [path, word] of [['/study-planner', 'Haftamı oluştur'], ['/quiz-center', 'Örnek testi başlat'], ['/', 'Sıradaki adımını bul']]) {
      await nav(page, path);
      assert((await bodyText(page)).includes(word), `${path}: Turkish missing after navigation`);
      await page.reload();
      assert((await bodyText(page)).includes(word), `${path}: Turkish missing after refresh`);
    }
    await context.close();
  });

  await check('switch is reachable on phone next to the menu button, and inside the open menu the links are Turkish', async () => {
    const { context, page } = await open(browser, { viewport: VIEWPORTS.phone });
    assert(await tid(page, 'language-switch').isVisible(), 'switch hidden on phone');
    await tid(page, 'button-mobile-menu').click();
    const menu = await page.locator('#mobile-navigation').innerText();
    for (const w of ['Ana sayfa', 'Çalışma Planlayıcı', 'Test Merkezi', 'Akıllı Bilgi Kartları', 'Yapay Zekâ Çalışma Koçu', 'İlerleme Takibi', 'Sınav Takvimi', 'Tüm araçlara göz at']) assert(menu.includes(w), `menu missing ${w}`);
    assert((await tid(page, 'button-mobile-menu').getAttribute('aria-label')) === 'Menüyü kapat', 'menu button label not Turkish');
    await tid(page, 'button-lang-en').click();
    assert((await page.locator('#mobile-navigation').innerText()).includes('Smart Flashcards'), 'menu did not switch to English');
    await context.close();
  });

  await check('language buttons are 40px or bigger to tap', async () => {
    const { context, page } = await open(browser, { viewport: VIEWPORTS.phone });
    for (const id of ['button-lang-tr', 'button-lang-en']) {
      const box = await tid(page, id).boundingBox();
      assert(box.height >= 40 && box.width >= 40, `${id} is ${box.width}x${box.height}`);
    }
    await context.close();
  });

  // ---------- 2. no English interface text left on translated pages ----------
  await check('homepage: no English interface text in Turkish (text and screen-reader labels)', async () => {
    const { context, page } = await open(browser);
    const left = await leftoverEnglish(page);
    assert(left.length === 0, `English left: ${left.join(' | ')}`);
    await context.close();
  });

  await check('page not found: Turkish', async () => {
    const { context, page } = await open(browser, { path: '/olmayan-sayfa' });
    const text = await bodyText(page);
    assert(text.includes('404 Sayfa Bulunamadı'), 'title not Turkish');
    const left = await leftoverEnglish(page);
    assert(left.length === 0, `English left: ${left.join(' | ')}`);
    await context.close();
  });

  await check('Study Planner (empty, errors, sample, plan, edit form): no English interface text', async () => {
    const { context, page } = await open(browser, { path: '/study-planner' });
    let left = await leftoverEnglish(page);
    assert(left.length === 0, `empty: ${left.join(' | ')}`);
    await tid(page, 'button-generate-plan').click();
    const err = await tid(page, 'message-error').innerText();
    assert(err.includes('Planını oluşturmadan önce şunları tamamla') && err.includes('9 ile 12 arasında bir sınıf seç') && err.includes('En az bir ders'), `errors not Turkish: ${err}`);
    left = await leftoverEnglish(page);
    assert(left.length === 0, `errors: ${left.join(' | ')}`);
    await tid(page, 'button-load-sample').click();
    await tid(page, 'button-generate-plan').click();
    await page.waitForTimeout(100);
    left = await leftoverEnglish(page);
    assert(left.length === 0, `plan: ${left.join(' | ')}`);
    await page.locator('[data-testid^="button-edit-task-"]').first().click();
    left = await leftoverEnglish(page);
    assert(left.length === 0, `edit form: ${left.join(' | ')}`);
    await context.close();
  });

  await check('Quiz Center (setup, question, unanswered warning, results, history): only learning content stays English', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    let left = await leftoverEnglish(page);
    assert(left.length === 0, `setup: ${left.join(' | ')}`);
    await tid(page, 'button-start-quiz').click();
    left = await leftoverEnglish(page, { allowContent: true });
    assert(left.length === 0, `question: ${left.join(' | ')}`);
    for (let i = 0; i < 4; i += 1) await tid(page, 'button-quiz-next').click();
    await tid(page, 'button-submit-quiz').click();
    const warn = await tid(page, 'quiz-notice-error').innerText();
    assert(warn.includes('5 soru hâlâ cevapsız'), `warning: ${warn}`);
    for (let i = 0; i < 4; i += 1) await tid(page, 'button-quiz-previous').click();
    for (let i = 0; i < 5; i += 1) {
      await tid(page, 'button-quiz-answer-A').click();
      if (i < 4) await tid(page, 'button-quiz-next').click();
    }
    await tid(page, 'button-submit-quiz').click();
    left = await leftoverEnglish(page, { allowContent: true });
    assert(left.length === 0, `results: ${left.join(' | ')}`);
    await page.locator('[data-testid^="button-review-attempt-"]').first().click();
    left = await leftoverEnglish(page, { allowContent: true });
    assert(left.length === 0, `history: ${left.join(' | ')}`);
    await context.close();
  });

  await check('Quiz Center: questions, answers and explanations stay in English', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center' });
    await tid(page, 'button-start-quiz').click();
    const prompt = await page.locator('[data-content="quiz"]').first().innerText();
    assert(/[A-Za-z]{4,}/.test(prompt) && !/[ğışçöüİ]/.test(prompt), `question changed: ${prompt}`);
    const before = prompt;
    await tid(page, 'button-lang-en').click();
    assert((await page.locator('[data-content="quiz"]').first().innerText()) === before, 'question text changed when switching language');
    await context.close();
  });

  // ---------- 3. names, dates, times, numbers ----------
  await check('subject names are Turkish on screen but the saved value stays English', async () => {
    const { context, page } = await open(browser, { path: '/study-planner' });
    const options = await tid(page, 'select-subject-to-add').locator('option').allInnerTexts();
    assert(options.includes('Cebir I') && options.includes('Biyoloji') && options.includes('Dünya Tarihi'), `options: ${options.join(',')}`);
    const values = await tid(page, 'select-subject-to-add').locator('option').evaluateAll((o) => o.map((x) => x.value));
    assert(values.includes('Algebra I') && values.includes('Biology'), 'option values changed');
    await tid(page, 'select-subject-to-add').selectOption('Biology');
    await tid(page, 'button-add-subject').click();
    assert((await tid(page, 'subject-card-0').innerText()).includes('Biyoloji'), 'card not Turkish');
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-planner:v1')));
    assert(saved.subjects[0].name === 'Biology', `saved name: ${saved.subjects[0].name}`);
    await context.close();
  });

  await check('Study Planner timetable: Turkish day names, dates and 24-hour times', async () => {
    const { context, page } = await open(browser, { path: '/study-planner' });
    await tid(page, 'button-load-sample').click();
    await tid(page, 'button-generate-plan').click();
    const day = await tid(page, 'day-2026-11-05').innerText();
    assert(/PERŞEMBE|Perşembe/.test(day) && day.includes('5 Kas'), `day: ${day.slice(0, 80)}`);
    assert(day.includes('16:00 · 25 dk') && day.includes('16:25 · 5 dk'), `times: ${day}`);
    const saturday = await tid(page, 'day-2026-11-07').innerText();
    assert(saturday.includes('10:00'), 'weekend time');
    const all = await bodyText(page);
    const lower = all.toLocaleLowerCase('tr-TR');
    assert(lower.includes('başlangıç: 5 kas') && lower.includes('güncellendi: 5 kas'), 'eyebrow / updated date not Turkish');
    const tasks = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-planner:v1'))).tasks;
    assert(tasks[0].startTime === '4:00 PM' && ['Topic review', 'Practice questions', 'Revision & recall', 'Mixed practice'].includes(tasks[0].activity), 'saved task changed');
    assert(tasks.find((x) => x.kind === 'break').topic === 'Stretch, hydrate, and rest your eyes.', 'saved break text changed');
    await tid(page, 'button-lang-en').click();
    const dayEn = await tid(page, 'day-2026-11-05').innerText();
    assert(/THURSDAY|Thursday/.test(dayEn) && dayEn.includes('Nov 5') && dayEn.includes('4:00 PM'), `English day: ${dayEn.slice(0, 80)}`);
    await context.close();
  });

  await check('Quiz history dates follow the language; same average in both languages', async () => {
    const { context, page } = await open(browser, { path: '/quiz-center', items: [[F.KEYS.quiz, F.realisticRaw().quiz]] });
    const tr = await page.locator('[data-testid="quiz-attempt"]').first().innerText();
    assert(tr.includes('4 Kas 2026') && tr.includes('14:00') && tr.includes('Biyoloji · 9. sınıf'), `TR: ${tr}`);
    const avgTr = (await bodyText(page)).match(/Ortalama puan\s*(\d+)%/i);
    await tid(page, 'button-lang-en').click();
    const en = await page.locator('[data-testid="quiz-attempt"]').first().innerText();
    assert(en.includes('Nov 4, 2026') && en.includes('2:00 PM') && en.includes('Biology · Grade 9'), `EN: ${en}`);
    const avgEn = (await bodyText(page)).match(/Average score\s*(\d+)%/i);
    assert(avgTr && avgEn && avgTr[1] === avgEn[1], `averages ${avgTr && avgTr[1]} vs ${avgEn && avgEn[1]}`);
    await context.close();
  });

  // ---------- 4. student data is never changed by the language ----------
  await check('switching language 20 times on every page leaves all saved data byte-for-byte the same', async () => {
    const { context, page } = await open(browser, { items: seeded().concat([[LANG_KEY, 'en']]) });
    const paths = ['/', '/study-planner', '/quiz-center', '/smart-flashcards', '/ai-study-coach', '/progress-tracker', '/exam-calendar'];
    for (const p of paths) await nav(page, p); // let every tool load its data once
    const before = await snapshot(page);
    for (let i = 0; i < 20; i += 1) {
      await nav(page, paths[i % paths.length]);
      await tid(page, i % 2 ? 'button-lang-en' : 'button-lang-tr').click();
      if (i % 5 === 0) await page.reload();
    }
    const after = await snapshot(page);
    assert(withoutLang(before) === withoutLang(after), 'saved data changed');
    assert(JSON.parse(before).length === 6, `expected 5 data keys + language, got ${JSON.parse(before).length}`);
    await context.close();
  });

  await check('seeded data is still exactly what was saved before the switch existed', async () => {
    const raw = seeded();
    const { context, page } = await open(browser, { items: raw, path: '/progress-tracker' });
    for (const p of ['/study-planner', '/quiz-center', '/exam-calendar', '/smart-flashcards']) {
      await nav(page, p);
      await tid(page, 'button-lang-en').click();
      await tid(page, 'button-lang-tr').click();
    }
    const now = Object.fromEntries(JSON.parse(await snapshot(page)));
    for (const [k, v] of raw) {
      if (k === F.KEYS.flashcards) continue; // Flashcards re-saves its own data when it opens (unchanged behaviour since Stage 2)
      assert(now[k] === v, `${k} changed`);
    }
    await context.close();
  });

  await check('editing a task in Turkish and saving without changes keeps the saved English words', async () => {
    const { context, page } = await open(browser, { path: '/study-planner' });
    await tid(page, 'button-load-sample').click();
    await tid(page, 'button-generate-plan').click();
    const before = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-planner:v1'))).tasks[0];
    await page.locator('[data-testid^="button-edit-task-"]').first().click();
    assert((await tid(page, 'input-edit-subject').inputValue()) === 'Biyoloji', 'edit box not Turkish');
    await tid(page, 'button-save-task').click();
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-planner:v1'))).tasks[0];
    assert(JSON.stringify(before) === JSON.stringify(after), `task changed: ${JSON.stringify(after)}`);
    await context.close();
  });

  await check('text a student types is saved exactly as typed and never translated', async () => {
    const { context, page } = await open(browser, { path: '/study-planner' });
    await tid(page, 'button-load-sample').click();
    await tid(page, 'button-generate-plan').click();
    await page.locator('[data-testid^="button-edit-task-"]').first().click();
    await tid(page, 'input-edit-activity').fill('Practice questions');
    await tid(page, 'input-edit-topic').fill('Kendi notum: hücre zarı');
    await tid(page, 'button-save-task').click();
    const task = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-planner:v1'))).tasks[0];
    assert(task.topic === 'Kendi notum: hücre zarı' && task.activity === 'Practice questions', JSON.stringify(task));
    await tid(page, 'button-lang-en').click();
    assert((await bodyText(page)).includes('Kendi notum: hücre zarı'), 'student text changed in English');
    await context.close();
  });

  await check('sample details: Turkish topics in Turkish mode, English topics in English mode (new data only)', async () => {
    const { context, page } = await open(browser, { path: '/study-planner' });
    await tid(page, 'button-load-sample').click();
    assert((await tid(page, 'textarea-topics-0').inputValue()).startsWith('Hücre yapısı'), 'TR sample');
    await context.close();
    const b = await open(browser, { path: '/study-planner', items: [[LANG_KEY, 'en']] });
    await tid(b.page, 'button-load-sample').click();
    assert((await tid(b.page, 'textarea-topics-0').inputValue()) === 'Cell structure, Mitosis, Cell transport', 'EN sample');
    await b.context.close();
  });

  await check('if the browser blocks storage, the page still opens in Turkish and the switch still works', async () => {
    const { context, page } = await open(browser, { path: '/study-planner', blockStorage: true });
    assert((await bodyText(page)).includes('Haftamı oluştur'), 'not Turkish');
    await tid(page, 'button-lang-en').click();
    assert((await bodyText(page)).includes('Generate my week'), 'switch failed');
    await context.close();
  });

  // ---------- 5. layout in Turkish (longer words) ----------
  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await check(`[${name}] Turkish: nothing runs off the screen on any page`, async () => {
      const { context, page } = await open(browser, { viewport, items: seeded() });
      const bad = [];
      for (const p of ['/', '/study-planner', '/quiz-center', '/smart-flashcards', '/ai-study-coach', '/progress-tracker', '/exam-calendar', '/x']) {
        await nav(page, p);
        const o = await noOverflow(page);
        if (o > 0) bad.push(`${p} +${o}px`);
      }
      assert(bad.length === 0, bad.join(', '));
      await context.close();
    });
    await check(`[${name}] Turkish header: logo, links, switch and buttons do not overlap`, async () => {
      const { context, page } = await open(browser, { viewport });
      const boxes = await page.evaluate(() => [...document.querySelectorAll('header a, header button, header [data-testid="language-switch"]')]
        .filter((e) => e.offsetParent && !e.closest('#mobile-navigation') && !e.closest('[data-testid="language-switch"]:not([data-testid="language-switch"]) '))
        .filter((e) => !(e.tagName === 'BUTTON' && e.closest('[data-testid="language-switch"]')))
        .map((e) => { const r = e.getBoundingClientRect(); return { n: e.textContent.trim() || e.getAttribute('aria-label'), l: r.left, r: r.right, t: r.top, b: r.bottom }; }));
      const clash = [];
      for (let i = 0; i < boxes.length; i += 1) for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i], c = boxes[j];
        if (a.l < c.r - 1 && c.l < a.r - 1 && a.t < c.b - 1 && c.t < a.b - 1) clash.push(`${a.n} / ${c.n}`);
      }
      assert(clash.length === 0, clash.join(', '));
      const h = await page.locator('header').evaluate((e) => e.getBoundingClientRect().height);
      assert(h <= 76, `header grew to ${h}px`);
      await context.close();
    });
    await check(`[${name}] Turkish planner and quiz buttons keep their text on one line or wrap cleanly`, async () => {
      const { context, page } = await open(browser, { viewport, path: '/study-planner' });
      for (const id of ['button-generate-plan', 'button-add-subject', 'button-load-sample']) {
        const ok = await tid(page, id).evaluate((e) => e.scrollWidth <= e.clientWidth + 1);
        assert(ok, `${id} text cut off`);
      }
      await nav(page, '/quiz-center');
      const ok = await tid(page, 'button-start-quiz').evaluate((e) => e.scrollWidth <= e.clientWidth + 1);
      assert(ok, 'start quiz text cut off');
      await context.close();
    });
  }

  await check('modules not yet translated (8B) still work normally in Turkish mode', async () => {
    const { context, page } = await open(browser, { items: seeded(), path: '/exam-calendar' });
    assert((await bodyText(page)).includes('Cell quiz'), 'calendar data missing');
    await nav(page, '/progress-tracker');
    assert((await page.locator('main').innerText()).length > 200, 'progress empty');
    await nav(page, '/smart-flashcards');
    assert((await page.locator('main').innerText()).includes('Academic Vocabulary'), 'flashcards missing');
    await nav(page, '/ai-study-coach');
    assert((await page.locator('main').innerText()).length > 200, 'coach empty');
    await context.close();
  });

  await check('no JavaScript errors during any Stage 8A test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
