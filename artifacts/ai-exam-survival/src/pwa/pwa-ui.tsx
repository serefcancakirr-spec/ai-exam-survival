// Stage 23: install button (home hero and About page) and the "new version" notice (every page).
import { Download, RefreshCw, Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n/i18n';
import { applyUpdate, installApp, usePwa } from './pwa';
import { showInstallButton } from './pwa-state';

/** Shown only when the browser offers installing and the app is not installed yet. */
export function InstallAppButton({ variant, testId }: { variant: 'hero' | 'panel'; testId: string }) {
  const { t } = useI18n();
  const state = usePwa();
  if (!showInstallButton(state)) return null;
  const style = variant === 'hero'
    ? 'min-h-11 border border-white/30 px-4 text-[14px] text-white transition-colors hover:border-white/60'
    : 'min-h-11 bg-[#54769d] px-5 text-[12px] text-white transition-colors hover:bg-[#4b6a8e]';
  return (
    <button type="button" onClick={() => void installApp()} className={`inline-flex items-center gap-2 rounded-[6px] font-bold ${style}`} data-testid={testId}>
      <Download size={variant === 'hero' ? 17 : 15} /> {t('pwa.install')}
    </button>
  );
}

/** The About page panel: how to install on Android and on iPad/iPhone. */
export function InstallAppHelp() {
  const { t } = useI18n();
  const state = usePwa();
  if (state.standalone) {
    return <p className="rounded-[8px] bg-[#ecf5f1] p-4 text-[13px] font-semibold leading-relaxed text-[#326c58]" data-testid="pwa-installed">{t('pwa.installed')}</p>;
  }
  return (
    <>
      <p className="text-[13px] leading-[1.75] text-[#5e6973]">{t('pwa.installText')}</p>
      <ul className="mt-3 space-y-2.5">
        {(['pwa.installAndroid', 'pwa.installApple'] as const).map((key) => (
          <li key={key} className="flex gap-2.5 text-[13px] leading-[1.7] text-[#5e6973]">
            <Smartphone size={15} className="mt-[3px] shrink-0 text-[#4b698c]" />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 empty:hidden">
        <InstallAppButton variant="panel" testId="button-install-app-about" />
      </div>
    </>
  );
}

/** Small notice at the bottom of every page when a new version has been downloaded. */
export function UpdateNotice() {
  const { t } = useI18n();
  const { updateReady } = usePwa();
  if (!updateReady) return null;
  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex max-w-[calc(100vw-7rem)] flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] border border-[#ddd5c6] bg-[#fffdf8] px-4 py-3 text-[#324150] shadow-sm"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      role="status"
      data-testid="pwa-update"
    >
      <p className="text-[13px] leading-snug"><span className="font-bold">{t('pwa.updateReady')}</span> {t('pwa.updateNote')}</p>
      <button type="button" onClick={applyUpdate} className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] bg-[#54769d] px-3 text-[12px] font-bold text-white hover:bg-[#4b6a8e]" data-testid="button-pwa-update">
        <RefreshCw size={14} /> {t('pwa.updateButton')}
      </button>
    </div>
  );
}
