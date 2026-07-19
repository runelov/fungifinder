const MAKS_KORTNAVN_LENGDE = 100;
const EPOST_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// En invitasjonslenke beviser kun at holderen har fått delt en lenke, IKKE
// at de kontrollerer noen bestemt e-postadresse. Hvis registreringsskjemaet
// fikk oppgi e-post selv, kunne hvem som helst med lenken registrere seg
// med en VILKÅRLIG andres e-post og kapre adressen permanent (UNIQUE på
// brukere.epost). Løsning (samme som Bondøya, gjort riktig fra dag én
// her): admin binder lenken til én bestemt e-post ved generering —
// registrering bruker ALLTID denne bundne adressen server-side, aldri noe
// klienten sender inn.
export function validerEpost(epost) {
  const trimmed = (epost || '').trim().toLowerCase();
  if (!trimmed) throw new Error('E-post mangler.');
  if (!EPOST_REGEX.test(trimmed)) throw new Error('Ugyldig e-postadresse.');
  return trimmed;
}

export function validerKortnavn(kortnavn) {
  const trimmed = (kortnavn || '').trim();
  if (!trimmed) throw new Error('Kortnavn mangler.');
  if (trimmed.length > MAKS_KORTNAVN_LENGDE) throw new Error('Kortnavn er for langt.');
  return trimmed;
}
