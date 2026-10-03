import test from 'node:test';
import assert from 'node:assert/strict';
import { renderSchierabilita, renderRecommendation } from '../src/ui/schierabilita.js';

const rows=[
 {player:{id:'a',name:'<b>Rossi</b>',roles:['T'],club:'ROM'},score:78,confidence:'alta',excluded:false,opponent:'Lazio',home:true,positives:['Forma recente positiva'],negatives:[]},
 {player:{id:'b',name:'Bianchi',roles:['M'],club:'MIL'},score:61,confidence:'media',excluded:false,positives:[],negatives:['Campione statistico ridotto']},
 {player:{id:'c',name:'Verdi',roles:['Dc'],club:'JUV'},score:54,confidence:'bassa',excluded:false,positives:[],negatives:['Dati piazzati non verificati']},
 {player:{id:'d',name:'Neri',roles:['P'],club:'NAP'},score:null,confidence:'insufficiente',excluded:true,positives:[],negatives:['Dati insufficienti per una stima']}
];

test('schierabilita renders confidence labels and explicit insufficient data without obsolete neutral-copy',()=>{
  const html=renderSchierabilita(rows,6);
  assert.match(html,/Alta/); assert.match(html,/Media/); assert.match(html,/Bassa/);
  assert.match(html,/Dati insufficienti/);
  assert.doesNotMatch(html,/Forma recente e piazzati valgono 50\/100/);
});

test('schierabilita escapes player names',()=>{
  const html=renderSchierabilita(rows,6);
  assert.match(html,/&lt;b&gt;Rossi&lt;\/b&gt;/);
  assert.doesNotMatch(html,/<b>Rossi<\/b>/);
});

test('recommendation renders starter slot score confidence and first legal alternative delta',()=>{
  const squad=[{id:'p',name:'Portiere',roles:['P']},{id:'alt',name:'Riserva <T>',roles:['P']}];
  const rec={formationId:'4-2-3-1',normalizedScore:76,assignments:{p:'p'},alternativesBySlot:{p:{playerId:'alt',score:70,delta:-6}},explanation:['Motivo'],preferredFormationIssue:null};
  const html=renderRecommendation([rec],squad,[{player:squad[0],score:76,confidence:'alta'}]);
  assert.match(html,/P · Portiere/);
  assert.match(html,/76\/100/);
  assert.match(html,/Alta/);
  assert.match(html,/Riserva &lt;T&gt;/);
  assert.match(html,/Δ -6/);
});

test('recommendation explains preferred formation fallback',()=>{
  const rec={formationId:'4-3-3',normalizedScore:71,assignments:{},alternativesBySlot:{},explanation:[],preferredFormationIssue:{formationId:'4-2-3-1',reasons:['T: nessun giocatore compatibile']}};
  const html=renderRecommendation([rec],[],[]);
  assert.match(html,/Perché non 4-2-3-1/);
  assert.match(html,/T: nessun giocatore compatibile/);
});

test('existing two-argument schierabilita render also exposes the detailed 4-2-3-1 recommendation',()=>{
  const roleRows=[
    ['p',['P']],['dd',['Dd']],['dc1',['Dc']],['dc2',['Dc']],['ds',['Ds']],
    ['m',['M']],['c',['C']],['w',['W']],['t',['T']],['a',['A']],['pc',['Pc']]
  ].map(([id,roles],i)=>({player:{id,name:id,club:'ROM',roles,active:true},score:70+i,confidence:'alta',excluded:false,positives:[],negatives:[]}));
  const html=renderSchierabilita(roleRows,6);
  assert.match(html,/FORMAZIONE CONSIGLIATA/);
  assert.match(html,/4-2-3-1/);
  assert.match(html,/recommendation-lineup/);
});
