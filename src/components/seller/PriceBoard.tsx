const clampPrice = (v: number) => Math.max(0.1, Math.round(v * 100) / 100)

interface Props {
  price: number
  onChange: (price: number) => void
  /** Cost of the first unit at the chosen grade (shared/constants.ts
   * sellerCost) — prices below this are a guaranteed loss per unit. */
  minCost: number
  /** Last round's overall average price, or null before any round has
   * finished — used for the "way above market" warning. */
  marketAvg: number | null
  /** True once the offer has been submitted — input and pegs go inert
   * instead of implying an edit that wouldn't reach the server. */
  readOnly?: boolean
}

// "Dein Preis" chalkboard, Screen 3 — per
// docs/lemon-market-ui/HANDOFF-verkaeufer.md. The mockup uses whole euros
// 1–99; real prices run 1.40–13.60€ (see shared/constants.ts), so this uses
// a decimal input with ±1.00/±0.10 pegs instead of the mockup's ±5/±1.
export default function PriceBoard({ price, onChange, minCost, marketAvg, readOnly }: Props) {
  const warning = price < minCost
    ? `Unter deinen Kosten (${minCost.toFixed(2)} €), du machst Verlust`
    : marketAvg !== null && price > marketAvg * 2
      ? 'Deutlich über dem Marktschnitt'
      : ''

  return (
    <div className="abs chalkboard nail board-price">
      <h2>Dein Preis</h2>
      <p className="sub">Schreib ihn auf die Tafel</p>
      <div className="pricewrap">
        <label htmlFor="sellerPriceInput" className="sr-only">Preis in Euro</label>
        <input
          id="sellerPriceInput"
          type="number"
          inputMode="decimal"
          step="0.10"
          min="0.10"
          value={price}
          readOnly={readOnly}
          onChange={e => {
            if (readOnly) return
            const v = parseFloat(e.target.value)
            if (!isNaN(v)) onChange(clampPrice(v))
          }}
        />
        <span className="eur">€</span>
      </div>
      <div className="pegs">
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price - 1))} aria-label="1 Euro weniger">−1,00</button>
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price - 0.1))} aria-label="10 Cent weniger">−0,10</button>
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price + 0.1))} aria-label="10 Cent mehr">+0,10</button>
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price + 1))} aria-label="1 Euro mehr">+1,00</button>
      </div>
      <div className="warn">{warning}</div>
    </div>
  )
}
