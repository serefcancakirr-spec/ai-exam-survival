# AI Exam Survival – working rules for Claude Code

A study web app for high-school students (grades 9–12), built by a teacher and four students in an AI Club.
The teacher works only on an Android tablet and is a beginner: explain things in simple language, step by step.
Reply in the language the teacher writes in (usually Turkish).

## How we work (always)
- Work in numbered stages. Before a stage: explain the plan and wait for approval.
- Before editing: make a backup (a git branch or tag such as `backup/before-stage-09`).
- After a stage: typecheck, build, run all tests (new and previous), compare untouched pages, give a preview link and tablet testing steps.
- Never start the next stage without the teacher's approval.
- Do not redesign. Keep the design (Stage 20A "Sisli Mavi ve Kum" colours + Stage 20B "Okul Defteri" touches), navigation, all modules and all saved student data.
- No live AI, paid APIs, API keys, authentication or database unless the teacher approves.
- Do not change unrelated modules. Never invent statistics or readiness percentages.

## The app
- Code: `artifacts/ai-exam-survival` (React 19 + TypeScript + Vite 7 + Tailwind v4, wouter routing). pnpm workspace.
- Run locally: `pnpm install`, then in `artifacts/ai-exam-survival`:
  `PORT=4180 BASE_PATH=/ pnpm run build` and `PORT=4180 BASE_PATH=/ pnpm run serve` (both variables are required).
- Typecheck: `pnpm run typecheck` in `artifacts/ai-exam-survival`.
- All tests (typecheck, build, logic tests, browser tests): `bash tests/run-tests.sh` from the repository root.
  Expected today: logic 165/165; browser stage01 59 pass + 3 known old failures, all other suites 0 failures
  (stage09-test 18/18 twice: github.io sub-folder and custom domain; stage10-test 23/23: Menti; stage11-test 19/19: Turkish content; stage13-test 26/26: focus timer and moods; stage14-test 13/13: deck names and study advice; stage15-test 31/31: grade 9, 10 and 11 MEB questions; stage17-test 15/15: About and Privacy; stage18-test 21/21: Menti chat; stage20-test 30/30: calm design, Okul Defteri look and readable text).
  Add new tests for each stage under `tests/model` (node:test, TypeScript) or `tests/browser` (Playwright, clock fixed to 5 Nov 2026, Europe/Istanbul).
- Pages: Home, Study Planner, Quiz Center, Smart Flashcards, Exam Calendar (month view + preparation steps), AI Study Coach (rule-based, no live AI), Progress Tracker, About and Privacy (`/about`, Stage 17).

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
- Menti is decoration only: it never reads or writes saved data. Exception (Stage 18, teacher approved): the chat reads
  saved data to give personal advice; it still never writes.

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

## Calm design "Sisli Mavi ve Kum" (Stage 20A, teacher's choice B)
- Only colours, fonts and decoration changed; every page's text and structure is the same as before (checked page by page).
- Colours: misty blue main colour, warm clay accents (home call-to-action buttons, labels on the deep blue header blocks),
  sage green for "good / done / mastered / strong / ok", soft orange for "needs work", warm cream background. The deep blue
  blocks stay (home hero, page headers). Menti keeps its own blue and its drawing (`menti.tsx` untouched).
- Fonts: headings Lora (`--app-font-serif`, `.font-display`), text Source Sans 3 (`--app-font-sans`); Google Fonts import in `index.css`.
  Big titles: letter spacing -.015em (no tight negative tracking).
- Calm details: no grid pattern (`.hero-grid` kept but empty), home preview cards do not float (`float-card` classes kept, no animation).
- Readable text: every visible text meets WCAG AA contrast (4.5:1, large text 3:1); `tests/browser/stage20-test.cjs` checks all
  pages on tablet and phone, empty pages, a quiz and the Menti chat. New colours must keep this test green.
- Weekly chart series: planner blue, quiz sage, flashcards clay, exam prep sand.

## "Okul Defteri" touches (Stage 20B, teacher's choice B: "less AI-looking, more natural")
- Labels in normal case (no small CAPITAL letter-spaced labels), no decorative circles/blobs, no soft floating shadows
  (thin selection rings stay; Menti, its speech bubble and the chat button keep their own look), smaller corners
  (cards 10px, small boxes 8px, buttons 6px), white boxes are warm paper `#fffdf8` with pencil-grey borders `#ddd5c6`,
  page background `#f7f3ea`, "how it works" band `#efe9dc`.
