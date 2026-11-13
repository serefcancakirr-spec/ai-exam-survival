// Prints the listening texts (with each speaker's voice) as JSON for generate.py.
import { ENGLISH_PASSAGES, LISTENING_SPEED } from '../../artifacts/ai-exam-survival/src/pages/english-passages';
const listening = ENGLISH_PASSAGES.filter((p) => p.kind === 'listening').map((p) => ({
  id: p.id,
  speed: LISTENING_SPEED[p.level],
  turns: p.lines.map((line) => ({ voice: p.speakers![line.speaker!].voice, lang: p.speakers![line.speaker!].accent, text: line.text })),
}));
console.log(JSON.stringify(listening));
