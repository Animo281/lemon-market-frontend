import { ReactNode } from 'react'
import { InfoMode } from '../shared/types'
import { MARKET_SCENE_IMAGE } from '../lib/marketScene'

interface Props {
  round: number
  infoMode: InfoMode
  earnings: number
  isLastRound: boolean
  children: ReactNode
}

// Darkened-scene + Kassenbuch-style card shell shared by BuyerView's and
// SellerView's (RoundReceipt.tsx) round-end screens — same visual language
// for "the round just ended", only the grid in the middle differs per role.
export default function RoundEndCard({ round, infoMode, earnings, isLastRound, children }: Props) {
  return (
    <div className="relative rounded-2xl overflow-hidden" style={{ border: '3px solid #2B1B12', aspectRatio: '1024 / 572' }}>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})`, filter: 'brightness(.32) saturate(.4)' }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="eve-note w-full max-w-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b-2 pb-3" style={{ borderColor: 'rgba(43,27,18,.2)' }}>
            <h2 className="font-caps text-lg">Runde {round}</h2>
            <span className="text-xs px-2 py-1 rounded-md border font-hand">
              {infoMode === 'full' ? 'Volle Info' : 'Asymm. Info'}
            </span>
          </div>

          {children}

          <div className="flex justify-between items-center pt-2 border-t-2 font-caps text-lg" style={{ borderColor: 'rgba(43,27,18,.2)' }}>
            <span>Dein Gewinn</span>
            <span>{earnings.toFixed(2)} €</span>
          </div>
          <div className="text-center text-xs opacity-60">
            {isLastRound ? 'Spiel endet…' : 'Warte auf nächste Runde…'}
          </div>
        </div>
      </div>
    </div>
  )
}
