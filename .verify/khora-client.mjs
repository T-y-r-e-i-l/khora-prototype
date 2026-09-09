/* Phase 2/3 — public client: headers, paths, and response shapes. */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'assets/js/khora.js'), 'utf8');
const sandbox = { console };
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.runInNewContext(code, sandbox);
const K = sandbox.PalinodeKhora;

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const calls = [];
const replies = {};

function jsonRes(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status: status,
    statusText: status === 200 ? 'OK' : 'Error',
    text: async () => JSON.stringify(body)
  };
}

K.useFetch(async (url, init) => {
  calls.push({ url: url, method: init.method, headers: init.headers, body: init.body });
  const key = init.method + ' ' + url.replace(K.BASE, '');
  if (!replies[key]) return jsonRes(404, { error: 'unmocked ' + key });
  return jsonRes(200, replies[key]);
});

const NODE = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Dialectic',
  entity_type: 'Node',
  node_type: 'IDEA'
};
const ITEM = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Phenomenology of Spirit',
  entity_type: 'Item',
  author: 'G.W.F. Hegel',
  summary: 'Spirit comes to know itself.',
  url: 'https://example.org/hegel'
};

replies['POST /search'] = [NODE, ITEM];
replies['GET /entity?id=' + NODE.id] = NODE;
replies['POST /expand'] = [ITEM];
replies['POST /explain'] = {
  title: 'Dialectic',
  explanation: 'Opposed claims that produce a richer shape of knowing.',
  items: [{ title: ITEM.title, author: ITEM.author, url: ITEM.url }]
};
replies['GET /intro?number=5'] = {
  nodes: [NODE],
  links: [{ entity_id_linked1: NODE.id, entity_id_linked2: ITEM.id, comment: 'related' }]
};
replies['GET /random'] = [NODE];
replies['POST /link_all'] = [{ entity_id_linked1: NODE.id, entity_id_linked2: ITEM.id }];
replies['GET /summary?id=' + ITEM.id] = {
  id: ITEM.id,
  summary: 'A long account of Spirit.',
  short_summary: 'Spirit knows itself.'
};
replies['GET /citations?id=' + ITEM.id] = [{ title: 'Science of Logic', author: 'Hegel' }];

const hits = await K.search('dialectic', ['Node', 'Item']);
check('search POSTs /search', calls[0].method === 'POST' && calls[0].url.endsWith('/search'));
check('every call sends the instance header',
  calls[0].headers['X-Khora-Instance-ID'] === 'default'
  && calls[0].headers['Content-Type'] === 'application/json');
check('search body asks for Node and Item', (() => {
  const body = JSON.parse(calls[0].body);
  return body.query === 'dialectic' && body.types[0] === 'Node' && body.types[1] === 'Item';
})());
check('search returns an array of hits', hits.length === 2 && hits[0].id === NODE.id);

await K.entity({ id: NODE.id });
check('entity GETs /entity?id=', /\/entity\?id=/.test(calls[1].url));

await K.expand(NODE.id, ['Node'], true);
check('expand POSTs /expand with id and types', (() => {
  const body = JSON.parse(calls[2].body);
  return calls[2].url.endsWith('/expand') && body.id === NODE.id && body.filter === true;
})());

await K.explain(NODE.id);
check('explain POSTs /explain', calls[3].url.endsWith('/explain'));
check('explain is cached onto the concept', /Opposed claims/.test(K.getConcept(NODE.id).reading));

const intro = await K.intro(5);
check('intro GETs /intro', /\/intro\?number=5/.test(calls[4].url));
check('intro returns nodes and normalized links',
  intro.nodes.length === 1 && intro.links[0].a === NODE.id);

await K.random();
check('random GETs /random', calls[5].url.endsWith('/random'));

const edges = await K.linkAll([NODE.id, ITEM.id]);
check('link_all POSTs ids', (() => {
  const body = JSON.parse(calls[6].body);
  return calls[6].url.endsWith('/link_all') && body.ids[0] === NODE.id;
})());
check('link_all normalizes edges', edges[0].a === NODE.id && edges[0].b === ITEM.id);

await K.summary(ITEM.id);
check('summary GETs /summary?id=', calls[7].url.indexOf('/summary?id=') !== -1);
check('summary fills gist', K.getWork(ITEM.id).gist === 'A long account of Spirit.');

const cites = await K.citations(ITEM.id);
check('citations GETs /citations?id=', calls[8].url.indexOf('/citations?id=') !== -1);
check('citations returns an array', cites[0].title === 'Science of Logic');

replies['GET /citations?id=' + ITEM.id] = {
  inbound: [{ title: 'The Republic', author: 'Plato' }],
  outbound: []
};
const citesObj = await K.citations(ITEM.id);
check('citations flattens inbound/outbound', citesObj[0].title === 'The Republic');

replies['POST /search'] = [
  { id: ITEM.id, title: 'Unrelated first hit', entity_type: 'Item' },
  { id: NODE.id, title: 'Phenomenology of Perception', entity_type: 'Item' }
];
const miss = await K.resolveByTitle('No Such Book', ['Item']);
check('resolveByTitle does not take a random first hit', miss === null);
replies['POST /search'] = [
  { id: ITEM.id, title: 'Unrelated first hit', entity_type: 'Item' },
  { id: NODE.id, title: 'Phenomenology of Perception', entity_type: 'Item' }
];
const exact = await K.resolveByTitle('Phenomenology of Perception', ['Item']);
check('resolveByTitle prefers an exact title', exact && exact.id === NODE.id);

try {
  await K.request('POST', '/deepen', { body: { id: NODE.id } });
  check('client refuses to call deepen', false);
} catch (e) {
  check('unmocked write endpoints fail closed', /unmocked POST \/deepen/.test(e.message));
}

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
