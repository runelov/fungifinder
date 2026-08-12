# Endringslogg

## 0.21.2 — Fiks: kart-zoom til fylke/kommune var ustabilt/tregt
Bruker meldte at kartet ikke pålitelig zoomet til valgt fylke/kommune etter
"min posisjon" — "virker som regel ikke, av og til virker det", og tar
"ekstremt lang tid" de gangene det virker.

- **Rotårsak funnet**: `fetchAreaBbox()` brukte et FRITEKST Nominatim-søk
  (`q=<navn> fylke, Norge`, `limit=1`) og stolte blindt på mest "importante"
  treff — nøyaktig samme bug som allerede ble funnet og fikset SERVER-side i
  `fetch_area.py` sin `resolve_area()` (fungifinder-db, 2026-08-11), men
  aldri portert til denne klient-side kopien. Konkret verifisert: "Innlandet
  fylke, Norge" matchet IKKE selve fylket — Nominatim ga en ubetydelig
  øy/bydel/grend med samme navn, og kartet zoomet til et par hundre meter
  tomt hav i stedet. Ingen timeout på kallet heller, så en treg/hengende
  Nominatim-respons forklarer trolig "ekstremt lang tid".
- **Fiks**: 15 faste, verifiserte bounding boxes for alle fylker (Nominatim
  structured `county=`-søk) hardkodet direkte i appen — ingen
  nettverksavhengighet for fylke-modus i det hele tatt lenger (den klart
  vanligste banen: brukeren har typisk allerede sett sin egen posisjon og
  velger fylket de står i). Kommune-modus (357 kommuner, kan ikke
  hardkodes) går fortsatt via Nominatim, men nå med samme strukturerte søk
  (`city=`) for å unngå navnekollisjonsklassen av feil, pluss en 8s timeout
  og en `localStorage`-cache på tvers av økter (samme mønster som
  `loadKommuneRegister()`) — ett Nominatim-kall per kommunenavn, for godt.

## 0.21.1 — Statistikk-fanen: brukerbidrag øverst, fjernet misvisende boks
To presiseringer etter tilbakemelding på 0.21.0 sin nye admin-fane:

- Oppsummeringsboksene øverst manglet totalt antall brukerregistrerte funn
  og hogstfelt — måtte scrolle ned til "Brukerbidrag"-listen og summere
  selv. Lagt til som egne bokser øverst (brukerregistrerte funn,
  brukerregistrerte hogstfelt).
- "Egendefinerte steder"-boksen viste `terreng_steder.custom`-telling, som
  er en ANNEN, alltid-null kolonne i det delte auto-hentede datasettet
  (ingen kodesti setter den til 1 — `fetch_area.py` sin `enrich_point()`
  hardkoder `custom: false`) — ikke det brukeren naturlig leser inn i
  "egendefinert sted", nemlig `customLocations` i egen `bruker_data` (satt
  når et registrert funn ikke traff noe kjent målepunkt). Forvirrende nok
  til at admin (7 egne steder i Brukerbidrag) så "0" øverst. Boksen viser
  nå riktig tall — summen av brukernes egne `customLocations` — i stedet.

## 0.21.0 — Ny "Statistikk"-fane i admin-panelet
Nå som all data (terreng, artsfunn, dekning, personlig brukerdata) faktisk
bor i D1, hadde admin ingen samlet innsikt i datamengden — måtte gjette seg
til hvilke fylker/kommuner som hadde målepunkter, og hadde ingen oversikt
over hvor mye brukerne selv bidrar med (registrerte funn, hogstfelt-
merking, egne steder).

- Nytt endepunkt `GET /admin/statistikk` (worker/api/src/routes/admin.js):
  totalt antall målepunkter (+ auto-ETL vs. egendefinert), antall per
  fylke/kommune, totalt antall Artsdatabanken-funn (+ antall arter),
  antall/siste områdehenting, og — per bruker — antall funn, hogstfelt-
  merkinger (både enkeltpunkt-`cuts` og tegnede `hogstOmrader`-soner) og
  egne steder. Telling av brukerbidrag skjer i JS etter henting siden
  `bruker_data` er én udelt JSON-blob per bruker, ikke normaliserte rader
  å `GROUP BY`.
- Ny "Statistikk"-fane i `#sp-admin-panel` (tredje fane, ved siden av
  Brukere/Invitasjoner) — oppsummeringsbokser øverst, målepunkter per
  fylke, en utvidbar liste over alle kommuner med målepunkter, og en
  brukerbidrags-liste med totalsum. Rent lesevisning, ingen handlinger.
- Bevisst tatt med permanent slettede brukere i brukerbidrags-tallene
  (kun sesjon/epost scrubbes ved sletting, `bruker_data`-raden består) —
  ellers ville totalsummene vært misvisende lave. Markert "slettet" i
  UI-en i stedet for å skjules.

## 0.20.4 — "Om dataene" nevner nå Artsdatabanken-laget
Gjennomgang av forklarende tekster i appen (bedt om av bruker) — de fleste
var fortsatt presise (bl.a. GitHub Actions-fremdriftsmeldingene i
admin-panelet: selve triggermekanismen er uendret av D1-migreringen, kun
lagringen på slutten). Ett klart hull funnet:

- "Om dataene" nevnte ikke Artsdatabanken/Artskart-laget i det hele tatt —
  de blå prikkene i kartet, "kjente funn"-bonusen i scoringen, og
  "Vis kun ferske Artsdatabanken-funn"-innstillingen er alle basert på
  ekte, verifiserte observasjoner fra en offentlig database, trolig
  appens sterkeste tillitssignal. Lagt til, samtidig lettere omskrevet
  første setning (mer presis: nevner nå konkret treslag/fuktighet/
  vei-parkering-stier i stedet for bare "terreng- og adkomstdata").

**Ikke endret, notert for senere vurdering**: tomme-tilstanden for vanlige
(ikke-admin) brukere i et helt udekket område antyder at løsningen er å
justere filteret, selv om årsaken kan være at området rett og slett aldri
er analysert ennå — en UX-avgjørelse, ikke en ren tekstjustering.

## 0.20.3 — Rettet: geolokasjon satte aldri radius-senteret
Bruker meldte at 0.20.2 sitt "zoom til radius-sirkelen" tilsynelatende ikke
virket. Riktig diagnostisert av brukeren selv: `radiusCenter` ble KUN satt
via et eksplisitt kartklikk — geolokasjon ved oppstart satte kartutsnittet,
men aldri selve radius-senteret. Uten et senter tegnes ingen sirkel i det
hele tatt (se `renderMap()`), så `zoomToRadiusSelection()` (fra 0.20.2)
hadde ingenting å vise selv ved bytte til Radius-fanen.

- `geolocateStartupView()` setter nå `radiusCenter` direkte, i tillegg til
  kartutsnittet — samme geolokasjon dekker begge deler.
- "Min posisjon"-knappen oppdaterer nå også `radiusCenter` (+ zoomer/
  re-rendrer) hvis du allerede står i Radius-modus når du trykker den —
  samme forventning, manuell variant.

## 0.20.2 — Radius-modus zoomer nå til sirkelen, mindre foreslåtte områder
To brukertilbakemeldinger samme dag.

