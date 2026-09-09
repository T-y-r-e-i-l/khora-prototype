/* Nav Explore loads the live Khora field, then search can narrow it. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { mockKhora } from './khora-mock.mjs';

const URL = 'http://localhost:8765/index.html';

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

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForFunction(() => document.querySelectorAll('#gx-nodes .gx-node').length >= 1);
check('nav Explore opens without a note', await page.evaluate(
  () => !document.getElementById('graph').hidden));
check('cold start draws the live intro field', await page.evaluate(
  () => document.querySelectorAll('#gx-nodes .gx-node').length >= 1));
check('the empty prompt hides after intro', await page.evaluate(
  () => document.getElementById('gx-empty').hidden));
check('search uses the Library search component', await page.evaluate(() => {
  const box = document.querySelector('#gx-search.search');
  const q = document.getElementById('gx-q');
  return !!(box && q && box.contains(q) && !box.hidden);
}));
check('sort is present', await page.evaluate(
  () => !document.getElementById('gx-corpus-row').hidden && !!document.getElementById('gx-sort')));
check('kind filter lists node types', await page.evaluate(() => {
  const cat = document.getElementById('gx-cat');
  return !!(cat && [...cat.options].some(o => o.value === 'IDEA')
    && [...cat.options].some(o => o.value === 'PERSON'));
}));
check('the page is titled Explore', await page.evaluate(
  () => document.getElementById('gx-title-text').textContent === 'Explore'));
check('Close is hidden on the Explore page', await page.evaluate(
  () => !!document.getElementById('gx-close').hidden));
await page.keyboard.press('Escape');
check('Escape does not leave the Explore page', await page.evaluate(
  () => !document.getElementById('graph').hidden));
check('the empty prompt does not cover search or filters', await page.evaluate(() => {
  const reaches = (el, wrap) => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !!(top && top.closest(wrap) && !top.closest('#gx-empty'));
  };
  return reaches(document.getElementById('gx-q'), '#gx-search')
    && reaches(document.querySelector('#gx-filters .chip'), '#gx-filters');
}));

await page.click('#gx-nodes .gx-concept');
check('the first click shows a skeleton', await page.evaluate(
  () => document.getElementById('gx-panel').classList.contains('is-loading')));
await page.waitForSelector('#gx-panel [data-act="save"]');
check('the skeleton yields to the loaded panel', await page.evaluate(() => {
  const p = document.getElementById('gx-panel');
  return !p.classList.contains('is-loading') && !!p.querySelector('[data-act="save"]');
}));

await page.click('#gx-q');
await page.keyboard.type('ressentiment');
await page.waitForTimeout(700);
check('a query draws matching concepts', await page.evaluate(
  () => document.querySelectorAll('#gx-nodes .gx-concept').length >= 1));
check('the empty prompt stays hidden after a query', await page.evaluate(
  () => document.getElementById('gx-empty').hidden));

await page.click('#gx-nodes .gx-concept');
await page.waitForSelector('#gx-panel [data-act="save"]');
check('the object offers add to note and pathway', await page.evaluate(() => {
  const acts = [...document.querySelectorAll('#gx-panel [data-act]')].map(b => b.dataset.act);
  return acts.includes('save') && acts.includes('path');
}));

await page.click('#gx-panel [data-act="path"]');
await page.waitForSelector('#path-pick-scrim.on');
check('Add to pathway opens the picker', await page.isVisible('#path-pick-new'));
await page.click('#path-pick-new');
await page.waitForTimeout(200);
check('a concept can start a pathway', await page.evaluate(
  () => window.PalinodeStore.Pathways.all().some(p => /Ressentiment/i.test(p.title))));

await page.click('#btn-rail');
await page.waitForFunction(() => document.getElementById('graph').hidden);
check('Notes leaves the Explore page', await page.evaluate(
  () => document.getElementById('graph').hidden));
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#title', 'The job');
await page.fill('#body-input',
  'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going.');
await page.waitForTimeout(1400);
await page.click('#constellation');
await page.waitForSelector('#graph:not([hidden])');
check('the constellation still opens the note graph', await page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  return m.note() && m.note().title === 'The job' && m.all().has('note');
}));
check('the note graph keeps Close', await page.evaluate(
  () => !document.getElementById('gx-close').hidden));

check('no runtime issues', problems.length === 0, problems.join(' | '));

await browser.close();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
