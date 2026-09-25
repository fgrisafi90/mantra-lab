import { MANTRA_ROLES } from '../domain/types.js';

const CATALOG_URL = './src/data/generated/official-mantra-2026-27.json';

function playerKey(player) {
  const normalize = value => String(value || '').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('it').trim();
  return `${normalize(player.club)}::${normalize(player.name)}`;
}

export function reconcileOfficialRoles(players, catalog) {
  const byNameAndClub = new Map(catalog.map(player => [playerKey(player), player]));
  return players.map(player => {
    const official = byNameAndClub.get(playerKey(player));
    return official ? {...player, roles:[...official.roles]} : player;
  });
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

export function playerToSquadDraft(player,purchasePrice) {
  return {name:player.name,club:player.club,roles:[...player.roles],
    ...(purchasePrice==null || purchasePrice==='' ? {} : {purchasePrice:Number(purchasePrice)})};
}

export async function loadPlayerCatalog(fetchImpl=fetch,url=CATALOG_URL) {
  try {
    const response=await fetchImpl(url,{cache:'no-store'});
    if (!response?.ok) throw new Error(`HTTP ${response?.status}`);
    const data=await response.json();
    const players=data?.players;
    if (!Array.isArray(players) || players.length!==535 ||
        new Set(players.map(p=>p.catalogId)).size!==535 ||
        players.some(p=>!p.catalogId || !p.name || !p.club || !Array.isArray(p.roles) ||
          !p.roles.length || p.roles.some(role=>!MANTRA_ROLES.includes(role)) ||
          !Number.isFinite(p.quotation) || !Number.isFinite(p.fvm))) {
      throw new Error('Listone ufficiale incompleto o non valido');
    }
    return {players,error:null,source:url};
  } catch (error) {
    return {players:[],error,source:url};
  }
}
