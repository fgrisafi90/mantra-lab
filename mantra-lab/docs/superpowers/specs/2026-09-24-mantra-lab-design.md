# Mantra Lab — Specifica di Progetto

**Data:** 24/09/2026  
**Stato:** Bozza da approvare  
**Ambito:** Web app/PWA personale, a costo zero, per Fantacalcio Mantra

## 1. Obiettivo
Creare una piattaforma personale per Fantacalcio Mantra utilizzabile da iPhone e Mac che permetta di:
- salvare e gestire la propria rosa;
- provare tutti i moduli Mantra supportati;
- rispettare automaticamente la compatibilità dei ruoli;
- suggerire la miglior formazione valida per ogni giornata di Serie A;
- spiegare perché un modulo o un giocatore viene preferito;
- effettuare un’analisi esterna complessiva della giornata usando dati pubblici aggiornati;
- aggiornarsi automaticamente in base al calendario reale della Serie A;
- restare gratuita nella prima versione, senza dipendere da API o servizi AI a pagamento.

## 2. Modalità di utilizzo
Il prodotto sarà una **PWA responsive** pubblicata tramite **GitHub Pages**.

Utilizzo principale:
- **iPhone:** interfaccia pensata prima di tutto per mobile, installabile sulla schermata Home.
- **Mac:** spazio di lavoro più ampio per gestione rosa, asta e confronto delle formazioni.

Un solo progetto servirà entrambi i dispositivi.

## 3. Vincolo di costo
La V1 non dovrà dipendere da hosting a pagamento, AI a pagamento o API calcistiche a pagamento.

Architettura prevista:
- frontend statico su GitHub Pages;
- calcolo lato browser per compatibilità Mantra e ottimizzazione della formazione;
- GitHub Actions programmati per aggiornare i dati esterni;
- file JSON aggiornati automaticamente dai workflow;
- salvataggio locale nel browser per rosa e impostazioni personali, salvo futura sincronizzazione.

Per la V1 non saranno necessarie API key o servizi a pagamento.

## 4. Sezioni principali

### 4.1 Giornata
Schermata principale dedicata alla giornata di Serie A corrente.

Mostra:
- numero della giornata;
- prossimo calcio d’inizio;
- ultimo aggiornamento dei dati;
- eventuali dati vecchi o avvisi;
- formazione consigliata;
- moduli alternativi;
- indisponibili / dubbi / ballottaggi;
- comando per ricaricare i dati pubblicati più recenti.

### 4.2 Formazione
Campo Mantra interattivo.

Funzioni:
- scelta del modulo;
- tocco su una casella per vedere solo i giocatori compatibili;
- drag & drop su desktop, dove utile;
- segnalazione immediata delle incompatibilità di ruolo;
- gestione panchina;
- confronto tra formazione scelta e formazione consigliata;
- salvataggio locale di più bozze.

### 4.3 Rosa
Gestione della rosa personale.

Per ogni giocatore saranno salvati almeno:
- nome;
- squadra;
- ruolo/i Mantra ufficiali;
- attivo/non attivo;
- prezzo d’acquisto opzionale;
- nota personale opzionale;
- preferito/priorità personale opzionale.

I dati relativi alla singola giornata arriveranno invece dal dataset pubblico aggiornato.

### 4.4 Asta
Simulatore pre-asta e durante l’asta.

Funzioni:
- costruzione di una rosa ipotetica;
- verifica copertura moduli;
- individuazione dei ruoli scoperti;
- conteggio dei multiruolo;
- analisi della distribuzione budget;
- segnalazione di problemi strutturali, ad esempio “solo 2 E affidabili” oppure “nessun sostituto naturale della T”.

## 5. Regola degli aggiornamenti automatici
Il sistema dovrà ricavare l’inizio e la fine di ogni giornata di Serie A dal calendario reale.

