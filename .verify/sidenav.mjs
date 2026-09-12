/* The rail holds what accumulates across the journal, and nothing that
   belongs to a single note. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';
import { mockKhora } from './khora-mock.mjs';

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
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#dashboard-wrap:not([hidden])', { timeout: 8000 });
await page.evaluate(() => {
  const prefs = window.PalinodeStore && PalinodeStore.Prefs;
  if (prefs) {
    ['explore', 'write', 'insights', 'market', 'pathways', 'quests', 'profile', 'home']
      .forEach(id => prefs.tourDone(id));
  }
  if (window.PalinodeOnboarding) PalinodeOnboarding._reset();
});

/* Collapsing takes the Reading rail's column to zero, so reopening it is a
   question of whether its chevron is still reachable at all. An unreachable
   control times out; report that as a failure rather than crashing out —
   carrying the real reason, since not every failure here is a timeout. */
const tryClick = async sel => {
  try { await page.click(sel, { timeout: 3000 }); return { ok: true, why: '' }; }
  catch (e) { return { ok: false, why: String(e.message).split('\n')[0] }; }
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
  const items = [...nav.querySelectorAll('.nav-item:not(.nav-help)')]
    .filter(el => getComputedStyle(el).display !== 'none')
    .map(el => {
    const b = el.getBoundingClientRect();
    return { id: el.id, view: el.dataset.view || '',
             w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top) };
  });
  const help = document.getElementById('btn-help');
  const helpBox = help && getComputedStyle(help).display !== 'none'
    ? (() => { const b = help.getBoundingClientRect(); return { top: Math.round(b.top), h: Math.round(b.height) }; })()
    : null;
  // a label may hang outside its own 56px target and still be perfectly
  // legible; what would actually cut it off is the 78px rail
  const labelFits = [...nav.querySelectorAll('.nav-lab')].filter(lab => {
    const item = lab.closest('.nav-item');
    return item && getComputedStyle(item).display !== 'none';
  }).map(lab => {
    const b = lab.getBoundingClientRect();
    return { text: lab.textContent,
             out: Math.round(Math.max(r.left - b.left, b.right - r.right)) };
  });
  return { width: Math.round(r.width), height: Math.round(r.height),
           top: Math.round(r.top), items, helpBox, labelFits,
           navScrolls: nav.scrollWidth > nav.clientWidth + 1,
           onIds: [...document.querySelectorAll('.nav-item.on:not(.nav-help)')].map(el => el.id),
           bodyTop: Math.round(document.getElementById('body').getBoundingClientRect().top) };
});

check('the rail is 78px wide', geo.width === 78, geo.width + 'px');
check('the rail runs full height', geo.height >= 890 && geo.top === 0,
  geo.height + 'px from ' + geo.top);
check('the body starts at the top now', geo.bodyTop === 0, geo.bodyTop + 'px');
// the DOM contract Tasks 3 and 6 consume: these exact ids, carrying these
// exact data-views, in this order. A typo in either would ship green
// against a bare count, so name them.
const CONTRACT = 'btn-home:home,btn-explore:explore,btn-rail:write,btn-market:market,btn-pathways:pathways,btn-quests:quests,btn-profile:profile';
const actual = geo.items.map(i => i.id + ':' + i.view).join(',');
check('seven destinations', geo.items.length === 7,
  geo.items.map(i => i.id).join(','));
check('the destinations are the contracted seven, in order',
  actual === CONTRACT, actual);
check('Help sits at the foot of the rail',
  !!geo.helpBox && geo.helpBox.top - geo.items[geo.items.length - 1].top >= 72,
  geo.helpBox ? String(geo.helpBox.top - geo.items[geo.items.length - 1].top) : 'missing');
check('Home is the only one marked active',
  geo.onIds.length === 1 && geo.onIds[0] === 'btn-home',
  geo.onIds.join(',') || 'none');
check('Home is the default view', await page.evaluate(
  () => document.getElementById('body').classList.contains('dashboard-mode')
    && !document.getElementById('dashboard-wrap').hidden));
check('destinations are 56px tall', geo.items.every(i => i.h === 56),
  geo.items.map(i => i.h).join(','));
/* 56 wide, not the 40 of the pill: a 40px target leaves 'Explore' hanging
   outside the thing you can click. Nothing else measures this, since the
   labels fit the rail at either width. */
check('destinations are 56px wide', geo.items.every(i => i.w === 56),
  geo.items.map(i => i.w).join(','));
check('destinations sit on a 72px pitch', geo.items.every((it, k) =>
  k === 0 || it.top - geo.items[k - 1].top === 72),
  geo.items.map(i => i.top).join(','));
