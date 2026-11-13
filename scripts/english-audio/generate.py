"""Records the Stage 21B listening texts as small MP3 files with the free, open-source Kokoro voice model.

Runs on our own computer once (no live AI, no paid service). Usage: see README.md.
  python generate.py passages.json <model.onnx> <voices.bin> <output folder>
"""
import json, subprocess, sys
import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

PAUSE_BETWEEN_SPEAKERS = 0.45  # seconds

def main():
    passages_json, model, voices, out = sys.argv[1:5]
    kokoro = Kokoro(model, voices)
    for passage in json.load(open(passages_json)):
        parts, rate = [], 24000
        for turn in passage['turns']:
            audio, rate = kokoro.create(turn['text'], voice=turn['voice'], speed=passage['speed'], lang=turn['lang'])
            parts += [audio, np.zeros(int(rate * PAUSE_BETWEEN_SPEAKERS), dtype=audio.dtype)]
        wav = f"{out}/{passage['id']}.wav"
        sf.write(wav, np.concatenate(parts), rate)
        # mono, 40 kbit/s: small files that are still clear for speech
        subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', wav, '-ac', '1', '-b:a', '40k', f"{out}/{passage['id']}.mp3"], check=True)
        subprocess.run(['rm', wav], check=True)
        print(passage['id'], f"{sum(len(p) for p in parts) / rate:.1f}s")

if __name__ == '__main__':
    main()
