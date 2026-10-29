/* La console SQL : un petit moteur en lecture seule sur le contenu du site.
   On l'ouvre avec la touche « / » ou le bouton >_ de l'en-tête.
   Gère SHOW TABLES, DESCRIBE, SELECT … FROM … [WHERE … AND …] [ORDER BY …] [LIMIT n],
   COUNT(*), SET theme/lang, CLEAR, EXIT — et INSERT INTO contacts ouvre un e-mail. */
(function () {
  'use strict';

  var TEXT = {
    welcome: {
      fr: 'aymeric.db · console SQL en lecture seule.\nTapez HELP; ou cliquez une requête ci-dessus. Échap pour fermer.',
      en: 'aymeric.db · read-only SQL console.\nType HELP; or click a query above. Esc to close.'
    },
    help: {
      fr: 'Commandes :\n' +
        '  SHOW TABLES;                     liste des tables\n' +
        '  DESCRIBE <table>;                colonnes d’une table\n' +
        '  SELECT … FROM … [WHERE … AND …] [ORDER BY … DESC] [LIMIT n];\n' +
        '  SELECT COUNT(*) FROM <table>;\n' +
        '  SET theme = \'light\' | \'dark\';\n' +
        '  SET lang = \'fr\' | \'en\';\n' +
        '  INSERT INTO contacts VALUES (\'votre message\');\n' +
        '  CLEAR;   EXIT;\n' +
        '↑ ↓ historique · Tab complète · LIKE \'%motif%\' accepté.',
      en: 'Commands:\n' +
        '  SHOW TABLES;                     list tables\n' +
        '  DESCRIBE <table>;                a table’s columns\n' +
        '  SELECT … FROM … [WHERE … AND …] [ORDER BY … DESC] [LIMIT n];\n' +
        '  SELECT COUNT(*) FROM <table>;\n' +
        '  SET theme = \'light\' | \'dark\';\n' +
        '  SET lang = \'fr\' | \'en\';\n' +
        '  INSERT INTO contacts VALUES (\'your message\');\n' +
        '  CLEAR;   EXIT;\n' +
        '↑ ↓ history · Tab completes · LIKE \'%pattern%\' supported.'
    },
    rows: { fr: function (n, ms) { return n + (n > 1 ? ' lignes' : ' ligne') + ' (' + ms + ' ms)'; }, en: function (n, ms) { return n + (n === 1 ? ' row' : ' rows') + ' in set (' + ms + ' ms)'; } },
    empty: { fr: 'Ensemble vide', en: 'Empty set' },
    noTable: { fr: 'ERREUR 1146 : la table « %s » n’existe pas. Essayez SHOW TABLES;', en: 'ERROR 1146: table \'%s\' doesn\'t exist. Try SHOW TABLES;' },
    noCol: { fr: 'ERREUR 1054 : colonne inconnue « %s ». Essayez DESCRIBE %t;', en: 'ERROR 1054: unknown column \'%s\'. Try DESCRIBE %t;' },
    syntax: { fr: 'ERREUR 1064 : erreur de syntaxe près de « %s ». Tapez HELP;', en: 'ERROR 1064: syntax error near \'%s\'. Type HELP;' },
    readonly: { fr: 'ERREUR 1142 : base en lecture seule. Bien essayé 😉', en: 'ERROR 1142: read-only database. Nice try 😉' },
    inserted: { fr: 'Requête OK, 1 ligne insérée. Ouverture de votre messagerie…', en: 'Query OK, 1 row affected. Opening your mail app…' },
    set: { fr: 'Requête OK. %s = \'%v\'', en: 'Query OK. %s = \'%v\'' },
    badValue: { fr: 'ERREUR 1231 : valeur « %v » invalide pour %s.', en: 'ERROR 1231: invalid value \'%v\' for %s.' },
    who: { fr: 'visiteur@aymeric.db — merci de votre curiosité !', en: 'visitor@aymeric.db — thanks for being curious!' },
    subject: { fr: 'Message depuis votre portfolio', en: 'Message from your portfolio' }
  };

  var CHIPS = {
    fr: ['SHOW TABLES;', 'SELECT * FROM experiences;', 'SELECT outil, contextes FROM competences WHERE contextes LIKE \'%BNP%\';', 'SELECT ville, debut, fin FROM pays ORDER BY debut;', 'DESCRIBE projets;', 'INSERT INTO contacts VALUES (\'Bonjour Aymeric !\');'],
    en: ['SHOW TABLES;', 'SELECT * FROM experience;', 'SELECT tool, contexts FROM skills WHERE contexts LIKE \'%BNP%\';', 'SELECT city, start, end FROM countries ORDER BY start;', 'DESCRIBE projects;', 'INSERT INTO contacts VALUES (\'Hello Aymeric!\');']
  };

  var KEYWORDS = ['SELECT', 'FROM', 'WHERE', 'AND', 'ORDER', 'BY', 'LIMIT', 'LIKE', 'DESC', 'ASC', 'SHOW', 'TABLES', 'DESCRIBE', 'COUNT(*)', 'HELP', 'CLEAR', 'EXIT', 'SET', 'INSERT', 'INTO', 'VALUES'];

  // Sans accents ni majuscules : « début » = « debut » = « DEBUT ».
  function norm(s) { return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function sub(s, map) { return s.replace(/%(\w)/g, function (m, k) { return map[k] != null ? map[k] : m; }); }

  function asciiTable(cols, rows) {
    var MAX = 46;
    var cells = [cols].concat(rows).map(function (r) {
      return r.map(function (v) {
        var s = v == null ? 'NULL' : String(v);
        return s.length > MAX ? s.slice(0, MAX - 1) + '…' : s;
      });
    });
    var w = cols.map(function (_, i) { return Math.max.apply(null, cells.map(function (r) { return r[i].length; })); });
    var line = '+' + w.map(function (n) { return new Array(n + 3).join('-'); }).join('+') + '+';
    function row(r) { return '| ' + r.map(function (v, i) { return v + new Array(w[i] - v.length + 1).join(' '); }).join(' | ') + ' |'; }
    return [line, row(cells[0]), line].concat(cells.slice(1).map(row)).concat(rows.length ? [line] : []).join('\n');
  }

  function cmp(a, b) {
    var na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb) && String(na) === String(a).trim() && String(nb) === String(b).trim()) return na - nb;
    return norm(a) < norm(b) ? -1 : norm(a) > norm(b) ? 1 : 0;
  }

  // api : { lang(), tables(), setTheme(m), setLang(l), email, onOpen(), onClose() }
  window.SqlConsole = function (root, api) {
    var out = root.querySelector('[data-console-out]');
    var form = root.querySelector('[data-console-form]');
    var input = root.querySelector('[data-console-input]');
    var chips = root.querySelector('[data-console-chips]');
    var history = [], hi = 0, greeted = false, lastFocus = null;

    function L(key) { var o = TEXT[key]; return o[api.lang()] || o.fr; }

    function block(text, cls, tag) {
      var d = document.createElement(tag || 'div');
      d.className = (tag === 'pre' ? 'tbl' : 'blk') + (cls ? ' ' + cls : '');
      d.textContent = text;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
      return d;
    }
    function table(cols, rows, t0) {
      var ms = (performance.now() - t0).toFixed(1);
      if (!rows.length) { block(asciiTable(cols, []), '', 'pre'); block(L('empty') + ' (' + ms + ' ms)', 'dim'); return; }
      block(asciiTable(cols, rows), '', 'pre');
      block(L('rows')(rows.length, ms), 'dim');
    }
    function err(msg) { block(msg, 'err'); }

    function tables() { return api.tables(); }
    function findTable(name) {
      var n = norm(name);
      return tables().filter(function (t) { return t.names.some(function (x) { return norm(x) === n; }); })[0];
    }
    function colIndex(tb, name) {
      var n = norm(name).replace(/^[`"']|[`"']$/g, '');
      for (var i = 0; i < tb.cols.length; i++) if (norm(tb.cols[i]) === n) return i;
      return -1;
    }

    function parseValue(v) {
      v = v.trim();
      var m = /^'([\s\S]*)'$/.exec(v) || /^"([\s\S]*)"$/.exec(v);
      if (m) return m[1];
      if (/^-?\d+(\.\d+)?$/.test(v)) return v;
      return null;
    }

    function where(expr, tb) {
      var parts = expr.split(/\s+and\s+/i), tests = [];
      for (var i = 0; i < parts.length; i++) {
        var m = /^([^\s=<>!]+)\s*(=|!=|<>|>=|<=|>|<|not\s+like|like)\s*([\s\S]+)$/i.exec(parts[i].trim());
        if (!m) return { error: sub(L('syntax'), { s: parts[i].trim() }) };
        var ci = colIndex(tb, m[1]);
        if (ci < 0) return { error: sub(L('noCol'), { s: m[1], t: tb.names[0] }) };
        var val = parseValue(m[3]);
        if (val == null) return { error: sub(L('syntax'), { s: m[3].trim() }) };
        tests.push((function (ci, op, val) {
          op = op.toLowerCase().replace(/\s+/g, ' ');
          if (op === 'like' || op === 'not like') {
            var re = new RegExp('^' + norm(val).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/%/g, '.*').replace(/_/g, '.') + '$');
            return function (r) { var ok = re.test(norm(r[ci])); return op === 'like' ? ok : !ok; };
          }
          return function (r) {
            var c = cmp(r[ci], val);
            return op === '=' ? c === 0 : op === '!=' || op === '<>' ? c !== 0 : op === '>' ? c > 0 : op === '<' ? c < 0 : op === '>=' ? c >= 0 : c <= 0;
          };
        })(ci, m[2], val));
      }
      return { tests: tests };
    }

    function select(q, t0) {
      var m = /^select\s+([\s\S]+?)\s+from\s+([^\s;]+)(?:\s+where\s+([\s\S]+?))?(?:\s+order\s+by\s+([^\s]+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?$/i.exec(q);
      if (!m) {
        var lit = /^select\s+([\s\S]+)$/i.exec(q);
        return literal(lit ? lit[1].trim() : q, t0);
      }
      var tb = findTable(m[2]);
      if (!tb) return err(sub(L('noTable'), { s: m[2] }));
      var rows = tb.rows.slice();
      if (m[3]) {
        var w = where(m[3], tb);
        if (w.error) return err(w.error);
        rows = rows.filter(function (r) { return w.tests.every(function (fn) { return fn(r); }); });
      }
      if (m[4]) {
        var oi = colIndex(tb, m[4]);
        if (oi < 0) return err(sub(L('noCol'), { s: m[4], t: tb.names[0] }));
        var dir = m[5] && /desc/i.test(m[5]) ? -1 : 1;
        rows.sort(function (a, b) { return cmp(a[oi], b[oi]) * dir; });
      }
      if (m[6]) rows = rows.slice(0, +m[6]);

      var want = m[1].trim();
      if (/^count\(\s*\*\s*\)$/i.test(want)) return table(['COUNT(*)'], [[rows.length]], t0);
      var idx = [], names = [];
      if (want === '*') {
        tb.cols.forEach(function (c, i) { idx.push(i); names.push(c); });
      } else {
        var cols = want.split(',');
        for (var i = 0; i < cols.length; i++) {
          var ci = colIndex(tb, cols[i]);
          if (ci < 0) return err(sub(L('noCol'), { s: cols[i].trim(), t: tb.names[0] }));
          idx.push(ci); names.push(tb.cols[ci]);
        }
      }
      table(names, rows.map(function (r) { return idx.map(function (i) { return r[i]; }); }), t0);
    }

    // SELECT sans FROM : une chaîne, un calcul, NOW(), USER()…
    function literal(expr, t0) {
      var m = /^'([\s\S]*)'$/.exec(expr) || /^"([\s\S]*)"$/.exec(expr);
      if (m) return table([expr], [[m[1]]], t0);
      if (/^now\(\)$/i.test(expr)) return table(['NOW()'], [[new Date().toLocaleString(api.lang() === 'fr' ? 'fr-FR' : 'en-US')]], t0);
      if (/^(user|current_user)\(\)$/i.test(expr)) return table([expr.toUpperCase()], [[L('who')]], t0);
      if (/^(version|database)\(\)$/i.test(expr)) return table([expr.toUpperCase()], [['aymeric.db 2026']], t0);
      if (/^[\d\s+\-*/().]+$/.test(expr) && /\d/.test(expr)) {
        try {
          // Seuls des chiffres et des opérateurs passent le filtre ci-dessus.
          var v = Function('"use strict"; return (' + expr + ');')();
          if (typeof v === 'number' && isFinite(v)) return table([expr], [[+v.toFixed(6)]], t0);
        } catch (e) { /* on retombe sur l'erreur de syntaxe */ }
      }
      err(sub(L('syntax'), { s: expr.slice(0, 40) }));
    }

    function run(raw) {
      var q = raw.trim().replace(/;+\s*$/, '').trim();
      if (!q) return;
      block('sql> ' + raw.trim(), 'in');
      var t0 = performance.now();
      var low = q.toLowerCase();
      var m;

      if (/^(help|aide|\?|\\h)$/.test(low)) return block(L('help'), 'info');
      if (/^(clear|cls|effacer)$/.test(low)) { out.innerHTML = ''; return; }
      if (/^(exit|quit|quitter|close|\\q)$/.test(low)) return close();
      if (/^(whoami|select\s+user\(\))$/.test(low)) return block(L('who'), 'info');
      if (/^show\s+tables$/.test(low) || low === '\\dt' || low === '.tables') {
        var names = tables().map(function (t) { return [t.names[api.lang() === 'en' && t.names[1] ? 1 : 0]]; });
        return table(['Tables_in_aymeric'], names, t0);
      }
      if ((m = /^(?:describe|desc)\s+([^\s]+)$/i.exec(q))) {
        var tb = findTable(m[1]);
        if (!tb) return err(sub(L('noTable'), { s: m[1] }));
        return table(['Field', 'Type'], tb.cols.map(function (c, i) {
          var sample = tb.rows[0] ? tb.rows[0][i] : '';
          return [c, typeof sample === 'number' ? 'INT' : 'VARCHAR(255)'];
        }), t0);
      }
      if ((m = /^set\s+(theme|lang|langue|language)\s*=\s*['"]?(\w+)['"]?$/i.exec(q))) {
        var key = /^th/i.test(m[1]) ? 'theme' : 'lang', val = m[2].toLowerCase();
        var ok = key === 'theme' ? /^(light|dark|clair|sombre)$/.test(val) : /^(fr|en)$/.test(val);
        if (!ok) return err(sub(L('badValue'), { s: key, v: val }));
        if (val === 'clair') val = 'light';
        if (val === 'sombre') val = 'dark';
        if (key === 'theme') api.setTheme(val); else api.setLang(val);
        block(sub(L('set'), { s: key, v: val }), 'info');
        return;
      }
      if ((m = /^insert\s+into\s+contacts?\b[\s\S]*?values\s*\(([\s\S]*)\)$/i.exec(q))) {
        var msg = m[1].split(/'\s*,\s*'/).join(' — ').replace(/^['"]|['"]$/g, '');
        block(L('inserted'), 'info');
        setTimeout(function () {
          location.href = 'mailto:' + api.email + '?subject=' + encodeURIComponent(L('subject')) + '&body=' + encodeURIComponent(msg);
        }, 500);
        return;
      }
      if (/^(insert|update|delete|drop|alter|truncate|create|grant|revoke|replace|rename)\b/i.test(q)) return err(L('readonly'));
      if (/^select\b/i.test(q)) return select(q, t0);
      err(sub(L('syntax'), { s: q.split(/\s+/).slice(0, 3).join(' ') }));
    }

    function complete() {
      var v = input.value, caret = input.selectionStart;
      var before = v.slice(0, caret), word = /([^\s,(]*)$/.exec(before)[1];
      if (!word) return;
      var pool = KEYWORDS.slice();
      tables().forEach(function (t) {
        pool = pool.concat(t.names);
        pool = pool.concat(t.cols);
      });
      var w = norm(word);
      var hits = pool.filter(function (x, i) { return norm(x).indexOf(w) === 0 && pool.indexOf(x) === i; });
      if (!hits.length) return;
      var pick = hits[0];
      if (hits.length > 1) {
        // Préfixe commun, sinon on montre les possibilités.
        var pre = hits.reduce(function (a, b) { var i = 0; while (i < a.length && i < b.length && norm(a[i]) === norm(b[i])) i++; return a.slice(0, i); });
        if (pre.length <= word.length) { block(hits.join('   '), 'dim'); return; }
        pick = pre;
      }
      var isKw = /^[A-Z(*)]+$/.test(pick);
      var rep = isKw && word === word.toLowerCase() ? pick.toLowerCase() : pick;
      input.value = before.slice(0, before.length - word.length) + rep + (hits.length === 1 ? ' ' : '') + v.slice(caret);
      var pos = before.length - word.length + rep.length + (hits.length === 1 ? 1 : 0);
      input.setSelectionRange(pos, pos);
    }

    function renderChips() {
      chips.innerHTML = '';
      (CHIPS[api.lang()] || CHIPS.fr).forEach(function (q) {
        var b = document.createElement('button');
        b.type = 'button';
        b.textContent = q;
        b.addEventListener('click', function () { exec(q); input.focus(); });
        chips.appendChild(b);
      });
    }

    function exec(q) {
      history.push(q);
      hi = history.length;
      run(q);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value;
      input.value = '';
      exec(q);
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        if (hi > 0) { hi--; input.value = history[hi]; }
        e.preventDefault();
      } else if (e.key === 'ArrowDown') {
        if (hi < history.length - 1) { hi++; input.value = history[hi]; } else { hi = history.length; input.value = ''; }
        e.preventDefault();
      } else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        complete();
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.innerHTML = '';
      }
    });

    out.addEventListener('mouseup', function () {
      if (!String(window.getSelection())) input.focus();
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    document.addEventListener('focusin', function (e) {
      if (!root.hidden && !root.contains(e.target)) input.focus();
    });

    function open() {
      if (!root.hidden) return;
      lastFocus = document.activeElement;
      root.hidden = false;
      renderChips();
      if (!greeted) { greeted = true; block(L('welcome'), 'dim'); }
      if (api.onOpen) api.onOpen();
      setTimeout(function () { input.focus(); }, 30);
    }
    function close() {
      if (root.hidden) return;
      root.hidden = true;
      if (api.onClose) api.onClose();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    return {
      open: open,
      close: close,
      toggle: function () { if (root.hidden) open(); else close(); },
      isOpen: function () { return !root.hidden; },
      refresh: function () { if (!root.hidden) renderChips(); }
    };
  };
})();
