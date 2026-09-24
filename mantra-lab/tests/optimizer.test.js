import test from 'node:test';
import assert from 'node:assert/strict';
import { optimizeFormations } from '../src/domain/optimizer.js';

const p = (id, roles, score, excluded=false) => ({
  player:{ id, name:id, club:'X', roles, active:true },
  matchday:{ score, positives:[], negatives:[], excluded }
});
const formation = (id, slots) => ({ id, name:id, slots:slots.map((roles,i)=>({id:`s${i}`,label:roles.join('/'),acceptedRoles:roles,x:0,y:0})) });

test('optimizer respects slot compatibility instead of selecting raw top scores', () => {
  const players = [p('top1',['Pc'],99),p('top2',['Pc'],98),p('e',['E'],80),p('m',['M'],70)];
  const result = optimizeFormations(players,[formation('x',[['E'],['M']])]);
  assert.equal(result.length,1);
  assert.deepEqual(Object.values(result[0].assignments).sort(), ['e','m']);
});

test('multi-role player is assigned once to the slot where it maximizes total score', () => {
  const players = [p('multi',['E','M'],90),p('e',['E'],80),p('m',['M'],40)];
  const result = optimizeFormations(players,[formation('x',[['E'],['M']])])[0];
  assert.deepEqual(new Set(Object.values(result.assignments)).size,2);
  assert.deepEqual(Object.values(result.assignments).sort(), ['e','multi']);
});

test('incomplete squad produces no valid formation', () => {
  assert.deepEqual(optimizeFormations([p('e',['E'],80)],[formation('x',[['E'],['M']])]),[]);
});

test('ties use formation id as deterministic tie-breaker', () => {
  const players=[p('e',['E'],80),p('m',['M'],80)];
  const results=optimizeFormations(players,[formation('b',[['E'],['M']]),formation('a',[['E'],['M']])]);
  assert.deepEqual(results.map(r=>r.formationId),['a','b']);
});

test('excluded unavailable player is never selected', () => {
  const players=[p('bad',['E'],100,true),p('ok',['E'],50)];
  const result=optimizeFormations(players,[formation('x',[['E']])])[0];
  assert.equal(result.assignments.s0,'ok');
});
