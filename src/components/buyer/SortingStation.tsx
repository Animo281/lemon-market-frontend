import { boxStyle, QUALITY_LABEL, SORTING_STATION_CARDS } from '../../lib/marketScene'
import { Grade } from '../../shared/types'

// The painted "ZITRONEN SORTIERSTATION" backdrop labels its three crates
// Qualität 1 (perfect) → 3 (blemished) — the opposite of the backend's
// grading, where 3 is the best lemon. This overlays corrected labels
// directly on top of the painted cards. Not a seller — always visible,
// in every phase, as the legend for the quality colors used everywhere
// else (see plan: "Qualitäts-Mapping").
//
// The cards are tiny (58×37 image px — see SORTING_STATION_CARDS) and were
// overflowing their boxes with QUALITY_LABEL's full "Qualität 3" / "Perfekt,
// makellos" text, bleeding onto the crate art below. This station-only,
// one-word variant is deliberately shorter than QUALITY_LABEL — everywhere
// else (offer cards, crate choice, ledger) has room for the full text and
// should keep using it.
const STATION_LABEL: Record<Grade, string> = { 3: 'Perfekt', 2: 'Gering', 1: 'Deutlich' }

export default function SortingStation() {
  return (
    <>
      {SORTING_STATION_CARDS.map(({ grade, box }) => {
        const q = QUALITY_LABEL[grade]
        return (
          <div key={grade} className="sorting-card" style={{ ...boxStyle(box), color: q.paper }}>
            <b>{`Q${grade}`}</b>
            <span>{STATION_LABEL[grade]}</span>
          </div>
        )
      })}
    </>
  )
}
