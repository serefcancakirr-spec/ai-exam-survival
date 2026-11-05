import { useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers3,
  MessageCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { Link } from 'wouter';
import FunctionalQuizCenterPage from './quiz-center-page';
import FunctionalStudyPlannerPage from './study-planner-page';

type ToolPageFrameProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

function ToolPageFrame({
  eyebrow,
  title,
  description,
  icon,
  children,
}: ToolPageFrameProps) {
  return (
    <div className="page-shell min-h-[100dvh] bg-[#f5f6fb]">
      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 sm:px-8 sm:pb-24 sm:pt-10">
        <Link
          href="/"
          className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2e5ef] bg-white px-4 text-[12px] font-bold text-[#35405e] transition-colors hover:border-[#c8c5eb] hover:text-[#5144c7]"
          data-testid="link-back-home"
        >
          <ArrowLeft size={15} /> Back to home
        </Link>

        <section className="relative mt-6 overflow-hidden rounded-[26px] bg-[#18224d] px-6 py-8 text-white sm:px-9 sm:py-10">
          <div className="hero-grid absolute inset-0 opacity-40" />
          <div className="absolute -right-16 -top-32 h-72 w-72 rounded-full bg-[#5944d2]/25" />
          <div className="relative flex max-w-[760px] items-start gap-4 sm:gap-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-white/10 text-[#75dfe0] sm:h-14 sm:w-14">
              {icon}
            </span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#75dfe0] sm:text-[11px]">
                {eyebrow}
              </p>
              <h1 className="font-display mt-2 text-[32px] font-extrabold leading-tight tracking-[-.055em] sm:text-[44px]">
                {title}
              </h1>
              <p className="mt-3 max-w-[620px] text-[13px] leading-[1.75] text-[#c3cbe3] sm:text-[15px]">
                {description}
              </p>
            </div>
          </div>
        </section>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#7e879e]">
            Example content for this preview
          </p>
          <span className="rounded-full bg-[#e8e6fb] px-3 py-1.5 text-[10px] font-bold text-[#5b50bb]">
            Sample data
          </span>
        </div>

        <div className="mt-4">{children}</div>
      </main>

      <footer className="border-t border-[#e3e6ef] bg-[#f0f2f8]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-[11px] text-[#7e879e]">
            AI Exam Survival · Study previews
          </p>
          <Link
            href="/"
            className="inline-flex min-h-9 items-center gap-2 text-[11px] font-bold text-[#5045b5] hover:text-[#31278e]"
            data-testid="link-footer-home"
          >
            <ArrowLeft size={13} /> Return to the homepage
          </Link>
        </div>
      </footer>
    </div>
  );
}

type DemoCardProps = {
  eyebrow: string;
  title: string;
  children: ReactNode;
  trailing?: ReactNode;
};

function DemoCard({ eyebrow, title, children, trailing }: DemoCardProps) {
  return (
    <section className="rounded-[21px] border border-[#e5e7f0] bg-white p-5 shadow-[0_8px_28px_rgba(29,42,90,.035)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#5a4bc9]">
            {eyebrow}
          </p>
          <h2 className="font-display mt-1.5 text-[20px] font-extrabold tracking-[-.04em] text-[#20294d] sm:text-[22px]">
            {title}
          </h2>
        </div>
        {trailing}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function StudyPlannerPage() {
  return <FunctionalStudyPlannerPage />;
}

export function QuizCenterPage() {
  return <FunctionalQuizCenterPage />;
}

const flashcards = [
  {
    front: 'Which organelle is often called the cell’s powerhouse?',
    back: 'Mitochondrion — it converts energy from food into a form the cell can use.',
  },
  {
    front: 'What is the main job of a ribosome?',
    back: 'Ribosomes build proteins by following instructions carried by RNA.',
  },
  {
    front: 'What does the cell membrane control?',
    back: 'It regulates what enters and leaves the cell, helping maintain a stable interior.',
  },
];

export function SmartFlashcardsPage() {
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const card = flashcards[cardIndex];

  function changeCard(direction: number) {
    setCardIndex(
      (current) => (current + direction + flashcards.length) % flashcards.length,
    );
    setShowAnswer(false);
  }

  return (
    <ToolPageFrame
      eyebrow="Recall it, remember it"
      title="Smart Flashcards"
      description="Review a small sample biology deck. Flip each card to reveal the answer, then move through the set at your own pace."
      icon={<Layers3 size={22} />}
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <DemoCard
          eyebrow="Biology · Cell structure"
          title="Cell basics deck"
          trailing={
            <span className="rounded-full bg-[#f2f4f9] px-3 py-1.5 text-[10px] font-bold text-[#626b85]">
              Card {cardIndex + 1} of {flashcards.length}
            </span>
          }
        >
          <button
            type="button"
            onClick={() => setShowAnswer((shown) => !shown)}
            aria-label={showAnswer ? 'Show flashcard prompt' : 'Reveal answer'}
            aria-pressed={showAnswer}
            className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[20px] border border-[#e4e2f5] bg-[#f6f5ff] px-6 py-8 text-center transition-colors hover:border-[#c8c5eb] sm:min-h-[250px]"
            data-testid="button-flashcard-flip"
          >
            <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#5d53bd]">
              {showAnswer ? 'Answer' : 'Prompt'}
            </span>
            <span className="font-display mt-5 max-w-[540px] text-[20px] font-extrabold leading-snug tracking-[-.04em] text-[#20294d] sm:text-[25px]">
              {showAnswer ? card.back : card.front}
            </span>
            <span className="mt-5 text-[10px] font-semibold text-[#858da2]">
              Tap to {showAnswer ? 'see the prompt' : 'reveal the answer'}
            </span>
          </button>
          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => changeCard(-1)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#e2e5ef] px-4 text-[11px] font-bold text-[#56607b] hover:border-[#c8c5eb]"
              data-testid="button-flashcard-previous"
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <div className="flex gap-1.5" aria-label="Flashcard position">
              {flashcards.map((item, index) => (
                <span
                  key={item.front}
                  className={`h-1.5 w-6 rounded-full ${
                    index === cardIndex ? 'bg-[#5144c7]' : 'bg-[#e0e2ed]'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => changeCard(1)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#5144c7] px-4 text-[11px] font-bold text-white hover:bg-[#4337b0]"
              data-testid="button-flashcard-next"
            >
              Next <ChevronRight size={15} />
            </button>
          </div>
        </DemoCard>

        <DemoCard eyebrow="Review tip" title="Make recall active">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#eeebff] text-[#5d4fce]">
            <Target size={20} />
          </div>
          <p className="mt-4 text-[12px] leading-[1.75] text-[#707992]">
            Try to answer before you flip the card. Pausing to recall the idea
            helps you notice what you know and what needs another review.
          </p>
        </DemoCard>
      </div>
    </ToolPageFrame>
  );
}

export function AiStudyCoachPage() {
  return (
    <ToolPageFrame
      eyebrow="A supportive place to get unstuck"
      title="AI Study Coach"
      description="See an example of the kind of clear, encouraging study guidance this tool is planned to provide."
      icon={<MessageCircle size={22} />}
    >
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <DemoCard
          eyebrow="Example conversation"
          title="Mitosis or meiosis?"
          trailing={
            <span className="rounded-full bg-[#fff3df] px-3 py-1.5 text-[10px] font-bold text-[#a66a2c]">
              AI is not connected
            </span>
          }
        >
          <div className="space-y-4">
            <div className="ml-auto max-w-[90%] rounded-[17px] rounded-br-md bg-[#eeebff] px-4 py-3">
              <p className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#665bd0]">
                Student
              </p>
              <p className="mt-1 text-[12px] leading-[1.7] text-[#414969]">
                I keep mixing up mitosis and meiosis. What’s the simplest
                difference?
              </p>
            </div>
            <div className="max-w-[90%] rounded-[17px] rounded-bl-md bg-[#f0f4f9] px-4 py-3">
              <p className="text-[9px] font-extrabold uppercase tracking-[.1em] text-[#188e98]">
                Study coach · sample reply
              </p>
              <p className="mt-1 text-[12px] leading-[1.7] text-[#414969]">
                Mitosis makes two matching cells for growth and repair. Meiosis
                makes four cells with half the chromosomes for reproduction.
              </p>
            </div>
          </div>
          <p className="mt-4 rounded-[13px] bg-[#fff7e9] px-4 py-3 text-[10px] leading-relaxed text-[#946b3a]">
            This is fixed sample content. No prompt is sent and no AI response
            is generated.
          </p>
        </DemoCard>

        <DemoCard eyebrow="Ask better questions" title="A simple study prompt">
          <div className="grid h-11 w-11 place-items-center rounded-[14px] bg-[#e9efff] text-[#4f64b2]">
            <Sparkles size={20} />
          </div>
          <p className="mt-4 text-[12px] leading-[1.75] text-[#707992]">
            “Can you explain this idea in plain language, then give me one
            practice question?”
          </p>
          <p className="mt-3 text-[10px] font-semibold text-[#9299aa]">
            Example prompt only · no live AI
          </p>
        </DemoCard>
      </div>
    </ToolPageFrame>
  );
}

const subjectProgress = [
  { subject: 'Biology', detail: '4 of 5 review sessions', value: 80, color: 'bg-[#20a6ad]' },
  { subject: 'Algebra II', detail: '3 of 5 practice sets', value: 60, color: 'bg-[#5a4bd0]' },
  { subject: 'World History', detail: '2 of 4 topic reviews', value: 50, color: 'bg-[#bd7e42]' },
];

export function ProgressTrackerPage() {
  return (
    <ToolPageFrame
      eyebrow="Notice the work you have done"
      title="Progress Tracker"
      description="A sample weekly view of study sessions and subject goals. The numbers below are examples, not saved student data."
      icon={<BarChart3 size={22} />}
    >
      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <DemoCard
          eyebrow="Sample week · November 2–8"
          title="Subject progress"
          trailing={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f7f5] px-3 py-1.5 text-[10px] font-bold text-[#278c8e]">
              <CheckCircle2 size={13} /> 9 sessions
            </span>
          }
        >
          <div className="space-y-5">
            {subjectProgress.map((subject) => (
              <div key={subject.subject} data-testid={`progress-${subject.subject.toLowerCase().replaceAll(' ', '-')}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[12px] font-extrabold text-[#35405e]">
                    {subject.subject}
                  </p>
                  <span className="text-[10px] font-semibold text-[#7e879e]">
                    {subject.detail}
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef0f6]"
                  role="progressbar"
                  aria-label={`${subject.subject} sample progress`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={subject.value}
                >
                  <div
                    className={`h-full rounded-full ${subject.color}`}
                    style={{ width: `${subject.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </DemoCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[20px] bg-[#202b60] p-5 text-white">
            <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#75dfe0]">
              Focus time
            </p>
            <p className="font-display mt-2 text-[32px] font-extrabold tracking-[-.05em]">
              3h 20m
            </p>
            <p className="mt-1 text-[11px] text-[#c3cbe3]">
              Sample study time this week
            </p>
          </div>
          <div className="rounded-[20px] border border-[#e5e7f0] bg-white p-5">
            <div className="flex items-center gap-2 text-[#5d4fce]">
              <Target size={17} />
              <p className="text-[11px] font-extrabold">A steady goal</p>
            </div>
            <p className="font-display mt-3 text-[23px] font-extrabold tracking-[-.04em] text-[#20294d]">
              5 study sessions
            </p>
            <p className="mt-1 text-[11px] text-[#7e879e]">
              Sample goal · 4 of 5 complete
            </p>
          </div>
        </div>
      </div>
    </ToolPageFrame>
  );
}

const examEvents = [
  {
    weekday: 'TUE',
    date: '10',
    month: 'NOV',
    subject: 'Biology quiz',
    detail: 'Cell structure and organelles',
    prep: 'Review flashcards · 20 min',
    tone: 'bg-[#e3f8f7] text-[#138f9a]',
  },
  {
    weekday: 'THU',
    date: '12',
    month: 'NOV',
    subject: 'Algebra II test',
    detail: 'Linear and quadratic equations',
    prep: 'Complete 2 practice sets',
    tone: 'bg-[#eeebff] text-[#5d4fce]',
  },
  {
    weekday: 'FRI',
    date: '13',
    month: 'NOV',
    subject: 'World History essay',
    detail: 'Causes of World War I',
    prep: 'Outline key arguments',
    tone: 'bg-[#fff0e7] text-[#be7446]',
  },
];

export function ExamCalendarPage() {
  return (
    <ToolPageFrame
      eyebrow="Know what is coming"
      title="Exam Calendar"
      description="A sample week of upcoming assessments, paired with one manageable preparation step for each."
      icon={<CalendarDays size={22} />}
    >
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <DemoCard
          eyebrow="November 2026"
          title="Upcoming exams"
          trailing={
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f2f4f9] px-3 py-1.5 text-[10px] font-bold text-[#626b85]">
              <CalendarDays size={13} /> Week of Nov 9
            </span>
          }
        >
          <div className="space-y-3">
            {examEvents.map((event) => (
              <article
                key={event.subject}
                className="flex gap-3 rounded-[16px] border border-[#eceef4] p-3.5 sm:gap-4 sm:p-4"
                data-testid={`event-${event.date}`}
              >
                <div
                  className={`flex w-[54px] shrink-0 flex-col items-center justify-center rounded-[13px] py-2 ${event.tone}`}
                >
                  <span className="text-[8px] font-extrabold tracking-[.1em]">
                    {event.weekday}
                  </span>
                  <span className="font-display text-[20px] font-extrabold leading-tight">
                    {event.date}
                  </span>
                  <span className="text-[8px] font-extrabold tracking-[.1em]">
                    {event.month}
                  </span>
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <h3 className="text-[12px] font-extrabold text-[#293354]">
                    {event.subject}
                  </h3>
                  <p className="mt-1 text-[10px] text-[#75809a]">
                    {event.detail}
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold text-[#5a4bc9]">
                    <CheckCircle2 size={12} /> {event.prep}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </DemoCard>

        <DemoCard eyebrow="Keep it manageable" title="Your prep rhythm">
          <div className="space-y-4">
            {[
              ['MON', 'Plan your review blocks'],
              ['TUE', 'Take the biology quiz'],
              ['WED', 'Practice algebra problems'],
              ['THU', 'Sit the algebra test'],
              ['FRI', 'Finish the history essay'],
            ].map(([day, step], index) => (
              <div key={day} className="flex items-center gap-3">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[9px] font-extrabold ${
                    index === 0
                      ? 'bg-[#5144c7] text-white'
                      : 'bg-[#f0f1f8] text-[#717b95]'
                  }`}
                >
                  {day.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-[#35405e]">{step}</p>
                </div>
                <span className="text-[9px] font-semibold text-[#9198aa]">
                  {day}
                </span>
              </div>
            ))}
          </div>
        </DemoCard>
      </div>
    </ToolPageFrame>
  );
}
