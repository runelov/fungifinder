import { json } from '../lib/json.js';
import { corsHeaders } from '../lib/cors.js';
import { timingSafeEqual } from '../lib/crypto.js';
import { hentTerrengStederFraDb, hentArtsfunnFraDb, hentFetchedAreasFraDb } from '../lib/terrengDb.js';

// D1-skrivevei for fetch_area.py (GitHub Actions), se
// fungifinder-db/D1-MIGRASJON.md fase 1, alternativ B. `fetch_area.py`
// kjører UTENFOR denne Workeren og har derfor ingen D1-binding — dette er
// det ENESTE stedet i hele systemet som skriver til D1 fra utsiden.
// Autentisert med et delt, smalt scopet hemmelighet (X-Etl-Secret),
// IKKE en admin-brukersesjon — GitHub Actions har ingen innlogget bruker.
// requireAdmin/requireSession gjelder ikke her, se D1-MIGRASJON.md sitt
// sikkerhetsavsnitt for hvorfor dette er et smalere angrepsflate enn
// dagens GITHUB_PAT, ikke bredere.

const TABELLER = ['terreng_steder', 'artsfunn', 'fetched_areas'];
const MAKS_RADER_PER_KALL = 500; // holder D1 batch()-kall innenfor rimelig statement-antall per forespørsel

// null i stedet for undefined — D1 sin .bind() godtar ikke undefined.
const nz = (v) => (v === undefined ? null : v);
const nzArr = (v) => JSON.stringify(v ?? []);

function stedTilRad(sted) {
  return [
    sted.id, sted.name, nz(sted.fylke), nz(sted.kommune), sted.lat, sted.lon,
    nzArr(sted.treslag), nz(sted.skogalder), nz(sted.fuktighet), nz(sted.fuktighetIndex),
    nz(sted.berggrunn), nz(sted.helningGrader), nz(sted.himmelretning), nz(sted.hoydeMoh),
    nz(sted.avstandVeiM), nz(sted.kjorbarVei), nz(sted.befolkning),
    nz(sted.hogstAr), nz(sted.hogstaarSjekketDato),
    nzArr(sted.kjenteFunn), nzArr(sted.kjenteFunnDetaljer),
    nz(sted.parkeringNotat), nz(sted.avstandParkeringM),
    nz(sted.stier), nz(sted.avstandStiM),
    sted.custom ? 1 : 0, sted.kilde, sted.hentetDato,
  ];
}

function artsfunnTilRad(o) {
  return [o.id, o.art, o.lat, o.lon, nz(o.dato), nz(o.url), nz(o.trackDateTime)];
}

function dekningTilRad(a) {
  return [
    a.mode, nz(a.value), nz(a.lat), nz(a.lon), nz(a.radiusKm), nz(a.gridKm),
    nz(a.pointsChecked), nz(a.pointsAdded), a.fetchedAt, nz(a.osmInfraRefreshedAt),
  ];
}

const STED_UPSERT = `
  INSERT INTO terreng_steder (
    id, navn, fylke, kommune, lat, lon, treslag, skogalder, fuktighet, fuktighet_index,
    berggrunn, helning_grader, himmelretning, hoyde_moh, avstand_vei_m, kjorbar_vei, befolkning,
    hogst_ar, hogstaar_sjekket_dato, kjente_funn, kjente_funn_detaljer,
    parkering_notat, avstand_parkering_m, stier, avstand_sti_m, custom, kilde, hentet_dato, oppdatert
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    navn=excluded.navn, fylke=excluded.fylke, kommune=excluded.kommune, lat=excluded.lat, lon=excluded.lon,
    treslag=excluded.treslag, skogalder=excluded.skogalder, fuktighet=excluded.fuktighet,
    fuktighet_index=excluded.fuktighet_index, berggrunn=excluded.berggrunn, helning_grader=excluded.helning_grader,
    himmelretning=excluded.himmelretning, hoyde_moh=excluded.hoyde_moh, avstand_vei_m=excluded.avstand_vei_m,
    kjorbar_vei=excluded.kjorbar_vei, befolkning=excluded.befolkning, hogst_ar=excluded.hogst_ar,
    hogstaar_sjekket_dato=excluded.hogstaar_sjekket_dato, kjente_funn=excluded.kjente_funn,
    kjente_funn_detaljer=excluded.kjente_funn_detaljer, parkering_notat=excluded.parkering_notat,
    avstand_parkering_m=excluded.avstand_parkering_m, stier=excluded.stier, avstand_sti_m=excluded.avstand_sti_m,
    custom=excluded.custom, kilde=excluded.kilde, hentet_dato=excluded.hentet_dato, oppdatert=datetime('now')
`;

// Artskart-observasjoner endres aldri i ettertid — kun nye id-er kan dukke
// opp (samme "dedup på id"-prinsipp som merge_artsfunn_file() i
// fetch_area.py brukte mot JSON-filen). DO NOTHING holder dette idempotent.
const ARTSFUNN_UPSERT = `
  INSERT INTO artsfunn (id, art, lat, lon, dato, url, track_date_time)
  VALUES (?,?,?,?,?,?,?)
  ON CONFLICT(id) DO NOTHING
`;

