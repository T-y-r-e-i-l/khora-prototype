/* ============================================================
   Palinode — Belief scoring

   The whole standing profile is a pure function of answered items
   plus the authored seed. Nothing else writes to it: not prose,
   not the reader, not a model. Recompute, never accumulate.

   Contract (kept identical to Khora so answers stay portable):
     · latest answer wins per item
     · per-axis `score` is the mean of signed deltas, in [-1, 1]
     · `n` is how many answers touched the axis
     · `confidence` combines coverage with agreement
     · an axis with no answers is absent — it is never scored 0
   ============================================================ */

(function () {
  const FULL_COVERAGE = 3;          // answers at which coverage saturates
  const LEAN = 0.2;                 // leans-left / leans-right threshold
  const COMMITTED = 0.6;            // committed-left / committed-right threshold

  const LEANINGS = {
    'unexplored':      { label: 'Unexplored',         blurb: 'No item answered on this spectrum yet.' },
    'committed-left':  { label: 'Committed',          blurb: 'Your answers land firmly on this pole.' },
    'leans-left':      { label: 'Leaning',            blurb: 'A tendency, not yet a commitment.' },
    'balanced':        { label: 'Holding the tension',blurb: 'Your answers pull both ways. This is a position, not a gap.' },
    'leans-right':     { label: 'Leaning',            blurb: 'A tendency, not yet a commitment.' },
    'committed-right': { label: 'Committed',          blurb: 'Your answers land firmly on this pole.' }
  };

  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

  /* responses: { [itemId]: { optionId, at } }
     Returns   : { [axisId]: { axisId, score, n, confidence, leaning } } */
  function scoreResponses(responses) {
    const seed = window.PalinodeBeliefs;
    const buckets = {};
    if (!seed || !responses) return {};

    for (const itemId of Object.keys(responses)) {
      const res = responses[itemId];
      if (!res || !res.optionId) continue;
      const item = seed.item(itemId);
      if (!item) continue;                                  // seed changed under us
      const opt = item.options.find(o => o.id === res.optionId);
      if (!opt) continue;

      for (const d of (opt.deltas || [])) {
        if (!seed.spectrum(d.axisId)) continue;
        (buckets[d.axisId] = buckets[d.axisId] || []).push(clamp(d.delta, -1, 1));
      }
    }

    const out = {};
    for (const axisId of Object.keys(buckets)) {
      const deltas = buckets[axisId];
      const n = deltas.length;
      const score = clamp(deltas.reduce((a, b) => a + b, 0) / n, -1, 1);

      // Coverage: how much of the axis has been probed.
      const coverage = Math.min(1, n / FULL_COVERAGE);
      // Agreement: one answer tells us nothing about consistency, so a
      // single response is treated as neutral rather than unanimous.
      const mean = score;
      const spread = n > 1
        ? Math.sqrt(deltas.reduce((s, d) => s + (d - mean) * (d - mean), 0) / n)
        : 0.5;
      const agreement = clamp(1 - spread, 0, 1);

      const confidence = clamp(coverage * 0.6 + agreement * 0.4, 0, 1);
      out[axisId] = { axisId, score, n, confidence, leaning: leaning(score) };
    }
    return out;
  }

  function leaning(score) {
    if (typeof score !== 'number') return 'unexplored';
    if (score <= -COMMITTED) return 'committed-left';
    if (score <= -LEAN) return 'leans-left';
    if (score < LEAN) return 'balanced';
    if (score < COMMITTED) return 'leans-right';
    return 'committed-right';
  }

  /* The sentence a spectrum bar carries. Never "you are a determinist".
     A single answer can clear the committed threshold on score alone, so
     the wording says how thin the basis is rather than letting the label
     imply more coverage than there is. */
  function describe(axisId, entry) {
    const s = window.PalinodeBeliefs.spectrum(axisId);
    if (!s) return '';
    if (!entry || !entry.n) return 'Unexplored — no item answered here yet.';
    const key = entry.leaning;
    const pole = key.indexOf('left') >= 0 ? s.left : key.indexOf('right') >= 0 ? s.right : null;
    const thin = entry.n === 1;
    if (!pole) {
      return thin
        ? 'On one answer, you sit between ' + s.left + ' and ' + s.right + '.'
        : 'Holding the tension between ' + s.left + ' and ' + s.right + '.';
    }
    return thin
      ? 'On one answer, you land toward ' + pole + '.'
      : LEANINGS[key].label + ' toward ' + pole + '.';
  }

  /* What the basis actually is, for the line under a result. */
  function basis(entry) {
    if (!entry || !entry.n) return 'Nothing answered here yet.';
    if (entry.n === 1) return 'One answer is a first mark, not a verdict. Another item will tell you whether it holds.';
    return LEANINGS[entry.leaning].blurb;
  }

  /* Coverage of the instrument as a whole — "N of 27 axes placed".
     Deliberately not a score: it measures exploration, not quality. */
  function coverage(scores) {
    const total = window.PalinodeBeliefs.count.spectra;
    const placed = Object.keys(scores || {}).length;
    return { placed, total, pct: total ? Math.round((placed / total) * 100) : 0 };
  }

  window.PalinodeBeliefScore = {
    scoreResponses, leaning, describe, basis, coverage,
    LEANINGS,
    thresholds: { LEAN, COMMITTED, FULL_COVERAGE },
    label: key => (LEANINGS[key] || LEANINGS.unexplored).label
  };
})();