- **Radius-modus zoomer/panorerer nå alltid til å vise hele sirkelen** —
  uansett `radiusKm`-verdi (2–60 km) og uansett kartets utgangspunkt (fast
  senterpunkt eller geolokalisert). Tidligere: å velge senter (klikk i
  kartet, klikk et punkt, eller "min posisjon") endret ALDRI kartutsnittet,
  så sirkelen kunne falle helt eller delvis utenfor synlig område. Ny
  `zoomToRadiusSelection()`, koblet inn ved senter-valg, glidebryter-endring
  (debounced 200ms) og fane-bytte tilbake til Radius.
  **Rettet underveis**: første forsøk brukte `L.circle(...).getBounds()`
  på en sirkel som ikke var lagt til kartet — kaster i praksis
  (`Cannot read properties of undefined`), fanget i preview før det nådde
  produksjon. Bruker nå ren lat/lng-matematikk i stedet, uten
  kart-avhengighet.
- **Foreslåtte områder er mindre**: maks-radius senket fra ~1400 m til
  600 m (klyngeradius `AREA_RADIUS_KM` 1,2→0,5 km) — opptil ~6 km² var for
  mye å realistisk dekke grundig til fots i én økt, ifølge bruker.

## 0.20.1 — Rettet: geolokasjon ved oppstart ble overstyrt av "zoom til alt"
Bruker meldte at kartet ikke faktisk zoomet inn på geolokasjonen ved
oppstart (0.19.9) — måtte trykke "min posisjon" på nytt for å få effekten.

- Rotårsak: `renderMap()` sin "zoom til alle markører, kun første
  gang"-logikk (`mapFittedOnce`) kjørte ved første `render()` i `init()`,
  RETT ETTER at `geolocateStartupView()` hadde satt kartutsnittet — siden
  `filterMode`/`fylkeFilter` fortsatt er default "alle" på det tidspunktet,
  overstyrte `fitBounds()` umiddelbart geolokasjon-zoomen med en visning av
  HELE datasettet.
- `geolocateStartupView()` setter nå `mapFittedOnce = true` når
  geolokasjon lykkes — geolokasjonen ER det bevisste utgangspunktet,
  `renderMap()` sin egen fit-til-alt skal ikke overstyre den.

## 0.20.0 — Finere fargekoding + hover-tooltip for score, høyere default-terskel
Oppfølger til vurderingen av om rød/gul/grønn-fargekodingen på
målepunktene var for grovkornet (se samtalen 2026-08-11).

- **Ny, delt `scoreColor(score)`-funksjon** — samme terskel-uttrykk lå
  tidligere kopiert (og risikerte å komme ut av synk) tre steder:
  `renderMap()`, `renderAreasOnMap()` og `gaugeSvg()`.
- **4 nivåer i stedet for 3**: høy (≥75, `#5F7A3E`), god (55–74, `#8FA35C`
  — ny), middels (35–54, `#C8974A`), lav/hogd (<35, `#A23E2E`). Bevisst
  IKKE en kontinuerlig gradient — markørene er små (8px) og finere
  fargeforskjeller er vanskeligere å skanne raskt og verre for fargeblinde
  ved den størrelsen. Kartlegenden oppdatert med det nye "god"-nivået.
- **Hover-tooltip på hovedmarkørene**: eksakt score vises nå ved hover
  (`bindTooltip`), ikke bare ved klikk (`bindPopup`, uendret) — løser
  "for grovkornet"-følelsen direkte uten å røre selve fargeskalaen.
- **"Vis kun score ≥"-slideren sin default hevet fra 0 til 70** (både
  `minScoreFilter` i `js/app.js` og slider-/label-verdien i `index.html`)
  — kartet viser fortsatt alle steder uansett (uendret), kun LISTEN under
  er nå forhåndsfiltrert til det som faktisk er verdt å vurdere først.

## 0.19.9 — Geolokasjon ved oppstart (lastetid, steg 3/3)
Siste av de tre lastetid-stegene (se 0.19.7/0.19.8 og
`fungifinder-db/D1-MIGRASJON.md`).

- `js/app.js` sin nye `geolocateStartupView()` sentrerer kartet på
  brukerens posisjon (zoom 11, ingen popup) FØR `loadArtsfunn()` sitt
  bbox-hent kjører, slik at den første artsfunn-hentingen faktisk er
  relevant i stedet for det faste senterpunktet `[60.5, 10.7]`. Kjøres
  parallelt med `initAuth()` (uavhengige), men avventes før
  data-innlastingen (som trenger et ferdig kartutsnitt).
- Helt stille ved avslag/feil/timeout (INGEN `alert`, i motsetning til den
  eksplisitte "min posisjon"-knappen) — default senterpunktet er et greit
  utgangspunkt uten geolokasjon. Egen 4s-timeout i tillegg til
  geolocation-API-ets eget (enkelte nettleser/OS — bl.a. iOS Safari — kan
  la tillatelsesdialogen stå åpen uten selv å kalle timeout-callbacken).
  Et SENT svar (brukeren godtar dialogen etter at appen ga opp å vente)
  flytter fortsatt kartet når det kommer — gjenbruker den eksisterende
  `moveend`-lytteren (ingen særbehandling nødvendig).
- `showMyLocationOnMap(lat, lon, {openPopup, zoom})` fikk to nye valgfrie
  parametre (default = uendret oppførsel for knappen) for å dekke dette
  uten kodeduplisering.

## 0.19.8 — Bbox-basert server-filtrering av artsfunn (lastetid, steg 2/3)
Oppfølger til 0.19.7 (parallellisering) og hovedfiksen på de ~1,46 MB
gzippet `/terrengdata/artsfunn` alltid lastet uansett hvor i landet
brukeren var — se `fungifinder-db/D1-MIGRASJON.md`. Geolokasjon ved
oppstart (steg 3/3) er en egen, senere sak.

- `worker/api/src/lib/terrengDb.js`: `hentArtsfunnFraDb()` tar nå et
  valgfritt bbox-filter (`minLat`/`maxLat`/`minLon`/`maxLon`, alle fire
  eller ingen). Verifisert direkte mot produksjons-D1: en test-boks rundt
  Østfold/Akershus ga 7559 av 31 378 rader.
- `worker/api/src/routes/terreng.js`: `GET /terrengdata/artsfunn` leser
  disse fra query-string.
- `js/api-client.js`: `hentArtsfunn({minLat,maxLat,minLon,maxLon})`.
- `js/app.js` sin `loadArtsfunn()` henter nå kun artsfunn innenfor kartets
  synlige utsnitt, **paddet 50 % utover** — `artsfunnLoadedBounds` sporer
  hva som faktisk er hentet, så et nytt kall skjer KUN når det synlige
  utsnittet beveger seg utenfor det som allerede er lastet, ikke ved hver
  eneste panorering. Koblet inn i den eksisterende `moveend`-lytteren
  (300ms debounce, uendret) FØR `renderArtskartLayer()`, som fortsatt
  filtrerer stramt til nøyaktig synlig utsnitt for selve visningen —
  uendret av dette, kun kilden er nå allerede redusert.
  `artsfunnRequestSeq` forkaster utdaterte svar ved rask panorering.
  `artsfunnLoadedBounds` nullstilles ved utlogging (tvinger et ekte nytt
  hent ved neste innlogging).

