import { RoundResult, Player } from '../../../shared/types'
import { sellerCost } from '../../../shared/constants'

interface Props {
  results: RoundResult[]
  sellers: Player[]
  buyers: Player[]
}

export default function ProfitTable({ results, sellers, buyers }: Props) {
  const sortedSellers = [...sellers].sort((a, b) => a.slotIndex - b.slotIndex)
  const sortedBuyers  = [...buyers].sort((a, b) => a.slotIndex - b.slotIndex)

  const buyerTotals: Record<string, number> = {}
  const sellerTotals: Record<string, number> = {}

  for (const r of results) {
    for (const bd of r.buyerDecisions) {
      buyerTotals[bd.playerId] = (buyerTotals[bd.playerId] ?? 0) + bd.earnings
    }
    for (const sd of r.sellerDecisions) {
      const profit = Array.from({ length: sd.unitsSold }, (_, i) =>
        sd.price - sellerCost(sd.grade, i)
      ).reduce((a, b) => a + b, 0)
      sellerTotals[sd.playerId] = (sellerTotals[sd.playerId] ?? 0) + profit
    }
  }

  const totalSurplus = results.reduce((s, r) => s + r.totalSurplus, 0)

  return (
    <div className="space-y-6">
      {/* Round table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-mkt-800">
              <th className="label text-left py-3 pr-5 whitespace-nowrap">Runde</th>
              <th className="label text-left py-3 pr-5">Info</th>
              {sortedSellers.map(s => (
                <th key={s.id} className="text-left py-3 pr-5 font-bold text-gold-500 text-[10px] whitespace-nowrap">
                  {s.name}
                </th>
              ))}
              <th className="label text-left py-3 whitespace-nowrap">Überschuss</th>
            </tr>
          </thead>
          <tbody>
            {results.map(r => (
              <tr
                key={r.round}
                className="border-b border-mkt-800/40 hover:bg-mkt-850/40 transition-colors"
              >
                <td className="py-3 pr-5 font-mono text-mkt-300 font-bold">{r.round}</td>
                <td className="py-3 pr-5">
                  <span className={`text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md border font-mono ${
                    r.infoMode === 'full'
                      ? 'border-lime-500/30 bg-lime-500/10 text-lime-400'
                      : 'border-coral-500/30 bg-coral-500/10 text-coral-400'
                  }`}>
                    {r.infoMode === 'full' ? 'Voll' : 'Asymm.'}
                  </span>
                </td>
                {sortedSellers.map(s => {
                  const sd = r.sellerDecisions.find(d => d.playerId === s.id)
                  return (
                    <td key={s.id} className="py-3 pr-5 font-mono text-mkt-300">
                      {sd ? (
                        <span className="flex items-center gap-1.5">
                          <span className={
                            sd.grade === 1 ? 'text-coral-400' :
                            sd.grade === 2 ? 'text-gold-500' :
                            'text-lime-400'
                          }>Q{sd.grade}</span>
                          <span className="text-mkt-200">€{sd.price.toFixed(2)}</span>
                          <span className="text-mkt-600">×{sd.unitsSold}</span>
                        </span>
                      ) : <span className="text-mkt-700">—</span>}
                    </td>
                  )
                })}
                <td className="py-3 font-mono font-bold text-gold-500">€{r.totalSurplus.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-5">
          <div className="label mb-4">Verkäufer-Profit</div>
          <div className="space-y-2">
            {sortedSellers.map(s => (
              <div key={s.id} className="flex justify-between items-center">
                <span className="text-gold-400 text-xs font-mono">{s.name}</span>
                <span className="font-mono font-bold text-mkt-100 text-sm">
                  €{(sellerTotals[s.id] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5">
          <div className="label mb-4">Käufer-Gewinn</div>
          <div className="space-y-2">
            {sortedBuyers.map(b => (
              <div key={b.id} className="flex justify-between items-center">
                <span className="text-ice-400 text-xs font-mono">{b.name}</span>
                <span className="font-mono font-bold text-mkt-100 text-sm">
                  €{(buyerTotals[b.id] ?? 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel p-5 flex flex-col items-center justify-center text-center">
          <div className="label mb-3">Gesamtüberschuss</div>
          <div className="font-display text-5xl font-bold text-gold-500 leading-none">
            €{totalSurplus.toFixed(2)}
          </div>
          <div className="label mt-2">{results.length} Runden</div>
        </div>
      </div>
    </div>
  )
}
