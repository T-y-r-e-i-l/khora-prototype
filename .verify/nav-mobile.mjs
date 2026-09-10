/* On a phone the rail is a FAB that fans out: Notes, Explore, Market, Pathways, Quests, Profile. */

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
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await mockKhora(page);
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });

const tryClick = async sel => {
  try { await page.click(sel, { timeout: 3000 }); return { ok: true, why: '' }; }
  catch (e) { return { ok: false, why: String(e.message).split('\n')[0] }; }
};

const openFab = async () => {
  if (await page.evaluate(() => document.documentElement.classList.contains('fab-open'))) return;
  await page.click('#nav-fab-toggle');
  await page.waitForFunction(() => document.documentElement.classList.contains('fab-open'));
  await page.waitForFunction(() => {
    const el = document.getElementById('btn-profile');
    return el && parseFloat(getComputedStyle(el).opacity) > 0.95;
  });
};

const pickNav = async sel => {
  await openFab();
  return tryClick(sel);
};

const finish = async () => {
  if (problems.length) problems.forEach(p => check(p, false));
  console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
  await browser.close();
  process.exit(fail ? 1 : 0);
};

const fab = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav');
  const toggle = document.getElementById('nav-fab-toggle');
  const cs = getComputedStyle(nav);
  const r = nav.getBoundingClientRect();
  const t = toggle.getBoundingClientRect();
  const shown = el => !!(el && getComputedStyle(el).display !== 'none');
  const itemOpacity = id => {
    const el = document.getElementById(id);
    return el ? parseFloat(getComputedStyle(el).opacity) : -1;
  };
  return {
    position: cs.position,
    left: Math.round(r.left), width: Math.round(r.width),
    bottom: Math.round(window.innerHeight - r.bottom),
    height: Math.round(r.height),
    toggleShown: shown(toggle),
    toggleW: Math.round(t.width), toggleH: Math.round(t.height),
    brandShown: shown(document.querySelector('.nav-brand')),
    insightsShown: shown(document.getElementById('btn-nav-insights')),
    newShown: shown(document.getElementById('btn-new')),
    noteInsightsShown: shown(document.getElementById('btn-note-insights')),
    closed: !document.documentElement.classList.contains('fab-open'),
    itemOps: ['btn-rail','btn-explore','btn-market','btn-pathways','btn-quests','btn-profile']
      .map(id => ({ id, op: itemOpacity(id) }))
  };
});

check('the nav is pinned as a FAB', fab.position === 'fixed' && fab.bottom >= 10 && fab.bottom <= 30,
  fab.position + ', ' + fab.bottom + 'px from the bottom');
check('the FAB sits in the bottom-right', fab.left > 280 && fab.width <= 80,
  'left ' + fab.left + ', width ' + fab.width);
check('the FAB toggle is visible', fab.toggleShown && fab.toggleW >= 56 && fab.toggleH >= 56,
  fab.toggleW + '×' + fab.toggleH);
check('destinations are collapsed until opened',
  fab.closed && fab.itemOps.every(i => i.op < 0.2),
  fab.itemOps.map(i => i.id + '=' + i.op).join(','));
check('the brand is hidden on a phone', !fab.brandShown);
check('Insights is off the FAB destinations', !fab.insightsShown);
check('New note is still reachable', fab.newShown);
check('the write tabs are gone', await page.evaluate(() => !document.getElementById('write-tabs')));
check('the chevron is not the Insights opener',
  !(await page.isVisible('#btn-insights')));

await openFab();
const fan = await page.evaluate(() => {
  const items = ['btn-rail','btn-explore','btn-market','btn-pathways','btn-quests','btn-profile']
    .map(id => {
      const el = document.getElementById(id);
      const b = el.getBoundingClientRect();
      return {
        id,
        op: parseFloat(getComputedStyle(el).opacity),
        top: Math.round(b.top),
        left: Math.round(b.left),
        pe: getComputedStyle(el).pointerEvents
      };
    });
  return {
    open: document.documentElement.classList.contains('fab-open'),
    scrim: !document.getElementById('nav-fab-scrim').hidden,
    items,
    labels: items.map(i => {
      const lab = document.querySelector('#' + i.id + ' .nav-lab');
      return (lab && (lab.innerText || lab.textContent) || '').trim();
    })
  };
});
check('opening the FAB fans destinations out', fan.open && fan.scrim);
check('fan destinations are Notes, Explore, Market, Pathways, Quests, Profile',
  fan.items.map(i => i.id).join(',') === 'btn-rail,btn-explore,btn-market,btn-pathways,btn-quests,btn-profile'
    && fan.labels.map(l => l.toLowerCase()).join(',') === 'notes,explore,market,pathways,quests,profile',
  fan.labels.join(','));
