# FG Mantra Schierabilità V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere la schermata Giornata di FG Mantra capace di fondere dati prepartita e statistiche giocatore, mostrare score 0–100 con confidenza, privilegiare il 4-2-3-1 quando legalmente schierabile e proporre alternative Mantra realmente valide.

**Architecture:** Manteniamo i workflow e l'optimizer esistenti. Un nuovo modulo di dominio deriva segnali statistici normalizzati e confidenza da `player-stats.json`; `schierabilita.js` li fonde con `current-matchday.json`; l'optimizer viene esteso per alternative e panchina; la UI consuma solo output già spiegato dal dominio.

**Tech Stack:** JavaScript ES modules, Node.js 20, `node:test`, HTML/CSS dependency-free, GitHub Pages/GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-03-fg-mantra-schierabilita-v2-design.md`

## Global Constraints

- Nessuna nuova dipendenza npm, database, autenticazione o sincronizzazione cloud.
- Conservare i workflow esistenti `update-data.yml` e `update-player-stats.yml` e l'ultimo dataset valido quando una fonte fallisce.
- Pesi score: disponibilità/minutaggio 30%, forma 20%, avversario 15%, bonus 15%, piazzati 10%, casa/trasferta 5%, opportunità tattica 5%.
- Forma: ultime 5 giornate; almeno 3 gare recenti per usarle; altrimenti fallback stagionale con almeno 3 gare valutate; sotto 3 gare complessive valore 50 con confidenza bassa.
- Bonus: 5+ presenze pienamente utilizzabile; 3–4 confidenza media; 1–2 forte regressione verso 50; 0 fallback 50.
- Piazzati: aumentare solo con `penaltiesTotal > 0`; senza evidenza restare a 50 con confidenza bassa.
- `unavailable=true` esclude; `majorDoubt=true` mantiene la penalità; `sampleGames <= 0` rende lo score insufficiente.
- Confidenza: `alta`, `media`, `bassa`, `insufficiente`; non modifica lo score nella V2.
- 4-2-3-1 principale quando completabile legalmente con 11 score validi; altrimenti migliore modulo alternativo con spiegazione.
- Nessuna falsa precisione: dati essenziali mancanti, stantii, ambigui o partita iniziata/conclusa producono nessuno score.

## Review Focus

- Nomi/club equivalenti tra dataset (`INT` vs `Internazionale`, accenti, abbreviazioni) devono fare match solo quando univoci.
- Valori `null`, stringhe numeriche o statistiche mancanti non devono essere interpretati come zero negativo.
- Campioni di 1–2 presenze non devono generare forma/bonus estremi.
- Un'alternativa deve essere valida dopo ricomposizione completa del modulo, non solo compatibile con una singola casella.
- Se il 4-2-3-1 è incompleto, la UI deve spiegare il motivo senza bloccare moduli alternativi validi.

---

### Task 1: Derivatore dei segnali statistici

**Files:**
- Create: `mantra-lab/src/domain/schierabilitaSignals.js`
- Create: `mantra-lab/tests/schierabilitaSignals.test.js`
- Reuse: `mantra-lab/src/domain/playerStats.js`

**Interfaces:**
- Consumes: `findPlayerStats(player, index)` e `buildPlayerStatsIndex(dataset)` da `playerStats.js`.
- Produces: `deriveStatSignals(player, stats, roles = player.roles) -> { signals, confidenceParts, reasons }` dove `signals` contiene solo `recentForm`, `bonusPotential`, `setPieces` nel range 0–100.
- Produces: `combineConfidence({ sampleGames, stats, confidenceParts }) -> 'alta'|'media'|'bassa'`.

- [ ] **Step 1: Scrivere test fallenti per forma recente e fallback**

Testare che: 3–5 matchday con rating/fantasyRating producano `recentForm !== 50`; meno di 3 gare complessive producano `recentForm === 50`; `null` e campi mancanti non diventino 0.

- [ ] **Step 2: Eseguire i test e verificare il fallimento**

Run: `cd mantra-lab && node --test tests/schierabilitaSignals.test.js`
Expected: FAIL perché `schierabilitaSignals.js`/export non esistono.

- [ ] **Step 3: Implementare `deriveStatSignals` per `recentForm`**

Usare al massimo le ultime 5 giornate valutate; soglia minima 3. Se non bastano, usare `averageRating`/`fantasyAverage` solo con `ratedMatches >= 3`; altrimenti 50.

- [ ] **Step 4: Aggiungere test fallenti per bonus e piazzati**

Testare: normalizzazione per macro-ruolo; 1–2 presenze regrediscono verso 50; 0 presenze = 50; `penaltiesTotal > 0` porta `setPieces > 50`; nessuna evidenza = 50.

- [ ] **Step 5: Implementare bonus, piazzati e confidenza parziale**

I risultati devono essere clampati 0–100 e restituire motivi espliciti (`Campione statistico ridotto`, `Dati piazzati non verificati`) quando si usa un fallback.

- [ ] **Step 6: Eseguire i test del task**

Run: `cd mantra-lab && node --test tests/schierabilitaSignals.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/schierabilitaSignals.js tests/schierabilitaSignals.test.js
git commit -m "feat: derive statistical lineup signals"
```

### Task 2: Fusione V2 dentro la schierabilità

**Files:**
- Modify: `mantra-lab/src/domain/schierabilita.js`
- Create: `mantra-lab/tests/schierabilita-v2.test.js`
- Reuse: `mantra-lab/src/domain/matchdayScore.js`
- Reuse: `mantra-lab/src/domain/playerStats.js`

**Interfaces:**
- Consumes: `deriveStatSignals(...)` e `combineConfidence(...)` dal Task 1.
- Produces: `assessSquad(squad, dataset, now = new Date().toISOString(), statsDataset = null)` preservando le chiamate esistenti a 2/3 argomenti.
- Ogni riga valida aggiunge `confidence: 'alta'|'media'|'bassa'`, `signalSources`, e motivi concreti; righe senza score aggiungono `confidence:'insufficiente'`.

- [ ] **Step 1: Scrivere test fallenti per fusione e matching**

Coprire `INT`/`Internazionale`, accenti e nomi univoci; matching ambiguo deve restituire score `null` e motivo specifico.

- [ ] **Step 2: Scrivere test fallenti per guard rail**

Coprire dataset stantio, partita iniziata, `sampleGames <= 0`, segnale fuori 0–100, `unavailable=true`; tutti devono evitare falsa precisione.

- [ ] **Step 3: Eseguire i test e verificare il fallimento**

Run: `cd mantra-lab && node --test tests/schierabilita-v2.test.js`
Expected: FAIL sulle nuove proprietà e sulla fusione stats.

- [ ] **Step 4: Integrare `statsDataset` in `assessSquad`**

Costruire l'indice stats una sola volta per chiamata; sostituire `recentForm`, `bonusPotential`, `setPieces` solo quando il derivatore ha dati migliori dei fallback giornata; preservare disponibilità/minutaggio/avversario/casa/opportunità del dataset giornata.

- [ ] **Step 5: Calcolare e propagare la confidenza**

`sampleGames >= 5` + stats non prevalentemente neutre → `alta`; almeno 3 gare utili/fallback stagionale → `media`; meno di 3 o almeno due componenti statistiche neutre → `bassa`; nessuno score → `insufficiente`.

- [ ] **Step 6: Eseguire test schierabilità + score esistenti**

Run: `cd mantra-lab && node --test tests/schierabilita-v2.test.js tests/matchdayScore.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/schierabilita.js tests/schierabilita-v2.test.js
git commit -m "feat: fuse player stats into matchday scores"
```

### Task 3: Alternative legali e panchina nell'optimizer

**Files:**
- Modify: `mantra-lab/src/domain/optimizer.js`
- Modify: `mantra-lab/tests/optimizer.test.js`

**Interfaces:**
- Consumes: array `{ player, matchday }` già score-ato.
- Produces per ogni risultato: proprietà esistenti + `alternativesBySlot` e `bench`.
- `alternativesBySlot[slotId]` contiene al massimo la migliore alternativa ottenuta rieseguendo l'assegnazione con il titolare escluso: `{ playerId, score, delta }`.
- `bench` è una lista ordinata di `{ playerId, score, usefulForSlots }` per giocatori non titolari e non esclusi.

- [ ] **Step 1: Aggiungere test fallente per ricomposizione reale**

Costruire un caso con multiruolo in cui la migliore alternativa richiede spostare un altro titolare; verificare che venga trovata e che un semplice sostituto di etichetta insufficiente non venga proposto.

- [ ] **Step 2: Aggiungere test fallente per panchina ordinata**

Verificare ordine per utilità/score e assenza di giocatori esclusi o titolari.

- [ ] **Step 3: Eseguire test optimizer**

Run: `cd mantra-lab && node --test tests/optimizer.test.js`
Expected: FAIL sulle nuove proprietà.

- [ ] **Step 4: Estrarre una funzione interna riusabile di assegnazione con `excludedPlayerIds`**

Riutilizzare il min-cost assignment corrente; non duplicare la logica di compatibilità.

- [ ] **Step 5: Calcolare alternative e bench dopo la formazione migliore**

Per ogni slot, rieseguire l'assegnazione escludendo il relativo titolare; accettare l'alternativa solo se il modulo resta completo legalmente.

- [ ] **Step 6: Eseguire optimizer + compatibility**

Run: `cd mantra-lab && node --test tests/optimizer.test.js tests/compatibility.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/optimizer.js tests/optimizer.test.js
git commit -m "feat: add legal lineup alternatives"
```

### Task 4: Priorità 4-2-3-1 e spiegazione fallback

**Files:**
- Modify: `mantra-lab/src/domain/schierabilita.js`
- Modify: `mantra-lab/src/domain/recommendation.js`
- Create: `mantra-lab/tests/recommendation-v2.test.js`
- Reuse: `mantra-lab/src/domain/formations.js`

**Interfaces:**
- Produces: `safeRecommendations(squad, dataset, now = new Date().toISOString(), statsDataset = null, preferredFormationId = '4-2-3-1')`.
- Primo elemento: 4-2-3-1 se completo; altrimenti miglior risultato per `rawScore`.
- Quando il 4-2-3-1 non è valido, il risultato principale include `preferredFormationIssue` con caselle non copribili o motivo dati insufficienti.

- [ ] **Step 1: Scrivere test fallente: 4-2-3-1 valido ma non highest score resta primo**

Verificare che gli altri moduli siano ancora presenti e ordinati successivamente per punteggio.

- [ ] **Step 2: Scrivere test fallente: 4-2-3-1 incompleto**

Verificare che venga scelto un modulo alternativo valido e che `preferredFormationIssue` nomini almeno la casella/causa che impedisce il 4-2-3-1.

- [ ] **Step 3: Eseguire test raccomandazione**

Run: `cd mantra-lab && node --test tests/recommendation-v2.test.js`
Expected: FAIL sul nuovo ordinamento/output.

- [ ] **Step 4: Implementare ordinamento preferenziale senza modificare `FORMATIONS`**

`optimizer.js` continua a produrre score puri; la policy “modulo principale” vive nel livello recommendation/schierabilità.

- [ ] **Step 5: Implementare diagnostica del 4-2-3-1**

Usare `canPlaySlot` e gli score validi per distinguere casella senza ruolo compatibile da giocatori compatibili ma senza score.

- [ ] **Step 6: Eseguire test recommendation + optimizer**

Run: `cd mantra-lab && node --test tests/recommendation-v2.test.js tests/optimizer.test.js`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/domain/schierabilita.js src/domain/recommendation.js tests/recommendation-v2.test.js
git commit -m "feat: prefer 4231 in lineup recommendations"
```

