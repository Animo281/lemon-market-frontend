import { AvailableOffer, BuyerDecision, Player } from '../../shared/types'
import { MARKET_SCENE_IMAGE, STALL_SLOTS } from '../../lib/marketScene'
import StallSlot from './StallSlot'
import SortingStation from './SortingStation'

interface Props {
  laneIndex: number
  showLaneName: boolean
  /** Sellers assigned to this lane's 4 slots, in slot order; undefined = empty slot. */
  laneSellers: Array<Player | undefined>
  offersBySellerId: Map<string, AvailableOffer>
  myDecision: BuyerDecision | undefined
  interactive: boolean
  justBoughtSellerId: string | null
  onBuy: (sellerId: string) => void
}

export default function MarketLane({
  laneIndex, showLaneName, laneSellers, offersBySellerId, myDecision, interactive, justBoughtSellerId, onBuy,
}: Props) {
  return (
    <section
      className="scene-lane"
      style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})` }}
      aria-label={`Marktgasse ${laneIndex + 1}`}
    >
      {showLaneName && <div className="scene-lane-name">Marktgasse {laneIndex + 1}</div>}
      <SortingStation />
      {STALL_SLOTS.map((slot, i) => {
        const seller = laneSellers[i]
        const offer = seller ? offersBySellerId.get(seller.id) : undefined
        return (
          <StallSlot
            key={seller?.id ?? `empty-${i}`}
            slot={slot}
            seller={seller}
            offer={offer}
            myDecision={myDecision}
            interactive={interactive}
            justBought={seller ? justBoughtSellerId === seller.id : false}
            onBuy={onBuy}
          />
        )
      })}
    </section>
  )
}
