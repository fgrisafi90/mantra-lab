export function upsertSquadPlayer(squad, draft, editingId = null, idFactory = () => crypto.randomUUID()) {
  const clean={
    name:String(draft.name||'').trim(),
    club:String(draft.club||'').trim(),
    roles:[...new Set(draft.roles||[])],
    active:true,
    ...(draft.purchasePrice==null || draft.purchasePrice==='' ? {} : {purchasePrice:Number(draft.purchasePrice)})
  };
  if (editingId) {
    return squad.map(p => p.id===editingId ? {...p,...clean,id:p.id} : p);
  }
  return [...squad,{id:idFactory(),...clean}];
}
