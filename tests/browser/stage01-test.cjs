// Automated browser tests for AI Exam Survival (Stage 1).
// Usage: node stage01-test.cjs <baseUrl> <label>
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4173';
const LABEL = process.argv[3] || 'build';
const results = [];
let currentErrors = [];

const TOOLS = [
  { path: '/study-planner', h1: 'Study Planner' },
  { path: '/quiz-center', h1: 'Quiz Center' },
  { path: '/smart-flashcards', h1: 'Smart Flashcards' },
  { path: '/ai-study-coach', h1: 'AI Study Coach' },
  { path: '/progress-tracker', h1: 'Progress Tracker' },
  { path: '/exam-calendar', h1: 'Exam Calendar' },
];

const VIEWPORTS = {
  'tablet-portrait': { width: 800, height: 1280 },
  'tablet-landscape': { width: 1280, height: 800 },
  phone: { width: 390, height: 844 },
};

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, detail: String(error.message || error).split('\n')[0] });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function newPage(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', (e) => currentErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    // Google Fonts cannot be reached from the test machine; that is not an app error.
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) currentErrors.push(`console: ${m.text()} ${m.location()?.url || ''}`);
  });
  page.on('dialog', (d) => d.accept());
  return { context, page };
}

const scrollY = (page) => page.evaluate(() => Math.round(window.scrollY));
const sectionTop = (page, id) =>
  page.evaluate((i) => {
    const el = document.getElementById(i);
    return el ? Math.round(el.getBoundingClientRect().top) : null;
  }, id);
const h1 = (page) => page.locator('h1').first().innerText();
const settle = (page) => page.waitForTimeout(900); // lets smooth scrolling finish

