# Lemon Market – Verkäuferansicht

Ergänzung zu `HANDOFF.md` (Käuferansicht). Gleiche Assets, Tokens, Schriften und Koordinaten-Logik. Referenz: `mockup-verkaeuferansicht.html`.

## Ablauf pro Runde

| # | Screen | Timer-Label | Weiter mit |
|---|---|---|---|
| 1 | Stand wählen (nur in der Lobby bzw. erster Runde) | „Stand wählen" | „Stand übernehmen" |
| 2 | Kiste wählen (Qualität) | „Kiste wählen" | „Kiste nehmen" |
| 3 | Hinter der Theke (Preis setzen) | „Preis setzen" | „Schild aufhängen" = Angebot abschicken |
| 4 | Kaufrunde (zuschauen) | „Kaufrunde" | Rundenende vom Server |

Die Mockup-Steuerung (Screen-Tabs, Phase, Verkauf simulieren, Reset) **nicht** übernehmen.

## HUD

Wie Käuferansicht, zusätzlich Pill „Verkäufer: <Name>" (gelb `#DCCC62`). „Budget" heißt hier „Kasse". Beim Verkauf fliegen Münzen von der eigenen Angebotskarte zur Kasse-Pill (WAAPI, 7 Münzen, ~900ms, gestaffelt), danach kurzer Scale-Bump der Pill. Bei `prefers-reduced-motion: reduce` nur der Bump.

## Screen 1 – Stand wählen

- Hintergrund: Szene, `filter: brightness(.4) blur(3px) saturate(.8)`.
- Papierschild „Wähle deinen Stand" + Untertitel.
- 4 Karten nebeneinander, jede zeigt einen Ausschnitt der Szene per CSS (kein extra Bild):
  - Ausschnitt 206 × 250 Bildpixel, `y = 196`, `x` = Holzbude 13, Pavillon 231, Lemonade-Wagen 425, Schirm-Karren 625
  - `background-size: (1024/206)*100% (572/250)*100%`
  - `background-position: x/(1024-206)*100% 196/(572-250)*100%`
- Beim Lemonade-Wagen das Alien-Icon mit der Mini-Zitrone überdecken (bei `(577,219)` im Bild).
- Zustände: frei, ausgewählt (gelb, angehoben, Label „Dein Stand"), vergeben (grau, Bild entsättigt, „Vergeben an <Name>", `aria-disabled`).
- CTA erst aktiv, wenn ein Stand gewählt ist.

## Screen 2 – Kiste wählen

- Hintergrund: Szene auf die Sortierstation gezoomt (`background-size: 260%`, `background-position: 100% 56%`), abgedunkelt und geblurrt.
- 3 Optionen auf einem Holzbrett (`#A56D38`), jeweils: Etikett (Qualität, Beschreibung, Einkaufspreis) über großer Kiste (`crate-qX.png`).
- Ausgewählt: Option hebt sich, Etikett gelb, Marker „Ausgewählt".
- Hinweis-Tafel unten links: „Nur du kennst die Qualität. In Phase 2 sehen Käufer nur eine abgedeckte Kiste."
- Einkaufspreise im Mockup sind **Platzhalter**: Q1 30 €, Q2 20 €, Q3 10 €.

## Screen 3 – Hinter der Theke

- Hintergrund: Szene leicht gezoomt (`135%`, Position `31% 69%`), `brightness(.55) blur(2.5px)` = Blick über die Theke in den Markt.
- Links oben, Kreidetafel „Marktpreise": Ø-Preis der letzten Runde je Qualität (mit Mini-Kiste) + „Alle Stände Ø X € · Y von Z verkauft".
- Mitte, Kreidetafel „Dein Preis": großes Zahlenfeld (1–99), Holz-Buttons −5 / −1 / +1 / +5. Warnung in Kreide-Rot, wenn Preis < Einkauf oder > 2× Marktschnitt.
- Rechts, Kassenbuch (liniertes Papier mit rotem Rand): Kiste, Einkauf, Preis, „Wenn verkauft" (Gewinn, grün/rot), „Wenn nicht verkauft" (−Einkauf), darunter „Letzte Runden" (Runde, Qualität, Preis, verkauft/übrig mit Ergebnis). Aktualisiert live beim Preis ändern.
- Unten Holztheke (SVG) mit: gewählter Kiste + Etikett, Vorschau „So sehen dich Käufer in Phase N" (gleiche Angebotskarte wie in der Käuferansicht, Phase 2 = abgedeckt), CTA „Schild aufhängen", Geldkassette.

## Screen 4 – Kaufrunde

- Gleiche Szene und Slot-Koordinaten wie die Käuferansicht, aber **keine Kaufen-Buttons**.
- Kreide-Banner oben: „Kaufrunde läuft: Du siehst alle Preise, kaufen können nur Käufer".
- Alle Stände zeigen Namensschild + Angebotskarte. Fremde Qualität nur in Phase 1 sichtbar, die eigene immer (Phase 2 mit Zusatz „(nur du)").
- Eigener Stand: Namensschild „Dein Stand <Name>" (gelb), darüber Pfeil-Label „Du".
- Status-Chips auf Buttonhöhe (`top = 498`): fremd „Offen" / „Verkauft" (grün), eigen „Wartet auf Käufer…" → „+X € Gewinn" (grün) oder „−X €" (grau).
- Stempel: fremd „Verkauft" (rot), eigen „Verkauft!" (grün `#2F6B1A`) bzw. „Nicht verkauft" (grau).
- Toast unter dem Banner, z. B. „Ein Käufer hat deine Zitronen gekauft: +41 € Einnahme, +11 € Gewinn" bzw. „Runde vorbei, deine Kiste bleibt liegen: −30 €".
- Käufe anderer Stände live per WebSocket aktualisieren.

## Offene Punkte

1. Echte Einkaufspreise je Qualität und Startkapital.
2. Wird der Stand nur einmal (Lobby) oder jede Runde gewählt?
3. Welche Werte liefert das Backend für die Marktpreis-Tafel (Ø je Qualität, Verkaufsquote)?
4. Was passiert mit unverkaufter Ware (Totalverlust wie im Mockup)?
