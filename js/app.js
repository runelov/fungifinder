(function(){

  const APP_VERSION = '0.28.6';
  const APP_BUILD_DATE = '2026-08-18';

  // index.html laster dette scriptet med ?v=<versjon> som cache-buster (se
  // kommentar der) — de to må holdes i sync manuelt siden repoet bevisst
  // ikke har noe build-steg. Varsler i konsollen (kun der) hvis noen glemte
  // å oppdatere index.html ved siste versjonsbump, i stedet for å feile
  // stille med en gammel cachet fil som later som den er ny.
  (function checkScriptVersionSync(){
    const src = document.currentScript && document.currentScript.src;
    if (!src) return;
    const v = new URL(src).searchParams.get('v');
    if (v && v !== APP_VERSION) {
      console.warn(`FungiFinder: index.html laster app.js?v=${v}, men APP_VERSION er ${APP_VERSION} — sjekk at ?v= i index.html ble oppdatert ved siste versjonsbump.`);
    }
  })();

  // Kildegrunnlag for treslag/fuktighet/berggrunn/skogalder/sesong-verdiene
  // under: se docs/artsprofiler-forskningsgrunnlag.md (forskningspass
  // 2026-08-18, mot Artfakta/SLU Artdatabanken + Artsdatabankens rødliste).
  // Verdiene ER IKKE endret av det passet — kun kildehenvist per art med et
  // kort verdikt (BEKREFTET/AVVIK/USIKKER/STRUKTURELT). Se dokumentet for
  // sitater og full begrunnelse før du endrer noe her.
  const SPECIES = [
    // Kilde: artfakta.se/taxa/3213 — USIKKER: furu ikke nevnt i kilden, trenger 3. kilde før endring.
    { id:'kantarell', name:'Kantarell', latin:'Cantharellus cibarius', season:[7,10],
      treslag:['gran','furu','bjork'], skogalder:['middels','gammel'], fuktighet:['frisk','fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:35, minTempAvg:8 },
      why:(loc,t)=>`Blandingsskog med ${t.treslagTekst} og ${t.fuktighetTekst} bunn i mosedekket, ${t.alderTekst} skog — nøyaktig kombinasjonen kantarell liker best.`,
      fieldTips:'Gul-oransje traktformet hatt med bølget kant. Under hatten er det <b>lave, grove, gaffelgrenede ribber</b> som løper langt ned på stilken — ikke tynne, skarpe gjeller. Kjøttet er hvitt-gult gjennomgående, og lukten minner om modne aprikoser.',
      lookalike:'Falsk kantarell (Hygrophoropsis aurantiaca) ligner, men har tynne, skarpe, ekte gjeller (ikke butte ribber) og er mørkere oransje. Ikke farlig, men smaker dårlig — sjekk gjellene nøye.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2007-07-14_Cantharellus_cibarius_cropped.jpg/500px-2007-07-14_Cantharellus_cibarius_cropped.jpg', artist:'Andreas Kunze', license:'CC BY-SA 4.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2007-07-14_Cantharellus_cibarius_cropped.jpg' } },
    // Kilde: artfakta.se/taxa/3217 — AVVIK: kilden nevner furu (tall) på linje med gran, mangler i treslag under.
    { id:'traktkantarell', name:'Traktkantarell', latin:'Craterellus tubaeformis', season:[8,11],
      treslag:['gran'], skogalder:['middels','gammel'], fuktighet:['fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:20, idealNedbor14:45, minTempAvg:4 },
      why:(loc,t)=>`Fuktig, mosekledd granskog — traktkantarellens favorittmiljø. Tåler kjøligere vær enn kantarell.`,
      fieldTips:'Liten, gråbrun-gulbrun sopp med <b>trakt-/pipeformet hatt</b> og hul stilk. Undersiden har lave, grålilla-gule ribber. Vokser ofte i <b>tette forekomster</b> i tykt mosedekke.',
      lookalike:'Få farlige forvekslingsarter. Skilles fra svart trompetsopp på farge (gulbrun, ikke gråsvart) og fra rørsopper ved at det ikke er noe rørlag under hatten.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/2011-07-12_Craterellus_tubaeformis_71471.jpg/500px-2011-07-12_Craterellus_tubaeformis_71471.jpg', artist:'Mushroom Observer-bruker', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2011-07-12_Craterellus_tubaeformis_71471.jpg' } },
    // Kilde: artfakta.se/taxa/3772 — AVVIK: kilden sier "sällan barrskog" (under hassel/eik/asp) — 'gran' i treslag er trolig feil retning.
    { id:'trompetsopp', name:'Svart trompetsopp', latin:'Craterellus cornucopioides', season:[8,10],
      treslag:['bjork','gran'], skogalder:['gammel'], fuktighet:['fuktig'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:20, idealNedbor14:40, minTempAvg:6 },
      why:(loc,t)=>`Fuktig løv-/blandingsskog på ${t.berggrunnTekst} grunn — trompetsoppens foretrukne miljø, ofte sammen med hassel eller bøk/eik.`,
      fieldTips:'Gråsvart, traktformet og helt hul gjennom hele soppen, uten tydelige gjeller eller ribber (helt glatt eller svakt rynket underside). Ligner et lite, mørkt horn. Vokser ofte i store, skjulte klynger under løv.',
      lookalike:'Svært distinkt art med få forvekslingsfarer — hovedutfordringen er å få øye på den i skyggen mellom løv og mørk jord.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/2011-11-20_Craterellus_cornucopioides_%28L.%29_Pers_183522_cropped.jpg/500px-2011-11-20_Craterellus_cornucopioides_%28L.%29_Pers_183522_cropped.jpg', artist:'John Kirkpatrick (Mushroom Observer)', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2011-11-20_Craterellus_cornucopioides_(L.)_Pers_183522_cropped.jpg' } },
    // Kilde: artfakta.se/taxa/245630 — BEKREFTET, godt samsvar med treslag/berggrunn under.
    { id:'steinsopp', name:'Steinsopp', latin:'Boletus edulis', season:[8,10],
      treslag:['gran','furu','bjork'], skogalder:['gammel'], fuktighet:['tørr','frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:20, idealNedbor14:40, minTempAvg:10 },
      why:(loc,t)=>`Eldre ${t.treslagTekst}-skog med blåbærlyng og ${t.fuktighetTekst} mark. Steinsopp trenger et varmt spell etterfulgt av regn.`,
      fieldTips:'Rørsopp: under hatten er det et <b>svampaktig rørlag</b>, aldri gjeller. Stilken er tykk, kølleformet, med fint hvitt <b>nettmønster</b> øverst. Kjøttet forblir hvitt og blir <b>ikke blått eller rødt</b> ved kutt.',
      lookalike:'Ingen rørsopper i Norge er giftige, men galleboletus (Tylopilus felleus) ligner og smaker svært bittert — sjekk at nettmønsteret er hvitt (ikke mørkt) og smak en liten bit rått (bitter = kast).',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Boletus_edulis1.jpg/500px-Boletus_edulis1.jpg', artist:'Tocekas', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:Boletus_edulis1.jpg' } },
    // Kilde: artfakta.se/taxa/245486 — AVVIK: kilden sier INGEN berggrunnspreferanse (inkl. kalkrikt) — 'rik' mangler under.
    { id:'rodskrubb', name:'Rødskrubb / Brunskrubb', latin:'Leccinum versipelle / scabrum', season:[7,10],
      treslag:['bjork'], skogalder:['middels','gammel'], fuktighet:['frisk','fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:35, minTempAvg:8 },
      why:(loc,t)=>`Bjørkeinnslag i ${t.treslagTekst}-skog — disse rørsoppene lever i mykorrhiza spesifikt med bjørk.`,
      fieldTips:'Rørsopp med tynn, rank stilk dekket av mørke, skjellete flekker («skrubb»-mønster). Hatten er oransje-rød (rødskrubb) eller gråbrun (brunskrubb). Kjøttet kan mørkne noe ved kutt, men ikke blått/rødt kraftig.',
      lookalike:'Ingen farlige forvekslingsarter blant rørsopper i Norge. Vokser alltid nær bjørk — finner du den langt fra bjørk, sjekk artsbestemmelsen ekstra nøye.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/2006-09-02_Leccinum_versipelle.jpg/500px-2006-09-02_Leccinum_versipelle.jpg', artist:'Andreas Kunze', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2006-09-02_Leccinum_versipelle.jpg' } },
    // Kilde: artfakta.se/taxa/4723 — BEKREFTET, godt samsvar.
    { id:'matriske', name:'Furumatriske', latin:'Lactarius deliciosus', season:[8,10],
      treslag:['furu'], skogalder:['middels','gammel'], fuktighet:['tørr','frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Furudominert skog på ${t.berggrunnTekst} grunn. Matriske trenger furu som partner og sandholdig, veldrenert jord.`,
      fieldTips:'Kutt i lamellene: ekte matriske gir en <b>gulrotoransje melkesaft</b> som gradvis blir <b>grønnlig</b> ved oksidering. Hatten har ofte konsentriske, mørkere ringer. Vokser nesten utelukkende under furu.',
      lookalike:'⚠ De fleste alvorlige soppforgiftninger i Norge skjer fordi folk forveksler spiss giftslørsopp med matriske. Sjekk ALLTID melkesaften: ekte matriske "blør" tydelig gulrotoransje når du kutter i den — giftslørsopp gjør ikke det. Er du i tvil, la soppen stå.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/2009-09-28_Lactarius_deliciosus.jpg/500px-2009-09-28_Lactarius_deliciosus.jpg', artist:'furtwangl', license:'CC BY 2.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2009-09-28_Lactarius_deliciosus.jpg' } },
    // Kilde: artfakta.se/taxa/4370 — BEKREFTET, godt samsvar.
    { id:'piggsopp', name:'Piggsopp (lys)', latin:'Hydnum repandum', season:[8,10],
      treslag:['gran','bjork','furu'], skogalder:['middels','gammel'], fuktighet:['frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Blandingsskog med ${t.treslagTekst} gir gode vertstrær for piggsopp, mindre kravstor enn kantarell.`,
      fieldTips:'Under hatten: i stedet for gjeller/rør har piggsopp <b>myke, hengende pigger</b>. Kremhvit-lys oransje, tykt kjøtt. Mild i smak.',
      lookalike:'Bruk kun lyse piggsopper med lys hatt og lyse pigger. Mørkhattede piggsopper (bitterpiggsopp) er ikke farlige, men smaker svært bittert — kjenn etter på farge og smak en liten bit rått.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/2012-08-29_Hydnum_repandum_L_256175.jpg/500px-2012-08-29_Hydnum_repandum_L_256175.jpg', artist:'Alan Rockefeller (Mushroom Observer)', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2012-08-29_Hydnum_repandum_L_256175.jpg' } },
    // Kilde: artfakta.se/taxa/2959 — BEKREFTET, eksakt match (gran).
    { id:'faresopp', name:'Fåresopp', latin:'Albatrellus ovinus', season:[7,9],
      treslag:['gran'], skogalder:['gammel'], fuktighet:['frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Gammel granskog med mose — fåresopp vokser direkte i bakken, ofte i ring, nær gran.`,
      fieldTips:'Lys, kremhvit poresopp som vokser <b>på bakken</b> (ikke på trær), ofte flere sammenvokste hatter. Fine porer under hatten, ikke gjeller. Fast, hvitt kjøtt.',
      lookalike:'Lyse poresopper som vokser på bakken i Norge har ingen farlige forvekslingsarter — hovedregelen er lys farge og bakkevekst (ikke å forveksle med kjuker som vokser på trestammer).',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Albatrellus_ovinus_1.jpg/500px-Albatrellus_ovinus_1.jpg', artist:'Karelj', license:'Public domain', sourcePage:'https://commons.wikimedia.org/wiki/File:Albatrellus_ovinus_1.jpg' } },
    // Kilde: artfakta.se/taxa/4977 — STRUKTURELT PROBLEM: kilden klassifiserer arten som saprotrof
    // (lever av dødt organisk materiale), IKKE mykorrhiza-dannende — treslag som scoringsakse er
    // trolig feil modell for denne arten, ikke bare unøyaktige verdier. Se docs/artsprofiler-forskningsgrunnlag.md.
    { id:'parasollsopp', name:'Parasollsopp (stor)', latin:'Macrolepiota procera', season:[7,10],
      treslag:['apen','bjork'], skogalder:['apen','middels'], fuktighet:['frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:10, idealNedbor14:25, minTempAvg:8 },
      why:(loc,t)=>`Åpne skogkanter og lysninger på ${t.berggrunnTekst} grunn — store parasollsopper trives i gress- og feltsjikt i overgangssoner.`,
      fieldTips:'Stor sopp (kan bli 20-40 cm høy) med lang, slank stilk som har et tydelig <b>slangeskinn-mønster</b> og en løs, bevegelig <b>dobbeltring</b>. Hatten er brun-skjellete og parasollformet når utsprunget.',
      lookalike:'⚠ Bruk kun STORE eksemplarer med tydelig slangemønster på stilken og fri, bevegelig ring — små, brune paraplysopper (Lepiota-arter) kan være dødelig giftige og ligner unge parasollsopper. Er soppen liten, la den stå.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/1_-_Macrolepiota_procera_%28St%C5%AFl%29.JPG/500px-1_-_Macrolepiota_procera_%28St%C5%AFl%29.JPG', artist:'Fredy.00', license:'Public domain', sourcePage:'https://commons.wikimedia.org/wiki/File:1_-_Macrolepiota_procera_(St%C5%AFl).JPG' } },
    // Kilde: artfakta.se/taxa/2917 — STRUKTURELT PROBLEM, samme som parasollsopp over: ren saprotrof
    // grasmarksart, ingen treslagstilknytning i det hele tatt. Se docs/artsprofiler-forskningsgrunnlag.md.
    { id:'sjampinjong', name:'Markjordbær-sjampinjong', latin:'Agaricus campestris', season:[7,10],
      treslag:['apen'], skogalder:['apen'], fuktighet:['frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:10, idealNedbor14:25, minTempAvg:8 },
      why:(loc,t)=>`Åpen beitemark/eng på ${t.berggrunnTekst} grunn — sjampinjong vokser i gress, liker kalkholdig jord.`,
      fieldTips:'Sjekk tre ting: <b>rosa gjeller</b> som mørkner til sjokoladebrune, en løs <b>ring på stilken</b>, og kjøtt som <b>ikke blir gult</b> ved trykk.',
      lookalike:'⚠ Unge, hvite fluesopp-knapper kan i sjeldne tilfeller minne om sjampinjong før hatten er utsprunget. Sjekk ALLTID gjellefargen (rosa/brun hos sjampinjong, aldri hvit) og grav opp foten — ekte sjampinjong har ingen "eggeskall" (volva) ved roten.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/2010-08-07_Agaricus_campestris.jpg/500px-2010-08-07_Agaricus_campestris.jpg', artist:'Andreas Kunze', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2010-08-07_Agaricus_campestris.jpg' } },
    // Kilder: artfakta.se/taxa/6003323 (Sverige, LC) og Artsdatabankens norske
    // rødlistevurdering 2021 (NT) — USIKKER: Artfakta klassifiserer arten som
    // saprotrof (ikke mykorrhiza), men den norske rødlistevurderingen sier
    // "antas å danne mykorrhiza (primært med furu, mulig også gran)" — reell
    // faglig uenighet/usikkerhet om trofisk modus, ikke en klar feil å rette.
    // Norges egen vurdering nevner gran som mulig ekstra vertstre — mangler i treslag under.
    { id:'furuknippesopp', name:'Furuknippesopp', latin:'Lyophyllum shimeji', season:[9,10],
      treslag:['furu'], skogalder:['gammel'], fuktighet:['tørr'], berggrunn:['fattig'],
      // Kontinentalt lavlandshabitat (sandfuru-moer på Østlandet) — i
      // motsetning til de fleste andre artene her er høydebegrensningen godt
      // nok dokumentert til å tallfestes (se elevationScore/scoreLocation).
      hoydeMoh:{ ideal:400, max:600 },
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:6 },
      why:(loc,t)=>`Gammel, tørr furuskog på ${t.berggrunnTekst} sandgrunn — det sjeldne, kontinentale furumo-habitatet furuknippesopp krever.`,
      fieldTips:'Vokser i tette knipper direkte i sandholdig skogbunn i gammel, lysåpen furuskog, ofte med reinlav og blåbærlyng i bunnsjiktet. Gråbrun, fast hatt og hvitt kjøtt med en karakteristisk, litt melaktig-nøttete lukt. Regnes som en delikatesse i Japan (der kalt "shimeji"), men er svært sjelden i Norge og finnes stort sett i kontinentale furumoer på Østlandet.',
      lookalike:'⚠ Tilhører slekten knippesopp (Lyophyllum), som har flere likeartede sopper — vær nøye med artsbestemmelsen og bruk soppkontroll ved usikkerhet. Arten er dessuten sjelden/rødlistet i Norge: vis varsomhet og ikke tøm hele forekomsten om du finner den.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/7/7b/Honshimeji.jpg', artist:'トリュフ (Toryufu)', license:'Public domain', sourcePage:'https://commons.wikimedia.org/wiki/File:Honshimeji.jpg' } },
    // Kilde: artfakta.se/taxa/6276 — STERKT BEKREFTET, matcher appens egen
    // eksisterende vurdering om at dette er den best dokumenterte arten i settet.
    { id:'kransmusserong', name:'Kransmusserong', latin:'Tricholoma matsutake', season:[9,10],
      treslag:['furu'], skogalder:['gammel'], fuktighet:['tørr'], berggrunn:['fattig'],
      hoydeMoh:{ ideal:400, max:600 },
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:6 },
      why:(loc,t)=>`Sandholdig, gammel furuskog — kransmusserongens svært spesifikke voksested, best kjent fra furumoer på Østlandet (bl.a. rundt Elverum).`,
      fieldTips:'Kraftig, hvit-brun sopp med tydelig ring på stilken og en kraftig, kanelaktig/krydret duft som skiller den fra det meste annet. Vokser gjerne delvis nedgravd i sandjord under gammel furu, ofte i mose eller reinlav. Internasjonalt kjent som matsutake — en ettertraktet delikatesse i Japan.',
      lookalike:'⚠ Slekten musseronger/riddersopp (Tricholoma) inneholder også giftige arter (bl.a. tigermusserong, som gir kraftige mageplager) — sjekk ring, lukt og voksested nøye, og bruk soppkontroll ved usikkerhet. Kransmusserong er svært ettertraktet og forholdsvis sjelden i Norge — vis varsomhet og plukk med måte.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/2010-08-06_Tricholoma_matsutake_%28S._Ito_%26_S._Imai%29_Singer_97084.jpg/500px-2010-08-06_Tricholoma_matsutake_%28S._Ito_%26_S._Imai%29_Singer_97084.jpg', artist:'Ryane Snow (Mushroom Observer)', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2010-08-06_Tricholoma_matsutake_(S._Ito_%26_S._Imai)_Singer_97084.jpg' } }
  ];

  // Nødfallback: brukes KUN hvis det private data-repoet ikke er konfigurert
  // ennå, eller ikke kan nås. Bevisst holdt som tydelig merkede DEMO-steder
  // uten ekte norsk stedsnavn/geografi — data-repoet starter tomt og fylles
  // gradvis på-forespørsel (se fetch_area.py), og lastes normalt inn av
  // loadLocations() via GitHub-synk.
  let BASE_LOCATIONS = [
    { id:'demo-1', name:'Eksempelskog A (demo)', fylke:'Demo', kommune:'Demo', lat:60.0, lon:10.0, treslag:['gran','bjork'], skogalder:'gammel', fuktighet:'frisk', berggrunn:'fattig', avstandVeiM:null, befolkning:'ukjent', hogstAr:null, kjenteFunn:[], custom:false, kjorbarVei:'ukjent', parkeringNotat:'Logg inn for ekte steder', stier:'ukjent', avstandStiM:null, avstandParkeringM:null },
    { id:'demo-2', name:'Eksempelskog B (demo)', fylke:'Demo', kommune:'Demo', lat:60.2, lon:10.4, treslag:['furu'], skogalder:'middels', fuktighet:'tørr', berggrunn:'moderat', avstandVeiM:null, befolkning:'ukjent', hogstAr:null, kjenteFunn:[], custom:false, kjorbarVei:'ukjent', parkeringNotat:'Logg inn for ekte steder', stier:'ukjent', avstandStiM:null, avstandParkeringM:null }
  ];

  // ---------- Voksestedslag: per-art fargekode ----------
  // Del 1.3 i "Voksestedslaget"-planen (2026-08-16, se
  // https://claude.ai/code/artifact/70ef4f71-bc60-4973-a35c-cd34755351b0) —
  // én kulør per art i stedet for appens delte score-fargeskala
  // (scoreColor under, fortsatt brukt av de vanlige markørene/Målepunkter-
  // laget). Kulør identifiserer ARTEN, metning/lyshet innenfor kuløren er
  // SCOREN. Valgt til å minne om artens faktiske utseende der det gir
  // mening (kantarell=gul, steinsopp=rødbrun) — ren UI/konfigurasjon, ingen
  // ny data, ingen backend-endring.
  const SPECIES_HUE = {
    kantarell: '#C9922C',
    traktkantarell: '#8A7358',
    trompetsopp: '#5B4B66',
    steinsopp: '#8A5A34',
    rodskrubb: '#B3552E',
    matriske: '#C2632A',
    piggsopp: '#CBAE82',
    faresopp: '#B7AF92',
    parasollsopp: '#A9895E',
    sjampinjong: '#B98A7A',
    furuknippesopp: '#8C8268',
    kransmusserong: '#7A4B3A'
  };

  function hexToRgb(hex){
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function mixHex(hexA, hexB, t){
    t = Math.max(0, Math.min(1, t));
    const a = hexToRgb(hexA), b = hexToRgb(hexB);
    const r = Math.round(a.r + (b.r - a.r) * t);
    const g = Math.round(a.g + (b.g - a.g) * t);
    const bl = Math.round(a.b + (b.b - a.b) * t);
    return '#' + [r, g, bl].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  // Lys→mørk-skala for én art, generert fra én enkelt basiskulør i stedet
  // for håndplukkede stopp — "kulør ved 60%" matcher gradient-oppsettet i
  // plandokumentets fig. 2.
  function speciesGradientStops(hex){
    return { light: mixHex(hex, '#ffffff', 0.72), mid: hex, dark: mixHex(hex, '#000000', 0.55) };
  }
  function speciesGradientCss(hex){
    const s = speciesGradientStops(hex);
    return `linear-gradient(90deg, ${s.light}, ${s.mid} 60%, ${s.dark})`;
  }
  // Fargen på ETT punkt i voksestedslaget: kulør = art, lyshet = score
  // (0–100). Samme 60 %-knekkpunkt som speciesGradientCss over, slik at
  // punktfargen på kartet og tegnforklaringens stolpe alltid stemmer
  // visuelt overens.
  function speciesPointColor(hex, score){
    const s = speciesGradientStops(hex);
    const pct = Math.max(0, Math.min(100, score)) / 100;
    return pct <= 0.6 ? mixHex(s.light, s.mid, pct / 0.6) : mixHex(s.mid, s.dark, (pct - 0.6) / 0.4);
  }

  // Arter som er kjent for å foretrekke varme, soleksponerte vokseplasser —
  // brukes til å gi et lite tillegg for sørvendte skråninger når vi har ekte
  // helnings-/himmelretningsdata fra et auto-hentet punkt.
  const WARMTH_LOVING_SPECIES = new Set(['steinsopp', 'matriske', 'kransmusserong', 'furuknippesopp']);

  const TXT = {
    treslag: { gran:'gran', furu:'furu', bjork:'bjørk', apen:'åpen mark', ukjent:'ukjent treslag' },
    fuktighet: { tørr:'tørr', frisk:'frisk', fuktig:'fuktig', ukjent:'ukjent fuktighet' },
    berggrunn: { fattig:'kalkfattig', moderat:'moderat kalkholdig', rik:'kalkrik', ukjent:'ukjent berggrunn' },
    alder: { ung:'ung', middels:'middelaldrende', gammel:'gammel', apen:'åpen', ukjent:'ukjent alder' }
  };

  let selectedSpecies = SPECIES[0].id;
  let favoriteSpecies = []; // art-ID-er merket med ★ — se viewMode
  let viewMode = 'single'; // 'single' (én valgt art) | 'favorites' (beste treff blant favoritter)
  let prioritizeQuiet = true;
  // Nedprioriterer steder nær kjent sti/skogsbilvei — uavhengig av og i
  // TILLEGG til adkomstScore()'s +3/-1 for stier (som gjelder reachability:
  // kan du komme deg dit), siden "nær en (populær) sti" og "lett å komme
  // til" er to forskjellige egenskaper som deler samme underliggende
  // OSM-data. Default AV — de fleste vil fortsatt sette pris på stier for å
  // komme seg inn i terrenget. Se stiavstandScore().
  let weighTrailDistance = false;
  // Nedprioriterer steder nær en REELL, kjørbar vei — ikke sti/skogsbilvei
  // (se veiavstandScore(), og RETTET 2026-08-15 i fetch_area.py der
  // roads/trails ble gjort disjunkte nettopp for at dette skulle bli et eget
  // signal). Distinkt fra adkomstScore() (som premierer kort avstand til
  // PARKERING — motsatt fortegn) og roScore (som måler avstand til
  // TETTSTED/befolkning, ikke vei — en gjennomgående vei i utmark uten noe
  // tettsted i nærheten gir høy ro-score selv rett attmed veien). Default AV
  // — de fleste vil fortsatt sette pris på grei bilatkomst.
  let weighRoadDistance = false;
  // La egen funnhistorikk styrke forslag (opptil +20, se scoreLocation()).
  // Default PÅ — de fleste vil at "jeg har funnet det her før" skal telle.
  // Kan skrus av for å få rene terrengbaserte forslag, f.eks. for bevisst å
  // utforske nye områder i stedet for å bli dratt tilbake til kjente steder.
  let weighOwnFindHistory = true;
  // Vektlegg værvindu (14-dagers nedbør/temp +12/-10, sesonghistorikk ±4).
  // Default PÅ. Kan skrus av av folk som planlegger en tur langt frem i tid
  // uavhengig av værvarsel, og vil ha en ren terrengscore.
  let weighWeather = true;
  // Nedprioriterer steder med mange/nære kjente Artsdatabanken-funn —
  // speilvendt motstykke til densityScore-bonusen rett over i
  // scoreLocation() (som fortsatt gjelder uansett, som korroborerende
  // bevis). Samme designmønster som stiavstandScore(): et velkjent,
  // offentlig registrert funnsted er ofte nettopp det — velkjent, og
  // dermed sannsynligvis mer nedplukket. Default AV.
  let deprioritizeKnownFinds = false;
  let hideHogst = false;
  let artskartOnlyRecent = false; // vis kun Artsdatabanken-funn siste år i kartlaget — se renderArtskartLayer
  // Skjuler kun LISTEN under en viss score — kartet fortsetter å vise alle
  // steder i området (fargekodet etter score) slik at man kan oppdage og
  // klikke seg til lavere-scorende punkter der uten å måtte senke terskelen.
  let minScoreFilter = 70; // default hevet fra 0 — se samtalen 2026-08-11 om fargekodingens grovkornethet
  // RETTET 2026-08-13 (bruker påpekte at ALLE kvalifiserende steder ble
  // bygget som fulle kort — mikrotips, kryssart-tips, kjente funn osv. —
  // og satt inn i DOM-et på én gang, selv om man bare ser de første uansett
  // hvor mange som faktisk kvalifiserer): "Vis flere"-paginering av selve
  // LISTEN (kun rendering, ikke scoring — score()-kallet skjer uansett for
  // ALLE steder for å avgjøre rangeringen, det er selve HTML-byggingen for
  // steder langt nede i lista som nå er lat). VISNING_STEG_LISTE styrer
  // både startantallet og hvor mange "Vis flere"-knappen legger til.
  // visningsAntallListe nullstilles automatisk i render() når resultat-
  // grunnlaget (filter/art/terskel osv.) endres — se visningsSignatur der.
  const VISNING_STEG_LISTE = 30;
  let visningsAntallListe = VISNING_STEG_LISTE;
  let visningsSignatur = null;
  let filterMode = 'fylke'; // 'fylke' | 'kommune' | 'radius'
  let fylkeFilter = 'alle';
  let kommuneFilter = 'alle';
  let radiusCenter = null;
  let radiusKm = 20;
  let weatherBySpecies = {};
  let weatherReady = false;
  // RETTET 2026-08-15: seasonWeather var tidligere ETT tall for HELE
  // appen — hentet for sentroiden av alle lastede steder, uansett hvor
  // spredt de var. Brukeren merket seg (via ekstrem tørke på Østlandet i
  // 2026) at et sted kunne score 95-96 mens sesongen lokalt var den
  // tørreste på flere tiår — nettopp fordi sentroide-tilnærmingen kunne
  // gi et helt annet steds sesongvær hvis flere fylker var lastet inn
  // samtidig. seasonWeather beholdes som ETT representativt sammendrag kun
  // til infoboksen (se renderSeasonWeatherBox) — scoreLocation() slår nå i
  // stedet opp seasonWeatherByCell PER STEDETS EGET rutenett-punkt (samme
  // ~11 km rutenett som weatherGridKey/loadWeather bruker for 14-dagersværet).
  let seasonWeather = null; // { totalPrecip, avgTemp, months:[{label,precip,tempAvg}], dryStreakDays, historicalAvgPrecip, historicalYears, precipRatioVsHistorical }, se loadSeasonWeather()
  let seasonWeatherReady = false;
  let seasonWeatherByCell = {}; // rutenett-nøkkel (weatherGridKey) -> samme sesongobjekt som seasonWeather, se loadSeasonWeather()
  let userFinds = [];
  let userCuts = [];
  let hogstOmrader = []; // [{id, lat, lon, radiusM, dato}] — egne merkede flatehogd-OMRÅDER,
                          // uavhengig av om det finnes et eksisterende målepunkt i dem (se scoreLocation)
  let markingHogstMode = false;
  let customLocations = [];
  let delFunn = false; // "del mine funn med andre påloggede brukere" — se persistAll()/loadStorage() og sp-toggle-del-funn
  let delteFunn = []; // ANDRE brukeres delte funn ({art,dato,lat,lon,kortnavn}) — se loadDelteFunn()
  let fetchedAreas = [];
  let artsfunn = []; // ekte Artsdatabanken-observasjoner — se loadArtsfunn()
  let gridKm = 1.5;
  let kommuneRegister = []; // {kommunenavn, fylkesnavn} — hentet fra Kartverkets Kommuneinfo-API
  let kommuneNarrowFylke = 'alle';
  let fetchInProgress = false;
  let fetchPollTimer = null;
  let bboxAreaCache = {}; // cache av Nominatim bbox-areal per fylke/kommune-navn
  let currentUser = null; // { epost, kortnavn, rolle } fra ApiClient.meg(), eller null hvis ikke innlogget
  // "Om dataene"-teksten sin dynamiske kommuneliste — se renderDataNotice().
  // Huskes fra siste gang HELE datasettet var lastet (fylkeFilter==='alle'),
  // slik at teksten fortsatt viser riktig NASJONAL oversikt selv etter at
  // brukeren filtrerer til ett fylke/én kommune (BASE_LOCATIONS blir da kun
  // DEN filtrerte undermengden, se loadLocations()). null = ikke beregnet ennå.
  let analyserteKommunerCache = null;

  // RETTET 2026-08-13 (bruker meldte at bytte "Én art" → "Mine favoritter"
  // tar noen sekunder): scoreLocation(art, sted) er en ren funksjon av
  // (art.id, sted.id) OG en håndfull delte, muterbare tilstander (userCuts,
  // hogstOmrader, egen funnhistorikk, værdata, fem "vektlegg …"-toggles) —
  // se scoreLocation() selv for hvilke. "Mine favoritter" beregner FULL
  // score for HVER favoritt på HVERT sted (for å finne beste treff per
  // sted), så kostnaden ganges med antall favoritter sammenlignet med "Én
  // art" — med et nasjonalt (ufiltrert) datasett på flere tusen steder blir
  // det fort mange tusen scoreLocation()-kall, synkront på hovedtråden.
  // Cachen under gjenbruker et allerede beregnet (art,sted)-resultat i
  // stedet for å regne det på nytt — koster ingenting første gang et par
  // faktisk scores, men gjør GJENTATT bytte mellom visningsmodi (akkurat
  // det brukeren meldte) og andre steder som scorer samme art/sted-par i
  // samme økt (crossSpeciesTipsHtml, knownFindsHtml) tilnærmet gratis.
  // scoreCache tømmes (bumpScoreCache()) ved ETHVERT av disse — se
  // kallstedene: loadLocations() (BASE_LOCATIONS reassignert),
  // loadStorage()/persistAll() (userCuts/hogstOmrader/userFinds/
  // customLocations — persistAll() er FELLES for alle saveXxx()-kall og
  // dermed ETT trygt sted å fange dem alle), loadWeather()/
  // loadSeasonWeather() (værdata), og de fem vektlegg-togglene direkte i
  // wiring-seksjonen. IKKE bumpet av hideHogst/artskartOnlyRecent —
  // begge filtrerer kun ETTER at scoring er ferdig, påvirker ikke selve
  // scoreLocation()-resultatet.
  let scoreCache = new Map();
  function bumpScoreCache(){ scoreCache = new Map(); }

  const monthNow = new Date().getMonth() + 1;
  const yearNow = new Date().getFullYear();

  function allLocations(){ return BASE_LOCATIONS.concat(customLocations); }

  // RETTET 2026-08-15: samme fylke/kommune/radius-filtreringslogikk lå
  // duplisert tre steder (render()'s `scoped`, suggestAreas()'s `scoped`) —
  // trukket ut hit som ÉN delt predikat-funksjon. Umiddelbare årsaken:
  // brukeren merket seg at "Snitt nedbør siste 14 dager (alle steder)"
  // viste NØYAKTIG samme tall for Trondheim og Indre Østfold — fordi
  // loadWeather()/loadSeasonWeather() kjørte på allLocations() (ALT noensinne
  // lastet inn, typisk hele landet fra første sideinnlasting med "alle
  // fylker" valgt) i stedet for KUN det brukeren faktisk har valgt å se på
  // akkurat nå. Brukes nå av scopedLocations() under, OG direkte av
  // render()/suggestAreas() sine `scoped`-filtre (samme resultat, men uten
  // tre kopier av samme tre if-setninger å holde i synk).
  //
  // RETTET 2026-08-16 (bruker spurte: "hva hvis man ikke har valgt kommune/
  // fylke/radius, men bare har flyttet seg rundt i kartet?"): svaret var
  // "ingenting — søket dekket alltid hele Norge, uansett kartutsnitt", som
  // bryter med selve grunnantagelsen i en kartapp (det du ser ER det du
  // søker i). Når INTET er eksplisitt valgt (fylke='alle'/kommune='alle'/
  // intet radius-senter), brukes nå kartutsnittet som scope i stedet — men
  // KUN når man har zoomet inn nok til at det faktisk betyr noe presist
  // (samme terskel/begrunnelse som artskartOmradeErAvgrenset()/
  // ARTSKART_MIN_ZOOM lenger ned — gjenbrukt, ikke duplisert, slik at de to
  // funksjonene ikke kan drifte fra hverandre). Helt utzoomet (hele landet
  // synlig) forblir det reelt nasjonale søket som før, siden viewport da
  // uansett dekker omtrent alt. Se viewportImpliesScope().
  function isInCurrentScope(loc){
    if (filterMode === 'fylke' && fylkeFilter !== 'alle') return loc.fylke === fylkeFilter;
    if (filterMode === 'kommune' && kommuneFilter !== 'alle') return loc.kommune === kommuneFilter;
    if (filterMode === 'radius' && radiusCenter) return haversineKm(radiusCenter.lat, radiusCenter.lon, loc.lat, loc.lon) <= radiusKm;
    if (viewportImpliesScope()) return leafletMap.getBounds().contains([loc.lat, loc.lon]);
    return true;
  }

  // Stedene innenfor det brukeren FAKTISK ser på nå (fylke/kommune/radius-
  // filteret) — se isInCurrentScope() over. Brukt av loadWeather()/
  // loadSeasonWeather() slik at værsammendragene faktisk gjelder valgt
  // område, ikke alt appen noensinne har lastet inn.
  function scopedLocations(){ return allLocations().filter(isInCurrentScope); }

  // Kaller begge værhentingene på nytt for GJELDENDE scope — MÅ trigges ved
  // hvert fylke/kommune/radius-bytte (se wiring nederst i filen), ikke bare
  // én gang ved oppstart, ellers fryser weatherBySpecies/seasonWeatherByCell
  // (og "alle steder"-sammendraget i infoboksene) fast på scopet som gjaldt
  // FØRSTE gang appen lastet inn. Fire-and-forget, samme mønster som ved
  // oppstart (ingen await her) — begge funksjonene oppdaterer UI selv når
  // de er ferdige.
  function refreshWeatherForScope(){ loadWeather(); loadSeasonWeather(); }

  // Trigger for refreshWeatherForScope() — hektet inn i render() (se kallet
  // i render()) i stedet for lagt til manuelt ved hvert enkelt sted som
  // endrer fylke/kommune/radius (innlogging, filterbytte, "Hent data"
  // fullført, ...). Disse stedene kaller ALLTID render() uansett når scopet
  // endrer seg, så å hekte fast HER gjør det umulig å glemme et kallsted —
  // sammenlignet med å måtte huske refreshWeatherForScope() manuelt ved
  // hver av de ~9 stedene som endrer filterMode/fylkeFilter/kommuneFilter/
  // radiusCenter/radiusKm. Debounces 400ms: uten dette ville radius-
  // slideren (som endrer radiusKm på HVER 'input'-hendelse under drag)
  // trigget ett nytt værkall per pikselforflytning.
  let lastWeatherScopeKey = null;
  let weatherScopeDebounce = null;
  // RETTET 2026-08-16: samme "intet eksplisitt valgt → kartutsnitt"-fallback
  // som isInCurrentScope() — ellers ville værsammendraget stå og vise tall
  // for et gammelt (eller helt annet) kartutsnitt mens "Foreslå
  // områder"/lista allerede hadde hoppet videre til det nye. boundsKey()
  // runder til ~1 km presisjon, nok til at debounce/cache over faktisk
  // dedupliserer små panoreringer — selve værhentingen har uansett sin egen
  // grid-snap-cache (se Open-Meteo-notatet i CLAUDE.md), så en litt for
  // "finkornet" nøkkel her er ufarlig, bare potensielt ett par ekstra
  // cache-treff spart.
  function boundsKey(b){
    return `${b.getSouth().toFixed(2)},${b.getWest().toFixed(2)},${b.getNorth().toFixed(2)},${b.getEast().toFixed(2)}`;
  }
  function currentScopeKey(){
    if (filterMode === 'fylke' && fylkeFilter !== 'alle') return `fylke:${fylkeFilter}`;
    if (filterMode === 'kommune' && kommuneFilter !== 'alle') return `kommune:${kommuneFilter}`;
    if (filterMode === 'radius' && radiusCenter) return `radius:${radiusCenter.lat.toFixed(3)},${radiusCenter.lon.toFixed(3)}:${radiusKm}`;
    if (viewportImpliesScope()) return `kartutsnitt:${boundsKey(leafletMap.getBounds())}`;
    return 'hele-norge';
  }
  function maybeRefreshWeatherForScope(){
    const key = currentScopeKey();
    if (key === lastWeatherScopeKey) return;
    lastWeatherScopeKey = key;
    clearTimeout(weatherScopeDebounce);
    weatherScopeDebounce = setTimeout(refreshWeatherForScope, 400);
  }

  // Art(er) som er aktive i "Velg sopp" akkurat nå — brukes til å begrense
  // Artsdatabanken-laget og Mine funn-laget i kartet til det du faktisk ser
  // på, i stedet for å alltid vise funn for alle 12 kandidatartene.
  function activeSpeciesIds(){ return viewMode === 'favorites' ? favoriteSpecies : [selectedSpecies]; }

  function haversineKm(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // Artskart-observasjoners "dato"-felt er CollectedDate på norsk format
  // (DD.MM.YYYY) — IKKE samme som trackDateTime (kun en synk-metadata for når
  // posten sist ble verifisert av Artsdatabanken, ofte år etter selve funnet).
  // Brukes av "vis kun ferske funn"-toggelen i renderArtskartLayer.
  function parseNorskDato(s){
    const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s || '');
    if (!m) return null;
    return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  }

  // Sjekker om et sted faller innenfor et av dine egne merkede flatehogd-
  // OMRÅDER (sirkler, se openHogstOmradeModal) — uavhengig av om stedet i
  // seg selv har blitt merket enkeltvis via userCuts. Løser at et hogstfelt
  // ofte ikke treffer noe eksisterende rutenettpunkt nøyaktig.
  function isWithinHogstOmrade(loc){
    return hogstOmrader.some(z => haversineKm(z.lat, z.lon, loc.lat, loc.lon) * 1000 <= z.radiusM);
  }

  // ---------- storage (fungifinder-api, sesjonsbasert) ----------
  async function loadStorage(){
    if (!currentUser) {
      userFinds = []; userCuts = []; hogstOmrader = []; customLocations = []; favoriteSpecies = []; delFunn = false;
      bumpScoreCache();
      return;
    }
    try {
      const d = await window.ApiClient.hentMineData();
      userFinds = d.finds || [];
      userCuts = d.cuts || [];
      hogstOmrader = d.hogstOmrader || [];
      customLocations = d.customLocations || [];
      favoriteSpecies = d.favoriteSpecies || [];
      delFunn = d.delFunn === true;
      bumpScoreCache();
      setSyncStatus(`✓ Innlogget som ${currentUser.kortnavn}`);
    } catch (e) {
      console.error(e);
      setSyncStatus('⚠ Kunne ikke laste dine data. ' + e.message);
    }
  }

  async function persistAll(){
    if (!currentUser) return;
    // Bumpes synkront FØR nettverkskallet under (ikke etter) — den lokale
    // mutasjonen (push/filter/enrichStatus-oppdatering) som utløste dette
    // kallet har allerede skjedd i den kallende koden, og en påfølgende
    // render() skal aldri kunne lese en scoreCache som ikke reflekterer
    // den, uansett hvor lang tid selve lagringen tar.
    bumpScoreCache();
    const payload = { finds: userFinds, cuts: userCuts, hogstOmrader: hogstOmrader, customLocations: customLocations, favoriteSpecies: favoriteSpecies, delFunn };
    try {
      await window.ApiClient.lagreMineData(payload);
      setSyncStatus(`✓ Lagret (${new Date().toLocaleTimeString('no')})`);
    } catch (e) {
      console.error(e);
      setSyncStatus('⚠ Lagring feilet. ' + e.message);
    }
  }
  async function saveFinds(){ await persistAll(); }
  async function saveCuts(){ await persistAll(); }
  async function saveHogstOmrader(){ await persistAll(); }
  async function saveFavorites(){ await persistAll(); }
  async function saveCustomLocations(){ await persistAll(); }
  async function saveDelFunn(){ await persistAll(); }

  function setSyncStatus(text){
    const el = document.getElementById('sp-sync-status');
    if (el) el.textContent = text;
  }

  function wireVersionInfo(){
    document.getElementById('sp-version').textContent = 'v' + APP_VERSION;
    document.getElementById('sp-config-version').textContent = `FungiFinder v${APP_VERSION} (${APP_BUILD_DATE})`;
  }

  function wireTabs(){
    document.querySelectorAll('.sp-tabbed-panel').forEach(panel => {
      const buttons = panel.querySelectorAll('.sp-tab-btn');
      const contents = panel.querySelectorAll('.sp-tab-content');
      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          contents.forEach(c => {
            c.style.display = (c.dataset.tabContent === btn.dataset.tab) ? '' : 'none';
          });
        });
      });
    });
  }

  function wireCollapsibles(){
    ['sp-notice', 'sp-safety', 'sp-preferences'].forEach(id => {
      const el = document.getElementById(id);
      const key = 'fungifinder-collapse-' + id;
      const saved = localStorage.getItem(key);
      if (saved !== null) el.open = saved === 'open';
      el.addEventListener('toggle', () => {
        localStorage.setItem(key, el.open ? 'open' : 'closed');
      });
    });
  }

  // ---------- "Legg til på hjemskjermen" ----------
  // RETTET 2026-08-16 (bruker-ønske, jf. bærher.no sin tilsvarende lenke på
  // forsiden): en installert hjemskjerm-app (manifest.webmanifest,
  // display:standalone) er også nøkkelen til STABIL innlogging — se
  // verifiserKode() i worker/api/src/routes/auth.js sin begrunnelse for
  // hvorfor magic-link-e-post og PWA-cookien lever i to atskilte
  // lagringsrom på iOS. Denne banneren gjør selve installasjonen synlig og
  // ett-trinns i stedet for noe brukeren må vite fra før.
  function isStandalone(){
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function wireA2HS(){
    const el = document.getElementById('sp-a2hs');
    if (!el) return;
    if (isStandalone()) return; // allerede installert — ingenting å tilby
    if (localStorage.getItem('fungifinder-a2hs-lukket')) return;

    const textEl = document.getElementById('sp-a2hs-text');
    const actionBtn = document.getElementById('sp-a2hs-action');
    const ua = navigator.userAgent || '';
    const erIOS = /iphone|ipad|ipod/i.test(ua);
    const erAndroid = /android/i.test(ua);

    document.getElementById('sp-a2hs-close').addEventListener('click', () => {
      localStorage.setItem('fungifinder-a2hs-lukket', '1');
      el.hidden = true;
    });

    if (erIOS) {
      // iOS har intet programmatisk install-API (beforeinstallprompt finnes
      // ikke der) — "Legg til på Hjemskjerm" ligger kun i Safari sin egen
      // delemeny, så her kan vi bare vise anvisningen, ikke trigge den.
      textEl.innerHTML = 'Rask tilgang som en app — og du slipper å logge inn i nettleseren på nytt hver gang. Trykk <b>Del</b>-ikonet nederst i Safari, og velg <b>«Legg til på Hjemskjerm»</b>.';
      el.hidden = false;
      return;
    }

    if (erAndroid) {
      let deferredPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        el.hidden = false;
        actionBtn.hidden = false;
      });
      actionBtn.addEventListener('click', async () => {
        if (!deferredPrompt) return;
        actionBtn.disabled = true;
        deferredPrompt.prompt();
        const valg = await deferredPrompt.userChoice.catch(() => null);
        deferredPrompt = null;
        if (valg && valg.outcome === 'accepted') {
          localStorage.setItem('fungifinder-a2hs-lukket', '1');
          el.hidden = true;
        } else {
          actionBtn.disabled = false;
        }
      });
      // Fallback hvis beforeinstallprompt aldri fyres (f.eks. nylig avvist
      // av nettleseren selv) — vis statisk anvisning i stedet for at
      // banneret bare forblir usynlig og brukeren aldri får tilbudet.
      setTimeout(() => {
        if (!deferredPrompt && el.hidden) {
          textEl.textContent = 'Rask tilgang som en app — og du slipper å logge inn i nettleseren på nytt hver gang. Åpne meny-knappen (⋮) i nettleseren og velg «Legg til på startskjerm» / «Installer app».';
          el.hidden = false;
        }
      }, 2500);
      return;
    }

    // Desktop e.l. — ingen hjemskjerm å legge til, ikke vist.
  }

  // RETTET 2026-08-15 (UX-gjennomgang, se render()/sp-demo-banner): appen
  // hadde flere steder som bare NEVNTE "Logg inn under ⚙ Preferanser &
  // Config → Konto" som ren tekst, uten å faktisk gjøre noe — brukeren måtte
  // selv finne fram til panelet, åpne det (details/summary), OG bytte til
  // riktig fane. Denne gjør alle tre stegene i ett klikk. Brukt av
  // demo-varselet i resultatlisten; kan gjenbrukes andre steder som i dag
  // bare skriver teksten (se f.eks. openFindModal/suggestAreas sine alert()-
  // meldinger — ikke endret her, utenfor scope for denne rettingen).
  function openLoginPanel(){
    const panel = document.getElementById('sp-preferences');
    if (!panel) return;
    panel.open = true;
    const kontoBtn = panel.querySelector('.sp-tab-btn[data-tab="konto"]');
    if (kontoBtn) kontoBtn.click();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // ---------- auth (fungifinder-api: magic-link + sesjon + roller) ----------
  function isAdmin(){ return !!(currentUser && currentUser.rolle === 'admin'); }

  // RETTET 2026-08-13 (oppdaget under verifisering av renderDataNotice()):
  // `ApiClient.meg()` (dermed selve `fetch()`) kastet UFANGET ved en
  // nettverksfeil (frakoblet, worker midlertidig nede, e.l.) — dette
  // propagerte gjennom `await Promise.all([geolocateStartupView(),
  // initAuth()])` i init() og VELTET resten av oppstarten (loadLocations,
  // loadArtsfunn, loadStorage, render(), loadWeather() — ALT etter det
  // punktet), slik at appen ble stående helt blank/ubrukelig i stedet for
  // å falle tilbake til "ikke innlogget, viser eksempeldata"-modus (som
  // f.eks. et 401/500-svar fra serveren allerede håndteres fint av —
  // kun selve nettverkslaget manglet dekning). Samme
  // fang-og-fortsett-mønster som loadLocations()/loadFetchedAreas()/
  // loadArtsfunn() allerede bruker.
  async function initAuth(){
    try {
      currentUser = await window.ApiClient.meg();
    } catch (e) {
      console.warn('Kunne ikke sjekke innloggingsstatus (nettverksfeil?) — fortsetter som ikke innlogget.', e);
      currentUser = null;
    }
    reflectAccountUi();
  }

  function reflectAccountUi(){
    const loggedOut = document.getElementById('sp-account-loggedout');
    const loggedIn = document.getElementById('sp-account-loggedin');
    const adminPanel = document.getElementById('sp-admin-panel');
    if (currentUser) {
      loggedOut.style.display = 'none';
      loggedIn.style.display = '';
      document.getElementById('sp-account-name').textContent = currentUser.kortnavn;
      document.getElementById('sp-account-role').textContent = currentUser.rolle === 'admin' ? 'admin' : 'bruker';
    } else {
      loggedOut.style.display = '';
      loggedIn.style.display = 'none';
      setSyncStatus('Ikke innlogget — viser kun eksempeldata.');
    }
    if (adminPanel) {
      adminPanel.hidden = !isAdmin();
      if (isAdmin()) { renderAdminBrukere(); renderAdminInvitasjoner(); renderAdminStatistikk(); }
    }
    updateVoksestedslagAvailability();
  }

  function wireLoginForm(){
    document.getElementById('sp-login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const epost = document.getElementById('sp-login-epost').value.trim();
      const statusEl = document.getElementById('sp-login-status');
      const btn = document.getElementById('sp-login-send');
      // Turnstile (implicit rendering) legger selv til dette skjulte feltet
      // inni #sp-turnstile når widgeten er løst — se index.html.
      const turnstileToken = document.querySelector('#sp-turnstile [name="cf-turnstile-response"]')?.value || '';
      if (!epost) { statusEl.textContent = '⚠ Fyll ut e-post.'; return; }
      btn.disabled = true;
      statusEl.textContent = 'Sender …';
      try {
        const data = await window.ApiClient.beOmLenke(epost, turnstileToken);
        statusEl.textContent = '✓ ' + data.melding;
      } catch (err) {
        statusEl.textContent = '⚠ ' + err.message;
      } finally {
        btn.disabled = false;
      }
    });
  }

  function wireKodeForm(){
    document.getElementById('sp-kode-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const epost = document.getElementById('sp-login-epost').value.trim();
      const kode = document.getElementById('sp-kode-input').value.trim();
      const statusEl = document.getElementById('sp-kode-status');
      const btn = document.getElementById('sp-kode-send');
      if (!epost) { statusEl.textContent = '⚠ Fyll ut e-post over først.'; return; }
      if (!/^\d{6}$/.test(kode)) { statusEl.textContent = '⚠ Koden må være 6 sifre.'; return; }
      btn.disabled = true;
      statusEl.textContent = 'Sjekker …';
      try {
        currentUser = await window.ApiClient.verifiserKode(epost, kode);
        statusEl.textContent = '';
        reflectAccountUi();
        await loadLocations();
        // Uten dette kallet blir artsfunn stående på [] resten av økten hvis
        // siden først ble lastet uinnlogget (loadArtsfunn() i init() kjørte
        // da med currentUser=null) — nøyaktig scenarioet kodeinnlogging
        // finnes for (iOS-PWA, ingen sideomlasting via magic-link her).
        // "Artsdatabanken-funn"-laget sto da som aktivt, men tomt.
        await loadArtsfunn();
        await loadStorage();
        await loadDelteFunn(); // samme begrunnelse som loadArtsfunn() over — ingen sideomlasting her
        render();
      } catch (err) {
        statusEl.textContent = '⚠ ' + err.message;
      } finally {
        btn.disabled = false;
      }
    });
  }

  function wireLogout(){
    document.getElementById('sp-logout-btn').addEventListener('click', async () => {
      await window.ApiClient.loggUt();
      currentUser = null;
      artsfunn = []; // ikke la gamle Artskart-observasjoner bli stående synlige uten sesjon
      artsfunnLoadedBounds = null; // tving et ekte nytt hent ved neste innlogging, se loadArtsfunn()
      delteFunn = []; // samme begrunnelse — ikke la andres delte funn bli stående synlige uten sesjon
      reflectAccountUi();
      await loadLocations();
      await loadStorage();
      clearRoute();
      render();
    });
  }

  // ---------- invitasjonsregistrering (?invitasjon=<token> i URL-en) ----------
  async function checkUrlInvitasjon(){
    const token = new URLSearchParams(location.search).get('invitasjon');
    if (!token) return;
    const panel = document.getElementById('sp-invite-panel');
    const statusEl = document.getElementById('sp-invite-status');
    const form = document.getElementById('sp-invite-form');
    panel.style.display = '';
    statusEl.textContent = 'Sjekker invitasjonen …';

    // RETTET 2026-08-16: lukker panelet OG fjerner ?invitasjon= fra URL-en.
    // Uten URL-opprenskingen ville en reload (eller at brukeren lukker og
    // åpner appen på nytt, f.eks. PWA) sjekket akkurat samme
    // ugyldige/utløpte/brukte token på nytt og vist samme fastlåste modal
    // igjen. Wiret FØR try/catch under, slik at Lukk-knappen/klikk-utenfor
    // også virker mens "Sjekker …" vises og i feilgrenen — tidligere fantes
    // ingen måte å lukke panelet på i det hele tatt der (verken knapp eller
    // klikk-utenfor), se bruker-rapporten som førte til denne rettelsen.
    function closeInvitePanel(){
      panel.style.display = 'none';
      const p = new URLSearchParams(location.search);
      p.delete('invitasjon');
      history.replaceState(null, '', location.pathname + (p.toString() ? '?' + p.toString() : ''));
    }
    document.getElementById('sp-invite-close').addEventListener('click', closeInvitePanel);
    document.getElementById('sp-invite-backdrop').addEventListener('click', (e) => {
      if (e.target.id === 'sp-invite-backdrop') closeInvitePanel();
    });

    try {
      const res = await window.ApiClient.sjekkInvitasjon(token);
      if (!res.gyldig) {
        // RETTET 2026-08-16 (bruker-rapport: "flere har forsøkt
        // invitasjonslenken" for å logge inn på nytt): en invitasjonslenke
        // er engangsbruk, kun ment for FØRSTE registrering — men det er
        // ofte den eneste lenken brukeren har liggende (e-post/bokmerke),
        // så de prøver den igjen når økten deres har gått ut. Generisk
        // "ugyldig/utløpt/brukt"-tekst forklarte ikke DETTE, og etterlot
        // brukeren fastlåst uten noen vei videre. Tilbyr nå eksplisitt
        // "Gå til innlogging" i stedet, som lukker denne modalen og åpner
        // Konto-fanen direkte (openLoginPanel()) — samme ett-klikks-hjelper
        // som demo-varselet i resultatlisten allerede bruker.
        statusEl.textContent = '⚠ Denne lenken er allerede brukt eller har utløpt — den virker kun for selve FØRSTEgangsregistreringen. Er du allerede bruker? Be om en ny innloggingslenke i stedet.';
        const gaTilLoginBtn = document.getElementById('sp-invite-go-login');
        gaTilLoginBtn.hidden = false;
        gaTilLoginBtn.addEventListener('click', () => {
          closeInvitePanel();
          openLoginPanel();
        });
        return;
      }
      statusEl.textContent = '';
      document.getElementById('sp-invite-epost').value = res.epost;
      form.style.display = '';
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const kortnavn = document.getElementById('sp-invite-kortnavn').value.trim();
        try {
          await window.ApiClient.registrerMedInvitasjon(token, kortnavn);
          closeInvitePanel();
          await initAuth();
          await loadLocations();
          await loadStorage();
          await loadDelteFunn();
          render();
        } catch (err) {
          statusEl.textContent = '⚠ ' + err.message;
        }
      });
    } catch (err) {
      statusEl.textContent = '⚠ ' + err.message;
    }
  }

  // ---------- admin: brukere + invitasjoner ----------
  function wireAdminPanel(){
    document.getElementById('sp-invitasjon-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const epostInput = document.getElementById('sp-invitasjon-epost');
      const box = document.getElementById('sp-invitasjon-ny-lenke');
      try {
        const inv = await window.ApiClient.opprettInvitasjon(epostInput.value.trim());
        const lenke = `${location.origin}${location.pathname}?invitasjon=${inv.token}`;
        box.style.display = '';
        box.innerHTML = `Invitasjon opprettet for <b>${escapeHtml(inv.epost)}</b> — del denne lenken (vises kun nå, gyldig 7 dager):<br><code>${escapeHtml(lenke)}</code>`;
        epostInput.value = '';
        await renderAdminInvitasjoner();
      } catch (err) {
        box.style.display = '';
        box.textContent = '⚠ ' + err.message;
      }
    });
  }

  async function renderAdminBrukere(){
    const el = document.getElementById('sp-admin-brukere-list');
    if (!el) return;
    el.innerHTML = 'Laster …';
    try {
      const brukere = await window.ApiClient.hentBrukere();
      el.innerHTML = brukere.map(b => `
        <div class="sp-mine-row">
          <span>${escapeHtml(b.kortnavn)} <span style="opacity:.6">— ${escapeHtml(b.epost)} · ${b.rolle}${b.status==='deaktivert' ? ' · deaktivert' : ''}</span></span>
          <span class="sp-mine-row-actions">
            ${b.rolle !== 'admin' ? `<button class="sp-locate" data-toggle-bruker="${b.id}" data-ny-status="${b.status==='aktiv'?'deaktivert':'aktiv'}" title="${b.status==='aktiv'?'Deaktiver':'Aktiver'}">${b.status==='aktiv'?'⏸':'▶'}</button>` : ''}
            ${b.rolle !== 'admin' ? `<button class="sp-remove" data-slett-bruker="${b.id}" title="Slett permanent">✕</button>` : ''}
          </span>
        </div>`).join('') || '<div class="sp-empty-mine">Ingen brukere ennå.</div>';
      el.querySelectorAll('[data-toggle-bruker]').forEach(btn => btn.addEventListener('click', async () => {
        await window.ApiClient.settBrukerStatus(btn.dataset.toggleBruker, btn.dataset.nyStatus);
        renderAdminBrukere();
      }));
      el.querySelectorAll('[data-slett-bruker]').forEach(btn => btn.addEventListener('click', async () => {
        if (!confirm('Slette denne brukeren permanent? Dette kan ikke angres.')) return;
        await window.ApiClient.slettBrukerPermanent(btn.dataset.slettBruker);
        renderAdminBrukere();
      }));
    } catch (err) {
      el.innerHTML = `<div class="sp-empty-mine">⚠ ${escapeHtml(err.message)}</div>`;
    }
  }

  async function renderAdminInvitasjoner(){
    const el = document.getElementById('sp-admin-invitasjoner-list');
    if (!el) return;
    el.innerHTML = 'Laster …';
    try {
      const invitasjoner = await window.ApiClient.hentInvitasjoner();
      el.innerHTML = invitasjoner.map(i => `
        <div class="sp-mine-row">
          <span>${escapeHtml(i.epost)} <span style="opacity:.6">${i.brukt ? '· brukt av ' + escapeHtml(i.brukt_av_kortnavn||'') : (i.utloper < Date.now() ? '· utløpt' : '· venter')}</span></span>
          <span class="sp-mine-row-actions">
            ${!i.brukt ? `<button class="sp-remove" data-slett-invitasjon="${i.id}" title="Trekk tilbake">✕</button>` : ''}
          </span>
        </div>`).join('') || '<div class="sp-empty-mine">Ingen invitasjoner ennå.</div>';
      el.querySelectorAll('[data-slett-invitasjon]').forEach(btn => btn.addEventListener('click', async () => {
        await window.ApiClient.slettInvitasjon(btn.dataset.slettInvitasjon);
        renderAdminInvitasjoner();
      }));
    } catch (err) {
      el.innerHTML = `<div class="sp-empty-mine">⚠ ${escapeHtml(err.message)}</div>`;
    }
  }

  // Oversikt over D1-datamengden — hvilke fylker/kommuner har målepunkter,
  // og hvor mye hver bruker selv har bidratt med (funn/hogstfelt-merking).
  // Rent lesevisning, ingen handlinger her (i motsetning til brukere/
  // invitasjoner-fanene), derfor ingen wire-funksjon/event-lyttere.
  async function renderAdminStatistikk(){
    const el = document.getElementById('sp-admin-statistikk');
    if (!el) return;
    el.innerHTML = 'Laster …';
    try {
      const s = await window.ApiClient.hentStatistikk();
      const fylkerDekket = s.malepunkter.perFylke.filter(f => f.fylke !== 'ukjent').length;
      const kommunerDekket = s.malepunkter.perKommune.filter(k => k.kommune !== 'ukjent').length;

      const totalFunn = s.brukere.reduce((sum, b) => sum + b.funn, 0);
      const totalHogst = s.brukere.reduce((sum, b) => sum + b.hogstMerket + b.hogstOmrader, 0);
      const totalEgneSteder = s.brukere.reduce((sum, b) => sum + b.egneSteder, 0);

      // "Egne steder" = customLocations i den enkelte brukers bruker_data
      // (opprettes når et registrert funn ikke traff noe kjent/allerede
      // hentet målepunkt — se customLocations.push() i openFindModal-flyten).
      // IKKE det samme som terreng_steder.custom (delt, auto-hentet
      // datasett) — den kolonnen settes aldri til 1 av noen kodesti i dag
      // (fetch_area.py sin enrich_point() hardkoder custom:false), så den
      // vises bevisst ikke som en egen boks her lenger (var alltid 0,
      // forvekslet med brukernes egne steder — se samtalen 2026-08-12).
      const statBoxes = [
        [s.malepunkter.totalt, `målepunkt${s.malepunkter.totalt===1?'':'er'} (${fylkerDekket} fylke${fylkerDekket===1?'':'r'}, ${kommunerDekket} kommune${kommunerDekket===1?'':'r'})`],
        [totalFunn, 'brukerregistrerte funn'],
        [totalHogst, 'brukerregistrerte hogstfelt (merking + tegnede områder)'],
        [totalEgneSteder, 'egne steder (brukerregistrert, utenfor kjente målepunkter)'],
        [s.artsfunn.totalt, `Artsdatabanken-funn (${s.artsfunn.arter} art${s.artsfunn.arter===1?'':'er'})`],
        [s.dekning.kjoringer, `områdehentinger${s.dekning.sisteHenting ? ' — siste ' + formatKortDato(s.dekning.sisteHenting) : ''}`],
      ];

      const fylkeRader = s.malepunkter.perFylke.map(f =>
        `<div class="sp-mine-row"><span>${escapeHtml(f.fylke)}</span><span>${f.antall}</span></div>`).join('');

      const kommuneRader = s.malepunkter.perKommune.map(k =>
        `<div class="sp-mine-row"><span>${escapeHtml(k.kommune)} <span style="opacity:.6">— ${escapeHtml(k.fylke)}</span></span><span>${k.antall}</span></div>`).join('');

      const brukerRader = s.brukere.map(b => `
        <div class="sp-mine-row" style="align-items:flex-start;">
          <span>${escapeHtml(b.kortnavn)}
            <span style="opacity:.6">— ${b.rolle}${b.status==='deaktivert' ? ' · deaktivert' : ''}${b.slettet ? ' · slettet' : ''}${b.oppdatert ? ' · sist endret ' + formatKortDato(b.oppdatert) : ''}</span>
          </span>
          <span style="text-align:right;white-space:nowrap;">${b.funn} funn · ${b.hogstMerket + b.hogstOmrader} hogstfelt · ${b.egneSteder} egne steder</span>
        </div>`).join('') || '<div class="sp-empty-mine">Ingen brukere ennå.</div>';

      // RETTET 2026-08-13 (bruker ba om et sammendrag av mest populære
      // favoritt-sopper): s.favoritter.topp er allerede aggregert og
      // sortert server-side (se hentStatistikk() i
      // worker/api/src/routes/admin.js) — kun rå artsID-er, slås opp mot
      // SPECIES her siden artsnavnene kun finnes i frontend. `?.name || id`
      // dekker en art som skulle bli fjernet fra SPECIES-lista mens en
      // bruker fortsatt har den lagret som favoritt — vises da med rå ID
      // i stedet for å forsvinne stille fra tellingen.
      const favorittRader = (s.favoritter?.topp || []).map(f =>
        `<div class="sp-mine-row"><span>${escapeHtml(SPECIES.find(sp => sp.id === f.art)?.name || f.art)}</span><span>${f.antall}</span></div>`).join('');

      el.innerHTML = `
        <div class="sp-stat-grid">
          ${statBoxes.map(([tall, label]) => `<div class="sp-stat-box"><b>${tall}</b><span>${escapeHtml(label)}</span></div>`).join('')}
        </div>

        <h4 style="margin:14px 0 6px;">Målepunkter per fylke</h4>
        <div class="sp-mine-list">${fylkeRader || '<div class="sp-empty-mine">Ingen målepunkter ennå.</div>'}</div>

        <details style="margin-bottom:10px;">
          <summary style="cursor:pointer;font-size:var(--fs-sm);color:var(--ink-soft);">Se alle ${kommunerDekket} kommuner med målepunkter</summary>
          <div class="sp-mine-list" style="margin-top:6px;">${kommuneRader || '<div class="sp-empty-mine">Ingen målepunkter ennå.</div>'}</div>
        </details>

        <h4 style="margin:14px 0 6px;">Mest populære favoritt-sopper</h4>
        <div class="sp-mine-list">${favorittRader || '<div class="sp-empty-mine">Ingen favoritter valgt av noen bruker ennå.</div>'}</div>

        <h4 style="margin:14px 0 6px;">Brukerbidrag <span style="font-weight:400;opacity:.6;">— per bruker (se totaler i boksene over)</span></h4>
        <div class="sp-mine-list">${brukerRader}</div>
      `;
    } catch (err) {
      el.innerHTML = `<div class="sp-empty-mine">⚠ ${escapeHtml(err.message)}</div>`;
    }
  }

  // Kort dato (dd.mm.åååå) for statistikkvisningen — verken ISO-streng eller
  // full toLocaleString()-tidsstempel er lesbart i en tettpakket admin-rad.
  function formatKortDato(isoEllerDatetime){
    const d = new Date(isoEllerDatetime.includes('T') || isoEllerDatetime.includes('Z') ? isoEllerDatetime : isoEllerDatetime.replace(' ', 'T') + 'Z');
    if (isNaN(d)) return isoEllerDatetime;
    return d.toLocaleDateString('nb-NO');
  }

  // ---------- lokasjonsdata (fra fungifinder-api, med innebygd demo-fallback) ----------

  // Samme mønster som findFetchedAreaMatch()/currentAreaLabel() under —
  // server-side filtrering (se worker/api sin terrengDb.js) speiler EKSAKT
  // det fylke/kommune-filteret brukeren allerede har valgt, ikke et nytt,
  // eget filter-konsept. 'radius'-modus og "alle" sender ingen parametre
  // (helt datasett), siden radius-filtrering fortsatt skjer klient-side.
  // RETTET 2026-08-12: for et TVETYDIG kommunenavn (Herøy, Våler — se
  // resolveKommuneNavn()) sendte denne KUN `kommune`, aldri `fylke`, selv om
  // brukeren hadde disambiguert via "snevre inn"-menyen. Serveren sin
  // hentTerrengStederFraDb() støtter allerede BEGGE filtrene samtidig (AND) —
  // v0.21.3 disambiguerte kun selve HENTING/zoom/estimat (se der), aldri
  // denne, den faktiske datalastingen. Konsekvens: valgte man "Våler,
  // Østfold" viste appen likevel EVENTUELLE Innlandet-Våler-steder også
  // (WHERE kommune='Våler' uten fylke-vilkår) — feil DATA vist, ikke bare
  // feil kart-zoom. Sender nå `fylke` i tillegg til `kommune` når navnet
  // faktisk er tvetydig OG disambiguert via kommuneNarrowFylke — uendret for
  // de resterende ~355 entydige kommunenavnene.
  function currentServerFilterParams(){
    if (filterMode === 'fylke' && fylkeFilter !== 'alle') return { fylke: fylkeFilter };
    if (filterMode === 'kommune' && kommuneFilter !== 'alle') {
      const params = { kommune: kommuneFilter };
      const treff = kommunerMedNavn(kommuneFilter);
      if (treff.length > 1 && kommuneNarrowFylke !== 'alle' && treff.some(t => t.fylkesnavn === kommuneNarrowFylke)) {
        params.fylke = kommuneNarrowFylke;
      }
      return params;
    }
    return {};
  }

  // RETTET (server-side filtrering, se D1-MIGRASJON.md): kalles nå på nytt
  // ved hvert filterbytte (se wiring-seksjonen nederst i filen), ikke bare
  // én gang ved innlogging — locationsRequestSeq forkaster utdaterte svar
  // hvis brukeren rekker å bytte filter igjen før forrige kall er ferdig.
  let locationsRequestSeq = 0;
  async function loadLocations(){
    if (!currentUser) return; // beholder BASE_LOCATIONS-demofallbacken definert øverst i filen
    const seq = ++locationsRequestSeq;
    try {
      const data = await window.ApiClient.hentTerrengdata(currentServerFilterParams());
      if (seq !== locationsRequestSeq) return; // et nyere filterbytte har allerede startet et ferskere kall
      // Tom liste er nå et GYLDIG svar (f.eks. en kommune uten analyserte
      // steder ennå) — skal vise "ingenting her", ikke stille beholde
      // forrige filters data. Kun ekte feil (fanget under) beholder gammel
      // BASE_LOCATIONS.
      if (Array.isArray(data)) { BASE_LOCATIONS = data; bumpScoreCache(); }
    } catch (e) {
      if (seq !== locationsRequestSeq) return;
      console.warn('Kunne ikke laste terrengdata.', e);
    }
  }

  // Admin-only server-side (se worker/api/src/routes/omrader.js) — kun
  // relevant for "Hent terrengdata"-panelet, som selv er skjult for
  // ikke-admin (se updateFetchPanel).
  async function loadFetchedAreas(){
    if (!isAdmin()) { fetchedAreas = []; return; }
    try {
      fetchedAreas = await window.ApiClient.hentOmraderDekning();
    } catch (e) {
      console.warn('Kunne ikke laste dekningsdata.', e);
      fetchedAreas = [];
    }
  }

  // RETTET 2026-08-13 (bruker meldte mistanke om at treg/rotete kart-
  // oppstart skyldtes at for mange artsobservasjoner ble hentet/tegnet):
  // "bbox-filtrert rundt synlig utsnitt" (steg 2/3 under) beskytter IKKE
  // mot et vidt, uzoomet utsnitt — ved oppstart (default "Alle fylker",
  // hele Norge synlig) ER det synlige utsnittet hele landet, så bbox-
  // filteret alene gjorde ingenting for akkurat det tilfellet. Artskart-
  // laget skal derfor nå kun eksistere når brukeren enten har valgt et
  // konkret fylke/kommune/radius-senter, ELLER har zoomet inn til et nivå
  // som tilsvarer det samme (typisk fylke-størrelse eller mindre) — se
  // artskartOmradeErAvgrenset()/ARTSKART_MIN_ZOOM under. Ved en vid,
  // ufiltrert nasjonal visning tegnes laget rett og slett ikke.
  const ARTSKART_MIN_ZOOM = 9; // ca. tilsvarende et gjennomsnittlig fylke-utsnitt eller mindre
  function artskartOmradeErAvgrenset(){
    if (filterMode === 'fylke') return fylkeFilter !== 'alle';
    if (filterMode === 'kommune') return kommuneFilter !== 'alle';
    if (filterMode === 'radius') return !!radiusCenter;
    return false;
  }
  function artskartSkalHentesOgVises(){
    if (!leafletMap) return false;
    if (artskartOmradeErAvgrenset()) return true;
    return leafletMap.getZoom() >= ARTSKART_MIN_ZOOM;
  }

  // RETTET 2026-08-17 (bruker meldte at "Foreslå områder" fokuserte på HELE
  // Norge selv om vedkommende hadde navigert/zoomet kartet til et bestemt
  // utsnitt, uten å eksplisitt ha valgt fylke/kommune/radius): svaret var
  // "ingenting" — søket dekket alltid hele Norge uansett kartutsnitt.
  // Første runde (v0.27.3) fikset dette KUN for "Foreslå områder"-knappen
  // (egen foreslaOmraderFallbackUtsnitt()/isInForeslaOmraderScope()), men
  // etterlot resultatlisten/kartmarkørene/værsammendraget upåvirket — som
  // viste seg selv å være forvirrende, siden brukeren da kunne se "Foreslå
  // områder" telle et annet antall punkter enn det lista/kartet viste
  // samtidig. Utvidet i v0.28.2 til samme "et bevisst utsnitt kan også
  // vises via zoom, ikke bare via filter"-mønster som Artskart-laget over
  // (artskartOmradeErAvgrenset()/ARTSKART_MIN_ZOOM, gjenbrukt her), men nå
  // ETT sted (viewportImpliesScope(), brukt direkte av isInCurrentScope()
  // over/currentScopeKey()/currentAreaLabel() under) — alle fire stedene
  // som deler isInCurrentScope() (kartprikkene, resultatlisten,
  // værsammendraget OG "Foreslå områder") kan derfor ikke lenger vise ulikt
  // scope samtidig. De tre særskilte foreslaOmrader*()-funksjonene fra
  // v0.27.3 er dermed overflødige og fjernet — isInCurrentScope()/
  // currentAreaLabel() dekker nå akkurat det de gjorde, pluss resten av
  // appen.
  function viewportImpliesScope(){
    return !!leafletMap && !artskartOmradeErAvgrenset() && leafletMap.getZoom() >= ARTSKART_MIN_ZOOM;
  }

  // Ekte Artsdatabanken-observasjoner (art/koordinat/dato), hentet av
  // fetch_area.py og akkumulert i D1 (se fungifinder-db).
  //
  // RETTET (lastetid, steg 2/3 — se D1-MIGRASJON.md): bbox-filtrert
  // server-side rundt kartets synlige utsnitt i stedet for å alltid laste
  // hele det nasjonale datasettet (~31 000 rader, ~1,46 MB gzippet).
  // artsfunnLoadedBounds er utsnittet (PADDET, se under) som faktisk ER
  // hentet — et nytt kall gjøres kun når det synlige utsnittet beveger seg
  // UTENFOR det, ikke ved hver eneste panorering (se moveend-lytteren i
  // initMap()). Paddingen (50 % utover synlig utsnitt) er nettopp det som
  // gjør små panoreringer gratis. renderArtskartLayer() filtrerer deretter
  // dette (allerede reduserte) settet stramt til nøyaktig synlig utsnitt
  // for selve visningen — uendret av dette.
  let artsfunnLoadedBounds = null;
  let artsfunnRequestSeq = 0;
  async function loadArtsfunn(){
    if (!currentUser) { artsfunn = []; artsfunnLoadedBounds = null; return; }
    if (!leafletMap) { artsfunn = []; return; } // kartet ikke initialisert ennå — bør ikke skje gitt call-rekkefølgen i init()
    if (!artskartSkalHentesOgVises()) { artsfunn = []; artsfunnLoadedBounds = null; return; } // for vidt/uavgrenset utsnitt — se begrunnelse over
    const synlig = leafletMap.getBounds();
    if (artsfunnLoadedBounds && artsfunnLoadedBounds.contains(synlig)) return; // allerede dekket, ingen ny nettverksrundtur
    const hentUtsnitt = synlig.pad(0.5);
    const seq = ++artsfunnRequestSeq;
    try {
      const data = await window.ApiClient.hentArtsfunn({
        minLat: hentUtsnitt.getSouth(), maxLat: hentUtsnitt.getNorth(),
        minLon: hentUtsnitt.getWest(), maxLon: hentUtsnitt.getEast(),
      });
      if (seq !== artsfunnRequestSeq) return; // et nyere kall (senere panorering) er allerede i gang
      artsfunn = Array.isArray(data) ? data : [];
      artsfunnLoadedBounds = hentUtsnitt;
    } catch (e) {
      if (seq !== artsfunnRequestSeq) return;
      console.warn('Kunne ikke laste artsfunn.', e);
      artsfunn = [];
      artsfunnLoadedBounds = null;
    }
  }

  // Andre brukeres DELTE funn (se delFunn/hentDelteFunn()) — i motsetning
  // til loadArtsfunn() over er dette datasettet begrenset av ANTALL
  // brukere som faktisk har skrudd på deling (typisk noen få, ikke et
  // nasjonalt ~31 000-rads datasett), så det hentes i sin helhet én gang
  // per innlogget økt i stedet for kartutsnitt-begrenset — ingen av
  // begrunnelsene for artsfunnLoadedBounds/artskartSkalHentesOgVises
  // (v0.21.11) gjelder her i praksis.
  async function loadDelteFunn(){
    if (!currentUser) { delteFunn = []; return; }
    try {
      const data = await window.ApiClient.hentDelteFunn();
      delteFunn = Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Kunne ikke laste delte funn fra andre brukere.', e);
      delteFunn = [];
    }
  }

  // ---------- on-demand henting av terrengdata ----------

  function findFetchedAreaMatch(){
    if (filterMode === 'fylke' && fylkeFilter !== 'alle') {
      return fetchedAreas.find(a => a.mode === 'fylke' && a.value === fylkeFilter) || null;
    }
    if (filterMode === 'kommune' && kommuneFilter !== 'alle') {
      return fetchedAreas.find(a => a.mode === 'kommune' && a.value === kommuneFilter) || null;
    }
    if (filterMode === 'radius' && radiusCenter) {
      return fetchedAreas.find(a => a.mode === 'radius' && a.lat != null &&
        haversineKm(a.lat, a.lon, radiusCenter.lat, radiusCenter.lon) < 2 &&
        a.radiusKm >= radiusKm) || null;
    }
    return null;
  }

  // RETTET 2026-08-16: se isInCurrentScope()-kommentaren — returnerer nå
  // "synlig kartutsnitt" i stedet for null når man har zoomet inn nok uten
  // å ha valgt noe eksplisitt, slik at updateCoverageLine() under kan vise
  // en presis merkelapp for AKKURAT det som faktisk blir søkt i, ikke bare
  // late som ingenting er valgt. `null` betyr nå kun "reelt uavgrenset,
  // helt utzoomet — søket dekker faktisk hele landet", se grenen under.
  function currentAreaLabel(){
    if (filterMode === 'fylke' && fylkeFilter !== 'alle') return fylkeFilter;
    if (filterMode === 'kommune' && kommuneFilter !== 'alle') return kommuneFilter;
    if (filterMode === 'radius' && radiusCenter) return `${radiusKm} km rundt valgt punkt`;
    if (viewportImpliesScope()) return 'synlig kartutsnitt';
    return null;
  }

  // Svarer på "er dette terrenget allerede analysert, helt/delvis, eller
  // nytt?" FØR brukeren må gjette seg til om "Foreslå områder" eller "Hent
  // data" er riktig neste steg — count er antall kjente punkter (inkl.
  // flatehogde) i gjeldende fylke/kommune/radius-filter, samme sett som
  // suggestAreas() selv bruker (før egen isCut-filtrering der).
  function updateCoverageLine(count){
    const line = document.getElementById('sp-coverage-line');
    const suggestBtn = document.getElementById('sp-route-suggest');
    if (!line || !suggestBtn || !personalFeaturesEnabled()) return;
    // currentAreaLabel() (ikke en egen foreslaOmraderScopeLabel()) — siden
    // v0.28.2 gjelder kartutsnitt-fallbacken app-vide (se
    // viewportImpliesScope()-kommentaren ved isInCurrentScope()), så denne
    // linjen kan bruke samme merkelapp-funksjon som resten av appen.
    const areaLabel = currentAreaLabel();
    // RETTET 2026-08-16 (bruker-spørsmål om "Foreslå områder" uten valgt
    // fylke/kommune/radius): denne linjen ble tidligere BARE SKJULT når
    // ingenting var valgt — akkurat det tilfellet der brukeren mest trenger
    // å vite at "Foreslå områder" da søker i HELE Norge, uansett hvor
    // kartet er panorert (currentAreaLabel() er fortsatt null i det ekte
    // uavgrensede tilfellet — se kommentaren der; det zoomede/implisitte
    // kartutsnitt-tilfellet har nå sin egen merkelapp og havner i den
    // vanlige count-grenen under i stedet).
    if (!areaLabel) {
      line.style.display = '';
      line.textContent = count > 0
        ? `Ingen fylke/kommune/radius valgt — søker i hele Norge (${count} kjente punkter). Zoom inn, eller velg fylke/kommune/radius, for mer treffsikre forslag.`
        : 'Ingen fylke/kommune/radius valgt, og ingen kjente punkter lastet ennå.';
      suggestBtn.disabled = count === 0;
      return;
    }
    line.style.display = '';
    if (count === 0) {
      line.innerHTML = `⚠ Ingen kjente punkter i ${escapeHtml(areaLabel)} ennå — <a href="#sp-fetch-panel" id="sp-coverage-fetch-link">hent terrengdata</a> først.`;
      suggestBtn.disabled = true;
      const link = document.getElementById('sp-coverage-fetch-link');
      if (link) link.addEventListener('click', (e) => {
        e.preventDefault();
        setMobileView('kart');
        document.getElementById('sp-fetch-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    } else if (count < AREA_COVERAGE_THIN_THRESHOLD) {
      line.textContent = `${count} kjent${count===1?'':'e'} punkt${count===1?'':'er'} i ${areaLabel} — tynt datagrunnlag, forslagene kan bli få.`;
      suggestBtn.disabled = false;
    } else {
      line.textContent = `${count} kjente punkter i ${areaLabel} — god dekning.`;
      suggestBtn.disabled = false;
    }
  }

  // RETTET 2026-08-12 (bruker meldte at kart-zoom til fylke/kommune etter
  // "min posisjon" var "ekstremt ustabilt — virker som regel ikke, av og
  // til virker det, og tar ekstremt lang tid de gangene det virker"):
  //
  // Faste bounding boxes for alle 15 fylker (Nominatim, structured
  // county=-søk, verifisert 2026-08-12 — se boks-verdiene under). ELIMINERER
  // Nominatim-avhengigheten helt for fylke-modus (den klart vanligste
  // banen: brukeren har typisk allerede sett sin egen posisjon og velger
  // fylket de står i) — ingen nettverkskall, ingen forsinkelse, ingen
  // feilmulighet.
  //
  // Rotårsaken til at det "som regel ikke virket": den gamle koden brukte
  // et FRITEKST-søk (`q=<navn> fylke, Norge`) med limit=1, og stolte blindt
  // på Nominatims mest "importante" treff — nøyaktig samme bug som allerede
  // ble funnet og fikset SERVER-side i fungifinder-db sin fetch_area.py
  // (se resolve_area() der, rettet 2026-08-11), men aldri portert til denne
  // klient-side kopien. Konkret verifisert: "Innlandet fylke, Norge" (et av
  // Norges største/mest kjente fylker) matchet IKKE fylket i det hele tatt
  // — Nominatim ga en ubetydelig øy/bydel/grend med samme navn i stedet,
  // og fitBounds() zoomet til et par hundre meter tomt hav. Et strukturert
  // søk (county=<navn>&country=Norway) unngår denne navnekollisjonen helt.
  const FYLKE_BBOX = {
    'Østfold':          [58.7609620, 59.7702660, 10.5366786, 11.8297963],
    'Akershus':         [59.4573270, 60.6051478, 10.1942727, 11.9460044],
    'Oslo':             [59.8093113, 60.1351064, 10.4891652, 10.9513894],
    'Innlandet':        [59.8407846, 62.6969279,  7.3425305, 12.8708486],
    'Buskerud':         [59.4078710, 61.0917205,  7.4388424, 10.6015377],
    'Vestfold':         [58.7204550, 59.6740110,  9.7553357, 10.6750198],
    'Telemark':         [58.6033109, 60.1882718,  7.0962875,  9.9697646],
    'Agder':            [57.7590052, 59.6726869,  6.1496994,  9.6688766],
    'Rogaland':         [58.0278534, 59.8445742,  4.4542745,  7.2146667],
    'Vestland':         [59.4754202, 62.3823948,  4.0875274,  8.3220530],
    'Møre og Romsdal':  [61.9233438, 63.7681691,  4.8166029,  9.3648315],
    'Trøndelag':        [62.2557267, 65.4701752,  7.6480964, 14.3259858],
    'Nordland':         [64.9394973, 69.5967006, 10.5780605, 18.1513549],
    'Troms':            [68.3560138, 70.7036163, 15.5925416, 22.8944659],
    'Finnmark':         [68.5545918, 71.3848787, 20.4797325, 31.7615929],
  };

  // RETTET 2026-08-12: alle 357 kommuner er nå OGSÅ hardkodet, samme
  // begrunnelse og samme gevinst som FYLKE_BBOX over (null nettverksavhengighet,
  // delt "for alltid" på tvers av alle enheter/brukere uten noen ny
  // serverinfrastruktur — vurdert eksplisitt mot en sentral D1-løsning og en
  // ren status-quo-løsning, se diskusjon i chat 2026-08-12). Generert av et
  // engangs Python-script (Nominatim structured search, strukturert
  // city=+county= for de to eneste navnekollisjonene i dagens kommuneregister
  // — Herøy og Våler, verifisert mot Kartverkets Kommuneinfo-API), med
  // manuell etterkontroll av alle 357 (bbox-ordning, innenfor Norges
  // koordinatområde, og at fylkesnavnet faktisk opptrer i Nominatims
  // display_name — avdekket at "Kvam" (Vestland) manglet et 'municipality'-
  // treff under det vanlige søket, siden OSM sitt offisielle navn er "Kvam
  // herad", ikke "Kvam kommune" — fikset manuelt med et fritekst-søk for
  // akkurat den ene kommunen. De 7 Buskerud-kommunene manglet fylkesnavn i
  // Nominatims display_name (sannsynlig etterlevning av Viken-sammenslåingen/
  // -oppløsningen i OSM sin admin-hierarki-tagging), MEN hadde nøyaktig ett
  // sikkert 'municipality'-treff hver med plausibel kommune-størrelse — ikke
  // korrigert, vurdert som en visningstekst-kvirk, ikke en lokasjonsfeil.
  //
  // Nøkler: kommunenavn alene der det er unikt, "Navn, Fylke" for Herøy/Våler
  // (samme format som resolveKommuneNavn() allerede produserer for disse to).
  //
  // Nominatim-oppslaget (under) er IKKE fjernet — beholdt som fallback for et
  // navn som mangler her (f.eks. en fremtidig kommunereform før denne
  // tabellen regenereres manuelt; neste kjente reform er ikke nært
  // forestående). localStorage-cachen dekker da det samme tilfellet på tvers
  // av økter helt til tabellen oppdateres.
  const KOMMUNE_BBOX = {
    "Alstahaug": [65.6949361, 66.0397404, 12.071283, 12.774986],
    "Alta": [69.6454509, 70.4480212, 22.1858185, 24.2182315],
    "Alvdal": [61.9132886, 62.2798171, 10.1220715, 10.9327537],
    "Alver": [60.4953832, 60.8527778, 4.7766975, 5.713821],
    "Andøy": [68.7598603, 69.5967006, 15.0220835, 16.5176434],
    "Aremark": [59.0336806, 59.3381341, 11.5535292, 11.8297963],
    "Arendal": [58.2502715, 58.603528, 8.4997466, 9.3640875],
    "Asker": [59.457327, 59.9059385, 10.2900616, 10.6349941],
    "Askvoll": [61.2195166, 61.4909668, 4.1029714, 5.553389],
    "Askøy": [60.3817748, 60.6318923, 4.8978785, 5.2802587],
    "Aukra": [62.7386545, 63.1459638, 6.3380721, 7.0474024],
    "Aure": [63.115442, 63.4474811, 7.7436771, 8.911065],
    "Aurland": [60.6755477, 61.066348, 6.7210276, 7.7503769],
    "Aurskog-Høland": [59.593646, 60.0236337, 11.2740782, 11.9460044],
    "Austevoll": [59.9135185, 60.1887951, 4.5470538, 5.3318244],
    "Austrheim": [60.7299466, 60.8582191, 4.6862475, 5.0470911],
    "Averøy": [62.9219417, 63.3424898, 6.8605032, 7.756307],
    "Balsfjord": [69.0329977, 69.5298802, 18.3600063, 19.9914321],
    "Bamble": [58.9132855, 59.1257426, 9.3022364, 9.7831286],
    "Bardu": [68.3560138, 69.050904, 17.9847964, 20.2265439],
    "Beiarn": [66.6459327, 67.1380199, 14.3083187, 15.0231705],
    "Bergen": [60.1760905, 60.5360925, 5.1445788, 5.6867918],
    "Berlevåg": [70.4768065, 71.1207012, 28.3852695, 30.0520631],
    "Bindal": [64.9394973, 65.5027091, 10.5780605, 13.1567144],
    "Birkenes": [58.2418745, 58.637223, 7.9313112, 8.4449855],
    "Bjerkreim": [58.5141633, 58.7948755, 5.8640725, 6.622801],
    "Bjørnafjorden": [60.0336026, 60.3536156, 5.2532247, 5.9612943],
    "Bodø": [66.9205542, 67.6996192, 12.7299708, 15.364907],
    "Bokn": [59.1117221, 59.276241, 5.3456846, 5.6446432],
    "Bremanger": [61.662164, 62.0319397, 4.2264953, 5.8771875],
    "Brønnøy": [65.2039167, 65.6235336, 10.6418859, 13.1670375],
    "Bygland": [58.6459127, 59.0981358, 7.0325875, 8.0168434],
    "Bykle": [59.1819154, 59.6726869, 6.8245332, 7.625633],
    "Båtsfjord": [70.2964299, 70.9401427, 29.2176783, 31.222601],
    "Bærum": [59.8257399, 60.0322272, 10.3480241, 10.6580825],
    "Bø": [68.4797342, 69.0010251, 13.4918034, 14.8631194],
    "Bømlo": [59.4961273, 59.938616, 4.6036893, 5.4720287],
    "Dovre": [61.8862986, 62.3431274, 9.0102774, 9.9281999],
    "Drammen": [59.5304326, 59.8625436, 9.9432166, 10.4244968],
    "Drangedal": [58.88496, 59.2967042, 8.5796876, 9.3987039],
    "Dyrøy": [68.9024073, 69.1492033, 17.2432834, 18.0522489],
    "Dønna": [65.9961082, 66.3341799, 11.8399535, 12.8341013],
    "Eidfjord": [60.0989292, 60.5920286, 6.7835028, 7.7321147],
    "Eidskog": [59.8407846, 60.1415816, 11.793048, 12.3586827],
    "Eidsvoll": [60.2259732, 60.6051478, 11.0720954, 11.4219334],
    "Eigersund": [58.1583309, 58.6493279, 5.5195424, 6.4974996],
    "Elverum": [60.7412611, 61.2042702, 11.2989459, 12.1610889],
    "Enebakk": [59.682404, 59.8560514, 10.9318956, 11.243729],
    "Engerdal": [61.5745423, 62.3744812, 11.5100187, 12.2993709],
    "Etne": [59.5789675, 60.0181857, 5.7642247, 6.5254846],
    "Etnedal": [60.799254, 61.1279841, 9.3776456, 9.8156076],
    "Evenes": [68.4174016, 68.5727656, 16.5525109, 17.3616244],
    "Evje og Hornnes": [58.4418275, 58.7312741, 7.5132362, 8.1121319],
    "Farsund": [57.8188928, 58.2305678, 6.164511, 7.0014159],
    "Fauske": [67.0162175, 67.4539036, 14.9691545, 16.4040997],
    "Fedje": [60.6878205, 60.8872193, 4.1847721, 4.7911799],
    "Fitjar": [59.8076977, 59.999037, 5.0784652, 5.4992757],
    "Fjaler": [61.1800654, 61.3809194, 4.8212814, 5.7317896],
    "Fjord": [62.0653403, 62.4843067, 6.8271551, 7.8285799],
    "Flakstad": [67.8479653, 68.3931785, 12.4701027, 13.5797084],
    "Flatanger": [64.2802552, 64.7781521, 9.699817, 11.1083784],
    "Flekkefjord": [58.020855, 58.5690215, 6.1496994, 6.9263341],
    "Flesberg": [59.7172656, 59.997468, 9.1788003, 9.7219868],
    "Flå": [60.2966591, 60.5719291, 9.0958331, 9.8467178],
    "Folldal": [61.8844453, 62.4278077, 9.5838268, 10.3915928],
    "Fredrikstad": [59.0448769, 59.3240315, 10.6050122, 11.1307181],
    "Frogn": [59.6126598, 59.7791996, 10.5381024, 10.7511602],
    "Froland": [58.4527749, 58.7216465, 7.9558958, 8.7596971],
    "Frosta": [63.4905445, 63.6932771, 10.4885825, 10.9468209],
    "Frøya": [63.5981474, 64.5472941, 7.6480964, 9.7318591],
    "Fyresdal": [58.9286308, 59.3603998, 7.6961591, 8.4060925],
    "Færder": [58.760962, 59.2711412, 10.3302253, 10.6750198],
    "Gamvik": [70.3994812, 71.3296486, 27.3514988, 29.160778],
    "Gausdal": [61.1074497, 61.421018, 9.3008703, 10.3676542],
    "Gildeskål": [66.7693937, 67.242473, 13.2962774, 14.4113478],
    "Giske": [62.4435933, 62.8119799, 5.3412654, 6.1910165],
    "Gjemnes": [62.821059, 63.0155969, 7.3848667, 8.1388528],
    "Gjerdrum": [60.0285337, 60.1289972, 10.9111429, 11.1161385],
    "Gjerstad": [58.763187, 58.9932272, 8.7544691, 9.1912359],
    "Gjesdal": [58.6724851, 58.9899954, 5.7989873, 6.6655257],
    "Gjøvik": [60.7074703, 61.0368264, 10.1676618, 10.7447645],
    "Gloppen": [61.5859592, 61.8692801, 5.6365886, 6.7581119],
    "Gol": [60.6312093, 60.8717148, 8.7185831, 9.3321101],
    "Gran": [60.3120669, 60.5648112, 10.1248062, 10.9339027],
    "Grane": [65.099078, 65.7857499, 12.933083, 13.8765682],
    "Gratangen": [68.5970085, 68.831787, 17.1618897, 17.8428978],
    "Grimstad": [58.0813693, 58.4917703, 8.3086759, 9.0672692],
    "Grong": [64.3323577, 64.7263664, 12.0708767, 13.0909658],
    "Grue": [60.2768258, 60.5506578, 11.7956966, 12.606883],
    "Gulen": [60.8055195, 61.1178481, 4.6106537, 5.6248649],
    "Hadsel": [68.3190767, 68.6879695, 14.1360799, 15.4428544],
    "Halden": [58.8768946, 59.2596125, 11.1535046, 11.71051],
    "Hamar": [60.7689841, 61.2360447, 10.9809795, 11.2796864],
    "Hamarøy": [67.5340261, 68.3150325, 15.0605975, 16.9298494],
    "Hammerfest": [70.0965226, 71.1862281, 22.2983382, 24.9772074],
    "Haram": [62.5092366, 62.9270821, 5.6412388, 6.8404002],
    "Hareid": [62.2751604, 62.4442993, 5.9006344, 6.166655],
    "Harstad": [68.5503647, 69.3125978, 16.0523138, 16.9458139],
    "Hasvik": [70.2801957, 70.9876804, 21.1759264, 22.899466],
    "Hattfjelldal": [65.1082946, 65.8917186, 13.6255502, 14.6254777],
    "Haugesund": [59.3831214, 59.5581632, 4.5689183, 5.3972594],
    "Heim": [63.0120842, 63.4815078, 8.1026646, 9.4540949],
    "Hemnes": [65.7658343, 66.2569349, 13.333799, 14.6023101],
    "Hemsedal": [60.7640389, 61.0917205, 8.0408723, 8.9189976],
    "Herøy, Nordland": [65.8519422, 66.4044875, 10.9538864, 12.4823566],
    "Herøy, Møre og Romsdal": [62.205851, 62.6659501, 4.8874012, 5.8572934],
    "Hitra": [63.3594135, 63.7736462, 8.1086516, 9.4457284],
    "Hjartdal": [59.5289172, 59.8546275, 8.370913, 9.0224735],
    "Hjelmeland": [59.0367345, 59.3752536, 5.9521484, 6.8651424],
    "Hol": [60.3410307, 60.8665699, 7.4388424, 8.622496],
    "Hole": [59.9564541, 60.1265621, 10.1245402, 10.4777426],
    "Holmestrand": [59.4442572, 59.674011, 9.9153293, 10.4558138],
    "Holtålen": [62.6616682, 63.0638696, 10.7923616, 11.8078634],
    "Horten": [59.3409356, 59.4798834, 10.3334974, 10.5952746],
    "Hurdal": [60.3303879, 60.5241894, 10.6719777, 11.1393147],
    "Hustadvika": [62.7521446, 63.2733152, 6.4993041, 7.6153313],
    "Hvaler": [58.760962, 59.1391961, 10.593096, 11.1673425],
    "Hyllestad": [61.0524318, 61.2821947, 4.9172014, 5.4505385],
    "Hå": [58.3325082, 58.7053228, 5.1632406, 5.9347034],
    "Hægebostad": [58.2823686, 58.6707295, 7.0680694, 7.3789055],
    "Høyanger": [60.9514996, 61.2978191, 5.3738601, 6.4111167],
    "Høylandet": [64.5257896, 64.9870512, 12.0236624, 12.7332087],
    "Ibestad": [68.7012337, 68.9733338, 16.7164203, 17.5320103],
    "Inderøy": [63.6996265, 64.0003394, 10.6365241, 11.5244928],
    "Indre Fosen": [63.4545677, 63.8656805, 9.7428713, 10.8754795],
    "Indre Østfold": [59.450145, 59.770266, 10.771332, 11.551],
    "Iveland": [58.3085978, 58.5573972, 7.7822616, 8.1098785],
    "Jevnaker": [60.1647785, 60.4003418, 10.1942727, 10.5768931],
    "Karasjok": [68.8808027, 69.9031575, 24.193806, 26.260394],
    "Karlsøy": [69.7983577, 70.7036163, 17.8052487, 20.6226114],
    "Karmøy": [58.9559574, 59.5036093, 4.5312376, 5.4300722],
    "Kautokeino": [68.5545918, 69.7129616, 21.9839517, 25.4016007],
    "Kinn": [61.4563294, 62.1808441, 4.1298997, 5.7334397],
    "Klepp": [58.6236272, 58.8416699, 5.0718957, 5.738671],
    "Kongsberg": [59.407871, 59.7813389, 9.3332915, 10.0599676],
    "Kongsvinger": [59.9817067, 60.3981418, 11.8307151, 12.5419062],
    "Kragerø": [58.6033109, 59.0009169, 9.1605312, 9.9697646],
    "Kristiansand": [57.8020345, 58.3689526, 7.5272986, 8.3716803],
    "Kristiansund": [63.005339, 63.4289274, 6.9712936, 7.9312612],
    "Krødsherad": [60.0709447, 60.3139862, 9.4586454, 9.881705],
    "Kvam": [60.0997895, 60.5336024, 5.8547985, 6.5256021],
    "Kvinesdal": [58.2133191, 58.8227069, 6.7130083, 7.1838457],
    "Kvinnherad": [59.6861116, 60.2170912, 5.5694068, 6.4831274],
    "Kviteseid": [59.2427903, 59.5741321, 8.1412076, 8.8827914],
    "Kvitsøy": [58.9193324, 59.1282752, 4.9591183, 5.5454057],
    "Kvæfjord": [68.4433417, 68.9317845, 15.5925416, 16.4224745],
    "Kvænangen": [69.4822952, 70.2375049, 21.0066229, 22.8944659],
    "Kåfjord": [69.2343085, 69.7587013, 20.2744291, 21.2793177],
    "Larvik": [58.720455, 59.4730291, 9.7553357, 10.3009223],
    "Lavangen": [68.5998327, 68.8338898, 17.4264208, 18.0513982],
    "Lebesby": [69.9731169, 71.351786, 25.9130463, 27.7742915],
    "Leirfjord": [65.9492213, 66.2424042, 12.6170376, 13.4904942],
    "Leka": [64.9961933, 65.4701752, 10.3659464, 11.9602073],
    "Lesja": [62.0008508, 62.3784024, 7.9836099, 9.3192365],
    "Levanger": [63.5512226, 63.8359897, 10.7952895, 11.7285141],
    "Lier": [59.716095, 59.9745623, 10.0619953, 10.3773009],
    "Lierne": [64.0079704, 64.8221244, 13.0694975, 14.1571101],
    "Lillehammer": [61.0185515, 61.2480272, 10.0377333, 10.7436698],
    "Lillesand": [57.9172341, 58.3333, 8.1445221, 8.7538233],
    "Lillestrøm": [59.75385, 60.0772471, 10.9337342, 11.4395062],
    "Lindesnes": [57.7590052, 58.4732949, 6.9348745, 7.879244],
    "Lom": [61.3977344, 62.0309644, 7.8956509, 8.9926876],
    "Loppa": [70.0386959, 70.7900178, 20.4797325, 22.6036925],
    "Lund": [58.2995084, 58.6278771, 6.2633009, 6.6321505],
    "Lunner": [60.1316098, 60.339115, 10.4563476, 10.8647392],
    "Lurøy": [66.2324726, 66.644675, 11.9945467, 13.2624311],
    "Luster": [61.1817453, 61.8575094, 6.8057584, 8.322053],
    "Lyngdal": [57.7877472, 58.5156093, 6.7724752, 7.5324857],
    "Lyngen": [69.4014778, 70.0577297, 19.7157687, 20.5005679],
    "Lærdal": [60.8417074, 61.2354989, 6.9988112, 8.2826614],
    "Lødingen": [68.174988, 68.6138976, 15.1259672, 16.1608191],
    "Lørenskog": [59.8363839, 59.957957, 10.9071585, 11.0306255],
    "Løten": [60.6752482, 61.0552588, 11.2197785, 11.642981],
    "Malvik": [63.2950495, 63.4952939, 10.5393212, 10.9645941],
    "Marker": [59.2981762, 59.677216, 11.492274, 11.8215292],
    "Masfjorden": [60.7030894, 60.9855043, 5.1098855, 5.865183],
    "Melhus": [63.0196857, 63.3446323, 9.8784072, 10.7161636],
    "Meløy": [66.6204212, 67.2754045, 12.3441356, 14.419009],
    "Meråker": [63.1806873, 63.6331543, 11.4545617, 12.2128784],
    "Midt-Telemark": [59.3221423, 59.5359047, 8.8197424, 9.4717443],
    "Midtre Gauldal": [62.6454667, 63.1435884, 9.9879171, 10.9985658],
    "Modalen": [60.7241011, 61.0352379, 5.650354, 6.210361],
    "Modum": [59.849747, 60.1708189, 9.7129121, 10.2940385],
    "Molde": [62.3317442, 62.871439, 6.447003, 8.7316469],
    "Moskenes": [67.6740713, 68.1524523, 12.1666037, 13.6949774],
    "Moss": [59.2938793, 59.5345809, 10.5366786, 10.8207674],
    "Målselv": [68.5579418, 69.3771861, 18.1782787, 20.3358731],
    "Måsøy": [70.6182749, 71.3356767, 23.247464, 25.5002661],
    "Namsos": [64.0978813, 64.8350352, 10.7382051, 12.2168543],
    "Namsskogan": [64.5030398, 65.1167301, 12.5162225, 13.6289204],
    "Nannestad": [60.1062918, 60.346692, 10.7720265, 11.1291981],
    "Narvik": [67.9693704, 68.6084547, 15.9014286, 18.1513549],
    "Nes": [59.9884522, 60.3525631, 11.2544694, 11.8226951],
    "Nesbyen": [60.3932399, 60.7011685, 8.6814472, 9.4351854],
    "Nesna": [66.1480163, 66.331546, 12.6270756, 13.3240479],
    "Nesodden": [59.7221195, 59.8844105, 10.5421006, 10.7440197],
    "Nesseby": [69.8491926, 70.4065458, 28.3044119, 29.3444093],
    "Nissedal": [58.8313982, 59.2672718, 8.2864743, 8.8341761],
    "Nittedal": [59.9728646, 60.1880187, 10.6751916, 10.9959521],
    "Nome": [59.142339, 59.3852784, 8.820559, 9.4429959],
    "Nord-Aurdal": [60.7673587, 61.2406969, 8.8894537, 9.6902553],
    "Nord-Fron": [61.3408882, 61.8663096, 8.8996456, 10.0149589],
    "Nord-Odal": [60.2954292, 60.5841534, 11.342259, 11.8372522],
    "Nordkapp": [70.6563022, 71.3848787, 24.9197957, 27.0606974],
    "Nordre Follo": [59.618677, 59.8392832, 10.7186403, 10.9919779],
    "Nordre Land": [60.726064, 61.1658468, 9.6320295, 10.2538086],
    "Nordreisa": [69.0730775, 69.9821019, 20.3844082, 22.5330088],
    "Nore og Uvdal": [60.0709937, 60.5120716, 7.4882618, 9.2178472],
    "Notodden": [59.4758021, 59.8982872, 8.7792812, 9.5152635],
    "Nærøysund": [64.5887927, 65.2652062, 9.803794, 12.5808878],
    "Oppdal": [62.2557267, 62.8160499, 8.919962, 10.0975831],
    "Orkland": [62.8904314, 63.6718421, 9.1468669, 10.0541166],
    "Os": [62.1341897, 62.6962957, 10.7215514, 11.8568048],
    "Osen": [64.1634132, 64.7284516, 9.3252402, 10.9273253],
    "Oslo": [59.8093113, 60.1351064, 10.4891652, 10.9513894],
    "Osterøy": [60.4254134, 60.7164399, 5.3174331, 5.722935],
    "Overhalla": [64.2835172, 64.6777256, 11.6032929, 12.2279753],
    "Porsanger": [69.7308732, 70.7550634, 23.9113654, 26.14846],
    "Porsgrunn": [58.9978122, 59.2092317, 9.6063317, 9.8964165],
    "Rakkestad": [59.2363812, 59.484318, 11.1881553, 11.5974159],
    "Rana": [66.0955595, 66.7838769, 13.1882704, 15.5333651],
    "Randaberg": [58.9696181, 59.0724445, 5.4451174, 5.6834915],
    "Rauma": [62.1707779, 62.7229818, 7.2254618, 8.2058521],
    "Rendalen": [61.412906, 62.2003119, 10.4484857, 11.8432679],
    "Rennebu": [62.5582348, 62.9743121, 9.4215663, 10.3250767],
    "Rindal": [62.7941067, 63.2118954, 8.9590208, 9.5835544],
    "Ringebu": [61.3624511, 61.751767, 9.9386537, 10.7050444],
    "Ringerike": [60.0172599, 60.637926, 9.7045085, 10.6015377],
    "Ringsaker": [60.6757445, 61.2955362, 10.4429508, 11.1176977],
    "Risør": [58.5236357, 58.8298823, 8.9943013, 9.6688766],
    "Rollag": [59.879399, 60.1524471, 8.9706605, 9.4660496],
    "Råde": [59.2523161, 59.4110361, 10.5903316, 10.977966],
    "Rælingen": [59.8271786, 59.9548539, 11.010827, 11.1736365],
    "Rødøy": [66.3971472, 67.1246861, 11.6675307, 13.8724021],
    "Røros": [62.3098881, 62.8291554, 11.1245396, 12.2546583],
    "Røst": [67.0155966, 67.7818211, 11.3030624, 12.8265351],
    "Røyrvik": [64.5030398, 65.139249, 13.0394643, 14.3259858],
    "Salangen": [68.7390894, 69.0106235, 17.4291295, 18.2269448],
    "Saltdal": [66.5578579, 67.20484, 14.9699467, 16.3063971],
    "Samnanger": [60.285927, 60.526576, 5.5705042, 5.9910711],
    "Sande": [62.1547582, 62.4332367, 4.8166029, 5.7933462],
    "Sandefjord": [58.7712773, 59.3885175, 9.9925625, 10.3812932],
    "Sandnes": [58.7768064, 59.1925893, 5.6097063, 6.9391726],
    "Sarpsborg": [59.0926181, 59.4172717, 10.9477581, 11.3480427],
    "Sauda": [59.5626034, 59.8445742, 6.1780959, 6.6935112],
    "Sel": [61.5603742, 61.9574006, 9.1121186, 10.0155035],
    "Selbu": [63.0038452, 63.3478942, 10.6204979, 11.6317716],
    "Seljord": [59.3515717, 59.7950685, 8.2064931, 8.9175878],
    "Senja": [68.9519478, 69.8115436, 16.2543508, 18.5487983],
    "Sigdal": [59.8962415, 60.3646767, 9.1340053, 9.8588761],
    "Siljan": [59.1948061, 59.4249008, 9.5805763, 9.8781234],
    "Sirdal": [58.5004214, 59.1896867, 6.4360697, 7.2048602],
    "Skaun": [63.1673389, 63.3729844, 9.889994, 10.2309803],
    "Skien": [59.0452565, 59.4872544, 9.227647, 9.7797042],
    "Skiptvet": [59.392866, 59.549251, 11.057182, 11.240905],
    "Skjervøy": [69.8162097, 70.5797013, 20.2226417, 21.4386894],
    "Skjåk": [61.6791371, 62.1896869, 7.3425305, 8.5913649],
    "Smøla": [63.2024224, 63.7681691, 7.1106587, 8.3429343],
    "Snåsa": [63.9569229, 64.4338447, 11.9553881, 13.2480307],
    "Sogndal": [61.0897294, 61.5702471, 6.2519839, 7.4298011],
    "Sokndal": [58.0278534, 58.476866, 5.871746, 6.5226359],
    "Sola": [58.7821535, 58.9820906, 5.0076644, 5.7029903],
    "Solund": [60.8333525, 61.2524055, 4.0875274, 5.1556727],
    "Sortland": [68.5259814, 69.0086295, 14.7879356, 16.112267],
    "Stad": [61.8382691, 62.3823948, 4.5789205, 6.4773227],
    "Stange": [60.4587985, 60.7922559, 11.0277772, 11.6543534],
    "Stavanger": [58.8846585, 59.3121017, 5.499034, 6.1313107],
    "Steigen": [67.5867155, 68.1213044, 13.5950498, 15.9110719],
    "Steinkjer": [63.7712418, 64.3302902, 10.4512731, 12.3779535],
    "Stjørdal": [63.3262337, 63.600286, 10.6539288, 11.7281708],
    "Stor-Elvdal": [61.199486, 61.9639085, 10.0526385, 11.3745816],
    "Stord": [59.7235147, 59.9235592, 5.3206214, 5.6508179],
    "Storfjord": [69.0362897, 69.4642809, 19.6422169, 21.1086742],
    "Strand": [58.896106, 59.1432986, 5.7839641, 6.2486049],
    "Stranda": [61.9635468, 62.3721617, 6.6575735, 7.4194568],
    "Stryn": [61.6094839, 62.0340925, 6.2566457, 7.4142293],
    "Sula": [62.3666883, 62.4589786, 6.0119468, 6.3759559],
    "Suldal": [59.3012674, 59.7827767, 5.8743566, 7.2146667],
    "Sunndal": [62.3531934, 62.9412621, 8.2061334, 9.2438222],
    "Sunnfjord": [61.2346904, 61.7016883, 5.2581511, 6.8543069],
    "Surnadal": [62.7117709, 63.133919, 8.2437061, 9.3648315],
    "Sveio": [59.4754202, 59.7546314, 5.1874135, 5.5807255],
    "Sykkylven": [62.2209116, 62.4642486, 6.3634003, 6.8895265],
    "Sømna": [65.1832756, 65.5375601, 10.608885, 12.4646288],
    "Søndre Land": [60.5266947, 60.8787825, 9.9773906, 10.5505346],
    "Sør-Aurdal": [60.4542329, 60.8791715, 9.2577833, 10.036019],
    "Sør-Fron": [61.2924812, 61.913424, 9.1872436, 10.1648223],
    "Sør-Odal": [60.0477837, 60.3767816, 11.5203379, 11.9371889],
    "Sør-Varanger": [69.0108297, 70.0642593, 28.3304762, 31.1983237],
    "Sørfold": [67.2555499, 67.7832442, 15.0636171, 16.4075678],
    "Sørreisa": [68.9804011, 69.2207482, 17.8768197, 18.4608287],
    "Tana": [69.8171137, 70.7616006, 25.76737, 29.2259675],
    "Time": [58.6127703, 58.8018521, 5.6033799, 5.9303033],
    "Tingvoll": [62.7815496, 63.1293761, 7.8365064, 8.4406445],
    "Tinn": [59.7620717, 60.1882718, 7.8533635, 9.1925944],
    "Tjeldsund": [68.3720844, 68.7369526, 15.9966739, 17.5475894],
    "Tokke": [59.3266403, 59.6010685, 7.5145501, 8.3399617],
    "Tolga": [62.143584, 62.6001197, 10.4738199, 11.6958155],
    "Tromsø": [69.2820889, 70.1684167, 17.1600465, 20.0436387],
    "Trondheim": [63.1598985, 63.5165949, 10.0035259, 10.7251987],
    "Trysil": [61.013078, 61.6991398, 11.7371629, 12.8708486],
    "Træna": [66.3127481, 66.8153715, 11.2977724, 12.4354297],
    "Tvedestrand": [58.4256649, 58.7284891, 8.7330683, 9.531652],
    "Tydal": [62.747917, 63.1942272, 11.2718955, 12.218233],
    "Tynset": [62.0229765, 62.6969279, 10.0057318, 11.2175215],
    "Tysnes": [59.8582288, 60.1244028, 5.3221246, 5.7697338],
    "Tysvær": [59.2090589, 59.4996755, 5.3435758, 5.9219726],
    "Tønsberg": [59.2275836, 59.4824534, 10.042614, 10.590795],
    "Ullensaker": [60.0516074, 60.2565723, 11.0408568, 11.3357242],
    "Ullensvang": [59.69381, 60.4591739, 6.0266156, 7.4882618],
    "Ulstein": [62.2161536, 62.5137065, 5.6806055, 5.9670347],
    "Ulvik": [60.4684718, 60.7408404, 6.7510879, 7.7321147],
    "Utsira": [59.0708773, 59.4442979, 4.4542745, 5.0308139],
    "Vadsø": [69.9750438, 70.4777904, 28.98101, 30.9327449],
    "Vaksdal": [60.4337488, 60.9139723, 5.5868518, 6.3140258],
    "Valle": [58.9393561, 59.3988188, 6.9963845, 7.8210088],
    "Vang": [60.9391596, 61.4456157, 8.0065637, 8.8891578],
    "Vanylven": [61.9604118, 62.2161536, 5.3583934, 5.8640262],
    "Vardø": [70.0127471, 70.6443872, 30.0743583, 31.7615929],
    "Vefsn": [65.4641119, 66.1785412, 12.5847479, 13.7660287],
    "Vega": [65.4876874, 65.9931283, 10.6749731, 12.2399797],
    "Vegårshei": [58.6393262, 58.8713412, 8.6217748, 9.0170796],
    "Vennesla": [58.2166357, 58.4629895, 7.6238969, 8.0794819],
    "Verdal": [63.5934181, 63.9742222, 11.3319211, 12.6835681],
    "Vestby": [59.4718821, 59.6477178, 10.6164384, 10.860056],
    "Vestnes": [62.4462399, 62.6901326, 6.6765768, 7.4128961],
    "Vestre Slidre": [60.8966309, 61.2096353, 8.6540522, 9.1787393],
    "Vestre Toten": [60.5002804, 60.7554091, 10.4848443, 10.7613073],
    "Vestvågøy": [67.7844209, 68.5409843, 13.0036926, 14.1895919],
    "Vevelstad": [65.5173725, 65.7897509, 12.2269269, 13.0409927],
    "Vik": [60.8807347, 61.1907149, 6.1358077, 7.0300821],
    "Vindafjord": [59.4065118, 59.7535628, 5.4599304, 6.1838126],
    "Vinje": [59.4872523, 60.1268519, 7.0962875, 8.3247914],
    "Volda": [61.9233438, 62.2375229, 5.7279211, 6.793988],
    "Voss": [60.414507, 60.9595517, 5.842746, 6.985868],
    "Vågan": [67.9440902, 68.6053074, 13.3880082, 15.2720021],
    "Vågå": [61.386706, 62.0189372, 8.4876727, 9.4308974],
    "Våler, Innlandet": [60.5651385, 61.0615067, 11.6135562, 12.3381076],
    "Våler, Østfold": [59.3869869, 59.541973, 10.7657744, 11.1379169],
    "Værøy": [67.3649612, 67.8700778, 11.9877234, 13.5066787],
    "Åfjord": [63.7712418, 64.395921, 9.6141905, 10.8803872],
    "Ål": [60.4704993, 60.9240476, 7.7751745, 8.8438841],
    "Ålesund": [62.3943575, 63.0913315, 5.8878228, 7.1204593],
    "Åmli": [58.6143409, 58.9850238, 7.9613828, 8.7597123],
    "Åmot": [61.015125, 61.5071949, 10.9577451, 11.9160855],
    "Årdal": [61.1108754, 61.4611984, 7.3780779, 8.2514502],
    "Ås": [59.592284, 59.7659871, 10.6741128, 10.891746],
    "Åseral": [58.4888815, 58.8793683, 7.1410829, 7.667],
    "Åsnes": [60.4715961, 60.8908331, 11.6413414, 12.5982857],
    "Øksnes": [68.7235596, 69.3159723, 14.188904, 15.3837942],
    "Ørland": [63.6083472, 64.0746787, 9.1490604, 10.2156268],
    "Ørsta": [62.0992281, 62.3943575, 5.9222894, 6.7841268],
    "Østre Toten": [60.4705818, 60.7749411, 10.6714723, 11.153986],
    "Øvre Eiker": [59.5824808, 59.9059332, 9.6454701, 10.0619953],
    "Øyer": [61.1829995, 61.4715929, 10.1794297, 10.8490546],
    "Øygarden": [60.1040492, 60.7409047, 4.2661374, 5.2380227],
    "Øystre Slidre": [61.0509185, 61.4507734, 8.7214708, 9.4660037],
  };

  // Fallback for et navn som IKKE finnes i KOMMUNE_BBOX over (f.eks. en ny
  // kommune etter en fremtidig reform) — samme Nominatim-strategi som før
  // denne rettelsen, nå kun en sikkerhetsnett-vei i stedet for hovedveien.
  // Strukturert søk (city=) fjerner navnekollisjonsklassen av feil, PLUSS en
  // 8s timeout (den gamle koden hadde ingen — en treg/hengende Nominatim-
  // respons er trolig forklaringen på "ekstremt lang tid de gangene det
  // virket") og en localStorage-cache på tvers av økter (samme mønster som
  // loadKommuneRegister()).
  const KOMMUNE_BBOX_CACHE_KEY = 'fungifinder-kommune-bbox-cache';
  function lastKommuneBboxCache(){
    try { return JSON.parse(localStorage.getItem(KOMMUNE_BBOX_CACHE_KEY) || '{}'); } catch(e) { return {}; }
  }
  function lagreKommuneBboxCache(cache){
    try { localStorage.setItem(KOMMUNE_BBOX_CACHE_KEY, JSON.stringify(cache)); } catch(e) { /* full/blokkert lagring — ignorer, gjelder bare cache */ }
  }

  async function fetchAreaBbox(mode, name){
    if (!name || name === 'alle') return null;
    if (mode === 'fylke' && FYLKE_BBOX[name]) return FYLKE_BBOX[name];
    if (mode === 'kommune' && KOMMUNE_BBOX[name]) return KOMMUNE_BBOX[name];

    const key = mode + ':' + name;
    if (bboxAreaCache[key] !== undefined) return bboxAreaCache[key].bbox;
    const persistCache = mode === 'kommune' ? lastKommuneBboxCache() : null;
    if (persistCache && persistCache[name] !== undefined) {
      bboxAreaCache[key] = { bbox: persistCache[name] };
      return persistCache[name];
    }

    try {
      const params = mode === 'fylke'
        ? `county=${encodeURIComponent(name)}&country=Norway`
        : `city=${encodeURIComponent(name)}&country=Norway`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      let res;
      try {
        res = await fetch(`https://nominatim.openstreetmap.org/search?${params}&format=jsonv2&limit=1`, {
          headers: { 'Accept-Language': 'no' }, signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }
      const json = await res.json();
      if (!json.length) { bboxAreaCache[key] = { bbox: null }; return null; }
      const bb = json[0].boundingbox.map(parseFloat); // [south, north, west, east]
      bboxAreaCache[key] = { bbox: bb };
      if (mode === 'kommune') {
        const cache = lastKommuneBboxCache();
        cache[name] = bb;
        lagreKommuneBboxCache(cache);
      }
      return bb;
    } catch (e) {
      console.warn('Kunne ikke hente bbox via Nominatim', e);
      bboxAreaCache[key] = { bbox: null };
      return null;
    }
  }

  async function estimateAreaKm2(){
    if (filterMode === 'radius') return Math.PI * radiusKm * radiusKm;
    // Best-effort disambiguering (se resolveKommuneNavn) — faller tilbake
    // til det rå, ev. tvetydige navnet hvis uløst, siden dette bare er et
    // areal-ESTIMAT, ikke noe som trigger en faktisk kostbar jobb.
    const name = filterMode === 'fylke' ? fylkeFilter : (resolveKommuneNavn(kommuneFilter) || kommuneFilter);
    const bb = await fetchAreaBbox(filterMode, name);
    if (!bb) return null;
    const latKm = (bb[1] - bb[0]) * 111.32;
    const midLat = (bb[0] + bb[1]) / 2;
    const lonKm = (bb[3] - bb[2]) * 111.32 * Math.cos(midLat * Math.PI/180);
    return Math.abs(latKm * lonKm);
  }

  // Zoomer kartet til valgt fylke/kommune sin bounding box. Radius-modus har
  // allerede sitt eget senter/zoom-flow (klikk i kartet), så den rører vi ikke.
  async function zoomToAreaSelection(){
    if (!leafletMap || filterMode === 'radius') return;
    // Best-effort disambiguering, samme begrunnelse som estimateAreaKm2() —
    // rent kosmetisk kart-zoom, ikke en jobb-trigger, så et uløst tvetydig
    // navn faller trygt tilbake til det rå navnet i stedet for å blokkere.
    const name = filterMode === 'fylke' ? fylkeFilter : (resolveKommuneNavn(kommuneFilter) || kommuneFilter);
    if (!name || name === 'alle') return;
    const bb = await fetchAreaBbox(filterMode, name);
    if (!bb) return;
    leafletMap.fitBounds([[bb[0], bb[2]], [bb[1], bb[3]]], { maxZoom: 12, padding: [20, 20] });
  }

  // RETTET (bruker meldte at radius-sirkelen ofte falt helt eller delvis
  // utenfor synlig kartutsnitt, uansett standardverdi på radiusKm — enhver
  // fast standardstørrelse ville uansett bare tilfeldigvis passet ÉN gitt
  // zoom, og radiusKm kan justeres fritt via glidebryteren uansett).
  // Zoomer/panorerer i stedet ALLTID slik at hele sirkelen faktisk vises,
  // for hvilken som helst radiusKm — kalles hver gang radiusCenter settes
  // eller radiusKm endres mens et senter allerede er valgt.
  function zoomToRadiusSelection(){
    if (!leafletMap || !radiusCenter) return;
    // RETTET: L.circle(...).getBounds() kaster ("Cannot read properties of
    // undefined (reading 'layerPointToLatLng')") med mindre sirkelen først
    // er lagt til kartet (getBounds() leser projiserte piksel-koordinater
    // satt av _project(), som kun skjer ved addTo()) — fanget i preview før
    // dette noensinne nådde produksjon. Ren lat/lng-matte i stedet, ingen
    // kart-avhengighet: grader breddegrad per km er tilnærmet konstant
    // (111,32 km), lengdegrad justeres for bredde-kompresjon via cos(lat).
    const latOffset = radiusKm / 111.32;
    const lonOffset = radiusKm / (111.32 * Math.cos(radiusCenter.lat * Math.PI / 180));
    const bounds = L.latLngBounds(
      [radiusCenter.lat - latOffset, radiusCenter.lon - lonOffset],
      [radiusCenter.lat + latOffset, radiusCenter.lon + lonOffset]
    );
    leafletMap.fitBounds(bounds, { padding: [20, 20] });
  }

  function describeRunStatus(run){
    if (!run) return 'Ukjent status';
    if (run.status === 'queued') return '⏳ I kø hos GitHub (venter på ledig kapasitet — dette er normalt og kan ta litt tid)';
    if (run.status === 'in_progress') return '⚙ Kjører nå hos GitHub …';
    if (run.status === 'completed') {
      return run.conclusion === 'success' ? '✓ Fullført' : `⚠ Feilet (${run.conclusion})`;
    }
    return `Status: ${run.status}`;
  }

  async function checkForActiveRun(){
    if (!isAdmin()) return null;
    try {
      const run = await window.ApiClient.hentOmradeStatus();
      if (run && (run.status === 'queued' || run.status === 'in_progress')) return run;
    } catch (e) { /* stille feil her — dette er kun en høflig sjekk */ }
    return null;
  }

  async function updateFetchPanel(coverageCount){
    const panel = document.getElementById('sp-fetch-panel');
    // Å sette i gang områdeanalyser er nå admin-only (server-side håndhevet,
    // se worker/api/src/routes/omrader.js) — panelet er helt usynlig for
    // inviterte brukere, ikke bare deaktivert, og vi hopper over det ekte
    // kartoppslaget (estimateAreaKm2 -> fetchAreaBbox) for dem.
    if (!isAdmin()) { panel.style.display = 'none'; return; }
    if (fetchInProgress) { panel.style.display = ''; return; } // behold synlig under pågående henting

    const label = currentAreaLabel();
    if (!label) { panel.style.display = 'none'; return; }

    const match = findFetchedAreaMatch();
    if (match) { panel.style.display = 'none'; return; }

    panel.style.display = '';

    // Sjekk om en jobb allerede kjører (f.eks. fra før siden ble lastet på nytt),
    // slik at vi ikke inviterer til å starte en ny henting oppå en pågående.
    const activeRun = await checkForActiveRun();
    if (activeRun) {
      document.getElementById('sp-fetch-info').textContent = `Ingen ferdig terrengdata for ${label} ennå — men det ser ut som en henting allerede pågår.`;
      document.getElementById('sp-fetch-start').disabled = true;
      document.getElementById('sp-fetch-start').textContent = 'Henting pågår …';
      const progress = document.getElementById('sp-fetch-progress');
      progress.style.display = '';
      progress.textContent = describeRunStatus(activeRun);
      fetchInProgress = true;
      pollFetchStatus(progress);
      return;
    }

    document.getElementById('sp-fetch-start').disabled = false;
    document.getElementById('sp-fetch-start').textContent = 'Hent data';
    // findFetchedAreaMatch() krever et EKSAKT treff (samme fylke/kommune-navn,
    // eller radiussenter+radius) — den vet ikke at en tidligere RADIUS-henting
    // kan dekke det meste av akkurat DENNE kommunen/fylket. Uten dette ga
    // panelet et rett-frem misvisende "ingen data ennå" ved siden av en
    // dekningslinje over "Foreslå områder" som samtidig (korrekt) viste at det
    // fantes mange kjente punkter her — se konteksten som avdekket dette.
    document.getElementById('sp-fetch-info').textContent = coverageCount > 0
      ? `Ingen egen henting registrert for nøyaktig ${label} (trolig dekket delvis av en tidligere henting med annet filter, f.eks. radius) — men ${coverageCount} kjent${coverageCount===1?'':'e'} punkt${coverageCount===1?'':'er'} finnes her allerede. Hent likevel for å fylle ut resten av området.`
      : `Ingen terrengdata hentet for ${label} ennå.`;
    // Rydd bort ev. statustekst fra en TIDLIGERE fullført/feilet henting (f.eks.
    // "Oppdaterer visningen …") — den ble stående synlig under "Hent data" for
    // et helt NYTT område ellers, og ga inntrykk av at noe fortsatt pågikk.
    const progress = document.getElementById('sp-fetch-progress');
    progress.style.display = 'none';
    progress.textContent = '';
    await updateFetchEstimate();
  }

  async function updateFetchEstimate(){
    const est = document.getElementById('sp-fetch-estimate');
    est.textContent = 'Beregner estimat …';
    const areaKm2 = await estimateAreaKm2();
    if (!areaKm2) { est.textContent = 'Kunne ikke beregne arealestimat — henting fungerer likevel.'; return; }
    const pointCount = Math.round(areaKm2 / (gridKm * gridKm));
    const minEstimate = Math.max(1, Math.round(pointCount * 1.0 / 60));
    const maxEstimate = Math.max(minEstimate, Math.round(pointCount * 2.0 / 60));
    est.textContent = `Areal ≈ ${Math.round(areaKm2)} km² → opptil ca. ${pointCount} kandidatpunkter å sjekke, anslått ${minEstimate}-${maxEstimate} minutter.`;
  }

  function wireFetchPanel(){
    const slider = document.getElementById('sp-grid-slider');
    slider.addEventListener('input', (e) => {
      gridKm = parseFloat(e.target.value);
      document.getElementById('sp-grid-label').textContent = gridKm + ' km';
      updateFetchEstimate();
    });
    document.getElementById('sp-fetch-start').addEventListener('click', startFetch);
  }

  async function startFetch(){
    if (!isAdmin()) {
      document.getElementById('sp-fetch-info').textContent = 'Kun admin kan hente terrengdata for nye områder.';
      return;
    }

    // Dobbeltsjekk rett før trigging — unngår at to jobber startes samtidig
    // hvis brukeren rekker å klikke to ganger eller har en fane åpen fra før.
    const progress = document.getElementById('sp-fetch-progress');
    progress.style.display = '';
    progress.textContent = 'Sjekker om en jobb allerede kjører …';
    const already = await checkForActiveRun();
    if (already) {
      progress.textContent = 'En henting kjører allerede — kobler til den i stedet for å starte en ny. ' + describeRunStatus(already);
      fetchInProgress = true;
      document.getElementById('sp-fetch-start').disabled = true;
      document.getElementById('sp-fetch-start').textContent = 'Henting pågår …';
      pollFetchStatus(progress);
      return;
    }

    const inputs = { gridKm: String(gridKm) };
    if (filterMode === 'fylke') { inputs.mode = 'fylke'; inputs.value = fylkeFilter; }
    else if (filterMode === 'kommune') {
      // RETTET 2026-08-12: sendte tidligere kun det rå kommunenavnet, ALDRI
      // disambiguert med fylke — feilet derfor 100% av tiden for de fåtallige
      // tvetydige kommunenavnene (Våler, Bø, Os, …), UANSETT om brukeren
      // hadde valgt fylke i "snevre inn"-menyen, siden det valget aldri ble
      // lest her. Se resolveKommuneNavn() for selve oppslaget. Denne jobben
      // er kostbar (ekte GitHub Actions-kjøring) — blokkerer heller HER med
      // en tydelig beskjed enn å la den feile eksternt etter at brukeren
      // trodde den var i gang.
      const disambiguert = resolveKommuneNavn(kommuneFilter);
      if (disambiguert === null) {
        const fylker = kommunerMedNavn(kommuneFilter).map(k => k.fylkesnavn).join(' og ');
        progress.textContent = `⚠ "${kommuneFilter}" finnes i flere fylker (${fylker}) — velg riktig fylke i "Snevre inn til ett fylke"-menyen ved siden av kommunefeltet først, så prøv igjen.`;
        fetchInProgress = false;
        document.getElementById('sp-fetch-start').disabled = false;
        document.getElementById('sp-fetch-start').textContent = 'Hent data';
        return;
      }
      inputs.mode = 'kommune'; inputs.value = disambiguert;
    }
    else if (filterMode === 'radius') {
      inputs.mode = 'radius'; inputs.lat = String(radiusCenter.lat); inputs.lon = String(radiusCenter.lon); inputs.radiusKm = String(radiusKm);
    } else return;

    fetchInProgress = true;
    document.getElementById('sp-fetch-start').disabled = true;
    document.getElementById('sp-fetch-start').textContent = 'Henting pågår …';
    progress.textContent = 'Starter jobb …';

    // Viktig: registrer tidspunktet FØR vi trigger jobben, slik at polling kan
    // filtrere bort eventuelle eldre, allerede fullførte kjøringer.
    const dispatchedAt = new Date(Date.now() - 5000).toISOString(); // liten margin for klokke-avvik

    try {
      await window.ApiClient.startOmradeHenting(inputs);
      progress.textContent = '⏳ Jobb bedt om å starte — venter på at GitHub Actions registrerer den nye kjøringen (kan ta 10-30 sekunder) …';
      pollFetchStatus(progress, dispatchedAt);
    } catch (e) {
      console.error(e);
      progress.textContent = '⚠ Kunne ikke starte jobben: ' + e.message;
      fetchInProgress = false;
      document.getElementById('sp-fetch-start').disabled = false;
      document.getElementById('sp-fetch-start').textContent = 'Hent data';
    }
  }

  function pollFetchStatus(progress, sinceIso){
    let attempts = 0;
    const maxAttempts = 60; // ~15 min ved 15 sek mellomrom
    clearTimeout(fetchPollTimer);
    const poll = async () => {
      attempts++;
      try {
        const run = await window.ApiClient.hentOmradeStatus(sinceIso);
        if (run) {
          if (run.status === 'completed') {
            if (run.conclusion === 'success') {
              progress.textContent = 'GitHub-jobben er ferdig kjørt hos GitHub. Henter oppdatert data til nettleseren din …';
              await loadLocations();
              await loadFetchedAreas();
              let match = findFetchedAreaMatch();
              // GitHubs Contents API kan i sjeldne tilfeller ha en kort forsinkelse
              // (eventual consistency) før den reflekterer en commit som akkurat
              // landet — det ga tidligere en forvirrende "ingen terrengdata hentet"
              // rett etter en faktisk vellykket jobb, uten at brukeren gjorde noe
              // galt (f.eks. bare byttet art). Prøv på nytt et par ganger med kort
              // mellomrom før vi gir opp og viser "ingen terrengdata".
              for (let retry = 0; retry < 4 && !match; retry++) {
                await new Promise(r => setTimeout(r, 1500));
                await loadFetchedAreas();
                match = findFetchedAreaMatch();
              }
              const detail = match ? ` ${match.pointsAdded} nye steder lagt til (av ${match.pointsChecked} punkter sjekket).` : '';
              progress.textContent = `✓ Ferdig!${detail} Oppdaterer visningen …`;
              fetchInProgress = false;
              document.getElementById('sp-fetch-start').disabled = false;
              document.getElementById('sp-fetch-start').textContent = 'Hent data';
              // Liten pause slik at du faktisk rekker å lese sluttmeldingen før
              // panelet eventuelt skjules (fordi området nå har data).
              setTimeout(() => render(), 2200);
              return;
            } else {
              progress.textContent = `⚠ Jobben feilet (${run.conclusion}). Sjekk Actions-fanen på GitHub → siste kjøring → logg, for detaljer om hvilken datakilde som eventuelt svikter.`;
              fetchInProgress = false;
              document.getElementById('sp-fetch-start').disabled = false;
              document.getElementById('sp-fetch-start').textContent = 'Hent data';
              return;
            }
          } else {
            progress.textContent = `${describeRunStatus(run)} (sjekket ${attempts} gang${attempts>1?'er':''} — oppdateres automatisk, du trenger ikke gjøre noe)`;
          }
        } else {
          progress.textContent = `Fant ingen kjøring ennå hos GitHub — venter litt til (forsøk ${attempts}/${maxAttempts}) …`;
        }
      } catch (e) {
        console.warn('Feil under polling', e);
      }
      if (attempts < maxAttempts) {
        fetchPollTimer = setTimeout(poll, 15000);
      } else {
        progress.textContent = 'Bruker lenger tid enn ventet (over 15 min) — sjekk Actions-fanen på GitHub manuelt. Data lastes automatisk neste gang du åpner siden, uansett.';
        fetchInProgress = false;
        document.getElementById('sp-fetch-start').disabled = false;
        document.getElementById('sp-fetch-start').textContent = 'Hent data';
      }
    };
    poll();
  }

  // ---------- weather ----------
  // ~0.1° ≈ 11 km (nord-sør) / 5 km (øst-vest ved 63°N) — matcher grovt
  // oppløsningen til værmodellen Open-Meteo selv bruker for disse variablene
  // (typisk 9-11 km), så avrunding taper ingen reell presisjon: mange
  // punkter fra et tett "Hent data"-rutenett (ned til 0.5 km) faller uansett
  // innenfor SAMME underliggende modellcelle og ville fått identisk svar.
  const WEATHER_GRID_DEG = 0.1;
  const WEATHER_CACHE_KEY = 'fungifinder-weather-grid-cache';
  const WEATHER_CACHE_MAX_AGE_HOURS = 2;

  function weatherGridKey(lat, lon){
    return (Math.round(lat / WEATHER_GRID_DEG) * WEATHER_GRID_DEG).toFixed(2) + ',' +
           (Math.round(lon / WEATHER_GRID_DEG) * WEATHER_GRID_DEG).toFixed(2);
  }

  async function loadWeather(){
    const box = document.getElementById('sp-weather-box');
    // RETTET 2026-08-15: scopedLocations() (kun valgt fylke/kommune/radius),
    // IKKE allLocations() (alt appen noensinne har lastet inn — typisk hele
    // landet). Se isInCurrentScope()-kommentaren for hvorfor dette var feil
    // (identisk "snitt nedbør" for to helt ulike kommuner).
    const locs = scopedLocations();

    // Uten dedup kostet HVER sideinnlasting like mange "lokasjoner" mot
    // Open-Meteos gratis kvote som antall punkter i datasettet (fort 1000+
    // med et større privat repo) — noe som utløste 429 (Too Many Requests).
    // Runder derfor ned til unike rutenett-celler (se WEATHER_GRID_DEG) og
    // cacher svar i localStorage på tvers av sideinnlastinger FØR vi i det
    // hele tatt spør Open-Meteo på nytt.
    const cellByLoc = {};
    const uniqueCells = {};
    locs.forEach(loc => {
      const key = weatherGridKey(loc.lat, loc.lon);
      cellByLoc[loc.id] = key;
      if (!uniqueCells[key]) uniqueCells[key] = { lat: loc.lat, lon: loc.lon };
    });

    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || '{}'); } catch(e) { cache = {}; }
    const now = Date.now();
    const freshCells = {};
    const staleKeys = [];
    Object.keys(uniqueCells).forEach(key => {
      const entry = cache[key];
      if (entry && (now - entry.fetchedAt) < WEATHER_CACHE_MAX_AGE_HOURS * 3600 * 1000) {
        freshCells[key] = entry;
      } else {
        staleKeys.push(key);
      }
    });

    let anyOk = Object.keys(freshCells).length > 0;
    let hit429 = false;
    const BATCH_SIZE = 100; // Open-Meteos multi-lokasjons-URL blir for lang og feiler stille over dette
    for (let i = 0; i < staleKeys.length && !hit429; i += BATCH_SIZE) {
      const batchKeys = staleKeys.slice(i, i + BATCH_SIZE);
      const batchCells = batchKeys.map(k => uniqueCells[k]);
      try {
        const lats = batchCells.map(c=>c.lat).join(',');
        const lons = batchCells.map(c=>c.lon).join(',');
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=precipitation_sum,temperature_2m_mean&past_days=14&forecast_days=1&timezone=Europe%2FOslo`;
        const res = await fetch(url);
        if (res.status === 429) {
          // Ikke fortsett med flere bolker denne runden — det gjør bare
          // throttlingen verre. Det vi allerede har (cache + evt. tidligere
          // bolker) brukes i stedet, resten forblir "ukjent" (scores nøytralt).
          console.warn('Open-Meteo svarte 429 (Too Many Requests) — stopper flere værkall denne sesjonen.');
          hit429 = true;
          break;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [data];
        arr.forEach((d,j) => {
          const key = batchKeys[j]; if(!key || !d || !d.daily) return;
          const precipArr = d.daily.precipitation_sum || [];
          const tempArr = d.daily.temperature_2m_mean || [];
          const last14p = precipArr.slice(0,14); // dag -14 t.o.m. i går (dagens forecast_days=1-oppføring er bevisst utelatt, se URL-en over)
          const last5t = tempArr.slice(9,14);
          const sumP = last14p.reduce((a,b)=>a+(b||0),0);
          const avgT = last5t.length ? last5t.reduce((a,b)=>a+(b||0),0)/last5t.length : null;
          // RETTET 2026-08-15: brukeren besøkte et sted som var "knusktørt" i
          // terrenget, men appen viste "Godt fuktnivå — gode odds nå" — fordi
          // precip14 kun er en RÅ SUM over 14 dager, uten hensyn til NÅR
          // regnet falt. Ett kraftig regnskyll for 12-13 dager siden gir
          // samme sum som jevn nedbør gjennom hele perioden, men bakken kan
          // ha vært knusktørr i ukevis siden. daysSinceRain (antall dager
          // siden siste dag med målbar nedbør, samme ≥1mm-terskel som
          // dryStreakDays i sesongberegningen for konsistens) fanger dette —
          // se korreksjonen i scoreLocation()'s værblokk. Iterert fra
          // NYESTE (indeks 13 = i går) og bakover.
          let daysSinceRain = null;
          for (let k = last14p.length - 1; k >= 0; k--) {
            if ((last14p[k] || 0) >= 1) { daysSinceRain = last14p.length - k; break; }
          }
          if (daysSinceRain === null) daysSinceRain = last14p.length + 1; // ikke noe målbart regn i hele vinduet
          const entry = { precip14: Math.round(sumP*10)/10, tempAvg: avgT!==null? Math.round(avgT*10)/10 : null, daysSinceRain, fetchedAt: now };
          freshCells[key] = entry;
          cache[key] = entry;
        });
        anyOk = true;
      } catch (e) {
        console.warn('Værdata feilet for en bolk med rutenett-celler', e);
      }
    }

    if (staleKeys.length) {
      try { localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache)); } catch(e) { /* full/blokkert lagring — ignorer, gjelder bare cache */ }
    }

    locs.forEach(loc => {
      const cell = freshCells[cellByLoc[loc.id]];
      if (cell) weatherBySpecies[loc.id] = { precip14: cell.precip14, tempAvg: cell.tempAvg, daysSinceRain: cell.daysSinceRain };
    });

    if (anyOk) {
      weatherReady = true;
      const vals = Object.values(weatherBySpecies);
      const avgPrecip = vals.reduce((a,b)=>a+(b.precip14||0),0) / (vals.length||1);
      box.innerHTML = `<span class="sp-wstatus">✓ live data hentet</span><br/>Snitt nedbør siste 14 dager (alle steder): <b>${Math.round(avgPrecip)} mm</b>.`;
    } else if (hit429) {
      weatherReady = false;
      box.innerHTML = `<span class="sp-wstatus">⚠ værtjenesten er midlertidig overbelastet (429)</span><br/>Viser terrengscore uten tidsvurdering — prøv igjen litt senere.`;
    } else {
      weatherReady = false;
      box.innerHTML = `<span class="sp-wstatus">⚠ kunne ikke hente værdata</span><br/>Viser terrengscore uten tidsvurdering.`;
    }
    bumpScoreCache(); // weatherBySpecies/weatherReady endret — se scoreLocation()
    render();
  }

  // ---------- sesongvær (vekstsesong-historikk) ----------
  // Henter hele vekstsesongens (1. mai -> i dag) nedbør/temperatur PER
  // RUTENETT-CELLE (samme ~11 km rutenett som 14-dagersværet over, se
  // weatherGridKey) via Open-Meteos gratis arkiv-API — RETTET 2026-08-15,
  // se seasonWeatherByCell-kommentaren ved state-variabelen for hvorfor
  // ett globalt sentroide-punkt for hele appen var util for scoring.
  //
  // SAMME kall henter nå OGSÅ SEASON_CLIMATOLOGY_YEARS tidligere sesonger
  // (samme kalenderdato-vindu, 1. mai -> samme MM-DD som i dag, hvert av de
  // foregående årene) i ÉTT sammenhengende arkiv-oppslag per celle (i
  // stedet for ett kall per år) — brukt til å regne ut om DENNE sesongen er
  // unormalt tørr/våt for STEDET, ikke bare mot en artsspesifikk
  // "ideell vekst"-terskel (se precipRatioVsHistorical i scoreLocation()).
  const SEASON_WEATHER_CACHE_KEY = 'fungifinder-season-weather-grid-cache';
  const SEASON_WEATHER_CACHE_MAX_AGE_HOURS = 6;
  const SEASON_CLIMATOLOGY_YEARS = 10; // hvor mange tidligere sesonger "normalt nivå" regnes ut fra
  const SEASON_BATCH_SIZE = 15; // arkiv-kall med multi-års-vindu er MYE tyngre per lokasjon enn 14-dagersvarselet (se loadWeather) — mindre bolker
  const SEASON_MAX_CELLS = 60; // tak på antall unike rutenett-celler per sideinnlasting — se loadSeasonWeather()

  // Summerer precipitation_sum for datoer i [fraMD, tilMD] (MM-DD, inklusiv)
  // innenfor ETT gitt kalenderår fra de parallelle dates/precip-arrayene.
  // Brukt både for inneværende sesong og for hvert av klimatologi-årene —
  // egen funksjon for å garantere at begge regnes ut på nøyaktig samme måte.
  function sumPrecipInRange(dates, precipArr, year, fromMD, toMD){
    let sum = 0, days = 0;
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (!d.startsWith(String(year))) continue;
      const md = d.slice(5);
      if (md < fromMD || md > toMD) continue;
      if (precipArr[i] != null) { sum += precipArr[i]; days++; }
    }
    return { sum, days };
  }

  async function loadSeasonWeather(){
    // RETTET 2026-08-15: samme fiks som loadWeather() — scopedLocations(),
    // ikke allLocations(). Bonus-effekt: SEASON_MAX_CELLS-taket (60) traff
    // tidligere nesten alltid nasjonalt (typisk 1000+ unike celler for hele
    // landet), så de aller fleste steder fikk ALDRI sesong-vs-historikk/
    // dryStreakDays-korreksjonen fra v0.24.0 uansett hvilket område brukeren
    // faktisk så på. Et scoped fylke/kommune/radius-utsnitt er nesten alltid
    // langt under 60 celler.
    const locs = scopedLocations();
    if (!locs.length) {
      // RETTET 2026-08-15: tidligere et rått `return` her, som lot boksen
      // stå igjen med FORRIGE (nå feilaktige) scopes sesongdata når brukeren
      // bytter til et område uten steder ennå — samme klasse feil som denne
      // hele fiksen handler om, bare i tomt-scope-varianten. Rydder nå
      // eksplisitt i stedet, samme mønster som loadWeather()'s
      // "kunne ikke hente værdata"-fallback.
      seasonWeatherByCell = {};
      seasonWeatherReady = false;
      renderSeasonWeatherBox();
      return;
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const todayMD = now.toISOString().slice(5,10); // "MM-DD" — samme kalenderdato-vindu brukes for alle klimatologi-år
    const historyStartYear = currentYear - SEASON_CLIMATOLOGY_YEARS;
    const rangeStart = `${historyStartYear}-01-01`;
    const rangeEnd = now.toISOString().slice(0,10);

    // Samme rutenett-dedup som loadWeather() — flere steder i samme
    // ~11 km-celle deler ett arkiv-oppslag.
    const cellByLoc = {};
    const uniqueCells = {};
    locs.forEach(loc => {
      const key = weatherGridKey(loc.lat, loc.lon);
      cellByLoc[loc.id] = key;
      if (!uniqueCells[key]) uniqueCells[key] = { lat: loc.lat, lon: loc.lon };
    });
    let cellKeys = Object.keys(uniqueCells);
    // SEASON_MAX_CELLS: øvre tak per sideinnlasting — et bredt "alle
    // fylker"-utsnitt kan ha langt flere unike celler enn et scoped
    // fylke/kommune-utsnitt, og hvert cellekall her er mye tyngre (multi-års
    // datasett) enn 14-dagersværets. Steder i celler UTENFOR taket faller
    // tilbake til nøytral (ingen) sesongscoring i stedet for et forsøk på å
    // hente alt — samme gradvise degradering som når værtjenesten er nede.
    const overCap = cellKeys.length > SEASON_MAX_CELLS;
    if (overCap) cellKeys = cellKeys.slice(0, SEASON_MAX_CELLS);

    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(SEASON_WEATHER_CACHE_KEY) || '{}'); } catch(e) { cache = {}; }
    const nowMs = Date.now();
    const freshCells = {};
    const staleKeys = [];
    cellKeys.forEach(key => {
      const entry = cache[key];
      if (entry && (nowMs - entry.fetchedAt) < SEASON_WEATHER_CACHE_MAX_AGE_HOURS * 3600 * 1000) {
        freshCells[key] = entry.data;
      } else {
        staleKeys.push(key);
      }
    });

    let anyOk = Object.keys(freshCells).length > 0;
    let hit429 = false;
    for (let i = 0; i < staleKeys.length && !hit429; i += SEASON_BATCH_SIZE) {
      const batchKeys = staleKeys.slice(i, i + SEASON_BATCH_SIZE);
      const batchCells = batchKeys.map(k => uniqueCells[k]);
      try {
        const lats = batchCells.map(c=>c.lat.toFixed(3)).join(',');
        const lons = batchCells.map(c=>c.lon.toFixed(3)).join(',');
        const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lats}&longitude=${lons}&start_date=${rangeStart}&end_date=${rangeEnd}&daily=precipitation_sum,temperature_2m_mean&timezone=Europe%2FOslo`;
        const res = await fetch(url);
        if (res.status === 429) {
          console.warn('Open-Meteo arkiv svarte 429 (Too Many Requests) — stopper flere sesongvær-kall denne sesjonen.');
          hit429 = true;
          break;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : [data];
        const monthNames = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
        arr.forEach((d, j) => {
          const key = batchKeys[j]; if (!key || !d || !d.daily) return;
          const dates = d.daily.time || [];
          const precipArr = d.daily.precipitation_sum || [];
          const tempArr = d.daily.temperature_2m_mean || [];
          if (!dates.length) return;

          // Inneværende sesong: 1. mai -> i dag, samme logikk/månedsoppdeling
          // som før RETTET 2026-08-15 (kun nå per celle i stedet for globalt).
          const monthBuckets = {};
          let totalPrecip = 0, tempSum = 0, tempCount = 0, seasonDays = 0;
          let dryStreak = 0, longestDryStreak = 0;
          dates.forEach((dstr, k) => {
            if (!dstr.startsWith(String(currentYear))) return;
            const md = dstr.slice(5);
            if (md < '05-01') return; // før vekstsesongen
            const p = precipArr[k], t = tempArr[k];
            const monthIdx = parseInt(dstr.slice(5,7), 10) - 1;
            if (!monthBuckets[monthIdx]) monthBuckets[monthIdx] = { precip: 0, tempSum: 0, tempCount: 0 };
            seasonDays++;
            if (p != null) {
              totalPrecip += p;
              monthBuckets[monthIdx].precip += p;
              dryStreak = p < 1 ? dryStreak + 1 : 0;
              longestDryStreak = Math.max(longestDryStreak, dryStreak);
            }
            if (t != null) {
              tempSum += t; tempCount++;
              monthBuckets[monthIdx].tempSum += t;
              monthBuckets[monthIdx].tempCount++;
            }
          });
          const months = Object.keys(monthBuckets).sort((a,b)=>a-b).map(idx => {
            const b = monthBuckets[idx];
            return { label: monthNames[idx], precip: Math.round(b.precip), tempAvg: b.tempCount ? Math.round(b.tempSum/b.tempCount*10)/10 : null };
          });

          // Klimatologi: samme kalendervindu (1. mai -> todayMD) for hvert
          // av de SEASON_CLIMATOLOGY_YEARS foregående årene, fra SAMME
          // arkiv-svar — ingen ekstra nettverkskall. Et år uten nok data
          // (f.eks. helt i starten av arkivet) telles ikke med i snittet.
          const yearlyTotals = [];
          for (let y = historyStartYear; y < currentYear; y++) {
            const { sum, days } = sumPrecipInRange(dates, precipArr, y, '05-01', todayMD);
            if (days >= 30) yearlyTotals.push(sum); // krev et rimelig antall dager med data for at året skal telle
          }
          const historicalAvgPrecip = yearlyTotals.length
            ? Math.round(yearlyTotals.reduce((a,b)=>a+b,0) / yearlyTotals.length)
            : null;
          const precipRatioVsHistorical = (historicalAvgPrecip && historicalAvgPrecip > 0)
            ? Math.round((totalPrecip / historicalAvgPrecip) * 100) / 100
            : null;

          const entry = {
            totalPrecip: Math.round(totalPrecip),
            avgTemp: tempCount ? Math.round(tempSum/tempCount*10)/10 : null,
            months,
            dryStreakDays: longestDryStreak,
            days: seasonDays,
            historicalAvgPrecip,
            historicalYears: yearlyTotals.length,
            precipRatioVsHistorical,
            fetchedAt: nowMs
          };
          freshCells[key] = entry;
          cache[key] = { fetchedAt: nowMs, data: entry };
        });
        anyOk = true;
      } catch (e) {
        console.warn('Sesongvær feilet for en bolk med rutenett-celler', e);
      }
    }

    if (staleKeys.length) {
      try { localStorage.setItem(SEASON_WEATHER_CACHE_KEY, JSON.stringify(cache)); } catch(e) { /* full/blokkert lagring — ignorer, gjelder bare cache; entry holdes uansett i minnet denne sesjonen via freshCells */ }
    }

    // Slås opp av scoreLocation() PER STED via weatherGridKey(loc.lat,loc.lon)
    // — samme rutenett-funksjon, ikke en egen loc.id-indeksert kopi, slik at
    // oppslaget aldri kan bli utdatert i forhold til allLocations().
    seasonWeatherByCell = freshCells;

    // seasonWeather (representativt sammendrag til infoboksen): snitt over
    // alle celler som faktisk ble hentet denne runden, ikke ett eget kall.
    const cellVals = Object.values(freshCells);
    if (cellVals.length) {
      seasonWeather = {
        totalPrecip: Math.round(cellVals.reduce((a,c)=>a+c.totalPrecip,0) / cellVals.length),
        avgTemp: (() => { const t = cellVals.filter(c=>c.avgTemp!=null); return t.length ? Math.round(t.reduce((a,c)=>a+c.avgTemp,0)/t.length*10)/10 : null; })(),
        months: cellVals[0].months, // til visning — samme mnd-liste-struktur uansett celle, presise tall er per-celle i scoringen
        dryStreakDays: Math.max(...cellVals.map(c=>c.dryStreakDays)),
        days: cellVals[0].days,
        historicalAvgPrecip: (() => { const h = cellVals.filter(c=>c.historicalAvgPrecip!=null); return h.length ? Math.round(h.reduce((a,c)=>a+c.historicalAvgPrecip,0)/h.length) : null; })(),
        historicalYears: cellVals[0].historicalYears,
        precipRatioVsHistorical: (() => { const r = cellVals.filter(c=>c.precipRatioVsHistorical!=null); return r.length ? Math.round((r.reduce((a,c)=>a+c.precipRatioVsHistorical,0)/r.length)*100)/100 : null; })(),
        cellCount: cellVals.length,
        cellsCapped: overCap
      };
      seasonWeatherReady = true;
    } else if (!anyOk) {
      seasonWeatherReady = false;
    }
    bumpScoreCache(); // seasonWeatherByCell endret — se scoreLocation()
    renderSeasonWeatherBox();
    render();
  }

  function renderSeasonWeatherBox(){
    const box = document.getElementById('sp-season-weather-box');
    if (!box) return;
    if (!seasonWeatherReady || !seasonWeather) {
      box.innerHTML = `<span class="sp-wstatus">⚠ kunne ikke hente sesonghistorikk</span>`;
      return;
    }
    const sw = seasonWeather;
    const monthsHtml = sw.months.map(m => `${m.label}: ${m.precip} mm${m.tempAvg!=null?`, ${m.tempAvg}°C`:''}`).join(' · ');
    // Historisk sammenligning (RETTET 2026-08-15) — se precipRatioVsHistorical
    // i loadSeasonWeather()/scoreLocation(). Vises kun når vi faktisk fikk
    // nok tidligere sesonger å sammenligne mot (historicalAvgPrecip != null).
    let historikkHtml = '';
    if (sw.historicalAvgPrecip != null && sw.precipRatioVsHistorical != null) {
      const r = sw.precipRatioVsHistorical;
      const verdict = r < 0.5 ? 'betydelig tørrere enn normalt'
        : r < 0.75 ? 'tørrere enn normalt'
        : r > 1.4 ? 'betydelig våtere enn normalt'
        : r > 1.15 ? 'våtere enn normalt'
        : 'nær normalt nivå';
      historikkHtml = `<br/>Sammenlignet med snittet for samme periode de siste ${sw.historicalYears} sesongene (<b>${sw.historicalAvgPrecip} mm</b>): <b>${Math.round(r*100)}%</b> av normalen — ${verdict}.`;
    }
    const cellsNote = sw.cellCount > 1
      ? `<br/><span style="opacity:.7">Snitt over ${sw.cellCount} områder${sw.cellsCapped ? ' (flere lastet inn enn vist her — se enkeltsteders egne tall i score-beregningen)' : ''} — se det enkelte sted for presist lokalt tall.</span>`
      : '';
    box.innerHTML = `<span class="sp-wstatus">✓ sesongoversikt (${sw.days} dager, 1. mai–i dag)</span><br/>
      Totalt <b>${sw.totalPrecip} mm</b> nedbør, snitt <b>${sw.avgTemp ?? '–'}°C</b>. Lengste tørkeperiode: ${sw.dryStreakDays} dager.
      ${historikkHtml}<br/>
      <span style="opacity:.8">${monthsHtml}</span>${cellsNote}`;
  }

  // ---------- helpers ----------
  function attrScore(locVal, wantedArr, maxPoints){
    const unknown = !locVal || locVal === 'ukjent' || (Array.isArray(locVal) && (locVal.length===0 || locVal.includes('ukjent')));
    if (unknown) return { pts: Math.round(maxPoints*0.5), ok:null };
    const match = Array.isArray(locVal) ? locVal.some(v=>wantedArr.includes(v)) : wantedArr.includes(locVal);
    return { pts: match ? maxPoints : Math.round(maxPoints*0.2), ok: match };
  }

  // Sikkerhet: all fritekst brukeren selv skriver inn (stedsnavn, kommune,
  // parkeringsnotat osv.) MÅ escapes før den settes inn i innerHTML — ellers
  // kan noen (eller en feil) plante script-tagger som kjører i samme
  // nettleserkontekst som den innloggede sesjonen din (session-cookien mot
  // fungifinder-api).
  function escapeHtml(str){
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  // Poengsetter reell gangavstand til nærmeste kjente parkeringsplass
  // (avstandParkeringM, hentet fra OSM/Overpass i fetch_area.py) i stedet for
  // den gamle grove kjorbarVei ja/nei-tersklen — sistnevnte var uansett bare
  // en ja/nei-omregning av avstandVeiM, samme mål som "ro"-scoren også
  // brukte (se roScore) — to score-kategorier fra ett og samme tall. Eldre
  // steder (hentet før avstandParkeringM fantes, eller manuelt lagt inn) har
  // ikke denne avstanden og faller tilbake til den grove kjorbarVei-vurderingen.
  function parkeringsavstandScore(loc){
    if (loc.avstandParkeringM != null) {
      const d = loc.avstandParkeringM;
      if (d <= 300) return 8;
      if (d <= 800) return 5;
      if (d <= 1500) return 2;
      if (d <= 3000) return 0;
      return -3;
    }
    if (loc.kjorbarVei === 'ja') return 4;
    if (loc.kjorbarVei === 'nei') return -6;
    return 0;
  }

  function adkomstScore(loc){
    let pts = 0; const tags = [];
    const parkPts = parkeringsavstandScore(loc);
    pts += parkPts;
    if (loc.avstandParkeringM != null) {
      tags.push({ text: `${loc.avstandParkeringM} m til nærmeste kjente parkering`, cls: parkPts >= 2 ? 'good' : parkPts < 0 ? 'warn' : 'neutral' });
    } else if (loc.kjorbarVei === 'ja') {
      tags.push({ text:'kjørbar vei i nærheten', cls:'good' });
    } else if (loc.kjorbarVei === 'nei') {
      tags.push({ text:'ingen kjent bilvei', cls:'warn' });
    }
    // OSM-adgangsflagg (access=private/customers/permit/no) og manuelt
    // innskrevne notater havner begge her — se fetch_area.py for hvordan
    // parkeringNotat genereres for auto-hentede steder.
    if (loc.parkeringNotat && /privat|gårdstun|avtale med grunneier|låst bom|kun for kunder|krever.*tillatelse|stengt for parkering/i.test(loc.parkeringNotat)) {
      pts -= 10; tags.push({ text:'sjekk parkering – kan kreve avtale', cls:'warn' });
    }
    if (loc.stier === 'ja') { pts += 3; tags.push({ text:'sti/skogsbilvei i terrenget', cls:'good' }); }
    else if (loc.stier === 'nei') { pts -= 1; }
    return { pts, tags };
  }

  // Motpolen til adkomstScore()'s sti-bonus: en sti gjør et sted lett å
  // KOMME TIL (fortsatt et rent pluss der), men gjør det ofte samtidig mer
  // populært hos andre soppsankere — mer tråkk, mindre sjanse for uplukket
  // funn. To forskjellige egenskaper fra samme underliggende OSM-data
  // (avstandStiM, se fetch_area.py — samme mønster som avstandParkeringM).
  // Kun aktiv når weighTrailDistance-preferansen er på (default av).
  // Eldre steder uten avstandStiM (hentet før dette feltet fantes) gir
  // nøytralt 0 — ikke straffet for manglende data.
  function stiavstandScore(loc){
    if (loc.avstandStiM == null) return 0;
    const d = loc.avstandStiM;
    if (d <= 100) return -8;
    if (d <= 300) return -4;
    if (d <= 800) return 0;
    return 4;
  }

  // Nedprioriterer nærhet til en REELL, kjørbar vei — avstandVeiM måler nå
  // (RETTET 2026-08-15 i fetch_area.py) avstand til nærmeste highway=* SOM
  // IKKE er sti/skogsbilvei (path/track/footway/bridleway); før den datoen
  // var "roads" en overmengde som inkluderte stier, så avstandVeiM og
  // avstandStiM ville stort sett bare gjentatt hverandre. Distinkt fra alle
  // tre andre nærhets-signaler i scoreLocation():
  //  - adkomstScore(): premierer kort avstand til PARKERING (motsatt fortegn
  //    — og et annet punkt; man kan ha langt til parkering, men likevel stå
  //    rett attmed en gjennomgående vei et annet sted i terrenget)
  //  - roScore: måler avstand til TETTSTED (befolkning), ikke vei — en
  //    gjennomgående skogsbilvei/riksvei i utmark uten tettsted i nærheten
  //    gir fortsatt høy ro-score selv rett ved veien
  //  - stiavstandScore() over: kun sti/skogsbilvei, bevisst utelatt herfra
  //    slik at "vei" og "sti" blir to atskilte, uavhengige preferanser
  // Kun aktiv når weighRoadDistance-preferansen er på (default av). Samme
  // terskler som stiavstandScore() — ikke fordi støy/forstyrrelse fra en
  // bilvei antas å ha nøyaktig samme rekkevidde som fra en sti, men fordi
  // begge er nærmeste-node-tilnærminger med samme datapresisjon; andre tall
  // ville bare vært påstått presisjon uten grunnlag (samme resonnement som
  // elevationScore()).
  function veiavstandScore(loc){
    if (loc.avstandVeiM == null) return 0;
    const d = loc.avstandVeiM;
    if (d <= 100) return -8;
    if (d <= 300) return -4;
    if (d <= 800) return 0;
    return 4;
  }

  function findsFor(locId, speciesId){
    return userFinds.filter(f => f.locId === locId && (!speciesId || f.speciesId === speciesId));
  }

  // Et funn vises normalt på sitt tilknyttede steds koordinater, men kan ha
  // et eget lat/lon som overstyrer det — satt via "flytt til min posisjon" i
  // Mine funn-lista, for å rette en feilplassert markør uten å måtte flytte
  // (eller opprette et nytt) sted.
  function findLatLon(find){
    if (find.lat != null && find.lon != null) return { lat: find.lat, lon: find.lon };
    const loc = allLocations().find(l => l.id === find.locId);
    return loc ? { lat: loc.lat, lon: loc.lon } : null;
  }

  // Kun noen få arter har et presist nok kjent høydebegrensning i norsk
  // sopplitteratur til at det er forsvarlig å tallfeste (se species.hoydeMoh)
  // — resten forekommer over et for bredt/dårlig dokumentert høydespenn til
  // at en tallfestet grense ville vært noe annet enn gjetning. Nøytral (0)
  // når arten ikke har en satt preferanse, eller stedet mangler høydedata.
  function elevationScore(species, loc){
    if (!species.hoydeMoh || loc.hoydeMoh == null) return 0;
    const { ideal, max } = species.hoydeMoh;
    if (loc.hoydeMoh <= ideal) return 5;
    if (loc.hoydeMoh <= max) return 2;
    return -5;
  }

  // ---------------------------------------------------------------------
  // Vektbudsjett (rebalansert 2026-07-10 — se kritisk gjennomgang samme dag):
  // treslag 20, fuktighet 15, berggrunn 10, alder 10, sesong 8, høyde ±5,
  // varme +4, vær +12/-10, ro (befolkning) +8/-8, adkomst (parkeringsavstand
  // +stier) +11/-14, Artskart-funn +10, egen historikk +20.
  // "Alltid tilgjengelige" kategorier (treslag+fukt+berg+alder+sesong+vær+ro
  // +adkomst) summerer til ~90 i et typisk scenario — taket på 100 nås
  // dermed normalt kun ved hjelp av faktisk KORROBORERENDE bevis (egen
  // funnhistorikk, kjente Artskart-funn, sørvendt skråning), ikke av
  // terrengmatch alene. Tidligere summerte maks-verdiene til 176 poeng
  // klippet til 100, som gjorde at de fleste "gode nok" steder traff taket
  // og de virkelig gode stedene ikke lenger skilte seg ut i rangeringen.
  // 2026-08-11: lagt til stiavstand (±8, opt-in, default AV, se
  // weighTrailDistance/stiavstandScore) — holdt UTENFOR "alltid
  // tilgjengelig"-budsjettet over med vilje, akkurat som ro/befolkning,
  // siden begge er brukerpreferanser en bruker selv kan skru av.
  // 2026-08-11 (samme dag, del 2): vær (+12/-10, sesonghistorikk ±4) og
  // egen historikk (+20) er nå OGSÅ brukerpreferanser (weighWeather/
  // weighOwnFindHistory) — men default PÅ, så de teller fortsatt med i
  // "alltid tilgjengelig"-budsjettet over i typisk bruk, akkurat som
  // ro/befolkning (også default PÅ). Lagt til enda en opt-in,
  // default-AV kategori: nedprioriter kjente Artskart-funnsteder (opptil
  // -8, deprioritizeKnownFinds) — speilvendt motstykke til
  // Artskart-funn-bonusen, som fortsatt gjelder uansett som korroborerende
  // bevis. Samme designfilosofi som stiavstand: to ulike egenskaper
  // (bevis for at arten finnes her / sannsynligheten for at stedet er
  // nedplukket) kan dele samme underliggende datakilde uten å kansellere
  // hverandre.
  // 2026-08-15: lagt til enda en opt-in, default-AV kategori: nedprioriter
  // nær REELL vei (±8, weighRoadDistance/veiavstandScore) — samme
  // designmønster som stiavstand, men et distinkt signal (se
  // veiavstandScore() for hvorfor dette IKKE bare gjentar adkomst/ro/sti).
  // Krevde å gjøre roads/trails disjunkte i fetch_area.py (RETTET
  // 2026-08-15) — avstandVeiM målte før dette avstand til nærmeste vei ELLER
  // sti om hverandre, ubrukelig som eget signal.
  // 2026-08-15 (samme dag, del 2 — tørkesesong-oppfølging): utvidet
  // værbudsjettet med to nye modifikatorer, begge under weighWeather og
  // begge PER STEDETS EGEN rutenett-celle (ikke lenger ett globalt
  // sentroide-tall, se seasonWeatherByCell): "sesong vs. historisk normal"
  // (+3/-6/-10, ekte sammenligning mot samme kalendervindu de siste
  // SEASON_CLIMATOLOGY_YEARS sesongene — se loadSeasonWeather) og
  // "lang tørkeperiode" (-2/-5/-8, kobler inn det tidligere ubrukte
  // dryStreakDays-tallet). Værbudsjettet er dermed nå +12/-10 (14-dager) +
  // +4/-4 (sesong vs. artsbehov) + +3/-10 (sesong vs. historisk normal) +
  // 0/-8 (tørkeperiode) — bevisst asymmetrisk mot nedsiden: en reelt tørr
  // sesong skal kunne trekke MER enn de tidligere -6/-10 tillot, mens en våt
  // sesong ikke gis tilsvarende stor oppside (unormalt mye regn er ikke
  // entydig bra for alle arter på samme måte som tørke entydig er dårlig).
  // ---------------------------------------------------------------------
  function scoreLocation(species, loc){
    const cacheKey = species.id + '|' + loc.id;
    const cached = scoreCache.get(cacheKey);
    if (cached) return cached;

    const cutRecent = loc.hogstAr !== null && loc.hogstAr !== undefined && (yearNow - loc.hogstAr) <= 3;
    const manuallyCut = userCuts.includes(loc.id) || isWithinHogstOmrade(loc);
    const isCut = cutRecent || manuallyCut;

    const breakdown = [];
    let total = 0;

    const rTreslag = attrScore(loc.treslag, species.treslag, 20);
    total += rTreslag.pts; breakdown.push([rTreslag.ok===null?'Treslag ukjent':(rTreslag.ok?'Treslag passer':'Treslag passer dårlig'), rTreslag.pts]);

    const rFukt = attrScore(loc.fuktighet, species.fuktighet, 15);
    total += rFukt.pts; breakdown.push([rFukt.ok===null?'Fuktighet ukjent':(rFukt.ok?'Fuktighetsnivå riktig':'Fuktighetsnivå avvikende'), rFukt.pts]);

    const rBerg = attrScore(loc.berggrunn, species.berggrunn, 10);
    total += rBerg.pts; breakdown.push([rBerg.ok===null?'Berggrunn ukjent':(rBerg.ok?'Berggrunn/jordsmonn passer':'Berggrunn suboptimal'), rBerg.pts]);

    const rAlder = attrScore(loc.skogalder, species.skogalder, 10);
    total += rAlder.pts; breakdown.push([rAlder.ok===null?'Skogalder ukjent':(rAlder.ok?'Skogalder riktig':'Skogalder ikke ideell'), rAlder.pts]);

    const inSeason = monthNow >= species.season[0] && monthNow <= species.season[1];
    const seasonPts = inSeason ? 8 : 0;
    total += seasonPts; breakdown.push([inSeason?'I sesong nå':'Utenfor typisk sesong', seasonPts]);

    const elevPts = elevationScore(species, loc);
    if (elevPts !== 0) { total += elevPts; breakdown.push(['Høyde over havet', elevPts]); }

    // kjenteFunnDetaljer (art/dato/avstandM per Artskart-observasjon) gir en
    // tetthetsbevisst bonus — flere kjente funn, og spesielt nære funn, teller
    // mer enn ett enkelt gammelt funn langt unna. Eldre steder som kun har
    // det gamle boolske kjenteFunn-feltet (fra før artsfunn-oppgraderingen
    // 2026-07-09) faller tilbake til den enkle, faste bonusen.
    //
    // RETTET 2026-08-18 (bruker påpekte at 1,5 km — arealet ETL-en i
    // fetch_area.py bruker for å KOBLE et Artskart-funn til et sted i
    // utgangspunktet, se fungifinder-db/README.md — er et urealistisk stort
    // søkeområde å tolke som "kjent funnsted": ca. 7 km², langt mer enn noen
    // realistisk leter gjennom på ett besøk): denne bonusen (og
    // nedprioriterings-motstykket under, og "✓ kjent funnsted"-badgen, se
    // hasEvidence) strammes nå til <500 m her, UAVHENGIG av ETL-ens 1,5
    // km-koblingsradius (den er fortsatt riktig for datainnsamling — et
    // Artskart-funn 1,4 km unna ER fortsatt relevant kontekst for STEDET,
    // bare ikke lenger noe scoreLocation() teller som "kjent nærliggende
    // funn"). avstandM finnes allerede presist per funn, så dette er en ren
    // terskeljustering, ingen ny data nødvendig.
    const funnDetaljer = (loc.kjenteFunnDetaljer || []).filter(f => f.art === species.id && f.avstandM < 500);
    let naerFunn = false;
    if (funnDetaljer.length) {
      naerFunn = funnDetaljer.some(f => f.avstandM < 300);
      const densityScore = Math.min(10, funnDetaljer.length * 2 + (naerFunn ? 3 : 0));
      total += densityScore;
      breakdown.push([`${funnDetaljer.length} kjente Artsdatabanken-funn i nærheten${naerFunn ? ' (inkl. et svært nært)' : ''}`, densityScore]);
    } else if (loc.kjenteFunn && loc.kjenteFunn.includes(species.id)) {
      total += 5; breakdown.push(['Tidligere kjente funn i nærheten (database)', 5]);
    }

    // Egen preferanse (default av) — speilvendt motstykke til bonusen over.
    // Gjelder kun kjenteFunnDetaljer (nøyaktig art/dato/avstand), ikke det
    // gamle kjenteFunn-fallbacket, som er for upresist til å gradere ned.
    if (deprioritizeKnownFinds && funnDetaljer.length) {
      const kjentPenalty = -Math.min(8, Math.round(funnDetaljer.length * 1.5 + (naerFunn ? 2 : 0)));
      total += kjentPenalty;
      breakdown.push(['Nedprioritert — velkjent offentlig funnsted', kjentPenalty]);
    }

    // Ro/folketetthet — drives nå UTELUKKENDE av befolkning (se
    // fetch_area.py for hvordan dette hentes via Overpass place=*-noder).
    // Ga tidligere ALLTID +4 ekstra for avstandVeiM>=1000 — samme mål som
    // adkomstScore/parkeringsavstandScore bruker for reachability, så det
    // dobbelttalte i praksis én og samme (og minst sikre) datakilde under to
    // score-kategorier. Fjernet herfra; kun befolkning avgjør ro-scoren nå.
    let roScore = 0;
    if (prioritizeQuiet) {
      if (loc.befolkning === 'lav') roScore = 8;
      else if (loc.befolkning === 'middels') roScore = 3;
      else if (loc.befolkning === 'hoy') roScore = -8;
      else roScore = 1;
      total += roScore; breakdown.push(['Ro / avstand fra folk', roScore]);
    }

    // Egen preferanse (default av) — se stiavstandScore() for hvorfor dette
    // er en EGEN kategori, uavhengig av adkomstScore()'s sti-bonus under.
    let stiScore = 0;
    if (weighTrailDistance) {
      stiScore = stiavstandScore(loc);
      total += stiScore;
      breakdown.push([loc.avstandStiM == null ? 'Avstand fra sti (ukjent)' : 'Avstand fra sti/skogsbilvei', stiScore]);
    }

    // Egen preferanse (default av), atskilt fra stiScore over — se
    // veiavstandScore() for hvorfor "vei" og "sti" nå er to uavhengige
    // signaler.
    let veiScore = 0;
    if (weighRoadDistance) {
      veiScore = veiavstandScore(loc);
      total += veiScore;
      breakdown.push([loc.avstandVeiM == null ? 'Avstand fra vei (ukjent)' : 'Avstand fra vei', veiScore]);
    }

    const acc = adkomstScore(loc);
    total += acc.pts; breakdown.push(['Adkomst (parkeringsavstand/stier)', acc.pts]);

    if (WARMTH_LOVING_SPECIES.has(species.id) && loc.himmelretning && loc.helningGrader != null) {
      const sorvendt = ['S','SØ','SV'].includes(loc.himmelretning);
      const passeHelning = loc.helningGrader >= 3 && loc.helningGrader <= 25;
      if (sorvendt && passeHelning) {
        total += 4; breakdown.push(['Sørvendt skråning (varmekrevende art)', 4]);
      }
    }

    let weatherVerdict = null;
    const w = weatherBySpecies[loc.id];
    // weighWeather (default PÅ): kun scoring-effekten er betinget — w selv
    // beregnes uansett over, slik at rå værdata fortsatt kan vises
    // informativt i UI selv om noen har skrudd av vær-vektingen.
    if (weighWeather && weatherReady && w) {
      const prof = species.weather;
      let wScore = 0;
      if (w.precip14 >= prof.idealNedbor14) { wScore = 12; weatherVerdict = 'Godt fuktnivå — gode odds nå.'; }
      else if (w.precip14 >= prof.minNedbor14) { wScore = 6; weatherVerdict = 'Litt tørt, men innen rekkevidde.'; }
      else { wScore = -6; weatherVerdict = 'For tørt siste 14 dager — vent til mer nedbør.'; }
      if (prof.minTempAvg !== undefined && w.tempAvg !== null && w.tempAvg < prof.minTempAvg - 4) { wScore -= 4; weatherVerdict += ' Også kjøligere enn ideelt.'; }
      // RETTET 2026-08-15: bruker besøkte et sted som var knusktørt i
      // terrenget samme dag appen viste "Godt fuktnivå — gode odds nå" for
      // det. Årsak: precip14 over er en RÅ 14-dagers-SUM — ett kraftig
      // regnskyll for 12-13 dager siden teller likt som jevn nedbør gjennom
      // hele perioden, selv om bakken kan ha vært tørr i ukevis siden. Denne
      // korreksjonen bruker daysSinceRain (se loadWeather()) til å nedjustere
      // verdikten når totalen ser fin ut på papiret, men det faktisk er lenge
      // siden sist målbare regn — uavhengig av om precip14-grenen over ga
      // +12 eller +6. IKKE ment å presist tallfeste bakkefuktighet (det ville
      // krevd jordfuktighetsmålinger appen ikke har, se markfuktighet-feltet
      // fra NIBIO i stedet for det) — kun å unngå å påstå "godt fuktnivå NÅ"
      // når det tydelig ikke stemmer.
      if (w.daysSinceRain != null && w.daysSinceRain >= 7) {
        wScore -= 8;
        weatherVerdict = `Nok nedbør på papiret siste 14 dager, men ${w.daysSinceRain} dager siden sist målbare regn — sannsynligvis tørrere i terrenget nå enn totalen alene tilsier.`;
      } else if (w.daysSinceRain != null && w.daysSinceRain >= 4) {
        wScore -= 4;
        weatherVerdict += ` (${w.daysSinceRain} dager siden sist regn — verdt å sjekke bakkefuktigheten selv før du drar.)`;
      }
      total += wScore; breakdown.push(['Værvindu (nedbør/temp)', wScore]);
    }

    // Sesonghistorikk (1. mai -> i dag) — egen, mindre modifikator ved siden
    // av det ferske 14-dagersvinduet over. Fanger opp en sesong som totalt
    // sett har vært tørr/våt, selv om de siste 14 dagene alene ser greie ut
    // (eller motsatt). RETTET 2026-08-15: slår nå opp STEDETS EGEN
    // rutenett-celle (seasonWeatherByCell) i stedet for ett globalt
    // sentroide-tall for hele appen — se seasonWeatherByCell-kommentaren ved
    // state-variabelen for hvorfor (brukeren observerte at et sted kunne
    // score 95-96 under en reell ekstremtørke fordi sesongtallet som ble
    // brukt i scoringen kom fra et helt annet sted i landet).
    const sw = seasonWeatherByCell[weatherGridKey(loc.lat, loc.lon)];
    // idealNedbor14 brukes som et grovt ukentlig referansenivå og skaleres
    // opp til sesongens lengde — bevisst holdt upresist/lav vekt, se samme
    // resonnement som elevationScore om å ikke tallfeste mer presist enn
    // datagrunnlaget faktisk tillater. Samme weighWeather-preferanse som over.
    if (weighWeather && sw && species.weather.idealNedbor14) {
      const expectedSeasonPrecip = species.weather.idealNedbor14 * (sw.days / 14);
      const ratio = expectedSeasonPrecip > 0 ? sw.totalPrecip / expectedSeasonPrecip : 1;
      let seasonScore = 0, seasonNote = null;
      if (ratio >= 0.9) { seasonScore = 4; seasonNote = 'God sesong hittil — nok nedbør over tid til gode vekstforhold.'; }
      else if (ratio < 0.5) { seasonScore = -4; seasonNote = 'Tørr sesong hittil — kan gi svakere oppblomstring selv med fuktighet nå.'; }
      if (seasonScore !== 0) {
        total += seasonScore;
        breakdown.push(['Sesonghistorikk (nedbør vs. artens vekstbehov)', seasonScore]);
        weatherVerdict = weatherVerdict ? `${weatherVerdict} ${seasonNote}` : seasonNote;
      }
    }

    // NYTT 2026-08-15, forslag 3: sammenligner mot et REELT historisk
    // normalnivå for STEDET (snitt av samme 1.mai->i dag-vindu de siste
    // SEASON_CLIMATOLOGY_YEARS sesongene, se loadSeasonWeather) — i stedet
    // for KUN mot artens generiske vekstbehov over. De to måler forskjellige
    // ting: "er det fuktig nok til at arten trives" (over) vs. "er dette en
    // uvanlig tørr/våt sesong for AKKURAT DETTE STEDET, uansett art" (her).
    // Sistnevnte er det brukeren faktisk etterspurte — modellen hadde
    // tidligere intet begrep om "tørreste på X år", kun om artens ideelle
    // fuktbehov. Litt tyngre vekt enn arts-modifikatoren over, siden dette
    // er forankret i ekte historiske data for stedet, ikke en generisk
    // terskel. Krever minst 3 av de SEASON_CLIMATOLOGY_YEARS årene å ha nok
    // data (se yearlyTotals-filteret i loadSeasonWeather) — ellers droppes
    // modifikatoren i stedet for å vise et normalnivå basert på for få år.
    if (weighWeather && sw && sw.precipRatioVsHistorical != null && sw.historicalYears >= 3) {
      const r = sw.precipRatioVsHistorical;
      let histSeasonScore = 0, histNote2 = null;
      if (r < 0.4) { histSeasonScore = -10; histNote2 = `Ekstremt tørr sesong for stedet — kun ${Math.round(r*100)}% av normalt nedbørsnivå siste ${sw.historicalYears} sesonger.`; }
      else if (r < 0.65) { histSeasonScore = -6; histNote2 = `Tørrere enn normalt for stedet — ${Math.round(r*100)}% av snittet siste ${sw.historicalYears} sesonger.`; }
      else if (r > 1.4) { histSeasonScore = 3; histNote2 = `Våtere enn normalt for stedet denne sesongen.`; }
      if (histSeasonScore !== 0) {
        total += histSeasonScore;
        breakdown.push([`Sesong vs. ${sw.historicalYears}-års normal for stedet`, histSeasonScore]);
        weatherVerdict = weatherVerdict ? `${weatherVerdict} ${histNote2}` : histNote2;
      }
    }

    // NYTT 2026-08-15, forslag 1: dryStreakDays (lengste sammenhengende
    // tørkeperiode i sesongen) ble beregnet allerede fra 2026-07-17 og vist
    // i sesong-infoboksen, men ALDRI brukt i scoringen — akkurat det
    // signalet som best fanger en LANGVARIG, sammenhengende tørkeperiode
    // (i motsetning til totalnedbør, som en enkelt kraftig regnbyge midt i
    // en ellers tørr sesong kan dekke over). Egen, liten modifikator —
    // overlapper bevisst noe med totalnedbør-modifikatorene over (samme
    // underliggende værdata), men fanger opp et scenario de ikke gjør: en
    // lang, ubrutt tørkeperiode etterfulgt av nok totalnedbør til at
    // ratio-modifikatorene over ikke slår ut.
    if (weighWeather && sw) {
      let streakScore = 0;
      if (sw.dryStreakDays >= 30) streakScore = -8;
      else if (sw.dryStreakDays >= 21) streakScore = -5;
      else if (sw.dryStreakDays >= 14) streakScore = -2;
      if (streakScore !== 0) {
        total += streakScore;
        breakdown.push([`Lang sammenhengende tørkeperiode (${sw.dryStreakDays} dager)`, streakScore]);
      }
    }

    // weighOwnFindHistory (default PÅ) — se erklæringen ved siden av state-
    // variabelen for hvorfor dette er skrudd av-bart (bevisst utforsking).
    const myFinds = findsFor(loc.id, species.id);
    let histNote = null;
    if (weighOwnFindHistory && myFinds.length) {
      const avgM = myFinds.reduce((a,f)=>a+f.mengde,0) / myFinds.length;
      const histPts = Math.min(20, Math.round(5 + avgM*3 + Math.min(myFinds.length,5)));
      total += histPts;
      breakdown.push([`Egen funnhistorikk (${myFinds.length} funn, snitt ${avgM.toFixed(1)}/5)`, histPts]);
      histNote = `Du har selv funnet ${species.name.toLowerCase()} her ${myFinds.length} gang${myFinds.length>1?'er':''} tidligere, snitt mengde ${avgM.toFixed(1)}/5 — dette teller sterkt i vurderingen.`;
    }

    total = Math.max(0, Math.min(100, Math.round(total)));
    // hasEvidence: skiller REELL evidens (noen — enten deg selv eller
    // Artsdatabanken — har faktisk funnet/rapportert arten her) fra en score
    // som utelukkende hviler på terreng-/vær-match. Innført 2026-08-15 etter
    // at brukeren påpekte at et tall i 90-årene lett leses som en garanti —
    // men vektbudsjettet (se kommentaren over scoreLocation) er bevisst satt
    // opp slik at "alltid tilgjengelige" kategorier alene lander på ~90, så
    // et RENT terrengbasert sted kan komme nesten helt til værs uten at noen
    // noensinne har funnet arten der. Vist på selve kortet (se cardHtml),
    // ikke bare i score-breakdown-modalen, nettopp for å gjøre den
    // forskjellen synlig UTEN et ekstra klikk.
    const hasEvidence = funnDetaljer.length > 0 || (weighOwnFindHistory && myFinds.length > 0);
    const result = { total, breakdown, isCut, weatherVerdict, weather: w, histNote, accessTags: acc.tags, hasEvidence };
    scoreCache.set(cacheKey, result);
    return result;
  }

  // Delt fargeskala for score — ÉN kilde til sannhet i stedet for at
  // samme terskel-uttrykk lå kopiert tre steder (renderMap, renderAreasOnMap
  // og gaugeSvg), som gjorde en fremtidig justering sårbar for å bli gjort
  // ett sted og glemt de andre to.
  //
  // 4 nivåer i stedet for de opprinnelige 3 (se samtalen om vurdering av
  // fargekodingens grovkornethet, 2026-08-11) — men bevisst IKKE en
  // kontinuerlig gradient: markørene er små (8px), og finere
  // fargeforskjeller er vanskeligere å skanne raskt og verre for
  // fargeblinde ved den størrelsen. Eksakt tall vises uansett (tooltip på
  // hovedmarkørene, se renderMap(); baket inn i gaugeSvg og
  // områdepopup-ene) — fargen er et raskt triage-lag, ikke eneste signal.
  function scoreColor(score){
    if (score >= 75) return '#5F7A3E'; // høy
    if (score >= 55) return '#8FA35C'; // god
    if (score >= 35) return '#C8974A'; // middels
    return '#A23E2E'; // lav
  }

  // Finner hvilke av dine ANDRE favoritter (utenom den som allerede vises)
  // som også trolig passer på dette stedet, pluss et par gode matsopper som
  // ikke er favoritter — "ting du kan snuble over i samme terreng".
  function crossSpeciesTips(loc, primaryId){
    const favHere = favoriteSpecies
      .filter(id => id !== primaryId)
      .map(id => SPECIES.find(s => s.id === id))
      .filter(Boolean)
      .map(sp => ({ species: sp, res: scoreLocation(sp, loc) }))
      .filter(r => !r.res.isCut && r.res.total >= 55)
      .sort((a,b) => b.res.total - a.res.total);
    const excludeIds = new Set([primaryId, ...favoriteSpecies]);
    const othersHere = SPECIES
      .filter(s => !excludeIds.has(s.id))
      .map(s => ({ species: s, res: scoreLocation(s, loc) }))
      .filter(r => !r.res.isCut && r.res.total >= 65)
      .sort((a,b) => b.res.total - a.res.total)
      .slice(0, 3);
    return { favHere, othersHere };
  }

  function crossSpeciesTipsHtml(loc, primaryId, opts){
    opts = opts || {};
    const { favHere, othersHere } = crossSpeciesTips(loc, primaryId);
    let html = '';
    // I favoritt-modus vises ALLE favoritter allerede i score-listen øverst på
    // kortet — å gjenta dem her ville bare vært støy. Kun relevant i
    // enkeltart-modus, der bare den valgte arten vises som standard.
    if (!opts.hideFavorites && favHere.length) {
      html += `<div class="sp-cross-tip">⭐ Blant dine andre favoritter passer trolig også: ${favHere.map(r => `${escapeHtml(r.species.name)} (${r.res.total})`).join(', ')}</div>`;
    }
    if (othersHere.length) {
      html += `<div class="sp-cross-tip">💡 Andre gode matsopper å se etter her: ${othersHere.map(r => `${escapeHtml(r.species.name)} (${r.res.total})`).join(', ')}</div>`;
    }
    return html;
  }

  // Ekte Artsdatabanken-funn av DENNE arten nær stedet — antall og
  // nærmeste/nyeste, hentet fra kjenteFunnDetaljer (se scoreLocation()).
  function knownFindsHtml(loc, speciesId){
    const detaljer = (loc.kjenteFunnDetaljer || []).filter(f => f.art === speciesId);
    if (!detaljer.length) return '';
    const sp = SPECIES.find(s => s.id === speciesId);
    const parts = detaljer.slice(0, 3).map(f => `${f.avstandM} m unna (${escapeHtml(f.dato || 'ukjent dato')})`);
    return `<div class="sp-known-finds">🔎 ${detaljer.length} kjent${detaljer.length > 1 ? 'e' : ''} Artsdatabanken-funn av ${escapeHtml(sp ? sp.name.toLowerCase() : speciesId)} her: ${parts.join(', ')}</div>`;
  }

  function locTexts(loc){
    const t1 = Array.isArray(loc.treslag) ? loc.treslag : [loc.treslag];
    return {
      treslagTekst: t1.map(t=>TXT.treslag[t]||t).join('/'),
      fuktighetTekst: TXT.fuktighet[loc.fuktighet] || loc.fuktighet || 'ukjent',
      berggrunnTekst: TXT.berggrunn[loc.berggrunn] || loc.berggrunn || 'ukjent',
      alderTekst: TXT.alder[loc.skogalder] || loc.skogalder || 'ukjent'
    };
  }

  // Statisk liste over Norges 15 fylker (2024-strukturen) — vises alltid i
  // dropdownen, uavhengig av om det finnes data for dem ennå. Uten denne
  // ville fylke-velgeren vært tom helt til data faktisk var hentet et sted,
  // noe som gjorde det umulig å velge et område i utgangspunktet.
  const FYLKER_STATISK = ['Østfold','Akershus','Oslo','Innlandet','Buskerud','Vestfold','Telemark','Agder','Rogaland','Vestland','Møre og Romsdal','Trøndelag','Nordland','Troms','Finnmark'];

  // Fylkesnummer (de to første sifrene i et 4-sifret kommunenummer) →
  // fylkesnavn, 2024-strukturen — samme tabell (motsatt vei) som
  // FYLKE_TO_COUNTY_ID i fungifinder-db sin fetch_area.py. Brukt av
  // loadKommuneRegister() under, se RETTET-kommentaren der for hvorfor.
  const FYLKESNUMMER_TIL_NAVN = {
    '03': 'Oslo', '11': 'Rogaland', '15': 'Møre og Romsdal', '18': 'Nordland',
    '31': 'Østfold', '32': 'Akershus', '33': 'Buskerud', '34': 'Innlandet',
    '39': 'Vestfold', '40': 'Telemark', '42': 'Agder', '46': 'Vestland',
    '50': 'Trøndelag', '55': 'Troms', '56': 'Finnmark',
  };

  // RETTET 2026-08-12 (bruker spurte hvorfor kommunelisten måtte hentes fra
  // Kartverket "hver gang" — svaret var at den IKKE ble det (30 dagers
  // localStorage-cache fantes allerede), men det hjelper ikke ved første
  // besøk (kald cache — akkurat det brukeren observerte som "lang
  // ventetid") eller etter at Safari ITP sletter localStorage, samme
  // kjente irritasjon som GitHub-PAT-en/været hadde). Samme resonnement
  // som FYLKE_BBOX/KOMMUNE_BBOX over: dette er nesten-statisk offentlig
  // data (neste kjente kommunereform er 2028, varslet år i forveien), så
  // et engangs-generert øyeblikksbilde eliminerer nettverksavhengigheten
  // for det vanlige tilfellet HELT, uten å ofre korrekthet — i motsetning
  // til FYLKE_BBOX/KOMMUNE_BBOX (som KUN kan brukes når et navn matcher
  // eksakt) beholdes selve Kartverket-oppslaget under fortsatt som en
  // bakgrunns-oppfriskning (ikke bare en fallback ved feil), slik at en
  // fremtidig reform plukkes opp automatisk innen CACHE_MAX_AGE_DAYS uten
  // at noen må huske å regenerere denne tabellen manuelt med det samme.
  // Generert 2026-08-12 fra ws.geonorge.no/kommuneinfo/v1/kommuner (357
  // kommuner, verifisert 0 mangler fylke-utledning).
  const KOMMUNE_REGISTER_STATISK = [
    ["Alstahaug", "Nordland"], ["Alta", "Finnmark"], ["Alvdal", "Innlandet"],
    ["Alver", "Vestland"], ["Andøy", "Nordland"], ["Aremark", "Østfold"],
    ["Arendal", "Agder"], ["Asker", "Akershus"], ["Askvoll", "Vestland"],
    ["Askøy", "Vestland"], ["Aukra", "Møre og Romsdal"], ["Aure", "Møre og Romsdal"],
    ["Aurland", "Vestland"], ["Aurskog-Høland", "Akershus"], ["Austevoll", "Vestland"],
    ["Austrheim", "Vestland"], ["Averøy", "Møre og Romsdal"], ["Balsfjord", "Troms"],
    ["Bamble", "Telemark"], ["Bardu", "Troms"], ["Beiarn", "Nordland"],
    ["Bergen", "Vestland"], ["Berlevåg", "Finnmark"], ["Bindal", "Nordland"],
    ["Birkenes", "Agder"], ["Bjerkreim", "Rogaland"], ["Bjørnafjorden", "Vestland"],
    ["Bodø", "Nordland"], ["Bokn", "Rogaland"], ["Bremanger", "Vestland"],
    ["Brønnøy", "Nordland"], ["Bygland", "Agder"], ["Bykle", "Agder"],
    ["Båtsfjord", "Finnmark"], ["Bærum", "Akershus"], ["Bø", "Nordland"],
    ["Bømlo", "Vestland"], ["Dovre", "Innlandet"], ["Drammen", "Buskerud"],
    ["Drangedal", "Telemark"], ["Dyrøy", "Troms"], ["Dønna", "Nordland"],
    ["Eidfjord", "Vestland"], ["Eidskog", "Innlandet"], ["Eidsvoll", "Akershus"],
    ["Eigersund", "Rogaland"], ["Elverum", "Innlandet"], ["Enebakk", "Akershus"],
    ["Engerdal", "Innlandet"], ["Etne", "Vestland"], ["Etnedal", "Innlandet"],
    ["Evenes", "Nordland"], ["Evje og Hornnes", "Agder"], ["Farsund", "Agder"],
    ["Fauske", "Nordland"], ["Fedje", "Vestland"], ["Fitjar", "Vestland"],
    ["Fjaler", "Vestland"], ["Fjord", "Møre og Romsdal"], ["Flakstad", "Nordland"],
    ["Flatanger", "Trøndelag"], ["Flekkefjord", "Agder"], ["Flesberg", "Buskerud"],
    ["Flå", "Buskerud"], ["Folldal", "Innlandet"], ["Fredrikstad", "Østfold"],
    ["Frogn", "Akershus"], ["Froland", "Agder"], ["Frosta", "Trøndelag"],
    ["Frøya", "Trøndelag"], ["Fyresdal", "Telemark"], ["Færder", "Vestfold"],
    ["Gamvik", "Finnmark"], ["Gausdal", "Innlandet"], ["Gildeskål", "Nordland"],
    ["Giske", "Møre og Romsdal"], ["Gjemnes", "Møre og Romsdal"], ["Gjerdrum", "Akershus"],
    ["Gjerstad", "Agder"], ["Gjesdal", "Rogaland"], ["Gjøvik", "Innlandet"],
    ["Gloppen", "Vestland"], ["Gol", "Buskerud"], ["Gran", "Innlandet"],
    ["Grane", "Nordland"], ["Gratangen", "Troms"], ["Grimstad", "Agder"],
    ["Grong", "Trøndelag"], ["Grue", "Innlandet"], ["Gulen", "Vestland"],
    ["Hadsel", "Nordland"], ["Halden", "Østfold"], ["Hamar", "Innlandet"],
    ["Hamarøy", "Nordland"], ["Hammerfest", "Finnmark"], ["Haram", "Møre og Romsdal"],
    ["Hareid", "Møre og Romsdal"], ["Harstad", "Troms"], ["Hasvik", "Finnmark"],
    ["Hattfjelldal", "Nordland"], ["Haugesund", "Rogaland"], ["Heim", "Trøndelag"],
    ["Hemnes", "Nordland"], ["Hemsedal", "Buskerud"], ["Herøy", "Nordland"],
    ["Herøy", "Møre og Romsdal"], ["Hitra", "Trøndelag"], ["Hjartdal", "Telemark"],
    ["Hjelmeland", "Rogaland"], ["Hol", "Buskerud"], ["Hole", "Buskerud"],
    ["Holmestrand", "Vestfold"], ["Holtålen", "Trøndelag"], ["Horten", "Vestfold"],
    ["Hurdal", "Akershus"], ["Hustadvika", "Møre og Romsdal"], ["Hvaler", "Østfold"],
    ["Hyllestad", "Vestland"], ["Hå", "Rogaland"], ["Hægebostad", "Agder"],
    ["Høyanger", "Vestland"], ["Høylandet", "Trøndelag"], ["Ibestad", "Troms"],
    ["Inderøy", "Trøndelag"], ["Indre Fosen", "Trøndelag"], ["Indre Østfold", "Østfold"],
    ["Iveland", "Agder"], ["Jevnaker", "Akershus"], ["Karasjok", "Finnmark"],
    ["Karlsøy", "Troms"], ["Karmøy", "Rogaland"], ["Kautokeino", "Finnmark"],
    ["Kinn", "Vestland"], ["Klepp", "Rogaland"], ["Kongsberg", "Buskerud"],
    ["Kongsvinger", "Innlandet"], ["Kragerø", "Telemark"], ["Kristiansand", "Agder"],
    ["Kristiansund", "Møre og Romsdal"], ["Krødsherad", "Buskerud"], ["Kvam", "Vestland"],
    ["Kvinesdal", "Agder"], ["Kvinnherad", "Vestland"], ["Kviteseid", "Telemark"],
    ["Kvitsøy", "Rogaland"], ["Kvæfjord", "Troms"], ["Kvænangen", "Troms"],
    ["Kåfjord", "Troms"], ["Larvik", "Vestfold"], ["Lavangen", "Troms"],
    ["Lebesby", "Finnmark"], ["Leirfjord", "Nordland"], ["Leka", "Trøndelag"],
    ["Lesja", "Innlandet"], ["Levanger", "Trøndelag"], ["Lier", "Buskerud"],
    ["Lierne", "Trøndelag"], ["Lillehammer", "Innlandet"], ["Lillesand", "Agder"],
    ["Lillestrøm", "Akershus"], ["Lindesnes", "Agder"], ["Lom", "Innlandet"],
    ["Loppa", "Finnmark"], ["Lund", "Rogaland"], ["Lunner", "Akershus"],
    ["Lurøy", "Nordland"], ["Luster", "Vestland"], ["Lyngdal", "Agder"],
    ["Lyngen", "Troms"], ["Lærdal", "Vestland"], ["Lødingen", "Nordland"],
    ["Lørenskog", "Akershus"], ["Løten", "Innlandet"], ["Malvik", "Trøndelag"],
    ["Marker", "Østfold"], ["Masfjorden", "Vestland"], ["Melhus", "Trøndelag"],
    ["Meløy", "Nordland"], ["Meråker", "Trøndelag"], ["Midt-Telemark", "Telemark"],
    ["Midtre Gauldal", "Trøndelag"], ["Modalen", "Vestland"], ["Modum", "Buskerud"],
    ["Molde", "Møre og Romsdal"], ["Moskenes", "Nordland"], ["Moss", "Østfold"],
    ["Målselv", "Troms"], ["Måsøy", "Finnmark"], ["Namsos", "Trøndelag"],
    ["Namsskogan", "Trøndelag"], ["Nannestad", "Akershus"], ["Narvik", "Nordland"],
    ["Nes", "Akershus"], ["Nesbyen", "Buskerud"], ["Nesna", "Nordland"],
    ["Nesodden", "Akershus"], ["Nesseby", "Finnmark"], ["Nissedal", "Telemark"],
    ["Nittedal", "Akershus"], ["Nome", "Telemark"], ["Nord-Aurdal", "Innlandet"],
    ["Nord-Fron", "Innlandet"], ["Nord-Odal", "Innlandet"], ["Nordkapp", "Finnmark"],
    ["Nordre Follo", "Akershus"], ["Nordre Land", "Innlandet"], ["Nordreisa", "Troms"],
    ["Nore og Uvdal", "Buskerud"], ["Notodden", "Telemark"], ["Nærøysund", "Trøndelag"],
    ["Oppdal", "Trøndelag"], ["Orkland", "Trøndelag"], ["Os", "Innlandet"],
    ["Osen", "Trøndelag"], ["Oslo", "Oslo"], ["Osterøy", "Vestland"],
    ["Overhalla", "Trøndelag"], ["Porsanger", "Finnmark"], ["Porsgrunn", "Telemark"],
    ["Rakkestad", "Østfold"], ["Rana", "Nordland"], ["Randaberg", "Rogaland"],
    ["Rauma", "Møre og Romsdal"], ["Rendalen", "Innlandet"], ["Rennebu", "Trøndelag"],
    ["Rindal", "Trøndelag"], ["Ringebu", "Innlandet"], ["Ringerike", "Buskerud"],
    ["Ringsaker", "Innlandet"], ["Risør", "Agder"], ["Rollag", "Buskerud"],
    ["Råde", "Østfold"], ["Rælingen", "Akershus"], ["Rødøy", "Nordland"],
    ["Røros", "Trøndelag"], ["Røst", "Nordland"], ["Røyrvik", "Trøndelag"],
    ["Salangen", "Troms"], ["Saltdal", "Nordland"], ["Samnanger", "Vestland"],
    ["Sande", "Møre og Romsdal"], ["Sandefjord", "Vestfold"], ["Sandnes", "Rogaland"],
    ["Sarpsborg", "Østfold"], ["Sauda", "Rogaland"], ["Sel", "Innlandet"],
    ["Selbu", "Trøndelag"], ["Seljord", "Telemark"], ["Senja", "Troms"],
    ["Sigdal", "Buskerud"], ["Siljan", "Telemark"], ["Sirdal", "Agder"],
    ["Skaun", "Trøndelag"], ["Skien", "Telemark"], ["Skiptvet", "Østfold"],
    ["Skjervøy", "Troms"], ["Skjåk", "Innlandet"], ["Smøla", "Møre og Romsdal"],
    ["Snåsa", "Trøndelag"], ["Sogndal", "Vestland"], ["Sokndal", "Rogaland"],
    ["Sola", "Rogaland"], ["Solund", "Vestland"], ["Sortland", "Nordland"],
    ["Stad", "Vestland"], ["Stange", "Innlandet"], ["Stavanger", "Rogaland"],
    ["Steigen", "Nordland"], ["Steinkjer", "Trøndelag"], ["Stjørdal", "Trøndelag"],
    ["Stor-Elvdal", "Innlandet"], ["Stord", "Vestland"], ["Storfjord", "Troms"],
    ["Strand", "Rogaland"], ["Stranda", "Møre og Romsdal"], ["Stryn", "Vestland"],
    ["Sula", "Møre og Romsdal"], ["Suldal", "Rogaland"], ["Sunndal", "Møre og Romsdal"],
    ["Sunnfjord", "Vestland"], ["Surnadal", "Møre og Romsdal"], ["Sveio", "Vestland"],
    ["Sykkylven", "Møre og Romsdal"], ["Sømna", "Nordland"], ["Søndre Land", "Innlandet"],
    ["Sør-Aurdal", "Innlandet"], ["Sør-Fron", "Innlandet"], ["Sør-Odal", "Innlandet"],
    ["Sør-Varanger", "Finnmark"], ["Sørfold", "Nordland"], ["Sørreisa", "Troms"],
    ["Tana", "Finnmark"], ["Time", "Rogaland"], ["Tingvoll", "Møre og Romsdal"],
    ["Tinn", "Telemark"], ["Tjeldsund", "Troms"], ["Tokke", "Telemark"],
    ["Tolga", "Innlandet"], ["Tromsø", "Troms"], ["Trondheim", "Trøndelag"],
    ["Trysil", "Innlandet"], ["Træna", "Nordland"], ["Tvedestrand", "Agder"],
    ["Tydal", "Trøndelag"], ["Tynset", "Innlandet"], ["Tysnes", "Vestland"],
    ["Tysvær", "Rogaland"], ["Tønsberg", "Vestfold"], ["Ullensaker", "Akershus"],
    ["Ullensvang", "Vestland"], ["Ulstein", "Møre og Romsdal"], ["Ulvik", "Vestland"],
    ["Utsira", "Rogaland"], ["Vadsø", "Finnmark"], ["Vaksdal", "Vestland"],
    ["Valle", "Agder"], ["Vang", "Innlandet"], ["Vanylven", "Møre og Romsdal"],
    ["Vardø", "Finnmark"], ["Vefsn", "Nordland"], ["Vega", "Nordland"],
    ["Vegårshei", "Agder"], ["Vennesla", "Agder"], ["Verdal", "Trøndelag"],
    ["Vestby", "Akershus"], ["Vestnes", "Møre og Romsdal"], ["Vestre Slidre", "Innlandet"],
    ["Vestre Toten", "Innlandet"], ["Vestvågøy", "Nordland"], ["Vevelstad", "Nordland"],
    ["Vik", "Vestland"], ["Vindafjord", "Rogaland"], ["Vinje", "Telemark"],
    ["Volda", "Møre og Romsdal"], ["Voss", "Vestland"], ["Vågan", "Nordland"],
    ["Vågå", "Innlandet"], ["Våler", "Innlandet"], ["Våler", "Østfold"],
    ["Værøy", "Nordland"], ["Åfjord", "Trøndelag"], ["Ål", "Buskerud"],
    ["Ålesund", "Møre og Romsdal"], ["Åmli", "Agder"], ["Åmot", "Innlandet"],
    ["Årdal", "Vestland"], ["Ås", "Akershus"], ["Åseral", "Agder"],
    ["Åsnes", "Innlandet"], ["Øksnes", "Nordland"], ["Ørland", "Trøndelag"],
    ["Ørsta", "Møre og Romsdal"], ["Østre Toten", "Innlandet"], ["Øvre Eiker", "Buskerud"],
    ["Øyer", "Innlandet"], ["Øygarden", "Vestland"], ["Øystre Slidre", "Innlandet"],
  ];

  // Henter hele fylke/kommune-registeret — se KOMMUNE_REGISTER_STATISK over
  // for hvorfor dette nå er en hybrid (statisk momentant + live
  // bakgrunns-oppfriskning) i stedet for et rent nettverkskall.
  //
  // RETTET 2026-08-12 (bruker meldte at "snevre inn til fylke"-velgeren ikke
  // faktisk filtrerte noe, og at tvetydige kommunenavn som "Våler" ikke lot
  // seg disambiguere): den opprinnelige "VERIFISER"-antagelsen under viste
  // seg å være feil idet den faktisk ble testet mot ekte nettverkstilgang —
  // API-svaret har INGEN fylkesnavn/fylke-felt i det hele tatt (kun
  // kommunenavn/kommunenavnNorsk/kommunenummer), så `fylkesnavn` ble ALLTID
  // null, og enhver `k.fylkesnavn === X`-sammenligning (kommunerIFylke(),
  // og nå resolveKommuneNavn()) var derfor alltid usann. Kommunenummerets to
  // FØRSTE sifre ER offisielt fylkesnummeret (f.eks. "3419" → 34 →
  // Innlandet) — utleder fylkesnavnet derfra i stedet for å stole på et felt
  // som ikke finnes.
  async function loadKommuneRegister(){
    // Momentant, synkront (ingen await ennå) — appen er brukbar med FULL
    // kommuneliste + disambiguering fra og med selve kallet til denne
    // funksjonen, uansett nettverksstatus/cache-tilstand under.
    kommuneRegister = KOMMUNE_REGISTER_STATISK.map(([kommunenavn, fylkesnavn]) => ({ kommunenavn, fylkesnavn }));

    // RETTET 2026-08-13 (bruker meldte: "Våler"/Østfold ga fortsatt
    // "finnes i flere fylker ( og )" med TOMME fylkesnavn i parentesen,
    // selv på v0.21.8 med hardkodet register). Rotårsak: `fylkesnavn` var
    // `null` i responsen fra Kommuneinfo-API FØR v0.21.6 fikset
    // utledningen (kommunenummer-prefiks). Brukere som hadde besøkt appen
    // før den fiksen satt igjen med en gyldig-etter-alder (<30 dager),
    // men INNHOLDSMESSIG ødelagt cache i localStorage — den ble lastet her
    // og overskrev den korrekte, synkront satte tabellen over, stille og
    // uten feilmelding, i opptil 30 dager til. Cache-nøkkelen er nå
    // versjonert (ugyldiggjør automatisk alle caches fra før denne
    // rettelsen), OG selve innholdet sjekkes eksplisitt (minst én oppføring
    // må ha et faktisk fylkesnavn) — ikke bare alder/array-lengde — som
    // vern mot at samme klasse feil (en fremtidig endring i hva som caches)
    // kan snike seg forbi neste gang.
    const CACHE_KEY = 'fungifinder-kommuneregister-v2';
    const CACHE_MAX_AGE_DAYS = 30;
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const ageDays = (Date.now() - cached.fetchedAt) / (1000*60*60*24);
        const dataOk = Array.isArray(cached.data) && cached.data.length
          && cached.data.some(k => k && k.fylkesnavn);
        if (ageDays < CACHE_MAX_AGE_DAYS && dataOk) {
          kommuneRegister = cached.data;
          return;
        }
      }
    } catch(e) { /* ignorer korrupt cache — behold den statiske tabellen over */ }

    try {
      const res = await fetch('https://ws.geonorge.no/kommuneinfo/v1/kommuner');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.kommuner || []);
      kommuneRegister = list.map(k => ({
        kommunenavn: k.kommunenavnNorsk || k.kommunenavn || k.navn,
        fylkesnavn: k.fylkesnavn || (k.fylke && k.fylke.fylkesnavn)
          || FYLKESNUMMER_TIL_NAVN[String(k.kommunenummer || '').slice(0, 2)] || null
      })).filter(k => k.kommunenavn);
      if (kommuneRegister.length) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data: kommuneRegister }));
      } else {
        throw new Error('Uventet responsformat fra Kommuneinfo-API');
      }
    } catch (e) {
      // RETTET 2026-08-12: satte tidligere kommuneRegister = [] her ved
      // feil (f.eks. frakoblet/Kartverket nede) — tømte dermed den gode
      // statiske tabellen momentant satt over, i stedet for å bare beholde
      // den. Live-oppslaget er nå en RAFFINERING, ikke en forutsetning.
      console.warn('Kunne ikke friske opp kommuneregisteret fra Kartverket — beholder den innebygde tabellen (357 kommuner, generert 2026-08-12).', e);
    }
  }

  function alleKommunerAlfabetisk(){
    if (kommuneRegister.length) {
      return kommuneRegister.map(k => k.kommunenavn).sort((a,b)=>a.localeCompare(b,'no'));
    }
    return kommuneList(); // fallback: kun det som finnes i allerede lastet stedsdata
  }

  function kommunerIFylke(fylkesnavn){
    if (kommuneRegister.length) {
      return kommuneRegister.filter(k => k.fylkesnavn === fylkesnavn).map(k => k.kommunenavn).sort((a,b)=>a.localeCompare(b,'no'));
    }
    return kommuneList().filter(k => allLocations().some(l => l.kommune === k && l.fylke === fylkesnavn));
  }

  function fylkeList(){
    const set = new Set([...FYLKER_STATISK, ...allLocations().map(l=>l.fylke).filter(Boolean)]);
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'no'));
  }

  // RETTET 2026-08-12 (bruker meldte: "Tvetydig via Nominatim (mode=kommune)"
  // ved trigging av en ny områdehenting for "Våler", OG "jeg ser ikke
  // forskjell på kommuner av samme navn i kommunevelgeren"): kommunenavn er
  // IKKE unike nasjonalt — "Våler" finnes i både Østfold og Innlandet, "Bø" i
  // Nordland og Telemark, "Os" i Innlandet og Vestland, osv. (samme liste
  // fetch_area.py sin resolve_area() advarer om server-side, se
  // fungifinder-db sin CHANGELOG v23). "Snevre inn til ett fylke"-velgeren
  // (kommuneNarrowFylke) fantes allerede i UI-et og filtrerte forslagslisten
  // riktig, MEN ble aldri faktisk brukt til å disambiguere — verken i
  // Nominatim-kallet (zoomToAreaSelection/estimateAreaKm2) eller i verdien
  // sendt til /omrader/hent (startFetch), som begge sendte det rå,
  // potensielt tvetydige kommunenavnet direkte. Dette var ROTÅRSAKEN til
  // feilen, ikke bare et visningsproblem.
  //
  // kommunerMedNavn(): alle kommuneRegister-oppføringer med akkurat dette
  // navnet (0, 1, eller — for de fåtallige tvetydige navnene — 2).
  function kommunerMedNavn(navn){
    return kommuneRegister.filter(k => k.kommunenavn === navn);
  }

  // Returnerer "<navn>, <fylke>" hvis vi faktisk KAN avgjøre hvilket fylke
  // (navnet er unikt, ELLER brukeren har snevret inn via
  // kommuneNarrowFylke) — ellers null hvis navnet er tvetydig og uløst.
  // Brukes for ALT som går til et eksternt oppslag (Nominatim ELLER
  // fetch_area.py sin --value), ikke bare visning.
  function resolveKommuneNavn(navn){
    if (!navn) return navn;
    const treff = kommunerMedNavn(navn);
    if (treff.length <= 1) return navn; // unikt (eller ukjent i registeret, f.eks. før loadKommuneRegister() er ferdig — send uendret, samme oppførsel som før denne rettelsen)
    if (kommuneNarrowFylke !== 'alle' && treff.some(t => t.fylkesnavn === kommuneNarrowFylke)) {
      return `${navn}, ${kommuneNarrowFylke}`;
    }
    return null;
  }
  function kommuneList(){
    const set = new Set(allLocations().map(l=>l.kommune).filter(Boolean));
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'no'));
  }

  const BASE_MICROTIPS = {
    kantarell: ['Sjekk overgangen mellom tett og glissen skog, gjerne nær foten av eldre graner.', 'Se etter svakt hellende terreng — nok helning til å drenere, men ikke bratt nok til å tørke raskt ut.'],
    traktkantarell: ['Let i tykke mosematter under gammel gran, spesielt i svake forsenkninger.', 'Nordvendte, fuktige skråninger nær bekkedrag er ofte ekstra gode sent i sesongen.'],
    trompetsopp: ['Se i skyggefulle, fuktige partier under løvtrær, gjerne hassel/bøk/eik.', 'Kikk nøye i strølaget — den kamuflerer seg svært godt mot mørk jord.'],
    steinsopp: ['Undersøk kantsonene rundt lysninger, hogstkanter og gamle traktorveier/stier.', 'Sørvendte skråninger varmes opp tidligere og kan gi tidligere sesongstart.'],
    rodskrubb: ['Søk direkte under og rundt bjørketrær, spesielt i gresskledde bjørkelier.', 'Kantsoner mellom bjørk og annen skog er ofte produktive.'],
    matriske: ['Se i glisne furubestand på sandrygger, gjerne nær overgang mot myr.', 'Kantsoner mot lysåpne partier er ofte mer produktive enn tett skog.'],
    piggsopp: ['Sjekk blandingssoner der gran og bjørk møtes, samt kanter langs stier.', 'Mindre kravstor enn kantarell — gi også middels tett skog en sjanse.'],
    faresopp: ['Let direkte i bakken under gammel gran, ofte i sirkulære grupper ("hekseringer").', 'Moserik, åpen skogbunn er mer sannsynlig enn tett kratt.'],
    parasollsopp: ['Søk i skogkanter, veikanter og lysninger med gress — sjelden inne i tett skog.', 'Se etter store, distinkte eksemplarer; unngå unge/små individer.'],
    sjampinjong: ['Søk i gresskledde kanter av beitemarken, gjerne der det har vært husdyr eller gjødsling.', 'Se etter «hekseringer» — sirkulære mønstre i gresset.'],
    furuknippesopp: ['Se spesielt i gammel, lysåpen furuskog med rikelig reinlav i bunnen — tett/mørk skog er mindre aktuelt.', 'Grav forsiktig i sandjorda ved foten av gamle furutrær; knippene kan ligge delvis skjult under strø/lav.'],
    kransmusserong: ['Let i sandholdig, gammel furuskog — kjenner du en kraftig, kanelaktig lukt fra bakken, er du nære.', 'Sjekk gjerne samme sted flere år på rad — arten kommer ofte tilbake til samme punkt om den ikke forstyrres.']
  };
  function terrainMicrotips(species, loc){
    const tips = [...(BASE_MICROTIPS[species.id] || [])];
    if (loc.fuktighet === 'fuktig') tips.push('Terrenget er gjennomgående fuktig her — finner du lite i selve bunnen, prøv de tørreste mikro-hevningene (tuer, rotvelter).');
    if (loc.fuktighet === 'tørr') tips.push('Terrenget er tørt generelt — oppsøk eventuelle fuktigere lommer, bekkedrag eller nordvendte skråninger i nærheten.');
    if (loc.skogalder === 'gammel') tips.push('Gammel skog gir trolig godt utviklet mosedekke og dødt trevirke — positivt tegn for de fleste mykorrhizasopper.');
    if (loc.custom) tips.push('Dette er ditt eget erfarne sted: prøv å kjenne igjen nøyaktig hvilken del av terrenget som pleide å gi funn, og sjekk om den er intakt.');
    return tips.slice(0,4);
  }

  function seasonTiming(species){
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
    const nowPos = (now.getMonth()+1) + (now.getDate()-1)/daysInMonth;
    const [s0, s1] = species.season;
    const len = s1 - s0 + 1;
    const pos = nowPos - s0;
    const monthNames = ['januar','februar','mars','april','mai','juni','juli','august','september','oktober','november','desember'];
    const startName = monthNames[s0-1], endName = monthNames[s1-1];

    if (pos < -1) return { status:'for-tidlig', label:'For tidlig', pct:0,
      detail:`Sesongen for ${species.name.toLowerCase()} starter normalt i ${startName} — fortsatt en god stund til.` };
    if (pos < 0) return { status:'for-tidlig', label:'For tidlig, nærmer seg', pct:5,
      detail:`Sesongen starter normalt i ${startName}. Ikke lenge til, men trolig for tidlig ennå.` };
    if (pos < len*0.25) return { status:'tidlig', label:'Tidlig i sesongen', pct: 10 + (pos/len)*90,
      detail:`Vi er i starten av sesongen (${startName}–${endName}) for ${species.name.toLowerCase()} — kan variere fra år til år avhengig av vær.` };
    if (pos < len*0.75) return { status:'topp', label:'Midt i beste periode', pct: 10 + (pos/len)*90,
      detail:`Dette er normalt den beste perioden for ${species.name.toLowerCase()}.` };
    if (pos <= len) return { status:'slutten', label:'Mot slutten av sesongen', pct: 10 + (pos/len)*90,
      detail:`Sesongen (${startName}–${endName}) nærmer seg slutten — fortsatt mulig, men avtagende sjanser.` };
    if (pos <= len+1) return { status:'sent', label:'Sent, snart over', pct:97,
      detail:`Normalsesongen er over, men enkelte sene funn kan fortsatt forekomme.` };
    return { status:'for-sent', label:'For sent i år', pct:100,
      detail:`Sesongen for ${species.name.toLowerCase()} (${startName}–${endName}) er normalt over for i år.` };
  }

  // ---------- map (Leaflet) ----------
  let leafletMap = null;
  let markerLayer = null;
  let radiusLayer = null;
  let routeLayer = null;
  let hogstLayer = null;
  let findsLayer = null;
  let artskartLayer = null;
  let delteFunnLayer = null; // andre brukeres delte funn — se loadDelteFunn()/renderDelteFunnLayer()
  let voksestedslagLayer = null; // fargelag per art/score — se renderVoksestedslag()
  let layersControl = null; // L.control.layers-instansen — se updateVoksestedslagAvailability()
  let artskartMoveDebounce = null; // se moveend-lytteren i initMap()
  let findMarkersById = {};
  let mapFittedOnce = false;
  let markersById = {};
  let areaCount = 5;
  let suggestedRoute = null; // { areas: [{anchor, members, radiusM}] } — se suggestAreas()
  let mapFullscreen = false;

  // RETTET 2026-08-16 (bruker-rapport: popup-en for et "Foreslått område"
  // — som har MYE lengre tekst enn de andre popup-ene, se describeRouteTerrain()
  // ved bindPopup()-kallet i renderAreasOnMap() — kunne bli TALLERE enn selve
  // kartcontaineren (.sp-leaflet-map er kun 360-460px høy, se css/styles.css).
  // Leaflets autoPan flytter kun SELVE KARTET for å holde popupen innenfor
  // kartcontaineren — men hvis popupen er høyere ELLER bredere enn
  // containeren, finnes det ingen panorering som får den til å bli helt
  // synlig, uansett. Content ble derfor "avkuttet i kanten" på mobil, akkurat
  // slik brukeren viste et skjermbilde av. Fast `maxHeight` er Leaflets EGET
  // mekanisme for dette (ikke egendefinert CSS) — den ruller innholdet
  // internt (`.leaflet-popup-scrolled`, allerede styrt av leaflet.min.css fra
  // CDN-en) i stedet for å la det overflow:hidden-kuttes av containeren.
  // `maxWidth` senket fra Leaflets standard 300 til 240 av samme grunn — 300
  // pluss innvendig marg (~24px) er bredere enn selve kartcontaineren på en
  // smal mobilskjerm (375px bred - 40px sideutfylling - kant ≈ 330px).
  // Brukt på ALLE bindPopup()-kall, ikke bare det ene lange, slik at ingen
  // fremtidig lengre popup-tekst kan gjeninnføre akkurat dette problemet.
  // autoPanPadding økt fra Leaflets standard [5,5] — gir litt luft fra
  // KANTEN på egne kontroller (zoom +/−, lag-ikonet) som ellers kan havne
  // rett oppå en nettopp panorert popup (oppdaget under verifisering av
  // maxWidth/maxHeight-fiksen, se skjermbilde i samtalen 2026-08-16).
  // Bevisst UNIFORM, ikke asymmetrisk topLeft/bottomRight — forsøkt først,
  // men en stor ensidig verdi presset i stedet popup-en ut over MOTSATT
  // kant på en smal mobilskjerm (kun ca. 30px total slark igjen etter
  // maxWidth 240 + Leaflets egen ~47px innvendige marg, på en ~320px bred
  // kartcontainer) — verifisert live at dette IKKE skjer med [16,16].
  const POPUP_OPTS = { maxWidth: 240, maxHeight: 260, autoPanPadding: [16, 16] };

  // Kartet var for lite til feltbruk (særlig mobil). Fullskjerm gjør panelet
  // til et fast overlay og lar CSS gi kartet det meste av skjermhøyden —
  // Leaflet må fortelles eksplisitt at containeren endret størrelse
  // (invalidateSize), ellers blir fliser feilplassert/tomme utenfor det
  // opprinnelige, mindre området.
  function toggleMapFullscreen(){
    mapFullscreen = !mapFullscreen;
    document.getElementById('sp-map-panel').classList.toggle('sp-map-fullscreen', mapFullscreen);
    document.body.classList.toggle('sp-map-fullscreen-active', mapFullscreen);
    document.getElementById('sp-map-fullscreen-toggle').textContent = mapFullscreen ? '✕ Lukk fullskjerm' : '⛶ Fullskjerm';
    setTimeout(() => { if (leafletMap) leafletMap.invalidateSize(); }, 260);
  }

  // UX-gjennomgang 2026-08-14: Liste/Kart-bryter for mobil (se
  // .sp-mobile-view-toggle i index.html/styles.css) — kun kosmetisk
  // display:none/flex på desktop (CSS-en er scopet til @media max-width:760px,
  // så klassebyttet under er en no-op der). setMobileView('kart') kalles
  // ikke bare fra selve bryteren, men også fra ethvert sted som scroller
  // brukeren til kartet (locateOnMap/locateFindOnMap/fetch-nudge-lenkene)
  // — er kartet skjult via display:none når det skjer, er scrollIntoView
  // meningsløst OG Leaflet har regnet ut fliser mot en 0×0-container, derfor
  // invalidateSize() etter at panelet faktisk er synlig igjen (samme
  // mønster som toggleMapFullscreen over).
  function setMobileView(view){
    const layout = document.querySelector('.sp-layout');
    const toggle = document.getElementById('sp-mobile-view-toggle');
    if (!layout || !toggle) return;
    layout.classList.toggle('sp-mobile-view-liste', view === 'liste');
    layout.classList.toggle('sp-mobile-view-kart', view === 'kart');
    toggle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.mobileview === view));
    if (view === 'kart' && leafletMap) setTimeout(() => leafletMap.invalidateSize(), 60);
  }

  // ---------- min posisjon (GPS, engangs) ----------
  // Bevisst engangs (getCurrentPosition), ikke løpende sporing (watchPosition)
  // — dekker "jeg har parkert, vis meg oversikten" og "fyll inn koordinatene
  // for et funn jeg registrerer nå" uten batteribruk fra kontinuerlig sporing.
  let myLocationMarker = null;

  // RETTET 2026-08-12: bruker meldte ~8s snitt-ventetid på "min posisjon"
  // uten noe visuelt tegn på at noe skjedde i mellomtiden (så ut som kartet
  // hadde hengt seg). To reelle, uavhengige tiltak, ingen falsk "vi gjorde
  // det raskere"-påstand — selve GPS/WiFi-triangulereingen skjer i
  // nettleser/OS og kan IKKE gjøres raskere herfra:
  //  1. `maximumAge` var 0 (default) — hvert eneste klikk tvang fram et
  //     helt ferskt oppslag, selv rett etter at geolocateStartupView() (se
  //     under) allerede hadde gjort nøyaktig samme oppslag for få sekunder
  //     siden. Med `maximumAge` kan et klikk som skjer innenfor vinduet
  //     gjenbruke en fersk posisjon momentant i stedet for å vente på nytt.
  //  2. `enableHighAccuracy` er nå per kall — den delte kartknappen
  //     ("min posisjon" for områdevalg) trenger ikke meter-presisjon, kun
  //     riktig fylke/kommune-nærhet, så den ber om lav nøyaktighet (raskere
  //     svar, spesielt på en laptop uten GPS-brikke der høy nøyaktighet
  //     tvinger fram et tregere WiFi-basert oppslag). Kallene som fyller inn
  //     et FAKTISK funnpunkt (finn-modalen, "flytt til min posisjon" for et
  //     registrert funn) beholder høy nøyaktighet — presisjon er viktig der.
  //  3. `buttonEl` (valgfri) viser "⏳ Henter posisjon…" og deaktiverer
  //     knappen mens vi venter, så ventetiden (uansett hvor lang den er)
  //     ikke lenger ser ut som et hengende kart.
  // IKKE verifisert live mot en ekte GPS/WiFi-triangulering (sandkasse-
  // nettleseren her avslår geolokasjon momentant, ingen reell posisjon
  // tilgjengelig) — kun kodesti/logikk verifisert.
  function useMyLocation(onSuccess, { enableHighAccuracy = true, maximumAge = 60000, buttonEl = null } = {}){
    if (!navigator.geolocation) {
      alert('Nettleseren din støtter ikke posisjonsdeling.');
      return;
    }
    const originalLabel = buttonEl ? buttonEl.textContent : null;
    if (buttonEl) {
      buttonEl.disabled = true;
      buttonEl.textContent = '⏳ Henter posisjon…';
    }
    const restoreButton = () => {
      if (buttonEl) {
        buttonEl.disabled = false;
        buttonEl.textContent = originalLabel;
      }
    };
    navigator.geolocation.getCurrentPosition(
      (pos) => { restoreButton(); onSuccess(pos.coords.latitude, pos.coords.longitude); },
      (err) => { restoreButton(); alert('Kunne ikke hente posisjonen din: ' + err.message); },
      { enableHighAccuracy, timeout: 10000, maximumAge }
    );
  }

  // openPopup/zoom er valgfrie (default = uendret oppførsel for den
  // eksplisitte "min posisjon"-knappen) — geolocateStartupView() under
  // bruker en videre zoom og hopper over popup-en, siden det skjer uten at
  // brukeren ba om det.
  function showMyLocationOnMap(lat, lon, { openPopup = true, zoom = 14 } = {}){
    if (!leafletMap) return;
    if (myLocationMarker) leafletMap.removeLayer(myLocationMarker);
    myLocationMarker = L.circleMarker([lat, lon], {
      radius: 9, color: '#fff', weight: 3, fillColor: '#2E6FE0', fillOpacity: 1
    }).bindPopup('📍 Du er her', POPUP_OPTS).addTo(leafletMap);
    leafletMap.setView([lat, lon], Math.max(leafletMap.getZoom(), zoom));
    if (openPopup) myLocationMarker.openPopup();
  }

  // ---------- geolokasjon ved oppstart (stille, kort timeout) ----------
  // RETTET (lastetid, steg 3/3 — se D1-MIGRASJON.md): sentrerer kartet på
  // brukerens posisjon FØR loadArtsfunn() sitt bbox-hent kjører (se init()),
  // slik at den første, "gratis" artsfunn-hentingen faktisk er relevant for
  // brukeren i stedet for det faste senterpunktet [60.5, 10.7]. Zoom 11 —
  // videre enn knappens 14 (som forutsetter et bevisst "vis akkurat der jeg
  // er"-klikk), gir heller en fornuftig regional oversikt å starte fra.
  //
  // Helt stille ved avslag/feil/timeout — INGEN alert (i motsetning til
  // useMyLocation() over), siden dette skjer uten at brukeren ba om det;
  // default senterpunktet er et helt greit utgangspunkt. Egen 4s-timeout i
  // TILLEGG til geolocation-API-ets eget timeout-alternativ, fordi enkelte
  // nettleser/OS-kombinasjoner (bl.a. iOS Safari) kan la
  // tillatelsesdialogen stå åpen uten å kalle timeout-callbacken mens
  // brukeren tenker seg om — denne garanterer at resten av oppstarten
  // uansett fortsetter innen 4 sekunder. Et SENT svar (bruker godtar
  // dialogen etter at vi ga opp) flytter fortsatt kartet når det kommer —
  // setView() over trigger Leaflet sin egen 'moveend', som den allerede
  // eksisterende lytteren i initMap() fanger opp helt av seg selv.
  // RETTET 2026-08-13 (bruker meldte: kartet viser innimellom "et større
  // utsnitt av Norge" ved sideinnlasting, som om posisjonen var ukjent).
  // Rotårsak: `getCurrentPosition()` fikk tidligere `{ timeout: 4000 }` —
  // IKKE bare "hvor lenge VI venter" (det styres av setTimeout-en under,
  // uendret), men en instruks til selve geolokasjons-APIet om å returnere
  // en TIMEOUT-FEIL (ikke prøve på nytt) hvis en posisjon ikke er funnet
  // innen 4 sek, UANSETT hvor travelt hovedtråden er med resten av
  // oppstarten. Forrige økt (se memory "fungifinder-oppfolgingspunkter")
  // målte allerede ~8 sek reell ventetid for "Min posisjon" — godt over
  // dette budsjettet. Når fristen sprakk, feilet geolokasjonen PERMANENT
  // (ingen ny sjanse), `mapFittedOnce` forble `false`, og appen falt
  // tilbake til å fitBounds() over HELE det nasjonale datasettet (default
  // `fylkeFilter='alle'`) — nøyaktig symptomet meldt. Den EGNE
  // setTimeout(4000) under (som slipper resten av oppstarten videre uten
  // å vente på geolokasjon) er UENDRET — kun selve API-fristen er hevet,
  // slik at en treg-men-reell posisjonering fortsatt får lov til å komme
  // gjennom og rette opp kartet (se suksess-callbacken under, som allerede
  // var designet for å håndtere et SENT svar) i stedet for å bli drept før
  // den i det hele tatt fikk sjansen.
  function geolocateStartupView(){
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(false); return; }
      let ferdig = false;
      const ferdigstill = (lykkes) => { if (!ferdig) { ferdig = true; resolve(lykkes); } };
      setTimeout(() => ferdigstill(false), 4000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          showMyLocationOnMap(pos.coords.latitude, pos.coords.longitude, { openPopup: false, zoom: 11 });
          // RETTET: renderMap() sin "zoom til alle markører, kun første
          // gang"-logikk (mapFittedOnce, se der) kjørte rett ETTER dette ved
          // første render() i init() — den overstyrte geolokasjon-zoomen
          // umiddelbart med et fitBounds() over HELE datasettet (siden
          // filterMode/fylkeFilter fortsatt er default "alle" på dette
          // tidspunktet). Brukeren måtte da trykke "min posisjon" på nytt for
          // å faktisk få den innzoomede visningen. Markerer kartet som
          // allerede fittet — geolokasjonen ER det bevisste utgangspunktet.
          mapFittedOnce = true;
          // RETTET: brukeren forventet at en kjent posisjon automatisk ble
          // brukt som senter i Radius-modus — det gjorde den ikke,
          // radiusCenter ble KUN satt via et eksplisitt kartklikk. Uten et
          // senter tegnes ingen sirkel i det hele tatt (se renderMap()), så
          // zoomToRadiusSelection() (fra forrige rettelse) hadde ingenting å
          // vise selv om brukeren byttet til Radius-fanen. Setter nå
          // radiusCenter direkte her — samme geolokasjon dekker altså både
          // kartets startutsnitt OG radius-standarden i samme slengen.
          radiusCenter = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          ferdigstill(true);
        },
        () => ferdigstill(false), // avslått eller feilet — behold default senterpunkt
        { timeout: 12000, maximumAge: 5 * 60 * 1000 }
      );
    });
  }

  // Rikelig margin rundt Norge (inkl. Svalbard) + naboland. Uten en grense her
  // kan man ved kraftig utzooming (naturlig med steder spredt helt opp mot
  // 70°N) panorere forbi kartprojeksjonens øvre kant — Web Mercator dekker
  // ikke polarområdene, så det viser seg som tomt, grått felt uten noe kart.
  const MAP_BOUNDS = L.latLngBounds([53, -10], [82, 45]);

  // Ved rask påfølgende panorering/zooming (f.eks. fitBounds rett etter mange
  // steder lastes, eller flere raske klikk på zoom-knappen) avbryter
  // nettleseren fliser som er under lasting. Leaflet prøver IKKE disse på
  // nytt av seg selv — de blir stående tomme (grått) til brukeren tilfeldigvis
  // panorerer akkurat den ruten på nytt. Prøver derfor avbrutte/feilede
  // fliser på nytt automatisk et par ganger, for alle bakgrunnskart.
  function attachTileRetry(layer){
    layer.on('tileerror', (e) => {
      const tile = e.tile;
      const attempts = (parseInt(tile.dataset.retryCount || '0', 10)) + 1;
      if (attempts <= 4) {
        tile.dataset.retryCount = String(attempts);
        setTimeout(() => { tile.src = tile.src; }, 400 * attempts);
      }
    });
  }

  function initMap(){
    leafletMap = L.map('sp-leaflet-map', {
      scrollWheelZoom: true,
      maxBounds: MAP_BOUNDS,
      maxBoundsViscosity: 1.0,
      minZoom: 4
    }).setView([60.5, 10.7], 6);

    // Standard OSM-gatekart viser ikke høydekoter, bekker eller stier — for
    // å faktisk kunne lese terrenget (poenget med appen) trengs et ordentlig
    // topografisk kart som standardvalg. Kartverkets "topo"-lag har det;
    // OSM og satellittfoto tilbys som alternativer via lag-kontrollen.
    const topoLayer = L.tileLayer('https://cache.kartverket.no/v1/wmts/1.0.0/topo/default/webmercator/{z}/{y}/{x}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.kartverket.no/">Kartverket</a>'
    });
    const standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsytere'
    });
    const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Flyfoto &copy; Esri, Maxar, Earthstar Geographics'
    });
    [topoLayer, standardLayer, satelliteLayer].forEach(attachTileRetry);
    topoLayer.addTo(leafletMap);

    // Målepunkter-laget starter AV (ikke lagt til kartet her) — med
    // hundrevis/tusenvis av scorede punkter samtidig dominerer det kartbildet
    // fullstendig med det samme man åpner appen. Registreres likevel i
    // lag-kontrollen under (L.control.layers viser avkrysningen som av når
    // laget ikke er på kartet ennå), og locateOnMap()/handleMapMarkerClick()
    // skrur det på automatisk igjen når man faktisk trenger å se et punkt.
    markerLayer = L.layerGroup();
    // Voksestedslaget starter AV, samme begrunnelse som Målepunkter-laget
    // over (se kommentaren der) — pluss at det er et alternativt, ikke et
    // tillegg til, den vanlige markørvisningen. renderVoksestedslag() fyller
    // laget uansett på/av-tilstand, slik at det er ferdig tegnet i det
    // øyeblikket avkrysningen skrus på.
    voksestedslagLayer = L.layerGroup();
    radiusLayer = L.layerGroup().addTo(leafletMap);
    routeLayer = L.layerGroup().addTo(leafletMap);
    hogstLayer = L.layerGroup().addTo(leafletMap);
    findsLayer = L.layerGroup().addTo(leafletMap);
    artskartLayer = L.layerGroup().addTo(leafletMap);
    delteFunnLayer = L.layerGroup().addTo(leafletMap);

    // Lag-kontroll: bytt bakgrunnskart (radioknapper) og skru målepunkter/
    // rundtur/hogstfelt/funn av/på (avkrysning) — praktisk når man vil se
    // rent terreng for å merke seg egne funnsteder uten at prikkene er i veien.
    // "Voksestedslag (fargelag)" er BEVISST IKKE med i den statiske
    // overlay-listen her — isAdmin() er alltid usann i det øyeblikket
    // initMap() kjører (currentUser settes først når initAuth() resolves
    // ETTER initMap(), se init()), så et betinget objekt-literal her ville
    // aldri fått med laget, selv for en faktisk admin. Legges i stedet til
    // dynamisk via layersControl.addOverlay()/removeOverlay(), se
    // updateVoksestedslagAvailability() (kalt fra reflectAccountUi()).
    layersControl = L.control.layers(
      { 'Topografisk (Kartverket)': topoLayer, 'Standard': standardLayer, 'Satellitt': satelliteLayer },
      { 'Målepunkter': markerLayer, 'Foreslåtte områder': routeLayer, 'Mine hogstfelt': hogstLayer, 'Mine funn': findsLayer, 'Artsdatabanken-funn': artskartLayer, 'Delte funn (andre brukere)': delteFunnLayer },
      { collapsed: true }
    ).addTo(leafletMap);

    // Tegnforklaring/dekningstekst for voksestedslaget vises kun mens laget
    // faktisk er på kartet — se renderVoksestedslagLegend()/
    // renderVoksestedslagCoverage() (fylles uansett) og
    // voksestedslagPanelsVisible() (styrer synlighet).
    leafletMap.on('overlayadd overlayremove', (e) => {
      if (e.layer === voksestedslagLayer) voksestedslagPanelsVisible(e.type === 'overlayadd');
    });

    leafletMap.on('click', (e) => {
      if (markingHogstMode) {
        openHogstOmradeModal(e.latlng.lat, e.latlng.lng);
      } else if (filterMode === 'radius') {
        radiusCenter = { lat: e.latlng.lat, lon: e.latlng.lng };
        clearRoute();
        zoomToRadiusSelection();
        render();
      } else {
        openFindModal(null, { lat: e.latlng.lat, lon: e.latlng.lng });
      }
    });

    // Artskart-laget er bundet til det synlige kartutsnittet (se
    // renderArtskartLayer) — må derfor oppdateres når du panorerer/zoomer,
    // ikke bare ved filter-/artsbytte. 'moveend' dekker begge deler i
    // Leaflet (zooming trigger også moveend). Debounces 300ms slik at et
    // helt drag ikke gjør dette for hver eneste mellomposisjon.
    // RETTET (lastetid, steg 2/3): kaller nå loadArtsfunn() FØR re-render —
    // den avgjør selv om et nytt bbox-hent faktisk trengs (se
    // artsfunnLoadedBounds der), så dette er billig i det vanlige
    // tilfellet (liten panorering innenfor allerede hentet utsnitt).
    leafletMap.on('moveend', () => {
      clearTimeout(artskartMoveDebounce);
      artskartMoveDebounce = setTimeout(async () => {
        await loadArtsfunn();
        renderArtskartLayer();
      }, 300);
    });

    // RETTET 2026-08-16 (se viewportImpliesScope()): når intet
    // fylke/kommune/radius er eksplisitt valgt, ER kartutsnittet selve
    // scopet for lista/kartprikkene/værsammendraget/"Foreslå områder" — en
    // panorering/zoom må da re-scope akkurat som et fylke-/kommunebytte
    // gjør, ellers ville dette kun blitt oppdatert ved NESTE, urelaterte
    // render()-kall (filterbytte, innlogging, …), ikke av selve
    // panoreringen brukeren nettopp gjorde. Egen debounce (kortere enn
    // Artskart-kallet over — dette er en ren klient-side re-filtrering av
    // allerede innlastet BASE_LOCATIONS, ingen nettverksrundtur i seg selv;
    // render() sin egen maybeRefreshWeatherForScope() har uansett sin egen
    // 400ms-debounce for værhentingen). Gjør ingenting når et eksplisitt
    // fylke/kommune/radius ER valgt — da skal panorering fortsatt være ren
    // visning, uendret oppførsel.
    let viewportScopeMoveDebounce = null;
    leafletMap.on('moveend', () => {
      if (artskartOmradeErAvgrenset()) return;
      clearTimeout(viewportScopeMoveDebounce);
      viewportScopeMoveDebounce = setTimeout(render, 200);
    });
  }

  function mapCenterFallback(){
    if (leafletMap) { const c = leafletMap.getCenter(); return { lat: c.lat, lon: c.lng }; }
    return { lat: 60.5, lon: 10.7 };
  }

  function handleMapMarkerClick(loc){
    if (filterMode === 'fylke') {
      fylkeFilter = (fylkeFilter === loc.fylke) ? 'alle' : loc.fylke;
      render();
    } else if (filterMode === 'kommune') {
      kommuneFilter = (kommuneFilter === loc.kommune) ? 'alle' : loc.kommune;
      render();
    } else {
      radiusCenter = { lat: loc.lat, lon: loc.lon };
      zoomToRadiusSelection();
      render();
    }
    setTimeout(() => {
      const card = document.querySelector(`.sp-card[data-loc="${loc.id}"]`);
      if (card) {
        card.scrollIntoView({behavior:'smooth', block:'center'}); card.classList.add('sp-flash'); setTimeout(()=>card.classList.remove('sp-flash'), 1200);
      } else {
        // Ikke noe kort å scrolle til — typisk fordi "Skjul flatehogde steder"
        // er aktivt og filtrerte det bort. Vis info i kartet i stedet for at
        // klikket tilsynelatende ikke gjør noe.
        const marker = markersById[loc.id];
        if (marker) marker.openPopup();
      }
    }, 60);
  }

  // RETTET 2026-08-15 (UX-gjennomgang, se render()/sp-score-filter-hint):
  // erstatter et tidligere STATISK hint ("skru på «Målepunkter» i lag-menyen
  // øverst til høyre") som pekte på noe usynlig for en mobilbruker i
  // listevisning (kartet er display:none der til man bytter fane, se
  // .sp-mobile-view-liste). Samme to trekk som locateOnMap() gjør uansett
  // (skru på markerLayer + setMobileView('kart')), bare uten å zoome til ett
  // bestemt punkt — brukt av "Vis alle steder i området på kartet"-lenken.
  function showAllPointsOnMap(){
    if (!leafletMap) return;
    if (markerLayer && !leafletMap.hasLayer(markerLayer)) leafletMap.addLayer(markerLayer);
    setMobileView('kart');
    document.getElementById('sp-leaflet-map').scrollIntoView({ behavior:'smooth', block:'center' });
  }

  // Motsatt vei av handleMapMarkerClick: klikk på "Vis i kart" på et kort i
  // listen panorerer/zoomer kartet til akkurat det stedet og åpner popup-en,
  // slik at du kan analysere naboterrenget uten å måtte lete deg fram manuelt.
  function locateOnMap(locId){
    const loc = allLocations().find(l => l.id === locId);
    const marker = markersById[locId];
    if (!loc || !leafletMap) return;
    // Markøren finnes i markerLayer uansett, men er usynlig (og openPopup()
    // virker ikke) hvis laget er skrudd av via "Målepunkter"-avkrysningen —
    // skru det på igjen, ellers skjer det tilsynelatende ingenting.
    if (markerLayer && !leafletMap.hasLayer(markerLayer)) leafletMap.addLayer(markerLayer);
    setMobileView('kart');
    document.getElementById('sp-leaflet-map').scrollIntoView({ behavior:'smooth', block:'center' });
    leafletMap.setView([loc.lat, loc.lon], Math.max(leafletMap.getZoom(), 13));
    if (marker) setTimeout(() => marker.openPopup(), 350);
  }

  function renderMap(scoredAll){
    if (!leafletMap) return;
    markerLayer.clearLayers();
    radiusLayer.clearLayers();
    markersById = {};

    scoredAll.forEach(({ loc, res }) => {
      const color = res.isCut ? '#A23E2E' : scoreColor(res.total);
      const marker = L.circleMarker([loc.lat, loc.lon], {
        radius: 8,
        color: loc.custom ? '#8C4A20' : '#232D1D',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.85,
        dashArray: loc.custom ? '3,3' : null
      });
      marker.bindPopup(`<b>${escapeHtml(loc.name)}</b><br/>${escapeHtml(loc.kommune)}, ${escapeHtml(loc.fylke)}<br/>Score: ${res.total}${res.isCut ? ' — flatehogd' : ''}`, POPUP_OPTS);
      // Eksakt score synlig ved HOVER, ikke bare ved klikk (se vurderingen
      // av fargekodingens grovkornethet) — tooltip er lettvekts sammenlignet
      // med popup-en (åpnes ikke ved klikk, kolliderer ikke med
      // handleMapMarkerClick under).
      marker.bindTooltip(String(res.total), { direction: 'top', offset: [0, -6] });
      marker.on('click', () => handleMapMarkerClick(loc));
      marker.addTo(markerLayer);
      markersById[loc.id] = marker;
    });

    if (filterMode === 'radius' && radiusCenter) {
      L.circle([radiusCenter.lat, radiusCenter.lon], {
        radius: radiusKm * 1000, color: '#B3602A', weight: 1.5, fillColor: '#B3602A', fillOpacity: 0.1, dashArray: '4,3'
      }).addTo(radiusLayer);
      L.circleMarker([radiusCenter.lat, radiusCenter.lon], {
        radius: 5, color: '#fff', weight: 2, fillColor: '#B3602A', fillOpacity: 1
      }).addTo(radiusLayer);
    }

    if (!mapFittedOnce && scoredAll.length) {
      const bounds = L.latLngBounds(scoredAll.map(({loc}) => [loc.lat, loc.lon]));
      leafletMap.fitBounds(bounds.pad(0.15));
      mapFittedOnce = true;
    }

    const hint = document.getElementById('sp-map-hint');
    const addHint = personalFeaturesEnabled() ? ' Klikk et tomt sted i kartet for å legge til et eget sted der.' : '';
    if (filterMode === 'fylke') {
      hint.textContent = 'Klikk et punkt for å filtrere til det fylket.' + addHint;
    } else if (filterMode === 'kommune') {
      hint.textContent = 'Klikk et punkt for å filtrere til den kommunen.' + addHint;
    } else {
      hint.textContent = radiusCenter
        ? `Senter satt ved ${radiusCenter.lat.toFixed(3)}, ${radiusCenter.lon.toFixed(3)}. Klikk et nytt punkt for å flytte senteret.`
        : 'Klikk et punkt i kartet (eller på et sted) for å sette senter for radiusfilteret.';
    }
  }

  // ---------- Voksestedslag (dekningsbevisst fargelag) ----------
  //
  // Del 1.1/1.2 i "Voksestedslaget"-planen: et rendringslag bygget
  // UTELUKKENDE på scoredAll — samme allerede-lastede/allerede-scorede
  // punkter som renderMap() over tegner som sirkelmarkører — pluss
  // SPECIES_HUE/speciesPointColor (se toppen av filen). Ingen ny
  // backend-endring, ingen ny tabell, ingen egen henting: laget er en ren
  // alternativ tegning av data appen allerede har lastet inn for det
  // synlige området.
  //
  // Hvilken art et gitt punkt fargelegges etter: i favoritt-modus brukes
  // samme "beste favoritt her"-logikk som resten av kortene (favResults[0],
  // se cardHtmlFavorites/scoreForRoute) — ett punkt kan kun ha ÉN farge.
  function speciesForVoksestedspunkt(item){
    if (viewMode === 'favorites') {
      return (item.favResults && item.favResults[0]) ? item.favResults[0].species : null;
    }
    return _currentSpecies;
  }

  // Tegner ett lite, kant-løst rektangel per punkt (ikke sirkel — leser mer
  // som en rutenett-"celle" enn en markør, nærmere fig. 1 i planen) i
  // stedet for interpolasjon mellom punkter. dLon korrigeres for breddegrad
  // slik at cellen ser tilnærmet kvadratisk ut både i Sør- og Nord-Norge.
  // Flatehogde steder (res.isCut) hoppes over — samme eksklusjon som
  // resten av appen bruker, et nylig hogd punkt skal ikke se ut som et godt
  // voksested her heller.
  function renderVoksestedslag(scoredAll){
    if (!voksestedslagLayer) return;
    voksestedslagLayer.clearLayers();
    scoredAll.forEach(item => {
      const { loc, res } = item;
      if (res.isCut) return;
      const species = speciesForVoksestedspunkt(item);
      if (!species) return;
      const hue = SPECIES_HUE[species.id] || SPECIES_HUE.kantarell;
      const fill = speciesPointColor(hue, res.total);
      const dLat = 0.0021;
      const dLon = dLat / Math.max(0.3, Math.cos(loc.lat * Math.PI / 180));
      const rect = L.rectangle(
        [[loc.lat - dLat, loc.lon - dLon], [loc.lat + dLat, loc.lon + dLon]],
        { stroke: false, fillColor: fill, fillOpacity: 0.7 }
      );
      rect.bindTooltip(`${escapeHtml(species.name)}: ${res.total}`, { direction: 'top', offset: [0, -4] });
      rect.on('click', () => handleMapMarkerClick(loc));
      rect.addTo(voksestedslagLayer);
    });
  }

  // Dekningstekst — ALDRI en areal-/prosentandel av kommunen (appen har
  // ikke kommunens faktiske polygonareal tilgjengelig klientsidig), kun et
  // reelt telt antall tegnede punkter. Samme ærlighetsprinsipp som
  // "tynt datagrunnlag"-linjen over "Foreslå områder" (se
  // AREA_COVERAGE_THIN_THRESHOLD): ingen tall appen ikke kan stå inne for.
  function renderVoksestedslagCoverage(scoredAll){
    const el = document.getElementById('sp-voksested-coverage');
    if (!el) return;
    const painted = scoredAll.filter(item => !item.res.isCut && speciesForVoksestedspunkt(item)).length;
    el.textContent = painted === 0
      ? 'Ingen fargelagte punkter i valgt område ennå — terrengdata er ikke hentet her.'
      : `Fargelegger ${painted} kjent${painted === 1 ? '' : 'e'} punkt${painted === 1 ? '' : 'er'} i valgt område. Fargelaget dekker kun der terrengdata faktisk er hentet — resten av kartet vises umerket, ingen interpolering mellom punktene.`;
  }

  function voksestedslagRelevantSpecies(){
    if (viewMode === 'favorites' && favoriteSpecies.length) {
      return favoriteSpecies.map(id => SPECIES.find(s => s.id === id)).filter(Boolean);
    }
    return _currentSpecies ? [_currentSpecies] : [];
  }

  // Tegnforklaring (fig. 2) — én rad per relevant art (valgt art, eller alle
  // favoritter i favoritt-modus), gjenbrukt fra samme SPECIES_HUE/
  // speciesGradientCss som selve fargelaget, slik at stolpen alltid stemmer
  // visuelt med punktfargene på kartet.
  function renderVoksestedslagLegend(){
    const el = document.getElementById('sp-voksested-legend');
    if (!el) return;
    const species = voksestedslagRelevantSpecies();
    el.innerHTML = species.map(sp => `
      <div class="sp-vlegend-row">
        <span class="sp-vlegend-name">${escapeHtml(sp.name)}</span>
        <span class="sp-vlegend-bar" style="background:${speciesGradientCss(SPECIES_HUE[sp.id] || SPECIES_HUE.kantarell)}"></span>
        <span class="sp-vlegend-labels"><span>lav</span><span>høy</span></span>
      </div>`).join('');
  }

  function voksestedslagPanelsVisible(visible){
    const legend = document.getElementById('sp-voksested-legend');
    const coverage = document.getElementById('sp-voksested-coverage');
    if (legend) legend.style.display = visible ? 'flex' : 'none';
    if (coverage) coverage.style.display = visible ? 'block' : 'none';
  }

  // Voksestedslaget er admin-only inntil videre (bruker-ønske 2026-08-16:
  // "gjør voksestedslaget kun tilgjengelig for admin frem til jeg er
  // fornøyd med kvaliteten") — legges til/fjernes fra selve
  // lag-kontrollen dynamisk her, i stedet for kun å styre CSS-synlighet,
  // slik at vanlige brukere verken ser avkrysningen eller kan skru den på
  // via DevTools. Kalt fra reflectAccountUi() (dermed ved oppstart,
  // innlogging og utlogging).
  function updateVoksestedslagAvailability(){
    if (!layersControl || !voksestedslagLayer) return;
    // removeLayer() FØRST, uansett (IKKE removeOverlay() — L.Control.Layers
    // i Leaflet 1.9.4 har ingen slik metode, kun addOverlay()/
    // removeLayer(); verifisert live mot window.L før dette ble skrevet).
    // Gjør funksjonen trygg å kalle flere ganger uten å hope opp duplikate
    // rader i lag-kontrollen (addOverlay() sjekker ikke selv om laget
    // allerede er lagt til).
    layersControl.removeLayer(voksestedslagLayer);
    if (isAdmin()) {
      layersControl.addOverlay(voksestedslagLayer, 'Voksestedslag (fargelag)');
    } else {
      if (leafletMap && leafletMap.hasLayer(voksestedslagLayer)) leafletMap.removeLayer(voksestedslagLayer);
      voksestedslagPanelsVisible(false);
    }
  }

  // ---------- turforslag (rundtur) ----------
  //
  // Idé: i stedet for å måtte lese hundrevis av enkeltpunkter selv, klynger
  // vi de høyest scorende punktene til noen få "soner" (unngår at flere
  // nabo-rutenettpunkter i samme flekk telles som separate stopp), finner et
  // fornuftig startpunkt (helst en ekte parkeringsplass fra OSM), og bygger
  // en rundtur innom flest mulig gode soner innenfor en ønsket lengde. Ruten
  // er en rekkefølge på rette linjer, IKKE snappet til faktiske stier — bruk
  // det topografiske kartlaget til å legge din egen linje mellom stoppene.

  // Poengsetter ett sted for turforslag-formål — bruker beste favoritt i
  // favoritt-modus (samme prinsipp som cardHtmlFavorites), ellers den valgte
  // enkeltarten. Sikrer at "Foreslå tur" faktisk følger favorittene dine når
  // du står i den modusen, i stedet for alltid å bruke selectedSpecies.
  function scoreForRoute(loc){
    if (viewMode === 'favorites' && favoriteSpecies.length) {
      const results = favoriteSpecies
        .map(id => SPECIES.find(s => s.id === id))
        .filter(Boolean)
        .map(sp => ({ species: sp, res: scoreLocation(sp, loc) }))
        .sort((a,b) => b.res.total - a.res.total);
      return results[0];
    }
    const sp = SPECIES.find(s => s.id === selectedSpecies);
    return { species: sp, res: scoreLocation(sp, loc) };
  }

  // Kort tekst om HVORFOR et område er foreslått og hva man bør se etter —
  // aggregerer treslag/fuktighet/berggrunn/helning på tvers av de kjente
  // punktene i området, pluss konkrete mikrotips for den mest relevante
  // arten (beste favoritt, eller valgt art).
  function describeRouteTerrain(members){
    if (!members.length) return '';
    const treslagCount = {}, fuktCount = {};
    let sorSkrenter = 0, rikBerggrunn = 0;
    members.forEach(s => {
      const loc = s.loc;
      (Array.isArray(loc.treslag) ? loc.treslag : [loc.treslag]).forEach(t => { treslagCount[t] = (treslagCount[t]||0) + 1; });
      fuktCount[loc.fuktighet] = (fuktCount[loc.fuktighet]||0) + 1;
      if (loc.himmelretning && ['S','SØ','SV'].includes(loc.himmelretning) && loc.helningGrader >= 3) sorSkrenter++;
      if (loc.berggrunn === 'rik' || loc.berggrunn === 'moderat') rikBerggrunn++;
    });
    const topTreslag = Object.entries(treslagCount).sort((a,b) => b[1]-a[1])[0]?.[0];
    const topFukt = Object.entries(fuktCount).sort((a,b) => b[1]-a[1])[0]?.[0];

    const primarySpecies = viewMode === 'favorites'
      ? SPECIES.find(s => s.id === favoriteSpecies[0])
      : SPECIES.find(s => s.id === selectedSpecies);
    const speciesLabel = viewMode === 'favorites'
      ? (favoriteSpecies.map(id => SPECIES.find(s => s.id === id)?.name).filter(Boolean).join('/') || 'favorittene dine')
      : (primarySpecies ? primarySpecies.name.toLowerCase() : '');

    let text = `Området preges hovedsakelig av ${escapeHtml(TXT.treslag[topTreslag] || topTreslag || 'ukjent')}-dominert skog med ${escapeHtml(TXT.fuktighet[topFukt] || topFukt || 'ukjent')} bunnvegetasjon`;
    if (rikBerggrunn >= Math.ceil(members.length / 2)) text += ', på grunn med moderat til rikt kalkinnhold';
    text += ` — gode forhold for ${escapeHtml(speciesLabel)}.`;
    if (sorSkrenter > 0) {
      text += ` ${sorSkrenter} av ${members.length} kjente punkter i området ligger i sørvendte skråninger — sjekk disse ekstra nøye på varme, tørre dager.`;
    }
    if (primarySpecies) {
      const tips = terrainMicrotips(primarySpecies, members[0].loc).slice(0, 2);
      if (tips.length) text += ` Se etter: ${tips.join(' ')}`;
    }
    return text;
  }

  function clusterIntoZones(scoredPoints, maxZones, minZoneDistanceKm){
    const sorted = [...scoredPoints].sort((a,b) => b.res.total - a.res.total);
    const zones = [];
    for (const p of sorted) {
      if (zones.length >= maxZones) break;
      const tooClose = zones.some(z => haversineKm(z.loc.lat, z.loc.lon, p.loc.lat, p.loc.lon) < minZoneDistanceKm);
      if (!tooClose) zones.push(p);
    }
    return zones;
  }

  // Radius (km) brukt til å samle alle kjente punkter rundt et område-anker
  // (for terreng-beskrivelse og sirkelens utstrekning), OG som minste avstand
  // mellom to ankre i clusterIntoZones — de stiplede sirklene overlapper da
  // ikke for mye i tett-scorede områder.
  //
  // RETTET (bruker meldte at foreslåtte områder var for store til å
  // realistisk dekke grundig til fots — opptil 1400 m radius/~6 km² gjorde
  // det demotiverende å lete): senket fra 1.2 til 0.5 km, se radiusM under
  // for den tilhørende senkingen av selve sirkel-radiusen (maks 600 m nå).
  const AREA_RADIUS_KM = 0.5;

  // Grov terskel for "tynt datagrunnlag" i dekningslinjen over "Foreslå
  // områder" — bevisst rundt tall, ikke ment som noe presist mål, bare nok
  // til å skille "har egentlig ikke data her" fra "har noe å jobbe med".
  const AREA_COVERAGE_THIN_THRESHOLD = 5;

  function clearRoute(){
    suggestedRoute = null;
    if (routeLayer) routeLayer.clearLayers();
    const summary = document.getElementById('sp-route-summary');
    const clearBtn = document.getElementById('sp-route-clear');
    if (summary) summary.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
  }

  // Stiplede sirkler i stedet for punkt-til-punkt-rute (se samtalen
  // 2026-07-11: brukeren ønsket forslag på GODE OMRÅDER/TERRENG, ikke en
  // spesifikk gåtur mellom eksakte koordinater — sirkelen markerer "let et
  // sted her", ikke "gå akkurat denne stien"). Farget etter samme
  // score-skala som kartprikkene ellers. Egen 🅿️-markør per område viser HVOR
  // det er mulig å parkere — RETTET 2026-08-16: hentet nå fra
  // bestParkingForArea() (forhåndshentede per-punkt-felt fra ETL-en, se
  // fetch_area.py v36), ikke lenger et eget live Overpass-oppslag.
  function renderAreasOnMap(){
    if (!routeLayer || !suggestedRoute) return;
    routeLayer.clearLayers();
    const { areas } = suggestedRoute;
    areas.forEach((a, i) => {
      const score = a.anchor.res.total;
      const color = scoreColor(score);
      const parkeringTekst = a.parking
        ? `🅿️ ${escapeHtml(a.parking.notat) || `Nærmeste kjente parkeringsplass, ca ${a.parking.distM} m unna`}`
        : '🅿️ Ingen kjent parkeringsplass blant de kjente punktene i området';
      L.circle([a.anchor.loc.lat, a.anchor.loc.lon], {
        radius: a.radiusM, color, weight: 2.5, dashArray: '8,8', fillColor: color, fillOpacity: 0.07
      }).bindPopup(`<b>Område ${i+1}: ${escapeHtml(a.anchor.loc.name)}</b><br/>Beste score i området: ${score}<br/>${parkeringTekst}<br/>${describeRouteTerrain(a.members)}`, POPUP_OPTS)
        .addTo(routeLayer);

      if (a.parking) {
        L.marker([a.parking.lat, a.parking.lon], {
          icon: L.divIcon({ className: 'sp-parking-icon', html: 'P', iconSize: [22,22] })
        }).bindPopup(`<b>Parkering — Område ${i+1}</b><br/>${escapeHtml(a.parking.notat) || 'Ingen ytterligere detaljer.'}`, POPUP_OPTS)
          .addTo(routeLayer);
      }
    });
    if (areas.length) leafletMap.fitBounds(L.featureGroup(routeLayer.getLayers()).getBounds().pad(0.15));
  }

  // RETTET 2026-08-16: erstattet et HELT SEPARAT, LIVE Overpass-oppslag per
  // foreslått område (fjernet under, se git-historikk) med de allerede
  // FORHÅNDSHENTEDE per-punkt-feltene (avstandParkeringM/parkeringLat/
  // parkeringLon/parkeringNotat, se fetch_area.py v36). Bruker fant en reell
  // inkonsistens: et enkeltpunkts EGET kort viste "212 m til parkering",
  // mens akkurat samme punkts OMRÅDE-sirkel viste "ingen kjent parkering
  // funnet" — fordi de to stedene i koden brukte to helt forskjellige
  // datakilder. Det gamle live-søket var sentrert på OMRÅDETS ANKER-punkt
  // (best scorende medlem), ikke nødvendigvis samme punkt som faktisk hadde
  // kjent parkering nær seg — og kunne i tillegg feile/time ut uavhengig av
  // om ETL-en allerede hadde funnet parkering for et av medlemmene. Før v36
  // fantes det ingen lagret KOORDINAT for parkeringsplassen i det hele tatt
  // (kun avstand+tekst), så et live-oppslag var den gang eneste måte å få et
  // faktisk kartpunkt — det er ikke lenger tilfellet, og denne varianten er
  // dessuten synkron/lokal (ingen nettverkskall, ingen "søker etter
  // parkering …"-ventetid, ingen egen feilklasse å håndtere).
  function bestParkingForArea(members){
    let best = null;
    for (const m of members) {
      const loc = m.loc;
      if (loc.avstandParkeringM == null || loc.parkeringLat == null || loc.parkeringLon == null) continue;
      if (!best || loc.avstandParkeringM < best.distM) {
        best = { lat: loc.parkeringLat, lon: loc.parkeringLon, distM: loc.avstandParkeringM, notat: loc.parkeringNotat };
      }
    }
    return best;
  }

  async function suggestAreas(){
    if (!personalFeaturesEnabled()) {
      alert('Logg inn under ⚙ Preferanser & Config → Konto for å foreslå områder.');
      return;
    }
    const summary = document.getElementById('sp-route-summary');
    summary.style.display = '';
    summary.textContent = 'Beregner forslag …';
    document.getElementById('sp-route-clear').style.display = 'none';

    if (viewMode === 'favorites' && !favoriteSpecies.length) {
      summary.textContent = 'Ingen favoritter valgt — merk minst én art med ★, eller bytt til enkeltart-modus.';
      return;
    }

    const scoredAll = allLocations().map(loc => {
      const r = scoreForRoute(loc);
      return { loc, res: r.res };
    });
    // isInCurrentScope (se viewportImpliesScope()-kommentaren der) — siden
    // v0.28.2 faller dette allerede tilbake til kartets synlige utsnitt når
    // brukeren har zoomet inn nok uten et eksplisitt fylke/kommune/radius-
    // filter, i stedet for alltid å søke i hele Norge. Samme funksjon som
    // resultatlisten/kartmarkørene bruker, så de kan ikke lenger uenes om
    // hva som er "i scope".
    const scoped = scoredAll.filter(s => !s.res.isCut && isInCurrentScope(s.loc));

    if (!scoped.length) {
      // viewportImpliesScope() alene (ikke bare "ingen areaLabel") — i det
      // tilfellet er "zoom ut" et reelt neste steg, ikke bare "hent mer
      // data".
      const zoomHint = viewportImpliesScope()
        ? ' Prøv å zoome ut i kartet, eller velg et fylke/kommune/radius.'
        : '';
      summary.innerHTML = 'Ingen steder å foreslå områder fra i valgt område.' + zoomHint + fetchNudgeHtml(0);
      wireFetchNudgeLink();
      return;
    }

    // Et punkt med befolkning==='hoy' (tett bebyggelse like ved, se
    // classify_befolkning i fetch_area.py) kan ALDRI bli sentrum i et
    // foreslått område — uansett hvor bra det scorer på treslag/fuktighet/
    // adkomst for øvrig (god adkomst og nærhet til folk er ofte nettopp
    // samme underliggende egenskap, se scoreLocation()'s roScore/adkomstScore,
    // så "hoy" befolkning alene holder ikke alltid score-summen nede nok til
    // å luke ut slike punkter naturlig). Se samtalen 2026-08-11 om skogpunkt
    // 268 i Lørenskog — under halvparten av den foreslåtte sirkelen var
    // faktisk skog. Punktet kan fortsatt inngå som MEDLEM av en sirkel
    // sentrert på et annet, roligere anker (se `members` under) — det er kun
    // selve senteret/ankeret dette ekskluderer.
    const anchorCandidates = scoped.filter(s => s.loc.befolkning !== 'hoy');

    // Velger inntil `areaCount` distinkte, topp-scorende anker-punkter, minst
    // AREA_RADIUS_KM fra hverandre. Grupperer deretter ALLE scorede punkter
    // (inkl. evt. hoy-befolkning-punkter) rundt sitt nærmeste anker for å
    // bestemme sirkelens utstrekning og terreng-beskrivelsen (se
    // describeRouteTerrain).
    const anchors = clusterIntoZones(anchorCandidates, areaCount, AREA_RADIUS_KM);
    if (!anchors.length) {
      summary.textContent = 'Fant ingen gode områder i valgt filter — de best scorende punktene ligger alle tett på bebyggelse (høy befolkningstetthet).';
      return;
    }

    const areas = anchors.map(anchor => {
      const members = scoped.filter(s => haversineKm(anchor.loc.lat, anchor.loc.lon, s.loc.lat, s.loc.lon) <= AREA_RADIUS_KM);
      const spreadM = Math.max(0, ...members.map(m => haversineKm(anchor.loc.lat, anchor.loc.lon, m.loc.lat, m.loc.lon) * 1000));
      const radiusM = Math.min(600, Math.max(400, spreadM + 100)); // liten margin utenfor ytterste kjente punkt — se AREA_RADIUS_KM for begrunnelse
      return { anchor, members, radiusM };
    });

    // Synkront/lokalt siden RETTET 2026-08-16 — se bestParkingForArea().
    areas.forEach(a => { a.parking = bestParkingForArea(a.members); });

    suggestedRoute = { areas };
    renderAreasOnMap();

    const overskrift = areas.length === 1 ? '<b>1 godt område</b> foreslått' : `<b>${areas.length} gode områder</b> foreslått`;
    summary.innerHTML = `
      ${overskrift} i valgt område (stiplede sirkler i kartet, farget etter score — klikk en sirkel eller 🅿️-markøren for detaljer).<br/>
      ${areas.map((a, i) => `<div class="sp-route-area-item">Område ${i+1}: <b>${escapeHtml(a.anchor.loc.name)}</b> (${escapeHtml(a.anchor.loc.kommune || 'ukjent kommune')}) — beste score ${a.anchor.res.total}, ${a.members.length} kjent${a.members.length===1?'':'e'} punkt${a.members.length===1?'':'er'} i området. ${a.parking ? `🅿️ ca ${a.parking.distM} m unna.` : '🅿️ ingen kjent parkering funnet.'}</div>`).join('')}
      <span style="font-size:var(--fs-xs);opacity:0.8;">Sirklene markerer OMRÅDER med gode odds, ikke eksakte punkter eller en gåtur mellom dem — bruk det topografiske kartlaget til å utforske selv innenfor sirkelen. Parkeringsmarkører er hentet fra kartdata og kan avvike fra virkeligheten — bekreft alltid på stedet.</span>
      ${fetchNudgeHtml(scoped.length)}
    `;
    wireFetchNudgeLink();
    document.getElementById('sp-route-clear').style.display = '';
  }

  // Oppfordring om å hente mer terrengdata, vist i resultat-sammendraget når
  // "Foreslå områder" endte opp med tynt datagrunnlag — svarer på samme
  // spørsmål som dekningslinjen over knappen (se updateCoverageLine), bare
  // ETTER at brukeren faktisk har prøvd, i stedet for i forkant. Vises kun
  // hvis hent-panelet faktisk er tilgjengelig (ikke skjult pga. et allerede
  // registrert treff for nøyaktig dette området).
  function fetchNudgeHtml(count){
    if (count >= AREA_COVERAGE_THIN_THRESHOLD) return '';
    const fetchPanel = document.getElementById('sp-fetch-panel');
    if (!fetchPanel || fetchPanel.style.display === 'none') return '';
    return `<div class="sp-route-nudge" style="margin-top:8px;font-size:var(--fs-sm);color:var(--ink-soft);">Tynt datagrunnlag her (${count} punkt${count===1?'':'er'}) — <a href="#sp-fetch-panel" id="sp-route-nudge-link">hent mer terrengdata</a> for bedre forslag.</div>`;
  }
  function wireFetchNudgeLink(){
    const link = document.getElementById('sp-route-nudge-link');
    if (link) link.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('sp-fetch-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }

  // ---------- render ----------
  function renderSpeciesList(){
    const el = document.getElementById('sp-species-list');
    el.innerHTML = SPECIES.map(s => {
      const isFav = favoriteSpecies.includes(s.id);
      return `<button class="sp-species-btn ${s.id===selectedSpecies && viewMode==='single'?'active':''}" data-id="${s.id}">
        <span>${s.name}<span class="sp-latin">${s.latin}</span></span>
        <span class="sp-fav-star ${isFav?'active':''}" data-fav="${s.id}" title="${isFav?'Fjern fra favoritter':'Merk som favoritt'}">★</span>
      </button>`;
    }).join('');
    el.querySelectorAll('.sp-species-btn').forEach(btn => btn.addEventListener('click', (e) => {
      if (e.target.closest('.sp-fav-star')) return; // håndteres separat under
      selectedSpecies = btn.dataset.id; viewMode = 'single'; clearRoute(); render();
    }));
    el.querySelectorAll('.sp-fav-star').forEach(star => star.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = star.dataset.fav;
      if (favoriteSpecies.includes(id)) favoriteSpecies = favoriteSpecies.filter(x => x !== id);
      else favoriteSpecies.push(id);
      await saveFavorites();
      render();
    }));
  }

  function renderFilterControls(){
    document.querySelectorAll('#sp-mode-seg button').forEach(b => b.classList.toggle('active', b.dataset.mode === filterMode));
    document.getElementById('sp-fylke-filter').style.display = filterMode === 'fylke' ? '' : 'none';
    document.getElementById('sp-kommune-input-wrap').style.display = filterMode === 'kommune' ? 'flex' : 'none';
    document.getElementById('sp-radius-controls').style.display = filterMode === 'radius' ? 'flex' : 'none';
    document.getElementById('sp-radius-label').textContent = radiusKm + ' km';
    document.getElementById('sp-radius-slider').value = radiusKm;

    const fEl = document.getElementById('sp-fylke-filter');
    fEl.innerHTML = `<option value="alle">Alle fylker</option>` + fylkeList().map(f => `<option value="${escapeHtml(f)}" ${f===fylkeFilter?'selected':''}>${escapeHtml(f)}</option>`).join('');
    fEl.value = fylkeFilter;

    const kInput = document.getElementById('sp-kommune-filter-input');
    if (document.activeElement !== kInput) kInput.value = kommuneFilter === 'alle' ? '' : kommuneFilter;

    const narrowEl = document.getElementById('sp-kommune-narrow-fylke');
    if (document.activeElement !== narrowEl) {
      narrowEl.innerHTML = `<option value="alle">Alle fylker</option>` + FYLKER_STATISK.map(f => `<option value="${escapeHtml(f)}" ${f===kommuneNarrowFylke?'selected':''}>${escapeHtml(f)}</option>`).join('');
      narrowEl.value = kommuneNarrowFylke;
    }
    const kommuner = kommuneNarrowFylke === 'alle' ? alleKommunerAlfabetisk() : kommunerIFylke(kommuneNarrowFylke);
    document.getElementById('sp-kommune-datalist').innerHTML = kommuner.map(k => `<option value="${escapeHtml(k)}">`).join('');
    updateKommuneAmbiguousHint();
  }

  // Synlig varsel når det VALGTE kommunenavnet finnes i flere fylker og
  // ikke er disambiguert ennå (se resolveKommuneNavn()) — løser at brukeren
  // "ikke ser forskjell på kommuner av samme navn": <datalist> kan ikke vise
  // to identiske forslag ulikt (nettleseren viser kun ett av dem uansett,
  // siden begge har value="Våler"), så dette varselet + "Snevre inn til ett
  // fylke"-menyen er den faktiske løsningen, ikke forslagslisten selv.
  function updateKommuneAmbiguousHint(){
    const hint = document.getElementById('sp-kommune-ambiguous-hint');
    if (!hint) return;
    if (filterMode !== 'kommune' || !kommuneFilter || kommuneFilter === 'alle') { hint.style.display = 'none'; return; }
    const treff = kommunerMedNavn(kommuneFilter);
    if (treff.length <= 1 || resolveKommuneNavn(kommuneFilter) !== null) { hint.style.display = 'none'; return; }
    const fylker = treff.map(t => t.fylkesnavn).join(' og ');
    hint.textContent = `⚠ "${kommuneFilter}" finnes i flere fylker (${fylker}) — velg riktig fylke i menyen til venstre for å vise/analysere riktig kommune.`;
    hint.style.display = '';
  }

  function gaugeSvg(score){
    const r = 26, c = 2*Math.PI*r, pct = score/100;
    const color = scoreColor(score);
    return `<svg width="66" height="66" viewBox="0 0 66 66">
      <circle cx="33" cy="33" r="${r}" fill="none" stroke="rgba(38,48,31,0.12)" stroke-width="6"/>
      <circle cx="33" cy="33" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}" stroke-linecap="round" transform="rotate(-90 33 33)"/>
      <text x="33" y="37" text-anchor="middle" font-family="Fraunces, serif" font-weight="600" font-size="17" fill="#232D1D">${score}</text>
    </svg>`;
  }

  // Lenke til selve parkeringsplassen — RETTET 2026-08-15: parkeringsnotatet
  // skrev tidligere bare "(OSM)" som kildeangivelse, uten noe å klikke på;
  // brukeren påpekte at "OSM" er en forkortelse ingen sluttbrukere vet hva
  // betyr. Foretrekker en direkte lenke til selve OSM-elementet
  // (osm.org/{type}/{id}, viser hele det kartlagte området/alle tags — se
  // parkeringOsmType/parkeringOsmId i fetch_area.py) fremfor en generisk
  // kart-markør (?mlat=&mlon=) når vi har element-ID-en; faller tilbake til
  // markør-varianten for steder hentet før 2026-08-15 (som har lat/lon, men
  // ikke osmType/osmId). Returnerer null når det ikke finnes noen kjent
  // parkeringsplass i det hele tatt (avstand_m var null → ingen koordinater).
  function parkeringKartUrl(loc){
    if (loc.parkeringOsmType && loc.parkeringOsmId != null) {
      return `https://www.openstreetmap.org/${loc.parkeringOsmType}/${loc.parkeringOsmId}`;
    }
    if (loc.parkeringLat != null && loc.parkeringLon != null) {
      return `https://www.openstreetmap.org/?mlat=${loc.parkeringLat}&mlon=${loc.parkeringLon}#map=18/${loc.parkeringLat}/${loc.parkeringLon}`;
    }
    return null;
  }

  // ---------- "Hvorfor her?"-kort ----------
  //
  // Del 1.4 i "Voksestedslaget"-planen (fig. 3): ren UI-eksponering av felt
  // scoreLocation() allerede har lest inn/beregnet et stykke på veien —
  // attrScore()-matchene for treslag/fuktighet/berggrunn/skogalder,
  // sesong, høyde, sørvendt skråning, og kjenteFunnDetaljer. Prosentene
  // under styrer KUN stolpelengden i UI-en; de er ikke koblet til
  // scoreLocation()s faktiske vektbudsjett og påvirker ikke selve scoren.
  //
  // RETTET 2026-08-18 (bruker påpekte at kortet fremhevet feil ting — vei-
  // avstand og befolkningsnærhet er ADKOMST/RO, ikke noe soppen faktisk
  // bryr seg om, mens fuktighet og berggrunn — hhv. NEST tyngst og tredje
  // tyngst i selve vektbudsjettet (15 og 10 poeng, se kommentaren over
  // scoreLocation()) — manglet fra kortet HELT. Byttet ut med de faktiske
  // vekstvilkårene i budsjettrekkefølge: treslag, fuktighet, berggrunn,
  // skogalder, sesong, og (kun når arten faktisk har en definert
  // preferanse) høyde/sørvendt skråning. Avstand til vei og
  // befolkningsnærhet er IKKE fjernet fra appen — begge vises fortsatt
  // tydelig lenger ned på kortet (sp-access-box og sp-tags), bare ikke
  // lenger under overskriften "hvorfor her" der de ga inntrykk av å være
  // vekstforklarende. Kjente funn beholdt sist — ikke et vekstvilkår i
  // seg selv, men reell observasjonsevidens, verdt å vise etter terrenget.
  // RETTET 2026-08-18 (bruker påpekte at stolper er et rart valg for
  // binære/kategoriske verdier — en stolpelengde signaliserer konvensjonelt
  // en gradert størrelse, mens f.eks. Treslag bare er treff/ikke treff/
  // ukjent, ingen mellomting en 85%-vs-25%-lengde faktisk representerer).
  // Faktorer med et diskret, ordnet antall tilstander (2 eller 3) bruker nå
  // `state` og rendres som et lite ikon+farge-merke i stedet for en stolpe.
  // Kun Kjente funn beholder `pct`/stolpe — det er det ene feltet som
  // faktisk ER en kontinuerlig, gradert måling (antall funn).
  function whyHereFactors(species, loc){
    const t = locTexts(loc);
    const factors = [];

    // ok===true/false/null (ukjent) fra attrScore() → god/dårlig/ukjent.
    // Samme to-tilstands-vurdering for alle fire — bevisst IKKE gradert
    // etter maxPoints (20 vs 10 osv.), siden dette kortet viser MATCH, ikke
    // selve poengvekten (den er allerede synlig indirekte via rekkefølgen).
    function attrFactor(label, valueText, r){
      factors.push({ label, valueText, state: r.ok === null ? 'unknown' : (r.ok ? 'good' : 'bad') });
    }

    attrFactor('Treslag', t.treslagTekst, attrScore(loc.treslag, species.treslag, 20));
    attrFactor('Fuktighet', `${t.fuktighetTekst} mark${loc.fuktighetIndex!=null ? ' (målt)' : ''}`, attrScore(loc.fuktighet, species.fuktighet, 15));
    attrFactor('Berggrunn', t.berggrunnTekst, attrScore(loc.berggrunn, species.berggrunn, 10));
    attrFactor('Skogalder', t.alderTekst, attrScore(loc.skogalder, species.skogalder, 10));

    const inSeason = monthNow >= species.season[0] && monthNow <= species.season[1];
    factors.push({ label: 'Sesong', valueText: inSeason ? 'i sesong nå' : 'utenfor typisk sesong', state: inSeason ? 'good' : 'bad' });

    // Kun vist når arten faktisk har en tallfestet høydepreferanse (se
    // elevationScore()) — de fleste arter mangler denne bevisst (for dårlig
    // dokumentert høydespenn til å tallfeste), og da sier et merke ingenting.
    // Tre ordnede tilstander (ideell/innenfor/for høyt), derfor 'mid' i tillegg
    // til good/bad.
    if (species.hoydeMoh && loc.hoydeMoh != null) {
      const { ideal, max } = species.hoydeMoh;
      const state = loc.hoydeMoh <= ideal ? 'good' : loc.hoydeMoh <= max ? 'mid' : 'bad';
      factors.push({ label: 'Høyde over havet', valueText: `${Math.round(loc.hoydeMoh)} moh`, state });
    }

    // Kun relevant for varmekrevende arter (samme WARMTH_LOVING_SPECIES-sett
    // som scoreLocation() bruker for +4-bonusen) — for andre arter er
    // himmelretning ikke noe scoren bryr seg om, så et merke ville vært støy.
    if (WARMTH_LOVING_SPECIES.has(species.id) && loc.himmelretning && loc.helningGrader != null) {
      const sorvendt = ['S','SØ','SV'].includes(loc.himmelretning);
      const passeHelning = loc.helningGrader >= 3 && loc.helningGrader <= 25;
      factors.push({ label: 'Sørvendt skråning', valueText: `${loc.helningGrader}°, ${loc.himmelretning}-vendt`, state: (sorvendt && passeHelning) ? 'good' : 'bad' });
    }

    // Samme 500 m-terskel som scoreLocation()s tetthetsbonus nå bruker (se
    // RETTET 2026-08-18 der) — bevisst IKKE ETL-ens videre 1,5 km-
    // koblingsradius, som er et urealistisk stort "søkeområde" å vise fram
    // som "kjent funnsted". Eneste faktor som beholder pct/stolpe — dette
    // er en reell kontinuerlig telling, ikke en tilstand.
    const funn = (loc.kjenteFunnDetaljer || []).filter(f => f.art === species.id && f.avstandM < 500);
    const pctFunn = funn.length === 0 ? 12 : Math.min(90, 30 + funn.length * 15);
    factors.push({ label: 'Kjente funn < 500 m', valueText: funn.length ? `${funn.length} stk` : 'ingen kjente', pct: pctFunn });

    return factors;
  }

  const WHY_STATE_ICON = { good: '✓', mid: '~', bad: '✗', unknown: '?' };

  function matchTier(score){
    if (score >= 75) return { cls: 'high', label: 'Meget god match' };
    if (score >= 55) return { cls: 'good', label: 'God match' };
    if (score >= 35) return { cls: 'mid', label: 'Middels match' };
    return { cls: 'low', label: 'Svak match' };
  }

  function whyHereHtml(species, loc, res){
    const tier = matchTier(res.total);
    const factors = whyHereFactors(species, loc);
    return `
      <div class="sp-why-here">
        <div class="sp-why-here-head">
          <span class="sp-why-here-label">Hvorfor her?</span>
          <span class="sp-why-badge sp-why-badge-${tier.cls}">${tier.label}</span>
        </div>
        ${factors.map(f => f.state ? `
          <div class="sp-why-factor sp-why-factor-state">
            <span class="sp-why-state-icon sp-why-state-${f.state}" aria-hidden="true">${WHY_STATE_ICON[f.state]}</span>
            <span class="sp-why-factor-label">${escapeHtml(f.label)}</span>
            <span class="sp-why-factor-value">${escapeHtml(f.valueText)}</span>
          </div>` : `
          <div class="sp-why-factor">
            <div class="sp-why-factor-row"><span>${escapeHtml(f.label)}</span><span>${escapeHtml(f.valueText)}</span></div>
            <div class="sp-why-factor-track"><div class="sp-why-factor-fill" style="width:${f.pct}%"></div></div>
          </div>`).join('')}
      </div>`;
  }

  function cardHtml(loc, res){
    const t = locTexts(loc);
    const finds = findsFor(loc.id);
    const w = res.weather;
    const parkWarn = res.accessTags.some(tg => tg.cls === 'warn' && tg.text.includes('parkering'));
    return `
      <div class="sp-card ${res.isCut ? 'sp-excluded' : ''}" data-loc="${loc.id}">
        <div class="sp-card-top">
          <div>
            <div class="sp-card-name">${escapeHtml(loc.name)}</div>
            <div class="sp-card-kommune">${escapeHtml(loc.kommune)}, ${escapeHtml(loc.fylke)} · ${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}</div>
          </div>
          <div class="sp-gauge-wrap" data-score-loc="${loc.id}" data-score-species="${species_for_card().id}" title="Klikk for å se score-beregningen">${gaugeSvg(res.total)}<div class="sp-gauge-label">score</div><div class="sp-gauge-basis ${res.hasEvidence ? 'evidence' : 'terrain'}">${res.hasEvidence ? '✓ kjent funnsted' : '🔍 terrengbasert'}</div></div>
        </div>
        <div class="sp-tags">
          ${loc.custom ? `<span class="sp-tag custom">eget sted</span>` : ''}
          ${loc.kilde==='auto-etl' ? `<span class="sp-tag good">auto-hentet</span>` : ''}
          <span class="sp-tag">${t.treslagTekst}</span>
          <span class="sp-tag">${t.fuktighetTekst} mark${loc.fuktighetIndex!=null ? ' (målt)' : ''}</span>
          <span class="sp-tag">${t.berggrunnTekst}</span>
          <span class="sp-tag">${t.alderTekst} skog</span>
          ${loc.helningGrader!=null ? `<span class="sp-tag">${loc.helningGrader}° helning${loc.himmelretning ? ', ' + loc.himmelretning + '-vendt' : ''}</span>` : ''}
          ${loc.hoydeMoh!=null ? `<span class="sp-tag">${Math.round(loc.hoydeMoh)} moh</span>` : ''}
          <span class="sp-tag ${loc.befolkning==='lav'?'good':loc.befolkning==='hoy'?'warn':''}">${loc.befolkning==='lav'?'rolig, lite folk':loc.befolkning==='hoy'?'mye ferdsel':loc.befolkning==='ukjent'||!loc.befolkning?'folketetthet ukjent':'moderat ferdsel'}</span>
          ${res.accessTags.map(tg => `<span class="sp-tag ${tg.cls}">${tg.text}</span>`).join('')}
          ${loc.hogstAr ? `<span class="sp-tag warn">flatehogd ${loc.hogstAr}</span>` : ''}
          ${userCuts.includes(loc.id) ? `<span class="sp-tag warn">egen merking: hogd</span>` : ''}
          ${res.isCut ? `<span class="sp-tag warn">ekskludert fra anbefaling</span>` : ''}
        </div>
        ${whyHereHtml(species_for_card(), loc, res)}
        <div class="sp-access-box">
          <div>🚗 <b>Parkering:</b> ${escapeHtml(loc.parkeringNotat) || 'ikke oppgitt'}${parkWarn ? ' <span class="sp-access-warn">— bekreft selv at det ikke er privat grunn</span>' : ''}${parkeringKartUrl(loc) ? ` <a href="${parkeringKartUrl(loc)}" target="_blank" rel="noopener">Vis på kart →</a>` : ''}</div>
          <div>🥾 <b>Sti/skogsbilvei i terrenget:</b> ${loc.stier==='ja'?'ja':loc.stier==='nei'?'nei, ingen kjent sti':'ukjent'}${loc.avstandStiM != null ? ` (${loc.avstandStiM} m)` : ''}${loc.avstandParkeringM ? ` · ca ${loc.avstandParkeringM} m å gå fra parkering` : ''}</div>
        </div>
        ${res.histNote ? `<div class="sp-hist-note">★ ${res.histNote}</div>` : ''}
        ${knownFindsHtml(loc, species_for_card().id)}
        <div class="sp-explain">${species_for_card().why(loc, t)}</div>
        <div class="sp-microtips-label">Sjekk spesielt i terrenget her</div>
        <ul class="sp-microtips">${terrainMicrotips(species_for_card(), loc).map(tip => `<li>${tip}</li>`).join('')}</ul>
        ${crossSpeciesTipsHtml(loc, species_for_card().id)}
        ${w ? `<div class="sp-breakdown">Vær nå: <span>${w.precip14} mm</span> nedbør siste 14 dager, snitt temp <span>${w.tempAvg ?? '–'}°C</span>. ${res.weatherVerdict || ''}</div>` : ''}
        ${finds.length ? `<div class="sp-findlist">${finds.map(f => `<div class="sp-find-row"><span>${escapeHtml(SPECIES.find(s=>s.id===f.speciesId)?.name || f.speciesId)} — ${escapeHtml(f.date)}</span><span class="sp-dots">${[1,2,3,4,5].map(n=>`<span class="${n<=f.mengde?'filled':''}"></span>`).join('')}</span></div>`).join('')}</div>` : ''}
        <div class="sp-card-actions">
          ${personalFeaturesEnabled() ? `<button class="sp-btn sp-primary" data-action="find" data-loc="${loc.id}">Registrer funn her</button>` : ''}
          <button class="sp-btn" data-action="locate" data-loc="${loc.id}">📍 Vis i kart</button>
          ${personalFeaturesEnabled() ? `<button class="sp-btn sp-ghost-danger" data-action="cut" data-loc="${loc.id}">${userCuts.includes(loc.id)?'Fjern hogst-merking':'Merk som flatehogd'}</button>` : ''}
        </div>
      </div>`;
  }

  // Kort for "Mine favoritter"-modus: viser score for HVER favoritt (ikke
  // bare én), og bruker den best-scorende favoritten som "primærart" for
  // forklaringstekst/mikrotips — resten av kortet gjenbruker samme data som
  // det vanlige kortet, bare hentet fra beste favoritt i stedet for
  // selectedSpecies.
  function cardHtmlFavorites(loc, favResults){
    const t = locTexts(loc);
    const finds = findsFor(loc.id);
    const top = favResults[0];
    const topSpecies = top.species, res = top.res;
    const w = res.weather;
    const parkWarn = res.accessTags.some(tg => tg.cls === 'warn' && tg.text.includes('parkering'));
    return `
      <div class="sp-card ${res.isCut ? 'sp-excluded' : ''}" data-loc="${loc.id}">
        <div class="sp-card-top">
          <div>
            <div class="sp-card-name">${escapeHtml(loc.name)}</div>
            <div class="sp-card-kommune">${escapeHtml(loc.kommune)}, ${escapeHtml(loc.fylke)} · ${loc.lat.toFixed(3)}, ${loc.lon.toFixed(3)}</div>
          </div>
        </div>
        <div class="sp-fav-scorelist">
          ${favResults.map(r => `<span class="sp-fav-score-chip ${r.res.isCut?'cut':''}" data-score-loc="${loc.id}" data-score-species="${r.species.id}" title="${r.res.hasEvidence ? 'Kjent funnsted' : 'Terrengbasert (ingen kjent funnhistorikk)'} — klikk for å se score-beregningen">${r.res.hasEvidence ? '✓ ' : ''}${escapeHtml(r.species.name)} <b>${r.res.total}</b></span>`).join('')}
        </div>
        <div class="sp-tags">
          ${loc.custom ? `<span class="sp-tag custom">eget sted</span>` : ''}
          ${loc.kilde==='auto-etl' ? `<span class="sp-tag good">auto-hentet</span>` : ''}
          <span class="sp-tag">${t.treslagTekst}</span>
          <span class="sp-tag">${t.fuktighetTekst} mark${loc.fuktighetIndex!=null ? ' (målt)' : ''}</span>
          <span class="sp-tag">${t.berggrunnTekst}</span>
          <span class="sp-tag">${t.alderTekst} skog</span>
          ${loc.helningGrader!=null ? `<span class="sp-tag">${loc.helningGrader}° helning${loc.himmelretning ? ', ' + loc.himmelretning + '-vendt' : ''}</span>` : ''}
          ${loc.hoydeMoh!=null ? `<span class="sp-tag">${Math.round(loc.hoydeMoh)} moh</span>` : ''}
          ${res.accessTags.map(tg => `<span class="sp-tag ${tg.cls}">${tg.text}</span>`).join('')}
          ${loc.hogstAr ? `<span class="sp-tag warn">flatehogd ${loc.hogstAr}</span>` : ''}
          ${res.isCut ? `<span class="sp-tag warn">ekskludert fra anbefaling</span>` : ''}
        </div>
        ${whyHereHtml(topSpecies, loc, res)}
        <div class="sp-access-box">
          <div>🚗 <b>Parkering:</b> ${escapeHtml(loc.parkeringNotat) || 'ikke oppgitt'}${parkWarn ? ' <span class="sp-access-warn">— bekreft selv at det ikke er privat grunn</span>' : ''}${parkeringKartUrl(loc) ? ` <a href="${parkeringKartUrl(loc)}" target="_blank" rel="noopener">Vis på kart →</a>` : ''}</div>
          <div>🥾 <b>Sti/skogsbilvei i terrenget:</b> ${loc.stier==='ja'?'ja':loc.stier==='nei'?'nei, ingen kjent sti':'ukjent'}${loc.avstandStiM != null ? ` (${loc.avstandStiM} m)` : ''}${loc.avstandParkeringM ? ` · ca ${loc.avstandParkeringM} m å gå fra parkering` : ''}</div>
        </div>
        ${res.histNote ? `<div class="sp-hist-note">★ ${res.histNote}</div>` : ''}
        ${knownFindsHtml(loc, topSpecies.id)}
        <div class="sp-explain"><b>${escapeHtml(topSpecies.name)}:</b> ${topSpecies.why(loc, t)}</div>
        <div class="sp-microtips-label">Sjekk spesielt i terrenget her (for ${escapeHtml(topSpecies.name)})</div>
        <ul class="sp-microtips">${terrainMicrotips(topSpecies, loc).map(tip => `<li>${tip}</li>`).join('')}</ul>
        ${crossSpeciesTipsHtml(loc, topSpecies.id, { hideFavorites: true })}
        ${w ? `<div class="sp-breakdown">Vær nå: <span>${w.precip14} mm</span> nedbør siste 14 dager, snitt temp <span>${w.tempAvg ?? '–'}°C</span>. ${res.weatherVerdict || ''}</div>` : ''}
        ${finds.length ? `<div class="sp-findlist">${finds.map(f => `<div class="sp-find-row"><span>${escapeHtml(SPECIES.find(s=>s.id===f.speciesId)?.name || f.speciesId)} — ${escapeHtml(f.date)}</span><span class="sp-dots">${[1,2,3,4,5].map(n=>`<span class="${n<=f.mengde?'filled':''}"></span>`).join('')}</span></div>`).join('')}</div>` : ''}
        <div class="sp-card-actions">
          ${personalFeaturesEnabled() ? `<button class="sp-btn sp-primary" data-action="find" data-loc="${loc.id}">Registrer funn her</button>` : ''}
          <button class="sp-btn" data-action="locate" data-loc="${loc.id}">📍 Vis i kart</button>
          ${personalFeaturesEnabled() ? `<button class="sp-btn sp-ghost-danger" data-action="cut" data-loc="${loc.id}">${userCuts.includes(loc.id)?'Fjern hogst-merking':'Merk som flatehogd'}</button>` : ''}
        </div>
      </div>`;
  }

  let _currentSpecies = null;
  function species_for_card(){ return _currentSpecies; }

  // RETTET 2026-08-13 (bruker ba om at "Om dataene"-teksten viser HVILKE
  // kommuner som faktisk har god dekning, i stedet for en generisk "hentes
  // on-demand"-formulering — misvisende for en vanlig bruker, som ikke selv
  // kan trigge nye hentinger, kun admin kan det, se requireAdmin i
  // worker/api/src/routes/omrader.js). Listen er bevisst IKKE hardkodet i
  // HTML-en — datasettet vokser etter hvert som admin analyserer flere
  // kommuner (se D1-MIGRASJON.md), og en statisk liste ville blitt stille
  // utdatert. Beregnes i stedet her, fra samme terreng_steder-datasett som
  // allerede er lastet inn for ENHVER innlogget bruker (admin ELLER
  // bruker, se hentTerrengdata() — i motsetning til /omrader/dekning, som
  // er admin-only server-side og derfor IKKE kunne brukes som kilde her).
  //
  // Teller kun BASE_LOCATIONS (server-hentet grid-data), ikke
  // customLocations (egne, manuelt lagt-til steder) — en bruker med mange
  // personlige steder i en kommune admin aldri har analysert skal ikke
  // gjøre den kommunen se "godt analysert" ut.
  // RETTET 2026-08-13: hevet 20 → 100 (bruker meldte at 20 var for lavt —
  // admin velger gjennomgående minste gridstørrelse ved analyse, som gir
  // langt tettere punktdekning per kommune enn 20 antydet).
  const KOMMUNE_GOD_DEKNING_MIN = 100; // terskel for "godt analysert" — justerbar, ingen fasit finnes ennå
  function renderDataNotice(){
    const el = document.getElementById('sp-analyserte-kommuner');
    if (!el) return;
    if (!currentUser) { el.textContent = 'logg inn for å se full oversikt'; return; }
    // Kun beregnet på nytt når HELE datasettet faktisk er lastet (uendret
    // filter) — ellers gjenbrukes forrige nasjonale snapshot uendret (se
    // analyserteKommunerCache sin deklarasjon).
    if (filterMode === 'fylke' && fylkeFilter === 'alle') {
      const counts = {};
      for (const loc of BASE_LOCATIONS) {
        if (!loc.kommune) continue;
        counts[loc.kommune] = (counts[loc.kommune] || 0) + 1;
      }
      analyserteKommunerCache = Object.keys(counts)
        .filter(k => counts[k] >= KOMMUNE_GOD_DEKNING_MIN)
        .sort((a, b) => a.localeCompare(b, 'no'));
    }
    if (analyserteKommunerCache === null) { el.textContent = 'henter oversikt …'; return; }
    if (!analyserteKommunerCache.length) { el.textContent = 'ingen ennå'; return; }
    el.textContent = analyserteKommunerCache.length === 1
      ? analyserteKommunerCache[0]
      : analyserteKommunerCache.slice(0, -1).join(', ') + ' og ' + analyserteKommunerCache[analyserteKommunerCache.length - 1];
  }

  function render(){
    maybeRefreshWeatherForScope();
    // RETTET 2026-08-15 (UX-gjennomgang): bruker meldte å ha opplevd å bare
    // se 1-2 demo-steder i listen (standalone/PWA, ikke innlogget) uten at
    // noe forklarte hvorfor. !currentUser er en pålitelig proxy for "viser
    // demodata" i denne appen — loadLocations() bailer tidlig og beholder
    // BASE_LOCATIONS-demofallbacken øverst i filen når ingen er innlogget,
    // det er eneste grunn til å se demodata i det hele tatt. Plassert HELT
    // først i render() (før eventuelle tidlige return i selve
    // resultatlisten under) slik at varselet alltid vises/skjules korrekt
    // uavhengig av hvilken gren resten av funksjonen tar.
    const demoBanner = document.getElementById('sp-demo-banner');
    if (demoBanner) {
      if (!currentUser) {
        const n = allLocations().length;
        demoBanner.style.display = '';
        demoBanner.innerHTML = `👋 Du ser <b>${n} demo-steder</b> — ikke ekte, analyserte skogpunkter. <a href="#" id="sp-demo-login-link">Logg inn</a> for å se tusenvis av ekte steder i hele Norge.`;
        const link = document.getElementById('sp-demo-login-link');
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); openLoginPanel(); });
      } else {
        demoBanner.style.display = 'none';
      }
    }
    renderSpeciesList();
    renderMyFindsList();
    renderDataNotice();
    renderFilterControls();
    // "Foreslå områder" gir ingen mening uten ekte terrengdata (kun 2
    // demo-punkter uten tilkobling), og gjør et ekte, levende Overpass-kall
    // for parkering — skjules derfor helt for en ikke-tilkoblet besøkende
    // i stedet for å bare la den feile/være tom ved klikk.
    const routeEnabled = personalFeaturesEnabled();
    document.getElementById('sp-route-panel').style.display = routeEnabled ? '' : 'none';
    document.getElementById('sp-route-disabled-note').style.display = routeEnabled ? 'none' : '';
    document.getElementById('sp-toggle-quiet').classList.toggle('on', prioritizeQuiet);
    document.getElementById('sp-toggle-sti').classList.toggle('on', weighTrailDistance);
    document.getElementById('sp-toggle-vei').classList.toggle('on', weighRoadDistance);
    document.getElementById('sp-toggle-ownhistory').classList.toggle('on', weighOwnFindHistory);
    document.getElementById('sp-toggle-weather').classList.toggle('on', weighWeather);
    document.getElementById('sp-toggle-knownfinds').classList.toggle('on', deprioritizeKnownFinds);
    document.getElementById('sp-toggle-hogst').classList.toggle('on', hideHogst);
    document.getElementById('sp-toggle-artskart-recent').classList.toggle('on', artskartOnlyRecent);
    document.getElementById('sp-toggle-del-funn').classList.toggle('on', delFunn);

    document.querySelectorAll('#sp-viewmode-seg button').forEach(b => b.classList.toggle('active', b.dataset.viewmode === viewMode));
    document.getElementById('sp-fav-count').textContent = favoriteSpecies.length;

    const locsAll = allLocations();
    let scoredAll;

    if (viewMode === 'favorites') {
      _currentSpecies = null;
      document.getElementById('sp-results-title').textContent = 'Forslag for dine favoritter';
      const favNames = favoriteSpecies.map(id => SPECIES.find(s => s.id === id)?.name).filter(Boolean);
      document.getElementById('sp-species-info').innerHTML = favNames.length
        ? `<div class="sp-species-info-top"><div class="sp-si-name">Dine favoritter</div></div>
           <div class="sp-species-info-body">${favNames.join(', ')} — hvert sted under vises med score for hver av disse, sortert på beste treff.</div>`
        : `<div class="sp-species-info-body">Ingen favoritter valgt ennå — klikk ★ på artene i lista til venstre for å legge dem til.</div>`;

      // Hvert sted får score for ALLE favoritter (favResults), sortert best
      // først — res/isCut/total (brukt av kart, sortering, score-filter)
      // gjenspeiler alltid den best-scorende favoritten på stedet.
      scoredAll = locsAll.map(loc => {
        const favResults = favoriteSpecies
          .map(id => SPECIES.find(s => s.id === id))
          .filter(Boolean)
          .map(sp => ({ species: sp, res: scoreLocation(sp, loc) }))
          .sort((a,b) => b.res.total - a.res.total);
        const best = favResults[0] || { res: { total: 0, isCut: false, breakdown: [], accessTags: [], histNote: null, weather: null, weatherVerdict: null } };
        return { loc, res: best.res, favResults };
      });
    } else {
      const species = SPECIES.find(s => s.id === selectedSpecies);
      _currentSpecies = species;
      document.getElementById('sp-results-title').textContent = `Forslag for ${species.name}`;

      const monthNames = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
      const timing = seasonTiming(species);
      document.getElementById('sp-species-info').innerHTML = `
        ${species.image ? `
        <div class="sp-species-photo">
          <img src="${escapeHtml(species.image.url)}" alt="${escapeHtml(species.name)}" loading="lazy"/>
          <div class="sp-species-photo-credit">Foto: <a href="${escapeHtml(species.image.sourcePage)}" target="_blank" rel="noopener">${escapeHtml(species.image.artist)}</a>, ${escapeHtml(species.image.license)}, Wikimedia Commons</div>
        </div>` : ''}
        <div class="sp-species-info-top">
          <div class="sp-si-name">${species.name}<em>${species.latin}</em></div>
          <div class="sp-si-season">typisk sesong: ${monthNames[species.season[0]-1]}–${monthNames[species.season[1]-1]}</div>
        </div>
        <div class="sp-timing-row">
          <span class="sp-timing-badge sp-timing-${timing.status}">${timing.label}</span>
          <span class="sp-timing-detail">${timing.detail}</span>
        </div>
        <div class="sp-timing-bar"><div class="sp-timing-bar-marker" style="left:${timing.pct}%"></div></div>
        <div class="sp-species-info-body">${species.fieldTips}</div>
        <div class="sp-lookalike"><b>⚠ Forvekslingsfare:</b> ${species.lookalike}</div>
      `;

      scoredAll = locsAll.map(loc => ({ loc, res: scoreLocation(species, loc) }));
    }

    // RETTET 2026-08-14 (bruker påpekte at "alle steder i området vises
    // fortsatt i kartet"-hintet under score-filteret var upresist i
    // radius-modus): dette område-filteret (fylke/kommune/radius) ble
    // tidligere beregnet ETTER renderMap(scoredAll) — kartet fikk dermed
    // hele scoredAll UFILTRERT på område. I fylke-/kommune-modus var det
    // uskadelig (BASE_LOCATIONS er allerede server-filtrert til akkurat det
    // fylket/kommunen, se currentServerFilterParams()), men i radius-modus
    // sender currentServerFilterParams() ALDRI noe filter — BASE_LOCATIONS
    // er da HELE det nasjonale datasettet, og kartet tegnet dermed absolutt
    // alle punkter i Norge, ikke bare de innenfor valgt radius, hver gang
    // "Målepunkter"-laget ble skrudd på. Beregnes nå FØR renderMap(), slik
    // at kartet faktisk viser nøyaktig "området" — samme mengde som
    // resultatlisten før score-/hogst-filteret tynner den videre ned.
    let scoped = scoredAll.filter(s => isInCurrentScope(s.loc));

    renderMap(scoped);
    // Voksestedslaget er admin-only inntil videre (se
    // updateVoksestedslagAvailability()) — ikke bare skjult fra
    // lag-kontrollen, men heller ikke tegnet/fylt for andre i det hele
    // tatt, så det ikke finnes noe å oppdage via DevTools heller.
    if (isAdmin()) {
      renderVoksestedslag(scoped);
      renderVoksestedslagLegend();
      renderVoksestedslagCoverage(scoped);
      if (leafletMap) voksestedslagPanelsVisible(leafletMap.hasLayer(voksestedslagLayer));
    }
    renderHogstZones();
    renderFindsLayer();
    renderDelteFunnLayer();

    // `scoped` selv (isInCurrentScope, se render() over) — siden v0.28.2
    // deler dekningslinjen samme scope som kartmarkørene/resultatlisten,
    // ingen egen isInForeslaOmraderScope()-filtrering lenger nødvendig her.
    // MÅ leses før `scoped` ev. tynnes videre av hideHogst under.
    updateCoverageLine(scoped.length);
    if (hideHogst) scoped = scoped.filter(s => !s.res.isCut);
    // Tegner umiddelbart fra et evt. allerede innlastet datasett (billig,
    // synkront), OG trigger i tillegg en (fire-and-forget) sjekk av om et
    // NYTT hent nå er nødvendig — dekker tilfeller der filtervalget alene
    // gjør laget synlig/usynlig uten at kartets synlige utsnitt faktisk
    // beveger seg (f.eks. å nullstille et fylkevalg tilbake til "Alle
    // fylker" endrer ikke kartutsnittet, kun om laget skal vises).
    // loadArtsfunn() er selv billig å kalle for ofte — den gir umiddelbart
    // opp (uten nettverkskall) både når området ikke er avgrenset nok OG
    // når gjeldende utsnitt allerede er dekket av forrige hent.
    renderArtskartLayer();
    loadArtsfunn().then(renderArtskartLayer);
    scoped.sort((a,b) => {
      if (a.res.isCut !== b.res.isCut) return a.res.isCut ? 1 : -1;
      return b.res.total - a.res.total;
    });

    updateFetchPanel(scoped.length);

    // kommuneFilter kommer fra et fritekstfelt (autocomplete, ikke en låst
    // <select>), så den må escapes før den havner i innerHTML nedenfor —
    // ellers kan noen skrive HTML/script rett inn i "0 steder vist"-meldingen.
    const areaLabel = filterMode === 'fylke' ? (fylkeFilter!=='alle' ? ' i ' + escapeHtml(fylkeFilter) : '')
      : filterMode === 'kommune' ? (kommuneFilter!=='alle' ? ' i ' + escapeHtml(kommuneFilter) : '')
      : (radiusCenter ? ` innen ${radiusKm} km` : '');

    const container = document.getElementById('sp-results');
    if (viewMode === 'favorites' && !favoriteSpecies.length) {
      document.getElementById('sp-count').textContent = '';
      container.innerHTML = `<div class="sp-empty">Ingen favoritter valgt ennå. Klikk ★ på en eller flere arter i lista til venstre for å komme i gang.</div>`;
      return;
    }
    if (!scoped.length) {
      document.getElementById('sp-count').textContent = `0 steder vist${areaLabel}`;
      // RETTET 2026-08-14 (bruker meldte at meldingen var upresis for en
      // kommune uten analyserte steder, f.eks. Lillestrøm): scoped.length===0
      // her betyr ALLTID "ingen kjente steder i dette området" (dette skjer
      // FØR minScoreFilter i det hele tatt anvendes, se breakdown-kommentaren
      // under) — aldri "for strenge filtre". Den gamle teksten ("passerer
      // ikke filtrene dine … Prøv «Alle fylker/kommuner» eller juster
      // radius") antydet det motsatte, OG ga et rådvag/feil handlingsforslag
      // (ingen knapp heter "Alle fylker/kommuner", og "juster radius" er
      // meningsløst utenfor radius-modus). Forslaget er nå modus-tilpasset og
      // bruker faktiske UI-navn («Om dataene» sin dekningsliste, i stedet for
      // å gjette på nabofylker/-kommuner blindt).
      const forslag = filterMode === 'radius' && !radiusCenter
        ? 'Klikk i kartet for å sette et senterpunkt.'
        : filterMode === 'fylke'
          ? 'Velg et annet fylke, eller se hvilke kommuner som er dekket under «Om dataene».'
          : filterMode === 'kommune'
            ? 'Velg en annen kommune, eller se hvilke kommuner som er dekket under «Om dataene».'
            : 'Prøv et annet senterpunkt eller en større radius.';
      // fetchNudgeHtml() er allerede admin-only i praksis (sjekker om
      // #sp-fetch-panel faktisk er synlig — updateFetchPanel() skjuler det
      // helt for ikke-admin, se der) — gjenbruker samme lenke/mønster som
      // dekningslinjen over "Foreslå områder" og sammendraget etter et
      // "Foreslå områder"-forsøk, i stedet for en tredje, særegen formulering.
      container.innerHTML = `<div class="sp-empty">Ingen analyserte steder${areaLabel} ennå. ${forslag}${fetchNudgeHtml(scoped.length)}</div>`;
      wireFetchNudgeLink();
      return;
    }

    // minScoreFilter tynner kun ut LISTEN (og kun blant anbefalte, ikke
    // flatehogde) — kartet over viser alltid alle steder i området, uansett
    // score, slik at man kan oppdage og klikke seg til dem der i stedet.
    const activeOnes = scoped.filter(s => !s.res.isCut && s.res.total >= minScoreFilter);
    const hiddenByScore = scoped.filter(s => !s.res.isCut && s.res.total < minScoreFilter).length;
    const cutOnes = scoped.filter(s => s.res.isCut);

    if (!activeOnes.length && !cutOnes.length) {
      document.getElementById('sp-count').textContent = `0 av ${scoped.length} steder vist${areaLabel}`
        + (hiddenByScore ? ` — ${hiddenByScore} skjult under score ${minScoreFilter}` : '');
      container.innerHTML = `<div class="sp-empty">Ingen steder over valgt minimumsscore (${minScoreFilter})${areaLabel} — senk terskelen over, eller se kartet for alle ${scoped.length} steder i området.</div>`;
      return;
    }

    // Nullstill "vis flere"-paginering når resultatgrunnlaget selv endrer
    // seg (annet filter/art/terskel osv.) — men IKKE ved uendret grunnlag
    // (f.eks. en uavhengig toggle som ikke rører scoped/activeOnes), slik
    // at et "Vis flere"-klikk faktisk består av re-render()-kallet det
    // selv trigger.
    const naSignatur = JSON.stringify([filterMode, fylkeFilter, kommuneFilter, radiusKm, radiusCenter, selectedSpecies, viewMode, minScoreFilter, favoriteSpecies, hideHogst]);
    if (naSignatur !== visningsSignatur) { visningsAntallListe = VISNING_STEG_LISTE; visningsSignatur = naSignatur; }

    // Paginerer kun selve RENDERINGEN (HTML-bygging + DOM-innsetting) — ikke
    // scoringen/rangeringen over, som uansett må skje for ALLE steder for at
    // sorteringen/"X av Y"-tallene skal være riktige. Hvert kort involverer
    // flere underberegninger (terrainMicrotips, crossSpeciesTipsHtml,
    // knownFindsHtml) — å bygge dem for hundrevis av steder man uansett må
    // scrolle forbi var unødvendig kostbart. Aktive (anbefalte) steder vises
    // først; flatehogde steder telles med i SAMME paginerings-"budsjett" og
    // dukker først opp når alle aktive er vist.
    const aktiveViste = activeOnes.slice(0, visningsAntallListe);
    const cutBudsjett = Math.max(0, visningsAntallListe - aktiveViste.length);
    const cutViste = cutBudsjett > 0 ? cutOnes.slice(0, cutBudsjett) : [];
    const totalKort = activeOnes.length + cutOnes.length;
    const visteKort = aktiveViste.length + cutViste.length;

    document.getElementById('sp-count').textContent = `${visteKort} av ${totalKort} steder vist${areaLabel}`
      + (hiddenByScore ? ` — ${hiddenByScore} skjult under score ${minScoreFilter}` : '');

    const renderCard = viewMode === 'favorites'
      ? (s) => cardHtmlFavorites(s.loc, s.favResults)
      : (s) => cardHtml(s.loc, s.res);
    let html = aktiveViste.map(renderCard).join('');
    if (cutViste.length) {
      html += `<div class="sp-divider-excl">flatehogd — ikke anbefalt</div>`;
      html += cutViste.map(renderCard).join('');
    }
    if (visteKort < totalKort) {
      const gjenstaende = totalKort - visteKort;
      html += `<button class="sp-btn" id="sp-vis-flere" style="width:100%;margin-top:8px;">Vis ${Math.min(VISNING_STEG_LISTE, gjenstaende)} flere steder (${gjenstaende} igjen)</button>`;
    }
    container.innerHTML = html;

    container.querySelectorAll('[data-action="find"]').forEach(btn => btn.addEventListener('click', () => openFindModal(btn.dataset.loc)));
    container.querySelectorAll('[data-action="locate"]').forEach(btn => btn.addEventListener('click', () => locateOnMap(btn.dataset.loc)));
    container.querySelectorAll('[data-action="cut"]').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.loc;
      if (userCuts.includes(id)) userCuts = userCuts.filter(x => x !== id); else userCuts.push(id);
      await saveCuts(); render();
    }));
    container.querySelectorAll('[data-score-loc]').forEach(el => el.addEventListener('click', () => {
      openScoreBreakdownModal(el.dataset.scoreLoc, el.dataset.scoreSpecies);
    }));
    const visFlereBtn = document.getElementById('sp-vis-flere');
    if (visFlereBtn) visFlereBtn.addEventListener('click', () => { visningsAntallListe += VISNING_STEG_LISTE; render(); });
  }

  // scoreLocation() beregner allerede en full breakdown (tekst+poeng per
  // faktor) hver eneste gang den kjøres, men den ble tidligere kastet bort —
  // ingenting i UI-et viste den. Regner den ut på nytt her i stedet for å
  // lagre den fra render() (samme species+loc gir samme resultat siden
  // scoreLocation kun leser fra allerede lastet global state).
  function openScoreBreakdownModal(locId, speciesId){
    const loc = allLocations().find(l => l.id === locId);
    const species = SPECIES.find(s => s.id === speciesId);
    if (!loc || !species) return;
    const res = scoreLocation(species, loc);
    const slot = document.getElementById('sp-modal-slot');
    slot.innerHTML = `
      <div class="sp-modal-backdrop" id="sp-modal-backdrop">
        <div class="sp-modal">
          <h4>Score-beregning — ${escapeHtml(species.name)}</h4>
          <div class="sp-modal-sub">${escapeHtml(loc.name)}, ${escapeHtml(loc.kommune || 'ukjent kommune')}</div>
          <div class="sp-score-breakdown">
            ${res.breakdown.map(([label, pts]) => `
              <div class="sp-score-breakdown-row">
                <span>${escapeHtml(label)}</span>
                <span class="${pts > 0 ? 'sp-score-pos' : pts < 0 ? 'sp-score-neg' : 'sp-score-neutral'}">${pts > 0 ? '+' : ''}${pts}</span>
              </div>`).join('')}
            <div class="sp-score-breakdown-row sp-score-breakdown-total">
              <span>Total</span>
              <span>${res.total}</span>
            </div>
          </div>
          <div class="sp-modal-actions">
            <button class="sp-btn sp-primary" id="sp-score-modal-close">Lukk</button>
          </div>
        </div>
      </div>`;
    document.getElementById('sp-score-modal-close').addEventListener('click', () => { slot.innerHTML = ''; });
    document.getElementById('sp-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'sp-modal-backdrop') slot.innerHTML = ''; });
  }

  // ---------- find modal ----------
  // opts.editingFind: gitt et eksisterende funn i stedet for locId, redigerer
  // denne funnet på plass (art/mengde/dato/notat) i stedet for å opprette et
  // nytt — brukt av "Mine funn"-lista og av rediger-knappen i funn-popupen i
  // kartet.
  // Snap-avstand for å knytte et nytt funn til et allerede beriket sted i
  // stedet for å opprette (og trigge berikelse av) et nytt — se
  // resolveOrCreateLocationForFind. 250 m er romslig nok for vanlig
  // GPS-unøyaktighet i skog, men tett nok til at reelt ulike steder ikke
  // slås sammen.
  const FIND_LOCATION_SNAP_KM = 0.25;

  // Knytter et funn til nærmeste allerede kjente/berikede sted innenfor
  // FIND_LOCATION_SNAP_KM (ingen ny berikelse nødvendig — akkurat som å
  // trykke "Registrer funn her" på et eksisterende kort), eller oppretter et
  // minimalt "ukjent"-sted (scorer likevel greit via egen funnhistorikk/vær/
  // sesong, se samtalen 2026-07-11) som appen straks etterpå ber
  // enrich-point.yml fylle inn ekte terrengdata for i bakgrunnen.
  function resolveOrCreateLocationForFind(lat, lon){
    const nearby = allLocations().find(l => haversineKm(lat, lon, l.lat, l.lon) <= FIND_LOCATION_SNAP_KM);
    if (nearby) return { locId: nearby.id, isNew: false };
    const id = 'c_' + Date.now();
    customLocations.push({
      id, name: 'Nytt funn ' + new Date().toISOString().slice(0, 10),
      fylke: null, kommune: null, lat, lon,
      treslag: ['ukjent'], skogalder: 'ukjent', fuktighet: 'ukjent', berggrunn: 'ukjent',
      avstandVeiM: null, befolkning: 'ukjent', hogstAr: null,
      kjenteFunn: [], kjenteFunnDetaljer: [], custom: true,
      kilde: 'find-pending', enrichStatus: 'pending',
      kjorbarVei: 'ukjent', parkeringNotat: null, stier: 'ukjent', avstandStiM: null, avstandParkeringM: null,
      parkeringLat: null, parkeringLon: null, parkeringOsmType: null, parkeringOsmId: null,
    });
    return { locId: id, isNew: true };
  }

  // Trigger enrich-point.yml (se fungifinder-db) for ETT nyopprettet sted —
  // tilgjengelig for ALLE innloggede brukere (ikke admin-only), siden dette
  // er en del av å registrere et funn, ikke av å starte en ny områdeanalyse
  // — se worker/api/src/routes/omrader.js sin berikPunkt().
  async function triggerPointEnrichment(locationId, lat, lon){
    if (!currentUser) return; // ikke innlogget — stedet blir værende "ukjent", men scorer likevel
    const dispatchedAt = new Date(Date.now() - 5000).toISOString();
    try {
      await window.ApiClient.trigBerikelse(locationId, lat, lon);
      pollEnrichStatus(locationId, dispatchedAt);
    } catch (e) {
      console.warn('Kunne ikke starte berikelse for ' + locationId, e);
    }
  }

  // Enkel, uavhengig poll-løkke (egen lukking per kall, ikke en delt
  // global timer som fetchPollTimer) — flere funn kan trigge berikelse av
  // ulike steder samtidig uten å kollidere med hverandre.
  function pollEnrichStatus(locationId, dispatchedAt, attempts){
    attempts = attempts || 0;
    const maxAttempts = 30; // ~15 min ved 30 sek mellomrom
    setTimeout(async () => {
      try {
        const run = await window.ApiClient.hentPunktStatus(dispatchedAt);
        if (run && run.status === 'completed') {
          if (run.conclusion === 'success') {
            // Resultatet ligger i det DELTE (ikke-personlige) oppslaget
            // data/enrichments.json — hentes og slås inn i akkurat DENNE
            // brukerens customLocations-oppføring, siden personlige data nå
            // lever per bruker (D1), ikke lenger som en fil hele appen leser.
            try {
              const felter = await window.ApiClient.hentBerikelse(locationId);
              const loc = customLocations.find(l => l.id === locationId);
              if (felter && loc) {
                Object.keys(felter).forEach(k => { if (felter[k] != null) loc[k] = felter[k]; });
                await persistAll();
              }
            } catch (e) {
              console.warn('Kunne ikke hente berikelsesresultat for ' + locationId, e);
            }
            render();
          } else {
            console.warn(`Berikelse feilet for ${locationId} (${run.conclusion}) — stedet blir værende "ukjent", men teller uansett i vurderingen.`);
          }
          return;
        }
      } catch (e) { console.warn('Feil under polling av berikelse', e); }
      if (attempts < maxAttempts) pollEnrichStatus(locationId, dispatchedAt, attempts + 1);
    }, 30000);
  }

  function openFindModal(locId, opts){
    opts = opts || {};
    if (!personalFeaturesEnabled()) {
      alert('Logg inn under ⚙ Preferanser & Config → Konto for å registrere funn.');
      return;
    }
    const editingFind = opts.editingFind || null;
    const needsPosition = !editingFind && !locId;
    let pendingLat = needsPosition ? (opts.lat ?? null) : null;
    let pendingLon = needsPosition ? (opts.lon ?? null) : null;
    const loc = allLocations().find(l => l.id === (editingFind ? editingFind.locId : locId));
    let mengde = editingFind ? editingFind.mengde : 3;
    const todayStr = new Date().toISOString().slice(0,10);
    const slot = document.getElementById('sp-modal-slot');
    slot.innerHTML = `
      <div class="sp-modal-backdrop" id="sp-modal-backdrop">
        <div class="sp-modal">
          <h4>${opts.title ? escapeHtml(opts.title) : (editingFind ? 'Rediger funn — ' + escapeHtml(loc ? loc.name : '') : (loc ? 'Registrer funn — ' + escapeHtml(loc.name) : 'Registrer nytt funn'))}</h4>
          ${opts.sub ? `<div class="sp-modal-sub">${escapeHtml(opts.sub)}</div>` : ''}
          <label>Sopptype</label>
          <select id="sp-find-species">${SPECIES.map(s => `<option value="${s.id}" ${s.id===(editingFind?editingFind.speciesId:selectedSpecies)?'selected':''}>${escapeHtml(s.name)}</option>`).join('')}</select>
          <label>Mengde funnet</label>
          <div class="sp-scale" id="sp-find-scale">${[1,2,3,4,5].map(n => `<button data-n="${n}" class="${n===mengde?'sel':''}">${n}</button>`).join('')}</div>
          ${needsPosition ? `
          <label>Posisjon</label>
          <div class="sp-2col">
            <button type="button" class="sp-mini-btn" id="sp-find-use-my-position">📍 Bruk min posisjon</button>
            <span id="sp-find-position-display" style="align-self:center;font-size:var(--fs-sm);color:var(--ink-soft);">${pendingLat!=null ? pendingLat.toFixed(5)+', '+pendingLon.toFixed(5) : 'Ikke satt — bruk knappen, eller lukk og klikk i kartet der du fant den'}</span>
          </div>` : ''}
          <label>Dato</label>
          <input type="date" id="sp-find-date" value="${escapeHtml(editingFind ? editingFind.date : todayStr)}"/>
          <label>Notat (valgfritt)</label>
          <textarea id="sp-find-note" rows="2" placeholder="F.eks. nordvendt skråning nær bekken">${editingFind ? escapeHtml(editingFind.note || '') : ''}</textarea>
          <div class="sp-modal-actions">
            <button class="sp-btn" id="sp-find-cancel">${opts.skipLabel ? escapeHtml(opts.skipLabel) : 'Avbryt'}</button>
            <button class="sp-btn sp-primary" id="sp-find-save">${editingFind ? 'Lagre endringer' : 'Lagre funn'}</button>
          </div>
        </div>
      </div>`;
    slot.querySelectorAll('#sp-find-scale button').forEach(b => b.addEventListener('click', () => {
      mengde = parseInt(b.dataset.n);
      slot.querySelectorAll('#sp-find-scale button').forEach(x => x.classList.remove('sel'));
      b.classList.add('sel');
    }));
    document.getElementById('sp-find-cancel').addEventListener('click', () => { slot.innerHTML=''; render(); });
    document.getElementById('sp-modal-backdrop').addEventListener('click', (e) => { if(e.target.id==='sp-modal-backdrop'){ slot.innerHTML=''; render(); } });
    if (needsPosition) {
      document.getElementById('sp-find-use-my-position').addEventListener('click', (e) => {
        // Høy nøyaktighet beholdt (skal bli et faktisk registrert funnpunkt),
        // kort maximumAge (30s) — nok til å gjenbruke et akkurat innhentet
        // oppslag ved et evt. dobbeltklikk, men ikke stort nok til å risikere
        // en utdatert posisjon om brukeren har gått videre siden sist.
        useMyLocation((lat, lon) => {
          pendingLat = lat; pendingLon = lon;
          document.getElementById('sp-find-position-display').textContent = lat.toFixed(5) + ', ' + lon.toFixed(5);
        }, { maximumAge: 30000, buttonEl: e.currentTarget });
      });
    }
    document.getElementById('sp-find-save').addEventListener('click', async () => {
      const speciesId = document.getElementById('sp-find-species').value;
      const note = document.getElementById('sp-find-note').value;
      const date = document.getElementById('sp-find-date').value || todayStr;
      let newlyCreatedLocation = null;

      if (editingFind) {
        editingFind.speciesId = speciesId;
        editingFind.mengde = mengde;
        editingFind.note = note;
        editingFind.date = date;
      } else {
        let targetLocId = locId;
        if (needsPosition) {
          if (pendingLat == null || pendingLon == null) {
            alert('Velg posisjon først — bruk «Bruk min posisjon», eller lukk og klikk i kartet der du fant den.');
            return;
          }
          const resolved = resolveOrCreateLocationForFind(pendingLat, pendingLon);
          targetLocId = resolved.locId;
          if (resolved.isNew) newlyCreatedLocation = { id: resolved.locId, lat: pendingLat, lon: pendingLon };
        }
        userFinds.push({ id:'f_'+Date.now(), locId: targetLocId, speciesId, mengde, note, date });
      }
      await saveFinds();
      if (newlyCreatedLocation) triggerPointEnrichment(newlyCreatedLocation.id, newlyCreatedLocation.lat, newlyCreatedLocation.lon);
      slot.innerHTML = '';
      render();
    });
  }

  // ---------- flatehogd-OMRÅDER (sirkler, ikke bundet til ett enkelt målepunkt) ----------
  function renderHogstZones(){
    if (!hogstLayer) return;
    hogstLayer.clearLayers();
    hogstOmrader.forEach(z => {
      const circle = L.circle([z.lat, z.lon], { radius: z.radiusM, color: '#A23E2E', weight: 2, fillColor: '#A23E2E', fillOpacity: 0.2 });
      circle.bindPopup(`<b>Flatehogd-område</b><br/>Merket ${escapeHtml(z.dato || '')}, radius ${z.radiusM} m<br/><button data-remove-hogst="${z.id}" class="sp-btn sp-ghost-danger" style="margin-top:6px;">Fjern</button>`, POPUP_OPTS);
      circle.on('popupopen', (e) => {
        const btn = e.popup._contentNode.querySelector('[data-remove-hogst]');
        if (btn) btn.addEventListener('click', async () => {
          hogstOmrader = hogstOmrader.filter(h => h.id !== z.id);
          await saveHogstOmrader();
          render();
        });
      });
      circle.addTo(hogstLayer);
    });
  }

  // ---------- Mine funn: kartlag + global liste ----------
  // Kartlaget filtreres til aktiv(e) art(er) (se activeSpeciesIds()), slik at
  // det følger samme logikk som Artsdatabanken-laget. Sidepanel-lista
  // (renderMyFindsList) viser bevisst ALLE funn uansett artsvalg — den er en
  // logg/administrasjonsvisning, ikke en utforsknings-visning.
  function renderFindsLayer(){
    if (!findsLayer) return;
    findsLayer.clearLayers();
    findMarkersById = {};
    const activeIds = new Set(activeSpeciesIds());
    userFinds.filter(f => activeIds.has(f.speciesId)).forEach(f => {
      const pos = findLatLon(f);
      if (!pos) return;
      const sp = SPECIES.find(s => s.id === f.speciesId);
      const marker = L.circleMarker([pos.lat, pos.lon], {
        radius: 7, color: '#fff', weight: 2, fillColor: '#8C4A20', fillOpacity: 0.9
      });
      marker.bindPopup(`<b>${escapeHtml(sp ? sp.name : f.speciesId)}</b><br/>${f.date} · mengde ${f.mengde}/5${f.note ? '<br/>' + escapeHtml(f.note) : ''}<br/><button data-edit-find-popup="${f.id}" class="sp-btn" style="margin-top:6px;">✏️ Rediger</button>`, POPUP_OPTS);
      marker.on('popupopen', (e) => {
        const btn = e.popup._contentNode.querySelector('[data-edit-find-popup]');
        if (btn) btn.addEventListener('click', () => openFindModal(null, { editingFind: userFinds.find(x => x.id === f.id) }));
      });
      marker.addTo(findsLayer);
      findMarkersById[f.id] = marker;
    });
  }

  // Andre brukeres delte funn (se delFunn/loadDelteFunn()) — egen visuell
  // farge (fiolett) forskjellig fra BÅDE egne funn (#8C4A20, brunt) og
  // Artsdatabanken-laget (#4C7BE1, blått), slik at alle tre kan skilles fra
  // hverandre i kartet. Filtreres på aktiv(e) art(er) akkurat som de to
  // andre lagene (se activeSpeciesIds()). Ingen redigeringsknapp i popup-en
  // (i motsetning til renderFindsLayer over) — det er ikke ditt funn.
  function renderDelteFunnLayer(){
    if (!delteFunnLayer) return;
    delteFunnLayer.clearLayers();
    if (!delteFunn.length) return;
    const activeIds = new Set(activeSpeciesIds());
    delteFunn.filter(f => activeIds.has(f.art)).forEach(f => {
      const sp = SPECIES.find(s => s.id === f.art);
      const marker = L.circleMarker([f.lat, f.lon], {
        radius: 6, color: '#fff', weight: 1.5, fillColor: '#8451C7', fillOpacity: 0.85
      });
      marker.bindPopup(`<b>${escapeHtml(sp ? sp.name : f.art)}</b><br/>${escapeHtml(f.dato || 'ukjent dato')}<br/>Funnet av ${escapeHtml(f.kortnavn)}`, POPUP_OPTS);
      marker.addTo(delteFunnLayer);
    });
  }

  function locateFindOnMap(findId){
    const find = userFinds.find(f => f.id === findId);
    const pos = find && findLatLon(find);
    if (!pos || !leafletMap) return;
    if (findsLayer && !leafletMap.hasLayer(findsLayer)) leafletMap.addLayer(findsLayer);
    setMobileView('kart');
    document.getElementById('sp-leaflet-map').scrollIntoView({ behavior:'smooth', block:'center' });
    leafletMap.setView([pos.lat, pos.lon], Math.max(leafletMap.getZoom(), 14));
    const marker = findMarkersById[findId];
    if (marker) setTimeout(() => marker.openPopup(), 350);
  }

  // Ekte Artsdatabanken-observasjoner innenfor det SYNLIGE kartutsnittet —
  // RETTET 2026-07-11: viste tidligere kun funn nær et allerede
  // terrenganalysert sted (innenfor ~5 km av en scopedLoc), uavhengig av hvor
  // i kartet man faktisk så. Etter at seed-artskart-jobben hentet data for
  // alle 15 fylker (se fungifinder-db) ligger det nå observasjoner overalt i
  // artsfunn.json, ikke bare rundt analyserte punkter — så dette laget viste
  // stille bort det meste av dataene appen faktisk har. Bruker nå
  // leafletMap.getBounds() i stedet, og kalles på nytt ved panorering/zooming
  // (se moveend-lytteren i initMap()), slik at det du ser i kartet faktisk
  // oppdateres når du navigerer deg rundt.
  // Filtreres fortsatt på aktiv(e) art(er) — se activeSpeciesIds() — slik at
  // laget viser funn for den valgte arten (eller favorittene), ikke alle 12
  // samtidig.
  function renderArtskartLayer(){
    if (!artskartLayer || !leafletMap) return;
    // For vidt/uavgrenset utsnitt (se artskartSkalHentesOgVises()) — tegn
    // ingenting, selv om `artsfunn` skulle ha data hengende igjen fra en
    // tidligere, mer avgrenset visning (f.eks. rett etter at brukeren
    // nullstiller fylkevalget til "Alle fylker" igjen).
    if (!artskartSkalHentesOgVises()) { artskartLayer.clearLayers(); return; }
    artskartLayer.clearLayers();
    if (!artsfunn.length) return;
    const activeIds = new Set(activeSpeciesIds());
    // "Vis kun ferske funn"-toggel: filtrerer på o.dato (faktisk observasjonsdato),
    // ikke trackDateTime (kun en synk-metadata, ofte år etter selve funnet) — se parseNorskDato.
    const recentCutoff = artskartOnlyRecent ? new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) : null;
    const bounds = leafletMap.getBounds();
    const nearby = [];
    for (const o of artsfunn) {
      if (!activeIds.has(o.art)) continue;
      if (recentCutoff) {
        const dt = parseNorskDato(o.dato);
        if (!dt || dt < recentCutoff) continue;
      }
      if (!bounds.contains([o.lat, o.lon])) continue;
      nearby.push(o);
    }
    nearby.forEach(o => {
      const sp = SPECIES.find(s => s.id === o.art);
      const marker = L.circleMarker([o.lat, o.lon], {
        radius: 5, color: '#fff', weight: 1.5, fillColor: '#4C7BE1', fillOpacity: 0.85
      });
      marker.bindPopup(`<b>${escapeHtml(sp ? sp.name : o.art)}</b><br/>${escapeHtml(o.dato || 'ukjent dato')}${o.url ? `<br/><a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">Se på Artskart →</a>` : ''}`, POPUP_OPTS);
      marker.addTo(artskartLayer);
    });
  }

  function personalFeaturesEnabled(){
    return !!currentUser;
  }

  // Registrering av funn/hogstfelt krever en innlogget konto (data lagres
  // per bruker hos fungifinder-api) — så knappene skjules og lista erstattes
  // med en innloggingsoppfordring i stedet for å late som funksjonen
  // "virker" for en ikke-innlogget besøkende.
  function renderMyFindsList(){
    const el = document.getElementById('sp-myfinds-list');
    const addBtn = document.getElementById('sp-add-place');
    const hogstBtn = document.getElementById('sp-mark-hogst');
    const enabled = personalFeaturesEnabled();
    addBtn.style.display = enabled ? '' : 'none';
    hogstBtn.style.display = enabled ? '' : 'none';
    if (!enabled) {
      el.innerHTML = `<div class="sp-empty-mine">Logg inn under ⚙ Preferanser &amp; Config → Konto for å registrere funn og hogstfelt.</div>`;
      return;
    }
    if (!userFinds.length) { el.innerHTML = `<div class="sp-empty-mine">Ingen funn registrert ennå.</div>`; return; }
    const sorted = [...userFinds].sort((a,b) => (b.date||'').localeCompare(a.date||''));
    el.innerHTML = sorted.map(f => {
      const sp = SPECIES.find(s => s.id === f.speciesId);
      const loc = allLocations().find(l => l.id === f.locId);
      const pending = loc && loc.enrichStatus === 'pending';
      return `<div class="sp-mine-row">
        <span>${escapeHtml(sp ? sp.name : f.speciesId)} <span style="opacity:.6">— ${escapeHtml(loc ? loc.name : 'ukjent sted')} · ${escapeHtml(f.date)}</span>${pending ? ' <span class="sp-tag" title="Terrengdata hentes i bakgrunnen — funnet teller allerede i vurderingen">⏳ beriker …</span>' : ''}</span>
        <span class="sp-mine-row-actions">
          <button class="sp-locate" data-view-find="${f.id}" title="Vis i kart">🔍</button>
          <button class="sp-locate" data-move-find="${f.id}" title="Flytt til min posisjon">📍</button>
          <button class="sp-locate" data-edit-find="${f.id}" title="Rediger">✏️</button>
          <button class="sp-remove" data-remove-find="${f.id}" title="Fjern">✕</button>
        </span>
      </div>`;
    }).join('');
    el.querySelectorAll('[data-view-find]').forEach(btn => btn.addEventListener('click', () => locateFindOnMap(btn.dataset.viewFind)));
    el.querySelectorAll('[data-move-find]').forEach(btn => btn.addEventListener('click', () => {
      const find = userFinds.find(f => f.id === btn.dataset.moveFind);
      if (!find) return;
      // Høy nøyaktighet + kort maximumAge — samme begrunnelse som
      // sp-find-use-my-position over (faktisk funnpunkt, presisjon teller).
      useMyLocation(async (lat, lon) => {
        find.lat = lat; find.lon = lon;
        await saveFinds();
        render();
      }, { maximumAge: 30000, buttonEl: btn });
    }));
    el.querySelectorAll('[data-edit-find]').forEach(btn => btn.addEventListener('click', () => {
      const find = userFinds.find(f => f.id === btn.dataset.editFind);
      if (find) openFindModal(null, { editingFind: find });
    }));
    el.querySelectorAll('[data-remove-find]').forEach(btn => btn.addEventListener('click', async () => {
      const removed = userFinds.find(f => f.id === btn.dataset.removeFind);
      userFinds = userFinds.filter(f => f.id !== btn.dataset.removeFind);
      // Rydder bort et sted som kun ble opprettet FOR dette funnet (se
      // resolveOrCreateLocationForFind) hvis det ikke lenger har noen funn
      // igjen — ellers blir det et foreldreløst sted uten noen UI igjen til
      // å administrere det, nå som "Steder"-fanen er fjernet.
      if (removed) {
        const loc = customLocations.find(l => l.id === removed.locId);
        if (loc && (loc.kilde === 'find-pending' || loc.kilde === 'find-enrichment') && !userFinds.some(f => f.locId === loc.id)) {
          customLocations = customLocations.filter(l => l.id !== loc.id);
        }
      }
      await saveFinds();
      render();
    }));
  }

  // Modal som åpnes når man klikker i kartet mens "Merk hogstfelt i kart" er
  // aktiv. Viser en levende forhåndsvisning av sirkelen mens man justerer
  // radius, slik at man ser akkurat hvilket areal som blir merket FØR man
  // lagrer — alt innenfor sirkelen regnes som flatehogd i vurderingen,
  // uavhengig av om det finnes et eksisterende målepunkt der.
  function openHogstOmradeModal(lat, lon){
    const slot = document.getElementById('sp-modal-slot');
    let radiusM = 100;
    const todayStr = new Date().toISOString().slice(0,10);
    slot.innerHTML = `
      <div class="sp-modal-backdrop" id="sp-modal-backdrop">
        <div class="sp-modal">
          <h4>Merk flatehogd-område</h4>
          <div class="sp-modal-sub">Alt innenfor sirkelen (nåværende og fremtidig hentede steder) regnes som flatehogd i vurderingen — praktisk når hogstfeltet ikke treffer noe eksisterende målepunkt.</div>
          <label>Radius: <span id="sp-hogst-radius-label">100 m</span></label>
          <input type="range" id="sp-hogst-radius-slider" min="20" max="500" step="10" value="100"/>
          <label>Dato (anslått)</label>
          <input type="date" id="sp-hogst-date" value="${todayStr}"/>
          <div class="sp-modal-actions">
            <button class="sp-btn" id="sp-hogst-cancel">Avbryt</button>
            <button class="sp-btn sp-primary" id="sp-hogst-save">Lagre område</button>
          </div>
        </div>
      </div>`;

    const previewCircle = L.circle([lat, lon], { radius: radiusM, color: '#A23E2E', weight: 2, fillColor: '#A23E2E', fillOpacity: 0.25 }).addTo(leafletMap);

    document.getElementById('sp-hogst-radius-slider').addEventListener('input', (e) => {
      radiusM = parseInt(e.target.value);
      document.getElementById('sp-hogst-radius-label').textContent = radiusM + ' m';
      previewCircle.setRadius(radiusM);
    });

    function closeModal(){
      slot.innerHTML = '';
      leafletMap.removeLayer(previewCircle);
      markingHogstMode = false;
      updateMarkHogstButton();
    }

    document.getElementById('sp-hogst-cancel').addEventListener('click', closeModal);
    document.getElementById('sp-modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'sp-modal-backdrop') closeModal(); });
    document.getElementById('sp-hogst-save').addEventListener('click', async () => {
      const dato = document.getElementById('sp-hogst-date').value || todayStr;
      hogstOmrader.push({ id: 'h_' + Date.now(), lat, lon, radiusM, dato });
      leafletMap.removeLayer(previewCircle);
      slot.innerHTML = '';
      markingHogstMode = false;
      updateMarkHogstButton();
      await saveHogstOmrader();
      render();
    });
  }

  function updateMarkHogstButton(){
    const btn = document.getElementById('sp-mark-hogst');
    if (!btn) return;
    btn.textContent = markingHogstMode ? 'Klikk i kartet for å plassere senter (klikk her for å avbryte)' : '🪓 Merk hogstfelt i kart';
    btn.classList.toggle('active', markingHogstMode);
  }

  // ---------- wiring ----------
  // UX-gjennomgang 2026-08-14: selve .sp-toggle-knappen er kun 46×26px —
  // grei nok som visuell bryter, men et lite touch-mål i en tekstrad. Én
  // delegert lytter på hele raden (label + bryter) gir et reelt langt
  // større klikk-/trykkmål uten å måtte gjenta logikk per bryter under:
  // klikk hvor som helst i raden videresender et ekte klikk til selve
  // <button>-en (som fortsatt har sin egen listener, se under) — treffer
  // du selve bryteren direkte, fyres kun ÉN gang (event.target ER da
  // knappen, så delegatet lar den vanlige bubblingen gjøre jobben i
  // stedet for å dispatch'e et ekstra klikk).
  document.querySelectorAll('.sp-slider-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      const toggle = row.querySelector('.sp-toggle');
      if (!toggle || e.target === toggle) return;
      toggle.click();
    });
  });

  // Disse fem påvirker selve scoreLocation()-resultatet (ikke bare
  // visning/filtrering, som hideHogst/artskartOnlyRecent under) — bumper
  // derfor scoreCache før re-render, se scoreCache sin deklarasjon.
  document.getElementById('sp-toggle-quiet').addEventListener('click', () => { prioritizeQuiet = !prioritizeQuiet; bumpScoreCache(); render(); });
  document.getElementById('sp-toggle-sti').addEventListener('click', () => { weighTrailDistance = !weighTrailDistance; bumpScoreCache(); render(); });
  document.getElementById('sp-toggle-vei').addEventListener('click', () => { weighRoadDistance = !weighRoadDistance; bumpScoreCache(); render(); });
  document.getElementById('sp-toggle-ownhistory').addEventListener('click', () => { weighOwnFindHistory = !weighOwnFindHistory; bumpScoreCache(); render(); });
  document.getElementById('sp-toggle-weather').addEventListener('click', () => { weighWeather = !weighWeather; bumpScoreCache(); render(); });
  document.getElementById('sp-toggle-knownfinds').addEventListener('click', () => { deprioritizeKnownFinds = !deprioritizeKnownFinds; bumpScoreCache(); render(); });
  document.getElementById('sp-toggle-hogst').addEventListener('click', () => { hideHogst = !hideHogst; render(); });
  document.getElementById('sp-toggle-artskart-recent').addEventListener('click', () => { artskartOnlyRecent = !artskartOnlyRecent; render(); });
  // Påvirker IKKE min egen scoring/kart (kun hva ANDRE ser av mine funn),
  // så ingen bumpScoreCache() her — kun lagring + re-render for å
  // oppdatere selve bryteren sin visuelle "on"-tilstand.
  document.getElementById('sp-toggle-del-funn').addEventListener('click', async () => {
    delFunn = !delFunn;
    render();
    await saveDelFunn();
  });
  // RETTET (server-side filtrering): fylke/kommune-filterbytte re-henter nå
  // fra /terrengdata (se loadLocations()) i stedet for å kun filtrere et
  // allerede fullt innlastet array — await FØR render() slik at kartet ikke
  // et kort øyeblikk viser forrige filters steder.
  document.getElementById('sp-fylke-filter').addEventListener('change', async (e) => {
    fylkeFilter = e.target.value;
    clearRoute();
    zoomToAreaSelection();
    await loadLocations();
    render();
  });
  document.getElementById('sp-kommune-filter-input').addEventListener('change', async (e) => {
    const val = e.target.value.trim();
    kommuneFilter = val === '' ? 'alle' : val;
    clearRoute();
    zoomToAreaSelection();
    await loadLocations();
    render();
  });
  document.getElementById('sp-kommune-filter-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.target.blur(); // trigger 'change'
  });
  // RETTET 2026-08-12 (bruker meldte: velger man kommunenavn FØR fylke i
  // innsnevringen, "skjer det tilsynelatende ikke noe" når fylket velges;
  // velger man fylke FØRST og kommunenavn ETTERPÅ, "virker det som det
  // zoomes inn"). Rotårsak: denne handleren satte kun kommuneNarrowFylke og
  // re-renderte FILTER-KONTROLLENE — den trigget aldri et nytt kart-zoom
  // eller en ny data-henting. Rekkefølgen "fylke først" fungerte fordi
  // resolveKommuneNavn() da allerede fant riktig fylke i det kommune-feltets
  // EGEN change-handler (linje over) commitet navnet. Rekkefølgen "kommune
  // først" zoomet (feil/tvetydig) idet feltet mistet fokus, og selve
  // fylkevalget etterpå gjorde ingenting for å rette opp i det — helt stille,
  // ingen feilmelding, kun det usynlige varselet som forsvant. Kjører nå
  // samme zoom+data-oppfriskning som kommune-feltets commit, men KUN når et
  // kommunenavn faktisk allerede er valgt (ellers er det ingenting å zoome
  // til ennå).
  document.getElementById('sp-kommune-narrow-fylke').addEventListener('change', async (e) => {
    kommuneNarrowFylke = e.target.value;
    renderFilterControls();
    if (filterMode === 'kommune' && kommuneFilter !== 'alle') {
      clearRoute();
      zoomToAreaSelection();
      await loadLocations();
      render();
    }
  });
  document.getElementById('sp-kommune-clear').addEventListener('click', async () => {
    kommuneFilter = 'alle';
    document.getElementById('sp-kommune-filter-input').value = '';
    clearRoute();
    await loadLocations();
    render();
  });
  document.getElementById('sp-add-place').addEventListener('click', () => openFindModal(null, {}));
  document.getElementById('sp-map-fullscreen-toggle').addEventListener('click', () => toggleMapFullscreen());
  document.getElementById('sp-mobile-view-toggle').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-mobileview]');
    if (btn) setMobileView(btn.dataset.mobileview);
  });
  // Samme forventning som ved oppstart-geolokasjon (se geolocateStartupView):
  // hvis du allerede står i Radius-modus, oppdaterer "min posisjon" nå også
  // selve radius-senteret, ikke bare kartvisningen.
  document.getElementById('sp-my-location-btn').addEventListener('click', (e) => useMyLocation((lat, lon) => {
    showMyLocationOnMap(lat, lon);
    if (filterMode === 'radius') {
      radiusCenter = { lat, lon };
      zoomToRadiusSelection();
      render();
    }
  }, {
    // Lav nøyaktighet: dette klikket brukes kun til områdevalg (fylke/
    // kommune-nærhet, radius-senter på km-skala) — meter-presisjon gir
    // ingen merverdi her, men enableHighAccuracy=true kan gjøre oppslaget
    // merkbart tregere på en laptop uten GPS-brikke. maximumAge matcher
    // geolocateStartupView() sitt 5-minutters vindu, så et klikk kort tid
    // etter sideinnlasting kan gjenbruke samme oppslag momentant i stedet
    // for å vente på et helt nytt.
    enableHighAccuracy: false, maximumAge: 5 * 60 * 1000, buttonEl: e.currentTarget,
  }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mapFullscreen) toggleMapFullscreen(); });
  document.getElementById('sp-mark-hogst').addEventListener('click', () => {
    markingHogstMode = !markingHogstMode;
    updateMarkHogstButton();
  });
  // RETTET (server-side filtrering): filterMode avgjør HVILKET filter
  // currentServerFilterParams() sender (se loadLocations()), så et
  // modusbytte kan endre hvilket datasett som skal vises (f.eks. fra en
  // valgt kommune til "hele fylket" ved bytte til fylke-fane) — må derfor
  // re-hente, ikke bare re-rendre et allerede innlastet array.
  document.querySelectorAll('#sp-mode-seg button').forEach(btn => btn.addEventListener('click', async () => {
    filterMode = btn.dataset.mode;
    clearRoute();
    await loadLocations();
    if (filterMode === 'radius') zoomToRadiusSelection(); // vis hele sirkelen igjen om et senter allerede var valgt
    render();
  }));
  document.querySelectorAll('#sp-viewmode-seg button').forEach(btn => btn.addEventListener('click', () => { viewMode = btn.dataset.viewmode; clearRoute(); render(); }));
  // Debounces zoomToRadiusSelection() — 'input' fyrer kontinuerlig under
  // dragging, og fitBounds() på hver eneste mellomverdi ga en hakkete/
  // urolig kartanimasjon i stedet for én jevn bevegelse til sluttverdien.
  let radiusZoomDebounce = null;
  document.getElementById('sp-radius-slider').addEventListener('input', (e) => {
    radiusKm = parseInt(e.target.value);
    clearRoute();
    render();
    clearTimeout(radiusZoomDebounce);
    radiusZoomDebounce = setTimeout(zoomToRadiusSelection, 200);
  });
  document.getElementById('sp-radius-clear').addEventListener('click', () => { radiusCenter = null; clearRoute(); render(); });
  document.getElementById('sp-route-km-slider').addEventListener('input', (e) => {
    areaCount = parseInt(e.target.value);
    document.getElementById('sp-route-km-label').textContent = String(areaCount);
  });
  document.getElementById('sp-route-suggest').addEventListener('click', suggestAreas);
  document.getElementById('sp-route-clear').addEventListener('click', clearRoute);
  document.getElementById('sp-score-filter-slider').addEventListener('input', (e) => {
    minScoreFilter = parseInt(e.target.value);
    document.getElementById('sp-score-filter-label').textContent = minScoreFilter;
    render();
  });
  document.getElementById('sp-score-filter-hint').addEventListener('click', (e) => { e.preventDefault(); showAllPointsOnMap(); });

  (async function init(){
    wireVersionInfo();
    wireTabs();
    wireCollapsibles();
    wireA2HS();
    wireLoginForm();
    wireKodeForm();
    wireLogout();
    wireAdminPanel();
    wireFetchPanel();
    initMap();
    // RETTET 2026-08-12 (bruker meldte lang ventetid før kommune-fanen var
    // brukbar første gang): loadKommuneRegister() sto tidligere HELT SIST i
    // denne kjeden — etter innlogging OG all terrengdata — selv om den
    // henter fra en helt uavhengig, offentlig kilde (Kartverkets
    // Kommuneinfo-API) uten noen reell avhengighet til auth/personlig data.
    // Startes nå parallelt med det aller første kallet i stedet, slik at
    // ventetiden for kommunelisten blir MAX(dette kallet, resten av
    // oppstarten) i stedet for SUMMEN av alt som kom foran den. Fortsatt
    // ikke-blokkerende (ingen await her) — renderFilterControls() i .then()
    // oppdaterer UI når den er klar, uansett når det skjer.
    loadKommuneRegister().then(() => renderFilterControls());
    // geolocateStartupView() er uavhengig av initAuth() (ingen delt
    // tilstand) — kjøres parallelt av samme grunn som Promise.all-blokken
    // under, men MÅ være ferdig (eller ha gitt opp) FØR den, siden
    // loadArtsfunn() der leser leafletMap.getBounds() for sitt bbox-hent.
    await Promise.all([geolocateStartupView(), initAuth()]);
    // RETTET 2026-08-15 (UX-gjennomgang): listevisning er fortsatt default
    // på mobil for INNLOGGEDE brukere (mest nyttig når man har tusenvis av
    // ekte, scorede steder å skumlese) — men for en ikke-innlogget
    // besøkende med kun 1-2 demo-steder kommuniserer kartet ("se, nesten
    // ingenting her") mye tydeligere enn en liste som sier "1 av 1 steder
    // vist". Kun satt HER, ved oppstart — IKKE i render(), som ellers ville
    // tvunget brukeren tilbake til kartvisning igjen og igjen selv etter at
    // de bevisst har byttet til liste.
    if (!currentUser) setMobileView('kart');
    await checkUrlInvitasjon();
    // RETTET (lastetid): disse fire var tidligere sekvensielle await-kall
    // uten noen reell avhengighet mellom dem — hver skriver til sin egen,
    // usammenhengende globale tilstand (BASE_LOCATIONS/fetchedAreas/
    // artsfunn/userFinds osv.) og svelger allerede sine egne feil internt
    // (så en Promise.all her avviser aldri). Kjørt parallelt kutter
    // ventetiden fra summen av alle fire til den TREGESTE av dem.
    await Promise.all([loadLocations(), loadFetchedAreas(), loadArtsfunn(), loadStorage(), loadDelteFunn()]);
    // render() under trigger nå selv den første loadWeather()/
    // loadSeasonWeather()-kjøringen via maybeRefreshWeatherForScope() (se
    // den funksjonen) — ikke lenger et eget par kall her, se RETTET
    // 2026-08-15 ved refreshWeatherForScope()/render() for hvorfor
    // (samme mekanisme dekker nå også hvert senere filterbytte).
    render();
  })();

})();
