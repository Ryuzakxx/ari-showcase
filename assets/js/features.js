// Pagina Funzionalità: barra degli argomenti, avatar animati e grafico della RAM.
(function () {
  'use strict';
  var Ari = window.Ari;
  if (!Ari) return;
  var u = Ari.util;

  initTopicBar();
  initEqRing();
  initBloub();
  initRamChart();

  /** Evidenzia l'argomento che stai leggendo (i clic li anima Lenis, vedi site.js). */
  function initTopicBar() {
    var bar = u.$('[data-feat-nav]');
    if (!bar) return;
    var links = u.$$('a', bar);
    var sections = links.map(function (a) {
      return document.getElementById(a.getAttribute('href').slice(1));
    });
    var active = -1;

    var update = function (s) {
      var line = window.innerHeight * 0.3;
      var index = -1;
      sections.forEach(function (sec, i) {
        if (sec && sec.getBoundingClientRect().top <= line) index = i;
      });
      if (s && s.progress > 0.995) index = sections.length - 1;
      if (index === active) return;
      if (links[active]) links[active].classList.remove('is-active');
      if (links[index]) {
        links[index].classList.add('is-active');
        // Su schermi stretti la barra scorre in orizzontale: tiene visibile la voce attiva.
        if (bar.scrollWidth > bar.clientWidth) {
          bar.scrollTo({ left: links[index].offsetLeft - 16, behavior: 'smooth' });
        }
      }
      active = index;
    };
    Ari.onScroll(update);
    update();
  }

  /** Anello equalizzatore: genera le barre radiali. */
  function initEqRing() {
    var svg = u.$('[data-eq-ring]');
    if (!svg) return;
    var ns = 'http://www.w3.org/2000/svg';
    var N = 30;
    var inner = 24;
    for (var i = 0; i < N; i++) {
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('transform', 'rotate(' + (i / N) * 360 + ' 60 60)');
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', 60);
      line.setAttribute('x2', 60);
      line.setAttribute('y1', 60 - inner);
      line.setAttribute('y2', 60 - inner - 16);
      line.setAttribute('class', 'eq' + (i % 2 ? ' is-purple' : ''));
      line.style.transformOrigin = '60px ' + (60 - inner) + 'px';
      line.style.animationDelay = -((Math.sin(i * 1.7) + 1) * 0.4).toFixed(2) + 's';
      line.style.animationDuration = (0.5 + ((i * 7) % 5) * 0.12).toFixed(2) + 's';
      g.appendChild(line);
      svg.appendChild(g);
    }
    var center = document.createElementNS(ns, 'circle');
    center.setAttribute('cx', 60);
    center.setAttribute('cy', 60);
    center.setAttribute('r', 13);
    center.setAttribute('fill', 'none');
    center.setAttribute('stroke', 'currentColor');
    center.setAttribute('stroke-width', 3);
    svg.appendChild(center);
  }

  /** Bloub segue il mouse con lo sguardo. */
  function initBloub() {
    var svg = u.$('[data-bloub]');
    if (!svg || Ari.reduce) return;
    var eyes = u.$('[data-bloub-eyes]', svg);
    window.addEventListener(
      'pointermove',
      function (e) {
        var rect = svg.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        var dist = Math.hypot(dx, dy) || 1;
        var reach = Math.min(1, dist / 300);
        eyes.style.transform =
          'translate(' + ((dx / dist) * 7 * reach).toFixed(2) + 'px,' + ((dy / dist) * 6 * reach).toFixed(2) + 'px)';
      },
      { passive: true },
    );
  }

  /** Grafico a barre orizzontali della RAM, con tooltip e tabella equivalente. */
  function initRamChart() {
    var chart = u.$('[data-ram-chart]');
    if (!chart) return;
    // Le barre crescono quando il riquadro (data-reveal) riceve la classe is-in.

    // Valori dal README di Ari, misurati in Gestione attività.
    var DATA = [
      { label: 'A riposo, trascrizione con Groq', mb: 110, light: true },
      { label: 'Modalità gioco', mb: 110, max: 160, light: true, note: 'Whisper locale e parola di attivazione fuori dalla memoria.' },
      { label: 'Parola di attivazione, sul processore', mb: 600 },
      { label: 'Parola di attivazione, sulla scheda video', mb: 1300 },
      { label: 'Trascrizione sul PC, mentre la usi', mb: 1700, note: 'Dopo 10 minuti senza usarla torna giù da sola.' },
    ];
    var DOMAIN = 2000;
    var TICKS = [0, 500, 1000, 1500, 2000];
    var fmt = new Intl.NumberFormat('it-IT');
    var valueText = function (d) {
      return d.max ? fmt.format(d.mb) + '–' + fmt.format(d.max) + ' MB' : fmt.format(d.mb) + ' MB';
    };

    var rows = DATA.map(function (d, i) {
      var w = (d.mb / DOMAIN) * 100;
      var rw = d.max ? ((d.max - d.mb) / DOMAIN) * 100 : 0;
      // Il valore va dentro la barra solo se c'è spazio, altrimenti subito dopo.
      var inside = w > 45;
      var valueStyle = inside ? 'right: calc(' + (100 - w) + '% + 10px)' : 'left: calc(' + (w + rw) + '% + 10px)';
      return (
        '<div class="ram__row" tabindex="0" data-i="' + i + '" style="--i:' + i + '" aria-label="' +
        u.escapeHtml(d.label + ': ' + valueText(d)) + '">' +
        '<span class="ram__label">' + u.escapeHtml(d.label) + '</span>' +
        '<span class="ram__track">' +
        '<span class="ram__bar' + (d.light ? ' is-light' : '') + '" style="--w:' + w + '%"></span>' +
        (d.max ? '<span class="ram__range" style="--w:' + w + '%;--rw:' + rw + '%"></span>' : '') +
        '<span class="ram__value" style="' + valueStyle + '">' + valueText(d) + '</span>' +
        '</span></div>'
      );
    }).join('');

    chart.innerHTML =
      rows +
      '<div class="ram__axis" aria-hidden="true"><span></span><span class="ram__ticks">' +
      TICKS.map(function (t) {
        return '<span style="left:' + (t / DOMAIN) * 100 + '%">' + fmt.format(t) + '</span>';
      }).join('') +
      '</span></div>' +
      '<p class="ram__legend">' +
      '<span><i style="background: var(--blue)"></i>Uso leggero</span>' +
      '<span><i style="background: #3a4166"></i>Con i modelli di Whisper sul PC</span>' +
      '<span><i style="background: var(--purple)"></i>Variazione in modalità gioco</span>' +
      '</p><div class="ram__tip" role="tooltip"></div>';

    var table = u.$('[data-ram-table]');
    if (table) {
      table.innerHTML = DATA.map(function (d) {
        return '<tr><td>' + u.escapeHtml(d.label) + '</td><td>' + valueText(d) + '</td></tr>';
      }).join('');
    }

    var tip = u.$('.ram__tip', chart);
    var show = function (row, x, y) {
      var d = DATA[row.getAttribute('data-i')];
      tip.innerHTML =
        '<strong>' + valueText(d) + '</strong><span>' + u.escapeHtml(d.label) + (d.note ? '. ' + u.escapeHtml(d.note) : '') + '</span>';
      var box = chart.getBoundingClientRect();
      tip.style.left = u.clamp(x - box.left + 16, 0, Math.max(0, box.width - tip.offsetWidth)) + 'px';
      tip.style.top = y - box.top + 16 + 'px';
      tip.classList.add('is-visible');
    };
    var hide = function () {
      tip.classList.remove('is-visible');
    };

    u.$$('.ram__row', chart).forEach(function (row) {
      row.addEventListener('pointermove', function (e) {
        show(row, e.clientX, e.clientY);
      });
      row.addEventListener('pointerleave', hide);
      row.addEventListener('focus', function () {
        var r = row.getBoundingClientRect();
        show(row, r.left + r.width * 0.4, r.top + r.height / 2);
      });
      row.addEventListener('blur', hide);
    });
  }
})();
