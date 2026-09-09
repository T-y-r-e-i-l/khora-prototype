/* Phase 2 — adapters must match PUBLIC_API.md shapes, not Palinode slugs. */

import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const code = fs.readFileSync(path.join(root, 'assets/js/khora.js'), 'utf8');
const sandbox = { console, fetch: () => Promise.reject(new Error('no network in unit tests')) };
sandbox.globalThis = sandbox;
sandbox.window = sandbox;
vm.runInNewContext(code, sandbox);
const K = sandbox.PalinodeKhora;

let pass = 0, fail = 0;
const check = (name, ok, note) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (note ? ' — ' + note : ''));
  ok ? pass++ : fail++;
};

const NODE = {
  id: '11111111-1111-4111-8111-111111111111',
  title: 'Dialectic',
  entity_type: 'Node',
  node_type: 'IDEA',
  explain: 'A method of arriving at truth through opposed claims.'
};

const ITEM = {
  id: '22222222-2222-4222-8222-222222222222',
  title: 'Phenomenology of Spirit',
  entity_type: 'Item',
  author: 'G.W.F. Hegel',
  summary: 'Consciousness learns what it is by failing at what it takes itself to be.',
  short_summary: 'Spirit coming to know itself.',
  url: 'https://example.org/hegel'
};

check('exposes PalinodeKhora', !!K);
check('treats UUIDs as live ids', K.isUuid(NODE.id) === true);
check('rejects Palinode slugs', K.isUuid('eudaimonia') === false);
check('Node maps to concept', K.entityKind(NODE) === 'concept');
check('Item maps to work', K.entityKind(ITEM) === 'work');
check('IDEA maps onto the resonance lane', K.categoryFromNodeType('IDEA') === 'resonance');
check('PERSON maps onto the lineage lane', K.categoryFromNodeType('PERSON') === 'lineage');

const concept = K.toConcept(NODE);
check('concept.id is the UUID', concept.id === NODE.id);
check('concept.label comes from title', concept.label === 'Dialectic');
check('concept.reading comes from explain', concept.reading === NODE.explain);
check('concept.turn is derived, not invented by an endpoint',
  typeof concept.turn === 'string' && concept.turn.length > 0);
check('derived turn uses the node’s own claim',
  /opposed claims|Dialectic|method of arriving/.test(concept.turn)
    && !/If this is right/.test(concept.turn));
check('two nodes do not share a generic turn',
  K.deriveTurn('Objectification is a way of seeing that empties the other of a world.', 'Objectification')
    !== K.deriveTurn(NODE.explain, NODE.title));
check('a question in the explanation is kept',
  K.deriveTurn('What is left of the person once they are made useful?', 'Objectification')
    === 'What is left of the person once they are made useful?');
check('an overlay turn is kept over a derived one',
  K.toConcept(NODE, { turn: 'Name the instrument you are using someone as.' }).turn
    === 'Name the instrument you are using someone as.');
check('concept stays marked live', concept.live === true);
check('concept does not invent a Palinode slug', concept.id.includes(':') === false);

const work = K.toWork(ITEM);
check('work.id is the UUID', work.id === ITEM.id);
check('work.gist comes from summary', work.gist === ITEM.summary);
check('work.author is preserved', work.author === ITEM.author);
check('work.url is preserved', work.url === ITEM.url);
check('work does not invent a year', !work.year);
check('work does not invent a tradition', !work.tradition);

const overlay = K.toWork(ITEM, {
  year: '1807',
  tradition: 'modern',
  start: 'Lordship and Bondage',
  counter: 'Kierkegaard',
  rights: 'open'
});
check('display-only overlay can fill year', overlay.year === '1807');
check('display-only overlay can fill start', overlay.start === 'Lordship and Bondage');

K.remember(NODE);
K.remember(ITEM);
check('remembered concept is gettable', K.getConcept(NODE.id).label === 'Dialectic');
check('remembered work is gettable', K.getWork(ITEM.id).title === ITEM.title);

const seedN = K.toGraphSeed(NODE);
check('graph seed prefixes concept ids', seedN.id === 'c:' + NODE.id && seedN.type === 'concept' && seedN.ref === NODE.id);
const seedW = K.toGraphSeed(ITEM);
check('graph seed prefixes work ids', seedW.id === 'w:' + ITEM.id && seedW.type === 'work' && seedW.ref === ITEM.id);

const links = [
  K.normalizeLink({ source: NODE.id, target: ITEM.id }),
  K.normalizeLink({ id1: NODE.id, id2: ITEM.id, comment: 'cites' }),
  K.normalizeLink({ a: NODE.id, b: ITEM.id })
];
check('normalizeLink accepts source/target', links[0].a === NODE.id && links[0].b === ITEM.id);
check('normalizeLink accepts id1/id2', links[1].a === NODE.id && links[1].b === ITEM.id);
check('normalizeLink accepts a/b', links[2].a === NODE.id && links[2].b === ITEM.id);
const liveLink = K.normalizeLink({
  entity_id_linked1: NODE.id,
  entity_id_linked2: ITEM.id,
  comment: 'related'
});
check('normalizeLink accepts entity_id_linked1/2', liveLink.a === NODE.id && liveLink.b === ITEM.id);
check('Gem maps to concept', K.entityKind({ id: NODE.id, title: 'Socrates', entity_type: 'Gem' }) === 'concept');
check('flattenCitations keeps arrays', K.flattenCitations([{ title: 'A' }]).length === 1);
check('flattenCitations flattens inbound/outbound',
  K.flattenCitations({ inbound: [{ title: 'In' }], outbound: [{ title: 'Out' }] }).length === 2);

const explained = K.applyExplain(NODE.id, {
  title: 'Dialectic',
  explanation: 'Hegel’s engine: a shape of knowing undoes itself and becomes a richer one.',
  items: [{ title: 'Phenomenology of Spirit', author: 'G.W.F. Hegel', url: 'https://example.org/hegel' }]
});
check('explain fills reading from explanation', /Hegel/.test(explained.reading));
check('explain items become sources without fake ids',
  explained.sources[0].work === 'Phenomenology of Spirit' && !explained.sources[0].id);

check('BASE points at the public host', K.BASE === 'https://api.khora.dev');
check('instance header is default', K.HEADERS['X-Khora-Instance-ID'] === 'default');

console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
