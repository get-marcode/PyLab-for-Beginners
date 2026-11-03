/* ==========================================================================
   explain.js — Erklärungsseiten ("Verstehen") pro Thema, Deutsch + Englisch
   --------------------------------------------------------------------------
   EXPLAIN[themenId][sprache] = {
     analogy   – Alltagsbild (HTML, 1–2 Sätze)
     terms     – [[Begriff, Erklärung], …]  (3 Kernbegriffe)
     example   – { code, note }  (läuft im Browser, Ausgabe erscheint darunter)
     pitfalls  – [HTML, …]  typische Stolperfallen
     cheat     – [[Code, Erklärung], …]  Spickzettel (auch in der rechten Spalte)
   }
   Fehlt eine Sprache, wird Deutsch gezeigt.
   ========================================================================== */

const EXPLAIN = (() => {
  const py = String.raw;

  return {
    /* ---------------------------------------------------------------- 2 */
    2: {
      de: {
        analogy: 'Eine <strong>Variable</strong> ist ein beschriftetes Schraubglas: Auf dem Etikett steht der Name, im Glas liegt der Wert. Du kannst den Inhalt austauschen, das Etikett bleibt.',
        terms: [
          ['Variable', 'Ein Name, hinter dem ein Wert gespeichert ist: <code>preis = 3.5</code>.'],
          ['Datentyp', 'Die Art des Werts: <code>int</code> (ganze Zahl), <code>float</code> (Kommazahl), <code>str</code> (Text), <code>bool</code> (Wahr/Falsch).'],
          ['print()', 'Gibt etwas auf dem Bildschirm aus. Mit einem <strong>f-String</strong> setzt du Variablen direkt in Text ein: <code>f"Summe: {summe}"</code>.'],
        ],
        example: {
          code: py`artikel = "Cappuccino"
preis = 3.5
menge = 2
summe = preis * menge
print(f"{menge}x {artikel}: {summe:.2f} Euro")`,
          note: 'Drei Variablen, eine Rechnung, ein formatierter Bon.',
        },
        pitfalls: [
          '<code>"5" + 3</code> geht nicht: Text und Zahl lassen sich nicht addieren. Wandle mit <code>int("5")</code> oder <code>str(3)</code> um.',
          '<code>=</code> weist zu (<em>speichere</em>), <code>==</code> vergleicht (<em>ist gleich?</em>).',
          'Bei <code>input()</code> ist die Antwort immer Text — auch wenn eine Zahl getippt wurde.',
        ],
        cheat: [['x = 5', 'Variable anlegen'], ['type(x)', 'Datentyp abfragen'], ['int("7"), float("2.5"), str(3)', 'Typ umwandeln'], ['f"Hallo {name}"', 'Text mit Variablen'], ['x += 1', 'um 1 erhöhen']],
      },
      en: {
        analogy: 'A <strong>variable</strong> is a labelled jar: the label holds the name, the jar holds the value. You can swap the contents, the label stays.',
        terms: [
          ['Variable', 'A name behind which a value is stored: <code>price = 3.5</code>.'],
          ['Data type', 'The kind of value: <code>int</code> (whole number), <code>float</code> (decimal), <code>str</code> (text), <code>bool</code> (True/False).'],
          ['print()', 'Shows something on screen. With an <strong>f-string</strong> you put variables straight into text: <code>f"Total: {total}"</code>.'],
        ],
        example: {
          code: py`item = "Cappuccino"
price = 3.5
quantity = 2
total = price * quantity
print(f"{quantity}x {item}: {total:.2f} euros")`,
          note: 'Three variables, one calculation, one formatted receipt.',
        },
        pitfalls: [
          '<code>"5" + 3</code> does not work: text and numbers cannot be added. Convert with <code>int("5")</code> or <code>str(3)</code>.',
          '<code>=</code> assigns (<em>store this</em>), <code>==</code> compares (<em>is it equal?</em>).',
          'With <code>input()</code> the answer is always text — even if a number was typed.',
        ],
        cheat: [['x = 5', 'create a variable'], ['type(x)', 'ask for the type'], ['int("7"), float("2.5"), str(3)', 'convert the type'], ['f"Hello {name}"', 'text with variables'], ['x += 1', 'increase by 1']],
      },
    },

    /* ---------------------------------------------------------------- 3 */
    3: {
      de: {
        analogy: 'Eine <strong>Ampel</strong> entscheidet (<code>if</code>), ein <strong>Förderband</strong> reicht Stück für Stück weiter (<code>for</code>), und ein <strong>Türsteher</strong> fragt so lange, bis das Passwort stimmt (<code>while</code>).',
        terms: [
          ['if / elif / else', 'Wählt genau einen Zweig: der erste, dessen Bedingung stimmt, gewinnt.'],
          ['for', 'Geht eine Folge von Werten durch, einen nach dem anderen: <code>for x in liste:</code>.'],
          ['while', 'Wiederholt, solange die Bedingung wahr ist. Irgendwann muss sie falsch werden — sonst läuft die Schleife endlos.'],
        ],
        example: {
          code: py`werte = [18, 21, 25, 31, 22]
summe = 0
for w in werte:
    if w > 30:
        print(w, "-> zu heiß!")
    elif w > 24:
        print(w, "-> warm")
    else:
        print(w, "-> okay")
    summe += w
print("Durchschnitt:", summe / len(werte))`,
          note: 'Eine Schleife, drei Zweige, eine Summe.',
        },
        pitfalls: [
          'Nach <code>if …</code>, <code>for …</code> und <code>while …</code> gehört ein <code>:</code> — und der Block darunter wird <strong>eingerückt</strong>.',
          'Reihenfolge bei <code>elif</code> zählt: Prüfe zuerst den strengsten Fall (z. B. <code>&gt; 30</code> vor <code>&gt; 24</code>).',
          'Vergisst du in einer <code>while</code>-Schleife, den Zähler zu ändern, läuft sie ewig.',
        ],
        cheat: [['if x > 0:', 'Bedingung prüfen'], ['elif / else:', 'weitere Fälle'], ['for i in range(5):', '0, 1, 2, 3, 4'], ['while bedingung:', 'wiederholen'], ['break / continue', 'abbrechen / überspringen']],
      },
      en: {
        analogy: 'A <strong>traffic light</strong> decides (<code>if</code>), a <strong>conveyor belt</strong> passes things on one at a time (<code>for</code>), and a <strong>doorman</strong> keeps asking until the password is right (<code>while</code>).',
        terms: [
          ['if / elif / else', 'Chooses exactly one branch: the first whose condition is true wins.'],
          ['for', 'Goes through a sequence of values one after another: <code>for x in items:</code>.'],
          ['while', 'Repeats as long as the condition is true. At some point it has to become false — otherwise the loop runs forever.'],
        ],
        example: {
          code: py`values = [18, 21, 25, 31, 22]
total = 0
for v in values:
    if v > 30:
        print(v, "-> too hot!")
    elif v > 24:
        print(v, "-> warm")
    else:
        print(v, "-> fine")
    total += v
print("Average:", total / len(values))`,
          note: 'One loop, three branches, one sum.',
        },
        pitfalls: [
          'After <code>if …</code>, <code>for …</code> and <code>while …</code> comes a <code>:</code> — and the block below is <strong>indented</strong>.',
          'The order of <code>elif</code> matters: check the strictest case first (e.g. <code>&gt; 30</code> before <code>&gt; 24</code>).',
          'If you forget to change the counter in a <code>while</code> loop, it runs forever.',
        ],
        cheat: [['if x > 0:', 'check a condition'], ['elif / else:', 'further cases'], ['for i in range(5):', '0, 1, 2, 3, 4'], ['while condition:', 'repeat'], ['break / continue', 'stop / skip']],
      },
    },

    /* ---------------------------------------------------------------- 4 */
    4: {
      de: {
        analogy: 'Eine <strong>Funktion</strong> ist ein Küchenrezept: Du gibst die Zutaten (Parameter) hinein, es kommt ein Gericht (Rückgabewert) heraus. Jedes Rezept hat seine eigene Arbeitsfläche — Variablen darin sind von außen nicht sichtbar.',
        terms: [
          ['def / return', '<code>def</code> definiert die Funktion, <code>return</code> gibt das Ergebnis zurück und beendet sie.'],
          ['Parameter & Argument', 'Parameter stehen in der Definition, Argumente übergibst du beim Aufruf: <code>preis(10, 0.2)</code>.'],
          ['Scope', 'Der Gültigkeitsbereich: Variablen innerhalb einer Funktion (lokal) kennt der Code außerhalb nicht.'],
        ],
        example: {
          code: py`def mit_rabatt(preis, prozent=10):
    rabatt = preis * prozent / 100
    return preis - rabatt

print(mit_rabatt(80))
print(mit_rabatt(80, 25))
# print(rabatt)   # NameError: nur innerhalb der Funktion bekannt`,
          note: 'Ein Standardwert (<code>prozent=10</code>) macht den zweiten Parameter optional.',
        },
        pitfalls: [
          'Ohne <code>return</code> liefert die Funktion <code>None</code> — <code>print()</code> im Inneren ist kein Ergebnis.',
          'Eine lokale Variable verschwindet nach dem Aufruf. Willst du den Wert behalten, gib ihn zurück.',
          'Standardwerte stehen immer <em>hinter</em> Parametern ohne Standardwert.',
        ],
        cheat: [['def f(a, b=1):', 'Funktion mit Standardwert'], ['return a + b', 'Ergebnis zurückgeben'], ['f(2)', 'aufrufen'], ['f(b=5, a=2)', 'benannte Argumente'], ['global x', 'äußere Variable ändern (selten!)']],
      },
      en: {
        analogy: 'A <strong>function</strong> is a recipe: you put the ingredients in (parameters) and a dish comes out (return value). Every recipe has its own work surface — variables inside it are invisible from outside.',
        terms: [
          ['def / return', '<code>def</code> defines the function, <code>return</code> hands back the result and ends it.'],
          ['Parameter & argument', 'Parameters appear in the definition, arguments are what you pass in the call: <code>price(10, 0.2)</code>.'],
          ['Scope', 'Where a name is valid: variables inside a function (local) are unknown to the code outside.'],
        ],
        example: {
          code: py`def with_discount(price, percent=10):
    discount = price * percent / 100
    return price - discount

print(with_discount(80))
print(with_discount(80, 25))
# print(discount)   # NameError: only known inside the function`,
          note: 'A default value (<code>percent=10</code>) makes the second parameter optional.',
        },
        pitfalls: [
          'Without <code>return</code> the function gives back <code>None</code> — a <code>print()</code> inside is not a result.',
          'A local variable disappears after the call. If you want to keep the value, return it.',
          'Default values always come <em>after</em> parameters without a default.',
        ],
        cheat: [['def f(a, b=1):', 'function with default'], ['return a + b', 'hand back a result'], ['f(2)', 'call it'], ['f(b=5, a=2)', 'named arguments'], ['global x', 'change an outer variable (rarely!)']],
      },
    },

    /* ---------------------------------------------------------------- 5 */
    5: {
      de: {
        analogy: 'Wie ein <strong>Sieb mit Stempel</strong>: Alles läuft durch, nur was passt, kommt durch (Filter) — und bekommt unterwegs einen Stempel aufgedrückt (Umwandlung). Das Ergebnis ist eine neue Liste.',
        terms: [
          ['Comprehension', '<code>[ausdruck for x in quelle]</code> baut eine neue Liste in einer Zeile.'],
          ['Filter', 'Mit <code>if</code> am Ende bleiben nur passende Elemente: <code>[x for x in zahlen if x &gt; 0]</code>.'],
          ['Umwandlung', 'Der Ausdruck vorn darf rechnen: <code>[x * 2 for x in zahlen]</code>.'],
        ],
        example: {
          code: py`logs = ["OK 200", "ERROR 500", "OK 200", "ERROR 404"]
fehler = [z for z in logs if z.startswith("ERROR")]
codes = [int(z.split()[1]) for z in fehler]
print(fehler)
print(codes)`,
          note: 'Erst filtern, dann aus den Treffern die Zahlen herausziehen.',
        },
        pitfalls: [
          'Das <code>if</code> <em>hinter</em> dem <code>for</code> filtert; ein <code>if … else …</code> <em>vor</em> dem <code>for</code> wandelt um. Das sind zwei verschiedene Dinge.',
          'Eine Comprehension liefert eine <strong>neue</strong> Liste — die alte bleibt unverändert.',
          'Zu verschachtelt wird es unlesbar. Ab zwei <code>for</code> lieber eine normale Schleife.',
        ],
        cheat: [['[x for x in L]', 'Kopie'], ['[x*2 for x in L]', 'umwandeln'], ['[x for x in L if x > 0]', 'filtern'], ['[a if c else b for x in L]', 'bedingt umwandeln'], ['{k: v for …}', 'Dict-Variante']],
      },
      en: {
        analogy: 'Like a <strong>sieve with a stamp</strong>: everything flows through, only what fits gets past (filter) — and receives a stamp on the way (transformation). The result is a new list.',
        terms: [
          ['Comprehension', '<code>[expression for x in source]</code> builds a new list in one line.'],
          ['Filter', 'With <code>if</code> at the end only matching elements stay: <code>[x for x in numbers if x &gt; 0]</code>.'],
          ['Transformation', 'The expression at the front may calculate: <code>[x * 2 for x in numbers]</code>.'],
        ],
        example: {
          code: py`logs = ["OK 200", "ERROR 500", "OK 200", "ERROR 404"]
errors = [line for line in logs if line.startswith("ERROR")]
codes = [int(line.split()[1]) for line in errors]
print(errors)
print(codes)`,
          note: 'First filter, then pull the numbers out of the hits.',
        },
        pitfalls: [
          'An <code>if</code> <em>after</em> the <code>for</code> filters; an <code>if … else …</code> <em>before</em> the <code>for</code> transforms. Those are two different things.',
          'A comprehension returns a <strong>new</strong> list — the old one stays unchanged.',
          'Too much nesting becomes unreadable. From two <code>for</code>s on, use a normal loop.',
        ],
        cheat: [['[x for x in L]', 'copy'], ['[x*2 for x in L]', 'transform'], ['[x for x in L if x > 0]', 'filter'], ['[a if c else b for x in L]', 'conditional transform'], ['{k: v for …}', 'dict version']],
      },
    },

    /* ---------------------------------------------------------------- 6 */
    6: {
      de: {
        analogy: 'Eine <strong>Liste</strong> ist ein Regal mit nummerierten Fächern, die bei <strong>0</strong> beginnen. Hinten etwas dazustellen ist leicht — vorne ein Fach einschieben bedeutet, alles dahinter ein Fach weiterzurücken.',
        terms: [
          ['Index', 'Die Nummer eines Fachs. <code>liste[0]</code> ist das erste, <code>liste[-1]</code> das letzte Element.'],
          ['append / insert / pop', '<code>append(x)</code> hängt hinten an, <code>insert(i, x)</code> fügt ein, <code>pop()</code> nimmt hinten weg.'],
          ['Slicing', '<code>liste[1:3]</code> schneidet einen Ausschnitt heraus (Ende ausgeschlossen).'],
        ],
        example: {
          code: py`temps = [20.5, 21.0, 19.8]
temps.append(22.4)
temps.insert(0, 18.9)
letzte = temps.pop()
print(temps, "| letzte:", letzte, "| Länge:", len(temps))
print(temps[1:3])`,
          note: 'Vorne einfügen verschiebt alle anderen Werte — hinten anhängen nicht.',
        },
        pitfalls: [
          'Das erste Element hat Index <code>0</code>, nicht 1. Bei <code>n</code> Elementen ist <code>n - 1</code> der letzte gültige Index.',
          '<code>liste[5]</code> bei kürzerer Liste → <code>IndexError</code>. Prüfe vorher <code>len(liste)</code>.',
          '<code>b = a</code> kopiert die Liste nicht — beide Namen zeigen auf dieselbe. Eine Kopie macht <code>a.copy()</code>.',
        ],
        cheat: [['L = [1, 2, 3]', 'anlegen'], ['L.append(4)', 'hinten anhängen'], ['L.insert(0, 9)', 'an Position einfügen'], ['L.pop() / L.pop(0)', 'entnehmen'], ['L[1:3], len(L)', 'Ausschnitt, Länge']],
      },
      en: {
        analogy: 'A <strong>list</strong> is a shelf with numbered compartments that start at <strong>0</strong>. Adding something at the back is easy — pushing a compartment in at the front means shifting everything behind it by one.',
        terms: [
          ['Index', 'The number of a compartment. <code>items[0]</code> is the first, <code>items[-1]</code> the last element.'],
          ['append / insert / pop', '<code>append(x)</code> adds at the end, <code>insert(i, x)</code> inserts, <code>pop()</code> removes from the end.'],
          ['Slicing', '<code>items[1:3]</code> cuts out a section (end excluded).'],
        ],
        example: {
          code: py`temps = [20.5, 21.0, 19.8]
temps.append(22.4)
temps.insert(0, 18.9)
last = temps.pop()
print(temps, "| last:", last, "| length:", len(temps))
print(temps[1:3])`,
          note: 'Inserting at the front shifts all other values — appending at the back does not.',
        },
        pitfalls: [
          'The first element has index <code>0</code>, not 1. With <code>n</code> elements, <code>n - 1</code> is the last valid index.',
          '<code>items[5]</code> on a shorter list → <code>IndexError</code>. Check <code>len(items)</code> first.',
          '<code>b = a</code> does not copy the list — both names point to the same one. A copy is made with <code>a.copy()</code>.',
        ],
        cheat: [['L = [1, 2, 3]', 'create'], ['L.append(4)', 'add at the end'], ['L.insert(0, 9)', 'insert at a position'], ['L.pop() / L.pop(0)', 'remove'], ['L[1:3], len(L)', 'slice, length']],
      },
    },

    /* ---------------------------------------------------------------- 7 */
    7: {
      de: {
        analogy: 'Ein <strong>Tuple</strong> ist ein versiegelter Umschlag: Du kannst hineinschauen und die Teile auslesen, aber nichts mehr austauschen. Perfekt für Dinge, die zusammengehören und sich nicht ändern sollen — wie Breiten- und Längengrad.',
        terms: [
          ['immutable', 'Unveränderlich: Nach dem Anlegen lässt sich kein Element mehr ersetzen.'],
          ['Entpacken', '<code>lat, lon = position</code> verteilt die Elemente auf Variablen — die Anzahl muss passen.'],
          ['Tuple vs. Liste', 'Runde Klammern <code>(1, 2)</code> statt eckige <code>[1, 2]</code>; Tuples sind kleiner und dürfen als Dictionary-Schlüssel dienen.'],
        ],
        example: {
          code: py`position = (48.137, 11.575)
lat, lon = position
print("Breite:", lat, "Länge:", lon)
try:
    position[0] = 0
except TypeError as fehler:
    print("Nicht erlaubt:", fehler)`,
          note: 'Der Schreibversuch scheitert — genau dafür gibt es Tuples.',
        },
        pitfalls: [
          'Ein Tuple mit einem Element braucht ein Komma: <code>(5,)</code>. Ohne Komma sind es nur Klammern um die 5.',
          'Beim Entpacken müssen links genauso viele Namen stehen wie Elemente rechts, sonst <code>ValueError</code>.',
          'Ist ein Tuple veränderlich, wenn es eine Liste enthält? Die Liste darin <em>kann</em> sich ändern — das Tuple zeigt nur weiter auf sie.',
        ],
        cheat: [['t = (1, 2, 3)', 'anlegen'], ['t[0], t[-1]', 'lesen'], ['a, b, c = t', 'entpacken'], ['t + (4,)', 'neues Tuple bilden'], ['len(t), 2 in t', 'Länge, Enthalten?']],
      },
      en: {
        analogy: 'A <strong>tuple</strong> is a sealed envelope: you can look inside and read the parts, but not swap anything any more. Perfect for things that belong together and should not change — like latitude and longitude.',
        terms: [
          ['immutable', 'Unchangeable: after creation no element can be replaced.'],
          ['Unpacking', '<code>lat, lon = position</code> distributes the elements over variables — the count has to match.'],
          ['Tuple vs. list', 'Round brackets <code>(1, 2)</code> instead of square <code>[1, 2]</code>; tuples are smaller and may be used as dictionary keys.'],
        ],
        example: {
          code: py`position = (48.137, 11.575)
lat, lon = position
print("Latitude:", lat, "Longitude:", lon)
try:
    position[0] = 0
except TypeError as error:
    print("Not allowed:", error)`,
          note: 'The write attempt fails — that is exactly what tuples are for.',
        },
        pitfalls: [
          'A one-element tuple needs a comma: <code>(5,)</code>. Without the comma it is just brackets around the 5.',
          'When unpacking, there must be as many names on the left as elements on the right, otherwise <code>ValueError</code>.',
          'Is a tuple mutable if it contains a list? The list inside <em>can</em> change — the tuple merely keeps pointing to it.',
        ],
        cheat: [['t = (1, 2, 3)', 'create'], ['t[0], t[-1]', 'read'], ['a, b, c = t', 'unpack'], ['t + (4,)', 'build a new tuple'], ['len(t), 2 in t', 'length, contains?']],
      },
    },

    /* ---------------------------------------------------------------- 8 */
    8: {
      de: {
        analogy: 'Ein <strong>Stack</strong> ist ein Tellerstapel: Neue Teller kommen oben drauf, genommen wird auch nur oben. Der zuletzt gestapelte Teller ist der erste, der wieder weggeht — <em>Last In, First Out</em>.',
        terms: [
          ['push', 'Etwas oben auflegen: in Python <code>stapel.append(x)</code>.'],
          ['pop', 'Das oberste Element entnehmen: <code>stapel.pop()</code>.'],
          ['peek', 'Nur nachsehen, was oben liegt, ohne es zu entnehmen: <code>stapel[-1]</code>.'],
        ],
        example: {
          code: py`undo = []
undo.append("Tippe 'Hallo'")
undo.append("Fett")
undo.append("Lösche Wort")
print("Oben:", undo[-1])
while undo:
    print("Rückgängig:", undo.pop())`,
          note: 'Strg+Z holt immer die jüngste Aktion zuerst zurück.',
        },
        pitfalls: [
          '<code>pop()</code> auf einem leeren Stack löst einen <code>IndexError</code> aus. Prüfe vorher <code>if stapel:</code>.',
          'Verwechsle nicht „oben“ mit „Index 0“: Bei einer Liste liegt das oberste Element <em>hinten</em> (<code>[-1]</code>).',
          'Ein Stack gibt nie das unterste Element zuerst her — wer das braucht, will eine Queue.',
        ],
        cheat: [['s = []', 'leerer Stack'], ['s.append(x)', 'push'], ['s.pop()', 'pop'], ['s[-1]', 'peek'], ['if s:', 'nicht leer?']],
      },
      en: {
        analogy: 'A <strong>stack</strong> is a pile of plates: new plates go on top, and plates are taken from the top only. The plate stacked last is the first to leave — <em>Last In, First Out</em>.',
        terms: [
          ['push', 'Put something on top: in Python <code>stack.append(x)</code>.'],
          ['pop', 'Take off the top element: <code>stack.pop()</code>.'],
          ['peek', 'Just look at what is on top without removing it: <code>stack[-1]</code>.'],
        ],
        example: {
          code: py`undo = []
undo.append("Type 'Hello'")
undo.append("Bold")
undo.append("Delete word")
print("Top:", undo[-1])
while undo:
    print("Undo:", undo.pop())`,
          note: 'Ctrl+Z always brings back the most recent action first.',
        },
        pitfalls: [
          '<code>pop()</code> on an empty stack raises an <code>IndexError</code>. Check <code>if stack:</code> first.',
          'Do not confuse “top” with “index 0”: in a list the top element sits at the <em>end</em> (<code>[-1]</code>).',
          'A stack never hands out the bottom element first — if you need that, you want a queue.',
        ],
        cheat: [['s = []', 'empty stack'], ['s.append(x)', 'push'], ['s.pop()', 'pop'], ['s[-1]', 'peek'], ['if s:', 'not empty?']],
      },
    },

    /* ---------------------------------------------------------------- 9 */
    9: {
      de: {
        analogy: 'Eine <strong>Queue</strong> ist die Schlange an der Supermarktkasse: Wer zuerst kommt, wird zuerst bedient. Neue stellen sich hinten an, bedient wird vorn — <em>First In, First Out</em>.',
        terms: [
          ['enqueue', 'Hinten anstellen: <code>schlange.append(x)</code>.'],
          ['dequeue', 'Vorn herausnehmen: <code>schlange.pop(0)</code> oder besser <code>popleft()</code> einer <code>deque</code>.'],
          ['deque', 'Aus <code>collections</code>: eine Warteschlange, die vorn und hinten schnell arbeitet.'],
        ],
        example: {
          code: py`from collections import deque

tickets = deque()
tickets.append("Drucker defekt")
tickets.append("Passwort vergessen")
tickets.append("WLAN langsam")
while tickets:
    print("Bearbeite:", tickets.popleft())`,
          note: 'Die Tickets werden in genau der Reihenfolge abgearbeitet, in der sie kamen.',
        },
        pitfalls: [
          '<code>list.pop(0)</code> funktioniert, ist aber langsam: Alle anderen Elemente müssen nachrücken. Für große Schlangen nimm <code>deque</code>.',
          'Aus einer leeren Queue etwas zu entnehmen löst einen Fehler aus (<code>IndexError</code>) — prüfe vorher, ob noch etwas drin ist.',
          'Stack und Queue unterscheiden sich nur in <em>wo</em> du entnimmst: oben (LIFO) oder vorn (FIFO).',
        ],
        cheat: [['q = deque()', 'leere Queue'], ['q.append(x)', 'hinten anstellen'], ['q.popleft()', 'vorn entnehmen'], ['q[0]', 'wer ist dran?'], ['len(q)', 'Länge']],
      },
      en: {
        analogy: 'A <strong>queue</strong> is the line at the supermarket till: whoever arrives first is served first. Newcomers join at the back, service happens at the front — <em>First In, First Out</em>.',
        terms: [
          ['enqueue', 'Join at the back: <code>queue.append(x)</code>.'],
          ['dequeue', 'Take from the front: <code>queue.pop(0)</code> or better <code>popleft()</code> of a <code>deque</code>.'],
          ['deque', 'From <code>collections</code>: a queue that is fast at both the front and the back.'],
        ],
        example: {
          code: py`from collections import deque

tickets = deque()
tickets.append("Printer broken")
tickets.append("Forgot password")
tickets.append("Wi-Fi slow")
while tickets:
    print("Handling:", tickets.popleft())`,
          note: 'The tickets are handled in exactly the order in which they arrived.',
        },
        pitfalls: [
          '<code>list.pop(0)</code> works but is slow: all other elements have to move up. For big queues use <code>deque</code>.',
          'Taking from an empty queue raises an error (<code>IndexError</code>) — check first whether anything is left.',
          'Stack and queue only differ in <em>where</em> you take from: top (LIFO) or front (FIFO).',
        ],
        cheat: [['q = deque()', 'empty queue'], ['q.append(x)', 'join at the back'], ['q.popleft()', 'take from the front'], ['q[0]', 'who is next?'], ['len(q)', 'length']],
      },
    },

    /* --------------------------------------------------------------- 10 */
    10: {
      de: {
        analogy: 'Eine <strong>Linked List</strong> ist eine Schnitzeljagd: Jeder Zettel (Knoten) enthält einen Hinweis (Wert) und verrät, wo der nächste liegt (<code>next</code>). Einen neuen Zettel einzuschieben heißt nur, zwei Hinweise umzuschreiben — niemand muss umziehen.',
        terms: [
          ['Knoten (Node)', 'Ein kleines Objekt mit einem Wert und einem Zeiger <code>next</code>.'],
          ['Zeiger', 'Ein Verweis auf den nächsten Knoten. Das letzte Element zeigt auf <code>None</code>.'],
          ['Kopf (head)', 'Der erste Knoten. Wer ihn verliert, verliert die ganze Kette.'],
        ],
        example: {
          code: py`class Node:
    def __init__(self, wert, next=None):
        self.wert = wert
        self.next = next

kopf = Node("Song A", Node("Song C"))
neu = Node("Song B", kopf.next)   # zeigt auf C
kopf.next = neu                     # A zeigt jetzt auf B

k = kopf
while k:
    print(k.wert)
    k = k.next`,
          note: 'Eingefügt wird durch Umbiegen zweier Zeiger — nichts wird verschoben.',
        },
        pitfalls: [
          'Reihenfolge beim Einfügen: <strong>erst</strong> den neuen Knoten auf den Nachfolger zeigen lassen, <strong>dann</strong> den Vorgänger umbiegen — sonst geht der Rest der Kette verloren.',
          'Beim Durchlaufen immer auf <code>None</code> prüfen, sonst <code>AttributeError</code> am Ende.',
          'Auf das n-te Element kommst du nicht direkt: Du musst n-mal <code>next</code> folgen.',
        ],
        cheat: [['k = Node(1)', 'Knoten anlegen'], ['k.next = n', 'Zeiger setzen'], ['while k:', 'durchlaufen'], ['k = k.next', 'ein Schritt weiter'], ['k is None', 'Ende erreicht?']],
      },
      en: {
        analogy: 'A <strong>linked list</strong> is a treasure hunt: every note (node) holds a clue (value) and tells you where the next one lies (<code>next</code>). Slipping in a new note only means rewriting two clues — nobody has to move house.',
        terms: [
          ['Node', 'A small object with a value and a <code>next</code> pointer.'],
          ['Pointer', 'A reference to the next node. The last element points to <code>None</code>.'],
          ['Head', 'The first node. Lose it and you lose the whole chain.'],
        ],
        example: {
          code: py`class Node:
    def __init__(self, value, next=None):
        self.value = value
        self.next = next

head = Node("Song A", Node("Song C"))
new = Node("Song B", head.next)   # points to C
head.next = new                   # A now points to B

n = head
while n:
    print(n.value)
    n = n.next`,
          note: 'Insertion works by re-pointing two pointers — nothing is moved.',
        },
        pitfalls: [
          'Order when inserting: <strong>first</strong> let the new node point to the successor, <strong>then</strong> re-point the predecessor — otherwise the rest of the chain is lost.',
          'When walking, always check for <code>None</code>, otherwise an <code>AttributeError</code> at the end.',
          'You cannot jump to the n-th element: you have to follow <code>next</code> n times.',
        ],
        cheat: [['n = Node(1)', 'create a node'], ['n.next = m', 'set a pointer'], ['while n:', 'walk through'], ['n = n.next', 'one step on'], ['n is None', 'reached the end?']],
      },
    },

    /* --------------------------------------------------------------- 11 */
    11: {
      de: {
        analogy: 'Ein <strong>Dictionary</strong> ist ein Wörterbuch oder Telefonbuch: Du suchst nicht Seite 417, sondern den <em>Namen</em> — und bekommst sofort die zugehörige Nummer.',
        terms: [
          ['Schlüssel & Wert', 'Jeder Eintrag ist ein Paar: <code>"Kaffee": 3.5</code>. Schlüssel sind eindeutig.'],
          ['get()', '<code>d.get("x", 0)</code> liefert einen Ersatzwert, falls der Schlüssel fehlt — statt eines Fehlers.'],
          ['Hash-Tabelle', 'Intern wird der Schlüssel zu einer Zahl „gehasht“, die direkt den Speicherplatz verrät. Darum ist der Zugriff so schnell.'],
        ],
        example: {
          code: py`preise = {"Kaffee": 3.5, "Tee": 2.8}
preise["Kuchen"] = 4.2
print(preise["Tee"])
print(preise.get("Saft", "nicht im Sortiment"))
for artikel, preis in preise.items():
    print(f"{artikel}: {preis} Euro")`,
          note: 'Einträge anlegen, nachschlagen, sicher abfragen, durchlaufen.',
        },
        pitfalls: [
          '<code>d["fehlt"]</code> löst einen <code>KeyError</code> aus. Nutze <code>.get()</code> oder prüfe mit <code>in</code>.',
          'Schlüssel müssen unveränderlich sein: Strings, Zahlen und Tuples gehen, Listen nicht.',
          'Beim Durchlaufen mit <code>for</code> bekommst du nur die Schlüssel. Paare gibt es mit <code>.items()</code>.',
        ],
        cheat: [['d = {"a": 1}', 'anlegen'], ['d["b"] = 2', 'hinzufügen / ändern'], ['d.get("x", 0)', 'sicher lesen'], ['"a" in d', 'Schlüssel vorhanden?'], ['d.items(), d.keys()', 'durchlaufen']],
      },
      en: {
        analogy: 'A <strong>dictionary</strong> is a phone book: you do not look for page 417 but for the <em>name</em> — and get the number straight away.',
        terms: [
          ['Key & value', 'Every entry is a pair: <code>"coffee": 3.5</code>. Keys are unique.'],
          ['get()', '<code>d.get("x", 0)</code> returns a fallback value if the key is missing — instead of an error.'],
          ['Hash table', 'Inside, the key is “hashed” into a number that reveals the storage spot directly. That is why access is so fast.'],
        ],
        example: {
          code: py`prices = {"coffee": 3.5, "tea": 2.8}
prices["cake"] = 4.2
print(prices["tea"])
print(prices.get("juice", "not on the menu"))
for item, price in prices.items():
    print(f"{item}: {price} euros")`,
          note: 'Create entries, look them up, query safely, loop through.',
        },
        pitfalls: [
          '<code>d["missing"]</code> raises a <code>KeyError</code>. Use <code>.get()</code> or check with <code>in</code>.',
          'Keys must be immutable: strings, numbers and tuples work, lists do not.',
          'Looping with <code>for</code> gives only the keys. For pairs use <code>.items()</code>.',
        ],
        cheat: [['d = {"a": 1}', 'create'], ['d["b"] = 2', 'add / change'], ['d.get("x", 0)', 'read safely'], ['"a" in d', 'key present?'], ['d.items(), d.keys()', 'loop through']],
      },
    },

    /* --------------------------------------------------------------- 12 */
    12: {
      de: {
        analogy: 'Ein <strong>Set</strong> ist eine Gästeliste: Jeder Name steht nur einmal drauf, die Reihenfolge ist egal, und du kannst zwei Listen vergleichen: Wer steht auf beiden? Wer nur auf einer?',
        terms: [
          ['Keine Duplikate', 'Fügst du etwas doppelt hinzu, bleibt es bei einem Exemplar.'],
          ['Mengenoperationen', 'Schnitt <code>&amp;</code>, Vereinigung <code>|</code>, Differenz <code>-</code> beantworten Fragen wie „Welche IPs sind in A <em>und</em> B?“.'],
          ['Schnelles Enthalten', '<code>x in menge</code> ist sehr schnell — viel schneller als in einer langen Liste.'],
        ],
        example: {
          code: py`server_a = {"10.0.0.1", "10.0.0.2", "10.0.0.3", "10.0.0.2"}
server_b = {"10.0.0.2", "10.0.0.3", "10.0.0.9"}
print(len(server_a), "verschiedene IPs auf A")
print("Auf beiden:", server_a & server_b)
print("Nur auf A:", server_a - server_b)
print("Alle:", server_a | server_b)`,
          note: 'Das doppelte 10.0.0.2 ist automatisch verschwunden.',
        },
        pitfalls: [
          '<code>{}</code> ist ein leeres <strong>Dictionary</strong>, kein Set. Ein leeres Set heißt <code>set()</code>.',
          'Sets sind ungeordnet: Es gibt keinen Index (<code>s[0]</code> geht nicht) und die Ausgabereihenfolge kann sich ändern.',
          '<code>remove(x)</code> wirft einen Fehler, wenn x fehlt. <code>discard(x)</code> bleibt still.',
        ],
        cheat: [['s = {1, 2, 3}', 'anlegen'], ['s.add(4) / s.discard(1)', 'hinzufügen / entfernen'], ['a & b', 'Schnitt'], ['a | b', 'Vereinigung'], ['a - b, a ^ b', 'Differenz, symmetrisch']],
      },
      en: {
        analogy: 'A <strong>set</strong> is a guest list: every name appears only once, order does not matter, and you can compare two lists: who is on both? Who is on only one?',
        terms: [
          ['No duplicates', 'If you add something twice, only one copy remains.'],
          ['Set operations', 'Intersection <code>&amp;</code>, union <code>|</code>, difference <code>-</code> answer questions like “Which IPs are in A <em>and</em> B?”.'],
          ['Fast membership', '<code>x in my_set</code> is very fast — much faster than in a long list.'],
        ],
        example: {
          code: py`server_a = {"10.0.0.1", "10.0.0.2", "10.0.0.3", "10.0.0.2"}
server_b = {"10.0.0.2", "10.0.0.3", "10.0.0.9"}
print(len(server_a), "different IPs on A")
print("On both:", server_a & server_b)
print("Only on A:", server_a - server_b)
print("All:", server_a | server_b)`,
          note: 'The doubled 10.0.0.2 disappeared automatically.',
        },
        pitfalls: [
          '<code>{}</code> is an empty <strong>dictionary</strong>, not a set. An empty set is <code>set()</code>.',
          'Sets are unordered: there is no index (<code>s[0]</code> does not work) and the output order may change.',
          '<code>remove(x)</code> raises an error if x is missing. <code>discard(x)</code> stays silent.',
        ],
        cheat: [['s = {1, 2, 3}', 'create'], ['s.add(4) / s.discard(1)', 'add / remove'], ['a & b', 'intersection'], ['a | b', 'union'], ['a - b, a ^ b', 'difference, symmetric']],
      },
    },

    /* --------------------------------------------------------------- 13 */
    13: {
      de: {
        analogy: 'Russische <strong>Matroschka-Puppen</strong>: Jede enthält eine kleinere, bis die kleinste keine mehr enthält. Du öffnest so lange, bis du die letzte erreichst (<em>Basisfall</em>) — und baust dann Schritt für Schritt das Ergebnis zusammen.',
        terms: [
          ['Basisfall', 'Der Fall, der ohne weiteren Aufruf beantwortet wird. Ohne ihn läuft die Funktion endlos.'],
          ['Rekursiver Aufruf', 'Die Funktion ruft sich selbst auf — für ein <strong>kleineres</strong> Problem.'],
          ['Call Stack', 'Jeder offene Aufruf wartet auf den nächsten. Erst wenn der Basisfall antwortet, laufen die Ergebnisse zurück.'],
        ],
        example: {
          code: py`def fakultaet(n):
    if n <= 1:                 # Basisfall
        return 1
    return n * fakultaet(n - 1)  # kleineres Problem

print(fakultaet(5))            # 5*4*3*2*1`,
          note: '<code>fakultaet(5)</code> wartet auf <code>fakultaet(4)</code> … bis <code>fakultaet(1)</code> die 1 liefert.',
        },
        pitfalls: [
          'Kein Basisfall → <code>RecursionError</code>. Schreibe ihn <strong>zuerst</strong>.',
          'Der Aufruf muss dem Basisfall <em>näher kommen</em> (z. B. <code>n - 1</code>), sonst dreht er sich im Kreis.',
          'Sehr tiefe Rekursion ist langsam und stößt an ein Limit (in Python etwa 1000 Ebenen).',
        ],
        cheat: [['if basisfall: return …', 'Abbruch zuerst'], ['return f(kleiner)', 'rekursiver Aufruf'], ['f(n - 1)', 'Problem verkleinern'], ['sys.getrecursionlimit()', 'Tiefenlimit'], ['Schleife statt Rekursion?', 'oft einfacher']],
      },
      en: {
        analogy: 'Russian <strong>nesting dolls</strong>: each holds a smaller one, until the smallest holds none. You keep opening until you reach the last one (<em>base case</em>) — and then assemble the result step by step.',
        terms: [
          ['Base case', 'The case answered without another call. Without it the function runs forever.'],
          ['Recursive call', 'The function calls itself — for a <strong>smaller</strong> problem.'],
          ['Call stack', 'Every open call waits for the next. Only when the base case answers do the results run back.'],
        ],
        example: {
          code: py`def factorial(n):
    if n <= 1:                   # base case
        return 1
    return n * factorial(n - 1)  # smaller problem

print(factorial(5))              # 5*4*3*2*1`,
          note: '<code>factorial(5)</code> waits for <code>factorial(4)</code> … until <code>factorial(1)</code> returns 1.',
        },
        pitfalls: [
          'No base case → <code>RecursionError</code>. Write it <strong>first</strong>.',
          'The call must get <em>closer</em> to the base case (e.g. <code>n - 1</code>), otherwise it goes round in circles.',
          'Very deep recursion is slow and hits a limit (about 1000 levels in Python).',
        ],
        cheat: [['if base_case: return …', 'stop first'], ['return f(smaller)', 'recursive call'], ['f(n - 1)', 'shrink the problem'], ['sys.getrecursionlimit()', 'depth limit'], ['loop instead of recursion?', 'often simpler']],
      },
    },

    /* --------------------------------------------------------------- 14 */
    14: {
      de: {
        analogy: 'Karten sortieren: <strong>Bubble Sort</strong> ist, immer wieder die Nachbarkarten zu vergleichen und zu tauschen, bis nichts mehr getauscht wird. <strong>Merge Sort</strong> teilt den Stapel, sortiert die Hälften getrennt und mischt sie zu einem sortierten Stapel zusammen.',
        terms: [
          ['Bubble Sort', 'Vergleicht Nachbarn und tauscht. Einfach, aber langsam: O(n²) — die Arbeit wächst im Quadrat: doppelt so viele Zahlen, vierfache Arbeit.'],
          ['Merge Sort', 'Teilen, rekursiv sortieren, mischen. Schnell: O(n log n) — doppelt so viele Zahlen, nur etwas mehr als doppelte Arbeit.'],
          ['key / sorted()', 'In der Praxis nutzt du <code>sorted(liste, key=…)</code> — die eigenen Algorithmen zeigen, <em>wie</em> das darunter funktioniert.'],
        ],
        example: {
          code: py`def bubble_sort(liste):
    liste = list(liste)
    for runde in range(len(liste) - 1):
        getauscht = False
        for i in range(len(liste) - 1 - runde):
            if liste[i] > liste[i + 1]:
                liste[i], liste[i + 1] = liste[i + 1], liste[i]
                getauscht = True
        if not getauscht:
            break
    return liste

print(bubble_sort([5, 2, 9, 1, 7]))`,
          note: 'Der Tausch <code>a, b = b, a</code> braucht keine Hilfsvariable. Ohne Tausch in einer Runde ist die Liste fertig.',
        },
        pitfalls: [
          'Beim Tauschen nicht zwei Zuweisungen hintereinander schreiben: <code>a = b; b = a</code> überschreibt den alten Wert von a.',
          'Die innere Schleife muss <code>len - 1 - runde</code> laufen, sonst vergleichst du über das Ende hinaus (<code>IndexError</code>).',
          'Eine leere oder einelementige Liste ist bereits sortiert — prüfe das als Randfall.',
        ],
        cheat: [['a, b = b, a', 'tauschen'], ['sorted(L), L.sort()', 'neue / in-place'], ['sorted(L, key=len)', 'nach Merkmal'], ['sorted(L, reverse=True)', 'absteigend'], ['L[:m], L[m:]', 'halbieren']],
      },
      en: {
        analogy: 'Sorting cards: <strong>bubble sort</strong> means comparing neighbouring cards and swapping them again and again until nothing is swapped any more. <strong>Merge sort</strong> splits the pile, sorts the halves separately and merges them into one sorted pile.',
        terms: [
          ['Bubble sort', 'Compares neighbours and swaps. Simple but slow: O(n²) — the work grows quadratically: twice as many numbers, four times the work.'],
          ['Merge sort', 'Split, sort recursively, merge. Fast: O(n log n) — twice as many numbers, only a bit more than twice the work.'],
          ['key / sorted()', 'In practice you use <code>sorted(items, key=…)</code> — writing the algorithms yourself shows <em>how</em> that works underneath.'],
        ],
        example: {
          code: py`def bubble_sort(items):
    items = list(items)
    for rnd in range(len(items) - 1):
        swapped = False
        for i in range(len(items) - 1 - rnd):
            if items[i] > items[i + 1]:
                items[i], items[i + 1] = items[i + 1], items[i]
                swapped = True
        if not swapped:
            break
    return items

print(bubble_sort([5, 2, 9, 1, 7]))`,
          note: 'The swap <code>a, b = b, a</code> needs no helper variable. A round without any swap means the list is done.',
        },
        pitfalls: [
          'When swapping, do not write two assignments in a row: <code>a = b; b = a</code> overwrites the old value of a.',
          'The inner loop has to run to <code>len - 1 - round</code>, otherwise you compare past the end (<code>IndexError</code>).',
          'An empty or one-element list is already sorted — check that as an edge case.',
        ],
        cheat: [['a, b = b, a', 'swap'], ['sorted(L), L.sort()', 'new / in place'], ['sorted(L, key=len)', 'by property'], ['sorted(L, reverse=True)', 'descending'], ['L[:m], L[m:]', 'halve']],
      },
    },

    /* --------------------------------------------------------------- 15 */
    15: {
      de: {
        analogy: 'Das <strong>Ratespiel „Zahl zwischen 1 und 100“</strong>: Bei jeder Antwort „höher“ oder „niedriger“ fällt die Hälfte der Möglichkeiten weg. Genau so führt dich der Suchbaum an jedem Knoten nach links (kleiner) oder rechts (größer).',
        terms: [
          ['Knoten', 'Hat einen Wert, einen linken und einen rechten Teilbaum (oder <code>None</code>).'],
          ['BST-Regel', 'Alles im linken Teilbaum ist <strong>kleiner</strong>, alles im rechten <strong>größer</strong> als der Knoten.'],
          ['Suchen & Einfügen', 'Beides folgt demselben Weg von der Wurzel abwärts — Suchen endet bei einem Treffer oder <code>None</code>, Einfügen setzt dort einen neuen Knoten.'],
        ],
        example: {
          code: py`class Knoten:
    def __init__(self, wert):
        self.wert, self.links, self.rechts = wert, None, None

def einfuegen(k, wert):
    if k is None:
        return Knoten(wert)
    if wert < k.wert:
        k.links = einfuegen(k.links, wert)
    elif wert > k.wert:
        k.rechts = einfuegen(k.rechts, wert)
    return k

def suche(k, wert):
    if k is None:
        return False
    if wert == k.wert:
        return True
    return suche(k.links if wert < k.wert else k.rechts, wert)

wurzel = None
for z in [50, 30, 70, 20, 40]:
    wurzel = einfuegen(wurzel, z)
print(suche(wurzel, 40), suche(wurzel, 45))`,
          note: 'Pro Knoten wird die Hälfte der Kandidaten ausgeschlossen.',
        },
        pitfalls: [
          'Beim rekursiven Einfügen den Rückgabewert zuweisen: <code>k.links = einfuegen(k.links, wert)</code> — sonst bleibt der neue Knoten unverbunden.',
          'Ein BST ist nur schnell, wenn er einigermaßen ausgeglichen ist. Wer sortierte Werte einfügt, baut eine lange „Kette“.',
          'Duplikate müssen vorher festgelegt werden: ignorieren, zählen oder in einen Teilbaum legen?',
        ],
        cheat: [['k.links, k.rechts', 'Kinder'], ['wert < k.wert', 'nach links'], ['wert > k.wert', 'nach rechts'], ['k is None', 'Pfad endet / Platz frei'], ['inorder(k)', 'liefert sortierte Werte']],
      },
      en: {
        analogy: 'The <strong>guessing game “a number between 1 and 100”</strong>: with each answer “higher” or “lower” half of the possibilities drop out. That is exactly how the search tree leads you left (smaller) or right (larger) at every node.',
        terms: [
          ['Node', 'Has a value, a left and a right sub-tree (or <code>None</code>).'],
          ['BST rule', 'Everything in the left sub-tree is <strong>smaller</strong>, everything in the right one <strong>larger</strong> than the node.'],
          ['Search & insert', 'Both follow the same path from the root downwards — a search ends at a hit or <code>None</code>, an insert places a new node there.'],
        ],
        example: {
          code: py`class Node:
    def __init__(self, value):
        self.value, self.left, self.right = value, None, None

def insert(node, value):
    if node is None:
        return Node(value)
    if value < node.value:
        node.left = insert(node.left, value)
    elif value > node.value:
        node.right = insert(node.right, value)
    return node

def search(node, value):
    if node is None:
        return False
    if value == node.value:
        return True
    return search(node.left if value < node.value else node.right, value)

root = None
for n in [50, 30, 70, 20, 40]:
    root = insert(root, n)
print(search(root, 40), search(root, 45))`,
          note: 'At every node half of the candidates are ruled out.',
        },
        pitfalls: [
          'When inserting recursively, assign the return value: <code>node.left = insert(node.left, value)</code> — otherwise the new node stays unconnected.',
          'A BST is only fast if it is reasonably balanced. Inserting sorted values builds a long “chain”.',
          'Decide on duplicates beforehand: ignore, count or put them in a sub-tree?',
        ],
        cheat: [['n.left, n.right', 'children'], ['value < n.value', 'go left'], ['value > n.value', 'go right'], ['n is None', 'path ends / free spot'], ['inorder(n)', 'yields sorted values']],
      },
    },

    /* --------------------------------------------------------------- 16 */
    16: {
      de: {
        analogy: 'Du gehst durch ein Haus mit Zimmern, die wieder Zimmer enthalten. Ob du <strong>beim Betreten</strong> ein Foto machst (Preorder), <strong>zwischen</strong> linkem und rechtem Zimmer (Inorder) oder <strong>beim Verlassen</strong> (Postorder), entscheidet allein die Reihenfolge deiner Fotos.',
        terms: [
          ['Preorder', 'Wurzel → links → rechts. Gut, um einen Baum zu kopieren oder wie ein Inhaltsverzeichnis auszugeben.'],
          ['Inorder', 'Links → Wurzel → rechts. Bei einem Suchbaum ergibt das die Werte <strong>sortiert</strong>.'],
          ['Postorder', 'Links → rechts → Wurzel. Kinder zuerst — ideal zum Aufräumen und Löschen.'],
        ],
        example: {
          code: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert, self.links, self.rechts = wert, links, rechts

def preorder(k):
    return [k.wert] + preorder(k.links) + preorder(k.rechts) if k else []

def inorder(k):
    return inorder(k.links) + [k.wert] + inorder(k.rechts) if k else []

def postorder(k):
    return postorder(k.links) + postorder(k.rechts) + [k.wert] if k else []

home = Knoten("home", Knoten("src", Knoten("app"), Knoten("lib")), Knoten("docs"))
print("pre :", preorder(home))
print("in  :", inorder(home))
print("post:", postorder(home))`,
          note: 'Drei fast identische Funktionen — nur die Position von <code>[k.wert]</code> unterscheidet sie.',
        },
        pitfalls: [
          'Den Fall <code>None</code> (leerer Teilbaum) immer zuerst abfangen, sonst <code>AttributeError</code>.',
          'Die Reihenfolge links → rechts bleibt immer gleich; nur der Zeitpunkt des Knotens ändert sich.',
          'Inorder liefert nur bei einem <em>Suchbaum</em> sortierte Werte, nicht bei jedem beliebigen Baum.',
        ],
        cheat: [['[k.wert] + pre(l) + pre(r)', 'Preorder'], ['in(l) + [k.wert] + in(r)', 'Inorder'], ['post(l) + post(r) + [k.wert]', 'Postorder'], ['if k is None: return []', 'Basisfall'], ['Löschen → Postorder', 'Kinder vor Eltern']],
      },
      en: {
        analogy: 'You walk through a house whose rooms contain further rooms. Whether you take a photo <strong>when entering</strong> (preorder), <strong>between</strong> the left and right room (inorder) or <strong>when leaving</strong> (postorder) only decides the order of your photos.',
        terms: [
          ['Preorder', 'Root → left → right. Good for copying a tree or printing it like a table of contents.'],
          ['Inorder', 'Left → root → right. For a search tree this yields the values <strong>sorted</strong>.'],
          ['Postorder', 'Left → right → root. Children first — ideal for cleaning up and deleting.'],
        ],
        example: {
          code: py`class Node:
    def __init__(self, value, left=None, right=None):
        self.value, self.left, self.right = value, left, right

def preorder(n):
    return [n.value] + preorder(n.left) + preorder(n.right) if n else []

def inorder(n):
    return inorder(n.left) + [n.value] + inorder(n.right) if n else []

def postorder(n):
    return postorder(n.left) + postorder(n.right) + [n.value] if n else []

home = Node("home", Node("src", Node("app"), Node("lib")), Node("docs"))
print("pre :", preorder(home))
print("in  :", inorder(home))
print("post:", postorder(home))`,
          note: 'Three nearly identical functions — only the position of <code>[n.value]</code> differs.',
        },
        pitfalls: [
          'Always handle the <code>None</code> case (empty sub-tree) first, otherwise an <code>AttributeError</code>.',
          'The order left → right always stays the same; only the moment of the node changes.',
          'Inorder only yields sorted values for a <em>search tree</em>, not for just any tree.',
        ],
        cheat: [['[n.value] + pre(l) + pre(r)', 'preorder'], ['in(l) + [n.value] + in(r)', 'inorder'], ['post(l) + post(r) + [n.value]', 'postorder'], ['if n is None: return []', 'base case'], ['deleting → postorder', 'children before parents']],
      },
    },

    /* --------------------------------------------------------------- 17 */
    17: {
      de: {
        analogy: 'Ein <strong>Graph</strong> ist ein Liniennetzplan: Haltestellen (Knoten) sind durch Strecken (Kanten) verbunden. Es gibt keinen „Anfang“, und man kann im Kreis fahren. <strong>BFS</strong> fragt: „Was erreiche ich mit 1 Umstieg, dann mit 2 …?“ <strong>DFS</strong> fährt erst einer Linie bis zum Ende nach.',
        terms: [
          ['Adjazenzliste', 'Ein Dictionary: Haltestelle → Liste der Nachbarn. <code>netz["Dom"] = ["Markt", "Zoo"]</code>.'],
          ['BFS (Breitensuche)', 'Arbeitet mit einer <strong>Warteschlange</strong>, besucht Ebene für Ebene und findet die kürzeste Route.'],
          ['DFS (Tiefensuche)', 'Arbeitet mit einem <strong>Stapel</strong> (oder Rekursion), geht erst tief und kehrt dann zurück. Findet eine Route, nicht unbedingt die kürzeste.'],
        ],
        example: {
          code: py`from collections import deque

netz = {
    "Hbf": ["Markt", "Uni"],
    "Markt": ["Hbf", "Dom"],
    "Uni": ["Hbf", "Dom"],
    "Dom": ["Markt", "Uni", "Zoo"],
    "Zoo": ["Dom"],
}

def route(start, ziel):
    warte = deque([[start]])
    besucht = {start}
    while warte:
        weg = warte.popleft()
        if weg[-1] == ziel:
            return weg
        for n in netz[weg[-1]]:
            if n not in besucht:
                besucht.add(n)
                warte.append(weg + [n])

print(route("Hbf", "Zoo"))`,
          note: 'Die Warteschlange enthält ganze Wege; <code>besucht</code> verhindert Endlosschleifen im Kreis.',
        },
        pitfalls: [
          'Ohne <code>besucht</code>-Menge läuft die Suche bei einem Kreis endlos.',
          'Ungerichtete Verbindungen müssen in <strong>beide</strong> Richtungen eingetragen werden.',
          'Unbekannte Knoten: <code>netz.get(x, [])</code> statt <code>netz[x]</code>, sonst <code>KeyError</code>.',
        ],
        cheat: [['g = {"A": ["B"]}', 'Adjazenzliste'], ['g.get(x, [])', 'Nachbarn, sicher'], ['deque / popleft()', 'BFS-Schlange'], ['stack / pop()', 'DFS-Stapel'], ['besucht = set()', 'Kreise vermeiden']],
      },
      en: {
        analogy: 'A <strong>graph</strong> is a transit map: stops (nodes) are linked by lines (edges). There is no “beginning”, and you can ride in circles. <strong>BFS</strong> asks: “What can I reach with 1 change, then with 2 …?” <strong>DFS</strong> first follows one line to its very end.',
        terms: [
          ['Adjacency list', 'A dictionary: stop → list of neighbours. <code>network["Dom"] = ["Market", "Zoo"]</code>.'],
          ['BFS (breadth-first)', 'Works with a <strong>queue</strong>, visits level by level and finds the shortest route.'],
          ['DFS (depth-first)', 'Works with a <strong>stack</strong> (or recursion), goes deep first and then returns. Finds a route, not necessarily the shortest.'],
        ],
        example: {
          code: py`from collections import deque

network = {
    "Central": ["Market", "Uni"],
    "Market": ["Central", "Dom"],
    "Uni": ["Central", "Dom"],
    "Dom": ["Market", "Uni", "Zoo"],
    "Zoo": ["Dom"],
}

def route(start, goal):
    waiting = deque([[start]])
    seen = {start}
    while waiting:
        path = waiting.popleft()
        if path[-1] == goal:
            return path
        for n in network[path[-1]]:
            if n not in seen:
                seen.add(n)
                waiting.append(path + [n])

print(route("Central", "Zoo"))`,
          note: 'The queue holds whole paths; <code>seen</code> prevents endless loops in a cycle.',
        },
        pitfalls: [
          'Without a <code>seen</code> set the search runs forever on a cycle.',
          'Undirected connections have to be entered in <strong>both</strong> directions.',
          'Unknown nodes: <code>network.get(x, [])</code> instead of <code>network[x]</code>, otherwise a <code>KeyError</code>.',
        ],
        cheat: [['g = {"A": ["B"]}', 'adjacency list'], ['g.get(x, [])', 'neighbours, safely'], ['deque / popleft()', 'BFS queue'], ['stack / pop()', 'DFS stack'], ['seen = set()', 'avoid cycles']],
      },
    },

    /* --------------------------------------------------------------- 18 */
    18: {
      de: {
        analogy: 'Eine <strong>Klasse</strong> ist der Bauplan für ein Haus, ein <strong>Objekt</strong> das tatsächlich gebaute Haus. Aus einem Plan entstehen viele Häuser, jedes mit eigener Wandfarbe (Attribute). Mit <strong>Vererbung</strong> baust du auf einem Plan einen erweiterten auf, z. B. „Haus mit Garage“.',
        terms: [
          ['__init__ & self', '<code>__init__</code> richtet ein neues Objekt ein. <code>self</code> ist das Objekt selbst — damit greifst du auf <em>seine</em> Attribute zu.'],
          ['Vererbung', '<code>class SmartLight(SmartDevice)</code> übernimmt alles der Basisklasse; <code>super().__init__(…)</code> ruft deren Einrichtung auf.'],
          ['Polymorphismus', 'Dieselbe Methode (<code>schalte_ein()</code>) wirkt je nach Klasse anders — du musst nicht nachfragen, welche Klasse es ist.'],
        ],
        example: {
          code: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

class SmartLight(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.helligkeit = 0

    def schalte_ein(self):
        super().schalte_ein()
        self.helligkeit = 100

geraete = [SmartDevice("Steckdose"), SmartLight("Wohnzimmer")]
for g in geraete:
    g.schalte_ein()
    print(g.name, g.ist_an)
print(geraete[1].helligkeit)`,
          note: 'Die Schleife ruft überall <code>schalte_ein()</code> auf — die Lampe tut zusätzlich etwas Eigenes.',
        },
        pitfalls: [
          'Jede Methode braucht <code>self</code> als ersten Parameter, und Attribute werden mit <code>self.name = …</code> gesetzt (sonst entsteht nur eine lokale Variable).',
          'In der Unterklasse <code>super().__init__(…)</code> nicht vergessen, sonst fehlen die Attribute der Basisklasse.',
          'Fehlermeldung <code>takes 0 positional arguments but 1 was given</code> = bei der Methode fehlt <code>self</code>.',
        ],
        cheat: [['class A:', 'Klasse'], ['def __init__(self, x):', 'Konstruktor'], ['self.x = x', 'Attribut setzen'], ['class B(A):', 'Vererbung'], ['super().__init__(x)', 'Basisklasse einrichten']],
      },
      en: {
        analogy: 'A <strong>class</strong> is the blueprint for a house, an <strong>object</strong> the house actually built. Many houses come from one plan, each with its own wall colour (attributes). With <strong>inheritance</strong> you build an extended plan on top of one, e.g. “house with garage”.',
        terms: [
          ['__init__ & self', '<code>__init__</code> sets up a new object. <code>self</code> is the object itself — it lets you reach <em>its</em> attributes.'],
          ['Inheritance', '<code>class SmartLight(SmartDevice)</code> takes over everything from the base class; <code>super().__init__(…)</code> runs its set-up.'],
          ['Polymorphism', 'The same method (<code>turn_on()</code>) acts differently depending on the class — you do not have to ask which class it is.'],
        ],
        example: {
          code: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.is_on = False

    def turn_on(self):
        self.is_on = True

class SmartLight(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.brightness = 0

    def turn_on(self):
        super().turn_on()
        self.brightness = 100

devices = [SmartDevice("Socket"), SmartLight("Living room")]
for d in devices:
    d.turn_on()
    print(d.name, d.is_on)
print(devices[1].brightness)`,
          note: 'The loop calls <code>turn_on()</code> everywhere — the lamp additionally does something of its own.',
        },
        pitfalls: [
          'Every method needs <code>self</code> as its first parameter, and attributes are set with <code>self.name = …</code> (otherwise you only create a local variable).',
          'In the subclass do not forget <code>super().__init__(…)</code>, otherwise the base-class attributes are missing.',
          'The error <code>takes 0 positional arguments but 1 was given</code> = the method is missing <code>self</code>.',
        ],
        cheat: [['class A:', 'class'], ['def __init__(self, x):', 'constructor'], ['self.x = x', 'set an attribute'], ['class B(A):', 'inheritance'], ['super().__init__(x)', 'set up the base class']],
      },
    },
  };
})();
