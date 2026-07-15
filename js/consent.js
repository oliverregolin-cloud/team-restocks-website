/*
 * ePrivacy-/TDDDG-konformer Consent-Hinweis.
 * Diese Website setzt aktuell keine einwilligungspflichtigen Cookies/Dienste.
 * Gespeichert wird nur die Entscheidung selbst (technisch notwendig, § 25 Abs. 2 TDDDG).
 * Der Banner ist zukunftssicher: optionale Dienste dürfen erst nach
 * "Alle akzeptieren" geladen werden (siehe applyConsent()).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'tr-consent';

  function getConsent() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch (e) {}
  }

  // Wird nach Zustimmung zu optionalen Diensten aufgerufen.
  // Aktuell bewusst leer, da keine optionalen Dienste eingebunden sind.
  function applyConsent() { /* z. B. Analytics erst hier laden */ }

  function removeBanner() {
    var el = document.getElementById('cookie-consent');
    if (el) { el.parentNode.removeChild(el); }
  }

  function buildBanner() {
    var wrap = document.createElement('div');
    wrap.id = 'cookie-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-label', 'Datenschutz-Hinweis');
    wrap.setAttribute('aria-live', 'polite');

    wrap.innerHTML =
      '<div class="cc-inner">' +
        '<div class="cc-text">' +
          '<strong>Datenschutz-Hinweis</strong>' +
          '<p>Diese Website verwendet keine Tracking- oder Marketing-Cookies. ' +
          'Schriftarten werden lokal geladen, es findet keine Datenübertragung an Google statt. ' +
          'Gespeichert wird lediglich deine Auswahl zu diesem Hinweis (technisch notwendig). ' +
          'Details in der <a href="datenschutz.html">Datenschutzerklärung</a>.</p>' +
        '</div>' +
        '<div class="cc-actions">' +
          '<button type="button" class="btn btn-outline cc-btn" data-choice="necessary">Nur notwendige</button>' +
          '<button type="button" class="btn btn-primary cc-btn" data-choice="all">Alle akzeptieren</button>' +
        '</div>' +
      '</div>';

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.cc-btn');
      if (!btn) { return; }
      var choice = btn.getAttribute('data-choice');
      setConsent(choice);
      if (choice === 'all') { applyConsent(); }
      removeBanner();
    });

    return wrap;
  }

  function init() {
    var stored = getConsent();
    if (stored === 'all') { applyConsent(); return; }
    if (stored === 'necessary') { return; }
    document.body.appendChild(buildBanner());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
