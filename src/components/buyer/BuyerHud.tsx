import { useEffect, useState } from 'react'
import { GamePhase, InfoMode } from '../../shared/types'
import { LemonMark } from './icons'

interface Props {
  round: number
  infoMode: InfoMode
  phase: GamePhase
  /** Whether it's this buyer's turn to act during the market phase — only
   * meaningful when phase === 'market'. Buyers act in small concurrent
   * groups, so several buyers can have isMyTurn true at once. */
  isMyTurn: boolean
  /** Whether this buyer has already decided this round — only meaningful
   * when phase === 'market'. */
  hasDecided: boolean
  /** Epoch ms deadline for the current buyer group's shared turn timer;
   * null outside the market phase. Ticked down locally, resynced on poll. */
  turnDeadline: number | null
  /** True for a brief moment right when isMyTurn flips to true — drives a
   * one-shot stronger glow so a newly-active buyer actually notices. */
  turnFlash: boolean
}

function useCountdown(deadline: number | null): number | null {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  useEffect(() => {
    if (deadline === null) { setSecondsLeft(null); return }
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)))
    tick()
    const iv = setInterval(tick, 1000)
    return () => clearInterval(iv)
  }, [deadline])
  return secondsLeft
}

const STATUS_LABEL: Record<GamePhase, string> = {
  lobby: 'Warte auf Spielstart',
  'seller-input': 'Verkäufer richten ein',
  market: 'Kaufrunde läuft',
  'round-end': 'Rundenende',
  'game-end': 'Spiel beendet',
}

export default function BuyerHud({ round, infoMode, phase, isMyTurn, hasDecided, turnDeadline, turnFlash }: Props) {
  const full = infoMode === 'full'
  // Only the market phase (and the reveal it implies) has a meaningful
  // info-mode to show — lobby/seller-input haven't opened the board yet.
  const showInfoMode = phase === 'market'
  const secondsLeft = useCountdown(turnDeadline)

  // Buyers act in small concurrent groups with a shared group timer, not a
  // per-person countdown — the label makes that explicit so "noch 12s"
  // doesn't read as "just for you".
  const statusLabel = phase === 'market'
    ? (hasDecided ? 'Warte auf andere Käufer'
      : isMyTurn ? `Du bist dran${secondsLeft != null ? ` · noch ${secondsLeft}s` : ''}`
      : 'Warte auf deinen Zug')
    : STATUS_LABEL[phase]

  return (
    <header className={`scene-hud${isMyTurn ? ' my-turn-ring' : ''}${turnFlash ? ' animate-glow-pulse' : ''}`}>
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
        <span className={`scene-pill${isMyTurn ? ' my-turn' : ''}`}>{statusLabel}</span>
      </div>
    </header>
  )
}
