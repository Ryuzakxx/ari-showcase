// Homepage: Ari nell'angolo dello schermo d'esempio (canvas), sottotitoli, timer e schermo che si raddrizza.
(function () {
  'use strict';
  var Ari = window.Ari;
  if (!Ari) return;
  var u = Ari.util;

  var screen = u.$('[data-screen]');
  if (!screen) return;

  initTilt();
  initClockAndTimer();
  initAvatar();

  /* ------------------------------------------------------------------------ */
  /*  Lo schermo parte inclinato e si raddrizza mentre scorri (con Lenis)      */
  /* ------------------------------------------------------------------------ */

  function initTilt() {
    var stage = u.$('[data-stage]');
    if (!stage || Ari.reduce) return;
    var update = function () {
      var rect = stage.getBoundingClientRect();
      var vh = window.innerHeight;
      var t = u.clamp((vh - rect.top) / (vh * 0.75));
      screen.style.setProperty('--tilt', (16 * (1 - t)).toFixed(2) + 'deg');
    };
    Ari.onScroll(update);
    update();
  }

  /* ------------------------------------------------------------------------ */
  /*  Orologio nella barra e timer della pasta che scende davvero              */
  /* ------------------------------------------------------------------------ */

  function initClockAndTimer() {
    var clock = u.$('[data-clock]', screen);
    var timer = u.$('[data-timer]', screen);
    var left = 9 * 60 + 42;
    var tick = function () {
      var d = new Date();
      if (clock) clock.textContent = u.pad(d.getHours()) + ':' + u.pad(d.getMinutes());
      if (timer) {
        left = left > 0 ? left - 1 : 10 * 60;
        timer.textContent = u.pad(Math.floor(left / 60)) + ':' + u.pad(left % 60);
      }
    };
    tick();
    if (!Ari.reduce) setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------------ */
  /*  Avatar: anello equalizzatore + occhi del robottino                       */
  /*  Recita in loop una piccola conversazione: ascolta, pensa, parla.         */
  /* ------------------------------------------------------------------------ */

  function initAvatar() {
    var widget = u.$('[data-avatar-widget]', screen);
    var canvas = u.$('[data-avatar]', screen);
    if (!widget || !canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
    var stateLabel = u.$('[data-avatar-state]', screen);
    var lines = { user: u.$('[data-line="user"]', screen), ari: u.$('[data-line="ari"]', screen) };

    var SCRIPT = [
      { user: 'Ehi Ari, che tempo fa domani a Milano?', ari: 'Domani a Milano 19 gradi e sole, qualche nuvola in serata.' },
      { user: 'Metti un timer di 10 minuti per la pasta.', ari: 'Fatto. Timer della pasta: 10 minuti.' },
      { user: 'Ricordati che il mio compleanno è il 12 maggio.', ari: 'Segnato. Il 12 maggio non me lo scordo.' },
      { user: 'Can we speak English for a bit?', ari: 'Sure! What would you like to talk about?' },
      { user: 'Cosa sta suonando?', ari: 'Blinding Lights, dei The Weeknd. Alzo il volume?' },
    ];
    var LABELS = { idle: 'In attesa', listening: 'In ascolto', thinking: 'Sta pensando', speaking: 'Sta parlando' };
    var TARGETS = {
      idle: { amp: 0, arc: 0, eyes: 1, dots: 0, mouth: 0, look: 1 },
      listening: { amp: 0.45, arc: 0, eyes: 1.2, dots: 0, mouth: 0, look: 0 },
      thinking: { amp: 0, arc: 1, eyes: 0, dots: 1, mouth: 0, look: 0 },
      speaking: { amp: 1, arc: 0, eyes: 1, dots: 0, mouth: 1, look: 0 },
    };
    var TAU = Math.PI * 2;

    var hexToRgb = function (hex) {
      var n = parseInt(hex.replace('#', ''), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };
    var rgb = function (c, a) {
      return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a === undefined ? 1 : a) + ')';
    };
    var mix = function (a, b, t) {
      return a.map(function (v, i) {
        return v + (b[i] - v) * t;
      });
    };

    var C = {
      fg: hexToRgb(u.cssVar('--fg') || '#eef0fb'),
      dim: hexToRgb(u.cssVar('--fg-3') || '#737b9e'),
      blue: hexToRgb(u.cssVar('--blue-2') || '#8aa8ff'),
      purple: hexToRgb(u.cssVar('--purple-2') || '#bba1ff'),
      violet: hexToRgb(u.cssVar('--purple') || '#8b5cf6'),
      ring: [70, 78, 112],
    };
    var STATE_COLOR = { idle: C.dim, listening: C.blue, thinking: C.dim, speaking: C.purple };

    // Fasi della conversazione
    var phases = [];
    SCRIPT.forEach(function (line) {
      phases.push({ state: 'idle', duration: 1200, clear: true });
      phases.push({ state: 'listening', duration: line.user.length * 42 + 700, type: 'user', text: line.user });
      phases.push({ state: 'thinking', duration: 1100 });
      phases.push({ state: 'speaking', duration: line.ari.length * 48 + 1200, type: 'ari', text: line.ari });
      phases.push({ state: 'idle', duration: 1800 });
    });

    var cur = Object.assign({}, TARGETS.idle, { color: C.dim.slice() });
    var state = 'idle';
    var size = { w: 0, h: 0, dpr: 1 };
    var phaseIndex = 0;
    var phaseStart = 0;
    var running = false;
    var visible = false;
    var raf = 0;
    var last = 0;
    var nextBlink = 2000;

    var setLine = function (key, text, typing) {
      var el = lines[key];
      if (!el) return;
      u.$('.txt', el).textContent = text;
      el.classList.toggle('is-empty', !text);
      el.classList.toggle('is-typing', !!typing);
    };

    var setState = function (next) {
      state = next;
      screen.setAttribute('data-state', next);
      if (stateLabel) stateLabel.textContent = LABELS[next];
    };

    var enterPhase = function (index, now) {
      phaseIndex = index % phases.length;
      phaseStart = now;
      var phase = phases[phaseIndex];
      setState(phase.state);
      if (phase.clear) {
        setLine('user', '');
        setLine('ari', '');
      }
    };

    var updateScript = function (now) {
      var phase = phases[phaseIndex];
      var elapsed = now - phaseStart;
      if (phase.type) {
        var chars = Math.min(phase.text.length, Math.floor((elapsed / (phase.duration - 600)) * phase.text.length));
        setLine(phase.type, phase.text.slice(0, chars), chars < phase.text.length);
      }
      if (elapsed >= phase.duration) enterPhase(phaseIndex + 1, now);
    };

    var noise = function (phi, s) {
      var v = 0.5 + 0.5 * (0.5 * Math.sin(3 * phi + s * 5.3) + 0.3 * Math.sin(5 * phi - s * 7.9 + 1.3) + 0.2 * Math.sin(11 * phi + s * 12.1));
      return v * v;
    };

    var draw = function (now) {
      var w = size.w;
      var h = size.h;
      if (!w || !h) return;
      var s = now / 1000;
      ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      var cx = w / 2;
      var cy = h / 2 + h * 0.04;
      var S = Math.min(w, h);
      var R = S * 0.22;
      var maxLen = S * 0.15;
      var minLen = S * 0.012;
      var ringR = R + maxLen + S * 0.04;

      // Anello esterno con tacche
      ctx.lineWidth = 1;
      ctx.strokeStyle = rgb(C.ring, 0.8);
      ctx.beginPath();
      ctx.arc(cx, cy, ringR, 0, TAU);
      ctx.stroke();
      for (var k = 0; k < 48; k++) {
        var a = (k / 48) * TAU + s * 0.05;
        var major = k % 6 === 0;
        var len = major ? S * 0.03 : S * 0.014;
        ctx.strokeStyle = rgb(major ? C.dim : C.ring, major ? 0.9 : 0.8);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * ringR, cy + Math.sin(a) * ringR);
        ctx.lineTo(cx + Math.cos(a) * (ringR + len), cy + Math.sin(a) * (ringR + len));
        ctx.stroke();
      }

      // Barre dell'equalizzatore
      var envSpeak = 0.3 + 0.7 * Math.pow(Math.abs(Math.sin(s * 6.2) * Math.sin(s * 2.3 + 0.7)), 0.6);
      var envListen = 0.25 + 0.75 * Math.abs(Math.sin(s * 5.1) * Math.sin(s * 1.7 + 0.4));
      var env = state === 'speaking' ? envSpeak : envListen;
      var arcAngle = s * 2.6;
      var N = 64;
      ctx.lineWidth = Math.max(1.6, S * 0.012);
      ctx.lineCap = 'round';
      for (var i = 0; i < N; i++) {
        var theta = (i / N) * TAU - Math.PI / 2;
        var phi = Math.abs(((theta + Math.PI / 2 + Math.PI) % TAU) - Math.PI);
        var breath = 0.5 + 0.5 * Math.sin(s * 1.3 + phi * 3);
        var l = minLen + maxLen * (0.06 * breath + cur.amp * noise(phi, s) * env);
        var d = Math.abs((((theta - arcAngle) % TAU) + TAU) % TAU);
        d = Math.min(d, TAU - d);
        var boost = Math.exp(-(d * d) / (2 * 0.2 * 0.2)) * cur.arc;
        l += maxLen * 0.45 * boost;
        var alpha = 0.55 + 0.45 * Math.min(1, cur.amp + boost);
        ctx.strokeStyle = rgb(boost > 0.05 ? mix(cur.color, C.violet, boost) : cur.color, alpha);
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(theta) * R, cy + Math.sin(theta) * R);
        ctx.lineTo(cx + Math.cos(theta) * (R + l), cy + Math.sin(theta) * (R + l));
        ctx.stroke();
      }

      // Occhi
      var blink = 1;
      if (now > nextBlink) {
        if (now - nextBlink < 150) blink = 0.12;
        else nextBlink = now + 2600 + Math.random() * 2600;
      }
      var lookX = Math.sin(s * 0.6) * R * 0.1 * cur.look;
      var lookY = Math.cos(s * 0.45) * R * 0.05 * cur.look;
      var eyeW = R * 0.16;
      var eyeH = R * 0.46 * Math.max(cur.eyes, 0.0001) * blink;
      var gap = R * 0.42;
      ctx.fillStyle = rgb(C.fg, Math.min(1, cur.eyes));
      [-1, 1].forEach(function (dir) {
        roundRect(cx + (dir * gap) / 2 - eyeW / 2 + lookX, cy - R * 0.1 + lookY - eyeH / 2, eyeW, eyeH, eyeW / 2);
      });

      // Tre puntini mentre pensa
      if (cur.dots > 0.01) {
        for (var k2 = 0; k2 < 3; k2++) {
          var da = 0.25 + 0.75 * Math.max(0, Math.sin(s * 6 - k2 * 0.9));
          ctx.fillStyle = rgb(C.fg, da * cur.dots);
          ctx.beginPath();
          ctx.arc(cx + (k2 - 1) * R * 0.3, cy, R * 0.07, 0, TAU);
          ctx.fill();
        }
      }

      // Bocca che segue la voce
      if (cur.mouth > 0.01) {
        var mw = R * 0.34;
        var mh = R * 0.04 + R * 0.14 * envSpeak * cur.mouth;
        ctx.fillStyle = rgb(C.purple, cur.mouth);
        roundRect(cx - mw / 2, cy + R * 0.32 - mh / 2, mw, mh, Math.min(mh, mw) / 2);
      }
    };

    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
      else ctx.rect(x, y, w, h);
      ctx.fill();
    }

    var resize = function () {
      var rect = canvas.getBoundingClientRect();
      size.dpr = Math.min(window.devicePixelRatio || 1, 2);
      size.w = rect.width;
      size.h = rect.height;
      canvas.width = Math.max(1, Math.round(rect.width * size.dpr));
      canvas.height = Math.max(1, Math.round(rect.height * size.dpr));
      if (!running) draw(performance.now());
    };

    var step = function (now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      updateScript(now);
      var target = TARGETS[state];
      var k = 1 - Math.exp(-dt * 6);
      Object.keys(target).forEach(function (key) {
        cur[key] += (target[key] - cur[key]) * k;
      });
      cur.color = mix(cur.color, STATE_COLOR[state], k);
      draw(now);
      raf = requestAnimationFrame(step);
    };

    var play = function () {
      if (running || !visible || document.hidden) return;
      running = true;
      var now = performance.now();
      phaseStart += now - (last || now);
      last = now;
      raf = requestAnimationFrame(step);
    };
    var pause = function () {
      running = false;
      cancelAnimationFrame(raf);
    };

    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize', resize);
    resize();

    if (Ari.reduce) {
      // Un solo fotogramma: Ari che risponde alla prima domanda.
      setState('speaking');
      Object.assign(cur, TARGETS.speaking, { color: C.purple });
      setLine('user', SCRIPT[0].user);
      setLine('ari', SCRIPT[0].ari);
      draw(performance.now());
      return;
    }

    enterPhase(0, performance.now());
    u.trackVisibility(screen, function (isVisible) {
      visible = isVisible;
      if (visible) play();
      else pause();
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause();
      else play();
    });
  }
})();
