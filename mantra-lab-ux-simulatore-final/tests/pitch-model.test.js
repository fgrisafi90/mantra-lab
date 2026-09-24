import test from 'node:test';
import assert from 'node:assert/strict';
import { eligiblePlayersForSlot, setLineupPlayer } from '../src/domain/pitchModel.js';

const squad = [
  { id:'1', name:'Esterno', club:'A', roles:['E','W'], active:true },
  { id:'2', name:'Punta', club:'B', roles:['Pc'], active:true },
  { id:'3', name:'Inattivo', club:'C', roles:['E'], active:false }
];

test('player picker returns only active compatible unassigned players', () => {
  const result = eligiblePlayersForSlot(squad, { acceptedRoles:['E'] }, { other:'1' });
  assert.deepEqual(result, []);
  assert.deepEqual(eligiblePlayersForSlot(squad, { acceptedRoles:['E'] }, {} ).map(p => p.id), ['1']);
});

test('lineup assignment replaces slot but never duplicates a player', () => {
  const first = setLineupPlayer({}, 'e1', squad[0]);
  assert.deepEqual(first, { e1:'1' });
  assert.throws(() => setLineupPlayer({ e1:'1' }, 'e2', squad[0]), /già schierato/i);
});
