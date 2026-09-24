import test from 'node:test';
import assert from 'node:assert/strict';
import { scorePlayer } from '../src/domain/matchdayScore.js';

const base = {
  availability: 100, expectedMinutes: 100, recentForm: 100,
  opponentContext: 100, bonusPotential: 100, setPieces: 100,
  homeAwayContext: 100, tacticalOpportunity: 100,
  unavailable: false, majorDoubt: false
};

test('perfect signals score 100 with configured weights', () => {
  assert.equal(scorePlayer(base).score, 100);
});

test('confirmed unavailable player is hard excluded', () => {
  const result = scorePlayer({ ...base, unavailable: true });
  assert.equal(result.score, 0);
  assert.ok(result.negatives.some(x => /indisponibile/i.test(x)));
});

test('major doubt materially reduces otherwise identical score', () => {
  const safe = scorePlayer({ ...base, recentForm: 70 });
  const doubt = scorePlayer({ ...base, recentForm: 70, majorDoubt: true });
  assert.ok(safe.score - doubt.score >= 12);
});

test('score is always clamped between 0 and 100', () => {
  assert.equal(scorePlayer({ ...base, recentForm: 999 }).score, 100);
  assert.equal(scorePlayer({ ...base, availability: -999, expectedMinutes: -999, recentForm: 0, opponentContext:0, bonusPotential:0, setPieces:0, homeAwayContext:0, tacticalOpportunity:0 }).score, 0);
});
