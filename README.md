# Lemon Market — Frontend

React/TypeScript client for the "Market for Lemons" classroom experiment. Renders the
admin console, join flow, and live seller/buyer market boards, and drives all state
through the backend's session API.

## Setup

```bash
npm install
npm run dev      # development with hot reload → http://localhost:5173
npm run build    # tsc typecheck, then vite build → dist/
npm run preview  # serve the production build locally
```

This is a standalone repo — start the backend separately (`lemon-market-backend`,
`npm run dev` → `http://localhost:3001`) alongside this dev server.

The dev server proxies `/api` to `http://localhost:3001` (see `vite.config.ts`).

Set `VITE_API_URL` in `.env` to point the client at a specific backend — the checked-in
`.env` sets it to `http://localhost:3001/api` for local dev. **If `VITE_API_URL` is
unset, `src/api/client.ts` falls back to the hosted production backend
(`https://lemon-market-backend.onrender.com/api`), not the dev proxy** — deleting or
misconfiguring `.env` silently points local traffic at production.

## Routes

Defined in `src/App.tsx`:

| Path | View | Purpose |
|------|------|---------|
| `/` | `LandingView` | Landing page, create a new session |
| `/join/:code?` | `JoinView` | Join an existing session by code, pick role/slot |
| `/admin/:code` | `AdminView` | Admin console: start round, toggle info mode, kick players, force-advance |
| `/play/:code` | `PlayerView` | Player-facing market board — forks by role (see below) |

`ThemeToggle` is mounted outside `Routes` so light/dark mode is available on every page.

## Architecture

```
src/
├── views/            One component per route (see table above). PlayerView renders
│                       the seller board itself and delegates to BuyerView for buyers.
├── components/        MarketBoard, SupplyDemandGraph, ProfitTable, Podium,
│                       PlayerList, PhaseIndicator, SessionCodeDisplay,
│                       JoinSlotPicker, GameEndStats, InfoModeCompare, ThemeToggle,
│                       ErrorBanner (canonical error display, see below),
│                       ErrorBoundary (catches render-time throws)
│   └── buyer/          The illustrated "Abendmarkt" buyer scene: BuyerHud,
│                         MarketLane, StallSlot, SortingStation, icons
├── api/client.ts      Typed fetch wrapper — one function per backend endpoint,
│                       throws ApiError on non-2xx responses and on network failure
├── lib/
│   ├── marketScene.ts   Buyer-scene geometry (stall positions, crate-by-grade map)
│   ├── theme.ts          light/dark persistence (localStorage) + <html>.dark toggle
│   └── storage.ts        admin/player token storage — admin token in localStorage,
│                          player token + id in sessionStorage (per-tab, so multiple
│                          players can play from the same browser in different tabs)
├── shared/
│   ├── types.ts          PublicSession, Player, RoundResult, RoundMetrics, etc. —
│   │                       mirrors the backend's shared/types.ts by hand, not by import
│   └── constants.ts       BUYER_VALUES, SELLER_COSTS — also hand-mirrored; if the
│                            backend's economics ever change, update both
├── index.css           Tailwind layers + the design-system component classes
│                         (.panel, .panel-warm, .btn-primary, .btn-secondary,
│                         .input-base, .stall-card, .my-turn-ring, plus the
│                         Abendmarkt scene classes, see DESIGN.md)
├── App.tsx             Router
└── main.tsx             Entry point, wraps <App/> in <ErrorBoundary/>
```

`src/api/client.ts` mirrors the backend's session endpoints 1:1 (`createSession`,
`updateSessionConfig`, `getSession`, `joinSession`, `startGame`, `sellerDecision`,
`buyerDecision`, `nextRound`, `toggleInfoMode`, `kickPlayer`, `skipBuyer`,
`forceAdvance`) and shares its request/response types with `shared/types.ts`.

## State sync — polling, not websockets

There is no realtime channel. `AdminView`, `PlayerView`, and `JoinView` each run their
own `setInterval(load, 2000)` against `GET /session/:code` and replace their local
`session` state with whatever comes back. Consequences worth knowing before touching
any of these views:

- No `visibilitychange` pause, no backoff, no jitter — a backgrounded tab keeps polling.
- An in-flight action's optimistic `setSession(s)` can be overwritten by an
  older poll response that was already in flight when the action fired — there's no
  request sequencing. Rare in practice at 2s intervals, but real.
