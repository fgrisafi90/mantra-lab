import test from 'node:test';
import assert from 'node:assert/strict';
import { loadSimulations, saveSimulations, createSimulation, duplicateSimulation } from '../src/storage/simulationStorage.js';

function memoryStorage() {
  const map = new Map();
  return { getItem: k => map.has(k) ? map.get(k) : null, setItem: (k,v) => map.set(k,String(v)) };
}

const player = { id:'1', name:'Pulisic', club:'Milan', roles:['T','A'], active:true, purchasePrice:40 };

test('creates a separate empty auction simulation', () => {
  const sim = createSimulation('Prova A');
  assert.equal(sim.name, 'Prova A');
  assert.deepEqual(sim.players, []);
  assert.equal(sim.formationId, '3-4-1-2');
  assert.deepEqual(sim.lineup, {});
});

test('saves and loads auction simulations without touching real squad storage', () => {
  const storage = memoryStorage();
  const sim = { ...createSimulation('Prova A'), players:[player] };
  saveSimulations([sim], storage);
  const loaded = loadSimulations(storage);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].players[0].name, 'Pulisic');
});

test('duplicates a simulation with a new id and copied players/lineup', () => {
  const original = { ...createSimulation('Prova A'), players:[player], lineup:{a1:'1'} };
  const copy = duplicateSimulation(original, 'Prova B');
  assert.notEqual(copy.id, original.id);
  assert.equal(copy.name, 'Prova B');
  assert.deepEqual(copy.players, original.players);
  assert.deepEqual(copy.lineup, original.lineup);
  assert.notEqual(copy.players, original.players);
});


test('persists the simulated formation assignments', () => {
  const storage = memoryStorage();
  const sim = { ...createSimulation('Modulo salvato'), players:[player], formationId:'4-3-3', lineup:{apc:'1'} };
  saveSimulations([sim], storage);
  const [loaded] = loadSimulations(storage);
  assert.equal(loaded.formationId, '4-3-3');
  assert.deepEqual(loaded.lineup, {apc:'1'});
});
