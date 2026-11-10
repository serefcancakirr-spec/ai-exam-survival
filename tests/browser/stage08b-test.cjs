// Browser tests for Stage 8B: Turkish for Smart Flashcards, Exam Calendar, AI Study Coach, Progress Tracker.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage08b-test.cjs <baseUrl>
const { chromium } = require('playwright');
const F = require('./fixtures.cjs');
const { EN, TR, TR_PHRASES } = require('../out/dict.cjs');

const BASE = process.argv[2] || 'http://127.0.0.1:4181';
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
const PAGES = ['/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker'];
const seeded = () => Object.entries(F.realisticRaw()).map(([k, v]) => [F.KEYS[k], v]);

async function open(browser, { viewport = VIEWPORTS['tablet landscape'], items = [], path = '/' } = {}) {
  const context = await browser.newContext({ viewport, timezoneId: 'Europe/Istanbul', locale: 'en-US' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript((list) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of list) localStorage.setItem(k, v);
    }
    window.__writes = [];
    for (const m of ['setItem', 'removeItem', 'clear']) {
      const orig = Storage.prototype[m];
      Storage.prototype[m] = function (...args) {
        window.__writes.push([location.pathname, m, args[0]]);
        return orig.apply(this, args);
      };
    }
  }, items);
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
const bodyText = (page) => page.evaluate(() => document.body.innerText);
const mainText = (page) => page.locator('main').innerText();
const snapshot = (page) => page.evaluate(() => JSON.stringify(Object.keys(localStorage).sort().map((k) => [k, localStorage.getItem(k)])));
const withoutLang = (snap) => JSON.stringify(JSON.parse(snap).filter(([k]) => k !== LANG_KEY));
async function nav(page, path) {
  await page.evaluate((p) => { history.pushState(null, '', p); dispatchEvent(new PopStateEvent('popstate')); }, path);
  await page.waitForTimeout(150);
}

