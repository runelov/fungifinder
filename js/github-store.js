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
  const content = base64ToUtf8(json.content.replace(/\n/g, ''));
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

window.FungiStore = { getConfig, setConfig, clearConfig, isConfigured, loadFile, saveFile, loadLocal, saveLocal };
