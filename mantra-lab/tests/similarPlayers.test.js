import test from 'node:test';
import assert from 'node:assert/strict';
import { findSimilarPlayers } from '../src/domain/similarPlayers.js';
import { buildPlayerStatsIndex } from '../src/domain/playerStats.js';
const p=(id,roles,quotation=10)=>({catalogId:id,name:id,club:'Juventus',roles,quotation,fvm:20});
const source=p('source',['C','T'],15);
test('ranks complete role alternatives first, excludes self and incompatible players',()=>{
 const candidates=[source,p('partial',['C']),p('exact',['C','T']),p('keeper',['P']),p('forward',['Pc'])];
 const before=JSON.stringify(candidates);
 const results=findSimilarPlayers(source,candidates);
 assert.deepEqual(results.map(x=>x.player.catalogId),['exact','partial']);
 assert.deepEqual(results[1].missingRoles,['T']);
 assert.equal(JSON.stringify(candidates),before);
});
test('cheaper filter uses strictly lower official quotation, not FVM or missing price',()=>{
 const candidates=[p('lower',['C'],14),p('same',['C'],15),p('higher',['C'],16),{...p('unknown',['C']),quotation:null}];
 assert.deepEqual(findSimilarPlayers(source,candidates,{cheaperOnly:true}).map(x=>x.player.catalogId),['lower']);
});
test('missing statistics are not treated as zero and short samples are disclosed',()=>{
 const candidates=[p('no-data',['C','T']),p('similar',['C','T']),p('different',['C','T'])];
 const index=buildPlayerStatsIndex({players:[{name:'source',club:'JUV',seasonStats:{ratedMatches:2,fantasyAverage:6}},{name:'similar',club:'JUV',seasonStats:{ratedMatches:3,fantasyAverage:6.1}},{name:'different',club:'JUV',seasonStats:{ratedMatches:5,fantasyAverage:10}}]});
 const result=findSimilarPlayers(source,candidates,{statsIndex:index});
 assert.equal(result[0].player.catalogId,'similar');
 assert.equal(result.find(x=>x.player.catalogId==='no-data').statsComparable,false);
 assert.equal(result[0].smallSample,true);
});
test('returns at most five distinct alternatives',()=>{
 const candidates=Array.from({length:8},(_,i)=>p(String(i),['C']));
 assert.equal(findSimilarPlayers(source,candidates).length,5);
});
