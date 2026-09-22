import { forwardRef } from 'react'
import { LemonMark } from '../buyer/icons'

interface Props {
  sellerName: string
  round: number
  totalRounds: number
  /** null outside the market phase — mirrors BuyerHud, which only shows the
   * info-mode pill once the board is actually open. */
  infoMode: 'full' | 'asymmetric' | null
  balance: number
  /** Replaces the mockup's countdown pill — the backend has no timer or
   * deadline at all (see plan), so this is a status label instead of a
   * clock: "Kiste wählen", "Kaufrunde läuft", etc. */
  statusLabel: string
}

// Same HUD shell as BuyerHud (buyer/BuyerHud.tsx), yellow "Verkäufer" pill
// instead of a round-only headline, and "Kasse" instead of "Kontostand" —
// per docs/lemon-market-ui/HANDOFF-verkaeufer.md. The Kasse pill takes a
// ref so the market-round screen can fly coins into it and bump-animate it
// on a sale.
const SellerHud = forwardRef<HTMLSpanElement, Props>(function SellerHud(
  { sellerName, round, totalRounds, infoMode, balance, statusLabel },
  moneyRef,
) {
  return (
    <header className="scene-hud">
      <div className="scene-brand">
        <LemonMark className="w-[3.4cqw] h-[3.4cqw] shrink-0" />
        Lemon Market
      </div>
      <div className="scene-pills">
        <span className="scene-pill seller-pill-role">Verkäufer <span className="v">{sellerName}</span></span>
        <span className="scene-pill">Runde <span className="v">{round}</span> von {totalRounds}</span>
        {infoMode && (
          <span className={`scene-pill ${infoMode === 'full' ? 'phase-full' : 'phase-asymm'}`}>
            {infoMode === 'full' ? 'Phase: Qualität sichtbar' : 'Phase: Qualität verdeckt'}
          </span>
        )}
        <span className="scene-pill">{statusLabel}</span>
        <span className="scene-pill" ref={moneyRef}>Kasse <span className="v">{balance.toFixed(2)} €</span></span>
      </div>
    </header>
  )
})

export default SellerHud
