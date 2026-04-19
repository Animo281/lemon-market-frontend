import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { storage } from '../lib/storage'
import { DEFAULT_MAX_SELLER_UNITS, DEFAULT_TOTAL_ROUNDS } from '../shared/constants'

export default function LandingView() {
  const navigate = useNavigate()
  const [numSellers, setNumSellers] = useState(3)
  const [numBuyers, setNumBuyers] = useState(4)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [pendingConfig, setPendingConfig] = useState<{ code: string; adminToken: string } | null>(null)
  const [modalMaxUnits, setModalMaxUnits] = useState(DEFAULT_MAX_SELLER_UNITS)
  const [modalRounds, setModalRounds] = useState(DEFAULT_TOTAL_ROUNDS)
  const [modalLoading, setModalLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { code, adminToken } = await api.createSession(numSellers, numBuyers)
      storage.setAdminToken(code, adminToken)
      setPendingConfig({ code, adminToken })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Fehler')
    } finally {
      setLoading(false)
    }
  }

  const handleConfigSubmit = async () => {
    if (!pendingConfig) return
    setModalLoading(true)
    try {
      await api.updateSessionConfig(pendingConfig.code, pendingConfig.adminToken, {
        maxSellerUnits: modalMaxUnits,
        totalRounds: modalRounds,
      })
    } catch {
      // silently ignore — defaults stay on server
    } finally {
      navigate(`/admin/${pendingConfig.code}`)
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
        preserveAspectRatio="none"
      >
        {/* Supply — gold, rising */}
        <polyline
          points="0,90% 15%,75% 30%,62% 45%,55% 60%,48% 75%,43% 90%,38% 100%,35%"
          fill="none"
          stroke="#f0a840"
          strokeWidth="1"
          opacity="0.045"
          vectorEffect="non-scaling-stroke"
        />
        {/* Demand — ice, falling */}
        <polyline
          points="0,18% 15%,28% 30%,38% 45%,48% 60%,58% 75%,68% 90%,76% 100%,83%"
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
                type="number" min={1} max={6} value={numSellers}
                onChange={e => setNumSellers(Number(e.target.value))}
                className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-gold-500 font-bold text-2xl text-center focus:outline-none focus:border-gold-500/50 transition-colors"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="label">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ice-500 mr-1.5 align-middle -mt-0.5" />
                Käufer
              </span>
              <input
                type="number" min={1} max={10} value={numBuyers}
                onChange={e => setNumBuyers(Number(e.target.value))}
                className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-ice-500 font-bold text-2xl text-center focus:outline-none focus:border-ice-500/50 transition-colors"
              />
            </label>
          </div>

          {error && <p className="text-coral-400 text-xs font-mono -mt-2">{error}</p>}

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

      {/* ── Footer citation ─────────────────────── */}
      <p
        className="mt-10 text-mkt-700 font-mono text-[10px] text-center animate-fade-up relative z-10"
        style={{ animationDelay: '0.32s', opacity: 0 }}
      >
        Akerlof (1970) · "The Market for 'Lemons': Quality Uncertainty and the Market Mechanism"
      </p>

      {/* ── Config Modal ────────────────────────── */}
      {pendingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-mkt-950/80 backdrop-blur-sm px-4">
          <div className="panel p-8 w-full max-w-sm flex flex-col gap-5 animate-fade-up">
            <div>
              <div className="label mb-1">Session erstellt · Code <span className="font-mono text-gold-500 tracking-widest">{pendingConfig.code}</span></div>
              <h2 className="text-lg font-bold text-mkt-100">Spieleinstellungen</h2>
              <p className="text-mkt-500 text-xs font-mono mt-1">Kann später nicht mehr geändert werden.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="label">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 mr-1.5 align-middle -mt-0.5" />
                  Max. Einheiten
                </span>
                <input
                  type="number" min={1} max={5} value={modalMaxUnits}
                  onChange={e => setModalMaxUnits(Math.min(5, Math.max(1, Number(e.target.value))))}
                  className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-violet-400 font-bold text-2xl text-center focus:outline-none focus:border-violet-400/50 transition-colors"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="label">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gold-500 mr-1.5 align-middle -mt-0.5" />
                  Anzahl Runden
                </span>
                <input
                  type="number" min={1} max={20} value={modalRounds}
                  onChange={e => setModalRounds(Math.min(20, Math.max(1, Number(e.target.value))))}
                  className="bg-mkt-850 border border-mkt-800 rounded-xl px-3 py-3 font-mono text-gold-500 font-bold text-2xl text-center focus:outline-none focus:border-gold-500/50 transition-colors"
                />
              </label>
            </div>

            <button
              onClick={handleConfigSubmit}
              disabled={modalLoading}
              className="btn-primary w-full"
            >
              {modalLoading ? 'Speichere…' : 'Übernehmen →'}
            </button>
            <button
              onClick={handleConfigSkip}
              className="text-mkt-600 text-xs font-mono text-center hover:text-mkt-400 transition-colors"
            >
              Mit Defaults starten (2 Einheiten · 5 Runden)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
