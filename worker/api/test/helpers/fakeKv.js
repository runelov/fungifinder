// Minimal in-memory erstatning for Workers KV (env.RATE_LIMIT), nok til
// src/lib/ratelimit.js sitt get/put-mønster. Ingen ekte TTL-utløp — testene
// som bryr seg om tidsvinduer styrer tid eksplisitt (skriver rader med et
// valgt `sisteForsok`-tidsstempel direkte via put()) i stedet for å vente.
export function makeFakeKv() {
  const store = new Map();
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, value);
    },
    _store: store,
  };
}
