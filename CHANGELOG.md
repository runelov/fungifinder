# Endringslogg

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
