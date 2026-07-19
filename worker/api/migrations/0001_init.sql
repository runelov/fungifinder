-- Autentisering + brukerdata for FungiFinder. Speiler Bondøyas
-- worker/api/migrations (se konsept.md der for full sikkerhetsbegrunnelse
-- bak valgene: sesjonsbasert ikke JWT, kun hash lagres, ingen
-- signeringsnøkkel) — bygget som ETT nytt skjema i stedet for å gjenskape
-- Bondøyas inkrementelle migrasjonshistorikk, siden vi allerede kjenner
-- sluttformen (inkl. epost-binding på invitasjoner og sesjonsrotasjon fra
-- dag én).

CREATE TABLE brukere (
  id INTEGER PRIMARY KEY,
  epost TEXT NOT NULL UNIQUE,
  kortnavn TEXT NOT NULL,
  rolle TEXT NOT NULL DEFAULT 'bruker' CHECK (rolle IN ('bruker','admin')),
  status TEXT NOT NULL DEFAULT 'aktiv' CHECK (status IN ('aktiv','deaktivert')),
  slettet_tidspunkt TEXT,
  aktivert_tidspunkt TEXT,
  opprettet TEXT NOT NULL DEFAULT (datetime('now'))
);

-- utloper: unix-epoch MILLISEKUNDER (INTEGER), satt fra Worker (Date.now()).
-- Bevisst ikke SQL datetime()/TEXT — se Bondøyas migrations/0001 for
-- begrunnelsen (tegnsammenligning av ISO-streng vs. datetime()-streng gir
-- feil resultat).
CREATE TABLE innloggingstokens (
  hash TEXT PRIMARY KEY,
  bruker_id INTEGER NOT NULL REFERENCES brukere(id) ON DELETE CASCADE,
  utloper INTEGER NOT NULL,
  brukt INTEGER NOT NULL DEFAULT 0,
  opprettet TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_innloggingstokens_bruker ON innloggingstokens(bruker_id);

-- rullert/forrige_hash/forrige_utloper: periodisk sesjonstoken-rotasjon, se
-- src/lib/session.js.
CREATE TABLE sesjoner (
  hash TEXT PRIMARY KEY,
  bruker_id INTEGER NOT NULL REFERENCES brukere(id) ON DELETE CASCADE,
  utloper INTEGER NOT NULL,
  rullert INTEGER NOT NULL,
  forrige_hash TEXT,
  forrige_utloper INTEGER,
  opprettet TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sesjoner_bruker ON sesjoner(bruker_id);

-- epost NOT NULL fra dag én: en invitasjon som ikke er bundet til én
-- bestemt e-post ville la hvem som helst med lenken registrere seg med en
-- vilkårlig andres adresse — se src/lib/invitasjoner.js.
CREATE TABLE invitasjoner (
  id INTEGER PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  epost TEXT NOT NULL,
  opprettet_av_bruker_id INTEGER NOT NULL REFERENCES brukere(id),
  brukt INTEGER NOT NULL DEFAULT 0,
  brukt_av_bruker_id INTEGER REFERENCES brukere(id),
  utloper INTEGER NOT NULL,
  opprettet TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_invitasjoner_opprettet_av ON invitasjoner(opprettet_av_bruker_id);

-- Én JSON-blob per bruker (finds/cuts/hogstOmrader/customLocations/
-- favoriteSpecies) — samme skjema som dagens data/personal.json i
-- fungifinder-db, bare skilt per bruker_id i stedet for én delt fil. Se
-- src/routes/data.js.
CREATE TABLE bruker_data (
  bruker_id INTEGER PRIMARY KEY REFERENCES brukere(id) ON DELETE CASCADE,
  data TEXT NOT NULL DEFAULT '{}',
  oppdatert TEXT NOT NULL DEFAULT (datetime('now'))
);
