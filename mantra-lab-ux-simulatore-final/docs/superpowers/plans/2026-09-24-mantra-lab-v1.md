# Mantra Lab V1 — Piano di Implementazione

> **Per l’esecuzione agentica:** implementare questo piano task-by-task, verificando ogni blocco prima di passare al successivo.

**Obiettivo:** costruire una PWA personale e gratuita per Fantacalcio Mantra, utilizzabile da iPhone e Mac, con gestione rosa, campo interattivo, compatibilità ruoli, ottimizzatore di formazione, modalità asta e aggiornamento automatico dei dati di giornata tramite GitHub Actions.

**Architettura:** applicazione statica React/TypeScript pubblicata con GitHub Pages. I dati personali restano nel browser (localStorage/IndexedDB), mentre i dati calcistici pubblici vengono generati periodicamente in JSON da workflow GitHub Actions. Il motore Mantra e il motore di scoring lavorano lato client, senza API AI a pagamento.

**Stack tecnico:** React + TypeScript + Vite, CSS responsive/PWA, Vitest + Testing Library, GitHub Pages, GitHub Actions, JSON versionati.

**Specifica:** `docs/superpowers/specs/2026-09-24-mantra-lab-design.md`

## Vincoli globali

- Costo V1: €0.
- Nessuna API AI a pagamento.
- Nessuna API calcistica a pagamento obbligatoria.
- Utilizzabile da iPhone e Mac con un solo codice sorgente.
- Mobile-first, ma con layout desktop più ampio.
- Dati personali della rosa non pubblicati nel repository.
- Repository pubblico ammesso; dati personali salvati localmente.
- Nessuna sincronizzazione cloud automatica nella V1.
- Aggiornamento dati: giorno prima della prima partita e poi ogni giorno successivo in cui restano partite da disputare.
- Il calendario deve essere dinamico e non vincolato a venerdì/sabato/domenica.
- Le raccomandazioni devono essere spiegabili.
- L’ottimizzatore deve rispettare i ruoli Mantra ufficiali e non limitarsi agli 11 punteggi più alti.

## Focus di revisione

1. **Rosa vuota o incompleta:** l’app deve restare usabile e spiegare perché non può generare una formazione completa.
2. **Giocatore multiruolo:** deve poter occupare solo slot consentiti senza duplicarsi in formazione.
3. **Dati di giornata vecchi o mancanti:** l’interfaccia deve evidenziare la data dell’ultimo aggiornamento e continuare a funzionare con dati locali.
4. **Turni Serie A anomali:** l’algoritmo di scheduling deve funzionare anche con prima partita di giovedì/mercoledì e posticipo di lunedì/martedì.
5. **Parità tra più formazioni:** il sistema deve applicare tie-breaker deterministici e spiegabili.

---

## Struttura file prevista

```text
mantra-lab/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   └── routes.tsx
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── BottomNav.tsx
│   │   ├── Pitch.tsx
│   │   ├── PlayerCard.tsx
│   │   ├── PlayerPicker.tsx
│   │   ├── FormationSummary.tsx
│   │   └── DataFreshnessBadge.tsx
│   ├── pages/
│   │   ├── GiornataPage.tsx
│   │   ├── FormazionePage.tsx
│   │   ├── RosaPage.tsx
│   │   └── AstaPage.tsx
│   ├── domain/
│   │   ├── types.ts
│   │   ├── mantraRoles.ts
│   │   ├── formations.ts
│   │   ├── compatibility.ts
│   │   ├── matchdayScore.ts
│   │   ├── optimizer.ts
│   │   └── explanations.ts
│   ├── storage/
│   │   ├── squadStorage.ts
│   │   └── transfer.ts
│   ├── data/
│   │   ├── publicData.ts
│   │   └── generated/
│   │       └── current-matchday.json
│   ├── styles/
│   │   └── app.css
│   └── main.tsx
├── scripts/
│   ├── fetchSchedule.mjs
│   ├── updateMatchdayData.mjs
│   └── scheduleLogic.mjs
├── tests/
│   ├── compatibility.test.ts
│   ├── optimizer.test.ts
│   ├── matchdayScore.test.ts
│   ├── storage.test.ts
│   └── scheduleLogic.test.ts
├── public/
│   ├── manifest.webmanifest
│   └── icons/
├── .github/
│   └── workflows/
│       ├── deploy-pages.yml
│       └── update-data.yml
└── docs/
    └── superpowers/
        ├── specs/
        │   └── 2026-09-24-mantra-lab-design.md
        └── plans/
            └── 2026-09-24-mantra-lab-v1.md
```

