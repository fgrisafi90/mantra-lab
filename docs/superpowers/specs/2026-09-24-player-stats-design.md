# Mantra Lab — Pannello statistiche giocatore e crediti asta

## Obiettivo

Aggiungere a Mantra Lab una scheda giocatore apribile da qualunque punto dell'app, con dati statistici aggiornati automaticamente da Fantacalcio.it e con avatar dei calciatori. Contestualmente, completare il flusso di aggiunta giocatore dal listone permettendo di inserire facoltativamente i crediti spesi prima di aggiungerlo alla Rosa reale.

## Requisiti approvati

- La scheda giocatore deve essere disponibile per tutti i giocatori, non soltanto quelli presenti nella Rosa reale.
- Deve aprirsi come pannello/modal sopra la schermata corrente, senza cambiare sezione.
- Deve essere richiamabile almeno da Rosa, listone, Asta, Simulatore e Formazione quando il giocatore è visualizzato.
- La fonte unica per i dati statistici e fantacalcistici è Fantacalcio.it.
- L'aggiornamento deve avvenire automaticamente dopo la chiusura della giornata, quando Fantacalcio.it pubblica/consolida i voti ufficiali.
- Ogni giocatore deve avere un avatar/foto quando disponibile.
- In assenza di immagine valida, l'interfaccia deve mostrare un fallback coerente con lo stile Mantra Lab.
- Gli avatar devono comparire sia nelle liste sia nel pannello dettaglio.
- Il campo crediti spesi durante l'aggiunta dal listone deve essere disponibile ma non obbligatorio.
- Il budget iniziale resta manuale e i crediti residui continuano a dipendere dalla somma dei prezzi realmente inseriti.
- La Rosa reale e i dati salvati localmente non devono essere cancellati o migrati in modo distruttivo.

## Esperienza utente

### Apertura pannello

Il nome o la riga del giocatore diventa cliccabile/toccabile. Il tap apre un pannello sopra la vista corrente. Il pannello deve poter essere chiuso con pulsante dedicato e tap sull'overlay, senza perdere filtri, formazione, simulazione o scroll della sezione sottostante.

### Header giocatore

Il pannello mostra:

- avatar grande;
- nome giocatore;
- squadra;
- ruolo/i Mantra;
- eventuale quotazione/FVM già disponibili nel catalogo.

### Riepilogo stagione

Mostrare, quando disponibili dalla fonte:

- media voto;
- fantamedia;
- partite a voto;
- presenze;
- gol;
- assist;
- ammonizioni;
- espulsioni;
- autogol;
- rigori segnati;
- rigori totali/sbagliati quando disponibili.

I valori non disponibili non devono essere inventati.

### Storico giornata per giornata

Per ogni giornata, quando il dato è disponibile, mostrare:

- numero giornata;
- avversario;
- casa/trasferta;
- stato presenza: Titolare, Entrato/Subentrato, Inutilizzato, Infortunato, Squalificato;
- voto;
- fantavoto;
- gol;
- assist;
- ammonizione/espulsione;
- altri bonus/malus disponibili;
- minuti giocati se esposti in modo affidabile.

Toccando una giornata si espande un dettaglio compatto; non è richiesta una nuova pagina.

## Dati e sincronizzazione

### Fonte

Fantacalcio.it è la fonte unica dei dati della scheda giocatore. L'accesso alla fonte deve essere isolato in un adapter dedicato, così eventuali cambiamenti HTML o strutturali non rompono l'intera app.

### Aggiornamento automatico

La sincronizzazione avviene tramite GitHub Actions, non direttamente dal browser.

Flusso:

1. GitHub Action controlla periodicamente la fonte.
2. Se i voti risultano pubblicati/consolidati, scarica e normalizza i dati.
3. Aggiorna un dataset giocatori/statistiche nel repository.
4. Committa solo quando il contenuto cambia davvero.
5. L'app legge il dataset pubblicato con cache-busting.

Se la fonte non è raggiungibile o cambia struttura, il workflow mantiene l'ultimo dataset valido.

### Dataset

File proposto:

`src/data/generated/player-stats.json`

Struttura logica:

