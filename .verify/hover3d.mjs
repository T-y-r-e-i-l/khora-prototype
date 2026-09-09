/* The 3D view read by hover: naming a world should not cost a click, the
   orbit should slow while you read, and the centre card must not jitter. */

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
await page.waitForTimeout(600);
await page.click('#gx-dim .seg-btn[data-dim="3"]');
await page.waitForTimeout(1400);

check('3D mounted', await page.isVisible('#gx-3d canvas'));
check('tip element exists', (await page.$$('#gx-3d .gx-tip')).length === 1);
check('tip starts hidden', !(await page.evaluate(
  () => document.querySelector('.gx-tip').classList.contains('on'))));

// Hover an orbiting world, not the centre: the centre's card is already
// open below it, so it deliberately has no tip.
const centreSel = await page.evaluate(() => window.PalinodeGraph.model.selected());
const targets = await page.evaluate(sel =>
  window.PalinodeGraph3D.hitTargets().filter(t => t.id !== sel), centreSel);
check('a centre is selected', !!centreSel);
check('orbiting orbs are hittable', targets.length > 0, targets.length + ' targets');

const t = targets[0];
await page.mouse.move(t.x, t.y);
await page.waitForTimeout(260);

const hov = await page.evaluate(() => {
  const tip = document.querySelector('.gx-tip');
  const r = tip.getBoundingClientRect();
  return {
    on: tip.classList.contains('on'),
    title: (tip.querySelector('.gx-tip-title') || {}).textContent || '',
    line: (tip.querySelector('.gx-tip-line') || {}).textContent || '',
    x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width),
    cursor: document.querySelector('#gx-3d canvas').classList.contains('over')
  };
});
check('tip shows on hover', hov.on);
check('tip names the world', hov.title.trim().length > 0, hov.title.trim());
check('tip carries a line of substance', hov.line.trim().length > 20,
  hov.line.trim().slice(0, 60));
check('tip sits near the orb', Math.abs(hov.x - t.x) < 420 && Math.abs(hov.y - t.y) < 320,
  `tip ${hov.x},${hov.y} vs orb ${t.x},${t.y}`);
check('tip stays on canvas', hov.x >= 0 && hov.x + hov.w <= 1440);
check('cursor signals a target', hov.cursor);

// the orbit slows to a quarter while hovering
const spinWhileHovering = await page.evaluate(async () => {
  const read = () => window.PalinodeGraph3D.orbitPhase();
  const a = read();
  await new Promise(r => setTimeout(r, 500));
  return read() - a;
});
await page.mouse.move(20, 20);
await page.waitForTimeout(260);
const spinFree = await page.evaluate(async () => {
  const read = () => window.PalinodeGraph3D.orbitPhase();
  const a = read();
  await new Promise(r => setTimeout(r, 500));
  return read() - a;
});
const ratio = spinFree > 0 ? spinWhileHovering / spinFree : 1;
check('orbit slows to about a quarter on hover', ratio > 0.15 && ratio < 0.4,
  'ratio ' + ratio.toFixed(2));
check('orbit never fully stops', spinWhileHovering > 0);
check('tip hides when the pointer leaves', await page.evaluate(
  () => !document.querySelector('.gx-tip').classList.contains('on')));

// the centre card must hold still while the field turns
const drift = await page.evaluate(async () => {
  const hud = document.querySelector('.gx-hud');
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    seen.add(hud.style.transform);
    await new Promise(r => requestAnimationFrame(r));
  }
  return seen.size;
});
check('centre card does not jitter', drift === 1, drift + ' distinct transforms over 40 frames');

// hovering the centre adds nothing: its card is already open beneath it
const centreXY = await page.evaluate(sel =>
  window.PalinodeGraph3D.hitTargets().find(t => t.id === sel), centreSel);
if (centreXY) {
  await page.mouse.move(centreXY.x, centreXY.y);
  await page.waitForTimeout(220);
  check('no tip on the selected centre', await page.evaluate(() =>
    !document.querySelector('.gx-tip').classList.contains('on')));
  check('the centre still registers as hovered', await page.evaluate(() =>
    !!window.PalinodeGraph3D.hovered()));
}

// The field is still turning, so the orb has drifted since it was measured.
// Re-read its position with the pointer already on it (hover slows the
// orbit, which is what makes a moving target clickable at all).
await page.mouse.move(t.x, t.y);
await page.waitForTimeout(200);
const fresh = await page.evaluate(id =>
  window.PalinodeGraph3D.hitTargets().find(h => h.id === id), t.id);
await page.mouse.move(fresh.x, fresh.y);
await page.waitForTimeout(120);
await page.mouse.click(fresh.x, fresh.y);
await page.waitForTimeout(1400);
check('clicking a hovered orb re-centres', await page.evaluate(
  () => window.PalinodeGraph.model.selected()) !== centreSel);
check('tip cleared after re-centring', await page.evaluate(
  () => !document.querySelector('.gx-tip').classList.contains('on')));

// back to 2D and out, with nothing broken behind us
await page.click('#gx-dim .seg-btn[data-dim="2"]');
await page.waitForTimeout(700);
check('2D still works', await page.isVisible('#gx-nodes'));
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check('graph closed', await page.isHidden('#graph'));
check('tip removed on unmount', (await page.$$('.gx-tip')).length === 0);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
