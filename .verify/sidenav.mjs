/* The rail holds what accumulates across the journal, and nothing that
   belongs to a single note. */

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

/* Collapsing takes the Reading rail's column to zero, so reopening it is a
   question of whether its chevron is still reachable at all. An unreachable
   control times out; report that as a failure rather than crashing out. */
const tryClick = async sel => {
  try { await page.click(sel, { timeout: 3000 }); return true; }
  catch { return false; }
};

const finish = async () => {
  if (problems.length) problems.forEach(p => check(p, false));
  console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
  await browser.close();
  process.exit(fail ? 1 : 0);
};

check('the top bar is gone', (await page.$$('header.top')).length === 0);
const hasRail = await page.isVisible('nav.sidenav');
check('the rail exists', hasRail);
// Every question below is about the rail's geometry, so without it there is
// nothing to ask — report and leave rather than throwing on a null.
if (!hasRail) await finish();

const geo = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav');
  const r = nav.getBoundingClientRect();
  const items = [...nav.querySelectorAll('.nav-item')].map(el => {
    const b = el.getBoundingClientRect();
    return { id: el.id, view: el.dataset.view || '',
             w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top),
             label: (el.querySelector('.nav-lab') || {}).textContent || '' };
  });
  // a label may hang outside its own 56px target and still be perfectly
  // legible; what would actually cut it off is the 78px rail
  const labelFits = [...nav.querySelectorAll('.nav-lab')].map(lab => {
    const b = lab.getBoundingClientRect();
    return { text: lab.textContent,
             out: Math.round(Math.max(r.left - b.left, b.right - r.right)) };
  });
  return { width: Math.round(r.width), height: Math.round(r.height),
           top: Math.round(r.top), items, labelFits,
           navScrolls: nav.scrollWidth > nav.clientWidth + 1,
           onIds: [...document.querySelectorAll('.nav-item.on')].map(el => el.id),
           bodyTop: Math.round(document.getElementById('body').getBoundingClientRect().top) };
});

check('the rail is 78px wide', geo.width === 78, geo.width + 'px');
check('the rail runs full height', geo.height >= 890 && geo.top === 0,
  geo.height + 'px from ' + geo.top);
check('the body starts at the top now', geo.bodyTop === 0, geo.bodyTop + 'px');
// the DOM contract Tasks 3 and 6 consume: these exact ids, carrying these
// exact data-views, in this order. A typo in either would ship green
// against a bare count, so name them.
const CONTRACT = 'btn-rail:write,btn-explore:explore,btn-shelf:shelf,btn-profile:profile';
const actual = geo.items.map(i => i.id + ':' + i.view).join(',');
check('four destinations', geo.items.length === 4,
  geo.items.map(i => i.id).join(','));
check('the destinations are the contracted four, in order',
  actual === CONTRACT, actual);
check('Notes is the only one marked active',
  geo.onIds.length === 1 && geo.onIds[0] === 'btn-rail',
  geo.onIds.join(',') || 'none');
check('destinations are 56px tall', geo.items.every(i => i.h === 56),
  geo.items.map(i => i.h).join(','));
check('destinations sit on a 72px pitch', geo.items.every((it, k) =>
  k === 0 || it.top - geo.items[k - 1].top === 72),
  geo.items.map(i => i.top).join(','));
check('no label is clipped by the rail', !geo.navScrolls &&
  geo.labelFits.every(l => l.out <= 0),
  geo.labelFits.map(l => l.text + ' ' + l.out + 'px past').join(', '));
check('the brand glyph is in the rail', await page.isVisible('nav.sidenav .nav-brand svg'));
check('the wordmark is gone', !(await page.evaluate(
  () => /Philosophical Reader/i.test(document.querySelector('nav.sidenav').textContent))));

/* Everything below here runs first against the state the app opens in:
   no note. What is on screen, plus which destination is marked. */
