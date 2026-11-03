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
  const MODES = [
    { id: 'discover', key: 'A', label: 'Entdecken' },
    { id: 'train',    key: 'B', label: 'Trainieren' },
    { id: 'sandbox',  key: 'C', label: 'Sandbox' },
  ];
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
      return (i >= 0 ? lines.slice(i) : lines.slice(-3)).join('\n').replace(/"<exec>"/g, '"main.py"').trim();
    };

    self.onmessage = async ({ data }) => {
      const { id, code, tests } = data;
      const res = { type: 'result', id, ok: true, stdout: '', error: null, test: null };
      if (!(await booted)) {
        postMessage({ ...res, ok: false, error: 'Python konnte nicht geladen werden (Internetverbindung?).' });
        return;
      }
      const out = [];
      py.setStdout({ batched: (s) => out.push(s) });
      py.setStderr({ batched: (s) => out.push(s) });
      const ns = py.globals.get('dict')();
      ns.set('__name__', '__main__');
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
          if (p) { this.pending.delete(data.id); p(data); }
        }
      };
      this.worker.onerror = () => { this.onStatus('error'); this.markReady(false); };
    }

    failAll(message) {
      this.pending.forEach((resolve, id) => resolve({ id, ok: false, stdout: '', error: message, test: null }));
      this.pending.clear();
    }

    /** Code ausführen (optional mit verdeckten Tests). Aufrufe laufen nacheinander. */
    run(code, tests = null) {
      const job = this.chain.then(() => this.exec(code, tests));
      this.chain = job.catch(() => {});
      return job;
    }

    async exec(code, tests) {
      if (!(await this.ready)) {
        return { ok: false, stdout: '', error: 'Python konnte nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.', test: null };
      }
      const id = ++this.seq;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.pending.delete(id);
          this.worker.terminate();
          URL.revokeObjectURL(this.url);
          this.spawn(); // frischer Worker, Pyodide kommt aus dem Browser-Cache
          resolve({ ok: false, stdout: '', error: `Zeitüberschreitung nach ${RUN_TIMEOUT_MS / 1000} s — läuft deine Schleife endlos? Prüfe, ob sich die Bedingung jemals ändert.`, test: null });
        }, RUN_TIMEOUT_MS);
        this.pending.set(id, (r) => { clearTimeout(timer); resolve(r); });
        this.worker.postMessage({ id, code, tests });
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
      `# Python-Sandbox — ${topic.title}`,
      '',
      `_Exportiert am ${new Date().toLocaleDateString('de-DE')} aus PyLab_`,
      '',
      '## Code',
      '',
      `${f1}python`, code.replace(/\s+$/, ''), f1,
      '',
      '## Konsolenausgabe',
      '',
      `${f2}text`, output || '(keine Ausgabe)', f2,
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
    const label = { loading: 'Python lädt …', ready: 'Python bereit', error: 'Python offline' }[state];
    els.status.dataset.state = state;
    els.status.querySelector('span').textContent = label;
  });

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
        h('div.nav-label', g.label),
        items.map((t) => {
          const p = progressOf(t);
          const dot = t.status === 'ready' ? h('i.nav-dot' + (p.pct === 100 ? '.is-done' : p.pct > 0 ? '.is-part' : '')) : null;
          return h('button.nav-item' + (t.id === r.id ? '.is-active' : '') + (t.status === 'soon' ? '.is-soon' : ''),
            { onclick: () => go(t.id) },
            h('span.nav-ico', t.icon),
            h('span.nav-text', t.title, t.subtitle && h('small', t.subtitle)),
            dot);
        })));
    });
    topRing.set(overview().global);
    const topic = byId(r.id);
    els.crumbs.innerHTML = topic && topic.status !== 'dashboard'
      ? `${topic.id}. <b>${topic.title}</b>${r.mode ? ' · ' + MODES.find((m) => m.id === r.mode).label : ''}`
      : '<b>Dashboard</b>';
  }

  function go(id, mode) {
    const topic = byId(id);
    location.hash = topic.status === 'dashboard' ? '#/dashboard' : `#/topic/${id}/${mode || 'discover'}`;
    document.body.classList.remove('nav-open');
  }

  /* ---------------------------------------------------------- Dashboard */

  function viewDashboard() {
    const root = h('div.view');
    Visuals.renderDashboard(root, overview(), {
      onOpen: (id) => go(id),
      onReset() {
        if (!confirm('Gesamten Lernfortschritt und gespeicherte Entwürfe löschen?')) return;
        Store.reset();
        render();
        toast('Fortschritt zurückgesetzt.');
      },
    });
    return root;
  }

  /* -------------------------------------------------------------- Thema */

  function viewTopic(topic, mode) {
    const root = h('div.view');
    root.append(h('header.topic-head',
      h('p.eyebrow', `Modul ${topic.id - 1} · ${topic.scenario || 'In Arbeit'}`),
      h('h1', topic.title, topic.subtitle && h('small', topic.subtitle)),
      topic.lead && h('p.lead', { html: topic.lead }),
    ));

    if (topic.status !== 'ready') {
      root.append(h('div.soon-card',
        h('h2', 'Dieses Modul ist noch in Arbeit'),
        h('p.muted', 'Szenen, Aufgaben und Sandbox folgen. Starte so lange mit den fertigen Modulen.'),
        h('div.mt', h('button.btn.btn-primary', { onclick: () => go(1) }, 'Zurück zum Dashboard'))));
      return root;
    }

    root.append(h('nav.tabs', { role: 'tablist' }, MODES.map((m) =>
      h('button.tab' + (m.id === mode ? '.is-active' : ''), { role: 'tab', 'aria-selected': m.id === mode, onclick: () => go(topic.id, m.id) },
        h('kbd', m.key), m.label))));

    const pane = h('section.pane');
    ({ discover: paneDiscover, train: paneTrain, sandbox: paneSandbox }[mode] || paneDiscover)(pane, topic);
    root.append(pane);
    return root;
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
        { onclick: () => show(s.id) }, h('i.tick' + (done().includes(s.id) ? '.is-done' : '')), s.title)));
    }

    function show(id) {
      ui.scene[topic.id] = id;
      stage.innerHTML = '';
      const scene = topic.scenes.find((s) => s.id === id);
      const mount = h('div.scene');
      stage.append(h('div.scene-head', h('h2', scene.title), h('p', scene.blurb)), mount);
      const instance = Visuals.renderScene(scene.visual, mount, scene.config, {
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
          h('div', h('small', t.level), h('span.t', t.title)))));
    }

    function paintBench() {
      const idx = current();
      const task = topic.tasks[idx];
      const draftKey = `${topic.id}/${task.id}`;
      ui.fails[draftKey] ||= 0;
      bench.innerHTML = '';

      const hint = h('div.hint', { html: '<strong>Hinweis:</strong> ' + task.hint });
      const hintSlot = h('div');
      const feedback = h('div');
      const consoleEl = h('div.console');
      const editor = Visuals.codeEditor({
        value: Store.draft(draftKey) ?? task.starter,
        minLines: 9,
        onRun: () => check(),
        onChange: (v) => Store.setDraft(draftKey, v),
      });

      const btnCheck = h('button.btn.btn-primary', { onclick: () => check() }, '▶ Ausführen & prüfen');
      const btnRun = h('button.btn.btn-ghost', { onclick: () => execute(false) }, 'Nur ausführen');
      const btnHint = h('button.btn.btn-ghost', { onclick: () => hintSlot.replaceChildren(hint) }, 'Hinweis');
      const btnReset = h('button.btn.btn-ghost', {
        onclick: () => { editor.setValue(task.starter); Store.setDraft(draftKey, task.starter); feedback.replaceChildren(); consoleEl.replaceChildren(); },
      }, 'Zurücksetzen');
      const btnSolution = h('button.btn.btn-ghost', {
        onclick: () => {
          editor.setValue(task.solution);
          Store.setDraft(draftKey, task.solution);
          feedback.replaceChildren(h('div.banner.info', 'Musterlösung eingefügt. Lies sie in Ruhe durch und führe sie aus.'));
        },
      }, 'Lösung zeigen');
      const syncSolutionBtn = () => {
        const left = 3 - ui.fails[draftKey];
        btnSolution.disabled = left > 0 && !solved().includes(task.id);
        btnSolution.title = btnSolution.disabled ? `Noch ${left} Fehlversuch(e) bis die Lösung freigeschaltet ist` : '';
      };
      syncSolutionBtn();

      function setBusy(b) { [btnCheck, btnRun].forEach((x) => (x.disabled = b)); }

      function printResult(r) {
        consoleEl.replaceChildren();
        if (r.stdout) consoleEl.append(document.createTextNode(r.stdout));
        if (r.error) consoleEl.append(h('div.err', r.error));
      }

      async function execute(withTests) {
        setBusy(true);
        feedback.replaceChildren(h('div.banner.info', withTests ? 'Prüfe …' : 'Läuft …'));
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
          feedback.replaceChildren(h('div.banner.bad', 'Dein Code hat einen Fehler — lies die Meldung in der Konsole von unten nach oben.'));
          return;
        }
        if (r.test && r.test.passed) {
          Store.markSolved(topic.id, task.id);
          paintRail();
          refreshChrome();
          Visuals.burst(btnCheck);
          const last = idx === topic.tasks.length - 1;
          feedback.replaceChildren(h('div.banner.ok',
            h('div', '✓ Alle verdeckten Tests bestanden.'),
            !last && h('div.mt', h('button.btn.btn-primary', { onclick: () => { ui.task[topic.id] = idx + 1; paintRail(); paintBench(); } }, 'Nächste Aufgabe →'))));
          syncSolutionBtn();
          return;
        }
        ui.fails[draftKey]++;
        syncSolutionBtn();
        const msg = (r.test && r.test.message) || '';
        const text = msg.startsWith('AssertionError: ') ? msg.slice(16)
          : msg === 'AssertionError' ? 'Ein Testfall schlägt fehl — prüfe auch die Randfälle.'
          : msg ? `Beim Prüfen ist ein Fehler aufgetreten: ${msg}` : 'Der Test ist fehlgeschlagen.';
        feedback.replaceChildren(h('div.banner.bad', '✗ ' + text));
      }

      bench.append(
        h('article.brief',
          h('div.brief-top',
            h('span.level-tag', `${idx + 1}/${topic.tasks.length} · ${task.level}`),
            h('div.level-dots', CONTENT.levels.map((_, i) => h('i' + (i <= idx ? '.on' : '')))),
          ),
          h('h2', task.title),
          h('p.story', task.scenario),
          h('span.goal-label', 'Aufgabe'),
          h('p', { html: task.goal }),
          hintSlot,
        ),
        editor.el,
        h('div.btn-row', btnCheck, btnRun, btnHint, btnReset, h('span.spacer'), btnSolution,
          h('span.kbd-hint', h('kbd', '⌘'), ' / ', h('kbd', 'Strg'), ' + ', h('kbd', '↵'))),
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
      value: Store.sandboxCode(topic.id) ?? topic.sandbox,
      minLines: 14,
      onRun: () => run(),
      onChange: (v) => Store.setSandboxCode(topic.id, v),
    });

    async function run() {
      const code = editor.getValue();
      btnRun.disabled = true;
      consoleEl.replaceChildren(h('span.dim', 'Läuft …'));
      lastRun = await runner.run(code);
      lastCode = code;
      btnRun.disabled = false;
      consoleEl.replaceChildren();
      if (lastRun.stdout) consoleEl.append(document.createTextNode(lastRun.stdout));
      if (lastRun.error) consoleEl.append(h('div.err', lastRun.error));
      if (!lastRun.stdout && !lastRun.error) consoleEl.append(h('span.dim', '(keine Ausgabe)'));
      if (!lastRun.error && Store.markSandbox(topic.id)) refreshChrome();
      return lastRun;
    }

    const btnRun = h('button.btn.btn-primary', { onclick: run }, '▶ Ausführen');
    const btnPy = h('button.btn.btn-ghost', {
      onclick: () => download(`${topic.slug}-sandbox.py`, editor.getValue(), 'text/x-python'),
    }, 'Als .py speichern');
    const btnMd = h('button.btn.btn-ghost', {
      async onclick() {
        if (lastCode !== editor.getValue()) await run();
        download(`${topic.slug}-sandbox.md`, buildMarkdown(topic, editor.getValue(), lastRun), 'text/markdown');
      },
    }, 'Als .md exportieren');
    const btnReset = h('button.btn.btn-ghost', {
      onclick: () => { editor.setValue(topic.sandbox); Store.setSandboxCode(topic.id, topic.sandbox); },
    }, 'Zurücksetzen');

    pane.append(h('div.sandbox',
      h('div.sandbox-bar', btnRun, btnPy, btnMd, h('span.spacer'), btnReset,
        h('span.kbd-hint', h('kbd', '⌘'), ' / ', h('kbd', 'Strg'), ' + ', h('kbd', '↵'))),
      editor.el,
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

  /* ----------------------------------------------------------- Boot */
  document.getElementById('menuBtn').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.getElementById('scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
  window.addEventListener('hashchange', render);
  render();
})();
