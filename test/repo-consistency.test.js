// Statiske regresjonstester for konkrete, tidligere produksjonshendelser —
// leser kildefiler direkte, kjører ikke js/app.js (som er én udelt
// IIFE-closure uten eksporterte funksjoner, se README.md "Enhetstester"
// for hvorfor selve app-logikken ikke er dekket her ennå).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const REPO_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function les(relPath) {
  return readFileSync(path.join(REPO_ROOT, relPath), 'utf8');
}

describe('versjonskonsistens (regresjon for v0.30.3/v0.30.4-klassen cache-busting-bugs)', () => {
  test('APP_VERSION i app.js matcher ?v= på css/styles.css, js/api-client.js og js/app.js i index.html, og toppen av CHANGELOG.md', () => {
    const appJs = les('js/app.js');
    const versjonMatch = appJs.match(/const APP_VERSION = '([^']+)'/);
    assert.ok(versjonMatch, 'fant ikke APP_VERSION i js/app.js');
    const versjon = versjonMatch[1];

    const indexHtml = les('index.html');
    for (const fil of ['css/styles.css', 'js/api-client.js', 'js/app.js']) {
      const re = new RegExp(fil.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\?v=([^"\']+)');
      const m = indexHtml.match(re);
      assert.ok(m, `fant ikke ?v=-parameter for ${fil} i index.html`);
      assert.equal(m[1], versjon, `${fil} sin ?v= (${m[1]}) er ikke i sync med APP_VERSION (${versjon})`);
    }

    const changelog = les('CHANGELOG.md');
    const topMatch = changelog.match(/^## ([0-9]+\.[0-9]+\.[0-9]+)/m);
    assert.ok(topMatch, 'fant ikke en versjonsoverskrift (## x.y.z) i toppen av CHANGELOG.md');
    assert.equal(topMatch[1], versjon, `CHANGELOG.md sin nyeste seksjon (${topMatch[1]}) matcher ikke APP_VERSION (${versjon})`);
  });
});

describe('Turnstile-nøkkel (regresjon for produksjonshendelsen 2026-07-20)', () => {
  test('index.html bruker IKKE Cloudflares always-pass-testnøkkel som sitekey', () => {
    const indexHtml = les('index.html');
    const m = indexHtml.match(/data-sitekey="([^"]+)"/);
    assert.ok(m, 'fant ikke data-sitekey i index.html');
    assert.notEqual(m[1], '1x00000000000000000000AA', 'index.html bruker Cloudflares always-pass-testnøkkel — hører kun hjemme i worker/api/.dev.vars');
  });
});

describe('CORS-konfigurasjon', () => {
  test('ALLOWED_ORIGIN i wrangler.toml er et konkret opphav, ikke wildcard/tomt', () => {
    const toml = les('worker/api/wrangler.toml');
    const m = toml.match(/ALLOWED_ORIGIN\s*=\s*"([^"]*)"/);
    assert.ok(m, 'fant ikke ALLOWED_ORIGIN i worker/api/wrangler.toml');
    assert.notEqual(m[1], '*');
    assert.match(m[1], /^https:\/\/.+/, 'ALLOWED_ORIGIN bør være en konkret https-opprinnelse');
  });
});

describe('JS-syntakssjekk', () => {
  function finnJsFiler(dir) {
    const ut = [];
    for (const entry of readdirSync(dir)) {
      if (entry === 'node_modules' || entry === 'test') continue;
      const full = path.join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) ut.push(...finnJsFiler(full));
      else if (entry.endsWith('.js')) ut.push(full);
    }
    return ut;
  }

  const filer = [...finnJsFiler(path.join(REPO_ROOT, 'js')), ...finnJsFiler(path.join(REPO_ROOT, 'worker', 'api', 'src'))];

  test('fant faktisk js-filer å sjekke (vern mot en tom/feilkonfigurert sti)', () => {
    assert.ok(filer.length > 5, `forventet flere js-filer, fant ${filer.length}`);
  });

  for (const fil of filer) {
    test(`node --check ${path.relative(REPO_ROOT, fil)}`, () => {
      assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', fil], { stdio: 'pipe' }));
    });
  }
});
