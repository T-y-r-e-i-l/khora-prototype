/* ============================================================
   Palinode — coach-mark tours (first visit per view)
   Figma-style tip anatomy on Khora dark glass.
   ============================================================ */

(function () {
  const Prefs = () => window.PalinodeStore && PalinodeStore.Prefs;

  const TOURS = {
    explore: [
      {
        id: 'field',
        selector: '#gx-canvas',
        body: 'This is the field — works and ideas float here as luminous nodes.',
        placement: 'bottom'
      },
      {
        id: 'chrome',
        selector: '#gx-chrome',
        fallback: '#gx-hint',
        body: 'Search, filters, and a selected node’s sheet live in this chrome.',
        placement: 'bottom'
      },
      {
        id: 'notes',
        selector: '#btn-rail',
        preferMobileSelector: '#nav-fab-toggle',
        body: 'Notes is where you write. The Reading rail answers what you put down.',
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

  const phone = () => window.matchMedia('(max-width: 900px)').matches;

  function $(id) { return document.getElementById(id); }

  function visible(el) {
    if (!el) return false;
    if (el.hidden) return false;
    const st = getComputedStyle(el);
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false;
    const r = el.getBoundingClientRect();
    return r.width > 2 && r.height > 2;
  }

  function resolveTarget(step) {
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

  function finish() {
    const view = activeView;
    hide();
    if (view && Prefs()) Prefs().tourDone(view);
  }

  function hide() {
    activeView = null;
    stepIndex = 0;
    steps = [];
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

  function maybeStart(viewId) {
    bind();
    if (!viewId || !TOURS[viewId]) return false;
    if (Prefs() && Prefs().isTourDone(viewId)) return false;
    if (activeView && activeView === viewId) return false;
    if (activeView && activeView !== viewId) finish();

    const wait = () => {
      steps = usableSteps(viewId);
      if (!steps.length) {
        return false;
      }
      activeView = viewId;
      stepIndex = 0;
      renderStep();
      return true;
    };

    if (wait()) return true;
    requestAnimationFrame(() => {
      setTimeout(() => {
        if (activeView) return;
        if (Prefs() && Prefs().isTourDone(viewId)) return;
        wait();
      }, 120);
    });
    return true;
  }

  function isActive() { return !!activeView; }

  window.PalinodeOnboarding = {
    maybeStart,
    next,
    dismiss,
    isActive,
    /* test helper */
    _reset() { hide(); }
  };
})();
