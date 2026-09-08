/* ============================================================
   Palinode — Analysis Engine

   PUBLIC CONTRACT (keep stable across providers)
   ----------------------------------------------
     PalinodeEngine.analyze(text) -> Promise<Analysis>

     Analysis = {
       insights : Insight[]      // ordered by position in the text
       concepts : ConceptHit[]   // deduplicated, drives the constellation
       leans    : Lean[]         // tentative only — see below
       metrics  : Metrics        // 0–100 each, plus `overall`
       stats    : Stats
     }

     Insight = {
       key, category, label, tradition, reading, turn,
       sources: [{work, author, note}],
       span: {start, end} | null,
       excerpt, kin: string[]
     }

     Lean = {
       axisId, delta, n, confidence, span, excerpt,
       via: 'concept' | 'trigger', note, from: [{key, label}]
     }

   `leans` says which canonical belief spectra this passage is in the
   neighbourhood of, and which way it tips. It is a reading of the TEXT
   and nothing more: the standing profile in PalinodeStore.Belief moves
   only when an authored item is answered. Never render a lean as a
   verdict about the writer.

   The rule-based provider below is deterministic and offline.
   To swap in a model-backed provider, implement the same async
   `analyze` and register it:  PalinodeEngine.use(myProvider)
   Nothing in the UI reads anything but the contract above.
   ============================================================ */

