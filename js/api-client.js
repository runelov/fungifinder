// js/api-client.js
// Klient for fungifinder-api-workeren (auth + roller + terrengdata +
// personlige data). Erstatter js/github-store.js helt — ingen bruker eier
// eller limer inn noe GitHub-token lenger, se worker/api/README.md for
// hvorfor PAT-en flyttet server-side. Alle brukere deler samme backend, så
// URL-en er fast (ikke brukerkonfigurerbar slik github-store.js var).
//
const API_BASE = ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:8787'
  : 'https://api.fungifinder.no';

async function kall(sti, opts){
  const res = await fetch(`${API_BASE}${sti}`, { credentials: 'include', ...opts });
  return res;
}

// Returnerer innlogget bruker ({epost, kortnavn, rolle}), eller null hvis
// ikke innlogget. /meg svarer alltid 200 (aldri 401) for "ikke innlogget"
// — en normal, forventet tilstand ved appstart, ikke en feilsituasjon.
async function meg(){
  const res = await kall('/meg');
  if (!res.ok) return null;
  const data = await res.json();
  return data.loggedIn ? { epost: data.epost, kortnavn: data.kortnavn, rolle: data.rolle } : null;
}

async function beOmLenke(epost, turnstileToken){
  const res = await kall('/auth/be-om-lenke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epost, turnstileToken })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Uventet feil (${res.status}).`);
  return data;
}

// Alternativ til å klikke magic-link-en fra e-posten — se README/CLAUDE.md
// for hvorfor: en PWA lagt til på hjemskjermen har ingen adressefelt å lime
// lenken inn i, og lenken åpnes uansett i Safari sin egen, isolerte
// cookie-lagring, atskilt fra PWA-ens. Ved å kjøre HELE verifiseringen som
// et fetch() herfra, havner Set-Cookie-en i den lagringskonteksten denne
// koden faktisk kjører i.
async function verifiserKode(epost, kode){
  const res = await kall('/auth/verifiser-kode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epost, kode })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Uventet feil (${res.status}).`);
  return { epost: data.epost, kortnavn: data.kortnavn, rolle: data.rolle };
}

async function loggUt(){
  await kall('/auth/logg-ut', { method: 'POST' });
}

// Erstatter FungiStore.loadFile(personalPath) — hele den personlige
// blob-en (finds/cuts/hogstOmrader/customLocations/favoriteSpecies).
async function hentMineData(){
  const res = await kall('/meg/data');
  if (!res.ok) throw new Error(`Kunne ikke hente dine data (${res.status}).`);
  return res.json();
}

// Erstatter FungiStore.saveFile(personalPath, ...) — hele blob-en lagres i
// ett kall, samme "helskriving" som dagens persistAll() i app.js.
async function lagreMineData(payload){
  const res = await kall('/meg/data', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke lagre dine data (${res.status}).`);
  return data;
}

// Erstatter FungiStore.loadFile(locationsPath) — delt, allerede-analysert
// terrengdatasett, lesbart for alle innloggede (admin og bruker).
async function hentTerrengdata(){
  const res = await kall('/terrengdata');
  if (!res.ok) throw new Error(`Kunne ikke hente terrengdata (${res.status}).`);
  return res.json();
}

// Ekte Artsdatabanken-observasjoner — driver "kjente funn"-kartlaget.
async function hentArtsfunn(){
  const res = await kall('/terrengdata/artsfunn');
  if (!res.ok) throw new Error(`Kunne ikke hente artsfunn (${res.status}).`);
  return res.json();
}

// Resultatet av å berike ETT egendefinert funn-sted (se trigBerikelse under).
async function hentBerikelse(locationId){
  const res = await kall(`/terrengdata/berikelse/${encodeURIComponent(locationId)}`);
  if (!res.ok) throw new Error(`Kunne ikke hente berikelse (${res.status}).`);
  return res.json();
}

// Admin-only server-side (se worker/api/src/routes/omrader.js) — dekning av
// allerede hentede områder, for "Hent terrengdata"-panelet.
async function hentOmraderDekning(){
  const res = await kall('/omrader/dekning');
  if (!res.ok) throw new Error(`Kunne ikke hente dekning (${res.status}).`);
  return res.json();
}

async function startOmradeHenting(inputs){
  const res = await kall('/omrader/hent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke starte jobben (${res.status}).`);
  return data;
}

async function hentOmradeStatus(sinceIso){
  const q = sinceIso ? `?siden=${encodeURIComponent(sinceIso)}` : '';
  const res = await kall(`/omrader/status${q}`);
  if (!res.ok) throw new Error(`Kunne ikke hente jobbstatus (${res.status}).`);
  return res.json();
}

// IKKE admin-only — berikelse av ett eget funn-sted er del av å registrere
// et funn, tilgjengelig for enhver innlogget bruker.
async function trigBerikelse(locationId, lat, lon){
  const res = await kall(`/punkt/${encodeURIComponent(locationId)}/berik`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lat, lon })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke starte berikelse (${res.status}).`);
  return data;
}

async function hentPunktStatus(sinceIso){
  const q = sinceIso ? `?siden=${encodeURIComponent(sinceIso)}` : '';
  const res = await kall(`/punkt/status${q}`);
  if (!res.ok) throw new Error(`Kunne ikke hente jobbstatus (${res.status}).`);
  return res.json();
}

async function hentBrukere(){
  const res = await kall('/admin/brukere');
  if (!res.ok) throw new Error(`Kunne ikke hente brukerliste (${res.status}).`);
  return res.json();
}

async function settBrukerStatus(id, status){
  const res = await kall(`/admin/brukere/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke oppdatere bruker (${res.status}).`);
  return data;
}

async function slettBrukerPermanent(id){
  const res = await kall(`/admin/brukere/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke slette bruker (${res.status}).`);
  return data;
}

async function hentInvitasjoner(){
  const res = await kall('/admin/invitasjoner');
  if (!res.ok) throw new Error(`Kunne ikke hente invitasjoner (${res.status}).`);
  return res.json();
}

async function opprettInvitasjon(epost){
  const res = await kall('/admin/invitasjoner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ epost })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke opprette invitasjon (${res.status}).`);
  return data;
}

async function slettInvitasjon(id){
  const res = await kall(`/admin/invitasjoner/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Kunne ikke slette invitasjonen (${res.status}).`);
  }
}

// Uinnlogget-vennlig — sjekker gyldighet FØR registreringsskjemaet vises.
async function sjekkInvitasjon(token){
  const res = await kall(`/invitasjon/${encodeURIComponent(token)}`);
  if (!res.ok) throw new Error(`Kunne ikke sjekke invitasjonen (${res.status}).`);
  return res.json();
}

async function registrerMedInvitasjon(token, kortnavn){
  const res = await kall(`/invitasjon/${encodeURIComponent(token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kortnavn })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Kunne ikke registrere deg (${res.status}).`);
  return data;
}

window.ApiClient = {
  meg, beOmLenke, verifiserKode, loggUt,
  hentMineData, lagreMineData,
  hentTerrengdata, hentArtsfunn, hentBerikelse,
  hentOmraderDekning, startOmradeHenting, hentOmradeStatus,
  trigBerikelse, hentPunktStatus,
  hentBrukere, settBrukerStatus, slettBrukerPermanent,
  hentInvitasjoner, opprettInvitasjon, slettInvitasjon,
  sjekkInvitasjon, registrerMedInvitasjon
};
