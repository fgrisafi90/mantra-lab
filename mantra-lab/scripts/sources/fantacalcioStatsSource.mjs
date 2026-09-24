const STATS_URL='https://www.fantacalcio.it/statistiche-serie-a/2026-27/italia';
const VOTES_URL='https://www.fantacalcio.it/voti-fantacalcio-serie-a';

function decode(value=''){
  return String(value).replace(/&nbsp;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&agrave;/gi,'à').replace(/&egrave;/gi,'è').replace(/&igrave;/gi,'ì').replace(/&ograve;/gi,'ò').replace(/&ugrave;/gi,'ù');
}
function text(value=''){return decode(String(value).replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<style[\s\S]*?<\/style>/gi,'').replace(/<[^>]+>/g,' ')).replace(/\s+/g,' ').trim();}
function num(value){const s=text(value).replace(',','.').replace(/[^0-9.+-]/g,'');if(!s)return null;const n=Number(s);return Number.isFinite(n)?n:null;}
function rowBlocks(html){return [...String(html).matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map(m=>m[0]);}
function cells(row){return [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>m[1]);}
function attr(html,name){const m=String(html).match(new RegExp(`${name}=["']([^"']+)["']`,'i'));return m?.[1]||null;}
function imageUrl(html){
  const urls=[...String(html).matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>decode(m[1]));
  return urls.find(url=>/(player|players|calciator|athlete|profile)/i.test(url)&&!/(icon|logo|role|ruolo)/i.test(url))||urls.find(url=>!/(icon|logo|role|ruolo|team|squad)/i.test(url))||null;
}
function profileHref(row){const m=String(row).match(/<a\b[^>]*href=["']([^"']*\/giocatore\/[^"']+)["']/i);return m?decode(m[1]):null;}
function sourceId(row){const explicit=attr(row,'data-player-id')||attr(row,'data-id');if(explicit)return explicit;const href=profileHref(row);const m=href?.match(/\/(\d+)(?:\/|$)/);return m?.[1]||null;}
function parsePenalty(value){const m=text(value).match(/(\d+)\s*\/\s*(\d+)/);return m?{scored:Number(m[1]),total:Number(m[2])}:{scored:null,total:null};}

export function parseSeasonStats(html){
  const rows=rowBlocks(html);
  const headerRow=rows.find(r=>/\bPV\b/i.test(text(r))&&/\bMV\b/i.test(text(r))&&/\bFM\b/i.test(text(r)));
  let headers=headerRow?cells(headerRow).map(c=>text(c).toLowerCase()):[];
  const index=(...names)=>headers.findIndex(h=>names.some(n=>h===n||h.startsWith(n)));
  const idx={name:index('calciatore','giocatore'),club:index('sq','squadra'),pv:index('pv','partite'),mv:index('mv','media voto'),fm:index('fm','fantamedia'),gol:index('gol','gf'),rig:index('rig'),ass:index('ass'),amm:index('amm'),esp:index('esp')};
  const output=[];
  for(const row of rows){
    if(row===headerRow)continue;
    const cs=cells(row); if(cs.length<8)continue;
    const clubIndex=idx.club>=0?idx.club:1;
    const fallbackNameIndex=Math.max(0,clubIndex-1);
    let nameCell=idx.name>=0?cs[idx.name]:cs[fallbackNameIndex];
    let name=text(nameCell);
    if(!name && clubIndex>0){
      for(let i=clubIndex-1;i>=0;i--){const candidate=text(cs[i]);if(candidate){nameCell=cs[i];name=candidate;break;}}
    }
    if(!name||/^calciatore$/i.test(name))continue;
    const club=text(cs[clubIndex]);
    if(!club||club.length>8)continue;
    const penalty=parsePenalty(idx.rig>=0?cs[idx.rig]:'');
    output.push({sourceId:sourceId(row),name,club,profileUrl:profileHref(row),avatarUrl:imageUrl(row)||imageUrl(nameCell),seasonStats:{
      appearances:num(idx.pv>=0?cs[idx.pv]:null),ratedMatches:num(idx.pv>=0?cs[idx.pv]:null),averageRating:num(idx.mv>=0?cs[idx.mv]:null),fantasyAverage:num(idx.fm>=0?cs[idx.fm]:null),goals:num(idx.gol>=0?cs[idx.gol]:null),assists:num(idx.ass>=0?cs[idx.ass]:null),yellowCards:num(idx.amm>=0?cs[idx.amm]:null),redCards:num(idx.esp>=0?cs[idx.esp]:null),ownGoals:null,penaltiesScored:penalty.scored,penaltiesTotal:penalty.total
    }});
  }
  if(!output.length) throw new Error('Fantacalcio stats layout not recognized');
  return output;
}

function statusFromRow(row){
  const raw=text(row).toLowerCase();
  const attrs=[...String(row).matchAll(/(?:alt|title)=["']([^"']+)["']/gi)].map(m=>m[1].toLowerCase()).join(' ');
  const all=`${raw} ${attrs}`;
  if(/subentrat|entrato/.test(all))return 'sub';
  if(/sostituit/.test(all))return 'replaced';
  if(/titolare/.test(all))return 'starter';
  if(/infortun/.test(all))return 'injured';
  if(/squalificat/.test(all))return 'suspended';
  if(/inutilizz|panchina/.test(all))return 'unused';
  return null;
}

export function parseMatchdayVotes(html){
  const title=text((String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||html.slice(0,1000));
  const matchday=Number((title.match(/(\d+)\s*(?:ª|a)?\s*giornata/i)||[])[1]||0)||null;
  const players=[];
  for(const row of rowBlocks(html)){
    const cs=cells(row); if(cs.length<4)continue;
    const name=text(cs[0]); const club=text(cs[1]);
    if(!name||!club||/calciatore|giocatore/i.test(name))continue;
    const numeric=cs.slice(2).map(num).filter(v=>v!=null);
    const rating=numeric[0]??null; const fantasyRating=numeric[1]??rating;
    if(rating==null && !statusFromRow(row)) continue;
    players.push({sourceId:sourceId(row),name,club,status:statusFromRow(row),rating,fantasyRating,goals:numeric[2]??0,assists:numeric[3]??0,yellowCard:Boolean(numeric[4]??0),redCard:Boolean(numeric[5]??0)});
  }
  if(!matchday) throw new Error('Fantacalcio matchday not recognized');
  return {matchday,players};
}

export async function fetchFantacalcioStats({fetchImpl=globalThis.fetch}={}){
  const [statsRes,votesRes]=await Promise.all([fetchImpl(STATS_URL,{headers:{'user-agent':'Mozilla/5.0 MantraLab/1.0'}}),fetchImpl(VOTES_URL,{headers:{'user-agent':'Mozilla/5.0 MantraLab/1.0'}})]);
  if(!statsRes?.ok) throw new Error(`Fantacalcio stats HTTP ${statsRes?.status}`);
  const statsHtml=await statsRes.text();
  const season=parseSeasonStats(statsHtml);
  let votes=null;
  if(votesRes?.ok){try{votes=parseMatchdayVotes(await votesRes.text());}catch{votes=null;}}
  return {season,votes,sources:[STATS_URL,VOTES_URL]};
}
