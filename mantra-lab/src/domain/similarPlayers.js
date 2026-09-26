import { findPlayerStats } from './playerStats.js';

const valid = value => typeof value === 'number' && Number.isFinite(value);

export function findSimilarPlayers(source, catalog, {cheaperOnly=false, statsIndex=null}={}) {
  if (!source?.roles?.length) return [];
  const sourceStats = findPlayerStats(source,statsIndex)?.seasonStats;
  const seen = new Set();
  return catalog.filter(player => {
    if (!player.catalogId || player.catalogId===source.catalogId || seen.has(player.catalogId)) return false;
    seen.add(player.catalogId);
    return player.roles.some(role=>source.roles.includes(role)) && (!cheaperOnly || (valid(player.quotation) && valid(source.quotation) && player.quotation<source.quotation));
  }).map(player => {
    const sharedRoles=source.roles.filter(role=>player.roles.includes(role));
    const missingRoles=source.roles.filter(role=>!player.roles.includes(role));
    const stats=findPlayerStats(player,statsIndex)?.seasonStats;
    const distances=[];
    if(sourceStats?.ratedMatches>0 && stats?.ratedMatches>0) {
      for(const key of ['averageRating','fantasyAverage']) {
        if(valid(sourceStats[key]) && valid(stats[key])) distances.push(Math.min(1,Math.abs(sourceStats[key]-stats[key])/3));
      }
    }
    if(sourceStats?.appearances>0 && stats?.appearances>0) {
      for(const key of ['goals','assists']) {
        if(valid(sourceStats[key]) && valid(stats[key])) distances.push(Math.min(1,Math.abs(sourceStats[key]/sourceStats.appearances-stats[key]/stats.appearances)));
      }
    }
    return {player,sharedRoles,missingRoles,statsComparable:distances.length>0,
      smallSample:distances.length>0 && (!(sourceStats?.ratedMatches>=5) || !(stats?.ratedMatches>=5)),
      roleCoverage:sharedRoles.length/source.roles.length,
      roleOverlap:sharedRoles.length/new Set([...source.roles,...player.roles]).size,
      statsDistance:distances.length?distances.reduce((a,b)=>a+b,0)/distances.length:0.5,
      priceDistance:valid(player.quotation)&&valid(source.quotation)?Math.abs(player.quotation-source.quotation):Infinity};
  }).sort((a,b)=>b.roleCoverage-a.roleCoverage || b.roleOverlap-a.roleOverlap || a.statsDistance-b.statsDistance || a.priceDistance-b.priceDistance || a.player.name.localeCompare(b.player.name,'it')).slice(0,5);
}
