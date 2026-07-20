-- Kort, manuelt inntastbar kode som alternativ til magic-link-token, for
-- innlogging inne i en PWA lagt til på hjemskjermen (se routes/auth.js sin
-- verifiserKode) — slik en standalone home-screen-app på iOS har egen,
-- isolert cookie-lagring atskilt fra Safari, og ingen adressefelt til å
-- lime inn lenken fra e-posten i.
ALTER TABLE innloggingstokens ADD COLUMN kode_hash TEXT;
ALTER TABLE innloggingstokens ADD COLUMN kode_forsok INTEGER NOT NULL DEFAULT 0;