check('no label is clipped by the rail', !geo.navScrolls &&
  geo.labelFits.every(l => l.out <= 0),
  geo.labelFits.map(l => l.out > 0 ? l.text + ' ' + l.out + 'px past the rail'
                                   : l.text + ' ' + -l.out + 'px clear').join(', '));
check('the brand glyph is in the rail', await page.isVisible('nav.sidenav .nav-brand img'));
check('the wordmark is gone', !(await page.evaluate(
  () => /Philosophical Reader/i.test(document.querySelector('nav.sidenav').textContent))));
check('Insights is not a note button on desktop', await page.evaluate(
  () => getComputedStyle(document.getElementById('btn-note-insights')).display === 'none'));

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
    pathPage: shown('pathway-wrap') || shown('path-empty'),
    pathMode: document.getElementById('body').classList.contains('pathways-mode'),
    profile: shown('profile-view'),
    profileMode: document.getElementById('body').classList.contains('profile-mode'),
    body: document.getElementById('body').className,
    active: [...document.querySelectorAll('.nav-item.on')].map(e => e.id).join(',')
  });
});

const restState = await viewState();
const errsBefore = problems.length;
await page.click('#btn-pathways');
await page.waitForTimeout(300);
check('Pathways opens the page', await page.evaluate(() => {
  const body = document.getElementById('body');
  const empty = document.getElementById('path-empty');
  return body.classList.contains('pathways-mode')
    && empty && !empty.hidden
    && document.getElementById('graph').hidden;
}));
check('Pathways is not an overlay', await page.evaluate(
  () => !document.getElementById('pathways')));
const afterPath = await viewState();
check('Pathways marks itself active', JSON.parse(afterPath).active.includes('btn-pathways'),
  JSON.parse(afterPath).active);
await page.click('#btn-quests');
await page.waitForTimeout(300);
check('Quests opens the page', await page.evaluate(() => {
  const body = document.getElementById('body');
  const empty = document.getElementById('quest-empty');
  const list = document.getElementById('quest-list');
  return body.classList.contains('quests-mode')
    && empty && !empty.hidden
    && list && !list.hidden
    && !body.classList.contains('pathways-mode')
    && document.getElementById('graph').hidden;
}));
check('Quests is not inside Marketplace', await page.evaluate(() => {
  const wrap = document.getElementById('quests-wrap');
  const market = document.getElementById('market-wrap');
  const lab = document.querySelector('.rail-lab-quests');
  return !!(lab && getComputedStyle(lab).display !== 'none'
    && (!market || market.hidden)
    && !document.querySelector('#mkt-tabs [data-mkt-tab="quests"]')
    && wrap && wrap.hidden);
}));
check('Quests rail shows status filters', await page.evaluate(() => {
  const filters = document.getElementById('quest-log-filters');
  return !!(filters && !filters.hidden && filters.querySelector('[data-quest-log-filter="active"].on'));
}));
const afterQuests = await viewState();
check('Quests marks itself active', JSON.parse(afterQuests).active.includes('btn-quests'),
  JSON.parse(afterQuests).active);
await page.click('#btn-profile');
await page.waitForTimeout(300);
const afterProfile = await viewState();
check('Profile opens the page and leaves Pathways', await page.evaluate(() => {
  const body = document.getElementById('body');
  const view = document.getElementById('profile-view');
  return body.classList.contains('profile-mode')
    && view && !view.hidden
    && !body.classList.contains('pathways-mode')
    && !body.classList.contains('quests-mode')
    && document.getElementById('graph').hidden;
}));
check('Profile marks itself active', JSON.parse(afterProfile).active.includes('btn-profile'),
  JSON.parse(afterProfile).active);
check('Profile did not throw', problems.length === errsBefore,
  problems.length - errsBefore + ' new page errors');
await page.click('#btn-pathways');
await page.waitForTimeout(200);
check('Pathways returns from Profile', await page.evaluate(
  () => document.getElementById('body').classList.contains('pathways-mode')
    && (document.getElementById('profile-view') || {}).hidden !== false));
