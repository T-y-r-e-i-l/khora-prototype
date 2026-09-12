/* ============================================================
   Palinode — application controller
   ============================================================ */

(function () {
  const { Notes, Prompts, Prefs, Share, Saved, Attach, Belief, Pathways } = window.PalinodeStore;
  const BEL = window.PalinodeBeliefs;
  const BSCORE = window.PalinodeBeliefScore;
  const SPECUI = window.PalinodeSpectrumUI;
  const Media = window.PalinodeMedia;
  const CATS = window.PalinodeEngine.categories;
  const Khora = window.PalinodeKhora;

  const $  = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));

  const FIELD_REST = ['#8a5a12', '#123a5e', '#5c1416', '#2f1650', '#6b5a10'];
  const FIELD_DEEP = {
    resonance: '#8a5a12', tension: '#5c1416', clarity: '#2f1650',
    stance: '#6b5a10', lineage: '#123a5e'
  };
  const FIELD_WASH = {
    resonance: '#c47a28', tension: '#8a2428', clarity: '#4a2a78',
    stance: '#8a7420', lineage: '#1a5a58'
  };
  function paintField(primary, extras) {
    const field = document.getElementById('field');
    if (!field) return;
    const seen = [];
    [primary].concat(extras || []).forEach(c => {
      if (FIELD_DEEP[c] && seen.indexOf(c) < 0) seen.push(c);
    });
    const colors = seen.length ? [
      FIELD_DEEP[seen[0]],
      FIELD_WASH[seen[0]],
      FIELD_DEEP[seen[1] || seen[0]],
      FIELD_WASH[seen[1] || seen[2] || seen[0]],
      FIELD_DEEP[seen[2] || seen[seen.length - 1]]
    ] : FIELD_REST;
    colors.forEach((c, i) => field.style.setProperty('--f' + (i + 1), c));
    field.dataset.mood = seen[0] || 'rest';
  }
  function paintFieldFromAnalysis() {
    const concepts = (analysis && analysis.concepts) || [];
    paintField(concepts[0] && concepts[0].category,
      concepts.slice(1, 4).map(c => c.category));
  }
  window.PalinodeField = { paint: paintField };

  const el = {
    body:      $('#body'),
    list:      $('#note-list'),
    q:         $('#q'),
    title:     $('#title'),
    input:     $('#body-input'),
    mirror:    $('#mirror'),
    editorWrap:$('#editor-wrap'),
    empty:     $('#empty-state'),
    metaDate:  $('#meta-date'),
    metaWords: $('#meta-words'),
    metaState: $('#meta-state'),
    pulse:     $('#pulse'),
    insList:   $('#ins-list'),
    readList:  $('#readings-list'),
    belList:   $('#beliefs-list'),
    placeScrim:$('#place-scrim'),
    placeModal:$('#place-modal'),
    room:      $('#reading-room'),
    seg:       $('#seg'),
    segSelect: $('#seg-select'),
    filters:   $('#filters'),
    bars:      $('#bars'),
    ringArc:   $('#ring-arc'),
    ringVal:   $('#ring-val'),
    constel:   $('#constellation'),
    promptCard:$('#prompt-card'),
    promptText:$('#prompt-text'),
    promptSrc: $('#prompt-source'),
    skipLabel: $('#skip-label'),
    scrim:     $('#scrim'),
    shareLink: $('#share-link'),
    toast:     $('#toast')
  };

  const LIB = window.PalinodeLibrary;

  let activeId   = null;
  let pendingSave = null;
  let analysis   = null;
  let openKey    = null;
  let timer      = null;
  let tab        = 'insights';
  let shelf      = [];

  const esc = s => String(s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const fmtDate = ts => new Date(ts).toLocaleDateString(undefined,
    { month:'short', day:'numeric', year:'numeric' });

  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.toast.classList.remove('on'), 2200);
  }

  const orb = (cat, cls = '') =>
    `<span class="orb ${cls}" style="--c:var(--${cat})"></span>`;

  /* ================= daily prompt ================= */

  function renderPrompt() {
    const s = Prompts.state();
    el.promptText.textContent = s.prompt.text;
    el.promptSrc.textContent  = s.prompt.source + ' · ' + (window.PalinodeCorpus.TRADITIONS[s.prompt.tradition] || '');

    $$('.skip-pip').forEach(p => p.classList.toggle('used', +p.dataset.i < s.skips));
    el.skipLabel.textContent = s.exhausted
      ? 'No skips left today'
      : s.remaining + (s.remaining === 1 ? ' skip left' : ' skips left');

    const skipBtn = $('#btn-skip');
    skipBtn.disabled = s.exhausted;
    skipBtn.textContent = s.exhausted ? 'Skips used' : 'Skip';
    return s;
  }

  $('#btn-skip').addEventListener('click', () => {
    const before = Prompts.state();
    if (before.exhausted) { toast('Three skips is the allowance. This one is yours until tomorrow.'); return; }
    const after = Prompts.skip();
    renderPrompt();
    if (activeId) {
      const n = Notes.get(activeId);
      const todays = Prompts.state().prompt.text;
      setBanner(n.promptText && n.promptText !== todays ? n.promptText : null);
      markWritingOnToday(!!n.promptText && n.promptText === todays);
    }
    toast(after.exhausted
      ? 'Last skip used — this prompt stands until tomorrow.'
      : 'New prompt. ' + after.remaining + ' skip' + (after.remaining === 1 ? '' : 's') + ' remaining.');
  });

  $('#btn-write').addEventListener('click', () => {
    const s = Prompts.state();
    const n = Notes.create({
      promptId: s.prompt.id,
      promptText: s.prompt.text,
      title: s.prompt.text
    });
    Prompts.markWritten(s.prompt.id);
    openNote(n.id);
    renderList();
    el.input.focus();
  });

  /* ================= library ================= */

  function renderList() {
    const notes = Notes.search(el.q.value || '');
    if (!notes.length) {
      el.list.innerHTML = `<div style="padding:22px 12px;color:var(--ink-4);font-size:12px;line-height:1.6">
        ${el.q.value ? 'Nothing matches that.' : 'No notes yet. Take the prompt, or start a blank one.'}</div>`;
      return;
    }
    el.list.innerHTML = notes.map(n => {
      const cats = [...new Set(n.concepts || [])].slice(0, 5);
      return `<div class="note-item ${n.id === activeId ? 'active' : ''}" data-id="${n.id}">
        <h4>${esc(n.title || 'Untitled')}</h4>
        <p>${esc((n.body || '').slice(0, 130) || 'Empty note')}</p>
        <div class="meta">
          <span>${fmtDate(n.updated)}</span>
          <span class="dot-row">${cats.map(c => `<i class="mini-orb" style="--mc:var(--${c})"></i>`).join('')}</span>
        </div>
        <button class="forget" data-forget="${esc(n.id)}" title="Delete note" aria-label="Delete note">×</button>
      </div>`;
    }).join('');
  }

  let pendingForget = null;

  function askForget(id) {
    const n = Notes.get(id);
    if (!n) return;
    pendingForget = id;
    const label = (n.title || '').trim() || 'Untitled';
    $('#forget-title').textContent = 'Delete this note?';
    $('#forget-lede').textContent = '“' + label + '” will be removed from this device. This cannot be undone.';
    $('#forget-scrim').dataset.kind = 'note';
    $('#forget-scrim').dataset.id = id;
    $('#forget-scrim').classList.add('on');
  }

  function closeForget() {
    pendingForget = null;
    const scrim = $('#forget-scrim');
    scrim.dataset.kind = '';
    scrim.dataset.id = '';
    $('#forget-title').textContent = 'Delete this note?';
    $('#forget-lede').textContent = 'This cannot be undone.';
    scrim.classList.remove('on');
  }

  function forgetNote(id) {
    const n = Notes.get(id);
    if (!n) return;
    closeExplore();
    (n.attachments || []).forEach(a => {
      if (a.kind !== 'link') Media.del(a.id);
    });
    Notes.remove(id);
    if (activeId === id) {
      const next = Notes.all()[0];
      if (next) openNote(next.id);
      else {
        activeId = null;
        analysis = null;
        el.editorWrap.hidden = true;
        el.room.hidden = true;
        el.empty.style.display = '';
        renderList();
      }
    } else {
      renderList();
    }
    toast('Note deleted.');
  }

  $('#forget-cancel').addEventListener('click', closeForget);
  $('#forget-confirm').addEventListener('click', () => {
    const kind = $('#forget-scrim').dataset.kind;
    const extra = $('#forget-scrim').dataset.id;
    const id = pendingForget;
    closeForget();
    if (kind === 'pathway' && extra) {
      Pathways.remove(extra);
      if (window.PalinodePathways) PalinodePathways.refresh();
      if (window.PalinodePathways && PalinodePathways.isWalkOpen && PalinodePathways.isWalkOpen())
        PalinodePathways.closeWalk({ toList: true });
      renderComposer();
      toast('Pathway deleted.');
      return;
    }
    if (id) forgetNote(id);
  });
  $('#forget-scrim').addEventListener('click', e => {
    if (e.target === $('#forget-scrim')) closeForget();
  });

  el.list.addEventListener('click', e => {
    const forget = e.target.closest('[data-forget]');
    if (forget) {
      e.preventDefault();
      e.stopPropagation();
      askForget(forget.dataset.forget);
      return;
    }
    const item = e.target.closest('.note-item');
    if (item) openNote(item.dataset.id);
  });

  el.q.addEventListener('input', renderList);

  /* ================= editor ================= */

  function openNote(id) {
    const n = Notes.get(id);
    if (!n) return;
    closeProfile();
    activeId = id;
    openKey = null;
    cancelOffer();
    el.title.value = n.title;
    el.input.value = n.body;
    el.metaDate.textContent = fmtDate(n.created);
    el.room.hidden = true; el.room.innerHTML = '';
    el.editorWrap.hidden = false;
    el.empty.style.display = 'none';
    // The daily prompt card stays available at all times. The note's own
    // originating prompt is only re-shown when it is not today's prompt.
    const todays = Prompts.state().prompt.text;
    setBanner(n.promptText && n.promptText !== todays ? n.promptText : null);
    markWritingOnToday(!!n.promptText && n.promptText === todays);
    grow();
    Media.release();
    renderComposer();
    renderList();
    if (phone()) el.body.classList.remove('show-rail');
    syncNotePage();
    syncQuestSubmitBtn();
    run(true);
  }

  function setBanner(text) {
    let b = $('#prompt-banner');
    if (!text) { if (b) b.style.display = 'none'; return; }
    if (!b) {
      b = document.createElement('div');
      b.id = 'prompt-banner';
      b.className = 'shared-prompt';
      b.style.marginBottom = '22px';
      el.editorWrap.insertBefore(b, el.editorWrap.firstChild);
    }
    b.textContent = text;
    b.style.display = '';
  }

  // Marks the daily card when the open note is the one being written on it.
  function markWritingOnToday(on) {
    $('#prompt-kicker-text').textContent = on ? 'Today’s prompt · you are writing on this' : 'Today’s prompt';
    const write = $('#btn-write');
    write.textContent = on ? 'New note on this' : 'Write on this';
    el.promptCard.classList.toggle('engaged', on);
  }

  function closePathways() {
    if (!window.PalinodePathways) return;
    PalinodePathways.leave();
    paintFieldFromAnalysis();
    el.empty.hidden = false;
    if (activeId) {
      el.editorWrap.hidden = false;
      el.empty.style.display = 'none';
    } else {
      el.editorWrap.hidden = true;
      el.empty.style.display = '';
    }
  }

  function closeProfile() {
    if (!window.PalinodeProfile || !PalinodeProfile.isOpen()) return;
    PalinodeProfile.leave();
    paintFieldFromAnalysis();
    el.empty.hidden = false;
    if (activeId) {
      el.editorWrap.hidden = false;
      el.empty.style.display = 'none';
    } else {
      el.editorWrap.hidden = true;
      el.empty.style.display = '';
    }
  }

  function closeMarket() {
    if (!window.PalinodeMarketplace || !PalinodeMarketplace.isOpen()) return;
    PalinodeMarketplace.leave();
    paintFieldFromAnalysis();
    el.empty.hidden = false;
    if (activeId) {
      el.editorWrap.hidden = false;
      el.empty.style.display = 'none';
    } else {
      el.editorWrap.hidden = true;
      el.empty.style.display = '';
    }
  }

  function closeQuests() {
    if (!window.PalinodeQuests || !PalinodeQuests.isOpen()) return;
    PalinodeQuests.leave();
    paintFieldFromAnalysis();
    el.empty.hidden = false;
    if (activeId) {
      el.editorWrap.hidden = false;
      el.empty.style.display = 'none';
    } else {
      el.editorWrap.hidden = true;
      el.empty.style.display = '';
    }
  }

  function startAcceptedQuest(questId) {
    closeExplore();
    closePathways();
    closeProfile();
    closeMarket();
    el.body.classList.remove('show-insights', 'show-rail');
    if (window.PalinodeQuests) {
      PalinodeQuests.enter();
      PalinodeQuests.open(questId);
    }
    syncNav('quests');
    syncNotePage();
  }

  function writeFromQuest(opts) {
    closeExplore();
    closePathways();
    closeProfile();
    closeMarket();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    syncNav('write');
    const n = Notes.create({
      promptText: (opts && opts.prompt) || '',
      title: (opts && opts.title) || (opts && opts.prompt) || '',
      questId: (opts && opts.questId) || null,
      questStepId: (opts && opts.stepId) || null
    });
    openNote(n.id);
    renderList();
    if (el.title && n.title) el.title.value = n.title;
    if (el.input) el.input.focus();
    const label = (opts && opts.label) || 'this quest';
    toast('Writing for ' + label + '. Submit to quest when you are ready.');
  }

  function questSubmitTarget() {
    if (!activeId || !window.PalinodeQuests) return null;
    const n = Notes.get(activeId);
    if (!n || !n.questId || !n.questStepId) return null;
    const entry = PalinodeQuests.get(n.questId);
    if (!entry || entry.status !== 'active') return null;
    if (PalinodeQuests.isStepDone(n.questId, n.questStepId)) return null;
    return { questId: n.questId, stepId: n.questStepId };
  }

  function syncQuestSubmitBtn() {
    const btn = document.getElementById('btn-quest-submit');
    if (!btn) return;
    btn.hidden = !questSubmitTarget();
  }

  function submitActiveNoteToQuest() {
    const target = questSubmitTarget();
    if (!target || !activeId || !window.PalinodeQuests) return;
    persist();
    const ok = PalinodeQuests.submitStepNote(target.questId, target.stepId, activeId);
    if (!ok) return;
    Notes.update(activeId, { questId: null, questStepId: null });
    syncQuestSubmitBtn();
    startAcceptedQuest(target.questId);
  }

  function wireQuestsChrome() {
    if (!window.PalinodeQuests) return;
    PalinodeQuests.onChange = () => {
      if (PalinodeQuests.isOpen()) PalinodeQuests.renderLog();
      syncQuestSubmitBtn();
    };
    PalinodeQuests.onChrome = () => syncNotePage();
    PalinodeQuests.onStartQuest = startAcceptedQuest;
    PalinodeQuests.onWriteFromQuest = writeFromQuest;
    const submitBtn = document.getElementById('btn-quest-submit');
    if (submitBtn) submitBtn.addEventListener('click', submitActiveNoteToQuest);
  }

  function newNote() {
    closeExplore();
    closePathways();
    closeProfile();
    closeMarket();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    syncNav('write');
    const n = Notes.create({});
    openNote(n.id);
    el.title.focus();
  }
  $('#btn-new').addEventListener('click', newNote);
  $('#btn-new-list').addEventListener('click', newNote);
  $('#btn-new-2').addEventListener('click', newNote);

  function grow() {
    el.input.style.height = 'auto';
    el.input.style.height = Math.max(el.input.scrollHeight, window.innerHeight * 0.46) + 'px';
  }

  function persist() {
    if (!activeId) return;
    const cats = analysis ? [...new Set(analysis.insights.map(i => i.category))] : [];
    const conceptIds = analysis ? (analysis.concepts || []).map(c => c.id) : [];
    Notes.update(activeId, {
      title: el.title.value, body: el.input.value,
      concepts: cats, conceptIds
    });
  }

  function schedule() {
    grow();
    cancelOffer();
    if (activeId) touched[activeId] = true;
    el.pulse.classList.add('on');
    el.metaState.textContent = 'Reading';
    clearTimeout(timer);
    timer = setTimeout(() => run(false), 420);
  }

  el.input.addEventListener('input', schedule);
  el.title.addEventListener('input', () => { persist(); renderList(); syncNotePage(); });
  window.addEventListener('resize', grow);

  async function run(silent) {
    if (!activeId) return;
    const text = el.input.value;
    analysis = await window.PalinodeEngine.analyze(text);
    persist();
    if (!silent) renderList();
    paintMirror(text);
    renderScore();
    renderFilters();
    renderConstellation();
    shelf = LIB.shelf(visibleInsights());
    renderInsights();
    renderReadings();
    renderBeliefs();
    renderTabCounts();
    considerOffer();
    if (!window.PalinodePathways || !PalinodePathways.isListOpen())
      paintFieldFromAnalysis();
    el.metaWords.textContent = analysis.stats.words + (analysis.stats.words === 1 ? ' word' : ' words');
    el.pulse.classList.remove('on');
    el.metaState.textContent = analysis.insights.length
      ? analysis.insights.length + ' reading' + (analysis.insights.length === 1 ? '' : 's')
      : 'Nothing yet';
  }

  /* ---------- inline underlines ---------- */

  function paintMirror(text) {
    const hidden = Prefs.dismissed(activeId);
    const filters = Prefs.filters();
    const spans = analysis.insights
      .filter(i => i.span && filters[i.category] && !hidden.includes(i.key))
      .sort((a, b) => a.span.start - b.span.start);

    let out = '', cur = 0;
    for (const i of spans) {
      if (i.span.start < cur) continue;
      out += esc(text.slice(cur, i.span.start));
      out += `<mark class="cat-${i.category}" data-key="${esc(i.key)}">${esc(text.slice(i.span.start, i.span.end))}</mark>`;
      cur = i.span.end;
    }
    out += esc(text.slice(cur));
    el.mirror.innerHTML = out + '\n';
  }

  /* ---------- score ---------- */

  const METRIC_LABELS = {
    inquiry:'Inquiry', grounding:'Grounding', reflexivity:'Reflexive',
    range:'Range', dialectic:'Dialectic'
  };

  /* How each bar is made — the formula in Palinode's voice, so a hover
     can say what the number is counting rather than only that it exists. */
  const METRIC_HOW = {
    inquiry: 'Question marks, relative to how much you have written. Asking raises this; a passage that only asserts stays low.',
    grounding: 'Reasons, instances, and times — because, for example, yesterday, according to. Writing that points at something outside the claim.',
    reflexivity: 'Turns back on the writer: I wonder, I notice, I might be wrong, part of me. The writing looking at itself.',
    range: 'How many philosophical concepts this passage has already walked into, and how many traditions they come from.',
    dialectic: 'Counterpoints — but, however, although — brought down when logical tensions sit unresolved.'
  };

  function renderScore() {
    const m = analysis.metrics;
    const C = 2 * Math.PI * 26;
    el.ringArc.style.strokeDashoffset = String(C - (C * m.overall) / 100);
    el.ringVal.textContent = m.thin ? '—' : m.overall;
    el.bars.innerHTML = Object.keys(METRIC_LABELS).map(k =>
      `<div class="bar-row" data-metric="${k}"
            aria-label="${esc(METRIC_LABELS[k])}. ${esc(METRIC_HOW[k])}">
        <span>${METRIC_LABELS[k]}</span>
        <div class="bar"><i style="width:${m[k]}%"></i></div></div>`).join('');
  }

  /* ---------- filters ---------- */

  function renderFilters() {
    const f = Prefs.filters();
    const counts = {};
    analysis.insights.forEach(i => counts[i.category] = (counts[i.category] || 0) + 1);
    el.filters.innerHTML = Object.values(CATS).map(c =>
      `<button class="chip ${f[c.id] ? '' : 'off'}" data-cat="${c.id}"
               aria-label="${esc(c.label)}. ${esc(c.blurb)}">
        ${orb(c.id, 'sm')}${c.label}<span class="n">${counts[c.id] || 0}</span>
      </button>`).join('');
  }

  el.filters.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    Prefs.toggleFilter(chip.dataset.cat);
    refreshPanels();
  });

  /* ---------- hover explanations on the reading head ----------
     Native title attributes wait too long to appear, and the Reading
     rail clips overflow, so the tip is a fixed card next to whatever
     is under the pointer. */

  let readTip = null;

  function ensureReadTip() {
    if (readTip) return readTip;
    readTip = document.createElement('div');
    readTip.className = 'read-tip';
    readTip.setAttribute('role', 'tooltip');
    // Position in JS as well as CSS: the Reading rail clips overflow, and
    // a stale stylesheet would leave a full-width block at the bottom.
    readTip.style.position = 'fixed';
    readTip.style.zIndex = '80';
    readTip.style.width = '248px';
    readTip.style.maxWidth = 'calc(100vw - 20px)';
    readTip.style.pointerEvents = 'none';
    document.body.appendChild(readTip);
    return readTip;
  }

  function hideReadTip() {
    if (readTip) readTip.classList.remove('on');
  }

  function showReadTip(anchor, kicker, line) {
    const tip = ensureReadTip();
    tip.innerHTML = `<div class="read-tip-k">${esc(kicker)}</div><p>${esc(line)}</p>`;
    tip.classList.add('on');
    const r = anchor.getBoundingClientRect();
    const tw = tip.offsetWidth || 260;
    const th = tip.offsetHeight || 80;
    let left = r.left - tw - 12;
    if (left < 10) left = Math.min(window.innerWidth - tw - 10, r.right + 12);
    let top = r.top + (r.height - th) / 2;
    top = Math.max(10, Math.min(top, window.innerHeight - th - 10));
    tip.style.left = Math.round(left) + 'px';
    tip.style.top = Math.round(top) + 'px';
  }

  el.bars.addEventListener('pointerover', e => {
    const row = e.target.closest('.bar-row');
    if (!row || !el.bars.contains(row)) return;
    const k = row.dataset.metric;
    const how = METRIC_HOW[k];
    if (!how) return;
    const thin = analysis && analysis.metrics && analysis.metrics.thin;
    showReadTip(row, METRIC_LABELS[k], thin
      ? how + ' Nothing registers until the note has a paragraph or so.'
      : how);
  });
  el.bars.addEventListener('pointerout', e => {
    const row = e.target.closest('.bar-row');
    if (!row) return;
    if (e.relatedTarget && row.contains(e.relatedTarget)) return;
    hideReadTip();
  });

  el.filters.addEventListener('pointerover', e => {
    const chip = e.target.closest('.chip');
    if (!chip || !el.filters.contains(chip)) return;
    const cat = CATS[chip.dataset.cat];
    if (!cat) return;
    showReadTip(chip, cat.label,
      cat.blurb + ' The number is how many Khora found in this note.');
  });
  el.filters.addEventListener('pointerout', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    if (e.relatedTarget && chip.contains(e.relatedTarget)) return;
    hideReadTip();
  });

  /* ---------- constellation ---------- */

  function renderConstellation() {
    const nodes = analysis.concepts.slice(0, 7);
    if (!nodes.length) {
      el.constel.innerHTML = `<div style="position:absolute;inset:0;display:grid;place-items:center;
        color:var(--ink-4);font-size:11px;letter-spacing:.14em;text-transform:uppercase">No constellation yet</div>`;
      return;
    }
    // deterministic golden-angle placement, so the map is stable between keystrokes
    const pts = nodes.map((n, i) => {
      const a = i * 2.399963;
      const r = 0.20 + 0.30 * Math.sqrt((i + 0.6) / nodes.length);
      const cl = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
      return { ...n,
        x: cl(50 + Math.cos(a) * r * 78, 17, 83),
        y: cl(50 + Math.sin(a) * r * 70, 15, 85) };
    });
    const lines = [];
    pts.forEach((p, i) => {
      (p.kin || []).forEach(k => {
        const t = pts.findIndex(x => x.id === k);
        if (t > i) lines.push(`<line x1="${p.x}%" y1="${p.y}%" x2="${pts[t].x}%" y2="${pts[t].y}%"
          stroke="rgba(255,255,255,.16)" stroke-width="1"/>`);
      });
      if (i > 0) lines.push(`<line x1="${pts[0].x}%" y1="${pts[0].y}%" x2="${p.x}%" y2="${p.y}%"
        stroke="rgba(255,255,255,.07)" stroke-width="1"/>`);
    });
    el.constel.innerHTML =
      `<svg>${lines.join('')}</svg>` +
      pts.map((p, i) => `<div class="node" style="left:${p.x}%;top:${p.y}%;animation-delay:${i * 55}ms">
          ${orb(p.category, 'sm')}${esc(p.label)}</div>`).join('');
  }

  /* ---------- insight cards ---------- */

  // Emphasise the phrase that triggered the card, so cards quoting the
  // same sentence still read differently from one another.
  function markMatch(i) {
    const q = esc(i.excerpt);
    if (!i.matched) return q;
    const m = esc(i.matched).trim();
    if (!m || m.length > 90) return q;
    const at = q.toLowerCase().indexOf(m.toLowerCase());
    if (at < 0) return q;
    return q.slice(0, at) + '<em>' + q.slice(at, at + m.length) + '</em>' + q.slice(at + m.length);
  }

  function visibleInsights() {
    const f = Prefs.filters();
    const hidden = Prefs.dismissed(activeId);
    return analysis.insights.filter(i => f[i.category] && !hidden.includes(i.key));
  }

  // Filters and dismissals change what the note recommends, not just
  // which cards show — so the shelf is rebuilt alongside them.
  function refreshPanels() {
    shelf = LIB.shelf(visibleInsights());
    renderInsights();
    renderReadings();
    renderFilters();
    renderTabCounts();
    paintMirror(el.input.value);
  }

  function renderTabCounts() {
    const n = {
      insights: visibleInsights().length,
      readings: shelf.length,
      // Spectra this note touched, not the whole instrument — the tab
      // counts what is live, the way the other two do.
      beliefs: (analysis && analysis.leans ? analysis.leans.length : 0)
    };
    $('#n-insights').textContent = n.insights || '';
    $('#n-readings').textContent = n.readings || '';
    $('#n-beliefs').textContent  = n.beliefs || '';
    // The picker replaces the segments on narrow screens, so it has to
    // carry the counts too.
    $$('#seg-select option').forEach(o => {
      const base = o.value[0].toUpperCase() + o.value.slice(1);
      o.textContent = n[o.value] ? base + ' · ' + n[o.value] : base;
    });
  }

  function renderInsights() {
    const list = visibleInsights();
    const hidden = Prefs.dismissed(activeId);

    if (!list.length) {
      const anyHidden = hidden.length > 0;
      el.insList.innerHTML = `<div style="padding:26px 6px;color:var(--ink-4);font-size:12px;line-height:1.7">
        ${analysis.stats.words < 12
          ? 'Keep writing. Khora needs a paragraph or so before it has anything honest to say.'
          : 'Nothing surfaced under the current filters.'}
        ${anyHidden ? '<br><button class="micro" id="btn-restore" style="padding-left:0;margin-top:10px">Restore dismissed</button>' : ''}
      </div>`;
      const r = $('#btn-restore');
      if (r) r.addEventListener('click', () => { Prefs.undismissAll(activeId); run(true); });
      return;
    }

    el.insList.innerHTML = list.map(i => {
      const open = i.key === openKey;
      return `<article class="insight ${open ? 'open' : ''}" data-key="${esc(i.key)}" style="--c:var(--${i.category})">
        <div class="ihead">
          ${orb(i.category)}
          <div class="ititle">
            <h4>${esc(i.label)}</h4>
            <div class="lineage-tag">${esc(i.tradition)}${i.count > 1 ? ' · ' + i.count + ' instances' : ''}</div>
          </div>
        </div>
        ${i.excerpt ? `<p class="quote">${markMatch(i)}</p>` : ''}
        <div class="ibody">
          <p class="reading">${esc(i.reading)}</p>
          <div class="turn"><span class="lab">Turn it back</span><p>${esc(i.turn)}</p></div>
          ${i.sources && i.sources.length ? `<div class="src-lab">Read against</div>` +
            i.sources.map(s => {
              const w = LIB.resolve(s);
              return `<div class="src">
                <button class="read-link" data-work="${esc(w.id)}">Read</button>
                <div class="w">${esc(s.work)}</div>
                <div class="a">${esc(s.author)}</div>
                ${s.note ? `<div class="n">${esc(s.note)}</div>` : ''}
              </div>`;
            }).join('') : ''}
          ${i.kin && i.kin.length ? `<div class="kin">${i.kin.map(k =>
            `<span class="kin-chip">${orb(k.category, 'sm')}${esc(k.label)}</span>`).join('')}</div>` : ''}
          <div class="iactions">
            <button class="ghost" data-act="dismiss">Dismiss</button>
            ${i.span ? `<button class="ghost" data-act="locate">Find in text</button>` : ''}
          </div>
        </div>
      </article>`;
    }).join('');
  }

  el.insList.addEventListener('click', e => {
    const rl = e.target.closest('.read-link');
    if (rl) { e.stopPropagation(); openWork(rl.dataset.work); return; }
    const card = e.target.closest('.insight');
    if (!card) return;
    const key = card.dataset.key;
    const act = e.target.closest('[data-act]')?.dataset.act;

    if (act === 'dismiss') {
      Prefs.dismiss(activeId, key);
      if (openKey === key) openKey = null;
      refreshPanels();
      toast('Dismissed for this note.');
      return;
    }
    if (act === 'locate') { locate(key); return; }

    openKey = openKey === key ? null : key;
    renderInsights();
    highlight(openKey);
  });

  function highlight(key) {
    $$('#mirror mark').forEach(m => m.classList.toggle('focused', key && m.dataset.key === key));
  }

  function locate(key) {
    const ins = analysis.insights.find(i => i.key === key);
    if (!ins || !ins.span) return;
    el.input.focus();
    el.input.setSelectionRange(ins.span.start, ins.span.end);
    const ratio = ins.span.start / Math.max(1, el.input.value.length);
    const top = el.input.getBoundingClientRect().top + window.scrollY;
    document.querySelector('.centre').scrollTo({
      top: Math.max(0, top + el.input.offsetHeight * ratio - window.innerHeight * 0.4),
      behavior: 'smooth'
    });
    highlight(key);
  }

  /* ================= readings ================= */

  const rightsPill = w => w.rights === 'open'
    ? '<span class="rights open"><i></i>Full text free</span>'
    : '<span class="rights restricted"><i></i>In copyright</span>';

  function renderReadings() {
    if (!shelf.length) {
      el.readList.innerHTML = `<div style="padding:26px 6px;color:var(--ink-4);font-size:12px;line-height:1.7">
        ${analysis.stats.words < 12
          ? 'Nothing to recommend yet. Khora needs a paragraph before it can point anywhere.'
          : 'No readings under the current filters.'}</div>`;
      return;
    }
    el.readList.innerHTML = shelf.map(w => `
      <article class="work" data-work="${esc(w.id)}">
        <h4>${esc(w.title)}</h4>
        <div class="byline">${esc(w.author)}${w.year ? ' · ' + esc(w.year) : ''}${
          w.sections.length ? ' · ' + esc(w.sections.join(', ')) : ''}</div>
        <div class="why">${w.raisedBy.slice(0, 3).map(r =>
          `<span class="why-chip">${orb(r.category, 'sm')}${esc(r.label)}</span>`).join('')}
          ${w.raisedBy.length > 3 ? `<span class="why-chip">+${w.raisedBy.length - 3}</span>` : ''}</div>
        <div class="foot">${rightsPill(w)}<span class="go">Read →</span></div>
      </article>`).join('');
  }

  el.readList.addEventListener('click', e => {
    const w = e.target.closest('.work');
    if (w) openWork(w.dataset.work);
  });

  /* ================= belief spectra =================
     Two readings sit side by side here and must stay distinguishable:
     a dashed tick for what THIS passage leans toward, and a filled
     tick for where answered items have placed the journal. Prose never
     moves the filled one. */

  const TENTATIVE_SHOWN = 6;

  // One renderer for the continuum, shared with the graph panel and the
  // profile, so the dashed and solid marks cannot drift apart.
  const specTrack = (axis, opts) => SPECUI.track(axis, opts);
  const specPoles = (axis, side) => SPECUI.poles(axis, side);

  // Named company for a position: "near Spinoza, away from Sartre".
  function company(axisId, at) {
    const near = BEL.argumentsNear(axisId, at, 2);
    const away = BEL.opposing(axisId, at);
    const bits = [];
    if (near.length) bits.push('near ' + near.map(a => esc(a.name)).join(' and '));
    if (away) bits.push('away from ' + esc(away.name));
    return bits.join(', ');
  }

  function tentativeCard(lean, placed) {
    const axis = BEL.spectrum(lean.axisId);
    if (!axis) return '';
    const side = lean.split ? 0 : Math.sign(lean.delta);
    const against = BEL.opposing(lean.axisId, lean.delta);
    const answered = Belief.answeredCount(lean.axisId);
    const items = BEL.itemsFor(lean.axisId).length;

    const line = lean.split
      ? `This passage pulls <em>both ways</em> on this spectrum — ${lean.n} readings disagreeing with each other. That is the interesting kind of unresolved.`
      : `Tentatively, this passage sits toward <b>${esc(side < 0 ? axis.left : axis.right)}</b>${
          company(lean.axisId, lean.delta) ? ' — ' + company(lean.axisId, lean.delta) : ''}. ${esc(lean.note || '')}`;

    return `<article class="spec ${placed ? 'placed' : ''}" data-axis="${esc(axis.id)}">
      <div class="spec-head">
        <div style="flex:1;min-width:0">
          <h4>${esc(axis.title)}</h4>
          <div class="spec-branch">${esc(axis.branch)}${
            lean.from.length ? ' · from ' + esc(lean.from[0].label) : ''}</div>
        </div>
        <span class="spec-state ${placed ? 'on' : 'tentative'}">${
          placed ? 'Placed' : 'Tentative'}</span>
      </div>
      ${specTrack(axis, {
        tentative: lean.delta,
        placed: placed ? placed.score : null,
        placedN: placed ? placed.n : 0
      })}
      ${specPoles(axis, side)}
      <p class="spec-line">${line}</p>
      ${lean.excerpt ? `<p class="spec-quote">${esc(lean.excerpt)}</p>` : ''}
      ${against ? `<div class="spec-against">
        <span class="lab">Read against</span>
        <div class="who">${esc(against.name)}</div>
        <p>${esc(against.capsule)}</p>
      </div>` : ''}
      <div class="spec-actions">
        <span class="n">${placed
          ? (placed.n > 1 ? BSCORE.label(placed.leaning) + ' · ' : '') + answered + ' of ' + items + ' answered'
          : 'Nothing answered here yet'}</span>
        <button class="ghost ${placed ? '' : 'solid'}" data-act="place">${
          placed ? 'Answer another' : 'Place yourself'}</button>
      </div>
    </article>`;
  }

  function placedCard(entry) {
    const axis = BEL.spectrum(entry.axisId);
    if (!axis) return '';
    const side = entry.leaning === 'balanced' ? 0 : Math.sign(entry.score);
    const answered = Belief.answeredCount(entry.axisId);
    const items = BEL.itemsFor(entry.axisId).length;
    return `<article class="spec placed" data-axis="${esc(axis.id)}">
      <div class="spec-head">
        <div style="flex:1;min-width:0">
          <h4>${esc(axis.title)}</h4>
          <div class="spec-branch">${esc(axis.branch)}</div>
        </div>
        <span class="spec-state on">${esc(BSCORE.label(entry.leaning))}</span>
      </div>
      ${specTrack(axis, { placed: entry.score, placedN: entry.n })}
      ${specPoles(axis, side)}
      <p class="spec-line">${esc(BSCORE.describe(entry.axisId, entry))} <em>From ${
        entry.n} answer${entry.n === 1 ? '' : 's'}.</em></p>
      <div class="spec-actions">
        <span class="n">${answered} of ${items} answered</span>
        <button class="ghost" data-act="place">Answer another</button>
      </div>
    </article>`;
  }

  function renderBeliefs() {
    const scores = Belief.scores();
    const cov = Belief.coverage();
    const leans = (analysis && analysis.leans ? analysis.leans : []).slice(0, TENTATIVE_SHOWN);
    const shownAxes = leans.map(l => l.axisId);

    const journal = Object.values(scores)
      .filter(s => shownAxes.indexOf(s.axisId) < 0)
      .sort((a, b) => b.confidence - a.confidence);

    const head = `<div class="bel-cov">
      <b>${cov.placed}</b><span>of ${cov.total} spectra placed in this journal</span>
    </div>`;

    let out = head;

    if (leans.length) {
      out += `<div class="bel-sec">This note</div>` +
        leans.map(l => tentativeCard(l, scores[l.axisId] || null)).join('');
    } else {
      out += `<div style="padding:22px 6px;color:var(--ink-4);font-size:12px;line-height:1.7">
        ${!analysis || analysis.stats.words < 12
          ? 'Keep writing. Spectra surface from the same triggers Khora uses, so it needs a paragraph first.'
          : 'This note has not come near any of the twenty-seven spectra yet. That is a fact about the passage, not a gap to fill.'}
      </div>`;
    }

    if (journal.length) {
      out += `<div class="bel-sec">Journal</div>` + journal.map(placedCard).join('');
    }

    el.belList.innerHTML = out;
  }

  el.belList.addEventListener('click', e => {
    const card = e.target.closest('.spec');
    if (!card) return;
    if (e.target.closest('[data-act="place"]')) openPlace(card.dataset.axis, 'beliefs');
  });

  /* ---------- the place-yourself overlay ----------
     One authored item at a time. Answering recomputes the profile and
     shows the result plus the challenge from the pole you moved away
     from; the note underneath is left exactly where it was. */

  let placeAxis = null;
  let placeItem = null;
  let placeSource = 'beliefs';

  function openPlace(axisId, source) {
    const axis = BEL.spectrum(axisId);
    if (!axis) return;
    const item = Belief.nextItem(axisId);
    if (!item) {
      toast('You have answered every item on ' + axis.title + '.');
      return;
    }
    placeAxis = axisId;
    placeItem = item;
    placeSource = source || 'beliefs';
    // However you got here, the app has now asked its one question for this
    // note. Anything further has to be your idea.
    if (activeId) offered[activeId] = true;
    cancelOffer();
    renderPlaceQuestion();
    el.placeScrim.classList.add('on');
  }

  function renderPlaceQuestion() {
    const axis = BEL.spectrum(placeAxis);
    const problem = BEL.problem(placeItem.problem);
    el.placeModal.innerHTML = `
      <div class="place-kicker">
        <b>${esc(axis.title)}</b>
        <span>${esc(axis.branch)}</span>
        ${problem ? `<span style="margin-left:auto">${esc(problem.title)}</span>` : ''}
      </div>
      <p class="place-q">${esc(placeItem.prompt)}</p>
      <div class="place-opts">
        ${placeItem.options.map(o =>
          `<button class="place-opt" data-opt="${esc(o.id)}">${esc(o.label)}</button>`).join('')}
      </div>
      <p class="lede" style="margin:0 0 16px">Your answer is what moves this spectrum. Nothing you write is scored — Khora can only say a passage leans.</p>
      <div class="modal-actions">
        <button class="ghost" data-act="skip">Not this one</button>
        <button class="ghost" data-act="close">Close</button>
      </div>`;
  }

  function renderPlaceResult(entry) {
    const axis = BEL.spectrum(placeAxis);
    const against = BEL.opposing(placeAxis, entry ? entry.score : 0);
    const near = BEL.argumentsNear(placeAxis, entry ? entry.score : 0, 1)[0];
    const more = Belief.nextItem(placeAxis);

    el.placeModal.innerHTML = `
      <div class="place-kicker"><b>${esc(axis.title)}</b><span>${esc(axis.branch)}</span></div>
      <div class="place-result">
        <div class="spec" style="cursor:default;margin-bottom:16px">
          ${specTrack(axis, { placed: entry.score, placedN: entry.n })}
          ${specPoles(axis, entry.leaning === 'balanced' ? 0 : Math.sign(entry.score))}
          <p class="verdict" style="margin:6px 0 0">${esc(BSCORE.describe(placeAxis, entry))}</p>
          <p class="sub" style="margin:6px 0 0">${esc(BSCORE.basis(entry))}${
            near ? ' Nearest named position: ' + esc(near.name) + '.' : ''}</p>
        </div>
        ${against ? `<div class="spec-against" style="margin-bottom:18px">
          <span class="lab">The pole you moved away from</span>
          <div class="who">${esc(against.name)}</div>
          <p>${esc(against.challenge || against.capsule)}</p>
        </div>` : ''}
      </div>
      <div class="modal-actions">
        ${more ? `<button class="ghost" data-act="again">Another item</button>` : ''}
        <button class="ghost solid" data-act="close">Back to the note</button>
      </div>`;
  }

  el.placeModal.addEventListener('click', e => {
    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const entry = Belief.answer(placeItem.id, opt.dataset.opt, placeSource);
      renderBeliefs();
      renderTabCounts();
      if (window.PalinodeGraph && window.PalinodeGraph.refreshBeliefs) {
        window.PalinodeGraph.refreshBeliefs();
      }
      if (window.PalinodePathways && PalinodePathways.refreshWalk)
        PalinodePathways.refreshWalk();
      if (window.PalinodeProfile && PalinodeProfile.isOpen())
        PalinodeProfile.render();
      if (entry) renderPlaceResult(entry);
      else closePlace();
      return;
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'skip') {
      Belief.dismissItem(placeItem.id);
      const next = Belief.nextItem(placeAxis);
      if (next) { placeItem = next; renderPlaceQuestion(); }
      else { toast('Nothing else to ask on that spectrum.'); closePlace(); }
      return;
    }
    if (act === 'again') { openPlace(placeAxis, placeSource); return; }
    if (act === 'close') closePlace();
  });

  el.placeScrim.addEventListener('click', e => {
    if (e.target === el.placeScrim) closePlace();
  });

  function closePlace() {
    el.placeScrim.classList.remove('on');
    el.placeModal.innerHTML = '';
    placeAxis = null;
    placeItem = null;
  }

  window.addEventListener('keydown', e => {
    if (e.key === 'Escape' && el.placeScrim.classList.contains('on')) closePlace();
  });

  /* ---------- one invitation per note session ----------
     Khora's Explore restraint: the journal may offer to place you once,
     after the note has some substance and only once you have stopped
     typing. It never interrupts a sentence and never asks twice. */

  const OFFER_WORDS = 60;
  const OFFER_IDLE  = 7000;
  let offered = {};
  let touched = {};
  let offerTimer = null;

  function cancelOffer() { clearTimeout(offerTimer); offerTimer = null; }

  const exploring = () => !!(window.PalinodeGraph && window.PalinodeGraph.isOpen());
  const phone = () => window.innerWidth <= 900;

  function closeExplore() {
    if (exploring()) window.PalinodeGraph.close();
  }

  function syncNav(which) {
    $$('.nav-item').forEach(b => b.classList.remove('on'));
    const id = which === 'insights' ? 'btn-nav-insights'
             : which === 'explore' ? 'btn-explore'
             : which === 'market' ? 'btn-market'
             : which === 'pathways' ? 'btn-pathways'
             : which === 'quests' ? 'btn-quests'
             : which === 'profile' ? 'btn-profile'
             : 'btn-rail';
    const btn = document.getElementById(id);
    if (btn) btn.classList.add('on');
    syncNotePage();

    const tourId = which === 'insights' ? null
                 : which === 'explore' ? 'explore'
                 : which === 'market' ? 'market'
                 : which === 'pathways' ? 'pathways'
                 : which === 'quests' ? 'quests'
                 : which === 'profile' ? 'profile'
                 : which === 'write' ? 'write'
                 : null;
    // Default rail click without an explicit which maps to write via btn-rail.
    const resolved = tourId || (id === 'btn-rail' ? 'write' : null);
    if (resolved && window.PalinodeOnboarding) {
      requestAnimationFrame(() => PalinodeOnboarding.maybeStart(resolved));
    }
  }

  function setFabOpen(open) {
    if (!phone()) open = false;
    document.documentElement.classList.toggle('fab-open', !!open);
    const toggle = document.getElementById('nav-fab-toggle');
    const scrim = document.getElementById('nav-fab-scrim');
    if (toggle) {
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    }
    if (scrim) scrim.hidden = !open;
  }

  function closeFab() { setFabOpen(false); }

  function phoneTab() {
    if (exploring()) return 'explore';
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) return 'market';
    if (window.PalinodeQuests && PalinodeQuests.isOpen()) return 'quests';
    if (window.PalinodeProfile && PalinodeProfile.isOpen()) return 'profile';
    if (window.PalinodePathways && (PalinodePathways.isListOpen() || PalinodePathways.isWalkOpen()))
      return 'pathways';
    if (el.body.classList.contains('show-insights')) return 'insights';
    return 'write';
  }

  function notePageLabel() {
    const typed = (el.title && el.title.value || '').trim();
    if (typed) return typed;
    if (!activeId) return 'Note';
    const n = Notes.get(activeId);
    return ((n && n.title) || '').trim() || 'Untitled';
  }

  function syncNotePage() {
    const back = document.getElementById('note-back');
    const label = document.getElementById('note-back-label');
    const onWrite = phone() && phoneTab() === 'write';
    const onNote = !!(onWrite && !el.body.classList.contains('show-rail') && el.editorWrap && !el.editorWrap.hidden);
    if (label) label.textContent = notePageLabel();
    if (back) back.hidden = !onNote;
    if (!phone()) el.body.classList.remove('show-rail');
    syncQuestSubmitBtn();
    syncPathPage();
    syncQuestPage();
  }

  function pathPageLabel() {
    const typed = (($('#walk-title') || {}).value || '').trim();
    if (typed) return typed;
    return 'Untitled pathway';
  }

  function syncPathPage() {
    const back = document.getElementById('path-back');
    const label = document.getElementById('path-back-label');
    const wrap = document.getElementById('pathway-wrap');
    const onPath = phone() && phoneTab() === 'pathways';
    const onWalk = !!(onPath && !el.body.classList.contains('show-rail') && wrap && !wrap.hidden);
    if (label) label.textContent = pathPageLabel();
    if (back) back.hidden = !onWalk;
  }

  function questPageLabel() {
    if (!window.PalinodeQuests) return 'Quest';
    const id = PalinodeQuests.selected && PalinodeQuests.selected();
    if (!id) return 'Quest';
    const q = window.PalinodeMarketData && PalinodeMarketData.questOf(id);
    return ((q && q.title) || '').trim() || 'Quest';
  }

  function syncQuestPage() {
    const back = document.getElementById('quest-back');
    const label = document.getElementById('quest-back-label');
    const wrap = document.getElementById('quests-wrap');
    const onQuests = phone() && phoneTab() === 'quests';
    const onDetail = !!(onQuests && !el.body.classList.contains('show-rail') && wrap && !wrap.hidden);
    if (label) label.textContent = questPageLabel();
    if (back) back.hidden = !onDetail;
  }

  function syncKeyboardNav() {
    if (!phone()) {
      document.documentElement.classList.remove('nav-hidden');
      closeFab();
      return;
    }
    const vv = window.visualViewport;
    const kbUp = !!(vv && (window.innerHeight - vv.height > 80));
    document.documentElement.classList.toggle('nav-hidden', kbUp);
    if (kbUp) closeFab();
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', syncKeyboardNav);
    window.visualViewport.addEventListener('scroll', syncKeyboardNav);
  }

  function considerOffer() {
    cancelOffer();
    if (!activeId || !analysis || offered[activeId]) return;
    // The invitation follows your writing. Merely opening an old note is
    // not an invitation to be asked anything.
    if (!touched[activeId]) return;
    if (analysis.stats.words < OFFER_WORDS) return;
    if (el.placeScrim.classList.contains('on')) return;
    if (exploring()) return;

    const hot = (analysis.leans || []).find(l =>
      l.heat >= 0.45 && Belief.nextItem(l.axisId));
    if (!hot) return;

    offerTimer = setTimeout(() => {
      // Conditions can lapse while we wait — re-check rather than assume.
      if (!activeId || offered[activeId] || el.placeScrim.classList.contains('on')) return;
      // The graph has its own Place yourself on every spectrum world; an
      // overlay arriving unasked in the middle of exploring is an ambush.
      if (exploring()) return;
      if (document.activeElement === el.input && el.input.selectionStart !== el.input.value.length) return;
      offered[activeId] = true;
      openPlace(hot.axisId, 'note');
    }, OFFER_IDLE);
  }

  /* ---------- reading room ---------- */

  function findWork(id) {
    const bare = String(id).replace(/^w:/, '');
    const inShelf = shelf.find(x => x.id === bare);
    if (inShelf) return inShelf;
    const w = LIB.works[bare];
    if (w) return Object.assign({}, w, { raisedBy: [], sections: [] });
    if (Khora && Khora.getWork(bare)) {
      return Object.assign({ raisedBy: [], sections: [] }, Khora.getWork(bare));
    }
    return null;
  }

  function mergeWork(live, local) {
    if (!live) return local;
    if (!local) return Object.assign({ raisedBy: [], sections: [] }, live);
    return Object.assign({}, local, {
      id: live.id || local.id,
      title: live.title || local.title,
      author: live.author || local.author,
      gist: live.gist || local.gist,
      short_summary: live.short_summary || local.short_summary,
      url: live.url || local.url,
      citations: live.citations || local.citations || [],
      live: true,
      raisedBy: local.raisedBy || [],
      sections: local.sections || []
    });
  }

  function workLinks(w) {
    if (w.url) {
      const extra = LIB.links(w).filter(l => l.href !== w.url);
      return [{ label: 'Source', href: w.url, primary: true }].concat(extra);
    }
    return LIB.links(w);
  }

  function citeLine(c) {
    if (!c || typeof c === 'string') return String(c || '');
    return c.title || c.work || c.text || c.citation || c.url || JSON.stringify(c);
  }

  function paintRoom(w) {
    el.editorWrap.hidden = true;
    el.empty.style.display = 'none';
    const banner = $('#prompt-banner'); if (banner) banner.style.display = 'none';
    el.room.hidden = false;

    const links = workLinks(w);
    const raised = w.raisedBy || [];
    const sections = w.sections || [];
    const cites = w.citations || [];
    const rights = w.rights === 'open' || w.rights === 'restricted' ? rightsPill(w)
      : (w.url ? '<span class="rights open"><i></i>Source</span>' : '');

    el.room.innerHTML = `
      <button class="rr-back" id="rr-back">← Back to the note</button>

      <div class="rr-kicker">
        ${rights}
        ${w.tradition ? `<span>${esc(window.PalinodeCorpus.TRADITIONS[w.tradition] || w.tradition)}</span>` : ''}
        ${w.year ? `<span>${esc(w.year)}</span>` : ''}
      </div>

      <h1 class="rr-title">${esc(w.title)}</h1>
      <p class="rr-author">${esc(w.author || '')}</p>
      ${sections.length ? `<p class="rr-sections">Your writing points to <b>${esc(sections.join(', '))}</b></p>` : '<div style="height:22px"></div>'}

      ${w.gist ? `<div class="rr-sec"><h3>What it argues</h3><p>${esc(w.gist)}</p></div>` : ''}
      ${w.start ? `<div class="rr-sec"><h3>Where to start</h3><p class="muted">${esc(w.start)}</p></div>` : ''}
      ${w.counter ? `<div class="rr-sec"><h3>Read against</h3><p class="muted">${esc(w.counter)}</p></div>` : ''}

      ${raised.length ? `<div class="rr-sec">
        <h3>Why your note raised this</h3>
        <div class="rr-raised">
          ${raised.map(r => `
            <div class="r" data-key="${esc(r.key)}">
              ${orb(r.category)}
              <div><h5>${esc(r.label)}</h5>${r.note ? `<p>${esc(r.note)}</p>` : ''}</div>
            </div>`).join('')}
        </div>
      </div>` : `<div class="rr-sec">
        <h3>How you got here</h3>
        <p class="muted">You reached this by exploring rather than by writing — nothing in the current note raised it.</p>
      </div>`}

      ${cites.length ? `<div class="rr-sec">
        <h3>Citations</h3>
        <div class="rr-raised">
          ${cites.map(c => `<div class="r"><div><h5>${esc(citeLine(c))}</h5>${c.author ? `<p>${esc(c.author)}</p>` : ''}</div></div>`).join('')}
        </div>
      </div>` : ''}

      <div class="rr-sec">
        <h3>${w.url ? 'Source' : (w.rights === 'open' ? 'Read the full text' : 'Where to find it')}</h3>
        <div class="rr-links">
          ${links.map(l => `<a href="${l.href}" target="_blank" rel="noopener"
             class="${l.primary ? 'primary' : ''}">${esc(l.label)}</a>`).join('')}
        </div>
        <p class="rr-note">${w.live && w.gist
          ? 'Summary from Khora. Local reading notes appear only when this title is also in Palinode’s library.'
          : (w.rights === 'open'
            ? 'This work is out of copyright, so the complete text is freely available. Everything above is Palinode’s own account of it, not the text itself.'
            : 'This work is still in copyright, so Palinode carries the argument and the reading path but never the text. The links go to library and reference copies.')}</p>
      </div>`;

    $('#rr-back').addEventListener('click', closeRoom);
    el.room.querySelectorAll('.rr-raised .r').forEach(r =>
      r.addEventListener('click', () => {
        if (!r.dataset.key) return;
        closeRoom();
        setTab('insights');
        openKey = r.dataset.key;
        renderInsights();
        const card = el.insList.querySelector('.insight.open');
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        highlight(openKey);
      }));

    document.querySelector('.centre').scrollTo({ top: 0, behavior: 'auto' });
  }

  async function openWork(id) {
    const bare = String(id).replace(/^w:/, '');
    let w = findWork(bare);

    if (Khora && Khora.isUuid(bare)) {
      if (w) paintRoom(w);
      try {
        const live = await Khora.loadWork(bare);
        w = mergeWork(live, w);
      } catch (e) {
        if (!w) { toast('Could not open that work.'); return; }
      }
      if (!w) { toast('That work is not in the library.'); return; }
      paintRoom(w);
      return;
    }

    if (!w && Khora) {
      try {
        const hit = await Khora.resolveByTitle(bare, ['Item']);
        if (hit) w = mergeWork(await Khora.loadWork(hit.id), null);
      } catch (e) { /* keep going */ }
    }

    if (!w) { toast('That work is not in the library.'); return; }
    paintRoom(w);

    if (Khora && w.title) {
      try {
        const hit = await Khora.resolveByTitle(w.title, ['Item']);
        if (hit && hit.id) {
          const live = await Khora.loadWork(hit.id);
          paintRoom(mergeWork(live, w));
        }
      } catch (e) { /* keep the local room */ }
    }
  }

  function closeRoom() {
    el.room.hidden = true;
    el.room.innerHTML = '';
    if (!activeId) { el.empty.style.display = ''; return; }
    el.editorWrap.hidden = false;
    const n = Notes.get(activeId);
    const todays = Prompts.state().prompt.text;
    setBanner(n.promptText && n.promptText !== todays ? n.promptText : null);
    markWritingOnToday(!!n.promptText && n.promptText === todays);
    grow();
  }

  /* ---------- panel tabs ---------- */

  function setTab(name) {
    tab = name;
    // Scoped to this control: the graph's 2D/3D toggle shares the class
    // and must keep its own selection.
    $$('#seg .seg-btn').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    if (el.segSelect.value !== name) el.segSelect.value = name;
    el.insList.hidden  = name !== 'insights';
    el.readList.hidden = name !== 'readings';
    el.belList.hidden  = name !== 'beliefs';
  }

  el.seg.addEventListener('click', e => {
    const b = e.target.closest('.seg-btn');
    if (b) setTab(b.dataset.tab);
  });

  el.segSelect.addEventListener('change', () => setTab(el.segSelect.value));

  /* ================= share ================= */

  $('#btn-share').addEventListener('click', () => {
    if (!activeId) { toast('Open a note first.'); return; }
    persist();
    buildLink();
    el.scrim.classList.add('on');
  });

  function buildLink() {
    const n = Notes.get(activeId);
    const copy = Object.assign({}, n);
    if (!$('#opt-prompt').checked) copy.promptText = null;
    el.shareLink.value = Share.link(copy, {
      includeAnalysis: $('#opt-analysis').checked,
      includeLinks:    $('#opt-links').checked,
      includeSaved:    $('#opt-saved').checked
    });
    renderManifest(n);
  }

  // A URL can carry text, links and saved nodes. It cannot carry a
  // photograph, and pretending otherwise would produce a link nothing
  // can paste. Say so, and point at the export instead.
  function renderManifest(n) {
    const m = Share.manifest(n);
    const kb = Math.round(el.shareLink.value.length / 1024 * 10) / 10;
    const carried = [];
    if ($('#opt-links').checked && m.links) carried.push(`<b>${m.links}</b> link${m.links === 1 ? '' : 's'}`);
    if ($('#opt-saved').checked && m.saved) carried.push(`<b>${m.saved}</b> thing${m.saved === 1 ? '' : 's'} you saved`);
    $('#manifest').innerHTML =
      `The link carries the text${carried.length ? ', ' + carried.join(' and ') : ''} — about <b>${kb} KB</b>.` +
      (m.media
        ? `<br><span class="warn">${m.media} media file${m.media === 1 ? '' : 's'} cannot travel in a URL.</span>
           Use <b>Export with media</b> for a single file that carries everything.`
        : '');
  }

  ['#opt-prompt', '#opt-analysis', '#opt-links', '#opt-saved']
    .forEach(id => $(id).addEventListener('change', buildLink));

  $('#btn-copy').addEventListener('click', async () => {
    el.shareLink.select();
    try { await navigator.clipboard.writeText(el.shareLink.value); }
    catch (e) { document.execCommand('copy'); }
    Notes.update(activeId, { shared: true });
    toast('Link copied. It carries the note itself — no server involved.');
  });

  $('#btn-close-modal').addEventListener('click', () => el.scrim.classList.remove('on'));
  const notePick = $('#note-pick-scrim');
  if (notePick) {
    $('#note-pick-cancel').addEventListener('click', () => {
      pendingSave = null;
      notePick.classList.remove('on');
    });
    notePick.addEventListener('click', e => { if (e.target === notePick) { pendingSave = null; notePick.classList.remove('on'); } });
    $('#note-pick-list').addEventListener('click', e => {
      const b = e.target.closest('[data-pick]');
      if (!b || !pendingSave) return;
      const payload = pendingSave;
      pendingSave = null;
      notePick.classList.remove('on');
      const rec = Notes.get(b.dataset.pick);
      if (!rec) return;
      Saved.toggle(rec.id, payload);
      renderComposer();
      if (window.PalinodeGraph && PalinodeGraph.refreshDetail) PalinodeGraph.refreshDetail();
      toast('Added to “' + (rec.title || 'Untitled') + '”.');
    });
    $('#note-pick-new').addEventListener('click', () => {
      const payload = pendingSave;
      pendingSave = null;
      notePick.classList.remove('on');
      const n = Notes.create({ title: '', body: '' });
      if (payload) Saved.toggle(n.id, payload);
      openNote(n.id);
      renderList();
      toast('Added to a new note.');
    });
  }
  el.scrim.addEventListener('click', e => { if (e.target === el.scrim) el.scrim.classList.remove('on'); });

  /* ================= exploration ================= */

  async function explore() {
    if (!activeId || !analysis) { toast('Open a note first.'); return; }
    if (analysis.stats.words < 12) { toast('Write a little first — the graph grows out of the note.'); return; }
    persist();
    cancelOffer();
    closePathways();
    closeProfile();
    closeMarket();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    await window.PalinodeGraph.open({
      note: Notes.get(activeId),
      analysis,
      onSavePathway: steps => {
        if (window.PalinodePathways) PalinodePathways.offerSave(steps, { noteId: activeId });
      },
      onClose: () => { if (phone()) syncNav('write'); },
      onSaveChange: renderComposer,
      onOpenNote: noteId => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        openNote(noteId);
        toast('Opened “' + (Notes.get(noteId).title || 'Untitled') + '”.');
      },
      onRead: workId => { window.PalinodeGraph.close(); document.body.classList.remove('exploring'); openWork(workId); },
      // The graph stays open behind the item: placing yourself is a detour
      // inside the exploration, not an exit from it.
      onPlace: axisId => openPlace(axisId, 'graph'),
      onWrite: concept => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        const n = Notes.create({ promptText: concept.turn, title: '' });
        openNote(n.id);
        renderList();
        el.input.focus();
        toast('New note, opened on ' + concept.label + '.');
      },
      onOpenEpic: epicId => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        closePathways();
        closeProfile();
        el.body.classList.remove('show-insights', 'show-rail');
        if (window.PalinodeMarketplace) PalinodeMarketplace.enter({ epicId });
        syncNav('market');
      },
      onOpenQuest: questId => {
        if (window.PalinodeQuests) PalinodeQuests.openOverview(questId);
      },
      onOpenMentor: mentorId => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        closePathways();
        closeProfile();
        el.body.classList.remove('show-insights', 'show-rail');
        if (window.PalinodeMarketplace) PalinodeMarketplace.enter({ mentorId });
        syncNav('market');
      }
    });
    if (phone()) syncNav('explore');
  }
  async function openCorpus() {
    if (window.PalinodeGraph && PalinodeGraph.isPage && PalinodeGraph.isPage()) {
      syncNav('explore');
      return;
    }
    cancelOffer();
    closePathways();
    closeProfile();
    closeMarket();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    await window.PalinodeGraph.open({
      mode: 'corpus',
      note: activeId ? Notes.get(activeId) : { id: '', title: '', body: '' },
      analysis: analysis || { concepts: [], insights: [], leans: [], stats: { words: 0 } },
      onSavePathway: steps => {
        if (window.PalinodePathways) PalinodePathways.offerSave(steps, { noteId: activeId });
      },
      onClose: () => { if (phone()) syncNav('write'); },
      onSaveChange: renderComposer,
      onOpenNote: noteId => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        openNote(noteId);
        toast('Opened “' + (Notes.get(noteId).title || 'Untitled') + '”.');
      },
      onRead: workId => { window.PalinodeGraph.close(); document.body.classList.remove('exploring'); openWork(workId); },
      onPlace: axisId => openPlace(axisId, 'graph'),
      onWrite: concept => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        const n = Notes.create({ promptText: concept.turn, title: '' });
        openNote(n.id);
        renderList();
        el.input.focus();
        toast('New note, opened on ' + concept.label + '.');
      },
      onAddToPathway: step => {
        if (window.PalinodePathways) PalinodePathways.offerAttachStep(step);
      },
      onSaveNode: payload => saveNodeToNote(payload),
      onNeedNote: payload => saveNodeToNote(payload),
      onOpenEpic: epicId => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        closePathways();
        closeProfile();
        el.body.classList.remove('show-insights', 'show-rail');
        if (window.PalinodeMarketplace) PalinodeMarketplace.enter({ epicId });
        syncNav('market');
      },
      onOpenQuest: questId => {
        if (window.PalinodeQuests) PalinodeQuests.openOverview(questId);
      },
      onOpenMentor: mentorId => {
        window.PalinodeGraph.close();
        document.body.classList.remove('exploring');
        closePathways();
        closeProfile();
        el.body.classList.remove('show-insights', 'show-rail');
        if (window.PalinodeMarketplace) PalinodeMarketplace.enter({ mentorId });
        syncNav('market');
      }
    });
    syncNav('explore');
  }

  function saveNodeToNote(payload) {
    const apply = id => {
      const rec = Notes.get(id);
      if (!rec) return;
      const now = Saved.toggle(id, payload);
      renderComposer();
      if (window.PalinodeGraph && PalinodeGraph.refreshDetail) PalinodeGraph.refreshDetail();
      toast(now
        ? 'Added to “' + (rec.title || 'Untitled') + '”.'
        : 'Removed from “' + (rec.title || 'Untitled') + '”.');
    };
    if (activeId) { apply(activeId); return; }
    pendingSave = payload;
    const list = $('#note-pick-list');
    const notes = Notes.all();
    list.innerHTML = notes.length
      ? notes.map(n => `<button type="button" data-pick="${esc(n.id)}">${esc(n.title || 'Untitled')}</button>`).join('')
      : '<p class="lede">No notes yet. Start a new one.</p>';
    $('#note-pick-scrim').classList.add('on');
  }

  $('#btn-explore').addEventListener('click', openCorpus);
  el.constel.addEventListener('click', explore);      // the mini map is a door

  /* ---------- the note as a container ---------- */

  const HOST = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

  async function renderComposer() {
    if (!activeId) return;
    const saved = Saved.all(activeId);
    const atts  = Attach.all(activeId);
    const note = Notes.get(activeId);
    const paths = ((note && note.pathwayIds) || []).map(id => Pathways.get(id)).filter(Boolean);

    // saved concepts and works, as chips on the note
    $('#saved-strip').hidden = !saved.length;
    $('#saved-strip').innerHTML = saved.map(x => `
      <span class="saved-chip" data-saved="${esc(x.id)}" data-type="${esc(x.type)}">
        ${orb(x.category, 'sm')}<span class="t">${esc(x.label)}</span>
        <span class="x" data-unsave="${esc(x.id)}" title="Remove">×</span>
      </span>`).join('');

    $('#pathway-strip').hidden = !paths.length;
    $('#pathway-strip').innerHTML = paths.map(p => `
      <span class="saved-chip" data-pathway="${esc(p.id)}">
        ${orb('resonance', 'sm')}<span class="t">${esc(p.title || 'Untitled pathway')}</span>
        <span class="x" data-unpath="${esc(p.id)}" title="Unlink">×</span>
      </span>`).join('');

    const n = saved.length + atts.length + paths.length;
    $('#composer-count').textContent = n
      ? n + (n === 1 ? ' thing attached' : ' things attached')
      : 'Nothing attached';
    $('#dropzone').style.display = atts.length ? 'none' : '';

    // media has to be fetched out of IndexedDB, so render shells then fill
    $('#attach-grid').innerHTML = atts.map(a => {
      const kill = `<button class="kill" data-kill="${esc(a.id)}" title="Remove">×</button>`;
      if (a.kind === 'link') {
        return `<a class="att link" href="${esc(a.url)}" target="_blank" rel="noopener" data-att="${esc(a.id)}">
          ${kill}<div class="meta">
            <div class="name">${esc(a.title || HOST(a.url))}</div>
            <div class="host">${esc(HOST(a.url))}</div>
          </div></a>`;
      }
      const meta = `<div class="meta"><div class="name">${esc(a.name)}</div>
        <div class="sub">${esc(a.kind)}${a.size ? ' · ' + Media.human(a.size) : ''}</div></div>`;
      if (a.kind === 'image') return `<div class="att" data-att="${esc(a.id)}">${kill}<img data-src="${esc(a.id)}" alt="${esc(a.name)}">${meta}</div>`;
      if (a.kind === 'video') return `<div class="att" data-att="${esc(a.id)}">${kill}<video data-src="${esc(a.id)}" controls preload="metadata"></video>${meta}</div>`;
      if (a.kind === 'audio') return `<div class="att" data-att="${esc(a.id)}">${kill}<div class="meta"><div class="name">${esc(a.name)}</div><audio data-src="${esc(a.id)}" controls preload="metadata"></audio><div class="sub">${esc(Media.human(a.size))}</div></div></div>`;
      return `<div class="att file" data-att="${esc(a.id)}">${kill}${meta}</div>`;
    }).join('');

    for (const el of $$('#attach-grid [data-src]')) {
      const u = await Media.url(el.dataset.src);
      if (u) el.src = u;
    }
  }

  /* adding media */

  $('#btn-media').addEventListener('click', () => $('#file-input').click());
  $('#file-input').addEventListener('change', e => {
    const picked = Array.from(e.target.files);
    e.target.value = '';
    intake(picked);
  });

  async function intake(files) {
    if (!activeId) { toast('Open a note first.'); return; }
    if (!Media.supported()) { toast('This browser will not store media locally.'); return; }
    let added = 0, failed = 0;
    for (const f of Array.from(files)) {
      const rec = Attach.add(activeId, {
        kind: Media.kindOf(f), name: f.name, mime: f.type, size: f.size
      });
      try { await Media.put(rec.id, f); added++; }
      catch (err) { Attach.remove(activeId, rec.id); failed++; }
    }
    renderComposer();
    renderList();
    if (added) toast(added + (added === 1 ? ' file attached.' : ' files attached.') +
                     (failed ? ' ' + failed + ' could not be stored.' : ''));
    else toast('Nothing could be attached — the store refused the write.');
  }

  /* drag and drop anywhere over the writing column */

  const dz = $('#dropzone');
  ['dragenter', 'dragover'].forEach(t =>
    document.querySelector('.centre').addEventListener(t, e => {
      if (!activeId || el.editorWrap.hidden) return;
      e.preventDefault(); dz.classList.add('hot');
    }));
  ['dragleave', 'drop'].forEach(t =>
    document.querySelector('.centre').addEventListener(t, e => {
      if (t === 'drop') {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer?.files || []);
        if (dropped.length) intake(dropped);
      }
      dz.classList.remove('hot');
    }));

  /* adding a link */

  $('#btn-link').addEventListener('click', () => {
    const f = $('#link-form');
    f.hidden = !f.hidden;
    if (!f.hidden) $('#link-url').focus();
  });
  $('#link-cancel').addEventListener('click', () => { $('#link-form').hidden = true; });
  $('#link-form').addEventListener('submit', e => {
    e.preventDefault();
    if (!activeId) return;
    let url = $('#link-url').value.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    Attach.add(activeId, { kind: 'link', url, title: $('#link-title').value.trim() || '' });
    $('#link-url').value = ''; $('#link-title').value = '';
    $('#link-form').hidden = true;
    renderComposer();
    toast('Link added.');
  });

  /* removing */

  $('#attach-grid').addEventListener('click', async e => {
    const k = e.target.closest('[data-kill]');
    if (!k) return;
    e.preventDefault(); e.stopPropagation();
    const id = k.dataset.kill;
    const a = Attach.all(activeId).find(x => x.id === id);
    Attach.remove(activeId, id);
    if (a && a.kind !== 'link') await Media.del(id);
    renderComposer();
    toast('Removed.');
  });

  $('#pathway-strip').addEventListener('click', e => {
    const un = e.target.closest('[data-unpath]');
    if (un) {
      Pathways.unlinkNote(un.dataset.unpath, activeId);
      renderComposer();
      return;
    }
    const chip = e.target.closest('[data-pathway]');
    if (chip && window.PalinodePathways) {
      closeExplore();
      el.body.classList.remove('show-insights', 'show-rail');
      PalinodePathways.enter();
      PalinodePathways.openWalk(chip.dataset.pathway);
      syncNav('pathways');
    }
  });

  $('#btn-add-path').addEventListener('click', () => {
    if (!activeId) { toast('Open a note first.'); return; }
    if (window.PalinodePathways) PalinodePathways.offerAttach(activeId);
  });

  $('#saved-strip').addEventListener('click', e => {
    const un = e.target.closest('[data-unsave]');
    if (un) {
      Saved.toggle(activeId, { id: un.dataset.unsave });
      renderComposer();
      return;
    }
    const chip = e.target.closest('[data-saved]');
    if (!chip) return;
    if (chip.dataset.type === 'work') openWork(chip.dataset.saved.replace(/^w:/, ''));
    else explore();
  });

  /* ---------- export: a standalone file that carries the media ---------- */

  async function exportNote() {
    if (!activeId) return;
    const n = Notes.get(activeId);
    const atts = Attach.all(activeId);
    const saved = Saved.all(activeId);
    toast('Building the file…');

    const parts = [];
    for (const a of atts) {
      if (a.kind === 'link') {
        parts.push(`<a class="lk" href="${esc(a.url)}">${esc(a.title || HOST(a.url))}<span>${esc(HOST(a.url))}</span></a>`);
        continue;
      }
      const d = await Media.dataUrl(a.id);
      if (!d) continue;
      if (a.kind === 'image') parts.push(`<figure><img src="${d}" alt="${esc(a.name)}"><figcaption>${esc(a.name)}</figcaption></figure>`);
      else if (a.kind === 'video') parts.push(`<figure><video src="${d}" controls></video><figcaption>${esc(a.name)}</figcaption></figure>`);
      else if (a.kind === 'audio') parts.push(`<figure><audio src="${d}" controls></audio><figcaption>${esc(a.name)}</figcaption></figure>`);
      else parts.push(`<p><a class="lk" href="${d}" download="${esc(a.name)}">${esc(a.name)}</a></p>`);
    }

    const doc = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(n.title || 'Untitled')} — Palinode</title>
