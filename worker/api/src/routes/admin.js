import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { requireAdmin } from '../lib/session.js';
import { randomToken, sha256Hex } from '../lib/crypto.js';
import { validerEpost } from '../lib/invitasjoner.js';

export async function listBrukere({ request, env }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const { results } = await env.DB.prepare(
    `SELECT id, epost, kortnavn, rolle, status, slettet_tidspunkt, aktivert_tidspunkt, opprettet
     FROM brukere ORDER BY opprettet`
  ).all();
  return json(results, 200, cors);
}

export async function oppdaterBrukerStatus({ request, env, params }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const id = parseInt(params.id, 10);
  if (id === admin.id) return json({ error: 'Du kan ikke endre din egen konto her.' }, 400, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }
  if (body.status !== 'aktiv' && body.status !== 'deaktivert') {
    return json({ error: 'Ugyldig status.' }, 400, cors);
  }

  const rad = await env.DB.prepare('SELECT slettet_tidspunkt FROM brukere WHERE id = ?').bind(id).first();
  if (!rad) return json({ error: 'Fant ikke bruker.' }, 404, cors);
  if (rad.slettet_tidspunkt) return json({ error: 'Bruker er permanent slettet.' }, 400, cors);

  await env.DB.prepare('UPDATE brukere SET status = ? WHERE id = ?').bind(body.status, id).run();

  // Umiddelbar tilbaketrekking ved deaktivering — ikke bare sperre fremtidig
  // innlogging, samme prinsipp som requireSession()s status-sjekk.
  if (body.status === 'deaktivert') {
    await env.DB.prepare('DELETE FROM sesjoner WHERE bruker_id = ?').bind(id).run();
  }

  return json({ ok: true }, 200, cors);
}

export async function slettBrukerPermanent({ request, env, params }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const id = parseInt(params.id, 10);
  if (id === admin.id) return json({ error: 'Du kan ikke slette din egen konto her.' }, 400, cors);

  const rad = await env.DB.prepare('SELECT slettet_tidspunkt FROM brukere WHERE id = ?').bind(id).first();
  if (!rad) return json({ error: 'Fant ikke bruker.' }, 404, cors);
  if (rad.slettet_tidspunkt) return json({ error: 'Bruker er allerede permanent slettet.' }, 400, cors);

  // Scrubber e-post i stedet for å slette raden — unngår å bryte
  // bruker_data sin fremmednøkkel mot brukere.id.
  const plassholderEpost = `slettet-${id}@slettet.invalid`;
  await env.DB.prepare(
    `UPDATE brukere SET epost = ?, status = 'deaktivert', slettet_tidspunkt = datetime('now') WHERE id = ?`
  )
    .bind(plassholderEpost, id)
    .run();
  await env.DB.prepare('DELETE FROM sesjoner WHERE bruker_id = ?').bind(id).run();

  return json({ ok: true }, 200, cors);
}

const INVITASJON_LEVETID_MS = 7 * 24 * 60 * 60 * 1000; // 7 dager

export async function listInvitasjoner({ request, env }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const { results } = await env.DB.prepare(
    `SELECT i.id, i.epost, i.brukt, i.utloper, i.opprettet,
            opp.kortnavn AS opprettet_av_kortnavn,
            bru.kortnavn AS brukt_av_kortnavn
     FROM invitasjoner i
     JOIN brukere opp ON opp.id = i.opprettet_av_bruker_id
     LEFT JOIN brukere bru ON bru.id = i.brukt_av_bruker_id
     ORDER BY i.opprettet DESC`
  ).all();
  return json(results, 200, cors);
}

// Lenken bindes til én bestemt adresse admin selv oppgir, ikke noe den som
// klikker lenken kan velge fritt ved registrering — se lib/invitasjoner.js.
export async function opprettInvitasjon({ request, env }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }

  let epost;
  try {
    epost = validerEpost(body.epost);
  } catch (e) {
    return json({ error: e.message }, 400, cors);
  }

  const rawToken = randomToken();
  const hash = await sha256Hex(rawToken);
  const utloper = Date.now() + INVITASJON_LEVETID_MS;

  const rad = await env.DB.prepare(
    `INSERT INTO invitasjoner (token_hash, epost, opprettet_av_bruker_id, utloper) VALUES (?, ?, ?, ?) RETURNING id`
  )
    .bind(hash, epost, admin.id, utloper)
    .first();

  // Rå token returneres kun i DETTE svaret — bare hashen lagres, samme
  // "vises kun nå"-prinsipp som magic-link-tokens.
  return json({ id: rad.id, token: rawToken, epost, utloper }, 201, cors);
}

export async function slettInvitasjon({ request, env, params }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const rad = await env.DB.prepare('SELECT brukt FROM invitasjoner WHERE id = ?').bind(params.id).first();
  if (!rad) return json({ error: 'Fant ikke invitasjonen.' }, 404, cors);
  if (rad.brukt) return json({ error: 'Kan ikke trekke tilbake en invitasjon som allerede er brukt.' }, 400, cors);

  await env.DB.prepare('DELETE FROM invitasjoner WHERE id = ?').bind(params.id).run();
  return new Response(null, { status: 204, headers: cors });
}

