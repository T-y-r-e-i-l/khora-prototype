/* Save a curated trail as a pathway, walk it, and add a note. */

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

const descend = async () => page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  const seen = new Set(m.trail());
  const next = m.orbit(m.selected(), 12).find(n => !seen.has(n.id));
  if (next) m.select(next.id);
  return next ? next.id : null;
});

const a = await descend();
await descend();
await descend();
check('descended far enough to save', !!a);

await page.click('#gx-save-path');
await page.waitForSelector('#path-save-scrim.on');
check('Save as Pathway opens the name modal', await page.isVisible('#path-save-name'));
await page.fill('#path-save-name', 'A short walk');
await page.click('#path-save-confirm');
await page.waitForTimeout(200);
check('the pathway is stored', await page.evaluate(
  () => window.PalinodeStore.Pathways.all().some(p => p.title === 'A short walk')));

await page.click('#gx-close');
await page.waitForTimeout(200);
await page.click('#btn-pathways');
await page.waitForTimeout(250);
check('the library lists the saved walk', await page.evaluate(
  () => /A short walk/.test(document.getElementById('path-list').textContent)));

await page.click('.path-card[data-open]');
await page.waitForSelector('#pathway-walk:not([hidden])');
const firstPos = await page.textContent('#walk-pos');
check('the walk opens on the first step', /^1 \//.test(firstPos.trim()), firstPos);

const before = await page.textContent('#walk-body h3');
await page.click('#walk-next');
await page.waitForTimeout(150);
const after = await page.textContent('#walk-body h3');
check('Next changes the step', after !== before, before + ' → ' + after);

const lenBefore = await page.evaluate(() => window.PalinodeStore.Pathways.all()[0].steps.length);
await page.click('#walk-add-note');
await page.waitForTimeout(80);
const added = await page.evaluate(() => {
  const btn = document.querySelector('#walk-picker [data-add-note]');
  if (!btn) return false;
  btn.click();
  return true;
});
check('a journal note can be added as a step', added);
await page.waitForTimeout(150);
const lenAfter = await page.evaluate(() => window.PalinodeStore.Pathways.all()[0].steps.length);
check('adding a note lengthens the walk', lenAfter === lenBefore + 1, lenBefore + ' → ' + lenAfter);

await page.click('#walk-close');
await page.waitForTimeout(150);
check('Close returns to the library', await page.evaluate(
  () => !document.getElementById('pathways').hidden && document.getElementById('pathway-walk').hidden));

await page.click('.path-card[data-open]');
await page.waitForSelector('#pathway-walk:not([hidden])');
await page.click('#walk-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(400);
const graph = await page.evaluate(() => {
  const ids = [...window.PalinodeGraph.model.all().keys()];
  const trail = window.PalinodeGraph.model.trail();
  const extra = ids.filter(id => !trail.includes(id));
  return {
    title: document.getElementById('gx-title-text').textContent,
    connHidden: document.getElementById('gx-conn').hidden,
    connOn: document.getElementById('gx-conn-toggle').checked,
    extras: extra.length
  };
});
check('Open in Explore uses the pathway title', graph.title === 'A short walk', graph.title);
check('Connections starts hidden off', graph.connHidden === false && graph.connOn === false);
check('the pathway graph shows only curated nodes', graph.extras === 0, graph.extras + ' extras');

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
