/* ============================================================
   Palinode — Marketplace (mentors, epics, checkout, learning, chat)
   ============================================================ */

(function () {
  const Data = () => window.PalinodeMarketData;
  const Pathways = () => window.PalinodeStore && window.PalinodeStore.Pathways;

  const KEY = 'palinode.market.v3';
  const $ = s => document.querySelector(s);
  const $$ = s => Array.from(document.querySelectorAll(s));
  const esc = s => String(s || '').replace(/[&<>"']/g, c => (
    { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('on'), 2200);
  }

  function blankState() {
    return { enrollments: {}, chat: {}, bookmarks: [], bookings: [] };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return blankState();
      return Object.assign(blankState(), JSON.parse(raw));
    } catch (e) { return blankState(); }
  }

  let state = load();
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) { /* private mode */ }
  };

  let tab = 'mentors'; // mentors | epics | mine
  let query = '';
  let filterLang = '';
  let filterPrice = '';
  let filterTag = '';
  let view = 'board'; // board | mentor | overview | learn
  let focusId = null; // epic or mentor id
  let focusKind = 'epic'; // epic | mentor
  let learnQuestId = null;
  let checkoutTarget = null;
  let bookMentorId = null;
  let active = false;
  let insightsWasClosed = false;

  function enrollment(epicId) {
    return state.enrollments[epicId] || null;
  }

  function ensureEnrollment(epicId) {
    const e = Data().epicOf(epicId);
    if (!e) return null;
    if (!state.enrollments[epicId]) {
      const quests = {};
      (e.questIds || []).forEach(qid => {
        quests[qid] = { status: 'Draft', notes: '', noteId: null, noteTitle: '', fileName: '', updated: Date.now() };
      });
      state.enrollments[epicId] = {
        epicId,
        enrolledAt: Date.now(),
        complete: false,
        quests
      };
      if (!state.chat[epicId]) {
        const mentor = Data().mentorOf(e.mentorId);
        state.chat[epicId] = [{
          id: 'm0',
          from: 'mentor',
          text: 'Welcome. Send a note whenever a quest snags — I will read it against the curriculum.',
          at: Date.now(),
          name: mentor ? mentor.name : 'Mentor'
        }];
      }
      save();
      if (window.PalinodeQuests) PalinodeQuests.activateForEpic(epicId);
    }
    return state.enrollments[epicId];
  }

  function isEnrolled(epicId) { return !!enrollment(epicId); }

  function stars(n) {
    const full = Math.round(n || 0);
    return '★'.repeat(Math.max(0, Math.min(5, full))) + '☆'.repeat(Math.max(0, 5 - full));
  }

  function priceLabel(n) { return '$' + Number(n || 0); }

  function tagsHtml(tags) {
    return (tags || []).map(t => `<span class="mkt-tag">${esc(t)}</span>`).join('');
  }

  function epicCta(item) {
    if (isEnrolled(item.id)) {
      const en = enrollment(item.id);
      if (en && en.complete) {
        return `<button class="ghost" data-mkt-open="epic:${esc(item.id)}">View</button>`;
      }
      return `<button class="ghost solid" data-mkt-learn="${esc(item.id)}">Continue</button>`;
    }
    return `<button class="ghost solid" data-mkt-open="epic:${esc(item.id)}">View Epic</button>`;
  }

  function epicCard(item) {
    return `<article class="mkt-card" data-kind="epic" data-id="${esc(item.id)}">
      <div class="mkt-card-top">
        <span class="orb sm" style="--c:var(--${esc(item.category || 'lineage')})"></span>
        <span class="mkt-badge">Epic</span>
        <span class="mkt-price">${priceLabel(item.price)}</span>
      </div>
      <h3>${esc(item.title)}</h3>
      <p class="mkt-mentor">${esc(item.mentorName)}</p>
      <p class="mkt-edu">${esc(item.education)}</p>
      <p class="mkt-meta"><span class="mkt-stars" aria-label="${item.rating} of 5">${stars(item.rating)}</span>
        <span>${item.rating.toFixed(1)}</span>
        <span>·</span>
        <span>${item.questCount} quest${item.questCount === 1 ? '' : 's'}</span></p>
      <p class="mkt-langs">${esc((item.languages || []).join(' · '))}</p>
      <p class="mkt-desc">${esc(item.description)}</p>
      <div class="mkt-tags">${tagsHtml(item.tags)}</div>
      <div class="mkt-card-act">${epicCta(item)}</div>
    </article>`;
  }

  function mentorAvatar(m, sizeClass) {
    const src = m.avatar || '';
    const cls = 'mkt-avatar' + (sizeClass ? ' ' + sizeClass : '');
    if (!src) {
      const initials = (m.name || '?').split(/\s+/).map(p => p[0]).slice(0, 2).join('');
      return `<span class="${cls} mkt-avatar-fallback" aria-hidden="true">${esc(initials)}</span>`;
    }
    return `<img class="${cls}" src="${esc(src)}" alt="" width="56" height="56" loading="lazy">`;
  }

  function mentorCard(m) {
    return `<article class="mkt-card mkt-mentor-card" data-kind="mentor" data-id="${esc(m.id)}">
      <div class="mkt-card-top">
        <span class="orb sm" style="--c:var(--lineage)"></span>
        <span class="mkt-badge">Mentor</span>
        <span class="mkt-price">${m.epicCount} epic${m.epicCount === 1 ? '' : 's'}</span>
      </div>
      <div class="mkt-id-row">
        ${mentorAvatar(m)}
        <div class="mkt-id-text">
          <h3>${esc(m.name)}</h3>
          <p class="mkt-edu">${esc(m.education)}</p>
        </div>
      </div>
      <p class="mkt-meta"><span class="mkt-stars" aria-label="${m.rating} of 5">${stars(m.rating)}</span>
        <span>${m.rating.toFixed(1)}</span></p>
      <p class="mkt-langs">${esc((m.languages || []).join(' · '))}</p>
      <p class="mkt-desc">${esc(m.bio)}</p>
      <div class="mkt-tags">${tagsHtml(m.focusAreas)}</div>
      <div class="mkt-card-act">
        <button class="ghost solid" data-mkt-open="mentor:${esc(m.id)}">View profile</button>
      </div>
    </article>`;
  }

  function filterEpics(list) {
    const q = query.trim().toLowerCase();
    return list.filter(item => {
      if (filterLang && !(item.languages || []).includes(filterLang)) return false;
      if (filterTag && !(item.tags || []).includes(filterTag)) return false;
      if (filterPrice === 'low' && item.price > 160) return false;
      if (filterPrice === 'mid' && (item.price <= 160 || item.price > 200)) return false;
      if (filterPrice === 'high' && item.price <= 200) return false;
      if (!q) return true;
      const hay = [item.title, item.description, item.mentorName, item.education, ...(item.tags || [])]
        .join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function filterMentors(list) {
    const q = query.trim().toLowerCase();
    return list.filter(m => {
      if (filterLang && !(m.languages || []).includes(filterLang)) return false;
      if (filterTag && !(m.tags || []).includes(filterTag) && !(m.focusAreas || []).includes(filterTag))
        return false;
      if (!q) return true;
      const hay = [m.name, m.bio, m.education, ...(m.focusAreas || []), ...(m.traditions || [])]
        .join(' ').toLowerCase();
      return hay.includes(q);
    });
  }

  function boardItemsHtml() {
    if (tab === 'mentors') return filterMentors(Data().allMentors()).map(mentorCard).join('');
    if (tab === 'mine') {
      const ids = Object.keys(state.enrollments);
      return filterEpics(ids.map(id => Data().hydrateEpic(Data().epicOf(id))).filter(Boolean))
        .map(epicCard).join('');
    }
    return filterEpics(Data().allEpics()).map(epicCard).join('');
  }

  function allTags() {
    const set = new Set();
    Data().allEpics().forEach(e => (e.tags || []).forEach(t => set.add(t)));
    Data().allMentors().forEach(m => {
      (m.focusAreas || []).forEach(t => set.add(t));
      (m.traditions || []).forEach(t => set.add(t));
    });
    return [...set].sort();
  }

  function allLangs() {
    const set = new Set();
    Data().allEpics().forEach(e => (e.languages || []).forEach(l => set.add(l)));
    Data().allMentors().forEach(m => (m.languages || []).forEach(l => set.add(l)));
    return [...set].sort();
  }

  function syncFilterChrome() {
    const price = $('#mkt-filter-price');
    if (price) price.hidden = tab === 'mentors';
    const q = $('#mkt-q');
    if (q) {
      q.placeholder = tab === 'mentors' ? 'Search mentors…'
        : tab === 'mine' ? 'Search my epics…'
        : 'Search epics…';
    }
  }

  function renderBoard() {
    const grid = $('#mkt-grid');
    const empty = $('#mkt-empty');
    $$('#mkt-tabs .seg-btn').forEach(b => b.classList.toggle('on', b.dataset.mktTab === tab));
    syncFilterChrome();
    const html = boardItemsHtml();
    const count = (html.match(/mkt-card/g) || []).length;
    if (grid) {
      grid.innerHTML = html;
      grid.hidden = !count;
    }
    if (empty) {
      empty.hidden = !!count;
      empty.textContent = tab === 'mine'
        ? 'No epics yet. Find a mentor and sign up for one of theirs.'
        : 'Nothing matched these filters.';
    }
  }

  function renderFilters() {
    const lang = $('#mkt-filter-lang');
    const tag = $('#mkt-filter-tag');
    if (lang && lang.options.length <= 1) {
      allLangs().forEach(l => {
        const o = document.createElement('option');
        o.value = l; o.textContent = l; lang.appendChild(o);
      });
    }
    if (tag && tag.options.length <= 1) {
      allTags().forEach(t => {
        const o = document.createElement('option');
        o.value = t; o.textContent = t; tag.appendChild(o);
      });
    }
    if (lang) lang.value = filterLang;
    if (tag) tag.value = filterTag;
    const price = $('#mkt-filter-price');
    if (price) price.value = filterPrice;
    const q = $('#mkt-q');
    if (q && q.value !== query) q.value = query;
    syncFilterChrome();
  }

  function progressOf(epicId) {
    const en = enrollment(epicId);
    const e = Data().hydrateEpic(Data().epicOf(epicId));
    if (!en || !e) return { done: 0, total: 0, pct: 0 };
    const total = (e.quests || []).length;
    const done = (e.quests || []).filter(q => en.quests[q.id] && en.quests[q.id].status === 'Completed').length;
    return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function bookingsForMentor(mentorId) {
    return (state.bookings || []).filter(b => b.mentorId === mentorId);
  }

  function renderMentor() {
    const host = $('#mkt-mentor-body');
    if (!host) return;
    const m = Data().hydrateMentor(Data().mentorOf(focusId));
    if (!m) return;
    const act = m.khoraActivity || {};
    const enrolledAny = (m.epics || []).some(e => isEnrolled(e.id));
    const booked = bookingsForMentor(m.id);
    const mins = m.sessionMins || 50;
    const price = m.sessionPrice || 90;
    host.innerHTML = `
      <div class="mkt-ov-kicker">
        <span class="orb sm" style="--c:var(--lineage)"></span>
        Mentor · Khora profile
      </div>
      <div class="mkt-id-row mkt-id-row-lg">
        ${mentorAvatar(m, 'lg')}
        <div class="mkt-id-text">
          <h2>${esc(m.name)}</h2>
          <p class="mkt-edu">${esc(m.education)}</p>
        </div>
      </div>
      <p class="mkt-meta"><span class="mkt-stars" aria-label="${m.rating} of 5">${stars(m.rating)}</span>
        <span>${m.rating.toFixed(1)}</span>
        <span>·</span>
        <span>${esc((m.languages || []).join(' · '))}</span></p>
      <p class="mkt-desc">${esc(m.bio)}</p>
      <div class="mkt-tags">${tagsHtml(m.focusAreas)}</div>

      <h4 class="mkt-ov-h">Traditions</h4>
      <div class="mkt-tags">${tagsHtml(m.traditions)}</div>

      <h4 class="mkt-ov-h">On Khora</h4>
      <p class="mkt-khora-stats">
        ${act.years || 0} years · ${act.conceptsTended || 0} concepts tended ·
        ${act.pathwaysGuided || 0} pathways guided
      </p>
      <ul class="mkt-activity">
        ${(act.recent || []).map(line => `<li>${esc(line)}</li>`).join('')}
      </ul>

      <h4 class="mkt-ov-h">Epics they offer</h4>
      <ol class="mkt-quests">
        ${(m.epics || []).map((e, i) => {
          const enrolled = isEnrolled(e.id);
          return `<li>
            <button type="button" class="mkt-quest-row" data-mkt-open="epic:${esc(e.id)}">
              <span class="n">${i + 1}</span>
              <span class="t">${esc(e.title)}</span>
              <span class="d">${e.questCount} quests · ${priceLabel(e.price)}${enrolled ? ' · Enrolled' : ''}</span>
            </button>
          </li>`;
        }).join('')}
      </ol>

      ${booked.length ? `
        <h4 class="mkt-ov-h">Your sessions</h4>
        <ul class="mkt-activity">
          ${booked.map(b => `<li>${esc(b.slot)} · ${esc(b.topic || 'Open conversation')} · ${priceLabel(b.price)}</li>`).join('')}
        </ul>` : ''}

      <p class="mkt-session-rate">${mins} min guidance session · ${priceLabel(price)}</p>
      <div class="gx-act mkt-ov-act">
        <button class="ghost solid" data-mkt-book="${esc(m.id)}">Book a session</button>
        ${enrolledAny || booked.length
          ? `<button class="ghost" data-mkt-chat-mentor="${esc(m.id)}">Chat with mentor</button>`
          : `<button class="ghost" data-mkt-discuss="mentor:${esc(m.id)}">Discuss Topic</button>`}
      </div>`;
  }

  function renderOverview() {
    const host = $('#mkt-overview-body');
    if (!host) return;
    const e = Data().hydrateEpic(Data().epicOf(focusId));
    if (!e) return;
    const enrolled = isEnrolled(e.id);
    const en = enrollment(e.id);
    const prog = progressOf(e.id);
    host.innerHTML = `
      <div class="mkt-ov-kicker">
        <span class="orb sm" style="--c:var(--${esc(e.category)})"></span>
        Epic${enrolled ? ' · Enrolled' : ''}
      </div>
      <h2>${esc(e.title)}</h2>
      <p class="mkt-ov-mentor">
        <button type="button" class="mkt-link" data-mkt-open="mentor:${esc(e.mentorId)}">${esc(e.mentorName)}</button>
      </p>
      <p class="mkt-edu">${esc(e.education)}</p>
      <p class="mkt-ov-price">${priceLabel(e.price)}</p>
      <p class="mkt-desc">${esc(e.description)}</p>
      <div class="mkt-tags">${tagsHtml(e.tags)}</div>
      ${enrolled ? `<p class="mkt-progress-lab">Progress ${prog.done}/${prog.total} · ${prog.pct}%</p>
        <div class="mkt-progress"><i style="width:${prog.pct}%"></i></div>` : ''}
      <h4 class="mkt-ov-h">Quests</h4>
      <ol class="mkt-quests">
        ${(e.quests || []).map((q, i) => {
          const st = en && en.quests[q.id] ? en.quests[q.id].status : '';
          return `<li>
            <div class="mkt-quest-row static">
              <span class="n">${i + 1}</span>
              <span class="t">${esc(q.title)}</span>
              <span class="d">${esc(q.description)}</span>
              ${st ? `<span class="mkt-status ${esc(st.toLowerCase().replace(/\s/g, '-'))}">${esc(st)}</span>` : ''}
            </div>
          </li>`;
        }).join('')}
      </ol>
      <div class="gx-act mkt-ov-act">
        ${enrolled
          ? `<button class="ghost solid" data-mkt-learn="${esc(e.id)}">Continue</button>
             <button class="ghost" data-mkt-chat="${esc(e.id)}">Chat with mentor</button>`
          : `<button class="ghost solid" data-mkt-checkout="${esc(e.id)}">Sign up</button>
             <button class="ghost" data-mkt-discuss="epic:${esc(e.id)}">Discuss Topic</button>`}
      </div>`;
  }

  function showView(next) {
    view = next;
    const board = $('#mkt-board');
    const mentor = $('#mkt-mentor');
    const ov = $('#mkt-overview');
    const learn = $('#mkt-learn');
    if (board) board.hidden = view !== 'board';
    if (mentor) mentor.hidden = view !== 'mentor';
    if (ov) ov.hidden = view !== 'overview';
    if (learn) learn.hidden = view !== 'learn';
    if (view === 'board') renderBoard();
    if (view === 'mentor') renderMentor();
    if (view === 'overview') renderOverview();
    if (view === 'learn') renderLearn();
  }

  function showMentor(id) {
    focusKind = 'mentor';
    focusId = id;
    showView('mentor');
  }

  function showEpicOverview(id) {
    focusKind = 'epic';
    focusId = id;
    showView('overview');
  }

  function openCheckout(epicId) {
    checkoutTarget = epicId;
    const e = Data().hydrateEpic(Data().epicOf(epicId));
    const scrim = $('#mkt-checkout-scrim');
    const title = $('#mkt-checkout-title');
    const price = $('#mkt-checkout-price');
    if (title) title.textContent = e ? e.title : 'Epic';
    if (price) price.textContent = e ? priceLabel(e.price) : '';
    if (scrim) scrim.classList.add('on');
  }

  function closeCheckout() {
    const scrim = $('#mkt-checkout-scrim');
    if (scrim) scrim.classList.remove('on');
    checkoutTarget = null;
  }

  function openBookSession(mentorId) {
    bookMentorId = mentorId;
    const m = Data().mentorOf(mentorId);
    const scrim = $('#mkt-book-scrim');
    const title = $('#mkt-book-title');
    const lede = $('#mkt-book-lede');
    const price = $('#mkt-book-price');
    const topic = $('#mkt-book-topic');
    if (title) title.textContent = m ? ('Session with ' + m.name) : 'Book a session';
    if (lede) {
      lede.textContent = m
        ? ((m.sessionMins || 50) + ' minutes of guidance — mock booking, nothing is charged.')
        : 'Mock booking — nothing is charged.';
    }
    if (price) price.textContent = m ? priceLabel(m.sessionPrice || 90) : '';
    if (topic) topic.value = '';
    if (scrim) scrim.classList.add('on');
  }

  function closeBookSession() {
    const scrim = $('#mkt-book-scrim');
    if (scrim) scrim.classList.remove('on');
    bookMentorId = null;
  }

  function completeBookSession() {
    if (!bookMentorId) return;
    const m = Data().mentorOf(bookMentorId);
    if (!m) return;
    const topic = (($('#mkt-book-topic') || {}).value || '').trim();
    const slot = ($('#mkt-book-slot') || {}).value || 'Thu 10:00';
    if (!topic) { toast('Say what you want to work on.'); return; }
    if (!state.bookings) state.bookings = [];
    const booking = {
      id: 'b' + Date.now(),
      mentorId: m.id,
      mentorName: m.name,
      topic,
      slot,
      price: m.sessionPrice || 90,
      mins: m.sessionMins || 50,
      at: Date.now()
    };
    state.bookings.push(booking);
    const chatKey = 'mentor:' + m.id;
    if (!state.chat[chatKey]) {
      state.chat[chatKey] = [{
        id: 'm0',
        from: 'mentor',
        name: m.name,
        text: 'Your session is booked for ' + slot + '. Send anything you want me to read beforehand.',
        at: Date.now()
      }];
    } else {
      state.chat[chatKey].push({
        id: 'm' + Date.now(),
        from: 'mentor',
        name: m.name,
        text: 'Booked for ' + slot + ' — topic noted: “' + topic + '”.',
        at: Date.now()
      });
    }
    save();
    closeBookSession();
    toast('Session booked with ' + m.name + '.');
    if (view === 'mentor' && focusId === m.id) renderMentor();
    openMentorChat(m.id, 'Looking forward to ' + slot + ' — ');
  }

  function completeCheckout() {
    if (!checkoutTarget) return;
    const id = checkoutTarget;
    ensureEnrollment(id);
    if (window.PalinodeQuests) PalinodeQuests.activateForEpic(id);
    closeCheckout();
    toast('Enrolled. Opening My Epics.');
    tab = 'mine';
    showView('board');
    renderFilters();
    renderBoard();
    showEpicOverview(id);
  }

  function renderLearn() {
    const host = $('#mkt-learn-body');
    if (!host || !focusId) return;
    const e = Data().hydrateEpic(Data().epicOf(focusId));
    const en = ensureEnrollment(focusId);
    if (!e || !en) return;
    if (!learnQuestId && e.quests.length) learnQuestId = e.quests[0].id;
    const quest = (e.quests || []).find(q => q.id === learnQuestId) || e.quests[0];
    const sub = en.quests[quest.id] || { status: 'Draft', notes: '', noteId: null, noteTitle: '', fileName: '' };
    // Prefer shared quest-log submission when present.
    if (window.PalinodeQuests) {
      const log = PalinodeQuests.get(quest.id);
      if (log && log.submission && log.submission.noteId) {
        sub.noteId = log.submission.noteId;
        sub.noteTitle = log.submission.noteTitle || '';
      }
    }
    const prog = progressOf(e.id);
    const locked = sub.status === 'Submitted' || sub.status === 'Under Review' || sub.status === 'Completed';
    const allDone = prog.total > 0 && prog.done === prog.total;
    const notes = window.PalinodeStore && PalinodeStore.Notes
      ? PalinodeStore.Notes.all()
      : [];
    const noteOptions = notes.map(n => {
      const sel = sub.noteId === n.id ? ' selected' : '';
      const label = (n.title || 'Untitled');
      return `<option value="${esc(n.id)}"${sel}>${esc(label)}</option>`;
    }).join('');
    const steps = (quest.steps || []).map(s => {
      const c = (window.PalinodeCorpus && PalinodeCorpus.CONCEPTS || [])
        .find(x => x.id === s.conceptId);
      return `<li>${esc(c ? c.label : s.conceptId)}</li>`;
    }).join('');

    host.innerHTML = `
      <div class="mkt-learn-head">
        <button type="button" class="micro" data-mkt-back-overview>← Overview</button>
        <button type="button" class="ghost" data-mkt-chat="${esc(e.id)}">Chat with mentor</button>
      </div>
      <h2>${esc(e.title)}</h2>
      <p class="mkt-ov-mentor">${esc(e.mentorName)}</p>
      <p class="mkt-progress-lab">${prog.pct}% complete · ${prog.done}/${prog.total} quests</p>
      <div class="mkt-progress"><i style="width:${prog.pct}%"></i></div>
      <div class="mkt-learn-split">
        <ol class="mkt-learn-nav">
          ${(e.quests || []).map((q, i) => {
            const st = en.quests[q.id] ? en.quests[q.id].status : 'Draft';
            return `<li><button type="button" class="mkt-learn-nav-btn${q.id === quest.id ? ' on' : ''}"
              data-mkt-quest="${esc(q.id)}"><span class="n">${i + 1}</span>
              <span class="t">${esc(q.title)}</span>
              <span class="mkt-status ${esc(st.toLowerCase().replace(/\s/g, '-'))}">${esc(st)}</span>
            </button></li>`;
          }).join('')}
        </ol>
        <div class="mkt-learn-detail">
          <h3>${esc(quest.title)}</h3>
          <p class="mkt-desc">${esc(quest.description)}</p>
          ${steps ? `<h4 class="mkt-ov-h">Nodes</h4><ul class="quest-objectives">${steps}</ul>` : ''}
          <label class="mkt-field">
            <span>Submit a journal note</span>
            <select id="mkt-quest-note" ${locked ? 'disabled' : ''}>
              <option value="">Choose a note…</option>
              ${noteOptions}
            </select>
          </label>
          ${sub.noteId ? `<p class="gx-fine">Selected · ${esc(sub.noteTitle || 'Untitled')}</p>` : ''}
          <label class="mkt-field">
            <span>Attachment (name only — mock)</span>
            <input type="text" id="mkt-quest-file" ${locked ? 'readonly' : ''}
              value="${esc(sub.fileName)}" placeholder="essay.pdf">
          </label>
          <p class="mkt-status-line">Status: <strong class="mkt-status ${esc(sub.status.toLowerCase().replace(/\s/g, '-'))}">${esc(sub.status)}</strong></p>
          <div class="gx-act">
            ${!locked ? `<button class="ghost solid" data-mkt-submit-quest>Turn in quest</button>` : ''}
            ${sub.status === 'Submitted' || sub.status === 'Under Review'
              ? `<button class="ghost" data-mkt-simulate-review>Simulate mentor review</button>` : ''}
            <button class="ghost" data-mkt-discuss-quest="${esc(quest.id)}">Discuss this quest</button>
          </div>
          <div class="gx-act" style="margin-top:18px">
            <button class="ghost solid" data-mkt-complete-epic ${allDone && !en.complete ? '' : 'disabled'}>
              ${en.complete ? 'Epic completed' : 'Mark epic complete'}
            </button>
          </div>
        </div>
      </div>`;
  }

  function syncQuestSubmission(epicId, questId, payload) {
    const en = ensureEnrollment(epicId);
    if (!en || !questId) return;
    const cur = en.quests[questId] || { status: 'Draft', notes: '', noteId: null, noteTitle: '', fileName: '' };
    cur.noteId = payload.noteId || null;
    cur.noteTitle = payload.noteTitle || '';
    cur.notes = payload.mode === 'response'
      ? (payload.body || '')
      : (cur.noteTitle || payload.body || '');
    if (payload.submitted && cur.status === 'Draft') {
      cur.status = 'Submitted';
    }
    cur.updated = Date.now();
    en.quests[questId] = cur;
    save();
    if (active && view === 'learn') renderLearn();
  }

  function submitQuest() {
    const en = enrollment(focusId);
    if (!en || !learnQuestId) return;
    const sel = $('#mkt-quest-note');
    const noteId = (sel && sel.value) || (en.quests[learnQuestId] && en.quests[learnQuestId].noteId) || '';
    if (!noteId) { toast('Select a journal note before turning in.'); return; }
    const note = window.PalinodeStore && PalinodeStore.Notes
      ? PalinodeStore.Notes.get(noteId)
      : null;
    if (!note) { toast('That note is missing. Pick another.'); return; }
    const fileName = ($('#mkt-quest-file') || {}).value || '';
    en.quests[learnQuestId] = {
      status: 'Submitted',
      notes: note.title || 'Untitled',
      noteId: note.id,
      noteTitle: note.title || 'Untitled',
      fileName: fileName.trim(),
      updated: Date.now()
    };
    save();
    if (window.PalinodeQuests && typeof PalinodeQuests.applyEpicSubmission === 'function') {
      PalinodeQuests.applyEpicSubmission(learnQuestId, {
        noteId: note.id,
        noteTitle: note.title || 'Untitled',
        submitted: true
      });
    }
    toast('Quest submitted.');
    renderLearn();
    setTimeout(() => {
      const cur = enrollment(focusId);
      if (!cur || !cur.quests[learnQuestId]) return;
      if (cur.quests[learnQuestId].status !== 'Submitted') return;
      cur.quests[learnQuestId].status = 'Under Review';
      save();
      if (view === 'learn') renderLearn();
    }, 1600);
  }

  function simulateReview() {
    const en = enrollment(focusId);
    if (!en || !learnQuestId) return;
    const sub = en.quests[learnQuestId];
    if (!sub) return;
    if (sub.status === 'Under Review' || sub.status === 'Submitted') {
      sub.status = 'Completed';
      sub.updated = Date.now();
      save();
      if (window.PalinodeQuests) PalinodeQuests.complete(learnQuestId);
      toast('Mentor marked this quest complete.');
      renderLearn();
    }
  }

  function completeEpic() {
    const en = enrollment(focusId);
    const prog = progressOf(focusId);
    if (!en || prog.done < prog.total) {
      toast('Finish every quest first.');
      return;
    }
    en.complete = true;
    save();
    toast('Epic marked complete.');
    renderLearn();
  }

  function openChat(epicId, seedText) {
    ensureEnrollment(epicId);
    const panel = $('#mkt-chat');
    const title = $('#mkt-chat-title');
    const e = Data().hydrateEpic(Data().epicOf(epicId));
    if (title) title.textContent = e ? ('Chat · ' + e.mentorName) : 'Chat';
    if (panel) {
      panel.hidden = false;
      panel.dataset.chatKey = epicId;
    }
    renderChat(epicId);
    const input = $('#mkt-chat-input');
    if (input && seedText) {
      input.value = seedText;
      input.focus();
    }
  }

  function openMentorChat(mentorId, seedText) {
    const m = Data().mentorOf(mentorId);
    const key = 'mentor:' + mentorId;
    if (!state.chat[key]) {
      state.chat[key] = [{
        id: 'm0',
        from: 'mentor',
        name: m ? m.name : 'Mentor',
        text: 'Send a note whenever something is stuck — I will answer against what you have written on Khora.',
        at: Date.now()
      }];
      save();
    }
    const panel = $('#mkt-chat');
    const title = $('#mkt-chat-title');
    if (title) title.textContent = m ? ('Chat · ' + m.name) : 'Chat';
    if (panel) {
      panel.hidden = false;
      panel.dataset.chatKey = key;
    }
    renderChat(key);
    const input = $('#mkt-chat-input');
    if (input && seedText) {
      input.value = seedText;
      input.focus();
    }
  }

  function closeChat() {
    const panel = $('#mkt-chat');
    if (panel) panel.hidden = true;
  }

  function renderChat(chatKey) {
    const body = $('#mkt-chat-body');
    if (!body) return;
    const msgs = state.chat[chatKey] || [];
    body.innerHTML = msgs.map(m => `
      <div class="mkt-msg ${m.from === 'me' ? 'me' : 'them'}">
        <div class="mkt-msg-who">${esc(m.name || (m.from === 'me' ? 'You' : 'Mentor'))}</div>
        <p>${esc(m.text)}</p>
      </div>`).join('');
    body.scrollTop = body.scrollHeight;
  }

  function sendChat() {
    const panel = $('#mkt-chat');
    const chatKey = panel && panel.dataset.chatKey;
    const input = $('#mkt-chat-input');
    if (!chatKey || !input) return;
    const text = input.value.trim();
    if (!text) return;
    if (!state.chat[chatKey]) state.chat[chatKey] = [];
    state.chat[chatKey].push({ id: 'u' + Date.now(), from: 'me', name: 'You', text, at: Date.now() });
    input.value = '';
    save();
    renderChat(chatKey);
    setTimeout(() => {
      let mentorName = 'Mentor';
      if (chatKey.indexOf('mentor:') === 0) {
        const m = Data().mentorOf(chatKey.slice(7));
        if (m) mentorName = m.name;
      } else {
        const e = Data().epicOf(chatKey);
        const mentor = e && Data().mentorOf(e.mentorId);
        if (mentor) mentorName = mentor.name;
      }
      state.chat[chatKey].push({
        id: 'm' + Date.now(),
        from: 'mentor',
        name: mentorName,
        text: 'Received. I will read this against your thread and reply with a sharper question.',
        at: Date.now()
      });
      save();
      if ($('#mkt-chat') && !$('#mkt-chat').hidden) renderChat(chatKey);
    }, 900);
  }

  function hideWriteCentre() {
    const ed = $('#editor-wrap');
    const empty = $('#empty-state');
    const read = $('#reading-room');
    const path = $('#pathway-wrap');
    const pe = $('#path-empty');
    const profile = $('#profile-view');
    const quests = $('#quests-wrap');
    const qe = $('#quest-empty');
    const dash = $('#dashboard-wrap');
    if (ed) ed.hidden = true;
    if (empty) { empty.hidden = true; empty.style.display = 'none'; }
    if (read) read.hidden = true;
    if (path) path.hidden = true;
    if (pe) pe.hidden = true;
    if (profile) profile.hidden = true;
    if (quests) quests.hidden = true;
    if (qe) qe.hidden = true;
    if (dash) dash.hidden = true;
  }

  function enter(opts) {
    active = true;
    hideWriteCentre();
    const wrap = $('#market-wrap');
    if (wrap) wrap.hidden = false;
    const body = document.getElementById('body');
    if (body && !body.classList.contains('market-mode'))
      insightsWasClosed = body.classList.contains('insights-closed');
    if (body) {
      body.classList.add('market-mode', 'insights-closed');
      body.classList.remove('pathways-mode', 'quests-mode', 'show-rail', 'show-insights');
    }
    tab = (opts && opts.tab) || 'mentors';
    query = '';
    filterLang = '';
    filterPrice = '';
    filterTag = '';
    closeChat();
    closeCheckout();
    closeBookSession();
    renderFilters();
    if (opts && opts.mentorId) {
      showMentor(opts.mentorId);
    } else if (opts && opts.questId) {
      openQuest(opts.questId);
    } else if (opts && opts.epicId) {
      showEpicOverview(opts.epicId);
    } else {
      showView('board');
    }
    if (typeof window.PalinodeMarketplace.onChrome === 'function')
      window.PalinodeMarketplace.onChrome();
  }

  function leave() {
    active = false;
    const wrap = $('#market-wrap');
    if (wrap) wrap.hidden = true;
    const body = document.getElementById('body');
    if (body) {
      body.classList.remove('market-mode');
      if (!insightsWasClosed) body.classList.remove('insights-closed');
    }
    closeChat();
    closeCheckout();
    closeBookSession();
    showView('board');
  }

  function isOpen() { return active; }

  function bookmarkEpic(epicId) {
    const e = Data().hydrateEpic(Data().epicOf(epicId));
    if (!e || !Pathways()) return;
    const step = {
      id: 'epic:' + epicId,
      type: 'epic',
      ref: epicId,
      label: e.title,
      category: e.category || 'lineage',
      sub: e.mentorName
    };
    const existing = Pathways().all().find(p => /epic/i.test(p.title) || p.title === 'Saved epics');
    if (existing) {
      const steps = (existing.steps || []).slice();
      if (!steps.some(x => x.ref === epicId || x.id === step.id)) {
        steps.push(step);
        Pathways().update(existing.id, { steps });
      }
    } else {
      Pathways().create({ title: 'Saved epics', steps: [step] });
    }
    if (!state.bookmarks.includes(epicId)) {
      state.bookmarks.push(epicId);
      save();
    }
    toast('Bookmarked to Pathways.');
  }

  function shareEpic(epicId) {
    const url = location.origin + location.pathname + location.search + '#market/epic/' + epicId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast('Link copied.'), () => toast(url));
    } else {
      toast(url);
    }
  }

  function shareMentor(mentorId) {
    const url = location.origin + location.pathname + location.search + '#market/mentor/' + mentorId;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => toast('Link copied.'), () => toast(url));
    } else {
      toast(url);
    }
  }

  function bind() {
    const root = $('#market-wrap');
    if (!root || root.dataset.bound) return;
    root.dataset.bound = '1';

    root.addEventListener('click', e => {
      const tabBtn = e.target.closest('[data-mkt-tab]');
      if (tabBtn) {
        tab = tabBtn.dataset.mktTab;
        showView('board');
        return;
      }
      const open = e.target.closest('[data-mkt-open]');
      if (open) {
        const [kind, id] = open.dataset.mktOpen.split(':');
        if (kind === 'mentor') showMentor(id);
        else showEpicOverview(id);
        return;
      }
      const learn = e.target.closest('[data-mkt-learn]');
      if (learn) {
        focusId = learn.dataset.mktLearn;
        focusKind = 'epic';
        learnQuestId = null;
        ensureEnrollment(focusId);
        showView('learn');
        return;
      }
      const co = e.target.closest('[data-mkt-checkout]');
      if (co) { openCheckout(co.dataset.mktCheckout); return; }
      const book = e.target.closest('[data-mkt-book]');
      if (book) { openBookSession(book.dataset.mktBook); return; }
      if (e.target.closest('[data-mkt-back-board]')) { showView('board'); return; }
      if (e.target.closest('[data-mkt-back-overview]')) {
        if (focusKind === 'mentor') showView('mentor');
        else { showView('overview'); renderOverview(); }
        return;
      }
      if (e.target.closest('[data-mkt-back-mentor]')) {
        const e0 = Data().epicOf(focusId);
        if (e0) showMentor(e0.mentorId);
        else showView('board');
        return;
      }
      const questBtn = e.target.closest('[data-mkt-quest]');
      if (questBtn) {
        const file = $('#mkt-quest-file');
        const noteSel = $('#mkt-quest-note');
        const en = enrollment(focusId);
        if (en && learnQuestId && noteSel && !noteSel.disabled) {
          const noteId = noteSel.value || null;
          const note = noteId && window.PalinodeStore && PalinodeStore.Notes
            ? PalinodeStore.Notes.get(noteId)
            : null;
          en.quests[learnQuestId] = Object.assign({}, en.quests[learnQuestId] || {}, {
            noteId,
            noteTitle: note ? (note.title || 'Untitled') : '',
            notes: note ? (note.title || 'Untitled') : '',
            fileName: (file && file.value) || '',
            updated: Date.now()
          });
          save();
          if (window.PalinodeQuests && noteId) {
            PalinodeQuests.selectNote(learnQuestId, noteId);
          }
        }
        learnQuestId = questBtn.dataset.mktQuest;
        renderLearn();
        return;
      }
      if (e.target.closest('[data-mkt-submit-quest]')) { submitQuest(); return; }
      if (e.target.closest('[data-mkt-simulate-review]')) { simulateReview(); return; }
      if (e.target.closest('[data-mkt-complete-epic]')) { completeEpic(); return; }
      const chat = e.target.closest('[data-mkt-chat]');
      if (chat) { openChat(chat.dataset.mktChat); return; }
      const chatM = e.target.closest('[data-mkt-chat-mentor]');
      if (chatM) {
        const mentorId = chatM.dataset.mktChatMentor;
        const epics = Data().epicsForMentor(mentorId) || [];
        const enrolled = epics.find(ep => isEnrolled(ep.id));
        if (enrolled) openChat(enrolled.id);
        else if (bookingsForMentor(mentorId).length) openMentorChat(mentorId);
        else toast('Book a session or sign up for an epic to chat.');
        return;
      }
      const disc = e.target.closest('[data-mkt-discuss]');
      if (disc) {
        const [kind, id] = disc.dataset.mktDiscuss.split(':');
        if (kind === 'epic' && isEnrolled(id)) openChat(id, 'I want to discuss this epic before the next quest.');
        else if (kind === 'epic') { openCheckout(id); toast('Sign up to chat with the mentor.'); }
        else if (kind === 'mentor') toast('Book a session or open one of their epics to discuss.');
        return;
      }
      const dl = e.target.closest('[data-mkt-discuss-quest]');
      if (dl) {
        const epic = Data().hydrateEpic(Data().epicOf(focusId));
        const questObj = epic && (epic.quests || []).find(q => q.id === dl.dataset.mktDiscussQuest);
        openChat(focusId, questObj ? ('Re: ' + questObj.title + ' — ') : '');
      }
    });

    const q = $('#mkt-q');
    if (q) q.addEventListener('input', () => {
      query = q.value;
      clearTimeout(renderBoard._t);
      renderBoard._t = setTimeout(renderBoard, 200);
    });
    ['mkt-filter-lang', 'mkt-filter-price', 'mkt-filter-tag'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('change', () => {
        if (id.endsWith('lang')) filterLang = el.value;
        if (id.endsWith('price')) filterPrice = el.value;
        if (id.endsWith('tag')) filterTag = el.value;
        renderBoard();
      });
    });

    const form = document.getElementById('mkt-checkout-form');
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      completeCheckout();
    });
    const pay = $('#mkt-pay');
    if (pay) pay.addEventListener('click', e => {
      e.preventDefault();
      completeCheckout();
    });
    const cancelPay = $('#mkt-checkout-cancel');
    if (cancelPay) cancelPay.addEventListener('click', closeCheckout);
    const scrim = $('#mkt-checkout-scrim');
    if (scrim) scrim.addEventListener('click', e => {
      if (e.target === scrim) closeCheckout();
    });

    const bookForm = document.getElementById('mkt-book-form');
    if (bookForm) bookForm.addEventListener('submit', e => {
      e.preventDefault();
      completeBookSession();
    });
    const bookPay = $('#mkt-book-pay');
    if (bookPay) bookPay.addEventListener('click', e => {
      e.preventDefault();
      completeBookSession();
    });
    const bookCancel = $('#mkt-book-cancel');
    if (bookCancel) bookCancel.addEventListener('click', closeBookSession);
    const bookScrim = $('#mkt-book-scrim');
    if (bookScrim) bookScrim.addEventListener('click', e => {
      if (e.target === bookScrim) closeBookSession();
    });

    const chatClose = $('#mkt-chat-close');
    if (chatClose) chatClose.addEventListener('click', closeChat);
    const chatSend = $('#mkt-chat-send');
    if (chatSend) chatSend.addEventListener('click', sendChat);
    const chatInput = $('#mkt-chat-input');
    if (chatInput) chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
    });

    document.addEventListener('change', e => {
      const sel = e.target.closest('#mkt-quest-note');
      if (!sel || !focusId || !learnQuestId) return;
      const en = enrollment(focusId);
      if (!en) return;
      const noteId = sel.value || null;
      const note = noteId && window.PalinodeStore && PalinodeStore.Notes
        ? PalinodeStore.Notes.get(noteId)
        : null;
      const cur = en.quests[learnQuestId] || { status: 'Draft', fileName: '' };
      cur.noteId = noteId;
      cur.noteTitle = note ? (note.title || 'Untitled') : '';
      cur.notes = cur.noteTitle;
      cur.updated = Date.now();
      en.quests[learnQuestId] = cur;
      save();
      if (window.PalinodeQuests) {
        if (noteId) PalinodeQuests.selectNote(learnQuestId, noteId);
        else PalinodeQuests.clearSelectedNote(learnQuestId);
      }
      renderLearn();
    });
  }

  function epicsForGraph(q, limit) {
    let list = Data().allEpics();
    const needle = String(q || '').trim().toLowerCase();
    if (needle) {
      list = list.filter(e =>
        [e.title, e.description, e.mentorName, ...(e.tags || [])].join(' ').toLowerCase().includes(needle));
    }
    const lim = typeof limit === 'number' ? limit : (needle ? 12 : 4);
    return list.slice(0, lim);
  }

  function mentorsForGraph(q) {
    let list = Data().allMentors();
    const needle = String(q || '').trim().toLowerCase();
    if (needle) {
      list = list.filter(m =>
        [m.name, m.bio, m.education, ...(m.tags || [])].join(' ').toLowerCase().includes(needle));
    }
    return list.slice(0, needle ? 8 : 4);
  }

  function questsForGraph(q, limit) {
    let list = Data().allQuests();
    const needle = String(q || '').trim().toLowerCase();
    if (needle) {
      list = list.filter(quest => {
        const epic = Data().epicOf(quest.epicId);
        const concepts = (quest.conceptIds || []).join(' ');
        return [quest.title, quest.description, epic && epic.title, concepts]
          .filter(Boolean).join(' ').toLowerCase().includes(needle);
      });
    } else {
      // Prefer free quests on the open field, then epic-packaged ones.
      list = list.slice().sort((a, b) => {
        const af = a.access === 'free' ? 0 : 1;
        const bf = b.access === 'free' ? 0 : 1;
        return af - bf;
      });
    }
    const lim = typeof limit === 'number' ? limit : 32;
    return list.slice(0, lim);
  }

  function freeQuestsForGraph() {
    return Data().freeQuests();
  }

  function openQuest(questId) {
    const q = Data().questOf(questId);
    if (!q) return;
    if (!q.epicId || q.access === 'free') {
      if (window.PalinodeQuests) PalinodeQuests.openOverview(questId);
      return;
    }
    const epicId = q.epicId;
    if (isEnrolled(epicId)) {
      focusKind = 'epic';
      focusId = epicId;
      learnQuestId = questId;
      ensureEnrollment(epicId);
      tab = 'mine';
      showView('learn');
      renderLearn();
    } else {
      showEpicOverview(epicId);
      toast('Sign up for the epic to work this quest.');
    }
  }

  window.PalinodeMarketplace = {
    enter,
    leave,
    isOpen,
    openMentor: id => { if (!active) enter({ mentorId: id }); else showMentor(id); },
    openEpic: id => { if (!active) enter({ epicId: id }); else showEpicOverview(id); },
    openQuest: id => { if (!active) enter({ questId: id }); else openQuest(id); },
    shareEpic,
    shareMentor,
    bookmarkEpic,
    epicsForGraph,
    mentorsForGraph,
    questsForGraph,
    freeQuestsForGraph,
    isEnrolled,
    enrolledEpics() {
      return Object.keys(state.enrollments)
        .map(id => Data().hydrateEpic(Data().epicOf(id)))
        .filter(Boolean);
    },
    bookmarks() { return (state.bookmarks || []).slice(); },
    syncQuestSubmission,
    hydrateEpic: id => Data().hydrateEpic(Data().epicOf(id)),
    hydrateMentor: id => Data().hydrateMentor(Data().mentorOf(id)),
    hydrateQuest: id => Data().hydrateQuest(Data().questOf(id)),
    onChrome: null,
    bind
  };

  document.addEventListener('DOMContentLoaded', bind);
  if (document.readyState !== 'loading') bind();
})();
