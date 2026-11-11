# AI Exam Survival – working rules for Claude Code

A study web app for high-school students (grades 9–12), built by a teacher and four students in an AI Club.
The teacher works only on an Android tablet and is a beginner: explain things in simple language, step by step.
Reply in the language the teacher writes in (usually Turkish).

## How we work (always)
- Work in numbered stages. Before a stage: explain the plan and wait for approval.
- Before editing: make a backup (a git branch or tag such as `backup/before-stage-09`).
- After a stage: typecheck, build, run all tests (new and previous), compare untouched pages, give a preview link and tablet testing steps.
- Never start the next stage without the teacher's approval.
- Do not redesign. Keep the design, navigation, all modules and all saved student data.
- No live AI, paid APIs, API keys, authentication or database unless the teacher approves.
- Do not change unrelated modules. Never invent statistics or readiness percentages.

## The app
- Code: `artifacts/ai-exam-survival` (React 19 + TypeScript + Vite 7 + Tailwind v4, wouter routing). pnpm workspace.
- Run locally: `pnpm install`, then in `artifacts/ai-exam-survival`:
  `PORT=4180 BASE_PATH=/ pnpm run build` and `PORT=4180 BASE_PATH=/ pnpm run serve` (both variables are required).
- Typecheck: `pnpm run typecheck` in `artifacts/ai-exam-survival`.
- All tests (typecheck, build, logic tests, browser tests): `bash tests/run-tests.sh` from the repository root.
  Expected today: logic 95/95; browser stage01 59 pass + 3 known old failures, all other suites 0 failures
  (stage09-test 18/18: website build served like GitHub Pages; stage10-test 23/23: Menti).
  Add new tests for each stage under `tests/model` (node:test, TypeScript) or `tests/browser` (Playwright, clock fixed to 5 Nov 2026, Europe/Istanbul).
- Pages: Home, Study Planner, Quiz Center, Smart Flashcards, Exam Calendar (month view + preparation steps), AI Study Coach (rule-based, no live AI), Progress Tracker.

## Saved data (localStorage) – never rename, never change the shape
- `ai-exam-survival:study-planner:v1`
- `ai-exam-survival:quiz-center:v1` (up to 30 attempts, newest first)
- `ai-exam-survival:flashcards:v1`
- `ai-exam-survival:exam-calendar:v1`
- `ai-exam-survival:exam-prep:v1`
- `ai-exam-survival:study-coach:v1`
- `ai-exam-survival:language:v1` (`tr` or `en`; written only when the student taps TR/EN)
Each tool checks its saved data and never overwrites data it cannot read.
Progress Tracker is completely read-only: it reads the other tools' data and never writes.

## Turkish / English (Stage 8A + 8B)
- Turkish is the default; TR/EN switch in the header; choice remembered after refresh.
- `src/i18n/i18n.tsx`: `useI18n()` gives `t(key)`, `tn()`, `tx(englishTemplate, vars)`, `phrase(englishSentence)`, `subject(name)`, `locale`.
- Home, header, Study Planner, Quiz Center: keyed texts in `translations-en.ts` / `translations-tr.ts`.
- Flashcards, Exam Calendar, Study Coach, Progress Tracker: English sentence as key in `phrases-tr.ts` (`{placeholder}` templates).
- Only display text is translated. Saved values, IDs, routes and storage keys stay in English.
- Keep in English: quiz questions/answers/explanations/topics, flashcard card text and starter deck names.
- Never translate text a student typed. New example data is created in the language in use.
- English mode must look exactly as before when adding translations.

## Website (Stage 9)
- `.github/workflows/deploy-pages.yml` builds with `BASE_PATH=/ai-exam-survival/` and deploys `dist/public` on every push to `main`.
- `404.html` is a copy of `index.html` (made in the workflow) so refreshing a sub-page works on GitHub Pages.
- Address: https://serefcancakirr-spec.github.io/ai-exam-survival/ (repository is Public; Pages source is "GitHub Actions").
- Use `%BASE_URL%` in `index.html` and wouter `Link` in the app; never hard-code a leading `/` for files.

## Menti, the mascot (Stage 10)
- A friendly blue cow drawn as SVG in `src/components/menti.tsx` (based on the teacher's picture).
  `<Menti pose size message bubble testId />` = Menti + speech bubble; `<MentiArt pose faceOnly />` = drawing only.
  Poses: wave, think, cheer, encourage, surprised, point, clap. Animations: `menti-*` classes in `index.css`, off with reduced motion.
- Where: home hero (wave), AI Study Coach (think; face icon on narrow screens), Quiz results (cheer at 70% or more,
  otherwise encourage), Flashcards round finished (clap), empty Study Planner / Exam Calendar / Progress Tracker (point/wave),
  page not found (surprised + home button). Texts: `menti.*` keys in translations-en.ts / translations-tr.ts.
- Tab icon `public/favicon.svg` is Menti's face; rebuild it with `bash scripts/menti/make-favicon.sh`.
- Menti is decoration only: it never reads or writes saved data.

## Where we are
- Done: Stages 1–8B (1–8A tested and approved by the teacher; 8B finished, tablet test still to be confirmed).
- Stage 9 (website): done, merged into `main` (PR #1), deployed, tested on the tablet and approved by the teacher.
  The site is live at https://serefcancakirr-spec.github.io/ai-exam-survival/ and updates on every push to `main`.
- Stage 10 (Menti mascot): drawing approved by the teacher; built and tested on the work branch,
  backup tag `backup/before-stage-10` (local only). Waiting for the teacher's approval to open a PR and merge.
- Next: no stage planned yet. Ask the teacher before starting anything new.