```json
{
  "generatedAt": "2026-09-24T00:00:00.000Z",
  "season": "2026/2027",
  "players": [
    {
      "id": "stable-player-key",
      "name": "Mario Rossi",
      "club": "Club",
      "roles": ["A"],
      "avatarUrl": "https://...",
      "seasonStats": {
        "appearances": 20,
        "ratedMatches": 18,
        "averageRating": 6.31,
        "fantasyAverage": 7.02,
        "goals": 8,
        "assists": 4,
        "yellowCards": 2,
        "redCards": 0,
        "ownGoals": 0,
        "penaltiesScored": 1,
        "penaltiesTotal": 1
      },
      "matchdays": [
        {
          "matchday": 5,
          "opponent": "Avversario",
          "venue": "home",
          "status": "starter",
          "minutes": 82,
          "rating": 7,
          "fantasyRating": 10,
          "goals": 1,
          "assists": 0,
          "yellowCard": false,
          "redCard": false
        }
      ]
    }
  ]
}
```

### Matching giocatori

Preferire una chiave stabile fornita dalla fonte. In assenza, usare una chiave normalizzata nome + squadra con gestione esplicita delle ambiguità. Un mancato match deve mostrare il giocatore senza statistiche, mai associare dati potenzialmente errati.

## Avatar

- avatar circolare piccolo nelle liste;
- avatar grande nel pannello;
- lazy loading nelle liste;
- fallback automatico per URL mancante/errore immagine;
- il fallimento dell'immagine non deve bloccare le statistiche.

## Crediti spesi dal listone

Il pulsante `Aggiungi` apre una piccola conferma con:

- nome;
- squadra;
- ruolo/i;
- campo numerico `Crediti spesi` facoltativo;
- pulsante `Aggiungi alla rosa`.

Campo vuoto: giocatore salvato senza `purchasePrice`.
Campo compilato: valore non negativo, budget aggiornato subito.
Il prezzo resta modificabile successivamente.

## Stati e fallback

- Dataset assente: `Statistiche non ancora disponibili`.
- Dati vecchi: mostrare ultimo dato valido e ultimo aggiornamento.
- Avatar rotto: fallback grafico.
- Giocatore non matchato: nessuna statistica inventata.
- Fonte temporaneamente non disponibile: non cancellare il dataset precedente.
- Voti non ancora ufficiali: non consolidare la giornata come definitiva.

## Performance

- Nessuna richiesta a Fantacalcio.it al tap sul giocatore.
- Dataset caricato una volta e indicizzato in memoria.
- Avatar lazy-loaded nelle liste.
- Pannello renderizzato solo quando richiesto.

## Persistenza

Le statistiche pubbliche non vanno nel localStorage. Rosa, budget e prezzi restano nel meccanismo locale esistente. Nessuna modifica deve cancellare o resettare questi dati.

## Test richiesti

- apertura/chiusura pannello senza cambiare sezione;
- stesso pannello accessibile da più punti;
- riepilogo stagione;
- storico giornate;
- fallback statistiche;
- fallback avatar;
- matching corretto e nessun match ambiguo;
- parser Fantacalcio con fixture locale;
- workflow con fonte degradata;
- crediti facoltativi dal listone;
- budget aggiornato quando prezzo presente;
- budget invariato quando prezzo omesso;
- preservazione Rosa esistente.

## Fuori scope

- login/account;
- sincronizzazione cloud Rosa;
- notifiche push;
- grafici avanzati;
- comparatore multi-giocatore;
- scraping in tempo reale dal browser;
- copia grafica identica di Fantacalcio.it.

## Criteri di accettazione

1. Ogni giocatore visualizzato nelle principali sezioni apre lo stesso pannello.
2. Il pannello mostra avatar, riepilogo e storico quando disponibili.
3. Il dataset è aggiornabile automaticamente da GitHub Actions dopo i voti ufficiali.
4. Un guasto della fonte non cancella dati validi.
5. L'aggiunta dal listone permette un prezzo facoltativo.
6. Budget e Rosa reale continuano a funzionare senza perdita dati.
7. I test di regressione coprono tutti i flussi sopra.
