import { isDatasetStale } from '../data/publicData.js';
import { scorePlayer } from './matchdayScore.js';
import { optimizeFormations } from './optimizer.js';
import { FORMATIONS } from './formations.js';
import { buildPlayerStatsIndex, findPlayerStats } from './playerStats.js';
import { deriveStatSignals, combineConfidence } from './schierabilitaSignals.js';

const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const CLUB_ALIASES={ata:'atalanta',atalanta:'atalanta',bol:'bologna',bologna:'bologna',cag:'cagliari',cagliari:'cagliari',com:'como',como:'como',fio:'fiorentina',fiorentina:'fiorentina',fro:'frosinone',frosinone:'frosinone',gen:'genoa',genoa:'genoa',int:'inter',inter:'inter',internazionale:'inter',juv:'juventus',juventus:'juventus',laz:'lazio',lazio:'lazio',lec:'lecce',lecce:'lecce',mil:'milan',milan:'milan',mon:'monza',monza:'monza',nap:'napoli',napoli:'napoli',par:'parma',parma:'parma',rom:'roma',roma:'roma',sas:'sassuolo',sassuolo:'sassuolo',tor:'torino',torino:'torino',udi:'udinese',udinese:'udinese',ven:'venezia',venezia:'venezia'};
const clubKey=value=>CLUB_ALIASES[norm(value)]||norm(value);
const fields=['availability','expectedMinutes','recentForm','opponentContext','bonusPotential','setPieces','homeAwayContext','tacticalOpportunity'];

function resolvePlayer(player,rows){
  const club=clubKey(player.club),name=norm(player.name);
  const candidates=rows.filter(row=>!club||clubKey(row.club)===club);
  const exact=candidates.filter(row=>norm(row.name)===name);
  if(exact.length)return exact.length===1?exact[0]:null;
  const tokens=name.split(' ');
  const loose=candidates.filter(row=>{const other=norm(row.name).split(' ');return tokens.length===1?name.length>=4&&other.includes(name):other.length===1&&other[0].length>=4&&tokens.includes(other[0]);});
  return loose.length===1?loose[0]:null;
}

function resolveStats(player,index){
  const direct=findPlayerStats(player,index);
  if(direct)return direct;
  const name=norm(player.name),club=clubKey(player.club);
  const candidates=index?.byName?.get(name)||[];
  const compatible=candidates.filter(row=>!club||!row.club||clubKey(row.club)===club);
  return compatible.length===1?compatible[0]:null;
}

export function assessSquad(squad,dataset,now=new Date().toISOString(),statsDataset=null){
  const statsIndex=statsDataset?buildPlayerStatsIndex(statsDataset):null;
  return squad.map(player=>{
    const missing=reason=>({player,score:null,positives:[],negatives:[reason],provisional:false,excluded:true,confidence:'insufficiente',signalSources:{}});
    if(!dataset)return missing('Dati giornata non disponibili');
    if(isDatasetStale(dataset,now))return missing('Dati da aggiornare: indice sospeso');
    const row=resolvePlayer(player,dataset.players||[]);
    if(!row)return missing('Giocatore non identificato con certezza nella fonte');
    const fixture=dataset.fixtures?.find(f=>f.id===row.fixtureId&&f.matchday===dataset.matchday);
    if(!fixture||!Number.isFinite(Date.parse(fixture.kickoff)))return missing('Avversario della giornata non verificato');
    if(fixture.played||Date.parse(fixture.kickoff)<=Date.parse(now))return missing('Partita iniziata o conclusa: indice prepartita non disponibile');
    if(!(row.sampleGames>0)||!fields.every(key=>typeof row.signals?.[key]==='number'&&Number.isFinite(row.signals[key])&&row.signals[key]>=0&&row.signals[key]<=100))return missing('Dati insufficienti per una stima');

    const stats=statsIndex?resolveStats(player,statsIndex):null;
    const derived=stats?deriveStatSignals(player,stats,player.roles):{signals:{},confidenceParts:{recentForm:'low',bonusPotential:'low',setPieces:'low'},reasons:['Statistiche individuali non disponibili']};
    const signals={...row.signals};
    const signalSources={availability:'matchday',expectedMinutes:'matchday',opponentContext:'matchday',homeAwayContext:'matchday',tacticalOpportunity:'matchday'};
    for(const key of ['recentForm','bonusPotential','setPieces']){
      const quality=derived.confidenceParts[key]||'low';
      if(stats&&(quality!=='low'||row.signals[key]===50)){
        signals[key]=derived.signals[key];
        signalSources[key]='stats';
      }else signalSources[key]=row.signals[key]===50?'neutral':'matchday';
    }
    const result=scorePlayer(signals);
    const confidence=combineConfidence({sampleGames:row.sampleGames,stats,confidenceParts:derived.confidenceParts});
    const home=clubKey(fixture.home)===clubKey(row.club);
    const negatives=[...result.negatives,...derived.reasons];
    if(!signals.unavailable)negatives.push('Infortuni e squalifiche non verificati da questa fonte');
    return {player,...result,opponent:home?fixture.away:fixture.home,home,kickoff:fixture.kickoff,provisional:confidence!=='alta',confidence,signalSources,positives:[...result.positives],negatives};
  }).sort((a,b)=>(b.score??-1)-(a.score??-1)||a.player.name.localeCompare(b.player.name,'it'));
}

export function safeRecommendations(squad,dataset,now=new Date().toISOString(),statsDataset=null){
  const scored=assessSquad(squad,dataset,now,statsDataset).filter(row=>row.score!==null).map(row=>({player:row.player,matchday:row}));
  return scored.length?optimizeFormations(scored,FORMATIONS):[];
}
