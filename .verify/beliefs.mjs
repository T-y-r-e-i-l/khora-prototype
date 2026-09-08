// NODE_PATH is ignored for ESM, so the npx-cached install is imported by path.
import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8765/index.html';
const NOTE = `I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much, even though I feel completely alone in this city where no one understands what the work costs me. Everyone should be honest about what they want, but on balance the greater good was served and it was worth it for everyone involved. I keep coming back to the same pattern and part of me wonders whether the whole thing is pointless.`;

const log = [];
const fail = [];
const check = (name, ok, detail = '') => {
  (ok ? log : fail).push(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`);
};

// The cached playwright expects a newer build than what is downloaded, so
// the already-installed Chromium for Testing is used directly.
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

const counts = await page.evaluate(() => window.PalinodeBeliefs.count);
check('seed reached the page', counts.spectra === 27 && counts.items === 108, JSON.stringify(counts));

/* ---------- restraint: opening an existing note asks nothing ---------- */
await page.waitForSelector('#body-input', { state: 'visible' });
await page.waitForTimeout(8500);
check('no overlay from merely opening a note', !(await page.isVisible('#place-scrim')));

/* ---------- write a note ---------- */
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#title', 'The job');
await page.type('#body-input', 'I had no choice ');
await page.fill('#body-input', NOTE);
await page.waitForTimeout(1000);

const tabN = await page.textContent('#n-beliefs');
check('beliefs tab carries a count', Number(tabN) > 0, 'n=' + tabN);

await page.click('.seg-btn[data-tab="beliefs"]');
await page.waitForTimeout(200);
check('beliefs list visible', await page.isVisible('#beliefs-list'));
check('insights list hidden on the beliefs tab', !(await page.isVisible('#ins-list')));

const cards = await page.$$('#beliefs-list .spec');
check('spectrum cards rendered', cards.length > 0, cards.length + ' cards');
const firstAxis = await page.getAttribute('#beliefs-list .spec', 'data-axis');
const state0 = (await page.textContent('#beliefs-list .spec .spec-state')).trim();
check('cards read Tentative before any answer', state0 === 'Tentative', state0);
check('tentative tick drawn', (await page.$$('#beliefs-list .spec-mark.tentative')).length > 0);
check('no placed tick before answering', (await page.$$('#beliefs-list .spec-mark.placed')).length === 0);
check('argument ticks drawn', (await page.$$('#beliefs-list .spec-arg')).length > 0);
check('opposing challenge shown', (await page.$$('#beliefs-list .spec-against')).length > 0);
const cov0 = (await page.textContent('.bel-cov')).replace(/\s+/g, ' ').trim();
check('coverage starts at zero', /^0\s*of 27/.test(cov0), cov0);
await page.screenshot({ path: '.verify/out/1-beliefs-tentative.png' });

/* ---------- the one invitation, and only one ---------- */
let offerSeen = false;
for (let i = 0; i < 12; i++) {
  await page.waitForTimeout(1000);
  if (await page.isVisible('#place-scrim')) { offerSeen = true; break; }
}
check('one invitation arrives after you stop typing', offerSeen);
if (offerSeen) {
  check('invitation carries an authored item', (await page.textContent('.place-q')).length > 20);
  await page.screenshot({ path: '.verify/out/2-invitation.png' });
  await page.click('.modal [data-act="close"]');
  await page.waitForTimeout(200);
  check('invitation dismissable', !(await page.isVisible('#place-scrim')));
  await page.waitForTimeout(9000);
  check('it never asks twice in one note session', !(await page.isVisible('#place-scrim')));
}

/* ---------- place yourself, deliberately ---------- */
await page.click(`#beliefs-list .spec[data-axis="${firstAxis}"] [data-act="place"]`);
await page.waitForSelector('#place-scrim.on');
await page.waitForTimeout(350);
const opts = await page.$$('.place-opt');
check('overlay offers options', opts.length >= 3, opts.length + ' options');
await page.screenshot({ path: '.verify/out/3-place-overlay.png' });

await opts[0].click();
await page.waitForTimeout(300);
check('result replaces the question', (await page.$$('.place-result')).length === 1);
check('result carries the pole you moved away from', (await page.$$('.modal .spec-against')).length > 0);
await page.screenshot({ path: '.verify/out/4-place-result.png' });
check('note text intact after answering', (await page.inputValue('#body-input')) === NOTE);

await page.click('.modal [data-act="close"]');
await page.waitForTimeout(200);
check('overlay closed', !(await page.isVisible('#place-scrim')));

/* ---------- placement is now visible and distinct from the lean ---------- */
const cov1 = (await page.textContent('.bel-cov')).replace(/\s+/g, ' ').trim();
check('coverage moved after an answer', /^[1-9]/.test(cov1), cov1);
check('placed tick now drawn', (await page.$$('#beliefs-list .spec-mark.placed')).length > 0);
const answeredState = (await page.$eval(
  `#beliefs-list .spec[data-axis="${firstAxis}"] .spec-state`, n => n.textContent)).trim();
check('answered axis reads Placed', answeredState === 'Placed', answeredState);
const bothMarks = await page.$$eval(
  `#beliefs-list .spec[data-axis="${firstAxis}"] .spec-mark`, n => n.length);
check('lean and placement shown as two separate marks', bothMarks === 2, bothMarks + ' marks');
await page.screenshot({ path: '.verify/out/5-beliefs-placed.png' });

/* ---------- persistence, and the rule that prose never scores ---------- */
const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('palinode.v1')).belief);
check('answer persisted in palinode.v1', Object.keys(stored.responses).length === 1, JSON.stringify(stored.responses));
check('scores never stored, only derived',
  await page.evaluate(() => !/"score"/.test(localStorage.getItem('palinode.v1'))));

