// Stage 17: About and Privacy page – the "delete my data" helper and the texts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { APP_STORAGE_KEYS, CONTACT_EMAIL, deleteAppData } from '../../artifacts/ai-exam-survival/src/pages/about-page';
import { EN } from '../../artifacts/ai-exam-survival/src/i18n/translations-en';
import { TR } from '../../artifacts/ai-exam-survival/src/i18n/translations-tr';

const SRC = join(__dirname, '../../artifacts/ai-exam-survival/src');
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

test('the delete list contains exactly the keys the app saves (so nothing is forgotten)', () => {
  const used = new Set(files(SRC).flatMap((f) => readFileSync(f, 'utf8').match(/ai-exam-survival:[a-z-]+:v1/g) ?? []));
  assert.deepEqual([...used].sort(), [...APP_STORAGE_KEYS].sort());
});

test('deleteAppData removes only this app’s keys and reports a blocked browser', () => {
  const store = new Map<string, string>([...APP_STORAGE_KEYS.map((k) => [k, '{}'] as [string, string]), ['other-site:key', 'keep']]);
  const storage = { removeItem: (k: string) => void store.delete(k) };
  assert.equal(deleteAppData(storage), true);
  assert.deepEqual([...store.keys()], ['other-site:key']);
  const blocked = { removeItem: () => { throw new Error('SecurityError'); } };
  assert.equal(deleteAppData(blocked), false);
});

test('every about text exists in Turkish and English; the page never claims MEB approval', () => {
  const keys = Object.keys(EN).filter((k) => k.startsWith('about.'));
  assert.ok(keys.length >= 30);
  for (const k of keys) assert.ok((TR as Record<string, string>)[k]?.trim(), `TR ${k}`);
  assert.match(TR['about.content1'], /onaylanmış değildir/);
  assert.match(EN['about.content1'], /not approved by MEB/);
  for (const k of keys) assert.doesNotMatch((TR as Record<string, string>)[k], /MEB onaylı/i, k);
  assert.equal(CONTACT_EMAIL, 'aiexamsurvival@gmail.com');
});
