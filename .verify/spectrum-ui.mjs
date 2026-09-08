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

check('the renderer is global', await page.evaluate(
  () => !!window.PalinodeSpectrumUI &&
        typeof window.PalinodeSpectrumUI.track === 'function' &&
        typeof window.PalinodeSpectrumUI.poles === 'function'));

const out = await page.evaluate(() => {
  const axis = window.PalinodeBeliefs.SPECTRA[0];
  return {
    bare:  window.PalinodeSpectrumUI.track(axis, { tentative: null, placed: null, placedN: 0 }),
    both:  window.PalinodeSpectrumUI.track(axis, { tentative: -0.5, placed: 0.5, placedN: 3 }),
    one:   window.PalinodeSpectrumUI.track(axis, { tentative: null, placed: 0.2, placedN: 1 }),
    poles: window.PalinodeSpectrumUI.poles(axis, -1),
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

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
