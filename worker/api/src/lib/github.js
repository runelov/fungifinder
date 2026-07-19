// Server-side erstatning for js/github-store.js sin GitHub Contents/Actions
// API-bruk. Ulikt den gamle nettleser-versjonen har denne KUN én fast
// konfigurasjon (env.GITHUB_PAT mot runelov/fungifinder-db, branch=main) —
// ingen bruker ser eller oppgir noe token lenger, se README.md for hvorfor
// PAT-en flyttet hit.

const OWNER = 'runelov';
const REPO = 'fungifinder-db';
const BRANCH = 'main';

function headers(env, extra) {
  return {
    Authorization: `Bearer ${env.GITHUB_PAT}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...extra,
  };
}

// Unicode-sikker base64-dekoding (GitHub API returnerer base64 av UTF-8-bytes)
function base64ToUtf8(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}
function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

// Henter en JSON-fil fra fungifinder-db. Returnerer { data: null, sha: null }
// hvis filen ikke finnes ennå.
export async function loadFile(path, env) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  const res = await fetch(url, { headers: headers(env) });
  if (res.status === 404) return { data: null, sha: null };
  if (!res.ok) throw new Error(`GitHub API-feil ved henting av ${path} (${res.status}): ${await res.text()}`);
  const json = await res.json();
  let contentB64 = json.content;
  if (!contentB64 || json.encoding === 'none') {
    // Contents API inlines base64-innhold kun for filer under 1 MB — for
    // større filer (encoding: "none") må vi hente rått via Git Data API
    // sitt blob-endepunkt, som støtter opptil 100 MB.
    const blobRes = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/git/blobs/${json.sha}`, {
      headers: headers(env),
    });
    if (!blobRes.ok) throw new Error(`GitHub API-feil ved henting av blob for ${path} (${blobRes.status}): ${await blobRes.text()}`);
    const blobJson = await blobRes.json();
    contentB64 = blobJson.content;
  }
  return { data: JSON.parse(base64ToUtf8(contentB64)), sha: json.sha };
}

// Lagrer en JSON-fil til fungifinder-db. previousSha kreves for å oppdatere
// en eksisterende fil (unngår at to samtidige skriv overskriver hverandre
// uten varsel).
export async function saveFile(path, dataObj, previousSha, env) {
  const body = {
    message: `fungifinder-api: oppdater ${path} (${new Date().toISOString()})`,
    content: utf8ToBase64(JSON.stringify(dataObj, null, 2)),
    branch: BRANCH,
  };
  if (previousSha) body.sha = previousSha;
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: headers(env, { 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub API-feil ved lagring av ${path} (${res.status}): ${await res.text()}`);
  const json = await res.json();
  return json.content.sha;
}

// Sjekker om GitHub faktisk kjenner igjen en gitt workflow-fil — brukes som
// "preflight" før triggerWorkflow, for en presis feilmelding i stedet for
// en kryptisk 404 fra selve dispatch-kallet.
async function workflowExists(workflowFile, env) {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows`;
  const res = await fetch(url, { headers: headers(env) });
  if (!res.ok) throw new Error(`Kunne ikke liste workflows (${res.status}): ${await res.text()}`);
  const data = await res.json();
  const found = (data.workflows || []).find((w) => w.path.endsWith('/' + workflowFile) || w.path === workflowFile);
  return !!found;
}

// Trigger en GitHub Actions-workflow (workflow_dispatch) med gitte
// input-parametere. env.GITHUB_PAT må ha "Actions: Read and write".
export async function triggerWorkflow(workflowFile, inputs, env) {
  const exists = await workflowExists(workflowFile, env);
  if (!exists) {
    throw new Error(
      `Fant ikke "${workflowFile}" blant workflows GitHub kjenner igjen på branchen "${BRANCH}".`
    );
  }

  const url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(env, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ ref: BRANCH, inputs }),
  });
  if (!res.ok) throw new Error(`Kunne ikke starte jobben (${res.status}): ${await res.text()}`);
  return true;
}

// Henter siste kjøring av en gitt workflow-fil, for å følge med på status
// (queued / in_progress / completed) etter en trigging.
//
// sinceIso (valgfritt): hvis satt, returneres kun kjøringer opprettet PÅ
// ELLER ETTER dette tidspunktet — kritisk under polling rett etter en
// trigging, ellers kan vi lese status fra en ELDRE, allerede fullført
// kjøring og feilaktig tro at den nye jobben var ferdig.
export async function getLatestRun(workflowFile, sinceIso, env) {
  let url = `https://api.github.com/repos/${OWNER}/${REPO}/actions/workflows/${workflowFile}/runs?per_page=5`;
  if (sinceIso) url += `&created=%3E%3D${encodeURIComponent(sinceIso)}`;
  const res = await fetch(url, { headers: headers(env) });
  if (!res.ok) throw new Error(`Kunne ikke hente jobbstatus (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return (data.workflow_runs && data.workflow_runs[0]) || null;
}
