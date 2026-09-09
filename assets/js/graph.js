/* ============================================================
   Palinode — Exploration Graph

   Your note sits at the centre. What it touched radiates out;
   what it did not touch sits one ring further, unlabelled, as
   an invitation. Selecting anything expands the field from it,
   so the graph grows as you explore and never dead-ends.

   The important edge is work → concept. Your note reaches a
   book through one idea, and the book carries you back out to
   ideas your note never contained. That is where discovery
   stops being a summary of what you already wrote.
   ============================================================ */

(function () {
  const { CONCEPTS, CATEGORIES, TRADITIONS } = window.PalinodeCorpus;
  const LIB = window.PalinodeLibrary;
  const Khora = window.PalinodeKhora;
  const Saved  = window.PalinodeStore.Saved;
  const Notes  = window.PalinodeStore.Notes;
  const Attach = window.PalinodeStore.Attach;
  const Belief = window.PalinodeStore.Belief;
  const Media  = window.PalinodeMedia;
  const BEL    = window.PalinodeBeliefs;
  const BSCORE = window.PalinodeBeliefScore;
  const SPECUI = window.PalinodeSpectrumUI;

  /* ================= indexes ================= */

  const CONCEPT = {};
  CONCEPTS.forEach(c => { CONCEPT[c.id] = c; });

  const WORKS_OF   = {};   // conceptId -> [workId]
  const CONCEPTS_OF = {};  // workId    -> [conceptId]
  const BY_TRADITION = {}; // tradition -> [conceptId]

  CONCEPTS.forEach(c => {
    WORKS_OF[c.id] = [];
    (c.sources || []).forEach(src => {
      const w = LIB.resolve(src);
      WORKS_OF[c.id].push(w.id);
      (CONCEPTS_OF[w.id] = CONCEPTS_OF[w.id] || []).push(c.id);
    });
    (BY_TRADITION[c.tradition] = BY_TRADITION[c.tradition] || []).push(c.id);
  });

  const WORK = {};
  CONCEPTS.forEach(c => (c.sources || []).forEach(src => {
    const w = LIB.resolve(src);
    if (!WORK[w.id]) WORK[w.id] = w;
  }));

  /* Belief spectra are a node type of their own: a concept sits on one or
     more of them, and a spectrum leads back out to every other concept in
     the corpus that touches it. That is the edge that takes you from an
     idea you happened to write about to a question you did not.          */
  const AXIS = {};
  const CONCEPTS_BY_AXIS = {};   // axisId -> [conceptId]
  const AXES_BY_BRANCH   = {};   // branch -> [axisId]

  BEL.SPECTRA.forEach(s => {
    AXIS[s.id] = s;
    CONCEPTS_BY_AXIS[s.id] = [];
    (AXES_BY_BRANCH[s.branch] = AXES_BY_BRANCH[s.branch] || []).push(s.id);
  });
  Object.keys(BEL.CONCEPT_AXES).forEach(conceptId => {
    if (!CONCEPT[conceptId]) return;
    BEL.CONCEPT_AXES[conceptId].forEach(a => {
      if (CONCEPTS_BY_AXIS[a.id]) CONCEPTS_BY_AXIS[a.id].push(conceptId);
    });
  });

  /* ================= graph state ================= */

  const NID = { note: 'note' };
  const cid = id => 'c:' + id;
  const wid = id => 'w:' + id;
  const tid = id => 't:' + id;
  const nid = id => 'n:' + id;      // another note
  const aid = id => 'a:' + id;      // an attachment on a note
  const sid = id => 's:' + id;      // a belief spectrum

  function conceptOf(ref) {
    if (!ref) return null;
    if (CONCEPT[ref]) return CONCEPT[ref];
    if (!Khora) return null;
    return Khora.getConcept(ref)
      || (Khora.liveIdFor(ref) && Khora.getConcept(Khora.liveIdFor(ref)))
      || null;
  }
  function workOf(ref) {
    if (!ref) return null;
    if (WORK[ref]) return WORK[ref];
    if (LIB.works[ref]) return LIB.works[ref];
    if (!Khora) return null;
    return Khora.getWork(ref) || null;
  }
  function liveUuid(node) {
    if (!Khora || !node) return null;
    if (Khora.isUuid(node.ref)) return node.ref;
    return Khora.liveIdFor(node.ref);
  }

  // What this note leans, keyed by axis. Tentative: a lean is a reading of
  // the passage and never a placement.
  const leanOf = axisId =>
    (ctx && ctx.analysis && ctx.analysis.leans || []).find(l => l.axisId === axisId) || null;

  // conceptId -> [noteId] across the whole journal, built when the canvas opens
  let NOTES_BY_CONCEPT = {};
  let NOTE_OF = {};                 // noteId -> note record
  let ATT_OF = {};                  // attachmentId -> { att, noteId }

  let nodes = new Map();
  let edges = [];
  let ctx = null;          // { note, analysis, onWrite, onRead, onReadingRoom }
  let selected = null;
  let trail = [];
  let trailCursor = -1;
  let connectionsOn = false;
  let sim = null;
  let view = { s: 1, tx: 0, ty: 0 };
  let root = null, elEdges = null, elNodes = null, elPanel = null, elTrail = null;
  let W = 0, H = 0;

  const MAX_NODES = 130;

  function addNode(n) {
    if (nodes.has(n.id)) return nodes.get(n.id);
    // Placed on a ring around the parent at roughly its resting distance and
    // spread by angle, so a new node barely has to travel once it appears.
    const r = n.spawnR ?? (150 + Math.random() * 60);
    const a = n.spawnA ?? (Math.random() * Math.PI * 2);
    nodes.set(n.id, Object.assign({
      x: (n.px ?? 0) + Math.cos(a) * r,
      y: (n.py ?? 0) + Math.sin(a) * r,
      vx: 0, vy: 0, state: 'frontier', depth: 9, fresh: true
    }, n));
    return nodes.get(n.id);
  }

  function addEdge(a, b, kind) {
    if (a === b) return;
    const key = a < b ? a + '|' + b : b + '|' + a;
    if (edges.some(e => e.key === key)) return;
    edges.push({ key, a, b, kind });
  }

  /* ================= neighbours ================= */
  // Everything a node can lead to. Returned unfiltered; the caller
  // decides how many to admit.

  function neighbours(node) {
    const out = [];
    if (node.type === 'note') {
      (ctx.analysis.concepts || []).forEach(c =>
        out.push({ id: cid(c.id), type: 'concept', ref: c.id, kind: 'detected' }));
      // what this note actually holds
      Attach.all(ctx.note.id).forEach(a =>
        out.push({ id: aid(a.id), type: a.kind === 'link' ? 'link' : 'media', ref: a.id, kind: 'holds' }));
      return out;
    }

    // another note in the journal: its own concepts, and what it holds
    if (node.type === 'note-other') {
      const n = NOTE_OF[node.ref];
      if (!n) return out;
      (n.conceptIds || []).forEach(c => CONCEPT[c] &&
        out.push({ id: cid(c), type: 'concept', ref: c, kind: 'detected' }));
      (n.attachments || []).forEach(a =>
        out.push({ id: aid(a.id), type: a.kind === 'link' ? 'link' : 'media', ref: a.id, kind: 'holds' }));
      return out;
    }

    // media and links lead back to whatever notes hold them
    if (node.type === 'media' || node.type === 'link') {
      const owner = ATT_OF[node.ref];
      if (owner && owner.noteId !== ctx.note.id)
        out.push({ id: nid(owner.noteId), type: 'note-other', ref: owner.noteId, kind: 'held-by' });
      else if (owner) out.push({ id: NID.note, type: 'note', ref: 'note', kind: 'held-by' });
      return out;
    }
    if (node.type === 'concept') {
      const c = conceptOf(node.ref);
      if (c) {
        (c.kin || []).forEach(k => conceptOf(k) &&
          out.push({ id: cid(k), type: 'concept', ref: k, kind: 'kin' }));
        (WORKS_OF[c.id] || []).forEach(w =>
          out.push({ id: wid(w), type: 'work', ref: w, kind: 'cites' }));
        (NOTES_BY_CONCEPT[c.id] || []).forEach(nId => {
          if (ctx.note && nId !== ctx.note.id)
            out.push({ id: nid(nId), type: 'note-other', ref: nId, kind: 'also-wrote' });
        });
        if (!c.live && BEL.axesForConcept(c.id)) {
          BEL.axesForConcept(c.id).forEach(a =>
            out.push({ id: sid(a.id), type: 'spectrum', ref: a.id, kind: 'sits-on' }));
        }
        if (c.tradition) out.push({ id: tid(c.tradition), type: 'tradition', ref: c.tradition, kind: 'tradition' });
      }
      const uuid = liveUuid(node);
      if (uuid && Khora) {
        Khora.neighborsOf(uuid).forEach(ent => {
          const seed = Khora.toGraphSeed(Khora.overlayFromLocal(ent) || ent);
          if (out.some(x => x.id === seed.id)) return;
          out.push({
            id: seed.id, type: seed.type, ref: seed.ref,
            kind: seed.type === 'work' ? 'cites' : 'kin'
          });
        });
      }
      return out;
    }
    if (node.type === 'spectrum') {
      // Where a spectrum leads: every other concept that stands on it, and
      // its siblings in the same branch of philosophy.
      (CONCEPTS_BY_AXIS[node.ref] || []).forEach(c =>
        out.push({ id: cid(c), type: 'concept', ref: c, kind: 'touches' }));
      const s = AXIS[node.ref];
      if (s) (AXES_BY_BRANCH[s.branch] || []).forEach(a => {
        if (a !== node.ref) out.push({ id: sid(a), type: 'spectrum', ref: a, kind: 'branch' });
      });
      return out;
    }
    if (node.type === 'work') {
      (CONCEPTS_OF[node.ref] || []).forEach(c =>
        out.push({ id: cid(c), type: 'concept', ref: c, kind: 'read-by' }));
      const uuid = liveUuid(node);
      if (uuid && Khora) {
        Khora.neighborsOf(uuid).forEach(ent => {
          const seed = Khora.toGraphSeed(Khora.overlayFromLocal(ent) || ent);
          if (out.some(x => x.id === seed.id)) return;
          out.push({
            id: seed.id, type: seed.type, ref: seed.ref,
            kind: seed.type === 'work' ? 'cites' : 'read-by'
          });
        });
      }
      return out;
    }
    if (node.type === 'tradition') {
      (BY_TRADITION[node.ref] || []).forEach(c =>
        out.push({ id: cid(c), type: 'concept', ref: c, kind: 'within' }));
      return out;
    }
    return out;
  }

  function label(n) {
    if (n.type === 'note')      return ctx.note.title || 'This note';
    if (n.type === 'note-other') return (NOTE_OF[n.ref] && NOTE_OF[n.ref].title) || 'Untitled note';
    if (n.type === 'media' || n.type === 'link') {
      const o = ATT_OF[n.ref];
      if (!o) return 'Attachment';
      return o.att.kind === 'link' ? (o.att.title || hostOf(o.att.url)) : o.att.name;
    }
    if (n.type === 'concept') {
      const c = conceptOf(n.ref);
      return c ? c.label : (n.label || n.ref);
    }
    if (n.type === 'work') {
      const w = workOf(n.ref);
      return w ? w.title : (n.label || n.ref);
    }
    if (n.type === 'tradition') return TRADITIONS[n.ref] || n.ref;
    if (n.type === 'spectrum')  return AXIS[n.ref] ? AXIS[n.ref].title : n.ref;
    return n.ref;
  }

  function category(n) {
    if (n.type === 'concept') {
      const c = conceptOf(n.ref);
      if (c) return c.category;
    }
    if (n.type === 'work') return 'lineage';
    if (n.type === 'tradition') return 'stance';
    // A spectrum is a question about where you stand, which is the stance lane.
    if (n.type === 'spectrum') return 'stance';
    if (n.type === 'link') return 'lineage';
    return 'resonance';       // notes, other notes and media are yours
  }

  function kicker(n) {
    if (n.type === 'note') return 'Your note';
    if (n.type === 'note-other') return 'Another entry';
    if (n.type === 'concept') {
      const c = conceptOf(n.ref);
      if (!c) return n.sub || '';
      return TRADITIONS[c.tradition] || c.node_type || '';
    }
    if (n.type === 'work') {
      const w = workOf(n.ref);
      return w ? w.author : (n.sub || '');
    }
    if (n.type === 'tradition') return 'Tradition';
    if (n.type === 'spectrum') return AXIS[n.ref] ? AXIS[n.ref].branch : 'Spectrum';
    if (n.type === 'link') { const o = ATT_OF[n.ref]; return o ? hostOf(o.att.url) : 'Link'; }
    if (n.type === 'media') { const o = ATT_OF[n.ref]; return o ? o.att.kind : 'Media'; }
    return '';
  }

  const hostOf = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return u; } };

  /* ================= the journal index =================
     Older notes were saved before concept ids were recorded, so they are
     re-read once here. The rule engine is cheap and deterministic, and the
     result is written back so this only ever happens to a note once.      */

  async function buildJournalIndex() {
    NOTES_BY_CONCEPT = {}; NOTE_OF = {}; ATT_OF = {};
    for (const n of Notes.all()) {
      NOTE_OF[n.id] = n;
      (n.attachments || []).forEach(a => { ATT_OF[a.id] = { att: a, noteId: n.id }; });

      let ids = n.conceptIds;
      if (!ids && (n.body || '').trim()) {
        const a = await window.PalinodeEngine.analyze(n.body);
        ids = (a.concepts || []).map(c => c.id);
        Notes.update(n.id, { conceptIds: ids });
      }
      (ids || []).forEach(c => {
        (NOTES_BY_CONCEPT[c] = NOTES_BY_CONCEPT[c] || []).push(n.id);
      });
    }
  }

  // Thumbnails come out of IndexedDB, so they are resolved once and cached
  // on the node; sync() only reads what is already there.
  async function resolveThumb(node) {
    if (node._url !== undefined) return;
    node._url = null;
    const o = ATT_OF[node.ref];
    if (!o || o.att.kind === 'link' || o.att.kind === 'audio' || o.att.kind === 'file') return;
    const u = await Media.url(o.att.id);
    if (u) { node._url = u; node._sz = undefined; markDirty(); }
  }

  /* ================= expansion ================= */

  function expand(node, limit) {
    const cap = limit || 9;
    const detected = new Set((ctx.analysis.concepts || []).map(c => cid(c.id)));
    let admitted = 0;

    // Neighbours already on the canvas only need their edge drawn.
    const fresh = [];
    neighbours(node).forEach(nb => {
      if (nodes.has(nb.id)) { addEdge(node.id, nb.id, nb.kind); return; }
      fresh.push(nb);
    });

    // Your own other entries first, then the spectra this passage leans on,
    // then what the note never reached, then what it already contains.
    const rank = nb =>
      nb.kind === 'also-wrote' ? 0 :
      nb.type === 'media' || nb.type === 'link' ? 1 :
      nb.kind === 'sits-on' ? (leanOf(nb.ref) ? 1 : 2) :
      detected.has(nb.id) ? 3 : 2;
    fresh.sort((a, b) => rank(a) - rank(b));

    // Fan the arrivals around the parent, biased away from where it came from
    const room = Math.min(cap, fresh.length);
    const base = Math.atan2(node.y, node.x);
    let slot = 0;

    for (const nb of fresh) {
      if (admitted >= cap || nodes.size >= MAX_NODES) break;
      const spread = room > 1 ? (slot / room) * Math.PI * 1.7 - Math.PI * 0.85 : 0;
      const n = addNode({
        id: nb.id, type: nb.type, ref: nb.ref,
        px: node.x, py: node.y,
        spawnA: base + spread + (Math.random() - .5) * 0.22,
        spawnR: (REST[nb.kind] || 190) * (0.9 + Math.random() * 0.2),
        depth: (node.depth || 0) + 1,
        inNote: detected.has(nb.id)
      });
      slot++;
      n.label = label(n);
      n.category = category(n);
      addEdge(node.id, nb.id, nb.kind);
      if (n.type === 'media') resolveThumb(n);
      admitted++;
    }

    node.state = 'open';
    nodes.forEach(x => { x._sz = undefined; });
    prune();
    markDirty();
    kick(admitted ? 0.55 : 0.3);
    return admitted;
  }

  async function expandLive(node) {
    if (!Khora || !node) return 0;
    if (node.type !== 'concept' && node.type !== 'work') return 0;
    const uuid = liveUuid(node);
    if (!uuid) return 0;
    if (node._liveExpand) return 0;
    node._liveExpand = true;
    const waiting = !node._panelReady;
    const shownAt = waiting ? performance.now() : 0;
    try {
      await Khora.expand(uuid, ['Node', 'Item'], true);
      if (node.type === 'concept') {
        try { await Khora.explain(uuid); } catch (e) { /* explain is optional */ }
      } else {
        try { await Khora.summary(uuid); } catch (e) { /* summary is optional */ }
      }
      if (!root) return 0;
      const added = expand(node, 9);
      node._panelReady = true;
      if (waiting) await holdSkeleton(shownAt);
      if (selected === node.id) detail(node.id);
      notify();
      return added;
    } catch (e) {
      node._liveExpand = false;
      node._panelReady = true;
      if (waiting) await holdSkeleton(shownAt);
      if (selected === node.id) detail(node.id);
      return 0;
    }
  }

  // Keep the field legible: drop the most distant frontier nodes first,
  // never anything selected, pinned, on the trail, or in the note.
  function prune() {
    if (nodes.size <= MAX_NODES) return;
    const safe = new Set([NID.note, selected, ...trail]);
    const droppable = [...nodes.values()]
      .filter(n => n.state === 'frontier' && !safe.has(n.id) && !n.inNote && !isSaved(n.id))
      .filter(n => n.type !== 'media' && n.type !== 'link')
      .sort((a, b) => b.depth - a.depth);
    while (nodes.size > MAX_NODES && droppable.length) {
      const n = droppable.pop();
      nodes.delete(n.id);
      edges = edges.filter(e => e.a !== n.id && e.b !== n.id);
      markDirty();
    }
  }

  /* ================= layout ================= */

  const REST = { detected: 220, kin: 190, cites: 165, 'read-by': 195, tradition: 250, within: 205,
                 holds: 150, 'held-by': 150, 'also-wrote': 235,
                 'sits-on': 210, touches: 200, branch: 240, path: 210 };

  // Effective radius. A labelled node occupies a pill roughly as wide as its
  // text, so it has to shoulder more room than a bare orb.
  function radius(n) {
    if (n.type === 'note') return 118;
    if (n.type === 'media') return 58;
    if (!showLabel(n)) return 13;
    return 34 + Math.min(96, (n.label || '').length * 3.1);
  }

  function kick(a) { if (sim) sim.alpha = Math.max(sim.alpha, a === undefined ? 1 : a); }

  function tick() {
    if (!sim || sim.alpha < 0.004) return;
    const arr = [...nodes.values()];
    const n = arr.length;

    for (let i = 0; i < n; i++) {
      const a = arr[i];
      for (let j = i + 1; j < n; j++) {
        const b = arr[j];
        let dx = b.x - a.x, dy = b.y - a.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) { dx = (Math.random() - .5); dy = (Math.random() - .5); d2 = 1; }
        const d = Math.sqrt(d2);
        const rep = (78 * (radius(a) + radius(b))) / d2;
        const fx = (dx / d) * rep, fy = (dy / d) * rep;
        a.vx -= fx; a.vy -= fy;
        b.vx += fx; b.vy += fy;
      }
    }

    edges.forEach(e => {
      const a = nodes.get(e.a), b = nodes.get(e.b);
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const d = Math.max(1, Math.hypot(dx, dy));
      const k = (d - (REST[e.kind] || 195)) * 0.013;
      const fx = (dx / d) * k, fy = (dy / d) * k;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    });

    arr.forEach(nd => {
      if (nd.id === NID.note) { nd.vx -= nd.x * 0.06; nd.vy -= nd.y * 0.06; }
      else { nd.vx -= nd.x * 0.0011; nd.vy -= nd.y * 0.0011; }
      if (nd.held || nd.focusHold) { nd.vx = nd.vy = 0; return; }
      nd.vx *= 0.82; nd.vy *= 0.82;
      nd.x += nd.vx * sim.alpha;
      nd.y += nd.vy * sim.alpha;
    });

    // release the focused node once the field around it has calmed
    if (sim.alpha < 0.18) nodes.forEach(nd => { nd.focusHold = false; });
    sim.alpha *= 0.975;
  }

  /* ================= rendering ================= */

  const SIZE = n =>
    n.type === 'note' ? 34 :
    n.type === 'media' ? (n._url ? 46 : 14) :
    n.type === 'note-other' ? 22 :
    n.type === 'tradition' ? 11 :
    n.type === 'spectrum' ? (leanOf(n.ref) ? 16 : 12) :
    n.type === 'link' ? 12 :
    n.state === 'open' || n.inNote || n.id === selected ? 15 : 9;

  const isCorpus = () => !!(ctx && ctx.mode === 'corpus');
  const isSaved = id => !!(ctx && ctx.note && ctx.note.id && Saved.has(ctx.note.id, id));

  let corpusQ = '';
  let corpusCats = new Set();
  let corpusSort = 'name';

  const showLabel = n =>
    n.type === 'note' || n.type === 'note-other' || n.type === 'link' ||
    n.type === 'spectrum' ||
    n.inNote || n.state === 'open' ||
    n.id === selected || n.id === hoverId || isSaved(n.id);

  let hoverId = null;

  // The canvas used to rebuild every node's markup on every frame. With
  // multi-layer gradient orbs that meant re-parsing and re-rasterising the
  // whole field 60 times a second. Elements are now created once and only
  // their transform is touched per frame.
  const nodeEls = new Map();
  const edgeEls = new Map();
  let dirty = true;
  let lastScale = -1;
  function markDirty() { dirty = true; }

  function project(n, cx, cy) {
    return { x: cx + (n.x + view.tx) * view.s, y: cy + (n.y + view.ty) * view.s };
  }

  // Reconcile the DOM with the model. Only runs when the field actually
  // changes — a node added or pruned, a selection, a hover, a new label.
  function sync() {
    for (const [id, el] of nodeEls) {
      if (!nodes.has(id)) { el.remove(); nodeEls.delete(id); }
    }
    for (const [key, el] of edgeEls) {
      if (!edges.some(e => e.key === key)) { el.remove(); edgeEls.delete(key); }
    }

    const keep = focusSet();

    nodes.forEach(n => {
      let el = nodeEls.get(n.id);
      if (!el) {
        el = document.createElement('div');
        el.dataset.id = n.id;
        el.innerHTML = '<i class="gx-orb"></i><span class="gx-label"></span>';
        el.classList.add('gx-enter');
        elNodes.appendChild(el);
        nodeEls.set(n.id, el);
        // let it land, then fade in on the next frame
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('gx-enter')));
      }
      n.fresh = false;
      const lab = showLabel(n);
      const cls = ['gx-node', 'gx-' + n.type];
      if (n.id === selected) cls.push('sel');
      if (n.inNote) cls.push('in-note');
      if (isSaved(n.id)) cls.push('saved');
      if (n.type === 'spectrum' && leanOf(n.ref)) cls.push('leaning');
      if (lab) cls.push('labelled');
      if (keep && !keep.has(n.id)) cls.push('dim');
      if (el.classList.contains('gx-enter')) cls.push('gx-enter');
      const next = cls.join(' ');
      if (el.className !== next) el.className = next;
      el.style.setProperty('--c', 'var(--' + n.category + ')');
      if (n.type === 'media') {
        const orb = el.firstChild;
        const bg = n._url ? 'url("' + n._url + '")' : '';
        if (orb.style.backgroundImage !== bg) orb.style.backgroundImage = bg;
      }
      const text = lab ? n.label : '';
      const span = el.lastChild;
      if (span.textContent !== text) span.textContent = text;
    });

    edges.forEach(e => {
      if (edgeEls.has(e.key)) return;
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      elEdges.appendChild(ln);
      edgeEls.set(e.key, ln);
    });
  }

  function paint() {
    if (dirty) { sync(); dirty = false; }

    const panelW = (elPanel && !elPanel.hidden && window.innerWidth > 900) ? elPanel.offsetWidth : 0;
    const cx = (W - panelW) / 2, cy = H / 2;
    const zoomed = view.s !== lastScale;

    nodes.forEach(n => {
      const el = nodeEls.get(n.id);
      if (!el) return;
      const p = project(n, cx, cy);
      // Anchor on the orb, not on the pill. Centring the pill puts a long
      // label's orb well off centre, and edges then terminate in mid-label.
      el.style.transform = 'translate3d(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) +
        'px,0) translate(calc(var(--sz) * -0.5 - 3px), -50%)';
      if (zoomed || n._sz === undefined) {
        const sz = SIZE(n) * Math.max(.7, Math.min(1.25, view.s));
        if (sz !== n._sz) { n._sz = sz; el.style.setProperty('--sz', sz.toFixed(1) + 'px'); }
      }
    });

    edges.forEach(e => {
      const ln = edgeEls.get(e.key);
      const a = nodes.get(e.a), b = nodes.get(e.b);
      if (!ln || !a || !b) return;
      const pa = project(a, cx, cy), pb = project(b, cx, cy);
      ln.setAttribute('x1', pa.x.toFixed(1)); ln.setAttribute('y1', pa.y.toFixed(1));
      ln.setAttribute('x2', pb.x.toFixed(1)); ln.setAttribute('y2', pb.y.toFixed(1));
      const lit = selected && (e.a === selected || e.b === selected);
      if (e._lit !== lit) {
        e._lit = lit;
        ln.setAttribute('stroke', 'rgba(255,255,255,' + (lit ? .38 : .05) + ')');
        ln.setAttribute('stroke-width', lit ? 1.4 : 1);
      }
    });

    lastScale = view.s;
  }

  const escapeHtml = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function loop() {
    if (!root) return;
    tick();
    paint();
    requestAnimationFrame(loop);
  }

  /* ================= spectra in the panel =================
     Same two marks as the Beliefs tab, and they must keep meaning the
     same thing out here: dashed is this passage leaning, solid is where
     answered items have placed the journal. */

  const specTrack = (axis, opts) => SPECUI.track(axis, opts);
  const specPoles = (axis, side) => SPECUI.poles(axis, side);

  function specLine(axisId, lean, placed) {
    const axis = AXIS[axisId];
    if (!lean) return placed ? BSCORE.describe(axisId, placed) : axis.summary;

    const near = BEL.argumentsNear(axisId, lean.delta, 1)[0];
    const passage = lean.split
      ? 'This note pulls both ways here — ' + lean.n + ' readings disagreeing with each other.'
      : 'This note leans toward ' + (lean.delta < 0 ? axis.left : axis.right) +
        (near ? ', nearest ' + near.name : '') + '. Tentative.';
    if (!placed) return passage;
    // Both marks are on the track, so the line has to say which is which.
    const where = placed.leaning === 'balanced'
      ? 'in the middle'
      : 'toward ' + (placed.score < 0 ? axis.left : axis.right);
    return passage + ' Your answers put the journal mark ' + where + '.';
  }

  // A concept is never only itself: it stands somewhere on the canonical
  // dichotomies, which is the door from "an idea I wrote about" to "a
  // question I have not answered".
  function conceptAxesSection(conceptId) {
    const axes = BEL.axesForConcept(conceptId);
    if (!axes.length) return '';
    return `<div class="gx-sec"><h4>Sits on</h4><div class="gx-more">
      ${axes.map(a => {
        const s = AXIS[a.id];
        if (!s) return '';
        const placed = Belief.score(a.id);
        return `<button class="gx-more-row" data-goto="${sid(a.id)}" data-type="spectrum" data-ref="${escapeHtml(a.id)}">
          <span class="orb sm" style="--c:var(--stance)"></span>
          <span class="t">${escapeHtml(s.title)}</span>
          <span class="s">${placed ? escapeHtml(BSCORE.label(placed.leaning))
                          : leanOf(a.id) ? 'leaning' : escapeHtml(s.branch)}</span></button>`;
      }).join('')}
    </div></div>`;
  }

  /* ================= detail panel ================= */

  const SKEL_MIN = 280;
  function panelPending(n) {
    return !!(n && (n.type === 'concept' || n.type === 'work') && liveUuid(n) && !n._panelReady);
  }
  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  function setPanelLoading(on) {
    if (!elPanel) return;
    elPanel.classList.toggle('is-loading', !!on);
    if (on) elPanel.setAttribute('aria-busy', 'true');
    else elPanel.removeAttribute('aria-busy');
  }
  function holdSkeleton(shownAt) {
    if (reducedMotion()) return Promise.resolve();
    const wait = Math.max(0, SKEL_MIN - (performance.now() - shownAt));
    return wait ? new Promise(r => setTimeout(r, wait)) : Promise.resolve();
  }

  function detail(id) {
    const n = nodes.get(id);
    if (!n) { setPanelLoading(false); elPanel.hidden = true; return; }
    elPanel.hidden = false;

    if (panelPending(n)) {
      setPanelLoading(true);
      return;
    }
    setPanelLoading(false);

    const orb = c => `<span class="orb sm" style="--c:var(--${c})"></span>`;
    const seen = new Set([id]);
    let unvisited = neighbours(n)
      .filter(nb => { const e = nodes.get(nb.id); return !e || e.state !== 'open'; })
      .filter(nb => { if (seen.has(nb.id)) return false; seen.add(nb.id); return true; });

    if (unvisited.length < 5) unvisited = unvisited.concat(backfill(n, seen, 6 - unvisited.length));
    unvisited = unvisited.slice(0, 6);

    const more = unvisited.length ? `
      <div class="gx-sec">
        <h4>Where this leads</h4>
        <div class="gx-more">
          ${unvisited.map(nb => {
            const tmp = { type: nb.type, ref: nb.ref };
            const lb = label(tmp), ct = category(tmp);
            const sub = nb.type === 'work' && workOf(nb.ref)
              ? workOf(nb.ref).author
              : nb.type === 'spectrum' && AXIS[nb.ref]
                ? (leanOf(nb.ref) ? 'this note leans' : AXIS[nb.ref].branch)
              : nb.type === 'concept' && conceptOf(nb.ref)
                ? (TRADITIONS[conceptOf(nb.ref).tradition] || conceptOf(nb.ref).node_type || '')
                : nb.kind === 'within' ? 'tradition' : '';
            return `<button class="gx-more-row" data-goto="${nb.id}" data-type="${nb.type}" data-ref="${nb.ref}">
              ${orb(ct)}<span class="t">${escapeHtml(lb)}</span>
              ${sub ? `<span class="s">${escapeHtml(sub)}</span>` : ''}</button>`;
          }).join('')}
        </div>
      </div>` : '';

    let body = '';

    if (n.type === 'note') {
      const cs = ctx.analysis.concepts || [];
      body = `
        <div class="gx-kicker">${orb('resonance')}Your note</div>
        <h3>${escapeHtml(ctx.note.title || 'Untitled')}</h3>
        <p class="gx-lede">${escapeHtml((ctx.note.body || '').slice(0, 220))}${(ctx.note.body || '').length > 220 ? '…' : ''}</p>
        <div class="gx-sec"><h4>${cs.length} concept${cs.length === 1 ? '' : 's'} detected</h4>
          <div class="gx-more">${cs.map(c =>
            `<button class="gx-more-row" data-goto="${cid(c.id)}">${orb(c.category)}
              <span class="t">${escapeHtml(c.label)}</span>
              <span class="s">${escapeHtml(TRADITIONS[c.tradition] || '')}</span></button>`).join('')}</div>
        </div>
        ${savedSection()}
        ${heldSection()}`;
    }

    else if (n.type === 'concept') {
      const c = conceptOf(n.ref);
      if (!c) {
        body = `
          <div class="gx-kicker">${orb(n.category || 'resonance')}Opening</div>
          <h3>${escapeHtml(n.label || n.ref)}</h3>
          <p class="gx-lede">Fetching this concept from Khora…</p>`;
      } else {
        const ins = (ctx.analysis.insights || []).find(i => i.conceptId === n.ref);
        const kickerText = TRADITIONS[c.tradition] || c.node_type || '';
        body = `
          <div class="gx-kicker">${orb(c.category)}${escapeHtml(kickerText)}
            ${n.inNote ? '<span class="gx-tag">in your note</span>' : ''}</div>
          <h3>${escapeHtml(c.label)}</h3>
          <p class="gx-question">${escapeHtml(c.turn)}</p>
          ${c.reading ? `<div class="gx-sec"><h4>${ins ? 'How it reads your note' : 'From the graph'}</h4>
            <p class="gx-lede">${escapeHtml(ins ? ins.reading : c.reading)}</p></div>` : (ins ? `<div class="gx-sec"><h4>How it reads your note</h4>
            <p class="gx-lede">${escapeHtml(ins.reading)}</p></div>` : '')}
          ${!c.live ? conceptAxesSection(n.ref) : ''}
          <div class="gx-act">
            <button class="ghost solid" data-act="write" data-ref="${n.ref}">Write on this</button>
            <button class="ghost" data-act="save">${isSaved(n.id) ? 'On a note ✓' : 'Add to note'}</button>
            <button class="ghost" data-act="path">Add to pathway</button>
          </div>
          ${more}`;
      }
    }

    else if (n.type === 'work') {
      const w = workOf(n.ref);
      if (!w) {
        body = `
          <div class="gx-kicker">${orb('lineage')}Opening</div>
          <h3>${escapeHtml(n.label || n.ref)}</h3>
          <p class="gx-lede">Fetching this text from Khora…</p>`;
      } else {
        const rights = w.rights === 'open'
          ? '<span class="rights open"><i></i>Full text free</span>'
          : w.rights === 'restricted'
            ? '<span class="rights restricted"><i></i>In copyright</span>'
            : (w.url ? '<span class="rights open"><i></i>Source</span>' : '');
        body = `
          <div class="gx-kicker">${rights}${w.year ? `<span>${escapeHtml(w.year)}</span>` : ''}</div>
          <h3>${escapeHtml(w.title)}</h3>
          <p class="gx-author">${escapeHtml(w.author || '')}</p>
          ${w.gist ? `<p class="gx-lede">${escapeHtml(w.gist)}</p>` : ''}
          <div class="gx-act">
            <button class="ghost solid" data-act="read" data-ref="${n.ref}">Open in the Reading Room</button>
            <button class="ghost" data-act="save">${isSaved(n.id) ? 'On a note ✓' : 'Add to note'}</button>
            <button class="ghost" data-act="path">Add to pathway</button>
          </div>
          ${more}`;
      }
    }

    else if (n.type === 'note-other') {
      const other = NOTE_OF[n.ref];
      const mine = new Set((ctx.analysis.concepts || []).map(c => c.id));
      const shared = (other.conceptIds || []).filter(c => mine.has(c) && conceptOf(c));
      body = `
        <div class="gx-kicker">${orb('resonance')}Another entry
          <span>${new Date(other.updated).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}</span></div>
        <h3>${escapeHtml(other.title || 'Untitled')}</h3>
        <p class="gx-lede">${escapeHtml((other.body || '').slice(0, 240))}${(other.body || '').length > 240 ? '…' : ''}</p>
        ${shared.length ? `<div class="gx-sec"><h4>You arrived here twice</h4>
          <div class="gx-more">${shared.map(c => `<button class="gx-more-row" data-goto="${cid(c)}">
            <span class="orb sm" style="--c:var(--${conceptOf(c).category})"></span>
            <span class="t">${escapeHtml(conceptOf(c).label)}</span></button>`).join('')}</div></div>` : ''}
        <div class="gx-act">
          <button class="ghost solid" data-act="open-note" data-ref="${escapeHtml(n.ref)}">Open this note</button>
          <button class="ghost" data-act="path">Add to pathway</button>
        </div>
        ${more}`;
    }

    else if (n.type === 'media' || n.type === 'link') {
      const o = ATT_OF[n.ref];
      const a = o ? o.att : null;
      const owner = o ? NOTE_OF[o.noteId] : null;
      if (!a) body = '<h3>Attachment</h3>';
      else if (a.kind === 'link') {
        body = `
          <div class="gx-kicker">${orb('lineage')}Link</div>
          <h3>${escapeHtml(a.title || hostOf(a.url))}</h3>
          <p class="gx-author">${escapeHtml(hostOf(a.url))}</p>
          <div class="gx-act">
            <a class="ghost solid" href="${escapeHtml(a.url)}" target="_blank" rel="noopener"
               style="text-decoration:none">Open the link</a>
            <button class="ghost" data-act="save">${isSaved(n.id) ? 'On a note ✓' : 'Add to note'}</button>
            <button class="ghost" data-act="path">Add to pathway</button>
          </div>
          ${owner ? `<div class="gx-sec"><h4>Held by</h4><div class="gx-more">
            <button class="gx-more-row" data-goto="${o.noteId === ctx.note.id ? NID.note : nid(o.noteId)}">
              ${orb('resonance')}<span class="t">${escapeHtml(owner.title || 'Untitled')}</span></button>
          </div></div>` : ''}`;
      } else {
        const preview = n._url
          ? (a.kind === 'video'
              ? `<video class="gx-preview" src="${n._url}" controls></video>`
              : `<img class="gx-preview" src="${n._url}" alt="${escapeHtml(a.name)}">`)
          : (a.kind === 'audio' && ATT_OF[n.ref] ? '<div class="gx-audio" data-audio="' + escapeHtml(a.id) + '"></div>' : '');
        body = `
          <div class="gx-kicker">${orb('resonance')}${escapeHtml(a.kind)}
            <span>${escapeHtml(Media.human(a.size))}</span></div>
          <h3>${escapeHtml(a.name)}</h3>
          ${preview}
          <div class="gx-act">
            <button class="ghost" data-act="save">${isSaved(n.id) ? 'On a note ✓' : 'Add to note'}</button>
            <button class="ghost" data-act="path">Add to pathway</button>
          </div>
          ${owner ? `<div class="gx-sec"><h4>Held by</h4><div class="gx-more">
            <button class="gx-more-row" data-goto="${o.noteId === ctx.note.id ? NID.note : nid(o.noteId)}">
              ${orb('resonance')}<span class="t">${escapeHtml(owner.title || 'Untitled')}</span></button>
          </div></div>` : ''}`;
      }
    }

    else if (n.type === 'spectrum') {
      const s = AXIS[n.ref];
      const lean = leanOf(n.ref);
      const placed = Belief.score(n.ref);
      const against = BEL.opposing(n.ref, lean ? lean.delta : (placed ? placed.score : 0));
      const answered = Belief.answeredCount(n.ref);
      const side = lean ? (lean.split ? 0 : Math.sign(lean.delta))
                 : placed ? (placed.leaning === 'balanced' ? 0 : Math.sign(placed.score)) : 0;
      body = `
        <div class="gx-kicker">${orb('stance')}${escapeHtml(s.branch)}
          <span class="gx-tag">${placed ? 'placed' : lean ? 'tentative' : 'unplaced'}</span></div>
        <h3>${escapeHtml(s.title)}</h3>
        <p class="gx-question">${escapeHtml(s.question)}</p>
        ${specTrack(s, {
          tentative: lean ? lean.delta : null,
          placed: placed ? placed.score : null,
          placedN: placed ? placed.n : 0
        })}
        ${specPoles(s, side)}
        <p class="gx-lede">${escapeHtml(specLine(n.ref, lean, placed))}</p>
        ${against ? `<div class="spec-against">
          <span class="lab">Read against</span>
          <div class="who">${escapeHtml(against.name)}</div>
          <p>${escapeHtml(against.capsule)}</p></div>` : ''}
        <div class="gx-act">
          <button class="ghost solid" data-act="place" data-ref="${escapeHtml(n.ref)}">${
            placed ? 'Answer another' : 'Place yourself'}</button>
          <button class="ghost" data-act="save">${isSaved(n.id) ? 'On a note ✓' : 'Add to note'}</button>
          <button class="ghost" data-act="path">Add to pathway</button>
        </div>
        <p class="gx-fine">${answered} of ${BEL.itemsFor(n.ref).length} items answered here. Only answers move the journal mark; the passage only ever leans.</p>
        ${more}`;
    }

    else if (n.type === 'tradition') {
      const all = BY_TRADITION[n.ref] || [];
      body = `
        <div class="gx-kicker">${orb('stance')}Tradition</div>
        <h3>${escapeHtml(TRADITIONS[n.ref] || n.ref)}</h3>
        <p class="gx-lede">${all.length} concept${all.length === 1 ? '' : 's'} in Palinode belong to this tradition.</p>
        <div class="gx-act">
          <button class="ghost" data-act="path">Add to pathway</button>
        </div>
        ${more}`;
    }

    const host = elPanel.querySelector('.gx-panel-body');
    host.innerHTML = body;
    reveal(host);
  }

  // The panel arrives top to bottom rather than all at once: each band gets
  // its position in the reading order, and the stylesheet turns that into a
  // delay. Rows inside a list count as their own bands, so a long "where
  // this leads" feed cascades instead of landing as a block. The index is
  // capped so a deep panel still finishes promptly.
  const REVEAL_CAP = 14;
  function reveal(host) {
    // querySelectorAll yields document order, which is the order we want
    host.querySelectorAll(':scope > *, .gx-more-row').forEach((el, i) => {
      el.style.setProperty('--i', Math.min(i, REVEAL_CAP));
    });
  }

  // Second-degree suggestions, so a node whose immediate neighbours are all
  // open still offers somewhere to go — the feed should not bottom out.
  function backfill(n, seen, want) {
    const out = [];
    const push = (id, type, ref, kind) => {
      if (seen.has(id) || out.length >= want) return;
      seen.add(id); out.push({ id, type, ref, kind });
    };

    const tradOf = c => conceptOf(c) && conceptOf(c).tradition;

    if (n.type === 'concept') {
      const t = tradOf(n.ref);
      (BY_TRADITION[t] || []).forEach(c => push(cid(c), 'concept', c, 'within'));
      const local = conceptOf(n.ref);
      (local && local.kin || []).forEach(k =>
        (WORKS_OF[k] || []).forEach(w => push(wid(w), 'work', w, 'cites')));
    }

    if (n.type === 'work') {
      // other books read by the same concepts — the shelf next to this one
      (CONCEPTS_OF[n.ref] || []).forEach(c => {
        (WORKS_OF[c] || []).forEach(w => push(wid(w), 'work', w, 'cites'));
        (conceptOf(c) && conceptOf(c).kin || []).forEach(k => push(cid(k), 'concept', k, 'kin'));
      });
    }

    if (n.type === 'tradition') {
      (BY_TRADITION[n.ref] || []).forEach(c =>
        (WORKS_OF[c] || []).forEach(w => push(wid(w), 'work', w, 'cites')));
    }

    if (n.type === 'note') {
      (ctx.analysis.concepts || []).forEach(c =>
        (conceptOf(c.id) && conceptOf(c.id).kin || []).forEach(k => push(cid(k), 'concept', k, 'kin')));
    }
    return out;
  }

  function heldSection() {
    const held = Attach.all(ctx.note.id);
    if (!held.length) return '';
    return `<div class="gx-sec"><h4>Attached to this note</h4><div class="gx-more">
      ${held.map(a => `<button class="gx-more-row" data-goto="${aid(a.id)}"
          data-type="${a.kind === 'link' ? 'link' : 'media'}" data-ref="${escapeHtml(a.id)}">
        <span class="orb sm" style="--c:var(--${a.kind === 'link' ? 'lineage' : 'resonance'})"></span>
        <span class="t">${escapeHtml(a.kind === 'link' ? (a.title || hostOf(a.url)) : a.name)}</span>
        <span class="s">${escapeHtml(a.kind)}</span></button>`).join('')}
    </div></div>`;
  }

  function savedSection() {
    const list = Saved.all(ctx.note.id);
    if (!list.length) return '';
    return `<div class="gx-sec"><h4>Saved to this note</h4><div class="gx-more">
      ${list.map(x => `<button class="gx-more-row" data-goto="${escapeHtml(x.id)}"
          data-type="${escapeHtml(x.type)}" data-ref="${escapeHtml(x.id.replace(/^[cwts]:/, ''))}">
        <span class="orb sm" style="--c:var(--${x.category})"></span>
        <span class="t">${escapeHtml(x.label)}</span>
        ${x.sub ? `<span class="s">${escapeHtml(x.sub)}</span>` : ''}</button>`).join('')}
    </div></div>`;
  }

  /* ================= trail ================= */

  // The trail is the session's path, not a stack. A new world is appended.
  // Returning to a crumb only moves the cursor, so later visits stay put
  // and the buttons themselves are never rebuilt.

  function crumbButton(id) {
    const n = nodes.get(id);
    if (!n) return null;
    const btn = document.createElement('button');
    btn.className = 'gx-crumb';
    btn.dataset.goto = id;
    const orb = document.createElement('span');
    orb.className = 'orb sm';
    orb.style.setProperty('--c', `var(--${n.category})`);
    const kill = document.createElement('span');
    kill.className = 'gx-crumb-x';
    kill.dataset.drop = id;
    kill.title = 'Remove from trail';
    kill.textContent = '×';
    btn.append(orb, document.createTextNode(n.label), kill);
    return btn;
  }

  function appendCrumb(id) {
    if (!elTrail) return;
    if (elTrail.querySelector('.gx-crumb')) {
      const sep = document.createElement('span');
      sep.className = 'gx-crumb-sep';
      sep.textContent = '→';
      elTrail.appendChild(sep);
    }
    const btn = crumbButton(id);
    if (btn) elTrail.appendChild(btn);
  }

  function markTrail() {
    if (!elTrail) return;
    elTrail.querySelectorAll('.gx-crumb').forEach((el, i) => {
      el.classList.toggle('on', i === trailCursor);
      el.classList.toggle('ahead', i > trailCursor);
    });
  }

  function pushTrail(id) {
    const at = trail.indexOf(id);
    if (at >= 0) {
      trailCursor = at;
      markTrail();
      return;
    }
    trail.push(id);
    appendCrumb(id);
    trailCursor = trail.length - 1;
    markTrail();
    syncSaveBtn();
  }

  function syncSaveBtn() {
    const btn = document.getElementById('gx-save-path');
    if (btn) btn.disabled = trail.length === 0;
  }

  function dropTrail(id) {
    const at = trail.indexOf(id);
    if (at < 0 || !elTrail) return;
    const crumbs = [...elTrail.querySelectorAll('.gx-crumb')];
    const btn = crumbs[at];
    if (btn) {
      const prev = btn.previousElementSibling;
      const next = btn.nextElementSibling;
      if (prev && prev.classList.contains('gx-crumb-sep')) prev.remove();
      else if (next && next.classList.contains('gx-crumb-sep')) next.remove();
      btn.remove();
    }
    trail.splice(at, 1);
    if (!trail.length) {
      trailCursor = -1;
      markTrail();
      syncSaveBtn();
      notify();
      return;
    }
    if (trailCursor === at) {
      trailCursor = Math.max(0, at - 1);
      const stay = trail[trailCursor];
      const n = nodes.get(stay);
      selected = stay;
      markDirty();
      if (n) { nodes.forEach(x => { x.focusHold = false; }); n.focusHold = true; detail(stay); centreOn(n); }
    } else if (trailCursor > at) {
      trailCursor -= 1;
    }
    markTrail();
    syncSaveBtn();
    notify();
  }

  function trailSteps() {
    return trail.map(id => {
      const n = nodes.get(id);
      if (!n) return null;
      const step = {
        id: n.type === 'note' && ctx && ctx.note ? nid(ctx.note.id) : n.id,
        type: n.type === 'note' ? 'note-other' : n.type,
        ref: n.type === 'note' && ctx && ctx.note ? ctx.note.id : n.ref,
        label: n.label || label(n),
        category: n.category || category(n),
        sub: kicker(n)
      };
      if (n.type === 'note' && ctx && ctx.note) step.noteId = ctx.note.id;
      if (n.type === 'note-other') step.noteId = n.ref;
      return step;
    }).filter(Boolean);
  }

  /* ================= interaction ================= */

  function select(id) {
    const n = nodes.get(id);
    if (!n) return;
    selected = id;
    markDirty();
    if (window.PalinodeField) PalinodeField.paint(category(n));

    // Freeze the node being opened before anything else moves. The camera
    // then has a stationary target, which is what makes the pan readable —
    // chasing a node the physics is still throwing around is the jarring part.
    nodes.forEach(x => { x.focusHold = false; });
    n.focusHold = true;

    const grow = !(ctx && ctx.mode === 'pathway' && !connectionsOn);
    const added = grow ? expand(n, n.type === 'tradition' || n.type === 'spectrum' ? 7 : 9) : 0;
    pushTrail(id);
    if (grow && panelPending(n)) setPanelLoading(true);
    detail(id);
    centreOn(n);
    notify();
    if (grow) {
      expandLive(n);
      if (added === 0 && n.type !== 'note' && !liveUuid(n))
        toast('Everything this leads to is already on the canvas.');
    } else if (added === 0 && n.type !== 'note') {
      toast('Everything this leads to is already on the canvas.');
    }
  }

  const listeners = [];
  function notify() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }

  let camTween = null;
  function stopCam() { if (camTween) { cancelAnimationFrame(camTween); camTween = null; } }

  function centreOn(n) {
    stopCam();
    const from = { tx: view.tx, ty: view.ty };
    const to = { tx: -n.x, ty: -n.y };            // the centre is panel-aware
    const dist = Math.hypot(to.tx - from.tx, to.ty - from.ty) * view.s;
    if (dist < 2) return;
    const dur = Math.max(340, Math.min(760, 300 + dist * 0.55));
    const t0 = performance.now();
    (function step() {
      const k = Math.min(1, (performance.now() - t0) / dur);
      // ease-in-out: no lurch at either end
      const e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      view.tx = from.tx + (to.tx - from.tx) * e;
      view.ty = from.ty + (to.ty - from.ty) * e;
      if (k < 1) camTween = requestAnimationFrame(step);
      else camTween = null;
    })();
  }

  // what stays lit: the selection and whatever it touches
  function focusSet() {
    if (!selected) return null;
    const keep = new Set([selected]);
    edges.forEach(e => {
      if (e.a === selected) keep.add(e.b);
      if (e.b === selected) keep.add(e.a);
    });
    return keep;
  }

  function toast(m) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = m; t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 2000);
  }

  /* ================= open / close ================= */

  async function open(context) {
    ctx = context || {};
    if (!ctx.analysis) ctx.analysis = { concepts: [], insights: [], leans: [], stats: { words: 0 } };
    if (!ctx.note) ctx.note = { id: '', title: '', body: '', attachments: [] };
    nodes = new Map(); edges = []; trail = []; trailCursor = -1; selected = null; hoverId = null;
    nodeEls.clear(); edgeEls.clear(); dirty = true; lastScale = -1;
    view = { s: 1, tx: 0, ty: 0 };

    root = document.getElementById('graph');
    elEdges = document.getElementById('gx-edges');
    elNodes = document.getElementById('gx-nodes');
    elPanel = document.getElementById('gx-panel');
    elTrail = document.getElementById('gx-trail');
    if (elTrail) elTrail.innerHTML = '';
    root.hidden = false;
    document.body.classList.add('exploring');
    elNodes.innerHTML = ''; elEdges.innerHTML = '';
    resize();

    await buildJournalIndex();

    connectionsOn = ctx.mode === 'corpus' ? true : !!(ctx.mode === 'pathway' && ctx.connections);
    root.classList.toggle('corpus-mode', isCorpus());
    if (ctx.mode === 'pathway' && ctx.pathway) seedPathway(ctx.pathway);
    else if (isCorpus()) {
      corpusQ = '';
      corpusCats = new Set();
      corpusSort = 'name';
      corpusLive = false;
      syncCorpusControls();
      await seedCorpus();
    }
    else {
      seedNoteField();
      await resolveDetectedToLive();
    }

    applyChrome();
    sim = { alpha: 1 };
    for (let i = 0; i < 420; i++) tick();
    sim.alpha = 0.5;

    paint();
    requestAnimationFrame(loop);
    nodes.forEach(n => { if (n.type === 'media') resolveThumb(n); });
    syncSaveBtn();
  }

  function corpusReady() { return !!(String(corpusQ || '').trim() || corpusCats.size || corpusLive); }

  const LOAD_ORB = {
    accent: '#E8853C',
    dot: '#F4F1EA',
    dots: [],
    raf: 0,
    running: false
  };

  function seedLoadDots() {
    const dots = [];
    for (let i = 0; i < 56; i++) {
      const u = Math.random(), v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      dots.push({
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(phi),
        delay: Math.random(),
        accent: Math.random() < 0.16
      });
    }
    return dots;
  }

  function paintLoadOrbs(t) {
    const canvas = document.getElementById('gx-load-orbs');
    if (!canvas) return;
    const css = 28;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== css * dpr) {
      canvas.width = css * dpr;
      canvas.height = css * dpr;
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, css, css);
    if (!LOAD_ORB.dots.length) LOAD_ORB.dots = seedLoadDots();
    const cx = css / 2, cy = css / 2, R = 11.8, persp = 1.55, speed = 0.58;
    const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.1, 0, Math.PI * 2);
    ctx.fillStyle = LOAD_ORB.accent;
    ctx.fill();
    const painted = LOAD_ORB.dots.map(d => {
      const life = still ? 0.42 : ((t * speed + d.delay) % 1);
      const burst = 1 - Math.pow(1 - life, 2.35);
      const px = d.x * burst, py = d.y * burst, pz = d.z * burst;
      const scale = persp / (persp + pz * 0.55);
      return {
        sx: cx + px * R * scale,
        sy: cy + py * R * scale,
        z: pz,
        r: (d.accent ? 1.3 : 1.05) * scale * (1 - life * 0.28),
        a: Math.max(0, (1 - life) * (0.28 + 0.72 * scale)),
        accent: d.accent
      };
    }).sort((a, b) => a.z - b.z);
    painted.forEach(p => {
      ctx.globalAlpha = p.a;
      ctx.beginPath();
      ctx.arc(p.sx, p.sy, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.accent ? LOAD_ORB.accent : LOAD_ORB.dot;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function startLoadOrbs() {
    if (LOAD_ORB.running) return;
    LOAD_ORB.running = true;
    const tick = now => {
      if (!LOAD_ORB.running) return;
      paintLoadOrbs(now / 1000);
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      LOAD_ORB.raf = requestAnimationFrame(tick);
    };
    LOAD_ORB.raf = requestAnimationFrame(tick);
  }

  function stopLoadOrbs() {
    LOAD_ORB.running = false;
    if (LOAD_ORB.raf) cancelAnimationFrame(LOAD_ORB.raf);
    LOAD_ORB.raf = 0;
  }

  function setGraphEmpty(mode, msg) {
    const empty = document.getElementById('gx-empty');
    const load = document.getElementById('gx-load');
    const text = document.getElementById('gx-empty-msg');
    if (!empty) return;
    if (mode === 'hide') {
      empty.hidden = true;
      if (load) load.hidden = true;
      if (text) text.hidden = true;
      stopLoadOrbs();
      corpusLoading = false;
      return;
    }
    empty.hidden = false;
    if (mode === 'loading') {
      corpusLoading = true;
      if (load) load.hidden = false;
      if (text) text.hidden = true;
      startLoadOrbs();
      return;
    }
    corpusLoading = false;
    stopLoadOrbs();
    if (load) load.hidden = true;
    if (text) {
      text.hidden = false;
      text.textContent = msg || '';
    }
  }

  let corpusLive = false;
  let corpusLoading = false;
  let corpusGen = 0;
  let corpusUsingApi = true;

  function corpusMatches(c) {
    if (corpusCats.size) {
      const kind = c.node_type || (c.entity_type === 'Item' ? 'ITEM' : c.category);
      if (!corpusCats.has(kind) && !corpusCats.has(c.category)) return false;
    }
    const q = String(corpusQ || '').trim().toLowerCase();
    if (!q) return true;
    const hay = [c.label, c.title, c.reading, c.turn, c.author, TRADITIONS[c.tradition] || '', c.id, c.node_type]
      .join(' ').toLowerCase();
    return hay.includes(q);
  }

  function sortConcepts(list) {
    const copy = list.slice();
    if (corpusSort === 'tradition' || corpusSort === 'kind') {
      copy.sort((a, b) =>
        String(a.tradition || a.node_type || a.entity_type || '').localeCompare(String(b.tradition || b.node_type || b.entity_type || '')) ||
        String(a.label || a.title).localeCompare(String(b.label || b.title)));
    } else if (corpusSort === 'category') {
      const order = ['resonance', 'tension', 'clarity', 'stance', 'lineage'];
      copy.sort((a, b) =>
        order.indexOf(a.category) - order.indexOf(b.category) || String(a.label || a.title).localeCompare(String(b.label || b.title)));
    } else {
      copy.sort((a, b) => String(a.label || a.title).localeCompare(String(b.label || b.title)));
    }
    return copy;
  }

  function layoutCorpus(list) {
    if (corpusSort === 'name' || list.length < 3) {
      const r = 90 + Math.min(260, list.length * 16);
      return list.map((c, i) => {
        const a = (i / Math.max(1, list.length)) * Math.PI * 2 - Math.PI / 2;
        return { c, x: Math.cos(a) * r, y: Math.sin(a) * r };
      });
    }
    const key = corpusSort === 'tradition' || corpusSort === 'kind'
      ? c => c.tradition || c.node_type || c.category
      : c => c.category;
    const groups = {};
    list.forEach(c => { (groups[key(c)] = groups[key(c)] || []).push(c); });
    const keys = Object.keys(groups);
    const out = [];
    keys.forEach((k, gi) => {
      const ang = (gi / keys.length) * Math.PI * 2;
      const cx = Math.cos(ang) * 260, cy = Math.sin(ang) * 200;
      const bunch = groups[k];
      bunch.forEach((c, i) => {
        const a = (i / Math.max(1, bunch.length)) * Math.PI * 2;
        const r = 36 + bunch.length * 10;
        out.push({ c, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
      });
    });
    return out;
  }

  function layoutLive(list) {
    return layoutCorpus(list.map(rec => ({
      label: rec.label || rec.title,
      tradition: rec.tradition || rec.node_type || rec.entity_type || '',
      category: rec.category || 'resonance',
      rec: rec
    }))).map(row => ({ rec: row.c.rec, x: row.x, y: row.y }));
  }

  function clearField() {
    [...nodes.keys()].forEach(id => {
      const el = nodeEls.get(id);
      if (el) { el.remove(); nodeEls.delete(id); }
    });
    nodes = new Map();
    edges = [];
    trail = [];
    trailCursor = -1;
    selected = null;
    if (elTrail) elTrail.innerHTML = '';
  }

  function placeLive(list, links, selectFirst) {
    const placed = layoutLive(list);
    placed.forEach(({ rec, x, y }) => {
      const seed = Khora.toGraphSeed(rec);
      const n = addNode({
        id: seed.id, type: seed.type, ref: seed.ref,
        px: x, py: y, spawnR: 0, depth: 0
      });
      n.x = x; n.y = y;
      n.state = 'open';
      n.label = seed.label;
      n.category = seed.category;
    });
    (links || []).forEach(link => {
      const a = nodes.has('c:' + link.a) ? 'c:' + link.a
              : nodes.has('w:' + link.a) ? 'w:' + link.a : null;
      const b = nodes.has('c:' + link.b) ? 'c:' + link.b
              : nodes.has('w:' + link.b) ? 'w:' + link.b : null;
      if (a && b) addEdge(a, b, link.kind || 'kin');
    });
    if (placed.length && selectFirst) {
      const first = Khora.toGraphSeed(placed[0].rec);
      selected = first.id;
      pushTrail(selected);
      detail(selected);
      expandLive(nodes.get(selected));
    } else if (elPanel) { setPanelLoading(false); elPanel.hidden = true; }
    markDirty();
    kick(0.45);
  }

  function seedCorpusLocal() {
    corpusUsingApi = false;
    corpusLive = false;
    const empty = document.getElementById('gx-empty');
    if (!String(corpusQ || '').trim() && !corpusCats.size) {
      setGraphEmpty('msg', 'Search or filter to draw the field');
      if (elPanel) { setPanelLoading(false); elPanel.hidden = true; }
      markDirty();
      return;
    }
    setGraphEmpty('hide');
    const list = sortConcepts(CONCEPTS.filter(corpusMatches)).slice(0, 48);
    const placed = layoutCorpus(list);
    placed.forEach(({ c, x, y }) => {
      const n = addNode({
        id: cid(c.id), type: 'concept', ref: c.id,
        px: x, py: y, spawnR: 0, depth: 0
      });
      n.x = x; n.y = y;
      n.state = 'open';
      n.label = c.label;
      n.category = c.category;
    });
    placed.forEach(({ c }) => {
      (c.kin || []).forEach(k => {
        if (nodes.has(cid(k))) addEdge(cid(c.id), cid(k), 'kin');
      });
    });
    if (placed.length) {
      selected = cid(placed[0].c.id);
      pushTrail(selected);
      detail(selected);
    } else if (elPanel) { setPanelLoading(false); elPanel.hidden = true; }
    markDirty();
    kick(0.45);
  }

  async function seedCorpus() {
    clearField();
    const empty = document.getElementById('gx-empty');
    const gen = ++corpusGen;
    corpusUsingApi = !!(Khora && typeof fetch === 'function');

    if (!corpusUsingApi) {
      seedCorpusLocal();
      return;
    }

    if (empty) {
      empty.hidden = false;
      setGraphEmpty('loading');
    }
    if (elPanel) { setPanelLoading(false); elPanel.hidden = true; }

    try {
      const q = String(corpusQ || '').trim();
      let entities = [];
      let links = [];
      if (!q) {
        const intro = await Khora.intro(5);
        if (gen !== corpusGen) return;
        entities = intro.nodes || [];
        links = intro.links || [];
        if (!entities.length) {
          const rnd = await Khora.random();
          if (gen !== corpusGen) return;
          entities = rnd;
        }
      } else {
        entities = await Khora.search(q, ['Node', 'Item']);
        if (gen !== corpusGen) return;
      }
      const adapted = entities.map(e => Khora.getConcept(e.id) || Khora.getWork(e.id) || Khora.overlayFromLocal(e) || e)
        .filter(rec => corpusMatches(rec));
      entities = sortConcepts(adapted).slice(0, 48);
      if (q && entities.length) {
        const ids = entities.map(e => e.id).filter(Boolean);
        try { links = await Khora.linkAll(ids); } catch (e) { links = []; }
        if (gen !== corpusGen) return;
      }
      if (gen !== corpusGen) return;
      corpusLive = true;
      if (!entities.length) {
        if (empty) setGraphEmpty('msg', q ? 'Nothing matched in Khora' : 'Search the graph to draw the field');
        markDirty();
        return;
      }
      if (empty) setGraphEmpty('hide');
      placeLive(entities, links, !!q);
    } catch (err) {
      if (gen !== corpusGen) return;
      toast('Could not reach Khora — using the local corpus.');
      seedCorpusLocal();
    }
  }

  function syncCorpusControls() {
    const search = document.getElementById('gx-search');
    const row = document.getElementById('gx-corpus-row');
    const empty = document.getElementById('gx-empty');
    const q = document.getElementById('gx-q');
    const sort = document.getElementById('gx-sort');
    const cat = document.getElementById('gx-cat');
    const filters = document.getElementById('gx-filters');
    const on = isCorpus();
    if (search) search.hidden = !on;
    if (row) row.hidden = !on;
    if (!on || (corpusReady() && !corpusLoading)) setGraphEmpty('hide');
    if (q && q.value !== corpusQ) q.value = corpusQ;
    if (sort) sort.value = corpusSort;
    if (cat) cat.value = corpusCats.size === 1 ? [...corpusCats][0] : '';
    const catWrap = document.getElementById('gx-cat-wrap');
    if (catWrap) catWrap.classList.toggle('on', corpusCats.size === 1);
    if (filters && on) {
      filters.innerHTML = Object.keys(CATEGORIES).map(id => {
        const cat = CATEGORIES[id];
        const pressed = corpusCats.has(id);
        const dim = corpusCats.size && !pressed;
        return `<button type="button" class="chip${dim ? ' off' : ''}" data-cat="${id}">
          <span class="orb sm" style="--c:var(--${id})"></span>${cat.label}</button>`;
      }).join('');
    }
    if (root) root.classList.toggle('corpus-mode', on);
  }

  async function redrawCorpus() {
    if (!isCorpus() || !root) return;
    await seedCorpus();
    syncCorpusControls();
    applyChrome();
  }

  function stepFromNode(n) {
    if (!n) return null;
    const step = {
      id: n.type === 'note' && ctx && ctx.note ? nid(ctx.note.id) : n.id,
      type: n.type === 'note' ? 'note-other' : n.type,
      ref: n.type === 'note' && ctx && ctx.note ? ctx.note.id : n.ref,
      label: n.label || label(n),
      category: n.category || category(n),
      sub: kicker(n)
    };
    if (step.type === 'note-other') step.noteId = step.ref;
    return step;
  }

  async function resolveDetectedToLive() {
    if (!Khora || !ctx || !ctx.analysis) return;
    const list = ctx.analysis.concepts || [];
    for (const c of list) {
      if (!c || !c.label) continue;
      try {
        const hit = await Khora.resolveByTitle(c.label, ['Node']);
        if (hit && hit.id) Khora.mapSlug(c.id, hit.id);
      } catch (e) { /* keep the local concept */ }
    }
    if (selected) detail(selected);
    notify();
  }

  function seedNoteField() {
    const note = addNode({ id: NID.note, type: 'note', ref: 'note', px: 0, py: 0, depth: 0 });
    note.x = 0; note.y = 0;
    note.label = label(note); note.category = 'resonance'; note.state = 'open';
    expand(note, 40);
    [...nodes.values()].filter(n => n.type === 'concept').forEach(c => {
      c.inNote = true;
      c.label = label(c); c.category = category(c);
    });
    [...nodes.values()].filter(n => n.type === 'concept').slice(0, 8)
      .forEach(c => { expand(c, 5); c.state = 'open'; });
    selected = NID.note;
    pushTrail(NID.note);
    detail(NID.note);
  }

  function seedPathway(pathway) {
    (pathway.attachments || []).forEach(att => {
      ATT_OF[att.id] = { att, noteId: att.noteId || null };
    });
    const steps = pathway.steps || [];
    let prevId = null;
    const ids = [];
    steps.forEach((s, i) => {
      const isNote = s.type === 'note' || s.type === 'note-other';
      const noteId = isNote ? (s.noteId || (s.ref && s.ref !== 'note' ? s.ref : null)) : null;
      const id = isNote && noteId ? nid(noteId) : (s.id === 'note' && noteId ? nid(noteId) : s.id);
      const type = isNote ? 'note-other' : s.type;
      const ref = isNote ? noteId : s.ref;
      const node = addNode({
        id, type, ref,
        px: (i - Math.max(0, steps.length - 1) / 2) * 240,
        py: 0, depth: 0, spawnR: 0
      });
      node.x = (i - Math.max(0, steps.length - 1) / 2) * 240;
      node.y = 0;
      node.label = s.label || label(node);
      node.category = s.category || category(node);
      node.state = 'open';
      if (prevId) addEdge(prevId, node.id, 'path');
      prevId = node.id;
      ids.push(node.id);
    });
    ids.forEach(id => pushTrail(id));
    if (ids.length) {
      trailCursor = 0;
      selected = ids[0];
      markTrail();
      const n = nodes.get(selected);
      if (n) { n.focusHold = true; detail(selected); }
    }
    if (connectionsOn) ids.forEach(id => { const n = nodes.get(id); if (n) expand(n, 7); });
  }

  function applyChrome() {
    const title = document.getElementById('gx-title-text');
    const hint = document.getElementById('gx-hint');
    const conn = document.getElementById('gx-conn');
    const path = ctx && ctx.mode === 'pathway' && ctx.pathway;
    if (title) title.textContent = path ? (path.title || 'Pathway') : isCorpus() ? 'Explore' : 'Exploring';
    const closeBtn = document.getElementById('gx-close');
    if (closeBtn) closeBtn.hidden = isCorpus();
    if (root) root.classList.toggle('page-mode', isCorpus());
    if (conn) conn.hidden = !path;
    if (hint) {
      hint.hidden = !!path || isCorpus();
      if (!path && !isCorpus()) hint.textContent = dim === '3'
        ? 'Click a world to centre it · click empty space to go back · drag to orbit'
        : 'Click any orb to open it and grow the field';
    }
    syncCorpusControls();
    const box = document.getElementById('gx-conn-toggle');
    if (box) box.checked = connectionsOn;
  }

  async function drawLiveConnections() {
    if (!Khora) return;
    const liveIds = [...nodes.values()]
      .filter(n => n.type === 'concept' || n.type === 'work')
      .map(n => n.ref)
      .filter(id => Khora.isUuid(id));
    const liveNodeIds = new Set([...nodes.keys()].filter(id => id.slice(0, 2) === 'c:' || id.slice(0, 2) === 'w:'));
    if (!connectionsOn) {
      edges = edges.filter(e => !(liveNodeIds.has(e.a) && liveNodeIds.has(e.b)));
      markDirty();
      notify();
      return;
    }
    if (!liveIds.length) return;
    try {
      const links = await Khora.linkAll(liveIds);
      links.forEach(link => {
        const a = nodes.has('c:' + link.a) ? 'c:' + link.a
                : nodes.has('w:' + link.a) ? 'w:' + link.a : null;
        const b = nodes.has('c:' + link.b) ? 'c:' + link.b
                : nodes.has('w:' + link.b) ? 'w:' + link.b : null;
        if (a && b) addEdge(a, b, link.kind || 'kin');
      });
      markDirty();
      notify();
    } catch (e) { /* keep the field as-is */ }
  }

  function setConnections(on) {
    connectionsOn = !!on;
    const box = document.getElementById('gx-conn-toggle');
    if (box) box.checked = connectionsOn;
    if (!root || !ctx) return;
    if (ctx.mode === 'corpus') {
      drawLiveConnections();
      return;
    }
    if (ctx.mode !== 'pathway') return;
    if (connectionsOn) {
      trail.forEach(id => { const n = nodes.get(id); if (n) expand(n, 7); });
      kick(0.5);
    } else {
      const keep = new Set(trail);
      [...nodes.keys()].forEach(id => {
        if (keep.has(id)) return;
        nodes.delete(id);
        const el = nodeEls.get(id);
        if (el) { el.remove(); nodeEls.delete(id); }
      });
      edges = edges.filter(e => keep.has(e.a) && keep.has(e.b));
      markDirty();
      kick(0.35);
    }
    notify();
  }

  function close() {
    if (!root) return;
    if (dim === '3' && window.PalinodeGraph3D) { window.PalinodeGraph3D.unmount(); }
    document.body.classList.remove('dim3');
    root.hidden = true;
    document.body.classList.remove('exploring');
    if (root) root.classList.remove('corpus-mode', 'page-mode');
    const closeBtn = document.getElementById('gx-close');
    if (closeBtn) closeBtn.hidden = false;
    setGraphEmpty('hide');
    const search = document.getElementById('gx-search');
    if (search) search.hidden = true;
    const crow = document.getElementById('gx-corpus-row');
    if (crow) crow.hidden = true;
    root = null;
    sim = null;
  }

  let dim = '2';

  function setDim(next) {
    if (next === dim) return;
    dim = next;
    document.querySelectorAll('#gx-dim .seg-btn').forEach(b =>
      b.classList.toggle('on', b.dataset.dim === dim));
    const flat = document.getElementById('gx-canvas');
    const deep = document.getElementById('gx-3d');
    const hint = document.getElementById('gx-hint');
    document.body.classList.toggle('dim3', dim === '3');

    if (dim === '3') {
      if (!window.PalinodeGraph3D || !window.PalinodeGraph3D.available()) {
        toast('3D needs WebGL, which this browser is not providing.');
        dim = '2';
        document.querySelectorAll('#gx-dim .seg-btn').forEach(b => b.classList.toggle('on', b.dataset.dim === '2'));
        document.body.classList.remove('dim3');
        return;
      }
      flat.hidden = true; deep.hidden = false;
      if (hint && !hint.hidden) hint.textContent = 'Click a world to centre it · click empty space to go back · drag to orbit';
      window.PalinodeGraph3D.mount(deep);
      window.PalinodeGraph3D.resize();
    } else {
      deep.hidden = true; flat.hidden = false;
      if (hint && !hint.hidden) hint.textContent = 'Click any orb to open it and grow the field';
      window.PalinodeGraph3D.unmount();
      markDirty();
      kick(0.3);
    }
  }

  function resize() {
    if (!root) return;
    if (dim === '3' && window.PalinodeGraph3D) window.PalinodeGraph3D.resize();
    const r = root.getBoundingClientRect();
    W = r.width; H = r.height;
    elEdges.setAttribute('viewBox', `0 0 ${W} ${H}`);
    elEdges.setAttribute('width', W);
    elEdges.setAttribute('height', H);
  }

  /* ---------- events, bound once ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    const host = document.getElementById('graph');
    if (!host) return;
    const canvas = document.getElementById('gx-canvas');

    let drag = null;

    canvas.addEventListener('pointerdown', e => {
      const el = e.target.closest('.gx-node');
      if (el) {
        const n = nodes.get(el.dataset.id);
        drag = { node: n, moved: false, sx: e.clientX, sy: e.clientY, ox: n.x, oy: n.y };
        n.held = true;
      } else {
        stopCam();
        drag = { pan: true, moved: false, sx: e.clientX, sy: e.clientY, ox: view.tx, oy: view.ty };
      }
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    });

    canvas.addEventListener('pointermove', e => {
      const el = e.target.closest('.gx-node');
      const id = el ? el.dataset.id : null;
      if (id !== hoverId && !drag) { hoverId = id; markDirty(); }
      if (!drag) return;
      const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
      if (drag.pan) { view.tx = drag.ox + dx / view.s; view.ty = drag.oy + dy / view.s; }
      else { drag.node.x = drag.ox + dx / view.s; drag.node.y = drag.oy + dy / view.s; kick(); }
    });

    canvas.addEventListener('pointerup', e => {
      if (!drag) return;
      if (drag.node) drag.node.held = false;
      if (!drag.moved && drag.node) select(drag.node.id);
      drag = null;
    });

    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      stopCam();
      const k = Math.exp(-e.deltaY * 0.0016);
      view.s = Math.max(0.4, Math.min(2.4, view.s * k));
    }, { passive: false });

    // panel and trail actions
    host.addEventListener('click', e => {
      const drop = e.target.closest('[data-drop]');
      if (drop) {
        e.preventDefault();
        e.stopPropagation();
        dropTrail(drop.dataset.drop);
        return;
      }
      const goto = e.target.closest('[data-goto]');
      if (goto) {
        const id = goto.dataset.goto;
        if (!nodes.has(id) && goto.dataset.type) {
          const n = addNode({ id, type: goto.dataset.type, ref: goto.dataset.ref, px: 0, py: 0, depth: 2 });
          n.label = label(n); n.category = category(n);
          if (selected) addEdge(selected, id, 'kin');
        }
        select(id);
        return;
      }
      const act = e.target.closest('[data-act]');
      if (!act) return;
      const kind = act.dataset.act;
      if (kind === 'save') {
        const n = nodes.get(selected);
        const w = workOf(n.ref);
        const c = conceptOf(n.ref);
        const sub = n.type === 'work' && w ? w.author
                  : n.type === 'spectrum' && AXIS[n.ref] ? AXIS[n.ref].branch
                  : n.type === 'concept' && c ? (TRADITIONS[c.tradition] || c.node_type || '') : '';
        const payload = { id: n.id, type: n.type, label: n.label, sub, category: n.category };
        if (ctx.onSaveNode) { ctx.onSaveNode(payload); return; }
        if (!ctx.note || !ctx.note.id) {
          if (ctx.onNeedNote) ctx.onNeedNote(payload);
          else toast('Open a note first.');
          return;
        }
        const now = Saved.toggle(ctx.note.id, payload);
        markDirty();
        toast(now
          ? 'Saved to “' + (ctx.note.title || 'this note') + '”.'
          : 'Removed from this note.');
        detail(selected);
        if (ctx.onSaveChange) ctx.onSaveChange();
        notify();
        return;
      }
      if (kind === 'path') {
        const n = nodes.get(selected);
        const step = stepFromNode(n);
        if (step && ctx.onAddToPathway) ctx.onAddToPathway(step);
        return;
      }
      if (kind === 'place') {
        const axisId = act.dataset.ref || (nodes.get(selected) || {}).ref;
        if (ctx.onPlace) ctx.onPlace(axisId);
        return;
      }
      if (kind === 'open-note') { if (ctx.onOpenNote) ctx.onOpenNote(act.dataset.ref); return; }
      if (kind === 'write') {
        const rec = conceptOf(act.dataset.ref) || { label: act.dataset.ref, turn: 'What follows from this?' };
        if (ctx.onWrite) ctx.onWrite(rec);
        return;
      }
      if (kind === 'read')  { if (ctx.onRead) ctx.onRead(act.dataset.ref); return; }
    });

    // ---- 2D / 3D ----
    const dimSeg = document.getElementById('gx-dim');
    dimSeg.addEventListener('click', e => {
      const b = e.target.closest('.seg-btn');
      if (b) setDim(b.dataset.dim);
    });

    document.getElementById('gx-close').addEventListener('click', () => { close(); if (ctx.onClose) ctx.onClose(); });
    const savePath = document.getElementById('gx-save-path');
    if (savePath) savePath.addEventListener('click', () => {
      if (!trail.length) return;
      if (ctx.onSavePathway) ctx.onSavePathway(trailSteps());
    });
    const connToggle = document.getElementById('gx-conn-toggle');
    if (connToggle) connToggle.addEventListener('change', e => setConnections(e.target.checked));
    const gq = document.getElementById('gx-q');
    if (gq) gq.addEventListener('input', () => {
      corpusQ = gq.value;
      clearTimeout(redrawCorpus._t);
      redrawCorpus._t = setTimeout(() => { redrawCorpus(); }, 350);
    });
    const gs = document.getElementById('gx-sort');
    if (gs) gs.addEventListener('change', () => { corpusSort = gs.value; redrawCorpus(); });
    const gc = document.getElementById('gx-cat');
    if (gc) gc.addEventListener('change', () => {
      corpusCats = new Set();
      if (gc.value) corpusCats.add(gc.value);
      redrawCorpus();
    });
    const gf = document.getElementById('gx-filters');
    if (gf) gf.addEventListener('click', e => {
      const chip = e.target.closest('[data-cat]');
      if (!chip) return;
      const id = chip.dataset.cat;
      if (corpusCats.has(id)) corpusCats.delete(id);
      else corpusCats.add(id);
      redrawCorpus();
    });
    document.getElementById('gx-in').addEventListener('click',  () => { view.s = Math.min(2.4, view.s * 1.25); });
    document.getElementById('gx-out').addEventListener('click', () => { view.s = Math.max(0.4, view.s / 1.25); });
    document.getElementById('gx-fit').addEventListener('click', () => {
      stopCam();
      if (isCorpus()) {
        const n = nodes.get(selected);
        view.s = 1;
        if (n) centreOn(n); else { view.tx = 0; view.ty = 0; }
        return;
      }
      selected = NID.note; markDirty(); detail(NID.note);
      const n = nodes.get(NID.note);
      view.s = 1;
      if (n) centreOn(n); else { view.tx = 0; view.ty = 0; }
    });

    window.addEventListener('resize', resize);
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || !root) return;
      // The Explore page is a destination — leave it from the nav.
      if (isCorpus()) return;
      // An item overlay on top of the graph takes the key first; escaping
      // the question should not also escape the exploration.
      const scrim = document.getElementById('place-scrim');
      if (scrim && scrim.classList.contains('on')) return;
      close(); if (ctx.onClose) ctx.onClose();
    });
  });

  window.PalinodeGraph = {
    open, close, isOpen: () => !!root,
    isPage: () => !!(root && isCorpus()),
    trailSteps, setConnections,
    refreshDetail() {
      if (!root || !selected) return;
      markDirty();
      detail(selected);
      notify();
    },

    // Called after an item is answered elsewhere: the mark on every
    // spectrum node has moved, so the panel and the 3D card must be re-read.
    refreshBeliefs() {
      if (!root) return;
      nodes.forEach(n => { if (n.type === 'spectrum') n._sz = undefined; });
      markDirty();
      if (selected) detail(selected);
      notify();
    },

    // Read-only view of the model, plus the one mutating call. The 3D view
    // renders the same graph and drives the same selection, so switching
    // between the two never loses your place.
    model: {
      selected: () => selected,
      node: id => nodes.get(id),
      all: () => nodes,
      trail: () => trail.slice(),
      trailIndex: () => trailCursor,
      dropTrail,
      label: n => label(n),
      category: n => category(n),
      kicker: n => kicker(n),
      note: () => ctx && ctx.note,
      select: id => select(id),

      // What the 3D view floats beside the world you are standing on:
      // who it is, one line of substance, and what you can do about it.
      // The orbit itself already answers "where does this lead", so the
      // card carries no list.
      card(id) {
        const n = nodes.get(id);
        if (!n) return null;
        const base = { id, kicker: kicker(n), title: label(n), category: category(n), actions: [] };

        if (n.type === 'concept') {
          const c = conceptOf(n.ref);
          if (!c) return Object.assign(base, { line: 'Opening…', lineKind: 'question' });
          return Object.assign(base, {
            line: c.turn, lineKind: 'question',
            actions: [{ act: 'write', ref: n.ref, label: 'Write on this', primary: true },
                      { act: 'save', label: isSaved(n.id) ? 'Saved ✓' : 'Save to note' }]
          });
        }
        if (n.type === 'work') {
          const w = workOf(n.ref);
          if (!w) return Object.assign(base, { line: 'Opening…' });
          return Object.assign(base, {
            sub: (w.author || '') + (w.year ? ' · ' + w.year : ''),
            line: w.gist || '', rights: w.rights,
            actions: [{ act: 'read', ref: n.ref, label: 'Reading Room', primary: true },
                      { act: 'save', label: isSaved(n.id) ? 'Saved ✓' : 'Save to note' }]
          });
        }
        if (n.type === 'note') {
          return Object.assign(base, { line: (ctx.note.body || '').slice(0, 150) });
        }
        if (n.type === 'note-other') {
          const o = NOTE_OF[n.ref];
          return Object.assign(base, {
            line: (o.body || '').slice(0, 150),
            actions: [{ act: 'open-note', ref: n.ref, label: 'Open this note', primary: true }]
          });
        }
        if (n.type === 'spectrum') {
          const s = AXIS[n.ref];
          const lean = leanOf(n.ref);
          const placed = Belief.score(n.ref);
          const side = lean ? (lean.split ? 0 : Math.sign(lean.delta))
                     : placed ? (placed.leaning === 'balanced' ? 0 : Math.sign(placed.score)) : 0;
          return Object.assign(base, {
            sub: placed ? BSCORE.label(placed.leaning) : lean ? 'Tentative' : 'Unplaced',
            bar: specTrack(s, {
                   tentative: lean ? lean.delta : null,
                   placed: placed ? placed.score : null,
                   placedN: placed ? placed.n : 0
                 }) + specPoles(s, side),
            line: specLine(n.ref, lean, placed),
            actions: [{ act: 'place', ref: n.ref, label: placed ? 'Answer another' : 'Place yourself', primary: true },
                      { act: 'save', label: isSaved(n.id) ? 'Saved ✓' : 'Save to note' }]
          });
        }
        if (n.type === 'tradition') {
          const all = BY_TRADITION[n.ref] || [];
          return Object.assign(base, { line: all.length + ' concepts belong to this tradition.' });
        }
        if (n.type === 'media' || n.type === 'link') {
          const o = ATT_OF[n.ref];
          if (!o) return base;
          if (o.att.kind === 'link') return Object.assign(base, {
            line: o.att.url, href: o.att.url,
            actions: [{ act: 'open-link', href: o.att.url, label: 'Open the link', primary: true }]
          });
          return Object.assign(base, { line: Media.human(o.att.size) + ' · ' + (o.att.mime || o.att.kind), thumb: n._url });
        }
        return base;
      },
      onChange: fn => listeners.push(fn),
      // Neighbours as they would appear on the canvas, admitting any that
      // are not yet there so the orbit is never artificially empty.
      orbit(id, cap) {
        const n = nodes.get(id);
        if (!n) return [];
        const seen = new Set([id]);
        const out = [];
        for (const nb of neighbours(n)) {
          if (seen.has(nb.id)) continue;
          seen.add(nb.id);
          out.push(nb);
          if (out.length >= (cap || 12)) break;
        }
        return out.map(nb => {
          let node = nodes.get(nb.id);
          if (!node) {
            node = addNode({ id: nb.id, type: nb.type, ref: nb.ref, px: n.x, py: n.y,
                             depth: (n.depth || 0) + 1 });
            node.label = label(node); node.category = category(node);
            addEdge(n.id, nb.id, nb.kind);
            if (node.type === 'media') resolveThumb(node);
            markDirty();
          }
          return node;
        });
      }
    }
  };
})();
