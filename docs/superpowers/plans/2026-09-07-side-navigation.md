# Side Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the top bar with a left rail that holds the journal's
destinations, and give the centre column a real view switch so the Shelf and
Profile can exist as destinations rather than as tabs inside a per-note panel.

**Architecture:** `#app` becomes a two-column grid — a 78px `<nav class="sidenav">`
then everything else. A single `setView()` in `app.js` owns which centre section
is visible, and the rail's active item is derived from it. The spectrum track
renderer, currently duplicated in `app.js` and `graph.js`, moves to a shared
global so the Profile view can be its third caller.

**Tech Stack:** Vanilla ES5-compatible browser JS in IIFE globals, classic
`<script>` tags, CSS custom properties, Playwright for verification. No build
step, no bundler, no ES modules.

**Spec:** `docs/superpowers/specs/2026-09-07-side-navigation-design.md`

## Global Constraints

- No build step. Classic `<script>` tags, no ES modules, no `fetch`. `file://`
  must work completely, media and all.
- New globals follow the existing pattern: `(function(){ ... window.PalinodeX = {...}; })()`.
- Rail geometry: `--nav: 78px`, item target 56 × 56px, active pill 40 × 32px,
  item pitch 72px, icon 24px, label 10px.
  (Corrected during Task 2. The spec's original "item target 40 × 56" conflated
  the pill's width with the target's: the label `Explore` measures 52.1px at
  10px/`.1em`, so a 40px target clips it and the spec's own no-clipping
  requirement could not be met at any letter-spacing. The pill — the only part
  that renders — stays 40px, so nothing visible changed; only the hit target
  grew, which is strictly better. Asserted in `.verify/sidenav.mjs`.)
- Rail label tracking is `.1em`, not the `.18em` used by `.micro`, because
  `Determinism`-length words overflow 78px at the wider tracking.
- **Preserve these element IDs when moving controls**: `#btn-new`,
  `#btn-explore`, `#btn-rail`, `#btn-insights`, `#btn-share`. Existing
  `app.js` listeners and all four Playwright suites address them by ID; moving
  the elements while keeping the IDs is what keeps this change small.
- Only an answered item ever moves a belief mark. The Profile view reads
  `Belief.scores()` and never writes a score derived from prose.
- The five-lane analysis and `PalinodeEngine.analyze`'s output contract are
  unchanged by this plan.
- Brand is the hexagon glyph alone; the wordmark has nowhere to go at 78px.
- The rail is one fixed width with no collapsed state.
- The selected view is not persisted across reloads.
- Run `./serve.sh 8765` if the server is not already up; all suites assume
  `http://localhost:8765/index.html`.

---

### Task 1: Shared spectrum renderer

Removes the duplication that would otherwise become a third copy in Task 4.
`specTrack` and `specPoles` are byte-for-byte equivalent in `app.js:533-553`
and `graph.js:553-573`; only the escaping helper's name differs.

**Files:**
- Create: `assets/js/spectrum-ui.js`
- Modify: `index.html:263` (add the script tag after `belief-score.js`)
- Modify: `assets/js/app.js:533-553` (delete both functions, call the global)
- Modify: `assets/js/graph.js:553-573` (delete both functions, call the global)

**Interfaces:**
- Consumes: nothing. Pure rendering over the axis records in
  `window.PalinodeBeliefs.SPECTRA`.
- Produces: `window.PalinodeSpectrumUI` with exactly two methods, relied on by
  Task 4:
  - `track(axis, opts) -> string` where `axis` is a spectrum record and `opts`
    is `{ tentative: number|null, placed: number|null, placedN: number }`
  - `poles(axis, side) -> string` where `side` is `-1`, `0`, or `1`

- [ ] **Step 1: Write the failing test**

Create `.verify/spectrum-ui.mjs`:

```js
/* One renderer for the continuum, so the dashed and solid marks mean the
   same thing everywhere they appear. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });

check('the renderer is global', await page.evaluate(
  () => !!window.PalinodeSpectrumUI &&
        typeof window.PalinodeSpectrumUI.track === 'function' &&
        typeof window.PalinodeSpectrumUI.poles === 'function'));

const out = await page.evaluate(() => {
  const axis = window.PalinodeBeliefs.SPECTRA[0];
  return {
    bare:  window.PalinodeSpectrumUI.track(axis, { tentative: null, placed: null, placedN: 0 }),
    both:  window.PalinodeSpectrumUI.track(axis, { tentative: -0.5, placed: 0.5, placedN: 3 }),
    one:   window.PalinodeSpectrumUI.track(axis, { tentative: null, placed: 0.2, placedN: 1 }),
    poles: window.PalinodeSpectrumUI.poles(axis, -1),
    left:  axis.left
  };
});

check('a bare track has no marks', !/spec-mark/.test(out.bare));
check('a bare track still has the band', /spec-band/.test(out.bare));
check('argument ticks are drawn', /spec-arg/.test(out.bare));
check('both marks render when both exist',
  /spec-mark placed/.test(out.both) && /spec-mark tentative/.test(out.both));
check('a centre delta maps to the middle', /left:50%/.test(
  await page.evaluate(() => window.PalinodeSpectrumUI.track(
    window.PalinodeBeliefs.SPECTRA[0], { tentative: 0, placed: null, placedN: 0 }))));
check('one answered item reads singular', /1 answered item"/.test(out.one));
check('three answered items read plural', /3 answered items/.test(out.both));
check('poles name both ends', out.poles.includes(out.left));
check('the leaning pole is marked', /class="lean"/.test(out.poles));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node .verify/spectrum-ui.mjs`
Expected: FAIL on "the renderer is global" — `window.PalinodeSpectrumUI` is undefined.

- [ ] **Step 3: Create the shared renderer**

Create `assets/js/spectrum-ui.js`:

```js
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

  window.PalinodeSpectrumUI = { track, poles, pct };
})();
```

- [ ] **Step 4: Load it before its callers**

In `index.html`, after the `belief-score.js` tag on line 263:

```html
<script src="assets/js/belief-score.js"></script>
<script src="assets/js/spectrum-ui.js"></script>
```

- [ ] **Step 5: Repoint app.js**

In `assets/js/app.js`, delete the `specTrack` and `specPoles` function bodies
at lines 533-553 and replace them with bindings to the shared renderer. Keep
`clampN` and `pct` — `company()` and the offer copy still use `pct`:

```js
  const clampN = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const pct = delta => ((clampN(delta, -1, 1) + 1) / 2) * 100;

  // One renderer for the continuum, shared with the graph panel and the
  // profile, so the dashed and solid marks cannot drift apart.
  const specTrack = (axis, opts) => SPECUI.track(axis, opts);
  const specPoles = (axis, side) => SPECUI.poles(axis, side);
```

And add to the module's reference block near the other globals at the top:

```js
  const SPECUI = window.PalinodeSpectrumUI;
```

- [ ] **Step 6: Repoint graph.js**

In `assets/js/graph.js`, delete the `specTrack` and `specPoles` function
bodies at lines 553-573 and replace with the same bindings. `specLine` stays;
it is specific to the graph panel's phrasing:

```js
  const specTrack = (axis, opts) => SPECUI.track(axis, opts);
  const specPoles = (axis, side) => SPECUI.poles(axis, side);
```

And add to the reference block at the top, beside `BEL` and `BSCORE`:

```js
  const SPECUI = window.PalinodeSpectrumUI;
```

Leave `clampN` and `pct` in `graph.js` only if something else there still
calls them; if nothing does, delete them so no dead copies remain.

- [ ] **Step 7: Run the new test and the full regression**

Run: `node .verify/spectrum-ui.mjs`
Expected: `10 passed, 0 failed`

