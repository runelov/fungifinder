import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { randomToken, randomDigitCode, sha256Hex, timingSafeEqual } from '../lib/crypto.js';
import { verifyTurnstile } from '../lib/turnstile.js';
import { sjekkOgTellEpost, sjekkOgTellIp } from '../lib/ratelimit.js';
import { sendInnloggingsLenke } from '../lib/epost.js';
import { opprettSesjon, sesjonCookieHeader, slettSesjonCookieHeader, slettSesjon } from '../lib/session.js';

const TOKEN_LEVETID_MS = 15 * 60 * 1000; // 15 minutter
const MAALTID_MS = 700; // se tidsnormaliser()
const KODE_MAKS_FORSOK = 5;

export async function beOmLenke({ request, env, url }) {
  const start = Date.now();
  const cors = corsHeaders(env);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }

  const epost = (body.epost || '').trim().toLowerCase();
  if (!epost) return json({ error: 'E-post mangler.' }, 400, cors);

  const ip = request.headers.get('CF-Connecting-IP') || 'ukjent';

  // Rekkefølge er bevisst: Turnstile → rate-limit → eksistenssjekk. En 429
  // her lekker ikke om e-posten finnes, bare at avsenderen har sendt mange
  // forespørsler.
  const turnstileOk = await verifyTurnstile(body.turnstileToken, ip, env);
  if (!turnstileOk) {
    return json({ error: 'Kunne ikke bekrefte at forespørselen er ekte.' }, 400, cors);
  }

  const ipOk = await sjekkOgTellIp(ip, 'be-om-lenke', 8, env);
  const epostOk = ipOk ? await sjekkOgTellEpost(epost, env) : false;
  if (!ipOk || !epostOk) {
    return json({ error: 'For mange forsøk. Prøv igjen senere.' }, 429, cors);
  }

  // Fra her: IDENTISK generisk respons uansett treff/ikke-treff, med
  // tidsnormalisert ferdigstillelse. Ikke legg til noen gren under som kan
  // returnere tidligere eller med annen tekst enn suksess-responsen nederst.
  const bruker = await env.DB.prepare('SELECT id, aktivert_tidspunkt FROM brukere WHERE epost = ?1 AND status = ?2')
    .bind(epost, 'aktiv')
    .first();

  if (bruker) {
    if (!bruker.aktivert_tidspunkt) {
      await env.DB.prepare("UPDATE brukere SET aktivert_tidspunkt = datetime('now') WHERE id = ?").bind(bruker.id).run();
    }

    const rawToken = randomToken();
    const hash = await sha256Hex(rawToken);
    const kode = randomDigitCode(6);
    const kodeHash = await sha256Hex(kode);
    const utloper = Date.now() + TOKEN_LEVETID_MS;
    await env.DB.prepare('INSERT INTO innloggingstokens (hash, bruker_id, utloper, kode_hash) VALUES (?, ?, ?, ?)')
      .bind(hash, bruker.id, utloper, kodeHash)
      .run();

    const lenkeUrl = `${url.origin}/auth/verifiser?token=${rawToken}`;
    try {
      await sendInnloggingsLenke(epost, lenkeUrl, kode, env);
    } catch (e) {
      // Svelges bevisst — responsen skal fortsatt se generisk/vellykket ut.
      console.error('Sending av innloggingslenke feilet:', e.message);
    }
  }

  await tidsnormaliser(start);
  return json(
    { melding: 'Hvis denne e-posten er registrert, har du fått en innloggingslenke.' },
    200,
    cors
  );
}

export async function verifiser({ request, env, url }) {
  const cors = corsHeaders(env);
  const ip = request.headers.get('CF-Connecting-IP') || 'ukjent';

  const ipOk = await sjekkOgTellIp(ip, 'verifiser', 20, env);
  if (!ipOk) return json({ error: 'For mange forsøk. Prøv igjen senere.' }, 429, cors);

  const rawToken = url.searchParams.get('token');
  if (!rawToken) return json({ error: 'Token mangler.' }, 400, cors);

  const hash = await sha256Hex(rawToken);
  // Atomisk engangsbruk: RETURNING gir oss bruker_id i samme kall som
  // markerer token brukt — ingen separat les-så-skriv-race.
  const rad = await env.DB.prepare(
    `UPDATE innloggingstokens SET brukt = 1
     WHERE hash = ?1 AND brukt = 0 AND utloper > ?2
     RETURNING bruker_id`
  )
    .bind(hash, Date.now())
    .first();

  if (!rad) {
    return json({ error: 'Lenken er ugyldig, utløpt, eller allerede brukt.' }, 400, cors);
  }

  const sesjonToken = await opprettSesjon(rad.bruker_id, env);

  return new Response(null, {
    status: 302,
    headers: {
      // IKKE env.ALLOWED_ORIGIN her — den er bevisst kun en bar opprinnelse
      // (origin, uten sti), riktig for CORS. Egen APP_URL-variabel peker på
      // selve appens fulle URL.
      Location: env.APP_URL,
      'Set-Cookie': sesjonCookieHeader(sesjonToken),
      ...cors,
    },
  });
}

