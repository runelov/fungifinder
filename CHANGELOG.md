# Endringslogg

## 0.29.2 — Hurtigfiks: reverter render()/mapFittedOnce-endring fra 0.29.0
Bruker (admin, logget inn) meldte at INGEN steder lenger ble listet — hverken
default, ved zoom i kart, eller ved kommune-valg — og at "Foreslå områder"
alltid var grået ut. Kun i standalone-PWA på mobil (hjemskjerm-installert),
ikke i nettleser (heller ikke mobilnettleser) — og vedvarte etter å slette og
legge til PWA-en på nytt (utelukker gammel/feil localStorage som årsak).
Brukeren var sikker på at dette virket før 0.29.0 sin
getSize()-vakt/render()-retrigger (se CHANGELOG 0.29.0, "Kartets
standardutsnitt").

Kunne ikke reprodusere standalone-modus i utviklingsmiljøet (ingen
tilgjengelig iOS-simulator), og rotårsaken er derfor IKKE bekreftet ned til
eksakt linje. Reverterer likevel de to nyeste, minst utprøvde bitene av
0.29.0-kartfiksen som en rask, lav-risiko utbedring, i påvente av videre
feilsøking (Safari Web Inspector-konsoll fra faktisk enhet ville gitt et
konkret svar):

- `renderMap()` sin `mapFittedOnce`-vakt er tilbake til det ubetingede
  `if (!mapFittedOnce && scoredAll.length)` fra før 0.29.0 — fjernet
  `leafletMap.getSize().x > 0 && leafletMap.getSize().y > 0`-sjekken.
- `setMobileView('kart')` sin ekstra `render()`-retrigger (kalt fra samme
  `setTimeout` som `invalidateSize()`) er fjernet.

`initMap()` sin `fitBounds(NORGE_STARTVISNING)`-vs-`setView()`-fallback
(uendret siden 0.29.0) er IKKE reversert — den rører ikke `mapFittedOnce`
eller `render()`, og er uavhengig verifisert å virke for både demo- og
innlogget visning i dette miljøet.

## 0.29.1 — Fiks admin → Brukere: permanent slettet bruker så ut som vanlig deaktivert
Bruker (admin) meldte at en permanent slettet bruker ("Mette —
slettet-4@slettet.invalid") ikke forsvant fra Brukere-fanen. Delvis
bevisst — Statistikk-fanen viser dem allerede med hensikt (se
`hentStatistikk()` i `worker/api/admin.js`: scrubbing beholder
`bruker_data`-raden, så tallene ville vært misvisende lave uten dem) —
men Brukere-fanen manglet samme markering og viste fortsatt fungerende
⏸/▶- og ✕-knapper for en rad som backendens egne vakter uansett
avviser (raden er scrubbet, ikke fjernet, se `slettBrukerPermanent()`).
`status` er `'deaktivert'` for BÅDE en vanlig pauset bruker og en
permanent slettet en, så de var visuelt umulige å skille fra hverandre
uten å lese e-postadressen.

- `renderAdminBrukere()` i `js/app.js` leser nå `slettet_tidspunkt`
  (var allerede med i API-svaret, bare ubrukt) og viser
  "· permanent slettet" i stedet for "· deaktivert", og skjuler begge
  handlingsknappene for slike rader — ingenting igjen å slå av/på eller
  slette.

## 0.29.0 — Redesign: landingssekvens, kartutsnitt, demo-tekst og trykkflater
Implementerer redesignforslaget fra designkritikken 2026-08-21 (godkjent
samme dag). Fem endringer, alle innenfor eksisterende visuell profil — ingen
nye farger/skrifter.

- **Kortere landingssekvens**: sikkerhetsvarselet (`sp-safety`) er nå lukket
  by default (var alltid utfoldet) — sammendragslinjen bærer nå selve
  budskapet ("⚠ Appen bestemmer ikke arter — les før du spiser") i stedet
  for en generisk tittel, så innholdet leses uten å måtte utvide. "Legg til
  på hjemskjermen" er konvertert fra et alltid-synlig kort til samme
  sammenleggbare mønster (`<details>`). "Om dataene" er flyttet fra toppen
  av siden til bunnen (etter resultatlisten) — den er referansestoff, ikke
  en forutsetning for å komme i gang. Artsvelgeren er dermed synlig langt
  tidligere på mobil.
- **Kartets standardutsnitt**: `initMap()` brukte et fast `setView(senter,
  zoom)` tuftet på et bredt skjermformat — viste for det meste tomt/grått
  på en smal, høy mobil-kartcontainer. Byttet til `fitBounds()` mot en ny
  `NORGE_STARTVISNING`-konstant. Fant samtidig en dypere rotårsak for
  hvorfor det faktiske utsnittet kunne bli varig feil: kartpanelet er
  `display:none` på mobil (default "Liste"-visning) til brukeren trykker
  "Kart", og et `fitBounds()`-kall mot en 0×0-container regner ut et
  meningsløst utsnitt som blir stående — kun tile-plasseringen rettes opp av
  `invalidateSize()`, ikke selve zoom/senter. `renderMap()` sin
  "fit-til-faktiske-punkter-første-gang"-logikk (`mapFittedOnce`) kunne
  dermed låse seg til et feil utsnitt før containeren noensinne ble synlig.
  Lagt til en synlighets-vakt (`leafletMap.getSize()`) som lar
  `mapFittedOnce` forbli `false` til containeren faktisk har en reell
  størrelse, og `setMobileView('kart')` kjører nå `render()` på nytt idet
  panelet blir synlig for første gang, slik at et korrekt utsnitt faktisk
  blir beregnet da.
- **Konsistente tall i demo-visning**: `minScoreFilter` (standard 70) kunne
  filtrere bort begge demo-stedene fra listen samtidig som demo-banneret
  rett over sa "Du ser 2 demo-steder" — to motstridende tellinger av samme
  punkter. Terskelen er nå slått av for ikke-innloggede (`effectiveMinScore
  = currentUser ? minScoreFilter : 0`), selve terskel-kontrollen
  (`sp-score-filter-row`) skjules i demo-visning, og banderteksten er
  omskrevet til én sammenhengende melding.
- **Trykkflater ≥44px**: økt padding på `.sp-slider-row` (preferanse-brytere,
  reell klikkflate var allerede hele raden — kun høyden manglet), `.sp-seg
  button` (Fylke/Kommune/Radius, Liste/Kart, Én art/Mine favoritter),
  `.sp-select` (matchet til samme høyde i samme filterrad) og `.sp-mini-btn`
  (Min posisjon/Fullskjerm/Vis alle/Nullstill senter). Leaflets egne
  zoom-knapper overstyrt til 44×44px.
- **Visuelt skille varsel vs. faktaboks**: `sp-safety`/`sp-a2hs` (tidsriktige
  varsler/tilbud) har nå en avrundet pilleform når lukket (`border-radius:
  999px`), tydelig forskjellig fra de firkantede referanse-/
  innstillingsboksene (`sp-notice`/`sp-preferences`, 3-4px). Gjentatt
  "(klikk for å skjule/vise)"-tekst fjernet fra alle fire — chevronen alene
  gir samme affordance.

## 0.28.17 — Fiks "Om dataene": ekskluder gamle kommune/radius-punkter fra fylkestellingen
Oppfølging av 0.28.16, samme dag. Bruker spurte om gamle kommune-/
radius-kjøringer fortsatt ligger lagret ved siden av de nye
fylke-sveip-punktene — bekreftet direkte mot produksjons-D1 at de gjør
det (12 720 gamle punkter, 19 071 fra fylke-sveip, disjunkte mengder,
ingenting overskrevet). Det avslørte en reell svakhet i 0.28.16-fiksen:
å telle ALLE punkter i fylket uansett kilde fikk fylker med KUN gammel
enkelt-kommune-testdata (Trøndelag: 1244 punkter, alle fra en gammel
Trondheim-henting, ikke fra noe fylke-sveip) til feilaktig å vises som
"analysert".

- `renderDataNotice()` filtrerer nå eksplisitt til `!loc.kommune` (kun
  `--mode fylke`-opphav — den eneste modusen som lar `kommune` stå
  usatt, se `main()` i `fetch_area.py`) FØR opptelling mot fylke-navnet.
  Gamle kommune-/radius-punkter (som ALLTID har `kommune` satt) kan
  ikke lenger gjøre et reelt useveipet fylke synlig som ferdig.

## 0.28.16 — Fiks "Om dataene": viser fylker i stedet for kommuner
Bruker påpekte at "godt analysert"-listen kun viste et fåtall
enkeltkommuner fra Østfold/Oslo/Akershus. Reell bug, ikke bare et
visningsvalg: `--mode fylke`-kjøringer i `fetch_area.py` setter ALDRI
`kommune`-feltet per punkt (kun `fylke`, se `main()`) — hele Bolk
A-sveipet (Oslo/Vestfold/Østfold/Akershus/Rogaland/Buskerud/Telemark)
og Troms var derfor usynlige for den gamle kommune-baserte
opptellingen i `renderDataNotice()` uansett terskel, ikke bare
underrepresentert.

- `renderDataNotice()` grupperer nå på `loc.fylke` i stedet for
  `loc.kommune` — `fylke` settes for ALLE moduser (fylke/kommune/
  radius), i motsetning til `kommune` som kun settes for
  kommune/radius-modus.
- Terskelen ("godt analysert") senket kraftig, fra 100 til 1: et
  `--mode fylke`-sveip sjekker HELE fylkets rutenett i én kjøring, så
  ethvert reelt antall punkter (også et lite, som Oslo sine 7 — en
  liten, tett urban fylke med lite skog) betyr et FULLFØRT sveip, ikke
  delvis/tynn dekning slik et lavt kommune-tall kunne bety før.
  Element-id-en byttet fra `sp-analyserte-kommuner` til
  `sp-analyserte-fylker`, teksten fra "kommuner godt analysert" til
  "fylker analysert".

## 0.28.15 — Fjern admin-panelet for on-demand områdehenting
Nasjonalt sveip pågår nå i faste fylkesbolker via `gh workflow run`
direkte mot GitHub Actions (se `fungifinder-db/docs/veien-videre.md`) —
admin trenger ikke lenger trigge kommune/radius/fylke-hentinger fra selve
webappen, og forespurte at funksjonaliteten fjernes for å forenkle appen.

- Fjernet `#sp-fetch-panel` (rutenett-tetthet-glidebryter, arealestimat,
  "Hent data"-knapp, fremdriftspolling) fra `index.html`, og all
  tilhørende logikk fra `js/app.js` — `startFetch()`, `pollFetchStatus()`,
  `updateFetchPanel()`, `updateFetchEstimate()`, `checkForActiveRun()`,
  `describeRunStatus()`, `wireFetchPanel()`, `findFetchedAreaMatch()`,
  `loadFetchedAreas()`, `estimateAreaKm2()`, `fetchNudgeHtml()`/
  `wireFetchNudgeLink()` og tilhørende global tilstand
  (`fetchedAreas`/`gridKm`/`fetchInProgress`/`fetchPollTimer`).
- Fjernet klient-metodene `hentOmraderDekning()`/`startOmradeHenting()`/
  `hentOmradeStatus()` fra `js/api-client.js` (kalte kun det fjernede
  panelet), OG selve Worker-endepunktene (`GET /omrader/dekning`,
  `POST /omrader/hent`, `GET /omrader/status` — `hentDekning()`/
  `startOmradeHenting()`/`omradeStatus()` i
  `worker/api/src/routes/omrader.js`, med tilhørende ruter i
  `worker/api/src/index.js`). `berikPunkt()`/`punktStatus()` i samme fil
  (IKKE admin-only — del av "registrer eget funn") er UENDRET.
  `hentFetchedAreasFraDb()` (`worker/api/src/lib/terrengDb.js`) er også
  UENDRET — fortsatt aktivt brukt av `routes/etlImport.js` sin
  `eksporterTerrengdata()` (leses av `fetch_area.py` sin `fetch_from_d1()`).
- **Uendret, bevisst IKKE fjernet**: fylke/kommune/radius-VELGEREN over
  kartet (`#sp-mode-seg`) og "Foreslå områder"-panelet (`#sp-route-panel`)
  — begge er generelle, ikke-admin-only funksjoner for å filtrere/utforske
  allerede hentet data, et helt annet formål enn den fjernede
  admin-trigger-knappen. `updateCoverageLine()` (dekningslinjen over
  "Foreslå områder") er beholdt, men "0 kjente punkter"-meldingen
  linker ikke lenger til det fjernede panelet — sier i stedet at
  dekningen utvides gradvis fylke for fylke.
- **"Om dataene"-teksten oppdatert**: "hentes per kommune av
  administrator" → "hentes fylkesvis og dekker etter hvert hele Norge",
  siden nasjonalt sveip nå kjøres fylkesvis, ikke lenger on-demand per
  kommune. Den dynamiske "godt analyserte kommuner"-lista er uendret
  (bygget fra reell `terreng_steder`-data, ikke fra det fjernede
  admin-panelets dekningssporing).

## 0.28.14 — Gjeninnfør parasollsopp og sjampinjong (åpen-mark-data på plass)
Fjernet i v0.28.7 (2026-08-18, samme dag) fordi treslag/skogalder-
scoringsmodellen ikke kunne produsere `'apen'`-verdien disse to saprotrofe
grasmarksartene trenger. Den strukturelle forutsetningen er nå på plass
(fungifinder-db v42: åpen-mark-deteksjon via AR5, se
`docs/veien-videre.md`) — testet og bekreftet med en ekte produksjons-
kjøring for Vestby kommune samme dag (14 nye `treslag:['apen']`-punkter).

- Lagt tilbake i `SPECIES`, `SPECIES_HUE` og `BASE_MICROTIPS` i
  `js/app.js`, og i `fetch_area.py`s `SPECIES_TAXON_ID`
  (fungifinder-db) — profilene er UENDRET fra originalen. Begge hadde
  allerede `'apen'` i `treslag`/`skogalder` fra før fjerningen — det var
  aldri artsprofilene som var problemet, bare at ETL-en ikke kunne
  produsere dataen de trengte.
- Merk: eksisterende terreng_steder (fra før dagens AR5-endring) har
  ingen åpne naboer ennå — disse to artene vil kun gi treff i områder som
  er sveipet på nytt (foreløpig kun Vestby). Full nasjonal dekning krever
  et bevisst, senere rutenett-sveip over flere/alle områder, se
  `docs/veien-videre.md`.

## 0.28.13 — "Preferanser & Config" → "Preferanser & Konto"
Brukeren påpekte at "Config" ikke lenger er et representativt navn — det
ligger ikke noe GitHub-oppsett i panelet lenger, kun to faner:
"Preferanser" og "Konto". Rettet alle 6 forekomster (heading, tre
innloggingsoppfordringer i `index.html`, to tilsvarende i `js/app.js`) +
én CSS-kommentar. Ingen funksjonell endring.

## 0.28.12 — Gjeninnfør furuknippesopp (trofisk modus avklart)
Furuknippesopp (*Lyophyllum shimeji*) ble fjernet i v0.28.7 (2026-08-18,
samme dag) pga. reell faglig uenighet om trofisk modus mellom kildene:
Artfakta (Sverige) sa saprotrof, Norges egen rødlistevurdering 2021 sa
hedget "antas å danne mykorrhiza". `docs/veien-videre.md` satte som
betingelse for gjeninnføring at dette ble avklart av en tredje kilde.

Fant en tredje, uavhengig, fagfellevurdert kilde samme dag: en genomstudie
(Ohta et al., *DNA Research*, se pmc.ncbi.nlm.nih.gov/articles/PMC9896470)
konkluderer utvetydig at arten ER ektomykorrhiza-dannende — den beholder
enkelte saprotrof-lignende metabolske egenskaper (kan bryte ned stivelse)
og en genomarkitektur som ligner saprotrofe sopp, trolig derfor Artfakta
klassifiserte den feil, men trofisk modus selv er avklart. Bekrefter det
den norske rødlistevurderingen antok.

- Lagt tilbake i `SPECIES`, `SPECIES_HUE`, `WARMTH_LOVING_SPECIES` og
  `BASE_MICROTIPS` i `js/app.js`, med samme profil som før fjerningen
  (treslag/skogalder/fuktighet/berggrunn/hoydeMoh/weather/fieldTips/
  lookalike/image), pluss én endring: `gran` lagt til i `treslag` ved
  siden av `furu` — kilde: den norske rødlistevurderingen nevner gran som
  "mulig" ekstra vertstre (hedget, men fra en offisiell vurdering).
- `season`/`weather` UENDRET — kun 4 unike bekreftede Artskart-funn
  totalt, langt for lite til kalibrering (til sammenligning brukte
  værterskel-kalibreringstesten n=20-47 for andre arter). Én av de fire
  (23. aug 2012) lå før deklarert sesong, samme retning som
  kransmusserongs sesongfunn (se v0.28.10) — for tynt datagrunnlag til å
  handle på alene, notert i kildekommentaren for senere.
- Lagt tilbake i `fetch_area.py`s `SPECIES_TAXON_ID` (fungifinder-db) —
  taxon-IDen var beholdt i en kommentar fra opprydningen i v41 nettopp for
  denne anledningen.

Verifisert: node --check + py_compile (syntax), live i nettleser — alle
10 arter i velgeren igjen, ingen nye konsollfeil.

## 0.28.11 — Senket minNedbor14 for matriske og traktkantarell
Oppfølging av værterskel-kalibreringstesten, de to artene med høyest
"for tørt"-andel i den forrige runden testet på nytt med full/større
utvalg mot ekte historisk vær (Open-Meteo archive-API):

- **Matriske**: testet ALLE 47 bekreftede Artskart-funn (fullt utvalg,
  ikke stikkprøve) — 26 % lå under den gamle grensen (15 mm), med en
  klynge på 8,9 mm (tre funn) som gulv. `minNedbor14` senket fra 15 til 8.
  Passer også bedre med at arten allerede er modellert som tørketolerant
  (`fuktighet:['tørr','frisk']`) — delte tidligere samme fuktighetsgrense
  som kantarell/traktkantarell til tross for at fuktighet-aksen sier de er
  ulike.
- **Traktkantarell**: testet n=40 av 610 (etter å ha filtrert bort noen få
  Artskart-poster med en tydelig feilregistrert dato, år=1 — egen
  dataknute, ikke rettet her) — 15 % lå under den gamle grensen (20 mm),
  med en klynge på 11,5 mm (to funn) som gulv, to enkeltstående lavere
  verdier (7,0/8,8 mm) behandlet som outliers. `minNedbor14` senket fra 20
  til 11.

Ingen endring i `idealNedbor14` for noen av artene — datagrunnlaget pekte
kun på at nedre grense var for streng, ikke at toppen var feil.

Verifisert: node --check (syntax), live i nettleser — ingen nye
konsollfeil, artspanelene rendrer som før.

## 0.28.10 — Kransmusserongs sesong utvidet til å starte i august
Oppfølging av værterskel-kalibreringstesten (se `docs/veien-videre.md`):
4 av 8 unike bekreftede kransmusserong-funn i Artskart-dataene lå FØR den
deklarerte sesongen (sep-okt) — tett klynget rett før september (31. juli,
30. aug, 8. aug, 15. aug, på tvers av 1992/2022/2023/2024), ikke spredt
gjennom året slik man ville forvente av tilfeldige feilbestemmelser.
Uavhengig kildesøk fant en svensk artikkel om goliatmusseron (samme art)
som eksplisitt nevner et tidlig funn "12 augusti" i Bjurholm, Västerbotten,
ved siden av hovedsesongen sep-okt — samme mønster som i egne data.

- `season` for kransmusserong endret fra `[9,10]` til `[8,10]` i
  `js/app.js`. Ingen endring i sluttmåned — ingen funn i datasettet støttet
  juli som reell sesongstart (kun ett funn, helt på grensen 31. juli).
- Sourcing-kommentar lagt til i `SPECIES`-arrayen som forklarer
  begrunnelsen og peker til kalibreringstesten.

## 0.28.9 — Kontinuerlig høyde-/helningsscoring (Voksestedslag-finkorning)
Implementerer forslaget fra `docs/veien-videre.md` om å gjøre
høyde-/sørvendt-skråning-scoringen glidende i stedet for trinnvis — ingen
ny data, kun samme kildebelagte grensepunkter interpolert i stedet for
hardt sprang. Gjelder kun artene som allerede har en satt preferanse
(`species.hoydeMoh` / `WARMTH_LOVING_SPECIES`), ikke utvidet til flere
arter uten kilde.

- **`elevationScore()`**: var en trinnfunksjon (≤ideal→+5, ≤max→+2, ellers
  flatt -5) — et sted rett under `max` og et sted rett over kunne få et
  sprang på 7 poeng for under 1 m høydeforskjell. Nå lineær interpolasjon
  mellom de samme to grensepunktene (ideal→+5, max→+2), fortsetter med
  samme stigningstall forbi `max`, klippet ved samme bunnverdi -5.
- **Sørvendt skråning-bonusen** (varmekrevende arter): var en binær AND av
  himmelretning ∈ {S,SØ,SV} og helning 3-25° (alt-eller-ingenting, +4).
  Ny delt funksjon `sorvendtVekt()` (brukt av både scoreLocation() og
  "Hvorfor her?"-kortet) gir S full vekt og SØ/SV 0,7× (ren solgeometri —
  himmelretning er allerede diskretisert til 8 kompassretninger i
  `fetch_area.py`, ingen rådata i grader tilgjengelig), og en myk 3°-skulder
  på hver side av 3-25°-vinduet i stedet for et hardt sprang midt i et reelt
  kontinuerlig tall (helningGrader). "Hvorfor her?"-kortet viser nå også en
  ekte "mid"-tilstand (delvis sørvendt) i stedet for kun god/dårlig.

Verifisert: node --check (syntax), separat aritmetikk-sjekk av begge
formlene mot en rekke representative verdier (grenseverdier, midtpunkt,
ekstremer) — bekrefter samme verdi som før nøyaktig ved de gamle
grensepunktene (ideal/max, 3°/25°) og glidende overgang der det tidligere
var et hardt sprang. Live i nettleser mot lokal static server: ingen nye
konsollfeil, artspanelene rendrer som før.

## 0.28.8 — Del 0: tre kildebelagte artsprofil-rettelser
Implementerer "Del 0" fra `docs/veien-videre.md` — de tre funnene fra
artsprofil-gjennomgangen (`docs/artsprofiler-forskningsgrunnlag.md`) som
ikke krevde noen ny kilde eller avveining, kun en linjeendring i `SPECIES`
basert på et allerede sitert avvik mot Artfakta:

- **Traktkantarell**: la til `furu` i `treslag` (hadde kun `gran`) — kilden
  nevner furu (tall) på linje med gran. "Hvorfor her?"-teksten bruker nå
  `t.treslagTekst` i stedet for hardkodet "granskog", slik at den også
  stemmer når furu er treslaget som faktisk matchet.
- **Trompetsopp**: fjernet `gran` fra `treslag` (hadde `bjork`+`gran`) —
  kilden sier arten sjelden vokser i barskog. Igjen kun `bjork`, som
  uansett er den nærmeste tilnærmingen terrengdata-laget kan gi til den
  reelle preferansen (hassel/eik/asp — se strukturell begrensning i
  `docs/veien-videre.md`).
- **Rødskrubb**: la til `'rik'` i `berggrunn` (hadde `fattig`+`moderat`) —
  kilden sier arten ikke har noen berggrunnspreferanse i det hele tatt.

Ingen av de tre er store scoreendringer alene, men er direkte relevante for
Voksestedslaget (fargelaget, admin-gatet i v0.27.2 "til jeg er fornøyd med
kvaliteten") — se `docs/veien-videre.md` for hvorfor. Kantarell (furu i
treslag, fortsatt uavklart mot en 3. kilde) er ikke endret.

## 0.28.7 — Fjernet parasollsopp, sjampinjong og furuknippesopp (foreløpig)
Direkte konsekvens av artsprofil-gjennomgangen (se
`docs/artsprofiler-forskningsgrunnlag.md`, forskningspass 2026-08-18 mot
Artfakta/SLU Artdatabanken + Artsdatabankens rødliste):

- **Parasollsopp og sjampinjong** er begge saprotrofe grasmarksarter (lever
  av dødt organisk materiale), ikke mykorrhiza-dannende — appens
  `treslag`/`skogalder`-scoringsmodell (bygget for mykorrhiza-arter) gir
  ikke mening for dem. Kombinert med at `'apen'` (åpen mark) uansett aldri
  kan produseres av terrengdata-laget (NIBIO SR16 er et skogressurskart),
  var scoringen for disse to strukturelt ute av stand til å fungere, ikke
  bare unøyaktig.
- **Furuknippesopp**: kildene er uenige om trofisk modus (Artfakta/Sverige
  sier saprotrof, Norges egen rødlistevurdering sier "antas mykorrhiza") —
  reell faglig usikkerhet, ikke en klar feil, men for usikkert til å stå i
  produksjon som er.

Fjernet fra `SPECIES`, `SPECIES_HUE`, `WARMTH_LOVING_SPECIES` og
`BASE_MICROTIPS` i `js/app.js`. Ingen andre steder i kodebasen refererte
til disse tre artenes id-er (verifisert med søk) — brukere som allerede har
loggede funn av disse artene fra før mister ikke dataen, men "finn"-listen
faller tilbake til å vise rå id-en i stedet for pent artsnavn siden
oppslaget allerede hadde en `?? id`-fallback.

Alle tre står på listen over fremtidige mulige utvidelser i
`docs/veien-videre.md`, med hva som må avklares/bygges før de kan komme
tilbake.

## 0.28.6 — "Hvorfor her?"-faktorene bruker ikon/merke i stedet for stolpe der de er binære
Brukerobservasjon: fem av de seks (nå syv, med Sørvendt skråning/Høyde over
havet) faktorene på "Hvorfor her?"-kortet er egentlig bare treff/ikke treff/
ukjent (evt. tre ordnede nivåer for Høyde over havet), men ble vist med en
stolpelengde — noe som konvensjonelt signaliserer en gradert størrelse.
En 85%-stolpe ser ut som "nesten perfekt, 15% å gå på", når det i
virkeligheten ikke finnes noe mellomnivå: enten passer treslaget eller det
gjør det ikke.

`whyHereFactors()` (js/app.js) gir nå diskrete faktorer et `state`
('good'/'mid'/'bad'/'unknown') i stedet for `pct`, rendret som et lite
farget ikon-merke (✓/~/✗/?) foran etiketten fremfor en stolpe. Gjelder
Treslag, Fuktighet, Berggrunn, Skogalder, Sesong, Sørvendt skråning (alle
binære) og Høyde over havet (tre ordnede nivåer: ideell/innenfor/for høyt).
Kjente funn < 500 m er den ENESTE faktoren som beholder stolpen — det er
det ene feltet som faktisk er en kontinuerlig, gradert telling (antall
funn), ikke en tilstand.

Verifisert visuelt lokalt (midlertidig testside mot den ekte css/styles.css,
alle fire ikon-tilstander + den gjenværende stolpen) — inkludert en liten
justering underveis: bar-radens etikett fikk egen venstremarg (23px) for å
linje opp visuelt med etikettene på ikon-radene over/under den.

## 0.28.5 — Strammet "kjente funn i nærheten" fra 1,5 km til 500 m
Oppfølger til v0.28.4. Brukerspørsmål: er 1,5 km (~7 km²) ikke et
urealistisk stort område å kalle "kjent funnsted" — det er mye jobb å lete
gjennom et areal på flere kvadratkilometer?

Svaret var ja — 1,5 km var opprinnelig kun ETL-ens (`fetch_area.py`)
KOBLINGSradius for å knytte et Artskart-funn til et sted i utgangspunktet
(nødvendig fordi Artskart kun lar seg filtrere på fylke server-side, se
fungifinder-db/README.md), ikke et bevisst valg om hva som er "nært nok"
for en sanker. Strammet til 500 m to steder, begge nå samme terskel:

- **`scoreLocation()`s tetthetsbonus** (opptil +10 poeng) og
  nedprioriterings-motstykket (`deprioritizeKnownFinds`) — teller nå kun
  funn <500 m, i stedet for hele ETL-ens 1,5 km-pool. Endrer faktisk
  totalscore for steder som tidligere fikk bonus utelukkende fra funn i
  500 m–1,5 km-sonen. `avstandM` er allerede lagret presist per funn, så
  dette er en terskeljustering, ingen ny data nødvendig.
- **"Hvorfor her?"-kortets "Kjente funn"-stolpe** — samme 500 m, etikett
  oppdatert fra "< 1,5 km" til "< 500 m".

ETL-ens 1,5 km-koblingsradius selv er UENDRET (fortsatt riktig for
datainnsamling — et funn 1,4 km unna er fortsatt relevant kontekst for
stedet), og `knownFindsHtml()` (den detaljerte funnlisten på kortet, med
eksakt meter-avstand per funn) er også uendret — den påstår ikke "nært",
den viser bare rå avstand, så ingen villedende ramme å rette der.

Verifisert live lokalt (wrangler dev + ekte innlogging).

## 0.28.4 — "Hvorfor her?"-kortet fremhever nå faktiske vekstvilkår
Brukertilbakemelding: kortet var fint, men fremhevet feil ting — avstand
til vei og befolkningsnærhet er ADKOMST/RO, ikke noe soppen selv bryr seg
om, mens fuktighet og berggrunn (nest og tredje tyngst i selve
scoreLocation()s vektbudsjett, 15 og 10 poeng) manglet fra kortet helt.

- `whyHereFactors()` viser nå terrenget i budsjettrekkefølge: **treslag,
  fuktighet, berggrunn, skogalder, sesong**, og — kun for arter som
  faktisk har en definert preferanse — **høyde over havet**
  (`species.hoydeMoh`) og **sørvendt skråning** (varmekrevende arter,
  samme `WARMTH_LOVING_SPECIES`-sett som selve scoringen bruker). Kjente
  Artskart-funn < 1,5 km beholdt sist — ikke et vekstvilkår i seg selv,
  men reell observasjonsevidens.
- **Avstand til vei og befolkningsnærhet fjernet fra kortet** — begge
  vises fortsatt tydelig andre steder på kortet (parkering/sti-boksen,
  og befolkningstaggen blant sp-tags), bare ikke lenger under en
  overskrift som antydet at de forklarer vekst.

Verifisert live lokalt (wrangler dev + ekte innlogging): alle fem
felt/betingede felt rendrer riktig verdi og stolpe per sted, ingen
konsollfeil.

## 0.28.3 — Rettet: resultatlisten forsvant helt (ReferenceError etter v0.28.2)
Brukerrapport: kun kartvisning synlig, ingenting under "Forslag for
<soppnavn>", og en `Uncaught ReferenceError: coverageCount is not defined`
i konsollen (`render()`, app.js:4534).

- Rotårsak: v0.28.2s omlegging av dekningslinjen fjernet
  `const coverageCount = …` (erstattet med `updateCoverageLine(scoped.length)`),
  men en SEPARAT, lengre nede i samme `render()`-funksjon —
  `updateFetchPanel(coverageCount)` — refererte fortsatt til den nå
  fjernede variabelen. Exception der stanser resten av `render()`, som
  inkluderer selve listeoppbyggingen — dermed forsvant lista helt, ikke
  bare "Hent data"-panelet ReferenceError-en faktisk kom fra.
- Fix: `updateFetchPanel(scoped.length)` — samme verdi `coverageCount`
  ga tidligere (identisk uttrykk, gjenbrukt fra `updateCoverageLine()`-
  kallet like over).

Worker (`fungifinder-api`) var ikke berørt av denne — kun frontend
redeployes via denne versjonsbumpen.

## 0.28.2 — Kartutsnitt-scope utvidet til hele appen (ikke bare "Foreslå områder")
Oppfølger til v0.27.3, som løste dette KUN for "Foreslå områder"-knappen.
Den avgrensingen viste seg selv forvirrende i praksis: knappen kunne telle
et annet antall punkter enn resultatlisten/kartet/værsammendraget viste
samtidig, siden de fortsatt kun så på eksplisitt fylke/kommune/radius.
Bruker-spørsmål som avdekket dette: hva skjer med resten av appen hvis man
har panorert kartet rundt uten å ha valgt fylke, kommune eller radius?
Svaret var: ingenting der heller — samme "alltid hele Norge, uansett
kartutsnitt"-oppførsel, bare uten noe varsel om det. To UX-svakheter rettet:

- **Dekningslinjen over "Foreslå områder" var tidligere helt SKJULT**
  akkurat i dette tilfellet (`updateCoverageLine()` i js/app.js) — det ene
  stedet i UI-et designet for å svare på "hva skjer om jeg trykker denne?"
  hadde et hull akkurat der behovet var størst. Viser nå "Ingen
  fylke/kommune/radius valgt — søker i hele Norge (X kjente punkter)" i
  stedet for å tie stille.
- **Kartutsnittet er nå selve scopet** når intet er eksplisitt valgt OG man
  har zoomet inn nok til at det er meningsfullt (samme terskel som allerede
  fantes for Artskart-laget, `ARTSKART_MIN_ZOOM`/`artskartOmradeErAvgrenset()`
  — gjenbrukt, ikke duplisert). Flyttet inn i selve `isInCurrentScope()`
  (ny `viewportImpliesScope()`), i stedet for v0.27.3s egne
  `foreslaOmraderFallbackUtsnitt()`/`isInForeslaOmraderScope()` (nå
  fjernet — overflødige) — gjelder dermed ALLE fire stedene som deler
  `isInCurrentScope()`: kartprikkene, resultatlisten, værsammendraget OG
  "Foreslå områder". Ingen av dem kan lenger vise ulikt scope samtidig.
  Helt utzoomet (hele Norge synlig) er søket fortsatt reelt nasjonalt, som
  før — terskelen gjør det slik at panorering ved oppstart ikke endrer
  noe uventet. Ny `moveend`-lytting (kun aktiv når intet er eksplisitt
  valgt) re-scoper live når kartet panoreres/zoomes, kort debounce (200ms),
  ingen ny nettverksrundtur i seg selv siden hele datasettet allerede er
  lastet inn client-side i dette tilfellet.
- Værsammendragets cache-nøkkel (`currentScopeKey()`) fikk samme
  kartutsnitt-fallback, avrundet til ~1 km presisjon (`boundsKey()`) — uten
  dette ville værtallene stå og vise et gammelt utsnitt mens lista/kartet
  allerede hadde hoppet videre.

Verifisert: logikken er testet isolert (Node, mock av
`isInCurrentScope()`/`viewportImpliesScope()`) mot fire scenarier —
utzoomet uten valg (fortsatt nasjonalt), zoomet inn uten valg (kartutsnitt
avgjør inn/ut), og eksplisitt fylke valgt (kartutsnittet ignoreres helt,
uendret oppførsel). Selve UI-flyten (`updateCoverageLine()`-teksten,
"Foreslå områder" live i nettleseren) er IKKE verifisert live i denne
runden — krever innlogging mot ekte backend, ikke tilgjengelig i dette
miljøet; verdt en rask sjekk i praksis etter deploy.

## 0.28.1 — Rettet: kartpopup for "Foreslåtte områder" ble avkuttet på mobil
Bruker-rapport (med skjermbilde): popup-en som åpnes ved klikk på et
"Foreslått område" i kartet ble feilplassert på mobil, og hele
beskrivelsen var ikke synlig — teksten ble kuttet midt i ord ved
høyrekanten.

- Rotårsak: `bindPopup()` for "Foreslåtte områder" (`renderAreasOnMap()`
  i js/app.js) fikk aldri noen `maxWidth`/`maxHeight`-begrensning —
  Leaflets standard `maxWidth: 300` pluss dens egen ~44px innvendige
  marg blir BREDERE enn selve kartcontaineren på en smal mobilskjerm
  (`.sp-leaflet-map` er typisk ~320-333px bred der), og med lang nok
  tekst (områdenavn + score + parkering + `describeRouteTerrain()`) ble
  popup-en også HØYERE enn containeren (360-460px). Leaflets `autoPan`
  flytter kun kartet for å holde popupen innenfor kartcontaineren — det
  finnes ingen panorering som gjør en for stor boks helt synlig,
  uansett retning.
- Ny delt konstant `POPUP_OPTS` (`{ maxWidth: 240, maxHeight: 260,
  autoPanPadding: [16, 16] }`) i js/app.js, brukt på ALLE 8
  `bindPopup()`-kall i appen (ikke bare det ene lange) — `maxHeight`
  er Leaflets EGEN mekanisme for lange popup-tekster: innholdet ruller
  internt (`.leaflet-popup-scrolled`, fra leaflet.min.css) i stedet for
  å bli kuttet av containerens `overflow:hidden`. `autoPanPadding` økt
  fra Leaflets standard `[5,5]` for litt luft fra egne kartkontroller
  (zoom +/−, lag-ikonet).
- Verifisert live mot en isolert reproduksjon (ekte `css/styles.css` +
  Leaflet 1.9.4 fra CDN-en, samme popup-HTML som `renderAreasOnMap()`
  genererer, 375px mobilbredde): innholdet er nå alltid fullt synlig
  innenfor kartcontaineren. Kjent, mindre restsak: i verste tenkelige
  tilfelle (område-ankeret nøyaktig i kartets senter) kan zoom-
  kontrollen fortsatt grafisk overlappe et par piksler av popup-ens
  øverste venstre hjørne — ikke tapt innhold, bare et kosmetisk
  overlapp, bevisst ikke jaget videre (se kommentaren ved `POPUP_OPTS`
  for avveiningen mot å gjøre popup-en unødvendig smal for alle andre
  tilfeller).

## 0.28.0 — Hjemskjerm-installasjon + mer stabil pålogging
Bruker-ønske: en "legg til på hjemskjermen"-lenke som bærher.no har på
forsiden, pluss en løsning på at flere brukere sliter med å logge på på
nytt og forsøker den gamle invitasjonslenken sin.

- **Ny "Legg til på hjemskjermen"-banner** rett under headeren: skjult
  automatisk hvis appen allerede kjører installert (`display-mode:
  standalone` / `navigator.standalone`), ellers plattformriktig — iOS
  viser statisk Del→"Legg til på Hjemskjerm"-anvisning (Safari har ingen
  programmatisk install-API), Android/Chrome tilbyr en ekte
  installer-knapp via `beforeinstallprompt()` med statisk fallback hvis
  den aldri fyres. Lukkes permanent per enhet via `localStorage`. Ikke
  vist på desktop.
- **Sesjonens `utloper` glir nå fremover ved hver rullering** i stedet
  for å ligge fast 30 dager fra selve innloggingen
  (`rullerSesjonHvisNodvendig()` i `worker/api/src/lib/session.js`) — en
  aktiv bruker logges nå aldri ut bare fordi det er lenge siden de
  logget INN, kun etter 30 dagers sammenhengende INAKTIVITET. Trolig
  hovedårsaken til at flere aktive brukere måtte be om nye
  innloggingslenker oftere enn ventet, siden soppsanking er sesongvis
  bruk i støt (rundt regnvær), ikke daglig.
- **Tydeligere feilhåndtering for gjenbrukt invitasjonslenke**: en
  invitasjonslenke er kun gyldig for selve førstegangsregistreringen,
  men er ofte den eneste lenken en bruker har liggende (e-post/bokmerke)
  når økten deres har utløpt uker/måneder senere. `checkUrlInvitasjon()`
  viser nå en forklarende melding OG en "Gå til innlogging"-knapp som
  sender brukeren rett til Konto-fanen (`openLoginPanel()`), i stedet
  for å la dem sitte fast bak en generisk "ugyldig/utløpt/brukt"-feil.

Verifisert i preview-nettleser (iOS-UA og Android-UA emulert): banneret
viser riktig plattformtekst, skjules korrekt i standalone-modus, og
lukkeknappen huskes på tvers av reload.

## 0.27.2 — Voksestedslag: admin-only inntil videre
Bruker-ønske: "gjør voksestedslaget kun tilgjengelig for admin frem til
jeg er fornøyd med kvaliteten". "Voksestedslag (fargelag)"-laget
(v0.27.0) er kvalitetsmessig fortsatt under vurdering — gjort
admin-only i mellomtiden, uten å røre selve fargelogikken/kortene.

- `L.control.layers()`-instansen lagres nå i `layersControl` i stedet
  for å kastes bort etter `.addTo()`. "Voksestedslag (fargelag)" er
  BEVISST fjernet fra den statiske overlay-listen i `initMap()` —
  `isAdmin()` er alltid usann på det tidspunktet (`currentUser` settes
  først når `initAuth()` resolves ETTER `initMap()`, se `init()`), så et
  betinget objekt-literal der ville aldri vist laget for noen, selv en
  ekte admin.
- Ny `updateVoksestedslagAvailability()`: legger laget til/fjerner det
  fra selve lag-kontrollen dynamisk via `addOverlay()`/`removeLayer()`
  (IKKE `removeOverlay()` — den metoden finnes ikke på
  `L.Control.Layers` i Leaflet 1.9.4, verifisert live mot `window.L` før
  koden ble skrevet). Kalt fra `reflectAccountUi()`, dermed ved
  oppstart, innlogging og utlogging.
- Ikke-admin: laget fjernes fra kartet og kontrollen, og
  tegnforklaring/dekningslinje skjules — vanlige brukere kan verken se
  avkrysningen eller skru den på via DevTools.
- `render()` tegner nå kun voksestedslaget (`renderVoksestedslag()` +
  tegnforklaring + dekningslinje) når `isAdmin()`, i stedet for alltid.

Verifisert i preview-nettleser: laget er fraværende fra lag-kontrollen
for ikke-innlogget/vanlig bruker, ingen konsollfeil.

## 0.27.1 — Fikset fastlåst invitasjonsmodal ved ugyldig/utløpt lenke
Bruker meldte at feilmeldingen "Invitasjonslenken er ugyldig, utløpt,
eller allerede brukt" vises i en modal det ikke går an å komme seg ut
av. Stemte: `#sp-invite-panel` (`checkUrlInvitasjon()` i app.js) hadde
verken en Lukk-knapp eller en klikk-utenfor-lukker, i motsetning til
alle andre modaler i appen (funn-/hogst-modalene) som begge har det.
Feilgrenen satte kun statusteksten og returnerte — panelet ble stående
åpent resten av økten, og en reload ville sjekket akkurat samme
ugyldige token på nytt via `?invitasjon=`-parameteren i URL-en.

- La til en "Lukk"-knapp i `#sp-invite-panel` (index.html) og en id på
  backdropen (`#sp-invite-backdrop`) for klikk-utenfor-lukking, samme
  mønster som `#sp-modal-backdrop` bruker andre steder.
- `checkUrlInvitasjon()` fikk en delt `closeInvitePanel()`-funksjon,
  wiret til begge FØR try/catch-blokken slik at den også virker mens
  "Sjekker …" vises og i feilgrenen. Fjerner i tillegg `?invitasjon=`
  fra URL-en ved lukking (samme opprensking som den vellykkede
  registreringen allerede gjorde) — uten det ville en reload trigget
  samme fastlåste modal på nytt.

## 0.27.0 — Voksestedslag: fargelag, tegnforklaring og "Hvorfor her?"-kort
Del 1 (fig. 1–3) av "Voksestedslaget"-planen
(https://claude.ai/code/artifact/70ef4f71-bc60-4973-a35c-cd34755351b0),
inspirert av en UX-gjennomgang av bærher.no. Bygget utelukkende på data
appen allerede laster/beregner (`terreng_steder` + `scoreLocation()`) —
ingen ny tabell, ingen ny ETL, ingen backend-endring.

- **Nytt kartlag "Voksestedslag (fargelag)"** i lag-kontrollen (av som
  standard, samme mønster som Målepunkter-laget). Tegner ett lite
  kant-løst rektangel per allerede scoret punkt, farget etter en egen
  kulør PER ART (`SPECIES_HUE`) med metning/lyshet styrt av score
  (`speciesPointColor`) — i stedet for appens delte score-fargeskala.
  Flatehogde punkter hoppes over. Renderes av `renderVoksestedslag()`.
- **Dekningslinje** under kartet mens laget er på: reelt telt antall
  fargelagte punkter i valgt område — bevisst ALDRI en areal-/
  prosentandel av kommunen, siden appen ikke har kommunens polygonareal
  tilgjengelig klientsidig. Samme ærlighetsprinsipp som "tynt
  datagrunnlag"-teksten over "Foreslå områder".
- **Tegnforklaring** for fargelaget: én gradient-rad per relevant art
  (valgt art, eller alle favoritter i favoritt-modus), generert fra
  samme `SPECIES_HUE` som selve fargelaget slik at stolpen og
  punktfargene alltid stemmer visuelt overens.
- **"Hvorfor her?"-kort** i stedskortet (både enkeltart- og
  favoritt-visning): fire faktorstolper — avstand til vei, skogtype &
  alder, befolkningsnærhet, kjente Artsdatabanken-funn < 1,5 km — pluss
  en "God match"/"Meget god match"/"Middels match"/"Svak match"-merkelapp
  basert på totalscoren. Ren UI-eksponering av felt `scoreLocation()`
  allerede leser/beregner (`whyHereFactors()`), påvirker ikke selve
  scoren.

Del 1.5 (rakere start, mykere risikoboks, mobil bottom-sheet) og Del 2–4
(cache-lag, ETL-bulkmigrasjon, kalibreringskjøring) er ikke del av denne
releasen — se plandokumentet.

## worker/api — 2026-08-16 (produksjonshotfix, ingen APP_VERSION-bump nødvendig)
`refresh-areas.yml` (fungifinder-db) feilet to netter på rad
(15. aug 18:24 og 16. aug 08:00) med `503`-feil fra
`GET /admin/terrengdata/eksport?tabell=terreng_steder`. Rotårsak: den
ukentlige jobben kaller `fetch_area.py --refresh-existing` én gang PER
allerede-hentet område (opptil 30+ ganger i én kjøring), og hvert kall
gjorde et HELT ufiltrert `SELECT * FROM terreng_steder` (12 700+ rader) —
Workeren tålte ikke gjentatt last av det i løpet av kjøringens ~24 minutter.

- `eksporterTerrengdata()` (`worker/api/src/routes/etlImport.js`) leser nå
  `fylke`/`kommune`/`minLat`/`maxLat`/`minLon`/`maxLon` fra querystringen og
  sender dem videre til `hentTerrengStederFraDb()` — som allerede støttet
  fylke/kommune-filtrering internt (brukt av app.js sin egen visning), bare
  ikke koblet til denne ETL-eksportruten.
- `hentTerrengStederFraDb()` (`worker/api/src/lib/terrengDb.js`) fikk i
  tillegg et valgfritt bbox-filter, samme mønster som
  `hentArtsfunnFraDb()` allerede hadde — dekker `--mode radius`, som ikke
  har noe kommune/fylke-felt å filtrere skarpt på.
- Se fungifinder-db sin CHANGELOG (samme dato) for motstykket:
  `fetch_area.py`/`refresh-areas.yml` bruker nå dette filteret, og deler i
  tillegg ÉN artsfunn-henting mellom alle områdene i en kjøring i stedet for
  én full 31 000-raders nasjonal eksport per område.
- Ingen endring i responskontrakten når ingen filterparametre sendes (hele
  datasettet, som før) — kun ETL-kallene fra fungifinder-db er endret til
  faktisk å bruke filteret.

## 0.26.1 — Fjernet "(kartdata)" helt + fikset inkonsistent parkering i foreslåtte områder
Oppfølging på v0.25.0. Bruker meldte tre ting:

1. **"(kartdata)" ga fortsatt ingen verdi** — samme innvending som mot
   "(OSM)" i forrige runde. Fjernet parentesen/attribusjonen helt fra
   `parkering_notat()`s tekster (fungifinder-db v37) i stedet for enda en
   omskriving — "Vis på kart"-lenken ER kildeangivelsen nå, ikke ord i
   selve notatet. Beholdt kun "Skilting kan avvike fra kartdata" i én
   variant, siden det er en reell handlingsrettet advarsel, ikke bare
   attribusjon.
2. **"Vis på kart"-lenken manglet for enkelte steder** — mest sannsynlig
   nettleseren som viser en cachet, eldre `app.js` (samme klasse problem som
   prosjektets egen `?v=`-konvensjon finnes for, se
   `feedback-fungifinder-versioning-convention`). `parkeringLat`/
   `parkeringOsmType`/`parkeringOsmId` settes ALLTID sammen med
   `avstandParkeringM` i `nearest_parking_from_cache()` (samme
   kildepunkt), så et sted med kjent avstand men uten lenke er ikke en
   datainkonsistens i seg selv.
3. **Reell, funnet inkonsistens**: et steds EGET kort kunne vise "212 m til
   parkering", mens akkurat samme sted sin OMRÅDE-sirkel (under "Foreslå
   områder") viste "ingen kjent parkering funnet". Rotårsak: de to stedene i
   koden brukte to HELT ULIKE datakilder — kortet brukte forhåndshentede
   ETL-felt, mens områdesirkelen gjorde et eget, LIVE Overpass-oppslag
   sentrert på områdets ANKER-punkt (ikke nødvendigvis samme punkt som
   faktisk hadde parkering nær seg), innført før parkeringskoordinater i
   det hele tatt ble lagret (se v36). Fjernet hele det live oppslaget
   (`fetchParkingNear`/`findParkingForAreas`/Overpass-kallet) og erstattet
   med ny, synkron `bestParkingForArea()` som velger nærmeste kjente
   parkering blant OMRÅDETS MEDLEMMER (ikke bare ankeret) fra de samme
   forhåndshentede feltene kortene allerede bruker — samme datakilde
   begge steder nå, umulig for de to å motsi hverandre. Bivirkning: raskere
   "Foreslå områder" (ingen nettverksrundtur/"søker etter parkering …"-
   ventetid lenger) og én færre feilklasse (Overpass-timeout/feil for akkurat
   dette søket).
- Fjernet også en glemt "🅿️ = mulig parkering (**live fra OSM**)"-tekst i
  kartforklaringen — samme utdaterte påstand.

## 0.26.0 — Kart som standard for demo/ikke-innlogget + tydelig demo-varsel
Bruker meldte å ha opplevd å bare se 1-2 demo-steder i listevisningen på
mobil (standalone/PWA, ikke innlogget), uten at noe forklarte hvorfor eller
hvordan man kommer videre. Tre tiltak, alle verifisert i preview (mobil +
desktop):

1. **Kart som standard KUN for ikke-innlogget/demo** — listevisning er
   fortsatt standard for innloggede brukere (mest nyttig med tusenvis av
   ekte steder å skumlese), men et kart som viser "nesten ingenting her"
   kommuniserer langt tydeligere enn en liste som sier "1 av 1 steder vist"
   når man kun har 1-2 demo-punkter. Satt ÉN gang ved oppstart (ikke i
   `render()`, som ville tvunget brukeren tilbake til kart igjen og igjen
   selv etter et bevisst bytte til liste).
2. **Nytt, alltid synlig demo-varsel** øverst i resultatlisten når man ikke
   er innlogget: "👋 Du ser 2 demo-steder — ikke ekte, analyserte
   skogpunkter. Logg inn for å se tusenvis av ekte steder i hele Norge." —
   med en ekte "Logg inn"-lenke (ny `openLoginPanel()`) som åpner
   Preferanser & Config-panelet, bytter til Konto-fanen OG scroller dit i
   ett klikk, i stedet for bare å nevne hvor innloggingen ligger som ren
   tekst (det gamle mønsteret flere andre steder i appen fortsatt bruker,
   se `openLoginPanel()`-kommentaren for hvorfor akkurat denne ble
   forbedret).
3. **Fjernet et reelt ødelagt hint**: "alle steder i området finnes
   fortsatt i kartet — skru på «Målepunkter» i lag-menyen øverst til høyre"
   var statisk tekst som pekte på et lag-menyvalg INNI kartet — usynlig for
   en mobilbruker i listevisning, siden kartet er `display:none` der (se
   `.sp-mobile-view-liste`). Erstattet med en ekte lenke ("Vis alle steder i
   området på kartet →", ny `showAllPointsOnMap()`) som skrur på
   Målepunkter-laget (av som standard, se `initMap()`) OG bytter til
   kartvisning i ett klikk — virker identisk på desktop (der
   `setMobileView()` uansett er en no-op, kartet er alltid synlig der).

## 0.25.0 — "Vis på kart"-lenke til parkeringsplassen (i stedet for "(OSM)")
Bruker påpekte at parkeringsnotatet skrev f.eks. "Nærmeste kjente
parkeringsplass (OSM), ca 240 m unna" — "OSM" er en forkortelse ingen
sluttbrukere vet hva betyr, og foreslo en lenke til selve parkeringsplassen
i stedet.

- `(OSM)` byttet til `(kartdata)` i alle varianter av parkeringsnotatet
  (`parkering_notat()` i fetch_area-db) — samme regex-avhengighet i appens
  `adkomstScore()` uendret (ingen av mønstrene refererer "OSM").
- Ny "Vis på kart →"-lenke lagt til rett etter parkeringsteksten på hvert
  sted-kort. Lenker direkte til selve OSM-elementet
  (`openstreetmap.org/{type}/{id}`, viser hele det kartlagte området og
  alle tags) når vi har element-ID-en, ellers til en generisk kart-markør
  på koordinaten — se `parkeringKartUrl()`. Ingen lenke vises når det ikke
  finnes noen kjent parkeringsplass i nærheten.
- Forutsetter nye felt fra fungifinder-db (se den repoens CHANGELOG v36):
  `parkeringLat`/`parkeringLon`/`parkeringOsmType`/`parkeringOsmId`.
  Eldre steder (hentet før 2026-08-15) har kun avstand/notat, ikke disse
  feltene, og viser derfor ingen lenke før neste `--refresh-existing`.

## 0.24.2 — Fiks: værboksene viste nasjonalt snitt, ikke valgt område
Bruker meldte at "Snitt nedbør siste 14 dager (alle steder)" viste NØYAKTIG
samme tall (37 mm) for både Trondheim og Indre Østfold — to helt ulike
kommuner — og spurte om alle værdata burde gjelde det valgte området.

Rotårsak: `loadWeather()`/`loadSeasonWeather()` hentet værdata for
`allLocations()` — ALT appen noensinne har lastet inn (typisk hele det
nasjonale datasettet, siden `fylkeFilter==='alle'` ved første sideinnlasting
ikke sender noe server-filter) — i stedet for kun stedene innenfor
fylke/kommune/radius-filteret brukeren faktisk har valgt. Samme
`allLocations()`-tall ble dermed vist uansett hvilket område man senere
byttet til, fordi begge funksjonene KUN kjørte ÉN gang, ved oppstart.

To fikser:
- **Ny `scopedLocations()`/`isInCurrentScope()`**: trukket ut fra tre
  kopier av samme fylke/kommune/radius-filtreringslogikk (`render()` sin
  `scoped`, `suggestAreas()` sin `scoped`) til én delt funksjon.
  `loadWeather()`/`loadSeasonWeather()` bruker nå denne i stedet for
  `allLocations()`.
- **Automatisk re-henting ved scope-bytte**: ny `maybeRefreshWeatherForScope()`,
  hektet inn i `render()` selv (kalles på ALLEREDE hver gang fylke/kommune/
  radius endres, uansett årsak — innlogging, filterbytte, fullført
  "Hent data"-jobb) i stedet for manuelt lagt til ved hvert av de ~9
  stedene som endrer filterMode/fylkeFilter/kommuneFilter/radiusCenter.
  Sammenligner en scope-nøkkel mot forrige kjente, og re-henter kun ved
  faktisk endring — debounces 400ms slik at radius-sliderens kontinuerlige
  'input'-hendelser under drag ikke trigger ett værkall per pikselforflytning.
- Bonus-effekt: `SEASON_MAX_CELLS`-taket (60, v0.24.0) traff tidligere nesten
  alltid nasjonalt siden `loadSeasonWeather()` kjørte mot hele landet — de
  fleste steder fikk dermed ALDRI sesong-vs-historikk/dryStreakDays-
  korreksjonen fra v0.24.0, uansett hvilket område brukeren faktisk så på.
  Et scoped utsnitt er nesten alltid langt under 60 celler.
- Ryddet også opp i `loadSeasonWeather()`'s tomt-scope-håndtering (fylke/
  kommune uten steder ennå): viste tidligere FORRIGE scopes tall videre i
  stedet for å nullstille — samme feilklasse som selve hovedsaken, bare i
  tomt-scope-varianten.

Verifisert i preview: bytte til et fylke uten lastede steder (unngåelig i
lokal, uinnlogget forhåndsvisning siden ekte data krever innlogging) ga
korrekt "kunne ikke hente værdata"/"kunne ikke hente sesonghistorikk" i
stedet for å henge fast på forrige tall — og bytte tilbake gjenopprettet
riktig data igjen, uten konsollfeil.

## 0.24.1 — Fiks: "Godt fuktnivå" kunne vises for et sted som faktisk var knusktørt
Bruker meldte at et sted de selv besøkte dagen før — og som var "knusktørt" i
terrenget — fikk værverdikten "Godt fuktnivå — gode odds nå." i appen.

Rotårsak: `precip14` (14-dagersvinduet som driver denne verdikten) er en RÅ
SUM av nedbør over 14 dager, uten hensyn til NÅR nedbøren falt. Ett kraftig
regnskyll 12-13 dager tilbake gir nøyaktig samme sum som jevn nedbør gjennom
hele perioden — men bakken/strøsjiktet kan ha vært knusktørt i ukevis siden
det ene skyllet. Modellen hadde ingen "hvor lenge siden sist"-sjekk i det
hele tatt, kun totalen.

Lagt til `daysSinceRain` (dager siden siste dag med ≥1mm nedbør — samme
terskel som `dryStreakDays` i sesongberegningen fra v0.24.0, for konsistens)
i `loadWeather()`, beregnet fra samme daglige nedbørsarray som `precip14`
allerede henter (ingen nytt nettverkskall). Ny korreksjon i
`scoreLocation()`'s værblokk: uansett hva `precip14`-grenen ga (+12/+6/-6),
trekkes poengene ned og verdikten skrives om når det faktisk er lenge siden
sist regn:
- ≥7 dager siden sist regn: −8, verdikt endres til å eksplisitt nevne antall
  dager og at terrenget sannsynligvis er tørrere enn totalen tilsier.
- 4-6 dager: −4, kort parentetisk advarsel lagt til verdikten.
- ≤3 dager: ingen endring — fersk nok til at totalen fortsatt er
  representativ.

Ikke ment som en presis bakkefuktighetsmåling (det ville krevd faktiske
jordfuktighetsdata, se `fuktighetIndex`/NIBIO-markfuktighet for det) — kun
for å unngå å påstå "godt fuktnivå NÅ" når det er åpenbart usant.

## 0.24.0 — Evidens-merking på kort + reell tørkesesong-vurdering
To spørsmål fra brukeren i samme samtale som v0.23.0:

**1) "Score på 100 kan oppleves som en garanti — burde modellen vært
strengere?"** Svar: vektbudsjettet var allerede satt opp (2026-07-10) slik
at 100 normalt krever korroborerende evidens, men kortet viste ikke DENNE
forskjellen — man måtte klikke inn i score-modalen for å se om en høy score
kom fra terreng alene eller fra faktisk kjent funnhistorikk. Løsning: ny
`hasEvidence`-beregning i `scoreLocation()` (sann hvis stedet har kjente
Artsdatabanken-funn for arten ELLER egen funnhistorikk, gitt at hhv.
Artskart-bonusen/`weighOwnFindHistory` faktisk er aktive) — vist direkte på
kortet under score-hjulet som "✓ kjent funnsted" (uthevet) eller
"🔍 terrengbasert" (dempet), og som prefiks på hver art-chip i
"Mine favoritter"-visningen.

**2) "Hvor godt fanges en ekstremtørr sesong (Østlandet 2026) opp — og
sammenlignes den mot tidligere sesonger?"** Svar før denne versjonen: dårlig
på begge punkter. Tre fikser:

- **Sesongvær er nå PER STED, ikke ett globalt tall.** `loadSeasonWeather()`
  hentet tidligere data for ÉTT representativt punkt — sentroiden av ALLE
  steder lastet inn i appen — uansett hvor spredt de var. Et bredt
  fylkesutsnitt kunne dermed gi et Hobøl/Indre Østfold-punkt sesongtall fra
  et helt annet sted i landet. Hentes nå per ~11 km rutenett-celle (samme
  rutenett som 14-dagersværet, se `weatherGridKey`), med samme
  bolk-/cache-mønster som `loadWeather()`. Et tak (`SEASON_MAX_CELLS=60`) og
  mindre bolker (`SEASON_BATCH_SIZE=15`) holder kostnaden nede for svært
  brede utsnitt — celler utover taket faller tilbake til nøytral (ingen)
  sesongscoring i stedet for et forsøk på å hente alt.
- **Ekte historisk sammenligning.** Samme arkiv-kall utvidet til å hente
  `SEASON_CLIMATOLOGY_YEARS` (10) tidligere sesonger i ÉTT sammenhengende
  oppslag (ett Jan-i-fjor-til-i-dag-vindu i stedet for ett kall per år), og
  regner ut snittnedbør for SAMME kalendervindu (1. mai -> samme dato) hvert
  av de foregående årene. Ny scoring-modifikator "Sesong vs. N-års normal
  for stedet" (+3/−6/−10) sammenligner mot DETTE i stedet for kun mot artens
  generiske vekstbehov — modellen kan nå faktisk si noe om "uvanlig tørt for
  STEDET", ikke bare "tørt for en kantarell". Vises også i
  sesong-infoboksen i UI-et (prosent av normalen + verdikt), ikke bare i
  scoringen.
- **`dryStreakDays` koblet inn i scoringen.** Lengste sammenhengende
  tørkeperiode i sesongen ble beregnet siden 2026-07-17 og vist i UI-et, men
  var ALDRI brukt i selve scoren — dødt signal. Ny modifikator (0/−2/−5/−8
  ved hhv. <14/14-20/21-29/≥30 dagers sammenhengende tørke) fanger opp en
  lang, ubrutt tørkeperiode som totalnedbør-tallene alene kan dekke over
  (f.eks. én kraftig regnbyge midt i en ellers tørr sesong).

Værbudsjettet er nå bevisst asymmetrisk mot nedsiden — en reelt tørr sesong
kan trekke betydelig mer enn før (opptil −24 samlet på tvers av de fire
værmodifikatorene, mot tidligere −16), mens en våt sesong ikke får
tilsvarende stor oppside.

## 0.23.0 — Ny preferanse: nedprioriter nær vei
Bruker spurte om det var en idé å innføre en preferanse for å nedprioritere
områder nær vei, eller om dette allerede dekkes av eksisterende preferanser.
Svaret var nei: adkomstScore() premierer kort avstand til PARKERING (motsatt
fortegn), roScore måler avstand til TETTSTED/befolkning (ikke vei — en
gjennomgående skogsbilvei i utmark uten tettsted i nærheten ga fortsatt høy
ro-score), og stiavstandScore() (weighTrailDistance) er eksplisitt avgrenset
til sti/skogsbilvei (`path/track/footway/bridleway`), ikke reelle veier.
`avstandVeiM` fantes allerede i datamodellen, men var ubrukt i scoring siden
opprydningen 2026-07-10 (den dobbelttalte den gang med adkomst og ro).

Lagt til:
- Ny brukerpreferanse "Vektlegg avstand fra vei" (`weighRoadDistance`,
  default AV — samme designmønster som "Vektlegg avstand fra sti").
- `veiavstandScore()` i `js/app.js`, strukturelt identisk med
  `stiavstandScore()` (samme terskler, samme resonnement om å ikke late som
  scoringen er mer presis enn nærmeste-node-tilnærmingen faktisk er).
- **Forutsetning i data-repoet**: `fetch_area_data_in_bbox()` i
  `fetch_area.py` gjorde tidligere `roads` og `trails` til overlappende sett
  (enhver sti-node lå i BEGGE listene), så `avstandVeiM` og `avstandStiM`
  ville stort sett bare gjentatt hverandre. Rettet til disjunkte sett i
  fungifinder-db (se den repoens CHANGELOG) — bonus-effekt: `kjorbarVei`
  (avledet fra samme avstand) er nå mer presis, siden en enslig fotsti ikke
  lenger kan telle som "kjørbar vei i nærheten".

Eksisterende steder får korrekt `avstandVeiM` først etter neste
`--refresh-existing`-kjøring som trigger OSM-infra-oppfriskingen (60-dagers
intervall, samme mekanisme som befolkning/stier-backfillen 2026-07-10) —
frem til da er feltet enten `null` (nøytral 0-score, ikke straffet) eller det
gamle, upresise tallet for steder hentet før denne fiksen.

## 0.22.7 — Presisert "ingen steder"-meldingen for et uanalysert område
Bruker meldte at meldingen som vises når et valgt fylke/kommune/radius ikke
har noen kjente steder (f.eks. kommunen Lillestrøm) var "knotete norsk og
upresis og lite brukervennlig": *"Ingen steder passerer filtrene dine akkurat
nå i Lillestrøm. Prøv «Alle fylker/kommuner» eller juster radius."*

To problemer: (1) `scoped.length === 0` her betyr ALLTID "ingen kjente
steder i området" — aldri "for strenge filtre" (dette skjer før
score-filteret i det hele tatt anvendes), så "passerer ikke filtrene dine"
sa i realiteten det motsatte av hva som skjedde. (2) forslaget "Prøv «Alle
fylker/kommuner» eller juster radius" pekte på en knapp som ikke finnes, og
"juster radius" ga ingen mening utenfor radius-modus.

