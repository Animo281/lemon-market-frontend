import { atStyle, boxStyle, CLOSED_BOARD_Y, StallSlotGeometry } from '../../lib/marketScene'
import { MiniLemonIcon } from '../buyer/icons'

interface Props {
  slot: StallSlotGeometry
}

// "Licht aus": a slot with no seller assigned, or whose seller hasn't priced
// their crate yet — dimmed backdrop + a "Geschlossen" board, per
// docs/lemon-market-ui/HANDOFF.md. Shared by the buyer scene (StallSlot) and
// the seller's market-round view (SellerStallSlot). The mini-lemon that
// covers a stray icon baked into the Lemonade-Wagen background art stays
// visible even here — "auch bei geschlossenem Stand".
export default function ClosedStall({ slot }: Props) {
  return (
    <>
      <div className="stall-closed" style={boxStyle(slot.dim)} />
      <div className="stall-board" style={atStyle(slot.cx, CLOSED_BOARD_Y)}>Geschlossen</div>
      {slot.cover && (
        <div
          className="stall-cover-lemon"
          style={{ ...atStyle(slot.cover[0], slot.cover[1]), filter: 'brightness(.4) saturate(.4)' }}
        >
          <MiniLemonIcon />
        </div>
      )}
    </>
  )
}
