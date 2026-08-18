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
  **Ny, billig kandidat-kilde**: appens egne data. `terreng_steder`
  (treslag/fuktighet/berggrunn per punkt) er allerede koblet mot ekte
  Artsdatabanken/Artskart-funn via `kjenteFunnDetaljer` — en spørring som
  "blant steder med bekreftet kantarell-funn, hvor mange har `furu` i
  treslag" er en norsk, empirisk fjerde kilde uten noe nytt
  datainnhentingsarbeid. Samme idé kan brukes til å kryssjekke de tre
  Del 0-punktene før de rettes, og generaliserer værterskel-kalibrerings-
  ideen nederst i dette dokumentet til artsprofil-aksene også. De
  planlagte kalibreringsløpene for Indre Østfold/Vågå/Hitra (se
  Voksestedslaget-artifaktet) produserer uansett ferske Artskart×terreng-
  koblinger for tre representative kommuner — billig å gjenbruke til denne
  sjekken i stedet for et eget analysearbeid senere.

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
