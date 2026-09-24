# Fonti dati — Mantra Lab V1

## Fonte primaria: Lega Serie A SDP

Base: `https://api-sdp.legaseriea.it/v1/serie-a/football`

È l'API JSON pubblica usata dal sito Lega Serie A. Non richiede API key, ma è non documentata ufficialmente come API per sviluppatori; per questo Mantra Lab la isola dietro adattatori sostituibili.

Dati usati:
- catalogo stagioni;
- calendario e stato delle partite;
- classifica;
- statistiche stagionali dei giocatori;
- formazioni ufficiali della singola partita quando disponibili.

Endpoint principali:
- `/competitions/{competitionId}/seasons`
- `/seasons/{seasonId}/matches`
- `/seasons/{seasonId}/standings/overall`
- `/seasons/{seasonId}/stats/players?category=General&page=N`
- `/seasons/{seasonId}/matches/{matchId}/lineups`

### Limite importante
Le line-up sono formazioni **ufficiali**, quindi normalmente non sono disponibili il giorno prima della partita. La V1 non finge che equivalgano alle “probabili formazioni”: prima dell'ufficialità usa proxy conservativi basati su presenze/minuti e dati stagionali; quando una lineup ufficiale compare, aggiorna fortemente disponibilità e minuti attesi.

La V1 non possiede ancora una fonte gratuita sufficientemente stabile e verificata per infortuni, squalifiche, rigoristi/piazzati e probabili formazioni pre-partita. Questi segnali restano neutrali invece di essere inventati.

## Fallback calendario/risultati

`football-data.co.uk` pubblica CSV gratuiti per la Serie A e può diventare un fallback per calendario/risultati se l'endpoint Lega cambia. Non viene usato come fonte giocatori perché non offre il livello di dettaglio richiesto dalla piattaforma.

## Resilienza

- Se il calendario Lega non risponde, il workflow non sovrascrive il dataset esistente.
- Se le statistiche giocatore falliscono, calendario e timestamp vengono aggiornati ma i segnali giocatore precedenti sono conservati e la fonte viene marcata `degraded`.
- Se una lineup singola non è disponibile, il resto del dataset continua a essere generato.
- Ogni dataset registra fonte, timestamp e stato.

## Scoring V1

Le statistiche stagionali producono segnali volutamente prudenti:
- minuti medi → minuti attesi;
- gol/assist per 90 → potenziale bonus;
- tiri in porta/key pass per 90 → opportunità tattica;
- posizione avversaria in classifica → contesto avversario;
- casa/trasferta → contesto partita;
- forma recente e piazzati restano neutrali (50) finché non viene collegata una fonte affidabile.

Questa scelta privilegia la trasparenza rispetto a una precisione apparente basata su dati non verificati.
