import test from 'node:test';
import assert from 'node:assert/strict';
import { safeRecommendations } from '../src/domain/schierabilita.js';

const NOW='2026-10-03T10:00:00.000Z';
const fixture={id:'f1',matchday:6,kickoff:'2026-10-04T18:45:00.000Z',home:'Roma',away:'Lazio',played:false};
const signals=score=>({availability:score,expectedMinutes:score,recentForm:score,opponentContext:score,bonusPotential:score,setPieces:50,homeAwayContext:60,tacticalOpportunity:score,unavailable:false,majorDoubt:false});
const spec=[
 ['p',['P'],70],['dd',['Dd'],70],['dc1',['Dc'],70],['dc2',['Dc'],70],['ds',['Ds'],70],
 ['m',['M'],70],['c1',['C'],90],['c2',['C'],90],['w1',['W','A'],90],['w2',['W','A'],90],['apc',['A','Pc'],90],['t',['T'],40]
];
const make=entries=>{
  const squad=entries.map(([id,roles])=>({id,name:id,club:'ROM',roles,active:true}));
  const players=entries.map(([id,roles,score])=>({id:`src-${id}`,name:id,club:'Roma',fixtureId:'f1',sampleGames:5,signals:signals(score)}));
  return {squad,dataset:{generatedAt:'2026-10-03T09:00:00.000Z',matchday:6,sources:[],fixtures:[fixture],players}};
};

test('valid 4-2-3-1 is first even when another valid formation has higher raw score',()=>{
  const {squad,dataset}=make(spec);
  const results=safeRecommendations(squad,dataset,NOW,null,'4-2-3-1');
  assert.equal(results[0].formationId,'4-2-3-1');
  assert.ok(results.some(r=>r.formationId!=='4-2-3-1'&&r.rawScore>results[0].rawScore));
});

test('incomplete 4-2-3-1 falls back to a valid module and explains the missing T slot',()=>{
  const {squad,dataset}=make(spec.filter(([id])=>id!=='t'));
  const results=safeRecommendations(squad,dataset,NOW,null,'4-2-3-1');
  assert.ok(results.length>0);
  assert.notEqual(results[0].formationId,'4-2-3-1');
  assert.ok(results[0].preferredFormationIssue);
  assert.ok(results[0].preferredFormationIssue.reasons.some(x=>/T/.test(x)));
});
