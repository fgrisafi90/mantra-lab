import { findPlayerStats } from './playerStats.js';
import { canPlaySlot } from './compatibility.js';

export function buildComparison(players, statsIndex, formation) {
  return players.map(player => {
    const record = findPlayerStats(player, statsIndex);
    const stats = {};
    for (const key of ['averageRating','fantasyAverage','ratedMatches','appearances','goals','assists','yellowCards','redCards']) {
      const value = record?.seasonStats?.[key];
      stats[key] = typeof value === 'number' && Number.isFinite(value) ? value : null;
    }
    return {
      player, stats, hasStats: Object.values(stats).some(value => value !== null),
      positions: [...new Set((formation?.slots || []).filter(slot => canPlaySlot(player, slot)).map(slot => slot.label))]
    };
  });
}
