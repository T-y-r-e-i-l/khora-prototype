/* First-visit coach marks: Home once, then Explore/Notes as visited.
   Help force-replays; Insights tours on first Reading open. */

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
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 });

const tipHome = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  const prog = document.getElementById('coach-progress');
  return {
    shown: tip && !tip.hidden,
    body: body && body.textContent,
    progress: prog && prog.textContent,
    tours: (JSON.parse(localStorage.getItem('palinode.v1') || '{}').prefs || {}).tours
  };
});
check('Home coach tip appears on first visit', tipHome.shown
  && /Home gathers|cards you can open/i.test(tipHome.body || ''), tipHome.body);
check('Home tip shows step progress', /^1 of \d+$/.test(tipHome.progress || ''), tipHome.progress);
check('Home tour has a few steps', Number((tipHome.progress || '').split(' of ')[1]) >= 2, tipHome.progress);

const helpVisible = await page.evaluate(() => {
  const btn = document.getElementById('btn-help');
  if (!btn) return false;
  const r = btn.getBoundingClientRect();
  const style = getComputedStyle(btn);
  return r.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
});
check('Help control is present in sidenav', helpVisible);

const helpGap = await page.evaluate(() => {
  const help = document.getElementById('btn-help');
  const profile = document.getElementById('btn-profile');
  if (!help || !profile) return null;
  return help.getBoundingClientRect().top - profile.getBoundingClientRect().bottom;
});
check('Help sits below Profile with breathing room', helpGap != null && helpGap >= 24, String(helpGap));

let guard = 0;
const homeBodies = [];
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 8) break;
  homeBodies.push((await page.textContent('#coach-body')) || '');
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}
check('Home tour finishes after Next/Done', !(await page.isVisible('#coach-tip')));
check('Home tour covers the grid and a card',
  homeBodies.some(b => /Home gathers|cards you can open/i.test(b))
    && homeBodies.some(b => /field|Dive back|Notes card|prompt/i.test(b)),
  homeBodies.join(' | '));

const afterHome = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return (raw.prefs && raw.prefs.tours) || {};
});
check('Home marked done in prefs', !!afterHome.home, JSON.stringify(afterHome));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#dashboard-wrap:not([hidden])', { timeout: 10000 });
await page.waitForTimeout(500);
const noRepeatHome = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  return !tip || tip.hidden;
});
check('Home tip does not return after reload', noRepeatHome);

// Help force-replays Home
await page.click('#btn-help');
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 }).catch(() => null);
const helpReplayHome = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  return { shown: tip && !tip.hidden, body: body && body.textContent };
});
check('Help replays Home coach on Home', helpReplayHome.shown
  && /Home gathers|cards you can open|field|Notes card/i.test(helpReplayHome.body || ''),
  helpReplayHome.body);
guard = 0;
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 8) break;
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}

// Explore tour on first Explore visit
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 10000 });
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 });

const tip1 = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  const prog = document.getElementById('coach-progress');
  return {
    shown: tip && !tip.hidden,
    body: body && body.textContent,
    progress: prog && prog.textContent
  };
});
check('Explore coach tip appears on first Explore visit', tip1.shown, tip1.body);
check('Explore tip shows step progress', /^1 of \d+$/.test(tip1.progress || ''), tip1.progress);
check('Explore tour covers the full rail', Number((tip1.progress || '').split(' of ')[1]) >= 7, tip1.progress);

guard = 0;
const exploreBodies = [];
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 14) break;
  exploreBodies.push((await page.textContent('#coach-body')) || '');
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}
check('Explore tour finishes after Next/Done', !(await page.isVisible('#coach-tip')));
check('Explore tour introduces Market, Pathways, Quests, Profile',
  ['Market', 'Pathways', 'Quests', 'Profile'].every(w => exploreBodies.some(b => b.includes(w))),
  exploreBodies.join(' | '));
check('Explore tour introduces Help', exploreBodies.some(b => /Help replays/i.test(b)),
  exploreBodies[exploreBodies.length - 1] || '');

const afterExplore = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return (raw.prefs && raw.prefs.tours) || {};
});
check('Explore marked done in prefs', !!afterExplore.explore, JSON.stringify(afterExplore));

await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('#dashboard-wrap:not([hidden])', { timeout: 10000 });
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 10000 });
await page.waitForTimeout(500);
const noRepeat = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  return !tip || tip.hidden;
});
check('Explore tip does not return after reload', noRepeat);

