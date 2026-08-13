# DESIGN.md — Market for Lemons

> Ground truth: shipped frontend build. Every token here is evidenced by
> `tailwind.config.js`, `src/index.css`, or a component. Nothing is invented.

---

## 1. World & Thesis

**THESIS** — Marktstand statt Marktplatzsoftware. The surface reads as a warm
night market for lemons, not a data dashboard. Warmth, organic darkness, and
neon-yellow price signs are the three primary sensory signals. The cold,
grid-heavy aesthetic of generic edu-tech is explicitly refused.

**OWN-WORLD** — Warmer Nacht-Ground at `mkt-950` (`#120D08`). Four semantic
accent families on top of a neutral warm-brown scale: Zitronen-Gelb (sellers,
prices, CTAs), Limette (profit, full-info, confirmation), Coral (asymmetric
info, loss, Q1 quality, error), Eis-Blau (buyer role). DM Sans carries every
display and UI string. JetBrains Mono is reserved strictly for prices,
session codes, and tabular data.

**STORY beat that affects the surface**: in asymmetric-info mode the quality
badge renders as `?` in a neutral mkt-600/mkt-800 chip — the information is
hidden by design, not a placeholder.

---

## 2. Palette

### 2.1 Neutral foundation — `mkt` scale

The scale is CSS-custom-property driven and inverts between dark (default) and
light themes. Dark is the canonical mode.

| Token        | Dark (rgb)         | Light (rgb)        | Role                          |
|--------------|--------------------|--------------------|-------------------------------|
| `mkt-950`    | 18 13 8            | 252 248 238        | Page background               |
| `mkt-900`    | 30 21 16           | 244 238 224        | Panel fill                    |
| `mkt-850`    | 42 30 20           | 234 226 210        | Input fill, secondary panel   |
| `mkt-800`    | 58 42 26           | 218 208 190        | Panel border (default)        |
| `mkt-700`    | 84 64 42           | 180 168 148        | Warm border, scrollbar thumb  |
| `mkt-600`    | 110 86 56          | 144 132 112        | Scrollbar hover, muted border |
| `mkt-500`    | 138 114 96         | 108 98 82          | Placeholder, status dots      |
| `mkt-400`    | 168 144 128        | 76 68 56           | De-emphasised text            |
| `mkt-300`    | 200 176 154        | 50 44 36           | Secondary text                |
| `mkt-200`    | 220 206 192        | 32 26 18           | Body text                     |
| `mkt-100`    | 245 237 208        | 18 12 6            | Primary text, headings        |

All values are raw RGB triples consumed via Tailwind's `/alpha-value` syntax
(`rgb(var(--mkt-900) / 0.6)`).

### 2.2 Semantic accent families

#### Lemon — `lemon-*` (Zitronen-Gelb)
Role: seller identity, prices, primary CTA, session codes, active glow.

| Token        | rgb              |
|--------------|------------------|
| `lemon-200`  | 253 240 160      |
| `lemon-300`  | 250 234 106      |
| `lemon-400`  | 245 216 40       |
| `lemon-500`  | 240 196 25       |
| `lemon-600`  | 200 156 8        |

`lemon-500` is the canonical CTA fill and glow seed. `lemon-400` appears on
large display text (prices, codes in JoinView). Selection highlight uses
`lemon-500` at 28% opacity.

#### Lime — `lime-*` (Limette)
Role: profit, full-info mode, Q3 quality badge, copy-confirmed state.

| Token       | rgb          |
|-------------|--------------|
| `lime-400`  | 120 216 72   |
| `lime-500`  | 92 192 48    |
| `lime-600`  | 66 160 32    |

#### Coral — `coral-*`
Role: asymmetric info mode, losses, Q1 quality badge, form errors.

| Token        | rgb          |
|--------------|--------------|
| `coral-400`  | 240 112 96   |
| `coral-500`  | 232 74 42    |
| `coral-600`  | 192 48 24    |

#### Ice — `ice-*` (Eis-Blau)
Role: buyer role identity.

| Token      | rgb          |
|------------|--------------|
| `ice-300`  | 136 216 245  |
| `ice-400`  | 90 196 236   |
| `ice-500`  | 56 168 216   |
| `ice-600`  | 26 136 190   |

#### Copper — `copper-*`
Role: secondary accent, admin/configuration surfaces.

| Token         | rgb          |
|---------------|--------------|
| `copper-400`  | 208 152 72   |
| `copper-500`  | 184 120 40   |
| `copper-600`  | 148 96 16    |

### 2.3 Chart tokens (SVG-layer only)

| Custom property  | Dark value    | Light value   |
|------------------|---------------|---------------|
| `--chart-bg`     | 18 13 8       | 252 248 238   |
| `--chart-grid`   | 58 42 26      | 218 208 190   |
| `--chart-axis`   | 84 64 42      | 180 168 148   |
| `--chart-tick`   | 138 114 96    | 108 98 82     |

