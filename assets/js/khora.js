/* ============================================================
   Palinode — Khora public API client + adapters

   Only the public endpoints listed in PUBLIC_API.md.
   User/auth/quest/cognitive-profile stay mock elsewhere.
   Display-only fields the API does not return (turn, year,
   start, counter, rights, tradition) may be overlaid from the
   local corpus — never from an invented endpoint.
   ============================================================ */

(function (global) {
  const BASE = 'https://api.khora.dev';
  const HEADERS = {
    'Content-Type': 'application/json',
    'X-Khora-Instance-ID': 'default'
  };

  /**
   * @typedef {Object} KhoraEntity
   * @property {string} id
   * @property {string} [title]
   * @property {string} [entity_type]  Node | Item
   * @property {string} [node_type]
   * @property {string} [gem_type]
   * @property {string} [explain]
   * @property {string} [author]
   * @property {string} [summary]
   * @property {string} [short_summary]
   * @property {string} [url]
   */

  /**
   * @typedef {Object} KhoraExplain
   * @property {string} title
   * @property {string} explanation
   * @property {{ title?: string, author?: string, url?: string, id?: string }[]} [items]
   */

  /**
   * @typedef {Object} KhoraSummary
   * @property {string} id
   * @property {string} [summary]
   * @property {string} [short_summary]
   */

  /**
   * @typedef {Object} KhoraIntro
   * @property {KhoraEntity[]} nodes
   * @property {object[]} links
   */

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const NODE_TYPE_CATEGORY = {
    PERSON: 'lineage',
    INSTITUTION: 'lineage',
    IDEA: 'resonance',
    DEFINITION_IDEA: 'clarity',
    COMPLEX_IDEA: 'clarity',
    COMPOSITE_IDEA: 'clarity',
    CONTEXTUAL_IDEA: 'stance'
  };

  const NODE_TYPES = [
    'IDEA', 'COMPLEX_IDEA', 'COMPOSITE_IDEA', 'CONTEXTUAL_IDEA',
    'DEFINITION_IDEA', 'PERSON', 'INSTITUTION'
  ];

  const concepts = {};
  const works = {};
  const slugToLive = {};
  const expandCache = {};

  let fetchImpl = typeof fetch === 'function' ? fetch.bind(global) : null;

  function useFetch(fn) { fetchImpl = fn; }

  function isUuid(id) {
    return typeof id === 'string' && UUID_RE.test(id);
  }

  function entityKind(entity) {
    if (!entity) return null;
    const t = entity.entity_type || entity.type || entity.kind;
    if (t === 'Item' || t === 'item' || t === 'work') return 'work';
    if (t === 'Node' || t === 'node' || t === 'concept' || t === 'Gem') return 'concept';
    if (entity.author || entity.summary || entity.short_summary || entity.url) return 'work';
    return 'concept';
  }

  function categoryFromNodeType(nodeType) {
    return NODE_TYPE_CATEGORY[nodeType] || 'resonance';
  }

  function deriveTurn(text) {
    const raw = String(text || '').trim();
    if (!raw) return 'What follows from this?';
    const sentence = raw.split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/, '');
    if (!sentence) return 'What follows from this?';
    if (/\?$/.test(sentence)) return sentence + '?';
    return 'If this is right, what would you have to take seriously?';
  }

  function nodeTypeOf(entity) {
    return entity.node_type || entity.gem_type || '';
  }

  function toConcept(entity, overlay) {
    const extra = overlay || {};
    const title = entity.title || extra.label || extra.title || '';
    const reading = extra.reading || entity.explain || entity.explanation || extra.explain || '';
    return {
      id: entity.id,
      label: title,
      title: title,
      tradition: extra.tradition || '',
      category: extra.category || categoryFromNodeType(nodeTypeOf(entity)),
      node_type: nodeTypeOf(entity),
      reading: reading,
      turn: extra.turn || deriveTurn(reading),
      sources: extra.sources || [],
      kin: extra.kin || [],
      entity_type: 'Node',
      live: true
    };
  }

  function toWork(entity, overlay) {
    const extra = overlay || {};
    return {
      id: entity.id,
      title: entity.title || extra.title || '',
      author: entity.author || extra.author || '',
      year: extra.year || '',
      tradition: extra.tradition || '',
      rights: extra.rights || '',
      gist: extra.gist || entity.summary || entity.short_summary || extra.summary || '',
      short_summary: entity.short_summary || extra.short_summary || '',
      start: extra.start || '',
      counter: extra.counter || '',
      url: entity.url || extra.url || '',
      raisedBy: extra.raisedBy || [],
      sections: extra.sections || [],
      citations: extra.citations || entity.citations || [],
      entity_type: 'Item',
      live: true
    };
  }

  function toGraphSeed(entity, overlay) {
    const kind = entityKind(entity);
    if (kind === 'work') {
      const w = toWork(entity, overlay);
      return {
        id: 'w:' + w.id,
        type: 'work',
        ref: w.id,
        label: w.title,
        category: 'lineage',
        sub: w.author
      };
    }
    const c = toConcept(entity, overlay);
    return {
      id: 'c:' + c.id,
      type: 'concept',
      ref: c.id,
      label: c.label,
      category: c.category,
      sub: c.node_type
    };
  }

  function remember(entity, overlay) {
    if (!entity || !entity.id) return null;
    if (entity.live && entity.entity_type === 'Item') {
      works[entity.id] = Object.assign({}, works[entity.id] || {}, entity, overlay || {});
      return works[entity.id];
    }
    if (entity.live && entity.entity_type === 'Node') {
      concepts[entity.id] = Object.assign({}, concepts[entity.id] || {}, entity, overlay || {});
      return concepts[entity.id];
    }
    if (entityKind(entity) === 'work' || (overlay && overlay.entity_type === 'Item')) {
      const w = toWork(entity, overlay);
      works[w.id] = Object.assign({}, works[w.id] || {}, w);
      return works[w.id];
    }
    const c = toConcept(entity, overlay);
    concepts[c.id] = Object.assign({}, concepts[c.id] || {}, c);
    return concepts[c.id];
  }

  function getConcept(id) { return concepts[id] || null; }
  function getWork(id) { return works[id] || null; }

  function mapSlug(slug, uuid) {
    if (slug && uuid) slugToLive[slug] = uuid;
  }
  function liveIdFor(slug) { return slugToLive[slug] || null; }

  function rememberExpand(id, entities) {
    expandCache[id] = (entities || []).filter(Boolean);
    (entities || []).forEach(e => remember(overlayFromLocal(e) || e));
  }
  function neighborsOf(id) { return expandCache[id] || []; }

  function applyExplain(id, payload) {
    const current = concepts[id] || { id: id, title: payload && payload.title };
    const merged = toConcept({
      id: id,
      title: (payload && payload.title) || current.title || current.label,
      entity_type: 'Node',
      node_type: current.node_type,
      explain: payload && payload.explanation
    }, {
      category: current.category,
      tradition: current.tradition,
      turn: current.turn && current.turn !== deriveTurn(current.reading) ? current.turn : null,
      kin: current.kin
    });
    merged.sources = ((payload && payload.items) || []).map(it => ({
      work: it.title || '',
      author: it.author || '',
      note: '',
      url: it.url || '',
      id: it.id || undefined
    }));
    if (!merged.turn) merged.turn = deriveTurn(merged.reading);
    concepts[id] = merged;
    return merged;
  }

  function applySummary(id, payload) {
    const current = works[id] || { id: id };
    const next = toWork({
      id: id,
      title: current.title,
      author: current.author,
      url: current.url,
      summary: payload && payload.summary,
      short_summary: payload && payload.short_summary,
      entity_type: 'Item'
    }, {
      year: current.year,
      tradition: current.tradition,
      rights: current.rights,
      start: current.start,
      counter: current.counter,
      raisedBy: current.raisedBy,
      sections: current.sections,
      citations: current.citations,
      gist: (payload && (payload.summary || payload.short_summary)) || current.gist
    });
    works[id] = next;
    return next;
  }

  function normalizeLink(link) {
    if (!link) return null;
    const a = link.source || link.id1 || link.a || link.from
      || link.entity_id_linked1 || (link.nodes && link.nodes[0]);
    const b = link.target || link.id2 || link.b || link.to
      || link.entity_id_linked2 || (link.nodes && link.nodes[1]);
    if (!a || !b) return null;
    return {
      a: String(a),
      b: String(b),
      kind: link.comment || link.kind || link.type || link.link_type || 'kin'
    };
  }

  function flattenCitations(rec) {
    if (!rec) return [];
    if (Array.isArray(rec)) return rec;
    const inbound = Array.isArray(rec.inbound) ? rec.inbound : [];
    const outbound = Array.isArray(rec.outbound) ? rec.outbound : [];
    return inbound.concat(outbound);
  }

  function localConceptOverlay(title) {
    const corpus = global.PalinodeCorpus;
    if (!corpus || !corpus.CONCEPTS) return null;
    const needle = String(title || '').trim().toLowerCase();
    if (!needle) return null;
    return corpus.CONCEPTS.find(c =>
      (c.label || '').toLowerCase() === needle || (c.id || '').toLowerCase() === needle
    ) || null;
  }

  function localWorkOverlay(title, author) {
    const lib = global.PalinodeLibrary;
    if (!lib || !lib.works) return null;
    const needle = String(title || '').trim().toLowerCase();
    if (!needle) return null;
    const worksList = Object.keys(lib.works).map(k => lib.works[k]);
    const authorN = String(author || '').trim().toLowerCase();
    return worksList.find(w => {
      if ((w.title || '').toLowerCase() !== needle) return false;
      if (!authorN) return true;
      return String(w.author || '').toLowerCase().indexOf(authorN) !== -1
        || authorN.indexOf(String(w.author || '').toLowerCase()) !== -1;
    }) || worksList.find(w => (w.title || '').toLowerCase() === needle) || null;
  }

  function overlayFromLocal(entity) {
    if (!entity) return null;
    if (entityKind(entity) === 'work') {
      const local = localWorkOverlay(entity.title, entity.author);
      if (!local) return toWork(entity);
      return toWork(entity, {
        year: local.year,
        tradition: local.tradition,
        rights: local.rights,
        start: local.start,
        counter: local.counter,
        gist: entity.summary || entity.short_summary || local.gist
      });
    }
    const local = localConceptOverlay(entity.title);
    if (!local) return toConcept(entity);
    return toConcept(entity, {
      turn: local.turn,
      tradition: local.tradition,
      reading: entity.explain || local.reading
    });
  }

  /* ---------- HTTP ---------- */

  class KhoraError extends Error {
    constructor(message, status, body) {
      super(message);
      this.name = 'KhoraError';
      this.status = status || 0;
      this.body = body;
    }
  }

  function qs(params) {
    const parts = [];
    Object.keys(params || {}).forEach(k => {
      if (params[k] === undefined || params[k] === null || params[k] === '') return;
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(params[k]));
    });
    return parts.length ? '?' + parts.join('&') : '';
  }

  async function request(method, path, opts) {
    const options = opts || {};
    if (!fetchImpl) throw new KhoraError('fetch is not available', 0);
    const url = BASE + path + qs(options.query);
    const init = {
      method: method,
      headers: HEADERS
    };
    if (options.body !== undefined) init.body = JSON.stringify(options.body);
    let res;
    try {
      res = await fetchImpl(url, init);
    } catch (err) {
      throw new KhoraError((err && err.message) || 'Network error', 0);
    }
    const text = await res.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); }
      catch (e) { data = text; }
    }
    if (!res.ok) {
      const msg = (data && data.error) || res.statusText || ('HTTP ' + res.status);
      throw new KhoraError(msg, res.status, data);
    }
    return data;
  }

  async function search(query, types, searchMode) {
    const body = { query: query, types: types || ['Node'] };
    if (searchMode) body.search_mode = searchMode;
    const hits = await request('POST', '/search', { body: body });
    const list = Array.isArray(hits) ? hits : [];
    list.forEach(h => remember(overlayFromLocal(h) || h));
    return list;
  }

  async function entity(opts) {
    const rec = await request('GET', '/entity', { query: { id: opts && opts.id, title: opts && opts.title } });
    if (rec) remember(overlayFromLocal(rec) || rec);
    return rec;
  }

  async function expand(id, types, filter) {
    const body = { id: id, types: types || ['Node'], filter: filter !== false };
    const hits = await request('POST', '/expand', { body: body });
    const list = Array.isArray(hits) ? hits : [];
    rememberExpand(id, list);
    return list;
  }

  async function explain(id, question) {
    const body = { id: id };
    if (question) body.question = question;
    const rec = await request('POST', '/explain', { body: body });
    if (rec) applyExplain(id, rec);
    return rec;
  }

  async function intro(number) {
    const rec = await request('GET', '/intro', { query: { number: number || 5 } });
    const nodes = (rec && rec.nodes) || [];
    const links = ((rec && rec.links) || []).map(normalizeLink).filter(Boolean);
    nodes.forEach(n => remember(overlayFromLocal(n) || n));
    return { nodes: nodes, links: links };
  }

  async function random() {
    const hits = await request('GET', '/random');
    const list = Array.isArray(hits) ? hits : [];
    list.forEach(n => remember(overlayFromLocal(n) || n));
    return list;
  }

  async function linkAll(ids) {
    const hits = await request('POST', '/link_all', { body: { ids: ids } });
    return (Array.isArray(hits) ? hits : []).map(normalizeLink).filter(Boolean);
  }

  async function summary(id) {
    const rec = await request('GET', '/summary', { query: { id: id } });
    if (rec) applySummary(id, rec);
    return rec;
  }

  async function citations(id) {
    const rec = await request('GET', '/citations', { query: { id: id } });
    const list = flattenCitations(rec);
    if (works[id]) works[id].citations = list;
    return list;
  }

  async function loadWork(id) {
    const rec = await entity({ id: id });
    const work = overlayFromLocal(rec);
    remember(work);
    try {
      const s = await summary(id);
      applySummary(id, s);
    } catch (e) { /* summary is optional */ }
    try {
      const cites = await citations(id);
      if (works[id]) works[id].citations = cites;
    } catch (e) { /* citations are Item-only */ }
    return works[id] || work;
  }

  async function resolveByTitle(title, types) {
    const hits = await search(title, types || ['Node']);
    if (!hits.length) return null;
    const needle = String(title || '').trim().toLowerCase();
    if (!needle) return null;
    const exact = hits.find(h => String(h.title || '').toLowerCase() === needle);
    if (exact) {
      remember(overlayFromLocal(exact) || exact);
      return exact;
    }
    const close = hits.find(h => {
      const t = String(h.title || '').toLowerCase();
      return t.startsWith(needle + ' ') || t.startsWith(needle + ':') || t.startsWith(needle + ',');
    });
    if (close) {
      remember(overlayFromLocal(close) || close);
      return close;
    }
    return null;
  }

  const api = {
    BASE: BASE,
    HEADERS: HEADERS,
    NODE_TYPES: NODE_TYPES,
    Error: KhoraError,
    useFetch: useFetch,
    isUuid: isUuid,
    entityKind: entityKind,
    categoryFromNodeType: categoryFromNodeType,
    deriveTurn: deriveTurn,
    toConcept: toConcept,
    toWork: toWork,
    toGraphSeed: toGraphSeed,
    remember: remember,
    getConcept: getConcept,
    getWork: getWork,
    mapSlug: mapSlug,
    liveIdFor: liveIdFor,
    rememberExpand: rememberExpand,
    neighborsOf: neighborsOf,
    applyExplain: applyExplain,
    applySummary: applySummary,
    normalizeLink: normalizeLink,
    flattenCitations: flattenCitations,
    overlayFromLocal: overlayFromLocal,
    localConceptOverlay: localConceptOverlay,
    localWorkOverlay: localWorkOverlay,
    request: request,
    search: search,
    entity: entity,
    expand: expand,
    explain: explain,
    intro: intro,
    random: random,
    linkAll: linkAll,
    summary: summary,
    citations: citations,
    loadWork: loadWork,
    resolveByTitle: resolveByTitle
  };

  global.PalinodeKhora = api;
})(typeof window !== 'undefined' ? window : globalThis);
