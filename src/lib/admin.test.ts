// Check mínimo do validateFields: npx tsx src/lib/admin.test.ts
// (ou: node --experimental-strip-types src/lib/admin.test.ts no Node 22+)
import assert from 'node:assert/strict';
import { Field, tryUnlock, validateFields } from './admin';

const fields: Field[] = [
  { key: 'title', label: 'Título', type: 'text', required: true },
  { key: 'description', label: 'Descrição', type: 'text' },
  { key: 'points_cost', label: 'Custo', type: 'number', required: true },
  { key: 'is_available', label: 'Disponível', type: 'switch' },
];

// caminho felizA
let r = validateFields(fields, {
  title: '  Cinema  ',
  description: '',
  points_cost: '12',
  is_available: true,
});
assert.deepEqual(r.errors, {});
assert.equal(r.values.title, 'Cinema');
assert.equal(r.values.description, null); // opcional vazio -> null (coluna nullable)
assert.equal(r.values.points_cost, 12);
assert.equal(r.values.is_available, true);

// obrigatório vazio
r = validateFields(fields, { title: '   ', points_cost: '5' });
assert.equal(r.errors.title, 'Obrigatório');

// número inválido
r = validateFields(fields, { title: 'X', points_cost: 'abc' });
assert.equal(r.errors.points_cost, 'Precisa ser um número');

// negativo
r = validateFields(fields, { title: 'X', points_cost: '-3' });
assert.equal(r.errors.points_cost, 'Não pode ser negativo');

// vírgula decimal (teclado pt-BR)
r = validateFields(fields, { title: 'X', points_cost: '1,5' });
assert.deepEqual(r.errors, {});
assert.equal(r.values.points_cost, 1.5);

// número obrigatório ausente é erro, não 0 silencioso
r = validateFields(fields, { title: 'X' });
assert.equal(r.errors.points_cost, 'Obrigatório');

// senha
assert.equal(tryUnlock('errada'), false);
assert.equal(tryUnlock(' juujlindabundao '), true);

console.log('ok');