---

## 3. Typography

### 3.1 Typefaces

| Family          | Weights loaded                   | Assignment                          |
|-----------------|-----------------------------------|-------------------------------------|
| DM Sans         | 400 500 600 700 800, italic 400   | `font-display`, `font-sans` (both aliases) |
| JetBrains Mono  | 400 500 600                       | `font-mono`                         |

Both are loaded from Google Fonts with `display=swap`.

**Rule**: DM Sans everywhere except prices, session codes, numeric
data columns, and URL fields — those are always JetBrains Mono.

`font-mono` elements carry `font-variant-numeric: tabular-nums` globally via
the base layer.

### 3.2 Type scale (as used, not as declared)

Display headlines use fluid sizing via `clamp()`. These are the three in-use
fluid values:

| Usage                  | `clamp()` value              | Font      | Weight |
|------------------------|------------------------------|-----------|--------|
| Page headline (Join)   | `clamp(2rem, 8vw, 3rem)`     | display   | bold   |
| Session code (Admin)   | `clamp(2.5rem, 8vw, 4rem)`   | mono      | bold   |
| Price (MarketBoard)    | `clamp(1.5rem, 4vw, 2rem)`   | mono      | bold   |

Static scale in use:

| Size   | Used for                                              |
|--------|-------------------------------------------------------|
| `xs`   | Badge text, sold-out stamp, copy button               |
| `sm`   | Session badge, status labels, error messages          |
| `base` | Form buttons, input text                              |

### 3.3 Micro-label

`.label` — `10px / uppercase / tracking-[0.14em] / mkt-500 / font-semibold`.
Used as field captions and panel section headers throughout. Never used as
a decorative kicker separate from a data field.

### 3.4 Sold-out stamp (inline badge)
`9px / bold / uppercase / tracking-widest / mkt-500 / border mkt-700 / rounded-md`.
This is a one-off size; it is not part of the base scale.

---

## 4. Component Vocabulary

### 4.1 `panel`
```
bg-mkt-900  border border-mkt-800  rounded-2xl
```
Default container for any discrete content region. No shadow. Used for
loading/error states and neutral card contexts.

### 4.2 `panel-warm`
```
bg-mkt-900  border border-mkt-700/60  rounded-2xl
inset top highlight: 0 1px 0 rgba(245,237,208,0.04)
```
Preferred container for interactive panels (forms, session code display). The
warm border and hairline top-highlight read as a market-board surface.
`panel-warm` is the higher-intent variant; use it where the user takes action.

### 4.3 `stall-card`
```
panel  transition-all duration-200
hover → border-color rgba(240,196,25,0.3)
       box-shadow 0 0 0 1px rgba(240,196,25,0.08),
                  0 4px 16px rgba(18,13,8,0.4)
```
The primary content card for MarketBoard entries. Inherits `panel` and adds a
lemon-tinted hover glow. Sold-out cards receive `opacity-30`. Cards animate in
via `animate-stall-in` with a `0.05s` per-index stagger.

### 4.4 `btn-primary`
```
bg-lemon-500  text-mkt-950  font-bold  rounded-xl  px-5 py-3
hover → bg-lemon-400
        box-shadow 0 4px 20px rgba(240,196,25,0.18)
active → scale-[0.98]
disabled → opacity-40  cursor-not-allowed
```
One canonical CTA colour: lemon-yellow on near-black text. The hover glow
confirms the seller-signal identity. Never use this for destructive actions.

### 4.5 `btn-secondary`
```
bg-mkt-850  text-mkt-100  font-bold  rounded-xl  px-5 py-3
border border-mkt-700
hover → border-mkt-600  bg-mkt-800
active → scale-[0.98]
disabled → opacity-40  cursor-not-allowed
```
Neutral alternative for non-primary actions (cancel, configure). Stays warm
but does not carry any accent hue.

### 4.6 `input-base`
```
bg-mkt-850  border border-mkt-800  rounded-xl  px-4 py-3
font-mono  text-mkt-100
focus → border-lemon-500/60  ring-2 ring-lemon-500/10
placeholder → text-mkt-700
```
All form text fields. Caret colour is `lemon-500` (set globally).

### 4.7 Quality badges — `quality-q1 / q2 / q3`
```
q1  text-coral-400  border-coral-500/40  bg-coral-500/10
q2  text-lemon-400  border-lemon-500/40  bg-lemon-500/10
q3  text-lime-400   border-lime-500/40   bg-lime-500/10
```
Inline chip with `px-2.5 py-1 rounded-lg border text-xs font-semibold`.
In asymmetric-info mode the chip collapses to neutral (`text-mkt-600 border-mkt-800 bg-transparent`) and displays `?`.

