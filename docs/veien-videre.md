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
Fjerningen av tre arter og "Del 0"-rettelsene under er nå implementert (se
CHANGELOG v0.28.7/v0.28.8) — kantarell er eneste gjenstående åpne punkt.

**Hvorfor Del 0 hastet**: "Voksestedslag (fargelag)" (shippet v0.27.0,
admin-gatet i v0.27.2 med begrunnelsen *"til jeg er fornøyd med
kvaliteten"*) er et direkte, pikselvist bilde av `scoreLocation()`s output
— Del 0-feilene var dermed allerede synlige i det live (admin-only)
fargelaget, ikke bare en fremtidig konsekvens. Nå rettet; kantarell-
usikkerheten (se under) er fortsatt en gjenstående faktor å vurdere før
gaten løftes.

### ~~Del 0 — klare til å rettes nå~~ (rettet 2026-08-18, v0.28.8)

Rene linjeendringer i `SPECIES`-arrayen basert på et allerede dokumentert,
sitert avvik mot Artfakta — implementert, se CHANGELOG v0.28.8:

- ~~**Trompetsopp**: `gran` i `treslag` er trolig feil retning~~ — fjernet.
  Kilden sier arten sjelden vokser i barskog, og heller foretrekker
  hassel/eik/asp (som uansett ikke kan skilles fra generisk lauvskog i
  terrengdata-laget, se strukturell begrensning under).
- ~~**Traktkantarell**: `furu` mangler i `treslag`~~ — lagt til. Kilden
  nevner furu på linje med gran.
- ~~**Rødskrubb**: `'rik'` mangler i `berggrunn`~~ — lagt til. Kilden sier
  arten ikke har noen berggrunnspreferanse i det hele tatt, inkludert
  kalkrik grunn.

### ~~Venter på tredje kilde~~ — Kantarell avklart (2026-08-18, samme dag)

- ~~**Kantarell**: `furu` i `treslag` er ikke bekreftet av kilden~~ —
  **bekreftet, ingen dataendring nødvendig.** Egen-datavalideringen under
  (lift=1.07× på n=670) var for svak til å avgjøre saken alene, så et nytt
  litteratursøk ble gjort samme dag: to uavhengige, fagfellevurderte
  kilder (Pachlewski, *Acta Mycologica* 1996, "...a mycorrhizal fungus of
  pine and spruce"; Danell, *Mycorrhiza* 1994, dokumenterer vellykket in
  vitro-mykorrhiza mellom *C. cibarius* og *Pinus sylvestris*) bekrefter
  furu-tilknytningen. Se `docs/artsprofiler-forskningsgrunnlag.md` for
  full sitering.

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
fjerner unøyaktigheten i punkt 3 over, og gjør fremtidig
artsprofil-validering mer avgjørbart etter hvert som flere funn samles
(kantarell/furu-spørsmålet ble løst via litteratur i stedet, se over —
men prinsippet gjelder for eventuelle fremtidige åpne spørsmål). Punkt 2
(sparsom `'rik'`-dekning) løses ikke av dette alene og bør undersøkes
separat. Samme lift-metodikk kan gjenbrukes på de planlagte
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
- ~~**Gjør høyde-/helningsscoring kontinuerlig i stedet for trinnvis**~~ —
  **gjort 2026-08-18 (v0.28.9), se CHANGELOG.** Bruker sammenlignet
  Voksestedslaget (fargelaget) mot bärher.no og observerte at bärher gir
  langt mer presise fargevariasjoner, bl.a. langs høydekurver. Kildesjekk
  den gang: den store gevinsten der er trolig tetthet (bärher: kontinuerlig
  16 m raster nasjonalt vs. fungifinders spredte 0,5 km-punkter) — fortsatt
  riktig identifisert som Del 3 i Voksestedslaget-planen (bulk
  SR16R/DTM/berggrunn/markfuktighet), fortsatt riktig prioritert som den
  store, senere investeringen; dette punktet var kun en billig mellomting,
  ikke en erstatning. `elevationScore()` er nå en lineær interpolasjon
  mellom de samme kildebelagte grensepunktene (ideal/max) i stedet for et
  hardt sprang, og sørvendt-skråning-bonusen (`sorvendtVekt()`, delt mellom
  scoreLocation() og "Hvorfor her?"-kortet) gir nå S full vekt og SØ/SV
  0,7×, med en myk 3°-skulder på hver side av det samme 3-25°-vinduet som
  før — ingen ny data, ingen nye tallfestede grenser, ikke utvidet til
  flere arter enn de som allerede hadde en kildebelagt preferanse
  (`WARMTH_LOVING_SPECIES`/`species.hoydeMoh`).
- **OSM `natural`/`landuse`-tags som `apen`-proxy — testet 2026-08-18,
  svakere enn håpet.** Kjørte ekte Overpass-spørringer (way+relation, ikke
  bare way — enkle way-spørringer viste seg å UNDERVURDERE dekning kraftig
  siden mange arealer er tagget som multipolygon-relasjoner) mot fire
  områder:
  1. Nordmarka (skog nær Oslo, generisk testområde): rik tagging —
     `grass`=299, `meadow`=115, `farmland`=123, `village_green`=23,
     `heath`=14 innenfor ~124 km².
  2. Jæren (jordbruksland, mindre bbox pga. timeout på større): moderat —
     `farmyard`=67, `grass`=25, `farmland`=17.
  3. Finse/Hardangervidda (fjellhei): 0 relevante tags — dominert av
     `water`(2596)/`glacier`/`wetland`/`bare_rock`. Trolig bboxen som
     traff mest vann/isbre/nakent fjell fremfor selve heivegetasjonen, ikke
     nødvendigvis bevis på generell manko — men uansett ingen brukbar
     "åpen mark"-signal her.
  4. **Den egentlig relevante testen — 3 ekte terreng_steder med bekreftet
     parasollsopp-funn <500 m unna** (fra
     `fungifinder-db/data/locations.json`), 300 m radius-søk rundt hvert:
     kun **1 av 3** hadde `grass`/`meadow`/`farmland`-tagging i det hele
     tatt (Nesodden-punktet); de to andre (Oslo 92 m til funn,
     Indre Østfold 156 m til funn) hadde KUN skog-/kratt-/vanntagging —
     proxyen ville ha bommet på disse to reelle funnstedene.

  **Konklusjon**: signalet finnes, men er tynt nettopp der det trengs mest.
  OSM-tagging ser ut til å følge samme mønster som Artskart-funnene i
  egen-datavalideringen over — tett der frivillige kartleggere bor/ferdes
  (byer, store jordbruksarealer), tynt for de små, spredte lysninger/
  hageflekker/skogbryn parasollsopp/sjampinjong faktisk vokser i. Kombinert
  med at implementasjonen uansett ville krevd ekte punkt-i-polygon-sjekk
  (ikke bare nærmeste-punkt-avstand slik vei/sti/parkering gjøres i dag) er
  dette IKKE lenger vurdert som en lavthengende frukt — nedprioritert
  under full AR5-satsing (se punktet under) fremfor som en mellomstasjon,
  med mindre et mye større utvalg reelle funnsteder (i dag kun n=3, for
  lite til å konkludere hardt) senere viser et annet bilde.
- ~~**Gjeninnfør parasollsopp og sjampinjong**~~ — **gjort 2026-08-18
  (v0.28.14 + fungifinder-db), se CHANGELOG.** Fjernet fordi begge er
  saprotrofe grasmarksarter (lever av dødt organisk materiale), ikke
  mykorrhiza-dannende — dagens `treslag`/`skogalder`-scoringsmodell
  (bygget for mykorrhiza-arter) ga ikke mening for dem uten `'apen'`-data.

  **Viktig funn under scopingen: trenger IKKE en ny scoringsakse.**
  `attrScore()` (`js/app.js`) matcher allerede `loc.treslag`/
  `loc.skogalder` mot `species.treslag`/`species.skogalder` som ren
  mengdemedlemskap — og `'apen'` er allerede en gyldig, tekstet verdi i
  `TXT.treslag`/`TXT.alder` (`apen:'åpen mark'`/`apen:'åpen'`), bare aldri
  faktisk produsert av SR16. Gir parasollsopp/sjampinjong
  `treslag:['apen']`, `skogalder:['apen']` ved gjeninnføring, så virker
  eksisterende scoringsmodell uendret — ingen ny funksjon, ingen nytt
  vektbudsjett. Fuktighet/berggrunn scores som normalt (samme WMS-kall som
  for skogpunkter, uavhengig av om SR16 har noe å si).

  **Tre reelle strukturelle endringer:**
  1. ~~**`fetch_area.py`s kandidat-portvakt**~~ — **gjort 2026-08-18
     (fungifinder-db v42), se CHANGELOG.** Forkastet tidligere ETHVERT
     punkt der høgde-API-ets `terreng`-felt ikke var `"skog"`/
     `"skogbevokst myr"` — FØR SR16/markfuktighet/berggrunn i det hele
     tatt ble kalt. Ny `OPEN_TERRAIN_VALUES = {"åpentområde"}` (verifisert
     live mot Jæren) slipper nå disse kandidatene videre til en uavhengig
     AR5-sjekk.
  2. ~~**Ny AR5-henting**~~ — **gjort 2026-08-18 (fungifinder-db v42), se
     CHANGELOG.** `fetch_ar5_arealtype()` (samme `GetMap`+pikselfarge-
     mønster som `fetch_markfuktighet()`) kalles kun for de nye
     kandidatene fra (1) — ingen ekstra kostnad for skogpunkter. Setter
     `treslag:['apen']`/`skogalder:'apen'` når AR5 bekrefter "Åpen
     fastmark" eller "Innmarksbeite"; forkaster kandidaten hvis AR5 er
     uenig med høgde-API-et (bebygd/vann/dyrket mark/udekodbar piksel).
     Verifisert direkte mot `enrich_point()` (ikke bare `--test-point`,
     som kun dumper rå API-svar): Jæren ga `treslag:['apen']` med
     fuktighet/berggrunn populert normalt, Nordmarka beholdt uendret
     skog-sti (AR5 aldri kalt), Oslo sentrum fortsatt korrekt forkastet.
  3. ~~**Eksisterende terreng_steder får INGEN åpne naboer av
     `--refresh-existing` alene**~~ — **testet og bekreftet 2026-08-18.**
     Kjørte et `--dry-run`-sveip (ny, ikke `--refresh-existing`) for
     Vestby kommune først (605 kandidater sjekket, 15 godkjent — 14 med
     `treslag:['apen']`, realistiske verdier: tørr/frisk fuktighet, fattig
     berggrunn, lav høyde over havet konsistent med kystnær/jordbruksmark).
     Deretter kjørt på nytt UTEN `--dry-run` — 14 nye åpne punkter + 1
     skogpunkt reelt skrevet til produksjons-D1 for Vestby.
     **Gjenstår**: kun Vestby har åpne punkter så langt — resten av landet
     har fortsatt ingen, siden alle andre områder ble hentet under den
     gamle skog-only-portvakten. Nasjonal utrulling (samme kostnadsbilde
     som Voksestedslaget-artifaktets Del 4) er en bevisst, separat,
     senere beslutning — ikke gjort automatisk av dette.
- ~~**Gjeninnfør furuknippesopp**~~ — **gjort 2026-08-18 (v0.28.12), se
  CHANGELOG.** Trofisk modus avklart samme dag av en tredje, uavhengig,
  fagfellevurdert kilde (genomstudie, Ohta et al. i *DNA Research*):
  arten ER ektomykorrhiza-dannende, ikke saprotrof — bekrefter det Norges
  rødlistevurdering antok, forklarer trolig hvorfor Artfakta klassifiserte
  den feil (beholder saprotrof-lignende metabolske trekk uten å faktisk
  være saprotrof). Lagt tilbake i `SPECIES` (+ `SPECIES_HUE`/
  `WARMTH_LOVING_SPECIES`/`BASE_MICROTIPS`) og `fetch_area.py`s
  `SPECIES_TAXON_ID`, med `gran` lagt til som sekundær treslag-verdi ved
  siden av `furu` (kilde: rødlistevurderingens "mulig ekstra vertstre").
  `season`/`weather` UENDRET — kun 4 unike bekreftede Artskart-funn totalt,
  for lite til kalibrering.
- **Ekte "åpen mark"-deteksjon i terrengdata-laget — gjennomførbarhet
  bekreftet 2026-08-18, klar for scoping.** NIBIO SR16 (et skogressurskart)
  kan aldri produsere en `'apen'`-verdi for `treslag`/`skogalder`, uansett
  hvor åpent et sted faktisk er (se `fetch_area.py`/`TRESLAG_MAP`).
  Testet AR5 (`wms.nibio.no/cgi-bin/ar5`, samme NIBIO-tjenestefamilie som
  SR16/markfuktighet) live mot tre kjente kontrollpunkter (Oslo/Nesodden
  nær ekte parasollsopp-funn, Nordmarka som skog-kontroll, Jæren som
  jordbruks-kontroll):
  - `GetFeatureInfo` (samme metode som fungerer for SR16) ga **tomt svar
    for alle AR5-underlag** (`Arealtype`, `AR5`, `Hovedgrupper`,
    `Jordbruksareal`) — samme rasterlag-begrensning som markfuktighet
    allerede har (se `fetch_markfuktighet()`), IKKE en indikasjon på
    manglende dekning.
  - **Samme løsning som markfuktighet allerede bruker fungerer også
    her**: et lite `GetMap`-utsnitt + lese av pikselfargen
    (`decode_png_pixel()`), matchet mot `GetLegendGraphic`. Verifisert
    treffsikkert: Nordmarka og punktet nær det ekte Oslo-parasollsoppfunnet
    ga begge fargen for **Skog** (158,204,115); Jæren ga fargene for
    **Innmarksbeite** (255,255,173) og **Fulldyrka jord** (255,209,110) —
    presist samsvar med kjent terreng. AR5 har en egen, distinkt klasse
    **"Åpen fastmark"** (217,217,217) — nøyaktig kategorien
    parasollsopp/sjampinjong trenger.
  - Ingen ny infrastruktur nødvendig utover å gjenbruke det eksisterende
    `decode_png_pixel()`-mønsteret på et nytt lag — samme teknikk, ikke
    et nytt problem å løse. Full scoping (viser seg IKKE å trenge en ny
    scoringsakse) i punktet under, "Gjeninnfør parasollsopp og
    sjampinjong".
  - Merk: at det ekte parasollsopp-funnstedet i Oslo klassifiseres som
    "Skog" (ikke "Åpen fastmark") av AR5 er ikke en motsigelse — samme
    presisjonsbegrensning som OSM-testen traff på (terreng_stedet er et
    punkt ~0,5 km-rutenett, ikke nøyaktig der soppen sto; arten vokser i
    skogbryn/lysninger som kan ligge noen titalls meter unna selve punktet).
- **Lauvtreslag-oppløsning i terrengdata-laget** — SR16 skiller ikke
  hassel/eik/asp/bøk fra generisk "lauvdominert" (alt mappes til `bjork`).
  Ville forbedret presisjonen spesifikt for kalkkrevende lauvtre-arter som
  trompetsopp, uavhengig av hvor gode artsprofilene er.
- **Værterskler (`minNedbor14`/`idealNedbor14`/`minTempAvg`) er ukildet —
  delvis kalibreringstestet 2026-08-18, oppløftende men ikke avgjørende.**
  Kjørte kantarells terskler (min=15/ideal=35 mm, minTempAvg=8) mot ekte
  historisk vær (Open-Meteo sitt archive-API, samme 14-dagers/5-dagers-
  vindudefinisjon som `loadWeather()` i `js/app.js` bruker) for et
  tilfeldig utvalg på 25 av de 925 bekreftede kantarell-funnene <500 m fra
  et terreng_sted, med reell `dato` fra Artskart:
  - 68 % av funnene skjedde når `precip14` allerede var over
    `idealNedbor14` (35 mm) — modellen ville gitt "Godt fuktnivå".
  - 28 % lå i "litt tørt, men innen rekkevidde"-sonen (15-35 mm).
  - Bare **1 av 25 (4 %)** skjedde i forhold modellen ville kalt "for
    tørt" (<15 mm) — lav falsk-negativ-rate, et tegn på at
    `minNedbor14`-grensen ikke er urealistisk streng.
  - Kaldt-straffen (`tempAvg` 5 dager < `minTempAvg`-4=4°C) utløste kun på
    2 av 25, begge sent i sesongen (okt/nov) — ser fornuftig ut.
  - **Bifunn**: 4 av 25 (16 %) skjedde utenfor artens deklarerte sesong
    (juli-okt) — inkl. 8. juni og to novemberfunn. For lite grunnlag til å
    endre `season`-feltet på egen hånd, men verdt å se nærmere på.

  **Viktig metodisk forbehold**: dette er presence-only-data (kun
  bekreftede funn, ingen bekreftede FRAVÆR) — samme grunnleggende
  begrensning som lift-testen for artsprofilene over. At 96 % av funnene
  lå over `minNedbor14` beviser ikke at akkurat 15 mm er det optimale
  tallet, bare at det ikke er satt urealistisk strengt (folk finner
  faktisk kantarell nesten aldri i forhold modellen ville avvist). En
  litt lavere ELLER litt høyere grense kunne gitt et like konsistent
  resultat med dette datagrunnlaget alene.

  **Utvidet til de resterende 8 artene samme dag** (n≈20 per art, samme
  metode):

  | Art | n totalt | "FOR TØRT"-andel | Utenfor sesong-andel |
  |---|---|---|---|
  | Kantarell | 925 | 4 % | 16 % |
  | Traktkantarell | 650 | **20 %** | 0 % |
  | Trompetsopp | 273 | 16 % | 5 % |
  | Steinsopp | 478 | 15 % | 20 % |
  | Rødskrubb | 393 | 5 % | 10 % |
  | Matriske | 47 | **35 %** | 10 % |
  | Piggsopp | 102 | 5 % | 5 % |
  | Fåresopp | 268 | 5 % | 5 % |
  | Kransmusserong | 24 | 0 % | **37 %** |

  De fleste artene ligner kantarell (lav "for tørt"-andel, ingen urealistisk
  streng terskel synlig). To avvik pekte seg ut og er nå **rettet
  2026-08-18 (v0.28.11), se CHANGELOG**:
  - ~~**Matriske**: 35 % "for tørt"~~ — testet på nytt med ALLE 47
    bekreftede funn (fullt utvalg, ikke stikkprøve): 26 % under gammel
    grense, klynge på 8,9 mm (tre funn) som gulv. `minNedbor14` senket fra
    15 til 8 — passer også bedre med at arten allerede er modellert som
    tørketolerant (`fuktighet:['tørr','frisk']`), i motsetning til
    kantarell/traktkantarell som den tidligere delte fuktighetsgrense med.
  - ~~**Traktkantarell**: 20 % "for tørt"~~ — testet på nytt med n=40 (av
    610, etter å ha filtrert bort noen Artskart-poster med en tydelig
    feilregistrert dato, år=1): 15 % under gammel grense, klynge på
    11,5 mm (to funn) som gulv. `minNedbor14` senket fra 20 til 11.

  Ingen endring i `idealNedbor14` for noen av artene — datagrunnlaget pekte
  kun på at nedre grense var for streng, ikke at toppen var feil.
  - ~~**Kransmusserong sin sesong**~~ — **rettet 2026-08-18 (v0.28.10), se
    CHANGELOG.** Så på de 24 rå funnene som 8 unike observasjonsdatoer i
    stedet (flere Artskart-rader kan dele samme reelle funnhendelse) — 4 av
    8 lå FØR det deklarerte sep-okt-vinduet, alle tett klynget rett før
    september (31. juli, 30. aug, 8. aug, 15. aug, på tvers av
    1992/2022/2023/2024) i stedet for spredt gjennom året, som man ville
    forvente av tilfeldige feilbestemmelser snarere enn en reell
    sesongstart. Fant uavhengig kildebekreftelse: en svensk artikkel om
    goliatmusseron (samme art) nevner eksplisitt et tidlig funn "12
    augusti" i Bjurholm, Västerbotten, ved siden av hovedsesongen sep-okt —
    samme mønster. `season` endret fra `[9,10]` til `[8,10]`; ingen endring
    i sluttmåned (ingen funn støttet juli som reell start).

  Testet kun n≈20-25 per art (kantarell) — små tall, spesielt for artene
  med lite totalt datagrunnlag (kransmusserong n=24, matriske n=47).
  Nedvekting/tydeligere merking som grov heuristikk er fortsatt en rimelig
  konklusjon for settet som helhet, men "helt ukalibrert" er ikke lenger
  riktig beskrivelse — de fleste artene ser brukbare ut, og de to-tre som
  ikke gjør det har nå en konkret, navngitt retning å undersøke videre i
  stedet for en generell bekymring.

## UX-forbedringer

- ~~**"Preferanser & Config" → "Preferanser & Konto"**~~ — **gjort
  2026-08-18.** Navnet var ikke lenger representativt (brukeren påpekte:
  ingen GitHub-oppsett ligger der lenger) — panelet har uansett kun to
  faner, "Preferanser" og "Konto", så heading-teksten matcher nå faktisk
  innholdet. Rettet alle 6 forekomster i `index.html`/`js/app.js` + én
  CSS-kommentar.
- **Mobil: plassbruk over kart/liste må ses på** — brukeren påpekte
  2026-08-18 at komponentene som ligger over selve kartet/resultatlisten
  (banner/varsler/paneler — "Legg til på hjemskjermen", "Om dataene",
  "Viktig om artsbestemmelse", "Preferanser & Konto", artsvelgeren) til
  sammen tar for mye vertikal plass på mobil før brukeren når det de
  faktisk kom for (kart/liste). Ikke undersøkt eller løst ennå — trenger
  en egen gjennomgang av rekkefølge/synlighet/default-kollaps-tilstand for
  disse komponentene spesifikt på mobilbredde, ikke bare en generell
  "gjør ting mindre"-øvelse. Mulige retninger å vurdere når dette tas fatt
  på: strengere default-kollaps på mobil for banner/varsler, flytte
  sjeldnere brukte paneler lenger ned, eller en helt annen topp-struktur
  på smale skjermer enn desktop.

## Del 3 — bulk-ETL-migrasjon (scoping 2026-08-18)

**Hvorfor dette er en forutsetning, ikke en kvalitetsforbedring.**
Voksestedslaget-artifaktets Del 4-kalibreringer (Vågå/Hitra/Nannestad,
2026-08-16) konkluderte at en full sekvensiell nasjonal sveip med dagens
live-pipeline tar **11,6–24,2 dager**, selv etter de billige fiksene som
allerede er shippet (batchet høydekall, bbox-scopet duplikatsjekk). Ingen
nasjonal utrulling (verken det generelle datagrunnlaget eller AR5-
åpen-mark-punktene fra i dag) er praktisk mulig før dette er løst.

**Hva som allerede er reelt undersøkt** (Voksestedslaget-artifaktet,
seksjon 3.5, 2026-08-16 — nedlastingsMEKANIKKEN, ikke selve
per-punkt-oppslaget, er testet og validert):

| Faktor | Kilde | Tilgang | Status |
|---|---|---|---|
| Berggrunn | NGU (N50) | Åpen, `nedlasting.ngu.no` REST-ordre-API, fylkesnivå | ✓ Bygget + validert (100 % paritet) |
| DTM/høyde | Kartverket | Åpen, `hoydedata.no` ArcGIS ImageServer, vilkårlig bbox | ✓ Prototyp validert |
| SR16 (treslag/alder/hogstår) | NIBIO | Åpen, `kart8.nibio.no/api/v2`, samme mønster som NGU | ✓ Bygget + validert (delvis, 80 %) |
| Markfuktighet | NIBIO | Åpen, samme API som SR16, kun "hele landet" (ingen fylkesfilter) | ✓ Bygget + validert |
| Skog/ikke-skog-porten (selve gaten) | FKB-AR5 bulk (Geovekst) | **Krever spesialtilgang** (nd.filnedlasting m.fl.) | ✗ Droppet fra planen |

**Ny informasjon fra i dag som endrer bildet for den siste raden**: AR5
sin **live WMS-tjeneste** (`wms.nibio.no/cgi-bin/ar5`, brukt i
åpen-mark-arbeidet over) er IKKE underlagt samme Geovekst-sperre som bulk
FKB-AR5-nedlastingen — verifisert ved faktisk bruk i dag. Dette er ikke en
motsigelse (ulike tilgangsveier til samme datasett), men betyr at
skog/ikke-skog-porten kan flyttes vekk fra det kostbare høydekallet
(Hitra-kalibreringen: 85,3 % av alle kandidater betaler dette kallet
UTELUKKENDE for skog/ikke-skog-svaret, før noen av de fire faktorene over
kommer i spill) ved å bruke AR5 WMS i stedet — fortsatt ett live-kall per
kandidat, altså IKKE den fulle "null nettverkskall"-gevinsten Del 3 sikter
mot for denne porten spesifikt, men uavhengig implementerbart og langt
billigere enn dagens vei via høyde-API + påfølgende SR16/markfuktighet/
berggrunn-kall for kandidater som uansett blir forkastet.

**Hva som IKKE var undersøkt før i dag — testet nå, med ekte cachet data**
(`data/bulk-cache/`, gjenglemt fra 2026-08-16-økten, gitignoret men
fortsatt lokalt tilgjengelig — ingen nye nedlastinger gjort):

- **DTM-punktoppslag** (`rasterio`, allerede installert): fungerer.
  Reell høyde hentet fra den cachede Nannestad-GeoTIFF-en på et vilkårlig
  punkt, EPSG:4326 direkte (ingen reprojisering nødvendig, bekrefter
  artifaktets 3.4-notat). Testfilen er ~100 m/px, ikke DTM10s 10 m —
  trolig en bevisst grov testeksport, oppløsningsvalg for produksjon er
  ikke avgjort.
- **Berggrunn punkt-i-polygon** (`pyshp` + `shapely`, begge allerede
  installert): fungerer. 2378 ekte polygoner for Akershus lest inn på
  0,79s, punkt-i-polygon-søk 31ms (naiv lineær søk — trenger en
  romlig indeks, f.eks. `shapely.STRtree`, for nasjonal skala med
  vesentlig flere polygoner enn ett fylke). CRS bekreftet `GCS_ETRS_1989`
  (samme som EPSG:4258/4326 for dette formålet), matcher artifaktets
  3.4-konklusjon om at `pyproj`-reprojisering ikke er nødvendig. Feltet
  `hovedberg`/`hovedberg_` (bergartsnavn) matcher direkte dagens
  streng-baserte `classify_berggrunn()`-logikk i `fetch_area.py`
  (fattig/moderat/rik ut fra nøkkelord som "kalkstein"/"skifer") — samme
  klassifiseringsregler kan gjenbrukes uendret, kun datakilden byttes.
- **SR16 raster-lesing og markfuktighet raster-lesing**: IKKE testet i
  dag (ingen cachede filer for disse to lokalt) — neste konkrete steg,
  se under. Artifaktet advarer allerede om én reell fallgruve her:
  SR16R (rasterversjonen) bruker et ANNET kodeskjema enn SR16V
  (vektorversjonen `fetch_sr16()` leser i dag) — `1=Gran/2=Furu/3=Lauv`,
  ikke samme 7-klasses skjema. `TRESLAG_MAP` kan IKKE gjenbrukes uendret
  for rasterkilden.

**Nye avhengigheter** (`scripts/requirements.txt` har i dag kun `requests`
og `shapely`): `rasterio` (raster) og `pyshp` (vektor-shapefiler) — begge
allerede tilgjengelige i dette miljøet, men ikke committet til
`requirements.txt` ennå. `pyproj` trolig IKKE nødvendig (se over).
**Merk**: `rasterio` krever GDAL-systembiblioteker under panseret — må
verifiseres at `pip install rasterio` fungerer rent i GitHub Actions
Ubuntu-runneren (ikke bare i dette forhåndskonfigurerte miljøet) før dette
committes, siden det er der ETL-en faktisk kjører.

**Foreslått rekkefølge for videre arbeid**:
1. ~~Verifiser `rasterio`/`pyshp` faktisk installerer rent i en frisk
   GitHub Actions Ubuntu-runner~~ — **gjort 2026-08-19.** Ny
   `verify-del3-deps.yml` (workflow_dispatch, ingen cache, kaldt
   `pip install`) kjørt mot `fungifinder-db`s `main`:
   [run 32251199113](https://github.com/runelov/fungifinder-db/actions/runs/32251199113)
   — grønn. `rasterio` 1.4.4 / GDAL 3.10.3 / `pyshp` 3.1.6 / `shapely`
   2.1.2, GTiff-driver bekreftet tilgjengelig (70 drivere totalt). Verken
   workflowen (`.github/workflows/verify-del3-deps.yml`) eller
   sjekk-scriptet (`scripts/verify_del3_deps.py`) er fjernet — begge kan
   kjøres på nytt om GDAL-relatert usikkerhet dukker opp igjen senere.
   `scripts/requirements.txt` er bevisst IKKE endret ennå (se punkt 3 —
   avhengighetene legges til når selve bygget faktisk starter).
2. ~~Test SR16- og markfuktighet-rasterlesing mot ferske nedlastede
   filer~~ — **gjort 2026-08-19.**

   **Nedlastings-API'et måtte reverse-engineeres på nytt** — artifaktets
   antakelse om at markfuktighet og SR16 deler "samme API" med kun
   fylkesnivå-forskjell, stemte delvis: begge går via
   `kart8.nibio.no`s bestillings-API (samme mønster som NGU/berggrunn,
   `nedlasting.geonorge.no`-standarden), funnet ved å lese
   `main.*.js`-bunten til `kart8.nibio.no/nedlasting/` (Angular-appen bak
   nedlastingssiden) for de faktiske endepunktene, IKKE ved å gjette:
   - `GET /api/v2/dataset/` — datasettliste. **SR16 står IKKE i denne
     listen** (kun 20 spesialdatasett som Sbase2/DMK/Urban Atlas) — riktig
     `metadataUuid` måtte hentes fra Geonorges kartkatalog-API
     (`kartkatalog.geonorge.no/api/search?text=SR16`) i stedet.
   - `GET /api/capabilities/{uuid}` → lenker til projection-/format-/area-
     kodelister + selve bestillings-endepunktet.
   - `GET /api/v2/codelists/area/{uuid}` — **korrigerer artifaktets
     antakelse**: markfuktighet støtter virkelig kun étt areal, `"0000"
     Hele landet` — MEN SR16 raster støtter fylkesnivå (`"32" Akershus`
     osv.), altså ikke samme begrensning som markfuktighet likevel.
   - `POST /api/v2/order` med `{email, orderLines:[{metadataUuid, areas,
     projections, formats}]}` → returnerer direkte nedlastbare
     `downloadUrl`-er synkront (ingen e-postventing, matcher
     `deliveryNotificationByEmail:false` fra capabilities-svaret).

   **Filstørrelser var større enn ventet** — markfuktighet "hele landet"
   er én 7,4 GB GeoTIFF; SR16 raster for kun Akershus er en 846 MB zip
   (23 enkeltlags-TIFF-er, `SRRTRESLAG`/`SRRTREALDER`/m.fl., lagret
   ukomprimert i zip-en). **Ingen av delene ble lastet ned i sin helhet**
   — GDALs `/vsicurl/`-lag leser vilkårlige vinduer over HTTP
   Range-forespørsler direkte fra NIBIOs server, og siden zip-medlemmene
   er ukomprimert virker `/vsizip//vsicurl/URL/internfil.tif` også
   direkte inn i zip-en uten lokal nedlasting. Dette er en litt annen — og
   trolig bedre — arkitektur enn planen opprinnelig så for seg
   ("last ned én gang, les lokalt etterpå"): punktoppslag kan gjøres
   direkte mot NIBIOs filserver på forespørsel, uten noen
   nedlastings-/cache-fase i det hele tatt, så lenge nettverksmiljøet
   (også GitHub Actions-runneren, ikke bare her) faktisk støtter
   HTTP Range mot denne serveren i praksis — ikke sjekket ennå, se åpent
   punkt under.

   **Kodeskjema for `SRRTRESLAG` bekreftet autoritativt**, ikke bare
   antatt fra artifaktet: `GetLegendGraphic` mot samme WMS-lag
   (`wms.nibio.no/cgi-bin/sr16?...&layer=SRRTRESLAG`) ga en 3-fargers
   tegnforklaring — grønn/beige/lys gul, lest av som eksakte RGB-verdier
   — som kun kan tolkes `1=Gran, 2=Furu, 3=Lauv` i den rekkefølgen.
   Bekrefter artifaktets antakelse, men nå verifisert, ikke gjettet.

   **Paritetstest, markfuktighet** (n=7, samme punkter innenfor
   Nannestad-testarealet som DTM-en fra 2026-08-16 dekker):
   **7/7 eksakt treff** mot `fetch_markfuktighet()`s live klasseindeks —
   ingen omregning nødvendig, rasterklassen ER indeksen appen allerede
   bruker.

   **Paritetstest, SR16 treslag** (n=25 tilfeldige punkter i samme
   område, sammenlignet mot `fetch_sr16()`s live SRVTRESLAG-svar):
   16 treff, 3 avvik, 3 "ulik dekning" (raster tom der live hadde svar —
   trolig punkter som falt utenfor Akershus' faktiske fylkesgrense siden
   testpunktene ble valgt fritt i en bbox uten å sjekke administrativ
   grense, ikke bekreftet), 3 der begge var tomme. **16/19 = 84 % blant
   sammenlignbare punkter** — samsvarer godt med "delvis, 80 %"-tallet
   artifaktet allerede hadde notert 2026-08-16, altså reproduserbart og
   ikke en tilfeldighet. Avvikene er trolig ekte SR16V/SR16R-uenighet
   (vektorlaget er en generalisering av rasteret til større, mer homogene
   bestand — se NIBIOs egen produktbeskrivelse — så pikselnivå-avvik nær
   bestandsgrenser er forventet, ikke nødvendigvis en feil i noen av
   kildene). `SRRTREALDER` ble også lest ut for alle 25 punkt og gir
   plausible rå årstall (0 for nylig hogd/plantet, 139–151 for gamle
   bestand) — bøtte-grensene for ung/middels/gammel er IKKE
   punkt-for-punkt verifisert mot dette, kun sjekket at størrelsesordenen
   stemmer overens.

   **Åpent funn**: fant ingen rasterlags-motstykke til `hogst`
   (hogstår) blant SR16 raster-zip-ens 23 lag — kun treslag, alder og en
   rekke volum-/biomasse-mål. Om `enrich_point()`s nye lokale versjon
   trenger hogstår, må dette feltet trolig enten beholdes som live
   WMS-kall (kun for kandidater som består portvakten, altså sjelden) eller
   avledes tilnærmet fra svært lav `SRRTREALDER` — ikke avgjort, tas opp
   igjen i punkt 3.

3. Bygg `enrich_point()`s nye lokale versjon FAKTOR FOR FAKTOR (berggrunn
   først — mest modent, deretter DTM, så SR16, så markfuktighet), med et
   feature-flag som lar den fortsatt falle tilbake til live-WMS-kall per
   faktor til hver er verifisert — ikke én stor rewrite som bytter alt på
   én gang.

   ~~Berggrunn portert~~ — **gjort 2026-08-19** (`fungifinder-db`,
   `scripts/fetch_area.py`). `fetch_berggrunn()` er nå et dispatch-lag
   styrt av `FUNGIFINDER_LOCAL_BERGGRUNN=1` (AV som standard — uendret
   produksjonsatferd) mellom `fetch_berggrunn_live()` (uendret, gammel
   kode) og ny `fetch_berggrunn_local()`. Klassifiseringsregelen
   (kalkstein/marmor→rik, skifer/fyllitt→moderat, ellers fattig) er
   flyttet til én delt `classify_bergart()` slik at de to kildene kun kan
   avvike i rådata, aldri i tolkning.

   **Viktig korreksjon underveis**: 2026-08-16-øktens lokalt cachede
   `BerggrunnN50`-datasett (fylkesscopet, Akershus, 2378 polygoner) viste
   seg IKKE å være samme kilde som selve live WMS-laget
   (`Berggrunn_nasjonal_hovedbergarter`) faktisk bruker — paritetstest
   mot N50 ga 24/25 (96 %, ett reelt avvik: N50 sa "Sandstein" der live
   sa "Kalkstein"/rik for samme punkt). Undersøkt med rå GML fra live-
   kallet: laget er NGUs **"Berggrunn N1350"**-produkt
   (1:1 350 000-skala, landsdekkende i ÉN fil, kun 4637 polygoner totalt
   — hele Norge, ikke bare ett fylke). Byttet til N1350
   (`nedlasting.ngu.no`, samme bestillings-API-mønster som NIBIO-
   funnene i steg 2, men `deliveryNotificationByEmail:true` her — måtte
   polles/verifiseres at et tomt e-postfelt likevel fungerer synkront,
   noe det gjorde når format-/areanavn matchet kodelisten eksakt).
   Ny paritetstest mot N1350: **37/37 (100 %)** — 25 punkt i
   Akershus-området + 12 spredt over hele landet (Rogaland til Finnmark),
   sammenlignet mot ekte `fetch_berggrunn_live()`-svar. Det tidligere
   N50-datasettet i `data/bulk-cache/berggrunn/` er nå feilaktig og bør
   IKKE brukes — `data/bulk-cache/berggrunn_n1350/norge_n1350.zip` er
   riktig kilde.

   Siden N1350 er landsdekkende i ÉN ~82 MB fil (i motsetning til SR16s
   per-fylke-oppdeling), var det praktisk å laste den ned i sin helhet i
   stedet for `/vsicurl/`-vindusnedlasting — `_download_berggrunn_n1350_if_missing()`
   bestiller og laster ned automatisk ved første bruk (verifisert fra
   tom tilstand: bestilling → nedlasting → STRtree-indeksering tar ~8s
   totalt), til `data/bulk-cache/berggrunn_n1350/` (gitignored, IKKE
   committet — dette betyr GitHub Actions-runnere laster ned filen på
   nytt for hver jobbkjøring når flagget er på, siden runnere er
   forkastet mellom kjøringer og det ikke er satt opp noen
   `actions/cache`-lagring for denne mappen ennå — en reell, ikke løst,
   kostnadsavveining å ta stilling til før flagget faktisk slås på i
   produksjon: enten aksepter ~8s/kjøring, eller sett opp
   `actions/cache` nøkkelet på filens uendrede innhold).

   `shapely.strtree.STRtree` bygges ÉN gang per prosess (~5s for 4637
   polygoner) og gjenbrukes for alle punkt i kjøringen (lazy singleton,
   `_LOCAL_BERGGRUNN_INDEX`) — samme oppslagstid som artifaktets
   opprinnelige N50-test viste (sub-millisekund per punkt), **dette
   dekker punkt 4 under for berggrunn spesifikt** (spatial-indeks var
   allerede en del av implementasjonen, ikke en egen etterfølgende
   jobb). `pyshp` er nå lagt til `scripts/requirements.txt` (`rasterio`
   fortsatt ikke — trengs først når DTM/SR16/markfuktighet porteres, se
   under).

   **Ikke gjort ennå**: DTM, SR16, markfuktighet er fortsatt live-only —
   dette var kun berggrunn, det mest modne sporet. `hogstår`s manglende
   SR16-rasterekvivalent (se steg 2) er heller ikke avgjort.

   **GitHub Actions-cache lagt til og verifisert 2026-08-19, samme dag**
   (den ubesvarte kostnadsavveiningen over): `actions/cache@v4` lagt til i
   alle tre workflowene som kan nå `fetch_berggrunn()`
   (`fetch-area.yml`/`refresh-areas.yml`/`enrich-point.yml`), nøkkel
   `berggrunn-n1350-v1` (manuelt bumpet versjon, ikke innholdshash —
   berggrunnsgeologi endres praktisk talt aldri). `fetch-area.yml` fikk i
   tillegg en `localBerggrunn` workflow_dispatch-input for å kunne teste
   flagget i ekte CI uten å endre standardatferden i de to andre
   workflowene (fortsatt AV der, venter på steg 6). Verifisert med tre
   ekte kjøringer, ikke bare antatt:
   - [Kjøring 1](https://github.com/runelov/fungifinder-db/actions/runs/32254256440) (Oslo sentrum, radius 2 km): 0 av 4 kandidatpunkter bestod
     skog-porten — INGEN treff på `fetch_berggrunn()`, altså ingen
     nedlasting, og cache-steget hoppet over lagring siden mappen aldri
     ble opprettet (harmløst, som forventet — men et tegn på at
     testpunktet var dårlig valgt, rettet i kjøring 2).
   - [Kjøring 2](https://github.com/runelov/fungifinder-db/actions/runs/32254404504) (Nannestad-området, radius 2 km, samme skogpunkt som
     paritetstesten i steg 2/3): "Cache not found for input keys:
     berggrunn-n1350-v1" → ekte nedlasting i selve Actions-runneren
     ("lastet ned 81.9 MB", samme størrelse som lokalt) → "Cache saved
     with key: berggrunn-n1350-v1".
   - [Kjøring 3](https://github.com/runelov/fungifinder-db/actions/runs/32254566794), identiske parametre: "Cache hit for: berggrunn-n1350-v1"
     → "Cache restored from key" → rett til "indeksert 4637 polygoner",
     INGEN ny bestilling/nedlasting denne gangen. Cache-mekanikken
     fungerer altså som tiltenkt i produksjonsmiljøet, ikke bare lokalt.

   ~~DTM portert~~ — **gjort 2026-08-19, samme dag.** Ny
   `fetch_elevation_and_slope_local()`, styrt av `FUNGIFINDER_LOCAL_DTM=1`
   (AV som standard).

   **Viktig arkitekturforskjell fra berggrunn**: selve skog/åpen-mark-
   PORTEN (`fetch_elevation_point()`s `terreng`- og `stedsnavn`-felt) har
   INGEN lokal erstatning og forblir alltid live uansett flagg — DTM10 er
   en ren høydemodell uten arealtype. Flagget bytter derfor kun ut selve
   høyde-/helnings-/himmelretningsberegningen (`compute_slope_aspect()`s
   4-nabo-batch-livekall) for kandidater som allerede har bestått porten —
   en mer beskjeden, men fortsatt reell, gevinst enn berggrunn (som
   fjernet ETT helt live-kall for HVERT kandidatpunkt; DTM fjerner ett av
   TO gjenværende kall, kun for de ~15-25 % som består porten). Den fulle
   "null live-kall for skog/ikke-skog-porten"-gevinsten er fortsatt punkt
   5 (AR5-gate), en separat, ikke gjort endring.

   **Kartverkets DTM finnes IKKE som én fil eller fylkesscopet fil** slik
   berggrunn/SR16 gjør — "DTM 10 Terrengmodell (UTM33)" er delt i **254
   kartblad-fliser** (~50×50 km hver, `nedlasting.geonorge.no`s
   area-kodeliste for datasettet). `_find_dtm_tile()` avgjør hvilken flis
   et punkt faller i ved å sjekke allerede kjente flisers cachede
   dekningsbokser lokalt FØRST — kun ett punkt utenfor alle kjente bokser
   trigger ett live `GetFeatureInfo`-kall mot Kartverkets dekningslag-WMS
   (`celler_utm33`), ikke ett per punkt. Nedlasting-på-forespørsel
   gjenbruker ordre-API-mønsteret fra berggrunn, men på
   `nedlasting.geonorge.no` (Geonorge selv, IKKE NGU/NIBIO) — merk
   stiforskjellen: `/api/order`/`/api/codelists/...` UTEN `v2`, ulikt de
   to andre vertene.

   **Reell bug funnet og omgått underveis**: dekningslag-WMS-en
   (`celler_utm33`) sitt MapServer-oppsett genererer et ugyldig XML-
   tagnavn for selve laget (mellomrom i `<celler_utm33_fra
   _utm32_og_utm35_50m_grid_layer>`, bekreftet i rå GetFeatureInfo-
   respons) — dette får `ET.fromstring()` (brukt av `parse_gml_feature()`)
   til å kaste `ParseError`, som fanges og gir stille `None` for ALLE
   punkt uansett faktisk treff. Byttet til en egen regex-basert uthenting
   av `bilde_nr` for akkurat dette laget i stedet for å bruke den delte
   GML-parseren.

   **Paritetstestet**: 12 tilfeldige punkt i én flis (6602-1, dekker deler
   av Nannestad-området) — rå høyde typisk <1,1 m avvik fra
   `fetch_elevation_point()`s live svar (én outlier 3,6 m). 10 punkt til
   gjennom den faktiske `enrich_point()`-logikken (elevasjon+helning+
   himmelretning sammen): helning typisk <0,8° avvik, himmelretning
   eksakt likt i 9/10 — det tiende var et grensetilfelle rett ved
   flathet-terskelen (1,5°), ikke en reell uenighet.

   **Verifisert i ekte CI, samme tre-kjørings-mønster som berggrunn**: ny
   `localDtm`-input i `fetch-area.yml` + `actions/cache`-steg (nøkkel
   `dtm10-tiles-v1`) i alle tre workflowene.
   [Kjøring 1](https://github.com/runelov/fungifinder-db/actions/runs/32255893846): "Cache not found for input keys: dtm10-tiles-v1" →
   "flis 6602-1 mangler lokalt — bestiller fra Geonorge …" → "lastet ned
   43.7 MB" → `hoyde: 4 ok / 0 feil av 4 (100%)` → "Cache saved with key:
   dtm10-tiles-v1".
   [Kjøring 2](https://github.com/runelov/fungifinder-db/actions/runs/32256037385), identiske parametre: "Cache hit for: dtm10-tiles-v1", INGEN
   ny nedlasting. Lastet ned dry-run-artifacten og bekreftet at reelle,
   plausible verdier faktisk skrives helt til slutt (ikke bare at koden
   kjører uten feil): `hoydeMoh: 434.3`, `helningGrader: 13.4`,
   `himmelretning: "V"` for det godkjente punktet.

   ~~SR16 portert~~ — **gjort 2026-08-19, samme dag.** Ny
   `fetch_sr16_local()`, styrt av `FUNGIFINDER_LOCAL_SR16=1` (AV som
   standard). Enklere å koble inn enn DTM (rent drop-in-bytte, ingen
   `enrich_point()`-grenselinje-logikk å endre — treslag/alder har ingen
   gate-avhengighet slik høyde/terreng har).

   **Arkitekturvalg, ulikt berggrunn/DTM**: INGEN lokal nedlasting/cache.
   SR16 raster tilbys kun fylkesscopet (Akershus: 846 MB for 23 lag), og
   kun 2 av dem trengs (`SRRTRESLAG`/`SRRTREALDER`) — en full nedlasting
   ville kastet bort >95 % av dataen. Leser i stedet direkte via
   `/vsizip//vsicurl/` mot NIBIOs server (samme mekanikk steg 2 allerede
   validerte for selve paritetstesten, nå gjenbrukt i selve ETL-koden).
   Dette besvarer også et åpent spørsmål fra steg 2 ("ikke bekreftet at
   dette fungerer likt fra en GitHub Actions-runners nettverk") — **bekreftet
   2026-08-19**: [ekte CI-kjøring](https://github.com/runelov/fungifinder-db/actions/runs/32257263375) åpnet raster remote og ga
   `sr16: 1 ok / 0 feil`, ingen lokal fil involvert. Fylkeskoden for et
   punkt slås opp via `reverse_geocode()` (samme Nominatim-funksjon
   radius-modus allerede bruker) matchet mot NIBIOs egen fylkeskodeliste —
   kun ett nytt Nominatim-kall per NYTT fylke kjøringen støter på, ikke
   per punkt (samme cache-mønster som DTM-flisene).

   **Reell bug funnet og rettet underveis**: Oslo (fylke `"03"`) sine
   zip-interne filnavn dropper den ledende nullen
   (`sr16_3_SRRTRESLAG.tif`, ikke `sr16_03_...`), mens selve area-koden i
   bestillingen MÅ være to-sifret for å matche NIBIOs kodeliste — oppdaget
   ved å liste Oslo-zip-ens faktiske innhold live i stedet for å anta
   samme mønster som Akershus. Alle andre fylker er allerede to-sifrede
   uten ledende null, så fiksen (`str(int(fylke_kode))` for filnavnet) er
   et no-op for dem.

   **Paritetstesting — metodikk korrigert underveis**: en første, rask
   test med tilfeldige punkter UANSETT terrengtype ga en mye høyere
   "ulik dekning"-rate (6/14) enn steg 2s opprinnelige tall — men dette
   var et metodikkfeil, ikke et reelt funn: `fetch_sr16()` kalles i
   PRODUKSJON kun for punkt som allerede har bestått skog-porten
   (`enrich_point()`), så å teste mot vilkårlige punkter (inkludert vann/
   åker/bebygd mark, der SR16 raster korrekt returnerer nodata) er ikke
   representativt. Rettet test (kun punkter der høgdeprofil-APIets
   `terreng` faktisk sier "skog" FØRST, samme filter som ekte bruk):
   **10/15 = 67 % match, 0 ulik dekning** (n=15). Lavere enn steg 2s 84 %,
   men samme underliggende årsak til avvikene (gran/furu-uenighet i
   blandingsskog nær bestandsgrenser, SR16V vs SR16R) — begge tallene er
   trolig innenfor rimelig varians for et lite utvalg av samme reelle
   fenomen, ikke motstridende funn. **Ikke fullstendig avklart** hvor den
   sanne raten ligger — burde måles på et større utvalg (Del 3 steg 6) før
   flagget vurderes slått på i produksjon.

   **`hogstAr` returneres ALLTID `None`** fra lokal lesing — ingen
   SR16-rasterlags-motstykke finnes (bekreftet steg 2), og bevisst IKKE
   tilnærmet fra lav alder for å unngå å innføre systematisk skjevhet i et
   reelt scoringsfelt uten dokumentert grunnlag for terskelen.

   ~~Markfuktighet portert~~ — **gjort 2026-08-19, samme dag. Alle fire
   faktorer i Del 3 er nå portert** (berggrunn, DTM, SR16, markfuktighet),
   alle AV som standard bak hvert sitt flagg. Ny
   `fetch_markfuktighet_local()`, styrt av
   `FUNGIFINDER_LOCAL_MARKFUKTIGHET=1`. Arkitektonisk den enkleste av de
   fire: samme `/vsicurl/`-mønster som SR16 (ingen lokal
   nedlasting/cache — filen er 7,4 GB), men uten SR16s fylkesoppslag i
   det hele tatt, siden datasettet kun finnes som ÉN landsdekkende fil.
   Rasterklassen ER appens klasseindeks direkte, ingen
   kodeskjema-oversettelse nødvendig (ulikt SR16).

   **Reell begrensning oppdaget under paritetstesting, ikke en kode-
   /projeksjonsbug**: et første tilfeldig utvalg (n=6, filtrert til
   punkt som består skog-porten) ga 3/6 eksakt match — resten fikk
   `local=('ukjent', None)` der live sa `('tørr', 6)`. Bekreftet ved rå
   pikselinspeksjon at dette IKKE er en koordinat-/CRS-feil (punktene lå
   godt innenfor rasterets `bounds`, men traff selve pikselverdien 0/
   `nodata`) — datasettet har ekte, spredte dekningshull. Et andre
   utvalg (n=12, kjente norske tettsteder/områder spredt fra Rogaland
   til Finnmark, samme punkter som berggrunn-testen) ga et mye bedre
   bilde: **11/12 eksakt match**, ett hull (Nordland/Trøndelag-grensen).
   Hullene ser ut til å klynge seg i fjellstrøk/spredtbygde områder,
   plausibelt fordi markfuktighet er AVLEDET fra høydedata og arver
   samme datagrunnlagshull der høyoppløst DTM er tynnere. Sann
   dekningsrate ikke presist fastslått — samme "burde måles på et større
   utvalg før produksjon"-forbehold som SR16. Faller uansett trygt
   tilbake til `("ukjent", None)`, samme vei som live-funksjonens egne
   feilhåndteringstilfeller — ingen krasj, bare mindre presis scoring
   for de berørte punktene.

   **Regional oppfølging (2026-08-19, samme dag, på brukerens
   forespørsel)**: full kommune-sveip av **Vågå** (fjellkommune,
   Jotunheimen-området — bevisst valgt som motsetning til Nannestads
   lavland, og samme kommune som Voksestedslagets egen Del 4-kalibrering
   2026-08-16 brukte) — 589 kandidater, 246 godkjent, sammenlignet
   punkt-for-punkt mot live (samme metodikk som steg 6).

   Bekrefter fjell-hypotesen tydelig, med tall i stedet for et
   plausibelt gjettverk: **190/246 = 77 % fikk `"ukjent"` lokalt** i
   Vågå — mot praktisk talt 0 % i Nannestad. MEN: av de 56 punktene der
   rasteret FAKTISK hadde en verdi, var **56/56 (100 %) kategori-match
   og 55/56 (98 %) eksakt klasse-match** mot live — altså identisk høy
   presisjon som i Nannestad. **Dette er et rendyrket
   DEKNINGS-problem, ikke et NØYAKTIGHETS-problem**: der datasettet har
   en verdi, er den pålitelig; det er bare at det ofte ikke har noen i
   fjellterreng. Sann landsdekkende dekningsrate ligger etter dette
   trolig et sted mellom Nannestads ~100 % og Vågås 23 %, sterkt
   avhengig av hvor mye av et gitt sveip som faktisk er fjell/utmark —
   **`FUNGIFINDER_LOCAL_MARKFUKTIGHET` bør IKKE slås på i produksjon**
   før enten (a) dekningen forbedres/suppleres på annet vis for
   fjellområder, eller (b) koden endres til å falle tilbake til
   live-kallet spesifikt når rasteret gir `nodata`, i stedet for å gi
   `"ukjent"` — det andre alternativet er sannsynligvis den raskeste,
   tryggeste veien til et faktisk produksjonsklart flagg, siden selve
   nøyaktigheten der data finnes ikke er problemet.

   Verifisert i ekte CI med samme mønster som de tre andre — ny
   `localMarkfuktighet`-input, [kjøring](https://github.com/runelov/fungifinder-db/actions/runs/32257988935) ga
   `markfuktighet: 1 ok / 0 feil`, dry-run-artifact bekreftet reell verdi
   (`fuktighet: "tørr"`, `fuktighetIndex: 6`) skrevet til slutt.
4. ~~Legg til en romlig indeks~~ (`shapely.STRtree`) — **gjort for
   berggrunn 2026-08-19**, se steg 3 over (bygget inn i selve
   berggrunn-porteringen i stedet for som et eget etterfølgende steg).
   DTM/SR16/markfuktighet trenger ingen tilsvarende indeks når de
   porteres — de er rasterpunktoppslag via `rasterio` (vindussampling),
   ikke vektor-punkt-i-polygon-søk, så dette punktet er i praksis løst
   for alle fire faktorene, ikke bare berggrunn.
5. ~~Avgjør AR5-skog-porten separat~~ — **gjort 2026-08-19, samme dag.**
   Nytt `FUNGIFINDER_AR5_GATE=1` (AV som standard). `fetch_ar5_arealtype()`
   avgjør nå skog/åpen-mark/avvis i ÉTT kall, i stedet for dagens
   Kartverk-terreng-sjekk FØRST + et ekstra AR5-kall kun for
   åpen-mark-kandidater.

   **Målt, ikke antatt — den opprinnelige "langt billigere"-antakelsen
   holdt IKKE**: AR5 (GetMap+pikselfarge) og Kartverkets høgdeprofil-API
   har praktisk talt samme responstid per kall (147ms vs 130ms, liten
   måling). Å bytte portkilde er ALENE altså ikke en stor
   hastighetsgevinst. Den reelle, smalere gevinsten: (1) fjerner
   dobbelt-kallet dagens vei allerede gjør for åpen-mark-kandidater
   (ett i stedet for to for DEN undergruppen), og (2) — viktigst i
   kombinasjon med `LOCAL_DTM_ENABLED` — fjerner den SISTE gjenværende
   harde Kartverk-avhengigheten fra pipelinen: med begge flagg på
   trenger et akseptert skogpunkt INGEN live Kartverk-kall i det hele
   tatt. Prisen: `stedsnavn` blir da alltid borte (DTM10 har ingen —
   faller til enrich_point()s eksisterende generiske
   "Skogpunkt N"/"Åpent punkt N"-fallback).

   **Paritetstestet FØR koding** (samme rekkefølge som resten av Del 3):
   AR5s "Skog"-klasse mot Kartverkets skog/ikke-skog-svar, n=25
   landsdekkende tilfeldige punkt — **25/25 enig** på selve skog/
   ikke-skog-binæret (kategoriene stemte forøvrig påfallende godt også
   utover selve skog-spørsmålet: havflate↔Hav, åpentområde↔Åpen
   fastmark, dyrketmark↔Fulldyrka jord). `myr`/`skogbevokst myr` ikke
   observert i utvalget — reell, ikke undersøkt edge-case.

   **Regresjonstestet mot faktisk `enrich_point()`**: 3 punkt (skog/
   åpen/skog) ga IDENTISK aksept/avvisning OG identiske
   `hoydeMoh`/`helningGrader`-verdier med flagget på (uten
   `LOCAL_DTM_ENABLED`) som med det av. Med `LOCAL_DTM_ENABLED` også på:
   samme aksept/avvisning, høyde/helning innenfor DTM-portens allerede
   dokumenterte ~1-2 m/0,5°-avvik. Full kombo (AR5_GATE + alle fire
   Del 3-faktorer samtidig) produserte en komplett, sunn record med KUN
   ett live AR5-kall totalt for et akseptert punkt.

   **Verifisert i ekte CI — reell, liten avviksrate funnet, ikke
   skjult**: [kjøring med flagget PÅ](https://github.com/runelov/fungifinder-db/actions/runs/32258935568) (radius 3 km, samme senter som
   DTM/SR16/markfuktighet-testene) ga 13 kandidater, `ar5: 13 ok`,
   `hoyde: 10 ok` (kun de 10 GODKJENTE trengte Kartverk-kallet, akkurat
   som designet), 10/13 godkjent (76,9 %).
   [Samme sveip med flagget AV](https://github.com/runelov/fungifinder-db/actions/runs/32259102997): `hoyde: 13 ok` (alle 13, som før), 9/13
   godkjent (69,2 %) — **1 av 13 kandidater fikk ulik
   aksept/avvisning-avgjørelse** mellom de to portene. Konsistent med
   den målte 25/25-enigheten (som er et utvalg, ikke en garanti om 100 %
   i alle tilfeller) — en reell, liten, forventet uenighetsrate ved
   marginale punkt, ikke en feil. Verdt å være tydelig på: å bytte port
   endrer FAKTISK hvilke punkt som havner i databasen for et lite
   mindretall, ikke bare hvordan de blir scoret.
6. ~~Kjør en ny Del 4-lignende paritetstest~~ — **gjort 2026-08-19, samme
   dag.** ("Spor B/C fra artifaktet" er ikke gjenfunnet — det var innhold i
   en 2026-08-16 Claude-artifakt-økt, ikke committet noe sted i repoene —
   så dette er en ny, selvstendig test bygget på samme prinsipp: en reell
   kommune-skala sveip med alle flagg AV vs. alle flagg PÅ samtidig,
   sammenlignet punkt for punkt.)

   **Metode**: to parallelle `fetch-area.yml --dry-run`-kjøringer mot
   Nannestad kommune (`gridKm=1.5`, 252 rutenett-kandidater → 149 innenfor
   kommunegrensen) — én med alle Del 3/steg 5-flagg av (dagens
   produksjonsvei), én med `localBerggrunn`+`localDtm`+`localSr16`+
   `localMarkfuktighet`+`ar5Gate` alle PÅ samtidig (full lokal kombo).
   Begge lastet ned som dry-run-artifacts og sammenlignet direkte,
   punkt-for-punkt via `id`-feltet (som koder lat/lon deterministisk).

   **Reell treghet funnet OG rettet FØR sluttresultatet**: første
   full-lokal-kjøring var faktisk **14 % TREGERE** enn live (359,5s mot
   316,0s for samme 149 punkt) — stikk i strid med hele Del 3s
   motivasjon. Rotårsak: `_find_sr16_fylke_code()` kalte
   `reverse_geocode()` (Nominatim, PÅKREVD 1s sleep per faktisk kall) for
   hvert punkt, men cachet kun på Nominatim-funksjonens eget
   ~1 km-rutenett — ved `gridKm=1.5` (større enn cellen) traff nesten
   hvert punkt en ny celle, altså ~100 unødvendige 1-sekunders sleep BARE
   for å slå opp SAMME fylke om og om igjen. Rettet med en egen, mye
   grovere cache (~11 km-rutenett) i selve funksjonen, testet lokalt, og
   kjørt på nytt. **Etter fiksen: 199,6s mot 316,0s — full-lokal er nå
   37 % RASKERE enn live**, altså Del 3s kjernepremiss faktisk bekreftet
   ved reell skala, ikke bare antatt. Dette er nøyaktig den typen ting en
   produksjonsskala-test skal fange opp — verdt å være tydelig på at det
   IKKE fungerte første forsøk, og hvorfor.

   **Punkt-for-punkt-resultater** (149 kandidater, begge kjøringer
   aksepterte 110 — men IKKE de samme 110):
   - 103 punkt akseptert av BEGGE veiene, 7 kun av live-porten, 7 kun av
     AR5-porten — **~6,4 % reell "gate-churn"**, konsistent med det
     mindre 1/13-utvalget fra steg 5, nå bekreftet på et større utvalg.
   - Feltvis enighet blant de 103 punktene begge aksepterte (grei-
     toleranse 5 for høyde/helning, gitt eksisterende dokumenterte
     avvik):
     | Felt | Enighet |
     |---|---|
     | `berggrunn` | 103/103 (100 %) |
     | `hoydeMoh` | 103/103 (100 %) |
     | `fuktighet` | 102/103 (99 %) |
     | `helningGrader` | 102/103 (99 %) |
     | `fuktighetIndex` | 98/103 (95 %) |
     | `himmelretning` | 89/103 (86 %) |
     | `treslag` | 84/103 (82 %) |
     | `skogalder` | 68/103 (66 %) |

   **Tolkning — berggrunn og DTM (høyde) er produksjonsklare** på dette
   grunnlaget: 100 % feltvis enighet på et reelt, 103-punkts utvalg, ikke
   bare de små stikkprøvene fra steg 3. **Markfuktighet ser bedre ut enn
   den lille stikkprøven i steg 3 fryktet** (99 %/95 % her mot 50–92 % i
   et utvalg på 6–12 punkt) — trolig var det tidlige utvalget uheldig
   (traff tilfeldigvis flere av de spredte dekningshullene), eller
   Nannestad spesifikt har bedre dekning enn landsgjennomsnittet; begge
   er mulige, ikke skilt fra hverandre her. **`treslag` (82 %) bekrefter
   steg 2/3s antakelse** (67–84 % i mindre utvalg) — nå et mer robust
   tall å planlegge rundt. **`skogalder` (66 %)**, undersøkt videre
   2026-08-19 (samme dag, på brukerens forespørsel — se under).

   **`skogalder`-oppfølging (2026-08-19): den opprinnelige
   bøttegrense-hypotesen var FEIL, testet og motbevist, ikke bare antatt
   forkastet.** Hentet RÅ alder (ikke bare bøtte-navn) for alle 103
   punkt fra begge kilder (`srtrealder` live vs. `SRRTREALDER` lokalt) og
   sammenlignet tallene direkte:
   - Ekskludert de 2 punktene som ble reklassifisert til `apen` av
     AR5-porten (ikke en alders-uenighet i det hele tatt, se steg 5/6) —
     rendyrket skog-mot-skog-sammenligning: **68/96 = 71 % bøtte-match**
     (litt bedre enn det opprinnelige 66 %-tallet, som inkluderte disse
     2 urelaterte punktene).
   - **Gjennomsnittlig avvik: 0,1 år, median: 0,0 år — INGEN systematisk
     forskyvning i noen retning** (48 av 98 punkt har raster eldre enn
     vektor, 48 har raster yngre — perfekt symmetrisk). Dette motbeviser
     direkte den opprinnelige "systematisk forskjøvet nær
     bøttegrensene"-hypotesen — det er ikke en liten, retningsbestemt
     forskyvning som bøttegrense-justering kunne fikset.
   - I stedet: **ekte, symmetrisk HØY-VARIANS uenighet**. 44/96 (46 %)
     er innenfor 10 år (fin presisjon), men 11/96 (11 %) har et avvik på
     40+ år — for eksempel ett punkt der live sa 13 år (nylig
     hogd/plantet, `hogstÅr=2024`) og raster sa 127 år (gammelskog) for
     nøyaktig samme koordinat.
   - Fulgt opp med `hogstÅr` for de 7 største avvikene (≥40 år): kun 2 av
     7 hadde et nylig `hogstÅr` (2024) i live-svaret — nylig hogst
     forklarer altså NOEN, men ikke de fleste, av de største avvikene.
     Mest sannsynlige forklaring, i tråd med NIBIOs egen
     produktbeskrivelse (SR16V generaliserer pikselkartet til større,
     "relativt homogene" bestandspolygoner): en vektor-polygon kan i
     praksis IKKE være aldersmessig homogen (f.eks. et nylig hogd felt
     rett ved eldre skog, generalisert inn i samme polygon fordi
     treslaget er likt) — da vil ETT punkt inni polygonen kunne treffe
     en alder som avviker kraftig fra polygonets ene rapporterte
     gjennomsnitts-/dominansverdi, mens rasteret ser det faktiske,
     lokale pikselnivået. Samme grunnleggende årsak som
     treslag-avvikene, bare med større praktisk utslag siden alder kan
     endre seg brått (hogst→0) over svært korte avstander på en måte
     treslag sjelden gjør.
   - **Konklusjon: dette er IKKE noe en bøttegrense-justering kan fikse**
     — de rå tallene selv avviker med opptil 100+ år på enkeltpunkt, ikke
     bare noen få år nær en 40- eller 80-årsgrense. `skogalder` bør
     fortsatt IKKE brukes fra lokal lesing i produksjon; en fremtidig
     retning verdt å vurdere er heller å FLAGGE lav presisjon nær
     hogstår-relaterte avvik enn å prøve å presist matche SR16V, siden
     de to kildene måler reelt forskjellige ting (polygon-generalisering
     vs. rå piksel) heller enn at én av dem har "feil" tall.

   **Anbefaling (oppdatert etter markfuktighet-fiksen under)**:
   `FUNGIFINDER_LOCAL_BERGGRUNN`, `FUNGIFINDER_LOCAL_DTM` OG (etter
   fall-tilbake-fiksen) `FUNGIFINDER_LOCAL_MARKFUKTIGHET` er alle klare
   for en vurdert produksjonsuttesting på dette grunnlaget.
   `FUNGIFINDER_LOCAL_SR16` og `FUNGIFINDER_AR5_GATE` bør IKKE slås på i
   produksjon ennå — treslag/skogalder-usikkerheten og
   gate-churn-raten er reelle, kvantifiserte, men uløste avvik, ikke bare
   teoretiske bekymringer lenger.

   **Berggrunn+DTM slått PÅ i produksjon 2026-08-19, samme dag**
   (eksplisitt godkjent av brukeren — redigeringen ble først blokkert av
   Claude Codes tillatelses-klassifiserer som en konsekvensfull
   produksjonsendring, spurte, fikk et klart ja):
   - `fetch-area.yml`: `localBerggrunn`/`localDtm` sin standardverdi
     endret `false`→`true` (fortsatt overstyrbar per manuell kjøring for
     feilsøking/sammenligning mot live).
   - `refresh-areas.yml` (ukentlig cron, alle tidligere hentede områder
     nasjonalt) og `enrich-point.yml` (brukerregistrerte funn):
     `FUNGIFINDER_LOCAL_BERGGRUNN=1`/`FUNGIFINDER_LOCAL_DTM=1` hardkodet i
     env-blokken — ingen input å overstyre med her, i motsetning til
     fetch-area.yml.
   - SR16/markfuktighet/AR5-porten er BEVISST fortsatt AV overalt i
     produksjon.
   - Verifisert i ekte CI at selve DEFAULT-verdien faktisk slår inn (ikke
     bare når flagget sendes eksplisitt): en [kjøring uten noen
     `local*`-input i det hele tatt](https://github.com/runelov/fungifinder-db/actions/runs/32263059940) viste likevel
     `FUNGIFINDER_LOCAL_BERGGRUNN: 1`/`FUNGIFINDER_LOCAL_DTM: 1` i loggen,
     cache-treff, korrekt indeksering og `berggrunn: 1 ok`.
   - `refresh-areas.yml` sin ukentlige mandagskjøring ikke fremtvunget
     manuelt for å teste dette — den plukker opp endringen av seg selv
     ved neste ordinære kjøring, i tråd med normal drift, i stedet for et
     ekstra nasjonalt sveip kun for verifikasjonens skyld.

   **Markfuktighet-dekningshullet LØST samme dag, ikke bare bekreftet**
   (brukeren ba om regional oppfølging → funnet 77 % dekningshull i Vågå
   → implementert og verifisert en fiks, alt i samme økt): la til et
   fall-tilbake-til-live i `fetch_markfuktighet()` selv (kun når lokalt
   oppslag gir `"ukjent"` — se koden/kommentaren der for full
   begrunnelse). Kjørt Vågå-sveipet på nytt med fiksen:
   - `markfuktighet: 246 ok / 190 feil av 436` — de 190 lokale
     nodata-tilfellene falt korrekt tilbake til live og fikk likevel en
     reell verdi (ok-tallet dekker ALLE 246 aksepterte punkt, ikke bare
     de 56 rasteret i utgangspunktet hadde data for).
   - Punkt-for-punkt mot samme live-baseline: **0/246 fortsatt
     "ukjent"**, **100 % kategori-match, 100 % (245/246) klasse-match**.
   - Uventet bonus: **655,6s totalt, RASKERE enn både den rene
     live-baselinen (727,9s) OG det opprinnelige (utette) lokale forsøket
     (701,6s)** — selv i denne verst-tenkelige fjellkommunen betaler
     flertallet av punktene aldri fallback-kostnaden, siden Vågå (som de
     fleste norske kommuner) fortsatt har en god del lavereliggende areal
     mellom fjellpartiene.
   - `FUNGIFINDER_LOCAL_MARKFUKTIGHET` er etter dette i praksis like
     produksjonsklar som berggrunn/DTM — anbefalingen over ("bør
     bekreftes på ett utvalg til") er dermed innfridd, med et enda
     sterkere resultat enn Nannestad-testen alene ga grunnlag for.

   **Markfuktighet slått PÅ i produksjon 2026-08-19, samme dag**
   (eksplisitt godkjent av brukeren, "Ja, slå på" — samme mønster som
   berggrunn/DTM):
   - `fetch-area.yml`: `localMarkfuktighet` sin standardverdi endret
     `false`→`true`.
   - `refresh-areas.yml` og `enrich-point.yml`:
     `FUNGIFINDER_LOCAL_MARKFUKTIGHET=1` hardkodet i env-blokken. Merk:
     ulikt `FUNGIFINDER_LOCAL_DTM` (som er et no-op i
     `enrich-point.yml`s modus) brukes markfuktighet FAKTISK der —
     `enrich_single_point_in_personal()` kaller `fetch_markfuktighet()`.
   - SR16/AR5-porten fortsatt AV som standard overalt.
   - Verifisert i ekte CI at [en kjøring uten noen `local*`-input i det
     hele tatt](https://github.com/runelov/fungifinder-db/actions/runs/32267664729) satte alle tre
     (`FUNGIFINDER_LOCAL_BERGGRUNN`/`_DTM`/`_MARKFUKTIGHET`) til `1` og
     ga `markfuktighet: 1 ok`, `berggrunn: 1 ok`.
   - **Alle tre klare, testede lokale faktorer (berggrunn, DTM,
     markfuktighet) er dermed nå PÅ som standard i hele produksjons-
     pipelinen** — kun SR16 og AR5-porten gjenstår AV, med kjente,
     kvantifiserte, uløste avvik dokumentert over.

## Ytelse utenom Del 3: batchet høyde-/terrengport (2026-08-19)

Brukeren spurte om tre ting etter å ha lest en sveip-logg: (1) om "20"-en
i fremdriftsutskriften ("behandlet 420/589 punkter …") var et gjennomtenkt
batch-tall, (2) om datahenting kan optimaliseres mer generelt (mange kall
med "like" resultater), (3) om ulike datakilder på sikt bør ha ulik
oppfriskingsfrekvens.

**Svar 1**: `% 20` er REN fremdrifts-utskrift (`if (i+1) % 20 == 0: print(...)`),
ikke en batch-størrelse — ingen kostnad tilknyttet tallet i det hele
tatt. Ingen endring nødvendig.

**Svar 2 — utforsket videre og implementert**: selve høyde-/terreng-PORTEN
(`fetch_elevation_point()`, kalt av HVERT kandidatpunkt uansett utfall)
var det ene stedet som fortsatt gjorde ett live-kall per punkt til tross
for at et fungerende batch-endepunkt allerede fantes i kodebasen (brukt
for helning/himmelretning). Verifisert live: Kartverkets batch-API tåler
maks 50 koordinater per kall ("Man kan sende inn maksimum 50
koordinater, minimum 1" — 422 ved flere). `enrich_point()` fikk en ny
`precomputed_elev_info`-parameter (kun brukt i AR5_GATE_ENABLED sin
AV-gren, dagens produksjonssti — SAMME datakilde/API, bare batchet, så
ingen feature-flag/paritetstest var nødvendig ulikt Del 3s faktorer).
`main()` sitt hovedsveip forhåndsfiltrerer mot kjente D1-steder (billig,
lokalt) og batcher resten i grupper av 50 før selve punkt-for-punkt-
løkken. Verifisert bit-identisk resultat (elevation/terrain/aksept/
avvisning) mot enkeltkall, lokalt og i ekte CI (samme Nannestad-sveip,
149 punkt, 110 godkjent — uendret fra alle tidligere kjøringer).

Resultat: **149 punkt sjekket på 172,9s** (3 batch-kall for porten i
stedet for 149 enkeltkall) — ned fra 199,6s (Del 3-faktorene alene) og
316,0s (opprinnelig, før noe av dagens arbeid) for SAMME sveip. Cirka
**45 % raskere enn utgangspunktet** samlet sett. Fant også og rettet en
liten regresjon underveis: `fetch_elevation_points_batch()` oppdaterer
ikke `STATS` selv (delt med `compute_slope_aspect()`s nabo-batch, som
aldri har blitt talt der) — lagt tilbake i selve batch-løkken i `main()`
i stedet, samme regel som enkelt-kallet brukte.

**Svar 3 — delvis allerede løst, resten en fremtidig retning**:
`REFRESH_INTERVALS_DAYS` styrer allerede `--refresh-existing`-stien
(`hogstaar: 180` dager, `osm_infra: 60` dager), bevisst UTEN Artskart
(kontinuerlig). Del 3s nye lokale faktorer (berggrunn/DTM) bruker
GitHub Actions-cache med en MANUELT bumpet versjonsnøkkel
(`berggrunn-n1350-v1`/`dtm10-tiles-v1`) — allerede riktig matchet mot
hvor sjelden disse kildene faktisk endres (berggrunn: praktisk talt
aldri, DTM: kun ved en ny nasjonal høydemodell), men er en MANUELL
prosess uten noe automatisk varsel om at NGU/Kartverket har gitt ut en
ny utgave. En fremtidig, ikke bygget retning: en liten
"friskhets-registrering" — én linje per datakilde med kjent
oppdateringstakt + nåværende oppfriskingsmekanisme — pluss en periodisk
sjekk mot kildenes egne `oppdateringsdato`/`datauttaks`-felt for å
automatisk oppdage når en versjon faktisk BØR bumpes, i stedet for å
stole på at noen husker det.

## Nasjonalt sveip: revidert tidsestimat (2026-08-19)

Etter dagens arbeid (Del 3-faktorene i produksjon + batchet høydeport)
ba brukeren om en fylkesskala-validering av det opprinnelige
Del 4-anslaget (11,6–24,2 dager for et fullt sekvensielt nasjonalt
sveip, se Del 3-scoping over) — for å bekrefte at forbedringene faktisk
holder ved reell skala, ikke bare på 149–589-punkts kommune-sveip.

**Kjørt: `--mode fylke --value Akershus`, dry-run** — desidert største
sveip testet så langt denne økten:
- 5590 rå rutenett-kandidater → 2742 innenfor fylkesgrensen (49 %
  overlevelse, samme størrelsesorden som Nannestad 59 % og Vågå 37 %).
- Batchet høydeport: 2420 kandidater i 49 batch-kall (322 forhåndsfiltrert
  som duplikat av kjente D1-steder — Akershus/Nannestad har mye
  eksisterende dekning fra all testingen i dag).
- Markfuktighet-fallbacken holdt ved skala: 397/1492 (27 %) aksepterte
  punkt trengte live-fallback, ALLE fikk likevel en reell verdi (0 endte
  som "ukjent") — bekrefter Vågå-fiksen fungerer for en hel fylke, ikke
  bare ett kommune-utvalg.
- **2742 punkt sjekket på 2322,3s = 0,85s/punkt** — raskere enn selv
  Nannestad/Vågås 1,16–1,26s/punkt, trolig pga. varme
  SR16/berggrunn-cacher fra dagens tidligere kjøringer.

**Revidert nasjonalt estimat** (Norges fastlandsareal ~385 000 km²,
gridKm=1,5 → 171 111 rå kandidater; overlevelsesrate snitt 48,3 % fra de
tre reelle testene → ~82 700 reelle kandidater nasjonalt):

| Scenario | Rate | Estimert tid |
|---|---|---|
| Optimistisk (varme cacher, som Akershus) | 0,85 s/punkt | **~19,5 timer** |
| Realistisk (kalde cacher, ny fylke hver gang) | 1,2 s/punkt | **~27,6 timer** |

Ned fra **11,6–24,2 dager** i det opprinnelige anslaget — grovt **10–13x
raskere**, og bekreftet med ekte tall ved fylkesskala, ikke bare
ekstrapolert fra små kommune-utvalg.

**Fortsatt for langt for ÉN GitHub Actions-jobb** — GitHub-hostede
runnere har et hardt 6-timers jobbtak som ikke kan økes, uansett hvor
raskt selve sveipet er blitt. Et fullt sekvensielt nasjonalt sveip i
allerede eksisterende `--mode fylke`-form MÅ derfor deles opp — men
dette er allerede løst arkitektonisk: 15 separate `fetch-area.yml
--mode fylke`-kjøringer (én per fylke), som API-et allerede støtter
uendret. Basert på Akershus (2742 kandidater, 39 min) og at nasjonale
kandidater fordeler seg over 15 fylker (~5500 i snitt, opptil et par
ganger så mange for de største som Innlandet/Nordland/Trøndelag) vil
selv den STØRSTE enkeltfylken trolig holde seg godt under 6-timers-
taket. Kjørt i PARALLELL (GitHub Actions tillater mange samtidige
workflow-kjøringer på samme repo) ville total klokketid for et fullt
nasjonalt sveip trolig lande på et par-tre timer — styrt av den
tregeste enkeltfylken, ikke summen av alle 15.

**Ikke gjort**: selve det nasjonale sveipet (dette er kun et revidert
tidsestimat + arkitekturbekreftelse, ikke en utført nasjonal kjøring —
en ekte nasjonal produksjonskjøring er en egen, mye større beslutning
som fortjener en egen samtale før den eventuelt startes, ikke noe å
gli inn i som et "neste steg").

## Oppsummering: Del 3 + ytelsesarbeid, 2026-08-19

Én lang økt, fra "kjør steg 6" til et validert, produksjonsklart, ~10x
raskere nasjonalt sveip-estimat. Detaljene ligger dated gjennom hele
Del 3-seksjonen og de to påfølgende seksjonene over — dette er kun et
overordnet kart for en fremtidig leser (eller økt) som ikke vil lese alt.

**Hva som faktisk kjører i produksjon nå** (alle tre PÅ som standard i
`fetch-area.yml`/`refresh-areas.yml`/`enrich-point.yml`):
- `FUNGIFINDER_LOCAL_BERGGRUNN` — NGU Berggrunn N1350, 100 % feltvis
  enighet mot live (n=103, kommune-skala).
- `FUNGIFINDER_LOCAL_DTM` — Kartverket DTM10, 254 fliser, 100 % enighet
  på høyde (samme utvalg).
- `FUNGIFINDER_LOCAL_MARKFUKTIGHET` — landsdekkende raster med
  fall-tilbake til live ved lokal nodata, 100 % dekning og 99,6 %
  eksakt-klasse-enighet, validert på BÅDE en lavlandskommune
  (Nannestad) og en fjellkommune (Vågå) OG en hel fylke (Akershus, 27 %
  fallback-rate der).
- Ny batchet høyde-/terrengport (ikke et Del 3-flagg — samme datakilde,
  bare batchet 50 om gangen i stedet for ett kall per punkt).

**Hva som er BYGGET og CI-verifisert, men BEVISST fortsatt AV**:
- `FUNGIFINDER_LOCAL_SR16` — treslag 82 % enighet, skogalder 66→71 %
  (undersøkt: ekte SR16V/SR16R-generaliseringsuenighet, IKKE en
  bøttegrense-feil — se skogalder-oppfølgingen). `hogstÅr` alltid
  `None` lokalt (ingen rasterlags-motstykke).
- `FUNGIFINDER_AR5_GATE` — ~6 % av kandidater får ulik aksept/avvisning
  mot dagens Kartverk-baserte port. Målt (ikke antatt): AR5 er IKKE
  raskere per kall enn Kartverket (147ms vs 130ms) — gevinsten er
  smalere enn opprinnelig antatt (fjerner kun dobbeltkallet for
  åpen-mark-kandidater + muliggjør null Kartverk-kall i kombinasjon med
  lokal DTM), ikke en generell hastighetsgevinst alene.

Ingen av disse to er "kodefeil å fikse" — begge er ekte uenighet mellom
to legitimt forskjellige datakilder (generalisert vektor vs. rå
piksel/klassifisering), IKKE noe videre koding trolig løser. Verdt å
revidere kun om et NYTT datagrunnlag dukker opp, ikke ved å presse mer
på dagens tilnærming.

**Tallene som faktisk endret seg** (samme 149-punkts Nannestad-sveip
brukt gjennom hele økten, for sammenlignbarhet):
316,0s (utgangspunkt) → 199,6s (Del 3-faktorene, etter en reell
SR16-fylkesoppslag-treghetsbug funnet+rettet underveis) → 172,9s
(+ batchet høydeport). Skalert opp til en hel fylke (Akershus, 2742
punkt): 0,85s/punkt — konsistent, ikke bare et lite-utvalg-artefakt.
Nasjonalt revidert estimat: **~19,5–27,6 timer sekvensielt**, ned fra
**11,6–24,2 dager** i det opprinnelige Del 4-anslaget.

**Tre reelle bugs funnet og rettet underveis** (verdt å huske MØNSTERET,
ikke bare fikset-listen — alle tre ble funnet FORDI noe ble testet ved
reell skala/reelle data, ikke ved kode-gjennomlesning):
1. Oslo (fylke `"03"`) sine SR16-zip-interne filnavn dropper den
   ledende nullen — funnet ved å faktisk liste zip-innholdet.
2. `reverse_geocode()`s ~1 km-cache var for finmasket for SR16s
   fylkesoppslag ved `gridKm>1km` — ga ~100 unødvendige
   Nominatim-kall/sleep i én kommune-sveip, funnet ved å faktisk
   TIDMÅLE en full kommune-kjøring, ikke anta at "lokalt = raskt".
3. Markfuktighet-rasterets dekningshull (77 % i Vågå) — funnet ved å
   bevisst velge en GEOGRAFISK ANNERLEDES testkommune enn den første,
   ikke ved å stole på ett godt resultat.

**Anbefalte neste steg, i prioritert rekkefølge**:
1. **Nasjonalt sveip — krever en egen, eksplisitt beslutningssamtale
   FØR oppstart**, ikke noe å gli inn i. Planen er klar (15
   `--mode fylke`-kjøringer, ~~kjørbare parallelt, trolig 2–3 timers
   klokketid totalt~~ se "QA av ETL/datalagring før nasjonalt sveip"
   under — ren parallell kjøring hadde en reell datatap-bug, nå rettet,
   men bølge-inndeling ved grensedelende fylker gjenstår som anbefaling)
   og tallgrunnlaget er nå fylkesskala-validert — men selve utførelsen
   skriver ekte data til produksjons-D1 for HELE landet, en ordre av
   magnitude større handling enn noe annet gjort i denne økten.
2. **Frisk hets-registrering** (bruker sitt spørsmål 3, ikke bygget):
   én linje per datakilde med kjent oppdateringstakt + nåværende
   oppfriskingsmekanisme, pluss en periodisk sjekk mot kildenes egne
   `oppdateringsdato`/`datauttaks`-felt — gjør den manuelle
   versjons-bump-konvensjonen (`berggrunn-n1350-v1`/`dtm10-tiles-v1`)
   til noe som varsler av seg selv i stedet for å stole på at noen
   husker det.
3. SR16/AR5-porten: IKKE en aktiv oppgave — begge er reelt begrenset av
   datagrunnlaget, ikke av implementasjonen. La stå AV til en eventuell
   fremtidig anledning gir grunn til å se på dem igjen.

## QA av ETL/datalagring før nasjonalt sveip (2026-08-20)

Bruker ba eksplisitt om en detaljert QA FØR det nasjonale sveipet
(punkt 1 over) settes i gang, for å unngå å måtte kjøre det på nytt pga.
en oppdaget mangel/bug. Gjennomgang av faktisk kode (`fetch_area.py`,
`etlImport.js`, D1-skjemaet, `fetch-area.yml`), ikke bare denne planen.

**🔴 Kritisk funn, RETTET samme dag (D1-migrasjon 0005)**: `fetched_areas`
ble skrevet med `mode=replace_all` — `DELETE FROM fetched_areas` + insert
alt på nytt, basert på en snapshot lest ved HVER kjørings oppstart (se
`main()`/`refresh_existing_locations()`). Trygt for ÉN kjøring om gangen
(alt dette var noensinne testet under), men et lost-update-race så snart
flere kjøringer skriver samtidig: med 15 parallelle `--mode fylke`-jobber
leser alle 15 samme startsnapshot FØR noen av dem har skrevet, og siste
jobb som fullfører sin `replace_all` overskriver STILLE alle andre
jobbers rader. Beregnet konsekvens: i beste fall hadde kun 1 av 15
fylkers `fetched_areas`-rad overlevd et fullt nasjonalt sveip.
`terreng_steder` var IKKE rammet (ekte `ON CONFLICT DO UPDATE` på `id`
allerede), men `refresh-areas.yml` (ukentlig cron) leser `fetched_areas`
for å vite hvilke områder som finnes og trenger oppfriskning av
hogstår/artsfunn/OSM-infra — uten disse radene ville 14 av 15 fylker
blitt usynlige for den ukentlige jobben, permanent og uten noen
feilmelding. Ironisk nok var dette nøyaktig den klassen "les hele
tabellen, endre én rad, skriv hele tabellen tilbake"-race
`D1-MIGRASJON.md` opprinnelig ble skrevet for å fjerne (se dens
"samtidig-skriving-kollisjon"-hendelse) — denne ene tabellen beholdt den
ved et uhell, bare uten gitts høylytte push-avvisning.

**Fiks** (migrasjon `0005_fetched_areas_upsert.sql` i
`fungifinder/worker/api/migrations/`, verifisert lokalt med
`wrangler d1 migrations apply --local` inkl. en simulert
duplikat-historikk FØR migreringen og en ekte konflikt-/nyinnsettings-test
ETTERPÅ — se commit for detaljer):
- Ny `omrade_nokkel`-kolonne (deterministisk tekstnøkkel av
  mode+value+lat+lon+radiusKm, beregnet i Python — IKKE en SQL-UNIQUE
  direkte på de rå kolonnene, siden lat/lon/radiusKm er NULL for
  fylke/kommune og value er NULL for radius, og SQLite behandler
  NULL≠NULL i UNIQUE-indekser).
- Migrasjonen bakoverfyller nøkkelen for eksisterende rader OG
  dedupliserer (beholder nyeste `fetched_at` per nøkkel) FØR den unike
  indeksen opprettes.
- `etlImport.js` sin `fetched_areas`-gren byttet fra
  `DELETE FROM + INSERT ALL` til `INSERT ... ON CONFLICT(omrade_nokkel)
  DO UPDATE`, samme mønster `terreng_steder` allerede brukte.
- `fetch_area.py` pusher nå kun DENNE kjøringens egen(e) rad(er), ikke
  hele `fetched_areas`-lista, fra begge kallstedene
  (`main()`/`refresh_existing_locations()`).

**🔴 Kritisk, IKKE rettet — krever en prosessendring, ikke kode**:
duplikat-/hull-risiko nær fylkesgrenser. `enrich_point()`s dedup
(`< 150 m fra eksisterende sted`) sjekkes kun mot det `fetch_from_d1()`
leste ved DENNE kjøringens start — to naboer (f.eks. Østfold/Akershus)
som kjører samtidig ser aldri hverandres punkter før begge har
committet. Grid-punktene fra hver fylke sin egen bbox kolliderer sjelden
på eksakt `id`, men kan lande 50–140 m fra hverandre langs delelinjen —
nære nok til å være reelle duplikater, usynlige for hverandre på
hentetidspunktet. Ingen krasj, kun doble/tette markører (og lett skjev
"kjente funn"-tetthet) langs samtlige fylkesgrenser i Norge.
**Anbefaling, ikke implementert**: kjør sveipet i 2–3 bølger der ingen
to samtidig kjørende fylker deler grense (Norges fylkesgraf er lett
fargeleggbar med 3 farger) — beholder mesteparten av
parallelliseringsgevinsten uten dette racet.

**🟡 Moderate funn, ikke handlingskrevende ennå**:
- `artskart-sync-state.json`-git-committen kan kollidere hvis flere
  fylker synkes for FØRSTE gang samtidig (nye dict-nøkler kan treffe
  samme tekstlinje) — feiler HØYLYTT (`git push` avvist, jobben
  `exit 1` etter 5 rebase-forsøk), ikke stille datatap. Koster i verste
  fall en full re-synk av det fylkets Artskart-cursor neste gang.
  Selvhelbredende, tatt til etterretning, ikke fikset.
- 15 samtidige store bbox-spørringer mot samme delte, offentlige
  `overpass-api.de`-instans er en kjent måte å bli rate-limitet på.
  Retry/backoff finnes (3 forsøk), men ingen koordinering på tvers av
  jobber. Ved samtidig rate-limiting for flere fylker: de faller
  tilbake til "ukjent" vei/parkering/stier/befolkning for hele fylket —
  nå (etter fiksen over) korrekt synlig for `refresh-areas.yml` å prøve
  på nytt neste uke, siden `osmInfraRefreshedAt=None` fortsatt skrives
  riktig til den nye, trygge `fetched_areas`-raden.
- Ingen `concurrency:`-gruppe er satt i `fetch-area.yml` —
  GitHub Actions kjører alle 15 dispatchene helt ukoordinert. Ingenting
  hindrer at grensetilfellet over faktisk inntreffer.
- Ingenting i Del 3 er testet under FAKTISK parallell/flerprosess-
  kjøring mot delt D1 — alt (Nannestad/Vågå/Akershus) var sekvensiell,
  én-prosess-testing. Selve mekanismen sveipet er avhengig av (15
  samtidige skrivere) var før denne QA-en ren antakelse.

**Anbefalt rekkefølge videre**: kjør en liten, ekte
to-parallell-jobb-test (to naboer, liten radius eller to små
kommuner/fylker) og verifiser at BEGGE resultatene faktisk overlever i
D1 etterpå (`terreng_steder` OG `fetched_areas`) — billig, empirisk
bekreftelse av selve fiksen under ekte parallellitet, ikke bare i
teorien — FØR det fulle 15-bølge/15-parallelle sveipet, og bølge-del
grensedelende fylker som beskrevet over.

## Nasjonalt sveip — status og fremdrift (2026-08-20/21)

### Fiksen verifisert i produksjon
`fetched_areas`-racet over ble rettet (D1-migrasjon
`0005_fetched_areas_upsert.sql`, `fungifinder@6f6a80b` +
`fungifinder-db@5398498`) og deretter faktisk bevist under ekte
parallellitet, ikke bare lokalt: to reelt overlappende
`--mode radius`-testkjøringer (43 sekunder fra hverandre) mot
produksjons-D1 — begge `fetched_areas`-radene overlevde intakt.
Testradene er fjernet igjen etterpå.

### Budsjettbegrensning oppdaget: GitHub Free, 2000 min/mnd
Bruker har GitHub Free (2000 Actions-minutter/måned). Nøkkelinnsikt:
**Actions fakturerer totalt kompute-minutter, ikke klokketid** —
parallellisering (den opprinnelige "15 parallelle kjøringer"-planen)
sparer INGEN minutter, kun kalendertid. Sekvensiell kjøring er derfor
riktig valg uansett, og løser samtidig grense-dedup-risikoen over som
bonus (ingen samtidighet = ingen race). **Taket er dessuten PER KONTO,
ikke per repo** — deles av `fungifinder-db` og alle andre private
repoer på samme GitHub-konto (`bondoya-db`, `mycrate-db`, evt. `fpl`).

Sveipet ble derfor delt i 3 sekvensielle fylkesbolker à ~1/3 av
landarealet (areal er en grov proxy, ikke en autoritativ kilde):

| Bolk | Fylker | Areal (grovt) |
|---|---|---|
| **A** | Oslo, Østfold, Akershus, Vestfold, Buskerud, Telemark, Agder, Rogaland, Vestland | ~101 500 km² |
| **B** | Møre og Romsdal, Trøndelag, Innlandet | ~109 500 km² |
| **C** | Nordland, Troms, Finnmark | ~112 700 km² |

### Fremdrift

**Troms kjørt som kalibrering FØR bolkene** (ekte, ikke dry-run —
teller som reell fremgang): [kjøring 32366719396](https://github.com/runelov/fungifinder-db/actions/runs/32366719396),
18 341 punkter, 25,0 % godkjent → 4 594 nye steder, **0,508 s/punkt**
(40 % raskere enn Akershus), ~156 min. **Troms er ferdig — utgår fra
Bolk C.**

**Bolk A, 7 av 9 fylker fullført OK** (sekvensielt, én `gh workflow run`
om gangen):

| Fylke | Punkter sjekket | s/punkt | Godkjent | Varighet |
|---|---|---|---|---|
| Oslo | 210 | 0,290 | 7 (3,3 %) | 61,0 s |
| Vestfold | 1 788 | 0,525 | 634 (35,5 %) | 938,2 s |
| Østfold | 2 166 | 0,746 | 1 058 (48,8 %) | 1 616,8 s |
| Akershus | 2 742 | 0,909 | 1 492 (54,4 %) | 2 492,0 s |
| Rogaland | 7 347 | 0,576 | 2 530 (34,4 %) | 4 232,1 s |
| Buskerud | 6 533 | 1,110 | 4 005 (61,3 %) | 7 251,6 s |
| Telemark | 7 171 | 0,951 | 4 751 (66,3 %) | 6 817,2 s |

Sum enrichment disse 7: ~390 min. Pluss Troms (~156 min) og to små
kalibrerings-testkjøringer ≈ 550-560 min `fungifinder-db`-eget forbruk
denne måneden, før Agder/Vestland.

**Agder feilet TO ganger på rad** ([kjøring 32440980117](https://github.com/runelov/fungifinder-db/actions/runs/32440980117),
inkl. `gh run rerun`) — begge ganger `steps: []`, `runner_id: 0`, jobben
"fullført" på under 2 sekunder, ALDRI tildelt en runner. Ikke en
kodefeil (ingen linje i `fetch_area.py` kan kjøre så raskt) —
**bekreftet av bruker: kontoen nådde faktisk 2000 min/mnd-taket.**
`Vestland` (siste, dyreste fylken i bolken) ble bevisst ikke forsøkt.

**PAUSET til september (ny faktureringsperiode)**. Gjenstår av Bolk A:
1. **Agder** — `--mode fylke --value Agder --gridKm 1.5 --dryRun false`
   (aldri reelt fullført pga. tomt budsjett — trygt å bare kjøre på
   nytt, ikke en feil i selve Agder-hentingen).
2. **Vestland** — `--mode fylke --value Vestland --gridKm 1.5 --dryRun false`
   (aldri forsøkt).

Deretter er Bolk A komplett (9/9). **Før Bolk B vurderes**: mål ekte
minuttforbruk (GitHub Settings → Billing and plans → Actions), og vent
minst én uke for å se hva `refresh-areas.yml` (ukentlig cron) faktisk
koster med Bolk A sine nye, fylkesstore `fetched_areas`-rader — en
foreløpig helt umålt, vedvarende kostnad. Bolk B/C skal IKKE startes i
samme budsjettvindu som resten av Bolk A uten først å se an dette.

### Admin-panelet for on-demand områdehenting fjernet fra appen (2026-08-21)

Bruker påpekte at admin, etter overgangen til fylkesvise sveip via
`gh workflow run`, verken trenger å trigge kommune/radius-hentinger
lenger, eller å gjøre det per fylke fra selve webappen — ba om at
funksjonaliteten fjernes fra appen for å forenkle den, samt at
"Om dataene"-teksten oppdateres til å reflektere fylkesvis henting.

**Shippet, v0.28.15** (`fungifinder@1f455d3`), live i produksjon
(frontend på `fungifinder.no` + Worker på `api.fungifinder.no`,
begge verifisert etter deploy):
- Fjernet `#sp-fetch-panel` (rutenett-slider, arealestimat, "Hent
  data"-knapp, fremdriftspolling) fra `index.html`/`js/app.js`, og de
  tilhørende klient-metodene i `js/api-client.js`.
- Fjernet selve Worker-endepunktene `GET /omrader/dekning`,
  `POST /omrader/hent`, `GET /omrader/status`
  (`worker/api/src/routes/omrader.js` + `index.js`) — verifisert trygt
  først: `berikPunkt()`/`punktStatus()` (ikke-admin, del av "registrer
  eget funn") deler fil men er en separat feature, UENDRET.
  `hentFetchedAreasFraDb()` (`lib/terrengDb.js`) er UENDRET — fortsatt
  aktivt brukt av `routes/etlImport.js` sin `eksporterTerrengdata()`,
  som `fetch_area.py` sin `fetch_from_d1()` leser fra ved HVER
  ETL-kjøring (inkl. hele Bolk A over).
- Uendret, bevisst IKKE fjernet: fylke/kommune/radius-**velgeren** over
  kartet og "Foreslå områder"-panelet — generelle, ikke-admin-only
  funksjoner for å utforske allerede hentet data, ikke det samme som
  den fjernede admin-trigger-knappen.
- "Om dataene" oppdatert: "hentes per kommune av administrator" →
  "hentes fylkesvis og dekker etter hvert hele Norge".

**Praktisk konsekvens**: `gh workflow run` (se kommandoene i Bolk
A-seksjonen over) er nå DEN ENESTE veien til å hente nye områder —
ikke lenger et alternativ blant flere. Ingen `--mode kommune`/`--mode
radius`-bruk er planlagt fremover; alt gjenstående (Bolk A-resten,
B, C) er `--mode fylke`.
