// Stage 23: the service worker that lets AI Exam Survival open without internet once it has been opened.
// vite.config.ts (plugin "ai-exam-survival-pwa") fills in VERSION and FILES and writes this as sw.js.
// It stores only the site's own files (and the Google Fonts it uses) in the browser cache.
// It never reads or changes the students' saved data (localStorage).
/* eslint-disable no-restricted-globals */
const VERSION = '__VERSION__';
const FILES = __FILES__;
const PREFIX = 'ai-exam-survival-';
const APP_CACHE = `${PREFIX}app-${VERSION}`;
const AUDIO_CACHE = `${PREFIX}audio-v1`;
const FONT_CACHE = `${PREFIX}fonts-v1`;
const KEEP = [APP_CACHE, AUDIO_CACHE, FONT_CACHE];

const scope = new URL(self.registration.scope);
const SHELL = new URL('index.html', scope).href;
const urlOf = (file) => new URL(file, scope).href;

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the browser's HTTP cache, so the new version's files are really new.
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(FILES.map((file) => new Request(urlOf(file), { cache: 'reload' })))));
  // A first install takes over at once; an update waits until the student taps "Yenile" (message below).
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(PREFIX) && !KEEP.includes(name)) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'GET_VERSION' && event.ports[0]) event.ports[0].postMessage(VERSION);
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (!url.href.startsWith(scope.href)) return;
    // Pages (any address inside the site): the saved copy of index.html, so sub-pages open offline too.
    if (request.mode === 'navigate') {
      event.respondWith(fromCache(APP_CACHE, SHELL, () => fetch(request)));
      return;
    }
    if (url.pathname.startsWith(`${scope.pathname}audio/`)) {
      event.respondWith(audio(request));
      return;
    }
    const href = url.origin + url.pathname;
    if (FILES.some((file) => urlOf(file) === href)) {
      event.respondWith(fromCache(APP_CACHE, href, () => fetch(request)));
    }
    return;
  }

  // Google Fonts: the saved copy at once, refreshed in the background when online.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const saved = await cache.match(request);
      const fresh = fetch(request).then((response) => {
        if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
        return response;
      }).catch(() => saved || Response.error());
      return saved || fresh;
    })());
  }
});

async function fromCache(cacheName, key, network) {
  const saved = await caches.match(key, { cacheName });
  if (saved) return saved;
  return network();
}

// Listening recordings: saved the first time they are played, then played from the browser cache.
// Audio players ask for parts of the file (Range), so the part is cut from the saved whole file.
async function audio(request) {
  const key = request.url.split('#')[0];
  const cache = await caches.open(AUDIO_CACHE);
  let whole = await cache.match(key);
  if (!whole) {
    const response = await fetch(key);
    if (!response.ok) return response;
    await cache.put(key, response.clone());
    whole = response;
  }
  const range = request.headers.get('range');
  if (!range) return whole;
  const blob = await whole.blob();
  const match = /bytes=(\d*)-(\d*)/.exec(range);
  const start = match && match[1] ? Number(match[1]) : 0;
  const end = match && match[2] ? Math.min(Number(match[2]), blob.size - 1) : blob.size - 1;
  if (start >= blob.size || start > end) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } });
  }
  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': whole.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${start}-${end}/${blob.size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  });
}
