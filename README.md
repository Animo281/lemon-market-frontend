# Lemon Market — Frontend

React/TypeScript client for the "Market for Lemons" classroom experiment. Renders the
admin console, join flow, and live seller/buyer market boards, and drives all state
through the backend's session API — the frontend holds no game logic of its own.

## Setup

```bash
npm install
npm run dev      # development with hot reload → http://localhost:5173
npm run build    # tsc typecheck, then vite build → dist/
npm run preview  # serve the production build locally
```

The dev server proxies `/api` to `http://localhost:3001` (see `vite.config.ts`), so the
backend must be running alongside it. From the repo root, `npm run dev` starts both via
`concurrently`; see `backend/README.md` for the backend side.

Override the API base URL with `VITE_API_URL` (defaults to `/api`, i.e. the proxy).

## Routes

Defined in `src/App.tsx`:

| Path | View | Purpose |
|------|------|---------|
| `/` | `LandingView` | Landing page, create a new session |
| `/join/:code?` | `JoinView` | Join an existing session by code, pick role/slot |
| `/admin/:code` | `AdminView` | Admin console: start round, toggle info mode, kick players, force-advance |
| `/play/:code` | `PlayerView` | Player-facing market board (seller decision / buyer purchase) |

`ThemeToggle` is mounted outside `Routes` so light/dark mode is available on every page.

## Architecture

```
src/
├── views/            One component per route (see table above)
├── components/        MarketBoard, SupplyDemandGraph, ProfitTable, Podium,
│                       PlayerList, PhaseIndicator, SessionCodeDisplay,
│                       JoinSlotPicker, GameEndStats, InfoModeCompare, ThemeToggle
├── api/client.ts      Typed fetch wrapper — one function per backend endpoint,
│                       throws ApiError on non-2xx responses
├── lib/
│   ├── theme.ts        light/dark persistence (localStorage) + <html>.dark toggle
│   └── storage.ts       admin/player token storage — admin token in localStorage,
│                         player token + id in sessionStorage (per-tab, so multiple
│                         players can play from the same browser in different tabs)
├── shared/
│   ├── types.ts         PublicSession, Player, RoundResult, RoundMetrics, etc.
│   └── constants.ts
├── index.css           Tailwind layers + the design-system component classes
│                         (.panel, .panel-warm, .btn-primary, .btn-secondary,
│                         .input-base, .stall-card, .my-turn-ring)
├── App.tsx             Router
└── main.tsx             Entry point
```

`src/api/client.ts` mirrors the backend's session endpoints 1:1 (`createSession`,
`updateSessionConfig`, `getSession`, `joinSession`, `startGame`, `sellerDecision`,
`buyerDecision`, `nextRound`, `toggleInfoMode`, `kickPlayer`, `skipBuyer`,
`forceAdvance`) and shares its request/response types with `shared/types.ts`.

## Design system

Visual language is documented in full in the repo-root `DESIGN.md` ("Nacht-Markt"
theme). Summary:

- **Typefaces**: DM Sans (`font-display`/`font-sans`) for UI text, JetBrains Mono
  (`font-mono`) reserved for prices, session codes, and tabular data.
- **Color scale**: `mkt-*` (warm neutral) plus semantic accents `lemon` (sellers/
  prices/CTAs), `lime` (profit/full-info), `coral` (asymmetric-info/loss/errors),
  `ice` (buyer role) — all defined as CSS custom properties in `src/index.css` so both
  themes share one Tailwind config.
- **Light/dark**: toggled via a `.dark` class on `<html>` (`src/lib/theme.ts`), backed
  by `localStorage` under the `mkt-theme` key. Shadow depth is theme-aware through
  `--shadow-rgb`/`--shadow-strength` tokens rather than hardcoded dark-mode values, so
  panels/inputs/buttons stay legible in light mode too.
- **Component classes** in `src/index.css`: `.panel` / `.panel-warm` (cards),
  `.btn-primary` / `.btn-secondary`, `.input-base`, `.stall-card` (hover glow),
  `.my-turn-ring` (active-buyer highlight), `.label` (micro-labels).
