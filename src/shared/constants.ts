import { EconomicsConfig, Grade } from './types'

// Holt & Sherman (1999) parameters — used only as the LandingView form's
// starting values now. The values that actually apply to a running session
// live on session.economics (host-configurable at create, see LandingView).
export const DEFAULT_BUYER_VALUES: Record<Grade, number> = { 1: 4.0, 2: 8.8, 3: 13.6 }
export const DEFAULT_SELLER_FIRST_COSTS: Record<Grade, number> = { 1: 1.4, 2: 4.6, 3: 11.0 }
export const DEFAULT_ECONOMICS: EconomicsConfig = {
  buyerValues: DEFAULT_BUYER_VALUES,
  sellerFirstCosts: DEFAULT_SELLER_FIRST_COSTS,
}

// Every unit past the first costs $1.00 more to produce — a fixed game rule
// (mirrors backend/src/shared/constants.ts), not a per-session parameter.
export const UNIT_COST_STEP = 1.00

// Marginal cost per unit (0-based index): firstCosts[grade] + index * step
export function sellerCost(firstCosts: Record<Grade, number>, grade: Grade, unitIndex: number): number {
  return firstCosts[grade] + unitIndex * UNIT_COST_STEP
}

export const DEFAULT_TOTAL_ROUNDS = 5
export const DEFAULT_MAX_SELLER_UNITS = 2

// Mirrors backend/src/shared/constants.ts LIMITS — used as the LandingView
// form's client-side clamp before a session (and its own session.limits)
// exists yet. ANLEITUNG-DOZENT.md promises "bis zu 10 bzw. 20 Personen";
// these used to be hardcoded to 6/10 here, silently undercutting what the
// backend and the instructor manual both actually allow.
export const MAX_SELLERS_LIMIT = 10
export const MAX_BUYERS_LIMIT = 20
export const MAX_SELLER_UNITS_LIMIT = 5
export const MAX_ROUNDS_LIMIT = 20
