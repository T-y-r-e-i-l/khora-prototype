/* Unified Quests P1: discover → accept → log → abandon; epic enroll syncs log. */

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

await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForFunction(() => {
  const row = document.getElementById('gx-corpus-row');
  return !!(row && !row.hidden && document.getElementById('gx-eq-filter'));
});
await page.click('#gx-eq-filter');
await page.waitForFunction(() =>
  document.querySelectorAll('.gx-node.gx-quest.gx-mercurial').length >= 1, null, { timeout: 8000 });

const freeId = await page.evaluate(() => {
  const el = document.querySelector('.gx-node.gx-quest.gx-mercurial');
  return el ? el.dataset.id.replace(/^quest:/, '') : null;
});
check('Mercurial free quests appear under Epics & Quests', !!freeId, freeId);

await page.evaluate(id => {
  if (window.PalinodeQuests) PalinodeQuests.openOverview(id);
}, freeId);
await page.waitForSelector('#quest-overview-scrim.on');
check('quest overview opens', await page.evaluate(
  () => document.getElementById('quest-overview-scrim').classList.contains('on')));

await page.evaluate(id => {
  PalinodeQuests.accept(id, 'explore');
  PalinodeQuests.closeOverview();
}, freeId);
await page.waitForTimeout(200);
const afterAccept = await page.evaluate(id => {
  const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  const entry = (st.entries || {})[id];
  return entry && entry.status;
}, freeId);
check('Accept adds quest to active log', afterAccept === 'active', afterAccept);

await page.evaluate(() => {
  if (window.PalinodeGraph) PalinodeGraph.close();
  document.body.classList.remove('exploring');
  if (window.PalinodeQuests) PalinodeQuests.enter();
});
await page.waitForTimeout(250);
const logActive = await page.evaluate(id => {
  const item = document.querySelector(`#quest-list [data-open-quest="${id}"]`);
  const body = document.getElementById('body');
  const filters = document.getElementById('quest-log-filters');
  return !!(item && body && body.classList.contains('quests-mode')
    && filters && !filters.hidden
    && /Quests/.test((document.querySelector('.rail-lab-quests') || {}).textContent || ''));
}, freeId);
check('Quests page lists the active quest', logActive);

await page.evaluate(id => {
  PalinodeQuests.open(id);
}, freeId);
await page.waitForTimeout(150);
const detailOpen = await page.evaluate(id => {
  const wrap = document.getElementById('quests-wrap');
  const title = wrap && wrap.querySelector('.mkt-title');
  return !!(wrap && !wrap.hidden && title && document.querySelector(`#quest-list .note-item.active[data-open-quest="${id}"]`));
}, freeId);
check('Selecting a quest opens it in the centre', detailOpen);

await page.evaluate(id => {
  PalinodeQuests.abandon(id);
  PalinodeQuests.renderLog();
}, freeId);
const abandoned = await page.evaluate(id => {
  const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  return (st.entries || {})[id]?.status;
}, freeId);
check('Abandon moves quest to abandoned', abandoned === 'abandoned', abandoned);

await page.evaluate(() => {
  if (window.PalinodeGraph) PalinodeGraph.close();
  document.body.classList.remove('exploring');
});
await page.click('#btn-market');
await page.waitForTimeout(300);
await page.click('[data-mkt-tab="epics"]');
await page.waitForTimeout(150);
await page.click('#mkt-grid .mkt-card .ghost.solid, #mkt-grid .mkt-card [data-mkt-open]');
await page.waitForTimeout(200);
const hasCheckout = await page.evaluate(() => !!document.querySelector('[data-mkt-checkout]'));
if (hasCheckout) {
  await page.click('[data-mkt-checkout]');
  await page.waitForTimeout(150);
  await page.click('#mkt-pay');
  await page.waitForTimeout(400);
} else {
  await page.evaluate(() => {
    const id = 'e-stoic-control';
    PalinodeMarketplace.enter({ epicId: id });
  });
}
const epicSynced = await page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  const market = JSON.parse(localStorage.getItem('palinode.market.v3') || '{}');
  const epicId = Object.keys(market.enrollments || {})[0];
  if (!epicId) return { ok: false, reason: 'no enrollment' };
  const questIds = (window.PalinodeMarketData.epicOf(epicId).questIds || []);
  const active = questIds.filter(id => st.entries?.[id]?.status === 'active').length;
  return { ok: active >= 1, active, total: questIds.length, epicId };
});
check('Epic enroll activates packaged quests in log', epicSynced.ok, JSON.stringify(epicSynced));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
