import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseSeasonStats, parseMatchdayVotes } from '../scripts/sources/fantacalcioStatsSource.mjs';

test('parses season totals averages and avatar', async()=>{
 const html=await readFile('tests/fixtures/fantacalcio/player-stats.html','utf8');
 const [p]=parseSeasonStats(html);
 assert.equal(p.sourceId,'101');assert.match(p.profileUrl,/pulisic\/2423/);assert.equal(p.name,'Pulisic');assert.equal(p.club,'MIL');assert.equal(p.avatarUrl,'https://img.example/pulisic.png');assert.equal(p.seasonStats.averageRating,7);assert.equal(p.seasonStats.fantasyAverage,8.75);assert.equal(p.seasonStats.goals,1);assert.equal(p.seasonStats.assists,1);
});

test('parses official matchday votes and status', async()=>{
 const html=await readFile('tests/fixtures/fantacalcio/votes.html','utf8');
 const rows=parseMatchdayVotes(html);
 assert.equal(rows.matchday,5);assert.equal(rows.players[0].status,'starter');assert.equal(rows.players[1].status,'sub');assert.equal(rows.players[0].fantasyRating,10);
});

test('parses Fantacalcio table with decorative columns before player name',()=>{
 const html=`<table><tr><th>Calciatore</th><th></th><th></th><th></th><th>Sq</th><th>PV</th><th>MV</th><th>FM</th><th>Gol</th><th>GS</th><th>Rig</th><th>RP</th><th>Ass</th><th>Amm</th><th>Esp</th></tr><tr><td></td><td></td><td></td><td>Pulisic</td><td>MIL</td><td>2</td><td>7,0</td><td>8,75</td><td>1</td><td>0</td><td>0 / 0</td><td>0</td><td>1</td><td>1</td><td>0</td></tr></table>`;
 const [p]=parseSeasonStats(html);
 assert.equal(p.name,'Pulisic');assert.equal(p.club,'MIL');assert.equal(p.seasonStats.assists,1);
});

test('prefers player photo over decorative icons',()=>{
 const html=`<table><tr><th>Calciatore</th><th></th><th></th><th></th><th>Sq</th><th>PV</th><th>MV</th><th>FM</th><th>Gol</th><th>GS</th><th>Rig</th><th>RP</th><th>Ass</th><th>Amm</th><th>Esp</th></tr><tr><td><img src="https://x/icon-role.svg"></td><td><img src="https://x/players/pulisic.png"></td><td></td><td>Pulisic</td><td>MIL</td><td>2</td><td>7</td><td>8</td><td>1</td><td>0</td><td>0/0</td><td>0</td><td>1</td><td>0</td><td>0</td></tr></table>`;
 const [p]=parseSeasonStats(html);assert.equal(p.avatarUrl,'https://x/players/pulisic.png');
});
