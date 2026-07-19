// Auth bruker en cookie (fetch() med credentials:'include' fra frontend) —
// en wildcard-origin er ikke lov sammen med credentials, så ALLOWED_ORIGIN
// må alltid være ett eksakt opphav.
//
// Ulikt Bondøya (som kjører frontend+API på samme registrerbare domene,
// bondoya.no/api.bondoya.no): FungiFinder sin frontend (GitHub Pages) og
// dette API-et (workers.dev) er to ULIKE registrerbare domener — ekte
// cross-site, ikke bare cross-origin-innenfor-samme-site. Sesjonscookien
// settes derfor med SameSite=None (se session.js) i stedet for Lax, og som
// motvekt krever alle muterende ruter at Origin-headeren nøyaktig matcher
// ALLOWED_ORIGIN (se sjekkOpprinnelse under) — samme forsvar en streng
// SameSite=Lax-policy ellers ville gitt gratis.
export function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// CSRF-motforanstaltning for SameSite=None-cookien — kalles fra alle
// muterende (POST/PATCH/DELETE) ruter. Bevisst en enkel eksakt-match, ikke
// en "starter med"-sjekk (unngår at f.eks. https://runelov.github.io.evil.no
// slipper gjennom).
export function sjekkOpprinnelse(request, env) {
  const origin = request.headers.get('Origin');
  return origin === env.ALLOWED_ORIGIN;
}
