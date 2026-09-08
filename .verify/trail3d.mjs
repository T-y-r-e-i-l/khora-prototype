/* A physical trail in the 3D graph: previous crumbs as orbs on a path
   into the centre, connected, turning slowly, still clickable. */

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

check('3D mounted', await page.isVisible('#gx-3d canvas'));
check('HTML trail chrome still present', await page.isVisible('#gx-trail'));

const atRest = await page.evaluate(() => window.PalinodeGraph3D.trailState());
check('no extra trail when only the centre is on it', atRest.count === 0,
  'count ' + atRest.count);
check('no connector with a single crumb', atRest.connectors === false);
check('centre is the selected node', atRest.centreId ===
  await page.evaluate(() => window.PalinodeGraph.model.selected()));

const descend = async () => page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  const seen = new Set(m.trail());
  const next = m.orbit(m.selected(), 12).find(n => !seen.has(n.id));
  if (next) m.select(next.id);
  return next ? next.id : null;
});

const a = await descend();
await page.waitForTimeout(900);
const b = await descend();
await page.waitForTimeout(900);
const c = await descend();
await page.waitForTimeout(900);

check('descended through three worlds', !!(a && b && c), [a, b, c].join(' → '));

const after = await page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  const t = window.PalinodeGraph3D.trailState();
  return { modelTrail: m.trail(), selected: m.selected(), ...t };
});

check('model trail has the centre plus history', after.modelTrail.length >= 4,
  after.modelTrail.length + ' crumbs');
check('3D trail reuses that same history',
  after.ids.join('|') === after.modelTrail.slice(0, -1).join('|'),
  after.ids.join(' → '));
check('trail meshes exist for every previous crumb',
  after.count === after.modelTrail.length - 1 && after.positions.length === after.count,
  after.count + ' orbs, ' + after.positions.length + ' positions');
check('a ribbon connects them', after.connectors === true);
check('centre id matches the selected node', after.centreId === after.selected,
  after.centreId);
check('HTML crumbs still match the model', await page.evaluate(() => {
  const ids = window.PalinodeGraph.model.trail();
  const crumbs = [...document.querySelectorAll('#gx-trail .gx-crumb')]
    .map(el => el.dataset.goto);
  return crumbs.join('|') === ids.join('|') && crumbs.length === ids.length;
}));

await page.screenshot({ path: '.verify/trail3d.png' });

// Motion: positions change continuously, never teleport.
const motion = await page.evaluate(async () => {
  const samples = [];
  const t0 = performance.now();
  while (performance.now() - t0 < 1100) {
    const s = window.PalinodeGraph3D.trailState();
    samples.push({ t: performance.now(), spin: s.spin, positions: s.positions });
    await new Promise(r => requestAnimationFrame(r));
  }
  return samples;
});

check('sampled trail motion', motion.length >= 20, motion.length + ' frames');

let maxStep = 0, totalMove = 0, teleported = false;
if (motion.length >= 2 && motion[0].positions.length) {
  const id = motion[0].positions[0].id;
  let prev = motion[0].positions.find(p => p.id === id);
  for (let i = 1; i < motion.length; i++) {
    const cur = motion[i].positions.find(p => p.id === id);
    if (!prev || !cur) continue;
    const dt = Math.max(1, motion[i].t - motion[i - 1].t);
    const d = Math.hypot(cur.x - prev.x, cur.y - prev.y, cur.z - prev.z);
    maxStep = Math.max(maxStep, d);
    totalMove += d;
    // ~0.022 rad/s at r≤6.2 is < 0.14 units/s; 48ms clamped dt still << 0.5
    if (d > 0.5) teleported = true;
    prev = cur;
  }
}
check('trail orbs actually move', totalMove > 0.02, 'travelled ' + totalMove.toFixed(3));
check('motion is continuous, not a teleport', !teleported && maxStep < 0.45,
  'max step ' + maxStep.toFixed(4));
const spinDelta = motion[motion.length - 1].spin - motion[0].spin;
check('trail spin advances on the clock', spinDelta > 0.01 && spinDelta < 0.08,
  'Δspin ' + spinDelta.toFixed(4) + ' over ~1.1s');

// Reduced motion: the extra trail revolution holds still.
await page.emulateMedia({ reducedMotion: 'reduce' });
await page.waitForTimeout(80);
const rm = await page.evaluate(async () => {
  const a = window.PalinodeGraph3D.trailState();
  await new Promise(r => setTimeout(r, 500));
  const b = window.PalinodeGraph3D.trailState();
  const p0 = a.positions[0], p1 = b.positions[0];
  const d = (p0 && p1) ? Math.hypot(p1.x - p0.x, p1.y - p0.y, p1.z - p0.z) : 0;
  return { flagged: b.reducedMotion, dSpin: b.spin - a.spin, d };
});
check('reduced-motion is reported', rm.flagged === true);
check('trail spin stops under reduced motion', Math.abs(rm.dSpin) < 1e-6,
  'Δspin ' + rm.dSpin);
check('trail pose stays put under reduced motion', rm.d < 0.002,
  'moved ' + rm.d.toFixed(5));

await page.emulateMedia({ reducedMotion: 'no-preference' });
await page.waitForTimeout(80);

// Click a non-centre trail orb: the existing settle still runs.
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

const trailId = after.ids[0];
check('a non-centre trail orb to click', !!trailId && trailId !== after.centreId, trailId);

const hit = await page.evaluate(id =>
  window.PalinodeGraph3D.hitTargets().find(h => h.id === id), trailId);
check('trail orb is hittable on screen', !!(hit && hit.x > 0 && hit.y > 0),
  hit ? hit.x + ',' + hit.y : 'missing');

if (hit) {
  await page.mouse.move(hit.x, hit.y);
  await page.waitForTimeout(220);
  const fresh = await page.evaluate(id =>
    window.PalinodeGraph3D.hitTargets().find(h => h.id === id), trailId);
  await page.evaluate(() => { window.__samples = []; window.__sampling = true; });
  await page.mouse.click(fresh.x, fresh.y);
  await page.waitForTimeout(1100);
  await page.evaluate(() => { window.__sampling = false; });
}

const settledOn = await page.evaluate(() => window.PalinodeGraph.model.selected());
check('clicking a trail orb recentres on it', settledOn === trailId, settledOn);

const samples = await page.evaluate(() => window.__samples || []);
const growing = samples.filter(x => x.transition > 0 && x.transition < 1);
check('recentring still animates the settle', growing.length >= 12,
  growing.length + ' intermediate frames');
if (growing.length) {
  check('the new centre grows rather than cuts', growing[0].centre < 0.9,
    'from ' + growing[0].centre.toFixed(2));
}

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