---

### Task 1: Creazione repository e shell PWA responsive

**File:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/BottomNav.tsx`
- Create: `src/styles/app.css`
- Create: `public/manifest.webmanifest`
- Create: `.github/workflows/deploy-pages.yml`

**Interfacce:**
- Produce: shell applicativa con quattro sezioni `giornata`, `formazione`, `rosa`, `asta`.
- Produce: navigazione responsive utilizzabile da iPhone e Mac.

- [ ] **Step 1: inizializzare Vite + React + TypeScript e dipendenze test**
- [ ] **Step 2: scrivere un test UI che verifichi la presenza delle quattro sezioni principali**
- [ ] **Step 3: eseguire il test e verificare che fallisca**
- [ ] **Step 4: implementare AppShell e BottomNav**
- [ ] **Step 5: aggiungere CSS mobile-first con safe area iOS e layout desktop**
- [ ] **Step 6: aggiungere manifest PWA**
- [ ] **Step 7: configurare deploy GitHub Pages**
- [ ] **Step 8: eseguire test + build**
- [ ] **Step 9: commit `feat: create responsive mantra lab shell`**

Criterio di accettazione:
- su viewport mobile la navigazione è inferiore;
- su desktop l’app usa uno spazio più ampio;
- `npm run build` completa senza errori.

---

### Task 2: Modello dati della rosa e persistenza locale

**File:**
- Create: `src/domain/types.ts`
- Create: `src/storage/squadStorage.ts`
- Create: `src/storage/transfer.ts`
- Create: `tests/storage.test.ts`
- Modify: `src/pages/RosaPage.tsx`

**Interfacce:**
- Produce:
```ts
export type MantraRole =
  | "P" | "Dd" | "Ds" | "Dc" | "E"
  | "M" | "C" | "T" | "W" | "A" | "Pc";

export interface SquadPlayer {
  id: string;
  name: string;
  club: string;
  roles: MantraRole[];
  active: boolean;
  purchasePrice?: number;
  note?: string;
  favourite?: boolean;
}
```

- Produce:
```ts
loadSquad(): SquadPlayer[]
saveSquad(players: SquadPlayer[]): void
exportSquad(players: SquadPlayer[]): string
importSquad(json: string): SquadPlayer[]
```

- [ ] **Step 1: scrivere test per salvataggio/caricamento**
- [ ] **Step 2: scrivere test per JSON valido e JSON corrotto**
- [ ] **Step 3: verificare fallimento**
- [ ] **Step 4: implementare i tipi e la persistenza**
- [ ] **Step 5: implementare import/export JSON con validazione**
- [ ] **Step 6: creare UI Rosa con aggiunta/modifica/rimozione giocatore**
- [ ] **Step 7: testare rosa vuota e giocatore multiruolo**
- [ ] **Step 8: eseguire test + build**
- [ ] **Step 9: commit `feat: add local squad management`**

Criterio di accettazione:
- la rosa sopravvive al refresh;
- i dati personali non vengono scritti nel repository;
- export/import funziona tra dispositivi.

---

### Task 3: Definizione ruoli Mantra e moduli

**File:**
- Create: `src/domain/mantraRoles.ts`
- Create: `src/domain/formations.ts`
- Create: `src/domain/compatibility.ts`
- Create: `tests/compatibility.test.ts`

**Interfacce:**
- Produce:
```ts
export interface FormationSlot {
  id: string;
  label: string;
  acceptedRoles: MantraRole[];
  x: number;
  y: number;
}