Meldingen er nå modus-tilpasset og bruker faktiske UI-navn:
- Fylke: *"Ingen analyserte steder i {fylke} ennå. Velg et annet fylke,
  eller se hvilke kommuner som er dekket under «Om dataene»."*
- Kommune: samme, men "Velg en annen kommune, ...".
- Radius (senter satt): *"Ingen analyserte steder innen {radius} km ennå.
  Prøv et annet senterpunkt eller en større radius."*
- Radius (uten senter): uendret, "Klikk i kartet for å sette et
  senterpunkt."

Lagt til en admin-only oppfordring om å hente terrengdata for området
(gjenbruker den allerede eksisterende `fetchNudgeHtml()`/
`wireFetchNudgeLink()` — samme lenke-mønster som dekningslinjen over
"Foreslå områder" og sammendraget etter et rundtur-forsøk), usynlig for
vanlige brukere siden `#sp-fetch-panel` allerede skjules helt for dem
server-side (`updateFetchPanel()`).

## 0.22.6 — Rettet radius-modus: kartet viste hele Norge, ikke bare valgt område
Bruker påpekte at hintet "alle steder i området vises fortsatt i kartet"
(under score-filteret) var en sannhet med modifikasjoner — gjennomgang
avdekket to sammenvevde problemer:

