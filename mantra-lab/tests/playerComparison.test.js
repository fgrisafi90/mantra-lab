import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComparison } from '../src/domain/playerComparison.js';
import { buildPlayerStatsIndex } from '../src/domain/playerStats.js';
import { getFormation } from '../src/domain/formations.js';

const player={catalogId:'juventus:mckennie',name:'McKennie',club:'Juventus',roles:['C','T'],quotation:15,fvm:61};
test('comparison preserves missing statistics and zero values and finds all compatible positions',()=>{
  const index=buildPlayerStatsIndex({players:[{name:'McKennie',club:'JUV',seasonStats:{goals:0,assists:null,averageRating:6.25}}]});
  const original=JSON.stringify(player);
  const [result]=buildComparison([player],index,getFormation('3-4-1-2'));
  assert.deepEqual(result.positions,['M/C','C','T']);
  assert.equal(result.stats.goals,0);
  assert.equal(result.stats.assists,null);
  assert.equal(result.stats.fantasyAverage,null);
  assert.equal(result.stats.averageRating,6.25);
  assert.equal(JSON.stringify(player),original);
});
test('comparison never borrows statistics from another club and reports incompatible roles',()=>{
  const index=buildPlayerStatsIndex({players:[{name:'McKennie',club:'ROM',seasonStats:{goals:9}}]});
  const [result]=buildComparison([{...player,roles:['E']}],index,getFormation('4-3-1-2'));
  assert.equal(result.stats.goals,null);
  assert.equal(result.hasStats,false);
  assert.deepEqual(result.positions,[]);
});
