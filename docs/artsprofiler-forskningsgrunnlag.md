# Forskningsgrunnlag for artsprofilene i SPECIES (js/app.js)

**Status: RESEARCH ONLY — ingen scoringsverdier er endret av dette dokumentet.**
Gjennomført 2026-08-18 etter en kritisk gjennomgang av scoringsgrunnlaget
(se samtalen samme dato). Formålet var å finne ut om det finnes et bedre,
kvalitetssikret grunnlag for artenes vekstvilkår (`treslag`/`fuktighet`/
`berggrunn`/`skogalder`/`sesong` i `SPECIES`-arrayen) enn det som lå der fra
appens første commit (8. juli 2026, ukildet).

**Oppdatering 2026-08-18, samme dag:** parasollsopp, sjampinjong og
furuknippesopp er fjernet fra `SPECIES` (og `SPECIES_HUE`/
`WARMTH_LOVING_SPECIES`/`BASE_MICROTIPS`) som direkte konsekvens av funnene
under — de er enten feil scoringsmodell (de to saprotrofe artene) eller har
en omstridt trofisk klassifisering (furuknippesopp). Funnene i seksjonene
under for disse tre står likevel som forskningsgrunnlag for en eventuell
fremtidig gjeninnføring — se [veien-videre.md](veien-videre.md) for planen
rundt det. **Furuknippesopp er siden gjeninnført samme dag (v0.28.12) —
se oppdateringen i seksjonen om arten under.**

**Oppdatering 2026-08-18 (v0.28.8), "Del 0":** de tre konkrete avvikene
under (trompetsopp, traktkantarell, rødskrubb) er nå implementert i
`SPECIES` — se CHANGELOG v0.28.8. Kantarell (furu i treslag) er fortsatt
ikke endret; se [veien-videre.md](veien-videre.md) for status og forsøket
på å avklare den mot appens egne data.

## Metodikk og kildevurdering

Fire kandidater ble vurdert; to ble forkastet, to ble brukt:

