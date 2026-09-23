// Sender innloggingslenke via Resend. Uten RESEND_API_KEY, eller utenfor
// ENVIRONMENT=production (lokal wrangler dev), logges lenken til konsollen
// i stedet for å faktisk sendes — se README.md for hvordan dette brukes til
// å teste hele auth-flyten uten en ekte e-postinnboks. Portert fra Bondøya.
export async function sendInnloggingsLenke(epost, lenkeUrl, kode, env) {
  if (env.ENVIRONMENT === 'production' && !env.RESEND_API_KEY) {
    // Feil høylytt i stedet for å falle tilbake til dev-logging — ellers
    // ville en glemt/slettet secret i produksjon stille logge levende,
    // brukbare innloggingstokens til Worker-loggene i stedet for å sende
    // e-post.
    throw new Error('RESEND_API_KEY mangler i produksjon — nekter å falle tilbake til dev-logging.');
  }

  if (!env.RESEND_API_KEY || env.ENVIRONMENT !== 'production') {
    console.log(`[dev] Innloggingslenke for ${epost}: ${lenkeUrl} (kode: ${kode})`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Eget verifisert Resend-domene (mail.fungifinder.no) siden
      // 2026-09-23. Før det gjenbrukte FungiFinder Bondøyas
      // mail.bondoya.no, fordi Resends gratiskonto bare tillot ett
      // verifisert domene — nå tillater den tre. Samme Resend-konto og
      // API-nøkkel som Bondøya fortsatt, men endringer i Bondøyas
      // sendedomene påvirker ikke lenger FungiFinders innloggingsepost.
      from: 'FungiFinder <innlogging@mail.fungifinder.no>',
      to: epost,
      subject: 'Logg inn på FungiFinder',
      html: `<p>Klikk for å logge inn: <a href="${lenkeUrl}">${lenkeUrl}</a></p><p>Bruker du FungiFinder som en snarvei på hjemskjermen? Lenken over åpnes i Safari, ikke i selve appen. Skriv i stedet inn denne koden under "Konto" i appen: <b>${kode}</b></p><p>Lenken og koden er gyldig i 15 minutter og kan kun brukes én gang.</p>`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend-sending feilet (${res.status}): ${text}`);
  }
}
