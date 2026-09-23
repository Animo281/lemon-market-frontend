import { Player, RoundResult } from '../../shared/types'
import { QUALITY_LABEL } from '../../lib/marketScene'

interface Props {
  results: RoundResult[]
  sellers: Player[]
}

// Table 1 in Holt & Sherman (1999): a running record of every seller's
// price/grade/units-sold, one row per finished period, visible to buyers
// throughout — it's what lets them distrust a seller who dropped grade
// after the info switch. The app had this exact data (session.results) but
// only ever showed it to sellers (MarketPricesBoard) and the admin; buyers
// saw nothing but their own last purchase until game-end. This renders it
// incrementally, round by round, as soon as the first round finishes —
// same unmasked data (session.results is never grade-masked, see
// toPublic.ts), just finally surfaced on the buyer side too.
export default function MarketHistory({ results, sellers }: Props) {
  if (results.length === 0) return null
  const sortedSellers = [...sellers].sort((a, b) => a.slotIndex - b.slotIndex)

  return (
    <div className="eve-note p-3 text-sm overflow-x-auto">
      <div className="font-caps text-xs opacity-70 mb-2 px-1">Markttafel — bisherige Runden</div>
      <table className="w-full border-collapse font-mono text-xs whitespace-nowrap">
        <thead>
          <tr>
            <th className="text-left font-caps font-normal py-1 pr-3 opacity-70">Runde</th>
            {sortedSellers.map(s => (
              <th key={s.id} className="text-left font-caps font-normal py-1 pr-3 opacity-70">{s.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map(r => (
            <tr key={r.round} className="border-t" style={{ borderColor: 'rgba(43,27,18,.15)' }}>
              <td className="py-1 pr-3 font-bold">{r.round}</td>
              {sortedSellers.map(s => {
                const sd = r.sellerDecisions.find(d => d.playerId === s.id)
                return (
                  <td key={s.id} className="py-1 pr-3">
                    {sd ? (
                      <span className="inline-flex items-center gap-1">
                        <span style={{ color: QUALITY_LABEL[sd.grade].paper }}>{QUALITY_LABEL[sd.grade].label}</span>
                        <span>{sd.price.toFixed(2)} €</span>
                        <span className="opacity-60">×{sd.unitsSold}</span>
                      </span>
                    ) : <span className="opacity-40">—</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
