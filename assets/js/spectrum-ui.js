/* ============================================================
   Palinode — the spectrum continuum, rendered once

   A spectrum bar reads left pole to right pole with two kinds of
   mark on it: a dashed tick for what a passage leans toward, and a
   filled tick for where answered items have placed the journal.
   The two must never be confusable, which is why there is one
   renderer and not one per caller.
   ============================================================ */

(function () {
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const clampN = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const pct = delta => ((clampN(delta, -1, 1) + 1) / 2) * 100;

  function track(axis, opts) {
    const o = opts || {};
    const args = (axis.arguments || []).map(a =>
      `<i class="spec-arg" style="left:${pct(a.position)}%" data-name="${esc(a.name)}"
          title="${esc(a.name)} — ${esc(a.capsule)}"></i>`).join('');
    const marks = [
      o.placed != null
        ? `<i class="spec-mark placed" style="left:${pct(o.placed)}%"
              title="Your journal mark, from ${o.placedN} answered item${o.placedN === 1 ? '' : 's'}"></i>` : '',
      o.tentative != null
        ? `<i class="spec-mark tentative" style="left:${pct(o.tentative)}%"
              title="Where this passage leans — tentative, and it does not move your journal"></i>` : ''
    ].join('');
    return `<div class="spec-track"><span class="spec-band"></span>${args}${marks}</div>`;
  }

  function poles(axis, side) {
    return `<div class="spec-poles">
      <i class="${side < 0 ? 'lean' : ''}">${esc(axis.left)}</i>
      <i class="${side > 0 ? 'lean' : ''}">${esc(axis.right)}</i>
    </div>`;
  }

  window.PalinodeSpectrumUI = { track, poles };
})();
