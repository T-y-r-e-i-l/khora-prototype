/* Home dashboard: GridStack layout, swap/add/remove, prompt mount. */

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
await page.waitForSelector('#dashboard-wrap:not([hidden])', { timeout: 10000 });
await page.evaluate(() => {
  const prefs = window.PalinodeStore && PalinodeStore.Prefs;
  if (prefs) {
    ['explore', 'write', 'insights', 'market', 'pathways', 'quests', 'profile', 'home']
      .forEach(id => prefs.tourDone(id));
  }
  if (window.PalinodeOnboarding) PalinodeOnboarding._reset();
});
await page.waitForTimeout(200);

const boot = await page.evaluate(() => {
  const wrap = document.getElementById('dashboard-wrap');
  const body = document.getElementById('body');
  const cards = [...document.querySelectorAll('#dash-grid [data-dash-card]')].map(el => el.dataset.dashCard).sort();
  const prompt = document.getElementById('prompt-card');
  const host = document.getElementById('dash-prompt-host');
  const constel = document.querySelector('#dash-card-explore .path-constel, #dash-card-explore .dash-constel');
  const layout = PalinodeStore.Prefs.dashLayout();
  return {
    mode: body.classList.contains('dashboard-mode'),
    shown: wrap && !wrap.hidden,
    nav: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
    cards,
    rails: body.classList.contains('rail-closed') && body.classList.contains('insights-closed'),
    promptMounted: !!(prompt && host && host.contains(prompt)),
    hasConstel: !!constel,
    writeLabel: (document.getElementById('btn-write') || {}).textContent,
    gridstack: document.getElementById('dash-grid').classList.contains('grid-stack'),
    panelCount: layout.panels.length,
    types: layout.panels.map(p => p.type).sort().join(',')
  };
});
check('boots into Dashboard', boot.mode && boot.shown && boot.nav === 'btn-home', JSON.stringify(boot));
check('write rails stay closed on Home', boot.rails);
check('six area cards render by default',
  boot.cards.join(',') === 'explore,library,notes,pathways,profile,quests',
  boot.cards.join(','));
check('GridStack is active', boot.gridstack);
check('default layout has six unique types',
  boot.panelCount === 6 && boot.types === 'explore,library,notes,pathways,profile,quests',
  boot.types);
check('Explore shows a constellation preview', boot.hasConstel);
check('Notes hosts the real prompt module',
  boot.promptMounted && /Write on this/i.test(boot.writeLabel || ''),
  JSON.stringify({ mounted: boot.promptMounted, write: boot.writeLabel }));
check('layout chrome actions exist', await page.isVisible('#dash-btn-home-menu'));

await page.click('#dash-card-explore [data-dash-go="explore"]');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
const afterExplore = await page.evaluate(() => ({
  graph: !document.getElementById('graph').hidden,
  dash: document.getElementById('dashboard-wrap').hidden,
  mode: document.getElementById('body').classList.contains('dashboard-mode'),
  nav: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
  touched: !!(window.PalinodeStore && PalinodeStore.Prefs.lastExploreAt()),
  promptHome: !!(document.getElementById('prompt-rail-home')
    && document.getElementById('prompt-rail-home').contains(document.getElementById('prompt-card')))
}));
check('Explore card opens the field',
  afterExplore.graph && afterExplore.dash && !afterExplore.mode && afterExplore.nav === 'btn-explore',
  JSON.stringify(afterExplore));
check('leaving Explore stamps lastExploreAt', afterExplore.touched);
check('prompt returns to the Notes rail', afterExplore.promptHome);

await page.click('#btn-home');
await page.waitForSelector('#dashboard-wrap:not([hidden])');
await page.waitForTimeout(200);

// Remove pathways, then add it back
await page.click('#dash-card-pathways [data-dash-menu]');
await page.waitForSelector('.dash-type-picker [data-dash-action="remove"]');
await page.click('.dash-type-picker [data-dash-action="remove"]');
await page.waitForTimeout(200);
const afterRemove = await page.evaluate(() => {
  const types = PalinodeStore.Prefs.dashLayout().panels.map(p => p.type).sort();
  return {
    types: types.join(','),
    hasPathways: !!document.getElementById('dash-card-pathways'),
    freeTypes: window.PalinodeDashboard.CARD_META
      ? Object.keys(PalinodeDashboard.CARD_META).filter(t =>
          !PalinodeStore.Prefs.dashLayout().panels.some(p => p.type === t))
      : ['pathways']
  };
});
check('Remove drops Pathways from layout',
  !afterRemove.hasPathways && !afterRemove.types.includes('pathways') && afterRemove.freeTypes.includes('pathways'),
  JSON.stringify(afterRemove));

