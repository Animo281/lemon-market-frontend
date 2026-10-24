import { GamePhase, InfoMode } from '../../shared/types'
import { LemonMark } from './icons'

interface Props {
  round: number
  infoMode: InfoMode
  phase: GamePhase
  /** Whether it's this buyer's turn to act during the market phase — only
   * meaningful when phase === 'market'. */
  isMyTurn: boolean
  /** Whether this buyer has already decided this round — only meaningful
   * when phase === 'market'. */
  hasDecided: boolean
}

const STATUS_LABEL: Record<GamePhase, string> = {
  lobby: 'Warte auf Spielstart',
  'seller-input': 'Verkäufer richten ein',
  market: 'Kaufrunde läuft',
  'round-end': 'Rundenende',
  'game-end': 'Spiel beendet',
}

export default function BuyerHud({ round, infoMode, phase, isMyTurn, hasDecided }: Props) {
  const full = infoMode === 'full'
  // Only the market phase (and the reveal it implies) has a meaningful
  // info-mode to show — lobby/seller-input haven't opened the board yet.
  const showInfoMode = phase === 'market'

  // The backend has no timer or deadline, so this is a status label instead
  // of a countdown clock. During the market phase it narrows further to
  // whose turn it is.
  const statusLabel = phase === 'market'
    ? (hasDecided ? 'Warte auf andere Käufer' : isMyTurn ? 'Du bist dran' : 'Warte auf deinen Zug')
    : STATUS_LABEL[phase]

  return (
    <header className="scene-hud">
      <div className="scene-brand">
        <LemonMark className="w-[3.4cqw] h-[3.4cqw] shrink-0" />
        Lemon Market
      </div>
      <div className="scene-pills">
        {/* Rounds are no longer fixed up front — the admin ends the game
            after whichever round, so there's no total to show here. */}
        <span className="scene-pill">Runde <span className="v">{round}</span></span>
        <span className={`scene-pill ${showInfoMode ? (full ? 'phase-full' : 'phase-asymm') : ''}`}>
          {showInfoMode ? (full ? 'Phase: Qualität sichtbar' : 'Phase: Qualität verdeckt') : 'Vorbereitung'}
        </span>
        <span className="scene-pill">{statusLabel}</span>
      </div>
    </header>
  )
}
