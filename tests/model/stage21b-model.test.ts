// Stage 21B: English reading and listening (A1–C1), with recorded listening texts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { QUIZ_GRADES, QUIZ_QUESTION_BANK, getQuizQuestionPool, getQuizTopics } from '../../artifacts/ai-exam-survival/src/pages/quiz-question-bank';
import { ENGLISH_LEVELS } from '../../artifacts/ai-exam-survival/src/pages/quiz-bank-english';
import {
  ENGLISH_PASSAGES,
  LISTENING_SPEED,
  audioPath,
  passageIdOfQuestion,
  passageOfQuestion,
} from '../../artifacts/ai-exam-survival/src/pages/english-passages';
import { topicName, localizeQuestion } from '../../artifacts/ai-exam-survival/src/i18n/content';

const AUDIO_DIR = join(__dirname, '../../artifacts/ai-exam-survival/public/audio/en');
const TURKISH = /[çğıöşüÇĞİÖŞÜ]|\b(olur|demektir|ile|bir|ve)\b/;
const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

test('each level has 3 reading texts with 4 questions and 3 listening texts with 3 questions: 105 questions in all', () => {
  assert.equal(ENGLISH_PASSAGES.length, 30);
  assert.equal(new Set(ENGLISH_PASSAGES.map((p) => p.id)).size, 30, 'unique ids');
  for (const level of ENGLISH_LEVELS) {
    const reading = ENGLISH_PASSAGES.filter((p) => p.level === level && p.kind === 'reading');
    const listening = ENGLISH_PASSAGES.filter((p) => p.level === level && p.kind === 'listening');
    assert.deepEqual(reading.map((p) => p.questions.length), [4, 4, 4], `${level} reading`);
    assert.deepEqual(listening.map((p) => p.questions.length), [3, 3, 3], `${level} listening`);
    reading.forEach((p, i) => assert.equal(p.id, `${level.toLowerCase()}-read-${i + 1}`));
    listening.forEach((p, i) => assert.equal(p.id, `${level.toLowerCase()}-listen-${i + 1}`));
  }
  assert.equal(ENGLISH_PASSAGES.reduce((n, p) => n + p.questions.length, 0), 105);
});

test('every question has four different options and a Turkish explanation; no "all/none of the above"', () => {
  for (const passage of ENGLISH_PASSAGES) {
    for (const q of passage.questions) {
      const where = `${passage.id}: ${q.prompt}`;
      assert.equal(new Set(q.options.map((o) => o.toLowerCase())).size, 4, where);
      assert.ok(q.explanation.length > 30 && TURKISH.test(q.explanation), `Turkish explanation: ${where}`);
      assert.ok(!/all of the above|none of the above|hepsi|hiçbiri/i.test(q.options.join(' ')), where);
    }
    const prompts = passage.questions.map((q) => q.prompt);
    assert.equal(new Set(prompts).size, prompts.length, `${passage.id}: repeated question`);
  }
});

test('texts get longer from A1 to C1; listening is slow and clear at A1 and natural at C1', () => {
  const average = (level: string, kind: string) => {
    const list = ENGLISH_PASSAGES.filter((p) => p.level === level && p.kind === kind);
    return list.reduce((n, p) => n + words(p.lines.map((l) => l.text).join(' ')), 0) / list.length;
  };
  for (const kind of ['reading', 'listening']) {
    const values = ENGLISH_LEVELS.map((level) => average(level, kind));
    for (let i = 1; i < values.length - (kind === 'listening' ? 1 : 0); i += 1) {
      assert.ok(values[i] > values[i - 1], `${kind}: ${values.map(Math.round).join(' < ')}`);
    }
  }
  assert.ok(LISTENING_SPEED.A1 < LISTENING_SPEED.B1 && LISTENING_SPEED.B1 < LISTENING_SPEED.C1);
});

test('every listening line has a speaker with an age, a gender and a voice that matches the gender', () => {
  for (const passage of ENGLISH_PASSAGES.filter((p) => p.kind === 'listening')) {
    assert.ok(passage.speakers, passage.id);
    for (const line of passage.lines) {
      const speaker = passage.speakers![line.speaker!];
      assert.ok(speaker, `${passage.id}: speaker ${line.speaker}`);
      assert.match(speaker.voice, speaker.gender === 'female' ? /^[ab]f_/ : /^[ab]m_/, `${passage.id} ${line.speaker}: voice gender`);
      assert.equal(speaker.voice[0] === 'b' ? 'en-gb' : 'en-us', speaker.accent, `${passage.id} ${line.speaker}: accent`);
    }
    // two speakers in one conversation never share a voice
    const voices = Object.values(passage.speakers!).map((s) => s.voice);
    assert.equal(new Set(voices).size, voices.length, `${passage.id}: same voice twice`);
  }
});