await page.click('#dash-btn-home-menu');
await page.waitForSelector('#dash-menu-add:not([disabled])');
await page.click('#dash-menu-add');
await page.waitForSelector('.dash-type-picker [data-pick-type="pathways"]');
await page.click('.dash-type-picker [data-pick-type="pathways"]');
await page.waitForTimeout(200);
const afterAdd = await page.evaluate(() => ({
  hasPathways: !!document.getElementById('dash-card-pathways'),
  types: PalinodeStore.Prefs.dashLayout().panels.map(p => p.type).sort().join(',')
}));
check('Add restores Pathways', afterAdd.hasPathways && afterAdd.types.includes('pathways'),
  JSON.stringify(afterAdd));

// Swap library → keep geometry concept: swap library with... all present, so remove profile first then swap
await page.click('#dash-card-profile [data-dash-menu]');
await page.click('.dash-type-picker [data-dash-action="remove"]');
await page.waitForTimeout(150);
await page.click('#dash-card-library [data-dash-menu]');
await page.click('.dash-type-picker [data-dash-action="swap"]');
await page.waitForSelector('.dash-type-picker [data-pick-type="profile"]');
await page.click('.dash-type-picker [data-pick-type="profile"]');
await page.waitForTimeout(200);
const afterSwap = await page.evaluate(() => {
  const panels = PalinodeStore.Prefs.dashLayout().panels;
  const profile = panels.find(p => p.type === 'profile');
  return {
    hasLibrary: !!document.getElementById('dash-card-library'),
    hasProfile: !!document.getElementById('dash-card-profile'),
    profileId: profile && profile.id
  };
});
check('Swap replaces Library with Profile',
  !afterSwap.hasLibrary && afterSwap.hasProfile, JSON.stringify(afterSwap));

await page.click('#dash-btn-home-menu');
await page.waitForSelector('#dash-menu-reset');
await page.click('#dash-menu-reset');
await page.waitForTimeout(200);
const afterReset = await page.evaluate(() => {
  const types = PalinodeStore.Prefs.dashLayout().panels.map(p => p.type).sort().join(',');
  return {
    types,
    cards: [...document.querySelectorAll('#dash-grid [data-dash-card]')].map(el => el.dataset.dashCard).sort().join(',')
  };
});
check('Reset restores the six default cards',
  afterReset.types === 'explore,library,notes,pathways,profile,quests'
    && afterReset.cards === 'explore,library,notes,pathways,profile,quests',
  JSON.stringify(afterReset));

// Persist across reload
await page.evaluate(() => {
  const panels = PalinodeStore.Prefs.dashLayout().panels.filter(p => p.type !== 'quests');
  PalinodeStore.Prefs.setDashLayout(panels);
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#dashboard-wrap:not([hidden])');
await page.evaluate(() => {
  const prefs = window.PalinodeStore && PalinodeStore.Prefs;
  if (prefs) {
    ['explore', 'write', 'insights', 'market', 'pathways', 'quests', 'profile', 'home']
      .forEach(id => prefs.tourDone(id));
  }
  if (window.PalinodeOnboarding) PalinodeOnboarding._reset();
});
await page.waitForTimeout(200);
const persisted = await page.evaluate(() => {
  const types = PalinodeStore.Prefs.dashLayout().panels.map(p => p.type).sort().join(',');
  return {
    types,
    noQuests: !document.getElementById('dash-card-quests')
  };
});
check('layout persists across reload',
  persisted.noQuests && !persisted.types.includes('quests'),
  JSON.stringify(persisted));

await page.click('#dash-btn-home-menu');
await page.waitForSelector('#dash-menu-reset');
await page.click('#dash-menu-reset');
await page.waitForTimeout(150);

await page.click('#btn-write');
await page.waitForTimeout(400);
const wrote = await page.evaluate(() => {
  const ed = document.getElementById('editor-wrap');
  const notes = window.PalinodeStore && PalinodeStore.Notes.all();
  return {
    editor: ed && !ed.hidden,
    nav: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
    count: notes ? notes.length : 0,
    dash: document.getElementById('dashboard-wrap').hidden
  };
});
check('Write on this from Home opens a note',
  wrote.editor && wrote.dash && wrote.count >= 1, JSON.stringify(wrote));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
