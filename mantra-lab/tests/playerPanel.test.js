import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlayerPanel } from '../src/ui/playerPanel.js';

test('panel renders season summary and history',()=>{
 const html=renderPlayerPanel({name:'Pulisic',club:'MIL',roles:['W','A']},{avatarUrl:null,seasonStats:{averageRating:7,fantasyAverage:8.75,ratedMatches:2,goals:1,assists:1,yellowCards:1,redCards:0,penaltiesScored:0,penaltiesTotal:0},matchdays:[{matchday:5,status:'starter',rating:7,fantasyRating:10,goals:1}]});
 assert.match(html,/Media voto/);assert.match(html,/Fantamedia/);assert.match(html,/5ª/);assert.match(html,/Titolare/);
});
test('panel shows unavailable state without stats',()=>{assert.match(renderPlayerPanel({name:'X',club:'ROM',roles:['A']},null),/Statistiche non ancora disponibili/);});