## 0.19.7 — Parallelliserte oppstartskallene (lastetid)
Første steg av tre i en oppfølger om lastetid (bbox-basert artsfunn-
filtrering og geolokasjon ved oppstart er egne, senere steg — se
`fungifinder-db/D1-MIGRASJON.md`).

- `init()` sitt `loadLocations()`/`loadFetchedAreas()`/`loadArtsfunn()`/
  `loadStorage()` var fire sekvensielle `await`-kall uten noen reell
  avhengighet mellom dem (hver skriver til sin egen, usammenhengende
  globale tilstand, og svelger allerede sine egne feil internt). Kjøres nå
  parallelt via `Promise.all` — kutter ventetiden fra summen av alle fire
  til den tregeste av dem.
- Målt bakgrunn: `/terrengdata/artsfunn` alene er ~1,46 MB gzippet (31 378
  rader, usiktrert — filtreres foreløpig kun client-side på synlig
  kartutsnitt), `/terrengdata` ~270 KB — begge lastes uansett hvor i landet
  brukeren er, uendret av denne endringen alene (kommer i steg 2).

## 0.19.6 — Server-side filtrering av terrengdata (fylke/kommune)
Oppfølger til D1-migrasjonen (se `fungifinder-db/D1-MIGRASJON.md`) — nå som
`/terrengdata` leser fra D1 (fase 3), kan serveren filtrere FØR data sendes
over nett, i stedet for at hele datasettet lastes én gang og filtreres
client-side som før.

- `GET /terrengdata` tar nå valgfrie `?fylke=`/`?kommune=`-parametre (se
  `worker/api/src/lib/terrengDb.js`). Ingen av dem satt = uendret oppførsel
  (hele datasettet).
- `js/app.js` sin `loadLocations()` sender nå det aktive
  fylke/kommune-filteret (samme `fylkeFilter`/`kommuneFilter` som
  dropdownene alltid har styrt) og **re-henter fra serveren ved hvert
  filterbytte** — fylke-dropdown, kommune-søkefelt, "nullstill kommune", og
  fane-bytte mellom fylke/kommune/radius. Tidligere ble alt lastet én gang
  og kun re-rendret client-side ved filterbytte.
- Rettet samtidig en liten skjevhet dette avdekket: et tomt filtrert svar
  (f.eks. en kommune uten analyserte steder ennå) beholdt tidligere stille
  forrige filters data i stedet for å vise "ingenting her" — `loadLocations()`
  behandler nå en tom liste som et gyldig svar, ikke som en feil.
- `locationsRequestSeq` forkaster utdaterte svar hvis brukeren rekker å
  bytte filter igjen før forrige kall er ferdig.
- Merkbar konsekvens: filterbytte har nå litt nettverkslatens (før: instant,
  siden alt allerede lå i minnet) — oppveies av mindre JSON over nett og
  raskere parsing, særlig etter hvert som datasettet vokser videre.
- `artsfunn`-laget (Artskart-observasjoner) er UTENFOR scope her — filtreres
  fortsatt kun client-side på synlig kartutsnitt (`leafletMap.getBounds()`),
  en annen akse enn fylke/kommune og en egen, større vurdering.

## 0.19.5 — Tre nye preferanser: kjente funnsteder, egen historikk, værvindu
Oppfølger til 0.19.4 — brukeren ba om å bygge inn alle tre gjenværende
kandidatene fra gjennomgangen av scoringsmodellen.

- **"Nedprioriter kjente offentlige funnsteder"** (default av). Speilvendt
  motstykke til den eksisterende Artskart-funn-bonusen (som fortsatt
  gjelder uansett, som korroborerende bevis) — samme designfilosofi som
  "Vektlegg avstand fra sti": et velkjent, offentlig registrert funnsted er
  ofte nettopp det, og dermed sannsynligvis mer nedplukket. Opptil -8.
- **"La egne funn styrke forslag"** (default på). Lar deg skru av den
  eksisterende bonusen (opptil +20) for egen funnhistorikk, for å få rene
  terrengbaserte forslag i stedet for å bli dratt tilbake til kjente
  steder — nyttig for bevisst å utforske nye områder.
- **"Vektlegg værvindu"** (default på). Lar deg skru av både
  14-dagersvinduet (+12/−10) og sesonghistorikken (±4) for planlegging
  langt frem i tid, uavhengig av værvarsel. Rå værdata vises fortsatt
  informativt i UI selv om vektingen er av.
- Verifisert i browser: alle fem preferanser (inkl. de to fra 0.19.4)
  har riktig default-tilstand, breakdown-modalen viser/skjuler riktige
  linjer når hver preferanse skrus av/på, total stemmer, ingen
  konsollfeil.

## 0.19.4 — Ny preferanse: "Vektlegg avstand fra sti"
Brukeren observerte at "stier" var en overraskende rikholdig datakilde
(30–52 % av alle veigeometripunkter hentet fra Overpass er sti-/skogsbilvei)
og spurte om nærhet til sti kunne bli en egen, valgfri nedprioritering i
scoringen — begrunnet i at populære stier ofte betyr mer tråkk/konkurranse
fra andre soppsankere, ikke bare lettere adkomst.

- Ny opt-in-preferanse **"Vektlegg avstand fra sti"** (default av), samme
  UI-mønster som "Vektlegg lav befolkningstetthet".
- `js/app.js`: ny `stiavstandScore()` — gradert på faktisk avstand
  (`loc.avstandStiM`, ikke bare ja/nei-terskelen), samme mønster som
  `parkeringsavstandScore()`. Egen, separat scorekategori fra
  `adkomstScore()`s eksisterende +3/-1 for stier — de to representerer
  forskjellige egenskaper (reachability vs. populæritet/tråkk) som deler
  samme underliggende OSM-data, og skal ikke kansellere hverandre.
- `avstandStiM` vises nå også i "Sti/skogsbilvei i terrenget"-linjen på
  stedskortet når kjent.
- Krever `fetch_area.py`-endring i `fungifinder-db` (persisterer nå
  `avstandStiM`, som tidligere ble beregnet men kastet bort før skriving —
  se den CHANGELOG-en) + en backfill av eksisterende steder.

## 0.19.3 — "Målepunkter"-laget starter av som default
Med hundrevis/tusenvis av scorede punkter samtidig (særlig etter at flere
kommuner nå er analysert, se `fungifinder-db` CHANGELOG) dominerte
Målepunkter-laget kartbildet fullstendig med det samme man åpnet appen.

- `js/app.js`: `markerLayer` legges ikke lenger til kartet automatisk i
  `initMap()` — kun `radiusLayer`/`routeLayer`/`hogstLayer`/`findsLayer`/
  `artskartLayer` starter på. Fortsatt registrert i lag-kontrollen (vises
  som avkrysset av), og skrus automatisk på igjen av `locateOnMap()` når man
  faktisk klikker "Vis i kart" på et sted.
- Verifisert i browser: lag-kontrollen viser "Målepunkter" som uavkrysset
  ved lasting, øvrige lag uendret.

