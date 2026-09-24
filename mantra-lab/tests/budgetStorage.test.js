import test from 'node:test';
import assert from 'node:assert/strict';

const budgetModule = await import('../src/storage/squadStorage.js');

function memoryStorage() {
  const map = new Map();
  return { getItem: k => map.has(k) ? map.get(k) : null, setItem: (k,v) => map.set(k,String(v)) };
}

test('espone la gestione del budget manuale', () => {
  assert.equal(typeof budgetModule.loadBudget, 'function');
  assert.equal(typeof budgetModule.saveBudget, 'function');
  assert.equal(typeof budgetModule.summarizeBudget, 'function');
});

test('salva e carica il budget iniziale manuale', () => {
  const storage = memoryStorage();
  budgetModule.saveBudget(500, storage);
  assert.equal(budgetModule.loadBudget(storage), 500);
});

test('restituisce null se il budget non è ancora stato inserito', () => {
  const storage = memoryStorage();
  assert.equal(budgetModule.loadBudget(storage), null);
});

test('calcola spesa e residuo dai prezzi della rosa', () => {
  const players = [{ purchasePrice:120 }, { purchasePrice:45 }, { purchasePrice:'' }, {}];
  assert.deepEqual(budgetModule.summarizeBudget(500, players), { budget:500, spent:165, remaining:335 });
});

test('senza budget mantiene la spesa ma non inventa il residuo', () => {
  assert.deepEqual(budgetModule.summarizeBudget(null, [{purchasePrice:20}]), { budget:null, spent:20, remaining:null });
});
