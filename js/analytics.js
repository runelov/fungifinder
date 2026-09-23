// Webanalyse (PostHog, EU Cloud) — personvernvennlig oppsett, se README.md
// "Webanalyse (PostHog)" for hele begrunnelsen.
//
// Kort oppsummert:
// - INGEN cookies og ingenting i localStorage (persistence: 'memory'). Ny
//   anonym ID per sidelasting — koster oss retensjon/"samme bruker igjen"-
//   målinger, men gjør at vi ikke trenger samtykkebanner etter ekomloven.
// - Ingen identify(), aldri e-post/kortnavn/koordinater. Eneste
//   bruker-egenskap er rollen (anonym/bruker/admin) som super property.
// - Ingen autocapture, ingen opptak av økter, ingen surveys/heatmaps.
//   Kun sidevisning + et lite sett eksplisitte hendelser via
//   Analytics.track().
// - Query-string og hash strippes fra alle URL-egenskaper før sending
//   (?invitasjon=<token> står i URL-en ved første sidelasting).
// - Kjører kun på produksjonsdomenet, og er en no-op så lenge
//   POSTHOG_KEY er tom — trygt å merge før PostHog-prosjektet finnes.
(function () {
  // Prosjektnøkkelen (phc_…) er en offentlig klientnøkkel, ikke en
  // hemmelighet — den er laget for å ligge i frontend-kode.
  const POSTHOG_KEY = '';
  const POSTHOG_HOST = 'https://eu.i.posthog.com';
  const PROD_HOSTS = ['fungifinder.no', 'www.fungifinder.no'];

  const aktiv = !!POSTHOG_KEY && PROD_HOSTS.includes(location.hostname);

  const URL_EGENSKAPER = ['$current_url', '$referrer', '$initial_referrer', '$initial_current_url', '$pathname'];
  function strippUrl(verdi) {
    if (typeof verdi !== 'string') return verdi;
    const i = verdi.search(/[?#]/);
    return i === -1 ? verdi : verdi.slice(0, i);
  }

  if (aktiv) {
    // PostHogs offisielle laste-stubb, utbrettet og trimmet til metodene vi
    // faktisk bruker: kall før array.js er lastet legges i kø og spilles av
    // når skriptet er på plass. (array.js har ingen fast versjon, så SRI
    // er ikke mulig her — i motsetning til Leaflet i index.html.)
    (function (d, ph) {
      if (ph.__SV) return;
      window.posthog = ph;
      ph._i = [];
      ph.init = function (key, config, name) {
        const s = d.createElement('script');
        s.type = 'text/javascript';
        s.crossOrigin = 'anonymous';
        s.async = true;
        s.src = config.api_host.replace('.i.posthog.com', '-assets.i.posthog.com') + '/static/array.js';
        const first = d.getElementsByTagName('script')[0];
        first.parentNode.insertBefore(s, first);
        let target = ph;
        if (name !== undefined) target = ph[name] = []; else name = 'posthog';
        target.people = target.people || [];
        target.toString = function (stub) { let n = 'posthog'; if (name !== 'posthog') n += '.' + name; if (!stub) n += ' (stub)'; return n; };
        target.people.toString = function () { return target.toString(1) + ' (stub)'; };
        'init capture register unregister opt_in_capturing opt_out_capturing set_config'.split(' ').forEach(method => {
          target[method] = function () { target.push([method].concat(Array.prototype.slice.call(arguments, 0))); };
        });
        ph._i.push([key, config, name]);
      };
      ph.__SV = 1;
    })(document, window.posthog || []);

    window.posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      persistence: 'memory',
      person_profiles: 'identified_only', // vi kaller aldri identify() → kun anonyme hendelser
      autocapture: false,
      capture_pageview: true,
      capture_pageleave: true,
      disable_session_recording: true,
      disable_surveys: true,
      capture_heatmaps: false,
      capture_dead_clicks: false,
      capture_performance: false,
      respect_dnt: true,
      sanitize_properties: function (props) {
        URL_EGENSKAPER.forEach(k => { if (k in props) props[k] = strippUrl(props[k]); });
        return props;
      },
    });
  }

  window.Analytics = {
    // Kalles fra app.js når innloggingsstatus er kjent/endres.
    settRolle(rolle, appVersjon) {
      if (!aktiv) return;
      window.posthog.register({ rolle: rolle || 'anonym', app_versjon: appVersjon });
    },
    // Hold hendelsesnavn og egenskaper grove og ikke-personlige — aldri
    // fritekst, e-post, kortnavn eller koordinater.
    track(hendelse, egenskaper) {
      if (!aktiv) return;
      try { window.posthog.capture(hendelse, egenskaper || {}); } catch (e) { /* analyse skal aldri velte appen */ }
    },
  };
})();
