import { getFormation } from '../domain/formations.js';
import { recommendAssessed } from '../domain/schierabilita.js';

const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const confidenceLabel=value=>({alta:'Alta',media:'Media',bassa:'Bassa',insufficiente:'Insufficiente'}[value]||'Bassa');
const deltaLabel=value=>`${Number(value)>0?'+':''}${Number(value)||0}`;

export function renderSchierabilita(rows,matchday) {
  const recommendations=recommendAssessed(rows||[],'4-2-3-1');
  const detailed=recommendations.length?renderRecommendation(recommendations,(rows||[]).map(row=>row.player),rows):'';
  const hideLegacy=detailed?'<style>.schierabilita + .recommendation{display:none}.recommendation-lineup{display:grid;gap:10px;margin-top:16px}.recommended-player{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;padding:12px;border:1px solid var(--line);border-radius:12px;background:#091923}.recommended-player>div:first-child{display:flex;flex-direction:column;gap:3px}.recommended-player small,.recommendation-alt{color:var(--muted);font-size:12px}.recommended-score{display:flex;flex-direction:column;align-items:flex-end;gap:5px}.recommendation-alt{grid-column:1/-1;border-top:1px solid rgba(255,255,255,.07);padding-top:8px}.confidence-badge{display:inline-flex;width:max-content;border:1px solid var(--line);border-radius:999px;padding:3px 7px;font-size:10px;font-weight:800}.confidence-alta{color:#9bf7ca}.confidence-media{color:#ffd56a}.confidence-bassa,.confidence-insufficiente{color:#ffb1b1}.preferred-issue{margin:12px 0;padding:12px;border:1px solid rgba(255,213,106,.28);border-radius:12px;background:rgba(76,60,23,.2)}.preferred-issue p{margin:5px 0;color:var(--muted)}@media(max-width:600px){.recommended-player{grid-template-columns:minmax(0,1fr) auto}}</style>':'';
  return `<section class="card schierabilita"><div class="section-head"><div><span class="eyebrow">LA TUA ROSA · ${matchday?`GIORNATA ${escape(matchday)}`:'IN ATTESA DEI DATI'}</span><h3>Indice di schierabilità</h3></div></div><p class="muted">Ordine dal punteggio più alto. Indice indicativo 0–100, non una probabilità di bonus. Cambia con la giornata e resta separato dalla fascia d’asta.</p><details><summary>Come viene calcolato</summary><p class="muted">Minutaggio e disponibilità 30%, forma recente 20%, avversario 15%, potenziale bonus 15%, piazzati 10%, casa/trasferta 5%, opportunità offensive 5%. Le statistiche individuali sostituiscono i fallback neutri quando il campione è sufficiente; qualità e fallback restano visibili nella confidenza e nei motivi. Dati oltre 36 ore, partite iniziate o dati insufficienti sospendono l’indice.</p></details><div class="matchday-player-list">${rows.length?rows.map(row=>`<article class="matchday-player"><div><strong>${escape(row.player.name)}</strong><p class="muted">${escape((row.player.roles||[]).join(' / '))} · ${escape(row.player.club)}${row.opponent?` · ${row.home?'Casa':'Trasferta'} contro ${escape(row.opponent)}`:''}</p><div class="reason-list">${(row.positives||[]).map(reason=>`<p>✓ ${escape(reason)}</p>`).join('')}${(row.negatives||[]).map(reason=>`<p class="muted">${escape(reason)}</p>`).join('')}</div></div><div class="matchday-score"><strong>${row.score===null?'—':row.score}</strong><span>${row.score===null?'Dati insufficienti':row.excluded?'Indisponibile':'/100'}</span><span class="confidence-badge confidence-${escape(row.confidence||'bassa')}">${escape(confidenceLabel(row.confidence))}</span></div></article>`).join(''):'<p class="muted">Aggiungi i giocatori in Rosa per vedere la schierabilità della tua squadra.</p>'}</div>${detailed}${hideLegacy}</section>`;
}

export function renderRecommendation(recommendations,squad,assessedRows){
  const best=recommendations?.[0];
  if(!best)return '';
  const formation=getFormation(best.formationId);
  const byPlayer=new Map((squad||[]).map(player=>[player.id,player]));
  const byScore=new Map((assessedRows||[]).map(row=>[row.player.id,row]));
  const issue=best.preferredFormationIssue?.reasons?.length
    ? `<div class="preferred-issue"><strong>Perché non ${escape(best.preferredFormationIssue.formationId)}</strong>${best.preferredFormationIssue.reasons.map(reason=>`<p>${escape(reason)}</p>`).join('')}</div>`:'';
  const lineup=formation.slots.filter(slot=>best.assignments?.[slot.id]).map(slot=>{
    const playerId=best.assignments[slot.id];
    const player=byPlayer.get(playerId);
    const row=byScore.get(playerId);
    if(!player)return '';
    const alt=best.alternativesBySlot?.[slot.id];
    const altPlayer=alt?byPlayer.get(alt.playerId):null;
    const alternative=alt&&altPlayer?`<div class="recommendation-alt">Alternativa: <strong>${escape(altPlayer.name)}</strong> · ${escape(alt.score)}/100 · Δ ${escape(deltaLabel(alt.delta))}</div>`:'';
    return `<article class="recommended-player"><div><span class="slot-role">${escape(slot.label)}</span><strong>${escape(slot.label)} · ${escape(player.name)}</strong><small>${escape((player.roles||[]).join(' / '))}</small></div><div class="recommended-score"><strong>${row?.score??'—'}/100</strong><span class="confidence-badge confidence-${escape(row?.confidence||'bassa')}">${escape(confidenceLabel(row?.confidence))}</span></div>${alternative}</article>`;
  }).join('');
  const modules=recommendations.length>1?`<div class="alternatives"><strong>Moduli alternativi</strong>${recommendations.slice(1,3).map((r,i)=>`<button class="ghost-btn" data-use-recommendation="${i+1}">${escape(r.formationId)} · ${escape(r.normalizedScore)}/100</button>`).join('')}</div>`:'';
  return `<section class="recommendation card"><div class="section-head"><div><span class="eyebrow">FORMAZIONE CONSIGLIATA</span><h3>${escape(best.formationId)} · ${escape(best.normalizedScore)}/100</h3></div><button class="primary-btn" data-use-recommendation="0">Apri formazione</button></div>${issue}<div class="reason-list">${(best.explanation||[]).map(x=>`<p>✓ ${escape(x)}</p>`).join('')}</div><div class="recommendation-lineup">${lineup}</div>${modules}</section>`;
}
