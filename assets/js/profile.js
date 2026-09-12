/* ============================================================
   Palinode — the standing belief profile

   A journal-wide view of the 27 spectra. The radar is the shape
   of what has been answered: radius is |score| (commitment away
   from balanced), and only placed axes appear. The list below is
   the whole instrument. Scores are read, never written here.
   ============================================================ */

(function () {
  const { Belief } = window.PalinodeStore;
  const BEL = window.PalinodeBeliefs;
  const BSCORE = window.PalinodeBeliefScore;
  const SPECUI = window.PalinodeSpectrumUI;

  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  const CX = 210, CY = 210, R = 128;
  const RING_RS = [0.2, 0.6, 1];

  let insightsWasClosed = false;
  let railWasClosed = false;

  function bodyEl() { return document.getElementById('body'); }
  function root() { return document.getElementById('profile-view'); }

  function isOpen() {
    const body = bodyEl();
    return !!(body && body.classList.contains('profile-mode'));
  }

  function hideWriteCentre() {
    const ed = $('#editor-wrap');
    const empty = $('#empty-state');
    const read = $('#reading-room');
    const walk = $('#pathway-wrap');
    const pe = $('#path-empty');
    const dash = $('#dashboard-wrap');
    if (ed) ed.hidden = true;
    if (empty) { empty.hidden = true; empty.style.display = 'none'; }
    if (read) read.hidden = true;
    if (walk) walk.hidden = true;
    if (pe) pe.hidden = true;
    if (dash) dash.hidden = true;
  }

  function poleLabel(axis, score) {
    if (!score || score.leaning === 'balanced') return axis.title;
    return score.score < 0 ? axis.left : axis.right;
  }

  function vertex(i, n, r) {
    const a = -Math.PI / 2 + (i / Math.max(n, 1)) * Math.PI * 2;
    return {
      a,
      x: CX + Math.cos(a) * r * R,
      y: CY + Math.sin(a) * r * R
    };
  }

  function radarSvg(placed) {
    const n = placed.length;
    const rings = RING_RS.map(t =>
      `<circle class="prof-ring" cx="${CX}" cy="${CY}" r="${(t * R).toFixed(1)}"></circle>`
    ).join('');

    if (!n) {
      return `<svg viewBox="0 0 420 420" role="img" aria-label="No spectra placed yet">${rings}</svg>`;
    }

    const pts = placed.map((p, i) => {
      const r = Math.min(1, Math.abs(p.score.score));
      const edge = vertex(i, n, 1);
      const at = vertex(i, n, r);
      const lab = vertex(i, n, 1.22);
      const anchor = Math.abs(Math.cos(edge.a)) < 0.38
        ? 'middle'
        : Math.cos(edge.a) > 0 ? 'start' : 'end';
      const dy = Math.sin(edge.a) > 0.55 ? 11 : Math.sin(edge.a) < -0.55 ? -4 : 3;
      return { ...p, edge, at, lab, anchor, dy, r };
    });

    const spokes = pts.map(p =>
      `<line class="prof-spoke" x1="${CX}" y1="${CY}" x2="${p.edge.x.toFixed(1)}" y2="${p.edge.y.toFixed(1)}"></line>`
    ).join('');

    const d = pts.map((p, i) =>
      `${i ? 'L' : 'M'}${p.at.x.toFixed(1)},${p.at.y.toFixed(1)}`).join(' ') + (n > 2 ? ' Z' : '');

    let shape = '';
    if (n >= 3) shape = `<path class="prof-poly" d="${d}"></path>`;
    else if (n === 2) shape = `<line class="prof-poly-line" x1="${pts[0].at.x.toFixed(1)}" y1="${pts[0].at.y.toFixed(1)}" x2="${pts[1].at.x.toFixed(1)}" y2="${pts[1].at.y.toFixed(1)}"></line>`;

    const verts = pts.map(p => {
      const label = poleLabel(p.axis, p.score);
      return `<g class="prof-vertex" data-axis="${esc(p.axis.id)}" title="${esc(p.axis.title)}">
        <circle cx="${p.at.x.toFixed(1)}" cy="${p.at.y.toFixed(1)}" r="4.5"></circle>
        <circle class="prof-hit" cx="${p.at.x.toFixed(1)}" cy="${p.at.y.toFixed(1)}" r="14"></circle>
        <text x="${p.lab.x.toFixed(1)}" y="${p.lab.y.toFixed(1)}"
              text-anchor="${p.anchor}" dy="${p.dy}">${esc(label)}</text>
      </g>`;
    }).join('');

    return `<svg viewBox="0 0 420 420" role="img" aria-label="Placed spectra">${rings}${spokes}${shape}${verts}</svg>`;
  }

  function profileAxis(axis, score) {
    const answered = Belief.answeredCount(axis.id);
    const items = BEL.itemsFor(axis.id).length;
    const side = score ? (score.leaning === 'balanced' ? 0 : Math.sign(score.score)) : 0;
    return `<article class="prof-axis${score ? '' : ' unplaced'}" data-axis="${esc(axis.id)}">
      <div class="prof-axis-head">
        <h4>${esc(axis.title)}</h4>
        ${score ? `<span class="prof-tag">${esc(BSCORE.label(score.leaning))}</span>` : ''}
      </div>
      ${SPECUI.track(axis, {
        tentative: null,
        placed: score ? score.score : null,
        placedN: score ? score.n : 0
      })}
      ${SPECUI.poles(axis, side)}
      <p class="prof-line">${esc(score ? BSCORE.describe(axis.id, score) : axis.question)}</p>
      <div class="prof-axis-foot">
        <span class="n">${answered} of ${items} answered</span>
        <button class="ghost" type="button" data-place="${esc(axis.id)}">${
          score ? 'Answer another' : 'Place yourself'}</button>
      </div>
    </article>`;
  }

  function render() {
    const view = root();
    if (!view) return;
    const scores = Belief.scores();
    const cov = Belief.coverage();
    const placed = BEL.SPECTRA
      .filter(s => scores[s.id])
      .map(s => ({ axis: s, score: scores[s.id] }));

    const byBranch = {};
    BEL.SPECTRA.forEach(s => (byBranch[s.branch] = byBranch[s.branch] || []).push(s));

    const branches = Object.keys(byBranch).map(branch => {
      const axes = byBranch[branch].slice().sort((a, b) => {
        const pa = scores[a.id] ? 0 : 1, pb = scores[b.id] ? 0 : 1;
        return pa - pb || a.title.localeCompare(b.title);
      });
      const nPlaced = axes.filter(a => scores[a.id]).length;
      return `<section class="prof-branch">
        <div class="prof-branch-head">
          <h3>${esc(branch)}</h3>
          <span class="n">${nPlaced} of ${axes.length}</span>
        </div>
        ${axes.map(a => profileAxis(a, scores[a.id])).join('')}
      </section>`;
    }).join('');

    const lede = cov.placed
      ? 'Only answered items are here. What your writing leans toward stays in the note it came from.'
      : 'Nothing placed yet. Your writing can lean, but only an answer puts a mark on this page.';

    view.innerHTML = `
      <div class="prof-head">
        <div class="prof-cov"><b>${cov.placed}</b> of ${cov.total} spectra placed in this journal</div>
        <p class="prof-lede">${esc(lede)}</p>
      </div>
      <div id="prof-radar">${radarSvg(placed)}</div>
      ${branches}`;
  }

  function enter() {
    const body = bodyEl();
    const view = root();
    if (!view) return;
    if (body && !body.classList.contains('profile-mode')) {
      insightsWasClosed = body.classList.contains('insights-closed');
      railWasClosed = body.classList.contains('rail-closed');
      body.classList.add('profile-mode', 'insights-closed', 'rail-closed');
      body.classList.remove('show-insights', 'show-rail');
    }
    hideWriteCentre();
    view.hidden = false;
    bind();
    render();
  }

  function leave() {
    const view = root();
    if (view) view.hidden = true;
    const body = bodyEl();
    if (body) {
      body.classList.remove('profile-mode');
      if (!insightsWasClosed) body.classList.remove('insights-closed');
      if (!railWasClosed) body.classList.remove('rail-closed');
    }
  }

  function bind() {
    const view = root();
    if (!view || view.dataset.bound) return;
    view.dataset.bound = '1';
    view.addEventListener('click', e => {
      const place = e.target.closest('[data-place]');
      if (place) {
        if (typeof window.PalinodeProfile.onPlace === 'function')
          window.PalinodeProfile.onPlace(place.dataset.place);
        return;
      }
      const vert = e.target.closest('.prof-vertex');
      if (!vert) return;
      const axis = view.querySelector('.prof-axis[data-axis="' + vert.getAttribute('data-axis') + '"]');
      if (axis) axis.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  window.PalinodeProfile = {
    enter, leave, isOpen, render, onPlace: null,
    radarHtml(placed) { return radarSvg(placed || []); }
  };
})();
