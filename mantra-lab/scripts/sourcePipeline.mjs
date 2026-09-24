import { selectActiveMatchday } from './sources/scheduleSource.mjs';
import { deriveSignals } from './sources/playerStatsSource.mjs';
import { applyLineupSignals } from './sources/lineupSource.mjs';

function standingRank(standings, teamId) {
  return standings.find(s => s.teamId === teamId)?.rank ?? 10;
}

export async function buildMatchdayDataset({ context, players, generatedAt = new Date().toISOString(), lineupFetcher }) {
  const matchday = selectActiveMatchday(context.fixtures, generatedAt);
  if (!matchday) throw new Error('Nessuna giornata Serie A attiva trovata');
  const fixtures = context.fixtures.filter(f => f.matchday === matchday);
  const lineupPlayers = {};
  let lineupDegraded = false;

  if (lineupFetcher) {
    for (const fixture of fixtures) {
      try {
        const lineup = await lineupFetcher({ seasonId:context.seasonId, matchId:fixture.id });
        if (lineup?.players) Object.assign(lineupPlayers, lineup.players);
      } catch {
        lineupDegraded = true;
      }
    }
  }

  const normalizedPlayers = players.map(player => {
    const fixture = fixtures.find(f => f.homeId === player.teamId || f.awayId === player.teamId);
    const home = fixture?.homeId === player.teamId;
    const opponentId = fixture ? (home ? fixture.awayId : fixture.homeId) : null;
    let signals = deriveSignals(player, {
      home,
      opponentRank: standingRank(context.standings, opponentId),
      setPieces: 50
    });
    signals = applyLineupSignals(signals, lineupPlayers[player.id]);
    return {
      id: player.id,
      name: player.name,
      club: player.club,
      teamId: player.teamId,
      signals
    };
  });

  const baseSource = {
    name:'Lega Serie A SDP',
    url:'https://api-sdp.legaseriea.it/v1/serie-a/football',
    retrievedAt:generatedAt,
    status:'ok'
  };
  return {
    generatedAt,
    season:context.seasonName,
    matchday,
    fixtures,
    players:normalizedPlayers,
    sources:[
      baseSource,
      {
        name:'Lega Serie A lineups',
        url:'https://api-sdp.legaseriea.it/v1/serie-a/football',
        retrievedAt:generatedAt,
        status: lineupDegraded ? 'degraded' : (Object.keys(lineupPlayers).length ? 'ok' : 'not-yet-available')
      }
    ]
  };
}
