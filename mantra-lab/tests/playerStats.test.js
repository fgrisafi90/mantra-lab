import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPlayerStatsIndex, findPlayerStats, normalizePlayerStatsDataset } from '../src/domain/playerStats.js';

test('matches player by normalized name and club', () => {
  const dataset=normalizePlayerStatsDataset({players:[{name:'Pulisic',club:'MIL',seasonStats:{goals:2}}]});
  const match=findPlayerStats({name:'Pulisic',club:'MIL'},buildPlayerStatsIndex(dataset));
  assert.equal(match.seasonStats.goals,2);
});

test('does not match ambiguous same-name players', () => {
  const dataset=normalizePlayerStatsDataset({players:[{name:'Rossi',club:'MIL'},{name:'Rossi',club:'INT'}]});
  const index=buildPlayerStatsIndex(dataset);
  assert.equal(findPlayerStats({name:'Rossi',club:''},index),null);
});

test('missing numeric stats remain null', () => {
  const [p]=normalizePlayerStatsDataset({players:[{name:'X',club:'ROM'}]}).players;
  assert.equal(p.seasonStats.averageRating,null);
  assert.equal(p.seasonStats.goals,null);
});

test('matches catalog full club name to Fantacalcio abbreviation',()=>{
  const dataset=normalizePlayerStatsDataset({players:[{name:'Pulisic',club:'MIL',seasonStats:{goals:3}}]});
  const match=findPlayerStats({name:'Pulisic',club:'Milan'},buildPlayerStatsIndex(dataset));
  assert.equal(match.seasonStats.goals,3);
});
