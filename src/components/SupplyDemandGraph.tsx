import { useEffect, useRef, useState } from 'react'
import { Grade, PublicSession, RoundResult } from '../shared/types'
import { BUYER_VALUES } from '../shared/constants'

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

function findEquilibrium(supply: number[], demand: number[]): { qty: number; price: number } | null {
  if (!supply.length || !demand.length) return null
  const s = [...supply].sort((a, b) => a - b)
  const d = [...demand].sort((a, b) => b - a)
  const len = Math.min(s.length, d.length)
  let lastMatch = -1
  for (let i = 0; i < len; i++) {
    if (d[i] >= s[i]) lastMatch = i
    else break
  }
  if (lastMatch < 0) return null
  return { qty: lastMatch + 1, price: (s[lastMatch] + d[lastMatch]) / 2 }
}

// Design-system colors (semantic, not blue/amber/green)
const GRADE_COLOR: Record<number, string> = {
  1: '#f07070',  // coral-400
  2: '#f0a840',  // gold-500
  3: '#50d888',  // lime-400
}

export default function SupplyDemandGraph({ session, historyResult }: Props) {
  const [animKey, setAnimKey] = useState(0)
  const prevKey = useRef('')

  const sellers = session.players.filter(p => p.role === 'seller')
  const buyers = session.players.filter(p => p.role === 'buyer')
  const maxUnits = session.maxSellerUnits
  const maxQty = Math.max(sellers.length * maxUnits, buyers.length, 1)

  // --- Supply prices ---
  const supplyPrices: number[] = []
  if (historyResult) {
    for (const sd of historyResult.sellerDecisions) {
      for (let i = 0; i < sd.unitsOffered; i++) supplyPrices.push(sd.price)
    }
  } else {
    for (const seller of sellers) {
      const d = session.currentSellerDecisions[seller.id]
      if (d?.price !== undefined) {
        const offered = d.unitsOffered ?? maxUnits
        for (let i = 0; i < offered; i++) supplyPrices.push(d.price)
      }
    }
  }

  // --- Demand prices (buyer WTP) ---
  // Full info: WTP = BUYER_VALUES[best grade] — buyers know what they're buying
  // Asymmetric info: E[value] = grade-proportion-weighted avg (Akerlof rational expectation)
  const demandPrices: number[] = []
  function calcAsymmetricWTP(grades: (1 | 2 | 3)[]): number {
    if (!grades.length) return BUYER_VALUES[2]
    return grades.reduce((s, g) => s + BUYER_VALUES[g], 0) / grades.length
  }
  if (historyResult) {
    const grades = historyResult.sellerDecisions.map(sd => sd.grade)
    if (historyResult.infoMode === 'full' && grades.length) {
      const bestGrade = Math.max(...grades) as 1 | 2 | 3
      for (let i = 0; i < buyers.length; i++) demandPrices.push(BUYER_VALUES[bestGrade])
    } else {
      const wtp = calcAsymmetricWTP(grades)
      for (let i = 0; i < buyers.length; i++) demandPrices.push(wtp)
    }
  } else if (session.infoMode === 'full') {
    const decisions = Object.values(session.currentSellerDecisions)
    const knownGrades = decisions.filter(d => d.grade !== undefined).map(d => d.grade as 1|2|3)
    const bestGrade = knownGrades.length ? Math.max(...knownGrades) as 1|2|3 : 2
    for (let i = 0; i < buyers.length; i++) demandPrices.push(BUYER_VALUES[bestGrade])
  } else {
    const decisions = Object.values(session.currentSellerDecisions)
    const knownGrades = decisions.filter(d => d.grade !== undefined).map(d => d.grade as 1|2|3)
    const wtp = calcAsymmetricWTP(knownGrades)
    for (let i = 0; i < buyers.length; i++) demandPrices.push(wtp)
  }

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

  const supplyPath = buildPath(supplyPrices, maxQty, MAX_P, true)
  const demandPath = buildPath(demandPrices, maxQty, MAX_P, false)
  const eq = findEquilibrium(supplyPrices, demandPrices)

  // Trigger animation on curve changes
  const pathsKey = `${supplyPath}|${demandPath}`
  useEffect(() => {
    if (pathsKey !== prevKey.current && (supplyPath || demandPath)) {
      prevKey.current = pathsKey
      setAnimKey(k => k + 1)
    }
  }, [pathsKey, supplyPath, demandPath])

  // Fill paths
  const supplyFillPath = supplyPath
    ? supplyPath + ` L${qX(supplyPrices.length, maxQty)},${H - M.bottom} L${M.left},${H - M.bottom} Z`
    : ''
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
            <span className="text-gold-500 font-bold">€{eq.price.toFixed(2)}</span>
            {'  '}Q* ={' '}
            <span className="text-ice-400 font-bold">{eq.qty}</span>
          </span>
        ) : !hasData ? (
          <span className="text-mkt-600 text-xs font-mono">Noch keine Daten</span>
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
          <linearGradient id="sdg-supply" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </linearGradient>
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
          {supplyFillPath && (
            <path
              key={`sfill-${animKey}`}
              d={supplyFillPath}
              fill="url(#sdg-supply)"
              style={{ animation: 'sdg-fade 0.6s ease forwards', opacity: 0 }}
            />
          )}
          {demandFillPath && (
            <path
              key={`dfill-${animKey}`}
              d={demandFillPath}
              fill="url(#sdg-demand)"
              style={{ animation: 'sdg-fade 0.6s ease forwards', opacity: 0 }}
            />
          )}

          {/* Supply curve */}
          {supplyPath && (
            <path
              key={`supply-${animKey}`}
              d={supplyPath}
              stroke="#e8e8ff"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: DASH,
                strokeDashoffset: DASH,
                animation: 'sdg-draw 0.65s cubic-bezier(0.4,0,0.2,1) forwards',
              }}
            />
          )}

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

        {/* Curve labels */}
        {supplyPath && supplyPrices.length > 0 && (
          <text
            key={`slbl-${animKey}`}
            x={qX(supplyPrices.length, maxQty) - 4}
            y={pY([...supplyPrices].sort((a, b) => b - a)[0], MAX_P) - 8}
            fontSize={12} fill="#e8e8ff" fontWeight="700"
            textAnchor="end"
            style={{ animation: 'sdg-fade 0.4s ease 0.65s both', opacity: 0 }}
          >
            Angebot
          </text>
        )}
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
              stroke="#9d7ef5" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
            />
            <line
              x1={M.left} y1={pY(eq.price, MAX_P)}
              x2={qX(eq.qty, maxQty)} y2={pY(eq.price, MAX_P)}
              stroke="#9d7ef5" strokeWidth={1} strokeDasharray="4 3" opacity={0.6}
            />
            <circle
              cx={qX(eq.qty, maxQty)} cy={pY(eq.price, MAX_P)}
              r={5} fill="#9d7ef5" stroke="rgb(var(--chart-bg))" strokeWidth={2}
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
          <span className="w-5 h-0.5 rounded inline-block" style={{ backgroundColor: '#e8e8ff' }} />Angebot
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-0.5 rounded inline-block" style={{ backgroundColor: '#FFD700' }} />Nachfrage
        </span>
        {eq && (
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />Gleichgewicht
          </span>
        )}
        {transactions.length > 0 && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-coral-400 inline-block" />Q1
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold-500 inline-block" />Q2
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" />Q3
            </span>
          </>
        )}
      </div>

      <style>{`
        @keyframes sdg-draw { to { stroke-dashoffset: 0; } }
        @keyframes sdg-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sdg-pop { from { opacity: 0; transform: scale(0); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  )
}
