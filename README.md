# FungiFinder (app)

Dette er den **offentlige** delen av FungiFinder: rene statiske filer (HTML/CSS/JS)
uten noe personlig innhold. Terrengdata og personlige data (funn, hogst-merker,
egne steder) hentes fra [fungifinder-api](worker/api) (Cloudflare Worker + D1),
som selv leser/skriver terrengdatasettet i det **private** data-repoet
[fungifinder-db](../fungifinder-db) på vegne av innloggede brukere.

## Struktur

```
index.html          Markup, ingen inline stiler/skript
css/styles.css       All styling
js/api-client.js     Klient for fungifinder-api (auth, roller, terrengdata, personlige data)
js/app.js            All applikasjonslogikk
worker/api/          Cloudflare Worker + D1 — auth (magic-link/sesjoner), roller, admin/invitasjoner
```

Ingen data ligger i dette repoet — det er trygt å gjøre offentlig, dele koden,
eller gjenbruke som mal for andre prosjekter.

## Versjonering og caching

Ingen build-steg her, med vilje — så cache-busting er manuell. Ved hver
versjonsbump må disse tre stedene oppdateres sammen:

1. `APP_VERSION` i `js/app.js`
2. `?v=<versjon>` på `css/styles.css`, `js/api-client.js` og `js/app.js` i `index.html`
3. Ny seksjon i `CHANGELOG.md`

Glemmer man punkt 2, varsler `app.js` selv i konsollen ved oppstart (ikke i
UI) om at `?v=` i `index.html` ikke stemmer med `APP_VERSION` — men KUN for
sin egen `<script>`-tag, ikke for `css/styles.css`/`js/api-client.js` (se
2026-08-11: `js/app.js?v=` ble bumpet korrekt, de to andre ble likevel
stående på gamle verdier siden konsoll-sjekken aldri fanger det). `index.html`
har også `Cache-Control: no-cache`-metatagger slik at nettlesere/installerte
PWA-er alltid revaliderer HTML-en — kombinert med `?v=` tvinger dette frem
riktig js/css uten at brukeren må hard-refreshe manuelt.

En pre-commit-hook (`.githooks/pre-commit`) sjekker nå alle tre `?v=` mot
`APP_VERSION` og blokkerer committen ved avvik — mer pålitelig enn å stole
på at noen husker det. Aktiver den én gang per klon:

```bash
git config core.hooksPath .githooks
```

## Oppsett

1. Publiser dette repoet via **GitHub Pages** (Settings → Pages → Deploy from
   branch `main`, mappe `/root`).
2. Sett opp `fungifinder-api` — se [worker/api/README.md](worker/api/README.md)
   for de administrative stegene (Cloudflare-konto, D1, hemmeligheter,
   deploy, og å sette deg selv opp som første admin).
3. Åpne den publiserte siden → **⚙ Preferanser & Config → Konto** → logg inn
   med e-posten din (må være registrert som admin/invitert bruker fra før).
4. Som admin: bruk **🛡️ Admin**-fanen til å invitere flere brukere.

Kun admin kan sette i gang analyse av nye områder (se under). Inviterte
brukere kan logge inn, se turforslag basert på allerede analyserte
terrengpunkter, og registrere sine egne funn.

## Hvordan datainnhentingen fungerer nå

Data-repoet starter helt tomt. Når admin velger et fylke, en kommune, eller et
radiuspunkt i kartet uten at det finnes data for området ennå, dukker det opp
et panel: **"Hente terrengdata for dette området?"** (kun synlig for admin)
med en glidebryter for hvor tett rutenett av kandidatpunkter som skal
sjekkes, og et grovt estimat på antall punkter/ventetid. Trykker admin
"Hent data", ber `fungifinder-api` GitHub Actions-jobben i det private
data-repoet om å hente og berike data for akkurat det området (typisk
1-10+ minutter avhengig av områdestørrelse og rutenett-tetthet), og appen
laster inn resultatet automatisk når jobben er ferdig.

Uten innlogging fungerer appen fortsatt — den viser da bare et lite innebygd
demo-datasett, og funn/hogst-merking/områdeforslag er skjult.

## Datakilder og vekting

Terrengdata hentes av `fetch_area.py` i data-repoet (se README der for
detaljer per kilde):

| Kilde | Gir |
|---|---|
| Kartverket høgdeprofil | Høyde, terreng, stedsnavn, helning/himmelretning |
| NIBIO SR16 | Treslag, skogalder, hogstår |
| NIBIO Markfuktighet | Fuktighetsnivå |
| NGU berggrunn | Kalkinnhold |
| NVDB/OSM Overpass | Avstand til kjørbar vei |
| Artsdatabanken Artskart | Kjente tidligere funn av arten i nærheten |
| Open-Meteo (live, i appen) | Nedbør/temperatur siste 14 dager, og sesonghistorikk (1. mai–i dag) |
| Dine egne funn | Din funnhistorikk på stedet |