check('fan items are visible and clickable',
  fan.items.every(i => i.op > 0.9 && i.pe !== 'none'));
check('fan items are spaced apart',
  (() => {
    const pairs = [[0,1],[2,3],[3,4],[0,2],[1,4],[3,5]];
    return pairs.every(([a, b]) => {
      const A = fan.items[a], B = fan.items[b];
      return Math.hypot(B.left - A.left, B.top - A.top) >= 72;
    });
  })(),
  fan.items.map(i => i.id + '@' + i.left + ',' + i.top).join(' | '));
check('fan items sit in a 2-3-1 cluster',
  Math.abs(fan.items[0].top - fan.items[1].top) <= 8
    && Math.abs(fan.items[2].top - fan.items[3].top) <= 8
    && Math.abs(fan.items[3].top - fan.items[4].top) <= 8
    && fan.items[0].top < fan.items[2].top - 60
    && fan.items[2].top < fan.items[5].top - 60
    && Math.abs(fan.items[5].left - fan.items[3].left) <= 16,
  fan.items.map(i => i.id + '@' + i.left + ',' + i.top).join(' | '));
check('no fan item bleeds off the page',
  fan.items.every(i => i.left >= 8 && i.left + 64 <= 390 && i.top >= 8),
  fan.items.map(i => i.id + '@' + i.left + ',' + i.top).join(' | '));

await page.click('#nav-fab-scrim');
await page.waitForTimeout(200);
check('the scrim closes the FAB', await page.evaluate(
  () => !document.documentElement.classList.contains('fab-open')
    && document.getElementById('nav-fab-scrim').hidden));

check('Explore is the default view', await page.evaluate(() =>
  !document.getElementById('graph').hidden
  && (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-explore'));

await pickNav('#btn-rail');
await page.waitForTimeout(250);

const firstList = await page.evaluate(() => {
  const rail = document.querySelector('aside.rail');
  const back = document.getElementById('note-back');
  const r = rail.getBoundingClientRect();
  return {
    rail: document.getElementById('body').classList.contains('show-rail'),
    display: getComputedStyle(rail).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom),
    label: (document.querySelector('#btn-rail .nav-lab-m') || {}).textContent,
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none'),
    fabIcon: !!(document.querySelector('#nav-fab-menu-icon svg path[d*="M5 7"]'))
  };
});
check('Notes opens on the note list', firstList.rail && firstList.display !== 'none');
check('the bar label is Notes', (firstList.label || '').trim() === 'Notes', firstList.label);
check('the list is full width', firstList.width === 390, firstList.width + 'px');
check('the list starts at the top', firstList.top === 0, firstList.top + 'px');
check('the list can fill under the floating FAB', firstList.bottom >= 840,
  firstList.bottom + 'px');
check('the back control is off the list', !firstList.backShown);
check('the FAB shows a hamburger menu', firstList.fabIcon);

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
  const r = panel.getBoundingClientRect();
  const close = document.getElementById('btn-insights');
  return {
    display: getComputedStyle(panel).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom),
    on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
    closeShown: !!(close && getComputedStyle(close).display !== 'none'
      && close.getClientRects().length)
  };
});
check('Insights opens from the note', openedIns.ok && ins.display !== 'none', openedIns.why);
check('the Reading panel is full width', ins.width === 390, ins.width + 'px');
check('it starts at the top', ins.top === 0, ins.top + 'px');
check('Insights can fill under the floating FAB', ins.bottom >= 840, ins.bottom + 'px');
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

const backToNotes = await pickNav('#btn-rail');
await page.waitForTimeout(250);
const afterNotes = await page.evaluate(() => ({
  insights: getComputedStyle(document.querySelector('aside.insights')).display,
  on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
  rail: document.getElementById('body').classList.contains('show-rail'),
  backHidden: document.getElementById('note-back').hidden,
  fabClosed: !document.documentElement.classList.contains('fab-open')
}));
check('Notes leaves Insights', backToNotes.ok && afterNotes.insights === 'none', backToNotes.why);
check('Notes marks itself active', afterNotes.on === 'btn-rail', afterNotes.on);
check('Notes returns to the list', afterNotes.rail === true);
check('picking a destination closes the FAB', afterNotes.fabClosed);
check('the back control is off the list again', afterNotes.backHidden);

