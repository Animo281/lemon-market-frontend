import { Player, InfoMode, SellerDecision } from '../shared/types'

interface Props {
  sellers: Player[]
  decisions: Record<string, Partial<SellerDecision>>
  infoMode: InfoMode
  maxSellerUnits: number
}

const GRADE_STYLE: Record<number, { label: string; cls: string; dot: string }> = {
  1: { label: 'Q1', cls: 'text-coral-400 border-coral-500/35 bg-coral-500/10', dot: 'bg-coral-400' },
  2: { label: 'Q2', cls: 'text-lemon-400 border-lemon-500/35 bg-lemon-500/10', dot: 'bg-lemon-400' },
  3: { label: 'Q3', cls: 'text-lime-400  border-lime-500/35  bg-lime-500/10',  dot: 'bg-lime-400'  },
}

export default function MarketBoard({ sellers, decisions, infoMode, maxSellerUnits }: Props) {
  const sorted = [...sellers].sort((a, b) => a.slotIndex - b.slotIndex)

  const colCls =
    sorted.length <= 1 ? 'grid-cols-1' :
    sorted.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
    'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'

  return (
    <div className="space-y-3">
      {infoMode === 'asymmetric' && (
        <div className="flex items-center gap-2.5 bg-coral-500/8 border border-coral-500/25 rounded-xl px-4 py-2.5 text-coral-300 text-sm">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-coral-400">
            <path d="M8 2L14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <path d="M8 6v4M8 11.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span className="font-semibold">Asymmetrische Information</span>
          <span className="text-coral-400/70 text-xs">— Qualität nicht sichtbar</span>
        </div>
      )}

      <div className={`grid gap-3 ${colCls}`}>
        {sorted.map((seller, idx) => {
          const d = decisions[seller.id]
          const offered = d?.unitsOffered ?? maxSellerUnits
          const soldOut = (d?.unitsSold ?? 0) >= offered
          const pending = d?.price === undefined
          const gradeStyle = d?.grade !== undefined ? GRADE_STYLE[d.grade] : null

          return (
            <div
              key={seller.id}
              className={`stall-card p-5 flex flex-col gap-3 animate-stall-in ${
                soldOut ? 'opacity-30' : ''
              }`}
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              {/* Header: seller name + sold-out */}
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-lemon-500 shrink-0" />
                  <span className="font-semibold text-mkt-100 text-sm truncate">{seller.name}</span>
                </div>
                {soldOut && (
                  <span className="shrink-0 ml-2 text-[9px] font-bold uppercase tracking-widest text-mkt-500 border border-mkt-700 rounded-md px-1.5 py-0.5">
                    Ausverkauft
                  </span>
                )}
              </div>

              {pending ? (
                <div className="flex items-center gap-2 text-mkt-600 text-sm py-3">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-600 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-600" />
                  </span>
                  entscheidet…
                </div>
              ) : (
                <>
                  {/* Price — large and warm */}
                  <div className="font-mono font-bold text-lemon-400 leading-none"
                       style={{ fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
                    €{d?.price?.toFixed(2)}
                  </div>

                  {/* Grade + units */}
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                      infoMode === 'full' && gradeStyle
                        ? gradeStyle.cls
                        : 'text-mkt-600 border-mkt-800 bg-transparent'
                    }`}>
                      {infoMode === 'full' && gradeStyle && (
                        <span className={`w-1.5 h-1.5 rounded-full ${gradeStyle.dot}`} />
                      )}
                      {infoMode === 'full' && gradeStyle ? gradeStyle.label : '?'}
                    </span>

                    <span className="font-mono text-sm">
                      <span className="text-mkt-300 font-bold">{d?.unitsSold ?? 0}</span>
                      <span className="text-mkt-700">/{offered}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