- **Reell funksjonsfeil (radius-modus):** `render()` sendte det UFILTRERTE
  datasettet til `renderMap()`, FØR område-filteret (fylke/kommune/radius)
  ble beregnet. I fylke-/kommune-modus var det uskadelig (allerede
  server-filtrert der), men i radius-modus laster `loadLocations()` alltid
  HELE det nasjonale datasettet (`currentServerFilterParams()` sender aldri
  noe filter for radius) — kartet tegnet dermed absolutt alle punkter i
  Norge, ikke bare de innenfor valgt radius, hver gang "Målepunkter"-laget
  ble skrudd på. Område-filteret beregnes nå FØR `renderMap()`, som får det
  filtrerte settet i stedet.
- **Upresis hint-tekst:** samme hint sa "vises fortsatt i kartet" uten å
  nevne at "Målepunkter"-laget er AV som default (bevisst, for å unngå at
  tusenvis av punkter dominerer kartbildet ved åpning) — for en bruker som
  ikke har funnet det kollapsede lag-ikonet oppe til høyre, "vises" rett og
  slett ingenting. Teksten nevner nå eksplisitt hvor laget skrus på.

## 0.22.5 — Tekstgjennomgang: rettet utdatert innloggingshenvisning
Full gjennomgang av alle bruker-synlige tekster i appen (index.html +
js/app.js), bedt om av bruker etter å ha lagt merke til en utdatert
formulering.

