import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PublicSession, Player } from '../shared/types'
import { api, ApiError } from '../api/client'
import { storage, sessionIndex } from '../lib/storage'
import LoadingScreen from '../components/LoadingScreen'
import BuyerView from './BuyerView'
import SellerView from './SellerView'
import HowToPlayModal from '../components/HowToPlayModal'

const HOWTO_PREFIX = 'lemons:howto-seen:'

export default function PlayerView() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [session, setSession] = useState<PublicSession | null>(null)
  const [me, setMe] = useState<Player | null>(null)
  const [error, setError] = useState('')
  const [kicked, setKicked] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const hasShownHowTo = useRef(false)
  const hasLoadedOnce = useRef(false)

  // A closed tab or a backgrounded phone can wipe sessionStorage — before
  // giving up, try re-seeding it from the localStorage index (same data the
  // landing page's "Frühere Sessions" card uses) so a reopened link/tab just
  // works instead of stranding the player on the landing page.
  if (code && !storage.getPlayerToken(code)) storage.restore(code)
  const playerToken = code ? storage.getPlayerToken(code) : null
  const playerId    = code ? storage.getPlayerId(code)    : null

  useEffect(() => {
    if (!code || !playerToken) { navigate('/'); return }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    // Buyer turn order is now enforced server-side (backend README, "Buyer
    // shopping order") — a buyer whose turn just started only finds out on
    // the next poll, so the open market gets a tighter cadence to keep that
    // wait short. Every other phase keeps the normal 3s interval. (Lowered
    // from 1s/2s for the 30-player classroom run — at that headcount the
    // old cadence risked the Cloudflare daily request cap.)
    let lastPhase: PublicSession['phase'] | undefined
    const load = async () => {
      try {
        const s = await api.getSession(code, playerToken)
        if (cancelled) return
        setSession(s)
        setError('')
        lastPhase = s.phase
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
          sessionIndex.remove(code)
        }
        hasLoadedOnce.current = true
      } catch (err: unknown) {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 403) {
          setKicked(true)
          sessionIndex.remove(code)
        } else if (!hasLoadedOnce.current) {
          setError(err instanceof ApiError ? err.message : 'Session nicht gefunden.')
        }
        // else: transient poll failure after a successful load — keep
        // showing the last good state instead of blanking the screen.
      }
      // Don't poll while the tab is hidden (backgrounded/phone locked) —
      // onVisibility below fires an immediate load() on return instead.
      if (!cancelled && !document.hidden) timer = setTimeout(load, lastPhase === 'market' ? 1500 : 3000)
    }
    const onVisibility = () => {
      if (!document.hidden) { clearTimeout(timer); load() }
    }
    document.addEventListener('visibilitychange', onVisibility)
    load()
    return () => {
      cancelled = true
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [code, playerToken, playerId])

  // Show the role-specific "how to play" explainer once, the first time a
  // player reaches the lobby — not on every reconnect/poll. Dismissal is
  // remembered in localStorage (device-wide, not per session) so a returning
  // player on the same device doesn't see it again; the "?" button below
  // always lets them reopen it on demand.
  useEffect(() => {
    if (hasShownHowTo.current || !me || session?.phase !== 'lobby') return
    if (!localStorage.getItem(HOWTO_PREFIX + me.role)) {
      setShowHowTo(true)
      hasShownHowTo.current = true
    }
  }, [me, session?.phase])

  const closeHowTo = () => {
    if (me) localStorage.setItem(HOWTO_PREFIX + me.role, '1')
    setShowHowTo(false)
  }

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

  if (!session || !me) return <LoadingScreen />

  // Both roles get their own "Abendmarkt" world across every phase — see
  // docs/lemon-market-ui/HANDOFF.md / HANDOFF-verkaeufer.md and the plan.
  // Admin and landing keep the existing Nacht-Markt design untouched.
  const RoleView = me.role === 'buyer' ? BuyerView : SellerView
  return (
    <>
      <RoleView
        session={session}
        me={me}
        code={code}
        playerToken={playerToken}
        error={error}
        onSessionUpdate={setSession}
        onError={setError}
      />
      {/* Same fixed-corner pattern as ThemeToggle.tsx (top-4 right-4) —
          mirrored to the left edge so the two never collide. Reopens the
          mechanics explainer on demand; it already auto-opens once per
          role/device on first lobby visit (see the effect above). */}
      <button
        onClick={() => setShowHowTo(true)}
        className="fixed top-4 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl bg-mkt-850 border border-mkt-800 text-mkt-400 hover:text-mkt-100 hover:border-mkt-600 transition-all font-bold"
        aria-label="Wie funktioniert's?"
        title="Wie funktioniert's?"
      >
        ?
      </button>
      {showHowTo && <HowToPlayModal role={me.role} onClose={closeHowTo} />}
    </>
  )
}
