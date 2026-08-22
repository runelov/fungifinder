import { test, describe, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { verifyTurnstile } from '../../src/lib/turnstile.js';

const ENV = { TURNSTILE_SECRET_KEY: 'hemmelig' };

describe('verifyTurnstile', () => {
  afterEach(() => {
    mock.reset();
  });

  test('avviser uten nettverkskall når token mangler', async () => {
    const fetchMock = mock.method(globalThis, 'fetch');
    const ok = await verifyTurnstile(null, '1.2.3.4', ENV);
    assert.equal(ok, false);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test('godtar når Cloudflare svarer success: true', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      json: async () => ({ success: true }),
    }));
    const ok = await verifyTurnstile('ekte-token', '1.2.3.4', ENV);
    assert.equal(ok, true);
  });

  test('avviser når Cloudflare svarer success: false', async () => {
    mock.method(globalThis, 'fetch', async () => ({
      json: async () => ({ success: false, 'error-codes': ['invalid-input-response'] }),
    }));
    const ok = await verifyTurnstile('daarlig-token', '1.2.3.4', ENV);
    assert.equal(ok, false);
  });

  test('avviser (ikke kaster) ved nettverksfeil mot Cloudflare', async () => {
    mock.method(globalThis, 'fetch', async () => {
      throw new Error('nettverksfeil');
    });
    const ok = await verifyTurnstile('token', '1.2.3.4', ENV);
    assert.equal(ok, false);
  });

  test('sender secret og token videre til Cloudflare', async () => {
    const fetchMock = mock.method(globalThis, 'fetch', async () => ({
      json: async () => ({ success: true }),
    }));
    await verifyTurnstile('mitt-token', '9.9.9.9', ENV);
    const [url, init] = fetchMock.mock.calls[0].arguments;
    assert.equal(url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    const sentBody = init.body.toString();
    assert.match(sentBody, /secret=hemmelig/);
    assert.match(sentBody, /response=mitt-token/);
    assert.match(sentBody, /remoteip=9.9.9.9/);
  });
});