### Task 5: UI Giornata V2 e persistenza del modulo principale

**Files:**
- Modify: `mantra-lab/src/app/main.js`
- Modify: `mantra-lab/src/ui/schierabilita.js`
- Modify: `mantra-lab/src/styles/main.css` (oppure il file stile effettivamente importato dal build; verificare prima della modifica)
- Create: `mantra-lab/tests/schierabilita-ui.test.js`
- Modify: `mantra-lab/tests/app-shell.test.js`

**Interfaces:**
- Consumes: `assessSquad(..., playerStatsDataset)` e `safeRecommendations(..., playerStatsDataset, '4-2-3-1')`.
- UI mostra: score, confidenza, motivi, 11 titolari con casella, prima alternativa e delta, issue del 4-2-3-1 quando necessario.
- Persistenza: chiave esistente `mantra-lab:formation`, default `'4-2-3-1'` se non presente.

- [ ] **Step 1: Scrivere test UI fallenti**

Verificare HTML con badge `Alta/Media/Bassa`, score individuale, testo per dati insufficienti, alternativa e delta; escaping HTML deve restare attivo.

- [ ] **Step 2: Scrivere regression test sul default formazione**

Verificare che `main.js` usi `'4-2-3-1'` come fallback della chiave `mantra-lab:formation` e passi `playerStatsDataset` alla valutazione/raccomandazione.

