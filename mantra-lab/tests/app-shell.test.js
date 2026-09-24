import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_ITEMS } from '../src/app/navigation.js';

test('shell exposes the four primary sections in order', () => {
  assert.deepEqual(NAV_ITEMS.map(item => item.label), ['Giornata', 'Formazione', 'Rosa', 'Asta']);
});
