// Portert fra Bondøyas worker/api/src/lib/crypto.js. randomToken/sha256Hex
// brukes for magic-link-tokens, sesjons-ID-er og invitasjonstokens:
// høy-entropi tilfeldig verdi sendes til klienten/e-posten, kun
// SHA-256-hashen av den lagres i D1.

export function randomToken() {
  const bytes = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

export async function sha256Hex(input) {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', enc);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Brukes til innloggingskoden (se routes/auth.js sin verifiserKode) — et
// kort, manuelt inntastbart alternativ til magic-link-en, for konteksten
// der den ikke kan brukes (PWA lagt til på hjemskjermen har hverken
// adressefelt eller "åpne i app"-håndtering av lenken i e-posten).
export function randomDigitCode(lengde = 6) {
  const maks = 10 ** lengde;
  const tall = crypto.getRandomValues(new Uint32Array(1))[0] % maks;
  return String(tall).padStart(lengde, '0');
}

export function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) diff |= aBytes[i] ^ bBytes[i];
  return diff === 0;
}

function base64UrlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
