/* ==========================================================================
   visuals.js — reine Render-Logik
   --------------------------------------------------------------------------
   Keine Fachlogik, kein Speicherzugriff, kein Pyodide. Alles hier bekommt
   Daten hinein und liefert DOM / Animationen heraus.

   Inhalt
     1. DOM-Helfer              h(), sleep()
     2. Syntax-Highlighting     highlight()
     3. Code-Editor             codeEditor()
     4. Progress-Ringe          ring(), renderDashboard()
     5. Effekte                 burst()
     6. Szenen (Modus A)        scenes.stepper / typeLab / receipt /
                                scenes.thermostat / loopLab / loginLoop
   ========================================================================== */

const Visuals = (() => {
  'use strict';

  /* ------------------------------------------------------------ 1. Helfer */

  /** Mini-Hyperscript: h('div.card#id', { onclick }, 'Text', child…) */
  function h(sel, attrs, ...kids) {
    const [, tag = 'div'] = /^([a-z0-9]+)?/i.exec(sel) || [];
    const el = document.createElement(tag);
    const id = /#([\w-]+)/.exec(sel);
    if (id) el.id = id[1];
    const cls = sel.match(/\.[\w-]+/g);
    if (cls) el.className = cls.map((c) => c.slice(1)).join(' ');
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      kids.unshift(attrs);
      attrs = null;
    }
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'class') el.className += ' ' + v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    const add = (k) => {
      if (k == null || k === false) return;
      if (Array.isArray(k)) k.forEach(add);
      else el.append(k instanceof Node ? k : document.createTextNode(String(k)));
    };
    kids.forEach(add);
    return el;
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const prefersReduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------- 2. Syntax-Highlighting */

  const KEYWORDS = 'and as assert break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield True False None';
  const BUILTINS = 'print len range int float str bool list dict set tuple type sum min max abs round sorted enumerate zip input isinstance divmod append';
  const TOKEN = new RegExp(
    [
      '(#.*)',                                                                // 1 Kommentar
      '((?:f|r|b)?(?:"""[\\s\\S]*?"""|\'\'\'[\\s\\S]*?\'\'\'|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'))', // 2 String
      '\\b(' + KEYWORDS.replace(/ /g, '|') + ')\\b',                          // 3 Keyword
      '\\b(' + BUILTINS.replace(/ /g, '|') + ')\\b(?=\\()',                  // 4 Builtin-Aufruf
      '(\\b\\d+(?:\\.\\d+)?\\b)',                                             // 5 Zahl
      '(\\b[A-Za-z_]\\w*)(?=\\()',                                            // 6 Funktionsaufruf
    ].join('|'),
    'g',
  );

  /** Python-Quelltext → HTML mit <span class="t-…">. */
  function highlight(src) {
    let out = '';
    let last = 0;
    src.replace(TOKEN, (m, com, str, kw, bi, num, fn, idx) => {
      out += esc(src.slice(last, idx));
      const cls = com ? 'com' : str ? 'str' : kw ? 'kw' : bi ? 'bi' : num ? 'num' : 'fn';
      out += `<span class="t-${cls}">${esc(m)}</span>`;
      last = idx + m.length;
      return m;
    });
    return out + esc(src.slice(last));
  }

  /* ------------------------------------------------------ 3. Code-Editor */

  /**
   * Textarea über einer gefärbten <pre>-Ebene.
   * opts: { value, minLines, onRun(), onChange(value) }
   * Rückgabe: { el, getValue(), setValue(v), focus() }
   */
  function codeEditor(opts = {}) {
    const minLines = opts.minLines || 8;
    const gutter = h('div.ed-gutter', { 'aria-hidden': 'true' });
    const code = h('code');
    const pre = h('pre.ed-hl', { 'aria-hidden': 'true' }, code);
    const ta = h('textarea.ed-input', {
      spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off',
      'aria-label': 'Python-Code',
    });
    const el = h('div.editor', gutter, h('div.ed-body', pre, ta));

    function paint() {
      const v = ta.value;
      const lines = Math.max(minLines, v.split('\n').length);
      code.innerHTML = highlight(v) + '\n';
      gutter.innerHTML = Array.from({ length: lines }, (_, i) => `<span>${i + 1}</span>`).join('');
      el.style.setProperty('--lines', lines);
    }
    function syncScroll() {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
      gutter.scrollTop = ta.scrollTop;
    }

    ta.addEventListener('input', () => { paint(); opts.onChange && opts.onChange(ta.value); });
    ta.addEventListener('scroll', syncScroll);
    ta.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        opts.onRun && opts.onRun();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        insert('    ');
      } else if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        const before = ta.value.slice(0, ta.selectionStart);
        const line = before.slice(before.lastIndexOf('\n') + 1);
        const indent = /^ */.exec(line)[0] + (/:\s*(#.*)?$/.test(line) ? '    ' : '');
        insert('\n' + indent);
      }
    });
    function insert(text) {
      const { selectionStart: s, selectionEnd: e, value } = ta;
      ta.value = value.slice(0, s) + text + value.slice(e);
      ta.selectionStart = ta.selectionEnd = s + text.length;
      ta.dispatchEvent(new Event('input'));
    }

    ta.value = opts.value || '';
    paint();
    return {
      el,
      getValue: () => ta.value,
      setValue(v) { ta.value = v; paint(); syncScroll(); },
      focus: () => ta.focus(),
    };
  }

  /* ----------------------------------------------- 4. Ringe & Dashboard */

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    return n;
  };

  /**
   * Animierter Progress-Ring.
   * Rückgabe: { el, set(pct) } — set() animiert per CSS-Transition.
   */
  function ring({ size = 64, stroke = 6, pct = 0, label = true, dim = false, big = false }) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    const track = svg('circle', { cx: size / 2, cy: size / 2, r, class: 'ring-track', 'stroke-width': stroke });
    const bar = svg('circle', {
      cx: size / 2, cy: size / 2, r, class: 'ring-bar', 'stroke-width': stroke,
      'stroke-dasharray': c, 'stroke-dashoffset': c, 'stroke-linecap': 'round',
    });
    const s = svg('svg', { viewBox: `0 0 ${size} ${size}`, width: size, height: size });
    s.append(track, bar);
    const num = h('span.ring-num', '0');
    const el = h('div.ring' + (big ? '.ring-big' : '') + (dim ? '.ring-dim' : ''), { style: { width: size + 'px', height: size + 'px' } }, s, label && num);

    let raf = 0;
    function set(p) {
      bar.style.strokeDashoffset = c * (1 - p / 100);
      cancelAnimationFrame(raf);
      const from = parseInt(num.textContent, 10) || 0;
      const t0 = performance.now();
      const dur = prefersReduced() ? 0 : 900;
      const tick = (t) => {
        const k = dur ? Math.min(1, (t - t0) / dur) : 1;
        num.textContent = Math.round(from + (p - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    if (pct != null) requestAnimationFrame(() => requestAnimationFrame(() => set(pct)));
    return { el, set };
  }

  /**
   * Dashboard-Startseite.
   * data: { global, available, stats:{tasksDone,tasksTotal,scenesDone,scenesTotal}, topics:[{topic,pct,done,total}], next }
   * handlers: { onOpen(topicId), onReset() }
   */
  function renderDashboard(root, data, handlers) {
    root.innerHTML = '';
    const heroRing = ring({ size: 188, stroke: 12, pct: data.global, big: true });
    heroRing.el.append(h('span.ring-sub', 'gesamt'));

    const stat = (value, label) => h('div.stat', h('strong', value), h('span', label));
    const hero = h('section.dash-hero',
      h('div.dash-hero-ring', heroRing.el),
      h('div.dash-hero-text',
        h('p.eyebrow', 'Lernfortschritt'),
        h('h1', 'Dein Weg durch Python'),
        h('p.muted', `${data.available} von ${data.topics.length} Modulen sind spielbar. Jede entdeckte Szene, jede gelöste Aufgabe und jede Sandbox-Session füllt die Ringe.`),
        h('div.stats',
          stat(`${data.stats.tasksDone}/${data.stats.tasksTotal}`, 'Aufgaben gelöst'),
          stat(`${data.stats.scenesDone}/${data.stats.scenesTotal}`, 'Szenen entdeckt'),
          stat(`${data.stats.modulesDone}/${data.available}`, 'Module fertig'),
        ),
        h('div.dash-actions',
          data.next && h('button.btn.btn-primary', { onclick: () => handlers.onOpen(data.next.id) },
            data.stats.tasksDone + data.stats.scenesDone === 0 ? 'Jetzt starten' : 'Weiterlernen',
            h('span.btn-sub', data.next.title)),
          h('button.btn.btn-ghost', { onclick: handlers.onReset }, 'Fortschritt zurücksetzen'),
        ),
      ),
    );

    const grid = h('div.ring-grid');
    data.topics.forEach(({ topic, pct, done, total }, i) => {
      const soonTopic = topic.status === 'soon';
      const rg = ring({ size: 76, stroke: 6, pct: soonTopic ? 0 : pct, dim: soonTopic });
      const tile = h('button.tile' + (soonTopic ? '.tile-soon' : ''),
        { style: { '--i': i }, onclick: () => handlers.onOpen(topic.id), title: topic.title },
        rg.el,
        h('div.tile-text',
          h('span.tile-icon', topic.icon),
          h('strong', topic.title),
          h('small', soonTopic ? 'bald verfügbar' : `${done}/${total} Schritte`),
        ),
      );
      grid.append(tile);
    });

    root.append(hero, h('h2.section-title', 'Alle Module'), grid);
  }

  /* ------------------------------------------------------------ 5. Effekte */

  /** Funkenregen aus der Mitte eines Elements. */
  function burst(target) {
    if (prefersReduced()) return;
    const r = target.getBoundingClientRect();
    const layer = h('div.burst', { style: { left: r.left + r.width / 2 + 'px', top: r.top + r.height / 2 + 'px' } });
    document.body.append(layer);
    for (let i = 0; i < 26; i++) {
      const a = (Math.PI * 2 * i) / 26 + Math.random() * 0.4;
      const d = 60 + Math.random() * 110;
      const p = h('i');
      layer.append(p);
      p.animate(
        [
          { transform: 'translate(0,0) scale(1)', opacity: 1 },
          { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 30}px) scale(0)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' },
      );
    }
    setTimeout(() => layer.remove(), 1300);
  }

  /* ---------------------------------------------------- 6. Szenen: Basis */

  /** Gemeinsame Bedienleiste: Schritt / Auto / Reset + Fortschrittsbalken. */
  function controlBar({ total, onStep, onReset, interval = 1250 }) {
    let timer = null;
    let index = 0;
    const bar = h('i');
    const btnStep = h('button.btn.btn-primary', { onclick: () => step(true) }, '▶ Schritt');
    const btnAuto = h('button.btn.btn-ghost', { onclick: toggleAuto }, 'Auto-Play');
    const btnReset = h('button.btn.btn-ghost', { onclick: reset }, '↺ Neu');
    const el = h('div.controls', btnStep, btnAuto, btnReset, h('div.progress', bar));

    function paint() {
      bar.style.width = (total ? (index / total) * 100 : 0) + '%';
      btnStep.disabled = index >= total;
      if (index >= total) stopAuto();
    }
    function step(manual) {
      if (index >= total) return;
      if (manual) stopAuto();
      onStep(index++);
      paint();
    }
    function toggleAuto() {
      if (timer) return stopAuto();
      if (index >= total) reset();
      btnAuto.textContent = 'Pause';
      btnAuto.classList.add('is-on');
      timer = setInterval(() => step(false), interval);
      step(false);
    }
    function stopAuto() {
      clearInterval(timer);
      timer = null;
      btnAuto.textContent = 'Auto-Play';
      btnAuto.classList.remove('is-on');
    }
    function reset() {
      stopAuto();
      index = 0;
      onReset();
      paint();
    }
    paint();
    return { el, destroy: stopAuto, reset, setTotal(n) { total = n; paint(); } };
  }

  /** Fliegender Chip: animiert einen Wert von Quelle zu Ziel. */
  function flyChip(layer, from, to, text, type) {
    if (prefersReduced() || !from || !to) return Promise.resolve();
    const L = layer.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const chip = h('span.chip.type-' + type, { style: { left: a.left - L.left + 'px', top: a.top - L.top + 'px' } }, text);
    layer.append(chip);
    const dx = b.left - a.left + 14;
    const dy = b.top - a.top + 10;
    const anim = chip.animate(
      [
        { transform: 'translate(0,0) scale(.9)', opacity: 0 },
        { transform: `translate(${dx * 0.3}px, ${dy * 0.3 - 26}px) scale(1.1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy}px) scale(.8)`, opacity: 0.2 },
      ],
      { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' },
    );
    return anim.finished.then(() => chip.remove()).catch(() => chip.remove());
  }

  const scenes = {};

  /* ------------------------------------------------- Szene: Stepper */

  scenes.stepper = (root, cfg, ctx) => {
    const lineEls = cfg.lines.map((l, i) => h('div.code-line', { 'data-i': i }, h('span.ln', i + 1), h('span.src', { html: highlight(l) })));
    const mem = h('div.mem');
    const out = h('div.console-out');
    const note = h('p.step-note', 'Drücke ▶ Schritt, um die erste Zeile auszuführen.');
    const layer = h('div.fly-layer');
    const cards = {};

    function setVar(name, [value, type]) {
      let card = cards[name];
      if (!card) {
        card = {
          el: h('div.var'),
          val: h('span.var-val'),
          old: h('s.var-old'),
          type: h('em.var-type'),
        };
        card.el.append(h('span.var-name', name), card.val, card.old, card.type);
        cards[name] = card;
        mem.append(card.el);
      }
      const prev = card.val.textContent;
      card.old.textContent = prev && prev !== value ? prev : '';
      card.val.textContent = value;
      card.type.textContent = type;
      card.type.className = 'var-type type-' + type;
      card.el.classList.remove('pop');
      void card.el.offsetWidth;
      card.el.classList.add('pop');
      return card.el;
    }

    const ctl = controlBar({
      total: cfg.steps.length,
      onStep(i) {
        ctx.touch();
        const s = cfg.steps[i];
        lineEls.forEach((l) => l.classList.remove('is-active'));
        const line = lineEls[s.line];
        line.classList.add('is-active');
        if (s.set) {
          for (const [name, val] of Object.entries(s.set)) {
            const target = setVar(name, val);
            flyChip(layer, line.querySelector('.src'), target, val[0], val[1]);
          }
        }
        if (s.out) {
          const row = h('div.out-line', s.out);
          out.append(row);
          row.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 300 });
        }
        note.innerHTML = s.note;
        note.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
      },
      onReset() {
        lineEls.forEach((l) => l.classList.remove('is-active'));
        mem.innerHTML = '';
        out.innerHTML = '';
        Object.keys(cards).forEach((k) => delete cards[k]);
        note.textContent = 'Drücke ▶ Schritt, um die erste Zeile auszuführen.';
      },
    });

    root.append(
      h('div.scene-grid',
        h('div.panel.panel-code', h('div.panel-title', 'Programm'), h('div.code-block', lineEls)),
        h('div.panel', h('div.panel-title', 'Speicher'), mem, h('div.panel-title.mt', 'Konsole'), out),
      ),
      note, ctl.el, layer,
    );
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------- Szene: Typen-Labor */

  scenes.typeLab = (root, cfg, ctx) => {
    let selected = null;
    const log = h('div.type-log');
    const hint = h('p.step-note', 'Klicke einen Wert an, dann eine Umwandlung.');
    const fmtNum = (x) => (Number.isInteger(x) ? x.toFixed(1) : String(x));
    const repr = (v) => (typeof v === 'string' ? JSON.stringify(v) : v === true ? 'True' : v === false ? 'False' : String(v));
    const kindOf = (v) => (typeof v === 'string' ? 'str' : typeof v === 'boolean' ? 'bool' : v && v.f ? 'float' : 'int');

    // Werte intern: int = Number, float = {f:Number}, str = string, bool = boolean
    const toInternal = (item) => (item.kind === 'float' ? { f: item.raw } : item.raw);
    const num = (v) => (v && v.f !== undefined ? v.f : Number(v));
    const show = (v) => (v && v.f !== undefined ? fmtNum(v.f) : repr(v));

    const apply = {
      int(v) {
        if (typeof v === 'string') {
          if (/^\s*[+-]?\d+\s*$/.test(v)) return parseInt(v, 10);
          throw new Error(`ValueError: invalid literal for int(): ${JSON.stringify(v).replace(/"/g, "'")}`);
        }
        return Math.trunc(num(v));
      },
      float(v) {
        if (typeof v === 'string') {
          if (/^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(v)) return { f: parseFloat(v) };
          throw new Error(`ValueError: could not convert string to float: ${JSON.stringify(v).replace(/"/g, "'")}`);
        }
        return { f: num(v) };
      },
      str: (v) => (v && v.f !== undefined ? fmtNum(v.f) : typeof v === 'boolean' ? (v ? 'True' : 'False') : String(v)),
      bool: (v) => (typeof v === 'string' ? v.length > 0 : v && v.f !== undefined ? v.f !== 0 : Boolean(v)),
      type: (v) => ({ type: kindOf(v) }),
    };

    const chips = cfg.values.map((item) => {
      const c = h('button.val-chip.type-' + item.kind, { onclick: () => select(item, c) }, item.label, h('small', item.kind));
      return c;
    });
    function select(item, c) {
      selected = item;
      chips.forEach((x) => x.classList.toggle('is-sel', x === c));
      hint.innerHTML = `Gewählt: <code>${esc(item.label)}</code> — jetzt eine Funktion anklicken.`;
    }

    const funcs = cfg.funcs.map((f) =>
      h('button.btn.btn-ghost.fn-btn', {
        onclick: () => {
          if (!selected) {
            hint.textContent = 'Wähle zuerst einen Wert aus.';
            return;
          }
          ctx.touch();
          const call = `${f}(${selected.label})`;
          let row;
          try {
            const r = apply[f](toInternal(selected));
            const text = r && r.type ? `<class '${r.type}'>` : show(r);
            const kind = r && r.type ? 'type' : kindOf(r);
            row = h('div.type-row', h('code.call', call), h('span.arrow', '→'), h('span.res.type-' + kind, text));
          } catch (e) {
            row = h('div.type-row.is-err', h('code.call', call), h('span.arrow', '→'), h('span.res.err', e.message));
          }
          log.prepend(row);
          row.animate(
            row.classList.contains('is-err')
              ? [{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(-5px)' }, { transform: 'none' }]
              : [{ opacity: 0, transform: 'translateY(-10px) scale(.96)' }, { opacity: 1, transform: 'none' }],
            { duration: 380 },
          );
          while (log.children.length > 6) log.lastChild.remove();
        },
      }, f + '()'),
    );

    root.append(
      h('div.panel',
        h('div.panel-title', 'Werte'), h('div.chip-row', chips),
        h('div.panel-title.mt', 'Umwandlung'), h('div.chip-row', funcs),
      ),
      hint,
      h('div.panel', h('div.panel-title', 'Ergebnisse'), log),
    );
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Beleg-Drucker */

  scenes.receipt = (root, cfg, ctx) => {
    const state = { ...cfg, pfandAn: false };
    const code = h('pre.code-block.code-static');
    const paper = h('pre.receipt');
    const WIDTH = 28;

    const fmt = (n) => n.toFixed(2);
    const pad = (s, n) => String(s).padEnd(n, ' ').slice(0, n);
    const rpad = (s, n) => String(s).padStart(n, ' ');

    function render() {
      const summe = state.preis * state.menge;
      const pfand = state.pfandAn ? state.pfand * state.menge : 0;
      const gesamt = summe + pfand;
      const name = state.artikel || '—';
      const lines = [
        'KAFFEEHAUS PYTHON'.padStart(Math.floor((WIDTH + 17) / 2)),
        '─'.repeat(WIDTH),
        `${state.menge}x ${pad(name, 12)}${rpad(fmt(summe), 8)} €`,
      ];
      if (state.pfandAn) lines.push(`${pad('   Pfand', 15)}${rpad(fmt(pfand), 8)} €`);
      lines.push('─'.repeat(WIDTH), `${pad('SUMME', 15)}${rpad(fmt(gesamt), 8)} €`);
      paper.textContent = lines.join('\n');
      paper.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 220 });

      const src = [
        `artikel = ${JSON.stringify(state.artikel)}`,
        `preis = ${state.preis}`,
        `menge = ${state.menge}`,
        state.pfandAn ? `pfand = ${state.pfand} * menge` : null,
        '',
        'print(f"{menge}x {artikel:<12}{preis * menge:>8.2f} €")',
        state.pfandAn ? 'print(f"   Pfand      {pfand:>8.2f} €")' : null,
        'print(f"SUMME          {gesamt:>8.2f} €")',
      ].filter((l) => l !== null);
      code.innerHTML = highlight(src.join('\n'));
    }

    const bind = (el, fn) => el.addEventListener('input', () => { ctx.touch(); fn(el.value); render(); });
    const inName = h('input.field', { type: 'text', value: state.artikel, maxlength: 12, 'aria-label': 'Artikel' });
    const inPrice = h('input.field', { type: 'number', value: state.preis, min: 0, max: 99, step: 0.1, 'aria-label': 'Preis' });
    const qty = h('input', { type: 'range', min: 1, max: 9, value: state.menge, 'aria-label': 'Menge' });
    const qtyOut = h('output', state.menge);
    const pf = h('input', { type: 'checkbox', 'aria-label': 'Pfand' });
    bind(inName, (v) => (state.artikel = v));
    bind(inPrice, (v) => (state.preis = Math.max(0, parseFloat(v) || 0)));
    bind(qty, (v) => { state.menge = parseInt(v, 10); qtyOut.textContent = v; });
    pf.addEventListener('change', () => { ctx.touch(); state.pfandAn = pf.checked; render(); });

    const legend = h('ul.legend',
      h('li', h('code', ':<12'), ' linksbündig, 12 Zeichen breit'),
      h('li', h('code', ':>8.2f'), ' rechtsbündig, 8 breit, 2 Nachkommastellen'),
      h('li', h('code', '{preis * menge}'), ' rechnen direkt im f-String'),
    );

    root.append(
      h('div.scene-grid',
        h('div.panel',
          h('div.panel-title', 'Eingaben'),
          h('label.row', 'Artikel', inName),
          h('label.row', 'Preis in €', inPrice),
          h('label.row', 'Menge', h('span.range-wrap', qty, qtyOut)),
          h('label.row.row-check', pf, 'Pfand 0,25 € je Stück'),
          h('div.panel-title.mt', 'Code'), code,
        ),
        h('div.panel.panel-paper', h('div.panel-title', 'Bon'), paper),
      ),
      legend,
    );
    render();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Thermostat */

  scenes.thermostat = (root, cfg, ctx) => {
    let value = cfg.start;
    const span = cfg.max - cfg.min;
    const pct = (v) => ((v - cfg.min) / span) * 100;

    const marker = h('div.gauge-marker', h('span.gauge-val'));
    const zones = h('div.gauge-zones',
      h('i.green', { style: { width: pct(60) + '%' } }),
      h('i.amber', { style: { width: pct(80) - pct(60) + '%' } }),
      h('i.red', { style: { width: 100 - pct(80) + '%' } }),
    );
    const gauge = h('div.gauge', zones, marker);

    const slider = h('input.slider', { type: 'range', min: cfg.min, max: cfg.max, value, 'aria-label': 'Temperatur' });
    const lamp = h('div.lamp-big');
    const verdict = h('div.verdict');

    // Codezeilen
    const rows = [];
    cfg.rules.forEach((r) => {
      const head = r.cond ? `${r.kw} ${r.cond}:` : `${r.kw}:`;
      const badge = h('span.badge');
      const hl = h('span.src', { html: highlight(head) });
      const body = h('span.src.indent', { html: highlight(`    status = "${r.status}"`) });
      const condRow = h('div.code-line.cond', h('span.ln'), hl, badge);
      const bodyRow = h('div.code-line.body', h('span.ln'), body);
      rows.push({ r, condRow, bodyRow, badge });
    });
    const codeBlock = h('div.code-block', rows.flatMap((x) => [x.condRow, x.bodyRow]));

    function update() {
      ctx.touch();
      marker.style.left = pct(value) + '%';
      marker.firstChild.textContent = value + ' °C';
      let hit = null;
      rows.forEach((row) => {
        const { r } = row;
        const passed = hit !== null;
        const truth = r.cond ? value > r.limit : true;
        row.condRow.className = 'code-line cond';
        row.bodyRow.className = 'code-line body';
        row.badge.className = 'badge';
        if (passed) {
          row.condRow.classList.add('is-skipped');
          row.bodyRow.classList.add('is-skipped');
          row.badge.textContent = 'übersprungen';
        } else if (truth) {
          hit = r;
          row.condRow.classList.add('is-active');
          row.bodyRow.classList.add('is-active', 'is-hit');
          row.badge.textContent = r.cond ? 'True' : 'sonst';
          row.badge.classList.add('ok');
        } else {
          row.badge.textContent = 'False';
          row.badge.classList.add('no');
        }
      });
      lamp.className = 'lamp-big tone-' + hit.tone;
      verdict.innerHTML = `status = <strong>"${hit.status}"</strong>`;
      verdict.className = 'verdict tone-' + hit.tone;
    }
    slider.addEventListener('input', () => { value = +slider.value; update(); });

    const presets = h('div.chip-row', cfg.presets.map((p) =>
      h('button.btn.btn-ghost', { onclick: () => { value = p.value; slider.value = value; update(); } }, `${p.label} · ${p.value}°`)));

    root.append(
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Sensor'), gauge, slider, presets, h('div.lamp-row', lamp, verdict)),
        h('div.panel.panel-code', h('div.panel-title', 'Entscheidung'), codeBlock),
      ),
      h('p.step-note', 'Python prüft von oben nach unten und nimmt <strong>den ersten</strong> Zweig, dessen Bedingung stimmt. Teste den Grenzfall 80: <code>80 &gt; 80</code> ist <em>False</em>.'),
    );
    update();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Messwert-Scanner */

  scenes.loopLab = (root, cfg, ctx) => {
    const values = cfg.values;
    const codeLines = [
      'summe = 0',
      'hoechster = 0',
      'for wert in messwerte:',
      '    summe += wert',
      '    if wert > hoechster:',
      '        hoechster = wert',
    ];
    const lineEls = codeLines.map((l, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(l) })));
    const maxV = Math.max(...values) * 1.1;
    const bars = values.map((v) =>
      h('div.bar', h('i', { style: { height: (v / maxV) * 100 + '%' } }), h('span', v.toFixed(1))));
    const pointer = h('div.pointer', '▼ wert');
    const barRow = h('div.bars', bars);
    const barWrap = h('div.bars-wrap', pointer, barRow);

    const vars = { wert: h('span.var-val', '–'), summe: h('span.var-val', '–'), hoechster: h('span.var-val', '–') };
    const memEl = h('div.mem', Object.entries(vars).map(([k, v]) => h('div.var', h('span.var-name', k), v)));
    const note = h('p.step-note', 'Drücke ▶ Schritt: Die Schleife besucht jeden Balken genau einmal.');

    // Schritte vorab berechnen
    const steps = [];
    let summe = 0;
    let hoechster = 0;
    steps.push({ line: 0, apply: () => set({ summe: 0 }), note: '<code>summe</code> startet bei 0 — der Zähler muss <em>vor</em> der Schleife existieren.' });
    steps.push({ line: 1, apply: () => set({ hoechster: 0 }), note: '<code>hoechster</code> startet bei 0, jeder echte Messwert ist größer.' });
    values.forEach((v, i) => {
      steps.push({ line: 2, idx: i, apply: () => set({ wert: v }), note: `Durchlauf ${i + 1}: <code>wert</code> bekommt den nächsten Listenwert, <strong>${v}</strong>.` });
      summe = +(summe + v).toFixed(2);
      const s = summe;
      steps.push({ line: 3, idx: i, apply: () => set({ summe: s }), note: `<code>summe += wert</code> → ${s}.` });
      const bigger = v > hoechster;
      steps.push({ line: 4, idx: i, apply: () => {}, note: `<code>${v} &gt; ${hoechster}</code> ist <strong>${bigger ? 'True' : 'False'}</strong>${bigger ? '' : ' — der Block wird übersprungen'}.`, flag: bigger ? 'yes' : 'no' });
      if (bigger) {
        const old = hoechster;
        hoechster = v;
        steps.push({ line: 5, idx: i, apply: () => { set({ hoechster: v }); crown(i); }, note: `Neuer Höchstwert statt ${old}: <strong>${v}</strong>.` });
      }
    });
    steps.push({ line: -1, idx: -1, apply: () => {}, note: `Fertig. Die Liste ist durch: Summe <strong>${summe}</strong>, Maximum <strong>${hoechster}</strong>.` });

    function set(obj) {
      for (const [k, v] of Object.entries(obj)) {
        vars[k].textContent = v;
        const card = vars[k].parentElement;
        card.classList.remove('pop');
        void card.offsetWidth;
        card.classList.add('pop');
      }
    }
    function crown(i) {
      bars.forEach((b) => b.classList.remove('is-max'));
      bars[i].classList.add('is-max');
    }
    function movePointer(i) {
      if (i < 0) {
        pointer.style.opacity = 0;
        return;
      }
      const b = bars[i];
      pointer.style.opacity = 1;
      pointer.style.transform = `translateX(${b.offsetLeft + b.offsetWidth / 2 - pointer.offsetWidth / 2}px)`;
    }

    const ctl = controlBar({
      total: steps.length,
      onStep(n) {
        ctx.touch();
        const s = steps[n];
        lineEls.forEach((l) => l.classList.remove('is-active', 'is-true', 'is-false'));
        if (s.line >= 0) {
          lineEls[s.line].classList.add('is-active');
          if (s.flag) lineEls[s.line].classList.add(s.flag === 'yes' ? 'is-true' : 'is-false');
        }
        if (s.idx !== undefined) {
          bars.forEach((b, j) => {
            b.classList.toggle('is-now', j === s.idx);
            if (j < s.idx || s.idx === -1) b.classList.add('is-done');
          });
          movePointer(s.idx);
        }
        s.apply();
        note.innerHTML = s.note;
      },
      onReset() {
        lineEls.forEach((l) => l.classList.remove('is-active', 'is-true', 'is-false'));
        bars.forEach((b) => b.classList.remove('is-now', 'is-done', 'is-max'));
        pointer.style.opacity = 0;
        Object.values(vars).forEach((v) => (v.textContent = '–'));
        note.textContent = 'Drücke ▶ Schritt: Die Schleife besucht jeden Balken genau einmal.';
      },
    });

    pointer.style.opacity = 0;
    root.append(
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'messwerte = [' + values.join(', ') + ']'), barWrap, memEl),
        h('div.panel.panel-code', h('div.panel-title', 'Schleife'), h('div.code-block', lineEls)),
      ),
      note, ctl.el,
    );
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------- Szene: Login-Schleuse */

  scenes.loginLoop = (root, cfg, ctx) => {
    let tries = 0;
    let loggedIn = false;
    let busy = false;
    let alive = true;

    const lines = [
      'versuche = 0',
      'eingeloggt = False',
      'while versuche < 3 and not eingeloggt:',
      '    if passwort_ok(eingabe):',
      '        eingeloggt = True',
      '    else:',
      '        versuche += 1',
    ];
    const lineEls = lines.map((l, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(l) })));
    const flash = async (i, ms = 340) => {
      lineEls[i].classList.add('is-active');
      await sleep(ms);
      lineEls[i].classList.remove('is-active');
    };

    const lock = h('div.lock', h('div.lock-shackle'), h('div.lock-body', h('span.keyhole')));
    const lamps = Array.from({ length: cfg.maxTries }, () => h('i.lamp'));
    const varTries = h('span.var-val', '0');
    const varIn = h('span.var-val', 'False');
    const cond = h('span.badge', '—');
    const status = h('p.step-note', `Das Passwort lautet <code>${cfg.password}</code> — oder probiere ein falsches aus.`);
    const input = h('input.field', { type: 'text', placeholder: 'Passwort', 'aria-label': 'Passwort', autocomplete: 'off' });
    const btn = h('button.btn.btn-primary', { onclick: attempt }, 'Anmelden');
    input.addEventListener('keydown', (e) => e.key === 'Enter' && attempt());

    function render() {
      varTries.textContent = tries;
      varIn.textContent = loggedIn ? 'True' : 'False';
      lamps.forEach((l, i) => l.classList.toggle('is-bad', i < tries));
      const locked = !loggedIn && tries >= cfg.maxTries;
      lock.className = 'lock' + (loggedIn ? ' is-open' : '') + (locked ? ' is-locked' : '');
      input.disabled = btn.disabled = loggedIn || locked;
    }

    async function attempt() {
      if (busy || loggedIn || tries >= cfg.maxTries) return;
      busy = true;
      ctx.touch();
      const guess = input.value;
      const open = tries < cfg.maxTries && !loggedIn;
      cond.textContent = open ? 'True' : 'False';
      cond.className = 'badge ' + (open ? 'ok' : 'no');
      await flash(2);
      if (!alive) return;
      await flash(3);
      if (!alive) return;
      if (guess === cfg.password) {
        await flash(4);
        loggedIn = true;
        status.innerHTML = '<strong>Zugang gewährt.</strong> <code>eingeloggt</code> ist jetzt True — die Schleifenbedingung kippt, die Schleife endet.';
      } else {
        await flash(5, 200);
        await flash(6);
        tries++;
        lock.animate([{ transform: 'translateX(-9px)' }, { transform: 'translateX(9px)' }, { transform: 'translateX(-5px)' }, { transform: 'none' }], { duration: 360 });
        status.innerHTML = tries >= cfg.maxTries
          ? '<code>versuche &lt; 3</code> ist <strong>False</strong> — die Schleife endet, das Konto ist gesperrt.'
          : `Falsch. <code>versuche</code> steigt auf ${tries}, die Schleife läuft weiter.`;
      }
      cond.textContent = (tries < cfg.maxTries && !loggedIn) ? 'True' : 'False';
      cond.className = 'badge ' + ((tries < cfg.maxTries && !loggedIn) ? 'ok' : 'no');
      input.value = '';
      render();
      busy = false;
      if (!input.disabled) input.focus();
    }

    function reset() {
      tries = 0; loggedIn = false; busy = false;
      cond.textContent = '—'; cond.className = 'badge';
      status.innerHTML = `Das Passwort lautet <code>${cfg.password}</code> — oder probiere ein falsches aus.`;
      render();
    }

    root.append(
      h('div.scene-grid',
        h('div.panel.panel-lock',
          lock,
          h('div.lamps', lamps),
          h('div.row-inline', input, btn),
          h('div.mem', h('div.var', h('span.var-name', 'versuche'), varTries), h('div.var', h('span.var-name', 'eingeloggt'), varIn)),
        ),
        h('div.panel.panel-code', h('div.panel-title', 'Schleife ', cond), h('div.code-block', lineEls)),
      ),
      status,
      h('div.controls', h('button.btn.btn-ghost', { onclick: reset }, '↺ Neu starten')),
    );
    render();
    return { destroy() { alive = false; } };
  };

  /* ------------------------------------------------- Szene: Call Stack */

  scenes.callStack = (root, cfg, ctx) => {
    const lineEls = cfg.lines.map((l, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(l) })));
    const stack = h('div.stack');
    const depth = h('span.badge', 'Tiefe 1');
    const out = h('div.console-out');
    const note = h('p.step-note', 'Drücke ▶ Schritt: Links läuft der Code, rechts wächst und schrumpft der Stack.');
    let frames = [];

    function renderVars(f) {
      f.varsEl.replaceChildren(...Object.entries(f.vars).map(([k, v]) => h('span.frame-var', h('b', k), ' = ' + v)));
    }
    function makeFrame(name, vars = {}) {
      const f = { vars, varsEl: h('div.frame-vars'), head: h('div.frame-name', name) };
      f.el = h('div.frame', f.head, f.varsEl);
      renderVars(f);
      return f;
    }
    function resetFrames() {
      stack.replaceChildren();
      frames = [makeFrame('<module>')];
      frames[0].el.classList.add('is-base');
      stack.append(frames[0].el);
      depth.textContent = 'Tiefe 1';
    }
    const top = () => frames[frames.length - 1];
    const markTop = () => frames.forEach((f, i) => f.el.classList.toggle('is-top', i === frames.length - 1));

    const ctl = controlBar({
      total: cfg.steps.length,
      onStep(i) {
        ctx.touch();
        const s = cfg.steps[i];
        lineEls.forEach((l) => l.classList.remove('is-active'));
        lineEls[s.line].classList.add('is-active');
        stack.querySelectorAll('.ret').forEach((r) => r.remove());
        if (s.push) {
          const f = makeFrame(s.push.name, { ...s.push.vars });
          frames.push(f);
          stack.append(f.el);
          f.el.animate([{ opacity: 0, translate: '0 -28px' }, { opacity: 1, translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.2,1.2,.4,1)' });
        }
        if (s.set) { Object.assign(top().vars, s.set); renderVars(top()); }
        if (s.setGlobal) { Object.assign(frames[0].vars, s.setGlobal); renderVars(frames[0]); }
        if (s.ret) {
          const gone = frames.pop();
          gone.el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -28px' }], { duration: 380, fill: 'forwards' }).finished.then(() => gone.el.remove(), () => gone.el.remove());
          top().head.append(h('span.ret', '↩ ' + s.ret));
        }
        if (s.out) out.append(h('div.out-line', s.out));
        depth.textContent = 'Tiefe ' + frames.length;
        markTop();
        note.innerHTML = s.note;
      },
      onReset() {
        lineEls.forEach((l) => l.classList.remove('is-active'));
        out.replaceChildren();
        resetFrames();
        markTop();
        note.textContent = 'Drücke ▶ Schritt: Links läuft der Code, rechts wächst und schrumpft der Stack.';
      },
    });

    root.append(
      h('div.scene-grid',
        h('div.panel.panel-code', h('div.panel-title', 'Programm'), h('div.code-block', lineEls)),
        h('div.panel', h('div.panel-title', 'Call Stack ', depth), stack, h('div.panel-title.mt', 'Konsole'), out),
      ),
      note, ctl.el,
    );
    resetFrames();
    markTop();
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------- Szene: Scope-Tabelle */

  scenes.scopeTable = (root, cfg, ctx) => {
    let pos = cfg.positions[0].id;
    let probe = null;
    const lineEls = cfg.lines.map((l, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(l) })));
    const posRow = h('div.chip-row');
    const tbody = h('tbody');
    const result = h('div.console');
    const label = (id) => (id === 'global' ? 'global' : id + '()');

    function paint() {
      const p = cfg.positions.find((x) => x.id === pos);
      posRow.replaceChildren(...cfg.positions.map((x) =>
        h('button.pill' + (x.id === pos ? '.is-active' : ''), { onclick: () => { pos = x.id; ctx.touch(); paint(); } }, x.label)));
      lineEls.forEach((l, i) => l.classList.toggle('is-active', p.lines.includes(i)));
      tbody.replaceChildren(...cfg.vars.map((v, i) => {
        const visible = v.owner === 'global' || v.owner === pos;
        return h('tr' + (probe === v.name ? '.is-probe' : ''), { style: { '--i': i }, onclick: () => { probe = v.name; ctx.touch(); paint(); } },
          h('td', h('code', v.name)),
          h('td.muted', label(v.owner)),
          h('td', h('span.badge.' + (visible ? 'ok' : 'no'), visible ? 'sichtbar' : 'unsichtbar')));
      }));
      result.replaceChildren();
      if (!probe) {
        result.append(h('span.dim', 'Klicke eine Zeile der Tabelle, um print(variable) an dieser Stelle auszuprobieren.'));
        return;
      }
      const v = cfg.vars.find((x) => x.name === probe);
      const visible = v.owner === 'global' || v.owner === pos;
      result.append(h('div.dim', `# ${p.label}`), h('div', `print(${v.name})`),
        visible ? h('div', v.value) : h('div.err', `NameError: name '${v.name}' is not defined`),
        h('div.dim', visible ? v.note : `${v.name} gehört zu ${label(v.owner)} — von hier aus nicht sichtbar.`));
    }

    root.append(
      h('div.panel', h('div.panel-title', 'Ich befinde mich …'), posRow),
      h('div.scene-grid',
        h('div.panel.panel-code', h('div.panel-title', 'Code'), h('div.code-block', lineEls)),
        h('div.panel', h('div.panel-title', 'Sichtbarkeit'),
          h('table.scope-table', h('thead', h('tr', h('th', 'Variable'), h('th', 'gehört zu'), h('th', 'hier'))), tbody)),
      ),
      h('div.panel', h('div.panel-title', 'Zugriff'), result),
      h('p.step-note', 'Faustregel (<strong>LEGB</strong>): Python sucht erst lokal, dann in umgebenden Funktionen, dann global. Von außen schaut man <em>nie</em> in eine Funktion hinein.'),
    );
    paint();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Daten-Pipeline */

  scenes.pipeline = (root, cfg, ctx) => {
    let preset = cfg.presets[0];
    const layer = h('div.fly-layer');
    const srcRow = h('div.pipe-row');
    const dstRow = h('div.pipe-row');
    const gateCond = h('code');
    const gateBadge = h('span.badge', '–');
    const gate = h('div.pipe-gate', h('span.gate-label', 'Filter'), gateCond, gateBadge);
    const count = h('span.badge', '0');
    const compBox = h('pre.code-static');
    const loopBox = h('pre.code-static');
    const presetRow = h('div.scene-tabs');
    const srcEls = cfg.items.map((it) => h('div.item', h('strong', it.ip), h('small', it.status)));
    srcRow.append(...srcEls);

    function paintPreset() {
      presetRow.replaceChildren(...cfg.presets.map((p) =>
        h('button.pill' + (p === preset ? '.is-active' : ''), { onclick: () => { preset = p; paintPreset(); ctl.reset(); } }, p.label)));
      const cond = preset.cond ? ` if ${preset.cond}` : '';
      compBox.innerHTML = highlight(`ziel = [${preset.expr} for z in logs${cond}]`);
      loopBox.innerHTML = highlight(
        'ziel = []\nfor z in logs:\n' +
        (preset.cond ? `    if ${preset.cond}:\n        ziel.append(${preset.expr})` : `    ziel.append(${preset.expr})`));
      gateCond.textContent = preset.cond || 'kein Filter';
    }

    const ctl = controlBar({
      total: cfg.items.length,
      onStep(i) {
        ctx.touch();
        srcEls.forEach((e) => e.classList.remove('is-now'));
        srcEls[i].classList.add('is-now');
        const ok = preset.test(cfg.items[i]);
        gateBadge.textContent = ok ? 'True' : 'False';
        gateBadge.className = 'badge ' + (ok ? 'ok' : 'no');
        if (!ok) {
          srcEls[i].classList.add('is-drop');
          return;
        }
        srcEls[i].classList.add('is-pass');
        const text = String(preset.map(cfg.items[i]));
        const target = h('div.item.item-out', h('strong', text));
        target.style.visibility = 'hidden';
        dstRow.append(target);
        count.textContent = dstRow.children.length;
        flyChip(layer, srcEls[i], target, text, 'str').then(() => {
          target.style.visibility = '';
          target.animate([{ scale: 0.7, opacity: 0.4 }, { scale: 1, opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,1.4,.4,1)' });
        });
      },
      onReset() {
        srcEls.forEach((e) => e.classList.remove('is-now', 'is-pass', 'is-drop'));
        dstRow.replaceChildren();
        count.textContent = '0';
        gateBadge.textContent = '–';
        gateBadge.className = 'badge';
      },
    });

    root.append(
      presetRow,
      h('div.panel', h('div.panel-title', 'Comprehension'), compBox),
      h('div.pipeline',
        h('div.panel', h('div.panel-title', 'logs (Quelle)'), srcRow),
        gate,
        h('div.panel', h('div.panel-title', 'ziel (neue Liste) ', count), dstRow),
      ),
      ctl.el,
      h('div.panel', h('div.panel-title', 'Dasselbe als for-Schleife'), loopBox),
      layer,
    );
    paintPreset();
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------- Szene: Array-Slots */

  scenes.arraySlots = (root, cfg, ctx) => {
    const W = 66;
    const GAP = 10;
    const N = cfg.capacity;
    const x = (i) => `translateX(${i * (W + GAP)}px)`;
    const fmt = (v) => v.toFixed(1);
    let items = [];
    let busy = false;
    let nextIn = 0;

    const track = h('div.slots-track', { style: { width: N * (W + GAP) - GAP + 'px' } },
      Array.from({ length: N }, (_, i) => h('div.slot', { style: { transform: x(i) } }, h('span.slot-idx', i))));
    const cmd = h('code.cmd', 'liste = [ … ]');
    const moves = h('strong', '0');
    const cost = h('span.badge', '–');
    const size = h('strong', '0');
    const note = h('p.step-note', 'Wähle eine Operation. Beim Einfügen vorne müssen <strong>alle</strong> Elemente Platz machen.');
    const btns = [];

    const nextValue = () => cfg.incoming[nextIn % cfg.incoming.length];
    const cell = (v, i) => {
      const el = h('div.cell', fmt(v));
      el.style.transform = x(i);
      track.append(el);
      el.animate([{ opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1 }], { duration: 360, easing: 'cubic-bezier(.2,1.4,.4,1)' });
      return { val: v, el };
    };
    const setStats = (command, n, big) => {
      cmd.textContent = command;
      moves.textContent = n;
      cost.textContent = big ? 'O(n)' : 'O(1)';
      cost.className = 'badge ' + (big ? 'no' : 'ok');
      size.textContent = items.length;
      btns.forEach((b) => b.refresh && b.refresh());
    };
    const shift = async (it, to) => {
      it.el.classList.add('is-moving');
      it.el.style.transform = x(to);
      await sleep(280);
      it.el.classList.remove('is-moving');
    };
    const drop = (it) => it.el.animate([{ opacity: 1, scale: 1 }, { opacity: 0, scale: 0.4 }], { duration: 300, fill: 'forwards' }).finished.then(() => it.el.remove(), () => it.el.remove());

    async function guard(fn) {
      if (busy) return;
      busy = true;
      ctx.touch();
      btns.forEach((b) => (b.disabled = true));
      await fn();
      busy = false;
      btns.forEach((b) => (b.disabled = false));
      btns.forEach((b) => b.refresh && b.refresh());
    }

    const ops = {
      append: () => guard(async () => {
        if (items.length >= N) return setStats('Liste voll (Demo: ' + N + ' Slots)', 0, false);
        const v = nextValue(); nextIn++;
        items.push(cell(v, items.length));
        setStats(`liste.append(${fmt(v)})`, 0, false);
        note.innerHTML = '<code>append</code> setzt den Wert in den <strong>nächsten freien Slot</strong>. Nichts muss verschoben werden: Aufwand O(1).';
        await sleep(250);
      }),
      insert: () => guard(async () => {
        if (items.length >= N) return setStats('Liste voll (Demo: ' + N + ' Slots)', 0, false);
        const v = nextValue(); nextIn++;
        let n = 0;
        setStats(`liste.insert(0, ${fmt(v)})`, 0, true);
        for (let i = items.length - 1; i >= 0; i--) {
          await shift(items[i], i + 1);
          moves.textContent = ++n;
        }
        items.unshift(cell(v, 0));
        setStats(`liste.insert(0, ${fmt(v)})`, n, true);
        note.innerHTML = `Slot 0 muss frei werden: <strong>${n}</strong> Element(e) rutschen einen Slot nach rechts, erst dann passt der neue Wert hinein. Je länger die Liste, desto mehr Arbeit: Aufwand O(n).`;
      }),
      pop: () => guard(async () => {
        if (!items.length) {
          setStats('liste.pop()', 0, false);
          note.innerHTML = '<span class="err-text">IndexError: pop from empty list</span> — prüfe vorher, ob die Liste leer ist.';
          return;
        }
        const it = items.pop();
        setStats('liste.pop()', 0, false);
        note.innerHTML = `<code>pop()</code> nimmt das <strong>letzte</strong> Element (${fmt(it.val)}) weg. Alle anderen bleiben, wo sie sind: O(1).`;
        await drop(it);
      }),
      pop0: () => guard(async () => {
        if (!items.length) {
          setStats('liste.pop(0)', 0, false);
          note.innerHTML = '<span class="err-text">IndexError: pop from empty list</span>';
          return;
        }
        const first = items.shift();
        let n = 0;
        setStats('liste.pop(0)', 0, true);
        drop(first);
        for (let i = 0; i < items.length; i++) {
          await shift(items[i], i);
          moves.textContent = ++n;
        }
        setStats('liste.pop(0)', n, true);
        note.innerHTML = `Die Lücke an Slot 0 wird geschlossen: <strong>${n}</strong> Element(e) rücken nach links. Auch das ist O(n).`;
      }),
      reset: () => guard(async () => {
        track.querySelectorAll('.cell').forEach((c) => c.remove());
        items = cfg.start.map((v, i) => cell(v, i));
        nextIn = 0;
        setStats('liste = [ … ]', 0, false);
        cost.textContent = '–';
        cost.className = 'badge';
      }),
    };

    const mk = (label, fn, labelFn) => {
      const b = h('button.btn.btn-ghost.fn-btn', { onclick: fn }, label);
      if (labelFn) b.refresh = () => (b.textContent = labelFn());
      btns.push(b);
      return b;
    };
    const row = h('div.chip-row',
      mk(`append(${fmt(nextValue())})`, ops.append, () => `append(${fmt(nextValue())})`),
      mk(`insert(0, ${fmt(nextValue())})`, ops.insert, () => `insert(0, ${fmt(nextValue())})`),
      mk('pop()', ops.pop),
      mk('pop(0)', ops.pop0),
      mk('↺ Neu', ops.reset));

    root.append(
      h('div.panel',
        h('div.panel-title', 'Speicher'),
        h('div.slots-scroll', track),
        h('div.slots-meta', cmd, h('span', 'len = ', size), h('span', 'Verschiebungen: ', moves), cost),
      ),
      h('div.panel', h('div.panel-title', 'Operation'), row),
      note,
    );
    items = cfg.start.map((v, i) => cell(v, i));
    size.textContent = items.length;
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Liste vs. Tuple */

  scenes.tupleVsList = (root, cfg, ctx) => {
    let list = [...cfg.values];
    const tup = [...cfg.values];
    const pad = (arr, open, close) => open + arr.join(', ') + (open === '(' && arr.length === 1 ? ',' : '') + close;

    const listRepr = h('code.repr');
    const tupRepr = h('code.repr');
    const listCells = h('div.vals');
    const tupCells = h('div.vals');
    const listLog = h('div.op-log');
    const tupLog = h('div.op-log');
    const tupPanel = h('div.panel.panel-immut',
      h('div.panel-title', 'Tuple ', h('span.badge.no', 'unveränderlich')), tupRepr, tupCells, tupLog);
    const listPanel = h('div.panel.panel-mut',
      h('div.panel-title', 'Liste ', h('span.badge.ok', 'veränderbar')), listRepr, listCells, listLog);

    const cells = (arr) => arr.map((v, i) => h('div.vcell', h('small', i), h('b', v)));
    function paint(flashList) {
      listRepr.textContent = 'x = ' + pad(list, '[', ']');
      tupRepr.textContent = 'x = ' + pad(tup, '(', ')');
      listCells.replaceChildren(...cells(list));
      tupCells.replaceChildren(...cells(tup));
      if (flashList) listCells.animate([{ opacity: 0.4 }, { opacity: 1 }], { duration: 300 });
    }
    const log = (box, cmd, ok, msg) => {
      box.prepend(h('div.op' + (ok ? '.is-ok' : '.is-err'), h('span.dim', '>>> '), cmd, h('div', msg)));
      while (box.children.length > 3) box.lastChild.remove();
    };
    const blocked = () => {
      tupPanel.classList.remove('is-blocked');
      void tupPanel.offsetWidth;
      tupPanel.classList.add('is-blocked');
      tupCells.animate([{ translate: '-8px 0' }, { translate: '8px 0' }, { translate: '-5px 0' }, { translate: '0 0' }], { duration: 380 });
    };

    const ops = {
      set: { cmd: 'x[1] = 99', list: () => { list[1] = 99; return 'ok — Index 1 hat jetzt 99'; },
             err: "TypeError: 'tuple' object does not support item assignment" },
      append: { cmd: 'x.append(5)', list: () => { list.push(5); return `ok — Länge ist jetzt ${list.length}`; },
                err: "AttributeError: 'tuple' object has no attribute 'append'" },
      pop: { cmd: 'x.pop()', list: () => (list.length ? `ok — ${list.pop()} entfernt` : 'IndexError: pop from empty list'),
             err: "AttributeError: 'tuple' object has no attribute 'pop'" },
    };

    const buttons = cfg.ops.map((o) => h('button.btn.btn-ghost.fn-btn', {
      onclick() {
        ctx.touch();
        const op = ops[o.id];
        const res = op.list();
        log(listLog, op.cmd, !res.startsWith('IndexError'), res);
        log(tupLog, op.cmd, false, op.err);
        paint(true);
        blocked();
      },
    }, o.label));
    buttons.push(h('button.btn.btn-ghost', { onclick: () => { list = [...cfg.values]; listLog.replaceChildren(); tupLog.replaceChildren(); paint(true); } }, '↺ Neu'));

    root.append(
      h('div.panel', h('div.panel-title', 'Dieselbe Operation auf beide anwenden'), h('div.chip-row', buttons)),
      h('div.scene-grid', listPanel, tupPanel),
      h('p.step-note', 'Tuples sind <strong>manipulationssicher</strong>: Es gibt keine Methode, die sie verändert. Willst du einen anderen Wert, baust du ein <em>neues</em> Tuple.'),
    );
    root.querySelector('.panel').classList.add('mb');
    paint();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Entpacken */

  scenes.unpack = (root, cfg, ctx) => {
    const layer = h('div.fly-layer');
    const values = cfg.values;
    const options = [{ id: 2, label: '2 Variablen' }, { id: 3, label: '3 Variablen' }, { id: 4, label: '4 Variablen' }, { id: '*', label: 'lat, *rest' }];
    let current = 3;
    const optRow = h('div.scene-tabs');
    const tupRow = h('div.vals');
    const targets = h('div.vals');
    const code = h('pre.code-static');
    const result = h('div.console');

    const tupCells = values.map((v, i) => h('div.vcell.type-float', h('small', i), h('b', v)));
    tupRow.append(...tupCells);

    function paintOptions() {
      optRow.replaceChildren(...options.map((o) =>
        h('button.pill' + (o.id === current ? '.is-active' : ''), { onclick: () => { current = o.id; ctx.touch(); paintOptions(); run(); } }, o.label)));
    }

    let token = 0; // verwirft veraltete Durchläufe, wenn schnell gewechselt wird
    async function run() {
      const mine = ++token;
      targets.replaceChildren();
      result.replaceChildren();
      const star = current === '*';
      const names = star ? [cfg.names[0], '*rest'] : cfg.names.slice(0, current);
      code.innerHTML = highlight(`position = (${values.join(', ')})\n${names.join(', ')} = position`);
      const boxes = names.map((n) => h('div.vcell.target', h('small', n), h('b', '?')));
      targets.append(...boxes);

      if (!star && names.length !== values.length) {
        const msg = names.length < values.length
          ? `ValueError: too many values to unpack (expected ${names.length})`
          : `ValueError: not enough values to unpack (expected ${names.length}, got ${values.length})`;
        result.append(h('div.err', msg), h('div.dim', names.length < values.length ? 'Zu wenige Variablen: ein Wert bliebe übrig.' : 'Zu viele Variablen: ein Fach bliebe leer.'));
        tupRow.animate([{ translate: '-8px 0' }, { translate: '8px 0' }, { translate: '0 0' }], { duration: 320 });
        boxes.forEach((b) => b.classList.add('is-err'));
        return;
      }
      const assigned = star ? [String(values[0]), '[' + values.slice(1).join(', ') + ']'] : values.map(String);
      for (let i = 0; i < boxes.length; i++) {
        flyChip(layer, tupCells[i], boxes[i], assigned[i], 'float');
        await sleep(260);
        if (mine !== token) return;
        boxes[i].querySelector('b').textContent = assigned[i];
        boxes[i].classList.add('is-ok');
      }
      result.append(h('div', names.map((n, i) => `${n} = ${assigned[i]}`).join('\n')),
        h('div.dim', star ? '*rest sammelt alle übrigen Werte in einer Liste.' : 'Anzahl der Variablen = Anzahl der Elemente: alles passt.'));
    }

    root.append(
      optRow,
      h('div.panel', h('div.panel-title', 'position (Tuple)'), tupRow, h('div.panel-title.mt', 'Variablen'), targets),
      h('div.panel', h('div.panel-title', 'Code'), code),
      h('div.panel', h('div.panel-title', 'Ergebnis'), result),
      layer,
    );
    paintOptions();
    run();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Tellerstapel */

  scenes.stackPlates = (root, cfg, ctx) => {
    const H = 44;
    const GAP = 8;
    const cap = cfg.capacity;
    const y = (i) => `translateY(${-i * (H + GAP)}px)`;
    let items = [];
    let next = cfg.start.length;
    let busy = false;

    const well = h('div.plate-well', { style: { height: cap * (H + GAP) + 'px' } });
    const topTag = h('span.top-tag', '◀ TOP');
    well.append(topTag);
    const repr = h('code.repr');
    const note = h('p.step-note', 'Du kommst nur an das, was oben liegt.');

    const plate = (label, i) => {
      const el = h('div.plate', label);
      el.style.transform = y(i);
      well.append(el);
      return { label, el };
    };
    function paint() {
      repr.textContent = 'stack = [' + items.map((p) => `"${p.label}"`).join(', ') + ']';
      items.forEach((p, i) => p.el.classList.toggle('is-top', i === items.length - 1));
      topTag.style.display = items.length ? '' : 'none';
      topTag.style.bottom = Math.max(0, (items.length - 1) * (H + GAP) + H / 2 - 9) + 'px';
    }
    async function guard(fn) {
      if (busy) return;
      busy = true;
      ctx.touch();
      await fn();
      busy = false;
    }

    const ops = {
      push: () => guard(async () => {
        if (items.length >= cap) { note.textContent = 'Der Stapel ist voll (Demo-Grenze).'; return; }
        const label = cfg.names[next++ % cfg.names.length];
        const p = plate(label, items.length);
        items.push(p);
        p.el.animate([{ opacity: 0, translate: '0 -90px' }, { opacity: 1, translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.3,1.3,.5,1)' });
        note.innerHTML = `<code>push</code>: <strong>${label}</strong> landet ganz oben.`;
        paint();
        await sleep(300);
      }),
      pop: () => guard(async () => {
        if (!items.length) { note.innerHTML = '<span class="err-text">IndexError: pop from empty list</span> — ein leerer Stack hat nichts zum Entnehmen.'; return; }
        const p = items.pop();
        note.innerHTML = `<code>pop</code>: <strong>${p.label}</strong> wird von oben heruntergenommen und zurückgegeben.`;
        paint();
        await p.el.animate([{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: '0 -90px' }], { duration: 380, fill: 'forwards' }).finished.catch(() => {});
        p.el.remove();
      }),
      peek: () => guard(async () => {
        if (!items.length) { note.textContent = 'Der Stapel ist leer — es gibt nichts anzuschauen.'; return; }
        const p = items[items.length - 1];
        note.innerHTML = `<code>stack[-1]</code> schaut nur drauf: <strong>${p.label}</strong>. Der Teller bleibt liegen.`;
        p.el.classList.add('is-peek');
        await sleep(700);
        p.el.classList.remove('is-peek');
      }),
      bottom: () => guard(async () => {
        if (!items.length) { note.textContent = 'Der Stapel ist leer.'; return; }
        const p = items[0];
        p.el.animate([{ translate: '-8px 0' }, { translate: '8px 0' }, { translate: '-5px 0' }, { translate: '0 0' }], { duration: 400 });
        p.el.classList.add('is-blocked');
        note.innerHTML = `<code>stack.pop(0)</code> würde unten ziehen — das ist <strong>kein Stack</strong> mehr. Alles darüber müsste nachrutschen. LIFO erlaubt nur den Zugriff oben.`;
        await sleep(500);
        p.el.classList.remove('is-blocked');
      }),
      reset: () => guard(async () => {
        well.querySelectorAll('.plate').forEach((e) => e.remove());
        items = cfg.start.map((l, i) => plate(l, i));
        next = cfg.start.length;
        note.textContent = 'Du kommst nur an das, was oben liegt.';
        paint();
      }),
    };

    root.append(
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Stapel'), well),
        h('div.panel',
          h('div.panel-title', 'Operationen'),
          h('div.chip-row',
            h('button.btn.btn-primary', { onclick: ops.push }, 'push'),
            h('button.btn.btn-ghost', { onclick: ops.pop }, 'pop'),
            h('button.btn.btn-ghost', { onclick: ops.peek }, 'peek'),
            h('button.btn.btn-ghost', { onclick: ops.bottom }, 'unten ziehen?'),
            h('button.btn.btn-ghost', { onclick: ops.reset }, '↺ Neu')),
          h('div.panel-title.mt', 'Liste dahinter'), repr,
          h('ul.legend.mt',
            h('li', h('code', 'push'), ' = ', h('code', 'liste.append(x)')),
            h('li', h('code', 'pop'), ' = ', h('code', 'liste.pop()')),
            h('li', h('code', 'peek'), ' = ', h('code', 'liste[-1]'))),
        ),
      ),
      note,
    );
    items = cfg.start.map((l, i) => plate(l, i));
    paint();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Undo-Historie */

  scenes.undoEditor = (root, cfg, ctx) => {
    let stack = [];
    const textEl = h('div.editor-text');
    const stackEl = h('div.stack');
    const note = h('p.step-note', 'Jede Aktion wird auf den Stack gelegt. Strg+Z holt die oberste wieder herunter.');
    const repr = h('code.repr');

    function paint(animateLast) {
      textEl.replaceChildren(...stack.map((a, i) => h('span.word' + (animateLast && i === stack.length - 1 ? '.is-new' : ''), a.text + ' ')), h('span.caret'));
      stackEl.replaceChildren(...stack.map((a, i) => h('div.frame' + (i === stack.length - 1 ? '.is-top' : ''), h('div.frame-name', a.label))));
      repr.textContent = 'undo_stack = [' + stack.map((a) => `"${a.label}"`).join(', ') + ']';
      if (!stack.length) stackEl.append(h('span.dim.empty', 'leer'));
    }

    const actionBtns = cfg.actions.map((a) => h('button.btn.btn-ghost', {
      onclick() {
        ctx.touch();
        stack.push(a);
        note.innerHTML = `<code>undo_stack.append("${a.label}")</code> — die Aktion liegt jetzt oben auf dem Stack.`;
        paint(true);
      },
    }, a.label));

    const undo = h('button.btn.btn-primary', {
      onclick() {
        ctx.touch();
        if (!stack.length) {
          note.innerHTML = 'Stack leer: <span class="err-text">pop() würde einen IndexError auslösen</span>. Darum prüft ein echter Editor vorher, ob etwas da ist.';
          return;
        }
        const a = stack.pop();
        note.innerHTML = `<code>undo_stack.pop()</code> → <strong>${a.label}</strong>. Die zuletzt gemachte Aktion wird als Erste rückgängig gemacht (LIFO).`;
        paint(false);
      },
    }, '↶ Strg+Z');

    root.append(
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Editor'), textEl, h('div.panel-title.mt', 'Aktion ausführen'), h('div.chip-row', actionBtns, undo)),
        h('div.panel', h('div.panel-title', 'undo_stack'), stackEl, h('div.panel-title.mt', 'Liste'), repr),
      ),
      note,
    );
    paint();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Warteschlange */

  scenes.queueLine = (root, cfg, ctx) => {
    const W = 72;
    const GAP = 10;
    const DESK = 112;
    const cap = cfg.capacity;
    const x = (i) => `translateX(${DESK + i * (W + GAP)}px)`;
    let items = [];
    let nextId = 0;
    let done = [];
    let busy = false;
    let timer = null;
    let tick = 0;

    const track = h('div.q-track', { style: { width: DESK + cap * (W + GAP) + 'px' } },
      h('div.q-desk', h('strong', 'Support'), h('small', 'Schalter')));
    const front = h('span.q-mark.q-front', 'FRONT');
    const back = h('span.q-mark.q-back', 'BACK');
    track.append(front, back);
    const repr = h('code.repr');
    const stats = h('div.slots-meta');
    const doneEl = h('div.q-done');
    const note = h('p.step-note', 'Neue Tickets stellen sich hinten an. Bearbeitet wird immer das vorderste.');
    const autoBtn = h('button.btn.btn-ghost', { onclick: toggleAuto }, 'Auto-Betrieb');

    const cell = (label, i) => {
      const el = h('div.qcell', label);
      el.style.transform = x(i);
      track.append(el);
      return { label, el };
    };
    function paint() {
      repr.textContent = 'warteschlange = [' + items.map((t) => `"${t.label}"`).join(', ') + ']';
      stats.replaceChildren(h('span', 'wartend: ', h('strong', items.length)), h('span', 'bearbeitet: ', h('strong', done.length)));
      doneEl.textContent = done.length ? 'Bearbeitungsreihenfolge: ' + done.join(' → ') : 'noch nichts bearbeitet';
      front.style.display = back.style.display = items.length ? '' : 'none';
      front.style.transform = x(0);
      back.style.transform = x(Math.max(0, items.length - 1));
      items.forEach((t, i) => t.el.classList.toggle('is-front', i === 0));
    }
    const label = () => cfg.tickets[nextId++ % cfg.tickets.length];

    async function enqueue() {
      if (busy) return;
      if (items.length >= cap) { note.textContent = 'Die Schlange ist voll (Demo-Grenze).'; return; }
      busy = true;
      ctx.touch();
      const l = label();
      const c = cell(l, items.length);
      items.push(c);
      c.el.animate([{ opacity: 0, translate: '60px 0' }, { opacity: 1, translate: '0 0' }], { duration: 420, easing: 'cubic-bezier(.2,1.2,.4,1)' });
      note.innerHTML = `<code>warteschlange.append("${l}")</code> — das Ticket stellt sich <strong>hinten</strong> an.`;
      paint();
      await sleep(320);
      busy = false;
    }
    async function dequeue() {
      if (busy) return;
      if (!items.length) { note.innerHTML = '<span class="err-text">IndexError: pop from empty list</span> — vor <code>pop(0)</code> prüfen, ob Tickets warten.'; return; }
      busy = true;
      ctx.touch();
      const first = items.shift();
      done.push(first.label);
      first.el.style.transform = `translateX(18px)`;
      first.el.classList.add('is-serving');
      note.innerHTML = `<code>warteschlange.pop(0)</code> → <strong>${first.label}</strong> wird vorn bearbeitet; alle anderen rücken nach.`;
      items.forEach((t, i) => (t.el.style.transform = x(i)));
      paint();
      await sleep(520);
      first.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' }).finished.then(() => first.el.remove(), () => first.el.remove());
      busy = false;
    }
    function toggleAuto() {
      if (timer) {
        clearInterval(timer);
        timer = null;
        autoBtn.textContent = 'Auto-Betrieb';
        autoBtn.classList.remove('is-on');
        return;
      }
      autoBtn.textContent = 'Stopp';
      autoBtn.classList.add('is-on');
      timer = setInterval(() => (tick++ % 3 === 2 ? dequeue() : enqueue()), 1100);
    }
    function reset() {
      if (timer) toggleAuto();
      track.querySelectorAll('.qcell').forEach((e) => e.remove());
      nextId = 0;
      done = [];
      busy = false;
      items = Array.from({ length: cfg.start }, (_, i) => cell(label(), i));
      note.textContent = 'Neue Tickets stellen sich hinten an. Bearbeitet wird immer das vorderste.';
      paint();
    }

    root.append(
      h('div.panel', h('div.panel-title', 'Warteschlange'), h('div.slots-scroll.q-scroll', track)),
      h('div.panel', h('div.chip-row',
        h('button.btn.btn-primary', { onclick: enqueue }, '+ Neues Ticket (append)'),
        h('button.btn.btn-ghost', { onclick: dequeue }, 'Nächstes bearbeiten (pop(0))'),
        autoBtn,
        h('button.btn.btn-ghost', { onclick: reset }, '↺ Neu')),
        h('div.panel-title.mt', 'Liste dahinter'), repr, h('div.mt', stats), h('div.q-done-wrap', doneEl)),
      note,
      h('p.muted.small', 'Hinweis: Bei Python-Listen muss <code>pop(0)</code> alle übrigen Elemente nachrücken lassen (O(n)). Für große Warteschlangen nutzt man <code>collections.deque</code> mit <code>popleft()</code>.'),
    );
    reset();
    return { destroy() { if (timer) clearInterval(timer); } };
  };

  /* ------------------------------------------------- Szene: Linked List */

  scenes.linkedNodes = (root, cfg, ctx) => {
    const SLOTS = [[4, 12], [32, 62], [62, 10], [74, 62]]; // Position der Knoten im "Speicher" (in %)
    const NEW_SLOT = [34, 8];
    const ADDRS = ['0x1A40', '0x2F88', '0x3C10', '0x4B24'];
    const NEW_ADDR = '0x5D70';
    let sel = 1;
    let nodes = [];
    let head = null;
    let hot = new Set();
    let newNode = null;

    const area = h('div.mem-area');
    const arrows = svg('svg', { class: 'arrows' });
    const defs = svg('defs');
    const marker = svg('marker', { id: 'ah', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' });
    marker.append(svg('path', { d: 'M0,0 L10,5 L0,10 z', class: 'arrow-head' }));
    defs.append(marker);
    arrows.append(defs);
    area.append(arrows);
    const chain = h('code.repr');
    const note = h('p.step-note', 'Wähle den Vorgänger und drücke ▶ Schritt.');
    const lineEls = [
      'neu = Node("Neuer Song")',
      'neu.next = vorgaenger.next',
      'vorgaenger.next = neu',
    ].map((l, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(l) })));
    const selRow = h('div.scene-tabs');

    function makeNode(titel, addr, [x, y]) {
      const nxt = h('span.nxt', 'None');
      const el = h('div.node', { style: { left: x + '%', top: y + '%' } },
        h('small.addr', addr), h('div.node-body', h('b', titel), nxt));
      area.append(el);
      return { titel, addr, el, nxt, next: null };
    }
    function drawArrows() {
      arrows.querySelectorAll('path.link').forEach((p) => p.remove());
      const A = area.getBoundingClientRect();
      const all = newNode && !nodes.includes(newNode) ? [...nodes, newNode] : nodes;
      all.forEach((n) => {
        n.nxt.textContent = n.next ? n.next.addr : 'None';
        n.el.classList.toggle('is-head', n === head);
        if (!n.next) return;
        const s = n.nxt.getBoundingClientRect();
        const e = n.next.el.getBoundingClientRect();
        const sx = s.right - A.left;
        const sy = s.top + s.height / 2 - A.top;
        const ex = e.left - A.left - 2;
        const ey = e.top + e.height / 2 - A.top;
        const dx = Math.max(50, Math.abs(ex - sx) / 2);
        const p = svg('path', {
          class: 'link' + (hot.has(n) ? ' hot' : ''),
          d: `M${sx},${sy} C${sx + dx},${sy} ${ex - dx},${ey} ${ex},${ey}`,
          'marker-end': 'url(#ah)',
        });
        arrows.append(p);
      });
    }
    function chainText() {
      const out = [];
      for (let n = head; n; n = n.next) out.push(n.titel);
      chain.textContent = out.join(' → ') + ' → None';
    }
    function build() {
      area.querySelectorAll('.node').forEach((n) => n.remove());
      newNode = null;
      hot = new Set();
      nodes = cfg.songs.map((t, i) => makeNode(t, ADDRS[i], SLOTS[i]));
      nodes.forEach((n, i) => (n.next = nodes[i + 1] || null));
      head = nodes[0];
      chainText();
      requestAnimationFrame(drawArrows);
    }
    function paintSel() {
      selRow.replaceChildren(h('span.panel-title.inline', 'Einfügen nach:'), ...cfg.songs.map((t, i) =>
        h('button.pill' + (i === sel ? '.is-active' : ''), { onclick: () => { sel = i; paintSel(); ctl.reset(); } }, t)));
    }

    const ctl = controlBar({
      total: 3,
      onStep(i) {
        ctx.touch();
        const pred = nodes[sel];
        lineEls.forEach((l, j) => l.classList.toggle('is-active', j === i));
        if (i === 0) {
          newNode = makeNode(cfg.newSong, NEW_ADDR, NEW_SLOT);
          newNode.el.classList.add('is-new');
          newNode.el.animate([{ opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1 }], { duration: 400, easing: 'cubic-bezier(.2,1.3,.4,1)' });
          note.innerHTML = `Ein neuer Knoten entsteht irgendwo im freien Speicher (<code>${NEW_ADDR}</code>). Noch zeigt er auf <code>None</code>, und <strong>die Kette ist unverändert</strong>.`;
        } else if (i === 1) {
          newNode.next = pred.next;
          hot = new Set([newNode]);
          note.innerHTML = pred.next
            ? `Der neue Knoten übernimmt den Zeiger des Vorgängers: Er zeigt jetzt auf <strong>${pred.next.titel}</strong>. Erst <em>danach</em> darf der Vorgänger umgebogen werden — sonst ginge der Rest der Kette verloren.`
            : 'Der Vorgänger ist der letzte Knoten, sein <code>next</code> ist <code>None</code>. Der neue Knoten übernimmt das und wird das neue Kettenende.';
        } else {
          pred.next = newNode;
          hot = new Set([pred]);
          const idx = nodes.indexOf(pred);
          nodes.splice(idx + 1, 0, newNode);
          chainText();
          note.innerHTML = `Der Zeiger von <strong>${pred.titel}</strong> zeigt jetzt auf den neuen Knoten. <strong>2 Zeiger geändert, 0 Elemente verschoben</strong> — alle Knoten liegen noch an ihrer Adresse. Eine Python-Liste müsste bei <code>insert</code> alle folgenden Elemente nach rechts rücken.`;
        }
        drawArrows();
      },
      onReset() {
        lineEls.forEach((l) => l.classList.remove('is-active'));
        note.textContent = 'Wähle den Vorgänger und drücke ▶ Schritt.';
        build();
      },
    });

    const onResize = () => drawArrows();
    window.addEventListener('resize', onResize);

    root.append(
      h('div.panel', selRow),
      h('div.panel', h('div.panel-title', 'Speicher (Knoten mit Adresse und next-Zeiger)'), h('div.mem-scroll', area), h('div.panel-title.mt', 'Kette'), chain),
      h('div.panel.panel-code', h('div.panel-title', 'Zeiger umbiegen'), h('div.code-block', lineEls)),
      note, ctl.el,
    );
    paintSel();
    build();
    return { destroy() { window.removeEventListener('resize', onResize); ctl.destroy(); } };
  };

  /* ------------------------------------------------- Szene: Hash-Tabelle */

  scenes.hashTable = (root, cfg, ctx) => {
    const N = cfg.buckets;
    const buckets = Array.from({ length: N }, () => []);
    const layer = h('div.fly-layer');
    let busy = false;

    const hashOf = (key) => {
      const codes = [...key].map((c) => c.charCodeAt(0));
      const sum = codes.reduce((a, b) => a + b, 0);
      return { codes, sum, idx: sum % N };
    };
    const input = h('input.field', { type: 'text', placeholder: 'Schlüssel, z. B. Maus', 'aria-label': 'Schlüssel', maxlength: 14 });
    const calc = h('div.calc', h('span.dim', 'Wähle oder tippe einen Schlüssel.'));
    const note = h('p.step-note', 'Eine Hash-Funktion macht aus dem Schlüssel eine Zahl — die bestimmt den Bucket. So findet <code>d["Maus"]</code> den Eintrag ohne Suchen.');
    const rows = buckets.map((_, i) => {
      const items = h('div.bk-items');
      const row = h('div.bucket', h('span.bk-idx', i), items);
      return { row, items };
    });
    const tableEl = h('div.buckets', rows.map((r) => r.row));
    const repr = h('code.repr');

    const paint = () => {
      rows.forEach((r, i) => r.items.replaceChildren(...buckets[i].map((e) => h('span.entry', h('b', e.key), `: ${e.value}`))));
      const all = buckets.flat();
      repr.textContent = 'preise = {' + all.map((e) => `"${e.key}": ${e.value}`).join(', ') + '}';
    };
    const showCalc = (key, hs) => {
      calc.replaceChildren(
        h('div', h('code', `hash("${key}")`), ' = ', hs.codes.join(' + '), ' = ', h('strong', hs.sum)),
        h('div', h('strong', hs.sum), ` % ${N} = `, h('strong.accent', hs.idx), h('span.dim', `   → Bucket ${hs.idx}`)));
    };
    const clearMarks = () => rows.forEach((r) => r.row.classList.remove('is-hit', 'is-collide', 'is-miss'));
    const getKey = () => input.value.trim();

    async function put(key) {
      if (busy || !key) return;
      busy = true;
      ctx.touch();
      clearMarks();
      const hs = hashOf(key);
      showCalc(key, hs);
      const bucket = buckets[hs.idx];
      const existing = bucket.find((e) => e.key === key);
      const value = existing ? existing.value : (cfg.prices[key] ?? Math.round((hs.sum % 90 + 10) * 1.1 * 10) / 10);
      const target = rows[hs.idx].row;
      target.classList.add('is-hit');
      await flyChip(layer, input, target, key, 'str');
      if (existing) {
        note.innerHTML = `Der Schlüssel <strong>${key}</strong> ist schon im Bucket ${hs.idx}: Der Wert wird <strong>überschrieben</strong>, kein neuer Eintrag.`;
      } else {
        const collision = bucket.length > 0;
        bucket.push({ key, value });
        if (collision) {
          target.classList.add('is-collide');
          note.innerHTML = `<strong>Kollision!</strong> Bucket ${hs.idx} gehört schon <strong>${bucket[0].key}</strong>. Beide Einträge werden im selben Bucket verkettet (Chaining). Python löst das intern ähnlich, nur geschickter.`;
        } else {
          note.innerHTML = `<code>preise["${key}"] = ${value}</code> → Der Eintrag landet direkt in Bucket ${hs.idx}.`;
        }
      }
      paint();
      busy = false;
    }
    function get(key) {
      if (busy || !key) return;
      ctx.touch();
      clearMarks();
      const hs = hashOf(key);
      showCalc(key, hs);
      const row = rows[hs.idx].row;
      const hit = buckets[hs.idx].find((e) => e.key === key);
      row.classList.add(hit ? 'is-hit' : 'is-miss');
      note.innerHTML = hit
        ? `<code>preise["${key}"]</code> → Hash berechnen, direkt zu Bucket ${hs.idx}, Wert <strong>${hit.value}</strong> gefunden. Kein Durchsuchen aller Einträge: <strong>O(1)</strong>.`
        : `Bucket ${hs.idx} enthält <code>"${key}"</code> nicht → <span class="err-text">KeyError: '${key}'</span> (mit <code>.get()</code> bekämst du <code>None</code>).`;
    }

    const keyChips = h('div.chip-row', cfg.keys.map((k) => h('button.pill', { onclick: () => { input.value = k; showCalc(k, hashOf(k)); } }, k)));
    root.append(
      h('div.scene-grid',
        h('div.panel',
          h('div.panel-title', 'Schlüssel'), keyChips,
          h('div.row-inline', input,
            h('button.btn.btn-primary', { onclick: () => put(getKey()) }, 'put'),
            h('button.btn.btn-ghost', { onclick: () => get(getKey()) }, 'get')),
          h('div.panel-title', 'Hash-Funktion (vereinfacht)'), calc,
          h('div.panel-title.mt', 'Dictionary'), repr,
          h('button.btn.btn-ghost.mt', { onclick: () => { buckets.forEach((b) => (b.length = 0)); clearMarks(); paint(); } }, '↺ Leeren'),
        ),
        h('div.panel', h('div.panel-title', `Hash-Tabelle (${N} Buckets)`), tableEl),
      ),
      note,
      layer,
    );
    paint();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Mengen-Kreise */

  let vennSeq = 0;
  scenes.vennSets = (root, cfg, ctx) => {
    const uid = 'v' + ++vennSeq;
    const A = new Set(cfg.a);
    const B = new Set(cfg.b);
    const CA = [190, 150];
    const CB = [330, 150];
    const R = 110;
    const only = (S, T) => [...S].filter((x) => !T.has(x));
    const zones = {
      a: only(A, B),
      both: [...A].filter((x) => B.has(x)),
      b: only(B, A),
    };
    const ops = [
      { id: 'and',  code: 'A & B', label: 'Schnittmenge', calc: () => zones.both,                              regions: [['B', 'clipA']] },
      { id: 'or',   code: 'A | B', label: 'Vereinigung',  calc: () => [...zones.a, ...zones.both, ...zones.b], regions: [['A'], ['B']] },
      { id: 'a-b',  code: 'A - B', label: 'Differenz A \\ B', calc: () => zones.a,                            regions: [['A', 'notB']] },
      { id: 'b-a',  code: 'B - A', label: 'Differenz B \\ A', calc: () => zones.b,                            regions: [['B', 'notA']] },
      { id: 'xor',  code: 'A ^ B', label: 'Symmetrische Differenz', calc: () => [...zones.a, ...zones.b],     regions: [['A', 'notB'], ['B', 'notA']] },
    ];
    let current = null;

    const s = svg('svg', { viewBox: '0 0 520 300', class: 'venn', role: 'img', 'aria-label': 'Venn-Diagramm der Mengen A und B' });
    const defs = svg('defs');
    const clip = svg('clipPath', { id: uid + 'clipA' });
    clip.append(svg('circle', { cx: CA[0], cy: CA[1], r: R }));
    const mask = (id, c) => {
      const m = svg('mask', { id: uid + id });
      m.append(svg('rect', { width: 520, height: 300, fill: '#fff' }), svg('circle', { cx: c[0], cy: c[1], r: R, fill: '#000' }));
      return m;
    };
    defs.append(clip, mask('notB', CB), mask('notA', CA));
    const hl = svg('g', { class: 'venn-hl' });
    const circle = (c, cls) => svg('circle', { cx: c[0], cy: c[1], r: R, class: cls });
    const label = (x, txt) => { const t = svg('text', { x, y: 52, class: 'venn-label', 'text-anchor': 'middle' }); t.textContent = txt; return t; };
    s.append(defs, hl, circle(CA, 'venn-c'), circle(CB, 'venn-c'), label(130, 'A'), label(390, 'B'));

    const texts = new Map();
    const place = (list, x) => list.forEach((ip, i) => {
      const t = svg('text', { x, y: 150 + (i - (list.length - 1) / 2) * 26 + 4, class: 'venn-el', 'text-anchor': 'middle' });
      t.textContent = ip;
      s.append(t);
      texts.set(ip, t);
    });
    place(zones.a, 142);
    place(zones.both, 260);
    place(zones.b, 378);

    const fmt = (arr) => '{' + [...arr].sort().map((x) => `'${x}'`).join(', ') + '}';
    const code = h('pre.code-static');
    const result = h('div.console');
    const btns = h('div.chip-row');

    function paint() {
      hl.replaceChildren();
      texts.forEach((t) => t.classList.remove('in'));
      if (!current) {
        code.innerHTML = highlight(`A = ${fmt(A)}\nB = ${fmt(B)}`);
        result.replaceChildren(h('span.dim', 'Klicke eine Operation, um das Ergebnis zu sehen.'));
      } else {
        current.regions.forEach(([c, m]) => {
          const el = circle(c === 'A' ? CA : CB, 'venn-fill');
          if (m === 'clipA') el.setAttribute('clip-path', `url(#${uid}clipA)`);
          else if (m) el.setAttribute('mask', `url(#${uid}${m})`);
          hl.append(el);
        });
        const res = current.calc();
        res.forEach((ip) => texts.get(ip).classList.add('in'));
        code.innerHTML = highlight(`A = ${fmt(A)}\nB = ${fmt(B)}\n\n${current.code}`);
        result.replaceChildren(h('div', fmt(res) + (res.length ? '' : ' → set()')), h('div.dim', `${current.label}: ${res.length} Element(e). Die Reihenfolge in einem Set ist nicht festgelegt.`));
      }
      btns.replaceChildren(...ops.map((o) =>
        h('button.pill' + (o === current ? '.is-active' : ''), { onclick: () => { current = o; ctx.touch(); paint(); } }, h('code', o.code), ' ', o.label)));
    }

    root.append(
      h('div.panel', h('div.panel-title', 'Operation'), btns),
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Mengen A und B'), s),
        h('div.panel', h('div.panel-title', 'Code'), code, h('div.panel-title.mt', 'Ergebnis'), result),
      ),
      h('p.step-note', 'Faustregel: <code>&amp;</code> = in <em>beiden</em>, <code>|</code> = in <em>mindestens einer</em>, <code>-</code> = in der linken, aber <em>nicht</em> in der rechten Menge.'),
    );
    paint();
    return { destroy() {} };
  };

  /* ------------------------------------------------- Szene: Ordner-Explorer */

  scenes.folderWalk = (root, cfg, ctx) => {
    const rows = [];
    (function walk(name, content, depth) {
      const isDir = typeof content === 'object';
      rows.push({ name, depth, isDir, size: isDir ? null : content });
      if (isDir) Object.entries(content).forEach(([k, v]) => walk(k, v, depth + 1));
    })('/ (Wurzel)', cfg.tree, 0);

    const rowEls = rows.map((r) => h('div.tree-row' + (r.isDir ? '.is-dir' : ''), { style: { paddingLeft: 10 + r.depth * 22 + 'px' } },
      h('span.tree-ico', r.isDir ? '▸' : '·'), r.name));
    const treeEl = h('div.tree', rowEls);
    const callPath = h('div.call-path');
    const cntFiles = h('strong', '0');
    const cntDepth = h('strong', '0');
    const note = h('p.step-note', 'Drücke ▶ Schritt: Die Funktion besucht Eintrag für Eintrag — Ordner lösen einen neuen rekursiven Aufruf aus.');
    const lines = [
      'def dateien_zaehlen(ordner):',
      '    anzahl = 0',
      '    for inhalt in ordner.values():',
      '        if isinstance(inhalt, dict):',
      '            anzahl += dateien_zaehlen(inhalt)',
      '        else:',
      '            anzahl += 1',
      '    return anzahl',
    ];
    const lineEls = lines.map((l, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(l) })));

    let files = 0;
    let maxDepth = 0;
    let path = [];
    const ctl = controlBar({
      total: rows.length,
      interval: 900,
      onStep(i) {
        ctx.touch();
        const r = rows[i];
        rowEls.forEach((e, j) => { e.classList.remove('is-now'); if (j < i) e.classList.add('is-done'); });
        rowEls[i].classList.add('is-now');
        path = path.slice(0, r.isDir ? r.depth : Math.max(0, r.depth));
        if (r.isDir) path.push(r.name);
        maxDepth = Math.max(maxDepth, r.depth + 1);
        lineEls.forEach((l) => l.classList.remove('is-active'));
        if (r.isDir) {
          lineEls[4].classList.add('is-active');
          note.innerHTML = `<strong>${r.name}</strong> ist ein Ordner → rekursiver Aufruf <code>dateien_zaehlen(inhalt)</code>. Der Stack wird eine Ebene tiefer (Tiefe ${r.depth + 1}).`;
        } else {
          files++;
          lineEls[6].classList.add('is-active');
          note.innerHTML = `<strong>${r.name}</strong> ist eine Datei → <code>anzahl += 1</code>. Kein weiterer Aufruf nötig (<em>Basisfall</em> dieses Zweigs).`;
        }
        cntFiles.textContent = files;
        cntDepth.textContent = maxDepth;
        callPath.replaceChildren(...path.flatMap((p, k) => [k ? h('span.sep', '→') : null, h('code', k === 0 ? 'dateien_zaehlen(wurzel)' : `dateien_zaehlen(${p})`)]).filter(Boolean));
        if (i === rows.length - 1) note.innerHTML += ` Fertig: <strong>${files} Dateien</strong>, tiefste Ebene ${maxDepth}.`;
      },
      onReset() {
        files = 0; maxDepth = 0; path = [];
        rowEls.forEach((e) => e.classList.remove('is-now', 'is-done'));
        lineEls.forEach((l) => l.classList.remove('is-active'));
        cntFiles.textContent = '0';
        cntDepth.textContent = '0';
        callPath.replaceChildren();
        note.textContent = 'Drücke ▶ Schritt: Die Funktion besucht Eintrag für Eintrag — Ordner lösen einen neuen rekursiven Aufruf aus.';
      },
    });

    root.append(
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Ordnerbaum'), treeEl,
          h('div.slots-meta.mt', h('span', 'Dateien gezählt: ', cntFiles), h('span', 'tiefste Ebene: ', cntDepth)),
          h('div.panel-title.mt', 'Aufrufkette'), callPath),
        h('div.panel.panel-code', h('div.panel-title', 'Code'), h('div.code-block', lineEls)),
      ),
      note, ctl.el,
    );
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------- Szene: Sortier-Balken */

  scenes.sortBars = (root, cfg, ctx) => {
    const data = cfg.data;
    const n = data.length;
    const maxV = Math.max(...data);
    let algo = 'bubble';
    let events = [];

    function genBubble() {
      const a = [...data];
      const ev = [];
      let cmp = 0;
      let swaps = 0;
      let sortedFrom = n;
      for (let i = 0; i < n - 1; i++) {
        let swapped = false;
        for (let j = 0; j < n - 1 - i; j++) {
          cmp++;
          ev.push({ t: 'cmp', i: j, j: j + 1, arr: [...a], sortedFrom, stats: [cmp, swaps],
            note: `Vergleiche <code>${a[j]}</code> und <code>${a[j + 1]}</code>: ${a[j] > a[j + 1] ? 'linker ist größer → tauschen' : 'Reihenfolge stimmt → weiter'}.` });
          if (a[j] > a[j + 1]) {
            [a[j], a[j + 1]] = [a[j + 1], a[j]];
            swaps++;
            ev.push({ t: 'swap', i: j, j: j + 1, arr: [...a], sortedFrom, stats: [cmp, swaps], note: 'Getauscht: der größere Wert „blubbert“ nach rechts.' });
            swapped = true;
          }
        }
        sortedFrom = n - 1 - i;
        ev.push({ t: 'pass', arr: [...a], sortedFrom, stats: [cmp, swaps],
          note: swapped ? `Durchlauf ${i + 1} fertig: Der größte Wert sitzt ganz rechts.` : `Durchlauf ${i + 1} ohne Tausch — die Liste ist sortiert, früher Abbruch!` });
        if (!swapped) { ev[ev.length - 1].sortedFrom = 0; break; }
      }
      ev.push({ t: 'done', arr: [...a], sortedFrom: 0, stats: [cmp, swaps], note: `<strong>Sortiert.</strong> ${cmp} Vergleiche und ${swaps} Tausche — bei großen Listen wächst das quadratisch (O(n²)).` });
      return ev;
    }
    function genMerge() {
      const a = [...data];
      const ev = [];
      let splits = 0;
      let merges = 0;
      (function ms(lo, hi) {
        if (hi - lo < 2) return;
        splits++;
        ev.push({ t: 'split', lo, hi, arr: [...a], stats: [splits, merges], note: `Teilen: Bereich <code>[${lo}:${hi}]</code> hat ${hi - lo} Elemente und wird halbiert.` });
        const mid = (lo + hi) >> 1;
        ms(lo, mid);
        ms(mid, hi);
        const l = a.slice(lo, mid);
        const r = a.slice(mid, hi);
        const out = [];
        let i = 0;
        let j = 0;
        while (i < l.length && j < r.length) out.push(l[i] <= r[j] ? l[i++] : r[j++]);
        out.push(...l.slice(i), ...r.slice(j));
        a.splice(lo, hi - lo, ...out);
        merges++;
        ev.push({ t: 'merge', lo, hi, arr: [...a], stats: [splits, merges], note: `Mischen: Die sortierten Hälften <code>[${l}]</code> und <code>[${r}]</code> werden zu <code>[${out}]</code> zusammengefügt.` });
      })(0, n);
      ev.push({ t: 'done', arr: [...a], lo: 0, hi: n, stats: [splits, merges], note: `<strong>Sortiert.</strong> ${splits} Teilungen, ${merges} Mischvorgänge — nur etwa n·log n Arbeit (O(n log n)).` });
      return ev;
    }
    const gen = () => (events = algo === 'bubble' ? genBubble() : genMerge());

    const bars = data.map((v) => h('div.sbar', h('i', { style: { height: (v / maxV) * 100 + '%' } }), h('span', v)));
    const barsEl = h('div.sort-bars', bars);
    const stat1 = h('strong', '0');
    const stat2 = h('strong', '0');
    const label1 = h('span');
    const label2 = h('span');
    const note = h('p.step-note');
    const codeBox = h('pre.code-static');
    const pills = h('div.scene-tabs');

    const CODE = {
      bubble: 'for i in range(n):\n    for j in range(n - 1 - i):\n        if liste[j] > liste[j + 1]:\n            liste[j], liste[j + 1] = liste[j + 1], liste[j]',
      merge: 'def merge_sort(liste):\n    if len(liste) <= 1:\n        return liste\n    mitte = len(liste) // 2\n    links = merge_sort(liste[:mitte])\n    rechts = merge_sort(liste[mitte:])\n    return mische(links, rechts)',
    };
    function paintBars(arr, cls = {}) {
      bars.forEach((b, k) => {
        b.firstChild.style.height = (arr[k] / maxV) * 100 + '%';
        b.lastChild.textContent = arr[k];
        b.className = 'sbar' + (cls[k] ? ' ' + cls[k] : '');
      });
    }
    function paintPills() {
      pills.replaceChildren(...[['bubble', 'Bubble Sort'], ['merge', 'Merge Sort']].map(([id, label]) =>
        h('button.pill' + (id === algo ? '.is-active' : ''), { onclick: () => { algo = id; paintPills(); gen(); ctl.setTotal(events.length); ctl.reset(); } }, label)));
      codeBox.innerHTML = highlight(CODE[algo]);
      label1.textContent = algo === 'bubble' ? 'Vergleiche: ' : 'Teilungen: ';
      label2.textContent = algo === 'bubble' ? 'Tausche: ' : 'Mischvorgänge: ';
    }
    gen();

    const ctl = controlBar({
      total: events.length,
      interval: 520,
      onStep(i) {
        ctx.touch();
        const e = events[i];
        const cls = {};
        if (algo === 'bubble') {
          for (let k = e.sortedFrom; k < n; k++) cls[k] = 'is-sorted';
          if (e.t === 'cmp') cls[e.i] = cls[e.j] = 'is-cmp';
          if (e.t === 'swap') cls[e.i] = cls[e.j] = 'is-swap';
        } else if (e.t === 'split') {
          for (let k = e.lo; k < e.hi; k++) cls[k] = 'is-cmp';
        } else {
          for (let k = e.lo; k < e.hi; k++) cls[k] = e.t === 'done' ? 'is-sorted' : 'is-merged';
        }
        paintBars(e.arr, cls);
        stat1.textContent = e.stats[0];
        stat2.textContent = e.stats[1];
        note.innerHTML = e.note;
      },
      onReset() {
        paintBars(data);
        stat1.textContent = stat2.textContent = '0';
        note.textContent = 'Drücke ▶ Schritt oder starte Auto-Play.';
      },
    });
    ctl.reset();
    paintPills();

    root.append(
      pills,
      h('div.panel', h('div.panel-title', 'liste = [' + data.join(', ') + ']'), barsEl,
        h('div.slots-meta', h('span', label1, stat1), h('span', label2, stat2))),
      note, ctl.el,
      h('div.panel', h('div.panel-title', 'Kernidee'), codeBox),
    );
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------- Szene: BST-Suche */

  scenes.bstSearch = (root, cfg, ctx) => {
    const R = 20;
    let tree = null;
    let token = 0;
    const insertNode = (node, v) => {
      if (!node) return { v, l: null, r: null };
      if (v < node.v) node.l = insertNode(node.l, v);
      else if (v > node.v) node.r = insertNode(node.r, v);
      return node;
    };
    const reset = () => { tree = null; cfg.values.forEach((v) => (tree = insertNode(tree, v))); };
    reset();

    const view = { path: new Set(), cur: null, found: null, ghost: null, fresh: null };
    const svgEl = svg('svg', { class: 'bst', role: 'img', 'aria-label': 'Binärer Suchbaum' });
    const log = h('div.bst-log');
    const input = h('input.field', { type: 'number', placeholder: 'Zahl', 'aria-label': 'Zahl' });
    const note = h('p.step-note', 'Wähle ein Beispiel oder tippe eine Zahl, dann „Suchen“ oder „Einfügen“.');

    function layout() {
      const list = [];
      let idx = 0;
      let maxD = 0;
      (function go(node, d, parent) {
        if (!node) return;
        go(node.l, d + 1, node);
        node.x = 36 + idx++ * 52;
        node.y = 36 + d * 72;
        node.d = d;
        maxD = Math.max(maxD, d);
        list.push(node);
        go(node.r, d + 1, node);
      })(tree, 0, null);
      return { list, maxD, width: Math.max(1, idx) * 52 + 20 };
    }
    function draw() {
      const { list, maxD, width } = layout();
      const height = (maxD + 1) * 72 + (view.ghost ? 70 : 20);
      svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svgEl.style.maxWidth = Math.max(width, 320) + 'px';
      svgEl.replaceChildren();
      const edge = (a, b, cls) => svgEl.append(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'bst-edge' + (cls ? ' ' + cls : '') }));
      list.forEach((n) => {
        if (n.l) edge(n, n.l, view.path.has(n.v) && view.path.has(n.l.v) ? 'on' : '');
        if (n.r) edge(n, n.r, view.path.has(n.v) && view.path.has(n.r.v) ? 'on' : '');
      });
      if (view.ghost) {
        const g = view.ghost;
        const p = list.find((n) => n.v === g.parent);
        const gx = p.x + (g.dir === 'l' ? -30 : 30);
        const gy = p.y + 64;
        edge(p, { x: gx, y: gy }, 'on');
        svgEl.append(svg('circle', { cx: gx, cy: gy, r: 16, class: 'bst-ghost' }));
        const t = svg('text', { x: gx, y: gy + 4, 'text-anchor': 'middle', class: 'bst-none' });
        t.textContent = 'None';
        svgEl.append(t);
      }
      list.forEach((n) => {
        const cls = 'bst-node' + (view.path.has(n.v) ? ' on' : '') + (view.cur === n.v ? ' cur' : '') + (view.found === n.v ? ' found' : '') + (view.fresh === n.v ? ' fresh' : '');
        const g = svg('g', { class: cls });
        g.append(svg('circle', { cx: n.x, cy: n.y, r: R }));
        const t = svg('text', { x: n.x, y: n.y + 5, 'text-anchor': 'middle' });
        t.textContent = n.v;
        g.append(t);
        svgEl.append(g);
      });
    }
    const clearView = () => { view.path = new Set(); view.cur = null; view.found = null; view.ghost = null; view.fresh = null; };
    const sleep2 = (ms) => new Promise((r) => setTimeout(r, ms));
    const addLog = (html) => { log.prepend(h('div', { html })); while (log.children.length > 6) log.lastChild.remove(); };

    async function walk(q, insert) {
      const mine = ++token;
      ctx.touch();
      clearView();
      log.replaceChildren();
      draw();
      let node = tree;
      let steps = 0;
      if (!node) {
        tree = insertNode(tree, q);
        view.fresh = q; draw();
        note.textContent = 'Der Baum war leer — der Wert wird zur Wurzel.';
        return;
      }
      while (node) {
        if (mine !== token) return;
        view.cur = node.v;
        view.path.add(node.v);
        steps++;
        draw();
        if (q === node.v) {
          view.found = node.v; view.cur = null; draw();
          addLog(`<code>${q} == ${node.v}</code> → ${insert ? 'schon vorhanden (Duplikate werden nicht eingefügt)' : '<strong>gefunden!</strong>'}`);
          note.innerHTML = insert
            ? `<strong>${q}</strong> steht schon im Baum, es wird nichts eingefügt.`
            : `<strong>${q}</strong> nach ${steps} Vergleich(en) gefunden — der Baum hat ${layout().list.length} Knoten.`;
          return;
        }
        const left = q < node.v;
        const next = left ? node.l : node.r;
        addLog(`<code>${q} ${left ? '<' : '>'} ${node.v}</code> → nach ${left ? 'links' : 'rechts'}${next ? '' : ' — dort ist <strong>None</strong>'}`);
        await sleep2(700);
        if (!next) {
          if (insert) {
            if (left) node.l = { v: q, l: null, r: null }; else node.r = { v: q, l: null, r: null };
            view.cur = null; view.fresh = q; view.path.add(q); draw();
            note.innerHTML = `<strong>${q}</strong> wird nach ${steps} Vergleich(en) als ${left ? 'linkes' : 'rechtes'} Kind von <strong>${node.v}</strong> eingefügt: <code>${left ? 'links' : 'rechts'} = Knoten(${q})</code>.`;
          } else {
            view.cur = null; view.ghost = { parent: node.v, dir: left ? 'l' : 'r' }; draw();
            note.innerHTML = `Nach ${steps} Vergleich(en) endet der Pfad bei <code>None</code> — <strong>${q}</strong> ist nicht im Baum.`;
          }
          return;
        }
        node = next;
      }
    }
    const run = (insert) => {
      const q = parseInt(input.value, 10);
      if (Number.isNaN(q)) { note.textContent = 'Bitte eine ganze Zahl eingeben.'; return; }
      walk(q, insert);
    };

    root.append(
      h('div.panel',
        h('div.panel-title', 'Beispiele'),
        h('div.chip-row', cfg.examples.map((v) => h('button.pill', { onclick: () => { input.value = v; run(false); } }, String(v)))),
        h('div.row-inline', input,
          h('button.btn.btn-primary', { onclick: () => run(false) }, 'Suchen'),
          h('button.btn.btn-ghost', { onclick: () => run(true) }, 'Einfügen'),
          h('button.btn.btn-ghost', { onclick: () => { token++; reset(); clearView(); log.replaceChildren(); draw(); note.textContent = 'Baum zurückgesetzt.'; } }, '↺ Neu'))),
      h('div.panel', h('div.panel-title', 'Suchbaum'), h('div.bst-wrap', svgEl)),
      h('div.panel', h('div.panel-title', 'Vergleiche'), log),
      note,
    );
    draw();
    return { destroy() { token++; } };
  };

  /* ----------------------------------------- Szene: Baum-Traversierung */

  scenes.treeWalk = (root, cfg, ctx) => {
    const nodes = [];
    (function build(t, d, parent) {
      if (!t) return null;
      const n = { name: t.n, d, parent, l: null, r: null };
      nodes.push(n);
      n.l = build(t.l, d + 1, n);
      n.r = build(t.r, d + 1, n);
      return n;
    })(cfg.tree, 0, null);
    const top = nodes[0];
    let xi = 0;
    (function place(n) {
      if (!n) return;
      place(n.l);
      n.x = 40 + xi++ * 66;
      n.y = 30 + n.d * 64;
      place(n.r);
    })(top);
    const W = xi * 66 + 14;
    const H = (Math.max(...nodes.map((n) => n.d)) + 1) * 64 + 14;

    const MODES = {
      pre:  { label: 'Preorder',  hint: 'Wurzel → Links → Rechts', fn: 'preorder',  seq: ['v', 'l', 'r'], why: 'Preorder: Die Wurzel kommt <strong>zuerst</strong> — noch bevor ein Kind angeschaut wird.' },
      in:   { label: 'Inorder',   hint: 'Links → Wurzel → Rechts', fn: 'inorder',   seq: ['l', 'v', 'r'], why: 'Inorder: Erst ist der <strong>linke</strong> Teilbaum komplett fertig, dann ist die Wurzel dran.' },
      post: { label: 'Postorder', hint: 'Links → Rechts → Wurzel', fn: 'postorder', seq: ['l', 'r', 'v'], why: 'Postorder: Die Wurzel kommt <strong>zuletzt</strong> — erst wenn beide Kinder erledigt sind.' },
    };
    const codeFor = (m) => {
      const f = MODES[m].fn;
      const stm = { v: '    print(k.wert)', l: `    ${f}(k.links)`, r: `    ${f}(k.rechts)` };
      return [`def ${f}(k):`, '    if k is None:', '        return', ...MODES[m].seq.map((s) => stm[s])];
    };

    let mode = 'pre';
    let snaps = [];
    const trace = () => {
      const M = MODES[mode];
      const out = [];
      const stack = [];
      const res = [];
      const push = (cur, line, msg) => res.push({ cur, line, msg, out: out.slice(), stack: stack.slice() });
      (function go(n) {
        stack.push(n);
        push(n, 1, `Aufruf <code>${M.fn}(${n.name})</code> — nicht <code>None</code>, also geht es weiter.`);
        M.seq.forEach((s, i) => {
          const line = 3 + i;
          if (s === 'v') {
            out.push(n);
            push(n, line, `<strong>${n.name}</strong> wird ausgegeben (Platz ${out.length}). ${M.why}`);
          } else {
            const c = s === 'l' ? n.l : n.r;
            const side = s === 'l' ? 'linkes' : 'rechtes';
            if (!c) push(n, line, `${n.name} hat kein ${side} Kind: <code>${M.fn}(None)</code> kehrt sofort zurück (Basisfall).`);
            else {
              go(c);
              push(n, line, `Zurück bei <strong>${n.name}</strong>: der ${s === 'l' ? 'linke' : 'rechte'} Teilbaum ist fertig.`);
            }
          }
        });
        stack.pop();
      })(top);
      push(null, -1, `Fertig! ${M.label}: <strong>${out.map((n) => n.name).join(' → ')}</strong>`);
      return res;
    };

    const svgEl = svg('svg', { class: 'tw', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Binärbaum aus Ordnern' });
    svgEl.style.maxWidth = Math.max(W, 320) + 'px';
    const outEl = h('div.chip-row.tw-out');
    const pathEl = h('div.call-path');
    const codeEl = h('div.code-block');
    const note = h('p.step-note');
    const modeBtns = Object.keys(MODES).map((m) => h('button.pill', { onclick: () => setMode(m) }, MODES[m].label));

    function draw(s) {
      svgEl.replaceChildren();
      nodes.forEach((n) => [n.l, n.r].forEach((c) => c && svgEl.append(svg('line', { x1: n.x, y1: n.y, x2: c.x, y2: c.y, class: 'tw-edge' + (s && s.stack.includes(n) && s.stack.includes(c) ? ' on' : '') }))));
      nodes.forEach((n) => {
        const order = s ? s.out.indexOf(n) : -1;
        const cls = 'tw-node' + (s && s.stack.includes(n) ? ' in-stack' : '') + (s && s.cur === n ? ' cur' : '') + (order >= 0 ? ' done' : '');
        const g = svg('g', { class: cls });
        g.append(svg('rect', { x: n.x - 28, y: n.y - 15, width: 56, height: 30, rx: 8 }));
        const t = svg('text', { x: n.x, y: n.y + 5, 'text-anchor': 'middle' });
        t.textContent = n.name;
        g.append(t);
        if (order >= 0) {
          g.append(svg('circle', { cx: n.x + 26, cy: n.y - 15, r: 9, class: 'tw-badge' }));
          const b = svg('text', { x: n.x + 26, y: n.y - 11.5, 'text-anchor': 'middle', class: 'tw-badge-t' });
          b.textContent = order + 1;
          g.append(b);
        }
        svgEl.append(g);
      });
    }
    function paintCode(line) {
      codeEl.replaceChildren(...codeFor(mode).map((l, i) => h('div.code-line' + (i === line ? '.is-active' : ''), h('span.ln', i + 1), h('span.src', { html: highlight(l) }))));
    }
    function intro() {
      const M = MODES[mode];
      draw(null);
      paintCode(-1);
      outEl.replaceChildren();
      pathEl.replaceChildren();
      note.innerHTML = `<strong>${M.label}</strong> — ${M.hint}. Drücke ▶ Schritt und schau, wann jeder Ordner ausgegeben wird.`;
    }
    const ctl = controlBar({
      total: 0,
      interval: 950,
      onStep(i) {
        ctx.touch();
        const s = snaps[i];
        draw(s);
        paintCode(s.line);
        outEl.replaceChildren(...s.out.map((n) => h('code.tw-chip', n.name)));
        pathEl.replaceChildren(...s.stack.flatMap((n, k) => [k ? h('span.sep', '→') : null, h('code', `${MODES[mode].fn}(${n.name})`)]).filter(Boolean));
        note.innerHTML = s.msg;
      },
      onReset: intro,
    });
    function setMode(m) {
      mode = m;
      modeBtns.forEach((b, i) => b.classList.toggle('is-active', Object.keys(MODES)[i] === m));
      snaps = trace();
      ctl.setTotal(snaps.length);
      ctl.reset();
    }

    root.append(
      h('div.panel', h('div.panel-title', 'Reihenfolge wählen'), h('div.chip-row', modeBtns)),
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Ordnerbaum'), h('div.bst-wrap', svgEl),
          h('div.panel-title.mt', 'Aufrufkette'), pathEl),
        h('div.panel.panel-code', h('div.panel-title', 'Code'), codeEl,
          h('div.panel-title.mt', 'Ausgabe'), outEl)),
      note, ctl.el,
    );
    setMode('pre');
    return { destroy: ctl.destroy };
  };

  /* --------------------------------------------- Szene: Graph-Suche */

  scenes.graphSearch = (root, cfg, ctx) => {
    const names = Object.keys(cfg.nodes);
    const adj = {};
    names.forEach((n) => (adj[n] = []));
    cfg.edges.forEach(([a, b]) => { adj[a].push(b); adj[b].push(a); });

    let algo = 'bfs';
    let start = null;
    let goal = null;
    let snaps = [];

    function trace() {
      const res = [];
      const parent = {};
      const visited = [];
      const finish = (cur, frontier, msg) => {
        const done = cur === goal;
        let path = null;
        if (done) {
          path = [goal];
          while (path[0] !== start) path.unshift(parent[path[0]]);
        }
        res.push({ cur, visited: visited.slice(), frontier, parent: { ...parent }, path, msg });
        return done;
      };
      if (algo === 'bfs') {
        const seen = new Set([start]);
        const q = [start];
        while (q.length) {
          const cur = q.shift();
          visited.push(cur);
          if (cur === goal) {
            finish(cur, q.slice(), `<strong>${cur}</strong> ist das Ziel! Die Route entsteht rückwärts über die „gekommen von“-Einträge.`);
            break;
          }
          const added = [];
          adj[cur].forEach((nb) => { if (!seen.has(nb)) { seen.add(nb); parent[nb] = cur; q.push(nb); added.push(nb); } });
          finish(cur, q.slice(), `Vorne aus der Warteschlange: <strong>${cur}</strong>. ${added.length ? `Neue Nachbarn hinten anstellen: <code>${added.join(', ')}</code>.` : 'Keine neuen Nachbarn — alle schon bekannt.'}`);
        }
      } else {
        const done = new Set();
        const st = [[start, null]];
        while (st.length) {
          const [cur, par] = st.pop();
          if (done.has(cur)) continue;
          done.add(cur);
          if (par) parent[cur] = par;
          visited.push(cur);
          if (cur === goal) {
            finish(cur, [...new Set(st.map((x) => x[0]))], `<strong>${cur}</strong> ist das Ziel! Diese Route muss nicht die kürzeste sein.`);
            break;
          }
          const nbs = adj[cur].filter((x) => !done.has(x));
          for (let i = nbs.length - 1; i >= 0; i--) st.push([nbs[i], cur]);
          finish(cur, [...new Set(st.map((x) => x[0]))].filter((x) => !done.has(x)), `Oben vom Stapel: <strong>${cur}</strong>. ${nbs.length ? `Nachbarn <code>${nbs.join(', ')}</code> kommen oben drauf — der erste wird als Nächstes gewählt, es geht erst mal <em>tief</em> hinein.` : 'Sackgasse! Zurück zum letzten offenen Abzweig.'}`);
        }
      }
      return res;
    }

    const svgEl = svg('svg', { class: 'gr', viewBox: '0 0 540 300', role: 'img', 'aria-label': 'Liniennetz mit Haltestellen' });
    const frontEl = h('div.chip-row.gr-front');
    const frontTitle = h('div.panel-title');
    const note = h('p.step-note');
    const algoBtns = { bfs: h('button.pill', { onclick: () => setAlgo('bfs') }, 'BFS · Breitensuche'), dfs: h('button.pill', { onclick: () => setAlgo('dfs') }, 'DFS · Tiefensuche') };
    const adjEl = h('pre.gr-adj');

    function draw(s) {
      svgEl.replaceChildren();
      const pathSet = new Set(s && s.path ? s.path : []);
      const onPath = (a, b) => s && s.path && pathSet.has(a) && pathSet.has(b) && Math.abs(s.path.indexOf(a) - s.path.indexOf(b)) === 1;
      const seenEdge = (a, b) => s && ((s.parent[a] === b && s.visited.includes(a)) || (s.parent[b] === a && s.visited.includes(b)));
      cfg.edges.forEach(([a, b]) => {
        const [x1, y1] = cfg.nodes[a];
        const [x2, y2] = cfg.nodes[b];
        svgEl.append(svg('line', { x1, y1, x2, y2, class: 'gr-edge' + (onPath(a, b) ? ' path' : seenEdge(a, b) ? ' seen' : '') }));
      });
      names.forEach((n) => {
        const [x, y] = cfg.nodes[n];
        const cls = 'gr-node'
          + (s && s.visited.includes(n) ? ' visited' : '')
          + (s && s.frontier.includes(n) ? ' front' : '')
          + (s && s.cur === n ? ' cur' : '')
          + (pathSet.has(n) ? ' path' : '')
          + (n === start ? ' is-start' : '') + (n === goal ? ' is-goal' : '');
        const g = svg('g', { class: cls, tabindex: 0, role: 'button', 'aria-label': 'Haltestelle ' + n });
        g.append(svg('circle', { cx: x, cy: y, r: 17 }));
        const t = svg('text', { x, y: y + 34, 'text-anchor': 'middle' });
        t.textContent = n;
        g.append(t);
        if (n === start || n === goal) {
          const m = svg('text', { x, y: y + 5, 'text-anchor': 'middle', class: 'gr-mark' });
          m.textContent = n === start ? 'S' : 'Z';
          g.append(m);
        }
        g.addEventListener('click', () => pick(n));
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(n); } });
        svgEl.append(g);
      });
    }
    function hint() {
      if (!start) note.innerHTML = 'Klicke eine <strong>Starthaltestelle</strong> (S) im Netz an.';
      else if (!goal) note.innerHTML = `Start: <strong>${start}</strong>. Klicke jetzt die <strong>Zielhaltestelle</strong> (Z) an.`;
      else note.innerHTML = `Route von <strong>${start}</strong> nach <strong>${goal}</strong> — drücke ▶ Schritt oder Auto-Play.`;
    }
    function paintFront(s) {
      frontTitle.textContent = algo === 'bfs' ? 'Warteschlange (vorne → hinten)' : 'Stapel (unten → oben)';
      frontEl.replaceChildren(...(s ? s.frontier : []).map((n) => h('code.tw-chip', n)));
    }
    const ctl = controlBar({
      total: 0,
      interval: 1000,
      onStep(i) {
        ctx.touch();
        const s = snaps[i];
        draw(s);
        paintFront(s);
        note.innerHTML = s.msg + (s.path ? `<br>Route: <strong>${s.path.join(' → ')}</strong> (${s.path.length - 1} Fahrten, ${s.visited.length} Haltestellen besucht).` : '');
      },
      onReset() { draw(null); paintFront(null); hint(); },
    });
    function compute() {
      if (start && goal) { snaps = trace(); ctl.setTotal(snaps.length); } else { snaps = []; ctl.setTotal(0); }
      ctl.reset();
    }
    function pick(n) {
      if (!start || (start && goal)) { start = n; goal = null; } else if (n !== start) goal = n; else return;
      compute();
    }
    function setAlgo(a) {
      algo = a;
      Object.keys(algoBtns).forEach((k) => algoBtns[k].classList.toggle('is-active', k === a));
      adjEl.textContent = 'netz = {\n' + names.map((n) => `    "${n}": [${adj[n].map((x) => `"${x}"`).join(', ')}],`).join('\n') + '\n}';
      compute();
    }

    root.append(
      h('div.panel', h('div.panel-title', 'Suchverfahren'), h('div.chip-row', algoBtns.bfs, algoBtns.dfs)),
      h('div.panel', h('div.panel-title', 'Liniennetz (klicke Start, dann Ziel)'), h('div.bst-wrap', svgEl)),
      h('div.scene-grid',
        h('div.panel', frontTitle, frontEl),
        h('div.panel.panel-code', h('div.panel-title', 'So sieht der Graph in Python aus'), adjEl)),
      note, ctl.el,
    );
    setAlgo('bfs');
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------- Szene: Klassen & Objekte */

  scenes.objectMemory = (root, cfg, ctx) => {
    const classEls = {};
    const classBox = h('div.oo-classes', cfg.classes.map((c) => {
      const el = h('div.oo-class',
        h('div.oo-head', h('strong', 'class ' + c.name), h('span.oo-inh', c.parent ? `erbt von ${c.parent}` : 'Basisklasse')),
        h('div.oo-sub', 'Attribute'), h('div.oo-list', c.attrs.map((a) => h('code', 'self.' + a))),
        h('div.oo-sub', 'Methoden'), h('div.oo-list', c.methods.map((m) => h('code', m))));
      classEls[c.name] = el;
      return el;
    }));
    const lineEls = cfg.script.map((s, i) => h('div.code-line', h('span.ln', i + 1), h('span.src', { html: highlight(s.code) })));
    const objBox = h('div.oo-objects');
    const note = h('p.step-note');
    const intro = 'Links steht die Blaupause, rechts entstehen die echten Objekte. Drücke ▶ Schritt — jede Zeile Code ändert den Speicher.';
    let objs = {};

    const ctl = controlBar({
      total: cfg.script.length,
      interval: 1400,
      onStep(i) {
        ctx.touch();
        const s = cfg.script[i];
        lineEls.forEach((l, j) => { l.classList.toggle('is-active', j === i); l.classList.toggle('is-done', j < i); });
        Object.values(classEls).forEach((c) => c.classList.remove('is-used'));
        if (s.make) {
          const cells = {};
          const rows = Object.entries(s.make.attrs).map(([k, v]) => {
            const cell = h('code.oo-val', v);
            cells[k] = cell;
            return h('div.oo-row', h('span', 'self.' + k), cell);
          });
          const card = h('div.oo-obj.pop', h('div.oo-obj-head', h('strong', s.make.var), h('span.oo-type', ': ' + s.make.cls)), rows);
          objBox.append(card);
          objs[s.make.var] = cells;
          classEls[s.make.cls].classList.add('is-used');
        } else if (s.set) {
          Object.entries(s.set.values).forEach(([k, v]) => {
            const cell = objs[s.set.var][k];
            cell.textContent = v;
            cell.classList.remove('flash');
            void cell.offsetWidth;
            cell.classList.add('flash');
          });
          classEls[s.set.cls].classList.add('is-used');
        }
        note.innerHTML = s.note;
      },
      onReset() {
        objs = {};
        objBox.replaceChildren();
        lineEls.forEach((l) => l.classList.remove('is-active', 'is-done'));
        Object.values(classEls).forEach((c) => c.classList.remove('is-used'));
        note.textContent = intro;
      },
    });
    note.textContent = intro;

    root.append(
      h('div.panel.panel-code', h('div.panel-title', 'Dein Programm'), h('div.code-block', lineEls)),
      h('div.scene-grid',
        h('div.panel', h('div.panel-title', 'Blaupausen (Klassen)'), classBox),
        h('div.panel', h('div.panel-title', 'Speicher: Objekte (Instanzen)'), objBox)),
      note, ctl.el,
    );
    return { destroy: ctl.destroy };
  };

  /* ------------------------------------------------------------- Export */

  /** Szene nach Namen rendern. Rückgabe: Objekt mit destroy(). */
  function renderScene(name, root, cfg, ctx) {
    const factory = scenes[name];
    if (!factory) {
      root.append(h('p.muted', `Visualisierung "${name}" ist noch nicht verfügbar.`));
      return { destroy() {} };
    }
    return factory(root, cfg, ctx);
  }

  return { h, sleep, esc, highlight, codeEditor, ring, renderDashboard, renderScene, burst };
})();