export interface FormationDefinition {
  id: string;
  name: string;
  slots: FormationSlot[];
}
```

- Produce:
```ts
canPlaySlot(player: SquadPlayer, slot: FormationSlot): boolean
```

- [ ] **Step 1: codificare test per giocatore monoruolo, multiruolo e incompatibile**
- [ ] **Step 2: verificare fallimento**
- [ ] **Step 3: definire il catalogo ruoli**
- [ ] **Step 4: definire i moduli Mantra supportati nella V1**
- [ ] **Step 5: implementare `canPlaySlot`**
- [ ] **Step 6: verificare che lo stesso giocatore non possa essere assegnato due volte nella logica di formazione**
- [ ] **Step 7: eseguire tutti i test**
- [ ] **Step 8: commit `feat: add mantra formations and role compatibility`**

Criterio di accettazione:
- ogni slot espone i ruoli ammessi;
- i multiruolo funzionano correttamente;
- le incompatibilità sono deterministiche.

---

### Task 4: Campo interattivo e composizione manuale

**File:**
- Create: `src/components/Pitch.tsx`
- Create: `src/components/PlayerPicker.tsx`
- Create: `src/components/PlayerCard.tsx`
- Create: `src/pages/FormazionePage.tsx`
- Modify: `src/styles/app.css`

**Interfacce:**
- Consumes: `FormationDefinition`, `canPlaySlot`, `SquadPlayer`.
- Produce:
```ts
export type LineupAssignment = Record<string, string | null>;
```

- [ ] **Step 1: test UI per apertura slot e filtro dei soli giocatori compatibili**
- [ ] **Step 2: verificare fallimento**
- [ ] **Step 3: implementare campo responsive**
- [ ] **Step 4: implementare tap-to-pick su mobile**
- [ ] **Step 5: implementare drag & drop desktop solo se non compromette l’uso touch**
- [ ] **Step 6: impedire duplicazione dello stesso giocatore**
- [ ] **Step 7: mostrare slot vuoti/incompatibili chiaramente**
- [ ] **Step 8: testare su viewport iPhone e desktop**
- [ ] **Step 9: commit `feat: add interactive mantra pitch`**

Criterio di accettazione:
- da iPhone si compone la formazione senza drag obbligatorio;
- da Mac il campo rimane leggibile;
- un giocatore incompatibile non è selezionabile.

---

### Task 5: Indice Giornata 0–100

**File:**
- Create: `src/domain/matchdayScore.ts`
- Create: `tests/matchdayScore.test.ts`
- Modify: `src/domain/types.ts`

**Interfacce:**
- Produce:
```ts
export interface MatchdaySignals {
  availability: number;
  expectedMinutes: number;
  recentForm: number;
  opponentContext: number;
  bonusPotential: number;
  setPieces: number;
  homeAwayContext: number;
  tacticalOpportunity: number;
  unavailable: boolean;
  majorDoubt: boolean;
}

export interface PlayerMatchdayScore {
  score: number;
  positives: string[];
  negatives: string[];
}

scorePlayer(signals: MatchdaySignals): PlayerMatchdayScore
```

- [ ] **Step 1: testare pesi 30/20/15/15/10/5/5**
- [ ] **Step 2: testare esclusione indisponibile**
- [ ] **Step 3: testare penalizzazione forte dubbio**
- [ ] **Step 4: testare limite 0–100**
- [ ] **Step 5: implementare funzione pura deterministica**
- [ ] **Step 6: aggiungere spiegazioni positive/negative**
- [ ] **Step 7: eseguire test**
- [ ] **Step 8: commit `feat: add explainable matchday scoring`**

Criterio di accettazione:
- stesso input = stesso risultato;
- indisponibile non può essere consigliato;
- il punteggio espone le motivazioni principali.

---

### Task 6: Ottimizzatore di formazione

**File:**
- Create: `src/domain/optimizer.ts`
- Create: `src/domain/explanations.ts`
- Create: `tests/optimizer.test.ts`
- Create: `src/components/FormationSummary.tsx`
- Modify: `src/pages/GiornataPage.tsx`

**Interfacce:**
- Produce:
```ts
export interface ScoredPlayer {
  player: SquadPlayer;
  matchday: PlayerMatchdayScore;
}

export interface OptimizedFormation {
  formationId: string;
  assignments: LineupAssignment;
  rawScore: number;
  normalizedScore: number;
  explanation: string[];
}