<style>
 :root{color-scheme:dark}
 body{margin:0;background:#08070a;color:rgba(255,255,255,.95);
   font:15px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif}
 .wrap{max-width:720px;margin:0 auto;padding:56px 28px 90px}
 .kicker{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.32);margin-bottom:22px}
 h1{font-family:Georgia,'Times New Roman',serif;font-weight:500;font-size:34px;line-height:1.2;margin:0 0 8px}
 .date{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.32);margin-bottom:30px}
 .prompt{border-left:2px solid rgba(246,162,68,.5);padding:4px 0 4px 16px;margin:0 0 26px;
   font-family:Georgia,serif;font-style:italic;color:rgba(255,255,255,.62);font-size:15px}
 .body{font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.85;white-space:pre-wrap}
 h2{font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.32);
   font-weight:700;margin:46px 0 16px;padding-top:24px;border-top:1px solid rgba(255,255,255,.07)}
 figure{margin:0 0 18px}
 img,video{max-width:100%;border-radius:12px;display:block}
 audio{width:100%}
 figcaption{font-size:11px;color:rgba(255,255,255,.32);margin-top:7px}
 .lk{display:block;text-decoration:none;color:rgba(255,255,255,.95);
   border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:13px 15px;margin-bottom:9px;
   font-family:Georgia,serif;font-size:14px}
 .lk span{display:block;font-family:inherit;font-size:9.5px;letter-spacing:.12em;
   text-transform:uppercase;color:rgba(255,255,255,.32);margin-top:6px}
 .chip{display:inline-block;border:1px solid rgba(255,255,255,.1);border-radius:999px;
   padding:5px 12px;margin:0 5px 5px 0;font-size:12px;color:rgba(255,255,255,.62)}