## worker/api — 2026-08-11 (produksjonshotfix, ingen APP_VERSION-bump nødvendig)
Brukeren rapporterte at appen viste `v0.19.2` og var pålogget, men ingen
artsobservasjoner vist i det hele tatt — DevTools viste 503 på
`api.fungifinder.no/terrengdata`. `wrangler tail` mot produksjon viste
rotårsaken direkte: `GET /terrengdata` og `GET /terrengdata/artsfunn` traff
**"Exceeded CPU Limit"** på hvert eneste kall — et fullstendig, deterministisk
utfall (ikke sporadisk).

Rotårsak: `base64ToUtf8()` i `worker/api/src/lib/github.js` dekodet GitHub
Contents/Blob-API sitt base64-svar via `Uint8Array.from(bin, c =>
c.charCodeAt(0))` — én JS-funksjonskalls-overhead PER BYTE. `data/locations.json`
(4,4 MB) og særlig `data/artsfunn.json` (10 MB, ~13M base64-tegn i
fungifinder-db) er store nok til at dette alene sprengte Workerens
CPU-tidsgrense på hvert kall — sannsynligvis en gradvis skaleringsgrense nådd
etter hvert som begge datasettene har vokst over tid via ordinære
ETL-kjøringer (ikke en regresjon fra en spesifikk commit).

- `base64ToUtf8()` bruker nå den native `Uint8Array.fromBase64()` (verifisert
  tilgjengelig i denne Workers-runtimen) i stedet for en JS-løkke, med
  fallback til en optimalisert for-løkke (fortsatt raskere enn den gamle
  `Array.from`-callback-varianten) hvis metoden skulle mangle.
- Målt lokalt (ekte data fra fungifinder-db, workerd via `wrangler dev`):
  `locations.json` 846ms → 22ms (identisk resultat, verifisert byte-for-byte);
  `artsfunn.json` ~1900ms (estimert) → 64ms.
- `utf8ToBase64()` fikk samme type fiks (native `toBase64()` når
  tilgjengelig) for konsistens, selv om den for øyeblikket ikke kalles fra
  noen aktiv rute.
- Deployet direkte til produksjon (`wrangler deploy`) — se commit for
  verifisering mot live `api.fungifinder.no` etter deploy.

