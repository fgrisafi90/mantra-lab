export function analyzeSquadCoverage(players, formations) {
  const active = players.filter(p => p.active !== false);
  const roleCount = role => active.filter(p => p.roles.includes(role)).length;
  const issues = [];

  if (roleCount('E') < 2) issues.push({ severity:'critical', message:`Copertura E insufficiente: ${roleCount('E')} giocatori. I moduli con difesa a 3 rischiano di essere impraticabili.` });
  if (roleCount('Dd') < 1 || roleCount('Ds') < 1) issues.push({ severity:'warning', message:`Copertura terzini: Dd ${roleCount('Dd')} · Ds ${roleCount('Ds')}. I moduli a 4 possono essere fragili.` });
  const mc = new Set(active.filter(p => p.roles.some(r => r==='M' || r==='C')).map(p=>p.id)).size;
  if (mc >= 4) issues.push({ severity:'info', message:`Buona copertura M/C: ${mc} giocatori utilizzabili nel cuore del centrocampo.` });
  else if (mc < 3) issues.push({ severity:'warning', message:`Copertura M/C limitata: ${mc} giocatori.` });

  const multi = active.filter(p => p.roles.length > 1).length;
  issues.push({ severity:'info', message:`Flessibilità: ${multi} giocatori multiruolo in rosa.` });

  const spent = active.reduce((sum,p)=>sum+(Number(p.purchasePrice)||0),0);
  issues.push({ severity:'info', message:`Budget registrato: ${spent} crediti spesi.` });

  const possible = formations.filter(f => f.slots.every(slot => active.some(p => p.roles.some(r => slot.acceptedRoles.includes(r))))).length;
  issues.push({ severity: possible >= 6 ? 'info' : possible ? 'warning' : 'critical', message:`Copertura preliminare moduli: ${possible}/${formations.length} con almeno un candidato per ogni tipo di slot.` });
  return issues;
}
