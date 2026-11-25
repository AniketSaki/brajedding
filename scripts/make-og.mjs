// Renders the WhatsApp/Twitter link-preview image to public/og.png.
import sharp from 'sharp';

const strip = Array.from({ length: 56 }, (_, i) => `<rect x="${i * 22 + 7}" y="8" width="8" height="8" fill="#fff"/>`).join('');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><pattern id="d" width="16" height="16" patternUnits="userSpaceOnUse"><circle cx="8" cy="8" r="2.4" fill="#fff" opacity="0.16"/></pattern></defs>
  <rect width="1200" height="630" fill="#001489"/><rect width="1200" height="630" fill="url(#d)"/>
  <rect width="1200" height="24" fill="#000"/>${strip}
  <rect y="606" width="1200" height="24" fill="#000"/><g transform="translate(0,598)">${strip}</g>
  <g transform="translate(70,90)">
    <rect width="640" height="52" fill="#fff" stroke="#111" stroke-width="4"/>
    <circle cx="30" cy="26" r="9" fill="#e00"/>
    <text x="52" y="35" font-family="Arial, sans-serif" font-weight="700" font-size="22" letter-spacing="2" fill="#001489">STREAMING LIVE SOON FROM GURUVAYUR</text>
  </g>
  <g transform="translate(70,0) rotate(-2 500 320)" font-family="Arial Black, Impact, sans-serif" font-size="80">
    <text x="-5" y="285" fill="#00e5ff">BRAJESH &amp; SARANYA:</text><text x="5" y="285" fill="#ff4f9a">BRAJESH &amp; SARANYA:</text><text x="0" y="285" fill="#fff">BRAJESH &amp; SARANYA:</text>
    <text x="-5" y="385" fill="#00e5ff">THE WEDDING</text><text x="5" y="385" fill="#ff4f9a">THE WEDDING</text><text x="0" y="385" fill="#fff">THE WEDDING</text>
  </g>
  <text x="70" y="510" font-family="Arial, sans-serif" font-weight="700" font-size="26" letter-spacing="4" fill="#c8c8c8">BROUGHT TO YOU BY <tspan fill="#fff">DATING SPLINTER</tspan></text>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(new URL('../public/og.png', import.meta.url).pathname);
console.log('og.png written');
