// Browser tests for Smart Flashcards (Stage 2).
// Usage: node stage02-flashcards-test.cjs <baseUrl>
const { chromium } = require('playwright');

const BASE = process.argv[2] || 'http://127.0.0.1:4175';
const PAGE = BASE + '/smart-flashcards';
const KEY = 'ai-exam-survival:flashcards:v1';
const results = [];
let errors = [];

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

async function fresh(browser, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    const fromFonts = /fonts\.(googleapis|gstatic)\.com/.test(m.location()?.url || '');
    if (m.type() === 'error' && !fromFonts) errors.push(`console: ${m.text()}`);
  });
  await page.goto(PAGE);
  return { context, page };
}

const t = (page, id) => page.locator(`[data-testid="${id}"]`);
const text = async (page, id) => (await t(page, id).innerText()).trim();
const frontText = async (page) => (await t(page, 'flashcard-front').innerText()).split('\n').map((s) => s.trim()).filter(Boolean)[1];
const count = async (page, status) => Number((await text(page, `count-${status}`)).match(/\d+/)[0]);
const saved = (page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)), KEY);

async function createDeck(page, name, grade, subject) {
  await t(page, 'button-new-deck').click();
  await t(page, 'input-deck-name').fill(name);
  await t(page, 'select-deck-grade').selectOption(grade);
  await t(page, 'select-deck-subject').selectOption(subject);
  await t(page, 'button-save-deck').click();
}
async function addCard(page, front, answer, explanation = '') {
  await t(page, 'new-card-front').fill(front);
  await t(page, 'new-card-answer').fill(answer);
  await t(page, 'new-card-explanation').fill(explanation);
  await t(page, 'new-card-save').click();
}

