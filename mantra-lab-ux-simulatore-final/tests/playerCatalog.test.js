import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMantraListMarkdown, filterCatalog, sortCatalog, playerToSquadDraft } from '../src/data/playerCatalog.js';

const SAMPLE = `# Listone Fantacalcio MANTRA 2026-27

## Ruolo: T/A (2 calciatori)

| Nome | Squadra | Quota | FVM |
|------|---------|-------|-----|
| Pulisic | Milan | 23 | 150 |
| Nico Paz | Como | 28 | 248 |

## Ruolo: Dd/Ds/E (1 calciatori)

| Nome | Squadra | Quota | FVM |
|------|---------|-------|-----|
| Cambiaso | Juventus | 10 | 8 |
`;

test('parses headings as exact Mantra roles', () => {
  const players = parseMantraListMarkdown(SAMPLE);
  assert.equal(players.length, 3);
  const pulisic=players.find(p=>p.name==='Pulisic');
  const cambiaso=players.find(p=>p.name==='Cambiaso');
  assert.deepEqual(pulisic, { catalogId:'milan:pulisic', name:'Pulisic', club:'Milan', roles:['T','A'], quotation:23, fvm:150 });
  assert.deepEqual(cambiaso.roles, ['Dd','Ds','E']);
});

test('filters by search, role and club', () => {
  const players = parseMantraListMarkdown(SAMPLE);
  assert.equal(filterCatalog(players,{search:'puli'}).length,1);
  assert.equal(filterCatalog(players,{role:'E'}).length,1);
  assert.equal(filterCatalog(players,{club:'Como'}).length,1);
});

test('maps catalog player to squad draft', () => {
  const player = parseMantraListMarkdown(SAMPLE).find(p=>p.name==='Pulisic');
  assert.deepEqual(playerToSquadDraft(player), {name:'Pulisic', club:'Milan', roles:['T','A'], purchasePrice:''});
});

test('parses goalkeeper prose and normalizes Por to P', () => {
  const sample = `# Portieri — Fantacalcio Mantra 2026-27\nTotale: 2 calciatori\n\nSvilar gioca nel Roma, ruolo Mantra Por, quotazione 18 crediti, FVM 16.\nMaignan gioca nel Milan, ruolo Mantra Por, quotazione 15 crediti, FVM 13.`;
  const players = parseMantraListMarkdown(sample);
  assert.equal(players.length, 2);
  assert.deepEqual(players[0].roles, ['P']);
  assert.ok(players.some(p => p.name === 'Svilar' && p.club === 'Roma' && p.quotation === 18 && p.fvm === 16));
});


test('sorts catalogue by current quotation from highest to lowest', () => {
  const players = parseMantraListMarkdown(SAMPLE);
  const sorted = sortCatalog(players, 'quotation-desc');
  assert.deepEqual(sorted.map(p => p.quotation), [28, 23, 10]);
});
