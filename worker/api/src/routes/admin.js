import { json } from '../lib/json.js';
import { corsHeaders, sjekkOpprinnelse } from '../lib/cors.js';
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
  if (!sjekkOpprinnelse(request, env)) return json({ error: 'Ugyldig forespørsel.' }, 403, cors);

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
  if (!sjekkOpprinnelse(request, env)) return json({ error: 'Ugyldig forespørsel.' }, 403, cors);

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
  if (!sjekkOpprinnelse(request, env)) return json({ error: 'Ugyldig forespørsel.' }, 403, cors);

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
  if (!sjekkOpprinnelse(request, env)) return json({ error: 'Ugyldig forespørsel.' }, 403, cors);

  const rad = await env.DB.prepare('SELECT brukt FROM invitasjoner WHERE id = ?').bind(params.id).first();
  if (!rad) return json({ error: 'Fant ikke invitasjonen.' }, 404, cors);
  if (rad.brukt) return json({ error: 'Kan ikke trekke tilbake en invitasjon som allerede er brukt.' }, 400, cors);

  await env.DB.prepare('DELETE FROM invitasjoner WHERE id = ?').bind(params.id).run();
  return new Response(null, { status: 204, headers: cors });
}
