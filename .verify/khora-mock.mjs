/* Shared Khora public-API fixtures for Playwright verify scripts. */

const NODE = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Ressentiment',
  entity_type: 'Node',
  node_type: 'IDEA',
  explain: 'A reactive revaluation of values one cannot enact.'
};
const NODE_B = {
  id: '33333333-3333-4333-8333-333333333333',
  title: 'Dialectic',
  entity_type: 'Node',
  node_type: 'COMPLEX_IDEA',
  explain: 'Opposed claims that produce a richer shape of knowing.'
};
const ITEM = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'On the Genealogy of Morals',
  entity_type: 'Item',
  author: 'Friedrich Nietzsche',
  summary: 'Slave morality as a reactive revaluation.',
  url: 'https://example.org/genealogy'
};

export const FIXTURES = { NODE, NODE_B, ITEM };

export async function mockKhora(page) {
  await page.route('https://api.khora.dev/**', async route => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();
    const json = (body, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(body)
    });

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, X-Khora-Instance-ID',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        }
      });
    }

    if (method === 'GET' && path === '/intro') {
      return json({
        nodes: [NODE, NODE_B],
        links: [{ entity_id_linked1: NODE.id, entity_id_linked2: NODE_B.id, comment: 'related' }]
      });
    }
    if (method === 'GET' && path === '/random') return json([NODE, NODE_B]);
    if (method === 'GET' && path === '/entity') {
      const id = url.searchParams.get('id');
      const rec = [NODE, NODE_B, ITEM].find(e => e.id === id);
      return rec ? json(rec) : json({ error: 'not found' }, 404);
    }
    if (method === 'GET' && path === '/summary') {
      const id = url.searchParams.get('id');
      return json({ id, summary: ITEM.summary, short_summary: 'Reactive morality.' });
    }
    if (method === 'GET' && path === '/citations') {
      return json([{ title: 'Genealogy, First Essay', author: 'Nietzsche' }]);
    }
    if (method === 'POST' && path === '/search') {
      const body = req.postDataJSON() || {};
      const q = String(body.query || '').toLowerCase();
      const pool = [];
      if (!(body.types || []).length || body.types.includes('Node')) pool.push(NODE, NODE_B);
      if ((body.types || []).includes('Item')) pool.push(ITEM);
      const hits = q
        ? pool.filter(e => (e.title || '').toLowerCase().includes(q))
        : pool;
      return json(hits);
    }
    if (method === 'POST' && path === '/expand') {
      const body = req.postDataJSON() || {};
      if (body.id === NODE.id) return json([NODE_B, ITEM]);
      if (body.id === NODE_B.id) return json([NODE]);
      if (body.id === ITEM.id) return json([NODE]);
      return json([]);
    }
    if (method === 'POST' && path === '/explain') {
      const body = req.postDataJSON() || {};
      const rec = [NODE, NODE_B].find(e => e.id === body.id) || NODE;
      return json({
        title: rec.title,
        explanation: rec.explain,
        items: [{ title: ITEM.title, author: ITEM.author, url: ITEM.url }]
      });
    }
    if (method === 'POST' && path === '/link_all') {
      return json([
        { entity_id_linked1: NODE.id, entity_id_linked2: NODE_B.id },
        { entity_id_linked1: NODE.id, entity_id_linked2: ITEM.id }
      ]);
    }

    return json({ error: 'unmocked ' + method + ' ' + path }, 404);
  });
}