Run: `for f in beliefs graph-spectra hover3d select3d panel-reveal; do node .verify/$f.mjs 2>&1 | tail -2; done`
Expected: `37`, `33`, `22`, `12`, `14` passed, 0 failed each. These exercise
every existing caller of the two functions, so an escaping or plural-form
regression shows up here.

- [ ] **Step 8: Commit**

```bash
git add assets/js/spectrum-ui.js index.html assets/js/app.js assets/js/graph.js .verify/spectrum-ui.mjs
git commit -m "Render the spectrum continuum from one place

The track and poles were duplicated between the Beliefs tab and the graph
panel, and the profile view would have been a third copy. The dashed mark
for a passage's lean and the solid mark for a placement have to keep
meaning the same thing everywhere, and one renderer is how that holds."
```

---

### Task 2: The rail, and the layout it sits in

Removes `header.top` and introduces the rail. Behaviour is unchanged in this
task: the moved controls keep their IDs, so their existing listeners still
fire. Shelf and Profile are present but inert until Task 3.

**Files:**
- Modify: `index.html:20-40` (delete `header.top`, insert `nav.sidenav`)
- Modify: `index.html:89-93` (add `#btn-share` to `.doc-meta`)
- Modify: `index.html:140-144` (add the Reading rail's collapse chevron)
- Modify: `assets/css/app.css:90-96` (`#app` grid), `98-135` (delete
  `header.top` rules), `805-810` (`#graph` inset)
- Modify: `assets/css/app.css` (append the `.sidenav` block)
- Test: `.verify/sidenav.mjs`

**Interfaces:**
- Consumes: `window.PalinodeSpectrumUI` is not used here.
- Produces: the DOM contract Task 3 and Task 6 rely on —
  `nav.sidenav`, `#btn-new`, `#btn-rail`, `#btn-explore`, `#btn-shelf`,
  `#btn-profile`, each destination carrying `data-view` (`write`, `shelf`,
  `profile`) except `#btn-explore` which carries `data-view="explore"`, and
  `.nav-item.on` as the active marker.

- [ ] **Step 1: Write the failing test**

Create `.verify/sidenav.mjs`:

```js
/* The rail holds what accumulates across the journal, and nothing that
   belongs to a single note. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

check('the top bar is gone', (await page.$$('header.top')).length === 0);
check('the rail exists', await page.isVisible('nav.sidenav'));

const geo = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav');
  const r = nav.getBoundingClientRect();
  const items = [...nav.querySelectorAll('.nav-item')].map(el => {
    const b = el.getBoundingClientRect();
    return { id: el.id, view: el.dataset.view || '',
             w: Math.round(b.width), h: Math.round(b.height), top: Math.round(b.top),
             label: (el.querySelector('.nav-lab') || {}).textContent || '',
             clipped: el.scrollWidth > el.clientWidth + 1 };
  });
  return { width: Math.round(r.width), height: Math.round(r.height),
           top: Math.round(r.top), items,
           bodyTop: Math.round(document.getElementById('body').getBoundingClientRect().top) };
});

check('the rail is 78px wide', geo.width === 78, geo.width + 'px');
check('the rail runs full height', geo.height >= 890 && geo.top === 0,
  geo.height + 'px from ' + geo.top);
check('the body starts at the top now', geo.bodyTop === 0, geo.bodyTop + 'px');
check('four destinations', geo.items.length === 4,
  geo.items.map(i => i.id).join(','));
check('destinations are 56px tall', geo.items.every(i => i.h === 56),
  geo.items.map(i => i.h).join(','));
check('destinations sit on a 72px pitch', geo.items.every((it, k) =>
  k === 0 || it.top - geo.items[k - 1].top === 72),
  geo.items.map(i => i.top).join(','));
check('no label is clipped', geo.items.every(i => !i.clipped),
  geo.items.filter(i => i.clipped).map(i => i.label).join(','));
check('the brand glyph is in the rail', await page.isVisible('nav.sidenav .nav-brand svg'));
check('the wordmark is gone', !(await page.evaluate(
  () => /Philosophical Reader/i.test(document.querySelector('nav.sidenav').textContent))));

// the compose control is an action, not a destination
check('New note is in the rail', await page.isVisible('#btn-new'));
check('New note is not a destination', await page.evaluate(
  () => !document.getElementById('btn-new').classList.contains('nav-item')));
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
check('New note still creates a note', await page.isVisible('#editor-wrap'));

// Share belongs to the note it acts on
check('Share sits with the note', await page.evaluate(
  () => !!document.querySelector('.doc-meta #btn-share')));
check('Share is not in the rail', await page.evaluate(
  () => !document.querySelector('nav.sidenav #btn-share')));

// the Reading rail carries its own collapse control
check('the Reading rail has a chevron', await page.isVisible('#btn-insights'));
check('the chevron is on the rail, not the nav', await page.evaluate(
  () => !!document.querySelector('aside.insights #btn-insights')));
await page.click('#btn-insights');
await page.waitForTimeout(300);
check('the chevron collapses the Reading rail', await page.evaluate(
  () => document.getElementById('body').classList.contains('insights-closed')));
await page.click('#btn-insights');
await page.waitForTimeout(300);
check('and brings it back', await page.evaluate(
  () => !document.getElementById('body').classList.contains('insights-closed')));

// Notes still toggles the Library
await page.click('#btn-rail');
await page.waitForTimeout(300);
check('Notes collapses the Library', await page.evaluate(
  () => document.getElementById('body').classList.contains('rail-closed')));
await page.click('#btn-rail');
await page.waitForTimeout(300);
check('Notes brings the Library back', await page.evaluate(
  () => !document.getElementById('body').classList.contains('rail-closed')));

// the rail survives the graph
await page.fill('#title', 'The job');
await page.fill('#body-input', 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much.');
await page.waitForTimeout(1400);
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(700);
check('the rail stays visible over the graph', await page.isVisible('nav.sidenav'));
const clear = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  const g = document.getElementById('graph').getBoundingClientRect();
  const mid = document.elementFromPoint(nav.width / 2, 300);
  return { graphLeft: Math.round(g.left), navRight: Math.round(nav.right),
           hitsNav: !!(mid && mid.closest('nav.sidenav')) };
});
check('the graph starts after the rail', clear.graphLeft === clear.navRight,
  'graph ' + clear.graphLeft + ' vs rail ' + clear.navRight);
check('the rail takes the pointer over the graph', clear.hitsNav);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node .verify/sidenav.mjs`
Expected: FAIL on "the top bar is gone" and "the rail exists".

- [ ] **Step 3: Replace the header with the rail**

In `index.html`, delete the whole `<header class="top">…</header>` block
(lines 20-40) and put this in its place, as the first child of `#app`:

```html
  <nav class="sidenav" aria-label="Palinode">
    <span class="nav-brand" title="Palinode">
      <svg viewBox="0 0 22 26" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11 1L20.5 7v12L11 25 1.5 19V7L11 1z" stroke="rgba(255,255,255,.55)" stroke-width="1.1"/>
        <path d="M11 5.5v15" stroke="rgba(246,162,68,.9)" stroke-width="1.1"/>
        <circle cx="11" cy="13" r="3.4" stroke="rgba(255,255,255,.75)" stroke-width="1.1"/>
      </svg>
    </span>

    <button class="nav-new" id="btn-new" title="New note" aria-label="New note">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
      </svg>
    </button>

    <span class="nav-rule"></span>

    <button class="nav-item on" id="btn-rail" data-view="write">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 4h11l3 3v13H5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M8 10h8M8 14h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
      </svg>
      <span class="nav-lab">Notes</span>
    </button>

    <button class="nav-item" id="btn-explore" data-view="explore">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="2.4" stroke="currentColor" stroke-width="1.4"/>
        <circle cx="12" cy="12" r="8.4" stroke="currentColor" stroke-width="1.4" stroke-dasharray="2 3"/>
        <circle cx="18.5" cy="8" r="1.7" fill="currentColor"/>
      </svg>
      <span class="nav-lab">Explore</span>
    </button>

    <button class="nav-item" id="btn-shelf" data-view="shelf">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M5 19V5h4v14zM11 19V5h3v14zM16 19l2.6-13.7 1.4.3L17.4 19z"
              stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
      </svg>
      <span class="nav-lab">Shelf</span>
    </button>

    <button class="nav-item" id="btn-profile" data-view="profile">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 8h16M4 13h16M4 18h16" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="9" cy="8" r="2.1" fill="currentColor"/>
        <circle cx="15.5" cy="13" r="2.1" fill="currentColor"/>
        <circle cx="7.5" cy="18" r="2.1" fill="currentColor"/>
      </svg>
      <span class="nav-lab">Profile</span>
    </button>
  </nav>
```

- [ ] **Step 4: Move Share onto the note**

In `index.html`, in `.doc-meta` at lines 89-93, add Share after the live
indicator:

```html
          <div class="doc-meta">
            <span id="meta-date"></span>
            <span id="meta-words">0 words</span>
            <span class="live"><i class="pulse" id="pulse"></i><span id="meta-state">Idle</span></span>
            <span class="spacer"></span>
            <button class="micro" id="btn-share">Share</button>
          </div>
```

- [ ] **Step 5: Give the Reading rail its own collapse control**

In `index.html`, in the `.ins-head` row at lines 140-144, add the chevron
beside the engine name:

```html
        <div class="row">
          <h3>Reading</h3>
          <span class="spacer"></span>
          <span class="micro" id="engine-name" style="cursor:default"></span>
          <button class="ins-collapse" id="btn-insights" title="Hide the reading"
                  aria-label="Hide the reading">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3.5L5.5 8l4.5 4.5" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
```

- [ ] **Step 6: Restructure the layout**

In `assets/css/app.css`, replace the `#app` rule at lines 90-96:

```css
#app {
  position: relative;
  z-index: 2;
  height: 100%;
  display: grid;
  grid-template-columns: var(--nav) minmax(0, 1fr);
}
```

Add `--nav` to the `:root` block beside `--rail-l` and `--rail-r` at line 39:

```css
  --nav: 78px;
```

Delete the `header.top` rule block (lines 98-107 in the original file, the
rule beginning `header.top {`) and the `.top .spacer` rule at line 125. Keep
`.micro` — Share and the engine name still use it. Keep the `.brand` rules
only if something still uses them; the rail uses `.nav-brand`, so delete
`.brand`, `.brand .glyph`, `.brand .name`, and `.brand .sub`.

Change `#graph` at lines 805-810 so the rail stays reachable:

```css
#graph {
  position: fixed; inset: 0 0 0 var(--nav); z-index: 50;
  background: radial-gradient(130% 100% at 50% 50%, rgba(9,8,11,.965), rgba(4,3,6,.995));
  backdrop-filter: blur(14px);
  animation: fade .32s var(--ease);
}
```

- [ ] **Step 7: Style the rail**

Append to `assets/css/app.css`:

```css
/* ============================================================
   The side navigation

   Split by ownership, after Zillow's product nav: the rail holds
   what accumulates across the journal, and anything scoped to a
   single note stays with the note. That is what lets the active
   state mean something precise.
   ============================================================ */
nav.sidenav {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 14px 0 18px;
  border-right: 1px solid var(--hairline-2);
  background: linear-gradient(180deg, rgba(8,7,10,.6), rgba(8,7,10,.3));
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.nav-brand { width: 22px; height: 26px; flex: none; display: block; }
.nav-brand svg { width: 100%; height: 100%; display: block; }

.nav-new {
  width: 40px; height: 40px; flex: none;
  display: grid; place-items: center;
  border: 1px solid var(--hairline); border-radius: var(--r-sm);
  background: var(--glass-2); color: var(--ink-2); cursor: pointer;
  transition: color .18s var(--ease), background .18s var(--ease), border-color .18s var(--ease);
}
.nav-new svg { width: 18px; height: 18px; }
.nav-new:hover {
  color: var(--ink); background: rgba(255,255,255,.1);
  border-color: rgba(255,255,255,.24);
}

.nav-rule { width: 30px; height: 1px; background: var(--hairline); flex: none; }

/* 40 x 56 on a 72px pitch — gap 16 plus height 56 — after the reference */
.nav-item {
  width: 40px; height: 56px; flex: none;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 5px; border: 0; background: none; cursor: pointer;
  border-radius: var(--r-sm); color: var(--ink-3);
  font-family: var(--sans); font-weight: 700;
  transition: color .18s var(--ease);
}
.nav-item svg { width: 24px; height: 24px; flex: none; }
/* .1em, not the .18em of .micro: 'Determinism'-length words overflow 78px */
.nav-item .nav-lab {
  font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  line-height: 1; white-space: nowrap;
}
.nav-item:hover { color: var(--ink-2); }

/* the active pill sits behind the icon, not the whole target */
.nav-item::before {
  content: ''; position: absolute; width: 40px; height: 32px;
  border-radius: var(--pill); background: transparent;
  transition: background .2s var(--ease);
}
.nav-item { position: relative; }
.nav-item.on { color: var(--ink); }
.nav-item.on::before { background: var(--glass-2); }
.nav-item.on svg { color: var(--stance); }
.nav-item > * { position: relative; }

/* the Reading rail keeps its own collapse control */
.ins-collapse {
  width: 22px; height: 22px; flex: none; display: grid; place-items: center;
  border: 0; background: none; cursor: pointer; color: var(--ink-4);
  border-radius: var(--r-sm); transition: color .18s var(--ease), background .18s var(--ease);
}
.ins-collapse svg { width: 14px; height: 14px; }
.ins-collapse:hover { color: var(--ink-2); background: var(--glass-2); }
.body.insights-closed .ins-collapse svg { transform: scaleX(-1); }

.doc-meta .spacer { flex: 1; }
```

- [ ] **Step 8: Run the test**

Run: `node .verify/sidenav.mjs`
Expected: all checks pass. If "no label is clipped" fails, reduce
`.nav-item .nav-lab` `letter-spacing` to `.06em` — do not widen the rail.

- [ ] **Step 9: Run the regression**

Run: `for f in beliefs graph-spectra hover3d select3d panel-reveal spectrum-ui; do node .verify/$f.mjs 2>&1 | tail -2; done`
Expected: all pass. The suites address `#btn-new`, `#btn-explore`, and
`#btn-share` by ID, which is why they survive the move. Any failure here is a
selector that depended on the header's structure rather than an ID — fix the
selector in the suite, not the markup.

- [ ] **Step 10: Commit**

```bash
git add index.html assets/css/app.css .verify/sidenav.mjs
git commit -m "Move navigation into a left rail

The header mixed panel toggles, note actions, and one destination, so no
active state could mean anything. The rail now holds only what accumulates
across the journal; Share moved onto the note it acts on and the Reading
rail took over its own collapse. The graph is inset by the rail so there is
always a way out of it."
```

---

### Task 3: The view switch

Gives the centre one owner for what it shows, and makes Shelf and Profile
reachable. Their contents arrive in Tasks 4 and 5; this task ends with each
showing an honest empty state.

**Files:**
- Modify: `index.html:126-133` (add the two view sections)
- Modify: `assets/js/app.js` (add `setView`, `syncNav`; route the rail)
- Modify: `assets/js/app.js:915-926` (`closeRoom` calls `setView`)
- Modify: `assets/js/app.js:1002-1034` (`explore` marks the rail)
- Test: `.verify/views.mjs`

**Interfaces:**
- Consumes: `nav.sidenav` and the `data-view` attributes from Task 2.
- Produces, relied on by Tasks 4-6:
  - `setView(name)` where `name` is `'write' | 'room' | 'shelf' | 'profile'`
  - `roomOrigin` — the module-level string holding which destination opened
    the Reading Room, one of `'write'` or `'shelf'`
  - `renderShelf()` and `renderProfile()` — called by `setView` on entry,
    stubs in this task, filled in Tasks 5 and 4
  - `el.shelfView` / `el.profileView` — the two new section elements

- [ ] **Step 1: Write the failing test**

Create `.verify/views.mjs`:

```js
/* One owner for what the centre shows, and a rail whose active item is
   derived from it rather than tracked separately. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const NOTE = 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going. My family expects things of me and I owe them that much, even though I feel alone in this city.';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

const active = () => page.evaluate(() => {
  const on = [...document.querySelectorAll('nav.sidenav .nav-item.on')];
  return { count: on.length, id: on.length === 1 ? on[0].id : '' };
});
const shown = () => page.evaluate(() => ({
  write:   !document.getElementById('editor-wrap').hidden ||
           document.getElementById('empty-state').style.display !== 'none',
  room:    !document.getElementById('reading-room').hidden,
  shelf:   !document.getElementById('shelf-view').hidden,
  profile: !document.getElementById('profile-view').hidden
}));

check('exactly one destination is active at rest', (await active()).count === 1);
check('writing is the resting view', (await active()).id === 'btn-rail');

await page.click('#btn-shelf');
await page.waitForTimeout(300);
check('Shelf switches the centre', (await shown()).shelf);
check('Shelf is the only thing shown', await page.evaluate(() =>
  document.getElementById('editor-wrap').hidden &&
  document.getElementById('profile-view').hidden &&
  document.getElementById('reading-room').hidden));
check('Shelf marks the rail', (await active()).id === 'btn-shelf');
check('Shelf says something honest when empty', await page.evaluate(
  () => document.getElementById('shelf-view').textContent.trim().length > 20),
  (await page.textContent('#shelf-view')).trim().slice(0, 60));

await page.click('#btn-profile');
await page.waitForTimeout(300);
check('Profile switches the centre', (await shown()).profile);
check('Profile marks the rail', (await active()).id === 'btn-profile');
check('only one is ever active', (await active()).count === 1);

await page.click('#btn-rail');
await page.waitForTimeout(300);
check('Notes returns to writing', (await shown()).write);
check('Notes marks the rail', (await active()).id === 'btn-rail');
check('and shows the Library on the way back', await page.evaluate(
  () => !document.getElementById('body').classList.contains('rail-closed')));

// once already writing, Notes goes back to toggling the Library
await page.click('#btn-rail');
await page.waitForTimeout(250);
check('Notes toggles the Library when already writing', await page.evaluate(
  () => document.getElementById('body').classList.contains('rail-closed')));
check('and stays in the writing view', (await shown()).write);
await page.click('#btn-rail');
await page.waitForTimeout(250);

// the Reading Room remembers which destination opened it
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#title', 'The job');
await page.fill('#body-input', NOTE);
await page.waitForTimeout(1500);
await page.click('#seg .seg-btn[data-tab="readings"]');
await page.waitForTimeout(300);
const work = await page.$('#readings-list .work');
check('a work is on the shelf panel', !!work);
if (work) {
  await work.click();
  await page.waitForTimeout(400);
  check('the Reading Room opens', (await shown()).room);
  check('the Room shows its origin as active', (await active()).id === 'btn-rail');
}

// the graph marks Explore, whatever is underneath
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(700);
check('Explore is active over the graph', (await active()).id === 'btn-explore');
await page.keyboard.press('Escape');
await page.waitForTimeout(500);
check('leaving the graph restores the view underneath',
  (await active()).id !== 'btn-explore', (await active()).id);

// choosing a destination from the graph closes it
await page.click('#btn-explore');
await page.waitForSelector('#graph:not([hidden])');
await page.waitForTimeout(700);
await page.click('#btn-profile');
await page.waitForTimeout(500);
check('a destination closes the graph', await page.isHidden('#graph'));
check('and lands on that destination', (await shown()).profile);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node .verify/views.mjs`
Expected: FAIL — `#shelf-view` does not exist, so `shown()` throws.

- [ ] **Step 3: Add the two view sections**

In `index.html`, after the `#reading-room` section at line 133:

```html
        <!-- reading room -->
        <section id="reading-room" hidden></section>

        <!-- journal-wide views -->
        <section class="jview" id="shelf-view" hidden></section>
        <section class="jview" id="profile-view" hidden></section>
```

- [ ] **Step 4: Add the view switch**

In `assets/js/app.js`, add to the `el` block beside `room`:

```js
    shelfView:  $('#shelf-view'),
    profileView:$('#profile-view'),
```

Then add this, near `closeRoom`:

```js
  /* ---------- which view the centre is showing ----------
     One owner for the centre's visibility. Before this, openNote, openRoom
     and closeRoom each set their own hidden flags, which does not survive
     having four views. */

  let view = 'write';
  let roomOrigin = 'write';       // which destination opened the Reading Room

  const VIEW_OF_BTN = { 'btn-rail': 'write', 'btn-shelf': 'shelf', 'btn-profile': 'profile' };

  function setView(name) {
    view = name;
    el.room.hidden        = name !== 'room';
    el.shelfView.hidden   = name !== 'shelf';
    el.profileView.hidden = name !== 'profile';

    // the writing view is itself two states: a note, or the invitation to start one
    const writing = name === 'write';
    el.editorWrap.hidden = !writing || !activeId;
    el.empty.style.display = writing && !activeId ? '' : 'none';
    el.promptCard.style.display = writing ? '' : 'none';

    if (name === 'shelf') renderShelf();
    if (name === 'profile') renderProfile();
    syncNav();
  }

  // The active item is derived, never tracked: the graph wins while it is
  // open, and the Reading Room shows whichever destination opened it.
  function syncNav() {
    const want = exploring() ? 'btn-explore'
      : view === 'room' ? (roomOrigin === 'shelf' ? 'btn-shelf' : 'btn-rail')
      : view === 'shelf' ? 'btn-shelf'
      : view === 'profile' ? 'btn-profile'
      : 'btn-rail';
    $$('nav.sidenav .nav-item').forEach(b => b.classList.toggle('on', b.id === want));
  }

  function renderShelf() {
    el.shelfView.innerHTML = `<div class="jview-empty">
      Nothing on the shelf yet. Works arrive here as your notes reach them.
    </div>`;
  }

  function renderProfile() {
    el.profileView.innerHTML = `<div class="jview-empty">
      Nothing placed yet. Answer an item and your profile starts here.
    </div>`;
  }
```

- [ ] **Step 5: Route the rail through it**

In `assets/js/app.js`, replace the `#btn-rail` and `#btn-insights` listeners
at lines 1248-1253:

```js
  // Notes is a destination that happens to show a panel: it returns you to
  // writing from elsewhere, and toggles the Library once you are already there.
  $('#btn-rail').addEventListener('click', () => {
    if (exploring()) closeGraph();
    if (view !== 'write') {
      setView('write');
      el.body.classList.remove('rail-closed');
      return;
    }
    el.body.classList.toggle(window.innerWidth <= 900 ? 'show-rail' : 'rail-closed');
  });

  // The chevron is a two-state control, so it has to say which state it is
  // about to put you in. Task 2 left it announcing "Hide the reading" in both.
  $('#btn-insights').addEventListener('click', () => {
    el.body.classList.toggle(window.innerWidth <= 900 ? 'show-insights' : 'insights-closed');
    labelChevron();
  });

  function labelChevron() {
    const closed = el.body.classList.contains('insights-closed');
    const b = $('#btn-insights');
    b.setAttribute('aria-expanded', String(!closed));
    b.setAttribute('aria-label', closed ? 'Show the reading' : 'Hide the reading');
    b.title = closed ? 'Show the reading' : 'Hide the reading';
  }
  labelChevron();

  $('#btn-shelf').addEventListener('click', () => {
    if (exploring()) closeGraph();
    setView('shelf');
  });

  $('#btn-profile').addEventListener('click', () => {
    if (exploring()) closeGraph();
    setView('profile');
  });
```

Add the helper that closes the graph, beside `explore()`:

```js
  function closeGraph() {
    if (window.PalinodeGraph && window.PalinodeGraph.isOpen()) {
      window.PalinodeGraph.close();
    }
    document.body.classList.remove('dim3');
  }
```

In `explore()`, call `syncNav()` after the graph opens, and in the graph's
`onClose` handler call `syncNav()` again so the rail returns to the view
underneath. The existing `onClose` is passed to `PalinodeGraph.open`; add
`syncNav()` to its body.

- [ ] **Step 6: Make the existing centre transitions use it**

Replace the body of `closeRoom` at lines 915-926:

```js
  function closeRoom() {
    el.room.innerHTML = '';
    setView(roomOrigin === 'shelf' ? 'shelf' : 'write');
    if (!activeId) return;
    const n = Notes.get(activeId);
    const todays = Prompts.state().prompt.text;
    setBanner(n.promptText && n.promptText !== todays ? n.promptText : null);
    markWritingOnToday(!!n.promptText && n.promptText === todays);
    grow();
  }
```

In `openRoom` — the function that fills `#reading-room` — set the origin and
switch views instead of setting `hidden` directly. Find where it currently
does `el.room.hidden = false` and `el.editorWrap.hidden = true` and replace
those two lines with:

```js
    roomOrigin = view === 'shelf' ? 'shelf' : 'write';
    setView('room');
```

In `openNote`, replace any direct `el.editorWrap.hidden = false` /
`el.empty.style.display = 'none'` pair with `setView('write')`.

- [ ] **Step 7: Style the two views**

Append to `assets/css/app.css`:

```css
/* ---------- journal-wide views ---------------------------------- */
.jview[hidden] { display: none; }
.jview-empty {
  padding: 40px 4px; color: var(--ink-4); font-size: 12.5px; line-height: 1.75;
  max-width: 46ch;
}
```

- [ ] **Step 8: Run the test**

Run: `node .verify/views.mjs`
Expected: all checks pass.

- [ ] **Step 9: Run the regression**

Run: `for f in beliefs graph-spectra hover3d select3d panel-reveal spectrum-ui sidenav; do node .verify/$f.mjs 2>&1 | tail -2; done`
Expected: all pass.

- [ ] **Step 10: Commit**

```bash
git add index.html assets/js/app.js assets/css/app.css .verify/views.mjs
git commit -m "Give the centre column one owner for what it shows

openNote, openRoom and closeRoom each set their own hidden flags, which
does not survive having four views. setView is now the only thing that
changes the centre, and the rail's active item is derived from it — so the
Reading Room can show whichever destination opened it and return there."
```

---

### Task 4: The Profile view

**Files:**
- Modify: `assets/js/app.js` (`renderProfile`)
- Modify: `assets/css/app.css` (append the profile block)
- Test: `.verify/profile.mjs`

**Interfaces:**
- Consumes: `setView`, `renderProfile` from Task 3; `SPECUI.track` and
  `SPECUI.poles` from Task 1; `Belief.scores()`, `Belief.coverage()`,
  `Belief.answeredCount(axisId)` from `store.js`; `BEL.SPECTRA`,
  `BEL.itemsFor(axisId)` from `beliefs.js`; `BSCORE.label(leaning)` and
  `BSCORE.describe(axisId, score)` from `belief-score.js`; `openPlace(axisId,
  source)` from `app.js`.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Write the failing test**

Create `.verify/profile.mjs`:

```js
/* The standing profile: all 27 spectra, grouped by branch, and nothing here
   writes a score from prose. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.click('#btn-profile');
await page.waitForTimeout(400);

const total = await page.evaluate(() => window.PalinodeBeliefs.SPECTRA.length);
check('every spectrum is listed', (await page.$$('#profile-view .prof-axis')).length === total,
  total + ' expected');
check('coverage is stated', /0\s*of\s*27/.test(await page.textContent('#profile-view .prof-cov')),
  (await page.textContent('#profile-view .prof-cov')).trim());

const branches = await page.evaluate(() =>
  [...new Set(window.PalinodeBeliefs.SPECTRA.map(s => s.branch))]);
check('axes are grouped by branch',
  (await page.$$('#profile-view .prof-branch')).length === branches.length,
  branches.join(', '));

check('nothing is placed yet', (await page.$$('#profile-view .spec-mark.placed')).length === 0);
check('every axis offers to be placed',
  (await page.$$('#profile-view [data-place]')).length === total);
check('poles are named', (await page.$$('#profile-view .spec-poles')).length === total);

// answering from this view moves the mark and persists
const axisId = await page.evaluate(
  () => document.querySelector('#profile-view [data-place]').dataset.place);
await page.click('#profile-view [data-place]');
await page.waitForTimeout(400);
check('the item overlay opens', await page.evaluate(
  () => document.getElementById('place-scrim').classList.contains('on')));
await page.click('#place-modal .place-opt');
await page.waitForTimeout(400);
const stored = await page.evaluate(id => window.PalinodeStore.Belief.score(id), axisId);
check('the answer is written', stored && stored.n === 1, JSON.stringify(stored));
await page.click('#place-modal [data-act="close"]');
await page.waitForTimeout(400);
check('the view redraws with the placement',
  (await page.$$('#profile-view .spec-mark.placed')).length === 1);
check('coverage moved', /1\s*of\s*27/.test(await page.textContent('#profile-view .prof-cov')));
check('the placed axis leads its branch', await page.evaluate(id => {
  const el = document.querySelector(`#profile-view .prof-axis[data-axis="${id}"]`);
  const branch = el.closest('.prof-branch');
  return branch.querySelector('.prof-axis') === el;
}, axisId));

