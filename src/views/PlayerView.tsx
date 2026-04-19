import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicSession, Player, Grade, SellerDecision, BuyerDecision } from '../shared/types'
import { sellerCost, BUYER_VALUES } from '../shared/constants'
import { api } from '../api/client'
import { storage } from '../lib/storage'
import PhaseIndicator from '../components/PhaseIndicator'
import MarketBoard from '../components/MarketBoard'
import ProfitTable from '../components/ProfitTable'

export default function PlayerView() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<PublicSession | null>(null)
  const [me, setMe] = useState<Player | null>(null)
  const [sellerGrade, setSellerGrade] = useState<Grade | null>(null)
  const [sellerPrice, setSellerPrice] = useState('')
  const [sellerUnits, setSellerUnits] = useState(2)
  const [error, setError] = useState('')

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
        const s = await api.getSession(code)
        setSession(s)
        const found = s.players.find((p: Player) => p.id === playerId)
        if (found) setMe(found)
      } catch {
        setError('Session nicht gefunden')
      }
    }
    load()
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [code, playerToken, playerId])

  if (!code || !playerToken) return null
  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-coral-400 font-mono">{error}</div>
  )
  if (!session || !me) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-mkt-400 text-sm font-mono">
        <span className="relative flex h-2 w-2">
          <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-mkt-400" />
        </span>
        Lade…
      </div>
    </div>
  )

  const sellers = session.players.filter((p: Player) => p.role === 'seller')
  const buyers  = session.players.filter((p: Player) => p.role === 'buyer')
  const isSeller = me.role === 'seller'
  const isBuyer  = me.role === 'buyer'

  const myDecision           = session.currentSellerDecisions[me.id]
  const lastResult           = session.results[session.results.length - 1]
  const myLastSellerResult   = lastResult?.sellerDecisions.find((s: SellerDecision) => s.playerId === me.id)
  const myLastBuyerResult    = lastResult?.buyerDecisions.find((b: BuyerDecision) => b.playerId === me.id)
  const isMyTurn             = isBuyer && !(me.id in session.currentBuyerDecisions)
  const hasDecided           = isBuyer && me.id in session.currentBuyerDecisions
  const isLastRound          = session.currentRound >= session.totalRounds
  const maxUnits             = session.maxSellerUnits

  const availableSellers = sellers.filter((s: Player) => {
    const d = session.currentSellerDecisions[s.id]
    return d?.price !== undefined && (d.unitsSold ?? 0) < (d.unitsOffered ?? maxUnits)
  })

  const handleSellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sellerGrade || !sellerPrice || !playerToken) return
    const price = parseFloat(sellerPrice)
    if (isNaN(price) || price <= 0) return
    try {
      const s = await api.sellerDecision(code, playerToken, sellerGrade, price, sellerUnits)
      setSession(s)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleBuy = async (sellerId: string | null) => {
    if (!playerToken) return
    try {
      const s = await api.buyerDecision(code, playerToken, sellerId)
      setSession(s)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const GRADE_INFO: Record<Grade, { label: string; color: string; ring: string }> = {
    1: { label: 'Q1 — Niedrig', color: 'text-coral-400 border-coral-500/50 bg-coral-500/10',
         ring: 'border-coral-500 bg-coral-500/20' },
    2: { label: 'Q2 — Mittel',  color: 'text-gold-500 border-gold-500/50 bg-gold-500/10',
         ring: 'border-gold-500 bg-gold-500/20' },
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
    <div className="min-h-screen bg-mkt-950 p-3 md:p-5">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <div className="label mb-1">
              Session&nbsp;
              <span className="font-mono text-gold-500 tracking-widest">{code}</span>
            </div>
            <h1 className="text-xl font-bold text-mkt-100">
              {me.name}&ensp;
              <span className={isSeller ? 'text-gold-500' : 'text-ice-500'}>
                {isSeller ? 'Verkäufer' : 'Käufer'}
              </span>
            </h1>
          </div>
          {session.phase !== 'lobby' && session.phase !== 'game-end' && (
            <PhaseIndicator round={session.currentRound} total={session.totalRounds} infoMode={session.infoMode} />
          )}
        </div>

        {error && <div className="text-coral-400 text-xs font-mono">{error}</div>}

        {/* ── LOBBY ─────────────────────────────────── */}
        {session.phase === 'lobby' && (
          <div className="panel p-10 text-center animate-fade-in">
            <div className="w-12 h-12 rounded-full border border-mkt-700 flex items-center justify-center mx-auto mb-5">
              <span className="relative flex h-3 w-3">
                <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-mkt-400" />
              </span>
            </div>
            <div className="font-bold text-mkt-100 text-lg mb-2">Warte auf Spielstart</div>
            <div className="text-mkt-500 text-sm mb-6">Der Dozent startet das Spiel gleich.</div>
            <div className={`inline-flex items-center gap-2 text-sm font-mono px-4 py-2 rounded-xl border ${
              isSeller
                ? 'border-gold-500/30 bg-gold-500/8 text-gold-400'
                : 'border-ice-500/30 bg-ice-500/8 text-ice-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSeller ? 'bg-gold-500' : 'bg-ice-500'}`} />
              {isSeller ? `Verkäufer ${me.slotIndex + 1}` : `Käufer ${me.slotIndex + 1}`}
            </div>
          </div>
        )}

        {/* ── SELLER INPUT — form ────────────────────── */}
        {session.phase === 'seller-input' && isSeller && !myDecision && (
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
                            ? 'bg-violet-400/15 border-violet-400/50 text-violet-300'
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
                  type="number" step="0.10" min="0" value={sellerPrice}
                  onChange={e => setSellerPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-mkt-850 border border-mkt-800 rounded-xl pl-9 pr-4 py-3.5 font-mono text-gold-500 font-bold text-2xl focus:outline-none focus:border-gold-500/50 transition-colors placeholder:text-mkt-700"
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
              type="submit" disabled={!sellerGrade || !sellerPrice}
              className="btn-primary w-full text-base"
            >
              Entscheidung abgeben →
            </button>
          </form>
        )}

        {/* SELLER INPUT — waiting */}
        {session.phase === 'seller-input' && isSeller && myDecision && (
          <div className="panel p-10 text-center border-lime-500/25 animate-scale-in">
            <div className="w-12 h-12 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-lime-400 text-xl">✓</span>
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

        {/* SELLER INPUT — buyer waiting */}
        {session.phase === 'seller-input' && isBuyer && (
          <div className="panel p-10 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-2 text-mkt-500 text-sm mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-500" />
              </span>
              Verkäufer entscheiden…
            </div>
            <div className="text-mkt-400 text-sm">Bitte warten</div>
          </div>
        )}

        {/* ── MARKET ────────────────────────────────── */}
        {session.phase === 'market' && (
          <div className="space-y-4 animate-fade-up">
            <MarketBoard sellers={sellers} decisions={session.currentSellerDecisions} infoMode={session.infoMode} maxSellerUnits={maxUnits} />

            {/* Seller status */}
            {isSeller && (
              <div className="panel p-5">
                <div className="label mb-3">Dein Status</div>
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-mkt-500 mb-0.5">Einheiten verkauft</div>
                    <div className="font-mono font-bold text-2xl text-gold-500">
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
            )}

            {/* Buyer turn */}
            {isBuyer && isMyTurn && (
              <div className="panel p-6 border-gold-500/50 my-turn-ring animate-scale-in">
                <div className="text-gold-500 font-bold text-xl mb-4">Du bist dran!</div>

                {availableSellers.length > 0 ? (
                  <div className="space-y-2">
                    {availableSellers.map((seller: Player) => {
                      const d = session.currentSellerDecisions[seller.id]
                      return (
                        <button
                          key={seller.id}
                          onClick={() => handleBuy(seller.id)}
                          className="w-full flex items-center justify-between bg-mkt-850 border border-mkt-700 hover:border-gold-500/50 hover:bg-gold-500/8 rounded-xl px-5 py-3.5 transition-all group"
                        >
                          <span className="text-gold-400 font-bold group-hover:text-gold-300">{seller.name}</span>
                          <div className="flex items-center gap-3 text-sm font-mono">
                            <span className="text-mkt-100 font-bold">€{d?.price?.toFixed(2)}</span>
                            {session.infoMode === 'full' && d?.grade && (
                              <span className={`text-xs px-2 py-0.5 rounded-md border ${
                                d.grade === 1 ? 'text-coral-400 border-coral-500/30 bg-coral-500/10' :
                                d.grade === 2 ? 'text-gold-500 border-gold-500/30 bg-gold-500/10' :
                                'text-lime-400 border-lime-500/30 bg-lime-500/10'
                              }`}>
                                Q{d.grade}
                              </span>
                            )}
                            <span className="text-mkt-500 text-xs">Käuferwert: €{
                              session.infoMode === 'full' && d?.grade
                                ? BUYER_VALUES[d.grade].toFixed(2)
                                : '?'
                            }</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-mkt-500 text-sm mb-3">Keine verfügbaren Angebote.</p>
                )}

                <button
                  onClick={() => handleBuy(null)}
                  className="btn-secondary w-full mt-3 text-sm"
                >
                  Kein Kauf
                </button>
              </div>
            )}

            {/* Buyer already submitted */}
            {isBuyer && hasDecided && (
              <div className="panel p-6 text-center border-lime-500/25 animate-scale-in">
                <div className="w-10 h-10 rounded-full bg-lime-500/10 border border-lime-500/30 flex items-center justify-center mx-auto mb-3">
                  <span className="text-lime-400 text-lg">✓</span>
                </div>
                <div className="font-bold text-mkt-100 mb-1">Entscheidung abgegeben</div>
                <div className="flex items-center justify-center gap-2 text-mkt-600 text-xs mt-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-600 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-600" />
                  </span>
                  Warte auf andere Käufer…
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── ROUND END ─────────────────────────────── */}
        {session.phase === 'round-end' && lastResult && (
          <div className="panel p-6 space-y-5 animate-fade-up">
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

            {isSeller && myLastSellerResult && (() => {
              const profit = Array.from({ length: myLastSellerResult.unitsSold }, (_, i) =>
                myLastSellerResult.price - sellerCost(myLastSellerResult.grade, i)
              ).reduce((a, b) => a + b, 0)
              return (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-mkt-850 rounded-xl p-4">
                    <div className="label mb-1">Qualität</div>
                    <div className="font-mono font-bold text-xl text-mkt-100">Q{myLastSellerResult.grade}</div>
                  </div>
                  <div className="bg-mkt-850 rounded-xl p-4">
                    <div className="label mb-1">Preis</div>
                    <div className="font-mono font-bold text-xl text-gold-500">€{myLastSellerResult.price.toFixed(2)}</div>
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

            {isBuyer && myLastBuyerResult && (
              <div className="space-y-3">
                {myLastBuyerResult.sellerId ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-mkt-850 rounded-xl p-4">
                      <div className="label mb-1">Gekauft bei</div>
                      <div className="font-mono font-bold text-gold-400 text-sm">
                        {sellers.find((s: Player) => s.id === myLastBuyerResult.sellerId)?.name}
                      </div>
                    </div>
                    <div className="bg-mkt-850 rounded-xl p-4">
                      <div className="label mb-1">Qualität</div>
                      <div className="font-mono font-bold text-xl text-mkt-100">Q{myLastBuyerResult.grade}</div>
                    </div>
                    <div className="bg-mkt-850 rounded-xl p-4">
                      <div className="label mb-1">Preis bezahlt</div>
                      <div className="font-mono font-bold text-xl text-gold-500">€{myLastBuyerResult.price?.toFixed(2)}</div>
                    </div>
                    <div className="bg-mkt-850 rounded-xl p-4">
                      <div className="label mb-1">Käuferwert</div>
                      <div className="font-mono font-bold text-xl text-ice-400">
                        €{myLastBuyerResult.grade ? BUYER_VALUES[myLastBuyerResult.grade].toFixed(2) : '—'}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-mkt-850 rounded-xl p-4 text-mkt-500 text-sm font-mono">
                    Kein Kauf in dieser Runde
                  </div>
                )}
                <div className="flex justify-between items-center bg-mkt-850 rounded-xl px-4 py-3 font-mono">
                  <span className="text-mkt-400 text-sm">Dein Gewinn</span>
                  <span className={`font-bold text-xl ${
                    myLastBuyerResult.earnings >= 0 ? 'text-lime-400' : 'text-coral-400'
                  }`}>
                    €{myLastBuyerResult.earnings.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-mkt-800 font-mono text-sm">
              <span className="text-mkt-500">Gesamtüberschuss Runde {lastResult.round}</span>
              <span className="text-gold-500 font-bold">€{lastResult.totalSurplus.toFixed(2)}</span>
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
              <div className="label mb-1.5">Spielende</div>
              <h2 className="font-display text-4xl font-bold text-gold-500">Alle Ergebnisse</h2>
            </div>
            <div className="panel p-6">
              <ProfitTable results={session.results} sellers={sellers} buyers={buyers} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
