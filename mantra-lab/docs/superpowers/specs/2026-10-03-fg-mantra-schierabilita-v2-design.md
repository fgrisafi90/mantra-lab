# FG Mantra — Schierabilità V2 e formazione consigliata 4-2-3-1

Data: 2026-10-03
Stato: design approvata dall'utente, pronta per pianificazione implementativa
Branch: `feature/fg-mantra-schierabilita-v2`

## 1. Obiettivo

Portare FG Mantra da un motore che calcola una formazione usando segnali principalmente prudenziali a uno strumento affidabile per la scelta della formazione di giornata, senza riscrivere l'app né introdurre subito nuove fonti fragili.

Il risultato atteso è che, partendo dalla rosa reale dell'utente e dai dati già aggiornati automaticamente, FG Mantra:

- calcoli per ogni giocatore un indice di schierabilità 0–100;
- distingua chiaramente tra punteggio affidabile, punteggio provvisorio e dati insufficienti;
- usi sia i segnali della giornata sia le statistiche individuali aggiornate;
- produca una formazione consigliata compatibile con i ruoli Mantra;
- usi il 4-2-3-1 come modulo principale dell'utente, senza rimuovere gli altri moduli;
- mostri perché un giocatore è consigliato, escluso o superato da un'alternativa;
- non inventi informazioni su indisponibilità, probabili formazioni o piazzati quando le fonti non le verificano.

## 2. Stato attuale da preservare

Il repository contiene già:

- workflow `update-data.yml` per il dataset della giornata;
- workflow `update-player-stats.yml` per le statistiche individuali;
- `matchdayScore.js` per il punteggio 0–100;
- `schierabilita.js` per associare rosa e dataset;
- `optimizer.js` per trovare l'assegnazione migliore dei giocatori ai ruoli;
- `formations.js` con tutti i moduli Mantra, incluso il 4-2-3-1;
- dashboard Giornata già collegata alle raccomandazioni;
- logica di blocco quando i dati sono vecchi, incompleti o non identificano con certezza il giocatore.

La V2 riutilizza questi componenti e migliora qualità degli ingressi, confidenza e spiegabilità. Non è prevista una riscrittura architetturale dell'app.

## 3. Scelta architetturale

### 3.1 Fusione dei dati esistenti

La raccomandazione nasce dall'unione di due dataset già presenti:

1. `current-matchday.json`: avversario, casa/trasferta, minutaggio atteso, disponibilità e segnali di contesto;
2. `player-stats.json`: presenze, voti, fantamedia, gol, assist, cartellini, rigori e storico delle giornate quando disponibile.

La fusione avviene nel dominio, non nella UI e non nei workflow di acquisizione. Le fonti rimangono indipendenti e il motore resta testabile con fixture locali.

### 3.2 Nuovo componente di dominio

Introdurre un modulo dedicato, indicativamente `src/domain/schierabilitaSignals.js`, con responsabilità limitata a:

- risolvere il giocatore nei due dataset;
- derivare segnali aggiuntivi dalle statistiche reali;
- produrre un oggetto normalizzato di segnali 0–100;
- associare ai segnali una qualità/confidenza;
- non effettuare rendering né ottimizzazione della formazione.

`schierabilita.js` consumerà questi segnali e continuerà a orchestrare la valutazione della rosa.

## 4. Segnali e scoring

### 4.1 Pesi

Il punteggio resta 0–100 e mantiene inizialmente pesi vicini all'attuale distribuzione:

- disponibilità/minutaggio: 30%;
- forma recente: 20%;
- avversario: 15%;
- potenziale bonus: 15%;
- piazzati: 10%;
- casa/trasferta: 5%;
- opportunità tattica: 5%.

La V2 migliora prima la qualità dei segnali; i pesi potranno essere tarati dopo test su giornate reali.

### 4.2 Forma recente

`recentForm` non resta automaticamente a 50 quando esistono dati individuali sufficienti.

Regola deterministica:

1. usare fino alle ultime 5 giornate con voto o fantavoto disponibile;
2. con almeno 3 gare recenti valutate, derivare la forma recente da quel campione;
3. con meno di 3 gare recenti ma almeno 3 gare stagionali valutate, usare media voto e fantamedia stagionali con confidenza media;
4. con meno di 3 gare valutate complessive, usare 50 come fallback prudente e confidenza bassa.

Una singola partita non può quindi produrre da sola una forma estrema.