- "Om dataene"-boksen sa fortsatt "logg inn under 'Konto'-fanen i
  sidepanelet" — en rest fra før Konto-fanen flyttet inn under
  "⚙ Preferanser & Config". Alle andre innloggingsoppfordringer i appen
  (funn-registrering, områdeforslag, Mine funn-lista) sier allerede
  "Logg inn under ⚙ Preferanser & Config → Konto" — rettet denne til å
  matche.
- Resten av gjennomgangen (alle alert/confirm-tekster, skjema-/
  modaltekster, statusmeldinger, admin-panelet, kart-hint og
  score-forklaringer) fant ingen ytterligere utdaterte eller
  misvisende tekster.

## 0.22.4 — UX-gjennomgang: fullfør mobil-restrukturering (mockup-oppfølging)
0.22.3 sin Liste/Kart-bryter løste kart+tegnforklaring-delen av
scroll-problemet, men Velg sopp/Artsprofil/Mine funn/Vær fulgte fortsatt
desktop sin DOM-rekkefølge (hele venstre kolonne FØR bryteren og
resultatene) — ikke det som faktisk ble vist i mockupen. Fullført nå:

- Begge `.sp-layout`-wrapperne blir `display: contents` under 760px —
  panelene inni (Velg sopp, Artsprofil, Mine funn, Vær, kart/resultat-
  bryteren, kartpanelet, resultatlisten) blir dermed reelle grid-barn av
  `.sp-layout` selv og kan gis individuell `order`, helt uavhengig av
  hvilken av de to opprinnelige kolonnene de lå i. Desktop er 100 %
  uendret — der er wrapperne fortsatt vanlige bokser (`display: block`)
  og styrer plasseringen akkurat som før.