const DEKNING_INSERT = `
  INSERT INTO fetched_areas (mode, value, lat, lon, radius_km, grid_km, points_checked, points_added, fetched_at, osm_infra_refreshed_at)
  VALUES (?,?,?,?,?,?,?,?,?,?)
`;

function harGyldigEtlSecret(request, env) {
  const secret = request.headers.get('X-Etl-Secret') || '';
  return !!env.ETL_SHARED_SECRET && timingSafeEqual(secret, env.ETL_SHARED_SECRET);
}

export async function importTerrengdata({ request, env }) {
  const cors = corsHeaders(env);

  if (!harGyldigEtlSecret(request, env)) {
    return json({ error: 'Ugyldig eller manglende X-Etl-Secret.' }, 401, cors);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Ugyldig forespørsel (ikke gyldig JSON).' }, 400, cors);
  }

  const { table, mode, rows } = body || {};
  if (!TABELLER.includes(table)) {
    return json({ error: `Ukjent tabell: ${table}` }, 400, cors);
  }
  if (!Array.isArray(rows)) {
    return json({ error: 'rows må være en liste.' }, 400, cors);
  }
  if (rows.length > MAKS_RADER_PER_KALL) {
    return json({ error: `Maks ${MAKS_RADER_PER_KALL} rader per kall — del opp i flere forespørsler.` }, 400, cors);
  }

  try {
    if (table === 'fetched_areas') {
      if (mode !== 'replace_all') return json({ error: 'fetched_areas krever mode=replace_all.' }, 400, cors);
      const statements = [env.DB.prepare('DELETE FROM fetched_areas')];
      for (const rad of rows) statements.push(env.DB.prepare(DEKNING_INSERT).bind(...dekningTilRad(rad)));
      await env.DB.batch(statements);
    } else if (table === 'terreng_steder') {
      if (mode !== 'upsert') return json({ error: 'terreng_steder krever mode=upsert.' }, 400, cors);
      if (rows.length > 0) {
        const statements = rows.map((rad) => env.DB.prepare(STED_UPSERT).bind(...stedTilRad(rad)));
        await env.DB.batch(statements);
      }
    } else if (table === 'artsfunn') {
      if (mode !== 'upsert') return json({ error: 'artsfunn krever mode=upsert.' }, 400, cors);
      if (rows.length > 0) {
        const statements = rows.map((rad) => env.DB.prepare(ARTSFUNN_UPSERT).bind(...artsfunnTilRad(rad)));
        await env.DB.batch(statements);
      }
    }
  } catch (e) {
    console.error(`ETL-import feilet for ${table}:`, e);
    return json({ error: `Databasefeil ved import til ${table}: ${e.message}` }, 500, cors);
  }

  return json({ ok: true, table, mode, count: rows.length }, 200, cors);
}

// D1-lesevei for fetch_area.py (D1-migrasjon fase 4, se D1-MIGRASJON.md):
// GitHub-JSON-filene skrives ikke lenger til for terreng_steder/artsfunn/
// fetched_areas, så ETL-skriptet må lese SIN egen "gjeldende tilstand" (for
// dedup/oppfriskings-logikk) herfra i stedet for en lokal, git-sjekket-ut
// fil som ellers ville stått PERMANENT FASTFROSSET på hva den var idet
// dobbel-skrivingen sluttet. Samme X-Etl-Secret-auth som importTerrengdata()
// over — symmetrisk lese/skrive-par, ett sted i systemet med denne tilgangen.
export async function eksporterTerrengdata({ request, env, url }) {
  const cors = corsHeaders(env);

  if (!harGyldigEtlSecret(request, env)) {
    return json({ error: 'Ugyldig eller manglende X-Etl-Secret.' }, 401, cors);
  }

  const table = url.searchParams.get('tabell');
  if (!TABELLER.includes(table)) {
    return json({ error: `Ukjent tabell: ${table}` }, 400, cors);
  }

  // fylke/kommune/bbox (2026-08-16): valgfrie server-side filtre, videreført
  // til hentTerrengStederFraDb (som app.js sin egen fylke/kommune-filtrering
  // allerede brukte — kun denne ETL-eksportruten manglet dem). fetch_area.py
  // sin --refresh-existing gjorde tidligere ETT ufiltrert SELECT * FROM
  // terreng_steder (12 700+ rader) PER allerede-hentede område i
  // refresh-areas.yml (opptil 31 ganger i én kjøring) — dette overbelastet
  // Workeren og ga intermitterende 503 (se CHANGELOG 2026-08-16). Ingen
  // parametre satt = uendret oppførsel (hele datasettet).
  let data;
  if (table === 'terreng_steder') {
    const num = (navn) => {
      const v = url.searchParams.get(navn);
      return v === null ? undefined : Number(v);
    };
    data = await hentTerrengStederFraDb(env, {
      fylke: url.searchParams.get('fylke') || undefined,
      kommune: url.searchParams.get('kommune') || undefined,
      minLat: num('minLat'),
      maxLat: num('maxLat'),
      minLon: num('minLon'),
      maxLon: num('maxLon'),
    });
  } else if (table === 'artsfunn') {
    data = await hentArtsfunnFraDb(env);
  } else {
    data = await hentFetchedAreasFraDb(env);
  }

  return json(data, 200, cors);
}
