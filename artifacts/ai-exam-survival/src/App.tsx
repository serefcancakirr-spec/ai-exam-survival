import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import SiteHeader from '@/components/site-header';
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

function Home() {
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f5f6fb]">
      <main id="top">
        <section className="relative isolate overflow-hidden bg-[#18224d] text-white">
          <div className="hero-grid absolute inset-0 -z-10 opacity-50" />
          <div className="absolute -right-32 top-[-210px] -z-10 h-[600px] w-[600px] rounded-full bg-[#5944d2]/30 blur-[1px]" />
          <div className="absolute -bottom-64 left-[18%] -z-10 h-[440px] w-[440px] rounded-full bg-[#23a9c2]/10 blur-[2px]" />
          <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-5 pb-20 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:min-h-[630px] lg:grid-cols-[1.04fr_.96fr] lg:gap-10 lg:py-[78px]">
            <div className="relative z-10 max-w-[610px]">
              <div className="rise-in mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#b8edf1]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5ae0dc]" />
                A calmer way to get exam-ready
              </div>
              <h1 className="font-display rise-in rise-delay-1 max-w-[640px] text-[46px] font-extrabold leading-[1.03] tracking-[-.065em] sm:text-[60px] lg:text-[69px]">
                Make the next exam feel <span className="relative inline-block text-[#9d95ff]">smaller.<span className="absolute -bottom-1 left-1 h-[5px] w-[92%] rounded-full bg-[#5be0dc]/80" /></span>
              </h1>
              <p className="rise-in rise-delay-2 mt-6 max-w-[480px] text-[16px] leading-[1.75] text-[#c1c8df] sm:text-[17px]">
                Six focused ways to plan, practice, and keep your head clear. Built for high school, one manageable step at a time.
              </p>
              <div className="rise-in rise-delay-2 mt-8 flex flex-wrap items-center gap-3">
                <a href="#all-tools" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-[#62d8dc] px-6 text-[14px] font-extrabold text-[#16244c] transition-transform hover:-translate-y-0.5" data-testid="link-start-planning">
                  Find your next step <ArrowRight size={17} />
                </a>
                <a href="#how-it-works" className="inline-flex min-h-12 items-center gap-2 rounded-full px-4 text-[14px] font-bold text-white/85 transition-colors hover:text-[#76e2e1]" data-testid="link-how-it-works">
                  How it works <ArrowDownRight size={16} />
                </a>
              </div>
              <div className="mt-10 flex items-center gap-3 text-[12px] font-medium text-[#b3bdd5]">
                <div className="flex -space-x-2">
                  {['M', 'J', 'A'].map((initial, index) => (
                    <span key={initial} className={`grid h-8 w-8 place-items-center rounded-full border-2 border-[#18224d] text-[10px] font-bold text-white ${index === 0 ? 'bg-[#4d62b5]' : index === 1 ? 'bg-[#13a6b4]' : 'bg-[#7966d9]'}`}>{initial}</span>
                  ))}
                </div>
                <span>For grades 9–12. Made for real school weeks.</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[530px] pb-7 pt-2 sm:py-6 lg:ml-auto">
              <div className="absolute -left-2 top-10 hidden h-20 w-20 rounded-[24px] border border-white/10 sm:block" />
              <div className="absolute -right-4 bottom-3 hidden h-28 w-28 rounded-full border border-[#65d6dc]/20 sm:block" />
              <div className="float-card relative z-10 rounded-[26px] border border-white/15 bg-[#f8f9ff] p-4 text-[#20294d] shadow-[0_30px_90px_rgba(5,10,35,.38)] sm:p-5">
                <div className="flex items-center justify-between border-b border-[#e9ebf3] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#e9e7ff] text-[#5144c7]"><NotebookPen size={19} /></div>
                    <div>
                      <p className="text-[13px] font-extrabold tracking-[-.02em]">Your study week</p>
                      <p className="mt-0.5 text-[10px] font-medium text-[#7d859b]">A little progress, every day</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-[#e5f7f5] px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-[.08em] text-[#278c8e]">Preview</span>
                </div>
                <div className="grid grid-cols-[1fr_1.1fr] gap-3 pt-4">
                  <div className="rounded-[18px] bg-[#f0f1f8] p-3.5 sm:p-4">
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#59627d]"><span>THIS WEEK</span><CalendarDays size={14} /></div>
                    <div className="mt-4 grid grid-cols-5 gap-1 text-center text-[9px] font-semibold text-[#9299ab]">
                      {['M', 'T', 'W', 'T', 'F'].map((day, i) => <span key={`${day}${i}`} className="py-1">{day}</span>)}
                      {['12', '13', '14', '15', '16'].map((day, i) => <span key={day} className={`grid h-7 place-items-center rounded-full ${i === 2 ? 'bg-[#5144c7] text-white' : 'text-[#4c5672]'}`}>{day}</span>)}
                    </div>
                    <div className="mt-4 border-t border-[#dfe2ec] pt-3">
                      <p className="text-[9px] font-bold uppercase tracking-[.08em] text-[#9399aa]">Next up</p>
                      <div className="mt-2 flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#28b4bd]" /><span className="text-[10px] font-bold">Bio · 20 min review</span></div>
                    </div>
                  </div>
                  <div className="rounded-[18px] border border-[#e9ebf3] bg-white p-3.5 sm:p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#59627d]">A good rhythm</span>
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#eff0ff] text-[#5144c7]"><BarChart3 size={13} /></span>
                    </div>
                    <div className="mt-3 flex h-[74px] items-end gap-2 border-b border-[#edf0f5] pb-2">
                      {[33, 48, 40, 66, 53, 81, 61].map((height, i) => <span key={i} className={`w-full rounded-t-[5px] ${i === 5 ? 'bg-[#5a4bd0]' : i === 3 ? 'bg-[#69d4d5]' : 'bg-[#d9daf7]'}`} style={{ height: `${height}%` }} />)}
                    </div>
                    <p className="mt-2.5 text-[9px] font-medium text-[#8a91a4]">Small sessions add up.</p>
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-[#f5f4ff] px-2.5 py-2 text-[9px] font-bold text-[#5b50bb]"><CheckCircle2 size={12} /> 3 focus blocks planned</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-[16px] bg-[#202b60] px-4 py-3 text-white">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-white/10 text-[#7de2df]"><Sparkles size={16} /></span>
                  <p className="text-[10px] font-medium leading-relaxed text-white/80"><span className="block text-[11px] font-bold text-white">You don’t have to do it all today.</span>Start with one clear next step.</p>
                  <ArrowUpRight className="ml-auto text-[#8ee4e4]" size={16} />
                </div>
              </div>
              <div className="float-card-late absolute -bottom-1 -left-3 z-20 flex items-center gap-2.5 rounded-2xl border border-[#e8eaf2] bg-white px-3.5 py-3 shadow-[0_12px_35px_rgba(19,27,66,.15)] sm:-left-8">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e5f8f7] text-[#138f9a]"><Check size={18} strokeWidth={2.5} /></span>
                <span><span className="block text-[10px] font-bold text-[#20294d]">One thing at a time</span><span className="mt-0.5 block text-[9px] text-[#838ba0]">Your pace is the right pace.</span></span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6e71cc]/70 to-transparent" />
        </section>

        <section className="mx-auto max-w-[1240px] px-5 pb-8 pt-10 sm:px-8 sm:pt-12">
          <div className="flex flex-col gap-5 rounded-[22px] border border-[#e8eaf2] bg-white px-5 py-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <div className="max-w-[365px]">
              <p className="font-display text-[17px] font-extrabold tracking-[-.04em] text-[#20294d]">One place for the parts that matter.</p>
              <p className="mt-1 text-[12px] leading-relaxed text-[#747d96]">A simpler path from “where do I start?” to “I’ve got this.”</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-8">
              {[['01', 'Get organized'], ['02', 'Practice smarter'], ['03', 'See your progress']].map(([num, label]) => (
                <div key={num} className="flex items-center gap-2.5">
                  <span className="font-display text-[13px] font-extrabold text-[#6557d1]">{num}</span>
                  <span className="max-w-[90px] text-[10px] font-bold leading-tight text-[#56607b] sm:text-[11px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="all-tools" className="mx-auto max-w-[1240px] px-5 pb-20 pt-20 sm:px-8 sm:pb-28 sm:pt-28">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-12 md:flex-row md:items-end">
            <div className="max-w-[600px]">
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.17em] text-[#5a4bc9]">Your toolkit, without the noise</p>
              <h2 className="font-display text-[35px] font-extrabold leading-[1.08] tracking-[-.06em] text-[#20294d] sm:text-[48px]">Six small ways to<br className="hidden sm:block" /> make a big difference.</h2>
            </div>
            <p className="max-w-[330px] text-[14px] leading-[1.75] text-[#707992]">Pick what helps today. Each tool is a focused preview of a calmer study routine—not another portal to keep up with.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ToolCard id="study-planner" number="01" title="Study Planner" eyebrow="Make a plan that fits" description="Turn a packed week into short, doable study blocks—with breathing room built in." icon={<NotebookPen size={21} />} tone="bg-[#eeebff] text-[#5d4fce]" note="Less cramming. More steady progress." />
            <ToolCard id="quiz-center" number="02" title="Quiz Center" eyebrow="Practice with purpose" description="Try focused practice questions to find what you know and what deserves another look." icon={<Compass size={21} />} tone="bg-[#e3f8f7] text-[#138f9a]" note="A quick check-in, not a high-stakes test." />
            <ToolCard id="smart-flashcards" number="03" title="Smart Flashcards" eyebrow="Recall it, remember it" description="Review key ideas in short rounds that make it easier to return to the tricky bits." icon={<Layers3 size={21} />} tone="bg-[#fff0e7] text-[#be7446]" note="Small reps make knowledge stick." />
            <ToolCard id="ai-study-coach" number="04" title="AI Study Coach" eyebrow="Get unstuck, gently" description="Explore supportive study prompts and plain-language explanations for the topics on your mind." icon={<MessageCircle size={21} />} tone="bg-[#e9efff] text-[#4f64b2]" note="A concept preview. No AI features are live yet." />
            <ToolCard id="progress-tracker" number="05" title="Progress Tracker" eyebrow="Notice how far you've come" description="See your effort take shape across subjects, sessions, and the goals you set for yourself." icon={<BarChart3 size={21} />} tone="bg-[#e9f7ed] text-[#478261]" note="Progress is more than a grade." />
            <ToolCard id="exam-calendar" number="06" title="Exam Calendar" eyebrow="Know what’s coming" description="Keep upcoming exams and the small prep steps around them in one clear view." icon={<CalendarDays size={21} />} tone="bg-[#f2eaff] text-[#8359b7]" note="Look ahead, without the last-minute scramble." />
          </div>
        </section>

        <section id="how-it-works" className="relative bg-[#e9ebf8]">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-24">
            <div>
              <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[.17em] text-[#5547c5]">A steady rhythm, not a perfect one</p>
              <h2 className="font-display max-w-[470px] text-[36px] font-extrabold leading-[1.08] tracking-[-.06em] text-[#20294d] sm:text-[47px]">Start where you are.<br />Take one next step.</h2>
              <p className="mt-5 max-w-[390px] text-[14px] leading-[1.8] text-[#67718b]">Exam prep is easier when it’s not one giant task. Find the tool that fits the moment, make a small plan, and let that be enough for today.</p>
              <a href="#all-tools" className="mt-7 inline-flex items-center gap-2 text-[13px] font-extrabold text-[#5144c7] transition-colors hover:text-[#3428a4]" data-testid="link-see-all-tools">See all six tools <ArrowRight size={16} /></a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: <Bookmark size={17} />, title: 'Choose one focus', text: 'Pick a subject or a tool that feels useful right now.', color: 'text-[#6253d1] bg-[#eeebff]' },
                { icon: <Clock3 size={17} />, title: 'Keep it manageable', text: 'Think in short sessions, with breaks that count too.', color: 'text-[#148f9c] bg-[#e0f7f6]' },
                { icon: <CheckCircle2 size={17} />, title: 'Count the small wins', text: 'A little practice is still real progress.', color: 'text-[#c78332] bg-[#fff3df]' },
                { icon: <ChevronDown size={17} />, title: 'Come back when ready', text: 'Your plan can change as your week does.', color: 'text-[#5a6da9] bg-[#e7edff]' },
              ].map((step, index) => (
                <div key={step.title} className={`rounded-[19px] border border-white/80 bg-white/75 p-5 ${index === 1 ? 'sm:translate-y-5' : ''}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${step.color}`}>{step.icon}</span>
                  <h3 className="mt-4 text-[14px] font-extrabold tracking-[-.02em] text-[#293354]">{step.title}</h3>
                  <p className="mt-1.5 text-[12px] leading-[1.65] text-[#75809a]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1240px] px-5 py-16 sm:px-8 sm:py-24">
          <div className="relative overflow-hidden rounded-[26px] bg-[#202b60] px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
            <div className="absolute -right-12 -top-32 h-[320px] w-[320px] rounded-full border border-white/10" />
            <div className="absolute -right-2 -top-20 h-[235px] w-[235px] rounded-full border border-[#5fd9dc]/20" />
            <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-[560px]">
                <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[.17em] text-[#75dfe0]">No perfect routine required</p>
                <h2 className="font-display text-[32px] font-extrabold leading-tight tracking-[-.055em] sm:text-[40px]">A clearer next step starts here.</h2>
                <p className="mt-3 max-w-[445px] text-[13px] leading-[1.75] text-[#c3cbe3]">Browse the previews and find one small change that can make this school week feel more manageable.</p>
              </div>
              <a href="#all-tools" className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#65dadd] px-6 text-[13px] font-extrabold text-[#18244d] transition-transform hover:-translate-y-0.5" data-testid="link-browse-previews">Browse tool previews <ArrowRight size={16} /></a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#e3e6ef] bg-[#f0f2f8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <a href="#top" className="flex items-center gap-2.5" data-testid="link-footer-home">
            <span className="grid h-8 w-8 place-items-center rounded-[11px] bg-[#202c68] text-white"><GraduationCap size={17} /></span>
            <span className="font-display text-[14px] font-extrabold tracking-[-.045em] text-[#1b244b]">AI Exam Survival</span>
          </a>
          <p className="text-[11px] leading-relaxed text-[#7e879e]">A first look at a more organized way to prepare. Tool previews only; features are not live yet.</p>
          <a href="#all-tools" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#5045b5] hover:text-[#31278e]" data-testid="link-footer-tools">Explore tools <ArrowUpRight size={13} /></a>
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
  return (
    <Link
      href={`/${id}`}
      aria-label={`Open ${title}`}
      className="group block rounded-[21px] focus-visible:outline-none"
      data-testid={`link-tool-${id}`}
    >
      <article id={id} className="relative flex min-h-[265px] scroll-mt-24 flex-col rounded-[21px] border border-[#e5e7f0] bg-white p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#cecaef] group-hover:shadow-[0_16px_36px_rgba(35,42,91,.09)] sm:p-6">
        <div className="flex items-start justify-between">
          <span className={`grid h-11 w-11 place-items-center rounded-[15px] ${tone}`}>{icon}</span>
          <span className="font-display text-[12px] font-extrabold tracking-[.08em] text-[#b0b5c6]">{number}</span>
        </div>
        <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.12em] text-[#777f98]">{eyebrow}</p>
        <h3 className="mt-1.5 font-display text-[21px] font-extrabold tracking-[-.045em] text-[#222c51]">{title}</h3>
        <p className="mt-2 max-w-[330px] text-[12px] leading-[1.7] text-[#737d96]">{description}</p>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <span className="text-[10px] font-semibold leading-relaxed text-[#9097a9]">{note}</span>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e7e8f1] text-[#5962a5] transition-all group-hover:border-[#d9d5fa] group-hover:bg-[#f2f0ff] group-hover:text-[#5144c7]">
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
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <SiteHeader />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
