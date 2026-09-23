import { AvailableOffer, Grade, InfoMode, Player } from '../../shared/types'
import { MARKET_SCENE_IMAGE, STALL_SLOTS } from '../../lib/marketScene'
import SellerStallSlot from './SellerStallSlot'
import SortingStation from '../buyer/SortingStation'

interface Props {
  laneIndex: number
  showLaneName: boolean
  laneSellers: Array<Player | undefined>
  offersBySellerId: Map<string, AvailableOffer>
  myId: string
  /** This seller's real grade for the current round, or null if this lane
   * doesn't contain them (or they haven't got a decision recorded). */
  myGrade: Grade | null
  infoMode: InfoMode
  firstCosts: Record<Grade, number>
}

// One 1024×572 lane of the live market round (Screen 4), mirrors
// buyer/MarketLane.tsx — same background, same SortingStation legend, same
// slot geometry, just SellerStallSlot instead of StallSlot (no buy button).
export default function SellerLane({ laneIndex, showLaneName, laneSellers, offersBySellerId, myId, myGrade, infoMode, firstCosts }: Props) {
  return (
    <section className="scene-lane" style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})` }} aria-label={`Marktgasse ${laneIndex + 1}`}>
      {showLaneName && <div className="scene-lane-name">Marktgasse {laneIndex + 1}</div>}
      <SortingStation />
      {STALL_SLOTS.map((slot, i) => {
        const seller = laneSellers[i]
        const offer = seller ? offersBySellerId.get(seller.id) : undefined
        const isMine = seller?.id === myId
        return (
          <SellerStallSlot
            key={seller?.id ?? `empty-${i}`}
            slot={slot}
            seller={seller}
            offer={offer}
            isMine={isMine}
            myGrade={isMine ? myGrade : null}
            infoMode={infoMode}
            firstCosts={firstCosts}
          />
        )
      })}
    </section>
  )
}
