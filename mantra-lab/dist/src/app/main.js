import { NAV_ITEMS } from './navigation.js';
import { FORMATIONS, getFormation } from '../domain/formations.js';
import { eligiblePlayersForSlot, setLineupPlayer } from '../domain/pitchModel.js';
import { MANTRA_ROLES } from '../domain/types.js';
import { analyzeSquadCoverage } from '../domain/squadCoverage.js';
import { loadSquad, saveSquad } from '../storage/squadStorage.js';
import { exportSquad, importSquad } from '../storage/transfer.js';
import { loadPublicData, isDatasetStale } from '../data/publicData.js';
import { recommendLineups } from '../domain/recommendation.js';
import { upsertSquadPlayer } from '../domain/squadEditor.js';

const app = document.querySelector('#app');
let active = 'giornata';
let squad = loadSquad();
let formationId = localStorage.getItem('mantra-lab:formation') || '3-4-1-2';
let lineup = {};
let pickerSlot = null;
let publicDataset = null;
let publicDataError = null;
let publicDataLoading = true;
let editingPlayerId = null;

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const playerById = id => squad.find(p => p.id === id);

function persist() { saveSquad(squad); }

function shell(content) {
  return `
  <div class="shell">
    <header class="topbar">
      <div><span class="eyebrow">FANTACALCIO MANTRA</span><h1>Mantra Lab</h1></div>
      <div class="status-pill">${squad.length} giocatori</div>
    </header>
    <main class="content">${content}</main>
    <nav class="bottom-nav" aria-label="Navigazione principale">
      ${NAV_ITEMS.map(item => `<button class="nav-btn ${active === item.id ? 'active' : ''}" data-nav="${item.id}"><span>${item.icon}</span><small>${item.label}</small></button>`).join('')}
    </nav>
  </div>`;
}

function hero(kicker,title,subtitle,action='') {
  return `<section class="hero-card"><div><span class="eyebrow">${kicker}</span><h2>${title}</h2><p>${subtitle}</p></div>${action}</section>`;
}

function renderGiornata() {
  const recommendations = publicDataset ? recommendLineups(squad, publicDataset) : [];
  const best = recommendations[0];
  const stale = publicDataset ? isDatasetStale(publicDataset) : false;
  const updated = publicDataset?.generatedAt ? new Date(publicDataset.generatedAt).toLocaleString('it-IT',{dateStyle:'short',timeStyle:'short'}) : '—';
  const dataState = publicDataLoading ? 'Caricamento…' : publicDataError ? 'Non disponibili' : stale ? 'Da aggiornare' : 'Aggiornati';
  const analysis = best ? `<section class="recommendation card"><div class="section-head"><div><span class="eyebrow">FORMAZIONE CONSIGLIATA</span><h3>${best.formationId} · ${best.normalizedScore}/100</h3></div><button class="primary-btn" data-use-recommendation="0">Apri formazione</button></div><div class="reason-list">${best.explanation.map(x=>`<p>✓ ${escapeHtml(x)}</p>`).join('')}</div>${recommendations.length>1?`<div class="alternatives"><strong>Alternative</strong>${recommendations.slice(1,3).map((r,i)=>`<button class="ghost-btn" data-use-recommendation="${i+1}">${r.formationId} · ${r.normalizedScore}/100</button>`).join('')}</div>`:''}</section>` : `<section class="card compact"><span class="eyebrow">ANALISI GIORNATA</span><h3>${squad.length<11?'Completa prima la rosa':'Nessuna formazione calcolabile'}</h3><p class="muted">${publicDataError?'I dati esterni non sono raggiungibili al momento.':publicDataset?.players?.length?'La rosa non ha ancora abbastanza giocatori compatibili con segnali disponibili.':'Il dataset della giornata non contiene ancora i segnali giocatore. Verrà popolato dal prossimo aggiornamento automatico.'}</p></section>`;
  return hero('GIORNATA', publicDataset?.matchday ? `Giornata ${publicDataset.matchday}` : 'La mia giornata','Analisi esterna, compatibilità Mantra e miglior formazione spiegata.', '<button class="primary-btn" id="refresh-public-data">Aggiorna dati</button>') +
    `<section class="dashboard-grid"><article class="stat-card"><span>Rosa</span><strong>${squad.length}</strong><small>giocatori salvati</small></article><article class="stat-card"><span>Dati giornata</span><strong>${dataState}</strong><small>ultimo: ${escapeHtml(updated)}</small></article><article class="stat-card accent"><span>Moduli validi</span><strong>${recommendations.length}</strong><small>analizzati automaticamente</small></article></section>` + analysis;
}

