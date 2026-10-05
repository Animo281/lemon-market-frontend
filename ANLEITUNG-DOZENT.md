# Market for Lemons — Anleitung für Dozenten

Diese Anleitung braucht keine Programmierkenntnisse. Sie beschreibt, wie du das
Experiment in einer Vorlesung oder einem Seminar durchführst.

## 1. Worum geht es?

Das Experiment (nach Holt & Sherman, 1999) lässt Studierende live erleben, was
Akerlofs "Market for Lemons" beschreibt: Wenn Käufer die Qualität eines Produkts
nicht erkennen können, bricht der Markt zusammen — gute Anbieter werden verdrängt,
obwohl alle Beteiligten eigentlich vom Handel profitieren könnten.

- Ein Teil der Studierenden spielt **Verkäufer**, ein Teil **Käufer**.
- Es gibt drei Qualitätsstufen (Q1 niedrig, Q2 mittel, Q3 hoch). Verkäufer wählen
  pro Runde eine Qualität, legen einen Preis fest und bieten 1 bis zur konfigurierten
  Höchstmenge an Einheiten an (Standard: 2).
- **Zu Beginn sehen Käufer die Qualität** vor dem Kauf ("volle Info").
- Nach ein paar Runden schaltest du (der Dozent) manuell um: **die Qualität wird
  für Käufer unsichtbar** ("asymmetrische Info") — genau das ist der Punkt des
  Experiments. Siehe Abschnitt 4 für den genauen Klick.
- Am Ende siehst du eine Auswertung: Gesamtüberschuss, Effizienz im Vergleich zum
  theoretischen Optimum, und einen direkten Vergleich der beiden Phasen — gute
  Grundlage für die Nachbesprechung im Plenum.

Eine Runde dauert typischerweise 1–3 Minuten; das ganze Experiment passt in eine
30-Minuten-Session.

## 2. Session anlegen

1. Öffne die Startseite der App im Browser.
2. Im Feld **"Als Dozent"**: Anzahl Verkäufer und Käufer eintragen (jeweils bis zu
   10 bzw. 20 Personen — passend zur Kursgröße wählen).
3. Auf **"Session erstellen"** klicken.
4. Im folgenden Fenster kannst du **Max. Einheiten** (wie viele Lemonen ein
   Verkäufer maximal anbieten darf, 1–5), **Anzahl Runden** (1–20) und die
   **Preise je Qualität** einstellen (Käuferwert und Kosten der 1. Einheit,
   je Qualitätsstufe Q1–Q3; jede weitere Einheit kostet den Verkäufer
   automatisch +1,00 € mehr). Voreingestellt sind die Werte aus
   Holt & Sherman (1999) — Button **"Holt & Sherman Standardwerte"** setzt sie
   jederzeit zurück. Die Preise müssen mit der Qualität steigen (Q1 < Q2 < Q3
   für Käuferwert und für Kosten); sonst zeigt die App einen Fehler und
   **"Übernehmen →"** lässt sich nicht abschließen. Diese Einstellungen lassen
   sich **nach dem Start nicht mehr ändern** — im Zweifel lieber "Mit Defaults
   starten" (2 Einheiten, 5 Runden, Holt & Sherman Preise) nutzen.
5. Du landest auf dem **Admin-Panel** — das ist dein Steuerpult für den Rest der
   Stunde. Lass dieses Fenster offen; am besten auf einem zweiten Bildschirm oder
   per Beamer projiziert.

## 3. Studierende beitreten lassen

Auf dem Admin-Panel siehst du oben den **Session-Code** (4 Zeichen) sowie einen
kopierbaren Link. Beides an die Studierenden weitergeben (Code vorlesen, Link in
den Chat/das LMS posten).

Studierende gehen auf die Startseite → Feld **"Als Spieler"** → Code eingeben →
Namen eintragen → einen freien Platz auswählen → "Beitreten". Käufer wählen
einfach K1, K2, …; Verkäufer wählen einen von vier illustrierten Marktständen
(Holzbude, Pavillon, Lemonade-Wagen, Schirm-Karren) — bei mehr als 4 Verkäufern
wiederholen sich die Standbilder, das ist nur optisch und ändert nichts am Spiel.
Wer über den kopierten Link (statt über die Startseite) beitritt, landet direkt
auf der Beitrittsseite mit bereits eingetragenem Code.

Auf deinem Admin-Panel siehst du live, wer beigetreten ist. Ein Platz kann nicht
doppelt vergeben werden — wenn zwei Studierende gleichzeitig denselben Platz
wählen, bekommt einer davon eine Fehlermeldung und muss einen anderen Platz
wählen.

**"Spiel starten"** ist erst klickbar, wenn mindestens 1 Verkäufer und 1 Käufer
beigetreten sind.

## 4. Ablauf während des Spiels

Pro Runde durchläuft die Session automatisch mehrere Phasen — du musst nichts
manuell weiterschalten, außer am Rundenende:

1. **Verkaufsphase**: Jeder Verkäufer wählt verdeckt Qualität, Menge und Preis.
   Auf deinem Panel siehst du, wer schon abgegeben hat.
2. **Marktphase**: Sobald alle Verkäufer fertig sind, öffnet der Markt. Käufer
   sehen die Angebote (Qualität je nach Phase sichtbar oder verdeckt) und kaufen
   nacheinander.
3. **Rundenende**: Sobald alle Käufer entschieden haben (oder du sie überspringst,
   siehe unten), siehst du die Rundenergebnisse: wer was zu welchem Preis
   verkauft/gekauft hat, und den Gesamtüberschuss dieser Runde.
