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
    soon(7,  'tuple',         'Tuple',                          'struktur',   '( )'),
    soon(8,  'stack',         'Stack (LIFO)',                   'struktur',   '▤↑'),
    soon(9,  'queue',         'Queue (FIFO)',                   'struktur',   '▤→'),
    soon(10, 'linkedlist',    'Linked List',                    'struktur',   '○→○'),
    soon(11, 'dict',          'Dictionary',                     'struktur',   '{:}'),
    soon(12, 'set',           'Set',                            'struktur',   '{∪}'),
    soon(13, 'rekursion',     'Rekursion',                      'algo',       '↻'),
    soon(14, 'sortieren',     'Sortieralgorithmen (Bubble / Merge)', 'algo',  '⇅'),
    soon(15, 'bst',           'Binary Search Tree (BST)',       'baum',       '⌥'),
    soon(16, 'traversierung', 'Baum-Traversierungen (In/Pre/Post)', 'baum',  '⌥→'),
    soon(17, 'graphen',       'Graphen',                        'baum',       '◎—◎'),
    soon(18, 'oop',           'Klassen & Objekte (OOP)',        'oop',        'cls'),
  ],
};
