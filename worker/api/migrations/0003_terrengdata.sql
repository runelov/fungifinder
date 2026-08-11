-- D1-migrasjon av terrengdata (fase 0) — se fungifinder-db/D1-MIGRASJON.md
-- for full begrunnelse/faseplan. Speiler feltene i dagens
-- data/locations.json, data/artsfunn.json og data/fetched-areas.json
-- (fungifinder-db) NØYAKTIG — kolonnenavn er snake_case-oversettelser av
-- de camelCase JSON-feltene appen allerede kjenner (se src/lib/terrengDb.js
-- for reversering til samme kontrakt).
--
-- Avvik fra skjema-forslaget i D1-MIGRASJON.md: `enrich_status`-kolonnen på
-- terreng_steder er droppet — ingenting i fetch_area.py eller appen
-- populerer den i dag (kilde er alltid 'auto-etl'), så en uskrevet kolonne
-- ville bare vært forvirrende dødvekt.

CREATE TABLE terreng_steder (
  id TEXT PRIMARY KEY,               -- 'auto_599441_109698' e.l., uendret fra dagens locations.json
  navn TEXT NOT NULL,
  fylke TEXT, kommune TEXT,
  lat REAL NOT NULL, lon REAL NOT NULL,
  treslag TEXT NOT NULL,             -- JSON-array som tekst, f.eks. '["gran","bjork"]'
  skogalder TEXT, fuktighet TEXT, fuktighet_index INTEGER,
  berggrunn TEXT, helning_grader REAL, himmelretning TEXT, hoyde_moh REAL,
  avstand_vei_m INTEGER, kjorbar_vei TEXT,
  befolkning TEXT CHECK (befolkning IN ('lav','middels','hoy','ukjent')),
  hogst_ar INTEGER, hogstaar_sjekket_dato TEXT,
  kjente_funn TEXT,                  -- JSON-array (art-id-er) som tekst
  kjente_funn_detaljer TEXT,         -- JSON-array ({art,dato,avstandM}) som tekst
  parkering_notat TEXT, avstand_parkering_m INTEGER,
  stier TEXT CHECK (stier IN ('ja','nei','ukjent')), avstand_sti_m INTEGER,
  custom INTEGER NOT NULL DEFAULT 0,
  kilde TEXT NOT NULL,
  hentet_dato TEXT NOT NULL,
  oppdatert TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_terreng_steder_fylke ON terreng_steder(fylke);
CREATE INDEX idx_terreng_steder_kommune ON terreng_steder(kommune);
CREATE INDEX idx_terreng_steder_latlon ON terreng_steder(lat, lon);

-- Ekte Artsdatabanken-observasjoner, akkumulert av fetch_area.py sin
-- sync_artskart_for_fylke()/merge_artsfunn_file() — id er Artskart sin egen,
-- stabile observasjons-id (aldri generert av oss), derfor trygt som PK.
CREATE TABLE artsfunn (
  id TEXT PRIMARY KEY,
  art TEXT NOT NULL,
  lat REAL NOT NULL, lon REAL NOT NULL,
  dato TEXT, url TEXT, track_date_time TEXT
);
CREATE INDEX idx_artsfunn_art ON artsfunn(art);
CREATE INDEX idx_artsfunn_latlon ON artsfunn(lat, lon);

-- Liten tabell (titalls rader) — dual-write bruker "slett alt, sett inn alt
-- på nytt" (mode=replace_all i importer-endepunktet) fremfor upsert, siden
-- fetched-areas.json ikke har noen stabil natural key i JSON-representasjonen
-- og av og til oppdateres i plass (se refresh_existing_locations() i
-- fetch_area.py). Billig siden datasettet er lite.
CREATE TABLE fetched_areas (
  id INTEGER PRIMARY KEY,
  mode TEXT NOT NULL, value TEXT, lat REAL, lon REAL,
  radius_km REAL, grid_km REAL,
  points_checked INTEGER, points_added INTEGER,
  fetched_at TEXT NOT NULL, osm_infra_refreshed_at TEXT
);

-- Ikke i bruk ennå (fase 1 dekker kun de tre tabellene over — se
-- D1-MIGRASJON.md). Opprettet nå for skjema-parallellitet med planen;
-- data/enrichments.json migreres i en senere, egen omgang.
CREATE TABLE enrichments (
  location_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  oppdatert TEXT NOT NULL DEFAULT (datetime('now'))
);
