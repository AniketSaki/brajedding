// Generates placeholder photos for the Stickered gallery. Delete them once real photos arrive.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const out = new URL('../src/assets/stills/', import.meta.url);
mkdirSync(out, { recursive: true });
const colors = [['#ff4f9a', '#111'], ['#00e5ff', '#111'], ['#001489', '#fff'], ['#ffe94d', '#111']];

for (const [i, [bg, fg]] of colors.entries()) {
  const n = String(i + 1).padStart(2, '0');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1500">
    <defs><pattern id="d" width="28" height="28" patternUnits="userSpaceOnUse">
      <circle cx="14" cy="14" r="5" fill="${fg}" opacity="0.18"/></pattern></defs>
    <rect width="100%" height="100%" fill="${bg}"/><rect width="100%" height="100%" fill="url(#d)"/>
    <text x="50%" y="48%" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="420" fill="${fg}">${n}</text>
    <text x="50%" y="62%" text-anchor="middle" font-family="Arial, sans-serif" font-weight="700" font-size="64" fill="${fg}">PHOTO OF BRAJESH GOES HERE</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toFile(new URL(`placeholder-${n}.jpg`, out).pathname);
}
console.log('placeholders written');
