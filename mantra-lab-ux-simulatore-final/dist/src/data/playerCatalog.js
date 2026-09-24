const DEFAULT_CATALOG_URL = 'https://raw.githubusercontent.com/DemPago/fantacalcio-ai/main/knowledge_base/listoni/listone_mantra_2026_27.md';
const DEFAULT_GOALKEEPERS_URL = 'https://raw.githubusercontent.com/DemPago/fantacalcio-ai/main/knowledge_base/listoni/per_ruolo_mantra/mantra_ruolo_P.md';

function slug(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

export function parseMantraListMarkdown(markdown) {
  const players=[];
  let roles=[];
  for (const rawLine of String(markdown || '').split(/\r?\n/)) {
    const line=rawLine.trim();
    const heading=line.match(/^##\s+Ruolo:\s+(.+?)\s+\(/i);
    if (heading) {
      roles=heading[1].split('/').map(x=>x.trim()).filter(Boolean);
      continue;
    }
    const prose=line.match(/^(.+?)\s+gioca nel\s+(.+?),\s+ruolo Mantra\s+(Por|P),\s+quotazione\s+(\d+)\s+crediti,\s+FVM\s+(\d+)\.?$/i);
    if (prose) {
      const [,name,club,,quotationRaw,fvmRaw]=prose;
      players.push({
        catalogId:`${slug(club)}:${slug(name)}`,
        name:name.trim(),
        club:club.trim(),
        roles:['P'],
        quotation:Number(quotationRaw),
        fvm:Number(fvmRaw)
      });
      continue;
    }
    if (!line.startsWith('|') || /^\|\s*(Nome|[-:]+)/i.test(line)) continue;
    const cells=line.split('|').slice(1,-1).map(x=>x.trim());
    if (cells.length < 4 || !roles.length) continue;
    const [name,club,quotationRaw,fvmRaw]=cells;
    if (!name || !club || !/^\d/.test(String(quotationRaw))) continue;
    players.push({
      catalogId:`${slug(club)}:${slug(name)}`,
      name,
      club,
      roles:[...roles],
      quotation:Number(quotationRaw),
      fvm:Number(fvmRaw)
    });
  }
  const unique=new Map();
  for (const player of players) unique.set(player.catalogId,player);
  return [...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'it'));
}

export function filterCatalog(players,{search='',role='',club=''}={}) {
  const needle=String(search).trim().toLocaleLowerCase('it');
  return players.filter(player => {
    const matchesSearch=!needle || `${player.name} ${player.club}`.toLocaleLowerCase('it').includes(needle);
    const matchesRole=!role || player.roles.includes(role);
    const matchesClub=!club || player.club===club;
    return matchesSearch && matchesRole && matchesClub;
  });
}


export function sortCatalog(players, sort='name-asc') {
  const copy=[...players];
  if (sort === 'quotation-desc') {
    return copy.sort((a,b) => (Number(b.quotation)||0) - (Number(a.quotation)||0) || a.name.localeCompare(b.name,'it'));
  }
  return copy.sort((a,b) => a.name.localeCompare(b.name,'it'));
}

export function playerToSquadDraft(player) {
  return {name:player.name,club:player.club,roles:[...player.roles],purchasePrice:''};
}

export async function loadPlayerCatalog(fetchImpl=fetch,url=DEFAULT_CATALOG_URL,goalkeepersUrl=DEFAULT_GOALKEEPERS_URL) {
  try {
    const [response,goalkeepersResponse]=await Promise.all([
      fetchImpl(url,{cache:'no-store'}),
      fetchImpl(goalkeepersUrl,{cache:'no-store'})
    ]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const markdown=await response.text();
    const goalkeepersMarkdown=goalkeepersResponse.ok ? await goalkeepersResponse.text() : '';
    const merged=[...parseMantraListMarkdown(markdown),...parseMantraListMarkdown(goalkeepersMarkdown)];
    const unique=new Map();
    for (const player of merged) unique.set(player.catalogId,player);
    const players=[...unique.values()].sort((a,b)=>a.name.localeCompare(b.name,'it'));
    if (!players.length) throw new Error('Listone vuoto');
    return {players,error:null,source:url};
  } catch (error) {
    return {players:[],error,source:url};
  }
}
