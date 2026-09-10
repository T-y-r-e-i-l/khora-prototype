/* ============================================================
   Palinode — Unified quest log + accept overlay

   Rail lists quests (Active / Completed / Abandoned). Centre
   opens the selected quest, like Notes and Pathways.
   ============================================================ */

(function () {
  const KEY = 'palinode.quests.v1';
  const $ = (s, root) => (root || document).querySelector(s);

  function Data() { return window.PalinodeMarketData; }
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
    return state.entries[questId] || null;
  }

  function isActive(questId) {
    const e = get(questId);
    return !!(e && e.status === 'active');
  }

  function isCompleted(questId) {
    const e = get(questId);
    return !!(e && e.status === 'completed');
  }

  function list(opts) {
    const status = opts && opts.status;
    const D = Data();
    if (!D) return [];
    return Object.keys(state.entries)
      .map(id => {
        const entry = state.entries[id];
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
      source: source || 'explore'
    };
    delete state.dismissed[questId];
    save();
    toast('Quest added to your log.');
    if (active) {
      logFilter = 'active';
      open(questId);
    }
    return true;
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
    const prev = state.entries[questId];
    state.entries[questId] = {
      status: 'completed',
      acceptedAt: (prev && prev.acceptedAt) || now,
      updatedAt: now,
      progress: 1,
      source: (prev && prev.source) || 'explore'
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
        source: 'epic'
      };
    });
    save();
    if (active) renderAll();
  }

  function typeLabel(type) {
    if (type === 'elenchos') return 'Elenchos';
    if (type === 'special') return 'Special';
    if (type === 'timed') return 'Timed';
    return 'Course';
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
    const objs = (q.objectives || []).map(o => `<li>${esc(o)}</li>`).join('');

    let primary = '';
    if (entry && entry.status === 'active') {
      if (enrolled && q.epicId) {
        primary = `<button type="button" class="ghost solid" data-quest-continue="${esc(q.id)}">Continue in epic</button>`;
      } else {
        primary = `<button type="button" class="ghost solid" data-quest-close>In your log</button>`;
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
      <h4 class="mkt-ov-h">Requirements</h4>
      <ul class="quest-objectives">${objs || '<li>Complete the quest prompt in your journal.</li>'}</ul>
      <h4 class="mkt-ov-h">Special details</h4>
      <p class="gx-fine">Reward · ${reward.exp || 0} EXP${reward.unlockLabel ? ' · ' + esc(reward.unlockLabel) : ''}</p>
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
      const next = (q.objectives && q.objectives[0]) || 'Continue';
      return `<div class="note-item${q.id === selectedId ? ' active' : ''}" data-open-quest="${esc(q.id)}">
        <h4>${esc(q.title)}</h4>
        <p>${esc(typeLabel(q.type))} · ${pct}% · ${esc(next)}</p>
      </div>`;
    }).join('');
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
    const objs = (q.objectives || []).map(o => `<li>${esc(o)}</li>`).join('');
    const pct = Math.round((entry.progress || 0) * 100);
    const enrolled = q.epicId && isEnrolled(q.epicId);

    host.innerHTML = `
      <div class="quest-detail-meta">
        <span class="mkt-badge">${esc(typeLabel(q.type))}</span>
        <span class="mkt-price">${esc(entry.status)}</span>
        ${q.access === 'free' ? '<span class="quest-ov-access">Free on the map</span>' : ''}
      </div>
      <h2 class="mkt-title">${esc(q.title)}</h2>
      <p class="mkt-lede">${esc(q.description)}</p>
      ${epic ? `<p class="mkt-ov-mentor">In epic · ${esc(epic.title)}</p>` : ''}
      <p class="mkt-progress-lab">${pct}% complete</p>
      <h4 class="mkt-ov-h">Objectives</h4>
      <ul class="quest-objectives">${objs || '<li>Complete the quest prompt in your journal.</li>'}</ul>
      <h4 class="mkt-ov-h">Reward</h4>
      <p class="gx-fine">${reward.exp || 0} EXP${reward.unlockLabel ? ' · ' + esc(reward.unlockLabel) : ''}</p>
      <div class="quest-detail-actions">
        <button type="button" class="ghost solid" data-quest-show-map="${esc(q.id)}">Show on map</button>
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
          accept(acceptBtn.dataset.questAccept, 'explore');
          closeOverview();
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
    isActive,
    isCompleted,
    canAccept,
    openOverview,
    closeOverview,
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
    bind
  };

  document.addEventListener('DOMContentLoaded', bind);
  if (document.readyState !== 'loading') bind();
})();
