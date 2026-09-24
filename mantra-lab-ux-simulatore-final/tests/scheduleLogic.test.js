import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRefreshMatchday } from '../scripts/scheduleLogic.mjs';

const fixtures=(dates)=>dates.map((kickoff,i)=>({id:String(i),kickoff,played:false}));

test('Friday-Sunday round refreshes Thursday, then Saturday and Sunday but not Friday itself',()=>{
  const f=fixtures(['2026-09-25T18:00:00+02:00','2026-09-26T18:00:00+02:00','2026-09-27T20:45:00+02:00']);
  assert.equal(shouldRefreshMatchday({now:'2026-09-24T08:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-09-25T08:00:00+02:00',fixtures:f}),false);
  assert.equal(shouldRefreshMatchday({now:'2026-09-26T08:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-09-27T08:00:00+02:00',fixtures:f}),true);
});

test('Thursday-Sunday round refreshes Wednesday and every day after first match day',()=>{
  const f=fixtures(['2026-10-01T20:45:00+02:00','2026-10-03T18:00:00+02:00','2026-10-04T20:45:00+02:00']);
  assert.equal(shouldRefreshMatchday({now:'2026-09-30T09:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-02T09:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-03T09:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-04T09:00:00+02:00',fixtures:f}),true);
});

test('Saturday-Monday round refreshes Friday, Sunday and Monday',()=>{
  const f=fixtures(['2026-10-10T18:00:00+02:00','2026-10-11T15:00:00+02:00','2026-10-12T20:45:00+02:00']);
  assert.equal(shouldRefreshMatchday({now:'2026-10-09T07:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-10T07:00:00+02:00',fixtures:f}),false);
  assert.equal(shouldRefreshMatchday({now:'2026-10-11T07:00:00+02:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-12T07:00:00+02:00',fixtures:f}),true);
});

test('midweek round works without weekday assumptions',()=>{
  const f=fixtures(['2026-10-27T18:30:00+01:00','2026-10-28T20:45:00+01:00','2026-10-29T20:45:00+01:00']);
  assert.equal(shouldRefreshMatchday({now:'2026-10-26T10:00:00+01:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-28T10:00:00+01:00',fixtures:f}),true);
  assert.equal(shouldRefreshMatchday({now:'2026-10-29T10:00:00+01:00',fixtures:f}),true);
});

test('does not refresh after all fixtures are played or twice on same day',()=>{
  const f=fixtures(['2026-10-10T18:00:00+02:00','2026-10-12T20:45:00+02:00']);
  assert.equal(shouldRefreshMatchday({now:'2026-10-13T07:00:00+02:00',fixtures:f.map(x=>({...x,played:true}))}),false);
  assert.equal(shouldRefreshMatchday({now:'2026-10-12T12:00:00+02:00',fixtures:f,lastRefreshAt:'2026-10-12T07:00:00+02:00'}),false);
});
