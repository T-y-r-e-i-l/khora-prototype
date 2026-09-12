/* ============================================================
   Palinode — Home dashboard

   Arrangable GridStack layout (Ghost Writer–style). Card bodies
   are Palinode-only; layout/swap persist in Prefs.dashLayout.
   ============================================================ */

(function () {
  const Store = () => window.PalinodeStore;
  const Prefs = () => Store() && Store().Prefs;
  const Notes = () => Store() && Store().Notes;
  const Pathways = () => Store() && Store().Pathways;
  const Belief = () => Store() && Store().Belief;
  const BEL = () => window.PalinodeBeliefs;
  const BSCORE = () => window.PalinodeBeliefScore;

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const CARD_META = {
    explore:  { label: 'Explore',  orb: 'resonance', defaultW: 4, defaultH: 4 },
    notes:    { label: 'Notes',    orb: 'clarity',   defaultW: 5, defaultH: 4 },
    library:  { label: 'Library',  orb: 'clarity',   defaultW: 4, defaultH: 3 },
    pathways: { label: 'Pathways', orb: 'stance',    defaultW: 3, defaultH: 2 },
    quests:   { label: 'Quests',   orb: 'tension',   defaultW: 3, defaultH: 4 },
    profile:  { label: 'Profile',  orb: 'resonance', defaultW: 5, defaultH: 3 }
  };
  const CARD_TYPES = Object.keys(CARD_META);
  const MOBILE_MQ = '(max-width: 767px)';

  let insightsWasClosed = false;
  let railWasClosed = false;
  let bound = false;
  let gridApi = null;
  let persistTimer = null;
  let suppressPersist = false;
  let pickerEl = null;

  function bodyEl() { return document.getElementById('body'); }
  function root() { return document.getElementById('dashboard-wrap'); }
  function grid() { return document.getElementById('dash-grid'); }
  function isMobile() {
    return window.matchMedia && window.matchMedia(MOBILE_MQ).matches;
  }

  function isOpen() {
    const body = bodyEl();
    return !!(body && body.classList.contains('dashboard-mode'));
  }

  function uidPanel(type) {
    return 'd-' + type + '-' + Date.now().toString(36).slice(-4);
  }

  function panelsFromPrefs() {
    const p = Prefs() && Prefs().dashLayout();
    const list = (p && p.panels) || [];
    const seen = new Set();
    const out = [];
    list.forEach(panel => {
      if (!CARD_META[panel.type] || seen.has(panel.type)) return;
      seen.add(panel.type);
      out.push({
        id: panel.id || uidPanel(panel.type),
        type: panel.type,
        x: +panel.x || 0,
        y: +panel.y || 0,
        w: Math.max(1, +panel.w || CARD_META[panel.type].defaultW),
        h: Math.max(1, +panel.h || CARD_META[panel.type].defaultH)
      });
    });
    return out;
  }

  function unusedTypes(panels) {
    const used = new Set((panels || panelsFromPrefs()).map(p => p.type));
    return CARD_TYPES.filter(t => !used.has(t));
  }

  function hideWriteCentre() {
    const ed = $('#editor-wrap');
    const empty = $('#empty-state');
    const read = $('#reading-room');
    const walk = $('#pathway-wrap');
    const pe = $('#path-empty');
    const profile = $('#profile-view');
    const market = $('#market-wrap');
    const quests = $('#quests-wrap');
    const qe = $('#quest-empty');
    if (ed) ed.hidden = true;
    if (empty) { empty.hidden = true; empty.style.display = 'none'; }
    if (read) read.hidden = true;
    if (walk) walk.hidden = true;
    if (pe) pe.hidden = true;
    if (profile) profile.hidden = true;
    if (market) market.hidden = true;
    if (quests) quests.hidden = true;
    if (qe) qe.hidden = true;
  }

  function isReturningExplorer() {
    const p = Prefs();
    if (p && p.isTourDone('explore')) return true;
    if (p && p.lastExploreAt()) return true;
    if (Notes() && Notes().all().length > 1) return true;
    if (Pathways() && Pathways().all().length) return true;
    const cov = Belief() && Belief().coverage();
    return !!(cov && cov.placed > 0);
  }

  function formatWhen(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return 'Last in the field today';
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Last in the field yesterday';
    return 'Last in the field ' + d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  function cardShell(opts) {
    const extras = [opts.mod].filter(Boolean).join(' ');
    const meta = CARD_META[opts.id] || { label: opts.title, orb: opts.orb || 'stance' };
    const kicker = opts.hideKicker
      ? `<span class="dash-card-type micro">${esc(meta.label)}</span>`
      : `<div class="dash-card-kicker">
          <span class="orb sm" style="--c:var(--${esc(opts.orb || meta.orb || 'stance')})"></span>
          <h3>${esc(opts.title || meta.label)}</h3>
        </div>`;
    return `<article class="dash-card${extras ? ' ' + extras : ''}" data-dash-card="${esc(opts.id)}" id="dash-card-${esc(opts.id)}">
      <div class="dash-card-chrome">
        <button type="button" class="dash-drag" aria-label="Drag to rearrange" title="Drag to rearrange">
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <circle cx="4" cy="3.5" r="1.2" fill="currentColor"/>
            <circle cx="10" cy="3.5" r="1.2" fill="currentColor"/>
            <circle cx="4" cy="7" r="1.2" fill="currentColor"/>
            <circle cx="10" cy="7" r="1.2" fill="currentColor"/>
            <circle cx="4" cy="10.5" r="1.2" fill="currentColor"/>
            <circle cx="10" cy="10.5" r="1.2" fill="currentColor"/>
          </svg>
        </button>
        ${kicker}
        <div class="dash-card-menu">
          <button type="button" class="dash-menu-btn" data-dash-menu aria-haspopup="true" aria-label="Card options">⋯</button>
        </div>
      </div>
      <div class="dash-card-body">${opts.body}</div>
      <div class="dash-card-foot">${opts.foot || ''}</div>
    </article>`;
  }

  function wrapPanel(panel, inner) {
    return `<div class="grid-stack-item"
      gs-id="${esc(panel.id)}"
      gs-x="${panel.x}" gs-y="${panel.y}" gs-w="${panel.w}" gs-h="${panel.h}"
      data-panel-id="${esc(panel.id)}" data-panel-type="${esc(panel.type)}">
      <div class="grid-stack-item-content">${inner}</div>
    </div>`;
  }

  function conceptLabel(ref) {
    if (!ref) return '';
    if (typeof ref === 'object') return ref.label || ref.id || '';
    const C = window.PalinodeCorpus && PalinodeCorpus.CONCEPTS;
    const hit = C && C.find(c => c.id === ref);
    return (hit && hit.label) || String(ref);
  }

  function conceptCat(ref) {
    if (!ref) return 'clarity';
    if (typeof ref === 'object') return ref.category || 'clarity';
    const C = window.PalinodeCorpus && PalinodeCorpus.CONCEPTS;
    const hit = C && C.find(c => c.id === ref);
    return (hit && hit.category) || 'clarity';
  }

  function exploreSteps() {
    const paths = Pathways() ? Pathways().all() : [];
    if (paths.length && (paths[0].steps || []).length) {
      return { pathway: paths[0], steps: paths[0].steps.slice(0, 7) };
    }
    const seen = new Set();
    const steps = [];
    (Notes() ? Notes().all() : []).slice(0, 8).forEach(n => {
      (n.concepts || []).forEach(c => {
        const id = typeof c === 'string' ? c : (c && c.id);
        if (!id || seen.has(id) || steps.length >= 7) return;
        seen.add(id);
        steps.push({
          type: 'concept',
          ref: id,
          label: conceptLabel(c),
          category: conceptCat(c)
        });
      });
    });
    if (steps.length >= 3) return { pathway: null, steps };
    const C = window.PalinodeCorpus && PalinodeCorpus.CONCEPTS;
    if (C && C.length) {
      C.slice(0, 7).forEach(c => {
        if (seen.has(c.id) || steps.length >= 7) return;
        seen.add(c.id);
        steps.push({
          type: 'concept',
          ref: c.id,
          label: c.label,
          category: c.category || 'clarity'
        });
      });
    }
    return { pathway: null, steps };
  }

  function buildConstellation(steps) {
    const P = window.PalinodePathways;
    if (P && typeof P.previewConstellation === 'function') {
      return P.previewConstellation({ steps }, { wide: true });
    }
    return `<div class="constellation path-constel dash-constel" style="--g1:var(--resonance);--g2:var(--lineage)" aria-hidden="true">
      <div class="path-constel-empty">Open Explore</div></div>`;
  }

  function exploreCard() {
    const returning = isReturningExplorer();
    const when = Prefs() && formatWhen(Prefs().lastExploreAt());
    const { steps } = exploreSteps();
    const preview = buildConstellation(steps);
    const lede = returning
      ? (when || 'Pick up where the nodes left you.')
      : 'Works and ideas float here as luminous nodes.';
    const body = `<button type="button" class="dash-constel-btn" data-dash-go="explore" aria-label="Open Explore">
        ${preview}
      </button>
      <p class="dash-constel-lede micro">${esc(lede)}</p>`;
    const foot = returning
      ? `<button type="button" class="ghost solid" data-dash-go="explore">Dive back in</button>`
      : `<button type="button" class="ghost solid" data-dash-go="explore">Explore the field</button>`;
    return cardShell({
      id: 'explore', title: 'Explore', orb: 'resonance', body, foot,
      mod: 'dash-card--feature dash-card--explore'
    });
  }

  function notesCard() {
    return cardShell({
      id: 'notes', title: 'Notes', orb: 'clarity',
      body: '<div class="dash-prompt-host" id="dash-prompt-host"></div>',
      foot: '',
      mod: 'dash-card--feature dash-card--notes dash-card--prompt',
      hideKicker: true
    });
  }

  function fmtNoteDate(ts) {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch (_) {
      return '';
    }
  }

  function libraryCard() {
    const all = Notes() ? Notes().all() : [];
    if (!all.length) {
      return cardShell({
        id: 'library', title: 'Library', orb: 'clarity',
        body: '<p>No notes yet. Take today’s prompt, or start a blank one.</p>',
        foot: '<button type="button" class="ghost solid" data-dash-go="notes">Open Notes</button>',
        mod: 'dash-card--list dash-card--library'
      });
    }
    const rows = all.slice(0, 4).map(n => {
      const cats = [...new Set(n.concepts || [])].slice(0, 5);
      const orbs = cats.map(c => {
        const cat = conceptCat(c);
        return `<i class="mini-orb" style="--mc:var(--${esc(cat)})"></i>`;
      }).join('');
      return `<div class="note-item" data-dash-note="${esc(n.id)}" role="button" tabindex="0">
        <h4>${esc(n.title || 'Untitled')}</h4>
        <p>${esc((n.body || '').slice(0, 130) || 'Empty note')}</p>
        <div class="meta">
          <span>${esc(fmtNoteDate(n.updated))}</span>
          <span class="dot-row">${orbs}</span>
        </div>
      </div>`;
    }).join('');
    return cardShell({
      id: 'library', title: 'Library', orb: 'clarity',
      body: `<div class="dash-note-list">${rows}</div>`,
      foot: '<button type="button" class="ghost solid" data-dash-go="notes">Open Notes</button>',
      mod: 'dash-card--list dash-card--library'
    });
  }

  function pathwaysCard() {
    const all = Pathways() ? Pathways().all() : [];
    if (!all.length) {
      return cardShell({
        id: 'pathways', title: 'Pathways', orb: 'stance',
        body: '<p>Save a trail from Explore and walk it again — or hand it to someone else.</p>',
        foot: '<button type="button" class="ghost solid" data-dash-go="pathways">Open Pathways</button>',
        mod: 'dash-card--rail'
      });
    }
    const rows = all.slice(0, 3).map(p => {
      const n = (p.steps || []).length;
      return `<li><button type="button" class="dash-link" data-dash-path="${esc(p.id)}">${esc(p.title || 'Untitled')}</button>
        <span class="micro">${n} step${n === 1 ? '' : 's'}</span></li>`;
    }).join('');
    return cardShell({
      id: 'pathways', title: 'Pathways', orb: 'stance',
      body: `<ul class="dash-list">${rows}</ul>`,
      foot: '<button type="button" class="ghost solid" data-dash-go="pathways">Open Pathways</button>',
      mod: 'dash-card--rail'
    });
  }

  function questsCard() {
    const Q = window.PalinodeQuests;
    const rows = (Q && Q.list) ? Q.list({ status: 'active' }) : [];
    if (!rows.length) {
      return cardShell({
        id: 'quests', title: 'Quests', orb: 'tension',
        body: '<p>Accept a free quest from Explore, or work one inside an epic.</p>',
        foot: '<button type="button" class="ghost solid" data-dash-go="quests">Open Quests</button>',
        mod: 'dash-card--rail'
      });
    }
    const list = rows.slice(0, 3).map(q => {
      const pct = Math.round((q.log && q.log.progress || 0) * 100);
      const next = (Q.nextStepHint && Q.nextStepHint(q)) || 'Continue';
      return `<li><button type="button" class="dash-link" data-dash-quest="${esc(q.id)}">${esc(q.title)}</button>
        <span class="micro">${pct}% · ${esc(next)}</span></li>`;
    }).join('');
    return cardShell({
      id: 'quests', title: 'Quests', orb: 'tension',
      body: `<ul class="dash-list">${list}</ul>`,
      foot: '<button type="button" class="ghost solid" data-dash-go="quests">Open Quests</button>',
      mod: 'dash-card--rail'
    });
  }

  function profileAnalysis() {
    const scores = Belief() ? Belief().scores() : {};
    const cov = Belief() ? Belief().coverage() : { placed: 0, total: 0 };
    const spectra = BEL() ? BEL().SPECTRA : [];
    const placed = spectra
      .filter(s => scores[s.id])
      .map(s => ({ axis: s, score: scores[s.id] }))
      .sort((a, b) => Math.abs(b.score.score) - Math.abs(a.score.score));

    const radar = (window.PalinodeProfile && PalinodeProfile.radarHtml)
      ? PalinodeProfile.radarHtml(placed)
      : '';

    if (!cov.placed) {
      return {
        body: `<div class="dash-radar empty">${radar}</div>
          <div class="dash-profile-copy">
            <p>Nothing placed yet. Answer a spectrum and your makeup takes shape.</p>
          </div>`,
        placed
      };
    }

    const lines = placed.slice(0, 3).map(p => {
      const d = BSCORE() ? BSCORE().describe(p.axis.id, p.score) : p.axis.title;
      return `<p class="dash-analysis-line">${esc(d)}</p>`;
    }).join('');

    return {
      body: `<div class="dash-radar">${radar}</div>
        <div class="dash-profile-copy">
          <p class="dash-eyebrow">${cov.placed} of ${cov.total} spectra placed</p>
          ${lines}
        </div>`,
      placed
    };
  }

  function profileCard() {
    const { body } = profileAnalysis();
    return cardShell({
      id: 'profile', title: 'Profile', orb: 'resonance',
      body,
      foot: '<button type="button" class="ghost solid" data-dash-go="profile">Open Profile</button>',
      mod: 'dash-card--profile'
    });
  }

  const BUILDERS = {
    explore: exploreCard,
    notes: notesCard,
    library: libraryCard,
    pathways: pathwaysCard,
    quests: questsCard,
    profile: profileCard
  };

  function promptEl() { return document.getElementById('prompt-card'); }
  function promptHome() { return document.getElementById('prompt-rail-home'); }
  function promptHost() { return document.getElementById('dash-prompt-host'); }

  function unmountPrompt() {
    const prompt = promptEl();
    const home = promptHome();
    if (prompt && home && prompt.parentElement !== home) home.appendChild(prompt);
  }

  function mountPrompt() {
    const prompt = promptEl();
    const host = promptHost();
    if (!prompt || !host) return;
    if (prompt.parentElement !== host) host.appendChild(prompt);
    if (window.PalinodeApp && typeof window.PalinodeApp.renderPrompt === 'function') {
      window.PalinodeApp.renderPrompt();
    }
  }

  function destroyGrid() {
    if (persistTimer) { clearTimeout(persistTimer); persistTimer = null; }
    if (gridApi) {
      try { gridApi.destroy(false); } catch (_) { /* ignore */ }
      gridApi = null;
    }
  }

  function readGridPanels() {
    if (!gridApi) return panelsFromPrefs();
    const nodes = gridApi.engine && gridApi.engine.nodes ? gridApi.engine.nodes : [];
    return nodes.map(n => {
      const el = n.el;
      return {
        id: (el && el.getAttribute('data-panel-id')) || n.id,
        type: (el && el.getAttribute('data-panel-type')) || '',
        x: n.x, y: n.y, w: n.w, h: n.h
      };
    }).filter(p => CARD_META[p.type]);
  }

  function schedulePersist() {
    if (suppressPersist || isMobile()) return;
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(() => {
      persistTimer = null;
      if (!Prefs() || !Prefs().setDashLayout) return;
      Prefs().setDashLayout(readGridPanels());
      syncHeadActions();
    }, 400);
  }

  function initGrid() {
    destroyGrid();
    const g = grid();
    if (!g || !window.GridStack) return;
    const mobile = isMobile();
    suppressPersist = true;
    gridApi = window.GridStack.init({
      column: 12,
      cellHeight: 72,
      margin: 12,
      float: false,
      animate: !mobile,
      disableDrag: mobile,
      disableResize: mobile,
      handle: '.dash-drag',
      draggable: { handle: '.dash-drag', appendTo: 'body', scroll: true },
      resizable: { handles: 'se' }
    }, g);
    gridApi.on('change', () => schedulePersist());
    gridApi.on('resizestop', () => schedulePersist());
    gridApi.on('dragstop', () => schedulePersist());
    suppressPersist = false;
  }

  function syncHeadActions() {
    const head = root() && root().querySelector('.dash-head');
    if (!head) return;
    let actions = head.querySelector('.dash-head-actions');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = 'dash-head-actions';
      head.appendChild(actions);
    }
    const free = unusedTypes();
    actions.innerHTML = `
      <button type="button" class="ghost" id="dash-btn-add" ${free.length ? '' : 'disabled'}>Add card</button>
      <button type="button" class="ghost" id="dash-btn-reset">Reset layout</button>`;
  }

  function closePicker() {
    if (pickerEl) { pickerEl.remove(); pickerEl = null; }
  }

  function showTypePicker(opts) {
    closePicker();
    const types = opts.types || [];
    if (!types.length) return;
    const pop = document.createElement('div');
    pop.className = 'dash-type-picker';
    pop.setAttribute('role', 'menu');
    pop.innerHTML = `<p class="dash-type-picker-title micro">${esc(opts.title || 'Choose a card')}</p>` +
      types.map(t => `<button type="button" role="menuitem" data-pick-type="${esc(t)}">${esc(CARD_META[t].label)}</button>`).join('');
    document.body.appendChild(pop);
    pickerEl = pop;

    const rect = opts.anchor.getBoundingClientRect();
    const pw = pop.offsetWidth;
    const ph = pop.offsetHeight;
    let left = rect.left;
    let top = rect.bottom + 6;
    if (left + pw > window.innerWidth - 8) left = window.innerWidth - pw - 8;
    if (top + ph > window.innerHeight - 8) top = rect.top - ph - 6;
    pop.style.left = Math.max(8, left) + 'px';
    pop.style.top = Math.max(8, top) + 'px';

    pop.addEventListener('click', e => {
      e.stopPropagation();
      const btn = e.target.closest('[data-pick-type]');
      if (!btn) return;
      const type = btn.getAttribute('data-pick-type');
      closePicker();
      if (typeof opts.onPick === 'function') opts.onPick(type);
    });
  }

  function addPanel(type) {
    if (!CARD_META[type] || unusedTypes().indexOf(type) < 0) return;
    const panels = panelsFromPrefs();
    let maxY = 0;
    panels.forEach(p => { maxY = Math.max(maxY, p.y + p.h); });
    panels.push({
      id: uidPanel(type),
      type,
      x: 0,
      y: maxY,
      w: CARD_META[type].defaultW,
      h: CARD_META[type].defaultH
    });
    Prefs().setDashLayout(panels);
    render();
  }

  function removePanel(panelId) {
    const panels = panelsFromPrefs().filter(p => p.id !== panelId);
    Prefs().setDashLayout(panels);
    render();
  }

  function swapPanel(panelId, newType) {
    if (!CARD_META[newType]) return;
    const panels = panelsFromPrefs();
    if (panels.some(p => p.type === newType && p.id !== panelId)) return;
    const hit = panels.find(p => p.id === panelId);
    if (!hit) return;
    hit.type = newType;
    Prefs().setDashLayout(panels);
    render();
  }

  function resetLayout() {
    if (Prefs() && Prefs().resetDashLayout) Prefs().resetDashLayout();
    render();
  }

  function render() {
    const g = grid();
    if (!g) return;
    closePicker();
    unmountPrompt();
    destroyGrid();

    const panels = panelsFromPrefs().slice().sort((a, b) => (a.y - b.y) || (a.x - b.x));
    g.className = 'dash-grid grid-stack';
    g.innerHTML = panels.map(panel => {
      const build = BUILDERS[panel.type];
      if (!build) return '';
      return wrapPanel(panel, build());
    }).join('');

    syncHeadActions();
    if (isOpen()) {
      initGrid();
      mountPrompt();
    }
  }

  function goExplore() {
    if (Prefs() && Prefs().touchExplore) Prefs().touchExplore();
    if (window.PalinodeApp && typeof PalinodeApp.openCorpus === 'function') {
      leave();
      void PalinodeApp.openCorpus();
      return;
    }
    const btn = document.getElementById('btn-explore');
    if (btn) btn.click();
  }

  function goNotes() {
    leave();
    if (typeof window.PalinodeDashboard.onOpenNotes === 'function')
      window.PalinodeDashboard.onOpenNotes();
  }

  function goNote(noteId) {
    leave();
    if (typeof window.PalinodeDashboard.onOpenNote === 'function')
      window.PalinodeDashboard.onOpenNote(noteId);
    else goNotes();
  }

  function goPathways(pathId) {
    leave();
    if (typeof window.PalinodeDashboard.onOpenPathways === 'function')
      window.PalinodeDashboard.onOpenPathways(pathId || null);
  }

  function goQuests(questId) {
    leave();
    if (typeof window.PalinodeDashboard.onOpenQuests === 'function')
      window.PalinodeDashboard.onOpenQuests(questId || null);
  }

  function goProfile() {
    leave();
    if (typeof window.PalinodeDashboard.onOpenProfile === 'function')
      window.PalinodeDashboard.onOpenProfile();
  }

  function bind() {
    const view = root();
    if (!view || bound) return;
    bound = true;

    view.addEventListener('click', e => {
      if (e.target.closest('#dash-btn-add')) {
        const free = unusedTypes();
        showTypePicker({
          title: 'Add card',
          types: free,
          anchor: e.target.closest('#dash-btn-add'),
          onPick: addPanel
        });
        return;
      }
      if (e.target.closest('#dash-btn-reset')) {
        resetLayout();
        return;
      }

      const menuBtn = e.target.closest('[data-dash-menu]');
      if (menuBtn) {
        e.preventDefault();
        e.stopPropagation();
        const item = menuBtn.closest('[data-panel-id]');
        if (!item) return;
        const panelId = item.getAttribute('data-panel-id');
        const type = item.getAttribute('data-panel-type');
        const free = unusedTypes().filter(t => t !== type);
        closePicker();
        const pop = document.createElement('div');
        pop.className = 'dash-type-picker';
        pop.innerHTML = `
          <button type="button" data-dash-action="swap" ${free.length ? '' : 'disabled'}>Swap card…</button>
          <button type="button" data-dash-action="remove">Remove</button>`;
        document.body.appendChild(pop);
        pickerEl = pop;
        const rect = menuBtn.getBoundingClientRect();
        pop.style.left = Math.min(rect.left, window.innerWidth - pop.offsetWidth - 8) + 'px';
        pop.style.top = (rect.bottom + 6) + 'px';
        pop.addEventListener('click', ev => {
          ev.stopPropagation();
          const act = ev.target.closest('[data-dash-action]');
          if (!act || act.disabled) return;
          const kind = act.getAttribute('data-dash-action');
          const types = free.slice();
          const anchor = menuBtn;
          closePicker();
          if (kind === 'remove') removePanel(panelId);
          else if (kind === 'swap') {
            requestAnimationFrame(() => {
              showTypePicker({
                title: 'Swap with',
                types,
                anchor,
                onPick: t => swapPanel(panelId, t)
              });
            });
          }
        });
        return;
      }

      const go = e.target.closest('[data-dash-go]');
      if (go) {
        const dest = go.getAttribute('data-dash-go');
        if (dest === 'explore') goExplore();
        else if (dest === 'notes') goNotes();
        else if (dest === 'pathways') goPathways();
        else if (dest === 'quests') goQuests();
        else if (dest === 'profile') goProfile();
        return;
      }
      const note = e.target.closest('[data-dash-note]');
      if (note) { goNote(note.getAttribute('data-dash-note')); return; }
      const path = e.target.closest('[data-dash-path]');
      if (path) { goPathways(path.getAttribute('data-dash-path')); return; }
      const quest = e.target.closest('[data-dash-quest]');
      if (quest) { goQuests(quest.getAttribute('data-dash-quest')); return; }
    });

    document.addEventListener('click', e => {
      if (!pickerEl) return;
      if (pickerEl.contains(e.target)) return;
      if (e.target.closest('[data-dash-menu]') || e.target.closest('#dash-btn-add')) return;
      closePicker();
    });

    if (window.matchMedia) {
      window.matchMedia(MOBILE_MQ).addEventListener('change', () => {
        if (isOpen()) render();
      });
    }
  }

  function enter() {
    const body = bodyEl();
    const view = root();
    if (!view) return;
    if (window.PalinodeGraph && PalinodeGraph.isOpen && PalinodeGraph.isOpen()) {
      PalinodeGraph.close();
      document.body.classList.remove('exploring');
    }
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) PalinodeMarketplace.leave();
    if (window.PalinodePathways && PalinodePathways.isListOpen &&
        (PalinodePathways.isListOpen() || PalinodePathways.isWalkOpen()))
      PalinodePathways.leave();
    if (window.PalinodeQuests && PalinodeQuests.isOpen()) PalinodeQuests.leave();
    if (window.PalinodeProfile && PalinodeProfile.isOpen()) PalinodeProfile.leave();

    if (body && !body.classList.contains('dashboard-mode')) {
      insightsWasClosed = body.classList.contains('insights-closed');
      railWasClosed = body.classList.contains('rail-closed');
      body.classList.add('dashboard-mode', 'insights-closed', 'rail-closed');
      body.classList.remove(
        'show-insights', 'show-rail',
        'market-mode', 'pathways-mode', 'quests-mode', 'profile-mode'
      );
    }
    hideWriteCentre();
    view.hidden = false;
    bind();
    render();
  }

  function leave() {
    closePicker();
    unmountPrompt();
    destroyGrid();
    const view = root();
    if (view) view.hidden = true;
    const body = bodyEl();
    if (body) {
      body.classList.remove('dashboard-mode');
      if (!insightsWasClosed) body.classList.remove('insights-closed');
      if (!railWasClosed) body.classList.remove('rail-closed');
    }
  }

  window.PalinodeDashboard = {
    enter, leave, isOpen, render,
    CARD_META,
    onOpenNotes: null,
    onOpenNote: null,
    onOpenMarket: null,
    onOpenPathways: null,
    onOpenQuests: null,
    onOpenProfile: null,
    onPromptWrite: null
  };
})();
