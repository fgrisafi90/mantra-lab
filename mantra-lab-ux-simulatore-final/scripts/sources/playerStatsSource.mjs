import { LEGA_BASE, fetchJson } from './scheduleSource.mjs';
const clamp = v => Math.max(0, Math.min(100, Number.isFinite(Number(v)) ? Number(v) : 0));
const n = v => Number.isFinite(Number(v)) ? Number(v) : 0;
const key = s => String(s?.statsId || s?.statsLabel || '').trim().toLowerCase();
const stat = (map, aliases) => { for (const a of aliases) if (a in map) return n(map[a]); return 0; };

export function normalizePlayerStats(row) {
  const map = Object.fromEntries((row.stats || []).map(s => [key(s), s.statsValue]));
  return {
    id: row.playerId,
    name: row.displayName || [row.mediaFirstName,row.mediaLastName].filter(Boolean).join(' '),
    club: row.team?.mediaName || row.team?.officialName || '',
    teamId: row.team?.teamId || null,
    roleLabel: row.roleLabel || '',
    games: stat(map,['games-played','appearances']),
    minutes: stat(map,['minutes-played','minutes played']),
    goals: stat(map,['goals','total-goals']),
    assists: stat(map,['goal-assists','assists']),
    shotsOnTarget: stat(map,['on-target-scoring-attempts','shots-on-target']),
    keyPasses: stat(map,['key passes','key-passes']),
  };
}

export function deriveSignals(player, { home=false, opponentRank=10, setPieces=50 } = {}) {
  const games = Math.max(1, player.games || 0);
  const avgMinutes = (player.minutes || 0) / games;
  const per90 = Math.max(1, (player.minutes || 0) / 90);
  const bonusPer90 = ((player.goals || 0) + (player.assists || 0) * 0.7) / per90;
  const threatPer90 = ((player.shotsOnTarget || 0) * 1.2 + (player.keyPasses || 0)) / per90;
  return {
    availability: clamp(player.games > 0 ? 72 : 45),
    expectedMinutes: clamp(avgMinutes / 90 * 100),
    recentForm: 50,
    opponentContext: clamp(42 + Number(opponentRank || 10) * 2.4),
    bonusPotential: clamp(35 + bonusPer90 * 45),
    setPieces: clamp(setPieces),
    homeAwayContext: home ? 60 : 50,
    tacticalOpportunity: clamp(35 + threatPer90 * 7),
    unavailable: false,
    majorDoubt: false
  };
}

export async function fetchPlayerStats({ seasonId, fetchImpl = fetch } = {}) {
  const out=[];
  for (let page=1; page<=30; page++) {
    const data = await fetchJson(`${LEGA_BASE}/seasons/${seasonId}/stats/players?category=General&page=${page}&locale=en-GB`, fetchImpl);
    out.push(...(data.players || []).map(normalizePlayerStats));
    if (data.pagination?.isLastPage || page >= Number(data.pagination?.totalPages || 1)) break;
  }
  return out;
}
