/* The standing profile: a commitment radar of placed spectra, then all
   27 axes grouped by branch. Nothing here writes a score from prose. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

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
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('#btn-profile');
await page.waitForTimeout(400);

check('Profile switches the centre', await page.evaluate(() => {
  const view = document.getElementById('profile-view');
  const ed = document.getElementById('editor-wrap');
  const body = document.getElementById('body');
  return view && !view.hidden
    && body.classList.contains('profile-mode')
    && (!ed || ed.hidden);
}));
check('Profile marks the rail', await page.evaluate(
  () => (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-profile'));

const total = await page.evaluate(() => window.PalinodeBeliefs.SPECTRA.length);
check('every spectrum is listed', (await page.$$('#profile-view .prof-axis')).length === total,
  total + ' expected');
check('coverage is stated', /0\s*of\s*27/.test(await page.textContent('#profile-view .prof-cov')),
  (await page.textContent('#profile-view .prof-cov')).trim());

const branches = await page.evaluate(() =>
  [...new Set(window.PalinodeBeliefs.SPECTRA.map(s => s.branch))]);
check('axes are grouped by branch',
  (await page.$$('#profile-view .prof-branch')).length === branches.length,
  branches.join(', '));

check('nothing is placed yet', (await page.$$('#profile-view .spec-mark.placed')).length === 0);
check('every axis offers to be placed',
  (await page.$$('#profile-view [data-place]')).length === total);
check('poles are named', (await page.$$('#profile-view .spec-poles')).length === total);
check('the empty radar has rings and no vertices', await page.evaluate(() => {
  const svg = document.querySelector('#prof-radar svg');
  if (!svg) return false;
  const rings = svg.querySelectorAll('.prof-ring');
  const verts = svg.querySelectorAll('.prof-vertex');
  return rings.length >= 3 && verts.length === 0;
}));

const axisId = await page.evaluate(
  () => document.querySelector('#profile-view [data-place]').dataset.place);
await page.click('#profile-view [data-place]');
await page.waitForTimeout(400);
check('the item overlay opens', await page.evaluate(
  () => document.getElementById('place-scrim').classList.contains('on')));
await page.click('#place-modal .place-opt');
await page.waitForTimeout(400);
const stored = await page.evaluate(id => window.PalinodeStore.Belief.score(id), axisId);
check('the answer is written', stored && stored.n === 1, JSON.stringify(stored));
await page.click('#place-modal [data-act="close"]');
await page.waitForTimeout(400);
check('the view redraws with the placement',
  (await page.$$('#profile-view .spec-mark.placed')).length === 1);
check('coverage moved', /1\s*of\s*27/.test(await page.textContent('#profile-view .prof-cov')));
check('the placed axis leads its branch', await page.evaluate(id => {
  const el = document.querySelector(`#profile-view .prof-axis[data-axis="${id}"]`);
  const branch = el && el.closest('.prof-branch');
  return !!(branch && branch.querySelector('.prof-axis') === el);
}, axisId));
check('the radar gained a vertex for the placement', await page.evaluate(id => {
  const verts = [...document.querySelectorAll('#prof-radar .prof-vertex')];
  const scores = Object.keys(window.PalinodeStore.Belief.scores());
  return verts.length === scores.length
    && verts.length === 1
    && verts[0].getAttribute('data-axis') === id;
}, axisId));

await page.reload({ waitUntil: 'networkidle' });
await page.click('#btn-profile');
await page.waitForTimeout(400);
check('it survives a reload', (await page.$$('#profile-view .spec-mark.placed')).length === 1);
check('the radar survives a reload', await page.evaluate(
  () => document.querySelectorAll('#prof-radar .prof-vertex').length === 1));

await page.locator('#prof-radar .prof-vertex .prof-hit').click();
await page.waitForTimeout(200);
check('a radar vertex scrolls to its axis', await page.evaluate(id => {
  const el = document.querySelector(`#profile-view .prof-axis[data-axis="${id}"]`);
  if (!el) return false;
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom > 0;
}, axisId));

await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#body-input', 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it. Everything was determined long before I arrived and none of it was mine to decide.');
await page.waitForTimeout(1600);
await page.click('#btn-profile');
await page.waitForTimeout(400);
check('writing prose places nothing new',
  (await page.$$('#profile-view .spec-mark.placed')).length === 1);
check('coverage is unchanged by prose',
  /1\s*of\s*27/.test(await page.textContent('#profile-view .prof-cov')));
check('prose adds no radar vertex', await page.evaluate(
  () => document.querySelectorAll('#prof-radar .prof-vertex').length === 1));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
