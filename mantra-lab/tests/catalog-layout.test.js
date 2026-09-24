import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('published app aligns avatar, player, values and action', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /grid-template-columns:auto minmax\(0,1fr\) auto auto/);
  assert.match(html, /@media\(max-width:700px\)[\s\S]*grid-template-columns:auto minmax\(0,1fr\) auto/);
  assert.match(html, /\.catalog-add\{width:auto!important/);
});

test('published app shows the FG Mantra logo', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /assets\/fg-mantra-logo\.svg/);
  assert.match(html, /<title>FG Mantra<\/title>/);
});

test('rosa keeps budget controls', async () => {
  const js = await readFile(new URL('../src/app/main.js', import.meta.url), 'utf8');
  assert.match(js, /id="budget-form"/);
  assert.match(js, /Budget iniziale/);
  assert.match(js, /Crediti spesi \(facoltativi\)/);
});
