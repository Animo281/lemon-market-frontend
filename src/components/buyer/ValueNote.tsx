import { Grade } from '../../shared/types'
import { QUALITY_LABEL } from '../../lib/marketScene'

const GRADES_BEST_FIRST: Grade[] = [3, 2, 1]

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
export default function ValueNote({ buyerValues }: Props) {
  return (
    <div className="eve-note px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm" role="note">
      <span className="font-caps text-xs opacity-70 shrink-0">Dein Wert je Kiste</span>
      {GRADES_BEST_FIRST.map(g => (
        <span key={g} className="flex items-center gap-1.5 whitespace-nowrap">
          <b style={{ color: QUALITY_LABEL[g].paper }}>{QUALITY_LABEL[g].label}</b>
          <span className="font-mono">{buyerValues[g].toFixed(2)} €</span>
        </span>
      ))}
    </div>
  )
}
