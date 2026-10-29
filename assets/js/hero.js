/* L'accueil : le nom se compose de milliers de points de données.
   Au chargement, ils partent d'un nuage de points (un « scatter plot »)
   et rejoignent les lettres ; ensuite ils fuient le curseur, s'allument
   en vert quand on les dérange, et se dispersent quand on fait défiler. */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  var INTRO = 1150;                 // ms : trajet d'un point jusqu'à sa lettre
  var SPRING = 0.055;               // rappel vers la lettre
  var FRICTION = 0.84;
  var ALPHAS = [0.42, 0.68, 1];     // trois profondeurs de points

  function gauss() {
    var u = 1 - Math.random(), v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  }
  function easeOut(x) { return 1 - Math.pow(1 - x, 4); }

  // hero : la section ; canvas : le fond ; nameEl : le <h1>, une lettre par .ch
  window.HeroParticles = function (hero, canvas, nameEl) {
    var ctx = canvas.getContext && canvas.getContext('2d');
    if (!ctx) return null;

    var W = 0, H = 0, N = 0, dpr = 1;
    var X, Y, VX, VY, TX, TY, SX, SY, S, G, PH, DL, DX, DY, HOT;
    var colors = { ink: '#EEF0F3', acc: '#C4F25C', muted: '#7E8591' };
    var mouse = { x: -1e4, y: -1e4, on: false, touch: false };
    var scrollP = 0;
    var introAt = 0, introDone = false;
    var raf = 0, last = 0, visible = true, running = false;

    function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    function readColors() {
      colors.ink = css('--ink') || colors.ink;
      colors.acc = css('--acc-ink') || colors.acc;
      colors.muted = css('--muted') || colors.muted;
    }

    // Les lettres sont dessinées hors écran exactement là où le navigateur
    // les a placées, puis relues pixel par pixel pour trouver les cibles.
    // On lit les positions de mise en page (offset*), qui ignorent les
    // transformations : les lettres sont encore décalées par leur animation d'entrée.
    function sampleTargets() {
      var cs = getComputedStyle(nameEl);
      var fs = parseFloat(cs.fontSize);
      var nw = nameEl.offsetWidth, nh = nameEl.offsetHeight;
      if (!nw || !fs) return null;
      var hx = 0, hy = 0;
      for (var n = nameEl.offsetParent; n && n !== hero; n = n.offsetParent) { hx += n.offsetLeft; hy += n.offsetTop; }

      var pad = Math.ceil(fs * 0.35);
      var ow = Math.ceil(nw + pad * 2), oh = Math.ceil(nh + pad * 2);
      var off = document.createElement('canvas');
      off.width = ow; off.height = oh;
      var o = off.getContext('2d', { willReadFrequently: true });
      o.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + fs + 'px ' + cs.fontFamily;
      o.textBaseline = 'alphabetic';
      o.fillStyle = '#fff';
      var m = o.measureText('M');
      var A = m.fontBoundingBoxAscent, D = m.fontBoundingBoxDescent;
      if (!(A > 0)) { A = fs * 0.93; D = fs * 0.27; }

      var chars = nameEl.querySelectorAll('.ch');
      for (var i = 0; i < chars.length; i++) {
        var c = chars[i];
        // Dans une boîte inline-block, la ligne de base suit le demi-interlignage.
        var top = c.offsetTop - nameEl.offsetTop;
        var base = top + (c.offsetHeight - (A + D)) / 2 + A;
        o.fillText(c.textContent.toLocaleUpperCase(), c.offsetLeft - nameEl.offsetLeft + pad, base + pad);
      }

      var data = o.getImageData(0, 0, ow, oh).data;
      var filled = 0;
      for (var p = 3; p < data.length; p += 16) if (data[p] > 128) filled++;
      filled *= 4;
      var want = W < 700 ? 1150 : W < 1200 ? 2000 : 2700;
      var gap = Math.max(2, Math.min(10, Math.round(Math.sqrt(filled / want))));

      var pts = [];
      var ox = hx + nameEl.offsetLeft - pad, oy = hy + nameEl.offsetTop - pad;
      for (var y = 0, row = 0; y < oh; y += gap, row++) {
        for (var x = row % 2 ? gap / 2 : 0; x < ow; x += gap) {
          if (data[(y * ow + (x | 0)) * 4 + 3] > 128) pts.push(ox + x, oy + y);
        }
      }
      return { pts: pts, gap: gap };
    }

    function alloc(n) {
      X = new Float32Array(n); Y = new Float32Array(n); VX = new Float32Array(n); VY = new Float32Array(n);
      TX = new Float32Array(n); TY = new Float32Array(n); SX = new Float32Array(n); SY = new Float32Array(n);
      S = new Float32Array(n); PH = new Float32Array(n); DL = new Float32Array(n); DX = new Float32Array(n); DY = new Float32Array(n);
      G = new Uint8Array(n); HOT = new Uint8Array(n);
    }

    function size() {
      var r = hero.getBoundingClientRect();
      W = r.width; H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // keep = on garde les positions actuelles (redimensionnement), sinon intro.
    function build(keep) {
      size();
      var s = sampleTargets();
      if (!s || !s.pts.length) return false;
      var oldX = X, oldY = Y, oldN = N;
      N = s.pts.length / 2;
      alloc(N);
      for (var i = 0; i < N; i++) {
        TX[i] = s.pts[2 * i] + (Math.random() - 0.5) * s.gap * 0.3;
        TY[i] = s.pts[2 * i + 1] + (Math.random() - 0.5) * s.gap * 0.3;
        S[i] = Math.max(0.9, s.gap * (0.2 + Math.random() * 0.13));
        G[i] = (Math.random() < 0.09 ? 3 : 0) + ((Math.random() * 3) | 0);
        PH[i] = Math.random() * TAU;
        var a = Math.random() * TAU;
        DX[i] = Math.cos(a); DY[i] = Math.sin(a) - 0.55;
        if (keep) {
          X[i] = i < oldN ? oldX[i] : TX[i];
          Y[i] = i < oldN ? oldY[i] : TY[i];
        } else {
          // Départ : un nuage de points corrélé, comme un graphique de dispersion.
          var u = Math.random();
          SX[i] = u * W;
          SY[i] = H * (0.84 - 0.6 * u) + gauss() * H * 0.1;
          X[i] = SX[i]; Y[i] = SY[i];
          DL[i] = (TX[i] / W) * 520 + Math.random() * 380;
        }
      }
      if (!keep) { introAt = performance.now(); introDone = false; }
      return true;
    }

    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = Math.min(48, now - (last || now));
      last = now;
      var k = dt / 16.667;
      var damp = Math.pow(FRICTION, k);
      var t = now - introAt;
      var spread = scrollP * scrollP * Math.max(W, H) * 0.55;
      var R = Math.max(80, Math.min(150, W * 0.085)), R2 = R * R;
      var mx = mouse.x, my = mouse.y, mon = mouse.on;
      var allDone = true;

      for (var i = 0; i < N; i++) {
        var tx = TX[i] + DX[i] * spread + Math.sin(now * 0.0011 + PH[i]) * 0.7;
        var ty = TY[i] + DY[i] * spread + Math.cos(now * 0.0009 + PH[i]) * 0.7;

        if (!introDone) {
          var q = (t - DL[i]) / INTRO;
          if (q < 1) {
            allDone = false;
            q = q < 0 ? 0 : easeOut(q);
            X[i] = SX[i] + (tx - SX[i]) * q;
            Y[i] = SY[i] + (ty - SY[i]) * q;
            HOT[i] = q > 0 && q < 0.85 ? 1 : 0;
            continue;
          }
        }

        VX[i] += (tx - X[i]) * SPRING * k;
        VY[i] += (ty - Y[i]) * SPRING * k;
        if (mon) {
          var dx = X[i] - mx, dy = Y[i] - my, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            var d = Math.sqrt(d2), f = (1 - d / R) * 2.4 * k;
            VX[i] += (dx / d) * f;
            VY[i] += (dy / d) * f;
          }
        }
        VX[i] *= damp; VY[i] *= damp;
        X[i] += VX[i] * k; Y[i] += VY[i] * k;
        var ex = X[i] - tx, ey = Y[i] - ty;
        HOT[i] = ex * ex + ey * ey > 30 ? 1 : 0;
      }
      if (!introDone && allDone) introDone = true;

      draw(now);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var fade = Math.max(0, 1 - scrollP * 1.25);
      if (fade <= 0) return;

      for (var g = 0; g < 6; g++) {
        ctx.globalAlpha = ALPHAS[g % 3] * fade;
        ctx.fillStyle = g < 3 ? colors.ink : colors.acc;
        ctx.beginPath();
        for (var i = 0; i < N; i++) {
          if (G[i] !== g || HOT[i]) continue;
          ctx.moveTo(X[i] + S[i], Y[i]);
          ctx.arc(X[i], Y[i], S[i], 0, TAU);
        }
        ctx.fill();
      }
      // Les points dérangés s'allument.
      ctx.globalAlpha = fade;
      ctx.fillStyle = colors.acc;
      ctx.beginPath();
      for (var j = 0; j < N; j++) {
        if (!HOT[j]) continue;
        ctx.moveTo(X[j] + S[j] * 1.15, Y[j]);
        ctx.arc(X[j], Y[j], S[j] * 1.15, 0, TAU);
      }
      ctx.fill();

      // Le réticule, comme le curseur d'un graphique.
      if (mouse.on && !mouse.touch && scrollP < 0.35) {
        var a = (1 - scrollP / 0.35);
        ctx.save();
        ctx.globalAlpha = 0.45 * a;
        ctx.strokeStyle = colors.muted;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);
        ctx.beginPath();
        ctx.moveTo(Math.round(mouse.x) + 0.5, 0); ctx.lineTo(Math.round(mouse.x) + 0.5, H);
        ctx.moveTo(0, Math.round(mouse.y) + 0.5); ctx.lineTo(W, Math.round(mouse.y) + 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.95 * a;
        ctx.strokeStyle = colors.acc;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 5, 0, TAU);
        ctx.stroke();
        ctx.font = '500 11px "Geist Mono", ui-monospace, monospace';
        ctx.fillStyle = colors.muted;
        var label = 'x ' + (mouse.x / W).toFixed(2) + '   y ' + (1 - mouse.y / H).toFixed(2);
        var lx = mouse.x + 14, ly = mouse.y - 14;
        if (lx + 120 > W) lx = mouse.x - 134;
        if (ly < 16) ly = mouse.y + 24;
        ctx.fillText(label, lx, ly);
        ctx.restore();
      }
    }

    function loop(on) {
      if (on && !raf && running && visible) { last = 0; raf = requestAnimationFrame(frame); }
      if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    function point(e) {
      var r = hero.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.on = true;
      mouse.touch = e.pointerType === 'touch';
    }
    hero.addEventListener('pointermove', point, { passive: true });
    hero.addEventListener('pointerdown', point, { passive: true });
    hero.addEventListener('pointerleave', function () { mouse.on = false; });
    hero.addEventListener('pointerup', function (e) { if (e.pointerType === 'touch') mouse.on = false; });
    hero.addEventListener('pointercancel', function () { mouse.on = false; });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        loop(visible);
      }).observe(hero);
    }
    document.addEventListener('visibilitychange', function () { loop(!document.hidden); });

    var resizeT = 0, lastW = 0;
    window.addEventListener('resize', function () {
      clearTimeout(resizeT);
      resizeT = setTimeout(function () {
        // Sur mobile, la barre d'adresse change la hauteur : on ne reconstruit que si la largeur bouge.
        var w = hero.getBoundingClientRect().width;
        if (Math.abs(w - lastW) < 2 && N) { size(); return; }
        lastW = w;
        build(true);
      }, 180);
    });

    return {
      start: function () {
        readColors();
        lastW = hero.getBoundingClientRect().width;
        if (!build(false)) return false;
        running = true;
        loop(true);
        return true;
      },
      setScroll: function (p) { scrollP = p; },
      colors: readColors,
      rebuild: function () { build(true); }
    };
  };
})();
