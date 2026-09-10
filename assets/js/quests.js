/* ============================================================
   Palinode — Unified quest log + accept overlay

   Rail lists quests (Active / Completed / Abandoned). Centre
   opens a node-driven practice workspace: visit steps, then
   submit a journal note.
   ============================================================ */

(function () {
  const KEY = 'palinode.quests.v1';
  const $ = (s, root) => (root || document).querySelector(s);

  function Data() { return window.PalinodeMarketData; }
  function Notes() { return window.PalinodeStore && PalinodeStore.Notes; }
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 2200);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function chrome() {
    if (typeof window.PalinodeQuests.onChrome === 'function')
      window.PalinodeQuests.onChrome();
  }

  function emptyState() {
    return { entries: {}, dismissed: {} };
  }

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!raw || typeof raw !== 'object') return emptyState();
      return {
        entries: raw.entries || {},
        dismissed: raw.dismissed || {}
      };
    } catch (e) {
      return emptyState();
    }
  }

  let state = load();
  let overviewId = null;
  let logFilter = 'active';
  let selectedId = null;
  let onLogChange = null;
  let active = false;
  let insightsWasClosed = false;

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
    if (typeof onLogChange === 'function') onLogChange();
  }

  function questOf(id) {
    const D = Data();
    if (!D) return null;
    return D.hydrateQuest(D.questOf(id));
  }

  function conceptOf(id) {
    const list = window.PalinodeCorpus && PalinodeCorpus.CONCEPTS;
    if (!list || !id) return null;
    return list.find(c => c.id === id) || null;
  }

  function blankSubmission() {
    return { mode: 'note', body: '', noteId: null, noteTitle: '', status: 'draft' };
  }

  function normalizeEntry(entry) {
    if (!entry) return null;
    if (!entry.visited || typeof entry.visited !== 'object') entry.visited = {};
    if (!entry.stepDone || typeof entry.stepDone !== 'object') entry.stepDone = {};
    if (!entry.submission || typeof entry.submission !== 'object') {
      entry.submission = blankSubmission();
    } else {
      entry.submission = Object.assign(blankSubmission(), entry.submission);
    }
    return entry;
  }

  function isEnrolled(epicId) {
    return !!(window.PalinodeMarketplace && PalinodeMarketplace.isEnrolled
      && epicId && PalinodeMarketplace.isEnrolled(epicId));
  }

  function canAccept(questOrId) {
    const q = typeof questOrId === 'string' ? questOf(questOrId) : questOrId;
    if (!q) return false;
    const entry = state.entries[q.id];
    if (entry && entry.status === 'active') return false;
    if (entry && entry.status === 'completed') return false;
    if (q.access === 'epic_required') return isEnrolled(q.epicId);
    return true;
  }

  function get(questId) {
    return normalizeEntry(state.entries[questId] || null);
  }

  function isActive(questId) {
    const e = get(questId);
    return !!(e && e.status === 'active');
  }

  function isCompleted(questId) {
    const e = get(questId);
    return !!(e && e.status === 'completed');
  }

  function stepsOf(q) {
    return (q && q.steps) || [];
  }

  function stepIsDone(entry, stepId) {
    return !!(entry && entry.stepDone && entry.stepDone[stepId] && entry.stepDone[stepId].noteId);
  }

  function activeStepIndex(q, entry) {
    const steps = stepsOf(q);
    if (!steps.length) return 0;
    const idx = steps.findIndex(s => !stepIsDone(entry, s.id));
    return idx < 0 ? steps.length : idx;
  }

  function allStepsDone(q, entry) {
    const steps = stepsOf(q);
    if (!steps.length) return true;
    return steps.every(s => stepIsDone(entry, s.id));
  }

  function recomputeProgress(questId) {
    const q = questOf(questId);
    const entry = state.entries[questId];
    if (!q || !entry) return;
    normalizeEntry(entry);
    if (entry.status === 'completed') {
      entry.progress = 1;
      return;
    }
    const steps = stepsOf(q);
    if (!steps.length) {
      entry.progress = 0;
      return;
    }
    const n = steps.filter(s => stepIsDone(entry, s.id)).length;
    entry.progress = n / steps.length;
  }

  function list(opts) {
    const status = opts && opts.status;
    const D = Data();
    if (!D) return [];
    return Object.keys(state.entries)
      .map(id => {
        const entry = normalizeEntry(state.entries[id]);
        const quest = D.hydrateQuest(D.questOf(id));
        if (!entry || !quest) return null;
        if (status && entry.status !== status) return null;
        return Object.assign({}, quest, { log: entry });
      })
      .filter(Boolean)
      .sort((a, b) => (b.log.updatedAt || 0) - (a.log.updatedAt || 0));
  }

  function discover(questId) {
    const q = questOf(questId);
    if (!q) return null;
    delete state.dismissed[questId];
    save();
    return q;
  }

  function accept(questId, source) {
    const q = questOf(questId);
    if (!q) return false;
    const entry = get(questId);
    if (entry && entry.status === 'active') return false;
    if (entry && entry.status === 'completed') return false;
    if (q.access === 'epic_required' && !isEnrolled(q.epicId)) return false;
    const now = Date.now();
    state.entries[questId] = {
      status: 'active',
      acceptedAt: now,
      updatedAt: now,
      progress: 0,
      source: source || 'explore',
      visited: {},
      stepDone: {},
      submission: blankSubmission()
    };
    delete state.dismissed[questId];
    save();
    return true;
  }

  function showAcceptedChoice(questId) {
    const q = questOf(questId);
    const host = $('#quest-overview-body');
    const scrim = $('#quest-overview-scrim');
    if (!q || !host || !scrim) return;
    overviewId = questId;
    const steps = stepsOf(q);
    const first = steps[0] && conceptOf(steps[0].conceptId);
    const next = first
      ? ('Respond · ' + first.label)
      : ((q.objectives && q.objectives[0]) || 'Begin the first step.');
    host.innerHTML = `
      <div class="quest-ov-kicker">
        <span class="mkt-badge">${esc(typeLabel(q.type))}</span>
        <span class="quest-ov-access">Added to your log</span>
      </div>
      <h3 id="quest-overview-title">${esc(q.title)}</h3>
      <p class="lede">Quest accepted. Keep exploring the map, or start now in your Quests tray.</p>
      <p class="gx-fine">Next · ${esc(next)}</p>
      <div class="gx-act quest-ov-act quest-accept-choice">
        <button type="button" class="ghost solid" data-quest-start="${esc(q.id)}">Start Quest</button>
        <button type="button" class="ghost" data-quest-keep-exploring>Keep exploring</button>
      </div>`;
    scrim.classList.add('on');
  }

  function keepExploring() {
    closeOverview();
    toast('Quest saved to your log.');
  }

  function startQuest(questId) {
    closeOverview();
    if (typeof window.PalinodeQuests.onStartQuest === 'function') {
      window.PalinodeQuests.onStartQuest(questId);
      return;
    }
    enter();
    open(questId);
  }

  function decline(questId) {
    state.dismissed[questId] = true;
    save();
  }

  function abandon(questId) {
    const entry = state.entries[questId];
    if (!entry || entry.status !== 'active') return false;
    entry.status = 'abandoned';
    entry.updatedAt = Date.now();
    save();
    toast('Quest abandoned.');
    if (selectedId === questId) {
      selectedId = null;
      showEmpty();
    }
    if (active) renderAll();
    return true;
  }

  function complete(questId) {
    const now = Date.now();
    const prev = normalizeEntry(state.entries[questId]) || {
      acceptedAt: now,
      source: 'explore',
      visited: {},
      stepDone: {},
      submission: blankSubmission()
    };
    state.entries[questId] = {
      status: 'completed',
      acceptedAt: prev.acceptedAt || now,
      updatedAt: now,
      progress: 1,
      source: prev.source || 'explore',
      visited: prev.visited || {},
      stepDone: prev.stepDone || {},
      submission: Object.assign(blankSubmission(), prev.submission, { status: 'submitted' })
    };
    save();
    if (active) renderAll();
    return true;
  }

  function activateForEpic(epicId) {
    const D = Data();
    if (!D) return;
    const epic = D.epicOf(epicId);
    if (!epic) return;
    (epic.questIds || []).forEach(qid => {
      const cur = state.entries[qid];
      if (cur && (cur.status === 'active' || cur.status === 'completed')) return;
      const now = Date.now();
      state.entries[qid] = {
        status: 'active',
        acceptedAt: now,
        updatedAt: now,
        progress: 0,
        source: 'epic',
        visited: {},
        stepDone: {},
        submission: blankSubmission()
      };
    });
    save();
    if (active) renderAll();
  }

  function activeQuestIds() {
    return Object.keys(state.entries).filter(id => {
      const e = state.entries[id];
      return e && e.status === 'active';
    });
  }

  function markVisited(conceptId, questId) {
    if (!conceptId) return false;
    const targets = questId ? [questId] : activeQuestIds();
    let changed = false;
    targets.forEach(qid => {
      const q = questOf(qid);
      const entry = state.entries[qid];
      if (!q || !entry || entry.status !== 'active') return;
      normalizeEntry(entry);
      const steps = stepsOf(q);
      if (!steps.some(s => s.conceptId === conceptId)) return;
      if (entry.visited[conceptId]) return;
      entry.visited[conceptId] = true;
      entry.updatedAt = Date.now();
      recomputeProgress(qid);
      changed = true;
    });
    if (changed) {
      save();
      if (active) renderAll();
    }
    return changed;
  }

  function selectNote(questId, noteId) {
    return submitStepNote(questId, null, noteId);
  }

  function submitStepNote(questId, stepId, noteId) {
    const q = questOf(questId);
    const entry = state.entries[questId];
    const note = Notes() && Notes().get(noteId);
    if (!q || !entry || entry.status !== 'active' || !note) return false;
    normalizeEntry(entry);
    const steps = stepsOf(q);
    const activeIdx = activeStepIndex(q, entry);
    const step = stepId
      ? steps.find(s => s.id === stepId)
      : steps[activeIdx];
    if (!step) return false;
    const stepIdx = steps.findIndex(s => s.id === step.id);
    if (stepIdx !== activeIdx) {
      toast('Finish the current step first.');
      return false;
    }
    entry.stepDone[step.id] = {
      noteId: note.id,
      noteTitle: note.title || 'Untitled',
      at: Date.now()
    };
    entry.submission = {
      mode: 'note',
      body: '',
      noteId: note.id,
      noteTitle: note.title || 'Untitled',
      status: 'draft'
    };
    entry.visited[step.conceptId] = true;
    entry.updatedAt = Date.now();
    recomputeProgress(questId);
    syncEpicEnrollment(questId, entry);
    save();
    const next = steps[stepIdx + 1];
    if (allStepsDone(q, entry)) {
      entry.submission.status = 'submitted';
      syncEpicEnrollment(questId, entry, { submitted: true });
      complete(questId);
      toast('Quest complete.');
    } else {
      const nextLabel = next && conceptOf(next.conceptId);
      toast(nextLabel
        ? ('Step submitted. Unlocked “' + nextLabel.label + '”.')
        : 'Step submitted.');
      if (active) renderAll();
    }
    return true;
  }

  function openStepSubmitPicker(questId, stepId) {
    const q = questOf(questId);
    const entry = get(questId);
    if (!q || !entry || entry.status !== 'active') return;
    const steps = stepsOf(q);
    const idx = steps.findIndex(s => s.id === stepId);
    if (idx < 0 || idx !== activeStepIndex(q, entry)) {
      toast('This step is locked.');
      return;
    }
    const scrim = $('#quest-step-note-scrim');
    const list = $('#quest-step-note-list');
    const title = $('#quest-step-note-title');
    if (!scrim || !list) return;
    const step = steps[idx];
    const c = conceptOf(step.conceptId);
    if (title) title.textContent = 'Submit response · ' + (c ? c.label : step.conceptId);
    const notes = Notes() ? Notes().all() : [];
    if (!notes.length) {
      list.innerHTML = '<p class="path-empty">No notes yet. Write a response first.</p>';
    } else {
      list.innerHTML = notes.map(n => `
        <button type="button" class="path-pick-item" data-quest-pick-note="${esc(n.id)}"
          data-quest-pick-step="${esc(stepId)}" data-quest-pick-quest="${esc(questId)}">
          <strong>${esc(n.title || 'Untitled')}</strong>
          <span>${esc(excerpt(n.body, 90) || 'Empty note')}</span>
        </button>`).join('');
    }
    scrim.classList.add('on');
  }

  function closeStepSubmitPicker() {
    const scrim = $('#quest-step-note-scrim');
    if (scrim) scrim.classList.remove('on');
  }

  function clearSelectedNote(questId) {
    const entry = state.entries[questId];
    if (!entry || entry.status !== 'active') return false;
    normalizeEntry(entry);
    entry.submission = blankSubmission();
    entry.updatedAt = Date.now();
    save();
    syncEpicEnrollment(questId, entry);
    if (active && selectedId === questId) renderDetail();
    return true;
  }

  function submitNote(questId) {
    const entry = get(questId);
    const q = questOf(questId);
    if (!q || !entry) return false;
    const steps = stepsOf(q);
    const idx = activeStepIndex(q, entry);
    const step = steps[idx];
    if (!step) return false;
    if (!entry.submission || !entry.submission.noteId) {
      openStepSubmitPicker(questId, step.id);
      return false;
    }
    return submitStepNote(questId, step.id, entry.submission.noteId);
  }

  function syncEpicEnrollment(questId, entry, opts) {
    const q = questOf(questId);
    if (!q || !q.epicId || !window.PalinodeMarketplace) return;
    if (typeof PalinodeMarketplace.syncQuestSubmission !== 'function') return;
    PalinodeMarketplace.syncQuestSubmission(q.epicId, questId, {
      noteId: entry.submission.noteId,
      noteTitle: entry.submission.noteTitle,
      body: entry.submission.body || '',
      mode: 'note',
      submitted: !!(opts && opts.submitted)
    });
  }

  function applyEpicSubmission(questId, payload) {
    const entry = state.entries[questId];
    if (!entry) return;
    normalizeEntry(entry);
    if (payload.noteId) {
      const q = questOf(questId);
      const steps = stepsOf(q);
      const idx = activeStepIndex(q, entry);
      const step = steps[idx];
      if (step) {
        submitStepNote(questId, step.id, payload.noteId);
        return;
      }
    }
    entry.updatedAt = Date.now();
    save();
    if (active) renderAll();
  }

  function typeLabel(type) {
    if (type === 'elenchos') return 'Quest';
    if (type === 'special') return 'Special';
    if (type === 'timed') return 'Timed';
    return 'Course';
  }

  function excerpt(text, n) {
    const t = String(text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= n) return t;
    return t.slice(0, n - 1).trim() + '…';
  }

  function closeOverview() {
    overviewId = null;
    const scrim = $('#quest-overview-scrim');
    if (scrim) scrim.classList.remove('on');
  }

  function openOverview(questId) {
    const q = discover(questId) || questOf(questId);
    const host = $('#quest-overview-body');
    const scrim = $('#quest-overview-scrim');
    if (!q || !host || !scrim) return;
    overviewId = questId;
    const entry = get(questId);
    const enrolled = q.epicId && isEnrolled(q.epicId);
    const acceptOk = canAccept(q) || (entry && entry.status === 'abandoned');
    const epic = q.epicId && Data() ? Data().hydrateEpic(Data().epicOf(q.epicId)) : null;
    const reward = q.rewards || {};
    const steps = stepsOf(q);
    const stepLis = steps.map(s => {
      const c = conceptOf(s.conceptId);
      return `<li>${esc(c ? c.label : s.conceptId)}</li>`;
    }).join('');

    let primary = '';
    if (entry && entry.status === 'active') {
      if (enrolled && q.epicId) {
        primary = `<button type="button" class="ghost solid" data-quest-continue="${esc(q.id)}">Continue in epic</button>`;
      } else {
        primary = `<button type="button" class="ghost solid" data-quest-start="${esc(q.id)}">Start Quest</button>`;
      }
    } else if (entry && entry.status === 'completed') {
      primary = `<button type="button" class="ghost solid" data-quest-close>Completed</button>`;
    } else if (q.access === 'epic_required' && !enrolled) {
      primary = `<button type="button" class="ghost solid" data-quest-view-epic="${esc(q.epicId)}">View epic to unlock</button>`;
    } else if (acceptOk) {
      primary = `<button type="button" class="ghost solid" data-quest-accept="${esc(q.id)}">Accept</button>`;
    }

    host.innerHTML = `
      <div class="quest-ov-kicker">
        <span class="mkt-badge">${esc(typeLabel(q.type))}</span>
        <span class="quest-ov-access">${q.access === 'free' ? 'Free on the map' : 'Requires epic enrollment'}</span>
      </div>
      <h3 id="quest-overview-title">${esc(q.title)}</h3>
      <p class="lede">${esc(q.description)}</p>
      ${epic ? `<p class="mkt-ov-mentor">In epic · ${esc(epic.title)}</p>` : ''}
      <h4 class="mkt-ov-h">Nodes to visit</h4>
      <ul class="quest-objectives">${stepLis || '<li>Complete the quest prompt in your journal.</li>'}</ul>
      <h4 class="mkt-ov-h">Special details</h4>
      <p class="gx-fine">Reward · ${reward.exp || 0} EXP${reward.unlockLabel ? ' · ' + esc(reward.unlockLabel) : ''} · Respond to the quest prompt</p>
      <div class="gx-act quest-ov-act">
        ${primary}
        <button type="button" class="ghost" data-quest-decline>Decline</button>
      </div>`;
    scrim.classList.add('on');
  }

  function paintFilters() {
    const host = $('#quest-log-filters');
    if (!host) return;
    host.querySelectorAll('[data-quest-log-filter]').forEach(btn => {
      btn.classList.toggle('on', btn.dataset.questLogFilter === logFilter);
    });
  }

  function nextStepLabel(q, entry) {
    const steps = stepsOf(q);
    const idx = activeStepIndex(q, entry);
    if (entry && entry.status === 'completed') return 'Completed';
    if (idx >= steps.length) return 'Ready to finish';
    const step = steps[idx];
    const c = conceptOf(step.conceptId);
    return c ? ('Respond · ' + c.label) : 'Respond to current step';
  }

  function renderList() {
    const listEl = $('#quest-list');
    if (!listEl) return;
    const rows = list({ status: logFilter });
    if (!rows.length) {
      listEl.innerHTML = `<p class="path-empty">No ${esc(logFilter)} quests yet.</p>`;
      return;
    }
    listEl.innerHTML = rows.map(q => {
      const pct = Math.round((q.log.progress || 0) * 100);
      const next = nextStepLabel(q, q.log);
      return `<div class="note-item${q.id === selectedId ? ' active' : ''}" data-open-quest="${esc(q.id)}">
        <h4>${esc(q.title)}</h4>
        <p>${esc(typeLabel(q.type))} · ${pct}% · ${esc(next)}</p>
      </div>`;
    }).join('');
  }

  function openConcept(conceptId) {
    closeOverview();
    if (active) leave();
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) PalinodeMarketplace.leave();
    const openExplore = window.PalinodeApp && PalinodeApp.openCorpus;
    const go = () => {
      if (window.PalinodeGraph && typeof PalinodeGraph.focusConcept === 'function') {
        PalinodeGraph.focusConcept(conceptId);
      } else if (window.PalinodeGraph) {
        const el = document.querySelector(`.gx-node[data-id="c:${conceptId}"]`);
        if (el) el.click();
      }
    };
    if (typeof openExplore === 'function') {
      Promise.resolve(openExplore()).then(() => setTimeout(go, 400));
    } else {
      const explore = document.getElementById('btn-explore');
      if (explore) explore.click();
      setTimeout(go, 500);
    }
  }

  function conceptCat(c) {
    return (c && c.category) || 'clarity';
  }

  function previewQuestConstellation(q) {
    const steps = stepsOf(q).slice(0, 8);
    const concepts = steps.map(s => conceptOf(s.conceptId)).filter(Boolean);
    const a = conceptCat(concepts[0]);
    const b = conceptCat(concepts[concepts.length - 1] || concepts[0]);
    const cls = 'constellation path-constel quest-constel';
    if (!concepts.length) {
      return `<div class="${cls}" style="--g1:var(--clarity);--g2:var(--resonance)" aria-hidden="true">
        <div class="path-constel-empty">No nodes yet</div></div>`;
    }
    const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
    const xLo = 10, xHi = 90, yLo = 14, yHi = 86;
    const pts = concepts.map((c, i) => {
      const ang = -Math.PI / 2 + (i / Math.max(concepts.length, 1)) * Math.PI * 2;
      const r = concepts.length === 1 ? 0 : (0.28 + 0.12 * (i % 2));
      return {
        id: c.id,
        x: cl(50 + Math.cos(ang) * r * 92, xLo, xHi),
        y: cl(50 + Math.sin(ang) * r * 78, yLo, yHi),
        cat: conceptCat(c),
        label: c.label.length > 22 ? c.label.slice(0, 21) + '…' : c.label
      };
    });
    for (let pass = 0; pass < 3; pass++) {
      pts.forEach((pt, i) => {
        pts.slice(0, i).forEach(other => {
          const dx = pt.x - other.x, dy = pt.y - other.y;
          if (Math.abs(dx) < 18 && Math.abs(dy) < 12) {
            pt.y = cl(pt.y + (dy >= 0 ? 12 : -12), yLo, yHi);
          }
        });
      });
    }
    const nodes = pts.map((pt, i) =>
      `<div class="node" style="left:${pt.x}%;top:${pt.y}%;animation-delay:${i * 55}ms">
        <span class="orb sm" style="--c:var(--${esc(pt.cat)})"></span>${esc(pt.label)}</div>`
    ).join('');
    return `<div class="${cls}" style="--g1:var(--${esc(a)});--g2:var(--${esc(b)})"
      role="button" tabindex="0" data-quest-open-constel="${esc(q.id)}"
      aria-label="Open quest constellation on Explore">
      <svg></svg>${nodes}</div>`;
  }

  function writeFromStep(questId, step) {
    const c = conceptOf(step.conceptId);
    const prompt = step.prompt || (c && c.turn) || '';
    if (typeof window.PalinodeQuests.onWriteFromQuest === 'function') {
      window.PalinodeQuests.onWriteFromQuest({
        questId,
        conceptId: step.conceptId,
        label: c ? c.label : step.conceptId,
        prompt,
        title: prompt
      });
      return;
    }
    const N = Notes();
    if (!N) return;
    N.create({ promptText: prompt, title: prompt || '' });
    toast('Note created — open Write to continue.');
  }

  function traditionLabel(c) {
    const map = window.PalinodeCorpus && PalinodeCorpus.TRADITIONS;
    if (!c || !c.tradition) return '';
    if (map && map[c.tradition]) return map[c.tradition];
    return c.tradition;
  }

  function closeLearnSheet() {
    const sheet = $('#quest-learn-sheet');
    if (sheet) sheet.hidden = true;
  }

  function openLearnSheet(conceptId) {
    const c = conceptOf(conceptId);
    const sheet = $('#quest-learn-sheet');
    const body = $('#quest-learn-body');
    const title = $('#quest-learn-title');
    if (!c || !sheet || !body) return;
    markVisited(conceptId);
    const cat = conceptCat(c);
    const trad = traditionLabel(c);
    const sources = (c.sources || []).map(s =>
      `<li><strong>${esc(s.work || '')}</strong>${s.author ? ' · ' + esc(s.author) : ''}${s.note ? `<span>${esc(s.note)}</span>` : ''}</li>`
    ).join('');
    const kin = (c.kin || []).map(id => {
      const k = conceptOf(id);
      if (!k) return '';
      return `<button type="button" class="quest-learn-kin" data-quest-learn="${esc(k.id)}">
        <span class="orb sm" style="--c:var(--${esc(conceptCat(k))})"></span>${esc(k.label)}</button>`;
    }).filter(Boolean).join('');

    if (title) title.textContent = c.label;
    body.innerHTML = `
      <div class="quest-learn-kicker">
        <span class="orb sm" style="--c:var(--${esc(cat)})"></span>
        <span>${esc(trad || cat)}</span>
      </div>
      <h3 class="quest-learn-h">${esc(c.label)}</h3>
      <p class="quest-learn-reading">${esc(c.reading || 'No reading yet for this concept.')}</p>
      ${c.turn ? `<p class="quest-step-prompt"><span>Ask yourself</span> ${esc(c.turn)}</p>` : ''}
      ${sources ? `<h4 class="mkt-ov-h">Sources</h4><ul class="quest-learn-sources">${sources}</ul>` : ''}
      ${kin ? `<h4 class="mkt-ov-h">Related</h4><div class="quest-learn-kin-row">${kin}</div>` : ''}
      <div class="quest-detail-actions quest-learn-actions">
        <button type="button" class="ghost solid" data-quest-open-node="${esc(c.id)}">Open in Explore</button>
        <button type="button" class="ghost" data-quest-write-concept="${esc(c.id)}">Write Response</button>
      </div>`;
    sheet.hidden = false;
  }

  function renderDetail() {
    const host = $('#quests-detail');
    if (!host || !selectedId) return;
    const entry = get(selectedId);
    const q = questOf(selectedId);
    if (!entry || !q) {
      selectedId = null;
      showEmpty();
      return;
    }
    const epic = q.epicId && Data() ? Data().hydrateEpic(Data().epicOf(q.epicId)) : null;
    const reward = q.rewards || {};
    const steps = stepsOf(q);
    const pct = Math.round((entry.progress || 0) * 100);
    const enrolled = q.epicId && isEnrolled(q.epicId);
    const questClosed = entry.status !== 'active';
    const activeIdx = activeStepIndex(q, entry);

    const feed = steps.map((s, i) => {
      const c = conceptOf(s.conceptId);
      const done = stepIsDone(entry, s.id);
      const unlocked = questClosed || done || i <= activeIdx;
      const isCurrent = !questClosed && i === activeIdx && !done;
      const prev = i > 0 ? steps[i - 1] : null;
      const prevLabel = prev && (conceptOf(prev.conceptId) || {}).label || 'previous step';
      const prompt = s.prompt || (c && c.turn) || '';
      const reading = (c && c.reading)
        || 'Open this node on Explore to read its content.';
      const doneMeta = done ? entry.stepDone[s.id] : null;
      let actions = '';
      if (unlocked && done) {
        actions = `<p class="gx-fine">Submitted · ${esc(doneMeta.noteTitle || 'Untitled')}</p>
           <div class="quest-detail-actions quest-step-actions">
             <button type="button" class="ghost solid" data-quest-learn="${esc(s.conceptId)}">Learn more</button>
             <button type="button" class="ghost" data-quest-open-node="${esc(s.conceptId)}">Open in Explore</button>
           </div>`;
      } else if (unlocked) {
        actions = `<div class="quest-detail-actions quest-step-actions">
             <button type="button" class="ghost solid" data-quest-learn="${esc(s.conceptId)}">Learn more</button>
             <button type="button" class="ghost" data-quest-open-node="${esc(s.conceptId)}">Open in Explore</button>
             <button type="button" class="ghost" data-quest-write-step="${esc(s.id)}">Write Response</button>
             <button type="button" class="ghost solid" data-quest-submit-step="${esc(s.id)}">Submit Response</button>
           </div>`;
      }
      return `<article class="quest-node-card${done ? ' visited done' : ''}${isCurrent ? ' current' : ''}${unlocked ? '' : ' locked'}"
        data-quest-node="${esc(s.conceptId)}" data-quest-step-id="${esc(s.id)}"
        style="--quest-node-c:var(--${esc(conceptCat(c))})">
        <div class="quest-node-card-head">
          <span class="orb sm quest-node-orb" style="--c:var(--${esc(conceptCat(c))})" aria-hidden="true"></span>
          <h4 class="mkt-ov-h">${esc(c ? c.label : s.conceptId)}</h4>
          ${done ? '<span class="quest-node-visited">Submitted</span>'
            : (isCurrent ? '<span class="quest-node-visited">Current</span>' : '')}
        </div>
        <p class="quest-step-reading">${esc(reading)}</p>
        ${prompt ? `<p class="quest-step-prompt"><span>Write from</span> ${esc(prompt)}</p>` : ''}
        ${actions}
        ${unlocked ? '' : `<div class="quest-node-lock" aria-hidden="true">
          <div class="quest-node-lock-inner">
            <svg class="quest-lock-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/>
              <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
            <p>Complete “${esc(prevLabel)}” to unlock</p>
          </div>
        </div>`}
      </article>`;
    }).join('');

    host.innerHTML = `
      <div class="quest-detail-meta">
        <span class="mkt-badge">${esc(typeLabel(q.type))}</span>
        <span class="mkt-price">${esc(entry.status)}</span>
        ${q.access === 'free' ? '<span class="quest-ov-access">Free on the map</span>' : ''}
      </div>
      <h2 class="mkt-title">${esc(q.title)}</h2>
      <p class="mkt-lede">${esc(q.description)}</p>
      ${epic ? `<p class="mkt-ov-mentor">In epic · ${esc(epic.title)}</p>` : ''}
      <p class="mkt-progress-lab">${pct}% complete · finish each step in order with a note</p>

      <div class="quest-constel-block">
        <h4 class="mkt-ov-h">Constellation</h4>
        ${previewQuestConstellation(q)}
      </div>

      <h4 class="mkt-ov-h">Nodes</h4>
      <div class="quest-node-feed">${feed || '<p class="gx-fine">No linked nodes for this quest.</p>'}</div>

      <h4 class="mkt-ov-h">Reward</h4>
      <p class="gx-fine">${reward.exp || 0} EXP${reward.unlockLabel ? ' · ' + esc(reward.unlockLabel) : ''}</p>
      <div class="quest-detail-actions">
        <button type="button" class="ghost solid" data-quest-show-map="${esc(q.id)}">Show quest on map</button>
        ${entry.status === 'active' && enrolled && q.epicId
          ? `<button type="button" class="ghost solid" data-quest-continue="${esc(q.id)}">Continue in epic</button>` : ''}
        ${entry.status === 'active'
          ? `<button type="button" class="ghost" data-quest-abandon="${esc(q.id)}">Abandon</button>` : ''}
      </div>`;
  }

  function showEmpty() {
    const wrap = $('#quests-wrap');
    const empty = $('#quest-empty');
    if (wrap) wrap.hidden = true;
    if (empty) {
      empty.hidden = false;
      const copy = $('#quest-empty-copy');
      if (copy) {
        const rows = list({ status: logFilter });
        copy.textContent = rows.length
          ? 'Pick a quest from the tray.'
          : `No ${logFilter} quests yet. Discover free quests on Explore, or enroll in an epic.`;
      }
    }
    chrome();
  }

  function showDetail() {
    const wrap = $('#quests-wrap');
    const empty = $('#quest-empty');
    if (wrap) wrap.hidden = false;
    if (empty) empty.hidden = true;
    renderDetail();
    chrome();
  }

  function renderAll() {
    paintFilters();
    renderList();
    if (selectedId && get(selectedId)) showDetail();
    else {
      selectedId = null;
      showEmpty();
    }
  }

  function showList() {
    selectedId = null;
    if (!active) enter();
    else {
      paintFilters();
      renderList();
      showEmpty();
    }
    chrome();
  }

  function open(questId) {
    const entry = get(questId);
    if (!entry) return;
    if (entry.status) logFilter = entry.status;
    selectedId = questId;
    if (!active) enter();
    else {
      paintFilters();
      renderList();
      showDetail();
    }
    const body = document.getElementById('body');
    if (body && body.classList.contains('show-rail')
      && window.matchMedia('(max-width: 900px)').matches) {
      body.classList.remove('show-rail');
    }
    chrome();
  }

  function showOnMap(questId) {
    closeOverview();
    if (active) leave();
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) PalinodeMarketplace.leave();
    const openExplore = window.PalinodeApp && PalinodeApp.openCorpus;
    const go = () => {
      if (window.PalinodeGraph && typeof PalinodeGraph.focusQuest === 'function') {
        PalinodeGraph.focusQuest(questId);
      } else if (window.PalinodeGraph && PalinodeGraph.open) {
        const btn = document.getElementById('gx-eq-filter');
        if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click();
        setTimeout(() => {
          const el = document.querySelector(`.gx-node[data-id="quest:${questId}"]`);
          if (el) el.click();
        }, 600);
      }
    };
    if (typeof openExplore === 'function') {
      Promise.resolve(openExplore()).then(() => setTimeout(go, 400));
    } else {
      const explore = document.getElementById('btn-explore');
      if (explore) explore.click();
      setTimeout(go, 500);
    }
  }

  function hideWriteCentre() {
    const ed = $('#editor-wrap');
    const empty = $('#empty-state');
    const read = $('#reading-room');
    const path = $('#pathway-wrap');
    const pe = $('#path-empty');
    const profile = $('#profile-view');
    const market = $('#market-wrap');
    if (ed) ed.hidden = true;
    if (empty) { empty.hidden = true; empty.style.display = 'none'; }
    if (read) read.hidden = true;
    if (path) path.hidden = true;
    if (pe) pe.hidden = true;
    if (profile) profile.hidden = true;
    if (market) market.hidden = true;
  }

  function enter() {
    active = true;
    hideWriteCentre();
    const listEl = $('#quest-list');
    const filters = $('#quest-log-filters');
    if (listEl) listEl.hidden = false;
    if (filters) filters.hidden = false;
    const body = document.getElementById('body');
    if (body && !body.classList.contains('quests-mode'))
      insightsWasClosed = body.classList.contains('insights-closed');
    if (body) {
      body.classList.add('quests-mode', 'insights-closed');
      body.classList.remove('pathways-mode', 'market-mode', 'show-insights');
    }
    if (selectedId && get(selectedId)) {
      paintFilters();
      renderList();
      showDetail();
    } else {
      selectedId = null;
      paintFilters();
      renderList();
      showEmpty();
    }
    chrome();
  }

  function leave() {
    active = false;
    selectedId = null;
    closeLearnSheet();
    closeStepSubmitPicker();
    const wrap = $('#quests-wrap');
    const empty = $('#quest-empty');
    const listEl = $('#quest-list');
    const filters = $('#quest-log-filters');
    if (wrap) wrap.hidden = true;
    if (empty) empty.hidden = true;
    if (listEl) listEl.hidden = true;
    if (filters) filters.hidden = true;
    const body = document.getElementById('body');
    if (body) {
      body.classList.remove('quests-mode');
      if (!insightsWasClosed) body.classList.remove('insights-closed');
    }
    closeOverview();
    chrome();
  }

  function isOpen() { return active; }
  function isDetailOpen() {
    const wrap = $('#quests-wrap');
    return !!(active && wrap && !wrap.hidden && selectedId);
  }
  function selected() { return selectedId; }

  function bind() {
    const scrim = $('#quest-overview-scrim');
    if (scrim) {
      scrim.addEventListener('click', e => {
        if (e.target === scrim) closeOverview();
        const acceptBtn = e.target.closest('[data-quest-accept]');
        if (acceptBtn) {
          const id = acceptBtn.dataset.questAccept;
          if (accept(id, 'explore')) showAcceptedChoice(id);
          return;
        }
        const startBtn = e.target.closest('[data-quest-start]');
        if (startBtn) {
          startQuest(startBtn.dataset.questStart);
          return;
        }
        if (e.target.closest('[data-quest-keep-exploring]')) {
          keepExploring();
          return;
        }
        if (e.target.closest('[data-quest-decline]') || e.target.closest('[data-quest-close]')) {
          if (e.target.closest('[data-quest-decline]') && overviewId) decline(overviewId);
          closeOverview();
          return;
        }
        const ve = e.target.closest('[data-quest-view-epic]');
        if (ve && window.PalinodeMarketplace) {
          closeOverview();
          PalinodeMarketplace.enter({ epicId: ve.dataset.questViewEpic });
          return;
        }
        const cont = e.target.closest('[data-quest-continue]');
        if (cont && window.PalinodeMarketplace) {
          const q = questOf(cont.dataset.questContinue);
          closeOverview();
          if (q && q.epicId) PalinodeMarketplace.enter({ questId: q.id });
        }
      });
    }

    document.addEventListener('click', e => {
      const filt = e.target.closest('[data-quest-log-filter]');
      if (filt) {
        logFilter = filt.dataset.questLogFilter;
        if (selectedId) {
          const cur = get(selectedId);
          if (!cur || cur.status !== logFilter) selectedId = null;
        }
        renderAll();
        return;
      }
      const item = e.target.closest('[data-open-quest]');
      if (item) {
        open(item.dataset.openQuest);
        return;
      }
      const constel = e.target.closest('[data-quest-open-constel]');
      if (constel) {
        showOnMap(constel.dataset.questOpenConstel);
        return;
      }
      const learn = e.target.closest('[data-quest-learn]');
      if (learn) {
        openLearnSheet(learn.dataset.questLearn);
        return;
      }
      const openNode = e.target.closest('[data-quest-open-node]');
      if (openNode) {
        closeLearnSheet();
        openConcept(openNode.dataset.questOpenNode);
        return;
      }
      const writeStep = e.target.closest('[data-quest-write-step]');
      if (writeStep && selectedId) {
        const q = questOf(selectedId);
        const step = stepsOf(q).find(s => s.id === writeStep.dataset.questWriteStep);
        if (step) {
          closeLearnSheet();
          writeFromStep(selectedId, step);
        }
        return;
      }
      const writeConcept = e.target.closest('[data-quest-write-concept]');
      if (writeConcept) {
        const c = conceptOf(writeConcept.dataset.questWriteConcept);
        const prompt = (c && c.turn) || '';
        closeLearnSheet();
        if (typeof window.PalinodeQuests.onWriteFromQuest === 'function') {
          window.PalinodeQuests.onWriteFromQuest({
            questId: selectedId,
            conceptId: writeConcept.dataset.questWriteConcept,
            label: c ? c.label : writeConcept.dataset.questWriteConcept,
            prompt,
            title: prompt
          });
        }
        return;
      }
      if (e.target.closest('#quest-learn-close')) {
        closeLearnSheet();
        return;
      }
      const submitStep = e.target.closest('[data-quest-submit-step]');
      if (submitStep && selectedId) {
        openStepSubmitPicker(selectedId, submitStep.dataset.questSubmitStep);
        return;
      }
      const pickNote = e.target.closest('[data-quest-pick-note]');
      if (pickNote) {
        submitStepNote(
          pickNote.dataset.questPickQuest,
          pickNote.dataset.questPickStep,
          pickNote.dataset.questPickNote
        );
        closeStepSubmitPicker();
        return;
      }
      if (e.target.closest('#quest-step-note-cancel') || e.target.id === 'quest-step-note-scrim') {
        if (e.target.id === 'quest-step-note-scrim' || e.target.closest('#quest-step-note-cancel')) {
          closeStepSubmitPicker();
        }
        return;
      }
      const map = e.target.closest('[data-quest-show-map]');
      if (map) { showOnMap(map.dataset.questShowMap); return; }
      const ab = e.target.closest('[data-quest-abandon]');
      if (ab) {
        if (window.confirm('Abandon this quest? You can rediscover it on the map later.')) {
          abandon(ab.dataset.questAbandon);
        }
        return;
      }
      const cont = e.target.closest('[data-quest-continue]');
      if (cont && !e.target.closest('#quest-overview-scrim') && window.PalinodeMarketplace) {
        const q = questOf(cont.dataset.questContinue);
        if (q && q.epicId) PalinodeMarketplace.enter({ questId: q.id });
      }
    });
  }

  window.PalinodeQuests = {
    KEY,
    getState: () => state,
    list,
    get,
    discover,
    accept,
    decline,
    abandon,
    complete,
    activateForEpic,
    markVisited,
    selectNote,
    clearSelectedNote,
    submitNote,
    submitStepNote,
    openStepSubmitPicker,
    applyEpicSubmission,
    isActive,
    isCompleted,
    canAccept,
    openOverview,
    closeOverview,
    showAcceptedChoice,
    keepExploring,
    startQuest,
    openConcept,
    renderLog: renderAll,
    renderList,
    open,
    showList,
    showOnMap,
    setLogFilter: st => { logFilter = st; if (active) renderAll(); },
    onChange: fn => { onLogChange = fn; },
    enter,
    leave,
    isOpen,
    isDetailOpen,
    selected,
    onChrome: null,
    onStartQuest: null,
    onWriteFromQuest: null,
    bind
  };

  document.addEventListener('DOMContentLoaded', bind);
  if (document.readyState !== 'loading') bind();
})();
