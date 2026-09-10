/* Concept panel lenses: cultural / opposing / analyze / contemporary. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { mockKhora } from './khora-mock.mjs';

const URL = 'http://localhost:8765/index.html';
const CONCEPT = 'stoic-control';

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

await page.waitForSelector('#graph:not([hidden])');
await page.waitForFunction(() => typeof window.PalinodeConceptLenses === 'object'
  && typeof window.PalinodeGraph?.focusConcept === 'function');

await page.evaluate(id => window.PalinodeGraph.focusConcept(id), CONCEPT);
await page.waitForSelector('#gx-panel [data-act="lens-cultural"]');

check('concept panel shows four lens actions', await page.evaluate(() => {
  const acts = [...document.querySelectorAll('#gx-panel [data-act]')].map(b => b.dataset.act);
  return ['lens-cultural', 'lens-opposing', 'lens-analyze', 'lens-contemporary']
    .every(k => acts.includes(k))
    && acts.includes('write') && acts.includes('save') && acts.includes('path');
}));

check('lens helpers seed stoic-control contemporary issues', await page.evaluate(id => {
  const d = PalinodeConceptLenses.contemporary(id);
  return !!(d && d.issues && d.issues.length >= 1 && d.issues[0].prompt);
}, CONCEPT));

const lenses = [
  { act: 'lens-cultural', title: 'Cultural perspectives', expect: 'Home tradition' },
  { act: 'lens-opposing', title: 'Opposing perspectives', expect: 'On the spectra' },
  { act: 'lens-analyze', title: 'Analyze arguments', expect: 'Claim' },
  { act: 'lens-contemporary', title: 'Contemporary issues', expect: 'Live questions' }
];

for (const lens of lenses) {
  await page.click(`#gx-panel [data-act="${lens.act}"]`);
  await page.waitForSelector('#gx-panel [data-act="lens-back"]');
  const open = await page.evaluate(({ title, expect }) => {
    const panel = document.getElementById('gx-panel');
    const kicker = (panel.querySelector('.gx-kicker')?.textContent || '').trim();
    const h4s = [...panel.querySelectorAll('h4')].map(h => (h.textContent || '').trim());
    const text = (panel.querySelector('.gx-panel-body')?.textContent || '').trim();
    return {
      back: !!panel.querySelector('[data-act="lens-back"]'),
      title: kicker.includes(title),
      section: h4s.some(h => h.includes(expect)),
      nonEmpty: text.length > 40
    };
  }, lens);
  check(`${lens.act} opens seeded view`, open.back && open.title && open.section && open.nonEmpty,
    JSON.stringify(open));

  await page.click('#gx-panel [data-act="lens-back"]');
  await page.waitForSelector('#gx-panel [data-act="lens-cultural"]');
  check(`${lens.act} back returns to concept`, await page.evaluate(() => {
    const panel = document.getElementById('gx-panel');
    return !panel.querySelector('[data-act="lens-back"]')
      && !!panel.querySelector('[data-act="lens-cultural"]')
      && !!panel.querySelector('[data-act="write"]');
  }));
}

await page.click('#gx-panel [data-act="lens-analyze"]');
await page.waitForSelector('#gx-panel [data-act="lens-back"]');
await page.keyboard.press('Escape');
await page.waitForSelector('#gx-panel [data-act="lens-cultural"]');
check('Escape clears the lens on Explore', await page.evaluate(() => {
  const panel = document.getElementById('gx-panel');
  return !document.getElementById('graph').hidden
    && !panel.querySelector('[data-act="lens-back"]')
    && !!panel.querySelector('[data-act="lens-cultural"]');
}));

check('no page errors', problems.length === 0, problems.join(' | ') || 'clean');

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
