/* Marketplace: Mentors → profile → epic → pay → My Epics; epic nodes on Explore. */

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

await page.click('#btn-market');
await page.waitForTimeout(300);

const board = await page.evaluate(() => {
  const wrap = document.getElementById('market-wrap');
  const grid = document.getElementById('mkt-grid');
  const on = document.querySelector('#mkt-tabs .seg-btn.on');
  return {
    shown: !!(wrap && !wrap.hidden),
    cards: grid ? grid.querySelectorAll('.mkt-card').length : 0,
    tab: on ? on.dataset.mktTab : '',
    nav: (document.querySelector('nav.sidenav .nav-item.on') || {}).id,
    mentorCards: grid ? grid.querySelectorAll('[data-kind="mentor"]').length : 0
  };
});
check('Marketplace opens from the rail', board.shown && board.nav === 'btn-market',
  JSON.stringify(board));
check('Mentors tab shows mentor cards', board.tab === 'mentors' && board.mentorCards >= 3,
  board.tab + ', ' + board.mentorCards + ' mentors');

await page.click('[data-mkt-tab="epics"]');
await page.waitForTimeout(200);
const epicsTab = await page.evaluate(() => ({
  on: (document.querySelector('#mkt-tabs .seg-btn.on') || {}).dataset.mktTab,
  cards: document.querySelectorAll('#mkt-grid .mkt-card').length,
  badge: [...document.querySelectorAll('.mkt-badge')].some(b => /Epic/i.test(b.textContent))
}));
check('Epics tab switches', epicsTab.on === 'epics' && epicsTab.cards >= 3, JSON.stringify(epicsTab));
check('Epic cards carry an Epic badge', epicsTab.badge);

await page.click('[data-mkt-tab="mentors"]');
await page.waitForTimeout(150);
await page.click('#mkt-grid .mkt-mentor-card .ghost');
await page.waitForTimeout(250);
const profile = await page.evaluate(() => {
  const host = document.getElementById('mkt-mentor');
  const h2 = host && host.querySelector('h2');
  return {
    shown: !!(host && !host.hidden),
    name: h2 ? h2.textContent.trim() : '',
    epics: document.querySelectorAll('#mkt-mentor [data-mkt-open^="epic:"]').length,
    khora: /On Khora/i.test(host ? host.textContent : '')
  };
});
check('View profile opens mentor Khora profile', profile.shown && profile.name.length > 0, profile.name);
check('profile lists mentor epics', profile.epics >= 1 && profile.khora, JSON.stringify(profile));

await page.click('#mkt-mentor [data-mkt-open^="epic:"]');
await page.waitForTimeout(250);
const overview = await page.evaluate(() => {
  const ov = document.getElementById('mkt-overview');
  const h2 = ov && ov.querySelector('h2');
  return {
    shown: !!(ov && !ov.hidden),
    title: h2 ? h2.textContent.trim() : '',
    signup: !!document.querySelector('[data-mkt-checkout]')
  };
});
check('epic from profile opens overview', overview.shown && overview.title.length > 0, overview.title);
check('overview offers Sign up', overview.signup);

await page.click('[data-mkt-checkout]');
await page.waitForTimeout(200);
check('checkout scrim opens', await page.evaluate(
  () => document.getElementById('mkt-checkout-scrim').classList.contains('on')));

await page.click('#mkt-pay');
await page.waitForTimeout(400);
const afterPay = await page.evaluate(() => {
  const tab = (document.querySelector('#mkt-tabs .seg-btn.on') || {}).dataset.mktTab;
  const mine = Object.keys(JSON.parse(localStorage.getItem('palinode.market.v3') || '{}').enrollments || {});
  const learnOrOv = !document.getElementById('mkt-overview').hidden
    || !document.getElementById('mkt-learn').hidden;
  return { tab, enrolled: mine.length, learnOrOv };
});
check('Pay enrolls the epic', afterPay.enrolled >= 1, JSON.stringify(afterPay));
check('lands on My Epics context', afterPay.tab === 'mine' || afterPay.learnOrOv,
  JSON.stringify(afterPay));

await page.click('#mkt-overview [data-mkt-back-board]');
await page.waitForTimeout(200);
const mine = await page.evaluate(() => ({
  tab: (document.querySelector('#mkt-tabs .seg-btn.on') || {}).dataset.mktTab,
  cards: document.querySelectorAll('#mkt-grid .mkt-card').length,
  continue: !!document.querySelector('[data-mkt-learn]'),
  boardShown: !document.getElementById('mkt-board').hidden
}));
check('My Epics lists the enrollment', mine.boardShown && mine.tab === 'mine' && mine.cards >= 1 && mine.continue,
  JSON.stringify(mine));

