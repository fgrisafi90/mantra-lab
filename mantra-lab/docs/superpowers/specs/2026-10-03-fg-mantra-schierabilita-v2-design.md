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
- consideri il 4-2-3-1 come modulo preferito dell'utente, senza rimuovere gli altri moduli;
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

La V2 deve riutilizzare questi componenti e migliorarne gli ingressi e la spiegabilità. Non è prevista una riscrittura architetturale dell'app.

## 3. Scelta architetturale

### 3.1 Approccio scelto: fusione dei dati esistenti

La raccomandazione deve nascere dall'unione di due dataset già presenti:

1. `current-matchday.json`: avversario, casa/trasferta, minutaggio atteso, disponibilità e segnali di contesto;
2. `player-stats.json`: presenze, voti, fantamedia, gol, assist, cartellini, rigori e storico delle giornate quando disponibile.

La fusione avviene nel dominio, non dentro la UI e non dentro i workflow di scraping. Questo mantiene le fonti indipendenti e rende il motore testabile con fixture locali.

### 3.2 Nuovo componente di dominio

Introdurre un modulo dedicato, indicativamente `src/domain/schierabilitaSignals.js`, con responsabilità limitata a:

- risolvere il giocatore nei due dataset;
- derivare segnali aggiuntivi dalle statistiche reali;
- produrre un oggetto normalizzato di segnali 0–100;
- associare a ogni segnale una qualità/confidenza;
- non effettuare rendering né ottimizzazione della formazione.

`schierabilita.js` consumerà questi segnali e continuerà a essere l'orchestratore per la rosa.

## 4. Segnali e scoring

### 4.1 Segnali base

Il punteggio continua a essere 0–100 e deve usare queste aree:

- disponibilità + minutaggio atteso;
- forma recente;
- contesto avversario;
- potenziale bonus;
- piazzati/rigori;
- casa/trasferta;
- opportunità tattica.

I pesi iniziali restano vicini all'attuale distribuzione per evitare regressioni brusche:

- disponibilità/minutaggio: 30%;
- forma recente: 20%;
- avversario: 15%;
- bonus: 15%;
- piazzati: 10%;
- casa/trasferta: 5%;
- opportunità tattica: 5%.

La V2 migliora prima di tutto la qualità dei segnali; eventuali nuovi pesi potranno essere tarati dopo test su giornate reali.

### 4.2 Forma recente

`recentForm` non deve restare automaticamente a 50 quando esistono dati individuali sufficienti.

Ordine di preferenza:

1. ultime giornate con voto/fantavoto disponibili;
2. in assenza di storico recente sufficiente, media stagionale e fantamedia;
3. se non esiste un campione minimo significativo, valore neutro con confidenza bassa.

Il calcolo deve evitare oscillazioni estreme con campioni molto piccoli. Un giocatore con una sola presenza non deve essere trattato come in forma eccezionale o pessima solo per quella partita.

### 4.3 Potenziale bonus

`bonusPotential` deve combinare, quando presenti:

- gol per presenza;
- assist per presenza;
- fantamedia rispetto alla media voto;
- ruolo Mantra, per non confrontare direttamente un Dc con una Pc usando la stessa aspettativa grezza.

Il risultato deve essere normalizzato 0–100 e limitato a valori prudenti quando il numero di presenze è ridotto.

### 4.4 Piazzati

`setPieces` può aumentare soltanto quando esiste evidenza verificabile nei dati, per esempio rigori segnati/totali.

Non va dedotto che un giocatore sia rigorista o battitore principale solo per reputazione o conoscenza esterna non presente nei dataset. In assenza di evidenza, resta neutro e viene marcato come confidenza bassa.

### 4.5 Disponibilità e minutaggio

I segnali del dataset giornata restano prioritari per disponibilità e expected minutes.

Se una fonte segnala `unavailable`, il giocatore resta escluso dal motore.

Se esiste `majorDoubt`, resta la penalità già prevista. La UI deve esplicitare il rischio.

### 4.6 Avversario e casa/trasferta

Il contesto già generato dal dataset giornata viene mantenuto. Non si aggiungono per ora modelli esterni di expected goals, quote scommesse o previsioni proprietarie.

## 5. Confidenza del dato

Ogni valutazione deve restituire anche una confidenza sintetica:

- `alta`: segnali giornata completi + statistiche individuali con campione adeguato;
- `media`: segnali giornata completi ma parte delle statistiche deriva da medie stagionali o valori neutri;
- `bassa`: molti segnali sono neutri o il campione è ridotto;
- `insufficiente`: mancano dati indispensabili, quindi nessun punteggio.

La confidenza non modifica automaticamente il punteggio nella prima versione. Serve a evitare che un 78 con dati poveri sembri equivalente a un 78 costruito con dati robusti.

## 6. Regole per “Dati insufficienti”

Il motore non deve produrre una raccomandazione numerica quando:

- il dataset giornata è assente o scaduto;
- il giocatore non è identificato con certezza;
- l'avversario non è verificato;
- la partita è già iniziata o conclusa;
- non esiste un campione minimo per i segnali essenziali;
- i segnali numerici richiesti sono invalidi o fuori range.

