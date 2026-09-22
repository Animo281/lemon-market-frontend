import { Grade } from '../../shared/types'
import { CRATE_BY_GRADE, QUALITY_LABEL } from '../../lib/marketScene'
import { MarketPriceSummary } from '../../lib/sellerStats'

interface Props {
  summary: MarketPriceSummary | null
  /** The round the summary describes — null when there isn't one yet. */
  lastRound: number | null
}

const GRADES_BEST_FIRST: Grade[] = [3, 2, 1]

// "Marktpreise" chalkboard, top-left of the counter screen (Screen 3) — per
// docs/lemon-market-ui/HANDOFF-verkaeufer.md. Shows what the market paid per
// quality in the most recently finished round; nothing to show yet in round 1.
export default function MarketPricesBoard({ summary, lastRound }: Props) {
  return (
    <div className="abs chalkboard nail board-market">
      <h2>Marktpreise</h2>
      {summary && lastRound !== null ? (
        <>
          <p className="sub">Durchschnitt aus Runde {lastRound}</p>
          {GRADES_BEST_FIRST.map(g => (
            <div key={g} className="mrow">
              <img src={CRATE_BY_GRADE[g]} alt="" />
              <span style={{ color: QUALITY_LABEL[g].chalk }}>Q{g}</span>
              <span className="avg">{summary.byGrade[g] !== null ? `Ø ${summary.byGrade[g]!.toFixed(2)} €` : '—'}</span>
            </div>
          ))}
          <div className="mfoot">
            Alle Stände {summary.all !== null ? `Ø ${summary.all.toFixed(2)} €` : '—'} · {summary.sold} von {summary.total} verkauft
          </div>
        </>
      ) : (
        <p className="sub">Noch keine Vorrunde — du setzt den ersten Preis.</p>
      )}
    </div>
  )
}
