import test from 'node:test';
import assert from 'node:assert/strict';
import { NAV_ITEMS } from '../src/app/navigation.js';
import { readFile } from 'node:fs/promises';

test('shell exposes the primary sections in order', () => {
  assert.deepEqual(NAV_ITEMS.map(item => item.label), ['Giornata', 'Formazione', 'Rosa', 'Simulatore', 'Asta']);
});

test('navigation exposes a separate auction simulator', async () => {
  const js=await readFile('src/app/navigation.js','utf8');
  assert.match(js,/id:\s*'simulatore'/);
  assert.match(js,/label:\s*'Simulatore'/);
});

test('formation and simulator expose player removal actions', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js,/Elimina dalla rosa/);
  assert.match(js,/Elimina dalla simulazione/);
});


test('mobile navigation keeps all five primary sections on one row', async () => {
  const css=await readFile('src/styles/app.css','utf8');
  assert.match(css,/grid-template-columns:\s*repeat\(5,/);
});

test('auction simulation makes automatic formation saving explicit', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js,/Salvataggio automatico/i);
});

test('rosa espone budget iniziale e riepilogo crediti', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js, /id="budget-form"/);
  assert.match(js, /Budget iniziale/);
  assert.match(js, /Crediti residui/);
  assert.match(js, /Crediti spesi/);
});

test('asta mostra il budget reale residuo', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js, /BUDGET ASTA/);
  assert.match(js, /Disponibili/);
});

test('player profile panel is wired from rosa and catalog', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js,/data-player-profile/);
  assert.match(js,/openPlayerPanel/);
});

test('catalog add offers optional purchase price', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js,/catalog-add-form/);
  assert.match(js,/Crediti spesi \(facoltativi\)/);
});


test('catalog with avatars keeps player, values and add button aligned', async () => {
  const js=await readFile('src/app/main.js','utf8');
  assert.match(js,/\.catalog-player\{display:grid;grid-template-columns:auto minmax\(0,1fr\) auto auto/);
  assert.match(js,/@media\(max-width:700px\)[\s\S]*?\.catalog-player\{grid-template-columns:auto minmax\(0,1fr\) auto\}/);
});
