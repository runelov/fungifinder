# FungiFinder (app)

Dette er den **offentlige** delen av FungiFinder: rene statiske filer (HTML/CSS/JS)
uten noe personlig innhold. Terrengdata og personlige data (funn, hogst-merker,
egne steder) hentes fra et **privat** data-repo — se
[fungifinder-data](../fungifinder-data) (eller ditt eget tilsvarende repo).

## Struktur

```
index.html          Markup, ingen inline stiler/skript
css/styles.css       All styling
js/github-store.js   Generisk GitHub Contents API-modul (leser/skriver JSON i et privat repo)
js/app.js            All applikasjonslogikk
```

Ingen data ligger i dette repoet — det er trygt å gjøre offentlig, dele koden,
eller gjenbruke som mal for andre prosjekter.

## Oppsett

1. Publiser dette repoet via **GitHub Pages** (Settings → Pages → Deploy from
   branch `main`, mappe `/root`).
2. Opprett (eller pek til) et **privat** repo med `data/locations.json` (tomt
   ved oppstart — `[]`), `data/fetched-areas.json` (også `[]`), og
   `data/personal.json` — se README i data-repoet.
3. Åpne den publiserte siden → panelet **"Synk (GitHub-datarepo)"** → fyll inn:
   - Privat data-repo: `dittbrukernavn/fungifinder-data`
   - Sti til terrengdata: `data/locations.json`
   - Sti til personlige data: `data/personal.json`
   - Token: et fine-grained personal access token med **Contents: Read and
     write** OG **Actions: Read and write**, begrenset til kun data-repoet
4. **Koble til**

## Hvordan datainnhentingen fungerer nå

Repoet starter helt tomt. Når du velger et fylke, en kommune, eller et
radiuspunkt i kartet uten at det finnes data for området ennå, dukker det opp
et panel: **"Hente terrengdata for dette området?"** med en glidebryter for
hvor tett rutenett av kandidatpunkter som skal sjekkes, og et grovt estimat på
antall punkter/ventetid. Trykker du "Hent data", trigges en GitHub
Actions-jobb i det private data-repoet som henter og beriker data for akkurat
det området (typisk 1-10+ minutter avhengig av områdestørrelse og
rutenett-tetthet), og appen laster inn resultatet automatisk når jobben er
ferdig.

Uten synk-oppsett fungerer appen fortsatt — den viser da bare et lite
innebygd demo-datasett og lagrer personlige data i nettleserens
`localStorage` på denne enheten alene.

## Sikkerhet

- Tokenet lagres kun i `localStorage` i din nettleser — aldri i kode eller i
  noe repo.
- All brukerinnhold (stedsnavn, notater osv.) escapes før det vises, for å
  hindre lagret XSS.
- Hold data-repoet **privat** — selve denne appen (Pages-URL-en) er offentlig
  tilgjengelig for alle som har lenken, men uten token kan ingen lese eller
  skrive dine personlige data.
