/* ============================================================
   Palinode — Persistence, daily prompt state, and sharing
   localStorage with a silent in-memory fallback, so the app
   still runs in private windows and sandboxed previews.
   ============================================================ */

(function () {
  const KEY = 'palinode.v1';
  const memory = {};
  let usingMemory = false;

  const backing = {
    get(k) {
      try { const v = localStorage.getItem(k); return v; }
      catch (e) { usingMemory = true; return memory[k] ?? null; }
    },
    set(k, v) {
      try { localStorage.setItem(k, v); }
      catch (e) { usingMemory = true; memory[k] = v; }
    }
  };

  const blank = () => ({
    notes: [],
    pathways: [],
    prompt: { date: null, deck: [], cursor: 0, skips: 0, written: [] },
    prefs: {
      filters: { resonance:true, tension:true, clarity:true, stance:true, lineage:true },
      dismissed: {},
      tours: { explore: false, write: false, insights: false, market: false, pathways: false, quests: false, profile: false }
    },
    // Only answered items live here. Scores are never stored — they are
    // recomputed from these responses plus the authored seed.
    belief: { responses: {}, dismissedItems: [] }
  });

  function load() {
    const raw = backing.get(KEY);
    if (!raw) return blank();
    try {
      const parsed = JSON.parse(raw);
      const next = Object.assign(blank(), parsed);
      // Saves written before the belief instrument existed have no such key.
      next.belief = Object.assign(blank().belief, parsed.belief || {});
      next.prefs = Object.assign(blank().prefs, parsed.prefs || {});
      next.prefs.filters = Object.assign(blank().prefs.filters, (parsed.prefs && parsed.prefs.filters) || {});
      next.prefs.dismissed = Object.assign({}, (parsed.prefs && parsed.prefs.dismissed) || {});
      next.prefs.tours = Object.assign(blank().prefs.tours, (parsed.prefs && parsed.prefs.tours) || {});
      next.pathways = parsed.pathways || [];
      (next.notes || []).forEach(n => { if (!n.pathwayIds) n.pathwayIds = []; });
      return next;
    } catch (e) { return blank(); }
  }

  let state = load();
  const save = () => backing.set(KEY, JSON.stringify(state));

  /* ---------- ids & dates ---------- */
  const uid = () => 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const today = () => new Date().toISOString().slice(0, 10);

  // Deterministic shuffle so "today's prompt" is stable across reloads.
  function seededDeck(dateStr, length) {
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) seed = (seed * 31 + dateStr.charCodeAt(i)) >>> 0;
    const idx = Array.from({ length }, (_, i) => i);
    for (let i = length - 1; i > 0; i--) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const j = seed % (i + 1);
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
  }

  /* ---------- notes ---------- */
  const Notes = {
    all() { return state.notes.slice().sort((a, b) => b.updated - a.updated); },
    get(id) { return state.notes.find(n => n.id === id) || null; },
    create(seed = {}) {
      const now = Date.now();
      const note = {
        id: uid(),
        title: seed.title || '',
        body: seed.body || '',
        promptId: seed.promptId || null,
        promptText: seed.promptText || null,
        questId: seed.questId || null,
        questStepId: seed.questStepId || null,
        created: now,
        updated: now,
        shared: false,
        concepts: [],
        saved: [],
        attachments: [],
        pathwayIds: []
      };
      state.notes.unshift(note);
      save();
      return note;
    },
    update(id, patch) {
      const n = Notes.get(id);
      if (!n) return null;
      Object.assign(n, patch, { updated: Date.now() });
      save();
      return n;
    },
    remove(id) {
      const n = Notes.get(id);
      if (n) (n.pathwayIds || []).slice().forEach(pid => detachNote(pid, id, true));
      state.notes = state.notes.filter(x => x.id !== id);
      save();
    },
    search(q) {
      const term = q.trim().toLowerCase();
      if (!term) return Notes.all();
      return Notes.all().filter(n =>
        (n.title + ' ' + n.body + ' ' + (n.concepts || []).join(' ')).toLowerCase().includes(term));
    }
  };

  /* ---------- daily prompt with a 3-skip allowance ---------- */
  const MAX_SKIPS = 3;

  const Prompts = {
    MAX_SKIPS,
    state() {
      const list = window.PalinodePrompts;
      const d = today();
      if (state.prompt.date !== d) {
        state.prompt = { date: d, deck: seededDeck(d, list.length), cursor: 0, skips: 0, written: state.prompt.written || [] };
        save();
      }
      const p = list[state.prompt.deck[state.prompt.cursor]];
      return {
        prompt: p,
        skips: state.prompt.skips,
        remaining: MAX_SKIPS - state.prompt.skips,
        exhausted: state.prompt.skips >= MAX_SKIPS,
        date: d
      };
    },
    skip() {
      const s = Prompts.state();
      if (s.exhausted) return s;
      state.prompt.skips += 1;
      state.prompt.cursor = (state.prompt.cursor + 1) % state.prompt.deck.length;
      save();
      return Prompts.state();
    },
    markWritten(promptId) {
      state.prompt.written = state.prompt.written || [];
      if (!state.prompt.written.includes(promptId)) state.prompt.written.push(promptId);
      save();
    },
    // Dev affordance: reset the day so the skip limit can be demonstrated repeatedly.
    resetDay() {
      state.prompt.date = null;
      save();
      return Prompts.state();
    }
  };

  /* ---------- preferences ---------- */
  const Prefs = {
    filters() { return state.prefs.filters; },
    toggleFilter(cat) {
      state.prefs.filters[cat] = !state.prefs.filters[cat];
      save();
      return state.prefs.filters;
    },
    dismiss(noteId, key) {
      state.prefs.dismissed[noteId] = state.prefs.dismissed[noteId] || [];
      if (!state.prefs.dismissed[noteId].includes(key)) state.prefs.dismissed[noteId].push(key);
      save();
    },
    undismissAll(noteId) {
      delete state.prefs.dismissed[noteId];
      save();
    },
    dismissed(noteId) { return state.prefs.dismissed[noteId] || []; },
    isTourDone(id) {
      const tours = state.prefs.tours || {};
      return !!tours[id];
    },
    tourDone(id) {
      if (!state.prefs.tours) state.prefs.tours = {};
      state.prefs.tours[id] = true;
      save();
    }
  };

  /* ---------- attachments: media and links kept on the note ---------- */
  const Attach = {
    all(noteId) {
      const n = Notes.get(noteId);
      return n ? (n.attachments || []) : [];
    },
    add(noteId, att) {
      const n = Notes.get(noteId);
      if (!n) return null;
      n.attachments = n.attachments || [];
      const rec = Object.assign({ id: 'a' + uid(), at: Date.now() }, att);
      n.attachments.push(rec);
      n.updated = Date.now();
      save();
      return rec;
    },
    update(noteId, attId, patch) {
      const n = Notes.get(noteId);
      if (!n) return;
      const a = (n.attachments || []).find(x => x.id === attId);
      if (!a) return;
      Object.assign(a, patch);
      n.updated = Date.now();
      save();
    },
    remove(noteId, attId) {
      const n = Notes.get(noteId);
      if (!n) return;
      n.attachments = (n.attachments || []).filter(x => x.id !== attId);
      n.updated = Date.now();
      save();
    }
  };

  /* ---------- saved: what exploring turned up, kept on the note ----------
     A discovery belongs to the note that led you to it, so it is still
     there when you come back to that entry.                            */
  const Saved = {
    all(noteId) {
      const n = Notes.get(noteId);
      return n ? (n.saved || []).slice().sort((a, b) => b.at - a.at) : [];
    },
    has(noteId, id) {
      const n = Notes.get(noteId);
      return !!n && (n.saved || []).some(x => x.id === id);
    },
    toggle(noteId, node) {
      const n = Notes.get(noteId);
      if (!n) return false;
      n.saved = n.saved || [];
      const i = n.saved.findIndex(x => x.id === node.id);
      if (i >= 0) n.saved.splice(i, 1);
      else n.saved.unshift({ id: node.id, type: node.type, label: node.label,
                             sub: node.sub || '', category: node.category || 'lineage', at: Date.now() });
      n.updated = Date.now();
      save();
      return Saved.has(noteId, node.id);
    },
    remove(noteId, id) {
      const n = Notes.get(noteId);
      if (!n) return;
      n.saved = (n.saved || []).filter(x => x.id !== id);
      n.updated = Date.now();
      save();
    }
  };

  /* ---------- pathways: a curated walk through worlds ----------
     Steps are snapshots of graph nodes. A note and a pathway name
     each other, so either side can find the relationship.        */

  function noteIdFromStep(step) {
    if (!step) return null;
    if (step.type === 'note' || step.type === 'note-other')
      return step.noteId || (step.ref && step.ref !== 'note' ? step.ref : null);
    return null;
  }

  function attachNote(pathwayId, noteId) {
    const p = state.pathways.find(x => x.id === pathwayId);
    const n = Notes.get(noteId);
    if (!p || !n) return;
    p.noteIds = p.noteIds || [];
    n.pathwayIds = n.pathwayIds || [];
    if (!p.noteIds.includes(noteId)) p.noteIds.push(noteId);
    if (!n.pathwayIds.includes(pathwayId)) n.pathwayIds.push(pathwayId);
  }

  function detachNote(pathwayId, noteId, dropSteps) {
    const p = state.pathways.find(x => x.id === pathwayId);
    const n = Notes.get(noteId);
    if (p) {
      p.noteIds = (p.noteIds || []).filter(id => id !== noteId);
      if (dropSteps) p.steps = (p.steps || []).filter(s => noteIdFromStep(s) !== noteId);
      p.updated = Date.now();
    }
    if (n) n.pathwayIds = (n.pathwayIds || []).filter(id => id !== pathwayId);
  }

  const Pathways = {
    all() { return state.pathways.slice().sort((a, b) => b.updated - a.updated); },
    get(id) { return state.pathways.find(p => p.id === id) || null; },

    create(seed = {}) {
      const now = Date.now();
      const rec = {
        id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        title: seed.title || '',
        created: now,
        updated: now,
        steps: (seed.steps || []).map(s => Object.assign({}, s)),
        noteIds: (seed.noteIds || []).slice(),
        attachments: (seed.attachments || []).slice()
      };
      state.pathways.unshift(rec);
      rec.noteIds.forEach(nid => attachNote(rec.id, nid));
      rec.steps.forEach(s => {
        const nid = noteIdFromStep(s);
        if (nid) attachNote(rec.id, nid);
      });
      save();
      return rec;
    },

    update(id, patch) {
      const p = Pathways.get(id);
      if (!p) return null;
      Object.assign(p, patch, { updated: Date.now() });
      save();
      return p;
    },

    remove(id) {
      const p = Pathways.get(id);
      if (!p) return;
      (p.noteIds || []).slice().forEach(nid => detachNote(id, nid));
      (p.attachments || []).forEach(a => {
        if (a.kind && a.kind !== 'link' && window.PalinodeMedia)
          window.PalinodeMedia.del(a.id);
      });
      state.pathways = state.pathways.filter(x => x.id !== id);
      save();
    },

    linkNote(pathwayId, noteId) {
      attachNote(pathwayId, noteId);
      const p = Pathways.get(pathwayId);
      if (p) p.updated = Date.now();
      save();
    },

    unlinkNote(pathwayId, noteId) {
      detachNote(pathwayId, noteId);
      save();
    },

    addStep(pathwayId, step, after) {
      const p = Pathways.get(pathwayId);
      if (!p) return null;
      const s = Object.assign({}, step);
      if (after == null || after >= p.steps.length) p.steps.push(s);
      else p.steps.splice(after + 1, 0, s);
      const nid = noteIdFromStep(s);
      if (nid) attachNote(pathwayId, nid);
      p.updated = Date.now();
      save();
      return s;
    },

    removeStep(pathwayId, stepId) {
      const p = Pathways.get(pathwayId);
      if (!p) return;
      const gone = p.steps.find(s => s.id === stepId);
      p.steps = p.steps.filter(s => s.id !== stepId);
      if (gone) {
        const nid = noteIdFromStep(gone);
        if (nid && !p.steps.some(s => noteIdFromStep(s) === nid))
          detachNote(pathwayId, nid);
      }
      p.updated = Date.now();
      save();
    },

    addAttachment(pathwayId, att) {
      const p = Pathways.get(pathwayId);
      if (!p) return null;
      const rec = Object.assign({ id: 'a' + uid(), at: Date.now() }, att);
      p.attachments = p.attachments || [];
      p.attachments.push(rec);
      p.updated = Date.now();
      save();
      return rec;
    },

    removeAttachment(pathwayId, attId) {
      const p = Pathways.get(pathwayId);
      if (!p) return;
      p.attachments = (p.attachments || []).filter(x => x.id !== attId);
      p.steps = (p.steps || []).filter(s => s.ref !== attId && s.id !== attId);
      p.updated = Date.now();
      save();
    }
  };

  /* ---------- belief profile: answers in, scores derived ----------
     The journal mark on a spectrum moves only through `answer`. Prose
     never reaches this store — a note can lean, and leaning is not
     placing. Latest answer wins per item, so changing your mind is a
     first-class operation rather than an accumulation.               */
  const Belief = {
    responses() { return Object.assign({}, state.belief.responses); },

    answer(itemId, optionId, source) {
      const seed = window.PalinodeBeliefs;
      const item = seed && seed.item(itemId);
      if (!item || !item.options.some(o => o.id === optionId)) return null;
      state.belief.responses[itemId] = { optionId, at: Date.now(), source: source || 'beliefs' };
      // Answering settles the question, so it stops being a pending prompt.
      state.belief.dismissedItems = state.belief.dismissedItems.filter(x => x !== itemId);
      save();
      return Belief.scores()[item.axisId] || null;
    },

    answerFor(itemId) { return state.belief.responses[itemId] || null; },

    scores() {
      const scorer = window.PalinodeBeliefScore;
      return scorer ? scorer.scoreResponses(state.belief.responses) : {};
    },

    score(axisId) { return Belief.scores()[axisId] || null; },

    coverage() {
      const scorer = window.PalinodeBeliefScore;
      return scorer ? scorer.coverage(Belief.scores()) : { placed: 0, total: 0, pct: 0 };
    },

    dismissItem(itemId) {
      if (!state.belief.dismissedItems.includes(itemId)) state.belief.dismissedItems.push(itemId);
      save();
    },
    dismissedItems() { return state.belief.dismissedItems.slice(); },

    // The next item worth putting in front of someone on a given axis:
    // unanswered, not set aside, and stable in order so a reload does
    // not swap the question out from under them.
    nextItem(axisId) {
      const seed = window.PalinodeBeliefs;
      if (!seed) return null;
      const skip = state.belief.dismissedItems;
      return seed.itemsFor(axisId).find(it =>
        !state.belief.responses[it.id] && !skip.includes(it.id)) || null;
    },

    answeredCount(axisId) {
      const seed = window.PalinodeBeliefs;
      if (!seed) return 0;
      return seed.itemsFor(axisId).filter(it => state.belief.responses[it.id]).length;
    },

    reset() {
      state.belief = { responses: {}, dismissedItems: [] };
      save();
    }
  };

  /* ---------- sharing: encode the note into the URL ---------- */
  const b64 = {
    encode(str) {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      bytes.forEach(b => { bin += String.fromCharCode(b); });
      return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    },
    decode(s) {
      const norm = s.replace(/-/g, '+').replace(/_/g, '/');
      const bin = atob(norm + '==='.slice((norm.length + 3) % 4));
      const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
  };

  const Share = {
    // Text, links and saved nodes travel; saved nodes travel as bare ids
    // because the recipient's copy already has the corpus to resolve them.
    // Binary media cannot go in a URL — see `manifest`.
    link(note, opts = {}) {
      const payload = {
        t: note.title || 'Untitled',
        b: note.body,
        p: note.promptText || null,
        d: note.created,
        a: opts.includeAnalysis !== false
      };
      if (opts.includeLinks !== false) {
        const links = (note.attachments || []).filter(x => x.kind === 'link');
        if (links.length) payload.l = links.map(x => [x.url, x.title || '']);
      }
      if (opts.includeSaved !== false && (note.saved || []).length) {
        payload.s = note.saved.map(x => x.id);
      }
      const base = location.href.split('#')[0];
      return base + '#/shared/' + b64.encode(JSON.stringify(payload));
    },

    // What a link can and cannot carry, so the share sheet can say so.
    manifest(note) {
      const at = note.attachments || [];
      return {
        links: at.filter(x => x.kind === 'link').length,
        media: at.filter(x => x.kind !== 'link').length,
        saved: (note.saved || []).length
      };
    },
    parse(hash) {
      const m = /^#\/shared\/(.+)$/.exec(hash || '');
      if (!m) return null;
      try { return JSON.parse(b64.decode(m[1])); }
      catch (e) { return null; }
    }
  };

  window.PalinodeStore = {
    Notes, Prompts, Prefs, Share, Saved, Attach, Belief, Pathways,
    usingMemory: () => usingMemory,
    exportAll: () => JSON.stringify(state, null, 2),
    seedIfEmpty(samples) {
      if (state.notes.length) return;
      samples.forEach(s => Notes.create(s));
    }
  };
})();
