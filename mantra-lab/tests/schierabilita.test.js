import test from 'node:test';
import assert from 'node:assert/strict';
import { assessSquad, safeRecommendations } from '../src/domain/schierabilita.js';
const now = '2026-09-29T12:00:00Z';
const player={id:'a',name:'Mario Rossi',club:'Roma',roles:['Pc']};
const signals={availability:80,expectedMinutes:90,recentForm:50,opponentContext:80,bonusPotential:80,setPieces:50,homeAwayContext:60,tacticalOpportunity:70};
const dataset=()=>({generatedAt:now,matchday:6,fixtures:[{id:'f',matchday:6,home:'Roma',away:'Inter',kickoff:'2026-09-30T18:00:00Z',played:false}],players:[{name:player.name,club:player.club,fixtureId:'f',sampleGames:5,signals:{...signals}}],sources:[]});
test('index varies with match context and orders the squad',()=>{const d=dataset(); const a=assessSquad([player],d,now)[0];d.players[0].signals={...signals,opponentContext:20,homeAwayContext:50};const b=assessSquad([player],d,now)[0];assert.ok(a.score>b.score);assert.equal(a.opponent,'Inter');assert.equal(a.provisional,true);});
test('stale, future timestamps, missing sample and played fixtures suppress scores',()=>{for(const change of [d=>d.generatedAt='2026-09-20',d=>d.generatedAt='2026-10-01',d=>delete d.players[0].sampleGames,d=>d.fixtures[0].played=true,d=>d.players[0].signals.expectedMinutes=NaN]){const d=dataset();change(d);assert.equal(assessSquad([player],d,now)[0].score,null);assert.deepEqual(safeRecommendations([player],d,now),[]);}});
test('ambiguous names and mismatched clubs never inherit another player signals',()=>{const d=dataset();d.players.push({...d.players[0]});assert.equal(assessSquad([player],d,now)[0].score,null);assert.equal(assessSquad([{...player,club:'Milan'}],dataset(),now)[0].score,null);});
test('confirmed unavailability is zero and explicitly excluded',()=>{const d=dataset();d.players[0].signals.unavailable=true;const result=assessSquad([player],d,now)[0];assert.equal(result.score,0);assert.equal(result.excluded,true);});

test('Inter matches official Internazionale club alias',()=>{const d=dataset();d.players[0].club='Internazionale';d.fixtures[0].home='Internazionale';assert.equal(assessSquad([{...player,club:'Inter'}],d,now)[0].home,true);});

import { selectUpcomingMatchday } from '../scripts/sources/scheduleSource.mjs';
test('preview selects next round also during a break',()=>{assert.equal(selectUpcomingMatchday([{matchday:5,played:true,kickoff:'2026-09-20'},{matchday:6,played:false,kickoff:'2026-10-10'}],now),6);});
