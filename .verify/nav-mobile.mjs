/* On a phone the rail becomes a bottom bar: Notes, Explore, Pathways, Profile. */

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
    newShown: shown(document.getElementById('btn-new')),
    noteInsightsShown: shown(document.getElementById('btn-note-insights'))
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
check('the destinations are Notes, Explore, Pathways, Profile',
  bar.items.map(i => i.id).join(',') === 'btn-rail,btn-explore,btn-pathways,btn-profile',
  bar.items.map(i => i.id).join(','));
check('the brand is hidden on a phone', !bar.brandShown);
check('Pathways is on the bar', bar.pathwaysShown);
check('Profile is on the bar', bar.profileShown);
check('Notes is on the bar', bar.writeShown);
check('Insights is off the bar', !bar.insightsShown);
check('Explore is on the bar', bar.exploreShown);
check('New note is still reachable', bar.newShown);
check('the bar is not too tall', bar.height <= 80, bar.height + 'px');
check('the chevron is not the Insights opener',
  !(await page.isVisible('#btn-insights')));
check('the write tabs are gone', await page.evaluate(() => !document.getElementById('write-tabs')));

const firstList = await page.evaluate(() => {
  const rail = document.querySelector('aside.rail');
  const nav = document.querySelector('nav.sidenav');
  const back = document.getElementById('note-back');
  const r = rail.getBoundingClientRect();
  const n = nav.getBoundingClientRect();
  return {
    rail: document.getElementById('body').classList.contains('show-rail'),
    display: getComputedStyle(rail).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom), navTop: Math.round(n.top),
    label: (document.querySelector('#btn-rail .nav-lab-m') || {}).textContent,
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none')
  };
});
check('Notes opens on the note list', firstList.rail && firstList.display !== 'none');
check('the bar label is Notes', (firstList.label || '').trim() === 'Notes', firstList.label);
check('the list is full width', firstList.width === 390, firstList.width + 'px');
check('the list starts at the top', firstList.top === 0, firstList.top + 'px');
check('and stops above the bar', firstList.bottom <= firstList.navTop + 1,
  firstList.bottom + ' vs bar at ' + firstList.navTop);
check('the back control is off the list', !firstList.backShown);

await page.click('.note-item');
await page.waitForTimeout(250);
const afterPick = await page.evaluate(() => {
  const back = document.getElementById('note-back');
  const title = (document.getElementById('title').value || '').trim() || 'Untitled';
  const shown = el => !!(el && getComputedStyle(el).display !== 'none');
  return {
    rail: document.getElementById('body').classList.contains('show-rail'),
    editor: !document.getElementById('editor-wrap').hidden,
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none'),
    label: (document.getElementById('note-back-label').textContent || '').trim(),
    title,
    noteInsightsShown: shown(document.getElementById('btn-note-insights'))
  };
});
check('opening a note leaves the list', !afterPick.rail && afterPick.editor);
check('the back control is on the note', afterPick.backShown);
check('the back label shows the selected title', afterPick.label === afterPick.title,
  afterPick.label + ' vs ' + afterPick.title);
check('Insights sits on the open note', afterPick.noteInsightsShown);

const openedIns = await tryClick('#btn-note-insights');
await page.waitForTimeout(250);
const ins = await page.evaluate(() => {
  const panel = document.querySelector('aside.insights');
  const nav = document.querySelector('nav.sidenav');
  const r = panel.getBoundingClientRect();
  const n = nav.getBoundingClientRect();
  const close = document.getElementById('btn-insights');
  return {
    display: getComputedStyle(panel).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom), navTop: Math.round(n.top),
    on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
    closeShown: !!(close && getComputedStyle(close).display !== 'none'
      && close.getClientRects().length)
  };
});
check('Insights opens from the note', openedIns.ok && ins.display !== 'none', openedIns.why);
check('the Reading panel is full width', ins.width === 390, ins.width + 'px');
check('it starts at the top', ins.top === 0, ins.top + 'px');
check('and stops above the bar', ins.bottom <= ins.navTop + 1,
  ins.bottom + ' vs bar at ' + ins.navTop);
check('Notes stays the active destination', ins.on === 'btn-rail', ins.on);
check('the overlay has a closer', ins.closeShown);
check('the closer is an X', await page.evaluate(() => {
  const x = document.querySelector('#btn-insights .ins-ico-close');
  const chev = document.querySelector('#btn-insights .ins-ico-chevron');
  return !!x && getComputedStyle(x).display !== 'none'
    && (!chev || getComputedStyle(chev).display === 'none');
}));

