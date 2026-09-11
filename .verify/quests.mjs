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
  document.querySelectorAll('.gx-node.gx-quest.gx-mercurial').length >= 3, null, { timeout: 8000 });

const freeId = await page.evaluate(() => {
  const el = document.querySelector('.gx-node.gx-quest.gx-mercurial');
  return el ? el.dataset.id.replace(/^quest:/, '') : null;
});
check('Mercurial free quests appear under Epics & Quests', !!freeId, freeId);

const linked = await page.evaluate(() => {
  const all = window.PalinodeMarketData.allQuests();
  const withConcepts = all.filter(q => (q.conceptIds || []).length > 0).length;
  const free = all.filter(q => q.access === 'free');
  return {
    total: all.length,
    withConcepts,
    free: free.length,
    freeLinked: free.filter(q => (q.conceptIds || []).length > 0).length
  };
});
check('All quests carry conceptIds', linked.withConcepts === linked.total,
  JSON.stringify(linked));
check('Free concept/prompt/spectrum pack is seeded', linked.free >= 23,
  JSON.stringify(linked));

await page.evaluate(id => {
  if (window.PalinodeQuests) PalinodeQuests.openOverview(id);
}, freeId);
await page.waitForSelector('#quest-overview-scrim.on');
check('quest overview opens', await page.evaluate(
  () => document.getElementById('quest-overview-scrim').classList.contains('on')));

await page.click('[data-quest-accept]');
await page.waitForSelector('[data-quest-start]');
const choice = await page.evaluate(() => ({
  start: !!document.querySelector('[data-quest-start]'),
  keep: !!document.querySelector('[data-quest-keep-exploring]'),
  copy: (document.querySelector('#quest-overview-body .lede') || {}).textContent || ''
}));
check('Accept offers Start Quest or Keep exploring',
  choice.start && choice.keep && /accepted/i.test(choice.copy), JSON.stringify(choice));

await page.click('[data-quest-start]');
await page.waitForTimeout(300);
const afterStart = await page.evaluate(id => {
  const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  const wrap = document.getElementById('quests-wrap');
  const body = document.getElementById('body');
  return {
    status: st.entries?.[id]?.status,
    questsMode: body.classList.contains('quests-mode'),
    detail: !!(wrap && !wrap.hidden),
    activeItem: !!document.querySelector(`#quest-list .note-item.active[data-open-quest="${id}"]`),
    scrimOff: !document.getElementById('quest-overview-scrim').classList.contains('on')
  };
}, freeId);
check('Accept adds quest to active log', afterStart.status === 'active', afterStart.status);
check('Start Quest opens the Quests tray detail',
  afterStart.questsMode && afterStart.detail && afterStart.activeItem && afterStart.scrimOff,
  JSON.stringify(afterStart));

const logActive = await page.evaluate(id => {
  const item = document.querySelector(`#quest-list [data-open-quest="${id}"]`);
  const body = document.getElementById('body');
  const filters = document.getElementById('quest-log-filters');
  return !!(item && body && body.classList.contains('quests-mode')
    && filters && !filters.hidden
    && /Quests/.test((document.querySelector('.rail-lab-quests') || {}).textContent || ''));
}, freeId);
check('Quests page lists the active quest', logActive);

/* Keep-exploring path on a second free quest */
const freeId2 = await page.evaluate(id => {
  const q = window.PalinodeMarketData.freeQuests().find(x => x.id !== id);
  return q ? q.id : null;
}, freeId);
if (freeId2) {
  await page.evaluate(id => PalinodeQuests.openOverview(id), freeId2);
  await page.waitForSelector('#quest-overview-scrim.on');
  await page.click('[data-quest-accept]');
  await page.waitForSelector('[data-quest-keep-exploring]');
  await page.click('[data-quest-keep-exploring]');
  await page.waitForTimeout(200);
  const kept = await page.evaluate(id => {
    const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
    return {
      status: st.entries?.[id]?.status,
      scrimOff: !document.getElementById('quest-overview-scrim').classList.contains('on')
    };
  }, freeId2);
  check('Keep exploring leaves the quest in the log',
    kept.status === 'active' && kept.scrimOff, JSON.stringify(kept));
}

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

