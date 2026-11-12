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
  Expected today: logic 120/120; browser stage01 59 pass + 3 known old failures, all other suites 0 failures
  (stage09-test 18/18 twice: github.io sub-folder and custom domain; stage10-test 23/23: Menti; stage11-test 19/19: Turkish content; stage13-test 26/26: focus timer and moods; stage14-test 13/13: deck names and study advice).
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
- `ai-exam-survival:focus:v1` (Stage 13, teacher approved: focus timer settings only – workMinutes 15/25/45, sound, volume 0–100, chime; written only when a setting changes)
Each tool checks its saved data and never overwrites data it cannot read.
Progress Tracker is completely read-only: it reads the other tools' data and never writes.

## Turkish / English (Stage 8A + 8B)
- Turkish is the default; TR/EN switch in the header; choice remembered after refresh.
- `src/i18n/i18n.tsx`: `useI18n()` gives `t(key)`, `tn()`, `tx(englishTemplate, vars)`, `phrase(englishSentence)`, `subject(name)`, `locale`.
- Home, header, Study Planner, Quiz Center: keyed texts in `translations-en.ts` / `translations-tr.ts`.
- Flashcards, Exam Calendar, Study Coach, Progress Tracker: English sentence as key in `phrases-tr.ts` (`{placeholder}` templates).
- Only display text is translated. Saved values, IDs, routes and storage keys stay in English.
- Keep in English: the English subject's quiz questions and the two English vocabulary starter decks (they teach English).
- Stage 11: all other quiz questions/options/explanations, quiz topic names and starter decks are shown in Turkish
  (`src/i18n/quiz-questions-tr.ts` in the same order as `QUESTION_SEEDS`, `src/i18n/flashcards-starter-tr.ts`,
  helpers in `src/i18n/content.ts`). Display only: saved quiz results, topics and cards stay English.
  A starter deck/card text is shown in Turkish only while it still equals the original English text (student edits win).
- Never translate text a student typed. New example data is created in the language in use.
- English mode must look exactly as before when adding translations.

## Website (Stage 9)
- `.github/workflows/deploy-pages.yml` deploys `dist/public` on every push to `main` (or Actions → Run workflow).
  Stage 12: BASE_PATH comes from `actions/configure-pages` (`base_path`): `/` with the custom domain
  aiexamsurvival.com.tr, `/ai-exam-survival/` without it. After changing the custom domain, run the workflow again.
- `404.html` is a copy of `index.html` (made in the workflow) so refreshing a sub-page works on GitHub Pages.
- Address: https://aiexamsurvival.com.tr/ (domain bought at METUnic; DNS: 4 GitHub A records + www CNAME).
  Old address https://serefcancakirr-spec.github.io/ai-exam-survival/ redirects there once the custom domain is set.
  Saved data is per address: students had not used the site before the move (teacher confirmed).
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

## Focus timer and moods (Stage 13)
- `src/pages/focus-timer.tsx` (card on the Study Planner page, under the three tiles), logic in `src/pages/focus-model.ts`.
  Pomodoro: study 15/25/45 min, 5-min break (starts by itself), 15-min long break after 4 blocks; a finished break waits.
  Time comes from the clock (endsAt), so it stays right in background tabs. Nothing about studying is saved.
- `src/components/focus-sounds.ts`: rain / soft hum / waves and a two-note bell made with Web Audio (no audio files);
  created only after a tap, never autoplay, stopped when leaving the page.
- New Menti poses: sleepy, calm, focused, proud, comfort. Rules in `src/components/menti-moods.ts`:
  home greeting by hour (05–11 morning, 12–17 day, 18–22 evening, 23–04 night = sleepy); quiz 70%+ cheer, 40–69% encourage,
  below 40% comfort; proud on the Study Planner when every study session of the week is ticked.

## Flashcards: deck names and study advice (Stage 14)
- `src/pages/flashcards-guide.ts`: no two decks with the same name (any grade/subject; letter case, Turkish İ/ı and extra
  spaces ignored; unchanged starter decks count with their Turkish and English names). An edited deck may keep its own name;
  duplicates saved before Stage 14 are kept untouched.
- Menti study advice under the mode tabs (from real progress): all new → Learn, cards marked "Review again" → Review,
  all mastered or mostly known → Practice, 3+ "Review again" in one round (not in Review) → reassurance. Writes nothing.

## Where we are
- Done: Stages 1–8B, all tested on the tablet and approved by the teacher.
- Stage 9 (website): done, merged into `main` (PR #1), deployed, tested on the tablet and approved by the teacher.
  The site updates on every push to `main`.
- Stage 10 (Menti mascot): done, merged into `main` (PR #2), deployed, tested on the tablet and approved by the teacher.
- Stage 11 (Turkish quiz questions and starter decks): done, merged into `main` (PR #3), deployed, tested on the tablet
  and approved by the teacher.
- Stage 12 (custom domain): done, merged into `main` (PR #4). DNS set at METUnic, custom domain saved in Settings → Pages,
  workflow re-run (built with BASE_PATH=/). The site is live at https://aiexamsurvival.com.tr/ (teacher confirmed).
- Stage 13 (focus timer, calm sounds, new Menti moods): done, merged into `main` (PR #5), deployed, tested on the tablet
  and approved by the teacher.
- Stage 14 (no duplicate deck names, Menti study advice): built and tested on the work branch, backup tag
  `backup/before-stage-14` (local only). Waiting for the teacher's approval to open a PR and merge.
- Teacher feedback (not started, Stage 15 candidate): content must follow the MEB curriculum and the Türkiye Yüzyılı Maarif Modeli (grades 9–11 new program
  in 2026-27, grade 12 old program). Official programs: tymm.meb.gov.tr (host not reachable from the cloud session).
- Ideas discussed for later (not approved yet): Stage 14 rule-based chat Menti (no live AI); Stage 15 install as an app (PWA)
  and an About/Privacy page; live AI only later, with school approval, a small server to hide the key and a spending cap.
- Next: no stage planned yet. Ask the teacher before starting anything new.
