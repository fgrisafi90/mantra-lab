import test from 'node:test';
import assert from 'node:assert/strict';
const domain = await import('../src/domain/playerTiers.js');
const storageModule = await import('../src/storage/playerPreferences.js');
const defender={catalogId:'juve:bremer',fantacalcioId:2788,name:'Bremer',club:'Juventus',roles:['Dc'],fvm:80};
test('fasce per ruolo: un difensore e una punta con FVM uguale non sono equivalenti',()=>{
 assert.equal(typeof domain.playerTier,'function');
 assert.equal(domain.playerTier(defender,{}).tier,'top');
 assert.notEqual(domain.playerTier({...defender,fantacalcioId:999,name:'Altro',roles:['Pc']},{}).tier,'top');
});
test('fascia e tetto personali sopravvivono ad aggiornamento FVM e trasferimento',()=>{
 assert.equal(typeof domain.updatePreference,'function');
 const prefs=domain.updatePreference({},defender,{tier:'rimpiazzo',cap:0});
 const changed={...defender,catalogId:'milan:bremer',club:'Milan',fvm:120};
 const result=domain.playerTier(changed,prefs);
 assert.equal(result.tier,'rimpiazzo');assert.equal(result.cap,0);assert.equal(changed.fvm,120);
});
test('cancellare il tetto ripristina la proposta senza perdere la fascia personale',()=>{
 assert.equal(typeof domain.updatePreference,'function');
 let prefs=domain.updatePreference({},defender,{tier:'semitop',cap:10});
 prefs=domain.updatePreference(prefs,defender,{cap:null});
 const result=domain.playerTier(defender,prefs,500);
 assert.equal(result.tier,'semitop');assert.equal(result.cap,40);
 assert.throws(()=>domain.updatePreference(prefs,defender,{cap:-1}));
 assert.throws(()=>domain.updatePreference(prefs,defender,{cap:1.5}));
 assert.throws(()=>domain.updatePreference(prefs,defender,{tier:'inventata'}));
});
test('preferenze persistono separatamente dalla rosa e dalle simulazioni',()=>{
 assert.equal(typeof storageModule.savePlayerPreferences,'function');
 const map=new Map([['mantra-lab:squad:v1','non modificare']]);
 const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 const prefs=domain.updatePreference({},defender,{tier:'top',cap:45});
 storageModule.savePlayerPreferences(prefs,storage);
 assert.deepEqual(storageModule.loadPlayerPreferences(storage),prefs);
 assert.equal(map.get('mantra-lab:squad:v1'),'non modificare');
});
test('dati di preferenze corrotti non bloccano apertura',()=>{
 assert.equal(typeof storageModule.loadPlayerPreferences,'function');
 assert.deepEqual(storageModule.loadPlayerPreferences({getItem:()=>'{no'}),{});
 assert.deepEqual(storageModule.loadPlayerPreferences({getItem:()=>'{"fc:2788":{"tier":"bad","cap":-1}}'}),{});
});

test('portieri usano il ruolo Mantra P e budget zero resta zero',()=>{assert.equal(domain.playerTier({roles:['P'],fvm:70,name:'Portiere'}).tier,'top');assert.equal(domain.playerTier({roles:['P'],fvm:70,name:'Portiere'},{},0).cap,0);});
