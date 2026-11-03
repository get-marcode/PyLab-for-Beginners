/* ==========================================================================
   content.js — Datenstruktur des Lehrplans
   --------------------------------------------------------------------------
   Reine Daten, keine Logik. Wird von app.js (Routing, Training) und
   visuals.js (Szenen) gelesen.

   Topic:
     id, slug, title, group, icon, status ('dashboard' | 'ready' | 'soon')
     scenario      – Alltagskontext des Themas
     lead          – Einleitungstext (HTML)
     scenes[]      – Modus A "Entdecken" ({ id, title, blurb, visual, config })
     tasks[]       – Modus B "Trainieren" (genau 5, steigende Schwierigkeit)
     sandbox       – Modus C "Sandbox" (Startcode)

   Task:
     id, level, title, scenario, goal (HTML), hint, starter, solution,
     tests         – verdeckte Python-asserts. Im Namensraum stehen zusätzlich:
                     _stdout (alles, was print() ausgegeben hat)
                     _source (der Quelltext der Lösung)
   ========================================================================== */

const py = String.raw; // Python-Code ohne Escape-Probleme

const LEVELS = ['Init', 'Update', 'Debugging', 'Edge Case', 'Algorithmus'];

const GROUPS = [
  { id: 'start',      label: 'Start' },
  { id: 'grundlagen', label: 'Grundlagen' },
  { id: 'struktur',   label: 'Datenstrukturen' },
  { id: 'algo',       label: 'Algorithmen' },
  { id: 'baum',       label: 'Bäume & Graphen' },
  { id: 'oop',        label: 'Objektorientierung' },
];

/** Platzhalter für Themen, die noch nicht ausprogrammiert sind. */
const soon = (id, slug, title, group, icon) => ({
  id, slug, title, group, icon,
  status: 'soon',
  scenario: null,
  lead: '',
  scenes: [],
  tasks: [],
  sandbox: '',
});

