import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));
page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });

await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

const t0 = Date.now();
await page.evaluate(() => {
  window.__log = [];
  const scrim = document.getElementById('place-scrim');
  new MutationObserver(() => {
    window.__log.push([Date.now(), 'scrim ' + (scrim.classList.contains('on') ? 'ON' : 'off')]);
  }).observe(scrim, { attributes: true, attributeFilter: ['class'] });
  window.__t0 = Date.now();
});

console.log('empty-state visible:', await page.isVisible('#empty-state'));
console.log('editor visible:', await page.isVisible('#body-input'));
console.log('note count:', await page.$$eval('#note-list .note-item', n => n.length));
console.log('active note words:', await page.evaluate(() => document.getElementById('body-input').value.split(/\s+/).filter(Boolean).length));

await page.click('#btn-new-2').catch(e => console.log('btn-new-2 failed:', e.message.split('\n')[0]));
await page.waitForSelector('#body-input', { state: 'visible' });
console.log('after new-note, words:', await page.evaluate(() => document.getElementById('body-input').value.split(/\s+/).filter(Boolean).length));

await page.fill('#body-input', 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much, even though I feel completely alone in this city where no one understands what the work costs me. Everyone should be honest about what they want, but on balance the greater good was served and it was worth it for everyone involved. I keep coming back to the same pattern and part of me wonders whether the whole thing is pointless.');
console.log('fill done at +', Date.now() - t0, 'ms');

for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(1000);
  const on = await page.evaluate(() => document.getElementById('place-scrim').classList.contains('on'));
  if (on) { console.log('scrim ON at +', Date.now() - t0, 'ms'); break; }
}
console.log(await page.evaluate(() => (window.__log || []).map(([t, m]) => (t - window.__t0) + 'ms ' + m)));
await browser.close();
