/* ============================================================
   Palinode — coach-mark tours (first visit per view)
   Figma-style tip anatomy on Khora dark glass.
   ============================================================ */

(function () {
  const Prefs = () => window.PalinodeStore && PalinodeStore.Prefs;

  function phone() { return window.matchMedia('(max-width: 900px)').matches; }

  function $(id) { return document.getElementById(id); }

  function visible(el) {
    if (!el) return false;
    if (el.hidden) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  }

  /* Corpus Explore: the Palinode concept is the hub. Note graphs use data-id=note. */
  function findExploreHub() {
    const labels = document.querySelectorAll('#gx-nodes .gx-node .gx-label');
    for (const lab of labels) {
      if ((lab.textContent || '').trim() !== 'Palinode') continue;
      const node = lab.closest('.gx-node');
      if (!visible(node)) continue;
      const orb = node.querySelector('.gx-orb');
      return (orb && visible(orb)) ? orb : node;
    }
    const note = document.querySelector('#gx-nodes .gx-node[data-id="note"]');
    if (visible(note)) {
      const orb = note.querySelector('.gx-orb');
      return (orb && visible(orb)) ? orb : note;
    }
    const sel = document.querySelector('#gx-nodes .gx-node.sel');
    if (visible(sel)) {
      const orb = sel.querySelector('.gx-orb');
      return (orb && visible(orb)) ? orb : sel;
    }
    return null;
  }

  const TOURS = {
    home: [
      {
        id: 'grid',
        selector: '#dash-grid',
        fallback: '#dashboard-wrap',
        body: 'Home gathers every area of Khora — cards you can open into Explore, Notes, Market, and more.',
        placement: 'bottom'
      },
      {
        id: 'explore-card',
        selector: '#dash-card-explore',
        body: 'Start in the field from here — or dive back in when you already know the way.',
        placement: 'bottom'
      },
      {
        id: 'notes-card',
        selector: '#dash-card-notes',
        body: 'Today’s prompt lives here — the same card as Notes. Write or skip without leaving Home.',
        placement: 'top'
      }
    ],
    explore: [
      {
        id: 'field',
        // Prefer the Palinode hub orb; canvas is only a last resort.
        find: findExploreHub,
        fallback: '#gx-canvas',
        body: 'This is the field — works and ideas float here as luminous nodes.',
        placement: 'bottom'
      },
      {
        id: 'chrome',
        // #gx-chrome is inset:0 (full graph) — anchor the filter strip itself.
        selector: '#gx-corpus-row',
        fallback: '#gx-top',
        body: 'Search, filters, and a selected node’s sheet live in this chrome.',
        placement: 'bottom'
      },
      {
        id: 'notes',
        selector: '#btn-rail',
        preferMobileSelector: '#nav-fab-toggle',
        body: 'Notes is where you write. The Reading rail answers what you put down.',
        placement: 'right'
      },
      {
        id: 'market',
        selector: '#btn-market',
        body: 'Market holds mentors, epics, and sessions you can enroll in.',
        placement: 'right'
      },
      {
        id: 'pathways',
        selector: '#btn-pathways',
        body: 'Pathways are trails you save from Explore — walks for later, or for someone else.',
        placement: 'right'
      },
      {
        id: 'quests',
        selector: '#btn-quests',
        body: 'Quests are stepped practices. Accept free ones from Explore, or from an epic.',
        placement: 'right'
      },
      {
        id: 'profile',
        selector: '#btn-profile',
        body: 'Profile is your belief map — spectra you place yourself on, not just lean toward.',
        placement: 'right'
      },
      {
        id: 'help',
        selector: '#btn-help',
        body: 'Help replays these tips for whatever page you are on.',
        placement: 'right'
      }
    ],
    write: [
      {
        id: 'prompt',
        selector: '#prompt-card',
        body: 'Start from today’s prompt, or skip it and write freely.',
        placement: 'right'
      },
      {
        id: 'editor',
        selector: '#editor-wrap',
        fallback: '#body-input',
        body: 'This is the page. Write until the thought has an edge.',
        placement: 'left'
      },
      {
        id: 'insights',
        selector: 'aside.insights',
        preferMobileSelector: '#btn-note-insights',
        body: 'Reading gathers insights, scores, and kin as you write.',
        placement: 'left'
      }
    ],
    insights: [
      {
        id: 'head',
        selector: 'aside.insights .ins-head .row',
        fallback: 'aside.insights',
        body: 'Reading is the mirror for the note — hide it anytime with the chevron.',
        placement: 'left'
      },
      {
        id: 'tabs',
        selector: '#seg',
        preferMobileSelector: '#seg-select',
        body: 'Switch between Insights, Readings, and Beliefs in this rail.',
        placement: 'left'
      },
      {
        id: 'score',
        selector: '#score',
        body: 'Scores and filters track the texture of what you wrote.',
        placement: 'left'
      }
    ],
    market: [
      {
        id: 'tabs',
        selector: '#mkt-tabs',
        body: 'Browse mentors, epics, and sessions — or jump to what you own.',
        placement: 'bottom'
      },
      {
        id: 'grid',
        selector: '#mkt-grid',
        fallback: '#market-wrap',
        body: 'Cards open into overviews, quests, and booking.',
        placement: 'top'
      }
    ],
    pathways: [
      {
        id: 'list',
        selector: '#path-list',
        body: 'Saved walks live here — sequences you kept from Explore.',
        placement: 'right'
      },
      {
        id: 'centre',
        selector: '#pathway-wrap',
        fallback: '#path-empty',
        body: 'Open a pathway to walk its steps in order.',
        placement: 'left'
      }
    ],
    quests: [
      {
        id: 'list',
        selector: '#quest-list',
        body: 'Quests you accept appear here, with progress across steps.',
        placement: 'right'
      },
      {
        id: 'centre',
        selector: '#quests-wrap',
        fallback: '#quest-empty',
        body: 'Pick a quest to see its steps and write a response.',
        placement: 'left'
      }
    ],
    profile: [
      {
        id: 'radar',
        selector: '#prof-radar',
        body: 'The radar shows only spectra you have answered — commitment, not lean.',
        placement: 'bottom'
      },
      {
        id: 'axis',
        selector: '.prof-axis',
        body: 'Place yourself on an axis to move the mark. Writing alone does not.',
        placement: 'top'
      }
    ]
  };

  let activeView = null;
  let stepIndex = 0;
  let steps = [];
  let bound = false;
  let hubRetryTimer = null;

  function resolveTarget(step) {
    if (typeof step.find === 'function') {
      const found = step.find();
      if (visible(found)) return found;
    }
    const candidates = [];
    if (phone() && step.preferMobileSelector) candidates.push(step.preferMobileSelector);
    if (step.selector) candidates.push(step.selector);
    if (step.fallback) candidates.push(step.fallback);
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (visible(el)) return el;
    }
    return null;
  }

  function usableSteps(viewId) {
    return (TOURS[viewId] || []).filter(s => resolveTarget(s));
  }

  function insightsOpen() {
    const body = document.getElementById('body') || document.querySelector('.body');
    const aside = document.querySelector('aside.insights');
    if (!body || !aside) return false;
    // Reading lives on the Notes shell — not Explore / Market / Pathways / etc.
    const graph = document.getElementById('graph');
    if ((window.PalinodeGraph && PalinodeGraph.isOpen()) || (graph && !graph.hidden)) return false;
    if (body.classList.contains('market-mode') ||
        body.classList.contains('quests-mode') ||
        body.classList.contains('profile-mode') ||
        body.classList.contains('pathways-mode') ||
        body.classList.contains('dashboard-mode')) return false;
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) return false;
    if (window.PalinodeQuests && PalinodeQuests.isOpen()) return false;
    if (window.PalinodeProfile && PalinodeProfile.isOpen()) return false;
    if (window.PalinodePathways &&
        (PalinodePathways.isListOpen() || PalinodePathways.isWalkOpen())) return false;
    if (phone()) return body.classList.contains('show-insights') && visible(aside);
    if (body.classList.contains('insights-closed')) return false;
    if (getComputedStyle(aside).display === 'none') return false;
    return visible(aside.querySelector('.ins-head')) || visible(aside);
  }

  function finish(opts) {
    const chain = !opts || opts.chain !== false;
    const view = activeView;
    hide();
    if (view && Prefs()) Prefs().tourDone(view);
    // After Notes (or any) tour ends, Reading may still be open for its first visit.
    if (chain && view !== 'insights') {
      requestAnimationFrame(() => {
        if (activeView) return;
        if (insightsOpen()) maybeStart('insights');
      });
    }
  }

  function hide() {
    activeView = null;
    stepIndex = 0;
    steps = [];
    if (hubRetryTimer) {
      clearTimeout(hubRetryTimer);
      hubRetryTimer = null;
    }
    const tip = $('coach-tip');
    const scrim = $('coach-scrim');
    if (tip) tip.hidden = true;
    if (scrim) {
      scrim.hidden = true;
      scrim.setAttribute('aria-hidden', 'true');
    }
  }

  function placeTip(target, preferred) {
    const tip = $('coach-tip');
    const arrow = $('coach-arrow');
    const gap = 14;
    const pad = 12;
    tip.style.visibility = 'hidden';
    tip.hidden = false;
    const tr = target.getBoundingClientRect();
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const order = preferred
      ? [preferred, 'bottom', 'top', 'right', 'left']
      : ['bottom', 'top', 'right', 'left'];
    const tried = new Set();

    let place = 'bottom';
    let left = 0;
    let top = 0;

    for (const p of order) {
      if (tried.has(p)) continue;
      tried.add(p);
      if (p === 'bottom') {
        top = tr.bottom + gap;
        left = tr.left + tr.width / 2 - tw / 2;
        if (top + th + pad <= vh) { place = p; break; }
      } else if (p === 'top') {
        top = tr.top - th - gap;
        left = tr.left + tr.width / 2 - tw / 2;
        if (top >= pad) { place = p; break; }
      } else if (p === 'right') {
        left = tr.right + gap;
        top = tr.top + tr.height / 2 - th / 2;
        if (left + tw + pad <= vw) { place = p; break; }
      } else if (p === 'left') {
        left = tr.left - tw - gap;
        top = tr.top + tr.height / 2 - th / 2;
        if (left >= pad) { place = p; break; }
      }
    }

    left = Math.max(pad, Math.min(left, vw - tw - pad));
    top = Math.max(pad, Math.min(top, vh - th - pad));

    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
    tip.dataset.place = place;
    tip.style.visibility = '';

    const cx = tr.left + tr.width / 2;
    const cy = tr.top + tr.height / 2;
    if (place === 'bottom' || place === 'top') {
      const ax = Math.max(16, Math.min(cx - left, tw - 16));
      tip.style.setProperty('--arrow-x', ax + 'px');
    } else {
      const ay = Math.max(16, Math.min(cy - top, th - 16));
      tip.style.setProperty('--arrow-y', ay + 'px');
    }
    if (arrow) arrow.style.display = '';
  }

  function placeSpot(target) {
    const scrim = $('coach-scrim');
    const spot = $('coach-spot');
    if (!scrim || !spot) return;
    const r = target.getBoundingClientRect();
    const pad = 8;
    spot.style.left = Math.round(r.left - pad) + 'px';
    spot.style.top = Math.round(r.top - pad) + 'px';
    spot.style.width = Math.round(r.width + pad * 2) + 'px';
    spot.style.height = Math.round(r.height + pad * 2) + 'px';
    scrim.hidden = false;
    scrim.setAttribute('aria-hidden', 'false');
  }

  function renderStep() {
    if (!activeView || !steps.length) return;
    if (stepIndex >= steps.length) {
      finish();
      return;
    }
    const step = steps[stepIndex];
    const target = resolveTarget(step);
    if (!target) {
      stepIndex += 1;
      renderStep();
      return;
    }

    const tip = $('coach-tip');
    const body = $('coach-body');
    const prog = $('coach-progress');
    const next = $('coach-next');
    if (!tip || !body || !prog || !next) return;

    body.textContent = step.body;
    prog.textContent = (stepIndex + 1) + ' of ' + steps.length;
    next.textContent = stepIndex >= steps.length - 1 ? 'Done' : 'Next';

    placeSpot(target);
    placeTip(target, step.placement);
    next.focus({ preventScroll: true });
  }

  function next() {
    if (!activeView) return;
    stepIndex += 1;
    if (stepIndex >= steps.length) finish();
    else renderStep();
  }

  function dismiss() {
    finish();
  }

  function bind() {
    if (bound) return;
    bound = true;
    const nextBtn = $('coach-next');
    const closeBtn = $('coach-close');
    if (nextBtn) nextBtn.addEventListener('click', next);
    if (closeBtn) closeBtn.addEventListener('click', dismiss);
    window.addEventListener('resize', () => {
      if (activeView) renderStep();
    });
    window.addEventListener('keydown', e => {
      if (!activeView) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        dismiss();
      } else if (e.key === 'Enter' && e.target && e.target.id === 'coach-next') {
        /* native button click handles it */
      }
    });
  }

  function beginTour(viewId, { force = false } = {}) {
    bind();
    if (!viewId || !TOURS[viewId]) return false;
    if (!force && Prefs() && Prefs().isTourDone(viewId)) return false;
    if (!force && activeView === viewId) return false;
    if (activeView) {
      if (force) hide();
      else finish({ chain: false });
    }

    const wait = () => {
      if (!force && Prefs() && Prefs().isTourDone(viewId)) return false;
      steps = usableSteps(viewId);
      if (!steps.length) return false;
      activeView = viewId;
      stepIndex = 0;
      renderStep();
      // Corpus nodes arrive async — re-anchor the field tip onto Palinode when it lands.
      if (viewId === 'explore') scheduleHubRetry();
      return true;
    };

    if (wait()) return true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (activeView) return;
        if (!force && Prefs() && Prefs().isTourDone(viewId)) return;
        wait();
      }, 120);
    });
    return true;
  }

  function scheduleHubRetry() {
    if (hubRetryTimer) clearTimeout(hubRetryTimer);
    let tries = 0;
    const tick = () => {
      hubRetryTimer = null;
      if (activeView !== 'explore' || stepIndex !== 0) return;
      const step = steps[0];
      if (!step || step.id !== 'field') return;
      const hub = findExploreHub();
      if (hub) {
        renderStep();
        return;
      }
      if (tries++ < 20) hubRetryTimer = setTimeout(tick, 150);
    };
    hubRetryTimer = setTimeout(tick, 150);
  }

  function maybeStart(viewId) {
    return beginTour(viewId, { force: false });
  }

  function start(viewId) {
    return beginTour(viewId, { force: true });
  }

  function isActive() { return !!activeView; }

  window.PalinodeOnboarding = {
    maybeStart,
    start,
    next,
    dismiss,
    isActive,
    insightsOpen,
    /* test helper */
    _reset() { hide(); }
  };
})();
