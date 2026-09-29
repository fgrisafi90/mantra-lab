export const TIERS = [
  {id:'top',label:'Top'}, {id:'semitop',label:'Semitop'},
  {id:'titolare',label:'Titolari affidabili'}, {id:'rimpiazzo',label:'Rimpiazzi'},
  {id:'scommessa',label:'Scommesse'}
];
// Soglie editoriali per ruolo su FVM Mantra /1000, non prezzi d'asta.
const THRESHOLDS={P:[60,40,20],Dc:[65,40,22],B:[65,40,22],Dd:[65,38,22],Ds:[65,38,22],E:[90,45,28],M:[100,45,28],C:[110,60,35],T:[145,85,45],W:[145,85,45],A:[160,100,55],Pc:[230,120,65]};
const EDITORIAL={
  'bastoni':'semitop','scalvini':'titolare','vasquez':'titolare','di lorenzo':'titolare',
  'valeri':'titolare','de ketelaere':'titolare','fazzini':'scommessa','adzic':'scommessa',
  'alajbegovic':'scommessa','fabbian':'scommessa','lontani':'scommessa'
};
const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function preferenceKey(player){return player.fantacalcioId!=null?`fc:${player.fantacalcioId}`:`catalog:${player.catalogId}`;}
export function validPreference(value){
  return value && typeof value==='object' && !Array.isArray(value) &&
    (value.tier==null || TIERS.some(t=>t.id===value.tier)) &&
    (value.cap==null || (Number.isSafeInteger(value.cap)&&value.cap>=0));
}
export function updatePreference(preferences,player,patch){
  const key=preferenceKey(player);
  const value={...(preferences[key]||{}),...patch};
  if(!validPreference(value))throw new Error('Scegli una fascia valida e un tetto intero non negativo.');
  return {...preferences,[key]:value};
}
export function playerTier(player,preferences={},budget=500){
  const fvm=Number.isFinite(player.fvm)?player.fvm:0;
  const rank=Math.min(...(player.roles||[]).map(role=>{
    const levels=THRESHOLDS[role]||[Infinity,Infinity,Infinity];
    const index=levels.findIndex(threshold=>fvm>=threshold);return index<0?3:index;
  }),3);
  const suggestedTier=EDITORIAL[normalize(player.name)]||TIERS[rank].id;
  const suggestedCap=Math.round(fvm*(Number.isFinite(budget)&&budget>=0?budget:500)/1000);
  const preference=preferences[preferenceKey(player)];
  const saved=validPreference(preference)?preference:{};
  return {tier:saved.tier??suggestedTier,cap:saved.cap??suggestedCap,suggestedTier,suggestedCap,
    customTier:saved.tier!=null,customCap:saved.cap!=null};
}
