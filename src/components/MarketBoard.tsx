import { Player, InfoMode, SellerDecision } from '../../../shared/types'

interface Props {
  sellers: Player[]
  decisions: Record<string, Partial<SellerDecision>>
  infoMode: InfoMode
  maxSellerUnits: number
}

const GRADE_LABEL: Record<number, { label: string; cls: string }> = {
  1: { label: 'Q1', cls: 'text-coral-400 border-coral-500/30 bg-coral-500/10' },
  2: { label: 'Q2', cls: 'text-gold-500 border-gold-500/30 bg-gold-500/10' },
  3: { label: 'Q3', cls: 'text-lime-400 border-lime-500/30 bg-lime-500/10' },
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
        <div className="flex items-center gap-2.5 bg-coral-500/8 border border-coral-500/25 rounded-xl px-4 py-2.5 text-coral-300 text-xs font-mono">
          <span className="text-coral-400 text-base leading-none">⚠</span>
          Asymmetrische Information — Qualität nicht sichtbar
        </div>
      )}

      <div className={`grid gap-3 ${colCls}`}>
        {sorted.map(seller => {
          const d = decisions[seller.id]
          const offered = d?.unitsOffered ?? maxSellerUnits
          const soldOut = (d?.unitsSold ?? 0) >= offered
          const pending = d?.price === undefined
          const gradeInfo = d?.grade !== undefined ? GRADE_LABEL[d.grade] : null

          return (
            <div
              key={seller.id}
              className={`panel p-5 flex flex-col gap-3 transition-all duration-300 ${
                soldOut ? 'opacity-35 grayscale' : ''
              } ${!pending ? 'border-mkt-700' : ''}`}
            >
              {/* Seller name + sold-out badge */}
              <div className="flex items-center justify-between min-w-0">
                <span className="text-gold-400 font-bold text-sm truncate">{seller.name}</span>
                {soldOut && (
                  <span className="shrink-0 ml-2 text-[9px] uppercase tracking-widest text-coral-500 border border-coral-500/40 rounded-md px-1.5 py-0.5">
                    Sold out
                  </span>
                )}
              </div>

              {pending ? (
                /* Waiting state */
                <div className="flex items-center gap-2 text-mkt-500 text-xs py-3">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-500 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-500" />
                  </span>
                  entscheidet…
                </div>
              ) : (
                <>
                  {/* Price */}
                  <div className="font-mono font-bold text-2xl text-mkt-100 leading-none">
                    €{d?.price?.toFixed(2)}
                  </div>

                  {/* Grade + units row */}
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border font-mono ${
                      infoMode === 'full' && gradeInfo
                        ? gradeInfo.cls
                        : 'text-mkt-500 border-mkt-700 bg-transparent'
                    }`}>
                      {infoMode === 'full' && gradeInfo ? gradeInfo.label : '?'}
                    </span>

                    {/* Units as number */}
                    <span className="font-mono text-sm font-bold text-gold-500">
                      {d?.unitsSold ?? 0}<span className="text-mkt-600">/{offered}</span>
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
