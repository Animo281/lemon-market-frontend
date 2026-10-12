import { RoundResult, SellerDecision } from '../../shared/types'
import RoundEndCard from '../RoundEndCard'

interface Props {
  lastResult: RoundResult
  myResult: SellerDecision | undefined
  isLastRound: boolean
}

export default function RoundReceipt({ lastResult, myResult, isLastRound }: Props) {
  return (
    <RoundEndCard
      round={lastResult.round}
      infoMode={lastResult.infoMode}
      earnings={myResult?.earnings ?? 0}
      isLastRound={isLastRound}
    >
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
    </RoundEndCard>
  )
}
