# English listening recordings (Stage 21B)

The listening texts in `artifacts/ai-exam-survival/src/pages/english-passages.ts` are recorded once as MP3 files in
`artifacts/ai-exam-survival/public/audio/en/<passage id>.mp3`. They are made on our own computer with the free,
open-source [Kokoro](https://github.com/thewh1teagle/kokoro-onnx) voice model (Apache 2.0). No live AI and no paid
service are used, and the site only plays the finished files.

Each speaker in a text has an age, a gender and a matching voice (`V` in `english-passages.ts`). Speed depends on the
level (`LISTENING_SPEED`: A1 slow and clear, C1 natural).

## Re-recording after a text changes

```bash
# once: the model files (about 350 MB, not kept in the repository)
curl -L -o kokoro-v1.0.onnx https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -L -o voices-v1.0.bin https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
python3 -m venv venv && ./venv/bin/pip install kokoro-onnx soundfile   # ffmpeg must be installed too

# from the repository root
ESBUILD="$(find node_modules/.pnpm -path '*esbuild@*/node_modules/esbuild/bin/esbuild' | head -1)"
"$ESBUILD" scripts/english-audio/export-passages.ts --bundle --platform=node --outfile=/tmp/export.cjs --log-level=error
node /tmp/export.cjs > /tmp/passages.json
./venv/bin/python scripts/english-audio/generate.py /tmp/passages.json kokoro-v1.0.onnx voices-v1.0.bin artifacts/ai-exam-survival/public/audio/en
```

Then run `bash tests/run-tests.sh`: `stage21b-model` checks that every listening text has its recording.
