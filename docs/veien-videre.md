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
