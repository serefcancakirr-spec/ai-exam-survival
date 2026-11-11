#!/usr/bin/env bash
# Rebuilds the browser tab icon (Menti's face) from src/components/menti.tsx.
set -e
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"; APP="$ROOT/artifacts/ai-exam-survival"
ESBUILD="$(find "$ROOT/node_modules/.pnpm" -path '*esbuild@*/node_modules/esbuild/bin/esbuild' | head -1)"
OUT="$(mktemp -d)"
"$ESBUILD" "$ROOT/scripts/menti/make-favicon.tsx" --bundle --platform=node --jsx=automatic --outfile="$OUT/make.cjs" --log-level=error \
  --alias:react="$APP/node_modules/react" --alias:react-dom="$APP/node_modules/react-dom"
node "$OUT/make.cjs" "$APP/public/favicon.svg"
rm -rf "$OUT"
echo "favicon.svg updated"
