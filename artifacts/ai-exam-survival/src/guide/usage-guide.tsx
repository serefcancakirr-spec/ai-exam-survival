// Stage 24: the "Nasıl kullanılır?" guide window and its start buttons. Texts and rules in guide-model.ts.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { MentiArt } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';
import { GUIDE_STEPS, GUIDE_TEXTS, markGuideSeen, shouldAutoOpen } from './guide-model';

// ---------- a tiny store, so any button (home, About, Menti chat) can open the guide ----------
type GuideState = { open: boolean; step: number };
let state: GuideState = { open: false, step: 0 };
const listeners = new Set<() => void>();
function setState(next: GuideState) {
  state = next;
  listeners.forEach((listener) => listener());
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};
const getState = () => state;

/** Opens the guide at its first step. */
export function openGuide() {
  setState({ open: true, step: 0 });
}

function closeGuide() {
  try {
    markGuideSeen(window.localStorage);
  } catch {
    /* storage blocked */
  }
  setState({ open: false, step: 0 });
}

function useGuideTexts() {
  const { lang } = useI18n();
  return GUIDE_TEXTS[lang === 'en' ? 'en' : 'tr'];
}

/** "Nasıl kullanılır?" start button. */
export function GuideButton({ variant, testId }: { variant: 'hero' | 'panel'; testId: string }) {
  const T = useGuideTexts();
  const style = variant === 'hero'
    ? 'min-h-11 border border-white/30 px-4 text-[14px] text-white transition-colors hover:border-white/60'
    : 'min-h-11 border border-[#ddd5c6] bg-[#fffdf8] px-5 text-[12px] text-[#3f5d80] transition-colors hover:border-[#ced7e2]';
  return (
    <button type="button" onClick={openGuide} className={`inline-flex items-center gap-2 rounded-[6px] font-bold ${style}`} data-testid={testId}>
      <Compass size={variant === 'hero' ? 17 : 15} /> {T.open}
    </button>
  );
}

/** The guide window, mounted once in App.tsx (inside the router). Opens by itself once for a new student on the home page. */
export function UsageGuide() {
  const T = useGuideTexts();
  const { open, step } = useSyncExternalStore(subscribe, getState, getState);
  const [location, navigate] = useLocation();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    try {
      if (shouldAutoOpen(window.localStorage, location)) openGuide();
    } catch {
      /* storage blocked: do not open */
    }
    // only on the first page the student sees
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    titleRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeGuide();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step]);

  if (!open) return null;
  const current = GUIDE_STEPS[step];
  const text = T.steps[current.id];
  const last = step === GUIDE_STEPS.length - 1;
  const go = (href: string) => {
    closeGuide();
    navigate(href);
    window.scrollTo(0, 0);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-[#1f2b38]/55 sm:items-center sm:p-6" data-testid="guide-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeGuide(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        className="flex max-h-[88vh] w-full flex-col overflow-y-auto rounded-t-[10px] border border-[#ddd5c6] bg-[#fffdf8] text-[#324150] sm:max-w-[560px] sm:rounded-[10px]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
        data-testid="guide"
        data-step={current.id}
      >
        <div className="flex items-center justify-between border-b border-[#ebe4d6] px-5 py-3">
          <p className="text-[13px] font-semibold text-[#4b698c]">
            {T.dialogLabel} · <span data-testid="guide-step-count">{T.stepOf.replace('{step}', String(step + 1)).replace('{total}', String(GUIDE_STEPS.length))}</span>
          </p>
          <button type="button" onClick={closeGuide} aria-label={T.close} className="grid h-9 w-9 place-items-center rounded-[6px] text-[#4b5966] hover:bg-[#f4efe5]" data-testid="guide-close">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-4 px-5 pb-2 pt-5 sm:gap-5">
          <div className="w-[76px] shrink-0 sm:w-[96px]" aria-hidden="true">
            <MentiArt pose={current.pose} />
          </div>
          <div className="min-w-0">
            <h2 id="guide-title" ref={titleRef} tabIndex={-1} className="font-display no-mark text-[21px] font-extrabold leading-tight tracking-[-.015em] text-[#2b3a49] outline-none sm:text-[24px]" data-testid="guide-title">
              {text.title}
            </h2>
            {text.lines.map((line) => (
              <p key={line} className="mt-2.5 text-[14px] leading-[1.7] text-[#4f5a64]">{line}</p>
            ))}
            {current.href && (
              <button type="button" onClick={() => go(current.href!)} className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-[6px] border border-[#cfd9e5] bg-[#f4f7fa] px-4 text-[13px] font-bold text-[#3f5d80] hover:border-[#9fb3cb]" data-testid="guide-go">
                {T.goTool} <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-1.5" aria-hidden="true">
          {GUIDE_STEPS.map((s, i) => (
            <span key={s.id} className={`h-2 rounded-full transition-all ${i === step ? 'w-5 bg-[#54769d]' : 'w-2 bg-[#d9d1c2]'}`} />
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-5 pt-4">
          <button type="button" onClick={closeGuide} className={`min-h-10 rounded-[6px] px-3 text-[13px] font-bold text-[#5a6570] hover:text-[#324150] ${last ? 'invisible' : ''}`} data-testid="guide-skip">
            {T.skip}
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setState({ open: true, step: step - 1 })} className="inline-flex min-h-10 items-center gap-1.5 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[13px] font-bold text-[#4b5966] hover:border-[#ced7e2]" data-testid="guide-back">
                <ArrowLeft size={15} /> {T.back}
              </button>
            )}
            <button
              type="button"
              onClick={() => (last ? closeGuide() : setState({ open: true, step: step + 1 }))}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[6px] bg-[#54769d] px-5 text-[13px] font-bold text-white hover:bg-[#4b6a8e]"
              data-testid="guide-next"
            >
              {last ? T.finish : T.next} {!last && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