- Tool page headers: light paper `#fbf8f1` with a 6px blue left margin line `#5376a0` (the home hero and the dark
  summary/CTA blocks stay deep blue). Section titles (`h2.font-display`) get a soft highlighter line in `index.css`
  (`.no-mark` turns it off, used on dark blocks).
- Home tool cards have no 01–06 numbers. Home texts simplified by the teacher's wish (plain, teacher's voice, TR and EN):
  e.g. "Sınavlara adım adım hazırlan.", "Altı çalışma aracı.", "Hemen bir araç seç."
- `tests/browser/stage20-test.cjs` also checks these touches; new code must keep it green.

## Grade 9, 10 and 11 MEB questions (Stages 15, 16, 19)
- `src/pages/quiz-bank-meb9.ts`: grade 9 questions written for the MEB Türkiye Yüzyılı Maarif Modeli programs
  (Stage 15A: Mathematics 20, Physics 21, Chemistry 24, Biology 23; Stage 15B: History 22, Geography 22, Literature 20).
  Each has its learning outcome code (MAT/FİZ/KİM/BİY/TAR/COĞ.9.x.y; Türk Dili ve Edebiyatı uses the program's skill codes
  TDE2.x reading / TDE4.3 writing rules, 5 questions per theme, original texts written for the app); the topic is the MEB theme. In the source the first option is the correct one; the bank moves it to A–D.
- Stage 16: `src/pages/quiz-bank-meb10.ts`, grade 10 Mathematics 25, Physics 25, Chemistry 24, Biology 26 (16A) and History 24,
  Geography 23, Literature 20 (16B; 5 per theme: Sözün Ezgisi, Kelimelerin Ritmi, Dünden Bugüne, Nesillerin Mirası) (every outcome covered;
  official list `tests/data/meb10-outcomes.json`). `src/pages/quiz-bank-meb.ts` joins the grades: `MEB_SEEDS[grade][subject]`,
  `mebOutcome(question)` (by grade + subject + question text) and `usesMeb(grade, subject)`.
