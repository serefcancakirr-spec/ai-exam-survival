// Stage 17: About and Privacy page (/about). Texts are `about.*` keys in translations-en.ts / translations-tr.ts.
// The only thing this page can change is deleting this app's saved data, and only after the student confirms.
import { useState } from 'react';
import { ArrowLeft, Info, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Menti } from '@/components/menti';
import { useI18n } from '@/i18n/i18n';
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

  const privacyPoints: MessageKey[] = ['about.privacy1', 'about.privacy2', 'about.privacy3', 'about.privacy4', 'about.privacy5'];
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
    <div className="min-h-screen bg-[#f9f8f5] text-[#324150]" data-testid="about-page">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[12px] font-bold text-[#4b5966] transition-colors hover:border-[#ced7e2] hover:text-[#4c6a8c]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> {t('common.returnHome')}
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[10px] border border-[#ddd5c6] border-l-[6px] border-l-[#5376a0] bg-[#fbf8f1] px-6 py-8 text-[#2b3a49] sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="relative flex max-w-[760px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[8px] bg-[#e8eef4] text-[#4b698c] sm:h-14 sm:w-14">
              <Info size={22} />
            </span>
            <div>
              <p className="text-[13px] font-semibold text-[#8a5a3c]">{t('about.eyebrow')}</p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[44px]">{t('about.title')}</h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#4f5a64] sm:text-[15px]">{t('about.heroText')}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Panel eyebrow={t('about.whatEyebrow')} title={t('about.whatTitle')} testId="about-what">
            <p className="text-[13px] leading-[1.75] text-[#5e6973]">{t('about.whatText')}</p>
            <div className="mt-4">
              <Menti pose="wave" size={72} message={t('about.mentiText')} testId="menti-about" />
            </div>
          </Panel>

          <Panel eyebrow={t('about.contentEyebrow')} title={t('about.contentTitle')} testId="about-content">
            <ul className="space-y-2.5">
              {contentPoints.map((key) => (
                <li key={key} className="flex gap-2.5 text-[13px] leading-[1.7] text-[#5e6973]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#54759c]" />
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
                <li key={key} className="flex gap-2.5 text-[13px] leading-[1.7] text-[#5e6973]">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#407d6b]" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[11px] font-semibold text-[#5f6870]">{t('about.updated')}</p>
          </Panel>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <Panel eyebrow={t('about.deleteEyebrow')} title={t('about.deleteTitle')} testId="about-delete" icon={<Trash2 size={18} />}>
            <p className="text-[13px] leading-[1.75] text-[#5e6973]">{t('about.deleteText')}</p>
            {deleteState === 'idle' && (
              <button
                type="button"
                onClick={() => setDeleteState('confirm')}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-5 text-[12px] font-bold text-[#8f5847] transition-colors hover:bg-[#fdf7f5]"
                data-testid="button-delete-data"
              >
                <Trash2 size={15} /> {t('about.deleteButton')}
              </button>
            )}
            {deleteState === 'confirm' && (
              <div className="mt-4 rounded-[8px] border border-[#e8cdc5] bg-[#fdf7f5] p-4" role="alertdialog" aria-labelledby="delete-question" data-testid="delete-confirm">
                <p id="delete-question" className="text-[13px] font-bold leading-relaxed text-[#7b4738]">{t('about.deleteQuestion')}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="inline-flex min-h-10 items-center rounded-[6px] bg-[#a05441] px-4 text-[12px] font-bold text-white hover:bg-[#894635]"
                    data-testid="button-delete-confirm"
                  >
                    {t('about.deleteYes')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteState('idle')}
                    className="inline-flex min-h-10 items-center rounded-[6px] border border-[#ddd5c6] bg-[#fffdf8] px-4 text-[12px] font-bold text-[#4b5966] hover:border-[#ced7e2]"
                    data-testid="button-delete-cancel"
                  >
                    {t('about.deleteNo')}
                  </button>
                </div>
              </div>
            )}
            {deleteState === 'done' && (
              <p className="mt-4 rounded-[8px] bg-[#ecf5f1] p-4 text-[13px] font-semibold leading-relaxed text-[#326c58]" role="status" data-testid="delete-done">
                {t('about.deleteDone')}
              </p>
            )}
            {deleteState === 'failed' && (
              <p className="mt-4 rounded-[8px] bg-[#fcf2ef] p-4 text-[13px] font-semibold leading-relaxed text-[#8f5847]" role="status" data-testid="delete-failed">
                {t('about.deleteFailed')}
              </p>
            )}
          </Panel>

          <Panel eyebrow={t('about.contactEyebrow')} title={t('about.contactTitle')} testId="about-contact" icon={<Mail size={18} />}>
            <p className="text-[13px] leading-[1.75] text-[#5e6973]">{t('about.contactText')}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="mt-4 inline-flex min-h-11 max-w-full items-center gap-2 break-all rounded-[6px] bg-[#54769d] px-5 text-[12px] font-bold text-white transition-colors hover:bg-[#527195]"
              data-testid="link-contact-email"
            >
              <Mail size={15} className="shrink-0" /> {CONTACT_EMAIL}
            </a>
            <p className="mt-3 text-[11px] leading-relaxed text-[#5f6870]">{t('about.contactNote')}</p>
          </Panel>
        </div>
      </main>

      <footer className="border-t border-[#e6e9ec] bg-[#f7f5f1]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#5f6870]">{t('about.footer')}</p>
          <Link href="/" className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#516986] hover:text-[#3e5977]" data-testid="link-footer-home">
            <ArrowLeft size={13} /> {t('common.returnHome')}
          </Link>
        </div>
      </footer>
    </div>
  );
}

function Panel({ eyebrow, title, children, testId, icon }: { eyebrow: string; title: string; children: React.ReactNode; testId: string; icon?: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-[10px] border border-[#ddd5c6] bg-[#fffdf8] p-5 sm:p-6" data-testid={testId}>
      <div className="flex items-start gap-3">
        {icon && <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-[#f4f7fa] text-[#4b698c]">{icon}</span>}
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-[#4b698c]">{eyebrow}</p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.015em] text-[#364656] sm:text-[22px]">{title}</h2>
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
      <Link href="/about" className="font-bold text-[#516986] underline-offset-2 hover:underline" data-testid="link-footer-about">
        {t('about.footerLink')}
      </Link>
    </>
  );
}