`scoreLocation()` i `js/app.js` vekter disse mot artens profil (0-100 poeng
totalt, ukjent verdi teller alltid nøytralt/50%):

| Faktor | Maks poeng |
|---|---|
| Treslag | 30 |
| Fuktighet | 20 |
| Berggrunn | 15 |
| Skogalder | 15 |
| Sesong | 10 |
| Kjente funn i databasen | +8 |
| Værvindu (nedbør/temp, siste 14 dager) | +12 / -6 |
| Sesonghistorikk (nedbør mai–i dag) | +4 / -4 |
| Egen funnhistorikk | opptil +30 |
| Sørvendt skråning (varmekjære arter) | +5 |
| Adkomst (vei/parkering/stier) | +10 / -18 |
| Ro/avstand fra folk (valgfri) | +14 / -8 |

Treslag veier tyngst av terrengfaktorene (sterkeste mykorrhiza-indikator).
Egen funnhistorikk kan trumfe alt annet.

Artenes vekstvilkår (`SPECIES` i `js/app.js`) er kildehenvist per art mot
Artfakta/SLU Artdatabanken og Artsdatabankens rødliste, se
[docs/artsprofiler-forskningsgrunnlag.md](docs/artsprofiler-forskningsgrunnlag.md).
Åpne funn og andre mulige fremtidige utvidelser (bl.a. tre arter fjernet
2026-08-18 pga. feil scoringsmodell) står i
[docs/veien-videre.md](docs/veien-videre.md).

## Sikkerhet

- Innlogging skjer via magic-link + sesjonscookie (`fungifinder_sesjon`,
  `HttpOnly`+`Secure`) — ingen passord, ingen GitHub-token i nettleseren i
  det hele tatt. Se [worker/api/README.md](worker/api/README.md) for
  detaljer (inkl. hvorfor cookien er `SameSite=None` i stedet for `Lax`).
- To roller: `admin` (kan trigge nye områdeanalyser, invitere/administrere
  brukere) og `bruker` (kan lese allerede analyserte terrengpunkter og
  registrere egne funn, håndhevet server-side — ikke bare skjult i UI).
- All brukerinnhold (stedsnavn, notater osv.) escapes før det vises, for å
  hindre lagret XSS.
- Hold data-repoet **privat** — selve denne appen (Pages-URL-en) er offentlig
  tilgjengelig for alle som har lenken, men `fungifinder-api` krever gyldig
  sesjon for all lese-/skrivetilgang til terreng-/personlige data.

## Enhetstester

Ingen build/lint-steg her fortsatt, men det finnes nå et enhetstestregime
(Node sin innebygde `node:test` + `node:sqlite`, ingen npm-avhengigheter),
kjørt som en påkrevd GitHub Actions-sjekk på hver PR mot `main` — se
`.github/workflows/test.yml`. Kjør lokalt fra repo-roten:

```bash
npm test
```

Dette finner rekursivt både `test/repo-consistency.test.js` (repo-rot) og
`worker/api/test/lib/*.test.js` (kan også kjøres isolert med
`cd worker/api && npm test`). Dekker:

- **`worker/api/src/lib/`** (auth/sesjon/rate-limit/CORS/D1-mapping): ekte
  logikk kjørt mot ekte SQL — `worker/api/test/helpers/fakeD1.js` gir en
  D1-kompatibel `.prepare().bind().first()/.run()/.all()`-kontrakt oppå
  `node:sqlite`, lastet med de SAMME `worker/api/migrations/*.sql`-filene
  som brukes mot ekte D1 (ikke et duplisert testskjema). Inkluderer en
  regresjonstest for 2026-08-16-fiksen (sesjonsutløp glir fremover ved
  rullering, ikke fast fra innlogging) og for migrasjon 0004
  (parkeringsfeltene i `terrengDb.js` sin camelCase-kontrakt).
- **`test/repo-consistency.test.js`**: statiske regresjonstester for
  konkrete hendelser — versjons-/cache-busting-konsistens (samme sjekk som
  `.githooks/pre-commit` over, men håndhevet på PR-en uavhengig av om noen
  har aktivert hooken lokalt, og utvidet til også å sjekke CHANGELOG.md sin
  toppseksjon), at Turnstile-`data-sitekey` i `index.html` aldri er
  Cloudflares always-pass-testnøkkel (hendelsen 2026-07-20), at
  `ALLOWED_ORIGIN` i `wrangler.toml` er et konkret opphav (aldri wildcard —
  se `worker/api/src/lib/cors.js`), og `node --check` på alle `.js`-filer
  under `js/` og `worker/api/src/`.

**Bevisst IKKE dekket ennå**: `js/app.js` sin UI-/kart-/scoring-logikk
(inkl. `scoreLocation()`) — hele filen er én udelt IIFE-closure uten
eksporterte funksjoner, så å teste den krever først å bryte ut rene
funksjoner til egne moduler, en egen (mer invasiv) oppgave. Manuell
verifisering mot en lokal server er fortsatt normen for endringer der.
