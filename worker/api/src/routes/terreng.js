import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { requireSession } from '../lib/session.js';
import { loadFile } from '../lib/github.js';
import { hentTerrengStederFraDb, hentArtsfunnFraDb } from '../lib/terrengDb.js';

// Delt, allerede-analysert terrengdatasett — lesetilgang for BÅDE admin og
// vanlige (inviterte) brukere, i motsetning til routes/omrader.js sine
// admin-only endepunkter som utvider datasettet. Leser fra D1 siden
// D1-migrasjon fase 3 (se fungifinder-db/D1-MIGRASJON.md) — GitHub-JSON-en
// er ikke lenger i lesevei for noen bruker, kun fetch_area.py sin
// dobbel-skriving (fase 4 fjerner den også).
//
// ?fylke=/?kommune= er valgfrie — speiler js/app.js sin fylkeFilter/
// kommuneFilter EKSAKT (se loadLocations() der), som nå re-henter fra
// serveren ved filterbytte i stedet for å filtrere et allerede fullt
// innlastet array klient-side. Ingen av dem satt = hele datasettet, samme
// kontrakt som før filtrering ble lagt til.
export async function hentTerrengdata({ request, env, url }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const fylke = url.searchParams.get('fylke') || undefined;
  const kommune = url.searchParams.get('kommune') || undefined;
  const data = await hentTerrengStederFraDb(env, { fylke, kommune });
  return json(data, 200, cors);
}

// Ekte Artsdatabanken-observasjoner (art/koordinat/dato), akkumulert av
// fetch_area.py i data/artsfunn.json — driver "kjente funn"-kartlaget
// (renderArtskartLayer i app.js). Delt lesedata, samme tilgang og samme
// D1-migrasjon (fase 3) som hentTerrengdata() over.
//
// ?minLat=/?maxLat=/?minLon=/?maxLon= er et valgfritt bbox-filter (se
// terrengDb.js) — speiler kartets synlige utsnitt (paddet), sendt av
// js/app.js sin loadArtsfunn() ved oppstart og panorering/zooming. Krever
// ALLE fire gyldige tall for å filtrere, ellers uendret oppførsel (hele
// datasettet).
export async function hentArtsfunn({ request, env, url }) {
  const cors = corsHeaders(env);
  const bruker = await requireSession(request, env);
  if (!bruker) return json({ error: 'Ikke innlogget.' }, 401, cors);

  const tall = (nokkel) => {
    const v = url.searchParams.get(nokkel);
    if (v == null || v === '') return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const data = await hentArtsfunnFraDb(env, {
    minLat: tall('minLat'), maxLat: tall('maxLat'),
    minLon: tall('minLon'), maxLon: tall('maxLon'),
  });
  return json(data, 200, cors);
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
