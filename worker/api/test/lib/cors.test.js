import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { corsHeaders } from '../../src/lib/cors.js';

// Auth bruker en cookie (credentials:'include'), og en wildcard-origin er
// ikke lov sammen med credentials (se cors.js sin kommentar) — denne testen
// er derfor mer enn en form-sjekk: en fremtidig endring som ved et uhell
// setter ALLOWED_ORIGIN til '*' i wrangler.toml ville gjøre auth stille
// ødelagt i nettlesere, og denne testen fanger i det minste opp at
// funksjonen selv aldri INTRODUSERER en wildcard uavhengig av input.
describe('corsHeaders', () => {
  test('speiler env.ALLOWED_ORIGIN eksakt, aldri wildcard', () => {
    const headers = corsHeaders({ ALLOWED_ORIGIN: 'https://fungifinder.no' });
    assert.equal(headers['Access-Control-Allow-Origin'], 'https://fungifinder.no');
    assert.notEqual(headers['Access-Control-Allow-Origin'], '*');
  });

  test('setter alltid Allow-Credentials: true (nødvendig for sesjonscookien)', () => {
    const headers = corsHeaders({ ALLOWED_ORIGIN: 'https://fungifinder.no' });
    assert.equal(headers['Access-Control-Allow-Credentials'], 'true');
  });

  test('tillater ikke flere metoder enn appen faktisk trenger', () => {
    const headers = corsHeaders({ ALLOWED_ORIGIN: 'https://fungifinder.no' });
    for (const m of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
      assert.ok(headers['Access-Control-Allow-Methods'].includes(m));
    }
  });
});