- **Forkastet: [norsksopp.no](http://norsksopp.no)** — kontakt-e-post peker
  til et helt urelatert domene (`info@yuangnauy.com`). Sterkt tegn på en
  lavkvalitets content-farm, ikke en fagredigert kilde.
- **Forkastet som primærkilde: [soppognyttevekster.no](https://soppognyttevekster.no)
  (NSNF/Normlisten)** — ekte, offentlig tilgjengelig norsk kilde (Norges
  sopp- og nyttevekstforbund, ansvarlig for soppkontroll), men habitatteksten
  er for grunn til å være mer presis enn det appen allerede har (typisk
  "løv- og barskog").
- **Brukt for de 10 vanlige artene: [Artfakta — SLU Artdatabanken](https://artfakta.se)**
  (Sveriges søsterorganisasjon til Norges Artsdatabanken). Offentlig, gratis,
  ekspertskrevet "Ekologi"-seksjon per art med eksplisitte kildehenvisninger
  til fagbøker/vitenskapelig litteratur (bl.a. Hallingbäck & Aronsson (1998)
  *Ekologisk katalog över storsvampar och myxomyceter*). Svensk, ikke norsk
  — økologisk sett tett overlappende med Sør-/Midt-Norge, men ikke identisk,
  så behandlet som sterk **sekundærkilde**, ikke automatisk fasit.
- **Brukt for de 2 rødlistede artene: Norges egen [Artsdatabanken —
  Rødlista](https://artsdatabanken.no)** — har fulle, detaljerte
  vurderingstekster for rødlistede arter (i motsetning til vanlige/LC-arter,
  der siden er tom — bekreftet direkte for kantarell).

**Viktig strukturell begrensning som gjelder ALLE funn under**: NIBIO SR16
(kilden til `loc.treslag` i terrengdata-laget) skiller ikke lauvtreslag i
det hele tatt — hassel/eik/asp/bøk kan aldri gjenkjennes presist av dagens
ETL, bare "et lauvtre" generisk (mappet til `bjork`, se `TRESLAG_MAP` i
`fungifinder-db/scripts/fetch_area.py`). Et bedre artsprofil-grunnlag gjør
scoringsVEKTINGEN riktigere, men løser ikke denne presisjonen for
kalkkrevende lauvtre-arter — det krever en separat forbedring av
terrengdata-laget selv.

## Funn per art

### Kantarell (*Cantharellus cibarius*)
Kilde: [artfakta.se/taxa/3213](https://artfakta.se/taxa/3213)
> "Bildar mykorrhiza med gran, asp, björk, bok, lind, ek och hassel i både barr- och lövskog."

App har `treslag:['gran','furu','bjork']`. **Avvik: furu er ikke nevnt i
kilden i det hele tatt.** Ett oppfølgende søk ga ingen klar bekreftelse
eller avkreftelse av furu-tilknytning for kantarell — **usikker, bør
kryss-sjekkes mot en tredje kilde før noe endres.**

### Traktkantarell (*Craterellus tubaeformis*)
Kilde: [artfakta.se/taxa/3217](https://artfakta.se/taxa/3217)
> "Barrskog och bokskog. Sällan annan lövskog. Marken, bland mossa. Med gran, tall och bok. Helst sur och mager mark."

App har `treslag:['gran']` KUN. **Avvik: furu (tall) mangler** — kilden
nevner furu på linje med gran. `berggrunn:['fattig','moderat']` stemmer
grovt med "sur och mager mark" (fattig), men "moderat" er kanskje noe
generøst gitt "helst".

### Trompetsopp (*Craterellus cornucopioides*)
Kilde: [artfakta.se/taxa/3772](https://artfakta.se/taxa/3772)
> "Löv- och blandskog. Sällan barrskog. Marken, under ek, hassel och asp."

App har `treslag:['bjork','gran']`. **Avvik: gran (barskog) er trolig feil
retning** — kilden sier eksplisitt "sällan barrskog". Ekte preferanse er
hassel/eik/asp, som uansett ikke kan skilles fra generisk "bjork" i
terrengdata-laget (se strukturell begrensning over) — selv en korrigert
`treslag`-verdi løser ikke presisjonen fullt ut her.

### Steinsopp (*Boletus edulis*)
Kilde: [artfakta.se/taxa/245630](https://artfakta.se/taxa/245630)
> "Bildar ektomykorrhiza med både löv- och barrträd (björk, bok, ek, gran, tall) ... vanligast på neutral till något sur mark och verkar saknas på de allra kalkrikaste jordarterna."

App har `treslag:['gran','furu','bjork']`, `berggrunn:['fattig','moderat']`.
**Bekreftet — godt samsvar, ingen endring foreslått.**

### Rødskrubb (*Leccinum versipelle*/*scabrum*)
Kilde: [artfakta.se/taxa/245486](https://artfakta.se/taxa/245486)
> "Tegelsopp bildar ektomykorrhiza med björkar ... Arten verkar inte föredra någon särskild jordtyp utan finns på såväl sura-neutrala som mer kalkrika jordarter."

App har `treslag:['bjork']` (riktig, bekreftet), men
`berggrunn:['fattig','moderat']`. **Avvik: kilden sier INGEN
berggrunnspreferanse, inkludert kalkrike jordarter** — `'rik'` mangler i
app og bør trolig legges til.

### Matriske (*Lactarius deliciosus*)
Kilde: [artfakta.se/taxa/4723](https://artfakta.se/taxa/4723)
> "Tallskog, helst kalktallskog. Kalkrik mark. Med tall."

App har `treslag:['furu']` (bekreftet, eksakt match),
`berggrunn:['moderat','rik']`. **Bekreftet, god match** — kilden peker
enda sterkere mot ren `'rik'` enn appens `moderat+rik`, men ikke klart feil.

### Piggsopp (*Hydnum repandum*)
Kilde: [artfakta.se/taxa/4370](https://artfakta.se/taxa/4370)
> "Barrskog, sällan lövskog. Marken, bland mossa och förna. Med barr- och lövträd."

App har `treslag:['gran','bjork','furu']`. **Bekreftet, god match.**

### Fåresopp (*Albatrellus ovinus*)
Kilde: [artfakta.se/taxa/2959](https://artfakta.se/taxa/2959)
> "Barrskog, helst granskog. Marken, bland mossa. Med gran."

App har `treslag:['gran']` KUN. **Bekreftet, eksakt match.**

### Parasollsopp (*Macrolepiota procera*)
Kilde: [artfakta.se/taxa/4977](https://artfakta.se/taxa/4977)
> Økologisk gruppe: **"Saprotrof/fag, detrivor"** (IKKE mykorrhiza).
> "Öppen löv- och barrskog samt skogsbryn och hagmark. Förna, gärna på sandig mark."

**Strukturelt funn, ikke bare et dataavvik.** Denne arten er saprotrof —
den lever av dødt organisk materiale (strø/humus), ikke i symbiose med et
bestemt vertstre slik de mykorrhiza-dannende artene ellers i appen gjør.
`treslag` som konsept (gran/furu/bjork/apen) er trolig **feil akse** for
denne arten — det reelle signalet er "åpent" vs. "tett/gammel skog" +
sandholdig grunn, ikke hvilket tre som står der. Kombinert med det
allerede kjente `'apen'`-datahullet (se forrige samtale) er dette den
arten med svakest scoringsgrunnlag i hele appen.

### Sjampinjong (*Agaricus campestris*)
Kilde: [artfakta.se/taxa/2917](https://artfakta.se/taxa/2917)
> Økologisk gruppe: **"Saprotrof/fag, detrivor"** (IKKE mykorrhiza).
> "Betesmark, park, trädgård och fjällhed. Marken, särskilt gräsmattor."

**Samme strukturelle funn som parasollsopp** — ren grasmark-/beitemarksart
uten noen treslagstilknytning i det hele tatt. Skogalder- og
treslag-scoring er konseptuelt feil modell for denne arten.

### Furuknippesopp (*Lyophyllum shimeji*)
Kilder: [artfakta.se/taxa/6003323](https://artfakta.se/taxa/6003323) (Sverige, LC) og
[artsdatabanken.no rødlistevurdering 2021](https://artsdatabanken.no/lister/rodlisteforarter/2021/32152) (Norge, **NT**)

Artfakta (Sverige) merker denne økologisk som **"Saprotrof/fag, detrivor"**
— altså IKKE mykorrhiza, i klar motsetning til appens nåværende modell.
Norges egen rødlistevurdering er derimot mer forsiktig: *"antas å danne
mykorrhiza (primært med furu, mulig også gran)"* — bruker "antas"/"mulig",
altså reell faglig usikkerhet om trofisk modus, ikke en etablert
saprotrof-klassifisering. Interessant tilleggsfunn: Norges egen vurdering
nevner **gran som mulig ekstra vertstre** ved siden av furu.

**Oppdatering 2026-08-18, samme dag — AVKLART via en tredje kilde:** en
genomstudie (Ohta et al., *DNA Research*, se
[pmc.ncbi.nlm.nih.gov/articles/PMC9896470](https://pmc.ncbi.nlm.nih.gov/articles/PMC9896470))
konkluderer utvetydig: *"Ly. shimeji is known to be an ectomycorrhizal
fungus associated with plants in the Fagaceae and Pinaceae families."*
Studien forklarer samtidig hvorfor Artfakta trolig klassifiserte arten
feil: den beholder enkelte saprotrof-lignende metabolske egenskaper (kan
bryte ned stivelse, i motsetning til de fleste mykorrhiza-sopp) og en
genomarkitektur som ligner saprotrofe sopp, men er selv utvetydig
mykorrhiza-dannende — bekrefter det Norges rødlistevurdering antok. Arten
er gjeninnført i appen v0.28.12 (se CHANGELOG), med `gran` lagt til som
sekundær treslag-verdi.

### Kransmusserong (*Tricholoma matsutake*)
Kilde: [artfakta.se/taxa/6276](https://artfakta.se/taxa/6276)
> "Bildar mykorrhiza med tall i lav- och lingontallskog på mager sandjord. Förekommer främst på sur, torr och näringsfattig mark i ganska öppen tallskog med tunt humustäcke..."

App har `treslag:['furu']`, `fuktighet:['tørr']`, `berggrunn:['fattig']`.
**Sterkt bekreftet** — matcher appens egen eksisterende kommentar om at
dette er den best dokumenterte arten i settet.

## Oppsummering: hva bør vurderes videre

| Art | Verdi |
|---|---|
| Trompetsopp | **RETTET (v0.28.8)** — gran fjernet fra treslag |
| Traktkantarell | **RETTET (v0.28.8)** — furu lagt til treslag |
| Rødskrubb | **RETTET (v0.28.8)** — 'rik' lagt til berggrunn |
| Kantarell | USIKKER — furu i treslag ikke bekreftet, trenger 3. kilde |
| Parasollsopp | **FJERNET fra appen** — feil scoringsmodell (saprotrof, ikke mykorrhiza) |
| Sjampinjong | **FJERNET fra appen** — feil scoringsmodell (saprotrof, ikke mykorrhiza) |
| Furuknippesopp | **GJENINNFØRT (v0.28.12)** — trofisk modus avklart via 3. kilde (genomstudie); gran lagt til som sekundær treslag-verdi |
| Steinsopp, Matriske, Piggsopp, Fåresopp, Kransmusserong | BEKREFTET — ingen endring foreslått |

De tre konkrete avvikene (Trompetsopp/Traktkantarell/Rødskrubb) er
implementert i `js/app.js` v0.28.8 — se CHANGELOG. Kantarell (USIKKER) står
fortsatt åpen, se [veien-videre.md](veien-videre.md) for status og forsøket
på å avklare den mot appens egne data.