### 4.3 Potenziale bonus

`bonusPotential` combina, quando presenti:

- gol per presenza;
- assist per presenza;
- differenza tra fantamedia e media voto;
- ruolo Mantra, così da normalizzare aspettative differenti tra difensori, centrocampisti e attaccanti.

Soglie di confidenza:

- 5 o più presenze: dato pienamente utilizzabile;
- 3–4 presenze: utilizzabile con confidenza media;
- 1–2 presenze: forte regressione verso 50 e confidenza bassa;
- 0 presenze: fallback 50, senza trasformare l'assenza di dati in un giudizio negativo.

### 4.4 Piazzati

`setPieces` può aumentare solo con evidenza verificabile nei dati.

Nella V2, la presenza di `penaltiesTotal > 0` è evidenza valida per aumentare il segnale rigori. `penaltiesScored` può modulare il valore, ma un rigore sbagliato non annulla automaticamente il fatto che il giocatore sia stato designato almeno una volta.

Se non esiste evidenza verificabile, il valore resta 50 con confidenza bassa. Non si deducono rigoristi o battitori da reputazione o conoscenza esterna.

### 4.5 Disponibilità e minutaggio

I segnali del dataset giornata restano prioritari per disponibilità ed expected minutes.

- `unavailable=true` esclude il giocatore;
- `majorDoubt=true` mantiene la penalità già prevista;
- `sampleGames <= 0` rende insufficiente la stima prepartita;
- campioni piccoli nelle statistiche stagionali abbassano la confidenza ma, da soli, non cancellano uno score quando il dataset giornata ha segnali validi.

### 4.6 Avversario e casa/trasferta

Il contesto già generato dal dataset giornata viene mantenuto. Non si aggiungono in questa V2 expected goals esterni, quote scommesse o previsioni proprietarie.

## 5. Confidenza del dato

Ogni valutazione restituisce anche una confidenza sintetica:

- `alta`: segnali giornata completi, almeno 5 gare utili nel campione e statistiche individuali non prevalentemente neutre;
- `media`: segnali giornata completi e almeno 3 gare utili, oppure statistiche stagionali usate come fallback della forma recente;
- `bassa`: segnali giornata validi ma meno di 3 gare utili o almeno due componenti statistiche importanti in fallback neutro;
- `insufficiente`: manca un requisito essenziale e quindi non viene mostrato alcun punteggio.

La confidenza non modifica il punteggio nella prima versione: serve a evitare falsa equivalenza tra score numericamente uguali ma costruiti con qualità dei dati diversa.

## 6. Regole per “Dati insufficienti”

Il motore non produce una raccomandazione numerica quando:

- il dataset giornata è assente o scaduto;
- il giocatore non è identificato con certezza;
- l'avversario non è verificato;
- la partita è già iniziata o conclusa;
- `sampleGames <= 0` nel dataset giornata;
- manca uno dei segnali essenziali richiesti dal modello o un valore è fuori range 0–100.

La scarsità di statistiche stagionali, da sola, non blocca lo score: abbassa la confidenza e attiva fallback neutri espliciti.

La UI mostra sempre il motivo specifico dell'assenza di score.

## 7. Modulo principale 4-2-3-1

Il 4-2-3-1 diventa il modulo principale salvato per il profilo corrente.

La struttura già codificata resta invariata:

- P;
- Dd, Dc, Dc, Ds;
- M, M/C;
- W/T, T, W/A;
- A/Pc.

Regola di raccomandazione:

- se il 4-2-3-1 è completabile legalmente con 11 giocatori dotati di score valido, è la formazione principale mostrata nella dashboard;
- gli altri moduli validi vengono comunque calcolati e mostrati come alternative ordinate per punteggio;
- se il 4-2-3-1 non è completabile, viene proposto il miglior modulo alternativo e la UI spiega quali caselle o dati impediscono il 4-2-3-1.

FG Mantra non forza mai un ruolo illegale per mantenere il modulo preferito.

## 8. Ottimizzazione e alternative

`optimizer.js` resta il motore di assegnazione e continua a massimizzare lo score complessivo rispettando `canPlaySlot`.

La V2 estende l'output con:

- panchina ordinata per utilità di subentro;
- prima alternativa per ogni titolare, quando esiste.

Per calcolare una vera alternativa a un titolare, il sistema deve rieseguire l'assegnazione del modulo escludendo quel titolare e verificare che gli altri 10 possano essere ricomposti legalmente. Non basta cercare un giocatore con una singola etichetta di ruolo compatibile.

