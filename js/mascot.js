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


  /* ------------------------------------------------------- Sprüche */
  /* Kurz, freundlich, ohne Druck. Jede Gruppe wird gemischt, damit sich nichts direkt wiederholt. */
  const SAY = {
    de: {
      win: ['Sauber gelöst!', 'Das saß!', 'Läuft wie geschmiert.', 'Bug? Welcher Bug?', 'Du wirst richtig gut.', 'Ich bin beeindruckt.', 'Noch einer im Kasten.', 'So macht das Spaß.'],
      fail: ['Fehler sind nur Hinweise.', 'Fast! Lies die Meldung genau.', 'Jeder Bug lehrt dich was.', 'Kurz durchatmen, nochmal.', 'Ich glaub an dich.', 'Den Fehler finden wir.', 'Das kriegst du hin.'],
      start: ['Los geht’s!', 'Ich bin bereit.', 'Zeit für Python.', 'Na dann, auf geht’s.'],
      back: ['Da bist du ja wieder!', 'Willkommen zurück!', 'Ich hab gewartet.'],
      rest: ['Pause! Trink einen Schluck.', 'Streck dich kurz.', 'Augen mal weg vom Bildschirm.'],
      sleep: ['Bis gleich …', 'Ich döse kurz.'],
      poke: ['Hallo!', 'Na, alles gut?', 'Beep!', 'Ich bin hier, falls was ist.', 'Du schaffst das.', 'Kleiner Tipp: print() ist dein Freund.', 'Fehlermeldungen sind keine Feinde.'],
    },
    en: {
      win: ['Nicely done!', 'Nailed it!', 'Smooth as butter.', 'Bug? What bug?', 'You’re getting good.', 'I’m impressed.', 'Another one down.', 'This is fun.'],
      fail: ['Errors are just hints.', 'Close! Read the message.', 'Every bug teaches you.', 'Deep breath, try again.', 'I believe in you.', 'We’ll find it.', 'You’ve got this.'],
      start: ['Let’s go!', 'Ready when you are.', 'Python time.', 'Alright, here we go.'],
      back: ['There you are!', 'Welcome back!', 'I was waiting.'],
      rest: ['Break! Have some water.', 'Stretch a little.', 'Eyes off the screen.'],
      sleep: ['Back in a bit …', 'Just resting.'],
      poke: ['Hello!', 'All good?', 'Beep!', 'I’m here if you need me.', 'You can do this.', 'Tip: print() is your friend.', 'Error messages aren’t enemies.'],
    },
  };
  const bags = {};
  const pick = (kind) => {
    const all = SAY[document.documentElement.lang === 'en' ? 'en' : 'de'][kind];
    const key = document.documentElement.lang + kind;
    if (!bags[key] || !bags[key].length) {
      bags[key] = all.slice().sort(() => Math.random() - 0.5);
      if (bags[key][bags[key].length - 1] === lastSaid) bags[key].reverse();
    }
    return bags[key].pop();
  };

  /* ---------------------------------------------------- Sprechblase */
  let talk = true;
  try { talk = localStorage.getItem(KEY + '.talk') !== 'off'; } catch (e) { /* ohne Speicher: an */ }
  const bubble = document.createElement('div');
  bubble.className = 'mascot-bubble';
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-live', 'polite');
  bubble.hidden = true;
  btn.parentNode.append(bubble);
  let bubbleTimer = 0;
  let lastSaid = '';
  let lastAt = 0;
  const COOLDOWN = 60000;       // zwischen zwei freiwilligen Sprüchen mindestens eine Minute

  const hush = () => { clearTimeout(bubbleTimer); bubble.classList.remove('is-in'); bubbleTimer = setTimeout(() => { bubble.hidden = true; }, 250); };
  /* force: vom Nutzer ausgelöst (Klick), ignoriert die Pause zwischen Sprüchen */
  const say = (kind, force = false) => {
    if (!enabled || !talk) return;
    if (!force && Date.now() - lastAt < COOLDOWN) return;
    const text = pick(kind);
    lastSaid = text;
    lastAt = Date.now();
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    bubble.hidden = false;
    void bubble.offsetWidth;
    bubble.classList.add('is-in');
    bubbleTimer = setTimeout(hush, 4600);
  };
  bubble.addEventListener('click', hush);

  /* ---------------------------------------------------------- Zustand */
  let enabled = true;
  try { enabled = localStorage.getItem(KEY) !== 'off'; } catch (e) { /* ohne Speicher: an */ }

  let base = 'idle';
  let temp = '';
  let tempTimer = 0;
  let wasRunning = false;
  let prevRunning = false;
  let prevBase = 'idle';
  let wasSleeping = false;
  let failStreak = 0;

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
    if (s.running && !prevRunning) {
      hop(); flash('happy', 1600);
      if (base === 'idle' && wasSleeping) say('back'); else if (Math.random() < 0.4) say('start');
    }
    if (base === 'rest' && prevBase !== 'rest') say('rest');
    if (base === 'sleep' && prevBase !== 'sleep') say('sleep');
    wasSleeping = base === 'sleep' ? true : (s.running ? false : wasSleeping);
    prevBase = base;
    prevRunning = s.running;
    paint();
  }

  const label = () => { btn.title = btn.ariaLabel = t('mascot.name'); };
  label();

  btn.addEventListener('click', () => { hop(); flash('happy', 1400); say('poke', true); });
  window.addEventListener('pylab:task', (e) => {
    if (!enabled) return;
    if (e.detail && e.detail.ok) {
      hop(); flash('happy');
      if (failStreak >= 2 || Math.random() < 0.3) say('win');   // nach Durchhängern immer, sonst selten
      failStreak = 0;
    } else {
      flash('worry', 3000);
      failStreak++;
      if (failStreak === 2 || failStreak % 4 === 0) say('fail');  // erst beim zweiten Fehlversuch, nie bei jedem
    }
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
      if (!on) hush();
      try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* nur diese Sitzung */ }
      apply();
    },
    get talk() { return talk; },
    setTalk(on) {
      talk = !!on;
      try { localStorage.setItem(KEY + '.talk', on ? 'on' : 'off'); } catch (e) { /* nur diese Sitzung */ }
      if (!on) hush();
    },
    say,
    relabel: label,
    show: (state) => flash(state, 4000),
  };
})();