- Ny mobil-rekkefølge: Velg sopp → Liste/Kart-bryter → resultater/kart →
  Artsprofil → Mine funn → Vær. Resultatene kommer nå rett etter
  artsvelgeren (~1500px scroll fra toppen, ned fra ~3700px før 0.22.3, og
  fra enda lenger ned uten den delen av 0.22.3-fiksen).
- `min-width: 0`-fiksen fra v0.22.0-generasjonen (hindrer den scrollbare
  artslisten i å presse siden bredere enn skjermen) flyttet fra selve
  wrapper-diven ned til hvert enkelt panel, siden en `display:contents`-div
  ikke lenger har noen boks å sette det på.
- Bevisst IKKE endret: sikkerhetsvarselet (`sp-safety`) er fortsatt åpent
  som default (`open`-attributt) og ikke flyttet — i motsetning til
  mockupen, som av plasshensyn viste den slått sammen med "Om dataene" i
  en kollapset "pille". Vurderingen fra selve UX-kritikken sto fast: en
  forgiftningsadvarsel er for viktig til å gjemmes bak et klikk brukeren
  må huske å ta.

## 0.22.3 — UX-gjennomgang: Liste/Kart-bryter på mobil, samkjørte fontstørrelser
Fortsettelse av 0.22.2 sin design-/UX-kritikk — de to punktene som der ble
bevisst utelatt fra førsterunden.

