/* The 2D panel should arrive top to bottom on every render — each band
   delayed by its place in the reading order, list rows included. */

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
await page.click('#constellation');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(900);

// open a concept panel, which has the richest structure
await page.click('#gx-nodes .gx-concept');
await page.waitForTimeout(700);

const read = () => page.evaluate(() => {
  const host = document.querySelector('#gx-panel .gx-panel-body');
  const bands = [...host.querySelectorAll(':scope > *, .gx-more-row')];
  return bands.map(el => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      cls: el.className || '',
      i: cs.getPropertyValue('--i').trim(),
      delay: cs.animationDelay,
      name: cs.animationName,
      top: Math.round(el.getBoundingClientRect().top)
    };
  });
});

const bands = await read();
check('panel has several bands', bands.length >= 5, bands.length + ' bands');
check('every band is stamped with an index', bands.every(b => b.i !== ''),
  bands.filter(b => b.i === '').length + ' unstamped');
check('every band runs the reveal', bands.every(b => b.name === 'gx-band'));

// indices must ascend with vertical position — that is what "top to bottom" means
const idx = bands.map(b => Number(b.i));
let ascending = true;
for (let k = 1; k < idx.length; k++) if (idx[k] < idx[k - 1]) ascending = false;
check('indices follow the reading order', ascending, idx.join(','));

const sorted = [...bands].sort((a, b) => a.top - b.top);
let matchesLayout = true;
for (let k = 1; k < sorted.length; k++) {
  if (Number(sorted[k].i) < Number(sorted[k - 1].i)) matchesLayout = false;
}
check('a band lower on screen never arrives first', matchesLayout);

const delays = bands.map(b => parseFloat(b.delay) * (b.delay.includes('ms') ? 1 : 1000));
check('the first band has no delay', delays[0] === 0, bands[0].cls || bands[0].tag);
check('later bands are delayed', Math.max(...delays) > 60,
  'last ' + Math.max(...delays) + 'ms');
check('the cascade stays under half a second', Math.max(...delays) <= 380,
  Math.max(...delays) + 'ms of stagger');

// list rows cascade rather than landing as one block
const rows = bands.filter(b => /gx-more-row/.test(b.cls));
check('list rows are their own bands', rows.length >= 3, rows.length + ' rows');
const rowIdx = rows.map(r => Number(r.i));
check('rows step one after another', new Set(rowIdx).size > 1,
  rowIdx.join(','));

// it must re-run on the next node, not only the first render
await page.click('#gx-panel .gx-more-row');
await page.waitForTimeout(120);
const mid = await page.evaluate(() => {
  const els = [...document.querySelectorAll('#gx-panel .gx-panel-body > *')];
  return els.map(e => Number(Number(getComputedStyle(e).opacity).toFixed(2)));
});
check('a fresh panel is still arriving mid-cascade',
  mid.some(o => o < 1) && mid.some(o => o > 0),
  mid.join(','));

await page.waitForTimeout(800);
const settled = await page.evaluate(() =>
  [...document.querySelectorAll('#gx-panel .gx-panel-body > *, #gx-panel .gx-more-row')]
    .every(e => getComputedStyle(e).opacity === '1'));
check('everything is fully visible once settled', settled);

await page.screenshot({ path: '.verify/pr-settled.png' });

// reduced motion gets the content without the cascade
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const p2 = await ctx2.newPage();
await p2.goto(URL, { waitUntil: 'networkidle' });
await p2.click('#btn-new');
await p2.waitForSelector('#body-input', { state: 'visible' });
await p2.fill('#body-input', NOTE);
await p2.waitForTimeout(1200);
await p2.click('#constellation');
await p2.waitForSelector('#graph:not([hidden])');
await p2.waitForTimeout(900);
const rm = await p2.evaluate(() => {
  const els = [...document.querySelectorAll('#gx-panel .gx-panel-body > *')];
  return { n: els.length, names: [...new Set(els.map(e => getComputedStyle(e).animationName))],
           opaque: els.every(e => getComputedStyle(e).opacity === '1') };
});
check('reduced motion drops the animation', rm.n === 0 || rm.names.every(n => n === 'none'),
  rm.names.join(','));
check('reduced motion still shows the content', rm.n === 0 || rm.opaque);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
