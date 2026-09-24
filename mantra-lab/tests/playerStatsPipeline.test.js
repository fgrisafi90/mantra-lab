import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlayerStatsDataset, isVotesConsolidated } from '../scripts/playerStatsPipeline.mjs';

test('merges official matchday into season player',()=>{
 const current={generatedAt:'old',season:'2026/2027',players:[]};
 const source={season:[{sourceId:'1',name:'Pulisic',club:'MIL',avatarUrl:'x',seasonStats:{goals:1}}],votes:{matchday:5,players:[{sourceId:'1',name:'Pulisic',club:'MIL',status:'starter',rating:7,fantasyRating:10,goals:1,assists:0,yellowCard:false,redCard:false}]}};
 const data=buildPlayerStatsDataset(current,source,{now:'2026-09-24T22:00:00Z',minOfficialVotes:1,minOfficialClubs:1});
 assert.equal(data.players[0].matchdays[0].matchday,5);assert.equal(data.players[0].matchdays[0].fantasyRating,10);
});

test('preserves prior matchday history when new season totals arrive',()=>{
 const current={players:[{sourceId:'1',name:'Pulisic',club:'MIL',matchdays:[{matchday:4,rating:6}]}]};
 const source={season:[{sourceId:'1',name:'Pulisic',club:'MIL',seasonStats:{goals:2}}],votes:null};
 const data=buildPlayerStatsDataset(current,source,{now:'now'});
 assert.equal(data.players[0].matchdays[0].matchday,4);
});

test('does not consolidate a partial votes page',()=>{
 assert.equal(isVotesConsolidated({matchday:5,players:[{name:'x',club:'MIL'}]},100,20),false);
});
