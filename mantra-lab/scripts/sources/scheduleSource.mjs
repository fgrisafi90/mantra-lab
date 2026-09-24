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
  const round = String(row?.roundName || '').match(/(\d+)/)?.[1];
  const roundNumber = round ? Number(round) : null;
  if (roundNumber && roundNumber >= 1 && roundNumber <= 38) return roundNumber;

  const provider = row?.matchSet?.providerId || '';
  const p = String(provider).match(/MatchDay[:\s-]*(\d+)/i)?.[1];
  const providerNumber = p ? Number(p) : null;
  return providerNumber && providerNumber >= 1 && providerNumber <= 38 ? providerNumber : null;
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

function romeDateKey(input) {
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone:'Europe/Rome', year:'numeric', month:'2-digit', day:'2-digit'
  }).formatToParts(d);
  const o = Object.fromEntries(parts.map(p => [p.type, p.value]));
  return `${o.year}-${o.month}-${o.day}`;
}

function previousDateKey(key) {
  const [y,m,d] = key.split('-').map(Number);
  return new Date(Date.UTC(y,m-1,d-1,12)).toISOString().slice(0,10);
}

export function selectActiveMatchday(fixtures = [], now = new Date().toISOString()) {
  const valid = fixtures.filter(f => Number.isInteger(f.matchday) && Number.isFinite(new Date(f.kickoff).getTime()));
  const pending = valid.filter(f => !f.played)
    .sort((a,b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime() || a.matchday - b.matchday);
  if (!pending.length) {
    const playedDays = valid.filter(f => f.played).map(f => f.matchday);
    return playedDays.length ? Math.max(...playedDays) : null;
  }

  const next = pending[0];
  const nextDate = romeDateKey(next.kickoff);
  const today = romeDateKey(now);
  if (today && nextDate && today >= previousDateKey(nextDate)) return next.matchday;

  const byDay = new Map();
  for (const fixture of valid) {
    if (!byDay.has(fixture.matchday)) byDay.set(fixture.matchday, []);
    byDay.get(fixture.matchday).push(fixture);
  }
  const completedDays = [...byDay.entries()]
    .filter(([,rows]) => rows.length && rows.every(f => f.played))
    .map(([day]) => day)
    .filter(day => day < next.matchday);

  return completedDays.length ? Math.max(...completedDays) : next.matchday;
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
