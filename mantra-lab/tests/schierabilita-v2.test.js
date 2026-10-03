import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSquad } from '../src/domain/schierabilita.js';

const NOW='2026-10-03T10:00:00.000Z';
const baseSignals={availability:90,expectedMinutes:90,recentForm:50,opponentContext:78,bonusPotential:50,setPieces:50,homeAwayContext:60,tacticalOpportunity:55,unavailable:false,majorDoubt:false};
const fixture={id:'f1',matchday:6,kickoff:'2026-10-04T18:45:00.000Z',home:'Internazionale',away:'Parma',played:false};
const dataset=(playerOverrides={},fixtureOverrides={})=>({generatedAt:'2026-10-03T09:00:00.000Z',matchday:6,sources:[],fixtures:[{...fixture,...fixtureOverrides}],players:[{id:'x',name:'Zieliński',club:'Internazionale',fixtureId:'f1',sampleGames:5,signals:{...baseSignals},...playerOverrides}]});
const squad=[{id:'p1',name:'Zielinski',club:'INT',roles:['C','T'],active:true}];
const statsDataset={generatedAt:NOW,season:'2026/2027',players:[{name:'Zielinski',club:'INT',roles:['C','T'],seasonStats:{appearances:5,ratedMatches:5,averageRating:6.8,fantasyAverage:8.2,goals:2,assists:2,penaltiesScored:1,penaltiesTotal:1},matchdays:[{matchday:3,rating:6.5,fantasyRating:7},{matchday:4,rating:7,fantasyRating:10},{matchday:5,rating:7.2,fantasyRating:10.2}]}]};

test('fuses player stats and matches INT with Internazionale plus accented names',()=>{
  const row=assessSquad(squad,dataset(),NOW,statsDataset)[0];
  assert.notEqual(row.score,null);
  const withoutStats=assessSquad(squad,dataset(),NOW,null)[0];
  assert.notEqual(row.score,withoutStats.score);
  assert.ok(['alta','media'].includes(row.confidence));
  assert.equal(row.signalSources.recentForm,'stats');
  assert.equal(row.opponent,'Parma');
});

test('ambiguous matchday identity returns no score',()=>{
  const d=dataset();
  d.players.push({...d.players[0],id:'x2'});
  const row=assessSquad(squad,d,NOW,statsDataset)[0];
  assert.equal(row.score,null);
  assert.equal(row.confidence,'insufficiente');
  assert.ok(row.negatives.some(x=>/non identificato/i.test(x)));
});

test('stale dataset suspends the score',()=>{
  const d=dataset(); d.generatedAt='2026-10-01T00:00:00.000Z';
  const row=assessSquad(squad,d,NOW,statsDataset)[0];
  assert.equal(row.score,null);
  assert.ok(row.negatives.some(x=>/aggiornare/i.test(x)));
});

test('started match suspends pre-match score',()=>{
  const row=assessSquad(squad,dataset({}, {kickoff:'2026-10-03T09:00:00.000Z'}),NOW,statsDataset)[0];
  assert.equal(row.score,null);
  assert.ok(row.negatives.some(x=>/iniziata/i.test(x)));
});

test('zero matchday sample produces insufficient data',()=>{
  const row=assessSquad(squad,dataset({sampleGames:0}),NOW,statsDataset)[0];
  assert.equal(row.score,null);
  assert.equal(row.confidence,'insufficiente');
});

test('out of range signal produces insufficient data instead of clamping silently',()=>{
  const d=dataset(); d.players[0].signals.opponentContext=130;
  const row=assessSquad(squad,d,NOW,statsDataset)[0];
  assert.equal(row.score,null);
  assert.equal(row.confidence,'insufficiente');
});

test('confirmed unavailable player is excluded explicitly',()=>{
  const d=dataset(); d.players[0].signals.unavailable=true;
  const row=assessSquad(squad,d,NOW,statsDataset)[0];
  assert.equal(row.excluded,true);
  assert.equal(row.score,0);
  assert.ok(row.negatives.some(x=>/indisponibile/i.test(x)));
});