await page.click('[data-mkt-learn]');
await page.waitForTimeout(250);
const learn = await page.evaluate(() => {
  const host = document.getElementById('mkt-learn');
  return {
    shown: !!(host && !host.hidden),
    lessons: document.querySelectorAll('[data-mkt-quest]').length,
    chat: !!document.querySelector('#mkt-learn [data-mkt-chat]')
  };
});
check('Continue opens learning view', learn.shown && learn.lessons >= 1, JSON.stringify(learn));
check('localStorage uses quest progress', await page.evaluate(() => {
  const en = Object.values(JSON.parse(localStorage.getItem('palinode.market.v3') || '{}').enrollments || {})[0];
  return !!(en && en.quests && Object.keys(en.quests).length);
}));

await page.click('#mkt-learn [data-mkt-chat]');
await page.waitForTimeout(200);
check('mentor chat panel opens', await page.evaluate(
  () => !document.getElementById('mkt-chat').hidden));

await page.click('#mkt-chat-close');
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForFunction(() => document.querySelectorAll('#gx-nodes .gx-node').length >= 1);
await page.waitForTimeout(400);
const epicNodes = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.gx-node.gx-epic')];
  return {
    count: nodes.length,
    hover: nodes.some(n => n.querySelector('[data-epic-share]')),
    ids: nodes.map(n => n.dataset.id)
  };
});
check('Explore field includes epic nodes', epicNodes.count >= 1, JSON.stringify(epicNodes));
check('epic nodes expose Share on hover chrome', epicNodes.hover);

const mentorNodes = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll('.gx-node.gx-mentor')];
  return {
    count: nodes.length,
    hover: nodes.some(n => n.querySelector('[data-mentor-share]')),
    ids: nodes.map(n => n.dataset.id)
  };
});
check('Explore field includes mentor nodes', mentorNodes.count >= 1, JSON.stringify(mentorNodes));
check('mentor nodes expose Share on hover chrome', mentorNodes.hover);

if (epicNodes.count) {
  const ref = await page.evaluate(() => {
    const id = document.querySelector('.gx-node.gx-epic')?.dataset?.id;
    return id && id.startsWith('epic:') ? id.slice(5) : null;
  });
  await page.evaluate(epicId => {
    if (!epicId || !window.PalinodeMarketplace) return;
    window.PalinodeGraph.close();
    document.body.classList.remove('exploring');
    PalinodeMarketplace.enter({ epicId });
  }, ref);
  await page.waitForTimeout(300);
  check('opening an epic lands on Marketplace overview', await page.evaluate(() => {
    const wrap = document.getElementById('market-wrap');
    const ov = document.getElementById('mkt-overview');
    return !!(wrap && !wrap.hidden && ov && !ov.hidden);
  }));
}

await page.evaluate(() => {
  if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) PalinodeMarketplace.leave();
});
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForFunction(() => {
  const row = document.getElementById('gx-corpus-row');
  const btn = document.getElementById('gx-eq-filter');
  return !!(row && !row.hidden && btn);
});
await page.click('#gx-eq-filter');
await page.waitForFunction(() => {
  const eq = document.getElementById('gx-eq-filter');
  return eq && eq.getAttribute('aria-pressed') === 'true'
    && document.querySelectorAll('.gx-node.gx-quest').length >= 1
    && document.querySelectorAll('.gx-node.gx-epic').length >= 1;
}, null, { timeout: 8000 });
const questField = await page.evaluate(() => {
  const quests = [...document.querySelectorAll('.gx-node.gx-quest')];
  const epics = [...document.querySelectorAll('.gx-node.gx-epic')];
  const mentors = [...document.querySelectorAll('.gx-node.gx-mentor')];
  const concepts = [...document.querySelectorAll('.gx-node.gx-concept')];
  return {
    quests: quests.length,
    epics: epics.length,
    mentors: mentors.length,
    concepts: concepts.length,
    pressed: document.getElementById('gx-eq-filter').getAttribute('aria-pressed')
  };
});
check('Epics & Quests filter activates', questField.pressed === 'true');
check('filter shows epics and quests only',
  questField.quests >= 3 && questField.epics >= 1 && questField.mentors === 0 && questField.concepts === 0,
  JSON.stringify(questField));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
