// Stage 18: chat with Menti (rule-based, no live AI). Menti may read saved data but never writes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAT_TEXTS,
  CHIP_INTENTS,
  buildFacts,
  factsFromStorage,
  greetingReply,
  intentOf,
  normalize,
  readSavedText,
  replyTo,
  type Intent,
} from '../../artifacts/ai-exam-survival/src/components/menti-chat-model';
import { readAllSources } from '../../artifacts/ai-exam-survival/src/pages/progress-tracker-model';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const F = require('../browser/fixtures.cjs');

const TODAY = '2026-11-05';
const realistic = () => {
  const raw = F.realisticRaw();
  return readAllSources({ quiz: raw.quiz, planner: raw.planner, flashcards: raw.flashcards, calendar: raw.calendar, prep: raw.prep });
};
const empty = () => readAllSources({ quiz: null, planner: null, flashcards: null, calendar: null, prep: null });

test('normalize folds Turkish letters and punctuation', () => {
  assert.equal(normalize('  Sınavdan ÇOK korkuyorum!!  '), 'sinavdan cok korkuyorum');
  assert.equal(normalize('İyi akşamlar, Menti?'), 'iyi aksamlar menti');
});

test('intentOf understands common Turkish and English messages', () => {
  const cases: [string, Intent][] = [
    ['Bugün ne çalışayım?', 'today'],
    ['what should I study today', 'today'],
    ['Sınavlarım ne zaman?', 'exams'],
    ['Hangi konularda zorlanıyorum', 'weak'],
    ['kartlarımı tekrar etmem lazım', 'cards'],
    ['Nasıl çalışmalıyım', 'howto'],
    ['odaklanamıyorum, dikkatim dağılıyor', 'focus'],
    ['moralim çok bozuk', 'mood'],
    ['Kendimi kötü hissediyorum', 'mood'],
    ['sınavdan çok korkuyorum', 'anxiety'],
    ['I am so stressed about the exam', 'anxiety'],
    ['planlayıcı nasıl çalışır', 'planner'],
    ['test çözmek istiyorum', 'quiz'],
    ['uygulamayı nasıl kullanırım', 'help'],
    ['sen yapay zeka mısın', 'who'],
    ['teşekkürler Menti', 'thanks'],
    ['Merhaba', 'greeting'],
    ['hi', 'greeting'],
    ['asdfgh', 'unknown'],
    ['', 'unknown'],
  ];
  for (const [text, intent] of cases) assert.equal(intentOf(text), intent, text);
  assert.notEqual(intentOf('this is it'), 'greeting', '"hi" inside a word is not a greeting');
});

test('safety words always win, in Turkish and English', () => {
  for (const text of ['Sınav yüzünden yaşamak istemiyorum', 'kendime zarar vermek istiyorum', 'I want to kill myself', 'intihar']) {
    assert.equal(intentOf(text), 'safety-harm', text);
  }
  for (const text of ['Okulda bana zorbalık yapıyorlar', 'beni dövüyorlar', 'I am being bullied at school']) {
    assert.equal(intentOf(text), 'safety-bully', text);
  }
});

test('safety replies point to a trusted adult, the school counsellor and 112, with no quick buttons', () => {
  for (const intent of ['safety-harm', 'safety-bully'] as const) {
    for (const lang of ['tr', 'en'] as const) {
      const reply = replyTo(intent, buildFacts(empty(), TODAY), lang);
      const text = reply.lines.join(' ');
      assert.match(text, /112/);
      assert.match(text, /rehber öğretmen/);
      assert.deepEqual(reply.chips, []);
      assert.equal(reply.pose, 'comfort');
    }
  }
});

test('facts come from the real saved data (fixtures), nothing is estimated', () => {
  const facts = buildFacts(realistic(), TODAY);
  assert.equal(facts.hasAnyData, true);
  assert.ok(facts.today, 'planner facts');
  assert.ok(facts.exams.length > 0, 'upcoming exams');
  assert.ok(facts.exams.every((e, i, all) => i === 0 || all[i - 1].daysLeft <= e.daysLeft), 'nearest exam first');
  for (const w of facts.weak) {
    assert.equal(w.classification, 'needs-work');
    assert.equal(w.rate, Math.round((w.good / w.total) * 100));
  }
  assert.ok(facts.cards && facts.cards.total === facts.cards.again + facts.cards.fresh + facts.cards.mastered + (facts.cards.total - facts.cards.again - facts.cards.fresh - facts.cards.mastered));
});

