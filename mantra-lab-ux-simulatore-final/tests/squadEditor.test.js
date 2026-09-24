import test from 'node:test';
import assert from 'node:assert/strict';
import { upsertSquadPlayer } from '../src/domain/squadEditor.js';

test('aggiunge un nuovo giocatore con id stabile',()=>{
  const out=upsertSquadPlayer([], {name:'Pulisic',club:'Milan',roles:['T','A'],purchasePrice:30}, null, ()=> 'new-id');
  assert.equal(out.length,1);
  assert.equal(out[0].id,'new-id');
  assert.equal(out[0].active,true);
});

test('modifica un giocatore esistente senza cambiare id',()=>{
  const start=[{id:'p1',name:'Pulisic',club:'Milan',roles:['T'],active:true,purchasePrice:30}];
  const out=upsertSquadPlayer(start,{name:'Christian Pulisic',club:'Milan',roles:['T','A'],purchasePrice:35},'p1');
  assert.equal(out[0].id,'p1');
  assert.equal(out[0].name,'Christian Pulisic');
  assert.deepEqual(out[0].roles,['T','A']);
  assert.equal(out[0].purchasePrice,35);
});