// Alternativ til verifiser() (som følger lenken) — for konteksten der
// lenken ikke kan brukes: en PWA lagt til på hjemskjermen (iOS
// "display: standalone") har hverken adressefelt å lime lenken inn i, eller
// noen "åpne i app"-håndtering av e-post-lenker, OG har sin egen isolerte
// cookie-lagring atskilt fra Safari — så et vellykket klikk på selve
// lenken (i Safari) setter uansett sesjonscookien i feil lagringsrom. Her
// kjøres hele verifiseringen som et fetch()-kall FRA appens egen JS,
// uansett hvilken lagringskontekst den kjører i, så Set-Cookie-en havner
// rett.
export async function verifiserKode({ request, env }) {
  const cors = corsHeaders(env);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel.' }, 400, cors);
  }

  const epost = (body.epost || '').trim().toLowerCase();
  const kode = (body.kode || '').trim();
  if (!epost || !/^\d{6}$/.test(kode)) {
    return json({ error: 'Ugyldig e-post eller kode.' }, 400, cors);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'ukjent';
  // Kun IP-basert (som verifiser()) — kodens korte levetid, engangsbruk og
  // per-token forsøksgrense under er hovedforsvaret mot gjetting, ikke
  // denne telleren. Bevisst IKKE sjekkOgTellEpost: den deler bøtte med
  // be-om-lenke, og ville låst brukeren ute fra å be om en NY lenke bare
  // fordi de tastet feil kode et par ganger.
  const ipOk = await sjekkOgTellIp(ip, 'verifiser-kode', 20, env);
  if (!ipOk) return json({ error: 'For mange forsøk. Prøv igjen senere.' }, 429, cors);

  const bruker = await env.DB.prepare('SELECT id, epost, kortnavn, rolle FROM brukere WHERE epost = ?1 AND status = ?2')
    .bind(epost, 'aktiv')
    .first();
  if (!bruker) return json({ error: 'Ugyldig eller utløpt kode.' }, 400, cors);

  const rad = await env.DB.prepare(
    `SELECT hash, kode_hash FROM innloggingstokens
     WHERE bruker_id = ?1 AND kode_hash IS NOT NULL AND brukt = 0 AND utloper > ?2 AND kode_forsok < ?3
     ORDER BY utloper DESC LIMIT 1`
  )
    .bind(bruker.id, Date.now(), KODE_MAKS_FORSOK)
    .first();
  if (!rad) return json({ error: 'Ugyldig eller utløpt kode. Be om en ny innloggingslenke.' }, 400, cors);

  // Teller forsøket FØR sammenligning — atomisk mot et samtidig forsøk på
  // samme rad, og gjelder uansett om koden under viser seg riktig.
  await env.DB.prepare('UPDATE innloggingstokens SET kode_forsok = kode_forsok + 1 WHERE hash = ?1 AND kode_forsok < ?2')
    .bind(rad.hash, KODE_MAKS_FORSOK)
    .run();

  const kodeHash = await sha256Hex(kode);
  if (!timingSafeEqual(kodeHash, rad.kode_hash)) {
    return json({ error: 'Feil kode.' }, 400, cors);
  }

  // Atomisk engangsbruk, samme prinsipp som verifiser().
  const brukt = await env.DB.prepare(
    'UPDATE innloggingstokens SET brukt = 1 WHERE hash = ?1 AND brukt = 0 RETURNING bruker_id'
  )
    .bind(rad.hash)
    .first();
  if (!brukt) return json({ error: 'Koden er allerede brukt.' }, 400, cors);

  const sesjonToken = await opprettSesjon(brukt.bruker_id, env);
  return json(
    { epost: bruker.epost, kortnavn: bruker.kortnavn, rolle: bruker.rolle },
    200,
    { ...cors, 'Set-Cookie': sesjonCookieHeader(sesjonToken) }
  );
}

export async function loggUt({ request, env }) {
  const cors = corsHeaders(env);
  await slettSesjon(request, env);
  return new Response(null, {
    status: 204,
    headers: { 'Set-Cookie': slettSesjonCookieHeader(), ...cors },
  });
}

async function tidsnormaliser(startTid) {
  const gjenstaende = MAALTID_MS - (Date.now() - startTid);
  if (gjenstaende > 0) await new Promise((r) => setTimeout(r, gjenstaende));
}
