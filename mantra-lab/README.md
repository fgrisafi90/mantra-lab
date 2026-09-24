# Mantra Lab

PWA personale e gratuita per Fantacalcio Mantra, pensata per iPhone e Mac.

## Cosa fa la V1

- gestione della rosa nel browser;
- import/export JSON per spostare la rosa tra iPhone e Mac;
- tutti gli 11 moduli Mantra previsti dalla V1;
- campo interattivo con filtro automatico dei soli giocatori compatibili;
- controllo coperture per l'asta;
- indice giornata 0–100 spiegabile;
- ottimizzatore che prova le formazioni Mantra valide senza duplicare giocatori;
- formazione consigliata + alternative;
- aggiornamento automatico dei dati con GitHub Actions;
- dati pubblici Serie A senza API key a pagamento;
- PWA installabile sulla schermata Home di iPhone.

## Dati personali

La rosa resta nel `localStorage` del browser. Non viene caricata su GitHub.

Per passare da un dispositivo all'altro:
1. apri **Rosa**;
2. premi **Esporta**;
3. trasferisci `mantra-lab-rosa.json`;
4. sull'altro dispositivo premi **Importa**.

## Aggiornamenti della giornata

Il workflow `Update matchday data` controlla ogni giorno il calendario Serie A.

La logica effettua il refresh:
- il giorno prima della prima partita della giornata;
- poi in ogni giorno successivo al primo giorno di gara in cui restano partite da disputare;
- mai in base a giorni fissi della settimana.

Il pulsante **Aggiorna dati** nell'app ricarica l'ultimo dataset già pubblicato. Non avvia un workflow GitHub autenticato dal browser.

## Fonti dati

La fonte primaria della V1 è l'endpoint JSON pubblico della Lega Serie A. Dettagli e limiti sono documentati in [`docs/data-sources.md`](docs/data-sources.md).

Nota importante: le line-up della Lega sono formazioni ufficiali e in genere arrivano vicino al calcio d'inizio. Prima dell'ufficialità la V1 usa proxy conservativi basati su presenze/minuti/statistiche stagionali; non inventa probabili formazioni o infortuni.

## Sviluppo locale

Richiede Node.js 22+ e non ha dipendenze npm esterne.

```bash
npm test
npm run build
npm run dev
```

Poi apri `http://localhost:4173`.

## Pubblicazione GitHub Pages

1. Crea un repository GitHub pubblico, ad esempio `mantra-lab`.
2. Carica questo progetto nel repository.
3. In GitHub vai in **Settings → Pages** e scegli **GitHub Actions** come sorgente, se richiesto.
4. Il workflow `Deploy Pages` esegue test, build e pubblicazione.
5. Il workflow `Update matchday data` aggiorna il JSON e, al termine, fa rieseguire il deploy della pagina.

## Installazione su iPhone

Dopo la pubblicazione:
1. apri l'indirizzo GitHub Pages in Safari;
2. tocca **Condividi**;
3. scegli **Aggiungi alla schermata Home**;
4. apri Mantra Lab dalla nuova icona.

## Struttura principale

- `src/domain/` — ruoli, moduli, scoring, ottimizzatore;
- `src/app/` — interfaccia dell'app;
- `src/storage/` — rosa locale e import/export;
- `scripts/sources/` — adattatori delle fonti Serie A;
- `scripts/updateMatchdayData.mjs` — generazione dataset giornata;
- `.github/workflows/` — aggiornamento dati e GitHub Pages;
- `tests/` — test automatici.

## Limiti V1

- nessuna sincronizzazione cloud automatica tra iPhone e Mac;
- nessun account utente;
- nessuna API AI a pagamento;
- nessuna fonte gratuita verificata per probabili formazioni pre-partita, infortuni e rigoristi/piazzati: questi segnali restano neutrali finché non viene aggiunta una fonte affidabile.