function renderPitch() {
  const formation = getFormation(formationId);
  return `
  ${hero('FORMAZIONE','Campo Mantra','Tocca una casella: vedrai soltanto i giocatori compatibili.')}
  <section class="toolbar card"><label>Modulo <select id="formation-select">${FORMATIONS.map(f => `<option value="${f.id}" ${f.id===formationId?'selected':''}>${f.name}</option>`).join('')}</select></label><button class="ghost-btn" id="clear-lineup">Svuota</button></section>
  <section class="formation-layout">
    <div class="pitch" aria-label="Campo Mantra">
      <div class="pitch-line half"></div><div class="pitch-circle"></div>
      ${formation.slots.map(slot => {
        const player = playerById(lineup[slot.id]);
        return `<button class="pitch-slot ${player?'filled':''}" data-slot="${slot.id}" style="left:${slot.x}%;top:${slot.y}%"><span class="slot-role">${slot.label}</span><strong>${player ? escapeHtml(player.name) : '+'}</strong>${player?`<small>${escapeHtml(player.roles.join('/'))}</small>`:''}</button>`;
      }).join('')}
    </div>
    <aside class="squad-panel card"><div class="section-head"><div><span class="eyebrow">ROSA</span><h3>${squad.length ? 'Disponibili' : 'Nessun giocatore'}</h3></div><button class="ghost-btn" data-nav="rosa">Gestisci</button></div>${squad.length ? squad.map(p=>`<div class="mini-player"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.club)}</span></div><b>${escapeHtml(p.roles.join('/'))}</b></div>`).join('') : '<p class="muted">Aggiungi prima i giocatori nella sezione Rosa.</p>'}</aside>
  </section>
  ${pickerSlot ? renderPicker(formation) : ''}`;
}

function renderPicker(formation) {
  const slot = formation.slots.find(s => s.id === pickerSlot);
  const eligible = eligiblePlayersForSlot(squad, slot, lineup);
  const current = playerById(lineup[pickerSlot]);
  return `<div class="modal-backdrop" data-close-picker><div class="picker card" role="dialog" aria-modal="true"><div class="section-head"><div><span class="eyebrow">${slot.label}</span><h3>Scegli giocatore</h3></div><button class="icon-btn" data-close-picker>×</button></div>${current?`<button class="picker-option danger" data-remove-slot="${slot.id}">Rimuovi ${escapeHtml(current.name)}</button>`:''}${eligible.length ? eligible.map(p=>`<button class="picker-option" data-pick="${p.id}"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.club)}</span></div><b>${escapeHtml(p.roles.join('/'))}</b></button>`).join('') : '<p class="muted">Nessun altro giocatore compatibile disponibile.</p>'}</div></div>`;
}

function renderRosa() {
  const editing=playerById(editingPlayerId);
  return `${hero('ROSA','La mia rosa','I dati restano in questo browser. Puoi esportarli e importarli su un altro dispositivo.')}
  <section class="two-col"><form id="player-form" class="card form-card"><div class="section-head"><div><span class="eyebrow">${editing?'MODIFICA':'NUOVO'}</span><h3>${editing?'Modifica giocatore':'Aggiungi giocatore'}</h3></div>${editing?'<button class="ghost-btn" type="button" id="cancel-edit">Annulla</button>':''}</div><label>Nome<input name="name" required placeholder="Es. Pulisic" value="${escapeHtml(editing?.name||'')}"></label><label>Squadra<input name="club" required placeholder="Es. Milan" value="${escapeHtml(editing?.club||'')}"></label><fieldset><legend>Ruoli Mantra</legend><div class="role-grid">${MANTRA_ROLES.map(r=>`<label class="role-chip"><input type="checkbox" name="role" value="${r}" ${editing?.roles?.includes(r)?'checked':''}><span>${r}</span></label>`).join('')}</div></fieldset><label>Prezzo acquisto<input name="price" type="number" min="0" step="1" placeholder="Opzionale" value="${editing?.purchasePrice??''}"></label><button class="primary-btn" type="submit">${editing?'Salva modifiche':'Aggiungi alla rosa'}</button></form>
  <section class="card list-card"><div class="section-head"><div><span class="eyebrow">GIOCATORI</span><h3>${squad.length} in rosa</h3></div><div class="inline-actions"><button class="ghost-btn" id="export-squad">Esporta</button><label class="ghost-btn file-label">Importa<input id="import-squad" type="file" accept="application/json"></label></div></div><div class="player-list">${squad.length?squad.map(p=>`<article class="player-row"><div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.club)} · ${escapeHtml(p.roles.join('/'))}${p.purchasePrice!=null?` · ${p.purchasePrice} cr`:''}</span></div><div class="inline-actions"><button class="ghost-btn" data-edit-player="${p.id}">Modifica</button><button class="icon-btn" data-delete-player="${p.id}" aria-label="Elimina">×</button></div></article>`).join(''):'<div class="empty-inline">La rosa è vuota.</div>'}</div></section></section>`;
}