const playShape = await page.evaluate(id => {
  const q = window.PalinodeMarketData.hydrateQuest(window.PalinodeMarketData.questOf(id));
  const cards = [...document.querySelectorAll('.quest-node-card')];
  const locked = cards.filter(c => c.classList.contains('locked')).length;
  const current = cards.filter(c => c.classList.contains('current')).length;
  const write = document.querySelector('[data-quest-write-step]');
  const submit = document.querySelector('[data-quest-submit-step]');
  const openNode = document.querySelector('[data-quest-open-node]');
  const learn = document.querySelector('[data-quest-learn]');
  const constel = document.querySelector('.quest-constel');
  return {
    stepCount: (q.steps || []).length,
    uiSteps: cards.length,
    locked,
    current,
    writeLabel: write ? write.textContent.trim() : '',
    hasSubmit: !!submit,
    hasOpenNode: !!openNode,
    hasLearn: !!learn,
    hasConstel: !!constel,
    noBottomResponse: !document.querySelector('.quest-response-card'),
    conceptIds: (q.conceptIds || []).length
  };
}, freeId);
check('Hydrated quest exposes node steps', playShape.stepCount >= 1 && playShape.stepCount === playShape.conceptIds,
  JSON.stringify(playShape));
check('Quest detail is linear with Write/Submit Response',
  playShape.uiSteps >= 1 && playShape.current === 1
    && playShape.writeLabel === 'Write Response' && playShape.hasSubmit
    && playShape.hasOpenNode && playShape.hasLearn && playShape.hasConstel
    && playShape.noBottomResponse,
  JSON.stringify(playShape));

const promptQuality = await page.evaluate(() => {
  const samples = ['q-prompt-veil', 'q-free-eudaimonia', 'q-free-dichotomy']
    .map(id => window.PalinodeMarketData.hydrateQuest(window.PalinodeMarketData.questOf(id)))
    .filter(Boolean)
    .map(q => ({ id: q.id, prompt: q.prompt }));
  const bad = samples.filter(s => /on (the )?map|on Explore/i.test(s.prompt || ''));
  const veil = samples.find(s => s.id === 'q-prompt-veil');
  return {
    samples,
    noneAreMapTasks: bad.length === 0,
    veilIsWritePrompt: !!(veil && /\?/.test(veil.prompt) && !/on the map/i.test(veil.prompt))
  };
});
check('Quest prompts inspire writing, not map chores',
  promptQuality.noneAreMapTasks && promptQuality.veilIsWritePrompt,
  JSON.stringify(promptQuality));

/* Linear note submission unlocks next / completes */
const visitSubmit = await page.evaluate(id => {
  const q = window.PalinodeMarketData.hydrateQuest(window.PalinodeMarketData.questOf(id));
  const steps = q.steps || [];
  const results = [];
  steps.forEach((s, i) => {
    const note = window.PalinodeStore.Notes.create({
      title: 'Step ' + (i + 1) + ' response',
      body: 'Verify note for ' + s.id
    });
    const ok = PalinodeQuests.submitStepNote(id, s.id, note.id);
    const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
    results.push({
      ok,
      step: s.id,
      done: !!st.entries?.[id]?.stepDone?.[s.id],
      status: st.entries?.[id]?.status
    });
  });
  const after = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  return {
    results,
    allOk: results.every(r => r.ok && r.done),
    status: after.entries?.[id]?.status,
    progress: after.entries?.[id]?.progress
  };
}, freeId);
check('Submitting a note per step unlocks progression',
  visitSubmit.allOk, JSON.stringify(visitSubmit));
check('Submitting the final step note completes the quest',
  visitSubmit.status === 'completed' && visitSubmit.progress === 1,
  JSON.stringify(visitSubmit));

/* Multi-step lock check on a fresh quest */
const lockCheck = await page.evaluate(() => {
  const q = window.PalinodeMarketData.hydrateQuest(
    window.PalinodeMarketData.questOf('q-free-eudaimonia'));
  if (!q || (q.steps || []).length < 2) return { ok: false, reason: 'need multi-step quest' };
  PalinodeQuests.accept(q.id, 'explore');
  PalinodeQuests.open(q.id);
  const cards = [...document.querySelectorAll('.quest-node-card')];
  const locked = cards.filter(c => c.classList.contains('locked')).length;
  const lockCopy = (document.querySelector('.quest-node-lock-inner p') || {}).textContent || '';
  return {
    ok: locked === cards.length - 1 && /Complete/.test(lockCopy),
    locked,
    total: cards.length,
    lockCopy
  };
});
check('Later steps stay locked until prior is complete',
  lockCheck.ok, JSON.stringify(lockCheck));

