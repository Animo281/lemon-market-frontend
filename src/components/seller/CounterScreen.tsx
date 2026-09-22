import { Grade, InfoMode } from '../../shared/types'
import { sellerCost } from '../../shared/constants'
import { CRATE_BY_GRADE, MARKET_SCENE_IMAGE, QUALITY_LABEL, SCENE_VIEWS } from '../../lib/marketScene'
import { MarketPriceSummary, SellerHistoryEntry } from '../../lib/sellerStats'
import OfferCard from '../market/OfferCard'
import MarketPricesBoard from './MarketPricesBoard'
import PriceBoard from './PriceBoard'
import Ledger from './Ledger'
import WoodCounter from './WoodCounter'
import CashBox from './CashBox'

interface Props {
  grade: Grade
  units: number
  price: number
  onPriceChange: (p: number) => void
  infoMode: InfoMode
  marketSummary: MarketPriceSummary | null
  lastRound: number | null
  history: SellerHistoryEntry[]
  /** True once the offer has been submitted for this round — freezes the
   * price board and swaps the CTA for a waiting state + "Angebot ändern". */
  frozen: boolean
  submitting: boolean
  onSubmit: () => void
  onBack: () => void
  onEditAgain: () => void
}

// Screen 3 ("Hinter der Theke") — per
// docs/lemon-market-ui/HANDOFF-verkaeufer.md. Same screen serves both the
// editable and the "schild hängt, warte" state (frozen prop) so the seller
// never loses their place mid-round.
export default function CounterScreen({
  grade, units, price, onPriceChange, infoMode, marketSummary, lastRound, history,
  frozen, submitting, onSubmit, onBack, onEditAgain,
}: Props) {
  // The mockup's own "Phase 1/2" numbering (1 = quality visible, 2 = hidden)
  // — kept here only for this preview caption, matching HANDOFF-verkaeufer.md
  // verbatim; the HUD elsewhere spells this out in words instead.
  const previewPhase = infoMode === 'full' ? 1 : 2

  return (
    <div className="seller-stage">
      <div className="seller-bg" style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})`, ...SCENE_VIEWS.counter }} />

      <MarketPricesBoard summary={marketSummary} lastRound={lastRound} />
      <PriceBoard
        price={price}
        onChange={onPriceChange}
        minCost={sellerCost(grade, 0)}
        marketAvg={marketSummary?.all ?? null}
        readOnly={frozen}
      />
      <Ledger grade={grade} units={units} price={price} history={history} />

      <div className="abs seller-counter-wood" aria-hidden="true"><WoodCounter /></div>

      <div className="abs seller-crate-on">
        <span className="tag" style={{ color: QUALITY_LABEL[grade].paper }}>{QUALITY_LABEL[grade].label}</span>
        <img src={CRATE_BY_GRADE[grade]} alt={`Deine Kiste: ${QUALITY_LABEL[grade].label}`} />
        {units > 1 && <span className="crateopt-count">×{units}</span>}
      </div>

      <div className="abs seller-preview">
        <small>So sehen dich Käufer in Phase {previewPhase}:</small>
        <OfferCard price={price} grade={infoMode === 'full' ? grade : null} />
      </div>

      <div className="abs seller-hang">
        {frozen ? (
          <>
            <div className="eve-note seller-waiting">Schild hängt — warte auf andere Verkäufer…</div>
            <button type="button" className="cta-link" onClick={onEditAgain}>Angebot ändern</button>
          </>
        ) : (
          <>
            <button type="button" className="cta-link" onClick={onBack}>← Andere Kiste wählen</button>
            <button type="button" className="cta" disabled={submitting} onClick={onSubmit}>
              {submitting ? 'Sende…' : 'Schild aufhängen'}
            </button>
          </>
        )}
      </div>

      <div className="abs seller-cashbox" aria-hidden="true"><CashBox /></div>
    </div>
  )
}
