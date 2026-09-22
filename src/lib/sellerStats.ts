import { Grade, PublicSession } from '../shared/types'
import { sellerCost } from '../shared/constants'

// Pure derivations from PublicSession for the seller view. The backend has
// no budget/balance field (see plan) — everything here is computed
// client-side from session.results, the same trick BuyerView.tsx already
// uses for its "Kontostand" pill.

/** Sum of this seller's earnings across finished rounds — the seller-side
 * "Kasse" pill. Can be negative if they ever priced below cost. */
export function sellerBalance(session: PublicSession, playerId: string): number {
  return session.results.reduce((sum, r) => {
    const sd = r.sellerDecisions.find(d => d.playerId === playerId)
    return sum + (sd?.earnings ?? 0)
  }, 0)
}

export interface MarketPriceSummary {
  byGrade: Record<Grade, number | null>
  all: number | null
  sold: number
  total: number
}

/** Average price sellers got for each grade in the most recently finished
 * round, plus the overall average and sold/offered totals — feeds the
 * "Marktpreise" chalkboard (Theke, Screen 3). session.results[] is never
 * masked by infoMode (unlike currentSellerDecisions/availableOffers), so
 * this is safe to compute regardless of the current infoMode. Returns null
 * before any round has finished (nothing to show yet in round 1). */
export function lastRoundMarketPrices(session: PublicSession): MarketPriceSummary | null {
  const last = session.results[session.results.length - 1]
  if (!last) return null

  const byGrade = {} as Record<Grade, number | null>
  for (const grade of [1, 2, 3] as Grade[]) {
    const sold = last.sellerDecisions.filter(sd => sd.grade === grade && sd.unitsSold > 0)
    const units = sold.reduce((s, sd) => s + sd.unitsSold, 0)
    byGrade[grade] = units > 0
      ? sold.reduce((s, sd) => s + sd.price * sd.unitsSold, 0) / units
      : null
  }

  return {
    byGrade,
    all: last.metrics.avgTransactionPrice,
    sold: last.sellerDecisions.reduce((s, sd) => s + sd.unitsSold, 0),
    total: last.sellerDecisions.reduce((s, sd) => s + sd.unitsOffered, 0),
  }
}

export interface SellerHistoryEntry {
  round: number
  grade: Grade
  price: number
  unitsSold: number
  unitsOffered: number
  earnings: number
}

/** This seller's own decisions across finished rounds, oldest first —
 * feeds the Kassenbuch's "Letzte Runden" list. */
export function sellerHistory(session: PublicSession, playerId: string): SellerHistoryEntry[] {
  const out: SellerHistoryEntry[] = []
  for (const r of session.results) {
    const sd = r.sellerDecisions.find(d => d.playerId === playerId)
    if (sd) {
      out.push({
        round: r.round, grade: sd.grade, price: sd.price,
        unitsSold: sd.unitsSold, unitsOffered: sd.unitsOffered, earnings: sd.earnings,
      })
    }
  }
  return out
}

/** Live estimate of this round's earnings so far, using the same formula as
 * the backend's computeSellerEarnings (gameAnalytics.ts) — sum of
 * (price − marginal cost) over the units sold so far. Used in the market
 * round (Screen 4) where the real per-round earnings aren't computed
 * server-side until round-end. */
export function liveSellerEarnings(grade: Grade, price: number, unitsSold: number): number {
  let total = 0
  for (let i = 0; i < unitsSold; i++) total += price - sellerCost(grade, i)
  return total
}

/** Sum of the per-unit marginal cost curve (shared/constants.ts) for
 * `units` crates of `grade` — the "Einkauf" figure shown on the label and
 * in the Kassenbuch. Purely informational: the backend never actually
 * deducts this on its own — computeSellerEarnings only subtracts cost from
 * *sold* units, so an unsold crate costs nothing in the real payout. See
 * Ledger.tsx for how that's reflected in the "Wenn nicht verkauft" row. */
export function totalPurchaseCost(grade: Grade, units: number): number {
  let total = 0
  for (let i = 0; i < units; i++) total += sellerCost(grade, i)
  return total
}
