import { GamePhase, InfoMode } from '../../shared/types'
import { LemonMark } from './icons'

interface Props {
  round: number
  totalRounds: number
  infoMode: InfoMode
  phase: GamePhase
  /** Sum of this buyer's earnings across finished rounds — stands in for the
   * mockup's "Budget" pill, which has no backend equivalent (see plan). */
  balance: number
}

export default function BuyerHud({ round, totalRounds, infoMode, phase, balance }: Props) {
  const full = infoMode === 'full'
  // Only the market phase (and the reveal it implies) has a meaningful
  // info-mode to show — lobby/seller-input haven't opened the board yet.
  const showInfoMode = phase === 'market'

  return (
    <header className="scene-hud">
      <div className="scene-brand">
        <LemonMark className="w-[3.4cqw] h-[3.4cqw] shrink-0" />
        Lemon Market
      </div>
      <div className="scene-pills">
        <span className="scene-pill">Runde <span className="v">{round}</span> von {totalRounds}</span>
        <span className={`scene-pill ${showInfoMode ? (full ? 'phase-full' : 'phase-asymm') : ''}`}>
          {showInfoMode ? (full ? 'Phase: Qualität sichtbar' : 'Phase: Qualität verdeckt') : 'Vorbereitung'}
        </span>
        <span className="scene-pill">Kontostand <span className="v">{balance.toFixed(2)} €</span></span>
      </div>
    </header>
  )
}
