/* La carte du monde en points, et le trajet Los Angeles → Abu Dhabi → Berlin → Paris.
   Tout l'état de la carte découle d'un seul nombre, la progression (0 → 1) :
   le défilement la pilote, on peut donc avancer et reculer librement. */
(function () {
  'use strict';

  var C = 10;                 // taille d'une case de la grille, en unités du viewBox
  var FLY = 0.55;             // part de chaque étape consacrée au vol
  var NS = 'http://www.w3.org/2000/svg';
  // Où poser l'étiquette de chaque ville (en pixels à l'écran) pour qu'elles ne se chevauchent pas.
  // dy : ligne de base du code (LAX…) ; le nom de la ville est LINE pixels plus bas.
  var LABELS = {
    LAX: { dx: 9, dy: -19, anchor: 'start' },
    AUH: { dx: 0, dy: 20, anchor: 'middle' },
    BER: { dx: 9, dy: -19, anchor: 'start' },
    PAR: { dx: -9, dy: 19, anchor: 'end' }
  };
  var LINE = 12.5;            // écart entre le code et le nom de la ville, en pixels
  var DOT = 3.4;              // rayon d'une ville, en pixels

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

  // Arc de grand cercle stylisé : une courbe de Bézier toujours bombée vers le haut.
  function arc(a, b) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = dy / d, ny = -dx / d;
    if (ny > 0) { nx = -nx; ny = -ny; }
    var h = Math.max(30, d * 0.3);
    return 'M' + a[0] + ' ' + a[1] + 'Q' + (mx + nx * h).toFixed(1) + ' ' + (my + ny * h).toFixed(1) + ' ' + b[0] + ' ' + b[1];
  }

  // opts : { host, places, label, onUpdate(index, year, flying) }
  window.WorldMap = function (opts) {
    var D = window.WORLD_DOTS;
    if (!D || !opts.host) return null;
    var places = opts.places;
    var W = D.cols * C, H = D.rows * C;
    function proj(lat, lon) {
      return [+((lon - D.lon0) / D.step * C).toFixed(1), +((D.lat0 - lat) / D.step * C + C / 2).toFixed(1)];
    }
    var pts = places.map(function (p) { return proj(p.lat, p.lon); });

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': opts.label || '' });
    opts.host.appendChild(svg);

    // Les points : un seul chemin, un segment de longueur nulle par point.
    var base = [], glow = places.map(function () { return []; });
    var RG2 = 72 * 72;
    D.runs.forEach(function (runs, r) {
      var off = r % 2 ? C / 2 : 0, y = r * C + C / 2;
      for (var i = 0; i < runs.length; i += 2) {
        for (var c = runs[i]; c < runs[i] + runs[i + 1]; c++) {
          var x = c * C + off + C / 2, seg = 'M' + x + ' ' + y + 'h0';
          var near = -1;
          for (var k = 0; k < pts.length; k++) {
            var ddx = x - pts[k][0], ddy = y - pts[k][1];
            if (ddx * ddx + ddy * ddy < RG2) { near = k; break; }
          }
          if (near < 0) base.push(seg); else glow[near].push(seg);
        }
      }
    });
    el('path', { class: 'map__dots', d: base.join('') + glow.map(function (g) { return g.join(''); }).join(''), 'stroke-width': 3.6 }, svg);
    var glowEls = glow.map(function (g) { return el('path', { class: 'map__glow', d: g.join(''), 'stroke-width': 4.4 }, svg); });

    var arcsD = [];
    for (var i = 1; i < pts.length; i++) arcsD.push(arc(pts[i - 1], pts[i]));
    el('path', { class: 'map__trail', d: arcsD.join('') }, svg);
    var arcEls = arcsD.map(function (d) { return el('path', { class: 'map__arc', d: d }, svg); });
    var arcLen = arcEls.map(function (a) {
      var L = a.getTotalLength();
      a.style.strokeDasharray = L + ' ' + L;
      a.style.strokeDashoffset = L;
      return L;
    });

    var marks = [];
    var cityEls = places.map(function (p, k) {
      var g = el('g', { class: 'map__city', transform: 'translate(' + pts[k][0] + ' ' + pts[k][1] + ')' }, svg);
      var lab = LABELS[p.code] || LABELS.LAX;
      marks.push({
        ring: el('circle', { class: 'ring', r: 7 }, g),
        core: el('circle', { class: 'core', r: 6.5 }, g),
        code: el('text', { 'text-anchor': lab.anchor }, g),
        city: el('text', { class: 'sub', 'text-anchor': lab.anchor }, g),
        lab: lab
      });
      marks[k].code.textContent = p.code;
      marks[k].city.textContent = p.city;
      return g;
    });

    var halo = el('circle', { class: 'map__plane-halo', r: 20, cx: pts[0][0], cy: pts[0][1] }, svg);
    var plane = el('circle', { class: 'map__plane', r: 6.5, cx: pts[0][0], cy: pts[0][1] }, svg);

    // Sur petit écran, on recadre sur la zone du trajet pour garder des points lisibles.
    // Les étiquettes gardent une taille fixe à l'écran, quel que soit le zoom de la carte.
    function frame() {
      var narrow = window.matchMedia('(max-width: 720px)').matches;
      var vbW = narrow ? 1260 : W;
      svg.setAttribute('viewBox', narrow ? '190 40 1260 470' : '0 0 ' + W + ' ' + H);
      var k = (svg.getBoundingClientRect().width || vbW) / vbW;
      function u(px) { return +(px / k).toFixed(1); }
      svg.style.setProperty('--fs-code', u(12) + 'px');
      svg.style.setProperty('--fs-sub', u(9.5) + 'px');
      marks.forEach(function (m) {
        m.core.setAttribute('r', u(DOT));
        m.ring.setAttribute('r', u(DOT));
        m.code.setAttribute('x', u(m.lab.dx)); m.code.setAttribute('y', u(m.lab.dy));
        m.city.setAttribute('x', u(m.lab.dx)); m.city.setAttribute('y', u(m.lab.dy + LINE));
      });
      plane.setAttribute('r', u(DOT + 0.6));
      halo.setAttribute('r', u(11));
    }
    frame();
    window.addEventListener('resize', frame);

    var thisYear = new Date().getFullYear();
    function endYear(p) { return p.to || thisYear; }

    function render(p) {
      p = clamp(p);
      var n = places.length;
      var s = Math.min(p * n, n - 1e-6);
      var idx = Math.floor(s), f = s - idx;
      var flying = idx > 0 && f < FLY;
      var at = flying ? idx - 1 : idx;      // dernière ville atteinte

      for (var k = 0; k < arcEls.length; k++) {
        var q = k + 1 < idx ? 1 : k + 1 > idx ? 0 : clamp(f / FLY);
        arcEls[k].style.strokeDashoffset = (1 - ease(q)) * arcLen[k];
      }

      var pos, year;
      if (flying) {
        var qf = ease(clamp(f / FLY));
        var pt = arcEls[idx - 1].getPointAtLength(qf * arcLen[idx - 1]);
        pos = [pt.x, pt.y];
        year = endYear(places[idx - 1]) + (places[idx].from - endYear(places[idx - 1])) * qf;
      } else {
        var dwell = idx === 0 ? clamp(f / 0.9) : clamp((f - FLY) / (1 - FLY) / 0.9);
        pos = pts[idx];
        year = places[idx].from + (endYear(places[idx]) - places[idx].from) * dwell;
      }
      plane.setAttribute('cx', pos[0]); plane.setAttribute('cy', pos[1]);
      halo.setAttribute('cx', pos[0]); halo.setAttribute('cy', pos[1]);

      cityEls.forEach(function (g, k) { g.classList.toggle('is-on', k <= at); });
      glowEls.forEach(function (g, k) { g.classList.toggle('is-on', k <= at); });
      // idx : la ville visée (ou celle où l'on est), at : la dernière ville atteinte.
      if (opts.onUpdate) opts.onUpdate(idx, year, flying, at);
    }

    render(0);
    return { render: render };
  };
})();
