import { readFile, writeFile } from 'node:fs/promises';
import { fetchFantacalcioStats } from './sources/fantacalcioStatsSource.mjs';
import { buildPlayerStatsDataset } from './playerStatsPipeline.mjs';
const path='src/data/generated/player-stats.json';
let current={generatedAt:null,season:'2026/2027',players:[]};
try{current=JSON.parse(await readFile(path,'utf8'));}catch{}
try{
  const source=await fetchFantacalcioStats();
  if(!Array.isArray(source.season)||source.season.length<100) throw new Error(`Dataset Fantacalcio incompleto (${source.season?.length||0} giocatori)`);
  const next=buildPlayerStatsDataset(current,source,{now:new Date().toISOString()});
  await writeFile(path,JSON.stringify(next,null,2)+'\n');
  console.log(`Player stats updated: ${next.players.length} players${source.votes?`, matchday ${source.votes.matchday}`:''}.`);
}catch(error){
  console.error(`Fantacalcio source unavailable; existing player stats preserved: ${error.message}`);
  process.exit(0);
}