Regole:
1. Primo aggiornamento automatico il giorno prima della prima partita della giornata.
2. Se la giornata è distribuita su più giorni, nuovo aggiornamento in ogni giorno successivo in cui restano partite ancora da disputare.
3. Stop agli aggiornamenti quando non ci sono più partite da giocare.
4. La logica non dovrà dipendere da venerdì/sabato/domenica, ma funzionare anche con turni infrasettimanali, festività, anticipi, posticipi o rinvii.

Esempi:
- prima partita giovedì, altre partite venerdì/sabato/domenica → aggiornamento mercoledì, poi venerdì, sabato e domenica;
- prima partita sabato, ultima lunedì → aggiornamento venerdì, poi domenica e lunedì.

## 6. Dati esterni da analizzare
Il sistema dovrà aggregare solo dati ottenibili legalmente e in modo affidabile da fonti pubbliche o gratuite.

Segnali da considerare:
- probabilità di titolarità / probabile formazione;
- infortuni;
- squalifiche;
- ballottaggi e rischio turnover;
- minuti recenti;
- rendimento fantacalcistico recente;
- gol e assist;
- rigori e piazzati;
- casa/trasferta;
- forza dell’avversario;
- forma recente della squadra e del giocatore;
- posizione reale in campo, dove utile;
- statistiche avanzate come tiri, xG/xA solo se troviamo una fonte gratuita e stabile.

Dove possibile, ogni dato importato dovrà mantenere anche fonte e timestamp, così da capire se è aggiornato o meno.

## 7. Indice Giornata del Giocatore (0–100)
La V1 utilizzerà un modello deterministico, non AI a pagamento.

Pesi concettuali iniziali:
- **Disponibilità e minuti attesi — 30%**
- **Forma recente — 20%**
- **Avversario e contesto partita — 15%**
- **Potenziale bonus — 15%**
- **Rigori e piazzati — 10%**
- **Casa/trasferta e contesto squadra — 5%**
- **Opportunità tattica/ruolo — 5%**

Regole importanti:
- indisponibile certo = esclusione;
- forte dubbio o rischio turnover = penalizzazione significativa;
- la forma recente non deve mai pesare più dei minuti attesi;
- il punteggio deve essere spiegabile: l’interfaccia mostrerà i principali fattori positivi e negativi.

I pesi dovranno essere modificabili nel codice per poterli tarare nel tempo.

## 8. Ottimizzazione della formazione
Il sistema non dovrà semplicemente scegliere gli 11 giocatori col punteggio più alto.

Per ogni modulo Mantra supportato dovrà:
1. creare le caselle richieste dal modulo;
2. costruire la matrice di compatibilità in base ai ruoli Mantra ufficiali;
3. cercare tutte le assegnazioni giocatore-casella valide;
4. massimizzare il punteggio totale della formazione;
5. applicare piccoli criteri di spareggio legati a rischio/copertura quando necessario;
6. ordinare i migliori moduli validi.

Esempio di risultato:
- 3-4-1-2 — 84/100
- 3-5-2 — 81/100
- 3-4-3 — 78/100

Il punteggio del modulo serve a confrontare le opzioni per quella rosa e quella giornata; non rappresenta una previsione certa dei fantapunti.

## 9. Spiegazione delle scelte
Ogni consiglio dovrà essere accompagnato da una motivazione leggibile, generata con regole e testi predefiniti.

Esempio:
“Il 3-4-1-2 è preferibile perché permette di utilizzare Pulisic da T, mantiene la combinazione A/Pc più forte e evita di affidarsi a un E in forte ballottaggio.”

Il sistema dovrà spiegare:
- perché un modulo risulta migliore;
- perché un giocatore viene preferito a un’alternativa vicina;
- perché un giocatore viene penalizzato;
- quali incertezze restano.

Non sarà necessaria un’AI a pagamento.

## 10. Confronto giocatori
Sarà possibile confrontare due giocatori della propria rosa.

