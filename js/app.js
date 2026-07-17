(function(){

  const APP_VERSION = '0.16.3';
  const APP_BUILD_DATE = '2026-07-17';

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

  const SPECIES = [
    { id:'kantarell', name:'Kantarell', latin:'Cantharellus cibarius', season:[7,10],
      treslag:['gran','furu','bjork'], skogalder:['middels','gammel'], fuktighet:['frisk','fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:35, minTempAvg:8 },
      why:(loc,t)=>`Blandingsskog med ${t.treslagTekst} og ${t.fuktighetTekst} bunn i mosedekket, ${t.alderTekst} skog — nøyaktig kombinasjonen kantarell liker best.`,
      fieldTips:'Gul-oransje traktformet hatt med bølget kant. Under hatten er det <b>lave, grove, gaffelgrenede ribber</b> som løper langt ned på stilken — ikke tynne, skarpe gjeller. Kjøttet er hvitt-gult gjennomgående, og lukten minner om modne aprikoser.',
      lookalike:'Falsk kantarell (Hygrophoropsis aurantiaca) ligner, men har tynne, skarpe, ekte gjeller (ikke butte ribber) og er mørkere oransje. Ikke farlig, men smaker dårlig — sjekk gjellene nøye.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/2007-07-14_Cantharellus_cibarius_cropped.jpg/500px-2007-07-14_Cantharellus_cibarius_cropped.jpg', artist:'Andreas Kunze', license:'CC BY-SA 4.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2007-07-14_Cantharellus_cibarius_cropped.jpg' } },
    { id:'traktkantarell', name:'Traktkantarell', latin:'Craterellus tubaeformis', season:[8,11],
      treslag:['gran'], skogalder:['middels','gammel'], fuktighet:['fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:20, idealNedbor14:45, minTempAvg:4 },
      why:(loc,t)=>`Fuktig, mosekledd granskog — traktkantarellens favorittmiljø. Tåler kjøligere vær enn kantarell.`,
      fieldTips:'Liten, gråbrun-gulbrun sopp med <b>trakt-/pipeformet hatt</b> og hul stilk. Undersiden har lave, grålilla-gule ribber. Vokser ofte i <b>tette forekomster</b> i tykt mosedekke.',
      lookalike:'Få farlige forvekslingsarter. Skilles fra svart trompetsopp på farge (gulbrun, ikke gråsvart) og fra rørsopper ved at det ikke er noe rørlag under hatten.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/2011-07-12_Craterellus_tubaeformis_71471.jpg/500px-2011-07-12_Craterellus_tubaeformis_71471.jpg', artist:'Mushroom Observer-bruker', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2011-07-12_Craterellus_tubaeformis_71471.jpg' } },
    { id:'trompetsopp', name:'Svart trompetsopp', latin:'Craterellus cornucopioides', season:[8,10],
      treslag:['bjork','gran'], skogalder:['gammel'], fuktighet:['fuktig'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:20, idealNedbor14:40, minTempAvg:6 },
      why:(loc,t)=>`Fuktig løv-/blandingsskog på ${t.berggrunnTekst} grunn — trompetsoppens foretrukne miljø, ofte sammen med hassel eller bøk/eik.`,
      fieldTips:'Gråsvart, traktformet og helt hul gjennom hele soppen, uten tydelige gjeller eller ribber (helt glatt eller svakt rynket underside). Ligner et lite, mørkt horn. Vokser ofte i store, skjulte klynger under løv.',
      lookalike:'Svært distinkt art med få forvekslingsfarer — hovedutfordringen er å få øye på den i skyggen mellom løv og mørk jord.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/2011-11-20_Craterellus_cornucopioides_%28L.%29_Pers_183522_cropped.jpg/500px-2011-11-20_Craterellus_cornucopioides_%28L.%29_Pers_183522_cropped.jpg', artist:'John Kirkpatrick (Mushroom Observer)', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2011-11-20_Craterellus_cornucopioides_(L.)_Pers_183522_cropped.jpg' } },
    { id:'steinsopp', name:'Steinsopp', latin:'Boletus edulis', season:[8,10],
      treslag:['gran','furu','bjork'], skogalder:['gammel'], fuktighet:['tørr','frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:20, idealNedbor14:40, minTempAvg:10 },
      why:(loc,t)=>`Eldre ${t.treslagTekst}-skog med blåbærlyng og ${t.fuktighetTekst} mark. Steinsopp trenger et varmt spell etterfulgt av regn.`,
      fieldTips:'Rørsopp: under hatten er det et <b>svampaktig rørlag</b>, aldri gjeller. Stilken er tykk, kølleformet, med fint hvitt <b>nettmønster</b> øverst. Kjøttet forblir hvitt og blir <b>ikke blått eller rødt</b> ved kutt.',
      lookalike:'Ingen rørsopper i Norge er giftige, men galleboletus (Tylopilus felleus) ligner og smaker svært bittert — sjekk at nettmønsteret er hvitt (ikke mørkt) og smak en liten bit rått (bitter = kast).',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Boletus_edulis1.jpg/500px-Boletus_edulis1.jpg', artist:'Tocekas', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:Boletus_edulis1.jpg' } },
    { id:'rodskrubb', name:'Rødskrubb / Brunskrubb', latin:'Leccinum versipelle / scabrum', season:[7,10],
      treslag:['bjork'], skogalder:['middels','gammel'], fuktighet:['frisk','fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:35, minTempAvg:8 },
      why:(loc,t)=>`Bjørkeinnslag i ${t.treslagTekst}-skog — disse rørsoppene lever i mykorrhiza spesifikt med bjørk.`,
      fieldTips:'Rørsopp med tynn, rank stilk dekket av mørke, skjellete flekker («skrubb»-mønster). Hatten er oransje-rød (rødskrubb) eller gråbrun (brunskrubb). Kjøttet kan mørkne noe ved kutt, men ikke blått/rødt kraftig.',
      lookalike:'Ingen farlige forvekslingsarter blant rørsopper i Norge. Vokser alltid nær bjørk — finner du den langt fra bjørk, sjekk artsbestemmelsen ekstra nøye.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/2006-09-02_Leccinum_versipelle.jpg/500px-2006-09-02_Leccinum_versipelle.jpg', artist:'Andreas Kunze', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2006-09-02_Leccinum_versipelle.jpg' } },
    { id:'matriske', name:'Furumatriske', latin:'Lactarius deliciosus', season:[8,10],
      treslag:['furu'], skogalder:['middels','gammel'], fuktighet:['tørr','frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Furudominert skog på ${t.berggrunnTekst} grunn. Matriske trenger furu som partner og sandholdig, veldrenert jord.`,
      fieldTips:'Kutt i lamellene: ekte matriske gir en <b>gulrotoransje melkesaft</b> som gradvis blir <b>grønnlig</b> ved oksidering. Hatten har ofte konsentriske, mørkere ringer. Vokser nesten utelukkende under furu.',
      lookalike:'⚠ De fleste alvorlige soppforgiftninger i Norge skjer fordi folk forveksler spiss giftslørsopp med matriske. Sjekk ALLTID melkesaften: ekte matriske "blør" tydelig gulrotoransje når du kutter i den — giftslørsopp gjør ikke det. Er du i tvil, la soppen stå.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/2009-09-28_Lactarius_deliciosus.jpg/500px-2009-09-28_Lactarius_deliciosus.jpg', artist:'furtwangl', license:'CC BY 2.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2009-09-28_Lactarius_deliciosus.jpg' } },
    { id:'piggsopp', name:'Piggsopp (lys)', latin:'Hydnum repandum', season:[8,10],
      treslag:['gran','bjork','furu'], skogalder:['middels','gammel'], fuktighet:['frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Blandingsskog med ${t.treslagTekst} gir gode vertstrær for piggsopp, mindre kravstor enn kantarell.`,
      fieldTips:'Under hatten: i stedet for gjeller/rør har piggsopp <b>myke, hengende pigger</b>. Kremhvit-lys oransje, tykt kjøtt. Mild i smak.',
      lookalike:'Bruk kun lyse piggsopper med lys hatt og lyse pigger. Mørkhattede piggsopper (bitterpiggsopp) er ikke farlige, men smaker svært bittert — kjenn etter på farge og smak en liten bit rått.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/2012-08-29_Hydnum_repandum_L_256175.jpg/500px-2012-08-29_Hydnum_repandum_L_256175.jpg', artist:'Alan Rockefeller (Mushroom Observer)', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2012-08-29_Hydnum_repandum_L_256175.jpg' } },
    { id:'faresopp', name:'Fåresopp', latin:'Albatrellus ovinus', season:[7,9],
      treslag:['gran'], skogalder:['gammel'], fuktighet:['frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Gammel granskog med mose — fåresopp vokser direkte i bakken, ofte i ring, nær gran.`,
      fieldTips:'Lys, kremhvit poresopp som vokser <b>på bakken</b> (ikke på trær), ofte flere sammenvokste hatter. Fine porer under hatten, ikke gjeller. Fast, hvitt kjøtt.',
      lookalike:'Lyse poresopper som vokser på bakken i Norge har ingen farlige forvekslingsarter — hovedregelen er lys farge og bakkevekst (ikke å forveksle med kjuker som vokser på trestammer).',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Albatrellus_ovinus_1.jpg/500px-Albatrellus_ovinus_1.jpg', artist:'Karelj', license:'Public domain', sourcePage:'https://commons.wikimedia.org/wiki/File:Albatrellus_ovinus_1.jpg' } },
    { id:'parasollsopp', name:'Parasollsopp (stor)', latin:'Macrolepiota procera', season:[7,10],
      treslag:['apen','bjork'], skogalder:['apen','middels'], fuktighet:['frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:10, idealNedbor14:25, minTempAvg:8 },
      why:(loc,t)=>`Åpne skogkanter og lysninger på ${t.berggrunnTekst} grunn — store parasollsopper trives i gress- og feltsjikt i overgangssoner.`,
      fieldTips:'Stor sopp (kan bli 20-40 cm høy) med lang, slank stilk som har et tydelig <b>slangeskinn-mønster</b> og en løs, bevegelig <b>dobbeltring</b>. Hatten er brun-skjellete og parasollformet når utsprunget.',
      lookalike:'⚠ Bruk kun STORE eksemplarer med tydelig slangemønster på stilken og fri, bevegelig ring — små, brune paraplysopper (Lepiota-arter) kan være dødelig giftige og ligner unge parasollsopper. Er soppen liten, la den stå.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/1_-_Macrolepiota_procera_%28St%C5%AFl%29.JPG/500px-1_-_Macrolepiota_procera_%28St%C5%AFl%29.JPG', artist:'Fredy.00', license:'Public domain', sourcePage:'https://commons.wikimedia.org/wiki/File:1_-_Macrolepiota_procera_(St%C5%AFl).JPG' } },
    { id:'sjampinjong', name:'Markjordbær-sjampinjong', latin:'Agaricus campestris', season:[7,10],
      treslag:['apen'], skogalder:['apen'], fuktighet:['frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:10, idealNedbor14:25, minTempAvg:8 },
      why:(loc,t)=>`Åpen beitemark/eng på ${t.berggrunnTekst} grunn — sjampinjong vokser i gress, liker kalkholdig jord.`,
      fieldTips:'Sjekk tre ting: <b>rosa gjeller</b> som mørkner til sjokoladebrune, en løs <b>ring på stilken</b>, og kjøtt som <b>ikke blir gult</b> ved trykk.',
      lookalike:'⚠ Unge, hvite fluesopp-knapper kan i sjeldne tilfeller minne om sjampinjong før hatten er utsprunget. Sjekk ALLTID gjellefargen (rosa/brun hos sjampinjong, aldri hvit) og grav opp foten — ekte sjampinjong har ingen "eggeskall" (volva) ved roten.',
      image:{ url:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/2010-08-07_Agaricus_campestris.jpg/500px-2010-08-07_Agaricus_campestris.jpg', artist:'Andreas Kunze', license:'CC BY-SA 3.0', sourcePage:'https://commons.wikimedia.org/wiki/File:2010-08-07_Agaricus_campestris.jpg' } },
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
    { id:'demo-1', name:'Eksempelskog A (demo)', fylke:'Demo', kommune:'Demo', lat:60.0, lon:10.0, treslag:['gran','bjork'], skogalder:'gammel', fuktighet:'frisk', berggrunn:'fattig', avstandVeiM:null, befolkning:'ukjent', hogstAr:null, kjenteFunn:[], custom:false, kjorbarVei:'ukjent', parkeringNotat:'Koble til ditt private data-repo for ekte steder', stier:'ukjent', avstandParkeringM:null },
    { id:'demo-2', name:'Eksempelskog B (demo)', fylke:'Demo', kommune:'Demo', lat:60.2, lon:10.4, treslag:['furu'], skogalder:'middels', fuktighet:'tørr', berggrunn:'moderat', avstandVeiM:null, befolkning:'ukjent', hogstAr:null, kjenteFunn:[], custom:false, kjorbarVei:'ukjent', parkeringNotat:'Koble til ditt private data-repo for ekte steder', stier:'ukjent', avstandParkeringM:null }
  ];

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
  let hideHogst = false;
  let artskartOnlyRecent = false; // vis kun Artsdatabanken-funn siste år i kartlaget — se renderArtskartLayer
  // Skjuler kun LISTEN under en viss score — kartet fortsetter å vise alle
  // steder i området (fargekodet etter score) slik at man kan oppdage og
  // klikke seg til lavere-scorende punkter der uten å måtte senke terskelen.
  let minScoreFilter = 0;
  let filterMode = 'fylke'; // 'fylke' | 'kommune' | 'radius'
  let fylkeFilter = 'alle';
  let kommuneFilter = 'alle';
  let radiusCenter = null;
  let radiusKm = 20;
  let weatherBySpecies = {};
  let weatherReady = false;
  let seasonWeather = null; // { totalPrecip, avgTemp, months:[{label,precip,tempAvg}], dryStreakDays }, se loadSeasonWeather()
  let seasonWeatherReady = false;
  let userFinds = [];
  let userCuts = [];
  let hogstOmrader = []; // [{id, lat, lon, radiusM, dato}] — egne merkede flatehogd-OMRÅDER,
                          // uavhengig av om det finnes et eksisterende målepunkt i dem (se scoreLocation)
  let markingHogstMode = false;
  let customLocations = [];
  let fetchedAreas = [];
  let artsfunn = []; // ekte Artsdatabanken-observasjoner — se loadArtsfunn()
  let gridKm = 1.5;
  let kommuneRegister = []; // {kommunenavn, fylkesnavn} — hentet fra Kartverkets Kommuneinfo-API
  let kommuneNarrowFylke = 'alle';
  let fetchInProgress = false;
  let fetchPollTimer = null;
  let bboxAreaCache = {}; // cache av Nominatim bbox-areal per fylke/kommune-navn

  const monthNow = new Date().getMonth() + 1;
  const yearNow = new Date().getFullYear();

  function allLocations(){ return BASE_LOCATIONS.concat(customLocations); }

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

  // ---------- storage (GitHub-som-database i privat data-repo, med lokal fallback) ----------
  let personalSha = null; // sha til personal.json på GitHub, trengs for å oppdatere

  function defaultPaths(){
    return { locationsPath: 'data/locations.json', personalPath: 'data/personal.json' };
  }

  async function loadStorage(){
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    if (cfg && window.FungiStore.isConfigured()) {
      try {
        const result = await window.FungiStore.loadFile(cfg.personalPath || defaultPaths().personalPath);
        personalSha = result.sha;
        const d = result.data || {};
        userFinds = d.finds || [];
        userCuts = d.cuts || [];
        hogstOmrader = d.hogstOmrader || [];
        customLocations = d.customLocations || [];
        favoriteSpecies = d.favoriteSpecies || [];
        setSyncStatus(`✓ Koblet til ${cfg.owner}/${cfg.repo}`);
        return;
      } catch (e) {
        console.error(e);
        setSyncStatus('⚠ Kunne ikke laste personlige data — bruker lokal kopi. ' + e.message);
      }
    }
    const local = window.FungiStore ? window.FungiStore.loadLocal('personal') : null;
    userFinds = local?.finds || [];
    userCuts = local?.cuts || [];
    hogstOmrader = local?.hogstOmrader || [];
    customLocations = local?.customLocations || [];
    favoriteSpecies = local?.favoriteSpecies || [];
  }

  async function persistAll(){
    const payload = { finds: userFinds, cuts: userCuts, hogstOmrader: hogstOmrader, customLocations: customLocations, favoriteSpecies: favoriteSpecies };
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    if (cfg && window.FungiStore.isConfigured()) {
      try {
        personalSha = await window.FungiStore.saveFile(cfg.personalPath || defaultPaths().personalPath, payload, personalSha);
        setSyncStatus(`✓ Lagret til ${cfg.owner}/${cfg.repo} (${new Date().toLocaleTimeString('no')})`);
        return;
      } catch (e) {
        console.error(e);
        setSyncStatus('⚠ Lagring feilet, lagret lokalt i stedet. ' + e.message);
      }
    }
    if (window.FungiStore) window.FungiStore.saveLocal('personal', payload);
  }
  async function saveFinds(){ await persistAll(); }
  async function saveCuts(){ await persistAll(); }
  async function saveHogstOmrader(){ await persistAll(); }
  async function saveFavorites(){ await persistAll(); }
  async function saveCustomLocations(){ await persistAll(); }

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

  // Ikke-hemmelige deler av tilkoblingen (eier/repo/stier) speiles i URL-en som
  // en reconnect-fallback: hvis lokal lagring blir tømt (f.eks. Safaris
  // 7-dagers ITP-opprydding i en sesongbasert app som denne), men siden ble
  // bokmerket/lagret ETTER tilkobling, kan disse feltene forhåndsutfylles fra
  // URL-en igjen — da gjenstår bare å lime inn tokenet på nytt.
  function syncParamsFromUrl(){
    const p = new URLSearchParams(location.search);
    const owner = p.get('owner'), repo = p.get('repo');
    if (!owner || !repo) return null;
    return {
      owner, repo,
      locationsPath: p.get('locationsPath') || undefined,
      personalPath: p.get('personalPath') || undefined
    };
  }

  function reflectConfigInUrl(cfg){
    const p = new URLSearchParams(location.search);
    p.set('owner', cfg.owner);
    p.set('repo', cfg.repo);
    if (cfg.locationsPath) p.set('locationsPath', cfg.locationsPath); else p.delete('locationsPath');
    if (cfg.personalPath) p.set('personalPath', cfg.personalPath); else p.delete('personalPath');
    history.replaceState(null, '', location.pathname + '?' + p.toString());
  }

  function wireSyncPanel(){
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    const defaults = defaultPaths();
    const fromUrl = cfg ? null : syncParamsFromUrl();
    if (cfg) {
      document.getElementById('sync-repo').value = `${cfg.owner}/${cfg.repo}`;
      document.getElementById('sync-locations-path').value = cfg.locationsPath || defaults.locationsPath;
      document.getElementById('sync-personal-path').value = cfg.personalPath || defaults.personalPath;
    } else if (fromUrl) {
      document.getElementById('sync-repo').value = `${fromUrl.owner}/${fromUrl.repo}`;
      document.getElementById('sync-locations-path').value = fromUrl.locationsPath || defaults.locationsPath;
      document.getElementById('sync-personal-path').value = fromUrl.personalPath || defaults.personalPath;
      setSyncStatus('Eier/repo gjenkjent fra lenken — lim inn tokenet på nytt for å koble til.');
    } else {
      document.getElementById('sync-locations-path').value = defaults.locationsPath;
      document.getElementById('sync-personal-path').value = defaults.personalPath;
    }
    document.getElementById('sp-sync-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const repoVal = document.getElementById('sync-repo').value.trim();
      const locationsPath = document.getElementById('sync-locations-path').value.trim() || defaults.locationsPath;
      const personalPath = document.getElementById('sync-personal-path').value.trim() || defaults.personalPath;
      const token = document.getElementById('sync-token').value.trim();
      const [owner, repo] = repoVal.split('/');
      if (!owner || !repo || !token) { setSyncStatus('⚠ Fyll ut eier/repo og token.'); return; }
      setSyncStatus('Kobler til … sjekker repo-innstillinger');
      let branch = 'main';
      try {
        branch = await window.FungiStore.detectDefaultBranch(owner, repo, token);
      } catch (e) {
        console.warn('Kunne ikke autodetektere default-branch, bruker "main".', e);
        setSyncStatus('⚠ Kunne ikke bekrefte repo/branch — sjekk eier/repo-navn. Prøver med "main".');
      }
      window.FungiStore.setConfig({ owner, repo, locationsPath, personalPath, token, branch });
      reflectConfigInUrl({ owner, repo, locationsPath, personalPath });
      setSyncStatus(`Kobler til … (branch: ${branch})`);
      await loadLocations();
      await loadFetchedAreas();
      await loadArtsfunn();
      await loadStorage();
      render();
    });
    document.getElementById('sync-disconnect').addEventListener('click', async () => {
      window.FungiStore.clearConfig();
      setSyncStatus('Koblet fra — bruker lokal/eksempeldata på denne enheten.');
      // Uten dette forble de tilkoblingsgatede funksjonene (funn/hogst/
      // "foreslå områder") synlige til noe ANNET tilfeldigvis trigget en ny
      // render() — f.eks. et filterbytte.
      await loadLocations();
      await loadStorage();
      clearRoute();
      render();
    });
  }

  // ---------- lokasjonsdata (fra privat data-repo via GitHub API, med innebygd fallback) ----------
  async function loadLocations(){
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    if (cfg && window.FungiStore.isConfigured()) {
      try {
        const result = await window.FungiStore.loadFile(cfg.locationsPath || defaultPaths().locationsPath);
        if (result.data && Array.isArray(result.data) && result.data.length) {
          BASE_LOCATIONS = result.data;
          window.FungiStore.saveLocal('locations', result.data); // cache lokalt for rask offline-fallback neste gang
          return;
        }
      } catch (e) {
        console.warn('Kunne ikke laste terrengdata fra GitHub, prøver lokal cache/eksempeldata.', e);
      }
    }
    const cached = window.FungiStore ? window.FungiStore.loadLocal('locations') : null;
    if (cached && Array.isArray(cached) && cached.length) {
      BASE_LOCATIONS = cached;
    }
    // Ellers: beholder den innebygde SAMPLE_LOCATIONS-fallbacken definert øverst i filen.
  }

  async function loadFetchedAreas(){
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    if (cfg && window.FungiStore.isConfigured()) {
      try {
        const result = await window.FungiStore.loadFile('data/fetched-areas.json');
        fetchedAreas = Array.isArray(result.data) ? result.data : [];
        return;
      } catch (e) {
        console.warn('Kunne ikke laste fetched-areas.json.', e);
      }
    }
    fetchedAreas = [];
  }

  // Ekte Artsdatabanken-observasjoner (art/koordinat/dato), hentet av
  // fetch_area.py og akkumulert i data/artsfunn.json — se
  // fetch_artskart_observations_for_fylke() i data-repoet.
  async function loadArtsfunn(){
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    if (cfg && window.FungiStore.isConfigured()) {
      try {
        const result = await window.FungiStore.loadFile('data/artsfunn.json');
        artsfunn = Array.isArray(result.data) ? result.data : [];
        return;
      } catch (e) {
        console.warn('Kunne ikke laste artsfunn.json.', e);
      }
    }
    artsfunn = [];
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

  function currentAreaLabel(){
    if (filterMode === 'fylke') return fylkeFilter !== 'alle' ? fylkeFilter : null;
    if (filterMode === 'kommune') return kommuneFilter !== 'alle' ? kommuneFilter : null;
    if (filterMode === 'radius') return radiusCenter ? `${radiusKm} km rundt valgt punkt` : null;
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
    const areaLabel = currentAreaLabel();
    if (!areaLabel) { line.style.display = 'none'; suggestBtn.disabled = false; return; }
    line.style.display = '';
    if (count === 0) {
      line.innerHTML = `⚠ Ingen kjente punkter i ${escapeHtml(areaLabel)} ennå — <a href="#sp-fetch-panel" id="sp-coverage-fetch-link">hent terrengdata</a> først.`;
      suggestBtn.disabled = true;
      const link = document.getElementById('sp-coverage-fetch-link');
      if (link) link.addEventListener('click', (e) => {
        e.preventDefault();
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

  // Henter (og cacher) bounding box for et fylke/kommune-navn via Nominatim.
  // Delt av areal-estimatet (Hent-data-panelet) og kart-zoom ved valg, slik
  // at vi ikke gjør to separate Nominatim-kall for samme navn.
  async function fetchAreaBbox(mode, name){
    if (!name || name === 'alle') return null;
    const key = mode + ':' + name;
    if (bboxAreaCache[key] !== undefined) return bboxAreaCache[key].bbox;
    try {
      const q = mode === 'fylke' ? `${name} fylke, Norge` : `${name}, Norge`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1`, {
        headers: { 'Accept-Language': 'no' }
      });
      const json = await res.json();
      if (!json.length) { bboxAreaCache[key] = { bbox: null }; return null; }
      const bb = json[0].boundingbox.map(parseFloat); // [south, north, west, east]
      bboxAreaCache[key] = { bbox: bb };
      return bb;
    } catch (e) {
      console.warn('Kunne ikke hente bbox via Nominatim', e);
      bboxAreaCache[key] = { bbox: null };
      return null;
    }
  }

  async function estimateAreaKm2(){
    if (filterMode === 'radius') return Math.PI * radiusKm * radiusKm;
    const name = filterMode === 'fylke' ? fylkeFilter : kommuneFilter;
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
    const name = filterMode === 'fylke' ? fylkeFilter : kommuneFilter;
    if (!name || name === 'alle') return;
    const bb = await fetchAreaBbox(filterMode, name);
    if (!bb) return;
    leafletMap.fitBounds([[bb[0], bb[2]], [bb[1], bb[3]]], { maxZoom: 12, padding: [20, 20] });
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
    if (!window.FungiStore || !window.FungiStore.isConfigured()) return null;
    try {
      const run = await window.FungiStore.getLatestRun('fetch-area.yml');
      if (run && (run.status === 'queued' || run.status === 'in_progress')) return run;
    } catch (e) { /* stille feil her — dette er kun en høflig sjekk */ }
    return null;
  }

  async function updateFetchPanel(coverageCount){
    const panel = document.getElementById('sp-fetch-panel');
    // Selve GitHub Actions-triggeren er allerede sperret i startFetch() for en
    // ikke-tilkoblet besøkende, men panelet ble likevel vist og gjorde et ekte
    // kartoppslag (estimateAreaKm2 -> fetchAreaBbox) for hvert fylke/kommune-
    // valg — nettverkstrafikk uten poeng siden hentingen uansett aldri kan
    // fullføres. Skjul panelet helt (og hopp over oppslaget) i stedet.
    if (!personalFeaturesEnabled()) { panel.style.display = 'none'; return; }
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
    if (!window.FungiStore || !window.FungiStore.isConfigured()) {
      document.getElementById('sp-fetch-info').textContent = 'Koble til ditt private data-repo under "Config" først.';
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
    else if (filterMode === 'kommune') { inputs.mode = 'kommune'; inputs.value = kommuneFilter; }
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
      await window.FungiStore.triggerWorkflow('fetch-area.yml', inputs);
      progress.textContent = '⏳ Jobb bedt om å starte — venter på at GitHub Actions registrerer den nye kjøringen (kan ta 10-30 sekunder) …';
      pollFetchStatus(progress, dispatchedAt);
    } catch (e) {
      console.error(e);
      progress.textContent = '⚠ Kunne ikke starte jobben: ' + e.message + ' (sjekk at tokenet har "Actions: Read and write")';
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
        const run = await window.FungiStore.getLatestRun('fetch-area.yml', sinceIso);
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
    const locs = allLocations();

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
          const last14p = precipArr.slice(0,14);
          const last5t = tempArr.slice(9,14);
          const sumP = last14p.reduce((a,b)=>a+(b||0),0);
          const avgT = last5t.length ? last5t.reduce((a,b)=>a+(b||0),0)/last5t.length : null;
          const entry = { precip14: Math.round(sumP*10)/10, tempAvg: avgT!==null? Math.round(avgT*10)/10 : null, fetchedAt: now };
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
      if (cell) weatherBySpecies[loc.id] = { precip14: cell.precip14, tempAvg: cell.tempAvg };
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
    render();
  }

  // ---------- sesongvær (vekstsesong-historikk) ----------
  // Henter hele vekstsesongens (1. mai -> i dag) nedbør/temperatur for ETT
  // representativt punkt (senter av alle lastede steder) via Open-Meteos
  // gratis arkiv-API. Formålet er å fange opp om sesongen totalt sett har
  // vært våt eller tørr — noe et rent 14-dagersvindu ikke fanger opp (f.eks.
  // en ellers tørr sommer som nettopp har fått litt regn de siste 14 dagene).
  // Hentes på ett representativt punkt, ikke per lokasjon, for å unngå
  // hundrevis av kall for et sesonglangt datasett.
  const SEASON_WEATHER_CACHE_MAX_AGE_HOURS = 6;

  async function loadSeasonWeather(){
    const locs = allLocations();
    if (!locs.length) return;
    const lat = locs.reduce((a,l)=>a+l.lat,0) / locs.length;
    const lon = locs.reduce((a,l)=>a+l.lon,0) / locs.length;
    const now = new Date();
    const seasonStart = `${now.getFullYear()}-05-01`;
    const todayStr = now.toISOString().slice(0,10);

    // Centroiden flytter seg litt etter hvert som flere områder hentes, så
    // avrundes til ~11 km for en stabil cache-nøkkel som fortsatt treffer på
    // tvers av sideinnlastinger samme dag/kveld.
    const cacheKey = `fungifinder-season-weather-${lat.toFixed(1)}_${lon.toFixed(1)}`;
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        if ((Date.now() - cached.fetchedAt) < SEASON_WEATHER_CACHE_MAX_AGE_HOURS * 3600 * 1000 && cached.data) {
          seasonWeather = cached.data;
          seasonWeatherReady = true;
          renderSeasonWeatherBox();
          return;
        }
      }
    } catch(e) { /* ignorer korrupt cache */ }

    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat.toFixed(3)}&longitude=${lon.toFixed(3)}&start_date=${seasonStart}&end_date=${todayStr}&daily=precipitation_sum,temperature_2m_mean&timezone=Europe%2FOslo`;
      const res = await fetch(url);
      if (res.status === 429) throw new Error('429 Too Many Requests (Open-Meteo arkiv)');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      const dates = (data.daily && data.daily.time) || [];
      const precipArr = (data.daily && data.daily.precipitation_sum) || [];
      const tempArr = (data.daily && data.daily.temperature_2m_mean) || [];
      if (!dates.length) throw new Error('tomt datasett');

      const monthNames = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
      const monthBuckets = {};
      let totalPrecip = 0, tempSum = 0, tempCount = 0;
      let dryStreak = 0, longestDryStreak = 0;
      dates.forEach((d, i) => {
        const p = precipArr[i], t = tempArr[i];
        const monthIdx = parseInt(d.slice(5,7), 10) - 1;
        if (!monthBuckets[monthIdx]) monthBuckets[monthIdx] = { precip: 0, tempSum: 0, tempCount: 0 };
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
      seasonWeather = {
        totalPrecip: Math.round(totalPrecip),
        avgTemp: tempCount ? Math.round(tempSum/tempCount*10)/10 : null,
        months,
        dryStreakDays: longestDryStreak,
        days: dates.length
      };
      seasonWeatherReady = true;
      try { localStorage.setItem(cacheKey, JSON.stringify({ fetchedAt: Date.now(), data: seasonWeather })); } catch(e) { /* full/blokkert lagring — ignorer, gjelder bare cache */ }
    } catch (e) {
      console.warn('Sesongvær feilet', e);
      seasonWeatherReady = false;
    }
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
    box.innerHTML = `<span class="sp-wstatus">✓ sesongoversikt (${sw.days} dager, 1. mai–i dag)</span><br/>
      Totalt <b>${sw.totalPrecip} mm</b> nedbør, snitt <b>${sw.avgTemp ?? '–'}°C</b>. Lengste tørkeperiode: ${sw.dryStreakDays} dager.<br/>
      <span style="opacity:.8">${monthsHtml}</span>`;
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
  // nettleserkontekst som GitHub-tokenet ditt ligger lagret i (localStorage).
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
  // ---------------------------------------------------------------------
  function scoreLocation(species, loc){
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
    const funnDetaljer = (loc.kjenteFunnDetaljer || []).filter(f => f.art === species.id);
    if (funnDetaljer.length) {
      const naerFunn = funnDetaljer.some(f => f.avstandM < 300);
      const densityScore = Math.min(10, funnDetaljer.length * 2 + (naerFunn ? 3 : 0));
      total += densityScore;
      breakdown.push([`${funnDetaljer.length} kjente Artsdatabanken-funn i nærheten${naerFunn ? ' (inkl. et svært nært)' : ''}`, densityScore]);
    } else if (loc.kjenteFunn && loc.kjenteFunn.includes(species.id)) {
      total += 5; breakdown.push(['Tidligere kjente funn i nærheten (database)', 5]);
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
    if (weatherReady && w) {
      const prof = species.weather;
      let wScore = 0;
      if (w.precip14 >= prof.idealNedbor14) { wScore = 12; weatherVerdict = 'Godt fuktnivå — gode odds nå.'; }
      else if (w.precip14 >= prof.minNedbor14) { wScore = 6; weatherVerdict = 'Litt tørt, men innen rekkevidde.'; }
      else { wScore = -6; weatherVerdict = 'For tørt siste 14 dager — vent til mer nedbør.'; }
      if (prof.minTempAvg !== undefined && w.tempAvg !== null && w.tempAvg < prof.minTempAvg - 4) { wScore -= 4; weatherVerdict += ' Også kjøligere enn ideelt.'; }
      total += wScore; breakdown.push(['Værvindu (nedbør/temp)', wScore]);
    }

    // Sesonghistorikk (1. mai -> i dag) — egen, mindre modifikator ved siden
    // av det ferske 14-dagersvinduet over. Fanger opp en sesong som totalt
    // sett har vært tørr/våt, selv om de siste 14 dagene alene ser greie ut
    // (eller motsatt). idealNedbor14 brukes som et grovt ukentlig referansenivå
    // og skaleres opp til sesongens lengde — bevisst holdt upresist/lav vekt,
    // se samme resonnement som elevationScore om å ikke tallfeste mer presist
    // enn datagrunnlaget faktisk tillater.
    if (seasonWeatherReady && seasonWeather && species.weather.idealNedbor14) {
      const expectedSeasonPrecip = species.weather.idealNedbor14 * (seasonWeather.days / 14);
      const ratio = expectedSeasonPrecip > 0 ? seasonWeather.totalPrecip / expectedSeasonPrecip : 1;
      let seasonScore = 0, seasonNote = null;
      if (ratio >= 0.9) { seasonScore = 4; seasonNote = 'God sesong hittil — nok nedbør over tid til gode vekstforhold.'; }
      else if (ratio < 0.5) { seasonScore = -4; seasonNote = 'Tørr sesong hittil — kan gi svakere oppblomstring selv med fuktighet nå.'; }
      if (seasonScore !== 0) {
        total += seasonScore;
        breakdown.push(['Sesonghistorikk (nedbør mai–i dag)', seasonScore]);
        weatherVerdict = weatherVerdict ? `${weatherVerdict} ${seasonNote}` : seasonNote;
      }
    }

    const myFinds = findsFor(loc.id, species.id);
    let histNote = null;
    if (myFinds.length) {
      const avgM = myFinds.reduce((a,f)=>a+f.mengde,0) / myFinds.length;
      const histPts = Math.min(20, Math.round(5 + avgM*3 + Math.min(myFinds.length,5)));
      total += histPts;
      breakdown.push([`Egen funnhistorikk (${myFinds.length} funn, snitt ${avgM.toFixed(1)}/5)`, histPts]);
      histNote = `Du har selv funnet ${species.name.toLowerCase()} her ${myFinds.length} gang${myFinds.length>1?'er':''} tidligere, snitt mengde ${avgM.toFixed(1)}/5 — dette teller sterkt i vurderingen.`;
    }

    total = Math.max(0, Math.min(100, Math.round(total)));
    return { total, breakdown, isCut, weatherVerdict, weather: w, histNote, accessTags: acc.tags };
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

  // Henter hele fylke/kommune-registeret fra Kartverkets offisielle Kommuneinfo-API.
  // Brukes i stedet for en hardkodet kommuneliste — Kartverket er alltid oppdatert
  // ved reformer (f.eks. planlagt endring i 2028), og jeg kan ikke garantere at
  // en liste over alle 357 kommuner fra hukommelsen ville vært 100% korrekt.
  // VERIFISER: nøyaktig endepunkt/feltnavn er satt opp basert på dokumentasjon,
  // ikke testet med faktisk nettverkstilgang i miljøet dette ble bygget i.
  // Feiler kallet, faller appen tilbake til kun å vise "Alle fylker" som filter
  // og bygge kommunelisten fra allerede lastet stedsdata (som før).
  async function loadKommuneRegister(){
    const CACHE_KEY = 'fungifinder-kommuneregister';
    const CACHE_MAX_AGE_DAYS = 30;
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw);
        const ageDays = (Date.now() - cached.fetchedAt) / (1000*60*60*24);
        if (ageDays < CACHE_MAX_AGE_DAYS && Array.isArray(cached.data) && cached.data.length) {
          kommuneRegister = cached.data;
          return;
        }
      }
    } catch(e) { /* ignorer korrupt cache */ }

    try {
      const res = await fetch('https://ws.geonorge.no/kommuneinfo/v1/kommuner');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const list = Array.isArray(json) ? json : (json.kommuner || []);
      kommuneRegister = list.map(k => ({
        kommunenavn: k.kommunenavnNorsk || k.kommunenavn || k.navn,
        fylkesnavn: k.fylkesnavn || (k.fylke && k.fylke.fylkesnavn) || null
      })).filter(k => k.kommunenavn);
      if (kommuneRegister.length) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data: kommuneRegister }));
      } else {
        throw new Error('Uventet responsformat fra Kommuneinfo-API');
      }
    } catch (e) {
      console.warn('Kunne ikke hente kommuneregister fra Kartverket — faller tilbake til lokal stedsdata.', e);
      kommuneRegister = [];
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
  let artskartMoveDebounce = null; // se moveend-lytteren i initMap()
  let findMarkersById = {};
  let mapFittedOnce = false;
  let markersById = {};
  let areaCount = 5;
  let suggestedRoute = null; // { areas: [{anchor, members, radiusM}] } — se suggestAreas()
  let mapFullscreen = false;

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

  // ---------- min posisjon (GPS, engangs) ----------
  // Bevisst engangs (getCurrentPosition), ikke løpende sporing (watchPosition)
  // — dekker "jeg har parkert, vis meg oversikten" og "fyll inn koordinatene
  // for et funn jeg registrerer nå" uten batteribruk fra kontinuerlig sporing.
  let myLocationMarker = null;

  function useMyLocation(onSuccess){
    if (!navigator.geolocation) {
      alert('Nettleseren din støtter ikke posisjonsdeling.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => onSuccess(pos.coords.latitude, pos.coords.longitude),
      (err) => alert('Kunne ikke hente posisjonen din: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function showMyLocationOnMap(lat, lon){
    if (!leafletMap) return;
    if (myLocationMarker) leafletMap.removeLayer(myLocationMarker);
    myLocationMarker = L.circleMarker([lat, lon], {
      radius: 9, color: '#fff', weight: 3, fillColor: '#2E6FE0', fillOpacity: 1
    }).bindPopup('📍 Du er her').addTo(leafletMap);
    leafletMap.setView([lat, lon], Math.max(leafletMap.getZoom(), 14));
    myLocationMarker.openPopup();
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

    markerLayer = L.layerGroup().addTo(leafletMap);
    radiusLayer = L.layerGroup().addTo(leafletMap);
    routeLayer = L.layerGroup().addTo(leafletMap);
    hogstLayer = L.layerGroup().addTo(leafletMap);
    findsLayer = L.layerGroup().addTo(leafletMap);
    artskartLayer = L.layerGroup().addTo(leafletMap);

    // Lag-kontroll: bytt bakgrunnskart (radioknapper) og skru målepunkter/
    // rundtur/hogstfelt/funn av/på (avkrysning) — praktisk når man vil se
    // rent terreng for å merke seg egne funnsteder uten at prikkene er i veien.
    L.control.layers(
      { 'Topografisk (Kartverket)': topoLayer, 'Standard': standardLayer, 'Satellitt': satelliteLayer },
      { 'Målepunkter': markerLayer, 'Foreslåtte områder': routeLayer, 'Mine hogstfelt': hogstLayer, 'Mine funn': findsLayer, 'Artsdatabanken-funn': artskartLayer },
      { collapsed: true }
    ).addTo(leafletMap);

    leafletMap.on('click', (e) => {
      if (markingHogstMode) {
        openHogstOmradeModal(e.latlng.lat, e.latlng.lng);
      } else if (filterMode === 'radius') {
        radiusCenter = { lat: e.latlng.lat, lon: e.latlng.lng };
        clearRoute();
        render();
      } else {
        openFindModal(null, { lat: e.latlng.lat, lon: e.latlng.lng });
      }
    });

    // Artskart-laget er bundet til det synlige kartutsnittet (se
    // renderArtskartLayer) — må derfor oppdateres når du panorerer/zoomer,
    // ikke bare ved filter-/artsbytte. 'moveend' dekker begge deler i
    // Leaflet (zooming trigger også moveend). Debounces 300ms slik at et
    // helt drag ikke filtrerer gjennom artsfunn (30 000+ oppføringer) for
    // hver eneste mellomposisjon.
    leafletMap.on('moveend', () => {
      clearTimeout(artskartMoveDebounce);
      artskartMoveDebounce = setTimeout(renderArtskartLayer, 300);
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
      const color = res.isCut ? '#A23E2E' : (res.total>=65 ? '#5F7A3E' : res.total>=40 ? '#C8974A' : '#A23E2E');
      const marker = L.circleMarker([loc.lat, loc.lon], {
        radius: 8,
        color: loc.custom ? '#8C4A20' : '#232D1D',
        weight: 1.5,
        fillColor: color,
        fillOpacity: 0.85,
        dashArray: loc.custom ? '3,3' : null
      });
      marker.bindPopup(`<b>${escapeHtml(loc.name)}</b><br/>${escapeHtml(loc.kommune)}, ${escapeHtml(loc.fylke)}<br/>Score: ${res.total}${res.isCut ? ' — flatehogd' : ''}`);
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
  const AREA_RADIUS_KM = 1.2;

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
  // det er mulig å parkere (se findParkingForAreas) — loc.parkeringNotat/
  // avstandParkeringM (fra ETL-en) er kun avstand+tekst, ALDRI selve
  // koordinaten til parkeringsplassen, så et faktisk punkt på kartet krever
  // dette ferske Overpass-oppslaget.
  function renderAreasOnMap(){
    if (!routeLayer || !suggestedRoute) return;
    routeLayer.clearLayers();
    const { areas } = suggestedRoute;
    areas.forEach((a, i) => {
      const score = a.anchor.res.total;
      const color = score >= 65 ? '#5F7A3E' : score >= 40 ? '#C8974A' : '#A23E2E';
      const parkeringTekst = a.parking
        ? `🅿️ Mulig parkering ca ${a.parking.distM} m fra sentrum av området${a.parking.access ? ` (merket "${escapeHtml(a.parking.access)}" på kart — bekreft på stedet)` : ''}`
        : '🅿️ Ingen kjent parkeringsplass funnet i nærheten (OSM)';
      L.circle([a.anchor.loc.lat, a.anchor.loc.lon], {
        radius: a.radiusM, color, weight: 2.5, dashArray: '8,8', fillColor: color, fillOpacity: 0.07
      }).bindPopup(`<b>Område ${i+1}: ${escapeHtml(a.anchor.loc.name)}</b><br/>Beste score i området: ${score}<br/>${parkeringTekst}<br/>${describeRouteTerrain(a.members)}`)
        .addTo(routeLayer);

      if (a.parking) {
        L.marker([a.parking.lat, a.parking.lon], {
          icon: L.divIcon({ className: 'sp-parking-icon', html: 'P', iconSize: [22,22] })
        }).bindPopup(`<b>Parkering — Område ${i+1}</b><br/>${escapeHtml(a.parking.name)}<br/>${a.parking.access ? `Merket tilgang: ${escapeHtml(a.parking.access)} — bekreft på stedet.` : 'Ingen tilgangsbegrensning merket i kartdata.'}`)
          .addTo(routeLayer);
      }
    });
    if (areas.length) leafletMap.fitBounds(L.featureGroup(routeLayer.getLayers()).getBounds().pad(0.15));
  }

  // RETTET 2026-07-11: ETT samlet Overpass-kall for alle områdene ga 504
  // Gateway Timeout i praksis (verifisert i preview — se samtalen om
  // enrich-point sin Overpass-bbox for samme mønster: kombinerte spørringer
  // er mindre stabile enn små, individuelle). Ett lite kall PER område i
  // stedet — tregere totalt (sekvensielt, med høflig pause mellom), men én
  // enkelt feil/timeout rammer da kun DET området, ikke alle på én gang.
  const AREA_PARKING_SEARCH_RADIUS_M = 2000;
  const AREA_PARKING_MAX_RETRIES = 2;

  async function fetchParkingNear(lat, lon){
    const query = `[out:json][timeout:20];(node["amenity"="parking"](around:${AREA_PARKING_SEARCH_RADIUS_M},${lat},${lon});way["amenity"="parking"](around:${AREA_PARKING_SEARCH_RADIUS_M},${lat},${lon}););out center;`;
    for (let attempt = 1; attempt <= AREA_PARKING_MAX_RETRIES; attempt++) {
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(query) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        return (data.elements || [])
          .map(el => {
            const c = el.center || el;
            return { lat: c.lat, lon: c.lon, name: (el.tags && el.tags.name) || 'Parkeringsplass', access: el.tags && el.tags.access };
          })
          .filter(p => p.lat != null && p.lon != null);
      } catch (e) {
        if (attempt === AREA_PARKING_MAX_RETRIES) {
          console.warn(`Parkeringssøk feilet for (${lat}, ${lon}) etter ${AREA_PARKING_MAX_RETRIES} forsøk`, e);
          return [];
        }
        await new Promise(r => setTimeout(r, 1500 * attempt));
      }
    }
    return [];
  }

  async function findParkingForAreas(areas, onProgress){
    const results = [];
    for (let i = 0; i < areas.length; i++) {
      if (onProgress) onProgress(i + 1, areas.length);
      const a = areas[i];
      const points = await fetchParkingNear(a.anchor.loc.lat, a.anchor.loc.lon);
      let best = null, bestDistM = Infinity;
      for (const p of points) {
        const d = haversineKm(a.anchor.loc.lat, a.anchor.loc.lon, p.lat, p.lon) * 1000;
        if (d <= AREA_PARKING_SEARCH_RADIUS_M && d < bestDistM) { bestDistM = d; best = p; }
      }
      results.push(best ? { ...best, distM: Math.round(bestDistM) } : null);
      if (i < areas.length - 1) await new Promise(r => setTimeout(r, 300)); // høflig pause mellom kall
    }
    return results;
  }

  async function suggestAreas(){
    if (!personalFeaturesEnabled()) {
      alert('Koble til ditt private data-repo under ⚙ Preferanser & Config → Config for å foreslå områder.');
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
    const scoped = scoredAll.filter(s => {
      if (s.res.isCut) return false;
      if (filterMode === 'fylke') return fylkeFilter === 'alle' || s.loc.fylke === fylkeFilter;
      if (filterMode === 'kommune') return kommuneFilter === 'alle' || s.loc.kommune === kommuneFilter;
      if (filterMode === 'radius' && radiusCenter) return haversineKm(radiusCenter.lat, radiusCenter.lon, s.loc.lat, s.loc.lon) <= radiusKm;
      return true;
    });

    if (!scoped.length) {
      summary.innerHTML = 'Ingen steder å foreslå områder fra i valgt område.' + fetchNudgeHtml(0);
      wireFetchNudgeLink();
      return;
    }

    // Velger inntil `areaCount` distinkte, topp-scorende anker-punkter, minst
    // AREA_RADIUS_KM fra hverandre. Grupperer deretter ALLE scorede punkter
    // rundt sitt nærmeste anker for å bestemme sirkelens utstrekning og
    // terreng-beskrivelsen (se describeRouteTerrain).
    const anchors = clusterIntoZones(scoped, areaCount, AREA_RADIUS_KM);
    if (!anchors.length) {
      summary.textContent = 'Fant ingen gode områder i valgt filter.';
      return;
    }

    const areas = anchors.map(anchor => {
      const members = scoped.filter(s => haversineKm(anchor.loc.lat, anchor.loc.lon, s.loc.lat, s.loc.lon) <= AREA_RADIUS_KM);
      const spreadM = Math.max(0, ...members.map(m => haversineKm(anchor.loc.lat, anchor.loc.lon, m.loc.lat, m.loc.lon) * 1000));
      const radiusM = Math.min(1800, Math.max(400, spreadM + 200)); // liten margin utenfor ytterste kjente punkt
      return { anchor, members, radiusM };
    });

    const parkingByArea = await findParkingForAreas(areas, (n, total) => {
      summary.textContent = `Fant områdene — søker etter parkering (${n}/${total}) …`;
    });
    areas.forEach((a, i) => { a.parking = parkingByArea[i]; });

    suggestedRoute = { areas };
    renderAreasOnMap();

    const overskrift = areas.length === 1 ? '<b>1 godt område</b> foreslått' : `<b>${areas.length} gode områder</b> foreslått`;
    summary.innerHTML = `
      ${overskrift} i valgt område (stiplede sirkler i kartet, farget etter score — klikk en sirkel eller 🅿️-markøren for detaljer).<br/>
      ${areas.map((a, i) => `<div class="sp-route-area-item">Område ${i+1}: <b>${escapeHtml(a.anchor.loc.name)}</b> (${escapeHtml(a.anchor.loc.kommune || 'ukjent kommune')}) — beste score ${a.anchor.res.total}, ${a.members.length} kjent${a.members.length===1?'':'e'} punkt${a.members.length===1?'':'er'} i området. ${a.parking ? `🅿️ ca ${a.parking.distM} m unna.` : '🅿️ ingen kjent parkering funnet.'}</div>`).join('')}
      <span style="font-size:11px;opacity:0.8;">Sirklene markerer OMRÅDER med gode odds, ikke eksakte punkter eller en gåtur mellom dem — bruk det topografiske kartlaget til å utforske selv innenfor sirkelen. Parkeringsmarkører er hentet live fra OpenStreetMap og kan avvike fra virkeligheten — bekreft alltid på stedet.</span>
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
    return `<div class="sp-route-nudge" style="margin-top:8px;font-size:12px;color:var(--ink-soft);">Tynt datagrunnlag her (${count} punkt${count===1?'':'er'}) — <a href="#sp-fetch-panel" id="sp-route-nudge-link">hent mer terrengdata</a> for bedre forslag.</div>`;
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
  }

  function gaugeSvg(score){
    const r = 26, c = 2*Math.PI*r, pct = score/100;
    const color = score>=65 ? '#5F7A3E' : score>=40 ? '#C8974A' : '#A23E2E';
    return `<svg width="66" height="66" viewBox="0 0 66 66">
      <circle cx="33" cy="33" r="${r}" fill="none" stroke="rgba(38,48,31,0.12)" stroke-width="6"/>
      <circle cx="33" cy="33" r="${r}" fill="none" stroke="${color}" stroke-width="6" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}" stroke-linecap="round" transform="rotate(-90 33 33)"/>
      <text x="33" y="37" text-anchor="middle" font-family="Fraunces, serif" font-weight="600" font-size="17" fill="#232D1D">${score}</text>
    </svg>`;
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
          <div class="sp-gauge-wrap" data-score-loc="${loc.id}" data-score-species="${species_for_card().id}" title="Klikk for å se score-beregningen">${gaugeSvg(res.total)}<div class="sp-gauge-label">score</div></div>
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
        <div class="sp-access-box">
          <div>🚗 <b>Parkering:</b> ${escapeHtml(loc.parkeringNotat) || 'ikke oppgitt'}${parkWarn ? ' <span class="sp-access-warn">— bekreft selv at det ikke er privat grunn</span>' : ''}</div>
          <div>🥾 <b>Sti/skogsbilvei i terrenget:</b> ${loc.stier==='ja'?'ja':loc.stier==='nei'?'nei, ingen kjent sti':'ukjent'}${loc.avstandParkeringM ? ` · ca ${loc.avstandParkeringM} m å gå fra parkering` : ''}</div>
        </div>
        ${res.histNote ? `<div class="sp-hist-note">★ ${res.histNote}</div>` : ''}
        ${knownFindsHtml(loc, species_for_card().id)}
        <div class="sp-explain">${species_for_card().why(loc, t)}</div>
        <div class="sp-microtips-label">Sjekk spesielt i terrenget her</div>
        <ul class="sp-microtips">${terrainMicrotips(species_for_card(), loc).map(tip => `<li>${tip}</li>`).join('')}</ul>
        ${crossSpeciesTipsHtml(loc, species_for_card().id)}
        ${w ? `<div class="sp-breakdown">Vær nå: <span>${w.precip14} mm</span> nedbør siste 14 dager, snitt temp <span>${w.tempAvg ?? '–'}°C</span>. ${res.weatherVerdict || ''}</div>` : ''}
        ${finds.length ? `<div class="sp-findlist">${finds.map(f => `<div class="sp-find-row"><span>${SPECIES.find(s=>s.id===f.speciesId)?.name || f.speciesId} — ${f.date}</span><span class="sp-dots">${[1,2,3,4,5].map(n=>`<span class="${n<=f.mengde?'filled':''}"></span>`).join('')}</span></div>`).join('')}</div>` : ''}
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
          ${favResults.map(r => `<span class="sp-fav-score-chip ${r.res.isCut?'cut':''}" data-score-loc="${loc.id}" data-score-species="${r.species.id}" title="Klikk for å se score-beregningen">${escapeHtml(r.species.name)} <b>${r.res.total}</b></span>`).join('')}
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
        <div class="sp-access-box">
          <div>🚗 <b>Parkering:</b> ${escapeHtml(loc.parkeringNotat) || 'ikke oppgitt'}${parkWarn ? ' <span class="sp-access-warn">— bekreft selv at det ikke er privat grunn</span>' : ''}</div>
          <div>🥾 <b>Sti/skogsbilvei i terrenget:</b> ${loc.stier==='ja'?'ja':loc.stier==='nei'?'nei, ingen kjent sti':'ukjent'}${loc.avstandParkeringM ? ` · ca ${loc.avstandParkeringM} m å gå fra parkering` : ''}</div>
        </div>
        ${res.histNote ? `<div class="sp-hist-note">★ ${res.histNote}</div>` : ''}
        ${knownFindsHtml(loc, topSpecies.id)}
        <div class="sp-explain"><b>${escapeHtml(topSpecies.name)}:</b> ${topSpecies.why(loc, t)}</div>
        <div class="sp-microtips-label">Sjekk spesielt i terrenget her (for ${escapeHtml(topSpecies.name)})</div>
        <ul class="sp-microtips">${terrainMicrotips(topSpecies, loc).map(tip => `<li>${tip}</li>`).join('')}</ul>
        ${crossSpeciesTipsHtml(loc, topSpecies.id, { hideFavorites: true })}
        ${w ? `<div class="sp-breakdown">Vær nå: <span>${w.precip14} mm</span> nedbør siste 14 dager, snitt temp <span>${w.tempAvg ?? '–'}°C</span>. ${res.weatherVerdict || ''}</div>` : ''}
        ${finds.length ? `<div class="sp-findlist">${finds.map(f => `<div class="sp-find-row"><span>${SPECIES.find(s=>s.id===f.speciesId)?.name || f.speciesId} — ${f.date}</span><span class="sp-dots">${[1,2,3,4,5].map(n=>`<span class="${n<=f.mengde?'filled':''}"></span>`).join('')}</span></div>`).join('')}</div>` : ''}
        <div class="sp-card-actions">
          ${personalFeaturesEnabled() ? `<button class="sp-btn sp-primary" data-action="find" data-loc="${loc.id}">Registrer funn her</button>` : ''}
          <button class="sp-btn" data-action="locate" data-loc="${loc.id}">📍 Vis i kart</button>
          ${personalFeaturesEnabled() ? `<button class="sp-btn sp-ghost-danger" data-action="cut" data-loc="${loc.id}">${userCuts.includes(loc.id)?'Fjern hogst-merking':'Merk som flatehogd'}</button>` : ''}
        </div>
      </div>`;
  }

  let _currentSpecies = null;
  function species_for_card(){ return _currentSpecies; }

  function render(){
    renderSpeciesList();
    renderMyFindsList();
    renderFilterControls();
    // "Foreslå områder" gir ingen mening uten ekte terrengdata (kun 2
    // demo-punkter uten tilkobling), og gjør et ekte, levende Overpass-kall
    // for parkering — skjules derfor helt for en ikke-tilkoblet besøkende
    // i stedet for å bare la den feile/være tom ved klikk.
    const routeEnabled = personalFeaturesEnabled();
    document.getElementById('sp-route-panel').style.display = routeEnabled ? '' : 'none';
    document.getElementById('sp-route-disabled-note').style.display = routeEnabled ? 'none' : '';
    document.getElementById('sp-toggle-quiet').classList.toggle('on', prioritizeQuiet);
    document.getElementById('sp-toggle-hogst').classList.toggle('on', hideHogst);
    document.getElementById('sp-toggle-artskart-recent').classList.toggle('on', artskartOnlyRecent);

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

    renderMap(scoredAll);
    renderHogstZones();
    renderFindsLayer();

    let scoped = scoredAll.filter(s => {
      if (filterMode === 'fylke') return fylkeFilter === 'alle' || s.loc.fylke === fylkeFilter;
      if (filterMode === 'kommune') return kommuneFilter === 'alle' || s.loc.kommune === kommuneFilter;
      if (filterMode === 'radius' && radiusCenter) return haversineKm(radiusCenter.lat, radiusCenter.lon, s.loc.lat, s.loc.lon) <= radiusKm;
      return true;
    });

    const coverageCount = scoped.length;
    updateCoverageLine(coverageCount);
    if (hideHogst) scoped = scoped.filter(s => !s.res.isCut);
    renderArtskartLayer();
    scoped.sort((a,b) => {
      if (a.res.isCut !== b.res.isCut) return a.res.isCut ? 1 : -1;
      return b.res.total - a.res.total;
    });

    updateFetchPanel(coverageCount);

    const areaLabel = filterMode === 'fylke' ? (fylkeFilter!=='alle' ? ' i ' + fylkeFilter : '')
      : filterMode === 'kommune' ? (kommuneFilter!=='alle' ? ' i ' + kommuneFilter : '')
      : (radiusCenter ? ` innen ${radiusKm} km` : '');

    const container = document.getElementById('sp-results');
    if (viewMode === 'favorites' && !favoriteSpecies.length) {
      document.getElementById('sp-count').textContent = '';
      container.innerHTML = `<div class="sp-empty">Ingen favoritter valgt ennå. Klikk ★ på en eller flere arter i lista til venstre for å komme i gang.</div>`;
      return;
    }
    if (!scoped.length) {
      document.getElementById('sp-count').textContent = `0 steder vist${areaLabel}`;
      container.innerHTML = `<div class="sp-empty">Ingen steder passerer filtrene dine akkurat nå${areaLabel}. ${filterMode==='radius' && !radiusCenter ? 'Klikk i kartet for å sette et senterpunkt.' : 'Prøv «Alle fylker/kommuner» eller juster radius.'}</div>`;
      return;
    }

    // minScoreFilter tynner kun ut LISTEN (og kun blant anbefalte, ikke
    // flatehogde) — kartet over viser alltid alle steder i området, uansett
    // score, slik at man kan oppdage og klikke seg til dem der i stedet.
    const activeOnes = scoped.filter(s => !s.res.isCut && s.res.total >= minScoreFilter);
    const hiddenByScore = scoped.filter(s => !s.res.isCut && s.res.total < minScoreFilter).length;
    const cutOnes = scoped.filter(s => s.res.isCut);

    document.getElementById('sp-count').textContent = `${activeOnes.length + cutOnes.length} av ${scoped.length} steder vist${areaLabel}`
      + (hiddenByScore ? ` — ${hiddenByScore} skjult under score ${minScoreFilter}` : '');

    if (!activeOnes.length && !cutOnes.length) {
      container.innerHTML = `<div class="sp-empty">Ingen steder over valgt minimumsscore (${minScoreFilter})${areaLabel} — senk terskelen over, eller se kartet for alle ${scoped.length} steder i området.</div>`;
      return;
    }

    const renderCard = viewMode === 'favorites'
      ? (s) => cardHtmlFavorites(s.loc, s.favResults)
      : (s) => cardHtml(s.loc, s.res);
    let html = activeOnes.map(renderCard).join('');
    if (cutOnes.length) {
      html += `<div class="sp-divider-excl">flatehogd — ikke anbefalt</div>`;
      html += cutOnes.map(renderCard).join('');
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
      kjorbarVei: 'ukjent', parkeringNotat: null, stier: 'ukjent', avstandParkeringM: null,
    });
    return { locId: id, isNew: true };
  }

  // Trigger enrich-point.yml (se fungifinder-db) for ETT nyopprettet sted —
  // kalles KUN etter at personal.json faktisk er lagret (se onSave i
  // openFindModal), ellers kan jobben starte og sjekke ut filen før stedet
  // er pushet, og finne ingenting å berike.
  async function triggerPointEnrichment(locationId, lat, lon){
    if (!window.FungiStore || !window.FungiStore.isConfigured()) return; // ingen synk koblet til — stedet blir værende "ukjent", men scorer likevel
    const dispatchedAt = new Date(Date.now() - 5000).toISOString();
    try {
      await window.FungiStore.triggerWorkflow('enrich-point.yml', { locationId, lat: String(lat), lon: String(lon) });
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
        const run = await window.FungiStore.getLatestRun('enrich-point.yml', dispatchedAt);
        if (run && run.status === 'completed') {
          if (run.conclusion === 'success') {
            await loadStorage();
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
      alert('Koble til ditt private data-repo under ⚙ Preferanser & Config → Config for å registrere funn.');
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
          <h4>${opts.title || (editingFind ? 'Rediger funn — ' + escapeHtml(loc ? loc.name : '') : (loc ? 'Registrer funn — ' + escapeHtml(loc.name) : 'Registrer nytt funn'))}</h4>
          ${opts.sub ? `<div class="sp-modal-sub">${opts.sub}</div>` : ''}
          <label>Sopptype</label>
          <select id="sp-find-species">${SPECIES.map(s => `<option value="${s.id}" ${s.id===(editingFind?editingFind.speciesId:selectedSpecies)?'selected':''}>${s.name}</option>`).join('')}</select>
          <label>Mengde funnet</label>
          <div class="sp-scale" id="sp-find-scale">${[1,2,3,4,5].map(n => `<button data-n="${n}" class="${n===mengde?'sel':''}">${n}</button>`).join('')}</div>
          ${needsPosition ? `
          <label>Posisjon</label>
          <div class="sp-2col">
            <button type="button" class="sp-mini-btn" id="sp-find-use-my-position">📍 Bruk min posisjon</button>
            <span id="sp-find-position-display" style="align-self:center;font-size:12.5px;color:var(--ink-soft);">${pendingLat!=null ? pendingLat.toFixed(5)+', '+pendingLon.toFixed(5) : 'Ikke satt — bruk knappen, eller lukk og klikk i kartet der du fant den'}</span>
          </div>` : ''}
          <label>Dato</label>
          <input type="date" id="sp-find-date" value="${editingFind ? editingFind.date : todayStr}"/>
          <label>Notat (valgfritt)</label>
          <textarea id="sp-find-note" rows="2" placeholder="F.eks. nordvendt skråning nær bekken">${editingFind ? escapeHtml(editingFind.note || '') : ''}</textarea>
          <div class="sp-modal-actions">
            <button class="sp-btn" id="sp-find-cancel">${opts.skipLabel || 'Avbryt'}</button>
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
      document.getElementById('sp-find-use-my-position').addEventListener('click', () => {
        useMyLocation((lat, lon) => {
          pendingLat = lat; pendingLon = lon;
          document.getElementById('sp-find-position-display').textContent = lat.toFixed(5) + ', ' + lon.toFixed(5);
        });
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
      circle.bindPopup(`<b>Flatehogd-område</b><br/>Merket ${escapeHtml(z.dato || '')}, radius ${z.radiusM} m<br/><button data-remove-hogst="${z.id}" class="sp-btn sp-ghost-danger" style="margin-top:6px;">Fjern</button>`);
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
      marker.bindPopup(`<b>${escapeHtml(sp ? sp.name : f.speciesId)}</b><br/>${f.date} · mengde ${f.mengde}/5${f.note ? '<br/>' + escapeHtml(f.note) : ''}<br/><button data-edit-find-popup="${f.id}" class="sp-btn" style="margin-top:6px;">✏️ Rediger</button>`);
      marker.on('popupopen', (e) => {
        const btn = e.popup._contentNode.querySelector('[data-edit-find-popup]');
        if (btn) btn.addEventListener('click', () => openFindModal(null, { editingFind: userFinds.find(x => x.id === f.id) }));
      });
      marker.addTo(findsLayer);
      findMarkersById[f.id] = marker;
    });
  }

  function locateFindOnMap(findId){
    const find = userFinds.find(f => f.id === findId);
    const pos = find && findLatLon(find);
    if (!pos || !leafletMap) return;
    if (findsLayer && !leafletMap.hasLayer(findsLayer)) leafletMap.addLayer(findsLayer);
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
      marker.bindPopup(`<b>${escapeHtml(sp ? sp.name : o.art)}</b><br/>${escapeHtml(o.dato || 'ukjent dato')}${o.url ? `<br/><a href="${escapeHtml(o.url)}" target="_blank" rel="noopener">Se på Artskart →</a>` : ''}`);
      marker.addTo(artskartLayer);
    });
  }

  function personalFeaturesEnabled(){
    return !!(window.FungiStore && window.FungiStore.isConfigured());
  }

  // Registrering av funn/hogstfelt er meningsløst uten et tilkoblet privat
  // data-repo (ville bare skrive til localStorage på denne ene enheten) — så
  // knappene skjules og lista erstattes med en tilkoblingsoppfordring i stedet
  // for å late som funksjonen "virker" for en ikke-tilkoblet besøkende.
  function renderMyFindsList(){
    const el = document.getElementById('sp-myfinds-list');
    const addBtn = document.getElementById('sp-add-place');
    const hogstBtn = document.getElementById('sp-mark-hogst');
    const enabled = personalFeaturesEnabled();
    addBtn.style.display = enabled ? '' : 'none';
    hogstBtn.style.display = enabled ? '' : 'none';
    if (!enabled) {
      el.innerHTML = `<div class="sp-empty-mine">Koble til ditt private data-repo under ⚙ Preferanser &amp; Config → Config for å registrere funn og hogstfelt.</div>`;
      return;
    }
    if (!userFinds.length) { el.innerHTML = `<div class="sp-empty-mine">Ingen funn registrert ennå.</div>`; return; }
    const sorted = [...userFinds].sort((a,b) => (b.date||'').localeCompare(a.date||''));
    el.innerHTML = sorted.map(f => {
      const sp = SPECIES.find(s => s.id === f.speciesId);
      const loc = allLocations().find(l => l.id === f.locId);
      const pending = loc && loc.enrichStatus === 'pending';
      return `<div class="sp-mine-row">
        <span>${escapeHtml(sp ? sp.name : f.speciesId)} <span style="opacity:.6">— ${escapeHtml(loc ? loc.name : 'ukjent sted')} · ${f.date}</span>${pending ? ' <span class="sp-tag" title="Terrengdata hentes i bakgrunnen — funnet teller allerede i vurderingen">⏳ beriker …</span>' : ''}</span>
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
      useMyLocation(async (lat, lon) => {
        find.lat = lat; find.lon = lon;
        await saveFinds();
        render();
      });
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
  document.getElementById('sp-toggle-quiet').addEventListener('click', () => { prioritizeQuiet = !prioritizeQuiet; render(); });
  document.getElementById('sp-toggle-hogst').addEventListener('click', () => { hideHogst = !hideHogst; render(); });
  document.getElementById('sp-toggle-artskart-recent').addEventListener('click', () => { artskartOnlyRecent = !artskartOnlyRecent; render(); });
  document.getElementById('sp-fylke-filter').addEventListener('change', (e) => { fylkeFilter = e.target.value; clearRoute(); zoomToAreaSelection(); render(); });
  document.getElementById('sp-kommune-filter-input').addEventListener('change', (e) => {
    const val = e.target.value.trim();
    kommuneFilter = val === '' ? 'alle' : val;
    clearRoute();
    zoomToAreaSelection();
    render();
  });
  document.getElementById('sp-kommune-filter-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.target.blur(); // trigger 'change'
  });
  document.getElementById('sp-kommune-narrow-fylke').addEventListener('change', (e) => {
    kommuneNarrowFylke = e.target.value;
    renderFilterControls();
  });
  document.getElementById('sp-kommune-clear').addEventListener('click', () => {
    kommuneFilter = 'alle';
    document.getElementById('sp-kommune-filter-input').value = '';
    clearRoute();
    render();
  });
  document.getElementById('sp-add-place').addEventListener('click', () => openFindModal(null, {}));
  document.getElementById('sp-map-fullscreen-toggle').addEventListener('click', () => toggleMapFullscreen());
  document.getElementById('sp-my-location-btn').addEventListener('click', () => useMyLocation(showMyLocationOnMap));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && mapFullscreen) toggleMapFullscreen(); });
  document.getElementById('sp-mark-hogst').addEventListener('click', () => {
    markingHogstMode = !markingHogstMode;
    updateMarkHogstButton();
  });
  document.querySelectorAll('#sp-mode-seg button').forEach(btn => btn.addEventListener('click', () => { filterMode = btn.dataset.mode; clearRoute(); render(); }));
  document.querySelectorAll('#sp-viewmode-seg button').forEach(btn => btn.addEventListener('click', () => { viewMode = btn.dataset.viewmode; clearRoute(); render(); }));
  document.getElementById('sp-radius-slider').addEventListener('input', (e) => { radiusKm = parseInt(e.target.value); clearRoute(); render(); });
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

  (async function init(){
    wireVersionInfo();
    wireTabs();
    wireCollapsibles();
    wireSyncPanel();
    wireFetchPanel();
    initMap();
    await loadLocations();
    await loadFetchedAreas();
    await loadArtsfunn();
    await loadStorage();
    loadKommuneRegister().then(() => renderFilterControls()); // ikke-blokkerende, oppdaterer UI når klar
    render();
    loadWeather();
    loadSeasonWeather();
  })();

})();
