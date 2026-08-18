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
(se under) — disse fire punktene står fortsatt åpne:

- **Trompetsopp**: `gran` i `treslag` er trolig feil retning — kilden sier
  arten sjelden vokser i barskog, og heller foretrekker hassel/eik/asp
  (som uansett ikke kan skilles fra generisk lauvskog i terrengdata-laget,
  se punktet under).
- **Traktkantarell**: `furu` mangler i `treslag` — kilden nevner furu på
  linje med gran.
- **Rødskrubb**: `'rik'` mangler i `berggrunn` — kilden sier arten ikke har
  noen berggrunnspreferanse i det hele tatt, inkludert kalkrik grunn.
- **Kantarell**: `furu` i `treslag` er ikke bekreftet av kilden (kun
  gran/asp/bjørk/bøk/lind/eik/hassel nevnt) — usikkert, bør kryss-sjekkes
  mot en tredje kilde før noe endres, ikke bare fjernes på ett funn.

**Strukturell begrensning som gjelder alle punktene over**: NIBIO SR16
(kilden til `loc.treslag`) skiller ikke lauvtreslag i det hele tatt —
hassel/eik/asp/bøk kan aldri gjenkjennes presist av dagens ETL, bare "et
lauvtre" generisk (mappet til `bjork`). Et forbedret artsprofil-grunnlag
gjør vektingen riktigere, men løser ikke selve presisjonen for
kalkkrevende lauvtre-arter — det krever en egen forbedring av
terrengdata-laget (se eget punkt under).

## Fremtidige mulige utvidelser

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
