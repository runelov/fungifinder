// Kjører worker/api/migrations/*.sql (i filnavn-rekkefølge — samme
// rekkefølge `wrangler d1 migrations apply` bruker) mot en fersk
// node:sqlite-database. Skjemaet duplikeres IKKE her — testene kjører mot
// de samme migrasjonsfilene som brukes mot ekte D1, så en skjemaendring
// som glemmer et felt (slik migrasjon 0004 gjorde for parkeringsfeltene,
// se terrengDb.js) slår ut i testene uten at noen må huske å oppdatere et
// duplisert testskjema.
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const MIGRATIONS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'migrations');

export function applyMigrations(db) {
  const filer = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  for (const fil of filer) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, fil), 'utf8');
    db.exec(sql);
  }
}
