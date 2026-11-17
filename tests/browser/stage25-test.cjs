// Browser tests for Stage 25: Turkish high school subjects in Study Planner and Exam Calendar; old saved subjects kept.
// Clock fixed at 5 Nov 2026, Istanbul. Usage: node stage25-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://127.0.0.1:4180').replace(/\/$/, '');
const LANG_KEY = 'ai-exam-survival:language:v1';
const PLANNER_KEY = 'ai-exam-survival:study-planner:v1';
const CAL_KEY = 'ai-exam-survival:exam-calendar:v1';
const TURKISH = ['Matematik', 'Fizik', 'Kimya', 'Biyoloji', 'Edebiyat', 'Tarih', 'T.C. İnkılap Tarihi ve Atatürkçülük', 'Coğrafya', 'Felsefe', 'Din Kültürü ve Ahlak Bilgisi', 'İngilizce', 'Sağlık Bilgisi ve Trafik Kültürü', 'Diğer'];
const OLD_TR = /Cebir|Geometri|İspanyolca|İngilizce Dil ve Edebiyatı|Dünya Tarihi/;
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
const options = (page, id) => tid(page, id).locator('option').allInnerTexts();

const oldPlanner = {
  version: 1, grade: '10', dailyMinutes: 60,
  subjects: [{ id: 's1', name: 'Spanish', examDate: '2026-11-20', topics: 'Verbs', difficulty: 'medium' }],
  tasks: [], weekStart: null, generatedAt: null, inputSnapshot: null,
};
const oldCalendar = {
  version: 1,
  exams: [{ id: 'old-1', subject: 'Algebra II', grade: '10', title: 'Eski sınav', date: '2026-11-20', time: '', notes: '', createdAt: '2026-11-01T10:00:00.000Z' }],
};

async function open(browser, { lang = 'tr', at = '/', seed = {} } = {}) {
  const context = await browser.newContext({ viewport: { width: 800, height: 1280 }, timezoneId: 'Europe/Istanbul', locale: 'tr-TR', reducedMotion: 'reduce' });
  await context.clock.install({ time: new Date('2026-11-05T10:00:00+03:00') });
  await context.addInitScript((entries) => {
    if (!sessionStorage.getItem('seeded')) {
      sessionStorage.setItem('seeded', '1');
      for (const [k, v] of entries) localStorage.setItem(k, v);
    }
  }, Object.entries({ [LANG_KEY]: lang, ...seed }));
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(BASE + at);
  await page.waitForSelector('#root *');
  await page.waitForTimeout(300);
  return { context, page };
}

(async () => {
  const browser = await chromium.launch();

  await check('[tr] Study Planner offers the 13 Turkish high school subjects (with İnkılap Tarihi and Sağlık Bilgisi), no American ones', async () => {
    const { context, page } = await open(browser, { at: '/study-planner' });
    const list = await options(page, 'select-subject-to-add');
    assert(JSON.stringify(list) === JSON.stringify(TURKISH), list.join(', '));
    await tid(page, 'button-add-subject').click();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PLANNER_KEY);
    assert(saved.subjects.some((s) => s.name === 'Mathematics'), `saved ${JSON.stringify(saved.subjects)}`);
    await context.close();
  });

  await check('[tr] the planner example uses Biyoloji and Matematik', async () => {
    const { context, page } = await open(browser, { at: '/study-planner' });
    await tid(page, 'button-load-sample').click();
    const saved = await page.evaluate((k) => JSON.parse(localStorage.getItem(k)), PLANNER_KEY);
    assert(saved.subjects.map((s) => s.name).join(',') === 'Biology,Mathematics', saved.subjects.map((s) => s.name).join(','));
    const text = await page.locator('main').innerText();
    assert(!OLD_TR.test(text), 'old subject name on the page');
    await context.close();
  });

  await check('[tr] Exam Calendar: the add form lists the same subjects, Matematik first; example exams use the new subjects', async () => {
    const { context, page } = await open(browser, { at: '/exam-calendar' });
    await tid(page, 'button-add-exam').click();
    const list = await options(page, 'new-exam-subject');
    assert(JSON.stringify(list) === JSON.stringify(TURKISH), list.join(', '));
    assert((await tid(page, 'new-exam-subject').inputValue()) === 'Mathematics', 'default subject');
    await context.close();
  });

  await check('old saved data (İspanyolca plan, Cebir II exam) is kept, shown and stays the same; editing keeps its subject', async () => {
    const seed = { [PLANNER_KEY]: JSON.stringify(oldPlanner), [CAL_KEY]: JSON.stringify(oldCalendar) };
    const { context, page } = await open(browser, { at: '/study-planner', seed });
    assert((await tid(page, 'subject-card-0').innerText()).includes('İspanyolca'), 'old planner subject not shown');
    assert(!(await options(page, 'select-subject-to-add')).includes('İspanyolca'), 'old subject offered');
    assert((await page.evaluate((k) => localStorage.getItem(k), PLANNER_KEY)) === JSON.stringify(oldPlanner), 'planner data changed by a visit');
    await page.goto(`${BASE}/exam-calendar`);
    await tid(page, 'exam-old-1').first().waitFor();
    assert((await tid(page, 'exam-old-1').first().innerText()).includes('Cebir II'), 'old exam not shown');
    assert((await page.evaluate((k) => localStorage.getItem(k), CAL_KEY)) === JSON.stringify(oldCalendar), 'calendar data changed by a visit');
    await tid(page, 'button-edit-exam-old-1').first().click();
    assert((await tid(page, 'edit-exam-subject').inputValue()) === 'Algebra II', 'subject lost when editing');
    assert((await options(page, 'edit-exam-subject')).includes('Cebir II'), 'old subject missing from the edit list');
    await context.close();
  });

  await check('[tr] Progress Tracker: planned Matematik is in the Matematik row (the same row as its Quiz Center results)', async () => {
    const planner = { ...oldPlanner, weekStart: '2026-11-02', subjects: [{ id: 's1', name: 'Mathematics', examDate: '2026-11-20', topics: 'Kümeler', difficulty: 'medium' }],
      tasks: [{ id: 't1', date: '2026-11-04', startTime: '4:00 PM', duration: 25, kind: 'study', subject: 'Mathematics', activity: 'Topic review', topic: 'Kümeler', completed: true }] };
    const { context, page } = await open(browser, { at: '/progress-tracker', seed: { [PLANNER_KEY]: JSON.stringify(planner) } });
    const row = tid(page, 'subject-row-mathematics');
    await row.waitFor();
    assert((await row.innerText()).includes('Matematik'), 'row name');
    assert((await row.locator('[data-testid="subject-sessions"]').count()) === 1, 'planner sessions not in the Matematik row');
    await context.close();
  });

  await check('[en] English names after choosing EN', async () => {
    const { context, page } = await open(browser, { lang: 'en', at: '/study-planner' });
    const list = await options(page, 'select-subject-to-add');
    assert(list.includes('Turkish Revolution History') && list.includes('Health and Traffic Culture') && list.includes('Mathematics') && !list.includes('Spanish'), list.join(', '));
    await context.close();
  });

  await browser.close();
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} ${r.name}${r.ok ? '' : `\n     ${r.detail}`}`);
  if (errors.length) console.log(`page errors:\n${errors.join('\n')}`);
  console.log(`${results.filter((r) => r.ok).length}/${results.length} passed`);
  process.exit(results.every((r) => r.ok) && errors.length === 0 ? 0 : 1);
})();
