/* One renderer for the continuum, so the dashed and solid marks mean the
   same thing everywhere they appear. */

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

const finish = async () => {
  if (problems.length) problems.forEach(p => check(p, false));
  console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
  await browser.close();
  process.exit(fail ? 1 : 0);
};

const hasRenderer = await page.evaluate(
  () => !!window.PalinodeSpectrumUI &&
        typeof window.PalinodeSpectrumUI.track === 'function' &&
        typeof window.PalinodeSpectrumUI.poles === 'function');
check('the renderer is global', hasRenderer);
// Everything below renders through it, so without it there is nothing to ask.
if (!hasRenderer) await finish();

const out = await page.evaluate(() => {
  const UI = window.PalinodeSpectrumUI;
  const axis = window.PalinodeBeliefs.SPECTRA[0];
  return {
    bare:  UI.track(axis, { tentative: null, placed: null, placedN: 0 }),
    both:  UI.track(axis, { tentative: -0.5, placed: 0.5, placedN: 3 }),
    one:   UI.track(axis, { tentative: null, placed: 0.2, placedN: 1 }),
    over:  UI.track(axis, { tentative: null, placed: 5, placedN: 1 }),
    under: UI.track(axis, { tentative: null, placed: -5, placedN: 1 }),
    poles: UI.poles(axis, -1),
    mid:   UI.poles(axis, 0),
    // SPECTRA is fixed data, so hostile text has to be injected over a copy.
    unsafe: UI.poles(Object.assign({}, axis, { left: '<b>"x"&y</b>' }), -1),
    left:  axis.left
  };
});

check('a bare track has no marks', !/spec-mark/.test(out.bare));
check('a bare track still has the band', /spec-band/.test(out.bare));
check('argument ticks are drawn', /spec-arg/.test(out.bare));
check('both marks render when both exist',
  /spec-mark placed/.test(out.both) && /spec-mark tentative/.test(out.both));
check('a centre delta maps to the middle', /left:50%/.test(
  await page.evaluate(() => window.PalinodeSpectrumUI.track(
    window.PalinodeBeliefs.SPECTRA[0], { tentative: 0, placed: null, placedN: 0 }))));
check('one answered item reads singular', /1 answered item"/.test(out.one));
check('three answered items read plural', /3 answered items/.test(out.both));
check('poles name both ends', out.poles.includes(out.left));
check('the leaning pole is marked', /class="lean"/.test(out.poles));
check('a split lean marks neither end', !/class="lean"/.test(out.mid));

check('pole text is escaped, never passed through',
  out.unsafe.includes('&lt;b&gt;&quot;x&quot;&amp;y&lt;/b&gt;') && !out.unsafe.includes('<b>'));

check('a delta past the right end clamps to the end',
  out.over.includes('class="spec-mark placed" style="left:100%"'));
check('a delta past the left end clamps to the end',
  out.under.includes('class="spec-mark placed" style="left:0%"'));

// Whichever mark comes last paints on top, and where the two coincide the
// tentative one must not hide the placement it is not allowed to move.
const iPlaced = out.both.indexOf('spec-mark placed');
const iTentative = out.both.indexOf('spec-mark tentative');
check('the placed mark is drawn before the tentative one',
  iPlaced >= 0 && iTentative >= 0 && iPlaced < iTentative,
  `placed at ${iPlaced}, tentative at ${iTentative}`);

await finish();
