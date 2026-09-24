import { readFile, writeFile } from 'node:fs/promises';
import { shouldRefreshMatchday } from './scheduleLogic.mjs';
import { fetchSerieASchedule, selectActiveMatchday } from './sources/scheduleSource.mjs';
import { fetchPlayerStats } from './sources/playerStatsSource.mjs';
import { fetchMatchLineup } from './sources/lineupSource.mjs';
import { buildMatchdayDataset } from './sourcePipeline.mjs';

const path='src/data/generated/current-matchday.json';
const current=JSON.parse(await readFile(path,'utf8'));
const now=new Date().toISOString();
const force=process.env.FORCE_REFRESH==='1';

let context;
try {
  context=await fetchSerieASchedule();
} catch (error) {
  console.error(`Schedule source unavailable; existing dataset preserved: ${error.message}`);
  process.exit(0);
}

const matchday=selectActiveMatchday(context.fixtures);
if (!matchday) {
  console.log('No active Serie A matchday found.');
  process.exit(0);
}
const fixtures=context.fixtures.filter(f=>f.matchday===matchday);
const refresh=force || shouldRefreshMatchday({now,fixtures,lastRefreshAt:current.generatedAt});
if(!refresh){ console.log('No matchday refresh required today.'); process.exit(0); }

let dataset;
try {
  const players=await fetchPlayerStats({seasonId:context.seasonId});
  dataset=await buildMatchdayDataset({
    context,
    players,
    generatedAt:now,
    lineupFetcher: args => fetchMatchLineup(args)
  });
} catch (error) {
  console.error(`Player source degraded; keeping previous player signals: ${error.message}`);
  dataset={
    ...current,
    generatedAt:now,
    season:context.seasonName,
    matchday,
    fixtures,
    sources:[
      {name:'Lega Serie A SDP schedule',url:'https://api-sdp.legaseriea.it/v1/serie-a/football',retrievedAt:now,status:'ok'},
      {name:'Lega Serie A player stats',url:'https://api-sdp.legaseriea.it/v1/serie-a/football',retrievedAt:now,status:'degraded'}
    ]
  };
}

await writeFile(path,JSON.stringify(dataset,null,2)+'\n');
console.log(`Matchday ${matchday} dataset updated (${dataset.players?.length || 0} players).`);