### 4.8 Info-mode badges — `badge-full / badge-asymm`
```
badge-full   text-lime-400  border-lime-500/30  bg-lime-500/10
badge-asymm  text-coral-400 border-coral-500/30 bg-coral-500/10
```
Used as session-level status indicators on the admin surface.

### 4.9 Session code display (SessionCodeDisplay)
`panel-warm` container. Code rendered in `font-mono font-bold text-lemon-500`
at `clamp(2.5rem, 8vw, 4rem)` with `tracking-[0.22em]`. The URL field below
uses `input-base` stripped to read-only; the copy button transitions to
`lime-400` on success.

### 4.10 Error / warning inline block
```
text-coral-400  text-sm  font-mono
bg-coral-500/8  border border-coral-500/25  rounded-xl  px-4 py-3
```
Used for form-level errors and the asymmetric-info mode warning banner in
MarketBoard.

---

## 5. Layout Patterns

### 5.1 Page root
Every view: `min-h-screen market-bg`. The `market-bg` utility adds two
radial-gradient overlays — a 4% lemon glow at top-left and a 3% lime glow at
bottom-right — over the `mkt-950` base.

### 5.2 Centred single-column (JoinView)
```
min-h-screen market-bg flex items-center justify-center p-6
  └─ w-full max-w-md space-y-4 animate-fade-up
```
The entry surface is a single 448px column, vertically and horizontally
centred. Sections stack with `space-y-4` or `space-y-5`.

### 5.3 MarketBoard grid
Responsive column count driven by seller count:

| Sellers | Columns                            |
|---------|------------------------------------|
| 1       | `grid-cols-1`                      |
| 2       | `grid-cols-1 sm:grid-cols-2`       |
| 3+      | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |

Gap: `gap-3` throughout. No fixed card height; cards size to content.

### 5.4 Border-divider pattern
Inline session badge in JoinView uses `border-b border-mkt-800` with
`pb-4` to separate identity from form fields. No horizontal rules elsewhere.

### 5.5 Scrollbar
5px wide, `mkt-900` track, `mkt-700` thumb (`rounded-full`), hover to
`mkt-600`. Applied globally via webkit scrollbar selectors.

---

## 6. Animation Tokens

All animations use `cubic-bezier(0.16, 1, 0.3, 1)` (spring-out) unless noted.

| Class               | Keyframe      | Duration | Easing                            | Use                             |
|---------------------|---------------|----------|-----------------------------------|---------------------------------|
| `animate-fade-up`   | fade-up       | 0.4s     | spring-out                        | Page/section entrance           |
| `animate-fade-in`   | fade-in       | 0.3s     | ease                              | Overlay / low-motion entrance   |
| `animate-scale-in`  | scale-in      | 0.28s    | spring-out                        | Modal / panel pop-in            |
| `animate-stall-in`  | stall-enter   | 0.35s    | spring-out                        | Stall-card grid entrance        |
| `animate-glow-pulse`| lemon-glow    | 2.2s     | ease-in-out infinite              | Session code / active highlight |
| `dot-ping`          | ping-dot      | 1.4s     | `cubic-bezier(0,0,0.2,1)` infinite| Loading status dots             |

Stall-card stagger: `animationDelay: idx * 0.05s` applied inline per card.

### Named shadow tokens

| Name            | Value                                                                 | Use                          |
|-----------------|-----------------------------------------------------------------------|------------------------------|
| `my-turn-ring`  | `0 0 0 1px rgba(240,196,25,0.5), 0 0 28px rgba(240,196,25,0.1)`    | Active buyer turn indicator  |
| btn-primary glow| `0 4px 20px rgba(240,196,25,0.18)`                                   | Primary button hover         |
| stall-card hover| `0 0 0 1px rgba(240,196,25,0.08), 0 4px 16px rgba(18,13,8,0.4)`    | Stall card hover state       |
| panel-warm inset| `inset 0 1px 0 rgba(245,237,208,0.04)`                              | Warm panel top highlight     |

---

## 7. Color Semantics Summary

| Signal              | Colour family | Canonical token |
|---------------------|---------------|-----------------|
| Seller / price / CTA| lemon         | `lemon-500`     |
| Full info / profit  | lime          | `lime-400`      |
| Asymm. / loss / Q1  | coral         | `coral-400`     |
| Buyer role          | ice           | `ice-400`       |
| Config / secondary  | copper        | `copper-500`    |
| Neutral surface     | mkt           | `mkt-900`       |
| Page ground         | mkt           | `mkt-950`       |

---

## 8. What Was Not Canonized

`ice-*` tokens are defined and semantically assigned to buyer-role identity in
the config and direction contract, but no shipped component in the sampled
surface area (`JoinView`, `MarketBoard`, `SessionCodeDisplay`, `AdminView`
header) applies them to rendered UI elements. They are not canonized as active
component rules; they remain palette-defined and available, but a future
surface should verify buyer-facing components before treating ice as a live
system pattern.
