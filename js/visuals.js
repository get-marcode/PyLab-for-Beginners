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
  function controlBar({ total, onStep, onReset }) {
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
      timer = setInterval(() => step(false), 1250);
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
    return { el, destroy: stopAuto, reset };
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
