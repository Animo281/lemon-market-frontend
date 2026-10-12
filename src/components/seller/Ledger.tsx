import { Fragment } from 'react'
import { Grade } from '../../shared/types'
import { QUALITY_LABEL } from '../../lib/marketScene'
import { sellerCost } from '../../shared/constants'
import { SellerHistoryEntry, totalPurchaseCost } from '../../lib/sellerStats'

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n).toFixed(2)} €`

interface Props {
  grade: Grade
  units: number
  price: number
  history: SellerHistoryEntry[]
  /** session.economics.sellerFirstCosts — this session's actual cost table. */
  firstCosts: Record<Grade, number>
  /** session.economics.unitCostStep — used for the 2nd crate's cost line
   * (when offering 2) and the "Wenn alles verkauft" total. */
  unitCostStep: number
}

// Kassenbuch (liniertes Papier), right side of the counter screen — per
// docs/lemon-market-ui/HANDOFF-verkaeufer.md. The mockup's "Wenn nicht
// verkauft: −Einkauf" row is deliberately changed to "±0,00 €": the backend
// (computeSellerEarnings) only ever subtracts cost from *sold* units, so an
// unsold crate costs nothing in the real payout — see the plan's "Unverkauft"
// decision. The explainer line underneath says so instead of silently
// diverging from what actually gets paid out.
export default function Ledger({ grade, units, price, history, firstCosts, unitCostStep }: Props) {
  const cost1 = sellerCost(firstCosts, grade, 0)
  const cost2 = units === 2 ? sellerCost(firstCosts, grade, 1, unitCostStep) : null
  const gain = price * units - totalPurchaseCost(firstCosts, grade, units, unitCostStep)
  const recent = history.slice(-5).reverse()

  return (
    <div className="abs ledger">
      <h2>Kassenbuch</h2>
      <div className="lrow"><span>Kiste</span><b>{QUALITY_LABEL[grade].label}</b></div>
      <div className="lrow"><span>Einheiten</span><b>{units}</b></div>
      <div className="lrow"><span>Kosten 1. Kiste</span><b className="neg">−{cost1.toFixed(2)} €</b></div>
      {cost2 != null && <div className="lrow"><span>Kosten 2. Kiste</span><b className="neg">−{cost2.toFixed(2)} €</b></div>}
      <div className="lrow"><span>Dein Preis</span><b>{price.toFixed(2)} € × {units}</b></div>
      <div className="lrow total">
        <span>Wenn alles verkauft</span>
        <b className={gain >= 0 ? 'pos' : 'neg'}>{signed(gain)}</b>
      </div>
      <div className="lrow"><span>Wenn nicht verkauft</span><b>±0,00 €</b></div>
      <p className="ledger-note">Einkauf fällt nur an, wenn du auch verkaufst.</p>
      {recent.length > 0 && (
        <>
          <h3>Letzte Runden</h3>
          <div className="hist">
            {recent.map(h => (
              <Fragment key={h.round}>
                <span>R{h.round}</span>
                <span>Q{h.grade}</span>
                <span>{h.price.toFixed(2)} €</span>
                <span className={h.earnings >= 0 ? 'pos' : 'neg'}>
                  {h.unitsSold > 0 ? `${h.unitsSold}/${h.unitsOffered} verkauft` : 'übrig'} {signed(h.earnings)}
                </span>
              </Fragment>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
