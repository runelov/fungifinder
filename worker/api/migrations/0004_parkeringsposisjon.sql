-- Parkeringsplassens egen posisjon/OSM-ID (fetch_area.py v36, 2026-08-15) --
-- disse kolonnene manglet i D1-skjemaet helt siden den funksjonen ble
-- lagt til i ETL-en. Konsekvens oppdaget 2026-08-18: fetch_area.py sendte
-- parkeringLat/parkeringLon/parkeringOsmType/parkeringOsmId i hver
-- terreng_steder-upsert i flere dager, men etlImport.js sin stedTilRad()
-- og STED_UPSERT-spørringen kjente ikke til feltene -- de ble stille
-- droppet ved skriving, ingen feil kastet. Turforslagets
-- 🅿️-markør (js/app.js, krever avstandParkeringM OG parkeringLat OG
-- parkeringLon) fikk derfor aldri noe å vise, uansett hvor mange ganger
-- ETL-en kjørte.
ALTER TABLE terreng_steder ADD COLUMN parkering_lat REAL;
ALTER TABLE terreng_steder ADD COLUMN parkering_lon REAL;
ALTER TABLE terreng_steder ADD COLUMN parkering_osm_type TEXT;
ALTER TABLE terreng_steder ADD COLUMN parkering_osm_id INTEGER;
