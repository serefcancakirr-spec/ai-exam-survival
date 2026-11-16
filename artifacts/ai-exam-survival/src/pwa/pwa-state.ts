// Stage 23: install-as-an-app and "new version" state, shared by the install buttons and the update notice.
// Pure parts are tested in tests/model/stage23-model.test.ts. Nothing here touches localStorage.

/** The browser's install offer (Chrome/Edge/Samsung Internet on Android, Chrome on computers). */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface PwaState {
  /** The site is open as an installed app (or iOS home-screen app). */
  standalone: boolean;
  /** The browser offers installing now. */
  canInstall: boolean;
  /** A new version is downloaded and waits for "Yenile". */
  updateReady: boolean;
}

type Listener = () => void;

export function createPwaStore(initial: PwaState) {
  let state = initial;
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(patch: Partial<PwaState>) {
      const next = { ...state, ...patch };
      if (next.standalone === state.standalone && next.canInstall === state.canInstall && next.updateReady === state.updateReady) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

/** The install button is shown only when the browser offers installing and the app is not already installed. */
export function showInstallButton(state: PwaState) {
  return state.canInstall && !state.standalone;
}

/** Address of sw.js and its scope for a build base path such as "/" or "/ai-exam-survival/". */
export function serviceWorkerUrl(base: string) {
  const scope = base.endsWith('/') ? base : `${base}/`;
  return { url: `${scope}sw.js`, scope };
}
