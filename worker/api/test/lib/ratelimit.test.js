import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeFakeKv } from '../helpers/fakeKv.js';
import { sjekkOgTellEpost, sjekkOgTellIp } from '../../src/lib/ratelimit.js';

describe('sjekkOgTellEpost', () => {
  test('godtar første forsøk', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    assert.equal(await sjekkOgTellEpost('a@b.no', env), true);
  });

  test('avviser et 2. forsøk innen 60 sekunder av det forrige', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    await env.RATE_LIMIT.put('rl:epost:a@b.no', JSON.stringify({ antall: 1, sisteForsok: Date.now() - 5_000 }));
    assert.equal(await sjekkOgTellEpost('a@b.no', env), false);
  });

  test('godtar igjen etter 60 sekunder, avviser ved 4. forsøk i samme time (maks 3)', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    const naa = Date.now();
    await env.RATE_LIMIT.put('rl:epost:a@b.no', JSON.stringify({ antall: 3, sisteForsok: naa - 61_000 }));
    // 3 forsøk brukt allerede -> maks nådd, selv om 60-sek-vinduet er ute.
    assert.equal(await sjekkOgTellEpost('a@b.no', env), false);
  });

  test('lavercase-normaliserer e-postnøkkelen (samme konto uansett skriving)', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    await sjekkOgTellEpost('A@B.NO', env);
    assert.ok(env.RATE_LIMIT._store.has('rl:epost:a@b.no'));
  });

  test('uavhengige tellere for ulike e-poster', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    await env.RATE_LIMIT.put('rl:epost:full@b.no', JSON.stringify({ antall: 3, sisteForsok: Date.now() - 61_000 }));
    assert.equal(await sjekkOgTellEpost('full@b.no', env), false);
    assert.equal(await sjekkOgTellEpost('annen@b.no', env), true);
  });
});

describe('sjekkOgTellIp', () => {
  test('godtar opp til maks, avviser deretter', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    const maks = 3;
    for (let i = 0; i < maks; i++) {
      assert.equal(await sjekkOgTellIp('9.9.9.9', 'be-om-lenke', maks, env), true);
    }
    assert.equal(await sjekkOgTellIp('9.9.9.9', 'be-om-lenke', maks, env), false);
  });

  test('maks er uavhengig per formål — en full teller for ett formål blokkerer ikke et annet', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    await env.RATE_LIMIT.put('rl:ip:be-om-lenke:9.9.9.9', JSON.stringify({ antall: 8, sisteForsok: Date.now() }));
    assert.equal(await sjekkOgTellIp('9.9.9.9', 'be-om-lenke', 8, env), false);
    assert.equal(await sjekkOgTellIp('9.9.9.9', 'verifiser-kode', 8, env), true);
  });

  test('uavhengige tellere per IP', async () => {
    const env = { RATE_LIMIT: makeFakeKv() };
    await env.RATE_LIMIT.put('rl:ip:be-om-lenke:1.1.1.1', JSON.stringify({ antall: 8, sisteForsok: Date.now() }));
    assert.equal(await sjekkOgTellIp('1.1.1.1', 'be-om-lenke', 8, env), false);
    assert.equal(await sjekkOgTellIp('2.2.2.2', 'be-om-lenke', 8, env), true);
  });
});
