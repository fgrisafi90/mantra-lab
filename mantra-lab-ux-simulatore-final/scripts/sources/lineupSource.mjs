import { LEGA_BASE, fetchJson } from './scheduleSource.mjs';

export function normalizeLineup(data = {}) {
  const players = {};
  for (const side of ['home','away']) {
    const team = data[side] || {};
    for (const p of team.fielded || []) players[p.playerId] = { id:p.playerId, name:p.displayName || '', teamId:team.teamId || null, status:'starter' };
    for (const p of team.benched || []) players[p.playerId] = { id:p.playerId, name:p.displayName || '', teamId:team.teamId || null, status:'bench' };
  }
  return { matchId:data.matchId || null, players };
}

export function applyLineupSignals(signals, lineupPlayer) {
  if (!lineupPlayer) return signals;
  if (lineupPlayer.status === 'starter') return { ...signals, availability:100, expectedMinutes:95, majorDoubt:false };
  if (lineupPlayer.status === 'bench') return { ...signals, availability:70, expectedMinutes:35, majorDoubt:true };
  return signals;
}

export async function fetchMatchLineup({ seasonId, matchId, fetchImpl = fetch } = {}) {
  try {
    const data = await fetchJson(`${LEGA_BASE}/seasons/${seasonId}/matches/${matchId}/lineups?locale=en-GB`, fetchImpl);
    return normalizeLineup(data);
  } catch (error) {
    return null;
  }
}