const beforeScroll = await page.evaluate(() => {
  const panel = document.querySelector('aside.insights');
  const sel = document.getElementById('seg-select').getBoundingClientRect();
  const score = document.getElementById('score').getBoundingClientRect();
  return {
    selTop: Math.round(sel.top),
    scoreTop: Math.round(score.top),
    canScroll: panel.scrollHeight > panel.clientHeight + 8
  };
});
await page.evaluate(() => {
  const panel = document.querySelector('aside.insights');
  panel.scrollTop = Math.min(280, Math.max(120, panel.scrollHeight - panel.clientHeight));
});
await page.waitForTimeout(200);
const afterScroll = await page.evaluate(() => {
  const sel = document.getElementById('seg-select').getBoundingClientRect();
  const score = document.getElementById('score').getBoundingClientRect();
  return {
    selTop: Math.round(sel.top),
    scoreTop: Math.round(score.top)
  };
});
check('the panel can scroll below the select', beforeScroll.canScroll);
check('the select stays put while the reading scrolls',
  Math.abs(afterScroll.selTop - beforeScroll.selTop) <= 2
    && afterScroll.scoreTop < beforeScroll.scoreTop,
  'select ' + beforeScroll.selTop + '→' + afterScroll.selTop
    + ', score ' + beforeScroll.scoreTop + '→' + afterScroll.scoreTop);

const backToNotes = await tryClick('#btn-rail');
await page.waitForTimeout(250);
const afterNotes = await page.evaluate(() => ({
  insights: getComputedStyle(document.querySelector('aside.insights')).display,
  on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
  rail: document.getElementById('body').classList.contains('show-rail'),
  backHidden: document.getElementById('note-back').hidden
}));
check('Notes leaves Insights', backToNotes.ok && afterNotes.insights === 'none', backToNotes.why);
check('Notes marks itself active', afterNotes.on === 'btn-rail', afterNotes.on);
check('Notes returns to the list', afterNotes.rail === true);
check('the back control is off the list again', afterNotes.backHidden);

await page.click('#btn-rail');
await page.waitForTimeout(200);
check('Notes on the list stays on the list', await page.evaluate(
  () => document.getElementById('body').classList.contains('show-rail')));

await page.click('.note-item');
await page.waitForTimeout(250);
await page.click('#btn-note-back');
await page.waitForTimeout(250);
const afterBack = await page.evaluate(() => ({
  rail: document.getElementById('body').classList.contains('show-rail'),
  backHidden: document.getElementById('note-back').hidden,
  list: getComputedStyle(document.querySelector('aside.rail')).display
}));
check('the back control returns to the list',
  afterBack.rail && afterBack.backHidden && afterBack.list !== 'none');

await page.click('.note-item');
await page.waitForTimeout(250);
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

await page.evaluate(() => document.getElementById('constellation').click());
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
check('2D/3D sits to the right of Fit', await page.evaluate(() => {
  const fit = document.getElementById('gx-fit').getBoundingClientRect();
  const dim = document.getElementById('gx-dim').getBoundingClientRect();
  return dim.left >= fit.right - 1 && Math.abs(dim.top - fit.top) < 24;
}));

await page.evaluate(() => document.querySelector('#gx-dim [data-dim="3"]').click());
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
check('Notes from Explore closes the graph', await page.evaluate(
  () => document.getElementById('graph').hidden));
