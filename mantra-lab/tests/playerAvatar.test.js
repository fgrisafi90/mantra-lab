import test from 'node:test';
import assert from 'node:assert/strict';
import { renderPlayerAvatar } from '../src/ui/playerAvatar.js';

test('avatar uses lazy image and fallback initials',()=>{
 const html=renderPlayerAvatar({name:'Christian Pulisic',avatarUrl:'https://img.test/p.jpg'});
 assert.match(html,/loading="lazy"/);assert.match(html,/CP/);assert.match(html,/data-avatar-img/);
});
test('missing avatar renders fallback',()=>{assert.match(renderPlayerAvatar({name:'Pulisic'}),/>P</);});