## 0.19.2 — Pre-commit-hook for versjons-sync + suggestAreas() ekskluderer høy-befolkning-punkter som anker
Ved forrige versjonsbump (se under) ble kun `APP_VERSION`/`js/app.js?v=`
bumpet — `css/styles.css?v=` og `js/api-client.js?v=` ble stående på gamle
verdier, til tross for at README.md eksplisitt dokumenterer at alle tre skal
bumpes sammen. Konsoll-varselet i `app.js` (se README "Versjonering og
caching") fanger kun avvik på sin EGEN `<script>`-tag, ikke de to andre —
så dette hadde gått upåaktet hen inntil en bruker rapporterte stale
CSS/API-klient i produksjon.

- Rettet `css/styles.css?v=`/`js/api-client.js?v=` til `0.19.2` i
  `index.html`.
- Ny `.githooks/pre-commit`: sjekker at `APP_VERSION` og alle tre `?v=` i
  `index.html` stemmer overens, blokkerer committen ved avvik. Aktiveres
  med `git config core.hooksPath .githooks` (se README).
Brukeren rapporterte at et foreslått søkeområde (skogpunkt 268, Lørenskog)
i stor grad dekket bebyggelse — under halvparten av den foreslåtte
sirkelen var faktisk skog. Se `fungifinder-db` CHANGELOG v22/v23 for
rotårsaken i selve befolkningsdataene (`classify_befolkning()` så tidligere
kun på nærmeste enkelt-tettsted, ikke det strengeste nærliggende).

- `js/app.js`: `suggestAreas()` filtrerer nå bort scoped-punkter med
  `loc.befolkning === 'hoy'` før `clusterIntoZones()` velger ankre — et
  slikt punkt kan ikke lenger bli sentrum/anker i et foreslått område,
  uansett score for øvrig for treslag/fuktighet/adkomst. Kan fortsatt
  inngå som medlem i en sirkel sentrert på et annet, roligere anker.
  Tydeligere feilmelding hvis alle kandidatene i valgt filter er
  hoy-befolkning.
- **Versjonsbump påkrevd, ikke bare kosmetisk**: både denne fiksen og
  0.19.1 (artsfunn-fiksen under) ble committet uten å bumpe
  `APP_VERSION`/`index.html`s `?v=`-cache-buster (se 0.16.2 om hvorfor det
  betyr at PWA-er/nettlesere kan fortsette å servere en gammel, cachet
  `app.js` på tross av at `main` var oppdatert). Rettet opp her —
  `APP_VERSION`/`?v=` er nå `0.19.2` og dekker begge fiksene.

## 0.19.1 — Rettet: Artsdatabanken-funn kunne forbli tomt etter kodeinnlogging
Brukeren rapporterte at "Artsdatabanken-funn"-laget av og til ikke viste
noen prikker, selv om det sto avkrysset/aktivt i lagkontrollen. Rotårsak:
`loadArtsfunn()` kalles kun én gang, i `init()`, og henter ingenting
(`artsfunn = []`) hvis `currentUser` ennå ikke var satt på det tidspunktet
— den normale tilstanden ved appstart før innlogging. Ved innlogging via
magic-link merkes ikke dette, siden lenken går via en serverside-redirect
og trigger en full sideomlasting (`init()` kjører på nytt med gyldig
sesjon). Men `wireKodeForm()` — kodeinnloggingen som finnes spesifikt for
iOS-PWA-brukere uten sideomlasting (se 0.18.0) — satte `currentUser` og
rendret på nytt uten å kalle `loadArtsfunn()` igjen, så laget sto tomt
resten av økten for enhver som logget inn med kode.

- `js/app.js`: `wireKodeForm()` kaller nå `loadArtsfunn()` etter vellykket
  kodeverifisering, samme mønster som `loadLocations()`/`loadStorage()`.
- `wireLogout()` nullstiller nå også `artsfunn` ved utlogging (tidligere
  ble gamle observasjoner stående tegnet på kartet uten gyldig sesjon).

## 0.19.0 — Flyttet til eget domene (fungifinder.no), SameSite=Lax
Brukeren rapporterte at målepunkter, Artsdatabanken-funn og egne data
forsvant i PWA-en på iPhone selv om "Konto"-fanen viste innlogget. Rotårsak:
frontend (GitHub Pages, `runelov.github.io`) og API (`*.workers.dev`) var
to ulike registrerbare domener — ekte cross-site — som tvang sesjonscookien
til `SameSite=None`, notorisk upålitelig i iOS/WebKit sin behandling av
frittstående PWA-er. Løsningen (kjøpt `fungifinder.no` hos Webhuset) er
samme arkitektur som Bondøya:

- **Nytt domene**: appen kjører nå på `https://fungifinder.no`
  (+ `www.fungifinder.no`) som Custom Domain på GitHub Pages, API-et på
  `https://api.fungifinder.no` som Cloudflare Worker Custom Domain — begge
  DNS-satt opp i Cloudflare (navnetjenere flyttet fra Webhuset). Den gamle
  `runelov.github.io/fungifinder`-URL-en og `*.workers.dev`-API-URL-en
  fungerer ikke lenger for innlogging/data (bevisst — se under).
- **`SameSite=Lax` i stedet for `SameSite=None`**: mulig nå som frontend og
  API deler registrerbart domene. Den tidligere `Origin`-header-CSRF-sjekken
  (`sjekkOpprinnelse()` i `worker/api/src/lib/cors.js`, kalt fra alle
  muterende ruter) er fjernet — `SameSite=Lax` gir samme beskyttelse gratis.
- **`ALLOWED_ORIGIN`/`APP_URL`** i `worker/api/wrangler.toml` oppdatert til
  `https://fungifinder.no` (hhv. med og uten sti).
- Turnstile-widgeten fra v0.18.0 fikk `fungifinder.no`/`www.fungifinder.no`
  lagt til som ekstra tillatte domener (samme widget/sitekey, ikke en ny).
- E-post-sending **uendret** — fortsatt via Bondøyas `mail.bondoya.no`
  (Resends gratis-tier tillater kun ett verifisert domene per konto, og det
  er allerede brukt av `bondoya.no`).
- Ingen viderekobling fra den gamle `runelov.github.io`-URL-en er satt opp
  — kun én reell bruker (kontoeieren selv), ingen andre har den lagret.

## 0.18.0 — Ekte Turnstile-nøkkel og kode-basert innlogging for PWA på hjemskjerm
Bruker rapporterte to ting: Turnstile-widgeten under Konto viste Cloudflares
"kun for testing"-varsel i produksjon, og innlogging "satt ikke" etter at
appen ble lagt til på hjemskjermen på iOS.

- **Ekte Turnstile site key**: `index.html` brukte fortsatt Cloudflares
  offentlige alltid-bestå testnøkkel (`1x00000000000000000000AA`) i
  produksjon — den var kun ment for `worker/api/.dev.vars` (lokal
  utvikling), men ble aldri byttet ut i den committede, faktisk deployede
  `index.html`. Registrerte et ekte Turnstile-widget for
  `runelov.github.io` i Cloudflare-dashbordet og satte tilhørende
  `TURNSTILE_SECRET_KEY` på workeren.
- **Kode-basert innlogging** (`POST /auth/verifiser-kode`, ny kolonne
  `kode_hash`/`kode_forsok` på `innloggingstokens`, migrasjon
  `0002_innloggingskode.sql`): en PWA lagt til på hjemskjermen
  (`display: standalone` i `manifest.webmanifest`) har på iOS verken
  adressefelt å lime inn magic-link-en i, eller noen "åpne i app"-håndtering
  av e-postlenken — og får dessuten sin egen isolerte cookie-lagring,
  atskilt fra Safari, der lenken uansett åpnes. Innloggingsmailen
  (`sendInnloggingsLenke`) inneholder nå i tillegg en 6-sifret kode brukeren
  kan taste rett inn under Konto i selve appen. Hele verifiseringen skjer
  som ett `fetch()`-kall fra appens egen JS (`js/api-client.js` sin
  `verifiserKode()`), så `Set-Cookie` havner i den lagringskonteksten koden
  faktisk kjører i — uansett om det er Safari eller hjemskjerm-PWA-en.
  Rate-limitert med IP-teller adskilt fra lenke-forespørselens (deler ikke
  bøtte — en feiltastet kode skal ikke låse brukeren ute fra å be om en ny
  lenke), og maks 5 feilforsøk per utstedt kode.

## 0.17.0 — Ekte innlogging, roller og admin-fane (erstatter delt GitHub-token)
Bruker ba om en admin-fane for å invitere flere brukere med reduserte
rettigheter, etter samme mønster/sikkerhetsmekanismer som Bondøya (magic-link
+ sesjoner, se `mittbondøya-workspace/bondoya/worker/api`). Frem til nå hadde
FungiFinder ingen egen backend — alt gikk gjennom ett delt, fine-grained
GitHub PAT limt inn i `localStorage` (`js/github-store.js`): den som hadde
tokenet hadde full lese-/skrivetilgang, inkludert å trigge nye
områdeanalyser. Umulig å gi noen redusert tilgang med det opplegget.

- **Ny backend**: `worker/api/` — en Cloudflare Worker (D1 + KV) kalt
  `fungifinder-api`. Magic-link-innlogging (ingen passord), sesjonscookie
  (`HttpOnly`/`Secure`, rulleres periodisk), to roller (`admin`/`bruker`),
  admin-styrte e-postbundne invitasjonslenker. Se `worker/api/README.md` for
  oppsett (krever egen Cloudflare-konto — gjøres av deg).
- **GitHub-PAT-en flyttet server-side**: `worker/api/src/lib/github.js`
  holder nå det eneste GitHub-tokenet (Worker-hemmelighet), og medierer all
  lesing av `data/locations.json`/`data/artsfunn.json` og all
  Actions-triggering (`fetch-area.yml`/`enrich-point.yml`) i
  `fungifinder-db`. Ingen bruker eier eller limer inn noe GitHub-token i
  nettleseren lenger.
- **Rollehåndhevet server-side**: kun `admin` kan trigge nye
  områdeanalyser (`POST /omrader/hent`, 403 ellers — ikke bare skjult i
  UI). `bruker` kan lese allerede analyserte terrengpunkter, foreslå
  områder, og registrere/redigere/slette egne funn (inkl. berikelse av
  et nytt, ukjent funn-sted — se under).
- **Personlige data (funn/hogst-merker/egne steder) flyttet fra ett delt
  `data/personal.json` til én rad per bruker i D1** (`bruker_data`), lest/
  skrevet via nye `GET`/`PUT /meg/data` — samme JSON-skjema som før, bare
  skilt per bruker i stedet for delt av alle. Engangsmigrering av
  eksisterende data dokumentert i `worker/api/README.md`.
- **`fungifinder-db` sin `enrich-point.yml`/`fetch_area.py`** (berikelse av
  ett egendefinert funn-sted) skriver nå til en ny, ikke-personlig
  `data/enrichments.json` (oppslag `{locationId: felter}`) i stedet for å
  mutere `data/personal.json` sin `customLocations`-liste direkte — gir ikke
  lenger mening når personlige steder er per bruker i D1.
  `fungifinder-api` leser resultatet tilbake via
  `GET /terrengdata/berikelse/:locationId` og appen slår det inn i riktig
  brukers egen `customLocations`-rad.
- **Ny "🛡️ Admin"-fane**: brukerliste (aktiver/deaktiver/slett permanent) +
  invitasjoner (opprett med bundet e-post, liste, trekk tilbake). Synlig kun
  for `rolle==='admin'` fra `/meg`.
- Fjernet: "Synk (GitHub-datarepo)"-panelet (eier/repo/token-skjema) i
  Config-fanen, erstattet med en enkel innloggingsboks under den nye
  "Konto"-fanen. `js/github-store.js` slettet, erstattet av
  `js/api-client.js`.
- Sesjonscookien er bevisst `SameSite=None` (ikke `Lax` slik Bondøya bruker)
  siden frontend (GitHub Pages) og API-et (`workers.dev`) er ulike
  registrerbare domener — kompensert med streng `Origin`-header-sjekk på
  alle muterende ruter. Se `worker/api/README.md` for begrunnelsen.

## 0.16.3 — Håndter Open-Meteo-throttling (429) bedre
Konsollfeil fra bruker: `GET api.open-meteo.com/v1/forecast … 429 (Too Many
Requests)` fra `loadWeather()`. Årsak: 14-dagers værhenting sendte lat/lon
for HVER lokasjon i datasettet (fort 1000+ med et større privat repo) —
Open-Meteos gratis kvote belastes per lokasjon i kallet, ikke per HTTP-
request, så dette kostet reelt sett like mye kvote som 1000+ separate kall,
på HVER sideinnlasting.
- `loadWeather()` runder nå ned til unike ~0.1°-rutenettceller (~11×5 km,
  grovt sammenfallende med værmodellens egen oppløsning) FØR den spør
  Open-Meteo, og cacher svar i `localStorage` (2 timer) på tvers av
  sideinnlastinger — de aller fleste sideinnlastinger gjør nå NULL kall mot
  Open-Meteo i stedet for opptil et titalls. Verifisert: andre innlasting i
  samme økt utløste ingen nettverkskall, samme værtall vist.
- Samme prinsipp for `loadSeasonWeather()` (0.15.0): cachet 6 timer per
  avrundet senterpunkt, med samme mønster som `loadKommuneRegister()`.
- Begge håndterer nå 429 eksplisitt: stopper flere bolker øyeblikkelig
  (i stedet for å fortsette og forverre throttlingen) og viser en tydelig
  "værtjenesten er midlertidig overbelastet"-melding fremfor en generisk
  feil. Verifisert med en midlertidig tvunget 429-respons i `loadWeather()`.

## 0.16.2 — Cache-busting for js/css, så oppdateringer faktisk når frem
Reelt problem: repoet har bevisst ingen build-steg, så `css/styles.css` og
`js/app.js`/`js/github-store.js` ble lastet med statiske, uversjonerte
URL-er — nettlesere (spesielt installerte PWA-er på iOS, jf. manifest med
`display: standalone`) kunne henge fast på gamle versjoner lenge etter en
ny push, uten at et vanlig sidereload hjalp.
- `index.html` laster nå disse tre filene med `?v=<versjon>`, som
  tvinger frem riktig fil ved hver versjonsbump (nettleseren ser det som en
  helt ny URL).
- `index.html` har fått `Cache-Control`/`Pragma: no-cache`-metatagger, slik
  at selve HTML-shellet alltid revalideres i stedet for å caches ukritisk.
- `js/app.js` sjekker nå selv, ved oppstart, at `?v=` i scriptets egen
  `<script>`-tag stemmer med `APP_VERSION` — og varsler i konsollen (ikke i
  UI) hvis noen glemte å oppdatere `index.html` ved siste versjonsbump.
  Verifisert manuelt at varselet faktisk trigges ved avvik.
- Se ny seksjon "Versjonering og caching" i `README.md` for rutinen (tre
  steder å oppdatere sammen ved hver release: `APP_VERSION`, `?v=` × 3,
  CHANGELOG).

## 0.16.1 — "Hent data"-meldingen tar hensyn til reell dekning
Fant ved en radius-henting rundt Trondheim: `findFetchedAreaMatch()` krever
et EKSAKT bokført treff (samme modus+verdi) i `fetchedAreas.json`, og vet
derfor ikke at en tidligere radius-henting kan dekke det meste av en
kommune/et fylke man senere velger via filteret. Dataene var riktige hele
veien (alle punktene hadde korrekt `kommune`/`fylke` fra ETL-en) — bristen
var kun i bokføringen, som ga et "Ingen terrengdata hentet ennå" som
direkte motsa den nye dekningslinjen (0.16.0) rett over, som riktig viste
antall kjente punkter. `updateFetchPanel()` i `js/app.js` bruker nå samme
punkt-telling som dekningslinjen: har man kjente punkter i området men
ikke noe eksakt bokført treff, sier meldingen nå "trolig dekket delvis av
en tidligere henting med annet filter" i stedet for å late som feltet er
helt uberørt.

## 0.16.0 — Dekningslinje: vet du om terrenget er analysert før du klikker
UX-problem: etter å ha analysert et område tidligere var det uklart om man
skulle klikke "Foreslå områder" eller "Hent data" først, og om det valgte
fylket/kommunen/radiuset allerede hadde data. To grep, se `render()`/
`suggestAreas()` i `js/app.js`:
- **Ny dekningslinje** over "Foreslå områder"-knappen (`updateCoverageLine()`)
  viser med det samme antall kjente punkter i gjeldende fylke/kommune/radius:
  "God dekning" (≥5 punkter), "tynt datagrunnlag" (1-4), eller et rødt varsel
  med lenke til hent-panelet ved 0 punkter — der er knappen også disablet,
  siden det ikke er noe å klynge forslag fra.
- **Post-forslag-nudge**: hvis "Foreslå områder" likevel ender opp tynt
  (samme terskel), vises en lenke i selve resultatet som scroller til
  "Hent data"-panelet — kun når det panelet faktisk er tilgjengelig (ikke
  skjult pga. et allerede registrert treff for nøyaktig dette området).
- Lagt til `:disabled`-styling for `.sp-btn` i `css/styles.css` (fantes ikke
  fra før noe sted, selv om `sp-fetch-start` også har hatt en disabled-state
  lenge).

## 0.15.0 — Strammere public/private-skille, enklere reconnect, sesongvær
- **Funn-registrering og hogstmerking er nå skjult** (både topp-knappene,
  per-kort-knappene og "klikk i kart for eget sted") når appen ikke er
  koblet til et privat data-repo — tidligere fungerte disse "lokalt" for
  en hvilken som helst besøkende på Pages-URL-en, uten at det faktisk gikk
  noe sted. Vises nå kun når `FungiStore.isConfigured()`.
- **Config-panelet er nå et ekte `<form>`** med `autocomplete="username"`/
  `"current-password"` på repo-/token-feltene, slik at nettleserens/en
  passordbehandler kan tilby å lagre og fylle inn PAT-tokenet automatisk —
  mer robust enn å stole på at `localStorage` overlever (Safaris ITP tømmer
  all script-skrivbar lagring etter 7 dager uten besøk, noe en sesongbasert
  app som denne lett rammes av).
- **Eier/repo/stier speiles nå i URL-en** ved tilkobling (ikke tokenet) —
  hvis lokal lagring blir tømt, men URL-en er bokmerket/lagret, forhånds-
  utfylles disse feltene igjen og bare tokenet må limes inn på nytt.
- **Ny "Vekstsesong (mai–i dag)"-oversikt** hentet fra Open-Meteos arkiv-API
  for ett representativt punkt: totalnedbør, snittemperatur, lengste
  tørkeperiode og en månedsvis oppsummering — utfyller det eksisterende
  14-dagersvinduet, som ikke fanger opp om resten av sesongen har vært våt
  eller tørr. Brukes også som en liten separat modifikator (±4) i
  `scoreLocation()`, se `sesonghistorikk`-linjen i score-breakdownen.

## 0.13.0 — Kritisk gjennomgang av vektingsmodellen
Etter en kritisk gjennomgang av scoringsmodellen (datagrunnlag, kilder,
manglende signaler, om vektingen er optimal) ble fem konkrete svakheter
rettet, i `scoreLocation()`/`adkomstScore()` (`js/app.js`) og i ETL-en
(data-repoets `fetch_area.py`, se dets CHANGELOG v11 for detaljer der):

- **Fjernet dobbelttellingen av `avstandVeiM`**: brukt til BÅDE
  `kjorbarVei`-basert adkomstscore og "avstand fra vei ≥1000m"-bonusen i
  ro-scoren — samme (og minst verifiserte) datakilde ga uttelling i to
  score-kategorier. Adkomst bruker nå en kontinuerlig
  `parkeringsavstandScore()` basert på ekte `avstandParkeringM` (se under);
  ro-scoren drives nå kun av `befolkning`.
- **Rebalanserte vektbudsjettet**: kategoriene summerte tidligere til 176
  mulige poeng før 100-taket ble klippet, som gjorde at de fleste "gode nok"
  steder mettet taket og virkelig gode steder ikke lenger skilte seg ut i
  rangeringen (relevant for bl.a. sonevalget i "Foreslå tur"). Vektene er nå
  strammet inn slik at "alltid tilgjengelige" kategorier (terreng, sesong,
  vær, ro, adkomst) typisk summerer til under 100 — taket nås normalt kun
  ved hjelp av faktisk korroborerende bevis (egen funnhistorikk, kjente
  Artskart-funn, sørvendt skråning).
- **`befolkning` og `stier` er nå koblet til reell data** (via OSM Overpass i
  ETL-en) i stedet for å alltid være `"ukjent"` — "prioriter ro"-toggelen
  var reelt sett inert for alle auto-hentede steder inntil nå.
- **Parkeringssjekken er nå reell for auto-hentede steder**: `parkeringNotat`
  bygges fra et ekte OSM-parkeringssøk (samme Overpass-mønster som
  "Foreslå tur" allerede brukte), inkl. `access`-tag (privat/kun kunder/
  krever tillatelse) — tidligere var dette alltid en placeholder-tekst som
  aldri kunne utløse privat-parkering-varselet.
- **Ny høyde-basert score** (`elevationScore()`) for de to artene
  (kransmusserong, furuknippesopp) der en høydebegrensning er godt nok
  dokumentert i norsk sopplitteratur til å tallfestes — `hoydeMoh` ble
  hentet fra Kartverket hele tiden, men var aldri brukt i scoringen.

## 0.12.0 — Bolk 3, del 3: ekte Artsdatabanken-integrasjon
- **Artskart-integrasjonen var i praksis dekorativ tidligere** — den viste kun en generell treffrate-statistikk, filtrert til arter som matchet beregnet treslag, og selve API-kallet brukte et bounding-box-filter mot Artsdatabanken som (etter grundig testing) aldri faktisk begrenset resultatene geografisk. Erstattet i data-repoet med ekte per-fylke-henting (`filter.countys`, det eneste geo-filteret som virker) og lokal avstandsmatching mot hvert punkt — se data-repoets CHANGELOG v10 for detaljer.
- **Nytt kartlag "Artsdatabanken-funn"**: viser faktiske, navngitte artsfunn i nærheten (fra ekte Artsdatabanken-data) som egne markører, uavhengig av hvilken art du har valgt — kun begrenset til de stedene som faktisk vises i kartutsnittet (maks 300 markører).
- **Kortene viser nå kjente funn i nærheten** (art, avstand, dato) for valgt art/favoritter, i stedet for kun et boolsk "sett her før"-flagg.
- **Scoringen er nå tetthetsbevisst**: flere/nyere funn av arten i nærheten gir høyere bonus enn tidligere flate +8, med grasfall bakover til gammel oppførsel hvis detaljerte funn mangler for et sted.

## 0.11.1 — Bolk 3, del 2: beskrivende tekst for turforslag
- **"Foreslå tur" forklarer nå HVORFOR**: en kort, generert tekst oppsummerer dominerende treslag/fuktighet/berggrunn på tvers av stoppene, nevner om flere stopp ligger i sørvendte skråninger (verdt å sjekke ekstra på varme dager), og gir konkrete mikrotips for arten (beste favoritt i favoritt-modus, ellers valgt art).
- Ruteforslaget følger nå faktisk favorittene dine når du står i "Mine favoritter"-modus (brukte tidligere alltid enkeltart-valget uansett modus).

## 0.11.0 — Bolk 3, del 1: GPS, favoritter, global funn-liste
- **Nytt: "📍 Min posisjon"** i kart-topplinjen — engangs GPS-oppslag (ikke løpende sporing) som panorerer/zoomer kartet til deg og viser en "du er her"-markør. Samme knapp i "Legg til eget sted"-modalen fyller inn koordinatene automatisk, så du slipper å plukke punktet manuelt i kartet når du registrerer noe der du faktisk står.
- **Nytt: favorittsopper.** ★ på hver art i artsvelgeren markerer/fjerner favoritt (lagres). Ny modus "Mine favoritter" ved siden av det vanlige ett-om-gangen-valget viser hvert sted med score for ALLE favorittene dine samtidig, sortert på beste treff — kort viser en mini-poengliste (f.eks. "Kantarell 88 · Steinsopp 66") i stedet for én måler. Både i enkeltart- og favoritt-kort vises nå også tips om andre gode matsopper (favoritter eller ikke) som trolig også passer på samme sted.
- **Nytt: global "Mine funn"-liste** i sidepanelet (som "Mine steder") — alle registrerte funn på tvers av steder, med rediger (art/mengde/dato/notat), "flytt til min posisjon" (retter en feilplassert markør via GPS) og fjern. Funn vises også som eget kartlag ("Mine funn" i lag-kontrollen), og kan redigeres direkte derfra via en "✏️ Rediger"-knapp i punktets popup — løser at man ofte vil rette opp et funn mens man er ute i felt og ser det i kartet, ikke bare fra lista.

## 0.10.0 — Bolk 2 av tilbakemeldingsrunden (layout/mobil) + oppfølging av "henting per art"
- **Fikset: "ingen terrengdata hentet" kunne dukke opp rett etter en vellykket henting**, uavhengig av art. Rotårsak (bekreftet via kode + brukerens presisering av kommune-modus/ingen sideoppdatering): GitHubs Contents API kan ha en kort forsinkelse (eventual consistency) før den reflekterer en commit som nettopp landet. Appen leste `fetched-areas.json` kun én gang rett etter jobben var ferdig — traff den forsinkelsen, viste den feilaktig "ikke hentet". Prøver nå på nytt opptil 4 ganger med kort mellomrom før den gir opp.
- **Redusert avstand mellom kart og punktbeskrivelser**: art-infoboksen (sesong, feltkjennetegn, forvekslingsfare) lå tidligere MELLOM kartet og resultatlisten — flyttet til venstre kolonne (rett under artsvelgeren), slik at kortene nå kommer rett under kartet.
- **Nytt: fullskjerm-knapp for kartet** (⛶, i kart-topplinjen) — fungerer likt på mobil og desktop, lukkes med knappen eller Escape. I fullskjerm skjules turforslag/hente-data-panelene slik at selve kartet får mest mulig plass.
- **Kartet er også litt høyere som standard på mobil** (460px, opp fra 360px).
- **Fikset ekte layout-bug oppdaget under mobiltesting av forrige versjons "kompakt artsvelger"**: CSS Grid-celler har implisitt `min-width: auto`, som lot den horisontalt scrollbare artslisten presse HELE SIDEN bredere enn skjermen på mobil (alt ble avkuttet i høyre kant) i stedet for å bli inneholdt av sin egen `overflow-x`. Lagt til `min-width: 0` på grid-cellene.

## 0.9.0 — Bolk 1 av den store tilbakemeldingsrunden (bugs + lav-risiko forbedringer)
- **Fikset: "Vis i kart" gjorde ingenting hvis "Målepunkter" var skrudd av.** Knappen kaller nå `leafletMap.addLayer(markerLayer)` selv om laget er skjult, i stedet for å stille feile på en usynlig markør.
- **Fikset: klikk på et flatehogd kartpunkt med "Skjul flatehogde steder" aktivt gjorde ingenting.** Det fantes ikke noe kort å scrolle til (filtrert bort), så klikket var en blindvei. Åpner nå punktets egen popup (navn/score/hogd-status) i stedet.
- **Fikset: GitHub Actions-jobber kunne feile på push** hvis appen lagret "Mine funn" (skriver `personal.json` direkte via Contents API) samtidig som en henting-jobb kjørte — begge må avansere samme branch, selv om de skriver ulike filer. Begge workflow-filene i data-repoet prøver nå på nytt med rebase (5 forsøk) i stedet for å feile hardt.
- **Fikset: soppvelgeren tok for mye vertikal plass på mobil** — var en høy éncolonne-liste (~660px for 12 arter). Horisontal scrollbar rad med kompakte pills på skjermer under 760px i stedet.
- **Nytt: kartet zoomer til valgt fylke/kommune** når du velger det i nedtrekksmenyen/søket, i stedet for å bli stående på forrige utsnitt.

## 0.8.0
- **"Vis i kart" i "Mine steder"**: egne steder lå allerede på kartet (stiplet ring), men det var ingen rask måte å hoppe dit — hver rad har nå samme 📍-knapp som resultatkortene, som panorerer/zoomer kartet dit og åpner popup.
- **Nytt: merk hele hogstfelt, ikke bare ett punkt.** Tidligere kunne du kun merke ett eksisterende målepunkt som flatehogd — traff ikke hogstfeltet noe rutenettpunkt, hadde du ingenting å klikke på. "🪓 Merk hogstfelt i kart" lar deg klikke et vilkårlig sted i kartet og tegne en sirkel (justerbar radius, med levende forhåndsvisning) rundt det faktiske hogstfeltet. Alt innenfor sirkelen — nåværende OG fremtidig hentede steder — regnes som flatehogd i vurderingen, uavhengig av om det finnes et målepunkt der. Egne hogstfelt vises som eget kartlag ("Mine hogstfelt"), fjernes via popup på sirkelen, og lagres i `personal.json` sammen med resten av dine data.

## 0.7.0
- **Nytt: turforslag (rundtur)**. I stedet for å måtte lese hundrevis av enkeltpunkter selv, kan du nå trykke "🥾 Foreslå tur" for å få et konkret forslag: appen klynger de høyest scorende punktene i valgt område til noen få soner (unngår at nabo-rutenettpunkter i samme flekk telles som separate stopp), finner et startpunkt (helst en ekte parkeringsplass fra OpenStreetMap, med fallback til nærmeste kjente veitilgang), og bygger en rundtur innom flest mulig gode soner innenfor en selvvalgt maks-lengde (1-15 km).
  - Ruten vises som et eget, valgfritt kartlag ("Foreslått rundtur" i lag-kontrollen) med nummererte stopp og en stiplet linje — punktene i seg selv kan skrus av (se v0.6.1) så kartet blir rent nok til å faktisk lese terrenget.
  - Ruten er en foreslått REKKEFØLGE med rette linjer mellom stoppene, ikke snappet til faktiske stier — bruk det topografiske kartlaget til å legge din egen linje mellom dem.
  - Forslaget nullstilles automatisk når art eller område endres, så det aldri viser en rute som ikke lenger stemmer med gjeldende filter.

## 0.6.1
- **Kartlag-velger**: standard OSM-gatekart viste ikke høydekoter, bekker eller stier — umulig å lese terrenget i, som er hele poenget med appen. Kartverkets topografiske kart er nå standardvalg, med Standard (OSM) og Satellitt (Esri) som alternativer via en lag-kontroll (ikonet øverst til høyre i kartet).
- **Av/på for målepunkter**: samme lag-kontroll har en avkrysning for å skjule/vise markørene, praktisk når du vil se rent terreng for å orientere deg eller merke egne funnsteder uten at prikkene er i veien. Tilstanden overlever filterbytter (art, fylke/kommune/radius osv.).

## 0.6.0
- **Fikset tomt/grått kart ved kraftig utzooming**: uten en satt kartgrense kunne man panorere/zoome forbi Web Mercator-projeksjonens øvre kant (naturlig med steder spredt helt opp mot 70°N) og se tomt grått felt i stedet for kart. Kartet er nå begrenset til Norge + god margin, med `minZoom` som ekstra sikring.
- Fliser som blir avbrutt av rask påfølgende panorering/zooming og aldri automatisk prøvd på nytt av Leaflet, prøves nå på nytt automatisk et par ganger i stedet for å bli stående tomme permanent.
- Nytt: **"📍 Vis i kart"**-knapp på hvert kort i listen — panorerer/zoomer kartet til akkurat det stedet og åpner popup-en, motsatt vei av å klikke et kartpunkt for å filtrere listen.
- Nytt: **score-terskel-glidebryter** over listen — skjuler anbefalinger under valgt score for å holde listen fokusert på de beste, uten å skjule noe fra kartet (som fortsatt viser alle steder i området, fargekodet etter score, klikkbare uansett score).
- Fikset misvisende statustekst: "Oppdaterer visningen …" fra en tidligere fullført henting kunne bli stående synlig under "Hent data"-knappen for et helt NYTT område, og ga inntrykk av at noe fortsatt pågikk lokalt.
- Fikset værdata som forsvant helt (stille feil) i områder med mange steder: Open-Meteo-kallet sendte alle steders koordinater i én kjempelang URL som kunne overskride lengdebegrensninger. Deles nå opp i bolker.

## 0.5.5
- Fikset race condition: rett etter at en henting trigges, kunne appen i noen tilfeller lese status fra en ELDRE, allerede fullført kjøring (fordi GitHub bruker noen sekunder på å registrere den nye jobben), og dermed feilaktig melde "Ferdig!" mens jobben egentlig fortsatt kjørte. Polling filtrerer nå kun på kjøringer opprettet etter trigge-tidspunktet.

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