optimizeFormations(
  players: ScoredPlayer[],
  formations: FormationDefinition[]
): OptimizedFormation[]
```

- [ ] **Step 1: testare che non vengano scelti semplicemente gli 11 punteggi più alti se incompatibili**
- [ ] **Step 2: testare giocatori multiruolo**
- [ ] **Step 3: testare rosa incompleta**
- [ ] **Step 4: testare parità e tie-breaker deterministico**
- [ ] **Step 5: implementare ricerca delle assegnazioni valide**
- [ ] **Step 6: ordinare le formazioni per punteggio**
- [ ] **Step 7: generare spiegazioni del modulo migliore**
- [ ] **Step 8: mostrare migliore + almeno due alternative valide**
- [ ] **Step 9: eseguire test + build**
- [ ] **Step 10: commit `feat: add mantra formation optimizer`**

Criterio di accettazione:
- nessun giocatore duplicato;
- solo assegnazioni compatibili;
- output ordinato e spiegabile.

---

### Task 7: Modalità Asta e analisi coperture

**File:**
- Create: `src/pages/AstaPage.tsx`
- Create: `src/domain/squadCoverage.ts`
- Create: `tests/squadCoverage.test.ts`

**Interfacce:**
- Produce:
```ts
export interface CoverageIssue {
  severity: "info" | "warning" | "critical";
  message: string;
}

