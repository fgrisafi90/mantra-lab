import { buildComparison } from '../domain/playerComparison.js';

const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const number = value => typeof value === 'number' && Number.isFinite(value) ? value.toLocaleString('it-IT', {maximumFractionDigits:2}) : '—';

export function renderPlayerComparison(catalog, selectedIds, statsIndex, dataset, formation) {
  const players = selectedIds.map(id => catalog.find(player => player.catalogId === id)).filter(Boolean);
  const comparison = buildComparison(players, statsIndex, formation);
  const updated = dataset?.generatedAt ? new Date(dataset.generatedAt) : null;
  const date = updated && !Number.isNaN(updated.getTime()) ? updated.toLocaleString('it-IT', {timeZone:'Europe/Rome'}) : 'non disponibile';
  const options = [...catalog].sort((a,b) => a.name.localeCompare(b.name,'it'));
  const row = (label, values) => `<tr><th scope="row">${esc(label)}</th>${values.map(value => `<td>${esc(value)}</td>`).join('')}</tr>`;
  const rows = comparison.length ? [
    row('Squadra', players.map(p => p.club)),
    row('Ruoli ufficiali', players.map(p => p.roles.join('/'))),
    row('Quotazione Mantra', players.map(p => number(p.quotation))),
    row('FVM Mantra', players.map(p => number(p.fvm))),
    row(`Posizioni nel ${formation.name}`, comparison.map(p => p.positions.join(' · ') || 'Nessuna senza malus')),
    ...[['Media voto','averageRating'],['Fantamedia','fantasyAverage'],['Partite a voto','ratedMatches'],['Presenze','appearances'],['Gol','goals'],['Assist','assists'],['Ammonizioni','yellowCards'],['Espulsioni','redCards']].map(([label,key]) => row(label,comparison.map(p => number(p.stats[key]))))
  ].join('') : '';
  return `<section class="card comparison-card" aria-labelledby="comparison-title">
    <div class="section-head"><div><span class="eyebrow">CONFRONTO GIOCATORI</span><h3 id="comparison-title">Confronta fino a 3 giocatori</h3></div><button type="button" class="ghost-btn" id="clear-comparison" ${players.length?'':'disabled'}>Azzera confronto</button></div>
    <p class="muted">Scegli dal listone e confronta rendimento stagionale e compatibilità con il modulo. Rosa e simulazioni restano invariate.</p>
    <div class="comparison-selectors">${[0,1,2].map(i => `<label>Giocatore ${i+1}<select data-compare-slot="${i}"><option value="">Seleziona un giocatore</option>${options.map(p => `<option value="${esc(p.catalogId)}" ${selectedIds[i]===p.catalogId?'selected':''} ${selectedIds.includes(p.catalogId)&&selectedIds[i]!==p.catalogId?'disabled':''}>${esc(p.name)} · ${esc(p.club)} · ${esc(p.roles.join('/'))}</option>`).join('')}</select></label>`).join('')}</div>
    ${comparison.length ? `<div class="comparison-scroll" tabindex="0" role="region" aria-label="Tabella confronto giocatori"><table class="comparison-table"><caption>Confronto dei dati disponibili</caption><thead><tr><th scope="col">Dato</th>${players.map(p=>`<th scope="col">${esc(p.name)}<br><button type="button" class="ghost-btn similar-trigger" data-find-similar="${esc(p.catalogId)}">Trova giocatori simili</button></th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">Seleziona almeno due giocatori per affiancare i dati.</p>'}
    <p class="comparison-source">Ruoli, quotazioni e FVM: file ufficiale Fantacalcio 2026/27. Statistiche: Fantacalcio · stagione ${esc(dataset?.season || 'non disponibile')} · aggiornamento ${esc(date)} (ora italiana). — indica un dato non disponibile, non zero. I dati storici non sono una previsione della prossima giornata.</p>
  </section>`;
}
