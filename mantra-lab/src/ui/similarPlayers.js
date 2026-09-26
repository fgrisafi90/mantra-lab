const esc=value=>String(value??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

export function renderSimilarPlayers(source,results,cheaperOnly) {
  return `<section class="similar-players" aria-labelledby="similar-title"><h3 id="similar-title">Alternative a ${esc(source.name)}</h3>
    <label class="similar-filter"><input type="checkbox" id="similar-cheaper" ${cheaperOnly?'checked':''}> Solo quotazione più bassa di ${esc(source.quotation)}</label>
    <p class="comparison-source">Prima la copertura dei ruoli, poi il rendimento stagionale disponibile e la vicinanza della quotazione. Il confronto considera medie e gol/assist per presenza: non misura lo stile di gioco. Le alternative possono appartenere ad altre rose.</p>
    <div class="similar-results">${results.length?results.map(result=>{const p=result.player;return `<article class="similar-result"><div><strong>${esc(p.name)}</strong><p>${esc(p.club)} · ${esc(p.roles.join('/'))} · Q ${esc(p.quotation)} · FVM ${esc(p.fvm)}</p></div>
      <p>${result.missingRoles.length?`Condivide ${esc(result.sharedRoles.join('/'))}; non copre ${esc(result.missingRoles.join('/'))}.`:'Copre tutti i ruoli del giocatore di partenza.'}</p>
      <p class="muted">${result.statsComparable?`Rendimento incluso nel confronto.${result.smallSample?' Campione ridotto: meno di 5 partite a voto per almeno uno dei due.':''}`:'Statistiche confrontabili insufficienti: posizione basata su ruoli e quotazione.'}</p>
      <button type="button" class="ghost-btn" data-compare-alternative="${esc(p.catalogId)}">Confronta con ${esc(source.name)}</button></article>`;}).join(''):'<p class="muted">Nessuna alternativa con questi criteri. Prova a disattivare il filtro sulla quotazione.</p>'}</div>
  </section>`;
}
