import { RoundResult, Player } from '../shared/types'
import { BUYER_VALUES, sellerCost } from '../shared/constants'

interface Props {
  results: RoundResult[]
  sellers: Player[]
  buyers: Player[]
  maxSellerUnits: number
}

export default function GameEndStats({ results, sellers, buyers, maxSellerUnits }: Props) {
  const totalSurplus = results.reduce((s, r) => s + r.totalSurplus, 0)

  // Theoretical max: each round, optimal = all buyers buy from sellers at Q2 price
  // Simplified: sum of (BUYER_VALUES[2] - sellerCost(2, i)) for each possible trade
  const possibleTradesPerRound = Math.min(buyers.length, sellers.length * maxSellerUnits)
  const optimalPerRound = (() => {
    let max = 0
    for (let i = 0; i < possibleTradesPerRound; i++) {
      const unitIdx = Math.floor(i / sellers.length)
      const surplusPerUnit = BUYER_VALUES[2] - sellerCost(2, Math.min(unitIdx, maxSellerUnits - 1))
      if (surplusPerUnit > 0) max += surplusPerUnit
    }
    return max
  })()
  const theoreticalMax = optimalPerRound * results.length

  const efficiency = theoreticalMax > 0 ? (totalSurplus / theoreticalMax) * 100 : 0

  // Average transaction price
  const prices: number[] = []
  for (const r of results) {
    for (const bd of r.buyerDecisions) {
      if (bd.price !== null) prices.push(bd.price)
    }
  }
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0

  // Total transactions
  const totalTransactions = results.reduce((s, r) =>
    s + r.buyerDecisions.filter(bd => bd.sellerId !== null).length, 0
  )

  const stats = [
    {
      label: 'Gesamtüberschuss',
      value: `€${totalSurplus.toFixed(2)}`,
      sub: `${results.length} Runden`,
      color: 'text-gold-500',
    },
    {
      label: 'Effizienz',
      value: `${efficiency.toFixed(0)}%`,
      sub: 'vs. Optimum',
      color: efficiency >= 75 ? 'text-lime-400' : efficiency >= 50 ? 'text-gold-500' : 'text-coral-400',
    },
    {
      label: 'Ø Preis',
      value: `€${avgPrice.toFixed(2)}`,
      sub: `${prices.length} Preise`,
      color: 'text-ice-400',
    },
    {
      label: 'Transaktionen',
      value: String(totalTransactions),
      sub: `von ${results.length * buyers.length} möglich`,
      color: 'text-violet-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map(s => (
        <div key={s.label} className="panel p-5 flex flex-col gap-1">
          <div className="label">{s.label}</div>
          <div className={`font-display text-3xl font-bold leading-none mt-1 ${s.color}`}>{s.value}</div>
          <div className="text-mkt-600 text-xs font-mono mt-1">{s.sub}</div>
        </div>
      ))}
    </div>
  )
}
