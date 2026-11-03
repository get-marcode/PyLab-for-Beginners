# PyLab for Beginners

🇩🇪 [Deutsche Version](README.de.md)

An interactive Python trainer for the browser: no installation, no build step, no server needed.

Python runs right in your browser (via [Pyodide](https://pyodide.org)), and your solutions are checked against hidden tests.

## What's inside

17 modules, from the first `print()` to graphs and object-oriented programming:

| Group | Topics |
|---|---|
| Basics | Variables & types, control flow, functions & scope, list comprehensions |
| Data structures | Lists, tuples, stack, queue, linked list, dictionary, sets |
| Algorithms | Recursion, sorting (bubble / merge) |
| Trees & graphs | Binary search tree, traversals, graphs (BFS / DFS) |
| OOP | Classes, objects, inheritance |

Every module has four modes:

1. **Understand** – explainer page with an analogy, key terms, a runnable example, common pitfalls and a cheat sheet
2. **Discover** – animated scenes that show step by step what happens in memory
3. **Train** – 5 tasks per module with hints and automatically checked solutions
4. **Sandbox** – a free editor with a console

In the sandbox you can enter input for `input()` below the editor (one line per call).

Also included: 8 colour themes (4 dark, 4 light), a learning timer with gentle break reminders, a progress dashboard and a user interface in German and English.

## Getting started

It is a static site. Because of the web worker, it is best opened through a local server:

```bash
cd PyLab-for-Beginners
python3 -m http.server 8000
```

Then open `http://localhost:8000` in your browser. On first start, Pyodide is downloaded once (about 10 MB); after that the Python part runs from the browser cache.

## Project structure

```
index.html        Entry point, header, menus
privacy.html      Privacy policy (German / English)
css/style.css     Design tokens, themes, layout, scenes
js/app.js         Router, modes, task runner, themes, menus
js/content.js     Topics, tasks, tests, scene configuration
js/visuals.js     Animated scenes (registry scenes.<name>)
js/explain.js     Content of the Understand pages (DE/EN)
js/i18n.js        UI texts and language selection
js/meta-en.js     English topic headers and scene descriptions
js/content-en.js  English tasks and scene texts
js/timer.js       Learning timer and break reminder
assets/           Logo variants, fonts (assets/fonts, included locally)
```

Plain classic scripts, no dependencies except Pyodide from a CDN (jsDelivr). The fonts are part of the project, nothing is loaded from Google.

## Adding your own tasks

Tasks live in `js/content.js`, per topic: starter code, solution, hints and a Python test block of `assert` statements that is run hidden. New scenes are registered in `js/visuals.js`.

## Languages

The interface, explainer pages, tasks and scenes are available in German and English. You choose the language at the top right. German tasks are in `js/content.js`, the English version is in `js/content-en.js`.

## License

The code is released under the [MIT License](LICENSE). The fonts Space Grotesk and JetBrains Mono are licensed under the SIL Open Font License 1.1 (texts in `assets/fonts/`). Python runs via [Pyodide](https://pyodide.org) (MPL 2.0).
