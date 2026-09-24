import test from 'node:test';
import assert from 'node:assert/strict';
import { loadPlayerStats, resolvePlayerStatsUrl } from '../src/data/playerStatsData.js';

test('loads generated stats with no-store cache', async()=>{
  let options;
  const result=await loadPlayerStats({fetchImpl:async(_url,o)=>{options=o;return {ok:true,json:async()=>({players:[]})};}});
  assert.equal(options.cache,'no-store');
  assert.deepEqual(result.players,[]);
});

test('returns safe dataset on fetch failure', async()=>{
  const result=await loadPlayerStats({fetchImpl:async()=>{throw new Error('offline');}});
  assert.deepEqual(result.players,[]);
});

test('resolves stats beside app source',()=>{
  assert.match(resolvePlayerStatsUrl('/mantra-lab/mantra-lab/index.html'),/src\/data\/generated\/player-stats\.json/);
});
