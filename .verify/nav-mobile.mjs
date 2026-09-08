/* On a phone the rail becomes a bottom bar: Write, Insights, Explore. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

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

const bar = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav');
  const cs = getComputedStyle(nav);
  const r = nav.getBoundingClientRect();
  const shown = el => !!(el && getComputedStyle(el).display !== 'none');
  const items = [...nav.querySelectorAll('.nav-item')].filter(shown).map(el => {
    const b = el.getBoundingClientRect();
    return { id: el.id, top: Math.round(b.top), left: Math.round(b.left) };
  });
  return {
    position: cs.position, dir: cs.flexDirection,
    left: Math.round(r.left), width: Math.round(r.width),
    bottom: Math.round(window.innerHeight - r.bottom),
    height: Math.round(r.height), items,
    brandShown: shown(document.querySelector('.nav-brand')),
    pathwaysShown: shown(document.getElementById('btn-pathways')),
    profileShown: shown(document.getElementById('btn-profile')),
    insightsShown: shown(document.getElementById('btn-nav-insights')),
    writeShown: shown(document.getElementById('btn-rail')),
    exploreShown: shown(document.getElementById('btn-explore')),
    newShown: shown(document.getElementById('btn-new'))
  };
});

check('the nav is pinned to the bottom', bar.position === 'fixed' && bar.bottom === 0,
  bar.position + ', ' + bar.bottom + 'px from the bottom');
check('it spans the width', bar.width === 390, bar.width + 'px');
check('it lays out in a row', bar.dir === 'row', bar.dir);
check('visible items share one row',
  new Set(bar.items.map(i => i.top)).size === 1, bar.items.map(i => i.top).join(','));
check('items are ordered left to right', bar.items.every((it, k) =>
  k === 0 || it.left > bar.items[k - 1].left), bar.items.map(i => i.id + '@' + i.left).join(','));
check('the brand is hidden on a phone', !bar.brandShown);
check('Pathways is on the bar', bar.pathwaysShown);
check('Profile is off the bar', !bar.profileShown);
check('Write is on the bar', bar.writeShown);
check('Insights is on the bar', bar.insightsShown);
check('Explore is on the bar', bar.exploreShown);
check('New note is still reachable', bar.newShown);
check('the bar is not too tall', bar.height <= 80, bar.height + 'px');
check('the chevron is not the Insights opener',
  !(await page.isVisible('#btn-insights')));

const openedIns = await tryClick('#btn-nav-insights');
await page.waitForTimeout(250);
const ins = await page.evaluate(() => {
  const panel = document.querySelector('aside.insights');
  const nav = document.querySelector('nav.sidenav');
  const r = panel.getBoundingClientRect();
  const n = nav.getBoundingClientRect();
  return {
    display: getComputedStyle(panel).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom), navTop: Math.round(n.top),
    on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id
  };
});
check('Insights opens from the bar', openedIns.ok && ins.display !== 'none', openedIns.why);
check('the Reading panel is full width', ins.width === 390, ins.width + 'px');
check('it starts at the top', ins.top === 0, ins.top + 'px');
check('and stops above the bar', ins.bottom <= ins.navTop + 1,
  ins.bottom + ' vs bar at ' + ins.navTop);
check('Insights marks itself active', ins.on === 'btn-nav-insights', ins.on);

const backToWrite = await tryClick('#btn-rail');
await page.waitForTimeout(250);
const afterWrite = await page.evaluate(() => ({
  insights: getComputedStyle(document.querySelector('aside.insights')).display,
  on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
  rail: document.getElementById('body').classList.contains('show-rail')
}));
check('Write leaves Insights', backToWrite.ok && afterWrite.insights === 'none', backToWrite.why);
check('Write marks itself active', afterWrite.on === 'btn-rail', afterWrite.on);

await page.click('#btn-rail');
await page.waitForTimeout(250);
const lib = await page.evaluate(() => {
  const rail = document.querySelector('aside.rail');
  const nav = document.querySelector('nav.sidenav');
  const r = rail.getBoundingClientRect();
  const n = nav.getBoundingClientRect();
  return {
    display: getComputedStyle(rail).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom), navTop: Math.round(n.top)
  };
});
check('Write toggles the Library overlay', lib.display !== 'none');
check('the Library is full width', lib.width === 390, lib.width + 'px');
check('the Library starts at the top', lib.top === 0, lib.top + 'px');
check('and stops above the bar', lib.bottom <= lib.navTop + 1,
  lib.bottom + ' vs bar at ' + lib.navTop);

await page.click('#btn-new');
await page.waitForTimeout(200);
const attach = await page.evaluate(() => {
  const shown = el => !!(el && getComputedStyle(el).display !== 'none');
  return {
    drop: shown(document.getElementById('dropzone')),
    media: shown(document.getElementById('btn-media')),
    link: shown(document.getElementById('btn-link'))
  };
});
check('the dropzone is gone on a phone', !attach.drop);
check('Add media is still there', attach.media);
check('Add link is still there', attach.link);
await page.fill('#title', 'The job');
await page.fill('#body-input',
  'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much.');
await page.waitForTimeout(1400);

await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
await page.waitForTimeout(500);
const exp = await page.evaluate(() => {
  const g = document.getElementById('graph').getBoundingClientRect();
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  const dim = document.getElementById('gx-dim');
  const midBar = document.elementFromPoint(195, nav.top + nav.height / 2);
  return {
    graphBottom: Math.round(g.bottom), navTop: Math.round(nav.top),
    dimVisible: !!(dim && getComputedStyle(dim).display !== 'none'),
    hitsNav: !!(midBar && midBar.closest('nav.sidenav')),
    on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id
  };
});
check('Explore opens the graph above the bar', exp.graphBottom <= exp.navTop + 1,
  exp.graphBottom + ' vs bar at ' + exp.navTop);
check('2D/3D stays in the graph chrome', exp.dimVisible);
check('the bar stays clickable over Explore', exp.hitsNav);
check('Explore marks itself active', exp.on === 'btn-explore', exp.on);
check('the trail is on a phone', await page.evaluate(
  () => getComputedStyle(document.getElementById('gx-trail')).display !== 'none'));
check('Save as Pathway sits with the trail', await page.evaluate(
  () => getComputedStyle(document.getElementById('gx-save-path')).display !== 'none'));
check('Save as Pathway sits left of the first crumb', await page.evaluate(() => {
  const btn = document.getElementById('gx-save-path').getBoundingClientRect();
  const crumb = document.querySelector('#gx-trail .gx-crumb');
  if (!crumb) return false;
  return btn.right <= crumb.getBoundingClientRect().left + 1;
}));

await page.click('#gx-dim [data-dim="3"]');
await page.waitForTimeout(400);
check('3D still switches from the graph chrome', await page.evaluate(
  () => document.body.classList.contains('dim3')));
const hudW = await page.evaluate(() => {
  const h = document.querySelector('.gx-hud');
  return h ? Math.round(h.getBoundingClientRect().width) : 0;
});
check('the 3D card is 90vw', Math.abs(hudW - Math.round(390 * 0.9)) <= 2, hudW + 'px');

await page.click('#btn-rail');
await page.waitForTimeout(300);
check('Write from Explore closes the graph', await page.evaluate(
  () => document.getElementById('graph').hidden));
check('and returns to Write', await page.evaluate(
  () => (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-rail'));

await page.click('#btn-nav-insights');
await page.waitForTimeout(250);
await page.click('#btn-new');
await page.waitForTimeout(250);
const fromInsights = await page.evaluate(() => ({
  insights: getComputedStyle(document.querySelector('aside.insights')).display,
  editor: !document.getElementById('editor-wrap').hidden,
  title: document.getElementById('title').value,
  body: document.getElementById('body-input').value,
  on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id
}));
check('New note leaves Insights for the editor',
  fromInsights.insights === 'none' && fromInsights.editor, fromInsights.insights);
check('the opened note is untitled', fromInsights.title === '',
  JSON.stringify(fromInsights.title));
check('and empty', fromInsights.body === '');
check('Write is the view', fromInsights.on === 'btn-rail', fromInsights.on);

await page.fill('#body-input',
  'twelve words so the graph will open for this check of the new note action.');
await page.waitForTimeout(1400);
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
await page.click('#btn-new');
await page.waitForTimeout(300);
const fromExplore = await page.evaluate(() => ({
  graph: document.getElementById('graph').hidden,
  title: document.getElementById('title').value,
  on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id
}));
check('New note leaves Explore for the editor', fromExplore.graph);
check('that note is also untitled', fromExplore.title === '',
  JSON.stringify(fromExplore.title));
check('and Write is the view again', fromExplore.on === 'btn-rail', fromExplore.on);

await page.click('#btn-pathways');
await page.waitForTimeout(250);
const pathPage = await page.evaluate(() => {
  const empty = document.getElementById('path-empty');
  const wrap = document.getElementById('pathway-wrap');
  const pageEl = (!empty.hidden && empty) || (!wrap.hidden && wrap);
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  const r = pageEl ? pageEl.getBoundingClientRect() : { bottom: 0 };
  return {
    mode: document.getElementById('body').classList.contains('pathways-mode'),
    overlay: !!document.getElementById('pathways'),
    fixed: pageEl ? getComputedStyle(pageEl).position === 'fixed' : true,
    bottom: Math.round(r.bottom), navTop: Math.round(nav.top)
  };
});
check('Pathways is a page, not an overlay', pathPage.mode && !pathPage.overlay && !pathPage.fixed);
check('the pathway page sits above the bar', pathPage.bottom <= pathPage.navTop + 1,
  pathPage.bottom + ' vs bar at ' + pathPage.navTop);

await finish();
