import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('catalog layout keeps avatar, player, values and action aligned', async () => {
  const js = await readFile(new URL('../src/app/main.js', import.meta.url), 'utf8');
  assert.match(js, /\.catalog-player\{display:grid;grid-template-columns:auto minmax\(0,1fr\) auto auto/);
  assert.match(js, /@media\(max-width:700px\)[\s\S]*?\.catalog-player\{grid-template-columns:auto minmax\(0,1fr\) auto\}/);
});

test('rosa keeps budget controls', async () => {
  const js = await readFile(new URL('../src/app/main.js', import.meta.url), 'utf8');
  assert.match(js, /id="budget-form"/);
  assert.match(js, /Budget iniziale/);
  assert.match(js, /Crediti spesi \(facoltativi\)/);
});
