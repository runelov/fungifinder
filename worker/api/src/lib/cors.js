// Auth bruker en cookie (fetch() med credentials:'include' fra frontend) —
// en wildcard-origin er ikke lov sammen med credentials, så ALLOWED_ORIGIN
// må alltid være ett eksakt opphav.
//
// Speiler Bondøya: frontend (fungifinder.no) og dette API-et
// (api.fungifinder.no) er på samme registrerbare domene, så
// sesjonscookien kan bruke SameSite=Lax (se session.js) — det gir CSRF-
// beskyttelse gratis (en cross-site-forespørsel sender ikke med cookien i
// det hele tatt), uten behov for en egen Origin-header-sjekk på
// muterende ruter slik det tidligere cross-site github.io/workers.dev-
// oppsettet krevde.
export function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
