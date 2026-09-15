import { RoundResult, Player } from '../shared/types'

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
      profits[sd.playerId] = (profits[sd.playerId] ?? 0) + sd.earnings
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

  const blockHeights = ['h-20', 'h-28', 'h-16']
  const ranks = ranked.length >= 2 ? [2, 1, 3] : [1]

  const medalStyle = (rank: number) =>
    rank === 1
      ? { ring: 'border-lemon-500 bg-lemon-500/12', text: 'text-lemon-400' }
      : rank === 2
      ? { ring: 'border-mkt-500 bg-mkt-700/30',    text: 'text-mkt-300'  }
      : { ring: 'border-coral-600 bg-coral-600/10', text: 'text-coral-400'}

  return (
    <div className="panel-warm p-6">
      <div className="label mb-6">Rangliste — Top Spieler</div>
      <div className="flex items-end justify-center gap-4">
        {podiumOrder.map((r, idx) => {
          const rank = ranks[idx]
          if (!r) return null
          const medal = medalStyle(rank)
          return (
            <div key={r.player.id} className="flex flex-col items-center gap-2 flex-1 max-w-[140px]">
              {/* Name */}
              <div className="text-center px-1">
                <div className={`font-semibold text-sm truncate ${
                  r.role === 'seller' ? 'text-lemon-300' : 'text-ice-300'
                }`}>
                  {r.player.name}
                </div>
                <div className="text-mkt-600 text-[10px] mt-0.5">
                  {r.role === 'seller' ? 'Verkäufer' : 'Käufer'}
                </div>
              </div>

              {/* Profit */}
              <div className={`font-mono font-bold text-sm ${r.profit >= 0 ? 'text-lime-400' : 'text-coral-400'}`}>
                €{r.profit.toFixed(2)}
              </div>

              {/* Podium block */}
              <div className={`w-full rounded-t-2xl border-2 flex items-center justify-center ${blockHeights[idx]} ${medal.ring}`}>
                <span className={`font-display text-2xl font-bold ${medal.text}`}>{rank}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
