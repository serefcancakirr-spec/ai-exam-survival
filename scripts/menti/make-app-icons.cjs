// Stage 23: draws the app icons (Menti's face on the deep colour of the home hero, teacher's choice A; Stage 26: deep teal)
// from public/favicon.svg. Run after changing the favicon: node scripts/menti/make-app-icons.cjs
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const APP = path.resolve(__dirname, '../../artifacts/ai-exam-survival');
const OUT = path.join(APP, 'public/icons');
const face = fs.readFileSync(path.join(APP, 'public/favicon.svg'));
const faceUri = `data:image/svg+xml;base64,${face.toString('base64')}`;
const BLUE = '#1d4748';

// name, size in pixels, face width as a share of the size.
// Maskable icons are cut to a circle (safe zone = 80 % circle), so the face is smaller there.
const ICONS = [
  ['icon-192.png', 192, 0.78],
  ['icon-512.png', 512, 0.78],
  ['icon-maskable-192.png', 192, 0.6],
  ['icon-maskable-512.png', 512, 0.6],
  ['apple-touch-icon.png', 180, 0.74],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, size, share] of ICONS) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<body style="margin:0"><div style="width:${size}px;height:${size}px;background:${BLUE};display:grid;place-items:center"><img src="${faceUri}" style="width:${Math.round(size * share)}px"></div></body>`);
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: path.join(OUT, name) });
    await page.close();
  }
  await browser.close();
  console.log('app icons updated in public/icons');
})();
