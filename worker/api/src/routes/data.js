import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { requireSession } from '../lib/session.js';

const TOM_STRUKTUR = { finds: [], cuts: [], hogstOmrader: [], customLocations: [], favoriteSpecies: [] };
const TILLATTE_NOKLER = Object.keys(TOM_STRUKTUR);

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
  for (const nokkel of TILLATTE_NOKLER) {
    rensket[nokkel] = Array.isArray(body[nokkel]) ? body[nokkel] : TOM_STRUKTUR[nokkel];
  }

  await env.DB.prepare(
    `INSERT INTO bruker_data (bruker_id, data, oppdatert) VALUES (?, ?, datetime('now'))
     ON CONFLICT(bruker_id) DO UPDATE SET data = excluded.data, oppdatert = datetime('now')`
  )
    .bind(bruker.id, JSON.stringify(rensket))
    .run();

  return json({ ok: true }, 200, cors);
}
