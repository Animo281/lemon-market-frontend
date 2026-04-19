import { RoundResult, Player } from '../shared/types'
import { sellerCost } from '../shared/constants'

interface Props {
  sellers: Player[]
  buyers: Player[]
  results: RoundResult[]
}

interface Ranked {
  player: Player
  profit: number
  role: 'seller' | 'buyer'
}

export default function Podium({ sellers, buyers, results }: Props) {
  const profits: Record<string, number> = {}

  for (const r of results) {
    for (const sd of r.sellerDecisions) {
      const p = Array.from({ length: sd.unitsSold }, (_, i) =>
        sd.price - sellerCost(sd.grade, i)
      ).reduce((a, b) => a + b, 0)
      profits[sd.playerId] = (profits[sd.playerId] ?? 0) + p
    }
    for (const bd of r.buyerDecisions) {
      profits[bd.playerId] = (profits[bd.playerId] ?? 0) + bd.earnings
    }
  }

  const ranked: Ranked[] = [
    ...sellers.map(p => ({ player: p, profit: profits[p.id] ?? 0, role: 'seller' as const })),
    ...buyers.map(p => ({ player: p, profit: profits[p.id] ?? 0, role: 'buyer' as const })),
  ].sort((a, b) => b.profit - a.profit).slice(0, 3)

  if (ranked.length === 0) return null

  const podiumOrder = ranked.length >= 2
    ? [ranked[1], ranked[0], ranked[2]].filter(Boolean)
    : ranked

  const heights = ['h-20', 'h-28', 'h-16']
  const ranks = ranked.length >= 2 ? [2, 1, 3] : [1]

  const medalColor = (rank: number) =>
    rank === 1 ? 'border-gold-500 bg-gold-500/10 text-gold-500'
    : rank === 2 ? 'border-mkt-500 bg-mkt-700/30 text-mkt-300'
    : 'border-coral-600 bg-coral-600/10 text-coral-400'

  const roleColor = (role: 'seller' | 'buyer') =>
    role === 'seller' ? 'text-gold-400' : 'text-ice-400'

  return (
    <div className="panel p-6">
      <div className="label mb-5">Rangliste — Top Spieler</div>
      <div className="flex items-end justify-center gap-3">
        {podiumOrder.map((r, idx) => {
          const rank = ranks[idx]
          if (!r) return null
          return (
            <div key={r.player.id} className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
              {/* Name + role */}
              <div className="text-center">
                <div className={`font-bold text-sm truncate w-full text-center ${roleColor(r.role)}`}>{r.player.name}</div>
                <div className="text-mkt-600 text-[10px] font-mono">
                  {r.role === 'seller' ? 'Verkäufer' : 'Käufer'}
                </div>
              </div>

              {/* Profit */}
              <div className={`font-mono font-bold text-sm ${r.profit >= 0 ? 'text-lime-400' : 'text-coral-400'}`}>
                €{r.profit.toFixed(2)}
              </div>

              {/* Podium block */}
              <div className={`w-full rounded-t-xl border-2 flex items-center justify-center ${heights[idx]} ${medalColor(rank)}`}>
                <span className="text-2xl font-display font-bold">{rank}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
