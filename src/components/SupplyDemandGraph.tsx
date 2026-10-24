import { useEffect, useRef, useState } from 'react'
import { Grade, PublicSession, RoundResult } from '../shared/types'

interface Props {
  session: PublicSession
  historyResult?: RoundResult
}

const W = 520
const H = 300
const M = { top: 20, right: 36, bottom: 50, left: 52 }
const PW = W - M.left - M.right
const PH = H - M.top - M.bottom
const DASH = 3000

function pY(p: number, maxP: number) {
  return M.top + PH - (p / maxP) * PH
}
function qX(q: number, max: number) {
  return M.left + (q / max) * PW
}

function buildPath(prices: number[], max: number, maxP: number, asc: boolean): string {
  if (!prices.length) return ''
  const sorted = asc
    ? [...prices].sort((a, b) => a - b)
    : [...prices].sort((a, b) => b - a)
  let d = ''
  let x = qX(0, max)
  for (let i = 0; i < sorted.length; i++) {
    const y = pY(sorted[i], maxP)
    const nx = qX(i + 1, max)
    d += i === 0 ? `M${x},${y}` : `L${x},${y}`
    d += ` L${nx},${y}`
    x = nx
  }
  return d
}

// Design-system colors — Nacht-Markt palette
const GRADE_COLOR: Record<Grade, string> = {
  1: '#F07060',  // coral-400
  2: '#F5D828',  // lemon-400
  3: '#78D848',  // lime-400
}

