/* ============================================================
   Palinode — Pathways

   A pathway is a curated walk: the trail you kept, in that
   order. The left tray lists them; the centre is a feed of
   every step. Explore can open the same walk as a focused graph.
   ============================================================ */

(function () {
  const { Notes, Pathways } = window.PalinodeStore;
  const Media = window.PalinodeMedia;
  const { CONCEPTS, TRADITIONS } = window.PalinodeCorpus;
  const LIB = window.PalinodeLibrary;
  const BEL = window.PalinodeBeliefs;

  const CONCEPT = {};
  CONCEPTS.forEach(c => { CONCEPT[c.id] = c; });

  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s || '').replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  const fmt = ts => new Date(ts).toLocaleDateString(undefined,
    { month:'short', day:'numeric', year:'numeric' });

  let walkId = null;
  let walkCursor = 0;
  let pendingSteps = null;
  let pendingNoteId = null;
  let attachNoteId = null;

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 2000);
  }

  function notify() {
    if (typeof window.PalinodePathways.onChange === 'function')
      window.PalinodePathways.onChange();
  }

  function bodyEl() { return document.getElementById('body'); }

  function hideWriteCentre() {
    const ed = $('#editor-wrap');
    const empty = $('#empty-state');
    const read = $('#reading-room');
    if (ed) ed.hidden = true;
    if (empty) { empty.hidden = true; empty.style.display = 'none'; }
    if (read) read.hidden = true;
  }

  function showFeed() {
    const wrap = $('#pathway-wrap');
    const pe = $('#path-empty');
    if (wrap) wrap.hidden = false;
    if (pe) pe.hidden = true;
  }

  function showPathEmpty() {
    const wrap = $('#pathway-wrap');
    const pe = $('#path-empty');
    if (wrap) wrap.hidden = true;
    if (pe) {
      pe.hidden = false;
      const copy = $('#path-empty-copy');
      if (copy) copy.textContent = Pathways.all().length
        ? 'Pick a pathway from the tray.'
        : 'No pathways yet. Explore a note, trim the trail, and save it.';
    }
  }

  let insightsWasClosed = false;

  function enter() {
    const body = bodyEl();
    if (body) {
      if (!body.classList.contains('pathways-mode'))
        insightsWasClosed = body.classList.contains('insights-closed');
      body.classList.add('pathways-mode', 'insights-closed');
      body.classList.remove('show-insights');
    }
    const title = $('#rail-title');
    if (title) title.textContent = 'Pathways';
    const list = $('#path-list');
    if (list) list.hidden = false;
    hideWriteCentre();
    renderList();
    if (walkId && Pathways.get(walkId)) { showFeed(); renderWalk(); }
    else showPathEmpty();
  }

  function leave() {
    walkId = null;
    const wrap = $('#pathway-wrap');
    const pe = $('#path-empty');
    const list = $('#path-list');
    if (wrap) wrap.hidden = true;
    if (pe) pe.hidden = true;
    if (list) list.hidden = true;
    const body = bodyEl();
    if (body) {
      body.classList.remove('pathways-mode');
      if (!insightsWasClosed) body.classList.remove('insights-closed');
    }
    const title = $('#rail-title');
    if (title) title.textContent = 'Library';
  }

  function showList() { enter(); }
  function hideList() { leave(); }

  function isListOpen() {
    const body = bodyEl();
    return !!(body && body.classList.contains('pathways-mode'));
  }
  function isWalkOpen() {
    const wrap = $('#pathway-wrap');
    return !!(wrap && !wrap.hidden);
  }

  function renderList() {
    const list = $('#path-list');
    if (!list) return;
    const all = Pathways.all();
    if (!all.length) {
      list.innerHTML = '<p class="path-empty">No pathways yet. Explore a note, trim the trail, and save it.</p>';
      return;
    }
    list.innerHTML = all.map(p => `
      <div class="note-item ${p.id === walkId ? 'active' : ''}" data-open="${esc(p.id)}">
        <h4>${esc(p.title || 'Untitled pathway')}</h4>
        <p>${p.steps.length} step${p.steps.length === 1 ? '' : 's'} · ${fmt(p.updated)}</p>
        <button class="forget" data-forget-path="${esc(p.id)}" title="Delete pathway">×</button>
      </div>`).join('');
  }

  function offerSave(steps, opts = {}) {
    pendingSteps = steps || [];
    pendingNoteId = opts.noteId || null;
    const names = pendingSteps.map(s => s.label).filter(Boolean);
    $('#path-save-name').value = names.length >= 2
      ? names[0] + ' → ' + names[names.length - 1]
      : (names[0] || '');
    $('#path-save-note-opt').hidden = !pendingNoteId;
    $('#path-save-note').checked = !!pendingNoteId;
    $('#path-save-scrim').classList.add('on');
    setTimeout(() => $('#path-save-name').focus(), 30);
  }

  function confirmSave() {
    if (!pendingSteps || !pendingSteps.length) {
      $('#path-save-scrim').classList.remove('on');
      return null;
    }
    const title = $('#path-save-name').value.trim() || 'Untitled pathway';
    const noteIds = [];
    if (pendingNoteId && $('#path-save-note').checked) noteIds.push(pendingNoteId);
    const rec = Pathways.create({ title, steps: pendingSteps, noteIds });
    $('#path-save-scrim').classList.remove('on');
    pendingSteps = null;
    toast('Saved “' + rec.title + '”.');
    notify();
    return rec;
  }

  function openWalk(id, at) {
    const p = Pathways.get(id);
    if (!p) return;
    walkId = id;
    walkCursor = Math.max(0, Math.min(Math.max(0, p.steps.length - 1), at || 0));
    enter();
    showFeed();
    $('#walk-title').value = p.title || '';
    renderWalk();
    const body = bodyEl();
    if (body) body.classList.remove('show-rail');
    focusStep(walkCursor, false);
  }

  function closeWalk(opts) {
    walkId = null;
    if (opts && opts.toList === false) leave();
    else {
      enter();
      showPathEmpty();
      renderList();
    }
  }

  function current() { return walkId ? Pathways.get(walkId) : null; }

  function renderWalk() {
    const p = current();
    const feed = $('#walk-feed');
    if (!p || !feed) return;
    const steps = p.steps || [];
    $('#walk-title').value = p.title || '';
    const date = $('#walk-date');
    const count = $('#walk-steps');
    if (date) date.textContent = fmt(p.updated);
    if (count) count.textContent = steps.length + (steps.length === 1 ? ' step' : ' steps');
    if (!steps.length) {
      feed.innerHTML = '<p class="gx-lede">This pathway has no steps yet. Add a note or media, or save a trail from Explore.</p>';
      $('#walk-pos').textContent = '0 / 0';
      $('#walk-prev').disabled = true;
      $('#walk-next').disabled = true;
    } else {
      if (walkCursor >= steps.length) walkCursor = steps.length - 1;
      feed.innerHTML = steps.map((step, i) =>
        `<article class="feed-item${i === walkCursor ? ' on' : ''}" data-step="${i}">${stepHTML(step, p)}</article>`
      ).join('');
      fillMedia(feed);
      $('#walk-pos').textContent = (walkCursor + 1) + ' / ' + steps.length;
      $('#walk-prev').disabled = walkCursor <= 0;
      $('#walk-next').disabled = walkCursor >= steps.length - 1;
    }
    renderShelf(p);
    closeAddPanels();
    closePeek();
    renderList();
  }

  function focusStep(i, scroll) {
    const p = current();
    const feed = $('#walk-feed');
    if (!p || !feed || !p.steps.length) return;
    walkCursor = Math.max(0, Math.min(p.steps.length - 1, i));
    $$('#walk-feed .feed-item').forEach(el =>
      el.classList.toggle('on', Number(el.dataset.step) === walkCursor));
    $('#walk-pos').textContent = (walkCursor + 1) + ' / ' + p.steps.length;
    $('#walk-prev').disabled = walkCursor <= 0;
    $('#walk-next').disabled = walkCursor >= p.steps.length - 1;
    if (scroll !== false) {
      const item = feed.querySelector(`.feed-item[data-step="${walkCursor}"]`);
      if (item) item.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function closeAddPanels() {
    const note = $('#walk-note-panel');
    const media = $('#walk-media-panel');
    const link = $('#walk-link-form');
    if (note) note.hidden = true;
    if (media) media.hidden = true;
    if (link) link.hidden = true;
  }

  function closePeek() {
    const peek = $('#walk-peek');
    if (!peek) return;
    peek.hidden = true;
    peek.innerHTML = '';
  }

  function togglePanel(id) {
    const el = $(id);
    if (!el) return;
    const open = el.hidden;
    closeAddPanels();
    el.hidden = !open;
  }

  function stepHTML(step, pathway) {
    const orb = `<span class="orb sm" style="--c:var(--${esc(step.category || 'resonance')})"></span>`;
    if (step.type === 'concept') {
      const c = CONCEPT[step.ref];
      const trad = c ? (TRADITIONS[c.tradition] || '') : (step.sub || '');
      return `<div class="gx-kicker">${orb}${esc(trad)}</div>
        <h3>${esc((c && c.label) || step.label)}</h3>
        <p class="gx-question">${esc((c && c.turn) || '')}</p>`;
    }
    if (step.type === 'work') {
      let w = {};
      try { w = LIB.resolve(step.ref) || {}; } catch (e) { w = {}; }
      return `<div class="gx-kicker">${orb}${esc(w.author || step.sub || '')}</div>
        <h3>${esc(w.title || step.label)}</h3>
        <p class="gx-lede">${esc(w.gist || '')}</p>`;
    }
    if (step.type === 'note' || step.type === 'note-other') {
      const n = Notes.get(step.noteId || step.ref);
      return `<div class="gx-kicker">${orb}Note</div>
        <h3>${esc((n && n.title) || step.label || 'Untitled')}</h3>
        <p class="gx-lede">${esc((n && n.body) || '')}</p>`;
    }
    if (step.type === 'spectrum') {
      const s = (BEL.SPECTRA || []).find(x => x.id === step.ref);
      return `<div class="gx-kicker">${orb}${esc((s && s.branch) || 'Spectrum')}</div>
        <h3>${esc((s && s.title) || step.label)}</h3>
        <p class="gx-lede">${esc(s ? (s.left + ' · ' + s.right) : '')}</p>`;
    }
    if (step.type === 'tradition') {
      return `<div class="gx-kicker">${orb}Tradition</div><h3>${esc(step.label)}</h3>`;
    }
    if (step.type === 'media' || step.type === 'link') {
      const att = findAtt(step, pathway);
      if (!att) return `<h3>${esc(step.label)}</h3>`;
      if (att.kind === 'link') {
        return `<div class="gx-kicker">${orb}Link</div>
          <h3>${esc(att.title || step.label)}</h3>
          <p class="gx-lede"><a href="${esc(att.url)}" target="_blank" rel="noopener">${esc(att.url)}</a></p>`;
      }
      const name = att.name || step.label;
      if (att.kind === 'image')
        return `<div class="gx-kicker">${orb}Media</div><h3>${esc(name)}</h3><img class="walk-media" data-src="${esc(att.id)}" alt="${esc(name)}">`;
      if (att.kind === 'video')
        return `<div class="gx-kicker">${orb}Media</div><h3>${esc(name)}</h3><video class="walk-media" data-src="${esc(att.id)}" controls preload="metadata"></video>`;
      if (att.kind === 'audio')
        return `<div class="gx-kicker">${orb}Media</div><h3>${esc(name)}</h3><audio data-src="${esc(att.id)}" controls preload="metadata"></audio>`;
      return `<div class="gx-kicker">${orb}File</div><h3>${esc(name)}</h3>`;
    }
    return `<div class="gx-kicker">${orb}</div><h3>${esc(step.label)}</h3>`;
  }

  function findAtt(step, pathway) {
    const id = step.ref || step.id;
    const own = (pathway.attachments || []).find(a => a.id === id);
    if (own) return own;
    for (const n of Notes.all()) {
      const a = (n.attachments || []).find(x => x.id === id);
      if (a) return a;
    }
    return null;
  }

  async function fillMedia(root) {
    if (!root) return;
    for (const el of root.querySelectorAll('[data-src]')) {
      const u = await Media.url(el.dataset.src);
      if (u) el.src = u;
    }
  }

  function renderShelf(p) {
    const box = $('#walk-notes');
    if (!box) return;
    const notes = (p.noteIds || []).map(id => Notes.get(id)).filter(Boolean);
    const atts = p.attachments || [];
    const chips = notes.map(n => ({
      kind: 'note', id: n.id, label: n.title || 'Untitled', drop: 'unlink'
    })).concat(atts.map(a => ({
      kind: a.kind === 'link' ? 'link' : 'media',
      id: a.id,
      label: a.kind === 'link' ? (a.title || a.url || 'Link') : (a.name || 'File'),
      drop: 'drop-att'
    })));
    box.innerHTML = chips.map(c => `
      <button class="saved-chip" type="button" data-view="${esc(c.kind)}" data-id="${esc(c.id)}">
        <span class="t">${esc(c.label)}</span>
        <span class="x" data-${c.drop}="${esc(c.id)}" title="Remove">×</span>
      </button>`).join('');
  }

  function peekItem(kind, id) {
    const peek = $('#walk-peek');
    const p = current();
    if (!peek || !p) return;
    let html = '';
    if (kind === 'note') {
      const n = Notes.get(id);
      if (!n) return;
      html = `<div class="walk-peek-head"><span class="k">Note</span>
        <button class="ghost" type="button" data-peek-close>Close</button></div>
        <h3>${esc(n.title || 'Untitled')}</h3>
        <p class="gx-lede">${esc(n.body || 'Empty note')}</p>`;
    } else {
      const att = (p.attachments || []).find(a => a.id === id) || findAtt({ ref: id }, p);
      if (!att) return;
      if (att.kind === 'link') {
        html = `<div class="walk-peek-head"><span class="k">Link</span>
          <button class="ghost" type="button" data-peek-close>Close</button></div>
          <h3>${esc(att.title || att.url)}</h3>
          <p class="gx-lede"><a href="${esc(att.url)}" target="_blank" rel="noopener">${esc(att.url)}</a></p>`;
      } else {
        const name = att.name || 'File';
        let body = `<p class="gx-lede">${esc(name)}</p>`;
        if (att.kind === 'image') body = `<img class="walk-media" data-src="${esc(att.id)}" alt="${esc(name)}">`;
        else if (att.kind === 'video') body = `<video class="walk-media" data-src="${esc(att.id)}" controls preload="metadata"></video>`;
        else if (att.kind === 'audio') body = `<audio data-src="${esc(att.id)}" controls preload="metadata"></audio>`;
        html = `<div class="walk-peek-head"><span class="k">Media</span>
          <button class="ghost" type="button" data-peek-close>Close</button></div>
          <h3>${esc(name)}</h3>${body}`;
      }
    }
    peek.innerHTML = html;
    peek.hidden = false;
    fillMedia(peek);
  }

  function askForgetPath(id) {
    const p = Pathways.get(id);
    if (!p) return;
    const title = document.getElementById('forget-title');
    const lede = document.getElementById('forget-lede');
    if (title) title.textContent = 'Delete this pathway?';
    if (lede) lede.textContent = '“' + (p.title || 'Untitled pathway') + '” will be removed. This cannot be undone.';
    const scrim = document.getElementById('forget-scrim');
    scrim.dataset.kind = 'pathway';
    scrim.dataset.id = id;
    scrim.classList.add('on');
  }

  function openExplore() {
    const p = current();
    if (!p || !window.PalinodeGraph) return;
    const noteId = (p.noteIds || [])[0];
    const note = noteId ? Notes.get(noteId) : null;
    window.PalinodeGraph.open({
      mode: 'pathway',
      pathway: p,
      connections: false,
      note: note || { id: '', title: p.title || '', body: '', attachments: [] },
      analysis: { concepts: [], insights: [], leans: [], stats: { words: 0 } },
      onClose: () => { if (walkId) openWalk(walkId, walkCursor); },
      onSavePathway: steps => offerSave(steps, { noteId: note && note.id })
    });
  }

  function offerAttach(noteId) {
    attachNoteId = noteId;
    const list = $('#path-pick-list');
    const all = Pathways.all();
    list.innerHTML = all.length
      ? all.map(p => `<button type="button" data-pick="${esc(p.id)}">${esc(p.title || 'Untitled pathway')} · ${p.steps.length} steps</button>`).join('')
      : '<p class="lede">No pathways yet. Start a new one.</p>';
    $('#path-pick-scrim').classList.add('on');
  }

  function attachTo(pathwayId) {
    if (!attachNoteId) return;
    const n = Notes.get(attachNoteId);
    Pathways.linkNote(pathwayId, attachNoteId);
    if (n) {
      Pathways.addStep(pathwayId, {
        id: 'n:' + n.id,
        type: 'note-other',
        ref: n.id,
        noteId: n.id,
        label: n.title || 'Untitled',
        category: 'resonance',
        sub: 'Note'
      });
    }
    $('#path-pick-scrim').classList.remove('on');
    attachNoteId = null;
    toast('Added to the pathway.');
    notify();
    if (walkId === pathwayId) renderWalk();
  }

  function bind() {
    if (bind.done) return;
    bind.done = true;
    const list = $('#path-list');
    if (list) list.addEventListener('click', e => {
      const kill = e.target.closest('[data-forget-path]');
      if (kill) {
        e.preventDefault();
        e.stopPropagation();
        askForgetPath(kill.dataset.forgetPath);
        return;
      }
      const card = e.target.closest('[data-open]');
      if (card) openWalk(card.dataset.open);
    });

    $('#walk-prev').addEventListener('click', () => { if (walkCursor > 0) focusStep(walkCursor - 1); });
    $('#walk-next').addEventListener('click', () => {
      const p = current();
      if (p && walkCursor < p.steps.length - 1) focusStep(walkCursor + 1);
    });
    $('#walk-explore').addEventListener('click', openExplore);
    $('#walk-title').addEventListener('change', () => {
      if (walkId) { Pathways.update(walkId, { title: $('#walk-title').value.trim() }); notify(); }
    });

    $('#walk-notes').addEventListener('click', e => {
      const un = e.target.closest('[data-unlink]');
      if (un && walkId) {
        Pathways.unlinkNote(walkId, un.dataset.unlink);
        notify();
        renderWalk();
        return;
      }
      const drop = e.target.closest('[data-drop-att]');
      if (drop && walkId) {
        Pathways.removeAttachment(walkId, drop.dataset.dropAtt);
        notify();
        renderWalk();
        return;
      }
      const chip = e.target.closest('[data-view]');
      if (chip) peekItem(chip.dataset.view, chip.dataset.id);
    });
    $('#walk-peek').addEventListener('click', e => {
      if (e.target.closest('[data-peek-close]')) closePeek();
    });

    $('#walk-add-note').addEventListener('click', () => {
      const panel = $('#walk-note-panel');
      const opening = panel.hidden;
      togglePanel('#walk-note-panel');
      if (!opening) return;
      const notes = Notes.all();
      $('#walk-picker').innerHTML = notes.length
        ? notes.map(n => `<button type="button" data-add-note="${esc(n.id)}">${esc(n.title || 'Untitled')}</button>`).join('')
        : '<p class="gx-lede">No notes yet.</p>';
    });
    $('#walk-note-done').addEventListener('click', closeAddPanels);
    $('#walk-picker').addEventListener('click', e => {
      const b = e.target.closest('[data-add-note]');
      if (!b || !walkId) return;
      const n = Notes.get(b.dataset.addNote);
      if (!n) return;
      Pathways.addStep(walkId, {
        id: 'n:' + n.id, type: 'note-other', ref: n.id, noteId: n.id,
        label: n.title || 'Untitled', category: 'resonance', sub: 'Note'
      }, walkCursor);
      walkCursor = Math.min((current().steps.length - 1), walkCursor + 1);
      notify();
      renderWalk();
    });

    $('#walk-add-media').addEventListener('click', () => togglePanel('#walk-media-panel'));
    $('#walk-media-done').addEventListener('click', closeAddPanels);
    $('#walk-media-choose').addEventListener('click', () => $('#path-file').click());
    $('#path-file').addEventListener('change', async e => {
      const files = Array.from(e.target.files || []);
      e.target.value = '';
      if (!walkId || !files.length) return;
      if (!Media.supported()) { toast('This browser will not store media locally.'); return; }
      for (const f of files) {
        const rec = Pathways.addAttachment(walkId, {
          kind: Media.kindOf(f), name: f.name, mime: f.type, size: f.size
        });
        try { await Media.put(rec.id, f); }
        catch (err) { Pathways.removeAttachment(walkId, rec.id); continue; }
        Pathways.addStep(walkId, {
          id: rec.id, type: 'media', ref: rec.id,
          label: rec.name, category: 'resonance', sub: rec.kind
        }, walkCursor);
        walkCursor++;
      }
      notify();
      renderWalk();
    });

    $('#walk-add-link').addEventListener('click', () => {
      const f = $('#walk-link-form');
      const opening = f.hidden;
      togglePanel('#walk-link-form');
      if (opening) $('#walk-link-url').focus();
    });
    $('#walk-link-cancel').addEventListener('click', closeAddPanels);
    $('#walk-link-form').addEventListener('submit', e => {
      e.preventDefault();
      if (!walkId) return;
      let url = $('#walk-link-url').value.trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      const rec = Pathways.addAttachment(walkId, {
        kind: 'link', url, title: $('#walk-link-title').value.trim() || ''
      });
      Pathways.addStep(walkId, {
        id: rec.id, type: 'link', ref: rec.id,
        label: rec.title || url, category: 'lineage', sub: 'Link'
      }, walkCursor);
      $('#walk-link-url').value = '';
      $('#walk-link-title').value = '';
      walkCursor++;
      notify();
      renderWalk();
    });

    $('#path-save-cancel').addEventListener('click', () => $('#path-save-scrim').classList.remove('on'));
    $('#path-save-confirm').addEventListener('click', confirmSave);
    $('#path-save-scrim').addEventListener('click', e => {
      if (e.target === $('#path-save-scrim')) $('#path-save-scrim').classList.remove('on');
    });
    $('#path-save-name').addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); confirmSave(); }
    });

    $('#path-pick-cancel').addEventListener('click', () => $('#path-pick-scrim').classList.remove('on'));
    $('#path-pick-new').addEventListener('click', () => {
      if (!attachNoteId) return;
      const n = Notes.get(attachNoteId);
      const rec = Pathways.create({
        title: (n && n.title) || 'Untitled pathway',
        steps: [],
        noteIds: [attachNoteId]
      });
      attachTo(rec.id);
    });
    $('#path-pick-list').addEventListener('click', e => {
      const b = e.target.closest('[data-pick]');
      if (b) attachTo(b.dataset.pick);
    });
    $('#path-pick-scrim').addEventListener('click', e => {
      if (e.target === $('#path-pick-scrim')) $('#path-pick-scrim').classList.remove('on');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();

  window.PalinodePathways = {
    offerSave, showList, hideList, enter, leave, openWalk, closeWalk,
    isListOpen, isWalkOpen, refresh: renderList,
    offerAttach, askForgetPath,
    onChange: null,
    onOpenNote: null
  };
})();
