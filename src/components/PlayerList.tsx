import { PublicSession } from '../shared/types'

interface Props {
  session: PublicSession
}

export default function PlayerList({ session }: Props) {
  const sellers = session.players.filter(p => p.role === 'seller').sort((a, b) => a.slotIndex - b.slotIndex)
  const buyers  = session.players.filter(p => p.role === 'buyer').sort((a, b) => a.slotIndex - b.slotIndex)
  const joined = session.players.length
  const total  = session.numSellers + session.numBuyers

  return (
    <div className="panel p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="label">Spieler</div>
        <span className="font-mono text-xs text-mkt-400">
          <span className="text-mkt-100 font-bold">{joined}</span>/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-mkt-800 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-gold-500 rounded-full transition-all duration-500"
          style={{ width: `${(joined / total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-gold-500 label mb-3">
            Verkäufer &nbsp;{sellers.length}/{session.numSellers}
          </div>
          <div className="space-y-1">
            {Array.from({ length: session.numSellers }, (_, i) => {
              const p = sellers.find(s => s.slotIndex === i)
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-mono transition-colors ${
                    p ? 'text-mkt-100' : 'text-mkt-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p ? 'bg-gold-500' : 'bg-mkt-700'}`} />
                  {p ? p.name : `Slot ${i + 1} — frei`}
                </div>
              )
            })}
          </div>
        </div>
        <div>
          <div className="text-ice-500 label mb-3">
            Käufer &nbsp;{buyers.length}/{session.numBuyers}
          </div>
          <div className="space-y-1">
            {Array.from({ length: session.numBuyers }, (_, i) => {
              const p = buyers.find(b => b.slotIndex === i)
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs font-mono transition-colors ${
                    p ? 'text-mkt-100' : 'text-mkt-600'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p ? 'bg-ice-500' : 'bg-mkt-700'}`} />
                  {p ? p.name : `Slot ${i + 1} — frei`}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