function renderAsta() {
  const issues=analyzeSquadCoverage(squad,FORMATIONS);
  return hero('ASTA','Simulatore rosa','Controlla subito coperture, criticità e flessibilità della tua rosa.') + `<section class="card issue-list">${issues.map(i=>`<article class="issue ${i.severity}"><span>${i.severity==='critical'?'!':i.severity==='warning'?'△':'✓'}</span><p>${escapeHtml(i.message)}</p></article>`).join('')}</section>`;
}

function render() {
  const page = active==='formazione'?renderPitch():active==='rosa'?renderRosa():active==='asta'?renderAsta():renderGiornata();
  app.innerHTML = shell(page);
  bindEvents();
}

function bindEvents() {
  app.querySelectorAll('[data-nav]').forEach(btn => btn.addEventListener('click', () => { active=btn.dataset.nav; pickerSlot=null; render(); }));
  app.querySelector('#formation-select')?.addEventListener('change', e => { formationId=e.target.value; localStorage.setItem('mantra-lab:formation', formationId); lineup={}; render(); });
  app.querySelector('#clear-lineup')?.addEventListener('click', () => { lineup={}; render(); });
  app.querySelectorAll('[data-slot]').forEach(btn => btn.addEventListener('click', () => { pickerSlot=btn.dataset.slot; render(); }));
  app.querySelectorAll('[data-close-picker]').forEach(el => el.addEventListener('click', e => { if(e.target===el || el.matches('.icon-btn')){ pickerSlot=null; render(); }}));
  app.querySelectorAll('[data-pick]').forEach(btn => btn.addEventListener('click', () => { const p=playerById(btn.dataset.pick); lineup=setLineupPlayer(lineup,pickerSlot,p); pickerSlot=null; render(); }));
  app.querySelectorAll('[data-remove-slot]').forEach(btn => btn.addEventListener('click', () => { delete lineup[btn.dataset.removeSlot]; pickerSlot=null; render(); }));
  app.querySelector('#player-form')?.addEventListener('submit', e => { e.preventDefault(); const fd=new FormData(e.currentTarget); const roles=fd.getAll('role'); if(!roles.length){alert('Seleziona almeno un ruolo Mantra.');return;} squad=upsertSquadPlayer(squad,{name:fd.get('name'),club:fd.get('club'),roles,purchasePrice:fd.get('price')},editingPlayerId); editingPlayerId=null; persist(); render(); });
  app.querySelector('#cancel-edit')?.addEventListener('click',()=>{editingPlayerId=null;render();});
  app.querySelectorAll('[data-edit-player]').forEach(btn=>btn.addEventListener('click',()=>{editingPlayerId=btn.dataset.editPlayer;render();}));
  app.querySelectorAll('[data-delete-player]').forEach(btn => btn.addEventListener('click', () => { const id=btn.dataset.deletePlayer; squad=squad.filter(p=>p.id!==id); if(editingPlayerId===id) editingPlayerId=null; Object.keys(lineup).forEach(k=>{if(lineup[k]===id) delete lineup[k]}); persist(); render(); }));
  app.querySelector('#export-squad')?.addEventListener('click', () => { const blob=new Blob([exportSquad(squad)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mantra-lab-rosa.json'; a.click(); URL.revokeObjectURL(a.href); });
  app.querySelector('#import-squad')?.addEventListener('change', async e => { const file=e.target.files?.[0]; if(!file)return; try{squad=importSquad(await file.text());persist();lineup={};render();}catch(err){alert(err.message);} });
  app.querySelector('#refresh-public-data')?.addEventListener('click', () => refreshPublicData());
  app.querySelectorAll('[data-use-recommendation]').forEach(btn => btn.addEventListener('click', () => {
    const recommendations = publicDataset ? recommendLineups(squad, publicDataset) : [];
    const selected = recommendations[Number(btn.dataset.useRecommendation)];
    if (!selected) return;
    formationId=selected.formationId; lineup={...selected.assignments}; localStorage.setItem('mantra-lab:formation',formationId); active='formazione'; render();
  }));
}

async function refreshPublicData() {
  publicDataLoading=true; publicDataError=null; render();
  const result=await loadPublicData();
  publicDataset=result.dataset; publicDataError=result.error; publicDataLoading=false; render();
}

render();
refreshPublicData();
