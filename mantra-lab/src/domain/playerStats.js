const NUMERIC_FIELDS=['appearances','ratedMatches','averageRating','fantasyAverage','goals','assists','yellowCards','redCards','ownGoals','penaltiesScored','penaltiesTotal'];

export function normalizeKey(value=''){
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
}

const CLUB_ALIASES=new Map(Object.entries({
  atalanta:'ATA',bologna:'BOL',cagliari:'CAG',como:'COM',fiorentina:'FIO',frosinone:'FRO',genoa:'GEN',inter:'INT',juventus:'JUV',lazio:'LAZ',lecce:'LEC',milan:'MIL',monza:'MON',napoli:'NAP',parma:'PAR',roma:'ROM',sassuolo:'SAS',torino:'TOR',udinese:'UDI',venezia:'VEN'
}));
function canonicalClub(value=''){
  const key=normalizeKey(value);
  if(!key)return '';
  return CLUB_ALIASES.get(key)||String(value).trim().toUpperCase();
}

function normalizeNumber(value){
  if(value==null||value==='') return null;
  const n=Number(String(value).replace(',','.'));
  return Number.isFinite(n)?n:null;
}

export function normalizePlayerStatsDataset(raw={}){
  const players=Array.isArray(raw.players)?raw.players.map(row=>{
    const seasonStats={};
    for(const key of NUMERIC_FIELDS) seasonStats[key]=normalizeNumber(row?.seasonStats?.[key]);
    return {
      sourceId: row.sourceId==null?null:String(row.sourceId),
      name:String(row.name||'').trim(),
      club:String(row.club||'').trim(),
      roles:Array.isArray(row.roles)?row.roles.map(String):[],
      profileUrl:row.profileUrl?String(row.profileUrl):null,
      avatarUrl:row.avatarUrl?String(row.avatarUrl):null,
      seasonStats,
      matchdays:Array.isArray(row.matchdays)?row.matchdays.map(item=>({...item,matchday:normalizeNumber(item.matchday)})):[]
    };
  }).filter(p=>p.name):[];
  return {generatedAt:raw.generatedAt||null,season:raw.season||null,players};
}

export function buildPlayerStatsIndex(dataset){
  const bySourceId=new Map();
  const byNameClub=new Map();
  const byName=new Map();
  for(const player of dataset?.players||[]){
    if(player.sourceId) bySourceId.set(player.sourceId,player);
    const name=normalizeKey(player.name); const club=canonicalClub(player.club);
    if(name&&club) byNameClub.set(`${name}::${club}`,player);
    if(name){const list=byName.get(name)||[];list.push(player);byName.set(name,list);}
  }
  return {bySourceId,byNameClub,byName};
}

export function findPlayerStats(player,index){
  if(!player||!index) return null;
  const sourceId=player.sourceId||player.statsSourceId;
  if(sourceId&&index.bySourceId.has(String(sourceId))) return index.bySourceId.get(String(sourceId));
  const name=normalizeKey(player.name); const club=canonicalClub(player.club);
  if(name&&club){const exact=index.byNameClub.get(`${name}::${club}`);if(exact)return exact;}
  const candidates=index.byName.get(name)||[];
  return candidates.length===1&&(!club||!candidates[0].club)?candidates[0]:null;
}
