import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { requireSession } from '../lib/session.js';
import { triggerWorkflow, getLatestRun } from '../lib/github.js';

// hentDekning()/startOmradeHenting()/omradeStatus() (GET /omrader/dekning,
// POST /omrader/hent, GET /omrader/status — admin-only trigger/polling for
// on-demand fetch-area.yml-kjøringer) fjernet 2026-08-21. Admin-panelet i
// webappen som kalte disse ble fjernet samme dag (js/app.js/index.html) —
// nasjonalt sveip kjøres nå i faste fylkesbolker via `gh workflow run`
// direkte, se fungifinder/docs/veien-videre.md. hentFetchedAreasFraDb()
// (worker/api/src/lib/terrengDb.js) er IKKE fjernet — fortsatt i bruk av
// routes/etlImport.js sin eksporterTerrengdata() (fetch_area.py sin
// fetch_from_d1(), aktivt brukt av selve ETL-en).

// IKKE admin-only: berikelse av ett eget funn-sted er en del av "registrer
// funn", tilgjengelig for enhver innlogget bruker — se routes/terreng.js
// sin hentBerikelse() for motstykket som leser resultatet tilbake.
export async function berikPunkt({ request, env, params }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }
  const { lat, lon } = body || {};
  if (lat == null || lon == null) return json({ error: 'Mangler lat/lon.' }, 400, cors);

  try {
    await triggerWorkflow('enrich-point.yml', {
      locationId: params.id,
      lat: String(lat),
      lon: String(lon),
    }, env);
  } catch (e) {
    return json({ error: e.message }, 502, cors);
  }
  return json({ ok: true }, 200, cors);
}

export async function punktStatus({ request, env, url }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const sinceIso = url.searchParams.get('siden') || undefined;
  try {
    const run = await getLatestRun('enrich-point.yml', sinceIso, env);
    return json(run, 200, cors);
  } catch (e) {
    return json({ error: e.message }, 502, cors);
  }
}