- `getSession(code, token?)` takes an optional token. Pass the caller's own
  admin/player token when you have one — the backend uses it to decide whether to show
  the real seller grade or the asymmetric-mode-masked one back to *that* caller (see
  the backend README, "Viewer-aware responses"). `AdminView`/`PlayerView` do this;
  `JoinView` doesn't (it never renders grades, and isn't authenticated yet anyway).

## Error handling

- `src/api/client.ts` throws `ApiError` (with `.status` and `.message`) on any non-2xx
  response, and now also on network failure (`fetch` rejecting) and on a malformed
  JSON body — both used to leak raw browser strings like "Failed to fetch" to the UI.
  `error.message` comes straight from the backend's `{ error: "..." }` body where
  available, and is German end-user text, safe to render as-is.
- `src/components/ErrorBanner.tsx` is the one error display used across `LandingView`,
  `JoinView`, `AdminView`, `PlayerView` (`BuyerView` keeps its own `eve-note`-styled
  block to match the illustrated scene, but uses the same `role="alert"`). Before this
  existed, each view had a slightly different hand-rolled error block.
- Views that poll (`AdminView`, `PlayerView`) only treat an error as fatal (full-page,
  with a way back to `/`) before their *first* successful load. After that, a failed
  poll shows the inline `ErrorBanner` and clears on the next successful poll — a
  session used to get permanently and silently locked out of its own console after a
  single dropped request.
- Game-critical actions (buy/pass, seller decision, and every admin action) now guard
  against double-submission with a local `busy`/`sellerBusy`/`buying` flag that
  disables the triggering control for the duration of the request.
- `src/components/ErrorBoundary.tsx` wraps `<App/>` in `main.tsx` — a render-time throw
  used to blank the whole page; now it shows a German "reload" screen instead.

## Design system

Visual language is documented in full in the repo-root `DESIGN.md` ("Nacht-Markt"
theme). Summary:

- **Typefaces**: DM Sans (`font-display`/`font-sans`) for UI text, JetBrains Mono
  (`font-mono`) reserved for prices, session codes, and tabular data. The buyer scene
  uses its own pair (`font-hand`/`font-caps`, Patrick Hand) — see DESIGN.md and the
  Abendmarkt section of `index.css`.
- **Color scale**: `mkt-*` (warm neutral) plus semantic accents `lemon` (sellers/
  prices/CTAs), `lime` (profit/full-info), `coral` (asymmetric-info/loss/errors),
  `ice` (buyer role) — all defined as CSS custom properties in `src/index.css` so both
  themes share one Tailwind config.
- **Light/dark**: toggled via a `.dark` class on `<html>` (`src/lib/theme.ts`), backed
  by `localStorage` under the `mkt-theme` key. Shadow depth is theme-aware through
  `--shadow-rgb`/`--shadow-strength` tokens rather than hardcoded dark-mode values, so
  panels/inputs/buttons stay legible in light mode too. The buyer scene is a fixed
  illustration and intentionally stays the same in both themes.
- **Component classes** in `src/index.css`: `.panel` / `.panel-warm` (cards),
  `.btn-primary` / `.btn-secondary`, `.input-base`, `.stall-card` (hover glow),
  `.my-turn-ring` (active-buyer highlight), `.label` (micro-labels).

A few source comments (`marketScene.ts`, `BuyerView.tsx`, `StallSlot.tsx`, `index.css`)
still reference a `HANDOFF.md` design handoff document — it isn't in the repo. The
geometry and rationale it would have documented lives as inline comments at each of
those call sites instead; treat those comments as the source of truth until/unless
`HANDOFF.md` is restored.

## Known limitations

- No reconnect UI beyond the "frühere Sessions" list on the landing page (backed by
  `sessionIndex` in `localStorage`) — closing a tab loses the in-memory `session` state,
  the reconnect list is the only way back in.
- Buyer turn order is visual only — see the backend README's "Known Limitations" for
  why (`currentPlayerId` is computed but not enforced server-side either).
- `shared/types.ts` and `shared/constants.ts` are hand-mirrored from the backend, not
  imported — they can drift if the backend changes without a matching frontend update.
