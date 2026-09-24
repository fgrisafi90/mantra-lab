import test from 'node:test';
import assert from 'node:assert/strict';
import { recommendLineups } from '../src/domain/recommendation.js';

const squad=[
  ['p','Portiere',['P']],['d1','Dc 1',['Dc']],['d2','Dc 2',['Dc']],['d3','Dc 3',['Dc']],
  ['e1','Esterno 1',['E']],['mc','Mediano',['M','C']],['c','Centrale',['C']],['e2','Esterno 2',['E']],
  ['t','Trequartista',['T']],['a1','Punta 1',['A']],['a2','Punta 2',['Pc']]
].map(([id,name,roles])=>({id,name,club:'Test',roles,active:true}));

const dataset={players:squad.map((p,i)=>({name:p.name,club:p.club,signals:{availability:100,expectedMinutes:90,recentForm:60+i,opponentContext:60,bonusPotential:60,setPieces:50,homeAwayContext:60,tacticalOpportunity:60,unavailable:false,majorDoubt:false}}))};

test('raccomanda una formazione valida usando i segnali della giornata',()=>{
  const result=recommendLineups(squad,dataset);
  assert.ok(result.length>=1);
  assert.ok(result.some(r=>r.formationId==='3-4-1-2'));
  assert.equal(Object.keys(result.find(r=>r.formationId==='3-4-1-2').assignments).length,11);
});

test('senza segnali esterni non inventa una raccomandazione',()=>{
  assert.deepEqual(recommendLineups(squad,{players:[]}),[]);
});
