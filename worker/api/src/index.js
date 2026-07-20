import { createRouter } from './router.js';
import { corsHeaders } from './lib/cors.js';
import { json } from './lib/json.js';
import { rullerSesjonHvisNodvendig, sesjonCookieHeader } from './lib/session.js';
import { beOmLenke, verifiser, verifiserKode, loggUt } from './routes/auth.js';
import { meg } from './routes/meg.js';
import { hentMineData, lagreMineData } from './routes/data.js';
import { hentTerrengdata, hentArtsfunn, hentBerikelse } from './routes/terreng.js';
import { hentDekning, startOmradeHenting, omradeStatus, berikPunkt, punktStatus } from './routes/omrader.js';
import {
  listBrukere, oppdaterBrukerStatus, slettBrukerPermanent,
  listInvitasjoner, opprettInvitasjon, slettInvitasjon,
} from './routes/admin.js';
import { sjekkInvitasjon, registrerMedInvitasjon } from './routes/invitasjoner.js';

const router = createRouter();
router.post('/auth/be-om-lenke', beOmLenke);
router.get('/auth/verifiser', verifiser);
router.post('/auth/verifiser-kode', verifiserKode);
router.post('/auth/logg-ut', loggUt);
router.get('/meg', meg);
router.get('/meg/data', hentMineData);
router.put('/meg/data', lagreMineData);
router.get('/terrengdata', hentTerrengdata);
router.get('/terrengdata/artsfunn', hentArtsfunn);
router.get('/terrengdata/berikelse/:locationId', hentBerikelse);
router.get('/omrader/dekning', hentDekning);
router.post('/omrader/hent', startOmradeHenting);
router.get('/omrader/status', omradeStatus);
router.post('/punkt/:id/berik', berikPunkt);
router.get('/punkt/status', punktStatus);
router.get('/admin/brukere', listBrukere);
router.patch('/admin/brukere/:id', oppdaterBrukerStatus);
router.delete('/admin/brukere/:id', slettBrukerPermanent);
router.get('/admin/invitasjoner', listInvitasjoner);
router.post('/admin/invitasjoner', opprettInvitasjon);
router.delete('/admin/invitasjoner/:id', slettInvitasjon);
router.get('/invitasjon/:token', sjekkInvitasjon);
router.post('/invitasjon/:token', registrerMedInvitasjon);

export default {
  async fetch(request, env, ctx) {
    const cors = corsHeaders(env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    // Fang alt herfra, gi JSON tilbake i stedet for Cloudflares generiske
    // feilside.
    let res;
    try {
      res = await router.handle(request, env, ctx);
      if (!res) res = json({ error: 'Ikke funnet.' }, 404, cors);
    } catch (e) {
      console.error(e);
      res = json({ error: 'Uventet feil.' }, 500, cors);
    }
    return leggTilRullertSesjonCookie(request, env, res);
  },
};

// Periodisk sesjonstoken-rotasjon (se lib/session.js sin
// rullerSesjonHvisNodvendig) — sentralt her i stedet for i hver enkelt
// rutefil. Kjøres etter at requestens EGEN autentisering (inne i
// router.handle) allerede har brukt det gamle tokenet ferdig, så denne
// forespørselen påvirkes aldri av rulleringen — kun neste.
async function leggTilRullertSesjonCookie(request, env, response) {
  const rullert = await rullerSesjonHvisNodvendig(request, env);
  if (!rullert) return response;

  const maxAgeSekunder = (rullert.utloper - Date.now()) / 1000;
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', sesjonCookieHeader(rullert.token, maxAgeSekunder));
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
