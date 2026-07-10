// js/github-store.js
// Generisk "GitHub som database"-modul for FungiFinder.
//
// Leser og skriver vilkårlige JSON-filer i ett privat GitHub-repo via GitHub sitt
// Contents API. Brukes til to ting i FungiFinder:
//   1. Lese terrengdatasettet (data/locations.json) — read-only i praksis
//   2. Lese/skrive personlige data (data/personal.json) — funn, hogst-merker, egne steder
//
// Begge ligger i samme private repo, så én konfigurasjon (eier/repo + token)
// dekker begge bruksområdene — kun filstien er forskjellig.
//
// Sikkerhetsmerknad: tokenet lagres i nettleserens localStorage på enheten din,
// ALDRI i kode eller i selve det offentlige app-repoet. Bruk et fine-grained
// token begrenset til kun det private data-repoet, med "Contents: Read and write".

const GH_CONFIG_KEY = 'fungifinder-gh-config';
const LOCAL_FALLBACK_PREFIX = 'fungifinder-local-';

function getConfig(){
  try {
    const raw = localStorage.getItem(GH_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}

function setConfig(cfg){
  localStorage.setItem(GH_CONFIG_KEY, JSON.stringify(cfg));
}

function clearConfig(){
  localStorage.removeItem(GH_CONFIG_KEY);
}

function isConfigured(){
  const c = getConfig();
  return !!(c && c.owner && c.repo && c.token);
}

// Unicode-sikker base64-koding/dekoding (GitHub API krever base64 av UTF-8-bytes)
function utf8ToBase64(str){
  return btoa(unescape(encodeURIComponent(str)));
}
function base64ToUtf8(b64){
  return decodeURIComponent(escape(atob(b64)));
}

async function ghRequest(cfg, path, method, body){
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${encodeURIComponent(path).replace(/%2F/g,'/')}${cfg.branch ? '?ref=' + encodeURIComponent(cfg.branch) : ''}`;
  const headers = {
    'Authorization': `Bearer ${cfg.token}`,
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (method === 'PUT') headers['Content-Type'] = 'application/json';
  return fetch(url, { method: method || 'GET', headers, body: body ? JSON.stringify(body) : undefined });
}

// Henter en JSON-fil fra det konfigurerte repoet.
// Returnerer { data: null, sha: null } hvis filen ikke finnes ennå (helt normalt
// ved første gangs bruk av personal.json — den opprettes ved første lagring).
async function loadFile(path){
  const cfg = getConfig();
  if (!cfg) throw new Error('GitHub-synk er ikke konfigurert.');
  const res = await ghRequest(cfg, path, 'GET');
  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) throw new Error(`GitHub API-feil ved henting av ${path} (${res.status}): ${await res.text()}`);
  const json = await res.json();
  let contentB64 = json.content;
  if (!contentB64 || json.encoding === 'none') {
    // Contents API inlines base64-innhold kun for filer under 1 MB — for
    // større filer (encoding: "none", tom content) må vi hente rått via
    // Git Data API sitt blob-endepunkt, som støtter opptil 100 MB.
    const blobRes = await fetch(`https://api.github.com/repos/${cfg.owner}/${cfg.repo}/git/blobs/${json.sha}`, {
      headers: {
        'Authorization': `Bearer ${cfg.token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    if (!blobRes.ok) throw new Error(`GitHub API-feil ved henting av blob for ${path} (${blobRes.status}): ${await blobRes.text()}`);
    const blobJson = await blobRes.json();
    contentB64 = blobJson.content;
  }
  const content = base64ToUtf8(contentB64.replace(/\n/g, ''));
  return { data: JSON.parse(content), sha: json.sha };
}

// Lagrer en JSON-fil til det konfigurerte repoet. Trenger sha fra forrige
// loadFile() for å oppdatere en eksisterende fil (unngår at to enheter
// overskriver hverandre uten varsel).
async function saveFile(path, dataObj, previousSha){
  const cfg = getConfig();
  if (!cfg) throw new Error('GitHub-synk er ikke konfigurert.');
  const body = {
    message: `FungiFinder: oppdater ${path} (${new Date().toISOString()})`,
    content: utf8ToBase64(JSON.stringify(dataObj, null, 2)),
    branch: cfg.branch || undefined
  };
  if (previousSha) body.sha = previousSha;
  const res = await ghRequest(cfg, path, 'PUT', body);
  if (!res.ok) throw new Error(`GitHub API-feil ved lagring av ${path} (${res.status}): ${await res.text()}`);
  const json = await res.json();
  return json.content.sha;
}

// Lokal fallback (localStorage), nøkkel-basert slik at flere "filer" (locations,
// personal) kan caches separat. Brukes automatisk hvis GitHub-synk ikke er satt
// opp, slik at appen fungerer med eksempeldata/lokale data med det samme.
function loadLocal(key){
  try {
    const raw = localStorage.getItem(LOCAL_FALLBACK_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch(e){ return null; }
}
function saveLocal(key, dataObj){
  localStorage.setItem(LOCAL_FALLBACK_PREFIX + key, JSON.stringify(dataObj));
}

// Slår opp repoets faktiske standard-branch (main/master/annet) — brukes ved
// tilkobling i stedet for å anta "main", som var årsaken til en del 404-feil.
async function detectDefaultBranch(owner, repo, token){
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) throw new Error(`Fant ikke repoet (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return data.default_branch || 'main';
}

// Sjekker om GitHub faktisk kjenner igjen en gitt workflow-fil i repoet.
// Brukes som "preflight" før triggerWorkflow, for å gi en presis feilmelding
// (fil ikke pushet ennå / feil filnavn) i stedet for en kryptisk 404 fra
// selve dispatch-kallet.
async function workflowExists(workflowFile){
  const cfg = getConfig();
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) throw new Error(`Kunne ikke liste workflows (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const found = (data.workflows || []).find(w => w.path.endsWith('/' + workflowFile) || w.path === workflowFile);
  return !!found;
}

// Trigger en GitHub Actions-workflow (workflow_dispatch) med gitte input-parametere.
// Krever at tokenet har "Actions: Read and write" i tillegg til Contents.
async function triggerWorkflow(workflowFile, inputs){
  const cfg = getConfig();
  if (!cfg) throw new Error('GitHub-synk er ikke konfigurert.');

  const exists = await workflowExists(workflowFile);
  if (!exists) {
    throw new Error(
      `Fant ikke "${workflowFile}" blant workflows GitHub kjenner igjen på branchen "${cfg.branch}". ` +
      `Vanligste årsaker: filen er ikke pushet til ${cfg.branch}-branchen ennå, den ligger på feil sti ` +
      `(skal være .github/workflows/${workflowFile}), eller den mangler "on: workflow_dispatch:" i YAML-en.`
    );
  }

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${workflowFile}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ref: cfg.branch || 'main', inputs })
  });
  if (!res.ok) throw new Error(`Kunne ikke starte jobben (${res.status}): ${await res.text()}`);
  return true;
}

// Henter siste kjøring av en gitt workflow-fil, for å følge med på status
// (queued / in_progress / completed) etter at triggerWorkflow() er kalt.
//
// sinceIso (valgfritt): hvis satt, returneres kun kjøringer opprettet PÅ ELLER
// ETTER dette tidspunktet. Dette er kritisk under polling rett etter en
// trigging — GitHub kan bruke noen sekunder på å registrere den nye kjøringen,
// og uten dette filteret ville vi i mellomtiden lese status fra en ELDRE,
// allerede fullført kjøring og feilaktig tro at den nye jobben var ferdig.
async function getLatestRun(workflowFile, sinceIso){
  const cfg = getConfig();
  if (!cfg) throw new Error('GitHub-synk er ikke konfigurert.');
  let url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/actions/workflows/${workflowFile}/runs?per_page=5`;
  if (sinceIso) url += `&created=%3E%3D${encodeURIComponent(sinceIso)}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${cfg.token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  if (!res.ok) throw new Error(`Kunne ikke hente jobbstatus (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.workflow_runs && data.workflow_runs[0]) || null;
}

window.FungiStore = { getConfig, setConfig, clearConfig, isConfigured, loadFile, saveFile, loadLocal, saveLocal, triggerWorkflow, getLatestRun, detectDefaultBranch };
