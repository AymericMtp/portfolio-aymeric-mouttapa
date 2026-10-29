/* Le site : rendu des sections depuis content.js, langue, thème, navigation et mouvement.
   Le texte vit dans content.js ; ici, uniquement la mise en forme et le comportement. */
(function () {
  'use strict';

  var C = window.CONTENT;
  if (!C) return;

  var doc = document;
  var root = doc.documentElement;
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var NOW = new Date();
  var lang = root.lang === 'en' ? 'en' : 'fr';
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  var lenis = null, particles = null, worldMap = null, sql = null;
  var refreshers = [];       // rappelées après un changement de langue
  var relayouts = [];        // rappelées quand la mise en page bouge

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Outils ---------- */
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, C); }
  function t(v) {
    if (v == null) return '';
    if (typeof v === 'object') return v[lang] != null ? v[lang] : (v.fr != null ? v.fr : '');
    return String(v);
  }
  // Typographie française : espaces insécables avant : ; ! ?
  function typo(s) {
    if (lang !== 'fr') return s;
    return s.replace(/ ([:;!?])/g, function (m, p) { return (p === ':' ? ' ' : ' ') + p; });
  }
  function fmt(v) { return typo(esc(t(v))).replace(/\*(.+?)\*/g, '<em>$1</em>'); }
  function plain(v) { return t(v).replace(/\*/g, ''); }
  // Un texte traduisible : l'élément garde le chemin de sa source pour la bascule de langue.
  function T(path, tag, cls, attrs) {
    tag = tag || 'span';
    return '<' + tag + (cls ? ' class="' + cls + '"' : '') + ' data-i18n="' + path + '"' + (attrs || '') + '>' + fmt(get(path)) + '</' + tag + '>';
  }
  function store(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } }
  function stored(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function debounce(fn, ms) { var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); }; }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function locale() { return lang === 'fr' ? 'fr-FR' : 'en-US'; }

  var ICON = {
    arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M8 7h9v9"/></svg>',
    right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6.5A2.5 2.5 0 0 1 7.5 4H15"/></svg>',
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
  };

  /* ---------- Dates ---------- */
  function ym(s) { if (!s) return NOW; var p = String(s).split('-'); return new Date(+p[0], (+p[1] || 1) - 1, 1); }
  function fmtYM(s) {
    if (!s) return t(C.ui.today);
    return new Intl.DateTimeFormat(locale(), { month: 'short', year: 'numeric' }).format(ym(s));
  }
  function range(a, b) { return fmtYM(a) + ' → ' + (b ? fmtYM(b) : t(C.ui.today)); }
  function monthsBetween(a, b) {
    var A = ym(a), B = b ? ym(b) : NOW;
    return Math.max(0, (B.getFullYear() - A.getFullYear()) * 12 + B.getMonth() - A.getMonth());
  }
  function dur(a, b) {
    var m = monthsBetween(a, b), y = Math.floor(m / 12), r = m % 12, U = C.ui, out = [];
    if (y) out.push(y + ' ' + t(y > 1 ? U.years : U.year));
    if (r) out.push(r + ' ' + t(r > 1 ? U.months : U.month));
    return out.join(' ') || ('< 1 ' + t(U.month));
  }
  function workYears() {
    var m = monthsBetween(C.person.workSince, null);
    return { n: Math.floor(m / 12), plus: m % 12 > 0 };
  }
  function num(v, dec) {
    return new Intl.NumberFormat(locale(), { minimumFractionDigits: dec || 0, maximumFractionDigits: dec || 0 }).format(v);
  }

  /* ---------- Découpage du texte pour les animations ---------- */
  // Chaque mot dans un masque ; la ponctuation collée reste avec son mot.
  function splitWords(el) {
    var tokens = [], glue = false;
    (function walk(node, open, close) {
      Array.prototype.forEach.call(node.childNodes, function (n) {
        if (n.nodeType === 3) {
          n.nodeValue.split(/([ \t\n\r]+)/).forEach(function (p) {
            if (!p) return;
            if (/^[ \t\n\r]+$/.test(p)) { glue = false; return; }
            var h = open + esc(p) + close;
            if (glue && tokens.length) tokens[tokens.length - 1] += h; else tokens.push(h);
            glue = true;
          });
        } else if (n.nodeType === 1) {
          var tag = n.tagName.toLowerCase();
          walk(n, open + '<' + tag + '>', '</' + tag + '>' + close);
        }
      });
    })(el, '', '');
    el.innerHTML = tokens.map(function (h, i) {
      return '<span class="w"><span style="--i:' + i + '">' + h + '</span></span>';
    }).join(' ');
  }
  function splitStatement(el) {
    if (el.querySelector('.sw')) return;
    el.innerHTML = el.innerHTML.split(/ (?![^<]*>)/).map(function (w) { return '<span class="sw">' + w + '</span>'; }).join(' ');
  }

  /* ---------- Blocs communs ---------- */
  function head(n, key) {
    var o = get(key);
    return '<div class="sec-head">' +
      '<p class="sec-label"><b>--</b> ' + n + ' · ' + T(key + '.label') + '</p>' +
      (o.title ? T(key + '.title', 'h2', 'sec-title', ' data-split') : '') +
      (o.intro ? T(key + '.intro', 'p', 'sec-intro rv') : '') +
      '</div>';
  }
  function chips(list, base, cls) {
    return '<div class="chips">' + list.map(function (x, k) { return T(base + '.' + k, 'span', 'chip' + (cls ? ' ' + cls : '')); }).join('') + '</div>';
  }
  function domain(href) { return href.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''); }
  function linkHtml(l) {
    // Un site s'affiche par son adresse (hemi-app.fr), les autres liens par leur nature.
    var text = l.type === 'site' ? esc(domain(l.href)) : T({ code: 'ui.code', app: 'ui.app', pdf: 'ui.pdf' }[l.type] || 'ui.view');
    return '<a class="link-arrow" href="' + esc(l.href) + '" target="_blank" rel="noopener">' + text + ICON.arrow + '</a>';
  }

  /* ---------- 01 · Profil ---------- */
  function vizSvg(kind) {
    var s = '<svg class="kpi__viz" viewBox="0 0 132 44" preserveAspectRatio="xMinYMax meet" aria-hidden="true">';
    if (kind === 'bars') {
      [12, 21, 31, 42].forEach(function (h, i) {
        s += '<rect class="fill grow" style="--d:' + (0.3 + i * 0.12) + 's" x="' + (i * 24) + '" y="' + (44 - h) + '" width="15" height="' + h + '" rx="3"/>';
      });
      s += '<line class="base" x1="0" y1="43.5" x2="132" y2="43.5"/>';
    } else if (kind === 'dots') {
      var p = [[6, 30], [46, 36], [84, 12], [124, 17]];
      s += '<path class="stroke draw" style="--d:.3s" d="M' + p.map(function (q) { return q.join(' '); }).join(' L') + '"/>';
      p.forEach(function (q, i) { s += '<circle class="fill pop" style="--d:' + (0.35 + i * 0.25) + 's" cx="' + q[0] + '" cy="' + q[1] + '" r="4.2"/>'; });
    } else if (kind === 'levels') {
      [1, 1, 0.42].forEach(function (w, i) {
        var y = 5 + i * 14;
        s += '<rect class="ghost" x="0" y="' + y + '" width="132" height="6" rx="3"/>';
        s += '<rect class="fill grow-x" style="--d:' + (0.3 + i * 0.15) + 's" x="0" y="' + y + '" width="' + (132 * w) + '" height="6" rx="3"/>';
      });
    } else {
      s += '<path class="stroke draw" style="--d:.3s" d="M2 40 C 30 39, 48 35, 66 27 S 102 9, 122 7"/>';
      s += '<circle class="fill pop" style="--d:1.35s" cx="122" cy="7" r="4.6"/>';
    }
    return s + '</svg>';
  }

  function renderAbout() {
    var A = C.about, P = C.person;
    var rec = A.record.map(function (r, i) {
      return '<dt data-i18n="about.record.' + i + '.k">' + esc(t(r.k)) + '</dt><dd>' + (i === 2 ? '<b>' + esc(t(r.v)) + '</b>' : esc(t(r.v))) + '</dd>';
    }).join('');
    var kpis = A.kpis.map(function (k, i) {
      var v = k.value === 'workYears' ? workYears() : { n: k.value, plus: false };
      return '<div class="card kpi rv" style="--d:' + (i * 0.08) + 's">' +
        '<div class="kpi__value"><span data-count="' + v.n + '">0</span>' + (v.plus ? '<sup>+</sup>' : '') + '</div>' +
        T('about.kpis.' + i + '.label', 'div', 'kpi__label') +
        T('about.kpis.' + i + '.detail', 'div', 'kpi__detail') +
        vizSvg(k.viz) + '</div>';
    }).join('');
    return '<div class="container">' +
      '<div class="sec-head" style="margin-bottom:clamp(28px,4vw,48px)"><p class="sec-label"><b>--</b> 01 · ' + T('about.label') + '</p></div>' +
      '<div class="about">' +
        '<div class="about__media">' +
          '<figure class="portrait">' +
            '<picture><source srcset="' + P.photo + '.webp" type="image/webp"><img src="' + P.photo + '.jpg" alt="Aymeric Mouttapa" width="900" height="1198" loading="lazy" decoding="async"></picture>' +
            '<span class="portrait__scan" aria-hidden="true"></span>' +
            '<span class="corner tl" aria-hidden="true"></span><span class="corner tr" aria-hidden="true"></span>' +
            '<dl class="record" aria-hidden="true">' + rec + '</dl>' +
          '</figure>' +
        '</div>' +
        '<div class="about__text">' +
          T('about.statement', 'p', 'statement', ' data-words') +
          '<div class="about__body rv">' + A.body.map(function (b, i) { return T('about.body.' + i, 'p'); }).join('') + '</div>' +
          '<div class="about__traits rv">' + chips(A.traits, 'about.traits') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="kpis">' + kpis + '</div>' +
    '</div>';
  }

  /* ---------- 02 · Parcours ---------- */
  function timelineItems() {
    return C.experience.map(function (d, i) { return { kind: 'experience', i: i, d: d }; })
      .concat(C.education.map(function (d, i) { return { kind: 'education', i: i, d: d }; }))
      .filter(function (x) { return x.d.track; });
  }

  function ganttHtml() {
    var J = C.journey, from = ym(J.from), span = ym(J.to) - from;
    function pc(s) { return clamp(((s ? ym(s) : NOW) - from) / span, 0, 1) * 100; }
    var ticks = '', grid = '', now = pc(null);
    for (var y = from.getFullYear() + 1; y <= ym(J.to).getFullYear(); y++) {
      var p = pc(y + '-01');
      // L'étiquette « aujourd'hui » prend la place de l'année trop proche.
      ticks += '<span class="gantt__tick' + (Math.abs(p - now) < 7 ? ' is-near' : '') + '" style="left:' + p.toFixed(3) + '%">' + y + '</span>';
      grid += '<i style="left:' + p.toFixed(3) + '%"></i>';
    }
    var items = timelineItems();
    var side = J.tracks.map(function (tr, ti) {
      return T('journey.tracks.' + ti + '.label', 'span', 'gantt__label t-' + tr.id);
    }).join('');
    var lanes = J.tracks.map(function (tr, ti) {
      var mine = items.filter(function (x) { return x.d.track === tr.id; });
      var lane = mine.map(function (x, k) {
        var d = x.d, a = pc(d.start), future = d.end && ym(d.end) > NOW;
        var b = d.end && !future ? pc(d.end) : pc(null);
        var delay = (0.15 + ti * 0.18 + k * 0.12).toFixed(2);
        var name = d.short || d.company || d.school;
        var namePath = d.short ? x.kind + '.' + x.i + '.short' : null;
        var html = '<button class="gbar" type="button" data-target="' + (x.kind === 'experience' ? 'xp-' : 'edu-') + d.id + '" data-tip="' + x.kind + ':' + x.i + '"' +
          ' style="left:' + a.toFixed(3) + '%;width:' + (b - a).toFixed(3) + '%;--d:' + delay + 's">' +
          '<span class="gbar__name"' + (namePath ? ' data-i18n="' + namePath + '"' : '') + '>' + esc(t(name)) + '</span>' +
          '<small data-dur="' + d.start + '|' + (future ? '' : (d.end || '')) + '">' + dur(d.start, future ? null : d.end) + '</small>' +
          (!d.end || future ? '<i class="gbar__now"></i>' : '') + '</button>';
        if (future) html += '<span class="gbar gbar--planned" aria-hidden="true" style="left:' + b.toFixed(3) + '%;width:' + (pc(d.end) - b).toFixed(3) + '%;--d:' + (+delay + 0.5) + 's"></span>';
        return html;
      }).join('');
      mine.forEach(function (x) {
        (x.d.milestones || []).forEach(function (m, mi) {
          lane += '<button class="gantt__ms" type="button" data-tip="ms:' + x.i + ':' + mi + '" data-i18n-aria="experience.' + x.i + '.milestones.' + mi + '.label" aria-label="' + esc(t(m.label)) + '"' +
            ' style="left:' + pc(m.date).toFixed(3) + '%;--d:' + (1.3 + mi * 0.18) + 's"></button>';
        });
      });
      return '<div class="gantt__lane t-' + tr.id + '">' + lane + '</div>';
    }).join('');
    // Les intitulés restent fixes à gauche ; seule la frise défile sur petit écran.
    return '<div class="gantt__wrap">' +
      '<div class="gantt__side"><span class="gantt__corner"></span>' + side + '</div>' +
      '<div class="gantt__scroll" data-gantt-scroll><div class="gantt__inner">' +
        '<div class="gantt__axis">' + ticks + '</div><div class="gantt__grid" aria-hidden="true">' + grid + '</div>' + lanes +
        '<div class="gantt__today" style="left:' + now.toFixed(3) + '%">' + T('ui.today') + '</div>' +
      '</div></div></div>';
  }

  function xpHtml(e, i) {
    var b = 'experience.' + i, end = e.end || '';
    return '<article class="xp__item rv t-' + e.track + '" id="xp-' + e.id + '">' +
      '<div class="xp__when"><b data-range="' + e.start + '|' + end + '">' + range(e.start, e.end) + '</b>' +
        '<span data-dur="' + e.start + '|' + end + '">' + dur(e.start, e.end) + '</span>' +
        (!e.end ? '<div>' + T('ui.ongoing', 'span', 'live') + '</div>' : '') +
      '</div>' +
      '<div class="xp__body">' +
        '<div class="xp__head"><span class="logo-tile' + (e.id === 'hemi' ? ' logo-tile--full' : '') + '"><img src="' + e.logo + '" alt="" width="54" height="54" loading="lazy" decoding="async"></span>' +
          '<div><h4 class="xp__company">' + esc(e.company) + '</h4>' + T(b + '.role', 'p', 'xp__role') + T(b + '.place', 'p', 'xp__place') +
          (e.url ? '<a class="link-arrow xp__site" href="' + esc(e.url) + '" target="_blank" rel="noopener">' + esc(domain(e.url)) + ICON.arrow + '</a>' : '') +
          '</div></div>' +
        '<ul class="xp__list">' + e.bullets.map(function (x, k) { return T(b + '.bullets.' + k, 'li'); }).join('') + '</ul>' +
        chips(e.tags, b + '.tags') +
      '</div></article>';
  }

  function eduHtml(e, i) {
    var b = 'education.' + i;
    var mark = e.logo
      ? '<span class="edu__mark"><img src="' + e.logo + '" alt="" loading="lazy" decoding="async"></span>'
      : '<span class="edu__mono" aria-hidden="true">' + esc(e.school.replace(/^(IUT|Lycée)\s.*/, '$1').slice(0, 3)) + '</span>';
    var school = e.link
      ? '<a class="edu__school" href="' + e.link + '" target="_blank" rel="noopener">' + esc(e.school) + ' ↗</a>'
      : '<p class="edu__school">' + esc(e.school) + '</p>';
    var courses = e.courses.length
      ? '<p class="edu__note">' + T('ui.courses') + ' ' + e.courses.map(function (c, k) { return T(b + '.courses.' + k); }).join(', ') + '</p>'
      : '';
    return '<article class="card edu__card rv t-' + (e.track || 'school') + '" id="edu-' + e.id + '" style="--d:' + (i * 0.08) + 's">' +
      '<div class="edu__top"><span class="edu__years">' + ym(e.start).getFullYear() + ' → ' + ym(e.end).getFullYear() + '</span>' + mark + '</div>' +
      school + T(b + '.degree', 'h4', 'edu__degree') +
      (e.note ? T(b + '.note', 'p', 'edu__note') : '') +
      courses +
      (e.tools.length ? chips(e.tools, b + '.tools') : '') +
      '</article>';
  }

  function renderJourney() {
    return '<div class="container">' + head('02', 'journey') +
      '<div class="card gantt" data-gantt>' + ganttHtml() + '</div>' +
      '<h3 class="sub-title rv">' + T('journey.expTitle') + '</h3>' +
      '<div class="xp">' + C.experience.map(xpHtml).join('') + '</div>' +
      '<h3 class="sub-title rv">' + T('journey.eduTitle') + '</h3>' +
      '<div class="edu">' + C.education.map(eduHtml).join('') + '</div>' +
      '</div>';
  }

  /* ---------- 03 · Projets ---------- */
  function hemiHtml(p, i) {
    var b = 'projects.featured.' + i;
    return '<article class="card proj-hemi rv t-startup" id="proj-' + p.id + '">' +
      '<div class="proj-hemi__text">' +
        '<div class="proj__kicker">' + T('ui.ongoing', 'span', 'live') + T(b + '.kicker') + '</div>' +
        '<h3 class="proj__title"><img src="assets/img/logos/hemi.png" alt="" width="64" height="64" loading="lazy">' + esc(t(p.title)) + '</h3>' +
        T(b + '.subtitle', 'p', 'proj__subtitle') +
        T(b + '.description', 'p', 'proj__desc') +
        '<dl class="facts">' + p.facts.map(function (f, k) {
          return '<div class="fact"><dt>' + esc(t(f.k)) + '</dt>' + T(b + '.facts.' + k + '.v', 'dd') + '</div>';
        }).join('') + '</dl>' +
        '<div class="proj__foot">' + chips(p.tags, b + '.tags') + p.links.map(linkHtml).join('') + '</div>' +
      '</div>' +
      '<div class="phone-stage" data-tilt aria-hidden="true">' +
        p.features.map(function (f, k) { return T(b + '.features.' + k, 'span', 'float-chip', ' style="--d:' + (k * -1.6) + 's"'); }).join('') +
        '<div class="phone"><div class="phone__screen">' +
          '<span class="phone__rings"><i></i><i></i><i></i></span>' +
          '<img class="phone__icon" src="assets/img/logos/hemi.png" alt="" width="88" height="88" loading="lazy">' +
          '<span class="phone__name">Hemi</span>' +
        '</div></div>' +
      '</div>' +
    '</article>';
  }

  function rocSvg() {
    // Courbe y = 1 - (1 - x)^k : son aire vaut 1 - 1/(k+1), soit l'AUC du modèle.
    var auc = 0.926, k = 1 / (1 - auc) - 1, d = '';
    for (var s = 0; s <= 50; s++) {
      var x = s / 50, y = 1 - Math.pow(1 - x, k);
      d += (s ? 'L' : 'M') + (12 + x * 84).toFixed(2) + ' ' + (88 - y * 84).toFixed(2);
    }
    var area = d + 'L96 88L12 88Z';
    return '<svg class="roc" viewBox="0 0 100 100" aria-hidden="true">' +
      '<path class="area" d="' + area + '"/>' +
      '<line class="ax" x1="12" y1="88" x2="96" y2="88"/><line class="ax" x1="12" y1="4" x2="12" y2="88"/>' +
      '<line class="diag" x1="12" y1="88" x2="96" y2="4"/>' +
      '<path class="curve" d="' + d + '"/>' +
      '<text x="96" y="96" text-anchor="end">FPR</text><text x="14" y="10">TPR</text>' +
      '<text class="auc" x="92" y="82" text-anchor="end">AUC ' + num(auc, 3) + '</text>' +
      '</svg>';
  }

  function mlHtml(p, i) {
    var b = 'projects.featured.' + i;
    var lo = 0.80, hi = 0.87;
    var metrics = p.metrics.map(function (m) {
      return '<div class="metric"><div class="metric__v" data-count="' + m.v + '" data-dec="3">0</div><div class="metric__k">' + esc(m.k) + '</div></div>';
    }).join('');
    var models = p.models.map(function (m, k) {
      var w = clamp((m.f1 - lo) / (hi - lo), 0.03, 1);
      return '<div class="model"><span>' + esc(m.name) + '</span><span class="model__bar"><i style="--w:' + w.toFixed(3) + ';--d:' + (0.4 + k * 0.12) + 's"></i></span><b data-num="' + m.f1 + '" data-dec="' + (String(m.f1).split('.')[1] || '').length + '">' + num(m.f1, (String(m.f1).split('.')[1] || '').length) + '</b></div>';
    }).join('');
    return '<article class="card proj-card rv" id="proj-' + p.id + '">' +
      '<div class="proj__kicker">' + T(b + '.kicker') + '</div>' +
      T(b + '.title', 'h3', 'proj__title') + T(b + '.subtitle', 'p', 'proj__subtitle') + T(b + '.description', 'p', 'proj__desc') +
      '<div class="viz"><div class="ml">' + rocSvg() + '<div><div class="metrics">' + metrics + '</div><div class="models">' + models + '</div></div></div>' +
        T('ui.mlNote', 'p', 'viz__note') + '</div>' +
      '<div class="proj__foot">' + chips(p.tags, b + '.tags') + p.links.map(linkHtml).join('') + '</div>' +
    '</article>';
  }

  function npsHtml(p, i) {
    var b = 'projects.featured.' + i, cells = '';
    for (var n = 0; n <= 10; n++) {
      var g = n <= 6 ? 'det' : n <= 8 ? 'pas' : 'pro';
      cells += '<span class="nps__cell" data-g="' + g + '" style="--d:' + (0.1 + n * 0.05).toFixed(2) + 's">' + n + '</span>';
    }
    var lg = b + '.npsLegend', ex = p.npsExample;
    var example = ex
      ? '<div class="nps__example">' +
          '<div class="nps__ex-top">' + T(lg + '.example') + '<b>NPS +<span data-count="' + (ex.promoters - ex.detractors) + '">0</span></b></div>' +
          '<div class="nps__bar" aria-hidden="true">' +
            '<i data-g="det" style="--w:' + ex.detractors + ';--d:.5s"></i><i data-g="pas" style="--w:' + ex.passives + ';--d:.65s"></i><i data-g="pro" style="--w:' + ex.promoters + ';--d:.8s"></i>' +
          '</div>' +
          '<div class="nps__ex-legend"><span style="--w:' + ex.detractors + '">' + ex.detractors + ' %</span><span style="--w:' + ex.passives + '">' + ex.passives + ' %</span><span style="--w:' + ex.promoters + '">' + ex.promoters + ' %</span></div>' +
        '</div>'
      : '';
    return '<article class="card proj-card rv" id="proj-' + p.id + '" style="--d:.08s">' +
      '<div class="proj__kicker">' + T(b + '.kicker') + '</div>' +
      T(b + '.title', 'h3', 'proj__title') + T(b + '.subtitle', 'p', 'proj__subtitle') + T(b + '.description', 'p', 'proj__desc') +
      '<div class="viz nps">' +
        '<div class="nps__scale" aria-hidden="true">' + cells + '</div>' +
        '<div class="nps__groups">' + T(lg + '.detractors') + T(lg + '.passives') + T(lg + '.promoters') + '</div>' +
        '<div class="nps__row">' + T(lg + '.formula', 'span', 'nps__formula') +
          '<button class="switch" type="button" role="switch" aria-checked="false" data-nps-switch><span class="switch__track"></span>' + T(lg + '.toggle') + '</button>' +
        '</div>' +
        example +
      '</div>' +
      '<div class="proj__foot">' + chips(p.tags, b + '.tags') + p.links.map(linkHtml).join('') + '</div>' +
    '</article>';
  }

  // Un projet ajouté plus tard sans visuel dédié : carte simple.
  function genericHtml(p, i) {
    var b = 'projects.featured.' + i;
    return '<article class="card proj-card rv" id="proj-' + (p.id || i) + '">' +
      (p.kicker ? '<div class="proj__kicker">' + T(b + '.kicker') + '</div>' : '') +
      T(b + '.title', 'h3', 'proj__title') +
      (p.subtitle ? T(b + '.subtitle', 'p', 'proj__subtitle') : '') +
      (p.img ? '<div class="viz" style="padding:0;overflow:hidden"><img src="' + p.img + '" alt="" loading="lazy" style="width:100%"></div>' : '') +
      (p.description ? T(b + '.description', 'p', 'proj__desc') : '') +
      '<div class="proj__foot">' + chips(p.tags || [], b + '.tags') + (p.links || []).map(linkHtml).join('') + '</div>' +
    '</article>';
  }

  function archiveHtml() {
    var P = C.projects;
    return '<div class="archive">' +
      '<div class="archive__head"><h3 class="sub-title rv">' + T('projects.archiveTitle') + '</h3>' + T('projects.archiveIntro', 'p', 'archive__intro rv') + '</div>' +
      '<ol class="archive__list">' + P.archive.map(function (a, k) {
        var b = 'projects.archive.' + k;
        return '<li class="arow rv" data-img="' + a.img + '" style="--d:' + (k * 0.05).toFixed(2) + 's">' +
          '<span class="arow__i">' + pad2(k + 1) + '</span>' +
          '<span class="arow__t">' + esc(a.title) + '</span>' +
          T(b + '.what', 'p', 'arow__d') +
          '<span class="arow__tools">' + a.tools.map(function (x, j) { return T(b + '.tools.' + j); }).join(' · ') + '</span>' +
          '<a class="link-arrow arow__link" href="' + esc(a.link.href) + '" target="_blank" rel="noopener"><span class="sr-only">' + esc(a.title) + ' — </span>' +
            T({ app: 'ui.app', pdf: 'ui.pdf', code: 'ui.code' }[a.link.type] || 'ui.view') + ICON.arrow + '</a>' +
        '</li>';
      }).join('') + '</ol></div>';
  }

  function renderProjects() {
    var F = C.projects.featured, spot = '', grid = '';
    F.forEach(function (p, i) {
      if (p.kind === 'hemi') spot += hemiHtml(p, i);
      else if (p.kind === 'ml') grid += mlHtml(p, i);
      else if (p.kind === 'nps') grid += npsHtml(p, i);
      else grid += genericHtml(p, i);
    });
    return '<div class="container">' + head('03', 'projects') + spot +
      (grid ? '<div class="proj-grid">' + grid + '</div>' : '') + archiveHtml() + '</div>';
  }

  /* ---------- 04 · Stack ---------- */
  function ctxById(id) { return C.skills.contexts.filter(function (c) { return c.id === id; })[0]; }

  function renderSkills() {
    var S = C.skills;
    var groups = S.groups.map(function (g, gi) {
      return '<div class="sgroup rv" style="--d:' + (gi * 0.06) + 's">' + T('skills.groups.' + gi + '.label', 'p', 'sgroup__label') +
        '<div class="sgroup__items">' + g.items.map(function (s, si) {
          return '<button type="button" class="skill" aria-pressed="false" data-skill="' + gi + '-' + si + '" data-ctx="' + s.ctx.join(' ') + '">' + esc(s.name) + '</button>';
        }).join('') + '</div></div>';
    }).join('');
    var contexts = S.contexts.map(function (c, ci) {
      var n = 0;
      S.groups.forEach(function (g) { g.items.forEach(function (s) { if (s.ctx.indexOf(c.id) > -1) n++; }); });
      return '<button type="button" class="ctx t-' + c.kind + '" aria-pressed="false" data-ctx-id="' + c.id + '"><span class="ctx__dot"></span>' +
        T('skills.contexts.' + ci + '.label', 'span', 'ctx__label') + '<span class="ctx__n">' + n + '</span></button>';
    }).join('');
    var certs = S.certifications.map(function (c, k) {
      return '<article class="card cert rv" style="--d:' + (k * 0.08) + 's">' +
        '<div class="cert__top"><span>' + esc(c.issuer) + '</span><span data-month="' + c.date + '">' + fmtYM(c.date) + '</span></div>' +
        '<h4 class="cert__name">' + esc(c.name) + '</h4>' + T('skills.certifications.' + k + '.detail', 'p', 'cert__detail') +
        '<div class="cert__actions">' +
          '<button class="btn btn--ghost btn--sm" type="button" data-lightbox-src="' + c.img + '" data-lightbox-cap="' + esc(c.name + ' · ' + c.issuer) + '">' + T('ui.view') + ICON.eye + '</button>' +
          (c.verify ? '<a class="btn btn--ghost btn--sm" href="' + c.verify + '" target="_blank" rel="noopener">' + T('ui.verify') + ICON.arrow + '</a>' : '') +
        '</div></article>';
    }).join('');
    return '<div class="container">' + head('04', 'skills') +
      '<div class="skills" data-skills><svg class="skills__svg" aria-hidden="true"></svg>' +
        '<div class="skills__list">' + groups + '</div><div class="skills__gap" aria-hidden="true"></div>' +
        '<div class="skills__ctx">' + contexts + '</div></div>' +
      '<div class="certs"><h3 class="sub-title rv">' + T('skills.certTitle') + '</h3><div class="certs__grid">' + certs + '</div></div>' +
      '</div>';
  }

  /* ---------- 05 · Monde ---------- */
  function renderWorld() {
    var Wd = C.world;
    var steps = Wd.places.map(function (p, k) {
      return '<li class="step" data-step="' + k + '"><div class="step__top"><b>' + p.code + '</b><span>' + p.from + ' → ' + (p.to || T('ui.today')) + '</span></div>' +
        '<p class="step__city">' + esc(p.city) + '</p>' + T('world.places.' + k + '.note', 'p', 'step__note') + '</li>';
    }).join('');
    var langs = Wd.languages.map(function (l, k) {
      var cells = '';
      for (var j = 1; j <= 6; j++) {
        var cls = l.level >= j ? 'f' : l.level >= j - 0.5 ? 'h' : '';
        cells += '<i class="' + cls + '" style="--d:' + (0.2 + k * 0.15 + j * 0.07).toFixed(2) + 's"></i>';
      }
      return '<div class="lang">' + T('world.languages.' + k + '.name', 'span', 'lang__name') + '<span class="cefr" aria-hidden="true">' + cells + '</span>' + T('world.languages.' + k + '.label', 'span', 'lang__lvl') + '</div>';
    }).join('');
    var hobbies = Wd.hobbies.map(function (h, k) {
      return '<li class="hobby"><span aria-hidden="true">' + h.icon + '</span>' + T('world.hobbies.' + k + '.label') + '</li>';
    }).join('');
    return '<div class="container">' + head('05', 'world') +
      '<div class="world" data-world>' +
        '<div class="card map"><div class="map__head" aria-hidden="true"><div class="map__year" data-map-year>' + Wd.places[0].from + '</div><div class="map__where" data-map-where></div></div><div data-map></div></div>' +
        '<ol class="steps">' + steps + '</ol>' +
      '</div>' +
      '<div class="world__bottom">' +
        '<div class="card langs rv"><h3 class="sub-title">' + T('world.langTitle') + '</h3>' + langs +
          '<div class="cefr-scale" aria-hidden="true"><span><i>A1</i><i>A2</i><i>B1</i><i>B2</i><i>C1</i><i>C2</i></span></div></div>' +
        '<div class="card off rv" style="--d:.08s"><h3 class="sub-title">' + T('world.offTitle') + '</h3><ul class="hobbies">' + hobbies + '</ul></div>' +
      '</div></div>';
  }

  /* ---------- 06 · Contact ---------- */
  function renderContact() {
    var P = C.person;
    function clink(href, title, small, ext) {
      return '<a class="clink rv" href="' + href + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '><span>' + title + '<small>' + small + '</small></span>' + ICON.arrow + '</a>';
    }
    return '<div class="container">' +
      '<p class="sec-label"><b>--</b> 06 · ' + T('contact.label') + '</p>' +
      T('contact.title', 'h2', 'contact__title', ' data-split') +
      T('contact.intro', 'p', 'contact__intro rv') +
      '<p class="contact__query" data-contact-query aria-hidden="true"></p>' +
      '<div class="contact__mail rv"><a class="contact__email" href="mailto:' + P.email + '">' + P.email + '</a>' +
        '<button class="btn btn--ghost" type="button" data-copy="' + P.email + '">' + T('ui.copy') + ICON.copy + '</button></div>' +
      '<div class="contact__links">' +
        clink(P.linkedin, 'LinkedIn', 'in/aymeric-mouttapa', true) +
        clink(P.github, 'GitHub', '@AymericMtp', true) +
        clink(P.cv, 'CV', 'PDF', true) +
      '</div></div>';
  }

  function renderFooter() {
    return '<div class="container footer__inner">' +
      '<span>© ' + NOW.getFullYear() + ' Aymeric Mouttapa</span>' +
      '<span>' + T('ui.updated') + ' <span data-month="' + C.meta.updated + '">' + fmtYM(C.meta.updated) + '</span></span>' +
      '<span data-i18n="ui.tip" data-kbd>' + kbd(fmt(C.ui.tip)) + '</span>' +
      '<button type="button" data-action="top">' + T('ui.backTop') + ' ↑</button>' +
      '</div>';
  }
  function kbd(html) { return html.replace(' / ', ' <kbd>/</kbd> '); }

  /* ---------- Rendu ---------- */
  var RENDER = { about: renderAbout, journey: renderJourney, projects: renderProjects, skills: renderSkills, world: renderWorld, contact: renderContact, footer: renderFooter };

  function renderAll() {
    $$('[data-render]').forEach(function (el) {
      var fn = RENDER[el.getAttribute('data-render')];
      if (fn) el.innerHTML = fn();
    });
    $$('.kpi__viz .draw').forEach(function (p) { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2)); });
    $$('.roc .curve').forEach(function (p) { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2)); });
  }

  /* ---------- Langue ---------- */
  function refreshI18n() {
    root.lang = lang;
    doc.title = t(C.ui.docTitle);
    var desc = $('meta[name="description"]');
    if (desc) desc.setAttribute('content', t(C.ui.docDesc));

    $$('[data-i18n]').forEach(function (el) {
      var html = fmt(get(el.getAttribute('data-i18n')));
      if (el.hasAttribute('data-kbd')) html = kbd(html);
      el.innerHTML = html;
      if (el.hasAttribute('data-split')) splitWords(el);
      if (el.hasAttribute('data-words')) splitStatement(el);
    });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', t(get(el.getAttribute('data-i18n-aria')))); });
    $$('[data-range]').forEach(function (el) { var p = el.getAttribute('data-range').split('|'); el.textContent = range(p[0], p[1] || null); });
    $$('[data-dur]').forEach(function (el) { var p = el.getAttribute('data-dur').split('|'); el.textContent = dur(p[0], p[1] || null); });
    $$('[data-month]').forEach(function (el) { el.textContent = fmtYM(el.getAttribute('data-month')); });
    $$('[data-count]').forEach(function (el) { if (el.dataset.done) el.textContent = num(+el.dataset.count, +(el.dataset.dec || 0)); });
    $$('[data-num]').forEach(function (el) { el.textContent = num(+el.dataset.num, +(el.dataset.dec || 0)); });
    $$('.roc text').forEach(function (el) { if (/^AUC/.test(el.textContent)) el.textContent = 'AUC ' + num(0.926, 3); });
    refreshers.forEach(function (fn) { fn(); });
  }

  function setLang(l) {
    if (l === lang || (l !== 'fr' && l !== 'en')) return;
    lang = l;
    store('am_lang', l);
    refreshI18n();
    requestAnimationFrame(relayout);
  }

  /* ---------- Thème ---------- */
  function setTheme(mode, persist) {
    root.classList.add('theme-anim');
    root.setAttribute('data-theme', mode);
    if (persist !== false) store('am_theme', mode);
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', mode === 'light' ? '#F3F3EE' : '#0A0B0E');
    if (particles) particles.colors();
    clearTimeout(setTheme.t);
    setTheme.t = setTimeout(function () { root.classList.remove('theme-anim'); }, 650);
  }

  /* ---------- Apparitions ---------- */
  function countUp(el) {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    var to = +el.dataset.count, dec = +(el.dataset.dec || 0);
    if (RM) { el.textContent = num(to, dec); return; }
    var t0 = performance.now(), d = 1700;
    (function tick(now) {
      var p = Math.min(1, (now - t0) / d), e = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      el.textContent = num(to * e, dec);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function typeInto(el, text, done) {
    if (RM) { el.innerHTML = highlight(text); if (done) done(); return; }
    var i = 0, token = {};
    el._typing = token;
    (function step() {
      if (el._typing !== token) return;
      i++;
      el.innerHTML = highlight(text.slice(0, i)) + '<span class="caret"></span>';
      if (i < text.length) setTimeout(step, 18 + Math.random() * 34);
      else { el.innerHTML = highlight(text) + '<span class="caret"></span>'; if (done) done(); }
    })();
  }
  function highlight(s) {
    return esc(s).replace(/\b(SELECT|FROM|WHERE|INSERT|INTO|VALUES)\b/g, '<span class="k">$1</span>');
  }

  function onReveal(el) {
    el.classList.add('is-in');
    // Le portrait est masqué par un clip-path : on observe son conteneur à sa place.
    $$('.portrait', el).forEach(function (p) { p.classList.add('is-in'); });
    if (el.matches('.gantt')) panGantt(el);
    $$('[data-count]', el).forEach(countUp);
    if (el.matches('[data-contact-query]') || el.querySelector('[data-contact-query]')) {
      var q = $('[data-contact-query]');
      if (q && !q._typed) { q._typed = true; typeInto(q, t(C.contact.query)); }
    }
  }

  function observeReveals() {
    var els = $$('.rv, [data-split], .sec-label, .about__media, .gantt, .viz, .skills, [data-contact-query]');
    if (RM || !('IntersectionObserver' in window)) { els.forEach(onReveal); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { onReveal(e.target); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Accueil ---------- */
  function fontsReady() {
    if (!doc.fonts || !doc.fonts.load) return Promise.resolve();
    var ready = Promise.all([doc.fonts.load('800 100px "Bricolage Grotesque"'), doc.fonts.ready]);
    var timeout = new Promise(function (r) { setTimeout(r, 2500); });
    return Promise.race([ready, timeout]).catch(function () {});
  }

  function initHero() {
    var hero = $('.hero'), name = $('[data-hero-name]');
    $$('.hero__line', name).forEach(function (line) {
      line.innerHTML = line.textContent.split('').map(function (ch, i) {
        return '<span class="ch" aria-hidden="true" style="--i:' + i + '">' + esc(ch) + '</span>';
      }).join('');
    });

    // Rôles qui défilent
    var rolesEl = $('[data-roles]'), roleIdx = 0;
    function renderRoles() {
      rolesEl.innerHTML = C.hero.roles.map(function (r, i) {
        return '<span class="r' + (i === roleIdx ? ' is-on' : '') + '">' + esc(t(r)) + '</span>';
      }).join('');
    }
    renderRoles();
    refreshers.push(renderRoles);
    if (!RM) {
      setInterval(function () {
        if (doc.hidden) return;
        var rs = $$('.r', rolesEl), prev = rs[roleIdx];
        prev.classList.remove('is-on'); prev.classList.add('is-out');
        roleIdx = (roleIdx + 1) % rs.length;
        rs[roleIdx].classList.remove('is-out'); rs[roleIdx].classList.add('is-on');
        setTimeout(function () { prev.classList.remove('is-out'); }, 800);
      }, 3400);
    }

    // La requête qui se tape toute seule
    var typed = $('[data-typed]'), result = $('.hero__result');
    refreshers.push(function () { typed._typing = null; typed.textContent = t(C.hero.query); });
    function startTyping() {
      var s = t(C.hero.query);
      if (RM) { typed.textContent = s; result.classList.add('is-in'); return; }
      var i = 0, token = {};
      typed._typing = token;
      (function step() {
        if (typed._typing !== token) { result.classList.add('is-in'); return; }
        typed.textContent = s.slice(0, ++i);
        if (i < s.length) setTimeout(step, 20 + Math.random() * 38);
        else setTimeout(function () { result.classList.add('is-in'); }, 240);
      })();
    }

    hero.classList.add('is-ready');
    setTimeout(startTyping, RM ? 0 : 350);

    var canParticles = !RM && window.HeroParticles && !!doc.createElement('canvas').getContext;
    if (!canParticles) { hero.classList.add('name-in'); return; }
    fontsReady().then(function () {
      particles = window.HeroParticles(hero, $('.hero__canvas'), name);
      if (particles && particles.start()) hero.classList.add('has-particles');
      else hero.classList.add('name-in');
    });
  }

  /* ---------- Navigation & défilement ---------- */
  var nav, menu, burger, menuOpen = false, lastY = 0;

  // On calcule la position nous-mêmes : avec un élément pour cible, Lenis ajouterait
  // le scroll-padding de la page et le scroll-margin de l'élément à notre décalage.
  function scrollToEl(el, offset, immediate) {
    if (!el) return;
    var y = Math.max(0, el.getBoundingClientRect().top + window.scrollY + (offset == null ? -84 : offset));
    if (lenis) lenis.scrollTo(y, immediate ? { immediate: true } : { duration: 1.3 });
    else window.scrollTo({ top: y, behavior: RM || immediate ? 'auto' : 'smooth' });
  }

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menu.inert = !open;
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (open) nav.classList.remove('is-hidden');
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    doc.body.style.overflow = open ? 'hidden' : '';
  }

  function movePill() {
    var pill = $('.nav__pill'), a = $('.nav__links a.is-active');
    if (!pill) return;
    if (!a) { pill.style.opacity = '0'; return; }
    pill.style.opacity = '1';
    pill.style.width = a.offsetWidth + 'px';
    pill.style.setProperty('--x', a.offsetLeft + 'px');
  }

  var progressEl, heroEl, heroInner;
  function onScroll() {
    var y = window.scrollY || root.scrollTop;
    var max = root.scrollHeight - window.innerHeight;
    progressEl.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    nav.classList.toggle('is-scrolled', y > 24);
    if (!menuOpen) {
      if (y > lastY + 4 && y > 520) nav.classList.add('is-hidden');
      else if (y < lastY - 4 || y < 520) nav.classList.remove('is-hidden');
    }
    lastY = y;
    var hp = clamp(y / (heroEl.offsetHeight || 1), 0, 1);
    if (particles) particles.setScroll(hp);
    if (!RM) {
      heroInner.style.transform = hp > 0 ? 'translate3d(0,' + (hp * 70).toFixed(1) + 'px,0)' : '';
      heroInner.style.opacity = hp > 0 ? Math.max(0, 1 - hp * 1.3).toFixed(3) : '';
    }
  }

  function initNav() {
    nav = $('[data-nav]'); menu = $('[data-menu]'); burger = $('[data-action="menu"]');
    progressEl = $('.progress span'); heroEl = $('.hero'); heroInner = $('.hero__inner');
    menu.inert = true;
    menu.setAttribute('aria-hidden', 'true');

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var id = e.target.id;
          $$('.nav__links a').forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
          movePill();
        });
      }, { rootMargin: '-45% 0px -50% 0px' });
      $$('main > section').forEach(function (s) { io.observe(s); });
    }
    relayouts.push(movePill);

    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var target = doc.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      if (menuOpen) setMenu(false);
      scrollToEl(target, id === '#accueil' ? 0 : -84);
      if (history.replaceState) history.replaceState(null, '', id);
    });

    if (lenis) lenis.on('scroll', onScroll);
    else window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  function initSmoothScroll() {
    if (RM || !window.Lenis || !hasGsap) return;
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Parcours : diagramme de Gantt ---------- */
  var tipEl;
  function tipHtml(key) {
    var p = key.split(':');
    if (p[0] === 'ms') {
      var m = C.experience[+p[1]].milestones[+p[2]];
      return '<b>' + fmt(m.label) + '</b><span>' + esc(t(C.ui.msLabel)) + ' · ' + fmtYM(m.date) + '</span>';
    }
    var d = C[p[0]][+p[1]], future = d.end && ym(d.end) > NOW;
    var title = d.company || d.school, sub = t(d.role || d.degree);
    return '<b>' + esc(title) + '</b><span>' + esc(sub) + '</span><span>' + range(d.start, d.end) + ' · ' + dur(d.start, future ? null : d.end) + '</span>';
  }
  function placeTip(x, y) {
    var w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    var left = clamp(x + 16, 8, window.innerWidth - w - 8), top = y - h - 14;
    if (top < 8) top = y + 20;
    tipEl.style.transform = 'translate3d(' + left + 'px,' + top + 'px,0)';
  }
  function showTip(target, ev) {
    tipEl.innerHTML = tipHtml(target.getAttribute('data-tip'));
    tipEl.hidden = false;
    if (ev && ev.clientX != null) placeTip(ev.clientX, ev.clientY);
    else { var r = target.getBoundingClientRect(); placeTip(r.left + r.width / 2, r.top); }
  }
  function hideTip() { tipEl.hidden = true; }

  function fitGantt() {
    $$('.gbar small').forEach(function (sm) {
      sm.style.display = '';
      var bar = sm.parentElement;
      if (bar.scrollWidth > bar.clientWidth + 1) sm.style.display = 'none';
    });
  }

  function initGantt() {
    var g = $('[data-gantt]');
    tipEl = $('[data-tooltip]');
    if (!g) return;
    if (FINE) {
      g.addEventListener('pointerover', function (e) { var b = e.target.closest('[data-tip]'); if (b) showTip(b, e); });
      g.addEventListener('pointermove', function (e) { if (!tipEl.hidden) placeTip(e.clientX, e.clientY); });
      g.addEventListener('pointerout', function (e) { var b = e.target.closest('[data-tip]'); if (b && !b.contains(e.relatedTarget)) hideTip(); });
    }
    g.addEventListener('focusin', function (e) { var b = e.target.closest('[data-tip]'); if (b && b.matches(':focus-visible')) showTip(b); });
    g.addEventListener('focusout', hideTip);
    g.addEventListener('click', function (e) {
      var b = e.target.closest('[data-target], .gantt__ms');
      if (!b) return;
      if (b.classList.contains('gantt__ms')) {
        if (!FINE) { showTip(b); setTimeout(hideTip, 2600); }
        return;
      }
      hideTip();
      var el = doc.getElementById(b.getAttribute('data-target'));
      scrollToEl(el, -120);
      if (el) { el.classList.add('is-hl'); setTimeout(function () { el.classList.remove('is-hl'); }, 1800); }
    });
    window.addEventListener('scroll', hideTip, { passive: true });
    fitGantt();
    relayouts.push(fitGantt);

    // Sur petit écran la frise défile : des fondus indiquent qu'il y a de la suite.
    var sc = $('[data-gantt-scroll]', g);
    function edges() {
      var max = sc.scrollWidth - sc.clientWidth;
      sc.classList.toggle('fade-l', sc.scrollLeft > 2);
      sc.classList.toggle('fade-r', max > 2 && sc.scrollLeft < max - 2);
    }
    sc.addEventListener('scroll', edges, { passive: true });
    edges();
    relayouts.push(edges);
  }

  // À l'apparition, la frise glisse d'elle-même jusqu'à « aujourd'hui » (une fois).
  function panGantt(g) {
    var sc = $('[data-gantt-scroll]', g);
    if (!sc || RM) return;
    var stop = false;
    function cancel() { stop = true; }
    ['pointerdown', 'wheel', 'touchstart'].forEach(function (ev) { sc.addEventListener(ev, cancel, { once: true, passive: true }); });
    setTimeout(function () {
      var from = sc.scrollLeft, max = sc.scrollWidth - sc.clientWidth, t0 = 0;
      if (max < 8 || stop) return;
      requestAnimationFrame(function step(now) {
        if (stop) return;
        if (!t0) t0 = now;
        var p = Math.min(1, (now - t0) / 1700);
        var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        sc.scrollLeft = from + (max - from) * e;
        if (p < 1) requestAnimationFrame(step);
      });
    }, 1200);
  }

  /* ---------- Stack : outils reliés à leurs contextes ---------- */
  var focus = { hover: null, pin: null };

  function drawLinks() {
    var wrap = $('[data-skills]');
    if (!wrap) return;
    var svg = $('.skills__svg', wrap);
    if (getComputedStyle(svg).display === 'none') { svg.innerHTML = ''; return; }
    var wr = wrap.getBoundingClientRect(), pos = {}, html = '', k = 0;
    $$('.ctx', wrap).forEach(function (c) {
      var r = c.getBoundingClientRect();
      pos[c.getAttribute('data-ctx-id')] = { x: r.left - wr.left - 6, y: r.top - wr.top + r.height / 2 };
    });
    var skills = $$('.skill', wrap);
    // Toutes les courbes partent d'une même colonne, juste à droite de l'outil le plus large.
    var xs = Math.max.apply(null, skills.map(function (s) { return s.getBoundingClientRect().right - wr.left; })) + 22;
    skills.forEach(function (s) {
      var r = s.getBoundingClientRect(), x0 = r.right - wr.left + 6, y1 = r.top - wr.top + r.height / 2;
      s.getAttribute('data-ctx').split(' ').forEach(function (id) {
        var p = pos[id], c = ctxById(id);
        if (!p) return;
        var dx = (p.x - xs) * 0.5;
        html += '<path class="slink" data-s="' + s.getAttribute('data-skill') + '" data-c="' + id + '" style="--lc:var(--c-' + c.kind + ');--d:' + (k++ * 0.022).toFixed(3) + 's"' +
          ' d="M' + x0.toFixed(1) + ' ' + y1.toFixed(1) + 'H' + xs.toFixed(1) + 'C' + (xs + dx).toFixed(1) + ' ' + y1.toFixed(1) + ' ' + (p.x - dx).toFixed(1) + ' ' + p.y.toFixed(1) + ' ' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + '"/>';
      });
    });
    svg.innerHTML = html;
    $$('.slink', svg).forEach(function (p) { p.style.setProperty('--len', Math.ceil(p.getTotalLength() + 2)); });
    applyFocus();
  }

  function applyFocus() {
    var wrap = $('[data-skills]');
    if (!wrap) return;
    var f = focus.hover || focus.pin;
    wrap.classList.toggle('has-focus', !!f);
    var skillCtx = f && f.type === 'skill' ? $('[data-skill="' + f.id + '"]', wrap).getAttribute('data-ctx').split(' ') : [];
    $$('.skill', wrap).forEach(function (el) {
      var on = !!f && (f.type === 'skill' ? el.getAttribute('data-skill') === f.id : el.getAttribute('data-ctx').split(' ').indexOf(f.id) > -1);
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', focus.pin && focus.pin.type === 'skill' && focus.pin.id === el.getAttribute('data-skill') ? 'true' : 'false');
    });
    $$('.ctx', wrap).forEach(function (el) {
      var id = el.getAttribute('data-ctx-id');
      var on = !!f && (f.type === 'ctx' ? id === f.id : skillCtx.indexOf(id) > -1);
      el.classList.toggle('is-on', on);
      el.setAttribute('aria-pressed', focus.pin && focus.pin.type === 'ctx' && focus.pin.id === id ? 'true' : 'false');
    });
    $$('.slink', wrap).forEach(function (el) {
      var on = !!f && (f.type === 'skill' ? el.getAttribute('data-s') === f.id : el.getAttribute('data-c') === f.id);
      el.classList.toggle('is-on', on);
    });
  }

  function initSkills() {
    var wrap = $('[data-skills]');
    if (!wrap) return;
    function key(el) {
      return el.classList.contains('skill') ? { type: 'skill', id: el.getAttribute('data-skill') } : { type: 'ctx', id: el.getAttribute('data-ctx-id') };
    }
    if (FINE) {
      wrap.addEventListener('pointerover', function (e) {
        var el = e.target.closest('.skill, .ctx');
        if (el) { focus.hover = key(el); applyFocus(); }
      });
      wrap.addEventListener('pointerout', function (e) {
        var el = e.target.closest('.skill, .ctx');
        if (el && !el.contains(e.relatedTarget)) { focus.hover = null; applyFocus(); }
      });
    }
    wrap.addEventListener('click', function (e) {
      var el = e.target.closest('.skill, .ctx');
      if (!el) return;
      var k = key(el);
      focus.pin = focus.pin && focus.pin.type === k.type && focus.pin.id === k.id ? null : k;
      applyFocus();
    });
    wrap.addEventListener('focusin', function (e) {
      var el = e.target.closest('.skill, .ctx');
      if (el && el.matches(':focus-visible')) { focus.hover = key(el); applyFocus(); }
    });
    wrap.addEventListener('focusout', function () { focus.hover = null; applyFocus(); });
    drawLinks();
    relayouts.push(drawLinks);
  }

  /* ---------- Monde ---------- */
  function initWorld() {
    var host = $('[data-map]');
    if (!host || !window.WorldMap) return;
    var places = C.world.places, cur = -1;
    var yearEl = $('[data-map-year]'), whereEl = $('[data-map-where]'), steps = $$('.step');
    function where(k) {
      var p = places[k];
      return '<b>' + p.code + ' · ' + esc(p.city) + '</b>' + esc(t(p.country));
    }
    worldMap = window.WorldMap({
      host: host,
      places: places,
      label: t(C.ui.mapLabel),
      onUpdate: function (idx, year, flying, at) {
        yearEl.textContent = Math.round(year);
        if (idx !== cur) { cur = idx; whereEl.innerHTML = where(idx); }
        steps.forEach(function (s, i) {
          s.classList.toggle('is-on', i === idx && !flying);
          s.classList.toggle('is-past', i <= at && !(i === idx && !flying));
        });
      }
    });
    if (!worldMap) return;
    refreshers.push(function () { if (cur >= 0) whereEl.innerHTML = where(cur); });

    if (RM || !hasGsap) { worldMap.render(1); return; }
    var mm = gsap.matchMedia();
    mm.add('(min-width: 981px)', function () {
      var st = ScrollTrigger.create({
        trigger: '[data-world]',
        start: 'center center+=30',
        end: '+=170%',
        pin: true,
        onUpdate: function (s) { worldMap.render(s.progress); }
      });
      worldMap.render(st.progress);
      return function () { st.kill(); };
    });
    mm.add('(max-width: 980px)', function () {
      var state = { p: 0 };
      var tw = gsap.to(state, { p: 1, duration: 7, ease: 'none', paused: true, onUpdate: function () { worldMap.render(state.p); } });
      var st = ScrollTrigger.create({ trigger: '[data-world]', start: 'top 70%', once: true, onEnter: function () { tw.play(); } });
      worldMap.render(0);
      return function () { tw.kill(); st.kill(); };
    });
  }

  /* ---------- Profil : la phrase qui s'allume au défilement ---------- */
  var stmtP = 0;
  function lightStatement(p) {
    stmtP = p;
    var ws = $$('.statement .sw'), n = Math.round(p * ws.length * 1.08);
    ws.forEach(function (w, i) { w.classList.toggle('is-lit', i < n); });
  }
  function initStatement() {
    var el = $('[data-words]');
    if (!el) return;
    refreshers.push(function () { lightStatement(stmtP); });
    if (RM || !hasGsap) { lightStatement(1); return; }
    ScrollTrigger.create({ trigger: el, start: 'top 85%', end: 'bottom 45%', onUpdate: function (s) { lightStatement(s.progress); } });
  }

  /* ---------- Petites interactions ---------- */
  function toast(msg) {
    var el = $('[data-toast]');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }

  function copy(text, btn) {
    function done() {
      toast(t(C.ui.copied));
      if (btn) {
        btn.classList.add('is-done');
        var svg = btn.querySelector('svg');
        if (svg) svg.outerHTML = ICON.check;
        setTimeout(function () { var s = btn.querySelector('svg'); if (s) s.outerHTML = ICON.copy; btn.classList.remove('is-done'); }, 2000);
      }
    }
    if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); return; }
    fallback();
    function fallback() {
      var ta = doc.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      doc.body.appendChild(ta); ta.select();
      try { doc.execCommand('copy'); } catch (e) { /* tant pis */ }
      ta.remove(); done();
    }
  }

  var lbLast = null;
  function openLightbox(src, cap, from) {
    var lb = $('[data-lightbox]'), img = $('[data-lightbox-img]');
    lbLast = from;
    img.src = src; img.alt = cap;
    $('[data-lightbox-cap]').textContent = cap;
    lb.hidden = false;
    if (lenis) lenis.stop();
    $('.lightbox__close').focus();
  }
  function closeLightbox() {
    var lb = $('[data-lightbox]');
    if (lb.hidden) return;
    lb.hidden = true;
    if (lenis) lenis.start();
    if (lbLast) lbLast.focus();
  }

  function initMagnetic() {
    if (!FINE || RM || !hasGsap) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.28, y: (e.clientY - r.top - r.height / 2) * 0.42, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
      });
      el.addEventListener('pointerleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
      });
    });
  }

  function initPointerFx() {
    if (!FINE) return;
    // Projecteur des cartes
    doc.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (e.clientX - r.left).toFixed(0) + 'px');
      c.style.setProperty('--my', (e.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });

    // Le téléphone de Hemi s'incline vers la souris
    var stage = $('[data-tilt]');
    if (stage && !RM) {
      var phone = $('.phone', stage);
      stage.addEventListener('pointermove', function (e) {
        var r = stage.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        phone.style.setProperty('--ry', (px * 30).toFixed(2) + 'deg');
        phone.style.setProperty('--rx', (-py * 20).toFixed(2) + 'deg');
      });
      stage.addEventListener('pointerleave', function () {
        phone.style.removeProperty('--ry');
        phone.style.removeProperty('--rx');
      });
    }

    // L'aperçu flottant des projets archivés
    var pv = $('[data-preview]'), pimg = $('img', pv);
    var x = 0, y = 0, tx = 0, ty = 0, on = false, raf = 0;
    function loop() {
      var dx = tx - x;
      x += dx * 0.16; y += (ty - y) * 0.16;
      var left = x + 28;
      if (left + 200 > window.innerWidth) left = x - 228;
      pv.style.transform = 'translate3d(' + left.toFixed(1) + 'px,' + (y - 140).toFixed(1) + 'px,0) rotate(' + clamp(dx * 0.06, -7, 7).toFixed(2) + 'deg)';
      if (on || Math.abs(dx) > 0.3) raf = requestAnimationFrame(loop); else raf = 0;
    }
    $$('.arow').forEach(function (row) {
      row.addEventListener('pointerenter', function (e) {
        pimg.src = row.getAttribute('data-img');
        tx = e.clientX; ty = e.clientY;
        if (!on && !raf) { x = tx; y = ty; }
        on = true;
        pv.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(loop);
      });
      row.addEventListener('pointerleave', function () { on = false; pv.classList.remove('is-on'); });
    });
    window.addEventListener('pointermove', function (e) { tx = e.clientX; ty = e.clientY; }, { passive: true });
  }

  function initActions() {
    doc.addEventListener('click', function (e) {
      var el = e.target.closest('[data-action], [data-copy], [data-lightbox-src], [data-nps-switch]');
      if (!el) return;
      if (el.hasAttribute('data-copy')) return copy(el.getAttribute('data-copy'), el);
      if (el.hasAttribute('data-lightbox-src')) return openLightbox(el.getAttribute('data-lightbox-src'), el.getAttribute('data-lightbox-cap'), el);
      if (el.hasAttribute('data-nps-switch')) {
        var on = el.getAttribute('aria-checked') !== 'true';
        el.setAttribute('aria-checked', on ? 'true' : 'false');
        el.closest('.nps').classList.toggle('is-cvd', on);
        return;
      }
      switch (el.getAttribute('data-action')) {
        case 'theme': setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light'); break;
        case 'lang': setLang(lang === 'fr' ? 'en' : 'fr'); break;
        case 'menu': setMenu(!menuOpen); break;
        case 'console': if (sql) sql.open(); break;
        case 'console-close': if (sql) sql.close(); break;
        case 'lightbox-close': closeLightbox(); break;
        case 'top': scrollToEl($('#accueil'), 0); break;
      }
    });

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (!$('[data-lightbox]').hidden) closeLightbox();
        else if (menuOpen) setMenu(false);
        return;
      }
      var tag = (e.target.tagName || '').toLowerCase();
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
        e.preventDefault();
        if (sql) sql.toggle();
      }
    });

    // Le thème suit le système tant que le visiteur n'a rien choisi.
    var mq = window.matchMedia('(prefers-color-scheme: light)');
    var follow = function (ev) { if (!stored('am_theme')) setTheme(ev.matches ? 'light' : 'dark', false); };
    if (mq.addEventListener) mq.addEventListener('change', follow); else if (mq.addListener) mq.addListener(follow);
  }

  /* ---------- Console SQL : les tables viennent du contenu ---------- */
  function buildTables() {
    var fr = lang === 'fr';
    function L(a, b) { return fr ? a : b; }
    var S = C.skills, list = [];
    list.push({
      names: ['profil', 'profile'],
      cols: [L('nom', 'name'), 'role', L('ville', 'city'), 'email', L('langues', 'languages')],
      rows: [[C.person.first + ' ' + C.person.last, 'Data Analyst', C.person.location, C.person.email, 'fr, en, de']]
    });
    list.push({
      names: ['experiences', 'experience'],
      cols: [L('entreprise', 'company'), 'role', L('debut', 'start'), L('fin', 'end'), L('duree', 'duration')],
      rows: C.experience.map(function (e) { return [e.company, plain(e.role), e.start, e.end || L('en cours', 'ongoing'), dur(e.start, e.end)]; })
    });
    list.push({
      names: ['formation', 'education'],
      cols: [L('ecole', 'school'), L('diplome', 'degree'), L('debut', 'start'), L('fin', 'end')],
      rows: C.education.map(function (e) { return [e.school, plain(e.degree), e.start.slice(0, 4), e.end.slice(0, 4)]; })
    });
    list.push({
      names: ['projets', 'projects'],
      cols: [L('nom', 'name'), 'type', L('outils', 'tools'), L('lien', 'link')],
      rows: C.projects.featured.map(function (p) {
        return [plain(p.title), p.type || 'Projet', (p.tags || []).map(t).join(', '), (p.links && p.links[0] && p.links[0].href) || '—'];
      }).concat(C.projects.archive.map(function (a) { return [a.title, 'BUT', a.tools.map(t).join(', '), a.link.href]; }))
    });
    var skills = [];
    S.groups.forEach(function (g) {
      g.items.forEach(function (s) {
        skills.push([s.name, t(g.label), s.ctx.map(function (id) { return t(ctxById(id).label); }).join(', ')]);
      });
    });
    list.push({ names: ['competences', 'skills'], cols: [L('outil', 'tool'), L('categorie', 'category'), L('contextes', 'contexts')], rows: skills });
    list.push({ names: ['langues', 'languages'], cols: [L('langue', 'language'), L('niveau', 'level')], rows: C.world.languages.map(function (l) { return [t(l.name), t(l.label)]; }) });
    list.push({
      names: ['pays', 'countries'],
      cols: [L('ville', 'city'), L('pays', 'country'), L('debut', 'start'), L('fin', 'end')],
      rows: C.world.places.map(function (p) { return [p.city, t(p.country), p.from, p.to || L('auj.', 'today')]; })
    });
    list.push({ names: ['certifications'], cols: [L('nom', 'name'), L('organisme', 'issuer'), 'date'], rows: S.certifications.map(function (c) { return [c.name, c.issuer, c.date]; }) });
    list.push({ names: ['contact', 'contacts'], cols: [L('canal', 'channel'), L('valeur', 'value')], rows: [['email', C.person.email], ['linkedin', C.person.linkedin], ['github', C.person.github]] });
    return list;
  }

  function initConsole() {
    if (!window.SqlConsole) return;
    sql = window.SqlConsole($('[data-console]'), {
      lang: function () { return lang; },
      tables: buildTables,
      setTheme: function (m) { setTheme(m); },
      setLang: setLang,
      email: C.person.email,
      onOpen: function () { if (lenis) lenis.stop(); },
      onClose: function () { if (lenis) lenis.start(); }
    });
    refreshers.push(function () { sql.refresh(); });
  }

  /* ---------- Mise en page ---------- */
  function relayout() {
    relayouts.forEach(function (fn) { fn(); });
    if (hasGsap) ScrollTrigger.refresh();
  }

  /* ---------- Démarrage ---------- */
  function init() {
    renderAll();
    refreshI18n();
    initSmoothScroll();
    initHero();
    initNav();
    initActions();
    initStatement();
    observeReveals();
    initGantt();
    initSkills();
    initWorld();
    initMagnetic();
    initPointerFx();
    initConsole();

    window.addEventListener('resize', debounce(relayout, 160));
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () { relayout(); });
    window.addEventListener('load', function () { relayout(); });

    // Une ancre dans l'adresse (#projets…) : les sections n'existent qu'après le rendu.
    if (location.hash.length > 1) {
      var target = doc.getElementById(location.hash.slice(1));
      if (target) setTimeout(function () { scrollToEl(target, -84, true); }, 60);
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();
})();
