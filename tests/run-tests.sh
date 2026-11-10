#!/usr/bin/env bash
# Runs every AI Exam Survival test. Usage (from the repository root): bash tests/run-tests.sh
# Needs: pnpm install done, Node 20+, Playwright with Chromium (npx playwright install chromium).
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
T="$ROOT/tests"; APP="$ROOT/artifacts/ai-exam-survival"; OUT="$T/out"; PORT="${PORT:-4180}"
mkdir -p "$OUT"
ESBUILD="$(find "$ROOT/node_modules/.pnpm" -path '*esbuild@*/node_modules/esbuild/bin/esbuild' | head -1)"

echo "== 1. typecheck and build"
(cd "$APP" && PORT=$PORT BASE_PATH=/ pnpm run typecheck && PORT=$PORT BASE_PATH=/ pnpm run build) || exit 1

echo "== 2. logic tests"
python3 "$T/tx-templates.py" "$APP"/src/pages/{smart-flashcards-page,exam-calendar-page,exam-month-view,exam-prep-panel,ai-study-coach-page,progress-tracker-page,progress-charts}.tsx > "$OUT/tx.json"
"$ESBUILD" "$T/dict.ts" --bundle --platform=node --format=cjs --outfile="$OUT/dict.cjs" --log-level=error
for f in "$T"/model/*.test.ts; do
  "$ESBUILD" "$f" --bundle --platform=node --format=cjs --outfile="$OUT/$(basename "$f" .ts).cjs" --log-level=error
done
(cd "$OUT" && TZ=Europe/Istanbul node --test ./*.test.cjs 2>&1 | grep -E '^not ok|^# (tests|pass|fail)')

echo "== 3. browser tests (app served on port $PORT)"
(cd "$APP" && PORT=$PORT BASE_PATH=/ pnpm run serve --port "$PORT" > "$OUT/serve.log" 2>&1 &)
sleep 5
URL="http://127.0.0.1:$PORT"
# Stage 1–7 tests were written for English, so they run with English chosen.
for f in stage01-test stage02-flashcards-test stage04-calendar-test stage05-test stage06-coach-test stage07-test; do
  NODE_OPTIONS="--require $T/browser/en-wrap.cjs" node "$T/browser/$f.cjs" "$URL" > "$OUT/$f.log" 2>&1
  echo "$f: $(grep -c '^PASS' "$OUT/$f.log") pass, $(grep -c '^FAIL' "$OUT/$f.log") fail"
done
for f in stage08a-test stage08b-test; do
  node "$T/browser/$f.cjs" "$URL" > "$OUT/$f.log" 2>&1
  echo "$f: $(grep -c '^PASS' "$OUT/$f.log") pass, $(grep -c '^FAIL' "$OUT/$f.log") fail"
done
echo "Known: stage01-test has 3 old placeholder checks that fail by design since Stages 2, 6 and 7."
pkill -f "vite preview --config vite.config.ts --host 0.0.0.0 --port $PORT" 2>/dev/null || true

echo "== 4. website test (Stage 9): built exactly like the GitHub Pages workflow, served like GitHub Pages"
PAGES_PORT=$((PORT + 10))
(cd "$APP" && PORT=$PORT BASE_PATH=/ai-exam-survival/ NODE_ENV=production pnpm run build --outDir "$OUT/pages" --emptyOutDir > "$OUT/pages-build.log" 2>&1) || { echo "website build failed (see $OUT/pages-build.log)"; exit 1; }
cp "$OUT/pages/index.html" "$OUT/pages/404.html"
node "$T/browser/pages-server.cjs" "$OUT/pages" "$PAGES_PORT" > "$OUT/pages-server.log" 2>&1 &
PAGES_PID=$!
sleep 1
node "$T/browser/stage09-test.cjs" "http://127.0.0.1:$PAGES_PORT/ai-exam-survival" > "$OUT/stage09-test.log" 2>&1
echo "stage09-test: $(grep -c '^PASS' "$OUT/stage09-test.log") pass, $(grep -c '^FAIL' "$OUT/stage09-test.log") fail"
{ kill "$PAGES_PID"; wait "$PAGES_PID"; } 2>/dev/null || true