analyzeSquadCoverage(
  players: SquadPlayer[],
  formations: FormationDefinition[]
): CoverageIssue[]
```

- [ ] **Step 1: testare rosa senza E**
- [ ] **Step 2: testare rosa con ottima copertura M/C**
- [ ] **Step 3: testare valore dei multiruolo**
- [ ] **Step 4: implementare analisi coperture**
- [ ] **Step 5: aggiungere budget totale e prezzo acquisto opzionale**
- [ ] **Step 6: mostrare alert strutturali in Asta**
- [ ] **Step 7: eseguire test**
- [ ] **Step 8: commit `feat: add auction squad coverage analysis`**

Criterio di accettazione:
- l’utente vede chiaramente ruoli scoperti e ridondanze;
- nessuna valutazione dipende da servizi esterni.

---

### Task 8: Dataset pubblico e indicatore freschezza

**File:**
- Create: `src/data/publicData.ts`
- Create: `src/data/generated/current-matchday.json`
- Create: `src/components/DataFreshnessBadge.tsx`
- Modify: `src/pages/GiornataPage.tsx`

**Interfacce:**
- Produce:
```ts
export interface MatchdayDataset {
  generatedAt: string;
  matchday: number;
  fixtures: FixtureData[];
  players: PublicPlayerMatchdayData[];
  sources: DataSourceInfo[];
}
```

- [ ] **Step 1: creare fixture JSON locale di esempio**
- [ ] **Step 2: testare parsing e fallback in caso di dati mancanti**
- [ ] **Step 3: implementare loader**
- [ ] **Step 4: mostrare timestamp ultimo aggiornamento**
- [ ] **Step 5: segnalare dataset vecchio senza bloccare l’app**
- [ ] **Step 6: integrare i segnali pubblici nello scoring**
- [ ] **Step 7: commit `feat: add public matchday dataset support`**

Criterio di accettazione:
- l’app funziona anche offline/temporaneamente senza refresh esterno;
- l’utente sa sempre quanto sono recenti i dati.

---

### Task 9: Logica calendario e aggiornamenti automatici

**File:**
- Create: `scripts/scheduleLogic.mjs`
- Create: `scripts/fetchSchedule.mjs`
- Create: `scripts/updateMatchdayData.mjs`
- Create: `tests/scheduleLogic.test.ts`
- Create: `.github/workflows/update-data.yml`

**Interfacce:**
- Produce:
```js
shouldRefreshMatchday({
  now,
  fixtures,
  lastRefreshAt
}) => boolean
```

- [ ] **Step 1: testare giornata venerdì-domenica**
- [ ] **Step 2: testare giornata giovedì-domenica**
- [ ] **Step 3: testare giornata sabato-lunedì**
- [ ] **Step 4: testare turno infrasettimanale**
- [ ] **Step 5: testare che non aggiorni dopo l’ultima partita**
- [ ] **Step 6: implementare scheduling dinamico**
- [ ] **Step 7: creare workflow GitHub Actions con controllo giornaliero**
- [ ] **Step 8: il workflow esegue il fetch completo solo quando `shouldRefreshMatchday` è true**
- [ ] **Step 9: generare `current-matchday.json`**
- [ ] **Step 10: commit `feat: automate matchday data refresh`**

Nota: GitHub Actions può essere schedulato con cron a una frequenza ragionevole; lo script decide se quel giorno è realmente necessario aggiornare. Questo evita hard-code sul giorno della settimana.

Criterio di accettazione:
- la regola concordata funziona indipendentemente dal giorno della prima partita.

---

### Task 10: Ricerca e adattatori delle fonti gratuite

**File:**
- Create: `scripts/sources/scheduleSource.mjs`
- Create: `scripts/sources/lineupSource.mjs`
- Create: `scripts/sources/playerStatsSource.mjs`
- Modify: `scripts/updateMatchdayData.mjs`
- Create: `docs/data-sources.md`

**Interfacce:**
Ogni adattatore produce dati normalizzati e non espone la struttura specifica della fonte al resto dell’app.

- [ ] **Step 1: verificare fonti pubbliche/gratuite consentite e stabili**
- [ ] **Step 2: documentare per ogni fonte dati coperti, frequenza, limiti e fallback**
- [ ] **Step 3: implementare adattatore calendario**
- [ ] **Step 4: implementare adattatore probabili/indisponibili solo se fonte utilizzabile**
- [ ] **Step 5: implementare adattatore statistiche recenti**
- [ ] **Step 6: salvare fonte e timestamp nel JSON**
- [ ] **Step 7: gestire il fallimento di una singola fonte senza perdere l’intero dataset**
- [ ] **Step 8: commit `feat: add modular free football data adapters`**

Criterio di accettazione:
- sostituire una fonte non richiede modifiche al motore Mantra;
- nessuna chiave a pagamento è necessaria.

---

### Task 11: PWA iPhone + rifinitura Mac

**File:**
- Modify: `public/manifest.webmanifest`
- Modify: `src/styles/app.css`
- Modify: componenti principali
- Create: `public/icons/*`

- [ ] **Step 1: verificare viewport e safe area su iPhone**
- [ ] **Step 2: verificare installazione Home Screen**
- [ ] **Step 3: verificare orientamento verticale e touch target**
- [ ] **Step 4: verificare layout desktop Mac**
- [ ] **Step 5: verificare export/import JSON da entrambi**
- [ ] **Step 6: eseguire suite completa**
- [ ] **Step 7: eseguire build produzione**
- [ ] **Step 8: commit `feat: polish pwa for iphone and mac`**

Criterio di accettazione:
- nessuna funzione primaria richiede un mouse;
- nessuna funzione primaria è nascosta su mobile.

---

### Task 12: Verifica finale e pubblicazione

**File:**
- Modify: `README.md`
- Modify: eventuali file emersi dai test

- [ ] **Step 1: eseguire `npm test`**
- [ ] **Step 2: eseguire `npm run build`**
- [ ] **Step 3: test manuale rosa vuota**
- [ ] **Step 4: test manuale rosa completa**
- [ ] **Step 5: test manuale multiruolo**
- [ ] **Step 6: test manuale dataset vecchio/mancante**
- [ ] **Step 7: test manuale simulazione calendario anomalo**
- [ ] **Step 8: verificare GitHub Pages**
- [ ] **Step 9: aprire la PWA su iPhone e Mac**
- [ ] **Step 10: documentare import/export e installazione su Home Screen**
- [ ] **Step 11: commit `docs: finalize mantra lab v1`**

## Strategia di rilascio

Per ridurre il rischio, la V1 verrà resa utilizzabile in tre milestone:

### Milestone A — Simulatore Mantra
Task 1–4.
Risultato: rosa + campo + moduli + compatibilità.

### Milestone B — Consigliatore
Task 5–7.
Risultato: indice giornata, ottimizzatore, spiegazioni e modalità asta.

### Milestone C — Automazione
Task 8–12.
Risultato: dati esterni, aggiornamento automatico, PWA rifinita e pubblicazione.

## Self-review del piano

- Copertura specifica: tutte le sezioni della specifica sono mappate a task concreti.
- Nessuna sincronizzazione cloud è inclusa nella V1.
- L’aggiornamento automatico è dinamico e non dipende da un giorno fisso.
- I dati personali restano locali.
- Lo scoring è deterministico e spiegabile.
- L’ottimizzatore rispetta i ruoli.
- La raccolta dati è isolata dietro adattatori sostituibili.
- I principali failure mode sono coperti nei test previsti.
