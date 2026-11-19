// Stage 17: About and Privacy page (/about). Texts are `about.*` keys in translations-en.ts / translations-tr.ts.
// The only thing this page can change is deleting this app's saved data, and only after the student confirms.
import { useState } from 'react';
import { ArrowLeft, Info, Mail, ShieldCheck, Smartphone, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Menti } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';
import { InstallAppHelp } from '@/pwa/pwa-ui';
import { GuideButton } from '@/guide/usage-guide';
import { GUIDE_KEY } from '@/guide/guide-model';
import type { MessageKey } from '@/i18n/translations-en';

/** Every key this app saves in the browser (see CLAUDE.md "Saved data"). */
export const APP_STORAGE_KEYS = [
  'ai-exam-survival:study-planner:v1',
  'ai-exam-survival:quiz-center:v1',
  'ai-exam-survival:flashcards:v1',
  'ai-exam-survival:exam-calendar:v1',
  'ai-exam-survival:exam-prep:v1',
  'ai-exam-survival:study-coach:v1',
  'ai-exam-survival:focus:v1',
  'ai-exam-survival:language:v1',
  'ai-exam-survival:exam-mode:v1',
  GUIDE_KEY,
] as const;

export const CONTACT_EMAIL = 'aiexamsurvival@gmail.com';

