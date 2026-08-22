import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { applyMigrations } from '../helpers/loadSchema.js';
import { makeFakeD1 } from '../helpers/fakeD1.js';
import {
  opprettSesjon,
  requireSession,
  rullerSesjonHvisNodvendig,
  slettSesjon,
  sesjonCookieHeader,
  slettSesjonCookieHeader,
} from '../../src/lib/session.js';

const DAG_MS = 24 * 60 * 60 * 1000;

function requestMedCookie(token) {
  return { headers: new Headers(token != null ? { Cookie: `fungifinder_sesjon=${token}` } : {}) };
}

let env;
let brukerId;

beforeEach(() => {
  const db = new DatabaseSync(':memory:');
  applyMigrations(db);
  env = { DB: makeFakeD1(db) };
  const info = db
    .prepare("INSERT INTO brukere (epost, kortnavn, rolle, status) VALUES ('sopp@eksempel.no', 'Ola', 'bruker', 'aktiv')")
    .run();
  brukerId = Number(info.lastInsertRowid);
});

describe('opprettSesjon + requireSession', () => {
  test('en fersk sesjon godtas og gir riktig bruker', async () => {
    const token = await opprettSesjon(brukerId, env);
    const bruker = await requireSession(requestMedCookie(token), env);
    assert.ok(bruker);
    assert.equal(bruker.id, brukerId);
    assert.equal(bruker.epost, 'sopp@eksempel.no');
  });

  test('ingen cookie -> ikke innlogget (null), ikke feil', async () => {
    const bruker = await requireSession(requestMedCookie(null), env);
    assert.equal(bruker, null);
  });

  test('ukjent/feil token -> null', async () => {
    await opprettSesjon(brukerId, env);
    const bruker = await requireSession(requestMedCookie('helt-feil-token'), env);
    assert.equal(bruker, null);
  });

  test('utløpt sesjon avvises', async () => {
    const token = await opprettSesjon(brukerId, env);
    // Sett utløpstidspunktet til fortiden direkte i DB (uten å gå via
    // klokke-mocking) — enklest måte å simulere "gammel sesjon" på.
    env.DB._raw.prepare('UPDATE sesjoner SET utloper = ?').run(Date.now() - 1000);
    const bruker = await requireSession(requestMedCookie(token), env);
    assert.equal(bruker, null);
  });

  test('deaktivert bruker avvises selv med gyldig sesjon (umiddelbar tilbaketrekking)', async () => {
    const token = await opprettSesjon(brukerId, env);
    env.DB._raw.prepare("UPDATE brukere SET status = 'deaktivert' WHERE id = ?").run(brukerId);
    const bruker = await requireSession(requestMedCookie(token), env);
    assert.equal(bruker, null);
  });
});

describe('rullerSesjonHvisNodvendig', () => {
  test('ruller IKKE en fersk sesjon (ikke moden ennå)', async () => {
    const token = await opprettSesjon(brukerId, env);
    const resultat = await rullerSesjonHvisNodvendig(requestMedCookie(token), env);
    assert.equal(resultat, null);
  });

  test('ruller en sesjon eldre enn rulleringsintervallet, og glir utløpstidspunktet fremover', async () => {
    const token = await opprettSesjon(brukerId, env);
    const db = env.DB._raw;
    // Simuler at sesjonen ble rullert for over 24t siden (ROTASJON_INTERVALL_MS).
    const gammelRullertTid = Date.now() - 25 * 60 * 60 * 1000;
    db.prepare('UPDATE sesjoner SET rullert = ?').run(gammelRullertTid);

    const resultat = await rullerSesjonHvisNodvendig(requestMedCookie(token), env);
    assert.ok(resultat, 'forventet at en moden sesjon faktisk rulleres');
    assert.ok(resultat.token && resultat.token !== token, 'skal få et NYTT token');
    // RETTET 2026-08-16: utloper skal ha glidd fremover fra NÅ, ikke stå
    // fast fra det opprinnelige opprettSesjon()-tidspunktet.
    assert.ok(resultat.utloper > Date.now() + 29 * DAG_MS, 'utløpstidspunktet skal ha glidd fremover ved rullering');

    // Det nye tokenet skal fungere...
    const brukerEtter = await requireSession(requestMedCookie(resultat.token), env);
    assert.ok(brukerEtter);
    // ...og det GAMLE tokenet skal fortsatt godtas i overlappsvinduet.
    const brukerGammelt = await requireSession(requestMedCookie(token), env);
    assert.ok(brukerGammelt, 'gammelt token skal godtas innenfor rulleringsoverlappen');
  });

  test('ingen cookie -> ingenting å rullere', async () => {
    const resultat = await rullerSesjonHvisNodvendig(requestMedCookie(null), env);
    assert.equal(resultat, null);
  });
});

describe('slettSesjon', () => {
  test('sletter sesjonen slik at samme token ikke lenger godtas', async () => {
    const token = await opprettSesjon(brukerId, env);
    await slettSesjon(requestMedCookie(token), env);
    const bruker = await requireSession(requestMedCookie(token), env);
    assert.equal(bruker, null);
  });
});

describe('cookie-headere', () => {
  test('sesjonscookien er alltid HttpOnly, Secure, SameSite=Lax', () => {
    const header = sesjonCookieHeader('et-token', 3600);
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=Lax/);
    assert.match(header, /Max-Age=3600/);
  });

  test('sletting av cookien setter Max-Age=0, samme sikkerhetsflagg', () => {
    const header = slettSesjonCookieHeader();
    assert.match(header, /HttpOnly/);
    assert.match(header, /Secure/);
    assert.match(header, /SameSite=Lax/);
    assert.match(header, /Max-Age=0/);
  });
});
