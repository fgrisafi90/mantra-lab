import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSquad, saveSquad } from '../src/storage/squadStorage.js';
import { exportSquad, importSquad } from '../src/storage/transfer.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: k => map.has(k) ? map.get(k) : null, setItem: (k,v) => map.set(k,String(v)) };
}

const sample = [{ id:'1', name:'Pulisic', club:'Milan', roles:['T','A'], active:true, purchasePrice:40 }];

test('saves and loads squad from storage', () => {
  const storage = memoryStorage();
  saveSquad(sample, storage);
  assert.deepEqual(loadSquad(storage), sample);
});

test('exports and imports a valid squad', () => {
  assert.deepEqual(importSquad(exportSquad(sample)), sample);
});

test('rejects corrupted or structurally invalid json', () => {
  assert.throws(() => importSquad('{broken'), /JSON/);
  assert.throws(() => importSquad(JSON.stringify([{name:'Missing id'}])), /non valido/i);
});