const CONTENT = {
  version: 1,
  levels: LEVELS,
  groups: GROUPS,

  topics: [
    /* ------------------------------------------------------------------ 1 */
    {
      id: 1, slug: 'dashboard', title: 'Dashboard & Lernfortschritt',
      group: 'start', icon: '◈', status: 'dashboard',
      scenario: null, lead: '', scenes: [], tasks: [], sandbox: '',
    },

    /* ------------------------------------------------------------------ 2 */
    {
      id: 2, slug: 'basics', title: 'Python Basics',
      subtitle: 'Variablen, Datentypen, Print',
      group: 'grundlagen', icon: 'x=', status: 'ready',
      scenario: 'Kasse & Kundenprofil',
      lead: 'Du baust das Herz einer Kaffeehaus-Kasse: Preise, Mengen und Kundenprofile landen in <strong>Variablen</strong>, Python rechnet damit und <code>print()</code> druckt den Bon.',

      scenes: [
        {
          id: 'speicher',
          title: 'Kassen-Speicher',
          blurb: 'Jede Zeile legt Werte in beschriftete Speicherfächer. Klicke dich Schritt für Schritt durch einen Bon.',
          visual: 'stepper',
          config: {
            lines: [
              'artikel = "Kaffee"',
              'preis = 3.5',
              'menge = 2',
              'summe = preis * menge',
              'summe = summe + 0.5   # Pfand',
              'print(f"{menge}x {artikel}: {summe:.2f} €")',
            ],
            steps: [
              { line: 0, set: { artikel: ['"Kaffee"', 'str'] },
                note: 'Text steht in Anführungszeichen — Python merkt sich den Typ <strong>str</strong>.' },
              { line: 1, set: { preis: ['3.5', 'float'] },
                note: 'Eine Zahl mit Punkt ist eine Kommazahl: <strong>float</strong>. (Python nutzt den Punkt, kein Komma.)' },
              { line: 2, set: { menge: ['2', 'int'] },
                note: 'Eine Zahl ohne Punkt ist eine ganze Zahl: <strong>int</strong>.' },
              { line: 3, set: { summe: ['7.0', 'float'] },
                note: 'Rechts wird zuerst gerechnet: <code>3.5 * 2</code> = 7.0. Float mal int ergibt wieder einen <strong>float</strong>.' },
              { line: 4, set: { summe: ['7.5', 'float'] },
                note: 'Das Fach <code>summe</code> bekommt einen <strong>neuen Wert</strong>. Der alte ist weg — Variablen sind Etiketten, keine Tresore.' },
              { line: 5, out: '2x Kaffee: 7.50 €',
                note: 'Im f-String werden <code>{…}</code> durch Werte ersetzt. <code>:.2f</code> heißt: zwei Nachkommastellen.' },
            ],
          },
        },
        {
          id: 'typen',
          title: 'Typen-Labor',
          blurb: 'Wähle einen Wert und wende eine Umwandlung an. Manche Umwandlungen scheitern — und das ist gut so.',
          visual: 'typeLab',
          config: {
            values: [
              { label: '"19.99"', kind: 'str',   raw: '19.99' },
              { label: '19.99',   kind: 'float', raw: 19.99 },
              { label: '3',       kind: 'int',   raw: 3 },
              { label: 'True',    kind: 'bool',  raw: true },
              { label: '"Mia"',   kind: 'str',   raw: 'Mia' },
              { label: '""',      kind: 'str',   raw: '' },
            ],
            funcs: ['int', 'float', 'str', 'bool', 'type'],
          },
        },
        {
          id: 'bon',
          title: 'Beleg-Drucker',
          blurb: 'Ändere Artikel, Preis und Menge — der f-String formatiert den Kassenbon live.',
          visual: 'receipt',
          config: { artikel: 'Kaffee', preis: 3.5, menge: 2, pfand: 0.25 },
        },
      ],

      tasks: [
        {
          id: 'b1', level: 'Init', title: 'Kassenbon-Kopf',
          scenario: 'Das Kaffeehaus öffnet. Für die erste Position auf dem Bon legst du die Daten im Speicher der Kasse ab.',
          goal: 'Lege vier Variablen an: <code>artikel</code> = <code>"Filterkaffee"</code> (Text), <code>preis</code> = <code>4.5</code> (Kommazahl), <code>menge</code> = <code>3</code> (ganze Zahl) und <code>summe</code> — die du mit <code>preis * menge</code> <em>berechnest</em>, nicht von Hand eintippst.',
          hint: 'Text braucht Anführungszeichen, Zahlen nicht. Eine Zeile pro Variable: <code>name = wert</code>.',
          starter: py`# Position 1 auf dem Kassenbon

`,
          solution: py`artikel = "Filterkaffee"
preis = 4.5
menge = 3
summe = preis * menge
`,
          tests: py`
assert isinstance(artikel, str) and artikel == "Filterkaffee", "artikel muss der Text 'Filterkaffee' sein."
assert type(preis) is float and preis == 4.5, "preis muss die Kommazahl 4.5 sein (Typ float)."
assert type(menge) is int and menge == 3, "menge muss die ganze Zahl 3 sein (Typ int)."
assert "*" in _source, "Berechne summe mit preis * menge, statt den Wert selbst einzutippen."
assert abs(summe - 13.5) < 1e-9, "summe stimmt nicht. Multipliziere preis mit menge."
`,
        },
        {
          id: 'b2', level: 'Update', title: 'Pfand & Treuerabatt',
          scenario: 'Ein Stammkunde bringt Pfandflaschen zurück und besitzt eine Treuekarte. Die Kasse muss die Summe zweimal anpassen.',
          goal: 'Die Variable <code>summe</code> enthält den Warenwert. Ziehe zuerst das Pfand für alle <code>flaschen</code> ab (<code>pfand</code> je Flasche), danach gewährst du <strong>10 % Treuerabatt</strong> auf den Rest. Verändere dabei <code>summe</code> selbst — keine neue Variable.',
          hint: 'Mit <code>summe -= …</code> und <code>summe *= …</code> aktualisierst du eine Variable direkt. 10 % Rabatt heißt: mit 0.9 multiplizieren.',
          starter: py`summe = 20.0     # Warenwert in Euro
flaschen = 4     # zurückgegebene Pfandflaschen
pfand = 0.25     # Pfand pro Flasche

# 1) Pfand abziehen
# 2) 10 % Treuerabatt abziehen
`,
          solution: py`summe = 20.0
flaschen = 4
pfand = 0.25

summe -= flaschen * pfand
summe *= 0.9
`,
          tests: py`
assert flaschen == 4 and pfand == 0.25, "Lass flaschen und pfand unverändert."
assert abs(summe - 17.1) < 1e-9, f"summe ist {summe} — das passt nicht. Erst Pfand abziehen, dann 10 % Rabatt auf den Rest."
`,
        },
        {
          id: 'b3', level: 'Debugging', title: 'Profil-Anzeige',
          scenario: 'Im Kundenprofil stürzt die Anzeige ab. Ein Kollege hat Text und Zahlen vermischt — Python meckert mit einem TypeError.',
          goal: 'Repariere das Skript, sodass es genau diese zwei Zeilen ausgibt: <code>Profil: Mia, 29 Jahre</code> und <code>Punkte: 135</code>. Die Treuepunkte (<code>"120"</code>) kommen als Text aus der Datenbank, dazu kommen 15 Punkte.',
          hint: 'Text und Zahl lassen sich nicht mit <code>+</code> verbinden. Wandle mit <code>str(…)</code> in Text bzw. <code>int(…)</code> in eine Zahl um.',
          starter: py`vorname = "Mia"
alter = 29
treuepunkte = "120"

print("Profil: " + vorname + ", " + alter + " Jahre")

neue_punkte = treuepunkte + 15
print("Punkte: " + neue_punkte)
`,
          solution: py`vorname = "Mia"
alter = 29
treuepunkte = "120"

print("Profil: " + vorname + ", " + str(alter) + " Jahre")

neue_punkte = int(treuepunkte) + 15
print("Punkte: " + str(neue_punkte))
`,
          tests: py`
assert "Profil: Mia, 29 Jahre" in _stdout, "Die Profilzeile stimmt noch nicht — prüfe den Text Zeichen für Zeichen."
assert "Punkte: 135" in _stdout, "Die Punktezeile stimmt noch nicht. 120 + 15 = ?"
assert int(neue_punkte) == 135, "neue_punkte muss 135 sein."
`,
        },
        {
          id: 'b4', level: 'Edge Case', title: 'Preis aus Tastatureingabe',
          scenario: 'Kassierer tippen Preise chaotisch ein: "4,99", " 12.5 €", "€ 0,5" — oder gar nichts. Die Kasse darf trotzdem nicht abstürzen.',
          goal: 'Schreibe die Funktion <code>preis_aus_text(text)</code>. Sie liefert den Preis als <code>float</code>: Leerzeichen und das €-Zeichen entfernen, Komma als Dezimaltrenner akzeptieren. Bei leerem Text (oder nur Leerzeichen) ist der Preis <code>0.0</code>.',
          hint: 'Methoden für Text: <code>.strip()</code>, <code>.replace(alt, neu)</code>. Prüfe den Leer-Fall, bevor du <code>float()</code> aufrufst.',
          starter: py`def preis_aus_text(text):
    # Beispiele: "4,99"   " 12.5 €"   "€ 0,5"   ""
    pass
`,
          solution: py`def preis_aus_text(text):
    text = text.replace("€", "").replace(",", ".").strip()
    if text == "":
        return 0.0
    return float(text)
`,
          tests: py`
assert preis_aus_text("4,99") == 4.99, "Komma als Dezimaltrenner wird noch nicht verstanden."
assert preis_aus_text(" 12.5 €") == 12.5, "Leerzeichen und € müssen entfernt werden."
assert preis_aus_text("€ 0,5") == 0.5, "€ am Anfang und Komma zusammen."
assert preis_aus_text("10,00 €") == 10.0
assert type(preis_aus_text("3")) is float, "Das Ergebnis muss immer ein float sein."
assert preis_aus_text("") == 0.0, "Leere Eingabe soll 0.0 ergeben."
assert preis_aus_text("   ") == 0.0, "Nur Leerzeichen zählen als leere Eingabe."
`,
        },
        {
          id: 'b5', level: 'Algorithmus', title: 'Wechselgeld-Stückelung',
          scenario: 'Die Kasse muss dem Kunden Wechselgeld herausgeben — mit möglichst wenigen Münzen. Beträge sind in Cent angegeben und immer durch 5 teilbar.',
          goal: 'Schreibe <code>wechselgeld(cent)</code>. Sie gibt ein Tuple mit sechs Anzahlen zurück, in dieser Reihenfolge: <strong>2 €, 1 €, 50 ct, 20 ct, 10 ct, 5 ct</strong>. Beispiel: <code>385</code> ct → <code>(1, 1, 1, 1, 1, 1)</code>. Greife immer zuerst zur größten passenden Münze.',
          hint: '<code>divmod(rest, münze)</code> liefert Anzahl <em>und</em> Rest in einem Schritt. Arbeite dich von 200 ct bis 5 ct durch.',
          starter: py`def wechselgeld(cent):
    # Rückgabe: (zwei_euro, ein_euro, fuenfzig, zwanzig, zehn, fuenf)
    pass
`,
          solution: py`def wechselgeld(cent):
    zwei, rest = divmod(cent, 200)
    eins, rest = divmod(rest, 100)
    fuenfzig, rest = divmod(rest, 50)
    zwanzig, rest = divmod(rest, 20)
    zehn, rest = divmod(rest, 10)
    fuenf, rest = divmod(rest, 5)
    return (zwei, eins, fuenfzig, zwanzig, zehn, fuenf)
`,
          tests: py`
assert tuple(wechselgeld(385)) == (1, 1, 1, 1, 1, 1), "Für 385 ct passt das Ergebnis nicht."
assert tuple(wechselgeld(0)) == (0, 0, 0, 0, 0, 0), "Bei 0 ct gibt es keine Münzen."
assert tuple(wechselgeld(1000)) == (5, 0, 0, 0, 0, 0), "1000 ct sind fünf 2-€-Münzen."
assert tuple(wechselgeld(95)) == (0, 0, 1, 2, 0, 1), "Für 95 ct passt das Ergebnis nicht."
assert tuple(wechselgeld(1255)) == (6, 0, 1, 0, 0, 1), "Für 1255 ct passt das Ergebnis nicht."
`,
        },
      ],

      sandbox: py`# Sandbox — Python Basics
artikel = "Croissant"
preis = 2.2
menge = 4

summe = preis * menge
print(f"{menge}x {artikel}: {summe:.2f} €")
print(type(summe))
`,
    },

    /* ------------------------------------------------------------------ 3 */
    {
      id: 3, slug: 'kontrolle', title: 'Kontrollstrukturen',
      subtitle: 'if, for, while',
      group: 'grundlagen', icon: 'if', status: 'ready',
      scenario: 'Sensordaten & Login',
      lead: 'Eine Maschinenhalle meldet Temperaturen, ein Terminal prüft Passwörter. <strong>if</strong> entscheidet, <strong>for</strong> geht Messwerte durch, <strong>while</strong> wiederholt, bis eine Bedingung kippt.',

      scenes: [
        {
          id: 'ampel',
          title: 'Temperatur-Ampel',
          blurb: 'Ziehe den Regler und beobachte, welcher Zweig von if / elif / else als Erster zutrifft.',
          visual: 'thermostat',
          config: {
            min: 0, max: 120, start: 45,
            rules: [
              { kw: 'if',   cond: 'temperatur > 80', op: '>', limit: 80, status: 'ALARM',   tone: 'red' },
              { kw: 'elif', cond: 'temperatur > 60', op: '>', limit: 60, status: 'WARNUNG', tone: 'amber' },
              { kw: 'else', cond: null,              status: 'OK',       tone: 'green' },
            ],
            presets: [
              { label: 'Normal', value: 45 },
              { label: 'Warm',   value: 72 },
              { label: 'Kritisch', value: 95 },
              { label: 'Grenzfall', value: 80 },
            ],
          },
        },
        {
          id: 'schleife',
          title: 'Messwert-Scanner',
          blurb: 'Eine for-Schleife wandert über die Sensorwerte. Sieh zu, wie Summe und Maximum mitwachsen.',
          visual: 'loopLab',
          config: { values: [21.5, 22.0, 35.5, 21.8, 40.2, 22.3] },
        },
        {
          id: 'login',
          title: 'Login-Schleuse',
          blurb: 'Drei Versuche, dann sperrt das Terminal. Probiere falsche und richtige Passwörter aus.',
          visual: 'loginLoop',
          config: { password: 'geheim', maxTries: 3 },
        },
      ],

      tasks: [
        {
          id: 'k1', level: 'Init', title: 'Messwerte zählen',
          scenario: 'Ein Temperatursensor in der Halle hat fünf Messwerte geliefert. Der Leitstand will Summe und Anzahl wissen.',
          goal: 'Gehe die Liste <code>messwerte</code> mit einer <code>for</code>-Schleife durch. Lege vorher die Zähler <code>summe</code> und <code>anzahl</code> mit <code>0</code> an und erhöhe beide in der Schleife.',
          hint: 'Aufbau: <code>for wert in messwerte:</code> — im Schleifenkörper (eingerückt) <code>summe += wert</code> und <code>anzahl += 1</code>.',
          starter: py`messwerte = [21.5, 22.0, 35.5, 21.8, 40.2]

# Zähler anlegen und Schleife schreiben
`,
          solution: py`messwerte = [21.5, 22.0, 35.5, 21.8, 40.2]

summe = 0
anzahl = 0
for wert in messwerte:
    summe += wert
    anzahl += 1
`,
          tests: py`
assert "for " in _source, "Nutze eine for-Schleife."
assert anzahl == 5, "anzahl sollte 5 sein — erhöhe sie in jedem Durchlauf um 1."
assert abs(summe - 141.0) < 1e-9, "summe stimmt nicht — addiere jeden Wert genau einmal."
`,
        },
        {
          id: 'k2', level: 'Update', title: 'Alarm-Zähler',
          scenario: 'Ab 30 °C gilt ein Messwert als Alarmwert. Der Leitstand will wissen, wie viele es gab und wie heiß es maximal wurde.',
          goal: 'Zähle in <code>alarme</code>, wie oft ein Wert <strong>größer als 30</strong> ist (genau 30.0 zählt nicht!), und halte in <code>hoechster</code> den größten bisher gesehenen Wert fest.',
          hint: 'In der Schleife brauchst du zwei unabhängige <code>if</code>-Prüfungen: eine für den Alarm, eine für den neuen Höchstwert.',
          starter: py`messwerte = [22.1, 31.5, 29.9, 35.2, 30.0, 41.7]

alarme = 0
hoechster = 0

# for-Schleife mit zwei if-Prüfungen
`,
          solution: py`messwerte = [22.1, 31.5, 29.9, 35.2, 30.0, 41.7]

alarme = 0
hoechster = 0

for wert in messwerte:
    if wert > 30:
        alarme += 1
    if wert > hoechster:
        hoechster = wert
`,
          tests: py`
assert "if " in _source and "for " in _source, "Nutze for und if."
assert alarme == 3, f"alarme ist {alarme}. Zählt 30.0 mit? Es soll nur > 30 zählen."
assert hoechster == 41.7, f"hoechster ist {hoechster} — es soll der größte Messwert sein."
assert len(messwerte) == 6, "Verändere die Liste messwerte nicht."
`,
        },
        {
          id: 'k3', level: 'Debugging', title: 'Login-Sperre',
          scenario: 'Das Terminal sperrt nach drei Fehlversuchen. Der Code stammt von einem Praktikanten — er startet nicht einmal, und wenn er startet, hängt er.',
          goal: 'Repariere alle Fehler. Am Ende muss <code>eingeloggt</code> den Wert <code>True</code> haben, <code>versuche</code> muss <code>3</code> sein (jeder Versuch zählt, auch der erfolgreiche) und <code>"Falsch"</code> wird genau zweimal ausgegeben.',
          hint: 'Drei Fehler: ein fehlender Doppelpunkt, <code>=</code> statt <code>==</code> beim Vergleichen — und die Schleife braucht eine Stelle, an der <code>versuche</code> wächst. Sonst läuft sie ewig (nach ein paar Sekunden bricht der Trainer ab).',
          starter: py`passwoerter = ["1234", "abcd", "geheim", "hallo"]
richtig = "geheim"
versuche = 0
eingeloggt = False

while versuche < 3 and not eingeloggt
    eingabe = passwoerter[versuche]
    if eingabe = richtig:
        eingeloggt = True
    else:
        print("Falsch")
`,
          solution: py`passwoerter = ["1234", "abcd", "geheim", "hallo"]
richtig = "geheim"
versuche = 0
eingeloggt = False

while versuche < 3 and not eingeloggt:
    eingabe = passwoerter[versuche]
    if eingabe == richtig:
        eingeloggt = True
    else:
        print("Falsch")
    versuche += 1
`,
          tests: py`
assert eingeloggt is True, "eingeloggt sollte am Ende True sein."
assert versuche == 3, f"versuche ist {versuche}. Zähle bei jedem Versuch hoch — auch beim erfolgreichen."
assert _stdout.count("Falsch") == 2, "Es soll genau zweimal 'Falsch' ausgegeben werden."
`,
        },
        {
          id: 'k4', level: 'Edge Case', title: 'Login-Prüfung',
          scenario: 'Das Terminal bekommt alle Eingaben eines Nutzers als Liste. Es muss entscheiden: eingeloggt, gesperrt — oder darf der Nutzer noch probieren?',
          goal: 'Schreibe <code>pruefe_login(eingaben, passwort)</code>. Nur die <strong>ersten drei</strong> Eingaben zählen. Ist eine davon richtig → <code>"OK"</code>. Sind alle drei falsch → <code>"GESPERRT"</code>. Gab es weniger als drei Eingaben, aber keine war richtig (auch bei leerer Liste) → <code>"OFFEN"</code>.',
          hint: 'Gehe die Eingaben mit <code>for</code> durch und merke dir mit einem Zähler, wie viele du schon gesehen hast. Wichtig: nach der dritten Eingabe aufhören (<code>break</code> oder <code>return</code>).',
          starter: py`def pruefe_login(eingaben, passwort):
    # Rückgabe: "OK", "GESPERRT" oder "OFFEN"
    pass
`,
          solution: py`def pruefe_login(eingaben, passwort):
    versuche = 0
    for eingabe in eingaben:
        if versuche == 3:
            break
        versuche += 1
        if eingabe == passwort:
            return "OK"
    if versuche >= 3:
        return "GESPERRT"
    return "OFFEN"
`,
          tests: py`
assert pruefe_login(["geheim"], "geheim") == "OK", "Richtig im ersten Versuch → OK."
assert pruefe_login(["x", "geheim"], "geheim") == "OK", "Richtig im zweiten Versuch → OK."
assert pruefe_login(["a", "b", "geheim"], "geheim") == "OK", "Richtig im dritten Versuch → OK."
assert pruefe_login(["a", "b", "c", "geheim"], "geheim") == "GESPERRT", "Der vierte Versuch zählt nicht mehr — das Konto ist gesperrt."
assert pruefe_login(["a", "b", "c"], "geheim") == "GESPERRT", "Drei falsche Versuche → GESPERRT."
assert pruefe_login(["a", "b"], "geheim") == "OFFEN", "Zwei Fehlversuche → noch OFFEN."
assert pruefe_login([], "geheim") == "OFFEN", "Keine Eingabe → OFFEN."
`,
        },
        {
          id: 'k5', level: 'Algorithmus', title: 'Sensorkurve glätten',
          scenario: 'Rohdaten eines Sensors zappeln. Für das Dashboard wird die Kurve mit einem gleitenden Mittelwert geglättet.',
          goal: 'Schreibe <code>gleitender_mittelwert(werte, fenster)</code>. Für jede Position, an der ein vollständiges Fenster aus <code>fenster</code> Werten passt, liefert sie den Durchschnitt dieser Werte — <strong>auf 2 Nachkommastellen gerundet</strong>, als Liste. Passt kein Fenster (oder ist <code>fenster</code> ≤ 0), ist das Ergebnis <code>[]</code>.',
          hint: 'Ein Fenster ist ein Listenausschnitt: <code>werte[i:i+fenster]</code>. Mit <code>sum(…) / fenster</code> und <code>round(x, 2)</code> bekommst du den Wert. Wie viele Startpositionen <code>i</code> gibt es?',
          starter: py`def gleitender_mittelwert(werte, fenster):
    # [1, 2, 3, 4, 5] mit fenster=3  ->  [2.0, 3.0, 4.0]
    pass
`,
          solution: py`def gleitender_mittelwert(werte, fenster):
    ergebnis = []
    if fenster <= 0:
        return ergebnis
    for i in range(len(werte) - fenster + 1):
        ausschnitt = werte[i:i + fenster]
        ergebnis.append(round(sum(ausschnitt) / fenster, 2))
    return ergebnis
`,
          tests: py`
assert gleitender_mittelwert([1, 2, 3, 4, 5], 3) == [2.0, 3.0, 4.0], "Für [1,2,3,4,5] mit Fenster 3 passt das Ergebnis nicht."
assert gleitender_mittelwert([2, 4, 6, 8], 2) == [3.0, 5.0, 7.0], "Für [2,4,6,8] mit Fenster 2 passt das Ergebnis nicht."
assert gleitender_mittelwert([1, 1, 2], 3) == [1.33], "Runde auf 2 Nachkommastellen."
assert gleitender_mittelwert([5], 1) == [5.0], "Fenster 1 gibt die Werte selbst zurück."
assert gleitender_mittelwert([10, 20], 3) == [], "Fenster größer als die Liste → leere Liste."
assert gleitender_mittelwert([1, 2, 3], 0) == [], "Fenster 0 → leere Liste."
`,
        },
      ],

      sandbox: py`# Sandbox — Kontrollstrukturen
messwerte = [21.5, 22.0, 35.5, 21.8, 40.2]

for wert in messwerte:
    if wert > 30:
        print(f"ALARM: {wert} °C")
    else:
        print(f"ok: {wert} °C")

versuche = 0
while versuche < 3:
    print("Versuch", versuche + 1)
    versuche += 1
`,
    },

    /* ----------------------------------------------------------- 4 – 18 */
    /* ------------------------------------------------------------------ 4 */
    {
      id: 4, slug: 'funktionen', title: 'Funktionen & Scopes',
      subtitle: 'def, return, Gültigkeitsbereiche',
      group: 'grundlagen', icon: 'ƒ()', status: 'ready',
      scenario: 'Rabatt- & Preisrechner',
      lead: 'Ein Online-Shop rechnet ständig dasselbe: Rabatte, Versand, Summen. Eine <strong>Funktion</strong> packt diese Rechnung einmal in einen Namen. Dabei gilt: Jede Funktion hat ihren <strong>eigenen Scope</strong> — nicht jede Variable ist überall sichtbar.',

      scenes: [
        {
          id: 'callstack',
          title: 'Call Stack',
          blurb: 'Jeder Funktionsaufruf legt einen Frame oben auf den Stack, jedes return nimmt ihn wieder weg. Klicke dich durch einen Preisaufruf.',
          visual: 'callStack',
          config: {
            lines: [
              'def mit_versand(betrag):',
              '    return betrag + 4.9',
              '',
              'def endpreis(preis, rabatt):',
              '    reduziert = preis - rabatt',
              '    return mit_versand(reduziert)',
              '',
              'total = endpreis(100, 20)',
              'print(total)',
            ],
            steps: [
              { line: 7, push: { name: 'endpreis(100, 20)', vars: { preis: '100', rabatt: '20' } },
                note: 'Aufruf: Python legt einen neuen <strong>Frame</strong> oben auf den Stack — mit eigenen Parametern <code>preis</code> und <code>rabatt</code>.' },
              { line: 4, set: { reduziert: '80' },
                note: '<code>reduziert</code> ist eine <strong>lokale Variable</strong>. Sie lebt nur in diesem Frame.' },
              { line: 5, push: { name: 'mit_versand(80)', vars: { betrag: '80' } },
                note: '<code>endpreis</code> ruft selbst eine Funktion auf. Der Stack wächst, <code>endpreis</code> wartet darunter.' },
              { line: 1, ret: '84.9',
                note: '<code>return</code>: Der oberste Frame verschwindet samt seiner Variablen. Der Wert <strong>84.9</strong> geht zurück an den Aufrufer.' },
              { line: 5, ret: '84.9',
                note: '<code>endpreis</code> reicht das Ergebnis weiter und wird ebenfalls abgebaut.' },
              { line: 7, setGlobal: { total: '84.9' },
                note: 'Zurück auf Modul-Ebene: Jetzt erst wird <code>total</code> belegt. Die lokalen Variablen von vorhin existieren nicht mehr.' },
              { line: 8, out: '84.9',
                note: 'Der Stack besteht wieder nur aus <code>&lt;module&gt;</code>.' },
            ],
          },
        },
        {
          id: 'scope',
          title: 'Scope-Tabelle',
          blurb: 'Wähle, wo im Code du dich befindest, und sieh, welche Variablen dort sichtbar sind. Klicke eine Zeile, um den Zugriff auszuprobieren.',
          visual: 'scopeTable',
          config: {
            lines: [
              'steuer = 0.19',
              '',
              'def brutto(netto):',
              '    rabatt = 0.10',
              '    return netto * (1 - rabatt) * (1 + steuer)',
              '',
              'def versand(summe):',
              '    porto = 4.9',
              '    return summe + porto',
            ],
            positions: [
              { id: 'global',  label: 'Modul-Ebene',    lines: [0, 2, 6] },
              { id: 'brutto',  label: 'in brutto()',    lines: [2, 3, 4] },
              { id: 'versand', label: 'in versand()',   lines: [6, 7, 8] },
            ],
            vars: [
              { name: 'steuer',  owner: 'global',  value: '0.19',        note: 'global definiert' },
              { name: 'brutto',  owner: 'global',  value: '<function>',  note: 'Funktionsnamen sind globale Variablen' },
              { name: 'versand', owner: 'global',  value: '<function>',  note: 'Funktionsnamen sind globale Variablen' },
              { name: 'netto',   owner: 'brutto',  value: '100',         note: 'Parameter von brutto()' },
              { name: 'rabatt',  owner: 'brutto',  value: '0.1',         note: 'lokal in brutto()' },
              { name: 'summe',   owner: 'versand', value: '80',          note: 'Parameter von versand()' },
              { name: 'porto',   owner: 'versand', value: '4.9',         note: 'lokal in versand()' },
            ],
          },
        },
      ],

      tasks: [
        {
          id: 'f1', level: 'Init', title: 'Begrüßung im Shop',
          scenario: 'Der Online-Shop soll Kunden nach dem Login persönlich begrüßen. Die Begrüßung wird an mehreren Stellen gebraucht — also gehört sie in eine Funktion.',
          goal: 'Schreibe die Funktion <code>begruesse(name)</code>. Sie <strong>gibt</strong> den Text <code>"Willkommen im Shop, Mia!"</code> zurück, wenn <code>name</code> <code>"Mia"</code> ist (mit <code>return</code>, nicht nur <code>print</code>).',
          hint: 'Aufbau: <code>def begruesse(name):</code> — eingerückt darunter <code>return "…" + name + "!"</code> oder ein f-String.',
          starter: py`def begruesse(name):
    pass
`,
          solution: py`def begruesse(name):
    return f"Willkommen im Shop, {name}!"
`,
          tests: py`
r = begruesse("Mia")
assert r is not None, "Die Funktion gibt nichts zurück. Nutze return statt print."
assert r == "Willkommen im Shop, Mia!", "Der Text stimmt noch nicht — prüfe Zeichen für Zeichen."
assert begruesse("Jan") == "Willkommen im Shop, Jan!", "Die Funktion muss mit jedem Namen funktionieren."
`,
        },
        {
          id: 'f2', level: 'Update', title: 'Endpreis mit Rabatt',
          scenario: 'Zum Wochenende gibt es Rabattaktionen in unterschiedlicher Höhe. Der Preisrechner bekommt Preis und Rabatt als Parameter.',
          goal: 'Schreibe <code>endpreis(preis, rabatt_prozent)</code>. Sie gibt den Preis nach Abzug des Rabatts zurück, <strong>auf 2 Nachkommastellen gerundet</strong>. Beispiel: <code>endpreis(200, 25)</code> → <code>150.0</code>.',
          hint: '25 % Rabatt heißt: <code>preis * (1 - rabatt_prozent / 100)</code>. Gerundet wird mit <code>round(x, 2)</code>.',
          starter: py`def endpreis(preis, rabatt_prozent):
    pass
`,
          solution: py`def endpreis(preis, rabatt_prozent):
    return round(preis * (1 - rabatt_prozent / 100), 2)
`,
          tests: py`
assert endpreis(200, 25) == 150.0, "Für 200 € mit 25 % Rabatt passt das Ergebnis nicht."
assert endpreis(59.99, 10) == 53.99, "Denk ans Runden auf 2 Nachkommastellen."
assert endpreis(10, 0) == 10.0, "Ohne Rabatt bleibt der Preis gleich."
assert endpreis(80, 100) == 0.0, "Bei 100 % Rabatt ist der Preis 0."
`,
        },
        {
          id: 'f3', level: 'Debugging', title: 'Der verschwundene Warenkorb',
          scenario: 'Der Warenkorb addiert Artikel auf eine Gesamtsumme. Beim ersten Artikel stürzt die Seite ab: UnboundLocalError. Der Praktikant hat Scopes verwechselt.',
          goal: 'Repariere das Skript, sodass <code>25.0</code> ausgegeben wird und die Variable <code>gesamt</code> am Ende <code>25.0</code> enthält. Die Funktion <code>in_den_warenkorb</code> soll erhalten bleiben und zweimal aufgerufen werden.',
          hint: 'Zuweisung in einer Funktion erzeugt eine <em>lokale</em> Variable. Entweder mit <code>global gesamt</code> an die globale Variable ranholen — oder besser: den neuen Wert per <code>return</code> zurückgeben und außen speichern.',
          starter: py`gesamt = 0

def in_den_warenkorb(preis):
    gesamt = gesamt + preis

in_den_warenkorb(19.99)
in_den_warenkorb(5.01)
print(gesamt)
`,
          solution: py`gesamt = 0

def in_den_warenkorb(preis):
    global gesamt
    gesamt = gesamt + preis

in_den_warenkorb(19.99)
in_den_warenkorb(5.01)
print(gesamt)
`,
          tests: py`
assert callable(in_den_warenkorb), "Die Funktion in_den_warenkorb muss erhalten bleiben."
assert _source.count("in_den_warenkorb(") >= 3, "Rufe in_den_warenkorb zweimal auf (19.99 und 5.01)."
assert abs(gesamt - 25.0) < 1e-9, f"gesamt ist {gesamt} — die Summe aus der Funktion kommt nicht bei der globalen Variable an."
assert "25" in _stdout, "Gib am Ende die Summe mit print(gesamt) aus."
`,
        },
        {
          id: 'f4', level: 'Edge Case', title: 'Versandkosten mit Standardwerten',
          scenario: 'Der Shop verschickt kostenlos ab 50 €, sonst kostet der Versand 4,90 €. Express kostet immer 6 € extra. Die meisten Aufrufe geben nur den Warenwert an.',
          goal: 'Ergänze <code>versandkosten(warenwert, express, gratis_ab)</code> um <strong>Default-Parameter</strong> (<code>express=False</code>, <code>gratis_ab=50.0</code>) und implementiere die Logik. Aufruf mit nur dem Warenwert muss funktionieren: <code>versandkosten(30)</code> → <code>4.9</code>.',
          hint: 'Defaults stehen in der Signatur: <code>def f(a, b=False):</code>. Berechne erst die Grundkosten (0.0 oder 4.9), dann addiere ggf. den Express-Zuschlag.',
          starter: py`def versandkosten(warenwert, express, gratis_ab):
    pass
`,
          solution: py`def versandkosten(warenwert, express=False, gratis_ab=50.0):
    kosten = 0.0 if warenwert >= gratis_ab else 4.9
    if express:
        kosten += 6.0
    return round(kosten, 2)
`,
          tests: py`
assert versandkosten(30) == 4.9, "versandkosten(30) muss ohne weitere Argumente funktionieren und 4.9 liefern."
assert versandkosten(60) == 0.0, "Ab 50 € ist der Versand kostenlos."
assert versandkosten(50) == 0.0, "Genau 50 € zählt schon als kostenlos."
assert versandkosten(30, express=True) == 10.9, "Express kostet 6 € extra."
assert versandkosten(60, True) == 6.0, "Auch bei kostenlosem Versand kostet Express 6 €."
assert versandkosten(40, gratis_ab=30) == 0.0, "gratis_ab lässt sich überschreiben."
assert versandkosten(0) == 4.9, "Auch ein Warenwert von 0 darf nicht abstürzen."
`,
        },
        {
          id: 'f5', level: 'Algorithmus', title: 'Alle Warenkörbe auf einmal',
          scenario: 'Zum Tagesabschluss soll der Shop für alle offenen Warenkörbe den Endpreis nach Aktionsrabatt berechnen. Ein Warenkorb ist eine Liste von Einzelpreisen.',
          goal: 'Nutze die vorhandene Funktion <code>endpreis</code> und schreibe <code>gesamtpreise(warenkoerbe, rabatt_prozent=0)</code>. Sie liefert eine Liste mit dem rabattierten Endpreis jedes Warenkorbs (Summe der Einzelpreise, dann Rabatt). Ein leerer Warenkorb ergibt <code>0.0</code>.',
          hint: 'Gehe die Körbe mit <code>for korb in warenkoerbe</code> durch. <code>sum(korb)</code> bildet die Summe; danach rufst du <code>endpreis(…)</code> auf und hängst das Ergebnis an eine Liste an.',
          starter: py`def endpreis(preis, rabatt_prozent):
    return round(preis * (1 - rabatt_prozent / 100), 2)

def gesamtpreise(warenkoerbe, rabatt_prozent=0):
    pass
`,
          solution: py`def endpreis(preis, rabatt_prozent):
    return round(preis * (1 - rabatt_prozent / 100), 2)

def gesamtpreise(warenkoerbe, rabatt_prozent=0):
    ergebnis = []
    for korb in warenkoerbe:
        ergebnis.append(endpreis(sum(korb), rabatt_prozent))
    return ergebnis
`,
          tests: py`
assert "endpreis(" in _source.split("def gesamtpreise")[1], "Nutze die vorhandene Funktion endpreis() innerhalb von gesamtpreise."
assert gesamtpreise([[10, 20], [5]], 10) == [27.0, 4.5], "Für [[10, 20], [5]] mit 10 % passt das Ergebnis nicht."
assert gesamtpreise([[100], [50, 50], [1]], 50) == [50.0, 50.0, 0.5], "Für drei Körbe mit 50 % passt das Ergebnis nicht."
assert gesamtpreise([[19.99, 5.01]]) == [25.0], "Ohne Rabatt-Argument gilt rabatt_prozent=0."
assert gesamtpreise([[]], 10) == [0.0], "Ein leerer Warenkorb kostet 0.0."
assert gesamtpreise([], 10) == [], "Keine Körbe → leere Liste."
`,
        },
      ],

      sandbox: py`# Sandbox — Funktionen & Scopes
steuer = 0.19

def brutto(netto, rabatt=0):
    reduziert = netto * (1 - rabatt)
    return round(reduziert * (1 + steuer), 2)

print(brutto(100))
print(brutto(100, rabatt=0.1))

# Was passiert, wenn du hier 'reduziert' ausgibst?
`,
    },
    /* ------------------------------------------------------------------ 5 */
    {
      id: 5, slug: 'comprehension', title: 'List Comprehensions',
      subtitle: 'Listen in einer Zeile bauen',
      group: 'grundlagen', icon: '[∙]', status: 'ready',
      scenario: 'Server-Logfiles & IP-Adressen',
      lead: 'Ein Webserver schreibt tausende Logzeilen. Du willst nur die Fehler, nur interne IPs oder bereinigte Texte. Eine <strong>List Comprehension</strong> baut eine neue Liste aus einer alten — filtern und umwandeln in einem Ausdruck.',

      scenes: [
        {
          id: 'pipeline',
          title: 'Daten-Pipeline',
          blurb: 'Die Elemente der Quell-Liste fließen durch den Filter. Was die Bedingung besteht, landet in der Zielliste. Wähle oben eine Comprehension aus.',
          visual: 'pipeline',
          config: {
            items: [
              { ip: '10.0.0.4',     status: 200 },
              { ip: '192.168.1.9',  status: 404 },
              { ip: '10.0.0.17',    status: 500 },
              { ip: '8.8.8.8',      status: 200 },
              { ip: '10.0.0.23',    status: 301 },
              { ip: '203.0.113.5',  status: 503 },
              { ip: '10.0.0.8',     status: 404 },
            ],
            presets: [
              { label: 'Nur Fehler',          expr: 'z.ip',        cond: 'z.status >= 400',          test: (z) => z.status >= 400,          map: (z) => z.ip },
              { label: 'Nur interne IPs',     expr: 'z.ip',        cond: 'z.ip.startswith("10.")',   test: (z) => z.ip.startsWith('10.'),   map: (z) => z.ip },
              { label: 'Server-Fehler',       expr: 'z.status',    cond: 'z.status >= 500',          test: (z) => z.status >= 500,          map: (z) => z.status },
              { label: 'Alle, umgewandelt',   expr: 'z.ip.upper()', cond: null,                       test: () => true,                      map: (z) => z.ip.toUpperCase() },
            ],
          },
        },
      ],

      tasks: [
        {
          id: 'c1', level: 'Init', title: 'IPs bereinigen',
          scenario: 'Die Logdatei liefert IP-Adressen mit störenden Leerzeichen am Rand. Bisher säubert eine for-Schleife die Liste — das geht kürzer.',
          goal: 'Wandle die Schleife in eine <strong>List Comprehension</strong> um: <code>saubere_ips</code> soll dieselbe Liste enthalten, aber ohne <code>append</code>. Entferne die Leerzeichen mit <code>.strip()</code>.',
          hint: 'Schema: <code>[ausdruck for element in liste]</code>. Hier ist der Ausdruck <code>ip.strip()</code>.',
          starter: py`rohe_ips = [" 10.0.0.1", "192.168.1.5 ", " 8.8.8.8 "]

saubere_ips = []
for ip in rohe_ips:
    saubere_ips.append(ip.strip())
`,
          solution: py`rohe_ips = [" 10.0.0.1", "192.168.1.5 ", " 8.8.8.8 "]

saubere_ips = [ip.strip() for ip in rohe_ips]
`,
          tests: py`
assert ".append" not in _source, "Nutze eine Comprehension statt append."
assert " for " in _source and "[" in _source, "Baue die Liste mit [ … for … in … ]."
assert saubere_ips == ["10.0.0.1", "192.168.1.5", "8.8.8.8"], "Das Ergebnis stimmt nicht — hast du .strip() verwendet?"
assert rohe_ips == [" 10.0.0.1", "192.168.1.5 ", " 8.8.8.8 "], "Lass die Ursprungsliste unverändert."
`,
        },
        {
          id: 'c2', level: 'Update', title: 'Nur die Fehlerzeilen',
          scenario: 'Der Admin will im Monitoring nur Zeilen mit ERROR sehen und nicht den ganzen Lärm aus INFO und WARN.',
          goal: 'Erzeuge <code>fehlerzeilen</code>: alle Einträge aus <code>zeilen</code>, die mit <code>"ERROR"</code> beginnen — per Comprehension mit <code>if</code>-Bedingung am Ende.',
          hint: 'Schema: <code>[z for z in zeilen if bedingung]</code>. Ob ein Text mit etwas beginnt, prüft <code>z.startswith("ERROR")</code>.',
          starter: py`zeilen = [
    "INFO server gestartet",
    "ERROR datenbank nicht erreichbar",
    "WARN antwort langsam",
    "ERROR timeout bei /api",
    "INFO anfrage ok",
]

# fehlerzeilen = ...
`,
          solution: py`zeilen = [
    "INFO server gestartet",
    "ERROR datenbank nicht erreichbar",
    "WARN antwort langsam",
    "ERROR timeout bei /api",
    "INFO anfrage ok",
]

fehlerzeilen = [z for z in zeilen if z.startswith("ERROR")]
`,
          tests: py`
assert ".append" not in _source, "Nutze eine Comprehension statt append."
assert " if " in _source, "Filtere mit if am Ende der Comprehension."
assert fehlerzeilen == ["ERROR datenbank nicht erreichbar", "ERROR timeout bei /api"], "fehlerzeilen enthält nicht genau die beiden ERROR-Zeilen."
assert len(zeilen) == 5, "Lass die Liste zeilen unverändert."
`,
        },
        {
          id: 'c3', level: 'Debugging', title: 'Kaputte Filter',
          scenario: 'Ein Kollege hat drei Comprehensions für die IP-Auswertung geschrieben — keine läuft. Python meldet SyntaxError.',
          goal: 'Repariere die Syntax. Danach muss <code>intern</code> die IPs enthalten, die mit <code>"10."</code> beginnen, <code>laengen</code> die Textlängen aller IPs und <code>extern</code> alle IPs, die <em>nicht</em> mit <code>"10."</code> beginnen.',
          hint: 'Reihenfolge: <code>[ausdruck for x in liste if bedingung]</code>. Jede öffnende Klammer braucht ihr Gegenstück, und im Inneren gibt es keinen Doppelpunkt.',
          starter: py`ips = ["10.0.0.1", "192.168.1.5", "10.0.0.9", "8.8.8.8"]

intern = [ip for ip in ips if ip.startswith("10.")
laengen = [for ip in ips: len(ip)]
extern = [ip if not ip.startswith("10.") for ip in ips]
`,
          solution: py`ips = ["10.0.0.1", "192.168.1.5", "10.0.0.9", "8.8.8.8"]

intern = [ip for ip in ips if ip.startswith("10.")]
laengen = [len(ip) for ip in ips]
extern = [ip for ip in ips if not ip.startswith("10.")]
`,
          tests: py`
assert intern == ["10.0.0.1", "10.0.0.9"], "intern stimmt nicht — nur IPs, die mit 10. beginnen."
assert laengen == [8, 11, 8, 7], "laengen stimmt nicht — len(ip) für jede IP."
assert extern == ["192.168.1.5", "8.8.8.8"], "extern stimmt nicht — alle IPs, die NICHT mit 10. beginnen."
assert _source.count(" for ") >= 3, "Alle drei Listen sollen Comprehensions bleiben."
`,
        },
        {
          id: 'c4', level: 'Edge Case', title: 'Statuscodes etikettieren',
          scenario: 'Das Dashboard zeigt für jeden Statuscode ein Etikett: OK bis 399, CLIENT bei 4xx, SERVER ab 500. Grenzwerte wie 399, 400 oder 499 müssen stimmen — und eine leere Liste darf nichts kaputt machen.',
          goal: 'Schreibe <code>klassifiziere(codes)</code>. Sie gibt per <strong>Comprehension mit if/else im Ausdruck</strong> eine Liste mit <code>"OK"</code> (&lt; 400), <code>"CLIENT"</code> (400–499) oder <code>"SERVER"</code> (≥ 500) zurück.',
          hint: 'Bei if/else steht die Bedingung <em>vor</em> dem for: <code>[a if bed else b for c in liste]</code>. Für drei Fälle verschachtelst du: <code>a if x else b if y else c</code>.',
          starter: py`def klassifiziere(codes):
    pass
`,
          solution: py`def klassifiziere(codes):
    return ["OK" if c < 400 else "CLIENT" if c < 500 else "SERVER" for c in codes]
`,
          tests: py`
assert " else " in _source and " for " in _source, "Nutze eine Comprehension mit if/else im Ausdruck."
assert ".append" not in _source, "Nutze eine Comprehension statt append."
assert klassifiziere([200, 301]) == ["OK", "OK"], "2xx und 3xx sind OK."
assert klassifiziere([399, 400, 499, 500]) == ["OK", "CLIENT", "CLIENT", "SERVER"], "Prüfe die Grenzwerte 399 / 400 / 499 / 500."
assert klassifiziere([503, 404, 200]) == ["SERVER", "CLIENT", "OK"], "Die Reihenfolge der Eingabe muss erhalten bleiben."
assert klassifiziere([]) == [], "Leere Liste → leere Liste."
`,
        },
        {
          id: 'c5', level: 'Algorithmus', title: 'Verdächtige Anfragen',
          scenario: 'Das Logfile besteht aus Dictionaries. Die Security-Abteilung will eine saubere Liste verdächtiger Anfragen: Serverfehler oder ungewöhnlich langsame Antworten. Manche Einträge haben gar keine Messzeit.',
          goal: 'Schreibe <code>verdaechtige(logs, limit_ms)</code>. Ein Eintrag ist verdächtig, wenn <code>status &gt;= 500</code> <strong>oder</strong> <code>ms &gt; limit_ms</code> (fehlt <code>"ms"</code>, zählt es als 0). Rückgabe: Liste von Texten im Format <code>"IP pfad (status)"</code> in Originalreihenfolge, z. B. <code>"10.0.0.2 /api (500)"</code>.',
          hint: 'Fehlende Schlüssel liefert <code>eintrag.get("ms", 0)</code> ohne KeyError. Kombiniere beide Bedingungen mit <code>or</code> in einem <code>if</code> und formatiere mit einem f-String.',
          starter: py`def verdaechtige(logs, limit_ms):
    pass
`,
          solution: py`def verdaechtige(logs, limit_ms):
    return [
        f"{e['ip']} {e['pfad']} ({e['status']})"
        for e in logs
        if e["status"] >= 500 or e.get("ms", 0) > limit_ms
    ]
`,
          tests: py`
assert ".append" not in _source, "Nutze eine Comprehension statt append."
logs = [
    {"ip": "10.0.0.1", "pfad": "/home",   "status": 200, "ms": 120},
    {"ip": "10.0.0.2", "pfad": "/api",    "status": 500, "ms": 80},
    {"ip": "10.0.0.3", "pfad": "/search", "status": 200, "ms": 950},
    {"ip": "10.0.0.4", "pfad": "/img",    "status": 404},
    {"ip": "10.0.0.5", "pfad": "/login",  "status": 503, "ms": 2000},
]
assert verdaechtige(logs, 500) == ["10.0.0.2 /api (500)", "10.0.0.3 /search (200)", "10.0.0.5 /login (503)"], "Für limit_ms=500 passt die Ergebnisliste nicht."
assert verdaechtige(logs, 5000) == ["10.0.0.2 /api (500)", "10.0.0.5 /login (503)"], "Bei hohem Limit zählen nur Serverfehler."
assert verdaechtige(logs, 100) == ["10.0.0.1 /home (200)", "10.0.0.2 /api (500)", "10.0.0.3 /search (200)", "10.0.0.5 /login (503)"], "Bei limit_ms=100 passt die Ergebnisliste nicht. Fehlende ms zählen als 0."
assert verdaechtige([], 100) == [], "Leeres Log → leere Liste."
`,
        },
      ],

      sandbox: py`# Sandbox — List Comprehensions
logs = [
    {"ip": "10.0.0.4", "status": 200},
    {"ip": "192.168.1.9", "status": 404},
    {"ip": "10.0.0.17", "status": 500},
]

fehler_ips = [l["ip"] for l in logs if l["status"] >= 400]
print(fehler_ips)

labels = ["OK" if l["status"] < 400 else "FEHLER" for l in logs]
print(labels)
`,
    },
    /* ------------------------------------------------------------------ 6 */
    {
      id: 6, slug: 'list', title: 'List (Arrays)',
      subtitle: 'Index, append, insert, pop',
      group: 'struktur', icon: '[ ]', status: 'ready',
      scenario: 'IoT-Temperatursensoren',
      lead: 'Sensoren funken im Sekundentakt Messwerte. Eine <strong>Liste</strong> hält sie in Reihenfolge in nummerierten Speicherslots. Hinten anhängen ist billig — vorne einfügen verschiebt alles dahinter.',

      scenes: [
        {
          id: 'slots',
          title: 'Speicherslots',
          blurb: 'Die Liste als Reihe nummerierter Slots. Probiere append, insert(0) und pop — und achte auf den Zähler der Verschiebungen.',
          visual: 'arraySlots',
          config: {
            start: [21.5, 22.0, 23.4, 22.8],
            capacity: 9,
            incoming: [24.1, 19.8, 25.3, 20.6, 22.2, 23.9],
          },
        },
      ],

      tasks: [
        {
          id: 'l1', level: 'Init', title: 'Erste Messreihe',
          scenario: 'Ein neuer Sensor im Serverraum hat seine ersten drei Messwerte geliefert. Du legst die Messreihe an und liest sie aus.',
          goal: 'Erzeuge die Liste <code>temperaturen</code> mit den Werten <code>21.5</code>, <code>22.0</code> und <code>23.4</code> (in dieser Reihenfolge). Speichere außerdem <code>anzahl</code> (Länge der Liste), <code>erste</code> (erster Wert) und <code>letzte</code> (letzter Wert) — berechnet, nicht eingetippt.',
          hint: 'Listen stehen in eckigen Klammern. <code>len(liste)</code> liefert die Länge, <code>liste[0]</code> das erste Element, <code>liste[-1]</code> das letzte.',
          starter: py`# Messreihe des Serverraum-Sensors

`,
          solution: py`temperaturen = [21.5, 22.0, 23.4]
anzahl = len(temperaturen)
erste = temperaturen[0]
letzte = temperaturen[-1]
`,
          tests: py`
assert isinstance(temperaturen, list), "temperaturen muss eine Liste sein."
assert temperaturen == [21.5, 22.0, 23.4], "Die Liste muss genau [21.5, 22.0, 23.4] enthalten."
assert anzahl == 3 and "len(" in _source, "anzahl soll mit len() berechnet werden."
assert erste == 21.5, "erste ist der Wert an Index 0."
assert letzte == 23.4, "letzte ist der letzte Wert der Liste — Index -1 hilft."
assert "[0]" in _source, "erste soll per Index 0 gelesen werden."
`,
        },
        {
          id: 'l2', level: 'Update', title: 'Neue Werte einsortieren',
          scenario: 'Der Sensor sendet einen neuen Messwert, außerdem soll ein Kalibrierwert ganz an den Anfang der Messreihe.',
          goal: 'Hänge <code>24.5</code> <strong>ans Ende</strong> von <code>messwerte</code> an (<code>append</code>) und füge den Kalibrierwert <code>20.0</code> <strong>an Index 0</strong> ein (<code>insert</code>). Verändere die Liste selbst, erzeuge keine neue.',
          hint: '<code>liste.append(x)</code> hängt hinten an, <code>liste.insert(index, x)</code> schiebt alles ab <code>index</code> nach rechts.',
          starter: py`messwerte = [21.0, 22.5, 23.0]

# append und insert
`,
          solution: py`messwerte = [21.0, 22.5, 23.0]

messwerte.append(24.5)
messwerte.insert(0, 20.0)
`,
          tests: py`
assert ".append(" in _source, "Nutze append, um den neuen Wert anzuhängen."
assert ".insert(" in _source, "Nutze insert, um den Kalibrierwert einzufügen."
assert messwerte == [20.0, 21.0, 22.5, 23.0, 24.5], f"messwerte ist {messwerte} — erwartet: Kalibrierwert vorn, neuer Messwert hinten."
`,
        },
        {
          id: 'l3', level: 'Debugging', title: 'Index außerhalb',
          scenario: 'Das Dashboard soll den letzten Messwert und danach alle vier Werte ausgeben. Stattdessen stürzt es mit IndexError ab.',
          goal: 'Repariere das Skript: <code>letzter</code> muss <code>22.8</code> sein und die Schleife soll genau die vier Messwerte ausgeben (jeder in einer eigenen Zeile).',
          hint: 'Eine Liste mit 4 Elementen hat die Indizes 0 bis 3. Index 4 gibt es nicht. Wie viele Durchläufe liefert <code>range(len(…))</code> — und wie viele hat die Schleife jetzt?',
          starter: py`messwerte = [21.5, 22.0, 23.4, 22.8]

letzter = messwerte[4]

for i in range(len(messwerte) + 1):
    print(messwerte[i])
`,
          solution: py`messwerte = [21.5, 22.0, 23.4, 22.8]

letzter = messwerte[-1]

for i in range(len(messwerte)):
    print(messwerte[i])
`,
          tests: py`
assert letzter == 22.8, f"letzter ist {letzter} — der letzte Wert der Liste."
assert _stdout.split() == ["21.5", "22.0", "23.4", "22.8"], "Die Ausgabe soll genau die vier Messwerte enthalten."
assert messwerte == [21.5, 22.0, 23.4, 22.8], "Lass die Liste unverändert."
`,
        },
        {
          id: 'l4', level: 'Edge Case', title: 'Sicher entfernen',
          scenario: 'Eine Warteschlange von Messwerten wird abgearbeitet. Wenn der Sensor ausfällt, ist sie leer — und pop() auf einer leeren Liste wirft einen IndexError.',
          goal: 'Schreibe <code>letzten_entfernen(messwerte)</code>. Sie entfernt den letzten Wert aus der Liste und gibt ihn zurück. Ist die Liste leer, passiert nichts und die Funktion gibt <code>None</code> zurück.',
          hint: 'Prüfe vor dem <code>pop()</code>, ob etwas in der Liste steht: <code>if len(messwerte) &gt; 0:</code> oder kurz <code>if messwerte:</code>.',
          starter: py`def letzten_entfernen(messwerte):
    pass
`,
          solution: py`def letzten_entfernen(messwerte):
    if not messwerte:
        return None
    return messwerte.pop()
`,
          tests: py`
daten = [21.0, 22.5]
assert letzten_entfernen(daten) == 22.5, "Es muss der zuletzt gemessene Wert zurückkommen."
assert daten == [21.0], "Der Wert muss aus der Liste entfernt werden."
assert letzten_entfernen(daten) == 21.0
assert daten == [], "Nach dem zweiten Aufruf ist die Liste leer."
leer = []
assert letzten_entfernen(leer) is None, "Bei leerer Liste: None zurückgeben, nicht abstürzen."
assert leer == [], "Eine leere Liste bleibt leer."
`,
        },
        {
          id: 'l5', level: 'Algorithmus', title: 'Ausreißer entfernen',
          scenario: 'Ein defekter Sensor liefert gelegentlich absurde Werte. Bevor der Durchschnitt berechnet wird, müssen Ausreißer raus. Die Originalmessreihe darf nicht verändert werden.',
          goal: 'Schreibe <code>ohne_ausreisser(werte, grenze)</code>. Berechne den Durchschnitt aller Werte und gib eine <strong>neue</strong> Liste zurück, die nur Werte enthält, deren Abstand zum Durchschnitt <strong>höchstens</strong> <code>grenze</code> beträgt (Reihenfolge beibehalten). Eine leere Liste ergibt <code>[]</code>.',
          hint: 'Der Durchschnitt ist <code>sum(werte) / len(werte)</code> — aber Vorsicht bei einer leeren Liste. Den Abstand misst <code>abs(w - durchschnitt)</code>. Baue die Ergebnisliste mit <code>append</code> in einer Schleife.',
          starter: py`def ohne_ausreisser(werte, grenze):
    pass
`,
          solution: py`def ohne_ausreisser(werte, grenze):
    if len(werte) == 0:
        return []
    durchschnitt = sum(werte) / len(werte)
    ergebnis = []
    for w in werte:
        if abs(w - durchschnitt) <= grenze:
            ergebnis.append(w)
    return ergebnis
`,
          tests: py`
original = [20, 21, 22, 95]
assert ohne_ausreisser(original, 20) == [20, 21, 22], "Der Wert 95 muss als Ausreißer verschwinden."
assert original == [20, 21, 22, 95], "Verändere die Originalliste nicht — gib eine neue zurück."
assert ohne_ausreisser([20, 22], 5) == [20, 22], "Normale Werte bleiben erhalten."
assert ohne_ausreisser([10, 10, 10, 50], 10) == [10, 10, 10], "Ein Abstand von genau grenze ist noch erlaubt."
assert ohne_ausreisser([], 5) == [], "Leere Liste → leere Liste (keine Division durch 0)."
assert ohne_ausreisser([7], 0) == [7], "Ein einzelner Wert liegt genau auf dem Durchschnitt."
`,
        },
      ],

      sandbox: py`# Sandbox — Listen
temperaturen = [21.5, 22.0, 23.4]

temperaturen.append(24.1)
temperaturen.insert(0, 20.0)
print(temperaturen)

letzter = temperaturen.pop()
print("entfernt:", letzter)
print("Durchschnitt:", sum(temperaturen) / len(temperaturen))
`,
    },
    /* ------------------------------------------------------------------ 7 */
    {
      id: 7, slug: 'tuple', title: 'Tuple',
      subtitle: 'unveränderliche Wertepaare',
      group: 'struktur', icon: '( )', status: 'ready',
      scenario: 'GPS-Koordinaten & Farb-Konstanten',
      lead: 'Ein Standort oder eine Farbe darf sich nicht versehentlich ändern. Ein <strong>Tuple</strong> sieht aus wie eine Liste, ist aber <strong>unveränderlich</strong> (immutable): Schreibversuche werden von Python blockiert.',

      scenes: [
        {
          id: 'immutable',
          title: 'Liste vs. Tuple',
          blurb: 'Dieselben Werte, zweimal gespeichert. Führe dieselbe Operation auf beiden aus und sieh, wer sich wehrt.',
          visual: 'tupleVsList',
          config: {
            values: [48.1372, 11.5756, 519],
            ops: [
              { id: 'set',    label: 'x[1] = 99' },
              { id: 'append', label: 'x.append(5)' },
              { id: 'pop',    label: 'x.pop()' },
            ],
          },
        },
        {
          id: 'unpack',
          title: 'Entpacken',
          blurb: 'Ein Tuple lässt sich in Variablen auspacken — aber die Anzahl muss passen. Wähle, wie viele Variablen links stehen.',
          visual: 'unpack',
          config: {
            values: [48.1372, 11.5756, 519],
            names: ['lat', 'lon', 'hoehe', 'extra'],
          },
        },
      ],

      tasks: [
        {
          id: 't1', level: 'Init', title: 'Konstanten anlegen',
          scenario: 'Die Karten-App speichert den Marienplatz in München und die Farbe Rot als feste Werte, die niemand verändern darf.',
          goal: 'Lege drei Tuples an: <code>standort</code> = <code>(48.1372, 11.5756)</code> (Breite, Länge), <code>rot</code> = <code>(255, 0, 0)</code> und <code>ein_wert</code> mit nur dem Element <code>42</code>. Achtung bei der letzten: Ein Tuple mit einem Element braucht ein Komma!',
          hint: 'Tuples stehen in runden Klammern. <code>(42)</code> ist nur die Zahl 42 in Klammern — erst <code>(42,)</code> ist ein Tuple.',
          starter: py`# Feste Werte der Karten-App

`,
          solution: py`standort = (48.1372, 11.5756)
rot = (255, 0, 0)
ein_wert = (42,)
`,
          tests: py`
assert type(standort) is tuple, "standort muss ein Tuple sein (runde Klammern)."
assert standort == (48.1372, 11.5756), "standort muss (48.1372, 11.5756) sein."
assert type(rot) is tuple and rot == (255, 0, 0), "rot muss das Tuple (255, 0, 0) sein."
assert type(ein_wert) is tuple, "ein_wert ist kein Tuple — fehlt das Komma?"
assert ein_wert == (42,), "ein_wert muss genau das Element 42 enthalten."
`,
        },
        {
          id: 't2', level: 'Update', title: 'Wegpunkt auslesen',
          scenario: 'Ein Wegpunkt der Navigation besteht aus Name, Breite, Länge und Höhe. Die Anzeige braucht einzelne Teile davon.',
          goal: 'Lies aus <code>wegpunkt</code> aus: <code>name</code> (erstes Element), <code>breite</code> (zweites), <code>hoehe</code> (das <em>letzte</em>, ohne die Position von Hand zu zählen) und <code>koordinaten</code> (ein Tuple aus Breite und Länge, per Slice).',
          hint: 'Index 0 ist das erste Element, <code>-1</code> das letzte. Ein Slice <code>t[1:3]</code> liefert die Elemente 1 und 2 als neues Tuple.',
          starter: py`wegpunkt = ("Marienplatz", 48.1374, 11.5755, 519)

# name, breite, hoehe, koordinaten
`,
          solution: py`wegpunkt = ("Marienplatz", 48.1374, 11.5755, 519)

name = wegpunkt[0]
breite = wegpunkt[1]
hoehe = wegpunkt[-1]
koordinaten = wegpunkt[1:3]
`,
          tests: py`
assert name == "Marienplatz", "name ist das erste Element (Index 0)."
assert breite == 48.1374, "breite ist das zweite Element (Index 1)."
assert hoehe == 519, "hoehe ist das letzte Element."
assert "[-1]" in _source.replace(" ", ""), "Nutze den Index -1 für das letzte Element."
assert koordinaten == (48.1374, 11.5755), f"koordinaten ist {koordinaten} — erwartet ein Tuple aus Breite und Länge."
assert type(koordinaten) is tuple, "Ein Slice eines Tuples bleibt ein Tuple."
`,
        },
        {
          id: 't3', level: 'Debugging', title: 'Farbe aufhellen',
          scenario: 'Der Designer will ein helleres Blau. Der Code versucht, den Blau-Anteil der Farb-Konstante direkt zu überschreiben — und Python stoppt mit einem TypeError.',
          goal: 'Repariere das Skript, sodass <code>farbe</code> am Ende <code>(0, 0, 200)</code> ist und <code>(0, 0, 200)</code> ausgegeben wird. <code>farbe</code> soll ein Tuple bleiben.',
          hint: 'Tuples kann man nicht ändern, nur <em>ersetzen</em>: baue ein neues Tuple (z. B. mit den alten Werten <code>farbe[0]</code>, <code>farbe[1]</code> und dem neuen Blau) und weise es <code>farbe</code> neu zu.',
          starter: py`farbe = (0, 0, 255)

# Blau-Anteil auf 200 setzen
farbe[2] = 200

print(farbe)
`,
          solution: py`farbe = (0, 0, 255)

# Blau-Anteil auf 200 setzen
farbe = (farbe[0], farbe[1], 200)

print(farbe)
`,
          tests: py`
assert type(farbe) is tuple, "farbe muss ein Tuple bleiben — wandle nicht in eine Liste um."
assert farbe == (0, 0, 200), f"farbe ist {farbe} — erwartet (0, 0, 200)."
assert "(0, 0, 200)" in _stdout, "Gib die neue Farbe mit print(farbe) aus."
`,
        },
        {
          id: 't4', level: 'Edge Case', title: 'Position entpacken',
          scenario: 'GPS-Geräte liefern Positionen unterschiedlich: manche nur mit (Breite, Länge), andere mit Höhe, manche sogar mit Zusatzdaten. Das Entpacken darf nicht mit ValueError abstürzen.',
          goal: 'Schreibe <code>parse_position(position)</code>. Sie gibt immer ein Tuple <code>(breite, laenge, hoehe)</code> zurück. Fehlt die Höhe, ist sie <code>0</code>. Zusätzliche Werte ab dem 4. Element werden ignoriert. Hat die Position weniger als 2 Werte, löse <code>raise ValueError("ungültige Position")</code> aus.',
          hint: 'Mit Stern-Entpacken fängst du den Rest ein: <code>breite, laenge, *rest = position</code>. <code>rest</code> ist dann eine Liste — leer, wenn nichts übrig ist.',
          starter: py`def parse_position(position):
    # (48.1, 11.5)              -> (48.1, 11.5, 0)
    # (48.1, 11.5, 519)         -> (48.1, 11.5, 519)
    # (48.1, 11.5, 519, "gps")  -> (48.1, 11.5, 519)
    pass
`,
          solution: py`def parse_position(position):
    if len(position) < 2:
        raise ValueError("ungültige Position")
    breite, laenge, *rest = position
    hoehe = rest[0] if rest else 0
    return (breite, laenge, hoehe)
`,
          tests: py`
assert parse_position((48.1, 11.5)) == (48.1, 11.5, 0), "Ohne Höhe soll 0 eingesetzt werden."
assert parse_position((48.1, 11.5, 519)) == (48.1, 11.5, 519), "Mit drei Werten bleibt alles gleich."
assert parse_position((48.1, 11.5, 519, "gps")) == (48.1, 11.5, 519), "Zusatzwerte nach der Höhe werden ignoriert."
assert type(parse_position((1.0, 2.0))) is tuple, "Das Ergebnis muss ein Tuple sein."
try:
    parse_position((48.1,))
    raised = False
except ValueError:
    raised = True
assert raised, "Bei nur einem Wert muss ein ValueError ausgelöst werden."
try:
    parse_position(())
    raised = False
except ValueError:
    raised = True
assert raised, "Ein leeres Tuple ist ungültig → ValueError."
`,
        },
        {
          id: 't5', level: 'Algorithmus', title: 'Nächste Palettenfarbe',
          scenario: 'Ein Bildprogramm soll jede Farbe auf die ähnlichste Farbe einer festen Palette abbilden. Farben sind RGB-Tuples; Ähnlichkeit ist der quadrierte Abstand der drei Kanäle.',
          goal: 'Schreibe <code>naechste_farbe(farbe, palette)</code>. Sie gibt die Palettenfarbe mit dem kleinsten quadrierten Abstand <code>(r1-r2)² + (g1-g2)² + (b1-b2)²</code> zurück. Bei Gleichstand gewinnt die <strong>erste</strong> in der Palette. Ist die Palette leer, ist das Ergebnis <code>None</code>.',
          hint: 'Entpacke beide Farben direkt: <code>r, g, b = farbe</code> und <code>pr, pg, pb = kandidat</code>. Merke dir bisher beste Farbe und deren Abstand; ersetze sie nur bei einem <em>echt kleineren</em> Abstand.',
          starter: py`def naechste_farbe(farbe, palette):
    pass
`,
          solution: py`def naechste_farbe(farbe, palette):
    r, g, b = farbe
    beste = None
    bester_abstand = None
    for kandidat in palette:
        pr, pg, pb = kandidat
        abstand = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
        if bester_abstand is None or abstand < bester_abstand:
            beste = kandidat
            bester_abstand = abstand
    return beste
`,
          tests: py`
palette = [(255, 0, 0), (0, 255, 0), (0, 0, 255)]
assert naechste_farbe((250, 10, 5), palette) == (255, 0, 0), "(250, 10, 5) liegt am nächsten an Rot."
assert naechste_farbe((10, 20, 200), palette) == (0, 0, 255), "(10, 20, 200) liegt am nächsten an Blau."
assert naechste_farbe((0, 240, 30), palette) == (0, 255, 0), "(0, 240, 30) liegt am nächsten an Grün."
assert naechste_farbe((0, 0, 0), [(1, 0, 0), (0, 1, 0)]) == (1, 0, 0), "Bei Gleichstand gewinnt die erste Palettenfarbe."
assert naechste_farbe((5, 5, 5), [(5, 5, 5)]) == (5, 5, 5), "Eine identische Farbe hat Abstand 0."
assert naechste_farbe((1, 2, 3), []) is None, "Bei leerer Palette: None."
`,
        },
      ],

      sandbox: py`# Sandbox — Tuple
standort = (48.1372, 11.5756, 519)
breite, laenge, hoehe = standort
print(breite, laenge, hoehe)

# Versuche mal: standort[0] = 0
print(standort + (1,))      # ein neues Tuple
print(len(standort), standort.count(519))
`,
    },
    /* ------------------------------------------------------------------ 8 */
    {
      id: 8, slug: 'stack', title: 'Stack (LIFO)',
      subtitle: 'Last In, First Out',
      group: 'struktur', icon: '▤↑', status: 'ready',
      scenario: 'Undo-Historie im Texteditor',
      lead: 'Strg+Z macht immer die <strong>letzte</strong> Aktion rückgängig. Genau das leistet ein <strong>Stack</strong>: Elemente werden oben draufgelegt (<code>push</code>) und nur oben wieder entnommen (<code>pop</code>). In Python reicht dafür eine Liste mit <code>append</code> und <code>pop()</code>.',

      scenes: [
        {
          id: 'teller',
          title: 'Tellerstapel',
          blurb: 'Teller kommen nur oben drauf und gehen nur oben weg. Probiere auch, den untersten Teller zu ziehen.',
          visual: 'stackPlates',
          config: {
            capacity: 7,
            names: ['Dokument A', 'Dokument B', 'Dokument C', 'Dokument D', 'Dokument E', 'Dokument F', 'Dokument G'],
            start: ['Dokument A', 'Dokument B'],
          },
        },
        {
          id: 'undo',
          title: 'Undo-Historie',
          blurb: 'Jede Aktion wandert auf den Stack. Strg+Z holt die oberste wieder herunter.',
          visual: 'undoEditor',
          config: {
            actions: [
              { label: '„Hallo“ tippen', text: 'Hallo' },
              { label: '„Welt“ tippen', text: 'Welt' },
              { label: '„Python“ tippen', text: 'Python' },
              { label: '„!“ tippen', text: '!' },
            ],
          },
        },
      ],

      tasks: [
        {
          id: 's1', level: 'Init', title: 'Leere Historie',
          scenario: 'Der Texteditor startet ohne bisherige Aktionen. Die Undo-Historie ist ein Stack, der mit einer leeren Liste beginnt.',
          goal: 'Lege den Stack <code>undo_stack</code> als <strong>leere Liste</strong> an. Speichere in <code>ist_leer</code> einen Wahrheitswert (<code>True</code>/<code>False</code>), der <em>berechnet</em> angibt, ob der Stack leer ist.',
          hint: 'Eine leere Liste ist <code>[]</code>. Ob eine Liste leer ist, verrät <code>len(undo_stack) == 0</code>.',
          starter: py`# Undo-Historie des Editors

`,
          solution: py`undo_stack = []
ist_leer = len(undo_stack) == 0
`,
          tests: py`
assert type(undo_stack) is list, "undo_stack muss eine Liste sein."
assert undo_stack == [], "undo_stack muss am Anfang leer sein."
assert ist_leer is True, "ist_leer muss True sein (der Stack ist leer)."
assert "len(" in _source or "not " in _source, "Berechne ist_leer, statt True einfach hinzuschreiben."
`,
        },
        {
          id: 's2', level: 'Update', title: 'Push & Pop',
          scenario: 'Der Nutzer macht drei Änderungen am Dokument und drückt dann einmal Strg+Z.',
          goal: 'Lege nacheinander die Aktionen <code>"Text eingefügt"</code>, <code>"Fett"</code> und <code>"Zeile gelöscht"</code> mit <code>append</code> auf <code>undo_stack</code>. Mache dann die oberste Aktion mit <code>pop()</code> rückgängig und speichere sie in <code>rueckgaengig</code>.',
          hint: '<code>push</code> heißt bei Listen <code>append</code>, <code>pop()</code> ohne Argument nimmt das letzte Element weg und gibt es zurück.',
          starter: py`undo_stack = []

# drei Aktionen pushen, dann eine rückgängig machen
`,
          solution: py`undo_stack = []

undo_stack.append("Text eingefügt")
undo_stack.append("Fett")
undo_stack.append("Zeile gelöscht")

rueckgaengig = undo_stack.pop()
`,
          tests: py`
assert _source.count(".append(") >= 3, "Lege jede der drei Aktionen mit append auf den Stack."
assert ".pop(" in _source, "Nutze pop(), um die letzte Aktion zu entfernen."
assert rueckgaengig == "Zeile gelöscht", f"rueckgaengig ist {rueckgaengig!r} — es muss die zuletzt gepushte Aktion sein."
assert undo_stack == ["Text eingefügt", "Fett"], f"undo_stack ist {undo_stack} — erwartet: die beiden ersten Aktionen."
`,
        },
        {
          id: 's3', level: 'Debugging', title: 'Falsche Reihenfolge',
          scenario: 'Strg+Z macht im Editor die falsche Aktion rückgängig: nicht die letzte, sondern die älteste. Außerdem landet die neue Aktion unten statt oben.',
          goal: 'Repariere beide LIFO-Fehler. Am Ende soll <code>"Rückgängig: löschen"</code> ausgegeben werden, und <code>undo_stack</code> ist <code>["tippen", "fett", "kursiv"]</code> (neue Aktion oben).',
          hint: 'Bei einem Stack passiert alles am <em>Ende</em> der Liste: <code>append(x)</code> legt oben drauf, <code>pop()</code> nimmt von oben. Index <code>0</code> ist das <em>untere</em> Ende.',
          starter: py`undo_stack = ["tippen", "fett", "löschen"]

letzte = undo_stack.pop(0)
print("Rückgängig:", letzte)

undo_stack.insert(0, "kursiv")
`,
          solution: py`undo_stack = ["tippen", "fett", "löschen"]

letzte = undo_stack.pop()
print("Rückgängig:", letzte)

undo_stack.append("kursiv")
`,
          tests: py`
assert letzte == "löschen", f"letzte ist {letzte!r} — beim Stack kommt die zuletzt hinzugefügte Aktion zuerst heraus."
assert "Rückgängig: löschen" in _stdout, "Die Ausgabe muss 'Rückgängig: löschen' enthalten."
assert undo_stack == ["tippen", "fett", "kursiv"], f"undo_stack ist {undo_stack} — die neue Aktion gehört ans Ende (oben)."
`,
        },
        {
          id: 's4', level: 'Edge Case', title: 'Undo auf leerem Stack',
          scenario: 'Der Nutzer drückt Strg+Z, obwohl er noch nichts getan hat. pop() auf einer leeren Liste würde den Editor mit einem IndexError abstürzen lassen.',
          goal: 'Schreibe <code>rueckgaengig(stack)</code>. Sie nimmt die oberste Aktion vom Stack und gibt sie zurück. Ist der Stack leer, gibt sie den Text <code>"Nichts zum Rückgängigmachen"</code> zurück und lässt den Stack unverändert.',
          hint: 'Prüfe <em>vor</em> dem <code>pop()</code>: <code>if len(stack) == 0:</code> oder kurz <code>if not stack:</code>.',
          starter: py`def rueckgaengig(stack):
    pass
`,
          solution: py`def rueckgaengig(stack):
    if not stack:
        return "Nichts zum Rückgängigmachen"
    return stack.pop()
`,
          tests: py`
s = ["tippen", "fett"]
assert rueckgaengig(s) == "fett", "Die oberste Aktion (zuletzt hinzugefügt) muss zurückkommen."
assert s == ["tippen"], "Die Aktion muss vom Stack entfernt werden."
assert rueckgaengig(s) == "tippen"
assert s == [], "Nach zwei Undos ist der Stack leer."
assert rueckgaengig(s) == "Nichts zum Rückgängigmachen", "Auf leerem Stack: Hinweistext zurückgeben statt abzustürzen."
assert s == [], "Der leere Stack bleibt leer."
`,
        },
        {
          id: 's5', level: 'Algorithmus', title: 'Klammerprüfung',
          scenario: 'Der Code-Editor markiert Syntaxfehler: Zu jeder öffnenden Klammer <code>( [ {</code> muss die passende schließende in der richtigen Reihenfolge kommen. Alle anderen Zeichen sind egal.',
          goal: 'Schreibe <code>klammern_ok(code)</code>, die <code>True</code> zurückgibt, wenn alle Klammern richtig geschlossen und verschachtelt sind, sonst <code>False</code>. Benutze einen Stack. Beispiele: <code>"print(a[0])"</code> → True, <code>"(]"</code> → False, <code>"(("</code> → False.',
          hint: 'Gehe Zeichen für Zeichen durch. Öffnende Klammer: pushen. Schließende: oberstes Element muss die passende öffnende sein (sonst <code>False</code>) und wird gepoppt. Am Ende muss der Stack leer sein. Ein Dictionary <code>{")": "(", …}</code> hilft beim Zuordnen.',
          starter: py`def klammern_ok(code):
    pass
`,
          solution: py`def klammern_ok(code):
    paare = {")": "(", "]": "[", "}": "{"}
    stack = []
    for zeichen in code:
        if zeichen in "([{":
            stack.append(zeichen)
        elif zeichen in paare:
            if not stack or stack.pop() != paare[zeichen]:
                return False
    return len(stack) == 0
`,
          tests: py`
assert klammern_ok("print(a[0])") is True, '"print(a[0])" ist korrekt geklammert.'
assert klammern_ok("{[()]}") is True, '"{[()]}" ist korrekt verschachtelt.'
assert klammern_ok("") is True, "Ohne Klammern ist alles in Ordnung."
assert klammern_ok("x = 5 + 3") is True, "Text ohne Klammern ist in Ordnung."
assert klammern_ok("(]") is False, '"(]" passt nicht zusammen.'
assert klammern_ok("{[(])}") is False, '"{[(])}" ist falsch verschachtelt.'
assert klammern_ok("((") is False, "Offene Klammern am Ende → False."
assert klammern_ok(")") is False, "Schließende Klammer ohne öffnende → False (kein pop auf leerem Stack!)."
assert klammern_ok("())(") is False, '"())(" hat die Klammern in falscher Reihenfolge.'
`,
        },
      ],

      sandbox: py`# Sandbox — Stack
stack = []

stack.append("tippen")
stack.append("fett")
stack.append("löschen")
print("Stack:", stack)

print("Oben:", stack[-1])
print("Pop:", stack.pop())
print("Stack:", stack)
`,
    },
    /* ------------------------------------------------------------------ 9 */
    {
      id: 9, slug: 'queue', title: 'Queue (FIFO)',
      subtitle: 'First In, First Out',
      group: 'struktur', icon: '▤→', status: 'ready',
      scenario: 'IT-Support-Ticketsystem',
      lead: 'Im Support gilt: <strong>Wer zuerst kommt, mahlt zuerst.</strong> Neue Tickets stellen sich hinten an, bearbeitet wird vorn. Eine <strong>Queue</strong> arbeitet nach dem FIFO-Prinzip — in Python mit <code>append</code> (hinten rein) und <code>pop(0)</code> (vorn raus).',

      scenes: [
        {
          id: 'schlange',
          title: 'Ticket-Warteschlange',
          blurb: 'Tickets kommen hinten herein und verlassen die Schlange vorn am Support-Schalter. Im Auto-Betrieb läuft der Support-Alltag von allein.',
          visual: 'queueLine',
          config: {
            capacity: 8,
            tickets: ['T-101', 'T-102', 'T-103', 'T-104', 'T-105', 'T-106', 'T-107', 'T-108', 'T-109', 'T-110', 'T-111', 'T-112'],
            start: 3,
          },
        },
      ],

      tasks: [
        {
          id: 'q1', level: 'Init', title: 'Warteschlange anlegen',
          scenario: 'Drei Mitarbeiter haben nacheinander ein Ticket eingereicht: T-101, T-102 und T-103 — in dieser Reihenfolge.',
          goal: 'Lege die Liste <code>warteschlange</code> mit den drei Tickets in Ankunftsreihenfolge an. Berechne außerdem <code>naechstes</code> (das Ticket, das als Erstes dran ist) und <code>laenge</code> (Anzahl wartender Tickets).',
          hint: 'Wer zuerst kam, steht vorn — also an Index <code>0</code>. Die Länge liefert <code>len()</code>.',
          starter: py`# Support-Warteschlange

`,
          solution: py`warteschlange = ["T-101", "T-102", "T-103"]
naechstes = warteschlange[0]
laenge = len(warteschlange)
`,
          tests: py`
assert warteschlange == ["T-101", "T-102", "T-103"], "Die Warteschlange muss die Tickets in Ankunftsreihenfolge enthalten."
assert naechstes == "T-101", "naechstes ist das Ticket vorn (Index 0), nicht hinten."
assert laenge == 3 and "len(" in _source, "laenge soll mit len() berechnet werden."
`,
        },
        {
          id: 'q2', level: 'Update', title: 'Ankunft & Bearbeitung',
          scenario: 'Während der Support arbeitet, kommt ein neues Ticket an. Danach wird das älteste Ticket bearbeitet und verlässt die Schlange.',
          goal: 'Hänge <code>"T-3"</code> hinten an <code>warteschlange</code> an (<code>append</code>). Entnimm danach das <strong>vorderste</strong> Ticket mit <code>pop(0)</code> und speichere es in <code>bearbeitet</code>.',
          hint: '<code>append(x)</code> stellt hinten an. <code>pop(0)</code> nimmt das Element mit Index 0 heraus und gibt es zurück.',
          starter: py`warteschlange = ["T-1", "T-2"]

# neues Ticket T-3, danach ein Ticket bearbeiten
`,
          solution: py`warteschlange = ["T-1", "T-2"]

warteschlange.append("T-3")
bearbeitet = warteschlange.pop(0)
`,
          tests: py`
assert ".append(" in _source, "Nutze append, um das neue Ticket hinten anzustellen."
assert ".pop(0)" in _source.replace(" ", ""), "Nutze pop(0), um das vorderste Ticket zu entnehmen."
assert bearbeitet == "T-1", f"bearbeitet ist {bearbeitet!r} — beim FIFO kommt das älteste Ticket zuerst dran."
assert warteschlange == ["T-2", "T-3"], f"warteschlange ist {warteschlange} — erwartet: ['T-2', 'T-3']."
`,
        },
        {
          id: 'q3', level: 'Debugging', title: 'Falsche Entnahme',
          scenario: 'Ein Praktikant hat die Abarbeitung gebaut — aber die Kunden beschweren sich: Die ältesten Tickets werden zuletzt bearbeitet. Das ist ein Stack-Verhalten, keine Queue!',
          goal: 'Repariere die Schleife, sodass die Tickets in Ankunftsreihenfolge bearbeitet werden: <code>reihenfolge</code> muss am Ende <code>["T-101", "T-102", "T-103", "T-104"]</code> sein und <code>warteschlange</code> leer.',
          hint: 'Das Element mit Index <code>len(warteschlange) - 1</code> ist das <em>letzte</em>. Wo steht das Ticket, das am längsten wartet?',
          starter: py`warteschlange = ["T-101", "T-102", "T-103", "T-104"]
reihenfolge = []

while len(warteschlange) > 0:
    ticket = warteschlange.pop(len(warteschlange) - 1)
    reihenfolge.append(ticket)

print(reihenfolge)
`,
          solution: py`warteschlange = ["T-101", "T-102", "T-103", "T-104"]
reihenfolge = []

while len(warteschlange) > 0:
    ticket = warteschlange.pop(0)
    reihenfolge.append(ticket)

print(reihenfolge)
`,
          tests: py`
assert reihenfolge == ["T-101", "T-102", "T-103", "T-104"], f"reihenfolge ist {reihenfolge} — das älteste Ticket muss zuerst bearbeitet werden."
assert warteschlange == [], "Am Ende muss die Warteschlange leer sein."
assert "T-101" in _stdout, "Gib die Reihenfolge mit print aus."
`,
        },
        {
          id: 'q4', level: 'Edge Case', title: 'Schichtbeginn',
          scenario: 'Zu Schichtbeginn bearbeitet ein Mitarbeiter mehrere Tickets am Stück. Manchmal sind weniger Tickets da als geplant — oder gar keine.',
          goal: 'Schreibe <code>bearbeite(warteschlange, anzahl)</code>. Sie entnimmt bis zu <code>anzahl</code> Tickets von <strong>vorn</strong> aus der Warteschlange und gibt sie als Liste in Bearbeitungsreihenfolge zurück. Ist die Schlange kürzer, werden nur die vorhandenen entnommen; bei <code>anzahl &lt;= 0</code> oder leerer Schlange ist das Ergebnis <code>[]</code>.',
          hint: 'Ein <code>while</code> mit zwei Bedingungen: es ist noch etwas in der Schlange <em>und</em> du hast noch nicht genug bearbeitet. Ein pop(0) auf leerer Liste würde einen IndexError auslösen.',
          starter: py`def bearbeite(warteschlange, anzahl):
    pass
`,
          solution: py`def bearbeite(warteschlange, anzahl):
    erledigt = []
    while len(warteschlange) > 0 and len(erledigt) < anzahl:
        erledigt.append(warteschlange.pop(0))
    return erledigt
`,
          tests: py`
q = ["T-1", "T-2", "T-3", "T-4"]
assert bearbeite(q, 2) == ["T-1", "T-2"], "Die ersten zwei Tickets (vorn) sollen bearbeitet werden."
assert q == ["T-3", "T-4"], "Bearbeitete Tickets müssen aus der Schlange verschwinden."
assert bearbeite(q, 10) == ["T-3", "T-4"], "Gibt es weniger Tickets als angefordert, werden nur die vorhandenen entnommen."
assert q == [], "Danach ist die Schlange leer."
assert bearbeite(q, 3) == [], "Leere Schlange → leere Liste (kein IndexError)."
r = ["T-9"]
assert bearbeite(r, 0) == [] and r == ["T-9"], "anzahl 0 → nichts entnehmen."
assert bearbeite(r, -2) == [] and r == ["T-9"], "Negative anzahl → nichts entnehmen."
`,
        },
        {
          id: 'q5', level: 'Algorithmus', title: 'Durchschnittliche Wartezeit',
          scenario: 'Alle Tickets liegen um 9:00 Uhr bereit, der Support bearbeitet sie strikt nacheinander (FIFO). Jedes Ticket hat eine Bearbeitungsdauer in Minuten. Wie lange wartet ein Ticket im Schnitt, bis es drankommt?',
          goal: 'Schreibe <code>durchschnittliche_wartezeit(dauern)</code>. <code>dauern</code> ist die Liste der Bearbeitungszeiten in Ankunftsreihenfolge. Die Wartezeit eines Tickets ist die Summe der Dauern aller Tickets <em>vor</em> ihm. Gib den Durchschnitt aller Wartezeiten zurück, auf 2 Nachkommastellen gerundet. Ohne Tickets ist das Ergebnis <code>0.0</code>. Verändere die übergebene Liste nicht.',
          hint: 'Beispiel <code>[5, 3, 2]</code>: Wartezeiten 0, 5, 8 → Durchschnitt 4.33. Simuliere mit einem laufenden Zähler <code>uhr</code>: Wartezeit = aktueller Stand von <code>uhr</code>, danach <code>uhr += dauer</code>.',
          starter: py`def durchschnittliche_wartezeit(dauern):
    pass
`,
          solution: py`def durchschnittliche_wartezeit(dauern):
    if len(dauern) == 0:
        return 0.0
    uhr = 0
    gesamt_wartezeit = 0
    for dauer in dauern:
        gesamt_wartezeit += uhr
        uhr += dauer
    return round(gesamt_wartezeit / len(dauern), 2)
`,
          tests: py`
assert durchschnittliche_wartezeit([5, 3, 2]) == 4.33, "Für [5, 3, 2] sind die Wartezeiten 0, 5 und 8."
assert durchschnittliche_wartezeit([1, 1, 1, 1]) == 1.5, "Für [1, 1, 1, 1] sind die Wartezeiten 0, 1, 2, 3."
assert durchschnittliche_wartezeit([10]) == 0.0, "Das erste Ticket wartet nie."
assert durchschnittliche_wartezeit([]) == 0.0, "Ohne Tickets: 0.0."
assert type(durchschnittliche_wartezeit([4, 4])) is float, "Das Ergebnis muss ein float sein."
original = [2, 4, 6]
assert durchschnittliche_wartezeit(original) == 2.67, "Für [2, 4, 6] sind die Wartezeiten 0, 2 und 6."
assert original == [2, 4, 6], "Verändere die übergebene Liste nicht."
`,
        },
      ],

      sandbox: py`# Sandbox — Queue
tickets = []

tickets.append("T-101")
tickets.append("T-102")
tickets.append("T-103")
print("Schlange:", tickets)

dran = tickets.pop(0)
print("Bearbeite:", dran)
print("Wartend:", tickets)

# Tipp: Für große Warteschlangen gibt es collections.deque
from collections import deque
q = deque(["A", "B", "C"])
print(q.popleft(), q)
`,
    },
    /* ----------------------------------------------------------------- 10 */
    {
      id: 10, slug: 'linkedlist', title: 'Linked List',
      subtitle: 'Knoten und next-Zeiger',
      group: 'struktur', icon: '○→○', status: 'ready',
      scenario: 'Musik-Playlist',
      lead: 'In einer Playlist hängt jeder Song am nächsten: Jeder <strong>Knoten (Node)</strong> kennt seinen Inhalt und einen <code>next</code>-Zeiger auf den Nachfolger. Die Knoten liegen irgendwo im Speicher — eingefügt wird, indem man <strong>nur Zeiger umbiegt</strong>, nicht indem man Elemente verschiebt.',

      scenes: [
        {
          id: 'knoten',
          title: 'Zeiger umbiegen',
          blurb: 'Vier Songs liegen verstreut im Speicher. Wähle den Vorgänger und füge einen neuen Song ein — beobachte, welche Pfeile sich ändern (und welche Knoten sich nicht bewegen).',
          visual: 'linkedNodes',
          config: {
            songs: ['Intro', 'Midnight', 'Skyline', 'Outro'],
            newSong: 'Neuer Song',
          },
        },
      ],

      tasks: [
        {
          id: 'ln1', level: 'Init', title: 'Die Node-Klasse',
          scenario: 'Die Playlist-App braucht einen Baustein: Einen Knoten, der einen Songtitel trägt und auf den nächsten Song zeigt.',
          goal: 'Schreibe die Klasse <code>Node</code>. Der Konstruktor <code>__init__(self, titel, next=None)</code> speichert beide Werte als Attribute <code>self.titel</code> und <code>self.next</code>. Ein einzelner Knoten zeigt standardmäßig auf <code>None</code> (Ende der Kette).',
          hint: 'Eine Klasse beginnt mit <code>class Node:</code>, darin <code>def __init__(self, titel, next=None):</code>. Mit <code>self.titel = titel</code> speicherst du den Wert im Objekt.',
          starter: py`class Node:
    pass
`,
          solution: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next
`,
          tests: py`
a = Node("Intro")
assert a.titel == "Intro", "Node muss den Titel in self.titel speichern."
assert a.next is None, "Ohne Angabe zeigt next auf None."
b = Node("Midnight", a)
assert b.next is a, "Wird ein Nachfolger übergeben, muss self.next auf genau diesen Knoten zeigen."
assert b.titel == "Midnight"
`,
        },
        {
          id: 'ln2', level: 'Update', title: 'Song am Ende anhängen',
          scenario: 'Der Nutzer fügt einen neuen Song ans Ende seiner Playlist an. Die Playlist ist nur über ihren ersten Knoten (<code>head</code>) erreichbar.',
          goal: 'Schreibe <code>anhaengen(head, titel)</code>. Sie hängt einen neuen Knoten ans Ende der Kette und gibt den <code>head</code> zurück. Ist die Playlist noch leer (<code>head</code> ist <code>None</code>), ist der neue Knoten selbst der Kopf.',
          hint: 'Wandere mit <code>aktuell = head</code> und <code>while aktuell.next is not None: aktuell = aktuell.next</code> bis zum letzten Knoten, dann <code>aktuell.next = Node(titel)</code>.',
          starter: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def anhaengen(head, titel):
    pass
`,
          solution: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def anhaengen(head, titel):
    neu = Node(titel)
    if head is None:
        return neu
    aktuell = head
    while aktuell.next is not None:
        aktuell = aktuell.next
    aktuell.next = neu
    return head
`,
          tests: py`
def _liste(h):
    out = []
    while h is not None:
        out.append(h.titel)
        h = h.next
    return out

kopf = Node("A", Node("B"))
ergebnis = anhaengen(kopf, "C")
assert ergebnis is kopf, "anhaengen muss den unveränderten Kopf zurückgeben."
assert _liste(kopf) == ["A", "B", "C"], f"Die Kette ist {_liste(kopf)} — erwartet: A → B → C."
anhaengen(kopf, "D")
assert _liste(kopf) == ["A", "B", "C", "D"], "Mehrfaches Anhängen muss immer am Ende landen."
neu = anhaengen(None, "Solo")
assert neu is not None and neu.titel == "Solo" and neu.next is None, "Bei leerer Playlist ist der neue Knoten der Kopf."
`,
        },
        {
          id: 'ln3', level: 'Debugging', title: 'Der gerissene Zeiger',
          scenario: 'Beim Einfügen eines Songs in die Mitte der Playlist verschwindet plötzlich der ganze Rest. Der Zeiger-Tausch ist in der falschen Reihenfolge.',
          goal: 'Repariere <code>einfuegen_nach(knoten, titel)</code>. Sie soll einen neuen Knoten direkt <strong>hinter</strong> <code>knoten</code> einfügen, ohne den Rest der Kette zu verlieren, und den neuen Knoten zurückgeben.',
          hint: 'Der neue Knoten muss <em>zuerst</em> auf den bisherigen Nachfolger zeigen (<code>neu.next = knoten.next</code>). Erst danach darf <code>knoten.next</code> auf den neuen Knoten umgebogen werden.',
          starter: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def einfuegen_nach(knoten, titel):
    neu = Node(titel)
    knoten.next = neu
    return neu
`,
          solution: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def einfuegen_nach(knoten, titel):
    neu = Node(titel)
    neu.next = knoten.next
    knoten.next = neu
    return neu
`,
          tests: py`
def _liste(h):
    out = []
    while h is not None:
        out.append(h.titel)
        h = h.next
    return out

a = Node("A", Node("B", Node("C")))
x = einfuegen_nach(a, "X")
assert x.titel == "X", "Die Funktion soll den neuen Knoten zurückgeben."
assert _liste(a) == ["A", "X", "B", "C"], f"Die Kette ist {_liste(a)} — der Rest nach dem neuen Knoten darf nicht verloren gehen."
c = a.next.next.next
assert c.titel == "C"
y = einfuegen_nach(c, "Z")
assert _liste(a) == ["A", "X", "B", "C", "Z"], "Einfügen hinter dem letzten Knoten muss auch funktionieren."
assert y.next is None, "Der neue letzte Knoten zeigt auf None."
`,
        },
        {
          id: 'ln4', level: 'Edge Case', title: 'Song suchen',
          scenario: 'Die Suche in der Playlist soll die Position eines Songs liefern. Besonders knifflig: leere Playlists und Songs, die gar nicht vorkommen — die Suche läuft dann bis über das Ende hinaus.',
          goal: 'Schreibe <code>suche(head, titel)</code>. Sie gibt den <strong>Index</strong> (ab 0) des ersten Knotens mit diesem Titel zurück. Ist die Playlist leer oder der Titel nicht vorhanden, ist das Ergebnis <code>-1</code> — ohne Absturz (<code>AttributeError</code> auf <code>None</code>).',
          hint: 'Starte mit <code>aktuell = head</code> und <code>index = 0</code>. Die Schleifenbedingung <code>while aktuell is not None</code> deckt leere Listen <em>und</em> das Ende der Kette ab.',
          starter: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def suche(head, titel):
    pass
`,
          solution: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def suche(head, titel):
    aktuell = head
    index = 0
    while aktuell is not None:
        if aktuell.titel == titel:
            return index
        aktuell = aktuell.next
        index += 1
    return -1
`,
          tests: py`
kopf = Node("Intro", Node("Midnight", Node("Skyline")))
assert suche(kopf, "Intro") == 0, "Der erste Song hat Index 0."
assert suche(kopf, "Midnight") == 1, "Midnight steht an Index 1."
assert suche(kopf, "Skyline") == 2, "Der letzte Song muss gefunden werden."
assert suche(kopf, "Outro") == -1, "Nicht vorhandener Titel → -1 (nicht abstürzen am Kettenende)."
assert suche(None, "Intro") == -1, "Leere Playlist → -1."
dopp = Node("A", Node("B", Node("A")))
assert suche(dopp, "A") == 0, "Bei Duplikaten zählt der erste Treffer."
`,
        },
        {
          id: 'ln5', level: 'Algorithmus', title: 'An Position einfügen',
          scenario: 'Per Drag & Drop zieht der Nutzer einen Song an eine bestimmte Stelle der Playlist. Die Kette muss genau dort aufgetrennt und wieder verbunden werden.',
          goal: 'Schreibe <code>einfuegen_an(head, index, titel)</code>. Sie fügt einen neuen Knoten an der Position <code>index</code> ein (0 = ganz vorn) und gibt den (ggf. neuen) <code>head</code> zurück. <code>index</code> gleich der Länge hängt am Ende an. Ist <code>index</code> negativ oder größer als die Länge, löse <code>IndexError</code> aus.',
          hint: 'Index 0 ist ein Sonderfall: der neue Knoten wird zum Kopf (<code>Node(titel, head)</code>). Sonst gehst du <code>index - 1</code> Schritte bis zum Vorgänger und biegst dort die Zeiger um (erst <code>neu.next</code>, dann <code>vorgaenger.next</code>). Zeigt der Weg ins Leere, ist der Index zu groß.',
          starter: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def einfuegen_an(head, index, titel):
    pass
`,
          solution: py`class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

def einfuegen_an(head, index, titel):
    if index < 0:
        raise IndexError("Index außerhalb der Playlist")
    if index == 0:
        return Node(titel, head)
    vorgaenger = head
    for _ in range(index - 1):
        if vorgaenger is None:
            break
        vorgaenger = vorgaenger.next
    if vorgaenger is None:
        raise IndexError("Index außerhalb der Playlist")
    vorgaenger.next = Node(titel, vorgaenger.next)
    return head
`,
          tests: py`
def _liste(h):
    out = []
    while h is not None:
        out.append(h.titel)
        h = h.next
    return out

def _bauen(*titel):
    h = None
    for t in reversed(titel):
        h = Node(t, h)
    return h

k = _bauen("A", "B", "C")
k = einfuegen_an(k, 0, "X")
assert _liste(k) == ["X", "A", "B", "C"], f"Einfügen an Index 0 ergibt {_liste(k)} — der neue Knoten muss der Kopf werden."
k = einfuegen_an(k, 2, "Y")
assert _liste(k) == ["X", "A", "Y", "B", "C"], f"Einfügen an Index 2 ergibt {_liste(k)}."
k = einfuegen_an(k, 5, "Z")
assert _liste(k) == ["X", "A", "Y", "B", "C", "Z"], "Index gleich der Länge hängt am Ende an."
assert _liste(einfuegen_an(None, 0, "Solo")) == ["Solo"], "In eine leere Playlist an Index 0 einfügen."
for bad in (-1, 4):
    try:
        einfuegen_an(_bauen("A", "B", "C"), bad, "Q")
        raised = False
    except IndexError:
        raised = True
    assert raised, f"Index {bad} bei Länge 3 muss einen IndexError auslösen."
try:
    einfuegen_an(None, 1, "Q")
    raised = False
except IndexError:
    raised = True
assert raised, "In einer leeren Playlist ist nur Index 0 erlaubt."
`,
        },
      ],

      sandbox: py`# Sandbox — Linked List
class Node:
    def __init__(self, titel, next=None):
        self.titel = titel
        self.next = next

head = Node("Intro", Node("Midnight", Node("Skyline")))

aktuell = head
while aktuell is not None:
    print(aktuell.titel, "->", aktuell.next.titel if aktuell.next else "None")
    aktuell = aktuell.next
`,
    },
    /* ----------------------------------------------------------------- 11 */
    {
      id: 11, slug: 'dict', title: 'Dictionary',
      subtitle: 'Schlüssel-Wert-Paare (Hash Map)',
      group: 'struktur', icon: '{:}', status: 'ready',
      scenario: 'Inventar & Preissystem',
      lead: 'Ein Online-Shop schlägt Preise nach Artikelnamen nach — nicht nach Positionsnummern. Ein <strong>Dictionary</strong> speichert <strong>Schlüssel-Wert-Paare</strong> und findet jeden Eintrag in praktisch konstanter Zeit, weil intern eine <strong>Hash-Tabelle</strong> arbeitet.',

      scenes: [
        {
          id: 'hash',
          title: 'Hash-Tabelle',
          blurb: 'Der Schlüssel wird durch eine Hash-Funktion zu einer Zahl und landet direkt im passenden Bucket. Speichere Artikel (put) und rufe sie ab (get).',
          visual: 'hashTable',
          config: {
            buckets: 7,
            keys: ['Laptop', 'Maus', 'Monitor', 'Tastatur', 'Webcam', 'Kabel'],
            prices: { Laptop: 899, Maus: 19.9, Monitor: 249, Tastatur: 49, Webcam: 59, Kabel: 7.5 },
          },
        },
      ],

      tasks: [
        {
          id: 'd1', level: 'Init', title: 'Preisliste anlegen',
          scenario: 'Der Shop startet mit drei Artikeln. Die Preisliste soll Artikelnamen mit Preisen verbinden.',
          goal: 'Lege das Dictionary <code>preise</code> an: <code>"Laptop"</code> → <code>899.0</code>, <code>"Maus"</code> → <code>19.9</code>, <code>"Monitor"</code> → <code>249.0</code>. Speichere in <code>anzahl</code> die Anzahl der Artikel (berechnet) und in <code>laptop_preis</code> den Preis des Laptops, <em>aus dem Dictionary gelesen</em>.',
          hint: 'Dictionaries stehen in geschweiften Klammern: <code>{"schluessel": wert, …}</code>. Zugriff: <code>preise["Laptop"]</code>. Die Anzahl der Paare liefert <code>len()</code>.',
          starter: py`# Preisliste des Shops

`,
          solution: py`preise = {"Laptop": 899.0, "Maus": 19.9, "Monitor": 249.0}
anzahl = len(preise)
laptop_preis = preise["Laptop"]
`,
          tests: py`
assert type(preise) is dict, "preise muss ein Dictionary sein (geschweifte Klammern mit Doppelpunkten)."
assert preise == {"Laptop": 899.0, "Maus": 19.9, "Monitor": 249.0}, "Das Dictionary enthält nicht genau die drei Artikel mit ihren Preisen."
assert anzahl == 3 and "len(" in _source, "anzahl soll mit len() berechnet werden."
assert laptop_preis == 899.0 and 'preise["Laptop"]' in _source.replace("'", '"'), "Lies laptop_preis mit preise[\"Laptop\"] aus dem Dictionary."
`,
        },
        {
          id: 'd2', level: 'Update', title: 'Neu & aktualisiert',
          scenario: 'Zum Wochenstart kommt ein neuer Artikel ins Sortiment, und der Lieferant meldet Preisänderungen.',
          goal: 'Füge <code>"Monitor"</code> mit <code>249.0</code> per <strong>direkter Zuweisung</strong> hinzu. Danach aktualisierst du mit <code>.update()</code> in einem Schritt: <code>"Tastatur"</code> kostet jetzt <code>44.0</code> (Preisänderung) und <code>"Webcam"</code> kommt neu mit <code>59.0</code> dazu.',
          hint: 'Zuweisung: <code>preise["Monitor"] = 249.0</code>. <code>preise.update({…})</code> fügt neue Schlüssel hinzu <em>und</em> überschreibt vorhandene.',
          starter: py`preise = {"Maus": 19.9, "Tastatur": 49.0}

# Monitor per Zuweisung, dann Tastatur & Webcam mit update()
`,
          solution: py`preise = {"Maus": 19.9, "Tastatur": 49.0}

preise["Monitor"] = 249.0
preise.update({"Tastatur": 44.0, "Webcam": 59.0})
`,
          tests: py`
assert ".update(" in _source, "Nutze .update() für Tastatur und Webcam."
assert "[" in _source.split(".update(")[0].split("preise = ")[1], "Füge den Monitor per direkter Zuweisung hinzu: preise[...] = ..."
assert preise == {"Maus": 19.9, "Tastatur": 44.0, "Monitor": 249.0, "Webcam": 59.0}, f"preise ist {preise} — erwartet: Tastatur 44.0, Monitor und Webcam neu."
`,
        },
        {
          id: 'd3', level: 'Debugging', title: 'KeyError im Lager',
          scenario: 'Die Wunschliste eines Kunden enthält einen Artikel, den der Shop nicht führt. Das Skript stürzt mit KeyError ab.',
          goal: 'Repariere die Schleife mit <code>.get()</code>, sodass drei Zeilen erscheinen: <code>Laptop 899.0</code>, <code>Maus 19.9</code> und <code>Monitor nicht im Sortiment</code>.',
          hint: '<code>preise[artikel]</code> wirft einen KeyError, wenn der Schlüssel fehlt. <code>preise.get(artikel, ersatzwert)</code> liefert stattdessen den Ersatzwert.',
          starter: py`preise = {"Laptop": 899.0, "Maus": 19.9}
wunschliste = ["Laptop", "Maus", "Monitor"]

for artikel in wunschliste:
    print(artikel, preise[artikel])
`,
          solution: py`preise = {"Laptop": 899.0, "Maus": 19.9}
wunschliste = ["Laptop", "Maus", "Monitor"]

for artikel in wunschliste:
    print(artikel, preise.get(artikel, "nicht im Sortiment"))
`,
          tests: py`
zeilen = _stdout.strip().splitlines()
assert zeilen == ["Laptop 899.0", "Maus 19.9", "Monitor nicht im Sortiment"], f"Die Ausgabe ist {zeilen} — erwartet sind drei Zeilen, die letzte mit 'nicht im Sortiment'."
assert ".get(" in _source, "Nutze .get() mit einem Ersatzwert."
assert preise == {"Laptop": 899.0, "Maus": 19.9}, "Verändere das Dictionary preise nicht."
`,
        },
        {
          id: 'd4', level: 'Edge Case', title: 'Produktdetails',
          scenario: 'Der Katalog speichert pro Artikel ein eigenes Dictionary mit Details (Preis, Lagerbestand, …). Die Detailseite fragt Felder ab, die manchmal fehlen — oder zu einem Artikel, den es nicht gibt.',
          goal: 'Schreibe <code>produkt_info(katalog, artikel, feld)</code>. Sie gibt <code>katalog[artikel][feld]</code> zurück. Fehlt der Artikel <em>oder</em> das Feld (oder ist der Katalog leer), ist das Ergebnis <code>None</code> — kein <code>KeyError</code>.',
          hint: 'Hole zuerst die Details mit <code>katalog.get(artikel)</code> (ergibt <code>None</code>, wenn es den Artikel nicht gibt). Nur wenn das nicht <code>None</code> ist, darfst du mit <code>.get(feld)</code> weitermachen.',
          starter: py`def produkt_info(katalog, artikel, feld):
    pass
`,
          solution: py`def produkt_info(katalog, artikel, feld):
    details = katalog.get(artikel)
    if details is None:
        return None
    return details.get(feld)
`,
          tests: py`
katalog = {
    "Laptop": {"preis": 899.0, "lager": 5, "tags": ["tech", "arbeit"]},
    "Maus": {"preis": 19.9, "lager": 0},
}
assert produkt_info(katalog, "Laptop", "preis") == 899.0, "Der Preis des Laptops wird nicht gefunden."
assert produkt_info(katalog, "Maus", "lager") == 0, "Ein Lagerbestand von 0 ist ein gültiger Wert und kein 'fehlt'."
assert produkt_info(katalog, "Laptop", "tags") == ["tech", "arbeit"], "Auch Listen als Werte müssen zurückkommen."
assert produkt_info(katalog, "Maus", "tags") is None, "Fehlendes Feld → None."
assert produkt_info(katalog, "Webcam", "preis") is None, "Unbekannter Artikel → None."
assert produkt_info({}, "Laptop", "preis") is None, "Leerer Katalog → None."
`,
        },
        {
          id: 'd5', level: 'Algorithmus', title: 'Warenkorb-Summe',
          scenario: 'Der Warenkorb ist ein Dictionary: Artikelname → Details (<code>"preis"</code> und optional <code>"menge"</code>). Für den Checkout muss die Gesamtsumme berechnet werden.',
          goal: 'Schreibe <code>warenkorb_summe(warenkorb)</code>. Gehe per Schleife durch die <strong>Values</strong> (<code>.values()</code>) des Warenkorbs und addiere <code>preis * menge</code>. Fehlt <code>"menge"</code>, gilt <code>1</code>. Das Ergebnis ist auf 2 Nachkommastellen gerundet, ein leerer Warenkorb ergibt <code>0.0</code>.',
          hint: 'Mit <code>for position in warenkorb.values():</code> bekommst du direkt die Detail-Dictionaries. Die Menge mit Ersatzwert liefert <code>position.get("menge", 1)</code>.',
          starter: py`def warenkorb_summe(warenkorb):
    pass
`,
          solution: py`def warenkorb_summe(warenkorb):
    summe = 0.0
    for position in warenkorb.values():
        summe += position["preis"] * position.get("menge", 1)
    return round(summe, 2)
`,
          tests: py`
assert "values(" in _source, "Gehe mit .values() durch die Positionen."
korb = {"Laptop": {"preis": 899.0, "menge": 1}, "Maus": {"preis": 19.9, "menge": 2}}
assert warenkorb_summe(korb) == 938.8, "Für Laptop + 2× Maus passt die Summe nicht."
assert warenkorb_summe({"Kabel": {"preis": 7.5}}) == 7.5, "Ohne menge gilt 1."
assert warenkorb_summe({"X": {"preis": 0.1, "menge": 3}}) == 0.3, "Runde auf 2 Nachkommastellen (0.1 * 3 ist in Python 0.30000000000000004)."
assert warenkorb_summe({}) == 0.0, "Leerer Warenkorb → 0.0."
assert type(warenkorb_summe({})) is float, "Das Ergebnis muss ein float sein."
`,
        },
      ],

      sandbox: py`# Sandbox — Dictionary
preise = {"Laptop": 899.0, "Maus": 19.9}

preise["Monitor"] = 249.0
print(preise)
print(preise.get("Webcam", "nicht vorhanden"))

for artikel, preis in preise.items():
    print(f"{artikel:<10} {preis:>8.2f} €")

print("Maus" in preise, len(preise))
`,
    },
    /* ----------------------------------------------------------------- 12 */
    {
      id: 12, slug: 'set', title: 'Set',
      subtitle: 'Mengen ohne Duplikate',
      group: 'struktur', icon: '{∪}', status: 'ready',
      scenario: 'IP-Whitelisting & Zugriffsverwaltung',
      lead: 'Ein Server will wissen, <em>welche</em> IPs zugegriffen haben — nicht wie oft. Ein <strong>Set</strong> speichert jedes Element nur einmal und beherrscht Mengenoperationen wie Schnitt (<code>&amp;</code>), Vereinigung (<code>|</code>) und Differenz (<code>-</code>).',

      scenes: [
        {
          id: 'venn',
          title: 'Mengen-Kreise',
          blurb: 'Zwei Mengen A und B von IP-Adressen. Klicke eine Operation an und sieh, welche Bereiche und Elemente herauskommen.',
          visual: 'vennSets',
          config: {
            a: ['10.0.0.1', '10.0.0.2', '10.0.0.3', '10.0.0.4'],
            b: ['10.0.0.3', '10.0.0.4', '10.0.0.5'],
          },
        },
      ],

      tasks: [
        {
          id: 'm1', level: 'Init', title: 'Eindeutige IPs',
          scenario: 'Das Server-Log listet jeden Zugriff einzeln auf, viele IPs mehrfach. Für die Auswertung zählen nur die verschiedenen Besucher.',
          goal: 'Erzeuge aus der Liste <code>zugriffe</code> das Set <code>eindeutige_ips</code> und speichere in <code>anzahl</code>, wie viele verschiedene IPs es gibt (berechnet).',
          hint: '<code>set(liste)</code> wirft alle Duplikate weg. Die Anzahl der Elemente liefert <code>len()</code>.',
          starter: py`zugriffe = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.3", "10.0.0.2"]

# eindeutige_ips, anzahl
`,
          solution: py`zugriffe = ["10.0.0.1", "10.0.0.2", "10.0.0.1", "10.0.0.3", "10.0.0.2"]

eindeutige_ips = set(zugriffe)
anzahl = len(eindeutige_ips)
`,
          tests: py`
assert type(eindeutige_ips) is set, "eindeutige_ips muss ein Set sein."
assert eindeutige_ips == {"10.0.0.1", "10.0.0.2", "10.0.0.3"}, "Das Set muss jede IP genau einmal enthalten."
assert anzahl == 3 and "len(" in _source, "anzahl soll mit len() berechnet werden."
assert len(zugriffe) == 5, "Lass die Liste zugriffe unverändert."
`,
        },
        {
          id: 'm2', level: 'Update', title: 'Whitelist pflegen',
          scenario: 'Ein neuer Server darf auf das System zugreifen, ein alter wurde abgeschaltet. Die Whitelist muss angepasst werden.',
          goal: 'Füge <code>"10.0.0.9"</code> mit <code>add</code> zur Menge <code>whitelist</code> hinzu und entferne <code>"10.0.0.2"</code> mit <code>remove</code>.',
          hint: '<code>menge.add(x)</code> fügt hinzu (Duplikate schaden nicht), <code>menge.remove(x)</code> entfernt — Vorsicht: Fehlt x, gibt es einen KeyError.',
          starter: py`whitelist = {"10.0.0.1", "10.0.0.2"}

# add und remove
`,
          solution: py`whitelist = {"10.0.0.1", "10.0.0.2"}

whitelist.add("10.0.0.9")
whitelist.remove("10.0.0.2")
`,
          tests: py`
assert ".add(" in _source, "Nutze add, um die neue IP hinzuzufügen."
assert ".remove(" in _source, "Nutze remove, um die alte IP zu entfernen."
assert whitelist == {"10.0.0.1", "10.0.0.9"}, f"whitelist ist {sorted(whitelist)} — erwartet: 10.0.0.1 und 10.0.0.9."
`,
        },
        {
          id: 'm3', level: 'Debugging', title: 'Doppelte Besucher',
          scenario: 'Die Besucherstatistik zeigt 5 Besucher, obwohl nur 3 verschiedene IPs im Log stehen: Die Liste <code>eindeutig</code> enthält Duplikate.',
          goal: 'Repariere die Schleife: <code>eindeutig</code> soll jede IP nur <strong>einmal</strong> enthalten, in der Reihenfolge des ersten Auftretens (<code>["8.8.8.8", "10.0.0.1", "1.1.1.1"]</code>). Am Ende wird <code>3</code> ausgegeben.',
          hint: 'Merke dir bereits gesehene IPs, z. B. in einem Set <code>gesehen</code>: Nur wenn <code>ip not in gesehen</code>, hängst du sie an und fügst sie zum Set hinzu. (Prüfung auf Set-Zugehörigkeit ist viel schneller als in Listen.)',
          starter: py`ips = ["8.8.8.8", "10.0.0.1", "8.8.8.8", "10.0.0.1", "1.1.1.1"]

eindeutig = []
for ip in ips:
    eindeutig.append(ip)

print(len(eindeutig))
`,
          solution: py`ips = ["8.8.8.8", "10.0.0.1", "8.8.8.8", "10.0.0.1", "1.1.1.1"]

eindeutig = []
gesehen = set()
for ip in ips:
    if ip not in gesehen:
        gesehen.add(ip)
        eindeutig.append(ip)

print(len(eindeutig))
`,
          tests: py`
assert type(eindeutig) is list, "eindeutig soll eine Liste bleiben (die Reihenfolge ist wichtig)."
assert eindeutig == ["8.8.8.8", "10.0.0.1", "1.1.1.1"], f"eindeutig ist {eindeutig} — jede IP nur einmal, in Reihenfolge des ersten Auftretens."
assert _stdout.strip() == "3", "Am Ende soll genau 3 ausgegeben werden."
assert len(ips) == 5, "Lass die Liste ips unverändert."
`,
        },
        {
          id: 'm4', level: 'Edge Case', title: 'Leere Mengen',
          scenario: 'Die Sperrliste kann leer sein, und manchmal soll eine IP entfernt werden, die gar nicht (mehr) gelistet ist. Ein leeres Set zu erzeugen hat außerdem eine Falle: <code>{}</code> ist ein <em>Dictionary</em>!',
          goal: 'Lege <code>sperrliste</code> als <strong>leeres Set</strong> an. Schreibe außerdem <code>entferne_ip(menge, ip)</code>: Sie entfernt <code>ip</code> aus <code>menge</code> und gibt <code>True</code> zurück, wenn sie vorhanden war — sonst <code>False</code> (ohne <code>KeyError</code>, auch bei leerer Menge).',
          hint: 'Ein leeres Set entsteht mit <code>set()</code>. Entweder prüfst du vorher mit <code>if ip in menge</code> oder du nutzt <code>discard</code>, das nie einen Fehler wirft.',
          starter: py`# leeres Set (Vorsicht: {} ist ein Dictionary)


def entferne_ip(menge, ip):
    pass
`,
          solution: py`sperrliste = set()

def entferne_ip(menge, ip):
    if ip in menge:
        menge.remove(ip)
        return True
    return False
`,
          tests: py`
assert type(sperrliste) is set, "sperrliste muss ein Set sein — {} ergibt ein Dictionary, benutze set()."
assert len(sperrliste) == 0, "sperrliste muss leer sein."
m = {"10.0.0.1", "10.0.0.2"}
assert entferne_ip(m, "10.0.0.1") is True, "Vorhandene IP → True."
assert m == {"10.0.0.2"}, "Die IP muss aus der Menge entfernt werden."
assert entferne_ip(m, "10.0.0.1") is False, "Nicht (mehr) vorhandene IP → False, kein KeyError."
leer = set()
assert entferne_ip(leer, "1.1.1.1") is False, "Auch auf leerer Menge: False statt Absturz."
assert leer == set(), "Die leere Menge bleibt leer."
`,
        },
        {
          id: 'm5', level: 'Algorithmus', title: 'Zugriffsanalyse',
          scenario: 'Zwei Server (A und B) liefern Listen der IPs, die zugegriffen haben. Die Security-Abteilung will wissen, welche IPs auf <em>beiden</em> Servern auftauchten und welche IPs insgesamt <em>nicht</em> auf der Whitelist stehen (also blockiert werden müssen).',
          goal: 'Schreibe <code>analyse(server_a, server_b, whitelist)</code>. Alle drei Parameter sind Listen/Mengen von IP-Strings. Rückgabe: ein Dictionary mit <code>"gemeinsam"</code> (IPs auf beiden Servern, Schnittmenge <code>&amp;</code>) und <code>"blockiert"</code> (alle Zugriffe beider Server <em>ohne</em> die Whitelist, Vereinigung <code>|</code> und Differenz <code>-</code>) — beide Werte als <strong>Set</strong>.',
          hint: 'Wandle zuerst mit <code>set(…)</code> um: <code>a = set(server_a)</code>, <code>b = set(server_b)</code>. Dann <code>a &amp; b</code> und <code>(a | b) - set(whitelist)</code>. Leere Listen sind kein Problem — die Operationen funktionieren auch auf leeren Sets.',
          starter: py`def analyse(server_a, server_b, whitelist):
    pass
`,
          solution: py`def analyse(server_a, server_b, whitelist):
    a = set(server_a)
    b = set(server_b)
    return {
        "gemeinsam": a & b,
        "blockiert": (a | b) - set(whitelist),
    }
`,
          tests: py`
assert "&" in _source and " - " in _source and "|" in _source, "Nutze die Operatoren & (Schnitt), | (Vereinigung) und - (Differenz)."
r = analyse(["1.1.1.1", "2.2.2.2", "2.2.2.2"], ["2.2.2.2", "3.3.3.3"], {"1.1.1.1"})
assert r["gemeinsam"] == {"2.2.2.2"}, f"gemeinsam ist {r['gemeinsam']} — nur IPs, die auf beiden Servern vorkommen."
assert r["blockiert"] == {"2.2.2.2", "3.3.3.3"}, f"blockiert ist {r['blockiert']} — alle IPs außer der Whitelist."
assert type(r["gemeinsam"]) is set and type(r["blockiert"]) is set, "Beide Ergebnisse müssen Sets sein."
r2 = analyse([], [], {"1.1.1.1"})
assert r2 == {"gemeinsam": set(), "blockiert": set()}, "Bei leeren Eingaben sind beide Ergebnisse leere Sets."
r3 = analyse(["9.9.9.9"], [], set())
assert r3 == {"gemeinsam": set(), "blockiert": {"9.9.9.9"}}, "Ohne Whitelist ist jede zugegriffene IP blockiert."
r4 = analyse(["1.1.1.1"], ["1.1.1.1"], ["1.1.1.1"])
assert r4 == {"gemeinsam": {"1.1.1.1"}, "blockiert": set()}, "Eine Whitelist darf auch als Liste übergeben werden."
`,
        },
      ],

      sandbox: py`# Sandbox — Set
a = {"10.0.0.1", "10.0.0.2", "10.0.0.3"}
b = {"10.0.0.3", "10.0.0.4"}

print("Schnitt:     ", sorted(a & b))
print("Vereinigung: ", sorted(a | b))
print("Differenz:   ", sorted(a - b))
print("Symm. Diff.: ", sorted(a ^ b))

print("10.0.0.1" in a)
`,
    },
    /* ----------------------------------------------------------------- 13 */
    {
      id: 13, slug: 'rekursion', title: 'Rekursion',
      subtitle: 'Funktionen, die sich selbst aufrufen',
      group: 'algo', icon: '↻', status: 'ready',
      scenario: 'Dateisystem-Explorer',
      lead: 'Ordner enthalten Ordner, die Ordner enthalten … Wie tief es geht, weiß vorher niemand. <strong>Rekursion</strong> löst das elegant: Eine Funktion ruft sich für ein kleineres Teilproblem selbst auf — bis ein <strong>Basisfall</strong> die Kette beendet. Im Dateisystem-Explorer ist ein Ordner ein Dictionary: <em>Name → Unterordner (dict)</em> oder <em>Name → Dateigröße (Zahl)</em>.',

      scenes: [
        {
          id: 'rekstack',
          title: 'Stack bei Rekursion',
          blurb: 'Jeder Aufruf wartet auf das Ergebnis des nächsten. Erst der Basisfall liefert einen Wert, dann laufen die Antworten Stück für Stück zurück.',
          visual: 'callStack',
          config: {
            lines: [
              'def fakultaet(n):',
              '    if n <= 1:',
              '        return 1',
              '    return n * fakultaet(n - 1)',
              '',
              'print(fakultaet(4))',
            ],
            steps: [
              { line: 5, push: { name: 'fakultaet(4)', vars: { n: '4' } },
                note: 'Der erste Aufruf: <code>fakultaet(4)</code> bekommt seinen eigenen Frame.' },
              { line: 3, set: { wartet: '4 * fakultaet(3)' },
                note: 'Der Basisfall <code>n &lt;= 1</code> trifft nicht zu. Die Rechnung kann erst weitergehen, wenn <code>fakultaet(3)</code> antwortet — also <strong>wartet</strong> dieser Frame.' },
              { line: 3, push: { name: 'fakultaet(3)', vars: { n: '3' } },
                note: 'Ein neuer Frame türmt sich auf den alten. Die Aufgabe ist kleiner geworden: 3 statt 4.' },
              { line: 3, set: { wartet: '3 * fakultaet(2)' },
                note: 'Auch hier kein Basisfall — wieder warten.' },
              { line: 3, push: { name: 'fakultaet(2)', vars: { n: '2' } },
                note: 'Dritter Frame. Der Stack wächst mit jeder Ebene.' },
              { line: 3, set: { wartet: '2 * fakultaet(1)' },
                note: 'Noch immer kein Wert — aber gleich.' },
              { line: 3, push: { name: 'fakultaet(1)', vars: { n: '1' } },
                note: 'Vierter Frame mit <code>n = 1</code>: Jetzt trifft der Basisfall zu!' },
              { line: 2, ret: '1',
                note: '<strong>Basisfall erreicht.</strong> <code>return 1</code> beendet die Kette nach unten, der oberste Frame verschwindet und liefert 1 zurück.' },
              { line: 3, ret: '2',
                note: 'Der wartende Frame rechnet <code>2 * 1 = 2</code>, gibt 2 zurück und wird abgebaut.' },
              { line: 3, ret: '6',
                note: '<code>3 * 2 = 6</code> — die Werte wandern Frame für Frame nach unten zurück.' },
              { line: 3, ret: '24',
                note: '<code>4 * 6 = 24</code>. Der erste Aufruf ist fertig, der Stack ist wieder leer (bis auf <code>&lt;module&gt;</code>).' },
              { line: 5, out: '24',
                note: 'Ohne Basisfall würde der Stack ewig wachsen — bis Python mit einem <code>RecursionError</code> abbricht.' },
            ],
          },
        },
        {
          id: 'explorer',
          title: 'Ordner durchwandern',
          blurb: 'Eine rekursive Funktion besucht jeden Ordner und ruft sich für jeden Unterordner selbst auf. Beobachte Tiefe und Dateizähler.',
          visual: 'folderWalk',
          config: {
            tree: {
              'readme.txt': 4,
              docs: { 'bericht.pdf': 120, archiv: { 'alt.pdf': 90, 'neu.pdf': 95 } },
              bilder: { 'logo.png': 30, leer: {} },
              'notizen.txt': 2,
            },
          },
        },
      ],

      tasks: [
        {
          id: 'r1', level: 'Init', title: 'Countdown beim Aufräumen',
          scenario: 'Der Explorer löscht einen großen Ordner und zeigt den Rest-Countdown an: 3, 2, 1 — ganz ohne Schleife, sondern mit einer Funktion, die sich selbst aufruft.',
          goal: 'Schreibe <code>countdown(n)</code> <strong>rekursiv</strong>: Sie gibt die Liste <code>[n, n-1, …, 1]</code> zurück. Der <strong>Basisfall</strong>: Ist <code>n</code> kleiner oder gleich 0, ist das Ergebnis die leere Liste <code>[]</code>.',
          hint: 'Rekursionsschritt: Die Liste beginnt mit <code>n</code>, danach folgt der Countdown von <code>n - 1</code>: <code>[n] + countdown(n - 1)</code>. Der Basisfall steht ganz oben und kommt <em>vor</em> dem Selbstaufruf.',
          starter: py`def countdown(n):
    pass
`,
          solution: py`def countdown(n):
    if n <= 0:
        return []
    return [n] + countdown(n - 1)
`,
          tests: py`
assert _source.count("countdown(") >= 2, "Die Funktion muss sich selbst aufrufen (Rekursion)."
assert "for " not in _source and "while " not in _source, "Löse es rekursiv — ohne Schleife."
assert countdown(3) == [3, 2, 1], "countdown(3) muss [3, 2, 1] ergeben."
assert countdown(1) == [1], "countdown(1) muss [1] ergeben."
assert countdown(0) == [], "Basisfall: countdown(0) ist die leere Liste."
assert countdown(-4) == [], "Auch negative Zahlen enden im Basisfall."
assert countdown(6) == [6, 5, 4, 3, 2, 1]
`,
        },
        {
          id: 'r2', level: 'Update', title: 'Dateien zählen',
          scenario: 'Der Explorer soll anzeigen, wie viele Dateien in einem Ordner stecken — inklusive aller Unterordner, egal wie tief. Ein Ordner ist ein Dictionary: Werte, die selbst Dictionaries sind, sind Unterordner, alles andere sind Dateien.',
          goal: 'Schreibe <code>dateien_zaehlen(ordner)</code> rekursiv: Sie gibt die Gesamtzahl der Dateien zurück. Gehe die Werte des Ordners durch; ist ein Wert ein <code>dict</code> (prüfe mit <code>isinstance(x, dict)</code>), zählst du darin per Selbstaufruf weiter.',
          hint: '<code>for inhalt in ordner.values():</code> — ist <code>inhalt</code> ein dict, addiere <code>dateien_zaehlen(inhalt)</code>, sonst <code>1</code>.',
          starter: py`def dateien_zaehlen(ordner):
    pass
`,
          solution: py`def dateien_zaehlen(ordner):
    anzahl = 0
    for inhalt in ordner.values():
        if isinstance(inhalt, dict):
            anzahl += dateien_zaehlen(inhalt)
        else:
            anzahl += 1
    return anzahl
`,
          tests: py`
assert _source.count("dateien_zaehlen(") >= 2, "Die Funktion muss sich für Unterordner selbst aufrufen."
fs = {"a.txt": 1, "docs": {"b.txt": 2, "c.txt": 3, "sub": {"d.txt": 4}}, "leer": {}}
assert dateien_zaehlen(fs) == 4, f"dateien_zaehlen liefert {dateien_zaehlen(fs)} — erwartet 4 (Unterordner zählen mit)."
assert dateien_zaehlen({"x.txt": 5}) == 1, "Ein Ordner mit einer Datei hat 1 Datei."
assert dateien_zaehlen({"a": {"b": {"c": {"tief.txt": 9}}}}) == 1, "Auch tief verschachtelte Dateien werden gezählt."
assert dateien_zaehlen({}) == 0, "Ein leerer Ordner hat 0 Dateien."
`,
        },
        {
          id: 'r3', level: 'Debugging', title: 'Endlosrekursion',
          scenario: 'Der Explorer soll zählen, wie viele Dateien in n verschachtelten Ebenen liegen (je Ebene eine Datei mehr: 1 + 2 + … + n). Beim Start bricht Python mit <code>RecursionError: maximum recursion depth exceeded</code> ab.',
          goal: 'Repariere <code>dateien_bis(n)</code>: Sie liefert die Summe <code>n + (n-1) + … + 1</code>. Danach muss <code>10</code> ausgegeben werden (für <code>n = 4</code>). <code>dateien_bis(0)</code> ist <code>0</code>.',
          hint: 'Es fehlt der <strong>Basisfall</strong>: Ohne ihn ruft sich die Funktion für immer mit kleineren Zahlen auf. Wann ist die Summe offensichtlich? Bei <code>n</code> gleich 0 (oder kleiner).',
          starter: py`def dateien_bis(n):
    return n + dateien_bis(n - 1)

print(dateien_bis(4))
`,
          solution: py`def dateien_bis(n):
    if n <= 0:
        return 0
    return n + dateien_bis(n - 1)

print(dateien_bis(4))
`,
          tests: py`
assert dateien_bis(0) == 0, "Basisfall: dateien_bis(0) ist 0."
assert dateien_bis(1) == 1
assert dateien_bis(4) == 10, "dateien_bis(4) = 4 + 3 + 2 + 1 = 10."
assert dateien_bis(100) == 5050, "Auch für n = 100 muss es funktionieren."
assert _stdout.strip() == "10", "Gib dateien_bis(4) mit print aus: 10."
assert _source.count("dateien_bis(") >= 3, "Die Funktion soll rekursiv bleiben."
`,
        },
        {
          id: 'r4', level: 'Edge Case', title: 'Wie tief ist der Ordnerbaum?',
          scenario: 'Der Explorer zeigt an, wie tief die Ordner verschachtelt sind. Leere Ordner, Ordner nur mit Dateien und der Wurzelordner selbst dürfen die Rekursion nicht aus dem Tritt bringen.',
          goal: 'Schreibe <code>ordner_tiefe(ordner)</code>: Ein Ordner ohne Unterordner (auch ein leerer) hat Tiefe <code>1</code>. Hat er Unterordner, ist seine Tiefe <code>1 +</code> die größte Tiefe seiner Unterordner. Achtung: <code>max()</code> auf einer leeren Sequenz wirft einen Fehler!',
          hint: 'Merke dir die tiefste Unterebene in einer Variable, die bei <code>0</code> startet. Jeder Unterordner (dict) kann sie mit <code>max(…)</code> erhöhen. Am Ende: <code>return 1 + tiefste</code>.',
          starter: py`def ordner_tiefe(ordner):
    pass
`,
          solution: py`def ordner_tiefe(ordner):
    tiefste = 0
    for inhalt in ordner.values():
        if isinstance(inhalt, dict):
            tiefste = max(tiefste, ordner_tiefe(inhalt))
    return 1 + tiefste
`,
          tests: py`
assert ordner_tiefe({}) == 1, "Ein leerer Ordner hat Tiefe 1."
assert ordner_tiefe({"a.txt": 1, "b.txt": 2}) == 1, "Nur Dateien: Tiefe 1."
assert ordner_tiefe({"docs": {"x.txt": 1}}) == 2, "Ein Unterordner: Tiefe 2."
assert ordner_tiefe({"a": {"b": {"c": {}}}}) == 4, "Vier verschachtelte (leere) Ordner: Tiefe 4."
assert ordner_tiefe({"flach": {"f.txt": 1}, "tief": {"x": {"y": {"z.txt": 2}}}}) == 4, "Es zählt der tiefste Zweig."
assert _source.count("ordner_tiefe(") >= 2, "Die Funktion muss sich selbst aufrufen."
`,
        },
        {
          id: 'r5', level: 'Algorithmus', title: 'Datei im Baum finden',
          scenario: 'Die Suchleiste des Explorers soll den kompletten Pfad einer Datei finden, egal in welchem Unterordner sie liegt. Ordner sind verschachtelte Dictionaries, Dateien haben als Wert eine Größe.',
          goal: 'Schreibe <code>finde_datei(ordner, dateiname)</code>: Sie gibt den Pfad mit <code>/</code> als Trenner zurück, z. B. <code>"docs/berichte/q1.pdf"</code> (Datei direkt im Wurzelordner: nur der Name). Gefunden wird der <strong>erste</strong> Treffer in Reihenfolge des Dictionaries (Tiefensuche). Gibt es die Datei nicht (oder ist der Ordner leer), lautet das Ergebnis <code>None</code>.',
          hint: 'Gehe <code>ordner.items()</code> durch. Ist der Wert ein dict: suche rekursiv darin; kommt nicht <code>None</code> zurück, setze <code>name + "/" + treffer</code> zusammen. Ist es eine Datei und der Name passt: gib den Namen zurück. Erst nach der Schleife: <code>None</code>.',
          starter: py`def finde_datei(ordner, dateiname):
    pass
`,
          solution: py`def finde_datei(ordner, dateiname):
    for name, inhalt in ordner.items():
        if isinstance(inhalt, dict):
            treffer = finde_datei(inhalt, dateiname)
            if treffer is not None:
                return name + "/" + treffer
        elif name == dateiname:
            return name
    return None
`,
          tests: py`
fs = {
    "readme.txt": 1,
    "docs": {"berichte": {"q1.pdf": 10, "q2.pdf": 11}, "notiz.txt": 2},
    "bilder": {"logo.png": 5, "docs": {"q1.pdf": 3}},
}
assert _source.count("finde_datei(") >= 2, "Die Funktion muss sich rekursiv aufrufen."
assert finde_datei(fs, "readme.txt") == "readme.txt", "Datei im Wurzelordner: nur der Name."
assert finde_datei(fs, "q2.pdf") == "docs/berichte/q2.pdf", "Pfad zu q2.pdf stimmt nicht."
assert finde_datei(fs, "logo.png") == "bilder/logo.png", "Pfad zu logo.png stimmt nicht."
assert finde_datei(fs, "q1.pdf") == "docs/berichte/q1.pdf", "Bei mehreren Treffern gilt der erste (Reihenfolge des Dictionaries)."
assert finde_datei(fs, "nix.txt") is None, "Nicht vorhandene Datei → None."
assert finde_datei({}, "a.txt") is None, "Leerer Ordner → None."
assert finde_datei({"a": {"b": {}}}, "x") is None, "Auch durch leere Unterordner darf nichts abstürzen."
`,
        },
      ],

      sandbox: py`# Sandbox — Rekursion
def fakultaet(n):
    if n <= 1:           # Basisfall
        return 1
    return n * fakultaet(n - 1)

print(fakultaet(5))

def dateien_zaehlen(ordner):
    return sum(dateien_zaehlen(x) if isinstance(x, dict) else 1 for x in ordner.values())

print(dateien_zaehlen({"a.txt": 1, "docs": {"b.txt": 2, "c.txt": 3}}))
`,
    },
    /* ----------------------------------------------------------------- 14 */
    {
      id: 14, slug: 'sortieren', title: 'Sortieralgorithmen (Bubble / Merge)',
      subtitle: 'Vergleichen, tauschen, teilen, mischen',
      group: 'algo', icon: '⇅', status: 'ready',
      scenario: 'Highscore-Liste & Produktpreise',
      lead: 'Eine Highscore-Tabelle muss immer sortiert sein. <strong>Bubble Sort</strong> vergleicht Nachbarn und tauscht sie, bis nichts mehr zu tauschen ist — einfach, aber langsam (O(n²)). <strong>Merge Sort</strong> teilt die Liste, sortiert die Hälften rekursiv und mischt sie zusammen (O(n log n)).',

      scenes: [
        {
          id: 'balken',
          title: 'Sortier-Balken',
          blurb: 'Jede Zahl ist ein Balken. Wähle den Algorithmus und gehe Schritt für Schritt durch (oder starte Auto-Play).',
          visual: 'sortBars',
          config: { data: [6, 3, 8, 2, 7, 1, 5, 4] },
        },
      ],

      tasks: [
        {
          id: 'so1', level: 'Init', title: 'Bubble Sort',
          scenario: 'Die Highscore-Tabelle eines kleinen Spiels soll aufsteigend sortiert werden. Eingebaute Funktionen sind tabu — du sollst den Algorithmus selbst schreiben.',
          goal: 'Schreibe <code>bubble_sort(zahlen)</code>. Sie sortiert die Liste <strong>in-place</strong> aufsteigend (die übergebene Liste wird verändert) und gibt sie zurück. Verwende weder <code>sorted()</code> noch <code>.sort()</code>.',
          hint: 'Zwei verschachtelte Schleifen: Die innere vergleicht <code>zahlen[j]</code> mit <code>zahlen[j + 1]</code> und tauscht bei Bedarf. Die äußere wiederholt das <code>len(zahlen)</code>-mal. Tauschen geht in Python elegant mit <code>a, b = b, a</code>.',
          starter: py`def bubble_sort(zahlen):
    pass
`,
          solution: py`def bubble_sort(zahlen):
    n = len(zahlen)
    for i in range(n):
        for j in range(n - 1 - i):
            if zahlen[j] > zahlen[j + 1]:
                zahlen[j], zahlen[j + 1] = zahlen[j + 1], zahlen[j]
    return zahlen
`,
          tests: py`
assert "sorted(" not in _source and ".sort(" not in _source, "Nutze weder sorted() noch .sort() — schreibe den Algorithmus selbst."
liste = [5, 2, 9, 1]
r = bubble_sort(liste)
assert r == [1, 2, 5, 9], f"Ergebnis {r} ist nicht aufsteigend sortiert."
assert liste == [1, 2, 5, 9], "Die übergebene Liste muss in-place sortiert werden."
assert bubble_sort([3, -1, 2, -5, 0]) == [-5, -1, 0, 2, 3], "Auch negative Zahlen müssen stimmen."
assert bubble_sort([2, 2, 1, 1]) == [1, 1, 2, 2], "Duplikate bleiben erhalten."
assert bubble_sort([9, 8, 7, 6, 5, 4, 3, 2, 1]) == [1, 2, 3, 4, 5, 6, 7, 8, 9], "Eine absteigende Liste ist der Worst Case."
`,
        },
        {
          id: 'so2', level: 'Update', title: 'Rangliste nach Punkten',
          scenario: 'Die Highscore-Liste besteht aus Spielern mit Name und Punkten. Wer die meisten Punkte hat, steht oben; bei Gleichstand entscheidet der Name alphabetisch.',
          goal: 'Schreibe <code>rangliste(spieler)</code>. <code>spieler</code> ist eine Liste von Dictionaries mit <code>"name"</code> und <code>"punkte"</code>. Gib eine <strong>neue</strong> Liste zurück: absteigend nach Punkten, bei gleichen Punkten aufsteigend nach Name. Die Originalliste bleibt unverändert. Nutze <code>sorted()</code> mit dem Parameter <code>key</code>.',
          hint: 'Der <code>key</code> bestimmt, wonach sortiert wird. Ein Tuple als Schlüssel sortiert nach dem ersten Eintrag, bei Gleichstand nach dem zweiten: <code>key=lambda s: (-s["punkte"], s["name"])</code>. Das Minus dreht die Punkte-Reihenfolge um. <code>lambda s: …</code> ist eine kleine Funktion ohne Namen: <code>s</code> ist ein Spieler, hinter dem Doppelpunkt steht der Sortierschlüssel.',
          starter: py`def rangliste(spieler):
    pass
`,
          solution: py`def rangliste(spieler):
    return sorted(spieler, key=lambda s: (-s["punkte"], s["name"]))
`,
          tests: py`
assert "key" in _source, "Nutze sorted() mit dem Parameter key."
spieler = [
    {"name": "Mia", "punkte": 120},
    {"name": "Jan", "punkte": 150},
    {"name": "Zoe", "punkte": 120},
    {"name": "Ali", "punkte": 120},
]
namen = [s["name"] for s in rangliste(spieler)]
assert namen == ["Jan", "Ali", "Mia", "Zoe"], f"Reihenfolge {namen} — erwartet: Jan (150), dann Ali, Mia, Zoe (je 120, alphabetisch)."
assert [s["name"] for s in spieler] == ["Mia", "Jan", "Zoe", "Ali"], "Die Originalliste darf nicht verändert werden."
assert rangliste([]) == [], "Leere Liste → leere Liste."
assert rangliste([{"name": "Solo", "punkte": 5}]) == [{"name": "Solo", "punkte": 5}], "Ein Spieler bleibt ein Spieler."
`,
        },
        {
          id: 'so3', level: 'Debugging', title: 'Der verlorene Wert',
          scenario: 'Der Bubble Sort eines Praktikanten produziert merkwürdige Listen — Werte verdoppeln sich, andere verschwinden. Die Tausch-Logik ist kaputt.',
          goal: 'Repariere den <strong>Tausch</strong> in <code>bubble_sort</code>, sodass jede Liste korrekt aufsteigend sortiert wird. Der Rest des Algorithmus ist in Ordnung.',
          hint: 'Wenn du erst <code>werte[j] = werte[j + 1]</code> schreibst, ist der alte Wert von <code>werte[j]</code> weg! Merke ihn dir in einer Hilfsvariable — oder tausche in einem Schritt: <code>a, b = b, a</code>.',
          starter: py`def bubble_sort(werte):
    n = len(werte)
    for i in range(n):
        for j in range(n - 1):
            if werte[j] > werte[j + 1]:
                werte[j] = werte[j + 1]
                werte[j + 1] = werte[j]
    return werte
`,
          solution: py`def bubble_sort(werte):
    n = len(werte)
    for i in range(n):
        for j in range(n - 1):
            if werte[j] > werte[j + 1]:
                werte[j], werte[j + 1] = werte[j + 1], werte[j]
    return werte
`,
          tests: py`
assert bubble_sort([3, 1, 2]) == [1, 2, 3], "[3, 1, 2] wird nicht korrekt sortiert."
assert bubble_sort([5, 4, 3, 2, 1]) == [1, 2, 3, 4, 5], "[5, 4, 3, 2, 1] wird nicht korrekt sortiert."
assert bubble_sort([2, 2, 1]) == [1, 2, 2], "Duplikate dürfen nicht verloren gehen."
assert bubble_sort([10, -3, 7, 0]) == [-3, 0, 7, 10], "Negative Zahlen und Null werden nicht korrekt sortiert."
assert bubble_sort([]) == [], "Leere Liste → leere Liste."
`,
        },
        {
          id: 'so4', level: 'Edge Case', title: 'Früher Abbruch',
          scenario: 'Meistens ist die Highscore-Liste schon fast sortiert. Ein optimierter Bubble Sort bricht ab, sobald ein kompletter Durchlauf ohne Tausch blieb. Besondere Fälle: schon sortierte Listen, Listen mit einem oder gar keinem Element.',
          goal: 'Schreibe <code>bubble_sort_zaehler(werte)</code>. Sie sortiert eine <strong>Kopie</strong> der Liste und gibt <code>(sortierte_liste, durchlaeufe)</code> zurück. Ein Durchlauf geht einmal über alle Nachbarpaare. Läuft ein Durchlauf ohne Tausch, endet der Algorithmus — dieser letzte Durchlauf zählt mit. Bei weniger als 2 Elementen gibt es <code>0</code> Durchläufe.',
          hint: 'Setze vor jedem Durchlauf <code>getauscht = False</code> und bei jedem Tausch <code>True</code>. Eine <code>while getauscht:</code>-Schleife wiederholt, solange noch getauscht wurde. Prüfe vorab den Fall <code>len(werte) &lt; 2</code>.',
          starter: py`def bubble_sort_zaehler(werte):
    pass
`,
          solution: py`def bubble_sort_zaehler(werte):
    liste = list(werte)
    if len(liste) < 2:
        return (liste, 0)
    durchlaeufe = 0
    getauscht = True
    while getauscht:
        getauscht = False
        durchlaeufe += 1
        for j in range(len(liste) - 1):
            if liste[j] > liste[j + 1]:
                liste[j], liste[j + 1] = liste[j + 1], liste[j]
                getauscht = True
    return (liste, durchlaeufe)
`,
          tests: py`
assert "sorted(" not in _source and ".sort(" not in _source, "Schreibe den Algorithmus selbst."
assert tuple(bubble_sort_zaehler([1, 2, 3])) == ([1, 2, 3], 1), "Eine schon sortierte Liste braucht genau 1 (tauschfreien) Durchlauf."
assert tuple(bubble_sort_zaehler([3, 2, 1])) == ([1, 2, 3], 3), "[3, 2, 1]: zwei Durchläufe mit Tausch plus ein tauschfreier = 3."
assert tuple(bubble_sort_zaehler([2, 1, 3, 4])) == ([1, 2, 3, 4], 2), "[2, 1, 3, 4]: ein Durchlauf mit Tausch plus ein tauschfreier = 2."
assert tuple(bubble_sort_zaehler([7])) == ([7], 0), "Ein Element: 0 Durchläufe."
assert tuple(bubble_sort_zaehler([])) == ([], 0), "Leere Liste: 0 Durchläufe."
original = [3, 1, 2]
bubble_sort_zaehler(original)
assert original == [3, 1, 2], "Die übergebene Liste darf nicht verändert werden (sortiere eine Kopie)."
`,
        },
        {
          id: 'so5', level: 'Algorithmus', title: 'Merge Sort',
          scenario: 'Die Produktpreise eines Shops wachsen auf Millionen Einträge — für Bubble Sort viel zu langsam. Jetzt kommt Divide & Conquer: Teilen, rekursiv sortieren, zusammenmischen.',
          goal: 'Schreibe <code>merge_sort(liste)</code>. Sie gibt eine <strong>neue</strong>, aufsteigend sortierte Liste zurück (die Eingabe bleibt unverändert). Teile die Liste in der Mitte, sortiere beide Hälften <em>rekursiv</em> und mische sie zusammen, indem du immer das kleinere vordere Element nimmst. Basisfall: Listen mit 0 oder 1 Element sind schon sortiert. Kein <code>sorted()</code> / <code>.sort()</code>.',
          hint: 'Basisfall: <code>if len(liste) &lt;= 1: return liste[:]</code>. Sonst <code>mitte = len(liste) // 2</code> und <code>links = merge_sort(liste[:mitte])</code>, <code>rechts = merge_sort(liste[mitte:])</code>. Beim Mischen laufen zwei Zeiger <code>i</code> und <code>j</code> durch <code>links</code> und <code>rechts</code>; am Ende hängst du den Rest an.',
          starter: py`def merge_sort(liste):
    pass
`,
          solution: py`def merge_sort(liste):
    if len(liste) <= 1:
        return liste[:]
    mitte = len(liste) // 2
    links = merge_sort(liste[:mitte])
    rechts = merge_sort(liste[mitte:])
    ergebnis = []
    i = j = 0
    while i < len(links) and j < len(rechts):
        if links[i] <= rechts[j]:
            ergebnis.append(links[i])
            i += 1
        else:
            ergebnis.append(rechts[j])
            j += 1
    ergebnis.extend(links[i:])
    ergebnis.extend(rechts[j:])
    return ergebnis
`,
          tests: py`
assert "sorted(" not in _source and ".sort(" not in _source, "Nutze weder sorted() noch .sort()."
assert _source.count("merge_sort(") >= 3, "Merge Sort ruft sich für beide Hälften selbst auf."
assert merge_sort([5, 2, 9, 1, 7, 3]) == [1, 2, 3, 5, 7, 9], "[5, 2, 9, 1, 7, 3] wird nicht korrekt sortiert."
assert merge_sort([4, -2, 4, 0, -2]) == [-2, -2, 0, 4, 4], "Duplikate und negative Zahlen müssen stimmen."
assert merge_sort([1, 2, 3, 4]) == [1, 2, 3, 4], "Schon sortierte Liste."
assert merge_sort([4, 3, 2, 1]) == [1, 2, 3, 4], "Absteigende Liste."
assert merge_sort([]) == [], "Leere Liste."
assert merge_sort([42]) == [42], "Ein Element."
original = [3, 1, 2]
r = merge_sort(original)
assert original == [3, 1, 2], "Die Eingabeliste darf nicht verändert werden."
assert r is not original, "Gib eine neue Liste zurück."
import random
random.seed(7)
daten = [random.randint(-50, 50) for _ in range(300)]
assert merge_sort(daten) == sorted(daten), "Bei 300 Zufallszahlen weicht das Ergebnis vom korrekten ab."
`,
        },
      ],

      sandbox: py`# Sandbox — Sortieren
zahlen = [6, 3, 8, 2, 7, 1, 5, 4]

def bubble_sort(werte):
    werte = list(werte)
    for i in range(len(werte)):
        for j in range(len(werte) - 1 - i):
            if werte[j] > werte[j + 1]:
                werte[j], werte[j + 1] = werte[j + 1], werte[j]
    return werte

print(bubble_sort(zahlen))
print(sorted(zahlen, reverse=True))

spieler = [("Mia", 120), ("Jan", 150), ("Zoe", 90)]
print(sorted(spieler, key=lambda s: s[1], reverse=True))
`,
    },
    /* ----------------------------------------------------------------- 15 */
    {
      id: 15, slug: 'bst', title: 'Binary Search Tree (BST)',
      subtitle: 'links kleiner, rechts größer',
      group: 'baum', icon: '⌥', status: 'ready',
      scenario: 'Schnelle Produktsuche',
      lead: 'In einem <strong>binären Suchbaum</strong> liegt alles Kleinere im linken, alles Größere im rechten Teilbaum. Bei jedem Knoten fällt die Hälfte der Kandidaten weg — eine Produktsuche mit einer Million Artikeln braucht so nur etwa 20 Vergleiche.',

      scenes: [
        {
          id: 'suche',
          title: 'Pfad durch den Baum',
          blurb: 'Suche eine Zahl oder füge eine neue ein. Der Pfad von der Wurzel leuchtet auf: bei jedem Knoten geht es nach links oder rechts.',
          visual: 'bstSearch',
          config: {
            values: [50, 30, 70, 20, 40, 60, 80, 35, 65],
            examples: [40, 65, 45, 90],
          },
        },
      ],

      tasks: [
        {
          id: 'bs1', level: 'Init', title: 'Der Knoten',
          scenario: 'Für die schnelle Produktsuche nach Artikelnummer baust du einen Suchbaum. Jeder Knoten braucht einen Wert und je einen Zeiger auf den linken und rechten Teilbaum.',
          goal: 'Schreibe die Klasse <code>Knoten</code> mit <code>__init__(self, wert, links=None, rechts=None)</code>. Sie speichert die drei Werte als <code>self.wert</code>, <code>self.links</code> und <code>self.rechts</code>.',
          hint: 'Wie bei der Linked List: <code>class Knoten:</code> mit <code>__init__</code>, in dem jedes Attribut mit <code>self.…  = …</code> gesetzt wird. <code>None</code> heißt: Hier gibt es keinen Teilbaum.',
          starter: py`class Knoten:
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts
`,
          tests: py`
k = Knoten(5)
assert k.wert == 5, "Knoten muss den Wert in self.wert speichern."
assert k.links is None and k.rechts is None, "Ohne Angabe sind links und rechts None."
l, r = Knoten(3), Knoten(8)
w = Knoten(5, l, r)
assert w.links is l, "self.links muss auf den übergebenen linken Knoten zeigen."
assert w.rechts is r, "self.rechts muss auf den übergebenen rechten Knoten zeigen."
`,
        },
        {
          id: 'bs2', level: 'Update', title: 'Wert einfügen',
          scenario: 'Ein neuer Artikel kommt ins Sortiment. Seine Nummer muss an genau der richtigen Stelle im Suchbaum landen: kleiner → nach links, größer → nach rechts, bis ein freier Platz da ist.',
          goal: 'Schreibe <code>einfuegen(wurzel, wert)</code>. Sie fügt <code>wert</code> in den Baum ein und gibt die Wurzel zurück. Ist der Baum leer (<code>wurzel</code> ist <code>None</code>), wird ein neuer Knoten zur Wurzel. Werte, die schon im Baum stehen, werden <strong>nicht</strong> noch einmal eingefügt.',
          hint: 'Rekursiv: Ist <code>wurzel</code> <code>None</code> → <code>return Knoten(wert)</code>. Ist <code>wert &lt; wurzel.wert</code>, dann <code>wurzel.links = einfuegen(wurzel.links, wert)</code>, bei größerem Wert rechts. Am Ende <code>return wurzel</code>.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def einfuegen(wurzel, wert):
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def einfuegen(wurzel, wert):
    if wurzel is None:
        return Knoten(wert)
    if wert < wurzel.wert:
        wurzel.links = einfuegen(wurzel.links, wert)
    elif wert > wurzel.wert:
        wurzel.rechts = einfuegen(wurzel.rechts, wert)
    return wurzel
`,
          tests: py`
w = None
for v in [50, 30, 70, 20, 40, 60, 80]:
    w = einfuegen(w, v)
assert w is not None and w.wert == 50, "Der erste eingefügte Wert wird zur Wurzel."
assert w.links.wert == 30 and w.rechts.wert == 70, "Kleinere Werte gehören nach links, größere nach rechts."
assert w.links.links.wert == 20 and w.links.rechts.wert == 40, "Der linke Teilbaum stimmt nicht."
assert w.rechts.links.wert == 60 and w.rechts.rechts.wert == 80, "Der rechte Teilbaum stimmt nicht."
assert einfuegen(w, 65) is w, "einfuegen muss die Wurzel zurückgeben."
assert w.rechts.links.rechts.wert == 65, "65 gehört rechts von 60."
einfuegen(w, 40)
assert w.links.rechts.links is None and w.links.rechts.rechts is None, "Duplikate werden nicht eingefügt."
neu = einfuegen(None, 7)
assert neu.wert == 7 and neu.links is None and neu.rechts is None, "In einen leeren Baum: ein einzelner Knoten."
`,
        },
        {
          id: 'bs3', level: 'Debugging', title: 'Die verirrte Suche',
          scenario: 'Die Produktsuche findet Artikel, die im Baum stehen, einfach nicht — und gibt für fast alles False zurück. Die Suchfunktion biegt an jedem Knoten in die falsche Richtung ab.',
          goal: 'Repariere <code>suche(wurzel, wert)</code>: Sie liefert <code>True</code>, wenn der Wert im Suchbaum steht, sonst <code>False</code>. Kleinere Werte stehen links, größere rechts.',
          hint: 'Ist der gesuchte Wert <strong>kleiner</strong> als der aktuelle Knotenwert, muss die Suche im <em>linken</em> Teilbaum weitergehen — der Code geht aber nach rechts.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def suche(wurzel, wert):
    if wurzel is None:
        return False
    if wert == wurzel.wert:
        return True
    if wert < wurzel.wert:
        return suche(wurzel.rechts, wert)
    return suche(wurzel.links, wert)
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def suche(wurzel, wert):
    if wurzel is None:
        return False
    if wert == wurzel.wert:
        return True
    if wert < wurzel.wert:
        return suche(wurzel.links, wert)
    return suche(wurzel.rechts, wert)
`,
          tests: py`
baum = Knoten(50, Knoten(30, Knoten(20), Knoten(40)), Knoten(70, Knoten(60), Knoten(80)))
for v in (50, 30, 70, 20, 40, 60, 80):
    assert suche(baum, v) is True, f"Der Wert {v} steht im Baum, wird aber nicht gefunden."
for v in (10, 35, 55, 65, 90):
    assert suche(baum, v) is False, f"Der Wert {v} steht nicht im Baum, die Suche meldet aber True."
assert suche(None, 1) is False, "Im leeren Baum wird nichts gefunden."
`,
        },
        {
          id: 'bs4', level: 'Edge Case', title: 'Suchpfad',
          scenario: 'Zum Debuggen der Suche will das Team sehen, <em>welche</em> Knoten besucht wurden. Der Baum kann leer sein — oder zu einer langen Kette entartet, wenn Artikelnummern aufsteigend eingefügt wurden.',
          goal: 'Schreibe <code>finde_pfad(wurzel, wert)</code>. Sie gibt die Liste der besuchten Knotenwerte <strong>von der Wurzel bis zum gesuchten Wert</strong> zurück. Steht der Wert nicht im Baum (oder ist der Baum leer), ist das Ergebnis <code>None</code>.',
          hint: 'Gehe iterativ oder rekursiv vor und merke dir bei jedem Knoten den Wert in einer Liste. Erreichst du <code>None</code>, ohne den Wert gefunden zu haben → <code>None</code> zurückgeben, nicht die halbe Liste.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def finde_pfad(wurzel, wert):
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def finde_pfad(wurzel, wert):
    pfad = []
    aktuell = wurzel
    while aktuell is not None:
        pfad.append(aktuell.wert)
        if wert == aktuell.wert:
            return pfad
        aktuell = aktuell.links if wert < aktuell.wert else aktuell.rechts
    return None
`,
          tests: py`
baum = Knoten(50, Knoten(30, Knoten(20), Knoten(40)), Knoten(70, Knoten(60), Knoten(80)))
assert finde_pfad(baum, 50) == [50], "Die Wurzel selbst: Pfad [50]."
assert finde_pfad(baum, 40) == [50, 30, 40], "Pfad zu 40: 50 → 30 → 40."
assert finde_pfad(baum, 60) == [50, 70, 60], "Pfad zu 60: 50 → 70 → 60."
assert finde_pfad(baum, 45) is None, "Nicht vorhandener Wert → None."
assert finde_pfad(None, 1) is None, "Leerer Baum → None."
kette = Knoten(1, None, Knoten(2, None, Knoten(3, None, Knoten(4))))
assert finde_pfad(kette, 4) == [1, 2, 3, 4], "Einseitiger Baum: der Pfad geht komplett durch die Kette."
assert finde_pfad(kette, 0) is None, "In der rechtsseitigen Kette ist 0 nicht vorhanden."
assert finde_pfad(kette, 9) is None, "Am Kettenende darf nichts abstürzen."
`,
        },
        {
          id: 'bs5', level: 'Algorithmus', title: 'Ist das ein gültiger BST?',
          scenario: 'Ein Import-Skript baut Bäume aus Fremddaten. Bevor die schnelle Suche darauf losgelassen wird, muss geprüft werden, ob es wirklich ein gültiger Suchbaum ist. Nur die direkten Kinder zu vergleichen reicht nicht!',
          goal: 'Schreibe <code>ist_bst(wurzel)</code>. Ein Baum ist ein gültiger Suchbaum, wenn <strong>alle</strong> Werte im linken Teilbaum <em>kleiner</em> und alle im rechten <em>größer</em> als der Knoten sind — für jeden Knoten. Duplikate sind nicht erlaubt. Ein leerer Baum ist gültig.',
          hint: 'Reiche beim rekursiven Abstieg Grenzen mit: <code>pruefe(knoten, untere, obere)</code>. Der Wert muss strikt zwischen <code>untere</code> und <code>obere</code> liegen (<code>None</code> = keine Grenze). Nach links wird <code>obere</code> zum Knotenwert, nach rechts <code>untere</code>.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def ist_bst(wurzel):
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def ist_bst(wurzel, untere=None, obere=None):
    if wurzel is None:
        return True
    if untere is not None and wurzel.wert <= untere:
        return False
    if obere is not None and wurzel.wert >= obere:
        return False
    return (ist_bst(wurzel.links, untere, wurzel.wert)
            and ist_bst(wurzel.rechts, wurzel.wert, obere))
`,
          tests: py`
gueltig = Knoten(50, Knoten(30, Knoten(20), Knoten(40)), Knoten(70, Knoten(60), Knoten(80)))
assert ist_bst(gueltig) is True, "Dieser Baum ist ein gültiger Suchbaum."
assert ist_bst(None) is True, "Ein leerer Baum ist gültig."
assert ist_bst(Knoten(5)) is True, "Ein einzelner Knoten ist gültig."
falsch_kind = Knoten(10, Knoten(15), Knoten(20))
assert ist_bst(falsch_kind) is False, "Das linke Kind 15 ist größer als 10."
versteckt = Knoten(10, Knoten(5, None, Knoten(15)), Knoten(20))
assert ist_bst(versteckt) is False, "15 steht links von 10, ist aber größer als 10 — das erkennst du nur mit Grenzen aus höheren Ebenen."
versteckt2 = Knoten(10, Knoten(5), Knoten(20, Knoten(8), Knoten(30)))
assert ist_bst(versteckt2) is False, "8 steht rechts von 10, ist aber kleiner als 10."
dubletten = Knoten(10, Knoten(10), None)
assert ist_bst(dubletten) is False, "Duplikate sind in diesem Suchbaum nicht erlaubt."
assert ist_bst(Knoten(1, None, Knoten(2, None, Knoten(3)))) is True, "Eine gültige rechtsseitige Kette."
`,
        },
      ],

      sandbox: py`# Sandbox — Binary Search Tree
class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def einfuegen(wurzel, wert):
    if wurzel is None:
        return Knoten(wert)
    if wert < wurzel.wert:
        wurzel.links = einfuegen(wurzel.links, wert)
    elif wert > wurzel.wert:
        wurzel.rechts = einfuegen(wurzel.rechts, wert)
    return wurzel

def in_order(k):
    return in_order(k.links) + [k.wert] + in_order(k.rechts) if k else []

wurzel = None
for v in [50, 30, 70, 20, 40, 60, 80]:
    wurzel = einfuegen(wurzel, v)

print(in_order(wurzel))   # aufsteigend sortiert!
`,
    },
    /* ----------------------------------------------------------------- 16 */
    {
      id: 16, slug: 'traversierung', title: 'Baum-Traversierungen (In/Pre/Post)',
      subtitle: 'dieselben Knoten, drei Reihenfolgen',
      group: 'baum', icon: '⌥→', status: 'ready',
      scenario: 'Ordnerstruktur ausgeben & aufräumen',
      lead: 'Eine <strong>Traversierung</strong> besucht jeden Knoten eines Baums genau einmal. Der Trick: Es kommt nur darauf an, <em>wann</em> die Funktion den aktuellen Knoten ausgibt — <strong>vor</strong> den Kindern (Preorder), <strong>zwischen</strong> ihnen (Inorder) oder <strong>nach</strong> ihnen (Postorder). Der Baum bleibt derselbe, nur die Reihenfolge ändert sich.',

      scenes: [
        {
          id: 'wanderung',
          title: 'Der Zeiger wandert',
          blurb: 'Wähle Preorder, Inorder oder Postorder und drücke ▶ Schritt. Der orange Ordner ist der aktuelle Aufruf, die Zahlen zeigen die Ausgabe-Reihenfolge. Achte auf die eine hervorgehobene Code-Zeile: Sie wandert je nach Modus.',
          visual: 'treeWalk',
          config: {
            tree: {
              n: 'home',
              l: { n: 'src', l: { n: 'app' }, r: { n: 'lib' } },
              r: { n: 'docs', l: { n: 'img' }, r: { n: 'txt' } },
            },
          },
        },
      ],

      tasks: [
        {
          id: 't1', level: 'Init', title: 'Alle Ordner zählen',
          scenario: 'Dein Dateisystem ist als Baum aus <code>Knoten</code>-Objekten gespeichert. Bevor du Ordner ausgibst, willst du wissen, wie viele es überhaupt gibt — dafür muss die Funktion jeden Knoten einmal besuchen.',
          goal: 'Schreibe <code>anzahl_ordner(knoten)</code> <strong>rekursiv</strong>: Für <code>None</code> gibt es 0 Ordner, sonst zählt der Knoten selbst (1) plus alle Ordner im linken und im rechten Teilbaum.',
          hint: 'Basisfall: <code>if knoten is None: return 0</code>. Sonst: <code>return 1 + anzahl_ordner(knoten.links) + anzahl_ordner(knoten.rechts)</code>.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def anzahl_ordner(knoten):
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def anzahl_ordner(knoten):
    if knoten is None:
        return 0
    return 1 + anzahl_ordner(knoten.links) + anzahl_ordner(knoten.rechts)
`,
          tests: py`
home = Knoten("home", Knoten("src", Knoten("app"), Knoten("lib")), Knoten("docs"))
assert anzahl_ordner(home) == 5, "Der Beispielbaum hat 5 Ordner: home, src, app, lib, docs."
assert anzahl_ordner(Knoten("solo")) == 1, "Ein einzelner Knoten zählt als 1."
assert anzahl_ordner(None) == 0, "Für None (kein Ordner) ist die Antwort 0 — das ist der Basisfall."
assert _source.count("anzahl_ordner(") >= 3, "Die Funktion soll sich selbst für beide Teilbäume aufrufen."
`,
        },
        {
          id: 't2', level: 'Update', title: 'Preorder-Ausgabe',
          scenario: 'Der Chef möchte die Ordnerstruktur wie ein Inhaltsverzeichnis lesen: Erst der übergeordnete Ordner, danach seine Unterordner — links vor rechts.',
          goal: 'Schreibe <code>preorder(knoten)</code>. Sie gibt eine <strong>Liste</strong> der Werte zurück in der Reihenfolge <em>Wurzel → Links → Rechts</em>. Für <code>None</code> ist das Ergebnis eine leere Liste.',
          hint: 'Listen lassen sich mit <code>+</code> verketten: <code>return [knoten.wert] + preorder(knoten.links) + preorder(knoten.rechts)</code>. Der Wert des Knotens steht <em>vorn</em>, weil er zuerst drankommt.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def preorder(knoten):
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def preorder(knoten):
    if knoten is None:
        return []
    return [knoten.wert] + preorder(knoten.links) + preorder(knoten.rechts)
`,
          tests: py`
wurzel = Knoten("home",
                Knoten("src", Knoten("app"), Knoten("lib")),
                Knoten("docs", Knoten("img"), Knoten("txt")))
assert preorder(wurzel) == ["home", "src", "app", "lib", "docs", "img", "txt"], "Preorder: erst der Knoten selbst, dann der linke, dann der rechte Teilbaum."
assert preorder(Knoten("x")) == ["x"], "Ein einzelner Knoten ergibt eine Liste mit genau diesem Wert."
assert preorder(None) == [], "Für None muss eine leere Liste zurückkommen."
`,
        },
        {
          id: 't3', level: 'Debugging', title: 'Die falsche Reihenfolge',
          scenario: 'Die Funktion <code>inorder</code> soll die Ordner so ausgeben, dass links vom Elternordner stehende Einträge zuerst kommen. Stattdessen steht ganz vorn immer die Wurzel „home“ — die Bauteile sind in der falschen Reihenfolge verkettet.',
          goal: 'Repariere <code>inorder(knoten)</code>: Die richtige Reihenfolge ist <em>Links → Wurzel → Rechts</em>.',
          hint: 'Die Zeile mit <code>return</code> setzt <code>[knoten.wert]</code> an den Anfang. Bei Inorder gehört der Wert in die <strong>Mitte</strong>: erst <code>inorder(knoten.links)</code>, dann <code>[knoten.wert]</code>, dann <code>inorder(knoten.rechts)</code>.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def inorder(knoten):
    if knoten is None:
        return []
    return [knoten.wert] + inorder(knoten.links) + inorder(knoten.rechts)
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def inorder(knoten):
    if knoten is None:
        return []
    return inorder(knoten.links) + [knoten.wert] + inorder(knoten.rechts)
`,
          tests: py`
wurzel = Knoten("home",
                Knoten("src", Knoten("app"), Knoten("lib")),
                Knoten("docs", Knoten("img"), Knoten("txt")))
assert inorder(wurzel) == ["app", "src", "lib", "home", "img", "docs", "txt"], "Inorder: erst der ganze linke Teilbaum, dann der Knoten, dann der rechte Teilbaum."
suchbaum = Knoten(50, Knoten(30, Knoten(20), Knoten(40)), Knoten(70, Knoten(60), Knoten(80)))
assert inorder(suchbaum) == [20, 30, 40, 50, 60, 70, 80], "Bei einem Suchbaum liefert Inorder die Werte aufsteigend sortiert."
assert inorder(None) == [], "Für None muss eine leere Liste zurückkommen."
`,
        },
        {
          id: 't4', level: 'Edge Case', title: 'Leerer Baum, einzelner Knoten',
          scenario: 'Die Funktion soll den ersten und den letzten Ordner der Inorder-Liste melden. Das klappt — bis jemand einen komplett leeren Ordnerbaum übergibt: Dann gibt es weder einen ersten noch einen letzten Eintrag und das Programm stürzt ab.',
          goal: 'Erweitere <code>erster_und_letzter(wurzel)</code>: Sie gibt ein <strong>Tupel</strong> <code>(erster, letzter)</code> zurück. Bei einem leeren Baum (<code>None</code>) lautet das Ergebnis <code>(None, None)</code>. Bei einem einzelnen Knoten sind beide Werte gleich.',
          hint: 'Prüfe die Liste, <em>bevor</em> du auf <code>liste[0]</code> zugreifst: <code>if not liste: return (None, None)</code> — eine leere Liste ist „falsch“.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def inorder(knoten):
    if knoten is None:
        return []
    return inorder(knoten.links) + [knoten.wert] + inorder(knoten.rechts)

def erster_und_letzter(wurzel):
    liste = inorder(wurzel)
    return (liste[0], liste[-1])
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def inorder(knoten):
    if knoten is None:
        return []
    return inorder(knoten.links) + [knoten.wert] + inorder(knoten.rechts)

def erster_und_letzter(wurzel):
    liste = inorder(wurzel)
    if not liste:
        return (None, None)
    return (liste[0], liste[-1])
`,
          tests: py`
suchbaum = Knoten(50, Knoten(30, Knoten(20), Knoten(40)), Knoten(70))
assert erster_und_letzter(suchbaum) == (20, 70), "Normalfall: erster = 20, letzter = 70."
assert erster_und_letzter(Knoten("solo")) == ("solo", "solo"), "Ein einzelner Knoten ist zugleich erster und letzter."
assert erster_und_letzter(None) == (None, None), "Leerer Baum: Rückgabe (None, None) statt Absturz."
`,
        },
        {
          id: 't5', level: 'Algorithmus', title: 'Verzeichnis löschen (Postorder)',
          scenario: 'Ein Ordner darf erst gelöscht werden, wenn alle seine Unterordner weg sind — sonst bleiben Dateien ohne Eltern zurück. Du simulierst das Aufräumen, ohne wirklich etwas zu löschen: Die Funktion meldet nur, in welcher Reihenfolge gelöscht würde.',
          goal: 'Schreibe <code>loesche_verzeichnis(knoten)</code> rekursiv. Sie gibt die Namen in <strong>Postorder</strong> zurück (<em>Links → Rechts → Wurzel</em>), also in der Reihenfolge, in der gelöscht wird. Leerer Baum → leere Liste.',
          hint: 'Wie Preorder, nur steht der eigene Wert <strong>hinten</strong>: <code>return loesche_verzeichnis(knoten.links) + loesche_verzeichnis(knoten.rechts) + [knoten.wert]</code>. Die Wurzel wird so als Letztes gelöscht.',
          starter: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def loesche_verzeichnis(knoten):
    pass
`,
          solution: py`class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def loesche_verzeichnis(knoten):
    if knoten is None:
        return []
    return loesche_verzeichnis(knoten.links) + loesche_verzeichnis(knoten.rechts) + [knoten.wert]
`,
          tests: py`
wurzel = Knoten("home",
                Knoten("src", Knoten("app"), Knoten("lib")),
                Knoten("docs", Knoten("img"), Knoten("txt")))
reihenfolge = loesche_verzeichnis(wurzel)
assert reihenfolge == ["app", "lib", "src", "img", "txt", "docs", "home"], "Postorder: erst beide Kinder, dann der Ordner selbst."
assert reihenfolge[-1] == "home", "Die Wurzel muss als Allerletztes gelöscht werden."
assert loesche_verzeichnis(Knoten("leer")) == ["leer"], "Ein einzelner Ordner wird einfach gelöscht."
assert loesche_verzeichnis(None) == [], "Nichts zu löschen → leere Liste."
assert _source.count("loesche_verzeichnis(") >= 3, "Die Funktion soll sich selbst für beide Teilbäume aufrufen."
`,
        },
      ],

      sandbox: py`# Sandbox — Baum-Traversierungen
class Knoten:
    def __init__(self, wert, links=None, rechts=None):
        self.wert = wert
        self.links = links
        self.rechts = rechts

def preorder(k):
    return [k.wert] + preorder(k.links) + preorder(k.rechts) if k else []

def inorder(k):
    return inorder(k.links) + [k.wert] + inorder(k.rechts) if k else []

def postorder(k):
    return postorder(k.links) + postorder(k.rechts) + [k.wert] if k else []

home = Knoten("home",
              Knoten("src", Knoten("app"), Knoten("lib")),
              Knoten("docs", Knoten("img"), Knoten("txt")))

print("Preorder: ", preorder(home))
print("Inorder:  ", inorder(home))
print("Postorder:", postorder(home))
`,
    },
    /* ----------------------------------------------------------------- 17 */
    {
      id: 17, slug: 'graphen', title: 'Graphen',
      subtitle: 'Knoten, Kanten & Routen',
      group: 'baum', icon: '◎—◎', status: 'ready',
      scenario: 'ÖPNV-Routenplaner',
      lead: 'Ein <strong>Graph</strong> besteht aus <em>Knoten</em> (Haltestellen) und <em>Kanten</em> (Verbindungen). Anders als beim Baum darf es Kreise geben und es gibt keine Wurzel. In Python speicherst du ihn als <strong>Adjazenzliste</strong>: ein Dictionary, das jeder Haltestelle die Liste ihrer Nachbarn zuordnet. Darauf laufen <strong>BFS</strong> (Ebene für Ebene, findet die kürzeste Route) und <strong>DFS</strong> (erst tief, dann zurück).',

      scenes: [
        {
          id: 'routen',
          title: 'Route suchen: BFS & DFS',
          blurb: 'Klicke erst die Starthaltestelle, dann das Ziel. Wähle BFS oder DFS und beobachte, wie die Suche das Netz erkundet — am Ende leuchtet die gefundene Route auf. Tipp: Von Hbf nach Park findet BFS die kurze Route, DFS macht einen großen Umweg — probiere beide mit demselben Start und Ziel.',
          visual: 'graphSearch',
          config: {
            nodes: {
              Hbf: [50, 150], Markt: [150, 55], Uni: [150, 245], Park: [270, 150],
              Dom: [300, 45], Hafen: [310, 255], Zoo: [420, 150], Messe: [500, 150],
            },
            edges: [
              ['Hbf', 'Markt'], ['Hbf', 'Uni'], ['Markt', 'Dom'], ['Markt', 'Park'], ['Uni', 'Park'],
              ['Park', 'Hafen'], ['Dom', 'Zoo'], ['Hafen', 'Zoo'], ['Zoo', 'Messe'],
            ],
          },
        },
      ],

      tasks: [
        {
          id: 'g1', level: 'Init', title: 'Das Liniennetz als Dictionary',
          scenario: 'Dein Verkehrsverbund hat fünf Haltestellen. Direkte Verbindungen: Hauptbahnhof–Marktplatz, Hauptbahnhof–Uni, Marktplatz–Dom, Uni–Dom und Dom–Zoo. Jede Verbindung geht in <em>beide</em> Richtungen.',
          goal: 'Lege die Variable <code>netz</code> an: ein Dictionary, in dem jede Haltestelle (String) auf die <strong>Liste ihrer Nachbarhaltestellen</strong> zeigt. Die Reihenfolge innerhalb der Listen ist egal.',
          hint: 'Beginne mit <code>"Hauptbahnhof": ["Marktplatz", "Uni"]</code>. Vergiss nicht die Rückrichtung: Auch beim <code>"Zoo"</code> steht <code>"Dom"</code> in der Liste.',
          starter: py`# Haltestelle -> Liste der direkten Nachbarn
netz = {}
`,
          solution: py`netz = {
    "Hauptbahnhof": ["Marktplatz", "Uni"],
    "Marktplatz": ["Hauptbahnhof", "Dom"],
    "Uni": ["Hauptbahnhof", "Dom"],
    "Dom": ["Marktplatz", "Uni", "Zoo"],
    "Zoo": ["Dom"],
}
`,
          tests: py`
assert isinstance(netz, dict) and len(netz) == 5, "netz braucht genau fünf Haltestellen als Schlüssel."
erwartet = {
    "Hauptbahnhof": {"Marktplatz", "Uni"},
    "Marktplatz": {"Hauptbahnhof", "Dom"},
    "Uni": {"Hauptbahnhof", "Dom"},
    "Dom": {"Marktplatz", "Uni", "Zoo"},
    "Zoo": {"Dom"},
}
for station, nachbarn in erwartet.items():
    assert station in netz, f"Die Haltestelle {station} fehlt als Schlüssel."
    assert isinstance(netz[station], list), f"Die Nachbarn von {station} gehören in eine Liste."
    assert len(netz[station]) == len(nachbarn) and set(netz[station]) == nachbarn, f"Die Nachbarn von {station} stimmen nicht — denk an beide Richtungen."
`,
        },
        {
          id: 'g2', level: 'Update', title: 'Neue Verbindung eröffnen',
          scenario: 'Die Stadt baut eine neue Linie: Zwischen zwei Haltestellen entsteht eine Direktverbindung. Manchmal ist sogar eine der Haltestellen ganz neu im Netz.',
          goal: 'Schreibe <code>verbindung_hinzufuegen(netz, a, b)</code>. Die Funktion trägt <code>b</code> bei <code>a</code> <strong>und</strong> <code>a</code> bei <code>b</code> ein. Unbekannte Haltestellen werden neu angelegt, doppelte Einträge dürfen nicht entstehen.',
          hint: '<code>netz.setdefault(a, [])</code> legt eine leere Liste an, falls <code>a</code> noch fehlt. Dann: <code>if b not in netz[a]: netz[a].append(b)</code> — und dasselbe in die andere Richtung.',
          starter: py`def verbindung_hinzufuegen(netz, a, b):
    pass
`,
          solution: py`def verbindung_hinzufuegen(netz, a, b):
    netz.setdefault(a, [])
    netz.setdefault(b, [])
    if b not in netz[a]:
        netz[a].append(b)
    if a not in netz[b]:
        netz[b].append(a)
`,
          tests: py`
netz = {"A": ["B"], "B": ["A"]}
verbindung_hinzufuegen(netz, "B", "C")
assert "C" in netz["B"], "C muss in der Nachbarliste von B stehen."
assert "B" in netz.get("C", []), "Auch die Rückrichtung zählt: B muss bei C stehen (neue Haltestelle anlegen!)."
verbindung_hinzufuegen(netz, "A", "B")
assert netz["A"] == ["B"] and netz["B"].count("A") == 1, "Bestehende Verbindungen dürfen nicht doppelt eingetragen werden."
verbindung_hinzufuegen(netz, "D", "A")
assert netz["D"] == ["A"] and "D" in netz["A"], "Auch wenn die erste Haltestelle neu ist, werden beide Richtungen eingetragen."
verbindung_hinzufuegen(netz, "X", "Y")
assert netz["X"] == ["Y"] and netz["Y"] == ["X"], "Zwei komplett neue Haltestellen bilden eine eigene kleine Insel."
`,
        },
        {
          id: 'g3', level: 'Debugging', title: 'Der kaputte Kantenzugriff',
          scenario: 'Die Auskunft soll sagen, ob man von einer Haltestelle direkt zu einer anderen fährt. Statt „Ja“ oder „Nein“ gibt es nur eine rote Fehlermeldung — der Zugriff auf das Netz ist falsch aufgebaut.',
          goal: 'Repariere <code>direkt_erreichbar(netz, start, ziel)</code>: Sie liefert <code>True</code>, wenn <code>ziel</code> in der Nachbarliste von <code>start</code> steht, sonst <code>False</code>.',
          hint: '<code>netz[start]</code> ist eine <strong>Liste</strong>. In einer Liste fragt man mit <code>in</code>, ob ein Eintrag enthalten ist: <code>ziel in netz[start]</code>. Mit <code>[ziel]</code> wäre es ein Index — und der muss eine Zahl sein.',
          starter: py`def direkt_erreichbar(netz, start, ziel):
    return netz[start][ziel]
`,
          solution: py`def direkt_erreichbar(netz, start, ziel):
    return ziel in netz[start]
`,
          tests: py`
netz = {"Hbf": ["Markt", "Uni"], "Markt": ["Hbf"], "Uni": ["Hbf"], "Zoo": []}
assert direkt_erreichbar(netz, "Hbf", "Markt") is True, "Hbf und Markt sind direkt verbunden."
assert direkt_erreichbar(netz, "Markt", "Hbf") is True, "Die Verbindung gilt auch in Rückrichtung."
assert direkt_erreichbar(netz, "Markt", "Uni") is False, "Markt und Uni haben keine Direktverbindung."
assert direkt_erreichbar(netz, "Zoo", "Hbf") is False, "Zoo hat keine Nachbarn."
`,
        },
        {
          id: 'g4', level: 'Edge Case', title: 'Sackgasse oder unbekannt?',
          scenario: 'Die App soll Endhaltestellen („Sackgassen“) markieren: Stationen mit genau einer Verbindung. Nutzer tippen aber auch Haltestellen ein, die es gar nicht gibt — und die App stürzt ab, statt höflich „nein“ zu sagen.',
          goal: 'Erweitere <code>ist_sackgasse(netz, station)</code>: <code>True</code> bei genau einer Verbindung, sonst <code>False</code>. Eine <strong>unbekannte</strong> Haltestelle und eine Haltestelle <strong>ohne</strong> Nachbarn sind keine Sackgasse (<code>False</code>).',
          hint: 'Der Zugriff <code>netz[station]</code> löst bei unbekannten Schlüsseln einen <code>KeyError</code> aus. Mit <code>netz.get(station, [])</code> bekommst du stattdessen eine leere Liste. Dann nur noch die Länge prüfen.',
          starter: py`def ist_sackgasse(netz, station):
    return len(netz[station]) == 1
`,
          solution: py`def ist_sackgasse(netz, station):
    return len(netz.get(station, [])) == 1
`,
          tests: py`
netz = {"Hbf": ["Markt", "Uni"], "Markt": ["Hbf"], "Uni": ["Hbf"], "Insel": []}
assert ist_sackgasse(netz, "Markt") is True, "Markt hat genau eine Verbindung — das ist eine Sackgasse."
assert ist_sackgasse(netz, "Hbf") is False, "Hbf hat zwei Verbindungen."
assert ist_sackgasse(netz, "Insel") is False, "Ohne jede Verbindung ist es keine Sackgasse, sondern eine Insel."
assert ist_sackgasse(netz, "Nirgendwo") is False, "Unbekannte Haltestelle: False statt KeyError."
`,
        },
        {
          id: 'g5', level: 'Algorithmus', title: 'Kürzeste Route per BFS',
          scenario: 'Der Routenplaner bekommt sein Herzstück: Von einer Starthaltestelle soll der Weg mit den <em>wenigsten Fahrten</em> zum Ziel gefunden werden. Genau dafür ist die Breitensuche gemacht — sie erkundet erst alle Nachbarn, dann deren Nachbarn und so weiter.',
          goal: 'Schreibe <code>finde_route(netz, start, ziel)</code>. Rückgabe: die Route als Liste der Haltestellen <em>inklusive</em> Start und Ziel (kürzeste Route). Gibt es keine Verbindung oder ist eine Haltestelle unbekannt, kommt <code>None</code> zurück. Kreise im Netz dürfen die Suche nicht endlos laufen lassen.',
          hint: 'Merke dir in einer Warteschlange ganze <strong>Wege</strong> (Listen), startend mit <code>[[start]]</code>. Nimm den vordersten Weg (<code>pop(0)</code> oder <code>deque.popleft()</code>); endet er am Ziel, bist du fertig. Sonst hängst du für jeden noch nicht besuchten Nachbarn einen neuen, um ihn verlängerten Weg hinten an. Besuchte Haltestellen kommen in eine Menge <code>besucht</code>. Beispiel: Aus <code>["A"]</code> werden die Wege <code>["A", "B"]</code> und <code>["A", "C"]</code> — <code>weg + [nachbar]</code> baut jeweils eine verlängerte Kopie.',
          starter: py`def finde_route(netz, start, ziel):
    # Schritt 1 (geschenkt): unbekannte Haltestellen gibt es nicht im Netz
    if start not in netz or ziel not in netz:
        return None

    # Schritt 2 (geschenkt): Die Warteschlange enthält ganze WEGE, nicht nur Haltestellen.
    warte = [[start]]      # z. B. [["A"]] -> später [["A", "B"], ["A", "C"]]
    besucht = {start}

    # Schritt 3 (dein Teil): Solange noch Wege warten ...
    #   a) weg = warte.pop(0)         -> der vorderste Weg
    #   b) weg[-1] ist die Haltestelle, an der du gerade stehst
    #   c) ist sie das Ziel?          -> return weg
    #   d) sonst: für jeden Nachbarn in netz[weg[-1]], der noch nicht in besucht ist:
    #        besucht.add(nachbar) und  warte.append(weg + [nachbar])

    # Schritt 4 (geschenkt): Die Warteschlange ist leer, das Ziel wurde nie erreicht
    return None
`,
          solution: py`from collections import deque

def finde_route(netz, start, ziel):
    if start not in netz or ziel not in netz:
        return None
    warte = deque([[start]])
    besucht = {start}
    while warte:
        weg = warte.popleft()
        if weg[-1] == ziel:
            return weg
        for nachbar in netz[weg[-1]]:
            if nachbar not in besucht:
                besucht.add(nachbar)
                warte.append(weg + [nachbar])
    return None
`,
          tests: py`
netz = {
    "A": ["B", "C"], "B": ["A", "E"], "C": ["A", "D"],
    "D": ["C", "E"], "E": ["B", "D", "F"], "F": ["E"],
    "X": ["Y"], "Y": ["X"],
}
assert finde_route(netz, "A", "F") == ["A", "B", "E", "F"], "Die kürzeste Route von A nach F ist A → B → E → F."
assert finde_route(netz, "F", "C") == ["F", "E", "D", "C"], "Auch rückwärts muss die kürzeste Route gefunden werden (F → E → D → C)."
assert finde_route(netz, "A", "A") == ["A"], "Start gleich Ziel: die Route besteht nur aus dieser einen Haltestelle."
assert finde_route(netz, "A", "X") is None, "X liegt auf einer getrennten Insel — keine Route, also None."
assert finde_route(netz, "A", "Q") is None and finde_route(netz, "Q", "A") is None, "Unbekannte Haltestellen ergeben None."
ring = {1: [2, 4], 2: [1, 3], 3: [2, 4], 4: [3, 1]}
r = finde_route(ring, 1, 3)
assert r is not None and len(r) == 3 and r[0] == 1 and r[-1] == 3, "Im Ring sind es von 1 nach 3 genau zwei Fahrten (3 Haltestellen)."
assert all(b in ring[a] for a, b in zip(r, r[1:])), "Aufeinanderfolgende Haltestellen der Route müssen direkt verbunden sein."
`,
        },
      ],

      sandbox: py`# Sandbox — Graphen
from collections import deque

netz = {
    "Hbf": ["Markt", "Uni"],
    "Markt": ["Hbf", "Dom", "Park"],
    "Uni": ["Hbf", "Park"],
    "Dom": ["Markt", "Zoo"],
    "Park": ["Markt", "Uni", "Hafen"],
    "Hafen": ["Park", "Zoo"],
    "Zoo": ["Dom", "Hafen"],
}

def bfs_route(start, ziel):
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

print(bfs_route("Hbf", "Zoo"))   # kürzeste Route
`,
    },
    /* ----------------------------------------------------------------- 18 */
    {
      id: 18, slug: 'oop', title: 'Klassen & Objekte (OOP)',
      subtitle: 'Blaupause, Instanz, Vererbung',
      group: 'oop', icon: 'cls', status: 'ready',
      scenario: 'Smart-Home-Steuerung',
      lead: 'Eine <strong>Klasse</strong> ist eine Blaupause, ein <strong>Objekt</strong> ein konkretes Gerät, das danach gebaut wird. Jedes Objekt hat seine eigenen Attribute (<code>self.…</code>), teilt sich aber die Methoden der Klasse. Mit <strong>Vererbung</strong> übernimmt <code>SmartLight</code> alles von <code>SmartDevice</code> und ergänzt Eigenes. <strong>Polymorphismus</strong> heißt: Du rufst bei jedem Gerät dieselbe Methode auf — und jedes reagiert auf seine Art.',

      scenes: [
        {
          id: 'speicher',
          title: 'Blaupause und Objekte',
          blurb: 'Links siehst du die Klassen (Blaupausen), rechts entstehen beim Ausführen der Zeilen die echten Objekte. Jede Lampe hat ihre eigenen Werte — schalte nur eine ein und schau, ob die andere reagiert.',
          visual: 'objectMemory',
          config: {
            classes: [
              { name: 'SmartDevice', parent: null, attrs: ['name', 'ist_an'], methods: ['schalte_ein()', 'schalte_aus()', 'status()'] },
              { name: 'SmartLight', parent: 'SmartDevice', attrs: ['helligkeit'], methods: ['dimme(prozent)'] },
              { name: 'Thermostat', parent: 'SmartDevice', attrs: ['temperatur'], methods: ['setze_temperatur(grad)'] },
            ],
            script: [
              {
                code: 'wohnzimmer_lampe = SmartLight("Wohnzimmer")',
                make: { var: 'wohnzimmer_lampe', cls: 'SmartLight', attrs: { name: '"Wohnzimmer"', ist_an: 'False', helligkeit: '0' } },
                note: '<code>SmartLight(…)</code> baut ein neues Objekt nach der Blaupause. <code>__init__</code> legt <code>name</code> und <code>ist_an</code> an (geerbt von <code>SmartDevice</code>) und dazu <code>helligkeit</code>.',
              },
              {
                code: 'kuechen_thermostat = Thermostat("Küche")',
                make: { var: 'kuechen_thermostat', cls: 'Thermostat', attrs: { name: '"Küche"', ist_an: 'False', temperatur: '20' } },
                note: 'Ein zweites Objekt aus einer <em>anderen</em> Klasse. Auch es hat <code>name</code> und <code>ist_an</code> geerbt — aber statt <code>helligkeit</code> eine <code>temperatur</code>.',
              },
              {
                code: 'flur_lampe = SmartLight("Flur")',
                make: { var: 'flur_lampe', cls: 'SmartLight', attrs: { name: '"Flur"', ist_an: 'False', helligkeit: '0' } },
                note: 'Aus <strong>einer</strong> Blaupause kannst du beliebig viele Objekte bauen. Jedes bekommt seinen eigenen Satz an Attributen.',
              },
              {
                code: 'wohnzimmer_lampe.schalte_ein()',
                set: { var: 'wohnzimmer_lampe', cls: 'SmartDevice', values: { ist_an: 'True' } },
                note: 'Die Methode <code>schalte_ein</code> steht in <code>SmartDevice</code> und wird vererbt. Mit <code>self</code> weiß sie, <em>welches</em> Objekt gemeint ist: nur die Wohnzimmerlampe ändert sich, <code>flur_lampe</code> bleibt aus!',
              },
              {
                code: 'wohnzimmer_lampe.dimme(60)',
                set: { var: 'wohnzimmer_lampe', cls: 'SmartLight', values: { helligkeit: '60' } },
                note: '<code>dimme</code> gibt es nur in <code>SmartLight</code>. Das Thermostat könnte das nicht — es kennt diese Methode nicht.',
              },
              {
                code: 'kuechen_thermostat.setze_temperatur(22)',
                set: { var: 'kuechen_thermostat', cls: 'Thermostat', values: { temperatur: '22' } },
                note: 'Jedes Objekt verwaltet seinen eigenen Zustand. Fazit: <strong>Klasse = gemeinsames Verhalten</strong>, <strong>Objekt = individueller Zustand</strong>.',
              },
            ],
          },
        },
      ],

      tasks: [
        {
          id: 'o1', level: 'Init', title: 'Die Basisklasse SmartDevice',
          scenario: 'Alle Geräte im Smart Home haben etwas gemeinsam: einen Namen, einen An/Aus-Zustand und die Möglichkeit, ein- und auszuschalten. Das gehört in eine gemeinsame Basisklasse.',
          goal: 'Schreibe die Klasse <code>SmartDevice</code>. <code>__init__(self, name)</code> speichert <code>self.name</code> und setzt <code>self.ist_an = False</code>. Dazu die Methoden <code>schalte_ein()</code>, <code>schalte_aus()</code> und <code>status()</code>. <code>status()</code> liefert den Text <code>"Flurlicht: an"</code> bzw. <code>"Flurlicht: aus"</code> (Name, Doppelpunkt, Zustand).',
          hint: 'Jede Methode braucht <code>self</code> als ersten Parameter. <code>schalte_ein</code> setzt <code>self.ist_an = True</code>. Für <code>status</code> hilft ein f-String: <code>f"{self.name}: {zustand}"</code> mit <code>zustand = "an" if self.ist_an else "aus"</code>.',
          starter: py`class SmartDevice:
    pass
`,
          solution: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

    def schalte_aus(self):
        self.ist_an = False

    def status(self):
        zustand = "an" if self.ist_an else "aus"
        return f"{self.name}: {zustand}"
`,
          tests: py`
d = SmartDevice("Flurlicht")
assert d.name == "Flurlicht", "__init__ muss den Namen in self.name speichern."
assert d.ist_an is False, "Ein neues Gerät ist zunächst aus (self.ist_an = False)."
assert d.status() == "Flurlicht: aus", "status() soll z. B. 'Flurlicht: aus' liefern."
d.schalte_ein()
assert d.ist_an is True and d.status() == "Flurlicht: an", "Nach schalte_ein() muss das Gerät an sein."
d.schalte_aus()
assert d.ist_an is False, "schalte_aus() setzt ist_an wieder auf False."
a, b = SmartDevice("A"), SmartDevice("B")
a.schalte_ein()
assert b.ist_an is False, "Jedes Objekt hat seinen eigenen Zustand — B darf nicht mitgeschaltet werden."
`,
        },
        {
          id: 'o2', level: 'Update', title: 'SmartLight erbt',
          scenario: 'Lampen können mehr als nur an und aus: Sie lassen sich dimmen. Du willst nicht alles neu schreiben, sondern die Basisklasse erweitern.',
          goal: 'Schreibe <code>SmartLight</code> als Unterklasse von <code>SmartDevice</code>. Ihr <code>__init__(self, name)</code> ruft zuerst <code>super().__init__(name)</code> auf und legt dann <code>self.helligkeit = 0</code> an. Die Methode <code>dimme(prozent)</code> setzt die Helligkeit.',
          hint: '<code>class SmartLight(SmartDevice):</code> — die Basisklasse steht in Klammern. Im <code>__init__</code> sorgt <code>super().__init__(name)</code> dafür, dass <code>name</code> und <code>ist_an</code> weiterhin angelegt werden. <code>schalte_ein</code> musst du nicht noch einmal schreiben: Es wird vererbt.',
          starter: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

    def schalte_aus(self):
        self.ist_an = False

    def status(self):
        zustand = "an" if self.ist_an else "aus"
        return f"{self.name}: {zustand}"

class SmartLight:
    pass
`,
          solution: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

    def schalte_aus(self):
        self.ist_an = False

    def status(self):
        zustand = "an" if self.ist_an else "aus"
        return f"{self.name}: {zustand}"

class SmartLight(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.helligkeit = 0

    def dimme(self, prozent):
        self.helligkeit = prozent
`,
          tests: py`
assert issubclass(SmartLight, SmartDevice), "SmartLight muss von SmartDevice erben: class SmartLight(SmartDevice)."
lampe = SmartLight("Wohnzimmer")
assert lampe.name == "Wohnzimmer" and lampe.ist_an is False, "name und ist_an kommen aus SmartDevice — ruf super().__init__(name) auf."
assert lampe.helligkeit == 0, "Eine neue Lampe hat helligkeit = 0."
lampe.schalte_ein()
assert lampe.ist_an is True and lampe.status() == "Wohnzimmer: an", "schalte_ein() und status() werden von SmartDevice geerbt."
lampe.dimme(60)
assert lampe.helligkeit == 60, "dimme(60) muss die Helligkeit auf 60 setzen."
assert "super()" in _source, "Nutze super(), um den __init__ der Basisklasse aufzurufen."
`,
        },
        {
          id: 'o3', level: 'Debugging', title: 'Das vergessene self',
          scenario: 'Das Küchenthermostat verhält sich seltsam: Es merkt sich keine Temperatur, und beim Auslesen kommt ein Fehler. In der Klasse wurde mehrfach das <code>self</code> vergessen.',
          goal: 'Repariere <code>Thermostat</code>: Die Temperatur startet bei 20, <code>setze_temperatur(grad)</code> speichert sie am Objekt, und <code>info()</code> liefert z. B. <code>"Küche: 23 Grad"</code>.',
          hint: 'Drei Fundstellen: (1) In <code>__init__</code> und (2) in <code>setze_temperatur</code> legt <code>temperatur = …</code> nur eine lokale Variable an — es muss <code>self.temperatur = …</code> heißen. (3) <code>def info():</code> braucht <code>self</code> als Parameter, und in der Zeile darunter muss es auch <code>self.temperatur</code> sein.',
          starter: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

class Thermostat(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        temperatur = 20

    def setze_temperatur(self, grad):
        temperatur = grad

    def info():
        return f"{self.name}: {self.temperatur} Grad"
`,
          solution: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

class Thermostat(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.temperatur = 20

    def setze_temperatur(self, grad):
        self.temperatur = grad

    def info(self):
        return f"{self.name}: {self.temperatur} Grad"
`,
          tests: py`
t = Thermostat("Küche")
assert hasattr(t, "temperatur"), "Im __init__ fehlt self. vor temperatur — ohne self entsteht nur eine lokale Variable, die verschwindet."
assert t.temperatur == 20, "Startwert der Temperatur ist 20."
t.setze_temperatur(23)
assert t.temperatur == 23, "setze_temperatur muss self.temperatur ändern, nicht nur eine lokale Variable."
assert t.info() == "Küche: 23 Grad", "info() soll 'Küche: 23 Grad' liefern."
t2 = Thermostat("Bad")
assert t2.temperatur == 20, "Jedes Thermostat hat seine eigene Temperatur."
`,
        },
        {
          id: 'o4', level: 'Edge Case', title: 'Ungültige Rollo-Position',
          scenario: 'Ein Rollo kennt nur Positionen von 0 (ganz zu) bis 100 (ganz offen). Die App schickt aber manchmal Unsinn: 150, -20 oder sogar den Text „halb“. Das Rollo würde sonst in einen unmöglichen Zustand fahren.',
          goal: 'Erweitere <code>Rollo.setze_position(prozent)</code>: Nur Zahlen (<code>int</code> oder <code>float</code>) von 0 bis 100 sind erlaubt. Alles andere löst einen <code>ValueError</code> aus — und die bisherige Position bleibt unverändert.',
          hint: 'Prüfe <em>vor</em> dem Zuweisen: <code>if not isinstance(prozent, (int, float)) or not 0 &lt;= prozent &lt;= 100: raise ValueError("…")</code>. Erst danach <code>self.position = prozent</code>. Die Typprüfung muss zuerst kommen, sonst wirft der Vergleich <code>0 &lt;= "halb"</code> einen anderen Fehler.',
          starter: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

class Rollo(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.position = 0      # 0 = ganz zu, 100 = ganz offen

    def setze_position(self, prozent):
        self.position = prozent
`,
          solution: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

class Rollo(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.position = 0      # 0 = ganz zu, 100 = ganz offen

    def setze_position(self, prozent):
        if not isinstance(prozent, (int, float)) or not 0 <= prozent <= 100:
            raise ValueError("Position muss eine Zahl von 0 bis 100 sein")
        self.position = prozent
`,
          tests: py`
r = Rollo("Schlafzimmer")
r.setze_position(40)
assert r.position == 40, "Gültige Werte werden gesetzt."
r.setze_position(0)
r.setze_position(100)
assert r.position == 100, "0 und 100 sind erlaubte Grenzwerte."
for schlecht in [-1, 101, 250, "halb", None]:
    try:
        r.setze_position(schlecht)
    except ValueError:
        pass
    else:
        assert False, f"{schlecht!r} ist ungültig und soll einen ValueError auslösen."
    assert r.position == 100, f"Nach dem ungültigen Wert {schlecht!r} darf sich die Position nicht ändern."
`,
        },
        {
          id: 'o5', level: 'Algorithmus', title: 'Polymorphismus: Alles einschalten',
          scenario: 'Der Knopf „Ich bin zu Hause“ soll alle Geräte einschalten: die Lampe mit voller Helligkeit, das Thermostat auf Wohlfühltemperatur, das Rollo ganz hoch. Jede Klasse hat dafür ihr eigenes <code>schalte_ein()</code> — du musst nur noch alle durchlaufen.',
          goal: 'Schreibe <code>alle_einschalten(geraete)</code>: Für jedes Gerät in der Liste wird <code>schalte_ein()</code> aufgerufen. Zurück kommt die Liste der <code>status()</code>-Texte in derselben Reihenfolge. Die Funktion darf <strong>nicht</strong> prüfen, welche Klasse ein Gerät hat (kein <code>isinstance</code>).',
          hint: 'Das ist die Stärke von Polymorphismus: <code>for geraet in geraete: geraet.schalte_ein()</code> — Python wählt selbst die passende Version der Methode. Sammle in der Schleife <code>geraet.status()</code> in einer Liste, die du am Ende zurückgibst.',
          starter: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

    def status(self):
        zustand = "an" if self.ist_an else "aus"
        return f"{self.name}: {zustand}"

class SmartLight(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.helligkeit = 0

    def schalte_ein(self):
        super().schalte_ein()
        self.helligkeit = 100

class Thermostat(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.temperatur = 16

    def schalte_ein(self):
        super().schalte_ein()
        self.temperatur = 21

class Rollo(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.position = 0

    def schalte_ein(self):
        super().schalte_ein()
        self.position = 100

def alle_einschalten(geraete):
    pass
`,
          solution: py`class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

    def status(self):
        zustand = "an" if self.ist_an else "aus"
        return f"{self.name}: {zustand}"

class SmartLight(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.helligkeit = 0

    def schalte_ein(self):
        super().schalte_ein()
        self.helligkeit = 100

class Thermostat(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.temperatur = 16

    def schalte_ein(self):
        super().schalte_ein()
        self.temperatur = 21

class Rollo(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.position = 0

    def schalte_ein(self):
        super().schalte_ein()
        self.position = 100

def alle_einschalten(geraete):
    berichte = []
    for geraet in geraete:
        geraet.schalte_ein()
        berichte.append(geraet.status())
    return berichte
`,
          tests: py`
lampe = SmartLight("Wohnzimmer")
heizung = Thermostat("Küche")
rollo = Rollo("Bad")
berichte = alle_einschalten([lampe, heizung, rollo])
assert berichte == ["Wohnzimmer: an", "Küche: an", "Bad: an"], "Zurückgeben sollst du die status()-Texte aller Geräte, nachdem sie eingeschaltet wurden."
assert lampe.helligkeit == 100, "Die Lampe muss ihr eigenes schalte_ein() ausführen (Helligkeit 100)."
assert heizung.temperatur == 21 and rollo.position == 100, "Thermostat (21 Grad) und Rollo (Position 100) müssen ebenfalls ihr eigenes schalte_ein() ausführen."

class Rauchmelder(SmartDevice):
    def schalte_ein(self):
        super().schalte_ein()
        self.scharf = True

melder = Rauchmelder("Flur")
alle_einschalten([melder])
assert getattr(melder, "scharf", False) is True, "Auch neue, unbekannte Geräteklassen müssen funktionieren — ruf einfach geraet.schalte_ein() auf."
assert alle_einschalten([]) == [], "Eine leere Geräteliste ergibt eine leere Liste."
assert "isinstance" not in _source, "Polymorphismus heißt: nicht nach der Klasse fragen, sondern einfach schalte_ein() aufrufen."
`,
        },
      ],

      sandbox: py`# Sandbox — Klassen & Objekte
class SmartDevice:
    def __init__(self, name):
        self.name = name
        self.ist_an = False

    def schalte_ein(self):
        self.ist_an = True

    def status(self):
        return f"{self.name}: {'an' if self.ist_an else 'aus'}"

class SmartLight(SmartDevice):
    def __init__(self, name):
        super().__init__(name)
        self.helligkeit = 0

    def schalte_ein(self):
        super().schalte_ein()
        self.helligkeit = 100

geraete = [SmartDevice("Steckdose"), SmartLight("Wohnzimmer")]
for g in geraete:
    g.schalte_ein()          # Polymorphismus: jede Klasse macht es auf ihre Art
    print(g.status())

print(geraete[1].helligkeit)
`,
    },
  ],
};