const before = await page.evaluate(() => JSON.stringify(window.PalinodeStore.Belief.scores()));
await page.fill('#body-input', NOTE + ' I had no choice, it was inevitable, nothing I can do, it was fated.');
await page.waitForTimeout(1000);
const after = await page.evaluate(() => JSON.stringify(window.PalinodeStore.Belief.scores()));
check('writing more prose does not move the profile', before === after);

await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(900);
await page.click('.seg-btn[data-tab="beliefs"]');
await page.waitForTimeout(300);
const covReload = (await page.textContent('.bel-cov')).replace(/\s+/g, ' ').trim();
check('placement survives a reload', /^[1-9]/.test(covReload), covReload);
check('journal section lists placed axes not in this note',
  (await page.$$('#beliefs-list .bel-sec')).length >= 1);

/* ---------- no regressions in the other two tabs ---------- */
await page.click('.seg-btn[data-tab="insights"]');
await page.waitForTimeout(200);
check('insights tab still renders', (await page.$$('#ins-list .insight')).length > 0);
await page.click('#ins-list .insight');
await page.waitForTimeout(200);
check('insight cards still expand', (await page.$$('#ins-list .insight.open')).length === 1);
await page.click('.seg-btn[data-tab="readings"]');
await page.waitForTimeout(200);
check('readings tab still renders', (await page.$$('#readings-list .work')).length > 0);
check('ring score still renders', (await page.textContent('#ring-val')) !== '');
check('underlines still painted', (await page.$$('#mirror mark')).length > 0);

/* ---------- empty note ---------- */
await page.fill('#body-input', '');
await page.waitForTimeout(900);
await page.click('.seg-btn[data-tab="beliefs"]');
await page.waitForTimeout(200);
const emptyTxt = (await page.textContent('#beliefs-list')).replace(/\s+/g, ' ').trim();
check('empty note shows an honest empty state', /Keep writing/.test(emptyTxt), emptyTxt.slice(0, 80));
check('journal placements still shown on an empty note',
  (await page.$$('#beliefs-list .spec.placed')).length > 0);
await page.screenshot({ path: '.verify/out/6-beliefs-empty.png' });

console.log(log.join('\n'));
if (errors.length) console.log('\nPAGE ERRORS:\n' + errors.join('\n'));
if (fail.length) console.log('\n' + fail.join('\n'));
console.log(`\n${log.length} passed, ${fail.length} failed, ${errors.length} page errors`);

await browser.close();
process.exit(fail.length || errors.length ? 1 : 0);