In questi casi la UI deve mostrare il motivo specifico, non uno score inventato.

## 7. Modulo preferito 4-2-3-1

Il 4-2-3-1 diventa il modulo preferito salvato per il profilo corrente, ma FG Mantra continua a calcolare anche gli altri moduli validi.

La struttura già codificata resta invariata:

- P;
- Dd, Dc, Dc, Ds;
- M, M/C;
- W/T, T, W/A;
- A/Pc.

La dashboard deve mostrare per primo il 4-2-3-1 quando è validamente schierabile. Se non è possibile completarlo per ruoli o dati, il motore può proporre il miglior modulo alternativo e deve spiegare perché il 4-2-3-1 non è completo.

Questo comportamento evita di forzare una formazione illegale o di consigliare giocatori senza score valido.

## 8. Ottimizzazione della formazione

`optimizer.js` resta il motore di assegnazione.

La V2 deve aggiungere due informazioni all'output:

- panchina ordinata per valore di subentro rispetto ai ruoli scoperti/coperti;
- per ogni titolare, la prima alternativa realmente compatibile con quella casella o con una ricomposizione valida del modulo.

L'ottimizzatore deve continuare a massimizzare il punteggio complessivo rispettando `canPlaySlot`.

Non si introducono nella V2 regole di sostituzione live, switch di modulo post-consegna o gestione automatica delle riserve d'ufficio.

## 9. UI Giornata

La schermata Giornata deve avere tre livelli di lettura.

### 9.1 Formazione consigliata

Mostrare:

- modulo;
- indice medio della formazione;
- 11 titolari;
- ruolo/casella occupata;
- score individuale;
- confidenza del dato.

### 9.2 Perché

Per ogni giocatore devono essere visibili pochi motivi concreti, ordinati per importanza, ad esempio:

- “Minutaggio atteso alto”;
- “Forma recente positiva”;
- “Matchup favorevole”;
- “Buon potenziale bonus”;
- “Campione statistico ridotto”;
- “Rischio di minutaggio ridotto”.

Non devono comparire spiegazioni generiche non sostenute dai dati.

### 9.3 Alternative

Mostrare almeno la prima alternativa per le caselle dove esiste una sostituzione valida. L'utente deve capire non solo chi parte titolare, ma chi è il primo cambio consigliato.

## 10. Persistenza e preferenze

Salvare il modulo preferito 4-2-3-1 usando la persistenza locale già esistente.

Non introdurre database, autenticazione o sincronizzazione cloud in questa feature.

## 11. Error handling

Principi:

- i workflow preservano l'ultimo dataset valido se una fonte fallisce;
- la UI distingue “dati vecchi”, “fonte non raggiungibile”, “giocatore non identificato” e “campione insufficiente”;
- nessun fallimento di una singola statistica deve rompere la pagina;
- valori mancanti non vengono convertiti silenziosamente in zero se zero avrebbe significato negativo;
- i fallback neutri devono essere esplicitamente tracciati nella confidenza/spiegazione.

## 12. Test

La feature deve essere sviluppata con test automatici Node già usati dal progetto.

Test minimi richiesti:

1. derivazione forma recente da storico sufficiente;
2. fallback prudente su campione piccolo;
3. potenziale bonus normalizzato per ruolo/campione;
4. rigori che influenzano `setPieces` solo quando verificati;
5. giocatore indisponibile escluso;
6. dataset stantio → nessuno score;
7. matching ambiguo → nessuno score;
8. 4-2-3-1 completo → raccomandazione valida;
9. 4-2-3-1 incompleto → spiegazione + modulo alternativo valido;
10. alternative di ruolo compatibili;
11. confidenza alta/media/bassa coerente con i dati presenti;
12. regressione: gli altri moduli Mantra restano calcolabili.

Oltre ai test unitari, `npm test` e `npm run build` devono passare integralmente prima di considerare completata l'implementazione.

## 13. Fuori scope V2

Restano intenzionalmente fuori:

- scraping di siti di probabili formazioni;
- feed infortuni da nuove fonti;
- quote bookmaker;
- modelli machine learning;
- consigli basati su news/social;
- notifiche push;
- account cloud e sincronizzazione multi-device;
- ottimizzazione delle sostituzioni durante la giornata.

Questi elementi potranno essere valutati solo dopo aver misurato la qualità della V2 con i dati già disponibili.

## 14. Criteri di accettazione

La V2 è accettata quando:

- il 4-2-3-1 è il modulo preferito e viene mostrato per primo quando valido;
- ogni giocatore della rosa ha score o una motivazione esplicita per l'assenza di score;
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
4. estendere l'output delle raccomandazioni con confidenza e alternative;
5. rendere 4-2-3-1 il modulo preferito e aggiornare la dashboard;
6. aggiungere test di integrazione/optimizer;
7. eseguire test completi e build;
8. verificare visivamente la schermata Giornata e il comportamento con dataset incompleti.
