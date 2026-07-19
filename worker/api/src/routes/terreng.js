import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { requireSession } from '../lib/session.js';
import { loadFile } from '../lib/github.js';

// Delt, allerede-analysert terrengdatasett — lesetilgang for BÅDE admin og
// vanlige (inviterte) brukere, i motsetning til routes/omrader.js sine
// admin-only endepunkter som utvider datasettet. Erstatter loadLocations()
// sitt direkte GitHub-kall i app.js.
export async function hentTerrengdata({ request, env }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const { data } = await loadFile('data/locations.json', env);
  return json(data || [], 200, cors);
}

// Ekte Artsdatabanken-observasjoner (art/koordinat/dato), akkumulert av
// fetch_area.py i data/artsfunn.json — driver "kjente funn"-kartlaget
// (renderArtskartLayer i app.js). Delt lesedata, samme tilgang som
// hentTerrengdata() over.
export async function hentArtsfunn({ request, env }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const { data } = await loadFile('data/artsfunn.json', env);
  return json(data || [], 200, cors);
}

// Leser ÉN oppføring fra data/enrichments.json (se fungifinder-db sin
// enrich-point.yml) — resultatet av å berike ett egendefinert
// funn-sted. Kalt av poll-løkka i app.js etter at et funn har trigget
// POST /punkt/:id/berik (routes/omrader.js). Ikke-personlig data (rene
// terrengfakta for en posisjon), derfor trygt å dele mellom alle
// innloggede brukere fremfor å skille per bruker_id.
export async function hentBerikelse({ request, env, params }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const { data } = await loadFile('data/enrichments.json', env);
  const entry = data && data[params.locationId];
  return json(entry || null, 200, cors);
}