/* In-editor Submit to quest */
const editorQuestId = await page.evaluate(() => {
  const free = (window.PalinodeMarketData.freeQuests() || []).find(q => {
    const e = PalinodeQuests.get(q.id);
    return !e || e.status === 'abandoned';
  });
  if (!free) return null;
  if (window.PalinodeGraph) {
    PalinodeGraph.close();
    document.body.classList.remove('exploring');
  }
  if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) PalinodeMarketplace.leave();
  PalinodeQuests.accept(free.id, 'explore');
  PalinodeQuests.open(free.id);
  return free.id;
});
check('Editor-submit quest opens', !!editorQuestId, String(editorQuestId));
await page.waitForSelector('[data-quest-write-step]', { timeout: 5000 });
await page.evaluate(() => {
  const btn = document.querySelector('[data-quest-write-step]');
  if (btn) btn.click();
});
await page.waitForSelector('#editor-wrap:not([hidden])');
await page.waitForTimeout(200);
const submitVisible = await page.evaluate(() => {
  const btn = document.getElementById('btn-quest-submit');
  const note = window.PalinodeStore.Notes.all()[0];
  return {
    shown: !!(btn && !btn.hidden && getComputedStyle(btn).display !== 'none'),
    linked: !!(note && note.questId && note.questStepId),
    noteId: note && note.id,
    questId: note && note.questId,
    stepId: note && note.questStepId
  };
});
check('Quest-linked notes show Submit to quest',
  submitVisible.shown && submitVisible.linked, JSON.stringify(submitVisible));
await page.fill('#body-input', 'Enough words for an in-editor quest submission check.');
await page.waitForTimeout(200);
await page.click('#btn-quest-submit');
await page.waitForTimeout(400);
const afterEditorSubmit = await page.evaluate(({ noteId, questId, stepId }) => {
  const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  const note = window.PalinodeStore.Notes.get(noteId);
  const btn = document.getElementById('btn-quest-submit');
  return {
    done: !!st.entries?.[questId]?.stepDone?.[stepId],
    noteCleared: !!(note && !note.questId && !note.questStepId),
    btnHidden: !btn || btn.hidden,
    questsMode: document.getElementById('body').classList.contains('quests-mode'),
    detail: !document.getElementById('quests-wrap').hidden
  };
}, submitVisible);
check('Submit to quest records the step from the editor',
  afterEditorSubmit.done && afterEditorSubmit.noteCleared && afterEditorSubmit.btnHidden,
  JSON.stringify(afterEditorSubmit));
check('Submit to quest returns to the quest detail',
  afterEditorSubmit.questsMode && afterEditorSubmit.detail,
  JSON.stringify(afterEditorSubmit));

/* Re-accept path: abandon another quest for legacy abandon check */
const abandonId = freeId2 || freeId;
await page.evaluate(id => {
  if (!PalinodeQuests.get(id) || PalinodeQuests.get(id).status === 'completed') {
    // ensure an active quest to abandon
    const q = window.PalinodeMarketData.freeQuests().find(x => {
      const e = PalinodeQuests.get(x.id);
      return !e || e.status === 'abandoned';
    });
    if (q) PalinodeQuests.accept(q.id, 'explore');
    return q ? q.id : id;
  }
  return id;
}, abandonId);
const abandonTarget = await page.evaluate(() => {
  const st = JSON.parse(localStorage.getItem('palinode.quests.v1') || '{}');
  const active = Object.keys(st.entries || {}).find(id => st.entries[id].status === 'active');
  if (active) {
    PalinodeQuests.abandon(active);
    PalinodeQuests.renderLog();
    return { id: active, status: JSON.parse(localStorage.getItem('palinode.quests.v1')).entries[active].status };
  }
  return { id: null, status: null };
});
check('Abandon moves quest to abandoned', abandonTarget.status === 'abandoned', JSON.stringify(abandonTarget));

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
