# FungiFinder — API

Cloudflare Worker (D1 + Workers KV) som erstatter det delte GitHub-PAT-i-
nettleseren-opplegget (`js/github-store.js`) med ekte innlogging (magic-link
+ sesjoner), roller (`admin`/`bruker`) og admin-styrte invitasjoner — samme
mønster som `mittbondøya-workspace/bondoya/worker/api`, tilpasset
FungiFinders enklere datamodell (se `../../worker/api` sin plan-fil for
begrunnelsen, kort oppsummert i denne filens bunn).

## Oppsett (gjøres av deg — krever din Cloudflare-konto)

```bash
cd worker/api
npm install
npx wrangler login
npx wrangler d1 create fungifinder        # lim database_id inn i wrangler.toml
npx wrangler kv namespace create RATE_LIMIT  # lim id inn i wrangler.toml
npx wrangler d1 migrations apply fungifinder --remote
npx wrangler secret put GITHUB_PAT
npx wrangler secret put TURNSTILE_SECRET_KEY   # ekte Turnstile-hemmelighet, ikke testnøkkelen i .dev.vars
npx wrangler deploy
```

`GITHUB_PAT` må være et fine-grained personal access token scopet KUN til
`runelov/fungifinder-db`, med **Contents: Read and write** og
**Actions: Read and write** — samme rettigheter tokenet i nettleseren har i
dag. Etter at dette er satt opp og verifisert kan det gamle
nettleser-tokenet slettes/roteres i GitHub-innstillingene; ingen bruker
trenger lenger å eie eller lime inn noe GitHub-token selv.

Ingen `routes`/custom domain i `wrangler.toml` ennå — API-et nås kun via sin
`workers.dev`-URL. Denne URL-en må limes inn i `js/api-client.js`
(`API_BASE`) etter første `wrangler deploy`.

## Lokal utvikling og test

```bash
npx wrangler d1 migrations apply fungifinder --local
npx wrangler dev
```

`.dev.vars` (gitignored, opprett selv) setter `TURNSTILE_SECRET_KEY` til
Turnstiles offisielle alltid-bestå testnøkkel, `ENVIRONMENT=development`, OG
`ALLOWED_ORIGIN=http://localhost:8743` (overstyrer `wrangler.toml` sin
produksjonsverdi lokalt):

```
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
ENVIRONMENT=development
ALLOWED_ORIGIN=http://localhost:8743
APP_URL=http://localhost:8743/
```

Uten `ALLOWED_ORIGIN`-overstyringen returnerer alle muterende ruter 403 mot
en lokalt kjørende frontend — CSRF-sjekken (`sjekkOpprinnelse()` i
`lib/cors.js`) krever eksakt match mot `Origin`-headeren, se "Hvorfor
SameSite=None"-avsnittet nederst i denne filen.

`APP_URL` er et EGET felt, bevisst forskjellig fra `ALLOWED_ORIGIN`: sistnevnte
er en bar opprinnelse (uten sti, riktig for CORS/CSRF), mens `APP_URL` er
selve appens fulle URL — i produksjon `https://runelov.github.io/fungifinder/`
(en GitHub Pages PROSJEKT-side, ikke kontoroten), lokalt bare
`http://localhost:8743/`. `routes/auth.js` sin `verifiser()` redirecter hit
etter en vellykket magic-link-verifisering. Blander man disse to sammen
(brukt til å være samme variabel) ender innlogging på en 404, siden
kontoroten `https://runelov.github.io/` ikke er der appen faktisk ligger.
I utviklingsmodus (eller når `RESEND_API_KEY` mangler) logger
`src/lib/epost.js` hele magic-link-URL-en til `wrangler dev`-konsollen i
stedet for å faktisk sende e-post:

```bash
curl -i -X POST http://localhost:8787/auth/be-om-lenke \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:8743' \
  -d '{"epost":"din@epost.no","turnstileToken":"XXXX.DUMMY.TOKEN.XXXX"}'
# kopier magic-link-URL-en fra wrangler dev-konsollen
curl -i "http://localhost:8787/auth/verifiser?token=<rå-token-fra-url>"
# kopier Set-Cookie-verdien fra responsen
curl -i http://localhost:8787/meg -H "Cookie: fungifinder_sesjon=<verdi>"
```

Brukere må finnes i `brukere`-tabellen fra før for å kunne be om en
innloggingslenke — ingen selvregistrering uten en gyldig invitasjonslenke.
Legg til deg selv (første admin) lokalt:

```bash
npx wrangler d1 execute fungifinder --local --command \
  "INSERT INTO brukere (epost, kortnavn, rolle, status, aktivert_tidspunkt) VALUES ('din@epost.no', 'Du', 'admin', 'aktiv', datetime('now'))"
```

Samme kommando med `--remote` i stedet for `--local` for produksjon, se
hovedoppsettet over.

**Ikke** committ ekte e-postadresser/navn noe sted i dette (offentlige)
repoet.

## Engangsmigrering av eksisterende data

Dine eksisterende funn/steder/hogstmerker ligger i
`fungifinder-db/data/personal.json`. Etter at du er satt opp som admin og
har logget inn via appen, kjør (mens sesjonscookien er gyldig i nettleseren
— enklest å gjøre kallet fra DevTools-konsollen på selve siden, slik at
cookien sendes med automatisk):

```js
const data = /* innholdet i fungifinder-db/data/personal.json */;
await fetch('<API_BASE>/meg/data', {
  method: 'PUT', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

`data/personal.json` i `fungifinder-db` beholdes uendret som historisk
arkiv, men brukes ikke lenger av verken appen eller denne workeren etter
dette.

## Hvorfor én JSON-blob per bruker, ikke normaliserte tabeller?

Bondøya normaliserte funn i egen D1-tabell fordi de trenger offentlig
synlighet, bildeopplasting (R2) og admin-moderering av arter. FungiFinder
sine funn/steder/hogstmerker er rent private data uten noen offentlig
visning, så én blob per bruker (tabellen `bruker_data`) holder — og
minimerer omskriving i `js/app.js`, som allerede kjenner akkurat dette
skjemaet fra `data/personal.json`.

## Hvorfor SameSite=None i stedet for Lax?

Bondøya kjører frontend og API på samme registrerbare domene
(`bondoya.no`/`api.bondoya.no`). FungiFinders frontend er GitHub Pages
(`runelov.github.io`) og dette API-et er `*.workers.dev` — to ULIKE
registrerbare domener, altså ekte cross-site. En `SameSite=Lax`-cookie ville
ikke blitt sendt med på `fetch()`-kall dit. Løsningen (`SameSite=None`, se
`src/lib/session.js`) krever som motvekt at alle muterende ruter
(POST/PUT/PATCH/DELETE) verifiserer `Origin`-headeren mot `ALLOWED_ORIGIN`
(`src/lib/cors.js` sin `sjekkOpprinnelse()`) — dette forsvinner av seg selv
den dagen frontend og API ev. flyttes til et felles domene.
