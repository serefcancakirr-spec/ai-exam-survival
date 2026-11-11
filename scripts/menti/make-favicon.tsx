// Stage 10: writes artifacts/ai-exam-survival/public/favicon.svg (Menti's face) from the Menti component.
// Run from the repository root: bash scripts/menti/make-favicon.sh
import { writeFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { MentiArt } from '../../artifacts/ai-exam-survival/src/components/menti';

const svg = renderToStaticMarkup(<MentiArt pose="wave" faceOnly />)
  .replace(' aria-hidden="true"', '')
  .replace(' class="h-full w-full overflow-visible"', ' xmlns="http://www.w3.org/2000/svg"')
  .replace(/ class="menti-[a-z-]+"/g, '')
  .replace(/ style="transform-origin:[^"]*"/g, '');
writeFileSync(process.argv[2], `${svg}\n`);
