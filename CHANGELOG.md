# Endringslogg

## 0.5.4
- Fikset forvirrende "Fullført! Laster inn ny data"-tekst — viser nå tydelig to steg (jobb ferdig hos GitHub → henter til nettleseren → faktisk antall nye steder lagt til), med en kort pause så meldingen rekker å bli lest før panelet skjules

## 0.5.3
- Fikset kritisk visningsfeil: modaler (bl.a. "Legg til eget sted") lå bak Leaflet-kartet pga. for lav z-index
- Lagt til diagnostikk i fetch_area.py: suksessrate per datakilde skrives ut etter hver jobb, pluss ny `--test-point`-modus som tester alle kilder for ett punkt og skriver ut rå API-svar
- Hente-flyten sjekker nå om en jobb allerede kjører før den viser "Hent data"-knappen eller trigger en ny, og statusteksten skiller tydelig mellom "i kø", "kjører" og "fullført"

## 0.5.2
- Fikset 404 ved henting av terrengdata: appen antok tidligere at default-branch alltid het "main". Autodetekterer nå faktisk default-branch ved tilkobling.
- Lagt til preflight-sjekk som bekrefter at GitHub faktisk kjenner igjen workflow-filen før den prøver å trigge den, med presis feilmelding om årsak hvis ikke.
- Flyttet "Hente terrengdata"-panelet til rett under kartet (var tidligere nederst i sidepanelet før resultatlisten).

## 0.5.1
- Fylke- og kommune-filter er nå knyttet sammen: velg fylke i kommune-fanen for å snevre inn kommuneforslagene, eller la stå på "Alle fylker" for full alfabetisk liste med søk
- Kommune-/fylkesdata hentes nå fra Kartverkets offisielle Kommuneinfo-API (med lokal cache), i stedet for kun å være avledet fra allerede lastet stedsdata — løser at nedtrekkene var tomme i et helt tomt repo

## 0.5.0
- Versjonsvisning i header og Config-fane
- Info-boksene øverst ("Om dataene", sikkerhetsvarsel) er nå kollapsbare, med lagret tilstand
- Ny fanestruktur i sidepanelet: **Preferanser** (ro/hogst-innstillinger) og **Config** (GitHub-synk)

## 0.4.0
- Restrukturert datainnhenting til on-demand: repoet starter tomt, du velger område i kartet og bekrefter henting
- Ekte helning/himmelretning/fuktighet fra Kartverket høgdeprofil-API + NIBIO Markfuktighet
- Egen håndtering av periodisk oppfriskning vs. ny-henting (unngår duplikat-bug)

## 0.3.0
- Delt i to repoer: offentlig app (HTML/CSS/JS) + privat data-repo
- Generisk GitHub Contents API-modul for synk av terrengdata og personlige data

## 0.2.0
- Utvidet til hele Norge, 88 kuraterte eksempelsteder, detaljert Hobøl-dekning
- Lagt til Furuknippesopp og Kransmusserong
- Sikkerhetsgjennomgang (XSS-escaping)

## 0.1.0
- Første interaktive prototype: artsprofiler, terrengscoring, værintegrasjon, Leaflet-kart
