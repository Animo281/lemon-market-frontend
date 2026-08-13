# Lemon Market — Frontend

React/TypeScript client for the "Market for Lemons" classroom experiment. Renders the
admin console, join flow, and live seller/buyer market boards, and drives all state
through the backend's session API — the frontend holds no game logic of its own.

This repo is deployed to Vercel and talks to the production backend at
`https://lemon-market-backend.onrender.com` (see `src/api/client.ts`). Backend source
lives in the separate `Animo281/lemon-market-backend` repo.

## Setup

```bash
npm install
npm run dev      # development with hot reload → http://localhost:5173
npm run build    # tsc typecheck, then vite build → dist/
npm run preview  # serve the production build locally
```

`vite.config.ts` proxies `/api` to `http://localhost:3001` for local development, but
`src/api/client.ts` currently calls the deployed production backend
(`lemon-market-backend.onrender.com`) directly rather than going through that proxy —
point it at a local backend manually if you need to test against one.

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
│   └── storage.ts       admin/player token storage — all in sessionStorage (per-tab,
│                         so multiple players/admins can run from the same browser in
│                         different tabs); a separate localStorage session index keeps
│                         a reconnect record that survives browser close
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

"Nacht-Markt" theme (see the design brief in `index.html`'s top comment) — a warm
night-market surface where sellers pin price tags to their stall and buyers browse
them, with quality hidden in shadow when info mode is asymmetric.

- **Typefaces**: Bricolage Grotesque (`font-display`/`font-sans`) for UI text,
  JetBrains Mono (`font-mono`) reserved for prices, session codes, and tabular data.
- **Color scale**: `mkt-*` (warm neutral, `#120D08` dark-mode ground) plus semantic
  accents — `lemon` (sellers/prices/CTAs), `lime` (profit/full-info), `coral`
  (asymmetric-info/loss/Q1 quality/errors), `ice` (buyer role), `copper` (secondary
  accent/config) — defined as CSS custom properties in `src/index.css` so both themes
  share one Tailwind config.
- **Light/dark**: toggled via a `.dark` class on `<html>` (`src/lib/theme.ts`), backed
  by `localStorage` under the `mkt-theme` key.
- **Component classes** in `src/index.css`: `.panel` / `.panel-warm` (cards),
  `.btn-primary` / `.btn-secondary`, `.input-base`, `.stall-card` (hover glow),
  `.my-turn-ring` (active-buyer highlight), `.label` (micro-labels),
  `.quality-q1`/`.quality-q2`/`.quality-q3`, `.badge-full`/`.badge-asymm`.
