import { Fragment, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { storage, sessionIndex } from '../lib/storage'
import {
  DEFAULT_ECONOMICS, DEFAULT_MAX_SELLER_UNITS, DEFAULT_TOTAL_ROUNDS,
  MAX_SELLERS_LIMIT, MAX_BUYERS_LIMIT, MAX_SELLER_UNITS_LIMIT, MAX_ROUNDS_LIMIT,
} from '../shared/constants'
import { EconomicsConfig, Grade } from '../shared/types'
import ErrorBanner from '../components/ErrorBanner'

const GRADES: Grade[] = [1, 2, 3]
const GRADE_LABEL: Record<Grade, string> = { 1: 'Q1 (niedrig)', 2: 'Q2 (mittel)', 3: 'Q3 (hoch)' }
// Same grade→colour mapping as everywhere else quality shows up (quality-q1/q2/q3
// in index.css, QUALITY_LABEL in marketScene.ts) — the config modal was using an
// unrelated ice/lemon-by-column scheme instead of this, DESIGN.md's own canonical
// per-grade language.
const GRADE_COLOR: Record<Grade, string> = { 1: 'text-coral-400', 2: 'text-lemon-400', 3: 'text-lime-400' }

// Deep-clone so editing the modal's working copy never mutates the shared
// DEFAULT_ECONOMICS constant (it's a plain object literal, not frozen).
function cloneEconomics(e: EconomicsConfig): EconomicsConfig {
  return { buyerValues: { ...e.buyerValues }, sellerFirstCosts: { ...e.sellerFirstCosts } }
}

// Mirrors the backend's Zod check (schemas/session.ts): both tables must be
// strictly increasing over grades 1->2->3, or "best quality" stops meaning
// anything everywhere else in the app (crate art, best-grade-first lists,
// the theoreticalMaxSurplus search).
function economicsError(e: EconomicsConfig): string | null {
  const { buyerValues: v, sellerFirstCosts: c } = e
  if (!(v[1] < v[2] && v[2] < v[3])) return 'Käuferwerte müssen mit der Qualität steigen: Q1 < Q2 < Q3.'
  if (!(c[1] < c[2] && c[2] < c[3])) return 'Verkäuferkosten müssen mit der Qualität steigen: Q1 < Q2 < Q3.'
  return null
}

export default function LandingView() {
  const navigate = useNavigate()
  const recentSessions = Object.entries(sessionIndex.getAll())
    .sort((a, b) => b[1].lastJoined.localeCompare(a[1].lastJoined))
    .slice(0, 5)
  const [numSellers, setNumSellers] = useState(3)
  const [numBuyers, setNumBuyers] = useState(4)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [pendingConfig, setPendingConfig] = useState<{ code: string; adminToken: string } | null>(null)
  const [modalMaxUnits, setModalMaxUnits] = useState(DEFAULT_MAX_SELLER_UNITS)
  const [modalRounds, setModalRounds] = useState(DEFAULT_TOTAL_ROUNDS)
  const [modalEconomics, setModalEconomics] = useState<EconomicsConfig>(() => cloneEconomics(DEFAULT_ECONOMICS))
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  const setBuyerValue = (grade: Grade, raw: string) => {
    const v = raw === '' ? 0 : Number(raw)
    setModalEconomics(prev => ({ ...prev, buyerValues: { ...prev.buyerValues, [grade]: v } }))
  }
  const setSellerCost = (grade: Grade, raw: string) => {
    const v = raw === '' ? 0 : Number(raw)
    setModalEconomics(prev => ({ ...prev, sellerFirstCosts: { ...prev.sellerFirstCosts, [grade]: v } }))
  }
  const resetEconomicsToDefault = () => setModalEconomics(cloneEconomics(DEFAULT_ECONOMICS))
  const modalEconomicsError = economicsError(modalEconomics)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    // An emptied number input reads as 0 (Number('') === 0) and the fields
    // have no JS clamp today, so out-of-range values only get caught by the
    // browser's own (unstyled, English) validation bubble. Clamp here too —
    // matches what the settings modal below already does — so a blanked
    // field snaps back into range instead of silently submitting 0.
    const sellers = Math.min(MAX_SELLERS_LIMIT, Math.max(1, numSellers || 1))
    const buyers = Math.min(MAX_BUYERS_LIMIT, Math.max(1, numBuyers || 1))
    if (sellers !== numSellers) setNumSellers(sellers)
    if (buyers !== numBuyers) setNumBuyers(buyers)

    setLoading(true)
    setError('')
    try {
      const { code, adminToken } = await api.createSession(sellers, buyers)
      storage.setAdminToken(code, adminToken)
      setPendingConfig({ code, adminToken })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Session konnte nicht erstellt werden.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSubmit = async () => {
    if (!pendingConfig) return
    if (modalEconomicsError) { setModalError(modalEconomicsError); return }
    setModalLoading(true)
    setModalError('')
    try {
      await api.updateSessionConfig(pendingConfig.code, pendingConfig.adminToken, {
        maxSellerUnits: modalMaxUnits,
        totalRounds: modalRounds,
        economics: modalEconomics,
      })
      navigate(`/admin/${pendingConfig.code}`)
    } catch (err: unknown) {
      // Used to navigate on failure too (in `finally`), so a lecturer had no
      // way to tell a rejected config from an accepted one — the session
      // would silently run with server defaults instead of their settings.
      setModalError(err instanceof Error ? err.message : 'Einstellungen konnten nicht gespeichert werden.')
    } finally {
      setModalLoading(false)
    }
  }

  const handleConfigSkip = () => {
    if (!pendingConfig) return
    navigate(`/admin/${pendingConfig.code}`)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    navigate(`/join/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <div className="min-h-screen graph-bg flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">

      {/* Decorative background: faint supply/demand curves */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none select-none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        {/* Supply — gold, rising */}
        <polyline
          points="0,900 150,750 300,620 450,550 600,480 750,430 900,380 1000,350"
          fill="none"
          stroke="#f0a840"
          strokeWidth="1"
          opacity="0.045"
          vectorEffect="non-scaling-stroke"
        />
        {/* Demand — ice, falling */}
        <polyline
          points="0,180 150,280 300,380 450,480 600,580 750,680 900,760 1000,830"
          fill="none"
          stroke="#48c4ff"
          strokeWidth="1"
          opacity="0.045"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* ── Header ─────────────────────────────── */}
      <div className="text-center mb-14 animate-fade-up relative z-10">
        <h1 className="font-display font-bold text-gold-500 leading-[1.05] mb-4"
            style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)' }}>
          Market for<br />
          <em className="italic">Lemons</em>
        </h1>
        <p className="font-mono text-mkt-500 text-sm tracking-[0.12em]">
          Holt &amp; Sherman (1999) · Klassenexperiment
        </p>
      </div>

      {/* ── Cards ──────────────────────────────── */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">

        {/* Admin card */}
        <form
          onSubmit={handleCreate}
          className="panel p-7 flex flex-col gap-5 animate-fade-up"
          style={{ animationDelay: '0.12s', opacity: 0 }}
        >
          <div>
            <div className="label mb-1.5">Als Dozent</div>
            <h2 className="text-lg font-bold text-mkt-100">Neue Session</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="label">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-500 mr-1.5 align-middle -mt-0.5" />
                Verkäufer
              </span>
              <input
                type="number" min={1} max={MAX_SELLERS_LIMIT} value={numSellers}
                onChange={e => setNumSellers(e.target.value === '' ? 1 : Math.min(MAX_SELLERS_LIMIT, Math.max(1, Number(e.target.value))))}
                className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-gold-500 font-bold text-2xl text-center focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ice-500 mr-1.5 align-middle -mt-0.5" />
                Käufer
              </span>
              <input
                type="number" min={1} max={MAX_BUYERS_LIMIT} value={numBuyers}
                onChange={e => setNumBuyers(e.target.value === '' ? 1 : Math.min(MAX_BUYERS_LIMIT, Math.max(1, Number(e.target.value))))}
                className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-ice-500 font-bold text-2xl text-center focus:outline-none focus:border-ice-500/50 transition-colors"
              />
            </label>
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            type="submit" disabled={loading}
            className="btn-primary w-full mt-auto"
          >
            {loading ? 'Erstelle…' : 'Session erstellen →'}
          </button>
        </form>

        {/* Player card */}
        <form
          onSubmit={handleJoin}
          className="panel p-7 flex flex-col gap-6 animate-fade-up"
          style={{ animationDelay: '0.22s', opacity: 0 }}
        >
          <div>
            <div className="label mb-1.5">Als Spieler</div>
            <h2 className="text-lg font-bold text-mkt-100">Session beitreten</h2>
          </div>

          <label className="flex flex-col gap-1.5 flex-1">
            <span className="label">Session-Code</span>
            <input
              type="text" maxLength={4} value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="XXXX"
              className="bg-mkt-850 border border-mkt-800 rounded-xl px-4 py-4 font-mono text-5xl text-center text-gold-500 font-bold tracking-[0.3em] focus:outline-none focus:border-gold-500/50 placeholder:text-mkt-700 uppercase transition-colors"
            />
          </label>

          <button
            type="submit" disabled={joinCode.length < 4}
            className="btn-secondary w-full mt-auto"
          >
            Beitreten →
          </button>
        </form>
      </div>

      {/* ── Reconnect card ──────────────────────── */}
      {recentSessions.length > 0 && (
        <div
          className="w-full max-w-2xl mt-5 panel p-5 animate-fade-up relative z-10"
          style={{ animationDelay: '0.28s', opacity: 0 }}
        >
          <div className="label mb-3">Frühere Sessions</div>
          <div className="space-y-2">
            {recentSessions.map(([code, entry]) => (
              <div key={code} className="flex items-center justify-between gap-3 py-2 border-b border-mkt-800 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono font-bold text-gold-500 tracking-widest shrink-0">{code}</span>
                  <span className="text-mkt-300 text-sm truncate">{entry.name}</span>
                  <span className="label shrink-0">{entry.role === 'seller' ? 'Verkäufer' : 'Käufer'}</span>
                </div>
                <button
                  className="btn-secondary text-xs px-3 py-1.5 shrink-0"
                  onClick={() => {
                    storage.setPlayerToken(code, entry.playerToken)
                    storage.setPlayerId(code, entry.playerId)
                    navigate(`/play/${code}`)
                  }}
                >
                  Wiederbetreten →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer citation ─────────────────────── */}
      <p
        className="mt-10 text-mkt-500 font-mono text-[10px] text-center animate-fade-up relative z-10"
        style={{ animationDelay: '0.32s', opacity: 0 }}
      >
        Akerlof (1970) · "The Market for 'Lemons': Quality Uncertainty and the Market Mechanism"
      </p>

      {/* ── Config Modal ────────────────────────── */}
      {pendingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mkt-950/80 backdrop-blur-sm px-4">
          <div className="panel p-8 w-full max-w-md flex flex-col gap-5 animate-fade-up">
            <div>
              <div className="label mb-1">Session erstellt · Code <span className="font-mono text-lemon-500 tracking-widest">{pendingConfig.code}</span></div>
              <h2 className="text-lg font-bold text-mkt-100">Spieleinstellungen</h2>
              <p className="text-mkt-500 text-xs font-mono mt-1">Kann später nicht mehr geändert werden.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="label">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-copper-400 mr-1.5 align-middle -mt-0.5" />
                  Max. Einheiten
                </span>
                <input
                  type="number" min={1} max={MAX_SELLER_UNITS_LIMIT} value={modalMaxUnits}
                  onChange={e => setModalMaxUnits(Math.min(MAX_SELLER_UNITS_LIMIT, Math.max(1, Number(e.target.value))))}
                  className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-copper-400 font-bold text-2xl text-center focus:outline-none focus:border-copper-400/50 transition-colors"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-copper-400 mr-1.5 align-middle -mt-0.5" />
                  Anzahl Runden
                </span>
                <input
                  type="number" min={1} max={MAX_ROUNDS_LIMIT} value={modalRounds}
                  onChange={e => setModalRounds(Math.min(MAX_ROUNDS_LIMIT, Math.max(1, Number(e.target.value))))}
                  className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-copper-400 font-bold text-2xl text-center focus:outline-none focus:border-copper-400/50 transition-colors"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="label">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-lemon-500 mr-1.5 align-middle -mt-0.5" />
                  Preise je Qualität
                </span>
                <button
                  type="button"
                  onClick={resetEconomicsToDefault}
                  className="text-mkt-500 text-[10px] font-mono hover:text-mkt-400 transition-colors underline underline-offset-2"
                >
                  Holt &amp; Sherman Standardwerte
                </button>
              </div>
              <div className="grid grid-cols-[auto_1fr_1fr] gap-x-2 gap-y-1.5 items-center">
                <span />
                <span className="label text-center">Käuferwert</span>
                <span className="label text-center">Kosten 1. Einheit</span>
                {GRADES.map(g => (
                  <Fragment key={g}>
                    <span className={`${GRADE_COLOR[g]} text-xs font-mono font-semibold whitespace-nowrap pr-1`}>{GRADE_LABEL[g]}</span>
                    <input
                      type="number" min={0} step="0.10" value={modalEconomics.buyerValues[g]}
                      onChange={e => setBuyerValue(g, e.target.value)}
                      aria-label={`Käuferwert ${GRADE_LABEL[g]}`}
                      className="bg-mkt-850 border border-mkt-800 rounded-lg px-2 py-1.5 font-mono text-mkt-100 text-sm text-center focus:outline-none focus:border-lemon-500/50 transition-colors"
                    />
                    <input
                      type="number" min={0} step="0.10" value={modalEconomics.sellerFirstCosts[g]}
                      onChange={e => setSellerCost(g, e.target.value)}
                      aria-label={`Kosten 1. Einheit ${GRADE_LABEL[g]}`}
                      className="bg-mkt-850 border border-mkt-800 rounded-lg px-2 py-1.5 font-mono text-mkt-100 text-sm text-center focus:outline-none focus:border-lemon-500/50 transition-colors"
                    />
                  </Fragment>
                ))}
              </div>
              <p className="text-mkt-500 text-[10px] font-mono mt-2">Jede weitere Einheit kostet den Verkäufer +1,00 € mehr.</p>
            </div>

            {(modalError || modalEconomicsError) && <ErrorBanner message={modalError || modalEconomicsError || ''} />}

            <button
              onClick={handleConfigSubmit}
              disabled={modalLoading}
              className="btn-primary w-full"
            >
              {modalLoading ? 'Speichere…' : 'Übernehmen →'}
            </button>
            <button
              onClick={handleConfigSkip}
              className="text-mkt-500 text-xs font-mono text-center hover:text-mkt-400 transition-colors"
            >
              Mit Defaults starten (2 Einheiten · 5 Runden · Holt &amp; Sherman Preise)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
