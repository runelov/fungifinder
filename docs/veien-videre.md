# Veien videre for FungiFinder

Samlested for planlagt/mulig fremtidig arbeid som ikke er en umiddelbar
oppgave — i motsetning til `CHANGELOG.md`, som dokumenterer det som faktisk
er gjort. Oppdater dette dokumentet når noe herfra blir tatt fatt på eller
forkastet, i stedet for å la det gå ut av synk.

## Artsprofil-gjennomgangen (2026-08-18) — åpne funn

Et forskningspass gikk gjennom kildegrunnlaget for alle artenes vekstvilkår
i `SPECIES` (`js/app.js`) mot Artfakta/SLU Artdatabanken og Artsdatabankens
rødliste. Fullt grunnlag, sitater og kildehenvisninger:
[artsprofiler-forskningsgrunnlag.md](artsprofiler-forskningsgrunnlag.md).
Ingen scoringsverdier er endret ennå bortsett fra fjerningen av tre arter
(se under).

**Hvorfor dette haster mer enn det ser ut som**: "Voksestedslag (fargelag)"
(shippet v0.27.0, admin-gatet i v0.27.2 med begrunnelsen *"til jeg er
fornøyd med kvaliteten"*) er et direkte, pikselvist bilde av
`scoreLocation()`s output. Feilene under er dermed ikke bare en fremtidig
konsekvens — de er allerede synlige i det live (admin-only) fargelaget
akkurat nå. Del 0 under bør regnes som en forutsetning for å løfte den
admin-gaten, ikke en løsrevet fremtidig oppgave.

### Del 0 — klare til å rettes nå (ingen ny kilde, ingen avveining)

Rene linjeendringer i `SPECIES`-arrayen basert på et allerede dokumentert,
sitert avvik mot Artfakta. Bør prioriteres foran punktene under, som enten
krever mer avklaring eller ny data:

- **Trompetsopp**: `gran` i `treslag` er trolig feil retning — kilden sier
  arten sjelden vokser i barskog, og heller foretrekker hassel/eik/asp
  (som uansett ikke kan skilles fra generisk lauvskog i terrengdata-laget,
  se strukturell begrensning under).
- **Traktkantarell**: `furu` mangler i `treslag` — kilden nevner furu på
  linje med gran.
- **Rødskrubb**: `'rik'` mangler i `berggrunn` — kilden sier arten ikke har
  noen berggrunnspreferanse i det hele tatt, inkludert kalkrik grunn.

### Venter på tredje kilde

- **Kantarell**: `furu` i `treslag` er ikke bekreftet av kilden (kun
  gran/asp/bjørk/bøk/lind/eik/hassel nevnt) — usikkert, bør kryss-sjekkes
  mot en tredje kilde før noe endres, ikke bare fjernes på ett funn.
  **Testet mot appens egne data 2026-08-18 (se ny seksjon under) — fortsatt
  uavklart.** furu-lift på kantarell-steder (n=670) var 1.07× bakgrunnsraten
  — for svakt til å bekrefte eller avkrefte. Trenger enten en faktisk
  tredje litteraturkilde, eller mer presis egen-data (se anbefalingen
  under) før dette kan avgjøres.

### Egen-datavalidering: `terreng_steder` × `kjenteFunnDetaljer` (testet 2026-08-18)

Ideen om å bruke appens egne 5464 `terreng_steder` (med treslag/fuktighet/
berggrunn) koblet mot ekte Artsdatabanken/Artskart-funn via
`kjenteFunnDetaljer` som en norsk, empirisk kilde ble faktisk kjørt mot
`fungifinder-db/data/locations.json`, ikke bare foreslått. Resultat: **metoden
funker i prinsippet, men er foreløpig for svak til å validere eller berike
noen av artene utover retningsgivende hint** — tre konkrete grunner, ikke
bare "generelt usikkert":

1. **Rå samlokaliserings-frekvens er villedende og MÅ korrigeres mot
   bakgrunnsraten (lift), ikke leses direkte.** Første forsøk (rå
   frekvens blant steder med bekreftet funn) ga nesten identiske tall for
   kantarell/traktkantarell/trompetsopp/rødskrubb (gran ~60%, furu ~37%,
   `'rik'` berggrunn ~0%) — men det viste seg å være **praktisk talt
   identisk med bakgrunnsfordelingen blant ALLE 5464 steder** (gran 62%,
   furu 35%, `'rik'` 0,3%). Det som ble målt var sammensetningen av norsk
   skog i datasettet, ikke artspreferanse. Riktig mål er
   berikelsesforhold: `P(furu | artsfunn nærme) / P(furu | alle steder)`.
   Med lift-korreksjonen ga kransmusserong (den mest furu-spesifikke arten
   i settet, "sterkt bekreftet" i forskningsgrunnlaget) høyest furu-lift
   av alle testede arter (1.67×, n=24) — retningen stemmer med kjent
   økologi, men selv der er signalet svakt på så lite datagrunnlag.
2. **`'rik'`-berggrunn finnes nesten ikke i `terreng_steder` nasjonalt**
   (17 av 5464 steder, 0,3%) — strukturelt umulig å si noe pålitelig om
   rødskrubb/`'rik'`-spørsmålet (eller noe annet `'rik'`-relatert) uansett
   hvor mange Artskart-funn som samles inn, fordi det knapt finnes punkter
   med den berggrunnsverdien å teste mot. NGU/berggrunn-klassifiseringen
   i `fetch_area.py`, ikke artsdata, er flaskehalsen her.
3. **`kjenteFunnDetaljer` lagrer ikke funnets egne koordinater** — kun
   `art`/`dato`/`avstandM` fra terreng_stedet. Vi låner dermed
   terreng_stedets attributter som proxy for funnstedets faktiske
   habitat, med inntil 500 m unøyaktighet (scoringens egen terskel), og et
   sted kan ha flere treslag i lista (blandingsskog) — begge deler visker
   ut signalet ytterligere.

**Anbefaling — ikke bruk til å endre scoringsverdier ennå.** Risikoen er å
bake inn støy som ser ut som signal, spesielt for artene med lavt n
(matriske n=45, kransmusserong n=24, piggsopp n=96). Den ene konkrete
forbedringen som ville gjort dette reelt kraftig: **lagre Artskart-funnets
egne lat/lon** (finnes allerede i Artskart-API-responsen, blir kastet i
dag — kun `avstandM` beholdes) og slå opp terrengdata direkte på
funnpunktet i stedet for å låne nærmeste terreng_steds attributter —
fjerner unøyaktigheten i punkt 3 over, og gjør spesielt
kantarell/furu-spørsmålet mer avgjørbart etter hvert som flere funn
samles. Punkt 2 (sparsom `'rik'`-dekning) løses ikke av dette alene og bør
undersøkes separat. Samme lift-metodikk kan gjenbrukes på de planlagte
kalibreringsløpene for Indre Østfold/Vågå/Hitra (se
Voksestedslaget-artifaktet), som uansett produserer ferske
Artskart×terreng-koblinger for tre representative kommuner.

**Strukturell begrensning som gjelder alle punktene over**: NIBIO SR16
(kilden til `loc.treslag`) skiller ikke lauvtreslag i det hele tatt —
hassel/eik/asp/bøk kan aldri gjenkjennes presist av dagens ETL, bare "et
lauvtre" generisk (mappet til `bjork`). Et forbedret artsprofil-grunnlag
gjør vektingen riktigere, men løser ikke selve presisjonen for
kalkkrevende lauvtre-arter — det krever en egen forbedring av
terrengdata-laget (se eget punkt under).

## Fremtidige mulige utvidelser

- ~~**Rydd `fetch_area.py`s `SPECIES_TAXON_ID`**~~ — **rettet 2026-08-18,
  samme dag.** Dagens artsfjerning ble først kun verifisert innenfor
  `fungifinder`-repoet (frontend); `fungifinder-db/scripts/fetch_area.py`
  hadde fortsatt parasollsopp/sjampinjong/furuknippesopp i
  `SPECIES_TAXON_ID`, og Artskart-synken itererer ubetinget over alle
  nøklene der uten å filtrere mot hva appen faktisk viser — hver
  fylkes-synk gjorde dermed 3 unødvendige Artskart API-kall (multi-taxon
  er splittet til ett kall per art nettopp pga. timeout) for arter ingen
  ser i appen lenger. De tre linjene er fjernet fra dict'en (taxon-IDene
  beholdt i en kommentar for enkel gjeninnføring senere).
