import { Grade } from '../../shared/types'
import { QUALITY_LABEL, GRADES_BEST_FIRST } from '../../lib/marketScene'

interface Props {
  buyerValues: Record<Grade, number>
}

// The paper's buyer instructions hand every buyer a printed table of their
// own redemption values per grade (Holt & Sherman 1999, appendix) — without
// it, "buy only below your value" isn't a decision a buyer can actually make.
// The app had this data (session.economics.buyerValues) but never rendered
// it anywhere except after a purchase; this is the missing "Notizzettel",
// the buyer-side counterpart to the seller's cost table (CrateChoiceScreen)
// and the quality legend (SortingStation) — visible in every phase, unlike
// the market board, which only shows once sellers have priced.
// Buyer feedback: these numbers are what every buy decision hinges on, so
// they were made prominent instead of a single small text line — three
// equal tiles, each grade's value large and colored by its own quality.
export default function ValueNote({ buyerValues }: Props) {
  return (
    <div className="eve-note p-2" role="note">
      <div className="font-caps text-xs opacity-70 px-2 pb-1">Dein Wert je Kiste</div>
      <div className="grid grid-cols-3 gap-2">
        {GRADES_BEST_FIRST.map(g => (
          <div key={g} className="flex flex-col items-center gap-0.5 rounded-lg py-2" style={{ background: 'rgba(43,27,18,.06)' }}>
            <b className="font-caps text-sm" style={{ color: QUALITY_LABEL[g].paper }}>{QUALITY_LABEL[g].label}</b>
            <span className="font-mono font-bold" style={{ fontSize: 'clamp(1.25rem, 4vw, 1.7rem)' }}>
              {buyerValues[g].toFixed(2)} €
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
