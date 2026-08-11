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

export async function hentTerrengStederFraDb(env) {
  const { results } = await env.DB.prepare('SELECT * FROM terreng_steder').all();
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

export async function hentArtsfunnFraDb(env) {
  const { results } = await env.DB.prepare('SELECT * FROM artsfunn').all();
  return results.map(radTilArtsfunn);
}