- **Liste/Kart-bryter for mobil** (`.sp-mobile-view-toggle`, kun under
  760px — desktop uendret, viser fortsatt begge side ved side): resultat-
  listen lå tidligere etter kart+filtre+8-linjers tegnforklaring i
  DOM-rekkefølgen, noe som betydde mye scroll før første forslag var
  synlig. Standard er nå "Liste" (`sp-mobile-view-liste`-klassen på
  `.sp-layout`, satt statisk i markup slik at riktig visning vises fra
  første maling), med kartet ett trykk unna. `setMobileView('kart')` kalles
  også automatisk fra "📍 Vis i kart"-knappen på hvert kort, `locateFindOnMap()`,
  og de to "hent mer terrengdata"-nudge-lenkene — samt `leafletMap.invalidateSize()`
  etter at panelet blir synlig igjen (samme mønster som `toggleMapFullscreen()`),
  siden Leaflet ellers regner ut fliser mot en 0×0-container når kartet
  initialiseres bak `display:none`.
- **Samkjørte fontstørrelser**: sekundærtekst (hint/meta/brødtekst — IKKE
  titler/knapper, som er bevisst egne størrelser) var spredt over ni
  nesten-like verdier (9.5/10/10.5/11/11.5/12/12.5/13/13.5px) uten
  systematikk, på tvers av `css/styles.css`, `js/app.js` (inline stiler i
  template-strenger) og `index.html`. Konsolidert til tre CSS-variabler —
  `--fs-xs` (11px), `--fs-sm` (12.5px), `--fs-md` (13.5px) — på `#sopp-root`,
  med hver eksisterende bruk flyttet til nærmeste steg (maks ±1.5px avvik,
  de fleste ±0.5px, umerkelig enkeltvis).

## 0.22.2 — UX-gjennomgang: touch-mål, mobil-scroll, kontrast
Rettet de tre prioriterte funnene fra en design-/UX-kritikk (skjermbilde-
basert, desktop + mobilemulering, kontrastforhold og touch-mål faktisk
målt via computed styles — ikke anslått):

- **Preferanse-/kontobrytere (`.sp-toggle`)**: 38×21px → 46×26px — under
  WCAG 2.2s minimum touch-mål på 24×24px (2.5.8), og langt under de
  anbefalte 44×44px for utendørsbruk (kalde fingre/hansker/sollys). Hele
  raden (`.sp-slider-row`) er nå i tillegg klikkbar, ikke bare selve
  bryteren — én delegert lytter i `js/app.js` videresender klikket til
  riktig `<button>`.
- **Artsvelgeren på mobil** (`.sp-species-list`, horisontal scroll): med 11
  arter var kun ~1,3 pills synlige om gangen, uten noe visuelt tegn på at
  det fantes flere — chip-tekst ble bare brått avkuttet i kanten. Løst med
  CSS-only "scroll shadow"-teknikken (fire lag-gradienter,
  `background-attachment: local`/`scroll`) — skygge ved kantene som
  automatisk forsvinner når man har scrollet helt fram/tilbake, uten JS.
