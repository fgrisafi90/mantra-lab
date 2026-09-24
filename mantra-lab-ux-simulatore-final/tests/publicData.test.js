import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMatchdayDataset, isDatasetStale, playerSignalsFromDataset } from '../src/data/publicData.js';

const valid={generatedAt:'2026-09-24T08:00:00Z',matchday:6,fixtures:[],players:[{name:'Pulisic',club:'Milan',signals:{availability:90,expectedMinutes:85,recentForm:80,opponentContext:60,bonusPotential:80,setPieces:75,homeAwayContext:60,tacticalOpportunity:80,unavailable:false,majorDoubt:false}}],sources:[]};

test('parses valid matchday dataset and rejects malformed payloads',()=>{
  assert.equal(parseMatchdayDataset(valid).matchday,6);
  assert.throws(()=>parseMatchdayDataset({players:[]}),/dataset/i);
});

test('freshness reports stale data after configured age',()=>{
  assert.equal(isDatasetStale(valid,'2026-09-24T20:00:00Z',36),false);
  assert.equal(isDatasetStale(valid,'2026-09-26T00:00:01Z',36),true);
});

test('matches external signals to squad player by normalized name and club',()=>{
  const signals=playerSignalsFromDataset({name:'Christian Pulisic',club:'Milan'},valid);
  assert.equal(signals?.recentForm,80);
});

test('abbina un nome univoco anche se il club è scritto in modo diverso',()=>{
  const dataset={players:[{name:'Mario Rossi',club:'Hellas Verona',signals:{availability:80,expectedMinutes:80}}]};
  const signals=playerSignalsFromDataset({name:'Mario Rossi',club:'Verona'},dataset);
  assert.equal(signals.availability,80);
});