// Oversikt over datamengden i D1, nå som ALT (terrengdata siden
// D1-MIGRASJON.md fase 4, personlige data siden migrations/0001) faktisk
// bor der — admin hadde ingen samlet innsikt i verken dekning
// (hvilke fylker/kommuner har målepunkter) eller hvor mye brukerne selv
// bidrar med (funn/hogstfelt-merking) før dette endepunktet. bruker_data
// er én JSON-blob per bruker (se routes/data.js), så telling av
// funn/cuts/hogstOmrader/customLocations/favoriteSpecies må skje i JS
// etter henting — det finnes ingen SQL-kolonne å GROUP BY her.
//
// RETTET 2026-08-13: `favoritter.topp` lagt til (bruker ba om et
// sammendrag av mest populære favoritt-sopper i Statistikk-fanen) — samme
// JS-loop over bruker_data.data.favoriteSpecies som allerede eksisterte
// for antall('favoriteSpecies') per bruker, men nå OGSÅ tallfestet PER
// ART på tvers av alle brukere. Kun rå artsID-er telles/returneres her
// (SPECIES-navnene finnes kun i frontend) — navneoppslaget skjer i
// renderAdminStatistikk() i js/app.js.
export async function hentStatistikk({ request, env }) {
  const cors = corsHeaders(env);
  const admin = await requireAdmin(request, env);
  if (!admin) return json({ error: 'Krever admin-tilgang.' }, 403, cors);

  const [totalRad, fylkeRader, kommuneRader, kildeRader, artsfunnRad, dekningRad, brukerRader] = await Promise.all([
    env.DB.prepare('SELECT COUNT(*) AS antall FROM terreng_steder').first(),
    env.DB.prepare('SELECT fylke, COUNT(*) AS antall FROM terreng_steder GROUP BY fylke ORDER BY antall DESC').all(),
    env.DB.prepare('SELECT kommune, fylke, COUNT(*) AS antall FROM terreng_steder GROUP BY kommune, fylke ORDER BY antall DESC').all(),
    env.DB.prepare('SELECT custom, COUNT(*) AS antall FROM terreng_steder GROUP BY custom').all(),
    env.DB.prepare('SELECT COUNT(*) AS antall, COUNT(DISTINCT art) AS arter FROM artsfunn').first(),
    env.DB.prepare('SELECT COUNT(*) AS antall, MAX(fetched_at) AS siste FROM fetched_areas').first(),
    env.DB.prepare(
      `SELECT b.id, b.kortnavn, b.epost, b.rolle, b.status, b.slettet_tidspunkt, bd.data, bd.oppdatert
       FROM brukere b LEFT JOIN bruker_data bd ON bd.bruker_id = b.id
       ORDER BY b.opprettet`
    ).all(),
  ]);

  const kildeMap = Object.fromEntries(kildeRader.results.map((r) => [r.custom ? 'custom' : 'autoEtl', r.antall]));

  // Bevisst ikke filtrert bort permanent slettede brukere — bruker_data-
  // raden deres blir stående (kun sesjon/epost scrubbes, se
  // slettBrukerPermanent over), så tallene ville vært misvisende lave uten
  // dem. Frontend markerer dem i stedet med "slettet"-status.
  // Telling per art (ikke bare antall FAVORITTER per bruker, som allerede
  // fantes over) — brukes til "mest populære favoritt-sopper"-sammendraget
  // i Statistikk-fanen. Kun rå artsID-er telles her; SPECIES-navnene finnes
  // kun i frontend (js/app.js), så navneoppslaget skjer klient-side.
  // Bevisst IKKE filtrert bort permanent slettede brukere sine favoritter —
  // samme begrunnelse som brukere-listen under (misvisende lave tall ellers).
  const favorittTelling = {};

  const brukere = brukerRader.results.map((rad) => {
    let d = {};
    try { d = rad.data ? JSON.parse(rad.data) : {}; } catch { d = {}; }
    const antall = (nokkel) => (Array.isArray(d[nokkel]) ? d[nokkel].length : 0);
    if (Array.isArray(d.favoriteSpecies)) {
      for (const art of d.favoriteSpecies) {
        if (typeof art === 'string' && art) favorittTelling[art] = (favorittTelling[art] || 0) + 1;
      }
    }
    return {
      id: rad.id,
      kortnavn: rad.kortnavn,
      epost: rad.epost,
      rolle: rad.rolle,
      status: rad.status,
      slettet: !!rad.slettet_tidspunkt,
      funn: antall('finds'),
      hogstMerket: antall('cuts'),
      hogstOmrader: antall('hogstOmrader'),
      egneSteder: antall('customLocations'),
      favoritter: antall('favoriteSpecies'),
      oppdatert: rad.oppdatert || null,
    };
  });

  const favorittTopp = Object.entries(favorittTelling)
    .map(([art, antall]) => ({ art, antall }))
    .sort((a, b) => b.antall - a.antall);

  return json({
    malepunkter: {
      totalt: totalRad.antall,
      autoEtl: kildeMap.autoEtl || 0,
      custom: kildeMap.custom || 0,
      perFylke: fylkeRader.results.map((r) => ({ fylke: r.fylke || 'ukjent', antall: r.antall })),
      perKommune: kommuneRader.results.map((r) => ({ kommune: r.kommune || 'ukjent', fylke: r.fylke || 'ukjent', antall: r.antall })),
    },
    artsfunn: { totalt: artsfunnRad.antall, arter: artsfunnRad.arter },
    dekning: { kjoringer: dekningRad.antall, sisteHenting: dekningRad.siste },
    favoritter: { topp: favorittTopp },
    brukere,
  }, 200, cors);
}