- **Gjør høyde-/helningsscoring kontinuerlig i stedet for trinnvis (billig
  Voksestedslag-finkorning)** — bruker sammenlignet Voksestedslaget
  (fargelaget) mot bärher.no 2026-08-18 og observerte at bärher gir langt
  mer presise fargevariasjoner, bl.a. langs høydekurver. Kildesjekk: den
  store gevinsten der er trolig tetthet (bärher: kontinuerlig 16 m
  raster nasjonalt vs. fungifinders spredte 0,5 km-punkter) — allerede
  riktig identifisert som Del 3 i Voksestedslaget-planen (bulk
  SR16R/DTM/berggrunn/markfuktighet), fortsatt riktig prioritert som den
  store, senere investeringen. MEN: `helningGrader`/`himmelretning`
  regnes allerede ut per punkt fra 4 nabopunkter **70 m unna**
  (`compute_slope_aspect()` i `fetch_area.py`) — reell, lokal terrengform,
  ikke interpolert fra det grove rutenettet, i motsetning til
  treslag/berggrunn (polygonlag, ofte ensartet over hundrevis av meter).
  Denne dataen brukes i dag kun som en FLAT, binær bonus (+4/0, kun for
  `WARMTH_LOVING_SPECIES` — 3 av 9 arter) i `scoreLocation()`, og
  `hoydeMoh` scores kun for 1 av 9 arter (kransmusserong) med en 2-trinns
  terskel i stedet for en glidende kurve. Å gjøre disse tersklene
  kontinuerlige (for de artene som allerede har en kildebelagt
  høyde-/varmepreferanse — IKKE utvide til flere arter uten kilde, samme
  prinsipp som artsprofil-gjennomgangen selv fulgte) krever ingen ny data
  og ingen nye nettverkskall — en liten kvalitetsheving av hvert
  eksisterende punkts fargepresisjon mens Del 3 (tetthet) venter. Erstatter
  ikke tetthetsinvesteringen, men er en gratis mellomting.