await page.click('#btn-rail');
await page.waitForTimeout(200);
check('Write leaves Pathways', await page.evaluate(
  () => !document.getElementById('body').classList.contains('pathways-mode')
    && (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-rail'));

/* The suite creates a note further down, but the app opens on a bare draft,
   so the collapse has to survive that state too. */
const collapsedBare = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('the chevron collapses the Reading rail before any note is written',
  collapsedBare.ok && await page.evaluate(
    () => document.getElementById('body').classList.contains('insights-closed')),
  collapsedBare.why);
const reopenedBare = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('and is still reachable to reopen it', reopenedBare.ok && await page.evaluate(
  () => !document.getElementById('body').classList.contains('insights-closed')),
  reopenedBare.why);

// the compose control is an action, not a destination
check('New note is in the rail', await page.isVisible('#btn-new'));
check('New note is not a destination', await page.evaluate(
  () => !document.getElementById('btn-new').classList.contains('nav-item')));
/* The app opens on a bare draft with #editor-wrap already visible, so asking
   only whether the editor is showing would hold even if the button were
   inert. Put a title in first: a new note has to arrive empty. */
await page.fill('#title', 'Left over from before');
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
const titleAfterNew = await page.inputValue('#title');
check('New note still creates a note',
  await page.isVisible('#editor-wrap') && titleAfterNew === '',
  'title came back as ' + JSON.stringify(titleAfterNew));

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
check('the chevron collapses the Reading rail', collapsed.ok && await page.evaluate(
  () => document.getElementById('body').classList.contains('insights-closed')),
  collapsed.why);
const broughtBack = await tryClick('#btn-insights');
await page.waitForTimeout(300);
check('and brings it back', broughtBack.ok && await page.evaluate(
  () => !document.getElementById('body').classList.contains('insights-closed')),
  broughtBack.why);

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
           hitsNav: !!(mid && mid.closest('nav.sidenav')),
           // #graph is fixed and the rail is not, so any horizontal scroll of
           // <body> moves one and not the other. That is the only way these
           // two disagree, so report it rather than leave a 1px gap unexplained.
           bodyScrollLeft: document.body.scrollLeft };
});
check('the graph starts after the rail', clear.graphLeft === clear.navRight,
  'graph ' + clear.graphLeft + ' vs rail ' + clear.navRight +
  (clear.bodyScrollLeft ? ', body scrolled ' + clear.bodyScrollLeft + 'px' : ''));
check('the rail takes the pointer over the graph', clear.hitsNav);

await page.click('#btn-new');
await page.waitForTimeout(300);
const afterNew = await page.evaluate(() => ({
  graph: document.getElementById('graph').hidden,
  exploring: document.body.classList.contains('exploring'),
  title: document.getElementById('title').value,
  editor: !document.getElementById('editor-wrap').hidden
}));
check('New note closes Explore', afterNew.graph && !afterNew.exploring,
  'graph hidden=' + afterNew.graph + ' exploring=' + afterNew.exploring);
check('and shows the untitled note', afterNew.editor && afterNew.title === '',
  JSON.stringify(afterNew.title));

const doomed = await page.evaluate(() => document.querySelector('.note-item.active')?.dataset.id);
const beforeCount = await page.$$eval('.note-item', els => els.length);
const forgetSel = `.note-item[data-id="${doomed}"] [data-forget]`;
const forgetOp = async () => page.evaluate(sel => {
  const el = document.querySelector(sel);
  return el ? Number(getComputedStyle(el).opacity) : -1;
}, forgetSel);
const restOp = await forgetOp();
check('the delete control is hidden at rest', !!doomed && restOp === 0, 'opacity=' + restOp);
await page.hover(`.note-item[data-id="${doomed}"] h4`);
await page.waitForTimeout(200);
const hoverOp = await forgetOp();
check('and appears on hover', hoverOp === 1, 'opacity=' + hoverOp);
await page.click(forgetSel);
await page.waitForTimeout(200);
const asked = await page.evaluate(id => ({
  still: !!document.querySelector(`.note-item[data-id="${id}"]`),
  modal: !!document.querySelector('#forget-scrim.on')
}), doomed);
check('delete waits for confirmation', asked.still && asked.modal,
  'still=' + asked.still + ' modal=' + asked.modal);
const cancelled = await tryClick('#forget-cancel');
await page.waitForTimeout(150);
const kept = await page.evaluate(id => ({
  still: !!document.querySelector(`.note-item[data-id="${id}"]`),
  modal: !!document.querySelector('#forget-scrim.on')
}), doomed);
check('cancelling keeps the note', cancelled.ok && kept.still && !kept.modal, cancelled.why);
if (doomed && await page.$(forgetSel)) {
  await page.hover(`.note-item[data-id="${doomed}"]`);
  await page.click(forgetSel);
}
const confirmed = await tryClick('#forget-confirm');
await page.waitForTimeout(250);
const afterForget = await page.evaluate(id => ({
  still: !!document.querySelector(`.note-item[data-id="${id}"]`),
  count: document.querySelectorAll('.note-item').length,
  open: document.querySelector('.note-item.active')?.dataset.id || null,
  modal: !!document.querySelector('#forget-scrim.on')
}), doomed);
check('confirming removes the card', confirmed.ok && !afterForget.still && afterForget.count === beforeCount - 1,
  confirmed.why || (afterForget.count + ' left, still=' + afterForget.still));
check('the editor opens another note', afterForget.open && afterForget.open !== doomed,
  String(afterForget.open));
check('the confirm closes', !afterForget.modal);

await finish();
