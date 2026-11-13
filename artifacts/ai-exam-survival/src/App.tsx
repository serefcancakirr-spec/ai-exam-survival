import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import AboutPage, { FooterAboutLink } from '@/pages/about-page';
import { MentiChat } from '@/components/menti-chat';
import SiteHeader from '@/components/site-header';
import ScrollManager from '@/components/scroll-manager';
import { Menti } from '@/components/menti';
import { dayPart, type DayPart } from '@/components/menti-moods';
import { LanguageProvider, useI18n } from '@/i18n/i18n';
import type { MessageKey } from '@/i18n/translations-en';
import {
  AiStudyCoachPage,
  ExamCalendarPage,
  ProgressTrackerPage,
  QuizCenterPage,
  SmartFlashcardsPage,
  StudyPlannerPage,
} from '@/pages/study-tool-pages';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Compass,
  GraduationCap,
  Layers3,
  MessageCircle,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import {
  Link,
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

// Stage 13: Menti greets by time of day (and is sleepy late at night).
const GREETING: Record<DayPart, MessageKey> = {
  morning: 'menti.greetMorning',
  day: 'menti.homeHello',
  evening: 'menti.greetEvening',
  night: 'menti.greetNight',
};

function Home() {
  const { t } = useI18n();
  const part = dayPart(new Date().getHours());
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f9f7f4]">
      <main id="top">
        <section className="relative isolate overflow-hidden bg-[#2f4255] text-white">
          <div className="hero-grid absolute inset-0 -z-10 opacity-50" />
          <div className="absolute -right-32 top-[-210px] -z-10 h-[600px] w-[600px] rounded-full bg-[#5376a0]/30 blur-[1px]" />
          <div className="absolute -bottom-64 left-[18%] -z-10 h-[440px] w-[440px] rounded-full bg-[#9b6440]/10 blur-[2px]" />
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:min-h-[630px] lg:grid-cols-[1.04fr_.96fr] lg:gap-10 lg:py-[78px]">
            <div className="relative z-10 max-w-[610px]">
              <div className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#e6d1c3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#9d6641]" />
                {t('home.badge')}
              </div>
              <h1 className="font-display rise-in rise-delay-1 max-w-[640px] text-[46px] font-extrabold leading-[1.03] tracking-[-.015em] sm:text-[60px] lg:text-[69px]">
                {t('home.heroTitleStart')}<span className="relative inline-block text-[#b9c9db]">{t('home.heroTitleEm')}<span className="absolute -bottom-1 left-1 h-[5px] w-[92%] rounded-full bg-[#9a6441]/80" /></span>
              </h1>
              <p className="rise-in rise-delay-2 mt-6 max-w-[480px] text-[16px] leading-[1.75] text-[#c8d0d8] sm:text-[17px]">
                {t('home.heroText')}
              </p>
              <div className="rise-in rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
                <a href="#all-tools" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#996644] px-6 text-[14px] font-extrabold text-white transition-transform hover:-translate-y-0.5" data-testid="link-start-planning">
                  {t('home.ctaNextStep')} <ArrowRight size={17} />
                </a>
                <a href="#how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-[14px] font-bold text-white/85 transition-colors hover:text-[#8c5d3d]" data-testid="link-how-it-works">
                  {t('home.ctaHow')} <ArrowDownRight size={16} />
                </a>
              </div>
              <div className="mt-10 flex items-center gap-3 text-[12px] font-medium text-[#bbc4cd]">
                <div className="flex -space-x-2">
                  {['M', 'J', 'A'].map((initial, index) => (
                    <span key={initial} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#2f4255] text-[10px] font-bold text-white ${index === 0 ? 'bg-[#59748f]' : index === 1 ? 'bg-[#905b37]' : 'bg-[#5376a0]'}`}>{initial}</span>
                  ))}
                </div>
                <span>{t('home.forGrades')}</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[530px] pb-7 pt-2 sm:py-6 lg:ml-auto">
              <div className="absolute -left-2 top-10 hidden h-20 w-20 rounded-[24px] border border-white/10 sm:block" />
              <div className="absolute -right-4 bottom-3 hidden h-28 w-28 rounded-full border border-[#bc8c6b]/20 sm:block" />
              <Menti
                pose={part === 'night' ? 'sleepy' : 'wave'}
                size={116}
                bubble="left"
                message={t(GREETING[part])}
                testId="menti-home"
                className="rise-in rise-delay-2 relative z-20 -mb-[18px] justify-start pr-1 sm:pr-4"
              />
              <div className="float-card relative z-10 rounded-[26px] border border-white/15 bg-[#fafbfd] p-4 text-[#364656] shadow-[0_30px_90px_rgba(24,35,47,.38)] sm:p-5">
                <div className="flex items-center justify-between border-b border-[#ebeef1] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#eef3f8] text-[#4c6a8c]"><NotebookPen size={19} /></div>
                    <div>
                      <p className="text-[13px] font-extrabold tracking-[-.02em]">{t('home.cardWeek')}</p>
                      <p className="mt-0.5 text-[10px] font-medium text-[#616870]">{t('home.cardWeekSub')}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#eaf3f0] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#3f7162]">{t('home.cardPreview')}</span>
                </div>
                <div className="grid grid-cols-[1fr_1.1fr] gap-3 pt-4">
                  <div className="rounded-[18px] bg-[#f7f5f1] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#5f6872]"><span>{t('home.cardThisWeek')}</span><CalendarDays size={14} /></div>
                    <div className="mt-4 grid grid-cols-5 gap-1 text-center text-[9px] font-semibold text-[#60676d]">
                      {t('home.cardDays').split(',').map((day, i) => <span key={`${day}${i}`} className="py-1">{day}</span>)}
                      {['12', '13', '14', '15', '16'].map((day, i) => <span key={day} className={`grid h-7 place-items-center rounded-full ${i === 2 ? 'bg-[#54769d] text-white' : 'text-[#555f69]'}`}>{day}</span>)}
                    </div>
                    <div className="mt-4 border-t border-[#e2e5e9] pt-3">
                      <p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#6e655a]">{t('home.cardNextUp')}</p>
                      <div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#407c6a]" /><span className="text-[10px] font-bold">{t('home.cardNextTask')}</span></div>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-[#ebeef1] bg-white p-3.5 sm:p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#5f6872]">{t('home.cardRhythm')}</span>
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#f4f7fa] text-[#4c6a8c]"><BarChart3 size={13} /></span>
                    </div>
                    <div className="mt-3 flex h-[74px] items-end gap-2 border-b border-[#eff1f3] pb-2">
                      {[33, 48, 40, 66, 53, 81, 61].map((height, i) => <span key={i} className={`w-full rounded-t-[5px] ${i === 5 ? 'bg-[#5276a0]' : i === 3 ? 'bg-[#467e6d]' : 'bg-[#e0e8f0]'}`} style={{ height: `${height}%` }} />)}
                    </div>
                    <p className="mt-2.5 text-[9px] font-medium text-[#60676d]">{t('home.cardSmall')}</p>
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#f7f9fc] px-2.5 py-2 text-[9px] font-bold text-[#506783]"><CheckCircle2 size={12} /> {t('home.cardBlocks')}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-[#394f65] px-4 py-3 text-white">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/10 text-[#895c3d]"><Sparkles size={16} /></span>
                  <p className="text-[10px] font-medium leading-relaxed text-white/80"><span className="block text-[11px] font-bold text-white">{t('home.cardNotAll')}</span>{t('home.cardOneStep')}</p>
                  <ArrowUpRight className="ml-auto text-[#cda991]" size={16} />
                </div>
              </div>
              <div className="float-card-late absolute -bottom-1 -left-3 z-20 flex items-center gap-2.5 rounded-2xl border border-[#eaedf0] bg-white px-3.5 py-3 shadow-[0_12px_35px_rgba(40,58,75,.15)] sm:-left-8">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf3f0] text-[#396f5f]"><Check size={18} strokeWidth={2.5} /></span>
                <span><span className="block text-[10px] font-bold text-[#364656]">{t('home.oneThing')}</span><span className="mt-0.5 block text-[9px] text-[#5f676d]">{t('home.yourPace')}</span></span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#839cb7]/70 to-transparent" />
        </section>

        <section className="mx-auto max-w-[1240px] px-5 pb-8 pt-10 sm:px-8 sm:pt-12">
          <div className="flex flex-col gap-5 rounded-[22px] border border-[#eaedf0] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(54,75,96,.035)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="max-w-[365px]">
              <p className="font-display text-[17px] font-extrabold tracking-[-.015em] text-[#364656]">{t('home.onePlace')}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#5f666e]">{t('home.simplerPath')}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-8">
              {[['01', t('home.step1')], ['02', t('home.step2')], ['03', t('home.step3')]].map(([num, label]) => (
                <div key={num} className="flex items-center gap-2.5">
                  <span className="font-display text-[13px] font-extrabold text-[#49698d]">{num}</span>
                  <span className="max-w-[90px] text-[10px] font-bold leading-tight text-[#5e6973] sm:text-[11px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="all-tools" className="mx-auto max-w-[1240px] px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
            <div className="max-w-[600px]">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.17em] text-[#4b698c]">{t('home.toolkitEyebrow')}</p>
              <h2 className="font-display text-[35px] font-extrabold leading-[1.08] tracking-[-.015em] text-[#364656] sm:text-[48px]">{t('home.toolkitTitleA')}<br className="hidden sm:block" />{t('home.toolkitTitleB')}</h2>
            </div>
            <p className="max-w-[330px] text-[14px] leading-[1.75] text-[#60676f]">{t('home.toolkitText')}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ToolCard id="study-planner" number="01" title={t('nav.studyPlanner')} eyebrow={t('home.plannerEyebrow')} description={t('home.plannerText')} icon={<NotebookPen size={21} />} tone="bg-[#f1f5f9] text-[#4a688c]" note={t('home.plannerNote')} />
            <ToolCard id="quiz-center" number="02" title={t('nav.quizCenter')} eyebrow={t('home.quizEyebrow')} description={t('home.quizText')} icon={<Compass size={21} />} tone="bg-[#e8f3f0] text-[#396f5f]" note={t('home.quizNote')} />
            <ToolCard id="smart-flashcards" number="03" title={t('nav.smartFlashcards')} eyebrow={t('home.flashEyebrow')} description={t('home.flashText')} icon={<Layers3 size={21} />} tone="bg-[#fbf1eb] text-[#885e44]" note={t('home.flashNote')} />
            <ToolCard id="ai-study-coach" number="04" title={t('nav.aiStudyCoach')} eyebrow={t('home.coachEyebrow')} description={t('home.coachText')} icon={<MessageCircle size={21} />} tone="bg-[#eff4f9] text-[#536980]" note={t('home.coachNote')} />
            <ToolCard id="progress-tracker" number="05" title={t('nav.progressTracker')} eyebrow={t('home.progressEyebrow')} description={t('home.progressText')} icon={<BarChart3 size={21} />} tone="bg-[#ebf5ee] text-[#486d58]" note={t('home.progressNote')} />
            <ToolCard id="exam-calendar" number="06" title={t('nav.examCalendar')} eyebrow={t('home.calendarEyebrow')} description={t('home.calendarText')} icon={<CalendarDays size={21} />} tone="bg-[#f0f4f9] text-[#546884]" note={t('home.calendarNote')} />
          </div>
        </section>

        <section id="how-it-works" className="relative bg-[#ecf0f5]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-24">
            <div>
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.17em] text-[#4b6789]">{t('home.rhythmEyebrow')}</p>
              <h2 className="font-display max-w-[470px] text-[36px] font-extrabold leading-[1.08] tracking-[-.015em] text-[#364656] sm:text-[47px]">{t('home.rhythmTitleA')}<br />{t('home.rhythmTitleB')}</h2>
              <p className="mt-5 max-w-[390px] text-[14px] leading-[1.8] text-[#5f6770]">{t('home.rhythmText')}</p>
              <a href="#all-tools" className="mt-7 inline-flex items-center gap-2 text-[13px] font-extrabold text-[#4c6a8c] transition-colors hover:text-[#456487]" data-testid="link-see-all-tools">{t('home.seeAll')} <ArrowRight size={16} /></a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: <Bookmark size={17} />, title: t('home.how1Title'), text: t('home.how1Text'), color: 'text-[#49698e] bg-[#f1f5f9]' },
                { icon: <Clock3 size={17} />, title: t('home.how2Title'), text: t('home.how2Text'), color: 'text-[#3a7160] bg-[#e6f1ee]' },
                { icon: <CheckCircle2 size={17} />, title: t('home.how3Title'), text: t('home.how3Text'), color: 'text-[#825f35] bg-[#faf2e4]' },
                { icon: <ChevronDown size={17} />, title: t('home.how4Title'), text: t('home.how4Text'), color: 'text-[#56687a] bg-[#eef3f8]' },
              ].map((step, index) => (
                <div key={step.title} className={`rounded-[19px] border border-white/80 bg-white/75 p-5 ${index === 1 ? 'sm:translate-y-5' : ''}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${step.color}`}>{step.icon}</span>
                  <h3 className="mt-4 text-[14px] font-extrabold tracking-[-.02em] text-[#3f4e5d]">{step.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-[1.65] text-[#5d676f]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-[26px] bg-[#394f65] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-12 -top-32 h-[320px] w-[320px] rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-20 h-[235px] w-[235px] rounded-full border border-[#bb8866]/20" />
            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-[560px]">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#d9bdaa]">{t('home.ctaEyebrow')}</p>
                <h2 className="font-display text-[32px] font-extrabold leading-tight tracking-[-.015em] sm:text-[40px]">{t('home.ctaTitle')}</h2>
                <p className="mt-3 max-w-[445px] text-[13px] leading-[1.75] text-[#cad3dc]">{t('home.ctaText')}</p>
              </div>
              <a href="#all-tools" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#9b6845] px-6 text-[13px] font-extrabold text-white transition-transform hover:-translate-y-0.5" data-testid="link-browse-previews">{t('home.ctaBrowse')} <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e6e9ec] bg-[#f7f5f1]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <a href="#top" className="flex items-center gap-2.5" data-testid="link-footer-home">
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#3b536c] text-white"><GraduationCap size={17} /></span>
            <span className="font-display text-[14px] font-extrabold tracking-[-.015em] text-[#314253]">AI Exam Survival</span>
          </a>
          <p className="text-[11px] leading-relaxed text-[#5f6870]">{t('home.footerText')}<FooterAboutLink /></p>
          <a href="#all-tools" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#516986] hover:text-[#3e5977]" data-testid="link-footer-tools">{t('home.footerExplore')} <ArrowUpRight size={13} /></a>
        </div>
      </footer>
    </div>
  );
}

type ToolCardProps = {
  id: string;
  number: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: ReactNode;
  tone: string;
  note: string;
};

function ToolCard({ id, number, title, eyebrow, description, icon, tone, note }: ToolCardProps) {
  const { t } = useI18n();
  return (
    <Link
      href={`/${id}`}
      aria-label={t('home.openTool', { title })}
      className="group block rounded-[21px] focus-visible:outline-none"
      data-testid={`link-tool-${id}`}
    >
      <article id={id} className="relative flex min-h-[265px] scroll-mt-24 flex-col rounded-[21px] border border-[#e7eaee] bg-white p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#d2dce7] group-hover:shadow-[0_16px_36px_rgba(59,78,97,.09)] sm:p-6">
        <div className="flex items-start justify-between">
          <span className={`grid h-11 w-11 place-items-center rounded-[15px] ${tone}`}>{icon}</span>
          <span className="font-display text-[12px] font-extrabold tracking-[.08em] text-[#68727c]">{number}</span>
        </div>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#616871]">{eyebrow}</p>
        <h3 className="mt-1.5 font-display text-[21px] font-extrabold tracking-[-.015em] text-[#384959]">{title}</h3>
        <p className="mt-2 max-w-[330px] text-[12px] leading-[1.7] text-[#5e666e]">{description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="text-[10px] font-semibold leading-relaxed text-[#60676e]">{note}</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e9ecef] text-[#576779] transition-all group-hover:border-[#dee7f1] group-hover:bg-[#f4f7fb] group-hover:text-[#4c6a8c]">
            <ArrowUpRight size={16} />
          </span>
        </div>
      </article>
    </Link>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/study-planner" component={StudyPlannerPage} />
        <Route path="/quiz-center" component={QuizCenterPage} />
        <Route path="/smart-flashcards" component={SmartFlashcardsPage} />
        <Route path="/ai-study-coach" component={AiStudyCoachPage} />
        <Route path="/progress-tracker" component={ProgressTrackerPage} />
        <Route path="/exam-calendar" component={ExamCalendarPage} />
        <Route path="/about" component={AboutPage} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ScrollManager />
          <SiteHeader />
          <Router />
          <MentiChat />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
