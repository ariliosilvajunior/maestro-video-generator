// playwright-core resolvido dinamicamente (QCR-332: o path fixo do cache do npx apodreceu)
const fs = require('fs'), path = require('path');
function loadPlaywright() {
  const cands = [];
  // 1) the local install: cd reference-pipeline && npm install && npx playwright install chromium
  try { cands.push(require.resolve('playwright', { paths: [__dirname] })); } catch {} try { cands.push(require.resolve('playwright-core')); } catch {}
  const npx = path.join(process.env.HOME, '.npm', '_npx');
  try { for (const d of fs.readdirSync(npx)) for (const n of ['playwright-core', 'playwright']) { const c = path.join(npx, d, 'node_modules', n); if (fs.existsSync(path.join(c, 'package.json'))) cands.push(c); } } catch {}
  for (const c of cands) { try { const m = require(c); if (m && m.chromium) return m; } catch {} }
  throw new Error('playwright-core não encontrado');
}
const { chromium } = loadPlaywright();
(async () => {
  const url = process.argv[2], out = process.argv[3];
  if (!url || !out || url === '--help' || url === '-h') {
    console.error('usage: node headless_capture.cjs <url> <out.png>   (full-page screenshot, cookie banners + fixed bars removed)');
    process.exit(2);
  }
  const exe = process.env.MAESTRO_CHROMIUM;   // optional: point at a specific Chromium/Chrome binary
  let browser;
  try {
    browser = await chromium.launch({ ...(exe ? { executablePath: exe } : {}), headless: true, args: ['--no-sandbox'] });
  } catch (e) {
    console.error('[headless_capture] could not launch Chromium: ' + String(e.message || e).split('\n')[0]);
    console.error('  fix: cd reference-pipeline && npm install && npx playwright install chromium   (or set MAESTRO_CHROMIUM=/path/to/chrome)');
    process.exit(3);
  }
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  try { await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }); }
  catch { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); }
  await page.waitForTimeout(1500);
  for (const rx of [/accept all/i,/accept/i,/agree/i,/got it/i]) {
    try { const b = page.getByRole('button', { name: rx }).first(); if (await b.isVisible({ timeout: 300 })) { await b.click({ timeout: 600 }); break; } } catch {}
  }
  await page.evaluate(() => { document.querySelectorAll('body *').forEach(e => { const p = getComputedStyle(e).position; if (p==='fixed'||p==='sticky') e.style.setProperty('display','none','important'); }); });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(600);
  await page.screenshot({ path: out, fullPage: true });
  console.log('saved', out);
  await browser.close();
})();