Campi di confronto:
- compatibilità di ruolo;
- probabilità di titolarità / minuti attesi;
- indice giornata;
- forma recente;
- avversario;
- casa/trasferta;
- rigori/piazzati;
- indisponibilità o rischio;
- breve spiegazione dei fattori che fanno pendere la scelta da una parte o dall’altra.

## 11. Comportamento sui dispositivi
### iPhone
- navigazione inferiore;
- interazioni pensate per il tocco;
- campo e lista giocatori organizzati verticalmente;
- installazione come PWA;
- layout compatibile con safe area.

### Mac
- dashboard più larga, anche a tre colonne dove utile;
- drag & drop sul campo;
- tabelle più ampie per confronto e asta;
- stesso modello dati della versione mobile.

La V1 **non includerà ancora una sincronizzazione automatica tra iPhone e Mac**, perché l’architettura gratuita basata su salvataggio locale rende i browser indipendenti. La sincronizzazione potrà essere aggiunta in futuro se troviamo una soluzione gratuita e affidabile.

## 12. Salvataggio dati
Per la V1 i dati personali saranno salvati tramite:
- localStorage oppure IndexedDB;
- esportazione della rosa e impostazioni in formato JSON;
- importazione del JSON su un altro dispositivo.

Questo permette di passare da iPhone a Mac a costo zero senza server personale.

## 13. Struttura del repository / pubblicazione
Struttura proposta del repository GitHub:

```text
/
  src/
    components/
    pages/
    engine/
      mantraRoles.ts
      formations.ts
      optimizer.ts
      matchdayScore.ts
    data/
      generated/
    storage/
  scripts/
    update-serie-a-data.*
  .github/
    workflows/
      update-data.yml
      deploy-pages.yml
  docs/
```

Il repository pubblico conterrà solo codice applicativo e dati calcistici pubblici. La rosa personale rimarrà sul dispositivo e non verrà caricata nel repository.

## 14. Criteri di completamento della V1
La V1 sarà considerata completa quando sarà possibile:
1. aprirla da iPhone e Mac;
2. aggiungere, modificare e rimuovere giocatori;
3. assegnare ruoli Mantra ufficiali;
4. scegliere e provare i moduli Mantra;
5. inserire solo giocatori compatibili nelle caselle;
6. chiedere all’app di trovare la miglior formazione valida;
7. vedere almeno due moduli alternativi;
8. capire le motivazioni principali dei consigli;
9. esportare/importare la rosa tra dispositivi;
10. utilizzare un dataset esterno aggiornato automaticamente con GitHub Actions secondo la regola concordata per le giornate di Serie A.

## 15. Fuori ambito per la V1
Per mantenere il progetto gratuito e concentrato, la V1 non includerà:
- account utenti;
- abbonamenti;
- leghe pubbliche multiutente;
- API AI a pagamento;
- pubblicazione nativa su App Store;
- notifiche push;
- sincronizzazione cloud automatica della rosa;
- funzioni di scommessa o pronostico.

## 16. Rischio tecnico principale
Il rischio maggiore non riguarda il campo Mantra o l’algoritmo di ottimizzazione, ma la stabilità e l’utilizzo consentito delle fonti gratuite di dati calcistici.

Per questo il sistema di raccolta dati dovrà essere modulare: se una fonte cambia o smette di funzionare, dovrà poter essere sostituita senza dover rifare l’app o l’algoritmo.

## 17. Ordine di sviluppo
1. Struttura responsive e navigazione.
2. Modello rosa e salvataggio locale.
3. Definizione moduli Mantra e compatibilità ruoli.
4. Campo interattivo.
5. Ottimizzatore e spiegazioni.
6. Analisi della rosa per l’asta.
7. Raccolta dati esterni.
8. Logica di aggiornamento con GitHub Actions.
9. Rifinitura PWA/mobile e test su iPhone + Mac.