test('every listening text has its recording (a small MP3 file) and there are no extra files', () => {
  const listening = ENGLISH_PASSAGES.filter((p) => p.kind === 'listening').map((p) => `${p.id}.mp3`).sort();
  assert.deepEqual(readdirSync(AUDIO_DIR).sort(), listening);
  for (const file of listening) {
    const bytes = readFileSync(join(AUDIO_DIR, file));
    const mp3 = bytes.subarray(0, 3).toString() === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0);
    assert.ok(mp3, `${file} is an MP3`);
    assert.ok(statSync(join(AUDIO_DIR, file)).size > 20_000 && statSync(join(AUDIO_DIR, file)).size < 400_000, `${file} size`);
  }
});

test('recording addresses work with both website addresses (custom domain and github.io sub-folder)', () => {
  assert.equal(audioPath('/', 'b1-listen-2'), '/audio/en/b1-listen-2.mp3');
  assert.equal(audioPath('/ai-exam-survival/', 'b1-listen-2'), '/ai-exam-survival/audio/en/b1-listen-2.mp3');
  assert.equal(audioPath('/ai-exam-survival', 'a1-listen-1'), '/ai-exam-survival/audio/en/a1-listen-1.mp3');
});

test('every grade gets the 105 questions; the text is found from the saved question id; the right answer is the first source option', () => {
  for (const grade of QUIZ_GRADES) {
    const qs = QUIZ_QUESTION_BANK.filter((q) => q.grade === grade && /· (Reading|Listening)$/.test(q.topic));
    assert.equal(qs.length, 105, `grade ${grade}`);
    for (const q of qs) {
      const passage = passageOfQuestion(JSON.parse(JSON.stringify(q)))!;
      assert.ok(passage, q.id);
      const item = passage.questions.find((x) => x.prompt === q.prompt)!;
      assert.equal(q.options.find((o) => o.id === q.correctOptionId)!.text, item.options[0], q.id);
      assert.equal(q.topic, `${passage.level} · ${passage.kind === 'reading' ? 'Reading' : 'Listening'}`);
      assert.equal(q.difficulty, ['easy', 'medium', 'hard'][Number(passage.id.split('-').pop()) - 1]);
      assert.equal(localizeQuestion(q, 'tr'), q, 'English questions stay English');
    }
    const counts = ['A', 'B', 'C', 'D'].map((id) => qs.filter((q) => q.correctOptionId === id).length);
    for (const c of counts) assert.ok(c >= 18 && c <= 35, `answer letters spread: ${counts}`);
  }
  assert.equal(passageIdOfQuestion('12-english-c1-read-3-4'), 'c1-read-3');
  assert.equal(passageIdOfQuestion('12-english-c1-7'), null, 'grammar questions have no text');
  assert.equal(passageOfQuestion({ id: '9-english-a1-listen-1-1', subject: 'Mathematics' }), null);
});

test('in a quiz, the questions of one text stay together and in order', () => {
  for (const level of ENGLISH_LEVELS) {
    for (const skill of ['Reading', 'Listening']) {
      const pool = getQuizQuestionPool('11', 'English', `${level} · ${skill}`, 'medium', level);
      assert.equal(pool.length, skill === 'Reading' ? 12 : 9);
      const order = pool.map((q) => passageIdOfQuestion(q.id));
      const blocks = order.filter((id, i) => id !== order[i - 1]);
      assert.equal(new Set(blocks).size, blocks.length, `${level} ${skill}: a text is split: ${order.join(',')}`);
      assert.equal(passageIdOfQuestion(pool[0].id), `${level.toLowerCase()}-${skill === 'Reading' ? 'read' : 'listen'}-2`, 'medium text first');
    }
  }
  assert.deepEqual(getQuizTopics('9', 'English', 'A2').slice(2), ['A2 · Reading', 'A2 · Listening']);
  assert.equal(topicName('A2 · Listening', 'tr'), 'A2 · Dinleme');
  assert.equal(topicName('C1 · Reading', 'tr'), 'C1 · Okuma');
});
