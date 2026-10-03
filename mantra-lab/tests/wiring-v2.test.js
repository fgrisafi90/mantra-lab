import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlayerStats, getCachedPlayerStats } from '../src/data/playerStatsData.js';
import { ensureDefaultFormation } from '../src/domain/formations.js';
import { assessSquad } from '../src/domain/schierabilita.js';

test('loading player stats caches the normalized dataset for existing main calls',async()=>{
  const raw={generatedAt:'2026-10-03T10:00:00Z',season:'2026/2027',players:[{name:'Test',club:'ROM',seasonStats:{appearances:3,ratedMatches:3},matchdays:[]}]};
  const result=await loadPlayerStats({fetchImpl:async()=>({ok:true,json:async()=>raw}),pathname:'/mantra-lab/'});
  assert.equal(result.players.length,1);
  assert.equal(getCachedPlayerStats(),result);
});

test('default formation initializer stores 4-2-3-1 only when no preference exists',()=>{
  const values=new Map();
  const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value)};
  ensureDefaultFormation(storage);
  assert.equal(values.get('mantra-lab:formation'),'4-2-3-1');
  values.set('mantra-lab:formation','3-4-3');
  ensureDefaultFormation(storage);
  assert.equal(values.get('mantra-lab:formation'),'3-4-3');
});

test('assessSquad uses the player-stats cache when legacy callers omit statsDataset',async()=>{
  const raw={generatedAt:'2026-10-03T10:00:00Z',season:'2026/2027',players:[{name:'Zielinski',club:'INT',roles:['C','T'],seasonStats:{appearances:5,ratedMatches:5,averageRating:6.8,fantasyAverage:8.2,goals:2,assists:2,penaltiesScored:1,penaltiesTotal:1},matchdays:[{matchday:3,rating:6.5,fantasyRating:7},{matchday:4,rating:7,fantasyRating:10},{matchday:5,rating:7.2,fantasyRating:10.2}]}]};
  await loadPlayerStats({fetchImpl:async()=>({ok:true,json:async()=>raw})});
  const dataset={generatedAt:'2026-10-03T09:00:00Z',matchday:6,sources:[],fixtures:[{id:'f',matchday:6,kickoff:'2026-10-04T18:45:00Z',home:'Internazionale',away:'Parma',played:false}],players:[{name:'Zieliński',club:'Internazionale',fixtureId:'f',sampleGames:5,signals:{availability:90,expectedMinutes:90,recentForm:50,opponentContext:70,bonusPotential:50,setPieces:50,homeAwayContext:60,tacticalOpportunity:55,unavailable:false,majorDoubt:false}}]};
  const row=assessSquad([{id:'p',name:'Zielinski',club:'INT',roles:['C','T'],active:true}],dataset,'2026-10-03T10:00:00Z')[0];
  assert.equal(row.signalSources.recentForm,'stats');
});