Non rientrano nella V2 sostituzioni live, switch di modulo post-consegna o riserve d'ufficio.

## 9. UI Giornata

La schermata Giornata ha tre livelli.

### 9.1 Formazione consigliata

Mostrare:

- modulo;
- indice medio della formazione;
- 11 titolari;
- casella Mantra occupata;
- score individuale;
- confidenza del dato.

### 9.2 Perché

Per ogni giocatore mostrare pochi motivi concreti ordinati per importanza, ad esempio:

- “Minutaggio atteso alto”;
- “Forma recente positiva”;
- “Matchup favorevole”;
- “Buon potenziale bonus”;
- “Campione statistico ridotto”;
- “Rischio di minutaggio ridotto”.

Non devono apparire spiegazioni non sostenute dai dati disponibili.

### 9.3 Alternative

Mostrare almeno la prima alternativa per le caselle in cui una ricomposizione valida è possibile. L'utente deve capire chi è il primo cambio consigliato e il divario di score rispetto al titolare.

## 10. Persistenza

Salvare il 4-2-3-1 come modulo principale usando la persistenza locale già esistente.

Non introdurre database, autenticazione o sincronizzazione cloud.

## 11. Error handling

- I workflow preservano l'ultimo dataset valido se una fonte fallisce.
- La UI distingue dati vecchi, fonte non raggiungibile, giocatore non identificato e campione insufficiente.
- Il fallimento di una singola statistica non deve rompere la pagina.
- Un valore mancante non viene convertito silenziosamente in zero se zero avrebbe significato negativo.
- I fallback neutri sono tracciati nella confidenza e, quando rilevanti, nelle spiegazioni.

## 12. Test

La feature usa i test automatici Node già presenti.

Test minimi richiesti:

1. forma recente derivata da almeno 3 gare recenti;
2. fallback stagionale con meno di 3 gare recenti ma almeno 3 stagionali;
3. fallback neutro e confidenza bassa sotto 3 gare totali;
4. bonusPotential regressivo su campione piccolo;
5. rigori che influenzano `setPieces` solo con `penaltiesTotal > 0`;
6. giocatore indisponibile escluso;
7. dataset stantio → nessuno score;
8. matching ambiguo → nessuno score;
9. sampleGames zero → nessuno score;
10. 4-2-3-1 completo → raccomandazione principale;
11. 4-2-3-1 incompleto → spiegazione + modulo alternativo valido;
12. alternativa titolare calcolata tramite ricomposizione legale;
13. confidenza alta/media/bassa coerente con i dati presenti;
14. regressione: gli altri moduli Mantra restano calcolabili.

`npm test` e `npm run build` devono passare integralmente prima del completamento.

## 13. Fuori scope V2

Restano intenzionalmente fuori:

- scraping di siti di probabili formazioni;
- feed infortuni da nuove fonti;
- quote bookmaker;
- machine learning;
- consigli basati su news/social;
- notifiche push;
- account cloud e sincronizzazione multi-device;
- ottimizzazione delle sostituzioni durante la giornata.

Questi elementi verranno valutati solo dopo aver misurato la qualità della V2 con i dati già disponibili.

## 14. Criteri di accettazione

La V2 è accettata quando:

- il 4-2-3-1 è la formazione principale quando legalmente completabile;
- ogni giocatore della rosa ha uno score o una motivazione esplicita per l'assenza di score;
- `recentForm` e `setPieces` non restano neutri quando i dati reali consentono di calcolarli;
- la formazione consigliata rispetta sempre i ruoli Mantra;
- titolari e prime alternative sono spiegati con dati disponibili;
- la UI rende evidente la confidenza dell'analisi;
- dati incompleti non producono falsa precisione;
- tutti i test e la build passano.

## 15. Sequenza implementativa prevista

1. aggiungere test per la fusione dei segnali;
2. implementare il derivatore dei segnali statistici;
3. collegarlo a `schierabilita.js` e `matchdayScore.js` senza rompere l'API corrente;
4. estendere raccomandazioni con confidenza e alternative;
5. rendere 4-2-3-1 il modulo principale e aggiornare la dashboard;
6. aggiungere test di integrazione/optimizer;
7. eseguire test completi e build;
8. verificare visivamente schermata Giornata e comportamento con dataset incompleti.
