import test from 'node:test';
import assert from 'node:assert/strict';
import { canPlaySlot, assignPlayer } from '../src/domain/compatibility.js';
import { FORMATIONS } from '../src/domain/formations.js';

const pulisic = { id:'p', name:'Pulisic', club:'Milan', roles:['T','A'], active:true };
const lautaro = { id:'l', name:'Lautaro', club:'Inter', roles:['Pc'], active:true };
const dimarco = { id:'d', name:'Dimarco', club:'Inter', roles:['E','W'], active:true };

test('multi-role player can occupy any explicitly accepted role', () => {
  assert.equal(canPlaySlot(pulisic, { acceptedRoles:['T'] }), true);
  assert.equal(canPlaySlot(pulisic, { acceptedRoles:['A','Pc'] }), true);
});

test('incompatible player cannot occupy a slot', () => {
  assert.equal(canPlaySlot(lautaro, { acceptedRoles:['E'] }), false);
  assert.equal(canPlaySlot(dimarco, { acceptedRoles:['Dc'] }), false);
});

test('same player cannot be assigned to two slots', () => {
  const first = assignPlayer({}, 'slot1', pulisic, { acceptedRoles:['T'] });
  assert.throws(() => assignPlayer(first, 'slot2', pulisic, { acceptedRoles:['A'] }), /già schierato/i);
});

test('catalogue contains all 11 official Mantra formations', () => {
  assert.equal(FORMATIONS.length, 11);
  assert.deepEqual(FORMATIONS.map(f => f.id).sort(), ['3-4-1-2','3-4-2-1','3-4-3','3-5-1-1','3-5-2','4-1-4-1','4-2-3-1','4-3-1-2','4-3-3','4-4-1-1','4-4-2'].sort());
  assert.ok(FORMATIONS.every(f => f.slots.length === 11));
});
