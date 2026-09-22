import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicSession, Player } from '../shared/types'
import { api, ApiError } from '../api/client'
import { storage, sessionIndex } from '../lib/storage'
import BuyerView from './BuyerView'
import SellerView from './SellerView'

export default function PlayerView() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<PublicSession | null>(null)
  const [me, setMe] = useState<Player | null>(null)
  const [error, setError] = useState('')
  const [kicked, setKicked] = useState(false)
  const hasLoadedOnce = useRef(false)

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

  // Both roles get their own "Abendmarkt" world across every phase — see
  // docs/lemon-market-ui/HANDOFF.md / HANDOFF-verkaeufer.md and the plan.
  // Admin and landing keep the existing Nacht-Markt design untouched.
  const RoleView = me.role === 'buyer' ? BuyerView : SellerView
  return (
    <RoleView
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
