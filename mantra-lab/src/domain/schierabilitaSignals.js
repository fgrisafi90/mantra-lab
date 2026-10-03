const clamp=n=>Math.max(0,Math.min(100,Number.isFinite(Number(n))?Number(n):50));
const num=v=>v==null||v===''?null:(Number.isFinite(Number(v))?Number(v):null);
const neutralReason='Campione statistico ridotto: uso valore neutro';

function recentValue(stats={}){
  const recent=(Array.isArray(stats.matchdays)?stats.matchdays:[])
    .filter(x=>num(x?.rating)!=null||num(x?.fantasyRating)!=null)
    .sort((a,b)=>(Number(b.matchday)||0)-(Number(a.matchday)||0))
    .slice(0,5);
  if(recent.length>=3){
    const values=recent.map(x=>{
      const rating=num(x.rating);
      const fantasy=num(x.fantasyRating);
      const base=rating==null?fantasy:fantasy==null?rating:(rating*0.65+fantasy*0.35);
      return clamp((base-4.5)/4.5*100);
    });
    return {value:Math.round(values.reduce((a,b)=>a+b,0)/values.length),quality:recent.length>=5?'high':'medium',reason:null};
  }
  const season=stats.seasonStats||{};
  if((num(season.ratedMatches)||0)>=3){
    const rating=num(season.averageRating);
    const fantasy=num(season.fantasyAverage);
    if(rating!=null||fantasy!=null){
      const base=rating==null?fantasy:fantasy==null?rating:(rating*0.7+fantasy*0.3);
      return {value:Math.round(clamp((base-4.5)/4.5*100)),quality:'medium',reason:'Forma recente non completa: uso medie stagionali'};
    }
  }
  return {value:50,quality:'low',reason:neutralReason};
}

function roleExpectation(roles=[]){
  const set=new Set(roles);
  if(set.has('Pc'))return 1.4;
  if(['A','W','T'].some(r=>set.has(r)))return 1.05;
  if(['M','C'].some(r=>set.has(r)))return 0.7;
  if(['E','Dd','Ds','Dc','B'].some(r=>set.has(r)))return 0.4;
  return 0.8;
}

function bonusValue(stats={},roles=[]){
  const season=stats.seasonStats||{};
  const appearances=num(season.appearances)||0;
  if(appearances<=0)return {value:50,quality:'low',reason:'Campione statistico ridotto: bonus neutro'};
  const goals=num(season.goals)||0;
  const assists=num(season.assists)||0;
  const avg=num(season.averageRating);
  const fantasy=num(season.fantasyAverage);
  const fantasyLift=avg!=null&&fantasy!=null?Math.max(0,fantasy-avg):0;
  const production=(goals*3+assists*1.5+fantasyLift*0.5)/appearances;
  const expected=roleExpectation(roles);
  const raw=clamp(50+(production/expected-1)*25);
  const weight=appearances>=5?1:appearances>=3?0.7:0.35;
  const value=Math.round(50+(raw-50)*weight);
  const quality=appearances>=5?'high':appearances>=3?'medium':'low';
  return {value,quality,reason:appearances<3?'Campione statistico ridotto: bonus regredito verso neutro':null};
}

function setPiecesValue(stats={}){
  const season=stats.seasonStats||{};
  const attempts=num(season.penaltiesTotal)||0;
  if(attempts<=0)return {value:50,quality:'low',reason:'Dati piazzati non verificati'};
  const scored=Math.max(0,num(season.penaltiesScored)||0);
  const accuracy=Math.min(1,scored/attempts);
  return {value:Math.round(clamp(70+accuracy*20)),quality:attempts>=2?'high':'medium',reason:null};
}

export function deriveStatSignals(player,stats={},roles=player?.roles||[]){
  const recent=recentValue(stats);
  const bonus=bonusValue(stats,roles);
  const setPieces=setPiecesValue(stats);
  return {
    signals:{recentForm:recent.value,bonusPotential:bonus.value,setPieces:setPieces.value},
    confidenceParts:{recentForm:recent.quality,bonusPotential:bonus.quality,setPieces:setPieces.quality},
    reasons:[recent.reason,bonus.reason,setPieces.reason].filter(Boolean)
  };
}

export function combineConfidence({sampleGames=0,confidenceParts={}}={}){
  const qualities=Object.values(confidenceParts);
  const low=qualities.filter(x=>x==='low').length;
  if(sampleGames>=5&&low<2)return 'alta';
  if(sampleGames>=3&&low<2)return 'media';
  return 'bassa';
}