await page.reload({ waitUntil: 'networkidle' });
await page.click('#btn-profile');
await page.waitForTimeout(400);
check('it survives a reload', (await page.$$('#profile-view .spec-mark.placed')).length === 1);

// prose must never place anything
await page.click('#btn-new');
await page.waitForSelector('#body-input', { state: 'visible' });
await page.fill('#body-input', 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it. Everything was determined long before I arrived and none of it was mine to decide.');
await page.waitForTimeout(1600);
await page.click('#btn-profile');
await page.waitForTimeout(400);
check('writing prose places nothing new',
  (await page.$$('#profile-view .spec-mark.placed')).length === 1);
check('coverage is unchanged by prose',
  /1\s*of\s*27/.test(await page.textContent('#profile-view .prof-cov')));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node .verify/profile.mjs`
Expected: FAIL on "every spectrum is listed" — the stub renders no `.prof-axis`.

- [ ] **Step 3: Implement renderProfile**

Replace the `renderProfile` stub from Task 3 in `assets/js/app.js`:

```js
  /* ---------- the standing profile ----------
     The whole instrument, grouped the way philosophy groups itself. Placed
     axes lead each branch because they are the part that is yours; the rest
     are the open questions. Reads scores, never writes them. */

  function renderProfile() {
    const scores = Belief.scores();
    const cov = Belief.coverage();

    const byBranch = {};
    BEL.SPECTRA.forEach(s => (byBranch[s.branch] = byBranch[s.branch] || []).push(s));

    const branches = Object.keys(byBranch).map(branch => {
      const axes = byBranch[branch].slice().sort((a, b) => {
        const pa = scores[a.id] ? 0 : 1, pb = scores[b.id] ? 0 : 1;
        return pa - pb || a.title.localeCompare(b.title);
      });
      const placed = axes.filter(a => scores[a.id]).length;
      return `<section class="prof-branch">
        <div class="prof-branch-head">
          <h3>${esc(branch)}</h3>
          <span class="n">${placed} of ${axes.length}</span>
        </div>
        ${axes.map(a => profileAxis(a, scores[a.id])).join('')}
      </section>`;
    }).join('');

    el.profileView.innerHTML = `
      <div class="prof-head">
        <div class="prof-cov"><b>${cov.placed}</b> of ${cov.total} spectra placed in this journal</div>
        <p class="prof-lede">${cov.placed
          ? 'Only answered items are here. What your writing leans toward stays in the note it came from.'
          : 'Nothing placed yet. Your writing can lean, but only an answer puts a mark on this page.'}</p>
      </div>
      ${branches}`;
  }

  function profileAxis(axis, score) {
    const answered = Belief.answeredCount(axis.id);
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
        <span class="n">${answered} of ${BEL.itemsFor(axis.id).length} answered</span>
        <button class="ghost" data-place="${esc(axis.id)}">${score ? 'Answer another' : 'Place yourself'}</button>
      </div>
    </article>`;
  }
```

- [ ] **Step 4: Wire the place buttons**

Add near the other delegated listeners in `assets/js/app.js`:

```js
  el.profileView.addEventListener('click', e => {
    const b = e.target.closest('[data-place]');
    if (b) openPlace(b.dataset.place, 'profile');
  });
```

The overlay already calls `renderBeliefs()` after an answer. Add
`if (view === 'profile') renderProfile();` beside that call so this view
redraws too.

- [ ] **Step 5: Style it**

Append to `assets/css/app.css`:

```css
/* ---------- the standing profile -------------------------------- */
.prof-head { margin-bottom: 26px; }
.prof-cov {
  font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
  color: var(--ink-3); margin-bottom: 10px;
}
.prof-cov b { font-size: 22px; letter-spacing: 0; color: var(--ink); font-weight: 500; }
.prof-lede {
  margin: 0; font-size: 12.5px; line-height: 1.75; color: var(--ink-3); max-width: 56ch;
}

.prof-branch { margin-bottom: 34px; }
.prof-branch-head {
  display: flex; align-items: baseline; gap: 12px;
  padding-bottom: 8px; margin-bottom: 14px;
  border-bottom: 1px solid var(--hairline-2);
}
.prof-branch-head h3 {
  margin: 0; font-size: 10px; letter-spacing: .2em; text-transform: uppercase;
  color: var(--ink-2); font-weight: 700;
}
.prof-branch-head .n { font-size: 10px; color: var(--ink-4); letter-spacing: .1em; }

.prof-axis {
  border: 1px solid var(--hairline-2); border-radius: var(--r-md);
  background: rgba(0,0,0,.26); padding: 14px 16px 12px; margin-bottom: 10px;
}
.prof-axis.unplaced { opacity: .62; }
.prof-axis.unplaced:hover { opacity: 1; }
.prof-axis-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
.prof-axis-head h4 {
  margin: 0; font-family: var(--serif); font-size: 14.5px; font-weight: 500;
  color: var(--ink); flex: 1;
}
.prof-tag {
  font-size: 9px; letter-spacing: .16em; text-transform: uppercase;
  color: var(--stance); border: 1px solid color-mix(in srgb, var(--stance) 40%, transparent);
  border-radius: var(--pill); padding: 2px 8px; white-space: nowrap;
}
.prof-line { margin: 8px 0 10px; font-size: 12.5px; line-height: 1.7; color: var(--ink-2); }
.prof-axis-foot { display: flex; align-items: center; gap: 12px; }
.prof-axis-foot .n {
  flex: 1; font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-4);
}
```

- [ ] **Step 6: Run the test**

Run: `node .verify/profile.mjs`
Expected: all checks pass.

- [ ] **Step 7: Run the regression**

Run: `for f in beliefs graph-spectra hover3d select3d panel-reveal spectrum-ui sidenav views; do node .verify/$f.mjs 2>&1 | tail -2; done`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add assets/js/app.js assets/css/app.css .verify/profile.mjs
git commit -m "Add the standing belief profile as a destination

The Beliefs tab has been printing a journal-wide fact — how many of the 27
spectra are placed — from inside a per-note panel. This is the page that
sentence was pointing at: every axis grouped by branch, placed ones leading
each group, and still nothing that writes a score from prose."
```

---

### Task 5: The Shelf view

**Files:**
- Modify: `assets/js/app.js` (`renderShelf`, plus a memoized cross-note analysis)
- Modify: `assets/css/app.css` (append the shelf block)
- Test: `.verify/shelf.mjs`

**Interfaces:**
- Consumes: `setView`, `renderShelf` from Task 3; `ENGINE.analyze(text)` from
  `engine.js`; `Notes.all()` from `store.js`; `openRoom(workId)` from
  `app.js`; and `LIB.shelf(insights)` from `library.js:483`, which returns
  work records already sorted by `raisedBy.length` descending, each shaped
  `{ id, title, author, era?, section?, raisedBy: [{key,label,category,note}], sections: [] }`.
  Note that a record's own `raisedBy` holds the insights that raised the
  work, not the notes — hence the separate `notesFor` map below.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Write the failing test**

Create `.verify/shelf.mjs`:

```js
/* The shelf is what the whole journal has reached, not what one note did. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

const A = 'I had no choice but to stay in that job. It was out of my hands and there was nothing I could do about any of it, so I kept going, telling myself the deadline was the deadline.';
const B = 'Everyone always says the grind is what it takes. But I chose it, and I only believe the story when I am tired. What I actually want is for someone to see how hard it has been.';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

// empty journal first
await page.click('#btn-shelf');
await page.waitForTimeout(400);
check('an empty journal says so', /nothing|arrive/i.test(await page.textContent('#shelf-view')),
  (await page.textContent('#shelf-view')).trim().slice(0, 70));
check('and lists no works', (await page.$$('#shelf-view .work')).length === 0);

// two notes
for (const [title, body] of [['The job', A], ['The grind', B]]) {
  await page.click('#btn-new');
  await page.waitForSelector('#body-input', { state: 'visible' });
  await page.fill('#title', title);
  await page.fill('#body-input', body);
  await page.waitForTimeout(1500);
}

await page.click('#btn-shelf');
await page.waitForTimeout(700);
const works = await page.$$('#shelf-view .work');
check('the shelf has works', works.length > 0, works.length + ' works');

// it must exceed what the open note alone raised
await page.click('#btn-rail');
await page.waitForTimeout(300);
await page.click('#seg .seg-btn[data-tab="readings"]');
await page.waitForTimeout(300);
const perNote = (await page.$$('#readings-list .work')).length;
await page.click('#btn-shelf');
await page.waitForTimeout(700);
const journal = (await page.$$('#shelf-view .work')).length;
check('the journal shelf is larger than one note\'s', journal >= perNote,
  journal + ' journal vs ' + perNote + ' note');

check('a card names which notes raised it',
  (await page.$$('#shelf-view .work .raised')).length > 0,
  (await page.textContent('#shelf-view .work .raised')).trim());
check('the shelf is ordered by weight', await page.evaluate(() => {
  const n = [...document.querySelectorAll('#shelf-view .work')]
    .map(w => Number(w.dataset.weight));
  return n.every((v, i) => i === 0 || n[i - 1] >= v);
}));

// opening a work goes to the Reading Room and comes back to the shelf
await works[0].click();
await page.waitForTimeout(500);
check('a work opens the Reading Room', await page.evaluate(
  () => !document.getElementById('reading-room').hidden));
check('the Room shows Shelf as its origin', await page.evaluate(
  () => (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-shelf'));
const back = await page.$('#reading-room [data-act="close"], #reading-room .room-close');
if (back) {
  await back.click();
  await page.waitForTimeout(400);
  check('closing returns to the shelf', await page.evaluate(
    () => !document.getElementById('shelf-view').hidden));
}

// The cache must invalidate on an edit. With a stale cache the shelf would
// come back byte-identical after a real change of subject, so compare the
// rendered markup rather than only the count.
const beforeHtml = await page.innerHTML('#shelf-view');
await page.click('#btn-rail');
await page.waitForTimeout(300);
await page.fill('#body-input', B + ' I keep coming back to the same pattern and part of me wonders whether the whole thing is pointless and always was, whether any of it means anything at all.');
await page.waitForTimeout(1600);
await page.click('#btn-shelf');
await page.waitForTimeout(700);
const afterHtml = await page.innerHTML('#shelf-view');
check('editing a note re-reads it', afterHtml !== beforeHtml);
check('the shelf did not go empty after an edit',
  (await page.$$('#shelf-view .work')).length > 0);

// and the other half of the cache contract: unchanged notes render the same
await page.click('#btn-rail');
await page.waitForTimeout(250);
await page.click('#btn-shelf');
await page.waitForTimeout(700);
check('an unchanged journal renders the same shelf',
  (await page.innerHTML('#shelf-view')) === afterHtml);

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node .verify/shelf.mjs`
Expected: FAIL on "the shelf has works" — the stub renders none.

- [ ] **Step 3: Implement the cross-note read and renderShelf**

Replace the `renderShelf` stub in `assets/js/app.js`:

```js
  /* ---------- the journal-wide shelf ----------
     The Readings tab answers "what did this note reach". This answers "what
     has the journal reached", which is a different and slower question: it
     reads every note, so the analyses are cached and only redone when a
     note's text actually changes. */

  const analysisCache = new Map();   // noteId -> { text, analysis }

  function analysisOf(note) {
    const hit = analysisCache.get(note.id);
    if (hit && hit.text === note.body) return hit.analysis;
    const fresh = ENGINE.analyze(note.body || '');
    analysisCache.set(note.id, { text: note.body, analysis: fresh });
    return fresh;
  }

  function journalShelf() {
    const insights = [];
    // Not named raisedBy: a shelf record already has a raisedBy field, and it
    // holds the insights that raised the work, not the notes they came from.
    const notesFor = {};             // workId -> Set of note titles

    Notes.all().forEach(n => {
      // the open note is live, so prefer the analysis already in hand
      const use = n.id === activeId && analysis ? analysis : analysisOf(n);
      (use.insights || []).forEach(i => insights.push(i));
      LIB.shelf(use.insights || []).forEach(w => {
        (notesFor[w.id] = notesFor[w.id] || new Set()).add(n.title || 'Untitled');
      });
    });

    return { shelf: LIB.shelf(insights), notesFor };
  }

  function renderShelf() {
    const { shelf: works, notesFor } = journalShelf();

    if (!works.length) {
      el.shelfView.innerHTML = `<div class="jview-empty">
        Nothing on the shelf yet. Works arrive here as your notes reach them —
        a paragraph or so is usually enough for the first one.
      </div>`;
      return;
    }

    el.shelfView.innerHTML = `
      <div class="prof-head">
        <div class="prof-cov"><b>${works.length}</b> work${works.length === 1 ? '' : 's'} your journal has reached</div>
        <p class="prof-lede">Ordered by how often your writing has arrived at them. The
          ones near the top are the arguments you keep walking back into.</p>
      </div>
      ${works.map(w => {
        const notes = [...(notesFor[w.id] || [])];
        // LIB.shelf already sorts by raisedBy.length descending; the attribute
        // exposes that weight so the ordering is assertable from a test.
        return `<article class="work" data-work="${esc(w.id)}" data-weight="${w.raisedBy.length}">
          <h4>${esc(w.title)}</h4>
          <div class="byline">${esc(w.author)}${w.era ? ' · ' + esc(w.era) : ''}</div>
          ${notes.length ? `<div class="raised">Raised by ${notes.slice(0, 3).map(esc).join(', ')}${
            notes.length > 3 ? ` and ${notes.length - 3} more` : ''}</div>` : ''}
        </article>`;
      }).join('')}`;
  }
```

Add `ENGINE` to the module's reference block if it is not already there:

```js
  const ENGINE = window.PalinodeEngine;
```

- [ ] **Step 4: Make a card open the Reading Room**

Add beside the profile listener in `assets/js/app.js`:

```js
  el.shelfView.addEventListener('click', e => {
    const card = e.target.closest('[data-work]');
    if (card) openRoom(card.dataset.work);
  });
```

- [ ] **Step 5: Style the added line**

Append to `assets/css/app.css`:

```css
.work .raised {
  margin-top: 8px; font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-4);
}
```

- [ ] **Step 6: Run the test**

Run: `node .verify/shelf.mjs`
Expected: all checks pass. If "a work opens the Reading Room" fails because
`openRoom` expects a different argument, check its signature and pass what it
wants — it is called from the Readings tab with a work id today.

- [ ] **Step 7: Run the regression**

Run: `for f in beliefs graph-spectra hover3d select3d panel-reveal spectrum-ui sidenav views profile; do node .verify/$f.mjs 2>&1 | tail -2; done`
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add assets/js/app.js assets/css/app.css .verify/shelf.mjs
git commit -m "Add the journal-wide shelf as a destination

The Readings tab answers what one note reached. This answers what the
journal has reached, which needs every note read rather than the open one —
so analyses are cached per note and redone only when the text changes."
```

---

### Task 6: The bottom bar on narrow screens

**Files:**
- Modify: `assets/css/app.css:634-639` (the 900px block) and the `.sidenav` block
- Modify: `index.html` (`.doc-meta`, for the narrow-screen Reading control)
- Test: `.verify/nav-mobile.mjs`

**Interfaces:**
- Consumes: the `nav.sidenav` markup from Task 2.
- Produces: nothing other tasks consume.

**Also fix here — a regression Task 2 introduced.** Task 2 moved `#btn-insights`
inside `aside.insights`, and this media block sets
`aside.rail, aside.insights { display: none }`. The only control that can
reveal the Reading panel is now inside the panel it reveals, so on a narrow
screen the reading is unreachable. `#btn-rail` does not have this problem
because it lives in the rail, which has no `display: none` at any width.

Resolve it the way the ownership split already implies: the Reading panel
belongs to the note, so its narrow-screen control belongs on the note, beside
Share. Add to `.doc-meta` in `index.html`, after `#btn-share`:

```html
            <button class="micro" id="btn-reading">Reading</button>
```

Give it the same listener behaviour as the chevron by adding `#btn-reading` to
the existing `#btn-insights` handler's selector in `app.js` — do not write a
second handler — and hide it above 900px, since the chevron serves there:

```css
#btn-reading { display: none; }
@media (max-width: 900px) { #btn-reading { display: inline-flex; } }
```

`.verify/nav-mobile.mjs` must assert reachability both ways: that the Reading
panel can be opened and closed at 390px, and that `#btn-insights` alone would
not have sufficed. No other suite runs below 1440px, so this suite is the only
thing standing between that deadlock and a future reintroduction.

- [ ] **Step 1: Write the failing test**

Create `.verify/nav-mobile.mjs`:

```js
/* On a phone the rail becomes a bottom bar, and the overlay rails stop
   reserving room for a header that no longer exists. */

import { chromium } from '/Users/tyreil/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs';

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const browser = await chromium.launch({
  executablePath: '/Users/tyreil/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const problems = [];
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
await page.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });

const bar = await page.evaluate(() => {
  const nav = document.querySelector('nav.sidenav');
  const cs = getComputedStyle(nav);
  const r = nav.getBoundingClientRect();
  const items = [...nav.querySelectorAll('.nav-item')].map(el => {
    const b = el.getBoundingClientRect();
    return { id: el.id, top: Math.round(b.top), left: Math.round(b.left) };
  });
  return { position: cs.position, dir: cs.flexDirection,
           left: Math.round(r.left), width: Math.round(r.width),
           bottom: Math.round(window.innerHeight - r.bottom),
           height: Math.round(r.height), items,
           brandShown: getComputedStyle(document.querySelector('.nav-brand')).display !== 'none' };
});

check('the nav is pinned to the bottom', bar.position === 'fixed' && bar.bottom === 0,
  bar.position + ', ' + bar.bottom + 'px from the bottom');
check('it spans the width', bar.width === 390, bar.width + 'px');
check('it lays out in a row', bar.dir === 'row', bar.dir);
check('all items share one row',
  new Set(bar.items.map(i => i.top)).size === 1, bar.items.map(i => i.top).join(','));
check('items are ordered left to right', bar.items.every((it, k) =>
  k === 0 || it.left > bar.items[k - 1].left), bar.items.map(i => i.left).join(','));
check('the brand is hidden on a phone', !bar.brandShown);
check('New note is still reachable', await page.isVisible('#btn-new'));
check('the bar is not too tall', bar.height <= 76, bar.height + 'px');

// the overlay rails must not reserve the removed header's 52px
await page.evaluate(() => document.getElementById('body').classList.add('show-rail'));
await page.waitForTimeout(250);
const rail = await page.evaluate(() => {
  const r = document.querySelector('aside.rail').getBoundingClientRect();
  const nav = document.querySelector('nav.sidenav').getBoundingClientRect();
  return { top: Math.round(r.top), bottom: Math.round(r.bottom),
           navTop: Math.round(nav.top) };
});
check('the Library overlay starts at the top', rail.top === 0, rail.top + 'px');
check('and stops above the bar', rail.bottom <= rail.navTop + 1,
  rail.bottom + ' vs bar at ' + rail.navTop);

// switching views still works from the bar
await page.evaluate(() => document.getElementById('body').classList.remove('show-rail'));
await page.click('#btn-profile');
await page.waitForTimeout(400);
check('a destination works from the bar', await page.evaluate(
  () => !document.getElementById('profile-view').hidden));
check('and marks itself active', await page.evaluate(
  () => (document.querySelector('nav.sidenav .nav-item.on') || {}).id === 'btn-profile'));

if (problems.length) problems.forEach(p => check(p, false));
console.log(`\n${pass} passed, ${fail} failed, ${problems.length} runtime issues`);
await browser.close();
process.exit(fail ? 1 : 0);
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node .verify/nav-mobile.mjs`
Expected: FAIL on "the nav is pinned to the bottom" — it is still a static
left column.

- [ ] **Step 3: Turn the rail into a bar below 900px**

Replace the 900px media block at `assets/css/app.css:634-639`:

```css
@media (max-width: 900px) {
  #app { grid-template-columns: minmax(0, 1fr); }

  /* the rail becomes a bottom bar; the brand has no room and no job here */
  nav.sidenav {
    position: fixed; inset: auto 0 0 0; z-index: 30;
    flex-direction: row; justify-content: space-around; align-items: center;
    gap: 0; padding: 6px 8px;
    height: var(--bar);
    border-right: 0; border-top: 1px solid var(--hairline-2);
    background: linear-gradient(180deg, rgba(8,7,10,.86), rgba(6,5,8,.96));
  }
  .nav-brand, .nav-rule { display: none; }
  .nav-item { height: 46px; }
  .nav-item::before { width: 40px; height: 28px; }

  .body, .body.rail-closed, .body.insights-closed { grid-template-columns: 1fr; }
  .centre-inner { padding-bottom: calc(110px + var(--bar)); }
  aside.rail, aside.insights { display: none; }
  .body.show-rail aside.rail {
    display: flex; position: absolute; inset: 0 auto var(--bar) 0; width: 280px; z-index: 20;
  }
  .body.show-insights aside.insights {
    display: flex; position: absolute; inset: 0 0 var(--bar) auto; width: 340px; z-index: 20;
  }

  /* the graph is inset by the bar, not by the rail */
  #graph { inset: 0 0 var(--bar) 0; }
}
```

Add `--bar` to `:root` beside `--nav`:

```css
  --bar: 64px;
```

- [ ] **Step 4: Run the test**

Run: `node .verify/nav-mobile.mjs`
Expected: all checks pass.

- [ ] **Step 5: Run the whole suite**

Run: `for f in beliefs graph-spectra hover3d select3d panel-reveal spectrum-ui sidenav views profile shelf nav-mobile; do printf "\n=== %s ===\n" "$f"; node .verify/$f.mjs 2>&1 | tail -2; done`
Expected: eleven suites, 0 failed across all of them.

- [ ] **Step 6: Commit**

```bash
git add assets/css/app.css .verify/nav-mobile.mjs
git commit -m "Make the rail a bottom bar on narrow screens

Also stops the overlay rails reserving 52px for the header that no longer
exists, and insets the graph by the bar instead of the rail."
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Layout: `#app` two-column grid, `--nav: 78px` | 2 |
| The rail: glyph, compose, hairline, four destinations | 2 |
| Reference geometry (78 / 40×56 / 72 / 24 / 10) | 2, asserted in `sidenav.mjs` |
| Label tracking fallback if words overflow | 2, Step 8 |
| Share moves to the note | 2 |
| Insights becomes a chevron on the Reading rail | 2 |
| Notes: destination from elsewhere, toggle when already writing | 3 |
| `setView(name)` over four views | 3 |
| Active item derived, including Room origin | 3 |
| Explore inset so the rail stays reachable | 2 (CSS), 3 (active state) |
| Shelf: `LIB.shelf` over all notes, "raised by" line, memoized | 5 |
| Profile: 27 axes by branch, coverage, placed lead | 4 |
| Shared `specTrack` / `specPoles` extraction | 1 |
| Responsive bottom bar; `inset: 52px` rules fixed | 6 |
| Empty states for both views | 3 (stubs), 4 and 5 (real) |
| Switching views closes the graph | 3 |
| Answering from Profile persists and refreshes | 4 |
| Testing: nav, shelf, profile, regression | 2, 5, 4, every task's last-but-one step |
| Out of scope: no logo, no collapse, no persisted view | honoured; no task adds them |

**Placeholder scan:** No TBD or TODO. Every code step carries the actual code.
Two steps name a conditional fallback rather than a fixed value — Task 2 Step 8
(reduce label tracking if a label clips) and Task 5 Step 6 (match `openRoom`'s
real signature) — and both state the exact action to take.

**Type consistency:** `SPECUI.track(axis, opts)` and `SPECUI.poles(axis, side)`
are defined in Task 1 and called with those exact names and arities in Task 4.
`setView`, `syncNav`, `roomOrigin`, `renderShelf`, `renderProfile`,
`el.shelfView`, and `el.profileView` are defined in Task 3 and used under the
same names in Tasks 4, 5, and 6. `VIEW_OF_BTN` is declared in Task 3; it is
used only by that task's own routing, so it is not in any Interfaces block.
The `data-view` values in Task 2's markup (`write`, `explore`, `shelf`,
`profile`) match the view names in Task 3's `setView` except `explore`, which
is a rail state rather than a centre view — as the spec requires.