- [ ] **Step 3: Eseguire test UI/app-shell**

Run: `cd mantra-lab && node --test tests/schierabilita-ui.test.js tests/app-shell.test.js`
Expected: FAIL sul nuovo output/default.

- [ ] **Step 4: Aggiornare `renderSchierabilita`**

Rimuovere la frase obsoleta che dice che forma e piazzati restano sempre 50; mostrare confidenza e fallback effettivi per riga.

- [ ] **Step 5: Aggiornare `renderGiornata` e default modulo**

Passare il dataset statistiche alle funzioni V2; visualizzare dettagli della formazione principale e alternative; non cambiare navigazione o struttura delle altre sezioni.

- [ ] **Step 6: Aggiungere solo gli stili necessari**

Riutilizzare classi esistenti quando possibile; aggiungere badge/confidence/alternative senza redesign complessivo.

- [ ] **Step 7: Eseguire test UI/app-shell**

Run: `cd mantra-lab && node --test tests/schierabilita-ui.test.js tests/app-shell.test.js`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/app/main.js src/ui/schierabilita.js src/styles tests/schierabilita-ui.test.js tests/app-shell.test.js
git commit -m "feat: present 4231 lineup confidence and alternatives"
```

### Task 6: Verifica completa e release candidate sul branch

**Files:**
- Modify only if needed to fix regressions found by verification.
- Do not modify `main` in this task.

**Interfaces:**
- Consumes all outputs from Tasks 1–5.
- Produces a branch verificato, pronto per review/merge.

- [ ] **Step 1: Eseguire tutta la suite**

Run: `cd mantra-lab && npm test`
Expected: tutti i test PASS, inclusi quelli preesistenti.

- [ ] **Step 2: Eseguire build completa**

Run: `cd mantra-lab && npm run build`
Expected: exit code 0 e `dist` generata.

- [ ] **Step 3: Smoke test dei dataset reali correnti**

Verificare con `current-matchday.json` e `player-stats.json` correnti che: la funzione non lanci eccezioni; i fallback neutri siano espliciti; il 4-2-3-1 venga privilegiato solo se completabile.

- [ ] **Step 4: Verifica visiva della schermata Giornata**

Controllare mobile e desktop: nessuna sovrapposizione; 11 titolari leggibili; confidenza comprensibile; alternative non rendono la card ingestibile; messaggi di dati insufficienti specifici.

- [ ] **Step 5: Verificare che i workflow dati siano invariati**

Confrontare il branch con `main`: nessuna modifica necessaria a `.github/workflows/update-data.yml` o `.github/workflows/update-player-stats.yml` salvo bug emerso dai test.

- [ ] **Step 6: Commit di eventuali sole correzioni di verifica**

```bash
git add <only-files-fixed-during-verification>
git commit -m "fix: address schierabilita v2 verification findings"
```

- [ ] **Step 7: Review finale branch**

Controllare diff `main...feature/fg-mantra-schierabilita-v2` contro spec e criteri di accettazione prima di aprire/mergiare la PR.
