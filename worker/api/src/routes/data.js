import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { requireSession } from '../lib/session.js';

// RETTET 2026-08-13 (bruker ba om at innloggede kan velge å dele egne funn
// med andre innloggede): lagt til `delFunn` (boolsk, default false) i
// samme blob — én global av/på-bryter, ikke per-funn. ARRAY_NOKLER/
// BOOLSK_NOKLER skiller nå eksplisitt mellom de to feilttypene i
// rensk-loopen under, siden delFunn IKKE er et array som resten. Se
// hentDelteFunn() lenger ned for lesesiden (hva ANDRE brukere faktisk ser).
const TOM_STRUKTUR = { finds: [], cuts: [], hogstOmrader: [], customLocations: [], favoriteSpecies: [], delFunn: false };
const ARRAY_NOKLER = ['finds', 'cuts', 'hogstOmrader', 'customLocations', 'favoriteSpecies'];

// Én JSON-blob per bruker — samme skjema som dagens data/personal.json i
// fungifinder-db (finds/cuts/hogstOmrader/customLocations/favoriteSpecies),
// bare lagret i D1 og skilt per bruker_id. Erstatter
// js/github-store.js sin loadFile/saveFile for personal-data-delen —
// speiler dagens loadStorage()/persistAll() i app.js ett-til-ett, slik at
// appens kallende kode kan endres minimalt.
export async function hentMineData({ request, env }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const rad = await env.DB.prepare('SELECT data FROM bruker_data WHERE bruker_id = ?').bind(bruker.id).first();
  if (!rad) return json(TOM_STRUKTUR, 200, cors);

  let parsed;
  try {
    parsed = JSON.parse(rad.data);
  } catch {
    parsed = {};
  }
  return json({ ...TOM_STRUKTUR, ...parsed }, 200, cors);
}

export async function lagreMineData({ request, env }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return json({ error: 'Ugyldig datastruktur.' }, 400, cors);
  }

  // Bevisst kun de kjente nøklene, ikke et vilkårlig objekt — hindrer at
  // uventede/skadelige felter havner i D1 og at raden vokser ubegrenset.
  const rensket = {};
  for (const nokkel of ARRAY_NOKLER) {
    rensket[nokkel] = Array.isArray(body[nokkel]) ? body[nokkel] : TOM_STRUKTUR[nokkel];
  }
  rensket.delFunn = body.delFunn === true;

  await env.DB.prepare(
    `INSERT INTO bruker_data (bruker_id, data, oppdatert) VALUES (?, ?, datetime('now'))
     ON CONFLICT(bruker_id) DO UPDATE SET data = excluded.data, oppdatert = datetime('now')`
  )
    .bind(bruker.id, JSON.stringify(rensket))
    .run();

  return json({ ok: true }, 200, cors);
}

// Leser funn fra ANDRE brukere som har skrudd PÅ delFunn — se
// requireSession()-sjekk (krever innlogging, men verken admin-rolle eller
// noen spesifikk relasjon til de delende brukerne). Ekskluderer alltid
// den innloggede brukeren selv (deres egne funn vises allerede via den
// private findsLayer i app.js, uansett delFunn-status).
//
// Et funn refererer kun `locId`, ikke koordinater direkte — de løses her,
// server-side, mot ENTEN et delt terreng_steder-punkt ELLER et av den
// delende brukerens EGNE customLocations (aldri delt i seg selv, kun disse
// spesifikt REFERERTE koordinatene slippes ut). Brukernavn (kortnavn) tas
// eksplisitt med — bevisst valg (se samtalen 2026-08-13): mer sosial
// kontekst enn et anonymt Artskart-lignende punkt, på bekostning av at
// funnstedet knyttes til en identifiserbar bruker for andre innloggede.
export async function hentDelteFunn({ request, env }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const rader = await env.DB.prepare(
    `SELECT b.id, b.kortnavn, bd.data
     FROM brukere b JOIN bruker_data bd ON bd.bruker_id = b.id
     WHERE b.status = 'aktiv' AND b.slettet_tidspunkt IS NULL AND b.id != ?1`
  ).bind(bruker.id).all();

  const delere = [];
  const trengteLocIds = new Set();
  for (const rad of rader.results) {
    let d;
    try { d = JSON.parse(rad.data); } catch { continue; }
    if (d.delFunn !== true || !Array.isArray(d.finds) || !d.finds.length) continue;
    const customById = Object.fromEntries((Array.isArray(d.customLocations) ? d.customLocations : []).map((l) => [l.id, l]));
    for (const f of d.finds) {
      if (!customById[f.locId]) trengteLocIds.add(f.locId);
    }
    delere.push({ kortnavn: rad.kortnavn, finds: d.finds, customById });
  }

  let terrengById = {};
  const idListe = Array.from(trengteLocIds);
  if (idListe.length) {
    const plassholdere = idListe.map(() => '?').join(',');
    const terrengRader = await env.DB.prepare(
      `SELECT id, lat, lon FROM terreng_steder WHERE id IN (${plassholdere})`
    ).bind(...idListe).all();
    terrengById = Object.fromEntries(terrengRader.results.map((r) => [r.id, r]));
  }

  const ut = [];
  for (const d of delere) {
    for (const f of d.finds) {
      const loc = d.customById[f.locId] || terrengById[f.locId];
      if (!loc || typeof f.speciesId !== 'string') continue; // stedet finnes ikke lenger (f.eks. omhentet/slettet område)
      ut.push({ art: f.speciesId, dato: f.date || null, lat: loc.lat, lon: loc.lon, kortnavn: d.kortnavn });
    }
  }
  return json(ut, 200, cors);
}
