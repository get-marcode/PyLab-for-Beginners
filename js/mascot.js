/* ==========================================================================
   mascot.js — kleine Weltraumsonde im Header
   --------------------------------------------------------------------------
   Reine Dekoration: reagiert auf Aufgaben (Event "pylab:task") und auf den
   Lerntimer (läuft, pausiert, Pause). Kein Ton, kein Fokus, abschaltbar.
   Daten: localStorage "pylab.mascot" ("off" = aus).
   ========================================================================== */

const PyLabMascot = (() => {
  'use strict';
  const { t } = I18n;
  const KEY = 'pylab.mascot';
  const slot = document.querySelector('.topbar-right');
  if (!slot) return {};

  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, kids = []) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    kids.forEach((k) => n.append(k));
    return n;
  };

  /* ------------------------------------------------------------ Figur */
  const eyes = svgEl('g', { class: 'm-eyes' }, [
    svgEl('ellipse', { cx: 19, cy: 26, rx: 2.1, ry: 3 }),
    svgEl('ellipse', { cx: 29, cy: 26, rx: 2.1, ry: 3 }),
  ]);
  const arcEyes = svgEl('g', { class: 'm-arc' }, [
    svgEl('path', { d: 'M16.6 27.2q2.4-3.6 4.8 0' }),
    svgEl('path', { d: 'M26.6 27.2q2.4-3.6 4.8 0' }),
  ]);
  const mouths = svgEl('g', { class: 'm-mouths' }, [
    svgEl('path', { class: 'mo-smile', d: 'M21.2 30.4q2.8 2.4 5.6 0' }),
    svgEl('path', { class: 'mo-open', d: 'M21 30q3 4.6 6 0z' }),
    svgEl('path', { class: 'mo-worry', d: 'M21.4 32q2.6-2 5.2 0' }),
    svgEl('path', { class: 'mo-flat', d: 'M22 31.2h4' }),
  ]);

  const body = svgEl('g', { class: 'm-body' }, [
    svgEl('path', { class: 'm-arm m-arm-l', d: 'M10.5 28.5q-5 1-4.6 6.2' }),
    svgEl('path', { class: 'm-arm m-arm-r', d: 'M37.5 28.5q5 1 4.6 6.2' }),
    svgEl('circle', { class: 'm-shell', cx: 24, cy: 27, r: 15.5 }),
    svgEl('path', { class: 'm-belly', d: 'M16.4 39.4q7.6 4 15.2 0l-1.6-3.4h-12z' }),
    svgEl('rect', { class: 'm-visor', x: 12, y: 19, width: 24, height: 15, rx: 7.5 }),
    eyes, arcEyes, mouths,
    svgEl('text', { class: 'm-zzz', x: 36, y: 14 }, [document.createTextNode('z')]),
  ]);

  const root = svgEl('svg', { viewBox: '0 0 48 56', width: 40, height: 46, 'aria-hidden': 'true', class: 'mascot-svg' }, [
    svgEl('path', { class: 'm-flame', d: 'M21.5 43.5q2.5 9 5 0z' }),
    svgEl('g', { class: 'm-ant' }, [
      svgEl('path', { class: 'm-stem', d: 'M24 11.6V5.6' }),
      svgEl('circle', { class: 'm-tip', cx: 24, cy: 4.4, r: 2.6 }),
    ]),
    body,
  ]);

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mascot';
  btn.dataset.state = 'idle';
  btn.append(root);
  (slot.closest('.topbar') || slot).append(btn);

  /* ---------------------------------------------------------- Zustand */
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* ohne Speicher: an */ }

  let base = 'idle';
  let temp = '';
  let tempTimer = 0;
  let wasRunning = false;
  let prevRunning = false;

  const paint = () => { btn.dataset.state = temp || base; };
  const flash = (state, ms = 2600) => {
    temp = state;
    clearTimeout(tempTimer);
    tempTimer = setTimeout(() => { temp = ''; paint(); }, ms);
    paint();
  };

  const hop = () => {
    btn.classList.remove('is-hop');
    void btn.offsetWidth;
    btn.classList.add('is-hop');
  };

  function syncTimer() {
    if (typeof PyLabTimer === 'undefined' || !PyLabTimer.state) return;
    const s = PyLabTimer.state();
    if (s.running) wasRunning = true;
    if (s.mode === 'break' && s.running) base = 'rest';
    else if (!s.running && wasRunning) base = 'sleep';
    else base = 'idle';
    if (s.running && !prevRunning) { hop(); flash('happy', 1600); }
    prevRunning = s.running;
    paint();
  }

  const label = () => { btn.title = btn.ariaLabel = t('mascot.name'); };
  label();

  btn.addEventListener('click', () => { hop(); flash('happy', 1400); });
  window.addEventListener('pylab:task', (e) => {
    if (!enabled) return;
    if (e.detail && e.detail.ok) { hop(); flash('happy'); } else flash('worry', 3000);
  });
  setInterval(syncTimer, 1000);

  /* Mobil: Sprache, Theme, Status und Fortschritt liegen hinter dem „⋯“-Knopf. */
  const more = document.getElementById('moreBtn');
  if (more) {
    const setMore = (on) => { slot.classList.toggle('is-open', on); more.setAttribute('aria-expanded', String(on)); };
    more.addEventListener('click', (e) => { e.stopPropagation(); setMore(!slot.classList.contains('is-open')); });
    document.addEventListener('click', (e) => { if (!e.target.closest('.topbar-extra') && !e.target.closest('.theme-menu')) setMore(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMore(false); });
  }

  const apply = () => { btn.hidden = !enabled; };
  apply();
  syncTimer();

  return {
    get enabled() { return enabled; },
    set(on) {
      enabled = !!on;
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* nur diese Sitzung */ }
      apply();
    },
    relabel: label,
    show: (state) => flash(state, 4000),
  };
})();
