import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizePlayerStatsDataset } from '../src/domain/playerStats.js';
import { assessSquad } from '../src/domain/schierabilita.js';

const readJson = async path => JSON.parse(await readFile(path,'utf8'));

test('committed matchday and player-stats datasets are consumable by schierabilita V2', async () => {
  const matchday=await readJson('src/data/generated/current-matchday.json');
  const stats=normalizePlayerStatsDataset(await readJson('src/data/generated/player-stats.json'));
  assert.ok(matchday.matchday > 0);
  assert.ok(Array.isArray(matchday.players) && matchday.players.length >= 100);
  assert.ok(stats.players.length >= 100);
  const candidate=matchday.players.find(row => row.sampleGames > 0 && row.fixtureId && Object.values(row.signals||{}).filter(v=>typeof v==='number').length >= 8);
  assert.ok(candidate,'expected at least one usable generated player');
  const squad=[{id:'real-smoke',name:candidate.name,club:candidate.club,roles:['C'],active:true}];
  const row=assessSquad(squad,matchday,matchday.generatedAt,stats)[0];
  assert.equal(typeof row.score,'number');
  assert.ok(row.score >= 0 && row.score <= 100);
  assert.ok(['alta','media','bassa'].includes(row.confidence));
});
