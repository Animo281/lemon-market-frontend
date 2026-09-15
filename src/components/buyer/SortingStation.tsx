import { boxStyle, QUALITY_LABEL, SORTING_STATION_CARDS } from '../../lib/marketScene'

// The painted "ZITRONEN SORTIERSTATION" backdrop labels its three crates
// Qualität 1 (perfect) → 3 (blemished) — the opposite of the backend's
// grading, where 3 is the best lemon. This overlays corrected labels
// directly on top of the painted cards. Not a seller — always visible,
// in every phase, as the legend for the quality colors used everywhere
// else (see plan: "Qualitäts-Mapping").
export default function SortingStation() {
  return (
    <>
      {SORTING_STATION_CARDS.map(({ grade, box }) => {
        const q = QUALITY_LABEL[grade]
        return (
          <div key={grade} className="sorting-card" style={{ ...boxStyle(box), color: q.paper }}>
            <b>{q.label}</b>
            <span>{q.text}</span>
          </div>
        )
      })}
    </>
  )
}
