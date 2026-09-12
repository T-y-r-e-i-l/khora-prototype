/* First-visit coach marks: Explore once, then Notes once, no repeat. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { mockKhora } from './khora-mock.mjs';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await mockKhora(page);
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#graph:not([hidden])', { timeout: 10000 });
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 });

const tip1 = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  const prog = document.getElementById('coach-progress');
  return {
    shown: tip && !tip.hidden,
    body: body && body.textContent,
    progress: prog && prog.textContent,
    tours: (JSON.parse(localStorage.getItem('palinode.v1') || '{}').prefs || {}).tours
  };
});
check('Explore coach tip appears on first visit', tip1.shown, tip1.body);
check('Explore tip shows step progress', /^1 of \d+$/.test(tip1.progress || ''), tip1.progress);

// Advance through Explore steps
let guard = 0;
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 8) break;
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}
check('Explore tour finishes after Next/Done', !(await page.isVisible('#coach-tip')));

const afterExplore = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return (raw.prefs && raw.prefs.tours) || {};
});
check('Explore marked done in prefs', !!afterExplore.explore, JSON.stringify(afterExplore));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#graph:not([hidden])', { timeout: 10000 });
await page.waitForTimeout(500);
const noRepeat = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  return !tip || tip.hidden;
});
check('Explore tip does not return after reload', noRepeat);

// Notes tour
await page.click('#btn-rail');
await page.waitForTimeout(400);
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 }).catch(() => null);
const tipWrite = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  return { shown: tip && !tip.hidden, body: body && body.textContent };
});
check('Notes coach tip appears on first Notes visit', tipWrite.shown, tipWrite.body);

guard = 0;
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 8) break;
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}
check('Notes tour finishes', !(await page.isVisible('#coach-tip')));

const afterWrite = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return (raw.prefs && raw.prefs.tours) || {};
});
check('Notes marked done in prefs', !!afterWrite.write, JSON.stringify(afterWrite));

await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
await page.waitForTimeout(400);
await page.click('#btn-rail');
await page.waitForTimeout(400);
const noWriteRepeat = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  return !tip || tip.hidden;
});
check('Notes tip does not return on second visit', noWriteRepeat);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
