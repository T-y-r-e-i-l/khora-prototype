/* The HTML trail is the session's interaction history. New worlds
   append. Clicking a crumb walks the list without rebuilding it. */

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
await page.waitForTimeout(400);

const crumbs = () => page.evaluate(() =>
  [...document.querySelectorAll('#gx-trail .gx-crumb')].map(el => el.dataset.goto));

const stamp = () => page.evaluate(() => {
  [...document.querySelectorAll('#gx-trail .gx-crumb')].forEach((el, i) => {
    el.dataset.stamp = 's' + i;
  });
  return [...document.querySelectorAll('#gx-trail .gx-crumb')].map(el => el.dataset.stamp);
});

const stamps = () => page.evaluate(() =>
  [...document.querySelectorAll('#gx-trail .gx-crumb')].map(el => el.dataset.stamp || ''));

const current = () => page.evaluate(() => {
  const on = document.querySelector('#gx-trail .gx-crumb.on');
  return on ? on.dataset.goto : null;
});

check('the note opens as the first crumb', (await crumbs()).length === 1,
  (await crumbs()).join(','));

const descend = async () => page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  const seen = new Set(m.trail());
  const next = m.orbit(m.selected(), 12).find(n => !seen.has(n.id));
  if (next) m.select(next.id);
  return next ? next.id : null;
});

const a = await descend();
const b = await descend();
const c = await descend();
check('descended through three worlds', !!(a && b && c), [a, b, c].join(' → '));

const afterDescend = await crumbs();
const noteId = afterDescend[0];
check('new selections are appended, not reordered',
  afterDescend.join('|') === [noteId, a, b, c].join('|'),
  afterDescend.join(' → '));
check('the live crumb is the latest visit', await current() === c, await current());

const clickCrumb = id => page.evaluate(goto => {
  document.querySelector(`#gx-trail .gx-crumb[data-goto="${goto}"]`).click();
}, id);

const kept = await stamp();
await clickCrumb(a);
await page.waitForTimeout(200);

check('clicking an earlier crumb selects it',
  await page.evaluate(() => window.PalinodeGraph.model.selected()) === a);
check('going back does not rebuild the list',
  (await stamps()).join('|') === kept.join('|'),
  (await stamps()).join(','));
check('the list still holds the later visits',
  (await crumbs()).join('|') === [noteId, a, b, c].join('|'),
  (await crumbs()).join(' → '));
check('the live crumb moves back to that visit', await current() === a, await current());

await clickCrumb(c);
await page.waitForTimeout(200);

check('clicking a later crumb goes forward',
  await page.evaluate(() => window.PalinodeGraph.model.selected()) === c);
check('going forward still does not rebuild the list',
  (await stamps()).join('|') === kept.join('|'));
check('the live crumb moves forward again', await current() === c);

await clickCrumb(b);
await page.waitForTimeout(200);
const d = await descend();
check('a new world after walking back is available', !!d, d);

const afterNew = await crumbs();
check('a new selection appends after the kept history',
  afterNew.join('|') === [noteId, a, b, c, d].join('|'),
  afterNew.join(' → '));
check('earlier crumbs keep their identity when one is appended',
  (await stamps()).slice(0, kept.length).join('|') === kept.join('|'));
check('the live crumb is the newly appended visit', await current() === d);

check('Save as Pathway is enabled after a descent', await page.evaluate(
  () => !document.getElementById('gx-save-path').disabled));

const beforeDrop = await stamp();
const mid = afterNew[2];
await page.evaluate(id => {
  document.querySelector(`#gx-trail .gx-crumb[data-goto="${id}"] .gx-crumb-x`).click();
}, mid);
await page.waitForTimeout(150);
const afterDrop = await crumbs();
check('deleting a middle crumb keeps the others',
  afterDrop.join('|') === afterNew.filter(id => id !== mid).join('|'),
  afterDrop.join(' → '));
check('deleting a crumb does not rebuild the remaining ones',
  (await stamps()).join('|') === beforeDrop.filter((_, i) => afterNew[i] !== mid).join('|'));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
