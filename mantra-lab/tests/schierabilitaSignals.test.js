import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveStatSignals, combineConfidence } from '../src/domain/schierabilitaSignals.js';

const player = { id:'p1', name:'Test', club:'ROM', roles:['Pc'] };
const stats = overrides => ({
  seasonStats:{ appearances:5, ratedMatches:5, averageRating:6.2, fantasyAverage:7.1, goals:2, assists:1, penaltiesScored:0, penaltiesTotal:0 },
  matchdays:[],
  ...overrides
});

test('three recent rated matchdays produce a non-neutral recent form', () => {
  const result=deriveStatSignals(player,stats({matchdays:[
    {matchday:1,rating:6.5,fantasyRating:6.5},
    {matchday:2,rating:7,fantasyRating:10},
    {matchday:3,rating:6.8,fantasyRating:9.8}
  ]}));
  assert.notEqual(result.signals.recentForm,50);
  assert.ok(result.signals.recentForm>50);
});

test('fewer than three rated games overall falls back to neutral recent form', () => {
  const result=deriveStatSignals(player,stats({
    seasonStats:{appearances:2,ratedMatches:2,averageRating:7.8,fantasyAverage:11,goals:2,assists:0,penaltiesScored:0,penaltiesTotal:0},
    matchdays:[{matchday:1,rating:8,fantasyRating:11},{matchday:2,rating:7.5,fantasyRating:10}]
  }));
  assert.equal(result.signals.recentForm,50);
  assert.ok(result.reasons.some(x=>/campione/i.test(x)));
});

test('missing and null rating values are ignored rather than treated as zero', () => {
  const result=deriveStatSignals(player,stats({
    seasonStats:{appearances:4,ratedMatches:4,averageRating:6.4,fantasyAverage:6.8,goals:0,assists:1,penaltiesScored:null,penaltiesTotal:null},
    matchdays:[{matchday:1,rating:null,fantasyRating:null},{matchday:2},{matchday:3,rating:6.4,fantasyRating:6.8}]
  }));
  assert.ok(result.signals.recentForm>=45);
  assert.ok(result.signals.recentForm<=70);
});

test('same production is valued relative to role expectations', () => {
  const common=stats({seasonStats:{appearances:6,ratedMatches:6,averageRating:6.2,fantasyAverage:7.2,goals:1,assists:1,penaltiesScored:0,penaltiesTotal:0}});
  const defender=deriveStatSignals({...player,roles:['Dc']},common,['Dc']);
  const striker=deriveStatSignals({...player,roles:['Pc']},common,['Pc']);
  assert.ok(defender.signals.bonusPotential>striker.signals.bonusPotential);
});

test('one or two appearances regress bonus potential strongly toward neutral', () => {
  const result=deriveStatSignals(player,stats({seasonStats:{appearances:2,ratedMatches:2,averageRating:8,fantasyAverage:12,goals:2,assists:1,penaltiesScored:0,penaltiesTotal:0}}));
  assert.ok(result.signals.bonusPotential>50);
  assert.ok(result.signals.bonusPotential<75);
  assert.ok(result.reasons.some(x=>/campione/i.test(x)));
});

test('zero appearances keep bonus potential neutral', () => {
  const result=deriveStatSignals(player,stats({seasonStats:{appearances:0,ratedMatches:0,averageRating:null,fantasyAverage:null,goals:0,assists:0,penaltiesScored:0,penaltiesTotal:0}}));
  assert.equal(result.signals.bonusPotential,50);
});

test('verified penalty attempts raise set pieces while no evidence stays neutral', () => {
  const withPenalty=deriveStatSignals(player,stats({seasonStats:{appearances:5,ratedMatches:5,averageRating:6.2,fantasyAverage:7,goals:1,assists:0,penaltiesScored:1,penaltiesTotal:1}}));
  const withoutPenalty=deriveStatSignals(player,stats({seasonStats:{appearances:5,ratedMatches:5,averageRating:6.2,fantasyAverage:7,goals:1,assists:0,penaltiesScored:0,penaltiesTotal:0}}));
  assert.ok(withPenalty.signals.setPieces>50);
  assert.equal(withoutPenalty.signals.setPieces,50);
});

test('confidence reflects sample size and neutral statistical components', () => {
  assert.equal(combineConfidence({sampleGames:5,confidenceParts:{recentForm:'high',bonusPotential:'high',setPieces:'medium'}}),'alta');
  assert.equal(combineConfidence({sampleGames:3,confidenceParts:{recentForm:'medium',bonusPotential:'medium',setPieces:'low'}}),'media');
  assert.equal(combineConfidence({sampleGames:5,confidenceParts:{recentForm:'low',bonusPotential:'low',setPieces:'low'}}),'bassa');
});
