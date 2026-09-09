// NODE_PATH is ignored for ESM, so the npx-cached install is imported by path.
import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8765/index.html';
const NOTE = `I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much, even though I feel completely alone in this city where no one understands what the work costs me. Everyone should be honest about what they want, but on balance the greater good was served and it was worth it for everyone involved. I keep coming back to the same pattern and part of me wonders whether the whole thing is pointless.`;

const log = [];
const fail = [];
const check = (name, ok, detail = '') => {
  (ok ? log : fail).push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => {
  if (m.type() === 'error' && !/favicon|404/.test(m.text())) errors.push('console: ' + m.text());
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#title', 'The job');
await page.fill('#body-input', NOTE);
await page.waitForTimeout(1200);

/* ---------- 2D: spectra grow out of the concepts ---------- */
await page.click('#constellation');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(1200);

const specNodes = await page.$$('#gx-nodes .gx-spectrum');
check('spectrum nodes on the canvas', specNodes.length > 0, specNodes.length + ' nodes');
check('at least one is leaning', (await page.$$('#gx-nodes .gx-spectrum.leaning')).length > 0);
check('spectrum nodes are labelled', (await page.$$('#gx-nodes .gx-spectrum.labelled')).length === specNodes.length);

// every spectrum node must be tied to a concept, not floating
const wired = await page.evaluate(() => {
  const m = window.PalinodeGraph.model.all();
  const ids = [...m.values()].filter(n => n.type === 'spectrum').map(n => n.id);
  const lines = [...document.querySelectorAll('#gx-edges line')];
  return { ids, edges: lines.length };
});
check('the field has edges', wired.edges > 0, wired.edges + ' edges');

/* ---------- 2D panel for a spectrum ---------- */
await page.click('#gx-nodes .gx-spectrum');
await page.waitForTimeout(700);
const panel = await page.textContent('#gx-panel .gx-panel-body');
check('panel opened on the spectrum', /tentative|unplaced|placed/i.test(panel), panel.slice(0, 60));
check('poles rendered in the panel', (await page.$$('#gx-panel .spec-poles i')).length === 2);
check('continuum rendered in the panel', (await page.$$('#gx-panel .spec-track')).length === 1);
check('argument ticks in the panel', (await page.$$('#gx-panel .spec-arg')).length > 0);
check('tentative tick in the panel', (await page.$$('#gx-panel .spec-mark.tentative')).length === 1);
check('no placed tick yet', (await page.$$('#gx-panel .spec-mark.placed')).length === 0);
check('place yourself offered', await page.isVisible('#gx-panel [data-act="place"]'));
check('where this leads still present', /Where this leads/.test(panel));
await page.screenshot({ path: '.verify/g1-spectrum-panel.png' });

/* ---------- answering from the graph ---------- */
const axisId = await page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  return m.node(m.selected()).ref;
});
await page.click('#gx-panel [data-act="place"]');
await page.waitForTimeout(450);
check('overlay opens over the graph', await page.isVisible('#place-scrim'));
const overBox = await page.evaluate(() => {
  const s = document.getElementById('place-scrim');
  const g = document.getElementById('graph');
  return {
    scrim: Number(getComputedStyle(s).zIndex),
    graph: Number(getComputedStyle(g).zIndex),
    clickable: document.elementFromPoint(720, 450)?.closest('#place-scrim') !== null
  };
});
check('overlay stacks above the graph', overBox.scrim > overBox.graph,
  'scrim ' + overBox.scrim + ' vs graph ' + overBox.graph);
check('overlay actually receives the pointer', overBox.clickable);
await page.screenshot({ path: '.verify/g2-place-over-graph.png' });

await page.click('#place-modal .place-opt');
await page.waitForTimeout(400);
check('result shown', await page.isVisible('#place-modal .place-result'));
await page.click('#place-modal [data-act="close"]');
await page.waitForTimeout(400);
check('graph still open after answering', await page.isVisible('#graph'));

const after = await page.textContent('#gx-panel .gx-panel-body');
check('panel refreshed to placed', /Answer another/.test(after));
check('placed tick now drawn', (await page.$$('#gx-panel .spec-mark.placed')).length === 1);
const stored = await page.evaluate(id => window.PalinodeStore.Belief.score(id), axisId);
check('answer written to the profile', stored && stored.n === 1, JSON.stringify(stored));
await page.screenshot({ path: '.verify/g3-panel-placed.png' });

/* ---------- concept panel names the spectra it sits on ---------- */
await page.click('#gx-nodes .gx-concept.in-note');
await page.waitForTimeout(600);
const cpanel = await page.textContent('#gx-panel .gx-panel-body');
check('concept panel lists its spectra', /Sits on/.test(cpanel));
const hop = await page.$('#gx-panel [data-type="spectrum"]');
check('spectra are reachable from the concept', !!hop);
if (hop) {
  await hop.click();
  await page.waitForTimeout(600);
  check('hopping to a spectrum opens it',
    (await page.$$('#gx-panel .spec-track')).length === 1);
}
await page.screenshot({ path: '.verify/g4-concept-sits-on.png' });

/* ---------- 3D ---------- */
await page.click('#gx-dim .seg-btn[data-dim="3"]');
await page.waitForTimeout(2200);
check('3D mounted', await page.isVisible('#gx-3d'));
const hud = await page.evaluate(() => {
  const h = document.querySelector('.gx-hud');
  return h ? { html: h.innerHTML, text: h.textContent } : null;
});
check('3D HUD shows the spectrum continuum', !!hud && /spec-track/.test(hud.html));
check('3D HUD shows both poles', !!hud && /spec-poles/.test(hud.html));
check('3D HUD offers place yourself', !!hud && /data-act="place"/.test(hud.html));
await page.screenshot({ path: '.verify/g5-3d-hud.png' });

// the 3D orbit must be navigable to a neighbour and back without throwing
await page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  const orbit = m.orbit(m.selected(), 6);
  if (orbit.length) m.select(orbit[0].id);
});
await page.waitForTimeout(1400);
check('3D selection followed the orbit', await page.isVisible('#gx-3d'));
await page.screenshot({ path: '.verify/g6-3d-neighbour.png' });

/* ---------- back out: the rest of the app is unharmed ---------- */
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check('graph closed', !(await page.isVisible('#graph')));

await page.click('.seg-btn[data-tab="beliefs"]');
await page.waitForTimeout(300);
check('beliefs tab still renders', (await page.$$('#beliefs-list .spec')).length > 0);
check('the graph answer shows in the tab', (await page.$$('#beliefs-list .spec-mark.placed')).length > 0);

await page.click('.seg-btn[data-tab="insights"]');
await page.waitForTimeout(300);
check('insights tab intact', (await page.$$('#ins-list .insight')).length > 0);
await page.click('.seg-btn[data-tab="readings"]');
await page.waitForTimeout(300);
check('readings tab intact', (await page.$$('#readings-list .work')).length > 0);
await page.screenshot({ path: '.verify/g7-back-in-the-note.png' });

console.log(log.join('\n'));
if (errors.length) console.log('\nRUNTIME:\n' + errors.join('\n'));
if (fail.length) console.log('\n' + fail.join('\n'));
console.log('\n' + log.length + ' passed, ' + fail.length + ' failed, ' + errors.length + ' runtime issues');

await browser.close();
process.exit(fail.length || errors.length ? 1 : 0);