await pickNav('#btn-rail');
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
  const toggle = document.getElementById('nav-fab-toggle').getBoundingClientRect();
  const dim = document.getElementById('gx-dim');
  const midFab = document.elementFromPoint(toggle.left + toggle.width / 2, toggle.top + toggle.height / 2);
  return {
    graphBottom: Math.round(g.bottom),
    dimVisible: !!(dim && getComputedStyle(dim).display !== 'none'),
    hitsFab: !!(midFab && midFab.closest('#nav-fab-toggle, nav.sidenav')),
    on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id
  };
});
check('Explore opens the graph full-bleed', exp.graphBottom >= 840, exp.graphBottom + 'px');
check('2D/3D stays in the graph chrome', exp.dimVisible);
check('the FAB stays clickable over Explore', exp.hitsFab);
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

await pickNav('#btn-rail');
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
await pickNav('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
await page.waitForTimeout(300);
const corpus = await page.evaluate(() => {
  const shown = el => !!(el && getComputedStyle(el).display !== 'none' && !el.hidden);
  const fab = document.getElementById('nav-fab-toggle').getBoundingClientRect();
  const search = document.getElementById('gx-search');
  const q = search.getBoundingClientRect();
  const zoom = document.querySelector('.gx-zoom').getBoundingClientRect();
  const dim = document.getElementById('gx-dim').getBoundingClientRect();
  const sort = document.querySelector('#gx-sort').closest('label').getBoundingClientRect();
  const trad = document.getElementById('gx-trad-wrap').getBoundingClientRect();
  const cat = document.getElementById('gx-cat-wrap').getBoundingClientRect();
  const save = document.getElementById('gx-save-path').getBoundingClientRect();
  const chips = [...document.querySelectorAll('#gx-filters .chip')];
  const chipShown = chips.some(el => getComputedStyle(el).display !== 'none'
    && el.getBoundingClientRect().width > 0);
  const overlap = (a, b) => !(a.right <= b.left || a.left >= b.right
    || a.bottom <= b.top || a.top >= b.bottom);
  return {
    catShown: shown(document.getElementById('gx-cat-wrap')),
    tradShown: shown(document.getElementById('gx-trad-wrap')),
    chipShown,
    catRightOfSort: cat.left >= sort.right - 1,
    tradBetween: trad.left >= sort.right - 1 && cat.left >= trad.right - 1,
    between: sort.left >= zoom.right - 1 && cat.right <= dim.left + 1,
    sameRow: Math.abs(sort.top - zoom.top) < 24 && Math.abs(cat.top - dim.top) < 24,
    searchW: Math.round(q.width),
    searchClear: q.right <= fab.left - 4,
    dimClear: dim.right <= fab.left - 4,
    zoomClear: zoom.right <= fab.left - 4,
    filtersClear: cat.right <= fab.left - 4 && sort.right <= fab.left - 4,
    searchBottom: Math.round(q.bottom),
    fabBottom: Math.round(fab.bottom),
    zoomH: Math.round(zoom.height),
    dimH: Math.round(dim.height),
    rowH: Math.round(document.getElementById('gx-corpus-row').getBoundingClientRect().height),
    toolsAboveSearch: Math.max(zoom.bottom, dim.bottom, cat.bottom) <= q.top + 1,
    saveClear: !overlap(save, cat) && !overlap(save, trad)
  };
});
check('sort and filter sit between Fit and 2D/3D', corpus.between && corpus.sameRow);
check('filter sits to the right of sort', corpus.catShown && corpus.catRightOfSort);
check('tradition sits between sort and kind', corpus.tradShown && corpus.tradBetween);
check('category chips are off the phone chrome', !corpus.chipShown);
check('search clears the FAB column', corpus.searchClear,
  corpus.searchW + 'px wide');
check('zoom clears the FAB column', corpus.zoomClear);
check('filters clear the FAB column', corpus.filtersClear);
check('2D/3D clears the FAB column', corpus.dimClear);
check('search shares the FAB baseline',
  Math.abs(corpus.searchBottom - corpus.fabBottom) <= 2,
  corpus.searchBottom + ' vs FAB ' + corpus.fabBottom);
check('tools sit above search', corpus.toolsAboveSearch);
check('top-row tools share one height',
  corpus.zoomH === corpus.dimH && corpus.dimH === corpus.rowH,
  [corpus.zoomH, corpus.dimH, corpus.rowH].join(','));
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
await pickNav('#btn-pathways');
await page.waitForTimeout(250);
const pathLib = await page.evaluate(() => {
  const rail = document.querySelector('aside.rail');
  const back = document.getElementById('path-back');
  const list = document.getElementById('path-list');
  const r = rail.getBoundingClientRect();
  const shown = el => !!(el && getComputedStyle(el).display !== 'none' && !el.hidden);
  return {
    mode: document.getElementById('body').classList.contains('pathways-mode'),
    overlay: !!document.getElementById('pathways'),
    rail: document.getElementById('body').classList.contains('show-rail'),
    listShown: shown(list),
    title: (document.querySelector('.rail-lab-paths') || {}).textContent,
    display: getComputedStyle(rail).display,
    top: Math.round(r.top), width: Math.round(r.width),
    bottom: Math.round(r.bottom),
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none'),
    hasWalk: /A short walk/.test(list.textContent || '')
  };
});
check('Pathways is a page, not an overlay', pathLib.mode && !pathLib.overlay);
check('Pathways opens on the pathway library', pathLib.rail && pathLib.listShown && pathLib.hasWalk);
check('the library title is Pathways', (pathLib.title || '').trim() === 'Pathways', pathLib.title);
check('the library is full width', pathLib.width === 390, pathLib.width + 'px');
check('the library starts at the top', pathLib.top === 0, pathLib.top + 'px');
check('the pathway library can fill under the FAB', pathLib.bottom >= 840, pathLib.bottom + 'px');
check('the back control is off the library', !pathLib.backShown);

await page.click('#path-list .note-item');
await page.waitForTimeout(300);
const pathWalk = await page.evaluate(() => {
  const wrap = document.getElementById('pathway-wrap');
  const back = document.getElementById('path-back');
  return {
    rail: document.getElementById('body').classList.contains('show-rail'),
    wrap: wrap && !wrap.hidden,
    backShown: !!(back && !back.hidden && getComputedStyle(back).display !== 'none'),
    label: (document.getElementById('path-back-label').textContent || '').trim(),
    hasNav: !!document.querySelector('.walk-nav')
  };
});
check('opening a pathway leaves the library', !pathWalk.rail && pathWalk.wrap);
check('the back control is on the pathway', pathWalk.backShown);
check('the back label shows the pathway title', pathWalk.label === 'A short walk', pathWalk.label);
check('the Prev / Next bar is gone', !pathWalk.hasNav);

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

await pickNav('#btn-quests');
await page.waitForTimeout(300);
const questsPage = await page.evaluate(() => {
  const empty = document.getElementById('quest-empty');
  const list = document.getElementById('quest-list');
  const body = document.getElementById('body');
  const market = document.getElementById('market-wrap');
  const rail = document.querySelector('aside.rail');
  const r = rail.getBoundingClientRect();
  const shown = el => !!(el && getComputedStyle(el).display !== 'none' && !el.hidden);
  return {
    mode: body.classList.contains('quests-mode'),
    rail: body.classList.contains('show-rail'),
    listShown: shown(list),
    emptyShown: shown(empty),
    marketHidden: !!(market && market.hidden),
    title: (document.querySelector('.rail-lab-quests') || {}).textContent,
    filters: shown(document.getElementById('quest-log-filters')),
    width: Math.round(r.width),
    top: Math.round(r.top),
    bottom: Math.round(r.bottom),
    on: (document.querySelector('nav.sidenav .nav-item.on') || {}).id
  };
});
check('Quests is a page, not a Marketplace tab',
  questsPage.mode && questsPage.rail && questsPage.listShown && questsPage.marketHidden);
check('the Quests tray title is Quests', (questsPage.title || '').trim() === 'Quests', questsPage.title);
check('Quests shows status filters in the tray', questsPage.filters);
check('Quests opens on the empty tray', questsPage.emptyShown);
check('the Quests tray is full width', questsPage.width === 390, questsPage.width + 'px');
check('the Quests tray starts at the top', questsPage.top === 0, questsPage.top + 'px');
check('the Quests tray can fill under the FAB', questsPage.bottom >= 840, questsPage.bottom + 'px');
check('Quests marks itself active', questsPage.on === 'btn-quests', questsPage.on);

await pickNav('#btn-profile');
await page.waitForTimeout(300);
check('Profile opens from the FAB', await page.evaluate(() => {
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
check('the FAB stays a hamburger when closed', await page.evaluate(() => {
  const menu = document.getElementById('nav-fab-menu-icon');
  const close = document.querySelector('.nav-fab-close');
  if (!menu || !close) return false;
  return parseFloat(getComputedStyle(menu).opacity) > 0.9
    && parseFloat(getComputedStyle(close).opacity) < 0.1
    && !!menu.querySelector('svg path[d*="M5 7"]');
}));

await finish();
