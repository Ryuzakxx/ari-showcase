// Pagina Versioni: numeri in alto, pulsanti delle versioni e grafico git (dati in assets/data/versions.js).
(function () {
  'use strict';
  var Ari = window.Ari;
  var GG = window.AriGitGraph;
  var data = window.ARI_VERSIONS;
  if (!Ari || !GG || !data) return;
  var u = Ari.util;

  var model = GG.buildModel(data.commits || [], { mainBranch: data.mainBranch, branchLanes: data.branchLanes });
  var container = u.$('[data-graph]');
  var narrow = window.matchMedia('(max-width: 640px)');

  renderStats();
  renderChips();
  var graph = mountGraph(false);
  trackCurrentVersion();

  var onNarrowChange = function () {
    // Cambia la larghezza delle corsie: ridisegna tutto, già visibile.
    graph = mountGraph(true);
  };
  if (narrow.addEventListener) narrow.addEventListener('change', onNarrowChange);

  function renderStats() {
    var set = function (key, value) {
      var el = u.$('[data-stat="' + key + '"]');
      if (el) el.textContent = value;
    };
    set('tags', model.tags.length);
    set('commits', model.nodes.length);
    set('branches', model.branches.length);
  }

  function renderChips() {
    var bar = u.$('[data-chips]');
    if (!bar) return;
    bar.innerHTML = model.tags
      .slice()
      .reverse()
      .map(function (n) {
        return '<a href="#' + GG.tagId(n.tag) + '" data-tag="' + u.escapeHtml(n.tag) + '">' + u.escapeHtml(n.tag) + '</a>';
      })
      .join('');
  }

  function mountGraph(drawAll) {
    var g = GG.renderGraph(container, model, { laneWidth: narrow.matches ? 16 : 22 });

    if (drawAll || Ari.reduce || !('IntersectionObserver' in window)) {
      g.rows.forEach(function (r) {
        g.draw(r.getAttribute('data-index'));
      });
    } else {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            g.draw(entry.target.getAttribute('data-index'));
            io.unobserve(entry.target);
          });
        },
        { rootMargin: '0px 0px -10% 0px' },
      );
      g.rows.forEach(function (r) {
        io.observe(r);
      });
    }

    // Le righe cambiano altezza (font, larghezza della finestra): ricalcola le posizioni.
    if ('ResizeObserver' in window) {
      var raf = 0;
      new ResizeObserver(function () {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(g.layout);
      }).observe(u.$('.gg__rows', container));
    }

    g.rows.forEach(function (row) {
      var index = row.getAttribute('data-index');
      row.addEventListener('pointerenter', function () {
        g.highlight(index, true);
      });
      row.addEventListener('pointerleave', function () {
        g.highlight(index, false);
      });
    });
    return g;
  }

  /** Evidenzia nella barra la versione a cui appartengono i commit in cima allo schermo. */
  function trackCurrentVersion() {
    // Ogni commit appartiene al primo rilascio che lo segue.
    var versionOf = {};
    var next = null;
    for (var i = model.nodes.length - 1; i >= 0; i--) {
      if (model.nodes[i].tag) next = model.nodes[i].tag;
      versionOf[i] = next;
    }

    var bar = u.$('[data-chips]');
    var chips = bar ? u.$$('a', bar) : [];
    var current;

    var update = function () {
      var line = bar ? bar.getBoundingClientRect().bottom + 24 : 160;
      var rows = graph.rows;
      var row = rows[0];
      for (var k = 0; k < rows.length; k++) {
        if (rows[k].getBoundingClientRect().bottom > line) {
          row = rows[k];
          break;
        }
      }
      var version = row ? versionOf[row.getAttribute('data-index')] : null;
      if (version === current) return;
      current = version;
      chips.forEach(function (c) {
        var on = c.getAttribute('data-tag') === version;
        c.classList.toggle('is-active', on);
        if (on && bar.scrollWidth > bar.clientWidth) {
          bar.scrollTo({ left: c.offsetLeft - 16, behavior: 'smooth' });
        }
      });
    };
    Ari.onScroll(update);
    update();
  }
})();
