/* Save a curated trail as a pathway, walk it, and add a note. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const URL = 'http://localhost:8765/index.html';
const NOTE = `I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much, even though I feel completely alone in this city where no one understands what the work costs me. Everyone should be honest about what they want, but on balance the greater good was served and it was worth it for everyone involved.`;

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

await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#title', 'The job');
await page.fill('#body-input', NOTE);
await page.waitForTimeout(1400);
await page.click('#constellation');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(400);

const descend = async () => page.evaluate(() => {
  const m = window.PalinodeGraph.model;
  const seen = new Set(m.trail());
  const next = m.orbit(m.selected(), 12).find(n => !seen.has(n.id));
  if (next) m.select(next.id);
  return next ? next.id : null;
});

const a = await descend();
await descend();
await descend();
check('descended far enough to save', !!a);

await page.click('#gx-save-path');
await page.waitForSelector('#path-save-scrim.on');
check('Save as Pathway opens the name modal', await page.isVisible('#path-save-name'));
await page.fill('#path-save-name', 'A short walk');
await page.click('#path-save-confirm');
await page.waitForTimeout(200);
check('the pathway is stored', await page.evaluate(
  () => window.PalinodeStore.Pathways.all().some(p => p.title === 'A short walk')));

await page.click('#gx-close');
await page.waitForTimeout(200);
await page.click('#btn-pathways');
await page.waitForTimeout(250);
check('the library lists the saved walk', await page.evaluate(
  () => /A short walk/.test(document.getElementById('path-list').textContent)));
check('the tray card is the title, not a constellation', await page.evaluate(() => {
  const card = document.querySelector('#path-list .note-item[data-open]');
  return !!(card && card.querySelector('h4') && !card.querySelector('.path-constel'));
}));

await page.click('#path-list .note-item[data-open]');
await page.waitForSelector('#pathway-wrap:not([hidden])');
check('the walk constellation sits above the date', await page.evaluate(() => {
  const map = document.getElementById('walk-constel');
  const kicker = document.querySelector('#pathway-wrap .walk-kicker');
  const wrap = document.getElementById('pathway-wrap');
  if (!map || !kicker || !wrap) return false;
  if (map.querySelectorAll('.node').length < 2) return false;
  const mr = map.getBoundingClientRect();
  const kr = kicker.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  return mr.bottom <= kr.top + 1
    && Math.abs(mr.width - wr.width) <= 2;
}));
check('the pathway title wraps instead of scrolling', await page.evaluate(() => {
  const el = document.getElementById('walk-title');
  if (!el || el.tagName !== 'TEXTAREA') return false;
  const saved = el.value;
  el.value = 'On being told to slow down → Communitarianism as a long heading';
  el.dispatchEvent(new Event('input'));
  const wrapped = el.scrollWidth <= el.clientWidth + 2 && el.clientHeight > 40;
  el.value = saved;
  el.dispatchEvent(new Event('input'));
  return wrapped;
}));
check('the feed has a block per step', await page.evaluate(
  () => document.querySelectorAll('#walk-feed .feed-item').length >= 2));
const firstOn = await page.evaluate(() => {
  const on = document.querySelector('#walk-feed .feed-item.on');
  return on ? on.dataset.step : null;
});
check('the walk opens on the first step', firstOn === '0', 'step ' + firstOn);

const before = await page.evaluate(() => {
  const on = document.querySelector('#walk-feed .feed-item.on h3');
  return on ? on.textContent : '';
});
await page.click('#walk-feed .feed-item[data-step="1"]');
await page.waitForTimeout(150);
const after = await page.evaluate(() => {
  const on = document.querySelector('#walk-feed .feed-item.on h3');
  return on ? on.textContent : '';
});
check('tapping a later step focuses it', after !== before, before + ' → ' + after);

const lenBefore = await page.evaluate(() => window.PalinodeStore.Pathways.all()[0].steps.length);
await page.click('#walk-add-note');
await page.waitForTimeout(80);
const added = await page.evaluate(() => {
  const btn = document.querySelector('#walk-picker [data-add-note]');
  if (!btn) return false;
  btn.click();
  return true;
});
check('a journal note can be added as a step', added);
await page.waitForTimeout(150);
const lenAfter = await page.evaluate(() => window.PalinodeStore.Pathways.all()[0].steps.length);
check('adding a note lengthens the walk', lenAfter === lenBefore + 1, lenBefore + ' → ' + lenAfter);
check('the added note is on the shelf', await page.evaluate(
  () => !!document.querySelector('#walk-notes [data-view="note"]')));

await page.click('#walk-add-note');
await page.waitForTimeout(80);
check('Add note opens a panel', await page.evaluate(
  () => !document.getElementById('walk-note-panel').hidden));
await page.click('#walk-note-done');
check('Done collapses the note panel', await page.evaluate(
  () => document.getElementById('walk-note-panel').hidden));

await page.click('#walk-add-media');
check('Add media opens a panel', await page.evaluate(
  () => !document.getElementById('walk-media-panel').hidden));
await page.click('#walk-media-done');
check('Done collapses the media panel', await page.evaluate(
  () => document.getElementById('walk-media-panel').hidden));

await page.click('#walk-add-link');
check('Add link opens the form', await page.evaluate(
  () => !document.getElementById('walk-link-form').hidden));
await page.fill('#walk-link-url', 'https://example.com/grain');
await page.fill('#walk-link-title', 'The grain');
await page.click('#walk-link-form button[type="submit"]');
await page.waitForTimeout(150);
check('a link appears on the shelf', await page.evaluate(
  () => /The grain/.test(document.getElementById('walk-notes').textContent)));

await page.click('#walk-add-link');
check('Add link opens again', await page.evaluate(
  () => !document.getElementById('walk-link-form').hidden));
await page.click('#walk-link-cancel');
check('Cancel collapses the link form', await page.evaluate(
  () => document.getElementById('walk-link-form').hidden));

await page.click('#walk-notes [data-view="note"]');
check('a note chip opens a peek without leaving the walk', await page.evaluate(() => {
  const peek = document.getElementById('walk-peek');
  return !peek.hidden && /I had no choice/.test(peek.textContent)
    && !document.getElementById('pathway-wrap').hidden;
}));
await page.click('#walk-peek [data-peek-close]');
check('Close collapses the peek', await page.evaluate(
  () => document.getElementById('walk-peek').hidden));

await page.click('#walk-notes [data-view="link"]');
check('a link chip shows the url', await page.evaluate(() => {
  const peek = document.getElementById('walk-peek');
  return !peek.hidden && /example.com/.test(peek.textContent);
}));

check('the tray still lists the walk', await page.evaluate(
  () => /A short walk/.test(document.getElementById('path-list').textContent)));

check('a concept step offers Write on this', await page.evaluate(
  () => !!document.querySelector('#walk-feed [data-act="write"]')));

await page.evaluate(() => {
  const p = window.PalinodeStore.Pathways.all()[0];
  window.PalinodeStore.Pathways.addStep(p.id, {
    id: 's:individualism-collectivism',
    type: 'spectrum',
    ref: 'individualism-collectivism',
    label: 'Individualism vs Collectivism',
    category: 'stance'
  });
  window.PalinodePathways.refreshWalk();
});
await page.waitForTimeout(80);
check('a spectrum step offers Place yourself', await page.evaluate(
  () => /Place yourself/.test(
    (document.querySelector('#walk-feed [data-act="place"]') || {}).textContent || '')));
await page.click('#walk-feed [data-act="place"]');
await page.waitForTimeout(150);
check('Place yourself opens the placement overlay', await page.evaluate(
  () => document.getElementById('place-scrim').classList.contains('on')));
await page.click('#place-scrim [data-act="close"]');
await page.waitForTimeout(80);
check('closing Place stays on the pathway', await page.evaluate(
  () => !document.getElementById('pathway-wrap').hidden
    && document.getElementById('body').classList.contains('pathways-mode')));
await page.evaluate(() => {
  const item = document.querySelector('#walk-feed [data-act="place"]');
  if (item) item.closest('.feed-item').click();
});
await page.waitForTimeout(80);
check('the field follows the selected spectrum', await page.evaluate(
  () => document.getElementById('field').dataset.mood === 'stance'));

await page.click('#walk-constel');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(400);
check('clicking the constellation opens Explore', await page.evaluate(() => {
  const g = document.getElementById('graph');
  const title = document.getElementById('gx-title-text');
  return !g.hidden && title.textContent === 'A short walk';
}));
const graph = await page.evaluate(() => {
  const ids = [...window.PalinodeGraph.model.all().keys()];
  const trail = window.PalinodeGraph.model.trail();
  const extra = ids.filter(id => !trail.includes(id));
  return {
    title: document.getElementById('gx-title-text').textContent,
    connHidden: document.getElementById('gx-conn').hidden,
    connOn: document.getElementById('gx-conn-toggle').checked,
    extras: extra.length
  };
});
check('Open in Explore uses the pathway title', graph.title === 'A short walk', graph.title);
check('Show Connections starts hidden off', graph.connHidden === false && graph.connOn === false);
check('Show Connections sits left of 2D/3D', await page.evaluate(() => {
  const conn = document.getElementById('gx-conn');
  const dim = document.getElementById('gx-dim');
  if (!conn || conn.hidden || !dim) return false;
  const label = conn.textContent.replace(/\s+/g, ' ').trim();
  if (label !== 'Show Connections') return false;
  return conn.getBoundingClientRect().right <= dim.getBoundingClientRect().left + 1;
}));
check('the pathway graph shows only curated nodes', graph.extras === 0, graph.extras + ' extras');

const conceptId = await page.evaluate(() => {
  const all = window.PalinodeGraph.model.all();
  for (const [id, n] of all) if (n.type === 'concept') return id;
  return null;
});
check('the pathway graph has a concept to write on', !!conceptId);
if (conceptId) {
  await page.evaluate(id => window.PalinodeGraph.model.select(id), conceptId);
  await page.waitForSelector('#gx-panel [data-act="write"]');
  check('the concept panel still offers Write on this', await page.evaluate(
    () => !!document.querySelector('#gx-panel [data-act="write"]')));
  await page.click('#gx-panel [data-act="write"]');
  await page.waitForTimeout(250);
  check('Write from the pathway leaves for a new note', await page.evaluate(() => {
    const wrap = document.getElementById('editor-wrap');
    return wrap && !wrap.hidden
      && !document.getElementById('body').classList.contains('pathways-mode')
      && document.getElementById('graph').hidden;
  }));
}

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
