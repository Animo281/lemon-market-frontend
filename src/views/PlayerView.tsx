import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicSession, Player, Grade, SellerDecision } from '../shared/types'
import { sellerCost } from '../shared/constants'
import { api, ApiError } from '../api/client'
import { storage, sessionIndex } from '../lib/storage'
import PhaseIndicator from '../components/PhaseIndicator'
import MarketBoard from '../components/MarketBoard'
import ProfitTable from '../components/ProfitTable'
import ErrorBanner from '../components/ErrorBanner'
import { CheckIcon } from '../components/icons'
import BuyerView from './BuyerView'

export default function PlayerView() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<PublicSession | null>(null)
  const [me, setMe] = useState<Player | null>(null)
  const [sellerGrade, setSellerGrade] = useState<Grade | null>(null)
  const [sellerPrice, setSellerPrice] = useState('')
  const [sellerUnits, setSellerUnits] = useState(2)
  const [sellerBusy, setSellerBusy] = useState(false)
  const [error, setError] = useState('')
  const [kicked, setKicked] = useState(false)
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    setSellerGrade(null)
    setSellerPrice('')
    if (session?.maxSellerUnits) setSellerUnits(session.maxSellerUnits)
  }, [session?.currentRound, session?.maxSellerUnits])

  const playerToken = code ? storage.getPlayerToken(code) : null
  const playerId    = code ? storage.getPlayerId(code)    : null

  useEffect(() => {
    if (!code || !playerToken) { navigate('/'); return }
    const load = async () => {
      try {
        const s = await api.getSession(code, playerToken)
        setSession(s)
        setError('')
        const found = s.players.find((p: Player) => p.id === playerId)
        if (found) {
          setMe(found)
        } else if (hasLoadedOnce.current) {
          // The session loaded fine, but our own playerId is no longer in
          // the player list — the reliable "you got kicked" signal. (A 403
          // from getSession never fires in practice: that call sends no
          // token today, so it can't be told apart from "you were never a
          // player here" — this check doesn't depend on that.)
          setKicked(true)
        }
        hasLoadedOnce.current = true
      } catch (err: unknown) {
        if (err instanceof ApiError && err.status === 403) {
          setKicked(true)
        } else if (!hasLoadedOnce.current) {
          setError(err instanceof ApiError ? err.message : 'Session nicht gefunden.')
        }
        // else: transient poll failure after a successful load — keep
        // showing the last good state instead of blanking the screen.
      }
    }
    load()
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [code, playerToken, playerId])

  if (!code || !playerToken) return null

  if (kicked) return (
    <div className="min-h-screen market-bg flex flex-col items-center justify-center gap-6 px-6">
      <div className="panel-warm p-8 max-w-sm w-full text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-coral-500/10 border border-coral-500/30 flex items-center justify-center mx-auto">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-coral-400">
            <path d="M10 3L17.5 16H2.5L10 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx="10" cy="14.5" r="0.75" fill="currentColor"/>
          </svg>
        </div>
        <h2 className="font-display text-xl font-bold text-coral-400">Du wurdest entfernt</h2>
        <p className="text-mkt-400 text-sm font-mono">Der Admin hat dich aus der Session entfernt.</p>
        <button
          className="btn-secondary w-full"
          onClick={() => {
            storage.clear(code)
            sessionIndex.remove(code)
            navigate('/')
          }}
        >
          Zur Startseite
        </button>
      </div>
    </div>
  )

  if (!session || !me) return (
    <div className="min-h-screen market-bg flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-mkt-500 text-sm font-mono">
        <span className="relative flex h-2 w-2">
          <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-lemon-500 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-lemon-500" />
        </span>
        Lade…
      </div>
    </div>
  )

  // Buyers get their own "Abendmarkt" world (BuyerView) across every phase —
  // see HANDOFF.md and the plan. Sellers, admin and landing keep the existing
  // Nacht-Markt design untouched.
  if (me.role === 'buyer') {
    return (
      <BuyerView
        session={session}
        me={me}
        code={code}
        playerToken={playerToken}
        error={error}
        onSessionUpdate={setSession}
        onError={setError}
      />
    )
  }

  const sellers = session.players.filter((p: Player) => p.role === 'seller')
  const myDecision  = session.currentSellerDecisions[me.id]
  const lastResult  = session.results[session.results.length - 1]
  const myLastSellerResult = lastResult?.sellerDecisions.find((s: SellerDecision) => s.playerId === me.id)
  const isLastRound = session.currentRound >= session.totalRounds
  const maxUnits    = session.maxSellerUnits

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellerGrade || !sellerPrice || !playerToken || sellerBusy) return
    const price = parseFloat(sellerPrice)
    if (isNaN(price) || price <= 0) {
      // Used to just `return` here — button stayed enabled, click did
      // nothing, no way to tell why. Now says what's wrong.
      setError('Preis muss größer als 0 sein.')
      return
    }
    setSellerBusy(true)
    setError('')
    try {
      const s = await api.sellerDecision(code, playerToken, sellerGrade, price, sellerUnits)
      setSession(s)
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Fehler')
    } finally {
      setSellerBusy(false)
    }
  }

  const GRADE_INFO: Record<Grade, { label: string; color: string; ring: string }> = {
    1: { label: 'Q1 — Niedrig', color: 'text-coral-400 border-coral-500/50 bg-coral-500/10',
         ring: 'border-coral-500 bg-coral-500/20' },
    2: { label: 'Q2 — Mittel',  color: 'text-lemon-400 border-lemon-500/50 bg-lemon-500/10',
         ring: 'border-lemon-500 bg-lemon-500/20' },
    3: { label: 'Q3 — Hoch',   color: 'text-lime-400 border-lime-500/50 bg-lime-500/10',
         ring: 'border-lime-500 bg-lime-500/20' },
  }

  const totalCost = sellerGrade && sellerUnits
    ? Array.from({ length: sellerUnits }, (_, i) => sellerCost(sellerGrade, i)).reduce((a, b) => a + b, 0)
    : null
  const totalRevenue = sellerPrice && !isNaN(parseFloat(sellerPrice)) && sellerUnits
    ? parseFloat(sellerPrice) * sellerUnits
    : null
  const expectedProfit = totalCost !== null && totalRevenue !== null
    ? totalRevenue - totalCost
    : null

  return (
    <div className="min-h-screen market-bg p-3 md:p-5">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-mkt-100">
              {me.name}&ensp;
              <span className="text-lemon-400">Verkäufer</span>
            </h1>
            <div className="font-mono text-xs text-lemon-500/60 tracking-widest mt-0.5">{code}</div>
          </div>
          {session.phase !== 'lobby' && session.phase !== 'game-end' && (
            <PhaseIndicator round={session.currentRound} total={session.totalRounds} infoMode={session.infoMode} />
          )}
        </div>

        {error && <ErrorBanner message={error} />}

        {/* ── LOBBY ─────────────────────────────────── */}
        {session.phase === 'lobby' && (
          <div className="panel-warm p-10 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full border border-lemon-500/30 bg-lemon-500/8 flex items-center justify-center mx-auto mb-5">
              <span className="relative flex h-3 w-3">
                <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-lemon-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-lemon-500" />
              </span>
            </div>
            <div className="font-bold text-mkt-100 text-lg mb-2">Warte auf Spielstart</div>
            <div className="text-mkt-500 text-sm mb-6">Der Dozent startet das Spiel gleich.</div>
            <div className="inline-flex items-center gap-2 text-sm font-mono px-4 py-2 rounded-xl border border-lemon-500/30 bg-lemon-500/8 text-lemon-400">
              <span className="w-1.5 h-1.5 rounded-full bg-lemon-500" />
              Verkäufer {me.slotIndex + 1}
            </div>
          </div>
        )}

        {/* ── SELLER INPUT — form ────────────────────── */}
        {session.phase === 'seller-input' && !myDecision && (
          <form onSubmit={handleSellerSubmit} className="space-y-4 animate-fade-up">

            {/* Cost reference table */}
            <div className="panel p-5">
              <div className="label mb-3">Produktionskosten (nur für dich sichtbar)</div>
              <div className="grid grid-cols-3 gap-2 font-mono text-xs">
                {([1, 2, 3] as Grade[]).map(g => (
                  <div key={g} className={`rounded-xl p-3 border ${GRADE_INFO[g].color}`}>
                    <div className="font-bold mb-2">{GRADE_INFO[g].label}</div>
                    {Array.from({ length: maxUnits }, (_, i) => (
                      <div key={i} className="text-mkt-400">
                        {i + 1}. Einh.&nbsp;
                        <span className="text-mkt-100">€{sellerCost(g, i).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Grade selector */}
            <div className="panel p-5">
              <div className="label mb-3">Qualität wählen</div>
              <div className="grid grid-cols-3 gap-3">
                {([1, 2, 3] as Grade[]).map(g => (
                  <button
                    key={g} type="button"
                    onClick={() => setSellerGrade(g)}
                    className={`rounded-xl py-4 font-bold border transition-all ${
                      sellerGrade === g
                        ? GRADE_INFO[g].ring + ' text-mkt-100'
                        : 'bg-mkt-850 border-mkt-800 text-mkt-400 hover:border-mkt-600 hover:text-mkt-200'
                    }`}
                  >
                    <div className="text-2xl mb-1">Q{g}</div>
                    <div className={`text-[10px] font-normal ${sellerGrade === g ? 'opacity-80' : 'text-mkt-600'}`}>
                      €{sellerCost(g, 0).toFixed(2)}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Units selector */}
            {maxUnits > 1 && (
              <div className="panel p-5">
                <div className="label mb-3">Einheiten anbieten</div>
                <div className="flex gap-2">
                  {Array.from({ length: maxUnits }, (_, i) => {
                    const u = i + 1
                    return (
                      <button
                        key={u} type="button"
                        onClick={() => setSellerUnits(u)}
                        className={`flex-1 py-3 rounded-xl font-bold font-mono text-lg border transition-all ${
                          sellerUnits === u
                            ? 'bg-copper-400/15 border-copper-400/50 text-copper-300'
                            : 'bg-mkt-850 border-mkt-800 text-mkt-400 hover:border-mkt-600 hover:text-mkt-200'
                        }`}
                      >
                        {u}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price input */}
            <div className="panel p-5 space-y-3">
              <div className="label">Verkaufspreis (je Einheit)</div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-mkt-500 font-mono text-xl">€</span>
                <input
                  type="number" step="0.01" min="0" value={sellerPrice}
                  onChange={e => setSellerPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-mkt-850 border border-mkt-800 rounded-xl pl-9 pr-4 py-3.5 font-mono
                             text-lemon-400 font-bold text-2xl focus:outline-none focus:border-lemon-500/50
                             focus:ring-2 focus:ring-lemon-500/10 transition-colors placeholder:text-mkt-700"
                />
              </div>
              {expectedProfit !== null && (
                <div className={`flex items-center gap-2 text-xs font-mono ${
                  expectedProfit >= 0 ? 'text-lime-400' : 'text-coral-400'
                }`}>
                  <span className="text-mkt-500">Profit (alle {sellerUnits} Einh. verkauft):</span>
                  <span className="font-bold">€{expectedProfit.toFixed(2)}</span>
                </div>
              )}
            </div>

            <button
              type="submit" disabled={!sellerGrade || !sellerPrice || sellerBusy}
              className="btn-primary w-full text-base"
            >
              {sellerBusy ? 'Sende…' : 'Entscheidung abgeben →'}
            </button>
          </form>
        )}

        {/* SELLER INPUT — waiting */}
        {session.phase === 'seller-input' && myDecision && (
          <div className="panel-warm p-10 text-center animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckIcon size={20} strokeWidth={1.75} className="text-lime-400" />
            </div>
            <div className="font-bold text-mkt-100 text-lg mb-1">Entscheidung abgegeben</div>
            <div className="flex items-center justify-center gap-2 text-mkt-500 text-sm mt-3">
              <span className="relative flex h-1.5 w-1.5">
                <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-500" />
              </span>
              Warte auf andere Verkäufer…
            </div>
          </div>
        )}

        {/* ── MARKET ────────────────────────────────── */}
        {session.phase === 'market' && (
          <div className="space-y-4 animate-fade-up">
            <MarketBoard sellers={sellers} decisions={session.currentSellerDecisions} infoMode={session.infoMode} maxSellerUnits={maxUnits} />

            <div className="panel p-5">
              <div className="label mb-3">Dein Status</div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-mkt-500 mb-0.5">Einheiten verkauft</div>
                  <div className="font-mono font-bold text-2xl text-lemon-400">
                    {myDecision?.unitsSold ?? 0}
                    <span className="text-mkt-600 text-base">/{myDecision?.unitsOffered ?? maxUnits}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-mkt-600 text-xs mt-3">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-600 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-600" />
                </span>
                Käufer entscheiden…
              </div>
            </div>
          </div>
        )}

        {/* ── ROUND END ─────────────────────────────── */}
        {session.phase === 'round-end' && lastResult && (
          <div className="panel-warm p-6 space-y-5 animate-fade-up">
            <div className="flex items-center justify-between border-b border-mkt-800 pb-4">
              <h2 className="font-bold text-mkt-100">Runde {lastResult.round} — Dein Ergebnis</h2>
              <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                lastResult.infoMode === 'full'
                  ? 'border-lime-500/30 bg-lime-500/10 text-lime-400'
                  : 'border-coral-500/30 bg-coral-500/10 text-coral-400'
              }`}>
                {lastResult.infoMode === 'full' ? 'Volle Info' : 'Asymm. Info'}
              </span>
            </div>

            {myLastSellerResult && (() => {
              const profit = myLastSellerResult.earnings
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-mkt-850 rounded-xl p-4">
                    <div className="label mb-1">Qualität</div>
                    <div className="font-mono font-bold text-xl text-mkt-100">Q{myLastSellerResult.grade}</div>
                  </div>
                  <div className="bg-mkt-850 rounded-xl p-4">
                    <div className="label mb-1">Preis</div>
                    <div className="font-mono font-bold text-xl text-lemon-400">€{myLastSellerResult.price.toFixed(2)}</div>
                  </div>
                  <div className="bg-mkt-850 rounded-xl p-4">
                    <div className="label mb-1">Einheiten</div>
                    <div className="font-mono font-bold text-xl text-mkt-100">
                      {myLastSellerResult.unitsSold}
                      <span className="text-mkt-600 text-sm">/{myLastSellerResult.unitsOffered}</span>
                    </div>
                  </div>
                  <div className="bg-mkt-850 rounded-xl p-4">
                    <div className="label mb-1">Profit</div>
                    <div className={`font-mono font-bold text-xl ${profit >= 0 ? 'text-lime-400' : 'text-coral-400'}`}>
                      €{profit.toFixed(2)}
                    </div>
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-between items-center pt-3 border-t border-mkt-800 font-mono text-sm">
              <span className="text-mkt-500">Gesamtüberschuss Runde {lastResult.round}</span>
              <span className="text-lemon-400 font-bold">€{lastResult.totalSurplus.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-mkt-600 text-xs pt-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-600 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-600" />
              </span>
              {isLastRound ? 'Spiel endet…' : 'Warte auf nächste Runde…'}
            </div>
          </div>
        )}

        {/* ── GAME END ──────────────────────────────── */}
        {session.phase === 'game-end' && (
          <div className="space-y-5 animate-fade-up">
            <div>
              <h2 className="font-display font-bold text-lemon-400"
                  style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)' }}>
                Alle Ergebnisse
              </h2>
            </div>
            <div className="panel p-6">
              <ProfitTable results={session.results} sellers={sellers} buyers={session.players.filter((p: Player) => p.role === 'buyer')} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
