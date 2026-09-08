/* Selecting a world in 3D should re-centre, not cut. The orb you clicked
   grows into the centre over a readable span, and its connections arrive
   just behind it. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8765/index.html';
const NOTE = `I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much, even though I feel completely alone in this city where no one understands what the work costs me. Everyone should be honest about what they want, but on balance the greater good was served and it was worth it for everyone involved.`;

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

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#title', 'The job');
await page.fill('#body-input', NOTE);
await page.waitForTimeout(1400);
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(600);
await page.click('#gx-dim .seg-btn[data-dim="3"]');
await page.waitForTimeout(1600);

// Sampling hook: read the live scale of the centre and its orbit each frame.
await page.evaluate(() => {
  window.__samples = [];
  window.__sampling = false;
  const tick = () => {
    if (window.__sampling) {
      const s = window.PalinodeGraph3D.settleState();
      window.__samples.push({ t: performance.now(), ...s });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

check('settles at rest before a click', await page.evaluate(() => {
  const s = window.PalinodeGraph3D.settleState();
  return s.transition === 1 && Math.abs(s.centre - 1) < 0.001;
}));

const sel = await page.evaluate(() => window.PalinodeGraph.model.selected());
const targets = await page.evaluate(s =>
  window.PalinodeGraph3D.hitTargets().filter(t => t.id !== s), sel);
check('orbiting orbs available', targets.length > 0, targets.length + ' targets');

const t = targets[0];
await page.mouse.move(t.x, t.y);
await page.waitForTimeout(200);
const fresh = await page.evaluate(id =>
  window.PalinodeGraph3D.hitTargets().find(h => h.id === id), t.id);

await page.evaluate(() => { window.__samples = []; window.__sampling = true; });
await page.mouse.click(fresh.x, fresh.y);
await page.waitForTimeout(1100);
await page.evaluate(() => { window.__sampling = false; });

const s = await page.evaluate(() => window.__samples);
check('re-centred on the clicked orb', await page.evaluate(
  () => window.PalinodeGraph.model.selected()) === t.id);

const growing = s.filter(x => x.transition > 0 && x.transition < 1);
check('the centre animates rather than cuts', growing.length >= 12,
  growing.length + ' intermediate frames');

const first = growing[0], last = s[s.length - 1];
check('it starts small', first && first.centre < 0.75,
  first ? 'from ' + first.centre.toFixed(2) : 'no frames');
check('it ends at full size', Math.abs(last.centre - 1) < 0.01,
  'to ' + last.centre.toFixed(3));

// monotonic growth — no popping backwards
let monotonic = true;
for (let i = 1; i < growing.length; i++) {
  if (growing[i].centre < growing[i - 1].centre - 0.001) monotonic = false;
}
check('it only ever grows', monotonic);

// duration: long enough to read, short enough not to drag
const span = growing.length
  ? growing[growing.length - 1].t - growing[0].t : 0;
check('it takes about six hundred milliseconds', span > 380 && span < 900,
  Math.round(span) + 'ms');

// the orbit lags the centre, so the eye lands on the centre first
const mid = growing[Math.floor(growing.length * 0.3)];
check('connections arrive behind the centre', mid && mid.orbitOpacity < mid.centreProgress,
  mid ? 'orbit ' + mid.orbitOpacity.toFixed(2) + ' vs centre ' + mid.centreProgress.toFixed(2) : '');

// stepping back up the trail animates too
await page.evaluate(() => { window.__samples = []; window.__sampling = true; });
// empty space ascends — 30px into the graph, which now begins after the rail
const navW = await page.evaluate(
  () => document.querySelector('nav.sidenav').getBoundingClientRect().width);
await page.mouse.click(navW + 30, 700);
await page.waitForTimeout(1100);
await page.evaluate(() => { window.__sampling = false; });
const s2 = await page.evaluate(() => window.__samples);
const grow2 = s2.filter(x => x.transition > 0 && x.transition < 1);
check('going back up animates as well', grow2.length >= 12,
  grow2.length + ' intermediate frames');
check('back at the original centre', await page.evaluate(
  () => window.PalinodeGraph.model.selected()) === sel);

// the card under the centre tracks the growth instead of jumping
check('the card follows the centre', new Set(
  s.filter(x => x.transition > 0 && x.transition < 1).map(x => x.hudDrop)).size > 3,
  'distinct drops during the settle');

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
