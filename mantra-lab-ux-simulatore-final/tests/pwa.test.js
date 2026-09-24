import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

test('manifest PWA dichiara icone 192 e 512', async () => {
  const m=JSON.parse(await readFile('public/manifest.webmanifest','utf8'));
  assert.ok(m.icons.some(i=>i.sizes==='192x192'));
  assert.ok(m.icons.some(i=>i.sizes==='512x512'));
});

test('pagina dichiara apple touch icon e modalità web app iOS', async () => {
  const html=await readFile('index.html','utf8');
  assert.match(html,/apple-touch-icon/);
  assert.match(html,/apple-mobile-web-app-capable/);
});

test('icone PWA esistono e non sono vuote', async () => {
  for (const p of ['public/icons/icon-192.png','public/icons/icon-512.png']) {
    assert.ok((await stat(p)).size > 1000, p);
  }
});
