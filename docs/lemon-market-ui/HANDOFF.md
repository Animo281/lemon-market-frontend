# Lemon Market – Käuferansicht (Abendmarkt)

Übergabe für Claude Code. Ziel: Die Käuferansicht (Marktphase, Rolle BUYER) im bestehenden Frontend nach diesem Mockup umsetzen.

## Dateien

| Datei | Zweck |
|---|---|
| `mockup-kaeuferansicht.html` | Klickbare Referenz (im Browser öffnen). Bilder sind als Base64 eingebettet, **nicht** 1:1 in Produktion übernehmen |
| `assets/market-evening.png` | Hintergrundszene, 1024 × 572, Original |
| `assets/market-evening.webp` | Dieselbe Szene komprimiert (~130 KB), für Produktion empfohlen |
| `assets/crate-q1.png` … `crate-q3.png` | Qualitätskisten (transparent, 2x), aus der Sortierstation ausgeschnitten |

## Vorgehen für Claude Code

1. Repo lesen und bestehende Käuferansicht, Datenmodell (Angebot, Qualität, Phase, Budget) und Styling-Setup finden.
2. Assets nach `src/assets/market/` kopieren.
3. Käuferansicht als eigene Komponente nach diesem Dokument bauen, Mockup-Steuerung (Phase-Toggle, Slider, Reset) **nicht** übernehmen, die Werte kommen aus dem Spielzustand.
4. Vor dem Bauen nachfragen, falls Datenmodell oder Qualitätsskala vom Mockup abweichen (siehe „Offene Punkte").

## Aufbau

```
.scroller            overflow-x: auto, Rahmen 3px, radius 16px
└─ .world            min-width: 880px; container-type: inline-size; bg = Himmelblau
   ├─ header.hud     Logo + Pills: Runde, Phase, Budget, Timer
   └─ main
      └─ section.lane (pro Marktgasse, aspect-ratio 1024/572, Hintergrundbild)
         ├─ Overlays pro Stand (position: absolute, Werte in %)
         └─ Kaufen-Button pro Stand
```

- Alle Overlay-Positionen sind in **Bildpixeln (1024 × 572)** definiert und werden in `%` umgerechnet: `left = x / 1024 * 100%`, `top = y / 572 * 100%`.
- Alle Schriftgrößen in `cqw` (relativ zur Breite von `.world`), damit alles mit dem Bild skaliert.
- Unter 880px Breite scrollt die Szene horizontal statt zu schrumpfen.

## Stand-Slots pro Marktgasse (4 Verkäufer)

Die Sortierstation rechts ist **kein** Verkäufer, sie bleibt als Legende für die Qualitätsstufen immer sichtbar.

| Slot | Stand im Bild | Button-Mitte x | Namensschild `[x,y,w,h]`, Rotation | Angebotskarte Mitte `(x,y)`, Rotation, Stil | Abdunkel-Bereich `[x,y,w,h]` |
|---|---|---|---|---|---|
| 0 | Holzbude (alter Mann) | 116 | `[72,222,119,51]`, −2° | `(128,418)`, −1.6°, Papier | `[8,196,222,280]` |
| 1 | Pavillon (Sorbet) | 334 | `[275,228,117,42]`, 0° | `(334,423)`, 0.6°, Papier | `[234,186,202,290]` |
| 2 | Lemonade-Wagen | 528 | `[466,227,123,31]`, 0°, **gelb, einzeilig** | `(530,418)`, −2°, **Kreidetafel** | `[444,204,172,274]` |
| 3 | Schirm-Karren (Öl) | 725 | `[675,224,111,51]`, 3.4° | `(712,410)`, 2°, Papier | `[628,196,200,282]` |

- Kaufen-Button: `top = 498` (Bildpixel), horizontal zentriert auf „Button-Mitte x".
- Slot 2: Über dem LEMONADE-Schild ist ein kleines Alien-Icon im Bild. Wird mit einer Mini-Zitrone (SVG) bei `(577,219)` überdeckt, auch bei geschlossenem Stand.
- Namensschilder überdecken absichtlich die gemalten Produkttexte.

## Zustände pro Stand

| Zustand | Darstellung |
|---|---|
| Offen, Phase 1 | Angebotskarte: Kiste der echten Qualität + Preis + „Qualität 1/2/3" (farbig) |
| Offen, Phase 2 | Angebotskarte: Kiste mit Plane (SVG über `crate-q2.png`) + Preis + „Qualität ?" |
| Gekauft | Roter Stempel „Gekauft" über der Angebotskarte (kurze Press-Animation, nur ohne `prefers-reduced-motion`), Button grün „Gekauft" |
| Budget zu knapp | Button grau „Budget zu knapp", `aria-disabled="true"` |
| Geschlossen (kein Verkäufer im Slot) | „Licht aus": `backdrop-filter: brightness(.32) saturate(.35)` mit weichen Kanten per `mask-image` (zwei linear-gradients, `mask-composite: intersect`) + braunes Schild „Geschlossen" bei `(cx, 320)`. Kein Namensschild, keine Karte, kein Button |

## Marktgassen

- `lanes = ceil(anzahlVerkäufer / 4)`, jede Gasse ist eine Kopie der Szene.
- Verkäufer werden der Reihe nach auf die Slots verteilt, übrige Slots der letzten Gasse sind „geschlossen".
- Ab 2 Gassen: Schild „Marktgasse N" oben links (`left 1%, top 1.6%`).

## Qualität

**Backend-Grade 3 ist die beste Qualität, Grade 1 die schlechteste** — umgekehrt zur
Beschriftung, die im gemalten Sortierstations-Hintergrund steht (der zeigt „Qualität 1"
über der makellosen Kiste). Die Implementierung (`lib/marketScene.ts`, `QUALITY_LABEL`)
legt eigene Beschriftungen über das Bild und benutzt durchgehend die Backend-Nummerierung,
weil die auch Verkäufer, Admin-Ansicht und Profit-Tabellen verwenden. Diese Tabelle war
zuvor noch mit der (falschen) Bild-Beschriftung dokumentiert — hier der tatsächliche Stand:

| Stufe (Backend-Grade) | Label | Beschreibung (Sortierstation) | Farbe Papier | Farbe Kreide |
|---|---|---|---|---|
| 3 (beste) | Qualität 3 | Perfekt, makellos | `#2F5E12` | `#B9E28A` |
| 2 | Qualität 2 | Geringe Mängel | `#7A5A06` | `#F4D46A` |
| 1 (schlechteste) | Qualität 1 | Deutliche Mängel | `#8E2A14` | `#F4A58A` |

Bild-`alt` der Kiste: `"Qualität 3: Perfekt, makellos"` usw., in Phase 2 `"Abgedeckte Kiste"`.

## Design-Tokens

```css
--sky: #4D7AA1;        /* HUD-Hintergrund, passt zum Bildrand */
--ink: #2B1B12;        /* Rahmen, Text */
--paper: #F1E4CE;      /* Schilder, Karten, Pills */
--lemonade: #DCCC62;   /* Namensschild Wagen */
--chalk: #2E3631;      /* Kreidetafel */
--chalkText: #F3EEE2;
--lemon: #F4C542;      /* Kaufen-Button */
--stamp: #A8261C;      /* Gekauft-Stempel */
Phase-Pill: Phase 1 #D9E8B8, Phase 2 #F6D98C
Button „Gekauft": #C9DFA2 / Text #23460C
Button „Budget zu knapp": #CFC4B2 / Text #5A4A3C
```

- Schriften (Google Fonts): `Patrick Hand` (Fließtext) und `Patrick Hand SC` (Preise, Labels, Buttons, Logo).
- Kaufen-Button: Rahmen `.25cqw`, harter Schatten `0 .35cqw 0 var(--ink)`, beim Drücken nach unten versetzt.
- Seitenhintergrund und Panels außerhalb der Szene unterstützen Light/Dark Mode (siehe Mockup-CSS), die Szene selbst bleibt immer gleich.

## Barrierefreiheit

- Kaufen-Buttons mit `aria-label`, z. B. „Zitronen von Ali für 38 € kaufen".
- Nach einem Kauf Meldung in `aria-live="polite"`: „Zitronen von Ali für 38 € gekauft. Restbudget 62 €."
- Fokus nach dem Kauf zurück auf den Button des Stands.
- Sichtbarer Fokus: `outline: 3px solid` mit Offset.

## Offene Punkte (vor Umsetzung klären)

1. ~~Hat das Backend genau 3 Qualitätsstufen? Falls nicht: Mapping auf die 3 Kisten festlegen.~~ Geklärt: ja, genau 3 (`Grade = 1|2|3`). Backend-Grade 3 ist die beste Qualität — umgekehrt zur gemalten Sortierstation. Mapping in `src/lib/marketScene.ts` (`CRATE_BY_GRADE`).
2. ~~Darf ein Käufer pro Runde mehrmals kaufen? Im Mockup ja, solange das Budget reicht.~~ Geklärt: nein — das Backend erlaubt genau eine Kaufentscheidung pro Käufer und Runde (`submitBuyerDecision`), unabhängig von einem Budget.
3. ~~Kommt der Timer vom Server? Im Mockup läuft er nur lokal.~~ Geklärt: es gibt serverseitig gar keinen Timer/keine Deadline. Umgesetzt als reines Status-Label statt Countdown (siehe `BuyerHud.tsx`).
4. Sollen die gemalten Produktschilder sichtbar bleiben (dann Namen woanders platzieren)? — offen, in der Umsetzung unverändert gelassen (Namensschilder überdecken sie wie ursprünglich vorgesehen).
5. **Neu, aus der Umsetzung:** „Budget zu knapp" (grauer, deaktivierter Kaufen-Button) ist **nicht umsetzbar** — das Backend kennt kein Käuferbudget und prüft keine Kaufkraft; ein Kauf gelingt unabhängig vom bisherigen Kontostand. Der Zustand fehlt bewusst in `StallSlot.tsx`.