- **To WCAG AA-kontrastbrudd** (krav 4.5:1 for normal tekst), begge målt
  direkte i DOM-en: `.sp-collapse-hint` ("klikk for å skjule/vise") hadde
  `opacity: 0.6` oppå en ellers grei farge — reelt renderet kontrast kun
  ~2.4:1, fjernet opacity. `.sp-species-info-top .sp-si-season` ("typisk
  sesong: …") brukte `var(--moss)` mot papir-bakgrunnen — målt 3.37:1,
  byttet til `var(--ink-soft)` (4.85–5.48:1 andre steder i appen — retter
  også en fargeinkonsekvens).
- Samkjørt `border-radius`/padding mellom `.sp-notice` og `.sp-safety`
  (var 3px/10px 14px vs. 4px/14px 16px selv om de visuelt er ment som
  søsken — kun ulik alvorlighetsfarge).
- Bevisst UTELATT fra denne rettingen (større, mer produktavhengige
  endringer — egen vurdering senere): konsolidering av de 6+ nesten-like
  sekundærtekst-størrelsene (10.5–13.5px) til en fast type-skala, og
  restrukturering av mobil-scrollrekkefølgen (kart/tegnforklaring kommer
  før resultatlisten — ~3700px scroll til første stedsforslag).

## 0.22.1 — "Vis flere"-paginering av resultatlisten
Bruker påpekte at selv om ALLE steder må scores for å avgjøre rangeringen,
er det ikke nødvendig å faktisk BYGGE og sette inn HTML for samtlige
kvalifiserende steder med det samme — foreslo "hent flere" eller
progressiv lasting ved scroll.

Selve scoringen (`scoreLocation()` for alle steder, uendret av dette) må
fortsatt skje for alle for at "X av Y"-tallene og sorteringen skal være
riktige — det som endres er kun rendering-steget: hvert kort involverer
flere underberegninger (`terrainMicrotips`, `crossSpeciesTipsHtml`,
`knownFindsHtml`) som var unødvendig kostbare å bygge for hundrevis av
steder ingen uansett rakk å scrolle forbi.

- Ny `visningsAntallListe` (start: `VISNING_STEG_LISTE` = 30) styrer hvor
  mange kort som faktisk bygges/settes inn i DOM-et. En "Vis X flere
  steder (Y igjen)"-knapp nederst i lista øker den med 30 og re-rendrer
  (billig, takket være scoreCache fra v0.21.15) når det er flere igjen.
  Flatehogde steder telles i SAMME paginerings-"budsjett" som anbefalte —
  dukker først opp når alle anbefalte er vist.
- Nullstilles automatisk (ikke bare ved eksplisitt klikk) når selve
  resultatgrunnlaget endrer seg — filter/fylke/kommune/radius/art/
  visningsmodus/scoreterskel/favoritter/skjul-flatehogd — via en enkel
  signatur-sammenligning i `render()`, slik at et helt NYTT søk alltid
  starter på side 1, mens en uavhengig re-render (f.eks. en toggle som
  ikke påvirker resultatlisten) ikke nullstiller paginering brukeren
  aktivt har bygget opp.
- "X av Y steder vist"-teksten viser nå det FAKTISK renderte antallet
  (post-paginering), ikke bare antallet som kvalifiserer — mer ærlig
  match mot det som faktisk står i lista.
- Kjent, bevisst avveining: et "Vis flere"-klikk bygger foreløpig HTML for
  ALLE viste kort på nytt (inkl. de som allerede var synlige), ikke bare
  de nye — enkel, lav-risiko implementasjon fremfor inkrementell
  DOM-appending. Bundet av totalt viste kort (ikke hele det nasjonale
  datasettet), så kostnaden vokser proporsjonalt med hvor mange sider
  brukeren faktisk har bedt om å se, ikke med datasettets størrelse.
- Verifisert: pagineringsmatematikken (grensetilfeller — nøyaktig 30,
  31, blandet anbefalte/flatehogde) kjørt isolert i Node med korrekt
  resultat i alle tilfeller. I preview (kun 2 demo-steder, under
  terskelen for paginering) bekreftet ingen regresjon — telletekst og
  korttall uendret riktig, ingen "vis flere"-knapp der den ikke trengs.

## worker/api — 2026-08-13 (produksjonshotfix, ingen APP_VERSION-bump nødvendig)
Kun `worker/api/wrangler.toml` — bruker meldte at `wrangler deploy` for v0.22.0 feilet med
`Authentication error [code: 10000]` mot
`.../workers/scripts/fungifinder-api/subdomain`.

Loggen (`~/Library/Preferences/.wrangler/logs/`) viste at selve
kodeopplastingen lyktes ("Uploaded fungifinder-api"), men wrangler avbrøt
DERETTER hele kommandoen — FØR den egendefinerte ruten
(`api.fungifinder.no`) ble bekreftet bundet til den nye opplastingen —
fordi et helt separat, kosmetisk API-kall (sjekk av status på den gamle
`workers.dev`-underdomene-URL-en, som dette prosjektet bevisst ikke bruker)
fikk 401 fra Cloudflare. Kallet skjedde fordi `workers_dev` aldri var satt
eksplisitt — kommentaren i filen stemte i sak (en egendefinert route slår
AV workers.dev NÅR deployen fullfører), men wrangler prøvde likevel å
SJEKKE gjeldende status før den rakk dit.

- La til `workers_dev = false` i `wrangler.toml` — forteller wrangler å
  hoppe over hele det steget.
- Verifisert: `wrangler deploy` kjørt på nytt fullførte denne gangen helt
  uten feil ("Deployed fungifinder-api triggers — api.fungifinder.no
  (custom domain)", ny Version ID). Bekreftet live med to ufarlige,
  ikke-muterende kall: `GET /meg` → 200 (som alltid), `GET /delte/funn`
  (v0.22.0 sitt nye endepunkt) → 401 (krever innlogging — bekrefter at
  selve ruten faktisk er registrert og live, ikke 404).

## 0.22.0 — Del egne funn med andre påloggede brukere (opt-in)
Bruker ba om at påloggede kan velge å dele egne funn med andre innloggede.
Avklart før implementering (se samtalen 2026-08-13): (1) ÉN global
av/på-bryter, ikke per-funn, (2) andre ser art/sted/dato + hvem som fant
det (ikke anonymt), (3) rent informativt kartlag — påvirker IKKE
score-beregningen for andre brukere.

- **Ny D1-fri innstilling**: `delFunn` (boolsk, default false) lagt til i
  samme personlige JSON-blob som finds/cuts/hogstOmrader/customLocations/
  favoriteSpecies (`bruker_data`-tabellen, ingen migrasjon nødvendig).
  `worker/api/src/routes/data.js` sin rensk-logikk skiller nå eksplisitt
  ARRAY_NOKLER fra dette ene boolske feltet.
- **Ny endepunkt `GET /delte/funn`** (`hentDelteFunn()` i samme fil, kun
  `requireSession`, ingen admin-krav): finner alle AKTIVE, ikke-slettede
  brukere med `delFunn=true` (utenom deg selv), og løser hvert funns
  `locId` mot ENTEN et delt `terreng_steder`-punkt ELLER den delende
  brukerens EGNE `customLocations` (aldri delt i sin helhet — kun de
  spesifikt refererte koordinatene slippes ut). Returnerer kun
  `{art, dato, lat, lon, kortnavn}` — ALDRI mengde/notat/finn-id.
- **Nytt kartlag "Delte funn (andre brukere)"** (fiolett, `#8451C7` —
  skilt fra egne funn/brunt og Artsdatabanken/blått), lastet én gang per
  økt (`loadDelteFunn()`) siden datasettet er begrenset av antall
  DELENDE brukere, ikke et nasjonalt datasett — ingen kartutsnitt-
  begrensning nødvendig (i motsetning til Artskart-laget, v0.21.11).
  Filtreres på aktiv(e) art(er) som de to andre funn-lagene.
  Popup viser art, dato og "Funnet av `<kortnavn>`" — ingen redigering
  (det er ikke ditt funn).
- **Ny bryter i Konto-fanen**: "Del mine funn med andre påloggede
  brukere", med forklarende tekst om nøyaktig hva som deles. Påvirker
  ikke egen scoreCache (kun hva ANDRE ser), så ingen `bumpScoreCache()`
  ved klikk — kun lagring (`saveDelFunn()` → `persistAll()`) + re-render.
- `loadDelteFunn()` kjøres parallelt med de andre oppstartslastingene i
  `init()`, samt i kode-basert innlogging og invitasjonsregistrering
  (samme steder som allerede måtte dekke `loadArtsfunn()` sitt
  "ingen sideomlasting"-tilfelle) — og nullstilles ved utlogging.
- **Verifisert mot lokal D1** (wrangler dev, seedet to testbrukere): satte
  `delFunn=true` og to funn (ett mot et delt `terreng_steder`-punkt, ett
  mot en egen `customLocations`-oppføring, inkl. et notatfelt) for én
  bruker, hentet `/delte/funn` fra en ANNEN brukers sesjon — ga korrekt
  begge funnene med riktig kortnavn/koordinater, notat/mengde ALDRI med.
  Bekreftet egne funn ALLTID ekskluderes fra egen `/delte/funn`-respons,
  at `delFunn=false` umiddelbart skjuler funnene for andre (dynamisk, ikke
  cachet), og at en ugyldig verdi (streng i stedet for boolsk) trygt
  coerces til `false`. Frontend verifisert uten regresjon (ingen nye
  konsoll-feil, ny bryter/kartlag-oppføring til stede i DOM-et) — selve
  UI-flyten IKKE kjørt gjennom en ekte innlogget nettleserøkt (samme
  begrensning som v0.21.16, krever ekte sesjonscookie).
- **NB: krever `npx wrangler deploy`** fra `worker/api/` for å ta
  endepunktet i bruk i produksjon — pushes ikke automatisk slik
  GitHub Pages-frontend-delen gjør.

## 0.21.16 — Statistikk-fanen viser mest populære favoritt-sopper
Bruker ba om et sammendrag av mest populære favoritt-sopper på
Statistikk-fanen (admin).

- **Backend** (`worker/api/src/routes/admin.js`, `hentStatistikk()`): ny
  `favoritter.topp` — teller `bruker_data.data.favoriteSpecies` PER ART på
  tvers av alle brukere (samme JS-loop over `bruker_data` som allerede
  telte antall favoritter per bruker, nå også tallfestet per art), sortert
  synkende. Kun rå artsID-er returneres (SPECIES-navnene finnes kun i
  frontend). Bevisst ikke filtrert bort permanent slettede brukere, samme
  begrunnelse som resten av statistikken.
- **Frontend** (`renderAdminStatistikk()` i `js/app.js`): ny seksjon
  "Mest populære favoritt-sopper", samme listestil som
  fylke/kommune-oversiktene. Slår opp artsnavn mot `SPECIES`, med fallback
  til rå ID for en art som skulle bli fjernet fra `SPECIES` mens en bruker
  fortsatt har den lagret som favoritt.
- Verifisert mot lokal D1 (wrangler dev, seedet 3 testbrukere med
  overlappende favoritter): `/admin/statistikk` ga korrekt aggregert og
  sortert `favoritter.topp` (`kantarell: 3, steinsopp: 2,
  traktkantarell: 2`, matcher forventet telling). Rendering-logikken
  kjørt isolert i Node med samme data ga korrekt HTML, inkl. tomtilstand
  og fallback for ukjent art-ID. IKKE verifisert i selve nettleser-UI-et
  (krever en ekte innloggingsflyt for en HttpOnly-sesjonscookie, som ikke
  lar seg simulere fra klient-JS).

## 0.21.15 — Cache scoreLocation()-resultater (raskere bytte "Én art" ↔ "Mine favoritter")
Bruker meldte at bytte fra "Én art" til "Mine favoritter" tok noen
sekunder, og spurte om samme rekkefølge/venting-årsak som forrige
melding (artsobservasjoner). Undersøkt: nei — visningsbytte er helt
synkront, ingen `await`/nettverkskall involvert. Den faktiske årsaken:
"Mine favoritter" beregner full score for HVER favoritt på HVERT sted (for
å finne beste treff per sted), så kostnaden ganges med antall favoritter
sammenlignet med "Én art" — med et nasjonalt (ufiltrert) datasett på
flere tusen steder blir det fort mange tusen `scoreLocation()`-kall,
synkront på hovedtråden.

- `scoreLocation(art, sted)` cacher nå resultatet sitt (nøkkel
  `art.id + '|' + sted.id`) — en ren funksjon av det paret OG en håndfull
  delt, muterbar tilstand den leser (se scoreLocation() sin doc-kommentar
  for full liste). Gjør GJENTATT bytte mellom visningsmodi tilnærmet
  gratis (samme par regnes ikke om og om igjen), og gir samme gevinst for
  andre steder som scorer samme art/sted-par i én økt
  (`crossSpeciesTipsHtml`, `knownFindsHtml`) — ingen endring i FØRSTE
  gangs kostnad, kun repetert arbeid som elimineres.
- Cachen tømmes eksplisitt (`bumpScoreCache()`) ved ethvert av: ny
  terrengdata lastet (`loadLocations()`), egne data lastet/lagret
  (`loadStorage()`/`persistAll()` — FELLES sted for alle `saveXxx()`-kall,
  inkl. flatehogd-merking, hogstfelt, funn, egne steder OG
  enrichment-poll-oppdateringer), værdata (`loadWeather()`/
  `loadSeasonWeather()`), og de fem "vektlegg …"-togglene som faktisk
  påvirker scoren (ikke `hideHogst`/`artskartOnlyRecent`, som kun
  filtrerer/viser — ikke scorer).
- Verifisert i preview: 6× repetert bytte mellom "Én art"/"Mine
  favoritter" (3 favoritter valgt) ga ingen nye konsoll-feil og korrekt,
  uendret innhold. Selve tidsgevinsten er ikke målbar lokalt (demo-data
  har kun 2 steder) — reell effekt forventes først med et fullt,
  innlogget datasett.

## 0.21.14 — Heve terskel for "godt analysert" (20 → 100)
Bruker meldte at 20 punkter var for lavt: admin velger gjennomgående
minste gridstørrelse ved analyse, som gir langt tettere punktdekning per
kommune enn 20 antydet — en kommune med kun spredt/delvis dekning kunne
dermed feilaktig telle som "godt analysert".

- `KOMMUNE_GOD_DEKNING_MIN` (js/app.js, drives `renderDataNotice()` fra
  v0.21.12) hevet fra 20 til 100. Ingen annen logikk endret.
- Ikke observerbart i lokal preview (krever ekte, innlogget terrengdata) —
  kun kodesti verifisert (syntaks OK, ingen nye konsollfeil, "Om dataene"
  faller fortsatt korrekt tilbake til "logg inn for å se full oversikt"
  for en ikke-innlogget besøkende).

## 0.21.13 — Fiks: nettverksfeil ved oppstart veltet HELE appen, ikke bare innlogging
Oppdaget under verifisering av v0.21.12: `initAuth()` fanget ikke opp en
nettverksfeil fra `ApiClient.meg()` (`fetch()` som feiler helt, f.eks.
frakoblet enhet eller worker midlertidig nede — i motsetning til et
vanlig HTTP-feilsvar som 401/500, som allerede håndteres fint). Dette
kastet ufanget gjennom `await Promise.all([geolocateStartupView(),
initAuth()])` i `init()` og VELTET resten av oppstart-kjeden
(`loadLocations`, `loadArtsfunn`, `loadStorage`, `render()`,
`loadWeather()` — bokstavelig talt alt etter det punktet). Appen ble
stående helt blank/ubrukelig i stedet for å falle tilbake til
"ikke innlogget, viser eksempeldata" slik den er designet for.

- `initAuth()` fanger nå feilen og fortsetter som ikke innlogget (samme
  fang-og-fortsett-mønster som `loadLocations()`/`loadFetchedAreas()`/
  `loadArtsfunn()` allerede bruker).
- Verifisert i preview: uten en tilgjengelig API-worker viste appen
  tidligere en helt blank/ikke-oppdatert side (ingen artsliste, kart-data
  aldri lastet); etter fiksen laster art-liste/kart/score normalt i
  "ikke innlogget"-modus, og "Om dataene" sin nye kommuneliste (v0.21.12)
  viser korrekt "logg inn for å se full oversikt".

## 0.21.12 — "Om dataene" viser nå faktisk hvilke kommuner som er godt analysert
Bruker ba om oppdatert tekst i "Om dataene"-varselet: den gamle
"hentes on-demand av admin for hvert nye område"-formuleringen var
misvisende for en vanlig bruker (kun admin kan faktisk trigge nye
hentinger, se `requireAdmin` i `worker/api/src/routes/omrader.js`), og
nevnte ikke hvilke kommuner som faktisk har god dekning. Listen er bevisst
IKKE hardkodet i HTML-en — datasettet vokser etter hvert som admin
analyserer flere kommuner (se `D1-MIGRASJON.md`), og en statisk liste ville
blitt stille utdatert.

- Ny `renderDataNotice()`: teller `BASE_LOCATIONS` (server-hentet grid-data,
  IKKE `customLocations` — egne personlige steder skal ikke gjøre en
  kommune admin aldri har analysert se "godt analysert" ut) per kommune,
  og lister alle med ≥ `KOMMUNE_GOD_DEKNING_MIN` (20, justerbar terskel,
  ingen fasit finnes ennå) punkter, alfabetisk (`localeCompare('no')`).
- Beregnes kun på nytt når HELE datasettet faktisk er lastet
  (`fylkeFilter==='alle'`) — `analyserteKommunerCache` husker forrige
  nasjonale snapshot uendret mens brukeren filtrerer til ett fylke/én
  kommune (der `BASE_LOCATIONS` kun er DEN filtrerte undermengden, se
  `loadLocations()`), i stedet for å feilaktig vise kun det filtrerte
  utvalgets kommuner. Viser "logg inn for å se full oversikt" for en
  ikke-innlogget besøkende (samme begrensning som all annen terrengdata —
  `/terrengdata` krever sesjon).
- Teksten for øvrig oppdatert: nevner nå eksplisitt at egne funn vises
  annerledes enn Artsdatabanken-prikkene, og at artsobservasjoner først
  vises ved et mindre kartutsnitt (jf. v0.21.11).

## 0.21.11 — Artsdatabanken-laget tegnes ikke lenger ved en vid, uavgrenset visning
Bruker ba om at artsobservasjoner ikke skal hentes/tegnes før fylke/kommune
er valgt, eller kartet er zoomet inn til et nivå tilsvarende det — mistanke
fra forrige melding (kartet "mister fokus på min posisjon") om at for mange
observasjoner ble hentet/tegnet, som riktignok viste seg å ha en annen,
deterministisk rotårsak (se v0.21.10), men selve mistanken var likevel
delvis treffende: `loadArtsfunn()`s bbox-filter er bundet til kartets
SYNLIGE utsnitt — ved default oppstart (Alle fylker, hele Norge synlig,
zoom 6) ER det synlige utsnittet hele landet, så bbox-filteret alene
beskyttet ikke mot akkurat det tilfellet.

- Ny `artskartOmradeErAvgrenset()`: sann når et konkret fylke/kommune/
  radius-senter er valgt (uansett zoomnivå).
- Ny `artskartSkalHentesOgVises()`: sann når området over er avgrenset,
  ELLER kartets zoomnivå er ≥ `ARTSKART_MIN_ZOOM` (9 — ca. tilsvarende et
  gjennomsnittlig fylke-utsnitt eller mindre, uavhengig av om et filter
  faktisk er valgt — dekker "zoomet manuelt inn uten å bruke
  fylke/kommune-velgeren").
- `loadArtsfunn()` gir nå opp FØR noe nettverkskall hvis dette er usant
  (ingen henting), og `renderArtskartLayer()` tegner ingenting (selv om
  `artsfunn` skulle ha data hengende igjen fra en tidligere, mer avgrenset
  visning — f.eks. rett etter å nullstille et fylkevalg).
- `render()` trigger nå i tillegg en fire-and-forget
  `loadArtsfunn().then(renderArtskartLayer)` — dekker tilfeller der et
  filtervalg alene endrer om laget skal vises UTEN at kartets synlige
  utsnitt faktisk beveger seg (og dermed ikke ville trigget den eksisterende
  `moveend`-lytteren). `loadArtsfunn()` er billig å kalle for ofte —
  gir umiddelbart opp uten nettverkskall både når området ikke er avgrenset
  nok, og når gjeldende utsnitt allerede er dekket av forrige hent.
- IKKE end-to-end-verifisert mot ekte innlogget sesjon/ekte Artskart-data
  (denne økten manglet en kjørende `fungifinder-api`-worker og ekte
  D1-innhold) — kun kodesti/logikk lest og resonnert gjennom, samt
  bekreftet at appen fortsatt laster uten nye konsoll-feil.

## 0.21.10 — Hev geolokasjons-timeout ved oppstart (kartet viste "hele Norge" i stedet for posisjon)
Bruker meldte at kartet innimellom mister fokus på "min posisjon" ved
sideinnlasting, eller viser et større utsnitt av Norge som om posisjonen
var ukjent — mistenkte at for mange arts-observasjoner ble hentet/tegnet.

Undersøkt: Artskart-laget (`loadArtsfunn()`) er allerede kartutsnitt-
begrenset siden D1-migrasjonen (steg 2/3) og er ikke synderen. Den faktiske,
deterministiske rotårsaken lå i `geolocateStartupView()`:
`getCurrentPosition()` fikk `{ timeout: 4000 }` — dette er en instruks til
selve geolokasjons-APIet om å gi permanent TIMEOUT-feil (ingen ny sjanse)
hvis en posisjon ikke er funnet innen 4 sek, helt uavhengig av appens egen
"ikke blokkér oppstarten"-frist (en separat `setTimeout(4000)`, uendret).
Forrige økt (2026-08-12, se memory) målte allerede ~8 sek reell ventetid
for "Min posisjon" — godt over dette budsjettet. Når fristen sprakk, forble
`mapFittedOnce` `false`, og appen falt tilbake til å `fitBounds()` over
HELE det nasjonale datasettet (default `fylkeFilter='alle'`) — nøyaktig
symptomet meldt, med ingen mulighet for et sent, men reelt, GPS/WiFi-svar
å rette opp i det (suksess-callbacken var allerede designet for å håndtere
et sent svar — den fikk bare aldri sjansen fordi selve API-kallet var dødt).

- Hevet kun selve `getCurrentPosition()`-fristen (4000ms → 12000ms).
  Appens EGEN frist for å slippe resten av oppstarten videre uten å vente
  på geolokasjon er uendret (fortsatt 4 sek) — første maling forblir like
  rask, men en treg-men-reell posisjonering får nå faktisk lov til å komme
  gjennom og rette opp kartet i stedet for å bli drept for tidlig.
- IKKE live-verifisert mot en ekte GPS/WiFi-triangulering (sandkasse-
  nettleseren her avslår geolokasjon momentant, samme begrensning som
  tidligere `useMyLocation()`-rettelser) — kun kodesti/logikk verifisert,
  appen for øvrig uendret i preview.
- Svarer på oppfølgingspunkt 1 fra 2026-08-12-økten ("min posisjon er
  treigt, ~8 sek observert") — se memory
  `fungifinder-oppfolgingspunkter` — som nå kan lukkes.

## 0.21.9 — Fiks stale kommuneregister-cache (Våler/Østfold-disambiguering feilet fortsatt)
Bruker meldte at v0.21.8 fortsatt ga "Våler finnes i flere fylker ( og )"
— med TOMME fylkesnavn i parentesen — selv med Østfold valgt i
"snevre inn"-menyen, og at kartet ikke zoomet inn.

Rotårsak: `loadKommuneRegister()` setter `kommuneRegister` synkront fra den
korrekte, hardkodede tabellen (v0.21.8), men leser deretter en
`localStorage`-cache (`fungifinder-kommuneregister`, 30 dagers levetid) og
overskriver den gode tabellen stille hvis en gyldig-etter-alder cache
finnes. Alle som hadde besøkt appen FØR v0.21.6 (da Kommuneinfo-APIets
`fylkesnavn`-utledning var ødelagt og alltid ga `null`) satt igjen med en
alders-messig gyldig, men innholdsmessig ødelagt cache — den ble lastet
inn igjen og gjorde enhver `fylkesnavn === valgtFylke`-sammenligning
(`resolveKommuneNavn()`, `kommunerIFylke()`) permanent usann i opptil 30
dager til, uavhengig av hva brukeren valgte i fylkevelgeren.

- Cache-nøkkelen er versjonert (`fungifinder-kommuneregister` →
  `-v2`) — ugyldiggjør automatisk alle caches skrevet før denne rettelsen,
  uten å måtte stole på at alder alene fanger opp innholdsfeil.
- I tillegg valideres selve innholdet før en cache stoles på (minst én
  oppføring må ha et faktisk `fylkesnavn`, ikke bare riktig alder/
  array-lengde) — vern mot at samme klasse feil kan snike seg forbi igjen
  ved en fremtidig endring i hva som caches.
- Verifisert i preview: satte en simulert gammel, ødelagt cache
  (`fylkesnavn: null` for både Våler-oppføringene) under den gamle
  nøkkelen, lastet siden på nytt — Østfold + Våler zoomet korrekt inn uten
  feilmelding, og den nye `-v2`-nøkkelen ble skrevet med riktige
  fylkesnavn mens den gamle, ubrukte nøkkelen ble stående urørt.

## 0.21.8 — Kommuneregisteret (357 kommuner) hardkodet, samme mønster som bboksene
Bruker spurte hvorfor kommunelisten måtte hentes fra Kartverket "hver
gang", og om ikke en nesten-statisk liste burde kunne caches mer effektivt.
Presist svar: den ble IKKE hentet hver gang (30-dagers `localStorage`-cache
fantes allerede), men det hjelper ikke ved kaldt førstebesøk (akkurat det
v0.21.6 målte 19+ sekunder for) eller etter at Safari ITP sletter
`localStorage` — samme kjente irritasjon som GitHub-PAT-en/været hadde.
D1 dekker det heller ikke i dag: `terreng_steder` har kun kommune/fylke for
de ~20 kommunene med faktisk hentet terrengdata, ikke det fulle
357-registeret dropdownen/disambigueringen trenger.

- `KOMMUNE_REGISTER_STATISK` (357 `[navn, fylke]`-par) lagt til, generert
  fra samme kilde som `KOMMUNE_BBOX` (ws.geonorge.no/kommuneinfo/v1,
  fylke utledet fra kommunenummer-prefiks). `loadKommuneRegister()`
  populerer nå `kommuneRegister` fra denne tabellen SYNKRONT som første
  linje — appen er brukbar med full liste + Herøy/Våler-disambiguering
  momentant, uansett nettverksstatus.
- I motsetning til bboksene (som KUN virker ved eksakt navnetreff) beholdes
  selve Kartverket-oppslaget som en ekte bakgrunns-OPPFRISKNING (ikke bare
  en feil-fallback) — en fremtidig kommunereform (neste kjente: 2028)
  plukkes opp automatisk innen `CACHE_MAX_AGE_DAYS`, ingen manuell
  tabell-regenerering nødvendig for at appen skal forbli korrekt.
- Fjernet en reell bug i samme slengen: feilhåndteringen satte tidligere
  `kommuneRegister = []` ved et mislykket Kartverket-kall (f.eks.
  frakoblet) — tømte dermed den gode statiske tabellen i stedet for å bare
  beholde den. Live-oppslaget er nå en raffinering, aldri en forutsetning.
- Verifisert i preview: `sp-kommune-datalist` hadde 357 `<option>`-
  elementer praktisk talt momentant etter sideinnlasting (ingen bevisst
  ventetid), både med og uten en fullført Kartverket-respons.

## 0.21.7 — Fiks: server-filteret blandet data fra tvetydige kommuner
Oppfølger til v0.21.6, samme rotårsaksklasse: `currentServerFilterParams()`
(som styrer selve `/terrengdata`-kallet, se `loadLocations()`) sendte KUN
`kommune`, aldri `fylke` — selv når brukeren hadde disambiguert "Våler,
Østfold" via "snevre inn"-menyen. v0.21.3 disambiguerte kun
henting/zoom/estimat (se der), aldri selve datalastingen. Konsekvens: valgte
man Østfold-Våler, ville appen likevel vise EVENTUELLE Innlandet-Våler-steder
også, siden serveren filtrerte `WHERE kommune='Våler'` uten noe fylke-vilkår
— feil DATA vist, ikke bare feil kart-zoom.

- Ingen Worker-endring nødvendig: `hentTerrengStederFraDb()`
  (`worker/api/src/lib/terrengDb.js`) støttet allerede `fylke`+`kommune`
  samtidig (AND) — kommentaren der sa det rett ut: "i praksis sender app.js
  kun det ene, aldri begge". Ren klient-fiks.
- `currentServerFilterParams()` sender nå `fylke` i tillegg til `kommune`
  når kommunenavnet faktisk er tvetydig (finnes i `kommuneRegister` under
  flere fylker) OG disambiguert via `kommuneNarrowFylke` — uendret for de
  ~355 entydige kommunenavnene.
- Verifisert: siden `loadLocations()` avslutter tidlig uten innlogget
  bruker (umulig å teste ende-til-ende i en backend-løs preview), er
  `currentServerFilterParams()`-logikken testet isolert i Node mot 6
  representative tilfeller (begge disambiguerte fylker, uløst
  tvetydighet, entydig kommune, tomt/ikke-lastet register, uendret
  fylke-modus) — alle 6 korrekte.

## 0.21.6 — Fiks: fylkevalg for tvetydig kommune zoomet ikke; raskere kommuneliste
To presiseringer fra bruker etter v0.21.4/0.21.5:

1. **"Velger jeg Våler, og deretter Østfold, skjer det tilsynelatende ikke
   noe. Velger jeg Våler i Innlandet, virker det som det zoomes inn."**
   Rotårsak: "snevre inn til fylke"-nedtrekket (`sp-kommune-narrow-fylke`)
   satte kun `kommuneNarrowFylke` og re-renderte filter-KONTROLLENE — det
   trigget aldri et nytt kart-zoom eller en ny data-henting. Rekkefølgen
   "fylke først, kommune etterpå" fungerte fordi kommune-feltets EGEN
   commit da allerede leste riktig fylke. Rekkefølgen "kommune først"
   zoomet (feil/tvetydig, samme som beskrevet i v0.21.3) idet feltet mistet
   fokus, og selve fylkevalget etterpå gjorde ingenting for å rette det opp
   — helt stille, kun det usynlige ⚠-varselet som forsvant uten noen synlig
   effekt av at det forsvant. Fikset: fylke-nedtrekkets `change`-handler
   kjører nå samme zoom+data-oppfriskning som kommune-feltets commit, men
   kun når et kommunenavn faktisk allerede er valgt.
   - Verifisert i preview (begge rekkefølger, `L.Map.prototype.fitBounds`-
     hook): "kommune først" ga tidligere 0 nye `fitBounds()`-kall ved
     fylkevalg — gir nå 1, med korrekt Østfold-bbox. "fylke først" var og
     er fortsatt korrekt (Innlandet-bbox), ingen regresjon.
2. **"Lang ventetid før jeg kan velge kommune første gang."**
   `loadKommuneRegister()` (Kartverkets Kommuneinfo-API, 357 kommuner) sto
   HELT SIST i oppstartskjeden — etter innlogging, geolokasjon OG all
   terrengdata — selv om den er en helt uavhengig, offentlig kilde uten
   noen reell avhengighet til resten. Startes nå parallelt med aller første
   kall i stedet, så ventetiden blir MAX(dette kallet, resten av
   oppstarten) i stedet for SUMMEN. Målt i preview: fra "ikke ferdig etter
   19+ sekunder" til "ferdig på 3 sekunder" i samme (backend-løse)
   testmiljø.

**Kjent, beslektet, IKKE fikset i denne runden**: selve server-filteret
(`hentTerrengStederFraDb()` i `worker/api/src/lib/terrengDb.js`) filtrerer
kun på `WHERE kommune = ?` uten fylke — hvis terrengdata noensinne hentes
for BEGGE Våler- eller Herøy-kommunene, ville et kommune-valg (uansett
hvilket fylke som velges) vise en SAMMENBLANDET datamengde fra begge, siden
selve datalastingen (ikke bare zoom/estimat/henting, som ble fikset i
v0.21.3) aldri ble disambiguert med fylke. Mer alvorlig enn zoom-buggen
(feil DATA vist, ikke bare feil kartutsnitt), men mer invasivt å fikse
(krever endring i Worker API + en deploy) — tatt opp separat med bruker,
ikke besluttet ennå om/når dette skal rettes.

## 0.21.5 — Alle 357 kommune-bbokser hardkodet (samme mønster som fylke)
Oppfølger til punkt 2 fra en eksplisitt vurdering av tre alternativer
2026-08-12 (status quo / sentral D1-lagring / statisk tabell) — statisk
tabell valgt for best gevinst/innsats-forhold uten ny serverinfrastruktur.

- `KOMMUNE_BBOX` (357 oppføringer) lagt til rett etter `FYLKE_BBOX`,
  generert av et engangs Python-script mot Nominatims strukturerte søk
  (`city=`+`county=` for de to eneste navnekollisjonene i dagens
  kommuneregister — Herøy og Våler, verifisert mot Kartverkets
  Kommuneinfo-API). `fetchAreaBbox()` sjekker denne tabellen for
  kommune-modus FØR Nominatim-fallbacken (som beholdes uendret for et navn
  som ikke finnes her, f.eks. etter en fremtidig reform).
- **Manuell etterkontroll av alle 357** avdekket og fikset ett reelt feil
  resultat: "Kvam" (Vestland) hadde ikke noe `municipality`-treff under det
  vanlige søket — OSM sitt offisielle navn er "Kvam herad", ikke "Kvam
  kommune" — søket plukket i stedet en bygd med samme navn i Steinkjer,
  Trøndelag. Fikset manuelt med et fritekst-søk for akkurat denne ene
  kommunen. 7 Buskerud-kommuner manglet fylkesnavn i Nominatims
  `display_name` (sannsynlig etterlevning av Viken-sammenslåingen/
  -oppløsningen i OSM), men hadde hver ett sikkert `municipality`-treff med
  plausibel kommune-størrelse — vurdert som en visningstekst-kvirk, ikke
  rettet.
- **Gevinst**: samme som fylke-fiksen i v0.21.2 — null nettverksavhengighet,
  ingen Safari ITP-cache-tap, delt "for alltid" på tvers av alle
  enheter/brukere uten noen ny D1-tabell/endepunkt/cron-jobb.
- Verifisert i preview: `fetchAreaBbox('kommune', 'Bergen')` (representativ
  for 355 av 357 — entydige navn) traff tabellen direkte, null
  Nominatim-kall, riktig bbox bekreftet via en `L.Map.prototype.
  fitBounds`-hook. De to tvetydige navnene (Herøy/Våler) er verifisert
  KORREKTE I TABELLEN (kryssjekket mot live Nominatim-data), men selve
  UI-disambigueringsveien (`resolveKommuneNavn()`, upåvirket av denne
  endringen) kunne ikke bekreftes ende-til-ende i denne statiske
  forhåndsvisningen uten en kjørende Worker-backend —
  `loadKommuneRegister()` rakk ikke fullføre innen rimelig ventetid uten
  ekte auth/API-kall foran den i oppstartskøen. Anbefaler en rask manuell
  sjekk i en ekte, innlogget økt: velg "Kommune" → skriv "Våler" → velg
  "Østfold" i innsnevrings-nedtrekket → bekreft at kartet zoomer til
  Østfold (59.4°N, 10.9°Ø), ikke Innlandet (60.8°N, 12.0°Ø).

## 0.21.4 — "Min posisjon" oppleves raskere + tydelig ventestatus
Bruker meldte ~8 sek snitt-ventetid på "min posisjon"-klikket, uten noe
visuelt tegn på at noe skjedde i mellomtiden — så ut som kartet hadde
hengt seg. Selve GPS/WiFi-trianguleringen skjer i nettleser/OS og kan ikke
gjøres raskere herfra, men tre reelle tiltak i `useMyLocation()` (delt av
alle tre stedene som bruker "min posisjon": kartknappen, finn-modalens
posisjonsvelger, og "flytt til min posisjon" for et registrert funn):

- **`maximumAge`** var 0 (default) — hvert klikk tvang fram et helt ferskt
  oppslag, selv rett etter at `geolocateStartupView()` allerede hadde gjort
  nøyaktig samme oppslag for få sekunder siden. Kartknappen bruker nå
  samme 5-minutters vindu som oppstart-geolokasjonen (kan gjenbruke samme
  ferske posisjon momentant); posisjons-/funn-knappene bruker et kortere
  30s-vindu (presisjon teller mer der).
- **`enableHighAccuracy`** er nå per kall i stedet for alltid `true`.
  Kartknappen (kun områdevalg — fylke/kommune-nærhet, radius-senter på
  km-skala) ber nå om lav nøyaktighet, som kan gi et raskere svar
  (spesielt på en laptop uten GPS-brikke, der høy nøyaktighet tvinger fram
  et tregere WiFi-basert oppslag). De to funn-relaterte kallene beholder
  høy nøyaktighet uendret.
- **Ny synlig ventestatus**: knappen viser "⏳ Henter posisjon…" og
  deaktiveres mens vi venter — uansett hvor lang selve ventetiden er, ser
  den ikke lenger ut som et hengende kart.

**Ikke verifisert mot ekte GPS/WiFi-triangulering** (kun kodesti/logikk
verifisert i preview — automatiserte nettlesermiljøer avslår geolokasjon
momentant, ingen reell posisjon tilgjengelig der). Verifisert: riktige
`getCurrentPosition()`-opsjoner sendes per kall (konsoll-sjekk), knappen
viser/skjuler ventestatus korrekt rundt et simulert forsinket kall.

## 0.21.3 — Fiks: tvetydige kommunenavn feilet alltid ved områdehenting
Bruker meldte "Tvetydig via Nominatim (mode=kommune)" ved forsøk på å hente
terrengdata for "Våler i Østfold" — selv med både fylke OG kommune valgt i
UI-et — og at "snevre inn til fylke"-velgeren ikke synlig hjalp med å skille
kommuner med samme navn (Våler finnes i både Østfold og Innlandet).

- **To rotårsaker, begge fikset**:
  1. `startFetch()` sendte alltid det RÅ kommunenavnet til
     `/omrader/hent` — ALDRI disambiguert med fylke, uansett hva brukeren
     hadde valgt i "snevre inn til fylke"-menyen. Den menyen filtrerte kun
     forslagslisten lokalt, ble aldri lest ved selve trigging. Samme
     problem rammet kart-zoom (`zoomToAreaSelection`) og areal-estimatet.
  2. Enda dypere: `loadKommuneRegister()` sitt Kartverk-oppslag antok et
     `fylkesnavn`-felt i API-svaret som **ikke finnes** (kun kommunenavn +
     kommunenummer) — `fylkesnavn` var derfor alltid `null`, og selv om (1)
     hadde vært fikset, ville "snevre inn til fylke" likevel aldri faktisk
     truffet noe. Utleder nå fylket fra kommunenummerets to første sifre
     (offisielt fylkesnummer, f.eks. "3419" → 34 → Innlandet — samme tabell
     som `FYLKE_TO_COUNTY_ID` i fetch_area.py, bare motsatt vei).
- Ny `resolveKommuneNavn()` er nå eneste kilde til disambiguering, brukt av
  alle tre stedene (henting/zoom/estimat) — sender `"Våler, Østfold"` når
  vi faktisk vet hvilken, ellers blokkerer `startFetch()` HER (før en ekte,
  kostbar GitHub Actions-jobb trigges) med en tydelig beskjed om å velge
  fylke, i stedet for å la den feile eksternt.
- Nytt synlig varsel (`#sp-kommune-ambiguous-hint`) rett under
  kommune-feltet når det valgte navnet er tvetydig og uløst — løser at
  brukeren "ikke ser forskjell" (en `<datalist>` kan uansett ikke vise to
  identiske forslag ulikt).

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
