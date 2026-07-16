/*
 * Widerrufsbutton gemäß § 356a BGB (ab 19.06.2026).
 * Zweistufiger Prozess: (1) Vertrag identifizieren, (2) separat bestätigen.
 * Kein Login, keine Angabe von Gründen. Da diese Seite statisch ist (kein
 * Server), wird die Erklärung als vorausgefüllte E-Mail (mailto:) an den
 * Anbieter übergeben — es werden dabei keine Daten an uns oder Dritte
 * übertragen, bevor der Nutzer die E-Mail selbst absendet.
 */
(function () {
  'use strict';

  var startBtn = document.getElementById('widerrufStartBtn');
  if (!startBtn) { return; }

  var widget = document.getElementById('widerruf-button');
  var step1 = document.getElementById('widerrufStep1');
  var step2 = document.getElementById('widerrufStep2');
  var done = document.getElementById('widerrufDone');
  var nameInput = document.getElementById('wdName');
  var emailInput = document.getElementById('wdEmail');
  var orderInput = document.getElementById('wdOrder');
  var nextBtn = document.getElementById('widerrufNextBtn');
  var backBtn = document.getElementById('widerrufBackBtn');
  var confirmBtn = document.getElementById('widerrufConfirmBtn');
  var errorEl = document.getElementById('widerrufError');
  var declarationEl = document.getElementById('widerrufDeclaration');
  var confirmEmailEl = document.getElementById('widerrufConfirmEmail');

  var RECIPIENT = 'restock@teamrestocks.de';

  function show(el) { el.hidden = false; }
  function hide(el) { el.hidden = true; }

  startBtn.addEventListener('click', function () {
    hide(startBtn);
    show(step1);
    nameInput.focus();
  });

  nextBtn.addEventListener('click', function () {
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();

    if (!name || !email) {
      show(errorEl);
      return;
    }
    hide(errorEl);

    var order = orderInput.value.trim();
    var today = new Date().toLocaleDateString('de-DE');

    declarationEl.innerHTML =
      '<p><strong>Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Team-Restocks-Mitgliedschaft.</strong></p>' +
      '<p>Name: ' + escapeHtml(name) + '<br>' +
      'E-Mail: ' + escapeHtml(email) + '<br>' +
      (order ? 'Bestellnummer/Datum: ' + escapeHtml(order) + '<br>' : '') +
      'Datum der Erklärung: ' + today + '</p>';

    confirmEmailEl.textContent = email;

    hide(step1);
    show(step2);
  });

  backBtn.addEventListener('click', function () {
    hide(step2);
    show(step1);
  });

  confirmBtn.addEventListener('click', function () {
    var name = nameInput.value.trim();
    var email = emailInput.value.trim();
    var order = orderInput.value.trim();
    var today = new Date().toLocaleDateString('de-DE');

    var subject = 'Widerruf Team-Restocks-Mitgliedschaft';
    var body =
      'Hiermit widerrufe ich den von mir abgeschlossenen Vertrag über die Team-Restocks-Mitgliedschaft.\n\n' +
      'Name: ' + name + '\n' +
      'E-Mail: ' + email + '\n' +
      (order ? 'Bestellnummer/Datum: ' + order + '\n' : '') +
      'Datum der Erklärung: ' + today + '\n';

    var mailto = 'mailto:' + RECIPIENT +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);

    window.location.href = mailto;

    hide(step2);
    show(done);
  });

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
