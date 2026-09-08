/* ============================================================
   Palinode — 3D exploration

   An alternate reading of the same graph, after the Palinode
   Explore view: the node you are in sits at the centre as a lit
   world; everything it connects to orbits it on a dotted path.
   Clicking a world centres it and shows its connections, clicking
   empty space goes back, dragging orbits the camera. The camera
   keeps whatever angle and distance you left it at.

   The 2D canvas and this share one selection through
   PalinodeGraph.model, so the toggle never loses your place.
   ============================================================ */

(function () {
  if (!window.THREE) { window.PalinodeGraph3D = { available: () => false }; return; }
  const T = window.THREE;

  const HUE = {
    resonance: 0xF6A244, tension: 0xE5484D, clarity: 0xA78BFA,
    stance:    0xD8C25A, lineage: 0x5EC7C0
  };

  let renderer, scene, camera, raf = null, host = null, model = null;
  let starfield, centreGroup, orbitGroup, trailGroup, ringMesh;
  let picks = [];                    // { mesh, id }
  let cam = { theta: -Math.PI / 2, phi: 1.13, dist: 12.4, target: new T.Vector3() };
  let spin = 0;
  let trailSpin = 0;                  // slower revolution of the path you took
  let trailIds = [];                  // previous trail nodes, not the centre
  let trailConnector = null;
  let lastTick = 0;
  let transition = 1;                 // 0..1 while a new orbit settles in
  let tStart = 0;                     // when the current settle began
  let centreFrom = 1;                 // scale the new centre grows from
  let pendingR = 0;                   // world radius of the orb that was clicked
  const SETTLE = 620;                 // ms for a selection to settle, by the clock
                                      // rather than by frame count
  // The trail turns about a third as fast as the equatorial orbit, by the
  // clock: 0.022 rad/s is a full revolution in about 4.8 minutes.
  const TRAIL_SPIN = 0.022 / 1000;
  let settleC = 1, settleO = 1;       // eased centre / orbit progress, for tests
  let hudDrop = 0;
  let disposables = [];
  let hud = null, hudId = null, centreR = 0.9;
  let tip = null, hoverId = null;
  const tipPos = new T.Vector3();

  const HOME_DIST = 12.4;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function reducedMotion() {
    return !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- labels drawn to a canvas and billboarded ---------- */

  function labelSprite(kicker, name, hue) {
    const dpr = 2, padX = 13 * dpr, padY = 9 * dpr;
    const c = document.createElement('canvas');
    const g = c.getContext('2d');

    const kFont = `700 ${10 * dpr}px Nunito, system-ui, sans-serif`;
    const nFont = `500 ${17 * dpr}px Lora, Georgia, serif`;
    g.font = kFont; const kw = kicker ? g.measureText(kicker.toUpperCase()).width + 6 * dpr * (kicker.length ? 1 : 0) : 0;
    g.font = nFont; const nw = g.measureText(name).width;

    const w = Math.ceil(Math.max(kw, nw) + padX * 2);
    const h = Math.ceil((kicker ? 15 * dpr : 0) + 23 * dpr + padY * 2);
    c.width = w; c.height = h;

    // chip
    const r = 9 * dpr;
    g.beginPath();
    g.moveTo(r, 0); g.arcTo(w, 0, w, h, r); g.arcTo(w, h, 0, h, r);
    g.arcTo(0, h, 0, 0, r); g.arcTo(0, 0, w, 0, r); g.closePath();
    g.fillStyle = 'rgba(8,7,11,0.82)'; g.fill();
    g.strokeStyle = 'rgba(' + [(hue >> 16) & 255, (hue >> 8) & 255, hue & 255].join(',') + ',0.34)';
    g.lineWidth = 1.4 * dpr; g.stroke();

    let y = padY;
    if (kicker) {
      g.font = kFont;
      g.fillStyle = 'rgba(255,255,255,0.42)';
      g.textBaseline = 'top';
      // letterspacing by hand — canvas has no tracking
      let x = padX;
      for (const ch of kicker.toUpperCase()) { g.fillText(ch, x, y); x += g.measureText(ch).width + 2.2 * dpr; }
      y += 15 * dpr;
    }
    g.font = nFont;
    g.fillStyle = 'rgba(255,255,255,0.95)';
    g.textBaseline = 'top';
    g.fillText(name, padX, y);

    const tex = new T.CanvasTexture(c);
    tex.minFilter = T.LinearFilter;
    tex.anisotropy = 4;
    const mat = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sp = new T.Sprite(mat);
    const scale = 0.0024;
    sp.scale.set(w * scale, h * scale, 1);
    disposables.push(tex, mat);
    return sp;
  }

  /* ---------- building blocks ---------- */

  function world(hue, radius, emissive) {
    const geo = new T.SphereGeometry(radius, 44, 32);
    const mat = new T.MeshStandardMaterial({
      color: hue, roughness: 0.28, metalness: 0.12,
      emissive: hue, emissiveIntensity: emissive === undefined ? 0.18 : emissive,
      transparent: true, opacity: 1
    });
    disposables.push(geo, mat);
    return new T.Mesh(geo, mat);
  }

  // the dotted orbital path
  function orbitPath(radius, hue) {
    const N = 260, pos = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      pos.push(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    const mat = new T.PointsMaterial({ color: hue, size: 0.032, transparent: true, opacity: 0.5 });
    disposables.push(geo, mat);
    const pts = new T.Points(geo, mat);
    pts.userData.baseOpacity = 0.5;
    return pts;
  }

  function ring(radius, hue) {
    const geo = new T.RingGeometry(radius * 1.44, radius * 1.60, 128);
    const mat = new T.MeshBasicMaterial({
      color: hue, transparent: true, opacity: 0.20, side: T.DoubleSide,
      blending: T.AdditiveBlending, depthWrite: false
    });
    disposables.push(geo, mat);
    const m = new T.Mesh(geo, mat);
    m.rotation.x = Math.PI / 2.32;
    m.userData.baseOpacity = 0.20;
    return m;
  }

  function stars() {
    const N = 1400, pos = [];
    for (let i = 0; i < N; i++) {
      const r = 40 + Math.random() * 80;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos.push(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph) * 0.6, r * Math.sin(ph) * Math.sin(th));
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    const mat = new T.PointsMaterial({ color: 0xffffff, size: 0.34, transparent: true, opacity: 0.5 });
    disposables.push(geo, mat);
    return new T.Points(geo, mat);
  }

  function thumbnailMaterial(url, hue, fallback) {
    const mat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.05,
                                             transparent: true, opacity: 1 });
    new T.TextureLoader().load(url, tex => {
      tex.colorSpace = T.SRGBColorSpace || tex.colorSpace;
      mat.map = tex; mat.needsUpdate = true;
      disposables.push(tex);
    }, undefined, () => { mat.color.setHex(hue); mat.needsUpdate = true; });
    disposables.push(mat);
    return mat;
  }

  /* ---------- scene assembly ---------- */

  function clearGroup(g) {
    if (!g) return;
    while (g.children.length) g.remove(g.children[0]);
  }

  // Previous worlds on the shared trail, laid on a curve that leads into
  // the centre from the right and slightly below — off the equatorial
  // orbit, so the path reads as a path and not another ring.
  function trailPose(i, n) {
    const t = n <= 1 ? 0.52 : i / Math.max(1, n - 1);
    const te = t * t * (3 - 2 * t);
    const u = 1 - te;
    const r = 2.12 + u * 3.98;
    const a = -0.20 + te * 0.72;
    const y = -0.78 - u * 1.42;
    return new T.Vector3(Math.cos(a) * r, y, Math.sin(a) * r);
  }

  function trailRibbon(pts) {
    const curve = new T.CatmullRomCurve3(pts);
    const segs = Math.max(24, pts.length * 16);
    const geo = new T.TubeGeometry(curve, segs, 0.018, 6, false);
    const mat = new T.MeshBasicMaterial({
      color: 0xc5c2b8, transparent: true, opacity: 0.26,
      blending: T.AdditiveBlending, depthWrite: false
    });
    disposables.push(geo, mat);
    const m = new T.Mesh(geo, mat);
    m.userData.baseOpacity = 0.26;
    m.userData.connector = true;
    return m;
  }

  function followLabels(g) {
    if (!g) return;
    g.children.forEach(ch => {
      if (ch.userData && ch.userData.follow) {
        ch.position.set(ch.userData.follow.position.x,
                        ch.userData.follow.position.y + ch.userData.lift,
                        ch.userData.follow.position.z);
      }
    });
  }

  function fadeGroup(g, o) {
    if (!g) return;
    g.children.forEach(ch => {
      if (ch.material) {
        ch.material.transparent = true;
        const base = ch.userData.baseOpacity === undefined ? 1 : ch.userData.baseOpacity;
        ch.material.opacity = base * o;
      }
    });
  }

  // The path in is the crumbs before the cursor. Later visits stay on
  // the HTML trail so you can walk forward; they are not behind you.
  function trailBehind() {
    const t = model.trail() || [];
    const i = model.trailIndex ? model.trailIndex() : t.length - 1;
    return t.slice(0, Math.max(0, i));
  }

  // Same history as #gx-trail. The centre is the current node; everything
  // before it becomes a physical orb on the path in. One crumb draws nothing.
  function buildTrail(centreId) {
    trailIds = [];
    trailConnector = null;
    if (!trailGroup) return;

    const stack = trailBehind()
      .filter(tid => tid && tid !== centreId)
      .map(tid => model.node(tid))
      .filter(Boolean);
    if (!stack.length) return;

    const pts = [];
    stack.forEach((node, i) => {
      const hue = HUE[model.category(node)] || 0x9aa0aa;
      const rr = node.type === 'note' || node.type === 'note-other' ? 0.32
               : node.type === 'work' ? 0.24
               : node.type === 'media' ? 0.3
               : node.type === 'tradition' ? 0.18 : 0.26;
      const pos = trailPose(i, stack.length);

      let m;
      if (node.type === 'media' && node._url) {
        const geo = new T.SphereGeometry(rr, 32, 24);
        disposables.push(geo);
        m = new T.Mesh(geo, thumbnailMaterial(node._url, hue));
      } else {
        m = world(hue, rr, 0.22);
      }
      m.position.copy(pos);
      m.userData.id = node.id;
      m.userData.r = rr;
      m.userData.trail = true;
      trailGroup.add(m);
      picks.push({ mesh: m, id: node.id });
      trailIds.push(node.id);
      pts.push(pos.clone());

      const l = labelSprite(model.kicker(node), model.label(node), hue);
      l.position.set(pos.x, pos.y + rr + 0.28, pos.z);
      l.userData.follow = m;
      l.userData.lift = rr + 0.28;
      trailGroup.add(l);
    });

    if (pts.length) {
      pts.push(new T.Vector3(0, -0.95, 0));
      trailConnector = trailRibbon(pts);
      trailGroup.add(trailConnector);
    }
  }

  function build() {
    picks = [];
    clearGroup(centreGroup);
    clearGroup(orbitGroup);
    clearGroup(trailGroup);
    trailIds = [];
    trailConnector = null;

    const id = model.selected();
    const node = model.node(id);
    if (!node) return;

    const hue = HUE[model.category(node)] || 0xF6A244;

    // the centre: a lit world with a ring
    const cr = node.type === 'note' ? 0.9 : 0.8;
    centreR = cr;

    // The orb you clicked is the thing that becomes the centre, so it grows
    // from the size it had out in the old orbit instead of being replaced at
    // full size. Arriving with no source — first mount, or stepping back up
    // the trail — grows from a fixed fraction instead.
    centreFrom = pendingR ? clamp(pendingR / cr, 0.12, 0.85) : 0.4;
    pendingR = 0;
    centreGroup.scale.setScalar(centreFrom);
    let centre;
    if (node.type === 'media' && node._url) {
      const geo = new T.SphereGeometry(cr, 44, 32);
      disposables.push(geo);
      centre = new T.Mesh(geo, thumbnailMaterial(node._url, hue));
    } else {
      centre = world(hue, cr, 0.42);
    }
    centre.userData.id = id;
    centreGroup.add(centre);
    picks.push({ mesh: centre, id });

    ringMesh = ring(cr, hue);
    centreGroup.add(ringMesh);

    const glow = new T.PointLight(hue, 1.5, 26, 2);
    centreGroup.add(glow);

    const lab = labelSprite(model.kicker(node), model.label(node), hue);
    lab.position.set(0, cr + 0.5, 0);
    centreGroup.add(lab);

    // the orbit — neighbours of the current world. A node already on the
    // trail is drawn there instead, so the path does not double as a copy
    // on the equator.
    const prior = new Set(trailBehind());
    const kids = model.orbit(id, 12).filter(k => !prior.has(k.id));
    const R = 4.3 + Math.min(2.2, kids.length * 0.12);
    orbitGroup.add(orbitPath(R, hue));

    kids.forEach((k, i) => {
      const a = (i / Math.max(1, kids.length)) * Math.PI * 2;
      const kh = HUE[model.category(k)] || 0x9aa0aa;
      const wobble = (i % 3 - 1) * 0.42;
      const rr = k.type === 'note' || k.type === 'note-other' ? 0.36
               : k.type === 'work' ? 0.28
               : k.type === 'media' ? 0.34
               : k.type === 'tradition' ? 0.2 : 0.3;

      let m;
      if (k.type === 'media' && k._url) {
        const geo = new T.SphereGeometry(rr, 32, 24);
        disposables.push(geo);
        m = new T.Mesh(geo, thumbnailMaterial(k._url, kh));
      } else {
        m = world(kh, rr, 0.2);
      }
      m.position.set(Math.cos(a) * R, wobble, Math.sin(a) * R);
      m.userData.id = k.id;
      m.userData.r = rr;      // the tip needs the real radius to clear the orb
      orbitGroup.add(m);
      picks.push({ mesh: m, id: k.id });

      const l = labelSprite(model.kicker(k), model.label(k), kh);
      l.position.set(m.position.x, m.position.y + rr + 0.3, m.position.z);
      l.userData.follow = m;
      l.userData.lift = rr + 0.3;
      orbitGroup.add(l);
    });

    buildTrail(id);
    if (trailGroup) trailGroup.scale.setScalar(0.96);

    transition = 0;
    tStart = performance.now();
    if (hud) hud.style.opacity = '0';
    // the orbs the old hover referred to no longer exist
    hoverId = null;
    if (tip) { tip.classList.remove('on'); tip.innerHTML = ''; }
    if (renderer) renderer.domElement.classList.remove('over');
  }

  /* ---------- the heads-up card ----------
     In 3D the side sheet is gone. What the world is, and what you can do
     about it, floats beside the world itself. The orbit already answers
     "where does this lead", so the card carries no list. */

  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function renderHud(force) {
    if (!hud) return;
    const id = model.selected();
    if (!force && id === hudId) return;
    hudId = id;
    const c = model.card(id);
    if (!c) { hud.innerHTML = ''; return; }

    const acts = (c.actions || []).map(a => a.act === 'open-link'
      ? `<a class="ghost solid" href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.label)}</a>`
      : `<button class="ghost ${a.primary ? 'solid' : ''}" data-act="${esc(a.act)}"${
          a.ref ? ` data-ref="${esc(a.ref)}"` : ''}>${esc(a.label)}</button>`).join('');

    hud.style.setProperty('--c', 'var(--' + c.category + ')');
    hud.innerHTML = `
      <div class="hud-kicker"><span class="orb sm" style="--c:var(--${c.category})"></span>${esc(c.kicker)}</div>
      <div class="hud-title">${esc(c.title)}</div>
      ${c.sub ? `<div class="hud-sub">${esc(c.sub)}</div>` : ''}
      ${c.bar || ''}
      ${c.line ? `<p class="hud-line${c.lineKind === 'question' ? ' q' : ''}">${esc(c.line)}</p>` : ''}
      ${acts ? `<div class="hud-acts">${acts}</div>` : ''}`;
  }

  // Anchored under the world at the centre. The camera always looks at that
  // world, so the card is pinned to the canvas centre plus a drop for the
  // sphere's radius — projecting the origin every frame let lookAt noise
  // shake it while you orbit. Snapped to whole pixels and written only when
  // it actually changes, because a subpixel transform every frame is exactly
  // what the jitter was.
  function placeHud() {
    if (!hud || !renderer || !host) return;
    const w = host.clientWidth, h = host.clientHeight;
    const focal = h / (2 * Math.tan(camera.fov * Math.PI / 360));
    const screenR = (centreR * centreGroup.scale.x * 1.85 * focal) / Math.max(0.001, cam.dist);
    const drop = Math.min(h * 0.34, screenR + 22);
    hudDrop = Math.round(drop);
    const next = 'translate3d(' + Math.round(w * 0.5) + 'px,' +
      Math.round(h * 0.5 + drop) + 'px,0) translate(-50%,0)';
    if (hud._xf !== next) { hud.style.transform = next; hud._xf = next; }
  }

  /* ---------- the hover tip ----------
     Reading a world should not cost a click. Hovering names it and gives
     one line of substance beside the orb itself; the orbit slows to a
     crawl so the thing you are reading stays where you found it. */

  function setHover(id) {
    if (id === hoverId) return;
    hoverId = id;
    if (renderer) renderer.domElement.classList.toggle('over', !!id);
    if (!tip) return;
    // the selected world already has the full card underneath it
    if (!id || id === model.selected()) {
      tip.classList.remove('on');
      tip.innerHTML = '';
      return;
    }
    const c = model.card(id);
    if (!c || !c.line) {
      tip.classList.remove('on');
      tip.innerHTML = '';
      return;
    }
    tip.style.setProperty('--c', 'var(--' + c.category + ')');
    tip.innerHTML =
      `<div class="gx-tip-title">${esc(c.title)}</div>` +
      (c.sub ? `<div class="gx-tip-sub">${esc(c.sub)}</div>` : '') +
      `<p class="gx-tip-line${c.lineKind === 'question' ? ' q' : ''}">${esc(c.line)}</p>`;
    tip.classList.add('on');
    tip._xf = '';
    placeTip();
  }

  // Sits beside the hovered world, flipping to its other side rather than
  // running off the canvas. Whole pixels, for the same reason as the HUD.
  function placeTip() {
    if (!tip || !hoverId || !tip.classList.contains('on') || !host) return;
    const p = picks.find(x => x.id === hoverId);
    if (!p) return;
    const w = host.clientWidth, h = host.clientHeight;
    p.mesh.getWorldPosition(tipPos).project(camera);
    const sx = (tipPos.x * 0.5 + 0.5) * w;
    const sy = (-tipPos.y * 0.5 + 0.5) * h;
    const parentS = p.mesh.parent ? p.mesh.parent.scale.x : 1;
    const liveR = (p.mesh.userData.r || 0.3) * p.mesh.scale.x * parentS;
    const focal = h / (2 * Math.tan(camera.fov * Math.PI / 360));
    const screenR = (liveR * 1.4 * focal) / Math.max(0.001, cam.dist);
    const tw = tip.offsetWidth || 240;
    const th = tip.offsetHeight || 80;
    let x = sx + screenR + 14;
    let y = sy - th * 0.4;
    if (x + tw > w - 16) x = sx - screenR - 14 - tw;
    x = clamp(x, 12, Math.max(12, w - tw - 12));
    y = clamp(y, 12, Math.max(12, h - th - 12));
    const next = 'translate3d(' + Math.round(x) + 'px,' + Math.round(y) + 'px,0)';
    if (tip._xf !== next) { tip.style.transform = next; tip._xf = next; }
  }

  /* ---------- camera ---------- */

  function place() {
    const t = cam.target;
    camera.position.set(
      t.x + cam.dist * Math.sin(cam.phi) * Math.cos(cam.theta),
      t.y + cam.dist * Math.cos(cam.phi),
      t.z + cam.dist * Math.sin(cam.phi) * Math.sin(cam.theta)
    );
    camera.lookAt(t);
  }

  /* ---------- loop ---------- */

  function frame() {
    if (!renderer) return;
    raf = requestAnimationFrame(frame);

    const now = performance.now();
    const dt = lastTick ? Math.min(48, now - lastTick) : 16.67;
    lastTick = now;

    // Hovering drops the orbit to a quarter speed rather than stopping it:
    // the field stays alive, but what you are reading stays put.
    spin += hoverId ? 0.000275 : 0.0011;
    orbitGroup.rotation.y = spin;

    // The trail turns on the clock, slower than the equator, and holds
    // still for anyone who has asked for less motion.
    const trailRate = reducedMotion() ? 0 : TRAIL_SPIN * (hoverId ? 0.25 : 1);
    trailSpin += trailRate * dt;
    if (trailGroup) trailGroup.rotation.y = trailSpin;

    followLabels(orbitGroup);
    followLabels(trailGroup);
    if (ringMesh) ringMesh.rotation.z += 0.0016;
    if (starfield) starfield.rotation.y += 0.00016;

    // Selecting re-centres and shows what the node connects to. The camera
    // does not move; the new orbit simply fades up around the new centre.
    if (transition < 1) {
      transition = clamp((performance.now() - tStart) / SETTLE, 0, 1);
      const e = 1 - Math.pow(1 - transition, 3);

      // the centre grows into place from the orb that was clicked
      centreGroup.scale.setScalar(centreFrom + (1 - centreFrom) * e);
      settleC = e;

      // What it connects to arrives just behind it, so the eye lands on the
      // new centre first and reads its orbit second.
      const o = 1 - Math.pow(1 - clamp((transition - 0.22) / 0.78, 0, 1), 3);
      settleO = o;
      orbitGroup.scale.setScalar(0.94 + 0.06 * o);
      fadeGroup(orbitGroup, o);
      // History is already known, so the trail eases in just ahead of the
      // new orbit — still behind the centre, never a snap.
      const tr = 1 - Math.pow(1 - clamp((transition - 0.08) / 0.82, 0, 1), 3);
      if (trailGroup) {
        trailGroup.scale.setScalar(0.96 + 0.04 * tr);
        fadeGroup(trailGroup, tr);
      }
      if (hud) hud.style.opacity = String(o);
    }

    place();
    placeHud();
    placeTip();
    renderer.render(scene, camera);
  }

  /* ---------- interaction ---------- */

  function bind(el) {
    const ray = new T.Raycaster();
    const v = new T.Vector2();
    let drag = null;

    el.addEventListener('pointerdown', e => {
      drag = { x: e.clientX, y: e.clientY, th: cam.theta, ph: cam.phi, moved: false };
      try { el.setPointerCapture(e.pointerId); } catch (err) {}
    });

    const pick = e => {
      const r = el.getBoundingClientRect();
      v.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      v.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(v, camera);
      return ray.intersectObjects(picks.map(p => p.mesh), false)[0];
    };

    el.addEventListener('pointermove', e => {
      if (!drag) {
        const hit = pick(e);
        setHover(hit ? hit.object.userData.id : null);
        return;
      }
      setHover(null);           // dragging is moving the camera, not reading
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
      cam.theta = drag.th - dx * 0.006;
      cam.phi = clamp(drag.ph - dy * 0.005, 0.22, Math.PI - 0.5);
    });

    el.addEventListener('pointerleave', () => setHover(null));

    el.addEventListener('pointerup', e => {
      const wasDrag = drag && drag.moved;
      drag = null;
      if (wasDrag) return;

      const hit = pick(e);
      if (hit) {
        const id = hit.object.userData.id;
        if (id !== model.selected()) descend(id);
      } else {
        ascend();
      }
    });

    el.addEventListener('wheel', e => {
      e.preventDefault();
      cam.dist = clamp(cam.dist * Math.exp(e.deltaY * 0.0012), 4.4, 34);
    }, { passive: false });
  }

  // Selecting a world makes it the centre and shows its connections.
  // No flight, no swap choreography — the camera holds its angle and
  // distance, and only the orbit around the centre changes.
  function descend(id) {
    if (id === model.selected()) return;
    // hand the rebuild the size this orb currently is, so the new centre can
    // continue it rather than start from nothing
    const p = picks.find(x => x.id === id);
    const parentS = p && p.mesh.parent ? p.mesh.parent.scale.x : 1;
    pendingR = p ? (p.mesh.userData.r || 0.3) * parentS : 0;
    model.select(id);                 // notifies, which rebuilds the scene
  }

  function ascend() {
    const t = model.trail();
    const i = model.trailIndex ? model.trailIndex() : t.length - 1;
    if (i < 1) return;
    model.select(t[i - 1]);
  }

  /* ---------- mount ---------- */

  function mount(el) {
    if (renderer) return;
    host = el;
    model = window.PalinodeGraph.model;

    scene = new T.Scene();
    camera = new T.PerspectiveCamera(46, 1, 0.1, 400);

    renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    host.appendChild(renderer.domElement);

    scene.add(new T.AmbientLight(0xffffff, 0.34));
    const key = new T.DirectionalLight(0xffffff, 1.15);
    key.position.set(-4, 6, 5);
    scene.add(key);
    const rim = new T.DirectionalLight(0x8fb6ff, 0.3);
    rim.position.set(5, -3, -4);
    scene.add(rim);

    starfield = stars();
    scene.add(starfield);

    centreGroup = new T.Group();
    orbitGroup = new T.Group();
    trailGroup = new T.Group();
    scene.add(centreGroup, orbitGroup, trailGroup);

    hud = document.createElement('div');
    hud.className = 'gx-hud';
    host.appendChild(hud);

    tip = document.createElement('div');
    tip.className = 'gx-tip';
    host.appendChild(tip);

    resize();
    build();
    renderHud(true);
    bind(renderer.domElement);
    model.onChange(() => {
      if (!renderer) return;
      // a save leaves the selection alone — only the card needs redrawing
      if (model.selected() === hudId) renderHud(true);
      else { build(); renderHud(true); }
    });
    frame();
  }

  function resize() {
    if (!renderer || !host) return;
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function unmount() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (hud && hud.parentNode) hud.parentNode.removeChild(hud);
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
    hud = null; hudId = null;
    tip = null; hoverId = null;
    disposables.forEach(d => { try { d.dispose(); } catch (e) {} });
    disposables = [];
    if (renderer) {
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    }
    renderer = scene = camera = null;
    picks = [];
    trailGroup = null;
    trailIds = [];
    trailConnector = null;
    trailSpin = 0;
    lastTick = 0;
  }

  // where each world currently sits on screen — used by tests, and cheap
  function hitTargets() {
    if (!renderer) return [];
    const r = renderer.domElement.getBoundingClientRect();
    return picks.map(p => {
      const v = p.mesh.getWorldPosition(new T.Vector3()).project(camera);
      return { id: p.id,
               x: Math.round(r.left + (v.x * 0.5 + 0.5) * r.width),
               y: Math.round(r.top + (-v.y * 0.5 + 0.5) * r.height) };
    });
  }

  window.PalinodeGraph3D = {
    available: () => true,
    mount, unmount, resize, hitTargets,
    cameraState: () => ({ dist: cam.dist, theta: cam.theta, phi: cam.phi }),
    orbitPhase: () => spin,
    hovered: () => hoverId,
    settleState: () => ({
      transition,
      centre: centreGroup ? centreGroup.scale.x : 1,
      centreProgress: settleC,
      orbitOpacity: settleO,
      hudDrop
    }),
    rebuild: () => { if (renderer) build(); },
    trailState: () => {
      const positions = [];
      if (trailGroup) {
        trailGroup.children.forEach(ch => {
          if (!ch.userData || !ch.userData.trail || !ch.userData.id) return;
          const v = ch.getWorldPosition(new T.Vector3());
          positions.push({ id: ch.userData.id, x: v.x, y: v.y, z: v.z });
        });
      }
      return {
        ids: trailIds.slice(),
        count: trailIds.length,
        connectors: !!(trailConnector && trailConnector.parent),
        centreId: model ? model.selected() : null,
        spin: trailSpin,
        reducedMotion: reducedMotion(),
        positions
      };
    }
  };
})();