(async () => {
  const browser = await chromium.launch();
  const tablet = { width: 800, height: 1280 };
  const phone = { width: 390, height: 844 };
  const landscape = { width: 1280, height: 800 };

  // ---------- first visit, flipping, navigation, shuffle ----------
  {
    const { context, page } = await fresh(browser, tablet);
    await check('first visit: 5 starter decks, first deck open at card 1 of 10', async () => {
      assert((await page.locator('[data-testid^="deck-starter-"]').count()) === 5, 'not 5 starter decks');
      assert((await text(page, 'text-card-position')) === 'Card 1 of 10', await text(page, 'text-card-position'));
      assert((await frontText(page)) === 'analyze', `front is "${await frontText(page)}"`);
      const data = await saved(page);
      assert(data && data.decks.length === 5 && data.cards.length === 50, 'starter decks not saved');
    });
    await check('starter decks cover English, Biology and Mathematics', async () => {
      const list = await text(page, 'deck-list');
      for (const s of ['English', 'Biology', 'Mathematics']) assert(list.includes(s), `no ${s} deck`);
    });
    await check('flip shows the answer with a 3D turn, and flips back', async () => {
      const flip = t(page, 'button-flashcard-flip');
      await flip.click();
      await page.waitForTimeout(650);
      assert((await flip.getAttribute('aria-pressed')) === 'true', 'not flipped');
      assert((await t(page, 'flashcard-back').getAttribute('aria-hidden')) === 'false', 'back still hidden');
      const transform = await page.evaluate(() => getComputedStyle(document.querySelector('[data-testid="button-flashcard-flip"] > span')).transform);
      assert(transform !== 'none', 'no rotation applied');
      assert((await t(page, 'flashcard-back').innerText()).includes('examine something in detail'), 'answer text missing');
      await flip.click();
      assert((await flip.getAttribute('aria-pressed')) === 'false', 'did not flip back');
    });
    await check('Next and Previous move between cards and wrap in Learn', async () => {
      await t(page, 'button-flashcard-next').click();
      assert((await text(page, 'text-card-position')) === 'Card 2 of 10', 'next failed');
      assert((await frontText(page)) === 'evidence', 'wrong card 2');
      await t(page, 'button-flashcard-previous').click();
      await t(page, 'button-flashcard-previous').click();
      assert((await text(page, 'text-card-position')) === 'Card 10 of 10', 'previous did not wrap');
      await t(page, 'button-flashcard-next').click();
      assert((await text(page, 'text-card-position')) === 'Card 1 of 10', 'next did not wrap');
    });
    await check('moving to another card turns it back to the front', async () => {
      await t(page, 'button-flashcard-flip').click();
      await t(page, 'button-flashcard-next').click();
      assert((await t(page, 'button-flashcard-flip').getAttribute('aria-pressed')) === 'false', 'new card shown flipped');
      await t(page, 'button-flashcard-previous').click();
    });
    await check('Shuffle changes the order but keeps all 10 cards', async () => {
      const readOrder = async () => {
        const seen = [];
        for (let i = 0; i < 10; i += 1) {
          seen.push(await frontText(page));
          await t(page, 'button-flashcard-next').click();
        }
        return seen;
      };
      const before = await readOrder();
      let after = before;
      for (let attempt = 0; attempt < 3 && after.join() === before.join(); attempt += 1) {
        await t(page, 'button-shuffle').click();
        assert((await text(page, 'text-card-position')) === 'Card 1 of 10', 'shuffle did not restart');
        after = await readOrder();
      }
      assert(after.join() !== before.join(), 'order did not change');
      assert([...after].sort().join() === [...before].sort().join(), 'cards lost or duplicated');
    });
    await context.close();
  }

  // ---------- marking and saving ----------
  {
    const { context, page } = await fresh(browser, tablet);
    await check('Learn: "I Know This" and "Review Again" update progress and move on', async () => {
      await t(page, 'button-mark-know').click();
      assert((await text(page, 'text-card-position')) === 'Card 2 of 10', 'did not advance');
      await t(page, 'button-mark-again').click();
      assert((await count(page, 'learning')) === 1, 'learning count');
      assert((await count(page, 'again')) === 1, 'review-again count');
      assert((await count(page, 'new')) === 8, 'new count');
    });
    await check('progress survives a page refresh', async () => {
      await page.reload();
      assert((await count(page, 'learning')) === 1 && (await count(page, 'again')) === 1, 'progress lost');
      const tile = await t(page, 'deck-starter-english-9-academic-vocabulary').innerText();
      assert(tile.includes('1 to review'), 'deck tile not updated');
    });
    await check('knowing a card twice makes it Mastered', async () => {
      await t(page, 'button-mark-know').click(); // card 1 again: learning -> mastered
      assert((await count(page, 'mastered')) === 1, `mastered=${await count(page, 'mastered')}`);
    });
    await check('Practice: must flip before marking; round ends with a summary', async () => {
      await t(page, 'tab-mode-practice').click();
      assert(await t(page, 'button-mark-know').isDisabled(), 'mark enabled before flip');
      assert(await t(page, 'text-flip-first').isVisible(), 'no flip hint');
      for (let i = 0; i < 10; i += 1) {
        await t(page, 'button-flashcard-flip').click();
        await t(page, i % 2 === 0 ? 'button-mark-know' : 'button-mark-again').click();
      }
      const summary = await text(page, 'session-summary');
      assert(summary.includes('5 known · 5 to review'), summary.replace(/\n/g, ' '));
    });
    await check('Reset deck progress asks first, then resets', async () => {
      await t(page, 'button-reset-progress').click();
      await t(page, 'confirm-reset-yes').click();
      assert((await count(page, 'new')) === 10, 'not reset');
      await page.reload();
      assert((await count(page, 'new')) === 10, 'reset not saved');
    });
    await context.close();
  }

  // ---------- Review mode frequency ----------
  {
    const { context, page } = await fresh(browser, tablet);
    await check('Review shows "Review Again" cards more often and rests mastered cards', async () => {
      await createDeck(page, 'Review test', '10', 'Physics');
      await addCard(page, 'Card A', 'answer A');
      await addCard(page, 'Card B', 'answer B');
      await addCard(page, 'Card C', 'answer C');
      // Learn: A -> again, B -> know (learning), C -> know, then C know again (mastered)
      await t(page, 'button-mark-again').click();
      await t(page, 'button-mark-know').click();
      await t(page, 'button-mark-know').click();
      await t(page, 'button-flashcard-previous').click();
      await t(page, 'button-mark-know').click();
      assert((await count(page, 'mastered')) === 1 && (await count(page, 'again')) === 1, 'setup marks wrong');
      await t(page, 'tab-mode-review').click();
      assert((await text(page, 'text-card-position')) === 'Card 1 of 4', `queue is ${await text(page, 'text-card-position')}`);
      const seen = [];
      let previous = null;
      for (let i = 0; i < 4; i += 1) {
        const f = await frontText(page);
        // (A appears 3 times among 4 cards, so one back-to-back repeat cannot be avoided here.)
        previous = f;
        seen.push(f);
        await t(page, 'button-flashcard-flip').click();
        await t(page, 'button-mark-know').click();
      }
      const n = (x) => seen.filter((s) => s === x).length;
      assert(n('Card A') === 3, `A appeared ${n('Card A')} times`);
      assert(n('Card B') === 1, `B appeared ${n('Card B')} times`);
      assert(n('Card C') === 0, 'mastered card C appeared');
      assert(await t(page, 'session-summary').isVisible(), 'no summary');
    });
    await check('Review: "Review Again" brings the card back later in the same round', async () => {
      await t(page, 'button-reset-progress').click();
      await t(page, 'confirm-reset-yes').click();
      await t(page, 'tab-mode-review').click();
      assert((await text(page, 'text-card-position')) === 'Card 1 of 3', 'new cards should appear once each');
      const firstFront = await frontText(page);
      await t(page, 'button-flashcard-flip').click();
      await t(page, 'button-mark-again').click();
      assert((await text(page, 'text-card-position')) === 'Card 2 of 4', `after again: ${await text(page, 'text-card-position')}`);
      await t(page, 'button-flashcard-next').click();
      await t(page, 'button-flashcard-next').click();
      assert((await frontText(page)) === firstFront, 'missed card did not come back');
    });
    await check('Review with everything mastered says there is nothing to review', async () => {
      await t(page, 'tab-mode-learn').click();
      for (let lap = 0; lap < 2; lap += 1) for (let i = 0; i < 3; i += 1) await t(page, 'button-mark-know').click();
      await t(page, 'tab-mode-review').click();
      assert(await t(page, 'review-nothing').isVisible(), 'no empty-review message');
    });
    await context.close();
  }

  // ---------- creating, editing, deleting ----------
  for (const [vpName, vp] of [['tablet', tablet], ['phone', phone]]) {
    const { context, page } = await fresh(browser, vp);
    await check(`[${vpName}] create a deck for grade 12 Chemistry`, async () => {
      await createDeck(page, 'Organic basics', '12', 'Chemistry');
      assert((await page.locator('[data-testid="panel-study"] h2').innerText()) === 'Organic basics', 'deck not selected');
      assert(await t(page, 'study-no-cards').isVisible(), 'no empty-deck message');
    });
    await check(`[${vpName}] empty card is refused with a clear message`, async () => {
      await t(page, 'new-card-save').click();
      const msg = await page.locator('[data-testid="form-new-card"]').innerText();
      assert(msg.includes('Write the question or concept on the front.'), 'no error message');
      assert((await page.locator('[data-testid^="card-item-"]').count()) === 0, 'empty card was saved');
    });
    await check(`[${vpName}] add three cards`, async () => {
      await addCard(page, 'Alkane', 'A hydrocarbon with only single bonds.', 'General formula CnH2n+2.');
      await addCard(page, 'Alkene', 'A hydrocarbon with at least one C=C double bond.');
      await addCard(page, 'Functional group', 'The group of atoms that gives a compound its reactions.');
      assert((await page.locator('[data-testid^="card-item-"]').count()) === 3, 'not 3 cards');
      assert((await text(page, 'text-card-position')) === 'Card 1 of 3', 'study not updated');
    });
    await check(`[${vpName}] edit a card`, async () => {
      await page.locator('[data-testid^="button-edit-card-"]').nth(1).click();
      await t(page, 'edit-card-answer').fill('A hydrocarbon with a carbon–carbon double bond.');
      await t(page, 'edit-card-save').click();
      assert((await text(page, 'card-list')).includes('carbon–carbon double bond'), 'edit not shown');
    });
    await check(`[${vpName}] delete a card (asks first)`, async () => {
      await page.locator('[data-testid^="button-delete-card-"]').first().click();
      await t(page, 'confirm-delete-card-cancel').click();
      assert((await page.locator('[data-testid^="card-item-"]').count()) === 3, 'cancel deleted');
      await page.locator('[data-testid^="button-delete-card-"]').first().click();
      await t(page, 'confirm-delete-card-yes').click();
      assert((await page.locator('[data-testid^="card-item-"]').count()) === 2, 'not deleted');
    });
    await check(`[${vpName}] cards, edits and deletions survive a refresh`, async () => {
      await page.reload();
      assert((await page.locator('[data-testid="panel-study"] h2').innerText()) === 'Organic basics', 'deck not remembered');
      assert((await page.locator('[data-testid^="card-item-"]').count()) === 2, 'card count lost');
      assert((await text(page, 'card-list')).includes('carbon–carbon double bond'), 'edit lost');
      assert(!(await text(page, 'card-list')).includes('Alkane'), 'deleted card came back');
    });
    await check(`[${vpName}] rename the deck`, async () => {
      await t(page, 'button-edit-deck').click();
      await t(page, 'input-deck-name').fill('Organic chemistry basics');
      await t(page, 'button-save-deck').click();
      assert((await text(page, 'deck-list')).includes('Organic chemistry basics'), 'rename not shown');
    });
    await check(`[${vpName}] long words wrap and nothing runs off the screen`, async () => {
      await addCard(page, 'Pneumonoultramicroscopicsilicovolcanoconiosis'.repeat(3), 'A very long word used to test wrapping on small screens.');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(overflow <= 1, `page is ${overflow}px wider than the screen`);
    });
    await check(`[${vpName}] mark buttons and card are big enough to tap`, async () => {
      for (const id of ['button-mark-know', 'button-mark-again', 'button-flashcard-next', 'button-shuffle']) {
        const box = await t(page, id).boundingBox();
        assert(box && box.height >= 40 && box.width >= 40, `${id} is ${box && Math.round(box.width)}x${box && Math.round(box.height)}`);
      }
    });
    await check(`[${vpName}] delete the deck (asks first) and it stays deleted`, async () => {
      await t(page, 'button-delete-deck').click();
      await t(page, 'confirm-delete-deck-yes').click();
      assert(!(await text(page, 'deck-list')).includes('Organic chemistry basics'), 'deck still listed');
      await page.reload();
      assert(!(await text(page, 'deck-list')).includes('Organic chemistry basics'), 'deck came back after refresh');
    });
    await context.close();
  }

  // ---------- filters, restoring starters, damaged data, landscape ----------
  {
    const { context, page } = await fresh(browser, landscape);
    await check('grade and subject filters', async () => {
      await t(page, 'select-filter-grade').selectOption('11');
      assert((await page.locator('[data-testid^="deck-"][aria-pressed]').count()) === 1, 'grade 11 should show 1 deck');
      await t(page, 'select-filter-grade').selectOption('all');
      await t(page, 'select-filter-subject').selectOption('Biology');
      assert((await page.locator('[data-testid^="deck-"][aria-pressed]').count()) === 2, 'Biology should show 2 decks');
      await t(page, 'select-filter-grade').selectOption('12');
      assert(await t(page, 'decks-empty').isVisible(), 'no empty message');
      await t(page, 'select-filter-grade').selectOption('all');
      await t(page, 'select-filter-subject').selectOption('all');
    });
    await check('a deleted starter deck can be restored', async () => {
      await t(page, 'deck-starter-mathematics-9-algebra').click();
      await t(page, 'button-delete-deck').click();
      await t(page, 'confirm-delete-deck-yes').click();
      assert((await page.locator('[data-testid^="deck-starter-"]').count()) === 4, 'not deleted');
      await t(page, 'button-restore-starters').click();
      assert((await page.locator('[data-testid^="deck-starter-"]').count()) === 5, 'not restored');
    });
    await check('[landscape] study and progress panels sit side by side', async () => {
      const a = await t(page, 'panel-study').boundingBox();
      const b = await t(page, 'panel-progress').boundingBox();
      assert(a && b && b.x > a.x + a.width - 5, 'panels are stacked');
    });
    await check('damaged saved data is not overwritten', async () => {
      await page.evaluate((k) => localStorage.setItem(k, '{broken'), KEY);
      await page.reload();
      assert(await t(page, 'message-flashcards-storage').isVisible(), 'no warning');
      await t(page, 'button-mark-know').click();
      const raw = await page.evaluate((k) => localStorage.getItem(k), KEY);
      assert(raw === '{broken', 'damaged data was overwritten');
      await page.evaluate((k) => localStorage.removeItem(k), KEY);
    });
    await check('Study Planner and Quiz Center data are untouched by flashcards', async () => {
      const keys = await page.evaluate(() => Object.keys(localStorage).filter((k) => k !== 'ai-exam-survival:language:v1'));
      assert(keys.every((k) => !k.includes('study-planner') && !k.includes('quiz-center')), `unexpected keys: ${keys}`);
    });
    await context.close();
  }

  await check('no JavaScript errors during any flashcard test', async () => {
    assert(errors.length === 0, errors.slice(0, 3).join(' | '));
  });

  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n=== SMART FLASHCARDS: ${results.length - failed.length}/${results.length} passed ===`);
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.ok ? '' : '  -> ' + r.detail}`);
  process.exit(failed.length ? 1 : 0);
})();
