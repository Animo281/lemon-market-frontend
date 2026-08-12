import { PublicSession } from '../shared/types'

interface Props {
  session: PublicSession
  onKick?: (playerId: string, name: string) => void
}

export default function PlayerList({ session, onKick }: Props) {
  const sellers = session.players.filter(p => p.role === 'seller').sort((a, b) => a.slotIndex - b.slotIndex)
  const buyers  = session.players.filter(p => p.role === 'buyer').sort((a, b) => a.slotIndex - b.slotIndex)
  const joined = session.players.length
  const total  = session.numSellers + session.numBuyers

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="label">Teilnehmer</div>
        <span className="font-mono text-xs text-mkt-400">
          <span className="text-mkt-100 font-bold">{joined}</span>
          <span className="text-mkt-600">/{total}</span>
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-mkt-800 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-lemon-500 rounded-full transition-all duration-500"
          style={{ width: `${(joined / total) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sellers */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-lemon-500" />
            <span className="label text-lemon-500/80">
              Verkäufer {sellers.length}/{session.numSellers}
            </span>
          </div>
          <div className="space-y-1">
            {Array.from({ length: session.numSellers }, (_, i) => {
              const p = sellers.find(s => s.slotIndex === i)
              return (
                <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors ${
                  p ? 'text-mkt-100' : 'text-mkt-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p ? 'bg-lemon-400' : 'bg-mkt-800'}`} />
                  <span className="truncate font-sans">{p ? p.name : `Slot ${i + 1}`}</span>
                  {p && onKick && (
                    <button
                      className="ml-auto shrink-0 text-[9px] px-1.5 py-0.5 rounded border border-coral-500/30 text-coral-400 hover:bg-coral-500/10 transition-colors"
                      onClick={() => onKick(p.id, p.name)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Buyers */}
        <div>
          <div className="flex items-center gap-1.5 mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-ice-500" />
            <span className="label text-ice-500/80">
              Käufer {buyers.length}/{session.numBuyers}
            </span>
          </div>
          <div className="space-y-1">
            {Array.from({ length: session.numBuyers }, (_, i) => {
              const p = buyers.find(b => b.slotIndex === i)
              return (
                <div key={i} className={`flex items-center gap-2 py-1.5 px-2 rounded-lg text-xs transition-colors ${
                  p ? 'text-mkt-100' : 'text-mkt-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${p ? 'bg-ice-400' : 'bg-mkt-800'}`} />
                  <span className="truncate font-sans">{p ? p.name : `Slot ${i + 1}`}</span>
                  {p && onKick && (
                    <button
                      className="ml-auto shrink-0 text-[9px] px-1.5 py-0.5 rounded border border-coral-500/30 text-coral-400 hover:bg-coral-500/10 transition-colors"
                      onClick={() => onKick(p.id, p.name)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
