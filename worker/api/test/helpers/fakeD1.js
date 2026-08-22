// Minimal adapter som gir node:sqlite (ekte SQLite, samme dialekt D1
// bruker) samme kontrakt som Cloudflare D1s env.DB:
//   env.DB.prepare(sql).bind(...args).first() / .run() / .all()
// Nok til at src/lib/session.js, ratelimit.js sitt mønster (det bruker KV,
// ikke D1 — se fakeKv.js) og terrengDb.js kan kjøres uendret mot en
// in-memory database i testene, uten noen egen mock-implementasjon av
// spørringenes SQL-logikk (den kjøres EKTE av SQLite).
export function makeFakeD1(db) {
  return {
    prepare(sql) {
      return statement(db, sql, []);
    },
    _raw: db,
  };
}

function statement(db, sql, params) {
  return {
    bind(...args) {
      return statement(db, sql, args);
    },
    async first(col) {
      const row = db.prepare(sql).get(...params);
      if (row == null) return null;
      return col != null ? (row[col] ?? null) : row;
    },
    async run() {
      const info = db.prepare(sql).run(...params);
      return { success: true, meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
    },
    async all() {
      const rows = db.prepare(sql).all(...params);
      return { success: true, results: rows };
    },
  };
}
