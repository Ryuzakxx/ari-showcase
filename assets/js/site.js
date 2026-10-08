// Parte comune a tutte le pagine. Script classico (niente moduli), così il sito funziona anche
// aprendo i file con un doppio clic o con Live Server, senza passaggi di build.
(function () {
  'use strict';

  var root = document.documentElement;
  // Le animazioni di comparsa nascondono gli elementi solo se questo script è partito davvero.
  root.classList.add('js-ready');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var config = window.ARI_CONFIG || {};

  /* ------------------------------------------------------------------------ */
  /*  Utilità                                                                 */
  /* ------------------------------------------------------------------------ */

  var $ = function (sel, el) {
    return (el || document).querySelector(sel);
  };
  var $$ = function (sel, el) {
    return Array.prototype.slice.call((el || document).querySelectorAll(sel));
  };
  var clamp = function (v, min, max) {
    return Math.min(max === undefined ? 1 : max, Math.max(min || 0, v));
  };
  var pad = function (n) {
    return String(n).padStart(2, '0');
  };
  var cssVar = function (name) {
    return getComputedStyle(root).getPropertyValue(name).trim();
  };
  var escapeHtml = function (text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };
  var trackVisibility = function (el, cb) {
    if (!('IntersectionObserver' in window)) return cb(true);
    new IntersectionObserver(function (entries) {
      cb(entries[0].isIntersecting);
    }).observe(el);
  };

  /* ------------------------------------------------------------------------ */
  /*  Scorrimento morbido con Lenis                                           */
  /*  https://github.com/darkroomengineering/lenis — assets/vendor/lenis      */
  /* ------------------------------------------------------------------------ */

  var lenis = null;
  if (typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ autoRaf: true, lerp: 0.1, stopInertiaOnNavigate: true });
  }

  var listeners = [];
  var emit = function () {
    var max = root.scrollHeight - window.innerHeight;
    var state = { scroll: window.scrollY, progress: max > 0 ? clamp(window.scrollY / max) : 0 };
    listeners.forEach(function (cb) {
      cb(state);
    });
  };
  if (lenis) lenis.on('scroll', emit);
  else window.addEventListener('scroll', emit, { passive: true });
  window.addEventListener('resize', emit);

  var onScroll = function (cb) {
    listeners.push(cb);
  };

  /** Altezza occupata in alto dalla barra di navigazione e dalle barre «sticky» (data-sticky). */
  var topOffset = function () {
    var nav = $('.nav');
    var offset = nav ? nav.getBoundingClientRect().bottom : 80;
    $$('[data-sticky]').forEach(function (bar) {
      offset += bar.offsetHeight + 10;
    });
    return offset + 16;
  };

  var scrollToEl = function (el, opts) {
    opts = opts || {};
    var top = el.getBoundingClientRect().top + window.scrollY - topOffset();
    if (lenis) lenis.scrollTo(top, { duration: 1.2, immediate: !!opts.immediate });
    else window.scrollTo({ top: top, behavior: opts.immediate || reduce ? 'auto' : 'smooth' });
  };

  var scrollToTop = function () {
    if (lenis) lenis.scrollTo(0, { duration: 1.4 });
    else window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  };

  // Link interni (#sezione): li anima Lenis al posto del salto del browser.
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href^="#"]');
    if (!link) return;
    var hash = link.getAttribute('href');
    if (hash === '#') return e.preventDefault();
    var target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    history.replaceState(null, '', hash);
    scrollToEl(target);
    if (link.classList.contains('skip-link')) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  // Arrivando da un'altra pagina con #sezione: corregge il salto tenendo conto della barra in alto.
  window.addEventListener('load', function () {
    if (lenis) lenis.resize();
    var target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) {
      setTimeout(function () {
        scrollToEl(target, { immediate: true });
      }, 60);
    }
  });

  /* ------------------------------------------------------------------------ */
  /*  Comparsa degli elementi                                                 */
  /* ------------------------------------------------------------------------ */

  var reveal = function (elements) {
    if (!('IntersectionObserver' in window) || reduce) {
      elements.forEach(function (el) {
        el.classList.add('is-in');
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -6% 0px' },
    );
    elements.forEach(function (el) {
      io.observe(el);
    });
  };
  reveal($$('[data-reveal]'));

  /* ------------------------------------------------------------------------ */
  /*  Menu mobile                                                             */
  /* ------------------------------------------------------------------------ */

  var menuBtn = $('.nav__menu');
  var menu = $('#mobile-menu');
  if (menuBtn && menu) {
    var setOpen = function (open) {
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
      menu.hidden = !open;
    };
    menuBtn.addEventListener('click', function () {
      setOpen(menu.hidden);
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    window.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    onScroll(function () {
      if (!menu.hidden) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------------ */
  /*  Anno, versione, torna su                                                 */
  /* ------------------------------------------------------------------------ */

  $$('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
  $$('[data-version]').forEach(function (el) {
    if (config.version) el.textContent = config.version;
  });

  var toTop = $('[data-to-top]');
  if (toTop) {
    var bar = $('.bar', toTop);
    toTop.addEventListener('click', scrollToTop);
    onScroll(function (s) {
      toTop.classList.toggle('is-visible', s.scroll > 480);
      if (bar) bar.style.strokeDashoffset = String(100 - s.progress * 100);
    });
  }

  emit();

  window.Ari = {
    lenis: lenis,
    reduce: reduce,
    onScroll: onScroll,
    scrollToEl: scrollToEl,
    reveal: reveal,
    util: {
      $: $,
      $$: $$,
      clamp: clamp,
      pad: pad,
      cssVar: cssVar,
      escapeHtml: escapeHtml,
      trackVisibility: trackVisibility,
    },
  };
})();