(async () => {
  const browser = await chromium.launch();

  // ---------- Homepage and pages load ----------
  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    const { context, page } = await newPage(browser, vp);
    await check(`[${vpName}] homepage loads with 6 tool cards`, async () => {
      await page.goto(BASE + '/');
      assert((await h1(page)).includes('Make the next exam feel'), 'homepage heading missing');
      const cards = await page.locator('[data-testid^="link-tool-"]').count();
      assert(cards === 6, `expected 6 tool cards, found ${cards}`);
    });
    await check(`[${vpName}] no horizontal scrolling on homepage`, async () => {
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });

    // Stage 1 fix: tool cards open new pages at the top
    for (const tool of TOOLS) {
      await check(`[${vpName}] card ${tool.path} opens at the top`, async () => {
        await page.goto(BASE + '/');
        const card = page.locator(`[data-testid="link-tool-${tool.path.slice(1)}"]`);
        await card.scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollBy(0, 200));
        await settle(page);
        const before = await scrollY(page);
        assert(before > 300, `test setup: homepage not scrolled (y=${before})`);
        await card.click();
        await settle(page);
        assert((await h1(page)) === tool.h1, `wrong page: ${await h1(page)}`);
        const y = await scrollY(page);
        assert(y < 5, `page opened scrolled down (y=${y})`);
      });
    }

    await check(`[${vpName}] "Back to home" works on every tool page`, async () => {
      for (const tool of TOOLS) {
        await page.goto(BASE + tool.path);
        await page.locator('[data-testid="link-back-home"]').click();
        await settle(page);
        assert((await h1(page)).includes('Make the next exam feel'), `back home failed from ${tool.path}`);
      }
    });
    await context.close();
  }

  // ---------- Direct links, refresh, unknown page ----------
  {
    const { context, page } = await newPage(browser, VIEWPORTS['tablet-portrait']);
    for (const tool of TOOLS) {
      await check(`direct link + refresh works: ${tool.path}`, async () => {
        await page.goto(BASE + tool.path);
        await page.reload();
        assert((await h1(page)) === tool.h1, `got "${await h1(page)}"`);
      });
    }
    await check('unknown address shows the Not Found page', async () => {
      await page.goto(BASE + '/no-such-page');
      const text = await page.locator('body').innerText();
      assert(/404|not found/i.test(text), 'no not-found message');
    });
    await check('browser Back button returns to the homepage', async () => {
      await page.goto(BASE + '/');
      await page.locator('[data-testid="link-tool-quiz-center"]').click();
      await settle(page);
      await page.goBack();
      await settle(page);
      assert((await h1(page)).includes('Make the next exam feel'), 'back did not return home');
    });
    await context.close();
  }

  // ---------- Menu (tablet portrait + phone: the ☰ menu) ----------
  for (const vpName of ['tablet-portrait', 'phone']) {
    const { context, page } = await newPage(browser, VIEWPORTS[vpName]);
    await check(`[${vpName}] ☰ menu lists Home + 6 tools and each link opens its page`, async () => {
      for (const tool of TOOLS) {
        await page.goto(BASE + '/');
        await page.locator('[data-testid="button-mobile-menu"]').click();
        const links = await page.locator('#mobile-navigation a').count();
        assert(links === 8, `expected 8 menu links, found ${links}`);
        await page.locator(`[data-testid="link-mobile-${tool.path.slice(1)}"]`).click();
        await settle(page);
        assert((await h1(page)) === tool.h1, `menu link went to "${await h1(page)}"`);
        assert(!(await page.locator('#mobile-navigation').isVisible()), 'menu did not close');
      }
    });
    // Stage 1 fix: "Browse all tools" scrolls to the tools section
    await check(`[${vpName}] ☰ "Browse all tools" from Quiz Center lands on the tools section`, async () => {
      await page.goto(BASE + '/quiz-center');
      await page.locator('[data-testid="button-mobile-menu"]').click();
      await page.locator('[data-testid="link-mobile-explore"]').click();
      await settle(page);
      const t = await sectionTop(page, 'all-tools');
      assert(t !== null && t > -10 && t < 150, `tools section not in view (top=${t})`);
    });
    await check(`[${vpName}] ☰ "Browse all tools" on the homepage scrolls down to the tools`, async () => {
      await page.goto(BASE + '/');
      await page.locator('[data-testid="button-mobile-menu"]').click();
      await page.locator('[data-testid="link-mobile-explore"]').click();
      await settle(page);
      const t = await sectionTop(page, 'all-tools');
      assert(t !== null && t > -10 && t < 150, `tools section not in view (top=${t})`);
    });
    await context.close();
  }

  // ---------- Top bar links (tablet landscape) ----------
  {
    const { context, page } = await newPage(browser, VIEWPORTS['tablet-landscape']);
    await check('[tablet-landscape] top bar links open Study Planner, Quiz Center, Flashcards', async () => {
      for (const id of ['study-planner', 'quiz-center', 'smart-flashcards']) {
        await page.goto(BASE + '/');
        await page.locator(`[data-testid="link-nav-${id}"]`).click();
        await settle(page);
        assert((await h1(page)) === TOOLS.find((t) => t.path === '/' + id).h1, `nav ${id} failed`);
      }
    });
    for (const [testid, label] of [
      ['link-nav-all-tools', 'More tools'],
      ['link-explore-tools', 'Explore the tools'],
    ]) {
      await check(`[tablet-landscape] "${label}" from Quiz Center lands on the tools section`, async () => {
        await page.goto(BASE + '/quiz-center');
        await page.locator(`[data-testid="${testid}"]`).click();
        await settle(page);
        const t = await sectionTop(page, 'all-tools');
        assert(t !== null && t > -10 && t < 150, `tools section not in view (top=${t})`);
      });
      await check(`[tablet-landscape] "${label}" on the homepage scrolls to the tools section`, async () => {
        await page.goto(BASE + '/');
        await page.locator(`[data-testid="${testid}"]`).click();
        await settle(page);
        const t = await sectionTop(page, 'all-tools');
        assert(t !== null && t > -10 && t < 150, `tools section not in view (top=${t})`);
      });
    }
    await check('[tablet-landscape] homepage "Find your next step" button still scrolls to tools', async () => {
      await page.goto(BASE + '/');
      await page.locator('[data-testid="link-start-planning"]').click();
      await settle(page);
      const t = await sectionTop(page, 'all-tools');
      assert(t !== null && t > -10 && t < 150, `tools section not in view (top=${t})`);
    });
    await context.close();
  }

  // ---------- Demo tool pages ----------
  {
    const { context, page } = await newPage(browser, VIEWPORTS['tablet-portrait']);
    await check('Smart Flashcards: flip, next and previous work', async () => {
      await page.goto(BASE + '/smart-flashcards');
      const flip = page.locator('[data-testid="button-flashcard-flip"]');
      const front = await flip.innerText();
      await flip.click();
      assert((await flip.innerText()) !== front, 'card did not flip');
      await page.locator('[data-testid="button-flashcard-next"]').click();
      assert((await page.locator('body').innerText()).includes('Card 2 of 3'), 'next failed');
      await page.locator('[data-testid="button-flashcard-previous"]').click();
      await page.locator('[data-testid="button-flashcard-previous"]').click();
      assert((await page.locator('body').innerText()).includes('Card 3 of 3'), 'previous/wrap failed');
    });
    for (const [path, text] of [
      ['/ai-study-coach', 'AI is not connected'],
      ['/progress-tracker', 'Subject progress'],
      ['/exam-calendar', 'Upcoming exams'],
    ]) {
      await check(`${path}: sample content shows`, async () => {
        await page.goto(BASE + path);
        assert((await page.locator('body').innerText()).includes(text), `missing "${text}"`);
      });
    }
    await context.close();
  }

  // ---------- Study Planner ----------
  {
    const { context, page } = await newPage(browser, VIEWPORTS['tablet-portrait']);
    await check('Study Planner: empty form shows clear errors', async () => {
      await page.goto(BASE + '/study-planner');
      await page.locator('[data-testid="button-generate-plan"]').click();
      assert(await page.locator('[data-testid="message-error"]').isVisible(), 'no error message');
    });
    await check('Study Planner: sample details generate a 7-day plan', async () => {
      await page.locator('[data-testid="button-load-sample"]').click();
      await page.locator('[data-testid="button-generate-plan"]').click();
      assert(await page.locator('[data-testid="message-success"]').isVisible(), 'no success message');
      const days = await page.locator('[data-testid^="day-"]').count();
      assert(days === 7, `expected 7 days, found ${days}`);
      const tasks = await page.locator('[data-testid^="checkbox-task-"]').count();
      assert(tasks > 0, 'no tasks generated');
    });
    await check('Study Planner: ticking a task is saved after refresh', async () => {
      const first = page.locator('[data-testid^="checkbox-task-"]').first();
      const id = await first.getAttribute('data-testid');
      await first.check();
      await page.reload();
      assert(await page.locator(`[data-testid="${id}"]`).isChecked(), 'tick lost after refresh');
    });
    await check('Study Planner: editing a task saves', async () => {
      await page.locator('[data-testid^="button-edit-task-"]').first().click();
      await page.locator('[data-testid="input-edit-topic"]').fill('Edited by test');
      await page.locator('[data-testid="button-save-task"]').click();
      await page.reload();
      assert((await page.locator('[data-testid="weekly-timetable"]').innerText()).includes('Edited by test'), 'edit lost');
    });
    await check('Study Planner: deleting a task saves', async () => {
      const before = await page.locator('[data-testid^="task-"]').count();
      await page.locator('[data-testid^="button-delete-task-"]').first().click();
      await page.reload();
      const after = await page.locator('[data-testid^="task-"]').count();
      assert(after === before - 1, `expected ${before - 1} tasks, found ${after}`);
    });
    await check('Study Planner: data is in browser storage', async () => {
      const saved = await page.evaluate(() => localStorage.getItem('ai-exam-survival:study-planner:v1'));
      assert(saved && JSON.parse(saved).tasks.length > 0, 'nothing saved');
    });
    await context.close();
  }

  // ---------- Quiz Center ----------
  {
    const { context, page } = await newPage(browser, VIEWPORTS['tablet-portrait']);
    const answerAll = async (answer) => {
      for (let i = 0; i < 5; i += 1) {
        if (answer) await page.locator('[data-testid="button-quiz-answer-A"]').click();
        if (i < 4) await page.locator('[data-testid="button-quiz-next"]').click();
      }
      await page.locator('[data-testid="button-submit-quiz"]').click();
    };
    await check('Quiz Center: finishing with unanswered questions is blocked', async () => {
      await page.goto(BASE + '/quiz-center');
      await page.locator('[data-testid="button-start-quiz"]').click();
      await answerAll(false);
      assert(await page.locator('[data-testid="quiz-notice-error"]').isVisible(), 'no warning shown');
    });
    await check('Quiz Center: a 5-question quiz can be finished and scored', async () => {
      await page.locator('[data-testid="button-new-quiz"]').click().catch(() => {});
      await page.goto(BASE + '/quiz-center');
      await page.locator('[data-testid="button-start-quiz"]').click();
      await answerAll(true);
      const text = await page.locator('body').innerText();
      assert(/\d\/5/.test(text), 'no score shown');
      assert((await page.locator('[data-testid="quiz-review-question"]').count()) === 5, 'review missing');
    });
    await check('Quiz Center: quiz history is saved after refresh', async () => {
      await page.reload();
      const n = await page.locator('[data-testid="quiz-attempt"]').count();
      assert(n === 1, `expected 1 saved attempt, found ${n}`);
    });
    await check('Quiz Center: another subject and 10 questions work', async () => {
      await page.locator('[data-testid="select-quiz-subject"]').selectOption('Biology');
      await page.locator('[data-testid="radio-quiz-count-10"]').check({ force: true });
      await page.locator('[data-testid="button-start-quiz"]').click();
      const max = await page.locator('[data-testid="quiz-progress"]').getAttribute('aria-valuemax');
      assert(max === '10', `progress bar max is ${max}`);
      assert((await page.locator('main').innerText()).includes('Question 1 of 10'), 'no "Question 1 of 10"');
      assert((await page.locator('main').innerText()).includes('Biology'), 'subject is not Biology');
    });
    await context.close();
  }

  // ---------- Errors in the browser console ----------
  {
    currentErrors = [];
    const { context, page } = await newPage(browser, VIEWPORTS['tablet-portrait']);
    for (const p of ['/', ...TOOLS.map((t) => t.path)]) {
      await page.goto(BASE + p);
      await page.waitForTimeout(300);
    }
    await check('no JavaScript errors on any page', async () => {
      assert(currentErrors.length === 0, currentErrors.slice(0, 3).join(' | '));
    });
    await context.close();
  }

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== ${LABEL}: ${results.length - failed.length}/${results.length} passed ===`);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
  process.exit(failed.length ? 1 : 0);
})();
