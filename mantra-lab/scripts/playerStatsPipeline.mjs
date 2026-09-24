function keyOf(player){return player?.sourceId?`id:${player.sourceId}`:`name:${String(player?.name||'').trim().toLowerCase()}::${String(player?.club||'').trim().toLowerCase()}`;}
export function isVotesConsolidated(votes,minOfficialVotes=100,minOfficialClubs=20){if(!votes?.matchday||!Array.isArray(votes.players))return false;const rated=votes.players.filter(p=>p.rating!=null||p.fantasyRating!=null);const clubs=new Set(rated.map(p=>String(p.club||'').trim().toUpperCase()).filter(Boolean));return rated.length>=minOfficialVotes&&clubs.size>=minOfficialClubs;}
export function buildPlayerStatsDataset(current={},source={},options={}){
  const now=options.now||new Date().toISOString();
  const minOfficialVotes=options.minOfficialVotes??100;
  const minOfficialClubs=options.minOfficialClubs??20;
  const existing=new Map((current.players||[]).map(p=>[keyOf(p),p]));
  const byNameClub=new Map((current.players||[]).map(p=>[`name:${String(p.name||'').trim().toLowerCase()}::${String(p.club||'').trim().toLowerCase()}`,p]));
  const voteMap=new Map();
  if(isVotesConsolidated(source.votes,minOfficialVotes,minOfficialClubs)){
    for(const v of source.votes.players||[]){voteMap.set(keyOf(v),v);voteMap.set(`name:${String(v.name||'').trim().toLowerCase()}::${String(v.club||'').trim().toLowerCase()}`,v);}
  }
  const players=(source.season||[]).map(row=>{
    const old=existing.get(keyOf(row))||byNameClub.get(`name:${String(row.name||'').trim().toLowerCase()}::${String(row.club||'').trim().toLowerCase()}`)||{};
    const matchdays=Array.isArray(old.matchdays)?old.matchdays.map(x=>({...x})):[];
    const vote=voteMap.get(keyOf(row))||voteMap.get(`name:${String(row.name||'').trim().toLowerCase()}::${String(row.club||'').trim().toLowerCase()}`);
    if(vote&&source.votes?.matchday){
      const item={matchday:source.votes.matchday,opponent:vote.opponent||null,venue:vote.venue||null,status:vote.status||null,minutes:vote.minutes??null,rating:vote.rating??null,fantasyRating:vote.fantasyRating??null,goals:vote.goals??0,assists:vote.assists??0,yellowCard:Boolean(vote.yellowCard),redCard:Boolean(vote.redCard)};
      const index=matchdays.findIndex(x=>Number(x.matchday)===Number(item.matchday));
      if(index>=0) matchdays[index]=item; else matchdays.push(item);
    }
    matchdays.sort((a,b)=>(a.matchday||0)-(b.matchday||0));
    return {...old,...row,matchdays};
  });
  return {generatedAt:now,season:current.season||'2026/2027',players,sources:source.sources||current.sources||[]};
}