</style></head><body><div class="wrap">
<div class="kicker">Palinode · exported note</div>
<h1>${esc(n.title || 'Untitled')}</h1>
<div class="date">${fmtDate(n.created)}</div>
${n.promptText ? `<p class="prompt">${esc(n.promptText)}</p>` : ''}
<div class="body">${esc(n.body || '')}</div>
${saved.length ? `<h2>Saved to this note</h2>${saved.map(x => `<span class="chip">${esc(x.label)}${x.sub ? ' · ' + esc(x.sub) : ''}</span>`).join('')}` : ''}
${parts.length ? `<h2>Attached</h2>${parts.join('\n')}` : ''}
</div></body></html>`;

    const blob = new Blob([doc], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (n.title || 'palinode-note').replace(/[^\w\d-]+/g, '-').toLowerCase() + '.html';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    toast('Exported — media embedded, opens anywhere.');
  }
  $('#btn-export').addEventListener('click', exportNote);

  /* ================= layout toggles ================= */

  $('#btn-rail').addEventListener('click', () => {
    if (phone()) {
      closeExplore();
      closePathways();
      closeProfile();
      el.body.classList.remove('show-insights');
      el.body.classList.add('show-rail');
      syncNav('write');
      return;
    }
    if (window.PalinodeGraph && PalinodeGraph.isPage && PalinodeGraph.isPage()) {
      closeExplore();
      closePathways();
      closeProfile();
      syncNav('write');
      return;
    }
    if (window.PalinodeProfile && PalinodeProfile.isOpen()) {
      closeProfile();
      syncNav('write');
      return;
    }
    if (window.PalinodePathways && PalinodePathways.isListOpen()) {
      closePathways();
      syncNav('write');
      return;
    }
    el.body.classList.toggle('rail-closed');
  });
  const btnNoteBack = document.getElementById('btn-note-back');
  if (btnNoteBack) btnNoteBack.addEventListener('click', () => {
    if (!phone()) return;
    el.body.classList.add('show-rail');
    syncNotePage();
  });
  const btnPathBack = document.getElementById('btn-path-back');
  if (btnPathBack) btnPathBack.addEventListener('click', () => {
    if (!phone()) return;
    el.body.classList.add('show-rail');
    syncNotePage();
  });
  const btnQuestBack = document.getElementById('btn-quest-back');
  if (btnQuestBack) btnQuestBack.addEventListener('click', () => {
    if (!phone()) return;
    el.body.classList.add('show-rail');
    syncNotePage();
  });
  window.addEventListener('resize', syncNotePage);
  $('#btn-nav-insights').addEventListener('click', () => {
    closeExplore();
    closePathways();
    closeProfile();
    el.body.classList.remove('show-rail');
    if (el.body.classList.contains('show-insights')) {
      el.body.classList.remove('show-insights');
      syncNav('write');
      return;
    }
    el.body.classList.add('show-insights');
    syncNav('insights');
  });
  $('#btn-note-insights').addEventListener('click', () => {
    if (!phone()) return;
    closeExplore();
    closePathways();
    closeProfile();
    el.body.classList.remove('show-rail', 'insights-closed');
    if (el.body.classList.contains('show-insights')) {
      el.body.classList.remove('show-insights');
      syncNav('write');
      return;
    }
    el.body.classList.add('show-insights');
    syncNav('write');
  });
  $('#btn-insights').addEventListener('click', () => {
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) return;
    el.body.classList.toggle(phone() ? 'show-insights' : 'insights-closed');
  });
  $('#btn-pathways').addEventListener('click', () => {
    closeExplore();
    closeProfile();
    closeMarket();
    closeQuests();
    el.body.classList.remove('show-insights');
    if (window.PalinodePathways) PalinodePathways.enter();
    if (phone()) el.body.classList.add('show-rail');
    syncNav('pathways');
  });
  $('#btn-quests').addEventListener('click', () => {
    if (window.PalinodeQuests && PalinodeQuests.isOpen()) return;
    closeExplore();
    closePathways();
    closeProfile();
    closeMarket();
    el.body.classList.remove('show-insights');
    if (window.PalinodeQuests) PalinodeQuests.enter();
    if (phone()) el.body.classList.add('show-rail');
    syncNav('quests');
  });
  $('#btn-market').addEventListener('click', () => {
    if (window.PalinodeMarketplace && PalinodeMarketplace.isOpen()) return;
    closeExplore();
    closePathways();
    closeProfile();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    if (window.PalinodeMarketplace) PalinodeMarketplace.enter();
    syncNav('market');
  });
  $('#btn-profile').addEventListener('click', () => {
    if (window.PalinodeProfile && PalinodeProfile.isOpen()) return;
    closeExplore();
    closePathways();
    closeMarket();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    if (window.PalinodeProfile) PalinodeProfile.enter();
    syncNav('profile');
  });

  const fabToggle = document.getElementById('nav-fab-toggle');
  const fabScrim = document.getElementById('nav-fab-scrim');
  if (fabToggle) {
    fabToggle.addEventListener('click', () => {
      if (!phone()) return;
      setFabOpen(!document.documentElement.classList.contains('fab-open'));
    });
  }
  if (fabScrim) fabScrim.addEventListener('click', closeFab);
  $$('nav.sidenav .nav-item').forEach(btn => {
    btn.addEventListener('click', () => { if (phone()) closeFab(); });
  });
  window.addEventListener('resize', () => { if (!phone()) closeFab(); });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (document.documentElement.classList.contains('fab-open')) {
        closeFab();
        return;
      }
      el.scrim.classList.remove('on');
      $('#path-save-scrim').classList.remove('on');
      $('#path-pick-scrim').classList.remove('on');
      const notePick = $('#note-pick-scrim');
      if (notePick) notePick.classList.remove('on');
      closeForget();
      if (window.PalinodePathways && PalinodePathways.isWalkOpen()) {
        PalinodePathways.closeWalk({ toList: true });
        syncNav('pathways');
        if (phone()) el.body.classList.add('show-rail');
      } else if (window.PalinodePathways && PalinodePathways.isListOpen()) {
        closePathways();
        syncNav('write');
      } else if (window.PalinodeQuests && PalinodeQuests.isDetailOpen()) {
        PalinodeQuests.showList();
        syncNav('quests');
        if (phone()) el.body.classList.add('show-rail');
        syncNotePage();
      } else if (window.PalinodeQuests && PalinodeQuests.isOpen()) {
        closeQuests();
        syncNav('write');
      }
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); persist(); toast('Saved.'); }
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); run(false); }
  });

  /* ================= shared read-only route ================= */

  async function renderShared(payload) {
    document.getElementById('app').style.display = 'none';
    const view = $('#shared-view');
    view.style.display = 'block';

    let analysisHtml = '';
    if (payload.a) {
      const a = await window.PalinodeEngine.analyze(payload.b || '');
      if (a.insights.length) {
        analysisHtml = `<div style="margin-top:52px;padding-top:28px;border-top:1px solid var(--hairline-2)">
          <div class="rail-title" style="margin-bottom:18px">The reading that came with it</div>
          ${a.insights.slice(0, 8).map(i => `
            <article class="insight open" style="--c:var(--${i.category});cursor:default;margin-bottom:10px">
              <div class="ihead">${orb(i.category)}
                <div class="ititle"><h4>${esc(i.label)}</h4>
                <div class="lineage-tag">${esc(i.tradition)}</div></div>
              </div>
              <div class="ibody" style="display:block">
                <p class="reading">${esc(i.reading)}</p>
                <div class="turn"><span class="lab">Turn it back</span><p>${esc(i.turn)}</p></div>
                ${(i.sources || []).map(s => `<div class="src"><div class="w">${esc(s.work)}</div>
                  <div class="a">${esc(s.author)}</div></div>`).join('')}
              </div>
            </article>`).join('')}
        </div>`;

        const sh = LIB.shelf(a.insights);
        if (sh.length) {
          analysisHtml += `<div style="margin-top:44px;padding-top:28px;border-top:1px solid var(--hairline-2)">
            <div class="rail-title" style="margin-bottom:18px">Where to read further</div>
            ${sh.slice(0, 12).map(w => {
              const l = LIB.links(w)[0];
              return `<div class="src" style="display:flex;align-items:baseline;gap:12px">
                <div style="flex:1">
                  <div class="w">${esc(w.title)}</div>
                  <div class="a">${esc(w.author)}${w.year ? ' · ' + esc(w.year) : ''}${
                    w.sections.length ? ' · ' + esc(w.sections.join(', ')) : ''}</div>
                </div>
                <a href="${l.href}" target="_blank" rel="noopener" class="micro"
                   style="text-decoration:none;white-space:nowrap;padding-right:0">${
                   w.rights === 'open' ? 'Full text' : 'Find it'}</a>
              </div>`;
            }).join('')}
          </div>`;
        }
      }
    }

    const links = (payload.l || []).map(([url, title]) =>
      `<a class="att link" href="${esc(url)}" target="_blank" rel="noopener">
         <div class="meta"><div class="name">${esc(title || HOST(url))}</div>
         <div class="host">${esc(HOST(url))}</div></div></a>`).join('');

    const savedCards = (payload.s || []).map(id => {
      const bare = String(id).replace(/^[cwt]:/, '');
      if (id.startsWith('w:')) {
        const w = LIB.works[bare];
        if (!w) return '';
        const l = LIB.links(w)[0];
        return `<div class="src" style="display:flex;align-items:baseline;gap:12px">
          <div style="flex:1"><div class="w">${esc(w.title)}</div>
          <div class="a">${esc(w.author)}${w.year ? ' · ' + esc(w.year) : ''}</div></div>
          <a href="${l.href}" target="_blank" rel="noopener" class="micro"
             style="text-decoration:none;white-space:nowrap;padding-right:0">${w.rights === 'open' ? 'Full text' : 'Find it'}</a>
        </div>`;
      }
      const c = window.PalinodeCorpus.CONCEPTS.find(x => x.id === bare);
      if (!c) return '';
      return `<div class="src"><div class="w">${esc(c.label)}</div>
        <div class="a">${esc(window.PalinodeCorpus.TRADITIONS[c.tradition] || '')}</div>
        <div class="n">${esc(c.turn)}</div></div>`;
    }).join('');

    view.innerHTML = `<div class="shared-wrap">
      <div class="shared-badge">${orb('lineage','sm')} Shared note · read only</div>
      <h1>${esc(payload.t || 'Untitled')}</h1>
      <div class="doc-meta" style="margin-bottom:26px">
        <span>${fmtDate(payload.d || Date.now())}</span>
        <span>${(payload.b || '').split(/\s+/).filter(Boolean).length} words</span>
      </div>
      ${payload.p ? `<p class="shared-prompt">${esc(payload.p)}</p>` : ''}
      <div class="shared-body">${esc(payload.b || '')}</div>
      ${links ? `<div class="shared-sec"><div class="rail-title" style="margin-bottom:14px">Links</div>
        <div class="shared-links">${links}</div></div>` : ''}
      ${savedCards ? `<div class="shared-sec"><div class="rail-title" style="margin-bottom:14px">Saved to this note</div>
        ${savedCards}</div>` : ''}
      ${analysisHtml}
      <div style="margin-top:44px"><a href="${location.href.split('#')[0]}" class="ghost solid"
        style="text-decoration:none;display:inline-block">Open Palinode</a></div>
    </div>`;
  }

  /* ================= boot ================= */

  const marketHash = (location.hash || '').match(/^#market\/(?:epic|session|mentor)\/([^/?#]+)/);
  const marketKind = (location.hash || '').match(/^#market\/(epic|session|mentor)\//);
  const shared = Share.parse(location.hash);
  if (marketHash && window.PalinodeMarketplace) {
    $('#engine-name').textContent = window.PalinodeEngine.current();
    if (window.PalinodePathways) {
      PalinodePathways.onChange = () => {
        renderComposer();
        renderList();
        PalinodePathways.refresh();
      };
      PalinodePathways.onChrome = () => syncNotePage();
    }
    if (window.PalinodeQuests) {
      wireQuestsChrome();
    }
    if (window.PalinodeMarketplace) {
      PalinodeMarketplace.onChrome = () => syncNotePage();
    }
    renderList();
    paintPrompt();
    closeExplore();
    closePathways();
    closeProfile();
    closeQuests();
    el.body.classList.remove('show-insights', 'show-rail');
    const id = decodeURIComponent(marketHash[1]);
    const kind = marketKind && marketKind[1];
    if (kind === 'mentor') PalinodeMarketplace.enter({ mentorId: id });
    else PalinodeMarketplace.enter({ epicId: id });
    syncNav('market');
  } else if (shared) {
    renderShared(shared);
  } else {
    $('#engine-name').textContent = window.PalinodeEngine.current();

    window.PalinodeStore.seedIfEmpty([{
      title: 'On being told to slow down',
      promptText: 'Describe something you are forcing. Then describe the shape of the situation as if it had a grain you could follow.',
      body: `Someone told me today that I should slow down and I resented it immediately, which is probably the tell. I have been pushing through this project for three weeks and I keep telling myself I have no choice, the deadline is the deadline. But I chose the deadline. I chose it in a meeting in June where I could have said something and did not.

