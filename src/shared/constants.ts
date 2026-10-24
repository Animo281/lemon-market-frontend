import { EconomicsConfig, Grade } from './types'

// Holt & Sherman (1999) parameters — used only as the LandingView form's
// starting values now. The values that actually apply to a running session
// live on session.economics (host-configurable at create, see LandingView).
export const DEFAULT_BUYER_VALUES: Record<Grade, number> = { 1: 4.0, 2: 8.8, 3: 13.6 }
export const DEFAULT_SELLER_FIRST_COSTS: Record<Grade, number> = { 1: 1.4, 2: 4.6, 3: 11.0 }
// The paper's own fixed rule ("2nd unit costs $1 more") — kept as the default
// value, but host-configurable per session via economics.unitCostStep.
export const UNIT_COST_STEP = 1.00
export const DEFAULT_ECONOMICS: EconomicsConfig = {
  buyerValues: DEFAULT_BUYER_VALUES,
  sellerFirstCosts: DEFAULT_SELLER_FIRST_COSTS,
  unitCostStep: UNIT_COST_STEP,
}

// Marginal cost per unit (0-based index): firstCosts[grade] + index * step.
// step defaults to UNIT_COST_STEP for callers that don't carry a full
// economics config in scope; pass session.economics.unitCostStep where available.
export function sellerCost(firstCosts: Record<Grade, number>, grade: Grade, unitIndex: number, step: number = UNIT_COST_STEP): number {
  return firstCosts[grade] + unitIndex * step
}

export const MAX_SELLER_UNITS_LIMIT = 5
export const MAX_ROUNDS_LIMIT = 20
// No fixed round count is chosen up front anymore — the admin ends the game
// after whichever round they like (api.endGame). Kept only as the backend's
// hard safety ceiling, so it defaults to the max rather than a curated number.
export const DEFAULT_TOTAL_ROUNDS = MAX_ROUNDS_LIMIT
export const DEFAULT_MAX_SELLER_UNITS = 2

// Mirrors backend/src/shared/constants.ts LIMITS — used as the LandingView
// form's client-side clamp before a session (and its own session.limits)
// exists yet. ANLEITUNG-DOZENT.md promises "bis zu 12 bzw. 24 Personen";
// these used to be hardcoded to 6/10 here, silently undercutting what the
// backend and the instructor manual both actually allow.
export const MAX_SELLERS_LIMIT = 12
export const MAX_BUYERS_LIMIT = 24

// Mirrors backend/src/shared/constants.ts — a seller must never price below
// their own grade's production cost (checked dynamically against minCost,
// see PriceBoard.tsx) and never above this flat ceiling.
export const MAX_SELLER_PRICE = 40

// Mirrors backend/src/shared/constants.ts — buyers act in groups of
// BUYER_GROUP_SIZE with a shared per-group turn timer instead of strictly
// one at a time. Group size is fixed (not configurable); the timer duration
// is, hence the min/max/default triplet matching the backend's.
export const BUYER_GROUP_SIZE = 3
export const DEFAULT_TURN_DURATION_SECONDS = 30
export const MIN_TURN_DURATION_SECONDS = 10
export const MAX_TURN_DURATION_SECONDS = 180
