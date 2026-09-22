import { AvailableOffer, Grade, InfoMode, Player } from '../../shared/types'
import { atStyle, boxStyle, withRotation, CHIP_Y, StallSlotGeometry } from '../../lib/marketScene'
import { liveSellerEarnings } from '../../lib/sellerStats'
import { MiniLemonIcon } from '../buyer/icons'
import OfferCard from '../market/OfferCard'
import ClosedStall from '../market/ClosedStall'

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(2)} €`

interface Props {
  slot: StallSlotGeometry
  seller: Player | undefined
  offer: AvailableOffer | undefined
  isMine: boolean
  /** This seller's real grade — only meaningful when isMine, read from
   * session.currentSellerDecisions[myId] (viewer-unmasked), never from
   * `offer.grade`, which the backend forces to null for everyone including
   * the seller themselves in asymmetric mode. */
  myGrade: Grade | null
  infoMode: InfoMode
}

// One stall in the live market round (Screen 4) — per
// docs/lemon-market-ui/HANDOFF-verkaeufer.md. Same geometry and offer-card
// styling as the buyer scene's StallSlot, but no buy button, and the
// seller's own stand always shows its real quality to them.
export default function SellerStallSlot({ slot, seller, offer, isMine, myGrade, infoMode }: Props) {
  const closed = !seller || !offer || offer.price === null
  if (closed || !seller || !offer) {
    return <ClosedStall slot={slot} />
  }

  const cover = slot.cover && (
    <div className="stall-cover-lemon" style={atStyle(slot.cover[0], slot.cover[1])}>
      <MiniLemonIcon />
    </div>
  )

  const price = offer.price as number
  const soldOut = offer.unitsRemaining <= 0

  const chip = isMine
    ? offer.unitsSold === 0
      ? <span className="chip me abs" style={atStyle(slot.cx, CHIP_Y)}>Wartet auf Käufer<span className="dots" /></span>
      : (
        <span className="chip me abs" style={atStyle(slot.cx, CHIP_Y)}>
          {offer.unitsSold} von {offer.unitsOffered} verkauft · {signed(liveSellerEarnings(myGrade as Grade, price, offer.unitsSold))}
        </span>
      )
    : <span className={`chip abs${soldOut ? ' sold' : ''}`} style={atStyle(slot.cx, CHIP_Y)}>{soldOut ? 'Ausverkauft' : 'Offen'}</span>

  return (
    <>
      <div
        className={`stall-name${slot.name.style === 'lemonade' ? ' lemonade' : ''}${isMine ? ' mine' : ''}`}
        style={withRotation(boxStyle(slot.name.box), slot.name.rotationDeg)}
      >
        <small>{isMine ? 'Dein Stand' : 'Stand'}</small>
        <b>{seller.name}</b>
      </div>
      {isMine && (
        <div className="metag" style={atStyle(slot.name.box[0] + slot.name.box[2] / 2, slot.name.box[1] - 14)}>Du</div>
      )}
      {cover}

      <OfferCard
        id={isMine ? 'my-offer' : undefined}
        price={price}
        grade={isMine ? myGrade : offer.grade}
        chalk={slot.offer.style === 'chalk'}
        ownHint={isMine && infoMode === 'asymmetric'}
        style={withRotation(atStyle(slot.offer.x, slot.offer.y), slot.offer.rotationDeg)}
      />

      {/* Foreign stalls get a sold-out stamp once nothing's left, matching
          the buyer scene's "Gekauft" stamp treatment. The seller's own stand
          doesn't get one here — with multiple units, "1 von 2 verkauft" is
          mid-round, not a single done/not-done outcome; that summary lives
          in the chip instead, and the full picture comes at round-end
          (RoundReceipt). */}
      {!isMine && soldOut && (
        <div className="stall-stamp" style={atStyle(slot.offer.x, slot.offer.y)}>Verkauft</div>
      )}

      {chip}
    </>
  )
}
