import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeSquadCoverage } from '../src/domain/squadCoverage.js';
import { FORMATIONS } from '../src/domain/formations.js';

const p=(id,roles,price)=>({id,name:id,club:'X',roles,active:true,...(price!=null?{purchasePrice:price}:{})});

test('flags missing E coverage as critical for back-three options', () => {
  const issues=analyzeSquadCoverage([p('m',['M']),p('c',['C'])],FORMATIONS);
  assert.ok(issues.some(i=>i.severity==='critical' && /\bE\b/.test(i.message)));
});

test('recognizes strong M/C coverage', () => {
  const issues=analyzeSquadCoverage([p('m1',['M']),p('m2',['M','C']),p('c1',['C']),p('c2',['C','T'])],FORMATIONS);
  assert.ok(issues.some(i=>i.severity==='info' && /M\/C/.test(i.message)));
});

test('reports multi-role flexibility and budget spent', () => {
  const issues=analyzeSquadCoverage([p('x',['E','W'],12),p('y',['T','A'],18)],FORMATIONS);
  assert.ok(issues.some(i=>/2 giocatori multiruolo/i.test(i.message)));
  assert.ok(issues.some(i=>/30 crediti/i.test(i.message)));
});
