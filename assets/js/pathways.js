/* ============================================================
   Palinode — Pathways

   A pathway is a curated walk: the trail you kept, in that
   order. The library lists them; the reader steps through one
   at a time; Explore can open the same walk as a focused graph.
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

  function showList() {
    $('#pathway-walk').hidden = true;
    walkId = null;
    renderList();
    $('#pathways').hidden = false;
  }

  function hideList() { $('#pathways').hidden = true; }

  function isListOpen() { return !$('#pathways').hidden; }
  function isWalkOpen() { return !$('#pathway-walk').hidden; }

  function renderList() {
    const list = $('#path-list');
    if (!list) return;
    const all = Pathways.all();
    if (!all.length) {
      list.innerHTML = '<p class="path-empty">No pathways yet. Explore a note, trim the trail, and save it.</p>';
      return;
    }
    list.innerHTML = all.map(p => `
      <button class="path-card" data-open="${esc(p.id)}" type="button">
        <h4>${esc(p.title || 'Untitled pathway')}</h4>
        <p>${p.steps.length} step${p.steps.length === 1 ? '' : 's'} · ${fmt(p.updated)}</p>
        <span class="forget" data-forget-path="${esc(p.id)}" title="Delete pathway">×</span>
      </button>`).join('');
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
    hideList();
    walkId = id;
    walkCursor = Math.max(0, Math.min(Math.max(0, p.steps.length - 1), at || 0));
    $('#pathway-walk').hidden = false;
    $('#walk-title').value = p.title || '';
    renderWalk();
  }

  function closeWalk(opts) {
    $('#pathway-walk').hidden = true;
    walkId = null;
    if (!opts || opts.toList !== false) showList();
  }

  function current() { return walkId ? Pathways.get(walkId) : null; }

  function renderWalk() {
    const p = current();
    if (!p) return;
    const steps = p.steps || [];
    if (!steps.length) {
      $('#walk-body').innerHTML = '<p class="gx-lede">This pathway has no steps yet. Add a note or media, or save a trail from Explore.</p>';
      $('#walk-pos').textContent = '0 / 0';
      $('#walk-prev').disabled = true;
      $('#walk-next').disabled = true;
    } else {
      if (walkCursor >= steps.length) walkCursor = steps.length - 1;
      const step = steps[walkCursor];
      $('#walk-body').innerHTML = stepHTML(step, p);
      fillMedia($('#walk-body'));
      $('#walk-pos').textContent = (walkCursor + 1) + ' / ' + steps.length;
      $('#walk-prev').disabled = walkCursor <= 0;
      $('#walk-next').disabled = walkCursor >= steps.length - 1;
    }
    renderLinked(p);
    $('#walk-picker').hidden = true;
    $('#walk-link-form').hidden = true;
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

  function renderLinked(p) {
    const box = $('#walk-notes');
    const notes = (p.noteIds || []).map(id => Notes.get(id)).filter(Boolean);
    box.innerHTML = notes.map(n => `
      <span class="saved-chip" data-open-note="${esc(n.id)}">
        <span class="t">${esc(n.title || 'Untitled')}</span>
        <span class="x" data-unlink="${esc(n.id)}" title="Unlink">×</span>
      </span>`).join('');
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

  document.addEventListener('DOMContentLoaded', () => {
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

    $('#path-close').addEventListener('click', hideList);
    $('#walk-close').addEventListener('click', () => closeWalk({ toList: true }));
    $('#walk-prev').addEventListener('click', () => { if (walkCursor > 0) { walkCursor--; renderWalk(); } });
    $('#walk-next').addEventListener('click', () => {
      const p = current();
      if (p && walkCursor < p.steps.length - 1) { walkCursor++; renderWalk(); }
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
      const open = e.target.closest('[data-open-note]');
      if (open && typeof window.PalinodePathways.onOpenNote === 'function')
        window.PalinodePathways.onOpenNote(open.dataset.openNote);
    });

    $('#walk-add-note').addEventListener('click', () => {
      const box = $('#walk-picker');
      const notes = Notes.all();
      box.hidden = !box.hidden;
      box.innerHTML = notes.length
        ? notes.map(n => `<button type="button" data-add-note="${esc(n.id)}">${esc(n.title || 'Untitled')}</button>`).join('')
        : '<p class="gx-lede">No notes yet.</p>';
    });
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

    $('#walk-add-media').addEventListener('click', () => $('#path-file').click());
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
      f.hidden = !f.hidden;
      if (!f.hidden) $('#walk-link-url').focus();
    });
    $('#walk-link-cancel').addEventListener('click', () => { $('#walk-link-form').hidden = true; });
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
  });

  window.PalinodePathways = {
    offerSave, showList, hideList, openWalk, closeWalk,
    isListOpen, isWalkOpen, refresh: renderList,
    offerAttach, askForgetPath,
    onChange: null,
    onOpenNote: null
  };
})();