- Stage 19A: `src/pages/quiz-bank-meb11.ts`, grade 11 Mathematics 30, Physics 38, Chemistry 32, Biology 26 (every outcome covered;
  official list `tests/data/meb11-outcomes.json`: MAT 15, FİZ 33, KİM 25, BİY 22 outcomes; the Biology plan's typo "HOME0STAZİ"
  is written HOMEOSTAZİ, Chemistry's code-less "11.3.3." is KİM.11.3.3). Stage 19B: History 25 (TAR 11 outcomes),
  Geography 23 (COĞ 19 outcomes, from the 4-hour plan, which includes all of the 2-hour plan), Literature 20 (5 per theme:
  Bir Diyeceğim Var!, Kültür Yolculuğu, Yaşamın İzinde, Hayatın Aynası; TDE2.x reading and TDE4.3 writing rules).
- Ids `<grade>-<subject>-meb-<n>`. Grade 12 and English keep the shared samples. The note says the grade (`quiz.mebNote` has `{grade}`).
- Turkish in both languages. Quiz shows a note (`quiz.mebNote`, "öğretmen kontrolü sürüyor") and "Öğrenme çıktısı: CODE"
  under each question and in the review (found by question text, so nothing new is saved). Never write "MEB onaylı".
- Official outcome list for the tests: `tests/data/meb9-outcomes.json` (from the 2026-2027 Anadolu Lisesi frame plans on
  tymm.meb.gov.tr). Questions follow the MEB "Bağlam Temelli Çoktan Seçmeli Soru Yazım Kılavuzu" (context, misconception
  distractors, no "hepsi/hiçbiri").
- Network: the personal cloud environment "ai-exam-survival" allows tymm.meb.gov.tr (use curl; WebFetch cannot reach it).

## About and Privacy (Stage 17)
- `src/pages/about-page.tsx` at `/about`; texts are `about.*` keys. Every page footer has a small “Hakkında · Gizlilik” link
  (`FooterAboutLink`, test id `link-footer-about`) added inside the footer text, so the footer layout stays the same.
- Says “AI Kulübü” only (no school or student names, teacher's choice). Contact: aiexamsurvival@gmail.com (teacher approved).
- Privacy text must stay true: no account, no server, data only in this browser, no ads/analytics/cookies; GitHub Pages and
  Google Fonts can see the IP address. Update it if any of this changes. MEB note: questions are not approved by MEB.
- “Delete all my data on this device” (teacher approved): asks first, then removes only the keys in `APP_STORAGE_KEYS`
  (the 8 saved-data keys above). A model test checks the list matches every key used in the code.

## Chat with Menti (Stage 18)
- `src/components/menti-chat.tsx` (mounted once in `App.tsx`, so it is on every page): round Menti button bottom-right
  (`menti-chat-button`), opens a chat window (bottom sheet on phones, small window on tablets). Escape/close button closes it.
- Rules and texts: `src/components/menti-chat-model.ts` (pure, tested). `intentOf(text)` = keyword stems after `normalize()`
  (Turkish letters folded); safety words (self-harm, bullying) always win and answer with a trusted adult, rehber öğretmen
  and 112, without quick buttons. Quick buttons: today, exams, weak topics, cards, how to study, mood, anxiety, app help.
- Personal facts come from the Progress Tracker readers (`readAllSources`, `buildTopicResults`, `buildExamReadiness`,
  `buildPlannerWeek`): only real saved numbers, never estimates. Every answer links to a tool (focus link scrolls to
  `#focus-timer`). Read only (`getItem`); the conversation is kept in memory only and is gone after a refresh.
- Menti says it is a mascot that works with rules, not a live AI and not a person. Texts in `CHAT_TEXTS` (tr/en, same keys).

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
- Stage 14 (no duplicate deck names, Menti study advice): done, merged into `main` (PR #6), deployed, tested on the tablet
  and approved by the teacher.
- Stage 15A (grade 9 MEB questions: Mathematics, Physics, Chemistry, Biology): done, merged into `main` (PR #7), deployed,
  tested on the tablet and approved by the teacher. Review list given to the subject teachers (their check is still going on).
- Stage 15B (grade 9 History, Geography, Türk Dili ve Edebiyatı): done, merged into `main` (PR #8), deployed, tested on the
  tablet and approved by the teacher. English and Din Kültürü left out (English plan only as RAR; Din Kültürü plan not on the page).
- Stage 16A (grade 10 MEB questions: Mathematics, Physics, Chemistry, Biology): done, merged into `main` (PR #9), deployed,
  tested on the tablet and approved by the teacher. Review list given to the teacher.
- Stage 16B (grade 10 History, Geography, Türk Dili ve Edebiyatı): done, merged into `main` (PR #10), deployed,
  tested on the tablet and approved by the teacher.
- Stage 17 (About and Privacy page): done, merged into `main` (PR #11), deployed, tested on the tablet and approved
  by the teacher.
- Stage 18 (chat with Menti, rule-based, no live AI): done, merged into `main` (PR #12), deployed, tested on the tablet
  and approved by the teacher.
- Ideas discussed for later (not approved yet): install as an app (PWA); live AI only later, with school approval, a small server
  to hide the key and a spending cap.
- Stage 19A (grade 11 MEB questions: Mathematics, Physics, Chemistry, Biology): done, merged into `main` (PR #13), deployed,
  tested on the tablet and approved by the teacher. Review list given to the teacher.
- Stage 19B (grade 11 History, Geography, Türk Dili ve Edebiyatı): done, merged into `main` (PR #14), deployed,
  tested on the tablet and approved by the teacher. Review list given to the teacher.
- Stage 20 (calm design): split by the teacher into 20A (colours + fonts, approved) and 20B (light interface touches, "not all at
  once"; show 2 samples of the home page and one tool page first). Samples shown: A, B, C, then B2, D, E; teacher chose B.
  20A: done, merged into `main` (PR #15), deployed, tested on the tablet and approved by the teacher.
  20B: teacher said the site felt "AI-made"; samples A (Sade Defter) and B (Okul Defteri) shown, teacher chose B and asked
  for simpler slogans. Built and tested, backup tag `backup/before-stage-20b` (local only). Waiting for approval to open a PR.
- Order approved by the teacher: 19A → 19B (grade 11 History, Geography, Literature) → Stage 20 new calm design (teacher asked
  for a softer, calmer, less "AI-looking" look; show 2–3 samples first; the "do not redesign" rule is lifted for that stage only,
  keep pages, navigation, modules, saved data and Menti) → Stage 21 English A1–C1 for every grade (21A grammar + vocabulary,
  21B reading + listening; listening uses the browser's built-in speech, no audio files or paid service; original texts)
  → Stage 22 grade 12 TYT / AYT / YDT exam mode for all subjects (original ÖSYM-style questions, timed mini exams, net =
  correct − wrong ÷ 4; no score or ranking estimates) → Stage 23 PWA. Teacher approved adding Felsefe (philosophy group) and
  Din Kültürü as new subjects (needed for TYT Sosyal / AYT); saved data shape stays the same.
  Corrections from the subject teachers whenever they arrive.