- **OSM `natural`/`landuse`-tags som billig `apen`-proxy** — planen under
  peker på AR5 som eneste vei til ekte "åpen mark"-deteksjon, men
  `fetch_area_features_in_bbox()` gjør allerede ett batched Overpass-kall
  per område (veier/parkering/stier/befolkning). OSM har
  `natural=grassland|heath`/`landuse=meadow` i akkurat samme respons —
  marginalkostnad ≈ 0, ingen ny ekstern kilde. Verdt å teste empirisk
  (dekningsgrad i OSM for Norge) som en billigere mellomstasjon før en
  eventuell full AR5-satsing.
- **Gjeninnfør parasollsopp og sjampinjong** — fjernet 2026-08-18 fordi
  begge er saprotrofe grasmarksarter (lever av dødt organisk materiale),
  ikke mykorrhiza-dannende. Dagens `treslag`/`skogalder`-scoringsmodell
  (bygget for mykorrhiza-arter) gir ikke mening for dem. Krever en egen
  scoringsakse først — trolig "åpen mark ja/nei" + sandholdig/gressdekt
  grunn i stedet for treslag, se punktet under om `'apen'`-terrengdata.
- **Gjeninnfør furuknippesopp** — fjernet samtidig fordi kildene er uenige
  om trofisk modus (Artfakta/Sverige sier saprotrof, Norges egen
  rødlistevurdering sier "antas mykorrhiza"). Bør avklares bedre (evt. en
  tredje kilde, eller kontakt med NSNF/en norsk mykolog) før den
  gjeninnføres. Norges rødlistevurdering nevner også `gran` som mulig
  ekstra vertstre ved siden av furu — ta med i vurderingen om/når den
  kommer tilbake.
- **Ekte "åpen mark"-deteksjon i terrengdata-laget** — NIBIO SR16 (et
  skogressurskart) kan aldri produsere en `'apen'`-verdi for `treslag`/
  `skogalder`, uansett hvor åpent et sted faktisk er (se
  `fetch_area.py`/`TRESLAG_MAP`). Ville trengt et arealtypelag som AR5,
  eller lignende. Forutsetning for at parasollsopp/sjampinjong kan
  gjeninnføres med en scoringsmodell som faktisk virker.
- **Lauvtreslag-oppløsning i terrengdata-laget** — SR16 skiller ikke
  hassel/eik/asp/bøk fra generisk "lauvdominert" (alt mappes til `bjork`).
  Ville forbedret presisjonen spesifikt for kalkkrevende lauvtre-arter som
  trompetsopp, uavhengig av hvor gode artsprofilene er.
- **Værterskler (`minNedbor14`/`idealNedbor14`/`minTempAvg`) er ukildet og
  ukalibrert** — internt konsistente, men ingen kilde og ingen kalibrering
  mot brukerens egne loggede funn-datoer + værhistorikk, selv om appen har
  begge datasettene. Vurder kalibrering, eller nedvekting/tydeligere
  merking som grov heuristikk.
