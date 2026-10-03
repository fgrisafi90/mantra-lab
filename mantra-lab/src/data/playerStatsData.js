import { normalizePlayerStatsDataset } from '../domain/playerStats.js';

let cachedDataset=normalizePlayerStatsDataset({generatedAt:null,season:null,players:[]});
export function getCachedPlayerStats(){ return cachedDataset; }

export function resolvePlayerStatsUrl(pathname=''){
  const path=String(pathname||'');
  if(path.includes('/mantra-lab/')) return './src/data/generated/player-stats.json';
  return './src/data/generated/player-stats.json';
}

export async function loadPlayerStats({fetchImpl=globalThis.fetch,pathname=globalThis.location?.pathname||''}={}){
  try{
    const response=await fetchImpl(resolvePlayerStatsUrl(pathname),{cache:'no-store'});
    if(!response?.ok) throw new Error(`HTTP ${response?.status}`);
    cachedDataset=normalizePlayerStatsDataset(await response.json());
    return cachedDataset;
  }catch{
    cachedDataset=normalizePlayerStatsDataset({generatedAt:null,season:null,players:[]});
    return cachedDataset;
  }
}
