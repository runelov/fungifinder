import { json } from '../lib/json.js';
import { corsHeaders, sjekkOpprinnelse } from '../lib/cors.js';
import { requireAdmin, requireSession } from '../lib/session.js';
import { loadFile, triggerWorkflow, getLatestRun } from '../lib/github.js';

// Admin-only: dette er nettopp "sette i gang analyse av nye områder", som
// inviterte brukere eksplisitt IKKE skal ha tilgang til.
export async function hentDekning({ request, env }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const { data } = await loadFile('data/fetched-areas.json', env);
  return json(data || [], 200, cors);
}

export async function startOmradeHenting({ request, env }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);
  if (!sjekkOpprinnelse(request, env)) return json({ error: 'Ugyldig forespørsel.' }, 403, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }

  const { mode, value, lat, lon, radiusKm, gridKm } = body || {};
  if (!mode) return json({ error: 'Mangler mode.' }, 400, cors);

  try {
    await triggerWorkflow('fetch-area.yml', {
      mode: String(mode),
      value: value != null ? String(value) : '',
      lat: lat != null ? String(lat) : '',
      lon: lon != null ? String(lon) : '',
      radiusKm: radiusKm != null ? String(radiusKm) : '15',
      gridKm: gridKm != null ? String(gridKm) : '1.5',
    }, env);
  } catch (e) {
    return json({ error: e.message }, 502, cors);
  }
  return json({ ok: true }, 200, cors);
}

export async function omradeStatus({ request, env, url }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const sinceIso = url.searchParams.get('siden') || undefined;
  try {
    const run = await getLatestRun('fetch-area.yml', sinceIso, env);
    return json(run, 200, cors);
  } catch (e) {
    return json({ error: e.message }, 502, cors);
  }
}

// IKKE admin-only: berikelse av ett eget funn-sted er en del av "registrer
// funn", tilgjengelig for enhver innlogget bruker — se routes/terreng.js
// sin hentBerikelse() for motstykket som leser resultatet tilbake.
export async function berikPunkt({ request, env, params }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);
  if (!sjekkOpprinnelse(request, env)) return json({ error: 'Ugyldig forespørsel.' }, 403, cors);

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
