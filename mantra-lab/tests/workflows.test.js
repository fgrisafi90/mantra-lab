import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('deploy Pages viene rieseguito anche dopo il workflow di aggiornamento dati', async()=>{
  const yaml=await readFile('.github/workflows/deploy-pages.yml','utf8');
  assert.match(yaml,/workflow_run:/);
  assert.match(yaml,/Update matchday data/);
});
