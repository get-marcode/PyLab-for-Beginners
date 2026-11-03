/* ==========================================================================
   timer.js — Lerntimer mit sanfter Pausen-Erinnerung
   --------------------------------------------------------------------------
   Misst nur aktive Lernzeit (Tab sichtbar + Eingaben in den letzten 90 s).
   Nach dem eingestellten Intervall (Standard 25 Min) erscheint eine kleine,
   nicht blockierende Karte unter dem Zeitchip. Nichts davon nimmt den Fokus
   oder spielt Töne. Daten: localStorage "pylab.timer" (nur im Browser).
   ========================================================================== */

const PyLabTimer = (() => {
  'use strict';
  const { h } = Visuals;
  const { t } = I18n;

  const KEY = 'pylab.timer';
  const AWAY_AFTER = 90;     // Sekunden ohne Eingabe, danach zählt keine Lernzeit mehr
  const AWAY_RESET = 300;    // 5 Minuten Abwesenheit gelten selbst als Pause
  const SNOOZE_MIN = 10;
  const R = 9;
  const C = 2 * Math.PI * R;

  /* ------------------------------------------------------------ Zustand */
  const defaults = { days: {}, interval: 25, breakMin: 5, remind: true };
  const load = () => {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; } catch (e) { return { ...defaults }; }
  };
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ohne Speicher läuft der Timer trotzdem */ } };
  const st = load();

  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const learned = (key = dayKey()) => st.days[key] || 0;

  let session = 0;               // aktive Sekunden seit der letzten Pause
  let nextAt = st.interval * 60; // ab hier wird erinnert
  let away = 0;
  let due = false;
  let mode = 'learn';            // 'learn' | 'break'
  let breakLeft = 0;
  let lastInput = Date.now();
  let lastTick = Date.now();
  let toastTimer = 0;
  let lastLabelMin = -1;

  /* ----------------------------------------------------------- Format */
  const minutes = (sec) => Math.floor(sec / 60);
  const fmtMin = (sec) => {
    const m = minutes(sec);
    return m >= 60 ? `${Math.floor(m / 60)} ${t('timer.h')} ${String(m % 60).padStart(2, '0')} ${t('timer.min')}` : `${m} ${t('timer.min')}`;
  };
  const fmtClock = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

  /* ------------------------------------------------------------- DOM */
  const wrap = document.getElementById('timerWrap');
  if (!wrap) return {};

  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  const track = mk('circle', { cx: 12, cy: 12, r: R, class: 'trk', fill: 'none', 'stroke-width': 2.5 });
  const prog = mk('circle', { cx: 12, cy: 12, r: R, class: 'bar', fill: 'none', 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-dasharray': C, 'stroke-dashoffset': C, transform: 'rotate(-90 12 12)' });
  const hands = mk('path', { d: 'M12 7.8V12l2.6 1.6', class: 'hands', fill: 'none', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const ringSvg = mk('svg', { viewBox: '0 0 24 24', width: 24, height: 24, 'aria-hidden': 'true', class: 'timer-ring' });
  ringSvg.append(track, prog, hands);

  const label = h('span.timer-text', fmtMin(0));
  const pill = h('button.timer-pill', {
    type: 'button', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', title: t('timer.title'),
    onclick: () => togglePop(pop.hidden),
  }, ringSvg, label);

  /* Erinnerungskarte (nicht modal) */
  const toastTitle = h('strong');
  const toastText = h('p');
  const toastActions = h('div.timer-actions');
  const toast = h('div.timer-toast', { role: 'status', 'aria-live': 'polite', hidden: true },
    h('button.timer-x', { type: 'button', 'aria-label': t('timer.close'), onclick: () => hideToast() }, '×'),
    toastTitle, toastText, toastActions);

  /* Popover mit Details und Einstellungen */
  const bigToday = h('strong.timer-big');
  const sessionLine = h('span');
  const sessionBar = h('i');
  const weekEl = h('div.timer-week');
  const btnBreak = h('button.btn.btn-primary', { type: 'button', onclick: () => (mode === 'break' ? endBreak(false) : startBreak()) }, t('timer.startBreak'));

  const select = (opts, value, onchange, aria) => {
    const el = h('select.field.timer-select', { 'aria-label': aria, onchange: (e) => onchange(Number(e.target.value)) },
      opts.map(([v, t]) => h('option', { value: v }, t)));
    el.value = String(value);
    return el;
  };
  const selInterval = select([15, 20, 25, 30, 45, 60].map((n) => [n, `${n} ${t('timer.min')}`]), st.interval, (v) => {
    st.interval = v; nextAt = Math.max(session + 60, v * 60); due = false; save(); paint();
  }, t('timer.remindAfter'));
  const selBreak = select([3, 5, 10, 15].map((n) => [n, `${n} ${t('timer.min')}`]), st.breakMin, (v) => { st.breakMin = v; save(); }, t('timer.breakLen'));
  const chkRemind = h('input', { type: 'checkbox', id: 'timerRemind', onchange: (e) => { st.remind = e.target.checked; due = false; save(); paint(); } });
  chkRemind.checked = st.remind;

  const pop = h('div.timer-pop', { role: 'dialog', 'aria-label': t('timer.title'), hidden: true },
    h('div.menu-label', t('timer.heading')),
    bigToday,
    h('div.timer-sess', sessionLine, h('div.progress', sessionBar)),
    weekEl,
    btnBreak,
    h('div.timer-set',
      h('label', { for: 'timerRemind' }, chkRemind, ' ' + t('timer.remind')),
      h('label', t('timer.remindAfter') + ' ', selInterval),
      h('label', t('timer.breakLen') + ' ', selBreak)),
    h('button.timer-link', { type: 'button', onclick: () => { if (confirm(t('timer.resetConfirm'))) { st.days[dayKey()] = 0; save(); paint(); } } }, t('timer.resetToday')),
  );
  wrap.append(pill, toast, pop);

  /* ----------------------------------------------------------- Anzeige */
  function paint() {
    const inBreak = mode === 'break';
    const target = st.interval * 60;
    const frac = inBreak ? 1 - breakLeft / (st.breakMin * 60) : Math.min(1, session / target);
    prog.style.strokeDashoffset = C * (1 - frac);
    pill.classList.toggle('is-break', inBreak);
    pill.classList.toggle('is-due', due && !inBreak);
    label.textContent = inBreak ? t('timer.breakCount', { t: fmtClock(Math.ceil(breakLeft)) }) : due ? t('timer.breakNow') : fmtMin(session);
    pill.title = t('timer.tooltip', { today: fmtMin(learned()), session: fmtMin(session) });
    if (minutes(session) !== lastLabelMin) {
      lastLabelMin = minutes(session);
      pill.setAttribute('aria-label', t('timer.aria', { session: fmtMin(session) }));
    }
    if (!pop.hidden) paintPop();
  }

  function paintPop() {
    const inBreak = mode === 'break';
    bigToday.textContent = fmtMin(learned());
    sessionLine.textContent = inBreak
      ? t('timer.breakLeft', { t: fmtClock(Math.ceil(breakLeft)) })
      : t('timer.sinceBreak', { session: minutes(session), max: st.interval });
    sessionBar.style.width = Math.min(100, (inBreak ? 100 * (1 - breakLeft / (st.breakMin * 60)) : (100 * session) / (st.interval * 60))) + '%';
    btnBreak.textContent = inBreak ? t('timer.endBreak') : t('timer.startBreak');
    const names = t('timer.days').split(',');
    const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
    const max = Math.max(1800, ...days.map((d) => learned(dayKey(d))));
    weekEl.replaceChildren(...days.map((d, i) => {
      const v = learned(dayKey(d));
      return h('div.wk' + (i === 6 ? '.is-today' : ''), { title: `${names[d.getDay()]}: ${fmtMin(v)}` },
        h('i', { style: { height: Math.max(3, Math.round((v / max) * 36)) + 'px' } }), h('span', names[d.getDay()]));
    }));
  }

  /* ------------------------------------------------------ Erinnerungen */
  function showToast(title, text, actions, autoHide) {
    toastTitle.textContent = title;
    toastText.textContent = text;
    toastActions.replaceChildren(...actions);
    toast.hidden = false;
    clearTimeout(toastTimer);
    if (autoHide) toastTimer = setTimeout(hideToast, autoHide);
  }
  function hideToast() { toast.hidden = true; clearTimeout(toastTimer); }

  function remind() {
    due = true;
    showToast(t('timer.dueTitle'),
      t('timer.dueText', { m: minutes(session), b: st.breakMin }),
      [h('button.btn.btn-primary', { type: 'button', onclick: startBreak }, t('timer.dueStart', { b: st.breakMin })),
        h('button.btn.btn-ghost', { type: 'button', onclick: snooze }, t('timer.snooze', { n: SNOOZE_MIN }))],
      25000);
  }
  function snooze() { due = false; nextAt = session + SNOOZE_MIN * 60; hideToast(); paint(); }

  function startBreak() {
    mode = 'break';
    breakLeft = st.breakMin * 60;
    due = false;
    hideToast();
    paint();
  }
  function endBreak(finished) {
    mode = 'learn';
    session = 0;
    nextAt = st.interval * 60;
    due = false;
    if (finished) showToast(t('timer.doneTitle'), t('timer.doneText'), [h('button.btn.btn-ghost', { type: 'button', onclick: hideToast }, t('timer.ok'))], 8000);
    paint();
  }

  /* ----------------------------------------------------------- Zählen */
  function step(dt, active) {
    if (mode === 'break') {
      breakLeft -= dt;
      if (breakLeft <= 0) endBreak(true); else paint();
      return;
    }
    if (!active) {
      away += dt;
      if (away >= AWAY_RESET && session > 0) { session = 0; nextAt = st.interval * 60; due = false; hideToast(); paint(); }
      return;
    }
    away = 0;
    session += dt;
    const k = dayKey();
    st.days[k] = learned(k) + dt;
    if (st.remind && !due && session >= nextAt) remind();
    paint();
  }

  const isActive = () => document.visibilityState === 'visible' && (Date.now() - lastInput) / 1000 <= AWAY_AFTER;
  setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTick) / 1000;
    lastTick = now;
    const active = isActive();
    step(active ? Math.min(dt, 5) : dt, active);
  }, 1000);
  setInterval(save, 15000);

  const touch = () => { lastInput = Date.now(); };
  ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach((ev) => window.addEventListener(ev, touch, { passive: true }));
  window.addEventListener('mousemove', (() => { let t = 0; return () => { const n = Date.now(); if (n - t > 2000) { t = n; touch(); } }; })(), { passive: true });
  window.addEventListener('scroll', touch, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); else lastTick = Date.now(); });
  window.addEventListener('pagehide', save);

  /* ---------------------------------------------------------- Popover */
  function togglePop(open) {
    pop.hidden = !open;
    pill.setAttribute('aria-expanded', String(open));
    if (open) { hideToast(); paintPop(); }
  }
  document.addEventListener('click', (e) => { if (!pop.hidden && !e.target.closest('.timer-wrap')) togglePop(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { togglePop(false); pill.focus(); } });

  paint();

  /* Für Tests und Demos: Sekunden aktiver Lernzeit simulieren. */
  return {
    advance(sec) { for (let i = 0; i < sec; i++) step(1, true); },
    state: () => ({ session, due, mode, breakLeft, today: learned() }),
  };
})();
