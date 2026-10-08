// Pagina Video: player ed elenco (dati in assets/data/videos.js, file in videos/).
(function () {
  'use strict';
  var Ari = window.Ari;
  var videos = window.ARI_VIDEOS || [];
  if (!Ari || !videos.length) return;
  var u = Ari.util;

  var player = u.$('[data-player]');
  var video = u.$('[data-player-video]');
  var empty = u.$('[data-player-empty]');
  var list = u.$('[data-playlist]');
  if (!player || !video || !list) return;

  var current = 0;
  var formatDuration = function (s) {
    return Math.floor(s / 60) + ':' + u.pad(Math.floor(s % 60));
  };

  renderPlaylist();
  wirePlayer();
  select(indexFromHash());

  function indexFromHash() {
    var m = location.hash.match(/^#video-(\d+)$/);
    var n = m ? Number(m[1]) : 0;
    return n >= 1 && n <= videos.length ? n - 1 : 0;
  }

  function setText(sel, text) {
    var el = u.$(sel);
    if (el) el.textContent = text;
  }

  function select(index, opts) {
    opts = opts || {};
    current = (index + videos.length) % videos.length;
    var v = videos[current];

    setText('[data-player-cat]', v.category || 'Video');
    setText('[data-player-count]', 'Video ' + (current + 1) + ' di ' + videos.length);
    setText('[data-player-title]', v.title);
    setText('[data-player-desc]', v.description || '');
    setText('[data-player-path]', v.src);

    empty.hidden = true;
    video.hidden = false;
    if (v.poster) video.setAttribute('poster', v.poster);
    else video.removeAttribute('poster');
    video.src = v.src;
    video.load();
    if (opts.autoplay) {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    u.$$('.pl-item', list).forEach(function (item) {
      item.setAttribute('aria-current', String(Number(item.getAttribute('data-index')) === current));
    });

    if (current > 0 || location.hash) history.replaceState(null, '', '#video-' + (current + 1));
    // Su schermi stretti l'elenco sta sotto al player: dopo la scelta si torna su.
    if (opts.scroll && player.getBoundingClientRect().top < 0) Ari.scrollToEl(player);
  }

  function wirePlayer() {
    // File mancante (o formato non supportato): al posto del video compare «Video in arrivo».
    video.addEventListener('error', function () {
      if (!video.getAttribute('src')) return;
      video.hidden = true;
      empty.hidden = false;
    });
    video.addEventListener('ended', function () {
      select(current + 1, { autoplay: true });
    });
    var prev = u.$('[data-player-prev]');
    var next = u.$('[data-player-next]');
    if (prev) prev.addEventListener('click', function () {
      select(current - 1, { autoplay: !video.paused });
    });
    if (next) next.addEventListener('click', function () {
      select(current + 1, { autoplay: !video.paused });
    });
  }

  function renderPlaylist() {
    setText('[data-playlist-count]', '(' + videos.length + ')');
    list.innerHTML = videos
      .map(function (v, i) {
        return (
          '<li><button class="pl-item" type="button" data-index="' + i + '" aria-current="false">' +
          '<span class="pl-thumb" aria-hidden="true">' + u.pad(i + 1) + '</span>' +
          '<span class="pl-text"><span class="pl-title">' + u.escapeHtml(v.title) + '</span>' +
          '<span class="pl-meta">' + u.escapeHtml(v.category || 'Video') +
          '<span data-duration>' + (v.duration ? ' · ' + u.escapeHtml(v.duration) : '') + '</span></span>' +
          '</span></button></li>'
        );
      })
      .join('');

    u.$$('.pl-item', list).forEach(function (item) {
      item.addEventListener('click', function () {
        select(Number(item.getAttribute('data-index')), { autoplay: true, scroll: true });
      });
      loadThumb(item);
    });

    // Lenis lascia scorrere l'elenco da solo solo quando ha davvero una barra di scorrimento.
    var syncPrevent = function () {
      list.toggleAttribute('data-lenis-prevent', list.scrollHeight > list.clientHeight + 1);
    };
    if ('ResizeObserver' in window) new ResizeObserver(syncPrevent).observe(list);
    syncPrevent();
  }

  /** Anteprima: un fotogramma del video stesso (o il poster), più la durata letta dal file. */
  function loadThumb(item) {
    var v = videos[Number(item.getAttribute('data-index'))];
    var el = document.createElement('video');
    el.muted = true;
    el.playsInline = true;
    el.preload = 'metadata';
    if (v.poster) el.setAttribute('poster', v.poster);
    // #t=…: mostra un fotogramma scelto (campo thumb) invece del primo.
    el.src = v.src + '#t=' + (v.thumb != null ? v.thumb : 0.5);
    u.$('.pl-thumb', item).appendChild(el);

    el.addEventListener('loadedmetadata', function () {
      item.classList.add('is-ready');
      if (!v.duration && isFinite(el.duration)) {
        u.$('[data-duration]', item).textContent = ' · ' + formatDuration(el.duration);
      }
    });
    el.addEventListener('error', function () {
      item.classList.add('is-missing');
    });
  }
})();
