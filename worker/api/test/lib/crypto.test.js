import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { randomToken, sha256Hex, randomDigitCode, timingSafeEqual } from '../../src/lib/crypto.js';

describe('randomToken', () => {
  test('gir en URL-trygg base64-streng uten padding', () => {
    const t = randomToken();
    assert.match(t, /^[A-Za-z0-9_-]+$/);
    assert.ok(!t.includes('='));
  });

  test('gir ulik verdi hver gang (høy entropi, ikke deterministisk)', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => randomToken()));
    assert.equal(tokens.size, 50);
  });
});

describe('sha256Hex', () => {
  test('matcher kjent testvektor for tom streng', async () => {
    const hash = await sha256Hex('');
    assert.equal(hash, 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  test('matcher kjent testvektor for "fungifinder"', async () => {
    // Forhåndsberegnet med Node sin egen crypto.createHash('sha256').
    const hash = await sha256Hex('fungifinder');
    assert.equal(hash, '778955ea2a3558475522719f2787d373958584f4b8e6dc320d0945a331dbc7a5');
  });

  test('er deterministisk (samme input -> samme hash)', async () => {
    const a = await sha256Hex('samme-input');
    const b = await sha256Hex('samme-input');
    assert.equal(a, b);
  });
});

describe('randomDigitCode', () => {
  test('gir alltid nøyaktig `lengde` sifre, ledende nuller bevart', () => {
    for (let i = 0; i < 200; i++) {
      const kode = randomDigitCode(6);
      assert.equal(kode.length, 6);
      assert.match(kode, /^[0-9]{6}$/);
    }
  });

  test('verdien er alltid < 10^lengde', () => {
    for (let i = 0; i < 200; i++) {
      const kode = randomDigitCode(4);
      assert.ok(Number(kode) < 10000);
      assert.equal(kode.length, 4);
    }
  });

  test('produserer faktisk varierte koder (ikke fastlåst på én verdi)', () => {
    const koder = new Set(Array.from({ length: 100 }, () => randomDigitCode(6)));
    assert.ok(koder.size > 50, `forventet variasjon, fikk kun ${koder.size} unike av 100`);
  });
});

describe('timingSafeEqual', () => {
  test('sant for identiske strenger', () => {
    assert.equal(timingSafeEqual('samme-verdi', 'samme-verdi'), true);
  });

  test('usant for ulik lengde', () => {
    assert.equal(timingSafeEqual('kort', 'lengre-streng'), false);
  });

  test('usant for lik lengde, ulikt innhold', () => {
    assert.equal(timingSafeEqual('abcdef', 'abcdeg'), false);
  });

  test('usant mot tom streng når selv ikke tom', () => {
    assert.equal(timingSafeEqual('noe', ''), false);
  });
});