check('and returns to Notes', await page.evaluate(
  () => (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-rail'));
check('on the note list', await page.evaluate(
  () => document.getElementById('body').classList.contains('show-rail')));

await page.click('.note-item');
await page.waitForTimeout(250);
await page.click('#btn-note-insights');
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
check('Notes is the view', fromInsights.on === 'btn-rail', fromInsights.on);

await page.fill('#body-input',
  'twelve words so the graph will open for this check of the new note action.');
await page.waitForTimeout(1400);
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
await page.waitForTimeout(300);
const corpus = await page.evaluate(() => {
  const shown = el => !!(el && getComputedStyle(el).display !== 'none' && !el.hidden);
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  const search = document.getElementById('gx-search');
  const q = search.getBoundingClientRect();
  const zoom = document.querySelector('.gx-zoom').getBoundingClientRect();
  const dim = document.getElementById('gx-dim').getBoundingClientRect();
  const sort = document.querySelector('#gx-sort').closest('label').getBoundingClientRect();
  const cat = document.getElementById('gx-cat-wrap').getBoundingClientRect();
  const save = document.getElementById('gx-save-path').getBoundingClientRect();
  const chips = [...document.querySelectorAll('#gx-filters .chip')];
  const chipShown = chips.some(el => getComputedStyle(el).display !== 'none'
    && el.getBoundingClientRect().width > 0);
  const overlap = (a, b) => !(a.right <= b.left || a.left >= b.right
    || a.bottom <= b.top || a.top >= b.bottom);
  return {
    catShown: shown(document.getElementById('gx-cat-wrap')),
    chipShown,
    catRightOfSort: cat.left >= sort.right - 1,
    between: sort.left >= zoom.right - 1 && cat.right <= dim.left + 1,
    sameRow: Math.abs(sort.top - zoom.top) < 24 && Math.abs(cat.top - dim.top) < 24,
    searchW: Math.round(q.width),
    searchAboveNav: q.bottom <= nav.top + 1 && q.bottom > nav.top - 48,
    saveClear: !overlap(save, cat)
  };
});
check('sort and filter sit between Fit and 2D/3D', corpus.between && corpus.sameRow);
check('filter sits to the right of sort', corpus.catShown && corpus.catRightOfSort);
check('category chips are off the phone chrome', !corpus.chipShown);
check('search is 90vw', Math.abs(corpus.searchW - Math.round(390 * 0.9)) <= 2,
  corpus.searchW + 'px');
check('search sits just above the bar', corpus.searchAboveNav);
check('Save as Pathway is clear of filter', corpus.saveClear);
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
check('and Notes is the view again', fromExplore.on === 'btn-rail', fromExplore.on);

await page.evaluate(() => {
  window.PalinodeStore.Pathways.create({
    title: 'A short walk',
    steps: [
      { id: 'a', type: 'concept', ref: 'wuwei', label: 'Wu Wei', category: 'resonance' },
      { id: 'b', type: 'concept', ref: 'ressentiment', label: 'Ressentiment', category: 'tension' }
    ]
  });
});
await page.click('#btn-pathways');
await page.waitForTimeout(250);
const pathLib = await page.evaluate(() => {
  const rail = document.querySelector('aside.rail');
  const nav = document.querySelector('nav.sidenav');
  const back = document.getElementById('path-back');
  const list = document.getElementById('path-list');
  const r = rail.getBoundingClientRect();
  const n = nav.getBoundingClientRect();
  const shown = el => !!(el && getComputedStyle(el).display !== 'none' && !el.hidden);
  return {
    mode: document.getElementById('body').classList.contains('pathways-mode'),
    overlay: !!document.getElementById('pathways'),
    rail: document.getElementById('body').classList.contains('show-rail'),
    listShown: shown(list),
    title: (document.querySelector('.rail-lab-paths') || {}).textContent,
    display: getComputedStyle(rail).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom), navTop: Math.round(n.top),
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none'),
    hasWalk: /A short walk/.test(list.textContent || '')
  };
});
check('Pathways is a page, not an overlay', pathLib.mode && !pathLib.overlay);
check('Pathways opens on the pathway library', pathLib.rail && pathLib.listShown && pathLib.hasWalk);
check('the library title is Pathways', (pathLib.title || '').trim() === 'Pathways', pathLib.title);
check('the library is full width', pathLib.width === 390, pathLib.width + 'px');
check('the library starts at the top', pathLib.top === 0, pathLib.top + 'px');
check('and stops above the bar', pathLib.bottom <= pathLib.navTop + 1,
  pathLib.bottom + ' vs bar at ' + pathLib.navTop);
check('the back control is off the library', !pathLib.backShown);

await page.click('#path-list .note-item');
await page.waitForTimeout(300);
const pathWalk = await page.evaluate(() => {
  const wrap = document.getElementById('pathway-wrap');
  const back = document.getElementById('path-back');
  const prev = document.getElementById('walk-prev').getBoundingClientRect();
  const next = document.getElementById('walk-next').getBoundingClientRect();
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  const mid = (prev.left + next.right) / 2;
  return {
    rail: document.getElementById('body').classList.contains('show-rail'),
    wrap: wrap && !wrap.hidden,
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none'),
    label: (document.getElementById('path-back-label').textContent || '').trim(),
    navMid: (nav.left + nav.right) / 2,
    ctrlMid: mid,
    prevBottom: Math.round(prev.bottom),
    navTop: Math.round(nav.top),
    prevDisplay: getComputedStyle(document.getElementById('walk-prev')).display
  };
});
check('opening a pathway leaves the library', !pathWalk.rail && pathWalk.wrap);
check('the back control is on the pathway', pathWalk.backShown);
check('the back label shows the pathway title', pathWalk.label === 'A short walk', pathWalk.label);
check('Prev and Next are visible on the walk', pathWalk.prevDisplay !== 'none');
check('Prev and Next sit above the bar', pathWalk.prevBottom <= pathWalk.navTop + 1,
  pathWalk.prevBottom + ' vs bar at ' + pathWalk.navTop);
check('Prev and Next are centered with the bar',
  Math.abs(pathWalk.ctrlMid - pathWalk.navMid) <= 16,
  Math.round(pathWalk.ctrlMid) + ' vs ' + Math.round(pathWalk.navMid));

await page.click('#btn-path-back');
await page.waitForTimeout(250);
check('the back control returns to the pathway library', await page.evaluate(() => {
  const back = document.getElementById('path-back');
  const list = document.getElementById('path-list');
  return document.getElementById('body').classList.contains('show-rail')
    && list && !list.hidden
    && getComputedStyle(list).display !== 'none'
    && back.hidden;
}));

await page.click('#btn-profile');
await page.waitForTimeout(300);
check('Profile opens from the bar', await page.evaluate(() => {
  const view = document.getElementById('profile-view');
  const body = document.getElementById('body');
  return view && !view.hidden && body.classList.contains('profile-mode')
    && !body.classList.contains('pathways-mode');
}));
check('Profile has width on a phone', await page.evaluate(() => {
  const view = document.getElementById('profile-view');
  const cov = view && view.querySelector('.prof-cov');
  return !!view && view.getBoundingClientRect().width > 200
    && !!cov && cov.getBoundingClientRect().height > 0;
}));
check('Profile marks itself active', await page.evaluate(
  () => (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-profile'));

await finish();
