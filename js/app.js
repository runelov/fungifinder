(function(){

  const APP_VERSION = '0.5.0';
  const APP_BUILD_DATE = '2026-07-08';

  const SPECIES = [
    { id:'kantarell', name:'Kantarell', latin:'Cantharellus cibarius', season:[7,10],
      treslag:['gran','furu','bjork'], skogalder:['middels','gammel'], fuktighet:['frisk','fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:35, minTempAvg:8 },
      why:(loc,t)=>`Blandingsskog med ${t.treslagTekst} og ${t.fuktighetTekst} bunn i mosedekket, ${t.alderTekst} skog — nøyaktig kombinasjonen kantarell liker best.`,
      fieldTips:'Gul-oransje traktformet hatt med bølget kant. Under hatten er det <b>lave, grove, gaffelgrenede ribber</b> som løper langt ned på stilken — ikke tynne, skarpe gjeller. Kjøttet er hvitt-gult gjennomgående, og lukten minner om modne aprikoser.',
      lookalike:'Falsk kantarell (Hygrophoropsis aurantiaca) ligner, men har tynne, skarpe, ekte gjeller (ikke butte ribber) og er mørkere oransje. Ikke farlig, men smaker dårlig — sjekk gjellene nøye.' },
    { id:'traktkantarell', name:'Traktkantarell', latin:'Craterellus tubaeformis', season:[8,11],
      treslag:['gran'], skogalder:['middels','gammel'], fuktighet:['fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:20, idealNedbor14:45, minTempAvg:4 },
      why:(loc,t)=>`Fuktig, mosekledd granskog — traktkantarellens favorittmiljø. Tåler kjøligere vær enn kantarell.`,
      fieldTips:'Liten, gråbrun-gulbrun sopp med <b>trakt-/pipeformet hatt</b> og hul stilk. Undersiden har lave, grålilla-gule ribber. Vokser ofte i <b>tette forekomster</b> i tykt mosedekke.',
      lookalike:'Få farlige forvekslingsarter. Skilles fra svart trompetsopp på farge (gulbrun, ikke gråsvart) og fra rørsopper ved at det ikke er noe rørlag under hatten.' },
    { id:'trompetsopp', name:'Svart trompetsopp', latin:'Craterellus cornucopioides', season:[8,10],
      treslag:['bjork','gran'], skogalder:['gammel'], fuktighet:['fuktig'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:20, idealNedbor14:40, minTempAvg:6 },
      why:(loc,t)=>`Fuktig løv-/blandingsskog på ${t.berggrunnTekst} grunn — trompetsoppens foretrukne miljø, ofte sammen med hassel eller bøk/eik.`,
      fieldTips:'Gråsvart, traktformet og helt hul gjennom hele soppen, uten tydelige gjeller eller ribber (helt glatt eller svakt rynket underside). Ligner et lite, mørkt horn. Vokser ofte i store, skjulte klynger under løv.',
      lookalike:'Svært distinkt art med få forvekslingsfarer — hovedutfordringen er å få øye på den i skyggen mellom løv og mørk jord.' },
    { id:'steinsopp', name:'Steinsopp', latin:'Boletus edulis', season:[8,10],
      treslag:['gran','furu','bjork'], skogalder:['gammel'], fuktighet:['tørr','frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:20, idealNedbor14:40, minTempAvg:10 },
      why:(loc,t)=>`Eldre ${t.treslagTekst}-skog med blåbærlyng og ${t.fuktighetTekst} mark. Steinsopp trenger et varmt spell etterfulgt av regn.`,
      fieldTips:'Rørsopp: under hatten er det et <b>svampaktig rørlag</b>, aldri gjeller. Stilken er tykk, kølleformet, med fint hvitt <b>nettmønster</b> øverst. Kjøttet forblir hvitt og blir <b>ikke blått eller rødt</b> ved kutt.',
      lookalike:'Ingen rørsopper i Norge er giftige, men galleboletus (Tylopilus felleus) ligner og smaker svært bittert — sjekk at nettmønsteret er hvitt (ikke mørkt) og smak en liten bit rått (bitter = kast).' },
    { id:'rodskrubb', name:'Rødskrubb / Brunskrubb', latin:'Leccinum versipelle / scabrum', season:[7,10],
      treslag:['bjork'], skogalder:['middels','gammel'], fuktighet:['frisk','fuktig'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:35, minTempAvg:8 },
      why:(loc,t)=>`Bjørkeinnslag i ${t.treslagTekst}-skog — disse rørsoppene lever i mykorrhiza spesifikt med bjørk.`,
      fieldTips:'Rørsopp med tynn, rank stilk dekket av mørke, skjellete flekker («skrubb»-mønster). Hatten er oransje-rød (rødskrubb) eller gråbrun (brunskrubb). Kjøttet kan mørkne noe ved kutt, men ikke blått/rødt kraftig.',
      lookalike:'Ingen farlige forvekslingsarter blant rørsopper i Norge. Vokser alltid nær bjørk — finner du den langt fra bjørk, sjekk artsbestemmelsen ekstra nøye.' },
    { id:'matriske', name:'Furumatriske', latin:'Lactarius deliciosus', season:[8,10],
      treslag:['furu'], skogalder:['middels','gammel'], fuktighet:['tørr','frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Furudominert skog på ${t.berggrunnTekst} grunn. Matriske trenger furu som partner og sandholdig, veldrenert jord.`,
      fieldTips:'Kutt i lamellene: ekte matriske gir en <b>gulrotoransje melkesaft</b> som gradvis blir <b>grønnlig</b> ved oksidering. Hatten har ofte konsentriske, mørkere ringer. Vokser nesten utelukkende under furu.',
      lookalike:'⚠ De fleste alvorlige soppforgiftninger i Norge skjer fordi folk forveksler spiss giftslørsopp med matriske. Sjekk ALLTID melkesaften: ekte matriske "blør" tydelig gulrotoransje når du kutter i den — giftslørsopp gjør ikke det. Er du i tvil, la soppen stå.' },
    { id:'piggsopp', name:'Piggsopp (lys)', latin:'Hydnum repandum', season:[8,10],
      treslag:['gran','bjork','furu'], skogalder:['middels','gammel'], fuktighet:['frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Blandingsskog med ${t.treslagTekst} gir gode vertstrær for piggsopp, mindre kravstor enn kantarell.`,
      fieldTips:'Under hatten: i stedet for gjeller/rør har piggsopp <b>myke, hengende pigger</b>. Kremhvit-lys oransje, tykt kjøtt. Mild i smak.',
      lookalike:'Bruk kun lyse piggsopper med lys hatt og lyse pigger. Mørkhattede piggsopper (bitterpiggsopp) er ikke farlige, men smaker svært bittert — kjenn etter på farge og smak en liten bit rått.' },
    { id:'faresopp', name:'Fåresopp', latin:'Albatrellus ovinus', season:[7,9],
      treslag:['gran'], skogalder:['gammel'], fuktighet:['frisk'], berggrunn:['fattig','moderat'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:8 },
      why:(loc,t)=>`Gammel granskog med mose — fåresopp vokser direkte i bakken, ofte i ring, nær gran.`,
      fieldTips:'Lys, kremhvit poresopp som vokser <b>på bakken</b> (ikke på trær), ofte flere sammenvokste hatter. Fine porer under hatten, ikke gjeller. Fast, hvitt kjøtt.',
      lookalike:'Lyse poresopper som vokser på bakken i Norge har ingen farlige forvekslingsarter — hovedregelen er lys farge og bakkevekst (ikke å forveksle med kjuker som vokser på trestammer).' },
    { id:'parasollsopp', name:'Parasollsopp (stor)', latin:'Macrolepiota procera', season:[7,10],
      treslag:['apen','bjork'], skogalder:['apen','middels'], fuktighet:['frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:10, idealNedbor14:25, minTempAvg:8 },
      why:(loc,t)=>`Åpne skogkanter og lysninger på ${t.berggrunnTekst} grunn — store parasollsopper trives i gress- og feltsjikt i overgangssoner.`,
      fieldTips:'Stor sopp (kan bli 20-40 cm høy) med lang, slank stilk som har et tydelig <b>slangeskinn-mønster</b> og en løs, bevegelig <b>dobbeltring</b>. Hatten er brun-skjellete og parasollformet når utsprunget.',
      lookalike:'⚠ Bruk kun STORE eksemplarer med tydelig slangemønster på stilken og fri, bevegelig ring — små, brune paraplysopper (Lepiota-arter) kan være dødelig giftige og ligner unge parasollsopper. Er soppen liten, la den stå.' },
    { id:'sjampinjong', name:'Markjordbær-sjampinjong', latin:'Agaricus campestris', season:[7,10],
      treslag:['apen'], skogalder:['apen'], fuktighet:['frisk'], berggrunn:['moderat','rik'],
      weather:{ minNedbor14:10, idealNedbor14:25, minTempAvg:8 },
      why:(loc,t)=>`Åpen beitemark/eng på ${t.berggrunnTekst} grunn — sjampinjong vokser i gress, liker kalkholdig jord.`,
      fieldTips:'Sjekk tre ting: <b>rosa gjeller</b> som mørkner til sjokoladebrune, en løs <b>ring på stilken</b>, og kjøtt som <b>ikke blir gult</b> ved trykk.',
      lookalike:'⚠ Unge, hvite fluesopp-knapper kan i sjeldne tilfeller minne om sjampinjong før hatten er utsprunget. Sjekk ALLTID gjellefargen (rosa/brun hos sjampinjong, aldri hvit) og grav opp foten — ekte sjampinjong har ingen "eggeskall" (volva) ved roten.' },
    { id:'furuknippesopp', name:'Furuknippesopp', latin:'Lyophyllum shimeji', season:[9,10],
      treslag:['furu'], skogalder:['gammel'], fuktighet:['tørr'], berggrunn:['fattig'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:6 },
      why:(loc,t)=>`Gammel, tørr furuskog på ${t.berggrunnTekst} sandgrunn — det sjeldne, kontinentale furumo-habitatet furuknippesopp krever.`,
      fieldTips:'Vokser i tette knipper direkte i sandholdig skogbunn i gammel, lysåpen furuskog, ofte med reinlav og blåbærlyng i bunnsjiktet. Gråbrun, fast hatt og hvitt kjøtt med en karakteristisk, litt melaktig-nøttete lukt. Regnes som en delikatesse i Japan (der kalt "shimeji"), men er svært sjelden i Norge og finnes stort sett i kontinentale furumoer på Østlandet.',
      lookalike:'⚠ Tilhører slekten knippesopp (Lyophyllum), som har flere likeartede sopper — vær nøye med artsbestemmelsen og bruk soppkontroll ved usikkerhet. Arten er dessuten sjelden/rødlistet i Norge: vis varsomhet og ikke tøm hele forekomsten om du finner den.' },
    { id:'kransmusserong', name:'Kransmusserong', latin:'Tricholoma matsutake', season:[9,10],
      treslag:['furu'], skogalder:['gammel'], fuktighet:['tørr'], berggrunn:['fattig'],
      weather:{ minNedbor14:15, idealNedbor14:30, minTempAvg:6 },
      why:(loc,t)=>`Sandholdig, gammel furuskog — kransmusserongens svært spesifikke voksested, best kjent fra furumoer på Østlandet (bl.a. rundt Elverum).`,
      fieldTips:'Kraftig, hvit-brun sopp med tydelig ring på stilken og en kraftig, kanelaktig/krydret duft som skiller den fra det meste annet. Vokser gjerne delvis nedgravd i sandjord under gammel furu, ofte i mose eller reinlav. Internasjonalt kjent som matsutake — en ettertraktet delikatesse i Japan.',
      lookalike:'⚠ Slekten musseronger/riddersopp (Tricholoma) inneholder også giftige arter (bl.a. tigermusserong, som gir kraftige mageplager) — sjekk ring, lukt og voksested nøye, og bruk soppkontroll ved usikkerhet. Kransmusserong er svært ettertraktet og forholdsvis sjelden i Norge — vis varsomhet og plukk med måte.' }
  ];

  // Nødfallback: brukes KUN hvis det private data-repoet ikke er konfigurert
  // ennå, eller ikke kan nås. Bevisst holdt som tydelig merkede DEMO-steder
  // uten ekte norsk stedsnavn/geografi — ekte terrengdata (88 steder, inkl.
  // detaljert Hobøl-dekning) ligger i data/locations.json i det PRIVATE
  // data-repoet, og lastes normalt inn av loadLocations() via GitHub-synk.
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
  let prioritizeQuiet = true;
  let hideHogst = false;
  let filterMode = 'fylke'; // 'fylke' | 'kommune' | 'radius'
  let fylkeFilter = 'alle';
  let kommuneFilter = 'alle';
  let radiusCenter = null;
  let radiusKm = 20;
  let weatherBySpecies = {};
  let weatherReady = false;
  let userFinds = [];
  let userCuts = [];
  let customLocations = [];
  let fetchedAreas = [];
  let gridKm = 1.5;
  let fetchInProgress = false;
  let fetchPollTimer = null;
  let bboxAreaCache = {}; // cache av Nominatim bbox-areal per fylke/kommune-navn

  const monthNow = new Date().getMonth() + 1;
  const yearNow = new Date().getFullYear();

  function allLocations(){ return BASE_LOCATIONS.concat(customLocations); }

  function haversineKm(lat1, lon1, lat2, lon2){
    const R = 6371;
    const dLat = (lat2-lat1) * Math.PI/180;
    const dLon = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
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
        customLocations = d.customLocations || [];
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
    customLocations = local?.customLocations || [];
  }

  async function persistAll(){
    const payload = { finds: userFinds, cuts: userCuts, customLocations: customLocations };
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
    const buttons = document.querySelectorAll('#sp-tab-bar .sp-tab-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.sp-tabbed-panel .sp-tab-content').forEach(c => {
          c.style.display = (c.dataset.tabContent === btn.dataset.tab) ? '' : 'none';
        });
      });
    });
  }

  function wireCollapsibles(){
    ['sp-notice', 'sp-safety'].forEach(id => {
      const el = document.getElementById(id);
      const key = 'fungifinder-collapse-' + id;
      const saved = localStorage.getItem(key);
      if (saved !== null) el.open = saved === 'open';
      el.addEventListener('toggle', () => {
        localStorage.setItem(key, el.open ? 'open' : 'closed');
      });
    });
  }

  function wireSyncPanel(){
    const cfg = window.FungiStore ? window.FungiStore.getConfig() : null;
    const defaults = defaultPaths();
    if (cfg) {
      document.getElementById('sync-repo').value = `${cfg.owner}/${cfg.repo}`;
      document.getElementById('sync-locations-path').value = cfg.locationsPath || defaults.locationsPath;
      document.getElementById('sync-personal-path').value = cfg.personalPath || defaults.personalPath;
    } else {
      document.getElementById('sync-locations-path').value = defaults.locationsPath;
      document.getElementById('sync-personal-path').value = defaults.personalPath;
    }
    document.getElementById('sync-connect').addEventListener('click', async () => {
      const repoVal = document.getElementById('sync-repo').value.trim();
      const locationsPath = document.getElementById('sync-locations-path').value.trim() || defaults.locationsPath;
      const personalPath = document.getElementById('sync-personal-path').value.trim() || defaults.personalPath;
      const token = document.getElementById('sync-token').value.trim();
      const [owner, repo] = repoVal.split('/');
      if (!owner || !repo || !token) { setSyncStatus('⚠ Fyll ut eier/repo og token.'); return; }
      window.FungiStore.setConfig({ owner, repo, locationsPath, personalPath, token, branch: 'main' });
      setSyncStatus('Kobler til …');
      await loadLocations();
      await loadFetchedAreas();
      await loadStorage();
      render();
    });
    document.getElementById('sync-disconnect').addEventListener('click', () => {
      window.FungiStore.clearConfig();
      setSyncStatus('Koblet fra — bruker lokal/eksempeldata på denne enheten.');
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

  async function estimateAreaKm2(){
    if (filterMode === 'radius') return Math.PI * radiusKm * radiusKm;
    const name = filterMode === 'fylke' ? fylkeFilter : kommuneFilter;
    if (!name || name === 'alle') return null;
    if (bboxAreaCache[name] !== undefined) return bboxAreaCache[name];
    try {
      const q = filterMode === 'fylke' ? `${name} fylke, Norge` : `${name}, Norge`;
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1`, {
        headers: { 'Accept-Language': 'no' }
      });
      const json = await res.json();
      if (!json.length) { bboxAreaCache[name] = null; return null; }
      const bb = json[0].boundingbox.map(parseFloat); // [south, north, west, east]
      const latKm = (bb[1] - bb[0]) * 111.32;
      const midLat = (bb[0] + bb[1]) / 2;
      const lonKm = (bb[3] - bb[2]) * 111.32 * Math.cos(midLat * Math.PI/180);
      const area = Math.abs(latKm * lonKm);
      bboxAreaCache[name] = area;
      return area;
    } catch (e) {
      console.warn('Kunne ikke estimere areal via Nominatim', e);
      bboxAreaCache[name] = null;
      return null;
    }
  }

  async function updateFetchPanel(){
    const panel = document.getElementById('sp-fetch-panel');
    if (fetchInProgress) { panel.style.display = ''; return; } // behold synlig under pågående henting

    const label = currentAreaLabel();
    if (!label) { panel.style.display = 'none'; return; }

    const match = findFetchedAreaMatch();
    if (match) { panel.style.display = 'none'; return; }

    panel.style.display = '';
    document.getElementById('sp-fetch-info').textContent = `Ingen terrengdata hentet for ${label} ennå.`;
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
      document.getElementById('sp-fetch-info').textContent = 'Koble til ditt private data-repo under "Synk" først.';
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
    const progress = document.getElementById('sp-fetch-progress');
    progress.style.display = '';
    progress.textContent = 'Starter jobb …';

    try {
      await window.FungiStore.triggerWorkflow('fetch-area.yml', inputs);
      progress.textContent = 'Jobb startet — venter på at GitHub Actions plukker den opp …';
      pollFetchStatus(progress);
    } catch (e) {
      console.error(e);
      progress.textContent = '⚠ Kunne ikke starte jobben: ' + e.message + ' (sjekk at tokenet har "Actions: Read and write")';
      fetchInProgress = false;
      document.getElementById('sp-fetch-start').disabled = false;
    }
  }

  function pollFetchStatus(progress){
    let attempts = 0;
    const maxAttempts = 60; // ~15 min ved 15 sek mellomrom
    clearTimeout(fetchPollTimer);
    const poll = async () => {
      attempts++;
      try {
        const run = await window.FungiStore.getLatestRun('fetch-area.yml');
        if (run) {
          if (run.status === 'completed') {
            if (run.conclusion === 'success') {
              progress.textContent = '✓ Ferdig! Laster inn ny data …';
              await loadLocations();
              await loadFetchedAreas();
              fetchInProgress = false;
              document.getElementById('sp-fetch-start').disabled = false;
              render();
              return;
            } else {
              progress.textContent = `⚠ Jobben feilet (${run.conclusion}). Sjekk Actions-fanen på GitHub for detaljer.`;
              fetchInProgress = false;
              document.getElementById('sp-fetch-start').disabled = false;
              return;
            }
          } else {
            progress.textContent = `Kjører … (${run.status}, forsøk ${attempts}/${maxAttempts})`;
          }
        }
      } catch (e) {
        console.warn('Feil under polling', e);
      }
      if (attempts < maxAttempts) {
        fetchPollTimer = setTimeout(poll, 15000);
      } else {
        progress.textContent = 'Bruker lenger tid enn ventet — sjekk Actions-fanen på GitHub manuelt. Siden kan lastes på nytt senere for å hente resultatet.';
        fetchInProgress = false;
        document.getElementById('sp-fetch-start').disabled = false;
      }
    };
    poll();
  }

  // ---------- weather ----------
  async function loadWeather(){
    const box = document.getElementById('sp-weather-box');
    const locs = allLocations();
    try {
      const lats = locs.map(l=>l.lat).join(',');
      const lons = locs.map(l=>l.lon).join(',');
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&daily=precipitation_sum,temperature_2m_mean&past_days=14&forecast_days=1&timezone=Europe%2FOslo`;
      const res = await fetch(url);
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [data];
      arr.forEach((d,i) => {
        const loc = locs[i]; if(!d || !d.daily) return;
        const precipArr = d.daily.precipitation_sum || [];
        const tempArr = d.daily.temperature_2m_mean || [];
        const last14p = precipArr.slice(0,14);
        const last5t = tempArr.slice(9,14);
        const sumP = last14p.reduce((a,b)=>a+(b||0),0);
        const avgT = last5t.length ? last5t.reduce((a,b)=>a+(b||0),0)/last5t.length : null;
        weatherBySpecies[loc.id] = { precip14: Math.round(sumP*10)/10, tempAvg: avgT!==null? Math.round(avgT*10)/10 : null };
      });
      weatherReady = true;
      const vals = Object.values(weatherBySpecies);
      const avgPrecip = vals.reduce((a,b)=>a+(b.precip14||0),0) / (vals.length||1);
      box.innerHTML = `<span class="sp-wstatus">✓ live data hentet</span><br/>Snitt nedbør siste 14 dager (alle steder): <b>${Math.round(avgPrecip)} mm</b>.`;
    } catch(e){
      weatherReady = false;
      box.innerHTML = `<span class="sp-wstatus">⚠ kunne ikke hente værdata</span><br/>Viser terrengscore uten tidsvurdering.`;
    }
    render();
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

  function adkomstScore(loc){
    let pts = 0; const tags = [];
    if (loc.kjorbarVei === 'ja') { pts += 6; tags.push({ text:'kjørbar vei til parkering', cls:'good' }); }
    else if (loc.kjorbarVei === 'nei') { pts -= 8; tags.push({ text:'ingen kjent bilvei', cls:'warn' }); }
    if (loc.parkeringNotat && /privat|gårdstun|avtale med grunneier|låst bom/i.test(loc.parkeringNotat)) {
      pts -= 10; tags.push({ text:'sjekk parkering – kan kreve avtale', cls:'warn' });
    }
    if (loc.stier === 'ja') { pts += 4; tags.push({ text:'stier/skogsbilvei i terrenget', cls:'good' }); }
    else if (loc.stier === 'nei') { pts -= 2; }
    return { pts, tags };
  }

  function findsFor(locId, speciesId){
    return userFinds.filter(f => f.locId === locId && (!speciesId || f.speciesId === speciesId));
  }

  function scoreLocation(species, loc){
    const cutRecent = loc.hogstAr !== null && loc.hogstAr !== undefined && (yearNow - loc.hogstAr) <= 3;
    const manuallyCut = userCuts.includes(loc.id);
    const isCut = cutRecent || manuallyCut;

    const breakdown = [];
    let total = 0;

    const rTreslag = attrScore(loc.treslag, species.treslag, 30);
    total += rTreslag.pts; breakdown.push([rTreslag.ok===null?'Treslag ukjent':(rTreslag.ok?'Treslag passer':'Treslag passer dårlig'), rTreslag.pts]);

    const rFukt = attrScore(loc.fuktighet, species.fuktighet, 20);
    total += rFukt.pts; breakdown.push([rFukt.ok===null?'Fuktighet ukjent':(rFukt.ok?'Fuktighetsnivå riktig':'Fuktighetsnivå avvikende'), rFukt.pts]);

    const rBerg = attrScore(loc.berggrunn, species.berggrunn, 15);
    total += rBerg.pts; breakdown.push([rBerg.ok===null?'Berggrunn ukjent':(rBerg.ok?'Berggrunn/jordsmonn passer':'Berggrunn suboptimal'), rBerg.pts]);

    const rAlder = attrScore(loc.skogalder, species.skogalder, 15);
    total += rAlder.pts; breakdown.push([rAlder.ok===null?'Skogalder ukjent':(rAlder.ok?'Skogalder riktig':'Skogalder ikke ideell'), rAlder.pts]);

    const inSeason = monthNow >= species.season[0] && monthNow <= species.season[1];
    const seasonPts = inSeason ? 10 : 0;
    total += seasonPts; breakdown.push([inSeason?'I sesong nå':'Utenfor typisk sesong', seasonPts]);

    if (loc.kjenteFunn && loc.kjenteFunn.includes(species.id)) { total += 8; breakdown.push(['Tidligere kjente funn i nærheten (database)', 8]); }

    let roScore = 0;
    if (prioritizeQuiet) {
      if (loc.befolkning === 'lav') roScore = 10;
      else if (loc.befolkning === 'middels') roScore = 4;
      else if (loc.befolkning === 'hoy') roScore = -8;
      else roScore = 2;
      if (loc.avstandVeiM && loc.avstandVeiM >= 1000) roScore += 4;
      total += roScore; breakdown.push(['Ro / avstand fra folk', roScore]);
    }

    const acc = adkomstScore(loc);
    total += acc.pts; breakdown.push(['Adkomst (vei/parkering/stier)', acc.pts]);

    if (WARMTH_LOVING_SPECIES.has(species.id) && loc.himmelretning && loc.helningGrader != null) {
      const sorvendt = ['S','SØ','SV'].includes(loc.himmelretning);
      const passeHelning = loc.helningGrader >= 3 && loc.helningGrader <= 25;
      if (sorvendt && passeHelning) {
        total += 5; breakdown.push(['Sørvendt skråning (varmekrevende art)', 5]);
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

    const myFinds = findsFor(loc.id, species.id);
    let histNote = null;
    if (myFinds.length) {
      const avgM = myFinds.reduce((a,f)=>a+f.mengde,0) / myFinds.length;
      const histPts = Math.min(30, Math.round(8 + avgM*4 + Math.min(myFinds.length,5)*1.2));
      total += histPts;
      breakdown.push([`Egen funnhistorikk (${myFinds.length} funn, snitt ${avgM.toFixed(1)}/5)`, histPts]);
      histNote = `Du har selv funnet ${species.name.toLowerCase()} her ${myFinds.length} gang${myFinds.length>1?'er':''} tidligere, snitt mengde ${avgM.toFixed(1)}/5 — dette teller sterkt i vurderingen.`;
    }

    total = Math.max(0, Math.min(100, Math.round(total)));
    return { total, breakdown, isCut, weatherVerdict, weather: w, histNote, accessTags: acc.tags };
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

  function fylkeList(){
    const set = new Set(allLocations().map(l=>l.fylke));
    return Array.from(set).sort((a,b)=>a.localeCompare(b,'no'));
  }
  function kommuneList(){
    const set = new Set(allLocations().map(l=>l.kommune));
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
  let mapFittedOnce = false;

  function initMap(){
    leafletMap = L.map('sp-leaflet-map', { scrollWheelZoom: true }).setView([60.5, 10.7], 6);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsytere'
    }).addTo(leafletMap);
    markerLayer = L.layerGroup().addTo(leafletMap);
    radiusLayer = L.layerGroup().addTo(leafletMap);
    leafletMap.on('click', (e) => {
      if (filterMode === 'radius') {
        radiusCenter = { lat: e.latlng.lat, lon: e.latlng.lng };
        render();
      } else {
        openAddLocationModal({ lat: Math.round(e.latlng.lat*1000)/1000, lon: Math.round(e.latlng.lng*1000)/1000 });
      }
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
      if (card) { card.scrollIntoView({behavior:'smooth', block:'center'}); card.classList.add('sp-flash'); setTimeout(()=>card.classList.remove('sp-flash'), 1200); }
    }, 60);
  }

  function renderMap(scoredAll){
    if (!leafletMap) return;
    markerLayer.clearLayers();
    radiusLayer.clearLayers();

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
    if (filterMode === 'fylke') {
      hint.textContent = 'Klikk et punkt for å filtrere til det fylket. Klikk et tomt sted i kartet for å legge til et eget sted der.';
    } else if (filterMode === 'kommune') {
      hint.textContent = 'Klikk et punkt for å filtrere til den kommunen. Klikk et tomt sted i kartet for å legge til et eget sted der.';
    } else {
      hint.textContent = radiusCenter
        ? `Senter satt ved ${radiusCenter.lat.toFixed(3)}, ${radiusCenter.lon.toFixed(3)}. Klikk et nytt punkt for å flytte senteret.`
        : 'Klikk et punkt i kartet (eller på et sted) for å sette senter for radiusfilteret.';
    }
  }

  // ---------- render ----------
  function renderSpeciesList(){
    const el = document.getElementById('sp-species-list');
    el.innerHTML = SPECIES.map(s => `<button class="sp-species-btn ${s.id===selectedSpecies?'active':''}" data-id="${s.id}"><span>${s.name}<span class="sp-latin">${s.latin}</span></span></button>`).join('');
    el.querySelectorAll('.sp-species-btn').forEach(btn => btn.addEventListener('click', () => { selectedSpecies = btn.dataset.id; render(); }));
  }

  function renderMineList(){
    const el = document.getElementById('sp-mine-list');
    if (!customLocations.length) { el.innerHTML = `<div class="sp-empty-mine">Ingen egne steder lagt til ennå.</div>`; return; }
    el.innerHTML = customLocations.map(l => `<div class="sp-mine-row"><span>${escapeHtml(l.name)} <span style="opacity:.6">(${escapeHtml(l.kommune)})</span></span><button data-id="${l.id}" title="Fjern">✕</button></div>`).join('');
    el.querySelectorAll('button[data-id]').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      customLocations = customLocations.filter(l => l.id !== id);
      userFinds = userFinds.filter(f => f.locId !== id);
      userCuts = userCuts.filter(x => x !== id);
      await saveCustomLocations(); await saveFinds(); await saveCuts();
      render();
    }));
  }

  function renderFilterControls(){
    document.querySelectorAll('#sp-mode-seg button').forEach(b => b.classList.toggle('active', b.dataset.mode === filterMode));
    document.getElementById('sp-fylke-filter').style.display = filterMode === 'fylke' ? '' : 'none';
    document.getElementById('sp-kommune-filter').style.display = filterMode === 'kommune' ? '' : 'none';
    document.getElementById('sp-radius-controls').style.display = filterMode === 'radius' ? 'flex' : 'none';
    document.getElementById('sp-radius-label').textContent = radiusKm + ' km';
    document.getElementById('sp-radius-slider').value = radiusKm;

    const fEl = document.getElementById('sp-fylke-filter');
    fEl.innerHTML = `<option value="alle">Alle fylker</option>` + fylkeList().map(f => `<option value="${escapeHtml(f)}" ${f===fylkeFilter?'selected':''}>${escapeHtml(f)}</option>`).join('');
    fEl.value = fylkeFilter;

    const kEl = document.getElementById('sp-kommune-filter');
    kEl.innerHTML = `<option value="alle">Alle kommuner</option>` + kommuneList().map(k => `<option value="${escapeHtml(k)}" ${k===kommuneFilter?'selected':''}>${escapeHtml(k)}</option>`).join('');
    kEl.value = kommuneFilter;
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
          <div class="sp-gauge-wrap">${gaugeSvg(res.total)}<div class="sp-gauge-label">score</div></div>
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
        <div class="sp-explain">${species_for_card().why(loc, t)}</div>
        <div class="sp-microtips-label">Sjekk spesielt i terrenget her</div>
        <ul class="sp-microtips">${terrainMicrotips(species_for_card(), loc).map(tip => `<li>${tip}</li>`).join('')}</ul>
        ${w ? `<div class="sp-breakdown">Vær nå: <span>${w.precip14} mm</span> nedbør siste 14 dager, snitt temp <span>${w.tempAvg ?? '–'}°C</span>. ${res.weatherVerdict || ''}</div>` : ''}
        ${finds.length ? `<div class="sp-findlist">${finds.map(f => `<div class="sp-find-row"><span>${SPECIES.find(s=>s.id===f.speciesId)?.name || f.speciesId} — ${f.date}</span><span class="sp-dots">${[1,2,3,4,5].map(n=>`<span class="${n<=f.mengde?'filled':''}"></span>`).join('')}</span></div>`).join('')}</div>` : ''}
        <div class="sp-card-actions">
          <button class="sp-btn sp-primary" data-action="find" data-loc="${loc.id}">Registrer funn her</button>
          <button class="sp-btn sp-ghost-danger" data-action="cut" data-loc="${loc.id}">${userCuts.includes(loc.id)?'Fjern hogst-merking':'Merk som flatehogd'}</button>
        </div>
      </div>`;
  }

  let _currentSpecies = null;
  function species_for_card(){ return _currentSpecies; }

  function render(){
    renderSpeciesList();
    renderMineList();
    renderFilterControls();
    document.getElementById('sp-toggle-quiet').classList.toggle('on', prioritizeQuiet);
    document.getElementById('sp-toggle-hogst').classList.toggle('on', hideHogst);

    const species = SPECIES.find(s => s.id === selectedSpecies);
    _currentSpecies = species;
    document.getElementById('sp-results-title').textContent = `Forslag for ${species.name}`;

    const monthNames = ['jan','feb','mar','apr','mai','jun','jul','aug','sep','okt','nov','des'];
    const timing = seasonTiming(species);
    document.getElementById('sp-species-info').innerHTML = `
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

    const locsAll = allLocations();
    let scoredAll = locsAll.map(loc => ({ loc, res: scoreLocation(species, loc) }));
    renderMap(scoredAll);

    let scoped = scoredAll.filter(s => {
      if (filterMode === 'fylke') return fylkeFilter === 'alle' || s.loc.fylke === fylkeFilter;
      if (filterMode === 'kommune') return kommuneFilter === 'alle' || s.loc.kommune === kommuneFilter;
      if (filterMode === 'radius' && radiusCenter) return haversineKm(radiusCenter.lat, radiusCenter.lon, s.loc.lat, s.loc.lon) <= radiusKm;
      return true;
    });

    if (hideHogst) scoped = scoped.filter(s => !s.res.isCut);
    scoped.sort((a,b) => {
      if (a.res.isCut !== b.res.isCut) return a.res.isCut ? 1 : -1;
      return b.res.total - a.res.total;
    });

    updateFetchPanel();

    const areaLabel = filterMode === 'fylke' ? (fylkeFilter!=='alle' ? ' i ' + fylkeFilter : '')
      : filterMode === 'kommune' ? (kommuneFilter!=='alle' ? ' i ' + kommuneFilter : '')
      : (radiusCenter ? ` innen ${radiusKm} km` : '');
    document.getElementById('sp-count').textContent = `${scoped.length} steder vist${areaLabel}`;

    const container = document.getElementById('sp-results');
    if (!scoped.length) {
      container.innerHTML = `<div class="sp-empty">Ingen steder passerer filtrene dine akkurat nå${areaLabel}. ${filterMode==='radius' && !radiusCenter ? 'Klikk i kartet for å sette et senterpunkt.' : 'Prøv «Alle fylker/kommuner» eller juster radius.'}</div>`;
      return;
    }

    const activeOnes = scoped.filter(s => !s.res.isCut);
    const cutOnes = scoped.filter(s => s.res.isCut);
    let html = activeOnes.map(({loc,res}) => cardHtml(loc,res)).join('');
    if (cutOnes.length) {
      html += `<div class="sp-divider-excl">flatehogd — ikke anbefalt</div>`;
      html += cutOnes.map(({loc,res}) => cardHtml(loc,res)).join('');
    }
    container.innerHTML = html;

    container.querySelectorAll('[data-action="find"]').forEach(btn => btn.addEventListener('click', () => openFindModal(btn.dataset.loc)));
    container.querySelectorAll('[data-action="cut"]').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.dataset.loc;
      if (userCuts.includes(id)) userCuts = userCuts.filter(x => x !== id); else userCuts.push(id);
      await saveCuts(); render();
    }));
  }

  // ---------- find modal ----------
  function openFindModal(locId, opts){
    opts = opts || {};
    const loc = allLocations().find(l => l.id === locId);
    let mengde = 3;
    const slot = document.getElementById('sp-modal-slot');
    slot.innerHTML = `
      <div class="sp-modal-backdrop" id="sp-modal-backdrop">
        <div class="sp-modal">
          <h4>${opts.title || ('Registrer funn — ' + escapeHtml(loc.name))}</h4>
          ${opts.sub ? `<div class="sp-modal-sub">${opts.sub}</div>` : ''}
          <label>Sopptype</label>
          <select id="sp-find-species">${SPECIES.map(s => `<option value="${s.id}" ${s.id===selectedSpecies?'selected':''}>${s.name}</option>`).join('')}</select>
          <label>Mengde funnet</label>
          <div class="sp-scale" id="sp-find-scale">${[1,2,3,4,5].map(n => `<button data-n="${n}" class="${n===3?'sel':''}">${n}</button>`).join('')}</div>
          <label>Notat (valgfritt)</label>
          <textarea id="sp-find-note" rows="2" placeholder="F.eks. nordvendt skråning nær bekken"></textarea>
          <div class="sp-modal-actions">
            <button class="sp-btn" id="sp-find-cancel">${opts.skipLabel || 'Avbryt'}</button>
            <button class="sp-btn sp-primary" id="sp-find-save">Lagre funn</button>
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
    document.getElementById('sp-find-save').addEventListener('click', async () => {
      const speciesId = document.getElementById('sp-find-species').value;
      const note = document.getElementById('sp-find-note').value;
      userFinds.push({ id:'f_'+Date.now(), locId, speciesId, mengde, note, date: new Date().toISOString().slice(0,10) });
      await saveFinds();
      slot.innerHTML = '';
      render();
    });
  }

  // ---------- add custom location modal ----------
  function openAddLocationModal(prefill){
    prefill = prefill || {};
    const fylker = fylkeList();
    const komms = kommuneList();
    const slot = document.getElementById('sp-modal-slot');
    slot.innerHTML = `
      <div class="sp-modal-backdrop" id="sp-modal-backdrop">
        <div class="sp-modal">
          <h4>Legg til eget sted</h4>
          <div class="sp-modal-sub">Fyll ut det du vet — resten kan stå som «ukjent». Egen funnhistorikk teller uansett tungt i vurderingen.</div>
          <label>Navn på stedet</label>
          <input type="text" id="loc-name" placeholder="F.eks. Granskogen bak hytta"/>
          <div class="sp-2col">
            <div>
              <label>Fylke</label>
              <input type="text" id="loc-fylke" list="loc-fylke-list" placeholder="Velg eller skriv inn"/>
              <datalist id="loc-fylke-list">${fylker.map(f=>`<option value="${escapeHtml(f)}">`).join('')}</datalist>
            </div>
            <div>
              <label>Kommune</label>
              <input type="text" id="loc-kommune" list="loc-kommune-list" placeholder="Velg eller skriv inn" value="${escapeHtml(prefill.kommune||'')}"/>
              <datalist id="loc-kommune-list">${komms.map(k=>`<option value="${escapeHtml(k)}">`).join('')}</datalist>
            </div>
          </div>
          <label>Koordinater (valgfritt)</label>
          <div class="sp-2col">
            <input type="number" step="0.001" id="loc-lat" placeholder="Breddegrad" value="${prefill.lat ?? ''}"/>
            <input type="number" step="0.001" id="loc-lon" placeholder="Lengdegrad" value="${prefill.lon ?? ''}"/>
          </div>

          <label>Treslag (kryss av det du kjenner igjen)</label>
          <div class="sp-checkgrid">
            <label><input type="checkbox" value="gran"/> Gran</label>
            <label><input type="checkbox" value="furu"/> Furu</label>
            <label><input type="checkbox" value="bjork"/> Bjørk</label>
            <label><input type="checkbox" value="apen"/> Åpen mark</label>
          </div>

          <div class="sp-2col">
            <div>
              <label>Fuktighet</label>
              <select id="loc-fukt"><option value="ukjent">Ukjent</option><option value="tørr">Tørr</option><option value="frisk">Frisk</option><option value="fuktig">Fuktig</option></select>
            </div>
            <div>
              <label>Berggrunn</label>
              <select id="loc-berg"><option value="ukjent">Ukjent</option><option value="fattig">Kalkfattig</option><option value="moderat">Moderat kalk</option><option value="rik">Kalkrik</option></select>
            </div>
          </div>
          <div class="sp-2col">
            <div>
              <label>Skogalder</label>
              <select id="loc-alder"><option value="ukjent">Ukjent</option><option value="ung">Ung</option><option value="middels">Middels</option><option value="gammel">Gammel</option><option value="apen">Åpen mark</option></select>
            </div>
            <div>
              <label>Ferdsel/befolkning i nærheten</label>
              <select id="loc-bef"><option value="ukjent">Ukjent</option><option value="lav">Lite folk</option><option value="middels">Moderat</option><option value="hoy">Mye ferdsel</option></select>
            </div>
          </div>

          <hr/>
          <label>Kjørbar vei helt til et parkeringspunkt?</label>
          <select id="loc-vei"><option value="ukjent">Ukjent</option><option value="ja">Ja</option><option value="nei">Nei</option></select>
          <label>Notat om parkering</label>
          <input type="text" id="loc-parkering" placeholder="F.eks. grusplass ved skogsbilvei, IKKE privat gårdstun"/>
          <div class="sp-2col">
            <div>
              <label>Stier/skogsbilveier i terrenget?</label>
              <select id="loc-stier"><option value="ukjent">Ukjent</option><option value="ja">Ja</option><option value="nei">Nei</option></select>
            </div>
            <div>
              <label>Gangavstand fra parkering (m)</label>
              <input type="number" id="loc-gangavstand" placeholder="F.eks. 500"/>
            </div>
          </div>

          <div class="sp-hogd-row">
            <input type="checkbox" id="loc-hogd"/>
            <label for="loc-hogd">Dette stedet er dessverre flatehogd nå (vis merket/ekskludert)</label>
          </div>

          <div class="sp-modal-actions">
            <button class="sp-btn" id="loc-cancel">Avbryt</button>
            <button class="sp-btn sp-primary" id="loc-save">Lagre sted</button>
          </div>
        </div>
      </div>`;
    document.getElementById('loc-cancel').addEventListener('click', () => slot.innerHTML = '');
    document.getElementById('sp-modal-backdrop').addEventListener('click', (e) => { if(e.target.id==='sp-modal-backdrop') slot.innerHTML=''; });
    document.getElementById('loc-save').addEventListener('click', async () => {
      const name = document.getElementById('loc-name').value.trim() || 'Uten navn';
      const fylke = document.getElementById('loc-fylke').value.trim() || 'Ukjent fylke';
      const kommune = document.getElementById('loc-kommune').value.trim() || 'Ukjent kommune';
      const latVal = parseFloat(document.getElementById('loc-lat').value);
      const lonVal = parseFloat(document.getElementById('loc-lon').value);
      const b = mapCenterFallback();
      const lat = isNaN(latVal) ? b.lat : latVal;
      const lon = isNaN(lonVal) ? b.lon : lonVal;
      const treslag = Array.from(document.querySelectorAll('.sp-checkgrid input:checked')).map(c=>c.value);
      const fuktighet = document.getElementById('loc-fukt').value;
      const berggrunn = document.getElementById('loc-berg').value;
      const skogalder = document.getElementById('loc-alder').value;
      const befolkning = document.getElementById('loc-bef').value;
      const hogd = document.getElementById('loc-hogd').checked;
      const kjorbarVei = document.getElementById('loc-vei').value;
      const parkeringNotat = document.getElementById('loc-parkering').value.trim() || null;
      const stier = document.getElementById('loc-stier').value;
      const gangVal = parseInt(document.getElementById('loc-gangavstand').value);
      const avstandParkeringM = isNaN(gangVal) ? null : gangVal;

      const newLoc = {
        id: 'c_' + Date.now(), name, fylke, kommune, lat, lon,
        treslag: treslag.length ? treslag : ['ukjent'],
        skogalder, fuktighet, berggrunn,
        avstandVeiM: null, befolkning,
        hogstAr: hogd ? yearNow : null,
        kjenteFunn: [], custom: true,
        kjorbarVei, parkeringNotat, stier, avstandParkeringM
      };
      customLocations.push(newLoc);
      await saveCustomLocations();
      slot.innerHTML = '';
      render();
      openFindModal(newLoc.id, {
        title: 'Logg din erfaring — ' + escapeHtml(name),
        sub: 'Registrer sopp du vet har vokst her tidligere. Du kan legge til flere senere via kortet.',
        skipLabel: 'Hopp over for nå'
      });
    });
  }

  // ---------- wiring ----------
  document.getElementById('sp-toggle-quiet').addEventListener('click', () => { prioritizeQuiet = !prioritizeQuiet; render(); });
  document.getElementById('sp-toggle-hogst').addEventListener('click', () => { hideHogst = !hideHogst; render(); });
  document.getElementById('sp-fylke-filter').addEventListener('change', (e) => { fylkeFilter = e.target.value; render(); });
  document.getElementById('sp-kommune-filter').addEventListener('change', (e) => { kommuneFilter = e.target.value; render(); });
  document.getElementById('sp-add-place').addEventListener('click', () => openAddLocationModal({}));
  document.querySelectorAll('#sp-mode-seg button').forEach(btn => btn.addEventListener('click', () => { filterMode = btn.dataset.mode; render(); }));
  document.getElementById('sp-radius-slider').addEventListener('input', (e) => { radiusKm = parseInt(e.target.value); render(); });
  document.getElementById('sp-radius-clear').addEventListener('click', () => { radiusCenter = null; render(); });

  (async function init(){
    wireVersionInfo();
    wireTabs();
    wireCollapsibles();
    wireSyncPanel();
    wireFetchPanel();
    initMap();
    await loadLocations();
    await loadFetchedAreas();
    await loadStorage();
    render();
    loadWeather();
  })();

})();
