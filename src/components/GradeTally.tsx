import { Grade, RoundResult, SellerDecision } from '../shared/types'

interface Props {
  sellerDecisions: SellerDecision[]
  /** Server's automatic per-round tally (gameAnalytics.ts countUnitsSoldByGrade).
   * Preferred over summing sellerDecisions client-side when present. */
  unitsSoldByGrade?: Record<Grade, number>
}

const GRADE_CLS: Record<Grade, string> = {
  1: 'text-coral-400',
  2: 'text-lemon-400',
  3: 'text-lime-400',
}

// Admin feedback: "automatische Auszählung der Qualitäten nach jeder Runde" —
// a quick per-grade tally of units offered vs. sold, shown on the round-end
// panel and summed across rounds on the game-end screen.
export default function GradeTally({ sellerDecisions, unitsSoldByGrade }: Props) {
  const offered: Record<Grade, number> = { 1: 0, 2: 0, 3: 0 }
  const sold: Record<Grade, number> = unitsSoldByGrade ?? { 1: 0, 2: 0, 3: 0 }
  for (const sd of sellerDecisions) {
    offered[sd.grade] += sd.unitsOffered
    if (!unitsSoldByGrade) sold[sd.grade] += sd.unitsSold
  }

  return (
    <div className="flex flex-wrap gap-3 text-xs font-mono">
      {([1, 2, 3] as Grade[]).map(g => (
        <span key={g} className="flex items-center gap-1.5 bg-mkt-850 border border-mkt-800 rounded-lg px-2.5 py-1">
          <span className={`font-bold ${GRADE_CLS[g]}`}>Q{g}</span>
          <span className="text-mkt-300">{sold[g]}</span>
          <span className="text-mkt-500">/{offered[g]} verkauft</span>
        </span>
      ))}
    </div>
  )
}

// Game-end counterpart: one row per round plus a totals row, so the
// lecturer can see the quality mix evolve across the whole game, not just
// the latest round.
export function GradeTallyTable({ results }: { results: RoundResult[] }) {
  const totals: Record<Grade, number> = { 1: 0, 2: 0, 3: 0 }
  return (
    <table className="w-full text-xs font-mono">
      <thead>
        <tr className="border-b border-mkt-800">
          <th className="label text-left py-2 pr-4">Runde</th>
          <th className="label text-left py-2 pr-4 text-coral-400">Q1</th>
          <th className="label text-left py-2 pr-4 text-lemon-400">Q2</th>
          <th className="label text-left py-2 text-lime-400">Q3</th>
        </tr>
      </thead>
      <tbody>
        {results.map(r => {
          const sold = r.metrics.unitsSoldByGrade
          for (const g of [1, 2, 3] as Grade[]) totals[g] += sold[g]
          return (
            <tr key={r.round} className="border-b border-mkt-800/40">
              <td className="py-2 pr-4 text-mkt-300 font-bold">{r.round}</td>
              <td className="py-2 pr-4 text-mkt-200">{sold[1]}</td>
              <td className="py-2 pr-4 text-mkt-200">{sold[2]}</td>
              <td className="py-2 text-mkt-200">{sold[3]}</td>
            </tr>
          )
        })}
        <tr className="border-t border-mkt-800 font-bold">
          <td className="py-2 pr-4 text-lemon-400">Σ</td>
          <td className="py-2 pr-4 text-lemon-400">{totals[1]}</td>
          <td className="py-2 pr-4 text-lemon-400">{totals[2]}</td>
          <td className="py-2 text-lemon-400">{totals[3]}</td>
        </tr>
      </tbody>
    </table>
  )
}