/** Removes this app's saved data from this browser. Returns false when the browser does not allow it. */
export function deleteAppData(storage: Pick<Storage, 'removeItem'>) {
  try {
    for (const key of APP_STORAGE_KEYS) storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

type DeleteState = 'idle' | 'confirm' | 'done' | 'failed';

export default function AboutPage() {
  const { t } = useI18n();
  const [deleteState, setDeleteState] = useState<DeleteState>('idle');

  const privacyPoints: MessageKey[] = ['about.privacy1', 'about.privacy2', 'about.privacy3', 'about.privacy4', 'about.privacy5', 'about.privacy6'];
  const contentPoints: MessageKey[] = ['about.content1', 'about.content2', 'about.content3'];

  function confirmDelete() {
    let ok = false;
    try {
      ok = deleteAppData(window.localStorage);
    } catch {
      ok = false;
    }
    setDeleteState(ok ? 'done' : 'failed');
  }

  return (
    <div className="min-h-screen bg-[#f4f9f8] text-[#1d4547]" data-testid="about-page">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-[10px] border border-[#dee8e5] bg-[#ffffff] px-4 text-[12px] font-bold text-[#20605c] transition-colors hover:border-[#a6e1de] hover:text-[#26726d]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {t('common.returnHome')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[16px] border border-[#dee8e5] border-l-[6px] border-l-[#2a7f7a] bg-[#f4f9f8] px-6 py-8 text-[#1a3e3f] sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative flex max-w-[760px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-[#d6f3f0] text-[#26716c] sm:h-14 sm:w-14">
              <Info size={22} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#9b5227]">{t('about.eyebrow')}</p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">{t('about.title')}</h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#4d5b61] sm:text-[15px]">{t('about.heroText')}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Panel eyebrow={t('about.whatEyebrow')} title={t('about.whatTitle')} testId="about-what">
            <p className="text-[13px] leading-[1.75] text-[#5a6b73]">{t('about.whatText')}</p>
            <div className="mt-4">
              <Menti pose="wave" size={72} message={t('about.mentiText')} testId="menti-about" />
            </div>
            <div className="mt-4">
              <GuideButton variant="panel" testId="button-open-guide-about" />
            </div>
          </Panel>

          <Panel eyebrow={t('about.contentEyebrow')} title={t('about.contentTitle')} testId="about-content">
            <ul className="space-y-2.5">
              {contentPoints.map((key) => (
                <li key={key} className="flex gap-2.5 text-[13px] leading-[1.7] text-[#5a6b73]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#2a7e79]" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>

        <div className="mt-5">
          <Panel eyebrow={t('about.privacyEyebrow')} title={t('about.privacyTitle')} testId="about-privacy" icon={<ShieldCheck size={18} />}>
            <ul className="space-y-2.5">
              {privacyPoints.map((key) => (
                <li key={key} className="flex gap-2.5 text-[13px] leading-[1.7] text-[#5a6b73]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#318159]" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] font-semibold text-[#596a72]">{t('about.updated')}</p>
          </Panel>
        </div>

        <div className="mt-5">
          <Panel eyebrow={t('pwa.installEyebrow')} title={t('pwa.installTitle')} testId="about-install" icon={<Smartphone size={18} />}>
            <InstallAppHelp />
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel eyebrow={t('about.deleteEyebrow')} title={t('about.deleteTitle')} testId="about-delete" icon={<Trash2 size={18} />}>
            <p className="text-[13px] leading-[1.75] text-[#5a6b73]">{t('about.deleteText')}</p>
            {deleteState === 'idle' && (
              <button
                type="button"
                onClick={() => setDeleteState('confirm')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#dee8e5] bg-[#ffffff] px-5 text-[12px] font-bold text-[#9d5227] transition-colors hover:bg-[#ffffff]"
                data-testid="button-delete-data"
              >
                <Trash2 size={15} /> {t('about.deleteButton')}
              </button>
            )}
            {deleteState === 'confirm' && (
              <div className="mt-4 rounded-[12px] border border-[#f0ccb7] bg-[#ffffff] p-4" role="alertdialog" aria-labelledby="delete-question" data-testid="delete-confirm">
                <p id="delete-question" className="text-[13px] font-bold leading-relaxed text-[#824521]">{t('about.deleteQuestion')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="inline-flex min-h-10 items-center rounded-[10px] bg-[#a35325] px-4 text-[12px] font-bold text-white hover:bg-[#8c461c]"
                    data-testid="button-delete-confirm"
                  >
                    {t('about.deleteYes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteState('idle')}
                    className="inline-flex min-h-10 items-center rounded-[10px] border border-[#dee8e5] bg-[#ffffff] px-4 text-[12px] font-bold text-[#20605c] hover:border-[#a6e1de]"
                    data-testid="button-delete-cancel"
                  >
                    {t('about.deleteNo')}
                  </button>
                </div>
              </div>
            )}
            {deleteState === 'done' && (
              <p className="mt-4 rounded-[12px] bg-[#e9f6f0] p-4 text-[13px] font-semibold leading-relaxed text-[#236e49]" role="status" data-testid="delete-done">
                {t('about.deleteDone')}
              </p>
            )}
            {deleteState === 'failed' && (
              <p className="mt-4 rounded-[12px] bg-[#fdf3e8] p-4 text-[13px] font-semibold leading-relaxed text-[#9d5227]" role="status" data-testid="delete-failed">
                {t('about.deleteFailed')}
              </p>
            )}
          </Panel>

          <Panel eyebrow={t('about.contactEyebrow')} title={t('about.contactTitle')} testId="about-contact" icon={<Mail size={18} />}>
            <p className="text-[13px] leading-[1.75] text-[#5a6b73]">{t('about.contactText')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-[10px] bg-[#2b807a] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#297a75]"
              data-testid="link-contact-email"
            >
              <Mail size={15} className="shrink-0" /> {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-[11px] leading-relaxed text-[#596a72]">{t('about.contactNote')}</p>
          </Panel>
        </div>
      </main>

      <footer className="border-t border-[#dbece9] bg-[#eff7f5]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#596a72]">{t('about.footer')}</p>
          <Link href="/" className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#26726d] hover:text-[#20605c]" data-testid="link-footer-home">
            <ArrowLeft size={13} /> {t('common.returnHome')}
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Panel({ eyebrow, title, children, testId, icon }: { eyebrow: string; title: string; children: React.ReactNode; testId: string; icon?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-[16px] border border-[#dee8e5] bg-[#ffffff] p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,61,58,.05),0_6px_20px_rgba(15,61,58,.06)]" data-testid={testId}>
      <div className="flex items-start gap-3">
        {icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[12px] bg-[#eafaf8] text-[#26716c]">{icon}</span>}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#26716c]">{eyebrow}</p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.015em] text-[#1f4b4c] sm:text-[22px]">{title}</h2>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Small link added to every page's footer text. */
export function FooterAboutLink() {
  const { t } = useI18n();
  return (
    <>
      {' · '}
      <Link href="/about" className="font-bold text-[#26726d] underline-offset-2 hover:underline" data-testid="link-footer-about">
        {t('about.footerLink')}
      </Link>
    </>
  );
}