const viewState = () => page.evaluate(() => {
  const shown = id => {
    const e = document.getElementById(id);
    return !!e && !e.hidden && getComputedStyle(e).display !== 'none';
  };
  return JSON.stringify({
    empty: shown('empty-state'), editor: shown('editor-wrap'),
    graph: shown('graph'), reading: shown('reading-room'),
    body: document.getElementById('body').className,
    active: [...document.querySelectorAll('.nav-item.on')].map(e => e.id).join(',')
  });
});

// Shelf and Profile are inert until the next task. If a click starts doing
// something, that has to fail here rather than ship green.
const restState = await viewState();
const errsBefore = problems.length;
await page.click('#btn-shelf');
await page.waitForTimeout(300);
await page.click('#btn-profile');
await page.waitForTimeout(300);
const afterInert = await viewState();
check('Shelf and Profile change nothing yet',
  afterInert === restState && problems.length === errsBefore,
  afterInert === restState ? problems.length - errsBefore + ' new page errors'
                           : afterInert);

/* The suite creates a note further down, but the app opens on a bare draft,
   so the collapse has to survive that state too. */
const collapsedBare = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('the chevron collapses the Reading rail before any note is written',
  collapsedBare && await page.evaluate(
    () => document.getElementById('body').classList.contains('insights-closed')));
const reopenedBare = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('and is still reachable to reopen it', reopenedBare && await page.evaluate(
  () => !document.getElementById('body').classList.contains('insights-closed')),
  reopenedBare ? '' : 'the collapsed chevron could not be clicked');

// the compose control is an action, not a destination
check('New note is in the rail', await page.isVisible('#btn-new'));
check('New note is not a destination', await page.evaluate(
  () => !document.getElementById('btn-new').classList.contains('nav-item')));
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
check('New note still creates a note', await page.isVisible('#editor-wrap'));

// Share belongs to the note it acts on
check('Share sits with the note', await page.evaluate(
  () => !!document.querySelector('.doc-meta #btn-share')));
check('Share is not in the rail', await page.evaluate(
  () => !document.querySelector('nav.sidenav #btn-share')));

// the Reading rail carries its own collapse control
check('the Reading rail has a chevron', await page.isVisible('#btn-insights'));
check('the chevron is on the rail, not the nav', await page.evaluate(
  () => !!document.querySelector('aside.insights #btn-insights')));
const collapsed = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('the chevron collapses the Reading rail', collapsed && await page.evaluate(
  () => document.getElementById('body').classList.contains('insights-closed')));
const broughtBack = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('and brings it back', broughtBack && await page.evaluate(
  () => !document.getElementById('body').classList.contains('insights-closed')),
  broughtBack ? '' : 'the collapsed chevron could not be clicked');

// Notes still toggles the Library
await page.click('#btn-rail');
await page.waitForTimeout(300);
check('Notes collapses the Library', await page.evaluate(
  () => document.getElementById('body').classList.contains('rail-closed')));
await page.click('#btn-rail');
await page.waitForTimeout(300);
check('Notes brings the Library back', await page.evaluate(
  () => !document.getElementById('body').classList.contains('rail-closed')));

// the rail survives the graph
await page.fill('#title', 'The job');
await page.fill('#body-input', 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much.');
await page.waitForTimeout(1400);
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(700);
check('the rail stays visible over the graph', await page.isVisible('nav.sidenav'));
const clear = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  const g = document.getElementById('graph').getBoundingClientRect();
  const mid = document.elementFromPoint(nav.width / 2, 300);
  return { graphLeft: Math.round(g.left), navRight: Math.round(nav.right),
           hitsNav: !!(mid && mid.closest('nav.sidenav')) };
});
check('the graph starts after the rail', clear.graphLeft === clear.navRight,
  'graph ' + clear.graphLeft + ' vs rail ' + clear.navRight);
check('the rail takes the pointer over the graph', clear.hitsNav);

await finish();
