// Stage 23: registers sw.js (only in the built site) and keeps the install / update state.
import { useSyncExternalStore } from 'react';
import { createPwaStore, serviceWorkerUrl, type InstallPromptEvent } from './pwa-state';

function isStandalone() {
  try {
    return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  } catch {
    return false;
  }
}

export const pwaStore = createPwaStore({ standalone: false, canInstall: false, updateReady: false });

let installEvent: InstallPromptEvent | null = null;
let waitingWorker: ServiceWorker | null = null;
let reloadOnChange = false;

export function usePwa() {
  return useSyncExternalStore(pwaStore.subscribe, pwaStore.get, pwaStore.get);
}

/** Opens the browser's own install question. */
export async function installApp() {
  const event = installEvent;
  if (!event) return;
  installEvent = null;
  pwaStore.set({ canInstall: false });
  try {
    await event.prompt();
    await event.userChoice;
  } catch {
    /* the browser refused; nothing to do */
  }
}

/** Switches to the new version and reloads the page (saved data stays: it is in localStorage, not in the cache). */
export function applyUpdate() {
  if (!waitingWorker) {
    window.location.reload();
    return;
  }
  reloadOnChange = true;
  waitingWorker.postMessage({ type: 'SKIP_WAITING' });
}

function watchForWaiting(registration: ServiceWorkerRegistration) {
  const mark = (worker: ServiceWorker | null) => {
    // Only an update waits: a first install has no page controlled by an older version.
    if (worker && navigator.serviceWorker.controller) {
      waitingWorker = worker;
      pwaStore.set({ updateReady: true });
    }
  };
  if (registration.waiting) mark(registration.waiting);
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    worker?.addEventListener('statechange', () => {
      if (worker.state === 'installed') mark(worker);
    });
  });
}

export function startPwa() {
  if (typeof window === 'undefined') return;
  pwaStore.set({ standalone: isStandalone() });
  try {
    window.matchMedia('(display-mode: standalone)').addEventListener('change', () => pwaStore.set({ standalone: isStandalone() }));
  } catch {
    /* old browser */
  }
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installEvent = event as InstallPromptEvent;
    pwaStore.set({ canInstall: true });
  });
  window.addEventListener('appinstalled', () => {
    installEvent = null;
    pwaStore.set({ canInstall: false });
  });

  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadOnChange) window.location.reload();
  });
  const { url, scope } = serviceWorkerUrl(import.meta.env.BASE_URL);
  const register = () => {
    navigator.serviceWorker.register(url, { scope }).then((registration) => {
      watchForWaiting(registration);
      // Check for a new version when the student comes back to the app.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    }).catch(() => {
      /* no service worker (private window, old browser): the site still works online */
    });
  };
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}