4. Klicke **"Nächste Runde →"**, um weiterzumachen, oder **"Ergebnisse anzeigen
   →"** in der letzten Runde.

**Der Wechsel von voller zu asymmetrischer Information ist ein bewusster
Schritt von dir, keine Automatik.** Die Session startet mit voller Information
und bleibt dabei, bis du umschaltest — sobald sich die Preise in den ersten
Runden eingependelt haben (meist nach 2–3 Runden, wie bei Holt & Sherman),
klickst du auf dem Rundenende-Bildschirm auf **"Qualität ausblenden (→ Asymm.
Info)"** und bestätigst den Dialog mit **"Wechseln"**. Ab der nächsten Runde
sehen Käufer nur noch den Preis, und das bleibt für den Rest der Session so —
genau das ist der Moment, um den es im Experiment geht. Der Button funktioniert
in beide Richtungen: Im asymmetrischen Modus heißt er **"Asymm. Info · Klicken
zum Zurücksetzen"** und schaltet (nach erneuter Bestätigung) zurück auf volle
Info, falls du den Effekt gezielt mehrfach vorführen willst. Er erscheint nur
auf dem Rundenende-Bildschirm, nicht während der laufenden Verkaufs- oder
Marktphase.

## 5. Was tun bei Problemen

Die App zeigt an allen Stellen konkrete deutsche Fehlermeldungen — wenn etwas
nicht klappt, steht meist direkt dort, woran es liegt. Aktionen, die einen
Studierenden betreffen (Entfernen, Überspringen, Runde erzwingen), fragen erst
in einem Bestätigungsdialog nach, bevor sie ausgeführt werden. Die häufigsten
Fälle:

- **"Session nicht gefunden — Code prüfen."** — Ein Studierender hat sich
  vertippt oder eine alte Session-URL benutzt. Code nochmal vorlesen/kopieren.
- **Ein Studierender kommt nicht rein / hat den falschen Platz gewählt** — im
  Admin-Panel bei "Teilnehmer" auf das ✕ neben dem Namen klicken und im Dialog
  mit "Entfernen" bestätigen, um den Platz wieder freizugeben. Der Dialogtext
  sagt zwar "kann nicht mehr zurückkehren" — solange die Session noch nicht
  gestartet ist (Lobby), kann sich der Studierende aber einfach neu mit einem
  freien Platz eintragen.
- **Ein Verkäufer gibt keine Entscheidung ab** (z. B. Verbindung verloren) — im
  Admin-Panel während der Verkaufsphase erscheint der Button **"Runde
  erzwingen →"**. Nach Bestätigung trägt er für alle fehlenden Verkäufer eine
  Platzhalter-Entscheidung ein (kein Angebot) und öffnet den Markt trotzdem.
- **Ein Käufer ist nicht mehr da, wenn er dran ist** — in der Marktphase
  erscheint neben dem wartenden Käufer ein **"überspr."**-Button, der nach
  Bestätigung seinen Zug überspringt (zählt als "nicht gekauft").
- **Ein Studierender muss ganz raus** (falscher Kurs, Doppel-Login, o. Ä.) — das
  ✕ neben seinem Namen entfernt ihn nach Bestätigung aus der Session, in jeder
  Phase. Er sieht dann eine eigene Meldung ("Du wurdest entfernt").
- **Dein eigenes Admin-Panel reagiert kurz nicht** (WLAN-Aussetzer) — kein
  Problem: Die Konsole bleibt bedienbar und zeigt nur eine kurze Meldung, bis
  die Verbindung wieder steht. Nur wenn die Seite *direkt beim Öffnen* nicht
  lädt, siehst du einen Vollbild-Fehler mit einem Knopf zurück zur Startseite.

Falls ein Fehler bestehen bleibt: Seite neu laden reicht in der Regel. Dein
Admin-Zugang bleibt dabei erhalten — er überlebt sogar das Schließen des
Browser-Tabs oder -Fensters, solange du denselben Browser auf demselben Gerät
wieder öffnest. Studierende können nach einem Reload (oder sogar nach dem
Schließen des Tabs) über die Startseite zurück: dort zeigt die Karte **"Frühere
Sessions"** ihre letzte Session mit Code und Rolle, Klick auf **"Wiederbetreten
→"** bringt sie zurück ins laufende Spiel.

## 6. Nach dem Spiel

Der Ergebnis-Bildschirm zeigt:

- **Kennzahlen-Kacheln**: Gesamtüberschuss über alle Runden, Effizienz im
  Vergleich zum theoretischen Optimum, durchschnittlicher Preis, Anzahl
  Transaktionen (von maximal möglichen).
- **Podium**: die drei profitabelsten Spieler (Verkäufer und Käufer getrennt
  vergleichbar über die Farbcodierung).
- **Vergleich volle vs. asymmetrische Information**: die zentrale Grafik für die
  Debrief-Diskussion — zeigt unmittelbar, wie sich durchschnittlicher
  Überschuss, Anzahl Transaktionen und durchschnittlicher Preis zwischen den
  beiden Phasen unterscheiden (inkl. prozentualer Veränderung).
- **Marktverlauf je Runde**: Angebots-/Nachfragekurven pro Runde, falls du im
  Detail auf einzelne Runden eingehen willst.
- **Detaillierte Ergebnistabelle**: jede Transaktion jeder Runde, für alle, die
  es genau nachvollziehen wollen.

Für eine neue Durchführung (z. B. nächster Kurs) **"← Neue Session"** klicken —
das bringt dich zurück zur Startseite, wo du wie in Abschnitt 2 eine neue
Session mit neuem Code anlegst.
