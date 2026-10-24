import { useEffect, useState } from 'react'
import { MAX_SELLER_PRICE } from '../../shared/constants'

interface Props {
  price: number
  onChange: (price: number) => void
  /** Cost of the first unit at the chosen grade (shared/constants.ts
   * sellerCost) — the hard floor, a seller may never price below this. */
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
  // Hard range — a seller must never submit below cost (loss) or above the
  // flat ceiling. The backend enforces the same range server-side regardless.
  const clampPrice = (v: number) => Math.min(MAX_SELLER_PRICE, Math.max(minCost, Math.round(v * 100) / 100))

  // Typing is tracked as raw text, not clamped on every keystroke — clamping
  // immediately turned e.g. "12" into "1" the instant the first digit landed
  // (parseFloat("1") = 1, below minCost, clamped right back up). The value
  // only snaps into range on blur/Enter, same as a normal numeric field.
  const [draft, setDraft] = useState(String(price))
  useEffect(() => { setDraft(String(price)) }, [price])

  const draftNum = parseFloat(draft)
  const outOfRange = !isNaN(draftNum) && (draftNum < minCost || draftNum > MAX_SELLER_PRICE)

  const commit = () => {
    const v = parseFloat(draft)
    onChange(clampPrice(isNaN(v) ? price : v))
  }

  const warning = outOfRange
    ? draftNum < minCost
      ? `Mind. ${minCost.toFixed(2)} € (deine Kosten)`
      : `Max. ${MAX_SELLER_PRICE.toFixed(2)} €`
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
          min={minCost}
          max={MAX_SELLER_PRICE}
          value={draft}
          readOnly={readOnly}
          onChange={e => {
            if (readOnly) return
            setDraft(e.target.value)
          }}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit() }}
        />
        <span className="eur">€</span>
      </div>
      <div className="pegs">
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price - 1))} aria-label="1 Euro weniger">−1,00</button>
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price - 0.1))} aria-label="10 Cent weniger">−0,10</button>
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price + 0.1))} aria-label="10 Cent mehr">+0,10</button>
        <button type="button" className="peg" disabled={readOnly} onClick={() => onChange(clampPrice(price + 1))} aria-label="1 Euro mehr">+1,00</button>
      </div>
      <p className="sub" style={{ marginTop: '.3em' }}>
        Erlaubt: {minCost.toFixed(2)} € – {MAX_SELLER_PRICE.toFixed(2)} €
      </p>
      <div className="warn">{warning}</div>
    </div>
  )
}
