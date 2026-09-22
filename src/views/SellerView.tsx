import { useEffect, useRef, useState } from 'react'
import { Grade, Player, PublicSession } from '../shared/types'
import { sellerCost } from '../shared/constants'
import { api, ApiError } from '../api/client'
import {
  MARKET_SCENE_IMAGE, SCENE_VIEWS, STALL_CROPS, STALL_NAMES, cropCoverStyle, cropStyle, laneCount,
} from '../lib/marketScene'
import { lastRoundMarketPrices, liveSellerEarnings, sellerBalance, sellerHistory } from '../lib/sellerStats'
import SellerHud from '../components/seller/SellerHud'
import CrateChoiceScreen from '../components/seller/CrateChoiceScreen'
import CounterScreen from '../components/seller/CounterScreen'
import SellerLane from '../components/seller/SellerLane'
import RoundReceipt from '../components/seller/RoundReceipt'
import ProfitTable from '../components/ProfitTable'
import { EyeIcon } from '../components/seller/icons'
import { MiniLemonIcon } from '../components/buyer/icons'

interface Props {
  session: PublicSession
  me: Player
  code: string
  playerToken: string
  error: string
  onSessionUpdate: (s: PublicSession) => void
  onError: (msg: string) => void
}

const STATUS_LABEL: Record<string, string> = {
  lobby: 'Warte auf Spielstart',
  'seller-input': 'Kiste & Preis wählen',
  market: 'Kaufrunde läuft',
  'round-end': 'Rundenende',
  'game-end': 'Spiel beendet',
}