// Help force-replays Explore
await page.click('#btn-help');
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 }).catch(() => null);
const helpReplay = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  return { shown: tip && !tip.hidden, body: body && body.textContent };
});
check('Help replays Explore coach on Explore', helpReplay.shown, helpReplay.body);
const hubPair = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const lab = [...document.querySelectorAll('.gx-node .gx-label')]
    .find(el => (el.textContent || '').trim() === 'Palinode');
  const hub = lab && lab.closest('.gx-node');
  const orb = hub && hub.querySelector('.gx-orb');
  if (!tip || !orb || tip.hidden) return { ok: false, why: 'missing' };
  const tr = tip.getBoundingClientRect();
  const or = orb.getBoundingClientRect();
  const ox = or.left + or.width / 2;
  const oy = or.bottom;
  const under = tr.top > oy - 4;
  const nearX = Math.abs((tr.left + tr.width / 2) - ox) < 80;
  return {
    ok: under && nearX && tip.dataset.place === 'bottom',
    tipLeft: Math.round(tr.left),
    tipTop: Math.round(tr.top),
    orbX: Math.round(ox),
    orbY: Math.round(oy),
    place: tip.dataset.place
  };
});
check('Explore field tip pairs with the Palinode hub', hubPair.ok, JSON.stringify(hubPair));
await page.click('#coach-next');
await page.waitForTimeout(250);
const chromePair = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const row = document.getElementById('gx-corpus-row');
  if (!tip || tip.hidden || !row || row.hidden) {
    return { ok: false, why: 'missing', body: document.getElementById('coach-body')?.textContent };
  }
  const tr = tip.getBoundingClientRect();
  const rr = row.getBoundingClientRect();
  const under = tr.top > rr.bottom - 8;
  const nearX = Math.abs((tr.left + tr.width / 2) - (rr.left + rr.width / 2)) < 200;
  return {
    ok: under && nearX && /chrome|filters|Search/i.test(document.getElementById('coach-body')?.textContent || ''),
    tipTop: Math.round(tr.top),
    rowBottom: Math.round(rr.bottom),
    tipLeft: Math.round(tr.left),
    place: tip.dataset.place
  };
});
check('Explore chrome tip pairs with the corpus filter row', chromePair.ok, JSON.stringify(chromePair));
guard = 0;
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 14) break;
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}

// Notes tour
await page.click('#btn-rail');
await page.waitForTimeout(400);
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 }).catch(() => null);
const tipWrite = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  return { shown: tip && !tip.hidden, body: body && body.textContent };
});
check('Notes coach tip appears on first Notes visit', tipWrite.shown, tipWrite.body);

guard = 0;
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 8) break;
  const body = await page.textContent('#coach-body');
  if (/mirror for the note|Switch between Insights|Scores and filters/.test(body || '')) break;
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}

const writeDone = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return !!(raw.prefs && raw.prefs.tours && raw.prefs.tours.write);
});
if (!writeDone && await page.isVisible('#coach-tip')) {
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}
check('Notes tour finishes', writeDone || !(await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return !(raw.prefs && raw.prefs.tours && raw.prefs.tours.write);
})));

await page.waitForTimeout(400);
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 }).catch(() => null);
const tipInsights = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  const open = window.PalinodeOnboarding && PalinodeOnboarding.insightsOpen();
  return { shown: tip && !tip.hidden, body: body && body.textContent, open };
});
check('Insights coach starts when Reading is open after Notes',
  tipInsights.shown && tipInsights.open &&
    /mirror for the note|Switch between Insights|Scores and filters/.test(tipInsights.body || ''),
  tipInsights.body);

guard = 0;
while (await page.isVisible('#coach-tip')) {
  guard += 1;
  if (guard > 8) break;
  await page.click('#coach-next');
  await page.waitForTimeout(200);
}

const afterWrite = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('palinode.v1') || '{}');
  return (raw.prefs && raw.prefs.tours) || {};
});
check('Notes marked done in prefs', !!afterWrite.write, JSON.stringify(afterWrite));
check('Insights marked done in prefs', !!afterWrite.insights, JSON.stringify(afterWrite));

await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])', { timeout: 8000 });
await page.waitForTimeout(400);
await page.click('#btn-rail');
await page.waitForTimeout(400);
const noWriteRepeat = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  return !tip || tip.hidden;
});
check('Notes tip does not return on second visit', noWriteRepeat);

await page.click('#btn-help');
await page.waitForSelector('#coach-tip:not([hidden])', { timeout: 8000 }).catch(() => null);
const helpInsights = await page.evaluate(() => {
  const tip = document.getElementById('coach-tip');
  const body = document.getElementById('coach-body');
  return { shown: tip && !tip.hidden, body: body && body.textContent };
});
check('Help opens Insights coach when Reading is open', helpInsights.shown, helpInsights.body);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
