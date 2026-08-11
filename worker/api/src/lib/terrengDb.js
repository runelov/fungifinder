// D1-lesevei for terrengdata — se fungifinder-db/D1-MIGRASJON.md fase 2/3.
// Rekonstruerer NØYAKTIG samme camelCase-kontrakt som GitHub-JSON-filene ga
// tidligere (js/app.js kjenner denne formen fra data/locations.json/
// artsfunn.json, uendret av denne migreringen).

function radTilSted(rad) {
  return {
    id: rad.id,
    name: rad.navn,
    fylke: rad.fylke,
    kommune: rad.kommune,
    lat: rad.lat,
    lon: rad.lon,
    treslag: JSON.parse(rad.treslag || '[]'),
    skogalder: rad.skogalder,
    fuktighet: rad.fuktighet,
    fuktighetIndex: rad.fuktighet_index,
    berggrunn: rad.berggrunn,
    helningGrader: rad.helning_grader,
    himmelretning: rad.himmelretning,
    hoydeMoh: rad.hoyde_moh,
    avstandVeiM: rad.avstand_vei_m,
    kjorbarVei: rad.kjorbar_vei,
    befolkning: rad.befolkning,
    hogstAr: rad.hogst_ar,
    hogstaarSjekketDato: rad.hogstaar_sjekket_dato,
    kjenteFunn: JSON.parse(rad.kjente_funn || '[]'),
    kjenteFunnDetaljer: JSON.parse(rad.kjente_funn_detaljer || '[]'),
    parkeringNotat: rad.parkering_notat,
    avstandParkeringM: rad.avstand_parkering_m,
    stier: rad.stier,
    avstandStiM: rad.avstand_sti_m,
    custom: !!rad.custom,
    kilde: rad.kilde,
    hentetDato: rad.hentet_dato,
  };
}

// fylke/kommune er valgfrie server-side filtre (D1-migrasjon "filtrering"-
// oppfølgeren, se D1-MIGRASJON.md) — speiler EKSAKT samme to filtre som
// js/app.js sin fylkeFilter/kommuneFilter allerede styrer klient-side (ikke
// et nytt, tredje filter-konsept). Begge sendt samtidig = AND, men i
// praksis sender app.js kun det ene, aldri begge. Ingen av dem satt =
// uendret oppførsel (hele datasettet, som før filtrering ble lagt til).
export async function hentTerrengStederFraDb(env, { fylke, kommune } = {}) {
  const vilkar = [];
  const binds = [];
  if (fylke) { vilkar.push('fylke = ?'); binds.push(fylke); }
  if (kommune) { vilkar.push('kommune = ?'); binds.push(kommune); }
  const sql = 'SELECT * FROM terreng_steder' + (vilkar.length ? ` WHERE ${vilkar.join(' AND ')}` : '');
  const stmt = binds.length ? env.DB.prepare(sql).bind(...binds) : env.DB.prepare(sql);
  const { results } = await stmt.all();
  return results.map(radTilSted);
}

function radTilArtsfunn(rad) {
  return {
    id: rad.id,
    art: rad.art,
    lat: rad.lat,
    lon: rad.lon,
    dato: rad.dato,
    url: rad.url,
    trackDateTime: rad.track_date_time,
  };
}

// minLat/maxLat/minLon/maxLon er et valgfritt bbox-filter (D1-migrasjon
// "lastetid"-oppfølgeren) — brukes til å hente kun artsfunn innenfor (en
// paddet versjon av) kartets synlige utsnitt, i stedet for hele det
// nasjonale datasettet (~31 000 rader, ~1,46 MB gzippet) på hver
// sideåpning/panorering. Krever ALLE fire for å filtrere (ellers uendret
// oppførsel, hele datasettet) — speiler js/app.js sin loadArtsfunn(), som
// alltid sender alle fire sammen (fra leafletMap.getBounds().pad(0.5)).
// Normaliserer min/maks selv (Math.min/max) — defensivt mot en evt.
// ombyttet forespørsel, koster ingenting.
export async function hentArtsfunnFraDb(env, { minLat, maxLat, minLon, maxLon } = {}) {
  const harBbox = [minLat, maxLat, minLon, maxLon].every((v) => typeof v === 'number' && Number.isFinite(v));
  let sql = 'SELECT * FROM artsfunn';
  const binds = [];
  if (harBbox) {
    sql += ' WHERE lat BETWEEN ? AND ? AND lon BETWEEN ? AND ?';
    binds.push(Math.min(minLat, maxLat), Math.max(minLat, maxLat), Math.min(minLon, maxLon), Math.max(minLon, maxLon));
  }
  const stmt = binds.length ? env.DB.prepare(sql).bind(...binds) : env.DB.prepare(sql);
  const { results } = await stmt.all();
  return results.map(radTilArtsfunn);
}

function radTilDekning(rad) {
  return {
    mode: rad.mode,
    value: rad.value,
    lat: rad.lat,
    lon: rad.lon,
    radiusKm: rad.radius_km,
    gridKm: rad.grid_km,
    pointsChecked: rad.points_checked,
    pointsAdded: rad.points_added,
    fetchedAt: rad.fetched_at,
    osmInfraRefreshedAt: rad.osm_infra_refreshed_at,
  };
}

// Brukt av routes/omrader.js sin hentDekning() (admin "dekning"-panel) OG
// av fetch_area.py sin fetch_from_d1() (D1-migrasjon fase 4) — samme
// kontrakt som data/fetched-areas.json ga tidligere.
export async function hentFetchedAreasFraDb(env) {
  const { results } = await env.DB.prepare('SELECT * FROM fetched_areas').all();
  return results.map(radTilDekning);
}
