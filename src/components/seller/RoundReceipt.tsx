import { RoundResult, SellerDecision } from '../../shared/types'
import { MARKET_SCENE_IMAGE } from '../../lib/marketScene'

interface Props {
  lastResult: RoundResult
  myResult: SellerDecision | undefined
  isLastRound: boolean
}

// Round-end receipt — same darkened-scene + Kassenbuch-style card pattern as
// BuyerView.tsx's round-end block, so both roles share one visual language
// for "the round just ended". Not in either HANDOFF mockup (they stop at
// the live market round); see the plan's "Warten & Ergebnis" decision.
export default function RoundReceipt({ lastResult, myResult, isLastRound }: Props) {
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
            <h2 className="font-caps text-lg">Runde {lastResult.round}</h2>
            <span className="text-xs px-2 py-1 rounded-md border font-hand">
              {lastResult.infoMode === 'full' ? 'Volle Info' : 'Asymm. Info'}
            </span>
          </div>

          {myResult ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="opacity-60 text-xs">Qualität</div>
                <div className="font-caps text-base">Q{myResult.grade}</div>
              </div>
              <div>
                <div className="opacity-60 text-xs">Preis</div>
                <div className="font-caps text-base">{myResult.price.toFixed(2)} €</div>
              </div>
              <div>
                <div className="opacity-60 text-xs">Einheiten</div>
                <div className="font-caps text-base">{myResult.unitsSold}/{myResult.unitsOffered}</div>
              </div>
              <div>
                <div className="opacity-60 text-xs">Verkauf</div>
                <div className="font-caps text-base">
                  {myResult.unitsSold > 0 ? `${myResult.unitsSold} verkauft` : 'Nicht verkauft'}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm opacity-70">Keine Entscheidung in dieser Runde</div>
          )}

          <div className="flex justify-between items-center pt-2 border-t-2 font-caps text-lg" style={{ borderColor: 'rgba(43,27,18,.2)' }}>
            <span>Dein Gewinn</span>
            <span>{(myResult?.earnings ?? 0).toFixed(2)} €</span>
          </div>
          <div className="text-center text-xs opacity-60">
            {isLastRound ? 'Spiel endet…' : 'Warte auf nächste Runde…'}
          </div>
        </div>
      </div>
    </div>
  )
}
