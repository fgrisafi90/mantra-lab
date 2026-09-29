import { isDatasetStale } from '../data/publicData.js';
import { scorePlayer } from './matchdayScore.js';
import { optimizeFormations } from './optimizer.js';
import { FORMATIONS } from './formations.js';
const norm = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const clubKey = value => { const key=norm(value); return key==='internazionale'?'inter':key; };
const fields=['availability','expectedMinutes','recentForm','opponentContext','bonusPotential','setPieces','homeAwayContext','tacticalOpportunity'];
function resolvePlayer(player, rows) {
  const club=clubKey(player.club), name=norm(player.name);
  const candidates=rows.filter(row=>club && clubKey(row.club)===club);
  const exact=candidates.filter(row=>norm(row.name)===name);
  if(exact.length) return exact.length===1?exact[0]:null;
  const tokens=name.split(' ');
  const loose=candidates.filter(row=> {const other=norm(row.name).split(' ');return tokens.length===1?name.length>=4 && other.includes(name):other.length===1 && other[0].length>=4 && tokens.includes(other[0]);});
  return loose.length===1?loose[0]:null;
}
export function assessSquad(squad, dataset, now=new Date().toISOString()) {
  return squad.map(player=>{
    const missing=reason=>({player,score:null,positives:[],negatives:[reason],provisional:false,excluded:true});
    if(!dataset) return missing('Dati giornata non disponibili');
    if(isDatasetStale(dataset,now)) return missing('Dati da aggiornare: indice sospeso');
    const row=resolvePlayer(player,dataset.players || []);
    if(!row) return missing('Giocatore non identificato con certezza nella fonte');
    const fixture=dataset.fixtures?.find(f=>f.id===row.fixtureId && f.matchday===dataset.matchday);
    if(!fixture || !Number.isFinite(Date.parse(fixture.kickoff))) return missing('Avversario della giornata non verificato');
    if(fixture.played || Date.parse(fixture.kickoff)<=Date.parse(now)) return missing('Partita iniziata o conclusa: indice prepartita non disponibile');
    if(!(row.sampleGames>0) || !fields.every(key=>typeof row.signals?.[key]==='number' && Number.isFinite(row.signals[key]) && row.signals[key]>=0 && row.signals[key]<=100)) return missing('Dati insufficienti per una stima');
    const result=scorePlayer(row.signals);
    const home=clubKey(fixture.home)===clubKey(row.club);
    return {player,...result,opponent:home?fixture.away:fixture.home,home,kickoff:fixture.kickoff,provisional:!row.signals.unavailable,positives:[...result.positives],negatives:[...result.negatives,...(!row.signals.unavailable?['Stima da medie stagionali; forma recente e piazzati impostati su valori neutri','Infortuni e squalifiche non verificati da questa fonte']:[])]};
  }).sort((a,b)=>(b.score??-1)-(a.score??-1) || a.player.name.localeCompare(b.player.name,'it'));
}
export function safeRecommendations(squad,dataset,now=new Date().toISOString()) {
  const scored=assessSquad(squad,dataset,now).filter(row=>row.score!==null).map(row=>({player:row.player,matchday:row}));
  return scored.length?optimizeFormations(scored,FORMATIONS):[];
}
