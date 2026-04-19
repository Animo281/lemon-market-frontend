import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicSession } from '../../../shared/types'
import { sellerCost } from '../../../shared/constants'
import { api } from '../api/client'
import { storage } from '../lib/storage'
import SessionCodeDisplay from '../components/SessionCodeDisplay'
import PlayerList from '../components/PlayerList'
import PhaseIndicator from '../components/PhaseIndicator'
import MarketBoard from '../components/MarketBoard'
import SupplyDemandGraph from '../components/SupplyDemandGraph'
import ProfitTable from '../components/ProfitTable'
import GameEndStats from '../components/GameEndStats'
import Podium from '../components/Podium'
import InfoModeCompare from '../components/InfoModeCompare'

export default function AdminView() {
  const { code } = useParams<{ code: string }>()
  const navigate  = useNavigate()
  const [session, setSession] = useState<PublicSession | null>(null)
  const [error, setError]     = useState('')

  const adminToken = code ? storage.getAdminToken(code) : null

  useEffect(() => {
    if (!code) return
    if (!adminToken) { navigate('/'); return }
    const load = async () => {
      try {
        const s = await api.getSession(code)
        setSession(s)
      } catch {
        setError('Session nicht gefunden')
      }
    }
    load()
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [code, adminToken])

  if (!code || !adminToken) return null
  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-coral-400 font-mono">{error}</div>
  )
  if (!session) return (
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

  const sellers    = session.players.filter(p => p.role === 'seller')
  const buyers     = session.players.filter(p => p.role === 'buyer')
  const lastResult = session.results[session.results.length - 1]
  const isLastRound = session.currentRound >= session.totalRounds

  const handleStart = async () => {
    try {
      const s = await api.startGame(code, adminToken)
      setSession(s)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleNextRound = async () => {
    try {
      const s = await api.nextRound(code, adminToken)
      setSession(s)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  const handleToggleInfoMode = async () => {
    try {
      const s = await api.toggleInfoMode(code, adminToken)
      setSession(s)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Fehler')
    }
  }

  return (
    <div className="min-h-screen bg-mkt-950 p-3 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Header ────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <div className="label mb-1">Market for Lemons · Admin</div>
            <h1 className="font-display text-3xl font-bold text-gold-500">Admin-Panel</h1>
          </div>
          {session.phase !== 'lobby' && session.phase !== 'game-end' && (
            <PhaseIndicator round={session.currentRound} total={session.totalRounds} infoMode={session.infoMode} />
          )}
        </div>

        {/* Round progress dots */}
        {session.phase !== 'lobby' && session.phase !== 'game-end' && (
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: session.totalRounds }, (_, i) => {
              const roundNum = i + 1
              const isDone   = roundNum < session.currentRound
              const isCurrent = roundNum === session.currentRound
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    isCurrent ? 'bg-gold-500/15 border border-gold-500/40 text-gold-400' :
                    isDone    ? 'bg-mkt-850 border border-mkt-800 text-mkt-400' :
                                'border border-mkt-800/50 text-mkt-700'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isCurrent ? 'bg-gold-500' :
                      isDone    ? 'bg-mkt-500' :
                                  'bg-mkt-700'
                    }`} />
                    {roundNum}
                  </div>
                  {i < session.totalRounds - 1 && (
                    <div className={`w-4 h-px ${isDone ? 'bg-mkt-600' : 'bg-mkt-800'}`} />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {error && <div className="text-coral-400 text-xs font-mono">{error}</div>}

        {/* ── LOBBY ─────────────────────────────────── */}
        {session.phase === 'lobby' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-up">
            <div className="md:col-span-2 space-y-4">
              <SessionCodeDisplay code={code} />
              <button
                onClick={handleStart}
                disabled={sellers.length === 0 || buyers.length === 0}
                className="btn-primary w-full text-base"
              >
                Spiel starten →
              </button>
              {(sellers.length === 0 || buyers.length === 0) && (
                <p className="text-mkt-600 text-xs text-center font-mono">
                  Mindestens 1 Verkäufer + 1 Käufer erforderlich
                </p>
              )}
            </div>
            <div className="md:col-span-3">
              <PlayerList session={session} />
            </div>
          </div>
        )}

        {/* ── SELLER INPUT ──────────────────────────── */}
        {session.phase === 'seller-input' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-up">
            <div className="md:col-span-3 panel p-6">
              <div className="label mb-4">Verkäufer-Entscheidungen</div>
              <div className="space-y-2">
                {sellers.sort((a, b) => a.slotIndex - b.slotIndex).map(s => {
                  const done = s.id in session.currentSellerDecisions
                  return (
                    <div key={s.id} className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors ${
                      done ? 'bg-lime-500/8 border border-lime-500/20' : 'bg-mkt-850 border border-mkt-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${done ? 'bg-lime-400' : 'bg-mkt-700'}`} />
                      {done && (
                        <span className="text-[9px] uppercase tracking-widest text-lime-500 border border-lime-500/25 rounded px-1.5 py-0.5">
                          ✓
                        </span>
                      )}
                      {!done && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="dot-ping absolute inline-flex h-full w-full rounded-full bg-mkt-500 opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mkt-500" />
                        </span>
                      )}
                      <span className={`font-mono text-sm ${done ? 'text-lime-300' : 'text-mkt-400'}`}>
                        {s.name}
                      </span>
                      {done && (
                        <span className="ml-auto text-xs font-mono text-lime-500">abgegeben</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="md:col-span-2">
              <PlayerList session={session} />
            </div>
          </div>
        )}

        {/* ── MARKET ────────────────────────────────── */}
        {session.phase === 'market' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-up">
            <div className="md:col-span-3 space-y-4">
              <MarketBoard
                sellers={sellers}
                decisions={session.currentSellerDecisions}
                infoMode={session.infoMode}
                maxSellerUnits={session.maxSellerUnits}
              />
              {/* Buyer status grid */}
              <div className="panel p-5">
                <div className="label mb-3">Käufer-Status</div>
                <div className="grid grid-cols-2 gap-2">
                  {buyers.map(b => {
                    const done = b.id in session.currentBuyerDecisions
                    return (
                      <div key={b.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
                        done ? 'bg-lime-500/8 border-lime-500/20' : 'bg-mkt-850 border-mkt-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${done ? 'bg-lime-400' : 'bg-mkt-700'}`} />
                        <span className={`font-mono text-sm truncate ${done ? 'text-lime-300' : 'text-mkt-400'}`}>
                          {b.name}
                        </span>
                        {done && <span className="ml-auto text-[9px] text-lime-500 uppercase tracking-widest">✓</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <SupplyDemandGraph session={session} />
            </div>
          </div>
        )}

        {/* ── ROUND END ─────────────────────────────── */}
        {session.phase === 'round-end' && lastResult && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 animate-fade-up">
            <div className="md:col-span-3 panel p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-mkt-800 pb-4">
                <h2 className="font-bold text-mkt-100">Runde {lastResult.round} — Ergebnisse</h2>
                <span className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                  lastResult.infoMode === 'full'
                    ? 'border-lime-500/30 bg-lime-500/10 text-lime-400'
                    : 'border-coral-500/30 bg-coral-500/10 text-coral-400'
                }`}>
                  {lastResult.infoMode === 'full' ? 'Volle Info' : 'Asymm. Info'}
                </span>
              </div>

              <div className="overflow-x-auto"><table className="w-full text-xs font-mono">
                <thead>
                  <tr className="border-b border-mkt-800">
                    <th className="label text-left py-2 pr-4">Spieler</th>
                    <th className="label text-left py-2 pr-4">Q</th>
                    <th className="label text-left py-2 pr-4">Preis</th>
                    <th className="label text-left py-2">Einh.</th>
                    <th className="label text-left py-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {lastResult.sellerDecisions.map(sd => {
                    const s = sellers.find(p => p.id === sd.playerId)
                    const profit = Array.from({ length: sd.unitsSold }, (_, i) =>
                      sd.price - sellerCost(sd.grade, i)
                    ).reduce((a, b) => a + b, 0)
                    return (
                      <tr key={sd.playerId} className="border-b border-mkt-800/40">
                        <td className="py-2.5 pr-4 text-gold-400 font-bold">{s?.name}</td>
                        <td className="py-2.5 pr-4 text-mkt-300">Q{sd.grade}</td>
                        <td className="py-2.5 pr-4 text-mkt-200">€{sd.price.toFixed(2)}</td>
                        <td className="py-2.5 text-mkt-300">{sd.unitsSold}</td>
                        <td className={`py-2.5 font-bold ${profit >= 0 ? 'text-lime-400' : 'text-coral-400'}`}>
                          €{profit.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                  {lastResult.buyerDecisions.map(bd => {
                    const b      = buyers.find(p => p.id === bd.playerId)
                    const sellerP = sellers.find(p => p.id === bd.sellerId)
                    return (
                      <tr key={bd.playerId} className="border-b border-mkt-800/40">
                        <td className="py-2.5 pr-4 text-ice-400 font-bold">{b?.name}</td>
                        <td className="py-2.5 pr-4 text-mkt-300">{bd.grade ? `Q${bd.grade}` : '—'}</td>
                        <td className="py-2.5 pr-4 text-mkt-200">
                          {bd.price != null ? `€${bd.price.toFixed(2)}` : sellerP ? '—' : 'Kein Kauf'}
                        </td>
                        <td className="py-2.5 text-mkt-600">—</td>
                        <td className={`py-2.5 font-bold ${bd.earnings >= 0 ? 'text-lime-400' : 'text-coral-400'}`}>
                          €{bd.earnings.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table></div>

              <div className="flex items-center justify-between pt-2 border-t border-mkt-800 font-mono text-sm">
                <span className="text-mkt-500">Gesamtüberschuss</span>
                <span className="text-gold-500 font-bold text-lg">€{lastResult.totalSurplus.toFixed(2)}</span>
              </div>

              {session.infoMode === 'full' && (
                <button
                  onClick={handleToggleInfoMode}
                  className="w-full mt-2 px-4 py-2.5 rounded-xl border font-mono text-sm font-bold transition-all bg-mkt-850 border-mkt-700 text-mkt-300 hover:border-coral-500/50 hover:text-coral-300 hover:bg-coral-500/10"
                >
                  Qualität ausblenden (Asymm. Info) →
                </button>
              )}
              {session.infoMode === 'asymmetric' && (
                <div className="w-full mt-2 px-4 py-2.5 rounded-xl border font-mono text-sm font-bold bg-coral-500/10 border-coral-500/40 text-coral-300 text-center">
                  ✓ Qualität dauerhaft ausgeblendet
                </div>
              )}
              <button
                onClick={handleNextRound}
                className="btn-primary w-full mt-2"
              >
                {isLastRound ? 'Ergebnisse anzeigen →' : 'Nächste Runde →'}
              </button>
            </div>

            <div className="md:col-span-2">
              <SupplyDemandGraph session={session} historyResult={lastResult} />
            </div>
          </div>
        )}

        {/* ── GAME END ──────────────────────────────── */}
        {session.phase === 'game-end' && (
          <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <div className="label mb-1.5">Spielende · {session.totalRounds} Runden</div>
                <h2 className="font-display text-4xl font-bold text-gold-500">Alle Ergebnisse</h2>
              </div>
              <button
                onClick={() => { storage.clear(code); navigate('/') }}
                className="btn-secondary"
              >
                ← Neue Session
              </button>
            </div>

            {/* Hero stats */}
            <GameEndStats
              results={session.results}
              sellers={sellers}
              buyers={buyers}
              maxSellerUnits={session.maxSellerUnits}
            />

            {/* Podium + Info compare */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
              <div className="md:col-span-2">
                <Podium sellers={sellers} buyers={buyers} results={session.results} />
              </div>
              <div className="md:col-span-3">
                <InfoModeCompare results={session.results} />
              </div>
            </div>

            {/* Per-round graphs */}
            <div>
              <div className="label mb-3">Marktverlauf je Runde</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {session.results.map(r => (
                  <div key={r.round}>
                    <div className="label mb-2">
                      Runde {r.round} ·
                      <span className={r.infoMode === 'full' ? ' text-lime-400' : ' text-coral-400'}>
                        {' '}{r.infoMode === 'full' ? 'Volle Info' : 'Asymm. Info'}
                      </span>
                    </div>
                    <SupplyDemandGraph session={session} historyResult={r} />
                  </div>
                ))}
              </div>
            </div>

            {/* Detailed profit table */}
            <div>
              <div className="label mb-3">Detaillierte Ergebnisse</div>
              <div className="panel p-6">
                <ProfitTable results={session.results} sellers={sellers} buyers={buyers} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