// English interface phrases (from both dictionaries) that must not be left in Turkish mode.
const SAME_OK = new Set(['lang.trLabel', 'lang.enLabel', 'nav.homeAria']);
const pieces = (text) => text.split(/\{\w+\}/).map((p) => p.trim().replace(/^[·:(,“”"]\s*|[·:),“”"]$/g, '').trim());
const PHRASES = [...new Set([
  ...Object.keys(EN).filter((k) => EN[k] !== TR[k] && !SAME_OK.has(k)).flatMap((k) => pieces(EN[k])),
  ...Object.keys(TR_PHRASES).filter((k) => TR_PHRASES[k] !== k).flatMap(pieces),
])].filter((p) => p.length >= 5 && /[a-z]/i.test(p) && !/^AI Exam Survival$/.test(p));
// Names that stay in English by design: the brand, PEEL (a writing method name), and the seeded student/test data.
const ALLOWED = ['AI Exam Survival', 'PEEL', 'Cell quiz', 'Equations test', 'WWI essay', 'Old test', 'Words for essays', 'Cells & organelles', 'Step s1', 'Step s2', 'Step s3'];
async function leftoverEnglish(page) {
  return page.evaluate(([phrases, allowed]) => {
    const clone = document.body.cloneNode(true);
    clone.querySelectorAll('[data-content], [data-testid="language-switch"], textarea, input').forEach((n) => n.remove());
    let text = clone.innerText || clone.textContent;
    const attrs = [...document.querySelectorAll('[aria-label],[placeholder],[title]')]
      .filter((el) => !el.closest('[data-content], [data-testid="language-switch"]'))
      .map((el) => [el.getAttribute('aria-label'), el.getAttribute('placeholder'), el.getAttribute('title')].join(' '));
    const prompt = document.querySelector('[data-testid="text-prompt"]');
    let all = `${text}\n${attrs.join(' \n ')}\n${prompt ? prompt.value : ''}`;
    for (const a of allowed) all = all.split(a).join(' ');
    // Names in “quotes” are deck or quiz-topic names (learning content), shown as saved.
    all = all.replace(/“[^”]*”/g, ' ');
    return phrases.filter((p) => new RegExp(`(^|[^A-Za-z])${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^A-Za-z]|$)`, 'i').test(all));
  }, [PHRASES, ALLOWED]);
}
async function expectTurkish(page, where) {
  const left = await leftoverEnglish(page);
  assert(left.length === 0, `${where}: English left: ${left.slice(0, 8).join(' | ')}`);
}
const cutOff = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main button, main a, main [data-testid="exam-countdown"], main label')]
      .filter((e) => e.offsetParent && !e.closest('.sr-only') && getComputedStyle(e).whiteSpace !== 'normal' && e.scrollWidth > e.clientWidth + 1)
      .map((e) => e.textContent.trim().slice(0, 40)),
  );

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Smart Flashcards ----------
  await check('Flashcards in Turkish: library, study modes, flip, summary, forms, errors and confirmations', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    let text = await mainText(page);
    assert(text.includes('Akıllı Bilgi Kartları') && text.includes('Kart desteleri') && text.includes('Öğren'), 'not Turkish');
    await expectTurkish(page, 'start');
    await tid(page, 'button-flashcard-flip').click();
    await expectTurkish(page, 'flipped');
    for (const mode of ['practice', 'review', 'learn']) {
      await tid(page, `tab-mode-${mode}`).click();
      await expectTurkish(page, mode);
    }
    await tid(page, 'tab-mode-practice').click();
    for (let i = 0; i < 12; i += 1) {
      if (await tid(page, 'session-summary').count()) break;
      await tid(page, 'button-flashcard-flip').click();
      await tid(page, i % 2 ? 'button-mark-again' : 'button-mark-know').click();
    }
    assert(await tid(page, 'session-summary').count(), 'no summary');
    text = await tid(page, 'session-summary').innerText();
    assert(/ALIŞTIRMA TURU TAMAMLANDI|Alıştırma turu tamamlandı/.test(text) && text.includes('biliniyor'), `summary: ${text}`);
    await expectTurkish(page, 'summary');
    await tid(page, 'button-new-deck').click();
    await tid(page, 'button-save-deck').click();
    assert((await mainText(page)).includes('Desteye bir ad ver.'), 'deck errors not Turkish');
    await expectTurkish(page, 'deck form errors');
    await tid(page, 'button-cancel-deck').click();
    await tid(page, 'new-card-save').click();
    assert((await mainText(page)).includes('Ön yüze soruyu veya kavramı yaz.'), 'card errors not Turkish');
    await expectTurkish(page, 'card errors');
    await page.locator('[data-testid^="button-edit-card-"]').first().click();
    await expectTurkish(page, 'card edit form');
    await tid(page, 'edit-card-cancel').click();
    await tid(page, 'button-delete-deck').click();
    await expectTurkish(page, 'delete confirm');
    await tid(page, 'confirm-delete-deck-cancel').click();
    await tid(page, 'button-reset-progress').click();
    await expectTurkish(page, 'reset confirm');
    await tid(page, 'button-restore-starters').click();
    assert((await mainText(page)).includes('Tüm hazır desteler zaten kitaplığında.'), 'restore notice');
    await context.close();
  });

  await check('Flashcards: card text stays exactly as saved; only the interface is Turkish', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards', items: seeded() });
    assert((await mainText(page)).includes('Front e1') && (await mainText(page)).includes('Academic Vocabulary'), 'content changed');
    await tid(page, 'button-flashcard-flip').click();
    assert((await tid(page, 'flashcard-back').innerText()).includes('Answer e1'), 'answer changed');
    await context.close();
  });

  await check('Flashcards: new deck created in Turkish shows Turkish messages; deck name saved exactly as typed', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    await tid(page, 'button-new-deck').click();
    await tid(page, 'input-deck-name').fill('Kelimelerim');
    await tid(page, 'select-deck-subject').selectOption('Biology');
    assert((await tid(page, 'select-deck-subject').locator('option:checked').innerText()) === 'Biyoloji', 'subject option');
    await tid(page, 'button-save-deck').click();
    assert((await mainText(page)).includes('“Kelimelerim” oluşturuldu.'), 'created notice');
    const data = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:flashcards:v1')));
    const deck = data.decks.find((d) => d.name === 'Kelimelerim');
    assert(deck && deck.subject === 'Biology', 'saved deck wrong');
    await context.close();
  });

  // ---------- 2. Exam Calendar ----------
  await check('Exam Calendar in Turkish: empty state, form errors, examples, month view, countdowns', async () => {
    const { context, page } = await open(browser, { path: '/exam-calendar' });
    await expectTurkish(page, 'empty');
    await tid(page, 'button-add-exam').click();
    await page.locator('[data-testid="form-new-exam"] button[type="submit"]').click();
    assert((await mainText(page)).includes('Sınavın adını yaz'), 'errors');
    await expectTurkish(page, 'errors');
    await page.locator('[data-testid="form-new-exam"] button[type="button"]').first().click();
    await tid(page, 'button-add-examples').click();
    const text = await mainText(page);
    assert(text.includes('Üç örnek sınav eklendi') && text.includes('Hücre yapısı kısa sınavı'), 'examples not Turkish');
    assert(text.includes('Kasım 2026') && text.includes('5 Kasım 2026 Perşembe'), 'dates not Turkish');
    const month = await tid(page, 'month-grid').innerText();
    assert(/PZT|Pzt/.test(month) && /PAZ|Paz/.test(month), `weekday header: ${month.slice(0, 40)}`);
    assert(text.includes('09:00') && !text.includes('9:00 AM'), '24-hour time');
    assert(text.includes('Yarın') && text.includes('5 gün sonra'), 'countdowns');
    await expectTurkish(page, 'with examples');
    await tid(page, 'button-toggle-past').click();
    await expectTurkish(page, 'past open');
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:exam-calendar:v1')));
    assert(saved.exams[0].subject === 'Biology' && saved.exams[0].time === '09:00', 'saved values changed');
    await context.close();
  });

  await check('Exam Calendar: preparation steps and suggestions in Turkish; saved suggestions recognised in both languages', async () => {
    const { context, page } = await open(browser, { path: '/exam-calendar', items: seeded() });
    await page.locator('[data-testid="button-prepare-e-alg"]').click();
    const panel = tid(page, 'prep-panel-e-alg');
    const ptext = await panel.innerText();
    assert(ptext.includes('5 gün sonraki sınav için öneriler') && ptext.includes('Cebir I bilgi kartları'), `prep: ${ptext.slice(0, 200)}`);
    await expectTurkish(page, 'prep panel');
    await tid(page, 'button-add-all-suggestions').click();
    const steps = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:exam-prep:v1'))).steps.filter((s) => s.examId === 'e-alg');
    assert(steps.length === 5 && steps.some((s) => s.text === 'Sınavın kapsadığı tüm konuları listele'), 'suggestions not saved in Turkish');
    assert((await tid(page, 'button-add-all-suggestions').innerText()).includes('Hepsi eklendi'), 'not marked added (TR)');
    await tid(page, 'button-lang-en').click();
    assert((await tid(page, 'button-add-all-suggestions').innerText()).includes('All added'), 'not marked added (EN)');
    await tid(page, 'button-lang-tr').click();
    await panel.locator('[data-testid="button-edit-step"]').first().click();
    await expectTurkish(page, 'edit step');
    await context.close();
  });

  await check('Exam Calendar: steps added in English show in Turkish and keep their saved words after Save', async () => {
    const { context, page } = await open(browser, { path: '/exam-calendar', items: seeded().concat([[LANG_KEY, 'en']]) });
    await page.locator('[data-testid="button-prepare-e-alg"]').click();
    await page.locator('[data-testid="button-add-suggestion"]').first().click();
    const before = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:exam-prep:v1'))).steps.find((s) => s.examId === 'e-alg');
    assert(before.text === 'List every topic the exam covers', before.text);
    await tid(page, 'button-lang-tr').click();
    const panel = tid(page, 'prep-panel-e-alg');
    assert((await panel.locator('[data-testid="step-text"]').first().innerText()) === 'Sınavın kapsadığı tüm konuları listele', 'not shown in Turkish');
    await panel.locator('[data-testid="button-edit-step"]').first().click();
    await tid(page, 'button-save-step').click();
    const after = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:exam-prep:v1'))).steps.find((s) => s.id === before.id);
    assert(JSON.stringify(after) === JSON.stringify(before), `changed: ${after.text}`);
    await context.close();
  });

  await check('Exam Calendar: student exam titles and notes are never translated', async () => {
    const { context, page } = await open(browser, { path: '/exam-calendar', items: seeded() });
    const t = await mainText(page);
    assert(t.includes('Cell quiz') && t.includes('Equations test') && t.includes('WWI essay'), 'titles changed');
    await context.close();
  });

  // ---------- 3. AI Study Coach ----------
  await check('AI Study Coach in Turkish: example plan, strategies, tips and practice question', async () => {
    const { context, page } = await open(browser, { path: '/ai-study-coach' });
    const t = (await mainText(page)).toLocaleLowerCase('tr-TR');
    assert(t.includes('yapay zekâ çalışma koçu') && t.includes('örnek plan') && t.includes('genetik ve dna'), 'not Turkish');
    assert((await tid(page, 'input-coach-topic').inputValue()) === 'Genetik ve DNA', 'example topic');
    const prompt = await tid(page, 'text-prompt').inputValue();
    assert(prompt.startsWith('Ben 10. sınıf öğrencisiyim.') && prompt.includes('Biyoloji'), `prompt: ${prompt}`);
    await expectTurkish(page, 'example');
    await context.close();
  });

  await check('AI Study Coach: every subject, difficulty, problem and exam timing gives fully Turkish advice', async () => {
    const { context, page } = await open(browser, { path: '/ai-study-coach' });
    const subjects = await tid(page, 'select-coach-subject').locator('option').evaluateAll((o) => o.map((x) => x.value));
    const problems = await tid(page, 'select-coach-problem').locator('option').evaluateAll((o) => o.map((x) => x.value));
    const dates = ['', '2026-11-05', '2026-11-06', '2026-11-10', '2026-11-20', '2027-01-15'];
    const diffs = ['comfortable', 'somewhat-hard', 'very-hard'];
    let n = 0;
    for (const [i, subject] of subjects.entries()) {
      await tid(page, 'select-coach-subject').selectOption(subject);
      await tid(page, 'input-coach-topic').fill(i % 2 ? '' : 'Kendi konum');
      await tid(page, `radio-difficulty-${diffs[i % 3]}`).check({ force: true });
      await tid(page, 'select-coach-problem').selectOption(problems[i % problems.length]);
      await tid(page, 'input-coach-date').fill(dates[i % dates.length]);
      await tid(page, 'button-coach-submit').click();
      await expectTurkish(page, `${subject}/${diffs[i % 3]}/${problems[i % problems.length]}/${dates[i % dates.length] || 'no date'}`);
      n += 1;
    }
    for (const date of dates) for (const diff of diffs) {
      await tid(page, 'input-coach-date').fill(date);
      await tid(page, `radio-difficulty-${diff}`).check({ force: true });
      await tid(page, 'button-coach-submit').click();
      await expectTurkish(page, `${date || 'no date'}/${diff}`);
      n += 1;
    }
    assert(n >= 28, `${n} plans`);
    const actions = await tid(page, 'plan-actions').innerText();
    assert(!actions.includes('this topic'), 'default topic left in English');
    await context.close();
  });

  await check('AI Study Coach: form errors, notices and the calendar shortcut are Turkish', async () => {
    const { context, page } = await open(browser, { path: '/ai-study-coach', items: seeded() });
    await tid(page, 'input-coach-topic').fill('x'.repeat(60));
    await tid(page, 'input-coach-date').fill('2026-11-01');
    await tid(page, 'button-coach-submit').click();
    assert((await tid(page, 'coach-errors').innerText()).includes('Bu sınav tarihi geçti.'), 'errors');
    await expectTurkish(page, 'errors');
    const option = await tid(page, 'select-coach-exam').locator('option').nth(1).innerText();
    assert(option.includes('Biyoloji') && option.includes('Yarın'), `exam option: ${option}`);
    await tid(page, 'select-coach-exam').selectOption({ index: 1 });
    assert((await tid(page, 'coach-notice').innerText()).includes('Sınav Takvimindeki “Cell quiz”'), 'notice');
    await expectTurkish(page, 'from exam');
    await context.close();
  });

  await check('AI Study Coach: what the student types is kept and saved exactly as typed', async () => {
    const { context, page } = await open(browser, { path: '/ai-study-coach' });
    await tid(page, 'input-coach-topic').fill('Hücre bölünmesi (mitoz)');
    await tid(page, 'button-coach-submit').click();
    const saved = JSON.parse(await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-coach:v1')));
    assert(saved.request.topic === 'Hücre bölünmesi (mitoz)' && saved.request.subject === 'Biology', JSON.stringify(saved.request));
    assert((await tid(page, 'plan-actions').innerText()).includes('Hücre bölünmesi (mitoz)'), 'topic missing from plan');
    await tid(page, 'button-lang-en').click();
    assert((await tid(page, 'plan-actions').innerText()).includes('Hücre bölünmesi (mitoz)'), 'topic changed in English');
    await context.close();
  });

  // ---------- 4. Progress Tracker ----------
  await check('Progress Tracker in Turkish (empty and with data): numbers, labels, charts and advice', async () => {
    let { context, page } = await open(browser, { path: '/progress-tracker' });
    await expectTurkish(page, 'empty');
    await context.close();
    ({ context, page } = await open(browser, { path: '/progress-tracker', items: seeded() }));
    const t = await mainText(page);
    assert(t.includes('İlerleme Takibi') && t.includes('Cebir I') && t.includes('Matematik'), 'not Turkish');
    assert(/BUGÜN|Bugün/.test(await tid(page, 'weekly-chart').locator('xpath=..').innerText()), 'chart day labels');
    await expectTurkish(page, 'with data');
    const topics = await page.locator('[data-testid="topic-name"]').allInnerTexts();
    assert(topics.some((x) => /Algebra|Modern World|Evolution/.test(x)), `quiz topic names should stay: ${topics.join(',')}`);
    await context.close();
  });

  await check('Progress Tracker: the same numbers in both languages and still completely read-only', async () => {
    const { context, page } = await open(browser, { path: '/progress-tracker', items: seeded() });
    const ids = ['tile-quizzes-value', 'tile-average-value', 'tile-sessions-value', 'tile-mastered-value', 'tile-active-value'];
    const tr = await Promise.all(ids.map((id) => tid(page, id).innerText()));
    const before = await snapshot(page);
    await page.evaluate(() => { window.__writes = []; });
    await tid(page, 'button-lang-en').click();
    const en = await Promise.all(ids.map((id) => tid(page, id).innerText()));
    await tid(page, 'button-lang-tr').click();
    assert(JSON.stringify(tr) === JSON.stringify(en), `${tr} vs ${en}`);
    const writes = await page.evaluate(() => window.__writes);
    assert(writes.every(([, , key]) => key === 'ai-exam-survival:language:v1'), `other writes: ${JSON.stringify(writes)}`);
    assert(withoutLang(before) === withoutLang(await snapshot(page)), 'data changed');
    await context.close();
  });

  // ---------- 5. all modules together ----------
  await check('switching language 20 times across all seven pages leaves every saved record byte-for-byte the same', async () => {
    const { context, page } = await open(browser, { items: seeded().concat([[LANG_KEY, 'tr']]) });
    const paths = ['/', '/study-planner', '/quiz-center', ...PAGES];
    for (const p of paths) await nav(page, p);
    const before = await snapshot(page);
    for (let i = 0; i < 20; i += 1) {
      await nav(page, paths[i % paths.length]);
      await tid(page, i % 2 ? 'button-lang-tr' : 'button-lang-en').click();
      if (i % 4 === 0) await page.reload();
    }
    assert(withoutLang(before) === withoutLang(await snapshot(page)), 'saved data changed');
    await context.close();
  });

  await check('chosen language is the same on every page and survives refresh on each', async () => {
    const { context, page } = await open(browser, { path: '/smart-flashcards' });
    await tid(page, 'button-lang-en').click();
    for (const [p, w] of [['/smart-flashcards', 'Flashcard decks'], ['/exam-calendar', 'Upcoming exams'], ['/ai-study-coach', 'Get my study plan'], ['/progress-tracker', 'Weekly study activity']]) {
      await nav(page, p);
      assert((await mainText(page)).includes(w), `${p} not English`);
      await page.reload();
      assert((await mainText(page)).includes(w), `${p} not English after refresh`);
    }
    await tid(page, 'button-lang-tr').click();
    for (const [p, w] of [['/smart-flashcards', 'Kart desteleri'], ['/exam-calendar', 'Yaklaşan sınavlar'], ['/ai-study-coach', 'Çalışma planımı oluştur'], ['/progress-tracker', 'Haftalık çalışma etkinliği']]) {
      await nav(page, p);
      assert((await mainText(page)).includes(w), `${p} not Turkish`);
      await page.reload();
      assert((await mainText(page)).includes(w), `${p} not Turkish after refresh`);
    }
    await context.close();
  });

  for (const [name, viewport] of Object.entries(VIEWPORTS)) {
    await check(`[${name}] Turkish: no page runs off the screen and no button text is cut off`, async () => {
      const { context, page } = await open(browser, { viewport, items: seeded() });
      const bad = [];
      for (const p of PAGES) {
        await nav(page, p);
        if (p === '/exam-calendar') await page.locator('[data-testid="button-prepare-e-alg"]').click();
        if (p === '/smart-flashcards') await tid(page, 'button-flashcard-flip').click();
        await page.waitForTimeout(100);
        const o = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        if (o > 0) bad.push(`${p} +${o}px`);
        const cut = await cutOff(page);
        if (cut.length) bad.push(`${p} cut: ${cut.slice(0, 3).join(' / ')}`);
      }
      assert(bad.length === 0, bad.join(', '));
      await context.close();
    });
  }

  await check('no JavaScript errors during any Stage 8B test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : `  -> ${r.detail}`}`);
  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
})();
