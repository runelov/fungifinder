import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyMigrations } from '../helpers/loadSchema.js';
import { makeFakeD1 } from '../helpers/fakeD1.js';
import { hentTerrengStederFraDb, hentArtsfunnFraDb, hentFetchedAreasFraDb } from '../../src/lib/terrengDb.js';

let env;
let db;

beforeEach(() => {
  db = new DatabaseSync(':memory:');
  applyMigrations(db);
  env = { DB: makeFakeD1(db) };
});

function settInnSted(overrides = {}) {
  const sted = {
    id: 'auto_1_1',
    navn: 'Testskogen',
    fylke: 'Østfold',
    kommune: 'Hobøl',
    lat: 59.5,
    lon: 10.9,
    treslag: '["gran","bjork"]',
    skogalder: 'gammel',
    fuktighet: 'fuktig',
    fuktighet_index: 3,
    berggrunn: 'kalkrik',
    helning_grader: 5,
    himmelretning: 'S',
    hoyde_moh: 120,
    avstand_vei_m: 300,
    kjorbar_vei: 'ja',
    befolkning: 'lav',
    hogst_ar: null,
    hogstaar_sjekket_dato: null,
    kjente_funn: '["kantarell"]',
    kjente_funn_detaljer: '[]',
    parkering_notat: null,
    avstand_parkering_m: 250,
    stier: 'ja',
    avstand_sti_m: 100,
    custom: 0,
    kilde: 'auto-etl',
    hentet_dato: '2026-08-01',
    parkering_lat: 59.501,
    parkering_lon: 10.899,
    parkering_osm_type: 'node',
    parkering_osm_id: 123456,
    ...overrides,
  };
  const kolonner = Object.keys(sted);
  const plassholdere = kolonner.map(() => '?').join(',');
  db.prepare(`INSERT INTO terreng_steder (${kolonner.join(',')}) VALUES (${plassholdere})`).run(
    ...kolonner.map((k) => sted[k])
  );
  return sted;
}

describe('hentTerrengStederFraDb', () => {
  test('camelCase-kontrakten inneholder EKSAKT feltene js/app.js forventer, inkl. parkeringsfeltene (migrasjon 0004)', async () => {
    settInnSted();
    const [sted] = await hentTerrengStederFraDb(env, {});
    assert.deepEqual(sted, {
      id: 'auto_1_1',
      name: 'Testskogen',
      fylke: 'Østfold',
      kommune: 'Hobøl',
      lat: 59.5,
      lon: 10.9,
      treslag: ['gran', 'bjork'],
      skogalder: 'gammel',
      fuktighet: 'fuktig',
      fuktighetIndex: 3,
      berggrunn: 'kalkrik',
      helningGrader: 5,
      himmelretning: 'S',
      hoydeMoh: 120,
      avstandVeiM: 300,
      kjorbarVei: 'ja',
      befolkning: 'lav',
      hogstAr: null,
      hogstaarSjekketDato: null,
      kjenteFunn: ['kantarell'],
      kjenteFunnDetaljer: [],
      parkeringNotat: null,
      avstandParkeringM: 250,
      stier: 'ja',
      avstandStiM: 100,
      custom: false,
      kilde: 'auto-etl',
      hentetDato: '2026-08-01',
      parkeringLat: 59.501,
      parkeringLon: 10.899,
      parkeringOsmType: 'node',
      parkeringOsmId: 123456,
    });
  });

  test('filtrerer på fylke', async () => {
    settInnSted({ id: 'a', fylke: 'Østfold' });
    settInnSted({ id: 'b', fylke: 'Vestland' });
    const resultat = await hentTerrengStederFraDb(env, { fylke: 'Vestland' });
    assert.deepEqual(resultat.map((s) => s.id), ['b']);
  });

  test('filtrerer på kommune', async () => {
    settInnSted({ id: 'a', kommune: 'Hobøl' });
    settInnSted({ id: 'b', kommune: 'Bergen' });
    const resultat = await hentTerrengStederFraDb(env, { kommune: 'Bergen' });
    assert.deepEqual(resultat.map((s) => s.id), ['b']);
  });

  test('bbox-filteret normaliserer min/maks selv om de sendes ombyttet', async () => {
    settInnSted({ id: 'innenfor', lat: 59.5, lon: 10.9 });
    settInnSted({ id: 'utenfor', lat: 65.0, lon: 15.0 });
    // maxLat/maxLon sendes bevisst LAVERE enn minLat/minLon her.
    const resultat = await hentTerrengStederFraDb(env, { minLat: 60, maxLat: 59, minLon: 11, maxLon: 10.8 });
    assert.deepEqual(resultat.map((s) => s.id), ['innenfor']);
  });

  test('krever ALLE fire bbox-verdier for å filtrere — delvis oppgitt = ufiltrert', async () => {
    settInnSted({ id: 'a' });
    settInnSted({ id: 'b', lat: 65, lon: 15 });
    const resultat = await hentTerrengStederFraDb(env, { minLat: 59, maxLat: 60 });
    assert.equal(resultat.length, 2);
  });

  test('ingen filtre -> hele datasettet', async () => {
    settInnSted({ id: 'a' });
    settInnSted({ id: 'b', fylke: 'Vestland' });
    const resultat = await hentTerrengStederFraDb(env, {});
    assert.equal(resultat.length, 2);
  });
});

describe('hentArtsfunnFraDb', () => {
  test('camelCase-kontrakt for artsfunn', async () => {
    db.prepare(
      'INSERT INTO artsfunn (id, art, lat, lon, dato, url, track_date_time) VALUES (?,?,?,?,?,?,?)'
    ).run('obs1', 'kantarell', 59.5, 10.9, '2026-08-01', 'https://artskart.no/obs1', null);
    const [funn] = await hentArtsfunnFraDb(env, {});
    assert.deepEqual(funn, {
      id: 'obs1',
      art: 'kantarell',
      lat: 59.5,
      lon: 10.9,
      dato: '2026-08-01',
      url: 'https://artskart.no/obs1',
      trackDateTime: null,
    });
  });

  test('bbox-filter fungerer, normalisert', async () => {
    db.prepare('INSERT INTO artsfunn (id, art, lat, lon) VALUES (?,?,?,?)').run('innenfor', 'kantarell', 59.5, 10.9);
    db.prepare('INSERT INTO artsfunn (id, art, lat, lon) VALUES (?,?,?,?)').run('utenfor', 'kantarell', 65, 15);
    const resultat = await hentArtsfunnFraDb(env, { minLat: 60, maxLat: 59, minLon: 11, maxLon: 10.8 });
    assert.deepEqual(resultat.map((f) => f.id), ['innenfor']);
  });
});

describe('hentFetchedAreasFraDb', () => {
  test('camelCase-kontrakt for dekningsrader', async () => {
    db.prepare(
      `INSERT INTO fetched_areas (mode, value, lat, lon, radius_km, grid_km, points_checked, points_added, fetched_at, osm_infra_refreshed_at, omrade_nokkel)
       VALUES ('kommune','Hobøl',null,null,null,1.5,42,10,'2026-08-01T00:00:00Z',null,'kommune|Hobøl|||1.5')`
    ).run();
    const [rad] = await hentFetchedAreasFraDb(env);
    assert.deepEqual(rad, {
      mode: 'kommune',
      value: 'Hobøl',
      lat: null,
      lon: null,
      radiusKm: null,
      gridKm: 1.5,
      pointsChecked: 42,
      pointsAdded: 10,
      fetchedAt: '2026-08-01T00:00:00Z',
      osmInfraRefreshedAt: null,
    });
  });
});
