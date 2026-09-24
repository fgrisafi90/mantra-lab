import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMatches, selectActiveMatchday, normalizeStandings } from '../scripts/sources/scheduleSource.mjs';
import { normalizePlayerStats, deriveSignals } from '../scripts/sources/playerStatsSource.mjs';
import { normalizeLineup, applyLineupSignals } from '../scripts/sources/lineupSource.mjs';

test('normalizza partite Lega Serie A e ricava la giornata', () => {
  const rows = [{
    matchId:'m1', status:'SCHEDULED', matchDateUtc:'2026-09-26T16:00:00Z', roundName:'6',
    home:{teamId:'h', mediaName:'Inter'}, away:{teamId:'a', mediaName:'Milan'},
    matchSet:{ providerId:'opta:MatchDay:6' }
  }];
  assert.deepEqual(normalizeMatches(rows)[0], {
    id:'m1', matchday:6, kickoff:'2026-09-26T16:00:00Z', home:'Inter', away:'Milan',
    homeId:'h', awayId:'a', played:false, status:'SCHEDULED', homeScore:null, awayScore:null
  });
});

test('non interpreta l id tecnico del matchSet come numero della giornata', () => {
  const rows = [{
    matchId:'m-tech', status:'SCHEDULED', matchDateUtc:'2026-09-27T18:45:00Z', roundName:'5',
    home:{teamId:'h', mediaName:'Roma'}, away:{teamId:'a', mediaName:'Napoli'},
    matchSet:{ providerId:'Football_MatchDay::4908' }
  }];
  assert.equal(normalizeMatches(rows)[0].matchday, 5);
});

test('seleziona la prima giornata con partite ancora da giocare', () => {
  const fixtures = [
    {id:'old',matchday:5,kickoff:'2026-09-20T18:00:00Z',played:true},
    {id:'a',matchday:6,kickoff:'2026-09-26T16:00:00Z',played:false},
    {id:'b',matchday:7,kickoff:'2026-10-03T16:00:00Z',played:false}
  ];
  assert.equal(selectActiveMatchday(fixtures, '2026-09-25T12:00:00Z'), 6);
});



test('tra due giornate mantiene l ultima giornata completata fino al giorno prima della successiva', () => {
  const fixtures = [
    {id:'g5',matchday:5,kickoff:'2026-09-20T18:45:00Z',played:true},
    {id:'g6',matchday:6,kickoff:'2026-10-10T13:00:00Z',played:false}
  ];
  assert.equal(selectActiveMatchday(fixtures, '2026-09-24T12:00:00Z'), 5);
  assert.equal(selectActiveMatchday(fixtures, '2026-10-09T12:00:00Z'), 6);
});

test('normalizza classifica e rank da stats', () => {
  const input=[{teamId:'i',mediaName:'Inter',stats:[{statsId:'rank',statsValue:'2'},{statsId:'goals-against',statsValue:'4'}]}];
  assert.deepEqual(normalizeStandings(input)[0], {teamId:'i',team:'Inter',rank:2,goalsAgainst:4});
});

test('normalizza statistiche giocatore e produce segnali conservativi 0-100', () => {
  const row={playerId:'p1',displayName:'Mario Rossi',team:{teamId:'t',mediaName:'Roma'},stats:[
    {statsId:'games-played',statsValue:'5'}, {statsId:'minutes-played',statsValue:'405'},
    {statsId:'goals',statsValue:'3'}, {statsId:'goal-assists',statsValue:'2'},
    {statsId:'on-target-scoring-attempts',statsValue:'8'}, {statsId:'Key Passes',statsValue:'10'}
  ]};
  const p=normalizePlayerStats(row);
  assert.equal(p.name,'Mario Rossi');
  assert.equal(p.minutes,405);
  const s=deriveSignals(p,{home:true,opponentRank:18});
  for(const key of ['availability','expectedMinutes','recentForm','opponentContext','bonusPotential','setPieces','homeAwayContext','tacticalOpportunity']) {
    assert.ok(s[key] >= 0 && s[key] <= 100, key);
  }
  assert.ok(s.expectedMinutes >= 80);
  assert.ok(s.opponentContext > 50);
});

test('lineup ufficiale distingue titolari e panchina e aggiorna i segnali', () => {
  const line=normalizeLineup({home:{teamId:'h',fielded:[{playerId:'p1',displayName:'Uno'}],benched:[{playerId:'p2',displayName:'Due'}]},away:{teamId:'a',fielded:[],benched:[]}});
  assert.equal(line.players.p1.status,'starter');
  assert.equal(line.players.p2.status,'bench');
  const starter=applyLineupSignals({availability:60,expectedMinutes:55},line.players.p1);
  const bench=applyLineupSignals({availability:80,expectedMinutes:80},line.players.p2);
  assert.equal(starter.availability,100);
  assert.equal(starter.expectedMinutes,95);
  assert.ok(bench.expectedMinutes < 50);
});

import { seasonNameForDate } from '../scripts/sources/scheduleSource.mjs';
import { buildMatchdayDataset } from '../scripts/sourcePipeline.mjs';

test('stagione calcistica resta 2026/2027 anche a gennaio 2027', () => {
  assert.equal(seasonNameForDate('2027-01-10T12:00:00Z'), '2026/2027');
  assert.equal(seasonNameForDate('2026-09-24T12:00:00Z'), '2026/2027');
});

test('pipeline conserva il dataset se la fonte lineup fallisce', async () => {
  const context={seasonId:'s',seasonName:'2026/2027',fixtures:[
    {id:'m1',matchday:6,kickoff:'2026-09-26T16:00:00Z',home:'Inter',away:'Milan',homeId:'i',awayId:'m',played:false,status:'SCHEDULED',homeScore:null,awayScore:null}
  ],standings:[{teamId:'i',team:'Inter',rank:2,goalsAgainst:2},{teamId:'m',team:'Milan',rank:8,goalsAgainst:6}]};
  const players=[{id:'p1',name:'Mario Rossi',club:'Inter',teamId:'i',games:5,minutes:400,goals:2,assists:1,shotsOnTarget:4,keyPasses:6}];
  const dataset=await buildMatchdayDataset({
    context,
    players,
    generatedAt:'2026-09-25T08:00:00Z',
    lineupFetcher: async()=>{ throw new Error('temporaneo'); }
  });
  assert.equal(dataset.matchday,6);
  assert.equal(dataset.players.length,1);
  assert.equal(dataset.players[0].name,'Mario Rossi');
  assert.ok(dataset.sources.some(s=>s.name==='Lega Serie A lineups' && s.status==='degraded'));
});

test('una vecchia giornata rinviata non blocca la giornata con kickoff più vicino', () => {
  const fixtures=[
    {id:'post',matchday:3,kickoff:'2026-11-10T19:45:00Z',played:false},
    {id:'now',matchday:6,kickoff:'2026-09-26T16:00:00Z',played:false}
  ];
  assert.equal(selectActiveMatchday(fixtures),6);
});
