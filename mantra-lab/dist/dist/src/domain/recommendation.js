import { FORMATIONS } from './formations.js';
import { scorePlayer } from './matchdayScore.js';
import { optimizeFormations } from './optimizer.js';
import { playerSignalsFromDataset } from '../data/publicData.js';

export function recommendLineups(squad, dataset, formations = FORMATIONS) {
  if (!dataset?.players?.length || !squad?.length) return [];
  const scored = squad.flatMap(player => {
    const signals = playerSignalsFromDataset(player, dataset);
    if (!signals) return [];
    return [{ player, matchday: scorePlayer(signals) }];
  });
  if (!scored.length) return [];
  return optimizeFormations(scored, formations);
}
