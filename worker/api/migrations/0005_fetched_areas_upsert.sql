-- QA-funn før nasjonalt sveip (2026-08-20, se fungifinder/docs/veien-videre.md):
-- fetched_areas ble hittil skrevet med mode=replace_all (DELETE ALT + INSERT
-- ALT på nytt), fra en snapshot lest ved HVER kjørings oppstart (se
-- fetch_area.py main()/refresh_existing_locations()). Med flere samtidige
-- ETL-kjøringer (planlagt nasjonalt sveip, 15 parallelle --mode fylke-jobber)
-- overskriver siste jobb som fullfører STILLE alle andre jobbers rader — samme
-- klasse "les hele tabellen, endre én rad, skriv hele tabellen tilbake"-race
-- D1-migrasjonen (se D1-MIGRASJON.md) eksplisitt skulle fjerne til fordel for
-- ekte SQL-UPSERT, bare uten gitts høylytte push-avvisning ved kollisjon.
--
-- Fiks: ekte upsert på en deterministisk områdenøkkel — samme
-- (mode,value,lat,lon,radiusKm)-felter refresh-areas.yml og
-- _find_fetched_area_entry() i fetch_area.py allerede bruker til å
-- identifisere "samme område" (se disse for uendret nøkkeldefinisjon).
--
-- omrade_nokkel beregnes i Python (fetch_area.py sin nye _omrade_nokkel()),
-- IKKE i SQL: en SQL UNIQUE-indeks direkte over (mode,value,lat,lon,
-- radius_km) ville ALDRI trigget ON CONFLICT for fylke/kommune-rader
-- (lat/lon/radius_km alltid NULL der) eller radius-rader (value alltid NULL
-- der) — SQLite behandler NULL <> NULL i UNIQUE-indekser, så to rader med
-- samme NULL-kolonner regnes IKKE som duplikater av en vanlig UNIQUE-indeks.

ALTER TABLE fetched_areas ADD COLUMN omrade_nokkel TEXT;

-- Bakoverfyll eksisterende rader med samme nøkkelformat som
-- fetch_area.py sin _omrade_nokkel() bruker for nye rader.
UPDATE fetched_areas
SET omrade_nokkel = mode || '|' || COALESCE(value, '') || '|' || COALESCE(lat, '') || '|' || COALESCE(lon, '') || '|' || COALESCE(radius_km, '');

-- Eksisterende data har INGEN dedup-garanti (replace_all appenderte
-- historisk blindt, uten å sjekke om området fantes fra før) — behold kun
-- nyeste rad (høyest fetched_at) per nøkkel før indeksen gjøres UNIQUE,
-- ellers feiler CREATE UNIQUE INDEX under på ekte duplikater. Liten,
-- ren bokføringstabell (titalls rader) — vilkårlig valg ved eksakt like
-- fetched_at-tidsstempler er akseptabelt her.
DELETE FROM fetched_areas
WHERE rowid NOT IN (
  SELECT rowid FROM fetched_areas fa
  WHERE fa.fetched_at = (
    SELECT MAX(fa2.fetched_at) FROM fetched_areas fa2 WHERE fa2.omrade_nokkel = fa.omrade_nokkel
  )
  GROUP BY fa.omrade_nokkel
);

CREATE UNIQUE INDEX idx_fetched_areas_omrade_nokkel ON fetched_areas(omrade_nokkel);
