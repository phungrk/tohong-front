// Sinh icon PNG từ public/favicon.svg (T-030). Chạy một lần, commit PNG; không phải dependency của app.
//   PLAYWRIGHT_PATH=/đường/dẫn/tới/playwright node scripts/gen-icons.mjs
// Nền đặc #FCF8F3, logo ở giữa, giữ tỉ lệ cạnh.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');

const svg = readFileSync(path.join(root, 'public/favicon.svg'), 'utf8');
const dataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
const BG = '#FCF8F3';

// logoRatio = chiều rộng logo / cạnh icon. Maskable giữ logo trong vòng tròn bán kính 40% cạnh.
const ICONS = [
  { file: 'public/icon-192.png', size: 192, logoRatio: 0.6 },
  { file: 'public/icon-512.png', size: 512, logoRatio: 0.6 },
  { file: 'public/icon-maskable-192.png', size: 192, logoRatio: 0.5 },
  { file: 'public/icon-maskable-512.png', size: 512, logoRatio: 0.5 },
  { file: 'public/apple-touch-icon.png', size: 180, logoRatio: 0.6 },
];

const browser = await chromium.launch();
for (const { file, size, logoRatio } of ICONS) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<body style="margin:0;background:${BG};width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center">`
    + `<img id="l" src="${dataUrl}" style="width:${Math.round(size * logoRatio)}px;height:auto"></body>`);
  await page.waitForFunction(() => document.getElementById('l').complete);
  writeFileSync(path.join(root, file), await page.screenshot({ type: 'png', omitBackground: false }));
  await page.close();
}
await browser.close();
