/* ==========================================================================
   app.js — Anwendungslogik
   --------------------------------------------------------------------------
   1  Python-Worker (Pyodide) + PyRunner
   2  Store (localStorage)
   3  Fortschrittsberechnung
   4  Export (.py / .md)
   5  Views: Dashboard, Thema, Entdecken, Trainieren, Sandbox
   6  Router & Boot
   ========================================================================== */

(() => {
  'use strict';

  const { h } = Visuals;
  const TOPICS = CONTENT.topics;
  const byId = (id) => TOPICS.find((t) => t.id === Number(id));
  const { t } = I18n;
  const MODES = [
    { id: 'learn',    key: '1' },
    { id: 'discover', key: '2' },
    { id: 'train',    key: '3' },
    { id: 'sandbox',  key: '4' },
  ];
  const modeLabel = (id) => t('mode.' + id);
  const RUN_TIMEOUT_MS = 8000;

  /* ================================================ 1. Python-Worker */

  /**
   * Läuft in einem Web Worker (per Blob, damit die App auch über file://
   * funktioniert). Die Funktion wird als Quelltext in den Worker geschickt –
   * sie darf daher nichts aus dem äußeren Scope verwenden.
   */
  function workerMain() {
    let py = null;
    const booted = (async () => {
      importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js');
      py = await loadPyodide();
      postMessage({ type: 'ready' });
      return true;
    })().catch((e) => {
      postMessage({ type: 'fatal', message: String(e && e.message || e) });
      return false;
    });

    /** Python-Traceback auf den Teil ab dem Nutzercode kürzen. */
    const clean = (msg) => {
      const lines = String(msg).split('\n');
      const i = lines.findIndex((l) => l.includes('File "<exec>"'));
      return (i >= 0 ? lines.slice(i) : lines.slice(-3)).filter((l) => !l.includes('_pylab_input')).join('\n').replace(/"<exec>"/g, '"main.py"').trim();
    };

    self.onmessage = async ({ data }) => {
      const { id, code, tests, inputs, noInput } = data;
      const res = { type: 'result', id, ok: true, stdout: '', error: null, test: null };
      if (!(await booted)) {
        postMessage({ ...res, ok: false, error: '__LOAD__' });
        return;
      }
      const out = [];
      py.setStdout({ batched: (s) => out.push(s) });
      py.setStderr({ batched: (s) => out.push(s) });
      const ns = py.globals.get('dict')();
      ns.set('__name__', '__main__');
      // input() liest aus der vorgegebenen Liste statt von einer Tastatur (gibt es im Worker nicht)
      const setup = py.globals.get('dict')();
      setup.set('_pylab_inputs', JSON.stringify(inputs || []));
      setup.set('_pylab_noinput', noInput || 'no input');
      py.runPython(`
import builtins, json, sys
_q = json.loads(_pylab_inputs)
def _pylab_input(prompt=""):
    sys.stdout.write(str(prompt))
    if not _q:
        sys.stdout.write("\\n")
        raise EOFError(_pylab_noinput)
    v = _q.pop(0)
    sys.stdout.write(v + "\\n")
    return v
builtins.input = _pylab_input
`, { globals: setup });
      setup.destroy();
      try {
        await py.runPythonAsync(code, { globals: ns });
      } catch (e) {
        res.ok = false;
        res.error = clean(e.message);
      }
      try { py.runPython('import sys; sys.stdout.flush()'); } catch (_) { /* egal */ }
      res.stdout = out.join('\n');

      if (res.ok && tests) {
        ns.set('_stdout', res.stdout);
        ns.set('_source', code);
        try {
          await py.runPythonAsync(tests, { globals: ns });
          res.test = { passed: true };
        } catch (e) {
          res.test = { passed: false, message: String(e.message).trim().split('\n').pop() };
        }
      }
      ns.destroy();
      postMessage(res);
    };
  }

  class PyRunner {
    constructor(onStatus) {
      this.onStatus = onStatus;
      this.pending = new Map();
      this.seq = 0;
      this.chain = Promise.resolve();
      this.spawn();
    }

    spawn() {
      this.onStatus('loading');
      const src = `(${workerMain.toString()})()`;
      this.url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      this.worker = new Worker(this.url);
      this.ready = new Promise((resolve) => { this.markReady = resolve; });
      this.worker.onmessage = ({ data }) => {
        if (data.type === 'ready') { this.onStatus('ready'); this.markReady(true); }
        else if (data.type === 'fatal') { this.onStatus('error'); this.markReady(false); this.failAll(data.message); }
        else if (data.type === 'result') {
          const p = this.pending.get(data.id);
          if (data.error === '__LOAD__') data.error = t('run.loadFail');
          if (p) { this.pending.delete(data.id); p(data); }
        }
      };
      this.worker.onerror = () => { this.onStatus('error'); this.markReady(false); };
    }

    failAll(message) {
      this.pending.forEach((resolve, id) => resolve({ id, ok: false, stdout: '', error: message, test: null }));
      this.pending.clear();
    }

    /** Code ausführen (optional mit verdeckten Tests und Eingaben für input()). Aufrufe laufen nacheinander. */
    run(code, tests = null, inputs = null) {
      const job = this.chain.then(() => this.exec(code, tests, inputs));
      this.chain = job.catch(() => {});
      return job;
    }

    async exec(code, tests, inputs) {
      if (!(await this.ready)) {
        return { ok: false, stdout: '', error: t('run.loadFail'), test: null };
      }
      const id = ++this.seq;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          this.worker.terminate();
          URL.revokeObjectURL(this.url);
          this.spawn(); // frischer Worker, Pyodide kommt aus dem Browser-Cache
          resolve({ ok: false, stdout: '', error: t('run.timeout', { s: RUN_TIMEOUT_MS / 1000 }), test: null });
        }, RUN_TIMEOUT_MS);
        this.pending.set(id, (r) => { clearTimeout(timer); resolve(r); });
        this.worker.postMessage({ id, code, tests, inputs, noInput: t('sandbox.noInput') });
      });
    }
  }

  /* ======================================================= 2. Store */

  const Store = (() => {
    const KEY = 'pylab.v1';
    let state = { topics: {}, drafts: {}, sandbox: {} };
    try { state = { ...state, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (_) { /* leer starten */ }

    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) { /* privat/voll */ } };
    const topic = (id) => (state.topics[id] ||= { scenes: [], solved: [], sandbox: false });

    return {
      topic,
      markScene(id, scene) { const t = topic(id); if (!t.scenes.includes(scene)) { t.scenes.push(scene); save(); return true; } return false; },
      markSolved(id, task) { const t = topic(id); if (!t.solved.includes(task)) { t.solved.push(task); save(); } },
      markSandbox(id) { const t = topic(id); if (!t.sandbox) { t.sandbox = true; save(); return true; } return false; },
      draft: (key) => state.drafts[key],
      setDraft(key, v) { state.drafts[key] = v; save(); },
      sandboxCode: (id) => state.sandbox[id],
      sandboxInput: (id) => (state.sandboxIn || {})[id] || '',
      setSandboxInput(id, v) { (state.sandboxIn ||= {})[id] = v; save(); },
      setSandboxCode(id, v) { state.sandbox[id] = v; save(); },
      reset() { state = { topics: {}, drafts: {}, sandbox: {} }; save(); },
    };
  })();

  /* ============================================ 3. Fortschritt */

  /** Einheiten je Thema: Szenen + Aufgaben + Sandbox. */
  function progressOf(topic) {
    if (topic.status !== 'ready') return { done: 0, total: 0, pct: 0 };
    const s = Store.topic(topic.id);
    const total = topic.scenes.length + topic.tasks.length + 1;
    const done = Math.min(s.scenes.length, topic.scenes.length) + Math.min(s.solved.length, topic.tasks.length) + (s.sandbox ? 1 : 0);
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  function overview() {
    const learn = TOPICS.filter((t) => t.status !== 'dashboard');
    const rows = learn.map((topic) => ({ topic, ...progressOf(topic) }));
    const ready = rows.filter((r) => r.topic.status === 'ready');
    const sum = (f) => ready.reduce((n, r) => n + f(r), 0);
    return {
      global: Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length),
      available: ready.length,
      stats: {
        tasksDone: sum((r) => Math.min(Store.topic(r.topic.id).solved.length, r.topic.tasks.length)),
        tasksTotal: sum((r) => r.topic.tasks.length),
        scenesDone: sum((r) => Math.min(Store.topic(r.topic.id).scenes.length, r.topic.scenes.length)),
        scenesTotal: sum((r) => r.topic.scenes.length),
        modulesDone: ready.filter((r) => r.pct === 100).length,
      },
      topics: rows,
      next: (ready.find((r) => r.pct < 100) || {}).topic || null,
    };
  }

  /* =========================================================== 4. Export */

  function download(filename, text, mime) {
    const url = URL.createObjectURL(new Blob([text], { type: mime + ';charset=utf-8' }));
    const a = h('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const fence = (text) => {
    const longest = Math.max(2, ...(text.match(/`+/g) || []).map((m) => m.length));
    return '`'.repeat(longest + 1);
  };

  function buildMarkdown(topic, code, run) {
    const f1 = fence(code);
    const output = run ? (run.error ? run.stdout ? `${run.stdout}\n${run.error}` : run.error : run.stdout) : '';
    const f2 = fence(output);
    return [
      `# ${t('md.title')} — ${I18n.topic(topic).title}`,
      '',
      `_${t('md.exported', { date: new Date().toLocaleDateString(I18n.lang === 'de' ? 'de-DE' : 'en-GB') })}_`,
      '',
      `## ${t('md.code')}`,
      '',
      `${f1}python`, code.replace(/\s+$/, ''), f1,
      '',
      `## ${t('md.console')}`,
      '',
      `${f2}text`, output || t('sandbox.noOutput'), f2,
      '',
    ].join('\n');
  }

  /* ============================================================ 5. Views */

  const els = {
    main: document.getElementById('main'),
    nav: document.getElementById('nav'),
    crumbs: document.getElementById('crumbs'),
    status: document.getElementById('pyStatus'),
    topRing: document.getElementById('topRing'),
  };
  const ui = { scene: {}, task: {}, fails: {}, cleanups: [] };
  const topRing = Visuals.ring({ size: 42, stroke: 4, pct: 0 });
  els.topRing.append(topRing.el);

  const runner = new PyRunner((state) => {
    const label = t('py.' + state);
    els.status.dataset.state = state;
    els.status.querySelector('span').textContent = label;
  });

  /** Typische Python-Fehlermeldungen → kurzer Anfänger-Hinweis: [Muster, Deutsch, Englisch]. */
  const ERROR_HINTS = [
    [/EOFError|Errno 29/,
      '<code>input()</code> wartet auf eine Eingabe, aber es ist keine vorhanden. In der Sandbox trägst du sie unter dem Editor ein (eine Zeile pro <code>input()</code>). Bei den Aufgaben gibt es keine Eingabe — lege den Wert direkt fest, zum Beispiel <code>name = "Mia"</code>.',
      '<code>input()</code> is waiting for input, but there is none. In the sandbox, enter it below the editor (one line per <code>input()</code>). Tasks have no input — set the value directly, for example <code>name = "Mia"</code>.'],
    [/takes \d+ positional arguments? but \d+ (?:was|were) given/,
      'Fehlt in der Methode das <code>self</code>? Jede Methode in einer Klasse braucht es als ersten Parameter: <code>def info(self):</code>.',
      'Is <code>self</code> missing in the method? Every method in a class needs it as its first parameter: <code>def info(self):</code>.'],
    [/missing \d+ required positional arguments?/,
      'Beim Aufruf fehlt mindestens ein Argument. Zähle die Parameter in <code>def …</code> und vergleiche sie mit dem Aufruf.',
      'The call is missing at least one argument. Count the parameters in <code>def …</code> and compare them with the call.'],
    [/object has no attribute/,
      'Dieses Attribut gibt es am Objekt nicht. Wurde es im <code>__init__</code> mit <code>self.name = …</code> angelegt — und mit <code>self.</code> davor?',
      'The object has no such attribute. Was it created in <code>__init__</code> with <code>self.name = …</code> — including the <code>self.</code> in front?'],
    [/name '(?:self|\w+)' is not defined/,
      'Python kennt diesen Namen hier nicht. Tippfehler? In einer Methode erreichst du Attribute nur über <code>self.attribut</code>, nicht über den nackten Namen.',
      'Python does not know this name here. A typo? Inside a method you reach attributes only via <code>self.attribute</code>, not via the bare name.'],
    [/IndentationError|expected an indented block/,
      'Nach einem Doppelpunkt (<code>:</code>) muss der Code eingerückt sein — vier Leerzeichen pro Ebene.',
      'After a colon (<code>:</code>) the code must be indented — four spaces per level.'],
    [/SyntaxError: (?:expected ':'|invalid syntax)/,
      'Schau in der gemeldeten Zeile nach: fehlt ein Doppelpunkt, eine Klammer oder ein Anführungszeichen?',
      'Look at the reported line: is a colon, a bracket or a quotation mark missing?'],
    [/KeyError/,
      'Dieser Schlüssel steht nicht im Dictionary. <code>d.get(schluessel)</code> liefert stattdessen <code>None</code>, statt abzustürzen.',
      'This key is not in the dictionary. <code>d.get(key)</code> returns <code>None</code> instead of crashing.'],
    [/IndexError/,
      'Der Index liegt außerhalb der Liste. Gültig sind <code>0</code> bis <code>len(liste) - 1</code>; bei einer leeren Liste gibt es keinen Index.',
      'The index is outside the list. Valid are <code>0</code> to <code>len(items) - 1</code>; an empty list has no index at all.'],
    [/RecursionError/,
      'Die Funktion ruft sich endlos selbst auf. Fehlt der <strong>Basisfall</strong> (<code>if … : return</code>), oder nähert sich der Aufruf ihm nicht?',
      'The function keeps calling itself forever. Is the <strong>base case</strong> missing (<code>if … : return</code>), or does the call not get closer to it?'],
    [/NoneType/,
      'Irgendwo ist <code>None</code> herausgekommen. Fehlt in einer Funktion ein <code>return</code> — oder wurde ein leerer Fall nicht abgefangen?',
      'Somewhere <code>None</code> came out. Is a <code>return</code> missing in a function — or was an empty case not handled?'],
    [/ZeroDivisionError/,
      'Teilen durch 0 geht nicht. Prüfe den Nenner mit <code>if nenner == 0:</code>, bevor du teilst.',
      'Dividing by 0 is not possible. Check the denominator with <code>if denominator == 0:</code> before dividing.'],
    [/list indices must be integers/,
      'In eckigen Klammern einer Liste muss eine Zahl stehen. Ob ein Wert <em>enthalten</em> ist, fragst du mit <code>wert in liste</code>.',
      'A list needs a number in square brackets. To ask whether a value is <em>contained</em>, use <code>value in items</code>.'],
  ];
  function explainError(text) {
    const hit = ERROR_HINTS.find(([re]) => re.test(text || ''));
    return hit ? hit[I18n.lang === 'de' ? 1 : 2] : null;
  }
  const hintBox = (text) => { const e = explainError(text); return e ? h('div.err-hint', { html: `<strong>${t('hint.tip')}</strong> ` + e }) : ''; };

  function toast(text) {
    const t = h('div.toast', text);
    document.body.append(t);
    setTimeout(() => t.remove(), 2600);
  }

  /** Sidebar, Top-Ring und Breadcrumb auffrischen. */
  function refreshChrome(route) {
    const r = route || parseRoute();
    els.nav.innerHTML = '';
    CONTENT.groups.forEach((g) => {
      const items = TOPICS.filter((t) => t.group === g.id);
      if (!items.length) return;
      els.nav.append(h('div.nav-group',
        h('div.nav-label', I18n.group(g)),
        items.map((t) => {
          const p = progressOf(t);
          const dot = t.status === 'ready' ? h('i.nav-dot' + (p.pct === 100 ? '.is-done' : p.pct > 0 ? '.is-part' : '')) : null;
          return h('button.nav-item' + (t.id === r.id ? '.is-active' : '') + (t.status === 'soon' ? '.is-soon' : ''),
            { onclick: () => go(t.id) },
            h('span.nav-ico', t.icon),
            h('span.nav-text', I18n.topic(t).title, I18n.topic(t).subtitle && h('small', I18n.topic(t).subtitle)),
            dot);
        })));
    });
    topRing.set(overview().global);
    const topic = byId(r.id);
    els.crumbs.innerHTML = topic && topic.status !== 'dashboard'
      ? `${topic.id}. <b>${I18n.topic(topic).title}</b>${r.mode ? ' · ' + modeLabel(r.mode) : ''}`
      : `<b>${t('crumb.dashboard')}</b>`;
  }

  function go(id, mode) {
    const topic = byId(id);
    const first = topic.status === 'ready' && progressOf(topic).done === 0 && typeof EXPLAIN !== 'undefined' && EXPLAIN[id];
    location.hash = topic.status === 'dashboard' ? '#/dashboard' : `#/topic/${id}/${mode || (first ? 'learn' : 'discover')}`;
    document.body.classList.remove('nav-open');
  }

  /* ---------------------------------------------------------- Dashboard */

  function viewDashboard() {
    const root = h('div.view');
    Visuals.renderDashboard(root, overview(), {
      onOpen: (id) => go(id),
      onReset() {
        if (!confirm(t('confirm.reset'))) return;
        Store.reset();
        render();
        toast(t('toast.reset'));
      },
    });
    return root;
  }

  /* -------------------------------------------------------------- Thema */

  function viewTopic(topic, mode) {
    const root = h('div.view');
    const info = I18n.topic(topic);
    const main = h('div.topic-main');
    main.append(h('header.topic-head',
      h('p.eyebrow', t('topic.eyebrow', { id: topic.id, scenario: info.scenario || '' })),
      h('h1', info.title, info.subtitle && h('small', info.subtitle)),
      info.lead && h('p.lead', { html: info.lead }),
    ));

    main.append(h('nav.tabs', { role: 'tablist' }, MODES.filter((m) => m.id !== 'learn' || hasExplain(topic)).map((m) =>
      h('button.tab' + (m.id === mode ? '.is-active' : ''), { role: 'tab', 'aria-selected': m.id === mode, onclick: () => go(topic.id, m.id) },
        h('kbd', m.key), modeLabel(m.id)))));

    const pane = h('section.pane');
    const panes = { learn: paneLearn, discover: paneDiscover, train: paneTrain, sandbox: paneSandbox };
    (panes[mode] || paneDiscover)(pane, topic);
    main.append(pane);

    root.append(h('div.topic-layout', main, sideRail(topic, mode)));
    return root;
  }

  /* ------------------------------------------------ Rechte Seitenleiste */

  const explainOf = (topic) => {
    const e = typeof EXPLAIN !== 'undefined' && EXPLAIN[topic.id];
    return e ? e[I18n.lang] || e.de : null;
  };
  const hasExplain = (topic) => !!explainOf(topic);

  /** Breite Bildschirme: Fortschritt, Inhaltsverzeichnis bzw. Spickzettel. */
  function sideRail(topic, mode) {
    const p = progressOf(topic);
    const ex = explainOf(topic);
    const cards = [];
    const pr = Visuals.ring({ size: 58, stroke: 5, pct: p.pct });
    cards.push(h('section.side-card',
      h('div.side-title', t('rail.progress')),
      h('div.side-progress', pr.el, h('span', t('rail.steps', { done: p.done, total: p.total })))));

    if (mode === 'learn' && ex) {
      const links = [['analogy', 'learn.analogy'], ['terms', 'learn.terms'], ['example', 'learn.example'], ['pitfalls', 'learn.pitfalls'], ['cheat', 'learn.cheat']];
      cards.push(h('section.side-card',
        h('div.side-title', t('rail.onPage')),
        h('nav.side-links', links.map(([id, key]) => h('button', {
          type: 'button',
          onclick: () => { const el = document.getElementById('sec-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); },
        }, t(key))))));
    } else {
      cards.push(h('section.side-card',
        h('div.side-title', t('rail.cheat')),
        ex
          ? h('dl.cheat', ex.cheat.map(([code, text]) => [h('dt', h('code', code)), h('dd', text)]))
          : h('p.muted.small', t('rail.cheatEmpty')),
        ex && h('button.btn.btn-ghost.side-btn', { type: 'button', onclick: () => go(topic.id, 'learn') }, t('rail.openLearn'))));
    }
    return h('aside.side-rail', { 'aria-label': t('rail.progress') }, cards);
  }

  /* ----------------------------------------------------- Modus 0: Verstehen */

  function paneLearn(pane, topic) {
    const ex = explainOf(topic);
    if (!ex) { pane.append(h('p.muted', t('rail.cheatEmpty'))); return; }
    const out = h('div.console.learn-out', { hidden: true });
    const btnRun = h('button.btn.btn-primary', { type: 'button', onclick: async () => {
      btnRun.disabled = true;
      out.hidden = false;
      out.replaceChildren(h('span.dim', t('train.running')));
      const r = await runner.run(ex.example.code);
      btnRun.disabled = false;
      out.replaceChildren();
      if (r.stdout) out.append(document.createTextNode(r.stdout));
      if (r.error) out.append(h('div.err', r.error), hintBox(r.error));
    } }, t('learn.tryIt'));
    const sec = (id, title, ...kids) => h('section.learn-sec', { id: 'sec-' + id }, h('h2', title), kids);

    pane.append(h('div.learn',
      sec('analogy', t('learn.analogy'), h('p.analogy', { html: ex.analogy })),
      sec('terms', t('learn.terms'), h('dl.terms', ex.terms.map(([term, text]) => [h('dt', term), h('dd', { html: text })]))),
      sec('example', t('learn.example'),
        h('pre.code-static', { html: Visuals.highlight(ex.example.code) }),
        h('p.muted.small', { html: ex.example.note }),
        h('div.btn-row', btnRun),
        out),
      sec('pitfalls', t('learn.pitfalls'), h('ul.pitfalls', ex.pitfalls.map((x) => h('li', { html: x })))),
      sec('cheat', t('learn.cheat'), h('dl.cheat.cheat-wide', ex.cheat.map(([code, text]) => [h('dt', h('code', code)), h('dd', text)]))),
      h('div.learn-next', h('button.btn.btn-primary', { type: 'button', onclick: () => go(topic.id, 'discover') }, t('learn.next'))),
    ));
  }

  /* ----------------------------------------------------- Modus A: Entdecken */

  function paneDiscover(pane, topic) {
    const current = ui.scene[topic.id] || topic.scenes[0].id;
    const done = () => Store.topic(topic.id).scenes;
    const pills = h('div.scene-tabs');
    const stage = h('div');
    pane.append(pills, stage);

    function paintPills() {
      pills.innerHTML = '';
      topic.scenes.forEach((s) => pills.append(h('button.pill' + (s.id === ui.scene[topic.id] ? '.is-active' : ''),
        { onclick: () => show(s.id) }, h('i.tick' + (done().includes(s.id) ? '.is-done' : '')), I18n.scene(topic, s).title)));
    }

    function show(id) {
      ui.scene[topic.id] = id;
      stage.innerHTML = '';
      const scene = topic.scenes.find((s) => s.id === id);
      const mount = h('div.scene');
      const sceneText = I18n.scene(topic, scene);
      stage.append(h('div.scene-head', h('h2', sceneText.title), h('p', sceneText.blurb)), mount);
      const instance = Visuals.renderScene(scene.visual, mount, I18n.sceneConfig(topic, scene), {
        touch() {
          if (Store.markScene(topic.id, scene.id)) { paintPills(); refreshChrome(); }
        },
      });
      ui.cleanups.push(() => instance.destroy());
      paintPills();
    }
    show(current);
  }

  /* ---------------------------------------------------- Modus B: Trainieren */

  function paneTrain(pane, topic) {
    const solved = () => Store.topic(topic.id).solved;
    const wrap = h('div.train');
    const rail = h('div.rail');
    const bench = h('div.bench');
    wrap.append(rail, bench);
    pane.append(wrap);

    const current = () => ui.task[topic.id] ?? Math.max(0, topic.tasks.findIndex((t) => !solved().includes(t.id)));

    function paintRail() {
      rail.innerHTML = '';
      topic.tasks.forEach((t, i) => rail.append(
        h('button.rail-item' + (i === current() ? '.is-active' : '') + (solved().includes(t.id) ? '.is-done' : ''),
          { onclick: () => { ui.task[topic.id] = i; paintRail(); paintBench(); } },
          h('span.rail-num', i + 1),
          h('div', h('small', I18n.level(t.level)), h('span.t', I18n.task(topic, t).title)))));
    }

    function paintBench() {
      const idx = current();
      const task = I18n.task(topic, topic.tasks[idx]);
      const draftKey = `${topic.id}/${task.id}`;
      ui.fails[draftKey] ||= 0;
      bench.innerHTML = '';

      const hint = h('div.hint', { html: `<strong>${t('train.hintLabel')}</strong> ` + task.hint });
      const hintSlot = h('div');
      const feedback = h('div');
      const consoleEl = h('div.console');
      const editor = Visuals.codeEditor({
        value: Store.draft(draftKey) ?? task.starter,
        minLines: 9,
        onRun: () => check(),
        onChange: (v) => Store.setDraft(draftKey, v),
      });

      const btnCheck = h('button.btn.btn-primary', { onclick: () => check() }, t('train.check'));
      const btnRun = h('button.btn.btn-ghost', { onclick: () => execute(false) }, t('train.run'));
      const btnHint = h('button.btn.btn-ghost', { onclick: () => hintSlot.replaceChildren(hint) }, t('train.hint'));
      const btnReset = h('button.btn.btn-ghost', {
        onclick: () => { editor.setValue(task.starter); Store.setDraft(draftKey, task.starter); feedback.replaceChildren(); consoleEl.replaceChildren(); },
      }, t('train.reset'));
      const btnSolution = h('button.btn.btn-ghost', {
        onclick: () => {
          editor.setValue(task.solution);
          Store.setDraft(draftKey, task.solution);
          feedback.replaceChildren(h('div.banner.info', t('train.solutionShown')));
        },
      }, t('train.solution'));
      const syncSolutionBtn = () => {
        const left = 3 - ui.fails[draftKey];
        btnSolution.disabled = left > 0 && !solved().includes(task.id);
        btnSolution.title = btnSolution.disabled ? t('train.solutionLocked', { n: left }) : '';
      };
      syncSolutionBtn();

      function setBusy(b) { [btnCheck, btnRun].forEach((x) => (x.disabled = b)); }

      function printResult(r) {
        consoleEl.replaceChildren();
        if (r.stdout) consoleEl.append(document.createTextNode(r.stdout));
        if (r.error) consoleEl.append(h('div.err', r.error), hintBox(r.error));
      }

      async function execute(withTests) {
        setBusy(true);
        feedback.replaceChildren(h('div.banner.info', withTests ? t('train.checking') : t('train.running')));
        const r = await runner.run(editor.getValue(), withTests ? task.tests : null);
        setBusy(false);
        printResult(r);
        feedback.replaceChildren();
        return r;
      }

      async function check() {
        const r = await execute(true);
        if (!r.ok) {
          ui.fails[draftKey]++;
          syncSolutionBtn();
          feedback.replaceChildren(h('div.banner.bad', t('train.codeError')));
          return;
        }
        if (r.test && r.test.passed) {
          Store.markSolved(topic.id, task.id);
          paintRail();
          refreshChrome();
          Visuals.burst(btnCheck);
          const last = idx === topic.tasks.length - 1;
          feedback.replaceChildren(h('div.banner.ok',
            h('div', t('train.passed')),
            !last && h('div.mt', h('button.btn.btn-primary', { onclick: () => { ui.task[topic.id] = idx + 1; paintRail(); paintBench(); } }, t('train.next')))));
          syncSolutionBtn();
          return;
        }
        ui.fails[draftKey]++;
        syncSolutionBtn();
        const msg = (r.test && r.test.message) || '';
        const text = msg.startsWith('AssertionError: ') ? msg.slice(16)
          : msg === 'AssertionError' ? t('train.edge')
          : msg ? t('train.testError', { msg }) : t('train.failed');
        feedback.replaceChildren(h('div.banner.bad', '✗ ' + text), hintBox(msg));
      }

      bench.append(
        h('article.brief',
          h('div.brief-top',
            h('span.level-tag', `${idx + 1}/${topic.tasks.length} · ${I18n.level(task.level)}`),
            h('div.level-dots', CONTENT.levels.map((_, i) => h('i' + (i <= idx ? '.on' : '')))),
          ),
          h('h2', task.title),
          h('p.story', { html: task.scenario }),
          h('span.goal-label', t('train.goal')),
          h('p', { html: task.goal }),
          hintSlot,
        ),
        editor.el,
        h('div.btn-row', btnCheck, btnRun, btnHint, btnReset, h('span.spacer'), btnSolution,
          h('span.kbd-hint', h('kbd', '⌘'), ' / ', h('kbd', t('kbd.ctrl')), ' + ', h('kbd', '↵'))),
        feedback,
        consoleEl,
      );
    }

    paintRail();
    paintBench();
  }

  /* ------------------------------------------------------ Modus C: Sandbox */

  function paneSandbox(pane, topic) {
    let lastRun = null;
    let lastCode = null;
    const consoleEl = h('div.console');
    const editor = Visuals.codeEditor({
      value: Store.sandboxCode(topic.id) ?? I18n.sandbox(topic),
      minLines: 14,
      onRun: () => run(),
      onChange: (v) => Store.setSandboxCode(topic.id, v),
    });

    async function run() {
      const code = editor.getValue();
      btnRun.disabled = true;
      consoleEl.replaceChildren(h('span.dim', t('train.running')));
      lastRun = await runner.run(code, null, inputBox.value.split('\n').filter((l, i, a) => l !== '' || i < a.length - 1));
      lastCode = code;
      btnRun.disabled = false;
      consoleEl.replaceChildren();
      if (lastRun.stdout) consoleEl.append(document.createTextNode(lastRun.stdout));
      if (lastRun.error) consoleEl.append(h('div.err', lastRun.error), hintBox(lastRun.error));
      if (!lastRun.stdout && !lastRun.error) consoleEl.append(h('span.dim', t('sandbox.noOutput')));
      if (!lastRun.error && Store.markSandbox(topic.id)) refreshChrome();
      return lastRun;
    }

    const inputBox = h('textarea.input-box', {
      rows: 2, spellcheck: false, placeholder: t('sandbox.inputsHint'), 'aria-label': t('sandbox.inputs'),
      oninput: () => Store.setSandboxInput(topic.id, inputBox.value),
    });
    inputBox.value = Store.sandboxInput(topic.id);
    const btnRun = h('button.btn.btn-primary', { onclick: run }, t('sandbox.run'));
    const btnPy = h('button.btn.btn-ghost', {
      onclick: () => download(`${topic.slug}-sandbox.py`, editor.getValue(), 'text/x-python'),
    }, t('sandbox.py'));
    const btnMd = h('button.btn.btn-ghost', {
      async onclick() {
        if (lastCode !== editor.getValue()) await run();
        download(`${topic.slug}-sandbox.md`, buildMarkdown(topic, editor.getValue(), lastRun), 'text/markdown');
      },
    }, t('sandbox.md'));
    const btnReset = h('button.btn.btn-ghost', {
      onclick: () => { editor.setValue(I18n.sandbox(topic)); Store.setSandboxCode(topic.id, I18n.sandbox(topic)); },
    }, t('train.reset'));

    pane.append(h('div.sandbox',
      h('div.sandbox-bar', btnRun, btnPy, btnMd, h('span.spacer'), btnReset,
        h('span.kbd-hint', h('kbd', '⌘'), ' / ', h('kbd', t('kbd.ctrl')), ' + ', h('kbd', '↵'))),
      editor.el,
      h('label.input-wrap', h('span.input-label', t('sandbox.inputs')), inputBox),
      consoleEl,
    ));
  }

  /* ========================================================= 6. Router */

  function parseRoute() {
    const m = /^#\/topic\/(\d+)(?:\/(\w+))?/.exec(location.hash);
    if (!m || !byId(m[1])) return { id: 1, mode: null };
    return { id: Number(m[1]), mode: MODES.some((x) => x.id === m[2]) ? m[2] : 'discover' };
  }

  function render() {
    ui.cleanups.splice(0).forEach((fn) => fn());
    const route = parseRoute();
    const topic = byId(route.id);
    els.main.replaceChildren(topic.status === 'dashboard' ? viewDashboard() : viewTopic(topic, route.mode));
    refreshChrome(route);
    window.scrollTo({ top: 0 });
  }

  /* ------------------------------------------------- Popover-Menüs (Theme, Sprache) */
  function popMenu(btn, menu) {
    const toggle = (open) => {
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
      if (open) (menu.querySelector('[aria-checked="true"]') || menu.querySelector('.theme-opt')).focus();
    };
    btn.addEventListener('click', () => toggle(menu.hidden));
    document.addEventListener('click', (e) => { if (!menu.hidden && !menu.parentElement.contains(e.target)) toggle(false); });
    document.addEventListener('keydown', (e) => {
      if (menu.hidden) return;
      if (e.key === 'Escape') { toggle(false); btn.focus(); }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const opts = [...menu.querySelectorAll('.theme-opt')];
        const i = opts.indexOf(document.activeElement);
        opts[(i + (e.key === 'ArrowDown' ? 1 : opts.length - 1)) % opts.length].focus();
      }
    });
    return toggle;
  }

  /* ----------------------------------------------------------- Theme */
  const THEMES = [
    { id: 'space', mode: 'dark', bg: '#09090b', accent: '#ff5d00' },
    { id: 'ocean', mode: 'dark', bg: '#060f1a', accent: '#27b4f5' },
    { id: 'forest', mode: 'dark', bg: '#07110c', accent: '#8bd450' },
    { id: 'dusk', mode: 'dark', bg: '#0d0a18', accent: '#b57cff' },
    { id: 'day', mode: 'light', bg: '#f3f4f8', accent: '#c64200' },
    { id: 'sand', mode: 'light', bg: '#f4efe4', accent: '#0f766e' },
    { id: 'nebel', mode: 'light', bg: '#eceff6', accent: '#4338ca' },
    { id: 'rose', mode: 'light', bg: '#f6eff1', accent: '#be185d' },
  ];
  const themeBtn = document.getElementById('themeBtn');
  const themeMenu = document.getElementById('themeMenu');
  let theme = THEMES.some((x) => x.id === document.documentElement.dataset.theme) ? document.documentElement.dataset.theme : 'space';

  function applyTheme(id) {
    theme = id;
    const th = THEMES.find((x) => x.id === id);
    if (id === 'space') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = id;
    if (th.mode === 'light') document.documentElement.dataset.mode = 'light';
    else document.documentElement.removeAttribute('data-mode');
    document.querySelector('meta[name="theme-color"]').setAttribute('content', th.bg);
    themeMenu.querySelectorAll('.theme-opt').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.id === id)));
    try { localStorage.setItem('pylab.theme', id); } catch (e) { /* privater Modus: gilt nur bis zum Neuladen */ }
  }
  const toggleThemeMenu = popMenu(themeBtn, themeMenu);
  const themeOpt = (th) => h('button.theme-opt', {
    role: 'menuitemradio', 'data-id': th.id, 'aria-checked': 'false',
    onclick: () => { applyTheme(th.id); toggleThemeMenu(false); themeBtn.focus(); },
  }, h('span.swatch', { style: `--sw-bg:${th.bg};--sw-ac:${th.accent}` }), t('theme.' + th.id), h('span.tick', '✓'));
  themeMenu.append(
    h('div.menu-label', t('theme.dark')), ...THEMES.filter((x) => x.mode === 'dark').map(themeOpt),
    h('div.menu-label', t('theme.light')), ...THEMES.filter((x) => x.mode === 'light').map(themeOpt),
  );
  themeBtn.title = t('theme.title');
  themeBtn.setAttribute('aria-label', t('theme.title'));
  themeMenu.setAttribute('aria-label', t('theme.menu'));
  applyTheme(theme);

  /* ----------------------------------------------------------- Sprache */
  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  const toggleLangMenu = popMenu(langBtn, langMenu);
  langBtn.querySelector('span').textContent = I18n.lang.toUpperCase();
  langBtn.title = t('lang.title');
  langBtn.setAttribute('aria-label', t('lang.title'));
  langMenu.setAttribute('aria-label', t('lang.menu'));
  langMenu.append(h('div.menu-label', t('lang.menu')), ...I18n.LANGS.map((l) => h('button.theme-opt', {
    role: 'menuitemradio', 'data-id': l.id, 'aria-checked': String(l.id === I18n.lang),
    onclick: () => { toggleLangMenu(false); if (l.id !== I18n.lang) I18n.set(l.id); },
  }, h('span.lang-chip', l.short), l.label, h('span.tick', '✓'))));

  /* Statische Texte aus index.html übersetzen */
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-title]').forEach((el) => el.setAttribute('title', t(el.dataset.i18nTitle)));

  /* Tastatur: 1–4 wechseln den Modus (nicht beim Tippen im Editor) */
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const m = MODES.find((x) => x.key === e.key);
    const r = parseRoute();
    const topic = byId(r.id);
    if (m && topic.status === 'ready' && (m.id !== 'learn' || hasExplain(topic))) go(topic.id, m.id);
  });

  /* ----------------------------------------------------------- Boot */
  document.getElementById('menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
  window.addEventListener('hashchange', render);
  render();
})();
