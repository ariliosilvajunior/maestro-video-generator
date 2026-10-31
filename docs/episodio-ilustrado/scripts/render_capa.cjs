const { chromium } = require('playwright');
(async () => {
  const [src, out, w, h] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h } });
  await p.goto('file://' + src); await p.waitForTimeout(1000);
  await p.screenshot({ path: out, clip: { x: 0, y: 0, width: +w, height: +h } });
  await b.close(); console.log('OK', out);
})();
