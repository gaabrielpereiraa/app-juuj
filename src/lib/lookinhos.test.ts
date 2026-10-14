// Check mínimo: npx tsx src/lib/lookinhos.test.ts
import assert from 'node:assert/strict';
import { outfitZones, parseStylist } from './lookinhos';

const full = `Que delícia! Jantar italiano pede algo elegante.
Separei dois caminhos.

## Romântica clássica
[[c9d0, d4e8, e2a6]]
O tube top com a saia
dá movimento.
## Elegante relaxada
[[a1f3]]
Fresquinho.`;

const blocks = parseStylist(full);
assert.deepEqual(blocks[0], { type: 'text', text: 'Que delícia! Jantar italiano pede algo elegante.' });
assert.equal(blocks.length, 4);
assert.deepEqual(blocks[2], { type: 'look', title: 'Romântica clássica', ids: ['c9d0', 'd4e8', 'e2a6'], why: 'O tube top com a saia dá movimento.' });
assert.deepEqual(blocks[3], { type: 'look', title: 'Elegante relaxada', ids: ['a1f3'], why: 'Fresquinho.' });

// streaming: linha de ids incompleta não vira texto nem ids
const partial = parseStylist('Oi!\n## Look\n[[c9d0, d4');
assert.deepEqual(partial[1], { type: 'look', title: 'Look', ids: [], why: '' });

const z = outfitZones([
  { id: 's', category: 'calcados' as const },
  { id: 'b', category: 'blusas' as const },
  { id: 'c', category: 'casacos' as const },
  { id: 'v', category: 'vestidos' as const },
  { id: 'x', category: null },
]);
assert.deepEqual(z.top.map((i) => i.id), ['c', 'b', 'x']);
assert.deepEqual(z.full.map((i) => i.id), ['v']);
assert.deepEqual(z.feet.map((i) => i.id), ['s']);

console.log('ok');
