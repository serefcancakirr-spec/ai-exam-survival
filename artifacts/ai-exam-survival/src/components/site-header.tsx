import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { scrollToSectionSoon } from '@/components/scroll-manager';
import LanguageSwitch from '@/components/language-switch';
import { useI18n } from '@/i18n/i18n';
import type { MessageKey } from '@/i18n/translations-en';

const desktopLinks = [
  { id: 'study-planner', label: 'nav.studyPlanner', href: '/study-planner' },
  { id: 'quiz-center', label: 'nav.quizCenter', href: '/quiz-center' },
  { id: 'smart-flashcards', label: 'nav.flashcardsShort', href: '/smart-flashcards' },
] satisfies Array<{ id: string; label: MessageKey; href: string }>;

const toolLinks = [
  { id: 'study-planner', label: 'nav.studyPlanner', href: '/study-planner' },
  { id: 'quiz-center', label: 'nav.quizCenter', href: '/quiz-center' },
  { id: 'smart-flashcards', label: 'nav.smartFlashcards', href: '/smart-flashcards' },
  { id: 'ai-study-coach', label: 'nav.aiStudyCoach', href: '/ai-study-coach' },
  { id: 'progress-tracker', label: 'nav.progressTracker', href: '/progress-tracker' },
  { id: 'exam-calendar', label: 'nav.examCalendar', href: '/exam-calendar' },
] satisfies Array<{ id: string; label: MessageKey; href: string }>;

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useI18n();
  const closeMenu = () => setMenuOpen(false);
  const goToAllTools = () => {
    setMenuOpen(false);
    scrollToSectionSoon('all-tools');
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8eaf2] bg-[#f8f9fc]/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[74px] max-w-[1240px] items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          onClick={closeMenu}
          aria-label={t('nav.homeAria')}
          className="flex items-center gap-3"
          data-testid="link-home"
        >
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#202c68] text-white shadow-[0_6px_16px_rgba(31,44,103,.18)]">
            <GraduationCap size={22} strokeWidth={1.8} />
          </span>
          <span className="font-display text-[17px] font-extrabold tracking-[-.055em] text-[#1b244b]">
            AI Exam<span className="text-[#5b4bd8]"> Survival</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 lg:flex"
          aria-label={t('nav.main')}
        >
          {desktopLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="whitespace-nowrap text-[13px] font-semibold text-[#626b85] transition-colors hover:text-[#4940bb]"
              data-testid={`link-nav-${item.id}`}
            >
              {t(item.label)}
            </Link>
          ))}
          <Link
            href="/#all-tools"
            onClick={goToAllTools}
            className="whitespace-nowrap text-[13px] font-semibold text-[#626b85] transition-colors hover:text-[#4940bb]"
            data-testid="link-nav-all-tools"
          >
            {t('nav.moreTools')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitch />
          <Link
            href="/#all-tools"
            onClick={goToAllTools}
            className="hidden items-center gap-2 rounded-full bg-[#5144c7] px-5 py-3 text-[13px] font-bold text-white shadow-[0_8px_18px_rgba(81,68,199,.2)] transition-all hover:-translate-y-0.5 hover:bg-[#4337b0] sm:inline-flex"
            data-testid="link-explore-tools"
          >
            {t('nav.exploreTools')} <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="grid h-11 w-11 place-items-center rounded-xl border border-[#e2e5ef] bg-white text-[#202b56] lg:hidden"
            data-testid="button-mobile-menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="border-t border-[#e8eaf2] bg-[#f8f9fc] px-5 pb-5 pt-3 lg:hidden"
          aria-label={t('nav.mobile')}
        >
          <Link
            href="/"
            onClick={closeMenu}
            className="flex min-h-12 items-center justify-between border-b border-[#e8eaf2] text-sm font-bold text-[#202b56]"
            data-testid="link-mobile-home"
          >
            {t('nav.home')} <ArrowUpRight size={16} />
          </Link>
          {toolLinks.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={closeMenu}
              className="flex min-h-12 items-center justify-between border-b border-[#e8eaf2] text-sm font-semibold text-[#35405e]"
              data-testid={`link-mobile-${item.id}`}
            >
              {t(item.label)} <ArrowUpRight size={16} />
            </Link>
          ))}
          <Link
            href="/#all-tools"
            onClick={goToAllTools}
            className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#5144c7] text-sm font-bold text-white"
            data-testid="link-mobile-explore"
          >
            {t('nav.browseAll')} <ArrowRight size={16} />
          </Link>
        </nav>
      )}
    </header>
  );
}
