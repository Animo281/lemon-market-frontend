import { CSSProperties } from 'react'
import { Grade } from '../../shared/types'
import { CRATE_BY_GRADE, QUALITY_LABEL } from '../../lib/marketScene'
import { TarpCover } from '../buyer/icons'

interface Props {
  price: number
  /** null = covered crate (asymmetric info, or not this viewer's own stand). */
  grade: Grade | null
  /** Chalkboard variant (the Lemonade-Wagen slot), instead of the paper sign. */
  chalk?: boolean
  /** Appends " (nur du)" to the quality label — used on a seller's own stand
   * in asymmetric mode, where only they still see the real grade. */
  ownHint?: boolean
  /** Positioning (atStyle/withRotation from marketScene.ts) — the card itself
   * doesn't know where it sits on the scene. */
  style?: CSSProperties
  id?: string
}

// The offer card shown at a stall: crate art + price + quality label, or a
// tarp-covered crate with "Qualität ?" when the grade is hidden. Shared by
// the buyer scene (StallSlot) and the seller's own market-round view
// (SellerStallSlot) — same card, per docs/lemon-market-ui/HANDOFF.md and
// HANDOFF-verkaeufer.md ("Angebotskarte (wie Käuferansicht)").
export default function OfferCard({ price, grade, chalk, ownHint, style, id }: Props) {
  return (
    <div id={id} className={`stall-offer${chalk ? ' chalk' : ''}`} style={style}>
      {grade !== null ? (
        <>
          {/* Same crate image for every grade — feedback from a live test run:
              a different crate per quality was itself a visual "tell" before
              anyone read the label. The only thing that should distinguish
              stands is the explicit "Qualität N" text/colour below, which is
              the actual revealed information, not a decorative hint. */}
          <div className="stall-crate">
            <img src={CRATE_BY_GRADE[2]} alt={`${QUALITY_LABEL[grade].label}: ${QUALITY_LABEL[grade].text}`} />
          </div>
          <div>
            <div className="price">{price.toFixed(2)} €</div>
            <span
              className="stall-qtext"
              style={{ color: chalk ? QUALITY_LABEL[grade].chalk : QUALITY_LABEL[grade].paper }}
            >
              {QUALITY_LABEL[grade].label}{ownHint ? ' (nur du)' : ''}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="stall-crate">
            <img src={CRATE_BY_GRADE[2]} alt="Abgedeckte Kiste" />
            <TarpCover />
          </div>
          <div>
            <div className="price">{price.toFixed(2)} €</div>
            <span className="stall-qtext stall-qunknown">Qualität ?</span>
          </div>
        </>
      )}
    </div>
  )
}
