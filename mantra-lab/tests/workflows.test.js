import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('deploy Pages viene rieseguito anche dopo i workflow di aggiornamento dati', async()=>{
  const yaml=await readFile(new URL('../../.github/workflows/deploy-pages.yml', import.meta.url),'utf8');
  assert.match(yaml,/workflow_run:/);
  assert.match(yaml,/Update matchday data/);
  assert.match(yaml,/Update player stats/);
  assert.match(yaml,/upload-pages-artifact/);
  assert.match(yaml,/deploy-pages/);
});
