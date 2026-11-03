# PyLab for Beginners

Interaktiver Python-Trainer im Browser – ohne Installation, ohne Build, ohne Server.
*An interactive, browser-based Python trainer for beginners (no install, no build step).*

Python läuft direkt im Browser (via [Pyodide](https://pyodide.org)), deine Lösungen werden gegen versteckte Tests geprüft.

## Was drin steckt

18 Module, vom ersten `print()` bis zu Graphen und Objektorientierung:

| Gruppe | Themen |
|---|---|
| Grundlagen | Variablen & Typen, Kontrollfluss, Funktionen & Scope, List Comprehensions |
| Datenstrukturen | Listen, Tupel, Stack, Queue, verkettete Liste, Dictionary, Sets |
| Algorithmen | Rekursion, Sortieren (Bubble / Merge) |
| Bäume & Graphen | Binärer Suchbaum, Traversierungen, Graphen (BFS / DFS) |
| OOP | Klassen, Objekte, Vererbung |

Jedes Modul hat vier Modi:

1. **Verstehen** – Erklärseite mit Analogie, Begriffen, lauffähigem Beispiel, typischen Stolpersteinen und Spickzettel
2. **Entdecken** – animierte Szenen, in denen du Schritt für Schritt siehst, was im Speicher passiert
3. **Trainieren** – 5 Aufgaben pro Modul mit Hinweisen und automatisch geprüften Lösungen
4. **Sandbox** – freier Editor mit Konsole

In der Sandbox lassen sich Eingaben für `input()` unter dem Editor eintragen (eine Zeile pro Aufruf).

Dazu: 8 Farbthemen (4 dunkel, 4 hell), Lerntimer mit dezenten Pausenerinnerungen, Fortschrittsanzeige und Oberfläche auf Deutsch und Englisch.

## Starten

Es ist eine statische Seite. Wegen des Web Workers am besten über einen lokalen Server öffnen:

```bash
cd PyLab-for-Beginners
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen. Beim ersten Start lädt Pyodide einmalig aus dem Netz (ca. 10 MB), danach läuft der Python-Teil im Browser-Cache.

## Projektstruktur

```
index.html        Einstieg, Kopfzeile, Menüs
css/style.css     Design-Tokens, Themes, Layout, Szenen
js/app.js         Router, Modi, Aufgaben-Runner, Themes, Menüs
js/content.js     Themen, Aufgaben, Tests, Szenen-Konfiguration
js/visuals.js     Animierte Szenen (Registry scenes.<name>)
js/explain.js     Inhalte der Verstehen-Seiten (DE/EN)
js/i18n.js        UI-Texte und Sprachauswahl
js/meta-en.js     Englische Themenköpfe und Szenenbeschreibungen
js/content-en.js  Englische Aufgaben und Szenentexte
js/timer.js       Lerntimer und Pausenerinnerung
assets/           Logo-Varianten, Schriften (assets/fonts, lokal eingebunden)
```

Reine Klassik-Skripte, keine Abhängigkeiten außer Pyodide aus dem CDN (jsDelivr). Die Schriften liegen lokal im Projekt, es wird nichts von Google geladen.

## Eigene Aufgaben ergänzen

Aufgaben stehen in `js/content.js` pro Thema: Startcode, Lösung, Hinweise und ein Python-Testblock mit `assert`-Anweisungen, der versteckt ausgeführt wird. Neue Szenen werden in `js/visuals.js` registriert.

## Sprachen

Oberfläche, Erklärseiten, Aufgaben und Szenen gibt es auf Deutsch und Englisch. Die Sprache wählst du oben rechts. Deutsche Aufgaben stehen in `js/content.js`, die englische Fassung in `js/content-en.js`.

## Lizenz

Der Code steht unter der [MIT-Lizenz](LICENSE). Die Schriften Space Grotesk und JetBrains Mono stehen unter der SIL Open Font License 1.1 (Texte in `assets/fonts/`). Python läuft über [Pyodide](https://pyodide.org) (MPL 2.0).
