// Stage 23: install as an app (PWA) – manifest, icons, service worker build output and the pure install/update rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import { createPwaStore, serviceWorkerUrl, showInstallButton } from '../../artifacts/ai-exam-survival/src/pwa/pwa-state';
import { APP_STORAGE_KEYS } from '../../artifacts/ai-exam-survival/src/pages/about-page';
import { EN } from '../../artifacts/ai-exam-survival/src/i18n/translations-en';
import { TR } from '../../artifacts/ai-exam-survival/src/i18n/translations-tr';

const APP = path.resolve(__dirname, '../../artifacts/ai-exam-survival');
const read = (rel: string) => fs.readFileSync(path.join(APP, rel), 'utf8');
const pngSize = (rel: string) => {
  const b = fs.readFileSync(path.join(APP, rel));
  assert.equal(b.toString('ascii', 1, 4), 'PNG', `${rel} is not a PNG`);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

test('manifest: names, colours, relative addresses (works at / and /ai-exam-survival/) and icons that exist', () => {
  const m = JSON.parse(read('public/manifest.webmanifest'));
  assert.equal(m.name, 'AI Exam Survival');
  assert.equal(m.short_name, 'Exam Survival');
  assert.equal(m.display, 'standalone');
  assert.equal(m.lang, 'tr');
  assert.equal(m.theme_color, '#2f4255');
  assert.equal(m.background_color, '#f7f3ea');
  for (const key of ['id', 'start_url', 'scope']) assert.equal(m[key], './', key);
  const sizes = new Set<string>();
  for (const icon of m.icons) {
    assert.ok(!icon.src.startsWith('/'), `${icon.src} must be relative`);
    const [w, h] = pngSize(`public/${icon.src}`);
    assert.equal(`${w}x${h}`, icon.sizes, icon.src);
    sizes.add(`${icon.sizes} ${icon.purpose}`);
  }
  for (const need of ['192x192 any', '512x512 any', '192x192 maskable', '512x512 maskable']) assert.ok(sizes.has(need), need);
  assert.deepEqual(pngSize('public/icons/apple-touch-icon.png'), [180, 180]);
});

test('index.html links the manifest, the Apple icon and the theme colour through %BASE_URL%', () => {
  const html = read('index.html');
  assert.match(html, /<link rel="manifest" href="%BASE_URL%manifest\.webmanifest"/);
  assert.match(html, /<link rel="apple-touch-icon" href="%BASE_URL%icons\/apple-touch-icon\.png"/);
  assert.match(html, /<meta name="theme-color" content="#2f4255"/);
  assert.match(html, /apple-mobile-web-app-title" content="Exam Survival"/);
});

test('built sw.js: a version, every file it keeps offline exists, index.html is kept, recordings are not', () => {
  const sw = read('dist/public/sw.js');
  const version = /const VERSION = "([0-9a-f]{12})";/.exec(sw);
  assert.ok(version, 'version filled in');
  const files: string[] = JSON.parse(/const FILES = (\[.*\]);/.exec(sw)![1]);
  for (const file of files) assert.ok(fs.existsSync(path.join(APP, 'dist/public', file)), `missing ${file}`);
  for (const need of ['index.html', 'manifest.webmanifest', 'favicon.svg', 'icons/icon-512.png']) assert.ok(files.includes(need), need);
  assert.ok(files.some((f) => /^assets\/index-.*\.js$/.test(f)) && files.some((f) => /^assets\/index-.*\.css$/.test(f)), 'app code');
  assert.ok(!files.some((f) => f.startsWith('audio/') || f === 'sw.js' || f.endsWith('.map')), 'no recordings, no sw.js itself');
  assert.ok(!sw.includes('__FILES__') && !sw.includes('__VERSION__'), 'placeholders replaced');
});

test('the service worker and PWA code never touch saved data, and add no storage key', () => {
  for (const rel of ['pwa/service-worker.js', 'src/pwa/pwa.ts', 'src/pwa/pwa-state.ts', 'src/pwa/pwa-ui.tsx']) {
    const code = read(rel).replace(/^\s*(\/\/|\/\*\*).*$/gm, '');
    assert.ok(!/localStorage|sessionStorage|indexedDB/.test(code), rel);
  }
  assert.equal(APP_STORAGE_KEYS.length, 10); // Stage 24 added the guide note
  const sw = read('pwa/service-worker.js');
  assert.match(sw, /startsWith\(PREFIX\)/, 'only its own caches are removed');
});

test('install button rule and the sw.js address for both website addresses', () => {
  assert.equal(showInstallButton({ standalone: false, canInstall: true, updateReady: false }), true);
  assert.equal(showInstallButton({ standalone: true, canInstall: true, updateReady: false }), false);
  assert.equal(showInstallButton({ standalone: false, canInstall: false, updateReady: false }), false);
  assert.deepEqual(serviceWorkerUrl('/'), { url: '/sw.js', scope: '/' });
  assert.deepEqual(serviceWorkerUrl('/ai-exam-survival/'), { url: '/ai-exam-survival/sw.js', scope: '/ai-exam-survival/' });
  const store = createPwaStore({ standalone: false, canInstall: false, updateReady: false });
  let calls = 0;
  store.subscribe(() => { calls += 1; });
  store.set({ canInstall: true });
  store.set({ canInstall: true });
  store.set({ updateReady: true });
  assert.equal(calls, 2, 'listeners hear only real changes');
  assert.deepEqual(store.get(), { standalone: false, canInstall: true, updateReady: true });
});

test('texts in both languages; privacy says what is cached; never "onaylı"', () => {
  const keys = Object.keys(EN).filter((k) => k.startsWith('pwa.') || k === 'about.privacy6') as (keyof typeof EN)[];
  assert.equal(keys.length, 11);
  for (const k of keys) assert.ok(TR[k] && TR[k] !== EN[k], k);
  assert.equal(TR['pwa.install'], 'Uygulama olarak yükle');
  assert.equal(TR['pwa.updateReady'], 'Yeni sürüm hazır.');
  assert.match(TR['about.privacy6'], /önbelleğinde/);
  assert.match(TR['pwa.installApple'], /Ana Ekrana Ekle/);
  for (const k of keys) assert.ok(!/onaylı/i.test(TR[k]), k);
});
