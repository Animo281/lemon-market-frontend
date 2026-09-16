import { AvailableOffer, BuyerDecision, Player } from '../../shared/types'
import {
  atStyle, boxStyle, withRotation,
  BUY_BUTTON_Y, CLOSED_BOARD_Y, CRATE_BY_GRADE, QUALITY_LABEL,
  StallSlotGeometry,
} from '../../lib/marketScene'
import { MiniLemonIcon, TarpCover } from './icons'

interface Props {
  slot: StallSlotGeometry
  seller: Player | undefined
  offer: AvailableOffer | undefined
  myDecision: BuyerDecision | undefined
  /** True only while it's this buyer's turn in the market phase — gates the buy button. */
  interactive: boolean
  justBought: boolean
  onBuy: (sellerId: string) => void
  onBlocked: (reason: string) => void
}

export default function StallSlot({ slot, seller, offer, myDecision, interactive, justBought, onBuy, onBlocked }: Props) {
  // A slot with no seller assigned, or one whose seller hasn't set a price yet
  // (lobby, seller-input, or still deciding), reads the same "Licht aus" way —
  // there is nothing to compare yet.
  const closed = !seller || !offer || offer.price === null

  // The mini-lemon covers a stray icon baked into the background art at this
  // spot; HANDOFF.md calls for it "auch bei geschlossenem Stand" — always.
  const cover = slot.cover && (
    <div
      className="stall-cover-lemon"
      style={{ ...atStyle(slot.cover[0], slot.cover[1]), filter: closed ? 'brightness(.4) saturate(.4)' : undefined }}
    >
      <MiniLemonIcon />
    </div>
  )

  if (closed || !seller || !offer) {
    return (
      <>
        <div className="stall-closed" style={boxStyle(slot.dim)} />
        <div className="stall-board" style={atStyle(slot.cx, CLOSED_BOARD_Y)}>Geschlossen</div>
        {cover}
      </>
    )
  }

  const boughtHere = myDecision?.sellerId === seller.id
  const soldOut = !boughtHere && offer.unitsRemaining <= 0
  const alreadyDecided = myDecision !== undefined
  const disabled = !interactive || boughtHere || soldOut || (alreadyDecided && !boughtHere)
  const label = boughtHere ? 'Gekauft' : soldOut ? 'Ausverkauft' : 'Kaufen'
  const price = offer.price as number

  const ariaLabel = boughtHere
    ? `Zitronen von ${seller.name} bereits gekauft`
    : soldOut
      ? `${seller.name} ist ausverkauft`
      : !interactive
        ? `Zitronen von ${seller.name} für ${price.toFixed(2)} € — nicht dein Zug`
        : alreadyDecided
          ? `Zitronen von ${seller.name} für ${price.toFixed(2)} € — du hast diese Runde schon entschieden`
          : `Zitronen von ${seller.name} für ${price.toFixed(2)} € kaufen`

  return (
    <>
      <div
        className={`stall-name${slot.name.style === 'lemonade' ? ' lemonade' : ''}`}
        style={withRotation(boxStyle(slot.name.box), slot.name.rotationDeg)}
      >
        <small>Stand</small>
        <b>{seller.name}</b>
      </div>
      {cover}

      <div
        className={`stall-offer${slot.offer.style === 'chalk' ? ' chalk' : ''}`}
        style={withRotation(atStyle(slot.offer.x, slot.offer.y), slot.offer.rotationDeg)}
      >
        {offer.grade !== null ? (
          <>
            <div className="stall-crate">
              <img src={CRATE_BY_GRADE[offer.grade]} alt={`${QUALITY_LABEL[offer.grade].label}: ${QUALITY_LABEL[offer.grade].text}`} />
            </div>
            <div>
              <div className="price">{price.toFixed(2)} €</div>
              <span className="stall-qtext" style={{ color: slot.offer.style === 'chalk' ? QUALITY_LABEL[offer.grade].chalk : QUALITY_LABEL[offer.grade].paper }}>
                {QUALITY_LABEL[offer.grade].label}
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

      {boughtHere && (
        <div className={`stall-stamp${justBought ? ' fresh' : ''}`} style={atStyle(slot.offer.x, slot.offer.y)}>
          Gekauft
        </div>
      )}

      <button
        type="button"
        className={`stall-buy${boughtHere ? ' done' : ''}`}
        style={atStyle(slot.cx, BUY_BUTTON_Y)}
        data-seller-id={seller.id}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        onClick={() => {
          if (disabled) {
            onBlocked(
              boughtHere ? 'Du hast hier schon gekauft.' :
              soldOut ? 'Dieser Stand ist ausverkauft.' :
              alreadyDecided ? 'Du hast in dieser Runde schon entschieden.' :
              'Du bist gerade nicht an der Reihe.'
            )
            return
          }
          onBuy(seller.id)
        }}
      >
        {label}
      </button>
    </>
  )
}
