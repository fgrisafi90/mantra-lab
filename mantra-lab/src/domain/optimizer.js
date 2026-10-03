import { canPlaySlot } from './compatibility.js';
import { explainOptimizedFormation } from './explanations.js';

function addEdge(graph,from,to,cap,cost){const a={to,rev:graph[to].length,cap,cost};const b={to:from,rev:graph[from].length,cap:0,cost:-cost};graph[from].push(a);graph[to].push(b);}

function bestAssignment(players,formation,excludedPlayerIds=new Set()){
  const usable=players.filter(x=>x.player.active!==false&&!x.matchday.excluded&&!excludedPlayerIds.has(x.player.id));
  const nP=usable.length,nS=formation.slots.length;
  const source=0,pBase=1,sBase=pBase+nP,sink=sBase+nS,n=sink+1;
  const graph=Array.from({length:n},()=>[]);
  usable.forEach((_,i)=>addEdge(graph,source,pBase+i,1,0));
  formation.slots.forEach((_,j)=>addEdge(graph,sBase+j,sink,1,0));
  usable.forEach((sp,i)=>formation.slots.forEach((slot,j)=>{if(canPlaySlot(sp.player,slot))addEdge(graph,pBase+i,sBase+j,1,-sp.matchday.score);}));
  let flow=0,cost=0;
  while(flow<nS){
    const dist=Array(n).fill(Infinity),prevNode=Array(n).fill(-1),prevEdge=Array(n).fill(-1);dist[source]=0;
    for(let iter=0;iter<n-1;iter++){
      let changed=false;
      for(let v=0;v<n;v++)if(Number.isFinite(dist[v]))graph[v].forEach((e,ei)=>{if(e.cap>0&&dist[e.to]>dist[v]+e.cost){dist[e.to]=dist[v]+e.cost;prevNode[e.to]=v;prevEdge[e.to]=ei;changed=true;}});
      if(!changed)break;
    }
    if(!Number.isFinite(dist[sink]))return null;
    let v=sink;
    while(v!==source){const u=prevNode[v],ei=prevEdge[v],e=graph[u][ei];e.cap-=1;graph[v][e.rev].cap+=1;v=u;}
    flow++;cost+=dist[sink];
  }
  const assignments={};
  formation.slots.forEach((slot,j)=>{for(let i=0;i<nP;i++){const edge=graph[pBase+i].find(e=>e.to===sBase+j);if(edge&&edge.cap===0){assignments[slot.id]=usable[i].player.id;break;}}});
  if(Object.keys(assignments).length!==nS)return null;
  const selectedIds=new Set(Object.values(assignments));
  const selectedPlayers=usable.filter(x=>selectedIds.has(x.player.id));
  const rawScore=-cost,normalizedScore=Math.round(rawScore/nS);
  return{assignments,rawScore,normalizedScore,selectedPlayers};
}

function buildBench(players,formation,selectedIds){
  return players
    .filter(x=>x.player.active!==false&&!x.matchday.excluded&&!selectedIds.has(x.player.id))
    .map(x=>({playerId:x.player.id,score:x.matchday.score,usefulForSlots:formation.slots.filter(slot=>canPlaySlot(x.player,slot)).map(slot=>slot.id)}))
    .filter(x=>x.usefulForSlots.length)
    .sort((a,b)=>b.usefulForSlots.length-a.usefulForSlots.length||b.score-a.score||a.playerId.localeCompare(b.playerId));
}

function buildAlternatives(players,formation,best){
  const alternativesBySlot={};
  const byId=new Map(players.map(x=>[x.player.id,x]));
  for(const slot of formation.slots){
    const starterId=best.assignments[slot.id];
    const alternate=bestAssignment(players,formation,new Set([starterId]));
    if(!alternate)continue;
    const alternateId=alternate.assignments[slot.id];
    const alternatePlayer=byId.get(alternateId),starter=byId.get(starterId);
    if(!alternatePlayer||!starter)continue;
    alternativesBySlot[slot.id]={playerId:alternateId,score:alternatePlayer.matchday.score,delta:alternatePlayer.matchday.score-starter.matchday.score};
  }
  return alternativesBySlot;
}

export function optimizeFormations(players,formations){
  const results=[];
  for(const formation of formations){
    const best=bestAssignment(players,formation);
    if(!best)continue;
    const selectedIds=new Set(Object.values(best.assignments));
    results.push({formationId:formation.id,assignments:best.assignments,rawScore:best.rawScore,normalizedScore:best.normalizedScore,explanation:explainOptimizedFormation(formation,best.selectedPlayers,best.normalizedScore),alternativesBySlot:buildAlternatives(players,formation,best),bench:buildBench(players,formation,selectedIds)});
  }
  return results.sort((a,b)=>b.rawScore-a.rawScore||a.formationId.localeCompare(b.formationId));
}