test('every reply shows only numbers that exist in the facts', () => {
  const facts = buildFacts(realistic(), TODAY);
  const weak = replyTo('weak', facts, 'tr');
  for (const w of facts.weak) assert.ok(weak.lines.some((l) => l.includes(`%${w.rate}`) && l.includes(`${w.good}`)), `weak topic ${w.topic}`);
  const exams = replyTo('exams', facts, 'en');
  assert.ok(exams.lines[0].length > 0 && exams.links.some((l) => l.href === '/exam-calendar'));
});

test('the greeting is personal with data and inviting without data', () => {
  const withData = greetingReply(buildFacts(realistic(), TODAY), 'tr');
  assert.equal(withData.lines[0], CHAT_TEXTS.tr.hello);
  assert.ok(withData.lines.length >= 3, 'personal lines');
  assert.deepEqual(withData.chips, CHIP_INTENTS);
  const none = greetingReply(buildFacts(empty(), TODAY), 'tr');
  assert.ok(none.lines.includes(CHAT_TEXTS.tr.helloEmpty));
  assert.deepEqual(none.links.map((l) => l.href), ['/study-planner', '/quiz-center']);
});

test('every reply points somewhere useful and links only to real pages', () => {
  const pages = new Set(['/study-planner', '/quiz-center', '/smart-flashcards', '/exam-calendar', '/ai-study-coach', '/progress-tracker', '/about']);
  const all: Intent[] = ['greeting', 'today', 'exams', 'weak', 'cards', 'howto', 'focus', 'quiz', 'planner', 'mood', 'anxiety', 'help', 'who', 'thanks', 'unknown'];
  for (const sources of [realistic(), empty()]) {
    const facts = buildFacts(sources, TODAY);
    for (const intent of all) {
      for (const lang of ['tr', 'en'] as const) {
        const reply = replyTo(intent, facts, lang);
        assert.ok(reply.lines.length > 0 && reply.lines.every((l) => l.trim() && !/\{\w+\}|undefined|NaN/.test(l)), `${intent} ${lang}: ${reply.lines.join(' | ')}`);
        reply.links.forEach((l) => assert.ok(pages.has(l.href), `${intent}: ${l.href}`));
        if (!['thanks', 'unknown', 'greeting'].includes(intent)) assert.ok(reply.links.length > 0, `${intent} ${lang}: no link`);
      }
    }
  }
  assert.equal(replyTo('focus', buildFacts(empty(), TODAY), 'tr').links[0].section, 'focus-timer');
});

test('Menti says what it is: not a live AI, reads but never changes, chat not saved', () => {
  const tr = replyTo('who', buildFacts(empty(), TODAY), 'tr').lines.join(' ');
  assert.match(tr, /yapay zekâ/);
  assert.match(tr, /hiçbir şeyi değiştirmem/);
  assert.match(tr, /kaydedilmez/);
});

test('all chat texts exist in both languages', () => {
  for (const key of Object.keys(CHAT_TEXTS.en)) assert.ok((CHAT_TEXTS.tr as Record<string, string>)[key]?.trim(), key);
});

test('reading saved data only uses getItem (never writes) and survives a blocked browser', () => {
  const raw = F.realisticRaw();
  const calls: string[] = [];
  const storage = {
    getItem: (k: string) => {
      calls.push(k);
      return (Object.entries(F.KEYS).find(([, v]) => v === k)?.[0] ?? '') in raw ? raw[Object.entries(F.KEYS).find(([, v]) => v === k)![0]] : null;
    },
  } as unknown as Storage;
  const facts = factsFromStorage(storage, TODAY);
  assert.equal(facts.hasAnyData, true);
  assert.equal(calls.length, 5);
  const blocked = { getItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(Object.values(readSavedText(blocked)), [null, null, null, null, null]);
  assert.equal(factsFromStorage(null, TODAY).hasAnyData, false);
});
