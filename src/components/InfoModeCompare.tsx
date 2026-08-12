import { RoundResult } from '../shared/types'

interface Props {
  results: RoundResult[]
}

interface RoundStats {
  rounds: number
  avgSurplus: number
  totalTransactions: number
  avgPrice: number
}

function calcStats(rounds: RoundResult[]): RoundStats | null {
  if (rounds.length === 0) return null
  const avgSurplus = rounds.reduce((s, r) => s + r.totalSurplus, 0) / rounds.length
  const allTrades = rounds.flatMap(r => r.buyerDecisions.filter(bd => bd.sellerId !== null))
  const totalTransactions = allTrades.length
  const prices = allTrades.map(bd => bd.price!).filter(p => p != null)
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0
  return { rounds: rounds.length, avgSurplus, totalTransactions, avgPrice }
}

export default function InfoModeCompare({ results }: Props) {
  const fullRounds = results.filter(r => r.infoMode === 'full')
  const asymmRounds = results.filter(r => r.infoMode === 'asymmetric')
  const fullStats = calcStats(fullRounds)
  const asymmStats = calcStats(asymmRounds)

  if (!fullStats && !asymmStats) return null

  const surplusDelta = fullStats && asymmStats
    ? ((asymmStats.avgSurplus - fullStats.avgSurplus) / Math.abs(fullStats.avgSurplus)) * 100
    : null

  const transactionDelta = fullStats && asymmStats && fullStats.totalTransactions > 0
    ? ((asymmStats.totalTransactions - fullStats.totalTransactions) / fullStats.totalTransactions) * 100
    : null

  const StatBlock = ({
    title, stats, mode,
  }: { title: string; stats: RoundStats | null; mode: 'full' | 'asymm' }) => (
    <div className="panel-warm flex-1 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-2 h-2 rounded-full shrink-0 ${mode === 'full' ? 'bg-lime-500' : 'bg-coral-500'}`} />
        <div className={`label ${mode === 'full' ? 'text-lime-400/70' : 'text-coral-400/70'}`}>
          {title}
        </div>
      </div>
      {stats ? (
        <div className="space-y-3">
          <div>
            <div className="text-mkt-500 text-xs mb-0.5">Ø Überschuss</div>
            <div className={`font-display font-bold leading-none ${
              mode === 'full' ? 'text-lime-400' : 'text-coral-400'
            }`} style={{ fontSize: '1.75rem' }}>
              €{stats.avgSurplus.toFixed(2)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-mkt-800">
            <div>
              <div className="text-mkt-600 text-[10px] mb-0.5">Transaktionen</div>
              <div className="font-mono font-bold text-mkt-200">{stats.totalTransactions}</div>
            </div>
            <div>
              <div className="text-mkt-600 text-[10px] mb-0.5">Ø Preis</div>
              <div className="font-mono font-bold text-mkt-200">€{stats.avgPrice.toFixed(2)}</div>
            </div>
          </div>
          <div className="text-mkt-700 text-[10px]">{stats.rounds} Runde{stats.rounds !== 1 ? 'n' : ''}</div>
        </div>
      ) : (
        <div className="text-mkt-600 text-sm">Keine Daten</div>
      )}
    </div>
  )

  return (
    <div className="panel-warm p-6">
      <div className="label mb-1">Informationsasymmetrie — Vergleich</div>
      <p className="text-mkt-500 text-xs mb-5">
        Akerlof (1970): Asymmetrische Information reduziert den Marktüberschuss
      </p>

      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        <StatBlock title="Volle Information" stats={fullStats} mode="full" />

        {surplusDelta !== null && (
          <div className="flex flex-col items-center justify-center px-2 gap-2 min-w-[72px]">
            <div className="text-mkt-700 text-xl">→</div>
            <div className={`text-center font-mono font-bold text-base ${
              surplusDelta < 0 ? 'text-coral-400' : 'text-lime-400'
            }`}>
              {surplusDelta > 0 ? '+' : ''}{surplusDelta.toFixed(0)}%
            </div>
            <div className="label">Ø Überschuss</div>
            {transactionDelta !== null && (
              <>
                <div className={`text-center font-mono font-bold text-base mt-1 ${
                  transactionDelta < 0 ? 'text-coral-400' : 'text-lime-400'
                }`}>
                  {transactionDelta > 0 ? '+' : ''}{transactionDelta.toFixed(0)}%
                </div>
                <div className="label">Transaktionen</div>
              </>
            )}
          </div>
        )}

        <StatBlock title="Asymm. Information" stats={asymmStats} mode="asymm" />
      </div>
    </div>
  )
}