export default function SupplyDemandGraph({ session, historyResult }: Props) {
  const [animKey, setAnimKey] = useState(0)
  const prevKey = useRef('')

  const sellers = session.players.filter(p => p.role === 'seller')
  const buyers = session.players.filter(p => p.role === 'buyer')
  const maxUnits = session.maxSellerUnits
  const maxQty = Math.max(sellers.length * maxUnits, buyers.length, 1)

  // --- Supply prices (with grade for color coding) ---
  const supplyItems: { price: number; grade: Grade }[] = []
  if (historyResult) {
    for (const sd of historyResult.sellerDecisions) {
      for (let i = 0; i < sd.unitsOffered; i++) supplyItems.push({ price: sd.price, grade: sd.grade })
    }
  } else {
    for (const seller of sellers) {
      const d = session.currentSellerDecisions[seller.id]
      if (d?.price !== undefined && d?.grade !== undefined) {
        const offered = d.unitsOffered ?? maxUnits
        for (let i = 0; i < offered; i++) supplyItems.push({ price: d.price, grade: d.grade as Grade })
      }
    }
  }
  const sortedSupplyItems = [...supplyItems].sort((a, b) => a.price - b.price)

  // --- Demand prices + equilibrium: already computed server-side, same formulas
  // (bestGradeWTP / calcAsymmetricWTP / findEquilibrium in the backend's gameAnalytics) ---
  const metrics = historyResult ? historyResult.metrics : session.currentRoundMetrics
  const demandPrices = metrics?.demandCurve ?? []

  // --- Supply prices split per grade — the "3 Angebotskurven" the graph
  // draws, one step-curve per quality instead of one combined curve. Prefer
  // the server's own supplyCurveByGrade (gameAnalytics.ts) when present —
  // same source of truth as the combined curve above — and fall back to
  // deriving it from supplyItems for older results that predate the field.
  const supplyPricesByGrade: Record<Grade, number[]> = metrics?.supplyCurveByGrade ?? {
    1: sortedSupplyItems.filter(s => s.grade === 1).map(s => s.price),
    2: sortedSupplyItems.filter(s => s.grade === 2).map(s => s.price),
    3: sortedSupplyItems.filter(s => s.grade === 3).map(s => s.price),
  }
  const supplyPrices = ([1, 2, 3] as Grade[]).flatMap(g => supplyPricesByGrade[g])

  // --- Transactions ---
  const transactions: { qty: number; price: number; grade: Grade }[] = []
  const src = historyResult ?? null
  if (src) {
    let qty = 0
    for (const bd of src.buyerDecisions) {
      if (bd.sellerId !== null && bd.price !== null && bd.grade !== null) {
        qty++
        transactions.push({ qty, price: bd.price, grade: bd.grade })
      }
    }
  } else {
    let qty = 0
    for (const bd of Object.values(session.currentBuyerDecisions)) {
      if (bd.sellerId !== null && bd.price !== null && bd.grade !== null) {
        qty++
        transactions.push({ qty, price: bd.price, grade: bd.grade })
      }
    }
  }

  // Dynamic Y-axis range
  const allPrices = [...supplyPrices, ...demandPrices]
  const maxRaw = allPrices.length > 0 ? Math.max(...allPrices) : 16
  const MAX_P = Math.max(Math.ceil(maxRaw + maxRaw * 0.2), 8)
  // Y-axis ticks: 5 evenly spaced
  const tickStep = Math.ceil(MAX_P / 4)
  const yTicks = Array.from({ length: 5 }, (_, i) => i * tickStep).filter(t => t <= MAX_P + tickStep)
  const xTicks = Array.from({ length: maxQty + 1 }, (_, i) => i)

  // One step-path per grade, each drawn in its own position along the
  // x-axis (grade 1's units first, then grade 2's, then grade 3's) rather
  // than all three sharing x=0..n — that would stack them on top of each
  // other and produce three overlapping, unreadable curves.
  const supplyPathsByGrade = ([1, 2, 3] as Grade[]).reduce((acc, g, idx) => {
    const prevCount = ([1, 2, 3] as Grade[]).slice(0, idx).reduce((n, pg) => n + supplyPricesByGrade[pg].length, 0)
    const prices = [...supplyPricesByGrade[g]].sort((a, b) => a - b)
    let d = ''
    let x = qX(prevCount, maxQty)
    for (let i = 0; i < prices.length; i++) {
      const y = pY(prices[i], MAX_P)
      const nx = qX(prevCount + i + 1, maxQty)
      d += i === 0 ? `M${x},${y}` : `L${x},${y}`
      d += ` L${nx},${y}`
      x = nx
    }
    acc[g] = d
    return acc
  }, {} as Record<Grade, string>)
  const demandPath = buildPath(demandPrices, maxQty, MAX_P, false)
  const eq = metrics?.equilibrium ?? null

  // Trigger animation on curve changes
  const pathsKey = `${supplyPathsByGrade[1]}|${supplyPathsByGrade[2]}|${supplyPathsByGrade[3]}|${demandPath}`
  useEffect(() => {
    if (pathsKey !== prevKey.current && (supplyPrices.length || demandPath)) {
      prevKey.current = pathsKey
      setAnimKey(k => k + 1)
    }
  }, [pathsKey, supplyPrices.length, demandPath])

  // Fill path (demand only — three overlapping supply fills would just
  // muddy each other's color, so the supply side relies on its three
  // distinct curve colors instead of an area fill)
  const demandFillPath = demandPath
    ? demandPath + ` L${qX(demandPrices.length, maxQty)},${M.top} L${M.left},${M.top} Z`
    : ''

  // No data placeholder
  const hasData = supplyPrices.length > 0 || demandPrices.length > 0

  return (
    <div className="panel p-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="label">Angebot &amp; Nachfrage</span>
        {eq ? (
          <span className="text-xs font-mono bg-mkt-850 border border-mkt-800 rounded-lg px-2.5 py-1 text-mkt-300">
            P* ≈{' '}
            <span className="text-lemon-400 font-bold">€{eq.price.toFixed(2)}</span>
            {'  '}Q* ={' '}
            <span className="text-ice-400 font-bold">{eq.qty}</span>
          </span>
        ) : !hasData ? (
          <span className="text-mkt-500 text-xs font-mono">Noch keine Daten</span>
        ) : null}
      </div>

      {/* Responsive SVG */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block' }}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="sdg-demand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.02" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0.18" />
          </linearGradient>
          <clipPath id="sdg-clip">
            <rect x={M.left} y={M.top} width={PW} height={PH} />
          </clipPath>
        </defs>

        {/* Plot background — purple like reference diagram */}
        <rect x={M.left} y={M.top} width={PW} height={PH} fill="#7B68C8" rx={3} />

        {/* Grid lines */}
        {yTicks.map(t => (
          <line
            key={t}
            x1={M.left} x2={W - M.right}
            y1={pY(t, MAX_P)} y2={pY(t, MAX_P)}
            stroke="rgb(var(--chart-grid))"
            strokeWidth={t === 0 ? 1 : 0.6}
            strokeDasharray={t === 0 ? '' : '3 4'}
          />
        ))}

        {/* Axes */}
        <line x1={M.left} x2={M.left} y1={M.top} y2={H - M.bottom} stroke="rgb(var(--chart-axis))" strokeWidth={1} />
        <line x1={M.left} x2={W - M.right} y1={H - M.bottom} y2={H - M.bottom} stroke="rgb(var(--chart-axis))" strokeWidth={1} />

        {/* Y labels */}
        {yTicks.map(t => (
          <g key={t}>
            <line x1={M.left - 4} x2={M.left} y1={pY(t, MAX_P)} y2={pY(t, MAX_P)} stroke="rgb(var(--chart-tick))" strokeWidth={1} />
            <text
              x={M.left - 8} y={pY(t, MAX_P) + 4}
              textAnchor="end" fontSize={10} fill="rgb(var(--chart-tick))"
              fontFamily="ui-monospace, monospace"
            >
              €{t}
            </text>
          </g>
        ))}

        {/* X labels */}
        {xTicks.map(t => (
          <g key={t}>
            <line x1={qX(t, maxQty)} x2={qX(t, maxQty)} y1={H - M.bottom} y2={H - M.bottom + 3} stroke="rgb(var(--chart-tick))" strokeWidth={1} />
            <text
              x={qX(t, maxQty)} y={H - M.bottom + 16}
              textAnchor="middle" fontSize={10} fill="rgb(var(--chart-tick))"
              fontFamily="ui-monospace, monospace"
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text x={M.left + PW / 2} y={H - 4} textAnchor="middle" fontSize={10} fill="rgb(var(--chart-axis))" letterSpacing="0.08em">
          MENGE
        </text>
        <text
          x={13} y={M.top + PH / 2}
          textAnchor="middle" fontSize={10} fill="rgb(var(--chart-axis))" letterSpacing="0.08em"
          transform={`rotate(-90, 13, ${M.top + PH / 2})`}
        >
          PREIS
        </text>

        {/* Clipped fills + curves */}
        <g clipPath="url(#sdg-clip)">
          {demandFillPath && (
            <path
              key={`dfill-${animKey}`}
              d={demandFillPath}
              fill="url(#sdg-demand)"
              style={{ animation: 'sdg-fade 0.6s ease forwards', opacity: 0 }}
            />
          )}

          {/* Supply — one step-curve per grade, each in its own color and
              its own slice of the x-axis (no area fill: three overlapping
              fills would just muddy each other's color). */}
          {([1, 2, 3] as Grade[]).map(g => (
            supplyPathsByGrade[g] && (
              <path
                key={`supply-${g}-${animKey}`}
                d={supplyPathsByGrade[g]}
                stroke={GRADE_COLOR[g]}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: `sdg-fade 0.4s ease ${0.1 * g}s both`, opacity: 0 }}
              />
            )
          ))}

          {/* Demand curve */}
          {demandPath && (
            <path
              key={`demand-${animKey}`}
              d={demandPath}
              stroke="#FFD700"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: DASH,
                strokeDashoffset: DASH,
                animation: 'sdg-draw 0.65s cubic-bezier(0.4,0,0.2,1) 0.1s forwards',
              }}
            />
          )}
        </g>

        {/* Curve labels — one per grade, placed at each curve's own end */}
        {([1, 2, 3] as Grade[]).map((g, idx) => {
          const prices = supplyPricesByGrade[g]
          if (!prices.length) return null
          const prevCount = ([1, 2, 3] as Grade[]).slice(0, idx).reduce((n, pg) => n + supplyPricesByGrade[pg].length, 0)
          const sorted = [...prices].sort((a, b) => a - b)
          return (
            <text
              key={`slbl-${g}-${animKey}`}
              x={qX(prevCount + prices.length, maxQty) - 4}
              y={pY(sorted[sorted.length - 1], MAX_P) - 8}
              fontSize={11} fill={GRADE_COLOR[g]} fontWeight="700"
              textAnchor="end"
              style={{ animation: `sdg-fade 0.4s ease ${0.55 + 0.05 * g}s both`, opacity: 0 }}
            >
              Q{g}
            </text>
          )
        })}
        {demandPath && demandPrices.length > 0 && (
          <text
            key={`dlbl-${animKey}`}
            x={qX(demandPrices.length, maxQty) - 4}
            y={pY([...demandPrices].sort((a, b) => a - b)[0], MAX_P) + 16}
            fontSize={12} fill="#FFD700" fontWeight="700"
            textAnchor="end"
            style={{ animation: 'sdg-fade 0.4s ease 0.75s both', opacity: 0 }}
          >
            Nachfrage
          </text>
        )}

        {/* Equilibrium cross-hairs + dot */}
        {eq && (
          <g key={`eq-${animKey}`} style={{ animation: 'sdg-fade 0.4s ease 0.8s both', opacity: 0 }}>
            <line
              x1={qX(eq.qty, maxQty)} y1={pY(eq.price, MAX_P)}
              x2={qX(eq.qty, maxQty)} y2={H - M.bottom}
              stroke="#B87828" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
            />
            <line
              x1={M.left} y1={pY(eq.price, MAX_P)}
              x2={qX(eq.qty, maxQty)} y2={pY(eq.price, MAX_P)}
              stroke="#B87828" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
            />
            <circle
              cx={qX(eq.qty, maxQty)} cy={pY(eq.price, MAX_P)}
              r={5} fill="#B87828" stroke="rgb(var(--chart-bg))" strokeWidth={2}
            />
          </g>
        )}

        {/* Transaction dots */}
        {transactions.map((t, i) => (
          <circle
            key={`tx-${i}-${animKey}`}
            cx={qX(t.qty - 0.5, maxQty)}
            cy={pY(t.price, MAX_P)}
            r={5.5}
            fill={GRADE_COLOR[t.grade] ?? '#94a3b8'}
            stroke="rgb(var(--chart-bg))"
            strokeWidth={1.5}
            style={{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              animation: `sdg-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08 + 0.5}s both`,
              opacity: 0,
            }}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[10px] text-mkt-500 font-mono">
        <span className="flex items-center gap-1.5">
          <span className="flex gap-0.5">
            <span className="w-2 h-0.5 rounded inline-block bg-coral-400 self-center" />
            <span className="w-2 h-0.5 rounded inline-block bg-lemon-400 self-center" />
            <span className="w-1 h-0.5 rounded inline-block bg-lime-400 self-center" />
          </span>
          Angebot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 rounded inline-block bg-lemon-400" />Nachfrage
        </span>
        {eq && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-copper-500 inline-block" />Gleichgewicht
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-coral-400 inline-block" />Q1
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lemon-400 inline-block" />Q2
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />Q3
        </span>
      </div>

      <style>{`
        @keyframes sdg-draw { to { stroke-dashoffset: 0; } }
        @keyframes sdg-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sdg-pop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
