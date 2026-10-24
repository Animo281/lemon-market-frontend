import { Grade, Player, RoundResult } from '../../shared/types'
import { QUALITY_LABEL } from '../../lib/marketScene'

interface Props {
  results: RoundResult[]
  sellers: Player[]
  buyerId: string
}

// Tailwind tokens (not QUALITY_LABEL's .paper, which is tuned for the eve-note
// parchment background) — this table sits in a .panel, which is dark in dark
// mode, and .paper's greens/ambers/reds don't clear WCAG AA contrast there.
// Same mapping as GradeTally.tsx.
const GRADE_CLS: Record<Grade, string> = {
  1: 'text-coral-400',
  2: 'text-lemon-400',
  3: 'text-lime-400',
}

// Game-end feedback: a buyer could see their own earnings but never which
// quality they'd actually bought each round (RoundEndCard only shows the
// latest round) — this is the per-round record across the whole game,
// buyer-side counterpart to the admin's ProfitTable.
export default function MyPurchases({ results, sellers, buyerId }: Props) {
  if (results.length === 0) return null

  return (
    <div className="panel p-5 mb-4">
      <div className="label mb-3">Deine Käufe</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mkt-800">
              <th className="label text-left py-2 pr-4">Runde</th>
              <th className="label text-left py-2 pr-4">Verkäufer</th>
              <th className="label text-left py-2 pr-4">Qualität</th>
              <th className="label text-left py-2 pr-4">Preis</th>
              <th className="label text-left py-2">Gewinn</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => {
              const bd = r.buyerDecisions.find(d => d.playerId === buyerId)
              const seller = bd?.sellerId ? sellers.find(s => s.id === bd.sellerId) : null
              return (
                <tr key={r.round} className="border-b border-mkt-800/40">
                  <td className="py-2 pr-4 font-mono text-mkt-300 font-bold">{r.round}</td>
                  <td className="py-2 pr-4 text-mkt-200">{seller?.name ?? '—'}</td>
                  <td className="py-2 pr-4">
                    {bd?.grade ? (
                      <span className={`font-semibold ${GRADE_CLS[bd.grade]}`}>
                        {QUALITY_LABEL[bd.grade].label}
                      </span>
                    ) : <span className="text-mkt-500">Kein Kauf</span>}
                  </td>
                  <td className="py-2 pr-4 font-mono text-mkt-200">
                    {bd?.price != null ? `€${bd.price.toFixed(2)}` : '—'}
                  </td>
                  <td className={`py-2 font-mono font-bold ${(bd?.earnings ?? 0) >= 0 ? 'text-lime-400' : 'text-coral-400'}`}>
                    €{(bd?.earnings ?? 0).toFixed(2)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
