import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadPlayerCatalog, reconcileOfficialRoles } from '../src/data/playerCatalog.js';

const catalog = JSON.parse(await readFile(new URL('../src/data/generated/official-mantra-2026-27.json', import.meta.url), 'utf8'));

test('official 2026/27 catalog includes 535 unique players with valid roles and Mantra values', () => {
  assert.equal(catalog.players.length, 535);
  assert.equal(new Set(catalog.players.map(p => p.catalogId)).size, 535);
  assert.deepEqual(catalog.players.find(p => p.name === 'Svilar').roles, ['P']);
  const dimarco = catalog.players.find(p => p.name === 'Dimarco');
  assert.deepEqual([dimarco.club, dimarco.roles, dimarco.quotation, dimarco.fvm], ['Inter', ['E','W'], 28, 210]);
});

test('catalog loader reads the bundled official source without remote role requests', async () => {
  const calls=[];
  const result=await loadPlayerCatalog(async (url) => {
    calls.push(url);
    return {ok:true,json:async()=>catalog};
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0], /official-mantra-2026-27\.json/);
  assert.equal(result.players.length, 535);
});

test('official roles update matched players without mutating saved squad or prices', () => {
  const saved=[{id:'existing',name:'Dimarco',club:'Inter',roles:['Ds','E'],active:true,purchasePrice:67,note:'keeper'},
    {id:'custom',name:'Persona mia',club:'Altro',roles:['C'],active:true,purchasePrice:3}];
  const before=JSON.stringify(saved);
  const updated=reconcileOfficialRoles(saved,catalog.players);
  assert.equal(JSON.stringify(saved),before);
  assert.deepEqual(updated[0],{...saved[0],roles:['E','W']});
  assert.deepEqual(updated[1],saved[1]);
});
