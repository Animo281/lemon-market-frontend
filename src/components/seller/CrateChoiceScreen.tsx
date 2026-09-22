import { Grade } from '../../shared/types'
import { CRATE_BY_GRADE, MARKET_SCENE_IMAGE, QUALITY_LABEL, SCENE_VIEWS } from '../../lib/marketScene'
import { totalPurchaseCost } from '../../lib/sellerStats'
import { EyeIcon } from './icons'

// Best lemon first — matches the sorting-station legend and Q-ordering used
// everywhere else in the scene (see marketScene.ts's grade↔crate remap).
const GRADES_BEST_FIRST: Grade[] = [3, 2, 1]

interface Props {
  grade: Grade | null
  units: number
  /** session.maxSellerUnits — the unit picker only shows up if it's >1. */
  maxUnits: number
  onSelectGrade: (g: Grade) => void
  onSelectUnits: (u: number) => void
  onNext: () => void
}

// Screen 2 ("Kiste wählen") — per
// docs/lemon-market-ui/HANDOFF-verkaeufer.md. The mockup only ever offers a
// single crate; the backend lets a seller offer 1..maxSellerUnits, so a unit
// picker is folded in here (per the plan's "Mengenwahl in Screen 2
// integrieren" decision) instead of adding a whole extra screen.
export default function CrateChoiceScreen({ grade, units, maxUnits, onSelectGrade, onSelectUnits, onNext }: Props) {
  return (
    <div className="seller-stage">
      <div className="seller-bg" style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})`, ...SCENE_VIEWS.sorting }} />
      <div className="abs sign" style={{ left: '50%', top: '4%', transform: 'translateX(-50%) rotate(1deg)' }}>
        <h1>Wähle deine Kiste</h1>
        <p>Sortierstation · bessere Zitronen kosten mehr im Einkauf</p>
      </div>
      <div className="abs seller-table" />
      <div className="abs crates">
        {GRADES_BEST_FIRST.map(g => {
          const selected = grade === g
          // Reflects the total for the currently chosen quantity, not just
          // one unit — so switching the unit count below updates every
          // crate's price tag, and picking a crate after choosing a
          // quantity shows the real total right away.
          const cost = totalPurchaseCost(g, units)
          return (
            <button
              key={g} type="button" className="crateopt" aria-pressed={selected}
              aria-label={`${QUALITY_LABEL[g].label}, ${QUALITY_LABEL[g].text}, Einkauf ${cost.toFixed(2)} Euro`}
              onClick={() => onSelectGrade(g)}
            >
              <span className="pick">Ausgewählt</span>
              <span className="label">
                <b style={{ color: QUALITY_LABEL[g].paper }}>{QUALITY_LABEL[g].label}</b>
                <span>{QUALITY_LABEL[g].text}</span>
                <span className="cost">Einkauf {cost.toFixed(2)} €</span>
              </span>
              <span className="crateopt-img">
                <img src={CRATE_BY_GRADE[g]} alt="" />
                {selected && units > 1 && <span className="crateopt-count">×{units}</span>}
              </span>
            </button>
          )
        })}
      </div>
      {maxUnits > 1 && (
        <div className="abs seller-units">
          <span className="seller-units-label">Wie viele Kisten?</span>
          <div className="pegs">
            {Array.from({ length: maxUnits }, (_, i) => i + 1).map(u => (
              <button key={u} type="button" className="peg" aria-pressed={units === u} onClick={() => onSelectUnits(u)}>
                {u} {u === 1 ? 'Kiste' : 'Kisten'}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="abs hint" style={{ left: '3%', bottom: '5%' }}>
        <EyeIcon />
        <span>Nur du kennst die Qualität. In Phase 2 sehen Käufer nur eine abgedeckte Kiste.</span>
      </div>
      <div className="abs" style={{ right: '3%', bottom: '4%' }}>
        <button
          type="button" className="cta" aria-disabled={grade === null || undefined}
          onClick={() => { if (grade !== null) onNext() }}
        >
          Kiste nehmen
        </button>
      </div>
    </div>
  )
}
