/* ==========================================================================
   i18n.js — Mehrsprachigkeit (Deutsch, English)
   --------------------------------------------------------------------------
   Aufbau:
     I18n.t(key, vars)      UI-Text; {name} wird ersetzt. Fallback: Deutsch.
     I18n.topic(topic)      Titel, Untertitel, Szenario, Lead in der Sprache
     I18n.scene(topic, s)   Szenen-Titel und -Beschreibung
     I18n.group(g)          Gruppen-Label
     I18n.level(l)          Aufgaben-Stufe
     I18n.set(lang)         speichert die Wahl und lädt die Seite neu

   Neue Sprache: in STRINGS einen Block ergänzen, in LANGS eintragen und in
   meta-en.js / explain.js das Muster für die Sprache übernehmen. Fehlende
   Übersetzungen fallen automatisch auf Deutsch zurück.
   ========================================================================== */

const I18n = (() => {
  'use strict';

  const KEY = 'pylab.lang';
  const LANGS = [
    { id: 'de', label: 'Deutsch', short: 'DE' },
    { id: 'en', label: 'English', short: 'EN' },
  ];

  const STRINGS = {
    de: {
      'a11y.menu': 'Menü öffnen',
      'a11y.home': 'Zum Dashboard',
      'a11y.nav': 'Lehrplan',
      'a11y.progress': 'Gesamtfortschritt',
      'py.loading': 'Python lädt …',
      'py.ready': 'Python bereit',
      'py.error': 'Python offline',
      'run.loadFail': 'Python konnte nicht geladen werden. Prüfe deine Internetverbindung und lade die Seite neu.',
      'run.timeout': 'Zeitüberschreitung nach {s} s — läuft deine Schleife endlos? Prüfe, ob sich die Bedingung jemals ändert.',

      'theme.title': 'Farbschema wählen',
      'theme.menu': 'Farbschema',
      'theme.dark': 'Dunkel',
      'theme.light': 'Hell',
      'theme.space': 'Deep Space', 'theme.ocean': 'Ozean', 'theme.forest': 'Wald', 'theme.dusk': 'Dämmerung',
      'theme.day': 'Tag', 'theme.sand': 'Sand', 'theme.nebel': 'Nebel', 'theme.rose': 'Rosé',
      'lang.title': 'Sprache wählen',
      'lang.menu': 'Sprache',

      'crumb.dashboard': 'Dashboard',
      'topic.eyebrow': 'Modul {id} · {scenario}',
      'toast.reset': 'Fortschritt zurückgesetzt.',
      'confirm.reset': 'Gesamten Lernfortschritt und gespeicherte Entwürfe löschen?',

      'mode.learn': 'Verstehen',
      'mode.discover': 'Entdecken',
      'mode.train': 'Trainieren',
      'mode.sandbox': 'Sandbox',
      'notice.de-only': 'Die Texte der Szenen, Aufgaben und Tests sind derzeit nur auf Deutsch verfügbar. Die Übersetzung folgt.',

      'level.Init': 'Init', 'level.Update': 'Update', 'level.Debugging': 'Debugging', 'level.Edge Case': 'Edge Case', 'level.Algorithmus': 'Algorithmus',

      'train.goal': 'Aufgabe',
      'train.hintLabel': 'Hinweis:',
      'train.check': '▶ Ausführen & prüfen',
      'train.run': 'Nur ausführen',
      'train.hint': 'Hinweis',
      'train.reset': 'Zurücksetzen',
      'train.solution': 'Lösung zeigen',
      'train.solutionLocked': 'Noch {n} Fehlversuch(e) bis die Lösung freigeschaltet ist',
      'train.solutionShown': 'Musterlösung eingefügt. Lies sie in Ruhe durch und führe sie aus.',
      'train.checking': 'Prüfe …',
      'train.running': 'Läuft …',
      'train.codeError': 'Dein Code hat einen Fehler — lies die Meldung in der Konsole von unten nach oben.',
      'train.passed': '✓ Alle verdeckten Tests bestanden.',
      'train.next': 'Nächste Aufgabe →',
      'train.edge': 'Ein Testfall schlägt fehl — prüfe auch die Randfälle.',
      'train.testError': 'Beim Prüfen ist ein Fehler aufgetreten: {msg}',
      'train.failed': 'Der Test ist fehlgeschlagen.',
      'hint.tip': '💡 Tipp:',

      'sandbox.run': '▶ Ausführen',
      'sandbox.py': 'Als .py speichern',
      'sandbox.md': 'Als .md exportieren',
      'sandbox.noOutput': '(keine Ausgabe)',
      'md.title': 'Python-Sandbox',
      'md.exported': 'Exportiert am {date} aus PyLab',
      'md.code': 'Code',
      'md.console': 'Konsolenausgabe',

      'ctl.step': '▶ Schritt',
      'ctl.auto': 'Auto-Play',
      'ctl.pause': 'Pause',
      'ctl.reset': '↺ Neu',

      'dash.total': 'gesamt',
      'dash.eyebrow': 'Lernfortschritt',
      'dash.title': 'Dein Weg durch Python',
      'dash.intro': '{a} von {b} Modulen sind spielbar. Jede entdeckte Szene, jede gelöste Aufgabe und jede Sandbox-Session füllt die Ringe.',
      'dash.tasks': 'Aufgaben gelöst',
      'dash.scenes': 'Szenen entdeckt',
      'dash.modules': 'Module fertig',
      'dash.start': 'Jetzt starten',
      'dash.continue': 'Weiterlernen',
      'dash.reset': 'Fortschritt zurücksetzen',
      'dash.all': 'Alle Module',
      'dash.steps': '{done}/{total} Schritte',
      'dash.soon': 'bald verfügbar',

      'learn.analogy': 'Das Alltagsbild',
      'learn.terms': 'Die Kernbegriffe',
      'learn.example': 'Ein kleines Beispiel',
      'learn.pitfalls': 'Typische Stolperfallen',
      'learn.cheat': 'Spickzettel',
      'learn.tryIt': '▶ Beispiel ausführen',
      'learn.next': 'Weiter zu „Entdecken“',
      'learn.output': 'Ausgabe',
      'rail.progress': 'Dein Fortschritt',
      'rail.steps': '{done} von {total} Schritten',
      'rail.onPage': 'Auf dieser Seite',
      'rail.cheat': 'Spickzettel',
      'rail.cheatEmpty': 'Für dieses Thema folgt noch ein Spickzettel.',
      'rail.openLearn': 'Erklärung lesen',

      'timer.title': 'Lernzeit & Pausen',
      'timer.min': 'min',
      'timer.heading': 'Lernzeit heute',
      'timer.breakNow': 'Pause?',
      'timer.breakCount': 'Pause {t}',
      'timer.tooltip': 'Heute gelernt: {today} · seit der letzten Pause: {session}',
      'timer.aria': 'Lernzeit: {session} seit der letzten Pause. Öffnet Details.',
      'timer.breakLeft': 'Pause läuft noch {t}',
      'timer.sinceBreak': 'Seit der letzten Pause: {session} von {max} min',
      'timer.startBreak': 'Pause starten',
      'timer.endBreak': 'Pause beenden',
      'timer.remind': 'Pausen-Erinnerung',
      'timer.remindAfter': 'Erinnern nach',
      'timer.breakLen': 'Pausenlänge',
      'timer.resetToday': 'Heutige Zeit zurücksetzen',
      'timer.resetConfirm': 'Die heute gemessene Lernzeit auf 0 setzen?',
      'timer.dueTitle': 'Zeit für eine kleine Pause',
      'timer.dueText': 'Du lernst seit {m} Minuten konzentriert. {b} Minuten Wasser, Fenster auf oder kurz die Augen ausruhen helfen deinem Kopf.',
      'timer.dueStart': '{b} Min Pause',
      'timer.snooze': 'In {n} Min',
      'timer.doneTitle': 'Pause vorbei',
      'timer.doneText': 'Schön erholt? Weiter geht es in deinem Tempo.',
      'timer.ok': 'Okay',
      'timer.close': 'Schließen',
      'timer.h': 'h',
      'timer.days': 'So,Mo,Di,Mi,Do,Fr,Sa',
    },

    en: {
      'a11y.menu': 'Open menu',
      'a11y.home': 'Go to dashboard',
      'a11y.nav': 'Curriculum',
      'a11y.progress': 'Overall progress',
      'py.loading': 'Loading Python …',
      'py.ready': 'Python ready',
      'py.error': 'Python offline',
      'run.loadFail': 'Python could not be loaded. Check your internet connection and reload the page.',
      'run.timeout': 'Timed out after {s} s — is your loop running forever? Check whether the condition ever changes.',

      'theme.title': 'Choose colour theme',
      'theme.menu': 'Colour theme',
      'theme.dark': 'Dark',
      'theme.light': 'Light',
      'theme.space': 'Deep Space', 'theme.ocean': 'Ocean', 'theme.forest': 'Forest', 'theme.dusk': 'Dusk',
      'theme.day': 'Day', 'theme.sand': 'Sand', 'theme.nebel': 'Mist', 'theme.rose': 'Rosé',
      'lang.title': 'Choose language',
      'lang.menu': 'Language',

      'crumb.dashboard': 'Dashboard',
      'topic.eyebrow': 'Module {id} · {scenario}',
      'toast.reset': 'Progress reset.',
      'confirm.reset': 'Delete all learning progress and saved drafts?',

      'mode.learn': 'Understand',
      'mode.discover': 'Discover',
      'mode.train': 'Train',
      'mode.sandbox': 'Sandbox',
      'notice.de-only': 'Scene texts, tasks and test messages are currently available in German only. The translation is on its way.',

      'level.Init': 'Init', 'level.Update': 'Update', 'level.Debugging': 'Debugging', 'level.Edge Case': 'Edge case', 'level.Algorithmus': 'Algorithm',

      'train.goal': 'Task',
      'train.hintLabel': 'Hint:',
      'train.check': '▶ Run & check',
      'train.run': 'Run only',
      'train.hint': 'Hint',
      'train.reset': 'Reset',
      'train.solution': 'Show solution',
      'train.solutionLocked': '{n} more failed attempt(s) until the solution unlocks',
      'train.solutionShown': 'Model solution inserted. Read it carefully and run it.',
      'train.checking': 'Checking …',
      'train.running': 'Running …',
      'train.codeError': 'Your code has an error — read the message in the console from bottom to top.',
      'train.passed': '✓ All hidden tests passed.',
      'train.next': 'Next task →',
      'train.edge': 'A test case fails — check the edge cases, too.',
      'train.testError': 'An error occurred while checking: {msg}',
      'train.failed': 'The test failed.',
      'hint.tip': '💡 Tip:',

      'sandbox.run': '▶ Run',
      'sandbox.py': 'Save as .py',
      'sandbox.md': 'Export as .md',
      'sandbox.noOutput': '(no output)',
      'md.title': 'Python sandbox',
      'md.exported': 'Exported on {date} from PyLab',
      'md.code': 'Code',
      'md.console': 'Console output',

      'ctl.step': '▶ Step',
      'ctl.auto': 'Auto-play',
      'ctl.pause': 'Pause',
      'ctl.reset': '↺ Reset',

      'dash.total': 'overall',
      'dash.eyebrow': 'Learning progress',
      'dash.title': 'Your path through Python',
      'dash.intro': '{a} of {b} modules are playable. Every scene you discover, task you solve and sandbox session fills the rings.',
      'dash.tasks': 'tasks solved',
      'dash.scenes': 'scenes discovered',
      'dash.modules': 'modules done',
      'dash.start': 'Start now',
      'dash.continue': 'Keep learning',
      'dash.reset': 'Reset progress',
      'dash.all': 'All modules',
      'dash.steps': '{done}/{total} steps',
      'dash.soon': 'coming soon',

      'learn.analogy': 'The everyday picture',
      'learn.terms': 'Key terms',
      'learn.example': 'A small example',
      'learn.pitfalls': 'Common pitfalls',
      'learn.cheat': 'Cheat sheet',
      'learn.tryIt': '▶ Run example',
      'learn.next': 'Continue to “Discover”',
      'learn.output': 'Output',
      'rail.progress': 'Your progress',
      'rail.steps': '{done} of {total} steps',
      'rail.onPage': 'On this page',
      'rail.cheat': 'Cheat sheet',
      'rail.cheatEmpty': 'A cheat sheet for this topic is coming.',
      'rail.openLearn': 'Read the explanation',

      'timer.title': 'Study time & breaks',
      'timer.min': 'min',
      'timer.heading': 'Study time today',
      'timer.breakNow': 'Break?',
      'timer.breakCount': 'Break {t}',
      'timer.tooltip': 'Studied today: {today} · since the last break: {session}',
      'timer.aria': 'Study time: {session} since the last break. Opens details.',
      'timer.breakLeft': 'Break still running: {t}',
      'timer.sinceBreak': 'Since the last break: {session} of {max} min',
      'timer.startBreak': 'Start break',
      'timer.endBreak': 'End break',
      'timer.remind': 'Break reminder',
      'timer.remindAfter': 'Remind after',
      'timer.breakLen': 'Break length',
      'timer.resetToday': 'Reset today’s time',
      'timer.resetConfirm': 'Set today’s measured study time to 0?',
      'timer.dueTitle': 'Time for a short break',
      'timer.dueText': 'You have been studying for {m} minutes. {b} minutes with some water, an open window or resting your eyes will help.',
      'timer.dueStart': '{b} min break',
      'timer.snooze': 'In {n} min',
      'timer.doneTitle': 'Break over',
      'timer.doneText': 'Feeling refreshed? Carry on at your own pace.',
      'timer.ok': 'Okay',
      'timer.close': 'Close',
      'timer.h': 'h',
      'timer.days': 'Sun,Mon,Tue,Wed,Thu,Fri,Sat',
    },
  };

  /* Erkennung: gespeicherte Wahl > Browser-Sprache > Deutsch */
  const detect = () => {
    try {
      const saved = localStorage.getItem(KEY);
      if (LANGS.some((l) => l.id === saved)) return saved;
    } catch (e) { /* ohne Speicher: Browser-Sprache */ }
    return (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en';
  };
  const lang = detect();
  document.documentElement.lang = lang;

  const t = (key, vars) => {
    const raw = (STRINGS[lang] && STRINGS[lang][key]) ?? STRINGS.de[key] ?? key;
    return vars ? raw.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : raw;
  };

  /* Inhalte: deutsche Originale stehen in content.js, Übersetzungen in META */
  const meta = () => (typeof META !== 'undefined' && META[lang]) || null;
  const topic = (tp) => {
    const m = meta() && meta().topics[tp.id];
    return {
      title: (m && m.title) || tp.title,
      subtitle: (m && m.subtitle) || tp.subtitle,
      scenario: (m && m.scenario) || tp.scenario,
      lead: (m && m.lead) || tp.lead,
    };
  };
  const scene = (tp, sc) => {
    const m = meta() && meta().topics[tp.id] && meta().topics[tp.id].scenes && meta().topics[tp.id].scenes[sc.id];
    return { title: (m && m.title) || sc.title, blurb: (m && m.blurb) || sc.blurb };
  };
  const group = (g) => (meta() && meta().groups[g.id]) || g.label;
  const level = (l) => t('level.' + l);

  const set = (id) => {
    try { localStorage.setItem(KEY, id); } catch (e) { /* gilt nur bis zum Neuladen */ }
    location.reload();
  };

  return { lang, LANGS, t, topic, scene, group, level, set, isDefaultContent: () => lang === 'de' };
})();
