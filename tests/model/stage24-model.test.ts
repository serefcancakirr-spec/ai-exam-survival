// Stage 24: "Nasıl kullanılır?" guide – steps, texts, when it opens by itself and what it saves.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GUIDE_KEY, GUIDE_STEPS, GUIDE_TEXTS, guideSeen, markGuideSeen, shouldAutoOpen } from '../../artifacts/ai-exam-survival/src/guide/guide-model';
import { APP_STORAGE_KEYS, deleteAppData } from '../../artifacts/ai-exam-survival/src/pages/about-page';
import { replyTo } from '../../artifacts/ai-exam-survival/src/components/menti-chat-model';

class Store {
  data = new Map<string, string>();
  constructor(init: Record<string, string> = {}) { for (const [k, v] of Object.entries(init)) this.data.set(k, v); }
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}

const ROUTES = ['/study-planner', '/quiz-center', '/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker'];

test('7 steps: welcome first, then every tool page once', () => {
  assert.deepEqual(GUIDE_STEPS.map((s) => s.id), ['welcome', 'planner', 'quiz', 'cards', 'calendar', 'coach', 'progress']);
  assert.equal(GUIDE_STEPS[0].href, undefined);
  assert.deepEqual(GUIDE_STEPS.slice(1).map((s) => s.href), ROUTES);
  assert.equal(new Set(GUIDE_STEPS.map((s) => s.pose)).size, 7, 'a different Menti pose on every step');
});

test('texts: every step in Turkish and English with a title and two sentences; real names; never "onaylı"', () => {
  for (const lang of ['tr', 'en'] as const) {
    const T = GUIDE_TEXTS[lang];
    for (const step of GUIDE_STEPS) {
      const s = T.steps[step.id];
      assert.ok(s.title.length > 3 && s.lines.length === 2 && s.lines.every((l) => l.length > 20), `${lang} ${step.id}`);
      for (const line of [s.title, ...s.lines]) assert.ok(!/onaylı|approved/i.test(line), line);
    }
  }
  const tr = GUIDE_TEXTS.tr;
  assert.equal(tr.open, 'Nasıl kullanılır?');
  assert.deepEqual([tr.back, tr.next, tr.finish, tr.skip, tr.goTool], ['Geri', 'İleri', 'Bitir', 'Atla', 'Bu araca git']);
  assert.match(tr.steps.cards.lines[0], /Sınıfıma göre desteler/);
  assert.match(tr.steps.quiz.lines[1], /TYT, AYT ve YDT/);
  assert.match(tr.steps.coach.lines[1], /Canlı bir yapay zekâ değilim/);
  assert.match(tr.steps.welcome.lines[0], /yalnızca bu cihazda/);
});

test('opens by itself only on the home page, only for a new student who has not closed it', () => {
  assert.equal(shouldAutoOpen(new Store(), '/'), true);
  assert.equal(shouldAutoOpen(new Store({ 'ai-exam-survival:language:v1': 'en' }), '/'), true, 'a language choice alone is still new');
  assert.equal(shouldAutoOpen(new Store(), '/quiz-center'), false);
  assert.equal(shouldAutoOpen(new Store({ [GUIDE_KEY]: '{"version":1,"seen":true}' }), '/'), false);
  assert.equal(shouldAutoOpen(new Store({ [GUIDE_KEY]: 'broken' }), '/'), false);
  for (const key of APP_STORAGE_KEYS.filter((k) => k !== GUIDE_KEY && k !== 'ai-exam-survival:language:v1')) {
    assert.equal(shouldAutoOpen(new Store({ [key]: '{}' }), '/'), false, `${key} means the student is not new`);
  }
  const blocked = { getItem: () => { throw new Error('blocked'); } };
  assert.equal(shouldAutoOpen(blocked, '/'), false);
});

test('closing saves only {version: 1, seen: true}; an unreadable value is never overwritten', () => {
  const s = new Store();
  assert.equal(guideSeen(s), false);
  markGuideSeen(s);
  assert.equal(s.getItem(GUIDE_KEY), JSON.stringify({ version: 1, seen: true }));
  assert.equal(guideSeen(s), true);
  assert.equal(s.data.size, 1, 'nothing else written');
  const broken = new Store({ [GUIDE_KEY]: '{oops' });
  markGuideSeen(broken);
  assert.equal(broken.getItem(GUIDE_KEY), '{oops');
});

test('"Delete my data" also removes the guide note (10 keys)', () => {
  assert.equal(APP_STORAGE_KEYS.length, 10);
  assert.ok((APP_STORAGE_KEYS as readonly string[]).includes(GUIDE_KEY));
  const s = new Store({ [GUIDE_KEY]: '{"version":1,"seen":true}', other: 'x' });
  assert.equal(deleteAppData(s), true);
  assert.equal(s.getItem(GUIDE_KEY), null);
  assert.equal(s.getItem('other'), 'x');
});

test('Menti chat "app help" offers "Rehberi başlat" first', () => {
  const empty = { hasAnyData: false, today: null, week: null, exams: [], weak: [], strong: [], notEnoughQuizData: true, cards: null, lastQuiz: null };
  for (const [lang, label] of [['tr', 'Rehberi başlat'], ['en', 'Start the guide']] as const) {
    const reply = replyTo('help', empty, lang);
    assert.equal(reply.links[0].action, 'guide');
    assert.equal(reply.links[0].label, label);
  }
});