Everyone always says the grind is just what it takes. Maybe. I notice that I only believe that when I am tired.

What I actually want is for someone to see how hard it has been. That is a smaller thing than I have been pretending it is.`
    }]);

    if (window.PalinodePathways) {
      PalinodePathways.onChange = () => {
        renderComposer();
        renderList();
        PalinodePathways.refresh();
      };
      PalinodePathways.onChrome = () => syncNotePage();
      PalinodePathways.onOpenNote = id => {
        closeExplore();
        closePathways();
        closeProfile();
        closeMarket();
        closeQuests();
        openNote(id);
        syncNav('write');
      };
      PalinodePathways.onWrite = concept => {
        if (!concept) return;
        closeExplore();
        closePathways();
        closeProfile();
        closeMarket();
        closeQuests();
        const n = Notes.create({ promptText: concept.turn, title: '' });
        openNote(n.id);
        renderList();
        el.input.focus();
        syncNav('write');
        toast('New note, opened on ' + concept.label + '.');
      };
      PalinodePathways.onPlace = axisId => openPlace(axisId, 'pathway');
      PalinodePathways.onRead = workId => {
        closeExplore();
        closePathways();
        closeProfile();
        closeMarket();
        closeQuests();
        openWork(workId);
        syncNav('write');
      };
    }
    if (window.PalinodeQuests) {
      wireQuestsChrome();
    }

    if (window.PalinodeProfile)
      PalinodeProfile.onPlace = axisId => openPlace(axisId, 'profile');

    window.PalinodeApp = { openCorpus };

    renderPrompt();
    renderList();
    renderComposer();
    const first = Notes.all()[0];
    if (first) openNote(first.id);
    else { el.editorWrap.hidden = true; el.empty.style.display = ''; }
    el.body.classList.remove('show-rail');
    void openCorpus();
    syncNotePage();

    if (window.PalinodeStore.usingMemory()) {
      toast('Storage unavailable here — notes will last for this session only.');
    }
  }
})();
