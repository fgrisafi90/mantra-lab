export const LEGA_BASE = 'https://api-sdp.legaseriea.it/v1/serie-a/football';
export const SERIE_A_COMPETITION_ID = 'serie-a::Football_Competition::ec93b94f74294dc98ab5bcfd67fc0d88';

const headers = { 'User-Agent':'Mozilla/5.0 (compatible; MantraLab/1.0)', Accept:'application/json' };
const n = v => Number.isFinite(Number(v)) ? Number(v) : null;
const statMap = stats => Object.fromEntries((stats || []).map(s => [String(s.statsId || s.statsLabel || '').toLowerCase(), s.statsValue]));
const teamName = t => t?.mediaName || t?.officialName || t?.shortName || t?.name || '';

export async function fetchJson(url, fetchImpl = fetch) {
  const res = await fetchImpl(url, { headers });
  if (!res.ok) throw new Error(`Lega Serie A HTTP ${res.status}`);
  return res.json();
}

export function seasonNameForDate(value = new Date().toISOString()) {
  const d = new Date(value);
  const year = d.getUTCFullYear();
  const start = d.getUTCMonth() < 6 ? year - 1 : year;
  return `${start}/${start + 1}`;
}

export async function resolveSeasonId({ seasonName, fetchImpl = fetch } = {}) {
  const target = seasonName || seasonNameForDate();
  const data = await fetchJson(`${LEGA_BASE}/competitions/${SERIE_A_COMPETITION_ID}/seasons?locale=en-GB`, fetchImpl);
  const seasons = data.seasons || [];
  const season = seasons.find(s => s.seasonName === target) || seasons.at(-1);
  if (!season?.seasonId) throw new Error('Stagione Serie A non trovata');
  return { seasonId: season.seasonId, seasonName: season.seasonName };
}

function matchdayOf(row) {
  const provider = row?.matchSet?.providerId || row?.matchSet?.matchSetId || '';
  const p = String(provider).match(/MatchDay[:\s-]*(\d+)/i)?.[1];
  if (p) return Number(p);
  const r = String(row?.roundName || '').match(/(\d+)/)?.[1];
  return r ? Number(r) : null;
}

export function normalizeMatches(rows = []) {
  return rows.map(row => ({
    id: row.matchId,
    matchday: matchdayOf(row),
    kickoff: row.matchDateUtc,
    home: teamName(row.home),
    away: teamName(row.away),
    homeId: row.home?.teamId || null,
    awayId: row.away?.teamId || null,
    played: String(row.status).toUpperCase() === 'FINISHED',
    status: row.status || 'UNKNOWN',
    homeScore: n(row.providerHomeScore),
    awayScore: n(row.providerAwayScore)
  })).filter(x => x.id && x.matchday && x.kickoff);
}

export function selectActiveMatchday(fixtures = []) {
  const pending = fixtures.filter(f => !f.played && Number.isInteger(f.matchday) && Number.isFinite(new Date(f.kickoff).getTime()));
  if (!pending.length) return null;
  pending.sort((a,b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime() || a.matchday - b.matchday);
  return pending[0].matchday;
}

export function normalizeStandings(rows = []) {
  return rows.map(row => {
    const s = statMap(row.stats);
    return {
      teamId: row.teamId,
      team: teamName(row),
      rank: n(s.rank) ?? 20,
      goalsAgainst: n(s['goals-against']) ?? 0
    };
  });
}

export async function fetchSerieASchedule({ seasonName, fetchImpl = fetch } = {}) {
  const season = await resolveSeasonId({ seasonName, fetchImpl });
  const matchesData = await fetchJson(`${LEGA_BASE}/seasons/${season.seasonId}/matches?locale=en-GB`, fetchImpl);
  const standingsData = await fetchJson(`${LEGA_BASE}/seasons/${season.seasonId}/standings/overall?locale=en-GB`, fetchImpl);
  return {
    ...season,
    fixtures: normalizeMatches(matchesData.matches || []),
    standings: normalizeStandings(standingsData.standings?.[0]?.teams || [])
  };
}