(function () {
  const { CATEGORIES, TRADITIONS, CONCEPTS, TENSIONS, LOADED_TERMS, STANCE_MARKERS } = window.PalinodeCorpus;

  /* ---------- helpers ---------- */

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  function words(text) {
    return (text.match(/[A-Za-zÀ-ɏ'’-]+/g) || []);
  }

  function sentences(text) {
    return text.split(/(?<=[.!?])\s+|\n+/).map(s => s.trim()).filter(Boolean);
  }

  // Widen a match to the sentence that contains it, for the excerpt.
  function sentenceAround(text, index) {
    let start = index;
    while (start > 0 && !/[.!?\n]/.test(text[start - 1])) start--;
    let end = index;
    while (end < text.length && !/[.!?\n]/.test(text[end])) end++;
    return text.slice(start, Math.min(end + 1, text.length)).trim();
  }

  // Grow a span outward to whole-word edges so underlines never cut mid-word.
  function snap(text, start, end) {
    while (start > 0 && /[\w'’-]/.test(text[start - 1])) start--;
    while (end < text.length && /[\w'’-]/.test(text[end])) end++;
    return { start, end, text: text.slice(start, end) };
  }

  function firstMatch(text, re) {
    const rx = new RegExp(re.source, re.flags.replace('g', ''));
    const m = rx.exec(text);
    return m ? snap(text, m.index, m.index + m[0].length) : null;
  }

  function allMatches(text, re) {
    const rx = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const out = [];
    let m;
    let guard = 0;
    while ((m = rx.exec(text)) !== null && guard++ < 500) {
      if (m[0].length === 0) { rx.lastIndex++; continue; }
      out.push(snap(text, m.index, m.index + m[0].length));
    }
    return out;
  }

  /* ---------- contradiction detection ---------- */
  // Looks for a sentence asserting constraint alongside one asserting agency.
  const CONSTRAINT = /\b(I (had|have) to|no choice|couldn'?t|can'?t|impossible|forced|stuck|trapped)\b/i;
  const AGENCY     = /\b(I (chose|decided|picked|wanted|preferred)|I could have|my (choice|decision)|on purpose|deliberately)\b/i;

  function findContradiction(text) {
    const sents = sentences(text);
    let cIdx = -1, aIdx = -1;
    sents.forEach((s, i) => {
      if (cIdx < 0 && CONSTRAINT.test(s)) cIdx = i;
      if (aIdx < 0 && AGENCY.test(s)) aIdx = i;
    });
    if (cIdx < 0 || aIdx < 0) return null;
    const target = sents[Math.max(cIdx, aIdx)];
    const start = text.indexOf(target);
    if (start < 0) return null;
    return { start, end: start + target.length, text: target,
             pair: [sents[cIdx], sents[aIdx]] };
  }

  /* ---------- metrics ---------- */

  const GROUNDING = /\b(because|since|for (example|instance)|specifically|last (week|night|month|year|time)|yesterday|this morning|when I|at \d|in \d{4}|according to)\b/gi;
  const COUNTERPOINT = /\b(but|however|although|though|on the other hand|then again|and yet|except that|admittedly|granted)\b/gi;
  const REFLEXIVE = /\b(I (wonder|notice|realise|realize|suspect|admit|assume)|I might be wrong|maybe I('?m| am)|part of me|I catch myself|why do I)\b/gi;

  function computeMetrics(text, wc, conceptHits, insights) {
    if (wc < 12) return { inquiry:0, grounding:0, reflexivity:0, range:0, dialectic:0, overall:0, thin:true };

    const per100 = n => (n / wc) * 100;

    const questions = (text.match(/\?/g) || []).length;
    const inquiry = clamp(Math.round(per100(questions) * 26), 0, 100);

    const grounding = clamp(Math.round(per100((text.match(GROUNDING) || []).length) * 22), 0, 100);

    const reflexivity = clamp(Math.round(per100((text.match(REFLEXIVE) || []).length) * 30), 0, 100);

    const traditions = new Set(conceptHits.map(c => c.tradition));
    const range = clamp(Math.round(conceptHits.length * 6.5 + traditions.size * 6.5), 0, 100);

    const counter = (text.match(COUNTERPOINT) || []).length;
    const unresolvedTension = insights.filter(i => i.category === 'tension').length;
    const dialectic = clamp(Math.round(per100(counter) * 20 - unresolvedTension * 6 + 8), 0, 100);

    const overall = Math.round(
      inquiry * 0.18 + grounding * 0.22 + reflexivity * 0.24 + range * 0.20 + dialectic * 0.16
    );

    return { inquiry, grounding, reflexivity, range, dialectic, overall: clamp(overall, 0, 100), thin:false };
  }

  /* ---------- tentative leans on the belief spectra ----------
     A second reading of the same hits. Which authored axes is this
     passage standing near, and which way does it tip? Axes with no
     hit are simply absent: honest incompleteness beats a full grid
     of zeroes. Nothing here is persisted or treated as a placement. */

  function conceptAxes(conceptId) {
    // A concept may declare `axes: [{ id, lean, note }]` inline; the
    // seed's central map is the default for everything that does not.
    const c = CONCEPTS.find(x => x.id === conceptId);
    if (c && c.axes && c.axes.length) return c.axes;
    return window.PalinodeBeliefs.axesForConcept(conceptId);
  }

  function computeLeans(insights) {
    const seed = window.PalinodeBeliefs;
    if (!seed) return [];

    const buckets = {};

    for (const ins of insights) {
      const axes = ins.conceptId ? conceptAxes(ins.conceptId) : seed.axesForKey(ins.key);
      if (!axes || !axes.length) continue;

      for (const a of axes) {
        if (!seed.spectrum(a.id)) continue;
        const lean = clamp(Number(a.lean) || 0, -1, 1);
        if (!lean) continue;

        const b = buckets[a.id] || (buckets[a.id] = {
          axisId: a.id, leans: [], from: [], note: '', span: null, excerpt: '',
          via: 'trigger', strongest: 0
        });
        b.leans.push(lean);
        b.from.push({ key: ins.key, label: ins.label, category: ins.category });

        // The loudest contributor supplies the line and the underline,
        // so the tab points at the sentence that actually did this.
        if (Math.abs(lean) >= b.strongest) {
          b.strongest = Math.abs(lean);
          b.note = a.note || b.note;
          b.via = ins.conceptId ? 'concept' : 'trigger';
          if (ins.span) b.span = ins.span;
          if (ins.excerpt) b.excerpt = ins.excerpt;
        }
        if (!b.span && ins.span) b.span = ins.span;
        if (!b.excerpt && ins.excerpt) b.excerpt = ins.excerpt;
      }
    }

    return Object.values(buckets).map(b => {
      const n = b.leans.length;
      const delta = clamp(b.leans.reduce((x, y) => x + y, 0) / n, -1, 1);
      // Capped below 1 on purpose: a reading of prose is never as good
      // as an answered item, however many triggers agree.
      const confidence = clamp((Math.min(n, 3) / 3) * 0.5 + Math.abs(delta) * 0.4, 0, 0.9);
      // A passage that leans both ways on one axis averages out near the
      // middle. That is not a considered midpoint, it is a live argument
      // with itself — worth saying so, and worth surfacing first.
      const split = n > 1
        && b.leans.some(l => l < 0) && b.leans.some(l => l > 0)
        && Math.abs(delta) < 0.2;
      return {
        axisId: b.axisId, delta, n, confidence, split,
        span: b.span, excerpt: b.excerpt, via: b.via, note: b.note,
        from: b.from,
        // Engagement matters as much as direction: three triggers pulling
        // against each other is a hotter axis than one gentle tick.
        heat: Math.abs(delta) * 0.5 + (Math.min(n, 3) / 3) * 0.5
      };
    }).sort((a, b) => b.heat - a.heat);
  }

  /* ---------- the rule-based provider ---------- */

  const ruleProvider = {
    id: 'rule-based-v1',
    label: 'Palinode Rule Engine',

    async analyze(text) {
      const raw = text || '';
      const plain = raw.replace(/\s+/g, ' ');
      const wc = words(raw).length;
      const insights = [];
      const conceptHits = [];

      /* --- 1. Concepts (resonance / lineage / clarity) --- */
      for (const c of CONCEPTS) {
        const hit = firstMatch(raw, c.trigger);
        if (!hit) continue;
        conceptHits.push({ id:c.id, label:c.label, category:c.category, tradition:c.tradition, kin:c.kin || [] });
        insights.push({
          key: 'concept:' + c.id,
          conceptId: c.id,
          category: c.category,
          label: c.label,
          tradition: TRADITIONS[c.tradition] || c.tradition,
          reading: c.reading,
          turn: c.turn,
          sources: c.sources,
          span: { start: hit.start, end: hit.end },
          matched: hit.text,
          excerpt: sentenceAround(raw, hit.start),
          kin: (c.kin || []).map(k => {
            const kc = CONCEPTS.find(x => x.id === k);
            return kc ? { id: kc.id, label: kc.label, category: kc.category } : null;
          }).filter(Boolean)
        });
      }

      /* --- 2. Logical tensions --- */
      for (const t of TENSIONS) {
        if (t.custom === 'contradiction') continue;
        const hits = allMatches(raw, t.trigger);
        if (!hits.length) continue;
        const h = hits[0];
        insights.push({
          key: 'tension:' + t.id,
          category: 'tension',
          label: t.label,
          tradition: 'Logic',
          reading: t.reading,
          turn: t.turn,
          sources: t.sources,
          span: { start: h.start, end: h.end },
          matched: h.text,
          count: hits.length,
          excerpt: sentenceAround(raw, h.start),
          kin: []
        });
      }

      const contra = findContradiction(raw);
      if (contra) {
        const t = TENSIONS.find(x => x.custom === 'contradiction');
        if (t) insights.push({
          key: 'tension:contradiction',
          category: 'tension',
          label: 'Internal Contradiction',
          tradition: 'Dialectic',
          reading: t.reading,
          turn: t.turn,
          sources: t.sources,
          span: { start: contra.start, end: contra.end },
          matched: contra.text.slice(0, 40),
          excerpt: contra.pair.join('  ⟷  '),
          kin: []
        });
      }

      /* --- 3. Loaded terms (clarity) --- */
      for (const [term, meta] of Object.entries(LOADED_TERMS)) {
        const re = new RegExp('\\b' + term + '\\w{0,3}\\b', 'i');
        const hit = firstMatch(raw, re);
        if (!hit) continue;
        insights.push({
          key: 'term:' + term,
          category: 'clarity',
          label: '“' + hit.text + '” is undefined here',
          tradition: 'Conceptual analysis',
          reading: meta.contested,
          turn: meta.ask,
          sources: [{ work:'Philosophical Investigations', author:'Ludwig Wittgenstein', note:'Meaning is use — survey the cases before demanding an essence.' }],
          span: { start: hit.start, end: hit.end },
          matched: hit.text,
          excerpt: sentenceAround(raw, hit.start),
          kin: []
        });
      }

      /* --- 4. Stance markers --- */
      for (const s of STANCE_MARKERS) {
        const hits = allMatches(raw, s.trigger);
        if (hits.length < (s.threshold || 1)) continue;
        const h = hits[0];
        insights.push({
          key: 'stance:' + s.id,
          category: 'stance',
          label: s.label,
          tradition: s.positive ? 'Noted strength' : 'Epistemic stance',
          reading: s.reading,
          turn: s.turn,
          sources: s.sources,
          span: { start: h.start, end: h.end },
          matched: h.text,
          count: hits.length,
          positive: !!s.positive,
          excerpt: sentenceAround(raw, h.start),
          kin: []
        });
      }

      /* --- 5. Order by position, resolve overlapping spans --- */
      insights.sort((a, b) => (a.span?.start ?? 1e9) - (b.span?.start ?? 1e9));
      let lastEnd = -1;
      for (const ins of insights) {
        if (ins.span && ins.span.start < lastEnd) ins.span = null;   // still shown as a card, just not underlined
        else if (ins.span) lastEnd = ins.span.end;
      }

      const metrics = computeMetrics(raw, wc, conceptHits, insights);

      return {
        provider: this.id,
        insights,
        concepts: conceptHits,
        leans: computeLeans(insights),
        metrics,
        stats: {
          words: wc,
          sentences: sentences(raw).length,
          questions: (raw.match(/\?/g) || []).length,
          minutes: Math.max(1, Math.round(wc / 220)),
          chars: plain.length
        }
      };
    }
  };

  /* ---------- registry ---------- */
  let active = ruleProvider;

  window.PalinodeEngine = {
    use(provider) { active = provider; },
    current() { return active.label; },
    analyze(text) { return active.analyze(text); },
    categories: CATEGORIES
  };
})();