export default function SellerView({ session, me, code, playerToken, error, onSessionUpdate, onError }: Props) {
  const [step, setStep] = useState<'crate' | 'counter'>('crate')
  const [grade, setGrade] = useState<Grade | null>(null)
  const [units, setUnits] = useState(1)
  const [price, setPrice] = useState(1)
  // Purely local UI toggle: lets the seller re-open the counter after
  // submitting (submitSellerDecision allows overwriting while the phase is
  // still 'seller-input' — see plan). It does not undo the submission.
  const [forceEdit, setForceEdit] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [liveMsg, setLiveMsg] = useState('')
  const [toast, setToast] = useState<string | null>(null)
  const moneyPillRef = useRef<HTMLSpanElement>(null)
  const prevUnitsSoldRef = useRef<number | null>(null)

  // New round → fresh wizard. Mirrors PlayerView.tsx's seller-state reset.
  useEffect(() => {
    setStep('crate')
    setGrade(null)
    setUnits(1)
    setPrice(1)
    setForceEdit(false)
    setToast(null)
    prevUnitsSoldRef.current = null
  }, [session.currentRound])

  // Admin can lower maxSellerUnits in the lobby after a unit count was
  // already picked in a previous round's UI state.
  useEffect(() => {
    setUnits(u => Math.min(u, session.maxSellerUnits))
  }, [session.maxSellerUnits])

  const myDecision = session.currentSellerDecisions[me.id]
  const myGrade = (myDecision?.grade ?? null) as Grade | null
  const editable = !myDecision || forceEdit

  const marketSummary = lastRoundMarketPrices(session)
  const lastRoundNum = session.results.length > 0 ? session.results[session.results.length - 1].round : null
  const history = sellerHistory(session, me.id)
  const balance = sellerBalance(session, me.id)
  const isLastRound = session.currentRound >= session.totalRounds
  const lastResult = session.results[session.results.length - 1]
  const myLastResult = lastResult?.sellerDecisions.find(sd => sd.playerId === me.id)

  const myOffer = session.phase === 'market' ? session.availableOffers.find(o => o.sellerId === me.id) : undefined

  // Coin flight + toast when this seller's unitsSold climbs — poll-driven
  // (2s interval from PlayerView), not event-driven; the backend has no
  // websocket (see plan). Fires once per detected jump, however big.
  useEffect(() => {
    if (session.phase !== 'market' || !myOffer || myGrade === null) {
      prevUnitsSoldRef.current = null
      return
    }
    const prev = prevUnitsSoldRef.current
    if (prev !== null && myOffer.unitsSold > prev) {
      const gainedUnits = myOffer.unitsSold - prev
      const price0 = myOffer.price as number
      const profitGained = liveSellerEarnings(myGrade, price0, myOffer.unitsSold) - liveSellerEarnings(myGrade, price0, prev)
      const revenueGained = price0 * gainedUnits
      const msg = `Ein Käufer hat deine Zitronen gekauft: +${revenueGained.toFixed(2)} € Einnahme, +${profitGained.toFixed(2)} € Gewinn`
      setToast(msg)
      setLiveMsg(msg)
      flyCoins()
    }
    prevUnitsSoldRef.current = myOffer.unitsSold
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.phase, myOffer?.unitsSold])

  const flyCoins = () => {
    const from = document.getElementById('my-offer')
    const to = moneyPillRef.current
    if (!from || !to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      bumpMoney()
      return
    }
    const a = from.getBoundingClientRect()
    const b = to.getBoundingClientRect()
    const sx = a.left + a.width / 2, sy = a.top + a.height / 2
    const ex = b.left + b.width / 2, ey = b.top + b.height / 2
    for (let i = 0; i < 7; i++) {
      const el = document.createElement('div')
      el.className = 'seller-coin'
      document.body.appendChild(el)
      const root = document.createElement('div')
      el.appendChild(root)
      // Lightweight inline SVG instead of mounting a React tree for a
      // fire-and-forget DOM node — same shape as icons/CoinIcon.tsx.
      el.innerHTML = '<svg viewBox="0 0 22 22"><circle cx="11" cy="11" r="9.5" fill="#E9B949" stroke="#2B1B12" stroke-width="2"/><circle cx="11" cy="11" r="5.5" fill="none" stroke="#9C7420" stroke-width="1.4"/></svg>'
      const jx = (Math.random() - 0.5) * 60, jy = -40 - Math.random() * 50
      const anim = el.animate([
        { transform: `translate(${sx - 11}px,${sy - 11}px) scale(.6)`, opacity: 0 },
        { transform: `translate(${sx - 11 + jx}px,${sy - 11 + jy}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${ex - 11}px,${ey - 11}px) scale(.7)`, opacity: 1 },
      ], { duration: 900, delay: i * 70, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' })
      anim.onfinish = () => {
        el.remove()
        if (i === 6) bumpMoney()
      }
    }
  }

  const bumpMoney = () => {
    const p = moneyPillRef.current
    if (!p) return
    p.classList.remove('bump')
    void p.offsetWidth
    p.classList.add('bump')
  }

  const handleSubmit = async () => {
    if (grade === null || submitting) return
    setSubmitting(true)
    onError('')
    try {
      const s = await api.sellerDecision(code, playerToken, grade, price, units)
      onSessionUpdate(s)
      setForceEdit(false)
      setLiveMsg('Schild aufgehängt — warte auf andere Verkäufer…')
    } catch (e: unknown) {
      onError(e instanceof ApiError ? e.message : 'Fehler')
    } finally {
      setSubmitting(false)
    }
  }

  const showScene = session.phase === 'lobby' || session.phase === 'seller-input' || session.phase === 'market'
  const infoModeForHud = session.phase === 'market' ? session.infoMode : null

  return (
    <div className="min-h-screen eve-page p-3 md:p-5">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between px-1 font-hand text-sm eve-meta">
          <span>{me.name} · Verkäufer {me.slotIndex + 1}</span>
          <span className="font-caps tracking-widest">{code}</span>
        </div>

        {error && (
          <div role="alert" className="eve-note px-4 py-2.5 text-sm" style={{ borderColor: '#A8261C', color: '#A8261C' }}>
            {error}
          </div>
        )}
        <p className="sr-only" role="status" aria-live="polite">{liveMsg}</p>

        {showScene && (
          <SellerHud
            ref={moneyPillRef}
            sellerName={me.name}
            round={session.currentRound}
            totalRounds={session.totalRounds}
            infoMode={infoModeForHud}
            balance={balance}
            statusLabel={STATUS_LABEL[session.phase]}
          />
        )}

        {session.phase === 'lobby' && (
          <div className="scene-scroller">
            <div className="scene-world">
              <div className="seller-stage">
                <div className="seller-bg" style={{ backgroundImage: `url(${MARKET_SCENE_IMAGE})`, ...SCENE_VIEWS.stallPick }} />
                <div className="abs sign" style={{ left: '50%', top: '10%', transform: 'translateX(-50%) rotate(-1deg)' }}>
                  <h1>Warte auf Spielstart</h1>
                  <p>Der Dozent startet das Spiel gleich</p>
                </div>
                <div className="abs" style={{ left: '50%', top: '48%', transform: 'translate(-50%, -50%)', width: '22%' }}>
                  <div className="stallcard" aria-pressed="true">
                    <div className="crop" style={cropStyle(STALL_CROPS[me.slotIndex % 4])}>
                      {me.slotIndex % 4 === 2 && (
                        <span style={cropCoverStyle(STALL_CROPS[2])}><MiniLemonIcon /></span>
                      )}
                    </div>
                    <b>{STALL_NAMES[me.slotIndex % 4]}</b>
                    <span>Dein Stand, {me.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {session.phase === 'seller-input' && editable && step === 'crate' && (
          <div className="scene-scroller">
            <div className="scene-world">
              <CrateChoiceScreen
                grade={grade}
                units={units}
                maxUnits={session.maxSellerUnits}
                onSelectGrade={setGrade}
                onSelectUnits={setUnits}
                onNext={() => setStep('counter')}
              />
            </div>
          </div>
        )}

        {session.phase === 'seller-input' && editable && step === 'counter' && grade !== null && (
          <div className="scene-scroller">
            <div className="scene-world">
              <CounterScreen
                grade={grade}
                units={units}
                price={price}
                onPriceChange={setPrice}
                infoMode={session.infoMode}
                marketSummary={marketSummary}
                lastRound={lastRoundNum}
                history={history}
                frozen={false}
                submitting={submitting}
                onSubmit={handleSubmit}
                onBack={() => setStep('crate')}
                onEditAgain={() => {}}
              />
            </div>
          </div>
        )}

        {session.phase === 'seller-input' && !editable && myDecision && (
          <div className="scene-scroller">
            <div className="scene-world">
              <CounterScreen
                grade={myDecision.grade as Grade}
                units={myDecision.unitsOffered ?? session.maxSellerUnits}
                price={myDecision.price ?? 0}
                onPriceChange={() => {}}
                infoMode={session.infoMode}
                marketSummary={marketSummary}
                lastRound={lastRoundNum}
                history={history}
                frozen
                submitting={false}
                onSubmit={() => {}}
                onBack={() => {}}
                onEditAgain={() => {
                  setGrade(myDecision.grade as Grade)
                  setUnits(myDecision.unitsOffered ?? session.maxSellerUnits)
                  setPrice(myDecision.price ?? sellerCost((myDecision.grade ?? 1) as Grade, 0))
                  setForceEdit(true)
                }}
              />
            </div>
          </div>
        )}

        {session.phase === 'market' && (
          <>
            <div className="ribbon">
              <EyeIcon />
              <span>Kaufrunde läuft: Du siehst alle Preise, kaufen können nur Käufer</span>
            </div>
            <div className="scene-scroller">
              <div className="scene-world">
                {Array.from({ length: laneCount(session.numSellers) }, (_, l) => (
                  <SellerLane
                    key={l}
                    laneIndex={l}
                    showLaneName={laneCount(session.numSellers) > 1}
                    laneSellers={Array.from({ length: 4 }, (_, k) =>
                      session.players.find(p => p.role === 'seller' && p.slotIndex === l * 4 + k))}
                    offersBySellerId={new Map(session.availableOffers.map(o => [o.sellerId, o]))}
                    myId={me.id}
                    myGrade={myGrade}
                    infoMode={session.infoMode}
                  />
                ))}
              </div>
            </div>
            {toast && <div className="eve-note seller-toast px-5 py-2 text-sm text-center">{toast}</div>}
          </>
        )}

        {session.phase === 'round-end' && lastResult && (
          <RoundReceipt lastResult={lastResult} myResult={myLastResult} isLastRound={isLastRound} />
        )}

        {session.phase === 'game-end' && (
          <div className="eve-note p-6">
            <h2 className="font-caps text-3xl mb-4">Alle Ergebnisse</h2>
            <ProfitTable
              results={session.results}
              sellers={session.players.filter(p => p.role === 'seller')}
              buyers={session.players.filter(p => p.role === 'buyer')}
            />
          </div>
        )}
      </div>
    </div>
  )
}
