import {TIERS,playerTier} from '../domain/playerTiers.js';
import {filterCatalog} from '../data/playerCatalog.js?v=20260925-official-v2';
import {MANTRA_ROLES} from '../domain/types.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderPlayerTiers(catalog,preferences,{search='',role='',tier='',limit=40,budget=500,players=[],loading=false,error=null}={}){
  const classified=filterCatalog(catalog,{search,role}).map(player=>({player,...playerTier(player,preferences,budget)}));
  const filtered=classified.filter(p=>!tier||p.tier===tier).sort((a,b)=>TIERS.findIndex(t=>t.id===a.tier)-TIERS.findIndex(t=>t.id===b.tier)||(b.player.fvm-a.player.fvm)||a.player.name.localeCompare(b.player.name,'it'));
  const visible=filtered.slice(0,limit);
  const own=new Set(players.map(p=>`${p.name.toLowerCase()}::${p.club.toLowerCase()}`));
  return `<section class="card tiers-card" aria-labelledby="tiers-title">
    <div class="section-head"><div><span class="eyebrow">LE TUE VALUTAZIONI</span><h3 id="tiers-title">Fasce giocatori</h3></div><span class="status-pill">Budget ${esc(budget)} crediti</span></div>
    <p class="muted">Una base proposta per ruolo, con fasce e tetti modificabili. Le tue scelte restano salvate in questo browser, anche quando aggiorni il listone.</p>
    <div class="tier-filters"><label>Cerca giocatore<input id="tier-search" value="${esc(search)}" placeholder="Nome o squadra"></label><label>Ruolo Mantra<select id="tier-role"><option value="">Tutti i ruoli</option>${MANTRA_ROLES.map(r=>`<option ${role===r?'selected':''} value="${r}">${r}</option>`).join('')}</select></label><label>Fascia<select id="tier-filter"><option value="">Tutte le fasce</option>${TIERS.map(t=>`<option ${tier===t.id?'selected':''} value="${t.id}">${t.label}</option>`).join('')}</select></label></div>
    <div class="tier-summary">${TIERS.map(t=>`<button class="ghost-btn tier-chip tier-${t.id}" data-tier-filter="${t.id}" aria-pressed="${tier===t.id}">${t.label} <b>${classified.filter(p=>p.tier===t.id).length}</b></button>`).join('')}</div>
    <p class="muted tier-method">Proposta iniziale: FVM relativo al ruolo e valutazioni editoriali. Non è una garanzia di titolarità. Tetto suggerito: FVM × ${esc(budget)} / 1000, arrotondato; il tuo tetto è indipendente dal FVM ufficiale.</p>
    ${loading?'<p role="status">Caricamento giocatori…</p>':error?'<p role="alert">Listone non disponibile: riprova più tardi.</p>':`<p class="muted">${filtered.length} giocatori · ${visible.length} visualizzati</p><div class="tier-results">${visible.map(item=>{
      const {player:p}=item;const id=esc(p.catalogId);const owned=own.has(`${p.name.toLowerCase()}::${p.club.toLowerCase()}`);
      return `<article class="tier-player tier-${item.tier}"><div class="tier-identity"><button class="player-profile-trigger" data-player-profile="${id}"><strong>${esc(p.name)}</strong></button><span>${esc(p.club)} · ${esc(p.roles.join('/'))}</span><span>FVM Mantra <b>${esc(p.fvm)}</b> / 1000</span></div>
      <label>Fascia ${item.customTier?'personale':'proposta'}<select data-tier-player="${id}" aria-label="Fascia di ${esc(p.name)}">${TIERS.map(t=>`<option value="${t.id}" ${item.tier===t.id?'selected':''}>${t.label}</option>`).join('')}</select></label>
      <label>Tetto ${item.customCap?'personale':'suggerito'}<input data-tier-cap="${id}" aria-label="Tetto di ${esc(p.name)}" type="number" min="0" step="1" inputmode="numeric" value="${item.cap}"><small>crediti su ${esc(budget)}</small></label>
      <div class="tier-actions"><button class="${owned?'ghost-btn':'primary-btn'}" data-sim-add-tier="${id}" ${owned?'disabled':''}>${owned?'Inserito':'Aggiungi alla simulazione'}</button>${`<button class="ghost-btn" data-tier-reset="${id}">Ripristina proposta</button>`}</div></article>`;
    }).join('')||'<p class="empty-inline">Nessun giocatore con questi filtri.</p>'}</div>${filtered.length>visible.length?'<button class="ghost-btn tier-more" id="tier-more">Mostra altri 40</button>':''}`}
  </section>`;
}
